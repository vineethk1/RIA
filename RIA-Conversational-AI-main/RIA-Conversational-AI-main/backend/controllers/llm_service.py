# backend/controllers/llm_service.py
from __future__ import annotations

from typing import Tuple

from langdetect import detect, detect_langs
from langcodes import Language
from openai import OpenAI

from config import settings

_client: OpenAI | None = None
LLM_MODEL = settings.LLM_MODEL  # single source of truth


# ---------- client ----------

def oai() -> OpenAI:
    """Singleton OpenAI client configured via settings."""
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not set")
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


# ---------- language helpers ----------

_LANG_ALIASES = {
    "zh-cn": "zh",
    "zh-tw": "zh",
    "zh-hans": "zh",
    "zh-hant": "zh",
    "iw": "he",
    "ji": "yi",
    "jw": "jv",
    "in": "id",
    "fil": "tl",
    "no": "nb",
}


def normalize(code: str | None) -> str:
    """
    Normalize various language code variants to a short canonical form.

    Examples:
        "zh-CN" -> "zh"
        "in"    -> "id"
    """
    if not code:
        return "und"
    code = code.lower()
    if "-" in code:
        code = code.split("-")[0]
    return _LANG_ALIASES.get(code, code)


def pretty_name(code: str) -> tuple[str, str]:
    """
    Return a pair of language names:
        (name in English, name in the language itself)
    """
    try:
        lang = Language.get(code)
        return lang.display_name("en"), lang.display_name(code)
    except Exception:
        # Fallback to the raw code if anything fails
        upper = code.upper()
        return upper, upper


# ---------- language detection ----------

def detect_text_language(text: str) -> Tuple[str, float]:
    """
    Detect the language of a text.

    Returns:
        (normalized_language_code, probability)

    Uses langdetect locally. On failure, falls back to "und" with 0.0.
    """
    text = (text or "").strip()
    if not text:
        return "und", 0.0

    try:
        # Example output: [en:0.99, fr:0.01]
        probs = detect_langs(text)
        best = max(probs, key=lambda x: x.prob)
        return normalize(best.lang), float(best.prob)
    except Exception:
        try:
            return normalize(detect(text)), 0.0
        except Exception:
            return "und", 0.0


# ---------- translation & replies ----------

def translate_to_english(text: str) -> str:
    """
    Translate arbitrary text to natural English using Chat Completions.

    Returns English text only (no notes, no language tags).
    """
    text = (text or "").strip()
    if not text:
        return ""

    cc = oai().chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "Translate the user's input into natural English. "
                    "Return ONLY the translated text (no notes, no language tag)."
                ),
            },
            {"role": "user", "content": text},
        ],
        temperature=0,
    )
    return (cc.choices[0].message.content or "").strip()


def short_reply(
    en_text: str,
    system_prompt: str = (
        "You are a very concise assistant. Reply briefly as if you were speaking "
        "with a human. DO NOT have more than 40 words in your response."
    ),
) -> str:
    """
    Produce a very short assistant reply to already-normalized English.

    For long text you may summarize, but the response MUST be <= 40 words.
    """
    en_text = (en_text or "").strip()
    if not en_text:
        return ""

    cc = oai().chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": en_text},
        ],
        temperature=0.2,
    )
    return (cc.choices[0].message.content or "").strip()


def select_agent(user_query, agents) -> str:
    """
    Select the most appropriate agent for the given query.

    Returns the agent name (key from the agents dict).
    """
    query = (user_query or "").strip()
    if not query:
        return ""

    agent_list = "\n".join(
        f"- {name}: {agent['description']}"
        for name, agent in agents.items()
    )

    print("Selecting agent for query:", query)

    cc = oai().chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert at selecting the most suitable agent "
                    "to handle user queries based on their descriptions."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Available agents:\n{agent_list}\n\n"
                    f"User query:\n{query}\n\n"
                    "Select the single best agent to handle this query. "
                    "Respond with ONLY the agent name."
                ),
            },
        ],
        temperature=0,
    )
    print("Agent selection response:", cc.choices[0].message.content or "")
    return (cc.choices[0].message.content or "").strip()