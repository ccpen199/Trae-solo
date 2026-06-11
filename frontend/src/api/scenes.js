import request from './request.js'

export const getScenes = (params) => {
  return request.get('/scenes', { params })
}

export const getScene = (id) => {
  return request.get(`/scenes/${id}`)
}

export const createScene = (data) => {
  return request.post('/scenes', data)
}

export const updateScene = (id, data) => {
  return request.put(`/scenes/${id}`, data)
}

export const deleteScene = (id) => {
  return request.delete(`/scenes/${id}`)
}

export const executeScene = (id) => {
  return request.post(`/scenes/${id}/execute`)
}

export const getSceneActions = (sceneId) => {
  return request.get(`/scenes/${sceneId}/actions`)
}

export const updateSceneActions = (sceneId, actions) => {
  return request.put(`/scenes/${sceneId}/actions`, { actions })
}
