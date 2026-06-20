import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Input, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import PageContainer from '@/components/PageContainer';
import ApplyCard from '@/components/ApplyCard';
import TodoItemCard from '@/components/TodoItem';
import { getRegistrationItems, getApplyRecords } from '@/services/apply';
import type { RegistrationItem, ApplyRecord } from '@/types';
import styles from './index.module.scss';

const categories = ['全部', '市场主体登记', '行政许可', '变更登记', '注销登记', '年度报告'];

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'submitted', label: '已提交' },
  { key: 'reviewing', label: '审核中' },
  { key: 'rejected', label: '已驳回' },
  { key: 'approved', label: '已通过' }
];

const ApplyPage: React.FC = () => {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [activeStatus, setActiveStatus] = useState('all');
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [myApplies, setMyApplies] = useState<ApplyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'service' | 'my'>('service');

  const initCategory = router.params.category || '';

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const cat = activeCategory === '全部' ? undefined : activeCategory;
      const data = await getRegistrationItems({ category: cat, keyword: keyword || undefined });
      setItems(data);
    } catch (err: any) {
      console.error('[Apply] 加载登记事项失败:', err);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [activeCategory, keyword]);

  const loadMyApplies = useCallback(async () => {
    try {
      const all = await getApplyRecords();
      if (activeStatus === 'all') {
        setMyApplies(all);
      } else {
        setMyApplies(all.filter(a => a.status === activeStatus));
      }
    } catch (err: any) {
      console.error('[Apply] 加载我的申请失败:', err);
    }
  }, [activeStatus]);

  useEffect(() => {
    if (initCategory && categories.includes(initCategory)) {
      setActiveCategory(initCategory);
    }
  }, [initCategory]);

  useEffect(() => {
    if (activeTab === 'service') {
      loadItems();
    } else {
      loadMyApplies();
    }
  }, [activeTab, loadItems, loadMyApplies]);

  useDidShow(() => {
    console.log('[Apply] useDidShow');
    if (activeTab === 'service') loadItems();
    else loadMyApplies();
  });

  usePullDownRefresh(() => {
    if (activeTab === 'service') loadItems();
    else loadMyApplies();
  });

  const handleItemClick = (item: RegistrationItem) => {
    console.log('[Apply] 选择事项:', item.code, item.name);
    Taro.navigateTo({
      url: `/pages/apply-detail/index?itemId=${item.id}`
    }).catch(console.error);
  };

  const handleApplyClick = (record: ApplyRecord) => {
    console.log('[Apply] 查看申请:', record.id);
    Taro.navigateTo({
      url: `/pages/approval-detail/index?id=${record.id}`
    }).catch(console.error);
  };

  const handleLicense = () => {
    Taro.navigateTo({ url: '/pages/certificate/index' }).catch(console.error);
  };

  return (
    <PageContainer scroll safeBottom>
      {/* 搜索栏 */}
      {activeTab === 'service' && (
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索登记事项名称/编号..."
            value={keyword}
            onInput={e => setKeyword(e.detail.value)}
            confirmType="search"
            onConfirm={loadItems}
          />
        </View>
      )}

      {/* Tab切换 */}
      <ScrollView scrollX className={styles.categoryBar}>
        <View
          className={classnames(styles.categoryItem, activeTab === 'service' && styles.categoryItemActive)}
          onClick={() => setActiveTab('service')}
        >
          <Text className={styles.categoryText}>办事大厅</Text>
        </View>
        <View
          className={classnames(styles.categoryItem, activeTab === 'my' && styles.categoryItemActive)}
          onClick={() => setActiveTab('my')}
        >
          <Text className={styles.categoryText}>我的申请 ({myApplies.length})</Text>
        </View>
      </ScrollView>

      {activeTab === 'service' ? (
        <>
          {/* 分类栏 */}
          <ScrollView scrollX className={styles.categoryBar}>
            {categories.map(cat => (
              <View
                key={cat}
                className={classnames(styles.categoryItem, activeCategory === cat && styles.categoryItemActive)}
                onClick={() => setActiveCategory(cat)}
              >
                <Text className={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </ScrollView>

          {/* 电子证照入口 */}
          <View className={styles.licenseBar} onClick={handleLicense}>
            <View className={styles.licenseInfo}>
              <View className={styles.licenseIcon}>
                <Text>🪪</Text>
              </View>
              <View className={styles.licenseContent}>
                <Text className={styles.licenseTitle}>我的电子证照库</Text>
                <Text className={styles.licenseSub}>已对接省级电子证照系统，可自动调用身份、营业执照等证照，无需重复上传材料</Text>
              </View>
            </View>
            <View className={styles.licenseAction}>
              <Text>查看 ›</Text>
            </View>
          </View>

          {/* 热门事项 */}
          <View className={styles.sectionTitleBar}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionTitleDot} />
              <Text>{activeCategory === '全部' ? '热门登记事项' : activeCategory}</Text>
            </View>
            {items.filter(i => i.isHot).length > 0 && (
              <View className={styles.hotBadge}>🔥 {items.filter(i => i.isHot).length}项热门服务</View>
            )}
          </View>

          {/* 事项列表 */}
          {items.length > 0 ? (
            items.map(item => <ApplyCard key={item.id} data={item} />)
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyText}>未找到相关登记事项</Text>
              <Button className={styles.emptyBtn} onClick={() => { setKeyword(''); setActiveCategory('全部'); }}>
                查看全部事项
              </Button>
            </View>
          )}
        </>
      ) : (
        <>
          {/* 状态筛选 */}
          <View className={styles.myApplyFilter}>
            {statusFilters.map(f => (
              <View
                key={f.key}
                className={classnames(styles.filterTag, activeStatus === f.key && styles.filterTagActive)}
                onClick={() => setActiveStatus(f.key)}
              >
                <Text>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* 申请列表 */}
          {myApplies.length > 0 ? (
            myApplies.map(record => (
              <View key={record.id} onClick={() => handleApplyClick(record)}>
                <TodoItemCard
                  data={{
                    id: record.id,
                    type: record.status === 'rejected' ? 'reject' :
                          record.status === 'approved' ? 'complete' :
                          record.status === 'reviewing' ? 'review' : 'sign',
                    title: `${record.itemName} · ${record.id}`,
                    description: record.status === 'rejected' && record.rejectReason
                      ? `驳回原因：${record.rejectReason.category}`
                      : `当前进度：${record.currentStep}/${record.totalSteps}步`,
                    relatedId: record.id,
                    priority: record.status === 'rejected' ? 'high' : 'medium',
                    createdAt: record.createdAt,
                    isRead: true
                  }}
                />
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📝</Text>
              <Text className={styles.emptyText}>暂无申请记录</Text>
              <Button className={styles.emptyBtn} onClick={() => setActiveTab('service')}>
                开始申办
              </Button>
            </View>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default ApplyPage;
