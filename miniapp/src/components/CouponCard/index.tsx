import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classNames from 'classnames';
import type { CouponInstance } from '@/types';
import dayjs from 'dayjs';

interface CouponCardProps {
  coupon: CouponInstance;
  showUseBtn?: boolean;
  onUse?: () => void;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, showUseBtn = true, onUse }) => {
  const { activity, status, expiresAt, usedAt } = coupon;

  const formatValue = () => {
    if (activity.type === 'discount') {
      return `${(activity.value * 10).toFixed(0)}折`;
    }
    return `¥${activity.value}`;
  };

  const formatCondition = () => {
    if (activity.threshold > 0) {
      return `满${activity.threshold}可用`;
    }
    return '无门槛';
  };

  const handleUse = () => {
    if (status !== 'available') return;
    if (onUse) {
      onUse();
    } else {
      Taro.navigateTo({
        url: `/pages/coupon-detail/index?id=${coupon.id}`
      });
    }
  };

  const statusClass = classNames(
    styles.couponBtn,
    status !== 'available' && styles.disabled
  );

  return (
    <View className={styles.couponCard} onClick={handleUse}>
      <View className={styles.couponLeft}>
        <Text className={styles.couponValue}>{formatValue()}</Text>
        {activity.type === 'discount' ? (
          <Text className={styles.couponUnit}>优惠</Text>
        ) : (
          <Text className={styles.couponUnit}>元</Text>
        )}
        <Text className={styles.couponCondition}>{formatCondition()}</Text>
      </View>
      <View className={styles.couponRight}>
        <View>
          <Text className={styles.couponTitle}>{activity.name}</Text>
          <Text className={styles.couponDesc}>{activity.description}</Text>
        </View>
        <View className={styles.couponMeta}>
          <Text className={styles.couponExpiry}>
            {status === 'used' && <Text className={classNames(styles.couponStatus, styles.statusUsed)}>已使用</Text>}
            {status === 'expired' && <Text className={classNames(styles.couponStatus, styles.statusExpired)}>已过期</Text>}
            {status === 'available' && `有效期至 ${dayjs(expiresAt).format('MM-DD')}`}
          </Text>
          {showUseBtn && status === 'available' && (
            <Button className={statusClass} onClick={(e) => { e.stopPropagation(); handleUse(); }}>
              立即使用
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default CouponCard;
