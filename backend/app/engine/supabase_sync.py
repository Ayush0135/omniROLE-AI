import httpx
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("supabase_sync")

SUPABASE_URL = "https://acrnaidtmuvpveegziaj.supabase.co/rest/v1"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcm5haWR0bXV2cHZlZWd6aWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDg1NTQsImV4cCI6MjEwMzQyNDU1NH0.PtkK9yxGPWUu-QyKp_mBUK1mqDhrmWZmdMGcS-xlmr8"

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation,resolution=merge-duplicates",
}


class SupabaseSyncEngine:
    @staticmethod
    async def post_to_supabase(table: str, data: Dict[str, Any]) -> bool:
        url = f"{SUPABASE_URL}/{table}"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(url, json=data, headers=HEADERS)
                if res.status_code in (200, 201, 204):
                    return True
                logger.warning(f"Supabase REST Sync Warning [{table}]: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Supabase REST Sync Exception [{table}]: {str(e)}")
        return False

    @staticmethod
    async def sync_user(user_id: str, email: str, name: str, plan: str = "Pro Developer", is_admin: bool = False):
        data = {
            "id": user_id,
            "email": email,
            "name": name,
            "plan": plan,
            "is_admin": is_admin,
            "status": "active",
            "monthly_token_limit": 500000,
        }
        await SupabaseSyncEngine.post_to_supabase("users", data)

    @staticmethod
    async def sync_role(role_data: Dict[str, Any]):
        await SupabaseSyncEngine.post_to_supabase("roles", role_data)

    @staticmethod
    async def delete_role(role_id: str):
        url = f"{SUPABASE_URL}/roles?id=eq.{role_id}"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.delete(url, headers=HEADERS)
        except Exception as e:
            logger.error(f"Supabase REST Delete Exception [roles]: {str(e)}")

    @staticmethod
    async def sync_conversation(conv_id: str, role_id: str, title: str = "New Conversation"):
        data = {
            "id": conv_id,
            "role_id": role_id,
            "title": title,
        }
        await SupabaseSyncEngine.post_to_supabase("conversations", data)

    @staticmethod
    async def sync_message(msg_id: str, conv_id: str, sender_type: str, content: str, tokens_used: int = 0, latency_ms: float = 0.0):
        data = {
            "id": msg_id,
            "conversation_id": conv_id,
            "sender_type": sender_type,
            "content": content,
            "tokens_used": tokens_used,
            "latency_ms": latency_ms,
        }
        await SupabaseSyncEngine.post_to_supabase("messages", data)

    @staticmethod
    async def sync_usage_record(rec_id: str, role_id: str, tokens_prompt: int, tokens_completion: int, tokens_total: int, latency_ms: float, endpoint: str):
        data = {
            "id": rec_id,
            "role_id": role_id,
            "tokens_prompt": tokens_prompt,
            "tokens_completion": tokens_completion,
            "tokens_total": tokens_total,
            "latency_ms": latency_ms,
            "endpoint": endpoint,
        }
        await SupabaseSyncEngine.post_to_supabase("usage_records", data)

    @staticmethod
    async def sync_connector_log(log_id: str, role_id: str, connector_type: str, query_params: Dict[str, Any], execution_result: Dict[str, Any], latency_ms: float):
        data = {
            "id": log_id,
            "role_id": role_id,
            "connector_type": connector_type,
            "query_params": query_params,
            "execution_result": execution_result,
            "latency_ms": latency_ms,
        }
        await SupabaseSyncEngine.post_to_supabase("connector_logs", data)

    @staticmethod
    async def sync_announcement(ann_id: str, title: str, message: str, banner_type: str = "info", action_url: str = None):
        data = {
            "id": ann_id,
            "title": title,
            "message": message,
            "banner_type": banner_type,
            "action_url": action_url,
            "is_active": True,
        }
        await SupabaseSyncEngine.post_to_supabase("announcements", data)

    @staticmethod
    async def sync_payment_request(pay_id: str, user_email: str, plan_name: str, amount_inr: float, utr_number: str, status: str = "pending"):
        data = {
            "id": pay_id,
            "user_email": user_email,
            "plan_name": plan_name,
            "amount_inr": amount_inr,
            "utr_number": utr_number,
            "status": status,
        }
        await SupabaseSyncEngine.post_to_supabase("payment_requests", data)

    @staticmethod
    async def sync_query_embedding(emb_id: str, role_id: str, query_text: str, embedding_vec: List[float]):
        data = {
            "id": emb_id,
            "role_id": role_id,
            "query_text": query_text,
            "embedding": embedding_vec[:20],  # Store clean vector preview
        }
        await SupabaseSyncEngine.post_to_supabase("query_embeddings", data)
