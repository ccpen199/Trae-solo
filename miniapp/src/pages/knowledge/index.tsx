import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import SearchBar from '../../components/SearchBar';
import AccessibilityFab from '../../components/AccessibilityFab';
import { mockPolicies, mockKnowledgeQA } from '../../data/mockPolicies';
import { useAppStore } from '../../store/appStore';
import { useUserStore } from '../../store/userStore';
import classnames from 'classnames';
import type { Policy } from '../../types';

const historyQuestions = [
  { id: 'h1', text: '公积金贷款额度怎么计算？' },
  { id: 'h2', text: '新生儿落户需要什么材料？' },
  { id: 'h3', text: '育儿补贴申领条件' },
  { id: 'h4', text: '门诊共济怎么用？' }
];

const quickQuestions = [
  '公积金提取条件',
  '育儿补贴标准',
  '养老资格认证',
  '二手房税费'
];

const policyCategories = [
  { key: 'all', name: '全部' },
  { key: 'housing', name: '住房' },
  { key: 'social-security', name: '社保' },
  { key: 'education', name: '教育' },
  { key: 'medical', name: '医疗' },
  { key: 'tax', name: '税务' },
  { key: 'business', name: '企业' },
  { key: 'civil-affairs', name: '民政' }
];

const KnowledgePage: React.FC = () => {
  const speak = useAppStore(s => s.speak);
  const { profile, loadProfile } = useUserStore();
  const [selectedCategory, setSelectedCategory] = useState('all');

  usePullDownRefresh(() => {
    loadProfile().finally(() => Taro.stopPullDownRefresh());
  });

  const matchedPolicies = useMemo(() => {
    let policies = mockPolicies.filter(p => p.matchScore && p.matchScore >= 0.7);
    if (selectedCategory !== 'all') {
      policies = policies.filter(p => p.category === selectedCategory);
    }
    return policies.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [selectedCategory, profile]);

  const allPolicies = useMemo(() => {
    if (selectedCategory === 'all') return mockPolicies;
    return mockPolicies.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const handleChatClick = useCallback((question?: string) => {
    speak(question || '打开智能问答对话');
    const url = question
      ? `/pages/chat-qa/index?question=${encodeURIComponent(question)}`
      : '/pages/chat-qa/index';
    Taro.navigateTo({ url });
  }, [speak]);

  const handlePolicyClick = useCallback((policy: Policy) => {
    speak(`${policy.title}，进入政策详情`);
    Taro.navigateTo({ url: `/pages/policy-detail/index?id=${policy.id}` });
  }, [speak]);

  const handleCategoryClick = useCallback((key: string) => {
    setSelectedCategory(key);
    const cat = policyCategories.find(c => c.key === key);
    speak(cat ? `切换到${cat.name}分类` : '查看全部政策');
  }, [speak]);

  const handleQAClick = useCallback((qa: typeof mockKnowledgeQA[0]) => {
    speak(`问题：${qa.question}`);
    handleChatClick(qa.question);
  }, [speak, handleChatClick]);

  return (
    <View className={styles.container}>
      <SearchBar
        placeholder="搜索政策、办事问答..."
        showHotKeywords
        onSearch={(kw) => handleChatClick(kw)}
      />

      <View className={styles.chatEntry} onClick={() => handleChatClick()}>
        <View className={styles.chatEntryLeft}>
          <View className={styles.chatEntryTitle}>
            <Text className={styles.chatEntryIcon}>🤖</Text>
            <Text>小智AI · 政务问答助手</Text>
          </View>
          <Text className={styles.chatEntryDesc}>
            基于知识图谱的智能问答，政策条款、办事条件一"问"了然，支持多轮对话追问
          </Text>
          <View className={styles.chatQuickTags}>
            {quickQuestions.map(q => (
              <View key={q} className={styles.quickTag} onClick={(e) => { e.stopPropagation(); handleChatClick(q); }}>
                <Text>{q}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className={styles.chatEntryBtn} onClick={(e) => { e.stopPropagation(); handleChatClick(); }}>
          <Text>去提问</Text>
        </View>
      </View>

      <View className={styles.historySection}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📝</Text>
            <Text>最近问答</Text>
          </View>
          <Text className={styles.moreLink}>查看全部</Text>
        </View>
        <View className={styles.historyGrid}>
          {historyQuestions.map(item => (
            <View key={item.id} className={styles.historyItem} onClick={() => handleChatClick(item.text)}>
              <View className={styles.historyIcon}>Q</View>
              <Text className={styles.historyText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.matchSection}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🎯</Text>
            <Text>画像政策匹配</Text>
            <View className={styles.matchBadge}>
              <Text>✓ 为您定制</Text>
            </View>
          </View>
          <Text className={styles.moreLink}>全部{matchedPolicies.length}条 →</Text>
        </View>

        {matchedPolicies.slice(0, 3).map(policy => (
          <View
            key={policy.id}
            className={classnames(styles.policyCard, (policy.matchScore || 0) >= 0.85 && styles.highMatch)}
            onClick={() => handlePolicyClick(policy)}
          >
            <View className={styles.policyHeader}>
              <Text className={styles.policyTitle}>{policy.title}</Text>
              <View className={styles.scoreBadge}>
                <Text className={styles.scoreValue}>{Math.round((policy.matchScore || 0) * 100)}%</Text>
                <Text className={styles.scoreLabel}>匹配度</Text>
              </View>
            </View>
            <View className={styles.policyMeta}>
              <Text className={styles.metaItem}>🏛️ {policy.issuingDepartment}</Text>
              <Text className={styles.metaItem}>📅 {policy.effectiveDate}实施</Text>
              <Text className={styles.metaItem}>👁️ {policy.views.toLocaleString()}阅读</Text>
            </View>
            <Text className={styles.policySummary}>{policy.summary}</Text>
            <View className={styles.matchReasons}>
              {policy.matchReasons?.slice(0, 3).map((r, i) => (
                <Text key={i} className={styles.reasonTag}>✓ {r}</Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View className={styles.categoryTabs}>
        {policyCategories.map(cat => (
          <View
            key={cat.key}
            className={classnames(styles.categoryTab, selectedCategory === cat.key && styles.active)}
            onClick={() => handleCategoryClick(cat.key)}
          >
            <Text>{cat.name}</Text>
          </View>
        ))}
      </View>

      <View className={styles.qaListSection}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>❓</Text>
            <Text>常见问答</Text>
          </View>
          <Text className={styles.moreLink}>更多问答 →</Text>
        </View>
        {mockKnowledgeQA.slice(0, 4).map(qa => (
          <View key={qa.id} className={styles.qaItem} onClick={() => handleQAClick(qa)}>
            <View className={styles.qaQuestion}>
              <View className={styles.qaQIcon}>Q</View>
              <Text className={styles.qaQText}>{qa.question}</Text>
            </View>
            <View className={styles.qaAnswer}>
              <View className={styles.qaAIcon}>A</View>
              <Text className={styles.qaAText}>{qa.answer}</Text>
            </View>
            <View className={styles.qaMeta}>
              <View className={styles.qaStats}>
                <Text className={styles.qaStat}>📂 {qa.category}</Text>
                <Text className={styles.qaStat}>👁️ {qa.views.toLocaleString()}</Text>
              </View>
              <Text className={styles.qaHelpful}>👍 有用率 {qa.helpful}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.graphSection}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🕸️</Text>
            <Text>政策知识图谱</Text>
          </View>
          <Text className={styles.moreLink}>进入图谱 →</Text>
        </View>
        <View className={styles.graphPreview}>
          <View className={styles.centerNode}>
            <Text>育儿补贴</Text>
          </View>
          <View className={styles.relatedNodes}>
            <View className={classnames(styles.relatedNode, 'policy')}>
              <Text>📜 育儿补贴实施办法</Text>
            </View>
            <View className={classnames(styles.relatedNode, 'policy')}>
              <Text>📜 三孩支持政策</Text>
            </View>
            <View className={classnames(styles.relatedNode, 'service')}>
              <Text>💼 学前助学金申请</Text>
            </View>
            <View className={classnames(styles.relatedNode, 'service')}>
              <Text>💼 幼儿园报名</Text>
            </View>
            <View className={classnames(styles.relatedNode, 'service')}>
              <Text>💼 医保参保登记</Text>
            </View>
            <View className={classnames(styles.relatedNode, 'concept')}>
              <Text>💡 生育津贴</Text>
            </View>
          </View>
          <Text className={styles.graphDesc}>
            关联 {6} 个政策节点 · {4} 个办事节点 · 支持追溯溯源
          </Text>
        </View>
      </View>

      <AccessibilityFab />
    </View>
  );
};

export default KnowledgePage;
