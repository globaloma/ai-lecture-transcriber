import os
import json
from google import genai
from google.genai import types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "choices": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "correct_index": {"type": "integer"},
                    "explanation": {"type": "string"}
                },
                "required": ["question", "choices", "correct_index", "explanation"]
            }
        }
    },
    "required": ["questions"]
}


def generate_mcqs(transcript_text: str, n: int = 10) -> list:
    """
    Generates n multiple-choice questions from a lecture transcript using
    the Gemini API (free tier). Returns a list of dicts:
    [{"question": str, "choices": [str, ...], "correct_index": int, "explanation": str}, ...]
    """
    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = (
        f"You are creating a {n}-question multiple-choice assessment for a "
        "student based on the lecture transcript below. Cover the material "
        "broadly rather than repeating the same point. Each question must "
        "have exactly 4 answer choices, with exactly one correct choice, "
        "plausible distractors, and a one-sentence explanation of the "
        "correct answer.\n\n"
        f"Transcript:\n{transcript_text}"
    )

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=_RESPONSE_SCHEMA
        )
    )

    data = json.loads(response.text)
    questions = data.get("questions", [])

    # Defensive: drop any malformed question rather than failing the whole batch
    valid = []
    for q in questions:
        choices = q.get("choices") or []
        correct_index = q.get("correct_index")
        if (
            q.get("question")
            and len(choices) >= 2
            and isinstance(correct_index, int)
            and 0 <= correct_index < len(choices)
        ):
            valid.append(q)

    return valid[:n]
