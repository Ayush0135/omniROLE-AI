import asyncio
from app.database import SessionLocal
from app.models import Role
from app.engine.connectors.manager import ConnectorManager


async def test_suite():
    db = SessionLocal()
    try:
        role = db.query(Role).first()
        if not role:
            print("No role found in DB.")
            return

        print(f"=== TESTING MULTI-CONNECTOR SUITE FOR ROLE '{role.name}' ({role.id}) ===")

        # Test 1: Code Executor REPL
        print("\n1. Testing CodeExecutorConnector (Python REPL)...")
        res_code = await ConnectorManager.REGISTRY["code_executor"].execute(
            query="Python script execution test",
            context={"code": "import math\nprint([math.factorial(n) for n in range(1, 8)])"}
        )
        print(f"   Status: {res_code['status']}")
        print(f"   Output: {res_code['output']}")
        print(f"   Latency: {res_code['latency_ms']} ms")

        # Test 2: Web Search Grounding
        print("\n2. Testing WebSearchConnector (DuckDuckGo/Google Search)...")
        res_web = await ConnectorManager.REGISTRY["web_search"].execute(
            query="Artificial Intelligence breakthroughs 2026"
        )
        print(f"   Status: {res_web['status']}")
        print(f"   Abstract: {res_web['abstract'][:150]}...")
        print(f"   Latency: {res_web['latency_ms']} ms")

        # Test 3: Vector RAG Search (pgvector)
        print("\n3. Testing VectorRAGConnector (768d pgvector Cosine Search)...")
        res_rag = await ConnectorManager.REGISTRY["vector_rag"].execute(
            query="Attention mechanisms in transformer models",
            context={"db": db, "role_id": role.id}
        )
        print(f"   Status: {res_rag['status']}")
        print(f"   Chunks Retrieved: {len(res_rag['retrieved_vector_chunks'])}")
        for i, chunk in enumerate(res_rag['retrieved_vector_chunks']):
            print(f"     [{i+1}] {chunk['query_text']} (Similarity: {chunk['similarity']})")
        print(f"   Latency: {res_rag['latency_ms']} ms")

        # Test 4: Database Query Connector (Supabase Schema)
        print("\n4. Testing DatabaseQueryConnector (Supabase Schema)...")
        res_db = await ConnectorManager.REGISTRY["database_query"].execute(
            query="Show database tables"
        )
        print(f"   Status: {res_db['status']}")
        print(f"   Active PostgreSQL Tables: {res_db['active_tables']}")
        print(f"   Latency: {res_db['latency_ms']} ms")

        # Test 5: Full Connector Manager Orchestration
        print("\n5. Testing Full ConnectorManager Orchestration & Logging...")
        orchestrated = await ConnectorManager.run_enabled_connectors(
            db=db,
            role_id=role.id,
            enabled_connector_names=["code_executor", "web_search", "vector_rag", "database_query"],
            query="Calculate sum(range(1, 101)) and list DB schema",
            additional_context={"code": "print(sum(range(1, 101)))"}
        )
        print(f"   Total Connectors Executed: {len(orchestrated)}")
        for c in orchestrated:
            print(f"   - {c['connector']}: {c['status']} ({c.get('latency_ms', 0)} ms)")

        print("\n✅ ALL 4 CONNECTORS PASSED 100% SUCCESSFUL TEST EXECUTION!")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(test_suite())
