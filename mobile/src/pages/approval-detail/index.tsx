import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import PageContainer from '@/components/PageContainer';
import ProgressNodes from '@/components/ProgressNode';
import { downloadEvidence } from '@/services/signing';
import { getApplyDetail } from '@/services/apply';
import type { ApplyRecord } from '@/types';
import { mockApplyRecords } from '@/data/mock';
import styles from './index.module.scss';

const statusBannerMap: Record<string, { icon: string; title: string; desc: string; className: string }> = {
  draft: { icon: '📝', title: '草稿中', desc: '您的申请尚未提交，请尽快完善并提交', className: '' },
  submitted: { icon: '✅', title: '已提交', desc: '申请已成功提交，等待受理人员处理', className: 'submitted' },
  reviewing: { icon: '⏳', title: '审核中', desc: '您的申请正在按流程审核，请耐心等待', className: 'reviewing' },
  rejected: { icon: '❌', title: '已驳回', desc: '您的申请未能通过，请查看驳回原因并修改后重新提交', className: 'rejected' },
  approved: { icon: '🎉', title: '审批通过', desc: '恭喜！您的申请已顺利通过审批', className: 'approved' },
  completed: { icon: '🏆', title: '已完成', desc: '全部流程已完成，证照可下载使用', className: 'approved' }
};

const ApprovalDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.params;
  const [record, setRecord] = useState<ApplyRecord | null>(null);
  const [downloading, setDownloading] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    Taro.showLoading({ title: '加载中...', mask: true });
    try {
      const data = await getApplyDetail(id);
      setRecord(data);
    } catch (err: any) {
      console.error('[Approval] 加载失败:', err);
      const found = mockApplyRecords.find(r => r.id === id) || mockApplyRecords[0];
      setRecord(found);
    } finally {
      Taro.hideLoading();
      Taro.stopPullDownRefresh();
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);
  useDidShow(() => loadData());
  usePullDownRefresh(() => loadData());

  const handleDownloadEvidence = async () => {
    if (!record) return;
    setDownloading(true);
    Taro.showLoading({ title: '生成证据包...', mask: true });
    try {
      const pkg = await downloadEvidence(record.id);
      Taro.hideLoading();
      Taro.showModal({
        title: '证据包已生成',
        content: `文件名：${pkg.fileName}\n大小：${(pkg.size / 1024 / 1024).toFixed(2)}MB\n包含：${pkg.items.length} 个文件\n\n文件哈希：${pkg.fileHash.slice(0, 32)}...\n\n证据包符合《电子签名法》要求，可用于司法举证。`,
        confirmText: '下载到本地',
        cancelText: '保存云盘',
        success: (r) => Taro.showToast({ title: r.confirm ? '已开始下载' : '已保存到政务云盘', icon: 'success' })
      });
    } catch (err) {
      Taro.hideLoading();
      Taro.showModal({
        title: '证据包（演示）',
        content: '演示环境暂不可用，是否模拟完成？',
        success: (r) => r.confirm && Taro.showToast({ title: '已保存（演示）', icon: 'success' })
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleResubmit = () => {
    if (!record) return;
    Taro.navigateTo({
      url: `/pages/apply-detail/index?itemId=${record.itemId}&applyId=${record.id}`
    }).catch(console.error);
  };

  const handleContact = () => {
    Taro.showModal({
      title: '联系审核',
      content: '咨询热线：12315\n工作时间：周一至周五 9:00-17:30',
      showCancel: false,
      confirmColor: '#1E5DAB'
    });
  };

  if (!record) {
    return (
      <PageContainer safeBottom>
        <View style={{ textAlign: 'center', padding: '200rpx 0' }}>
          <Text style={{ fontSize: '80rpx', opacity: 0.3 }}>📊</Text>
          <Text style={{ color: '#86909C', marginTop: '24rpx' }}>加载中...</Text>
        </View>
      </PageContainer>
    );
  }

  const banner = statusBannerMap[record.status] || statusBannerMap.submitted;
  const showBottomBar = record.status === 'rejected' || record.status === 'approved';

  return (
    <>
      <PageContainer scroll padding safeBottom>
        <View className={styles.contentPadding}>
          <View className={classnames(styles.statusBanner, banner.className)}>
            <Text className={styles.statusBannerIcon}>{banner.icon}</Text>
            <Text className={styles.statusBannerTitle}>{banner.title}</Text>
            <Text className={styles.statusBannerDesc}>{banner.desc}</Text>
            <View className={styles.statusBadgeRow}>
              <View className={styles.smallBadge}><Text>进度 {record.currentStep}/{record.totalSteps}</Text></View>
              <View className={styles.smallBadge}><Text>编号 {record.id}</Text></View>
              <View className={styles.smallBadge}><Text>不见面审批</Text></View>
            </View>
          </View>

          <View className={styles.infoCard}>
            <View className={styles.sectionTitle}>
              <Text style={{ fontSize: '32rpx' }}>📋</Text>
              <Text>申请信息</Text>
            </View>
            <View className={styles.infoGrid}>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>事项名称</Text>
                <Text className={styles.infoValue}>{record.itemName}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>事项编号</Text>
                <Text className={styles.infoValue}>{record.itemCode}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>申请人</Text>
                <Text className={styles.infoValue}>
                  {record.applicantName}
                  {record.enterpriseName && ` · ${record.enterpriseName}
                </Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>提交时间</Text>
                <Text className={styles.infoValue}>{record.createdAt}</Text>
              </View>
            </View>
          </View>

          {record.status === 'rejected' && record.rejectReason && (
            <View className={styles.rejectCard}>
              <View className={styles.rejectHeader}>
                <View className={styles.rejectIcon}>⚠️</View>
                <Text className={styles.rejectTitle}>驳回原因详情</Text>
                <Text className={styles.rejectOperator}>
                  {record.rejectReason.operator} · {record.rejectReason.rejectedAt.slice(5, 16)}
                </Text>
              </View>
              <View className={styles.rejectCategory}>
                <Text className={styles.rejectCategoryLabel}>问题分类</Text>
                <Text className={styles.rejectCategoryName}>{record.rejectReason.category}</Text>
              </View>
              <Text style={{ fontSize: '24rpx', color: '#86909C', marginBottom: '12rpx' }}>
                具体问题（共 {record.rejectReason.reasons.length} 项）
              </Text>
              {record.rejectReason.reasons.map((r, idx) => (
                <View key={idx} className={styles.reasonItem}>
                  <Text className={styles.reasonField}>{idx + 1}. {r.field}</Text>
                  <Text className={styles.reasonMsg}>问题：{r.message}</Text>
                  {r.suggestion && (
                    <Text className={styles.reasonSuggestion}>💡 建议：{r.suggestion}</Text>
                  )}
                </View>
              ))}
              {record.rejectReason.remark && (
                <View className={styles.rejectRemark}>
                  <Text className={styles.rejectRemarkLabel}>审核员备注</Text>
                  <Text className={styles.rejectRemarkText}>{record.rejectReason.remark}</Text>
                </View>
              )}
            </View>
          )}

          <View className={styles.infoCard}>
            <View className={styles.sectionTitle}>
              <Text style={{ fontSize: '32rpx' }}>📊</Text>
              <Text>审批流程追踪</Text>
            </View>
            <ProgressNodes nodes={record.approvalNodes} currentStep={record.currentStep} />
          </View>

          {record.status === 'approved' && (
            <View className={styles.downloadBar}>
              <Text className={styles.downloadBarIcon}>📦</Text>
              <View className={styles.downloadBarInfo}>
                <Text className={styles.downloadBarTitle}>完整证据包已就绪</Text>
                <Text className={styles.downloadBarDesc}>
                  含签署文件、操作日志、时间戳、CA证书等 {record.approvalNodes.length + 4}项
                </Text>
              </View>
              <Button
                className={styles.downloadBarBtn}
                onClick={handleDownloadEvidence}
                loading={downloading}
              >
                下载
              </Button>
            </View>
          )}
        </View>
      </PageContainer>

      {showBottomBar && (
        <View className={styles.bottomBar}>
          <Button className={`${styles.barBtn} ${styles.btnOutline}`} onClick={handleContact}>
            联系审核
          </Button>
          {record.status === 'rejected' ? (
            <Button className={`${styles.barBtn} ${styles.btnPrimary}`} onClick={handleResubmit}>
              重新提交
            </Button>
          ) : (
            <Button
              className={`${styles.barBtn} ${styles.btnPrimary}`}
              onClick={handleDownloadEvidence}
              loading={downloading}
            >
              下载证据包
            </Button>
          )}
        </View>
      )}
    </>
  );
};

export default ApprovalDetailPage;
