import abc
import time
import httpx
import random
import base64
from typing import Dict, List, Any, Optional
from app.config import settings


class LLMProvider(abc.ABC):
    @abc.abstractmethod
    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        model_name: str,
        temperature: float,
        max_tokens: int,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        pass


class MockProvider(LLMProvider):
    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        model_name: str,
        temperature: float,
        max_tokens: int,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        start_time = time.time()
        last_user_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user_message = msg.get("content", "")
                break

        response_content = f"### Expert Response\n\nAnalyzed query: **'{last_user_message}'**."
        latency_ms = round((time.time() - start_time) * 1000 + 150, 2)
        prompt_tokens = max(len(system_prompt.split()) + len(last_user_message.split()) * 2, 45)
        completion_tokens = len(response_content.split()) * 2

        return {
            "response": response_content,
            "tokens_prompt": prompt_tokens,
            "tokens_completion": completion_tokens,
            "tokens_total": prompt_tokens + completion_tokens,
            "latency_ms": latency_ms,
            "provider": "mock",
            "model": model_name or "omni-mock-v1",
        }


class OpenAICompatibleProvider(LLMProvider):
    def __init__(self, base_url: str = None, api_key: str = None):
        self.base_url = (base_url or settings.LLM_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.LLM_API_KEY

    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        model_name: str,
        temperature: float,
        max_tokens: int,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        formatted_messages = [{"role": "system", "content": system_prompt}]
        for idx, msg in enumerate(messages):
            role = msg.get("role", "user")
            content = msg.get("content", "")
            msg_image = msg.get("image_url")
            if not msg_image and image_url and idx == len(messages) - 1 and role == "user":
                msg_image = image_url

            if msg_image:
                # If image is an http(s) URL, download and encode as base64 data URI
                if msg_image.startswith("http://") or msg_image.startswith("https://"):
                    try:
                        async with httpx.AsyncClient(timeout=10.0) as img_client:
                            img_resp = await img_client.get(msg_image)
                            if img_resp.status_code == 200:
                                ctype = img_resp.headers.get("content-type", "image/jpeg").split(";")[0]
                                b64_bytes = base64.b64encode(img_resp.content).decode("utf-8")
                                msg_image = f"data:{ctype};base64,{b64_bytes}"
                    except Exception:
                        pass

                formatted_messages.append({
                    "role": role,
                    "content": [
                        {"type": "text", "text": content or "Analyze this image and provide comprehensive answers to the user's questions."},
                        {"type": "image_url", "image_url": {"url": msg_image}}
                    ]
                })
            else:
                formatted_messages.append({
                    "role": role,
                    "content": content
                })

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        target_model = model_name
        if not target_model or "qwen" in target_model.lower() or "mock" in target_model.lower() or "gpt-oss" in target_model.lower():
            target_model = settings.LLM_MODEL or "gemini-2.5-flash"

        payload = {
            "model": target_model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        url = f"{self.base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code != 200:
                # If Gemini hits 429 (quota exceeded) or other errors, fallback to Groq LPU then OpenRouter
                if settings.GROQ_API_KEY:
                    try:
                        fallback_res = await GroqProvider().generate_response(
                            system_prompt, messages, settings.GROQ_MODEL, temperature, max_tokens, image_url=image_url
                        )
                        fallback_res["provider"] = "groq_gemini_fallback"
                        return fallback_res
                    except Exception:
                        pass
                if settings.OPENROUTER_API_KEY:
                    try:
                        fallback_res = await OpenRouterProvider().generate_response(
                            system_prompt, messages, settings.OPENROUTER_MODEL, temperature, max_tokens, image_url=image_url
                        )
                        fallback_res["provider"] = "openrouter_gemini_fallback"
                        return fallback_res
                    except Exception:
                        pass
                raise Exception(f"LLM API Error ({res.status_code}): {res.text}")
            
            data = res.json()
            latency_ms = round((time.time() - start_time) * 1000, 2)
            choice = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})

            tokens_prompt = usage.get("prompt_tokens", 0)
            tokens_completion = usage.get("completion_tokens", 0)
            tokens_total = usage.get("total_tokens", tokens_prompt + tokens_completion)

            return {
                "response": choice,
                "tokens_prompt": tokens_prompt,
                "tokens_completion": tokens_completion,
                "tokens_total": tokens_total,
                "latency_ms": latency_ms,
                "provider": "gemini",
                "model": target_model,
            }


class OpenRouterProvider(LLMProvider):
    def __init__(self, api_key: str = None):
        self.base_url = settings.OPENROUTER_BASE_URL.rstrip("/")
        self.api_key = api_key or settings.OPENROUTER_API_KEY

    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        model_name: str,
        temperature: float,
        max_tokens: int,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        if image_url or any(m.get("image_url") for m in messages):
            return await OpenAICompatibleProvider().generate_response(
                system_prompt, messages, "gemini-2.5-flash", temperature, max_tokens, image_url=image_url
            )

        start_time = time.time()
        
        formatted_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            formatted_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "OmniRole AI",
        }

        target_model = model_name
        if not target_model or "gemini" in target_model.lower() or "mock" in target_model.lower() or "gpt-oss" in target_model.lower():
            target_model = settings.OPENROUTER_MODEL or "qwen/qwen-2.5-72b-instruct"

        payload = {
            "model": target_model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        url = f"{self.base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code != 200:
                raise Exception(f"OpenRouter API Error ({res.status_code}): {res.text}")
            
            data = res.json()
            latency_ms = round((time.time() - start_time) * 1000, 2)
            choice = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})

            tokens_prompt = usage.get("prompt_tokens", 0)
            tokens_completion = usage.get("completion_tokens", 0)
            tokens_total = usage.get("total_tokens", tokens_prompt + tokens_completion)

            return {
                "response": choice,
                "tokens_prompt": tokens_prompt,
                "tokens_completion": tokens_completion,
                "tokens_total": tokens_total,
                "latency_ms": latency_ms,
                "provider": "openrouter",
                "model": target_model,
            }


class GroqProvider(LLMProvider):
    def __init__(self, api_key: str = None):
        self.base_url = "https://api.groq.com/openai/v1"
        self.api_key = api_key or settings.GROQ_API_KEY

    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        model_name: str,
        temperature: float,
        max_tokens: int,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        if image_url or any(m.get("image_url") for m in messages):
            return await OpenAICompatibleProvider().generate_response(
                system_prompt, messages, "gemini-2.5-flash", temperature, max_tokens, image_url=image_url
            )

        start_time = time.time()
        
        formatted_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            formatted_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        target_model = model_name
        if not target_model or "gemini" in target_model.lower() or "mock" in target_model.lower() or "qwen" in target_model.lower() or "llama-3.1-8b-instant" in target_model.lower():
            target_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"

        payload = {
            "model": target_model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        url = f"{self.base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            res = await client.post(url, json=payload, headers=headers)
            
            # If Groq returns non-200, fallback to OpenRouter then Gemini cleanly
            if res.status_code != 200:
                if settings.OPENROUTER_API_KEY:
                    try:
                        fallback_res = await OpenRouterProvider().generate_response(
                            system_prompt, messages, settings.OPENROUTER_MODEL, temperature, max_tokens, image_url=image_url
                        )
                        fallback_res["provider"] = "groq_openrouter_fallback"
                        return fallback_res
                    except Exception:
                        pass
                fallback_res = await OpenAICompatibleProvider().generate_response(
                    system_prompt, messages, "gemini-2.5-flash", temperature, max_tokens
                )
                fallback_res["provider"] = "groq_gemini_fallback"
                return fallback_res
            
            data = res.json()
            latency_ms = round((time.time() - start_time) * 1000, 2)
            choice_msg = data["choices"][0]["message"]
            choice = choice_msg.get("content") or choice_msg.get("reasoning") or ""
            
            usage = data.get("usage", {})
            tokens_prompt = usage.get("prompt_tokens", 0)
            tokens_completion = usage.get("completion_tokens", 0)
            tokens_total = usage.get("total_tokens", tokens_prompt + tokens_completion)

            return {
                "response": choice,
                "tokens_prompt": tokens_prompt,
                "tokens_completion": tokens_completion,
                "tokens_total": tokens_total,
                "latency_ms": latency_ms,
                "provider": "groq",
                "model": target_model,
            }


class BedrockProvider(LLMProvider):
    def __init__(self, api_key: str = None, region: str = None):
        self.api_key = api_key or settings.BEDROCK_API_KEY
        self.region = region or getattr(settings, "BEDROCK_REGION", "ap-south-1")

    async def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        model_name: str,
        temperature: float,
        max_tokens: int,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        start_time = time.time()

        if image_url or any(m.get("image_url") for m in messages):
            fallback_res = await OpenAICompatibleProvider().generate_response(
                system_prompt, messages, "gemini-2.5-flash", temperature, max_tokens, image_url=image_url
            )
            fallback_res["provider"] = "bedrock_multimodal_vision"
            return fallback_res

        target_model = model_name or "meta.llama3-8b-instruct-v1:0"
        url = f"https://bedrock-runtime.{self.region}.amazonaws.com/model/{target_model}/invoke"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        user_prompt = system_prompt + "\n\n"
        for m in messages:
            role_label = "User" if m.get("role") == "user" else "Assistant"
            user_prompt += f"{role_label}: {m.get('content', '')}\n"

        if "anthropic" in target_model.lower():
            payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens or 1024,
                "system": system_prompt,
                "messages": [{"role": m.get("role", "user"), "content": m.get("content", "")} for m in messages if m.get("role") in ("user", "assistant")],
                "temperature": temperature,
            }
        else:
            payload = {
                "prompt": user_prompt,
                "max_gen_len": max_tokens or 1024,
                "temperature": temperature,
            }

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code != 200:
                # Fallback to Gemini if Bedrock endpoint error
                fallback_res = await OpenAICompatibleProvider().generate_response(
                    system_prompt, messages, "gemini-2.5-flash", temperature, max_tokens
                )
                fallback_res["provider"] = "bedrock_gemini_fallback"
                return fallback_res

            data = res.json()
            latency_ms = round((time.time() - start_time) * 1000, 2)

            if "anthropic" in target_model.lower():
                choice = data["content"][0]["text"]
                usage = data.get("usage", {})
                tokens_prompt = usage.get("input_tokens", len(user_prompt.split()))
                tokens_completion = usage.get("output_tokens", len(choice.split()))
            else:
                choice = data.get("generation", "").strip()
                tokens_prompt = data.get("prompt_token_count", len(user_prompt.split()))
                tokens_completion = data.get("generation_token_count", len(choice.split()))

            tokens_total = tokens_prompt + tokens_completion

            return {
                "response": choice,
                "tokens_prompt": tokens_prompt,
                "tokens_completion": tokens_completion,
                "tokens_total": tokens_total,
                "latency_ms": latency_ms,
                "provider": "bedrock",
                "model": target_model,
            }


def get_llm_provider(provider_type: Optional[str] = None) -> LLMProvider:
    # AWS Bedrock is the primary default LLM engine across the studio
    if provider_type == "bedrock" or not provider_type:
        return BedrockProvider()
    if provider_type == "groq":
        return GroqProvider()
    if provider_type == "openrouter":
        return OpenRouterProvider()
    if provider_type in ("gemini", "openai_compatible"):
        return OpenAICompatibleProvider()
        
    return BedrockProvider()
