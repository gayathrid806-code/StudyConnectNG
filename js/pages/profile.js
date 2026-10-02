/**
 * Profile Page — load and save academic details + privacy in SQLite
 */
document.addEventListener('DOMContentLoaded', async () => {
  const camera = document.getElementById('cameraIcon');
  if (camera) camera.innerHTML = Icons.camera;

  let user = API.currentUser() || {};
  try {
    const data = await API.request('/api/me');
    user = data.user;
    API.setSession(API.token(), user);
  } catch (err) {
    StudyConnect.toast(err.message);
  }

  function fill() {
    document.getElementById('profileUsername').textContent = user.username || 'Student';
    document.getElementById('profileMeta').textContent = [user.branch, user.year].filter(Boolean).join(' · ');
    const avatar = document.getElementById('profileAvatar');
    if (user.photoUrl && !user.hidePhoto) {
      avatar.innerHTML = `<img src="${user.photoUrl}" alt="">`;
    } else {
      avatar.textContent = (user.username || 'S').charAt(0);
    }
    document.getElementById('badgeCourse').textContent = user.course || 'Course';
    document.getElementById('badgeBranch').textContent = user.branch || 'Branch';
    document.getElementById('badgeYear').textContent = user.year || 'Year';
    document.getElementById('editUsername').value = user.username || '';
    document.getElementById('editCollege').value = user.college || '';
    if (user.course) document.getElementById('editCourse').value = user.course;
    if (user.branch) document.getElementById('editBranch').value = user.branch;
    if (user.year) document.getElementById('editYear').value = user.year;
    document.querySelectorAll('.privacy-toggle').forEach(toggle => {
      const key = toggle.dataset.privacy;
      if (key && user[key] !== undefined) toggle.checked = !!user[key];
    });
  }
  fill();

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await API.request('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          username: document.getElementById('editUsername').value.trim(),
          college: document.getElementById('editCollege').value.trim(),
          course: document.getElementById('editCourse').value,
          branch: document.getElementById('editBranch').value,
          year: document.getElementById('editYear').value
        })
      });
      API.setSession(API.token(), data.user);
      user = data.user;
      fill();
      StudyConnect.toast('Profile saved');
    } catch (err) {
      StudyConnect.toast(err.message);
    }
  });

  document.getElementById('avatarInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const body = new FormData();
    body.append('photo', file);
    try {
      const data = await API.request('/api/profile/photo', { method: 'POST', body });
      API.setSession(API.token(), data.user);
      user = data.user;
      fill();
      StudyConnect.toast('Photo updated');
    } catch (err) {
      StudyConnect.toast(err.message);
    }
  });

  document.querySelectorAll('.privacy-toggle').forEach(toggle => {
    toggle.addEventListener('change', async () => {
      const key = toggle.dataset.privacy;
      if (!key) return;
      try {
        const data = await API.request('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({ [key]: toggle.checked })
        });
        API.setSession(API.token(), data.user);
        StudyConnect.toast(`${toggle.closest('.privacy-item')?.querySelector('h4')?.textContent}: ${toggle.checked ? 'Hidden' : 'Visible'}`);
      } catch (err) {
        StudyConnect.toast(err.message);
      }
    });
  });
});
