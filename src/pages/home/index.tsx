import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { useUserStore } from '@/store/useUserStore';
import { mockAnnouncements, mockTickets } from '@/data/mockTickets';
import { mockServiceItems, mockGroupBuys } from '@/data/mockServices';
import { mockNotifications } from '@/data/mockKpi';
import { roleNames } from '@/utils/auth';

const quickActions = [
  { key: 'access', icon: '🔑', label: '开门', bg: 'rgba(46, 124, 246, 0.1)', page: '/pages/access/index' },
  { key: 'repair', icon: '🛠️', label: '报修', bg: 'rgba(239, 68, 68, 0.1)', page: '/pages/ticket-create/index?t=repair' },
  { key: 'visitor', icon: '👥', label: '访客', bg: 'rgba(16, 185, 129, 0.1)', page: '/pages/visitor/index' },
  { key: 'fee', icon: '💳', label: '缴费', bg: 'rgba(139, 92, 246, 0.1)', page: '' },
  { key: 'complaint', icon: '📢', label: '投诉', bg: 'rgba(245, 158, 11, 0.1)', page: '/pages/ticket-create/index?t=complaint' },
  { key: 'suggest', icon: '💡', label: '建议', bg: 'rgba(139, 92, 246, 0.1)', page: '/pages/ticket-create/index?t=suggestion' },
  { key: 'locker', icon: '📦', label: '快递柜', bg: 'rgba(16, 185, 129, 0.1)', page: '/pages/services/index?c=delivery' },
  { key: 'kpi', icon: '📊', label: '物业报表', bg: 'rgba(46, 124, 246, 0.1)', page: '/pages/kpi/index' },
];

const HomePage: React.FC = () => {
  const { user } = useUserStore();
  const currentProperty = user?.properties.find((p) => p.id === user.currentPropertyId);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const stats = useMemo(() => {
    const mine = mockTickets.filter((t) => t.submitterId === 'U001');
    return {
      pending: mine.filter((t) => t.status === 'pending' || t.status === 'assigned').length,
      processing: mine.filter((t) => t.status === 'processing').length,
      completed: mine.filter((t) => t.status === 'completed').length,
      total: mine.length,
    };
  }, []);

  const handleQuick = (page: string) => {
    if (!page) {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    Taro.navigateTo({ url: page });
  };

  const gotoNotifications = () => {
    Taro.navigateTo({ url: '/pages/notifications/index' });
  };

  const gotoRoleSwitch = () => {
    Taro.navigateTo({ url: '/pages/role-switch/index' });
  };

  const gotoTickets = (filter?: string) => {
    Taro.switchTab({ url: '/pages/tickets/index' });
  };

  const gotoService = (id: string) => {
    Taro.navigateTo({ url: `/pages/service-detail/index?id=${id}` });
  };

  const hotServices = [...mockServiceItems.slice(0, 3), ...mockGroupBuys.slice(0, 2).map((g) => ({
    id: g.id, title: g.title, cover: g.cover, price: g.price, originalPrice: g.originalPrice, tags: ['团购'], rating: 4.8, sales: g.currentCount,
  }))];

  return (
    <PageContainer>
      <View className={styles.header}>
        <View className={styles.topRow}>
          <View className={styles.greeting} onClick={gotoRoleSwitch}>
            <Image className={styles.avatar} src={user?.avatar || 'https://picsum.photos/id/64/200/200'} mode="aspectFill" />
            <View className={styles.textBlock}>
              <Text className={styles.hi}>你好，{user?.name || '业主'}</Text>
              <Text className={styles.address}>📍 {currentProperty?.address || '请绑定房产'}</Text>
            </View>
          </View>
          <View className={styles.bell} onClick={gotoNotifications}>
            <Text>🔔</Text>
            {unreadCount > 0 && <View className={styles.dot} />}
          </View>
        </View>
        <View className={styles.weatherRow}>
          <View className={styles.weather}>
            <Text className={styles.icon}>☀️</Text>
            <Text className={styles.temp}>28°</Text>
            <Text className={styles.desc}>晴 · 深圳 · 空气优</Text>
          </View>
          <View className={styles.role} onClick={gotoRoleSwitch}>
            <View className={styles.badge} />
            <Text>{roleNames[user?.role || 'resident']}模式</Text>
          </View>
        </View>
      </View>

      <View className={styles.quickGrid}>
        {quickActions.map((a) => (
          <View key={a.key} className={styles.item} onClick={() => handleQuick(a.page)}>
            <View className={styles.iconBox} style={{ background: a.bg }}>
              <Text>{a.icon}</Text>
            </View>
            <Text className={styles.label}>{a.label}</Text>
          </View>
        ))}
      </View>

      <SectionCard title="公告通知" titleIcon="📣" moreText="全部" onMore={() => Taro.navigateTo({ url: '/pages/notifications/index' })}>
        {mockAnnouncements.slice(0, 3).map((a) => (
          <View key={a.id} className={styles.announceItem}>
            <View className={`${styles.levelTag} ${styles[a.level]}`}>
              {a.level === 'urgent' ? '紧急' : a.level === 'important' ? '重要' : '通知'}
            </View>
            <View className={styles.contentBlock}>
              <Text className={styles.title}>{a.title}</Text>
              <View className={styles.meta}>
                <Text>{a.publisher}</Text>
                <Text>{a.publishTime}</Text>
              </View>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="我的工单" titleIcon="📋" moreText="查看全部" onMore={() => gotoTickets()}>
        <View className={styles.ticketOverview}>
          <View className={styles.tile} onClick={() => gotoTickets('pending')}>
            <Text className={styles.num}>{stats.pending}</Text>
            <Text className={styles.label}>待处理</Text>
          </View>
          <View className={styles.tile} onClick={() => gotoTickets('processing')}>
            <Text className={`${styles.num} ${styles.orange}`}>{stats.processing}</Text>
            <Text className={styles.label}>处理中</Text>
          </View>
          <View className={styles.tile} onClick={() => gotoTickets('completed')}>
            <Text className={`${styles.num} ${styles.green}`}>{stats.completed}</Text>
            <Text className={styles.label}>已完成</Text>
          </View>
          <View className={styles.tile} onClick={() => gotoTickets()}>
            <Text className={`${styles.num} ${styles.purple}`}>{stats.total}</Text>
            <Text className={styles.label}>总工单</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="热门服务" titleIcon="🛍️" moreText="更多" onMore={() => Taro.switchTab({ url: '/pages/services/index' })} noHeader>
        <View className={styles.serviceRow}>
          {hotServices.map((s) => (
            <View key={s.id} className={styles.serviceCard} onClick={() => gotoService(s.id)}>
              <Image className={styles.cover} src={s.cover} mode="aspectFill" />
              <View className={styles.info}>
                <Text className={styles.title}>{s.title}</Text>
                <View className={styles.bottomRow}>
                  <View className={styles.price}>
                    <Text className={styles.symbol}>¥</Text>
                    <Text className={styles.amount}>{s.price}</Text>
                    {s.originalPrice && <Text className={styles.origin}>¥{s.originalPrice}</Text>}
                  </View>
                  <View className={styles.tags}>
                    {s.tags?.slice(0, 1).map((t) => (
                      <Text key={t} className={styles.tag}>{t}</Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </SectionCard>
    </PageContainer>
  );
};

export default HomePage;
