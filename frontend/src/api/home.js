import request from './request'

export const getHomeData = () => {
  return request.get('/home/data')
}

export const getBanners = () => {
  return request.get('/home/banners')
}

export const getCategories = () => {
  return request.get('/home/categories')
}

export const getArticles = (params) => {
  return request.get('/home/articles', { params })
}

export const getArticleDetail = (id) => {
  return request.get(`/home/article/${id}`)
}

export const getStations = (params) => {
  return request.get('/home/stations', { params })
}

export const getStationDetail = (id) => {
  return request.get(`/home/station/${id}`)
}

export const navigate = (data) => {
  return request.post('/home/navigate', data)
}
