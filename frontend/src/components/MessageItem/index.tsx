import React from 'react';
import { View, Text } from '@tarojs/components';
import type { Message } from '@/types/message';
import { formatDate, formatRelativeTime } from '@/utils/format';
import styles from './index.module.scss';

interface MessageItemProps {
  message: Message;
  onClick?: (message: Message) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onClick }) => {
  const handleClick = () => {
    onClick?.(message);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      system_notice: '📢',
      matter_progress: '📋',
      license_reminder: '📄',
      policy_update: '📰',
      service_recommend: '💡',
      payment_reminder: '💰',
      verification_result: '✅'
    };
    return icons[type] || '📬';
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent') return <View className={styles.badgeUrgent}>紧急</View>;
    if (priority === 'high') return <View className={styles.badgeHigh}>重要</View>;
    return null;
  };

  return (
    <View className={`${styles.item} ${!message.read ? styles.unread : ''}`} onClick={handleClick}>
      <View className={styles.icon}>
        <Text className={styles.iconText}>{getTypeIcon(message.type)}</Text>
        {!message.read && <View className={styles.dot} />}
      </View>
      
      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.titleRow}>
            <Text className={styles.title}>{message.title}</Text>
            {getPriorityBadge(message.priority)}
          </View>
          <Text className={styles.time}>{formatRelativeTime(message.sendTime)}</Text>
        </View>
        
        <Text className={styles.summary}>{message.summary}</Text>
        
        <View className={styles.footer}>
          <Text className={styles.sender}>{message.sender}</Text>
        </View>
      </View>
    </View>
  );
};

export default MessageItem;
