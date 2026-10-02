/**
 * Profile Setup — Multi-step wizard (saves to API)
 */
document.addEventListener('DOMContentLoaded', () => {
  const steps = document.querySelectorAll('.setup-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressLines = document.querySelectorAll('.progress-line');
  const btnNext = document.getElementById('setupNext');
  const btnBack = document.getElementById('setupBack');
  const subjectsGrid = document.getElementById('subjectsGrid');
  const subjectsHint = document.getElementById('subjectsHint');
  let currentStep = 0;

  const selections = { course: null, branch: null, year: null, semester: null, subjects: [] };

  function showStep(index) {
    steps.forEach((s, i) => s.classList.toggle('active', i === index));
    progressSteps.forEach((s, i) => {
      s.classList.remove('active', 'completed');
      if (i < index) s.classList.add('completed');
      if (i === index) s.classList.add('active');
    });
    progressLines.forEach((l, i) => l.classList.toggle('completed', i < index));
    btnBack.style.visibility = index === 0 ? 'hidden' : 'visible';
    btnNext.textContent = index === steps.length - 1 ? 'Finish Setup' : 'Continue';
    if (index === 4) renderSubjects();
  }

  function renderSubjects() {
    if (!subjectsGrid) return;
    const subjects = SubjectsIndex.getSubjects(selections.course, selections.branch, selections.semester);
    subjectsHint.style.display = subjects.length ? 'none' : 'block';
    subjectsGrid.innerHTML = subjects.map(subject => `
      <div class="selection-card${selections.subjects.includes(subject) ? ' selected' : ''}" data-value="${subject}">
        <span class="selection-card-label">${subject}</span>
      </div>
    `).join('');
    subjectsGrid.querySelectorAll('.selection-card').forEach(card => {
      card.addEventListener('click', () => {
        const value = card.dataset.value;
        card.classList.toggle('selected');
        if (selections.subjects.includes(value)) {
          selections.subjects = selections.subjects.filter(s => s !== value);
        } else {
          selections.subjects.push(value);
        }
      });
    });
  }

  document.querySelectorAll('.selection-grid:not(#subjectsGrid) .selection-card').forEach(card => {
    card.addEventListener('click', () => {
      const group = card.closest('.selection-grid');
      group.querySelectorAll('.selection-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const field = group.dataset.field;
      if (field) selections[field] = card.dataset.value;
      if (selections.course === 'Diploma') {
        document.querySelectorAll('[data-value="4th Year"]').forEach(el => { el.style.display = 'none'; });
      } else {
        document.querySelectorAll('[data-value="4th Year"]').forEach(el => { el.style.display = ''; });
      }
      if (field === 'course' || field === 'branch' || field === 'semester') selections.subjects = [];
    });
  });

  btnNext?.addEventListener('click', async () => {
    const fields = ['course', 'branch', 'year', 'semester', 'subjects'];
    const field = fields[currentStep];
    if (field === 'subjects') {
      const available = SubjectsIndex.getSubjects(selections.course, selections.branch, selections.semester);
      if (available.length && selections.subjects.length === 0) {
        StudyConnect.toast('Please select at least one subject');
        return;
      }
    } else if (!selections[field]) {
      StudyConnect.toast('Please make a selection');
      return;
    }

    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
      return;
    }

    try {
      const data = await API.request('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...selections, setupComplete: true })
      });
      API.setSession(API.token(), data.user);
      StudyConnect.toast('Profile setup complete!');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } catch (err) {
      StudyConnect.toast(err.message);
    }
  });

  btnBack?.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  });

  showStep(0);
});
