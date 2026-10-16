import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    plan = Column(String, default="Free Starter")
    is_admin = Column(Boolean, default=False)
    status = Column(String, default="active")  # "active", "suspended"
    monthly_token_limit = Column(Integer, default=500000)
    tokens_used_this_month = Column(Integer, default=0)
    web_search_allowed = Column(Boolean, default=True)
    code_executor_allowed = Column(Boolean, default=True)
    vector_rag_allowed = Column(Boolean, default=True)
    password_hash = Column(String, nullable=True)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    roles = relationship("Role", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")


class Role(Base):
    __tablename__ = "roles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String, default="Bot")
    system_prompt = Column(Text, nullable=False)
    expertise = Column(JSON, default=list)
    connectors = Column(JSON, default=lambda: ["vector_rag", "web_search", "code_executor"])
    provider = Column(String, default="bedrock")
    model_name = Column(String, default="meta.llama3-8b-instruct-v1:0")
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=2048)
    response_style = Column(String, default="Analytical & Precise")
    memory_enabled = Column(Boolean, default=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="roles")
    conversations = relationship("Conversation", back_populates="role", cascade="all, delete-orphan")
    usage_records = relationship("UsageRecord", back_populates="role")
    rl_profile = relationship("RoleRLProfile", back_populates="role", uselist=False, cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False)
    user_id = Column(String, nullable=True)
    title = Column(String, default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = relationship("Role", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    tokens_used = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    key_prefix = Column(String, nullable=False)
    key_hash = Column(String, nullable=False, unique=True, index=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="api_keys")
    usage_records = relationship("UsageRecord", back_populates="api_key")


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=True)
    role_id = Column(String, ForeignKey("roles.id"), nullable=True)
    api_key_id = Column(String, ForeignKey("api_keys.id"), nullable=True)
    tokens_prompt = Column(Integer, default=0)
    tokens_completion = Column(Integer, default=0)
    tokens_total = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    endpoint = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="usage_records")
    api_key = relationship("APIKey", back_populates="usage_records")


class QueryEmbedding(Base):
    __tablename__ = "query_embeddings"

    id = Column(String, primary_key=True, default=generate_uuid)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False)
    query_text = Column(Text, nullable=False)
    document_title = Column(String, nullable=True)
    embedding = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RLFeedbackLog(Base):
    __tablename__ = "rl_feedback_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False)
    message_id = Column(String, nullable=True)
    query_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=False)
    signal_type = Column(String, nullable=False)
    reward_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class RoleRLProfile(Base):
    __tablename__ = "role_rl_profiles"

    role_id = Column(String, ForeignKey("roles.id"), primary_key=True)
    total_feedback_count = Column(Integer, default=0)
    average_reward = Column(Float, default=0.0)
    reward_ema = Column(Float, default=0.0)              # exponential moving average
    optimized_temperature = Column(Float, default=0.4)
    best_style = Column(String, default="Analytical & Precise")
    exploration_count = Column(Integer, default=0)       # how many UCB explore rounds
    adaptive_prompt_directives = Column(Text, default="")
    policy_state = Column(Text, default="{}")            # JSON: full UCB action-value table
    last_batch_update = Column(DateTime, nullable=True)  # when daily job last ran
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = relationship("Role", back_populates="rl_profile")


class RLEpisode(Base):
    """Full (state, action, reward) tuple — used for offline batch refit."""
    __tablename__ = "rl_episodes"

    id = Column(String, primary_key=True, default=generate_uuid)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False)
    feedback_log_id = Column(String, nullable=True)       # link to RLFeedbackLog
    query_text = Column(Text, nullable=False)
    response_style = Column(String, nullable=True)        # action: style chosen
    temperature = Column(Float, nullable=True)            # action: temperature used
    connector_idx = Column(Integer, default=0)            # action: connector set index
    reward_score = Column(Float, nullable=False)
    signal_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ConnectorLog(Base):
    __tablename__ = "connector_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False)
    connector_type = Column(String, nullable=False)
    query_params = Column(JSON, default=dict)
    execution_result = Column(JSON, default=dict)
    latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    banner_type = Column(String, default="info")  # "info", "warning", "promo"
    action_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PaymentRequest(Base):
    __tablename__ = "payment_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=True)
    user_email = Column(String, nullable=False)
    plan_name = Column(String, nullable=False)
    amount_inr = Column(Float, nullable=False)
    utr_number = Column(String, nullable=False)
    screenshot_url = Column(String, nullable=True)
    status = Column(String, default="pending")  # "pending", "approved", "rejected"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CustomPlan(Base):
    __tablename__ = "custom_plans"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    price_inr = Column(Float, nullable=False)
    monthly_token_limit = Column(Integer, default=500000)
    max_roles = Column(Integer, default=25)
    connectors_allowed = Column(JSON, default=list)
    badge_text = Column(String, nullable=True)
    offer_user_email = Column(String, nullable=True)  # Targeted offer for specific email
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    conversation_id = Column(String, nullable=True)
    query_text = Column(Text, nullable=False)
    search_type = Column(String, default="web_search")
    sources_cited = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
