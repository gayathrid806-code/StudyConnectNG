/**
 * Ask Doubt Page — API post, answers, likes
 */
document.addEventListener('DOMContentLoaded', () => {
  const doubtsList = document.getElementById('doubtsList');
  let doubts = [];

  function renderDoubts() {
    if (!doubtsList) return;
    doubtsList.innerHTML = doubts.map(d => StudyConnect.renderDoubtCard(d, true)).join('');
  }

  async function loadDoubts() {
    try {
      const data = await API.request('/api/doubts');
      doubts = data.doubts;
      renderDoubts();
    } catch (err) {
      StudyConnect.toast(err.message);
    }
  }

  document.getElementById('doubtForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const body = new FormData(form);
    try {
      await API.request('/api/doubts', { method: 'POST', body });
      form.reset();
      StudyConnect.toast('Doubt posted successfully!');
      loadDoubts();
    } catch (err) {
      StudyConnect.toast(err.message);
    }
  });

  doubtsList?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.toggle-answers-btn');
    if (btn) {
      const section = btn.closest('.doubt-card').querySelector('.answers-section');
      if (section) {
        const hidden = section.style.display === 'none';
        section.style.display = hidden ? '' : 'none';
        btn.textContent = hidden ? 'Hide Answers' : 'View Answers';
      }
    }

    const postBtn = e.target.closest('.post-answer-btn');
    if (postBtn) {
      const card = postBtn.closest('.doubt-card');
      const textarea = postBtn.previousElementSibling;
      if (!textarea?.value.trim()) return;
      try {
        await API.request('/api/doubts/' + card.dataset.id + '/answers', {
          method: 'POST',
          body: JSON.stringify({ text: textarea.value.trim() })
        });
        textarea.value = '';
        StudyConnect.toast('Answer posted!');
        loadDoubts();
      } catch (err) {
        StudyConnect.toast(err.message);
      }
    }
  });

  loadDoubts();
});
