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
import type { SyncStatus } from '@/services/cainiao';

interface ComplianceStats {
  pendingWaybills: number;
  pendingEbill: number;
  pendingEvidence: number;
  pendingFence: number;
  pendingCompliance: number;
  pendingReview: number;
  totalArchives: number;
  verifiedArchives: number;
  todayLogs: number;
  criticalLogs: number;
  lastArchiveTime: number | null;
  lastHashVerifyTime: number | null;
}

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [warnings, setWarnings] = useState<TaskWarning[]>([]);
  const [offlineCount, setOfflineCount] = useState({ pickup: 0, delivery: 0 });
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null);
  const [pendingTasks, setPendingTasks] = useState<{ type: string; count: number; description: string }[]>([]);
  const [cainiaoAuthorized, setCainiaoAuthorized] = useState(false);

  const { user, site } = useUserStore();
  const { heatmapPoints, pickupTasks: storePickupTasks, deliveryTasks: storeDeliveryTasks, exceptions, getHeatmapPoints } = useTaskStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, warningsData, offlineData, syncData, complianceData, pendingTasksData] = await Promise.all([
        taskService.getDailyStats(),
        taskService.getWarnings(),
        waybillService.getOfflinePendingCount(),
        cainiaoService.getSyncStatus(),
        taskService.getComplianceStats(),
        taskService.getPendingTasks(),
        getHeatmapPoints()
      ]);

      const unreadOvertimeWarnings = warningsData.filter(w => !w.isRead && w.type === 'overtime');

      setStats({
        ...statsData,
        overtimeCount: unreadOvertimeWarnings.length
      });
      setWarnings(warningsData.filter(w => !w.isRead).slice(0, 3));
      setOfflineCount(offlineData);
      setSyncStatus(syncData);
      setComplianceStats(complianceData);
      setPendingTasks(pendingTasksData);
      setCainiaoAuthorized(syncData.isAuthorized);
      setIsOnline(navigator.onLine);
    } catch (e) {
      console.error('[HomePage] 加载数据失败:', e);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [getHeatmapPoints]);

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

  const quickActions: QuickActionItem[] = React.useMemo(() => {
    const getPendingCount = (type: string) => {
      const task = pendingTasks.find(t => t.type === type);
      return task?.count || 0;
    };

    const cainiaoBadge = syncStatus ? syncStatus.pendingPush + syncStatus.pendingException : 0;
    const cainiaoSubtitle = syncStatus?.isAuthorized
      ? (syncStatus.lastSyncTime
        ? `${formatTimeShort(syncStatus.lastSyncTime)}同步`
        : '待同步')
      : '未授权';

    const logSubtitle = complianceStats
      ? `${complianceStats.todayLogs}条操作记录`
      : '合规留痕';

    return [
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
        id: 'pending_waybills',
        title: '待处理运单',
        subtitle: `${getPendingCount('waybill')}单待处理`,
        icon: '�',
        color: 'primary',
        path: '/pages/dispatch/index',
        badge: getPendingCount('waybill')
      },
      {
        id: 'ebill_link',
        title: '电子面单',
        subtitle: `${getPendingCount('ebill')}单待关联`,
        icon: '🧾',
        color: 'success',
        path: '/pages/waybill-detail/index',
        badge: getPendingCount('ebill')
      },
      {
        id: 'evidence_review',
        title: '取证原因',
        subtitle: `${getPendingCount('evidence')}条待确认`,
        icon: '📸',
        color: 'warning',
        path: '/pages/exception/index',
        badge: getPendingCount('evidence')
      },
      {
        id: 'fence_check',
        title: '围栏校验',
        subtitle: `${getPendingCount('fence')}条待复核`,
        icon: '�️',
        color: 'checkin',
        path: '/pages/checkin/index',
        badge: getPendingCount('fence')
      },
      {
        id: 'compliance_review',
        title: '合规留痕',
        subtitle: `${getPendingCount('compliance')}条待确认`,
        icon: '✅',
        color: 'primary',
        path: '/pages/operation-log/index',
        badge: getPendingCount('compliance')
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
        id: 'cainiao_sync',
        title: '菜鸟同步',
        subtitle: cainiaoSubtitle,
        icon: cainiaoAuthorized ? '🔄' : '🔒',
        color: 'purple',
        path: '',
        badge: cainiaoBadge
      },
      {
        id: 'operation_log',
        title: '操作日志',
        subtitle: logSubtitle,
        icon: '📋',
        color: 'warning',
        path: '/pages/operation-log/index'
      }
    ];
  }, [offlineCount, syncStatus, complianceStats, pendingTasks, cainiaoAuthorized]);

  const handleQuickActionClick = async (item: QuickActionItem) => {
    if (item.id === 'cainiao_sync') {
      if (user) {
        if (!syncStatus?.isAuthorized) {
          const res = await cainiaoService.auth(user.id, user.name);
          if (res) {
            loadData();
          }
        } else {
          await cainiaoService.syncAll(user.id, user.name);
          loadData();
        }
      }
      return;
    }

    if (item.id === 'compliance_review' || item.id === 'operation_log') {
      Taro.navigateTo({
        url: `/pages/operation-log/index?module=${item.id === 'compliance_review' ? 'compliance' : 'all'}`
      });
      return;
    }

    if (item.id === 'ebill_link') {
      Taro.navigateTo({
        url: '/pages/archive/index?type=ebill'
      });
      return;
    }

    if (item.id === 'evidence_review') {
      Taro.navigateTo({
        url: '/pages/exception/index?filter=pending'
      });
      return;
    }

    if (item.id === 'fence_check') {
      Taro.navigateTo({
        url: '/pages/checkin/index?tab=fence'
      });
      return;
    }

    if (item.id === 'pending_waybills') {
      Taro.switchTab({
        url: '/pages/dispatch/index'
      });
      return;
    }

    if (item.path) {
      Taro.navigateTo({ url: item.path });
    }
  };

  const formatTimeShort = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return '今日';
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

  const totalOffline = offlineCount.pickup + offlineCount.delivery + (syncStatus?.pendingPush || 0) + (syncStatus?.pendingException || 0);
  const totalPending = pendingTasks.reduce((acc, t) => acc + t.count, 0);

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

      {syncStatus && (
        <View className={styles.complianceStatusBar}>
          <View className={styles.statusBarTitle}>
            <Text className={styles.statusBarTitleText}>📊 合规管控状态</Text>
            <Text className={styles.statusBarAction} onClick={() => Taro.navigateTo({ url: '/pages/archive/index' })}>
              合规详情
            </Text>
          </View>
          <View className={styles.statusGrid}>
            <View className={styles.statusItem}>
              <Text className={styles.statusItemIcon}>🔄</Text>
              <View className={styles.statusItemInfo}>
                <Text className={styles.statusItemLabel}>菜鸟同步</Text>
                <Text className={classnames(styles.statusItemValue, styles[syncStatus.syncStatus])}>
                  {syncStatus.isAuthorized
                    ? (syncStatus.syncStatus === 'syncing' ? '同步中...'
                      : syncStatus.syncStatus === 'success' ? '已同步'
                      : syncStatus.syncStatus === 'failed' ? '同步失败'
                      : `${syncStatus.todayPulled + syncStatus.todayPushed}条`)
                    : '未授权'}
                </Text>
              </View>
              {syncStatus.pendingPush + syncStatus.pendingException > 0 && (
                <View className={styles.statusItemBadge}>
                  <Text>{syncStatus.pendingPush + syncStatus.pendingException}</Text>
                </View>
              )}
            </View>
            <View className={styles.statusItem}>
              <Text className={styles.statusItemIcon}>📦</Text>
              <View className={styles.statusItemInfo}>
                <Text className={styles.statusItemLabel}>运单池</Text>
                <Text className={styles.statusItemValue}>
                  {complianceStats?.totalArchives || 0}单
                </Text>
              </View>
            </View>
            <View className={styles.statusItem}>
              <Text className={styles.statusItemIcon}>🔒</Text>
              <View className={styles.statusItemInfo}>
                <Text className={styles.statusItemLabel}>司法存证</Text>
                <Text className={styles.statusItemValue}>
                  {complianceStats?.verifiedArchives || 0}份
                </Text>
              </View>
            </View>
            <View className={styles.statusItem}>
              <Text className={styles.statusItemIcon}>🧾</Text>
              <View className={styles.statusItemInfo}>
                <Text className={styles.statusItemLabel}>合规留痕</Text>
                <Text className={styles.statusItemValue}>
                  {complianceStats?.todayLogs || 0}条
                </Text>
              </View>
              {complianceStats?.criticalLogs && complianceStats.criticalLogs > 0 && (
                <View className={classnames(styles.statusItemBadge, styles.danger)}>
                  <Text>{complianceStats.criticalLogs}</Text>
                </View>
              )}
            </View>
          </View>
          {complianceStats?.lastArchiveTime && (
            <View className={styles.statusFooter}>
              <Text className={styles.statusFooterText}>
                最近归档: {formatTimeShort(complianceStats.lastArchiveTime)} ·{' '}
                {complianceStats.lastHashVerifyTime ? `哈希校验: ${formatTimeShort(complianceStats.lastHashVerifyTime)}` : '待校验'}
              </Text>
            </View>
          )}
        </View>
      )}

      {totalPending > 0 && (
        <View className={styles.pendingTasksBar}>
          <View className={styles.pendingTasksTitle}>
            <Text className={styles.pendingTasksIcon}>⏳</Text>
            <Text className={styles.pendingTasksTitleText}>待处理事项</Text>
            <View className={styles.pendingTasksTotal}>
              <Text>{totalPending}项</Text>
            </View>
          </View>
          <ScrollView scrollX className={styles.pendingTasksScroll}>
            {pendingTasks.filter(t => t.count > 0).map(task => (
              <View
                key={task.type}
                className={styles.pendingTaskItem}
                onClick={() => handleQuickActionClick({ id: task.type, path: '', title: task.description, icon: '⏳', color: 'primary' } as QuickActionItem)}
              >
                <Text className={styles.pendingTaskCount}>{task.count}</Text>
                <Text className={styles.pendingTaskDesc}>{task.description}</Text>
              </View>
            ))}
          </ScrollView>
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
