import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import type { TaskWarning } from '@/types/task';

interface WarningBadgeProps {
  warnings: TaskWarning[];
  maxShow?: number;
  onItemClick?: (warning: TaskWarning) => void;
  onMoreClick?: () => void;
}

const WarningBadge: React.FC<WarningBadgeProps> = ({ warnings, maxShow = 2, onItemClick, onMoreClick }) => {
  const unreadCount = warnings.filter(w => !w.isRead).length;
  const displayWarnings = warnings.slice(0, maxShow);

  const handleClick = (warning: TaskWarning) => {
    console.log('[WarningBadge] 点击预警:', warning.title);
    if (onItemClick) {
      onItemClick(warning);
    } else if (warning.waybillNo) {
      Taro.navigateTo({
        url: `/pages/waybill-detail/index?waybillNo=${warning.waybillNo}`
      }).catch(e => console.error('[WarningBadge] 跳转失败:', e));
    }
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'danger') return 'error';
    if (severity === 'warning') return 'warning';
    return 'primary';
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      overtime: '⏰',
      exception: '⚠️',
      high_priority: '🔴',
      batch_task: '📋'
    };
    return iconMap[type] || '🔔';
  };

  if (warnings.length === 0) return null;

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>预警提醒</Text>
          {unreadCount > 0 && (
            <View className={styles.badge}>
              <Text className={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {warnings.length > maxShow && (
          <Text className={styles.more} onClick={onMoreClick}>
            查看全部 ›
          </Text>
        )}
      </View>

      <View className={styles.list}>
        {displayWarnings.map(warning => (
          <View
            key={warning.id}
            className={classnames(
              styles.item,
              styles[`severity${getSeverityColor(warning.severity).charAt(0).toUpperCase() + getSeverityColor(warning.severity).slice(1)}`],
              !warning.isRead && styles.unread
            )}
            onClick={() => handleClick(warning)}
          >
            <View className={styles.icon}>
              <Text className={styles.iconText}>{getTypeIcon(warning.type)}</Text>
            </View>
            <View className={styles.content}>
              <View className={styles.itemHeader}>
                <Text className={styles.itemTitle}>{warning.title}</Text>
                {warning.deadline && (
                  <Text className={styles.deadline}>
                    {dayjs(warning.deadline).format('HH:mm')}
                  </Text>
                )}
              </View>
              <Text className={styles.itemDesc}>{warning.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default WarningBadge;
