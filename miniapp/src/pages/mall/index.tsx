import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import MerchantCard from '@/components/MerchantCard';
import { useAppStore } from '@/store/useAppStore';
import { mockCategories, mockDistricts } from '@/data/mockData';
import type { CategoryType, MapViewType } from '@/types';
import classNames from 'classnames';

const MallPage: React.FC = () => {
  const { merchants, mapViewType, selectedCategory, selectedDistrict, setMapViewType, setSelectedCategory, setSelectedDistrict, getFilteredMerchants } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'coupons'>('distance');

  useDidShow(() => {
    console.log('[MallPage] Page show');
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

  const filteredMerchants = getFilteredMerchants();

  const sortedMerchants = [...filteredMerchants].sort((a, b) => {
    if (sortBy === 'distance') return (a.distance || 999) - (b.distance || 999);
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.couponCount - a.couponCount;
  });

  const handleToggleView = () => {
    setMapViewType(mapViewType === 'list' ? 'map' : 'list');
  };

  const handleSortChange = () => {
    const sorts: Array<'distance' | 'rating' | 'coupons'> = ['distance', 'rating', 'coupons'];
    const currentIndex = sorts.indexOf(sortBy);
    const nextSort = sorts[(currentIndex + 1) % sorts.length];
    setSortBy(nextSort);
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'distance': return '距离优先';
      case 'rating': return '评分优先';
      case 'coupons': return '优惠最多';
    }
  };

  const mapMarkers = sortedMerchants.slice(0, 6).map((m, i) => ({
    ...m,
    x: 20 + (i % 3) * 30 + Math.random() * 10,
    y: 25 + Math.floor(i / 3) * 40 + Math.random() * 15
  }));

  return (
    <View className={styles.mallPage}>
      <View className={styles.filterBar}>
        <View className={styles.viewToggle}>
          <View
            className={classNames(styles.toggleBtn, mapViewType === 'map' && styles.active)}
            onClick={handleToggleView}
          >
            <Text>🗺️</Text>
            <Text>{mapViewType === 'map' ? '地图模式' : '列表模式'}</Text>
          </View>
        </View>

        <ScrollView className={styles.categoryScroll} scrollX enhanced showScrollbar={false}>
          {mockCategories.map((cat) => (
            <View
              key={cat.id}
              className={classNames(styles.categoryChip, selectedCategory === cat.id && styles.active)}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Text>{cat.icon}</Text>
              <Text>{cat.name}</Text>
            </View>
          ))}
        </ScrollView>

        <View className={styles.districtFilter}>
          <Text className={styles.districtLabel}>区域:</Text>
          <ScrollView className={styles.districtScroll} scrollX enhanced showScrollbar={false}>
            {mockDistricts.map((dist) => (
              <View
                key={dist.id}
                className={classNames(styles.districtChip, selectedDistrict === dist.id && styles.active)}
                onClick={() => setSelectedDistrict(dist.id)}
              >
                <Text>{dist.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      <View className={styles.contentArea}>
        {mapViewType === 'map' && (
          <View className={styles.mapContainer}>
            {mapMarkers.map((marker) => (
              <View
                key={marker.id}
                className={styles.mapMarker}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                onClick={() => Taro.navigateTo({ url: `/pages/merchant-detail/index?id=${marker.id}` })}
              >
                <Text className={styles.markerIcon}>📍</Text>
                <Text className={styles.markerLabel}>{marker.name}</Text>
              </View>
            ))}
            <View className={styles.mapPlaceholder}>
              <Text style={{ fontSize: '80rpx' }}>🗺️</Text>
              <Text>沈阳市商圈地图</Text>
              <Text style={{ fontSize: '$font-size-sm', marginTop: '$spacing-xs' }}>
                共 {sortedMerchants.length} 家可用券商户
              </Text>
            </View>
          </View>
        )}

        <View className={styles.statsBar}>
          <Text className={styles.statsText}>
            共找到 {sortedMerchants.length} 家商户
          </Text>
          <View className={styles.sortBtn} onClick={handleSortChange}>
            <Text>🔄</Text>
            <Text>{getSortLabel()}</Text>
          </View>
        </View>

        <View className={styles.merchantList}>
          {sortedMerchants.length > 0 ? (
            sortedMerchants.map((merchant) => (
              <MerchantCard key={merchant.id} merchant={merchant} />
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🏪</Text>
              <Text className={styles.emptyText}>暂无符合条件的商户</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default MallPage;
