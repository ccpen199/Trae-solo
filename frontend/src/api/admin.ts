import { http } from '../utils/request'
import type {
  ApiResponse,
  PaginationParams,
  PaginationResult,
  RiskAlert,
  AlertType,
  AlertSeverity,
  AlertStatus,
  Worker,
  Enterprise,
  WageRelease,
  WageGuarantee,
  JobPost,
  User,
} from '../types'

export interface DashboardStats {
  total_users: number
  total_workers: number
  total_enterprises: number
  user_growth_rate: number
  ongoing_projects: number
  monthly_wage_total: number
  wage_growth_rate: number
  pending_alerts: number
  avg_craftsman_score: number
  contract_performance_rate: number
  register_trend: Array<{
    date: string
    workers: number
    enterprises: number
  }>
  wage_trend: Array<{
    date: string
    amount: number
  }>
  craftsman_distribution: Array<{
    level: string
    count: number
  }>
  skill_distribution: Array<{
    skill: string
    count: number
  }>
  severity_distribution: Array<{
    severity: AlertSeverity
    count: number
  }>
  latest_alerts: Array<RiskAlert & {
    related_object?: string
  }>
  latest_registrations: Array<{
    id: number
    role: 'worker' | 'enterprise'
    name: string
    phone: string
    created_at: string
    craftsman_level?: number
    credit_score?: number
  }>
}

export interface ScanResult {
  scanned_count: number
  new_alerts: number
  details: Array<{
    type: AlertType
    count: number
  }>
}

export interface MonitorResult {
  monitored_contracts: number
  abnormal_count: number
  anomalies: Array<{
    contract_id: number
    type: string
    description: string
  }>
}

export interface HandleRiskAlertParams {
  status: AlertStatus
  handling_notes: string
}

export interface RiskStatistics {
  total_alerts: number
  by_type: Array<{
    type: AlertType
    count: number
    resolved: number
  }>
  by_severity: Array<{
    severity: AlertSeverity
    count: number
    resolved: number
  }>
  monthly_trend: Array<{
    month: string
    count: number
    resolved: number
  }>
  resolution_rate: number
  avg_resolution_time: number
}

export interface WageReleaseProcessParams {
  release_ids: number[]
}

export interface BatchPayrollParams {
  guarantee_id: number
  worker_ids: number[]
}

export interface WageStatistics {
  total_deposit: number
  total_released: number
  pending_release: number
  frozen_amount: number
  release_trend: Array<{
    date: string
    amount: number
    count: number
  }>
}

export interface Payslip {
  payment_id: number
  release_no: string
  worker_name: string
  worker_id_card: string
  project_name: string
  work_days: number
  daily_wage: number
  base_amount: number
  overtime_days: number
  overtime_amount: number
  bonus: number
  deduction: number
  deduction_detail: string
  insurance_deduction: number
  tax_deduction: number
  final_amount: number
  release_date: string
  bank_name: string
  bank_account_tail: string
  enterprise_name: string
  guarantee_no: string
}

export interface ApproveLicenseParams {
  approved: boolean
  reject_reason?: string
  license_no?: string
  valid_from?: string
  valid_to?: string
}

export interface LicenseApplication {
  id: number
  worker_id: number
  worker_name: string
  worker_phone: string
  license_type: string
  application_data: string
  status: 'pending' | 'approved' | 'rejected'
  license_no?: string
  valid_from?: string
  valid_to?: string
  reject_reason?: string
  reviewed_by?: number
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface LicenseListParams extends PaginationParams {
  status?: 'pending' | 'approved' | 'rejected'
  license_type?: string
}

export interface Invoice {
  id: number
  invoice_no?: string
  enterprise_id: number
  enterprise_name: string
  amount: number
  tax_amount: number
  invoice_type: 'special' | 'normal' | 'electronic'
  title: string
  tax_id: string
  content: string
  status: 'pending' | 'issued' | 'failed' | 'cancelled'
  fail_reason?: string
  issued_at?: string
  pdf_url?: string
  created_at: string
}

export interface InvoiceListParams extends PaginationParams {
  status?: string
  invoice_type?: string
  start_date?: string
  end_date?: string
}

export interface ApplyInvoiceParams {
  invoice_type: 'special' | 'normal' | 'electronic'
  title: string
  tax_id: string
  content: string
  amount: number
  related_ids: number[]
  address?: string
  phone?: string
  bank_name?: string
  bank_account?: string
}

export interface AttendanceReportItem {
  worker_id: number
  worker_name: string
  project_name: string
  total_days: number
  normal_days: number
  late_days: number
  early_leave_days: number
  absent_days: number
  leave_days: number
  total_hours: number
  offline_count: number
}

export interface AttendanceReportParams extends PaginationParams {
  start_date: string
  end_date: string
  enterprise_id?: number
  job_post_id?: number
  worker_id?: number
}

export interface OfflineSyncItem {
  worker_id: number
  job_post_id: number
  date: string
  check_in_time: string
  check_out_time: string
  check_in_lat: number
  check_in_lng: number
  check_out_lat: number
  check_out_lng: number
  work_hours: number
  status: string
}

export interface WorkerWithUser extends Worker {
  user: User
  skills?: string[]
}

export interface EnterpriseWithUser extends Enterprise {
  user: User
}

export interface ContractItem extends JobPost {
  enterprise_name: string
  hired_count: number
  application_count: number
  is_abnormal: boolean
  abnormal_reason?: string
  performance_rate: number
}

export interface JobAuditItem extends JobPost {
  enterprise_name: string
  enterprise_credit: number
  deposit_status: 'unpaid' | 'paid' | 'partial'
  application_count: number
  hired_count: number
  audit_status: 'pending' | 'approved' | 'rejected'
  reject_reason?: string
  created_at: string
}

export const adminApi = {
  getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return http.get<DashboardStats>('/admin/dashboard/stats')
  },

  scanRiskAlerts(): Promise<ApiResponse<ScanResult>> {
    return http.post<ScanResult>('/admin/risk/scan')
  },

  getRiskAlerts(
    params: PaginationParams & {
      alert_type?: AlertType
      severity?: AlertSeverity
      status?: AlertStatus
      start_date?: string
      end_date?: string
    }
  ): Promise<ApiResponse<PaginationResult<RiskAlert>>> {
    return http.get<PaginationResult<RiskAlert>>('/admin/risk/alerts', { params })
  },

  getRiskAlert(id: number): Promise<ApiResponse<RiskAlert & {
    related_object?: unknown
  }>> {
    return http.get<RiskAlert & { related_object?: unknown }>(`/admin/risk/alerts/${id}`)
  },

  handleRiskAlert(
    id: number,
    data: HandleRiskAlertParams
  ): Promise<ApiResponse<RiskAlert>> {
    return http.post<RiskAlert>(`/admin/risk/alerts/${id}/handle`, data)
  },

  getRiskStatistics(): Promise<ApiResponse<RiskStatistics>> {
    return http.get<RiskStatistics>('/admin/risk/statistics')
  },

  monitorContracts(): Promise<ApiResponse<MonitorResult>> {
    return http.post<MonitorResult>('/admin/risk/monitor-contracts')
  },

  processWageReleases(data: WageReleaseProcessParams): Promise<ApiResponse<{
    processed: number
    failed: number
    results: Array<{
      release_id: number
      success: boolean
      message?: string
    }>
  }>> {
    return http.post('/admin/wages/process-releases', data)
  },

  processPayroll(data: BatchPayrollParams): Promise<ApiResponse<{
    created: number
    failed: number
    release_ids: number[]
  }>> {
    return http.post('/admin/wages/batch-payroll', data)
  },

  holdWageRelease(id: number, hold: boolean = true): Promise<ApiResponse<WageRelease>> {
    return http.post<WageRelease>(`/admin/wages/releases/${id}/hold`, { hold })
  },

  getWageReleases(
    params: PaginationParams & {
      status?: string
      start_date?: string
      end_date?: string
    }
  ): Promise<ApiResponse<PaginationResult<WageRelease & {
    worker_name: string
    project_name: string
    enterprise_name: string
  }>>> {
    return http.get<PaginationResult<WageRelease & {
      worker_name: string
      project_name: string
      enterprise_name: string
    }>>('/admin/wages/releases', { params })
  },

  getWageStatistics(): Promise<ApiResponse<WageStatistics>> {
    return http.get<WageStatistics>('/admin/wages/statistics')
  },

  getPayslip(paymentId: number): Promise<ApiResponse<Payslip>> {
    return http.get<Payslip>(`/admin/wages/payslip/${paymentId}`)
  },

  getWorkers(
    params: PaginationParams & {
      craftsman_level_min?: number
      craftsman_level_max?: number
      skill?: string
    }
  ): Promise<ApiResponse<PaginationResult<WorkerWithUser>>> {
    return http.get<PaginationResult<WorkerWithUser>>('/admin/users/workers', { params })
  },

  getEnterprises(
    params: PaginationParams
  ): Promise<ApiResponse<PaginationResult<EnterpriseWithUser>>> {
    return http.get<PaginationResult<EnterpriseWithUser>>('/admin/users/enterprises', { params })
  },

  toggleUserStatus(userId: number, status: 'active' | 'disabled'): Promise<ApiResponse<User>> {
    return http.post<User>(`/admin/users/${userId}/status`, { status })
  },

  approveEnterprise(
    enterpriseId: number,
    approved: boolean,
    reject_reason?: string
  ): Promise<ApiResponse<Enterprise>> {
    return http.post<Enterprise>(`/admin/users/enterprises/${enterpriseId}/approve`, {
      approved,
      reject_reason,
    })
  },

  approveLicense(id: number, data: ApproveLicenseParams): Promise<ApiResponse<LicenseApplication>> {
    return http.post<LicenseApplication>(`/admin/services/licenses/${id}/approve`, data)
  },

  getLicenses(params: LicenseListParams): Promise<ApiResponse<PaginationResult<LicenseApplication>>> {
    return http.get<PaginationResult<LicenseApplication>>('/admin/services/licenses', { params })
  },

  getInvoices(params: InvoiceListParams): Promise<ApiResponse<PaginationResult<Invoice>>> {
    return http.get<PaginationResult<Invoice>>('/admin/services/invoices', { params })
  },

  applyInvoice(data: ApplyInvoiceParams): Promise<ApiResponse<Invoice>> {
    return http.post<Invoice>('/admin/services/invoices/apply', data)
  },

  getAttendanceReport(params: AttendanceReportParams): Promise<ApiResponse<PaginationResult<AttendanceReportItem>>> {
    return http.get<PaginationResult<AttendanceReportItem>>('/admin/services/attendance/report', { params })
  },

  offlineSyncAttendance(data: OfflineSyncItem[]): Promise<ApiResponse<{
    synced: number
    failed: number
    ids: number[]
  }>> {
    return http.post('/admin/services/attendance/offline-sync', { records: data })
  },

  getJobAudits(
    params: PaginationParams & {
      audit_status?: string
      deposit_status?: string
    }
  ): Promise<ApiResponse<PaginationResult<JobAuditItem>>> {
    return http.get<PaginationResult<JobAuditItem>>('/admin/job/audits', { params })
  },

  auditJobPost(
    postId: number,
    approved: boolean,
    reject_reason?: string
  ): Promise<ApiResponse<JobPost>> {
    return http.post<JobPost>(`/admin/job/posts/${postId}/audit`, {
      approved,
      reject_reason,
    })
  },

  getContracts(
    params: PaginationParams & {
      status?: string
      has_anomaly?: boolean
    }
  ): Promise<ApiResponse<PaginationResult<ContractItem>>> {
    return http.get<PaginationResult<ContractItem>>('/admin/job/contracts', { params })
  },

  markContractAbnormal(
    contractId: number,
    reason: string
  ): Promise<ApiResponse<ContractItem>> {
    return http.post<ContractItem>(`/admin/job/contracts/${contractId}/mark-abnormal`, { reason })
  },
}

export default adminApi
