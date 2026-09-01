import re
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Role
from app.schemas import RoleCreate, RoleUpdate, RoleResponse
from app.engine.supabase_sync import SupabaseSyncEngine

from pydantic import BaseModel

router = APIRouter(prefix="/roles", tags=["Roles"])


class PromptEnhanceRequest(BaseModel):
    role_name: str
    short_prompt: str


@router.post("/enhance-prompt")
async def enhance_system_prompt(payload: PromptEnhanceRequest):
    from app.engine.llm_provider import OpenAICompatibleProvider
    provider = OpenAICompatibleProvider()
    
    meta_prompt = f"""You are a Master AI Prompt Engineer. Transform the short role prompt below into a comprehensive, high-precision, production-grade AI System Prompt for an expert AI named '{payload.role_name}'.

Short Prompt: "{payload.short_prompt}"

Write ONLY the enhanced system prompt text. Include clear role boundaries, operational rules, reasoning methodology, and response format guidelines."""

    try:
        result = await provider.generate_response(
            system_prompt="You are an expert AI Prompt Optimizer. Output ONLY the enhanced system prompt with zero conversational filler.",
            messages=[{"role": "user", "content": meta_prompt}],
            model_name="gemini-2.5-flash",
            temperature=0.4,
            max_tokens=1024,
        )
        return {"enhanced_prompt": result["response"].strip()}
    except Exception as e:
        # Fallback enhanced template if API fails
        return {
            "enhanced_prompt": f"You are {payload.role_name}, a world-class domain expert. {payload.short_prompt}\n\n### Operational Directives:\n1. Maintain absolute accuracy, logical precision, and empirical rigor.\n2. Structure all output using clean Markdown, step-by-step reasoning, and actionable insights.\n3. Utilize active connectors to verify data before answering."
        }


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)


@router.get("", response_model=List[RoleResponse])
def list_roles(
    q: Optional[str] = Query(None, description="Search query for role name, description, or expertise"),
    status: Optional[str] = Query(None, description="Filter by status: active, draft, archived"),
    db: Session = Depends(get_db),
):
    query = db.query(Role)
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
async def create_role(role_in: RoleCreate, db: Session = Depends(get_db)):
    from app.models import User
    
    # Check if Pro / Enterprise plan is active, else enforce Free Tier 2 Role Limit
    pro_user = db.query(User).filter((User.plan == "Pro Developer") | (User.plan == "Enterprise")).first()
    total_roles = db.query(Role).count()
    if not pro_user and total_roles >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Free Tier is limited to creating a maximum of 2 AI Roles. Please upgrade to Pro for 25 AI Roles."
        )

    base_slug = slugify(role_in.name)
    slug = base_slug
    counter = 1

    # Ensure unique slug
    while db.query(Role).filter(Role.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Force Web Search connector only for Free Tier users
    connectors = role_in.connectors or ["web_search"]
    if not pro_user:
        connectors = ["web_search"]

    role = Role(
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
def get_role(id_or_slug: str, db: Session = Depends(get_db)):
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
    return role


@router.put("/{id_or_slug}", response_model=RoleResponse)
async def update_role(id_or_slug: str, role_in: RoleUpdate, db: Session = Depends(get_db)):
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
async def delete_role(id_or_slug: str, db: Session = Depends(get_db)):
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
