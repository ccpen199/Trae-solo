import client from './client'
import type {
  OperationLog,
  Permission,
  CreatePermissionRequest,
  InspectionReport,
} from '../types'

export function getOperationLogs() {
  return client.get<OperationLog[]>('/operations/logs').then((r) => r.data)
}

export function listPermissions() {
  return client.get<Permission[]>('/operations/permissions').then((r) => r.data)
}

export function createPermission(data: CreatePermissionRequest) {
  return client
    .post<{ id: string }>('/operations/permissions', data)
    .then((r) => r.data)
}

export function getInspectionReports(clusterId: string) {
  return client
    .get<InspectionReport[]>(`/clusters/${clusterId}/inspection-reports`)
    .then((r) => r.data)
}

export function generateInspectionReport(clusterId: string) {
  return client
    .post<InspectionReport>(`/clusters/${clusterId}/inspection-reports`)
    .then((r) => r.data)
}
