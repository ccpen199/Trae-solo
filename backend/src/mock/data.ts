import bcrypt from 'bcryptjs';
import {
  UserModel, ClusterModel, NamespaceModel, WorkloadModel, PodModel,
  ServiceModel, IngressModel, ConfigMapModel, SecretModel, EventModel,
  NodeModel, CertificateModel
} from '../models';

export function seedMockData() {
  const existingUsers = UserModel.list();
  if (existingUsers.length > 0) return;

  const adminId = UserModel.create('admin', bcrypt.hashSync('admin123', 10), 'admin');
  const operatorId = UserModel.create('operator', bcrypt.hashSync('op123', 10), 'operator');
  UserModel.create('viewer', bcrypt.hashSync('view123', 10), 'viewer');

  const prodClusterId = ClusterModel.create({
    name: 'production-cluster',
    description: '生产环境 K8s 集群',
    api_server: 'https://k8s-prod-api.example.com:6443',
    status: 'healthy',
    node_count: 5
  });

  const stagingClusterId = ClusterModel.create({
    name: 'staging-cluster',
    description: '预发布环境 K8s 集群',
    api_server: 'https://k8s-staging-api.example.com:6443',
    status: 'healthy',
    node_count: 3
  });

  // --- Production cluster resources ---

  const prodNs1 = NamespaceModel.create({
    cluster_id: prodClusterId,
    name: 'default',
    description: '默认命名空间',
    status: 'active'
  });

  const prodNs2 = NamespaceModel.create({
    cluster_id: prodClusterId,
    name: 'kube-system',
    description: 'Kubernetes 系统命名空间',
    status: 'active'
  });

  const prodNs3 = NamespaceModel.create({
    cluster_id: prodClusterId,
    name: 'frontend',
    description: '前端应用命名空间',
    status: 'active'
  });

  const prodNs4 = NamespaceModel.create({
    cluster_id: prodClusterId,
    name: 'backend',
    description: '后端应用命名空间',
    status: 'active'
  });

  // --- Staging cluster resources ---

  const stagingNs1 = NamespaceModel.create({
    cluster_id: stagingClusterId,
    name: 'default',
    description: '默认命名空间',
    status: 'active'
  });

  const stagingNs2 = NamespaceModel.create({
    cluster_id: stagingClusterId,
    name: 'testing',
    description: '测试环境命名空间',
    status: 'active'
  });

  // --- Workloads in production cluster ---

  const wlNginx = WorkloadModel.create({
    cluster_id: prodClusterId,
    namespace: 'frontend',
    name: 'nginx-web',
    type: 'Deployment',
    replicas: 3,
    ready_replicas: 3,
    image: 'nginx:1.25.3',
    cpu_request: '100m',
    memory_request: '128Mi',
    cpu_limit: '500m',
    memory_limit: '512Mi',
    status: 'Running'
  });

  const wlApi = WorkloadModel.create({
    cluster_id: prodClusterId,
    namespace: 'backend',
    name: 'api-gateway',
    type: 'Deployment',
    replicas: 2,
    ready_replicas: 2,
    image: 'mycompany/api-gateway:v2.3.1',
    cpu_request: '200m',
    memory_request: '256Mi',
    cpu_limit: '1000m',
    memory_limit: '1Gi',
    status: 'Running'
  });

  const wlRedis = WorkloadModel.create({
    cluster_id: prodClusterId,
    namespace: 'backend',
    name: 'redis-cache',
    type: 'StatefulSet',
    replicas: 3,
    ready_replicas: 3,
    image: 'redis:7.2.3-alpine',
    cpu_request: '100m',
    memory_request: '256Mi',
    cpu_limit: '500m',
    memory_limit: '1Gi',
    status: 'Running'
  });

  const wlDb = WorkloadModel.create({
    cluster_id: prodClusterId,
    namespace: 'backend',
    name: 'postgresql-main',
    type: 'StatefulSet',
    replicas: 2,
    ready_replicas: 2,
    image: 'postgres:15.5-alpine',
    cpu_request: '500m',
    memory_request: '512Mi',
    cpu_limit: '2000m',
    memory_limit: '4Gi',
    status: 'Running'
  });

  const wlCoredns = WorkloadModel.create({
    cluster_id: prodClusterId,
    namespace: 'kube-system',
    name: 'coredns',
    type: 'Deployment',
    replicas: 2,
    ready_replicas: 2,
    image: 'k8s.gcr.io/coredns/coredns:v1.11.1',
    cpu_request: '100m',
    memory_request: '70Mi',
    cpu_limit: '200m',
    memory_limit: '170Mi',
    status: 'Running'
  });

  const wlDashboard = WorkloadModel.create({
    cluster_id: prodClusterId,
    namespace: 'kube-system',
    name: 'kubernetes-dashboard',
    type: 'Deployment',
    replicas: 1,
    ready_replicas: 1,
    image: 'kubernetesui/dashboard:v2.7.0',
    cpu_request: '100m',
    memory_request: '100Mi',
    cpu_limit: '200m',
    memory_limit: '300Mi',
    status: 'Running'
  });

  // --- Workloads in staging cluster ---

  const wlStagingApi = WorkloadModel.create({
    cluster_id: stagingClusterId,
    namespace: 'testing',
    name: 'api-gateway-staging',
    type: 'Deployment',
    replicas: 1,
    ready_replicas: 1,
    image: 'mycompany/api-gateway:v2.4.0-beta',
    cpu_request: '100m',
    memory_request: '128Mi',
    cpu_limit: '500m',
    memory_limit: '512Mi',
    status: 'Running'
  });

  const wlStagingWeb = WorkloadModel.create({
    cluster_id: stagingClusterId,
    namespace: 'testing',
    name: 'web-frontend-staging',
    type: 'Deployment',
    replicas: 1,
    ready_replicas: 0,
    image: 'mycompany/web-frontend:v3.0.0-rc1',
    cpu_request: '100m',
    memory_request: '128Mi',
    cpu_limit: '500m',
    memory_limit: '512Mi',
    status: 'Pending'
  });

  // --- Pods ---

  const podsToCreate = [
    { workload_id: wlNginx, name: 'nginx-web-7d8b9c6f45-abc12', namespace: 'frontend', node_name: 'prod-node-1', status: 'Running', restart_count: 0, image: 'nginx:1.25.3', started_at: '2026-05-20T08:00:00Z' },
    { workload_id: wlNginx, name: 'nginx-web-7d8b9c6f45-def34', namespace: 'frontend', node_name: 'prod-node-2', status: 'Running', restart_count: 1, image: 'nginx:1.25.3', started_at: '2026-05-20T08:00:00Z' },
    { workload_id: wlNginx, name: 'nginx-web-7d8b9c6f45-ghi56', namespace: 'frontend', node_name: 'prod-node-3', status: 'Running', restart_count: 0, image: 'nginx:1.25.3', started_at: '2026-05-20T08:00:00Z' },
    { workload_id: wlApi, name: 'api-gateway-6b7c8d7e9f-jkl78', namespace: 'backend', node_name: 'prod-node-2', status: 'Running', restart_count: 2, image: 'mycompany/api-gateway:v2.3.1', started_at: '2026-05-19T14:30:00Z' },
    { workload_id: wlApi, name: 'api-gateway-6b7c8d7e9f-mno90', namespace: 'backend', node_name: 'prod-node-4', status: 'Running', restart_count: 0, image: 'mycompany/api-gateway:v2.3.1', started_at: '2026-05-19T14:30:00Z' },
    { workload_id: wlRedis, name: 'redis-cache-0', namespace: 'backend', node_name: 'prod-node-1', status: 'Running', restart_count: 0, image: 'redis:7.2.3-alpine', started_at: '2026-05-18T10:00:00Z' },
    { workload_id: wlRedis, name: 'redis-cache-1', namespace: 'backend', node_name: 'prod-node-3', status: 'Running', restart_count: 0, image: 'redis:7.2.3-alpine', started_at: '2026-05-18T10:00:00Z' },
    { workload_id: wlRedis, name: 'redis-cache-2', namespace: 'backend', node_name: 'prod-node-5', status: 'Running', restart_count: 3, image: 'redis:7.2.3-alpine', started_at: '2026-05-18T10:00:00Z' },
    { workload_id: wlDb, name: 'postgresql-main-0', namespace: 'backend', node_name: 'prod-node-4', status: 'Running', restart_count: 0, image: 'postgres:15.5-alpine', started_at: '2026-05-15T09:00:00Z' },
    { workload_id: wlDb, name: 'postgresql-main-1', namespace: 'backend', node_name: 'prod-node-5', status: 'Running', restart_count: 0, image: 'postgres:15.5-alpine', started_at: '2026-05-15T09:00:00Z' },
    { workload_id: wlCoredns, name: 'coredns-5d9b8c8b77-pqr12', namespace: 'kube-system', node_name: 'prod-node-1', status: 'Running', restart_count: 0, image: 'k8s.gcr.io/coredns/coredns:v1.11.1', started_at: '2026-05-10T06:00:00Z' },
    { workload_id: wlCoredns, name: 'coredns-5d9b8c8b77-stu34', namespace: 'kube-system', node_name: 'prod-node-2', status: 'Running', restart_count: 0, image: 'k8s.gcr.io/coredns/coredns:v1.11.1', started_at: '2026-05-10T06:00:00Z' },
    { workload_id: wlDashboard, name: 'kubernetes-dashboard-7f9d7c8b66-vwx56', namespace: 'kube-system', node_name: 'prod-node-3', status: 'Running', restart_count: 0, image: 'kubernetesui/dashboard:v2.7.0', started_at: '2026-05-12T11:00:00Z' },
    { workload_id: wlStagingApi, name: 'api-gateway-staging-8a9b7c6d5e-yza78', namespace: 'testing', node_name: 'staging-node-1', status: 'Running', restart_count: 1, image: 'mycompany/api-gateway:v2.4.0-beta', started_at: '2026-05-22T16:00:00Z' },
    { workload_id: wlStagingWeb, name: 'web-frontend-staging-9b0c8d7e6f-bcd90', namespace: 'testing', node_name: null, status: 'Pending', restart_count: 0, image: 'mycompany/web-frontend:v3.0.0-rc1', started_at: null }
  ];

  podsToCreate.forEach(p => PodModel.create(p));

  // --- Services ---

  ServiceModel.create({
    workload_id: wlNginx,
    name: 'nginx-web-svc',
    namespace: 'frontend',
    type: 'ClusterIP',
    cluster_ip: '10.96.100.10',
    ports: '[{"port":80,"targetPort":80,"protocol":"TCP"}]'
  });

  ServiceModel.create({
    workload_id: wlApi,
    name: 'api-gateway-svc',
    namespace: 'backend',
    type: 'ClusterIP',
    cluster_ip: '10.96.200.20',
    ports: '[{"port":8080,"targetPort":8080,"protocol":"TCP"}]'
  });

  ServiceModel.create({
    workload_id: wlRedis,
    name: 'redis-cache-svc',
    namespace: 'backend',
    type: 'ClusterIP',
    cluster_ip: '10.96.200.30',
    ports: '[{"port":6379,"targetPort":6379,"protocol":"TCP"}]'
  });

  ServiceModel.create({
    workload_id: wlDb,
    name: 'postgresql-main-svc',
    namespace: 'backend',
    type: 'ClusterIP',
    cluster_ip: '10.96.200.40',
    ports: '[{"port":5432,"targetPort":5432,"protocol":"TCP"}]'
  });

  // --- Ingresses ---

  IngressModel.create({
    name: 'frontend-ingress',
    namespace: 'frontend',
    host: 'www.example.com',
    paths: '[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"nginx-web-svc","port":{"number":80}}}}]',
    service_name: 'nginx-web-svc'
  });

  IngressModel.create({
    name: 'api-ingress',
    namespace: 'backend',
    host: 'api.example.com',
    paths: '[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"api-gateway-svc","port":{"number":8080}}}}]',
    service_name: 'api-gateway-svc'
  });

  // --- ConfigMaps ---

  ConfigMapModel.create({ name: 'nginx-config', namespace: 'frontend', data_count: 3 });
  ConfigMapModel.create({ name: 'api-config', namespace: 'backend', data_count: 5 });
  ConfigMapModel.create({ name: 'redis-config', namespace: 'backend', data_count: 2 });
  ConfigMapModel.create({ name: 'cluster-info', namespace: 'kube-system', data_count: 4 });

  // --- Secrets ---

  SecretModel.create({ name: 'api-credentials', namespace: 'backend', type: 'Opaque' });
  SecretModel.create({ name: 'tls-secret', namespace: 'frontend', type: 'kubernetes.io/tls' });
  SecretModel.create({ name: 'db-password', namespace: 'backend', type: 'Opaque' });
  SecretModel.create({ name: 'redis-password', namespace: 'backend', type: 'Opaque' });

  // --- Events ---

  const eventsToCreate = [
    { cluster_id: prodClusterId, namespace: 'frontend', type: 'Normal', reason: 'Scheduled', message: 'Successfully assigned frontend/nginx-web-7d8b9c6f45-abc12 to prod-node-1', object_kind: 'Pod', object_name: 'nginx-web-7d8b9c6f45-abc12', count: 1, last_seen: '2026-05-20T08:00:05Z' },
    { cluster_id: prodClusterId, namespace: 'frontend', type: 'Normal', reason: 'Pulled', message: 'Container image "nginx:1.25.3" already present on machine', object_kind: 'Pod', object_name: 'nginx-web-7d8b9c6f45-abc12', count: 1, last_seen: '2026-05-20T08:00:10Z' },
    { cluster_id: prodClusterId, namespace: 'frontend', type: 'Normal', reason: 'Created', message: 'Created container nginx', object_kind: 'Pod', object_name: 'nginx-web-7d8b9c6f45-abc12', count: 1, last_seen: '2026-05-20T08:00:12Z' },
    { cluster_id: prodClusterId, namespace: 'frontend', type: 'Normal', reason: 'Started', message: 'Started container nginx', object_kind: 'Pod', object_name: 'nginx-web-7d8b9c6f45-abc12', count: 1, last_seen: '2026-05-20T08:00:15Z' },
    { cluster_id: prodClusterId, namespace: 'backend', type: 'Warning', reason: 'BackOff', message: 'Back-off restarting failed container', object_kind: 'Pod', object_name: 'api-gateway-6b7c8d7e9f-jkl78', count: 5, last_seen: '2026-05-21T09:30:00Z' },
    { cluster_id: prodClusterId, namespace: 'backend', type: 'Warning', reason: 'Restarted', message: 'Container redis-cache-2 restarted 3 times', object_kind: 'Pod', object_name: 'redis-cache-2', count: 3, last_seen: '2026-05-22T14:00:00Z' },
    { cluster_id: prodClusterId, namespace: 'backend', type: 'Normal', reason: 'ScalingReplicaSet', message: 'Scaled up replica set api-gateway-6b7c8d7e9f to 2', object_kind: 'Deployment', object_name: 'api-gateway', count: 1, last_seen: '2026-05-19T14:30:00Z' },
    { cluster_id: prodClusterId, namespace: 'kube-system', type: 'Normal', reason: 'NodeReady', message: 'Node prod-node-1 status is now NodeReady', object_kind: 'Node', object_name: 'prod-node-1', count: 1, last_seen: '2026-05-10T06:00:00Z' },
    { cluster_id: prodClusterId, namespace: 'kube-system', type: 'Normal', reason: 'NodeReady', message: 'Node prod-node-2 status is now NodeReady', object_kind: 'Node', object_name: 'prod-node-2', count: 1, last_seen: '2026-05-10T06:00:00Z' },
    { cluster_id: prodClusterId, namespace: 'kube-system', type: 'Warning', reason: 'DiskPressure', message: 'Node prod-node-3 has disk pressure', object_kind: 'Node', object_name: 'prod-node-3', count: 2, last_seen: '2026-05-23T10:00:00Z' },
    { cluster_id: stagingClusterId, namespace: 'testing', type: 'Warning', reason: 'FailedScheduling', message: '0/3 nodes are available: insufficient cpu', object_kind: 'Pod', object_name: 'web-frontend-staging-9b0c8d7e6f-bcd90', count: 4, last_seen: '2026-05-24T09:00:00Z' },
    { cluster_id: prodClusterId, namespace: 'frontend', type: 'Normal', reason: 'Updated', message: 'Ingress frontend-ingress updated', object_kind: 'Ingress', object_name: 'frontend-ingress', count: 1, last_seen: '2026-05-22T11:00:00Z' }
  ];

  eventsToCreate.forEach(e => EventModel.create(e));

  // --- Nodes (production cluster) ---

  const nodesToCreate = [
    { cluster_id: prodClusterId, name: 'prod-node-1', status: 'Ready', roles: 'control-plane,master', cpu_capacity: 8000, cpu_allocatable: 7500, cpu_used: 4200, memory_capacity: 16384, memory_allocatable: 15360, memory_used: 8192, pod_count: 12 },
    { cluster_id: prodClusterId, name: 'prod-node-2', status: 'Ready', roles: 'worker', cpu_capacity: 8000, cpu_allocatable: 7500, cpu_used: 5100, memory_capacity: 16384, memory_allocatable: 15360, memory_used: 10240, pod_count: 15 },
    { cluster_id: prodClusterId, name: 'prod-node-3', status: 'Ready', roles: 'worker', cpu_capacity: 8000, cpu_allocatable: 7500, cpu_used: 3800, memory_capacity: 16384, memory_allocatable: 15360, memory_used: 7168, pod_count: 10 },
    { cluster_id: prodClusterId, name: 'prod-node-4', status: 'Ready', roles: 'worker', cpu_capacity: 16000, cpu_allocatable: 15500, cpu_used: 9200, memory_capacity: 32768, memory_allocatable: 30720, memory_used: 18432, pod_count: 18 },
    { cluster_id: prodClusterId, name: 'prod-node-5', status: 'Ready', roles: 'worker', cpu_capacity: 16000, cpu_allocatable: 15500, cpu_used: 8500, memory_capacity: 32768, memory_allocatable: 30720, memory_used: 16384, pod_count: 16 },
    { cluster_id: stagingClusterId, name: 'staging-node-1', status: 'Ready', roles: 'control-plane,master', cpu_capacity: 4000, cpu_allocatable: 3500, cpu_used: 2100, memory_capacity: 8192, memory_allocatable: 7168, memory_used: 4096, pod_count: 8 },
    { cluster_id: stagingClusterId, name: 'staging-node-2', status: 'Ready', roles: 'worker', cpu_capacity: 4000, cpu_allocatable: 3500, cpu_used: 1800, memory_capacity: 8192, memory_allocatable: 7168, memory_used: 3584, pod_count: 6 },
    { cluster_id: stagingClusterId, name: 'staging-node-3', status: 'NotReady', roles: 'worker', cpu_capacity: 4000, cpu_allocatable: 3500, cpu_used: 0, memory_capacity: 8192, memory_allocatable: 7168, memory_used: 0, pod_count: 0 }
  ];

  nodesToCreate.forEach(n => NodeModel.create(n));

  // --- Certificates ---

  const certsToCreate = [
    { cluster_id: prodClusterId, name: 'www-example-com-tls', namespace: 'frontend', issuer: "Let's Encrypt", not_before: '2026-02-01T00:00:00Z', not_after: '2026-08-01T00:00:00Z', days_remaining: 68, status: 'valid' },
    { cluster_id: prodClusterId, name: 'api-example-com-tls', namespace: 'backend', issuer: "Let's Encrypt", not_before: '2026-03-15T00:00:00Z', not_after: '2026-06-15T00:00:00Z', days_remaining: 21, status: 'expiring_soon' },
    { cluster_id: prodClusterId, name: 'kube-apiserver-cert', namespace: 'kube-system', issuer: 'kubernetes', not_before: '2025-05-25T00:00:00Z', not_after: '2026-05-25T00:00:00Z', days_remaining: 0, status: 'expired' },
    { cluster_id: prodClusterId, name: 'etcd-server-cert', namespace: 'kube-system', issuer: 'kubernetes', not_before: '2025-05-25T00:00:00Z', not_after: '2026-05-25T00:00:00Z', days_remaining: 0, status: 'expired' },
    { cluster_id: stagingClusterId, name: 'staging-example-com-tls', namespace: 'testing', issuer: "Let's Encrypt", not_before: '2026-04-01T00:00:00Z', not_after: '2026-10-01T00:00:00Z', days_remaining: 129, status: 'valid' }
  ];

  certsToCreate.forEach(c => CertificateModel.create(c));
}
