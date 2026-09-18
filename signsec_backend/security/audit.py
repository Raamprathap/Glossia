from __future__ import annotations

from flask import request

from ..db import get_db_session
from ..models import AuditLog


def audit_log(*, actor_user_id, action: str, outcome: str, message: str | None = None) -> None:
    """
    SECURITY: Audit log is critical for incident response, forensics, and accountability (CO3/CO4).
    For the lab we write to DB; in production also ship to SIEM.
    """
    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()
    db = get_db_session()
    try:
        db.add(AuditLog(actor_user_id=actor_user_id, actor_ip=ip, action=action, outcome=outcome, message=message))
        db.commit()
    finally:
        db.close()


