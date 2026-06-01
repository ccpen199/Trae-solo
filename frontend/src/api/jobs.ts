import api from './index';
import type { Job, JobApplication, PaginatedResponse } from '@/types';

interface JobFilters {
  category?: string;
  pay_type?: string;
  location?: string;
  safety_level?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function getJobs(filters: JobFilters = {}): Promise<PaginatedResponse<Job>> {
  return api.get('/jobs', { params: filters }).then(res => res.data.data);
}

export function getJob(id: number): Promise<Job> {
  return api.get(`/jobs/${id}`).then(res => res.data.data);
}

export function createJob(data: Record<string, any>): Promise<Job> {
  return api.post('/jobs', data).then(res => res.data.data);
}

export function updateJob(id: number, data: Partial<Job>): Promise<Job> {
  return api.put(`/jobs/${id}`, data).then(res => res.data.data);
}

export function applyJob(id: number, data: { cover_letter?: string }): Promise<JobApplication> {
  return api.post(`/jobs/${id}/apply`, data).then(res => res.data.data);
}

export function getMyApplications(): Promise<(JobApplication & { job: Job })[]> {
  return api.get('/jobs/my-applications').then(res => res.data.data);
}

export function getJobApplications(id: number): Promise<JobApplication[]> {
  return api.get(`/jobs/${id}/applications`).then(res => res.data.data);
}

export function updateApplication(jobId: number, appId: number, data: { status: 'accepted' | 'rejected' }): Promise<JobApplication> {
  return api.put(`/jobs/${jobId}/applications/${appId}`, data).then(res => res.data.data);
}

export function uploadOcrReview(id: number, file: File): Promise<Job> {
  const form = new FormData();
  form.append('license', file);
  return api.post(`/jobs/${id}/review-ocr`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data.data);
}

export function uploadSiteReview(id: number, files: File[]): Promise<Job> {
  const form = new FormData();
  files.forEach((f) => form.append('photos', f));
  return api.post(`/jobs/${id}/review-site`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data.data);
}

export function reviewOcrAdmin(id: number, data: { status: 'passed' | 'failed'; result?: string }): Promise<Job> {
  return api.post(`/jobs/${id}/review-ocr-admin`, data).then(res => res.data.data);
}

export function reviewSiteAdmin(id: number, data: { status: 'passed' | 'failed'; result?: string }): Promise<Job> {
  return api.post(`/jobs/${id}/review-site-admin`, data).then(res => res.data.data);
}

export function reviewJobStatus(id: number, data: { status: 'approved' | 'rejected' | 'closed' }): Promise<Job> {
  return api.post(`/jobs/${id}/review-status`, data).then(res => res.data.data);
}
