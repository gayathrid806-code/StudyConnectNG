document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('complaintList');
  const blockedEl = document.getElementById('blockedList');
  const titleEl = document.getElementById('listTitle');
  const form = document.getElementById('complaintForm');

  async function loadComplaints() {
    const data = await API.request('/api/complaints');
    if (data.isOwner) titleEl.textContent = 'All complaints (owner view)';
    else titleEl.textContent = 'My complaints';
    if (!data.complaints.length) {
      listEl.innerHTML = '<p class="card-subtitle">No complaints yet.</p>';
      return;
    }
    listEl.innerHTML = data.complaints.map((c) => `
      <article class="notification-item">
        <div>
          <strong>${c.category}</strong>
          ${c.aboutUsername ? ' · about ' + c.aboutUsername : ''}
          ${data.isOwner && c.fromUsername ? ' · from ' + c.fromUsername : ''}
          <div class="card-subtitle">${c.time}</div>
          <p>${c.text}</p>
        </div>
      </article>
    `).join('');
  }

  async function loadBlocked() {
    const data = await API.request('/api/blocks');
    if (!data.blocked.length) {
      blockedEl.innerHTML = '<p class="card-subtitle">You have not blocked anyone.</p>';
      return;
    }
    blockedEl.innerHTML = data.blocked.map((s) => `
      <div class="student-card">
        <div class="student-card-name">${s.username}</div>
        <button type="button" class="btn btn-sm btn-secondary js-unblock" data-username="${s.username}">Unblock</button>
      </div>
    `).join('');
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = document.getElementById('complaintText').value.trim();
    if (!text) return;
    try {
      await API.request('/api/complaints', {
        method: 'POST',
        body: JSON.stringify({
          category: document.getElementById('complaintCategory').value,
          aboutUsername: document.getElementById('complaintAbout').value.trim(),
          text
        })
      });
      document.getElementById('complaintText').value = '';
      StudyConnect.toast('Sent privately. Other students cannot see this.');
      await loadComplaints();
    } catch (err) {
      StudyConnect.toast(err.message);
    }
  });

  blockedEl?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.js-unblock');
    if (!btn) return;
    try {
      await API.request('/api/blocks/' + encodeURIComponent(btn.dataset.username), { method: 'DELETE' });
      StudyConnect.toast('Unblocked');
      await loadBlocked();
    } catch (err) {
      StudyConnect.toast(err.message);
    }
  });

  try {
    await loadComplaints();
    await loadBlocked();
  } catch (err) {
    StudyConnect.toast(err.message);
  }
});
