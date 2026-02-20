from __future__ import annotations

import os
import json
from typing import Iterator, Optional

import requests

# --- Env defaults ---
ELEVEN_KEY: str = os.getenv("ELEVENLABS_API_KEY", "") or ""
DEFAULT_VOICE_ID: str = os.getenv("ELEVENLABS_VOICE_ID", "") or ""
DEFAULT_MODEL: str = os.getenv("ELEVENLABS_MODEL", "eleven_multilingual_v2") or "eleven_multilingual_v2"

ELEVEN_TTS_URL_TMPL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"


def tts_mime(fmt: str) -> str:
    """Return the correct Content-Type for a given audio format."""
    return "audio/mpeg" if fmt == "mp3" else "audio/wav"


def _validate_inputs(text: str, voice_id: Optional[str], fmt: str) -> tuple[str, str]:
    """Validate inputs and resolve defaults; raise RuntimeError with clear messages."""
    if not ELEVEN_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY is not set.")

    if not text or not text.strip():
        raise RuntimeError("TTS text is empty.")

    vid = (voice_id or DEFAULT_VOICE_ID).strip()
    if not vid:
        raise RuntimeError("No voice_id provided and ELEVENLABS_VOICE_ID is not set.")

    fmt = (fmt or "mp3").lower()
    if fmt not in ("mp3", "wav"):
        raise RuntimeError("Unsupported fmt. Use 'mp3' or 'wav'.")

    return vid, fmt


def _headers(fmt: str) -> dict:
    return {
        "xi-api-key": ELEVEN_KEY,
        "accept": "audio/mpeg" if fmt == "mp3" else "audio/wav",
        "content-type": "application/json",
    }


def _payload(
    text: str,
    model_id: Optional[str],
    stability: float,
    similarity_boost: float,
    style: float,
    use_speaker_boost: bool,
) -> dict:
    return {
        "text": text,
        "model_id": (model_id or DEFAULT_MODEL),
        "voice_settings": {
            "stability": float(stability),
            "similarity_boost": float(similarity_boost),
            "style": float(style),
            "use_speaker_boost": bool(use_speaker_boost),
        },
    }


def _raise_for_error_response(resp: requests.Response) -> None:
    """Raise with a friendly message including ElevenLabs JSON if present."""
    try:
        resp.raise_for_status()
    except requests.HTTPError as exc:
        detail = ""
        try:
            data = resp.json()
            # ElevenLabs often returns {"detail": "..."} or {"error": "..."}
            detail = data.get("detail") or data.get("error") or data
        except Exception:
            # fall back to raw text
            detail = resp.text.strip()
        raise RuntimeError(f"ElevenLabs TTS HTTP {resp.status_code}: {detail}") from exc


def tts_elevenlabs(
    text: str,
    voice_id: Optional[str] = None,
    model_id: Optional[str] = None,
    fmt: str = "mp3",
    *,
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    style: float = 0.0,
    use_speaker_boost: bool = True,
    timeout: int = 60,
) -> bytes:
    """
    Synthesize speech via ElevenLabs and return raw audio bytes.
    Use this in your /api/v1/tts endpoint and return as Response(content=..., media_type=tts_mime(fmt))
    """
    vid, fmt = _validate_inputs(text, voice_id, fmt)
    url = ELEVEN_TTS_URL_TMPL.format(voice_id=vid)
    payload = _payload(text, model_id, stability, similarity_boost, style, use_speaker_boost)

    resp = requests.post(url, headers=_headers(fmt), json=payload, timeout=timeout)
    # ElevenLabs returns audio bytes on success OR JSON with error details
    if "application/json" in (resp.headers.get("content-type") or ""):
        _raise_for_error_response(resp)

    _raise_for_error_response(resp)
    audio = resp.content or b""
    if not audio:
        raise RuntimeError("ElevenLabs returned empty audio.")
    return audio


def tts_elevenlabs_stream(
    text: str,
    voice_id: Optional[str] = None,
    model_id: Optional[str] = None,
    fmt: str = "mp3",
    *,
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    style: float = 0.0,
    use_speaker_boost: bool = True,
    timeout: int = 60,
    chunk_size: int = 32 * 1024,
) -> Iterator[bytes]:
    """
    Streaming variant (generator). If you later want to stream to the client (e.g., via StreamingResponse),
    you can iterate this generator. For now, Option B uses the non-streaming function above.
    """
    vid, fmt = _validate_inputs(text, voice_id, fmt)
    url = ELEVEN_TTS_URL_TMPL.format(voice_id=vid)
    payload = _payload(text, model_id, stability, similarity_boost, style, use_speaker_boost)

    with requests.post(
        url,
        headers=_headers(fmt),
        json=payload,
        timeout=timeout,
        stream=True,
    ) as resp:
        # On error, ElevenLabs sends JSON; handle before yielding bytes
        ctype = resp.headers.get("content-type") or ""
        if "application/json" in ctype:
            body = resp.content
            try:
                data = json.loads(body.decode("utf-8", errors="ignore"))
            except Exception:
                data = body.decode("utf-8", errors="ignore")
            # force an error with details
            raise RuntimeError(f"ElevenLabs TTS stream error ({resp.status_code}): {data}")

        _raise_for_error_response(resp)

        for chunk in resp.iter_content(chunk_size=chunk_size):
            if chunk:
                yield chunk
