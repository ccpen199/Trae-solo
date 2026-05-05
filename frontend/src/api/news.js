import request from '@/utils/request';

export function getNewsList(params) {
  return request({
    url: '/news',
    method: 'get',
    params
  });
}

export function getNewsById(id) {
  return request({
    url: `/news/${id}`,
    method: 'get'
  });
}

export function createNews(data) {
  return request({
    url: '/news',
    method: 'post',
    data
  });
}

export function updateNews(id, data) {
  return request({
    url: `/news/${id}`,
    method: 'put',
    data
  });
}

export function deleteNews(id) {
  return request({
    url: `/news/${id}`,
    method: 'delete'
  });
}

export function publishNews(id) {
  return request({
    url: `/news/${id}/publish`,
    method: 'post'
  });
}

export function addToSections(id, sectionIds) {
  return request({
    url: `/news/${id}/add-to-sections`,
    method: 'post',
    data: { section_ids: sectionIds }
  });
}

export function updateSortOrder(id, sortOrder) {
  return request({
    url: `/news/${id}/sort-order`,
    method: 'put',
    data: { sort_order: sortOrder }
  });
}
