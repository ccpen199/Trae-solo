import React, { useState } from 'react';
import { View, Text, Swiper, SwiperItem, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classNames from 'classnames';
import type { BannerItem } from '@/types';

interface BannerSwiperProps {
  banners: BannerItem[];
  autoPlay?: boolean;
  interval?: number;
}

const BannerSwiper: React.FC<BannerSwiperProps> = ({ banners, autoPlay = true, interval = 4000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleChange = (e: any) => {
    setCurrentIndex(e.detail.current);
  };

  const handleClick = (banner: BannerItem) => {
    if (banner.activityId) {
      Taro.navigateTo({
        url: `/pages/coupon-detail/index?activityId=${banner.activityId}`
      });
    }
  };

  return (
    <View className={styles.bannerSwiper}>
      <Swiper
        autoplay={autoPlay}
        interval={interval}
        circular
        indicatorDots={false}
        onChange={handleChange}
      >
        {banners.map((banner) => (
          <SwiperItem key={banner.id} onClick={() => handleClick(banner)}>
            <View className={styles.bannerItem}>
              <Image src={banner.imageUrl} mode='aspectFill' />
              <Text className={styles.bannerTitle}>{banner.title}</Text>
            </View>
          </SwiperItem>
        ))}
      </Swiper>
      <View className={styles.swiperDot}>
        {banners.map((_, index) => (
          <View
            key={index}
            className={classNames(styles.dot, index === currentIndex && styles.active)}
          />
        ))}
      </View>
    </View>
  );
};

export default BannerSwiper;
