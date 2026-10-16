from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# --- Role Schemas ---
class RoleBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Research Scientist"})
    description: str = Field(..., json_schema_extra={"example": "Specialized AI researcher for literature review and hypotheses."})
    icon: str = Field(default="Atom", json_schema_extra={"example": "Atom"})
    system_prompt: str = Field(..., json_schema_extra={"example": "You are a senior research scientist. Always cite methodologies and evaluate hypotheses critically."})
    expertise: List[str] = Field(default_factory=list, json_schema_extra={"example": ["Research", "Machine Learning", "Scientific Writing"]})
    connectors: List[str] = Field(default_factory=lambda: ["web_search"], json_schema_extra={"example": ["web_search", "code_executor"]})
    provider: str = Field(default="mock", json_schema_extra={"example": "mock"})
    model_name: str = Field(default="qwen-2.5-72b-instruct", json_schema_extra={"example": "qwen-2.5-72b-instruct"})
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=64, le=32768)
    response_style: str = Field(default="Analytical & Precise")
    memory_enabled: bool = Field(default=True)
    status: str = Field(default="active")  # active, draft, archived


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    system_prompt: Optional[str] = None
    expertise: Optional[List[str]] = None
    connectors: Optional[List[str]] = None
    provider: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    response_style: Optional[str] = None
    memory_enabled: Optional[bool] = None
    status: Optional[str] = None


class RoleResponse(RoleBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# --- Chat Schemas ---
class ChatMessage(BaseModel):
    role: str = Field(..., json_schema_extra={"example": "user"})
    content: str = Field(..., json_schema_extra={"example": "Analyze this methodology."})
    image_url: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(..., json_schema_extra={"example": "Explain quantum entanglement in simple terms."})
    conversation_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    image_url: Optional[str] = None
    connectors: Optional[List[str]] = None


class ChatResponse(BaseModel):
    role_id: str
    role_name: str
    conversation_id: str
    response: str
    model_used: str
    provider_used: str
    tokens_used: Dict[str, int]
    latency_ms: float
    created_at: datetime
    connector_outputs: Optional[List[Dict[str, Any]]] = None


# --- RAG Knowledge Base Schemas ---
class KnowledgeDocumentCreate(BaseModel):
    title: Optional[str] = "Uploaded Document"
    content: str = Field(..., min_length=5, description="Text content to index into RAG vector knowledge base")


class KnowledgeDocumentResponse(BaseModel):
    id: str
    role_id: str
    title: str
    chunks_indexed: int
    created_at: datetime



# --- API Key Schemas ---
class APIKeyCreate(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Production Backend Key"})


class APIKeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    key_prefix: str
    raw_key: Optional[str] = None  # Only returned once on creation
    status: str
    created_at: datetime
    last_used_at: Optional[datetime] = None


# --- Analytics & Metrics Schemas ---
class MetricSummary(BaseModel):
    active_roles_count: int
    total_api_requests: int
    tokens_used: int
    average_response_time_ms: float


class UsageRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role_id: Optional[str]
    api_key_id: Optional[str]
    tokens_prompt: int
    tokens_completion: int
    tokens_total: int
    latency_ms: float
    endpoint: str
    created_at: datetime


class HealthCheckResponse(BaseModel):
    status: str
    version: str
    database: str
    llm_provider: str


# --- Payment Request Schemas ---
class PaymentRequestCreate(BaseModel):
    user_email: str
    plan_name: str
    amount_inr: float
    utr_number: str
    screenshot_url: Optional[str] = None


class PaymentRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str]
    user_email: str
    plan_name: str
    amount_inr: float
    utr_number: str
    screenshot_url: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime


# --- Custom Plan & Offers Schemas ---
class CustomPlanCreate(BaseModel):
    name: str
    price_inr: float
    monthly_token_limit: int = 500000
    max_roles: int = 25
    connectors_allowed: List[str] = ["web_search", "code_executor", "vector_rag"]
    badge_text: Optional[str] = "LIMITED OFFER"
    offer_user_email: Optional[str] = None
    is_active: bool = True


class CustomPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    price_inr: float
    monthly_token_limit: int
    max_roles: int
    connectors_allowed: List[str]
    badge_text: Optional[str]
    offer_user_email: Optional[str]
    is_active: bool
    created_at: datetime
