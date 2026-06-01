import request from './index'

export const getStations = (params) => {
  return request.get('/community/stations', { params })
}

export const applyStation = (stationData) => {
  return request.post('/community/stations/register', stationData)
}

export const getStationDetail = (stationId) => {
  return request.get(`/community/stations`, { params: { id: stationId } })
}

export const getPosts = (params) => {
  return request.get('/community/posts', { params })
}

export const createPost = (postData) => {
  return request.post('/community/posts', postData)
}

export const getPostDetail = (postId) => {
  return request.get(`/community/posts`, { params: { id: postId } })
}

export const likePost = (postId) => {
  return request.post(`/community/posts/${postId}/claim`, {})
}

export const commentPost = (postId, content) => {
  return request.post(`/community/posts/${postId}/claim`, { content })
}

export const getRecyclingRecords = (params) => {
  return request.get('/community/recycling', { params })
}

export const submitRecycling = (recyclingData) => {
  return request.post('/community/recycling', recyclingData)
}

export const getRecyclingPoints = () => {
  return request.get('/community/recycling/points')
}

export const getRecyclingItems = () => {
  return request.get('/community/recycling/items')
}
