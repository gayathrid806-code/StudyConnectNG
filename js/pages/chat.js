/**
 * Chat Page — conversations and messages via API
 */
document.addEventListener('DOMContentLoaded', async () => {
  const messagesEl = document.getElementById('chatMessages');
  const inputEl = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const emojiBtn = document.getElementById('emojiBtn');
  const emojiPicker = document.getElementById('emojiPicker');
  const listEl = document.getElementById('chatConversations');
  let conversationId = null;

  const emojis = ['😀', '😂', '😍', '👍', '🎉', '🔥', '💡', '📚', '✅', '❤️', '🤔', '👋', '💪', '🙏', '⭐', '📝'];
  if (emojiPicker) {
    emojiPicker.innerHTML = emojis.map(e => `<button type="button" class="emoji-btn">${e}</button>`).join('');
    emojiPicker.addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji-btn')) {
        inputEl.value += e.target.textContent;
        inputEl.focus();
      }
    });
  }
  emojiBtn?.addEventListener('click', () => emojiPicker?.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#emojiBtn') && !e.target.closest('#emojiPicker')) {
      emojiPicker?.classList.remove('open');
    }
  });

  function appendMessage(msg) {
    if (!messagesEl) return;
    const wrap = document.createElement('div');
    wrap.className = `chat-message ${msg.mine ? 'sent' : 'received'}`;
    let inner = '';
    if (msg.type === 'image' && msg.fileUrl) {
      inner = `<img src="${msg.fileUrl}" class="chat-message-image" alt="">`;
    } else if (msg.fileUrl && msg.type === 'file') {
      inner = `<a href="${msg.fileUrl}" target="_blank">📎 ${msg.text || 'File'}</a>`;
    } else if (msg.type === 'voice') {
      inner = `<div class="chat-message-voice">${Icons.mic}<div class="voice-waveform">${Array(12).fill('<span style="height:12px"></span>').join('')}</div>0:05</div>`;
    } else {
      inner = msg.text;
    }
    wrap.innerHTML = `<div class="chat-message-bubble">${inner}</div><span class="chat-message-time">${msg.time || ''}</span>`;
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function loadMessages() {
    if (!conversationId || !messagesEl) return;
    const data = await API.request('/api/conversations/' + conversationId + '/messages');
    messagesEl.innerHTML = '';
    data.messages.forEach(appendMessage);
  }

  async function openUser(username) {
    const data = await API.request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    conversationId = data.conversation.id;
    const student = data.conversation.student;
    document.getElementById('chatHeaderName').textContent = student.username;
    const status = document.getElementById('chatHeaderStatus');
    if (status) {
      status.textContent = student.online ? 'Online' : (student.lastSeen ? 'Last seen recently' : 'Offline');
      status.classList.toggle('offline', !student.online);
    }
    document.querySelectorAll('.chat-conversation').forEach(c => {
      c.classList.toggle('active', c.dataset.name === username);
    });
    await loadMessages();
  }

  async function loadConversations() {
    const data = await API.request('/api/conversations');
    if (!listEl) return;
    if (!data.conversations.length) {
      listEl.innerHTML = '<p class="card-subtitle" style="padding:var(--space-4)">Start a chat from Find Students.</p>';
      return;
    }
    listEl.innerHTML = data.conversations.map(c => `
      <div class="chat-conversation" data-name="${c.student.username}">
        <div class="avatar avatar-md ${c.student.online ? 'avatar-online' : 'avatar-offline'}">${c.student.username.charAt(0)}</div>
        <div class="chat-conversation-info">
          <div class="chat-conversation-name">${c.student.username}</div>
          <div class="chat-conversation-preview">${c.preview}</div>
        </div>
        <div class="chat-conversation-meta">
          <div class="chat-conversation-time">${c.time}</div>
        </div>
      </div>
    `).join('');
    listEl.querySelectorAll('.chat-conversation').forEach(conv => {
      conv.addEventListener('click', () => openUser(conv.dataset.name));
    });
  }

  async function sendPayload(body) {
    if (!conversationId) {
      StudyConnect.toast('Pick a conversation first');
      return;
    }
    const data = await API.request('/api/conversations/' + conversationId + '/messages', { method: 'POST', body });
    appendMessage(data.message);
  }

  sendBtn?.addEventListener('click', async () => {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    const body = new FormData();
    body.append('text', text);
    body.append('type', 'text');
    try { await sendPayload(body); } catch (err) { StudyConnect.toast(err.message); }
  });

  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn?.click();
    }
  });

  document.getElementById('fileUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    body.append('type', 'file');
    try { await sendPayload(body); } catch (err) { StudyConnect.toast(err.message); }
    e.target.value = '';
  });

  document.getElementById('imageUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    body.append('type', 'image');
    try { await sendPayload(body); } catch (err) { StudyConnect.toast(err.message); }
    e.target.value = '';
  });

  document.getElementById('voiceBtn')?.addEventListener('click', async () => {
    const body = new FormData();
    body.append('type', 'voice');
    body.append('text', 'Voice message');
    try { await sendPayload(body); StudyConnect.toast('Voice message sent'); }
    catch (err) { StudyConnect.toast(err.message); }
  });

  document.getElementById('chatSearchToggle')?.addEventListener('click', () => {
    document.getElementById('chatSearchBar')?.classList.toggle('open');
  });

  document.getElementById('messageSearch')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    messagesEl?.querySelectorAll('.chat-message').forEach(msg => {
      msg.style.opacity = query && !msg.textContent.toLowerCase().includes(query) ? '0.3' : '1';
    });
  });

  try {
    await loadConversations();
    const user = new URLSearchParams(location.search).get('user');
    if (user) await openUser(user);
    else {
      const first = document.querySelector('.chat-conversation');
      if (first) await openUser(first.dataset.name);
    }
  } catch (err) {
    StudyConnect.toast(err.message);
  }
});
