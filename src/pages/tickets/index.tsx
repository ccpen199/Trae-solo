import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { mockTickets } from '@/data/mockTickets';
import { useUserStore } from '@/store/useUserStore';
import classnames from 'classnames';
import type { TicketType, TicketStatus, Ticket } from '@/types';

const typeFilters: Array<{ key: 'all' | TicketType; label: string; icon: string }> = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'repair', label: '报修', icon: '🛠️' },
  { key: 'complaint', label: '投诉', icon: '📢' },
  { key: 'suggestion', label: '建议', icon: '💡' },
];

const statusMap: Record<TicketStatus, { label: string; type: any }> = {
  pending: { label: '待处理', type: 'warning' },
  assigned: { label: '已派单', type: 'primary' },
  processing: { label: '处理中', type: 'info' },
  completed: { label: '已完成', type: 'success' },
  closed: { label: '已关闭', type: 'gray' },
};

const priorityLabel: Record<string, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

const TicketsPage: React.FC = () => {
  const { user } = useUserStore();
  const [typeFilter, setTypeFilter] = useState<'all' | TicketType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');

  const isProperty = user?.role === 'property';

  const list = useMemo(() => {
    let data = isProperty ? [...mockTickets] : mockTickets.filter((t) => t.submitterId === 'U001');
    if (typeFilter !== 'all') data = data.filter((t) => t.type === typeFilter);
    if (statusFilter !== 'all') data = data.filter((t) => t.status === statusFilter);
    return data;
  }, [typeFilter, statusFilter, isProperty]);

  const statusStats = useMemo(() => {
    const src = isProperty ? mockTickets : mockTickets.filter((t) => t.submitterId === 'U001');
    return {
      all: src.length,
      pending: src.filter((t) => t.status === 'pending' || t.status === 'assigned').length,
      processing: src.filter((t) => t.status === 'processing').length,
      completed: src.filter((t) => t.status === 'completed').length,
    };
  }, [isProperty]);

  const handleCreate = () => {
    Taro.navigateTo({ url: '/pages/ticket-create/index' });
  };

  const handleClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/ticket-detail/index?id=${id}` });
  };

  const handleRate = (t: Ticket, e) => {
    e.stopPropagation();
    Taro.navigateTo({ url: `/pages/ticket-detail/index?id=${t.id}&rate=1` });
  };

  const handleTake = (t: Ticket, e) => {
    e.stopPropagation();
    Taro.showModal({
      title: '接单确认',
      content: `确认接手工单【${t.title}】？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '接单成功', icon: 'success' });
          console.log('[Ticket] Take ticket:', t.id);
        }
      },
    });
  };

  return (
    <PageContainer>
      <View className={styles.typeFilter}>
        {typeFilters.map((f) => (
          <View
            key={f.key}
            className={classnames(styles.chip, typeFilter === f.key ? styles.active : '', f.key !== 'all' ? styles[f.key] : '')}
            onClick={() => setTypeFilter(f.key)}
          >
            <Text>{f.icon} {f.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.statusFilter}>
        {[
          { key: 'all', label: '全部', num: statusStats.all },
          { key: 'pending', label: '待处理', num: statusStats.pending },
          { key: 'processing', label: '处理中', num: statusStats.processing },
          { key: 'completed', label: '已完成', num: statusStats.completed },
        ].map((s) => (
          <View
            key={s.key}
            className={classnames(styles.chip, statusFilter === s.key ? styles.active : '')}
            onClick={() => setStatusFilter(s.key as any)}
          >
            <Text>{s.label}<Text className={styles.num}>{s.num}</Text></Text>
          </View>
        ))}
      </View>

      {list.length === 0 ? (
        <EmptyState icon="📭" text="暂无工单记录" />
      ) : (
        <View className={styles.ticketList}>
          {list.map((t) => (
            <View key={t.id} className={styles.card} onClick={() => handleClick(t.id)}>
              <View className={`${styles.typeBar} ${styles[t.type]}`} />
              <View className={styles.header}>
                <Text className={styles.title}>{t.title}</Text>
                <View style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <View className={`${styles.priorityTag} ${styles[t.priority]}`}>
                    <Text>{priorityLabel[t.priority]}</Text>
                  </View>
                  <StatusBadge type={statusMap[t.status].type} dot>
                    {statusMap[t.status].label}
                  </StatusBadge>
                </View>
              </View>
              <View className={styles.meta}>
                <View className={styles.item}>
                  <Text>📝</Text>
                  <Text>#{t.id.slice(1)}</Text>
                </View>
                <View className={styles.item}>
                  <Text>📍</Text>
                  <Text>{t.location}</Text>
                </View>
                <View className={styles.item}>
                  <Text>⏰</Text>
                  <Text>{t.createdAt.slice(5, 16)}</Text>
                </View>
                {t.responseMinutes && (
                  <View className={styles.item}>
                    <Text>⚡</Text>
                    <Text>响应{t.responseMinutes}分钟</Text>
                  </View>
                )}
              </View>
              <Text className={styles.desc}>{t.description}</Text>
              <View className={styles.footer}>
                <View className={styles.handler}>
                  {t.handlerName ? (
                    <>
                      <View className={styles.avatar}>
                        <Text>👷</Text>
                      </View>
                      <Text>{isProperty ? `提交人：${t.submitterName}` : `处理人：${t.handlerName}`}</Text>
                    </>
                  ) : (
                    <>
                      <View className={styles.avatar}><Text>🙋</Text></View>
                      <Text>等待分派处理人</Text>
                    </>
                  )}
                </View>
                <View className={styles.actions}>
                  {!isProperty && t.status === 'completed' && !t.satisfaction && (
                    <View className={`${styles.btn} ${styles.primary}`} onClick={(e) => handleRate(t, e)}>
                      <Text>去评价</Text>
                    </View>
                  )}
                  {isProperty && (t.status === 'pending') && (
                    <View className={`${styles.btn} ${styles.success}`} onClick={(e) => handleTake(t, e)}>
                      <Text>我要接单</Text>
                    </View>
                  )}
                  <View className={`${styles.btn} ${styles.outline}`}>
                    <Text>查看详情 ›</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className={styles.fab} onClick={handleCreate}>
        <Text className={styles.icon}>➕</Text>
        <Text className={styles.label}>新建工单</Text>
      </View>
    </PageContainer>
  );
};

export default TicketsPage;
