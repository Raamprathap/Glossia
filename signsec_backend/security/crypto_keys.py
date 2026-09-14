from __future__ import annotations

import os
from dataclasses import dataclass

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


@dataclass(frozen=True)
class EncryptedPrivateKey:
    ciphertext: bytes
    iv: bytes
    kdf_salt: bytes
    kdf_iterations: int


def generate_rsa_keypair(*, bits: int = 2048) -> tuple[str, bytes]:
    """
    Returns (public_pem_str, private_pem_bytes).

    SECURITY: RSA used for key wrapping/signatures (not bulk data). 2048-bit meets lab requirements.
    """
    key = rsa.generate_private_key(public_exponent=65537, key_size=bits)
    public_pem = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")
    private_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return public_pem, private_pem


def _derive_key_from_password(*, password: str, salt: bytes, iterations: int) -> bytes:
    # 32 bytes for AES-256
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=iterations)
    return kdf.derive(password.encode("utf-8"))


def encrypt_private_key_with_password(*, private_pem: bytes, password: str, iterations: int = 200_000) -> EncryptedPrivateKey:
    """
    SECURITY: Private key is encrypted-at-rest with a key derived from user's password.
    This mitigates key theft if DB is compromised (residual risk: weak password / online brute-force).
    """
    salt = os.urandom(16)
    key = _derive_key_from_password(password=password, salt=salt, iterations=iterations)
    iv = os.urandom(12)  # AES-GCM nonce
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(iv, private_pem, None)
    return EncryptedPrivateKey(ciphertext=ct, iv=iv, kdf_salt=salt, kdf_iterations=iterations)


def decrypt_private_key_with_password(*, enc: EncryptedPrivateKey, password: str) -> bytes:
    key = _derive_key_from_password(password=password, salt=enc.kdf_salt, iterations=enc.kdf_iterations)
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(enc.iv, enc.ciphertext, None)


