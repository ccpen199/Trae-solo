import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockTickets, ticketStatusMap } from '@/data/ticket';
import TicketCard from '@/components/TicketCard';
import EmptyState from '@/components/EmptyState';

const TAB_LIST = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING', label: '待处理' },
  { key: 'PROCESSING', label: '处理中' },
  { key: 'COMPLETED', label: '已完成' },
];

const TicketPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredTickets = useMemo(() => {
    if (activeTab === 'ALL') return mockTickets;
    if (activeTab === 'PROCESSING') {
      return mockTickets.filter(t => t.status === 'PROCESSING' || t.status === 'ASSIGNED');
    }
    return mockTickets.filter(t => t.status === activeTab);
  }, [activeTab]);

  const stats = useMemo(() => ({
    all: mockTickets.length,
    pending: mockTickets.filter(t => t.status === 'PENDING').length,
    processing: mockTickets.filter(t => t.status === 'PROCESSING' || t.status === 'ASSIGNED').length,
    completed: mockTickets.filter(t => t.status === 'COMPLETED' || t.status === 'CLOSED').length,
  }), []);

  const handleCreate = () => {
    Taro.navigateTo({ url: '/pages/ticket-create/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        {TAB_LIST.map((tab) => {
          const count = tab.key === 'ALL' ? stats.all
            : tab.key === 'PROCESSING' ? stats.processing
            : tab.key === 'COMPLETED' ? stats.completed
            : stats.pending;
          return (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, activeTab === tab.key && styles.activeTab)}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className={styles.tabText}>{tab.label}</Text>
              <Text className={styles.tabCount}>{count}条</Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        scrollY
        style={{ height: 'calc(100vh - 180rpx)' }}
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        <View className={styles.statsBar}>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#3B82F6' }}>{stats.all}</Text>
            <Text className={styles.statLabel}>全部工单</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#F59E0B' }}>{stats.pending}</Text>
            <Text className={styles.statLabel}>待处理</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#8B5CF6' }}>{stats.processing}</Text>
            <Text className={styles.statLabel}>处理中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#10B981' }}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>

        {filteredTickets.length > 0 ? (
          <View className={styles.ticketList}>
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </View>
        ) : (
          <EmptyState icon="📋" title="暂无工单" description="点击右下角按钮提交新工单" />
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <View className={styles.fab} onClick={handleCreate}>
        <Text className={styles.fabIcon}>➕</Text>
      </View>
    </View>
  );
};

export default TicketPage;
