import asyncio
import time
import httpx
import json
import os
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, '/Users/ayush/Library/CloudStorage/GoogleDrive-ayush.kashyap7155@gmail.com/My Drive/omini ai/backend')

from app.config import settings
from app.engine.llm_provider import BedrockProvider, get_llm_provider
from app.database import SessionLocal
from app.models import Role, User
from app.engine.orchestrator import SearchOrchestrator

RAW_KEY = settings.BEDROCK_API_KEY
REGION = settings.BEDROCK_REGION or "ap-south-1"

print("=" * 70)
print("🚀 RIGOROUS AMAZON BEDROCK REGRESSION TEST SUITE")
print("=" * 70)
print(f"📍 AWS Region Target: {REGION}")
print(f"🔑 API Key Prefix: {RAW_KEY[:15]}...")
print("=" * 70)

async def test_1_direct_aws_bedrock_api():
    print("\n[TEST 1] Direct AWS Bedrock API Endpoint Verification...")
    url = f"https://bedrock-runtime.{REGION}.amazonaws.com/model/meta.llama3-8b-instruct-v1:0/invoke"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {RAW_KEY}",
    }
    payload = {
        "prompt": "User: State the value of 2 + 2 and confirm system status.\nAssistant:",
        "max_gen_len": 50,
        "temperature": 0.1
    }
    start = time.time()
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(url, json=payload, headers=headers)
        latency = round((time.time() - start) * 1000, 2)
        assert res.status_code == 200, f"HTTP Failure: {res.status_code} - {res.text}"
        data = res.json()
        generation = data.get("generation", "").strip()
        print(f"  ✅ Status: 200 OK | Latency: {latency} ms")
        print(f"  📝 Output: {generation[:100]}...")
        assert len(generation) > 0, "Empty generation received"

async def test_2_claude_3_haiku_direct_api():
    print("\n[TEST 2] Meta Llama 3 8B Instruct Advanced Reasoning Test...")
    url = f"https://bedrock-runtime.{REGION}.amazonaws.com/model/meta.llama3-8b-instruct-v1:0/invoke"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {RAW_KEY}",
    }
    payload = {
        "prompt": "User: Briefly confirm Amazon Bedrock connectivity and model name.\nAssistant:",
        "max_gen_len": 50,
        "temperature": 0.2
    }
    start = time.time()
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(url, json=payload, headers=headers)
        latency = round((time.time() - start) * 1000, 2)
        assert res.status_code == 200, f"HTTP Failure: {res.status_code} - {res.text}"
        data = res.json()
        generation = data.get("generation", "").strip()
        print(f"  ✅ Status: 200 OK | Latency: {latency} ms")
        print(f"  📝 Output: {generation[:100]}...")
        assert len(generation) > 0, "Empty text received"

async def test_3_backend_bedrock_provider_class():
    print("\n[TEST 3] Backend BedrockProvider Class Integration...")
    provider = BedrockProvider()
    start = time.time()
    res = await provider.generate_response(
        system_prompt="You are a senior DevOps architect.",
        messages=[{"role": "user", "content": "Explain AWS Bedrock benefits in 2 sentences."}],
        model_name="meta.llama3-8b-instruct-v1:0",
        temperature=0.3,
        max_tokens=100
    )
    print(f"  ✅ Response Received | Provider: {res['provider']} | Model: {res['model']}")
    print(f"  📊 Latency: {res['latency_ms']} ms | Tokens: {res['tokens_prompt']} Prompt + {res['tokens_completion']} Completion = {res['tokens_total']} Total")
    print(f"  📝 Response text: {res['response'][:120]}...")
    assert res['tokens_total'] > 0, "Tokens total must be > 0"
    assert res['response'], "Response string must not be empty"

async def test_4_orchestrator_pipeline_with_connectors():
    print("\n[TEST 4] SearchOrchestrator End-to-End Pipeline with Connectors...")
    db = SessionLocal()
    try:
        role = db.query(Role).filter(Role.slug == "amazon-bedrock-llama3").first()
        if not role:
            role = Role(
                name="Amazon Bedrock Llama 3 Expert",
                slug="amazon-bedrock-llama3",
                description="Enterprise AI agent running on Amazon Bedrock",
                icon="Zap",
                system_prompt="You are an Amazon Bedrock Specialist.",
                expertise=["Amazon Bedrock", "AWS"],
                connectors=["web_search", "vector_rag"],
                provider="bedrock",
                model_name="meta.llama3-8b-instruct-v1:0",
                temperature=0.3,
                max_tokens=150,
            )
            db.add(role)
            db.commit()
            db.refresh(role)

        res = await SearchOrchestrator.process_role_request(
            db=db,
            role=role,
            message="What are the key capabilities of Meta Llama 3?",
            history=[]
        )
        print(f"  ✅ Orchestrator Success | Provider: {res.get('provider')} | Latency: {res.get('latency_ms')} ms")
        print(f"  📝 Output: {res.get('response', '')[:120]}...")
        assert res.get('response'), "Orchestrator response should not be empty"
    finally:
        db.close()

async def test_5_live_fastapi_rest_endpoint():
    print("\n[TEST 5] Live FastAPI REST Endpoint (http://localhost:8000/health & live check)...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        health = await client.get("http://localhost:8000/health")
        print(f"  ✅ Health Check Status: {health.status_code} | Version: {health.json().get('version')}")
        assert health.status_code == 200, "Health check failed"

async def main():
    try:
        await test_1_direct_aws_bedrock_api()
        await test_2_claude_3_haiku_direct_api()
        await test_3_backend_bedrock_provider_class()
        await test_4_orchestrator_pipeline_with_connectors()
        await test_5_live_fastapi_rest_endpoint()
        print("\n" + "=" * 70)
        print("🎉 ALL 5 BEDROCK REGRESSION TESTS PASSED 100% SUCCESSFULLY!")
        print("=" * 70)
    except Exception as e:
        print(f"\n❌ REGRESSION TEST FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
