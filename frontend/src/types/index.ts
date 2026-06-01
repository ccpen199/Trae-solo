export interface User {
  id: string
  username: string
  password_hash?: string
  role: 'admin' | 'operator' | 'viewer'
  created_at: string
}

export interface Cluster {
  id: string
  name: string
  description: string | null
  api_server: string | null
  status: string
  node_count: number
  created_at: string
  updated_at: string
}

export interface Namespace {
  id: string
  cluster_id: string
  name: string
  description: string | null
  status: string
  created_at: string
}

export interface Workload {
  id: string
  cluster_id: string
  namespace: string
  name: string
  type: string
  replicas: number
  ready_replicas: number
  image: string
  cpu_request: string | null
  memory_request: string | null
  cpu_limit: string | null
  memory_limit: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Pod {
  id: string
  workload_id: string
  name: string
  namespace: string
  node_name: string | null
  status: string
  restart_count: number
  image: string
  created_at: string
  started_at: string | null
}

export interface K8sService {
  id: string
  workload_id: string | null
  name: string
  namespace: string
  type: string
  cluster_ip: string | null
  ports: string | null
  created_at: string
}

export interface Ingress {
  id: string
  name: string
  namespace: string
  host: string | null
  paths: string | null
  service_name: string | null
  created_at: string
}

export interface ConfigMap {
  id: string
  name: string
  namespace: string
  data_count: number
  created_at: string
}

export interface K8sSecret {
  id: string
  name: string
  namespace: string
  type: string
  created_at: string
}

export interface K8sEvent {
  id: string
  cluster_id: string
  namespace: string
  type: string
  reason: string
  message: string | null
  object_kind: string | null
  object_name: string | null
  count: number
  last_seen: string | null
  created_at: string
}

export interface Permission {
  id: string
  user_id: string
  cluster_id: string | null
  namespace: string | null
  action: string
  created_at: string
}

export interface OperationLog {
  id: string
  user_id: string | null
  username: string | null
  action: string
  resource_type: string | null
  resource_name: string | null
  cluster_id: string | null
  namespace: string | null
  detail: string | null
  risk_level: string
  created_at: string
}

export interface InspectionReport {
  id: string
  cluster_id: string
  report_date: string
  restart_count: number
  pending_pods: number
  oversold_resources: number
  image_pull_failures: number
  high_risk_changes: number
  total_score: number
  issues: string | null
  created_by: string | null
  created_at: string
}

export interface Node {
  id: string
  cluster_id: string
  name: string
  status: string
  roles: string | null
  cpu_capacity: number
  cpu_allocatable: number
  cpu_used: number
  memory_capacity: number
  memory_allocatable: number
  memory_used: number
  pod_count: number
  created_at: string
}

export interface Certificate {
  id: string
  cluster_id: string
  name: string
  namespace: string
  issuer: string | null
  not_before: string | null
  not_after: string | null
  days_remaining: number
  status: string
  created_at: string
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ClusterDashboard {
  cluster: Cluster
  nodes: Node[]
  namespaces: Namespace[]
  workloads: Workload[]
  events: K8sEvent[]
  certificates: Certificate[]
}

export interface CreateReleaseRequest {
  cluster_id: string
  namespace: string
  workload_name: string
  new_image: string
  old_image: string
  cpu_limit: string
  memory_limit: string
  health_check: number
  gray_ratio: number
  rollback_point: string
  change_reason: string
  on_duty: string
}

export interface ReleaseRecord {
  id: string
  cluster_id: string
  namespace: string
  workload_name: string
  old_image: string | null
  new_image: string
  cpu_limit: string | null
  memory_limit: string | null
  health_check: number
  gray_ratio: number
  rollback_point: string | null
  change_reason: string | null
  on_duty: string | null
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled_back'
  approver: string | null
  operator: string
  created_at: string
  approved_at: string | null
  completed_at: string | null
}

export interface CreatePermissionRequest {
  user_id: string
  cluster_id?: string
  namespace?: string
  action: string
}
