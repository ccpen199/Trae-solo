import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

type StatType = 'primary' | 'success' | 'warning' | 'error' | 'info';

interface StatCardProps {
  label: string;
  value: number | string;
  type?: StatType;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const typeStyles: Record<StatType, string> = {
  primary: styles.primary,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
  info: styles.info
};

const StatCard: React.FC<StatCardProps> = ({ label, value, type = 'primary', icon, onClick }) => {
  return (
    <View className={classnames(styles.card, typeStyles[type])} onClick={onClick}>
      <View className={styles.iconWrap}>{icon}</View>
      <View className={styles.info}>
        <Text className={styles.value}>{value}</Text>
        <Text className={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

export default StatCard;
