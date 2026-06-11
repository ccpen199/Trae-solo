import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { PageHeader } from '@/components';
import { getRecommendServices, getUserBehaviorAnalysis, refreshRecommend, reportNotInterested } from '@/services/recommend';
import type { RecommendService, UserBehaviorAnalysis, ServiceNeed, BehaviorSummary } from '@/types/recommend';
import { formatDateTime, formatNumber, formatDate } from '@/utils/format';
import styles from './index.module.scss';

const RecommendPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'behavior' | 'recommend'>('recommend');
  const [recommendServices, setRecommendServices] = useState<RecommendService[]>([]);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState<UserBehaviorAnalysis | null>(null);
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [selectedService, setSelectedService] = useState<RecommendService | null>(null);
  const [selectedReason, setSelectedReason] = useState('');

  const notInterestedReasons = [
    '内容不相关',
    '已经办理过',
    '近期不需要',
    '信息有误',
    '其他原因'
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [services, analysis] = await Promise.all([
        getRecommendServices(6),
        getUserBehaviorAnalysis()
      ]);
      setRecommendServices(services);
      setBehaviorAnalysis(analysis);
    } catch (error) {
      console.error('[RecommendPage] 加载数据失败', error);
      Taro.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    loadData();
  });

  const handleRefreshRecommend = async () => {
    setRefreshing(true);
    try {
      const services = await refreshRecommend();
      setRecommendServices(services);
      Taro.showToast({ title: '推荐已更新', icon: 'success' });
    } catch (error) {
      console.error('[RecommendPage] 刷新推荐失败', error);
      Taro.showToast({ title: '刷新失败，请重试', icon: 'none' });
    } finally {
      setRefreshing(false);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    const icons: Record<string, string> = {
      title_evaluation: '🎓',
      pension: '👴',
      professional_qualification: '📜',
      medical: '🏥',
      unemployment: '📋',
      default: '📄'
    };
    return icons[serviceType] || icons.default;
  };

  const getBehaviorIcon = (type: string) => {
    const icons: Record<string, string> = {
      browse: '👀',
      apply: '📝',
      search: '🔍',
      collect: '⭐',
      share: '📤',
      default: '📊'
    };
    return icons[type] || icons.default;
  };

  const getBehaviorName = (type: string) => {
    const names: Record<string, string> = {
      browse: '浏览服务',
      apply: '提交申请',
      search: '搜索服务',
      collect: '收藏服务',
      share: '分享服务'
    };
    return names[type] || type;
  };

  const getUrgencyClass = (urgency: string) => {
    switch (urgency) {
      case 'high': return styles.needUrgencyHigh;
      case 'medium': return styles.needUrgencyMedium;
      case 'low': return styles.needUrgencyLow;
      default: return '';
    }
  };

  const getUrgencyText = (urgency: string) => {
    const texts: Record<string, string> = {
      high: '紧急',
      medium: '建议',
      low: '可选'
    };
    return texts[urgency] || urgency;
  };

  const getBadgeClass = (confidence: number) => {
    if (confidence >= 0.95) return styles.badgeHigh;
    if (confidence >= 0.85) return styles.badgeMedium;
    return styles.badgeNormal;
  };

  const getBadgeText = (confidence: number) => {
    if (confidence >= 0.95) return '强烈推荐';
    if (confidence >= 0.85) return '精准匹配';
    return '为您推荐';
  };

  const getReasonTypeText = (reasonType: string) => {
    const texts: Record<string, string> = {
      user_profile: '👤 基于您的个人信息',
      behavior: '📊 基于您的行为记录',
      hot: '🔥 热门服务推荐',
      similar: '🔄 相似服务推荐',
      location: '📍 基于您的位置'
    };
    return texts[reasonType] || reasonType;
  };

  const getMaxBehaviorCount = () => {
    if (!behaviorAnalysis) return 1;
    return Math.max(...behaviorAnalysis.recentBehaviors.map(b => b.count), 1);
  };

  const handleServiceClick = (service: RecommendService) => {
    Taro.showToast({ title: `即将办理：${service.serviceName}`, icon: 'none' });
  };

  const handleNotInterested = (service: RecommendService) => {
    setSelectedService(service);
    setSelectedReason('');
    setShowNotInterestedModal(true);
  };

  const submitNotInterested = async () => {
    if (!selectedService || !selectedReason) {
      Taro.showToast({ title: '请选择原因', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      const success = await reportNotInterested(selectedService.id, selectedReason);
      if (success) {
        Taro.showToast({ title: '已反馈，将减少此类推荐', icon: 'success' });
        setRecommendServices(prev => prev.filter(s => s.id !== selectedService.id));
        setShowNotInterestedModal(false);
      }
    } catch (error) {
      console.error('[RecommendPage] 反馈失败', error);
      Taro.showToast({ title: '反馈失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNeedAction = (need: ServiceNeed) => {
    Taro.showToast({ title: `即将办理：${need.serviceType}`, icon: 'none' });
  };

  const calculateOverallMatch = () => {
    if (!behaviorAnalysis) return 0;
    const avgScore = recommendServices.reduce((sum, s) => sum + s.userMatchScore, 0) / recommendServices.length;
    return Math.round(avgScore);
  };

  if (loading) {
    return (
      <View className={styles.page}>
        <PageHeader title="智能推荐" subtitle="基于AI的个性化服务推荐" />
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  const overallMatch = calculateOverallMatch();
  const maxBehaviorCount = getMaxBehaviorCount();

  return (
    <View className={styles.page}>
      <PageHeader title="智能推荐" subtitle="基于AI的个性化服务推荐" />

      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        <View className={styles.headerCard}>
          <View className={styles.headerContent}>
            <Text className={styles.headerTitle}>AI 智能推荐引擎</Text>
            <Text className={styles.headerSubtitle}>
              基于您的画像标签和行为数据，为您精准匹配政务服务
            </Text>
            <Text className={styles.analysisTime}>
              📊 最近分析时间：{formatDateTime(behaviorAnalysis?.analysisTime || '')}
            </Text>
            <Text
              className={styles.refreshBtn}
              onClick={!refreshing ? handleRefreshRecommend : undefined}
            >
              <Text className={styles.refreshIcon}>{refreshing ? '⏳' : '🔄'}</Text>
              {refreshing ? '刷新中...' : '换一批推荐'}
            </Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>👤</Text>
              用户画像
            </Text>
          </View>

          <View className={styles.userProfile}>
            <View className={styles.profileHeader}>
              <View className={styles.avatar}>👤</View>
              <View className={styles.profileInfo}>
                <Text className={styles.profileName}>市民用户</Text>
                <Text className={styles.profileMatch}>综合匹配度 {overallMatch}%</Text>
              </View>
            </View>

            <View className={styles.radarChart}>
              <Text className={styles.chartTitle}>服务偏好分析</Text>
              <View className={styles.chartPlaceholder}>
                <Text className={styles.radarLabelTop}>养老保险</Text>
                <Text className={styles.radarLabelRight}>职称评审</Text>
                <Text className={styles.radarLabelBottom}>社会保障</Text>
                <Text className={styles.radarLabelLeft}>医疗保险</Text>
                <View className={styles.radarCircle}>
                  <View className={styles.radarCenter}>
                    <View className={styles.radarInner}>
                      <Text className={styles.radarScore}>{overallMatch}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View className={styles.tagsSection}>
              <Text className={styles.tagsTitle}>
                🏷️ 画像标签
              </Text>
              <View className={styles.tagsContainer}>
                {behaviorAnalysis?.recommendedTags.map((tag, index) => (
                  <Text key={index} className={`${styles.tag} ${styles.tagPrimary}`}>
                    {tag}
                  </Text>
                ))}
              </View>
            </View>

            <View className={styles.tagsSection}>
              <Text className={styles.tagsTitle}>
                ❤️ 感兴趣的类别
              </Text>
              <View className={styles.tagsContainer}>
                {behaviorAnalysis?.interestedCategories.map((cat, index) => (
                  <Text key={index} className={`${styles.tag} ${styles.tagSuccess}`}>
                    {cat}
                  </Text>
                ))}
              </View>
            </View>

            <View className={styles.tagsSection}>
              <Text className={styles.tagsTitle}>
                ⏭️ 暂不关注
              </Text>
              <View className={styles.tagsContainer}>
                {behaviorAnalysis?.uninterestedCategories.map((cat, index) => (
                  <Text key={index} className={`${styles.tag} ${styles.tagSecondary}`}>
                    {cat}
                  </Text>
                ))}
              </View>
            </View>

            <View className={styles.statusCards}>
              <View className={styles.statusCard}>
                <Text className={styles.statusCardIcon}>📄</Text>
                <Text className={styles.statusCardTitle}>即将到期证照</Text>
                <Text className={`${styles.statusCardValue} ${styles.statusCardValueWarning}`}>
                  {behaviorAnalysis?.licenseStatus.expiringSoon.length || 0} 张
                </Text>
              </View>
              <View className={styles.statusCard}>
                <Text className={styles.statusCardIcon}>🛡️</Text>
                <Text className={styles.statusCardTitle}>社保状态</Text>
                <Text className={`${styles.statusCardValue} ${styles.statusCardValueSuccess}`}>
                  正常
                </Text>
              </View>
              <View className={styles.statusCard}>
                <Text className={styles.statusCardIcon}>⭐</Text>
                <Text className={styles.statusCardTitle}>推荐服务</Text>
                <Text className={styles.statusCardValue}>
                  {recommendServices.length} 项
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📊</Text>
              行为轨迹分析
            </Text>
          </View>

          <View className={styles.behaviorAnalysis}>
            {behaviorAnalysis?.recentBehaviors.map((behavior: BehaviorSummary, index: number) => (
              <View key={index} className={styles.behaviorItem}>
                <View className={styles.behaviorHeader}>
                  <View className={styles.behaviorType}>
                    <Text className={styles.behaviorIcon}>{getBehaviorIcon(behavior.type)}</Text>
                    <Text className={styles.behaviorName}>{getBehaviorName(behavior.type)}</Text>
                  </View>
                  <Text className={styles.behaviorCount}>{behavior.count} 次</Text>
                </View>
                <View className={styles.behaviorMeta}>
                  <Text className={styles.behaviorLastTime}>
                    最近：{formatDateTime(behavior.lastTime)}
                  </Text>
                </View>
                <View className={styles.behaviorCategories}>
                  {behavior.categories.map((cat, i) => (
                    <Text key={i} className={styles.behaviorCategory}>{cat}</Text>
                  ))}
                </View>
                <View className={styles.behaviorBar}>
                  <View
                    className={styles.behaviorBarFill}
                    style={{ width: `${(behavior.count / maxBehaviorCount) * 100}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {behaviorAnalysis?.serviceNeeds && behaviorAnalysis.serviceNeeds.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>🎯</Text>
                服务需求预测
              </Text>
              <Text className={styles.sectionDesc}>
                基于您的数据分析，以下是建议您办理的事项
              </Text>
            </View>

            <View className={styles.serviceNeeds}>
              {behaviorAnalysis.serviceNeeds.map((need: ServiceNeed, index: number) => (
                <View key={index} className={styles.needItem}>
                  <View className={`${styles.needUrgency} ${getUrgencyClass(need.urgency)}`} />
                  <View className={styles.needContent}>
                    <Text className={styles.needType}>
                      <Text className={styles.tagIcon}>
                        {need.urgency === 'high' ? '🔴' : need.urgency === 'medium' ? '🟡' : '🟢'}
                      </Text>
                      {need.serviceType}
                      <Text className={`${styles.tag} ${
                        need.urgency === 'high' ? styles.tagDanger :
                        need.urgency === 'medium' ? styles.tagWarning : styles.tagSuccess
                      }`} style={{ marginLeft: 8 }}>
                        {getUrgencyText(need.urgency)}
                      </Text>
                    </Text>
                    <Text className={styles.needReason}>{need.reason}</Text>
                    {need.suggestedTime && (
                      <Text className={styles.needSuggestedTime}>
                        📅 建议办理时间：{need.suggestedTime}
                      </Text>
                    )}
                    <Text
                      className={styles.needAction}
                      onClick={() => handleNeedAction(need)}
                    >
                      立即办理 →
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>💡</Text>
              为您推荐
            </Text>
            <Text
              className={styles.sectionAction}
              onClick={!refreshing ? handleRefreshRecommend : undefined}
            >
              {refreshing ? '刷新中...' : '换一批'}
            </Text>
          </View>

          <View className={styles.recommendList}>
            {recommendServices.map(service => (
              <View
                key={service.id}
                className={styles.recommendItem}
                onClick={() => handleServiceClick(service)}
              >
                <View className={`${styles.recommendBadge} ${getBadgeClass(service.confidence)}`}>
                  {getBadgeText(service.confidence)}
                </View>

                <View className={styles.recommendHeader}>
                  <Text className={styles.recommendIcon}>
                    {getServiceIcon(service.serviceType)}
                  </Text>
                  <View className={styles.recommendInfo}>
                    <Text className={styles.recommendName}>{service.serviceName}</Text>
                    <Text className={styles.recommendDesc}>{service.description}</Text>
                    <Text className={styles.recommendReason}>
                      {getReasonTypeText(service.reasonType)}
                    </Text>
                    <Text className={styles.recommendReason} style={{ marginTop: 4 }}>
                      💬 {service.reason}
                    </Text>

                    <View className={styles.recommendMatchTags}>
                      {service.matchTags.map((tag, i) => (
                        <Text key={i} className={styles.matchTag}>{tag}</Text>
                      ))}
                    </View>

                    <View className={styles.confidenceBar}>
                      <Text className={styles.confidenceLabel}>匹配度</Text>
                      <View className={styles.confidenceTrack}>
                        <View
                          className={styles.confidenceFill}
                          style={{ width: `${service.confidence * 100}%` }}
                        />
                      </View>
                      <Text className={styles.confidenceValue}>
                        {Math.round(service.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                </View>

                <View className={styles.recommendMeta}>
                  <View className={styles.metaItem}>
                    <Text>⭐</Text>
                    <Text className={styles.metaScore}>{service.satisfaction}%</Text>
                    <Text>满意度</Text>
                  </View>
                  <View className={styles.metaItem}>
                    <Text>⏱️</Text>
                    <Text className={styles.metaValue}>{service.averageDuration}天</Text>
                    <Text>平均办理</Text>
                  </View>
                  <View className={styles.metaItem}>
                    <Text>👥</Text>
                    <Text className={styles.metaValue}>{formatNumber(service.applyCount)}</Text>
                    <Text>已办理</Text>
                  </View>
                  {service.isCrossProvince && (
                    <View className={styles.metaItem}>
                      <Text className={styles.metaValue} style={{ color: '$color-primary' }}>
                        🌐 跨省通办
                      </Text>
                    </View>
                  )}
                </View>

                <View className={styles.recommendActions}>
                  <View
                    className={`${styles.actionBtn} ${styles.actionSecondary}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotInterested(service);
                    }}
                  >
                    不感兴趣
                  </View>
                  <View className={`${styles.actionBtn} ${styles.actionPrimary}`}>
                    立即办理
                  </View>
                </View>
              </View>
            ))}

            {recommendServices.length === 0 && (
              <View className={styles.empty}>
                <Text className={styles.emptyIcon}>🎉</Text>
                <Text className={styles.emptyText}>暂无推荐服务</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {showNotInterestedModal && selectedService && (
        <View
          className={styles.notInterestedModal}
          onClick={() => !submitting && setShowNotInterestedModal(false)}
        >
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>不感兴趣的原因</Text>
            <Text className={styles.modalDesc}>
              您的反馈将帮助我们优化推荐算法
            </Text>

            <View className={styles.reasonOptions}>
              {notInterestedReasons.map((reason, index) => (
                <Text
                  key={index}
                  className={`${styles.reasonOption} ${
                    selectedReason === reason ? styles.reasonOptionActive : ''
                  }`}
                  onClick={() => setSelectedReason(reason)}
                >
                  {reason}
                </Text>
              ))}
            </View>

            <View className={styles.modalActions}>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                onClick={() => setShowNotInterestedModal(false)}
              >
                取消
              </View>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnConfirm} ${
                  submitting ? styles.modalBtnCancel : ''
                }`}
                onClick={!submitting ? submitNotInterested : undefined}
              >
                {submitting ? '提交中...' : '提交反馈'}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default RecommendPage;
