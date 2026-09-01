"""
RL Daily Batch Job

Runs every 24 hours (at server startup + every 86400s thereafter).
For every role that has collected new feedback since the last run:
  1. Pulls all RLEpisode records from the last 7 days
  2. Runs RLPolicy.batch_refit() to rebuild the full UCB action-value table
  3. Prunes RLEpisode records older than 30 days
  4. Updates RoleRLProfile with the new policy + directive

This is the "training epoch" equivalent in the RL pipeline.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import RoleRLProfile, RLEpisode, Role
from app.engine.rl_policy import RLPolicy

logger = logging.getLogger("rl_daily_job")


async def run_daily_rl_batch():
    """Entry point — runs in background, loops forever."""
    logger.info("RL Daily Job: Started background task.")
    while True:
        try:
            await _do_batch_update()
        except Exception as e:
            logger.error(f"RL Daily Job: error during batch update — {e}")
        # Sleep 24 hours
        await asyncio.sleep(86400)


async def _do_batch_update():
    logger.info("RL Daily Job: Running batch policy refit...")
    db: Session = SessionLocal()
    try:
        cutoff_7d  = datetime.utcnow() - timedelta(days=7)
        cutoff_30d = datetime.utcnow() - timedelta(days=30)

        # Get all roles that have at least one episode
        role_ids = (
            db.query(RLEpisode.role_id)
            .filter(RLEpisode.created_at >= cutoff_7d)
            .distinct()
            .all()
        )
        role_ids = [r[0] for r in role_ids]
        logger.info(f"RL Daily Job: Refitting policy for {len(role_ids)} roles.")

        for role_id in role_ids:
            try:
                await _refit_role(db, role_id, cutoff_7d)
            except Exception as e:
                logger.error(f"RL Daily Job: failed for role {role_id} — {e}")

        # Prune old episodes (>30 days)
        deleted = db.query(RLEpisode).filter(RLEpisode.created_at < cutoff_30d).delete()
        db.commit()
        logger.info(f"RL Daily Job: Pruned {deleted} old episodes. Done.")

    finally:
        db.close()


async def _refit_role(db: Session, role_id: str, cutoff: datetime):
    # Pull recent episodes
    episodes = (
        db.query(RLEpisode)
        .filter(RLEpisode.role_id == role_id, RLEpisode.created_at >= cutoff)
        .all()
    )

    if not episodes:
        return

    # Serialize episodes to dicts for the policy engine
    logs = [
        {
            "response_style": ep.response_style,
            "temperature":    ep.temperature,
            "connector_idx":  ep.connector_idx or 0,
            "reward_score":   ep.reward_score,
        }
        for ep in episodes
    ]

    # Load current policy
    profile, policy_state = RLPolicy.get_or_create_policy(db, role_id)

    # Batch refit
    policy_state = RLPolicy.batch_refit(policy_state, logs)

    # Extract best action
    best_key = policy_state.get("best_action_key")
    if best_key:
        parts = best_key.split("|")
        if len(parts) == 3:
            profile.best_style            = parts[0]
            profile.optimized_temperature = float(parts[1])

    # Rebuild directive
    profile.adaptive_prompt_directives = RLPolicy.build_directive(
        policy_state, profile.total_feedback_count
    )

    # Save
    RLPolicy.save_policy(db, profile, policy_state)
    logger.info(
        f"RL Daily Job: role={role_id} refitted on {len(episodes)} episodes | "
        f"best_style='{profile.best_style}' | temp={profile.optimized_temperature}"
    )


async def trigger_manual_refit(role_id: str = None):
    """
    Called from the admin API to force an immediate batch update.
    Pass role_id=None to refit all roles.
    """
    db: Session = SessionLocal()
    try:
        cutoff_7d = datetime.utcnow() - timedelta(days=7)
        if role_id:
            await _refit_role(db, role_id, cutoff_7d)
        else:
            role_ids = (
                db.query(RLEpisode.role_id)
                .filter(RLEpisode.created_at >= cutoff_7d)
                .distinct()
                .all()
            )
            for (rid,) in role_ids:
                await _refit_role(db, rid, cutoff_7d)
    finally:
        db.close()
