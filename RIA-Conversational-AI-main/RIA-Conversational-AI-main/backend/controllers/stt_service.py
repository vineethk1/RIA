# controllers/stt_service.py
from __future__ import annotations

from typing import Tuple
from openai import OpenAI

from config import settings
from .llm_service import normalize, pretty_name  # only helpers; no LLM calls here

# -------- Strategy interface --------
class Transcriber:
    def transcribe(self, audio_path: str) -> Tuple[str, str, str, str]:
        """Returns (lang_line, code, original_text, english_text)"""
        raise NotImplementedError


# -------- Implementation: OpenAI Whisper API --------
_oai_client: OpenAI | None = None

def _oai() -> OpenAI:
    global _oai_client
    if _oai_client is None:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY missing for STT")
        _oai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _oai_client


class OpenAIWhisperTranscriber(Transcriber):
    """
    Two-pass approach:
      1) transcriptions.create -> original-language text (auto language detect)
      2) translations.create   -> English text (server-side translation)
    Note: the transcriptions endpoint does not return a language code. We infer it
    from the original text locally (langdetect). We only use normalize/pretty_name
    helpers from llm_service (no network calls here).
    """
    def transcribe(self, audio_path: str):
        # Pass 1: original language
        with open(audio_path, "rb") as f1:
            orig = _oai().audio.transcriptions.create(
                model=settings.WHISPER_MODEL,  # "whisper-1"
                file=f1
            )
        original_text = (orig.text or "").strip()

        # Infer language code from original text (fast local)
        try:
            from langdetect import detect
            code = normalize(detect(original_text)) if original_text else "und"
        except Exception:
            code = "und"

        en_name, native_name = pretty_name(code)

        # Pass 2: English translation using the translations endpoint
        english_text = original_text
        if code != "en":
            try:
                with open(audio_path, "rb") as f2:
                    en = _oai().audio.translations.create(
                        model=settings.WHISPER_MODEL,  # "whisper-1"
                        file=f2,
                    )
                english_text = (en.text or "").strip() or original_text
            except Exception:
                # If translations call fails (quota/network), still return original_text
                english_text = original_text

        # We don't have a probability from OpenAI Whisper REST, so omit confidence here
        lang_line = f"Detected language: {en_name} ({native_name}) — {code}"
        return lang_line, code, original_text, english_text


# -------- Implementation: local faster-whisper (optional) --------
try:
    from faster_whisper import WhisperModel
    from ctranslate2 import get_cuda_device_count
except Exception:
    WhisperModel = None
    def get_cuda_device_count() -> int: return 0  # type: ignore


_model_cache: dict[tuple[str, str], WhisperModel] = {}  # type: ignore

def _get_faster_model() -> WhisperModel:
    assert WhisperModel is not None  # mypy
    # choose model by quality
    QUALITY_TO_MODEL = {"Best": "large-v3", "Balanced": "medium", "Fast": "small"}
    model_name = QUALITY_TO_MODEL.get(settings.WHISPER_QUALITY, "large-v3")

    # prefer float16 when a GPU exists
    if get_cuda_device_count() > 0 and settings.WHISPER_COMPUTE != "float32":
        compute = "float16"
    else:
        compute = settings.WHISPER_COMPUTE

    key = (model_name, compute)
    if key not in _model_cache:
        _model_cache[key] = WhisperModel(model_name, compute_type=compute)
    return _model_cache[key]


def _join(segments) -> str:
    return " ".join(s.text for s in segments).strip()


class FasterWhisperTranscriber(Transcriber):
    def transcribe(self, audio_path: str):
        m = _get_faster_model()

        # Pass 1: source language transcript
        seg_orig, info = m.transcribe(
            audio_path,
            task="transcribe",
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            condition_on_previous_text=True,
            language=None,
        )
        original_text = _join(seg_orig)
        code = normalize(getattr(info, "language", None) or "und")
        en_name, native_name = pretty_name(code)

        # Pass 2: English translation if needed
        if code != "en":
            seg_en, _ = m.transcribe(
                audio_path,
                task="translate",           # <-- ensures English
                beam_size=5,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500),
                condition_on_previous_text=True,
                language=None,
            )
            english_text = _join(seg_en)
        else:
            english_text = original_text

        conf = getattr(info, "language_probability", None)
        conf_str = f" — {round(conf*100)}% confidence" if conf is not None else ""
        lang_line = f"Detected language: {en_name} ({native_name}) — {code}{conf_str}"
        return lang_line, code, original_text, english_text


# -------- Factory --------
_transcriber_singleton: Transcriber | None = None

def get_transcriber() -> Transcriber:
    global _transcriber_singleton
    if _transcriber_singleton is None:
        if settings.STT_BACKEND == "faster":
            if WhisperModel is None:
                raise RuntimeError("faster-whisper not available. Install deps or set STT_BACKEND=openai.")
            _transcriber_singleton = FasterWhisperTranscriber()
        else:
            _transcriber_singleton = OpenAIWhisperTranscriber()
    return _transcriber_singleton
