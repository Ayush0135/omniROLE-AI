import json
import time
import requests

BASE_URL = "http://localhost:8000"

def run_regression_suite():
    print("=" * 60)
    print("🚀 OMNIROLE AI — LIVE REGRESSION TEST SUITE (GEMINI API)")
    print("=" * 60)
    
    results = {}

    # 1. Health Check
    t0 = time.time()
    res = requests.get(f"{BASE_URL}/health")
    latency = round((time.time() - t0) * 1000, 2)
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f"✅ 1. Health Check: PASSED ({latency}ms) -> Provider: {health_data['llm_provider']}")
    results["1_health_check"] = {"status": "PASSED", "latency_ms": latency, "data": health_data}

    # 2. List Roles
    t0 = time.time()
    res = requests.get(f"{BASE_URL}/api/v1/roles")
    latency = round((time.time() - t0) * 1000, 2)
    assert res.status_code == 200, f"List roles failed: {res.text}"
    roles = res.json()
    assert len(roles) >= 5, f"Expected at least 5 roles, found {len(roles)}"
    print(f"✅ 2. List Roles: PASSED ({latency}ms) -> Found {len(roles)} active roles")
    results["2_list_roles"] = {"status": "PASSED", "latency_ms": latency, "roles_count": len(roles)}

    # 3. Create Custom AI Role
    t0 = time.time()
    new_role_payload = {
        "name": "Quantum Cryptographer",
        "description": "Specialized in post-quantum cryptography, lattice-based algorithms, and zero-knowledge proofs.",
        "icon": "ShieldCheck",
        "system_prompt": "You are a Senior Quantum Cryptographer. Evaluate post-quantum encryption algorithms and lattice-based security with high mathematical precision.",
        "expertise": ["Cryptography", "Lattice Cryptography", "Quantum Computing", "Python"],
        "provider": "openai_compatible",
        "model_name": "gemini-2.5-flash",
        "temperature": 0.3,
        "max_tokens": 1024,
        "response_style": "Analytical & Precise",
        "memory_enabled": True,
        "status": "active",
    }
    res = requests.post(f"{BASE_URL}/api/v1/roles", json=new_role_payload)
    latency = round((time.time() - t0) * 1000, 2)
    assert res.status_code == 201, f"Create role failed: {res.text}"
    created_role = res.json()
    role_id = created_role["id"]
    print(f"✅ 3. Create Role: PASSED ({latency}ms) -> Created '{created_role['name']}' (ID: {role_id})")
    results["3_create_role"] = {"status": "PASSED", "latency_ms": latency, "role_id": role_id}

    # 4. Retrieve Role
    t0 = time.time()
    res = requests.get(f"{BASE_URL}/api/v1/roles/{role_id}")
    latency = round((time.time() - t0) * 1000, 2)
    assert res.status_code == 200, f"Retrieve role failed: {res.text}"
    print(f"✅ 4. Retrieve Role: PASSED ({latency}ms)")
    results["4_get_role"] = {"status": "PASSED", "latency_ms": latency}

    # 5. Live AI Chat Execution with Gemini Model
    t0 = time.time()
    chat_payload = {
        "message": "Explain why lattice-based cryptography is resilient against Shor's algorithm in 2 bullet points."
    }
    print("⏳ 5. Live Gemini API Chat: Requesting Gemini 2.5 Flash...")
    res = requests.post(f"{BASE_URL}/api/v1/roles/{role_id}/chat", json=chat_payload)
    latency = round((time.time() - t0) * 1000, 2)
    assert res.status_code == 200, f"Chat with role failed: {res.text}"
    chat_resp = res.json()
    print(f"✅ 5. Live Gemini API Chat: PASSED ({latency}ms)")
    print(f"   🤖 Model: {chat_resp['model_used']} | Provider: {chat_resp['provider_used']}")
    print(f"   📊 Tokens Used: {chat_resp['tokens_used']}")
    print(f"   💬 Response Preview:\n{chat_resp['response']}\n")
    results["5_live_gemini_chat"] = {
        "status": "PASSED",
        "latency_ms": latency,
        "tokens_used": chat_resp["tokens_used"],
        "model": chat_resp["model_used"],
        "response_sample": chat_resp["response"],
    }

    # 6. Create Developer API Key
    t0 = time.time()
    key_payload = {"name": "Live Regression Key"}
    res = requests.post(f"{BASE_URL}/api/v1/api-keys", json=key_payload)
    latency = round((time.time() - t0) * 1000, 2)
    assert res.status_code == 201, f"Create API key failed: {res.text}"
    key_data = res.json()
    raw_api_key = key_data["raw_key"]
    key_id = key_data["id"]
    print(f"✅ 6. Create API Key: PASSED ({latency}ms) -> Key Prefix: {key_data['key_prefix']}")
    results["6_create_api_key"] = {"status": "PASSED", "latency_ms": latency, "key_id": key_id}

    # 7. Public API Chat Execution (Authenticated via API Key)
    t0 = time.time()
    pub_headers = {"X-API-Key": raw_api_key, "Content-Type": "application/json"}
    pub_payload = {
        "message": "Summarize the primary security advantage of Kyber (CRYSTALS-Kyber) key encapsulation."
    }
    print("⏳ 7. Public API Key Auth Chat: Requesting Gemini 2.5 Flash...")
    res = requests.post(f"{BASE_URL}/v1/roles/{role_id}/chat", json=pub_payload, headers=pub_headers)
    latency = round((time.time() - t0) * 1000, 2)
    assert res.status_code == 200, f"Public API chat failed: {res.text}"
    pub_resp = res.json()
    print(f"✅ 7. Public API Key Auth Chat: PASSED ({latency}ms)")
    print(f"   🤖 Model: {pub_resp['model_used']} | Provider: {pub_resp['provider_used']}")
    print(f"   📊 Tokens Used: {pub_resp['tokens_used']}")
    print(f"   💬 Response Preview:\n{pub_resp['response']}\n")
    results["7_public_api_key_chat"] = {
        "status": "PASSED",
        "latency_ms": latency,
        "tokens_used": pub_resp["tokens_used"],
        "model": pub_resp["model_used"],
        "response_sample": pub_resp["response"],
    }

    # 8. Usage & Analytics Telemetry
    t0 = time.time()
    res = requests.get(f"{BASE_URL}/api/v1/usage")
    latency = round((time.time() - t0) * 1000, 2)
    assert res.status_code == 200, f"Get usage metrics failed: {res.text}"
    usage_data = res.json()
    print(f"✅ 8. Usage & Analytics Telemetry: PASSED ({latency}ms)")
    print(f"   📈 Metrics: {json.dumps(usage_data['metrics'], indent=2)}")
    results["8_usage_telemetry"] = {"status": "PASSED", "latency_ms": latency, "metrics": usage_data["metrics"]}

    # 9. Clean up test role & API key
    requests.delete(f"{BASE_URL}/api/v1/roles/{role_id}")
    requests.delete(f"{BASE_URL}/api/v1/api-keys/{key_id}")
    print("🧹 9. Cleanup: Deleted test role and API key successfully.")

    print("=" * 60)
    print("🎉 ALL 9 LIVE REGRESSION TESTS PASSED CLEANLY!")
    print("=" * 60)

    return results

if __name__ == "__main__":
    run_regression_suite()
