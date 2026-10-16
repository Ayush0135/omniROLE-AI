from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import Role
from app.engine.prompt_builder import PromptBuilder
from app.engine.vector_engine import VectorEngine
from app.engine.rl_optimizer import RLOptimizer
from app.engine.llm_provider import get_llm_provider
from app.engine.connectors.manager import ConnectorManager


class SearchOrchestrator:
    @staticmethod
    async def process_role_request(
        db: Session,
        role: Role,
        message: str,
        history: List[Dict[str, Any]],
        temperature_override: float = None,
        max_tokens_override: int = None,
        image_url: str = None,
        connectors_override: List[str] = None,
    ) -> Dict[str, Any]:
        # 1. Vectorize & Store Query Vector
        await VectorEngine.store_query_vector(db, role.id, message)

        # 2. Get RL-recommended action (style, temperature, connectors)
        rl_style, rl_temp, rl_connectors = RLOptimizer.get_next_action(db, role.id)

        # Use explicitly provided connectors if passed by caller, otherwise RL or role default
        if connectors_override is not None:
            enabled_connectors = connectors_override
        elif rl_connectors:
            enabled_connectors = rl_connectors
        elif hasattr(role, "connectors") and role.connectors:
            enabled_connectors = role.connectors
        else:
            enabled_connectors = ["vector_rag", "web_search"]

        # 3. Execute Role Multi-Connectors
        connector_outputs = await ConnectorManager.run_enabled_connectors(
            db=db,
            role_id=role.id,
            enabled_connector_names=enabled_connectors,
            query=message,
        )

        # 4. Vector Similarity Search for Related Contexts / Knowledge chunks
        similar_past_queries = await VectorEngine.search_similar_queries(db, role.id, message, limit=3)

        # 5. Retrieve RL Optimization Directives
        rl_directives = RLOptimizer.get_rl_directives(db, role.id)

        # 6. Build Augmented System Prompt
        base_system_prompt = PromptBuilder.build_system_prompt(
            role_name=role.name,
            role_description=role.description,
            system_prompt=role.system_prompt,
            expertise=role.expertise or [],
            response_style=rl_style or role.response_style or "Analytical & Precise",
        )

        augmented_prompt_parts = [base_system_prompt]

        if connector_outputs:
            conn_summary = []
            for c in connector_outputs:
                c_type = c.get("connector", "tool")
                if c_type == "web_search":
                    abstract = c.get("abstract", "")
                    topics = c.get("related_topics", [])
                    topic_text = f" (Related: {', '.join(topics)})" if topics else ""
                    conn_summary.append(f"- [Live Web Search Grounding]: {abstract}{topic_text}")
                elif c_type == "vector_rag":
                    chunks = c.get("retrieved_vector_chunks", [])
                    if chunks:
                        chunk_str = "; ".join([f"'{chunk.get('query_text')}' (Score: {chunk.get('similarity')})" for chunk in chunks])
                        conn_summary.append(f"- [Vector RAG Knowledge Base]: {chunk_str}")
                elif c_type == "code_executor" and c.get("status") == "success":
                    conn_summary.append(f"- [Code Execution Result]: {c.get('output', '')}")
                elif c_type == "database_query":
                    conn_summary.append(f"- [DB Schema Connector]: Active tables = {c.get('active_tables', [])}")
            if conn_summary:
                augmented_prompt_parts.append(
                    f"\n=== ACTIVE CONNECTORS GROUNDING DATA ===\n" + "\n".join(conn_summary)
                )

        if similar_past_queries:
            vector_context_str = "\n".join([f"- {q['query_text']} (Sim: {q['similarity']})" for q in similar_past_queries])
            augmented_prompt_parts.append(
                f"\n=== VECTOR SEARCH CONTEXT (Relevant Past Queries & Knowledge) ===\n{vector_context_str}"
            )

        if rl_directives:
            augmented_prompt_parts.append(f"\n=== RL REWARD DIRECTIVES ===\n{rl_directives}")

        final_system_prompt = "\n".join(augmented_prompt_parts)

        # 7. Format History Payload
        formatted_messages = list(history) if history else []
        last_msg_matches = formatted_messages and formatted_messages[-1].get("content") == message
        if not last_msg_matches:
            new_user_msg = {"role": "user", "content": message}
            if image_url:
                new_user_msg["image_url"] = image_url
            formatted_messages.append(new_user_msg)
        elif image_url and not formatted_messages[-1].get("image_url"):
            formatted_messages[-1]["image_url"] = image_url

        # 8. Execute LLM Provider — use RL-recommended temperature
        provider = get_llm_provider(role.provider)
        target_temp = temperature_override if temperature_override is not None else rl_temp
        target_max_tokens = max_tokens_override if max_tokens_override is not None else role.max_tokens

        llm_result = await provider.generate_response(
            system_prompt=final_system_prompt,
            messages=formatted_messages,
            model_name=role.model_name,
            temperature=target_temp,
            max_tokens=target_max_tokens,
            image_url=image_url,
        )

        llm_result["similar_queries_vector"] = similar_past_queries
        llm_result["rl_directives_applied"] = bool(rl_directives)
        llm_result["connector_outputs"] = connector_outputs
        llm_result["rl_action"] = {
            "response_style": rl_style,
            "temperature": target_temp,
            "connectors": enabled_connectors,
        }
        return llm_result
