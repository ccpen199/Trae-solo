import { http } from '../utils/request'
import type { ApiResponse, JobPost, JobApplication, PaginationResult } from '../types'

export interface CreateJobPostParams {
  title: string
  skill_required: string
  workers_needed: number
  start_date: string
  end_date: string
  daily_wage: number
  work_location: string
  latitude?: number
  longitude?: number
  geofence_radius?: number
  accommodation_provided: 0 | 1
  accommodation_detail?: string
  meals_provided: 0 | 1
  meals_detail?: string
  insurance_provided: 0 | 1
  insurance_detail?: string
  work_hours?: string
  description?: string
}

export type UpdateJobPostParams = Partial<CreateJobPostParams>

export interface PayDepositParams {
  payment_method: string
  payment_order_no?: string
}

export interface JobApplicationWithWorker extends JobApplication {
  worker: {
    id: number
    user_id: number
    real_name?: string
    avatar_url?: string
    primary_skill?: string
    craftsman_level: number
    craftsman_score: number
    work_years: number
  }
  job_post: {
    id: number
    title: string
    daily_wage: number
  }
}

export interface MyJobPostsResult extends JobPost {
  application_count: number
  hired_count: number
}

export const jobApi = {
  createJobPost(data: CreateJobPostParams): Promise<ApiResponse<JobPost>> {
    return http.post<JobPost>('/job/posts', data)
  },

  updateJobPost(id: number, data: UpdateJobPostParams): Promise<ApiResponse<JobPost>> {
    return http.put<JobPost>(`/job/posts/${id}`, data)
  },

  getMyJobPosts(
    params?: { status?: string; keyword?: string }
  ): Promise<ApiResponse<PaginationResult<MyJobPostsResult>>> {
    return http.get<PaginationResult<MyJobPostsResult>>('/job/posts/mine', { params })
  },

  getJobPost(id: number): Promise<ApiResponse<JobPost>> {
    return http.get<JobPost>(`/job/posts/${id}`)
  },

  payDeposit(postId: number, data: PayDepositParams): Promise<ApiResponse<{ paid: boolean }>> {
    return http.post<{ paid: boolean }>(`/job/posts/${postId}/deposit`, data)
  },

  getJobApplications(
    postId: number,
    params?: { status?: string }
  ): Promise<ApiResponse<PaginationResult<JobApplicationWithWorker>>> {
    return http.get<PaginationResult<JobApplicationWithWorker>>(`/job/posts/${postId}/applications`, { params })
  },

  reviewApplication(
    appId: number,
    status: 'accepted' | 'rejected'
  ): Promise<ApiResponse<{ application_status: string }>> {
    return http.post<{ application_status: string }>(`/job/applications/${appId}/review`, { status })
  },
}

export default jobApi
