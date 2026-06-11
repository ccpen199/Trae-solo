import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatCard from '@/components/StatCard';
import QuickAction from '@/components/QuickAction';
import HeatmapView from '@/components/HeatmapView';
import { useTaskStore } from '@/store/useTaskStore';
import { useUserStore } from '@/store/useUserStore';
import { taskService } from '@/services/task';
import { waybillService } from '@/services/waybill';
import { cainiaoService } from '@/services/cainiao';
import type { DailyStats, TaskWarning } from '@/types/task';
import type { QuickActionItem } from '@/components/QuickAction';

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [warnings, setWarnings] = useState<TaskWarning[]>([]);
  const [offlineCount, setOfflineCount] = useState({ pickup: 0, delivery: 0 });
  const [cainiaoOffline, setCainiaoOffline] = useState({ push: 0, exception: 0 });
  const [isOnline, setIsOnline] = useState(true);

  const { user, site } = useUserStore();
  const { heatmapPoints, pickupTasks: storePickupTasks, deliveryTasks: storeDeliveryTasks, exceptions, getHeatmapPoints } = useTaskStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, warningsData, offlineData, cainiaoData] = await Promise.all([
        taskService.getDailyStats(),
        taskService.getWarnings(),
        waybillService.getOfflinePendingCount(),
        Promise.resolve(cainiaoService.getOfflinePendingCount())
      ]);

      setStats(statsData);
      setWarnings(warningsData.filter(w => !w.isRead).slice(0, 3));
      setOfflineCount(offlineData);
      setCainiaoOffline(cainiaoData);
      setIsOnline(navigator.onLine);
    } catch (e) {
      console.error('[HomePage] 加载数据失败:', e);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData]);

  useDidShow(() => {
    loadData();
  });

  const handlePullDownRefresh = () => {
    loadData();
  };

  useEffect(() => {
    Taro.eventCenter.on('onPullDownRefresh', handlePullDownRefresh);
    return () => {
      Taro.eventCenter.off('onPullDownRefresh', handlePullDownRefresh);
    };
  }, [handlePullDownRefresh]);

  const quickActions: QuickActionItem[] = [
    {
      id: 'scan_pickup',
      title: '扫码揽件',
      subtitle: '离线可用',
      icon: '📦',
      color: 'primary',
      path: '/pages/scan/index?type=pickup',
      badge: offlineCount.pickup
    },
    {
      id: 'scan_delivery',
      title: '扫码派送',
      subtitle: '电子签收',
      icon: '🚚',
      color: 'success',
      path: '/pages/scan/index?type=delivery',
      badge: offlineCount.delivery
    },
    {
      id: 'station_sign',
      title: '驿站签收',
      subtitle: '批量扫码',
      icon: '🏪',
      color: 'purple',
      path: '/pages/scan/index?type=station'
    },
    {
      id: 'exception_report',
      title: '异常上报',
      subtitle: '拍照取证',
      icon: '⚠️',
      color: 'warning',
      path: '/pages/exception-report/index'
    },
    {
      id: 'checkin',
      title: '考勤打卡',
      subtitle: '围栏验证',
      icon: '📍',
      color: 'primary',
      path: '/pages/checkin/index'
    },
    {
      id: 'heatmap',
      title: '任务热力图',
      subtitle: '实时调度',
      icon: '🗺️',
      color: 'success',
      path: ''
    },
    {
      id: 'cainiao_sync',
      title: '菜鸟同步',
      subtitle: '双向同步',
      icon: '🔄',
      color: 'purple',
      path: '',
      badge: cainiaoOffline.push + cainiaoOffline.exception
    },
    {
      id: 'operation_log',
      title: '操作日志',
      subtitle: '合规留痕',
      icon: '📋',
      color: 'warning',
      path: '/pages/operation-log/index'
    }
  ];

  const handleQuickActionClick = async (item: QuickActionItem) => {
    if (item.id === 'cainiao_sync') {
      if (user) {
        await cainiaoService.syncAll(user.id, user.name);
        loadData();
      }
      return;
    }

    if (item.path) {
      Taro.navigateTo({ url: item.path });
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return `${Math.floor(diff / 86400000)}天前`;
    }
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 6) return '深夜好';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  const handleWarningClick = async (warning: TaskWarning) => {
    if (user) {
      await taskService.markWarningRead(warning.id, user.id, user.name);
      loadData();
    }

    if (warning.waybillNo) {
      Taro.navigateTo({
        url: `/pages/waybill-detail/index?waybillNo=${warning.waybillNo}`
      });
    }
  };

  const handleSyncClick = async () => {
    if (!user) return;
    const result = await waybillService.syncOfflineData(user.id, user.name);
    Taro.showToast({
      title: `同步完成：成功${result.success}条，失败${result.failed}条`,
      icon: 'none'
    });
    loadData();
  };

  const totalOffline = offlineCount.pickup + offlineCount.delivery + cainiaoOffline.push + cainiaoOffline.exception;

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={loading}
      onRefresherRefresh={loadData}
    >
      {!isOnline && (
        <View className={styles.offlineBadge}>
          <Text>📡 离线模式</Text>
        </View>
      )}

      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text>👤</Text>
          </View>
          <View className={styles.userText}>
            <Text className={styles.greeting}>{getGreeting()}</Text>
            <Text className={styles.userName}>{user?.name || '快递员'}</Text>
            <Text className={styles.siteInfo}>
              {site?.name || '朝阳路营业点'} · 工号 {user?.employeeId || '001'}
            </Text>
          </View>
          <View className={styles.onlineStatus}>
            <View className={styles.statusDot} />
            <Text className={styles.statusText}>{isOnline ? '在线' : '离线'}</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsGrid}>
        <StatCard
          title="今日揽件"
          value={stats?.completedPickup || 0}
          unit={`/${stats?.totalPickup || 0}`}
          icon="📦"
          color="primary"
          trend={12}
        />
        <StatCard
          title="今日派件"
          value={stats?.completedDelivery || 0}
          unit={`/${stats?.totalDelivery || 0}`}
          icon="🚚"
          color="success"
          trend={8}
        />
        <StatCard
          title="异常件"
          value={stats?.exceptionCount || 0}
          unit="件"
          icon="⚠️"
          color="warning"
          trend={-5}
        />
        <StatCard
          title="超时预警"
          value={stats?.overtimeCount || 0}
          unit="件"
          icon="⏰"
          color="error"
        />
      </View>

      {totalOffline > 0 && (
        <View className={styles.syncBar}>
          <View className={styles.syncInfo}>
            <Text className={styles.syncIcon}>📡</Text>
            <Text className={styles.syncText}>
              {totalOffline}条数据待同步
            </Text>
          </View>
          <View className={styles.syncBtn} onClick={handleSyncClick}>
            <Text>立即同步</Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>快捷操作</Text>
        </View>
        <QuickAction
          items={quickActions}
          columns={4}
          onItemClick={handleQuickActionClick}
        />
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>任务热力图</Text>
          <Text className={styles.sectionAction}>查看全部</Text>
        </View>
        <View className={styles.heatmapContainer}>
          <HeatmapView points={heatmapPoints} height={300} />
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>预警提醒</Text>
          <Text className={styles.sectionAction}>全部预警</Text>
        </View>
        <View className={styles.warningList}>
          {warnings.length > 0 ? (
            warnings.map(warning => (
              <View
                key={warning.id}
                className={classnames(styles.warningItem, styles[warning.severity])}
                onClick={() => handleWarningClick(warning)}
              >
                <Text className={styles.warningIcon}>
                  {warning.severity === 'danger' ? '🔴' : warning.severity === 'warning' ? '🟡' : '🔵'}
                </Text>
                <View className={styles.warningContent}>
                  <Text className={styles.warningTitle}>{warning.title}</Text>
                  <Text className={styles.warningDesc}>{warning.description}</Text>
                  <Text className={styles.warningTime}>{formatTime(warning.createTime)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.empty}>
              <Text>🎉 暂无预警提醒</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>工作统计</Text>
        </View>
        <View className={styles.statsGrid} style={{ marginTop: 0, padding: 0, marginBottom: 0 }}>
          <StatCard
            title="工作时长"
            value={stats?.workingHours || 0}
            unit="小时"
            icon="⏱️"
            color="primary"
          />
          <StatCard
            title="行驶里程"
            value={stats?.distance || 0}
            unit="公里"
            icon="🛣️"
            color="success"
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
