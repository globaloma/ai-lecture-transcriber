import os
import subprocess
import tempfile
import shutil

from faster_whisper import WhisperModel

# int8 on CPU keeps memory low enough for small hosting tiers (e.g. Render free).
model = WhisperModel("tiny", device="cpu", compute_type="int8")

# faster-whisper loads the entire audio track into memory before transcribing,
# so peak memory scales with video length regardless of model size — a long
# lecture can OOM a 512MB instance even on the smallest model. Splitting into
# fixed-length chunks first bounds peak memory to one chunk's audio, so a
# 20-minute video costs the same memory as a 5-minute one.
CHUNK_SECONDS = 300


def _split_into_chunks(file_path: str, chunk_dir: str) -> list[str]:
    pattern = os.path.join(chunk_dir, "chunk_%03d.wav")
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", file_path,
            "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
            "-f", "segment", "-segment_time", str(CHUNK_SECONDS),
            pattern,
        ],
        check=True,
        capture_output=True,
    )
    return sorted(
        os.path.join(chunk_dir, f) for f in os.listdir(chunk_dir)
    )


def transcribe_file(file_path):
    """
    Transcribes an audio or video file using faster-whisper.
    Returns full text and timestamped segments.
    """
    chunk_dir = tempfile.mkdtemp(prefix="transcribe_chunks_")

    try:
        chunk_paths = _split_into_chunks(file_path, chunk_dir)

        formatted_segments = []
        text_parts = []
        language = None
        segment_id = 0

        for chunk_index, chunk_path in enumerate(chunk_paths):
            time_offset = chunk_index * CHUNK_SECONDS

            # Greedy decoding (beam_size=1): beam_size=5 quintuples compute
            # and memory for a modest accuracy gain. best_of only applies
            # when sampling (temperature > 0), so it's a no-op here.
            segments_gen, info = model.transcribe(
                chunk_path,
                language="en",
                task="transcribe",
                beam_size=1,
                temperature=0.0,
            )

            if language is None:
                language = info.language

            for seg in segments_gen:
                text = seg.text.strip()
                text_parts.append(text)
                formatted_segments.append({
                    "id": segment_id,
                    "start": seg.start + time_offset,
                    "end": seg.end + time_offset,
                    "text": text
                })
                segment_id += 1

            # Release this chunk's decoded audio before loading the next.
            os.remove(chunk_path)

        return {
            "full_text": " ".join(text_parts).strip(),
            "segments": formatted_segments,
            "language": language or "en"
        }

    finally:
        shutil.rmtree(chunk_dir, ignore_errors=True)
