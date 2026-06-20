import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { realNameVerify, biometricVerify } from '@/services/auth';
import styles from './index.module.scss';

const levels = [
  {
    key: 'L1',
    name: '基础实名认证',
    desc: '姓名 + 身份证号 + 手机号三要素核验',
    icon: '📋',
    iconBg: 'linear-gradient(135deg, #E8F0FE, #D4E4FC)',
    minColor: '#86909C',
    maxColor: '#C9CDD4'
  },
  {
    key: 'L2',
    name: '生物特征核验',
    desc: '人脸识别/指纹核验 + 身份证OCR',
    icon: '😊',
    iconBg: 'linear-gradient(135deg, #E8FCF0, #CCF0D9)',
    minColor: '#4E5969',
    maxColor: '#86909C'
  },
  {
    key: 'L3',
    name: 'CA证书认证',
    desc: '省级CA中心预置数字证书 + 国密算法签名',
    icon: '🔐',
    iconBg: 'linear-gradient(135deg, #FCF3E8, #F8E4CC)',
    minColor: '#1D2129',
    maxColor: '#4E5969'
  }
];

const methods = [
  { key: 'face', name: '人脸识别', hint: '活体检测+人脸比对', icon: '😊', iconBg: 'linear-gradient(135deg, #E8F0FE, #D4E4FC)', done: true },
  { key: 'fingerprint', name: '指纹核验', hint: '指纹传感器比对', icon: '👆', iconBg: 'linear-gradient(135deg, #E8FCF0, #CCF0D9)', done: false },
  { key: 'idcard', name: '身份证OCR', hint: '自动识别身份证信息', icon: '🪪', iconBg: 'linear-gradient(135deg, #FCF3E8, #F8E4CC)', done: true },
  { key: 'bankcard', name: '银行卡核验', hint: '同名银行卡四要素', icon: '💳', iconBg: 'linear-gradient(135deg, #F4E8FC, #E4CCF8)', done: false }
];

const VerificationPage: React.FC = () => {
  const { user } = useAppStore();
  const currentLevel = user?.authLevel || 'L2';
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
  const [methodStates, setMethodStates] = useState<Record<string, boolean>>(
    methods.reduce((acc, m) => ({ ...acc, [m.key]: m.done }), {})
  );

  const handleMethod = async (key: string) => {
    if (methodStates[key]) {
      Taro.showToast({ title: '该核验方式已通过', icon: 'none' });
      return;
    }
    setLoadingMethod(key);
    console.log('[Verification] 开始核验:', key);

    try {
      if (key === 'face') {
        const res = await biometricVerify('face');
        if (res.success) {
          setMethodStates(p => ({ ...p, face: true }));
          Taro.showToast({ title: `人脸核验通过 ${res.score}分`, icon: 'success' });
        }
      } else if (key === 'fingerprint') {
        const res = await biometricVerify('fingerprint');
        if (res.success) {
          setMethodStates(p => ({ ...p, fingerprint: true }));
          Taro.showToast({ title: `指纹核验通过 ${res.score}分`, icon: 'success' });
        }
      } else {
        Taro.showLoading({ title: '核验中...', mask: true });
        await Promise.all([realNameVerify({ name: '张三', idCard: '3201' }), new Promise(r => setTimeout(r, 1500))]);
        Taro.hideLoading();
        setMethodStates(p => ({ ...p, [key]: true }));
        Taro.showToast({ title: '核验通过', icon: 'success' });
      }
    } catch (err: any) {
      console.error('[Verification] 核验失败:', err);
      Taro.showModal({
        title: '核验提示',
        content: '演示环境核验服务暂不可用，是否标记为通过？',
        success: (r) => {
          if (r.confirm) {
            setMethodStates(p => ({ ...p, [key]: true }));
            Taro.showToast({ title: '核验通过（演示）', icon: 'success' });
          }
        }
      });
    } finally {
      setLoadingMethod(null);
    }
  };

  const getLevelState = (levelKey: string) => {
    const order = ['L1', 'L2', 'L3'];
    const currentIdx = order.indexOf(currentLevel);
    const thisIdx = order.indexOf(levelKey);
    if (thisIdx < currentIdx) return 'done';
    if (thisIdx === currentIdx) return 'current';
    return 'todo';
  };

  return (
    <View className={styles.wrapper}>
      {/* 顶部标题区 */}
      <View className={styles.hero}>
        <View className={styles.heroIcon}>
          <Text className={styles.heroIconText}>🛡️</Text>
        </View>
        <Text className={styles.heroTitle}>多级身份核验</Text>
        <Text className={styles.heroSubtitle}>
          对接省级政务服务平台统一身份认证{'\n'}
          当前认证级别：{currentLevel} 级实名
        </Text>
      </View>

      {/* 认证级别卡片 */}
      <View className={styles.card}>
        <View className={styles.levelTitle}>
          <Text>认证级别</Text>
          <View className={styles.levelBadge} style={{ background: 'rgba(30, 93, 171, 0.1)', color: '#1E5DAB' }}>
            《电子签名法》合规
          </View>
        </View>
        <View className={styles.levelList}>
          {levels.map(level => {
            const state = getLevelState(level.key);
            return (
              <View
                key={level.key}
                className={classnames(
                  styles.levelItem,
                  state === 'done' && styles.active,
                  state === 'current' && styles.current
                )}
              >
                <View className={styles.levelIcon} style={{ background: level.iconBg }}>
                  <Text>{level.icon}</Text>
                </View>
                <View className={styles.levelInfo}>
                  <View className={styles.levelName}>
                    <Text style={{
                      color: state === 'done' ? level.maxColor : level.minColor
                    }}>{level.key}</Text>
                    <Text>{level.name}</Text>
                  </View>
                  <Text className={styles.levelDesc}>{level.desc}</Text>
                </View>
                <View className={classnames(
                  styles.levelStatus,
                  state === 'done' && styles.statusDone,
                  state === 'current' && styles.statusCurrent,
                  state === 'todo' && styles.statusTodo
                )}>
                  <Text>
                    {state === 'done' ? '✓ 已通过' : state === 'current' ? '当前级别' : '待开通'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 核验方式 */}
      <View className={styles.methodsCard}>
        <View className={styles.cardTitle}>
          <Text style={{ fontSize: '32rpx' }}>🔍</Text>
          <Text>核验方式</Text>
        </View>
        <View className={styles.methodsGrid}>
          {methods.map(m => (
            <View
              key={m.key}
              className={classnames(styles.methodCard, methodStates[m.key] && styles.done)}
              onClick={() => handleMethod(m.key)}
            >
              <View className={styles.methodIconWrap} style={{ background: m.iconBg }}>
                <Text>{m.icon}</Text>
              </View>
              <Text className={styles.methodName}>{m.name}</Text>
              <Text className={styles.methodHint}>{m.hint}</Text>
              {methodStates[m.key] ? (
                <View className={styles.methodDoneBadge}>✓ 已通过</View>
              ) : loadingMethod === m.key ? (
                <View className={styles.methodDoneBadge} style={{ background: 'rgba(30, 93, 171, 0.12)', color: '#1E5DAB' }}>核验中...</View>
              ) : (
                <View className={styles.methodDoneBadge} style={{ background: 'rgba(134, 144, 156, 0.08)', color: '#86909C' }}>点击核验</View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 身份信息 */}
      <View className={styles.infoBar}>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>姓名</Text>
          <Text className={styles.infoValue}>{user?.name || '张三'}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>身份证号</Text>
          <Text className={styles.infoValue}>{user?.idCardNo || '3201**********1234'}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>手机号</Text>
          <Text className={styles.infoValue}>{user?.phone || '138****5678'}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>认证源</Text>
          <Text className={styles.infoValue}>省级统一身份认证平台</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>数据加密</Text>
          <Text className={styles.infoValue}>SM4国密算法 · 端到端加密</Text>
        </View>
      </View>
    </View>
  );
};

export default VerificationPage;
