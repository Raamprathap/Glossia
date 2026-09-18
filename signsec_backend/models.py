from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"


class Permission(str, enum.Enum):
    # Conversions
    CREATE_CONVERSION = "CREATE_CONVERSION"
    VIEW_OWN_CONVERSIONS = "VIEW_OWN_CONVERSIONS"
    VIEW_ALL_CONVERSIONS = "VIEW_ALL_CONVERSIONS"
    DELETE_OWN_CONVERSIONS = "DELETE_OWN_CONVERSIONS"
    DELETE_ANY_CONVERSIONS = "DELETE_ANY_CONVERSIONS"
    DOWNLOAD_VIDEO = "DOWNLOAD_VIDEO"
    SHARE_VIDEO = "SHARE_VIDEO"

    # Admin / IAM
    MANAGE_USERS = "MANAGE_USERS"
    VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS"

    # Media/storage
    UPLOAD_FILE = "UPLOAD_FILE"
    ACCESS_CLOUD_STORAGE = "ACCESS_CLOUD_STORAGE"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True)
    role: Mapped[Role] = mapped_column(Enum(Role, name="role_enum"), nullable=False, default=Role.USER)

    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    password_changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # OTP registration
    otp_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    otp_secret: Mapped[str | None] = mapped_column(String(128), nullable=True)
    otp_expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # MFA
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    mfa_totp_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mfa_totp_secret_pending: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Backup codes are stored hashed (PBKDF2) and shown once.
    backup_codes: Mapped[list["MfaBackupCode"]] = relationship(back_populates="user", cascade="all,delete-orphan")

    # RSA keys (public in clear, private encrypted with password-derived key)
    rsa_public_key_pem: Mapped[str | None] = mapped_column(Text, nullable=True)
    rsa_private_key_enc: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    rsa_private_key_enc_iv: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    rsa_private_key_kdf_salt: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    rsa_private_key_kdf_iterations: Mapped[int | None] = mapped_column(Integer, nullable=True)


class MfaBackupCode(Base):
    __tablename__ = "mfa_backup_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    code_hash: Mapped[str] = mapped_column(Text, nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="backup_codes")

    __table_args__ = (Index("ix_mfa_backup_codes_user_id", "user_id"),)


class LoginFailure(Base):
    """
    Tracks failed logins for per-username lockout checks in addition to IP-based limiter.
    """

    __tablename__ = "login_failures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    ip: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (Index("ix_login_failures_username_created_at", "username", "created_at"),)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    actor_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    outcome: Mapped[str] = mapped_column(String(32), nullable=False)  # "ALLOW" / "DENY" / "ERROR"
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class ConversionJob(Base):
    __tablename__ = "conversion_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    # source types: youtube/url, local upload, text
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    source_value: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Output
    output_media_file_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    # Digital signature of metadata (RSA-PSS)
    metadata_signature: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    signer_public_key_pem: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (Index("ix_conversion_jobs_owner", "owner_user_id"),)


class MediaFile(Base):
    __tablename__ = "media_files"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    # IPFS / Pinata CID for encrypted blob
    pinata_cid: Mapped[str] = mapped_column(String(128), nullable=False)

    # Hybrid encryption: encrypted AES key (RSA-OAEP), file encrypted with AES-256-GCM.
    encrypted_aes_key: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    aes_gcm_iv: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)

    # Integrity (hash of plaintext or HMAC; stored as hex for portability)
    plaintext_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    plaintext_hash_salt: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_media_files_owner", "owner_user_id"),
        UniqueConstraint("pinata_cid", name="uq_media_files_pinata_cid"),
    )


class AclEntry(Base):
    """
    ACL: subject-object-permission entries, optionally expiring.
    """

    __tablename__ = "acl"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    subject_type: Mapped[str] = mapped_column(String(16), nullable=False)  # "user" or "role"
    subject_id: Mapped[str] = mapped_column(String(64), nullable=False)  # UUID for user, Role for role

    object_type: Mapped[str] = mapped_column(String(32), nullable=False)  # "conversion" / "media"
    object_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    permission: Mapped[Permission] = mapped_column(Enum(Permission, name="permission_enum"), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_acl_subject", "subject_type", "subject_id"),
        Index("ix_acl_object", "object_type", "object_id"),
    )


class ShareLink(Base):
    __tablename__ = "share_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversion_jobs.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


