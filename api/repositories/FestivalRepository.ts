import { db, generateId, now } from '../data/database';
import type { FestivalActivity, PageResponse } from '../../shared/types';

export interface FestivalQueryParams {
  page?: number;
  pageSize?: number;
  status?: FestivalActivity['status'];
  region?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export class FestivalRepository {
  async findById(id: string): Promise<FestivalActivity | undefined> {
    return db.festivalActivities.get(id);
  }

  async findAll(params: FestivalQueryParams = {}): Promise<PageResponse<FestivalActivity>> {
    const { page = 1, pageSize = 10, status, region, startDate, endDate, keyword } = params;
    
    let activities = Array.from(db.festivalActivities.values());

    if (status) {
      activities = activities.filter(a => a.status === status);
    }
    if (region) {
      activities = activities.filter(a => a.region === region);
    }
    if (startDate) {
      activities = activities.filter(a => a.endDate >= startDate);
    }
    if (endDate) {
      activities = activities.filter(a => a.startDate <= endDate);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      activities = activities.filter(a => 
        a.name.toLowerCase().includes(kw) || 
        a.description.toLowerCase().includes(kw)
      );
    }

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = activities.length;
    const start = (page - 1) * pageSize;
    const list = activities.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async create(activityData: Omit<FestivalActivity, 'id' | 'createdAt'>): Promise<FestivalActivity> {
    const activity: FestivalActivity = {
      ...activityData,
      id: generateId(),
      createdAt: now(),
    };
    db.festivalActivities.set(activity.id, activity);
    return activity;
  }

  async update(id: string, updates: Partial<FestivalActivity>): Promise<FestivalActivity | undefined> {
    const activity = db.festivalActivities.get(id);
    if (!activity) return undefined;

    const updated: FestivalActivity = {
      ...activity,
      ...updates,
    };
    db.festivalActivities.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: FestivalActivity['status']): Promise<FestivalActivity | undefined> {
    return this.update(id, { status });
  }

  async submit(id: string): Promise<FestivalActivity | undefined> {
    return this.updateStatus(id, 'submitted');
  }

  async delete(id: string): Promise<boolean> {
    return db.festivalActivities.delete(id);
  }
}

export const festivalRepository = new FestivalRepository();
