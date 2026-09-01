# OmniRole AI

> Specialized AI Expert Creation & Orchestration Platform

**OmniRole AI** is an autonomous platform that transforms general-purpose Large Language Models (LLMs) into specialized AI expert assistants tailored to specific domains, system roles, and operational guidelines.

---

## 🌟 Key Features

- **Role Definition Engine**: Create and configure specialized AI personas (e.g. Research Scientist, Code Architect, Data Analyst, Legal Research Assistant, Marketing Strategist).
- **System Prompt Builder**: Dynamically synthesizes persona guidelines, response styles, operational directives, and expertise focus tags.
- **Modular LLM Provider Abstraction**:
  - `MockProvider`: Allows zero-dependency local development and testing out of the box with realistic domain responses.
  - `OpenAICompatibleProvider`: Async HTTP integration with vLLM, Qwen, Ollama, or OpenAI endpoints.
- **Developer API Key Management**: Generate hashed SHA-256 API secrets to expose role endpoints securely to external applications.
- **Interactive API Playground**: Test prompts live, inspect latency and token metrics, and export auto-generated cURL, Python, and JavaScript snippets.
- **Usage & Telemetry Analytics**: Monitor active AI roles, total API requests, token counts, and p99 response times.
- **Modern Premium Interface**: Dark-mode SaaS UI built with Next.js 14 App Router, TypeScript, and Tailwind CSS.

---

## 🏗 Project Architecture

```
/omnirole-ai
├── /backend              # FastAPI Python backend (SQLAlchemy, Pydantic, LLM engine)
│   ├── app/
│   │   ├── api/          # Routers: roles, chat, api_keys, usage, public_api
│   │   ├── engine/       # PromptBuilder, LLMProvider (Mock, OpenAICompatible)
│   │   ├── config.py     # Pydantic Settings
│   │   ├── database.py   # DB Engine (SQLite / PostgreSQL)
│   │   ├── models.py     # SQLAlchemy ORM Models
│   │   ├── schemas.py    # Pydantic Request/Response Schemas
│   │   └── main.py       # FastAPI Entrypoint & Default Role Seeding
│   ├── tests/            # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── /frontend             # Next.js 14 (App Router) + TypeScript + Tailwind CSS
│   ├── app/              # Dashboard, My Roles, Create Role, Workspace, Playground, Keys, Analytics, Docs
│   ├── components/       # Sidebar, Navbar, RoleCard, MetricCard, IconRenderer
│   ├── lib/              # API Client (lib/api.ts)
│   ├── Dockerfile
│   └── package.json
├── /docs                 # Architecture & API documentation
├── docker-compose.yml    # Container orchestration for local & staging
├── .env.example          # Environment configuration template
└── README.md
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites

- **Python**: 3.10+
- **Node.js**: 18+
- **NPM** or **Yarn**

---

### 1. Setting Up Backend (FastAPI)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run backend server (runs on http://localhost:8000)
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

Verify backend health check:
```bash
curl http://localhost:8000/health
```

---

### 2. Setting Up Frontend (Next.js)

```bash
cd frontend

# Install node dependencies
npm install

# Run dev server (runs on http://localhost:3000)
npm run dev
```

Visit **http://localhost:3000** in your browser to access the OmniRole AI dashboard.

---

## 🧪 Running Backend Unit Tests

```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest -v tests/
```

---

## 🐳 Docker Setup

Run full stack containerized:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API & OpenAPI Docs: `http://localhost:8000/docs`

---

## 🔄 Switching to Real Qwen / vLLM / OpenAI Server

OmniRole AI runs in `mock` mode by default requiring zero API keys. To connect a live LLM server:

Update `backend/.env`:
```env
LLM_PROVIDER=openai_compatible
LLM_BASE_URL=http://your-vllm-host:8000/v1
LLM_API_KEY=your_optional_api_key
LLM_MODEL=qwen-2.5-72b-instruct
```

Restart backend. All role workspace chats and API endpoints will instantly route to your inference server.

---

## 🔌 Public Developer REST API

### Chat with Specialized AI Role

**Endpoint**: `POST /v1/roles/{role_id}/chat`  
**Headers**: `X-API-Key: omni_live_...`

```bash
curl -X POST "http://localhost:8000/v1/roles/research-scientist/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: omni_live_your_key_here" \
  -d '{
    "message": "Analyze confounding variables in empirical sampling.",
    "temperature": 0.3
  }'
```

**Response**:
```json
{
  "role_id": "research-scientist",
  "role_name": "Research Scientist",
  "conversation_id": "conv-12345",
  "response": "### Scientific & Empirical Analysis...",
  "model_used": "qwen-2.5-72b-instruct",
  "provider_used": "mock",
  "tokens_used": {
    "prompt_tokens": 120,
    "completion_tokens": 240,
    "total_tokens": 360
  },
  "latency_ms": 182.4,
  "created_at": "2026-08-28T00:00:00.000Z"
}
```

---

## ☁️ AWS Deployment Roadmap

1. **Backend**: Deploy container to AWS ECS Fargate or AWS App Runner.
2. **Database**: Switch `DATABASE_URL` to AWS RDS PostgreSQL or Supabase.
3. **Frontend**: Deploy Next.js to Vercel or AWS Amplify.
4. **LLM Inference**: Host vLLM on AWS EC2 `g5.xlarge` instance (NVIDIA A10G) or SageMaker Endpoint.
