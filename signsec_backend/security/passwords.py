from __future__ import annotations

import base64
import hashlib
import hmac
import os
import re


PASSWORD_POLICY_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$")


def validate_password_policy(password: str) -> None:
    """
    SECURITY: NIST guidance emphasizes length and screening. For this lab rubric we enforce:
    - min 12 chars
    - upper/lower/digit/special
    """
    if not PASSWORD_POLICY_RE.match(password or ""):
        raise ValueError(
            "Password must be at least 12 characters and include uppercase, lowercase, digit, and special character."
        )


def pbkdf2_hash_password(password: str, *, iterations: int) -> str:
    """
    Returns: pbkdf2_sha256$<iterations>$<salt_b64>$<hash_b64>

    SECURITY: PBKDF2 with >=100k iterations slows offline cracking of stolen hashes.
    """
    salt = os.urandom(32)  # 32-byte random salt per requirement
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations, dklen=32)
    return "pbkdf2_sha256$%d$%s$%s" % (
        iterations,
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(dk).decode("ascii"),
    )


def pbkdf2_verify_password(password: str, stored: str) -> bool:
    """
    SECURITY: Use constant-time compare to avoid timing leaks.
    """
    try:
        algo, iter_s, salt_b64, hash_b64 = stored.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        iterations = int(iter_s)
        salt = base64.b64decode(salt_b64.encode("ascii"))
        expected = base64.b64decode(hash_b64.encode("ascii"))
    except Exception:
        return False

    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations, dklen=len(expected))
    return hmac.compare_digest(dk, expected)


