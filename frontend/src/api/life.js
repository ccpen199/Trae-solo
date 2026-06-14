import request from '../utils/request';

export const getWeather = (params) => request.get('/life/weather', { params });
export const getPOIs = (params) => request.get('/life/pois', { params });
export const getPOIDetail = (id) => request.get(`/life/pois/${id}`);
export const getDiscountsNearby = (params) => request.get('/life/discounts-nearby', { 
  params,
  skipAuthRedirect: true,
  skipErrorMessage: true
});
export const getRecommendations = () => request.get('/life/recommendations', {
  skipAuthRedirect: true,
  skipErrorMessage: true
});
export const getEvents = () => request.get('/life/events');
