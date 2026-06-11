import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { PageHeader } from '@/components';
import { getCurrentUser, logout } from '@/services/auth';
import { getInsuranceInfo, getPensionBalance, getMedicalBalance } from '@/services/user';
import { getMatterStats } from '@/services/matter';
import { getMessageStats } from '@/services/message';
import { getUserBehaviorAnalysis } from '@/services/recommend';
import type { UserInfo, InsuranceInfo } from '@/types/user';
import { maskIdCard, maskPhone, formatMoney } from '@/utils/format';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo | null>(null);
  const [pensionBalance, setPensionBalance] = useState<any>(null);
  const [medicalBalance, setMedicalBalance] = useState<any>(null);
  const [matterStats, setMatterStats] = useState<any>(null);
  const [messageStats, setMessageStats] = useState<any>(null);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [user, insurance, pension, medical, matter, message, behavior] = await Promise.all([
        getCurrentUser(),
        getInsuranceInfo(),
        getPensionBalance(),
        getMedicalBalance(),
        getMatterStats(),
        getMessageStats(),
        getUserBehaviorAnalysis()
      ]);
      setUserInfo(user);
      setInsuranceInfo(insurance);
      setPensionBalance(pension);
      setMedicalBalance(medical);
      setMatterStats(matter);
      setMessageStats(message);
      setBehaviorAnalysis(behavior);
    } catch (error) {
      console.error('[MinePage] 加载数据失败', error);
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

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          Taro.showToast({ title: '已退出登录', icon: 'success' });
          setTimeout(() => {
            Taro.reLaunch({ url: '/pages/login/index' });
          }, 1000);
        }
      }
    });
  };

  const handleEditProfile = () => {
    Taro.navigateTo({ url: '/pages/mine/profile' });
  };

  const handleAuth = () => {
    Taro.navigateTo({ url: '/pages/auth/realname' });
  };

  const handleFaceAuth = () => {
    Taro.navigateTo({ url: '/pages/auth/face' });
  };

  const handleFamilyMembers = () => {
    Taro.navigateTo({ url: '/pages/mine/family' });
  };

  const handlePaymentRecords = () => {
    Taro.navigateTo({ url: '/pages/mine/payments' });
  };

  const handleSettings = () => {
    Taro.navigateTo({ url: '/pages/mine/settings' });
  };

  const handleAbout = () => {
    Taro.navigateTo({ url: '/pages/mine/about' });
  };

  const handleFeedback = () => {
    Taro.navigateTo({ url: '/pages/mine/feedback' });
  };

  const handleMenuItemClick = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  const menuGroups = [
    {
      title: '人社服务',
      items: [
        { icon: '📋', name: '我的办件', path: '/pages/service/index' },
        { icon: '📄', name: '我的证照', path: '/pages/license/index' },
        { icon: '💰', name: '缴费记录', path: '/pages/mine/payments', onClick: handlePaymentRecords },
        { icon: '👨‍👩‍👧‍👦', name: '家庭成员', path: '/pages/mine/family', onClick: handleFamilyMembers }
      ]
    },
    {
      title: '账号安全',
      items: [
        { icon: '🔐', name: '实名认证', path: '/pages/auth/realname', onClick: handleAuth },
        { icon: '😊', name: '人脸核验', path: '/pages/auth/face', onClick: handleFaceAuth },
        { icon: '⚙️', name: '账号设置', path: '/pages/mine/settings', onClick: handleSettings }
      ]
    },
    {
      title: '帮助中心',
      items: [
        { icon: '❓', name: '常见问题', path: '/pages/mine/help' },
        { icon: '💬', name: '意见反馈', path: '/pages/mine/feedback', onClick: handleFeedback },
        { icon: 'ℹ️', name: '关于我们', path: '/pages/mine/about', onClick: handleAbout }
      ]
    }
  ];

  const quickStats = [
    { icon: '📋', name: '办件', value: matterStats?.total || 0, color: '#1890FF', path: '/pages/service/index' },
    { icon: '📄', name: '证照', value: 5, color: '#52C41A', path: '/pages/license/index' },
    { icon: '🔔', name: '消息', value: messageStats?.unread || 0, color: '#FA8C16', path: '/pages/message/index' },
    { icon: '💡', name: '推荐', value: 6, color: '#722ED1', path: '/pages/home/index' }
  ];

  return (
    <View className={styles.page}>
      <PageHeader
        title="个人中心"
        subtitle="我的人社 贴心服务"
      />

      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        <View className={styles.userCard}>
          <View className={styles.userInfo} onClick={handleEditProfile}>
            <View className={styles.avatar}>
              <Text className={styles.avatarText}>{userInfo?.name?.charAt(0) || '用'}</Text>
            </View>
            <View className={styles.userDetail}>
              <View className={styles.userNameRow}>
                <Text className={styles.userName}>{userInfo?.name || '游客'}</Text>
                {userInfo?.realNameVerified && (
                  <View className={styles.verifiedBadge}>
                    <Text className={styles.verifiedIcon}>✓</Text>
                    <Text className={styles.verifiedText}>已实名</Text>
                  </View>
                )}
                {userInfo?.faceVerified && (
                  <View className={styles.faceBadge}>
                    <Text className={styles.faceIcon}>😊</Text>
                    <Text className={styles.faceText}>已刷脸</Text>
                  </View>
                )}
              </View>
              <Text className={styles.userIdCard}>
                {userInfo?.idCard ? maskIdCard(userInfo.idCard) : '请完成实名认证'}
              </Text>
              <View className={styles.userTags}>
                {behaviorAnalysis?.recommendedTags?.slice(0, 3).map((tag: string, i: number) => (
                  <View key={i} className={styles.userTag}>
                    <Text className={styles.userTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.editBtn}>
              <Text className={styles.editIcon}>›</Text>
            </View>
          </View>

          <View className={styles.levelInfo}>
            <View className={styles.levelRow}>
              <Text className={styles.levelLabel}>用户等级</Text>
              <Text className={styles.levelValue}>{userInfo?.level || 'Lv.1 新人'}</Text>
            </View>
            <View className={styles.levelBar}>
              <View className={styles.levelProgress} style={{ width: `${userInfo?.levelProgress || 35}%` }} />
            </View>
            <Text className={styles.levelTip}>再办理2项业务即可升级到Lv.2</Text>
          </View>
        </View>

        <View className={styles.insuranceCard}>
          <View className={styles.insuranceHeader}>
            <Text className={styles.insuranceTitle}>参保信息</Text>
            <View className={styles.insuranceStatus}>
              <View className={styles.statusDot} />
              <Text className={styles.statusText}>正常参保</Text>
            </View>
          </View>
          <View className={styles.insuranceGrid}>
            <View className={styles.insuranceItem}>
              <View className={styles.insuranceIcon} style={{ background: 'linear-gradient(135deg, #1890FF, #40A9FF)' }}>
                <Text className={styles.insuranceIconText}>老</Text>
              </View>
              <Text className={styles.insuranceName}>养老保险</Text>
              <Text className={styles.insuranceMonths}>{insuranceInfo?.pension?.months || 0}个月</Text>
            </View>
            <View className={styles.insuranceItem}>
              <View className={styles.insuranceIcon} style={{ background: 'linear-gradient(135deg, #52C41A, #73D13D)' }}>
                <Text className={styles.insuranceIconText}>医</Text>
              </View>
              <Text className={styles.insuranceName}>医疗保险</Text>
              <Text className={styles.insuranceMonths}>{insuranceInfo?.medical?.months || 0}个月</Text>
            </View>
            <View className={styles.insuranceItem}>
              <View className={styles.insuranceIcon} style={{ background: 'linear-gradient(135deg, #FA8C16, #FFA940)' }}>
                <Text className={styles.insuranceIconText}>失</Text>
              </View>
              <Text className={styles.insuranceName}>失业保险</Text>
              <Text className={styles.insuranceMonths}>{insuranceInfo?.unemployment?.months || 0}个月</Text>
            </View>
            <View className={styles.insuranceItem}>
              <View className={styles.insuranceIcon} style={{ background: 'linear-gradient(135deg, #722ED1, #9254DE)' }}>
                <Text className={styles.insuranceIconText}>工</Text>
              </View>
              <Text className={styles.insuranceName}>工伤保险</Text>
              <Text className={styles.insuranceMonths}>{insuranceInfo?.employmentInjury?.months || 0}个月</Text>
            </View>
          </View>
        </View>

        <View className={styles.balanceCard}>
          <View className={styles.balanceHeader}>
            <Text className={styles.balanceTitle}>账户余额</Text>
            <Text className={styles.balanceMore} onClick={handlePaymentRecords}>明细 ›</Text>
          </View>
          <View className={styles.balanceRow}>
            <View className={styles.balanceItem}>
              <Text className={styles.balanceLabel}>养老个人账户</Text>
              <Text className={styles.balanceValue}>¥{formatMoney(pensionBalance?.personalAccount || 0)}</Text>
              <Text className={styles.balanceSub}>累计缴费 {pensionBalance?.totalMonths || 0} 个月</Text>
            </View>
            <View className={styles.balanceDivider} />
            <View className={styles.balanceItem}>
              <Text className={styles.balanceLabel}>医保个人账户</Text>
              <Text className={styles.balanceValue}>¥{formatMoney(medicalBalance?.personalAccount || 0)}</Text>
              <Text className={styles.balanceSub}>本年已消费 ¥{formatMoney(medicalBalance?.thisYearExpense || 0)}</Text>
            </View>
          </View>
        </View>

        <View className={styles.quickStats}>
          {quickStats.map((stat, index) => (
            <View 
              key={index} 
              className={styles.quickStatItem}
              onClick={() => handleMenuItemClick(stat.path)}
            >
              <Text className={styles.quickStatIcon}>{stat.icon}</Text>
              <Text className={styles.quickStatValue} style={{ color: stat.color }}>{stat.value}</Text>
              <Text className={styles.quickStatName}>{stat.name}</Text>
            </View>
          ))}
        </View>

        {behaviorAnalysis && behaviorAnalysis.serviceNeeds && behaviorAnalysis.serviceNeeds.length > 0 && (
          <View className={styles.needsCard}>
            <View className={styles.needsHeader}>
              <Text className={styles.needsTitle}>
                <Text className={styles.needsIcon}>💡</Text>
                智能服务推荐
              </Text>
              <Text className={styles.needsSub}>基于用户画像分析</Text>
            </View>
            <View className={styles.needsList}>
              {behaviorAnalysis.serviceNeeds.map((need: any, index: number) => (
                <View key={index} className={styles.needsItem}>
                  <View className={`${styles.needsUrgency} ${need.urgency === 'high' ? styles.needsUrgencyHigh : styles.needsUrgencyMedium}`}>
                    {need.urgency === 'high' ? '紧急' : '建议'}
                  </View>
                  <View className={styles.needsContent}>
                    <Text className={styles.needsName}>{need.serviceType}</Text>
                    <Text className={styles.needsReason}>{need.reason}</Text>
                    <Text className={styles.needsTime}>建议办理时间：{need.suggestedTime}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.menuSection}>
          {menuGroups.map((group, groupIndex) => (
            <View key={groupIndex} className={styles.menuGroup}>
              <Text className={styles.menuGroupTitle}>{group.title}</Text>
              <View className={styles.menuGroupContent}>
                {group.items.map((item, itemIndex) => (
                  <View
                    key={itemIndex}
                    className={styles.menuItem}
                    onClick={() => item.onClick ? item.onClick() : handleMenuItemClick(item.path)}
                  >
                    <View className={styles.menuItemLeft}>
                      <Text className={styles.menuItemIcon}>{item.icon}</Text>
                      <Text className={styles.menuItemName}>{item.name}</Text>
                    </View>
                    <Text className={styles.menuItemArrow}>›</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View className={styles.logoutBtn} onClick={handleLogout}>
          <Text className={styles.logoutText}>退出登录</Text>
        </View>

        <View className={styles.footer}>
          <Text className={styles.footerText}>江苏人社 v1.0.0</Text>
          <Text className={styles.footerSubtext}>© 2026 江苏省人力资源和社会保障厅</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default MinePage;
