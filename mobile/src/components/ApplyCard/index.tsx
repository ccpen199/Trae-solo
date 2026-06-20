import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { RegistrationItem } from '@/types';
import styles from './index.module.scss';

interface ApplyCardProps {
  data: RegistrationItem;
}

const ApplyCard: React.FC<ApplyCardProps> = ({ data }) => {
  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/apply-detail/index?itemId=${data.id}`
    }).catch(console.error);
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.iconWrap}>
          <Text className={styles.icon}>📋</Text>
        </View>
        <View className={styles.titleWrap}>
          <View className={styles.titleRow}>
            <Text className={styles.title}>{data.name}</Text>
            {data.isHot && <View className={styles.hotTag}>热门</View>}
          </View>
          <Text className={styles.code}>编号：{data.code}</Text>
        </View>
      </View>
      <Text className={styles.desc}>{data.description}</Text>
      <View className={styles.meta}>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>办理时限</Text>
          <Text className={styles.metaValue}>{data.estimatedDays}个工作日</Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>材料数</Text>
          <Text className={styles.metaValue}>{data.requiredMaterials.length}项</Text>
        </View>
        <View className={styles.categoryTag}>{data.category}</View>
      </View>
    </View>
  );
};

export default ApplyCard;
