import client from './client'
import type { CreateReleaseRequest, ReleaseRecord } from '../types'

export function createRelease(data: CreateReleaseRequest) {
  return client
    .post<{ id: string }>('/publish', data)
    .then((r) => r.data)
}

export function listReleases(clusterId?: string) {
  const url = clusterId ? `/publish?cluster_id=${clusterId}` : '/publish'
  return client.get<ReleaseRecord[]>(url).then((r) => r.data)
}

export function approveRelease(id: string, data: Record<string, unknown> = {}) {
  return client.post(`/publish/${id}/approve`, data).then((r) => r.data)
}

export function executeRelease(id: string) {
  return client.post(`/publish/${id}/execute`).then((r) => r.data)
}

export function rollbackRelease(id: string) {
  return client.post(`/publish/${id}/rollback`).then((r) => r.data)
}
