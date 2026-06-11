import request from './request';

export const getNewsList = (params) => {
  return request.get('/news', { params });
};

export const getNewsDetail = (id) => {
  return request.get(`/news/${id}`);
};

export const getFaqList = (params) => {
  return request.get('/news/faq/list', { params });
};

export const viewFaq = (id) => {
  return request.post(`/news/faq/${id}/view`, {}, { loading: false });
};
