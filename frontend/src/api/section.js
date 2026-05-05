import request from '@/utils/request';

export function getSectionList(params) {
  return request({
    url: '/sections',
    method: 'get',
    params
  });
}

export function getSectionById(id) {
  return request({
    url: `/sections/${id}`,
    method: 'get'
  });
}

export function createSection(data) {
  return request({
    url: '/sections',
    method: 'post',
    data
  });
}

export function updateSection(id, data) {
  return request({
    url: `/sections/${id}`,
    method: 'put',
    data
  });
}

export function deleteSection(id) {
  return request({
    url: `/sections/${id}`,
    method: 'delete'
  });
}

export function previewSection(id) {
  return request({
    url: `/sections/${id}/preview`,
    method: 'post'
  });
}

export function publishSection(id) {
  return request({
    url: `/sections/${id}/publish`,
    method: 'post'
  });
}

export function refreshSectionNews(id) {
  return request({
    url: `/sections/${id}/refresh`,
    method: 'post'
  });
}
