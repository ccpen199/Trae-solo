import request from '../utils/request';

export const getRoutes = (params) => request.get('/transport/routes', { params });
export const getRouteDetail = (id) => request.get(`/transport/routes/${id}`);
export const planRoute = (params) => request.get('/transport/route-planning', { params });
export const getParkingLots = (params) => request.get('/transport/parking-lots', { params });
export const getParkingLotDetail = (id) => request.get(`/transport/parking-lots/${id}`);
export const getIntercityBuses = (params) => request.get('/transport/intercity-buses', { params });
export const bookBusTicket = (data) => request.post('/transport/intercity-buses/book', data);
export const getMyTickets = () => request.get('/transport/my-tickets');
export const getCrowdingPrediction = (routeId) => request.get(`/transport/crowding-prediction/${routeId}`);
