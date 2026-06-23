import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import MessageCard from '@/components/MessageCard';
import { messageService } from '@/services/messageService';
import { Message, ChatSession, MessageType } from '@/types/message';
import styles from './index.module.scss';

type TabType = 'session' | 'message';
type FilterType = 'all' | MessageType;

const MessagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('session');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [unreadStats, setUnreadStats] = useState({
    announcement: 0,
    task: 0,
    chat: 0
  });

  const typeFilters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'announcement', label: '公告' },
    { key: 'task', label: '任务' },
    { key: 'chat', label: '私聊' }
  ];

  const loadData = useCallback(async () => {
    try {
      const [messageRes, sessionRes, unreadRes] = await Promise.all([
        messageService.getMessageList(undefined, 1, 20),
        messageService.getChatSessions(),
        messageService.getUnreadStats()
      ]);

      setMessages(messageRes.list);
      setSessions(sessionRes);
      setUnreadStats(unreadRes);
    } catch (error) {
      console.error('加载消息数据失败', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    loadData();
  });

  const filteredMessages = useMemo(() => {
    if (activeFilter === 'all') return messages;
    return messages.filter(m => m.type === activeFilter);
  }, [messages, activeFilter]);

  const handleSessionClick = (session: ChatSession) => {
    Taro.navigateTo({ url: `/pages/chat/index?sessionId=${session.id}` });
  };

  const handleMessageClick = (message: Message) => {
    if (message.type === 'chat') {
      Taro.navigateTo({ url: `/pages/chat/index?sessionId=${message.senderId}` });
    } else {
      Taro.showToast({ title: `查看${message.type === 'announcement' ? '公告' : '任务'}详情`, icon: 'none' });
    }
  };

  const formatTime = (time: string) => {
    const now = dayjs();
    const msgTime = dayjs(time);
    const diffDays = now.diff(msgTime, 'day');

    if (diffDays === 0) return msgTime.format('HH:mm');
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return msgTime.format('MM-DD');
  };

  if (loading && !refreshing) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, activeTab === 'session' && styles.active)}
          onClick={() => setActiveTab('session')}
        >
          聊天
          {unreadStats.chat > 0 && (
            <View className={styles.badge}>{unreadStats.chat > 99 ? '99+' : unreadStats.chat}</View>
          )}
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'message' && styles.active)}
          onClick={() => setActiveTab('message')}
        >
          消息
          {(unreadStats.announcement + unreadStats.task) > 0 && (
            <View className={styles.badge}>
              {(unreadStats.announcement + unreadStats.task) > 99 ? '99+' : unreadStats.announcement + unreadStats.task}
            </View>
          )}
        </View>
      </View>

      <View className={styles.searchBar}>
        <View className={styles.searchInput}>
          <Text className={styles.icon}>🔍</Text>
          <Text className={styles.placeholder}>搜索消息</Text>
        </View>
      </View>

      {activeTab === 'message' && (
        <ScrollView className={styles.typeFilter} scrollX showScrollbar={false}>
          {typeFilters.map(filter => (
            <View
              key={filter.key}
              className={classnames(styles.typeChip, activeFilter === filter.key && styles.active)}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
              {filter.key === 'announcement' && unreadStats.announcement > 0 && ` (${unreadStats.announcement})`}
              {filter.key === 'task' && unreadStats.task > 0 && ` (${unreadStats.task})`}
            </View>
          ))}
        </ScrollView>
      )}

      <ScrollView
        className={styles.content}
        scrollY
        enhanced
        showScrollbar={false}
      >
        {activeTab === 'session' ? (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>聊天会话</Text>
            </View>
            {sessions.length > 0 ? (
              <View className={styles.sessionList}>
                {sessions.map(session => (
                  <View
                    key={session.id}
                    className={styles.sessionItem}
                    onClick={() => handleSessionClick(session)}
                  >
                    <View className={styles.sessionAvatar}>
                      <Image
                        src={session.avatar}
                        mode="aspectFill"
                      />
                      {session.unreadCount > 0 && !session.isMute && (
                        <View className={styles.unreadBadge}>
                          {session.unreadCount > 99 ? '99+' : session.unreadCount}
                        </View>
                      )}
                      {session.isMute && (
                        <View className={styles.muteIcon}>🔇</View>
                      )}
                    </View>
                    <View className={styles.sessionInfo}>
                      <View className={styles.sessionHeader}>
                        <Text className={styles.sessionName}>{session.name}</Text>
                        <Text className={styles.sessionTime}>{formatTime(session.lastMessageTime)}</Text>
                      </View>
                      <View className={styles.sessionContent}>
                        {session.draft ? (
                          <Text className={styles.sessionDraft}>[草稿] {session.draft}</Text>
                        ) : (
                          <Text className={styles.sessionLastMsg}>
                            {session.lastMessageSender}: {session.lastMessageContent}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>暂无聊天会话</View>
            )}
          </View>
        ) : (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>消息列表</Text>
            </View>
            {filteredMessages.length > 0 ? (
              filteredMessages.map(message => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onClick={() => handleMessageClick(message)}
                />
              ))
            ) : (
              <View className={styles.emptyState}>暂无消息</View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MessagePage;
