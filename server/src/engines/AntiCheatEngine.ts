import { Op, Transaction } from 'sequelize';
import { UserExam, UserExamStatus } from '../models/UserExam';
import { AnomalyRecord, AnomalyType, AnomalySeverity, AnomalyStatus } from '../models/AnomalyRecord';
import { Exam } from '../models/Exam';
import { env } from '../config';
import { sequelize } from '../database/sequelize';

export enum CheatingDetectionType {
  SCREEN_SWITCH = 'screen_switch',
  COPY_PASTE = 'copy_paste',
  IDLE_TIMEOUT = 'idle_timeout',
  MULTIPLE_TABS = 'multiple_tabs',
  FORCE_SUBMIT = 'force_submit',
  SUSPICIOUS_BEHAVIOR = 'suspicious_behavior',
}

export interface DetectionContext {
  userExamId: string;
  userId: string;
  examId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ScreenSwitchEvent extends DetectionContext {
  type: CheatingDetectionType.SCREEN_SWITCH;
  switchCount: number;
  maxAllowed: number;
  durationAway: number;
}

export interface CopyPasteEvent extends DetectionContext {
  type: CheatingDetectionType.COPY_PASTE;
  action: 'copy' | 'paste';
  contentLength?: number;
}

export interface IdleTimeoutEvent extends DetectionContext {
  type: CheatingDetectionType.IDLE_TIMEOUT;
  idleDuration: number;
  maxIdleAllowed: number;
}

export interface MultipleTabsEvent extends DetectionContext {
  type: CheatingDetectionType.MULTIPLE_TABS;
  tabCount: number;
}

export type CheatingEvent =
  | ScreenSwitchEvent
  | CopyPasteEvent
  | IdleTimeoutEvent
  | MultipleTabsEvent;

export interface DetectionResult {
  shouldWarn: boolean;
  shouldForceSubmit: boolean;
  warningMessage?: string;
  severity: AnomalySeverity;
  anomalyRecord?: AnomalyRecord;
}

export class AntiCheatEngine {
  private readonly maxScreenSwitches: number;
  private readonly warningThreshold: number;
  private readonly maxIdleDuration: number = 300000;

  constructor() {
    this.maxScreenSwitches = env.EXAM_MAX_SCREEN_SWITCHES;
    this.warningThreshold = env.EXAM_WARNING_THRESHOLD;
  }

  private getSeverity(event: CheatingEvent, currentCount: number): AnomalySeverity {
    switch (event.type) {
      case CheatingDetectionType.SCREEN_SWITCH:
        if (currentCount >= this.maxScreenSwitches) {
          return AnomalySeverity.CRITICAL;
        }
        if (currentCount >= this.warningThreshold) {
          return AnomalySeverity.HIGH;
        }
        return AnomalySeverity.MEDIUM;

      case CheatingDetectionType.COPY_PASTE:
        return AnomalySeverity.HIGH;

      case CheatingDetectionType.MULTIPLE_TABS:
        return AnomalySeverity.CRITICAL;

      case CheatingDetectionType.IDLE_TIMEOUT:
        if (event.idleDuration > this.maxIdleDuration * 2) {
          return AnomalySeverity.HIGH;
        }
        return AnomalySeverity.MEDIUM;

      default:
        return AnomalySeverity.MEDIUM;
    }
  }

  private getDescription(event: CheatingEvent): string {
    switch (event.type) {
      case CheatingDetectionType.SCREEN_SWITCH:
        return `切屏行为：当前已切屏 ${event.switchCount} 次，离开时长 ${event.durationAway / 1000} 秒`;

      case CheatingDetectionType.COPY_PASTE:
        return `检测到 ${event.action === 'copy' ? '复制' : '粘贴'} 操作，内容长度：${event.contentLength || '未知'}`;

      case CheatingDetectionType.IDLE_TIMEOUT:
        return `页面无操作时间过长：${event.idleDuration / 1000} 秒，超过最大允许值 ${event.maxIdleAllowed / 1000} 秒`;

      case CheatingDetectionType.MULTIPLE_TABS:
        return `检测到多个浏览器标签页：${event.tabCount} 个`;

      default:
        return '检测到异常行为';
    }
  }

  private getDetails(event: CheatingEvent): Record<string, unknown> {
    const details: Record<string, unknown> = {
      eventType: event.type,
      timestamp: event.timestamp.toISOString(),
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    };

    switch (event.type) {
      case CheatingDetectionType.SCREEN_SWITCH:
        details.switchCount = event.switchCount;
        details.maxAllowed = event.maxAllowed;
        details.durationAway = event.durationAway;
        break;

      case CheatingDetectionType.COPY_PASTE:
        details.action = event.action;
        details.contentLength = event.contentLength;
        break;

      case CheatingDetectionType.IDLE_TIMEOUT:
        details.idleDuration = event.idleDuration;
        details.maxIdleAllowed = event.maxIdleAllowed;
        break;

      case CheatingDetectionType.MULTIPLE_TABS:
        details.tabCount = event.tabCount;
        break;
    }

    return details;
  }

  async detectAndRecord(event: CheatingEvent, transaction?: Transaction): Promise<DetectionResult> {
    const userExam = await UserExam.findByPk(event.userExamId);
    if (!userExam) {
      throw new Error('考试记录不存在');
    }

    if (
      userExam.status !== UserExamStatus.IN_PROGRESS
    ) {
      return {
        shouldWarn: false,
        shouldForceSubmit: false,
        severity: AnomalySeverity.LOW,
      };
    }

    let shouldWarn = false;
    let shouldForceSubmit = false;
    let warningMessage = '';
    let updatedScreenSwitches = userExam.screenSwitchCount;
    let updatedCopyPastes = userExam.copyPasteCount;
    let updatedWarnings = userExam.warningCount;
    let hasAnomaly = userExam.hasAnomaly;

    if (event.type === CheatingDetectionType.SCREEN_SWITCH) {
      updatedScreenSwitches = event.switchCount;
      
      if (updatedScreenSwitches >= this.maxScreenSwitches) {
        shouldForceSubmit = true;
        warningMessage = `切屏次数已达上限 (${this.maxScreenSwitches}次)，考试将被强制提交`;
        hasAnomaly = true;
      } else if (updatedScreenSwitches >= this.warningThreshold) {
        shouldWarn = true;
        updatedWarnings++;
        warningMessage = `警告：您已切屏 ${updatedScreenSwitches} 次，最多允许 ${this.maxScreenSwitches} 次`;
        hasAnomaly = true;
      }
    } else if (event.type === CheatingDetectionType.COPY_PASTE) {
      updatedCopyPastes++;
      shouldWarn = true;
      updatedWarnings++;
      warningMessage = '警告：考试期间禁止复制粘贴操作';
      hasAnomaly = true;
    } else if (event.type === CheatingDetectionType.MULTIPLE_TABS) {
      shouldForceSubmit = true;
      warningMessage = '检测到多个浏览器标签页，考试将被强制提交';
      hasAnomaly = true;
    } else if (event.type === CheatingDetectionType.IDLE_TIMEOUT) {
      if (event.idleDuration > this.maxIdleDuration * 2) {
        shouldWarn = true;
        updatedWarnings++;
        warningMessage = '警告：您已长时间无操作，请继续考试';
        hasAnomaly = true;
      }
    }

    const severity = this.getSeverity(event, updatedScreenSwitches);

    const anomalyRecord = await AnomalyRecord.create(
      {
        userExamId: event.userExamId,
        userId: event.userId,
        examId: event.examId,
        type: event.type as unknown as AnomalyType,
        severity,
        status: AnomalyStatus.PENDING,
        description: this.getDescription(event),
        details: this.getDetails(event),
        occurredAt: event.timestamp,
      },
      { transaction }
    );

    await userExam.update(
      {
        screenSwitchCount: updatedScreenSwitches,
        copyPasteCount: updatedCopyPastes,
        warningCount: updatedWarnings,
        hasAnomaly,
      },
      { transaction }
    );

    if (shouldForceSubmit) {
      await userExam.update(
        {
          status: UserExamStatus.FORCE_SUBMITTED,
          endTime: new Date(),
          hasAnomaly: true,
        },
        { transaction }
      );

      await AnomalyRecord.create(
        {
          userExamId: event.userExamId,
          userId: event.userId,
          examId: event.examId,
          type: AnomalyType.FORCE_SUBMIT,
          severity: AnomalySeverity.CRITICAL,
          status: AnomalyStatus.PENDING,
          description: '因异常行为被强制提交考试',
          details: {
            reason: warningMessage,
            previousStatus: UserExamStatus.IN_PROGRESS,
          },
          occurredAt: new Date(),
        },
        { transaction }
      );
    }

    return {
      shouldWarn,
      shouldForceSubmit,
      warningMessage,
      severity,
      anomalyRecord,
    };
  }

  async recordHeartbeat(userExamId: string, data: {
    timestamp: Date;
    isFocused: boolean;
    activeTime: number;
  }): Promise<void> {
    const userExam = await UserExam.findByPk(userExamId);
    if (!userExam) return;

    if (userExam.status !== UserExamStatus.IN_PROGRESS) return;
  }

  async getAnomalyStatistics(examId?: string, userId?: string): Promise<{
    total: number;
    byType: Record<AnomalyType, number>;
    bySeverity: Record<AnomalySeverity, number>;
    byStatus: Record<AnomalyStatus, number>;
    pendingCount: number;
  }> {
    const where: Record<string, unknown> = {};
    if (examId) where.examId = examId;
    if (userId) where.userId = userId;

    const total = await AnomalyRecord.count({ where });

    const byTypeResult = await AnomalyRecord.findAll({
      where,
      attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['type'],
      raw: true,
    });

    const byType = Object.values(AnomalyType).reduce(
      (acc, type) => {
        const item = byTypeResult.find((r: { type: string; count: string }) => r.type === type);
        acc[type] = item ? parseInt(item.count) : 0;
        return acc;
      },
      {} as Record<AnomalyType, number>
    );

    const bySeverityResult = await AnomalyRecord.findAll({
      where,
      attributes: ['severity', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['severity'],
      raw: true,
    });

    const bySeverity = Object.values(AnomalySeverity).reduce(
      (acc, severity) => {
        const item = bySeverityResult.find(
          (r: { severity: string; count: string }) => r.severity === severity
        );
        acc[severity] = item ? parseInt(item.count) : 0;
        return acc;
      },
      {} as Record<AnomalySeverity, number>
    );

    const byStatusResult = await AnomalyRecord.findAll({
      where,
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const byStatus = Object.values(AnomalyStatus).reduce(
      (acc, status) => {
        const item = byStatusResult.find(
          (r: { status: string; count: string }) => r.status === status
        );
        acc[status] = item ? parseInt(item.count) : 0;
        return acc;
      },
      {} as Record<AnomalyStatus, number>
    );

    const pendingCount = await AnomalyRecord.count({
      where: { ...where, status: AnomalyStatus.PENDING },
    });

    return {
      total,
      byType,
      bySeverity,
      byStatus,
      pendingCount,
    };
  }

  async reviewAnomaly(
    anomalyId: string,
    reviewerId: string,
    status: AnomalyStatus.REVIEWED | AnomalyStatus.DISMISSED | AnomalyStatus.CONFIRMED,
    comment?: string,
    transaction?: Transaction
  ): Promise<AnomalyRecord> {
    const anomaly = await AnomalyRecord.findByPk(anomalyId);
    if (!anomaly) {
      throw new Error('异常记录不存在');
    }

    await anomaly.update(
      {
        status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewComment: comment,
      },
      { transaction }
    );

    return anomaly.reload();
  }

  async getExamAnomalies(examId: string): Promise<AnomalyRecord[]> {
    return AnomalyRecord.findAll({
      where: { examId },
      include: [
        { association: 'user',
          attributes: ['id', 'name', 'username'] },
        { association: 'userExam' },
      ],
      order: [['occurredAt', 'DESC']],
    });
  }
}

export const antiCheatEngine = new AntiCheatEngine();
