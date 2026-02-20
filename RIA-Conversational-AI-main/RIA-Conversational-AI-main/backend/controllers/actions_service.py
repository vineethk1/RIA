# backend/controllers/actions_service.py
from __future__ import annotations

import json
import re
import textwrap
from typing import Any, Dict, List

import dateparser

from config import settings
from .llm_service import oai  # uses settings.OPENAI_API_KEY + settings.LLM_MODEL

# ---------------- Heuristics ----------------

IMPERATIVE = [
    "send", "create", "share", "prepare", "review", "finalize", "schedule", "book",
    "organize", "update", "draft", "call", "email", "deploy", "test", "fix",
    "investigate", "check", "verify", "confirm", "document", "summarize", "plan",
    "assign", "train", "analyze", "measure", "optimize", "present",
]

IMP_PAT = re.compile(
    r"^\s*(?:please\s+)?(" + "|".join(IMPERATIVE) + r")\b",
    re.IGNORECASE,
)

TRIG = [
    r"\bwe need to\b",
    r"\blet'?s\b",
    r"\bcan you\b",
    r"\bcould you\b",
    r"\bplease\b",
    r"\baction item\b",
    r"\bmake sure\b",
]

ASSIGNEE = [
    (re.compile(r"\bI(?:'ll|\s+will)?\b", re.IGNORECASE), "I"),
    (re.compile(r"\bwe(?:'ll|\s+will)?\b", re.IGNORECASE), "We"),
    (re.compile(r"\byou(?:'ll|\s+will)?\b", re.IGNORECASE), "You"),
    (re.compile(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b"), "Name"),
]

PRIO = [
    (re.compile(r"\burgent|asap|immediately|high priority", re.IGNORECASE), "High"),
    (re.compile(r"\bpriority\b", re.IGNORECASE), "Medium"),
    (re.compile(r"\bno rush|low priority", re.IGNORECASE), "Low"),
]

DUE = re.compile(
    r"\bby\s+(?:EOD|end of day|tomorrow|next week|monday|tuesday|wednesday|thursday|"
    r"friday|saturday|sunday|\d{4}-\d{1,2}-\d{1,2}|\w+\s+\d{1,2}"
    r"(?:st|nd|rd|th)?(?:,\s*\d{4})?)\b",
    re.IGNORECASE,
)

_SPLIT_RE = re.compile(r"(?<=[\.\?\!])\s+|\n+")
_CODE_BLOCK_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)\s*```", re.IGNORECASE)



def _split(text: str) -> List[str]:
    """Split raw text into sentences / segments."""
    if not text:
        return []
    return [s.strip() for s in _SPLIT_RE.split(text) if s.strip()]

def _assignee(s: str) -> str:
    """Guess assignee label from a sentence."""
    for pat, label in ASSIGNEE:
        m = pat.search(s)
        if m:
            return m.group(0) if label == "Name" else label
    return "Unassigned"


def _due(s: str) -> str:
    """Parse due date from a sentence, normalized to YYYY-MM-DD when possible."""
    if DUE.search(s):
        dt = dateparser.parse(s, settings={"PREFER_DATES_FROM": "future"})
        return dt.strftime("%Y-%m-%d") if dt else "Unclear"
    return ""


def _prio(s: str) -> str:
    """Infer priority label from a sentence."""
    for pat, label in PRIO:
        if pat.search(s):
            return label
    return "Medium" if IMP_PAT.search(s) else "Unspecified"


def _is_actiony(s: str) -> bool:
    """Return True if the sentence looks like an action item."""
    if IMP_PAT.search(s):
        return True
    return any(re.search(p, s, re.IGNORECASE) for p in TRIG)


def _clean(s: str) -> str:
    """Strip polite/softening phrases from a sentence to get the core action."""
    s = re.sub(r"\bplease\b[:,]?\s*", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\bwe need to\b\s*", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\blet'?s\b\s*", "", s, flags=re.IGNORECASE)
    return s.strip().strip("-•")


def heuristics(en_text: str) -> List[Dict[str, Any]]:
    """
    Heuristic extraction of action items from English text.
    Returns a list of action dicts with minimal structure.
    """
    out: List[Dict[str, Any]] = []
    seen: set[str] = set()

    for sent in _split(en_text):
        if not _is_actiony(sent):
            continue

        desc = _clean(sent)
        if not desc:
            continue

        key = desc.lower()
        if key in seen:
            continue
        seen.add(key)

        out.append(
            {
                "description": desc,
                "assignee": _assignee(sent),
                "due_date": _due(sent),
                "priority": _prio(sent),
                "evidence": sent,
                "confidence": 0.6,
            }
        )

    return out


# ---------------- JSON schema & parsing ----------------

SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "description": {"type": "string"},
                    "assignee": {"type": "string"},
                    "due_date": {"type": "string"},
                    "priority": {
                        "type": "string",
                        "enum": ["High", "Medium", "Low", "Unspecified"],
                    },
                    "evidence": {"type": "string"},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                },
                "required": [
                    "description",
                    "assignee",
                    "due_date",
                    "priority",
                    "evidence",
                    "confidence",
                ],
            },
        },
    },
    "required": ["items"],
    "additionalProperties": False,
}


def _extract_json_block(txt: str) -> Dict[str, Any]:
    """
    Extract a single JSON object from model output:

    - Prefer ```json fenced``` blocks.
    - Else take the first balanced {...} region.
    - On failure, return {"items": []}.
    """
    if not txt:
        return {"items": []}

    # 1) Prefer fenced code block
    m = _CODE_BLOCK_RE.search(txt)
    if m:
        candidate = m.group(1).strip()
        try:
            return json.loads(candidate)
        except Exception:
            # fall through to brace scan
            pass

    # 2) Balanced brace scan for first JSON object
    start = txt.find("{")
    if start == -1:
        return {"items": []}

    depth = 0
    for i in range(start, len(txt)):
        ch = txt[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                segment = txt[start : i + 1]
                try:
                    return json.loads(segment)
                except Exception:
                    break  # give up and return default

    # 3) Default
    return {"items": []}


# ---------------- LLM refine ----------------

MAX_TRANSCRIPT_CHARS = 6000  # guardrail to keep prompts reasonable
MAX_SEEDS = 20  # keep it explicit


def llm_refine(en_text: str, seeds: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    LLM-based refinement of heuristic action items.

    If parsing the model response fails, this function **never raises**:
    it falls back to returning the original heuristic seeds.
    """
    transcript = (en_text or "").strip()
    if len(transcript) > MAX_TRANSCRIPT_CHARS:
        transcript = transcript[:MAX_TRANSCRIPT_CHARS]

    seeds_limited = seeds[:MAX_SEEDS]

    system = (
        "You are an expert meeting assistant. Extract concrete action items.\n"
        "Return ONLY a single JSON object with an 'items' array matching the provided schema.\n"
        "No explanations, no extra text, no markdown fences, no additional objects."
    )

    user = textwrap.dedent(
        f"""
        ### Transcript (English)
        {transcript}

        ### Heuristic candidates (noisy hints)
        {json.dumps(seeds_limited, ensure_ascii=False, indent=2)}

        ### JSON schema
        {json.dumps(SCHEMA, ensure_ascii=False)}
        """
    )

    try:
        client = oai()
        cc = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0,
        )
        txt = (cc.choices[0].message.content or "").strip()
        data = _extract_json_block(txt)

        items = data.get("items", []) or []

        # normalize confidence
        for it in items:
            try:
                it["confidence"] = float(it.get("confidence", 0.7))
            except Exception:
                it["confidence"] = 0.7

        return items if items else seeds_limited

    except Exception:
        # Never 500 here: just return heuristics
        return seeds_limited
