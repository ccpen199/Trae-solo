import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useUserStore } from '@/store/useUserStore';
import { taskService } from '@/services/task';
import { useLocation } from '@/hooks/useLocation';
import { logOperation } from '@/utils/logger';
import { isPointInFence } from '@/utils/validator';
import type { CheckinRecord, Geofence } from '@/types/task';

const CheckinPage: React.FC = () => {
  const { user } = useUserStore();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [currentFence, setCurrentFence] = useState<Geofence | null>(null);
  const [isInsideFence, setIsInsideFence] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const locationHook = user ? useLocation({ userId: user.id, userName: user.name }) : null;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [fences, checkinRecords] = await Promise.all([
        taskService.getGeofences(),
        taskService.getCheckinRecords(user.id)
      ]);

      setGeofences(fences);
      setRecords(checkinRecords);

      if (locationHook) {
        const location = await locationHook.getCurrentLocation();
        if (location) {
          let matchedFence: Geofence | null = null;
          let inside = false;

          for (const fence of fences) {
            if (isPointInFence(
              location.latitude,
              location.longitude,
              fence.centerLatitude,
              fence.centerLongitude,
              fence.radius
            )) {
              matchedFence = fence;
              inside = true;
              break;
            }
          }

          setCurrentFence(matchedFence);
          setIsInsideFence(inside);
        }
      }
    } catch (e) {
      console.error('[CheckinPage] 加载数据失败:', e);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [user, locationHook]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    loadData();
  });

  const getTodayRecords = (): CheckinRecord[] => {
    const startOfDay = currentTime.startOf('day').valueOf();
    const endOfDay = currentTime.endOf('day').valueOf();
    return records.filter(r => r.timestamp >= startOfDay && r.timestamp <= endOfDay);
  };

  const getTodayCheckin = (): CheckinRecord | undefined => {
    return getTodayRecords().find(r => r.type === 'check_in');
  };

  const getTodayCheckout = (): CheckinRecord | undefined => {
    return getTodayRecords().find(r => r.type === 'check_out');
  };

  const calculateWorkingHours = (): string => {
    const checkin = getTodayCheckin();
    const checkout = getTodayCheckout();

    if (!checkin) return '0.0';

    const startTime = checkin.timestamp;
    const endTime = checkout ? checkout.timestamp : Date.now();
    const hours = (endTime - startTime) / (1000 * 60 * 60);

    return hours.toFixed(1);
  };

  const getTodayStats = () => {
    const todayRecords = getTodayRecords();
    const fenceInCount = todayRecords.filter(r => r.type === 'fence_in').length;
    const fenceOutCount = todayRecords.filter(r => r.type === 'fence_out').length;

    return {
      totalRecords: todayRecords.length,
      fenceInCount,
      fenceOutCount
    };
  };

  const handleCheckin = async (type: 'check_in' | 'check_out') => {
    if (!user || !locationHook || checkinLoading) return;

    if (type === 'check_in' && getTodayCheckin()) {
      Taro.showToast({ title: '今日已上班打卡', icon: 'none' });
      return;
    }

    if (type === 'check_out' && !getTodayCheckin()) {
      Taro.showToast({ title: '请先进行上班打卡', icon: 'none' });
      return;
    }

    if (type === 'check_out' && getTodayCheckout()) {
      Taro.showToast({ title: '今日已下班打卡', icon: 'none' });
      return;
    }

    if (!isInsideFence && type === 'check_in') {
      const confirmRes = await Taro.showModal({
        title: '打卡提醒',
        content: '您当前不在指定打卡区域，是否确认打卡？',
        confirmText: '确认打卡',
        cancelText: '取消'
      });
      if (!confirmRes.confirm) return;
    }

    setCheckinLoading(true);
    try {
      const record = await taskService.checkin(type, user.id, user.name);

      if (record) {
        setRecords([record, ...records]);

        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'checkin',
          action: type,
          targetType: 'checkin',
          targetId: record.id,
          targetName: type === 'check_in' ? '上班打卡' : '下班打卡',
          status: 'success',
          complianceLevel: 'critical',
          retentionDays: 365,
          requireLocation: true,
          requestParams: {
            type,
            location: record.location,
            fenceName: record.fenceName,
            isInsideFence: record.isInsideFence
          },
          responseResult: { checkinId: record.id }
        });

        if (isInsideFence && currentFence) {
          Taro.showToast({
            title: `${currentFence.name}${type === 'check_in' ? '上班' : '下班'}打卡成功`,
            icon: 'success'
          });
        } else {
          Taro.showToast({
            title: `${type === 'check_in' ? '上班' : '下班'}打卡成功`,
            icon: 'success'
          });
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '打卡失败';
      console.error('[CheckinPage] 打卡失败:', e);

      if (user) {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'checkin',
          action: type,
          targetType: 'checkin',
          status: 'failed',
          errorMessage: errorMsg,
          complianceLevel: 'critical',
          retentionDays: 365
        });
      }

      Taro.showToast({ title: errorMsg, icon: 'none' });
    } finally {
      setCheckinLoading(false);
    }
  };

  const formatTime = (timestamp: number): string => {
    return dayjs(timestamp).format('HH:mm:ss');
  };

  const formatDate = (timestamp: number): string => {
    return dayjs(timestamp).format('YYYY-MM-DD');
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      check_in: '上班打卡',
      check_out: '下班打卡',
      fence_in: '进入围栏',
      fence_out: '离开围栏'
    };
    return labels[type] || type;
  };

  const todayStats = getTodayStats();
  const todayCheckin = getTodayCheckin();
  const todayCheckout = getTodayCheckout();

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.currentTime}>{currentTime.format('HH:mm:ss')}</Text>
        <Text className={styles.currentDate}>{currentTime.format('YYYY年MM月DD日 dddd')}</Text>
        <View className={styles.workingHours}>
          <Text className={styles.icon}>⏱️</Text>
          <Text className={styles.text}>今日工作时长：</Text>
          <Text className={styles.value}>{calculateWorkingHours()} 小时</Text>
        </View>
      </View>

      <View className={classnames(styles.locationStatus, isInsideFence ? styles.inside : styles.outside)}>
        <Text className={styles.icon}>{isInsideFence ? '📍' : '⚠️'}</Text>
        <Text className={styles.text}>
          {isInsideFence && currentFence
            ? `已进入打卡区域：${currentFence.name}`
            : '当前不在指定打卡区域'}
        </Text>
      </View>

      <View className={styles.statusSection}>
        <Text className={styles.sectionTitle}>今日打卡状态</Text>
        <View className={styles.statusRow}>
          <View className={styles.statusItem}>
            <View className={styles.icon}>🌅</View>
            <Text className={styles.label}>上班打卡</Text>
            {todayCheckin ? (
              <Text className={styles.value}>{formatTime(todayCheckin.timestamp)}</Text>
            ) : (
              <Text className={styles.empty}>未打卡</Text>
            )}
          </View>
          <View className={styles.statusItem}>
            <View className={styles.icon}>🌇</View>
            <Text className={styles.label}>下班打卡</Text>
            {todayCheckout ? (
              <Text className={styles.value}>{formatTime(todayCheckout.timestamp)}</Text>
            ) : (
              <Text className={styles.empty}>未打卡</Text>
            )}
          </View>
        </View>
        {currentFence && (
          <View className={styles.fenceInfo}>
            <View className={styles.icon}>🏢</View>
            <View className={styles.info}>
              <Text className={styles.title}>{currentFence.name}</Text>
              <Text className={styles.desc}>{currentFence.address}</Text>
            </View>
            <Text className={styles.status}>
              {isInsideFence ? '已在范围内' : '不在范围内'}
            </Text>
          </View>
        )}
      </View>

      <View className={styles.checkinButtons}>
        <View
          className={classnames(styles.checkinBtn, styles.checkIn, (todayCheckin || checkinLoading) && styles.disabled)}
          onClick={() => handleCheckin('check_in')}
        >
          <Text className={styles.icon}>🌅</Text>
          <Text className={styles.title}>{checkinLoading ? '打卡中...' : '上班打卡'}</Text>
          {todayCheckin && (
            <Text className={styles.time}>已打卡 {formatTime(todayCheckin.timestamp)}</Text>
          )}
        </View>
        <View
          className={classnames(styles.checkinBtn, styles.checkOut, (!todayCheckin || todayCheckout || checkinLoading) && styles.disabled)}
          onClick={() => handleCheckin('check_out')}
        >
          <Text className={styles.icon}>🌇</Text>
          <Text className={styles.title}>{checkinLoading ? '打卡中...' : '下班打卡'}</Text>
          {todayCheckout && (
            <Text className={styles.time}>已打卡 {formatTime(todayCheckout.timestamp)}</Text>
          )}
        </View>
      </View>

      <View className={styles.statsSection}>
        <Text className={styles.sectionTitle}>今日统计</Text>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.value}>{todayStats.totalRecords}</Text>
            <Text className={styles.label}>打卡次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{todayStats.fenceInCount}</Text>
            <Text className={styles.label}>进入围栏</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{todayStats.fenceOutCount}</Text>
            <Text className={styles.label}>离开围栏</Text>
          </View>
        </View>
      </View>

      <ScrollView
        scrollY
        className={styles.historySection}
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        <Text className={styles.sectionTitle}>打卡历史</Text>
        {loading ? (
          <View className={styles.loading}>
            <Text>加载中...</Text>
          </View>
        ) : records.length > 0 ? (
          <View className={styles.historyList}>
            {records.slice(0, 20).map((record) => (
              <View key={record.id} className={styles.historyItem}>
                <View className={classnames(styles.typeIcon, record.type === 'check_in' || record.type === 'fence_in' ? styles.checkIn : styles.checkOut)}>
                  <Text>{record.type === 'check_in' || record.type === 'fence_in' ? '→' : '←'}</Text>
                </View>
                <View className={styles.info}>
                  <Text className={styles.title}>{getTypeLabel(record.type)}</Text>
                  <Text className={styles.location}>{record.location}</Text>
                </View>
                <View className={styles.time}>
                  <Text className={styles.main}>{formatTime(record.timestamp)}</Text>
                  <Text className={styles.fence}>
                    {record.fenceName || (record.isInsideFence ? '围栏内' : '围栏外')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.empty}>
            <Text className={styles.icon}>📋</Text>
            <Text className={styles.text}>暂无打卡记录</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default CheckinPage;
