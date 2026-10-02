"""SQLAlchemy models. Phone numbers are never stored."""

from __future__ import annotations

import json
import time
import uuid
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def new_id() -> str:
    return uuid.uuid4().hex[:16]


def now_ms() -> int:
    return int(time.time() * 1000)


def time_ago(ms: int | None) -> str:
    if not ms:
        return ""
    seconds = max(0, int((now_ms() - ms) / 1000))
    if seconds < 60:
        return "Just now"
    if seconds < 3600:
        return f"{seconds // 60}m ago"
    if seconds < 86400:
        return f"{seconds // 3600}h ago"
    return f"{seconds // 86400}d ago"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(32), primary_key=True, default=new_id)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    college = db.Column(db.String(180), default="")
    course = db.Column(db.String(40), default="")
    branch = db.Column(db.String(40), default="")
    year = db.Column(db.String(40), default="")
    semester = db.Column(db.String(40), default="")
    subjects_json = db.Column(db.Text, default="[]")
    hide_name = db.Column(db.Boolean, default=True)
    hide_email = db.Column(db.Boolean, default=True)
    hide_college = db.Column(db.Boolean, default=False)
    hide_online = db.Column(db.Boolean, default=False)
    hide_photo = db.Column(db.Boolean, default=True)
    photo_url = db.Column(db.String(255))
    online = db.Column(db.Boolean, default=False)
    last_seen = db.Column(db.BigInteger, default=now_ms)
    setup_complete = db.Column(db.Boolean, default=False)

    @property
    def subjects(self):
        try:
            data = json.loads(self.subjects_json or "[]")
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []

    @subjects.setter
    def subjects(self, value):
        self.subjects_json = json.dumps(value or [])


class Doubt(db.Model):
    __tablename__ = "doubts"

    id = db.Column(db.String(32), primary_key=True, default=new_id)
    author_id = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)
    subject = db.Column(db.String(120), nullable=False)
    topic = db.Column(db.String(120), nullable=False)
    question = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255))
    pdf_url = db.Column(db.String(255))
    created_at = db.Column(db.BigInteger, default=now_ms)


class Answer(db.Model):
    __tablename__ = "answers"

    id = db.Column(db.String(32), primary_key=True, default=new_id)
    doubt_id = db.Column(db.String(32), db.ForeignKey("doubts.id"), nullable=False)
    author_id = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)
    text = db.Column(db.Text, nullable=False)
    accepted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.BigInteger, default=now_ms)


class Like(db.Model):
    __tablename__ = "likes"

    answer_id = db.Column(db.String(32), db.ForeignKey("answers.id"), primary_key=True)
    user_id = db.Column(db.String(32), db.ForeignKey("users.id"), primary_key=True)


class Conversation(db.Model):
    __tablename__ = "conversations"

    id = db.Column(db.String(32), primary_key=True, default=new_id)
    user_a = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)
    user_b = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.String(32), primary_key=True, default=new_id)
    conversation_id = db.Column(db.String(32), db.ForeignKey("conversations.id"), nullable=False)
    sender_id = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(20), default="text")
    text = db.Column(db.Text, default="")
    file_url = db.Column(db.String(255))
    created_at = db.Column(db.BigInteger, default=now_ms)


class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.String(32), primary_key=True, default=new_id)
    author_id = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)
    course = db.Column(db.String(40), nullable=False)
    branch = db.Column(db.String(40), nullable=False)
    semester = db.Column(db.String(40), nullable=False)
    subject = db.Column(db.String(120), nullable=False)
    title = db.Column(db.String(180), default="")
    original_name = db.Column(db.String(180), default="")
    file_url = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.BigInteger, default=now_ms)


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.String(32), primary_key=True, default=new_id)
    user_id = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(40), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    text = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(255), default="")
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.BigInteger, default=now_ms)


class FriendRequest(db.Model):
    __tablename__ = "friend_requests"

    id = db.Column(db.String(32), primary_key=True, default=new_id)
    from_id = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)
    to_id = db.Column(db.String(32), db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.BigInteger, default=now_ms)


def public_user(user: User | None, viewer: User | None = None) -> dict | None:
    """Academic fields are public. Name, email, and phone are never shown to others."""
    if not user:
        return None
    is_self = bool(viewer and viewer.id == user.id)
    college = user.college if is_self or not user.hide_college else None
    photo = None if (user.hide_photo and not is_self) else user.photo_url
    payload = {
        "id": user.id,
        "username": user.username,
        "course": user.course,
        "branch": user.branch,
        "year": user.year,
        "college": college,
        "online": bool(user.online and not user.hide_online),
        "lastSeen": user.last_seen,
        "photoUrl": photo,
        "setupComplete": user.setup_complete,
    }
    if is_self:
        payload.update({
            "fullName": user.full_name,
            "email": user.email,
            "semester": user.semester,
            "subjects": user.subjects,
            "hideName": user.hide_name,
            "hideEmail": user.hide_email,
            "hideCollege": user.hide_college,
            "hideOnline": user.hide_online,
            "hidePhoto": user.hide_photo,
            "college": user.college,
            "photoUrl": user.photo_url,
            "online": user.online,
        })
    return payload


def format_doubt(doubt: Doubt) -> dict:
    author = db.session.get(User, doubt.author_id)
    answers = Answer.query.filter_by(doubt_id=doubt.id).all()
    formatted = []
    for answer in answers:
        a_author = db.session.get(User, answer.author_id)
        likes = Like.query.filter_by(answer_id=answer.id).count()
        formatted.append({
            "id": answer.id,
            "text": answer.text,
            "author": a_author.username if a_author else "Student",
            "likes": likes,
            "accepted": bool(answer.accepted),
        })
    formatted.sort(key=lambda a: (not a["accepted"], -a["likes"]))
    return {
        "id": doubt.id,
        "subject": doubt.subject,
        "topic": doubt.topic,
        "question": doubt.question,
        "imageUrl": doubt.image_url,
        "pdfUrl": doubt.pdf_url,
        "author": author.username if author else "Student",
        "time": time_ago(doubt.created_at),
        "answers": len(formatted),
        "accepted": any(a["accepted"] for a in formatted),
        "answerList": formatted,
    }


def notify(user_id: str, ntype: str, title: str, text: str, link: str = "") -> None:
    db.session.add(Notification(
        id=new_id(),
        user_id=user_id,
        type=ntype,
        title=title,
        text=text,
        link=link,
        created_at=now_ms(),
    ))


def clock_time(ms: int) -> str:
    return datetime.fromtimestamp(ms / 1000).strftime("%H:%M")
