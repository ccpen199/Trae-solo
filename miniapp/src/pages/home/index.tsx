import React, { useState, useEffect } from 'react';
import { View, Text, Input, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import BannerSwiper from '@/components/BannerSwiper';
import CouponCard from '@/components/CouponCard';
import MerchantCard from '@/components/MerchantCard';
import { useAppStore } from '@/store/useAppStore';
import { mockCategories, mockDistricts } from '@/data/mockData';
import type { CategoryType } from '@/types';
import classNames from 'classnames';

const HomePage: React.FC = () => {
  const { banners, recommendedCoupons, merchants, user, setSelectedCategory, setSelectedDistrict } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentDistrict] = useState('沈阳市');

  useDidShow(() => {
    console.log('[HomePage] Page show');
  });

  usePullDownRefresh(() => {
    handleRefresh();
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('[HomePage] Loading data...');
  };

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    Taro.stopPullDownRefresh();
    Taro.showToast({ title: '刷新成功', icon: 'success' });
  };

  const handleCategoryClick = (categoryId: CategoryType) => {
    setSelectedCategory(categoryId);
    Taro.switchTab({ url: '/pages/mall/index' });
  };

  const handleBannerClick = (activityId: string) => {
    Taro.navigateTo({
      url: `/pages/coupon-detail/index?activityId=${activityId}`
    });
  };

  const handleClaimCoupon = (activityId: string) => {
    const success = useAppStore.getState().claimCoupon(activityId);
    if (success) {
      Taro.showToast({ title: '领取成功', icon: 'success' });
    } else {
      Taro.showToast({ title: '领取上限', icon: 'none' });
    }
  };

  const handleSearch = () => {
    if (!searchText.trim()) return;
    Taro.showToast({ title: `搜索: ${searchText}`, icon: 'none' });
  };

  const handleViewAllRecommend = () => {
    Taro.switchTab({ url: '/pages/wallet/index' });
  };

  const handleViewAllMerchants = () => {
    Taro.switchTab({ url: '/pages/mall/index' });
  };

  const nearbyMerchants = [...merchants].sort((a, b) => (a.distance || 999) - (b.distance || 999)).slice(0, 5);

  return (
    <View className={styles.homePage}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View className={styles.location}>
            <Text>📍</Text>
            <Text>{currentDistrict}</Text>
          </View>
          <View className={styles.location}>
            <Text>🔔</Text>
          </View>
        </View>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索优惠券或商户'
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
            onConfirm={handleSearch}
            confirmType='search'
          />
        </View>
      </View>

      <View className={styles.section}>
        <BannerSwiper banners={banners} />
      </View>

      <View className={styles.section}>
        <View className={styles.categoryGrid}>
          {mockCategories.map((category) => (
            <View
              key={category.id}
              className={styles.categoryItem}
              onClick={() => handleCategoryClick(category.id)}
            >
              <View
                className={styles.categoryIcon}
                style={{ background: `${category.color}15` }}
              >
                <Text>{category.icon}</Text>
              </View>
              <Text className={styles.categoryName}>{category.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>为你推荐</Text>
          <View className={styles.sectionMore} onClick={handleViewAllRecommend}>
            <Text>查看全部</Text>
            <Text> →</Text>
          </View>
        </View>
        <ScrollView className={styles.couponScroll} scrollX enhanced showScrollbar={false}>
          {recommendedCoupons.map((rc) => (
            <View key={rc.activityId} className={styles.recommendCard}>
              <View className={styles.recommendCardHeader}>
                <Text className={styles.recommendBadge}>
                  {rc.matchType === 'category' && '🎯 品类匹配'}
                  {rc.matchType === 'district' && '📍 区域专属'}
                  {rc.matchType === 'tier' && '💎 等级特权'}
                  {rc.matchType === 'trending' && '🔥 热门'}
                </Text>
                <Text className={styles.recommendReason}>{rc.reason}</Text>
              </View>
              <CouponCard
                coupon={{
                  id: `rec-${rc.activityId}`,
                  activityId: rc.activityId,
                  userId: user?.userId || '',
                  code: '',
                  status: 'available',
                  issuedAt: new Date().toISOString(),
                  expiresAt: rc.activity.endTime,
                  activity: rc.activity
                }}
                showUseBtn={true}
                onUse={() => handleClaimCoupon(rc.activityId)}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>附近商户</Text>
          <View className={styles.sectionMore} onClick={handleViewAllMerchants}>
            <Text>查看全部</Text>
            <Text> →</Text>
          </View>
        </View>
        <View className={styles.merchantList}>
          {nearbyMerchants.map((merchant) => (
            <MerchantCard key={merchant.id} merchant={merchant} />
          ))}
        </View>
      </View>

      {loading && (
        <View className={styles.emptyState}>
          <Text>🔄</Text>
          <Text>加载中...</Text>
        </View>
      )}
    </View>
  );
};

export default HomePage;
