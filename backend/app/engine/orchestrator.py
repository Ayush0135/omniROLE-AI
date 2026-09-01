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
        history: List[Dict[str, str]],
        temperature_override: float = None,
        max_tokens_override: int = None,
    ) -> Dict[str, Any]:
        # 1. Vectorize & Store Query Vector
        await VectorEngine.store_query_vector(db, role.id, message)

        # 2. Get RL-recommended action (style, temperature, connectors)
        rl_style, rl_temp, rl_connectors = RLOptimizer.get_next_action(db, role.id)

        # Use RL-recommended connectors if role hasn't explicitly overridden them
        enabled_connectors = rl_connectors if rl_connectors else (
            role.connectors if hasattr(role, "connectors") and role.connectors
            else ["vector_rag", "web_search"]
        )

        # 3. Execute Role Multi-Connectors
        connector_outputs = await ConnectorManager.run_enabled_connectors(
            db=db,
            role_id=role.id,
            enabled_connector_names=enabled_connectors,
            query=message,
        )

        # 3. Vector Similarity Search for Related Contexts
        similar_past_queries = await VectorEngine.search_similar_queries(db, role.id, message, limit=2)

        # 4. Retrieve RL Optimization Directives
        rl_directives = RLOptimizer.get_rl_directives(db, role.id)

        # 5. Build Augmented System Prompt — use RL-recommended style
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
                    conn_summary.append(f"- [Web Grounding]: {c.get('abstract', '')}")
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
                f"\n=== VECTOR SEARCH CONTEXT (Relevant Past Queries) ===\n{vector_context_str}"
            )

        if rl_directives:
            augmented_prompt_parts.append(f"\n=== RL REWARD DIRECTIVES ===\n{rl_directives}")

        final_system_prompt = "\n".join(augmented_prompt_parts)

        # 6. Format History Payload
        formatted_messages = list(history) if history else []
        if not formatted_messages or formatted_messages[-1].get("content") != message:
            formatted_messages.append({"role": "user", "content": message})

        # 7. Execute LLM Provider — use RL-recommended temperature
        provider = get_llm_provider(role.provider)
        target_temp = temperature_override if temperature_override is not None else rl_temp
        target_max_tokens = max_tokens_override if max_tokens_override is not None else role.max_tokens

        llm_result = await provider.generate_response(
            system_prompt=final_system_prompt,
            messages=formatted_messages,
            model_name=role.model_name,
            temperature=target_temp,
            max_tokens=target_max_tokens,
        )

        llm_result["similar_queries_vector"] = similar_past_queries
        llm_result["rl_directives_applied"]  = bool(rl_directives)
        llm_result["connector_outputs"]       = connector_outputs
        # Expose the action chosen so the frontend can send it back with feedback
        llm_result["rl_action"] = {
            "response_style": rl_style,
            "temperature":    target_temp,
            "connectors":     enabled_connectors,
        }
        return llm_result

        return llm_result
