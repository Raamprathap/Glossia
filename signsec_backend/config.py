from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class Settings:
    """
    Central config.

    SECURITY: Never hardcode secrets in code. Load from environment / vault.
    """

    # Flask / environment
    env: str
    debug: bool

    # JWT
    jwt_secret: str
    jwt_issuer: str
    jwt_audience: str
    jwt_access_token_ttl_seconds: int
    jwt_mfa_challenge_ttl_seconds: int

    # Password hashing (PBKDF2-SHA256)
    pbkdf2_iterations: int

    # CORS
    cors_origins: List[str]

    # PostgreSQL
    database_url: str

    # Rate limiting
    login_max_attempts: int
    login_window_seconds: int

    # Cryptography
    rsa_key_bits: int

    @staticmethod
    def from_env() -> "Settings":
        cors = os.getenv("CORS_ORIGINS", "*").strip()
        cors_origins = ["*"] if cors == "*" else [o.strip() for o in cors.split(",") if o.strip()]

        return Settings(
            env=os.getenv("APP_ENV", "dev"),
            debug=os.getenv("FLASK_DEBUG", "0") == "1",
            jwt_secret=os.getenv("JWT_SECRET", "dev-only-change-me"),
            jwt_issuer=os.getenv("JWT_ISSUER", "SignLanguageExtension"),
            jwt_audience=os.getenv("JWT_AUDIENCE", "signsec-api"),
            jwt_access_token_ttl_seconds=int(os.getenv("JWT_ACCESS_TTL_SECONDS", "3600")),
            jwt_mfa_challenge_ttl_seconds=int(os.getenv("JWT_MFA_CHALLENGE_TTL_SECONDS", "300")),
            pbkdf2_iterations=int(os.getenv("PBKDF2_ITERATIONS", "150000")),
            cors_origins=cors_origins,
            database_url=os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/signsec"),
            login_max_attempts=int(os.getenv("LOGIN_MAX_ATTEMPTS", "5")),
            login_window_seconds=int(os.getenv("LOGIN_WINDOW_SECONDS", "900")),
            rsa_key_bits=int(os.getenv("RSA_KEY_BITS", "2048")),
        )


