import { query } from '../config/database.js';
import type { AuditLog, User } from '../types/index.js';

const AUDIT_JSON_FIELDS = ['oldValue', 'newValue'];

function mapUserRow(row: Record<string, unknown>): User | undefined {
  const id = row.user_id;
  if (!id) return undefined;

  return {
    id: id as number,
    username: row.user_username as string,
    name: row.user_name as string,
    role: row.user_role as User['role'],
    phone: row.user_phone as string,
    email: row.user_email as string | undefined,
    status: row.user_status as User['status'],
    createdAt: row.user_createdAt as string
  };
}

function mapAuditLogRow(row: Record<string, unknown>): AuditLog {
  return {
    id: row.id as number,
    userId: row.userId as number,
    user: mapUserRow(row),
    role: row.role as AuditLog['role'],
    action: row.action as string,
    resourceType: row.resourceType as string,
    resourceId: row.resourceId as number | undefined,
    ipAddress: row.ipAddress as string,
    userAgent: row.userAgent as string,
    oldValue: row.oldValue,
    newValue: row.newValue,
    changeSummary: row.changeSummary as string | undefined,
    createdAt: row.createdAt as string
  };
}

export async function getAuditLogs(filters?: {
  userId?: number;
  action?: string;
  resourceType?: string;
  startTime?: string;
  endTime?: string;
}): Promise<AuditLog[]> {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.userId !== undefined) {
    conditions.push('al.user_id = ?');
    params.push(filters.userId);
  }

  if (filters?.action !== undefined) {
    conditions.push('al.action = ?');
    params.push(filters.action);
  }

  if (filters?.resourceType !== undefined) {
    conditions.push('al.resource_type = ?');
    params.push(filters.resourceType);
  }

  if (filters?.startTime !== undefined) {
    conditions.push('al.created_at >= ?');
    params.push(filters.startTime);
  }

  if (filters?.endTime !== undefined) {
    conditions.push('al.created_at <= ?');
    params.push(filters.endTime);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      al.id, al.user_id as userId, al.role, al.action, al.resource_type as resourceType,
      al.resource_id as resourceId, al.ip_address as ipAddress, al.user_agent as userAgent,
      al.old_value_json as oldValue, al.new_value_json as newValue, al.change_summary as changeSummary,
      al.created_at as createdAt,
      u.id as user_id, u.username as user_username, u.name as user_name,
      u.role as user_role, u.phone as user_phone, u.email as user_email,
      u.status as user_status, u.created_at as user_createdAt
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT 200
  `;

  const rows = query<Record<string, unknown>>(sql, params, AUDIT_JSON_FIELDS);

  return rows.map(mapAuditLogRow);
}
