import { get, post, put, del } from './request';

export const getCertificateList = (params: Record<string, unknown>) =>
  get('/certificate/certificates', { params });

export const createCertificate = (data: Record<string, unknown>) =>
  post('/certificate/certificates', data);

export const updateCertificate = (id: string, data: Record<string, unknown>) =>
  put(`/certificate/certificates/${id}`, data);

export const deleteCertificate = (id: string) =>
  del(`/certificate/certificates/${id}`);

export const getTemplateList = (params: Record<string, unknown>) =>
  get('/certificate/templates', { params });

export const createTemplate = (data: Record<string, unknown>) =>
  post('/certificate/templates', data);

export const updateTemplate = (id: string, data: Record<string, unknown>) =>
  put(`/certificate/templates/${id}`, data);

export const deleteTemplate = (id: string) =>
  del(`/certificate/templates/${id}`);
