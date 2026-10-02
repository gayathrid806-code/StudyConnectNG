/**
 * Student Search — live filters from the Python API
 */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('studentGrid');
  const filters = {
    course: document.getElementById('filterCourse'),
    branch: document.getElementById('filterBranch'),
    year: document.getElementById('filterYear'),
    college: document.getElementById('filterCollege'),
    online: document.getElementById('filterOnline')
  };

  function renderStudents(students) {
    if (!grid) return;
    if (!students.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${Icons.users}</div><h3 class="empty-state-title">No students found</h3><p class="empty-state-text">Try adjusting your filters to find more students.</p></div>`;
      return;
    }
    grid.innerHTML = students.map(s => StudyConnect.renderStudentCard(s)).join('');
  }

  async function applyFilters() {
    const params = new URLSearchParams();
    if (filters.course?.value) params.set('course', filters.course.value);
    if (filters.branch?.value) params.set('branch', filters.branch.value);
    if (filters.year?.value) params.set('year', filters.year.value);
    if (filters.college?.value) params.set('college', filters.college.value);
    if (filters.online?.value) params.set('online', filters.online.value);
    const search = document.getElementById('studentSearch')?.value.trim();
    if (search) params.set('q', search);
    try {
      const data = await API.request('/api/students?' + params.toString());
      renderStudents(data.students);
    } catch (err) {
      StudyConnect.toast(err.message);
      renderStudents(StudyConnect.sampleStudents);
    }
  }

  Object.values(filters).forEach(el => el?.addEventListener('change', applyFilters));
  document.getElementById('studentSearch')?.addEventListener('input', applyFilters);
  document.getElementById('clearFilters')?.addEventListener('click', () => {
    Object.values(filters).forEach(el => { if (el) el.value = ''; });
    if (document.getElementById('studentSearch')) document.getElementById('studentSearch').value = '';
    applyFilters();
  });

  const preset = new URLSearchParams(location.search).get('q');
  if (preset && document.getElementById('studentSearch')) {
    document.getElementById('studentSearch').value = preset;
  }
  applyFilters();
});
