from __future__ import annotations

import logging

from .config import Settings


def init_audit_logging(app, settings: Settings) -> None:
    """
    SECURITY: In a real system, audit logs are append-only and exported to SIEM.
    For this lab, we use structured logging + a DB audit_log table later.
    """
    logger = logging.getLogger("signsec")
    logger.setLevel(logging.INFO)
    app.extensions["logger"] = logger


