import whisper

# Load base model once
model = whisper.load_model("base")

def transcribe_file(file_path):
    """
    Transcribes an audio or video file using Whisper.
    Returns full text and timestamped segments.
    """
    result = model.transcribe(
        file_path,
        fp16=False,              # CPU-safe
        language="en",           # Explicit language
        task="transcribe",
        beam_size=5,             # Better accuracy
        best_of=5,               # Try multiple and pick best
        temperature=0.0          # More deterministic
    )

    full_text = result.get("text", "").strip()
    segments = result.get("segments", [])

    formatted_segments = []
    for seg in segments:
        formatted_segments.append({
            "id": seg.get("id"),
            "start": seg.get("start"),
            "end": seg.get("end"),
            "text": seg.get("text", "").strip()
        })

    return {
        "full_text": full_text,
        "segments": formatted_segments,
        "language": result.get("language")
    }