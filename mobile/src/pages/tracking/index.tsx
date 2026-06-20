import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import PageContainer from '@/components/PageContainer';
import { getTrackList, getStatistics } from '@/services/tracking';
import { downloadEvidence } from '@/services/signing';
import type { ApplyRecord } from '@/types';
import styles from './index.module.scss';

const statusList = [
  { key: 'all', label: '全部' },
  { key: 'reviewing', label: '审核中' },
  { key: 'rejected', label: '被驳回' },
  { key: 'approved', label: '已通过' },
  { key: 'submitted', label: '待受理' },
  { key: 'draft', label: '草稿' }
];

const statusTextMap: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交待受理',
  reviewing: '审核中',
  rejected: '已驳回',
  approved: '审批通过',
  completed: '已完成'
};

const TrackingPage: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState('all');
  const [records, setRecords] = useState<ApplyRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ApplyRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, reviewing: 0, approved: 0, rejected: 0, pendingSign: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([getTrackList(), getStatistics()]);
      setRecords(list);
      setStats(s);
      applyFilter(list, activeStatus);
    } catch (err: any) {
      console.error('[Tracking] 加载数据失败:', err);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [activeStatus]);

  const applyFilter = (list: ApplyRecord[], status: string) => {
    if (status === 'all') {
      setFilteredRecords(list);
    } else {
      setFilteredRecords(list.filter(r => r.status === status));
    }
  };

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    applyFilter(records, activeStatus);
  }, [activeStatus, records]);

  useDidShow(() => loadData());
  usePullDownRefresh(() => loadData());

  const handleViewDetail = (id: string) => {
    Taro.navigateTo({
      url: `/pages/approval-detail/index?id=${id}`
    }).catch(console.error);
  };

  const handleResubmit = (record: ApplyRecord) => {
    console.log('[Tracking] 重新提交申请:', record.id);
    Taro.navigateTo({
      url: `/pages/apply-detail/index?itemId=${record.itemId}&applyId=${record.id}`
    }).catch(console.error);
  };

  const handleDownloadEvidence = async (record: ApplyRecord) => {
    console.log('[Tracking] 下载证据包:', record.id);
    Taro.showLoading({ title: '生成证据包中...', mask: true });
    try {
      const pkg = await downloadEvidence(record.id);
      Taro.hideLoading();
      Taro.showModal({
        title: '证据包已生成',
        content: `文件名：${pkg.fileName}\n大小：${(pkg.size / 1024 / 1024).toFixed(2)}MB\n包含：${pkg.items.join('、')}\n\n文件哈希：${pkg.fileHash.slice(0, 32)}...\n\n证据包可用于司法举证，具有法律效力`,
        confirmText: '下载到本地',
        cancelText: '关闭',
        success: (res) => {
          if (res.confirm) {
            Taro.showToast({ title: '已保存到政务云盘', icon: 'success' });
          }
        }
      });
    } catch (err: any) {
      Taro.hideLoading();
      console.error('[Tracking] 证据包生成失败:', err);
      Taro.showToast({ title: '证据包生成失败', icon: 'none' });
    }
  };

  const getStepText = (nodes: any[], step: number) => {
    const current = nodes[step - 1];
    const total = nodes.length;
    return current ? current.name : `第${step}步`;
  };

  return (
    <PageContainer scroll safeBottom>
      {/* 统计概览 */}
      <View className={styles.statsRow}>
        <View className={styles.statBlock} onClick={() => setActiveStatus('all')}>
          <Text className={styles.statNum} style={{ color: '#1E5DAB' }}>{stats.total}</Text>
          <Text className={styles.statLabel}>全部申请</Text>
        </View>
        <View className={styles.statBlock} onClick={() => setActiveStatus('reviewing')}>
          <Text className={styles.statNum} style={{ color: '#FF7D00' }}>{stats.reviewing}</Text>
          <Text className={styles.statLabel}>审核中</Text>
        </View>
        <View className={styles.statBlock} onClick={() => setActiveStatus('approved')}>
          <Text className={styles.statNum} style={{ color: '#00B42A' }}>{stats.approved}</Text>
          <Text className={styles.statLabel}>已通过</Text>
        </View>
        <View className={styles.statBlock} onClick={() => setActiveStatus('rejected')}>
          <Text className={styles.statNum} style={{ color: '#F53F3F' }}>{stats.rejected}</Text>
          <Text className={styles.statLabel}>被驳回</Text>
        </View>
      </View>

      {/* 状态筛选 */}
      <View style={{ display: 'flex', flexWrap: 'wrap', gap: '16rpx', marginBottom: '32rpx' }}>
        {statusList.map(s => (
          <View
            key={s.key}
            className={classnames(styles.filterItem, activeStatus === s.key && styles.filterItemActive)}
            onClick={() => setActiveStatus(s.key)}
          >
            <Text>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* 追踪卡片列表 */}
      {filteredRecords.length > 0 ? (
        filteredRecords.map(record => {
          const progress = record.totalSteps > 0
            ? Math.round(((record.currentStep - (record.status === 'rejected' ? 0 : 0)) / record.totalSteps) * 100)
            : 0;

          return (
            <View key={record.id} className={styles.trackCard}>
              <View className={styles.trackHeader}>
                <View className={styles.trackInfo}>
                  <Text className={styles.trackName}>{record.itemName}</Text>
                  <View className={styles.trackMeta}>
                    <Text>编号：{record.id}</Text>
                    <Text>提交：{record.createdAt?.slice(0, 10)}</Text>
                  </View>
                </View>
                <View className={classnames(
                  styles.trackStatus,
                  record.status === 'draft' && styles.statusDraft,
                  record.status === 'submitted' && styles.statusSubmitted,
                  record.status === 'reviewing' && styles.statusReviewing,
                  record.status === 'rejected' && styles.statusRejected,
                  (record.status === 'approved' || record.status === 'completed') && styles.statusApproved
                )}>
                  <Text>{statusTextMap[record.status] || record.status}</Text>
                </View>
              </View>

              {record.status === 'approved' && (
                <View className={styles.approvedBar}>
                  <View className={styles.approvedInfo}>
                    <Text className={styles.approvedIcon}>🎉</Text>
                    <View>
                      <Text className={styles.approvedText}>审批通过！证照已生成</Text>
                      <Text className={styles.approvedTime}>完成时间：{record.updatedAt?.slice(0, 16)}</Text>
                    </View>
                  </View>
                  <View className={styles.downloadBtn}>
                    <Text>下载证照</Text>
                  </View>
                </View>
              )}

              {record.status === 'rejected' && record.rejectReason && (
                <View className={styles.rejectBar} onClick={() => handleViewDetail(record.id)}>
                  <Text className={styles.rejectIcon}>⚠️</Text>
                  <View className={styles.rejectContent}>
                    <Text className={styles.rejectLabel}>
                      被驳回：{record.rejectReason.category}
                    </Text>
                    <Text className={styles.rejectMsg}>
                      {record.rejectReason.reasons?.map(r => r.message).join('；') || record.rejectReason.remark}
                      点击查看详细原因和修改建议
                    </Text>
                  </View>
                </View>
              )}

              {record.status !== 'draft' && record.status !== 'completed' && record.approvalNodes.length > 0 && (
                <View className={styles.progressWrap}>
                  <View className={styles.progressBar}>
                    <View
                      className={styles.progressFill}
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        background: record.status === 'rejected'
                          ? 'linear-gradient(135deg, #F53F3F, #D32F2F)'
                          : 'linear-gradient(135deg, #1E5DAB, #3A7BD5)'
                      }}
                    >
                      <View className={styles.progressNodes}>
                        {record.approvalNodes.map((_, idx) => (
                          <View key={idx} className={styles.nodeDot} />
                        ))}
                      </View>
                    </View>
                  </View>
                  <View className={styles.progressText}>
                    {record.approvalNodes.map((node, idx) => {
                      const step = idx + 1;
                      const isDone = step < record.currentStep ||
                        (step === record.currentStep && (node.status === 'approved' || node.status === 'rejected'));
                      const isActive = step === record.currentStep && node.status !== 'approved' && node.status !== 'rejected';
                      return (
                        <Text
                          key={node.id}
                          className={classnames(
                            styles.stepText,
                            isDone && styles.done,
                            isActive && styles.active
                          )}
                        >
                          {node.name}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              )}

              <View className={styles.cardActions}>
                <Button
                  className={classnames(styles.actionBtn, styles.btnDetail)}
                  onClick={() => handleViewDetail(record.id)}
                >
                  详情/进度
                </Button>
                {record.status === 'approved' && (
                  <Button
                    className={classnames(styles.actionBtn, styles.btnEvidence)}
                    onClick={() => handleDownloadEvidence(record)}
                  >
                    证据包
                  </Button>
                )}
                {record.status === 'rejected' && (
                  <Button
                    className={classnames(styles.actionBtn, styles.btnResubmit)}
                    onClick={() => handleResubmit(record)}
                  >
                    重新提交
                  </Button>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View style={{ textAlign: 'center', padding: '120rpx 0' }}>
          <Text style={{ fontSize: '120rpx', opacity: 0.3 }}>📊</Text>
          <Text style={{ display: 'block', color: '#86909C', marginTop: '24rpx', fontSize: '28rpx' }}>
            暂无符合条件的申请记录
          </Text>
        </View>
      )}
    </PageContainer>
  );
};

export default TrackingPage;
