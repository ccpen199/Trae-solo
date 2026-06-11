import { guideCertRepository } from '../repositories/GuideCertRepository';
import type { GuideCertification, PageResponse } from '../../shared/types';

export interface CreateGuideCertData {
  userId: string;
  realName: string;
  idCard: string;
  qualificationNo: string;
  qualificationLevel: GuideCertification['qualificationLevel'];
  certificateImage: string;
}

export interface UpdateGuideCertData {
  realName?: string;
  idCard?: string;
  qualificationNo?: string;
  qualificationLevel?: GuideCertification['qualificationLevel'];
  certificateImage?: string;
}

export class GuideCertService {
  async getCertificationById(id: string): Promise<GuideCertification | undefined> {
    return guideCertRepository.findById(id);
  }

  async getCertificationList(params: {
    page?: number;
    pageSize?: number;
    status?: GuideCertification['status'];
    userId?: string;
    qualificationLevel?: GuideCertification['qualificationLevel'];
    keyword?: string;
  }): Promise<PageResponse<GuideCertification>> {
    return guideCertRepository.findAll(params);
  }

  async submitCertification(data: CreateGuideCertData): Promise<GuideCertification> {
    const existingCerts = await guideCertRepository.findAll({ userId: data.userId, page: 1, pageSize: 9999 });
    const pendingCerts = existingCerts.list.filter(c => c.status === 'pending');
    
    if (pendingCerts.length > 0) {
      throw new Error('您已有待审核的认证申请，请等待审核完成后再提交');
    }

    return guideCertRepository.create({
      ...data,
      status: 'pending',
      validUntil: '',
    });
  }

  async updateCertification(id: string, data: UpdateGuideCertData): Promise<GuideCertification | undefined> {
    const certification = await guideCertRepository.findById(id);
    if (!certification) return undefined;

    if (certification.status !== 'pending' && certification.status !== 'rejected') {
      throw new Error('只有待审核或已驳回的认证才能修改');
    }

    return guideCertRepository.update(id, data);
  }

  async updateCertificationStatus(
    id: string, 
    status: GuideCertification['status'], 
    validUntil?: string
  ): Promise<GuideCertification | undefined> {
    const certification = await guideCertRepository.findById(id);
    if (!certification) return undefined;

    const validTransitions: Record<GuideCertification['status'], GuideCertification['status'][]> = {
      pending: ['approved', 'rejected'],
      approved: ['expired'],
      rejected: ['pending'],
      expired: ['pending'],
    };

    if (!validTransitions[certification.status].includes(status)) {
      throw new Error(`无法从 ${certification.status} 状态变更为 ${status}`);
    }

    if (status === 'approved' && !validUntil) {
      throw new Error('认证通过时必须设置有效期');
    }

    return guideCertRepository.updateStatus(id, status, validUntil);
  }

  async approveCertification(id: string, validUntil: string): Promise<GuideCertification | undefined> {
    if (new Date(validUntil) <= new Date()) {
      throw new Error('有效期必须晚于当前日期');
    }

    return this.updateCertificationStatus(id, 'approved', validUntil);
  }

  async rejectCertification(id: string): Promise<GuideCertification | undefined> {
    return this.updateCertificationStatus(id, 'rejected');
  }

  async expireCertification(id: string): Promise<GuideCertification | undefined> {
    return this.updateCertificationStatus(id, 'expired');
  }

  async deleteCertification(id: string): Promise<boolean> {
    const certification = await guideCertRepository.findById(id);
    if (!certification) return false;

    if (certification.status === 'approved') {
      throw new Error('已通过的认证不能删除，如需注销请联系管理员');
    }

    return guideCertRepository.delete(id);
  }

  async getCertificationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
  }> {
    const certifications = Array.from((await guideCertRepository.findAll({ page: 1, pageSize: 9999 })).list);
    
    return {
      total: certifications.length,
      pending: certifications.filter(c => c.status === 'pending').length,
      approved: certifications.filter(c => c.status === 'approved').length,
      rejected: certifications.filter(c => c.status === 'rejected').length,
      expired: certifications.filter(c => c.status === 'expired').length,
    };
  }

  async checkCertificationExpiry(): Promise<GuideCertification[]> {
    const certifications = Array.from((await guideCertRepository.findAll({ status: 'approved', page: 1, pageSize: 9999 })).list);
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    return certifications.filter(c => {
      if (!c.validUntil) return false;
      const expiryDate = new Date(c.validUntil);
      return expiryDate <= thirtyDaysLater;
    });
  }
}

export const guideCertService = new GuideCertService();
