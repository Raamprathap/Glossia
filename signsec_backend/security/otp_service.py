"""
OTP (One-Time Password) service for registration verification.
Supports sending OTP via email or SMS (SMS is stubbed for demo).
"""

import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP code."""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_email(email: str, otp_code: str) -> bool:
    """
    Send OTP via email.
    In production, integrate with email service (SendGrid, AWS SES, etc.)
    For now, just log it for demo purposes.
    """
    print(f"[EMAIL OTP] To: {email}, Code: {otp_code}")
    # TODO: integrate with actual email service
    # from flask_mail import Mail, Message
    # msg = Message(
    #     subject="Your SignSec Registration OTP",
    #     recipients=[email],
    #     body=f"Your OTP code is: {otp_code}\n\nValid for 10 minutes."
    # )
    # mail.send(msg)
    return True


def send_otp_sms(phone_number: str, otp_code: str) -> bool:
    """
    Send OTP via SMS.
    In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    For now, just stub it for demo purposes.
    """
    print(f"[SMS OTP] To: {phone_number}, Code: {otp_code}")
    # TODO: integrate with actual SMS service
    # import twilio.rest
    # client = twilio.rest.Client(account_sid, auth_token)
    # message = client.messages.create(
    #     body=f"Your SignSec OTP is: {otp_code}. Valid for 10 minutes.",
    #     from_=twilio_number,
    #     to=phone_number
    # )
    return True


def create_otp_secret(otp_code: str, ttl_minutes: int = 10) -> tuple[str, datetime]:
    """
    Create OTP secret and expiry time.
    Returns (otp_code, expiry_datetime)
    """
    expiry = datetime.now(tz=timezone.utc) + timedelta(minutes=ttl_minutes)
    return otp_code, expiry


def verify_otp(stored_otp: str, provided_otp: str, expiry: Optional[datetime] = None) -> bool:
    """
    Verify OTP code and check expiry.
    """
    if not stored_otp or not provided_otp:
        return False
    
    if stored_otp != provided_otp:
        return False
    
    if expiry and datetime.now(tz=timezone.utc) > expiry:
        return False
    
    return True
