# backend/routes/api.py
import os
import base64
import asyncio
import shutil
import tempfile
from typing import Optional
import json

from controllers.config_setup_service import AgentConfigDB
from controllers.memory_service import get_session_memory, initialize_session_memory, save_session_memory
from fastapi import APIRouter, UploadFile, File, Form, Response, HTTPException

from config import settings
from model.model import (
    TextIn,
    TextOut,
    Transcription,
    MicroAgentPayload,
    ActionItem,
    PromptOnlyIn,
    PromptOnlyOut,
    TTSIn,
    AgentsConfig,
)
from controllers.stt_service import get_transcriber
from controllers.llm_service import (
    detect_text_language,
    select_agent,
    translate_to_english,
    short_reply,
    normalize,
    pretty_name,
)
from controllers.actions_service import heuristics, llm_refine
from controllers.prompt_service import build_micro_agent_prompt
from controllers.tts_service import tts_elevenlabs, tts_mime
from controllers.integration_service import get_agent_config, send_api_request, generate_structured_request

router = APIRouter(prefix="/api/v1", tags=["ria"])

# Single toggle for LLM features
HAS_OAI = bool(settings.OPENAI_API_KEY)

def _extract_agent_text(agent_payload) -> Optional[str]:
    """
    Your agent sometimes returns dict/json; sometimes plain text.
    Normalize to a single string.
    """
    if agent_payload is None:
        return None
    if isinstance(agent_payload, dict) and agent_payload:
        try:
            return str(next(iter(agent_payload.values())))
        except Exception:
            return str(agent_payload)
    return str(agent_payload)



# ----------------- Prompt-only endpoint -----------------

@router.post("/prompt", response_model=PromptOnlyOut)
async def prompt_only(body: PromptOnlyIn) -> PromptOnlyOut:
    """
    Pure prompt/action-item extraction:
      - Detect language.
      - Normalize text to English.
      - Extract action items (heuristics + optional LLM refine).
      - Build single-string prompt for downstream micro-agents.
    """
    # 1) Detect language, normalize code
    code, _ = detect_text_language(body.text)
    code = normalize(code)

    # 2) Normalize to English (only call LLM translate if not English and key exists)
    en_text = body.text if (code == "en" or not HAS_OAI) else translate_to_english(body.text)

    # 3) Generate action items
    seeds = heuristics(en_text)
    if body.need_action_items and HAS_OAI:
        items = llm_refine(en_text, seeds)
    else:
        items = seeds

    # 4) Build the single string your micro-agent consumes
    prompt = build_micro_agent_prompt(en_text, items)

    return PromptOnlyOut(
        normalized_prompt=prompt,
        action_items=[ActionItem(**i) for i in items],
    )


# ----------------- Text endpoint -----------------

@router.post("/text", response_model=TextOut)
async def handle_text(body: TextIn) -> TextOut:
    """
    Text-only endpoint:
      - Detect language and normalize.
      - Translate to English if needed.
      - Extract action items + micro-agent prompt.
      - Optional short reply and inline TTS.
    """
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text body cannot be empty.")

    # language detect
    code, prob = detect_text_language(text)
    code = normalize(code)
    en_name, native_name = pretty_name(code)
    lang_line = (
        f"Detected language: {en_name} ({native_name}) — {code} — "
        f"{round(prob * 100)}% confidence"
    )

    # normalize to English (skip LLM if no key)
    en_text = text if (code == "en" or not HAS_OAI) else translate_to_english(text)

    # action items
    seeds = heuristics(en_text)
    if body.need_action_items and HAS_OAI:
        items = llm_refine(en_text, seeds)
    else:
        items = seeds

    # # prompt for micro agent
    # prompt = build_micro_agent_prompt(en_text, items)

    # # optional short reply (handy for FE preview)
    # reply = short_reply(prompt) if HAS_OAI else None

    agent_config = get_agent_config()
    agent_name = select_agent(en_text, agent_config)
    print("agent_config:", agent_config)

    # if first request initialise sesssion memmory with greeting
    initialize_session_memory()

    # fetch session memeory from file
    current_memory = get_session_memory()

    structured_request = generate_structured_request(en_text, agent_config[agent_name], current_memory)
    print("structured_request:", structured_request)

    # ---- Agent call with fallback when agent is offline ----
    agent_text = None
    agent_error = None

    try:
        agent_result, optional_result = await asyncio.to_thread(
            send_api_request,
            structured_request,
            agent_config[agent_name],
        )
        agent_text = _extract_agent_text(agent_result)
    except Exception as e:
        agent_error = str(e)
        print(f"[agent] agent offline/failure -> fallback generic. error={agent_error}")

    # Fallback to generic behavior if agent failed / empty
    if agent_text and agent_text.strip():
        normalized_prompt = agent_text
    else:
        normalized_prompt = build_micro_agent_prompt(en_text, items)

    # Generate reply preview
    try:
        reply = short_reply(normalized_prompt)  # if your short_reply uses LLM
    except Exception as e:
        print(f"[reply] short_reply failed, using minimal fallback: {e}")
        reply = f"I heard: {en_text}"

    # Save memory (optional)
    try:
        save_session_memory(en_text, reply)
    except Exception as e:
        print(f"[memory] save failed (non-fatal): {e}")


    # OPTIONAL: TTS embedding when requested
    reply_audio_b64: Optional[str] = None
    reply_audio_mime: Optional[str] = None
    if getattr(body, "include_tts", False) and reply:
        try:
            tts_fmt = getattr(body, "tts_format", "mp3") or "mp3"
            audio_bytes = await asyncio.to_thread(
                tts_elevenlabs,
                reply,
                getattr(body, "tts_voice_id", None),
                getattr(body, "tts_model_id", None),
                tts_fmt,
            )
            reply_audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            reply_audio_mime = "audio/mpeg" if tts_fmt == "mp3" else "audio/wav"
        except Exception as e:
            # log & continue without audio
            print("TTS error (/text):", e)

    return TextOut(
        transcription=Transcription(
            lang_code=code,
            lang_line=lang_line,
            original_text=text,
            english_text=en_text,
        ),
        micro_agent=MicroAgentPayload(
            normalized_prompt=normalized_prompt,
            action_items=[],
            #action_items=[ActionItem(**i) for i in items],
        ),
        reply_preview=reply,
        reply_audio_b64=reply_audio_b64,
        reply_audio_mime=reply_audio_mime,
        optional_response=optional_result,
    )


# ----------------- Audio endpoint -----------------

@router.post("/audio", response_model=TextOut)
async def handle_audio(
    file: UploadFile = File(...),
    need_action_items: Optional[bool] = Form(False),
    include_tts: Optional[bool] = Form(False),
    tts_voice_id: Optional[str] = Form(None),
    tts_model_id: Optional[str] = Form(None),
    tts_format: Optional[str] = Form("mp3"),
) -> TextOut:
    """
    Audio endpoint:
      - Save uploaded audio to temp.
      - Transcribe via configured STT.
      - Extract action items + micro-agent prompt.
      - Optional short reply and TTS.
    """
    tmp_dir = tempfile.mkdtemp()
    path = os.path.join(tmp_dir, file.filename or "audio.wav")
    try:
        with open(path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        lang_line, code, orig_text, en_text = get_transcriber().transcribe(path)

        # action items
        seeds = heuristics(en_text)
        if need_action_items and HAS_OAI:
            items = llm_refine(en_text, seeds)
        else:
            items = seeds

        # prompt = build_micro_agent_prompt(en_text, items)
        # reply = short_reply(en_text) if HAS_OAI else None

        agent_config = get_agent_config()
        agent_name = "coast_agent"
        print("agent_config:", agent_config)

        # if first request initialise sesssion memmory with greeting
        initialize_session_memory()

        # fetch session memeory from file
        current_memory = get_session_memory()

        structured_request = generate_structured_request(en_text, agent_config[agent_name], current_memory)
        print("structured_request:", structured_request)

        # ---- Agent call with fallback when agent is offline ----
        agent_text = None
        agent_error = None

        try:
            agent_result = await asyncio.to_thread(
                send_api_request,
                structured_request,
                agent_config[agent_name],
            )
            agent_text = _extract_agent_text(agent_result)
        except Exception as e:
            agent_error = str(e)
            print(f"[agent] agent offline/failure -> fallback generic. error={agent_error}")

        if agent_text and agent_text.strip():
            normalized_prompt = agent_text
        else:
            normalized_prompt = build_micro_agent_prompt(en_text, items)

        try:
            reply = short_reply(normalized_prompt)
        except Exception as e:
            print(f"[reply] short_reply failed, using minimal fallback: {e}")
            reply = f"I heard: {en_text}"

        try:
            save_session_memory(en_text, reply)
        except Exception as e:
            print(f"[memory] save failed (non-fatal): {e}")

        reply_audio_b64: Optional[str] = None
        reply_audio_mime: Optional[str] = None
        if include_tts and reply:
            try:
                fmt = (tts_format or "mp3").lower()
                audio_bytes = await asyncio.to_thread(
                    tts_elevenlabs,
                    reply,
                    tts_voice_id,
                    tts_model_id,
                    fmt,
                )
                reply_audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
                reply_audio_mime = "audio/mpeg" if fmt == "mp3" else "audio/wav"
            except Exception as e:
                print("TTS error (/audio):", e)

        return TextOut(
            transcription=Transcription(
                lang_code=code,
                lang_line=lang_line,
                original_text=orig_text,
                english_text=en_text,
            ),
            micro_agent=MicroAgentPayload(
                normalized_prompt=normalized_prompt,
                action_items = [],
                #action_items=[ActionItem(**i) for i in items],
            ),
            reply_preview=reply,
            reply_audio_b64=reply_audio_b64,
            reply_audio_mime=reply_audio_mime,
        )
    finally:
        # best-effort cleanup
        try:
            shutil.rmtree(tmp_dir, ignore_errors=True)
        except Exception:
            pass


# ----------------- TTS endpoint -----------------

@router.post("/tts")
async def generate_tts(body: TTSIn):
    """
    Raw TTS endpoint: returns audio bytes directly.
    """
    try:
        audio_bytes = await asyncio.to_thread(
            tts_elevenlabs,
            text=body.text,
            voice_id=body.voice_id,
            model_id=body.model_id,
            fmt=body.fmt,
            stability=body.stability,
            similarity_boost=body.similarity_boost,
            style=body.style,
            use_speaker_boost=body.use_speaker_boost,
        )
        return Response(content=audio_bytes, media_type=tts_mime(body.fmt))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"TTS failed: {e}")

@router.post("/config")
async def upload_agent_config(config: AgentsConfig):
    """
    Accept any number of agent configs with arbitrary names.
    Validates structure automatically.
    Stores the config in Supabase database.
    """
    print("Received agent configuration:", config)
    
    # Initialize database connection
    try:
        db = AgentConfigDB(schema="agent_config")
    except ValueError as e:
        return {
            "status": "error",
            "message": str(e)
        }
    
    # Clear session memory file
    session_memory_file = "session_memory.json"
    try:
        with open(session_memory_file, "w", encoding="utf-8") as f:
            f.truncate(0)
        print(f"Cleared content of {session_memory_file}")
    except FileNotFoundError:
        print(f"{session_memory_file} not found. Skipping clearing.")
    
    # Process each agent configuration
    results = {
        "created": [],
        "updated": [],
        "failed": []
    }
    
    for agent_name, agent_config in config.agents.items():
        # Extract memory configuration if it exists
        memory = agent_config.memory
        print(f"Processing agent: {agent_name} with memory config: {memory}")
        
        # Prepare agent data for database
        agent_data = {
            "agent_name": agent_name,
            "description": agent_config.description,
            "endpoint": agent_config.endpoint,
            "method": agent_config.method,
            "query_params": agent_config.query_params,
            "required_fields": agent_config.required_fields,
            "response_format": agent_config.response_format,
            "response_field": agent_config.response_field,
            "optional_response_field": agent_config.optional_response_field,
            "optional_response_field_type": agent_config.optional_response_field_type,
            "memory_enabled": memory.enabled if memory else False,
            "memory_delivery": memory.delivery if memory else None,
            "memory_field_name": memory.field_name if memory else None,
            "memory_send_as": memory.send_as if memory else None,
            "item_template": memory.item_template if memory else None
        }
        
        # Check if agent already exists
        existing_agent = db.get_agent(agent_name)
        
        if existing_agent:
            # Update existing agent
            updated = db.update_agent(agent_name, agent_data)
            if updated:
                results["updated"].append(agent_name)
                print(f"Updated agent: {agent_name}")
            else:
                results["failed"].append(agent_name)
                print(f"Failed to update agent: {agent_name}")
        else:
            # Create new agent
            created = db.create_agent(agent_data)
            if created:
                results["created"].append(agent_name)
                print(f"Created agent: {agent_name}")
            else:
                results["failed"].append(agent_name)
                print(f"Failed to create agent: {agent_name}")
    
    # Determine overall status
    status = "ok" if not results["failed"] else "partial"
    if results["failed"] and not results["created"] and not results["updated"]:
        status = "error"
    
    return {
        "status": status,
        "total_agents": len(config.agents),
        "agents_received": list(config.agents.keys()),
        "created": results["created"],
        "updated": results["updated"],
        "failed": results["failed"]
    }