"""
RL Policy Engine — UCB1 Contextual Bandit + EMA Online Learning

Architecture:
  - Action space: response_style × temperature_bucket × connector_set
  - UCB1 selects the best action balancing exploration vs exploitation
  - EMA (α=0.15) does online reward updates after every feedback signal
  - Batch refit rebuilds full UCB table from last 7 days of logs
  - Policy state stored in RoleRLProfile.policy_state (JSON) → synced to Supabase
"""

import math
import json
from datetime import datetime, timedelta
from typing import Dict, Tuple, List, Optional, Any
from sqlalchemy.orm import Session

# ── Action Space Definition ────────────────────────────────────────────────────
RESPONSE_STYLES = [
    "Analytical & Precise",
    "Conversational & Friendly",
    "Concise & Bullet-Point",
    "Technical & Formal",
    "Creative & Expansive",
]

TEMPERATURE_BUCKETS = [0.2, 0.4, 0.6, 0.8]   # low, medium, high, creative

CONNECTOR_SETS = [
    ["web_search"],
    ["vector_rag"],
    ["web_search", "vector_rag", "code_executor"],
]

# Signal → scalar reward mapping
SIGNAL_REWARDS = {
    "thumbs_up":   +1.0,
    "star_5":      +1.0,
    "star_4":      +0.7,
    "star_3":      +0.2,
    "star_2":      -0.3,
    "star_1":      -0.8,
    "copy":        +0.6,
    "regenerate":  -0.5,
    "thumbs_down": -1.0,
    "correction":  -0.4,
}

# EMA decay factor — higher α = faster forgetting of old feedback
EMA_ALPHA = 0.15

# UCB exploration constant — higher C = more exploration
UCB_C = 1.4

# Minimum feedback before we trust the policy
MIN_FEEDBACK_TO_TRUST = 5

# Directive templates injected into every prompt, indexed by style
STYLE_DIRECTIVES = {
    "Analytical & Precise":       "Respond with structured analysis. Use bullet points, cite evidence, avoid speculation.",
    "Conversational & Friendly":  "Respond in a warm, natural conversational tone. Avoid jargon. Use analogies.",
    "Concise & Bullet-Point":     "Be extremely brief. Use bullet points. One sentence per idea. No fluff.",
    "Technical & Formal":         "Use precise technical terminology. Include code examples where relevant. Be authoritative.",
    "Creative & Expansive":       "Explore the topic broadly. Use rich examples, stories, and analogies. Encourage thinking.",
}


def _all_actions() -> List[Tuple[str, float, int]]:
    """Return all (style, temperature, connector_idx) triplets."""
    actions = []
    for style in RESPONSE_STYLES:
        for temp in TEMPERATURE_BUCKETS:
            for c_idx in range(len(CONNECTOR_SETS)):
                actions.append((style, temp, c_idx))
    return actions

ALL_ACTIONS = _all_actions()  # 5 × 4 × 3 = 60 total actions


def _action_key(style: str, temp: float, c_idx: int) -> str:
    return f"{style}|{temp}|{c_idx}"


class RLPolicy:
    """
    UCB1 Multi-Armed Contextual Bandit for per-role LLM response optimization.
    """

    # ── Initialization ─────────────────────────────────────────────────────────
    @staticmethod
    def _empty_policy() -> Dict[str, Any]:
        """Create a fresh policy state with all actions initialized."""
        table = {}
        for style, temp, c_idx in ALL_ACTIONS:
            key = _action_key(style, temp, c_idx)
            table[key] = {
                "q_value":  0.0,    # estimated expected reward
                "n_pulls":  0,      # how many times this action was selected
                "ema":      0.0,    # exponential moving average of rewards
            }
        return {
            "table": table,
            "total_pulls": 0,
            "best_action_key": None,
            "last_updated": datetime.utcnow().isoformat(),
        }

    # ── UCB1 Action Selection ──────────────────────────────────────────────────
    @staticmethod
    def select_action(policy_state: Dict) -> Tuple[str, float, List[str]]:
        """
        Select best action using UCB1.
        Returns (response_style, temperature, connectors).
        """
        table = policy_state.get("table", {})
        total_pulls = policy_state.get("total_pulls", 0)

        if total_pulls < len(ALL_ACTIONS):
            # Exploration phase: try every action at least once
            for style, temp, c_idx in ALL_ACTIONS:
                key = _action_key(style, temp, c_idx)
                if key not in table or table[key]["n_pulls"] == 0:
                    return style, temp, CONNECTOR_SETS[c_idx]

        # UCB1 exploitation phase
        best_key = None
        best_ucb = float("-inf")

        for style, temp, c_idx in ALL_ACTIONS:
            key = _action_key(style, temp, c_idx)
            if key not in table:
                continue
            entry = table[key]
            n = entry["n_pulls"]
            if n == 0:
                ucb = float("inf")
            else:
                q = entry["q_value"]
                confidence = UCB_C * math.sqrt(math.log(total_pulls + 1) / n)
                ucb = q + confidence

            if ucb > best_ucb:
                best_ucb = ucb
                best_key = key

        if best_key:
            parts = best_key.split("|")
            style = parts[0]
            temp = float(parts[1])
            c_idx = int(parts[2])
            return style, temp, CONNECTOR_SETS[c_idx]

        # Fallback
        return RESPONSE_STYLES[0], 0.4, CONNECTOR_SETS[0]

    # ── EMA Online Update ──────────────────────────────────────────────────────
    @staticmethod
    def online_update(
        policy_state: Dict,
        action_key: str,
        reward: float,
    ) -> Dict:
        """Update Q-value and EMA for the selected action after feedback."""
        table = policy_state.setdefault("table", {})
        if action_key not in table:
            table[action_key] = {"q_value": 0.0, "n_pulls": 0, "ema": 0.0}

        entry = table[action_key]
        n = entry["n_pulls"] + 1
        # Incremental sample mean for Q-value
        entry["q_value"] = entry["q_value"] + (reward - entry["q_value"]) / n
        # EMA update
        entry["ema"] = EMA_ALPHA * reward + (1 - EMA_ALPHA) * entry["ema"]
        entry["n_pulls"] = n

        policy_state["total_pulls"] = policy_state.get("total_pulls", 0) + 1

        # Track best action
        best_key = max(
            table.keys(),
            key=lambda k: table[k]["q_value"] if table[k]["n_pulls"] > 0 else float("-inf"),
        )
        policy_state["best_action_key"] = best_key
        policy_state["last_updated"] = datetime.utcnow().isoformat()

        return policy_state

    # ── Batch Refit ────────────────────────────────────────────────────────────
    @staticmethod
    def batch_refit(policy_state: Dict, feedback_logs: List[Dict]) -> Dict:
        """
        Full batch update from recent feedback logs.
        Called by the daily job. Re-computes Q-values from scratch using all logs.
        """
        # Reset Q-values but preserve n_pulls for UCB confidence
        table = policy_state.setdefault("table", {})
        reward_sums: Dict[str, List[float]] = {}

        for log in feedback_logs:
            # Map style/temp to nearest action key
            style = log.get("response_style", RESPONSE_STYLES[0])
            temp = log.get("temperature", 0.4)
            c_idx = log.get("connector_idx", 0)

            # Snap temperature to nearest bucket
            nearest_temp = min(TEMPERATURE_BUCKETS, key=lambda t: abs(t - temp))
            c_idx = max(0, min(c_idx, len(CONNECTOR_SETS) - 1))
            key = _action_key(style, nearest_temp, c_idx)

            reward_sums.setdefault(key, []).append(log.get("reward_score", 0.0))

        for key, rewards in reward_sums.items():
            if key not in table:
                table[key] = {"q_value": 0.0, "n_pulls": 0, "ema": 0.0}
            # Recompute Q from batch mean
            table[key]["q_value"] = sum(rewards) / len(rewards)
            table[key]["n_pulls"] = max(table[key]["n_pulls"], len(rewards))
            # EMA from batch
            ema = 0.0
            for r in rewards:
                ema = EMA_ALPHA * r + (1 - EMA_ALPHA) * ema
            table[key]["ema"] = ema

        policy_state["total_pulls"] = sum(e["n_pulls"] for e in table.values())
        best_key = max(
            (k for k in table if table[k]["n_pulls"] > 0),
            key=lambda k: table[k]["q_value"],
            default=None,
        )
        policy_state["best_action_key"] = best_key
        policy_state["last_updated"] = datetime.utcnow().isoformat()
        return policy_state

    # ── Build RL Directive for Prompt Injection ────────────────────────────────
    @staticmethod
    def build_directive(policy_state: Dict, total_feedback: int) -> str:
        """Build the text directive injected into every system prompt."""
        if total_feedback < MIN_FEEDBACK_TO_TRUST:
            return ""

        best_key = policy_state.get("best_action_key")
        if not best_key:
            return ""

        table = policy_state.get("table", {})
        if best_key not in table:
            return ""

        entry = table[best_key]
        parts = best_key.split("|")
        best_style = parts[0]
        best_temp = float(parts[1])
        avg_reward = round(entry["q_value"], 2)
        n = entry["n_pulls"]

        style_hint = STYLE_DIRECTIVES.get(best_style, "")
        sentiment = "positive" if avg_reward >= 0.3 else ("mixed" if avg_reward >= 0.0 else "negative")

        return (
            f"[RL POLICY — learned from {total_feedback} user interactions | "
            f"avg_reward={avg_reward} | sentiment={sentiment} | "
            f"best_style='{best_style}' | best_temp={best_temp} | "
            f"n_samples={n}]\n"
            f"APPLY THIS STYLE: {style_hint}"
        )

    # ── DB helpers ─────────────────────────────────────────────────────────────
    @staticmethod
    def get_or_create_policy(db: Session, role_id: str) -> Tuple[Any, Dict]:
        """Get or create a RoleRLProfile and return (profile, policy_state_dict)."""
        from app.models import RoleRLProfile, Role
        profile = db.query(RoleRLProfile).filter(RoleRLProfile.role_id == role_id).first()
        if not profile:
            role = db.query(Role).filter(Role.id == role_id).first()
            initial_temp = role.temperature if role else 0.5
            profile = RoleRLProfile(
                role_id=role_id,
                total_feedback_count=0,
                average_reward=0.0,
                reward_ema=0.0,
                optimized_temperature=initial_temp,
                best_style=RESPONSE_STYLES[0],
                exploration_count=0,
                adaptive_prompt_directives="",
                policy_state=json.dumps(RLPolicy._empty_policy()),
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

        # Deserialize policy state
        raw = profile.policy_state
        if isinstance(raw, str):
            try:
                policy_state = json.loads(raw)
            except Exception:
                policy_state = RLPolicy._empty_policy()
        elif isinstance(raw, dict):
            policy_state = raw
        else:
            policy_state = RLPolicy._empty_policy()

        return profile, policy_state

    @staticmethod
    def save_policy(db: Session, profile: Any, policy_state: Dict) -> None:
        """Serialize and save policy state back to DB."""
        profile.policy_state = json.dumps(policy_state)
        profile.last_batch_update = datetime.utcnow()
        db.commit()
