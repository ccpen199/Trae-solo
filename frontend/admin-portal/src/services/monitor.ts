import { get, post, put, del } from './request';

export const getServiceList = (params: Record<string, unknown>) =>
  get('/monitor/services', { params });

export const getServiceDetail = (id: string) =>
  get(`/monitor/services/${id}`);

export const getAlertList = (params: Record<string, unknown>) =>
  get('/monitor/alerts', { params });

export const handleAlert = (id: string, data: Record<string, unknown>) =>
  put(`/monitor/alerts/${id}/handle`, data);

export const getSlaList = (params: Record<string, unknown>) =>
  get('/monitor/slas', { params });

export const createSla = (data: Record<string, unknown>) =>
  post('/monitor/slas', data);

export const updateSla = (id: string, data: Record<string, unknown>) =>
  put(`/monitor/slas/${id}`, data);

export const deleteSla = (id: string) =>
  del(`/monitor/slas/${id}`);
