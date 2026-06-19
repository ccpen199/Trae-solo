import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { TicketItem } from '@/types';
import { ticketTypeMap, ticketStatusMap, ticketPriorityMap } from '@/data/ticket';

interface TicketCardProps {
  ticket: TicketItem;
  onClick?: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const typeConfig = ticketTypeMap[ticket.type];
  const statusConfig = ticketStatusMap[ticket.status];
  const priorityConfig = ticketPriorityMap[ticket.priority];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/ticket-detail/index?id=${ticket.id}` });
    }
  };

  return (
    <View className={classnames(styles.card)} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.left}>
          <Text className={styles.typeTag} style={{ backgroundColor: typeConfig.bg, color: typeConfig.color }}>
            {typeConfig.label}
          </Text>
          <Text className={styles.title}>{ticket.title}</Text>
        </View>
        <Text className={styles.statusTag} style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
          {statusConfig.label}
        </Text>
      </View>

      <Text className={styles.content}>{ticket.content}</Text>

      <View className={styles.footer}>
        <Text className={styles.meta}>优先级：<Text style={{ color: priorityConfig.color }}>{priorityConfig.label}</Text></Text>
        {ticket.handlerName && <Text className={styles.meta}>处理人：{ticket.handlerName}</Text>}
        <Text className={styles.time}>{ticket.createdAt}</Text>
      </View>
    </View>
  );
};

export default TicketCard;
