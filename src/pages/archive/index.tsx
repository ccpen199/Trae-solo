import React, { useState, useEffect, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useUserStore } from '@/store/useUserStore';
import { taskService } from '@/services/task';
import { logOperation } from '@/utils/logger';
import type { ArchiveRecord } from '@/types/task';

const ARCHIVE_TYPE_FILTERS = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'normal', label: '正常归档', icon: '✅' },
  { key: 'exception', label: '异常归档', icon: '⚠️' },
  { key: 'complaint', label: '投诉归档', icon: '📝' },
  { key: 'legal', label: '法务归档', icon: '⚖️' }
];

const ARCHIVE_TYPE_MAP: Record<string, { label: string; className: string }> = {
  normal: { label: '正常归档', className: styles.typeNormal },
  exception: { label: '异常归档', className: styles.typeException },
  complaint: { label: '投诉归档', className: styles.typeComplaint },
  legal: { label: '法务归档', className: styles.typeLegal }
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const copyToClipboard = (text: string, label: string) => {
  Taro.setClipboardData({
    data: text,
    success: () => {
      Taro.showToast({ title: `${label}已复制`, icon: 'success' });
    }
  });
};

const ArchivePage: React.FC = () => {
  const { user } = useUserStore();

  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const loadArchives = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const type = filterType === 'all' ? undefined : filterType;
      const data = await taskService.getArchives(type);
      setArchives(data);
    } catch (e) {
      console.error('[Archive] 加载归档列表失败:', e);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [filterType, user]);

  useEffect(() => {
    loadArchives();
  }, [loadArchives]);

  useDidShow(() => {
    loadArchives();
  });

  const handleFilterChange = (type: string) => {
    setFilterType(type);
  };

  const handleVerify = async (archive: ArchiveRecord) => {
    if (!user || verifyingId) return;

    setVerifyingId(archive.id);
    try {
      const success = await taskService.verifyArchive(archive.id, user.id, user.name);

      if (success) {
        setArchives(prev => prev.map(a =>
          a.id === archive.id
            ? { ...a, isVerified: true, verifyTime: Date.now() }
            : a
        ));

        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'archive',
          action: 'verify',
          targetType: 'archive',
          targetId: archive.id,
          targetName: `归档验证-${archive.waybillNo}`,
          status: 'success',
          complianceLevel: 'sensitive',
          retentionDays: archive.retentionYears * 365,
          requestParams: { archiveId: archive.id, waybillNo: archive.waybillNo },
          responseResult: { evidenceHash: archive.evidenceHash, isVerified: true }
        });
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '验证失败';
      console.error('[Archive] 验证失败:', e);

      if (user) {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'archive',
          action: 'verify',
          targetType: 'archive',
          targetId: archive.id,
          status: 'failed',
          errorMessage: errorMsg,
          complianceLevel: 'sensitive',
          retentionDays: 365
        });
      }

      Taro.showToast({ title: errorMsg, icon: 'none' });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleViewDetail = (archive: ArchiveRecord) => {
    Taro.showModal({
      title: '归档详情',
      content: `运单号: ${archive.waybillNo}\n归档类型: ${ARCHIVE_TYPE_MAP[archive.archiveType]?.label}\n归档人: ${archive.archivist}\n归档时间: ${formatDate(archive.archiveTime)}\n保留期限: ${archive.retentionYears}年\n存储路径: ${archive.storageUrl}`,
      showCancel: false
    });

    if (user) {
      logOperation({
        userId: user.id,
        userName: user.name,
        module: 'archive',
        action: 'view',
        targetType: 'archive',
        targetId: archive.id,
        targetName: `查看归档-${archive.waybillNo}`,
        status: 'success',
        complianceLevel: 'normal',
        retentionDays: 90
      });
    }
  };

  const handleCopyHash = (archive: ArchiveRecord) => {
    copyToClipboard(archive.evidenceHash, '证据哈希');

    if (user) {
      logOperation({
        userId: user.id,
        userName: user.name,
        module: 'archive',
        action: 'copy_hash',
        targetType: 'archive',
        targetId: archive.id,
        targetName: `复制哈希-${archive.waybillNo}`,
        status: 'success',
        complianceLevel: 'normal',
        retentionDays: 90
      });
    }
  };

  const handleCopyTxId = (archive: ArchiveRecord) => {
    if (archive.blockchainTxId) {
      copyToClipboard(archive.blockchainTxId, '交易哈希');

      if (user) {
        logOperation({
          userId: user.id,
          userName: user.name,
          module: 'archive',
          action: 'copy_txid',
          targetType: 'archive',
          targetId: archive.id,
          targetName: `复制交易ID-${archive.waybillNo}`,
          status: 'success',
          complianceLevel: 'normal',
          retentionDays: 90
        });
      }
    }
  };

  const stats = {
    total: archives.length,
    verified: archives.filter(a => a.isVerified).length,
    normal: archives.filter(a => a.archiveType === 'normal').length,
    exception: archives.filter(a => a.archiveType === 'exception').length,
    complaint: archives.filter(a => a.archiveType === 'complaint').length,
    legal: archives.filter(a => a.archiveType === 'legal').length
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>归档管理</Text>
        <Text className={styles.headerDesc}>运单归档记录及区块链存证信息，所有操作均留痕可追溯</Text>
      </View>

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats.total}</Text>
          <Text className={styles.statLabel}>总归档数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats.verified}</Text>
          <Text className={styles.statLabel}>已验证</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats.exception}</Text>
          <Text className={styles.statLabel}>异常归档</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats.legal}</Text>
          <Text className={styles.statLabel}>法务归档</Text>
        </View>
      </View>

      <View className={styles.filterBar}>
        {ARCHIVE_TYPE_FILTERS.map((filter) => (
          <View
            key={filter.key}
            className={classnames(styles.filterItem, filterType === filter.key && styles.active)}
            onClick={() => handleFilterChange(filter.key)}
          >
            <Text>{filter.icon} {filter.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.listContainer}>
        {loading ? (
          <View className={styles.loading}>加载中...</View>
        ) : archives.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.icon}>📦</Text>
            <Text className={styles.text}>暂无归档记录</Text>
          </View>
        ) : (
          archives.map((archive) => {
            const typeInfo = ARCHIVE_TYPE_MAP[archive.archiveType] || { label: '未知', className: '' };
            return (
              <View key={archive.id} className={styles.archiveCard}>
                <View className={styles.cardHeader}>
                  <View className={styles.waybillInfo}>
                    <Text className={styles.waybillNo}>{archive.waybillNo}</Text>
                    <Text className={classnames(styles.archiveType, typeInfo.className)}>
                      {typeInfo.label}
                    </Text>
                  </View>
                  <View className={classnames(styles.verifyBadge, !archive.isVerified && styles.unverified)}>
                    <Text>{archive.isVerified ? '✅' : '⏳'}</Text>
                    <Text>{archive.isVerified ? '已验证' : '待验证'}</Text>
                  </View>
                </View>

                <View className={styles.infoSection}>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>归档人</Text>
                    <Text className={styles.infoValue}>{archive.archivist}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>归档时间</Text>
                    <Text className={styles.infoValue}>{formatDate(archive.archiveTime)}</Text>
                  </View>
                  {archive.verifyTime && (
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>验证时间</Text>
                      <Text className={styles.infoValue}>{formatDate(archive.verifyTime)}</Text>
                    </View>
                  )}
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>保留期限</Text>
                    <Text className={styles.infoValue}>{archive.retentionYears}年</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>存储路径</Text>
                    <Text className={styles.infoValue}>{archive.storageUrl}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>证据哈希</Text>
                    <Text
                      className={styles.hashValue}
                      onClick={() => handleCopyHash(archive)}
                    >
                      {archive.evidenceHash.slice(0, 16)}...
                    </Text>
                  </View>
                </View>

                {archive.blockchainTxId && (
                  <View className={styles.blockchainSection}>
                    <Text className={styles.blockchainTitle}>
                      <Text>🔗</Text>
                      <Text>区块链存证信息</Text>
                    </Text>
                    <View className={styles.blockchainInfo}>
                      <Text className={styles.infoLabel}>交易哈希</Text>
                      <Text
                        className={styles.txId}
                        onClick={() => handleCopyTxId(archive)}
                      >
                        {archive.blockchainTxId.slice(0, 18)}...
                      </Text>
                    </View>
                    <View className={styles.blockchainInfo}>
                      <Text className={styles.infoLabel}>存证状态</Text>
                      <Text className={styles.infoValue} style={{ color: '$color-success' }}>
                        ✅ 已上链
                      </Text>
                    </View>
                  </View>
                )}

                <View className={styles.actionBar}>
                  <View
                    className={classnames(styles.actionBtn, styles.secondary)}
                    onClick={() => handleViewDetail(archive)}
                  >
                    <Text>📋</Text>
                    <Text>查看详情</Text>
                  </View>
                  <View
                    className={classnames(
                      styles.actionBtn,
                      styles.primary,
                      archive.isVerified && styles.disabled,
                      verifyingId === archive.id && styles.disabled
                    )}
                    onClick={() => handleVerify(archive)}
                  >
                    <Text>{verifyingId === archive.id ? '验证中...' : '🔍'}</Text>
                    <Text>{archive.isVerified ? '已验证' : verifyingId === archive.id ? '验证中...' : '验证归档'}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

export default ArchivePage;
