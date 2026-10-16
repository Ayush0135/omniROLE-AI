from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Role, RoleRLProfile
from app.schemas import RoleCreate, RoleUpdate, RoleResponse, KnowledgeDocumentCreate
from app.engine.prompt_builder import PromptBuilder
from app.engine.supabase_sync import SupabaseSyncEngine
from app.api.deps import get_optional_user
from pydantic import BaseModel
import re

class PromptEnhanceRequest(BaseModel):
    prompt: str
    role_type: Optional[str] = "general"

class PromptEnhanceResponse(BaseModel):
    enhanced_prompt: str

router = APIRouter(prefix="/roles", tags=["Roles"])


def slugify(text: str) -> str:
    text = text.lower()
    return re.sub(r"[\s_]+", "-", re.sub(r"[^\w\s-]", "", text)).strip("-")


@router.post("/enhance-prompt", response_model=PromptEnhanceResponse)
async def enhance_prompt_endpoint(payload: PromptEnhanceRequest):
    """
    Direct endpoint to elevate system prompts using advanced meta-prompting strategies.
    """
    enhanced = await PromptBuilder.enhance_system_prompt(payload.prompt, payload.role_type)
    return PromptEnhanceResponse(enhanced_prompt=enhanced)


@router.get("", response_model=List[RoleResponse])
def list_roles(
    q: Optional[str] = Query(None, description="Search query for role name, description, or expertise"),
    status: Optional[str] = Query(None, description="Filter by status: active, draft, archived"),
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    query = db.query(Role)
    
    # Enforce multi-tenant user isolation:
    # Users can view default platform roles (user_id IS NULL) + their own custom created roles
    if user_id:
        query = query.filter(or_(Role.user_id == user_id, Role.user_id.is_(None)))
    else:
        # Unauthenticated users only see public system default roles
        query = query.filter(Role.user_id.is_(None))

    if status:
        query = query.filter(Role.status == status)
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            (Role.name.ilike(search_pattern))
            | (Role.description.ilike(search_pattern))
            | (Role.system_prompt.ilike(search_pattern))
        )
    return query.order_by(Role.created_at.desc()).all()


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_in: RoleCreate,
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    from app.models import User
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to create custom AI Personas. Please sign in."
        )

    user = db.query(User).filter(User.id == user_id).first()
    is_pro = user and user.plan in ["Pro Developer", "Enterprise"]
    
    # Calculate how many custom roles this specific user has created
    user_role_count = db.query(Role).filter(Role.user_id == user_id).count()
    if not is_pro and user_role_count >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Free Tier allows creating up to 2 custom AI Roles. Please upgrade to Pro Developer for 25 roles."
        )

    base_slug = slugify(role_in.name)
    slug = base_slug
    counter = 1

    # Ensure unique slug
    while db.query(Role).filter(Role.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    connectors = role_in.connectors or ["web_search"]
    if not is_pro:
        connectors = ["web_search"]

    role = Role(
        user_id=user_id,
        name=role_in.name,
        slug=slug,
        description=role_in.description,
        icon=role_in.icon,
        system_prompt=role_in.system_prompt,
        expertise=role_in.expertise,
        connectors=connectors,
        provider=role_in.provider,
        model_name=role_in.model_name,
        temperature=role_in.temperature,
        max_tokens=role_in.max_tokens,
        response_style=role_in.response_style,
        memory_enabled=role_in.memory_enabled,
        status=role_in.status,
    )
    db.add(role)
    db.commit()
    db.refresh(role)

    # Initialize RL Profile
    rl_profile = RoleRLProfile(role_id=role.id)
    db.add(rl_profile)
    db.commit()

    # Direct Real-Time Sync to Supabase PostgreSQL
    await SupabaseSyncEngine.sync_role({
        "id": role.id,
        "name": role.name,
        "slug": role.slug,
        "description": role.description,
        "icon": role.icon,
        "system_prompt": role.system_prompt,
        "expertise": role.expertise or [],
        "connectors": role.connectors or ["vector_rag", "web_search"],
        "provider": role.provider,
        "model_name": role.model_name,
        "temperature": role.temperature,
        "max_tokens": role.max_tokens,
        "response_style": role.response_style,
        "memory_enabled": role.memory_enabled,
        "status": role.status,
    })

    return role


@router.get("/{id_or_slug}", response_model=RoleResponse)
def get_role(
    id_or_slug: str,
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    role = (
        db.query(Role)
        .filter((Role.id == id_or_slug) | (Role.slug == id_or_slug))
        .first()
    )
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Role '{id_or_slug}' not found.",
        )
    # Strict isolation: If role is custom and belongs to another user, deny access
    if role.user_id is not None and role.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This is a private custom AI Persona."
        )
    return role


@router.put("/{id_or_slug}", response_model=RoleResponse)
async def update_role(
    id_or_slug: str,
    role_in: RoleUpdate,
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    role = (
        db.query(Role)
        .filter((Role.id == id_or_slug) | (Role.slug == id_or_slug))
        .first()
    )
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Role '{id_or_slug}' not found.",
        )

    # Prevent editing default platform templates or another user's role
    if role.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System template roles cannot be modified. Duplicate it to create your own editable copy."
        )
    if not user_id or role.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. You can only modify custom AI personas you created."
        )

    update_data = role_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != role.name:
        base_slug = slugify(update_data["name"])
        slug = base_slug
        counter = 1
        while db.query(Role).filter(Role.slug == slug, Role.id != role.id).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        role.slug = slug

    for field, value in update_data.items():
        setattr(role, field, value)

    db.commit()
    db.refresh(role)

    await SupabaseSyncEngine.sync_role({
        "id": role.id,
        "name": role.name,
        "slug": role.slug,
        "description": role.description,
        "icon": role.icon,
        "system_prompt": role.system_prompt,
        "expertise": role.expertise or [],
        "connectors": role.connectors or ["vector_rag", "web_search"],
        "provider": role.provider,
        "model_name": role.model_name,
        "temperature": role.temperature,
        "max_tokens": role.max_tokens,
        "response_style": role.response_style,
        "memory_enabled": role.memory_enabled,
        "status": role.status,
    })

    return role


@router.delete("/{id_or_slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    id_or_slug: str,
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    role = (
        db.query(Role)
        .filter((Role.id == id_or_slug) | (Role.slug == id_or_slug))
        .first()
    )
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Role '{id_or_slug}' not found.",
        )

    if role.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System template roles cannot be deleted."
        )
    if not user_id or role.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. You can only delete custom AI personas you created."
        )

    # Safely delete associated usage records, connector logs, and conversations
    from app.models import Conversation, Message, UsageRecord, ConnectorLog
    db.query(UsageRecord).filter(UsageRecord.role_id == role.id).delete(synchronize_session=False)
    db.query(ConnectorLog).filter(ConnectorLog.role_id == role.id).delete(synchronize_session=False)
    
    conversations = db.query(Conversation).filter(Conversation.role_id == role.id).all()
    for conv in conversations:
        db.query(Message).filter(Message.conversation_id == conv.id).delete(synchronize_session=False)
        db.delete(conv)
        
    db.delete(role)
    db.commit()

    await SupabaseSyncEngine.delete_role(role.id)
    return None


@router.post("/{id_or_slug}/rag/documents")
async def add_rag_document(
    id_or_slug: str,
    doc_in: KnowledgeDocumentCreate,
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    role = (
        db.query(Role)
        .filter((Role.id == id_or_slug) | (Role.slug == id_or_slug))
        .first()
    )
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Role '{id_or_slug}' not found.",
        )

    # Strict isolation: Only owner can upload RAG documents to custom roles
    if role.user_id is not None and role.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. You can only add knowledge documents to your own AI personas."
        )

    paragraphs = [p.strip() for p in doc_in.content.split("\n\n") if len(p.strip()) > 10]
    if not paragraphs:
        paragraphs = [doc_in.content.strip()]

    from app.engine.vector_engine import VectorEngine
    from app.models import QueryEmbedding

    created_ids = []
    for p in paragraphs:
        emb_vec = await VectorEngine.generate_embedding(p)
        rec = QueryEmbedding(
            role_id=role.id,
            query_text=p,
            document_title=doc_in.title or "Knowledge Document",
            embedding=emb_vec,
        )
        db.add(rec)
        db.flush()
        created_ids.append(rec.id)

    db.commit()

    return {
        "status": "success",
        "role_id": role.id,
        "title": doc_in.title or "Knowledge Document",
        "chunks_indexed": len(created_ids),
        "message": f"Successfully indexed {len(created_ids)} knowledge chunk(s) into vector RAG memory.",
    }


@router.get("/{id_or_slug}/rag/documents")
def list_rag_documents(
    id_or_slug: str,
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    role = (
        db.query(Role)
        .filter((Role.id == id_or_slug) | (Role.slug == id_or_slug))
        .first()
    )
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Role '{id_or_slug}' not found.",
        )

    # Strict isolation
    if role.user_id is not None and role.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to view knowledge documents for this private AI persona."
        )

    from app.models import QueryEmbedding
    embeddings = (
        db.query(QueryEmbedding)
        .filter(QueryEmbedding.role_id == role.id)
        .order_by(QueryEmbedding.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": e.id,
            "title": getattr(e, "document_title", None) or "Grounding Vector Chunk",
            "snippet": e.query_text[:160] + "..." if len(e.query_text) > 160 else e.query_text,
            "created_at": e.created_at,
        }
        for e in embeddings
    ]
