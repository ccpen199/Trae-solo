import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/store/user';

const menuGroups = [
  {
    title: '我的服务',
    items: [
      { icon: '🏠', name: '房产管理', page: '/pages/house-manage/index', color: '#10B981' },
      { icon: '🚪', name: '我的门禁', page: '/pages/access-detail/index', color: '#3B82F6' },
      { icon: '📋', name: '通行记录', page: '/pages/access-log/index', color: '#8B5CF6' },
      { icon: '📦', name: '我的订单', page: '/pages/service/index', color: '#F59E0B' },
    ],
  },
  {
    title: '其他',
    items: [
      { icon: '🔔', name: '消息通知', page: '', color: '#EC4899' },
      { icon: '⚙️', name: '系统设置', page: '', color: '#64748B' },
      { icon: '📞', name: '联系客服', page: '', color: '#06B6D4' },
      { icon: 'ℹ️', name: '关于我们', page: '', color: '#8B5CF6' },
    ],
  },
];

const MinePage: React.FC = () => {
  const { user, houses } = useUserStore();
  const currentHouse = houses[0];

  const handleNavigate = (page: string) => {
    if (!page) {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    Taro.navigateTo({ url: page });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            {user?.avatar ? (
              <Image className={styles.avatarImg} src={user.avatar} mode="aspectFill" />
            ) : (
              <Text style={{ fontSize: 64 }}>👤</Text>
            )}
          </View>
          <View className={styles.userMeta}>
            <Text className={styles.nickname}>{user?.nickname || '未登录'}</Text>
            <Text className={styles.phone}>{user?.phone || '点击登录'}</Text>
            <Text className={styles.roleTag}>小区居民</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.houseCard} onClick={() => handleNavigate('/pages/house-manage/index')}>
          <View className={styles.houseIcon}>🏠</View>
          <View className={styles.houseInfo}>
            <Text className={styles.houseTitle}>
              {currentHouse
                ? `${currentHouse.communityName} · ${currentHouse.buildingName}${currentHouse.unitName}${currentHouse.roomNumber}`
                : '点击绑定房产'}
            </Text>
            <Text className={styles.houseSubtitle}>
              {currentHouse ? (currentHouse.relationship === 'OWNER' ? '业主' : '家属') : '享受更多社区服务'}
            </Text>
          </View>
          <Text className={styles.houseArrow}>›</Text>
        </View>

        <View className={styles.quickStats}>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatValue}>4</Text>
            <Text className={styles.quickStatLabel}>工单</Text>
          </View>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatValue}>6</Text>
            <Text className={styles.quickStatLabel}>通行</Text>
          </View>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatValue}>1</Text>
            <Text className={styles.quickStatLabel}>订单</Text>
          </View>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatValue}>2</Text>
            <Text className={styles.quickStatLabel}>收藏</Text>
          </View>
        </View>

        {menuGroups.map((group, gi) => (
          <View key={gi}>
            <Text className={styles.menuGroupTitle}>{group.title}</Text>
            <View className={styles.menuGroup}>
              {group.items.map((item, ii) => (
                <View
                  key={ii}
                  className={styles.menuItem}
                  onClick={() => handleNavigate(item.page)}
                >
                  <View className={styles.menuIcon} style={{ backgroundColor: `${item.color}15` }}>
                    <Text>{item.icon}</Text>
                  </View>
                  <Text className={styles.menuTitle}>{item.name}</Text>
                  <Text className={styles.menuArrow}>›</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default MinePage;
