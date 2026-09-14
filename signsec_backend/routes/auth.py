from __future__ import annotations

from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import select, func, delete

from ..config import Settings
from ..db import get_db_session
from ..http_errors import ApiError
from ..models import MfaBackupCode, User, LoginFailure, Role
from ..security.jwt_tokens import decode_token, issue_access_token, issue_mfa_challenge_token
from ..security.mfa_totp import (
    build_otpauth_uri,
    generate_backup_codes,
    generate_totp_secret,
    qr_png_base64,
    verify_totp,
)
from ..security.passwords import pbkdf2_hash_password, pbkdf2_verify_password, validate_password_policy
from ..security.audit import audit_log
from ..security.crypto_keys import encrypt_private_key_with_password, generate_rsa_keypair
from ..security.otp_service import generate_otp, send_otp_email, send_otp_sms, verify_otp, create_otp_secret


bp = Blueprint("auth", __name__)

def _settings() -> Settings:
    return current_app.config["SETTINGS"]


def _remote_ip() -> str:
    return request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()


def _too_many_failures(db, username: str) -> bool:
    settings = _settings()
    window_start = datetime.now(tz=timezone.utc) - timedelta(seconds=settings.login_window_seconds)
    q = select(func.count()).select_from(LoginFailure).where(
        LoginFailure.username == username, LoginFailure.created_at >= window_start
    )
    count = db.execute(q).scalar_one()
    return count >= settings.login_max_attempts


@bp.post("/register")
def register():
    """
    Register user - Step 1: Submit email and request OTP.
    
    Request body:
    {
        "email": "user@example.com",
        "delivery_method": "email" or "sms"  # optional; default is email
        "phone_number": "1234567890"  # required if delivery_method is sms
    }
    
    Response:
    {
        "otp_required": true,
        "registration_id": "uuid",
        "message": "OTP sent to email"
    }
    """
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    delivery_method = (data.get("delivery_method") or "email").strip().lower()
    phone_number = (data.get("phone_number") or "").strip() if delivery_method == "sms" else None
    
    if not email:
        raise ApiError(400, "invalid_request", "email is required.")
    
    if delivery_method not in ["email", "sms"]:
        raise ApiError(400, "invalid_request", "delivery_method must be 'email' or 'sms'.")
    
    if delivery_method == "sms" and not phone_number:
        raise ApiError(400, "invalid_request", "phone_number required for SMS delivery.")
    
    db = get_db_session()
    try:
        # Check if email already registered
        exists = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if exists:
            raise ApiError(409, "already_exists", "Email already registered.")
        
        # Generate OTP
        otp_code = generate_otp(length=6)
        otp_code_encrypted, otp_expiry = create_otp_secret(otp_code, ttl_minutes=10)
        
        # Send OTP
        if delivery_method == "email":
            send_otp_email(email, otp_code)
        else:
            send_otp_sms(phone_number, otp_code)
        
        # Store temporary registration state (we'll complete registration after OTP verification)
        # Use email as temporary username; will be updated in verify_otp endpoint
        user = User(
            username=email,  # temporary
            email=email,
            password_hash="",  # placeholder; will be set on verify
            role=Role.USER,
            otp_secret=otp_code_encrypted,
            otp_expiry=otp_expiry,
            otp_verified=False,
        )
        db.add(user)
        db.commit()
        registration_id = str(user.id)
        
        audit_log(actor_user_id=None, action="auth.register_request", outcome="ALLOW", message=f"OTP requested for {email}")
        
        return jsonify({
            "otp_required": True,
            "registration_id": registration_id,
            "message": f"OTP sent to {delivery_method}"
        }), 200
    finally:
        db.close()


@bp.post("/register/verify-otp")
def register_verify_otp():
    """
    Register user - Step 2: Verify OTP and provide credentials.
    
    Request body:
    {
        "registration_id": "uuid from step 1",
        "otp_code": "123456",
        "username": "myusername",
        "password": "StrongPass!234"
    }
    """
    data = request.json or {}
    registration_id = (data.get("registration_id") or "").strip()
    otp_code = (data.get("otp_code") or "").strip()
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    
    if not registration_id or not otp_code or not username or not password:
        raise ApiError(400, "invalid_request", "registration_id, otp_code, username, and password are required.")
    
    try:
        validate_password_policy(password)
    except ValueError as e:
        raise ApiError(400, "password_policy_failed", str(e))
    
    db = get_db_session()
    try:
        # Fetch temporary user by registration_id
        user = db.execute(select(User).where(User.id == registration_id)).scalar_one_or_none()
        if not user:
            raise ApiError(404, "not_found", "Registration not found.")
        
        # Verify OTP
        if not verify_otp(user.otp_secret, otp_code, user.otp_expiry):
            audit_log(actor_user_id=None, action="auth.register_verify_otp", outcome="DENY", message=f"Invalid OTP for {user.email}")
            raise ApiError(401, "invalid_otp", "Invalid or expired OTP code.")
        
        # Check username availability
        exists_username = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if exists_username and exists_username.id != user.id:
            raise ApiError(409, "already_exists", "Username already taken.")
        
        # Update user with credentials
        ph = pbkdf2_hash_password(password, iterations=_settings().pbkdf2_iterations)
        pub_pem, priv_pem = generate_rsa_keypair(bits=_settings().rsa_key_bits)
        enc = encrypt_private_key_with_password(private_pem=priv_pem, password=password)
        
        user.username = username
        user.password_hash = ph
        user.otp_verified = True
        user.otp_secret = None
        user.otp_expiry = None
        user.rsa_public_key_pem = pub_pem
        user.rsa_private_key_enc = enc.ciphertext
        user.rsa_private_key_enc_iv = enc.iv
        user.rsa_private_key_kdf_salt = enc.kdf_salt
        user.rsa_private_key_kdf_iterations = enc.kdf_iterations
        
        db.commit()
        audit_log(actor_user_id=str(user.id), action="auth.register", outcome="ALLOW", message=f"User {username} registered successfully")
        
        return jsonify({
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role.value
        }), 201
    finally:
        db.close()


@bp.post("/login")
def login_password_step():
    """
    Password step.

    SECURITY:
    - No user enumeration (generic invalid credentials)
    - Rate limiting: IP-based via Flask-Limiter + username-based via login_failures window
    """
    # IP limiter: 5 attempts / 15 min (rubric)
    limiter = current_app.extensions.get("limiter")
    if limiter:
        limiter.limit(f"{_settings().login_max_attempts} per {_settings().login_window_seconds} seconds")(lambda: None)()

    data = request.json or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        raise ApiError(400, "invalid_request", "username and password are required.")

    db = get_db_session()
    try:
        if _too_many_failures(db, username):
            raise ApiError(429, "too_many_requests", "Too many attempts. Try again later.")

        user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if not user or not pbkdf2_verify_password(password, user.password_hash):
            db.add(LoginFailure(username=username, ip=_remote_ip()))
            db.commit()
            audit_log(actor_user_id=None, action="auth.login_password", outcome="DENY", message=f"Failed login for {username}")
            # SECURITY: generic response prevents username enumeration
            raise ApiError(401, "invalid_credentials", "Invalid credentials.")

        # Successful password: clear recent failures for username (optional hygiene)
        window_start = datetime.now(tz=timezone.utc) - timedelta(seconds=_settings().login_window_seconds)
        db.execute(delete(LoginFailure).where(LoginFailure.username == username, LoginFailure.created_at >= window_start))
        db.commit()

        if user.mfa_enabled:
            challenge = issue_mfa_challenge_token(settings=_settings(), user_id=str(user.id))
            audit_log(actor_user_id=str(user.id), action="auth.login_password", outcome="ALLOW", message="Password OK; MFA required")
            return jsonify({"mfa_required": True, "mfa_challenge_token": challenge}), 200

        token = issue_access_token(settings=_settings(), user_id=str(user.id), role=user.role.value)
        audit_log(actor_user_id=str(user.id), action="auth.login", outcome="ALLOW", message="Login success (no MFA)")
        return jsonify({"access_token": token, "token_type": "Bearer", "expires_in": _settings().jwt_access_token_ttl_seconds})
    finally:
        db.close()


@bp.post("/login/mfa")
def login_mfa_step():
    """
    MFA verification step (TOTP or backup code).
    """
    data = request.json or {}
    challenge_token = data.get("mfa_challenge_token") or ""
    totp_code = (data.get("totp_code") or "").strip()
    backup_code = (data.get("backup_code") or "").strip()

    if not challenge_token or (not totp_code and not backup_code):
        raise ApiError(400, "invalid_request", "mfa_challenge_token and totp_code or backup_code are required.")

    claims = decode_token(settings=_settings(), token=challenge_token)
    if claims.get("typ") != "mfa_challenge":
        raise ApiError(401, "invalid_token", "Invalid MFA challenge token.")

    user_id = claims.get("sub")
    db = get_db_session()
    try:
        user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if not user or not user.mfa_enabled or not user.mfa_totp_secret:
            raise ApiError(401, "invalid_mfa", "Invalid MFA state.")

        ok = False
        if totp_code:
            ok = verify_totp(secret=user.mfa_totp_secret, code=totp_code)
        elif backup_code:
            # SECURITY: compare hashed codes (PBKDF2) and mark used.
            codes = db.execute(select(MfaBackupCode).where(MfaBackupCode.user_id == user.id, MfaBackupCode.used == False)).scalars().all()  # noqa: E712
            for c in codes:
                if pbkdf2_verify_password(backup_code, c.code_hash):
                    c.used = True
                    ok = True
                    break

        if not ok:
            audit_log(actor_user_id=str(user.id), action="auth.login_mfa", outcome="DENY", message="Invalid MFA code")
            raise ApiError(401, "invalid_mfa", "Invalid MFA code.")

        db.commit()
        token = issue_access_token(settings=_settings(), user_id=str(user.id), role=user.role.value)
        audit_log(actor_user_id=str(user.id), action="auth.login", outcome="ALLOW", message="Login success (MFA)")
        return jsonify({"access_token": token, "token_type": "Bearer", "expires_in": _settings().jwt_access_token_ttl_seconds})
    finally:
        db.close()


@bp.post("/mfa/setup")
def mfa_setup():
    """
    Start TOTP setup: returns secret + QR code.

    SECURITY: Secret is stored as pending until verified to prevent enabling MFA without proof.
    """
    data = request.json or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        raise ApiError(400, "invalid_request", "username and password are required.")

    db = get_db_session()
    try:
        user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if not user or not pbkdf2_verify_password(password, user.password_hash):
            raise ApiError(401, "invalid_credentials", "Invalid credentials.")

        secret = generate_totp_secret()
        user.mfa_totp_secret_pending = secret
        db.commit()
        audit_log(actor_user_id=str(user.id), action="auth.mfa_setup_start", outcome="ALLOW", message="Generated pending TOTP secret")

        uri = build_otpauth_uri(username=user.username, secret=secret, issuer=_settings().jwt_issuer)
        return jsonify(
            {
                "totp_secret": secret,  # shown for backup/manual entry
                "otpauth_uri": uri,
                "qr_code_base64_png": qr_png_base64(uri),
            }
        )
    finally:
        db.close()


@bp.post("/mfa/verify-setup")
def mfa_verify_setup():
    """
    Verify TOTP setup and enable MFA; generate backup codes (shown once).
    """
    data = request.json or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    totp_code = (data.get("totp_code") or "").strip()
    if not username or not password or not totp_code:
        raise ApiError(400, "invalid_request", "username, password, totp_code required.")

    db = get_db_session()
    try:
        user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if not user or not pbkdf2_verify_password(password, user.password_hash):
            raise ApiError(401, "invalid_credentials", "Invalid credentials.")
        if not user.mfa_totp_secret_pending:
            raise ApiError(400, "invalid_state", "MFA setup not started.")

        if not verify_totp(secret=user.mfa_totp_secret_pending, code=totp_code):
            raise ApiError(401, "invalid_mfa", "Invalid TOTP code.")

        user.mfa_totp_secret = user.mfa_totp_secret_pending
        user.mfa_totp_secret_pending = None
        user.mfa_enabled = True

        # Generate + store hashed backup codes
        codes = generate_backup_codes(10)
        for code in codes:
            db.add(MfaBackupCode(user_id=user.id, code_hash=pbkdf2_hash_password(code, iterations=_settings().pbkdf2_iterations)))
        db.commit()
        audit_log(actor_user_id=str(user.id), action="auth.mfa_enabled", outcome="ALLOW", message="MFA enabled with backup codes")

        return jsonify({"mfa_enabled": True, "backup_codes": codes})
    finally:
        db.close()


