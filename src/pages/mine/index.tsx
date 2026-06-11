import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useUserStore } from '@/store/useUserStore';
import { useTaskStore } from '@/store/useTaskStore';
import { taskService } from '@/services/task';
import { cainiaoService } from '@/services/cainiao';
import { exportLogs } from '@/utils/logger';
import type { Evaluation, CheckinRecord } from '@/types/task';

interface MenuItem {
  id: string;
  title: string;
  desc?: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'error' | 'purple';
  path: string;
  badge?: number;
}

const MinePage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([]);
  const [negativeCount, setNegativeCount] = useState(0);
  const [cainiaoAuth, setCainiaoAuth] = useState(false);

  const { user, site, logout, getOperationLogs } = useUserStore();
  const { getEvaluations, getCheckinRecords } = useTaskStore();

  const loadData = useCallback(async () => {
    try {
      const [evals, records] = await Promise.all([
        taskService.getEvaluations(false),
        taskService.getCheckinRecords(user?.id || 'courier_001', 10)
      ]);

      setEvaluations(evals);
      setCheckinRecords(records);
      setNegativeCount(evals.filter(e => e.hasNegative && !e.isHandled).length);
      setCainiaoAuth(!!cainiaoService.getConfig().token);
    } catch (e) {
      console.error('[MinePage] 加载数据失败:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    loadData();
  });

  const avgRating = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length).toFixed(1)
    : '5.0';

  const todayCheckin = checkinRecords.find(r => {
    const today = new Date().toDateString();
    return new Date(r.timestamp).toDateString() === today && r.type === 'check_in';
  });

  const menuItems: MenuItem[] = [
    {
      id: 'checkin',
      title: '考勤打卡',
      desc: todayCheckin ? '今日已打卡' : '今日未打卡',
      icon: '📍',
      color: 'primary',
      path: '/pages/checkin/index'
    },
    {
      id: 'operation_log',
      title: '操作日志',
      desc: '合规留痕可追溯',
      icon: '📋',
      color: 'success',
      path: '/pages/operation-log/index'
    },
    {
      id: 'evaluation',
      title: '服务评价',
      desc: `共${evaluations.length}条评价`,
      icon: '⭐',
      color: 'warning',
      path: '/pages/evaluation/index',
      badge: negativeCount
    },
    {
      id: 'archive',
      title: '运单归档',
      desc: '司法存证接口',
      icon: '📦',
      color: 'purple',
      path: '/pages/archive/index'
    },
    {
      id: 'cainiao',
      title: '菜鸟裹裹同步',
      desc: cainiaoAuth ? '已授权' : '未授权',
      icon: '🔄',
      color: 'primary',
      path: ''
    },
    {
      id: 'export_log',
      title: '导出日志',
      desc: 'JSON/CSV格式',
      icon: '📤',
      color: 'success',
      path: ''
    },
    {
      id: 'clear_cache',
      title: '清理缓存',
      desc: '释放本地存储空间',
      icon: '🗑️',
      color: 'warning',
      path: ''
    },
    {
      id: 'settings',
      title: '系统设置',
      desc: '合规配置管理',
      icon: '⚙️',
      color: 'purple',
      path: ''
    }
  ];

  const handleMenuClick = async (item: MenuItem) => {
    switch (item.id) {
      case 'cainiao':
        if (user) {
          if (!cainiaoAuth) {
            const result = await cainiaoService.auth(user.id, user.name);
            if (result) {
              setCainiaoAuth(true);
            }
          } else {
            await cainiaoService.syncAll(user.id, user.name);
            loadData();
          }
        }
        break;
      case 'export_log':
        if (user) {
          await getOperationLogs();
          await exportLogs({ format: 'json' });
          Taro.showToast({ title: '日志已导出', icon: 'success' });
        }
        break;
      case 'clear_cache':
        Taro.showModal({
          title: '清理缓存',
          content: '确定要清理本地缓存吗？离线数据将保留。',
          success: async (res) => {
            if (res.confirm) {
              Taro.clearStorageSync();
              Taro.showToast({ title: '清理成功', icon: 'success' });
            }
          }
        });
        break;
      case 'settings':
        Taro.showToast({ title: '设置功能开发中', icon: 'none' });
        break;
      default:
        if (item.path) {
          Taro.navigateTo({ url: item.path });
        }
    }
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          Taro.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  };

  const handleShowQR = () => {
    Taro.showModal({
      title: '我的工牌',
      content: `工号: ${user?.employeeId || '001'}\n姓名: ${user?.name || '快递员'}\n网点: ${site?.name || '朝阳路营业点'}`,
      showCancel: false
    });
  };

  const performanceData = [
    { label: '本月揽件', value: user?.stats?.monthlyPickup || 256, unit: '件' },
    { label: '本月派件', value: user?.stats?.monthlyDelivery || 892, unit: '件' },
    { label: '异常处理', value: user?.stats?.exceptionResolved || 12, unit: '件' },
    { label: '准点率', value: user?.stats?.onTimeRate || 98.5, unit: '%' },
    { label: '好评率', value: user?.stats?.positiveRate || 96.8, unit: '%' },
    { label: '服务评分', value: parseFloat(avgRating), unit: '分' }
  ];

  const ratingData = [
    { label: '5星', value: 78, percent: 78 },
    { label: '4星', value: 15, percent: 15 },
    { label: '3星', value: 4, percent: 4 },
    { label: '2星', value: 2, percent: 2 },
    { label: '1星', value: 1, percent: 1 }
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text>👤</Text>
          </View>
          <View className={styles.userText}>
            <Text className={styles.userName}>{user?.name || '张建国'}</Text>
            <View className={styles.userMeta}>
              <Text>工号: {user?.employeeId || '001'}</Text>
              <Text>|</Text>
              <Text>资深快递员</Text>
            </View>
            <Text className={styles.userSite}>
              📍 {site?.name || '朝阳路营业点'}
            </Text>
          </View>
          <View className={styles.qrBtn} onClick={handleShowQR}>
            <Text>📱</Text>
          </View>
        </View>

        <View className={styles.statsCard}>
          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{performanceData[0].value}</Text>
              <Text className={styles.statLabel}>本月揽件</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{performanceData[1].value}</Text>
              <Text className={styles.statLabel}>本月派件</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{avgRating}</Text>
              <Text className={styles.statLabel}>服务评分</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text>常用功能</Text>
        </View>
        <View className={styles.menuList}>
          {menuItems.map(item => (
            <View
              key={item.id}
              className={styles.menuItem}
              onClick={() => handleMenuClick(item)}
            >
              <View className={classnames(styles.menuIcon, styles[item.color])}>
                <Text>{item.icon}</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>{item.title}</Text>
                {item.desc && <Text className={styles.menuDesc}>{item.desc}</Text>}
              </View>
              <View className={styles.menuRight}>
                {item.badge !== undefined && item.badge > 0 && (
                  <View className={styles.menuBadge}>
                    <Text>{item.badge > 99 ? '99+' : item.badge}</Text>
                  </View>
                )}
                <Text className={styles.menuArrow}>›</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.performance}>
        <View className={styles.performanceHeader}>
          <Text className={styles.performanceTitle}>业绩统计</Text>
          <Text className={styles.performancePeriod}>本月</Text>
        </View>
        <View className={styles.performanceGrid}>
          {performanceData.slice(2).map((item, index) => (
            <View key={index} className={styles.performanceItem}>
              <Text className={styles.performanceValue}>
                {item.value}{item.unit}
              </Text>
              <Text className={styles.performanceLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View className={styles.ratingBar}>
          <Text style={{ fontSize: '28rpx', fontWeight: '500', color: '#1d2129', marginBottom: '24rpx' }}>
            评价分布
          </Text>
          {ratingData.map((item, index) => (
            <View key={index} className={styles.ratingRow}>
              <Text className={styles.ratingLabel}>{item.label}</Text>
              <View className={styles.ratingTrack}>
                <View
                  className={styles.ratingFill}
                  style={{ width: `${item.percent}%` }}
                />
              </View>
              <Text className={styles.ratingValue}>{item.percent}%</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.logoutBtn} onClick={handleLogout}>
        <Text>退出登录</Text>
      </View>

      <Text className={styles.version}>
        快递作业协同 v1.0.0 | 合规版本
      </Text>
    </ScrollView>
  );
};

export default MinePage;
