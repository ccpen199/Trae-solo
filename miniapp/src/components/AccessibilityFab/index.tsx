import React, { memo, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '../../store/appStore';
import classnames from 'classnames';

const AccessibilityFab: React.FC = memo(() => {
  const { accessibility, toggleHighContrast, toggleLargeFont, toggleVoiceNavigation, speak } = useAppStore();
  const [expanded, setExpanded] = useState(false);

  const handleMainClick = () => {
    speak('无障碍功能菜单');
    setExpanded(!expanded);
  };

  const handleA11ySettings = () => {
    speak('进入无障碍设置页面');
    Taro.navigateTo({ url: '/pages/accessibility/index' });
  };

  return (
    <View className={styles.container}>
      {expanded && (
        <View className={styles.menuPanel}>
          <View className={styles.menuHeader}>
            <Text className={styles.menuTitle}>♿ 无障碍模式</Text>
          </View>

          <View
            className={classnames(styles.menuItem, accessibility.highContrast && styles.active)}
            onClick={toggleHighContrast}
          >
            <View className={styles.menuIcon}>
              <Text>◐</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuItemTitle}>高对比度</Text>
              <Text className={styles.menuItemDesc}>增强文字和背景对比</Text>
            </View>
            <View className={classnames(styles.switchBtn, accessibility.highContrast && styles.switchOn)}>
              <View className={styles.switchDot} />
            </View>
          </View>

          <View
            className={classnames(styles.menuItem, accessibility.largeFont && styles.active)}
            onClick={toggleLargeFont}
          >
            <View className={styles.menuIcon}>
              <Text>A+</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuItemTitle}>大字体</Text>
              <Text className={styles.menuItemDesc}>全局字体放大30%</Text>
            </View>
            <View className={classnames(styles.switchBtn, accessibility.largeFont && styles.switchOn)}>
              <View className={styles.switchDot} />
            </View>
          </View>

          <View
            className={classnames(styles.menuItem, accessibility.voiceNavigation && styles.active)}
            onClick={toggleVoiceNavigation}
          >
            <View className={styles.menuIcon}>
              <Text>🔊</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuItemTitle}>语音导航</Text>
              <Text className={styles.menuItemDesc}>朗读页面内容和操作</Text>
            </View>
            <View className={classnames(styles.switchBtn, accessibility.voiceNavigation && styles.switchOn)}>
              <View className={styles.switchDot} />
            </View>
          </View>

          <View className={styles.menuItem} onClick={handleA11ySettings}>
            <View className={styles.menuIcon}>
              <Text>⚙️</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuItemTitle}>更多设置</Text>
              <Text className={styles.menuItemDesc}>朗读语速、自动朗读等</Text>
            </View>
            <Text className={styles.menuArrow}>→</Text>
          </View>
        </View>
      )}

      <Button
        className={classnames(
          styles.fabButton,
          expanded && styles.fabExpanded,
          accessibility.enabled && styles.fabActive
        )}
        onClick={handleMainClick}
      >
        <Text className={styles.fabIcon}>♿</Text>
        {accessibility.enabled && (
          <View className={styles.statusDot} />
        )}
      </Button>
    </View>
  );
});

export default AccessibilityFab;
