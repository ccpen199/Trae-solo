import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { PageHeader, Timeline } from '@/components';
import { getMatterDetail, cancelMatter, evaluateMatter } from '@/services/matter';
import type { Matter, ApprovalNode, MatterStatus } from '@/types/matter';
import { formatDate, formatDateTime, formatMoney, maskIdCard, maskPhone, getMatterStatusText } from '@/utils/format';
import styles from './index.module.scss';

const MatterDetailPage: React.FC = () => {
  const router = useRouter();
  const matterId = router.params.id || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [matter, setMatter] = useState<Matter | null>(null);
  const [activeTab, setActiveTab] = useState<'approval' | 'trace'>('approval');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const loadData = useCallback(async () => {
    if (!matterId) {
      Taro.showToast({ title: '办件ID不存在', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      const data = await getMatterDetail(matterId);
      setMatter(data);
    } catch (error) {
      console.error('[MatterDetailPage] 加载数据失败', error);
      Taro.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useDidShow(() => {
    loadData();
  });

  const getStatusIcon = (status: MatterStatus) => {
    const icons: Record<MatterStatus, string> = {
      draft: '📝',
      submitted: '📤',
      accepting: '🔍',
      accepted: '✅',
      reviewing: '⏳',
      approved: '🎉',
      rejected: '❌',
      completed: '🏆',
      cancelled: '🚫'
    };
    return icons[status] || '📄';
  };

  const getProgressPercent = (nodes: ApprovalNode[]) => {
    if (!nodes.length) return 0;
    const completed = nodes.filter(n => n.status === 'completed').length;
    return Math.round((completed / nodes.length) * 100);
  };

  const getTimelineItems = (nodes: ApprovalNode[]) => {
    return nodes.map(node => {
      let status: 'completed' | 'current' | 'pending' = 'pending';
      let type: 'normal' | 'success' | 'warning' | 'error' = 'normal';

      if (node.status === 'completed') {
        status = 'completed';
        type = node.handleResult === 'reject' ? 'error' : 'success';
      } else if (node.status === 'processing') {
        status = 'current';
      }

      return {
        id: node.id,
        time: node.handleTime || node.startTime || '',
        title: node.nodeName,
        description: node.handleComment,
        operator: node.handler,
        status,
        type
      };
    });
  };

  const getMaterialIcon = (format: string) => {
    const icons: Record<string, string> = {
      image: '🖼️',
      pdf: '📕',
      other: '📄'
    };
    return icons[format] || '📄';
  };

  const canCancel = () => {
    if (!matter) return false;
    return !['completed', 'cancelled', 'rejected'].includes(matter.status);
  };

  const canEvaluate = () => {
    if (!matter) return false;
    return matter.status === 'completed';
  };

  const handleCancel = async () => {
    if (!matter) return;

    if (!cancelReason.trim()) {
      Taro.showToast({ title: '请填写撤销原因', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await cancelMatter(matter.id);
      if (result.success) {
        Taro.showToast({ title: result.message, icon: 'success' });
        setShowCancelModal(false);
        loadData();
      } else {
        Taro.showToast({ title: result.message, icon: 'none' });
      }
    } catch (error) {
      console.error('[MatterDetailPage] 撤销失败', error);
      Taro.showToast({ title: '撤销失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvaluate = async () => {
    if (!matter) return;

    setSubmitting(true);
    try {
      const result = await evaluateMatter(matter.id, rating, comment);
      if (result.success) {
        Taro.showToast({ title: result.message, icon: 'success' });
        setShowRatingModal(false);
      } else {
        Taro.showToast({ title: result.message, icon: 'none' });
      }
    } catch (error) {
      console.error('[MatterDetailPage] 评价失败', error);
      Taro.showToast({ title: '评价失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewMaterial = (fileUrl: string) => {
    Taro.previewImage({ urls: [fileUrl] });
  };

  const getRatingText = (value: number) => {
    const texts = ['', '非常不满意', '不满意', '一般', '满意', '非常满意'];
    return texts[value] || '';
  };

  if (loading) {
    return (
      <View className={styles.page}>
        <PageHeader title="办件详情" subtitle="查看办件进度和详细信息" />
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  if (!matter) {
    return (
      <View className={styles.page}>
        <PageHeader title="办件详情" subtitle="查看办件进度和详细信息" />
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>📭</Text>
          <Text className={styles.emptyText}>办件不存在或已被删除</Text>
        </View>
      </View>
    );
  }

  const progressPercent = getProgressPercent(matter.approvalNodes);
  const timelineItems = getTimelineItems(matter.approvalNodes);

  return (
    <View className={styles.page}>
      <PageHeader title="办件详情" subtitle="查看办件进度和详细信息" />

      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        <View className={styles.statusCard}>
          <View className={styles.statusHeader}>
            <Text className={styles.statusIcon}>{getStatusIcon(matter.status)}</Text>
            <View className={styles.statusInfo}>
              <Text className={styles.statusTitle}>{matter.matterName}</Text>
              <Text className={styles.statusText}>当前状态：{getMatterStatusText(matter.status)}</Text>
              <Text className={styles.statusText}>当前节点：{matter.currentNode}</Text>
              <View className={styles.tagRow}>
                {matter.isUrgent && (
                  <Text className={`${styles.tag} ${styles.tagUrgent}`}>加急</Text>
                )}
                {matter.isCrossProvince && (
                  <Text className={`${styles.tag} ${styles.tagCross}`}>长三角跨省通办</Text>
                )}
                {matter.fee && matter.fee > 0 && (
                  <Text className={`${styles.tag} ${styles.tagFee}`}>费用 ¥{formatMoney(matter.fee)}</Text>
                )}
              </View>
            </View>
          </View>
          <View className={styles.statusProgress}>
            <View className={styles.statusProgressBar} style={{ width: `${progressPercent}%` }} />
          </View>
          <View className={styles.statusProgressText}>
            <Text>办理进度 {progressPercent}%</Text>
            <Text>预计完成：{formatDate(matter.estimatedFinishTime)}</Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>办件基本信息</Text>
          </View>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>办件编号</Text>
              <Text className={styles.infoValue}>{matter.matterCode}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>申请时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(matter.applyTime)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>申请人</Text>
              <Text className={styles.infoValue}>{matter.applicantName}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>身份证号</Text>
              <Text className={styles.infoValue}>{maskIdCard(matter.applicantIdCard)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>联系电话</Text>
              <Text className={styles.infoValue}>{maskPhone(matter.applicantPhone)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>承办部门</Text>
              <Text className={styles.infoValue}>{matter.handleOrganization}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>经办人</Text>
              <Text className={styles.infoValue}>{matter.handler || '待分配'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>联系电话</Text>
              <Text className={styles.infoValue}>{matter.handlerPhone || '暂无'}</Text>
            </View>
            {matter.actualFinishTime && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>实际完成时间</Text>
                <Text className={styles.infoValue}>{formatDateTime(matter.actualFinishTime)}</Text>
              </View>
            )}
            {matter.result && (
              <View className={`${styles.infoItem} ${styles.infoItemFull}`}>
                <Text className={styles.infoLabel}>办理结果</Text>
                <Text className={styles.infoValue}>{matter.result}</Text>
              </View>
            )}
          </View>
        </View>

        <View className={`${styles.section} ${styles.timelineSection}`}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>审批节点</Text>
          </View>
          <View className={styles.timelineWrap}>
            <Timeline items={timelineItems} />
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>办件材料</Text>
          </View>
          <View className={styles.materialList}>
            {matter.materials.map(material => (
              <View key={material.id} className={styles.materialItem}>
                <Text className={styles.materialIcon}>{getMaterialIcon(material.format)}</Text>
                <View className={styles.materialInfo}>
                  <Text className={styles.materialName}>
                    {material.type === 'required' ? (
                      <Text className={styles.materialRequired}>必填</Text>
                    ) : (
                      <Text className={styles.materialOptional}>选填</Text>
                    )}
                    {material.name}
                    {material.verified && (
                      <Text className={styles.materialVerified}>✓ 已核验</Text>
                    )}
                  </Text>
                  <Text className={styles.materialMeta}>
                    上传时间：{formatDateTime(material.uploadTime)}
                    {material.verifyTime && ` · 核验时间：${formatDateTime(material.verifyTime)}`}
                  </Text>
                </View>
                <Text
                  className={styles.materialAction}
                  onClick={() => handleViewMaterial(material.fileUrl)}
                >
                  查看
                </Text>
              </View>
            ))}
            {matter.materials.length === 0 && (
              <View className={styles.empty}>
                <Text className={styles.emptyIcon}>📁</Text>
                <Text className={styles.emptyText}>暂无上传材料</Text>
              </View>
            )}
          </View>
        </View>

        {matter.traceRecords.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>操作溯源</Text>
            </View>
            <View className={styles.traceList}>
              {matter.traceRecords.map(record => (
                <View key={record.id} className={styles.traceItem}>
                  <View className={styles.traceHeader}>
                    <Text className={styles.traceOperation}>{record.operation}</Text>
                    <Text className={styles.traceTime}>{formatDateTime(record.operationTime)}</Text>
                  </View>
                  <Text className={styles.traceDetail}>{record.operationDetail}</Text>
                  <Text className={styles.traceOperator}>
                    操作人：{record.operator}（{record.operatorRole}）
                    {record.ipAddress && ` · IP：${record.ipAddress}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View className={styles.footer}>
        <View
          className={`${styles.btn} ${canCancel() ? styles.btnSecondary : styles.btnDisabled}`}
          onClick={() => canCancel() && setShowCancelModal(true)}
        >
          撤销办件
        </View>
        <View
          className={`${styles.btn} ${canEvaluate() ? styles.btnPrimary : styles.btnDisabled}`}
          onClick={() => canEvaluate() && setShowRatingModal(true)}
        >
          服务评价
        </View>
      </View>

      {showCancelModal && (
        <View className={styles.cancelModal} onClick={() => !submitting && setShowCancelModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>确认撤销办件</Text>
            <Text className={styles.modalDesc}>
              撤销后办件将终止办理，已提交的材料将被保留。请确认是否继续？
            </Text>
            <View className={styles.modalReason}>
              <Text className={styles.reasonLabel}>撤销原因（必填）</Text>
              <Textarea
                className={styles.reasonInput}
                placeholder="请输入撤销原因..."
                value={cancelReason}
                onInput={e => setCancelReason(e.detail.value)}
                maxlength={200}
              />
            </View>
            <View className={styles.modalActions}>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                onClick={() => setShowCancelModal(false)}
              >
                取消
              </View>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnConfirm} ${submitting ? styles.btnDisabled : ''}`}
                onClick={!submitting ? handleCancel : undefined}
              >
                {submitting ? '提交中...' : '确认撤销'}
              </View>
            </View>
          </View>
        </View>
      )}

      {showRatingModal && (
        <View className={styles.ratingModal} onClick={() => !submitting && setShowRatingModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>服务评价</Text>
            <Text className={styles.modalSubtitle}>您的评价是我们改进服务的动力</Text>
            <View className={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Text
                  key={star}
                  className={`${styles.star} ${star <= rating ? styles.starActive : styles.starInactive}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </Text>
              ))}
            </View>
            <Text className={styles.ratingText}>{getRatingText(rating)}</Text>
            <Textarea
              className={styles.commentInput}
              placeholder="请输入您的评价和建议（选填）..."
              value={comment}
              onInput={e => setComment(e.detail.value)}
              maxlength={500}
            />
            <View className={styles.modalActions}>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                onClick={() => setShowRatingModal(false)}
              >
                取消
              </View>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnConfirm} ${submitting ? styles.btnDisabled : ''}`}
                onClick={!submitting ? handleEvaluate : undefined}
              >
                {submitting ? '提交中...' : '提交评价'}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MatterDetailPage;
