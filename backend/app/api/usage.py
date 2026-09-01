from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Role, UsageRecord, APIKey
from app.schemas import MetricSummary, UsageRecordResponse

router = APIRouter(prefix="/usage", tags=["Analytics & Usage"])


@router.get("", response_model=Dict[str, Any])
@router.get("/summary", response_model=Dict[str, Any])
def get_usage_metrics(db: Session = Depends(get_db)):
    active_roles_count = db.query(Role).filter(Role.status == "active").count()
    total_api_requests = db.query(UsageRecord).count()
    
    total_tokens = db.query(func.sum(UsageRecord.tokens_total)).scalar() or 0
    prompt_tokens = db.query(func.sum(UsageRecord.tokens_prompt)).scalar() or 0
    completion_tokens = db.query(func.sum(UsageRecord.tokens_completion)).scalar() or 0
    avg_latency = db.query(func.avg(UsageRecord.latency_ms)).scalar() or 0.0

    recent_records = (
        db.query(UsageRecord)
        .order_by(UsageRecord.created_at.desc())
        .limit(20)
        .all()
    )

    metrics = MetricSummary(
        active_roles_count=active_roles_count,
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
