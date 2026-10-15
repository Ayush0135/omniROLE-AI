import hashlib
from datetime import datetime
from typing import Optional
from fastapi import Header, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import APIKey


def get_optional_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> Optional[str]:
    """Extract authenticated Clerk user id if present."""
    if not x_user_id:
        return None
    return x_user_id.strip()


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


