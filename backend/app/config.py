import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "OmniRole AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./omnirole.db"

    # Active LLM Provider 1: Google Gemini AI Studio
    LLM_PROVIDER: str = "bedrock"
    LLM_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "meta.llama3-8b-instruct-v1:0"
    LLM_TIMEOUT_SECONDS: float = 60.0

    # Active LLM Provider 2: Groq LPUs (Ultra-Fast)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # Active LLM Provider 3: OpenRouter API
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "qwen/qwen-2.5-72b-instruct"

    # Active Google Cloud Gmail API Key
    GMAIL_API_KEY: str = ""

    # Secondary Credentials
    SEARCH_ENGINE_API_KEY: str = ""
    SEARCH_ENGINE_ID: str = "57f7ee5d76e55489b"
    ANTHROPIC_API_KEY: str = ""

    # Active Amazon Bedrock Key
    BEDROCK_API_KEY: str = ""
    BEDROCK_REGION: str = "ap-south-1"

    # Security
    SECRET_KEY: str = "omnirole_secret_key_change_in_production_12345"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # SMTP Email Configuration (Gmail App Password)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "23tec2cs758@vgu.ac.in"
    SMTP_PASSWORD: str = "vxelkfvdudgtqhrj"
    SMTP_FROM_EMAIL: str = "23tec2cs758@vgu.ac.in"
    SMTP_FROM_NAME: str = "OmniRole AI"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
