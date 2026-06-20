import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import PageContainer from '@/components/PageContainer';
import { getSignDocuments } from '@/services/signing';
import type { SignDocument } from '@/types';
import styles from './index.module.scss';

const typeIconMap: Record<string, string> = {
  application: '📝',
  agreement: '📄',
  declaration: '✅',
  certificate: '🏅'
};

const typeNameMap: Record<string, string> = {
  application: '申请书',
  agreement: '协议/章程',
  declaration: '承诺书',
  certificate: '证明文件'
};

const tabs = [
  { key: 'pending', label: '待签署' },
  { key: 'signing', label: '签署中' },
  { key: 'completed', label: '已完成' }
];

const SigningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [documents, setDocuments] = useState<SignDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getSignDocuments();
      const filtered = activeTab === 'completed'
        ? all.filter(d => d.status === 'completed')
        : activeTab === 'signing'
          ? all.filter(d => d.status === 'signing')
          : all.filter(d => d.status === 'pending' || d.status === 'signing');
      setDocuments(filtered);
    } catch (err: any) {
      console.error('[Signing] 加载签署文件失败:', err);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [activeTab]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  useDidShow(() => loadDocs());
  usePullDownRefresh(() => loadDocs());

  const handleView = (doc: SignDocument) => {
    console.log('[Signing] 查看文档:', doc.id);
    Taro.navigateTo({
      url: `/pages/sign-detail/index?id=${doc.id}`
    }).catch(console.error);
  };

  const handleSign = (doc: SignDocument) => {
    console.log('[Signing] 开始签署:', doc.id);
    Taro.navigateTo({
      url: `/pages/sign-detail/index?id=${doc.id}&action=sign`
    }).catch(console.error);
  };

  const getDeadlineLeft = (deadline: string) => {
    const d = dayjs(deadline);
    const hours = d.diff(dayjs(), 'hour');
    if (hours <= 0) return '已超时';
    if (hours < 24) return `${hours}小时`;
    const days = Math.floor(hours / 24);
    return `${days}天${hours % 24}小时`;
  };

  const getSignedCount = (doc: SignDocument) => {
    return doc.signPositions.filter(p => p.signedAt).length;
  };

  return (
    <PageContainer scroll safeBottom>
      {/* Tab切换 */}
      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.tabItemActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* 文件列表 */}
      {documents.length > 0 ? (
        documents.map(doc => {
          const signedCount = getSignedCount(doc);
          const progress = doc.signPositions.length > 0
            ? Math.round((signedCount / doc.signPositions.length) * 100)
            : 0;
          const isUrgent = doc.deadline
            ? dayjs(doc.deadline).diff(dayjs(), 'hour') < 24
            : false;

          return (
            <View
              key={doc.id}
              className={classnames(styles.docCard, isUrgent && activeTab === 'pending' && styles.docCardUrgent)}
              onClick={() => handleView(doc)}
            >
              <View className={styles.docHeader}>
                <View style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                  <View className={styles.docIconWrap}>
                    <Text className={styles.docIcon}>{typeIconMap[doc.documentType] || '📋'}</Text>
                  </View>
                  <View className={styles.docInfo}>
                    <Text className={styles.docName}>{doc.title}</Text>
                    <Text className={styles.docApply}>
                      {doc.applyName} · {typeNameMap[doc.documentType]} · 共{doc.pages}页
                    </Text>
                  </View>
                </View>
                <View className={classnames(
                  styles.docStatusTag,
                  doc.status === 'completed' ? styles.statusDone :
                  doc.status === 'signing' ? styles.statusSigning : styles.statusPending
                )}>
                  <Text>
                    {doc.status === 'completed' ? '已完成' :
                     doc.status === 'signing' ? '签署中' : '待签署'}
                  </Text>
                </View>
              </View>

              {isUrgent && activeTab === 'pending' && doc.deadline && (
                <View className={styles.deadlineUrgent}>
                  <Text className={styles.deadlineText}>⏰ 签署截止临近，请尽快处理</Text>
                  <Text className={styles.countdown}>{getDeadlineLeft(doc.deadline)}</Text>
                </View>
              )}

              <View className={styles.docMeta}>
                <View className={styles.metaItem}>
                  <Text className={styles.metaLabel}>编号：</Text>
                  <Text className={styles.metaValue}>{doc.id}</Text>
                </View>
                <View className={styles.metaItem}>
                  <Text className={styles.metaLabel}>创建：</Text>
                  <Text className={styles.metaValue}>{doc.createdAt?.slice(0, 16)}</Text>
                </View>
                <View className={styles.metaItem}>
                  <Text className={styles.metaLabel}>签署方：</Text>
                  <Text className={styles.metaValue}>{doc.requireSignerCount}方</Text>
                </View>
              </View>

              {doc.status !== 'completed' && (
                <View className={styles.signProgress}>
                  <View className={styles.progressHeader}>
                    <Text className={styles.progressText}>签署进度</Text>
                    <Text className={styles.progressValue}>{signedCount}/{doc.signPositions.length} · {progress}%</Text>
                  </View>
                  <View className={styles.progressBar}>
                    <View className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </View>
                </View>
              )}

              <View className={styles.signers}>
                {doc.signPositions.map((p, idx) => (
                  <View
                    key={idx}
                    className={classnames(styles.signerItem, p.signedAt && styles.signerItemDone)}
                  >
                    <View className={styles.signerDot} />
                    <Text className={styles.signerName}>
                      {p.signerName ? `${p.signerName}(${p.signerRole})` : p.signerRole}
                    </Text>
                  </View>
                ))}
              </View>

              <View className={styles.actions}>
                <Button className={classnames(styles.btn, styles.btnOutline)} onClick={(e) => { e.stopPropagation(); handleView(doc); }}>
                  预览文件
                </Button>
                {doc.status !== 'completed' ? (
                  <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={(e) => { e.stopPropagation(); handleSign(doc); }}>
                    {signedCount === 0 ? '立即签署' : '继续签署'}
                  </Button>
                ) : (
                  <Button className={classnames(styles.btn, styles.btnSuccess)} onClick={(e) => { e.stopPropagation(); handleView(doc); }}>
                    查看证书
                  </Button>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View style={{ textAlign: 'center', padding: '120rpx 0' }}>
          <Text style={{ fontSize: '120rpx', opacity: 0.3 }}>📄</Text>
          <Text style={{ display: 'block', color: '#86909C', marginTop: '24rpx', fontSize: '28rpx' }}>
            {activeTab === 'completed' ? '暂无已完成签署的文件' :
             activeTab === 'signing' ? '暂无签署中的文件' : '暂无待签署文件，干得漂亮！'}
          </Text>
        </View>
      )}
    </PageContainer>
  );
};

export default SigningPage;
