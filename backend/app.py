"""
StudyConnectNG Python API + SQLite database.

Run from the project folder:
    pip install -r requirements.txt
    python backend/app.py

Then open http://localhost:5000
Demo login: coder@studyconnect.edu / Student@123
Phone numbers are never stored.
"""

from __future__ import annotations

import os
import random
import sys
from functools import wraps
from pathlib import Path

import jwt
from flask import Flask, g, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

ROOT = Path(__file__).resolve().parent.parent
BACKEND = Path(__file__).resolve().parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from models import (  # noqa: E402
    Answer,
    Conversation,
    Doubt,
    FriendRequest,
    Like,
    Message,
    Note,
    Notification,
    User,
    clock_time,
    db,
    format_doubt,
    new_id,
    notify,
    now_ms,
    public_user,
    time_ago,
)

JWT_SECRET = os.environ.get("JWT_SECRET", "studyconnect-dev-secret-change-me")
UPLOAD_ROOT = BACKEND / "uploads"
DATA_DIR = BACKEND / "data"
ALLOWED_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".txt", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".mp3", ".wav", ".webm"}

AI_FALLBACK = {
    "pointer": (
        "Pointers in C are variables that store memory addresses. They allow direct memory "
        "manipulation and are essential for dynamic memory allocation, arrays, and function "
        "arguments passed by reference.\n\nKey concepts:\n• Declaration: `int *ptr;`\n"
        "• Address-of operator: `ptr = &variable;`\n• Dereference: `*ptr = value;`"
    ),
    "oop": (
        "Java OOP has four pillars:\n\n1. **Encapsulation** — Bundling data and methods, hiding internal state\n"
        "2. **Inheritance** — Child classes inherit from parent (`extends`)\n"
        "3. **Polymorphism** — Same interface, different implementations\n"
        "4. **Abstraction** — Hiding complexity (`abstract class`, `interface`)"
    ),
    "normalization": (
        "Database Normalization reduces redundancy:\n\n• **1NF** — Atomic values, no repeating groups\n"
        "• **2NF** — 1NF + no partial dependencies\n• **3NF** — 2NF + no transitive dependencies\n\n"
        "Example: Split a table with (StudentID, Name, Course, Instructor) into separate Student and Course tables."
    ),
}
 
def create_app() -> Flask:
    app = Flask(__name__, static_folder=str(ROOT), static_url_path="")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for folder in ("chat", "notes", "avatars", "doubts"):
        (UPLOAD_ROOT / folder).mkdir(parents=True, exist_ok=True)

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + str(DATA_DIR / "studyconnect.db").replace("\\", "/")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024
    app.config["SECRET_KEY"] = JWT_SECRET

    db.init_app(app)
    CORS(app)

    with app.app_context():
        db.create_all()
        seed_if_needed()

    def token_for(user: User) -> str:
        return jwt.encode({"id": user.id}, JWT_SECRET, algorithm="HS256")

    def current_user():
        header = request.headers.get("Authorization", "")
        token = header[7:] if header.startswith("Bearer ") else None
        if not token:
            return None
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.PyJWTError:
            return None
        return db.session.get(User, payload.get("id"))

    def auth_required(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user:
                return jsonify({"error": "Please log in"}), 401
            g.user = user
            return fn(*args, **kwargs)
        return wrapper

    
    def save_upload(file_storage, folder: str):
        if not file_storage or not file_storage.filename:
            return None

        ext = Path(file_storage.filename).suffix.lower()

        if ext not in ALLOWED_EXT:
            raise ValueError("File type not allowed")

        name = new_id() + (secure_filename(ext) or ext)
        dest = UPLOAD_ROOT / folder / name

        file_storage.save(dest)

        return f"/uploads/{folder}/{name}"

    def json_body():
        return request.get_json(silent=True) or {}

    @app.post("/api/auth/register")
    def register():
        body = json_body()
        full_name = (body.get("fullName") or "").strip()
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""
        college = (body.get("college") or "").strip()
        if not all([full_name, email, password, college]):
            return jsonify({"error": "All fields are required"}), 400
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already registered"}), 409
        user = User(
            id=new_id(),
            full_name=full_name,
            email=email,
            password_hash=generate_password_hash(password),
            username=f"Student_{random.randint(1000, 9999)}",
            college=college,
            hide_name=True,
            hide_email=True,
            hide_photo=True,
            online=True,
            last_seen=now_ms(),
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({"token": token_for(user), "user": public_user(user, user)})

    @app.post("/api/auth/login")
    def login():
        body = json_body()
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""
        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid email or password"}), 401
        user.online = True
        user.last_seen = now_ms()
        db.session.commit()
        return jsonify({"token": token_for(user), "user": public_user(user, user)})

    @app.post("/api/auth/forgot")
    def forgot():
        email = (json_body().get("email") or request.form.get("email") or "").strip()
        if not email:
            return jsonify({"error": "Email is required"}), 400
        return jsonify({
            "ok": True,
            "message": "If that email exists, a reset link would be sent. Phone numbers are never used.",
        })

    @app.get("/api/me")
    @auth_required
    def me():
        return jsonify({"user": public_user(g.user, g.user)})

    @app.post("/api/auth/logout")
    @auth_required
    def logout():
        g.user.online = False
        g.user.last_seen = now_ms()
        db.session.commit()
        return jsonify({"ok": True})

    @app.put("/api/profile")
    @auth_required
    def update_profile():
        body = json_body()
        user = g.user
        allowed = {
            "username": "username",
            "college": "college",
            "course": "course",
            "branch": "branch",
            "year": "year",
            "semester": "semester",
            "hideName": "hide_name",
            "hideEmail": "hide_email",
            "hideCollege": "hide_college",
            "hideOnline": "hide_online",
            "hidePhoto": "hide_photo",
            "setupComplete": "setup_complete",
        }
        for key, attr in allowed.items():
            if key in body:
                setattr(user, attr, body[key])
        if "subjects" in body:
            user.subjects = body["subjects"]
        db.session.commit()
        return jsonify({"user": public_user(user, user)})

    @app.post("/api/profile/photo")
    @auth_required
    def profile_photo():
        try:
            url = save_upload(request.files.get("photo"), "avatars")
        except ValueError as err:
            return jsonify({"error": str(err)}), 400
        if not url:
            return jsonify({"error": "No photo uploaded"}), 400
        g.user.photo_url = url
        db.session.commit()
        return jsonify({"user": public_user(g.user, g.user)})

    @app.get("/api/students")
    @auth_required
    def students():
        course = request.args.get("course")
        branch = request.args.get("branch")
        year = request.args.get("year")
        college = request.args.get("college")
        online = request.args.get("online")
        q = (request.args.get("q") or "").lower()

        query = User.query.filter(User.id != g.user.id, User.setup_complete.is_(True))
        if course:
            query = query.filter_by(course=course)
        if branch:
            query = query.filter_by(branch=branch)
        if year:
            query = query.filter_by(year=year)
        rows = query.all()
        if college:
            needle = college.lower()
            rows = [u for u in rows if not u.hide_college and needle in (u.college or "").lower()]
        if online == "online":
            rows = [u for u in rows if u.online and not u.hide_online]
        elif online == "offline":
            rows = [u for u in rows if not u.online or u.hide_online]
        if q:
            rows = [
                u for u in rows
                if q in u.username.lower()
                or q in (u.branch or "").lower()
                or (not u.hide_college and q in (u.college or "").lower())
            ]
        return jsonify({"students": [public_user(u) for u in rows]})

    @app.get("/api/students/<username>")
    @auth_required
    def student_by_name(username):
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "Student not found"}), 404
        return jsonify({"student": public_user(user)})

    @app.get("/api/doubts")
    @auth_required
    def list_doubts():
        doubts = Doubt.query.order_by(Doubt.created_at.desc()).all()
        return jsonify({"doubts": [format_doubt(d) for d in doubts]})

    @app.post("/api/doubts")
    @auth_required
    def create_doubt():
        subject = (request.form.get("subject") or json_body().get("subject") or "").strip()
        topic = (request.form.get("topic") or json_body().get("topic") or "").strip()
        question = (request.form.get("question") or json_body().get("question") or "").strip()
        if not all([subject, topic, question]):
            return jsonify({"error": "Subject, topic, and question are required"}), 400
        try:
            image_url = save_upload(request.files.get("image"), "doubts")
            pdf_url = save_upload(request.files.get("pdf"), "doubts")
        except ValueError as err:
            return jsonify({"error": str(err)}), 400
        doubt = Doubt(
            id=new_id(),
            author_id=g.user.id,
            subject=subject,
            topic=topic,
            question=question,
            image_url=image_url,
            pdf_url=pdf_url,
            created_at=now_ms(),
        )
        db.session.add(doubt)
        db.session.commit()
        return jsonify({"doubt": format_doubt(doubt)})

    @app.post("/api/doubts/<doubt_id>/answers")
    @auth_required
    def create_answer(doubt_id):
        text = (json_body().get("text") or "").strip()
        if not text:
            return jsonify({"error": "Answer cannot be empty"}), 400
        doubt = db.session.get(Doubt, doubt_id)
        if not doubt:
            return jsonify({"error": "Doubt not found"}), 404
        db.session.add(Answer(id=new_id(), doubt_id=doubt.id, author_id=g.user.id, text=text, created_at=now_ms()))
        if doubt.author_id != g.user.id:
            notify(doubt.author_id, "answer", "New answer", f"{g.user.username} answered your doubt on {doubt.topic}.", "doubt.html")
        db.session.commit()
        return jsonify({"doubt": format_doubt(doubt)})

    @app.post("/api/answers/<answer_id>/like")
    @auth_required
    def like_answer(answer_id):
        answer = db.session.get(Answer, answer_id)
        if not answer:
            return jsonify({"error": "Answer not found"}), 404
        existing = Like.query.filter_by(answer_id=answer.id, user_id=g.user.id).first()
        if existing:
            db.session.delete(existing)
            liked = False
        else:
            db.session.add(Like(answer_id=answer.id, user_id=g.user.id))
            liked = True
        db.session.commit()
        likes = Like.query.filter_by(answer_id=answer.id).count()
        return jsonify({"likes": likes, "liked": liked})

    @app.post("/api/answers/<answer_id>/accept")
    @auth_required
    def accept_answer(answer_id):
        answer = db.session.get(Answer, answer_id)
        if not answer:
            return jsonify({"error": "Answer not found"}), 404
        doubt = db.session.get(Doubt, answer.doubt_id)
        if not doubt or doubt.author_id != g.user.id:
            return jsonify({"error": "Only the question author can accept an answer"}), 403
        for other in Answer.query.filter_by(doubt_id=doubt.id).all():
            other.accepted = other.id == answer.id
        db.session.commit()
        return jsonify({"doubt": format_doubt(doubt)})

    def other_user(conv: Conversation, user_id: str):
        other_id = conv.user_b if conv.user_a == user_id else conv.user_a
        return db.session.get(User, other_id)

    @app.get("/api/conversations")
    @auth_required
    def conversations():
        uid = g.user.id
        convs = Conversation.query.filter((Conversation.user_a == uid) | (Conversation.user_b == uid)).all()
        out = []
        for conv in convs:
            last = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.desc()).first()
            other = other_user(conv, uid)
            out.append({
                "id": conv.id,
                "student": public_user(other),
                "preview": (last.text if last and last.text else "Attachment") if last else "No messages yet",
                "time": time_ago(last.created_at) if last else "",
            })
        return jsonify({"conversations": out})

    @app.post("/api/conversations")
    @auth_required
    def open_conversation():
        username = json_body().get("username")
        other = User.query.filter_by(username=username).first()
        if not other:
            return jsonify({"error": "Student not found"}), 404
        if other.id == g.user.id:
            return jsonify({"error": "Cannot chat with yourself"}), 400
        conv = Conversation.query.filter(
            ((Conversation.user_a == g.user.id) & (Conversation.user_b == other.id))
            | ((Conversation.user_a == other.id) & (Conversation.user_b == g.user.id))
        ).first()
        if not conv:
            conv = Conversation(id=new_id(), user_a=g.user.id, user_b=other.id)
            db.session.add(conv)
            db.session.commit()
        return jsonify({"conversation": {"id": conv.id, "student": public_user(other)}})

    @app.get("/api/conversations/<conv_id>/messages")
    @auth_required
    def list_messages(conv_id):
        conv = db.session.get(Conversation, conv_id)
        if not conv or g.user.id not in (conv.user_a, conv.user_b):
            return jsonify({"error": "Conversation not found"}), 404
        q = (request.args.get("q") or "").lower()
        messages = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.asc()).all()
        if q:
            messages = [m for m in messages if q in (m.text or "").lower()]
        return jsonify({
            "messages": [{
                "id": m.id,
                "mine": m.sender_id == g.user.id,
                "type": m.type,
                "text": m.text,
                "fileUrl": m.file_url,
                "time": clock_time(m.created_at),
            } for m in messages]
        })

    @app.post("/api/conversations/<conv_id>/messages")
    @auth_required
    def send_message(conv_id):
        conv = db.session.get(Conversation, conv_id)
        if not conv or g.user.id not in (conv.user_a, conv.user_b):
            return jsonify({"error": "Conversation not found"}), 404
        msg_type = request.form.get("type") or json_body().get("type") or "text"
        text = (request.form.get("text") or json_body().get("text") or "").strip()
        try:
            file_url = save_upload(request.files.get("file"), "chat")
        except ValueError as err:
            return jsonify({"error": str(err)}), 400
        uploaded = request.files.get("file")
        if file_url and msg_type == "text":
            msg_type = "image" if (uploaded.mimetype or "").startswith("image/") else "file"
        if not text and not file_url and msg_type != "voice":
            return jsonify({"error": "Message cannot be empty"}), 400
        if not text:
            text = uploaded.filename if file_url and uploaded else "Voice message"
        msg = Message(
            id=new_id(),
            conversation_id=conv.id,
            sender_id=g.user.id,
            type=msg_type,
            text=text,
            file_url=file_url,
            created_at=now_ms(),
        )
        db.session.add(msg)
        other = other_user(conv, g.user.id)
        if other:
            notify(other.id, "message", "New message", f"{g.user.username} sent you a message.", f"chat.html?user={g.user.username}")
        db.session.commit()
        return jsonify({
            "message": {
                "id": msg.id,
                "mine": True,
                "type": msg.type,
                "text": msg.text,
                "fileUrl": msg.file_url,
                "time": clock_time(msg.created_at),
            }
        })

    @app.get("/api/notes")
    @auth_required
    def list_notes():
        query = Note.query
        for field in ("course", "branch", "semester", "subject"):
            value = request.args.get(field)
            if value:
                query = query.filter(getattr(Note, field) == value)
        notes = query.order_by(Note.created_at.desc()).all()
        out = []
        for note in notes:
            author = db.session.get(User, note.author_id)
            out.append({
                "id": note.id,
                "title": note.title or note.original_name,
                "originalName": note.original_name,
                "subject": note.subject,
                "fileUrl": note.file_url,
                "author": author.username if author else "Student",
                "time": time_ago(note.created_at),
            })
        return jsonify({"notes": out})

    @app.post("/api/notes")
    @auth_required
    def upload_note():
        try:
            url = save_upload(request.files.get("file"), "notes")
        except ValueError as err:
            return jsonify({"error": str(err)}), 400
        if not url:
            return jsonify({"error": "Please choose a PDF or file"}), 400
        course = request.form.get("course")
        branch = request.form.get("branch")
        semester = request.form.get("semester")
        subject = request.form.get("subject")
        if not all([course, branch, semester, subject]):
            return jsonify({"error": "Course, branch, semester, and subject are required"}), 400
        note = Note(
            id=new_id(),
            author_id=g.user.id,
            course=course,
            branch=branch,
            semester=semester,
            subject=subject,
            title=subject,
            original_name=request.files["file"].filename,
            file_url=url,
            created_at=now_ms(),
        )
        db.session.add(note)
        db.session.commit()
        return jsonify({"note": {"id": note.id, "fileUrl": note.file_url, "subject": note.subject}})

    @app.get("/api/notifications")
    @auth_required
    def list_notifications():
        rows = Notification.query.filter_by(user_id=g.user.id).order_by(Notification.created_at.desc()).all()
        return jsonify({"notifications": [{
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "text": n.text,
            "link": n.link,
            "read": n.read,
            "time": time_ago(n.created_at),
        } for n in rows]})

    @app.post("/api/notifications/read")
    @auth_required
    def read_notifications():
        Notification.query.filter_by(user_id=g.user.id).update({"read": True})
        db.session.commit()
        return jsonify({"ok": True})

    @app.post("/api/friends/request")
    @auth_required
    def friend_request():
        username = json_body().get("username")
        other = User.query.filter_by(username=username).first()
        if not other:
            return jsonify({"error": "Student not found"}), 404
        db.session.add(FriendRequest(id=new_id(), from_id=g.user.id, to_id=other.id, created_at=now_ms()))
        notify(other.id, "friend", "Friend request", f"{g.user.username} wants to connect. No personal contact details are shared.", "search.html")
        db.session.commit()
        return jsonify({"ok": True})

    @app.post("/api/ai/ask")
    @auth_required
    def ai_ask():
        question = (json_body().get("question") or "").strip()
        if not question:
            return jsonify({"error": "Ask an academic question"}), 400
        q = question.lower()
        if "pointer" in q:
            answer = AI_FALLBACK["pointer"]
        elif "java" in q or "oop" in q:
            answer = AI_FALLBACK["oop"]
        elif "normalization" in q or "dbms" in q:
            answer = AI_FALLBACK["normalization"]
        else:
            answer = (
                "That is a good academic question. Break it into smaller concepts first. "
                "If no classmate can help, try restating the topic (for example: pointers, Java OOP, or DBMS normalization)."
            )
        notify(g.user.id, "ai", "AI response", "Your AI assistant finished an explanation.", "ai-assistant.html")
        db.session.commit()
        return jsonify({"answer": answer})

    @app.errorhandler(RequestEntityTooLarge)
    def too_large(_error):
        return jsonify({"error": "File is too large. Please upload a file under 100 MB."}), 413

    @app.get("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(UPLOAD_ROOT, filename)

    @app.get("/api/stats")
    def stats():
        total = User.query.count()
        demo = User.query.filter(User.email.like("%@studyconnect.edu")).count()
        return jsonify({
            "registered": total,
            "demoAccounts": demo,
            "realStudents": max(total - demo, 0),
        })

    @app.get("/")
    def home():
        return send_from_directory(ROOT, "index.html")

    @app.get("/<path:path>")
    def static_pages(path):
        if path.startswith("api/") or path.startswith("backend/") or path.startswith("server/"):
            return jsonify({"error": "Not found"}), 404
        target = ROOT / path
        if target.is_file():
            return send_from_directory(ROOT, path)
        return send_from_directory(ROOT, "index.html")

    return app


def seed_if_needed() -> None:
    if User.query.count():
        return
    password = generate_password_hash("Student@123")
    demo = [
        ("Coder_2847", "coder@studyconnect.edu", "Demo Coder", "ABC Polytechnic", "Diploma", "CSE", "2nd Year", "Semester 4", True),
        ("Techie_9012", "techie@studyconnect.edu", "Demo Techie", "XYZ Engineering", "B.Tech", "ECE", "3rd Year", "Semester 6", True),
        ("Dev_5634", "dev@studyconnect.edu", "Demo Dev", "ABC Polytechnic", "Diploma", "IT", "1st Year", "Semester 2", False),
        ("Engineer_7721", "engineer@studyconnect.edu", "Demo Engineer", "PQR Institute", "B.Tech", "Mechanical", "4th Year", "Semester 8", True),
        ("Learner_3390", "learner@studyconnect.edu", "Demo Learner", "ABC Polytechnic", "Diploma", "CSE", "2nd Year", "Semester 3", False),
        ("Scholar_1156", "scholar@studyconnect.edu", "Demo Scholar", "Tech University", "B.Tech", "AI & ML", "3rd Year", "Semester 5", True),
        ("Builder_4488", "builder@studyconnect.edu", "Demo Builder", "XYZ Engineering", "B.Tech", "Civil", "2nd Year", "Semester 4", True),
        ("Circuit_6677", "circuit@studyconnect.edu", "Demo Circuit", "PQR Institute", "Diploma", "EEE", "1st Year", "Semester 2", False),
    ]
    users = []
    for username, email, name, college, course, branch, year, semester, online in demo:
        user = User(
            id=new_id(),
            full_name=name,
            email=email,
            password_hash=password,
            username=username,
            college=college,
            course=course,
            branch=branch,
            year=year,
            semester=semester,
            hide_name=True,
            hide_email=True,
            hide_college=False,
            hide_photo=True,
            online=online,
            last_seen=now_ms(),
            setup_complete=True,
        )
        user.subjects = ["Programming"]
        db.session.add(user)
        users.append(user)
    db.session.flush()

    doubt = Doubt(
        id=new_id(),
        author_id=users[4].id,
        subject="Data Structures",
        topic="Linked Lists",
        question="How do I reverse a singly linked list iteratively?",
        created_at=now_ms() - 7200000,
    )
    db.session.add(doubt)
    db.session.flush()
    db.session.add(Answer(
        id=new_id(),
        doubt_id=doubt.id,
        author_id=users[0].id,
        text="Use three pointers: prev, current, and next. Iterate through the list reversing the next pointer of each node.",
        accepted=True,
        created_at=now_ms() - 3600000,
    ))
    db.session.add(Answer(
        id=new_id(),
        doubt_id=doubt.id,
        author_id=users[1].id,
        text="You can also use recursion — reverse the rest of the list and adjust pointers.",
        accepted=False,
        created_at=now_ms() - 1800000,
    ))
    db.session.add(Doubt(
        id=new_id(),
        author_id=users[2].id,
        subject="Java",
        topic="OOP",
        question="What is the difference between abstract class and interface in Java?",
        created_at=now_ms() - 18000000,
    ))
    db.session.add(Notification(
        id=new_id(),
        user_id=users[0].id,
        type="answer",
        title="New answer",
        text="Techie_9012 answered a doubt on Linked Lists.",
        link="doubt.html",
        created_at=now_ms() - 7200000,
    ))
    db.session.commit()


application = create_app()

if __name__ == "__main__":
    print("StudyConnectNG running at http://localhost:5000")
    print("Demo login: coder@studyconnect.edu / Student@123")
    application.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
