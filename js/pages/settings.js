/**
 * Settings Page — theme, privacy API, logout
 */
document.addEventListener('DOMContentLoaded', async () => {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const logoutBtn = document.getElementById('logoutBtn');

  if (darkModeToggle) {
    darkModeToggle.checked = document.documentElement.getAttribute('data-theme') === 'dark';
    darkModeToggle.addEventListener('change', () => {
      StudyConnect.toggleTheme();
      StudyConnect.toast(darkModeToggle.checked ? 'Dark mode enabled' : 'Light mode enabled');
    });
  }

  try {
    const data = await API.request('/api/me');
    document.querySelectorAll('.privacy-toggle').forEach(toggle => {
      const key = toggle.dataset.privacy;
      if (key && data.user[key] !== undefined) toggle.checked = !!data.user[key];
    });
  } catch (_) { /* ignore */ }

  document.querySelectorAll('.privacy-toggle').forEach(toggle => {
    toggle.addEventListener('change', async () => {
      const key = toggle.dataset.privacy;
      const label = toggle.closest('.settings-item, .privacy-item')?.querySelector('h4')?.textContent;
      if (!key) {
        StudyConnect.toast(`${label}: ${toggle.checked ? 'On' : 'Off'}`);
        return;
      }
      try {
        const data = await API.request('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({ [key]: toggle.checked })
        });
        API.setSession(API.token(), data.user);
        StudyConnect.toast(`${label}: ${toggle.checked ? 'Hidden' : 'Visible'}`);
      } catch (err) {
        StudyConnect.toast(err.message);
      }
    });
  });

  logoutBtn?.addEventListener('click', async () => {
    try { await API.request('/api/auth/logout', { method: 'POST' }); } catch (_) { /* ignore */ }
    API.clearSession();
    StudyConnect.toast('Logged out successfully');
    setTimeout(() => { window.location.href = 'login.html'; }, 600);
  });
});
