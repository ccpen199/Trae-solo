import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { mockMerchants } from '@/data/mockData';
import CouponCard from '@/components/CouponCard';
import type { Merchant, Coupon } from '@/types';

const MerchantDetailPage: React.FC = () => {
  const router = useRouter();
  const { coupons, claimCoupon } = useAppStore();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [merchantCoupons, setMerchantCoupons] = useState<Coupon[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const merchantId = router.params.id;
    if (merchantId) {
      const found = mockMerchants.find(m => m.id === merchantId) || mockMerchants[0];
      setMerchant(found);
      const relatedCoupons = coupons.filter(c => c.merchantId === merchantId && c.status !== 'expired');
      setMerchantCoupons(relatedCoupons);
    }
  }, [router.params.id, coupons]);

  useDidShow(() => {
    console.log('[MerchantDetailPage] Page show');
  });

  const handleClaimCoupon = (activityId: string) => {
    const success = claimCoupon(activityId);
    if (success) {
      Taro.showToast({ title: '领取成功', icon: 'success' });
    } else {
      Taro.showToast({ title: '已领取过或已达上限', icon: 'none' });
    }
  };

  const handleNavigate = () => {
    Taro.openLocation({
      latitude: merchant?.latitude || 41.8045,
      longitude: merchant?.longitude || 123.4313,
      name: merchant?.name || '',
      address: merchant?.address || ''
    });
  };

  const handleCall = () => {
    if (merchant?.phone) {
      Taro.makePhoneCall({ phoneNumber: merchant.phone });
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Taro.showToast({ title: isFavorite ? '已取消收藏' : '已收藏', icon: 'success' });
  };

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  const handleViewAllCoupons = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  if (!merchant) {
    return (
      <View className={styles.merchantPage}>
        <View style={{ padding: '100rpx', textAlign: 'center', color: '$color-text-tertiary' }}>
          <Text style={{ fontSize: '80rpx' }}>🏪</Text>
          <Text style={{ display: 'block', marginTop: '20rpx' }}>商户不存在</Text>
        </View>
      </View>
    );
  }

  const branchList = [
    { name: `${merchant.name}(总店)`, address: merchant.address, distance: merchant.distance, hours: '09:00-21:00' },
    { name: `${merchant.name}(青年大街店)`, address: '沈阳市和平区青年大街288号', distance: 2.3, hours: '10:00-22:00' },
    { name: `${merchant.name}(中街店)`, address: '沈阳市沈河区中街路115号', distance: 3.8, hours: '09:30-21:30' }
  ];

  return (
    <View className={styles.merchantPage}>
      <View className={styles.merchantBanner}>
        <View className={styles.bannerContent}>
          <View className={styles.merchantLogo}>
            <Text>{merchant.categoryIcon || '🏪'}</Text>
          </View>
          <View className={styles.merchantInfo}>
            <Text className={styles.merchantName}>{merchant.name}</Text>
            <View className={styles.merchantTags}>
              {merchant.tags?.slice(0, 3).map((tag, idx) => (
                <Text key={idx} className={styles.tag}>{tag}</Text>
              ))}
              {merchant.couponCount > 0 && (
                <Text className={styles.tag}>🎫 {merchant.couponCount}张券</Text>
              )}
            </View>
            <View className={styles.merchantStats}>
              <View className={styles.statItem}>
                <Text>⭐</Text>
                <Text>{merchant.rating}</Text>
              </View>
              <View className={styles.statItem}>
                <Text>📍</Text>
                <Text>{merchant.distance}km</Text>
              </View>
              <View className={styles.statItem}>
                <Text>💬</Text>
                <Text>{merchant.reviewCount?.toLocaleString() || 0}条评价</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.infoRow}>
          <View className={styles.infoIcon}>
            <Text>📍</Text>
          </View>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>地址</Text>
            <Text className={styles.infoValue}>{merchant.address}</Text>
          </View>
          <Text className={styles.infoAction} onClick={handleNavigate}>导航</Text>
        </View>

        <View className={styles.infoRow}>
          <View className={styles.infoIcon}>
            <Text>📞</Text>
          </View>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>电话</Text>
            <Text className={styles.infoValue}>{merchant.phone || '400-888-8888'}</Text>
          </View>
          <Text className={styles.infoAction} onClick={handleCall}>拨打</Text>
        </View>

        <View className={styles.infoRow}>
          <View className={styles.infoIcon}>
            <Text>🕐</Text>
          </View>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>营业时间</Text>
            <Text className={styles.infoValue}>{merchant.businessHours || '09:00 - 21:00'}</Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <View className={styles.infoIcon}>
            <Text>🖼️</Text>
          </View>
          <View className={styles.infoContent}>
            <Text className={styles.infoLabel}>门店照片</Text>
            <ScrollView className={styles.storeImages} scrollX showScrollbar={false}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} className={styles.storeImage}>
                  <Text>🏪</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text>🎫</Text>
            <Text>可用优惠券</Text>
          </Text>
          <Text className={styles.sectionCount}>共 {merchantCoupons.length} 张</Text>
        </View>
        {merchantCoupons.length > 0 ? (
          <View className={styles.couponList}>
            {merchantCoupons.slice(0, 3).map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                showUseBtn={coupon.status === 'available'}
                onUse={() => handleClaimCoupon(coupon.activityId)}
              />
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎫</Text>
            <Text className={styles.emptyText}>暂无可用优惠券</Text>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text>🏢</Text>
            <Text>全部门店 ({merchant.branchCount || 3})</Text>
          </Text>
        </View>
        <View className={styles.branchList}>
          {branchList.map((branch, idx) => (
            <View key={idx} className={styles.branchItem} onClick={() => {
              Taro.openLocation({
                latitude: merchant.latitude + idx * 0.01,
                longitude: merchant.longitude + idx * 0.01,
                name: branch.name,
                address: branch.address
              });
            }}>
              <Text className={styles.branchName}>{branch.name}</Text>
              <Text className={styles.branchAddress}>{branch.address}</Text>
              <View className={styles.branchMeta}>
                <Text className={styles.branchDistance}>
                  <Text>📍</Text>
                  <Text>{branch.distance}km</Text>
                </Text>
                <Text className={styles.branchHours}>{branch.hours}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.actionBar}>
        <Button className={styles.iconBtn} onClick={handleToggleFavorite}>
          <Text>{isFavorite ? '❤️' : '🤍'}</Text>
        </Button>
        <Button className={styles.iconBtn} onClick={handleShare}>
          <Text>📤</Text>
        </Button>
        <Button className={styles.secondaryBtn} onClick={handleNavigate}>
          导航前往
        </Button>
        <Button className={styles.primaryBtn} onClick={handleCall}>
          电话联系
        </Button>
      </View>
    </View>
  );
};

export default MerchantDetailPage;
