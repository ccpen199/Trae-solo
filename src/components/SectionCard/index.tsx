import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface SectionCardProps {
  title?: string;
  titleIcon?: string;
  moreText?: string;
  onMore?: () => void;
  children: React.ReactNode;
  className?: string;
  noHeader?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, titleIcon, moreText, onMore, children, className, noHeader }) => {
  return (
    <View className={classnames(styles.card, className)}>
      {!noHeader && (
        <View className={styles.header}>
          <View className={styles.titleRow}>
            {titleIcon && <Text className={styles.titleIcon}>{titleIcon}</Text>}
            {title && <Text className={styles.title}>{title}</Text>}
          </View>
          {moreText && (
            <View className={styles.more} onClick={onMore}>
              <Text>{moreText}</Text>
              <Text>{'›'}</Text>
            </View>
          )}
        </View>
      )}
      <View className={styles.body}>{children}</View>
    </View>
  );
};

export default SectionCard;
