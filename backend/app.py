import os
import uuid
import time
import threading
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from config import Config
from models import db, Lecture, Transcript, TranscriptSegment, Topic
from services.whisper_service import transcribe_file
from services.search_service import search_transcripts, search_in_lecture
from services.topic_service import detect_topics
from datetime import datetime

app = Flask(__name__)

app.config.from_object(Config)
CORS(
    app,
    resources={r"/api/.*": {"origins": [
        "https://victoria-alozie-ai-lecture-transcriber.vercel.app",
        "http://localhost:3000"
    ]}},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "ngrok-skip-browser-warning"]
)

db.init_app(app)

UPLOAD_FOLDER = app.config["UPLOAD_FOLDER"]
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "mp3", "wav", "m4a", "aac",
    "mp4", "mov", "avi", "mkv"
}


def allowed_file(filename: str) -> bool:
    return "." in filename and \
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[1].lower()
    if ext in {"mp3", "wav", "m4a", "aac"}:
        return "audio"
    return "video"


# =====================
# BACKGROUND WORKER
# =====================
# def process_transcription(app_context, lecture_id: int, file_path: str):
#     """
#     Runs Whisper transcription in a background thread.
#     Updates lecture status when done.
#     """
#     with app_context:
#         try:
#             lecture = Lecture.query.get(lecture_id)
#             if not lecture:
#                 print(f"[BG] Lecture {lecture_id} not found")
#                 return

#             print(f"[BG] Starting transcription: lecture {lecture_id}")
#             start_time = time.time()

#             # Run Whisper
#             result = transcribe_file(file_path)

#             end_time = time.time()
#             duration = round(end_time - start_time, 2)
#             print(f"[BG] Transcription done in {duration}s")

#             # Save transcript
#             transcript = Transcript(
#                 lecture_id=lecture.id,
#                 full_text=result["full_text"],
#                 language=result["language"]
#             )
#             db.session.add(transcript)
#             db.session.commit()

#             # Save segments
#             for seg in result["segments"]:
#                 segment = TranscriptSegment(
#                     transcript_id=transcript.id,
#                     segment_index=seg["id"],
#                     start_time=seg["start"],
#                     end_time=seg["end"],
#                     segment_text=seg["text"]
#                 )
#                 db.session.add(segment)
#             db.session.commit()
#             print(f"[BG] Saved {len(result['segments'])} segments")

#             # Detect topics
#             print("[BG] Detecting topics...")
#             segment_list = [s.to_dict() for s in transcript.segments]
#             detected_topics = detect_topics(segment_list)

#             for item in detected_topics:
#                 topic = Topic(
#                     transcript_id=transcript.id,
#                     topic_title=item["topic_title"],
#                     start_time=item["start_time"],
#                     end_time=item["end_time"],
#                     description=item["description"]
#                 )
#                 db.session.add(topic)
#             db.session.commit()
#             print(f"[BG] Saved {len(detected_topics)} topics")

#             # Mark as completed
#             lecture.status = "completed"
#             lecture.processing_time = duration
#             db.session.commit()

#             print(f"[BG] Lecture {lecture_id} completed in {duration}s")

#         except Exception as e:
#             print(f"[BG] Error on lecture {lecture_id}: {str(e)}")
#             try:
#                 lecture = Lecture.query.get(lecture_id)
#                 if lecture:
#                     lecture.status = "failed"
#                     lecture.error_message = str(e)
#                     db.session.commit()
#             except Exception as inner:
#                 print(f"[BG] Could not update status: {str(inner)}")
#                 db.session.rollback()


# =====================
# BACKGROUND WORKER
# =====================
def process_transcription(app_context, lecture_id: int, file_path: str):
    """
    Runs Whisper transcription in a background thread.
    Uses a fresh DB session after the long transcription step
    so Supabase doesn't reuse a stale/closed connection.
    """
    with app_context:
        try:
            # Optional: verify lecture exists, then immediately release session
            lecture = db.session.get(Lecture, lecture_id)
            if not lecture:
                print(f"[BG] Lecture {lecture_id} not found")
                return

            # IMPORTANT:
            # Release any checked-out DB connection before the long Whisper job
            db.session.rollback()
            db.session.remove()

            print(f"[BG] Starting transcription: lecture {lecture_id}")
            start_time = time.time()

            # Run Whisper (long-running step)
            result = transcribe_file(file_path)

            end_time = time.time()
            duration = round(end_time - start_time, 2)
            print(f"[BG] Transcription done in {duration}s")

            # IMPORTANT:
            # Start with a brand-new session/connection for all DB writes
            db.session.remove()

            lecture = db.session.get(Lecture, lecture_id)
            if not lecture:
                print(f"[BG] Lecture {lecture_id} not found after transcription")
                return

            # Save transcript
            transcript = Transcript(
                lecture_id=lecture.id,
                full_text=result["full_text"],
                language=result["language"]
            )
            db.session.add(transcript)
            db.session.flush()  # get transcript.id without final commit

            # Save segments
            for seg in result["segments"]:
                segment = TranscriptSegment(
                    transcript_id=transcript.id,
                    segment_index=seg["id"],
                    start_time=seg["start"],
                    end_time=seg["end"],
                    segment_text=seg["text"]
                )
                db.session.add(segment)

            db.session.flush()
            print(f"[BG] Saved {len(result['segments'])} segments")

            # Detect topics
            print("[BG] Detecting topics...")
            segment_list = [s.to_dict() for s in transcript.segments]
            detected_topics = detect_topics(segment_list)

            for item in detected_topics:
                topic = Topic(
                    transcript_id=transcript.id,
                    topic_title=item["topic_title"],
                    start_time=item["start_time"],
                    end_time=item["end_time"],
                    description=item["description"]
                )
                db.session.add(topic)

            db.session.flush()
            print(f"[BG] Saved {len(detected_topics)} topics")

            # Mark as completed
            lecture.status = "completed"
            lecture.processing_time = duration
            lecture.error_message = None
            db.session.commit()

            print(f"[BG] Lecture {lecture_id} completed in {duration}s")

        except Exception as e:
            print(f"[BG] Error on lecture {lecture_id}: {str(e)}")
            db.session.rollback()
            db.session.remove()

            # Try to mark lecture as failed with a fresh session
            try:
                lecture = db.session.get(Lecture, lecture_id)
                if lecture:
                    lecture.status = "failed"
                    lecture.error_message = str(e)
                    db.session.commit()
            except Exception as inner:
                db.session.rollback()
                print(f"[BG] Could not update status: {str(inner)}")

# =====================
# CREATE TABLES
# =====================
with app.app_context():
    db.create_all()
    print("Database tables ready")


# =====================
# HOME
# =====================
@app.route("/")
def home():
    return jsonify({
        "message": "AI Transcription API is running",
        "endpoints": {
            "upload": "POST /api/upload",
            "lectures": "GET /api/lectures",
            "lecture": "GET /api/lectures/<id>",
            "status": "GET /api/lectures/<id>/status",
            "delete": "DELETE /api/lectures/<id>",
            "search": "GET /api/search?q=keyword",
            "search_in_lecture": "GET /api/lectures/<id>/search?q=keyword",
            "generate_topics": "POST /api/lectures/<id>/topics",
            "get_topics": "GET /api/lectures/<id>/topics"
        }
    })


# =====================
# UPLOAD (returns immediately)
# =====================
@app.route("/api/upload", methods=["POST"])
def upload_and_transcribe():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type"}), 400

    title = request.form.get("title", file.filename)
    original_filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{original_filename}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

    try:
        file.save(file_path)
        file_type = get_file_type(original_filename)

        # Save lecture immediately with processing status
        lecture = Lecture(
            title=title,
            file_name=unique_filename,
            file_type=file_type,
            file_path=file_path,
            status="processing",
            processing_started_at=datetime.utcnow()
        )
        db.session.add(lecture)
        db.session.commit()

        print(f"Lecture saved: ID {lecture.id} - {title}")
        print(f"Launching background thread...")

        # Start background thread
        thread = threading.Thread(
            target=process_transcription,
            args=(app.app_context(), lecture.id, file_path),
            daemon=True
        )
        thread.start()

        # Return immediately — do not wait for transcription
        return jsonify({
            "message": "File uploaded successfully. Transcription started.",
            "lecture_id": lecture.id,
            "title": title,
            "file_name": unique_filename,
            "file_type": file_type,
            "status": "processing"
        }), 202

    except Exception as e:
        db.session.rollback()
        print(f"Upload error: {str(e)}")
        return jsonify({
            "error": "Upload failed",
            "details": str(e)
        }), 500


# =====================
# CHECK STATUS
# =====================
@app.route("/api/lectures/<int:lecture_id>/status", methods=["GET"])
def check_status(lecture_id):
    lecture = Lecture.query.get(lecture_id)
    elapsed_seconds = None

    if not lecture:
        return jsonify({"error": "Lecture not found"}), 404
    
    
    if lecture.status == "processing" and lecture.processing_started_at:
        elapsed_seconds = round(
            (datetime.utcnow() - lecture.processing_started_at).total_seconds()
        )
    response = {
        "lecture_id": lecture.id,
        "title": lecture.title,
        "status": lecture.status,
        "processing_time": lecture.processing_time,
        "has_transcript": lecture.transcript is not None,
        "error_message": lecture.error_message,
        "elapsed_seconds": elapsed_seconds
    }

    if lecture.transcript:
        response["segment_count"] = len(lecture.transcript.segments)
        response["language"] = lecture.transcript.language
        topic_count = Topic.query.filter_by(
            transcript_id=lecture.transcript.id
        ).count()
        response["topic_count"] = topic_count

    return jsonify(response), 200


# =====================
# GET ALL LECTURES
# =====================
@app.route("/api/lectures", methods=["GET"])
def get_lectures():
    lectures = Lecture.query.order_by(
        Lecture.uploaded_at.desc()
    ).all()

    return jsonify({
        "lectures": [lecture.to_dict() for lecture in lectures],
        "total": len(lectures)
    }), 200


# =====================
# GET ONE LECTURE
# =====================
@app.route("/api/lectures/<int:lecture_id>", methods=["GET"])
def get_lecture(lecture_id):
    lecture = Lecture.query.get(lecture_id)

    if not lecture:
        return jsonify({"error": "Lecture not found"}), 404

    data = lecture.to_dict()

    if lecture.transcript:
        data["transcript"] = lecture.transcript.to_dict()
        topics = Topic.query.filter_by(
            transcript_id=lecture.transcript.id
        ).order_by(Topic.start_time).all()
        data["topics"] = [t.to_dict() for t in topics]

    return jsonify(data), 200


# =====================
# DELETE LECTURE
# =====================
@app.route("/api/lectures/<int:lecture_id>", methods=["DELETE"])
def delete_lecture(lecture_id):
    lecture = Lecture.query.get(lecture_id)

    if not lecture:
        return jsonify({"error": "Lecture not found"}), 404

    if os.path.exists(lecture.file_path):
        os.remove(lecture.file_path)

    db.session.delete(lecture)
    db.session.commit()

    return jsonify({"message": "Lecture deleted successfully"}), 200


# =====================
# SEARCH ALL
# =====================
@app.route("/api/search", methods=["GET"])
def search():
    query = request.args.get("q", "").strip()

    if not query:
        return jsonify({"error": "Search query is required"}), 400

    if len(query) < 2:
        return jsonify({
            "error": "Query must be at least 2 characters"
        }), 400

    try:
        results = search_transcripts(query)
        return jsonify({
            "query": query,
            "results": results,
            "total": len(results)
        }), 200

    except Exception as e:
        print(f"Search error: {str(e)}")
        return jsonify({
            "error": "Search failed",
            "details": str(e)
        }), 500


# =====================
# SEARCH IN LECTURE
# =====================
@app.route("/api/lectures/<int:lecture_id>/search", methods=["GET"])
def search_lecture(lecture_id):
    query = request.args.get("q", "").strip()

    if not query:
        return jsonify({"error": "Search query is required"}), 400

    lecture = Lecture.query.get(lecture_id)
    if not lecture:
        return jsonify({"error": "Lecture not found"}), 404

    try:
        results = search_in_lecture(query, lecture_id)
        return jsonify({
            "query": query,
            "lecture_id": lecture_id,
            "lecture_title": lecture.title,
            "results": results,
            "total": len(results)
        }), 200

    except Exception as e:
        print(f"Search error: {str(e)}")
        return jsonify({
            "error": "Search failed",
            "details": str(e)
        }), 500


# =====================
# GENERATE TOPICS
# =====================
@app.route("/api/lectures/<int:lecture_id>/topics", methods=["POST"])
def generate_topics(lecture_id):
    lecture = Lecture.query.get(lecture_id)

    if not lecture:
        return jsonify({"error": "Lecture not found"}), 404

    if not lecture.transcript:
        return jsonify({"error": "No transcript yet"}), 400

    try:
        segments = lecture.transcript.segments
        if not segments:
            return jsonify({"error": "No segments found"}), 400

        segment_list = [seg.to_dict() for seg in segments]

        # use improved topic detector
        detected = detect_topics(segment_list)

        if not detected:
            return jsonify({"error": "Could not detect topics"}), 400

        # Delete old topics
        existing = Topic.query.filter_by(
            transcript_id=lecture.transcript.id
        ).all()
        for t in existing:
            db.session.delete(t)
        db.session.commit()

        saved_topics = []
        for item in detected:
            topic = Topic(
                transcript_id=lecture.transcript.id,
                topic_title=item["topic_title"],
                start_time=item["start_time"],
                end_time=item["end_time"],
                description=item["description"]
            )
            db.session.add(topic)
            db.session.flush()
            saved_topics.append(topic.to_dict())

        db.session.commit()

        return jsonify({
            "message": "Topics detected and saved",
            "lecture_id": lecture_id,
            "total": len(saved_topics),
            "topics": saved_topics
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Topic error: {str(e)}")
        return jsonify({
            "error": "Topic detection failed",
            "details": str(e)
        }), 500

# =====================
# GET TOPICS
# =====================
@app.route("/api/lectures/<int:lecture_id>/topics", methods=["GET"])
def get_topics(lecture_id):
    lecture = Lecture.query.get(lecture_id)

    if not lecture:
        return jsonify({"error": "Lecture not found"}), 404

    if not lecture.transcript:
        return jsonify({"topics": [], "total": 0}), 200

    topics = Topic.query.filter_by(
        transcript_id=lecture.transcript.id
    ).order_by(Topic.start_time).all()

    return jsonify({
        "lecture_id": lecture_id,
        "lecture_title": lecture.title,
        "topics": [t.to_dict() for t in topics],
        "total": len(topics)
    }), 200


# =====================
# EXPORT SRT
# =====================
@app.route("/api/lectures/<int:lecture_id>/export/srt", methods=["GET"])
def export_srt(lecture_id):
    lecture = Lecture.query.get(lecture_id)

    if not lecture:
        return jsonify({"error": "Lecture not found"}), 404

    if not lecture.transcript:
        return jsonify({"error": "No transcript available"}), 400

    segments = lecture.transcript.segments
    if not segments:
        return jsonify({"error": "No segments available"}), 400

    def format_srt_time(seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    srt_content = ""
    for i, seg in enumerate(segments, start=1):
        start = format_srt_time(seg.start_time)
        end = format_srt_time(seg.end_time)
        text = seg.segment_text.strip()
        srt_content += f"{i}\n{start} --> {end}\n{text}\n\n"

    from flask import Response
    return Response(
        srt_content,
        mimetype="text/plain",
        headers={
            "Content-Disposition":
                f"attachment; filename={lecture.title}.srt"
        }
    )


# =====================
# EXPORT TXT
# =====================
@app.route("/api/lectures/<int:lecture_id>/export/txt", methods=["GET"])
def export_txt(lecture_id):
    lecture = Lecture.query.get(lecture_id)

    if not lecture:
        return jsonify({"error": "Lecture not found"}), 404

    if not lecture.transcript:
        return jsonify({"error": "No transcript available"}), 400

    from flask import Response
    return Response(
        lecture.transcript.full_text,
        mimetype="text/plain",
        headers={
            "Content-Disposition":
                f"attachment; filename={lecture.title}.txt"
        }
    )


# =====================
# SERVE FILES
# =====================
@app.route("/uploads/<filename>")
def serve_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


if __name__ == "__main__":
    app.run(debug=True, threaded=True)