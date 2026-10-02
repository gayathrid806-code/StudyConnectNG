/**
 * SQLite database for StudyConnect (sql.js — no native compile step).
 * Phone numbers are never stored.
 */
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'studyconnect.db');

let SQL = null;
let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  college TEXT,
  course TEXT,
  branch TEXT,
  year TEXT,
  semester TEXT,
  subjects TEXT DEFAULT '[]',
  hide_name INTEGER DEFAULT 1,
  hide_email INTEGER DEFAULT 1,
  hide_college INTEGER DEFAULT 0,
  hide_online INTEGER DEFAULT 0,
  hide_photo INTEGER DEFAULT 1,
  photo_url TEXT,
  online INTEGER DEFAULT 0,
  last_seen INTEGER,
  setup_complete INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS doubts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  image_url TEXT,
  pdf_url TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  doubt_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  text TEXT NOT NULL,
  accepted INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (doubt_id) REFERENCES doubts(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS likes (
  answer_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (answer_id, user_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_a TEXT NOT NULL,
  user_b TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  type TEXT NOT NULL,
  text TEXT,
  file_url TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  course TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT,
  original_name TEXT,
  file_url TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  link TEXT,
  read INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`;

function persist() {
  fs.mkdirSync(dataDir, { recursive: true });
  const bytes = db.export();
  fs.writeFileSync(dbPath, Buffer.from(bytes));
}

function rows(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const out = [];
  while (stmt.step()) out.push(stmt.getAsObject());
  stmt.free();
  return out;
}

function run(sql, params = []) {
  db.run(sql, params);
}

async function init() {
  SQL = await initSqlJs();
  fs.mkdirSync(dataDir, { recursive: true });
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }
  db.run(SCHEMA);
  persist();
  return db;
}

function bool(v) {
  return v ? 1 : 0;
}

function parseSubjects(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function userFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    username: row.username,
    college: row.college || '',
    course: row.course || '',
    branch: row.branch || '',
    year: row.year || '',
    semester: row.semester || '',
    subjects: parseSubjects(row.subjects),
    hideName: !!row.hide_name,
    hideEmail: !!row.hide_email,
    hideCollege: !!row.hide_college,
    hideOnline: !!row.hide_online,
    hidePhoto: row.hide_photo !== 0,
    photoUrl: row.photo_url,
    online: !!row.online,
    lastSeen: row.last_seen,
    setupComplete: !!row.setup_complete
  };
}

function load() {
  const users = rows('SELECT * FROM users').map(userFromRow);
  const doubts = rows('SELECT * FROM doubts ORDER BY created_at DESC').map((r) => ({
    id: r.id,
    authorId: r.author_id,
    subject: r.subject,
    topic: r.topic,
    question: r.question,
    imageUrl: r.image_url,
    pdfUrl: r.pdf_url,
    createdAt: r.created_at
  }));
  const answers = rows('SELECT * FROM answers').map((r) => ({
    id: r.id,
    doubtId: r.doubt_id,
    authorId: r.author_id,
    text: r.text,
    accepted: !!r.accepted,
    createdAt: r.created_at
  }));
  const likes = rows('SELECT * FROM likes').map((r) => ({
    answerId: r.answer_id,
    userId: r.user_id
  }));
  const conversations = rows('SELECT * FROM conversations').map((r) => ({
    id: r.id,
    userIds: [r.user_a, r.user_b]
  }));
  const messages = rows('SELECT * FROM messages ORDER BY created_at ASC').map((r) => ({
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    type: r.type,
    text: r.text,
    fileUrl: r.file_url,
    createdAt: r.created_at
  }));
  const notes = rows('SELECT * FROM notes ORDER BY created_at DESC').map((r) => ({
    id: r.id,
    authorId: r.author_id,
    course: r.course,
    branch: r.branch,
    semester: r.semester,
    subject: r.subject,
    title: r.title,
    originalName: r.original_name,
    fileUrl: r.file_url,
    createdAt: r.created_at
  }));
  const notifications = rows('SELECT * FROM notifications ORDER BY created_at DESC').map((r) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title,
    text: r.text,
    link: r.link,
    read: !!r.read,
    createdAt: r.created_at
  }));
  const friendRequests = rows('SELECT * FROM friend_requests').map((r) => ({
    id: r.id,
    fromId: r.from_id,
    toId: r.to_id,
    createdAt: r.created_at
  }));

  return { users, doubts, answers, likes, conversations, messages, notes, notifications, friendRequests };
}

function save(data) {
  db.run('BEGIN');
  try {
    run('DELETE FROM likes');
    run('DELETE FROM answers');
    run('DELETE FROM doubts');
    run('DELETE FROM messages');
    run('DELETE FROM conversations');
    run('DELETE FROM notes');
    run('DELETE FROM notifications');
    run('DELETE FROM friend_requests');
    run('DELETE FROM users');

    for (const u of data.users || []) {
      run(
        `INSERT INTO users (
          id, full_name, email, password_hash, username, college, course, branch, year, semester,
          subjects, hide_name, hide_email, hide_college, hide_online, hide_photo, photo_url, online, last_seen, setup_complete
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          u.id, u.fullName, u.email, u.passwordHash, u.username, u.college || '',
          u.course || '', u.branch || '', u.year || '', u.semester || '',
          JSON.stringify(u.subjects || []),
          bool(u.hideName), bool(u.hideEmail !== false), bool(u.hideCollege), bool(u.hideOnline),
          bool(u.hidePhoto !== false), u.photoUrl || null, bool(u.online), u.lastSeen || Date.now(),
          bool(u.setupComplete)
        ]
      );
    }

    for (const d of data.doubts || []) {
      run(
        `INSERT INTO doubts (id, author_id, subject, topic, question, image_url, pdf_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.id, d.authorId, d.subject, d.topic, d.question, d.imageUrl || null, d.pdfUrl || null, d.createdAt]
      );
    }

    for (const a of data.answers || []) {
      run(
        `INSERT INTO answers (id, doubt_id, author_id, text, accepted, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [a.id, a.doubtId, a.authorId, a.text, bool(a.accepted), a.createdAt]
      );
    }

    for (const l of data.likes || []) {
      run('INSERT INTO likes (answer_id, user_id) VALUES (?, ?)', [l.answerId, l.userId]);
    }

    for (const c of data.conversations || []) {
      run('INSERT INTO conversations (id, user_a, user_b) VALUES (?, ?, ?)', [c.id, c.userIds[0], c.userIds[1]]);
    }

    for (const m of data.messages || []) {
      run(
        `INSERT INTO messages (id, conversation_id, sender_id, type, text, file_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.conversationId, m.senderId, m.type, m.text || '', m.fileUrl || null, m.createdAt]
      );
    }

    for (const n of data.notes || []) {
      run(
        `INSERT INTO notes (id, author_id, course, branch, semester, subject, title, original_name, file_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [n.id, n.authorId, n.course, n.branch, n.semester, n.subject, n.title || '', n.originalName || '', n.fileUrl, n.createdAt]
      );
    }

    for (const n of data.notifications || []) {
      run(
        `INSERT INTO notifications (id, user_id, type, title, text, link, read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [n.id, n.userId, n.type, n.title, n.text, n.link || '', bool(n.read), n.createdAt]
      );
    }

    for (const f of data.friendRequests || []) {
      run(
        'INSERT INTO friend_requests (id, from_id, to_id, created_at) VALUES (?, ?, ?, ?)',
        [f.id, f.fromId, f.toId, f.createdAt]
      );
    }

    db.run('COMMIT');
    persist();
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

module.exports = { init, load, save, persist, rows };
