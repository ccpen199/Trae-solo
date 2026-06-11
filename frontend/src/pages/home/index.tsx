import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Input, Swiper, SwiperItem, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { PageHeader, ServiceCard, MatterItem, LicenseCard } from '@/components';
import { getHomeServices, getHotServices, getMatterList, getServiceCategories } from '@/services/matter';
import { getECardInfo, getLicenseList } from '@/services/license';
import { getRecommendServices } from '@/services/recommend';
import { getUnreadCount } from '@/services/message';
import { getCurrentUser } from '@/services/auth';
import type { ServiceItem, Matter, ServiceCategory } from '@/types/matter';
import type { License, ECardInfo } from '@/types/license';
import type { RecommendService } from '@/types/recommend';
import { formatMoney } from '@/utils/format';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [eCardInfo, setECardInfo] = useState<ECardInfo | null>(null);
  const [homeServices, setHomeServices] = useState<ServiceItem[]>([]);
  const [hotServices, setHotServices] = useState<ServiceItem[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [recentMatters, setRecentMatters] = useState<Matter[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [recommendServices, setRecommendServices] = useState<RecommendService[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  const banners = [
    { id: 1, title: '养老待遇资格认证', desc: '足不出户完成认证', color: '#1890FF' },
    { id: 2, title: '电子社保卡申领', desc: '扫码即可使用', color: '#52C41A' },
    { id: 3, title: '长三角跨省通办', desc: '异地办事不求人', color: '#722ED1' }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        user,
        eCard,
        homeSvs,
        hotSvs,
        categories,
        matters,
        licenseList,
        recommends,
        unread
      ] = await Promise.all([
        getCurrentUser(),
        getECardInfo(),
        getHomeServices(),
        getHotServices(8),
        getServiceCategories(),
        getMatterList({ page: 1, pageSize: 3 }),
        getLicenseList(),
        getRecommendServices(4),
        getUnreadCount()
      ]);

      setUserInfo(user);
      setECardInfo(eCard);
      setHomeServices(homeSvs);
      setHotServices(hotSvs);
      setServiceCategories(categories);
      setRecentMatters(matters.list);
      setLicenses(licenseList.slice(0, 3));
      setRecommendServices(recommends);
      setUnreadCount(unread);
    } catch (error) {
      console.error('[HomePage] 加载数据失败', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    loadData();
  });

  const handleRefresh = () => {
    loadData();
  };

  const handleSearch = () => {
    if (!searchText.trim()) return;
    Taro.navigateTo({
      url: `/pages/service/index?keyword=${encodeURIComponent(searchText)}`
    });
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

  const handleLicenseClick = (license: License) => {
    Taro.navigateTo({
      url: `/pages/license/detail?id=${license.id}`
    });
  };

  const handleRecommendClick = (rec: RecommendService) => {
    Taro.navigateTo({
      url: `/pages/service/detail?serviceCode=${rec.serviceCode}`
    });
  };

  const handleECardClick = () => {
    Taro.switchTab({ url: '/pages/license/index' });
  };

  const handleMessageClick = () => {
    Taro.switchTab({ url: '/pages/message/index' });
  };

  const handleScanCode = () => {
    Taro.navigateTo({ url: '/pages/license/verify' });
  };

  return (
    <View className={styles.page}>
      <PageHeader 
        title={`你好，${userInfo?.name || '用户'}`}
        subtitle={`欢迎使用江苏人社服务 · ${userInfo?.level || 'Lv.1'}`}
      />

      <View className={styles.searchBar}>
        <View className={styles.searchInputWrap}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索服务、办件、政策"
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
        <View className={styles.scanBtn} onClick={handleScanCode}>
          <Text className={styles.scanIcon}>📷</Text>
        </View>
        <View className={styles.messageBtn} onClick={handleMessageClick}>
          <Text className={styles.messageIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View className={styles.badge}>
              <Text className={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={handleRefresh}
      >
        <Swiper
          className={styles.banner}
          autoplay
          circular
          indicatorDots
          indicatorColor="rgba(255,255,255,0.5)"
          indicatorActiveColor="#fff"
        >
          {banners.map(banner => (
            <SwiperItem key={banner.id}>
              <View className={styles.bannerItem} style={{ background: `linear-gradient(135deg, ${banner.color} 0%, ${banner.color}CC 100%)` }}>
                <View className={styles.bannerContent}>
                  <Text className={styles.bannerTitle}>{banner.title}</Text>
                  <Text className={styles.bannerDesc}>{banner.desc}</Text>
                  <View className={styles.bannerBtn}>立即办理</View>
                </View>
              </View>
            </SwiperItem>
          ))}
        </Swiper>

        {eCardInfo && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>电子社保卡</Text>
              <Text className={styles.sectionMore} onClick={handleECardClick}>查看全部 ›</Text>
            </View>
            <View className={styles.ecardWrap} onClick={handleECardClick}>
              <View className={styles.ecard}>
                <View className={styles.ecardHeader}>
                  <Text className={styles.ecardLabel}>社会保障卡（电子）</Text>
                  <View className={styles.ecardStatus}>已激活</View>
                </View>
                <View className={styles.ecardBody}>
                  <Text className={styles.ecardName}>{eCardInfo.holderName}</Text>
                  <Text className={styles.ecardNumber}>**** **** **** {eCardInfo.cardNumber?.slice(-4)}</Text>
                </View>
                <View className={styles.ecardFooter}>
                  <View className={styles.ecardBalance}>
                    <Text className={styles.ecardBalanceLabel}>医保账户</Text>
                    <Text className={styles.ecardBalanceValue}>¥{formatMoney(eCardInfo.medicalBalance)}</Text>
                  </View>
                  <View className={styles.ecardActions}>
                    <View className={styles.ecardAction}>
                      <Text className={styles.ecardActionIcon}>📱</Text>
                      <Text className={styles.ecardActionText}>刷码</Text>
                    </View>
                    <View className={styles.ecardAction}>
                      <Text className={styles.ecardActionIcon}>💰</Text>
                      <Text className={styles.ecardActionText}>缴费</Text>
                    </View>
                    <View className={styles.ecardAction}>
                      <Text className={styles.ecardActionIcon}>📄</Text>
                      <Text className={styles.ecardActionText}>凭证</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>常用服务</Text>
          </View>
          <View className={styles.quickGrid}>
            {homeServices.slice(0, 10).map((service, index) => (
              <View key={service.serviceCode} className={styles.quickItem} onClick={() => handleServiceClick(service)}>
                <View className={styles.quickIcon} style={{ background: `linear-gradient(135deg, ${['#1890FF', '#52C41A', '#FA8C16', '#722ED1', '#13C2C2', '#EB2F96', '#F5222D', '#FAAD14', '#2F54EB', '#531DAB'][index % 10]} 0%, ${['#40A9FF', '#73D13D', '#FFA940', '#9254DE', '#36CFC9', '#F759AB', '#FF4D4F', '#FFC53D', '#597EF7', '#7B3FF2'][index % 10]} 100%)` }}>
                  <Text className={styles.quickIconText}>{service.icon}</Text>
                </View>
                <Text className={styles.quickName}>{service.serviceName}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>服务分类</Text>
          </View>
          <ScrollView className={styles.categoryScroll} scrollX>
            <View className={styles.categoryTabs}>
              {serviceCategories.map((cat, index) => (
                <View
                  key={cat.code}
                  className={`${styles.categoryTab} ${index === activeCategoryIndex ? styles.categoryTabActive : ''}`}
                  onClick={() => setActiveCategoryIndex(index)}
                >
                  <Text className={styles.categoryTabIcon}>{cat.icon}</Text>
                  <Text className={styles.categoryTabName}>{cat.name}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>热门服务</Text>
            <Text className={styles.sectionMore} onClick={() => Taro.switchTab({ url: '/pages/service/index' })}>更多 ›</Text>
          </View>
          <View className={styles.serviceList}>
            {hotServices.slice(0, 4).map(service => (
              <ServiceCard
                key={service.serviceCode}
                service={service}
                size="small"
                showDescription
                onClick={handleServiceClick}
              />
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>我的办件</Text>
            <Text className={styles.sectionMore} onClick={() => Taro.switchTab({ url: '/pages/service/index' })}>全部办件 ›</Text>
          </View>
          <View className={styles.matterList}>
            {recentMatters.map(matter => (
              <MatterItem
                key={matter.id}
                matter={matter}
                onClick={handleMatterClick}
                showActions={false}
              />
            ))}
            {recentMatters.length === 0 && (
              <View className={styles.empty}>
                <Text className={styles.emptyIcon}>📋</Text>
                <Text className={styles.emptyText}>暂无办件记录</Text>
              </View>
            )}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>我的证照</Text>
            <Text className={styles.sectionMore} onClick={() => Taro.switchTab({ url: '/pages/license/index' })}>全部证照 ›</Text>
          </View>
          <ScrollView className={styles.licenseScroll} scrollX>
            <View className={styles.licenseList}>
              {licenses.map(license => (
                <View key={license.id} className={styles.licenseCardWrap}>
                  <LicenseCard
                    license={license}
                    size="small"
                    onClick={handleLicenseClick}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>为你推荐</Text>
            <View className={styles.sectionTag}>
              <Text className={styles.sectionTagIcon}>💡</Text>
              <Text className={styles.sectionTagText}>基于用户画像</Text>
            </View>
          </View>
          <View className={styles.recommendList}>
            {recommendServices.map(rec => (
              <View key={rec.id} className={styles.recommendItem} onClick={() => handleRecommendClick(rec)}>
                <View className={styles.recommendHeader}>
                  <Text className={styles.recommendName}>{rec.serviceName}</Text>
                  {rec.isCrossProvince && (
                    <View className={styles.recommendCross}>跨省</View>
                  )}
                </View>
                <Text className={styles.recommendDesc}>{rec.description}</Text>
                <View className={styles.recommendReason}>
                  <Text className={styles.recommendReasonIcon}>🎯</Text>
                  <Text className={styles.recommendReasonText}>{rec.reason}</Text>
                </View>
                <View className={styles.recommendFooter}>
                  <View className={styles.recommendMatch}>
                    <Text className={styles.recommendMatchLabel}>匹配度</Text>
                    <Text className={styles.recommendMatchValue}>{rec.userMatchScore}%</Text>
                  </View>
                  <View className={styles.recommendBtn}>立即办理</View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.footer}>
          <Text className={styles.footerText}>— 江苏省人力资源和社会保障厅 —</Text>
          <Text className={styles.footerSubtext}>主办单位：江苏省人力资源和社会保障信息中心</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomePage;
