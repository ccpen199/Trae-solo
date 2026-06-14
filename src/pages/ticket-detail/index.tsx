import React, { useState, useMemo } from 'react';
import { View, Text, Image, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import ProgressStep from '@/components/ProgressStep';
import { mockTickets } from '@/data/mockTickets';
import { useUserStore } from '@/store/useUserStore';
import type { Ticket, TicketStatus } from '@/types';
import classnames from 'classnames';

const statusMap: Record<TicketStatus, { label: string; type: any }> = {
  pending: { label: '待处理', type: 'warning' },
  assigned: { label: '已派单', type: 'primary' },
  processing: { label: '处理中', type: 'info' },
  completed: { label: '已完成', type: 'success' },
  closed: { label: '已关闭', type: 'gray' },
};

const TicketDetailPage: React.FC = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const isProperty = user?.role === 'property';
  const id = router.params.id || 'T001';
  const shouldRate = router.params.rate === '1';

  const ticket: Ticket = useMemo(() => mockTickets.find((t) => t.id === id) || mockTickets[0], [id]);

  const [showRate, setShowRate] = useState(shouldRate || (ticket.status === 'completed' && !ticket.satisfaction));
  const [rate, setRate] = useState<number>(ticket.satisfaction || 0);
  const [comment, setComment] = useState(ticket.comment || '');

  const handleSubmitRate = () => {
    if (rate === 0) { Taro.showToast({ title: '请选择星级', icon: 'none' }); return; }
    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: '评价成功', icon: 'success' });
      setShowRate(false);
      console.log('[Ticket] Rate:', rate, comment);
    }, 800);
  };

  return (
    <PageContainer>
      <View className={styles.headerCard}>
        <View className={styles.row1}>
          <Text className={styles.title}>{ticket.title}</Text>
          <StatusBadge type={statusMap[ticket.status].type} dot>
            {statusMap[ticket.status].label}
          </StatusBadge>
        </View>
        <View className={styles.meta}>
          <View className={styles.item}><Text>📝</Text><Text>#{ticket.id.slice(1)}</Text></View>
          <View className={styles.item}><Text>⏰</Text><Text>{ticket.createdAt}</Text></View>
          <View className={styles.item}><Text>⚡</Text><Text>响应 {ticket.responseMinutes || '--'} 分钟</Text></View>
          {ticket.handleMinutes && <View className={styles.item}><Text>🔧</Text><Text>处理 {ticket.handleMinutes} 分钟</Text></View>}
        </View>
      </View>

      <SectionCard title="工单信息" titleIcon="📋">
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.l}>工单类型</Text>
            <View style={{ marginTop: 6 }}>
              <StatusBadge type={ticket.type as any}>
                {ticket.type === 'repair' ? '报修' : ticket.type === 'complaint' ? '投诉' : '建议'}
              </StatusBadge>
            </View>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.l}>紧急程度</Text>
            <Text className={styles.v}>
              {ticket.priority === 'urgent' ? '紧急' : ticket.priority === 'high' ? '高' : ticket.priority === 'medium' ? '中' : '低'}
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.l}>处理人</Text>
            <Text className={styles.v}>{ticket.handlerName || '待分派'}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.l}>提交人</Text>
            <Text className={styles.v}>{ticket.submitterName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.l}>联系方式</Text>
            <Text className={styles.v}>{ticket.contactPhone}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.l}>发生位置</Text>
            <Text className={styles.v}>{ticket.location}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="问题描述" titleIcon="📝">
        <View className={styles.descBox}>
          <Text className={styles.content}>{ticket.description}</Text>
          {ticket.images?.length > 0 && (
            <View className={styles.imgs}>
              {ticket.images.map((img, i) => (
                <Image key={i} className={styles.img} src={img} mode="aspectFill" />
              ))}
            </View>
          )}
        </View>
      </SectionCard>

      <SectionCard title="处理进度" titleIcon="🔄">
        <ProgressStep items={ticket.progress.map((p) => ({
          status: p.status,
          operator: p.operator,
          remark: p.remark,
          timestamp: p.timestamp,
          images: p.images,
        }))} />
      </SectionCard>

      {showRate && (
        <SectionCard title="服务评价" titleIcon="⭐">
          <View className={styles.satisfaction}>
            <View className={styles.head}>
              <Text className={styles.label}>您对本次服务的满意度：</Text>
            </View>
            <View className={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <View
                  key={n}
                  className={classnames(styles.star, rate >= n && styles.active)}
                  onClick={() => setRate(n)}
                >
                  <Text>{'★'}</Text>
                </View>
              ))}
            </View>
            <View className={styles.textareaBox}>
              <Textarea
                placeholder="请输入您的评价建议..."
                value={comment}
                onInput={(e) => setComment(e.detail.value)}
                maxlength={200}
                style={{ width: '100%', minHeight: '120rpx' }}
              />
            </View>
            <View className={styles.submitRow}>
              <View className={styles.btn} onClick={handleSubmitRate}>
                <Text>提交评价</Text>
              </View>
            </View>
          </View>
        </SectionCard>
      )}

      {!showRate && ticket.satisfaction && (
        <SectionCard title="已完成评价" titleIcon="✅">
          <View className={styles.satisfaction}>
            <View className={styles.showBox}>
              <View className={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Text key={n} className={styles.star} style={{ opacity: n <= (ticket.satisfaction || 0) ? 1 : 0.2 }}>
                    {'★'}
                  </Text>
                ))}
                <Text className={styles.score}>{ticket.satisfaction}.0 分</Text>
              </View>
              {ticket.comment && <Text className={styles.text}>"{ticket.comment}"</Text>}
            </View>
          </View>
        </SectionCard>
      )}

      <View style={{ height: '180rpx' }} />

      <View className={styles.bottomBar}>
        {isProperty && (ticket.status === 'processing' || ticket.status === 'assigned') && (
          <View className={`${styles.btn} ${styles.success}`} onClick={() => Taro.showToast({ title: '完成工单', icon: 'success' })}>
            <Text>标记完成</Text>
          </View>
        )}
        <View className={`${styles.btn} ${styles.outline}`} onClick={() => Taro.makePhoneCall({ phoneNumber: ticket.contactPhone }).catch(() => {})}>
          <Text>联系对方</Text>
        </View>
        <View className={`${styles.btn} ${styles.primary}`} onClick={() => Taro.showToast({ title: '消息功能开发中', icon: 'none' })}>
          <Text>发送消息</Text>
        </View>
      </View>
    </PageContainer>
  );
};

export default TicketDetailPage;
