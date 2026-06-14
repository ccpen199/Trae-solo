import React, { useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import classnames from 'classnames';
import { mockServiceProviders } from '@/data/mockServices';
import type { ServiceProviderStatus } from '@/types';

const ProviderApplyPage: React.FC = () => {
  const tabs = [
    { key: 'pending', label: '待审核', badge: mockServiceProviders.filter(p => p.status === 'pending').length },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
  ];
  const [tab, setTab] = useState<string>('pending');

  const list = mockServiceProviders.filter(p => {
    if (tab === 'pending') return p.status === 'pending';
    if (tab === 'approved') return p.status === 'approved';
    if (tab === 'rejected') return p.status === 'rejected';
    return false;
  });

  const handleApprove = (id: string) => {
    Taro.showModal({
      title: '审核通过',
      content: '确认通过此服务商入驻申请？审核通过后可上架服务',
      success: (r) => {
        if (r.confirm) {
          Taro.showLoading({ title: '审核中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '已通过', icon: 'success' });
            console.log('[Provider] Approved:', id);
          }, 800);
        }
      },
    });
  };

  const handleReject = (id: string) => {
    Taro.showModal({
      title: '拒绝入驻',
      content: '确认拒绝此服务商的入驻申请？',
      confirmColor: '#EF4444',
      success: (r) => {
        if (r.confirm) {
          Taro.showToast({ title: '已拒绝', icon: 'none' });
          console.log('[Provider] Rejected:', id);
        }
      },
    });
  };

  return (
    <PageContainer>
      <View className={styles.tabs}>
        {tabs.map(t => (
          <View
            key={t.key}
            className={classnames(styles.tab, tab === t.key && styles.active)}
            onClick={() => setTab(t.key)}
          >
            <Text>{t.label}</Text>
            {t.badge && <View className={styles.badge}><Text>{t.badge}</Text></View>}
          </View>
        ))}
      </View>

      {list.length === 0 ? (
        <EmptyState title={`暂无${tab === 'pending' ? '待审核' : tab === 'approved' ? '已通过' : '已拒绝'}申请`} subTitle="请关注最新的入驻申请" icon="🏢" />
      ) : (
        list.map(p => (
          <View key={p.id} className={styles.applyCard}>
            <View className={styles.head}>
              <Image className={styles.logo} src={p.logo} mode="aspectFill" />
              <View className={styles.info}>
                <View style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Text className={styles.name}>{p.name}</Text>
                  <StatusBadge type={p.status === 'pending' ? 'warning' : p.status === 'approved' ? 'success' : 'error'} dot>
                    {p.status === 'pending' ? '待审核' : p.status === 'approved' ? '已通过' : '已拒绝'}
                  </StatusBadge>
                </View>
                <View className={styles.category}>
                  <Text>{p.category} · 联系人 {p.contactName}</Text>
                </View>
              </View>
            </View>
            <View className={styles.body}>
              <View className={styles.row}>
                <Text className={styles.label}>联系电话</Text>
                <Text className={styles.value}>{p.contactPhone}</Text>
              </View>
              <View className={styles.row}>
                <Text className={styles.label}>营业执照</Text>
                <Text className={styles.value}>{p.licenseNo || '已上传'}</Text>
              </View>
              <View className={styles.row}>
                <Text className={styles.label}>服务范围</Text>
                <Text className={styles.value}>{p.serviceScope}</Text>
              </View>
              <View className={styles.row}>
                <Text className={styles.label}>佣金比例</Text>
                <Text className={styles.value} style={{ color: '#EF4444' }}>{p.commissionRate}%</Text>
              </View>
              <View className={styles.row}>
                <Text className={styles.label}>提交时间</Text>
                <Text className={styles.value}>{p.createdAt}</Text>
              </View>
            </View>
            {p.status === 'pending' ? (
              <View className={styles.footer}>
                <View className={`${styles.btn} ${styles.reject}`} onClick={() => handleReject(p.id)}>
                  <Text>拒绝</Text>
                </View>
                <View className={`${styles.btn} ${styles.approve}`} onClick={() => handleApprove(p.id)}>
                  <Text>通过审核</Text>
                </View>
              </View>
            ) : (
              <View className={styles.footer}>
                <View
                  className={`${styles.btn} ${styles.view}`}
                  onClick={() => Taro.showToast({ title: '查看详情', icon: 'none' })}
                >
                  <Text>查看详情</Text>
                </View>
              </View>
            )}
          </View>
        ))
      )}
    </PageContainer>
  );
};

export default ProviderApplyPage;
