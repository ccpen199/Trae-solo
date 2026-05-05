import request from './index'

export const getFurnitureList = (params) => {
  return request.get('/furniture', { params })
}

export const getFurnitureDetail = (id) => {
  return request.get(`/furniture/${id}`)
}

export const getFurnitureFilters = () => {
  return request.get('/furniture/filters')
}

export const imageSearch = (formData) => {
  return request.post('/furniture/image-search', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const getAdvertisements = () => {
  return request.get('/advertisements')
}

export const checkHealth = () => {
  return request.get('/health')
}
