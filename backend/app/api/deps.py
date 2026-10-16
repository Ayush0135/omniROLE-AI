import hashlib
from datetime import datetime
from typing import Optional
from fastapi import Header, HTTPException, Depends, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import APIKey, User
from app.api.auth import verify_user_token


def get_optional_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
    db: Session = Depends(get_db),
) -> Optional[str]:
    """Extract authenticated user id from Authorization header, X-Auth-Token, X-User-Id, or omni_token cookie."""
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif x_auth_token:
        token = x_auth_token.strip()
    elif request.cookies.get("omni_token"):
        token = request.cookies.get("omni_token").strip()

    if token:
        payload = verify_user_token(token)
        if payload and payload.get("user_id"):
            return payload.get("user_id")

    if x_user_id and x_user_id.strip():
        return x_user_id.strip()

    return None


def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
    db: Session = Depends(get_db),
) -> User:
    """Require valid authenticated User."""
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
            detail="Authentication required. Please sign in.",
        )

    payload = verify_user_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please sign in again.",
        )

    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    return user


def verify_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> APIKey:
    raw_key = None
    if x_api_key:
        raw_key = x_api_key
    elif authorization:
        if authorization.startswith("Bearer "):
            raw_key = authorization.replace("Bearer ", "").strip()
        else:
            raw_key = authorization.strip()

    if not raw_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key required. Provide X-API-Key header or Bearer token.",
        )

    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    api_key_obj = db.query(APIKey).filter(APIKey.key_hash == key_hash, APIKey.status == "active").first()

    if not api_key_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API Key.",
        )

    api_key_obj.last_used_at = datetime.utcnow()
    db.commit()

    return api_key_obj
