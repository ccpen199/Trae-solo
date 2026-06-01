import client from './client'
import type {
  Workload,
  Pod,
  K8sService,
  Ingress,
  ConfigMap,
  K8sSecret,
  K8sEvent,
  ReleaseRecord,
} from '../types'

export function listWorkloads(clusterId: string) {
  return client
    .get<Workload[]>(`/clusters/${clusterId}/workloads`)
    .then((r) => r.data)
}

export function getWorkload(id: string) {
  return client.get<Workload>(`/workloads/${id}`).then((r) => r.data)
}

export function getWorkloadPods(id: string) {
  return client.get<Pod[]>(`/workloads/${id}/pods`).then((r) => r.data)
}

export function getWorkloadServices(id: string) {
  return client
    .get<K8sService[]>(`/workloads/${id}/services`)
    .then((r) => r.data)
}

export function getWorkloadIngresses(id: string) {
  return client.get<Ingress[]>(`/workloads/${id}/ingresses`).then((r) => r.data)
}

export function getWorkloadConfigMaps(id: string) {
  return client
    .get<ConfigMap[]>(`/workloads/${id}/configmaps`)
    .then((r) => r.data)
}

export function getWorkloadSecrets(id: string) {
  return client.get<K8sSecret[]>(`/workloads/${id}/secrets`).then((r) => r.data)
}

export function getWorkloadEvents(id: string) {
  return client.get<K8sEvent[]>(`/workloads/${id}/events`).then((r) => r.data)
}

export function getWorkloadRollouts(id: string) {
  return client
    .get<ReleaseRecord[]>(`/workloads/${id}/rollouts`)
    .then((r) => r.data)
}

export function deleteWorkload(id: string) {
  return client.delete(`/workloads/${id}`).then((r) => r.data)
}
