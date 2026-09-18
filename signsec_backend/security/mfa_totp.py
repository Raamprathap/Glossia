from __future__ import annotations

import base64
import io
import os
from typing import Tuple

import pyotp
import qrcode


def generate_totp_secret() -> str:
    # base32 secret
    return pyotp.random_base32()


def build_otpauth_uri(*, username: str, secret: str, issuer: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=issuer)


def qr_png_base64(data: str) -> str:
    """
    Returns base64 PNG for embedding in JSON.
    """
    img = qrcode.make(data)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def verify_totp(*, secret: str, code: str) -> bool:
    """
    SECURITY: allow ±1 step to tolerate clock drift; reject otherwise (RFC 6238).
    """
    totp = pyotp.TOTP(secret)
    return bool(totp.verify(code, valid_window=1))


def generate_backup_codes(n: int = 10) -> list[str]:
    """
    SECURITY: backup codes are one-time use, displayed once, stored only hashed.
    """
    out: list[str] = []
    for _ in range(n):
        out.append(base64.b32encode(os.urandom(10)).decode("ascii").rstrip("="))
    return out


