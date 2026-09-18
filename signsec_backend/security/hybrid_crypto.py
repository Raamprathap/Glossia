from __future__ import annotations

import os

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def aes_gcm_encrypt(*, plaintext: bytes, aad: bytes | None = None) -> tuple[bytes, bytes, bytes]:
    """
    Returns (aes_key, iv, ciphertext_with_tag).

    SECURITY: AES-256-GCM provides confidentiality + integrity (auth tag).
    """
    key = os.urandom(32)  # AES-256
    iv = os.urandom(12)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(iv, plaintext, aad)
    return key, iv, ct


def aes_gcm_decrypt(*, key: bytes, iv: bytes, ciphertext_with_tag: bytes, aad: bytes | None = None) -> bytes:
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(iv, ciphertext_with_tag, aad)


def rsa_encrypt_key(*, public_key_pem: str, key: bytes) -> bytes:
    """
    Encrypt (wrap) AES key using RSA-OAEP.

    SECURITY: Use OAEP (not raw RSA) to mitigate chosen-ciphertext attacks.
    """
    pub = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
    return pub.encrypt(
        key,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None),
    )


def rsa_decrypt_key(*, private_key_pem: bytes, wrapped_key: bytes) -> bytes:
    priv = serialization.load_pem_private_key(private_key_pem, password=None)
    return priv.decrypt(
        wrapped_key,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None),
    )


