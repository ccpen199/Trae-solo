import request from '../utils/request';

export const getMyPoints = () => request.get('/points/my-points', {
  skipAuthRedirect: true,
  skipErrorMessage: true
});
export const getPointHistory = (params) => request.get('/points/history', { 
  params,
  skipAuthRedirect: true,
  skipErrorMessage: true
});
export const getPointProducts = (params) => request.get('/points/products', { params });
export const exchangeProduct = (id, data) => request.post(`/points/products/${id}/exchange`, data);
export const getPointOrders = () => request.get('/points/my-orders', {
  skipAuthRedirect: true,
  skipErrorMessage: true
});
export const getLevelBenefits = () => request.get('/points/level-benefits');
