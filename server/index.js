/**
 * StudyConnect API + static site
 * Run: npm start  then open http://localhost:3000
 */
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const store = require('./store');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'studyconnect-dev-secret-change-me';
const rootDir = path.join(__dirname, '..');
const uploadRoot = path.join(__dirname, 'uploads');

fs.mkdirSync(path.join(uploadRoot, 'chat'), { recursive: true });
fs.mkdirSync(path.join(uploadRoot, 'notes'), { recursive: true });
fs.mkdirSync(path.join(uploadRoot, 'avatars'), { recursive: true });
fs.mkdirSync(path.join(uploadRoot, 'doubts'), { recursive: true });

store.seedIfNeeded();

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(uploadRoot));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const folder = req.uploadFolder || 'chat';
      cb(null, path.join(uploadRoot, folder));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').slice(0, 8);
      cb(null, store.id() + ext);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /image|pdf|audio|octet-stream|msword|officedocument|zip|text/.test(file.mimetype);
    cb(ok ? null : new Error('File type not allowed'), ok);
  }
});

function sign(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const data = store.load();
    const user = data.users.find((u) => u.id === payload.id);
    if (!user) return res.status(401).json({ error: 'Account not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired' });
  }
}

function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function findUser(data, id) {
  return data.users.find((u) => u.id === id);
}

function formatDoubt(data, doubt) {
  const author = findUser(data, doubt.authorId);
  const answers = data.answers
    .filter((a) => a.doubtId === doubt.id)
    .map((a) => {
      const aAuthor = findUser(data, a.authorId);
      const likes = data.likes.filter((l) => l.answerId === a.id).length;
      return {
        id: a.id,
        text: a.text,
        author: aAuthor ? aAuthor.username : 'Student',
        likes,
        accepted: !!a.accepted
      };
    })
    .sort((a, b) => Number(b.accepted) - Number(a.accepted) || b.likes - a.likes);

  return {
    id: doubt.id,
    subject: doubt.subject,
    topic: doubt.topic,
    question: doubt.question,
    imageUrl: doubt.imageUrl,
    pdfUrl: doubt.pdfUrl,
    author: author ? author.username : 'Student',
    time: timeAgo(doubt.createdAt),
    answers: answers.length,
    accepted: answers.some((a) => a.accepted),
    answerList: answers
  };
}

function notify(data, userId, type, title, text, link) {
  data.notifications.unshift({
    id: store.id(),
    userId,
    type,
    title,
    text,
    link,
    read: false,
    createdAt: Date.now()
  });
}

/* ---------- Auth ---------- */
app.post('/api/auth/register', (req, res) => {
  const { fullName, email, password, college } = req.body || {};
  if (!fullName || !email || !password || !college) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const data = store.load();
  if (data.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const user = {
    id: store.id(),
    fullName: String(fullName).trim(),
    email: String(email).trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(String(password), 10),
    username: store.username(),
    college: String(college).trim(),
    course: '',
    branch: '',
    year: '',
    semester: '',
    subjects: [],
    hideName: true,
    hideEmail: true,
    hideCollege: false,
    hideOnline: false,
    hidePhoto: true,
    photoUrl: null,
    online: true,
    lastSeen: Date.now(),
    setupComplete: false
  };
  data.users.push(user);
  store.save(data);
  res.json({ token: sign(user), user: store.publicUser(user, user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const data = store.load();
  const user = data.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(String(password || ''), user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  user.online = true;
  user.lastSeen = Date.now();
  store.save(data);
  res.json({ token: sign(user), user: store.publicUser(user, user) });
});

app.post('/api/auth/forgot', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });
  res.json({ ok: true, message: 'If that email exists, a reset link would be sent. Phone numbers are never used.' });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: store.publicUser(req.user, req.user) });
});

app.post('/api/auth/logout', auth, (req, res) => {
  const data = store.load();
  const user = findUser(data, req.user.id);
  if (user) {
    user.online = false;
    user.lastSeen = Date.now();
    store.save(data);
  }
  res.json({ ok: true });
});

/* ---------- Profile ---------- */
app.put('/api/profile', auth, (req, res) => {
  const body = req.body || {};
  const data = store.load();
  const user = findUser(data, req.user.id);
  const allowed = [
    'username', 'college', 'course', 'branch', 'year', 'semester', 'subjects',
    'hideName', 'hideEmail', 'hideCollege', 'hideOnline', 'hidePhoto', 'setupComplete'
  ];
  allowed.forEach((key) => {
    if (body[key] !== undefined) user[key] = body[key];
  });
  store.save(data);
  res.json({ user: store.publicUser(user, user) });
});

app.post('/api/profile/photo', auth, (req, res, next) => {
  req.uploadFolder = 'avatars';
  next();
}, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
  const data = store.load();
  const user = findUser(data, req.user.id);
  user.photoUrl = '/uploads/avatars/' + req.file.filename;
  store.save(data);
  res.json({ user: store.publicUser(user, user) });
});

/* ---------- Students ---------- */
app.get('/api/students', auth, (req, res) => {
  const { course, branch, year, college, online, q } = req.query;
  const data = store.load();
  let list = data.users.filter((u) => u.id !== req.user.id && u.setupComplete);

  if (course) list = list.filter((u) => u.course === course);
  if (branch) list = list.filter((u) => u.branch === branch);
  if (year) list = list.filter((u) => u.year === year);
  if (college) {
    list = list.filter((u) => !u.hideCollege && (u.college || '').toLowerCase().includes(String(college).toLowerCase()));
  }
  if (online === 'online') list = list.filter((u) => u.online && !u.hideOnline);
  if (online === 'offline') list = list.filter((u) => !u.online || u.hideOnline);
  if (q) {
    const s = String(q).toLowerCase();
    list = list.filter((u) =>
      u.username.toLowerCase().includes(s) ||
      (u.branch || '').toLowerCase().includes(s) ||
      (!u.hideCollege && (u.college || '').toLowerCase().includes(s))
    );
  }

  res.json({ students: list.map((u) => store.publicUser(u)) });
});

app.get('/api/students/:username', auth, (req, res) => {
  const data = store.load();
  const user = data.users.find((u) => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: 'Student not found' });
  res.json({ student: store.publicUser(user) });
});

/* ---------- Doubts ---------- */
app.get('/api/doubts', auth, (req, res) => {
  const data = store.load();
  const doubts = data.doubts
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((d) => formatDoubt(data, d));
  res.json({ doubts });
});

app.post('/api/doubts', auth, (req, res, next) => {
  req.uploadFolder = 'doubts';
  next();
}, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), (req, res) => {
  const subject = req.body.subject;
  const topic = req.body.topic;
  const question = req.body.question;
  if (!subject || !topic || !question) {
    return res.status(400).json({ error: 'Subject, topic, and question are required' });
  }
  const data = store.load();
  const image = req.files?.image?.[0];
  const pdf = req.files?.pdf?.[0];
  const doubt = {
    id: store.id(),
    authorId: req.user.id,
    subject,
    topic,
    question,
    imageUrl: image ? '/uploads/doubts/' + image.filename : null,
    pdfUrl: pdf ? '/uploads/doubts/' + pdf.filename : null,
    createdAt: Date.now()
  };
  data.doubts.unshift(doubt);
  store.save(data);
  res.json({ doubt: formatDoubt(data, doubt) });
});

app.post('/api/doubts/:id/answers', auth, (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Answer cannot be empty' });
  const data = store.load();
  const doubt = data.doubts.find((d) => d.id === req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
  const answer = {
    id: store.id(),
    doubtId: doubt.id,
    authorId: req.user.id,
    text,
    accepted: false,
    createdAt: Date.now()
  };
  data.answers.push(answer);
  if (doubt.authorId !== req.user.id) {
    notify(data, doubt.authorId, 'answer', 'New answer', `${req.user.username} answered your doubt on ${doubt.topic}.`, 'doubt.html');
  }
  store.save(data);
  res.json({ doubt: formatDoubt(data, doubt) });
});

app.post('/api/answers/:id/like', auth, (req, res) => {
  const data = store.load();
  const answer = data.answers.find((a) => a.id === req.params.id);
  if (!answer) return res.status(404).json({ error: 'Answer not found' });
  const existing = data.likes.find((l) => l.answerId === answer.id && l.userId === req.user.id);
  if (existing) {
    data.likes = data.likes.filter((l) => l !== existing);
  } else {
    data.likes.push({ answerId: answer.id, userId: req.user.id });
  }
  store.save(data);
  const likes = data.likes.filter((l) => l.answerId === answer.id).length;
  res.json({ likes, liked: !existing });
});

app.post('/api/answers/:id/accept', auth, (req, res) => {
  const data = store.load();
  const answer = data.answers.find((a) => a.id === req.params.id);
  if (!answer) return res.status(404).json({ error: 'Answer not found' });
  const doubt = data.doubts.find((d) => d.id === answer.doubtId);
  if (!doubt || doubt.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Only the question author can accept an answer' });
  }
  data.answers.forEach((a) => {
    if (a.doubtId === doubt.id) a.accepted = a.id === answer.id;
  });
  store.save(data);
  res.json({ doubt: formatDoubt(data, doubt) });
});

/* ---------- Chat ---------- */
app.get('/api/conversations', auth, (req, res) => {
  const data = store.load();
  const mine = data.conversations.filter((c) => c.userIds.includes(req.user.id));
  const list = mine.map((c) => {
    const otherId = c.userIds.find((id) => id !== req.user.id);
    const other = findUser(data, otherId);
    const msgs = data.messages.filter((m) => m.conversationId === c.id);
    const last = msgs[msgs.length - 1];
    return {
      id: c.id,
      student: store.publicUser(other),
      preview: last ? (last.text || 'Attachment') : 'No messages yet',
      time: last ? timeAgo(last.createdAt) : ''
    };
  });
  res.json({ conversations: list });
});

app.post('/api/conversations', auth, (req, res) => {
  const username = req.body.username;
  const data = store.load();
  const other = data.users.find((u) => u.username === username);
  if (!other) return res.status(404).json({ error: 'Student not found' });
  if (other.id === req.user.id) return res.status(400).json({ error: 'Cannot chat with yourself' });

  let conv = data.conversations.find((c) =>
    c.userIds.includes(req.user.id) && c.userIds.includes(other.id)
  );
  if (!conv) {
    conv = { id: store.id(), userIds: [req.user.id, other.id] };
    data.conversations.push(conv);
    store.save(data);
  }
  res.json({ conversation: { id: conv.id, student: store.publicUser(other) } });
});

app.get('/api/conversations/:id/messages', auth, (req, res) => {
  const data = store.load();
  const conv = data.conversations.find((c) => c.id === req.params.id && c.userIds.includes(req.user.id));
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  const q = String(req.query.q || '').toLowerCase();
  let messages = data.messages.filter((m) => m.conversationId === conv.id);
  if (q) messages = messages.filter((m) => (m.text || '').toLowerCase().includes(q));
  res.json({
    messages: messages.map((m) => ({
      id: m.id,
      mine: m.senderId === req.user.id,
      type: m.type,
      text: m.text,
      fileUrl: m.fileUrl,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }))
  });
});

app.post('/api/conversations/:id/messages', auth, (req, res, next) => {
  req.uploadFolder = 'chat';
  next();
}, upload.single('file'), (req, res) => {
  const data = store.load();
  const conv = data.conversations.find((c) => c.id === req.params.id && c.userIds.includes(req.user.id));
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const type = req.body.type || (req.file ? (req.file.mimetype.startsWith('image/') ? 'image' : 'file') : 'text');
  const text = (req.body.text || '').trim();
  if (!text && !req.file && type !== 'voice') {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const msg = {
    id: store.id(),
    conversationId: conv.id,
    senderId: req.user.id,
    type,
    text: text || (req.file ? req.file.originalname : 'Voice message'),
    fileUrl: req.file ? '/uploads/chat/' + req.file.filename : null,
    createdAt: Date.now()
  };
  data.messages.push(msg);
  const otherId = conv.userIds.find((id) => id !== req.user.id);
  notify(data, otherId, 'message', 'New message', `${req.user.username} sent you a message.`, `chat.html?user=${encodeURIComponent(req.user.username)}`);
  store.save(data);
  res.json({
    message: {
      id: msg.id,
      mine: true,
      type: msg.type,
      text: msg.text,
      fileUrl: msg.fileUrl,
      time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  });
});

/* ---------- Notes ---------- */
app.get('/api/notes', auth, (req, res) => {
  const { course, branch, semester, subject } = req.query;
  const data = store.load();
  let notes = data.notes;
  if (course) notes = notes.filter((n) => n.course === course);
  if (branch) notes = notes.filter((n) => n.branch === branch);
  if (semester) notes = notes.filter((n) => n.semester === semester);
  if (subject) notes = notes.filter((n) => n.subject === subject);
  res.json({
    notes: notes.map((n) => {
      const author = findUser(data, n.authorId);
      return {
        id: n.id,
        title: n.title || n.originalName,
        subject: n.subject,
        fileUrl: n.fileUrl,
        author: author ? author.username : 'Student',
        time: timeAgo(n.createdAt)
      };
    })
  });
});

app.post('/api/notes', auth, (req, res, next) => {
  req.uploadFolder = 'notes';
  next();
}, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please choose a PDF or file' });
  const { course, branch, semester, subject } = req.body;
  if (!course || !branch || !semester || !subject) {
    return res.status(400).json({ error: 'Course, branch, semester, and subject are required' });
  }
  const data = store.load();
  const note = {
    id: store.id(),
    authorId: req.user.id,
    course,
    branch,
    semester,
    subject,
    title: subject,
    originalName: req.file.originalname,
    fileUrl: '/uploads/notes/' + req.file.filename,
    createdAt: Date.now()
  };
  data.notes.push(note);
  store.save(data);
  res.json({ note });
});

/* ---------- Notifications & friends ---------- */
app.get('/api/notifications', auth, (req, res) => {
  const data = store.load();
  const list = data.notifications
    .filter((n) => n.userId === req.user.id)
    .map((n) => ({ ...n, time: timeAgo(n.createdAt) }));
  res.json({ notifications: list });
});

app.post('/api/notifications/read', auth, (req, res) => {
  const data = store.load();
  data.notifications.forEach((n) => {
    if (n.userId === req.user.id) n.read = true;
  });
  store.save(data);
  res.json({ ok: true });
});

app.post('/api/friends/request', auth, (req, res) => {
  const username = req.body.username;
  const data = store.load();
  const other = data.users.find((u) => u.username === username);
  if (!other) return res.status(404).json({ error: 'Student not found' });
  data.friendRequests.push({ id: store.id(), fromId: req.user.id, toId: other.id, createdAt: Date.now() });
  notify(data, other.id, 'friend', 'Friend request', `${req.user.username} wants to connect. No personal contact details are shared.`, 'search.html');
  store.save(data);
  res.json({ ok: true });
});

/* ---------- AI ---------- */
const AI_FALLBACK = {
  pointer: 'Pointers in C are variables that store memory addresses. They allow direct memory manipulation and are essential for dynamic memory allocation, arrays, and function arguments passed by reference.\n\nKey concepts:\n• Declaration: `int *ptr;`\n• Address-of operator: `ptr = &variable;`\n• Dereference: `*ptr = value;`',
  oop: 'Java OOP has four pillars:\n\n1. **Encapsulation** — Bundling data and methods, hiding internal state\n2. **Inheritance** — Child classes inherit from parent (`extends`)\n3. **Polymorphism** — Same interface, different implementations\n4. **Abstraction** — Hiding complexity (`abstract class`, `interface`)',
  normalization: 'Database Normalization reduces redundancy:\n\n• **1NF** — Atomic values, no repeating groups\n• **2NF** — 1NF + no partial dependencies\n• **3NF** — 2NF + no transitive dependencies\n\nExample: Split a table with (StudentID, Name, Course, Instructor) into separate Student and Course tables.'
};

app.post('/api/ai/ask', auth, async (req, res) => {
  const question = (req.body.question || '').trim();
  if (!question) return res.status(400).json({ error: 'Ask an academic question' });

  let answer;
  if (process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are StudyConnectNG AI. Explain Diploma and B.Tech academic topics clearly. Do not ask for personal data or phone numbers.' },
            { role: 'user', content: question }
          ]
        })
      });
      const json = await r.json();
      answer = json.choices?.[0]?.message?.content;
    } catch {
      answer = null;
    }
  }

  if (!answer) {
    const q = question.toLowerCase();
    if (q.includes('pointer')) answer = AI_FALLBACK.pointer;
    else if (q.includes('java') || q.includes('oop')) answer = AI_FALLBACK.oop;
    else if (q.includes('normalization') || q.includes('dbms')) answer = AI_FALLBACK.normalization;
    else answer = 'That is a good academic question. Break it into smaller concepts first. If no classmate can help, try restating the topic (for example: pointers, Java OOP, or DBMS normalization).';
  }

  const data = store.load();
  notify(data, req.user.id, 'ai', 'AI response', 'Your AI assistant finished an explanation.', 'ai-assistant.html');
  store.save(data);
  res.json({ answer });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/server') || req.path === '/package.json' || req.path === '/package-lock.json') {
    return res.status(404).end();
  }
  next();
});
app.use(express.static(rootDir));

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
  next();
});

app.listen(PORT, () => {
  console.log(`StudyConnectNG running at http://localhost:${PORT}`);
  console.log('Demo login: coder@studyconnect.edu / Student@123');
});
