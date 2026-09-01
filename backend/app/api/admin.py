from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.database import get_db
from app.models import User, Role, UsageRecord, ConnectorLog, Announcement, APIKey

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


# --- Schemas ---
class UserUpdateRequest(BaseModel):
    plan: Optional[str] = None
    is_admin: Optional[bool] = None
    status: Optional[str] = None
    monthly_token_limit: Optional[int] = None


class AnnouncementCreateRequest(BaseModel):
    title: str
    message: str
    banner_type: Optional[str] = "info"  # "info", "warning", "promo"
    action_url: Optional[str] = None
    is_active: Optional[bool] = True


# --- Endpoints ---
@router.get("/overview")
def get_admin_overview(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_roles = db.query(Role).count()
    total_api_keys = db.query(APIKey).count()
    
    usage_stats = db.query(
        func.sum(UsageRecord.tokens_total).label("total_tokens"),
        func.sum(UsageRecord.tokens_prompt).label("prompt_tokens"),
        func.sum(UsageRecord.tokens_completion).label("completion_tokens"),
        func.avg(UsageRecord.latency_ms).label("avg_latency"),
        func.count(UsageRecord.id).label("total_requests"),
    ).first()

    total_tokens = usage_stats.total_tokens or 0
    prompt_tokens = usage_stats.prompt_tokens or 0
    completion_tokens = usage_stats.completion_tokens or 0
    avg_latency = round(usage_stats.avg_latency or 0.0, 2)
    total_requests = usage_stats.total_requests or 0

    total_connector_executions = db.query(ConnectorLog).count()

    return {
        "kpi": {
            "total_users": total_users,
            "total_roles": total_roles,
            "total_api_keys": total_api_keys,
            "total_tokens_burned": total_tokens,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_requests": total_requests,
            "average_latency_ms": avg_latency,
            "total_connector_runs": total_connector_executions,
        },
        "system_status": {
            "database": "connected",
            "supabase_vector": "active (pgvector 768d)",
            "active_providers": ["Groq LPU (GPT-OSS 120B)", "Google Gemini 2.5 Flash", "OpenRouter (Qwen 2.5 72B)"],
        }
    }


@router.get("/users")
def list_users(
    query: Optional[str] = None,
    plan: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    q = db.query(User)
    if query:
        q = q.filter((User.email.ilike(f"%{query}%")) | (User.name.ilike(f"%{query}%")))
    if plan:
        q = q.filter(User.plan == plan)
    
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    user_list = []
    for u in users:
        role_count = db.query(Role).filter(Role.user_id == u.id).count()
        user_list.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "plan": u.plan,
            "is_admin": u.is_admin or False,
            "status": u.status or "active",
            "monthly_token_limit": u.monthly_token_limit or 500000,
            "tokens_used_this_month": u.tokens_used_this_month or 0,
            "roles_count": role_count,
            "created_at": u.created_at,
        })

    return {"total": total, "users": user_list}


class UserUpdateRequest(BaseModel):
    plan: Optional[str] = None
    is_admin: Optional[bool] = None
    status: Optional[str] = None
    monthly_token_limit: Optional[int] = None
    web_search_allowed: Optional[bool] = None
    code_executor_allowed: Optional[bool] = None
    vector_rag_allowed: Optional[bool] = None


class CustomPlanRequest(BaseModel):
    name: str
    price_inr: float
    monthly_token_limit: Optional[int] = 500000
    max_roles: Optional[int] = 25
    connectors_allowed: Optional[List[str]] = ["web_search", "code_executor", "vector_rag"]
    badge_text: Optional[str] = "LIMITED OFFER"
    offer_user_email: Optional[str] = None
    is_active: Optional[bool] = True


@router.patch("/users/{user_id}")
def update_user_by_admin(user_id: str, payload: UserUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter((User.id == user_id) | (User.email == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")

    if payload.plan is not None:
        user.plan = payload.plan
    if payload.is_admin is not None:
        user.is_admin = payload.is_admin
    if payload.status is not None:
        user.status = payload.status
    if payload.monthly_token_limit is not None:
        user.monthly_token_limit = payload.monthly_token_limit
    if payload.web_search_allowed is not None:
        user.web_search_allowed = payload.web_search_allowed
    if payload.code_executor_allowed is not None:
        user.code_executor_allowed = payload.code_executor_allowed
    if payload.vector_rag_allowed is not None:
        user.vector_rag_allowed = payload.vector_rag_allowed

    db.commit()
    db.refresh(user)

    return {
        "message": f"User {user.email} updated successfully.",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "plan": user.plan,
            "is_admin": user.is_admin,
            "status": user.status,
            "monthly_token_limit": user.monthly_token_limit,
            "web_search_allowed": user.web_search_allowed,
            "code_executor_allowed": user.code_executor_allowed,
            "vector_rag_allowed": user.vector_rag_allowed,
        }
    }


@router.get("/plans")
def list_custom_plans(db: Session = Depends(get_db)):
    from app.models import CustomPlan
    return db.query(CustomPlan).order_by(CustomPlan.created_at.desc()).all()


@router.post("/plans")
def create_custom_plan(payload: CustomPlanRequest, db: Session = Depends(get_db)):
    from app.models import CustomPlan
    plan = CustomPlan(
        name=payload.name,
        price_inr=payload.price_inr,
        monthly_token_limit=payload.monthly_token_limit or 500000,
        max_roles=payload.max_roles or 25,
        connectors_allowed=payload.connectors_allowed or ["web_search"],
        badge_text=payload.badge_text,
        offer_user_email=payload.offer_user_email.strip().lower() if payload.offer_user_email else None,
        is_active=payload.is_active if payload.is_active is not None else True,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}")
def delete_custom_plan(plan_id: str, db: Session = Depends(get_db)):
    from app.models import CustomPlan
    plan = db.query(CustomPlan).filter(CustomPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Custom plan not found.")
    db.delete(plan)
    db.commit()
    return {"message": "Custom plan deleted successfully."}


@router.get("/connector-logs")
def get_connector_logs(limit: int = 20, db: Session = Depends(get_db)):
    logs = db.query(ConnectorLog).order_by(ConnectorLog.created_at.desc()).limit(limit).all()
    return logs


@router.get("/announcements")
def get_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()


@router.post("/announcements")
def create_announcement(payload: AnnouncementCreateRequest, db: Session = Depends(get_db)):
    ann = Announcement(
        title=payload.title,
        message=payload.message,
        banner_type=payload.banner_type or "info",
        action_url=payload.action_url,
        is_active=payload.is_active if payload.is_active is not None else True,
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


@router.delete("/announcements/{announcement_id}")
def delete_announcement(announcement_id: str, db: Session = Depends(get_db)):
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")
    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted successfully."}


@router.get("/vector-embeddings")
def get_admin_vector_embeddings(limit: int = 20, db: Session = Depends(get_db)):
    from app.models import QueryEmbedding
    embeddings = db.query(QueryEmbedding).order_by(QueryEmbedding.created_at.desc()).limit(limit).all()
    results = []
    for e in embeddings:
        vec_preview = e.embedding[:10] if e.embedding and isinstance(e.embedding, list) else []
        results.append({
            "id": e.id,
            "role_id": e.role_id,
            "query_text": e.query_text,
            "vector_dim": len(e.embedding) if e.embedding and isinstance(e.embedding, list) else 768,
            "vector_preview": vec_preview,
            "created_at": e.created_at,
        })
    return results


class SendPromoEmailRequest(BaseModel):
    recipient_email: Optional[str] = None  # None = Send to all registered users!
    title: str
    message_body: str
    action_url: Optional[str] = None
    banner_badge: Optional[str] = "PROMOTIONAL OFFER"


@router.post("/send-promo-email")
def send_promotional_email_to_users(payload: SendPromoEmailRequest, db: Session = Depends(get_db)):
    from app.engine.email_engine import EmailEngine

    recipients = []
    if payload.recipient_email and payload.recipient_email.strip():
        recipients = [payload.recipient_email.strip()]
    else:
        users = db.query(User).all()
        recipients = [u.email for u in users if u.email]

    if not recipients:
        raise HTTPException(status_code=400, detail="No valid recipient emails found.")

    sent_count = 0
    for email in recipients:
        success = EmailEngine.send_promo_email(
            to_email=email,
            title=payload.title,
            message_body=payload.message_body,
            action_url=payload.action_url,
            banner_badge=payload.banner_badge or "PROMOTIONAL OFFER",
        )
        if success:
            sent_count += 1

    return {
        "message": f"Promotional email successfully dispatched to {sent_count} user(s).",
        "sent_count": sent_count,
        "total_targets": len(recipients),
    }
