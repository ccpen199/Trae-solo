import { http } from '../utils/request'
import type {
  ApiResponse,
  PaginationParams,
  PaginationResult,
  Worker,
  Certificate,
  AttendanceRecord,
  PeerReview,
  WageRelease,
  QualityInspection,
} from '../types'

export interface UpdateWorkerProfileParams {
  gender?: 'male' | 'female'
  age?: number
  work_years?: number
  hometown?: string
  current_location?: string
  primary_skill?: string
  secondary_skills?: string
  daily_wage_expected?: number
  bio?: string
  emergency_contact?: string
  emergency_phone?: string
}

export interface AddCertificateParams {
  certificate_name: string
  certificate_no: string
  issuing_authority: string
  issue_date: string
  expiry_date?: string
  certificate_image_url?: string
}

export interface CheckInData {
  latitude?: number
  longitude?: number
  offline_mode?: number
  notes?: string
}

export interface AttendanceRecordListParams extends PaginationParams {
  job_application_id?: number
  start_date?: string
  end_date?: string
}

export interface CraftsmanScoreDetail {
  craftsman_level: number
  craftsman_score: number
  quality_score: number
  peer_score: number
  attendance_score: number
  next_level_score: number
  level_up_progress: number
}

export interface ScoreHistory {
  id: number
  date: string
  score_type: 'total' | 'quality' | 'peer' | 'attendance'
  before_score: number
  after_score: number
  change_reason: string
  related_type?: string
  related_id?: number
}

export interface PeerReviewWithInfo extends PeerReview {
  reviewer_name?: string
  job_post_title?: string
}

export interface WageListParams extends PaginationParams {
  status?: string
  start_date?: string
  end_date?: string
}

export interface WageStatistics {
  total_income: number
  pending_wages: number
  paid_wages: number
  monthly_income: number
}

export interface PayslipDetail {
  wage_release: WageRelease
  attendance_records: {
    date: string
    work_hours: number
    status: string
    daily_wage: number
    amount: number
  }[]
  deductions: {
    type: string
    amount: number
    description?: string
  }[]
  tax: number
  base_amount: number
  deduction_total: number
  net_amount: number
}

export const workerApi = {
  getProfile(): Promise<ApiResponse<Worker>> {
    return http.get<Worker>('/worker/profile')
  },

  updateProfile(data: UpdateWorkerProfileParams): Promise<ApiResponse<Worker>> {
    return http.put<Worker>('/worker/profile', data)
  },

  addCertificate(data: AddCertificateParams): Promise<ApiResponse<{ certificate_id: number }>> {
    return http.post<{ certificate_id: number }>('/worker/certificates', data)
  },

  getCertificates(params?: PaginationParams): Promise<ApiResponse<PaginationResult<Certificate>>> {
    return http.get<PaginationResult<Certificate>>('/worker/certificates', { params })
  },

  deleteCertificate(id: number): Promise<ApiResponse<null>> {
    return http.delete<null>(`/worker/certificates/${id}`)
  },

  checkIn(appId: number, data: CheckInData): Promise<ApiResponse<AttendanceRecord>> {
    return http.post<AttendanceRecord>(`/worker/attendance/${appId}/check-in`, data)
  },

  checkOut(appId: number, data: CheckInData): Promise<ApiResponse<AttendanceRecord>> {
    return http.post<AttendanceRecord>(`/worker/attendance/${appId}/check-out`, data)
  },

  getAttendanceRecords(params: AttendanceRecordListParams): Promise<ApiResponse<PaginationResult<AttendanceRecord>>> {
    return http.get<PaginationResult<AttendanceRecord>>('/worker/attendance/records', { params })
  },

  getCraftsmanScore(): Promise<ApiResponse<CraftsmanScoreDetail>> {
    return http.get<CraftsmanScoreDetail>('/worker/craftsman/score')
  },

  getScoreHistory(params?: PaginationParams): Promise<ApiResponse<PaginationResult<ScoreHistory>>> {
    return http.get<PaginationResult<ScoreHistory>>('/worker/craftsman/score-history', { params })
  },

  getReviews(params?: PaginationParams): Promise<ApiResponse<PaginationResult<PeerReviewWithInfo>>> {
    return http.get<PaginationResult<PeerReviewWithInfo>>('/worker/reviews', { params })
  },

  submitPeerReview(data: Omit<PeerReview, 'id' | 'reviewer_worker_id' | 'created_at'>): Promise<ApiResponse<{ review_id: number }>> {
    return http.post<{ review_id: number }>('/worker/reviews', data)
  },

  getWageStatistics(): Promise<ApiResponse<WageStatistics>> {
    return http.get<WageStatistics>('/worker/wages/statistics')
  },

  getWages(params?: WageListParams): Promise<ApiResponse<PaginationResult<WageRelease>>> {
    return http.get<PaginationResult<WageRelease>>('/worker/wages', { params })
  },

  getPendingWages(): Promise<ApiResponse<WageRelease[]>> {
    return http.get<WageRelease[]>('/worker/wages/pending')
  },

  getPayslip(wageReleaseId: number): Promise<ApiResponse<PayslipDetail>> {
    return http.get<PayslipDetail>(`/worker/wages/${wageReleaseId}/payslip`)
  },

  getQualityInspections(params?: PaginationParams): Promise<ApiResponse<PaginationResult<QualityInspection>>> {
    return http.get<PaginationResult<QualityInspection>>('/worker/quality-inspections', { params })
  },
}

export default workerApi
