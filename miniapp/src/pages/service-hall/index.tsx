import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import SearchBar from '../../components/SearchBar';
import ServiceCard from '../../components/ServiceCard';
import AccessibilityFab from '../../components/AccessibilityFab';
import {
  mockServiceCategories,
  mockRecommendServices,
} from '../../data/mockServices';
import { GOVERNMENT_DEPARTMENTS } from '../../../shared/constants';
import { useAppStore } from '../../store/appStore';
import { useUserStore } from '../../store/userStore';
import classnames from 'classnames';
import type { GovernmentService } from '../../types';

const ServiceHallPage: React.FC = () => {
  const speak = useAppStore(s => s.speak);
  const { profile, addRecentService, recentServices, loadProfile } = useUserStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'category' | 'recommend'>('category');

  usePullDownRefresh(() => {
    loadProfile().finally(() => Taro.stopPullDownRefresh());
  });

  const allServices = useMemo<GovernmentService[]>(() => {
    return mockRecommendServices;
  }, []);

  const filteredServices = useMemo(() => {
    let result = allServices;
    if (selectedCategory !== 'all') {
      result = result.filter(s => s.category === selectedCategory);
    }
    if (selectedDept !== 'all') {
      const deptInfo = GOVERNMENT_DEPARTMENTS.find(d => d.code === selectedDept);
      if (deptInfo) {
        result = result.filter(s => s.department.includes(deptInfo.name.slice(0, 4)) || s.category === deptInfo.category);
      }
    }
    return result;
  }, [allServices, selectedCategory, selectedDept]);

  const hotRanked = useMemo(() => {
    return [...allServices].sort((a, b) => b.hotLevel - a.hotLevel).slice(0, 10);
  }, [allServices]);

  const recentServicesList = useMemo(() => {
    return recentServices
      .map(id => allServices.find(s => s.id === id))
      .filter(Boolean) as GovernmentService[];
  }, [recentServices, allServices]);

  const handleCategoryClick = useCallback((key: string) => {
    setSelectedCategory(key);
    const cat = mockServiceCategories.find(c => c.key === key);
    speak(cat ? `切换到${cat.name}分类` : '查看全部分类');
  }, [speak]);

  const handleDeptClick = useCallback((code: string) => {
    setSelectedDept(code);
    const dept = GOVERNMENT_DEPARTMENTS.find(d => d.code === code);
    speak(dept ? `筛选${dept.name}服务` : '全部委办局');
  }, [speak]);

  const handleServiceClick = useCallback((service: GovernmentService) => {
    speak(`${service.name}，进入详情页`);
    addRecentService(service.id);
    Taro.navigateTo({ url: `/pages/service-detail/index?id=${service.id}` });
  }, [speak, addRecentService]);

  const handleChatClick = () => {
    speak('打开小智智能问答');
    Taro.navigateTo({ url: '/pages/chat-qa/index' });
  };

  const getCategoryColor = (category: string) => {
    const cat = mockServiceCategories.find(c => c.key === category);
    return cat?.color || '#86909C';
  };

  return (
    <View className={styles.container}>
      <SearchBar
        placeholder="搜索办事、政策、问答..."
        showHotKeywords
      />

      <View className={styles.categoryTabs}>
        <View
          className={classnames(styles.tabItem, filterMode === 'category' && styles.active)}
          onClick={() => { setFilterMode('category'); speak('分类浏览'); }}
        >
          <Text>分类浏览</Text>
        </View>
        <View
          className={classnames(styles.tabItem, filterMode === 'recommend' && styles.active)}
          onClick={() => { setFilterMode('recommend'); speak('个性推荐'); }}
        >
          <Text>画像推荐</Text>
        </View>
      </View>

      <View className={styles.categoryGrid}>
        <View
          className={classnames(styles.categoryItem, selectedCategory === 'all' && styles.selected)}
          onClick={() => handleCategoryClick('all')}
        >
          <View className={styles.categoryIcon} style={{ backgroundColor: '#E8F0FC', color: '#1E4FA5' }}>
            <Text>📋</Text>
          </View>
          <Text className={styles.categoryName}>全部</Text>
          <Text className={styles.categoryCount}>{allServices.length}项</Text>
        </View>
        {mockServiceCategories.map(cat => (
          <View
            key={cat.key}
            className={classnames(styles.categoryItem, selectedCategory === cat.key && styles.selected)}
            onClick={() => handleCategoryClick(cat.key)}
          >
            <View className={styles.categoryIcon} style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
              <Text>{cat.icon}</Text>
            </View>
            <Text className={styles.categoryName}>{cat.name}</Text>
            <Text className={styles.categoryCount}>{cat.count}项</Text>
          </View>
        ))}
      </View>

      {recentServicesList.length > 0 && (
        <View className={styles.recentSection}>
          <View className={styles.sectionTitle}>
            <View className={styles.titleLeft}>
              <Text className={styles.titleIcon}>⏱️</Text>
              <Text>最近使用</Text>
            </View>
            <Text className={styles.moreLink}>清空</Text>
          </View>
          <ScrollView scrollX className={styles.recentScroll} enhanced showScrollbar={false}>
            {recentServicesList.map(service => (
              <View
                key={service.id}
                className={styles.recentItem}
                onClick={() => handleServiceClick(service)}
              >
                <View className={styles.recentIcon} style={{
                  backgroundColor: `${getCategoryColor(service.category)}15`,
                  color: getCategoryColor(service.category)
                }}>
                  <Text>{service.icon}</Text>
                </View>
                <Text className={styles.recentName}>{service.shortName}</Text>
                <Text className={styles.recentDept}>{service.department.slice(0, 8)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View className={styles.hotRankSection}>
        <View className={styles.sectionTitle}>
          <View className={styles.titleLeft}>
            <Text className={styles.titleIcon}>🔥</Text>
            <Text>高频事项榜</Text>
          </View>
          <Text className={styles.moreLink}>完整榜单 →</Text>
        </View>
        <View className={styles.rankList}>
          {hotRanked.map((service, idx) => (
            <View
              key={service.id}
              className={styles.rankItem}
              onClick={() => handleServiceClick(service)}
            >
              <View className={classnames(styles.rankBadge, idx < 3 && styles[`rank${idx + 1}`])}>
                <Text>{idx + 1}</Text>
              </View>
              <View className={styles.rankInfo}>
                <View className={styles.rankIcon} style={{
                  backgroundColor: `${getCategoryColor(service.category)}15`,
                  color: getCategoryColor(service.category)
                }}>
                  <Text>{service.icon}</Text>
                </View>
                <View className={styles.rankText}>
                  <Text className={styles.rankName}>{service.name}</Text>
                  <Text className={styles.rankDept}>{service.department}</Text>
                </View>
              </View>
              <View className={styles.hotValue}>
                <Text className={styles.hotNum}>{service.hotLevel}</Text>
                <Text className={styles.hotLabel}>热度值</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.deptSection}>
        <View className={styles.sectionTitle}>
          <View className={styles.titleLeft}>
            <Text className={styles.titleIcon}>🏛️</Text>
            <Text>按委办局</Text>
          </View>
        </View>
        <ScrollView scrollX className={styles.deptScroll} enhanced showScrollbar={false}>
          <View
            className={classnames(styles.deptChip, selectedDept === 'all' && styles.active)}
            onClick={() => handleDeptClick('all')}
          >
            <Text>全部</Text>
          </View>
          {GOVERNMENT_DEPARTMENTS.slice(0, 14).map(dept => (
            <View
              key={dept.code}
              className={classnames(styles.deptChip, selectedDept === dept.code && styles.active)}
              onClick={() => handleDeptClick(dept.code)}
            >
              <Text>{dept.name.slice(0, 6)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.serviceListSection}>
        <View className={styles.listHeader}>
          <Text className={styles.listTitle}>
            {filterMode === 'recommend' ? '为您推荐' : '办事服务列表'}
          </Text>
          <View className={styles.listMeta}>
            <Text>共 {filteredServices.length} 项</Text>
          </View>
        </View>

        {filteredServices.length > 0 ? (
          <View className={styles.serviceCards}>
            {filteredServices.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                layout="horizontal"
                onClick={handleServiceClick}
              />
            ))}
          </View>
        ) : (
          <View className={styles.emptyTip}>
            <Text className={styles.emptyIcon}>🔍</Text>
            <Text className={styles.emptyText}>该分类下暂无匹配的办事服务</Text>
            <Text
              style={{ color: '#1E4FA5', fontSize: '24rpx' }}
              onClick={() => { setSelectedCategory('all'); setSelectedDept('all'); }}
            >
              清除筛选条件
            </Text>
          </View>
        )}
      </View>

      <View className={styles.chatFab} onClick={handleChatClick}>
        <Text className={styles.chatFabIcon}>🤖</Text>
        <Text className={styles.chatFabText}>小智问答</Text>
        <View className={styles.chatFabBadge}>
          <Text>3</Text>
        </View>
      </View>

      <AccessibilityFab />
    </View>
  );
};

export default ServiceHallPage;
