/**
 * Landing Page — FAQ accordion, navbar, and clickable subjects index
 */
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  const mobileToggle = document.getElementById('navbarMobileToggle');
  const mobileMenu = document.getElementById('navbarMobileMenu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  initSubjectsIndex();
});

function initSubjectsIndex() {
  const grid = document.getElementById('subjectsIndexGrid');
  if (!grid || typeof SubjectsIndex === 'undefined') return;

  let path = [];

  function renderNav() {
    const labels = ['Courses', ...path];
    return `<nav class="subjects-index-nav">${labels.map((label, i) => {
      if (i === labels.length - 1) return `<strong>${label}</strong>`;
      return `<a data-level="${i - 1}">${label}</a><span>/</span>`;
    }).join('')}</nav>`;
  }

  function bindNav() {
    grid.querySelectorAll('.subjects-index-nav a').forEach(a => {
      a.addEventListener('click', () => {
        const level = parseInt(a.dataset.level, 10);
        path = level < 0 ? [] : path.slice(0, level + 1);
        render();
      });
    });
  }

  function bindCards() {
    grid.querySelectorAll('[data-value]').forEach(card => {
      card.addEventListener('click', () => {
        path.push(card.dataset.value);
        render();
        document.getElementById('subjects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function render() {
    if (path.length === 0) {
      grid.innerHTML = SubjectsIndex.getCourses().map(course => {
        const branches = SubjectsIndex.getBranches(course);
        const subjectCount = branches.reduce((total, branch) => {
          return total + SubjectsIndex.getSemesters(course, branch).reduce((semTotal, sem) => {
            return semTotal + SubjectsIndex.getSubjects(course, branch, sem).length;
          }, 0);
        }, 0);
        const branchTags = branches.slice(0, 6).map(b => `<span class="subjects-index-tag">${b}</span>`).join('');
        const more = branches.length > 6 ? `<span class="subjects-index-tag">+${branches.length - 6} more</span>` : '';
        return `
          <div class="subjects-index-card" data-value="${course}">
            <h3>${course}</h3>
            <p>${branches.length} branches · ${subjectCount} subjects · Click to open</p>
            <div class="subjects-index-tags">${branchTags}${more}</div>
          </div>`;
      }).join('');
      bindCards();
      return;
    }

    if (path.length === 1) {
      const course = path[0];
      const branches = SubjectsIndex.getBranches(course);
      grid.innerHTML = renderNav() + `<div class="subjects-index-grid">${branches.map(branch => {
        const semesters = SubjectsIndex.getSemesters(course, branch);
        return `
          <div class="subjects-index-card" data-value="${branch}">
            <h3>${branch}</h3>
            <p>${semesters.length} semesters · Click to view subjects</p>
          </div>`;
      }).join('')}</div>`;
      bindNav();
      bindCards();
      return;
    }

    const [course, branch] = path;
    const semesters = SubjectsIndex.getSemesters(course, branch);
    grid.innerHTML = renderNav() + `<div class="subjects-index-semesters">${semesters.map(sem => {
      const subjects = SubjectsIndex.getSubjects(course, branch, sem);
      const tags = subjects.map(s => `<span class="subjects-index-tag">${s}</span>`).join('');
      return `
        <div class="subjects-index-semester">
          <h4>${sem}</h4>
          <div class="subjects-index-tags">${tags}</div>
        </div>`;
    }).join('')}</div>`;
    bindNav();
  }

  render();
}
