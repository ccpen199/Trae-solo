import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.code === 0) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(msg));
  }
);

export const getBuildings = (params?: Record<string, unknown>) =>
  api.get('/buildings', { params });

export const getBuilding = (id: number) =>
  api.get(`/buildings/${id}`);

export const createBuilding = (data: Record<string, unknown>) =>
  api.post('/buildings', data);

export const updateBuilding = (id: number, data: Record<string, unknown>) =>
  api.put(`/buildings/${id}`, data);

export const getListings = (params?: Record<string, unknown>) =>
  api.get('/listings', { params });

export const getListing = (id: number) =>
  api.get(`/listings/${id}`);

export const getListingDetail = (id: number) =>
  api.get(`/listings/${id}`);

export const createListing = (data: Record<string, unknown>) =>
  api.post('/listings', data);

export const updateListing = (id: number, data: Record<string, unknown>) =>
  api.put(`/listings/${id}`, data);

export const verifyListingProperty = (id: number, data: Record<string, unknown>) =>
  api.post(`/listings/${id}/verify-property`, data);

export const getListingVerifications = (id: number) =>
  api.get(`/listings/${id}/verifications`);

export const getListingAnnotations = (id: number) =>
  api.get(`/listings/${id}/annotations`);

export const createListingAnnotation = (id: number, data: Record<string, unknown>) =>
  api.post(`/listings/${id}/annotations`, data);

export const deleteListingAnnotation = (id: number) =>
  api.delete(`/listings/annotations/${id}`);

export const getListingShares = (id: number) =>
  api.get(`/listings/${id}/shares`);

export const createListingShare = (id: number, data: Record<string, unknown>) =>
  api.post(`/listings/${id}/shares`, data);

export const trackShareView = (code: string) =>
  api.post(`/listings/shares/${code}/view`);

export const getListingDealsHistory = (id: number) =>
  api.get(`/listings/${id}/deals-history`);

export const getNearbyListings = (params: { lat: number; lng: number; radius?: number }) =>
  api.get('/listings/nearby', { params });

export const getAgents = (params?: Record<string, unknown>) =>
  api.get('/agents', { params });

export const getAgent = (id: number) =>
  api.get(`/agents/${id}`);

export const createAgent = (data: Record<string, unknown>) =>
  api.post('/agents', data);

export const updateAgent = (id: number, data: Record<string, unknown>) =>
  api.put(`/agents/${id}`, data);

export const getBuyers = (params?: Record<string, unknown>) =>
  api.get('/buyers', { params });

export const getBuyer = (id: number) =>
  api.get(`/buyers/${id}`);

export const createBuyer = (data: Record<string, unknown>) =>
  api.post('/buyers', data);

export const updateBuyer = (id: number, data: Record<string, unknown>) =>
  api.put(`/buyers/${id}`, data);

export const getReviews = (params?: Record<string, unknown>) =>
  api.get('/reviews', { params });

export const createReview = (data: Record<string, unknown>) =>
  api.post('/reviews', data);

export const getReviewStats = (buildingId: number) =>
  api.get(`/reviews/building/${buildingId}/stats`);

export const checkPurchase = (data: Record<string, unknown>) =>
  api.post('/policy/check-purchase', data);

export const checkSale = (listingId: number) =>
  api.post('/policy/check-sale', { listing_id: listingId });

export const calculateTax = (data: { listing_id: number; buyer_id: number }) =>
  api.post('/policy/tax-calculate', data);

export const getAppointments = (params?: Record<string, unknown>) =>
  api.get('/collaboration/appointments', { params });

export const createAppointment = (data: Record<string, unknown>) =>
  api.post('/collaboration/appointments', data);

export const updateAppointment = (id: number, data: Record<string, unknown>) =>
  api.put(`/collaboration/appointments/${id}`, data);

export const getContracts = (params?: Record<string, unknown>) =>
  api.get('/collaboration/contracts', { params });

export const createContract = (data: Record<string, unknown>) =>
  api.post('/collaboration/contracts', data);

export const updateContract = (id: number, data: Record<string, unknown>) =>
  api.put(`/collaboration/contracts/${id}`, data);

export const signContract = (id: number) =>
  api.put(`/collaboration/contracts/${id}`, { status: '已签署' });

export const getDashboard = () =>
  api.get('/admin/dashboard');

export const getPriceAlerts = (params?: Record<string, unknown>) =>
  api.get('/admin/price-alerts', { params });

export const getSchoolHeat = (params?: Record<string, unknown>) =>
  api.get('/admin/school-heat', { params });

export const getAgentRanking = (params?: Record<string, unknown>) =>
  api.get('/admin/agent-ranking', { params });

export default api;
