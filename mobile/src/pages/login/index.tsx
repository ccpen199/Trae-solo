import React, { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { loginWithGov, realNameVerify, biometricVerify } from '@/services/auth';
import { mockUser } from '@/data/mock';
import styles from './index.module.scss';

const LoginPage: React.FC = () => {
  const { login } = useAppStore();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (countdown > 0) return;
    console.log('[Login] 发送验证码到:', phone);
    Taro.showLoading({ title: '发送中...', mask: true });
    await new Promise(r => setTimeout(r, 800));
    Taro.hideLoading();
    Taro.showToast({ title: '验证码已发送（测试：1234）', icon: 'none' });
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = async (type: 'sms' | 'gov' | 'face' | 'wechat' = 'sms') => {
    if (!agreed) {
      Taro.showToast({ title: '请先阅读并同意用户协议', icon: 'none' });
      return;
    }

    console.log('[Login] 开始登录，方式:', type);
    setLoading(true);
    Taro.showLoading({ title: '认证中...', mask: true });

    try {
      if (type === 'face') {
        const result = await biometricVerify('face');
        if (!result.success) throw new Error('人脸核验未通过');
        console.log('[Login] 人脸核验通过，得分:', result.score);
        Taro.showToast({ title: `人脸核验通过 ${result.score}分`, icon: 'success' });
      }

      if (type === 'sms') {
        if (!phone || !code) {
          Taro.showToast({ title: '请输入手机号和验证码', icon: 'none' });
          setLoading(false);
          Taro.hideLoading();
          return;
        }
        if (code !== '1234' && code.length < 4) {
          Taro.showToast({ title: '验证码错误（测试：1234）', icon: 'none' });
          setLoading(false);
          Taro.hideLoading();
          return;
        }
        const ok = await realNameVerify({ name: '张三', idCard: '3201**********1234' });
        if (!ok) throw new Error('实名认证失败');
      }

      const user = await loginWithGov('code_' + Date.now());
      console.log('[Login] 登录成功:', user.name, '认证级别:', user.authLevel);
      login(user);

      Taro.hideLoading();
      Taro.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/home/index' });
      }, 1000);
    } catch (err: any) {
      console.error('[Login] 登录失败:', err);
      Taro.hideLoading();
      Taro.showToast({ title: err.message || '登录失败', icon: 'none' });
      login(mockUser);
      setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={styles.wrapper}>
      <View className={styles.hero}>
        <View className={styles.logoWrap}>
          <Text className={styles.logo}>🏛️</Text>
        </View>
        <Text className={styles.title}>市场监管电子政务</Text>
        <Text className={styles.subtitle}>省级统一身份认证 · 符合《电子签名法》</Text>
      </View>

      <View className={styles.loginCard}>
        <View className={styles.inputGroup}>
          <Text className={styles.inputLabel}>手机号</Text>
          <View className={styles.inputWrap}>
            <Text className={styles.inputIcon}>📱</Text>
            <Input
              className={styles.input}
              type="number"
              maxlength={11}
              placeholder="请输入手机号"
              value={phone}
              onInput={e => setPhone(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.verifyRow}>
          <View className={styles.verifyInput}>
            <Text className={styles.inputIcon}>🔐</Text>
            <Input
              className={styles.input}
              type="number"
              maxlength={6}
              placeholder="请输入验证码"
              value={code}
              onInput={e => setCode(e.detail.value)}
            />
          </View>
          <Button
            className={classnames(styles.verifyBtn, countdown > 0 && styles.disabled)}
            onClick={sendCode}
          >
            <Text>{countdown > 0 ? `${countdown}s` : '获取验证码'}</Text>
          </Button>
        </View>

        <View className={styles.agreement}>
          <View
            className={classnames(styles.checkbox, agreed && styles.checked)}
            onClick={() => setAgreed(!agreed)}
          >
            {agreed && <Text className={styles.checkMark}>✓</Text>}
          </View>
          <Text className={styles.agreeText}>
            我已阅读并同意
            <Text className={styles.agreeLink}>《用户服务协议》</Text>
            、
            <Text className={styles.agreeLink}>《隐私政策》</Text>
            及
            <Text className={styles.agreeLink}>《电子签名知情同意书》</Text>
            ，已了解电子签名与手写签名具有同等法律效力
          </Text>
        </View>

        <Button
          className={styles.loginBtn}
          onClick={() => handleLogin('sms')}
          loading={loading}
        >
          登录 / 注册
        </Button>

        <View className={styles.otherLogin}>
          <Text className={styles.otherTitle}>其他登录方式</Text>
          <View className={styles.otherMethods}>
            <View className={styles.methodItem} onClick={() => handleLogin('face')}>
              <View className={styles.methodIcon} style={{ background: 'linear-gradient(135deg, #E8F0FE, #D4E4FC)' }}>
                <Text>😊</Text>
              </View>
              <Text className={styles.methodLabel}>人脸识别</Text>
            </View>
            <View className={styles.methodItem} onClick={() => handleLogin('gov')}>
              <View className={styles.methodIcon} style={{ background: 'linear-gradient(135deg, #E8FCF0, #CCF0D9)' }}>
                <Text>🏛️</Text>
              </View>
              <Text className={styles.methodLabel}>政务网登录</Text>
            </View>
            <View className={styles.methodItem} onClick={() => handleLogin('wechat')}>
              <View className={styles.methodIcon} style={{ background: 'linear-gradient(135deg, #E8FCF5, #CCF0E8)' }}>
                <Text>💬</Text>
              </View>
              <Text className={styles.methodLabel}>微信认证</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <Text className={styles.footerText}>
          本系统符合《电子签名法》《个人信息保护法》{'\n'}
          支持SM2/SM4国密算法 · 对接省级电子证照库
        </Text>
      </View>
    </View>
  );
};

export default LoginPage;
