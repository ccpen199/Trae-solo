import React from 'react';
import { View, Text } from '@tarojs/components';
import { formatDate } from '@/utils/format';
import styles from './index.module.scss';

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  operator?: string;
  status?: 'completed' | 'current' | 'pending';
  type?: 'normal' | 'success' | 'warning' | 'error';
}

interface TimelineProps {
  items: TimelineItem[];
  showIcon?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({ items, showIcon = true }) => {
  const getStatusClass = (status?: string, type?: string) => {
    if (status === 'current') return styles.current;
    if (status === 'pending') return styles.pending;
    if (type === 'error') return styles.error;
    if (type === 'warning') return styles.warning;
    if (type === 'success') return styles.success;
    return styles.completed;
  };

  const getTypeIcon = (type?: string, status?: string) => {
    if (status === 'current') return '⏳';
    if (status === 'pending') return '○';
    if (type === 'error') return '✕';
    if (type === 'success') return '✓';
    if (type === 'warning') return '!';
    return '✓';
  };

  return (
    <View className={styles.timeline}>
      {items.map((item, index) => (
        <View 
          key={item.id} 
          className={`${styles.item} ${index === items.length - 1 ? styles.last : ''}`}
        >
          <View className={styles.line}>
            {index < items.length - 1 && (
              <View className={`${styles.lineBar} ${getStatusClass(item.status, item.type)}`} />
            )}
          </View>
          
          <View className={styles.dotWrap}>
            <View className={`${styles.dot} ${getStatusClass(item.status, item.type)}`}>
              {showIcon && (
                <Text className={styles.dotIcon}>{getTypeIcon(item.type, item.status)}</Text>
              )}
            </View>
          </View>
          
          <View className={styles.content}>
            <View className={styles.header}>
              <Text className={styles.title}>{item.title}</Text>
              <Text className={styles.time}>{formatDate(item.time)}</Text>
            </View>
            {item.description && (
              <Text className={styles.description}>{item.description}</Text>
            )}
            {item.operator && (
              <Text className={styles.operator}>操作人：{item.operator}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

export default Timeline;
