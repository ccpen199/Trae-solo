import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { Merchant } from '@/types';

interface MerchantCardProps {
  merchant: Merchant;
  onView?: () => void;
}

const MerchantCard: React.FC<MerchantCardProps> = ({ merchant, onView }) => {
  const handleView = () => {
    if (onView) {
      onView();
    } else {
      Taro.navigateTo({
        url: `/pages/merchant-detail/index?id=${merchant.id}`
      });
    }
  };

  const renderStars = () => {
    const fullStars = Math.floor(merchant.rating);
    const hasHalf = merchant.rating % 1 >= 0.5;
    return `${'★'.repeat(fullStars)}${hasHalf ? '☆' : ''} ${merchant.rating}`;
  };

  return (
    <View className={styles.merchantCard} onClick={handleView}>
      <View className={styles.merchantImage}>
        <Image src={merchant.imageUrl} mode='aspectFill' />
      </View>
      <View className={styles.merchantInfo}>
        <View>
          <Text className={styles.merchantName}>{merchant.name}</Text>
          <View className={styles.merchantMeta}>
            <Text className={styles.merchantRating}>{renderStars()}</Text>
            {merchant.distance && (
              <Text className={styles.merchantDistance}>{merchant.distance}km</Text>
            )}
          </View>
          <Text className={styles.merchantAddress}>{merchant.address}</Text>
        </View>
        <View className={styles.merchantFooter}>
          <Text className={styles.couponCount}>{merchant.couponCount}个可用券</Text>
          <Button className={styles.viewBtn} onClick={(e) => { e.stopPropagation(); handleView(); }}>
            查看
          </Button>
        </View>
      </View>
    </View>
  );
};

export default MerchantCard;
