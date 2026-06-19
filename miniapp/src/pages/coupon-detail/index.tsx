import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { mockMerchants } from '@/data/mockData';
import CouponCard from '@/components/CouponCard';
import type { Coupon } from '@/types';

const CouponDetailPage: React.FC = () => {
  const router = useRouter();
  const { coupons, claimCoupon } = useAppStore();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [merchant, setMerchant] = useState(mockMerchants[0]);
  const [expanded, setExpanded] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const couponId = router.params.id;
    if (couponId) {
      const found = coupons.find(c => c.id === couponId);
      if (found) {
        setCoupon(found);
        const relatedMerchant = mockMerchants.find(m => m.id === found.merchantId) || mockMerchants[0];
        setMerchant(relatedMerchant);
      }
    }
  }, [router.params.id, coupons]);

  useDidShow(() => {
    console.log('[CouponDetailPage] Page show');
  });

  const handleClaim = () => {
    if (!coupon) return;
    const success = claimCoupon(coupon.activityId);
    if (success) {
      setClaimed(true);
      Taro.showToast({ title: '领取成功', icon: 'success' });
      setCoupon({ ...coupon, status: 'available' });
    } else {
      Taro.showToast({ title: '已领取过或已达上限', icon: 'none' });
    }
  };

  const handleUse = () => {
    Taro.switchTab({ url: '/pages/scan/index' });
  };

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  const handleFavorite = () => {
    Taro.showToast({ title: '已收藏', icon: 'success' });
  };

  if (!coupon) {
    return (
      <View className={styles.detailPage}>
        <View style={{ padding: '100rpx', textAlign: 'center', color: '$color-text-tertiary' }}>
          <Text style={{ fontSize: '80rpx' }}>🎫</Text>
          <Text style={{ display: 'block', marginTop: '20rpx' }}>优惠券不存在</Text>
        </View>
      </View>
    );
  }

  const isAvailable = coupon.status === 'available';
  const isUsed = coupon.status === 'used';
  const isExpired = coupon.status === 'expired';

  const usageRules = [
    { icon: '📅', text: `有效期: ${coupon.validStart} 至 ${coupon.validEnd}` },
    { icon: '📍', text: `适用商户: ${merchant.name}及${merchant.branchCount}家连锁门店` },
    { icon: '💰', text: `满¥${coupon.threshold?.toFixed(0) || 0}可用，不可叠加` },
    { icon: '🔄', text: '不找零、不兑现、遗失不补' },
    { icon: '👤', text: '仅限本人使用，不可转让' }
  ];

  return (
    <View className={styles.detailPage}>
      <View className={styles.couponShowcase}>
        <View className={styles.showcaseHeader}>
          <View className={styles.showcaseBadges}>
            <Text className={styles.showcaseBadge}>
              {coupon.type === 'full_discount' ? '满减券' : coupon.type === 'discount' ? '折扣券' : '立减券'}
            </Text>
            {coupon.district && (
              <Text className={styles.showcaseBadge}>
                📍 {coupon.district}专属
              </Text>
            )}
          </View>
          <Text className={styles.couponCode}># {coupon.code}</Text>
        </View>

        <CouponCard coupon={coupon} showUseBtn={false} />
      </View>

      <View className={styles.detailCard}>
        <View className={styles.merchantSection} onClick={() => Taro.navigateTo({ url: `/pages/merchant-detail/index?id=${merchant.id}` })}>
          <View className={styles.merchantLogo}>
            <Text>🏪</Text>
          </View>
          <View className={styles.merchantInfo}>
            <Text className={styles.merchantName}>{merchant.name}</Text>
            <View className={styles.merchantMeta}>
              <View className={styles.metaItem}>
                <Text>⭐</Text>
                <Text>{merchant.rating}</Text>
              </View>
              <View className={styles.metaItem}>
                <Text>📍</Text>
                <Text>{merchant.distance}km</Text>
              </View>
              <View className={styles.metaItem}>
                <Text>🎫</Text>
                <Text>{merchant.couponCount}张券</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: '32rpx', color: '$color-text-tertiary' }}>›</Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text>📊</Text>
            <Text>领取核销情况</Text>
          </Text>
          <View className={styles.usageStats}>
            <View className={styles.stat}>
              <Text className={styles.statValue}>{coupon.totalClaimed?.toLocaleString() || 0}</Text>
              <Text className={styles.statLabel}>已领取</Text>
            </View>
            <View className={styles.stat}>
              <Text className={styles.statValue}>{coupon.totalUsed?.toLocaleString() || 0}</Text>
              <Text className={styles.statLabel}>已核销</Text>
            </View>
            <View className={styles.stat}>
              <Text className={styles.statValue}>{coupon.redemptionRate?.toFixed(1) || 0}%</Text>
              <Text className={styles.statLabel}>核销率</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text>📋</Text>
            <Text>使用规则</Text>
          </Text>
          {usageRules.map((rule, idx) => (
            <View key={idx} className={styles.ruleItem}>
              <Text className={styles.ruleIcon}>{rule.icon}</Text>
              <Text>{rule.text}</Text>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text>📝</Text>
            <Text>活动说明</Text>
          </Text>
          <View className={styles.expandableText}>
            <Text>
              本活动由沈阳市商务局联合{merchant.name}共同推出，旨在拉动内需、促进消费。
              活动期间，每位用户每周最多可领取{coupon.claimLimit || 3}张，数量有限，先到先得。
            </Text>
            {expanded && (
              <Text style={{ display: 'block', marginTop: '12rpx' }}>
                优惠券核销后7个工作日内完成资金清算。遇节假日顺延。如有疑问请拨打客服热线400-888-8888。
                本活动最终解释权归沈阳市商务局所有。活动详情可关注"沈阳惠民"官方公众号了解。
                请在有效期内使用，过期作废。核销时请出示本人有效身份证件。
              </Text>
            )}
          </View>
          <View className={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
            {expanded ? '收起' : '展开更多'}
            <Text>{expanded ? '▲' : '▼'}</Text>
          </View>
        </View>

        {isAvailable && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text>🔍</Text>
              <Text>核销步骤</Text>
            </Text>
            <View className={styles.verificationSteps}>
              <View className={styles.stepItem}>
                <View className={styles.stepNumber}>1</View>
                <View className={styles.stepContent}>
                  <Text className={styles.stepTitle}>出示核销码</Text>
                  <Text className={styles.stepDesc}>前往商户，点击下方"立即使用"出示二维码</Text>
                </View>
              </View>
              <View className={styles.stepItem}>
                <View className={styles.stepNumber}>2</View>
                <View className={styles.stepContent}>
                  <Text className={styles.stepTitle}>收银员扫码</Text>
                  <Text className={styles.stepDesc}>支持POS机具、小程序码、城市码三种核销方式</Text>
                </View>
              </View>
              <View className={styles.stepItem}>
                <View className={styles.stepNumber}>3</View>
                <View className={styles.stepContent}>
                  <Text className={styles.stepTitle}>享受优惠</Text>
                  <Text className={styles.stepDesc}>系统自动抵扣，享受优惠金额</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className={styles.shareBar}>
        <Button className={styles.shareBtn} onClick={handleFavorite}>
          <Text>❤️</Text>
          <Text>收藏</Text>
        </Button>
        <Button className={styles.shareBtn} onClick={handleShare}>
          <Text>📤</Text>
          <Text>分享</Text>
        </Button>
        {isAvailable && !claimed && (
          <Button className={styles.useBtn} onClick={handleClaim}>
            立即领取
          </Button>
        )}
        {isAvailable && claimed && (
          <Button className={styles.useBtn} onClick={handleUse}>
            立即使用
          </Button>
        )}
        {isUsed && (
          <Button className={styles.useBtn} disabled>
            已使用
          </Button>
        )}
        {isExpired && (
          <Button className={styles.useBtn} disabled>
            已过期
          </Button>
        )}
      </View>
    </View>
  );
};

export default CouponDetailPage;
