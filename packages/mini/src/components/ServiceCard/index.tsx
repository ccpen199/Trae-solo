import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { ServiceItem } from '@/types';

interface ServiceCardProps {
  service: ServiceItem;
  onClick?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/service-detail/index?id=${service.id}` });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.thumb}>
        <Text className={styles.emoji}>🛎️</Text>
      </View>
      <View className={styles.info}>
        <Text className={styles.name}>{service.name}</Text>
        <Text className={styles.desc}>{service.description}</Text>
        <View className={styles.bottom}>
          <View className={styles.priceRow}>
            <Text className={styles.price}>¥{service.price}</Text>
            {service.originalPrice && (
              <Text className={styles.originalPrice}>¥{service.originalPrice}</Text>
            )}
            <Text className={styles.unit}>/ {service.unit}</Text>
          </View>
          <View className={styles.meta}>
            <Text className={styles.rating}>⭐ {service.rating}</Text>
            <Text className={styles.sales}>已售{service.sales}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ServiceCard;
