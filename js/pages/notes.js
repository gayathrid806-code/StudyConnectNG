/**
 * Notes — one list of all subjects, then topics for the selected subject
 */
document.addEventListener('DOMContentLoaded', () => {
  const subjectList = document.getElementById('subjectList');
  const topicList = document.getElementById('topicList');
  const subjectSearch = document.getElementById('subjectSearch');
  const topicSearch = document.getElementById('topicSearch');
  const subjectCount = document.getElementById('subjectCount');
  const topicCount = document.getElementById('topicCount');
  const topicBoxTitle = document.getElementById('topicBoxTitle');
  const topicActions = document.getElementById('topicActions');
  const uploadBtn = document.getElementById('uploadTopicBtn');
  const uploadFile = document.getElementById('uploadTopicFile');
  const uploadedNotes = document.getElementById('uploadedNotes');

  document.getElementById('subjectSearchIcon').innerHTML = Icons.search;
  document.getElementById('topicSearchIcon').innerHTML = Icons.search;
  if (uploadBtn) uploadBtn.innerHTML = `${Icons.upload} Upload notes for this topic`;

  let selectedSubject = null;
  let selectedTopic = null;

  function noteKey() {
    return `${selectedSubject} — ${selectedTopic}`;
  }

  function fileHref(url) {
    return (API.base || '') + url;
  }

  async function loadUploadedFiles() {
    if (!uploadedNotes) return;
    if (!selectedSubject || !selectedTopic) {
      uploadedNotes.innerHTML = '';
      return;
    }
    uploadedNotes.innerHTML = '<li class="notes-listbox-empty">Loading files...</li>';
    try {
      const data = await API.request('/api/notes');
      const files = (data.notes || []).filter(f => {
        const sub = f.subject || '';
        return sub === noteKey() || (sub.includes(selectedSubject) && sub.includes(selectedTopic));
      });
      if (!files.length) {
        uploadedNotes.innerHTML = '<li class="notes-listbox-empty">No file uploaded for this topic yet. Use Upload, then it will appear here to open.</li>';
        return;
      }
      uploadedNotes.innerHTML = files.map(f => `
        <li class="notes-file-item">
          <div>
            <div class="notes-file-name">${f.originalName || f.title || 'Notes file'}</div>
            <div class="notes-file-meta">${f.author || 'Student'} · ${f.time || ''}</div>
          </div>
          <a class="btn btn-sm btn-primary" href="${fileHref(f.fileUrl)}" target="_blank" rel="noopener">Open</a>
        </li>
      `).join('');
    } catch (err) {
      uploadedNotes.innerHTML = `<li class="notes-listbox-empty">${err.message}</li>`;
    }
  }

  function filteredSubjects() {
    const q = (subjectSearch.value || '').toLowerCase();
    return NotesCurriculum.getAllSubjects().filter(s => s.name.toLowerCase().includes(q));
  }

  function renderSubjects() {
    const subjects = filteredSubjects();
    subjectCount.textContent = subjects.length;
    if (!subjects.length) {
      subjectList.innerHTML = '<li class="notes-listbox-empty">No subjects match your search.</li>';
      return;
    }
    subjectList.innerHTML = subjects.map(s => `
      <li class="notes-listbox-item ${selectedSubject === s.name ? 'selected' : ''}" data-subject="${s.name}" role="option">
        <span class="notes-listbox-name">${s.name}</span>
        <span class="notes-listbox-meta">${s.topics.length} topics</span>
      </li>
    `).join('');
  }

  function renderTopics() {
    if (!selectedSubject) {
      topicBoxTitle.textContent = 'Select a subject';
      topicCount.textContent = '0';
      topicSearch.value = '';
      topicSearch.disabled = true;
      topicActions.hidden = true;
      topicList.innerHTML = '<li class="notes-listbox-empty">Choose a subject from the left list to open its topics.</li>';
      loadUploadedFiles();
      return;
    }

    const subject = NotesCurriculum.getSubjectByName(selectedSubject);
    const q = (topicSearch.value || '').toLowerCase();
    const topics = (subject?.topics || []).filter(t => t.toLowerCase().includes(q));
    topicBoxTitle.textContent = selectedSubject;
    topicCount.textContent = topics.length;
    topicSearch.disabled = false;
    topicActions.hidden = false;

    if (!topics.length) {
      topicList.innerHTML = '<li class="notes-listbox-empty">No topics match your search.</li>';
      loadUploadedFiles();
      return;
    }

    topicList.innerHTML = topics.map(t => `
      <li class="notes-listbox-item ${selectedTopic === t ? 'selected' : ''}" data-topic="${t}" role="option">
        <span class="notes-listbox-name">${t}</span>
      </li>
    `).join('');
    loadUploadedFiles();
  }

  subjectSearch.addEventListener('input', renderSubjects);
  topicSearch.addEventListener('input', renderTopics);

  subjectList.addEventListener('click', (e) => {
    const item = e.target.closest('[data-subject]');
    if (!item) return;
    selectedSubject = item.dataset.subject;
    selectedTopic = null;
    topicSearch.value = '';
    renderSubjects();
    renderTopics();
  });

  topicList.addEventListener('click', (e) => {
    const item = e.target.closest('[data-topic]');
    if (!item) return;
    selectedTopic = item.dataset.topic;
    renderTopics();
  });

  uploadBtn?.addEventListener('click', () => {
    if (!selectedTopic) {
      StudyConnect.toast('Select a topic first');
      return;
    }
    uploadFile.click();
  });

  uploadFile?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedSubject || !selectedTopic) return;
    if (file.size > 100 * 1024 * 1024) {
      StudyConnect.toast('File is too large. Use a PDF under 100 MB.');
      e.target.value = '';
      return;
    }
    const body = new FormData();
    body.append('file', file);
    body.append('course', 'All');
    body.append('branch', 'All');
    body.append('semester', 'All');
    body.append('subject', noteKey());
    try {
      await API.request('/api/notes', { method: 'POST', body });
      StudyConnect.toast('Notes uploaded for ' + selectedTopic);
      await loadUploadedFiles();
    } catch (err) {
      StudyConnect.toast(err.message);
    }
    e.target.value = '';
  });

  renderSubjects();
  renderTopics();
});
