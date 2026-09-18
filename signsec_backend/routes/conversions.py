from __future__ import annotations

import base64
import os
from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import select, func

from ..db import get_db_session
from ..http_errors import ApiError
from ..models import AclEntry, ConversionJob, Permission, Role, ShareLink, User
from ..security.authz import ROLE_QUOTAS_MONTHLY, check_acl, load_current_user, require_permission
from ..security.passwords import pbkdf2_hash_password
from ..security.mfa_totp import qr_png_base64
from ..security.audit import audit_log
from ..security.passwords import pbkdf2_verify_password
from ..security.crypto_keys import EncryptedPrivateKey, decrypt_private_key_with_password
from ..security.signatures import b64encode_bytes, canonical_json_bytes, rsa_pss_sign, rsa_pss_verify

bp = Blueprint("conversions", __name__)

def _month_start() -> datetime:
    now = datetime.now(tz=timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


@bp.post("")
@require_permission(Permission.CREATE_CONVERSION)
def create_conversion():
    """
    Create a conversion job (stub pipeline).
    """
    user = load_current_user()

    quota = ROLE_QUOTAS_MONTHLY.get(user.role)
    if quota is not None:
        db = get_db_session()
        try:
            q = select(func.count()).select_from(ConversionJob).where(
                ConversionJob.owner_user_id == user.id, ConversionJob.created_at >= _month_start()
            )
            used = db.execute(q).scalar_one()
            if used >= quota:
                raise ApiError(403, "quota_exceeded", "Monthly conversion quota exceeded.")
        finally:
            db.close()

    data = request.json or {}
    source_type = (data.get("source_type") or "").strip()
    source_value = (data.get("source_value") or "").strip()
    if source_type not in {"youtube", "upload", "text"} or not source_value:
        raise ApiError(400, "invalid_request", "source_type must be youtube/upload/text and source_value is required.")

    db = get_db_session()
    try:
        job = ConversionJob(owner_user_id=user.id, source_type=source_type, source_value=source_value, status="PENDING")
        db.add(job)
        db.commit()
        audit_log(actor_user_id=str(user.id), action="conversion.create", outcome="ALLOW", message=f"conversion_id={job.id}")
        return jsonify({"id": str(job.id), "status": job.status}), 201
    finally:
        db.close()


@bp.get("/<conversion_id>")
def get_conversion(conversion_id: str):
    """
    View a conversion job:
    - owner can view with RBAC permission VIEW_OWN_CONVERSIONS
    - admin can view with VIEW_ALL_CONVERSIONS
    - others can view if ACL grants it (e.g., shared link creates an ACL entry)
    """
    user = load_current_user()
    db = get_db_session()
    try:
        job = db.execute(select(ConversionJob).where(ConversionJob.id == conversion_id)).scalar_one_or_none()
        if not job:
            raise ApiError(404, "not_found", "Conversion not found.")

        if job.owner_user_id == user.id:
            # owner path
            from ..security.authz import has_permission

            if not has_permission(user=user, permission=Permission.VIEW_OWN_CONVERSIONS):
                audit_log(actor_user_id=str(user.id), action="conversion.view", outcome="DENY", message=f"conversion_id={job.id}")
                raise ApiError(403, "forbidden", "Insufficient permissions.")
        else:
            from ..security.authz import has_permission

            if has_permission(user=user, permission=Permission.VIEW_ALL_CONVERSIONS):
                pass
            elif check_acl(user=user, object_type="conversion", object_id=job.id, permission=Permission.VIEW_OWN_CONVERSIONS):
                pass
            else:
                # SECURITY: for unauthorized access to objects, returning 404 reduces IDOR signal.
                audit_log(actor_user_id=str(user.id), action="conversion.view", outcome="DENY", message=f"conversion_id={job.id} (masked as 404)")
                raise ApiError(404, "not_found", "Conversion not found.")

        audit_log(actor_user_id=str(user.id), action="conversion.view", outcome="ALLOW", message=f"conversion_id={job.id}")
        return jsonify(
            {
                "id": str(job.id),
                "owner_user_id": str(job.owner_user_id),
                "source_type": job.source_type,
                "source_value": job.source_value,
                "status": job.status,
                "created_at": job.created_at.isoformat(),
                "output_media_file_id": str(job.output_media_file_id) if job.output_media_file_id else None,
            }
        )
    finally:
        db.close()


@bp.delete("/<conversion_id>")
def delete_conversion(conversion_id: str):
    user = load_current_user()
    db = get_db_session()
    try:
        job = db.execute(select(ConversionJob).where(ConversionJob.id == conversion_id)).scalar_one_or_none()
        if not job:
            raise ApiError(404, "not_found", "Conversion not found.")

        from ..security.authz import has_permission

        if job.owner_user_id == user.id:
            if not has_permission(user=user, permission=Permission.DELETE_OWN_CONVERSIONS):
                audit_log(actor_user_id=str(user.id), action="conversion.delete", outcome="DENY", message=f"conversion_id={job.id}")
                raise ApiError(403, "forbidden", "Insufficient permissions.")
        else:
            if not has_permission(user=user, permission=Permission.DELETE_ANY_CONVERSIONS):
                audit_log(actor_user_id=str(user.id), action="conversion.delete", outcome="DENY", message=f"conversion_id={job.id} (masked as 404)")
                raise ApiError(404, "not_found", "Conversion not found.")

        db.delete(job)
        db.commit()
        audit_log(actor_user_id=str(user.id), action="conversion.delete", outcome="ALLOW", message=f"conversion_id={job.id}")
        return jsonify({"deleted": True})
    finally:
        db.close()


@bp.post("/<conversion_id>/share")
@require_permission(Permission.SHARE_VIDEO)
def share_conversion(conversion_id: str):
    """
    Create a share link (URL-safe token) and corresponding ACL entry so GUEST can view.
    Returns share_url + QR code (base64 png).
    """
    user = load_current_user()
    db = get_db_session()
    try:
        job = db.execute(select(ConversionJob).where(ConversionJob.id == conversion_id)).scalar_one_or_none()
        if not job or job.owner_user_id != user.id:
            raise ApiError(404, "not_found", "Conversion not found.")

        ttl_minutes = int((request.json or {}).get("ttl_minutes") or 60)
        expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=ttl_minutes)

        raw_token = base64.urlsafe_b64encode(os.urandom(32)).decode("ascii").rstrip("=")
        token_hash = pbkdf2_hash_password(raw_token, iterations=current_app.config["SETTINGS"].pbkdf2_iterations)

        link = ShareLink(conversion_id=job.id, token_hash=token_hash, expires_at=expires_at)
        db.add(link)

        # ACL: guests can view via token verification endpoint (implemented later)
        db.add(
            AclEntry(
                subject_type="role",
                subject_id=Role.GUEST.value,
                object_type="conversion",
                object_id=job.id,
                permission=Permission.VIEW_OWN_CONVERSIONS,
                expires_at=expires_at,
            )
        )

        db.commit()

        share_url = f"/api/conversions/shared/{raw_token}"
        audit_log(actor_user_id=str(user.id), action="conversion.share", outcome="ALLOW", message=f"conversion_id={job.id}")
        return jsonify({"share_url": share_url, "qr_code_base64_png": qr_png_base64(share_url), "expires_at": expires_at.isoformat()})
    finally:
        db.close()


@bp.get("/shared/<token>")
def view_shared(token: str):
    """
    Public shared link access.

    SECURITY:
    - No JWT required (guest access)
    - Token is URL-safe base64 random (32 bytes)
    - We store only a PBKDF2 hash of token; verify with constant-time check
    - Returns 404 for invalid/expired token to avoid oracle behavior
    """
    token = (token or "").strip()
    if not token:
        raise ApiError(404, "not_found", "Not found.")

    db = get_db_session()
    try:
        links = db.execute(select(ShareLink).where(ShareLink.expires_at.is_(None) | (ShareLink.expires_at >= datetime.now(tz=timezone.utc)))).scalars().all()
        match = None
        for link in links:
            if pbkdf2_verify_password(token, link.token_hash):
                match = link
                break
        if not match:
            raise ApiError(404, "not_found", "Not found.")

        job = db.execute(select(ConversionJob).where(ConversionJob.id == match.conversion_id)).scalar_one_or_none()
        if not job:
            raise ApiError(404, "not_found", "Not found.")

        audit_log(actor_user_id=None, action="conversion.view_shared", outcome="ALLOW", message=f"conversion_id={job.id}")
        return jsonify(
            {
                "id": str(job.id),
                "owner_user_id": str(job.owner_user_id),
                "source_type": job.source_type,
                "status": job.status,
                "created_at": job.created_at.isoformat(),
                "output_media_file_id": str(job.output_media_file_id) if job.output_media_file_id else None,
                "shared": True,
            }
        )
    finally:
        db.close()


@bp.post("/<conversion_id>/sign")
@require_permission(Permission.VIEW_OWN_CONVERSIONS)
def sign_conversion_metadata(conversion_id: str):
    """
    Digitally sign conversion metadata with user's RSA private key (RSA-PSS + SHA-256).

    SECURITY:
    - Requires password to unlock encrypted private key (step-up)
    - Stores signature + signer public key in DB for later verification (integrity/authenticity demo)
    """
    user = load_current_user()
    password = (request.json or {}).get("password") or ""
    if not password:
        raise ApiError(400, "invalid_request", "password is required to sign with your private key.")

    db = get_db_session()
    try:
        job = db.execute(select(ConversionJob).where(ConversionJob.id == conversion_id)).scalar_one_or_none()
        if not job or job.owner_user_id != user.id:
            raise ApiError(404, "not_found", "Conversion not found.")

        payload = {
            "conversion_id": str(job.id),
            "user_id": str(job.owner_user_id),
            "source_type": job.source_type,
            "source_value": job.source_value,
            "output_media_file_id": str(job.output_media_file_id) if job.output_media_file_id else None,
            "created_at": job.created_at.isoformat(),
        }
        msg = canonical_json_bytes(payload)

        enc_priv = EncryptedPrivateKey(
            ciphertext=user.rsa_private_key_enc or b"",
            iv=user.rsa_private_key_enc_iv or b"",
            kdf_salt=user.rsa_private_key_kdf_salt or b"",
            kdf_iterations=user.rsa_private_key_kdf_iterations or 0,
        )
        private_pem = decrypt_private_key_with_password(enc=enc_priv, password=password)
        sig = rsa_pss_sign(private_key_pem=private_pem, message=msg)

        job.metadata_signature = sig
        job.signer_public_key_pem = user.rsa_public_key_pem
        db.commit()

        audit_log(actor_user_id=str(user.id), action="conversion.sign_metadata", outcome="ALLOW", message=f"conversion_id={job.id}")
        return jsonify({"signed": True, "signature_base64": b64encode_bytes(sig), "signed_payload": payload})
    finally:
        db.close()


@bp.get("/<conversion_id>/verify-signature")
def verify_conversion_signature(conversion_id: str):
    """
    Verify stored signature against current conversion metadata.
    """
    # Allowed for:
    # - owner with VIEW_OWN_CONVERSIONS
    # - admin with VIEW_ALL_CONVERSIONS
    # - anyone with ACL view grant (e.g., shared)
    user = load_current_user()
    db = get_db_session()
    try:
        job = db.execute(select(ConversionJob).where(ConversionJob.id == conversion_id)).scalar_one_or_none()
        if not job:
            raise ApiError(404, "not_found", "Conversion not found.")

        from ..security.authz import has_permission

        if job.owner_user_id == user.id:
            if not has_permission(user=user, permission=Permission.VIEW_OWN_CONVERSIONS):
                raise ApiError(403, "forbidden", "Insufficient permissions.")
        else:
            if has_permission(user=user, permission=Permission.VIEW_ALL_CONVERSIONS):
                pass
            elif check_acl(user=user, object_type="conversion", object_id=job.id, permission=Permission.VIEW_OWN_CONVERSIONS):
                pass
            else:
                raise ApiError(404, "not_found", "Conversion not found.")

        payload = {
            "conversion_id": str(job.id),
            "user_id": str(job.owner_user_id),
            "source_type": job.source_type,
            "source_value": job.source_value,
            "output_media_file_id": str(job.output_media_file_id) if job.output_media_file_id else None,
            "created_at": job.created_at.isoformat(),
        }
        msg = canonical_json_bytes(payload)

        if not job.metadata_signature or not job.signer_public_key_pem:
            return jsonify({"is_signed": False, "is_valid": False})

        ok = rsa_pss_verify(public_key_pem=job.signer_public_key_pem, message=msg, signature=job.metadata_signature)
        return jsonify({"is_signed": True, "is_valid": ok, "signed_payload": payload})
    finally:
        db.close()


