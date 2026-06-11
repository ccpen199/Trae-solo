import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import ExceptionCard from '@/components/ExceptionCard';
import { useTaskStore } from '@/store/useTaskStore';
import { useUserStore } from '@/store/useUserStore';
import { exceptionService } from '@/services/exception';
import type { ExceptionRecord, ExceptionType, ExceptionSeverity, ExceptionStatus } from '@/types/exception';
import { EXCEPTION_TYPE_OPTIONS } from '@/types/exception';

type SeverityFilter = 'all' | ExceptionSeverity;
type StatusFilter = 'all' | ExceptionStatus;
type TypeFilter = 'all' | ExceptionType;

const ExceptionPage: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);

  const { user } = useUserStore();
  const { exceptions: storeExceptions, getExceptions, updateExceptionStatus } = useTaskStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await getExceptions();
      setExceptions(storeExceptions);
    } catch (e) {
      console.error('[ExceptionPage] 加载数据失败:', e);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [getExceptions, storeExceptions]);

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

  const filterExceptions = (list: ExceptionRecord[]): ExceptionRecord[] => {
    let filtered = [...list];

    if (severityFilter !== 'all') {
      filtered = filtered.filter(e => e.severity === severityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.exceptionType === typeFilter);
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(e =>
        e.waybillNo.toLowerCase().includes(keyword) ||
        e.description.toLowerCase().includes(keyword) ||
        e.reporterName.toLowerCase().includes(keyword)
      );
    }

    return filtered.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.reportTime - a.reportTime;
    });
  };

  const handleAction = async (exception: ExceptionRecord, action: string) => {
    if (!user) return;

    try {
      switch (action) {
        case 'contact':
          Taro.makePhoneCall({ phoneNumber: '400-123-4567' });
          break;
        case 'update':
          Taro.showActionSheet({
            itemList: ['标记处理中', '标记已解决', '标记已关闭'],
            success: async (res) => {
              const statusMap: Record<number, ExceptionStatus> = {
                0: 'processing',
                1: 'resolved',
                2: 'closed'
              };
              const newStatus = statusMap[res.tapIndex];
              const statusTextMap: Record<ExceptionStatus, string> = {
                processing: '处理中',
                resolved: '已解决',
                closed: '已关闭',
                reported: '已上报'
              };

              await exceptionService.updateExceptionProgress({
                exceptionId: exception.id,
                waybillNo: exception.waybillNo,
                action: `更新状态为${statusTextMap[newStatus]}`,
                remark: '',
                userId: user.id,
                userName: user.name
              });

              await updateExceptionStatus(exception.id, newStatus);
              Taro.showToast({ title: '更新成功', icon: 'success' });
              loadData();
            }
          });
          break;
      }
    } catch (e) {
      console.error('[ExceptionPage] 操作失败:', e);
      const errorMsg = e instanceof Error ? e.message : '操作失败';
      Taro.showToast({ title: errorMsg, icon: 'none' });
    }
  };

  const handleReportException = () => {
    Taro.navigateTo({ url: '/pages/exception-report/index' });
  };

  const handleBatchProcess = () => {
    Taro.showActionSheet({
      itemList: ['批量标记处理中', '批量标记已解决', '批量导出'],
      success: (res) => {
        Taro.showToast({ title: '功能开发中', icon: 'none' });
      }
    });
  };

  const filteredExceptions = filterExceptions(exceptions);

  const stats = {
    total: exceptions.length,
    reported: exceptions.filter(e => e.status === 'reported').length,
    processing: exceptions.filter(e => e.status === 'processing').length,
    resolved: exceptions.filter(e => e.status === 'resolved' || e.status === 'closed').length
  };

  const severityOptions: { value: SeverityFilter; label: string }[] = [
    { value: 'all', label: '全部等级' },
    { value: 'critical', label: '严重' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' }
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'reported', label: '已上报' },
    { value: 'processing', label: '处理中' },
    { value: 'resolved', label: '已解决' },
    { value: 'closed', label: '已关闭' }
  ];

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: '全部类型' },
    ...EXCEPTION_TYPE_OPTIONS.map(opt => ({ value: opt.type as TypeFilter, label: opt.label }))
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>异常件处理</Text>
        <Text className={styles.headerDesc}>及时处理异常，保障服务质量</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>总计</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.reported}</Text>
            <Text className={styles.statLabel}>待处理</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.processing}</Text>
            <Text className={styles.statLabel}>处理中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.resolved}</Text>
            <Text className={styles.statLabel}>已解决</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索运单号/描述"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.severityTabs}>
        {severityOptions.map(option => (
          <View
            key={option.value}
            className={classnames(styles.severityTab, severityFilter === option.value && styles.active)}
            onClick={() => setSeverityFilter(option.value)}
          >
            <Text>{option.label}</Text>
          </View>
        ))}
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

      <View className={styles.typeFilter}>
        {typeOptions.slice(0, 6).map(option => (
          <View
            key={option.value}
            className={classnames(styles.typeTab, typeFilter === option.value && styles.active)}
            onClick={() => setTypeFilter(option.value)}
          >
            <Text>{option.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        scrollY
        className={styles.exceptionList}
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        {loading ? (
          <View className={styles.loading}>
            <Text>加载中...</Text>
          </View>
        ) : filteredExceptions.length > 0 ? (
          filteredExceptions.map(exception => (
            <ExceptionCard
              key={exception.id}
              exception={exception}
              onAction={handleAction}
            />
          ))
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>✅</Text>
            <Text className={styles.emptyText}>
              {searchKeyword ? '未找到匹配的异常记录' : '暂无异常记录'}
            </Text>
            <View className={styles.refreshBtn} onClick={loadData}>
              <Text>刷新</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View className={styles.bottomActionBar}>
        <View className={classnames(styles.actionBtn, styles.secondary)} onClick={handleBatchProcess}>
          <Text>📋 批量处理</Text>
        </View>
        <View className={classnames(styles.actionBtn, styles.primary)} onClick={handleReportException}>
          <Text>📷 上报异常</Text>
        </View>
      </View>
    </View>
  );
};

export default ExceptionPage;
