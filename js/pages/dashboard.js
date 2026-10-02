/**
 * Dashboard — welcome, doubts, active students, notifications from API
 */
document.addEventListener('DOMContentLoaded', async () => {
  const user = API.currentUser() || {};
  const welcome = document.querySelector('#welcomeCard h2');
  if (welcome) welcome.textContent = `Welcome back, ${user.username || 'Student'}`;

  const icon = (id, svg) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = svg;
  };
  icon('dashSearchIcon', Icons.search);
  icon('qaUsers', Icons.users);
  icon('qaHelp', Icons.help);
  icon('qaBook', Icons.book);
  icon('qaBot', Icons.bot);

  try {
    const [doubtsData, studentsData, notesData] = await Promise.all([
      API.request('/api/doubts'),
      API.request('/api/students?online=online'),
      API.request('/api/notifications')
    ]);

    const doubtsEl = document.getElementById('recentDoubts');
    if (doubtsEl) {
      doubtsEl.innerHTML = (doubtsData.doubts || []).slice(0, 5).map(d => `
        <a href="doubt.html" class="doubt-preview">
          <div class="doubt-preview-content">
            <div class="doubt-preview-subject">${d.subject} · ${d.topic}</div>
            <div class="doubt-preview-question">${d.question}</div>
            <div class="doubt-preview-meta">${d.author} · ${d.time}</div>
          </div>
          <div class="doubt-preview-answers">${Icons.message} ${d.answers}</div>
        </a>
      `).join('') || '<p class="card-subtitle">No doubts yet.</p>';
    }

    const activeEl = document.getElementById('activeStudents');
    if (activeEl) {
      activeEl.innerHTML = (studentsData.students || []).slice(0, 6).map(s => `
        <a href="chat.html?user=${encodeURIComponent(s.username)}" class="active-student">
          <div class="avatar avatar-md ${s.online ? 'avatar-online' : 'avatar-offline'}">${s.username.charAt(0)}</div>
          <div class="active-student-info">
            <div class="active-student-name">${s.username}</div>
            <div class="active-student-branch">${s.branch || ''} · ${s.year || ''}</div>
          </div>
        </a>
      `).join('') || '<p class="card-subtitle">No one is online right now.</p>';
    }

    const preview = document.getElementById('dashNotifications');
    if (preview) {
      preview.innerHTML = (notesData.notifications || []).slice(0, 3).map(n => `
        <a href="${n.link || 'notifications.html'}" class="doubt-preview">
          <div class="avatar avatar-sm">${(n.title || 'N').charAt(0)}</div>
          <div class="doubt-preview-content">
            <div class="doubt-preview-question">${n.title}</div>
            <div class="doubt-preview-meta">${n.time}</div>
          </div>
        </a>
      `).join('') || '<p class="card-subtitle">No notifications.</p>';
    }
  } catch (err) {
    StudyConnect.toast(err.message);
  }

  document.getElementById('dashboardSearch')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      window.location.href = q ? `search.html?q=${encodeURIComponent(q)}` : 'search.html';
    }
  });
});
