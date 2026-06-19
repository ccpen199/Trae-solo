import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/store/user';
import { mockCommunity, mockQuickFeatures, mockNotices, mockStats } from '@/data/home';
import { mockServices } from '@/data/service';
import { mockTickets } from '@/data/ticket';
import StatCard from '@/components/StatCard';
import FeatureGrid from '@/components/FeatureGrid';
import SectionHeader from '@/components/SectionHeader';
import ServiceCard from '@/components/ServiceCard';
import TicketCard from '@/components/TicketCard';

const HomePage: React.FC = () => {
  const { user, houses } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[HomePage] show');
  });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const goAccess = () => {
    Taro.navigateTo({ url: '/pages/access-detail/index' });
  };

  const goAccessLog = () => {
    Taro.navigateTo({ url: '/pages/access-log/index' });
  };

  const goTicketList = () => {
    Taro.switchTab({ url: '/pages/ticket/index' });
  };

  const goServiceList = () => {
    Taro.switchTab({ url: '/pages/service/index' });
  };

  const currentHouse = houses[0];

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.header}>
        <View className={styles.topBar}>
          <View className={styles.location}>
            <Text className={styles.locationIcon}>📍</Text>
            <View>
              <Text className={styles.locationText}>{mockCommunity.name}</Text>
              <View className={styles.locationAddr}>
                {currentHouse ? `${currentHouse.buildingName}${currentHouse.unitName}${currentHouse.roomNumber}` : '未绑定房产'}
              </View>
            </View>
          </View>
          <View className={styles.bellIcon}>
            🔔
            {mockStats.unreadNotice > 0 && <Text className={styles.badge}>{mockStats.unreadNotice}</Text>}
          </View>
        </View>

        <View className={styles.accessCard} onClick={goAccess}>
          <View className={styles.accessIcon}>🚪</View>
          <View className={styles.accessInfo}>
            <Text className={styles.accessTitle}>一键开门</Text>
            <Text className={styles.accessDesc}>点击扫码开门 · 支持蓝牙/NFC/二维码</Text>
          </View>
          <Text className={styles.accessArrow}>›</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsRow}>
          <StatCard
            label="待处理工单"
            value={mockStats.pendingTickets}
            icon="📋"
            color="#F59E0B"
            onClick={goTicketList}
          />
          <StatCard
            label="今日通行"
            value={mockStats.todayAccess}
            icon="✅"
            color="#10B981"
            onClick={goAccessLog}
          />
          <StatCard
            label="我的订单"
            value={mockStats.serviceOrders}
            icon="📦"
            color="#3B82F6"
            onClick={goServiceList}
          />
        </View>

        <FeatureGrid features={mockQuickFeatures} />

        <View className={styles.section}>
          <SectionHeader title="最新公告" actionText="查看全部" />
          <View className={styles.noticeCard}>
            {mockNotices.map((notice) => (
              <View key={notice.id} className={styles.noticeItem}>
                <Text className={`${styles.noticeTag} ${notice.type}`}>
                  {notice.type === 'NOTICE' ? '通知' : notice.type === 'ACTIVITY' ? '活动' : '警示'}
                </Text>
                <View className={styles.noticeContent}>
                  <Text className={styles.noticeTitle}>{notice.title}</Text>
                  <Text className={styles.noticeTime}>{notice.createdAt}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <SectionHeader title="我的工单" actionText="全部工单" onAction={goTicketList} />
          {mockTickets.slice(0, 2).map((ticket) => (
            <View key={ticket.id} style={{ marginBottom: 24 }}>
              <TicketCard ticket={ticket} />
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <SectionHeader title="热门服务" actionText="更多服务" onAction={goServiceList} />
          <View className={styles.servicePreview}>
            {mockServices.slice(0, 3).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
