import React, { memo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { ReminderItem } from '../../types';
import classnames from 'classnames';
import { useAppStore } from '../../store/appStore';
import { useUserStore } from '../../store/userStore';

interface Props {
  reminders: ReminderItem[];
}

const priorityConfig = {
  urgent: { color: '#F53F3F', bg: '#FFECE8', label: '紧急', icon: '🔴' },
  high: { color: '#FF8A00', bg: '#FFF4E6', label: '重要', icon: '🟠' },
  normal: { color: '#1E4FA5', bg: '#E8F0FC', label: '提醒', icon: '🔵' }
};

const ReminderCard: React.FC<Props> = memo(({ reminders }) => {
  const speak = useAppStore(s => s.speak);
  const dismissReminder = useUserStore(s => s.dismissReminder);

  if (!reminders || reminders.length === 0) {
    return (
      <View className={styles.emptyCard}>
        <Text className={styles.emptyIcon}>✅</Text>
        <Text className={styles.emptyText}>暂无待办事项，办事记录保持良好！</Text>
      </View>
    );
  }

  const handleClick = (reminder: ReminderItem) => {
    speak(`${priorityConfig[reminder.priority].label}提醒：${reminder.title}`);
    if (reminder.serviceId) {
      Taro.navigateTo({ url: `/pages/service-detail/index?id=${reminder.serviceId}` });
    } else if (reminder.applicationId) {
      Taro.navigateTo({ url: `/pages/application-detail/index?id=${reminder.applicationId}` });
    } else if (reminder.policyId) {
      Taro.navigateTo({ url: `/pages/policy-detail/index?id=${reminder.policyId}` });
    }
  };

  const handleDismiss = (e, id: string) => {
    e.stopPropagation();
    dismissReminder(id);
    Taro.showToast({ title: '已忽略', icon: 'none' });
  };

  const urgentCount = reminders.filter(r => r.priority === 'urgent').length;
  const highCount = reminders.filter(r => r.priority === 'high').length;

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>⏰ 我的提醒</Text>
          {(urgentCount > 0 || highCount > 0) && (
            <View className={styles.badge}>
              <Text>{reminders.length}项待办</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.reminderList}>
        {reminders.map(reminder => {
          const cfg = priorityConfig[reminder.priority];
          return (
            <View
              key={reminder.id}
              className={classnames(styles.reminderItem, styles[`priority-${reminder.priority}`])}
              onClick={() => handleClick(reminder)}
            >
              <View className={styles.reminderLeft}>
                <View
                  className={styles.priorityIndicator}
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}
                >
                  <Text>{cfg.icon}</Text>
                </View>
                <View className={styles.reminderContent}>
                  <View className={styles.reminderTitleRow}>
                    <Text className={styles.reminderTitle}>{reminder.title}</Text>
                    <View
                      className={styles.priorityLabel}
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      <Text>{cfg.label}</Text>
                    </View>
                  </View>
                  <Text className={styles.reminderContentText}>{reminder.content}</Text>
                  {reminder.deadline && (
                    <Text className={styles.deadlineText}>
                      ⏰ 截止日期：{reminder.deadline}
                    </Text>
                  )}
                </View>
              </View>
              <View className={styles.reminderActions}>
                <View className={styles.dismissBtn} onClick={(e) => handleDismiss(e, reminder.id)}>
                  <Text>忽略</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

export default ReminderCard;
