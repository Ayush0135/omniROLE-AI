from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Role, APIKey, UsageRecord, Conversation, Message
from app.schemas import ChatRequest, ChatResponse
from app.api.deps import verify_api_key
from app.engine.orchestrator import SearchOrchestrator

router = APIRouter(prefix="/v1", tags=["Public Developer API"])


@router.post("/roles/{role_id}/chat", response_model=ChatResponse)
async def public_chat_with_role(
    role_id: str,
    chat_in: ChatRequest,
    api_key: APIKey = Depends(verify_api_key),
    db: Session = Depends(get_db),
):
    role = (
        db.query(Role)
        .filter((Role.id == role_id) | (Role.slug == role_id))
        .first()
    )
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Role '{role_id}' not found.",
        )

    if role.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"AI Role '{role.name}' is currently inactive or archived.",
        )

    conversation = None
    if chat_in.conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == chat_in.conversation_id, Conversation.role_id == role.id)
            .first()
        )
    if not conversation:
        conversation = Conversation(
            role_id=role.id,
            title=chat_in.message[:40] if chat_in.message else "API Conversation",
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_msg = Message(
        conversation_id=conversation.id,
        sender_type="user",
        content=chat_in.message,
        image_url=chat_in.image_url,
    )
    db.add(user_msg)
    db.commit()

    history_list = []
    if chat_in.history:
        for msg in chat_in.history:
            history_list.append({
                "role": msg.role,
                "content": msg.content,
                "image_url": getattr(msg, "image_url", None),
            })
    else:
        history_list.append({"role": "user", "content": chat_in.message, "image_url": chat_in.image_url})

    # Process Request via Vector & RL Orchestrator
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

    assistant_msg = Message(
        conversation_id=conversation.id,
        sender_type="assistant",
        content=llm_result["response"],
        tokens_used=llm_result["tokens_total"],
        latency_ms=llm_result["latency_ms"],
    )
    db.add(assistant_msg)

    usage = UsageRecord(
        role_id=role.id,
        api_key_id=api_key.id,
        tokens_prompt=llm_result["tokens_prompt"],
        tokens_completion=llm_result["tokens_completion"],
        tokens_total=llm_result["tokens_total"],
        latency_ms=llm_result["latency_ms"],
        endpoint=f"/v1/roles/{role_id}/chat",
    )
    db.add(usage)
    db.commit()

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
