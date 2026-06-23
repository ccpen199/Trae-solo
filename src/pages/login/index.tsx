import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import { encryptECB } from '@/utils/sm4';
import styles from './index.module.scss';

const LoginPage: React.FC = () => {
  const { login, bioAuthEnabled, devices } = useUserStore();
  const deviceInfo = devices[0];

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const savedUsername = Taro.getStorageSync('savedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    let valid = true;
    
    if (!username.trim()) {
      setUsernameError('请输入用户名/工号');
      valid = false;
    } else if (username.trim().length < 3) {
      setUsernameError('用户名/工号格式不正确');
      valid = false;
    } else {
      setUsernameError('');
    }

    if (!password) {
      setPasswordError('请输入密码');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('密码长度不能少于6位');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!agreePrivacy) {
      Taro.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      valid = false;
    }

    return valid;
  }, [username, password, agreePrivacy]);

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoggingIn(true);
    
    try {
      if (rememberMe) {
        Taro.setStorageSync('savedUsername', username.trim());
      } else {
        Taro.removeStorageSync('savedUsername');
      }

      const encryptedPassword = encryptECB(password, 'sm4_encryption_key_2024');

      await login(username.trim(), encryptedPassword);
      
      Taro.showToast({ title: '登录成功', icon: 'success' });
      
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/home/index' });
      }, 1000);

    } catch (error) {
      console.error('登录失败', error);
      Taro.showModal({
        title: '登录失败',
        content: error instanceof Error ? error.message : '用户名或密码错误，请重试',
        showCancel: false
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBioLogin = async () => {
    if (!bioAuthEnabled) {
      Taro.showToast({ title: '生物识别未启用', icon: 'none' });
      return;
    }

    try {
      const result = await Taro.checkIsSupportSoterAuthentication();
      console.log('支持的生物识别:', result);

      Taro.showLoading({ title: '验证中...' });
      
      const authResult = await Taro.startSoterAuthentication({
        requestAuthModes: ['fingerPrint', 'facial'],
        challenge: encryptECB(JSON.stringify({
          deviceId: deviceInfo?.id,
          timestamp: Date.now(),
          operation: 'login'
        }), 'sm4_encryption_key_2024'),
        authContent: '请验证身份以登录'
      });

      console.log('生物识别结果:', authResult);
      Taro.hideLoading();

      if (authResult.resultJSON) {
        const savedUser = Taro.getStorageSync('savedUsername');
        if (savedUser) {
          setUsername(savedUser);
        }
        
        Taro.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/home/index' });
        }, 1000);
      }

    } catch (error) {
      Taro.hideLoading();
      console.error('生物识别失败', error);
      Taro.showModal({
        title: '验证失败',
        content: '生物识别验证失败，请使用密码登录',
        showCancel: false
      });
    }
  };

  const handleSSOLogin = () => {
    Taro.showActionSheet({
      itemList: ['统一身份认证', '企业微信登录', '钉钉登录'],
      success: (res) => {
        const tips = ['统一身份认证', '企业微信登录', '钉钉登录'];
        Taro.showLoading({ title: `正在跳转${tips[res.tapIndex]}...` });
        setTimeout(() => {
          Taro.hideLoading();
          Taro.showToast({ title: 'SSO登录功能开发中', icon: 'none' });
        }, 1500);
      }
    });
  };

  const handleQRCodeLogin = () => {
    Taro.showToast({ title: '扫码登录功能开发中', icon: 'none' });
  };

  const handleForgotPassword = () => {
    Taro.showActionSheet({
      itemList: ['通过手机找回', '通过邮箱找回', '联系管理员'],
      success: (res) => {
        const tips = ['手机找回', '邮箱找回', '联系管理员'];
        Taro.showToast({ title: tips[res.tapIndex] + '功能开发中', icon: 'none' });
      }
    });
  };

  const handlePrivacyClick = (type: 'agreement' | 'policy') => {
    Taro.showModal({
      title: type === 'agreement' ? '用户协议' : '隐私政策',
      content: type === 'agreement' 
        ? '《国家电网移动办公平台用户协议》\n\n1. 本平台仅限国家电网内部员工使用\n2. 您需对账号安全负责\n3. 禁止传输涉密信息\n4. 所有操作均有审计日志\n5. 遵守国家网络安全法'
        : '《国家电网移动办公平台隐私政策》\n\n1. 我们收集您的姓名、工号、部门信息用于身份认证\n2. 位置信息仅用于考勤和安全审计\n3. 所有数据均使用国密SM4加密存储\n4. 我们不会向第三方披露您的信息\n5. 您有权申请删除个人数据',
      showCancel: false,
      confirmText: '知道了'
    });
  };

  const clearUsername = () => {
    setUsername('');
    setUsernameError('');
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const isFormValid = username.trim().length >= 3 && password.length >= 6 && agreePrivacy;

  return (
    <View className={styles.page}>
      <View className={styles.decoration} />

      <View className={styles.logoSection}>
        <View className={styles.logo}>⚡</View>
        <Text className={styles.appName}>国家电网</Text>
        <Text className={styles.appSubtitle}>统一移动办公平台</Text>
      </View>

      <View className={styles.loginCard}>
        <Text className={styles.cardTitle}>欢迎登录</Text>

        <View className={styles.securityBanner}>
          <Text className={styles.securityBannerIcon}>🔐</Text>
          <Text className={styles.securityBannerText}>国密SM4加密保护 · 安全通信</Text>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>用户名 / 工号</Text>
          <View className={classnames(
            styles.inputWrapper,
            usernameFocused && styles.focused,
            usernameError && styles.error
          )}>
            <Text className={styles.inputIcon}>👤</Text>
            <Input
              className={styles.input}
              type="text"
              placeholder="请输入用户名或工号"
              placeholderClass="input-placeholder"
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
              confirmType="next"
              maxlength={20}
            />
            {username && (
              <View className={styles.inputClear} onClick={clearUsername}>
                ×
              </View>
            )}
          </View>
          {usernameError && (
            <Text className={styles.errorText}>
              ⚠️ {usernameError}
            </Text>
          )}
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>密码</Text>
          <View className={classnames(
            styles.inputWrapper,
            passwordFocused && styles.focused,
            passwordError && styles.error
          )}>
            <Text className={styles.inputIcon}>🔒</Text>
            <Input
              className={styles.input}
              password={!showPassword}
              placeholder="请输入登录密码"
              placeholderClass="input-placeholder"
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              confirmType="done"
              maxlength={20}
              onConfirm={handleLogin}
            />
            {password && (
              <View className={styles.passwordToggle} onClick={togglePassword}>
                {showPassword ? '🙈' : '👁️'}
              </View>
            )}
          </View>
          {passwordError && (
            <Text className={styles.errorText}>
              ⚠️ {passwordError}
            </Text>
          )}
        </View>

        <View className={styles.loginOptions}>
          <View className={styles.rememberMe} onClick={() => setRememberMe(!rememberMe)}>
            <View className={classnames(styles.checkbox, rememberMe && styles.checked)}>
              {rememberMe && <Text className={styles.checkboxIcon}>✓</Text>}
            </View>
            <Text className={styles.rememberLabel}>记住用户名</Text>
          </View>
          <Text className={styles.forgotPassword} onClick={handleForgotPassword}>
            忘记密码?
          </Text>
        </View>

        <View
          className={classnames(styles.loginBtn, (!isFormValid || isLoggingIn) && styles.disabled)}
          onClick={isFormValid && !isLoggingIn ? handleLogin : undefined}
        >
          {isLoggingIn ? (
            <>
              <Text className={styles.loginBtnIcon}>⏳</Text>
              <Text>登录中...</Text>
            </>
          ) : (
            <>
              <Text className={styles.loginBtnIcon}>🔑</Text>
              <Text>安全登录</Text>
            </>
          )}
        </View>

        <View className={styles.otherLoginTitle}>
          <View className={styles.otherLoginLine} />
          <Text className={styles.otherLoginText}>其他登录方式</Text>
          <View className={styles.otherLoginLine} />
        </View>

        <View className={styles.otherLoginOptions}>
          <View className={styles.otherLoginItem} onClick={handleBioLogin}>
            <View className={classnames(styles.otherLoginIcon, styles.bio)}>
              👆
            </View>
            <Text className={styles.otherLoginLabel}>生物识别</Text>
          </View>
          <View className={styles.otherLoginItem} onClick={handleSSOLogin}>
            <View className={classnames(styles.otherLoginIcon, styles.sso)}>
              🔗
            </View>
            <Text className={styles.otherLoginLabel}>统一认证</Text>
          </View>
          <View className={styles.otherLoginItem} onClick={handleQRCodeLogin}>
            <View className={classnames(styles.otherLoginIcon, styles.qrcode)}>
              📱
            </View>
            <Text className={styles.otherLoginLabel}>扫码登录</Text>
          </View>
        </View>

        <View className={styles.privacySection}>
          <View 
            className={classnames(styles.privacyCheckbox, agreePrivacy && styles.checked)}
            onClick={() => setAgreePrivacy(!agreePrivacy)}
          >
            {agreePrivacy && <Text className={styles.privacyCheckboxIcon}>✓</Text>}
          </View>
          <Text className={styles.privacyText}>
            已阅读并同意
            <Text className={styles.privacyLink} onClick={() => handlePrivacyClick('agreement')}>《用户协议》</Text>
            和
            <Text className={styles.privacyLink} onClick={() => handlePrivacyClick('policy')}>《隐私政策》</Text>
          </Text>
        </View>

        <View className={styles.footer}>
          <Text>国家电网有限公司 © 2024</Text>
          <Text style={{ display: 'block', marginTop: 4 }}>
            版本号 v1.0.0 · SM4国密加密
          </Text>
        </View>
      </View>
    </View>
  );
};

export default LoginPage;
