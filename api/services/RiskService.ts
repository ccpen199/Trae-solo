import db from '../db/connection.js';
import { RiskRepository } from '../repositories/RiskRepository.js';
import { LotteryRepository } from '../repositories/LotteryRepository.js';
import { WinnerRepository } from '../repositories/WinnerRepository.js';
import type { RiskItem, RiskEvidence, PaginatedResponse, RiskProcessRequest, LotteryRecord } from '../../shared/types.js';

export class RiskService {
  private riskRepo: RiskRepository;
  private lotteryRepo: LotteryRepository;
  private winnerRepo: WinnerRepository;

  constructor() {
    this.riskRepo = new RiskRepository();
    this.lotteryRepo = new LotteryRepository();
    this.winnerRepo = new WinnerRepository();
  }

  analyzeRisk(
    userId: string,
    activityId: number,
    deviceId?: string,
    ip?: string,
    userAgent?: string
  ): LotteryRecord['riskStatus'] {
    const evidence: RiskEvidence = {
      ip,
      deviceId,
      userAgent,
      timestamps: [new Date().toISOString()]
    };

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const drawFrequency = this.lotteryRepo.getDrawsInTimeRange(userId, fiveMinutesAgo, new Date().toISOString());
    evidence.drawFrequency = drawFrequency;

    if (drawFrequency > 10) {
      this.createRiskItem({
        type: 'high_frequency',
        level: 'high',
        userId,
        activityId,
        evidence
      });
      return 'pending';
    }

    if (deviceId) {
      const sameDeviceUsers = this.countUniqueUsersByDevice(deviceId, activityId);
      evidence.sameDeviceCount = sameDeviceUsers;
      
      if (sameDeviceUsers > 5) {
        this.createRiskItem({
          type: 'device_fraud',
          level: 'high',
          userId,
          activityId,
          evidence
        });
        return 'pending';
      }
    }

    if (ip) {
      const sameIpUsers = this.countUniqueUsersByIp(ip, activityId);
      evidence.sameAddressCount = sameIpUsers;
      
      if (sameIpUsers > 10) {
        this.createRiskItem({
          type: 'address_cluster',
          level: 'medium',
          userId,
          activityId,
          evidence
        });
        return 'pending';
      }
    }

    const abnormalPattern = this.detectAbnormalPattern(userId, activityId);
    if (abnormalPattern) {
      evidence.behaviorPattern = abnormalPattern;
      this.createRiskItem({
        type: 'abnormal_account',
        level: 'medium',
        userId,
        activityId,
        evidence
      });
      return 'pending';
    }

    return 'normal';
  }

  private countUniqueUsersByDevice(deviceId: string, activityId: number): number {
    const row = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM participations 
      WHERE device_id = ? AND activity_id = ?
    `).get(deviceId, activityId) as { count: number };
    return row.count;
  }

  private countUniqueUsersByIp(ip: string, activityId: number): number {
    const row = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM participations 
      WHERE ip = ? AND activity_id = ?
    `).get(ip, activityId) as { count: number };
    return row.count;
  }

  private detectAbnormalPattern(userId: string, activityId: number): string | null {
    const records = this.lotteryRepo.findByUser(userId, 1, 50).items;
    if (records.length < 10) return null;

    const winRate = records.filter(r => r.isWin).length / records.length;
    if (winRate > 0.8) {
      return '中奖率异常过高';
    }

    const intervals: number[] = [];
    for (let i = 1; i < records.length; i++) {
      const t1 = new Date(records[i - 1].drawTime).getTime();
      const t2 = new Date(records[i].drawTime).getTime();
      intervals.push(Math.abs(t2 - t1));
    }

    if (intervals.length > 5) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
      
      if (avgInterval < 1000 && variance < 100000) {
        return '机械性定时抽奖模式';
      }
    }

    return null;
  }

  createRiskItem(data: {
    type: RiskItem['type'];
    level: RiskItem['level'];
    userId?: string;
    activityId?: number;
    lotteryRecordId?: number;
    evidence: RiskEvidence;
  }): number {
    return this.riskRepo.create({
      type: data.type,
      level: data.level,
      userId: data.userId,
      lotteryRecordId: data.lotteryRecordId,
      evidence: data.evidence,
      status: 'pending'
    });
  }

  getRiskQueue(page: number = 1, pageSize: number = 20, status?: RiskItem['status']): PaginatedResponse<RiskItem> {
    const result = this.riskRepo.findWithDetails(page, pageSize, status);
    
    return {
      items: result.items,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize)
    };
  }

  getRiskDetail(id: number): RiskItem | null {
    return this.riskRepo.findById(id);
  }

  getRiskEvidence(id: number): RiskEvidence | null {
    return this.riskRepo.getEvidence(id);
  }

  processRiskItem(id: number, request: RiskProcessRequest, processedBy: number): boolean {
    const { action, note } = request;
    const riskItem = this.riskRepo.findById(id);
    
    if (!riskItem) return false;

    const result = db.transaction(() => {
      let status: RiskItem['status'] = 'processed';
      let newNote = note;

      switch (action) {
        case 'approve':
          if (riskItem.lotteryRecordId) {
            this.lotteryRepo.updateRiskStatus(riskItem.lotteryRecordId, 'approved');
          }
          newNote = `[通过] ${note}`;
          break;
        case 'reject':
          if (riskItem.lotteryRecordId) {
            this.lotteryRepo.updateRiskStatus(riskItem.lotteryRecordId, 'rejected');
            const winners = this.winnerRepo.findByActivity(riskItem.activityId || 0, 1, 100);
            const winner = winners.items.find(w => w.lotteryRecordId === riskItem.lotteryRecordId);
            if (winner) {
              this.winnerRepo.updateStatus(winner.id, 'cancelled');
            }
          }
          newNote = `[驳回] ${note}`;
          break;
        case 'dismiss':
          status = 'dismissed';
          if (riskItem.lotteryRecordId) {
            this.lotteryRepo.updateRiskStatus(riskItem.lotteryRecordId, 'normal');
          }
          newNote = `[忽略] ${note}`;
          break;
        case 'ban':
          if (riskItem.lotteryRecordId) {
            this.lotteryRepo.updateRiskStatus(riskItem.lotteryRecordId, 'rejected');
          }
          newNote = `[封禁] ${note}`;
          break;
      }

      return this.riskRepo.process(id, status, processedBy, newNote);
    })();

    return result;
  }

  getPendingCount(): number {
    return this.riskRepo.countPending();
  }

  manualReissue(lotteryRecordId: number, processedBy: number, note: string): number {
    const lotteryRecord = this.lotteryRepo.findById(lotteryRecordId);
    if (!lotteryRecord || !lotteryRecord.isWin) return 0;

    const evidence: RiskEvidence = {
      timestamps: [new Date().toISOString()],
      behaviorPattern: '人工补发'
    };

    const riskItemId = this.riskRepo.create({
      type: 'abnormal_account',
      level: 'low',
      userId: lotteryRecord.userId,
      lotteryRecordId,
      evidence,
      status: 'processed',
      processedBy,
      processNote: `人工补发: ${note}`
    });

    const winnerId = this.winnerRepo.create({
      lotteryRecordId,
      activityId: lotteryRecord.activityId,
      userId: lotteryRecord.userId,
      prizeId: lotteryRecord.prizeId!,
      status: 'pending'
    });

    return winnerId;
  }
}
