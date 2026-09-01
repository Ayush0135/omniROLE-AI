# OmniRole AI - Architecture Documentation

## Overview

**OmniRole AI** is an agentic platform designed to transform general-purpose Large Language Models (LLMs) into domain-specialized AI experts.

The platform achieves specialization through:
1. **Role Persona Definition**: System instructions, persona guidelines, and response style.
2. **Domain Expertise Injection**: Dynamic contextual tag injection (e.g. Research, System Design, Statutory Audit).
3. **Hyperparameter Configuration**: Model provider selection, temperature, token limits, and memory rules.
4. **API Execution Layer**: Public developer API protected via hashed API key authentication.

---

## Architectural Stack

```
┌────────────────────────────────────────────────────────┐
│               Frontend (Next.js 14 App Router)         │
│  Landing | Dashboard | Roles Workspace | Playground   │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST API
┌──────────────────────────▼─────────────────────────────┐
│                FastAPI Backend Application             │
│  - Middleware: CORS, API Key Auth (SHA-256)            │
│  - Routes: /api/v1/roles, /api/v1/chat, /v1/roles/chat │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
┌──────────────▼─────────────┐ ┌──────────▼──────────────┐
│   Database (SQLAlchemy)    │ │    AI Role Engine      │
│ SQLite (Dev) / Postgres    │ │ - PromptBuilder        │
│ (User, Role, APIKey, Usage)│ │ - Provider Abstraction │
└────────────────────────────┘ └──────────┬──────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        │                                   │
             ┌──────────▼──────────┐             ┌──────────▼──────────┐
             │    MockProvider     │             │  OpenAICompatible   │
             │ (Local / Zero GPU)  │             │ (vLLM / Qwen Server)│
             └─────────────────────┘             └─────────────────────┘
```

---

## Data Pipeline Flow

1. **Client Request**: Client sends a chat payload to `POST /v1/roles/{role_id}/chat` with header `X-API-Key`.
2. **API Key Authentication**: FastAPI dependency computes SHA-256 hash of the header token and validates against database record.
3. **Role & History Retrieval**: System fetches the target `Role` model and previous conversation context.
4. **Prompt Construction**: `PromptBuilder` formats the complete system instructions, injecting domain expertise tags and response style directives.
5. **Provider Dispatch**: The engine passes the formatted prompt to the configured `LLMProvider` (`MockProvider` or `OpenAICompatibleProvider`).
6. **Execution Telemetry**: Latency (ms) and token counts (prompt, completion, total) are logged to `UsageRecord` table.
7. **Response Return**: Returns standardized JSON response to client.

---

## Switching to Live LLM Server (Qwen / vLLM)

To connect OmniRole AI to a real inference server:
1. Set `LLM_PROVIDER=openai_compatible` in `backend/.env`.
2. Set `LLM_BASE_URL=http://<vllm-ip>:8000/v1`.
3. Set `LLM_MODEL=qwen-2.5-72b-instruct`.
4. Re-run backend. All chat endpoints will now stream / fetch completions directly from your model server with zero code changes required.
