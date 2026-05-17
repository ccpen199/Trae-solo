import request from '@/utils/request'

export const createTopic = (data) => {
  return request({
    url: '/topics',
    method: 'post',
    data
  })
}

export const getTopics = (params) => {
  return request({
    url: '/topics',
    method: 'get',
    params
  })
}

export const getTopicById = (id) => {
  return request({
    url: `/topics/${id}`,
    method: 'get'
  })
}

export const addComment = (data) => {
  return request({
    url: '/topics/comments',
    method: 'post',
    data
  })
}

export const getComments = (params) => {
  return request({
    url: '/topics/comments/list',
    method: 'get',
    params
  })
}

export const searchTopics = (params) => {
  return request({
    url: '/topics/search',
    method: 'get',
    params
  })
}
