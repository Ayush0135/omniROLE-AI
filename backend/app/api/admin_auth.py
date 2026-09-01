import random
import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import hmac
import hashlib
import json
import base64

from app.config import settings

router = APIRouter(prefix="/admin-auth", tags=["Admin Authentication"])

# ── Config ────────────────────────────────────────────────────────────────────
ADMIN_EMAIL = "ayush.kashyap7155@gmail.com"
OTP_EXPIRE_SECONDS = 300  # 5 minutes
ADMIN_TOKEN_EXPIRE_SECONDS = 60 * 60 * 8  # 8 hours

# In-memory OTP store: { email: { otp, expires_at } }
_otp_store: Dict[str, dict] = {}


# ── Schemas ───────────────────────────────────────────────────────────────────
class SendOTPRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class AdminTokenResponse(BaseModel):
    token: str
    email: str
    expires_in: int


# ── Helpers ───────────────────────────────────────────────────────────────────
def _make_token(email: str) -> str:
    """Create a simple signed admin session token (header.payload.signature)."""
    payload = {
        "email": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + ADMIN_TOKEN_EXPIRE_SECONDS,
        "role": "admin",
    }
    header = base64.urlsafe_b64encode(b'{"alg":"HS256"}').decode().rstrip("=")
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    sig_input = f"{header}.{body}"
    sig = hmac.new(
        settings.SECRET_KEY.encode(),
        sig_input.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{header}.{body}.{sig}"


def verify_admin_token(token: str) -> bool:
    """Verify a token is valid and not expired."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return False
        header, body, sig = parts
        sig_input = f"{header}.{body}"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(),
            sig_input.encode(),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return False
        payload = json.loads(base64.urlsafe_b64decode(body + "=="))
        if payload.get("exp", 0) < time.time():
            return False
        if payload.get("role") != "admin":
            return False
        return True
    except Exception:
        return False


def _send_otp_email(to_email: str, otp: str):
    """Send OTP email using SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🔐 OmniAdmin OTP: {otp}"
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email

    html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f17; border: 1px solid rgba(245,158,11,0.2); border-radius: 16px; padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 12px 20px;">
          <span style="font-size: 22px; font-weight: 900; color: #f59e0b; letter-spacing: 2px; font-family: monospace;">OMNIADMIN</span>
        </div>
      </div>
      <h2 style="color: #fef3c7; font-size: 20px; margin-bottom: 8px;">Admin Login OTP</h2>
      <p style="color: #78716c; font-size: 14px; margin-bottom: 28px;">Use the code below to access the OmniAdmin Control Panel. This code expires in <strong style="color: #fbbf24;">5 minutes</strong>.</p>
      <div style="background: rgba(245,158,11,0.08); border: 2px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
        <span style="font-size: 42px; font-weight: 900; color: #f59e0b; letter-spacing: 12px; font-family: monospace;">{otp}</span>
      </div>
      <p style="color: #57534e; font-size: 12px;">If you did not request this OTP, ignore this email. Your account is safe.</p>
      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0;" />
      <p style="color: #44403c; font-size: 11px; text-align: center;">OmniRole AI • Admin Security System</p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/send-otp")
def send_admin_otp(req: SendOTPRequest):
    """Send OTP to the admin email. Rejects all other emails immediately."""
    if req.email.strip().lower() != ADMIN_EMAIL.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This email is not authorized to access the admin panel.",
        )

    otp = str(random.randint(100000, 999999))
    _otp_store[ADMIN_EMAIL] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRE_SECONDS,
    }

    try:
        _send_otp_email(ADMIN_EMAIL, otp)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP email: {str(e)}",
        )

    return {"message": f"OTP sent to {ADMIN_EMAIL}", "expires_in": OTP_EXPIRE_SECONDS}


@router.post("/verify-otp", response_model=AdminTokenResponse)
def verify_admin_otp(req: VerifyOTPRequest):
    """Verify the OTP and return an admin session token."""
    if req.email.strip().lower() != ADMIN_EMAIL.lower():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized email.")

    record = _otp_store.get(ADMIN_EMAIL)
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No OTP was requested. Please request a new OTP first.")

    if time.time() > record["expires_at"]:
        del _otp_store[ADMIN_EMAIL]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Please request a new one.")

    if record["otp"] != req.otp.strip():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect OTP. Please try again.")

    # OTP valid — clear it (one-time use)
    del _otp_store[ADMIN_EMAIL]

    token = _make_token(ADMIN_EMAIL)
    return AdminTokenResponse(
        token=token,
        email=ADMIN_EMAIL,
        expires_in=ADMIN_TOKEN_EXPIRE_SECONDS,
    )


@router.post("/verify-token")
def check_admin_token(payload: dict):
    """Frontend calls this to validate a stored admin token."""
    token = payload.get("token", "")
    if not verify_admin_token(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired admin token.")
    return {"valid": True}
