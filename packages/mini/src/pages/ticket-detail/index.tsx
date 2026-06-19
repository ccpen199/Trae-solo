import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { mockTickets, ticketTypeMap, ticketStatusMap, ticketPriorityMap } from '@/data/ticket';

const TicketDetailPage: React.FC = () => {
  const router = useRouter();
  const ticketId = router.params.id;
  const ticket = mockTickets.find(t => t.id === ticketId) || mockTickets[0];
  const [rating, setRating] = useState(5);

  const typeConfig = ticketTypeMap[ticket.type];
  const statusConfig = ticketStatusMap[ticket.status];
  const priorityConfig = ticketPriorityMap[ticket.priority];

  const timeline = [
    { time: ticket.createdAt, content: '工单已提交，等待处理', remark: ticket.type },
    { time: ticket.createdAt, content: '工单已受理', remark: ticket.handlerName ? `由 ${ticket.handlerName} 处理` : '等待分配处理人' },
    ticket.status === 'PROCESSING' || ticket.status === 'COMPLETED' || ticket.status === 'CLOSED'
      ? { time: ticket.createdAt, content: '正在处理中' }
      : null,
    ticket.status === 'COMPLETED' || ticket.status === 'CLOSED'
      ? { time: ticket.completedAt || ticket.createdAt, content: '工单已完成' }
      : null,
  ].filter(Boolean) as any[];

  const handleRate = () => {
    Taro.showToast({ title: `感谢您的${rating}星评价`, icon: 'success' });
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个工单吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已取消工单', icon: 'success' });
        }
      },
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <View style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
            <Text className={styles.typeTag} style={{ backgroundColor: typeConfig.bg, color: typeConfig.color }}>
              {typeConfig.label}
            </Text>
            <Text className={styles.title}>{ticket.title}</Text>
          </View>
          <Text className={styles.statusTag} style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
            {statusConfig.label}
          </Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaItem}>🕐 {ticket.createdAt}</Text>
          <Text className={`${styles.metaItem} ${styles.priority}`} style={{ color: priorityConfig.color }}>
            优先级：{priorityConfig.label}
          </Text>
          {ticket.handlerName && <Text className={styles.metaItem}>👷 {ticket.handlerName}</Text>}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>工单详情</Text>
        <Text className={styles.contentText}>{ticket.content}</Text>
      </View>

      {ticket.handlerName && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>处理人</Text>
          <View className={styles.handlerInfo}>
            <View className={styles.handlerAvatar}>👷</View>
            <View className={styles.handlerMeta}>
              <Text className={styles.handlerName}>{ticket.handlerName}</Text>
              <Text className={styles.handlerRole}>物业客服专员</Text>
            </View>
            <Text style={{ color: '#10B981', fontSize: 24 }}>📞 联系</Text>
          </View>
        </View>
      )}

      {ticket.status === 'COMPLETED' && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>服务评价</Text>
          <View className={styles.ratingSection}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text
                key={star}
                className={styles.star}
                onClick={() => setRating(star)}
              >
                {star <= rating ? '⭐' : '☆'}
              </Text>
            ))}
            <Text className={styles.ratingText}>点击星星评分</Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>处理进度</Text>
        <View className={styles.timeline}>
          {timeline.map((item, idx) => (
            <View key={idx} className={styles.timelineItem}>
              <View className={styles.timelineDot} />
              <Text className={styles.timelineTime}>{item.time}</Text>
              <Text className={styles.timelineContent}>{item.content}</Text>
              {item.remark && <Text className={styles.timelineRemark}>{item.remark}</Text>}
            </View>
          ))}
        </View>
      </View>

      {(ticket.status === 'PENDING' || ticket.status === 'ASSIGNED') && (
        <View className={styles.bottomBar}>
          <View className={styles.btnSecondary} onClick={handleCancel}>取消工单</View>
          <View className={styles.btnPrimary}>催办</View>
        </View>
      )}

      {ticket.status === 'COMPLETED' && (
        <View className={styles.bottomBar}>
          <View className={styles.btnSecondary}>有异议</View>
          <View className={styles.btnPrimary} onClick={handleRate}>提交评价</View>
        </View>
      )}
    </ScrollView>
  );
};

export default TicketDetailPage;
