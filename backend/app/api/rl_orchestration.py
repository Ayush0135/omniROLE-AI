from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Role, RoleRLProfile, RLFeedbackLog, RLEpisode
from app.engine.rl_optimizer import RLOptimizer
from app.engine.rl_policy import RLPolicy, SIGNAL_REWARDS
from app.engine.vector_engine import VectorEngine

router = APIRouter(prefix="/rl", tags=["RLHF & Self-Learning"])


# ── Schemas ────────────────────────────────────────────────────────────────────
class FeedbackRequest(BaseModel):
    role_id: str = Field(..., example="research-scientist")
    query_text: str = Field(..., example="Explain attention mechanism.")
    response_text: str = Field(..., example="The attention mechanism...")
    signal_type: str = Field(..., example="thumbs_up")
    message_id: Optional[str] = None
    # RL action metadata — what the model used to generate this response
    response_style: Optional[str] = None
    temperature: Optional[float] = None
    connector_idx: Optional[int] = 0


class ExtendedFeedbackRequest(BaseModel):
    """For star ratings + optional text corrections."""
    role_id: str
    query_text: str
    response_text: str
    star_rating: int = Field(..., ge=1, le=5)
    correction_text: Optional[str] = None
    message_id: Optional[str] = None
    response_style: Optional[str] = None
    temperature: Optional[float] = None
    connector_idx: Optional[int] = 0


class VectorSearchRequest(BaseModel):
    role_id: str = Field(..., example="research-scientist")
    query_text: str = Field(..., example="Attention mechanism in transformers")
    limit: Optional[int] = Field(default=3, ge=1, le=10)


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/feedback", status_code=status.HTTP_201_CREATED)
def submit_feedback(fb_in: FeedbackRequest, db: Session = Depends(get_db)):
    """Record a thumbs up/down/copy/regenerate feedback signal and update RL policy."""
    role = db.query(Role).filter((Role.id == fb_in.role_id) | (Role.slug == fb_in.role_id)).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Role '{fb_in.role_id}' not found.")

    log = RLOptimizer.record_feedback(
        db=db,
        role_id=role.id,
        query_text=fb_in.query_text,
        response_text=fb_in.response_text,
        signal_type=fb_in.signal_type,
        message_id=fb_in.message_id,
        response_style=fb_in.response_style,
        temperature=fb_in.temperature,
        connector_idx=fb_in.connector_idx or 0,
    )

    profile = db.query(RoleRLProfile).filter(RoleRLProfile.role_id == role.id).first()

    return {
        "status": "feedback_recorded",
        "reward_score": log.reward_score,
        "role_id": role.id,
        "updated_policy": {
            "total_feedback_count":    profile.total_feedback_count if profile else 1,
            "average_reward":          profile.average_reward if profile else log.reward_score,
            "reward_ema":              profile.reward_ema if profile else log.reward_score,
            "optimized_temperature":   profile.optimized_temperature if profile else role.temperature,
            "best_style":              profile.best_style if profile else None,
            "adaptive_prompt_directives": profile.adaptive_prompt_directives if profile else "",
        },
    }


@router.post("/rate", status_code=status.HTTP_201_CREATED)
def submit_star_rating(fb_in: ExtendedFeedbackRequest, db: Session = Depends(get_db)):
    """Record a 1-5 star rating (+ optional text correction) and update RL policy."""
    role = db.query(Role).filter((Role.id == fb_in.role_id) | (Role.slug == fb_in.role_id)).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Role '{fb_in.role_id}' not found.")

    signal_type = f"star_{fb_in.star_rating}"

    log = RLOptimizer.record_feedback(
        db=db,
        role_id=role.id,
        query_text=fb_in.query_text,
        response_text=fb_in.response_text,
        signal_type=signal_type,
        message_id=fb_in.message_id,
        response_style=fb_in.response_style,
        temperature=fb_in.temperature,
        connector_idx=fb_in.connector_idx or 0,
    )

    # If user supplied a correction, also log it as an additional negative signal
    if fb_in.correction_text:
        RLOptimizer.record_feedback(
            db=db,
            role_id=role.id,
            query_text=fb_in.query_text,
            response_text=fb_in.correction_text,
            signal_type="correction",
            response_style=fb_in.response_style,
            temperature=fb_in.temperature,
            connector_idx=fb_in.connector_idx or 0,
        )

    profile = db.query(RoleRLProfile).filter(RoleRLProfile.role_id == role.id).first()

    return {
        "status": "rating_recorded",
        "signal_type": signal_type,
        "reward_score": log.reward_score,
        "role_id": role.id,
        "updated_policy": {
            "average_reward": profile.average_reward if profile else 0,
            "best_style":     profile.best_style if profile else None,
        },
    }


@router.get("/roles/{id_or_slug}/profile")
def get_role_rl_profile(id_or_slug: str, db: Session = Depends(get_db)):
    """Get the full RL learning profile for a role."""
    role = db.query(Role).filter((Role.id == id_or_slug) | (Role.slug == id_or_slug)).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Role '{id_or_slug}' not found.")

    profile = db.query(RoleRLProfile).filter(RoleRLProfile.role_id == role.id).first()
    if not profile:
        return {
            "role_id": role.id, "role_name": role.name,
            "total_feedback_count": 0, "average_reward": 0.0, "reward_ema": 0.0,
            "optimized_temperature": role.temperature, "best_style": role.response_style,
            "exploration_count": 0, "adaptive_prompt_directives": "",
            "last_batch_update": None,
        }

    return {
        "role_id":   role.id,
        "role_name": role.name,
        "total_feedback_count":       profile.total_feedback_count,
        "average_reward":             profile.average_reward,
        "reward_ema":                 profile.reward_ema,
        "optimized_temperature":      profile.optimized_temperature,
        "best_style":                 profile.best_style,
        "exploration_count":          profile.exploration_count,
        "adaptive_prompt_directives": profile.adaptive_prompt_directives,
        "last_batch_update":          profile.last_batch_update,
    }


@router.get("/roles/{id_or_slug}/learning-curve")
def get_learning_curve(id_or_slug: str, days: int = 14, db: Session = Depends(get_db)):
    """Return daily average reward over the last N days for a role."""
    role = db.query(Role).filter((Role.id == id_or_slug) | (Role.slug == id_or_slug)).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Role '{id_or_slug}' not found.")

    cutoff = datetime.utcnow() - timedelta(days=days)
    logs = (
        db.query(RLFeedbackLog)
        .filter(RLFeedbackLog.role_id == role.id, RLFeedbackLog.created_at >= cutoff)
        .order_by(RLFeedbackLog.created_at)
        .all()
    )

    # Group by day
    daily: dict = {}
    for log in logs:
        day = log.created_at.strftime("%Y-%m-%d")
        daily.setdefault(day, []).append(log.reward_score)

    curve = [
        {"date": day, "avg_reward": round(sum(v) / len(v), 3), "count": len(v)}
        for day, v in sorted(daily.items())
    ]

    return {"role_id": role.id, "role_name": role.name, "learning_curve": curve}


@router.get("/dashboard")
def get_rl_dashboard(db: Session = Depends(get_db)):
    """Aggregated RL stats across all roles — for the analytics dashboard."""
    profiles = db.query(RoleRLProfile).all()
    roles = {r.id: r for r in db.query(Role).all()}

    total_feedback = db.query(func.count(RLFeedbackLog.id)).scalar() or 0
    total_episodes  = db.query(func.count(RLEpisode.id)).scalar() or 0

    role_stats = []
    for p in profiles:
        role = roles.get(p.role_id)
        role_stats.append({
            "role_id":              p.role_id,
            "role_name":            role.name if role else p.role_id,
            "total_feedback":       p.total_feedback_count,
            "average_reward":       p.average_reward,
            "reward_ema":           p.reward_ema,
            "best_style":           p.best_style,
            "optimized_temperature": p.optimized_temperature,
            "exploration_count":    p.exploration_count,
            "last_updated":         p.updated_at,
        })

    # Signal breakdown
    signal_counts = (
        db.query(RLFeedbackLog.signal_type, func.count(RLFeedbackLog.id))
        .group_by(RLFeedbackLog.signal_type)
        .all()
    )

    return {
        "total_feedback_signals": total_feedback,
        "total_episodes_stored":  total_episodes,
        "signal_breakdown":       {s: c for s, c in signal_counts},
        "role_policies":          sorted(role_stats, key=lambda x: x["total_feedback"], reverse=True),
    }


@router.post("/trigger-refit")
async def trigger_manual_refit(role_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Force an immediate RL policy refit (admin use). Pass role_id to refit one role."""
    from app.engine.rl_daily_job import trigger_manual_refit as _refit
    await _refit(role_id)
    return {"status": "refit_complete", "role_id": role_id or "all"}


@router.post("/vector-search")
async def search_vector_embeddings(v_in: VectorSearchRequest, db: Session = Depends(get_db)):
    role = db.query(Role).filter((Role.id == v_in.role_id) | (Role.slug == v_in.role_id)).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Role '{v_in.role_id}' not found.")

    results = await VectorEngine.search_similar_queries(
        db=db, role_id=role.id, query_text=v_in.query_text, limit=v_in.limit or 3,
    )
    return {"role_id": role.id, "query_text": v_in.query_text, "similar_past_searches": results}
