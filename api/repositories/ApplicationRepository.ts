import { BaseRepository } from './BaseRepository.js';
import { Application, ApplicationTimelineItem, ApprovalNode } from '../types/index.js';
import db from '../db.js';

export class ApplicationRepository extends BaseRepository<Application> {
  constructor() {
    super('applications');
  }

  findByApplicationNo(applicationNo: string): Application | undefined {
    return this.findByField('application_no', applicationNo);
  }

  findByApplicantId(applicantId: number, status?: string, page: number = 1, pageSize: number = 10) {
    const conditions: string[] = ['applicant_id = ?'];
    const params: any[] = [applicantId];
    
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }
    
    const where = conditions.join(' AND ');
    return this.paginate(page, pageSize, where, params);
  }

  findWithServiceName(applicantId: number, status?: string, page: number = 1, pageSize: number = 10) {
    const conditions: string[] = ['a.applicant_id = ?'];
    const params: any[] = [applicantId];
    
    if (status && status !== 'all') {
      conditions.push('a.status = ?');
      params.push(status);
    }
    
    const where = conditions.join(' AND ');
    const offset = (page - 1) * pageSize;
    
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM applications a
      WHERE ${where}
    `);
    const { count } = countStmt.get(...params) as { count: number };
    
    const dataStmt = db.prepare(`
      SELECT a.*, s.name as service_name
      FROM applications a
      LEFT JOIN service_items s ON a.service_id = s.id
      WHERE ${where}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const data = dataStmt.all(...params, pageSize, offset) as Array<Application & { service_name: string }>;
    
    return { 
      data: data.map(d => ({ ...d, serviceName: d.service_name })), 
      total: count, 
      page, 
      pageSize 
    };
  }

  getTimeline(applicationId: number): ApplicationTimelineItem[] {
    const stmt = db.prepare(`
      SELECT an.node_name, an.action, an.comment, an.handled_at as timestamp, u.name as operator
      FROM approval_nodes an
      LEFT JOIN users u ON an.operator_id = u.id
      WHERE an.application_id = ?
      ORDER BY an.created_at ASC
    `);
    const rows = stmt.all(applicationId) as Array<{
      node_name: string;
      action: string;
      comment: string;
      timestamp: string;
      operator: string;
    }>;
    
    return rows.map(r => ({
      nodeName: r.node_name,
      action: r.action,
      comment: r.comment,
      timestamp: r.timestamp,
      operator: r.operator || '系统',
    }));
  }

  addApprovalNode(node: Omit<ApprovalNode, 'id' | 'createdAt'>): number {
    const stmt = db.prepare(`
      INSERT INTO approval_nodes (application_id, flow_id, node_name, department, operator_id, action, comment, handled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      node.applicationId, 
      node.flowId, 
      node.nodeName, 
      node.department, 
      node.operatorId, 
      node.action, 
      node.comment, 
      node.handledAt
    );
    return Number(result.lastInsertRowid);
  }

  addMaterial(material: {
    applicationId: number;
    materialName: string;
    materialType?: string;
    fileHash?: string;
    filePath?: string;
    isFromLicense: boolean;
    licenseId?: number;
  }): number {
    const stmt = db.prepare(`
      INSERT INTO application_materials (application_id, material_name, material_type, file_hash, file_path, is_from_license, license_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      material.applicationId,
      material.materialName,
      material.materialType,
      material.fileHash,
      material.filePath,
      material.isFromLicense ? 1 : 0,
      material.licenseId
    );
    return Number(result.lastInsertRowid);
  }

  getStatsByStatus(): Array<{ status: string; count: number }> {
    const stmt = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM applications 
      GROUP BY status
    `);
    return stmt.all() as Array<{ status: string; count: number }>;
  }
}
