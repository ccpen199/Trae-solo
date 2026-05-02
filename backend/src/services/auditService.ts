import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/database.js';
import { UserRole } from '../types/index.js';

export interface AuditLogParams {
  action: string;
  entityType: string;
  entityId: string;
  businessOrderId?: string;
  operatorId: string;
  operatorRole: string;
  oldValue?: any;
  newValue: any;
  details?: string;
}

export class AuditService {
  static async log(params: AuditLogParams): Promise<void> {
    const db = await getDb();
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const oldValueStr = params.oldValue !== undefined 
      ? JSON.stringify(params.oldValue) 
      : null;
    const newValueStr = JSON.stringify(params.newValue);
    
    await db.run(`
      INSERT INTO audit_logs (
        id, action, entity_type, entity_id, business_order_id,
        operator_id, operator_role, old_value, new_value, details, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      params.action,
      params.entityType,
      params.entityId,
      params.businessOrderId || null,
      params.operatorId,
      params.operatorRole,
      oldValueStr,
      newValueStr,
      params.details || null,
      now
    ]);
    
    await db.close();
    console.log(`[AUDIT] ${params.operatorRole} ${params.operatorId} performed ${params.action} on ${params.entityType} ${params.entityId}`);
  }

  static async getLogsByEntity(entityType: string, entityId: string): Promise<any[]> {
    const db = await getDb();
    
    const logs = await db.all(`
      SELECT * FROM audit_logs 
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC
    `, [entityType, entityId]);
    
    await db.close();
    return logs;
  }

  static async getLogsByOperator(operatorId: string, limit: number = 100): Promise<any[]> {
    const db = await getDb();
    
    const logs = await db.all(`
      SELECT * FROM audit_logs 
      WHERE operator_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [operatorId, limit]);
    
    await db.close();
    return logs;
  }

  static async getLogsByBusinessOrder(businessOrderId: string): Promise<any[]> {
    const db = await getDb();
    
    const logs = await db.all(`
      SELECT * FROM audit_logs 
      WHERE business_order_id = ?
      ORDER BY created_at ASC
    `, [businessOrderId]);
    
    await db.close();
    return logs;
  }

  static async getAuditTrail(startDate: Date, endDate: Date): Promise<any[]> {
    const db = await getDb();
    
    const logs = await db.all(`
      SELECT * FROM audit_logs 
      WHERE created_at BETWEEN ? AND ?
      ORDER BY created_at ASC
    `, [startDate.toISOString(), endDate.toISOString()]);
    
    await db.close();
    return logs;
  }
}

export const auditActions = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ACTIVATE: 'ACTIVATE',
  DEACTIVATE: 'DEACTIVATE',
  PURCHASE: 'PURCHASE',
  DEDUCT: 'DEDUCT',
  RESERVE: 'RESERVE',
  CANCEL: 'CANCEL',
  CHECK_IN: 'CHECK_IN',
  CHECK_OUT: 'CHECK_OUT',
  VERIFY: 'VERIFY',
  ASSIGN: 'ASSIGN',
  RESOLVE: 'RESOLVE',
  EXPORT: 'EXPORT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT'
};
