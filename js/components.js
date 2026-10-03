/**
 * StudyConnect — Shared UI Components & Utilities
 */

const StudyConnect = {
  /** Navigation items for app sidebar */
  navItems: [
    { href: 'dashboard.html', icon: 'home', label: 'Dashboard' },
    { href: 'search.html', icon: 'users', label: 'Find Students' },
    { href: 'chat.html', icon: 'message', label: 'Messages' },
    { href: 'doubt.html', icon: 'help', label: 'Ask Doubt' },
    { href: 'ai-assistant.html', icon: 'bot', label: 'AI Assistant' },
    { href: 'notes.html', icon: 'book', label: 'Notes' },
    { href: 'complaints.html', icon: 'help', label: 'Complaints' },
    { href: 'notifications.html', icon: 'bell', label: 'Notifications', badge: 3 },
    { href: 'profile.html', icon: 'user', label: 'Profile' },
    { href: 'settings.html', icon: 'settings', label: 'Settings' }
  ],

  /** Get current page filename */
  getCurrentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  },

  /** Render app sidebar */
  renderSidebar(activePage) {
    const page = activePage || this.getCurrentPage();
    const navHtml = this.navItems.map(item => {
      const isActive = page === item.href ? ' active' : '';
      const badge = item.badge ? `<span class="sidebar-nav-badge">${item.badge}</span>` : '';
      return `<a href="${item.href}" class="sidebar-nav-item${isActive}">${Icons[item.icon]}${item.label}${badge}</a>`;
    }).join('');

    return `
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <a href="dashboard.html" class="sidebar-logo">${Icons.logo} StudyConnectNG</a>
        </div>
        <nav class="sidebar-nav">${navHtml}</nav>
        <div class="sidebar-footer">
          <a href="profile.html" class="sidebar-user">
            <div class="avatar avatar-md avatar-online">SC</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">Student_4821</div>
              <div class="sidebar-user-status">CSE · 2nd Year</div>
            </div>
          </a>
        </div>
      </aside>`;
  },

  /** Render app header */
  renderAppHeader(title) {
    return `
      <header class="app-header">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">${Icons.menu}</button>
        <h1 class="app-header-title">${title}</h1>
        <div class="app-header-actions">
          <a href="notifications.html" class="btn btn-icon btn-ghost" aria-label="Notifications">${Icons.bell}</a>
          <a href="ai-assistant.html" class="btn btn-sm btn-accent">${Icons.bot} AI</a>
        </div>
      </header>`;
  },

  /** Render full app layout wrapper */
  renderAppLayout(title, content) {
    return `
      <div class="app-layout">
        ${this.renderSidebar()}
        <div class="app-main">
          ${this.renderAppHeader(title)}
          <main class="app-content">${content}</main>
        </div>
      </div>`;
  },

  /** Initialize sidebar toggle */
  initSidebar() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!toggle || !sidebar) return;

    const open = () => {
      sidebar.classList.add('open');
      overlay?.classList.add('active');
    };

    const close = () => {
      sidebar.classList.remove('open');
      overlay?.classList.remove('active');
    };

    toggle.addEventListener('click', open);
    overlay?.addEventListener('click', close);

    sidebar.querySelectorAll('.sidebar-nav-item').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 1024) close();
      });
    });
  },

  /** Toast notification system */
  toast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /** Dark mode toggle */
  initTheme() {
    const saved = localStorage.getItem('sc-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sc-theme', next);
    return next;
  },

  /** Format relative time */
  timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  },

  /** Generate anonymous username */
  generateUsername() {
    return `Student_${Math.floor(1000 + Math.random() * 9000)}`;
  },

  /** Get subjects from the shared curriculum index */
  getSubjects(course, branch, semester) {
    return SubjectsIndex.getSubjects(course, branch, semester);
  },

  /** Get saved profile subjects or all subjects for the user's semester */
  getProfileSubjects() {
    try {
      const profile = JSON.parse(localStorage.getItem('sc-profile') || '{}');
      if (profile.subjects?.length) return profile.subjects;
      if (profile.course && profile.branch && profile.semester) {
        return SubjectsIndex.getSubjects(profile.course, profile.branch, profile.semester);
      }
    } catch (_) { /* ignore invalid profile */ }
    return [];
  },

  /** Sample student data (demo) */
  sampleStudents: [
    { id: 1, username: 'Coder_2847', course: 'Diploma', branch: 'CSE', year: '2nd Year', college: 'ABC Polytechnic', online: true },
    { id: 2, username: 'Techie_9012', course: 'B.Tech', branch: 'ECE', year: '3rd Year', college: 'XYZ Engineering', online: true },
    { id: 3, username: 'Dev_5634', course: 'Diploma', branch: 'IT', year: '1st Year', college: 'ABC Polytechnic', online: false },
    { id: 4, username: 'Engineer_7721', course: 'B.Tech', branch: 'Mechanical', year: '4th Year', college: 'PQR Institute', online: true },
    { id: 5, username: 'Learner_3390', course: 'Diploma', branch: 'CSE', year: '2nd Year', college: 'ABC Polytechnic', online: false },
    { id: 6, username: 'Scholar_1156', course: 'B.Tech', branch: 'AI & ML', year: '3rd Year', college: 'Tech University', online: true },
    { id: 7, username: 'Builder_4488', course: 'B.Tech', branch: 'Civil', year: '2nd Year', college: 'XYZ Engineering', online: true },
    { id: 8, username: 'Circuit_6677', course: 'Diploma', branch: 'EEE', year: '1st Year', college: 'PQR Institute', online: false }
  ],

  /** Sample doubts data */
  sampleDoubts: [
    {
      id: 1,
      subject: 'Data Structures',
      topic: 'Linked Lists',
      question: 'How do I reverse a singly linked list iteratively?',
      author: 'Student_4821',
      time: '2h ago',
      answers: 3,
      accepted: true,
      answerList: [
        { text: 'Use three pointers: prev, current, and next. Iterate through the list reversing the next pointer of each node.', author: 'Coder_2847', likes: 5, accepted: true },
        { text: 'You can also use recursion — reverse the rest of the list and adjust pointers.', author: 'Techie_9012', likes: 2, accepted: false }
      ]
    },
    {
      id: 2,
      subject: 'Java',
      topic: 'OOP',
      question: 'What is the difference between abstract class and interface in Java?',
      author: 'Dev_5634',
      time: '5h ago',
      answers: 2,
      accepted: false,
      answerList: [
        { text: 'Abstract classes can have both abstract and concrete methods, while interfaces only have abstract methods (before Java 8).', author: 'Scholar_1156', likes: 4, accepted: false }
      ]
    },
    {
      id: 3,
      subject: 'DBMS',
      topic: 'Normalization',
      question: 'Can someone explain 3NF with a simple example?',
      author: 'Learner_3390',
      time: '1d ago',
      answers: 1,
      accepted: false,
      answerList: []
    }
  ],

  /** Render student card */
  renderStudentCard(student) {
    const onlineClass = student.online ? 'avatar-online' : 'avatar-offline';
    const statusText = student.online ? 'Online' : 'Offline';
    return `
      <div class="student-card" data-id="${student.id}">
        <div class="avatar avatar-lg ${onlineClass}">${student.username.charAt(0)}</div>
        <div class="student-card-info">
          <div class="student-card-name">${student.username}</div>
          <div class="student-card-meta">
            <span>${student.branch}</span>
            <span>·</span>
            <span>${student.year}</span>
            <span>·</span>
            <span>${student.college || 'College hidden'}</span>
          </div>
          <div class="student-card-meta" style="margin-top:4px">
            <span class="online-dot ${student.online ? '' : 'offline'}"></span>
            <span>${statusText}</span>
          </div>
        </div>
        <div class="student-card-actions">
          <a href="voice-call.html?user=${student.username}" class="btn btn-sm btn-primary">${Icons.phone} Call</a>
          <a href="chat.html?user=${student.username}" class="btn btn-sm btn-secondary">${Icons.message} Chat</a>
          <button type="button" class="btn btn-sm btn-ghost js-block-student" data-username="${student.username}">Block</button>
          <button type="button" class="btn btn-sm btn-ghost js-report-student" data-username="${student.username}">Report</button>
        </div>
      </div>`;
  },

  /** Render doubt card */
  renderDoubtCard(doubt, showAnswers = false) {
    const answersHtml = showAnswers && doubt.answerList?.length ? `
      <div class="answers-section">
        ${doubt.answerList.sort((a, b) => b.accepted - a.accepted).map(a => `
          <div class="answer-card ${a.accepted ? 'accepted' : ''}">
            <div class="answer-card-header">
              ${a.accepted ? `<span class="answer-accepted-badge">${Icons.check} Accepted Answer</span>` : ''}
            </div>
            <p class="answer-text">${a.text}</p>
            <div class="answer-footer">
              <span class="answer-author">${a.author}</span>
              <button class="like-btn ${a.likes > 3 ? 'liked' : ''}" data-answer-id="${a.id || ''}" data-likes="${a.likes}">${Icons.heart} ${a.likes}</button>
            </div>
          </div>
        `).join('')}
        <div class="answer-form">
          <textarea class="form-textarea" placeholder="Write your answer..." rows="3"></textarea>
          <button class="btn btn-sm btn-primary post-answer-btn">Post Answer</button>
        </div>
      </div>` : '';

    return `
      <article class="doubt-card" data-id="${doubt.id}">
        <div class="doubt-card-header">
          <div class="doubt-card-subject">
            <span class="badge badge-primary">${doubt.subject}</span>
            <span class="doubt-card-topic">${doubt.topic}</span>
          </div>
          <span class="doubt-card-time">${doubt.time}</span>
        </div>
        <p class="doubt-card-question">${doubt.question}</p>
        <div class="doubt-card-author">
          <div class="avatar avatar-sm">${doubt.author.charAt(0)}</div>
          ${doubt.author}
        </div>
        <div class="doubt-card-actions">
          <span class="doubt-card-action">${Icons.message} ${doubt.answers} answers</span>
          <button class="doubt-card-action toggle-answers-btn">${showAnswers ? 'Hide' : 'View'} Answers</button>
        </div>
        ${answersHtml}
      </article>`;
  }
};

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => StudyConnect.initTheme());
