import { useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { isPointInFence, validateLatitude, validateLongitude } from '@/utils/validator';
import type { Geofence, CheckinRecord } from '@/types/task';
import { logOperation } from '@/utils/logger';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  address?: string;
}

interface UseLocationOptions {
  userId: string;
  userName: string;
}

export const useLocation = (options: UseLocationOptions) => {
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (type: 'gcj02' | 'wgs84' = 'gcj02'): Promise<Location | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await Taro.getLocation({
        type,
        isHighAccuracy: true,
        highAccuracyExpireTime: 3000
      });

      const location: Location = {
        latitude: res.latitude,
        longitude: res.longitude,
        accuracy: res.accuracy,
        speed: res.speed
      };

      console.log('[Location] 获取位置成功:', location);
      setCurrentLocation(location);
      return location;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取位置失败';
      setError(errorMsg);
      console.error('[Location] 获取位置失败:', err);
      Taro.showToast({ title: errorMsg, icon: 'none' });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkGeofence = useCallback(async (fence: Geofence): Promise<{
    isInside: boolean;
    distance: number;
    location: Location | null;
  }> => {
    const location = await getCurrentLocation();
    if (!location) {
      return { isInside: false, distance: -1, location: null };
    }

    const isInside = isPointInFence(
      location.latitude,
      location.longitude,
      fence.centerLatitude,
      fence.centerLongitude,
      fence.radius
    );

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      fence.centerLatitude,
      fence.centerLongitude
    );

    console.log('[Location] 围栏检查:', {
      fence: fence.name,
      isInside,
      distance: `${(distance * 1000).toFixed(0)}m`
    });

    return { isInside, distance: distance * 1000, location };
  }, [getCurrentLocation]);

  const checkin = useCallback(async (fence?: Geofence): Promise<CheckinRecord | null> => {
    setLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocation();
      if (!location) {
        throw new Error('无法获取当前位置');
      }

      if (!validateLatitude(location.latitude) || !validateLongitude(location.longitude)) {
        throw new Error('位置信息无效');
      }

      let isInsideFence = false;
      let fenceId: string | undefined;
      let fenceName: string | undefined;

      if (fence) {
        const checkResult = await checkGeofence(fence);
        isInsideFence = checkResult.isInside;
        fenceId = fence.id;
        fenceName = fence.name;
      }

      const record: CheckinRecord = {
        id: `ci_${Date.now()}`,
        courierId: options.userId,
        type: fence ? (isInsideFence ? 'fence_in' : 'fence_out') : 'check_in',
        location: `${location.longitude.toFixed(6)},${location.latitude.toFixed(6)}`,
        longitude: location.longitude,
        latitude: location.latitude,
        fenceId,
        fenceName,
        isInsideFence,
        accuracy: location.accuracy || 0,
        timestamp: Date.now(),
        deviceInfo: Taro.getSystemInfoSync().model
      };

      await logOperation({
        userId: options.userId,
        userName: options.userName,
        module: 'checkin',
        action: 'checkin',
        targetType: 'geofence',
        targetId: fenceId,
        targetName: fenceName || '打卡',
        status: 'success',
        complianceLevel: 'sensitive',
        retentionDays: 365,
        requireLocation: true
      });

      console.log('[Location] 打卡成功:', record);
      Taro.showToast({ title: isInsideFence ? '围栏打卡成功' : '打卡成功', icon: 'success' });
      return record;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '打卡失败';
      setError(errorMsg);
      console.error('[Location] 打卡失败:', err);

      await logOperation({
        userId: options.userId,
        userName: options.userName,
        module: 'checkin',
        action: 'checkin',
        targetType: 'geofence',
        status: 'failed',
        errorMessage: errorMsg,
        complianceLevel: 'sensitive',
        retentionDays: 365
      });

      Taro.showToast({ title: errorMsg, icon: 'none' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [options.userId, options.userName, getCurrentLocation, checkGeofence]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const radLat1 = (lat1 * Math.PI) / 180;
    const radLat2 = (lat2 * Math.PI) / 180;
    const a = radLat1 - radLat2;
    const b = (lng1 * Math.PI) / 180 - (lng2 * Math.PI) / 180;
    let s = 2 * Math.asin(Math.sqrt(Math.sin(a / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(b / 2) ** 2));
    s = s * 6378.137;
    return Math.round(s * 10000) / 10000;
  };

  return {
    loading,
    currentLocation,
    error,
    getCurrentLocation,
    checkGeofence,
    checkin
  };
};
