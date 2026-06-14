import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import SectionCard from '@/components/SectionCard';
import { categoryList, mockServiceItems, mockGroupBuys, mockProducts, mockLockerBoxes, mockProviders } from '@/data/mockServices';
import { useUserStore } from '@/store/useUserStore';

const subTabs = [
  { key: 'recommend', label: '推荐服务' },
  { key: 'groupbuy', label: '社区团购' },
  { key: 'mall', label: '便利商城' },
];

const ServicesPage: React.FC = () => {
  const [activeCat, setActiveCat] = useState<string>('all');
  const [subTab, setSubTab] = useState('recommend');
  const { user } = useUserStore();

  const pendingBoxes = mockLockerBoxes.filter((b) => b.status === 'occupied');

  const filteredServices = useMemo(() => {
    if (activeCat === 'all') return mockServiceItems;
    return mockServiceItems.filter((s) => s.category === activeCat);
  }, [activeCat]);

  const handleCategoryClick = (key: string) => {
    setActiveCat(key);
    if (key === 'delivery') {
      Taro.showToast({ title: `您有 ${pendingBoxes.length} 个包裹待取`, icon: 'none' });
    }
  };

  const handleServiceClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/service-detail/index?id=${id}` });
  };

  const handleLockerClick = (box: typeof mockLockerBoxes[0]) => {
    if (box.status === 'empty') {
      Taro.showToast({ title: '格口空闲', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: `${box.code} 取件信息`,
      content: `${box.expressCompany}\n取件码：${box.pickupCode}\n存入：${box.storedAt}\n请在 ${box.expireAt?.slice(5, 16)} 前取件`,
      showCancel: false,
      confirmText: '我知道了',
    });
  };

  return (
    <PageContainer>
      <View className={styles.categories}>
        <View
          className={`${styles.item} ${activeCat === 'all' ? styles.active : ''}`}
          onClick={() => handleCategoryClick('all')}
        >
          <View className={styles.icon} style={{ background: 'rgba(46, 124, 246, 0.1)' }}>
            <Text>🏠</Text>
          </View>
          <Text className={styles.label}>全部</Text>
        </View>
        {categoryList.map((c) => (
          <View
            key={c.key}
            className={`${styles.item} ${activeCat === c.key ? styles.active : ''}`}
            onClick={() => handleCategoryClick(c.key)}
          >
            <View className={styles.icon} style={{ background: `${c.color}15` }}>
              <Text>{c.icon}</Text>
            </View>
            <Text className={styles.label}>{c.name}</Text>
          </View>
        ))}
      </View>

      <View className={styles.banner}>
        <View className={styles.content}>
          <Text className={styles.label}>🏆 新人专享</Text>
          <Text className={styles.title}>首单立减30元</Text>
          <Text className={styles.desc}>保洁/维修/商城通用 · 限7天内</Text>
        </View>
        <Text className={styles.arrow}>›</Text>
      </View>

      {activeCat === 'all' || activeCat === 'delivery' ? (
        <SectionCard>
          <View className={styles.lockerHeader}>
            <View className={styles.left}>
              <Text className={styles.icon}>📦</Text>
              <Text className={styles.title}>丰巢快递柜</Text>
            </View>
            <Text className={styles.count}>
              待取件 <Text className={styles.num}>{pendingBoxes.length}</Text> 件
            </Text>
          </View>
          <View className={styles.lockerGrid}>
            {mockLockerBoxes.map((b) => {
              const isNear = b.status === 'occupied' && b.code.includes('02');
              return (
                <View
                  key={b.id}
                  className={`${styles.box} ${b.status === 'empty' ? styles.empty : isNear ? styles.nearExpire : styles.occupied}`}
                  onClick={() => handleLockerClick(b)}
                >
                  <Text className={styles.code}>{b.code}</Text>
                  <Text className={styles.sizeLabel}>
                    {b.size === 'small' ? '小' : b.size === 'medium' ? '中' : '大'}
                  </Text>
                </View>
              );
            })}
          </View>
        </SectionCard>
      ) : null}

      <View className={styles.tabs}>
        {subTabs.map((t) => (
          <View
            key={t.key}
            className={`${styles.tab} ${subTab === t.key ? styles.active : ''}`}
            onClick={() => setSubTab(t.key)}
          >
            <Text>{t.label}</Text>
          </View>
        ))}
      </View>

      {subTab === 'recommend' && (
        <SectionCard noHeader>
          <View className={styles.serviceList}>
            {filteredServices.map((s) => (
              <View key={s.id} className={styles.item} onClick={() => handleServiceClick(s.id)}>
                <Image className={styles.cover} src={s.cover} mode="aspectFill" />
                <View className={styles.info}>
                  <Text className={styles.title}>{s.title}</Text>
                  <View className={styles.tags}>
                    {s.tags.map((t) => (
                      <Text key={t} className={styles.tag}>{t}</Text>
                    ))}
                  </View>
                  <View className={styles.meta}>
                    <Text className={styles.rating}>⭐ {s.rating}分</Text>
                    <Text>已售{s.sales}</Text>
                    <Text>{s.providerName}</Text>
                  </View>
                  <View className={styles.bottom}>
                    <View className={styles.price}>
                      <Text className={styles.symbol}>¥</Text>
                      <Text className={styles.amount}>{s.price}</Text>
                      {s.originalPrice && <Text className={styles.origin}>¥{s.originalPrice}</Text>}
                    </View>
                    <View className={styles.buyBtn} onClick={(e) => { e.stopPropagation(); handleServiceClick(s.id); }}>
                      <Text>立即预约</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {subTab === 'groupbuy' && (
        <SectionCard noHeader>
          <View className={styles.groupbuyList}>
            {mockGroupBuys.map((g) => {
              const percent = Math.min(100, Math.round((g.currentCount / g.minCount) * 100));
              return (
                <View key={g.id} className={styles.item} onClick={() => handleServiceClick(g.id)}>
                  <Image className={styles.cover} src={g.cover} mode="aspectFill" />
                  <View className={styles.info}>
                    <Text className={styles.title}>{g.title}</Text>
                    <View className={styles.progressWrap}>
                      <View className={styles.bar}>
                        <View className={styles.fill} style={{ width: `${percent}%` }} />
                      </View>
                      <View className={styles.count}>
                        <Text>进度 <Text className={styles.num}>{percent}%</Text></Text>
                        <Text>还差 <Text className={styles.num}>{Math.max(0, g.minCount - g.currentCount)}</Text> 人成团</Text>
                      </View>
                    </View>
                    <View className={styles.bottom}>
                      <View className={styles.price}>
                        <Text className={styles.symbol}>¥</Text>
                        <Text className={styles.amount}>{g.price}</Text>
                        <Text className={styles.origin}>¥{g.originalPrice}</Text>
                      </View>
                      <View
                        className={styles.joinBtn}
                        onClick={(e) => { e.stopPropagation(); Taro.showToast({ title: '参团成功！', icon: 'success' }); }}
                      >
                        <Text>{g.status === 'full' ? '已满团' : '立即参团'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </SectionCard>
      )}

      {subTab === 'mall' && (
        <SectionCard noHeader>
          <View className={styles.serviceList}>
            {mockProducts.map((p) => (
              <View key={p.id} className={styles.item} onClick={() => handleServiceClick(p.id)}>
                <Image className={styles.cover} src={p.cover} mode="aspectFill" />
                <View className={styles.info}>
                  <Text className={styles.title}>{p.title}</Text>
                  <View className={styles.tags}>
                    {p.tags.map((t) => (
                      <Text key={t} className={styles.tag}>{t}</Text>
                    ))}
                  </View>
                  <View className={styles.meta}>
                    <Text className={styles.rating}>⭐ {p.rating}分</Text>
                    <Text>库存{p.stock}</Text>
                    <Text>已售{p.sales}</Text>
                  </View>
                  <View className={styles.bottom}>
                    <View className={styles.price}>
                      <Text className={styles.symbol}>¥</Text>
                      <Text className={styles.amount}>{p.price}</Text>
                      <Text className={styles.origin}>¥{p.originalPrice}</Text>
                    </View>
                    <View
                      className={styles.buyBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        Taro.showToast({ title: '已加入购物车', icon: 'success' });
                      }}
                    >
                      <Text>加入购物车</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      )}
    </PageContainer>
  );
};

export default ServicesPage;
