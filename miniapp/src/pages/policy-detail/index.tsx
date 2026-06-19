import React, { useState, useMemo, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '../../store/appStore';
import { mockPolicyDetails } from '../../data/mockPolicyDetails';
import { mockRecommendServices } from '../../data/mockServices';
import classnames from 'classnames';

const TAB_LIST = [
  { key: 'fulltext', name: '政策全文' },
  { key: 'interpret', name: '条款解读' },
  { key: 'services', name: '关联服务' },
  { key: 'faq', name: '常见问答' }
] as const;

type TabKey = typeof TAB_LIST[number]['key'];

const STATUS_MAP = {
  active: { text: '生效中', className: 'statusActive' },
  upcoming: { text: '即将生效', className: 'statusUpcoming' },
  expired: { text: '已失效', className: 'statusExpired' }
} as const;

const PolicyDetailPage: React.FC = () => {
  const router = useRouter();
  const policyId = router.params.id || '';
  const speak = useAppStore(s => s.speak);

  const [activeTab, setActiveTab] = useState<TabKey>('fulltext');
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set());
  const [isFavorite, setIsFavorite] = useState(false);

  const policy = useMemo(() => {
    return mockPolicyDetails.find(p => p.id === policyId) || mockPolicyDetails[0];
  }, [policyId]);

  const relatedServices = useMemo(() => {
    return mockRecommendServices.filter(s => policy.relatedServiceIds.includes(s.id));
  }, [policy]);

  const statusInfo = STATUS_MAP[policy.status];

  const handleTabChange = useCallback((key: TabKey) => {
    setActiveTab(key);
    const tab = TAB_LIST.find(t => t.key === key);
    speak(tab ? `切换到${tab.name}` : '');
  }, [speak]);

  const handleToggleClause = useCallback((index: number) => {
    setExpandedClauses(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        speak(policy.clauses[index].interpretation);
      }
      return next;
    });
  }, [policy, speak]);

  const handleToggleFaq = useCallback((index: number) => {
    setExpandedFaqs(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        speak(policy.faqs[index].answer);
      }
      return next;
    });
  }, [policy, speak]);

  const handleServiceClick = useCallback((serviceId: string) => {
    speak('进入办事服务');
    Taro.navigateTo({ url: `/pages/service-detail/index?id=${serviceId}` });
  }, [speak]);

  const handleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
    Taro.showToast({ title: isFavorite ? '已取消收藏' : '收藏成功', icon: 'none' });
    speak(isFavorite ? '已取消收藏' : '收藏成功');
  }, [isFavorite, speak]);

  const handleShare = useCallback(() => {
    speak('分享政策');
    Taro.showToast({ title: '分享链接已复制', icon: 'none' });
  }, [speak]);

  const handleApply = useCallback(() => {
    if (relatedServices.length > 0) {
      speak('前往办理');
      Taro.navigateTo({ url: `/pages/service-detail/index?id=${relatedServices[0].id}` });
    } else {
      Taro.showToast({ title: '暂无关联办事服务', icon: 'none' });
    }
  }, [relatedServices, speak]);

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{policy.title}</Text>
          <View className={classnames(styles.statusTag, styles[statusInfo.className])}>
            <Text>{statusInfo.text}</Text>
          </View>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaItem}>🏛️ {policy.issuingDepartment}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaItem}>📅 发布日期 {policy.issueDate}</Text>
          <Text className={styles.metaItem}>🗓️ 生效日期 {policy.effectiveDate}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaItem}>👁️ {policy.views.toLocaleString()}阅读</Text>
          <Text className={styles.metaItem}>� 文号 {policy.code}</Text>
        </View>
      </View>

      <View className={styles.summaryCard}>
        <View className={styles.summaryHeader}>
          <Text className={styles.summaryIcon}>📋</Text>
          <Text className={styles.summaryTitle}>政策摘要</Text>
        </View>
        <Text className={styles.summaryText}>{policy.summary}</Text>
        <View className={styles.keywordRow}>
          {policy.keywords.map(kw => (
            <View key={kw} className={styles.keywordTag}>
              <Text>{kw}</Text>
            </View>
          ))}
        </View>
      </View>

      {policy.matchScore != null && (
        <View className={styles.matchCard}>
          <View className={styles.matchHeader}>
            <Text className={styles.matchIcon}>🎯</Text>
            <Text className={styles.matchTitle}>与您画像匹配度</Text>
            <Text className={styles.matchScore}>{Math.round(policy.matchScore * 100)}%</Text>
          </View>
          <View className={styles.matchBar}>
            <View
              className={styles.matchBarInner}
              style={{ width: `${Math.round(policy.matchScore * 100)}%` }}
            />
          </View>
          <View className={styles.matchReasons}>
            {policy.matchReasons?.map((reason, idx) => (
              <View key={idx} className={styles.matchReason}>
                <Text className={styles.matchCheck}>✓</Text>
                <Text className={styles.matchReasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.tabBar}>
        {TAB_LIST.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.tabActive)}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text>{tab.name}</Text>
            {activeTab === tab.key && <View className={styles.tabIndicator} />}
          </View>
        ))}
      </View>

      <View className={styles.tabContent}>
        {activeTab === 'fulltext' && (
          <View className={styles.fulltextSection}>
            {policy.chapters.map((chapter, idx) => (
              <View key={idx} className={styles.chapterCard}>
                <View className={styles.chapterHeader}>
                  <Text className={styles.chapterIndex}>{idx + 1}</Text>
                  <Text className={styles.chapterTitle}>{chapter.title}</Text>
                </View>
                <Text className={styles.chapterContent}>{chapter.content}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'interpret' && (
          <View className={styles.interpretSection}>
            {policy.clauses.map((clause, idx) => (
              <View key={idx} className={styles.clauseCard}>
                <View className={styles.clauseHeader}>
                  <Text className={styles.clauseTitle}>{clause.title}</Text>
                </View>
                <Text className={styles.clauseContent}>{clause.content}</Text>
                <View
                  className={styles.interpretBtn}
                  onClick={() => handleToggleClause(idx)}
                >
                  <Text>{expandedClauses.has(idx) ? '🔼 收起解读' : '💡 白话解读'}</Text>
                </View>
                {expandedClauses.has(idx) && (
                  <View className={styles.interpretBox}>
                    <Text className={styles.interpretText}>{clause.interpretation}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'services' && (
          <View className={styles.servicesSection}>
            {relatedServices.length > 0 ? relatedServices.map(service => (
              <View
                key={service.id}
                className={styles.serviceCard}
                onClick={() => handleServiceClick(service.id)}
              >
                <View className={styles.serviceIcon} style={{ background: service.color }}>
                  <Text>{service.icon}</Text>
                </View>
                <View className={styles.serviceInfo}>
                  <Text className={styles.serviceName}>{service.name}</Text>
                  <Text className={styles.serviceDesc}>{service.description}</Text>
                  <View className={styles.serviceMeta}>
                    <Text className={styles.serviceMetaItem}>⏱️ {service.handlingTime}</Text>
                    <Text className={styles.serviceMetaItem}>📊 成功率{Math.round(service.successRate * 100)}%</Text>
                  </View>
                </View>
                <Text className={styles.serviceArrow}>›</Text>
              </View>
            )) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📭</Text>
                <Text className={styles.emptyText}>暂无关联办事服务</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'faq' && (
          <View className={styles.faqSection}>
            {policy.faqs.map((faq, idx) => (
              <View key={idx} className={styles.faqCard}>
                <View
                  className={styles.faqQuestion}
                  onClick={() => handleToggleFaq(idx)}
                >
                  <View className={styles.faqQIcon}>
                    <Text>Q</Text>
                  </View>
                  <Text className={styles.faqQText}>{faq.question}</Text>
                  <Text className={classnames(styles.faqArrow, expandedFaqs.has(idx) && styles.faqArrowOpen)}>▾</Text>
                </View>
                {expandedFaqs.has(idx) && (
                  <View className={styles.faqAnswer}>
                    <View className={styles.faqAIcon}>
                      <Text>A</Text>
                    </View>
                    <Text className={styles.faqAText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.bottomAction} onClick={handleFavorite}>
          <Text className={styles.bottomActionIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          <Text className={styles.bottomActionText}>{isFavorite ? '已收藏' : '收藏'}</Text>
        </View>
        <View className={styles.bottomAction} onClick={handleShare}>
          <Text className={styles.bottomActionIcon}>🔗</Text>
          <Text className={styles.bottomActionText}>分享</Text>
        </View>
        <View className={styles.bottomPrimaryBtn} onClick={handleApply}>
          <Text className={styles.bottomPrimaryText}>我要办理</Text>
        </View>
      </View>
    </View>
  );
};

export default PolicyDetailPage;
