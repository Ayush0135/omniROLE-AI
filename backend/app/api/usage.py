from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Role, UsageRecord, APIKey
from app.schemas import MetricSummary, UsageRecordResponse
from app.api.deps import get_optional_user

router = APIRouter(prefix="/usage", tags=["Analytics & Usage"])


@router.get("", response_model=Dict[str, Any])
@router.get("/summary", response_model=Dict[str, Any])
def get_usage_metrics(
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    query = db.query(UsageRecord)
    if user_id:
        query = query.filter(UsageRecord.user_id == user_id)
        active_roles = db.query(Role).filter((Role.user_id == user_id) | (Role.user_id.is_(None)), Role.status == "active").count()
    else:
        query = query.filter(UsageRecord.user_id == "__unauthenticated__")
        active_roles = db.query(Role).filter(Role.user_id.is_(None), Role.status == "active").count()

    total_api_requests = query.count()
    total_tokens = query.with_entities(func.sum(UsageRecord.tokens_total)).scalar() or 0
    prompt_tokens = query.with_entities(func.sum(UsageRecord.tokens_prompt)).scalar() or 0
    completion_tokens = query.with_entities(func.sum(UsageRecord.tokens_completion)).scalar() or 0
    avg_latency = query.with_entities(func.avg(UsageRecord.latency_ms)).scalar() or 0.0

    recent_records = (
        query
        .order_by(UsageRecord.created_at.desc())
        .limit(20)
        .all()
    )

    metrics = MetricSummary(
        active_roles_count=active_roles,
        total_api_requests=total_api_requests,
        tokens_used=int(total_tokens),
        average_response_time_ms=round(float(avg_latency), 2),
    )

    records_data = [UsageRecordResponse.model_validate(r) for r in recent_records]

    return {
        "metrics": metrics,
        "recent_records": records_data,
        "total_tokens": int(total_tokens),
        "prompt_tokens": int(prompt_tokens),
        "completion_tokens": int(completion_tokens),
        "total_requests": total_api_requests,
        "average_latency_ms": round(float(avg_latency), 2),
    }
