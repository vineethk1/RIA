import json
from pathlib import Path

def initialize_session_memory(filepath="session_memory.json"):
    """
    Initialize a session memory file with a greeting message,
    but only if the file does not exist or is empty.
    """
    file = Path(filepath)

    # Create parent directory if needed
    file.parent.mkdir(parents=True, exist_ok=True)

    # Check if file exists and is non-empty
    if file.exists() and file.stat().st_size > 0:
        # File already has content — do nothing
        return filepath

    # Initial memory content
    initial_memory = [
        {
            "role": "assistant",
            "text": "Hi! How can I help you today?"
        }
    ]

    # Write the initial memory
    with open(file, "w", encoding="utf-8") as f:
        json.dump(initial_memory, f, indent=2)

    return filepath


def get_session_memory(filepath="session_memory.json"):
    """
    Read and return the session memory from the file.
    Returns an empty list if the file doesn't exist or is empty.
    """
    file = Path(filepath)

    # If file doesn't exist or is empty, return empty list
    if not file.exists() or file.stat().st_size == 0:
        return []

    with open(file, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            # If file is corrupted or invalid JSON
            return []

def save_session_memory(user_query, bot_response, filepath="session_memory.json"):
    """
    Save the user query and bot response to the session memory file.
    The user query will be first, followed by the bot's response.
    """
    file = Path(filepath)

    # Create parent directory if needed
    file.parent.mkdir(parents=True, exist_ok=True)

    # Check if the file exists and contains valid JSON
    if file.exists():
        with open(file, "r", encoding="utf-8") as f:
            try:
                existing_memory = json.load(f)
                # Ensure it's a list or create one if it doesn't exist
                if not isinstance(existing_memory, list):
                    existing_memory = []
            except json.JSONDecodeError:
                # If the file is empty or corrupted, start with an empty list
                existing_memory = []
    else:
        existing_memory = []

    # Append the user query and bot response to the memory
    # Order: user query first, bot response second
    existing_memory.append({"role": "user", "text": user_query})
    existing_memory.append({"role": "assistant", "text": bot_response})

    # Write the updated memory back to the file
    with open(file, "w", encoding="utf-8") as f:
        json.dump(existing_memory, f, indent=2)

    return filepath