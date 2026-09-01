import json
import time
import requests

BASE_URL = "http://localhost:8000"

ROLES_TO_TEST = [
    {
        "name": "AI Safety & Alignment Researcher",
        "description": "Specialized in scalable oversight, RLHF alignment, reward modeling, and mechanistic interpretability.",
        "icon": "ShieldCheck",
        "system_prompt": "You are a Principal AI Safety Researcher. Analyze alignment challenges with scientific rigor, reference reward modeling, scalable oversight, and mechanistic interpretability.",
        "expertise": ["AI Alignment", "RLHF", "Mechanistic Interpretability", "Scalable Oversight"],
        "questions": [
            "Explain scalable oversight and constitutional AI principles in 3 bullet points.",
            "How do reward hacking and specification gaming differ in RLHF systems?"
        ]
    },
    {
        "name": "Post-Quantum Systems Architect",
        "description": "Expert in lattice-based cryptography, NIST PQC standards, and post-quantum TLS migration.",
        "icon": "Cpu",
        "system_prompt": "You are a Lead Post-Quantum Systems Architect. Evaluate PQC algorithms (Kyber, Dilithium) and migration strategies with deep technical depth.",
        "expertise": ["PQC", "Lattice Cryptography", "TLS 1.3", "NIST Standards"],
        "questions": [
            "Compare CRYSTALS-Dilithium vs SPHINCS+ digital signature schemes.",
            "What is the key size overhead when migrating TLS 1.3 to hybrid post-quantum mode?"
        ]
    },
    {
        "name": "Bioinformatics & Structural Analyst",
        "description": "Focuses on protein structure prediction, MSA representations, and computational genomics.",
        "icon": "Atom",
        "system_prompt": "You are a Senior Bioinformatics Researcher. Analyze structural biology, MSA transformers, and molecular dynamics with empirical precision.",
        "expertise": ["Bioinformatics", "Protein Folding", "AlphaFold", "Genomics"],
        "questions": [
            "Explain how AlphaFold2 utilizes Multiple Sequence Alignments (MSA) and Evoformers.",
            "What are the main computational bottlenecks in molecular dynamics simulations?"
        ]
    },
    {
        "name": "Legal Compliance Counsel",
        "description": "Assists with AI regulations, EU AI Act auditing, data privacy, and governance framework drafting.",
        "icon": "Scale",
        "system_prompt": "You are a Senior AI Compliance Counsel. Provide structured legal analysis referencing regulatory frameworks like the EU AI Act and GDPR.",
        "expertise": ["EU AI Act", "GDPR Compliance", "Risk Auditing", "AI Governance"],
        "questions": [
            "Summarize the EU AI Act high-risk AI system classification criteria.",
            "Draft 3 essential risk-mitigation clauses for AI data processing agreements."
        ]
    }
]

def run_deep_test_suite():
    print("=" * 70)
    print("🔬 OMNIROLE AI — DEEP MULTI-ROLE & MULTI-QUESTION RELIABILITY SUITE")
    print("=" * 70)

    start_suite_time = time.time()
    created_role_ids = []
    total_queries = 0
    total_tokens_accumulated = 0

    # Create API Key for external authentication testing
    key_res = requests.post(f"{BASE_URL}/api/v1/api-keys", json={"name": "Multi-Role Deep Suite Key"})
    assert key_res.status_code == 201, f"Failed to create key: {key_res.text}"
    api_key_data = key_res.json()
    raw_key = api_key_data["raw_key"]
    key_id = api_key_data["id"]
    headers = {"X-API-Key": raw_key, "Content-Type": "application/json"}
    print(f"🔑 Auth API Key Generated: {api_key_data['key_prefix']}\n")

    for idx, role_def in enumerate(ROLES_TO_TEST, 1):
        print("-" * 70)
        print(f"🎭 ROLE {idx}/{len(ROLES_TO_TEST)}: [{role_def['name']}]")
        print("-" * 70)

        # 1. Create Role
        role_payload = {
            "name": role_def["name"],
            "description": role_def["description"],
            "icon": role_def["icon"],
            "system_prompt": role_def["system_prompt"],
            "expertise": role_def["expertise"],
            "provider": "openai_compatible",
            "model_name": "gemini-2.5-flash",
            "temperature": 0.3,
            "max_tokens": 1500,
            "response_style": "Analytical & Precise",
            "status": "active",
        }
        res = requests.post(f"{BASE_URL}/api/v1/roles", json=role_payload)
        assert res.status_code == 201, f"Failed creating role {role_def['name']}: {res.text}"
        role_obj = res.json()
        created_role_ids.append(role_obj["id"])
        print(f"  ✓ Role Created successfully (ID: {role_obj['id']})")

        # 2. Ask Multiple Questions Per Role
        conversation_id = None
        for q_idx, question in enumerate(role_def["questions"], 1):
            total_queries += 1
            print(f"\n  ❓ Query {q_idx}: '{question}'")
            
            t0 = time.time()
            chat_payload = {
                "message": question,
                "conversation_id": conversation_id,
            }

            res = requests.post(
                f"{BASE_URL}/v1/roles/{role_obj['id']}/chat",
                json=chat_payload,
                headers=headers,
            )
            latency = round((time.time() - t0) * 1000, 2)
            assert res.status_code == 200, f"Chat failed for question '{question}': {res.text}"

            chat_data = res.json()
            conversation_id = chat_data["conversation_id"]
            tokens = chat_data["tokens_used"]["total_tokens"]
            total_tokens_accumulated += tokens

            print(f"  ⚡ Latency: {latency}ms | Model: {chat_data['model_used']} | Tokens Used: {tokens}")
            print(f"  🤖 Response:\n{chat_data['response'][:350]}...\n")

    # Clean up test roles and API key
    print("=" * 70)
    print("🧹 CLEANING UP CREATED TEST ROLES & KEYS")
    for rid in created_role_ids:
        requests.delete(f"{BASE_URL}/api/v1/roles/{rid}")
    requests.delete(f"{BASE_URL}/api/v1/api-keys/{key_id}")
    print("  ✓ Cleanup complete.")

    total_suite_time = round(time.time() - start_suite_time, 2)

    print("=" * 70)
    print("🎉 DEEP MULTI-ROLE SUITE COMPLETED SUCCESSFULLY!")
    print(f"📊 Total Roles Tested: {len(ROLES_TO_TEST)}")
    print(f"❓ Total Questions Executed: {total_queries}")
    print(f"🔢 Total Tokens Generated: {total_tokens_accumulated}")
    print(f"⏱ Total Suite Duration: {total_suite_time}s")
    print("=" * 70)

if __name__ == "__main__":
    run_deep_test_suite()
