/**
 * Notifications — load from SQLite via API
 */
document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('notificationList');
  const icons = { answer: Icons.check, message: Icons.message, friend: Icons.users, ai: Icons.bot };

  async function load() {
    if (!list) return;
    try {
      const data = await API.request('/api/notifications');
      if (!data.notifications.length) {
        list.innerHTML = '<p class="card-subtitle">No notifications yet.</p>';
        return;
      }
      list.innerHTML = data.notifications.map(n => `
        <a href="${n.link || '#'}" class="notification-item ${n.read ? '' : 'unread'}">
          <div class="notification-icon ${n.type}">${icons[n.type] || Icons.bell}</div>
          <div class="notification-content">
            <div class="notification-title">${n.title}</div>
            <p class="notification-text">${n.text}</p>
            <span class="notification-time">${n.time}</span>
          </div>
        </a>
      `).join('');
    } catch (err) {
      StudyConnect.toast(err.message);
    }
  }

  document.getElementById('markAllRead')?.addEventListener('click', async () => {
    try {
      await API.request('/api/notifications/read', { method: 'POST' });
      StudyConnect.toast('All notifications marked as read');
      load();
    } catch (err) {
      StudyConnect.toast(err.message);
    }
  });

  load();
});
