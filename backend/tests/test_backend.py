import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["llm_provider"] == "mock"


def test_list_roles():
    response = client.get(f"{settings.API_V1_STR}/roles")
    assert response.status_code == 200
    roles = response.json()
    assert len(roles) >= 5
    assert any(r["slug"] == "research-scientist" for r in roles)


def test_create_and_chat_role():
    # 1. Create Role
    role_payload = {
        "name": "QA Specialist",
        "description": "Test automation expert",
        "icon": "ShieldCheck",
        "system_prompt": "You are a test engineer. Ensure 100% test coverage.",
        "expertise": ["Python", "Pytest", "Automation"],
        "provider": "mock",
        "model_name": "qwen-2.5-72b-instruct",
        "temperature": 0.3,
        "max_tokens": 1024,
        "response_style": "Analytical & Precise",
    }
    create_res = client.post(f"{settings.API_V1_STR}/roles", json=role_payload)
    assert create_res.status_code == 201
    role_data = create_res.json()
    assert role_data["name"] == "QA Specialist"
    role_id = role_data["id"]

    # 2. Chat with Role
    chat_payload = {"message": "How do I write async pytest tests?"}
    chat_res = client.post(f"{settings.API_V1_STR}/roles/{role_id}/chat", json=chat_payload)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["role_id"] == role_id
    assert "response" in chat_data
    assert chat_data["provider_used"] == "mock"

    # 3. Create API Key
    key_res = client.post(f"{settings.API_V1_STR}/api-keys", json={"name": "Test Key"})
    assert key_res.status_code == 201
    key_data = key_res.json()
    raw_key = key_data["raw_key"]
    assert raw_key.startswith("omni_live_")

    # 4. Public API Chat with API Key
    pub_chat_res = client.post(
        f"/v1/roles/{role_id}/chat",
        json={"message": "Verify public API chat flow."},
        headers={"X-API-Key": raw_key},
    )
    assert pub_chat_res.status_code == 200
    pub_data = pub_chat_res.json()
    assert pub_data["role_id"] == role_id


def test_public_api_unauthorized():
    res = client.post("/v1/roles/research-scientist/chat", json={"message": "Unauthenticated test"})
    assert res.status_code == 401
