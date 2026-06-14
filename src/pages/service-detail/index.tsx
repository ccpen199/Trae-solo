import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import StatusBadge from '@/components/StatusBadge';
import { mockServiceItems, mockProducts, mockGroupBuys } from '@/data/mockServices';
import type { ServiceItem, Product, GroupBuy } from '@/types';

const ServiceDetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id || 'SI001';
  const kind = router.params.kind || 'service';

  const data = useMemo(() => {
    if (kind === 'product') {
      const p = mockProducts.find(x => x.id === id) || mockProducts[0];
      return {
        banner: p.images?.[0] || `https://picsum.photos/id/235/800/600`,
        providerName: p.providerName || '社区优选',
        providerAv: 'https://picsum.photos/id/237/100/100',
        title: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        sales: p.salesCount || 0,
        rating: p.rating || 4.8,
        soldCount: p.salesCount || 0,
        tags: ['七天无理由', '品质保证', '闪电发货'],
        description: p.description || '',
        images: p.images || [],
        isProduct: true,
      };
    }
    if (kind === 'group') {
      const g = mockGroupBuys.find(x => x.id === id) || mockGroupBuys[0];
      return {
        banner: g.image || `https://picsum.photos/id/236/800/600`,
        providerName: g.providerName || '社区团购',
        providerAv: 'https://picsum.photos/id/238/100/100',
        title: g.name,
        price: g.groupPrice,
        originalPrice: g.originalPrice,
        sales: g.joinCount,
        rating: 4.9,
        soldCount: g.joinCount,
        tags: ['团购优惠', '今日达', '原产地直供'],
        description: g.description || '',
        images: [g.image || ''],
        isGroup: true,
        groupProgress: g.progress,
        groupMin: g.minPeople,
      };
    }
    const s = mockServiceItems.find(x => x.id === id) || mockServiceItems[0];
    return {
      banner: s.image || `https://picsum.photos/id/234/800/600`,
      providerName: s.providerName,
      providerAv: 'https://picsum.photos/id/237/100/100',
      title: s.name,
      price: s.price,
      originalPrice: s.originalPrice,
      sales: s.orderCount || 0,
      rating: s.rating || 4.9,
      soldCount: s.orderCount || 0,
      tags: ['认证商家', '售后保障', '准时到达'],
      description: s.description || '',
      images: s.images || [],
    };
  }, [id, kind]);

  return (
    <PageContainer>
      <View className={styles.banner}>
        <Image className={styles.img} src={data.banner} mode="aspectFill" />
      </View>

      <View className={styles.infoWrap}>
        <View className={styles.provider}>
          <Image className={styles.av} src={data.providerAv} mode="aspectFill" />
          <View className={styles.info}>
            <View className={styles.name}>
              <Text>{data.providerName}</Text>
              <StatusBadge type="success"><Text>认证商家</Text></StatusBadge>
            </View>
            <View className={styles.meta}>
              <Text>⭐ {data.rating}</Text>
              <Text>|</Text>
              <Text>已售 {data.soldCount}+</Text>
              <Text>|</Text>
              <Text>30分钟上门</Text>
            </View>
          </View>
        </View>

        <View className={styles.nameRow}>
          <Text className={styles.title}>{data.title}</Text>
          <View className={styles.priceRow}>
            <View className={styles.new}>
              <Text className={styles.symbol}>¥</Text>
              <Text className={styles.num}>{data.price.toFixed(2)}</Text>
            </View>
            {data.originalPrice && (
              <Text className={styles.old}>¥{data.originalPrice.toFixed(2)}</Text>
            )}
            <Text className={styles.sales}>已售 {data.sales}+</Text>
          </View>
        </View>

        <View className={styles.tagsRow}>
          {data.tags.map((t, i) => (
            <View key={i} className={styles.tag}><Text>{t}</Text></View>
          ))}
        </View>

        {data.isGroup && (
          <View style={{ marginTop: 32, padding: 24, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 16 }}>
            <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 28, fontWeight: '600', color: '#10B981' }}>🔥 团购进行中</Text>
              <Text style={{ fontSize: 24, color: '#10B981' }}>还差{Math.max(0, data.groupMin - data.groupProgress)}人成团</Text>
            </View>
            <View style={{ height: 16, background: '#F5F7FA', borderRadius: 8, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${(data.groupProgress / data.groupMin) * 100}%`, background: 'linear-gradient(90deg, #10B981, #34D399)', borderRadius: 8 }} />
            </View>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.head}><Text>📝</Text><Text>服务详情</Text></View>
        <Text className={styles.content}>{data.description}</Text>
      </View>

      {data.images?.length > 0 && (
        <View className={styles.section}>
          <View className={styles.head}><Text>🖼️</Text><Text>展示图片</Text></View>
          <View className={styles.imgs}>
            {data.images.map((img, i) => (
              <Image key={i} className={styles.img} src={img} mode="aspectFill" />
            ))}
          </View>
        </View>
      )}

      <View style={{ height: '200rpx' }} />

      <View className={styles.bottomBar}>
        <View className={styles.icons}>
          <View className={styles.ic} onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
            <Text className={styles.icon}>🏠</Text>
            <Text className={styles.label}>首页</Text>
          </View>
          <View className={styles.ic} onClick={() => Taro.switchTab({ url: '/pages/services/index' })}>
            <Text className={styles.icon}>🛍️</Text>
            <Text className={styles.label}>商城</Text>
          </View>
          <View className={styles.ic} onClick={() => Taro.switchTab({ url: '/pages/mine/index' })}>
            <Text className={styles.icon}>💬</Text>
            <Text className={styles.label}>客服</Text>
          </View>
        </View>
        <View
          className={`${styles.btn} ${styles.cart}`}
          onClick={() => Taro.showToast({ title: '已加入购物车', icon: 'success' })}
        >
          <Text>加入购物车</Text>
        </View>
        <View
          className={`${styles.btn} ${styles.buy}`}
          onClick={() => Taro.showToast({ title: '下单功能开发中', icon: 'none' })}
        >
          <Text>立即{data.isProduct ? '购买' : '预约'}</Text>
        </View>
      </View>
    </PageContainer>
  );
};

export default ServiceDetailPage;
