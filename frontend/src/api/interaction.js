import request from './index'

export const toggleFavorite = (targetType, targetId) => {
  return request.post('/interaction/favorites', {
    target_type: targetType,
    target_id: targetId
  })
}

export const getFavorites = (params) => {
  return request.get('/interaction/favorites', { params })
}

export const toggleFollow = (followingId) => {
  return request.post('/interaction/follows', {
    following_id: followingId
  })
}

export const getMessages = (params) => {
  return request.get('/interaction/messages', { params })
}

export const sendMessage = (data) => {
  return request.post('/interaction/messages', data)
}

export const getQuestions = (params) => {
  return request.get('/interaction/questions', { params })
}

export const getQuestionDetail = (id) => {
  return request.get(`/interaction/questions/${id}`)
}

export const createQuestion = (data) => {
  return request.post('/interaction/questions', data)
}

export const createAnswer = (data) => {
  return request.post('/interaction/answers', data)
}
