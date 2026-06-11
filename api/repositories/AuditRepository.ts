import { db, generateId, now } from '../data/database';
import type { AuditRecord, Content, ContentStatus, PageResponse } from '../../shared/types';

export interface AuditRecordQueryParams {
  page?: number;
  pageSize?: number;
  contentId?: string;
  auditorId?: string;
  level?: 1 | 2 | 3;
  action?: 'submit' | 'approve' | 'reject';
}

export interface PendingAuditQueryParams {
  page?: number;
  pageSize?: number;
  level?: 1 | 2 | 3;
  type?: string;
  category?: string;
  region?: string;
  keyword?: string;
}

export class AuditRepository {
  async findRecordsByContentId(contentId: string): Promise<AuditRecord[]> {
    return db.auditRecords.get(contentId) || [];
  }

  async findAllRecords(params: AuditRecordQueryParams = {}): Promise<PageResponse<AuditRecord>> {
    const { page = 1, pageSize = 10, contentId, auditorId, level, action } = params;
    
    let records: AuditRecord[] = [];
    
    if (contentId) {
      records = db.auditRecords.get(contentId) || [];
    } else {
      for (const [, contentRecords] of db.auditRecords) {
        records.push(...contentRecords);
      }
    }

    if (auditorId) {
      records = records.filter(r => r.auditorId === auditorId);
    }
    if (level) {
      records = records.filter(r => r.level === level);
    }
    if (action) {
      records = records.filter(r => r.action === action);
    }

    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = records.length;
    const start = (page - 1) * pageSize;
    const list = records.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async addRecord(recordData: Omit<AuditRecord, 'id' | 'createdAt'>): Promise<AuditRecord> {
    const record: AuditRecord = {
      ...recordData,
      id: generateId(),
      createdAt: now(),
    };

    const existing = db.auditRecords.get(record.contentId) || [];
    existing.push(record);
    db.auditRecords.set(record.contentId, existing);

    return record;
  }

  async findPendingAudits(params: PendingAuditQueryParams = {}): Promise<PageResponse<{ id: string; content: Content; currentLevel: 1 | 2 | 3 }>> {
    const { page = 1, pageSize = 10, level, type, category, region, keyword } = params;
    
    const pendingStatuses: ContentStatus[] = ['pending_audit', 'auditing'];
    const pendingContents = Array.from(db.contents.values())
      .filter(c => pendingStatuses.includes(c.status));

    const audits = pendingContents.map(content => {
      const records = db.auditRecords.get(content.id) || [];
      const approveRecords = records.filter(r => r.action === 'approve');
      const currentLevel = Math.min((approveRecords.length + 1) as 1 | 2 | 3, 3) as 1 | 2 | 3;
      return { id: content.id, content, currentLevel };
    });

    let filtered = audits;

    if (level) {
      filtered = filtered.filter(a => a.currentLevel === level);
    }
    if (type) {
      filtered = filtered.filter(a => a.content.type === type);
    }
    if (category) {
      filtered = filtered.filter(a => a.content.category === category);
    }
    if (region) {
      filtered = filtered.filter(a => a.content.region === region);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(a => 
        a.content.title.toLowerCase().includes(kw) || 
        a.content.summary.toLowerCase().includes(kw)
      );
    }

    filtered.sort((a, b) => 
      new Date(b.content.updatedAt).getTime() - new Date(a.content.updatedAt).getTime()
    );

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async getCurrentAuditLevel(contentId: string): Promise<1 | 2 | 3> {
    const records = db.auditRecords.get(contentId) || [];
    const approveRecords = records.filter(r => r.action === 'approve');
    return Math.min((approveRecords.length + 1) as 1 | 2 | 3, 3) as 1 | 2 | 3;
  }

  async isContentApproved(contentId: string): Promise<boolean> {
    const records = db.auditRecords.get(contentId) || [];
    const approveRecords = records.filter(r => r.action === 'approve');
    return approveRecords.length >= 3;
  }

  async hasRejectionRecord(contentId: string): Promise<boolean> {
    const records = db.auditRecords.get(contentId) || [];
    return records.some(r => r.action === 'reject');
  }

  async clearRecordsForContent(contentId: string): Promise<void> {
    db.auditRecords.delete(contentId);
  }
}

export const auditRepository = new AuditRepository();
