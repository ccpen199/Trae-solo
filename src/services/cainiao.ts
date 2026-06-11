import Taro from '@tarojs/taro';
import type { Waybill, WaybillStatus } from '@/types/waybill';
import { logOperation } from '@/utils/logger';
import { saveOfflineData, getOfflineData, clearOfflineData } from '@/utils/storage';

interface CainiaoConfig {
  appKey: string;
  appSecret: string;
  baseUrl: string;
  token: string;
}

interface SyncResult {
  success: number;
  failed: number;
  total: number;
  message: string;
}

export interface SyncStatus {
  isAuthorized: boolean;
  lastSyncTime: number | null;
  pendingPush: number;
  pendingException: number;
  todayPulled: number;
  todayPushed: number;
  syncStatus: 'idle' | 'syncing' | 'success' | 'failed';
  lastSyncResult?: string;
}

const DEFAULT_CONFIG: CainiaoConfig = {
  appKey: 'CAINIAO_APP_KEY',
  appSecret: 'CAINIAO_APP_SECRET',
  baseUrl: 'https://api.cainiao.com/waybill',
  token: ''
};

let config: CainiaoConfig = { ...DEFAULT_CONFIG };

let syncState: {
  lastSyncTime: number | null;
  todayPulled: number;
  todayPushed: number;
  syncStatus: 'idle' | 'syncing' | 'success' | 'failed';
  lastSyncResult?: string;
} = {
  lastSyncTime: null,
  todayPulled: 0,
  todayPushed: 0,
  syncStatus: 'idle'
};

export const cainiaoService = {
  init(customConfig: Partial<CainiaoConfig>): void {
    config = { ...DEFAULT_CONFIG, ...customConfig };
    console.log('[CainiaoService] 初始化完成');
  },

  getConfig(): CainiaoConfig {
    return { ...config };
  },

  async auth(userId: string, userName: string): Promise<boolean> {
    console.log('[CainiaoService] 菜鸟裹裹授权');
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      config.token = `cainiao_token_${Date.now()}`;

      await logOperation({
        userId,
        userName,
        module: 'cainiao',
        action: 'auth',
        targetType: 'system',
        targetName: '菜鸟裹裹授权',
        status: 'success',
        complianceLevel: 'sensitive',
        retentionDays: 365
      });

      Taro.showToast({ title: '授权成功', icon: 'success' });
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '授权失败';
      console.error('[CainiaoService] 授权失败:', e);

      await logOperation({
        userId,
        userName,
        module: 'cainiao',
        action: 'auth',
        targetType: 'system',
        status: 'failed',
        errorMessage: errorMsg,
        complianceLevel: 'sensitive',
        retentionDays: 365
      });

      Taro.showToast({ title: errorMsg, icon: 'none' });
      return false;
    }
  },

  async pullWaybills(userId: string, userName: string, status?: WaybillStatus): Promise<Waybill[]> {
    console.log('[CainiaoService] 从菜鸟裹裹拉取运单:', status);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (!config.token) {
        throw new Error('请先完成菜鸟裹裹授权');
      }

      const mockPulledWaybills: Waybill[] = [
        {
          id: `wb_cn_${Date.now()}_1`,
          waybillNo: `CN${Date.now().toString().slice(-10)}1`,
          status: status || 'pending_pickup',
          type: 'pickup',
          sender: {
            name: '菜鸟裹裹用户',
            phone: '13900001234',
            address: '北京市朝阳区菜鸟仓配中心',
            longitude: 116.4863,
            latitude: 39.9274
          },
          receiver: {
            name: '张先生',
            phone: '13800005678',
            address: '北京市海淀区中关村大街1号',
            longitude: 116.3176,
            latitude: 39.9832
          },
          goodsInfo: {
            name: '电子产品',
            weight: 1.5,
            quantity: 1,
            value: 2999
          },
          createTime: Date.now() - 600000,
          deadline: Date.now() + 7200000,
          priority: 'normal',
          isOvertime: false,
          operationLogs: []
        },
        {
          id: `wb_cn_${Date.now()}_2`,
          waybillNo: `CN${Date.now().toString().slice(-10)}2`,
          status: status || 'pending_pickup',
          type: 'pickup',
          sender: {
            name: '菜鸟裹裹用户',
            phone: '13900002345',
            address: '北京市朝阳区国贸中心',
            longitude: 116.4650,
            latitude: 39.9100
          },
          receiver: {
            name: '李女士',
            phone: '13800006789',
            address: '北京市西城区金融街',
            longitude: 116.3600,
            latitude: 39.9150
          },
          goodsInfo: {
            name: '服装',
            weight: 0.8,
            quantity: 2,
            value: 599
          },
          createTime: Date.now() - 300000,
          deadline: Date.now() + 10800000,
          priority: 'high',
          isOvertime: false,
          operationLogs: []
        }
      ];

      await logOperation({
        userId,
        userName,
        module: 'cainiao',
        action: 'pull',
        targetType: 'waybill',
        targetName: '从菜鸟裹裹拉取运单',
        status: 'success',
        complianceLevel: 'sensitive',
        retentionDays: 365,
        requestParams: { status },
        responseResult: { count: mockPulledWaybills.length }
      });

      Taro.showToast({
        title: `成功拉取${mockPulledWaybills.length}条运单`,
        icon: 'success'
      });

      return mockPulledWaybills;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '拉取运单失败';
      console.error('[CainiaoService] 拉取运单失败:', e);

      await logOperation({
        userId,
        userName,
        module: 'cainiao',
        action: 'pull',
        targetType: 'waybill',
        status: 'failed',
        errorMessage: errorMsg,
        complianceLevel: 'sensitive',
        retentionDays: 365
      });

      Taro.showToast({ title: errorMsg, icon: 'none' });
      return [];
    }
  },

  async pushWaybillStatus(
    waybillNo: string,
    status: WaybillStatus,
    userId: string,
    userName: string,
    location?: { longitude: number; latitude: number }
  ): Promise<boolean> {
    console.log('[CainiaoService] 推送运单状态到菜鸟裹裹:', { waybillNo, status });

    try {
      if (!config.token) {
        throw new Error('请先完成菜鸟裹裹授权');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      await logOperation({
        userId,
        userName,
        module: 'cainiao',
        action: 'push_status',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: '推送运单状态到菜鸟裹裹',
        status: 'success',
        complianceLevel: 'sensitive',
        retentionDays: 365,
        requireLocation: true,
        requestParams: { waybillNo, status, location }
      });

      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '推送状态失败';
      console.error('[CainiaoService] 推送状态失败:', e);

      saveOfflineData('cainiao_push', {
        waybillNo,
        status,
        userId,
        userName,
        location,
        timestamp: Date.now()
      });

      await logOperation({
        userId,
        userName,
        module: 'cainiao',
        action: 'push_status',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: '推送运单状态(离线)',
        status: 'warning',
        errorMessage: errorMsg,
        complianceLevel: 'sensitive',
        retentionDays: 365
      });

      Taro.showToast({ title: '已离线保存，联网后自动同步', icon: 'none' });
      return false;
    }
  },

  async pushExceptionStatus(
    waybillNo: string,
    exceptionType: string,
    description: string,
    userId: string,
    userName: string
  ): Promise<boolean> {
    console.log('[CainiaoService] 推送异常状态到菜鸟裹裹:', { waybillNo, exceptionType });

    try {
      if (!config.token) {
        throw new Error('请先完成菜鸟裹裹授权');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      await logOperation({
        userId,
        userName,
        module: 'cainiao',
        action: 'push_exception',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: '推送异常状态到菜鸟裹裹',
        status: 'success',
        complianceLevel: 'sensitive',
        retentionDays: 365,
        requestParams: { waybillNo, exceptionType, description }
      });

      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '推送异常失败';
      console.error('[CainiaoService] 推送异常失败:', e);

      saveOfflineData('cainiao_exception', {
        waybillNo,
        exceptionType,
        description,
        userId,
        userName,
        timestamp: Date.now()
      });

      Taro.showToast({ title: '已离线保存，联网后自动同步', icon: 'none' });
      return false;
    }
  },

  async syncAll(userId: string, userName: string): Promise<SyncResult> {
    console.log('[CainiaoService] 双向同步');
    syncState.syncStatus = 'syncing';
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      if (!config.token) {
        throw new Error('请先完成菜鸟裹裹授权');
      }

      const pullResult = await this.pullWaybills(userId, userName);

      const pushData = getOfflineData<{ waybillNo: string; status: string }>('cainiao_push');
      const exceptionData = getOfflineData<{ waybillNo: string; exceptionType: string }>('cainiao_exception');

      let pushSuccess = 0;
      let pushFailed = 0;

      for (const item of pushData) {
        try {
          await this.pushWaybillStatus(item.waybillNo, item.status as WaybillStatus, userId, userName);
          clearOfflineData('cainiao_push', `offline_cainiao_push_${(item as any).timestamp}`);
          pushSuccess++;
        } catch (e) {
          pushFailed++;
        }
      }

      for (const item of exceptionData) {
        try {
          await this.pushExceptionStatus(item.waybillNo, item.exceptionType, '', userId, userName);
          clearOfflineData('cainiao_exception', `offline_cainiao_exception_${(item as any).timestamp}`);
          pushSuccess++;
        } catch (e) {
          pushFailed++;
        }
      }

      const result: SyncResult = {
        success: pullResult.length + pushSuccess,
        failed: pushFailed,
        total: pullResult.length + pushData.length + exceptionData.length,
        message: `拉取${pullResult.length}条，推送${pushSuccess}条，失败${pushFailed}条`
      };

      syncState.lastSyncTime = Date.now();
      syncState.todayPulled += pullResult.length;
      syncState.todayPushed += pushSuccess;
      syncState.syncStatus = result.failed === 0 ? 'success' : 'warning';
      syncState.lastSyncResult = result.message;

      await logOperation({
        userId,
        userName,
        module: 'cainiao',
        action: 'sync_all',
        targetType: 'system',
        targetName: '菜鸟裹裹双向同步',
        status: result.failed === 0 ? 'success' : 'warning',
        complianceLevel: 'sensitive',
        retentionDays: 365,
        responseResult: result
      });

      Taro.showToast({ title: result.message, icon: 'none' });
      return result;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '同步失败';
      console.error('[CainiaoService] 同步失败:', e);

      syncState.syncStatus = 'failed';
      syncState.lastSyncResult = errorMsg;
      syncState.lastSyncTime = Date.now();

      const result: SyncResult = {
        success: 0,
        failed: 0,
        total: 0,
        message: errorMsg
      };

      return result;
    }
  },

  getOfflinePendingCount(): { push: number; exception: number } {
    return {
      push: getOfflineData('cainiao_push').length,
      exception: getOfflineData('cainiao_exception').length
    };
  },

  getSyncStatus(): SyncStatus {
    const pending = this.getOfflinePendingCount();
    return {
      isAuthorized: !!config.token,
      lastSyncTime: syncState.lastSyncTime,
      pendingPush: pending.push,
      pendingException: pending.exception,
      todayPulled: syncState.todayPulled,
      todayPushed: syncState.todayPushed,
      syncStatus: syncState.syncStatus,
      lastSyncResult: syncState.lastSyncResult
    };
  },

  async queryWaybillTrack(waybillNo: string, userId: string, userName: string): Promise<any[]> {
    console.log('[CainiaoService] 查询运单轨迹:', waybillNo);
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      if (!config.token) {
        throw new Error('请先完成菜鸟裹裹授权');
      }

      const tracks = [
        {
          time: Date.now() - 86400000,
          status: '已揽收',
          location: '北京市朝阳区营业点',
          operator: '张建国'
        },
        {
          time: Date.now() - 43200000,
          status: '运输中',
          location: '北京转运中心',
          operator: '系统'
        },
        {
          time: Date.now() - 7200000,
          status: '派送中',
          location: '北京市海淀区中关村营业点',
          operator: '张建国'
        }
      ];

      await logOperation({
        userId,
        userName,
        module: 'cainiao',
        action: 'query_track',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: '查询运单轨迹',
        status: 'success',
        complianceLevel: 'normal',
        retentionDays: 365
      });

      return tracks;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '查询轨迹失败';
      console.error('[CainiaoService] 查询轨迹失败:', e);
      Taro.showToast({ title: errorMsg, icon: 'none' });
      return [];
    }
  }
};
