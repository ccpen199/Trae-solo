import db from '../db/connection.js';
import { ActivityRepository } from '../repositories/ActivityRepository.js';
import { PrizeRepository } from '../repositories/PrizeRepository.js';
import type { Activity, PrizeConfig, PaginatedResponse } from '../../shared/types.js';

export class ActivityService {
  private activityRepo: ActivityRepository;
  private prizeRepo: PrizeRepository;

  constructor() {
    this.activityRepo = new ActivityRepository();
    this.prizeRepo = new PrizeRepository();
  }

  getActivityList(page: number = 1, pageSize: number = 20, status?: Activity['status']): PaginatedResponse<Activity> {
    const where = status ? 'status = ?' : undefined;
    const params = status ? [status] : [];
    const result = this.activityRepo.findPaginated(page, pageSize, where, params);
    
    return {
      items: result.items,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize)
    };
  }

  getActivityDetail(id: number): (Activity & { prizeConfigs: PrizeConfig[] }) | null {
    const activity = this.activityRepo.findById(id);
    if (!activity) return null;

    const prizeConfigs = this.activityRepo.getPrizeConfigs(id);
    return { ...activity, prizeConfigs };
  }

  createActivity(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'> & { prizeConfigs?: Omit<PrizeConfig, 'id' | 'activityId'>[] }): number {
    const transaction = db.transaction((activityData, prizeConfigs) => {
      const activityId = this.activityRepo.create(activityData);
      
      if (prizeConfigs && prizeConfigs.length > 0) {
        for (let i = 0; i < prizeConfigs.length; i++) {
          const config = prizeConfigs[i];
          this.activityRepo.addPrizeConfig(activityId, config.prizeId, config.probability, config.position ?? i);
        }
      }
      
      return activityId;
    });

    return transaction(data, data.prizeConfigs || []);
  }

  updateActivity(id: number, data: Partial<Activity> & { prizeConfigs?: Omit<PrizeConfig, 'id' | 'activityId'>[] }): boolean {
    const transaction = db.transaction((activityId, activityData, prizeConfigs) => {
      const success = this.activityRepo.update(activityId, activityData);
      if (!success) return false;

      if (prizeConfigs !== undefined) {
        this.activityRepo.clearPrizeConfigs(activityId);
        for (let i = 0; i < prizeConfigs.length; i++) {
          const config = prizeConfigs[i];
          this.activityRepo.addPrizeConfig(activityId, config.prizeId, config.probability, config.position ?? i);
        }
      }
      
      return true;
    });

    return transaction(id, data, data.prizeConfigs);
  }

  updateActivityStatus(id: number, status: Activity['status']): boolean {
    return this.activityRepo.update(id, { status });
  }

  getPublishedActivities(): Activity[] {
    return this.activityRepo.findPublished();
  }

  getUserActivity(id: number): Activity | null {
    const activity = this.activityRepo.findById(id);
    if (!activity || activity.status !== 'published') return null;

    const now = new Date();
    const startTime = new Date(activity.startTime);
    const endTime = new Date(activity.endTime);
    
    if (now < startTime || now > endTime) return null;

    const prizeConfigs = this.activityRepo.getPrizeConfigs(id);
    return { ...activity, prizeConfigs };
  }

  deleteActivity(id: number): boolean {
    return this.activityRepo.delete(id);
  }

  validateActivity(activity: Partial<Activity>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!activity.name || activity.name.length < 2) {
      errors.push('活动名称不能为空且至少2个字符');
    }
    if (!activity.startTime) {
      errors.push('活动开始时间不能为空');
    }
    if (!activity.endTime) {
      errors.push('活动结束时间不能为空');
    }
    if (activity.startTime && activity.endTime && new Date(activity.startTime) >= new Date(activity.endTime)) {
      errors.push('活动开始时间必须早于结束时间');
    }
    if (!activity.participationRules) {
      errors.push('参与规则不能为空');
    }
    if (!activity.lotteryRules) {
      errors.push('抽奖规则不能为空');
    }
    if (!activity.lotteryRules?.type) {
      errors.push('抽奖类型不能为空');
    }

    return { valid: errors.length === 0, errors };
  }
}
