import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import {
  User, Cluster, Namespace, Workload, Pod, Service, Ingress, ConfigMap, Secret,
  Event, ReleaseRecord, Permission, OperationLog, InspectionReport, Node, Certificate
} from '../types';

// ========== Users ==========

const insertUserStmt = db.prepare(`
  INSERT INTO users (id, username, password_hash, role)
  VALUES (?, ?, ?, ?)
`);

const findUserByUsernameStmt = db.prepare(`
  SELECT * FROM users WHERE username = ?
`);

const findUserByIdStmt = db.prepare(`
  SELECT id, username, role, created_at FROM users WHERE id = ?
`);

const listUsersStmt = db.prepare(`
  SELECT id, username, role, created_at FROM users ORDER BY created_at DESC
`);

export const UserModel = {
  create(username: string, passwordHash: string, role: string): string {
    const id = uuidv4();
    insertUserStmt.run(id, username, passwordHash, role);
    return id;
  },

  findByUsername(username: string): User | undefined {
    return findUserByUsernameStmt.get(username) as User | undefined;
  },

  findById(id: string): Omit<User, 'password_hash'> | undefined {
    return findUserByIdStmt.get(id) as Omit<User, 'password_hash'> | undefined;
  },

  list(): Omit<User, 'password_hash'>[] {
    return listUsersStmt.all() as Omit<User, 'password_hash'>[];
  }
};

// ========== Clusters ==========

const insertClusterStmt = db.prepare(`
  INSERT INTO clusters (id, name, description, api_server, status, node_count)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const updateClusterStmt = db.prepare(`
  UPDATE clusters SET name = ?, description = ?, api_server = ?, status = ?, node_count = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const deleteClusterStmt = db.prepare('DELETE FROM clusters WHERE id = ?');
const findClusterStmt = db.prepare('SELECT * FROM clusters WHERE id = ?');
const listClustersStmt = db.prepare('SELECT * FROM clusters ORDER BY created_at DESC');

export const ClusterModel = {
  create(data: Omit<Cluster, 'id' | 'created_at' | 'updated_at'>): string {
    const id = uuidv4();
    insertClusterStmt.run(id, data.name, data.description, data.api_server, data.status, data.node_count);
    return id;
  },

  update(id: string, data: Partial<Omit<Cluster, 'id' | 'created_at' | 'updated_at'>>): void {
    const existing = findClusterStmt.get(id) as Cluster | undefined;
    if (!existing) return;
    updateClusterStmt.run(
      data.name ?? existing.name,
      data.description ?? existing.description,
      data.api_server ?? existing.api_server,
      data.status ?? existing.status,
      data.node_count ?? existing.node_count,
      id
    );
  },

  delete(id: string): void {
    deleteClusterStmt.run(id);
  },

  findById(id: string): Cluster | undefined {
    return findClusterStmt.get(id) as Cluster | undefined;
  },

  list(): Cluster[] {
    return listClustersStmt.all() as Cluster[];
  }
};

// ========== Namespaces ==========

const insertNamespaceStmt = db.prepare(`
  INSERT INTO namespaces (id, cluster_id, name, description, status)
  VALUES (?, ?, ?, ?, ?)
`);

const updateNamespaceStmt = db.prepare(`
  UPDATE namespaces SET name = ?, description = ?, status = ? WHERE id = ?
`);

const deleteNamespaceStmt = db.prepare('DELETE FROM namespaces WHERE id = ?');
const findNamespaceStmt = db.prepare('SELECT * FROM namespaces WHERE id = ?');
const listNamespacesByClusterStmt = db.prepare('SELECT * FROM namespaces WHERE cluster_id = ? ORDER BY created_at DESC');

export const NamespaceModel = {
  create(data: Omit<Namespace, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertNamespaceStmt.run(id, data.cluster_id, data.name, data.description, data.status);
    return id;
  },

  update(id: string, data: Partial<Omit<Namespace, 'id' | 'cluster_id' | 'created_at'>>): void {
    const existing = findNamespaceStmt.get(id) as Namespace | undefined;
    if (!existing) return;
    updateNamespaceStmt.run(
      data.name ?? existing.name,
      data.description ?? existing.description,
      data.status ?? existing.status,
      id
    );
  },

  delete(id: string): void {
    deleteNamespaceStmt.run(id);
  },

  findById(id: string): Namespace | undefined {
    return findNamespaceStmt.get(id) as Namespace | undefined;
  },

  listByCluster(clusterId: string): Namespace[] {
    return listNamespacesByClusterStmt.all(clusterId) as Namespace[];
  }
};

// ========== Workloads ==========

const insertWorkloadStmt = db.prepare(`
  INSERT INTO workloads (id, cluster_id, namespace, name, type, replicas, ready_replicas, image, cpu_request, memory_request, cpu_limit, memory_limit, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateWorkloadStmt = db.prepare(`
  UPDATE workloads SET namespace = ?, name = ?, type = ?, replicas = ?, ready_replicas = ?, image = ?,
    cpu_request = ?, memory_request = ?, cpu_limit = ?, memory_limit = ?, status = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const deleteWorkloadStmt = db.prepare('DELETE FROM workloads WHERE id = ?');
const findWorkloadStmt = db.prepare('SELECT * FROM workloads WHERE id = ?');
const listWorkloadsByClusterStmt = db.prepare('SELECT * FROM workloads WHERE cluster_id = ? ORDER BY created_at DESC');

export const WorkloadModel = {
  create(data: Omit<Workload, 'id' | 'created_at' | 'updated_at'>): string {
    const id = uuidv4();
    insertWorkloadStmt.run(
      id, data.cluster_id, data.namespace, data.name, data.type,
      data.replicas, data.ready_replicas, data.image,
      data.cpu_request, data.memory_request, data.cpu_limit, data.memory_limit, data.status
    );
    return id;
  },

  update(id: string, data: Partial<Omit<Workload, 'id' | 'cluster_id' | 'created_at' | 'updated_at'>>): void {
    const existing = findWorkloadStmt.get(id) as Workload | undefined;
    if (!existing) return;
    updateWorkloadStmt.run(
      data.namespace ?? existing.namespace,
      data.name ?? existing.name,
      data.type ?? existing.type,
      data.replicas ?? existing.replicas,
      data.ready_replicas ?? existing.ready_replicas,
      data.image ?? existing.image,
      data.cpu_request ?? existing.cpu_request,
      data.memory_request ?? existing.memory_request,
      data.cpu_limit ?? existing.cpu_limit,
      data.memory_limit ?? existing.memory_limit,
      data.status ?? existing.status,
      id
    );
  },

  delete(id: string): void {
    deleteWorkloadStmt.run(id);
  },

  findById(id: string): Workload | undefined {
    return findWorkloadStmt.get(id) as Workload | undefined;
  },

  listByCluster(clusterId: string): Workload[] {
    return listWorkloadsByClusterStmt.all(clusterId) as Workload[];
  }
};

// ========== Pods ==========

const insertPodStmt = db.prepare(`
  INSERT INTO pods (id, workload_id, name, namespace, node_name, status, restart_count, image, started_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const listPodsByWorkloadStmt = db.prepare('SELECT * FROM pods WHERE workload_id = ? ORDER BY created_at DESC');

export const PodModel = {
  create(data: Omit<Pod, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertPodStmt.run(id, data.workload_id, data.name, data.namespace, data.node_name, data.status, data.restart_count, data.image, data.started_at);
    return id;
  },

  listByWorkload(workloadId: string): Pod[] {
    return listPodsByWorkloadStmt.all(workloadId) as Pod[];
  }
};

// ========== Services ==========

const insertServiceStmt = db.prepare(`
  INSERT INTO services (id, workload_id, name, namespace, type, cluster_ip, ports)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const listServicesByWorkloadStmt = db.prepare('SELECT * FROM services WHERE workload_id = ? ORDER BY created_at DESC');

export const ServiceModel = {
  create(data: Omit<Service, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertServiceStmt.run(id, data.workload_id, data.name, data.namespace, data.type, data.cluster_ip, data.ports);
    return id;
  },

  listByWorkload(workloadId: string): Service[] {
    return listServicesByWorkloadStmt.all(workloadId) as Service[];
  }
};

// ========== Ingresses ==========

const insertIngressStmt = db.prepare(`
  INSERT INTO ingresses (id, name, namespace, host, paths, service_name)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const listIngressesByWorkloadStmt = db.prepare(`
  SELECT i.* FROM ingresses i
  WHERE i.namespace = (SELECT namespace FROM workloads WHERE id = ?)
  ORDER BY i.created_at DESC
`);

export const IngressModel = {
  create(data: Omit<Ingress, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertIngressStmt.run(id, data.name, data.namespace, data.host, data.paths, data.service_name);
    return id;
  },

  listByWorkload(workloadId: string): Ingress[] {
    return listIngressesByWorkloadStmt.all(workloadId) as Ingress[];
  }
};

// ========== ConfigMaps ==========

const insertConfigMapStmt = db.prepare(`
  INSERT INTO config_maps (id, name, namespace, data_count)
  VALUES (?, ?, ?, ?)
`);

const listConfigMapsByWorkloadStmt = db.prepare(`
  SELECT * FROM config_maps WHERE namespace = (SELECT namespace FROM workloads WHERE id = ?)
  ORDER BY created_at DESC
`);

export const ConfigMapModel = {
  create(data: Omit<ConfigMap, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertConfigMapStmt.run(id, data.name, data.namespace, data.data_count);
    return id;
  },

  listByWorkload(workloadId: string): ConfigMap[] {
    return listConfigMapsByWorkloadStmt.all(workloadId) as ConfigMap[];
  }
};

// ========== Secrets ==========

const insertSecretStmt = db.prepare(`
  INSERT INTO secrets (id, name, namespace, type)
  VALUES (?, ?, ?, ?)
`);

const listSecretsByWorkloadStmt = db.prepare(`
  SELECT * FROM secrets WHERE namespace = (SELECT namespace FROM workloads WHERE id = ?)
  ORDER BY created_at DESC
`);

export const SecretModel = {
  create(data: Omit<Secret, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertSecretStmt.run(id, data.name, data.namespace, data.type);
    return id;
  },

  listByWorkload(workloadId: string): Secret[] {
    return listSecretsByWorkloadStmt.all(workloadId) as Secret[];
  }
};

// ========== Events ==========

const insertEventStmt = db.prepare(`
  INSERT INTO events (id, cluster_id, namespace, type, reason, message, object_kind, object_name, count, last_seen)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const findEventStmt = db.prepare('SELECT * FROM events WHERE id = ?');
const listEventsByClusterStmt = db.prepare('SELECT * FROM events WHERE cluster_id = ? ORDER BY created_at DESC LIMIT 200');
const listEventsByWorkloadStmt = db.prepare(`
  SELECT * FROM events WHERE cluster_id = ? AND namespace = ? AND object_name = ?
  ORDER BY created_at DESC LIMIT 100
`);

export const EventModel = {
  create(data: Omit<Event, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertEventStmt.run(
      id, data.cluster_id, data.namespace, data.type, data.reason,
      data.message, data.object_kind, data.object_name, data.count, data.last_seen
    );
    return id;
  },

  findById(id: string): Event | undefined {
    return findEventStmt.get(id) as Event | undefined;
  },

  listByCluster(clusterId: string): Event[] {
    return listEventsByClusterStmt.all(clusterId) as Event[];
  },

  listByWorkload(clusterId: string, namespace: string, workloadName: string): Event[] {
    return listEventsByWorkloadStmt.all(clusterId, namespace, workloadName) as Event[];
  }
};

// ========== Release Records ==========

const insertReleaseStmt = db.prepare(`
  INSERT INTO release_records (id, cluster_id, namespace, workload_name, old_image, new_image, cpu_limit, memory_limit, health_check, gray_ratio, rollback_point, change_reason, on_duty, status, operator)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateReleaseStmt = db.prepare(`
  UPDATE release_records
  SET status = ?, approver = ?, approved_at = ?, completed_at = ?, rollback_point = ?, change_reason = ?, on_duty = ?
  WHERE id = ?
`);

const findReleaseStmt = db.prepare('SELECT * FROM release_records WHERE id = ?');
const listReleasesStmt = db.prepare('SELECT * FROM release_records ORDER BY created_at DESC LIMIT 100');
const listReleasesByWorkloadStmt = db.prepare(`
  SELECT * FROM release_records WHERE cluster_id = ? AND namespace = ? AND workload_name = ?
  ORDER BY created_at DESC
`);
const deleteReleaseStmt = db.prepare('DELETE FROM release_records WHERE id = ?');

export const ReleaseRecordModel = {
  create(data: Omit<ReleaseRecord, 'id' | 'created_at' | 'approved_at' | 'completed_at'>): string {
    const id = uuidv4();
    insertReleaseStmt.run(
      id, data.cluster_id, data.namespace, data.workload_name,
      data.old_image, data.new_image, data.cpu_limit, data.memory_limit,
      data.health_check, data.gray_ratio, data.rollback_point,
      data.change_reason, data.on_duty, data.status, data.operator
    );
    return id;
  },

  update(id: string, data: Partial<Pick<ReleaseRecord, 'status' | 'approver' | 'approved_at' | 'completed_at' | 'rollback_point' | 'change_reason' | 'on_duty'>>): void {
    const existing = findReleaseStmt.get(id) as ReleaseRecord | undefined;
    if (!existing) return;
    updateReleaseStmt.run(
      data.status ?? existing.status,
      data.approver ?? existing.approver,
      data.approved_at ?? existing.approved_at,
      data.completed_at ?? existing.completed_at,
      data.rollback_point ?? existing.rollback_point,
      data.change_reason ?? existing.change_reason,
      data.on_duty ?? existing.on_duty,
      id
    );
  },

  findById(id: string): ReleaseRecord | undefined {
    return findReleaseStmt.get(id) as ReleaseRecord | undefined;
  },

  list(): ReleaseRecord[] {
    return listReleasesStmt.all() as ReleaseRecord[];
  },

  listByWorkload(clusterId: string, namespace: string, workloadName: string): ReleaseRecord[] {
    return listReleasesByWorkloadStmt.all(clusterId, namespace, workloadName) as ReleaseRecord[];
  },

  delete(id: string): void {
    deleteReleaseStmt.run(id);
  }
};

// ========== Permissions ==========

const insertPermissionStmt = db.prepare(`
  INSERT INTO permissions (id, user_id, cluster_id, namespace, action)
  VALUES (?, ?, ?, ?, ?)
`);

const deletePermissionStmt = db.prepare('DELETE FROM permissions WHERE id = ?');
const listPermissionsStmt = db.prepare(`
  SELECT p.*, u.username FROM permissions p
  LEFT JOIN users u ON p.user_id = u.id
  ORDER BY p.created_at DESC
`);

export const PermissionModel = {
  create(data: Omit<Permission, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertPermissionStmt.run(id, data.user_id, data.cluster_id, data.namespace, data.action);
    return id;
  },

  delete(id: string): void {
    deletePermissionStmt.run(id);
  },

  list(): (Permission & { username: string | null })[] {
    return listPermissionsStmt.all() as (Permission & { username: string | null })[];
  }
};

// ========== Operation Logs ==========

const insertOperationLogStmt = db.prepare(`
  INSERT INTO operation_logs (id, user_id, username, action, resource_type, resource_name, cluster_id, namespace, detail, risk_level)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const listOperationLogsStmt = db.prepare('SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT 200');

export const OperationLogModel = {
  create(data: Omit<OperationLog, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertOperationLogStmt.run(
      id, data.user_id, data.username, data.action,
      data.resource_type, data.resource_name, data.cluster_id,
      data.namespace, data.detail, data.risk_level
    );
    return id;
  },

  list(): OperationLog[] {
    return listOperationLogsStmt.all() as OperationLog[];
  }
};

// ========== Inspection Reports ==========

const insertInspectionReportStmt = db.prepare(`
  INSERT INTO inspection_reports (id, cluster_id, report_date, restart_count, pending_pods, oversold_resources, image_pull_failures, high_risk_changes, total_score, issues, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const listInspectionReportsStmt = db.prepare('SELECT * FROM inspection_reports WHERE cluster_id = ? ORDER BY created_at DESC LIMIT 50');
const findInspectionReportStmt = db.prepare('SELECT * FROM inspection_reports WHERE id = ?');

export const InspectionReportModel = {
  create(data: Omit<InspectionReport, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertInspectionReportStmt.run(
      id, data.cluster_id, data.report_date, data.restart_count,
      data.pending_pods, data.oversold_resources, data.image_pull_failures,
      data.high_risk_changes, data.total_score, data.issues, data.created_by
    );
    return id;
  },

  findById(id: string): InspectionReport | undefined {
    return findInspectionReportStmt.get(id) as InspectionReport | undefined;
  },

  listByCluster(clusterId: string): InspectionReport[] {
    return listInspectionReportsStmt.all(clusterId) as InspectionReport[];
  }
};

// ========== Nodes ==========

const insertNodeStmt = db.prepare(`
  INSERT INTO nodes (id, cluster_id, name, status, roles, cpu_capacity, cpu_allocatable, cpu_used, memory_capacity, memory_allocatable, memory_used, pod_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const listNodesByClusterStmt = db.prepare('SELECT * FROM nodes WHERE cluster_id = ? ORDER BY created_at DESC');

export const NodeModel = {
  create(data: Omit<Node, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertNodeStmt.run(
      id, data.cluster_id, data.name, data.status, data.roles,
      data.cpu_capacity, data.cpu_allocatable, data.cpu_used,
      data.memory_capacity, data.memory_allocatable, data.memory_used, data.pod_count
    );
    return id;
  },

  listByCluster(clusterId: string): Node[] {
    return listNodesByClusterStmt.all(clusterId) as Node[];
  }
};

// ========== Certificates ==========

const insertCertificateStmt = db.prepare(`
  INSERT INTO certificates (id, cluster_id, name, namespace, issuer, not_before, not_after, days_remaining, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const listCertificatesByClusterStmt = db.prepare('SELECT * FROM certificates WHERE cluster_id = ? ORDER BY created_at DESC');

export const CertificateModel = {
  create(data: Omit<Certificate, 'id' | 'created_at'>): string {
    const id = uuidv4();
    insertCertificateStmt.run(
      id, data.cluster_id, data.name, data.namespace, data.issuer,
      data.not_before, data.not_after, data.days_remaining, data.status
    );
    return id;
  },

  listByCluster(clusterId: string): Certificate[] {
    return listCertificatesByClusterStmt.all(clusterId) as Certificate[];
  }
};
