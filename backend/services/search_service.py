from models import db, TranscriptSegment, Transcript, Lecture

def search_transcripts(query: str) -> list:
    """
    Search transcript segments by keyword.
    Returns matching segments with lecture info and timestamps.
    """

    if not query or not query.strip():
        return []

    # Clean query
    clean_query = query.strip()

    # Search in segment text using ILIKE (case-insensitive)
    matching_segments = (
        db.session.query(
            TranscriptSegment,
            Transcript,
            Lecture
        )
        .join(Transcript, TranscriptSegment.transcript_id == Transcript.id)
        .join(Lecture, Transcript.lecture_id == Lecture.id)
        .filter(
            TranscriptSegment.segment_text.ilike(f"%{clean_query}%")
        )
        .order_by(Lecture.id, TranscriptSegment.segment_index)
        .all()
    )

    results = []
    for segment, transcript, lecture in matching_segments:
        results.append({
            "lecture_id": lecture.id,
            "lecture_title": lecture.title,
            "file_type": lecture.file_type,
            "segment_id": segment.id,
            "segment_index": segment.segment_index,
            "start_time": segment.start_time,
            "end_time": segment.end_time,
            "text": segment.segment_text,
            "transcript_id": transcript.id
        })

    return results


def search_in_lecture(query: str, lecture_id: int) -> list:
    """
    Search within a specific lecture only.
    """

    if not query or not query.strip():
        return []

    clean_query = query.strip()

    matching_segments = (
        db.session.query(
            TranscriptSegment,
            Transcript,
            Lecture
        )
        .join(Transcript, TranscriptSegment.transcript_id == Transcript.id)
        .join(Lecture, Transcript.lecture_id == Lecture.id)
        .filter(
            TranscriptSegment.segment_text.ilike(f"%{clean_query}%"),
            Lecture.id == lecture_id
        )
        .order_by(TranscriptSegment.segment_index)
        .all()
    )

    results = []
    for segment, transcript, lecture in matching_segments:
        results.append({
            "lecture_id": lecture.id,
            "lecture_title": lecture.title,
            "file_type": lecture.file_type,
            "segment_id": segment.id,
            "segment_index": segment.segment_index,
            "start_time": segment.start_time,
            "end_time": segment.end_time,
            "text": segment.segment_text,
            "transcript_id": transcript.id
        })

    return results