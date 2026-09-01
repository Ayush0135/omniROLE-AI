"""
RLOptimizer — bridges the feedback API with the RLPolicy engine.

On every feedback signal:
  1. Record the RLFeedbackLog entry
  2. Store a full RLEpisode (state, action, reward) tuple
  3. Run UCB1 online EMA update on the role's policy
  4. Rebuild the prompt directive from the learned best action
  5. Save updated policy_state back to RoleRLProfile
"""

from datetime import datetime
from sqlalchemy.orm import Session
from app.models import RLFeedbackLog, RLEpisode
from app.engine.rl_policy import RLPolicy, SIGNAL_REWARDS, RESPONSE_STYLES, TEMPERATURE_BUCKETS


class RLOptimizer:

    @staticmethod
    def record_feedback(
        db: Session,
        role_id: str,
        query_text: str,
        response_text: str,
        signal_type: str,
        message_id: str = None,
        # Optional: what action was actually used to generate this response
        response_style: str = None,
        temperature: float = None,
        connector_idx: int = 0,
    ) -> RLFeedbackLog:

        reward_score = SIGNAL_REWARDS.get(signal_type, 0.0)

        # ── 1. Log raw feedback ────────────────────────────────────────────────
        log = RLFeedbackLog(
            role_id=role_id,
            message_id=message_id,
            query_text=query_text,
            response_text=response_text,
            signal_type=signal_type,
            reward_score=reward_score,
        )
        db.add(log)
        db.flush()  # get log.id without full commit

        # ── 2. Store full RL episode (state, action, reward) ──────────────────
        episode = RLEpisode(
            role_id=role_id,
            feedback_log_id=log.id,
            query_text=query_text,
            response_style=response_style or RESPONSE_STYLES[0],
            temperature=temperature or 0.4,
            connector_idx=connector_idx,
            reward_score=reward_score,
            signal_type=signal_type,
        )
        db.add(episode)

        # ── 3. Load or create RL profile + policy state ────────────────────────
        profile, policy_state = RLPolicy.get_or_create_policy(db, role_id)

        # ── 4. Determine the action key that was used ──────────────────────────
        used_style = response_style or profile.best_style or RESPONSE_STYLES[0]
        used_temp = temperature or profile.optimized_temperature or 0.4
        nearest_temp = min(TEMPERATURE_BUCKETS, key=lambda t: abs(t - used_temp))
        c_idx = max(0, min(connector_idx, 2))

        from app.engine.rl_policy import _action_key
        action_key = _action_key(used_style, nearest_temp, c_idx)

        # ── 5. UCB1 + EMA online update ────────────────────────────────────────
        policy_state = RLPolicy.online_update(policy_state, action_key, reward_score)

        # ── 6. Update running statistics on the profile ────────────────────────
        prev_count = profile.total_feedback_count or 0
        prev_avg   = profile.average_reward or 0.0
        new_count  = prev_count + 1
        new_avg    = prev_avg + (reward_score - prev_avg) / new_count

        # EMA on top-level profile
        from app.engine.rl_policy import EMA_ALPHA
        profile.reward_ema = EMA_ALPHA * reward_score + (1 - EMA_ALPHA) * (profile.reward_ema or 0.0)
        profile.total_feedback_count = new_count
        profile.average_reward       = round(new_avg, 4)
        profile.exploration_count    = policy_state.get("total_pulls", 0)

        # ── 7. Extract best action from updated policy ─────────────────────────
        best_key = policy_state.get("best_action_key")
        if best_key:
            parts = best_key.split("|")
            if len(parts) == 3:
                profile.best_style            = parts[0]
                profile.optimized_temperature = float(parts[1])

        # ── 8. Rebuild prompt directive ────────────────────────────────────────
        directive = RLPolicy.build_directive(policy_state, new_count)
        profile.adaptive_prompt_directives = directive

        # ── 9. Save policy state ───────────────────────────────────────────────
        RLPolicy.save_policy(db, profile, policy_state)

        db.refresh(log)
        return log

    @staticmethod
    def get_rl_directives(db: Session, role_id: str) -> str:
        from app.models import RoleRLProfile
        profile = db.query(RoleRLProfile).filter(RoleRLProfile.role_id == role_id).first()
        if profile and profile.adaptive_prompt_directives:
            return profile.adaptive_prompt_directives
        return ""

    @staticmethod
    def get_next_action(db: Session, role_id: str):
        """
        Called by the orchestrator before generating a response.
        Returns (style, temperature, connectors) recommended by the policy.
        """
        profile, policy_state = RLPolicy.get_or_create_policy(db, role_id)
        style, temp, connectors = RLPolicy.select_action(policy_state)
        return style, temp, connectors
