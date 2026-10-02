/**
 * StudyConnect API client
 * Works when the site is served by `npm start` (same origin).
 */
const API = {
  base: location.protocol === 'file:' ? 'http://127.0.0.1:5000' : location.origin,

  token() {
    return localStorage.getItem('sc-token');
  },

  setSession(token, user) {
    if (token) localStorage.setItem('sc-token', token);
    if (user) localStorage.setItem('sc-user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('sc-token');
    localStorage.removeItem('sc-user');
    localStorage.removeItem('sc-profile');
  },

  currentUser() {
    try {
      return JSON.parse(localStorage.getItem('sc-user') || 'null');
    } catch {
      return null;
    }
  },

  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.token();
    if (token) headers.Authorization = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(this.base + path, { ...options, headers });
    } catch {
      throw new Error('Upload or request failed. Try a smaller file, wait a few seconds, then try again.');
    }

    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      this.clearSession();
      if (!/login\.html$/.test(location.pathname)) location.href = 'login.html';
    }
    if (res.status === 413) throw new Error('File is too large. Please upload a smaller PDF (under 100 MB).');
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
};