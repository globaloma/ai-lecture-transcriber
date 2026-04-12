from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Lecture(db.Model):
    __tablename__ = "lectures"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50))
    file_path = db.Column(db.Text)
    status = db.Column(
        db.String(50),
        default="processing",
        nullable=False
    )
    processing_time = db.Column(db.Float, nullable=True)
    processing_started_at = db.Column(db.DateTime, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    transcript = db.relationship(
        "Transcript",
        backref="lecture",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "file_name": self.file_name,
            "file_type": self.file_type,
            "status": self.status,
            "processing_time": self.processing_time,
            "processing_started_at": self.processing_started_at,
            "error_message": self.error_message,
            "uploaded_at": self.uploaded_at.isoformat(),
            "has_transcript": self.transcript is not None
        }


class Transcript(db.Model):
    __tablename__ = "transcripts"

    id = db.Column(db.Integer, primary_key=True)
    lecture_id = db.Column(
        db.Integer,
        db.ForeignKey("lectures.id", ondelete="CASCADE"),
        nullable=False
    )
    full_text = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    segments = db.relationship(
        "TranscriptSegment",
        backref="transcript",
        cascade="all, delete-orphan",
        order_by="TranscriptSegment.segment_index"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "lecture_id": self.lecture_id,
            "full_text": self.full_text,
            "language": self.language,
            "created_at": self.created_at.isoformat(),
            "segments": [seg.to_dict() for seg in self.segments]
        }


class TranscriptSegment(db.Model):
    __tablename__ = "transcript_segments"

    id = db.Column(db.Integer, primary_key=True)
    transcript_id = db.Column(
        db.Integer,
        db.ForeignKey("transcripts.id", ondelete="CASCADE"),
        nullable=False
    )
    segment_index = db.Column(db.Integer)
    start_time = db.Column(db.Float, nullable=False)
    end_time = db.Column(db.Float, nullable=False)
    segment_text = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "segment_index": self.segment_index,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "text": self.segment_text
        }


class Topic(db.Model):
    __tablename__ = "topics"

    id = db.Column(db.Integer, primary_key=True)
    transcript_id = db.Column(
        db.Integer,
        db.ForeignKey("transcripts.id", ondelete="CASCADE"),
        nullable=False
    )
    topic_title = db.Column(db.String(255), nullable=False)
    start_time = db.Column(db.Float)
    end_time = db.Column(db.Float)
    description = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "topic_title": self.topic_title,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "description": self.description
        }