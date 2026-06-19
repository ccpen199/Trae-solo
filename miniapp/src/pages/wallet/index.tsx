import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import CouponCard from '@/components/CouponCard';
import { useAppStore } from '@/store/useAppStore';
import type { TabType } from '@/types';
import classNames from 'classnames';

const WalletPage: React.FC = () => {
  const { coupons, user, activeTab, setActiveTab, getFilteredCoupons } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[WalletPage] Page show');
  });

  usePullDownRefresh(() => {
    handleRefresh();
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
    Taro.stopPullDownRefresh();
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'available', label: '可使用', count: coupons.filter(c => c.status === 'available').length },
    { key: 'used', label: '已使用', count: coupons.filter(c => c.status === 'used').length },
    { key: 'expired', label: '已过期', count: coupons.filter(c => c.status === 'expired').length }
  ];

  const filteredCoupons = getFilteredCoupons();

  const handleUseCoupon = () => {
    Taro.switchTab({ url: '/pages/scan/index' });
  };

  const handleGoExplore = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  return (
    <View className={styles.walletPage}>
      <View className={styles.header}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{coupons.length}</Text>
            <Text className={styles.statLabel}>累计领取</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{coupons.filter(c => c.status === 'used').length}</Text>
            <Text className={styles.statLabel}>已使用</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{coupons.filter(c => c.status === 'available').length}</Text>
            <Text className={styles.statLabel}>待使用</Text>
          </View>
        </View>
        <View className={styles.savedAmount}>
          <Text>💰 累计已省</Text>
          <Text className={styles.savedValue}>¥{user?.totalSaved?.toFixed(2) || '0.00'}</Text>
        </View>
      </View>

      <View className={styles.tabContainer}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classNames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label} ({tab.count})</Text>
          </View>
        ))}
      </View>

      <View className={styles.couponList}>
        {filteredCoupons.length > 0 ? (
          <>
            <Text className={styles.couponCount}>共 {filteredCoupons.length} 张优惠券</Text>
            {filteredCoupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                showUseBtn={activeTab === 'available'}
                onUse={handleUseCoupon}
              />
            ))}
          </>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎫</Text>
            <Text className={styles.emptyText}>
              {activeTab === 'available' && '暂无可用优惠券'}
              {activeTab === 'used' && '暂无已使用优惠券'}
              {activeTab === 'expired' && '暂无已过期优惠券'}
            </Text>
            {activeTab === 'available' && (
              <Button className={styles.emptyBtn} onClick={handleGoExplore}>
                去领券
              </Button>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default WalletPage;
