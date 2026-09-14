from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from typing import Any, Dict

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


def canonical_json_bytes(payload: Dict[str, Any]) -> bytes:
    """
    SECURITY: Canonical JSON (sorted keys, no whitespace differences) makes signatures stable and verifiable.
    """
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def rsa_pss_sign(*, private_key_pem: bytes, message: bytes) -> bytes:
    """
    SECURITY: RSA-PSS + SHA-256 is preferred over legacy PKCS#1 v1.5 for signatures.
    """
    priv = serialization.load_pem_private_key(private_key_pem, password=None)
    return priv.sign(
        message,
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256(),
    )


def rsa_pss_verify(*, public_key_pem: str, message: bytes, signature: bytes) -> bool:
    pub = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
    try:
        pub.verify(
            signature,
            message,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
        return True
    except Exception:
        return False


def b64encode_bytes(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def b64decode_bytes(data_b64: str) -> bytes:
    return base64.b64decode(data_b64.encode("ascii"))


