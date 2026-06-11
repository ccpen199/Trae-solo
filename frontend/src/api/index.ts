import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const stationApi = {
  getAllStations: (city?: string) =>
    api.get('/stations', { params: { city } }).then(r => r.data),
  getStationById: (id: string) =>
    api.get(`/stations/${id}`).then(r => r.data),
  getPilesByStation: (stationId: string) =>
    api.get(`/stations/${stationId}/piles`).then(r => r.data),
  getPileById: (id: string) =>
    api.get(`/piles/${id}`).then(r => r.data),
  getPileByCode: (code: string) =>
    api.get(`/piles/code/${code}`).then(r => r.data),
  getCities: () =>
    api.get('/cities').then(r => r.data),
  getCityStats: () =>
    api.get('/city-stats').then(r => r.data),
};

export const chargingApi = {
  startCharging: (userId: string, pileId: string, vehicleId?: string) =>
    api.post('/charging/start', { userId, pileId, vehicleId }).then(r => r.data),
  stopCharging: (sessionId: string) =>
    api.post(`/charging/stop/${sessionId}`).then(r => r.data),
  getUserSessions: (userId: string) =>
    api.get(`/charging/sessions/user/${userId}`).then(r => r.data),
  getActiveSessions: (userId: string) =>
    api.get(`/charging/sessions/active/${userId}`).then(r => r.data),
  getSession: (id: string) =>
    api.get(`/charging/sessions/${id}`).then(r => r.data),
};

export const userApi = {
  getUser: (id: string) =>
    api.get(`/users/${id}`).then(r => r.data),
  getVehicles: (userId: string) =>
    api.get(`/users/${userId}/vehicles`).then(r => r.data),
  addVehicle: (userId: string, vehicleData: any) =>
    api.post(`/users/${userId}/vehicles`, vehicleData).then(r => r.data),
  getVehicle: (id: string) =>
    api.get(`/vehicles/${id}`).then(r => r.data),
  getVehicleStatus: (id: string) =>
    api.get(`/vehicles/${id}/status`).then(r => r.data),
};

export const workOrderApi = {
  getAllOrders: (params?: { status?: string; stationId?: string }) =>
    api.get('/work-orders', { params }).then(r => r.data),
  createOrder: (data: any) =>
    api.post('/work-orders', data).then(r => r.data),
  assignOrder: (id: string, assignee: string) =>
    api.post(`/work-orders/${id}/assign`, { assignee }).then(r => r.data),
  startOrder: (id: string) =>
    api.post(`/work-orders/${id}/start`).then(r => r.data),
  completeOrder: (id: string) =>
    api.post(`/work-orders/${id}/complete`).then(r => r.data),
  getStats: () =>
    api.get('/work-orders/stats/summary').then(r => r.data),
  autoDispatch: () =>
    api.post('/work-orders/auto-dispatch').then(r => r.data),
};

export const reviewApi = {
  createReview: (data: any) =>
    api.post('/reviews', data).then(r => r.data),
  getStationReviews: (stationId: string) =>
    api.get(`/reviews/station/${stationId}`).then(r => r.data),
  getPendingReviews: () =>
    api.get('/reviews/pending').then(r => r.data),
  approveReview: (id: string) =>
    api.post(`/reviews/${id}/approve`).then(r => r.data),
  rejectReview: (id: string) =>
    api.post(`/reviews/${id}/reject`).then(r => r.data),
  getSentimentStats: (stationId?: string) =>
    api.get('/reviews/sentiment/stats', { params: { stationId } }).then(r => r.data),
  getTrend: (days?: number) =>
    api.get('/reviews/trend', { params: { days } }).then(r => r.data),
};

export const statsApi = {
  getHeatMap: (date?: string) =>
    api.get('/stats/heatmap', { params: { date } }).then(r => r.data),
  getFailureRanking: (limit?: number, byCity?: boolean) =>
    api.get('/stats/failure-ranking', { params: { limit, byCity } }).then(r => r.data),
  getRechargeFunnel: () =>
    api.get('/stats/recharge-funnel').then(r => r.data),
  getDailyStats: (days?: number) =>
    api.get('/stats/daily', { params: { days } }).then(r => r.data),
  getHourly: () =>
    api.get('/stats/hourly').then(r => r.data),
  getNationalReport: () =>
    api.get('/stats/national-report').then(r => r.data),
};

export const settlementApi = {
  getByOperator: (operatorId: string, startDate?: string, endDate?: string) =>
    api.get(`/settlements/operator/${operatorId}`, { params: { startDate, endDate } }).then(r => r.data),
  getSummary: (operatorId: string) =>
    api.get(`/settlements/summary/${operatorId}`).then(r => r.data),
};

export default api;
