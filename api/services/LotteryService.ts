import db from '../db/connection.js';
import { ActivityRepository } from '../repositories/ActivityRepository.js';
import { ParticipationRepository } from '../repositories/ParticipationRepository.js';
import { LotteryRepository } from '../repositories/LotteryRepository.js';
import { WinnerRepository } from '../repositories/WinnerRepository.js';
import { PrizeRepository } from '../repositories/PrizeRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { RiskService } from './RiskService.js';
import type { DrawRequest, DrawResponse, Participation, LotteryRecord, PrizeConfig, PaginatedResponse } from '../../shared/types.js';

export class LotteryService {
  private activityRepo: ActivityRepository;
  private participationRepo: ParticipationRepository;
  private lotteryRepo: LotteryRepository;
  private winnerRepo: WinnerRepository;
  private prizeRepo: PrizeRepository;
  private userRepo: UserRepository;
  private riskService: RiskService;

  constructor() {
    this.activityRepo = new ActivityRepository();
    this.participationRepo = new ParticipationRepository();
    this.lotteryRepo = new LotteryRepository();
    this.winnerRepo = new WinnerRepository();
    this.prizeRepo = new PrizeRepository();
    this.userRepo = new UserRepository();
    this.riskService = new RiskService();
  }

  checkQualification(activityId: number, userId: string, deviceId?: string): { qualified: boolean; reason?: string } {
    const activity = this.activityRepo.findById(activityId);
    if (!activity) {
      return { qualified: false, reason: '活动不存在' };
    }

    if (activity.status !== 'published') {
      return { qualified: false, reason: '活动未发布' };
    }

    const now = new Date();
    const startTime = new Date(activity.startTime);
    const endTime = new Date(activity.endTime);
    
    if (now < startTime) {
      return { qualified: false, reason: '活动尚未开始' };
    }
    if (now > endTime) {
      return { qualified: false, reason: '活动已结束' };
    }

    const rules = activity.participationRules;
    
    if (rules.dailyLimit > 0) {
      const todayCount = this.participationRepo.getTodayCount(activityId, userId);
      if (todayCount >= rules.dailyLimit) {
        return { qualified: false, reason: '今日抽奖次数已用完' };
      }
    }

    if (rules.totalLimit > 0) {
      const participation = this.participationRepo.findByActivityAndUser(activityId, userId);
      if (participation && participation.drawCount >= rules.totalLimit) {
        return { qualified: false, reason: '总抽奖次数已用完' };
      }
    }

    const winCount = this.lotteryRepo.countWinByActivityAndUser(activityId, userId);
    if (activity.lotteryRules.winLimit > 0 && winCount >= activity.lotteryRules.winLimit) {
      return { qualified: false, reason: '已达到中奖次数上限' };
    }

    if (activity.lotteryRules.preventDuplicateWin && winCount > 0) {
      return { qualified: false, reason: '每人限中奖一次' };
    }

    return { qualified: true };
  }

  executeDraw(request: DrawRequest, ip?: string, userAgent?: string): DrawResponse {
    const { activityId, userId, deviceId, channel } = request;

    const qualification = this.checkQualification(activityId, userId, deviceId);
    if (!qualification.qualified) {
      throw new Error(qualification.reason || '无参与资格');
    }

    this.userRepo.getOrCreate(userId);

    const activity = this.activityRepo.findById(activityId)!;
    const prizeConfigs = this.activityRepo.getPrizeConfigs(activityId);

    if (prizeConfigs.length === 0) {
      throw new Error('活动未配置奖品');
    }

    const result = db.transaction(() => {
      let participation = this.participationRepo.findByActivityAndUser(activityId, userId);
      if (!participation) {
        const participationId = this.participationRepo.create({
          activityId,
          userId,
          channel,
          deviceId,
          ip,
          qualified: true,
          drawCount: 0,
          tasksCompleted: []
        });
        participation = this.participationRepo.findById(participationId)!;
      }

      this.participationRepo.incrementDrawCount(participation.id);

      const prize = this.drawPrize(prizeConfigs);
      const isWin = prize && prize.type !== 'virtual' ? true : prize?.name === '谢谢参与' ? false : !!prize;

      let prizeId: number | undefined;
      if (prize && isWin) {
        const stockSuccess = this.prizeRepo.decrementStock(prize.id, 1);
        if (!stockSuccess) {
          return {
            isWin: false,
            lotteryRecordId: 0
          };
        }
        prizeId = prize.id;
      }

      const riskStatus = this.riskService.analyzeRisk(
        userId,
        activityId,
        deviceId,
        ip,
        userAgent
      );

      const lotteryRecordId = this.lotteryRepo.create({
        participationId: participation.id,
        activityId,
        userId,
        prizeId,
        isWin,
        riskStatus
      });

      if (isWin && riskStatus === 'normal') {
        this.winnerRepo.create({
          lotteryRecordId,
          activityId,
          userId,
          prizeId: prizeId!,
          status: 'pending'
        });
      }

      if (isWin && riskStatus !== 'normal') {
        this.winnerRepo.create({
          lotteryRecordId,
          activityId,
          userId,
          prizeId: prizeId!,
          status: 'pending'
        });
      }

      return {
        isWin,
        prize,
        lotteryRecordId,
        riskStatus
      };
    })();

    return result;
  }

  private drawPrize(prizeConfigs: PrizeConfig[]): PrizeConfig['prize'] | null {
    const totalProbability = prizeConfigs.reduce((sum, config) => sum + config.probability, 0);
    
    if (totalProbability <= 0) {
      return null;
    }

    let random = Math.random() * totalProbability;
    
    for (const config of prizeConfigs) {
      random -= config.probability;
      if (random <= 0) {
        return config.prize || null;
      }
    }

    return prizeConfigs[prizeConfigs.length - 1]?.prize || null;
  }

  getLotteryRecords(activityId: number, page: number = 1, pageSize: number = 20): PaginatedResponse<LotteryRecord> {
    const result = this.lotteryRepo.findWithDetailsByActivity(activityId, page, pageSize);
    
    return {
      items: result.items,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize)
    };
  }

  getUserLotteryRecords(userId: string, page: number = 1, pageSize: number = 20): PaginatedResponse<LotteryRecord> {
    const result = this.lotteryRepo.findByUser(userId, page, pageSize);
    
    return {
      items: result.items,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize)
    };
  }

  getUserParticipation(activityId: number, userId: string): Participation | null {
    return this.participationRepo.findByActivityAndUser(activityId, userId);
  }

  completeTask(activityId: number, userId: string, taskId: string, channel?: string, deviceId?: string): boolean {
    let user = this.userRepo.findById(userId);
    if (!user) {
      this.userRepo.create({ id: userId, nickname: `用户${userId.slice(-6)}` });
    }
    
    let participation = this.participationRepo.findByActivityAndUser(activityId, userId);
    
    if (!participation) {
      this.participationRepo.create({
        activityId,
        userId,
        channel: channel || 'direct',
        deviceId,
        qualified: true,
        drawCount: 0,
        tasksCompleted: [taskId]
      });
      return true;
    }

    if (!participation.tasksCompleted.includes(taskId)) {
      const newTasks = [...participation.tasksCompleted, taskId];
      return this.participationRepo.update(participation.id, { tasksCompleted: newTasks });
    }

    return true;
  }
}
