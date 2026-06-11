import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import WaybillCard from '@/components/WaybillCard';
import { useTaskStore } from '@/store/useTaskStore';
import { useUserStore } from '@/store/useUserStore';
import { waybillService } from '@/services/waybill';
import { useScan } from '@/hooks/useScan';
import type { PickupTask, DeliveryTask } from '@/types/waybill';

type TabType = 'pickup' | 'delivery';
type StatusFilter = 'all' | 'pending' | 'accepted' | 'delivering' | 'completed' | 'exception';

const DispatchPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pickup');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pickupTasks, setPickupTasks] = useState<PickupTask[]>([]);
  const [deliveryTasks, setDeliveryTasks] = useState<DeliveryTask[]>([]);

  const { user } = useUserStore();
  const { pickupTasks: storePickupTasks, deliveryTasks: storeDeliveryTasks, updatePickupTaskStatus, updateDeliveryTaskStatus, getPickupTasks, getDeliveryTasks } = useTaskStore();
  const { scanCode } = useScan();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([getPickupTasks(), getDeliveryTasks()]);
      setPickupTasks(storePickupTasks);
      setDeliveryTasks(storeDeliveryTasks);
    } catch (e) {
      console.error('[DispatchPage] 加载数据失败:', e);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [getPickupTasks, getDeliveryTasks, storePickupTasks, storeDeliveryTasks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    loadData();
  });

  const handleRefresh = () => {
    loadData();
  };

  useEffect(() => {
    Taro.eventCenter.on('onPullDownRefresh', handleRefresh);
    return () => {
      Taro.eventCenter.off('onPullDownRefresh', handleRefresh);
    };
  }, [handleRefresh]);

  const filterTasks = <T extends { status: string; waybillNo: string; goodsDescription?: string; sender?: { name?: string; phone?: string; address?: string }; receiver?: { name?: string; phone?: string; address?: string } }>(tasks: T[]): T[] => {
    let filtered = [...tasks];

    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        filtered = filtered.filter(t => t.status === 'picked_up' || t.status === 'delivered' || t.status === 'station');
      } else {
        filtered = filtered.filter(t => t.status === statusFilter);
      }
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(t => {
        const contact = activeTab === 'pickup' ? (t as PickupTask).sender : (t as DeliveryTask).receiver;
        return (
          t.waybillNo.toLowerCase().includes(keyword) ||
          (t.goodsDescription || '').toLowerCase().includes(keyword) ||
          (contact?.name || '').toLowerCase().includes(keyword) ||
          (contact?.phone || '').includes(keyword) ||
          (contact?.address || '').toLowerCase().includes(keyword)
        );
      });
    }

    return filtered;
  };

  const handleAction = async (task: PickupTask | DeliveryTask, action: string) => {
    if (!user) return;

    try {
      switch (action) {
        case 'accept':
          await waybillService.acceptPickupTask(task.id, user.id, user.name);
          await updatePickupTaskStatus(task.id, 'accepted');
          Taro.showToast({ title: '接单成功', icon: 'success' });
          break;
        case 'pickup':
          const pickupResult = await scanCode('pickup');
          if (pickupResult) {
            await waybillService.scanPickup(pickupResult, user.id, user.name, pickupResult.location);
            await updatePickupTaskStatus(task.id, 'picked_up');
          }
          break;
        case 'start':
          await waybillService.startDelivery(task.id, user.id, user.name);
          await updateDeliveryTaskStatus(task.id, 'delivering');
          Taro.showToast({ title: '已开始派送', icon: 'success' });
          break;
        case 'station':
          const stationResult = await scanCode('station');
          if (stationResult) {
            await waybillService.scanStation(task.waybillNo, user.id, user.name, stationResult.result, '驿站');
            await updateDeliveryTaskStatus(task.id, 'station');
          }
          break;
        case 'sign':
          const signResult = await scanCode('delivery');
          if (signResult) {
            await waybillService.scanDelivery(signResult.result, user.id, user.name, signResult.location);
            await updateDeliveryTaskStatus(task.id, 'delivered');
          }
          break;
      }
      loadData();
    } catch (e) {
      console.error('[DispatchPage] 操作失败:', e);
      const errorMsg = e instanceof Error ? e.message : '操作失败';
      Taro.showToast({ title: errorMsg, icon: 'none' });
    }
  };

  const handleScanAll = async () => {
    const type = activeTab === 'pickup' ? 'pickup' : 'delivery';
    const result = await scanCode(type);
    if (result && user) {
      if (type === 'pickup') {
        await waybillService.scanPickup(result.result, user.id, user.name, result.location);
      } else {
        await waybillService.scanDelivery(result.result, user.id, user.name, result.location);
      }
      loadData();
    }
  };

  const handleSyncOffline = async () => {
    if (!user) return;
    const result = await waybillService.syncOfflineData(user.id, user.name);
    Taro.showToast({
      title: `同步完成：成功${result.success}条，失败${result.failed}条`,
      icon: 'none'
    });
    loadData();
  };

  const currentTasks = activeTab === 'pickup' ? filterTasks(pickupTasks) : filterTasks(deliveryTasks);
  const pendingCount = activeTab === 'pickup'
    ? pickupTasks.filter(t => t.status === 'pending').length
    : deliveryTasks.filter(t => t.status === 'pending').length;
  const completedCount = activeTab === 'pickup'
    ? pickupTasks.filter(t => t.status === 'picked_up').length
    : deliveryTasks.filter(t => t.status === 'delivered' || t.status === 'station').length;
  const totalCount = activeTab === 'pickup' ? pickupTasks.length : deliveryTasks.length;

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待处理' },
    activeTab === 'pickup' ? { value: 'accepted', label: '已接单' } : { value: 'delivering', label: '派送中' },
    { value: 'completed', label: '已完成' },
    { value: 'exception', label: '异常' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, activeTab === 'pickup' && styles.active)}
          onClick={() => setActiveTab('pickup')}
        >
          <Text>揽件任务</Text>
          {pendingCount > 0 && activeTab !== 'pickup' && (
            <View className={styles.tabBadge}>{pendingCount > 99 ? '99+' : pendingCount}</View>
          )}
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'delivery' && styles.active)}
          onClick={() => setActiveTab('delivery')}
        >
          <Text>派件任务</Text>
        </View>
      </View>

      <View className={styles.statBar}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{totalCount}</Text>
          <Text className={styles.statLabel}>总计</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statValue, styles.warning)}>{pendingCount}</Text>
          <Text className={styles.statLabel}>待处理</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statValue, styles.success)}>{completedCount}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
      </View>

      <View className={styles.filterBar}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索运单号/收件人/地址"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>
        <View
          className={classnames(styles.filterBtn)}
          onClick={handleSyncOffline}
        >
          <Text>📡 同步</Text>
        </View>
      </View>

      <View className={styles.statusTabs}>
        {statusOptions.map(option => (
          <View
            key={option.value}
            className={classnames(styles.statusTab, statusFilter === option.value && styles.active)}
            onClick={() => setStatusFilter(option.value)}
          >
            <Text>{option.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        scrollY
        className={styles.taskList}
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        {loading ? (
          <View className={styles.loading}>
            <Text>加载中...</Text>
          </View>
        ) : currentTasks.length > 0 ? (
          currentTasks.map(task => (
            <WaybillCard
              key={task.id}
              task={task}
              type={activeTab}
              onAction={handleAction}
            />
          ))
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📦</Text>
            <Text className={styles.emptyText}>
              {searchKeyword ? '未找到匹配的任务' : statusFilter === 'all' ? '暂无任务' : '该状态下暂无任务'}
            </Text>
            <View className={styles.refreshBtn} onClick={loadData}>
              <Text>刷新</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View className={styles.bottomActionBar}>
        <View className={classnames(styles.actionBtn, styles.secondary)} onClick={handleSyncOffline}>
          <Text>📡 同步离线</Text>
        </View>
        <View className={classnames(styles.actionBtn, styles.primary)} onClick={handleScanAll}>
          <Text>📷 批量扫码</Text>
        </View>
      </View>
    </View>
  );
};

export default DispatchPage;
