from faster_whisper import WhisperModel

# int8 on CPU keeps memory low enough for small hosting tiers (e.g. Render free)
model = WhisperModel("base", device="cpu", compute_type="int8")


def transcribe_file(file_path):
    """
    Transcribes an audio or video file using faster-whisper.
    Returns full text and timestamped segments.
    """
    # Greedy decoding (beam_size=1): beam_size=5 quintuples compute and
    # memory pressure for a modest accuracy gain, which was tipping the
    # process over Render free tier's 512MB RAM limit and getting it
    # OOM-killed mid-transcription. best_of only applies when sampling
    # (temperature > 0), so it was already a no-op here.
    segments_gen, info = model.transcribe(
        file_path,
        language="en",
        task="transcribe",
        beam_size=1,
        temperature=0.0,
    )

    formatted_segments = []
    text_parts = []
    for i, seg in enumerate(segments_gen):
        text = seg.text.strip()
        text_parts.append(text)
        formatted_segments.append({
            "id": i,
            "start": seg.start,
            "end": seg.end,
            "text": text
        })

    return {
        "full_text": " ".join(text_parts).strip(),
        "segments": formatted_segments,
        "language": info.language
    }
