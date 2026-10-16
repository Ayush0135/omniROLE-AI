import secrets
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import APIKey
from app.schemas import APIKeyCreate, APIKeyResponse
from app.api.deps import get_optional_user

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.get("", response_model=List[APIKeyResponse])
def list_api_keys(
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    if not user_id:
        return []
    return db.query(APIKey).filter(APIKey.user_id == user_id).order_by(APIKey.created_at.desc()).all()


@router.post("", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    key_in: APIKeyCreate,
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to create API keys. Please sign in."
        )

    random_part = secrets.token_hex(16)
    raw_key = f"omni_live_{random_part}"
    key_prefix = raw_key[:12] + "..."
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    api_key = APIKey(
        user_id=user_id,
        name=key_in.name,
        key_prefix=key_prefix,
        key_hash=key_hash,
        status="active",
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    response_data = APIKeyResponse.model_validate(api_key)
    response_data.raw_key = raw_key
    return response_data


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(
    key_id: str,
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )
    api_key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == user_id).first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API Key not found or does not belong to your account.",
        )
    api_key.status = "revoked"
    db.commit()
    return None
