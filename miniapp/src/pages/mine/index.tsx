import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import AccessibilityFab from '../../components/AccessibilityFab';
import TagCloud from '../../components/TagCloud';
import { useUserStore } from '../../store/userStore';
import { useAppStore } from '../../store/appStore';
import { mockApplications, mockCertificates } from '../../data/mockApplications';
import classnames from 'classnames';

type AppTabType = 'processing' | 'completed' | 'pending';

const appTabConfig: Record<AppTabType, { label: string; filter: (app: typeof mockApplications[0]) => boolean }> = {
  processing: {
    label: '进行中',
    filter: (app) => ['submitted', 'reviewing', 'supplementing', 'processing', 'approved'].includes(app.status)
  },
  completed: {
    label: '已完成',
    filter: (app) => app.status === 'completed'
  },
  pending: {
    label: '待评价',
    filter: (app) => app.status === 'completed' && !app.feedback?.done
  }
};

const tools = [
  { key: 'proof', icon: '📄', name: '证明打印', badge: null },
  { key: 'notify', icon: '🔔', name: '消息通知', badge: 5 },
  { key: 'feedback', icon: '📝', name: '意见反馈', badge: null },
  { key: 'favorite', icon: '⭐', name: '我的收藏', badge: null },
  { key: 'history', icon: '👁️', name: '浏览历史', badge: null },
  { key: 'offline', icon: '📴', name: '离线服务', badge: null },
  { key: 'help', icon: '❓', name: '使用帮助', badge: null },
  { key: 'service', icon: '🎧', name: '在线客服', badge: null },
  { key: 'invite', icon: '📤', name: '邀请家人', badge: null },
  { key: 'about', icon: 'ℹ️', name: '关于我们', badge: null }
];

const MyPage: React.FC = () => {
  const { profile, reminders, loadProfile, totalServices } = useUserStore();
  const { accessibility, offlineMode, setOfflineMode, speak } = useAppStore();
  const [appTab, setAppTab] = useState<AppTabType>('processing');

  usePullDownRefresh(() => {
    loadProfile().finally(() => Taro.stopPullDownRefresh());
  });

  const displayApplications = useMemo(() => {
    return mockApplications.filter(appTabConfig[appTab].filter).slice(0, 4);
  }, [appTab]);

  const pendingCount = useMemo(() =>
    mockApplications.filter(appTabConfig.pending.filter).length
  , []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} className={classnames(styles.star, i < rating && styles.filled)}>★</Text>
    ));
  };

  const handleNavigate = useCallback((url: string) => {
    Taro.navigateTo({ url });
  }, []);

  const handleProfileClick = () => {
    speak('查看完整数字画像');
    handleNavigate('/pages/profile-setting/index');
  };

  const handleAppClick = (appId: string) => {
    speak('查看办件详情');
    handleNavigate(`/pages/application-detail/index?id=${appId}`);
  };

  const handleFeedbackClick = (appId: string, serviceName: string) => {
    speak('进入服务评价页面');
    handleNavigate(`/pages/feedback/index?appId=${appId}&service=${encodeURIComponent(serviceName)}`);
  };

  const handleCertClick = (certId: string, certName: string) => {
    speak(`查看${certName}`);
    handleNavigate(`/pages/certificate-list/index?focus=${certId}`);
  };

  const handleFamilyClick = (name: string, relation: string) => {
    speak(`切换到代办模式，为${name}${relation}办理`);
    Taro.showToast({ title: `已切换为${name}代办模式`, icon: 'none' });
  };

  const handleToolClick = (tool: typeof tools[0]) => {
    speak(tool.name);
    switch (tool.key) {
      case 'proof':
        handleNavigate('/pages/certificate-list/index');
        break;
      case 'feedback':
        handleNavigate('/pages/feedback/index');
        break;
      case 'offline':
        setOfflineMode(!offlineMode);
        break;
      case 'notify':
        Taro.showToast({ title: '消息中心即将开放', icon: 'none' });
        break;
      default:
        Taro.showToast({ title: `${tool.name}即将开放`, icon: 'none' });
    }
  };

  const idCardMask = profile?.idCard
    ? `${profile.idCard.substring(0, 6)}********${profile.idCard.substring(14)}`
    : '';

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.headerGradient} />

      <View className={styles.contentArea}>
        <View className={styles.userCard}>
          <View className={styles.userInfoRow}>
            <View className={styles.avatarBox}>
              <Image
                className={styles.avatar}
                src={profile?.avatar || 'https://picsum.photos/id/64/200/200'}
                mode="aspectFill"
                onError={(e) => console.error('[Mine] avatar error:', e)}
              />
              <View className={styles.verifiedBadge}>✓</View>
            </View>
            <View className={styles.userText}>
              <View className={styles.userName}>
                <Text>{profile?.name || '市民朋友'}</Text>
                <Text className={styles.genderIcon}>
                  {profile?.gender === 'male' ? '♂️' : profile?.gender === 'female' ? '♀️' : ''}
                </Text>
              </View>
              <Text className={styles.userId}>身份证：{idCardMask}</Text>
              <View className={styles.userLocation}>
                <Text>📍 {profile?.district || '郑州市'} · 实名认证</Text>
              </View>
            </View>
            <View className={styles.userActions}>
              <View className={styles.actionBtn} onClick={handleProfileClick}>
                <Text>编辑</Text>
              </View>
            </View>
          </View>

          <View className={styles.statsRow}>
            <View className={styles.statCell}>
              <Text className={styles.statValue}>{mockApplications.length}</Text>
              <Text className={styles.statLabel}>办件数</Text>
            </View>
            <View className={styles.statCell}>
              <Text className={styles.statValue}>{mockCertificates.length}</Text>
              <Text className={styles.statLabel}>证照数</Text>
            </View>
            <View className={styles.statCell}>
              <Text className={styles.statValue}>{profile?.tags.length || 0}</Text>
              <Text className={styles.statLabel}>画像标签</Text>
            </View>
            <View className={styles.statCell}>
              <Text className={styles.statValue}>{Math.round((profile?.successRate || 0) * 100)}%</Text>
              <Text className={styles.statLabel}>成功率</Text>
            </View>
          </View>
        </View>

        <View className={styles.cardSection} onClick={handleProfileClick}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🎯</Text>
              我的数字画像
            </Text>
            <Text className={styles.moreLink}>查看详情 →</Text>
          </View>
          <View className={styles.profileCard}>
            <View className={styles.profileRow}>
              <View className={styles.profileInfo}>
                <View className={styles.profileIcon}>🧬</View>
                <View className={styles.profileText}>
                  <Text className={styles.profileTitle}>
                    已生成 {profile?.tags.length || 0} 个画像标签
                  </Text>
                  <Text className={styles.profileSub}>
                    覆盖人口属性、行为特征、服务偏好、人生事件4个维度
                  </Text>
                </View>
              </View>
            </View>
            <View className={styles.tagPreview}>
              {profile?.tags.slice(0, 8).map((tag, i) => (
                <Text
                  key={tag.id}
                  className={classnames(styles.miniTag, {
                    [styles.tagB]: tag.category === 'behavior',
                    [styles.tagP]: tag.category === 'preference',
                    [styles.tagL]: tag.category === 'life-event',
                  })}
                >
                  {tag.name}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.cardSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📋</Text>
              我的办件
            </Text>
            <Text className={styles.moreLink}>全部办件 →</Text>
          </View>

          <View className={styles.applicationTabs}>
            {(Object.keys(appTabConfig) as AppTabType[]).map(tab => (
              <View
                key={tab}
                className={classnames(styles.tabItem, appTab === tab && styles.active)}
                onClick={() => setAppTab(tab)}
              >
                <Text>{appTabConfig[tab].label}</Text>
                {tab === 'pending' && pendingCount > 0 && (
                  <View className={styles.tabBadge}>{pendingCount}</View>
                )}
              </View>
            ))}
          </View>

          {displayApplications.length > 0 ? (
            <View>
              {displayApplications.map(app => (
                <View key={app.id} className={styles.appItem} onClick={() => handleAppClick(app.id)}>
                  <View className={styles.appRow}>
                    <Text className={styles.appName}>{app.serviceName}</Text>
                    <View className={classnames(styles.appStatus, styles[app.status] || styles.processing)}>
                      <Text>{app.statusText}</Text>
                    </View>
                  </View>
                  <View className={styles.appMeta}>
                    <Text className={styles.appDept}>
                      {app.dept} · {app.applyTime.split(' ')[0]}
                    </Text>
                    {appTab === 'completed' && (
                      <View className={styles.appFeedback}>
                        {app.feedback?.done ? (
                          <View className={styles.starsRow}>
                            {renderStars(app.feedback.rating)}
                          </View>
                        ) : (
                          <View
                            className={styles.feedbackBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeedbackClick(app.id, app.serviceName);
                            }}
                          >
                            <Text>去评价</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ padding: '48rpx 0', textAlign: 'center', color: '#86909C', fontSize: '24rpx' }}>
              <Text>暂无{tab === 'completed' ? '已完成' : tab === 'pending' ? '待评价' : '进行中'}办件</Text>
            </View>
          )}
        </View>

        <View className={styles.cardSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🪪</Text>
              我的证照
            </Text>
            <Text className={styles.moreLink} onClick={() => handleNavigate('/pages/certificate-list/index')}>
              全部证照 →
            </Text>
          </View>
          <View className={styles.certGrid}>
            {mockCertificates.slice(0, 8).map(cert => (
              <View
                key={cert.id}
                className={styles.certItem}
                onClick={() => handleCertClick(cert.id, cert.name)}
              >
                <View
                  className={styles.certIcon}
                  style={{
                    backgroundColor: cert.type === 'identity' ? '#E8F0FC' :
                      cert.type === 'social' ? '#E6F7EF' :
                      cert.type === 'housing' ? '#FFF4E6' :
                      cert.type === 'medical' ? '#FFECE8' :
                      cert.type === 'property' ? '#F0F0FF' : '#F5F6F7',
                    color: cert.type === 'identity' ? '#1E4FA5' :
                      cert.type === 'social' ? '#00A870' :
                      cert.type === 'housing' ? '#FF8A00' :
                      cert.type === 'medical' ? '#F53F3F' :
                      cert.type === 'property' ? '#722ED1' : '#86909C'
                  }}
                >
                  <Text>
                    {cert.type === 'identity' ? '🪪' :
                      cert.type === 'social' ? '🛡️' :
                      cert.type === 'housing' ? '🏠' :
                      cert.type === 'medical' ? '💊' :
                      cert.type === 'property' ? '📜' : '📄'}
                  </Text>
                  {cert.cachedOffline && <View className={styles.certOffline}>✓</View>}
                </View>
                <Text className={styles.certName}>{cert.name}</Text>
                <Text className={classnames(styles.certStatus, styles[cert.status])}>
                  {cert.status === 'valid' ? '● 有效' : cert.status === 'expiring' ? '○ 即将到期' : '✕ 已过期'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.cardSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🛠️</Text>
              常用工具
            </Text>
          </View>
          <View className={styles.toolGrid}>
            {tools.map(tool => (
              <View
                key={tool.key}
                className={styles.toolItem}
                onClick={() => handleToolClick(tool)}
              >
                <View className={styles.toolIcon}>
                  <Text>{tool.icon}</Text>
                  {tool.badge && <View className={styles.toolBadge}>{tool.badge}</View>}
                </View>
                <Text className={styles.toolName}>{tool.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.familySection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>👨‍👩‍👧‍👦</Text>
              家庭成员代办
            </Text>
            <Text className={styles.moreLink}>添加成员 →</Text>
          </View>
          <View className={styles.familyList}>
            {profile?.familyMembers?.map(member => (
              <View
                key={member.id}
                className={styles.familyItem}
                onClick={() => handleFamilyClick(member.name, member.relation)}
              >
                <View className={styles.familyAvatar}>
                  <Text>
                    {member.relation === '配偶' ? '👩' :
                      member.relation === '子女' ? '👶' :
                      member.relation === '父亲' ? '👴' :
                      member.relation === '母亲' ? '👵' : '🧑'}
                  </Text>
                </View>
                <View className={styles.familyInfo}>
                  <View className={styles.familyName}>
                    <Text>{member.name}</Text>
                    <Text className={styles.relationTag}>{member.relation}</Text>
                  </View>
                  <Text className={styles.familySub}>
                    {member.idCard.substring(0, 6)}****{member.idCard.substring(14)} · 可代办
                  </Text>
                </View>
                <View
                  className={styles.familyAction}
                  onClick={(e) => { e.stopPropagation(); handleFamilyClick(member.name, member.relation); }}
                >
                  <Text>代办</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.settingsList}>
          <View className={styles.settingItem} onClick={() => handleNavigate('/pages/accessibility/index')}>
            <View className={styles.settingIcon} style={{ background: '#FFECE8', color: '#F53F3F' }}>
              <Text>♿</Text>
            </View>
            <Text className={styles.setName}>无障碍设置</Text>
            <View
              className={classnames(styles.settingValueTag, accessibility.enabled && styles.on, !accessibility.enabled && styles.off)}
            >
              <Text>{accessibility.enabled ? '已启用' : '未启用'}</Text>
            </View>
            <Text className={styles.settingArrow}>›</Text>
          </View>

          <View className={styles.settingItem} onClick={() => setOfflineMode(!offlineMode)}>
            <View className={styles.settingIcon} style={{ background: '#E6F7EF', color: '#00A870' }}>
              <Text>📴</Text>
            </View>
            <Text className={styles.setName}>离线模式</Text>
            <View
              className={classnames(styles.settingValueTag, offlineMode && styles.on, !offlineMode && styles.off)}
            >
              <Text>{offlineMode ? '已开启' : '已关闭'}</Text>
            </View>
            <Text className={styles.settingArrow}>{offlineMode ? '✓' : '›'}</Text>
          </View>

          <View className={styles.settingItem}>
            <View className={styles.settingIcon} style={{ background: '#E8F0FC', color: '#1E4FA5' }}>
              <Text>🔒</Text>
            </View>
            <Text className={styles.setName}>隐私设置</Text>
            <Text className={styles.setValue}>画像数据仅本人可见</Text>
            <Text className={styles.settingArrow}>›</Text>
          </View>

          <View className={styles.settingItem}>
            <View className={styles.settingIcon} style={{ background: '#F0F0FF', color: '#722ED1' }}>
              <Text>ℹ️</Text>
            </View>
            <Text className={styles.setName}>版本信息</Text>
            <Text className={styles.setValue}>v2.1.0 · 郑州市大数据局</Text>
            <Text className={styles.settingArrow}>›</Text>
          </View>
        </View>

        <View className={styles.bottomSpace} />
      </View>

      <AccessibilityFab />
    </ScrollView>
  );
};

export default MyPage;
