import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, showBack = false, onBack }) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      Taro.navigateBack({ delta: 1 }).catch(() => {
        Taro.switchTab({ url: '/pages/home/index' });
      });
    }
  };

  return (
    <View className={styles.header}>
      <View className={styles.headerTop}>
        {showBack && (
          <View className={styles.backBtn} onClick={handleBack}>
            <Text className={styles.backIcon}>‹</Text>
          </View>
        )}
        <View className={styles.titleWrap}>
          <Text className={styles.title}>{title}</Text>
          {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
};

export default PageHeader;
