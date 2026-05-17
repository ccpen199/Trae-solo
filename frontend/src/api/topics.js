import request from '../utils/request';

export const getTopics = (params) => {
  return request({
    url: '/topics',
    method: 'get',
    params
  });
};

export const searchTopics = (params) => {
  return request({
    url: '/topics/search',
    method: 'get',
    params
  });
};

export const getTopicDetail = (id) => {
  return request({
    url: `/topics/${id}`,
    method: 'get'
  });
};

export const createTopic = (data) => {
  return request({
    url: '/topics',
    method: 'post',
    data
  });
};

export const updateTopic = (id, data) => {
  return request({
    url: `/topics/${id}`,
    method: 'put',
    data
  });
};

export const deleteTopic = (id) => {
  return request({
    url: `/topics/${id}`,
    method: 'delete'
  });
};

export const followTopic = (id) => {
  return request({
    url: `/topics/${id}/follow`,
    method: 'post'
  });
};

export const getFollowedTopics = (params) => {
  return request({
    url: '/topics/user/followed',
    method: 'get',
    params
  });
};

export const getRecommendTopics = (params) => {
  return request({
    url: '/topics/recommend/list',
    method: 'get',
    params
  });
};
