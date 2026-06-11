import { festivalRepository } from '../repositories/FestivalRepository';
import type { FestivalActivity, PageResponse } from '../../shared/types';

export interface CreateFestivalData {
  name: string;
  organizer: string;
  region: string;
  startDate: string;
  endDate: string;
  venue: string;
  expectedScale: number;
  description: string;
  createdBy: string;
}

export interface UpdateFestivalData {
  name?: string;
  organizer?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  expectedScale?: number;
  description?: string;
  status?: FestivalActivity['status'];
}

export class FestivalService {
  async getActivityById(id: string): Promise<FestivalActivity | undefined> {
    return festivalRepository.findById(id);
  }

  async getActivityList(params: {
    page?: number;
    pageSize?: number;
    status?: FestivalActivity['status'];
    region?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
  }): Promise<PageResponse<FestivalActivity>> {
    return festivalRepository.findAll(params);
  }

  async createActivity(data: CreateFestivalData): Promise<FestivalActivity> {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error('结束日期不能早于开始日期');
    }

    return festivalRepository.create({
      ...data,
      status: 'draft',
    });
  }

  async updateActivity(id: string, data: UpdateFestivalData): Promise<FestivalActivity | undefined> {
    const activity = await festivalRepository.findById(id);
    if (!activity) return undefined;

    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error('结束日期不能早于开始日期');
    }

    if (activity.status === 'approved' || activity.status === 'ongoing' || activity.status === 'completed') {
      throw new Error('已审批、进行中或已完成的活动不能编辑');
    }

    return festivalRepository.update(id, data);
  }

  async submitActivity(id: string): Promise<FestivalActivity | undefined> {
    const activity = await festivalRepository.findById(id);
    if (!activity) return undefined;

    if (activity.status !== 'draft' && activity.status !== 'rejected') {
      throw new Error('只有草稿或已驳回的活动才能提交申报');
    }

    return festivalRepository.submit(id);
  }

  async updateActivityStatus(id: string, status: FestivalActivity['status']): Promise<FestivalActivity | undefined> {
    const activity = await festivalRepository.findById(id);
    if (!activity) return undefined;

    const validTransitions: Record<FestivalActivity['status'], FestivalActivity['status'][]> = {
      draft: ['submitted'],
      submitted: ['reviewing', 'rejected'],
      reviewing: ['approved', 'rejected'],
      approved: ['ongoing', 'rejected'],
      rejected: ['draft', 'submitted'],
      ongoing: ['completed'],
      completed: [],
    };

    if (!validTransitions[activity.status].includes(status)) {
      throw new Error(`无法从 ${activity.status} 状态变更为 ${status}`);
    }

    return festivalRepository.updateStatus(id, status);
  }

  async approveActivity(id: string): Promise<FestivalActivity | undefined> {
    return this.updateActivityStatus(id, 'approved');
  }

  async rejectActivity(id: string): Promise<FestivalActivity | undefined> {
    return this.updateActivityStatus(id, 'rejected');
  }

  async startActivity(id: string): Promise<FestivalActivity | undefined> {
    return this.updateActivityStatus(id, 'ongoing');
  }

  async completeActivity(id: string): Promise<FestivalActivity | undefined> {
    return this.updateActivityStatus(id, 'completed');
  }

  async deleteActivity(id: string): Promise<boolean> {
    const activity = await festivalRepository.findById(id);
    if (!activity) return false;

    if (activity.status === 'ongoing' || activity.status === 'completed') {
      throw new Error('进行中或已完成的活动不能删除');
    }

    return festivalRepository.delete(id);
  }

  async getActivityStats(): Promise<{
    total: number;
    draft: number;
    submitted: number;
    reviewing: number;
    approved: number;
    ongoing: number;
    completed: number;
    rejected: number;
  }> {
    const activities = Array.from((await festivalRepository.findAll({ page: 1, pageSize: 9999 })).list);
    
    return {
      total: activities.length,
      draft: activities.filter(a => a.status === 'draft').length,
      submitted: activities.filter(a => a.status === 'submitted').length,
      reviewing: activities.filter(a => a.status === 'reviewing').length,
      approved: activities.filter(a => a.status === 'approved').length,
      ongoing: activities.filter(a => a.status === 'ongoing').length,
      completed: activities.filter(a => a.status === 'completed').length,
      rejected: activities.filter(a => a.status === 'rejected').length,
    };
  }
}

export const festivalService = new FestivalService();
