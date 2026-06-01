import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const healthCheck = () => api.get('/health');

export const getMaterials = () => api.get('/materials');
export const createMaterial = (data) => api.post('/materials', data);

export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);

export const getBoms = () => api.get('/boms');
export const getBom = (id) => api.get(`/boms/${id}`);
export const createBom = (data) => api.post('/boms', data);

export const getInventory = () => api.get('/inventory');
export const stockIn = (data) => api.post('/inventory/stock-in', data);
export const stockOut = (data) => api.post('/inventory/stock-out', data);
export const adjustInventory = (data) => api.post('/inventory/adjust', data);
export const getInventoryTransactions = (params) => api.get('/inventory/transactions', { params });

export const getInTransit = () => api.get('/in-transit');
export const createInTransit = (data) => api.post('/in-transit', data);
export const receiveInTransit = (id, data) => api.post(`/in-transit/${id}/receive`, data);

export const getSubstitutes = () => api.get('/substitutes');
export const createSubstitute = (data) => api.post('/substitutes', data);
export const approveSubstitute = (id, data) => api.post(`/substitutes/${id}/approve`, data);

export const getWorkOrders = () => api.get('/work-orders');
export const getWorkOrder = (id) => api.get(`/work-orders/${id}`);
export const createWorkOrder = (data) => api.post('/work-orders', data);
export const checkWorkOrderKitting = (id) => api.post(`/work-orders/${id}/kitting-check`);
export const getWorkOrderKitting = (id) => api.get(`/work-orders/${id}/kitting`);

export const getKittingBoard = (params) => api.get('/kitting-board', { params });

export const getWarehouses = () => api.get('/warehouses');

export const createMaterialIssue = (data) => api.post('/material-issues', data);
export const createMaterialReturn = (data) => api.post('/material-returns', data);

export const getKittingLogs = (workOrderId) => api.get(`/kitting-logs/${workOrderId}`);

export default api;
