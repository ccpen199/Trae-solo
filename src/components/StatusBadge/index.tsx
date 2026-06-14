import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

type BadgeType = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray' | 'repair' | 'complaint' | 'suggestion';

interface StatusBadgeProps {
  type?: BadgeType;
  dot?: boolean;
  children: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type = 'primary', dot, children }) => {
  return (
    <View className={classnames(styles.badge, styles[type], dot && styles.dot)}>
      <Text>{children}</Text>
    </View>
  );
};

export default StatusBadge;
