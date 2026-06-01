import request from '../utils/request'

export const getBanners = () => {
  return request({
    url: '/banners',
    method: 'get',
  })
}

export const getCities = (params) => {
  return request({
    url: '/cities',
    method: 'get',
    params,
  })
}

export const getMovies = (params) => {
  return request({
    url: '/movies',
    method: 'get',
    params,
  })
}

export const getMovieDetail = (id) => {
  return request({
    url: `/movies/${id}`,
    method: 'get',
  })
}

export const getMovieCinemas = (id, params) => {
  return request({
    url: `/movies/${id}/cinemas`,
    method: 'get',
    params,
  })
}

export const getCinemas = (params) => {
  return request({
    url: '/cinemas',
    method: 'get',
    params,
  })
}

export const getCinemaDetail = (id) => {
  return request({
    url: `/cinemas/${id}`,
    method: 'get',
  })
}

export const getCinemaMovies = (id, params) => {
  return request({
    url: `/cinemas/${id}/movies`,
    method: 'get',
    params,
  })
}

export const getSchedules = (params) => {
  return request({
    url: '/schedules',
    method: 'get',
    params,
  })
}

export const getScheduleDetail = (id) => {
  return request({
    url: `/schedules/${id}`,
    method: 'get',
  })
}

export const createOrder = (data) => {
  return request({
    url: '/orders',
    method: 'post',
    data,
  })
}

export const getOrders = (params) => {
  return request({
    url: '/orders',
    method: 'get',
    params,
  })
}

export const getOrderDetail = (id) => {
  return request({
    url: `/orders/${id}`,
    method: 'get',
  })
}

export const payOrder = (id) => {
  return request({
    url: `/orders/${id}/pay`,
    method: 'post',
  })
}

export const cancelOrder = (id) => {
  return request({
    url: `/orders/${id}/cancel`,
    method: 'post',
  })
}

export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  })
}

export const register = (data) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data,
  })
}
