import { get, post, put, del } from './request';

export const getTicketList = (params: Record<string, unknown>) =>
  get('/ticket/tickets', { params });

export const createTicket = (data: Record<string, unknown>) =>
  post('/ticket/tickets', data);

export const updateTicket = (id: string, data: Record<string, unknown>) =>
  put(`/ticket/tickets/${id}`, data);

export const getDispatchRuleList = (params: Record<string, unknown>) =>
  get('/ticket/dispatch-rules', { params });

export const createDispatchRule = (data: Record<string, unknown>) =>
  post('/ticket/dispatch-rules', data);

export const updateDispatchRule = (id: string, data: Record<string, unknown>) =>
  put(`/ticket/dispatch-rules/${id}`, data);

export const deleteDispatchRule = (id: string) =>
  del(`/ticket/dispatch-rules/${id}`);

export const getKnowledgeList = (params: Record<string, unknown>) =>
  get('/ticket/knowledge', { params });

export const createKnowledge = (data: Record<string, unknown>) =>
  post('/ticket/knowledge', data);

export const updateKnowledge = (id: string, data: Record<string, unknown>) =>
  put(`/ticket/knowledge/${id}`, data);

export const deleteKnowledge = (id: string) =>
  del(`/ticket/knowledge/${id}`);
