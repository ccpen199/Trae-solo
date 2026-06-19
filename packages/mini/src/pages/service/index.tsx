import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockCategories, mockServices } from '@/data/service';
import ServiceCard from '@/components/ServiceCard';
import EmptyState from '@/components/EmptyState';

const ServicePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredServices = activeCategory
    ? mockServices.filter(s => s.categoryId === activeCategory)
    : mockServices;

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.banner}>
        <View className={styles.bannerText}>
          <Text className={styles.bannerTitle}>便民生活服务</Text>
          <Text className={styles.bannerDesc}>优质商家 · 极速上门 · 安心保障</Text>
        </View>
        <Text className={styles.bannerIcon}>🛎️</Text>
      </View>

      <View className={styles.categoryWrap}>
        <View className={styles.categoryGrid}>
          <View
            className={classnames(styles.categoryItem, !activeCategory && styles.activeCategory)}
            onClick={() => setActiveCategory(null)}
          >
            <View className={styles.categoryIcon}>🔥</View>
            <Text className={styles.categoryName}>全部</Text>
          </View>
          {mockCategories.map((cat) => (
            <View
              key={cat.id}
              className={classnames(styles.categoryItem, activeCategory === cat.id && styles.activeCategory)}
              onClick={() => setActiveCategory(cat.id)}
            >
              <View className={styles.categoryIcon}>
                <Text>{cat.icon}</Text>
              </View>
              <Text className={styles.categoryName}>{cat.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ padding: '0 32rpx 32rpx' }}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>
            {activeCategory ? mockCategories.find(c => c.id === activeCategory)?.name : '全部服务'}
          </Text>
          <Text className={styles.countText}>共 {filteredServices.length} 个</Text>
        </View>
      </View>

      {filteredServices.length > 0 ? (
        <View className={styles.serviceList}>
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </View>
      ) : (
        <EmptyState title="暂无服务" description="该分类下暂无服务，敬请期待" />
      )}
    </ScrollView>
  );
};

export default ServicePage;
