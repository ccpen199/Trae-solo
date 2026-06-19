import React, { useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '../../store/appStore';
import classnames from 'classnames';
import type { FontScale, ColorFilter } from '../../types';

const fontScaleOptions: { value: FontScale; label: string }[] = [
  { value: 'standard', label: '标准' },
  { value: 'large', label: '大' },
  { value: 'extra-large', label: '特大' }
];

const colorFilterOptions: { value: ColorFilter; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'red-green', label: '红绿色盲' },
  { value: 'blue-yellow', label: '蓝黄色盲' }
];

const speakRateOptions = [0.5, 0.8, 1.0, 1.2, 1.5];

const AccessibilityPage: React.FC = () => {
  const { accessibility, setAccessibility, speak } = useAppStore();

  const handleToggle = useCallback((key: string, value?: boolean) => {
    const newVal = value !== undefined ? value : !(accessibility as any)[key];
    setAccessibility({ [key]: newVal });
    Taro.showToast({ title: `${newVal ? '已开启' : '已关闭'}`, icon: 'none', duration: 1000 });
  }, [accessibility, setAccessibility]);

  const handleFontScaleChange = useCallback((fontScale: FontScale) => {
    const largeFont = fontScale !== 'standard';
    setAccessibility({ fontScale, largeFont });
    speak(`字体已切换为${fontScaleOptions.find(o => o.value === fontScale)?.label}`);
  }, [setAccessibility, speak]);

  const handleColorFilterChange = useCallback((colorFilter: ColorFilter) => {
    setAccessibility({ colorFilter });
    speak(`颜色滤镜已切换为${colorFilterOptions.find(o => o.value === colorFilter)?.label}`);
  }, [setAccessibility, speak]);

  const handleSpeakRateChange = useCallback((speakRate: number) => {
    setAccessibility({ speakRate });
    speak(`语速已调整为${speakRate}倍`);
  }, [setAccessibility, speak]);

  const handleElderMode = useCallback(() => {
    const isElderOn = accessibility.largeFont && accessibility.voiceNavigation && accessibility.largeButton && accessibility.operationConfirm;
    if (isElderOn) {
      setAccessibility({
        largeFont: false,
        fontScale: 'standard',
        voiceNavigation: false,
        largeButton: false,
        operationConfirm: false
      });
      Taro.showToast({ title: '老年人简易模式已关闭', icon: 'none', duration: 1500 });
    } else {
      setAccessibility({
        largeFont: true,
        fontScale: 'extra-large',
        voiceNavigation: true,
        largeButton: true,
        operationConfirm: true
      });
      Taro.showToast({ title: '老年人简易模式已开启', icon: 'none', duration: 1500 });
      speak('老年人简易模式已开启，已为您放大字体、开启语音导航、大按钮和操作确认');
    }
  }, [accessibility, setAccessibility, speak]);

  const isElderModeOn = accessibility.largeFont && accessibility.voiceNavigation && accessibility.largeButton && accessibility.operationConfirm;

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.pageTitle}>
        <Text className={styles.pageTitleIcon}>♿</Text>
        <Text className={styles.pageTitleText}>无障碍设置中心</Text>
      </View>

      <View className={styles.elderCard}>
        <View className={styles.elderHeader}>
          <Text className={styles.elderIcon}>👴</Text>
          <View className={styles.elderInfo}>
            <Text className={styles.elderTitle}>老年人简易模式</Text>
            <Text className={styles.elderDesc}>一键开启大字体 + 语音导航 + 大按钮 + 操作确认</Text>
          </View>
        </View>
        <View
          className={classnames(styles.elderSwitch, isElderModeOn && styles.elderSwitchOn)}
          onClick={handleElderMode}
        >
          <View className={styles.elderSwitchDot} />
          <Text className={styles.elderSwitchLabel}>{isElderModeOn ? '已开启' : '开启'}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>👁️</Text>
          <Text className={styles.sectionTitle}>视觉辅助</Text>
        </View>
        <View className={styles.sectionBody}>
          <View className={styles.settingRow}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>高对比度模式</Text>
              <Text className={styles.settingDesc}>增强文字与背景对比度，符合 WCAG AA 标准</Text>
            </View>
            <View
              className={classnames(styles.toggle, accessibility.highContrast && styles.toggleOn)}
              onClick={() => handleToggle('highContrast')}
            >
              <View className={styles.toggleDot} />
            </View>
          </View>

          <View className={styles.settingRow}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>大字体模式</Text>
              <Text className={styles.settingDesc}>选择适合您的字体大小</Text>
            </View>
          </View>
          <View className={styles.radioGroup}>
            {fontScaleOptions.map(opt => (
              <View
                key={opt.value}
                className={classnames(styles.radioItem, accessibility.fontScale === opt.value && styles.radioItemActive)}
                onClick={() => handleFontScaleChange(opt.value)}
              >
                <View className={classnames(styles.radioCircle, accessibility.fontScale === opt.value && styles.radioCircleActive)}>
                  {accessibility.fontScale === opt.value && <View className={styles.radioDot} />}
                </View>
                <Text className={classnames(styles.radioLabel, accessibility.fontScale === opt.value && styles.radioLabelActive)}>
                  {opt.label}
                </Text>
              </View>
            ))}
          </View>

          <View className={styles.settingRow}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>颜色滤镜</Text>
              <Text className={styles.settingDesc}>针对色觉障碍用户优化色彩显示</Text>
            </View>
          </View>
          <View className={styles.radioGroup}>
            {colorFilterOptions.map(opt => (
              <View
                key={opt.value}
                className={classnames(styles.radioItem, accessibility.colorFilter === opt.value && styles.radioItemActive)}
                onClick={() => handleColorFilterChange(opt.value)}
              >
                <View className={classnames(styles.radioCircle, accessibility.colorFilter === opt.value && styles.radioCircleActive)}>
                  {accessibility.colorFilter === opt.value && <View className={styles.radioDot} />}
                </View>
                <Text className={classnames(styles.radioLabel, accessibility.colorFilter === opt.value && styles.radioLabelActive)}>
                  {opt.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>🔊</Text>
          <Text className={styles.sectionTitle}>听觉辅助</Text>
        </View>
        <View className={styles.sectionBody}>
          <View className={styles.settingRow}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>语音导航</Text>
              <Text className={styles.settingDesc}>操作时语音播报页面导航信息</Text>
            </View>
            <View
              className={classnames(styles.toggle, accessibility.voiceNavigation && styles.toggleOn)}
              onClick={() => handleToggle('voiceNavigation')}
            >
              <View className={styles.toggleDot} />
            </View>
          </View>

          <View className={styles.settingRow}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>自动朗读内容</Text>
              <Text className={styles.settingDesc}>进入页面时自动朗读页面内容</Text>
            </View>
            <View
              className={classnames(styles.toggle, accessibility.autoReadContent && styles.toggleOn)}
              onClick={() => handleToggle('autoReadContent')}
            >
              <View className={styles.toggleDot} />
            </View>
          </View>

          <View className={styles.settingRow}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>朗读语速</Text>
              <Text className={styles.settingDesc}>调整语音朗读速度</Text>
            </View>
          </View>
          <View className={styles.rateGroup}>
            {speakRateOptions.map(rate => (
              <View
                key={rate}
                className={classnames(styles.rateItem, accessibility.speakRate === rate && styles.rateItemActive)}
                onClick={() => handleSpeakRateChange(rate)}
              >
                <Text className={classnames(styles.rateLabel, accessibility.speakRate === rate && styles.rateLabelActive)}>
                  {rate}x
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>✋</Text>
          <Text className={styles.sectionTitle}>操作辅助</Text>
        </View>
        <View className={styles.sectionBody}>
          <View className={styles.settingRow}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>操作确认</Text>
              <Text className={styles.settingDesc}>每次操作前需二次确认，防止误操作</Text>
            </View>
            <View
              className={classnames(styles.toggle, accessibility.operationConfirm && styles.toggleOn)}
              onClick={() => handleToggle('operationConfirm')}
            >
              <View className={styles.toggleDot} />
            </View>
          </View>

          <View className={styles.settingRow}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>大按钮模式</Text>
              <Text className={styles.settingDesc}>增大按钮点击区域，方便触控操作</Text>
            </View>
            <View
              className={classnames(styles.toggle, accessibility.largeButton && styles.toggleOn)}
              onClick={() => handleToggle('largeButton')}
            >
              <View className={styles.toggleDot} />
            </View>
          </View>

          <View className={styles.settingRow}>
            <View className={styles.settingInfo}>
              <Text className={styles.settingName}>减弱动画</Text>
              <Text className={styles.settingDesc}>减少界面动画效果，降低视觉刺激</Text>
            </View>
            <View
              className={classnames(styles.toggle, accessibility.reduceAnimation && styles.toggleOn)}
              onClick={() => handleToggle('reduceAnimation')}
            >
              <View className={styles.toggleDot} />
            </View>
          </View>
        </View>
      </View>

      <View className={styles.complianceFooter}>
        <Text className={styles.complianceIcon}>🛡️</Text>
        <Text className={styles.complianceText}>
          本页面所有设置严格符合《信息无障碍技术标准》，致力于让每一位市民都能平等、便捷地享受数字政务服务。
        </Text>
      </View>

      <View className={styles.bottomSpace} />
    </ScrollView>
  );
};

export default AccessibilityPage;
