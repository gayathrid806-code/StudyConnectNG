/**
 * AI Assistant — asks the backend
 */
document.addEventListener('DOMContentLoaded', () => {
  const messagesEl = document.getElementById('aiMessages');
  const inputEl = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSend');
  const welcomeEl = document.getElementById('aiWelcome');

  function addMessage(text, type) {
    if (welcomeEl) welcomeEl.style.display = 'none';
    const msg = document.createElement('div');
    msg.className = `ai-message ${type}`;
    msg.innerHTML = `
      <div class="avatar avatar-sm">${type === 'bot' ? '🤖' : 'SC'}</div>
      <div class="ai-message-bubble">${text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendQuery(text) {
    if (!text.trim()) return;
    addMessage(text, 'user');
    inputEl.value = '';
    try {
      const data = await API.request('/api/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ question: text })
      });
      addMessage(data.answer, 'bot');
    } catch (err) {
      addMessage(err.message, 'bot');
    }
  }

  sendBtn?.addEventListener('click', () => sendQuery(inputEl.value));
  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendQuery(inputEl.value); }
  });
  document.querySelectorAll('.ai-suggestion').forEach(btn => {
    btn.addEventListener('click', () => sendQuery(btn.textContent));
  });
});
