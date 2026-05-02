const API_BASE = '/api/v1';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const api = {
  async request(path, options = {}) {
    const url = API_BASE + path;
    const token = localStorage.getItem('auth_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      method: options.method || 'GET',
      headers,
      credentials: 'include',
      ...options,
    };
    
    if (options.body && config.method !== 'GET') {
      config.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(
          data.message || '请求失败',
          response.status,
          data
        );
      }
      
      if (!data.success) {
        throw new ApiError(
          data.error?.message || data.message || '操作失败',
          response.status,
          data
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('网络请求失败', 0, null);
    }
  },
  
  async get(path, params) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(path + queryString, { method: 'GET' });
  },
  
  async post(path, body) {
    return this.request(path, { method: 'POST', body });
  },
  
  async put(path, body) {
    return this.request(path, { method: 'PUT', body });
  },
  
  async patch(path, body) {
    return this.request(path, { method: 'PATCH', body });
  },
  
  async delete(path) {
    return this.request(path, { method: 'DELETE' });
  },
};

const toast = {
  container: null,
  
  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },
  
  show(message, type = 'info', title = '') {
    if (!this.container) this.init();
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    
    const icons = {
      success: '✅',
      warning: '⚠️',
      danger: '❌',
      info: 'ℹ️',
    };
    
    toastEl.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" type="button">&times;</button>
    `;
    
    this.container.appendChild(toastEl);
    
    const closeBtn = toastEl.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toastEl.remove();
    });
    
    setTimeout(() => {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateX(100%)';
      toastEl.style.transition = 'all 0.3s ease';
      setTimeout(() => toastEl.remove(), 300);
    }, 5000);
  },
  
  success(message, title = '') {
    this.show(message, 'success', title);
  },
  
  warning(message, title = '') {
    this.show(message, 'warning', title);
  },
  
  error(message, title = '') {
    this.show(message, 'danger', title);
  },
  
  info(message, title = '') {
    this.show(message, 'info', title);
  },
};

const utils = {
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },
  
  formatDateTime(date) {
    return this.formatDate(date, 'YYYY-MM-DD HH:mm');
  },
  
  formatCurrency(amount) {
    return '¥' + Number(amount).toFixed(2);
  },
  
  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },
  
  throttle(fn, limit) {
    let inThrottle = false;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
  
  getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },
  
  setQueryParam(name, value) {
    const url = new URL(window.location.href);
    if (value === null || value === undefined) {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, value);
    }
    window.history.pushState({}, '', url.toString());
  },
  
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  
  getRoleName(role) {
    const roles = {
      ADMIN: '管理员',
      TEACHER: '教师',
      STUDENT: '学员',
      PARENT: '家长',
    };
    return roles[role] || role;
  },
  
  getStatusBadge(status) {
    const statusMap = {
      ACTIVE: { class: 'badge-success', text: '正常' },
      INACTIVE: { class: 'badge-secondary', text: '禁用' },
      PENDING: { class: 'badge-warning', text: '待处理' },
      COMPLETED: { class: 'badge-success', text: '已完成' },
      CANCELLED: { class: 'badge-secondary', text: '已取消' },
      DRAFT: { class: 'badge-secondary', text: '草稿' },
      CONFIRMED: { class: 'badge-info', text: '已确认' },
      IN_PROGRESS: { class: 'badge-warning', text: '进行中' },
      FINISHED: { class: 'badge-success', text: '已完成' },
      PRESENT: { class: 'badge-success', text: '出勤' },
      ABSENT: { class: 'badge-danger', text: '缺勤' },
      LATE: { class: 'badge-warning', text: '迟到' },
      LEAVE: { class: 'badge-info', text: '请假' },
    };
    return statusMap[status] || { class: 'badge-secondary', text: status };
  },
};

const modal = {
  create(options) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const sizeClass = {
      sm: 'modal-sm',
      lg: 'modal-lg',
    }[options.size] || '';
    
    overlay.innerHTML = `
      <div class="modal ${sizeClass}">
        <div class="modal-header">
          <h3 class="modal-title">${options.title || ''}</h3>
          <button type="button" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${options.content || ''}
        </div>
        ${options.showFooter !== false ? `
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel">${options.cancelText || '取消'}</button>
          <button type="button" class="btn btn-primary modal-confirm">${options.confirmText || '确定'}</button>
        </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => overlay.classList.add('active'), 10);
    
    const closeModal = () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => overlay.remove(), 300);
    };
    
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    
    const cancelBtn = overlay.querySelector('.modal-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (options.onCancel) options.onCancel();
        closeModal();
      });
    }
    
    const confirmBtn = overlay.querySelector('.modal-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (options.onConfirm) {
          options.onConfirm(overlay, closeModal);
        } else {
          closeModal();
        }
      });
    }
    
    return {
      element: overlay,
      close: closeModal,
      getBody: () => overlay.querySelector('.modal-body'),
    };
  },
  
  confirm(message, title = '确认') {
    return new Promise((resolve) => {
      this.create({
        title,
        content: `<p style="font-size: 14px; line-height: 1.6;">${message}</p>`,
        onConfirm: (_, close) => {
          close();
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  },
  
  alert(message, title = '提示') {
    return new Promise((resolve) => {
      this.create({
        title,
        content: `<p style="font-size: 14px; line-height: 1.6;">${message}</p>`,
        showFooter: true,
        cancelText: '',
        onConfirm: (_, close) => {
          close();
          resolve();
        },
      });
    });
  },
};
