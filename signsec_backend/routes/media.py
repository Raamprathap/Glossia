from __future__ import annotations

import hashlib
import os

from flask import Blueprint, jsonify, request, send_file
from sqlalchemy import select

from ..db import get_db_session
from ..http_errors import ApiError
from ..models import MediaFile, Permission
from ..security.audit import audit_log
from ..security.authz import load_current_user, require_permission
from ..security.crypto_keys import EncryptedPrivateKey, decrypt_private_key_with_password
from ..security.hybrid_crypto import aes_gcm_decrypt, aes_gcm_encrypt, rsa_decrypt_key, rsa_encrypt_key
from ..storage.ipfs_stub import fetch_encrypted_blob, store_encrypted_blob

bp = Blueprint("media", __name__)

@bp.post("/upload")
@require_permission(Permission.UPLOAD_FILE)
def upload_media():
    """
    Upload + encrypt a media file with hybrid crypto:
    - AES-256-GCM encrypts the file
    - RSA-OAEP wraps the AES key (per-user public key)
    """
    user = load_current_user()

    if "file" not in request.files:
        raise ApiError(400, "invalid_request", "multipart/form-data with 'file' is required.")
    f = request.files["file"]
    data = f.read()
    if not data:
        raise ApiError(400, "invalid_request", "Empty file.")

    # Integrity: salted SHA-256 of plaintext (salt || plaintext)
    salt = os.urandom(16)
    digest = hashlib.sha256(salt + data).hexdigest()

    aes_key, iv, ciphertext = aes_gcm_encrypt(plaintext=data, aad=str(user.id).encode("utf-8"))
    wrapped_key = rsa_encrypt_key(public_key_pem=user.rsa_public_key_pem or "", key=aes_key)

    # Store encrypted blob (IV || ciphertext_with_tag) to IPFS stub
    blob = iv + ciphertext
    cid = store_encrypted_blob(blob=blob)

    db = get_db_session()
    try:
        mf = MediaFile(
            owner_user_id=user.id,
            pinata_cid=cid,
            encrypted_aes_key=wrapped_key,
            aes_gcm_iv=iv,
            plaintext_sha256=digest,
            plaintext_hash_salt=salt,
        )
        db.add(mf)
        db.commit()
        audit_log(actor_user_id=str(user.id), action="media.upload", outcome="ALLOW", message=f"media_id={mf.id} cid={cid}")
        return jsonify({"media_file_id": str(mf.id), "cid": cid}), 201
    finally:
        db.close()


@bp.post("/<media_id>/download")
@require_permission(Permission.DOWNLOAD_VIDEO)
def download_media(media_id: str):
    """
    Download + decrypt media.

    SECURITY: To decrypt the user's RSA private key, we require the user to re-enter their password
    (step-up auth). This avoids keeping decrypted private keys server-side.
    """
    user = load_current_user()
    password = (request.json or {}).get("password") or ""
    if not password:
        raise ApiError(400, "invalid_request", "password is required to unlock your private key for decryption.")

    db = get_db_session()
    try:
        mf = db.execute(select(MediaFile).where(MediaFile.id == media_id)).scalar_one_or_none()
        if not mf or mf.owner_user_id != user.id:
            raise ApiError(404, "not_found", "Media not found.")

        enc_priv = EncryptedPrivateKey(
            ciphertext=user.rsa_private_key_enc or b"",
            iv=user.rsa_private_key_enc_iv or b"",
            kdf_salt=user.rsa_private_key_kdf_salt or b"",
            kdf_iterations=user.rsa_private_key_kdf_iterations or 0,
        )
        private_pem = decrypt_private_key_with_password(enc=enc_priv, password=password)
        aes_key = rsa_decrypt_key(private_key_pem=private_pem, wrapped_key=mf.encrypted_aes_key)

        blob = fetch_encrypted_blob(cid=mf.pinata_cid)
        iv = blob[:12]
        ciphertext = blob[12:]
        plaintext = aes_gcm_decrypt(key=aes_key, iv=iv, ciphertext_with_tag=ciphertext, aad=str(user.id).encode("utf-8"))

        # Integrity verification
        digest = hashlib.sha256(mf.plaintext_hash_salt + plaintext).hexdigest()
        if digest != mf.plaintext_sha256:
            audit_log(actor_user_id=str(user.id), action="media.download", outcome="DENY", message="Integrity check failed")
            raise ApiError(500, "integrity_error", "Integrity verification failed.")

        # Return as file attachment (for the lab; Next.js can stream)
        tmp_path = os.path.join("storage", f"dec_{media_id}.bin")
        with open(tmp_path, "wb") as out:
            out.write(plaintext)
        audit_log(actor_user_id=str(user.id), action="media.download", outcome="ALLOW", message=f"media_id={mf.id}")
        return send_file(tmp_path, as_attachment=True, download_name="media.bin")
    finally:
        db.close()


