import React, { useState, useEffect, useCallback } from 'react';
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
import type { DailyStats, TaskWarning, TaskHeatmapPoint, Geofence } from '@/types/task';
import type { QuickActionItem } from '@/components/QuickAction';

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
  const [isCainiaoAuth, setIsCainiaoAuth] = useState(false);
  const [cainiaoPending, setCainiaoPending] = useState(0);
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null);
  const [pendingTasks, setPendingTasks] = useState<{ type: string; count: number; description: string }[]>([]);
  const [fences, setFences] = useState<Geofence[]>([]);
  const [selectedFenceId, setSelectedFenceId] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const { user, site } = useUserStore();
  const { heatmapPoints, getHeatmapPoints } = useTaskStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, warningsData, offlineData, compData, pendingData, fencesData] = await Promise.all([
        taskService.getDailyStats(),
        taskService.getWarnings(),
        waybillService.getOfflinePendingCount(),
        taskService.getComplianceStats(),
        taskService.getPendingTasks(),
        taskService.getGeofences(),
        getHeatmapPoints()
      ]);

      const unreadOvertime = warningsData.filter(w => !w.isRead && w.type === 'overtime');

      setStats({
        ...statsData,
        overtimeCount: unreadOvertime.length
      });
      setWarnings(warningsData.filter(w => !w.isRead).slice(0, 3));
      setOfflineCount(offlineData);
      setComplianceStats(compData);
      setPendingTasks(pendingData);
      setFences(fencesData);
      setIsCainiaoAuth(!!cainiaoService.getConfig().token);

      const syncStatus = cainiaoService.getSyncStatus();
      setCainiaoPending(syncStatus.pendingPush + syncStatus.pendingException);
      setLastSyncTime(syncStatus.lastSyncTime);

      setIsOnline(navigator.onLine);
    } catch (e) {
      console.error('[HomePage] 加载失败:', e);
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

  const handlePullDownRefresh = () => loadData();

  useEffect(() => {
    Taro.eventCenter.on('onPullDownRefresh', handlePullDownRefresh);
    return () => Taro.eventCenter.off('onPullDownRefresh', handlePullDownRefresh);
  }, [handlePullDownRefresh]);

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

  const formatTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  const getPendingCount = (type: string): number => {
    const task = pendingTasks.find(t => t.type === type);
    return task?.count || 0;
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'scan_pickup',
      title: '扫码揽件',
      subtitle: offlineCount.pickup > 0 ? `${offlineCount.pickup}单待同步` : '离线可用',
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
      icon: '📋',
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
      path: '/pages/archive/index?type=ebill',
      badge: getPendingCount('ebill')
    },
    {
      id: 'evidence_review',
      title: '取证原因',
      subtitle: `${getPendingCount('evidence')}条待确认`,
      icon: '📸',
      color: 'warning',
      path: '/pages/exception/index?filter=pending',
      badge: getPendingCount('evidence')
    },
    {
      id: 'fence_check',
      title: '围栏校验',
      subtitle: `${getPendingCount('fence')}条待复核`,
      icon: '🛡️',
      color: 'checkin',
      path: '/pages/checkin/index?tab=fence',
      badge: getPendingCount('fence')
    },
    {
      id: 'compliance_review',
      title: '合规留痕',
      subtitle: `${getPendingCount('compliance')}条待确认`,
      icon: '✅',
      color: 'primary',
      path: '/pages/operation-log/index?module=compliance',
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
      subtitle: isCainiaoAuth ? (lastSyncTime ? `${formatTime(lastSyncTime)}同步` : '待同步') : '未授权',
      icon: isCainiaoAuth ? '🔄' : '🔒',
      color: 'purple',
      path: '',
      badge: cainiaoPending
    },
    {
      id: 'operation_log',
      title: '操作日志',
      subtitle: complianceStats ? `${complianceStats.todayLogs}条记录` : '合规留痕',
      icon: '📋',
      color: 'warning',
      path: '/pages/operation-log/index'
    }
  ];

  const handleQuickAction = async (item: QuickActionItem) => {
    if (item.id === 'cainiao_sync') {
      if (user) {
        if (!isCainiaoAuth) {
          const res = await cainiaoService.auth(user.id, user.name);
          if (res) {
            setIsCainiaoAuth(true);
            loadData();
          }
        } else {
          await cainiaoService.syncAll(user.id, user.name);
          loadData();
        }
      }
      return;
    }

    if (item.id === 'compliance_review') {
      Taro.navigateTo({ url: '/pages/operation-log/index?module=compliance' });
      return;
    }
    if (item.id === 'evidence_review') {
      Taro.switchTab({ url: '/pages/exception/index' });
      return;
    }
    if (item.id === 'fence_check') {
      Taro.navigateTo({ url: '/pages/checkin/index?tab=fence' });
      return;
    }
    if (item.id === 'pending_waybills') {
      Taro.switchTab({ url: '/pages/dispatch/index' });
      return;
    }
    if (item.id === 'ebill_link') {
      Taro.navigateTo({ url: '/pages/archive/index?type=ebill' });
      return;
    }

    if (item.path) {
      Taro.navigateTo({ url: item.path });
    }
  };

  const handleWarningClick = async (warning: TaskWarning) => {
    if (user) {
      await taskService.markWarningRead(warning.id, user.id, user.name);
      loadData();
    }
    if (warning.waybillNo) {
      Taro.navigateTo({ url: `/pages/waybill-detail/index?waybillNo=${warning.waybillNo}` });
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

  const handlePointClick = (point: TaskHeatmapPoint) => {
    console.log('[HomePage] 点击热力点:', point);
  };

  const handleFenceSelect = (fence: Geofence) => {
    setSelectedFenceId(fence.id === selectedFenceId ? '' : fence.id);
    Taro.showToast({ title: `已选择围栏：${fence.name}`, icon: 'none' });
  };

  const handleDispatchAction = (type: string) => {
    Taro.showToast({ title: `${type}调度功能`, icon: 'none' });
  };

  const totalOffline = offlineCount.pickup + offlineCount.delivery + cainiaoPending;
  const totalPending = pendingTasks.reduce((acc, t) => acc + t.count, 0);

  const workflowSteps = [
    { key: 'pickup', label: '揽件', icon: '📦', count: stats?.completedPickup || 0, status: stats?.completedPickup ? 'active' : 'pending', path: '/pages/dispatch/index?tab=pickup' },
    { key: 'ebill', label: '电子面单', icon: '🧾', count: (stats?.completedPickup || 0) - (complianceStats?.pendingEbill || 0), status: stats?.completedPickup ? 'completed' : 'pending', path: '/pages/archive/index?type=ebill' },
    { key: 'delivery', label: '派送', icon: '🚚', count: stats?.totalDelivery || 0, status: stats?.completedDelivery ? 'active' : 'pending', path: '/pages/dispatch/index?tab=delivery' },
    { key: 'sign', label: '签收', icon: '✅', count: stats?.completedDelivery || 0, status: stats?.completedDelivery ? 'completed' : 'pending', path: '/pages/scan/index?type=station' },
    { key: 'exception', label: '异常', icon: '⚠️', count: stats?.exceptionCount || 0, status: stats?.exceptionCount ? 'exception' : 'completed', path: '/pages/exception/index' },
    { key: 'archive', label: '归档存证', icon: '🔒', count: complianceStats?.totalArchives || 0, status: complianceStats?.totalArchives ? 'completed' : 'pending', path: '/pages/archive/index' }
  ];

  const handleWorkflowClick = (step: typeof workflowSteps[0]) => {
    if (step.path) {
      if (step.key === 'delivery' || step.key === 'pickup') {
        Taro.switchTab({ url: '/pages/dispatch/index' });
      } else if (step.key === 'exception') {
        Taro.switchTab({ url: '/pages/exception/index' });
      } else {
        Taro.navigateTo({ url: step.path });
      }
    }
  };

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

        <View className={styles.workflowBar}>
          <Text className={styles.workflowTitle}>今日作业流程</Text>
          <ScrollView scrollX className={styles.workflowScroll}>
            {workflowSteps.map((step, index) => (
              <View key={step.key} className={styles.workflowItem}>
                {index > 0 && <View className={styles.workflowConnector} />}
                <View
                  className={classnames(styles.workflowNode, styles[`step${step.status.charAt(0).toUpperCase() + step.status.slice(1)}`])}
                  onClick={() => handleWorkflowClick(step)}
                >
                  <Text className={styles.workflowIcon}>{step.icon}</Text>
                  <Text className={styles.workflowCount}>{step.count}</Text>
                </View>
                <Text className={styles.workflowLabel}>{step.label}</Text>
              </View>
            ))}
          </ScrollView>
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
            <Text className={styles.syncText}>{totalOffline}条数据待同步</Text>
          </View>
          <View className={styles.syncBtn} onClick={handleSyncClick}>
            <Text>立即同步</Text>
          </View>
        </View>
      )}

      {complianceStats && (
        <View className={classnames(styles.complianceBar, { [styles.unauthorized]: !isCainiaoAuth })}>
          <View className={styles.complianceHeader}>
            <Text className={styles.complianceTitle}>
              📊 合规管控状态
              {!isCainiaoAuth && <Text className={styles.modeTag}>本地模式</Text>}
            </Text>
            <Text className={styles.complianceAction} onClick={() => Taro.navigateTo({ url: '/pages/archive/index' })}>
              合规详情 →
            </Text>
          </View>
          <View className={styles.complianceGrid}>
            <View className={styles.compItem}>
              <Text className={styles.compIcon}>🔄</Text>
              <Text className={styles.compLabel}>菜鸟同步</Text>
              <Text className={classnames(styles.compValue, isCainiaoAuth ? styles.syncActive : styles.syncIdle)}>
                {isCainiaoAuth ? '已授权' : '未授权(本地)'}
              </Text>
              {cainiaoPending > 0 && <View className={styles.compBadge}><Text>{cainiaoPending}</Text></View>}
            </View>
            <View className={styles.compItem}>
              <Text className={styles.compIcon}>📦</Text>
              <Text className={styles.compLabel}>运单池</Text>
              <Text className={styles.compValue}>{complianceStats.totalArchives}单</Text>
            </View>
            <View className={styles.compItem}>
              <Text className={styles.compIcon}>🔒</Text>
              <Text className={styles.compLabel}>司法存证</Text>
              <Text className={styles.compValue}>{complianceStats.verifiedArchives}份</Text>
            </View>
            <View className={styles.compItem}>
              <Text className={styles.compIcon}>🧾</Text>
              <Text className={styles.compLabel}>合规留痕</Text>
              <Text className={styles.compValue}>{complianceStats.todayLogs}条</Text>
              {complianceStats.criticalLogs > 0 && (
                <View className={classnames(styles.compBadge, styles.danger)}><Text>{complianceStats.criticalLogs}</Text></View>
              )}
            </View>
          </View>
          {complianceStats.lastArchiveTime && (
            <View className={styles.complianceFooter}>
              <Text className={styles.compFooterText}>
                最近归档: {formatTime(complianceStats.lastArchiveTime)} ·{' '}
                {complianceStats.lastHashVerifyTime ? `哈希校验: ${formatTime(complianceStats.lastHashVerifyTime)}` : '待校验'}
              </Text>
              <Text
                className={styles.compFooterLink}
                onClick={() => Taro.navigateTo({ url: '/pages/operation-log/index?module=review' })}
              >
                复查记录 →
              </Text>
            </View>
          )}
        </View>
      )}

      {totalPending > 0 && (
        <View className={styles.pendingBar}>
          <View className={styles.pendingHeader}>
            <Text className={styles.pendingIcon}>⏳</Text>
            <Text className={styles.pendingTitle}>待处理事项</Text>
            <View className={styles.pendingTotal}><Text>{totalPending}项</Text></View>
          </View>
          <ScrollView scrollX className={styles.pendingScroll}>
            {pendingTasks.filter(t => t.count > 0).map(task => (
              <View
                key={task.type}
                className={styles.pendingItem}
                onClick={() => handleQuickAction({ id: task.type, path: '', title: task.description, icon: '⏳', color: 'primary' } as QuickActionItem)}
              >
                <Text className={styles.pendingCount}>{task.count}</Text>
                <Text className={styles.pendingDesc}>{task.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>快捷操作</Text>
          <Text className={styles.sectionAction} onClick={() => Taro.switchTab({ url: '/pages/dispatch/index' })}>
            全部任务 →
          </Text>
        </View>
        <QuickAction items={quickActions} columns={4} onItemClick={handleQuickAction} />
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>任务热力图</Text>
          <Text className={styles.sectionAction} onClick={() => Taro.switchTab({ url: '/pages/dispatch/index' })}>
            调度详情 →
          </Text>
        </View>
        <HeatmapView
          points={heatmapPoints}
          fences={fences}
          height={400}
          showDimensionSwitch={true}
          showStatusFilter={true}
          showDispatchPanel={true}
          selectedFenceId={selectedFenceId}
          onPointClick={handlePointClick}
          onFenceSelect={handleFenceSelect}
          onDispatch={handleDispatchAction}
          onViewAll={() => Taro.switchTab({ url: '/pages/dispatch/index' })}
        />
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>预警提醒</Text>
          <Text className={styles.sectionAction} onClick={() => Taro.switchTab({ url: '/pages/exception/index' })}>
            全部预警 →
          </Text>
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
            <View className={styles.emptyTip}>
              <Text>🎉 暂无预警提醒</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>工作统计</Text>
          <Text className={styles.sectionAction} onClick={() => Taro.navigateTo({ url: '/pages/mine/index' })}>
            查看详情 →
          </Text>
        </View>
        <View className={styles.miniStats}>
          <StatCard title="工作时长" value={stats?.workingHours || 0} unit="小时" icon="⏱️" color="primary" />
          <StatCard title="行驶里程" value={stats?.distance || 0} unit="公里" icon="🛣️" color="success" />
        </View>
      </View>

      <View className={styles.bottomSpace} />
    </ScrollView>
  );
};

export default HomePage;
