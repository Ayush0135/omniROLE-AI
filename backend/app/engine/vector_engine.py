import math
import httpx
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.config import settings
from app.models import QueryEmbedding


class VectorEngine:
    @staticmethod
    async def generate_embedding(text: str) -> List[float]:
        """
        Generates 768-dimensional text embedding vector using Google AI Studio OpenAI-compatible API.
        Fallback to normalized pseudo-random vector if API endpoint is unreachable.
        """
        url = f"{settings.LLM_BASE_URL.rstrip('/')}/embeddings"
        headers = {"Content-Type": "application/json"}
        if settings.LLM_API_KEY:
            headers["Authorization"] = f"Bearer {settings.LLM_API_KEY}"

        payload = {
            "input": text,
            "model": "text-embedding-004"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return data["data"][0]["embedding"]
            except Exception:
                pass

        # Fallback deterministic 768-dim embedding derived from hash of input text
        seed = sum(ord(c) for c in text)
        vec = [math.sin(seed * (i + 1)) for i in range(768)]
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]

    @staticmethod
    async def store_query_vector(db: Session, role_id: str, query_text: str) -> QueryEmbedding:
        from app.engine.supabase_sync import SupabaseSyncEngine
        import asyncio

        embedding_vec = await VectorEngine.generate_embedding(query_text)
        record = QueryEmbedding(
            role_id=role_id,
            query_text=query_text,
            embedding=embedding_vec,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        # Sync 768d pgvector preview to Supabase PostgreSQL
        asyncio.create_task(
            SupabaseSyncEngine.sync_query_embedding(record.id, role_id, query_text, embedding_vec)
        )
        return record

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot / (norm_a * norm_b)

    @staticmethod
    async def search_similar_queries(db: Session, role_id: str, query_text: str, limit: int = 3) -> List[Dict[str, Any]]:
        query_vec = await VectorEngine.generate_embedding(query_text)
        records = db.query(QueryEmbedding).filter(QueryEmbedding.role_id == role_id).all()

        scored = []
        for r in records:
            if r.embedding:
                sim = VectorEngine.cosine_similarity(query_vec, r.embedding)
                scored.append({"query_text": r.query_text, "similarity": round(sim, 4)})

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:limit]
