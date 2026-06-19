import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import classNames from 'classnames';

const MinePage: React.FC = () => {
  const { user, coupons, setSelectedCategory, setSelectedDistrict } = useAppStore();

  useDidShow(() => {
    console.log('[MinePage] Page show');
  });

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url });
  };

  const handleCategoryShortcut = (category: string) => {
    setSelectedCategory(category);
    setSelectedDistrict('all');
    Taro.switchTab({ url: '/pages/mall/index' });
  };

  const quickActions = [
    { icon: '🍜', label: '餐饮美食', category: 'food', bg: 'rgba(249, 115, 22, 0.1)', color: '$color-accent' },
    { icon: '🛒', label: '商超零售', category: 'retail', bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
    { icon: '🏪', label: '便民服务', category: 'service', bg: 'rgba(30, 64, 175, 0.1)', color: '$color-primary' },
    { icon: '🎮', label: '文体娱乐', category: 'entertainment', bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }
  ];

  const menuItems = [
    {
      section: '我的服务',
      icon: '📋',
      iconBg: 'rgba(30, 64, 175, 0.1)',
      label: '消费记录',
      subtext: '查看近期核销明细',
      badge: null,
      action: () => handleNavigate('/pages/history/index')
    },
    {
      section: '我的服务',
      icon: '👤',
      iconBg: 'rgba(34, 197, 94, 0.1)',
      label: '实名认证',
      subtext: user?.realNameVerified ? '已认证' : '未认证',
      badge: null,
      action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      section: '我的服务',
      icon: '📍',
      iconBg: 'rgba(249, 115, 22, 0.1)',
      label: '我的地址',
      subtext: '管理收货地址',
      badge: null,
      action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      section: '我的服务',
      icon: '❤️',
      iconBg: 'rgba(239, 68, 68, 0.1)',
      label: '我的收藏',
      subtext: '收藏的商户和活动',
      badge: user?.favoriteCount || 0,
      action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      section: '系统设置',
      icon: '🔔',
      iconBg: 'rgba(245, 158, 11, 0.1)',
      label: '消息通知',
      subtext: '活动提醒和到账通知',
      badge: user?.unreadMessageCount || 0,
      action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      section: '系统设置',
      icon: '🛡️',
      iconBg: 'rgba(30, 64, 175, 0.1)',
      label: '账户安全',
      subtext: '密码、支付设置',
      badge: null,
      action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      section: '系统设置',
      icon: '📞',
      iconBg: 'rgba(34, 197, 94, 0.1)',
      label: '联系客服',
      subtext: '7x24小时在线服务',
      badge: null,
      action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      section: '系统设置',
      icon: 'ℹ️',
      iconBg: 'rgba(107, 114, 128, 0.1)',
      label: '关于我们',
      subtext: '版本 v1.0.0',
      badge: null,
      action: () => Taro.showToast({ title: '沈阳市全域惠民服务平台 v1.0.0', icon: 'none' })
    }
  ];

  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <View className={styles.minePage}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text>👤</Text>
          </View>
          <View className={styles.userMeta}>
            <Text className={styles.userName}>{user?.nickname || '沈阳市民'}</Text>
            <View className={styles.userTags}>
              <View className={styles.tag}>
                <Text>⭐</Text>
                <Text>{user?.tier || '大众会员'}</Text>
              </View>
              {user?.realNameVerified && (
                <View className={styles.tag}>
                  <Text>✅</Text>
                  <Text>已实名</Text>
                </View>
              )}
              {user?.isNewUser && (
                <View className={styles.tag}>
                  <Text>🎉</Text>
                  <Text>新用户</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{coupons.filter(c => c.status === 'available').length}</Text>
            <Text className={styles.statLabel}>可用券</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{coupons.filter(c => c.status === 'used').length}</Text>
            <Text className={styles.statLabel}>已核销</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>¥{user?.totalSaved?.toFixed(0) || '0'}</Text>
            <Text className={styles.statLabel}>累计已省</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{user?.points || 0}</Text>
            <Text className={styles.statLabel}>积分</Text>
          </View>
        </View>
      </View>

      <View className={styles.section} style={{ marginTop: '-$spacing-xl' }}>
        <View className={styles.sectionTitle}>
          <Text>⚡</Text>
          <Text>快捷入口</Text>
        </View>
        <View className={styles.quickActions}>
          {quickActions.map((action) => (
            <View
              key={action.category}
              className={styles.quickAction}
              onClick={() => handleCategoryShortcut(action.category)}
            >
              <View className={styles.actionIcon} style={{ background: action.bg }}>
                <Text>{action.icon}</Text>
              </View>
              <Text className={styles.actionText}>{action.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {Object.entries(groupedMenu).map(([section, items]) => (
        <View key={section} className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text>{section === '我的服务' ? '📱' : '⚙️'}</Text>
            <Text>{section}</Text>
          </View>
          {items.map((item, idx) => (
            <View
              key={idx}
              className={styles.menuItem}
              onClick={item.action}
            >
              <View className={styles.menuIcon} style={{ background: item.iconBg }}>
                <Text>{item.icon}</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuText}>{item.label}</Text>
                {item.subtext && <Text className={styles.menuSubtext}>{item.subtext}</Text>}
              </View>
              {item.badge && item.badge > 0 && (
                <Text className={styles.menuBadge}>{item.badge}</Text>
              )}
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      ))}

      <View className={styles.versionInfo}>
        <Text>沈阳市全域惠民服务平台 v1.0.0</Text>
        <Text style={{ display: 'block', marginTop: '8rpx' }}>© 2024 沈阳市商务局 版权所有</Text>
      </View>
    </View>
  );
};

export default MinePage;
