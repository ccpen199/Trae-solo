import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { Message, MessageType } from '@/types/message';

interface MessageCardProps {
  message: Message;
  onClick?: () => void;
}

const typeConfig: Record<MessageType, { label: string; color: string; bgColor: string }> = {
  announcement: { label: '公告', color: 'error', bgColor: '#FEECEB' },
  task: { label: '任务', color: 'warning', bgColor: '#FFF7E6' },
  chat: { label: '私聊', color: 'primary', bgColor: '#E8F0FB' }
};

const priorityLabels: Record<string, string> = {
  high: '紧急',
  medium: '普通',
  low: '低'
};

const MessageCard: React.FC<MessageCardProps> = ({ message, onClick }) => {
  const config = typeConfig[message.type];
  const isUnread = message.status === 'unread';

  return (
    <View
      className={classnames(styles.messageCard, isUnread && styles.unread)}
      onClick={onClick}
    >
      <View className={styles.header}>
        <View className={styles.left}>
          <Image
            className={styles.avatar}
            src={message.senderAvatar}
            mode="aspectFill"
          />
          <View
            className={styles.typeTag}
            style={{ backgroundColor: config.bgColor, color: config.color === 'error' ? '#E74C3C' : config.color === 'warning' ? '#FF7A00' : '#1E5AA8' }}
          >
            {config.label}
          </View>
          {message.priority === 'high' && (
            <View className={styles.urgentTag}>紧急</View>
          )}
        </View>
        <Text className={styles.time}>
          {dayjs(message.createTime).format('MM-DD HH:mm')}
        </Text>
      </View>

      <View className={styles.content}>
        <Text className={styles.title}>{message.title}</Text>
        <Text className={styles.description}>{message.content}</Text>
      </View>

      {message.priority !== 'low' && (
        <View className={styles.footer}>
          <Text className={styles.priority}>
            优先级：{priorityLabels[message.priority]}
          </Text>
          {isUnread && <View className={styles.unreadDot} />}
        </View>
      )}
    </View>
  );
};

export default MessageCard;
