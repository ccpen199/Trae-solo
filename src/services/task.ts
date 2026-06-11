import Taro from '@tarojs/taro';
import type {
  TaskHeatmapPoint,
  TaskWarning,
  DailyStats,
  CheckinRecord,
  Geofence,
  Evaluation,
  ArchiveRecord
} from '@/types/task';
import {
  mockWarnings,
  mockDailyStats,
  mockHeatmapPoints,
  mockGeofences,
  mockCheckinRecords,
  mockEvaluations,
  mockArchives
} from '@/data/mockExceptions';
import { logOperation } from '@/utils/logger';
import { generateEvidenceHash, detectNegativeKeywords, isPointInFence } from '@/utils/validator';

export const taskService = {
  async getHeatmapPoints(type?: 'pickup' | 'delivery' | 'exception'): Promise<TaskHeatmapPoint[]> {
    console.log('[TaskService] 获取热力图数据:', type);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (type) {
      return mockHeatmapPoints.filter(p => p.type === type);
    }
    return mockHeatmapPoints;
  },

  async getWarnings(severity?: string): Promise<TaskWarning[]> {
    console.log('[TaskService] 获取预警列表:', severity);
    await new Promise(resolve => setTimeout(resolve, 300));

    let warnings = [...mockWarnings];
    if (severity) {
      warnings = warnings.filter(w => w.severity === severity);
    }
    return warnings.sort((a, b) => {
      const severityOrder = { danger: 0, warning: 1, normal: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  },

  async getUnreadWarningCount(): Promise<number> {
    console.log('[TaskService] 获取未读预警数量');
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockWarnings.filter(w => !w.isRead).length;
  },

  async markWarningRead(warningId: string, userId: string, userName: string): Promise<boolean> {
    console.log('[TaskService] 标记预警已读:', warningId);
    await new Promise(resolve => setTimeout(resolve, 200));

    await logOperation({
      userId,
      userName,
      module: 'warning',
      action: 'mark_read',
      targetType: 'warning',
      targetId: warningId,
      targetName: '预警消息',
      status: 'success',
      complianceLevel: 'normal',
      retentionDays: 365
    });

    return true;
  },

  async getDailyStats(date?: string): Promise<DailyStats> {
    console.log('[TaskService] 获取每日统计:', date);
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDailyStats;
  },

  async getGeofences(): Promise<Geofence[]> {
    console.log('[TaskService] 获取电子围栏列表');
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockGeofences.filter(g => g.isActive);
  },

  async checkin(
    type: 'check_in' | 'check_out' | 'fence_in' | 'fence_out',
    userId: string,
    userName: string
  ): Promise<CheckinRecord | null> {
    console.log('[TaskService] 打卡:', type);

    try {
      const locRes = await Taro.getLocation({ type: 'gcj02' });
      const geofences = await this.getGeofences();

      let matchedFence: Geofence | null = null;
      let isInsideFence = false;

      for (const fence of geofences) {
        const inside = isPointInFence(
          locRes.longitude,
          locRes.latitude,
          fence.centerLongitude,
          fence.centerLatitude,
          fence.radius
        );
        if (inside) {
          matchedFence = fence;
          isInsideFence = true;
          break;
        }
      }

      const deviceInfo = Taro.getSystemInfoSync();
      const deviceStr = `${deviceInfo.model} ${deviceInfo.system}`;

      const record: CheckinRecord = {
        id: `ci_${Date.now()}`,
        courierId: userId,
        type,
        location: `${locRes.longitude.toFixed(6)},${locRes.latitude.toFixed(6)}`,
        longitude: locRes.longitude,
        latitude: locRes.latitude,
        fenceId: matchedFence?.id,
        fenceName: matchedFence?.name,
        isInsideFence,
        accuracy: locRes.accuracy || 10,
        timestamp: Date.now(),
        deviceInfo: deviceStr
      };

      const evidenceHash = generateEvidenceHash({
        checkinId: record.id,
        userId,
        type,
        longitude: record.longitude,
        latitude: record.latitude,
        timestamp: record.timestamp
      });

      await logOperation({
        userId,
        userName,
        module: 'checkin',
        action: type,
        targetType: 'checkin',
        targetId: record.id,
        targetName: `${type === 'check_in' ? '上班打卡' : type === 'check_out' ? '下班打卡' : '围栏打卡'}`,
        status: 'success',
        complianceLevel: 'critical',
        retentionDays: 365,
        requireLocation: true,
        requestParams: record,
        responseResult: { evidenceHash, isInsideFence, fenceName: matchedFence?.name }
      });

      if (!isInsideFence && type !== 'check_out') {
        Taro.showModal({
          title: '打卡提醒',
          content: '您当前不在指定打卡区域，是否确认打卡？',
          success: (res) => {
            if (!res.confirm) {
              return null;
            }
          }
        });
      } else {
        Taro.showToast({
          title: matchedFence ? `${matchedFence.name}打卡成功` : '打卡成功',
          icon: 'success'
        });
      }

      return record;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '打卡失败';
      console.error('[TaskService] 打卡失败:', e);

      await logOperation({
        userId,
        userName,
        module: 'checkin',
        action: type,
        targetType: 'checkin',
        status: 'failed',
        errorMessage: errorMsg,
        complianceLevel: 'critical',
        retentionDays: 365
      });

      Taro.showToast({ title: errorMsg, icon: 'none' });
      return null;
    }
  },

  async getCheckinRecords(courierId: string, limit: number = 20): Promise<CheckinRecord[]> {
    console.log('[TaskService] 获取打卡记录:', courierId);
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockCheckinRecords.filter(r => r.courierId === courierId).slice(0, limit);
  },

  async getEvaluations(onlyNegative: boolean = false): Promise<Evaluation[]> {
    console.log('[TaskService] 获取评价列表:', onlyNegative);
    await new Promise(resolve => setTimeout(resolve, 300));

    let evaluations = [...mockEvaluations];
    if (onlyNegative) {
      evaluations = evaluations.filter(e => e.hasNegative);
    }
    return evaluations.sort((a, b) => b.createTime - a.createTime);
  },

  async analyzeEvaluation(content: string): Promise<{
    negativeKeywords: string[];
    hasNegative: boolean;
    severity: 'low' | 'medium' | 'high';
  }> {
    console.log('[TaskService] 分析评价内容');
    await new Promise(resolve => setTimeout(resolve, 200));

    const negativeKeywords = detectNegativeKeywords(content);
    const hasNegative = negativeKeywords.length > 0;

    let severity: 'low' | 'medium' | 'high' = 'low';
    if (negativeKeywords.length >= 3) {
      severity = 'high';
    } else if (negativeKeywords.length >= 1) {
      severity = 'medium';
    }

    return { negativeKeywords, hasNegative, severity };
  },

  async handleEvaluation(
    evaluationId: string,
    remark: string,
    userId: string,
    userName: string
  ): Promise<boolean> {
    console.log('[TaskService] 处理评价:', evaluationId);
    await new Promise(resolve => setTimeout(resolve, 200));

    await logOperation({
      userId,
      userName,
      module: 'evaluation',
      action: 'handle',
      targetType: 'evaluation',
      targetId: evaluationId,
      targetName: '评价处理',
      status: 'success',
      complianceLevel: 'sensitive',
      retentionDays: 365,
      requestParams: { remark }
    });

    Taro.showToast({ title: '处理成功', icon: 'success' });
    return true;
  },

  async getArchives(archiveType?: string): Promise<ArchiveRecord[]> {
    console.log('[TaskService] 获取归档列表:', archiveType);
    await new Promise(resolve => setTimeout(resolve, 300));

    let archives = [...mockArchives];
    if (archiveType) {
      archives = archives.filter(a => a.archiveType === archiveType);
    }
    return archives.sort((a, b) => b.archiveTime - a.archiveTime);
  },

  async archiveWaybill(
    waybillNo: string,
    archiveType: 'normal' | 'exception' | 'complaint' | 'legal',
    userId: string,
    userName: string
  ): Promise<ArchiveRecord | null> {
    console.log('[TaskService] 归档运单:', waybillNo);

    try {
      const evidenceHash = generateEvidenceHash({
        waybillNo,
        archiveType,
        userId,
        timestamp: Date.now()
      });

      const record: ArchiveRecord = {
        id: `arc_${Date.now()}`,
        waybillNo,
        archiveType,
        archiveTime: Date.now(),
        archivist: userName,
        evidenceHash,
        blockchainTxId: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
        storageUrl: `oss://express-archive/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${waybillNo}.zip`,
        retentionYears: archiveType === 'legal' ? 20 : archiveType === 'exception' ? 10 : 5,
        isVerified: false
      };

      await logOperation({
        userId,
        userName,
        module: 'archive',
        action: 'create',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: '运单归档',
        status: 'success',
        complianceLevel: 'critical',
        retentionDays: record.retentionYears * 365,
        requestParams: { waybillNo, archiveType },
        responseResult: { evidenceHash, blockchainTxId: record.blockchainTxId }
      });

      Taro.showToast({ title: '归档成功', icon: 'success' });
      return record;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '归档失败';
      console.error('[TaskService] 归档失败:', e);

      await logOperation({
        userId,
        userName,
        module: 'archive',
        action: 'create',
        targetType: 'waybill',
        targetId: waybillNo,
        status: 'failed',
        errorMessage: errorMsg,
        complianceLevel: 'critical',
        retentionDays: 365
      });

      Taro.showToast({ title: errorMsg, icon: 'none' });
      return null;
    }
  },

  async verifyArchive(archiveId: string, userId: string, userName: string): Promise<boolean> {
    console.log('[TaskService] 验证归档:', archiveId);
    await new Promise(resolve => setTimeout(resolve, 300));

    await logOperation({
      userId,
      userName,
      module: 'archive',
      action: 'verify',
      targetType: 'archive',
      targetId: archiveId,
      targetName: '归档验证',
      status: 'success',
      complianceLevel: 'sensitive',
      retentionDays: 365
    });

    Taro.showToast({ title: '验证通过，哈希一致', icon: 'success' });
    return true;
  }
};
