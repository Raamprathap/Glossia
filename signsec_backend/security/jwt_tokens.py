from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt

from ..config import Settings


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def issue_access_token(*, settings: Settings, user_id: str, role: str) -> str:
    exp = _now() + timedelta(seconds=settings.jwt_access_token_ttl_seconds)
    payload: Dict[str, Any] = {
        "typ": "access",
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "sub": user_id,
        "role": role,
        "iat": int(_now().timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def issue_mfa_challenge_token(*, settings: Settings, user_id: str) -> str:
    exp = _now() + timedelta(seconds=settings.jwt_mfa_challenge_ttl_seconds)
    payload: Dict[str, Any] = {
        "typ": "mfa_challenge",
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "sub": user_id,
        "iat": int(_now().timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(*, settings: Settings, token: str) -> Dict[str, Any]:
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=["HS256"],
        issuer=settings.jwt_issuer,
        audience=settings.jwt_audience,
    )


