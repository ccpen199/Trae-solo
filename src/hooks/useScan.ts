import { useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { validateWaybillNo } from '@/utils/validator';
import { logOperation } from '@/utils/logger';
import { saveOfflineData } from '@/utils/storage';

interface ScanResult {
  result: string;
  waybillNo: string;
  scanTime: number;
  location?: {
    longitude: number;
    latitude: number;
    address?: string;
  };
  isOffline: boolean;
}

interface UseScanOptions {
  requireLocation?: boolean;
  userId: string;
  userName: string;
}

export const useScan = (options: UseScanOptions = { userId: 'courier_001', userName: '快递员' }) => {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanCode = useCallback(async (scanType: 'pickup' | 'delivery' | 'station'): Promise<ScanResult | null> => {
    setScanning(true);
    setError(null);

    try {
      const scanRes = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      });

      console.log('[Scan] 扫码结果:', scanRes.result);

      if (!validateWaybillNo(scanRes.result)) {
        throw new Error('运单号格式不正确');
      }

      let location;
      if (options.requireLocation !== false) {
        try {
          const locRes = await Taro.getLocation({ type: 'gcj02' });
          location = {
            longitude: locRes.longitude,
            latitude: locRes.latitude
          };
          console.log('[Scan] 获取位置成功:', location);
        } catch (locErr) {
          console.warn('[Scan] 获取位置失败:', locErr);
        }
      }

      const result: ScanResult = {
        result: scanRes.result,
        waybillNo: scanRes.result,
        scanTime: Date.now(),
        location,
        isOffline: false
      };

      setLastResult(result);

      await logOperation({
        userId: options.userId,
        userName: options.userName,
        module: 'scan',
        action: 'scan',
        targetType: 'waybill',
        targetId: scanRes.result,
        targetName: `运单扫码-${scanType}`,
        status: 'success',
        complianceLevel: 'sensitive',
        retentionDays: 365,
        requireLocation: options.requireLocation !== false
      });

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '扫码失败';
      setError(errorMsg);
      console.error('[Scan] 扫码失败:', err);

      await logOperation({
        userId: options.userId,
        userName: options.userName,
        module: 'scan',
        action: 'scan',
        targetType: 'waybill',
        status: 'failed',
        errorMessage: errorMsg,
        complianceLevel: 'sensitive',
        retentionDays: 365
      });

      Taro.showToast({ title: errorMsg, icon: 'none' });
      return null;
    } finally {
      setScanning(false);
    }
  }, [options.requireLocation, options.userId, options.userName]);

  const manualInput = useCallback(async (waybillNo: string, scanType: 'pickup' | 'delivery' | 'station'): Promise<ScanResult | null> => {
    setError(null);

    try {
      if (!validateWaybillNo(waybillNo)) {
        throw new Error('运单号格式不正确');
      }

      let location;
      if (options.requireLocation !== false) {
        try {
          const locRes = await Taro.getLocation({ type: 'gcj02' });
          location = {
            longitude: locRes.longitude,
            latitude: locRes.latitude
          };
        } catch (locErr) {
          console.warn('[Scan] 获取位置失败:', locErr);
        }
      }

      const result: ScanResult = {
        result: waybillNo,
        waybillNo,
        scanTime: Date.now(),
        location,
        isOffline: false
      };

      setLastResult(result);

      await logOperation({
        userId: options.userId,
        userName: options.userName,
        module: 'scan',
        action: 'manual_input',
        targetType: 'waybill',
        targetId: waybillNo,
        targetName: `手动输入-${scanType}`,
        status: 'success',
        complianceLevel: 'sensitive',
        retentionDays: 365,
        requireLocation: options.requireLocation !== false
      });

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '输入无效';
      setError(errorMsg);
      console.error('[Scan] 手动输入失败:', err);

      Taro.showToast({ title: errorMsg, icon: 'none' });
      return null;
    }
  }, [options.requireLocation, options.userId, options.userName]);

  const scanOffline = useCallback((waybillNo: string, scanType: 'pickup' | 'delivery' | 'station'): ScanResult => {
    const result: ScanResult = {
      result: waybillNo,
      waybillNo,
      scanTime: Date.now(),
      isOffline: true
    };

    saveOfflineData('scan', {
      waybillNo,
      scanType,
      scanTime: result.scanTime,
      userId: options.userId,
      userName: options.userName
    });

    setLastResult(result);
    console.log('[Scan] 离线扫码已保存:', result);
    Taro.showToast({ title: '离线扫码已保存', icon: 'success' });

    return result;
  }, [options.userId, options.userName]);

  return {
    scanning,
    lastResult,
    error,
    scanCode,
    manualInput,
    scanOffline
  };
};
