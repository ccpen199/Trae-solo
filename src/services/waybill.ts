import Taro from '@tarojs/taro';
import type { Waybill, PickupTask, DeliveryTask, WaybillStatus } from '@/types/waybill';
import { mockWaybills, mockPickupTasks, mockDeliveryTasks, getMockWaybillByNo } from '@/data/mockWaybills';
import { logOperation } from '@/utils/logger';
import { saveOfflineData, getOfflineData, clearOfflineData } from '@/utils/storage';
import { generateEvidenceHash } from '@/utils/validator';

export const waybillService = {
  async getPickupTasks(): Promise<PickupTask[]> {
    console.log('[WaybillService] 获取揽件任务');
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPickupTasks;
  },

  async getDeliveryTasks(): Promise<DeliveryTask[]> {
    console.log('[WaybillService] 获取派件任务');
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDeliveryTasks;
  },

  async getWaybillByNo(waybillNo: string): Promise<Waybill | null> {
    console.log('[WaybillService] 查询运单:', waybillNo);
    await new Promise(resolve => setTimeout(resolve, 200));
    return getMockWaybillByNo(waybillNo) || null;
  },

  async scanPickup(waybillNo: string, userId: string, userName: string, location?: { longitude: number; latitude: number }): Promise<boolean> {
    console.log('[WaybillService] 扫码揽件:', { waybillNo, location });

    try {
      const waybill = getMockWaybillByNo(waybillNo);
      if (!waybill) {
        throw new Error('运单不存在');
      }

      await logOperation({
        userId,
        userName,
        module: 'pickup',
        action: 'scan_pickup',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: '扫码揽件',
        status: 'success',
        complianceLevel: 'critical',
        retentionDays: 365,
        requireLocation: true,
        requestParams: { waybillNo, location }
      });

      Taro.showToast({ title: '揽件成功', icon: 'success' });
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '揽件失败';
      console.error('[WaybillService] 扫码揽件失败:', e);

      saveOfflineData('pickup', {
        waybillNo,
        userId,
        userName,
        location,
        timestamp: Date.now()
      });

      await logOperation({
        userId,
        userName,
        module: 'pickup',
        action: 'scan_pickup',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: '扫码揽件(离线)',
        status: 'warning',
        errorMessage: errorMsg,
        complianceLevel: 'critical',
        retentionDays: 365
      });

      Taro.showToast({ title: '已离线保存，联网后自动同步', icon: 'none' });
      return false;
    }
  },

  async scanDelivery(waybillNo: string, userId: string, userName: string, location?: { longitude: number; latitude: number }): Promise<boolean> {
    console.log('[WaybillService] 扫码派送:', { waybillNo, location });

    try {
      await logOperation({
        userId,
        userName,
        module: 'delivery',
        action: 'scan_delivery',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: '扫码派送',
        status: 'success',
        complianceLevel: 'critical',
        retentionDays: 365,
        requireLocation: true,
        requestParams: { waybillNo, location }
      });

      Taro.showToast({ title: '派送成功', icon: 'success' });
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '派送失败';
      console.error('[WaybillService] 扫码派送失败:', e);

      saveOfflineData('delivery', {
        waybillNo,
        userId,
        userName,
        location,
        timestamp: Date.now()
      });

      Taro.showToast({ title: '已离线保存，联网后自动同步', icon: 'none' });
      return false;
    }
  },

  async scanStation(waybillNo: string, userId: string, userName: string, stationId: string, stationName: string): Promise<boolean> {
    console.log('[WaybillService] 驿站签收:', { waybillNo, stationId });

    try {
      await logOperation({
        userId,
        userName,
        module: 'delivery',
        action: 'station_sign',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: `驿站签收-${stationName}`,
        status: 'success',
        complianceLevel: 'critical',
        retentionDays: 365,
        requireLocation: true,
        requestParams: { waybillNo, stationId, stationName }
      });

      Taro.showToast({ title: '驿站签收成功', icon: 'success' });
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '签收失败';
      console.error('[WaybillService] 驿站签收失败:', e);
      Taro.showToast({ title: errorMsg, icon: 'none' });
      return false;
    }
  },

  async confirmSign(waybillNo: string, userId: string, userName: string, signature?: string): Promise<boolean> {
    console.log('[WaybillService] 确认签收:', waybillNo);

    try {
      const evidenceHash = generateEvidenceHash({
        waybillNo,
        userId,
        timestamp: Date.now(),
        signature
      });

      await logOperation({
        userId,
        userName,
        module: 'delivery',
        action: 'confirm_sign',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: '确认签收',
        status: 'success',
        complianceLevel: 'critical',
        retentionDays: 365,
        requireLocation: true,
        responseResult: { evidenceHash }
      });

      Taro.showToast({ title: '签收成功', icon: 'success' });
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '签收失败';
      console.error('[WaybillService] 确认签收失败:', e);
      Taro.showToast({ title: errorMsg, icon: 'none' });
      return false;
    }
  },

  async acceptPickupTask(taskId: string, userId: string, userName: string): Promise<boolean> {
    console.log('[WaybillService] 接单:', taskId);
    await new Promise(resolve => setTimeout(resolve, 200));

    await logOperation({
      userId,
      userName,
      module: 'pickup',
      action: 'accept_task',
      targetType: 'pickup_task',
      targetId: taskId,
      targetName: '接受揽件任务',
      status: 'success',
      complianceLevel: 'sensitive',
      retentionDays: 365
    });

    return true;
  },

  async startDelivery(taskId: string, userId: string, userName: string): Promise<boolean> {
    console.log('[WaybillService] 开始派送:', taskId);
    await new Promise(resolve => setTimeout(resolve, 200));

    await logOperation({
      userId,
      userName,
      module: 'delivery',
      action: 'start_delivery',
      targetType: 'delivery_task',
      targetId: taskId,
      targetName: '开始派送',
      status: 'success',
      complianceLevel: 'sensitive',
      retentionDays: 365
    });

    return true;
  },

  async getOfflinePendingCount(): Promise<{ pickup: number; delivery: number }> {
    return {
      pickup: getOfflineData('pickup').length,
      delivery: getOfflineData('delivery').length
    };
  },

  async syncOfflineData(userId: string, userName: string): Promise<{ success: number; failed: number }> {
    console.log('[WaybillService] 同步离线数据');

    const pickupData = getOfflineData<{ waybillNo: string }>('pickup');
    const deliveryData = getOfflineData<{ waybillNo: string }>('delivery');

    let success = 0;
    let failed = 0;

    for (const item of pickupData) {
      try {
        await this.scanPickup(item.waybillNo, userId, userName);
        clearOfflineData('pickup', `offline_pickup_${(item as any).timestamp}`);
        success++;
      } catch (e) {
        failed++;
      }
    }

    for (const item of deliveryData) {
      try {
        await this.scanDelivery(item.waybillNo, userId, userName);
        clearOfflineData('delivery', `offline_delivery_${(item as any).timestamp}`);
        success++;
      } catch (e) {
        failed++;
      }
    }

    await logOperation({
      userId,
      userName,
      module: 'sync',
      action: 'sync_offline',
      targetType: 'offline_data',
      targetName: '同步离线数据',
      status: success > 0 ? 'success' : 'failed',
      complianceLevel: 'sensitive',
      retentionDays: 365,
      responseResult: { success, failed }
    });

    return { success, failed };
  }
};
