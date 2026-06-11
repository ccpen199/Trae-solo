import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendText?: string;
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'purple';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendText,
  icon,
  color = 'primary',
  onClick
}) => {
  return (
    <View
      className={classnames(styles.statCard, styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`])}
      onClick={onClick}
    >
      <View className={styles.header}>
        <Text className={styles.title}>{title}</Text>
        {icon && <Text className={styles.icon}>{icon}</Text>}
      </View>
      <View className={styles.content}>
        <Text className={styles.value}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
      {(trend !== undefined || trendText) && (
        <View className={styles.trend}>
          {trend !== undefined && (
            <Text className={classnames(styles.trendValue, trend >= 0 ? styles.trendUp : styles.trendDown)}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </Text>
          )}
          {trendText && <Text className={styles.trendText}>{trendText}</Text>}
        </View>
      )}
    </View>
  );
};

export default StatCard;
