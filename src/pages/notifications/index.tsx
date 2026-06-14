import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import EmptyState from '@/components/EmptyState';
import classnames from 'classnames';
import { mockNotifications } from '@/data/mockKpi';
import type { Notification, NotificationType } from '@/types';

const typeTabs = [
  { key: 'all', label: '全部' },
  { key: 'ticket', label: '工单' },
  { key: 'access', label: '门禁' },
  { key: 'order', label: '订单' },
  { key: 'announcement', label: '公告' },
  { key: 'alert', label: '告警' },
];

const NotificationsPage: React.FC = () => {
  const [type, setType] = useState<string>('all');

  const list: Notification[] = useMemo(() => {
    if (!mockNotifications || !mockNotifications.length) return [];
    if (type === 'all') return mockNotifications;
    return mockNotifications.filter(n => n.type === type);
  }, [type]);

  const unreadCountByType = useMemo(() => {
    const map: Record<string, number> = { all: 0 };
    mockNotifications?.forEach(n => {
      if (!n.read) {
        map.all++;
        map[n.type] = (map[n.type] || 0) + 1;
      }
    });
    return map;
  }, []);

  const getIconBoxClass = (t: NotificationType) => {
    switch (t) {
      case 'ticket': return 's1';
      case 'announcement': return 's2';
      case 'order': return 's3';
      case 'alert': return 's5';
      case 'access': return 's4';
      default: return 's1';
    }
  };

  const getIcon = (t: NotificationType) => {
    switch (t) {
      case 'ticket': return '📋';
      case 'announcement': return '📢';
      case 'order': return '📦';
      case 'alert': return '🚨';
      case 'access': return '🔑';
      default: return '🔔';
    }
  };

  const handleClick = (n: Notification) => {
    if (n.link) {
      Taro.navigateTo({ url: n.link, fail: () => Taro.showToast({ title: '页面不存在', icon: 'none' }) });
    }
  };

  return (
    <PageContainer>
      <View className={styles.tabs}>
        {typeTabs.map(t => (
          <View
            key={t.key}
            className={classnames(styles.tab, type === t.key && styles.active)}
            onClick={() => setType(t.key)}
          >
            <Text>{t.label}</Text>
            {(unreadCountByType[t.key] || 0) > 0 && (
              <View className={styles.badge}><Text>{unreadCountByType[t.key]}</Text></View>
            )}
          </View>
        ))}
      </View>

      {list.length === 0 ? (
        <EmptyState title="暂无消息" subTitle="这里会显示系统推送的各类通知" icon="🔕" />
      ) : (
        list.map(n => (
          <View
            key={n.id}
            className={classnames(styles.msgCard, !n.read && styles.unread)}
            onClick={() => handleClick(n)}
          >
            <View className={styles.row1}>
              <View className={`${styles.iconBox} ${styles[getIconBoxClass(n.type)]}`}>
                <Text>{getIcon(n.type)}</Text>
              </View>
              <View className={styles.info}>
                <View className={styles.titleRow}>
                  <Text className={styles.title}>{n.title}</Text>
                  <Text className={styles.time}>{n.timestamp.slice(5, 16)}</Text>
                </View>
                <Text className={styles.content}>{n.content}</Text>
              </View>
              {!n.read && <View className={styles.dot} />}
            </View>
          </View>
        ))
      )}
    </PageContainer>
  );
};

export default NotificationsPage;
