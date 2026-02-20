# backend/config.py
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict  # <-- v2 API

class Settings(BaseSettings):
    # v2 style config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",            # <-- ignore keys not declared below
    )

    # Keys
    OPENAI_API_KEY: str = Field("", description="OpenAI API key")

    # LLM
    LLM_MODEL: str = Field("gpt-4o-mini", description="Primary chat/translate/action model")

    # STT
    STT_BACKEND: Literal["openai", "faster"] = Field("openai", description="STT engine selector")
    WHISPER_MODEL: str = Field("whisper-1", description="OpenAI Whisper model id")

    # Local faster-whisper
    WHISPER_QUALITY: Literal["Best","Balanced","Fast"] = "Best"
    WHISPER_COMPUTE: Literal["float16","int8","int8_float16","float32"] = "int8"

    # ElevenLabs (optional)
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = ""
    ELEVENLABS_MODEL: str = "eleven_multilingual_v2"

settings = Settings()
