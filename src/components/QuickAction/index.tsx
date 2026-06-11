import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

export interface QuickActionItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'error' | 'purple';
  path: string;
  badge?: number;
}

interface QuickActionProps {
  items: QuickActionItem[];
  columns?: 3 | 4 | 5;
  onItemClick?: (item: QuickActionItem) => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ items, columns = 4, onItemClick }) => {
  const handleClick = (item: QuickActionItem) => {
    console.log('[QuickAction] 点击:', item.title);
    if (onItemClick) {
      onItemClick(item);
    } else if (item.path) {
      Taro.navigateTo({ url: item.path }).catch(e => {
        console.error('[QuickAction] 跳转失败:', e);
      });
    }
  };

  return (
    <View className={styles.quickAction}>
      <View
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {items.map(item => (
          <View
            key={item.id}
            className={classnames(styles.item, styles[`color${item.color.charAt(0).toUpperCase() + item.color.slice(1)}`])}
            onClick={() => handleClick(item)}
          >
            <View className={styles.iconWrapper}>
              <Text className={styles.icon}>{item.icon}</Text>
              {item.badge !== undefined && item.badge > 0 && (
                <View className={styles.badge}>
                  <Text className={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                </View>
              )}
            </View>
            <Text className={styles.title}>{item.title}</Text>
            {item.subtitle && <Text className={styles.subtitle}>{item.subtitle}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
};

export default QuickAction;
