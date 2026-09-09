import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Sales Agent — Signal to Opportunity"
    API_V1_STR: str = "/api/v1"
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Mode: Demo mode runs high-fidelity local sales engine; False connects live external APIs
    DEMO_MODE: bool = True

    # TODO: [Integration] LLM Providers — Set API key to use live model for dialogue and extraction
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # TODO: [Integration] Voice & Telephony APIs (ElevenLabs, Twilio, Vapi)
    ELEVENLABS_API_KEY: Optional[str] = None
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_FROM_NUMBER: Optional[str] = None

    # TODO: [Integration] CRM APIs (HubSpot, Salesforce)
    HUBSPOT_ACCESS_TOKEN: Optional[str] = None
    SALESFORCE_INSTANCE_URL: Optional[str] = None
    SALESFORCE_ACCESS_TOKEN: Optional[str] = None

    # TODO: [Integration] Lead Enrichment APIs (Apollo, Clearbit, ZoomInfo)
    APOLLO_API_KEY: Optional[str] = None

    # Database & Authentication
    DATABASE_URL: str = "sqlite:///./sales_agent.db"
    VECTOR_DB_URL: Optional[str] = None
    JWT_SECRET: str = "ai_sales_agent_super_secret_jwt_key_2026_production_grade"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()

