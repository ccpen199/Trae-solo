import { get, post, put, del } from '../api';
import type { 
  PaginatedResponse, RiskAlert, SpeechReview, 
  WithdrawReview, GeoFence 
} from '../../../shared/types';

export async function getRiskAlerts(params?: { page?: number; pageSize?: number; level?: string; status?: string }) {
  return get<RiskAlert[]>('/compliance/alerts', params);
}

export async function getSpeechReviews(params?: { page?: number; pageSize?: number; status?: string }) {
  return get<SpeechReview[]>('/compliance/speech', params);
}

export async function detectSensitiveContent(data: { content: string }) {
  return post<{ 
    hasSensitive: boolean; 
    riskLevel: string; 
    matchedWords: string[]; 
    score: number;
    suggestion?: string;
  }>('/compliance/speech/detect', data);
}

export async function updateSpeechReview(id: number, data: { status: string }) {
  return put<{ updated: boolean }>(`/compliance/speech/${id}`, data);
}

export async function getWithdrawReviews(params?: { page?: number; pageSize?: number; status?: string }) {
  return get<WithdrawReview[]>('/compliance/withdraw', params);
}

export async function updateWithdrawReview(id: number, data: { status: string }) {
  return put<{ updated: boolean }>(`/compliance/withdraw/${id}`, data);
}

export async function assessWithdrawRisk(data: { amount: number }) {
  return post<{ 
    riskLevel: string; 
    riskScore: number; 
    needsManualReview: boolean;
    reasons?: string[];
    suggestions?: string[];
  }>('/compliance/withdraw/assess', data);
}

export async function getGeoFences() {
  return get<GeoFence[]>('/compliance/geofence');
}

export async function createGeoFence(data: Omit<GeoFence, 'id'>) {
  return post<{ created: boolean; id: number }>('/compliance/geofence', data);
}

export async function updateGeoFence(id: number, data: Partial<GeoFence>) {
  return put<{ updated: boolean }>(`/compliance/geofence/${id}`, data);
}

export async function deleteGeoFence(id: number) {
  return del<{ deleted: boolean }>(`/compliance/geofence/${id}`);
}

export async function checkGeoFence(data: { lat: number; lng: number }) {
  return post<{ allowed: boolean; violatedFence: string | null }>('/compliance/geofence/check', data);
}
