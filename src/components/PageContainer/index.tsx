import React from 'react';
import { View } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className, noPadding }) => {
  return (
    <View className={classnames(styles.container, className)}>
      <View className={styles.safeAreaTop} />
      <View className={noPadding ? '' : styles.content}>{children}</View>
      <View className={styles.safeAreaBottom} />
    </View>
  );
};

export default PageContainer;
