import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  onClick,
  suffix
}) => {
  return (
    <View
      className={classnames(styles.statCard, styles[color])}
      onClick={onClick}
    >
      {icon && <Text className={styles.icon}>{icon}</Text>}
      <View className={styles.content}>
        <View className={styles.value}>
          {value}
          {suffix && <Text className={styles.suffix}>{suffix}</Text>}
        </View>
        <Text className={styles.title}>{title}</Text>
      </View>
    </View>
  );
};

export default StatCard;
