import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { PageHeader, MessageItem } from '@/components';
import { getMessageList, getMessageStats, markAllAsRead } from '@/services/message';
import type { Message, MessageStats } from '@/types/message';
import styles from './index.module.scss';

const MessagePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'notification' | 'todo' | 'reminder' | 'marketing'>('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);

  const tabs = [
    { key: 'all', name: '全部', filter: () => true },
    { key: 'notification', name: '通知', filter: (m: Message) => m.category === 'notification' },
    { key: 'todo', name: '待办', filter: (m: Message) => m.category === 'todo' },
    { key: 'reminder', name: '提醒', filter: (m: Message) => m.category === 'reminder' },
    { key: 'marketing', name: '推荐', filter: (m: Message) => m.category === 'marketing' }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [msgList, msgStats] = await Promise.all([
        getMessageList(),
        getMessageStats()
      ]);
      setMessages(msgList);
      setFilteredMessages(msgList);
      setStats(msgStats);
    } catch (error) {
      console.error('[MessagePage] 加载数据失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    loadData();
  });

  useEffect(() => {
    const tab = tabs.find(t => t.key === activeTab);
    if (tab) {
      setFilteredMessages(messages.filter(tab.filter));
    }
  }, [activeTab, messages]);

  const handleTabClick = (key: string) => {
    setActiveTab(key as any);
  };

  const handleMessageClick = async (message: Message) => {
    try {
      const { markAsRead } = await import('@/services/message');
      await markAsRead(message.id);
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, read: true } : m));
    } catch (error) {
      console.error('标记已读失败', error);
    }

    if (message.actionType === 'detail' && message.actionParams?.matterId) {
      Taro.navigateTo({
        url: `/pages/matter/detail?id=${message.actionParams.matterId}`
      });
    } else if (message.actionType === 'detail' && message.actionParams?.licenseId) {
      Taro.navigateTo({
        url: `/pages/license/detail?id=${message.actionParams.licenseId}`
      });
    } else if (message.actionType === 'apply' && message.actionParams?.serviceCode) {
      Taro.navigateTo({
        url: `/pages/service/detail?serviceCode=${message.actionParams.serviceCode}`
      });
    } else if (message.actionType === 'link' && message.actionUrl) {
      Taro.navigateTo({ url: message.actionUrl });
    } else {
      Taro.navigateTo({
        url: `/pages/message/detail?id=${message.id}`
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      Taro.showModal({
        title: '确认操作',
        content: '确定要将全部消息标记为已读吗？',
        success: async (res) => {
          if (res.confirm) {
            const result = await markAllAsRead();
            if (result.success) {
              setMessages(prev => prev.map(m => ({ ...m, read: true })));
              Taro.showToast({ title: `已标记${result.count}条消息`, icon: 'success' });
            }
          }
        }
      });
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const handleSettings = () => {
    Taro.navigateTo({ url: '/pages/message/settings' });
  };

  const getUnreadCount = (category: string) => {
    if (!stats) return 0;
    if (category === 'all') return stats.unread;
    return stats.byCategory[category as keyof typeof stats.byCategory] || 0;
  };

  return (
    <View className={styles.page}>
      <PageHeader
        title="消息中心"
        subtitle="重要信息 及时通知"
      />

      <View className={styles.header}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats?.total || 0}</Text>
            <Text className={styles.statLabel}>全部消息</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#F5222D' }}>{stats?.unread || 0}</Text>
            <Text className={styles.statLabel}>未读消息</Text>
          </View>
          <View className={styles.headerActions}>
            <View className={styles.headerAction} onClick={handleMarkAllRead}>
              <Text className={styles.headerActionIcon}>📖</Text>
              <Text className={styles.headerActionText}>全部已读</Text>
            </View>
            <View className={styles.headerAction} onClick={handleSettings}>
              <Text className={styles.headerActionIcon}>⚙️</Text>
              <Text className={styles.headerActionText}>设置</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        <View className={styles.tabBar}>
          {tabs.map(tab => (
            <View
              key={tab.key}
              className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
              onClick={() => handleTabClick(tab.key)}
            >
              <View className={styles.tabNameWrap}>
                <Text className={styles.tabName}>{tab.name}</Text>
                {getUnreadCount(tab.key) > 0 && (
                  <View className={styles.tabBadge}>
                    <Text className={styles.tabBadgeText}>
                      {getUnreadCount(tab.key) > 99 ? '99+' : getUnreadCount(tab.key)}
                    </Text>
                  </View>
                )}
              </View>
              {activeTab === tab.key && <View className={styles.tabIndicator} />}
            </View>
          ))}
        </View>

        <View className={styles.messageList}>
          {filteredMessages.length > 0 ? (
            filteredMessages.map(message => (
              <MessageItem
                key={message.id}
                message={message}
                onClick={handleMessageClick}
              />
            ))
          ) : (
            <View className={styles.empty}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyText}>暂无消息</Text>
              <Text className={styles.emptySubtext}>您的所有消息都会显示在这里</Text>
            </View>
          )}
        </View>

        {stats && stats.unread > 0 && (
          <View className={styles.tipCard}>
            <View className={styles.tipHeader}>
              <Text className={styles.tipIcon}>💡</Text>
              <Text className={styles.tipTitle}>温馨提示</Text>
            </View>
            <Text className={styles.tipContent}>
              您有 {stats.unread} 条未读消息，请及时查看处理，避免错过重要信息。
            </Text>
          </View>
        )}

        <View className={styles.footer}>
          <Text className={styles.footerText}>— 消息服务由江苏省人力资源和社会保障厅提供 —</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default MessagePage;
