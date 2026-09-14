from __future__ import annotations

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from .config import Settings


def init_rate_limiter(app, settings: Settings) -> None:
    """
    SECURITY: Rate limit login and other sensitive endpoints to mitigate brute-force,
    credential stuffing, and OTP guessing (OWASP ASVS V2).
    """
    limiter = Limiter(
        key_func=get_remote_address,
        # Using in-memory storage for lab simplicity. In production use Redis.
        storage_uri="memory://",
        default_limits=[],
    )
    limiter.init_app(app)
    app.extensions["limiter"] = limiter


