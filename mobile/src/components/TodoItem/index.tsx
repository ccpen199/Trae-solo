import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { TodoItem } from '@/types';
import styles from './index.module.scss';

interface TodoItemProps {
  data: TodoItem;
  onRead?: () => void;
}

const typeMap = {
  sign: { label: '待签署', className: styles.typeSign },
  review: { label: '审核中', className: styles.typeReview },
  reject: { label: '已驳回', className: styles.typeReject },
  complete: { label: '已完成', className: styles.typeComplete },
  remind: { label: '提醒', className: styles.typeRemind }
};

const priorityMap = {
  high: styles.priorityHigh,
  medium: styles.priorityMedium,
  low: styles.priorityLow
};

const TodoItemCard: React.FC<TodoItemProps> = ({ data, onRead }) => {
  const type = typeMap[data.type];

  const handleClick = () => {
    if (!data.isRead) onRead?.();
    const routes: Record<string, string> = {
      sign: '/pages/sign-detail/index?id=' + data.relatedId,
      reject: '/pages/approval-detail/index?id=' + data.relatedId,
      complete: '/pages/approval-detail/index?id=' + data.relatedId,
      reviewing: '/pages/approval-detail/index?id=' + data.relatedId,
      remind: '/pages/certificate/index'
    };
    const url = routes[data.type];
    if (url) {
      Taro.navigateTo({ url }).catch(console.error);
    }
  };

  return (
    <View
      className={classnames(styles.card, !data.isRead && styles.unread, priorityMap[data.priority])}
      onClick={handleClick}
    >
      <View className={styles.header}>
        <View className={classnames(styles.typeTag, type.className)}>{type.label}</View>
        {!data.isRead && <View className={styles.dot} />}
      </View>
      <Text className={styles.title}>{data.title}</Text>
      <Text className={styles.description}>{data.description}</Text>
      <View className={styles.footer}>
        <Text className={styles.time}>{data.createdAt}</Text>
        {data.deadline && (
          <Text className={styles.deadline}>截止：{data.deadline}</Text>
        )}
      </View>
    </View>
  );
};

export default TodoItemCard;
