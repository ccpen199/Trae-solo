import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '../../store/userStore';
import { useAppStore } from '../../store/appStore';
import ReminderCard from '../../components/ReminderCard';
import TagCloud from '../../components/TagCloud';
import SearchBar from '../../components/SearchBar';
import ServiceCard from '../../components/ServiceCard';
import AccessibilityFab from '../../components/AccessibilityFab';
import { mockServiceCategories } from '../../data/mockServices';
import { mockPolicies } from '../../data/mockPolicies';
import { mockDashboard } from '../../data/mockApplications';
import classnames from 'classnames';

const oneStopServices = [
  { icon: '👶', name: '新生儿出生一件事', desc: '落户+医保+参保 一次办好' },
  { icon: '🏠', name: '二手房过户一件事', desc: '网签+缴税+登记 联办' },
  { icon: '🏢', name: '企业开办一件事', desc: '工商+公章+税务 0.5天' },
  { icon: '👴', name: '退休一件事', desc: '待遇+医保+认证 打包办' }
];

function getGreeting(): { text: string; icon: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { text: '夜深了，注意休息', icon: '🌙' };
  if (hour < 9) return { text: '早上好', icon: '🌅' };
  if (hour < 12) return { text: '上午好', icon: '☀️' };
  if (hour < 14) return { text: '中午好', icon: '🌤️' };
  if (hour < 18) return { text: '下午好', icon: '🌞' };
  if (hour < 22) return { text: '晚上好', icon: '🌆' };
  return { text: '夜深了，注意休息', icon: '🌙' };
}

const HomePage: React.FC = () => {
  const { profile, reminders, recommendServices, recentServices, isLoading, loadProfile } = useUserStore();
  const { speak, accessibility, offlineMode } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[HomePage] useDidShow, profile loaded:', !!profile);
    if (profile && accessibility.autoReadContent) {
      speak(`欢迎回到郑好办，您有${reminders.length}项待办提醒，推荐服务已根据您的画像更新`);
    }
  });

  usePullDownRefresh(() => {
    console.log('[HomePage] pull down refresh');
    setRefreshing(true);
    loadProfile().finally(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    });
  });

  const greeting = useMemo(() => getGreeting(), []);
  const displayTags = useMemo(() => profile?.tags.slice(0, 8) || [], [profile]);
  const displayReminders = useMemo(() => reminders.slice(0, 5), [reminders]);
  const topServices = useMemo(() => recommendServices.slice(0, 8), [recommendServices]);
  const matchedPolicies = useMemo(() =>
    mockPolicies.filter(p => p.matchScore && p.matchScore >= 0.7).slice(0, 2)
  , [mockPolicies]);

  const handleQuickAction = useCallback((action: string) => {
    const actionMap: Record<string, string> = {
      scan: '扫一扫功能',
      health: '健康码',
      payment: '生活缴费',
      transport: '交通出行',
      social: '电子社保卡',
      medical: '医保电子凭证'
    };
    speak(actionMap[action] || action);
    Taro.showToast({ title: `${actionMap[action]}即将打开`, icon: 'none' });
  }, [speak]);

  const handleProfileClick = () => {
    speak('查看我的完整数字画像');
    Taro.navigateTo({ url: '/pages/profile-setting/index' });
  };

  const handleServiceClick = (service: { id: string; name: string }) => {
    Taro.navigateTo({ url: `/pages/service-detail/index?id=${service.id}` });
  };

  const handlePolicyClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/policy-detail/index?id=${id}` });
  };

  const handleOneStopClick = (name: string) => {
    speak(name);
    Taro.showToast({ title: `进入${name}办理`, icon: 'none' });
  };

  const handleChatClick = () => {
    Taro.switchTab({ url: '/pages/knowledge/index' });
  };

  if (isLoading && !profile) {
    return (
      <View className={styles.loadingView}>
        <View className={styles.spinner} />
        <Text className={styles.loadingText}>正在加载个性化推荐...</Text>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <View className={styles.headerGradient} />

      <View className={styles.headerContent}>
        <View className={styles.userRow}>
          <View className={styles.userInfo}>
            <Image
              className={styles.avatar}
              src={profile?.avatar || 'https://picsum.photos/id/64/200/200'}
              mode="aspectFill"
              onError={(e) => console.error('[HomePage] avatar load error:', e)}
            />
            <View className={styles.userText}>
              <Text className={styles.greeting}>
                {greeting.icon} {greeting.text}，{profile?.name || '市民朋友'}
              </Text>
              <View className={styles.subInfo}>
                <View className={styles.locationBadge}>
                  <Text>📍 {profile?.district || '郑州市'}</Text>
                </View>
                <Text className={styles.subText}>
                  已办 {profile?.totalServices || 0} 件 · 好评率 {Math.round((profile?.successRate || 0) * 100)}%
                </Text>
              </View>
            </View>
          </View>

          <View className={styles.headerActions}>
            <View className={styles.actionIcon} onClick={() => speak('消息中心，您有新通知')}>
              <Text>🔔</Text>
              {displayReminders.length > 0 && <View className={styles.badgeDot} />}
            </View>
            <View className={styles.actionIcon} onClick={handleChatClick}>
              <Text>💬</Text>
            </View>
          </View>
        </View>

        <View className={styles.quickActions}>
          {[
            { key: 'scan', icon: '📷', text: '扫一扫' },
            { key: 'payment', icon: '💳', text: '缴电费' },
            { key: 'social', icon: '🛡️', text: '社保卡' },
            { key: 'medical', icon: '💊', text: '医保码' },
            { key: 'transport', icon: '🚌', text: '公交码' }
          ].map(item => (
            <View
              key={item.key}
              className={styles.quickItem}
              onClick={() => handleQuickAction(item.key)}
            >
              <Text className={styles.quickIcon}>{item.icon}</Text>
              <Text className={styles.quickText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.contentArea}>
        <SearchBar showHotKeywords />

        {offlineMode && (
          <View style={{
            background: '#FFF4E6', padding: '16rpx 24rpx', borderRadius: '12rpx',
            marginBottom: '24rpx', color: '#FF8A00', fontSize: '24rpx'
          }}>
            📴 离线模式 - 已加载社保参保证明等{8}项高频服务
          </View>
        )}

        <ReminderCard reminders={displayReminders} />

        <View className={styles.statsOverview}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{mockDashboard.pendingApplications}</Text>
            <Text className={styles.statLabel}>待办</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{profile?.totalServices || 0}</Text>
            <Text className={styles.statLabel}>已办</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{recentServices.length}</Text>
            <Text className={styles.statLabel}>常用</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{Math.round(mockDashboard.satisfaction)}%</Text>
            <Text className={styles.statLabel}>满意率</Text>
          </View>
        </View>

        <View className={styles.hotServices}>
          <View className={styles.sectionHeader} onClick={() => Taro.switchTab({ url: '/pages/service-hall/index' })}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>⭐</Text>
              为你推荐
              <Text className={styles.sectionBadge}>画像匹配</Text>
            </Text>
            <Text className={styles.moreLink}>全部 →</Text>
          </View>

          <View className={styles.serviceGrid}>
            {topServices.map(service => (
              <View key={service.id} onClick={() => handleServiceClick(service)}>
                <ServiceCard service={service} layout="compact" showFavorite={false} />
              </View>
            ))}
          </View>
        </View>

        {matchedPolicies.length > 0 && (
          <View className={styles.policySection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>📜</Text>
                政策精准推送
                <View className={styles.matchTag}>
                  <Text>匹配画像</Text>
                </View>
              </Text>
              <Text className={styles.moreLink}>更多政策 →</Text>
            </View>

            {matchedPolicies.map(policy => (
              <View
                key={policy.id}
                className={styles.policyCard}
                onClick={() => handlePolicyClick(policy.id)}
              >
                <View className={styles.policyHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text className={styles.policyTitle}>{policy.title}</Text>
                    <Text className={styles.policyDept}>{policy.issuingDepartment}</Text>
                  </View>
                  <View
                    className={styles.matchScore}
                    style={{ ['--score' as any]: `${(policy.matchScore || 0) * 100}%` }}
                  >
                    <View className={styles.matchScoreInner}>
                      <Text className={styles.scoreValue}>{Math.round((policy.matchScore || 0) * 100)}%</Text>
                      <Text className={styles.scoreLabel}>匹配</Text>
                    </View>
                  </View>
                </View>
                <Text className={styles.policySummary}>{policy.summary}</Text>
                <View className={styles.matchReasons}>
                  {policy.matchReasons?.slice(0, 3).map((reason, idx) => (
                    <Text key={idx} className={styles.matchReasonTag}>✓ {reason}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View className={styles.oneStopSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🔗</Text>
              跨系统联办
              <Text className={styles.sectionBadge}>一件事</Text>
            </Text>
            <Text className={styles.moreLink}>查看全部 →</Text>
          </View>

          <View className={styles.oneStopBanner}>
            <View className={styles.bannerContent}>
              <Text className={styles.bannerTitle}>新生儿"出生一件事"</Text>
              <Text className={styles.bannerDesc}>
                出生医学证明 → 户口登记 → 医保参保，三部门联办，不用再跑3次
              </Text>
              <View className={styles.bannerBtn} onClick={() => handleOneStopClick('新生儿出生一件事')}>
                <Text>立即办理 →</Text>
              </View>
            </View>
          </View>

          <View className={styles.oneStopGrid}>
            {oneStopServices.slice(1).map(item => (
              <View
                key={item.name}
                className={styles.oneStopCard}
                onClick={() => handleOneStopClick(item.name)}
              >
                <View className={styles.oneStopIcon}>{item.icon}</View>
                <Text className={styles.oneStopName}>{item.name}</Text>
                <Text className={styles.oneStopDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.hotServices} onClick={handleProfileClick}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🎯</Text>
              我的数字画像
            </Text>
            <Text className={styles.moreLink}>查看详情 →</Text>
          </View>
          <TagCloud tags={displayTags} maxCount={8} />
        </View>
      </View>

      <AccessibilityFab />
    </View>
  );
};

export default HomePage;
