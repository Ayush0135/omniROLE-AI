import asyncio
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.engine.supabase_sync import SupabaseSyncEngine

router = APIRouter(prefix="/auth", tags=["Authentication Sync"])


class UserSyncRequest(BaseModel):
    clerk_id: str
    email: EmailStr
    name: str


@router.post("/sync-user")
async def sync_clerk_user_to_supabase(user_in: UserSyncRequest, db: Session = Depends(get_db)):
    """
    Synchronizes Clerk authenticated user details directly into Supabase PostgreSQL database.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user:
        user = User(
            id=user_in.clerk_id,
            email=user_in.email,
            name=user_in.name,
            plan="Pro Developer",
        )
        db.add(user)
    else:
        user.name = user_in.name
    db.commit()
    db.refresh(user)

    # Direct Real-Time Sync to Supabase PostgreSQL via SupabaseSyncEngine
    asyncio.create_task(
        SupabaseSyncEngine.sync_user(
            user_id=user.id,
            email=user.email,
            name=user.name,
            plan=user.plan or "Pro Developer",
            is_admin=user.is_admin or False,
        )
    )

    return {
        "status": "user_synced_to_supabase",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "plan": user.plan,
            "created_at": user.created_at,
        },
    }


# Temporary in-memory store for OTP codes
otp_store = {}


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str


@router.post("/send-otp")
async def send_otp_to_user(payload: OTPRequest):
    import random
    from app.engine.email_engine import EmailEngine

    otp = f"{random.randint(100000, 999999)}"
    otp_store[payload.email] = otp

    success = EmailEngine.send_otp_email(payload.email, otp)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to dispatch OTP email via SMTP."
        )

    return {"message": f"Verification code sent to {payload.email}", "success": True}


@router.post("/verify-otp")
async def verify_user_otp(payload: OTPVerifyRequest):
    stored_otp = otp_store.get(payload.email)
    if not stored_otp or stored_otp != payload.otp_code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code."
        )

    # OTP validated successfully, clear from store
    otp_store.pop(payload.email, None)
    return {"message": "OTP verification successful!", "verified": True}
