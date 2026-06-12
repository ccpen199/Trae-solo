import apiClient from './apiClient';
import type { MemberProfile, PointsTransaction, ConsultSession, ConsultMessage } from '@/types/member';
import type { Breed, SymptomNode, DiseaseNode, SymptomCheckRequest, SymptomCheckResult } from '@/types/knowledge';

export const memberService = {
  getMemberProfile: (): Promise<MemberProfile> => {
    return apiClient.get('/member/profile');
  },

  getPointsTransactions: (): Promise<PointsTransaction[]> => {
    return apiClient.get('/member/points/transactions');
  },

  getBenefits: () => {
    return apiClient.get('/member/benefits');
  },
};

export const consultService = {
  getConsults: (): Promise<ConsultSession[]> => {
    return apiClient.get('/consults');
  },

  createConsult: (data: { petId: string; question: string; type: 'text' | 'video'; images?: string[] }): Promise<ConsultSession> => {
    return apiClient.post('/consults', data);
  },

  getMessages: (sessionId: string): Promise<ConsultMessage[]> => {
    return apiClient.get(`/consults/${sessionId}/messages`);
  },

  sendMessage: (sessionId: string, data: { messageType: 'text' | 'image' | 'prescription'; content: string }): Promise<ConsultMessage> => {
    return apiClient.post(`/consults/${sessionId}/messages`, data);
  },
};

export const knowledgeService = {
  getBreeds: (species?: 'dog' | 'cat' | 'rabbit' | 'bird' | 'other'): Promise<Breed[]> => {
    return apiClient.get('/knowledge/breeds', { params: { species } });
  },

  getSymptoms: (): Promise<SymptomNode[]> => {
    return apiClient.get('/knowledge/symptoms');
  },

  getDiseases: (): Promise<DiseaseNode[]> => {
    return apiClient.get('/knowledge/diseases');
  },

  checkSymptoms: (data: SymptomCheckRequest): Promise<SymptomCheckResult> => {
    return apiClient.post('/symptom-check', data);
  },
};

export const storeDashboardService = {
  getDashboardData: (storeId: string) => {
    return apiClient.get('/store/dashboard', { params: { storeId } });
  },

  getReports: (storeId: string, startDate: string, endDate: string) => {
    return apiClient.get('/store/reports', { params: { storeId, startDate, endDate } });
  },
};
