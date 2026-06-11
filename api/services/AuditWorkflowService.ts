import { contentRepository } from '../repositories/ContentRepository';
import { auditRepository } from '../repositories/AuditRepository';
import type { Content, AuditRecord, PageResponse } from '../../shared/types';

export interface AuditActionData {
  contentId: string;
  auditorId: string;
  auditorName: string;
  level: 1 | 2 | 3;
  action: 'approve' | 'reject';
  opinion: string;
}

export interface PendingAuditQuery {
  page?: number;
  pageSize?: number;
  level?: 1 | 2 | 3;
  type?: string;
  category?: string;
  region?: string;
  keyword?: string;
}

export interface AuditRecordQuery {
  page?: number;
  pageSize?: number;
  contentId?: string;
  auditorId?: string;
  level?: 1 | 2 | 3;
  action?: 'submit' | 'approve' | 'reject';
}

export class AuditWorkflowService {
  private readonly REQUIRED_APPROVALS = 3;

  async getPendingAudits(params: PendingAuditQuery = {}): Promise<PageResponse<{
    id: string;
    content: Content;
    currentLevel: 1 | 2 | 3;
  }>> {
    const result = await auditRepository.findPendingAudits(params);
    return {
      ...result,
      list: result.list.map(item => ({
        ...item,
        content: item.content as Content,
      })),
    };
  }

  async getAuditRecords(params: AuditRecordQuery = {}): Promise<PageResponse<AuditRecord>> {
    return auditRepository.findAllRecords(params);
  }

  async getAuditRecordsByContentId(contentId: string): Promise<AuditRecord[]> {
    return auditRepository.findRecordsByContentId(contentId);
  }

  async processAuditAction(data: AuditActionData): Promise<{
    success: boolean;
    message: string;
    content?: Content;
    auditRecord?: AuditRecord;
  }> {
    const { contentId, auditorId, auditorName, level, action, opinion } = data;

    const content = await contentRepository.findById(contentId);
    if (!content) {
      return { success: false, message: '内容不存在' };
    }

    if (content.status !== 'pending_audit' && content.status !== 'auditing') {
      return { success: false, message: '该内容当前状态不允许审核操作' };
    }

    const currentLevel = await auditRepository.getCurrentAuditLevel(contentId);
    if (level !== currentLevel) {
      return { 
        success: false, 
        message: `当前审核级别为 ${currentLevel}，请按顺序进行审核` 
      };
    }

    const existingRecords = await auditRepository.findRecordsByContentId(contentId);
    const existingLevelApproval = existingRecords.find(
      r => r.level === level && r.action === 'approve'
    );
    if (existingLevelApproval) {
      return { success: false, message: `该级别已审核通过，不能重复审核` };
    }

    const auditRecord = await auditRepository.addRecord({
      contentId,
      auditorId,
      auditorName,
      level,
      action,
      opinion,
    });

    if (action === 'reject') {
      const updatedContent = await contentRepository.updateStatus(contentId, 'rejected');
      return {
        success: true,
        message: '内容已驳回',
        content: updatedContent,
        auditRecord,
      };
    }

    const isFullyApproved = await auditRepository.isContentApproved(contentId);
    
    let updatedContent: Content | undefined;
    let message = '';

    if (isFullyApproved) {
      updatedContent = await contentRepository.updateStatus(contentId, 'approved');
      message = '三级审核全部通过，内容已审核完成';
    } else {
      updatedContent = await contentRepository.updateStatus(contentId, 'auditing');
      message = `第 ${level} 级审核通过，请进行下一级审核`;
    }

    return {
      success: true,
      message,
      content: updatedContent,
      auditRecord,
    };
  }

  async recordSubmission(contentId: string, submitterId: string, submitterName: string): Promise<AuditRecord> {
    await auditRepository.clearRecordsForContent(contentId);
    
    return auditRepository.addRecord({
      contentId,
      auditorId: submitterId,
      auditorName: submitterName,
      level: 1,
      action: 'submit',
      opinion: '提交审核',
    });
  }

  async getAuditSummary(contentId: string): Promise<{
    currentLevel: 1 | 2 | 3;
    totalApprovals: number;
    totalRejections: number;
    isApproved: boolean;
    isRejected: boolean;
    records: AuditRecord[];
    nextApproverLevel?: 1 | 2 | 3;
  }> {
    const records = await auditRepository.findRecordsByContentId(contentId);
    const approvals = records.filter(r => r.action === 'approve');
    const rejections = records.filter(r => r.action === 'reject');
    const currentLevel = await auditRepository.getCurrentAuditLevel(contentId);
    const isApproved = approvals.length >= this.REQUIRED_APPROVALS;
    const isRejected = rejections.length > 0;

    return {
      currentLevel,
      totalApprovals: approvals.length,
      totalRejections: rejections.length,
      isApproved,
      isRejected,
      records,
      nextApproverLevel: isApproved || isRejected ? undefined : currentLevel,
    };
  }

  async canAuditAtLevel(auditorPermissions: string[], level: 1 | 2 | 3): Promise<boolean> {
    const requiredPermissions: Record<1 | 2 | 3, string> = {
      1: 'audit:level1',
      2: 'audit:level2',
      3: 'audit:level3',
    };
    return auditorPermissions.includes(requiredPermissions[level]);
  }

  async revokeAudit(contentId: string, reason: string): Promise<{
    success: boolean;
    message: string;
    content?: Content;
  }> {
    const content = await contentRepository.findById(contentId);
    if (!content) {
      return { success: false, message: '内容不存在' };
    }

    if (content.status === 'published') {
      return { success: false, message: '已发布的内容不能撤销审核' };
    }

    if (content.status !== 'auditing' && content.status !== 'pending_audit') {
      return { success: false, message: '该内容当前状态不允许撤销审核' };
    }

    await auditRepository.clearRecordsForContent(contentId);
    const updatedContent = await contentRepository.updateStatus(contentId, 'draft');

    return {
      success: true,
      message: `审核已撤销，原因: ${reason}`,
      content: updatedContent,
    };
  }

  async getAuditStatistics(): Promise<{
    pendingLevel1: number;
    pendingLevel2: number;
    pendingLevel3: number;
    approvedToday: number;
    rejectedToday: number;
    totalPending: number;
  }> {
    const allPending = await auditRepository.findPendingAudits({ pageSize: 1000 });
    
    const pendingLevel1 = allPending.list.filter(a => a.currentLevel === 1).length;
    const pendingLevel2 = allPending.list.filter(a => a.currentLevel === 2).length;
    const pendingLevel3 = allPending.list.filter(a => a.currentLevel === 3).length;
    const totalPending = allPending.total;

    const today = new Date().toDateString();
    const allRecords = await auditRepository.findAllRecords({ pageSize: 1000 });
    
    const approvedToday = allRecords.list.filter(
      r => r.action === 'approve' && new Date(r.createdAt).toDateString() === today
    ).length;
    
    const rejectedToday = allRecords.list.filter(
      r => r.action === 'reject' && new Date(r.createdAt).toDateString() === today
    ).length;

    return {
      pendingLevel1,
      pendingLevel2,
      pendingLevel3,
      approvedToday,
      rejectedToday,
      totalPending,
    };
  }
}

export const auditWorkflowService = new AuditWorkflowService();
