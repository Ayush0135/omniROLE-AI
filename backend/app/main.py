import asyncio
from sqlalchemy import text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import Role, APIKey, User
from app.api import roles, chat, api_keys, usage, public_api, rl_orchestration, auth_sync, admin, payments, admin_auth
from app.schemas import HealthCheckResponse

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-migrate columns if missing in SQLite
with engine.connect() as conn:
    for col_sql in [
        "ALTER TABLE roles ADD COLUMN connectors JSON DEFAULT '[\"vector_rag\", \"web_search\", \"code_executor\"]'",
        "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0",
        "ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'active'",
        "ALTER TABLE users ADD COLUMN monthly_token_limit INTEGER DEFAULT 500000",
        "ALTER TABLE users ADD COLUMN tokens_used_this_month INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN web_search_allowed BOOLEAN DEFAULT 1",
        "ALTER TABLE users ADD COLUMN code_executor_allowed BOOLEAN DEFAULT 1",
        "ALTER TABLE users ADD COLUMN vector_rag_allowed BOOLEAN DEFAULT 1",
        # RL Policy columns (new)
        "ALTER TABLE role_rl_profiles ADD COLUMN reward_ema REAL DEFAULT 0.0",
        "ALTER TABLE role_rl_profiles ADD COLUMN best_style VARCHAR DEFAULT 'Analytical & Precise'",
        "ALTER TABLE role_rl_profiles ADD COLUMN exploration_count INTEGER DEFAULT 0",
        "ALTER TABLE role_rl_profiles ADD COLUMN policy_state TEXT DEFAULT '{}'",
        "ALTER TABLE role_rl_profiles ADD COLUMN last_batch_update DATETIME",
    ]:
        try:
            conn.execute(text(col_sql))
            conn.commit()
        except Exception:
            pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="OmniRole AI - Specialized AI Expert Creation & Orchestration Platform",
)

# Configure CORS — wildcard + credentials is rejected by browsers, must use explicit origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://omini-ai.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Seed & Update AI Roles on startup to use live Gemini API
def seed_and_update_roles():
    db = SessionLocal()
    try:
        existing_roles = db.query(Role).all()
        for r in existing_roles:
            if not r.connectors:
                r.connectors = ["vector_rag", "web_search", "code_executor"]
        db.commit()

        if db.query(Role).count() == 0:
            default_roles = [
                {
                    "name": "Research Scientist",
                    "slug": "research-scientist",
                    "description": "Specialized in scientific methodology, literature analysis, hypothesis evaluation, and academic drafting.",
                    "icon": "Atom",
                    "system_prompt": "You are a distinguished Senior Research Scientist. Analyze queries with empirical rigor, cite methodologies, isolate variables, and summarize evidence systematically.",
                    "expertise": ["Research", "Machine Learning", "Python", "Data Analysis", "Scientific Writing"],
                    "connectors": ["vector_rag", "web_search"],
                    "provider": "openai_compatible",
                    "model_name": "gemini-2.5-flash",
                    "temperature": 0.3,
                    "max_tokens": 2048,
                    "response_style": "Analytical & Precise",
                    "status": "active",
                },
                {
                    "name": "Code Architect",
                    "slug": "code-architect",
                    "description": "Expert in software architecture, clean code, design patterns, microservices, and system scalability.",
                    "icon": "Cpu",
                    "system_prompt": "You are a Principal Software Architect. Focus on robust design patterns, modular code, high availability, edge-case safety, and efficient algorithms.",
                    "expertise": ["System Design", "Python", "TypeScript", "FastAPI", "Microservices"],
                    "connectors": ["code_executor", "vector_rag"],
                    "provider": "openai_compatible",
                    "model_name": "gemini-2.5-flash",
                    "temperature": 0.4,
                    "max_tokens": 3072,
                    "response_style": "Structured & Concise",
                    "status": "active",
                },
                {
                    "name": "Data Analyst",
                    "slug": "data-analyst",
                    "description": "Transforms raw metrics into strategic business insights, statistical trends, and predictive modeling.",
                    "icon": "BarChart3",
                    "system_prompt": "You are a Lead Data Analyst. Interpret quantitative metrics, highlight variances, identify correlations, and recommend data-backed actions.",
                    "expertise": ["Data Analysis", "SQL", "Statistics", "Predictive Modeling", "Visualization"],
                    "connectors": ["database_query", "code_executor"],
                    "provider": "openai_compatible",
                    "model_name": "gemini-2.5-flash",
                    "temperature": 0.2,
                    "max_tokens": 2048,
                    "response_style": "Analytical & Precise",
                    "status": "active",
                },
                {
                    "name": "Amazon Bedrock Llama 3 Expert",
                    "slug": "amazon-bedrock-llama3",
                    "description": "Enterprise AI agent running on Amazon Bedrock with Meta Llama 3 8B Instruct model.",
                    "icon": "Zap",
                    "system_prompt": "You are an Amazon Bedrock AI Specialist. Focus on cloud architecture, enterprise scalability, security best practices, and high-performance inference.",
                    "expertise": ["Amazon Bedrock", "AWS Cloud", "Meta Llama 3", "Enterprise AI", "Security"],
                    "connectors": ["web_search", "vector_rag", "code_executor"],
                    "provider": "bedrock",
                    "model_name": "meta.llama3-8b-instruct-v1:0",
                    "temperature": 0.3,
                    "max_tokens": 2048,
                    "response_style": "Analytical & High-Precision",
                    "status": "active",
                },
            ]
            for r_data in default_roles:
                role_obj = Role(**r_data)
                db.add(role_obj)
            db.commit()
    finally:
        db.close()

seed_and_update_roles()

# Mount API Routers
app.include_router(roles.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(api_keys.router, prefix=settings.API_V1_STR)
app.include_router(usage.router, prefix=settings.API_V1_STR)
app.include_router(rl_orchestration.router, prefix=settings.API_V1_STR)
app.include_router(auth_sync.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(admin_auth.router, prefix=settings.API_V1_STR)
app.include_router(public_api.router)


@app.get("/health", response_model=HealthCheckResponse, tags=["Health"])
def health_check():
    return HealthCheckResponse(
        status="healthy",
        version=settings.VERSION,
        database="connected",
        llm_provider=settings.LLM_PROVIDER,
    )


from fastapi import WebSocket, WebSocketDisconnect
from app.engine.websocket_manager import ws_manager
from app.engine.rl_daily_job import run_daily_rl_batch


@app.on_event("startup")
async def startup_event():
    """Launch the RL daily batch job as a background asyncio task."""
    asyncio.create_task(run_daily_rl_batch())


@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket, client_type: str = "user", user_id: str = "anonymous"):
    await ws_manager.connect(websocket, client_type=client_type, user_id=user_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f'{{"event": "pong", "data": {{"echo": "{data}"}}}}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
