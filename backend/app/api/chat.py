import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Role, Conversation, Message, UsageRecord, SearchHistory, User
from app.schemas import ChatRequest, ChatResponse
from app.engine.orchestrator import SearchOrchestrator
from app.engine.supabase_sync import SupabaseSyncEngine
from app.api.deps import get_optional_user
from sqlalchemy import func

router = APIRouter(tags=["Chat Execution"])


@router.post("/roles/{id_or_slug}/chat", response_model=ChatResponse)
async def chat_with_role(
    id_or_slug: str,
    chat_in: ChatRequest,
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    role = (
        db.query(Role)
        .filter((Role.id == id_or_slug) | (Role.slug == id_or_slug))
        .first()
    )
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Role '{id_or_slug}' not found.",
        )

    # Enforce multi-tenant access control on private custom roles
    if role.user_id is not None and role.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to use this private AI Persona."
        )

    # Enforce Token Limits
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    
    if not user or user.plan not in ["Pro Developer", "Enterprise"]:
        # Free Tier: Enforce 20,000 daily token limit
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_tokens = db.query(func.sum(UsageRecord.tokens_total)).filter(
            UsageRecord.created_at >= today_start,
            UsageRecord.user_id == user_id if user_id else UsageRecord.user_id.is_(None),
        ).scalar() or 0
        if daily_tokens >= 20000:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Free Tier daily limit of 20,000 tokens reached. Please upgrade to Pro Developer for 500,000 monthly tokens."
            )
    else:
        # Premium Tier: Enforce custom monthly token limit
        current_used = user.tokens_used_this_month or 0
        limit = user.monthly_token_limit or 500000
        if current_used >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Premium monthly limit of {limit:,} tokens reached. Your service has been paused. Please upgrade your plan or wait for the next billing cycle."
            )

    # 1. Manage Conversation with strict user isolation
    conversation = None
    if chat_in.conversation_id:
        conv_query = db.query(Conversation).filter(
            Conversation.id == chat_in.conversation_id,
            Conversation.role_id == role.id
        )
        if user_id:
            conv_query = conv_query.filter(Conversation.user_id == user_id)
        conversation = conv_query.first()

    if not conversation:
        conversation = Conversation(
            role_id=role.id,
            user_id=user_id,
            title=chat_in.message[:40] if chat_in.message else "Conversation",
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 2. Save User Message
    user_msg = Message(
        conversation_id=conversation.id,
        sender_type="user",
        content=chat_in.message,
        image_url=chat_in.image_url,
    )
    db.add(user_msg)
    db.commit()

    # 3. Format Message History
    history_list = []
    if chat_in.history:
        for msg in chat_in.history:
            history_list.append({
                "role": msg.role,
                "content": msg.content,
                "image_url": getattr(msg, "image_url", None),
            })
    else:
        past_msgs = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
            .all()
        )
        for pm in past_msgs:
            history_list.append({
                "role": "user" if pm.sender_type == "user" else "assistant",
                "content": pm.content,
                "image_url": getattr(pm, "image_url", None),
            })

    # 4. Process Request via Vector & RL Orchestrator
    llm_result = await SearchOrchestrator.process_role_request(
        db=db,
        role=role,
        message=chat_in.message,
        history=history_list,
        temperature_override=chat_in.temperature,
        max_tokens_override=chat_in.max_tokens,
        image_url=chat_in.image_url,
        connectors_override=chat_in.connectors,
    )

    # 5. Save Assistant Message
    assistant_msg = Message(
        conversation_id=conversation.id,
        sender_type="assistant",
        content=llm_result["response"],
        tokens_used=llm_result["tokens_total"],
        latency_ms=llm_result["latency_ms"],
    )
    db.add(assistant_msg)

    # 6. Record Usage Telemetry — strictly tagged to user_id
    usage = UsageRecord(
        user_id=user_id,
        role_id=role.id,
        tokens_prompt=llm_result["tokens_prompt"],
        tokens_completion=llm_result["tokens_completion"],
        tokens_total=llm_result["tokens_total"],
        latency_ms=llm_result["latency_ms"],
        endpoint=f"/api/v1/roles/{role.id}/chat",
    )
    db.add(usage)

    # 7. Record in SearchHistory if web search or rag was performed
    if user_id:
        connector_outs = llm_result.get("connector_outputs", [])
        for c in connector_outs:
            if c.get("connector") in ["web_search", "vector_rag"]:
                sh = SearchHistory(
                    user_id=user_id,
                    conversation_id=conversation.id,
                    query_text=chat_in.message,
                    search_type=c.get("connector"),
                    sources_cited=c.get("sources", []),
                )
                db.add(sh)
    
    # Increment tokens for user
    if user:
        user.tokens_used_this_month = (user.tokens_used_this_month or 0) + llm_result["tokens_total"]
        
    db.commit()

    # Direct Real-Time Sync to Supabase PostgreSQL
    asyncio.create_task(
        SupabaseSyncEngine.sync_conversation(conversation.id, role.id, conversation.title)
    )
    asyncio.create_task(
        SupabaseSyncEngine.sync_message(user_msg.id, conversation.id, "user", chat_in.message)
    )
    asyncio.create_task(
        SupabaseSyncEngine.sync_message(assistant_msg.id, conversation.id, "assistant", llm_result["response"], llm_result["tokens_total"], llm_result["latency_ms"])
    )
    asyncio.create_task(
        SupabaseSyncEngine.sync_usage_record(usage.id, role.id, llm_result["tokens_prompt"], llm_result["tokens_completion"], llm_result["tokens_total"], llm_result["latency_ms"], f"/api/v1/roles/{role.id}/chat")
    )

    return ChatResponse(
        role_id=role.id,
        role_name=role.name,
        conversation_id=conversation.id,
        response=llm_result["response"],
        model_used=llm_result["model"],
        provider_used=llm_result["provider"],
        tokens_used={
            "prompt_tokens": llm_result["tokens_prompt"],
            "completion_tokens": llm_result["tokens_completion"],
            "total_tokens": llm_result["tokens_total"],
        },
        latency_ms=llm_result["latency_ms"],
        created_at=datetime.utcnow(),
        connector_outputs=llm_result.get("connector_outputs", []),
    )
