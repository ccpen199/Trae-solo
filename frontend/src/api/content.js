import request from './index'

export const getArticleList = (params) => {
  return request.get('/content/articles', { params })
}

export const getArticleDetail = (id) => {
  return request.get(`/content/articles/${id}`)
}

export const getComments = (targetType, targetId, params) => {
  return request.get(`/content/comments/${targetType}/${targetId}`, { params })
}

export const addComment = (data) => {
  return request.post('/content/comments', data)
}
