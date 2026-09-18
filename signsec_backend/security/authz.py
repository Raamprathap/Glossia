from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from functools import wraps
from typing import Callable, Optional

from flask import current_app, g, request
from sqlalchemy import select

from ..config import Settings
from ..db import get_db_session
from ..http_errors import ApiError
from ..models import AclEntry, Permission, Role, User
from .jwt_tokens import decode_token


ROLE_PERMISSIONS: dict[Role, set[Permission]] = {
    Role.ADMIN: {
        Permission.CREATE_CONVERSION,
        Permission.VIEW_ALL_CONVERSIONS,
        Permission.DELETE_ANY_CONVERSIONS,
        Permission.DOWNLOAD_VIDEO,
        Permission.SHARE_VIDEO,
        Permission.MANAGE_USERS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.UPLOAD_FILE,
        Permission.ACCESS_CLOUD_STORAGE,
    },
    Role.USER: {
        Permission.CREATE_CONVERSION,
        Permission.VIEW_OWN_CONVERSIONS,
        Permission.DELETE_OWN_CONVERSIONS,
        Permission.DOWNLOAD_VIDEO,
        Permission.SHARE_VIDEO,
        Permission.UPLOAD_FILE,
    },
}


ROLE_QUOTAS_MONTHLY = {
    Role.ADMIN: None,  # unlimited
    Role.USER: 20,
}


def _settings() -> Settings:
    return current_app.config["SETTINGS"]


def get_bearer_token() -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    return None


def load_current_user() -> User:
    token = get_bearer_token()
    if not token:
        raise ApiError(401, "unauthorized", "Missing Bearer token.")

    claims = decode_token(settings=_settings(), token=token)
    if claims.get("typ") != "access":
        raise ApiError(401, "unauthorized", "Invalid token type.")

    user_id = claims.get("sub")
    db = get_db_session()
    try:
        user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if not user:
            raise ApiError(401, "unauthorized", "Invalid token.")
        g.current_user = user
        return user
    finally:
        db.close()


def has_permission(*, user: User, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(user.role, set())


def check_acl(
    *,
    user: User,
    object_type: str,
    object_id,
    permission: Permission,
) -> bool:
    now = datetime.now(tz=timezone.utc)
    db = get_db_session()
    try:
        # user-specific ACL
        q1 = select(AclEntry).where(
            AclEntry.subject_type == "user",
            AclEntry.subject_id == str(user.id),
            AclEntry.object_type == object_type,
            AclEntry.object_id == object_id,
            AclEntry.permission == permission,
        )
        entry = db.execute(q1).scalar_one_or_none()
        if entry and (entry.expires_at is None or entry.expires_at >= now):
            return True

        # role-based ACL
        q2 = select(AclEntry).where(
            AclEntry.subject_type == "role",
            AclEntry.subject_id == user.role.value,
            AclEntry.object_type == object_type,
            AclEntry.object_id == object_id,
            AclEntry.permission == permission,
        )
        entry = db.execute(q2).scalar_one_or_none()
        if entry and (entry.expires_at is None or entry.expires_at >= now):
            return True

        return False
    finally:
        db.close()


def require_permission(permission: Permission) -> Callable:
    """
    Decorator enforcing RBAC permissions.

    SECURITY: return 401 if not logged in; 403 if logged in but not allowed.
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = load_current_user()
            if not has_permission(user=user, permission=permission):
                raise ApiError(403, "forbidden", "Insufficient permissions.")
            return fn(*args, **kwargs)

        return wrapper

    return decorator


