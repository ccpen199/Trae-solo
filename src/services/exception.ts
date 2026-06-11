import Taro from '@tarojs/taro';
import type { ExceptionRecord, ExceptionPhoto, ExceptionType } from '@/types/exception';
import { mockExceptions } from '@/data/mockExceptions';
import { logOperation } from '@/utils/logger';
import { generateEvidenceHash } from '@/utils/validator';

export const exceptionService = {
  async getExceptions(status?: string): Promise<ExceptionRecord[]> {
    console.log('[ExceptionService] 获取异常列表:', status);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (status) {
      return mockExceptions.filter(e => e.status === status);
    }
    return mockExceptions;
  },

  async getExceptionById(id: string): Promise<ExceptionRecord | null> {
    console.log('[ExceptionService] 获取异常详情:', id);
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockExceptions.find(e => e.id === id) || null;
  },

  async takePhoto(): Promise<ExceptionPhoto | null> {
    console.log('[ExceptionService] 拍照取证');
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        sizeType: ['compressed'],
        camera: 'back'
      });

      const file = res.tempFiles[0];
      let location;
      try {
        const locRes = await Taro.getLocation({ type: 'gcj02' });
        location = {
          longitude: locRes.longitude,
          latitude: locRes.latitude,
          location: `${locRes.longitude.toFixed(6)},${locRes.latitude.toFixed(6)}`
        };
      } catch (e) {
        console.warn('[ExceptionService] 获取拍照位置失败:', e);
      }

      const photo: ExceptionPhoto = {
        id: `photo_${Date.now()}`,
        url: file.tempFilePath,
        thumbnail: file.tempFilePath,
        uploadTime: Date.now(),
        ...location
      };

      console.log('[ExceptionService] 拍照成功:', photo.id);
      return photo;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '拍照失败';
      console.error('[ExceptionService] 拍照失败:', e);
      Taro.showToast({ title: errorMsg, icon: 'none' });
      return null;
    }
  },

  async chooseImage(): Promise<ExceptionPhoto | null> {
    console.log('[ExceptionService] 选择图片');
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        sizeType: ['compressed']
      });

      const file = res.tempFiles[0];
      const photo: ExceptionPhoto = {
        id: `photo_${Date.now()}`,
        url: file.tempFilePath,
        thumbnail: file.tempFilePath,
        uploadTime: Date.now()
      };

      console.log('[ExceptionService] 选择图片成功:', photo.id);
      return photo;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '选择图片失败';
      console.error('[ExceptionService] 选择图片失败:', e);
      return null;
    }
  },

  async reportException(params: {
    waybillNo: string;
    exceptionType: ExceptionType;
    description: string;
    photos: ExceptionPhoto[];
    userId: string;
    userName: string;
  }): Promise<boolean> {
    console.log('[ExceptionService] 上报异常:', params);

    try {
      let location;
      try {
        const locRes = await Taro.getLocation({ type: 'gcj02' });
        location = {
          reportLongitude: locRes.longitude,
          reportLatitude: locRes.latitude,
          reportLocation: `${locRes.longitude.toFixed(6)},${locRes.latitude.toFixed(6)}`
        };
      } catch (e) {
        console.warn('[ExceptionService] 获取位置失败:', e);
      }

      const evidenceHash = generateEvidenceHash({
        waybillNo: params.waybillNo,
        exceptionType: params.exceptionType,
        description: params.description,
        photoCount: params.photos.length,
        userId: params.userId,
        timestamp: Date.now()
      });

      const record: Partial<ExceptionRecord> = {
        waybillNo: params.waybillNo,
        exceptionType: params.exceptionType,
        description: params.description,
        photos: params.photos,
        reporterId: params.userId,
        reporterName: params.userName,
        ...location,
        evidenceHash
      };

      await logOperation({
        userId: params.userId,
        userName: params.userName,
        module: 'exception',
        action: 'report',
        targetType: 'waybill',
        targetId: params.waybillNo,
        targetName: `异常上报-${params.exceptionType}`,
        status: 'success',
        complianceLevel: 'critical',
        retentionDays: 365,
        requireLocation: true,
        requestParams: record,
        responseResult: { evidenceHash }
      });

      Taro.showToast({ title: '上报成功', icon: 'success' });
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '上报失败';
      console.error('[ExceptionService] 异常上报失败:', e);

      await logOperation({
        userId: params.userId,
        userName: params.userName,
        module: 'exception',
        action: 'report',
        targetType: 'waybill',
        targetId: params.waybillNo,
        status: 'failed',
        errorMessage: errorMsg,
        complianceLevel: 'critical',
        retentionDays: 365
      });

      Taro.showToast({ title: errorMsg, icon: 'none' });
      return false;
    }
  },

  async updateExceptionProgress(params: {
    exceptionId: string;
    waybillNo: string;
    action: string;
    remark: string;
    userId: string;
    userName: string;
  }): Promise<boolean> {
    console.log('[ExceptionService] 更新异常进度:', params);

    try {
      await logOperation({
        userId: params.userId,
        userName: params.userName,
        module: 'exception',
        action: 'update',
        targetType: 'exception',
        targetId: params.exceptionId,
        targetName: params.waybillNo,
        status: 'success',
        complianceLevel: 'sensitive',
        retentionDays: 365,
        requestParams: { action: params.action, remark: params.remark }
      });

      Taro.showToast({ title: '更新成功', icon: 'success' });
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '更新失败';
      console.error('[ExceptionService] 更新异常进度失败:', e);
      Taro.showToast({ title: errorMsg, icon: 'none' });
      return false;
    }
  }
};
