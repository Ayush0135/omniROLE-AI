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
            source_counter = 1
            for c in connector_outputs:
                c_type = c.get("connector", "tool")
                if c_type == "web_search":
                    sources = c.get("sources", [])
                    if sources:
                        for s in sources:
                            t = s.get("title", "Web Page")
                            u = s.get("url", "")
                            sn = s.get("snippet", "")
                            dom = s.get("domain", "Web")
                            conn_summary.append(f"[{source_counter}] (Web Search - {dom}): {t}\n    URL: {u}\n    Excerpt: {sn}")
                            source_counter += 1
                    else:
                        abstract = c.get("abstract", "")
                        conn_summary.append(f"[{source_counter}] (Live Web Search): {abstract}")
                        source_counter += 1
                elif c_type == "vector_rag":
                    sources = c.get("sources", [])
                    if sources:
                        for s in sources:
                            dt = s.get("title", "Document")
                            rel = s.get("similarity", 0)
                            sn = s.get("snippet", "")
                            conn_summary.append(f"[{source_counter}] (Vector Knowledge Base: {dt}, Relevance: {rel}):\n    Excerpt: {sn}")
                            source_counter += 1
                    elif c.get("retrieved_vector_chunks"):
                        for ch in c.get("retrieved_vector_chunks"):
                            qt = ch.get("query_text", "")
                            sc = ch.get("similarity", 0)
                            conn_summary.append(f"[{source_counter}] (Knowledge Base): {qt} (Score: {sc})")
                            source_counter += 1
                elif c_type == "code_executor" and c.get("status") == "success":
                    out = c.get("output", "")
                    conn_summary.append(f"- [Sandboxed Code Output]:\n{out}")
                elif c_type == "database_query":
                    at = c.get("active_tables", [])
                    conn_summary.append(f"- [Database Schema Connector]: Active tables = {at}")

            if conn_summary:
                grounding_text = (
                    "\n=== REAL-TIME GROUNDING KNOWLEDGE & CITATIONS ===\n"
                    + "\n\n".join(conn_summary)
                    + "\n\n"
                    "EXECUTIVE PRESENTATION & CITATION DIRECTIVES:\n"
                    "1. Structure your entire response professionally using GitHub-flavored Markdown (hierarchical headings ## and ###, bulleted points, bolded key phrases, tables or code blocks where appropriate).\n"
                    "2. Integrate factual claims with the grounding data provided above, citing sources inline with bracketed notation like [1], [2].\n"
                    "3. At the end of your response, always append a formatted '### 📚 References & Sources' section listing each cited source with its [number], title, and clickable Markdown link [Title](URL) or document badge.\n"
                    "4. Maintain an articulate, authoritative, and clean tone suitable for an executive AI copilot."
                )
                augmented_prompt_parts.append(grounding_text)

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
