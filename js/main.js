/**
 * StudyConnect — Main JavaScript Entry
 * Global initialization, auth forms, and shared event handlers
 */

document.addEventListener('DOMContentLoaded', () => {
  const page = (location.pathname.split('/').pop() || 'index.html');
  const appPages = [
    'dashboard.html', 'search.html', 'chat.html', 'doubt.html', 'ai-assistant.html',
    'notes.html', 'notifications.html', 'profile.html', 'settings.html', 'voice-call.html',
    'profile-setup.html'
  ];
  if (typeof API !== 'undefined' && appPages.includes(page) && !API.token()) {
    location.href = 'login.html';
    return;
  }

  const user = typeof API !== 'undefined' ? API.currentUser() : null;

  const sidebarMount = document.getElementById('sidebarMount');
  if (sidebarMount) {
    sidebarMount.outerHTML = StudyConnect.renderSidebar();
  }

  const headerMount = document.getElementById('headerMount');
  if (headerMount) {
    headerMount.outerHTML = StudyConnect.renderAppHeader(headerMount.dataset.title || 'StudyConnectNG');
  }

  if (user) {
    const nameEl = document.querySelector('.sidebar-user-name');
    const statusEl = document.querySelector('.sidebar-user-status');
    const avatarEl = document.querySelector('.sidebar-user .avatar');
    if (nameEl) nameEl.textContent = user.username || 'Student';
    if (statusEl) statusEl.textContent = [user.branch, user.year].filter(Boolean).join(' · ') || 'Complete your profile';
    if (avatarEl) avatarEl.textContent = (user.username || 'S').charAt(0);
  }

  StudyConnect.initSidebar();

  if (typeof API !== 'undefined' && API.token() && page !== 'voice-call.html' && page !== 'login.html') {
    let incomingShown = null;
    const pollIncoming = async () => {
      try {
        const data = await API.request('/api/calls/incoming');
        const call = data.call;
        if (!call) {
          document.querySelector('.incoming-call-overlay')?.remove();
          incomingShown = null;
          return;
        }
        if (incomingShown === call.id) return;
        incomingShown = call.id;
        const overlay = document.createElement('div');
        overlay.className = 'incoming-call-overlay';
        overlay.innerHTML = `
          <div class="incoming-call-card">
            <p class="incoming-call-label">Incoming voice call</p>
            <div class="voice-call-avatar ringing">${(call.caller.username || 'S').charAt(0)}</div>
            <h2 class="voice-call-name">${call.caller.username}</h2>
            <p class="voice-call-branch">${[call.caller.branch, call.caller.year].filter(Boolean).join(' · ')}</p>
            <div class="incoming-call-actions">
              <button type="button" class="voice-call-btn decline" id="declineCallBtn">Decline</button>
              <button type="button" class="voice-call-btn accept" id="acceptCallBtn">Accept</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#acceptCallBtn').addEventListener('click', () => {
          location.href = 'voice-call.html?call=' + encodeURIComponent(call.id) + '&incoming=1';
        });
        overlay.querySelector('#declineCallBtn').addEventListener('click', async () => {
          try { await API.request('/api/calls/' + call.id + '/reject', { method: 'POST', body: '{}' }); } catch (_) {}
          overlay.remove();
          incomingShown = null;
        });
      } catch (_) {}
    };
    pollIncoming();
    setInterval(pollIncoming, 2000);
  }

  document.addEventListener('click', async (e) => {
    const likeBtn = e.target.closest('.like-btn');
    if (!likeBtn) return;
    const answerId = likeBtn.dataset.answerId;
    if (answerId && typeof API !== 'undefined') {
      e.preventDefault();
      try {
        const data = await API.request('/api/answers/' + answerId + '/like', { method: 'POST' });
        likeBtn.classList.toggle('liked', data.liked);
        likeBtn.dataset.likes = data.likes;
        likeBtn.innerHTML = `${Icons.heart} ${data.likes}`;
      } catch (err) {
        StudyConnect.toast(err.message);
      }
      return;
    }
    likeBtn.classList.toggle('liked');
    let count = parseInt(likeBtn.dataset.likes || '0', 10);
    count = likeBtn.classList.contains('liked') ? count + 1 : count - 1;
    likeBtn.dataset.likes = count;
    likeBtn.innerHTML = `${Icons.heart} ${count}`;
  });

  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputs = form.querySelectorAll('[required]');
      let valid = true;

      inputs.forEach(input => {
        const errorEl = input.parentElement.querySelector('.form-error');
        if (!input.value.trim()) {
          valid = false;
          input.style.borderColor = 'var(--color-error)';
          if (errorEl) errorEl.textContent = 'This field is required';
        } else {
          input.style.borderColor = '';
          if (errorEl) errorEl.textContent = '';
        }
      });

      const pass = form.querySelector('[name="password"]');
      const confirm = form.querySelector('[name="confirmPassword"]');
      if (pass && confirm && pass.value !== confirm.value) {
        valid = false;
        confirm.style.borderColor = 'var(--color-error)';
        const err = confirm.parentElement.querySelector('.form-error');
        if (err) err.textContent = 'Passwords do not match';
      }

      if (!valid) return;

      const authMode = form.dataset.auth;
      if (authMode && typeof API !== 'undefined') {
        const payload = {
          fullName: form.fullName?.value,
          email: form.email?.value,
          password: form.password?.value,
          college: form.college?.value
        };
        try {
          if (authMode === 'forgot') {
            await API.request('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ email: payload.email }) });
            StudyConnect.toast('If that email exists, a reset link would be sent.');
            setTimeout(() => { location.href = 'login.html'; }, 900);
            return;
          }
          const path = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
          const data = await API.request(path, { method: 'POST', body: JSON.stringify(payload) });
          API.setSession(data.token, data.user);
          StudyConnect.toast(authMode === 'register' ? 'Account created' : 'Welcome back');
          const next = authMode === 'register' || !data.user.setupComplete ? 'profile-setup.html' : 'dashboard.html';
          setTimeout(() => { location.href = next; }, 700);
        } catch (err) {
          StudyConnect.toast(err.message);
        }
        return;
      }

      const redirect = form.dataset.redirect;
      if (redirect) {
        StudyConnect.toast('Success!');
        setTimeout(() => { window.location.href = redirect; }, 800);
      }
    });
  });
});
