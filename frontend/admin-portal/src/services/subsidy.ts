import { get, post, put, del } from './request';

export const getPolicyList = (params: Record<string, unknown>) =>
  get('/subsidy/policies', { params });

export const createPolicy = (data: Record<string, unknown>) =>
  post('/subsidy/policies', data);

export const updatePolicy = (id: string, data: Record<string, unknown>) =>
  put(`/subsidy/policies/${id}`, data);

export const deletePolicy = (id: string) =>
  del(`/subsidy/policies/${id}`);

export const getGrantList = (params: Record<string, unknown>) =>
  get('/subsidy/grants', { params });

export const createGrant = (data: Record<string, unknown>) =>
  post('/subsidy/grants', data);

export const updateGrant = (id: string, data: Record<string, unknown>) =>
  put(`/subsidy/grants/${id}`, data);

export const getFundTraceList = (params: Record<string, unknown>) =>
  get('/subsidy/fund-traces', { params });

export const getRiskWarningList = (params: Record<string, unknown>) =>
  get('/subsidy/risk-warnings', { params });

export const handleRiskWarning = (id: string, data: Record<string, unknown>) =>
  put(`/subsidy/risk-warnings/${id}/handle`, data);
