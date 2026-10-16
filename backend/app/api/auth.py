import random
import smtplib
import time
import base64
import json
import hmac
import hashlib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, status, Header, Response, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/auth", tags=["User Authentication"])

# ── Token & Password Utilities ────────────────────────────────────────────────
def hash_password(password: str) -> str:
    """Hash password using salted SHA-256."""
    salt = settings.SECRET_KEY[:16]
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()


def create_user_token(user: User) -> str:
    """Generate signed JWT token valid for 7 days."""
    payload = {
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "plan": user.plan,
        "is_admin": bool(user.is_admin),
        "iat": int(time.time()),
        "exp": int(time.time()) + (60 * 60 * 24 * 7),
    }
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').decode().rstrip("=")
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    sig_input = f"{header}.{body}"
    sig = hmac.new(settings.SECRET_KEY.encode(), sig_input.encode(), hashlib.sha256).hexdigest()
    return f"{header}.{body}.{sig}"


def verify_user_token(token: str) -> Optional[dict]:
    """Verify and decode signed JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        sig_input = f"{header}.{body}"
        expected_sig = hmac.new(settings.SECRET_KEY.encode(), sig_input.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        padded = body + "=" * ((4 - len(body) % 4) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded).decode())
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def send_otp_email(to_email: str, otp: str, user_name: str = "User"):
    """Send 6-digit OTP verification code using Gmail App Password SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🔐 Your OmniRole Verification Code: {otp}"
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #08090d; margin: 0; padding: 24px; color: #f1f5f9; }}
        .card {{ max-width: 480px; margin: 0 auto; background: #0e111a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 36px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4); }}
        .title {{ font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 8px 0; }}
        .sub {{ font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 24px 0; }}
        .otp-box {{ background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
        .otp-code {{ font-size: 36px; font-weight: 800; color: #6366f1; letter-spacing: 8px; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; }}
        .expiry {{ font-size: 12px; color: #64748b; text-align: center; margin-top: 8px; }}
        .footer {{ border-top: 1px solid rgba(255, 255, 255, 0.08); margin-top: 28px; padding-top: 20px; font-size: 12px; color: #64748b; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div style="margin-bottom: 20px; font-weight: 800; font-size: 18px; color: #6366f1;">
          ✦ OmniRole AI
        </div>
        <h1 class="title">Verify your email address</h1>
        <p class="sub">Hi {user_name}, welcome to OmniRole AI. Enter this verification code to complete your sign in. This code is valid for <strong>10 minutes</strong>.</p>
        
        <div class="otp-box">
          <div class="otp-code">{otp}</div>
          <div class="expiry">Expires in 10 minutes</div>
        </div>

        <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">If you didn't request this verification code, you can safely ignore this email.</p>
        
        <div class="footer">
          OmniRole AI • Autonomous AI Persona Studio
        </div>
      </div>
    </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
    except Exception as e:
        print(f"[AUTH SMTP ERROR] Failed to send email to {to_email}: {e}")
        pass


# ── Request / Response Schemas ────────────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: Optional[str] = None
    otp_code: Optional[str] = None

    def get_code(self) -> str:
        return (self.otp or self.otp_code or "").strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None


class SendOtpRequest(BaseModel):
    email: EmailStr


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = None


# ── Auth Endpoints ────────────────────────────────────────────────────────────
@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user account and send an OTP verification email."""
    email_clean = req.email.strip().lower()
    name_clean = req.name.strip()
    
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in instead.",
        )

    otp = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    p_hash = hash_password(req.password)

    if existing_user:
        user = existing_user
        user.name = name_clean
        user.password_hash = p_hash
        user.otp_code = otp
        user.otp_expires_at = expires_at
    else:
        user = User(
            email=email_clean,
            name=name_clean,
            password_hash=p_hash,
            otp_code=otp,
            otp_expires_at=expires_at,
            is_verified=False,
            status="pending_verification",
            plan="Free Starter",
        )
        db.add(user)

    db.commit()
    db.refresh(user)

    send_otp_email(to_email=email_clean, otp=otp, user_name=name_clean)

    return {
        "status": "success",
        "message": f"Verification code sent to {email_clean}",
        "email": email_clean,
    }


@router.post("/send-otp")
def send_otp(req: SendOtpRequest, db: Session = Depends(get_db)):
    """Resend 6-digit OTP code to the user's email."""
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    otp = str(random.randint(100000, 999999))
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    send_otp_email(to_email=email_clean, otp=otp, user_name=user.name)

    return {
        "status": "success",
        "message": f"New verification code sent to {email_clean}",
        "email": email_clean,
    }


@router.post("/verify-otp")
def verify_otp(req: VerifyOtpRequest, response: Response, db: Session = Depends(get_db)):
    """Verify 6-digit OTP and issue JWT session token and auth cookie."""
    email_clean = req.email.strip().lower()
    otp_clean = req.get_code()

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if not user.otp_code or user.otp_code != otp_clean:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please check your email.")

    if user.otp_expires_at and user.otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    user.is_verified = True
    user.status = "active"
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()
    db.refresh(user)

    token = create_user_token(user)

    # Set cross-browser session cookie
    response.set_cookie(
        key="omni_token",
        value=token,
        max_age=60 * 60 * 24 * 7,
        httponly=False,
        samesite="lax",
        path="/",
    )

    return {
        "status": "success",
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "plan": user.plan,
            "is_admin": bool(user.is_admin),
            "status": user.status,
            "avatar_url": getattr(user, "avatar_url", None),
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
    }


@router.post("/login")
def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Log in via Password or request OTP."""
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    # If password is provided, verify it
    if req.password:
        p_hash = hash_password(req.password)
        if user.password_hash != p_hash:
            raise HTTPException(status_code=401, detail="Incorrect password. Please try again or sign in with OTP.")

        if not user.is_verified:
            otp = str(random.randint(100000, 999999))
            user.otp_code = otp
            user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
            db.commit()
            send_otp_email(to_email=email_clean, otp=otp, user_name=user.name)
            return {
                "requires_otp": True,
                "message": "Email verification required. We've sent a 6-digit code to your email.",
                "email": email_clean,
            }

        token = create_user_token(user)

        # Set cross-browser session cookie
        response.set_cookie(
            key="omni_token",
            value=token,
            max_age=60 * 60 * 24 * 7,
            httponly=False,
            samesite="lax",
            path="/",
        )

        return {
            "status": "success",
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "plan": user.plan,
                "is_admin": bool(user.is_admin),
                "status": user.status,
                "avatar_url": getattr(user, "avatar_url", None),
                "created_at": user.created_at.isoformat() if user.created_at else None,
            },
        }

    # Passwordless OTP login
    otp = str(random.randint(100000, 999999))
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    send_otp_email(to_email=email_clean, otp=otp, user_name=user.name)

    return {
        "requires_otp": True,
        "message": f"Verification code sent to {email_clean}",
        "email": email_clean,
    }


@router.post("/logout")
def logout(response: Response):
    """Log out and clear session cookie."""
    response.delete_cookie(key="omni_token", path="/")
    return {"status": "success", "message": "Successfully signed out."}


def get_current_user_from_header(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to extract and verify logged-in User."""
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif x_auth_token:
        token = x_auth_token.strip()
    elif request.cookies.get("omni_token"):
        token = request.cookies.get("omni_token").strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )

    payload = verify_user_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
        )

    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )

    return user


@router.get("/me")
def get_my_profile(user: User = Depends(get_current_user_from_header)):
    """Return profile details for the currently authenticated user."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "plan": user.plan,
        "is_admin": bool(user.is_admin),
        "status": user.status,
        "avatar_url": getattr(user, "avatar_url", None),
        "monthly_token_limit": user.monthly_token_limit,
        "tokens_used_this_month": user.tokens_used_this_month,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.put("/profile")
def update_my_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    """Update profile details (name, avatar, or password)."""
    if req.name and req.name.strip():
        user.name = req.name.strip()
    if req.avatar_url is not None:
        user.avatar_url = req.avatar_url.strip()
    if req.password:
        if len(req.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
        user.password_hash = hash_password(req.password)

    db.commit()
    db.refresh(user)

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "plan": user.plan,
            "avatar_url": getattr(user, "avatar_url", None),
        },
    }
