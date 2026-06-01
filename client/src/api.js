const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || '请求失败');
  }
  return json.data;
}

function buildQuery(params) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export const getEntries = (params = {}) => request('/entries' + buildQuery(params));
export const getEntry = (id) => request(`/entries/${id}`);
export const getEntryDetail = (id) => request(`/entries/${id}/detail`);
export const getEntryImpact = (id) => request(`/entries/${id}/impact`);
export const createEntry = (data) => request('/entries', { method: 'POST', body: JSON.stringify(data) });
export const updateEntry = (id, data) => request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEntry = (id, data) => request(`/entries/${id}`, { method: 'DELETE', body: JSON.stringify(data) });
export const verifyEntry = (id, data) => request(`/entries/${id}/verify`, { method: 'PUT', body: JSON.stringify(data) });

export const getInspections = () => request('/inspections');
export const getInspection = (id) => request(`/inspections/${id}`);
export const createInspection = (data) => request('/inspections', { method: 'POST', body: JSON.stringify(data) });
export const updateInspection = (id, data) => request(`/inspections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const updateInspectionFollowUp = (id, data) => request(`/inspections/${id}/follow-up`, { method: 'PUT', body: JSON.stringify(data) });

export const getSlaughterBatches = () => request('/slaughter');
export const getSlaughterBatch = (id) => request(`/slaughter/${id}`);
export const createSlaughterBatch = (data) => request('/slaughter', { method: 'POST', body: JSON.stringify(data) });
export const updateSlaughterBatch = (id, data) => request(`/slaughter/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const reviewSlaughterBatch = (id, data) => request(`/slaughter/${id}/review`, { method: 'PUT', body: JSON.stringify(data) });

export const getCertificates = () => request('/certificates');
export const getCertificate = (id) => request(`/certificates/${id}`);
export const createCertificate = (data) => request('/certificates', { method: 'POST', body: JSON.stringify(data) });

export const getFlows = () => request('/flows');
export const createFlow = (data) => request('/flows', { method: 'POST', body: JSON.stringify(data) });

export const getRecalls = () => request('/recalls');
export const getRecall = (id) => request(`/recalls/${id}`);
export const getRecallScope = (certNo) => request(`/recalls/scope/${certNo}`);
export const createRecall = (data) => request('/recalls', { method: 'POST', body: JSON.stringify(data) });
export const completeRecall = (id) => request(`/recalls/${id}/complete`, { method: 'PUT' });

export const getDashboardStats = () => request('/dashboard/stats');

export const traceCertificate = (certNo) => request(`/certificates/trace/${certNo}`);
