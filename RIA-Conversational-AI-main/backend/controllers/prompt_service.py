# backend/controllers/prompt_service.py
from typing import List, Dict, Any


def _fmt_item(index: int, item: Dict[str, Any]) -> str:
    """Format a single action item line safely."""
    desc = item.get("description") or "N/A"
    owner = item.get("assignee") or "Unassigned"
    due = item.get("due_date") or "n/a"
    priority = item.get("priority") or "Unspecified"

    try:
        confidence = float(item.get("confidence", 0))
        conf = f"{confidence:.2f}"
    except Exception:
        conf = "0.00"

    return (
        f"{index}. {desc} "
        f"[owner: {owner}; due: {due}; priority: {priority}; conf: {conf}]"
    )


def build_micro_agent_prompt(en_text: str, items: List[Dict[str, Any]]) -> str:
    """
    Build a clean, deterministic prompt for task-oriented micro-agents.

    This prompt:
    - Injects normalized English input.
    - Summarizes extracted action items.
    - Provides consistent task resolution rules.
    """

    text = (en_text or "").strip()
    tasks = items or []

    if tasks:
        formatted = "\n".join(_fmt_item(i + 1, item) for i, item in enumerate(tasks))
    else:
        formatted = "(none)"

    return (
        "### User message (English)\n"
        f"{text}\n\n"
        "### Extracted action items\n"
        f"{formatted}\n\n"
        "### Instructions\n"
        "- Prioritize by urgency: High → Medium → Low.\n"
        "- If due dates are missing, ask once for clarification, then continue.\n"
        "- Respond with concrete steps, not explanations.\n"
    )
