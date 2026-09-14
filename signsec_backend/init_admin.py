"""
Initialize default admin user for SignSec application.
Run this after database is set up to create the initial admin account.

Usage:
    python -m signsec_backend.init_admin
"""

import sys
from sqlalchemy import select

from signsec_backend.db import SessionLocal, Base, engine
from signsec_backend.models import User, Role
from signsec_backend.security.passwords import pbkdf2_hash_password, validate_password_policy
from signsec_backend.security.crypto_keys import encrypt_private_key_with_password, generate_rsa_keypair
from signsec_backend.config import SETTINGS


def create_admin_user():
    """Create default admin user."""
    
    # Admin credentials (constant)
    ADMIN_EMAIL = "admin@example.edu"
    ADMIN_USERNAME = "admin"
    ADMIN_PASSWORD = "StrongPass!234"
    
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.execute(select(User).where(User.email == ADMIN_EMAIL)).scalar_one_or_none()
        if admin:
            print(f"Admin user already exists: {admin.email}")
            return
        
        # Validate password policy
        try:
            validate_password_policy(ADMIN_PASSWORD)
        except ValueError as e:
            print(f"Password policy validation failed: {e}")
            sys.exit(1)
        
        # Create admin account
        ph = pbkdf2_hash_password(ADMIN_PASSWORD, iterations=SETTINGS.pbkdf2_iterations)
        pub_pem, priv_pem = generate_rsa_keypair(bits=SETTINGS.rsa_key_bits)
        enc = encrypt_private_key_with_password(private_pem=priv_pem, password=ADMIN_PASSWORD)
        
        admin = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            password_hash=ph,
            role=Role.ADMIN,
            otp_verified=True,  # Admin is pre-created, no OTP needed
            rsa_public_key_pem=pub_pem,
            rsa_private_key_enc=enc.ciphertext,
            rsa_private_key_enc_iv=enc.iv,
            rsa_private_key_kdf_salt=enc.kdf_salt,
            rsa_private_key_kdf_iterations=enc.kdf_iterations,
        )
        
        db.add(admin)
        db.commit()
        
        print(f"✓ Admin user created successfully!")
        print(f"  Email: {ADMIN_EMAIL}")
        print(f"  Username: {ADMIN_USERNAME}")
        print(f"  Password: {ADMIN_PASSWORD}")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating admin user: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    # Create tables if not exist
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized.")
    
    # Create admin user
    create_admin_user()
    print("\nAdmin initialization complete!")
