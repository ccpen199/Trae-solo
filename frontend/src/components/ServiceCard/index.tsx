import React from 'react';
import { View, Text } from '@tarojs/components';
import type { ServiceItem } from '@/types/matter';
import styles from './index.module.scss';

interface ServiceCardProps {
  service: ServiceItem;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
  onClick?: (service: ServiceItem) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  size = 'medium', 
  showDescription = false,
  onClick 
}) => {
  const handleClick = () => {
    onClick?.(service);
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      online: '在线办理',
      offline: '线下办理',
      appointment: '预约办理',
      suspended: '暂停服务'
    };
    return map[status] || status;
  };

  const getStatusClass = (status: string) => {
    return status === 'online' ? styles.statusOnline : styles.statusOffline;
  };

  const sizeClass = size === 'small' ? styles.small : size === 'large' ? styles.large : styles.medium;

  return (
    <View className={`${styles.card} ${sizeClass}`} onClick={handleClick}>
      <View className={styles.icon}>
        <Text style={{ fontSize: size === 'small' ? '28rpx' : '36rpx' }}>{service.icon}</Text>
      </View>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.name}>{service.serviceName}</Text>
          {service.isCrossProvince && (
            <View className={styles.crossTag}>跨省</View>
          )}
          {service.isUrgent && (
            <View className={styles.urgentTag}>加急</View>
          )}
        </View>
        {showDescription && (
          <Text className={styles.desc}>{service.description}</Text>
        )}
        <View className={styles.footer}>
          <View className={`${styles.status} ${getStatusClass(service.status)}`}>
            {getStatusText(service.status)}
          </View>
          {service.hotLevel && service.hotLevel > 0 && (
            <View className={styles.hot}>
              {Array.from({ length: service.hotLevel }).map((_, i) => (
                <Text key={i} className={styles.hotIcon}>🔥</Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default ServiceCard;
