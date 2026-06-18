import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useRouter } from '@tarojs/taro';

const ServiceDetailPage: React.FC = () => {
  const router = useRouter();
  const serviceId = router.params.id || '';

  const features = [
    { icon: '📋', text: '办理条件智能校验' },
    { icon: '📄', text: '材料清单与示例下载' },
    { icon: '⚡', text: '在线办理流程步骤' },
    { icon: '💳', text: '费用说明与在线支付' },
    { icon: '📊', text: '办件进度实时追踪' }
  ];

  return (
    <View className={styles.container}>
      <View className={styles.placeholderCard}>
        <Text className={styles.placeholderIcon}>📋</Text>
        <Text className={styles.placeholderTitle}>服务详情页</Text>
        <Text className={styles.placeholderDesc}>
          该页面将包含完整的办事服务信息：\n办理条件、所需材料、办理流程、费用说明、常见问题、关联政策等。
          {'\n\n'}服务ID：{serviceId || '未指定'}
        </Text>
        <View className={styles.placeholderFeatures}>
          {features.map((f, i) => (
            <View key={i} className={styles.featureItem}>
              <Text className={styles.featureIcon}>{f.icon}</Text>
              <Text className={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default ServiceDetailPage;
