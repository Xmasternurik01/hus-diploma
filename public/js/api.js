/* ─── JKH Digital — Shared API Client ────────────────────────────────────── */
const API = (() => {
  const BASE = '/api/v1';
  const getToken = () => localStorage.getItem('jkh_token');
  const getUser  = () => JSON.parse(localStorage.getItem('jkh_user') || 'null');

  const req = async (method, path, body=null, isForm=false) => {
    const hdrs = isForm
      ? (getToken() ? { Authorization:`Bearer ${getToken()}` } : {})
      : { 'Content-Type':'application/json', ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}) };
    const opts = { method, headers: hdrs };
    if (body) opts.body = isForm ? body : JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (res.status === 401) {
      localStorage.removeItem('jkh_token');
      localStorage.removeItem('jkh_user');
      window.location.href = '/html/login.html';
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Request failed');
    return data;
  };

  return {
    getToken, getUser,
    saveSession(token, user) {
      localStorage.setItem('jkh_token', token);
      localStorage.setItem('jkh_user', JSON.stringify(user));
    },
    logout() {
      localStorage.removeItem('jkh_token');
      localStorage.removeItem('jkh_user');
      window.location.href = '/html/login.html';
    },
    requireAuth() {
      if (!getToken()) window.location.href = '/html/login.html';
    },
    get:    (p)    => req('GET',    p),
    post:   (p, b) => req('POST',   p, b),
    put:    (p, b) => req('PUT',    p, b),
    delete: (p)    => req('DELETE', p),
    upload: (p, f) => req('POST',   p, f, true),
  };
})();

/* ─── UI Helpers ──────────────────────────────────────────────────────────── */
const UI = {
  toast(msg, type='success') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
  },
  openModal(id)  { const el = document.getElementById(id); if (el) el.style.display = 'flex'; },
  closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; },
  /** Показать блок полей карты при method === 'card' */
  syncPayCardFields(methodSelectId = 'payMethod', cardWrapId = 'cardFields') {
    const sel = document.getElementById(methodSelectId);
    const wrap = document.getElementById(cardWrapId);
    if (!sel || !wrap) return;
    wrap.style.display = sel.value === 'card' ? 'block' : 'none';
  },
  /** Имя на карте: только латиница и знаки как на карте, всегда UPPERCASE */
  bindCardHolderUppercase(inputId = 'payCardHolder') {
    const el = document.getElementById(inputId);
    if (!el) return;
    const norm = () => {
      el.value = el.value.replace(/[^a-zA-Z\s\-.']/g, '').toUpperCase();
    };
    el.addEventListener('input', norm);
    el.addEventListener('blur', norm);
  },
  setLoading(el, on) {
    if (!el) return;
    if (on)  { el.dataset.orig = el.textContent; el.disabled = true;  el.textContent = '⏳ Загрузка...'; }
    else     { el.disabled = false; el.textContent = el.dataset.orig || el.textContent; }
  },
  formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' });
  },
  formatMoney(n) { return Number(n || 0).toLocaleString('ru-RU') + ' ₸'; },
  /** Для value/title в разметке */
  escapeAttr(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/\n/g, ' ');
  },
  /** Подпись счёта в select: 2 строки (услуга / период · сумма) + полный текст в title */
  billSelectOptionHtml(b, getServiceLabel) {
    const label =
      typeof getServiceLabel === 'function'
        ? (getServiceLabel(b.service) || b.service)
        : b.service;
    const money = UI.formatMoney(b.amount);
    const full = `${label} — ${b.period} (${money})`;
    const line2 = `${b.period} · ${money}`;
    const escText = (t) =>
      String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const vid = UI.escapeAttr(b.id);
    const vamt = UI.escapeAttr(String(b.amount));
    const ttitle = UI.escapeAttr(full);
    return `<option value="${vid}" data-amount="${vamt}" title="${ttitle}">${escText(label)}\n${escText(line2)}</option>`;
  },
  statusLabel(s) {
    const m = {
      new:        ['Новая',      'new'],   in_progress:['В работе',    'work'],
      resolved:   ['Выполнено',  'done'],  archived:   ['Архив',        'done'],
      rejected:   ['Отклонено',  'danger'],unpaid:     ['Не оплачено', 'new'],
      paid:       ['Оплачено',   'done'],  overdue:    ['Просрочено',  'danger'],
      accepted:   ['Принято',    'done'],  pending:    ['Ожидает',     'new'],
      flagged:    ['На проверке','work'],  success:    ['Успешно',     'done'],
      failed:     ['Ошибка',     'danger'],
    };
    const [label, cls] = m[s] || [s, ''];
    return `<span class="status ${cls}">${label}</span>`;
  },
  renderSidebarUser() {
    const user = API.getUser();
    const footer = document.querySelector('.sidebar-footer');
    if (footer && user) footer.innerHTML = `<strong>${user.full_name}</strong><br/><span style="opacity:.8">${user.role==='admin'?'Администратор':'Житель'}</span>`;
    const avatar = document.querySelector('.avatar');
    if (avatar && user) avatar.textContent = user.full_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  },
  async renderNotifBadge() {
    try {
      const notifs = await API.get('/notifications?unread_only=true&limit=50');
      const badge = document.querySelector('.badge');
      if (badge) { badge.textContent = notifs.length; badge.style.display = notifs.length ? '' : 'none'; }
      
      // Play sound if there are new unread notifications and sound is enabled
      if (notifs.length > 0) {
        const prefs = await API.get('/notifications/prefs').catch(() => null);
        if (prefs?.sound) {
          UI.playNotificationSound();
        }
      }
    } catch {}
  },
  playNotificationSound() {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      console.error('Notification sound error:', e);
    }
  },
  startNotificationPolling(interval = 30000) {
    // Poll for new notifications every 30 seconds
    if (this.notificationPollingInterval) {
      clearInterval(this.notificationPollingInterval);
    }
    this.notificationPollingInterval = setInterval(() => {
      this.renderNotifBadge();
    }, interval);
  },
  stopNotificationPolling() {
    if (this.notificationPollingInterval) {
      clearInterval(this.notificationPollingInterval);
      this.notificationPollingInterval = null;
    }
  },
  initTheme() {
    const stored = localStorage.getItem('jkh_theme');
    if (stored === 'dark' || stored === 'light') {
      document.body.setAttribute('data-theme', stored);
    } else {
      document.body.removeAttribute('data-theme');
    }
  },
  getThemeMode() {
    const saved = localStorage.getItem('jkh_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  toggleTheme() {
    const current = UI.getThemeMode();
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('jkh_theme', next);
    document.body.setAttribute('data-theme', next);
    UI.updateThemeButton();
  },
  updateThemeButton() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    const mode = UI.getThemeMode();
    btn.textContent = mode === 'dark' ? '☀' : '☾';
    btn.title = mode === 'dark' ? 'Светлая тема' : 'Тёмная тема';
    btn.setAttribute('aria-label', btn.title);
  },
  attachThemeToggle() {
    const topActions = document.querySelector('.top-actions');
    if (!topActions || document.getElementById('themeToggleBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.type = 'button';
    btn.className = 'icon-btn theme-toggle';
    btn.addEventListener('click', UI.toggleTheme);
    topActions.prepend(btn);
    UI.updateThemeButton();
  },
  attachPublicLink() {
    const topActions = document.querySelector('.top-actions');
    if (!topActions || document.getElementById('publicPageBtn')) return;
    const link = document.createElement('a');
    link.id = 'publicPageBtn';
    link.href = '/';
    link.className = 'icon-btn';
    link.title = 'Публичная страница';
    link.setAttribute('aria-label', 'Публичная страница');
    link.textContent = '🏠';
    const logoutBtn = topActions.querySelector('[data-logout]');
    if (logoutBtn) topActions.insertBefore(link, logoutBtn);
    else topActions.appendChild(link);
  },
  attachMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    const topActions = topbar?.querySelector('.top-actions');
    if (!sidebar || !topbar || !topActions || document.getElementById('mobileMenuBtn')) return;

    const menuBtn = document.createElement('button');
    menuBtn.id = 'mobileMenuBtn';
    menuBtn.type = 'button';
    menuBtn.className = 'icon-btn mobile-menu-btn';
    menuBtn.textContent = '☰';
    menuBtn.title = 'Меню';
    menuBtn.setAttribute('aria-label', 'Открыть меню');

    const backdrop = document.createElement('div');
    backdrop.id = 'mobileMenuBackdrop';
    backdrop.className = 'mobile-menu-backdrop';
    document.body.appendChild(backdrop);

    const openMenu = () => document.body.classList.add('mobile-menu-open');
    const closeMenu = () => document.body.classList.remove('mobile-menu-open');
    menuBtn.addEventListener('click', openMenu);
    backdrop.addEventListener('click', closeMenu);
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
    sidebar.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

    topActions.prepend(menuBtn);
  },
  toggleMobileMenu() {
    document.body.classList.toggle('mobile-menu-open');
  }
};

/* ─── Guard + bootstrap ───────────────────────────────────────────────────── */
if (!window.location.pathname.includes('login')) {
  API.requireAuth();
  document.addEventListener('DOMContentLoaded', () => {
    UI.initTheme();
    if (typeof I18N !== 'undefined') I18N.init();
    UI.attachThemeToggle();
    UI.attachPublicLink();
    UI.attachMobileMenu();
    UI.renderSidebarUser();
    UI.renderNotifBadge();
    UI.startNotificationPolling();
    // Notification bell
    const btn = document.getElementById('notifyBtn');
    const panel = document.getElementById('notificationPanel');
    if (btn && panel) {
      btn.addEventListener('click', () => panel.classList.toggle('open'));
      document.addEventListener('click', e => {
        if (!panel.contains(e.target) && !btn.contains(e.target)) panel.classList.remove('open');
      });
    }
    // Logout
    document.querySelectorAll('[data-logout]').forEach(el => el.addEventListener('click', () => API.logout()));
    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
    });
    
    // Stop polling when page is hidden to save resources
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        UI.stopNotificationPolling();
      } else {
        UI.renderNotifBadge();
        UI.startNotificationPolling();
      }
    });
  });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    UI.initTheme();
  });
}

/* ─── Role-based auth guard ───────────────────────────────────────────────── */
API.requireRole = function(...roles) {
  const user = API.getUser();
  if (!user || !API.getToken()) {
    window.location.href = '/html/login.html';
    return false;
  }
  if (!roles.includes(user.role)) {
    // Redirect to their own portal
    const map = {
      admin:            '/html/admin/dashboard.html',
      technician:       '/html/technician/dashboard.html',
      utility_provider: '/html/utility/dashboard.html',
      resident:         '/html/index.html',
    };
    window.location.href = map[user.role] || '/html/login.html';
    return false;
  }
  return true;
};
