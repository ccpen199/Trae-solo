import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = '#10B981', onClick }) => {
  return (
    <View className={classnames(styles.statCard, onClick && styles.clickable)} onClick={onClick}>
      {icon && <Text className={styles.icon} style={{ backgroundColor: `${color}15`, color }}>{icon}</Text>}
      <View className={styles.content}>
        <Text className={styles.value} style={{ color }}>{value}</Text>
        <Text className={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

export default StatCard;
