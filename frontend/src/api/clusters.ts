import client from './client'
import type { Cluster, ClusterDashboard } from '../types'

export function listClusters() {
  return client.get<Cluster[]>('/clusters').then((r) => r.data)
}

export function getCluster(id: string) {
  return client.get<Cluster>(`/clusters/${id}`).then((r) => r.data)
}

export function createCluster(data: Partial<Cluster>) {
  return client.post<{ id: string }>('/clusters', data).then((r) => r.data)
}

export function updateCluster(id: string, data: Partial<Cluster>) {
  return client.put(`/clusters/${id}`, data).then((r) => r.data)
}

export function deleteCluster(id: string) {
  return client.delete(`/clusters/${id}`).then((r) => r.data)
}

export function getClusterDashboard(clusterId: string) {
  return client
    .get<ClusterDashboard>(`/clusters/${clusterId}/dashboard`)
    .then((r) => r.data)
}
