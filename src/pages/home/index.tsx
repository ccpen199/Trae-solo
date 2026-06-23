import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import StatCard from '@/components/StatCard';
import MessageCard from '@/components/MessageCard';
import ApprovalCard from '@/components/ApprovalCard';
import { useUserStore } from '@/store/useUserStore';
import { messageService } from '@/services/messageService';
import { approvalService } from '@/services/approvalService';
import { Message } from '@/types/message';
import { ApprovalTodo } from '@/types/approval';
import styles from './index.module.scss';

const quickActions = [
  { icon: '📋', text: '发起审批', color: 'primary', path: '/pages/approval-create/index' },
  { icon: '📧', text: '我的待办', color: 'orange', path: '/pages/message/index' },
  { icon: '📁', text: '文档中心', color: 'green', path: '/pages/document-detail/index' },
  { icon: '👥', text: '通讯录', color: 'purple', path: '/pages/contacts/index' },
  { icon: '📢', text: '发布公告', color: 'red', path: '' },
  { icon: '📊', text: '数据报表', color: 'cyan', path: '' },
  { icon: '🔐', text: '安全中心', color: 'primary', path: '/pages/security/index' },
  { icon: '⚙️', text: '系统设置', color: 'orange', path: '/pages/mine/index' }
];

const HomePage: React.FC = () => {
  const { userInfo } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [todos, setTodos] = useState<ApprovalTodo[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    urgent: 0,
    completed: 0,
    announcement: 0
  });

  const loadData = useCallback(async () => {
    try {
      const [messageRes, todoRes, statRes] = await Promise.all([
        messageService.getMessageList(undefined, 1, 3),
        approvalService.getTodoList(1, 3),
        approvalService.getApprovalStats()
      ]);

      setMessages(messageRes.list);
      setTodos(todoRes.list);
      setStats({
        pending: statRes.todo,
        urgent: 0,
        completed: statRes.approved,
        announcement: statRes.todo
      });
    } catch (error) {
      console.error('加载首页数据失败', error);
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

  const handleActionClick = (action: typeof quickActions[0]) => {
    if (action.path) {
      Taro.navigateTo({ url: action.path });
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  const handleMessageClick = (message: Message) => {
    if (message.type === 'chat') {
      Taro.navigateTo({ url: `/pages/chat/index?sessionId=${message.senderId}` });
    } else {
      Taro.showToast({ title: `查看${message.type === 'announcement' ? '公告' : '任务'}详情`, icon: 'none' });
    }
  };

  const handleApprovalClick = (todo: ApprovalTodo) => {
    Taro.navigateTo({ url: `/pages/approval-detail/index?id=${todo.instanceId}` });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  if (loading && !refreshing) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  return (
    <ScrollView
      className={styles.page}
      scrollY
      enhanced
      showScrollbar={false}
    >
      <View className={styles.header}>
        <Text className={styles.greeting}>
          {getGreeting()}，{userInfo?.name || '同事'}
        </Text>
        <Text className={styles.subGreeting}>
          {userInfo?.departmentName} · {userInfo?.position}
        </Text>
      </View>

      <View className={styles.weatherCard}>
        <View className={styles.weatherHeader}>
          <View className={styles.weatherInfo}>
            <Text className={styles.location}>📍 北京市</Text>
            <Text className={styles.temp}>26°</Text>
            <Text className={styles.weatherDesc}>晴转多云 · 东南风2级</Text>
          </View>
          <Text className={styles.weatherIcon}>☀️</Text>
        </View>
        <View className={styles.workTips}>
          <View className={styles.tipItem}>
            <Text className={styles.emoji}>🎯</Text>
            <Text>今日待办 {stats.pending} 项</Text>
          </View>
          <View className={styles.tipItem}>
            <Text className={styles.emoji}>⏰</Text>
            <Text>紧急事项 {stats.urgent} 项</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsGrid}>
        <StatCard
          title="待办审批"
          value={stats.pending}
          icon="⏳"
          color="primary"
          suffix="项"
          onClick={() => Taro.switchTab({ url: '/pages/message/index' })}
        />
        <StatCard
          title="紧急事项"
          value={stats.urgent}
          icon="🚨"
          color="error"
          suffix="项"
        />
        <StatCard
          title="今日完成"
          value={stats.completed}
          icon="✅"
          color="success"
          suffix="项"
        />
        <StatCard
          title="未读公告"
          value={stats.announcement}
          icon="📢"
          color="warning"
          suffix="条"
        />
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <View className={styles.titleLeft}>
            <Text className={styles.titleText}>快捷入口</Text>
          </View>
        </View>
        <View className={styles.quickActions}>
          {quickActions.map((action, index) => (
            <View
              key={index}
              className={styles.actionItem}
              onClick={() => handleActionClick(action)}
            >
              <View className={`${styles.actionIcon} ${styles[action.color]}`}>
                <Text>{action.icon}</Text>
              </View>
              <Text className={styles.actionText}>{action.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <View className={styles.titleLeft}>
            <Text className={styles.titleText}>审批待办</Text>
            {todos.length > 0 && (
              <View className={styles.titleBadge}>{todos.length}</View>
            )}
          </View>
          <Text
            className={styles.seeMore}
            onClick={() => Taro.switchTab({ url: '/pages/message/index' })}
          >
            查看全部 →
          </Text>
        </View>
        {todos.length > 0 ? (
          todos.map(todo => (
            <ApprovalCard
              key={todo.instanceId}
              todo={todo}
              onClick={() => handleApprovalClick(todo)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>暂无待办事项</View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <View className={styles.titleLeft}>
            <Text className={styles.titleText}>最新消息</Text>
            {messages.length > 0 && (
              <View className={styles.titleBadge}>{messages.length}</View>
            )}
          </View>
          <Text
            className={styles.seeMore}
            onClick={() => Taro.switchTab({ url: '/pages/message/index' })}
          >
            查看全部 →
          </Text>
        </View>
        {messages.length > 0 ? (
          messages.map(message => (
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
    </ScrollView>
  );
};

export default HomePage;
