from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import User, Role, Conversation, Message, SearchHistory, APIKey, UsageRecord
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["User Dashboard"])


@router.get("/user-stats")
def get_user_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve strictly isolated personal metrics, search history, custom roles, and token stats for the logged-in user."""
    user_id = current_user.id
    monthly_limit = current_user.monthly_token_limit or 100000
    used_tokens = current_user.tokens_used_this_month or 0
    percentage = min(100.0, round((used_tokens / monthly_limit) * 100, 1)) if monthly_limit > 0 else 0.0
    remaining = max(0, monthly_limit - used_tokens)

    # 1. Custom AI roles created by THIS user only
    user_roles = (
        db.query(Role)
        .filter(Role.user_id == user_id)
        .order_by(desc(Role.created_at))
        .all()
    )
    roles_list = [
        {
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "description": r.description,
            "icon": r.icon or "🤖",
            "model_name": r.model_name or "gemini-1.5-pro",
            "connectors": r.connectors or ["web_search"],
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in user_roles[:8]
    ]

    # 2. Search & RAG Query History strictly for THIS user
    user_searches = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == user_id)
        .order_by(desc(SearchHistory.created_at))
        .limit(15)
        .all()
    )
    search_list = [
        {
            "id": s.id,
            "query_text": s.query_text,
            "search_type": s.search_type,
            "sources_count": len(s.sources_cited or []),
            "sources_cited": s.sources_cited or [],
            "conversation_id": s.conversation_id,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in user_searches
    ]

    # 3. Recent conversations initiated by THIS user
    user_convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(desc(Conversation.updated_at))
        .limit(6)
        .all()
    )
    conv_list = []
    for c in user_convs:
        role = db.query(Role).filter(Role.id == c.role_id).first()
        msg_count = db.query(Message).filter(Message.conversation_id == c.id).count()
        conv_list.append({
            "id": c.id,
            "title": c.title or "Conversation",
            "role_id": c.role_id,
            "role_name": role.name if role else "AI Assistant",
            "role_icon": role.icon if role and role.icon else "🤖",
            "message_count": msg_count,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        })

    # 4. Active API Keys for THIS user
    api_keys_count = (
        db.query(APIKey)
        .filter(APIKey.user_id == user_id, APIKey.status == "active")
        .count()
    )

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "plan": current_user.plan or "Free",
            "avatar_url": current_user.avatar_url,
            "is_verified": current_user.is_verified,
        },
        "token_metrics": {
            "used": used_tokens,
            "limit": monthly_limit,
            "percentage": percentage,
            "remaining": remaining,
            "tier": current_user.plan or "Free",
        },
        "counts": {
            "my_roles": len(user_roles),
            "my_conversations": db.query(Conversation).filter(Conversation.user_id == user_id).count(),
            "my_searches": db.query(SearchHistory).filter(SearchHistory.user_id == user_id).count(),
            "my_api_keys": api_keys_count,
        },
        "search_history": search_list,
        "recent_conversations": conv_list,
        "my_roles": roles_list,
    }
