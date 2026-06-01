import api from './index';
import type { Conversation, Message, InterviewAppointment, PaginatedResponse } from '@/types';

export function getConversations(page = 1, pageSize = 20): Promise<PaginatedResponse<Conversation>> {
  return api.get('/chat/conversations', { params: { page, pageSize } }).then(res => res.data.data);
}

export function createConversation(data: { job_id: number; employer_id: number; worker_id: number }): Promise<Conversation> {
  return api.post('/chat/conversations', data).then(res => res.data.data);
}

export function getMessages(convId: number, page = 1, pageSize = 30): Promise<PaginatedResponse<Message>> {
  return api.get(`/chat/conversations/${convId}/messages`, { params: { page, pageSize } }).then(res => res.data.data);
}

export function sendMessage(convId: number, data: { content: string; message_type?: string }): Promise<Message> {
  return api.post(`/chat/conversations/${convId}/messages`, data).then(res => res.data.data);
}

export function markMessageRead(msgId: number): Promise<any> {
  return api.put(`/chat/messages/${msgId}/read`).then(res => res.data.data);
}

export function proposeInterview(convId: number, data: { proposed_time: string; location?: string; notes?: string }): Promise<InterviewAppointment> {
  return api.post(`/chat/conversations/${convId}/interview`, data).then(res => res.data.data);
}

export function getInterviews(convId: number): Promise<InterviewAppointment[]> {
  return api.get(`/chat/conversations/${convId}/interviews`).then(res => res.data.data);
}

export function updateInterview(interviewId: number, data: { status: 'confirmed' | 'cancelled'; confirmed_time?: string }): Promise<InterviewAppointment> {
  return api.put(`/chat/interviews/${interviewId}`, data).then(res => res.data.data);
}
