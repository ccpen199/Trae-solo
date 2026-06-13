import http from './index';
import type {
  CertificationStartResponse,
  LivenessSubmitRequest,
  FaceMatchRequest,
  CertificationResultResponse,
  CertificationHistoryItem,
  PaginatedResponse,
} from '@shared/types/certification';

export const certificationApi = {
  startCertification(): Promise<CertificationStartResponse> {
    return http.post('/certification/start');
  },

  submitLiveness(data: LivenessSubmitRequest): Promise<{ success: boolean }> {
    return http.post('/certification/liveness', data);
  },

  faceMatch(data: FaceMatchRequest): Promise<{ matchScore: number }> {
    return http.post('/certification/face-match', data);
  },

  getResult(sessionId: string): Promise<CertificationResultResponse> {
    return http.get(`/certification/result/${sessionId}`);
  },

  getHistory(
    page: number = 1,
    size: number = 10
  ): Promise<PaginatedResponse<CertificationHistoryItem>> {
    return http.get('/certification/history', { params: { page, size } });
  },
};
