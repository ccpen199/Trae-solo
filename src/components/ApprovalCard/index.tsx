import React from 'react';
import { View, Text } from '@tarojs/components';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { ApprovalTodo } from '@/types/approval';

interface ApprovalCardProps {
  todo: ApprovalTodo;
  onClick?: () => void;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  high: { bg: '#FEECEB', text: '#E74C3C' },
  medium: { bg: '#FFF7E6', text: '#FF7A00' },
  low: { bg: '#F0FFF4', text: '#0EA663' }
};

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低'
};

const ApprovalCard: React.FC<ApprovalCardProps> = ({ todo, onClick }) => {
  const priorityColor = priorityColors[todo.priority];

  return (
    <View
      className={styles.approvalCard}
      onClick={onClick}
    >
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{todo.title}</Text>
          {todo.isUrgent && (
            <View className={styles.urgentBadge}>紧急</View>
          )}
          {todo.isCountersign && (
            <View className={styles.countersignBadge}>会签</View>
          )}
        </View>
        <View
          className={styles.priorityTag}
          style={{ backgroundColor: priorityColor.bg, color: priorityColor.text }}
        >
          {priorityLabels[todo.priority]}
        </View>
      </View>

      <View className={styles.infoRow}>
        <Text className={styles.templateName}>{todo.templateName}</Text>
        <Text className={styles.nodeName}>{todo.currentNodeName}</Text>
      </View>

      <View className={styles.metaRow}>
        <View className={styles.applicant}>
          <View className={styles.avatarPlaceholder}>
            <Text className={styles.avatarText}>{todo.applicantName.charAt(0)}</Text>
          </View>
          <View className={styles.applicantInfo}>
            <Text className={styles.applicantName}>{todo.applicantName}</Text>
            <Text className={styles.applicantDept}>{todo.applicantDept}</Text>
          </View>
        </View>
        <View className={styles.timeInfo}>
          <Text className={styles.receiveTime}>
            {dayjs(todo.receiveTime).format('MM-DD HH:mm')}
          </Text>
          {todo.deadline && (
            <Text className={styles.deadline}>
              截止：{dayjs(todo.deadline).format('MM-DD HH:mm')}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default ApprovalCard;
