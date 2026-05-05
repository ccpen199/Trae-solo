import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthCheck = () => api.get('/health');

export const getIndexStatus = () => api.get('/index/status');

export const generateIndex = (directory) => 
  api.post('/index/generate', { directory });

export const clearIndex = () => api.post('/index/clear');

export const startWatching = (directory) => 
  api.post('/index/watch/start', { directory });

export const stopWatching = () => api.post('/index/watch/stop');

export const search = (query, options = {}) => 
  api.post('/search', {
    query,
    ...options,
  });

export const openFile = (filePath) => 
  api.get('/file/open', {
    params: { path: filePath },
  });

export default api;
