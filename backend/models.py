from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    university = db.Column(db.String(255), nullable=False)
    faculty = db.Column(db.String(255), nullable=False)
    department = db.Column(db.String(255), nullable=False)
    matric_number = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    lectures = db.relationship(
        "Lecture",
        backref="owner",
        cascade="all, delete-orphan"
    )
    attempts = db.relationship(
        "Attempt",
        backref="student",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "university": self.university,
            "faculty": self.faculty,
            "department": self.department,
            "matric_number": self.matric_number,
            "created_at": self.created_at.isoformat()
        }


class Lecture(db.Model):
    __tablename__ = "lectures"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True
    )
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
    assessment = db.relationship(
        "Assessment",
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
            "file_url": self.file_path,
            "status": self.status,
            "processing_time": self.processing_time,
            "processing_started_at": self.processing_started_at,
            "error_message": self.error_message,
            "uploaded_at": self.uploaded_at.isoformat(),
            "has_transcript": self.transcript is not None,
            "has_assessment": self.assessment is not None
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


class Assessment(db.Model):
    __tablename__ = "assessments"

    id = db.Column(db.Integer, primary_key=True)
    lecture_id = db.Column(
        db.Integer,
        db.ForeignKey("lectures.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    questions = db.relationship(
        "Question",
        backref="assessment",
        cascade="all, delete-orphan",
        order_by="Question.order"
    )

    def to_dict(self, reveal_answers=False):
        return {
            "id": self.id,
            "lecture_id": self.lecture_id,
            "created_at": self.created_at.isoformat(),
            "total_questions": len(self.questions),
            "questions": [q.to_dict(reveal_answers) for q in self.questions]
        }


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(
        db.Integer,
        db.ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False
    )
    question_text = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, default=0)

    choices = db.relationship(
        "Choice",
        backref="question",
        cascade="all, delete-orphan",
        order_by="Choice.order"
    )

    def to_dict(self, reveal_answers=False):
        data = {
            "id": self.id,
            "question_text": self.question_text,
            "choices": [c.to_dict(reveal_answers) for c in self.choices]
        }
        if reveal_answers:
            data["explanation"] = self.explanation
        return data


class Choice(db.Model):
    __tablename__ = "choices"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(
        db.Integer,
        db.ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False
    )
    choice_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False, nullable=False)
    order = db.Column(db.Integer, default=0)

    def to_dict(self, reveal_answers=False):
        data = {
            "id": self.id,
            "choice_text": self.choice_text
        }
        if reveal_answers:
            data["is_correct"] = self.is_correct
        return data


class Attempt(db.Model):
    __tablename__ = "attempts"

    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(
        db.Integer,
        db.ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    score = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Integer, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    answers = db.relationship(
        "AttemptAnswer",
        backref="attempt",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "assessment_id": self.assessment_id,
            "score": self.score,
            "total": self.total,
            "submitted_at": self.submitted_at.isoformat()
        }


class AttemptAnswer(db.Model):
    __tablename__ = "attempt_answers"

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(
        db.Integer,
        db.ForeignKey("attempts.id", ondelete="CASCADE"),
        nullable=False
    )
    question_id = db.Column(
        db.Integer,
        db.ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False
    )
    selected_choice_id = db.Column(
        db.Integer,
        db.ForeignKey("choices.id", ondelete="CASCADE"),
        nullable=True
    )
    is_correct = db.Column(db.Boolean, default=False, nullable=False)
