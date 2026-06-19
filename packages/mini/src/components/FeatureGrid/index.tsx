import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { QuickFeature } from '@/types';

interface FeatureGridProps {
  features: QuickFeature[];
  columns?: number;
}

const FeatureGrid: React.FC<FeatureGridProps> = ({ features, columns = 4 }) => {
  const handleClick = (feature: QuickFeature) => {
    if (feature.page) {
      Taro.navigateTo({ url: feature.page }).catch(() => {
        Taro.switchTab({ url: feature.page }).catch(() => {
          console.log('[FeatureGrid] navigate failed:', feature.page);
        });
      });
    }
  };

  return (
    <View className={styles.grid} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {features.map((item) => (
        <View
          key={item.id}
          className={styles.gridItem}
          onClick={() => handleClick(item)}
        >
          <View className={styles.iconWrap} style={{ backgroundColor: `${item.color}15` }}>
            <Text className={styles.icon} style={{ color: item.color }}>{item.icon}</Text>
          </View>
          <Text className={styles.name}>{item.name}</Text>
        </View>
      ))}
    </View>
  );
};

export default FeatureGrid;
