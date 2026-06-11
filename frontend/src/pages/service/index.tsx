import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { PageHeader, ServiceCard, MatterItem } from '@/components';
import { getServiceCategories, getServiceList, getMatterList, getMatterStats, getCrossProvinceServices } from '@/services/matter';
import { getCoordinationStats } from '@/services/crossProvince';
import type { ServiceItem, ServiceCategory, Matter } from '@/types/matter';
import type { CrossProvinceService } from '@/types/crossProvince';
import styles from './index.module.scss';

type TabType = 'service' | 'matter' | 'cross';

const ServicePage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('service');
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [matterStatusFilter, setMatterStatusFilter] = useState<string[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceItem[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [filteredMatters, setFilteredMatters] = useState<Matter[]>([]);
  const [matterStats, setMatterStats] = useState<any>(null);
  const [crossServices, setCrossServices] = useState<CrossProvinceService[]>([]);
  const [coordinationStats, setCoordinationStats] = useState<any>(null);

  const tabs = [
    { key: 'service', name: '全部服务' },
    { key: 'matter', name: '我的办件' },
    { key: 'cross', name: '跨省通办' }
  ];

  const matterStatusTabs = [
    { key: 'all', name: '全部', value: [] },
    { key: 'processing', name: '办理中', value: ['submitted', 'reviewing', 'material_required', 'payment_required'] },
    { key: 'completed', name: '已完成', value: ['completed', 'approved'] },
    { key: 'rejected', name: '已驳回', value: ['rejected', 'cancelled'] }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, svs, mats, stats, crossSv, coordStats] = await Promise.all([
        getServiceCategories(),
        getServiceList(),
        getMatterList(),
        getMatterStats(),
        getCrossProvinceServices(),
        getCoordinationStats()
      ]);

      setCategories(cats);
      setServices(svs);
      setFilteredServices(svs);
      setMatters(mats.list);
      setFilteredMatters(mats.list);
      setMatterStats(stats);
      setCrossServices(crossSv);
      setCoordinationStats(coordStats);

      if (router.params.keyword) {
        const keyword = decodeURIComponent(router.params.keyword as string);
        setSearchText(keyword);
        filterServices(keyword);
      }
    } catch (error) {
      console.error('[ServicePage] 加载数据失败', error);
    } finally {
      setLoading(false);
    }
  }, [router.params.keyword]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    loadData();
  });

  const filterServices = (keyword: string) => {
    if (!keyword.trim()) {
      setFilteredServices(services);
      return;
    }
    const kw = keyword.toLowerCase();
    const filtered = services.filter(s =>
      s.serviceName.toLowerCase().includes(kw) ||
      s.serviceCode.toLowerCase().includes(kw) ||
      s.description.toLowerCase().includes(kw) ||
      s.category.toLowerCase().includes(kw)
    );
    setFilteredServices(filtered);
  };

  const handleSearch = () => {
    if (activeTab === 'service') {
      filterServices(searchText);
    } else if (activeTab === 'matter') {
      if (!searchText.trim()) {
        setFilteredMatters(matters);
        return;
      }
      const kw = searchText.toLowerCase();
      const filtered = matters.filter(m =>
        m.matterName.toLowerCase().includes(kw) ||
        m.matterCode.toLowerCase().includes(kw)
      );
      setFilteredMatters(filtered);
    }
  };

  const handleCategoryClick = (categoryCode: string) => {
    setActiveCategory(categoryCode);
    if (categoryCode === 'all') {
      setFilteredServices(services);
    } else {
      setFilteredServices(services.filter(s => s.category === categories.find(c => c.code === categoryCode)?.name));
    }
  };

  const handleMatterStatusClick = (statusTab: any) => {
    setMatterStatusFilter(statusTab.value);
    if (statusTab.value.length === 0) {
      setFilteredMatters(matters);
    } else {
      setFilteredMatters(matters.filter(m => statusTab.value.includes(m.status)));
    }
  };

  const handleServiceClick = (service: ServiceItem) => {
    Taro.navigateTo({
      url: `/pages/service/detail?serviceCode=${service.serviceCode}`
    });
  };

  const handleMatterClick = (matter: Matter) => {
    Taro.navigateTo({
      url: `/pages/matter/detail?id=${matter.id}`
    });
  };

  const handleCrossServiceClick = (service: CrossProvinceService) => {
    Taro.navigateTo({
      url: `/pages/service/detail?serviceCode=${service.serviceCode}&cross=1`
    });
  };

  const handleApplyMatter = () => {
    Taro.navigateTo({ url: '/pages/matter/apply' });
  };

  const getStatusCount = (status: string) => {
    if (!matterStats) return 0;
    const map: Record<string, number> = {
      processing: matterStats.processing,
      completed: matterStats.completed,
      rejected: matterStats.rejected
    };
    return map[status] || 0;
  };

  return (
    <View className={styles.page}>
      <PageHeader
        title="服务大厅"
        subtitle="全量人社业务 一站式办理"
      />

      <View className={styles.searchBar}>
        <View className={styles.searchInputWrap}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder={activeTab === 'service' ? '搜索服务名称、编码' : '搜索办件名称、编号'}
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
        <View className={styles.searchBtn} onClick={handleSearch}>搜索</View>
      </View>

      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <Text className={styles.tabName}>{tab.name}</Text>
            {activeTab === tab.key && <View className={styles.tabIndicator} />}
          </View>
        ))}
      </View>

      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        {activeTab === 'service' && (
          <View>
            <ScrollView className={styles.categoryScroll} scrollX>
              <View className={styles.categoryList}>
                <View
                  className={`${styles.categoryItem} ${activeCategory === 'all' ? styles.categoryItemActive : ''}`}
                  onClick={() => handleCategoryClick('all')}
                >
                  <Text className={styles.categoryIcon}>📋</Text>
                  <Text className={styles.categoryName}>全部</Text>
                </View>
                {categories.map(cat => (
                  <View
                    key={cat.code}
                    className={`${styles.categoryItem} ${activeCategory === cat.code ? styles.categoryItemActive : ''}`}
                    onClick={() => handleCategoryClick(cat.code)}
                  >
                    <Text className={styles.categoryIcon}>{cat.icon}</Text>
                    <Text className={styles.categoryName}>{cat.name}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View className={styles.section}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>
                  {activeCategory === 'all' ? '全部服务' : categories.find(c => c.code === activeCategory)?.name}
                </Text>
                <Text className={styles.sectionCount}>共 {filteredServices.length} 项</Text>
              </View>
              <View className={styles.serviceList}>
                {filteredServices.map(service => (
                  <ServiceCard
                    key={service.serviceCode}
                    service={service}
                    showDescription
                    onClick={handleServiceClick}
                  />
                ))}
                {filteredServices.length === 0 && (
                  <View className={styles.empty}>
                    <Text className={styles.emptyIcon}>🔍</Text>
                    <Text className={styles.emptyText}>未找到相关服务</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'matter' && (
          <View>
            {matterStats && (
              <View className={styles.matterStats}>
                <View className={styles.statItem}>
                  <Text className={styles.statValue}>{matterStats.total}</Text>
                  <Text className={styles.statLabel}>全部</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statValue} style={{ color: '#1890FF' }}>{matterStats.processing}</Text>
                  <Text className={styles.statLabel}>办理中</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statValue} style={{ color: '#52C41A' }}>{matterStats.completed}</Text>
                  <Text className={styles.statLabel}>已完成</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statValue} style={{ color: '#F5222D' }}>{matterStats.rejected}</Text>
                  <Text className={styles.statLabel}>已驳回</Text>
                </View>
              </View>
            )}

            <View className={styles.statusTabs}>
              {matterStatusTabs.map(tab => (
                <View
                  key={tab.key}
                  className={`${styles.statusTab} ${JSON.stringify(matterStatusFilter) === JSON.stringify(tab.value) ? styles.statusTabActive : ''}`}
                  onClick={() => handleMatterStatusClick(tab)}
                >
                  <Text className={styles.statusTabName}>{tab.name}</Text>
                  {tab.key !== 'all' && getStatusCount(tab.key) > 0 && (
                    <View className={styles.statusTabBadge}>{getStatusCount(tab.key)}</View>
                  )}
                </View>
              ))}
            </View>

            <View className={styles.section}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>办件列表</Text>
                <View className={styles.applyBtn} onClick={handleApplyMatter}>
                  <Text className={styles.applyBtnIcon}>+</Text>
                  <Text className={styles.applyBtnText}>新建办件</Text>
                </View>
              </View>
              <View className={styles.matterList}>
                {filteredMatters.map(matter => (
                  <MatterItem
                    key={matter.id}
                    matter={matter}
                    onClick={handleMatterClick}
                  />
                ))}
                {filteredMatters.length === 0 && (
                  <View className={styles.empty}>
                    <Text className={styles.emptyIcon}>📋</Text>
                    <Text className={styles.emptyText}>暂无办件记录</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'cross' && (
          <View>
            {coordinationStats && (
              <View className={styles.crossStats}>
                <View className={styles.crossStatsHeader}>
                  <Text className={styles.crossStatsTitle}>长三角协同调度中心</Text>
                  <Text className={styles.crossStatsSubtitle}>实时监控 · 智能调度 · 数据互通</Text>
                </View>
                <View className={styles.crossStatsGrid}>
                  <View className={styles.crossStatItem}>
                    <Text className={styles.crossStatValue}>{coordinationStats.todayTasks}</Text>
                    <Text className={styles.crossStatLabel}>今日办件</Text>
                  </View>
                  <View className={styles.crossStatItem}>
                    <Text className={styles.crossStatValue} style={{ color: '#52C41A' }}>{coordinationStats.successRate}%</Text>
                    <Text className={styles.crossStatLabel}>成功率</Text>
                  </View>
                  <View className={styles.crossStatItem}>
                    <Text className={styles.crossStatValue} style={{ color: '#1890FF' }}>{coordinationStats.activeNodes}</Text>
                    <Text className={styles.crossStatLabel}>协同节点</Text>
                  </View>
                  <View className={styles.crossStatItem}>
                    <Text className={styles.crossStatValue} style={{ color: '#722ED1' }}>{coordinationStats.averageResponseTime}ms</Text>
                    <Text className={styles.crossStatLabel}>平均响应</Text>
                  </View>
                </View>
              </View>
            )}

            <View className={styles.provinceMap}>
              <View className={styles.provinceMapHeader}>
                <Text className={styles.provinceMapTitle}>长三角协同节点</Text>
              </View>
              <View className={styles.provinceList}>
                {['江苏', '上海', '浙江', '安徽'].map((province, index) => (
                  <View key={province} className={styles.provinceItem}>
                    <View className={styles.provinceDot} style={{ background: ['#1890FF', '#52C41A', '#FA8C16', '#722ED1'][index] }} />
                    <Text className={styles.provinceName}>{province}</Text>
                    <View className={styles.provinceStatus}>
                      <View className={styles.provinceStatusDot} />
                      <Text className={styles.provinceStatusText}>在线</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.section}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>跨省通办服务</Text>
                <Text className={styles.sectionCount}>共 {crossServices.length} 项</Text>
              </View>
              <View className={styles.crossServiceList}>
                {crossServices.map(service => (
                  <View key={service.id} className={styles.crossServiceItem} onClick={() => handleCrossServiceClick(service)}>
                    <View className={styles.crossServiceHeader}>
                      <View className={styles.crossServiceName}>
                        <Text className={styles.crossServiceNameText}>{service.serviceName}</Text>
                        <View className={styles.crossTag}>跨省通办</View>
                      </View>
                      <View className={styles.crossServiceRate}>
                        <Text className={styles.crossServiceRateValue}>{service.successRate}%</Text>
                        <Text className={styles.crossServiceRateLabel}>成功率</Text>
                      </View>
                    </View>
                    <Text className={styles.crossServiceDesc}>{service.description}</Text>
                    <View className={styles.crossServiceFooter}>
                      <View className={styles.crossServiceProvinces}>
                        <Text className={styles.crossServiceProvincesLabel}>支持地区：</Text>
                        <View className={styles.crossServiceProvinceTags}>
                          {service.supportedProvinces.map(p => (
                            <View key={p} className={styles.crossServiceProvinceTag}>{p}</View>
                          ))}
                        </View>
                      </View>
                      <View className={styles.crossServiceBtn}>立即办理</View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View className={styles.footer}>
          <Text className={styles.footerText}>— 服务事项由江苏省人力资源和社会保障厅提供 —</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ServicePage;
