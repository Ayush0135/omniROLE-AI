from typing import List, Optional


class PromptBuilder:
    @staticmethod
    def build_system_prompt(
        role_name: str,
        role_description: str,
        system_prompt: str,
        expertise: List[str],
        response_style: str = "Analytical & Precise",
    ) -> str:
        expertise_str = ", ".join(expertise) if expertise else "General Domain Expertise"

        sections = [
            f"=== ROLE IDENTITY ===",
            f"Role Name: {role_name}",
            f"Role Description: {role_description}",
            f"Core Expertise: {expertise_str}",
            f"Response Style: {response_style}",
            "",
            f"=== BASE SYSTEM INSTRUCTIONS ===",
            system_prompt.strip(),
            "",
            f"=== OPERATIONAL DIRECTIVES ===",
            f"1. Adopt the persona of a senior expert in {role_name}.",
            f"2. Apply domain-specific principles matching expertise in [{expertise_str}].",
            f"3. Maintain a {response_style} tone throughout your response.",
            f"4. Provide structured, accurate, and actionable insights.",
        ]

        return "\n".join(sections)
