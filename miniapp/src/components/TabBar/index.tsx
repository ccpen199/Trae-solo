import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classNames from 'classnames';

interface TabBarProps {
  current: number;
}

const tabs = [
  { key: 'home', icon: '🏠', text: '首页', path: '/pages/home/index' },
  { key: 'wallet', icon: '🎫', text: '券包', path: '/pages/wallet/index' },
  { key: 'scan', icon: '📷', text: '扫码', path: '/pages/scan/index' },
  { key: 'mall', icon: '🏪', text: '商圈', path: '/pages/mall/index' },
  { key: 'mine', icon: '👤', text: '我的', path: '/pages/mine/index' }
];

const TabBar: React.FC<TabBarProps> = ({ current }) => {
  const handleTabClick = (index: number) => {
    if (index === current) return;
    Taro.switchTab({
      url: tabs[index].path
    });
  };

  return (
    <View className={styles.tabBar}>
      {tabs.map((tab, index) => (
        <View
          key={tab.key}
          className={classNames(styles.tabItem, index === current && styles.active)}
          onClick={() => handleTabClick(index)}
        >
          <Text className={styles.tabIcon}>{tab.icon}</Text>
          <Text className={styles.tabText}>{tab.text}</Text>
        </View>
      ))}
    </View>
  );
};

export default TabBar;
