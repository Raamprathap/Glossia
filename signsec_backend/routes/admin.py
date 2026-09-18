from __future__ import annotations

from flask import Blueprint, jsonify
from sqlalchemy import select

from ..db import get_db_session
from ..models import AuditLog, ConversionJob, Permission
from ..security.authz import load_current_user, require_permission

bp = Blueprint("admin", __name__)

@bp.get("/conversions")
@require_permission(Permission.VIEW_ALL_CONVERSIONS)
def list_all_conversions():
    user = load_current_user()
    db = get_db_session()
    try:
        jobs = db.execute(select(ConversionJob).order_by(ConversionJob.created_at.desc()).limit(100)).scalars().all()
        return jsonify(
            {
                "items": [
                    {
                        "id": str(j.id),
                        "owner_user_id": str(j.owner_user_id),
                        "source_type": j.source_type,
                        "status": j.status,
                        "created_at": j.created_at.isoformat(),
                    }
                    for j in jobs
                ]
            }
        )
    finally:
        db.close()


@bp.get("/audit-logs")
@require_permission(Permission.VIEW_AUDIT_LOGS)
def list_audit_logs():
    user = load_current_user()
    db = get_db_session()
    try:
        rows = db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200)).scalars().all()
        return jsonify(
            {
                "items": [
                    {
                        "id": str(r.id),
                        "actor_user_id": str(r.actor_user_id) if r.actor_user_id else None,
                        "actor_ip": r.actor_ip,
                        "action": r.action,
                        "outcome": r.outcome,
                        "message": r.message,
                        "created_at": r.created_at.isoformat(),
                    }
                    for r in rows
                ]
            }
        )
    finally:
        db.close()


