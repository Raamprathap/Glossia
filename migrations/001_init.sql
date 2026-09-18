-- SignSec Security Lab - PostgreSQL schema (baseline)
-- This SQL is intentionally explicit for viva/demo and rubric marking.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('ADMIN', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE permission_enum AS ENUM (
        'CREATE_CONVERSION',
        'VIEW_OWN_CONVERSIONS',
        'VIEW_ALL_CONVERSIONS',
        'DELETE_OWN_CONVERSIONS',
        'DELETE_ANY_CONVERSIONS',
        'DOWNLOAD_VIDEO',
        'SHARE_VIDEO',
        'MANAGE_USERS',
        'VIEW_AUDIT_LOGS',
        'UPLOAD_FILE',
        'ACCESS_CLOUD_STORAGE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    role role_enum NOT NULL DEFAULT 'USER',
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
    otp_secret VARCHAR(128),
    otp_expiry TIMESTAMPTZ,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_totp_secret VARCHAR(64),
    mfa_totp_secret_pending VARCHAR(64),
    rsa_public_key_pem TEXT,
    rsa_private_key_enc BYTEA,
    rsa_private_key_enc_iv BYTEA,
    rsa_private_key_kdf_salt BYTEA,
    rsa_private_key_kdf_iterations INTEGER
);

CREATE TABLE IF NOT EXISTS mfa_backup_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_mfa_backup_codes_user_id ON mfa_backup_codes(user_id);

CREATE TABLE IF NOT EXISTS login_failures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL,
    ip VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_login_failures_username_created_at ON login_failures(username, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID,
    actor_ip VARCHAR(64),
    action VARCHAR(120) NOT NULL,
    outcome VARCHAR(32) NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type VARCHAR(32) NOT NULL,
    source_value TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    output_media_file_id UUID,
    metadata_signature BYTEA,
    signer_public_key_pem TEXT
);
CREATE INDEX IF NOT EXISTS ix_conversion_jobs_owner ON conversion_jobs(owner_user_id);

CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pinata_cid VARCHAR(128) NOT NULL UNIQUE,
    encrypted_aes_key BYTEA NOT NULL,
    aes_gcm_iv BYTEA NOT NULL,
    plaintext_sha256 CHAR(64) NOT NULL,
    plaintext_hash_salt BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_media_files_owner ON media_files(owner_user_id);

CREATE TABLE IF NOT EXISTS acl (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_type VARCHAR(16) NOT NULL,
    subject_id VARCHAR(64) NOT NULL,
    object_type VARCHAR(32) NOT NULL,
    object_id UUID NOT NULL,
    permission permission_enum NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_acl_subject ON acl(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS ix_acl_object ON acl(object_type, object_id);

CREATE TABLE IF NOT EXISTS share_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversion_id UUID NOT NULL REFERENCES conversion_jobs(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


