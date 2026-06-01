const BASE = '';

function getHeaders() {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request(method, url, body) {
  const opts = { method, headers: getHeaders() };
  if (body && !(body instanceof FormData)) {
    opts.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    delete opts.headers['Content-Type'];
    opts.body = body;
  }
  const res = await fetch(`${BASE}${url}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败: ${res.status}`);
  return data;
}

export const api = {
  auth: {
    login: (body) => request('POST', '/api/auth/login', body),
    register: (body) => request('POST', '/api/auth/register', body),
    me: () => request('GET', '/api/auth/me'),
  },
  addresses: {
    list: () => request('GET', '/api/addresses'),
    create: (body) => request('POST', '/api/addresses', body),
    update: (id, body) => request('PUT', `/api/addresses/${id}`, body),
    delete: (id) => request('DELETE', `/api/addresses/${id}`),
  },
  workorders: {
    list: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/api/workorders${qs ? '?' + qs : ''}`);
    },
    create: (body) => request('POST', '/api/workorders', body),
    get: (id) => request('GET', `/api/workorders/${id}`),
    update: (id, body) => request('PUT', `/api/workorders/${id}`, body),
    patchStatus: (id, body) => request('PATCH', `/api/workorders/${id}/status`, body),
  },
  dispatch: {
    recommendations: (orderId) => request('GET', `/api/dispatch/recommendations/${orderId}`),
    assign: (body) => request('POST', '/api/dispatch/assign', body),
    pending: () => request('GET', '/api/dispatch/pending'),
    respond: (id, body) => request('PATCH', `/api/dispatch/${id}/respond`, body),
  },
  service: {
    myOrders: () => request('GET', '/api/service/my-orders'),
    accept: (orderId) => request('PATCH', `/api/service/${orderId}/accept`),
    depart: (orderId) => request('PATCH', `/api/service/${orderId}/depart`),
    arrive: (orderId) => request('PATCH', `/api/service/${orderId}/arrive`),
    repair: (orderId, body) => request('PATCH', `/api/service/${orderId}/repair`, body),
    addPart: (orderId, body) => request('POST', `/api/service/${orderId}/parts`, body),
    quote: (orderId, body) => request('POST', `/api/service/${orderId}/quote`, body),
    sign: (orderId, body) => request('POST', `/api/service/${orderId}/sign`, body),
  },
  exceptions: {
    list: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/api/exceptions${qs ? '?' + qs : ''}`);
    },
    create: (body) => request('POST', '/api/exceptions', body),
    handle: (id, body) => request('PATCH', `/api/exceptions/${id}/handle`, body),
  },
  settlements: {
    list: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/api/settlements${qs ? '?' + qs : ''}`);
    },
    generate: (body) => request('POST', '/api/settlements/generate', body),
    report: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/api/settlements/report${qs ? '?' + qs : ''}`);
    },
    confirm: (id, body) => request('PATCH', `/api/settlements/${id}/confirm`, body),
  },
  upload: {
    file: (formData) => request('POST', '/api/upload', formData),
  },
};
