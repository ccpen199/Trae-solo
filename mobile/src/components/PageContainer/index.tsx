import React from 'react';
import { View, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';

interface PageContainerProps {
  children: React.ReactNode;
  showHeader?: boolean;
  headerContent?: React.ReactNode;
  scroll?: boolean;
  padding?: boolean;
  safeBottom?: boolean;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  showHeader = false,
  headerContent,
  scroll = true,
  padding = true,
  safeBottom = true,
  className = ''
}) => {
  const content = (
    <View className={`${styles.container} ${padding ? styles.padding : ''} ${className}`}>
      {showHeader && <View className={styles.header}>{headerContent}</View>}
      <View className={styles.content}>{children}</View>
      {safeBottom && <View className={styles.safeBottom} />}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView scrollY className={styles.scrollWrapper}>
        {content}
      </ScrollView>
    );
  }
  return content;
};

export default PageContainer;
