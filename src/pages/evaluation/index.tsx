import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useUserStore } from '@/store/useUserStore';
import { taskService } from '@/services/task';
import { logOperation } from '@/utils/logger';
import { detectNegativeKeywords, formatPhoneDisplay } from '@/utils/validator';
import type { Evaluation } from '@/types/task';
import { NEGATIVE_KEYWORDS } from '@/types/task';

type FilterType = 'all' | 'positive' | 'negative' | 'unhandled';

const EvaluationPage: React.FC = () => {
  const { user } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [handleRemark, setHandleRemark] = useState('');
  const [handleLoading, setHandleLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskService.getEvaluations();
      setEvaluations(data);
    } catch (e) {
      console.error('[EvaluationPage] 加载数据失败:', e);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    loadData();
  });

  const stats = useMemo(() => {
    const total = evaluations.length;
    const positive = evaluations.filter(e => e.rating >= 4 && !e.hasNegative).length;
    const negative = evaluations.filter(e => e.hasNegative || e.rating <= 2).length;
    const unhandled = evaluations.filter(e => !e.isHandled).length;
    const avgRating = total > 0
      ? (evaluations.reduce((sum, e) => sum + e.rating, 0) / total).toFixed(1)
      : '0.0';

    return { total, positive, negative, unhandled, avgRating };
  }, [evaluations]);

  const filteredEvaluations = useMemo(() => {
    let filtered = [...evaluations];

    switch (filterType) {
      case 'positive':
        filtered = filtered.filter(e => e.rating >= 4 && !e.hasNegative);
        break;
      case 'negative':
        filtered = filtered.filter(e => e.hasNegative || e.rating <= 2);
        break;
      case 'unhandled':
        filtered = filtered.filter(e => !e.isHandled);
        break;
      default:
        break;
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(e =>
        e.waybillNo.toLowerCase().includes(keyword) ||
        e.reviewerName.toLowerCase().includes(keyword) ||
        e.content.toLowerCase().includes(keyword)
      );
    }

    return filtered.sort((a, b) => b.createTime - a.createTime);
  }, [evaluations, filterType, searchKeyword]);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'positive', label: '好评' },
    { value: 'negative', label: '差评' },
    { value: 'unhandled', label: '待处理' }
  ];

  const highlightNegativeKeywords = (content: string): React.ReactNode => {
    const foundKeywords = detectNegativeKeywords(content, NEGATIVE_KEYWORDS);
    if (foundKeywords.length === 0) return content;

    let result: React.ReactNode[] = [content];
    for (const keyword of foundKeywords) {
      const newResult: React.ReactNode[] = [];
      for (const part of result) {
        if (typeof part === 'string') {
          const parts = part.split(keyword);
          for (let i = 0; i < parts.length; i++) {
            if (parts[i]) {
              newResult.push(parts[i]);
            }
            if (i < parts.length - 1) {
              newResult.push(
                <Text key={`${keyword}-${i}`} className={styles.highlight}>
                  {keyword}
                </Text>
              );
            }
          }
        } else {
          newResult.push(part);
        }
      }
      result = newResult;
    }

    return result;
  };

  const getSeverityClass = (severity: string): string => {
    const classMap: Record<string, string> = {
      high: styles.high,
      medium: styles.medium,
      low: styles.low
    };
    return classMap[severity] || '';
  };

  const getSeverityLabel = (severity: string): string => {
    const labelMap: Record<string, string> = {
      high: '高风险',
      medium: '中风险',
      low: '低风险'
    };
    return labelMap[severity] || severity;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text
          key={i}
          className={classnames(styles.star, i <= rating && styles.active)}
        >
          ★
        </Text>
      );
    }
    return stars;
  };

  const getTagClass = (tag: string, hasNegative: boolean): string => {
    if (hasNegative || NEGATIVE_KEYWORDS.some(k => tag.includes(k))) {
      return styles.negative;
    }
    return styles.positive;
  };

  const formatTime = (timestamp: number): string => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
  };

  const handleOpenHandleModal = (evaluation: Evaluation) => {
    if (!user) return;

    setSelectedEvaluation(evaluation);
    setHandleRemark('');
    setHandleModalVisible(true);
  };

  const handleCloseModal = () => {
    setHandleModalVisible(false);
    setSelectedEvaluation(null);
    setHandleRemark('');
  };

  const handleSubmit = async () => {
    if (!user || !selectedEvaluation || handleLoading) return;

    if (!handleRemark.trim()) {
      Taro.showToast({ title: '请填写处理意见', icon: 'none' });
      return;
    }

    setHandleLoading(true);
    try {
      const success = await taskService.handleEvaluation(
        selectedEvaluation.id,
        handleRemark,
        user.id,
        user.name
      );

      if (success) {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'evaluation',
          action: 'handle',
          targetType: 'evaluation',
          targetId: selectedEvaluation.id,
          targetName: `评价处理-${selectedEvaluation.waybillNo}`,
          status: 'success',
          complianceLevel: 'sensitive',
          retentionDays: 365,
          requestParams: {
            waybillNo: selectedEvaluation.waybillNo,
            rating: selectedEvaluation.rating,
            hasNegative: selectedEvaluation.hasNegative,
            negativeKeywords: selectedEvaluation.negativeKeywords,
            handleRemark
          }
        });

        setEvaluations(prev => prev.map(e =>
          e.id === selectedEvaluation.id
            ? { ...e, isHandled: true, handlerRemark: handleRemark, handleTime: Date.now() }
            : e
        ));

        Taro.showToast({ title: '处理成功', icon: 'success' });
        handleCloseModal();
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '处理失败';
      console.error('[EvaluationPage] 处理失败:', e);

      if (user) {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'evaluation',
          action: 'handle',
          targetType: 'evaluation',
          targetId: selectedEvaluation?.id,
          status: 'failed',
          errorMessage: errorMsg,
          complianceLevel: 'sensitive',
          retentionDays: 365
        });
      }

      Taro.showToast({ title: errorMsg, icon: 'none' });
    } finally {
      setHandleLoading(false);
    }
  };

  const handleCallUser = (phone: string, name: string) => {
    if (!user) return;

    Taro.makePhoneCall({
      phoneNumber: phone,
      complete: async () => {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'evaluation',
          action: 'call_reviewer',
          targetType: 'evaluation',
          targetId: selectedEvaluation?.id,
          targetName: `联系评价人-${name}`,
          status: 'success',
          complianceLevel: 'normal',
          retentionDays: 90,
          requestParams: { phone: formatPhoneDisplay(phone), name }
        });
      }
    });
  };

  const handleViewWaybill = (waybillNo: string) => {
    Taro.navigateTo({
      url: `/pages/waybill-detail/index?waybillNo=${encodeURIComponent(waybillNo)}`
    });
  };

  const analyzeEvaluationSeverity = (evaluation: Evaluation): 'low' | 'medium' | 'high' => {
    if (evaluation.negativeKeywords.length >= 3 || evaluation.rating <= 1) {
      return 'high';
    } else if (evaluation.negativeKeywords.length >= 1 || evaluation.rating <= 2) {
      return 'medium';
    }
    return 'low';
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>服务评价</Text>
        <Text className={styles.headerDesc}>及时处理客户评价，提升服务质量</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.avgRating}</Text>
            <Text className={styles.label}>平均分</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.positive}</Text>
            <Text className={styles.label}>好评</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.negative}</Text>
            <Text className={styles.label}>差评</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.unhandled}</Text>
            <Text className={styles.label}>待处理</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterTabs}>
        {filterOptions.map(option => (
          <View
            key={option.value}
            className={classnames(styles.filterTab, filterType === option.value && styles.active)}
            onClick={() => setFilterType(option.value)}
          >
            <Text>{option.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.searchBox}>
        <Text className={styles.icon}>🔍</Text>
        <Input
          className={styles.input}
          placeholder="搜索运单号/评价人/内容"
          value={searchKeyword}
          onInput={(e) => setSearchKeyword(e.detail.value)}
        />
      </View>

      <ScrollView
        scrollY
        className={styles.evaluationList}
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        {loading ? (
          <View className={styles.loading}>
            <Text>加载中...</Text>
          </View>
        ) : filteredEvaluations.length > 0 ? (
          filteredEvaluations.map(evaluation => {
            const severity = analyzeEvaluationSeverity(evaluation);
            return (
              <View key={evaluation.id} className={styles.evaluationCard}>
                <View className={styles.cardHeader}>
                  <View className={styles.avatar}>
                    <Text>{evaluation.reviewerName.charAt(0)}</Text>
                  </View>
                  <View className={styles.userInfo}>
                    <Text className={styles.userName}>{evaluation.reviewerName}</Text>
                    <View className={styles.metaRow}>
                      <Text className={styles.waybillNo}>{evaluation.waybillNo}</Text>
                      <Text className={styles.time}>{formatTime(evaluation.createTime)}</Text>
                    </View>
                  </View>
                  <View className={styles.rating}>
                    {renderStars(evaluation.rating)}
                  </View>
                </View>

                <View className={styles.tags}>
                  {evaluation.tags.map((tag, index) => (
                    <Text
                      key={index}
                      className={classnames(styles.tag, getTagClass(tag, evaluation.hasNegative))}
                    >
                      {tag}
                    </Text>
                  ))}
                  {evaluation.hasNegative && (
                    <Text
                      className={classnames(styles.severityBadge, getSeverityClass(severity))}
                    >
                      {getSeverityLabel(severity)}
                    </Text>
                  )}
                </View>

                <View className={styles.content}>
                  {highlightNegativeKeywords(evaluation.content)}
                </View>

                {evaluation.negativeKeywords.length > 0 && (
                  <View className={styles.negativeKeywords}>
                    <Text className={styles.label}>⚠️ 检测到负面关键词：</Text>
                    {evaluation.negativeKeywords.map((keyword, index) => (
                      <Text key={index} className={styles.keywordTag}>
                        {keyword}
                      </Text>
                    ))}
                  </View>
                )}

                <View className={styles.handleSection}>
                  <View className={styles.handleInfo}>
                    {evaluation.isHandled ? (
                      <View className={styles.handled}>
                        <Text>✅</Text>
                        <Text>已处理</Text>
                      </View>
                    ) : (
                      <View
                        className={styles.handleBtn}
                        onClick={() => handleOpenHandleModal(evaluation)}
                      >
                        <Text>处理评价</Text>
                      </View>
                    )}
                    <View
                      style={{
                        display: 'flex',
                        gap: '16rpx',
                        alignItems: 'center'
                      }}
                    >
                      <View
                        style={{
                          padding: '8rpx 16rpx',
                          background: '#f5f6f7',
                          borderRadius: '24rpx',
                          fontSize: '24rpx',
                          color: '#4e5969'
                        }}
                        onClick={() => handleCallUser(evaluation.reviewerPhone, evaluation.reviewerName)}
                      >
                        <Text>📞 联系</Text>
                      </View>
                      <View
                        style={{
                          padding: '8rpx 16rpx',
                          background: '#f5f6f7',
                          borderRadius: '24rpx',
                          fontSize: '24rpx',
                          color: '#4e5969'
                        }}
                        onClick={() => handleViewWaybill(evaluation.waybillNo)}
                      >
                        <Text>📦 运单</Text>
                      </View>
                    </View>
                  </View>

                  {evaluation.isHandled && evaluation.handlerRemark && (
                    <View className={styles.handleRemark}>
                      <Text className={styles.remarkLabel}>处理意见：</Text>
                      <Text className={styles.remarkContent}>{evaluation.handlerRemark}</Text>
                      {evaluation.handleTime && (
                        <Text className={styles.handleTime}>
                          处理时间：{formatTime(evaluation.handleTime)}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View className={styles.empty}>
            <Text className={styles.icon}>⭐</Text>
            <Text className={styles.text}>暂无评价记录</Text>
          </View>
        )}
      </ScrollView>

      {handleModalVisible && selectedEvaluation && (
        <View className={styles.modalContent}>
          <Text className={styles.modalTitle}>处理评价</Text>
          <Text className={styles.modalDesc}>
            运单号：{selectedEvaluation.waybillNo}{'\n'}
            评价人：{selectedEvaluation.reviewerName}{'\n'}
            评分：{selectedEvaluation.rating} 星
          </Text>
          <Textarea
            className={styles.textarea}
            placeholder="请填写处理意见..."
            value={handleRemark}
            onInput={(e) => setHandleRemark(e.detail.value)}
            maxlength={500}
          />
          <Text className={styles.charCount}>{handleRemark.length}/500</Text>
          <View className={styles.modalActions}>
            <View
              className={classnames(styles.modalBtn, styles.cancel)}
              onClick={handleCloseModal}
            >
              <Text>取消</Text>
            </View>
            <View
              className={classnames(styles.modalBtn, styles.confirm, (handleLoading || !handleRemark.trim()) && styles.disabled)}
              onClick={handleSubmit}
            >
              <Text>{handleLoading ? '处理中...' : '确认处理'}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default EvaluationPage;
