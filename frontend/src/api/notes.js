import request from '../utils/request';

export const getNotes = (params) => {
  return request({
    url: '/notes',
    method: 'get',
    params
  });
};

export const getNoteDetail = (id) => {
  return request({
    url: `/notes/${id}`,
    method: 'get'
  });
};

export const createNote = (data) => {
  return request({
    url: '/notes',
    method: 'post',
    data
  });
};

export const likeNote = (id) => {
  return request({
    url: `/notes/${id}/like`,
    method: 'post'
  });
};

export const collectNote = (id) => {
  return request({
    url: `/notes/${id}/collect`,
    method: 'post'
  });
};

export const getNoteComments = (id, params) => {
  return request({
    url: `/notes/${id}/comments`,
    method: 'get',
    params
  });
};

export const addComment = (id, data) => {
  return request({
    url: `/notes/${id}/comments`,
    method: 'post',
    data
  });
};
