# backend/model/model.py

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


# -------- Request models --------


class TextIn(BaseModel):
    text: str = Field(..., min_length=1)
    need_action_items: bool = True

    # TTS controls (optional)
    include_tts: bool = False
    tts_voice_id: Optional[str] = None     # ElevenLabs voice override
    tts_model_id: Optional[str] = None     # ElevenLabs model override
    tts_format: Literal["mp3", "wav"] = "mp3"


class AudioIn(BaseModel):
    need_action_items: bool = True

    # TTS controls (for form-based /audio)
    include_tts: bool = False
    tts_voice_id: Optional[str] = None
    tts_model_id: Optional[str] = None
    tts_format: Literal["mp3", "wav"] = "mp3"


class PromptOnlyIn(BaseModel):
    text: str = Field(..., min_length=1)
    # If true and an OpenAI key is present, we refine heuristics with the LLM
    need_action_items: bool = True


class TTSIn(BaseModel):
    text: str = Field(..., min_length=1)
    voice_id: Optional[str] = None
    model_id: Optional[str] = None
    fmt: Literal["mp3", "wav"] = "mp3"
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0
    use_speaker_boost: bool = True


# -------- Shared data models --------


class Transcription(BaseModel):
    lang_code: str
    lang_line: str
    original_text: str
    english_text: str


class ActionItem(BaseModel):
    description: str
    assignee: str
    # keep as str so "" is allowed for "no date"
    due_date: str
    # domain-agnostic priority label
    priority: str  # "High" | "Medium" | "Low" | "Unspecified"
    evidence: str
    confidence: float


class MicroAgentPayload(BaseModel):
    """
    Generic payload for downstream task/micro-agents.

    - normalized_prompt: the constructed agent prompt string
    - action_items: structured items extracted from the text
    """
    normalized_prompt: str
    action_items: List[ActionItem] = Field(default_factory=list)


# -------- Response models --------


class PromptOnlyOut(BaseModel):
    normalized_prompt: str
    action_items: List[ActionItem] = Field(default_factory=list)

class OptionalResponse(BaseModel):
    type: str
    value: str

class TextOut(BaseModel):
    transcription: Transcription
    micro_agent: MicroAgentPayload
    reply_preview: Optional[str] = None

    # If TTS requested
    reply_audio_b64: Optional[str] = None
    reply_audio_mime: Optional[str] = None
    optional_response: List[OptionalResponse] | None


class Health(BaseModel):
    """
    Simple service health-check model (NOT healthcare domain).
    """
    status: str = "ok"

class MemoryConfig(BaseModel):
    enabled: bool
    delivery: Literal["body", "query", "header"]
    field_name: str
    send_as: Literal["json", "text"]
    item_template: Dict[str, Any]

class AgentConfig(BaseModel):
    description: str
    endpoint: str
    method: Literal["GET", "POST", "PUT", "DELETE"]
    query_params: List[str]
    required_fields: List[str]
    response_format: Literal["json", "text"]
    response_field: List[str]
    optional_response_field: List[str]
    optional_response_field_type: List[str]
    memory: Optional[MemoryConfig] = None

class AgentsConfig(BaseModel):
    agents: Dict[str, AgentConfig]
