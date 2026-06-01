import api from './index';
import type { UniversityPartner, InternshipCertificate, JobPushRule, PaginatedResponse } from '@/types';

export function getPartners(page = 1, pageSize = 10): Promise<PaginatedResponse<UniversityPartner>> {
  return api.get('/university/partners', { params: { page, pageSize } }).then(res => res.data.data);
}

export function createPartner(data: { university_name: string; contact_name?: string; contact_phone?: string; employment_office_code?: string }): Promise<UniversityPartner> {
  return api.post('/university/partners', data).then(res => res.data.data);
}

export function issueCertificate(data: { worker_id: number; job_id: number; university_partner_id: number; cert_number: string }): Promise<InternshipCertificate> {
  return api.post('/university/certificates', data).then(res => res.data.data);
}

export function getCertificates(): Promise<InternshipCertificate[]> {
  return api.get('/university/certificates').then(res => res.data.data);
}

export function createPushRule(data: { university_partner_id: number; category?: string; keywords?: string[]; target_roles?: string[] }): Promise<JobPushRule> {
  return api.post('/university/push-rules', data).then(res => res.data.data);
}

export function getPushRules(): Promise<JobPushRule[]> {
  return api.get('/university/push-rules').then(res => res.data.data);
}
