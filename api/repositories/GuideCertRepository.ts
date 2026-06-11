import { db, generateId, now } from '../data/database';
import type { GuideCertification, PageResponse } from '../../shared/types';

export interface GuideCertQueryParams {
  page?: number;
  pageSize?: number;
  status?: GuideCertification['status'];
  userId?: string;
  qualificationLevel?: GuideCertification['qualificationLevel'];
  keyword?: string;
}

export class GuideCertRepository {
  async findById(id: string): Promise<GuideCertification | undefined> {
    return db.guideCertifications.get(id);
  }

  async findAll(params: GuideCertQueryParams = {}): Promise<PageResponse<GuideCertification>> {
    const { page = 1, pageSize = 10, status, userId, qualificationLevel, keyword } = params;
    
    let certifications = Array.from(db.guideCertifications.values());

    if (status) {
      certifications = certifications.filter(c => c.status === status);
    }
    if (userId) {
      certifications = certifications.filter(c => c.userId === userId);
    }
    if (qualificationLevel) {
      certifications = certifications.filter(c => c.qualificationLevel === qualificationLevel);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      certifications = certifications.filter(c => 
        c.realName.toLowerCase().includes(kw) || 
        c.qualificationNo.toLowerCase().includes(kw)
      );
    }

    certifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = certifications.length;
    const start = (page - 1) * pageSize;
    const list = certifications.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async create(certData: Omit<GuideCertification, 'id' | 'createdAt'>): Promise<GuideCertification> {
    const certification: GuideCertification = {
      ...certData,
      id: generateId(),
      createdAt: now(),
    };
    db.guideCertifications.set(certification.id, certification);
    return certification;
  }

  async update(id: string, updates: Partial<GuideCertification>): Promise<GuideCertification | undefined> {
    const certification = db.guideCertifications.get(id);
    if (!certification) return undefined;

    const updated: GuideCertification = {
      ...certification,
      ...updates,
    };
    db.guideCertifications.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: GuideCertification['status'], validUntil?: string): Promise<GuideCertification | undefined> {
    const updates: Partial<GuideCertification> = { status };
    if (validUntil) {
      updates.validUntil = validUntil;
    }
    return this.update(id, updates);
  }

  async approve(id: string, validUntil: string): Promise<GuideCertification | undefined> {
    return this.updateStatus(id, 'approved', validUntil);
  }

  async reject(id: string): Promise<GuideCertification | undefined> {
    return this.updateStatus(id, 'rejected');
  }

  async expire(id: string): Promise<GuideCertification | undefined> {
    return this.updateStatus(id, 'expired');
  }

  async delete(id: string): Promise<boolean> {
    return db.guideCertifications.delete(id);
  }
}

export const guideCertRepository = new GuideCertRepository();
