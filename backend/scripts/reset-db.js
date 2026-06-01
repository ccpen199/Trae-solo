const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  DELETE FROM operation_logs;
  DELETE FROM permissions;
  DELETE FROM release_records;
  DELETE FROM events;
  DELETE FROM pods;
  DELETE FROM services;
  DELETE FROM ingresses;
  DELETE FROM config_maps;
  DELETE FROM secrets;
  DELETE FROM workloads;
  DELETE FROM namespaces;
  DELETE FROM nodes;
  DELETE FROM certificates;
  DELETE FROM inspection_reports;
  DELETE FROM clusters;
  DELETE FROM users;
`);

const pwdAdmin = bcrypt.hashSync('admin123', 10);
const pwdOperator = bcrypt.hashSync('op123', 10);
const pwdViewer = bcrypt.hashSync('view123', 10);

const adminId = uuidv4();
const operatorId = uuidv4();
const viewerId = uuidv4();

const insertUser = db.prepare(
  'INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)'
);
insertUser.run(adminId, 'admin', pwdAdmin, 'admin');
insertUser.run(operatorId, 'operator', pwdOperator, 'operator');
insertUser.run(viewerId, 'viewer', pwdViewer, 'viewer');

console.log('Users created:');
db.prepare('SELECT username, role FROM users').all().forEach(u => {
  const v = bcrypt.compareSync(u.role === 'admin' ? 'admin123' : u.role === 'operator' ? 'op123' : 'view123', 
    db.prepare('SELECT password_hash FROM users WHERE username = ?').get(u.username).password_hash);
  console.log(`  ${u.username} (${u.role}) - password verified: ${v}`);
});

const c1 = uuidv4();
const c2 = uuidv4();
const c3 = uuidv4();

const insertCluster = db.prepare(
  'INSERT INTO clusters (id, name, description, api_server, status, node_count) VALUES (?, ?, ?, ?, ?, ?)'
);
insertCluster.run(c1, 'prod-cluster', '生产环境集群', 'https://k8s-prod.example.com:6443', 'healthy', 10);
insertCluster.run(c2, 'staging-cluster', '预发布集群', 'https://k8s-staging.example.com:6443', 'healthy', 6);
insertCluster.run(c3, 'dev-cluster', '开发环境集群', 'https://k8s-dev.example.com:6443', 'warning', 4);

const insertNs = db.prepare(
  'INSERT INTO namespaces (id, cluster_id, name, description, status) VALUES (?, ?, ?, ?, ?)'
);
const namespaces = [
  [c1, 'production', '生产命名空间', 'active'],
  [c1, 'monitoring', '监控系统', 'active'],
  [c1, 'ingress-nginx', 'Ingress 控制器', 'active'],
  [c1, 'kube-system', '系统组件', 'active'],
  [c1, 'default', '默认命名空间', 'active'],
  [c1, 'logging', '日志系统', 'active'],
  [c1, 'backup', '备份系统', 'active'],
  [c1, 'middleware', '中间件服务', 'active'],
  [c2, 'staging', '预发布环境', 'active'],
  [c2, 'default', '默认命名空间', 'active'],
  [c2, 'kube-system', '系统组件', 'active'],
  [c3, 'development', '开发环境', 'active'],
  [c3, 'default', '默认命名空间', 'active'],
];
namespaces.forEach(n => insertNs.run(uuidv4(), n[0], n[1], n[2], n[3]));

const insertNode = db.prepare(
  'INSERT INTO nodes (id, cluster_id, name, status, roles, cpu_capacity, cpu_allocatable, cpu_used, memory_capacity, memory_allocatable, memory_used, pod_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
for (let i = 1; i <= 10; i++) {
  insertNode.run(uuidv4(), c1, `prod-node-${i}`, i % 7 === 0 ? 'NotReady' : 'Ready',
    i === 1 ? 'master,control-plane' : 'worker', 8000, 7600, 2000 + i * 300, 32768, 30720, 8000 + i * 500, 3 + i);
}
for (let i = 1; i <= 6; i++) {
  insertNode.run(uuidv4(), c2, `staging-node-${i}`, 'Ready',
    i === 1 ? 'master,control-plane' : 'worker', 4000, 3800, 800 + i * 200, 16384, 15360, 4000 + i * 300, 2 + i);
}
for (let i = 1; i <= 4; i++) {
  insertNode.run(uuidv4(), c3, `dev-node-${i}`, i === 4 ? 'NotReady' : 'Ready',
    i === 1 ? 'master,control-plane' : 'worker', 2000, 1800, 600 + i * 100, 8192, 7680, 2000 + i * 200, 2 + i);
}

const insertWl = db.prepare(
  'INSERT INTO workloads (id, cluster_id, namespace, name, type, replicas, ready_replicas, image, cpu_request, memory_request, cpu_limit, memory_limit, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
const workloads = [
  [c1, 'production', 'nginx-gateway', 'DaemonSet', 10, 10, 'nginx:1.25.3', '100m', '128Mi', '500m', '256Mi', 'Running'],
  [c1, 'production', 'payment-service', 'Deployment', 3, 3, 'payment-service:v2.1.0', '200m', '256Mi', '1000m', '512Mi', 'Running'],
  [c1, 'production', 'order-service', 'Deployment', 5, 5, 'order-service:v1.8.3', '200m', '256Mi', '1000m', '512Mi', 'Running'],
  [c1, 'production', 'user-service', 'Deployment', 4, 4, 'user-service:v1.5.0', '200m', '256Mi', '1000m', '512Mi', 'Running'],
  [c1, 'middleware', 'redis', 'StatefulSet', 3, 3, 'redis:7.2.3', '500m', '512Mi', '2000m', '2Gi', 'Running'],
  [c1, 'middleware', 'elasticsearch', 'StatefulSet', 3, 2, 'elasticsearch:8.11.1', '1000m', '2Gi', '4000m', '4Gi', 'Pending'],
  [c1, 'middleware', 'kafka', 'StatefulSet', 3, 3, 'kafka:3.6.1', '1000m', '1Gi', '2000m', '2Gi', 'Running'],
  [c1, 'monitoring', 'prometheus', 'Deployment', 2, 2, 'prom/prometheus:v2.47.2', '500m', '1Gi', '2000m', '4Gi', 'Running'],
  [c1, 'monitoring', 'grafana', 'Deployment', 1, 0, 'grafana/grafana:10.2.3', '200m', '256Mi', '1000m', '512Mi', 'Error'],
  [c1, 'ingress-nginx', 'ingress-nginx-controller', 'Deployment', 2, 2, 'ingress-nginx/controller:v1.9.5', '200m', '512Mi', '1000m', '1Gi', 'Running'],
  [c2, 'staging', 'payment-service', 'Deployment', 2, 2, 'payment-service:v2.2.0-rc1', '200m', '256Mi', '1000m', '512Mi', 'Running'],
  [c2, 'staging', 'order-service', 'Deployment', 2, 2, 'order-service:v1.9.0-beta', '200m', '256Mi', '1000m', '512Mi', 'Running'],
  [c3, 'development', 'dev-app', 'Deployment', 2, 2, 'dev-app:latest', '100m', '128Mi', '500m', '256Mi', 'Running'],
  [c3, 'development', 'dev-api', 'Deployment', 1, 1, 'dev-api:latest', '100m', '128Mi', '500m', '256Mi', 'Running'],
];
const wlIds = workloads.map(() => uuidv4());
workloads.forEach((w, i) => insertWl.run(wlIds[i], w[0], w[1], w[2], w[3], w[4], w[5], w[6], w[7], w[8], w[9], w[10], w[11]));

const insertPod = db.prepare(
  'INSERT INTO pods (id, workload_id, name, namespace, node_name, status, restart_count, image, created_at, started_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
wlIds.forEach((wid, wi) => {
  const w = workloads[wi];
  for (let j = 1; j <= w[4]; j++) {
    const podName = `${w[2]}-${wi}-${j}`;
    const nodeName = `prod-node-${((wi + j) % 10) + 1}`;
    const status = w[12];
    const restarts = Math.floor(Math.random() * 6);
    insertPod.run(uuidv4(), wid, podName, w[1], nodeName, status, restarts, w[6],
      new Date(Date.now() - 86400000 * (wi + j)).toISOString(),
      new Date(Date.now() - 3600000 * (wi + j)).toISOString());
  }
});

const insertSvc = db.prepare(
  'INSERT INTO services (id, workload_id, name, namespace, type, cluster_ip, ports, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
const svcData = [
  [wlIds[0], 'nginx-gateway-svc', 'production', 'LoadBalancer', '10.96.100.1', '80:30080/TCP,443:30443/TCP'],
  [wlIds[1], 'payment-service', 'production', 'ClusterIP', '10.96.100.11', '8080/TCP'],
  [wlIds[2], 'order-service', 'production', 'ClusterIP', '10.96.100.12', '8080/TCP'],
  [wlIds[3], 'user-service', 'production', 'ClusterIP', '10.96.100.13', '8080/TCP'],
  [wlIds[4], 'redis', 'middleware', 'ClusterIP', '10.96.100.21', '6379/TCP'],
  [wlIds[5], 'elasticsearch', 'middleware', 'ClusterIP', '10.96.100.22', '9200/TCP,9300/TCP'],
  [wlIds[6], 'kafka', 'middleware', 'ClusterIP', '10.96.100.23', '9092/TCP'],
  [wlIds[7], 'prometheus', 'monitoring', 'ClusterIP', '10.96.100.31', '9090/TCP'],
  [wlIds[8], 'grafana', 'monitoring', 'ClusterIP', '10.96.100.32', '3000/TCP'],
  [wlIds[9], 'ingress-nginx-controller', 'ingress-nginx', 'LoadBalancer', '10.96.100.41', '80:31080/TCP,443:31443/TCP'],
];
svcData.forEach(s => insertSvc.run(uuidv4(), s[0], s[1], s[2], s[3], s[4], s[5], new Date().toISOString()));

const insertIng = db.prepare(
  'INSERT INTO ingresses (id, name, namespace, host, paths, service_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
const ingData = [
  ['nginx-gateway-ing', 'production', 'www.example.com', '/', 'nginx-gateway-svc'],
  ['payment-ing', 'production', 'api.example.com', '/payment/*', 'payment-service'],
  ['order-ing', 'production', 'api.example.com', '/order/*', 'order-service'],
  ['user-ing', 'production', 'api.example.com', '/user/*', 'user-service'],
  ['grafana-ing', 'monitoring', 'grafana.example.com', '/', 'grafana'],
];
ingData.forEach(i => insertIng.run(uuidv4(), i[0], i[1], i[2], i[3], i[4], new Date().toISOString()));

const insertCm = db.prepare(
  'INSERT INTO config_maps (id, name, namespace, data_count, created_at) VALUES (?, ?, ?, ?, ?)'
);
const cmData = [
  ['nginx-gateway-config', 'production', 5],
  ['payment-config', 'production', 8],
  ['order-config', 'production', 6],
  ['redis-config', 'middleware', 3],
  ['elasticsearch-config', 'middleware', 4],
  ['prometheus-config', 'monitoring', 12],
  ['grafana-config', 'monitoring', 3],
];
cmData.forEach(c => insertCm.run(uuidv4(), c[0], c[1], c[2], new Date().toISOString()));

const insertSecret = db.prepare(
  'INSERT INTO secrets (id, name, namespace, type, created_at) VALUES (?, ?, ?, ?, ?)'
);
const secretData = [
  ['payment-db-creds', 'production', 'Opaque'],
  ['payment-tls', 'production', 'kubernetes.io/tls'],
  ['redis-creds', 'middleware', 'Opaque'],
  ['elasticsearch-creds', 'middleware', 'Opaque'],
  ['grafana-admin', 'monitoring', 'Opaque'],
  ['nginx-tls', 'ingress-nginx', 'kubernetes.io/tls'],
];
secretData.forEach(s => insertSecret.run(uuidv4(), s[0], s[1], s[2], new Date().toISOString()));

const insertEvent = db.prepare(
  'INSERT INTO events (id, cluster_id, namespace, type, reason, message, object_kind, object_name, count, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
const eventData = [
  [c1, 'monitoring', 'Warning', 'BackOff', 'Back-off restarting failed container grafana', 'Pod', 'grafana-5c7d8f6', 15, new Date(Date.now() - 300000).toISOString()],
  [c1, 'middleware', 'Warning', 'ImagePullBackOff', 'Failed to pull image elasticsearch:8.11.1', 'Pod', 'elasticsearch-0', 3, new Date(Date.now() - 600000).toISOString()],
  [c1, 'middleware', 'Warning', 'CrashLoopBackOff', 'Container elasticsearch is crashing', 'Pod', 'elasticsearch-1', 8, new Date(Date.now() - 120000).toISOString()],
  [c1, 'production', 'Warning', 'Unhealthy', 'Readiness probe failed: HTTP 503', 'Pod', 'payment-service-7b8f9', 4, new Date(Date.now() - 180000).toISOString()],
  [c1, 'kube-system', 'Warning', 'NodeNotReady', 'Node prod-node-7 is not ready', 'Node', 'prod-node-7', 6, new Date(Date.now() - 3600000).toISOString()],
  [c1, 'production', 'Warning', 'OOMKilled', 'Container payment-service was OOM killed', 'Pod', 'payment-service-7b8f9c', 2, new Date(Date.now() - 600000).toISOString()],
  [c1, 'production', 'Normal', 'Scheduled', 'Successfully assigned to node prod-node-3', 'Pod', 'nginx-gateway-x9k2l', 1, new Date(Date.now() - 1000000).toISOString()],
  [c1, 'production', 'Normal', 'Pulled', 'Container image pulled successfully', 'Pod', 'order-service-abc123', 1, new Date(Date.now() - 500000).toISOString()],
  [c1, 'middleware', 'Normal', 'Started', 'Container started', 'Pod', 'redis-master-0', 1, new Date(Date.now() - 1500000).toISOString()],
  [c1, 'production', 'Warning', 'Evicted', 'Pod evicted due to resource pressure', 'Pod', 'user-service-x7k3m', 1, new Date(Date.now() - 7200000).toISOString()],
  [c1, 'production', 'Warning', 'FailedMount', 'Unable to mount configmap nginx-gateway-config', 'Pod', 'nginx-gateway-z4n8p', 2, new Date(Date.now() - 300000).toISOString()],
  [c1, 'monitoring', 'Normal', 'Pulled', 'Image prom/prometheus:v2.47.2 pulled', 'Pod', 'prometheus-0', 1, new Date(Date.now() - 2000000).toISOString()],
  [c1, 'ingress-nginx', 'Normal', 'ServiceExternalProvisioned', 'Load balancer provisioned', 'Service', 'ingress-nginx-controller', 1, new Date(Date.now() - 86400000).toISOString()],
  [c3, 'development', 'Warning', 'NodeNotReady', 'Node dev-node-4 is not ready', 'Node', 'dev-node-4', 3, new Date(Date.now() - 3600000).toISOString()],
  [c2, 'staging', 'Warning', 'ImagePullBackOff', 'Failed to pull image payment-service:v2.2.0-rc1', 'Pod', 'payment-service-staging-1', 1, new Date(Date.now() - 1200000).toISOString()],
  [c1, 'production', 'Normal', 'ScalingReplicaSet', 'Scaled up replicas to 4', 'ReplicaSet', 'payment-service-7b8f9c', 1, new Date(Date.now() - 43200000).toISOString()],
  [c1, 'middleware', 'Warning', 'FailedScheduling', '0/10 nodes available for elasticsearch', 'Pod', 'elasticsearch-2', 1, new Date(Date.now() - 900000).toISOString()],
  [c1, 'production', 'Warning', 'LivenessProbeFailed', 'Liveness probe failed for user-service', 'Pod', 'user-service-x7k3m', 3, new Date(Date.now() - 240000).toISOString()],
  [c1, 'monitoring', 'Normal', 'Created', 'Pod created', 'Pod', 'grafana-5c7d8f6b9', 1, new Date(Date.now() - 43200000).toISOString()],
  [c3, 'development', 'Warning', 'DiskPressure', 'Node dev-node-3 has disk pressure', 'Node', 'dev-node-3', 2, new Date(Date.now() - 1800000).toISOString()],
];
eventData.forEach(e => insertEvent.run(uuidv4(), e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]));

const insertRelease = db.prepare(
  'INSERT INTO release_records (id, cluster_id, namespace, workload_name, old_image, new_image, cpu_limit, memory_limit, health_check, gray_ratio, rollback_point, change_reason, on_duty, status, operator, created_at, approved_at, completed_at, approver) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
const r1 = uuidv4();
const r2 = uuidv4();
insertRelease.run(r1, c1, 'middleware', 'elasticsearch', 'elasticsearch:v1.0.0', 'elasticsearch:8.11.1', '4000m', '4Gi', 1, 0, 'stable-v1', '版本升级修复安全漏洞', 'sre-li', 'completed', 'admin',
  new Date(Date.now() - 86400000).toISOString(), new Date(Date.now() - 82800000).toISOString(), new Date(Date.now() - 79200000).toISOString(), 'admin');
insertRelease.run(r2, c1, 'monitoring', 'prometheus', 'prom/prometheus:v1.0.0', 'prom/prometheus:v2.47.2', '2000m', '4Gi', 1, 50, 'release-v2', '新版本支持更多指标', 'sre-wang', 'pending', 'operator',
  new Date(Date.now() - 3600000).toISOString(), null, null, null);

const insertPerm = db.prepare(
  'INSERT INTO permissions (id, user_id, cluster_id, namespace, action) VALUES (?, ?, ?, ?, ?)'
);
insertPerm.run(uuidv4(), operatorId, null, null, 'view');
insertPerm.run(uuidv4(), operatorId, null, null, 'publish');
insertPerm.run(uuidv4(), operatorId, null, null, 'delete');
insertPerm.run(uuidv4(), viewerId, null, null, 'view');

const insertLog = db.prepare(
  'INSERT INTO operation_logs (id, user_id, username, action, resource_type, resource_name, cluster_id, namespace, detail, risk_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
insertLog.run(uuidv4(), adminId, 'admin', 'login', 'auth', 'admin', null, null, '用户登录', 'low', new Date(Date.now() - 7200000).toISOString());
insertLog.run(uuidv4(), adminId, 'admin', 'create_release', 'release', 'elasticsearch', c1, 'middleware', '创建发布单: elasticsearch elasticsearch:v1.0.0 -> elasticsearch:8.11.1, 灰度: 0%, 值班: sre-li, 原因: 版本升级修复安全漏洞', 'high', new Date(Date.now() - 86400000).toISOString());
insertLog.run(uuidv4(), adminId, 'admin', 'approve_release', 'release', 'elasticsearch', c1, 'middleware', '审批通过发布单: elasticsearch elasticsearch:v1.0.0 -> elasticsearch:8.11.1', 'high', new Date(Date.now() - 82800000).toISOString());
insertLog.run(uuidv4(), adminId, 'admin', 'execute_release', 'release', 'elasticsearch', c1, 'middleware', '执行发布: elasticsearch -> elasticsearch:8.11.1, 回滚点: stable-v1', 'high', new Date(Date.now() - 79200000).toISOString());
insertLog.run(uuidv4(), operatorId, 'operator', 'create_release', 'release', 'prometheus', c1, 'monitoring', '创建发布单: prometheus prom/prometheus:v1.0.0 -> prom/prometheus:v2.47.2, 灰度: 50%, 值班: sre-wang, 原因: 新版本支持更多指标', 'high', new Date(Date.now() - 3600000).toISOString());

const insertCert = db.prepare(
  'INSERT INTO certificates (id, cluster_id, name, namespace, issuer, not_before, not_after, days_remaining, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
const certs = [
  [c1, 'api-server-tls', 'kube-system', 'kube-ca', '2025-05-01T00:00:00Z', '2026-06-01T00:00:00Z', 7, 'expiring_soon'],
  [c1, 'wildcard-example-com', 'production', 'lets-encrypt', '2026-01-01T00:00:00Z', '2026-07-01T00:00:00Z', 37, 'valid'],
  [c1, 'grafana-tls', 'monitoring', 'lets-encrypt', '2026-02-01T00:00:00Z', '2026-08-01T00:00:00Z', 68, 'valid'],
  [c1, 'etcd-peer', 'kube-system', 'kube-ca', '2025-04-15T00:00:00Z', '2026-04-15T00:00:00Z', -40, 'expired'],
];
certs.forEach(c => insertCert.run(uuidv4(), c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], new Date().toISOString()));

const insertReport = db.prepare(
  'INSERT INTO inspection_reports (id, cluster_id, report_date, restart_count, pending_pods, oversold_resources, image_pull_failures, high_risk_changes, total_score, issues, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
const issues1 = JSON.stringify([
  '6 个 Pod 存在重启',
  '1 个 Pod 处于 Pending 状态',
  '3 次镜像拉取失败',
  '1 个高风险变更待审批',
  '1 个节点处于 NotReady 状态',
  '1 个证书即将到期',
  '1 个证书已过期',
]);
insertReport.run(uuidv4(), c1, '2026-05-25', 6, 1, 2, 3, 1, 32, issues1, 'admin', new Date(Date.now() - 3600000).toISOString());

console.log('\nDatabase reset complete! Seeded:');
console.log('  Users: 3 (admin/admin123, operator/op123, viewer/view123)');
console.log('  Clusters: 3');
console.log('  Nodes: 20');
console.log('  Namespaces: 13');
console.log('  Workloads: 14');
console.log('  Pods: 36+');
console.log('  Events: 20');
console.log('  Certificates: 4');
console.log('  Release records: 2');
console.log('  Permissions: 4');
console.log('  Operation logs: 5');
console.log('  Inspection reports: 1');