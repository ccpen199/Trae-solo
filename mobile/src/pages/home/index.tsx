import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import PageContainer from '@/components/PageContainer';
import StatCard from '@/components/StatCard';
import TodoItemCard from '@/components/TodoItem';
import { useAppStore } from '@/store/useAppStore';
import { getUserCert, loginWithGov } from '@/services/auth';
import { getTodos, getNotices, getStatistics } from '@/services/tracking';
import type { TodoItem, Notice, CACertificate, User } from '@/types';
import { mockUser, mockCertificate } from '@/data/mock';
import styles from './index.module.scss';

interface QuickEntry {
  key: string;
  label: string;
  icon: string;
  bg: string;
  badge?: number;
  route: string;
}

const quickEntries: QuickEntry[] = [
  { key: 'individual', label: '个体工商户', icon: '🏪', bg: 'linear-gradient(135deg, #E8F0FE, #D4E4FC)', route: '/pages/apply/index?category=市场主体登记' },
  { key: 'enterprise', label: '企业登记', icon: '🏢', bg: 'linear-gradient(135deg, #E8F8F5, #D4EFDF)', route: '/pages/apply/index?category=市场主体登记' },
  { key: 'food', label: '食品许可', icon: '🍱', bg: 'linear-gradient(135deg, #FCF3E8, #F8E4CC)', route: '/pages/apply/index?category=行政许可' },
  { key: 'annual', label: '年报公示', icon: '📊', bg: 'linear-gradient(135deg, #F4E8FC, #E4CCF8)', route: '/pages/apply/index?category=年度报告' },
  { key: 'change', label: '变更登记', icon: '✏️', bg: 'linear-gradient(135deg, #E8FCF0, #CCF0D9)', route: '/pages/apply/index?category=变更登记' },
  { key: 'cancel', label: '注销登记', icon: '📄', bg: 'linear-gradient(135deg, #FCE8E8, #F0CCCC)', route: '/pages/apply/index?category=注销登记' },
  { key: 'license', label: '电子证照', icon: '🪪', bg: 'linear-gradient(135deg, #E8F4FC, #CCE0F0)', route: '/pages/certificate/index' },
  { key: 'more', label: '更多服务', icon: '⋯', bg: 'linear-gradient(135deg, #F0F0F5, #E0E0E8)', route: '/pages/apply/index' }
];

const HomePage: React.FC = () => {
  const { user, certificate, isLoggedIn, login, setCertificate, todos, markTodoRead, refreshUnreadCount } = useAppStore();
  const [userInfo, setUserInfo] = useState<User | null>(user);
  const [certInfo, setCertInfo] = useState<CACertificate | null>(certificate);
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [noticeList, setNoticeList] = useState<Notice[]>([]);
  const [stats, setStats] = useState({ total: 0, reviewing: 0, approved: 0, rejected: 0, pendingSign: 0 });
  const [loading, setLoading] = useState(true);

  const ensureLogin = useCallback(async () => {
    if (!isLoggedIn || !userInfo) {
      console.log('[Home] 未检测到登录，自动模拟政务平台登录');
      try {
        const u = await loginWithGov('mock_code_' + Date.now());
        login(u);
        setUserInfo(u);
      } catch (err: any) {
        console.error('[Home] 自动登录失败:', err);
        setUserInfo(mockUser);
        login(mockUser);
      }
    }
  }, [isLoggedIn, userInfo, login]);

  const loadCert = useCallback(async () => {
    try {
      const cert = await getUserCert();
      setCertInfo(cert);
      setCertificate(cert);
    } catch (err: any) {
      console.error('[Home] 加载CA证书失败:', err);
      setCertInfo(mockCertificate);
      setCertificate(mockCertificate);
    }
  }, [setCertificate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, n, s] = await Promise.all([getTodos(), getNotices(), getStatistics()]);
      setTodoList(t.slice(0, 3));
      setNoticeList(n);
      setStats(s);
    } catch (err: any) {
      console.error('[Home] 加载数据失败:', err);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  const init = useCallback(async () => {
    await ensureLogin();
    await Promise.all([loadCert(), loadData()]);
  }, [ensureLogin, loadCert, loadData]);

  useEffect(() => {
    init();
  }, [init]);

  useDidShow(() => {
    console.log('[Home] useDidShow');
    if (isLoggedIn) {
      loadData();
      loadCert();
    }
  });

  usePullDownRefresh(() => {
    console.log('[Home] 下拉刷新');
    loadData();
  });

  const handleQuickClick = (entry: QuickEntry) => {
    console.log('[Home] 点击快捷入口:', entry.key);
    Taro.navigateTo({ url: entry.route }).catch(err => {
      console.error('[Home] 路由跳转失败:', err);
      if (entry.key === 'license') {
        Taro.navigateTo({ url: '/pages/certificate/index' });
      } else {
        Taro.switchTab({ url: '/pages/apply/index' });
      }
    });
  };

  const handleReadTodo = (id: string) => {
    markTodoRead(id);
    const updated = todoList.map(t => t.id === id ? { ...t, isRead: true } : t);
    setTodoList(updated);
  };

  const handleCertClick = () => {
    Taro.navigateTo({ url: '/pages/certificate/index' }).catch(console.error);
  };

  const handleStatClick = (type: string) => {
    console.log('[Home] 点击统计:', type);
    Taro.switchTab({ url: '/pages/tracking/index' });
  };

  const getCertDaysLeft = () => {
    if (!certInfo) return 0;
    const end = dayjs(certInfo.validTo);
    return end.diff(dayjs(), 'day');
  };

  const daysLeft = getCertDaysLeft();

  return (
    <PageContainer scroll padding safeBottom>
      {/* 顶部用户信息横幅 */}
      <View className={styles.banner}>
        <View className={styles.userRow}>
          <View className={styles.avatar}>
            <Text>{userInfo?.name?.slice(0, 1) || '用'}</Text>
          </View>
          <View className={styles.userInfo}>
            <View className={styles.userName}>
              <Text>{userInfo?.name || '政务用户'}</Text>
              <View className={styles.authBadge}>
                <Text>L{userInfo?.authLevel?.slice(1)}实名认证</Text>
              </View>
            </View>
            <Text className={styles.userType}>
              {userInfo?.userType === 'enterprise'
                ? `企业用户 · ${userInfo?.enterpriseName || ''}`
                : '个体工商户/个人申请人'}
              {userInfo?.idCardNo && ` · ${userInfo.idCardNo}`}
            </Text>
          </View>
        </View>

        <View className={styles.certStatus} onClick={handleCertClick}>
          <View className={styles.certInfo}>
            <Text className={styles.certIcon}>🔐</Text>
            <View>
              <Text className={styles.certText}>CA数字证书 · {certInfo?.certType || 'SM2'}国密算法</Text>
              <Text className={styles.certDate}>有效期至 {certInfo?.validTo?.slice(0, 10) || '--'}{daysLeft > 0 && `（剩余${daysLeft}天）`}</Text>
            </View>
          </View>
          <View className={styles.certActive}>
            <Text>{certInfo?.status === 'active' ? '证书有效' : '已失效'}</Text>
          </View>
        </View>
      </View>

      {/* 快捷入口 */}
      <View className={styles.quickGrid}>
        {quickEntries.map(entry => (
          <View key={entry.key} className={styles.quickItem} onClick={() => handleQuickClick(entry)}>
            <View className={styles.quickIcon} style={{ background: entry.bg }}>
              <Text>{entry.icon}</Text>
              {entry.badge && entry.badge > 0 && (
                <View className={styles.quickBadge}>
                  <Text>{entry.badge > 99 ? '99+' : entry.badge}</Text>
                </View>
              )}
            </View>
            <Text className={styles.quickLabel}>{entry.label}</Text>
          </View>
        ))}
      </View>

      {/* 统计卡片 */}
      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>办理概览</Text>
        <Text className={styles.sectionMore} onClick={() => handleStatClick('all')}>全部记录 ›</Text>
      </View>
      <View className={styles.statsGrid}>
        <View className={styles.statsCard} style={{ borderLeft: '6rpx solid #FF7D00' }} onClick={() => handleStatClick('reviewing')}>
          <Text className={styles.statsLabel}>审核中</Text>
          <Text className={styles.statsValue} style={{ color: '#FF7D00' }}>{stats.reviewing}</Text>
          <Text className={styles.statsHint}>正在办理的业务</Text>
        </View>
        <View className={styles.statsCard} style={{ borderLeft: '6rpx solid #1E5DAB' }} onClick={() => handleStatClick('pending')}>
          <Text className={styles.statsLabel}>待签署</Text>
          <Text className={styles.statsValue} style={{ color: '#1E5DAB' }}>{stats.pendingSign}</Text>
          <Text className={styles.statsHint}>需电子签名文件</Text>
        </View>
        <View className={styles.statsCard} style={{ borderLeft: '6rpx solid #00B42A' }} onClick={() => handleStatClick('approved')}>
          <Text className={styles.statsLabel}>已通过</Text>
          <Text className={styles.statsValue} style={{ color: '#00B42A' }}>{stats.approved}</Text>
          <Text className={styles.statsHint}>审批完成的业务</Text>
        </View>
        <View className={styles.statsCard} style={{ borderLeft: '6rpx solid #F53F3F' }} onClick={() => handleStatClick('rejected')}>
          <Text className={styles.statsLabel}>需补正</Text>
          <Text className={styles.statsValue} style={{ color: '#F53F3F' }}>{stats.rejected}</Text>
          <Text className={styles.statsHint}>驳回待重新提交</Text>
        </View>
      </View>

      {/* 待办事项 */}
      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>我的待办</Text>
        <Text className={styles.sectionMore} onClick={() => Taro.switchTab({ url: '/pages/signing/index' })}>全部待办 ›</Text>
      </View>
      <View className={styles.todoList}>
        {todoList.length > 0 ? (
          todoList.map(todo => (
            <TodoItemCard key={todo.id} data={todo} onRead={() => handleReadTodo(todo.id)} />
          ))
        ) : (
          <View className={styles.emptyTip}>
            <Text>暂无待办事项</Text>
          </View>
        )}
      </View>

      {/* 通知公告横向滚动 */}
      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>通知公告</Text>
        <Text className={styles.sectionMore}>查看更多 ›</Text>
      </View>
      <ScrollView scrollX className={styles.noticeScroll}>
        {noticeList.map(notice => (
          <View key={notice.id} className={styles.noticeCard}>
            <View className={styles.noticeHead}>
              <View className={classnames(styles.noticeLevel, notice.level)}>
                <Text>{notice.level === 'urgent' ? '紧急' : notice.level === 'important' ? '重要' : '普通'}</Text>
              </View>
              <Text className={styles.noticeType}>
                {notice.type === 'policy' ? '政策' : notice.type === 'system' ? '系统' : '通知'}
              </Text>
            </View>
            <Text className={styles.noticeTitle}>{notice.title}</Text>
            <Text className={styles.noticeContent}>{notice.content}</Text>
            <View className={styles.noticeFooter}>
              <Text className={styles.noticePublisher}>{notice.publisher}</Text>
              <Text className={styles.noticeDate}>{notice.publishedAt}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 安全保障提示 */}
      <View className={styles.securityBar}>
        <View className={styles.securityItem}>
          <Text className={styles.securityIcon}>🔐</Text>
          <Text className={styles.securityText}>SM2国密加密</Text>
        </View>
        <View className={styles.securityItem}>
          <Text className={styles.securityIcon}>🛡️</Text>
          <Text className={styles.securityText}>CA电子认证</Text>
        </View>
        <View className={styles.securityItem}>
          <Text className={styles.securityIcon}>⏰</Text>
          <Text className={styles.securityText}>TSA时间戳</Text>
        </View>
        <View className={styles.securityItem}>
          <Text className={styles.securityIcon}>☁️</Text>
          <Text className={styles.securityText}>政务云存储</Text>
        </View>
      </View>
    </PageContainer>
  );
};

export default HomePage;
