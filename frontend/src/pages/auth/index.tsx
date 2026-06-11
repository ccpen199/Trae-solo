import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { login, sendSmsCode, faceAuth, getGovernmentAuthUrl, governmentAuthCallback } from '@/services/auth';
import { validatePhone, validateIdCard, validateName, validatePassword } from '@/utils/validator';
import { formatPhone, formatIdCard } from '@/utils/format';
import type { LoginParams } from '@/types/user';
import styles from './index.module.scss';

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'password' | 'sms' | 'cert'>('sms');
  const [loading, setLoading] = useState(false);
  const [faceAuthing, setFaceAuthing] = useState(false);
  const [showFaceAuthModal, setShowFaceAuthModal] = useState(false);
  const [showGovModal, setShowGovModal] = useState(false);
  const [faceAuthStatus, setFaceAuthStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [countdown, setCountdown] = useState(0);

  const [phoneForm, setPhoneForm] = useState({
    phone: '',
    code: '',
    rememberMe: false,
    agreeToTerms: true
  });

  const [passwordForm, setPasswordForm] = useState({
    account: '',
    password: '',
    showPassword: false,
    rememberMe: false,
    agreeToTerms: true
  });

  const [certForm, setCertForm] = useState({
    name: '',
    idCard: '',
    agreeToTerms: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  useDidShow(() => {
    const savedPhone = Taro.getStorageSync('rememberedPhone');
    if (savedPhone) {
      setPhoneForm(prev => ({ ...prev, phone: savedPhone, rememberMe: true }));
    }
  });

  const validatePhoneForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!phoneForm.phone) {
      newErrors.phone = '请输入手机号';
    } else if (!validatePhone(phoneForm.phone)) {
      newErrors.phone = '请输入正确的手机号';
    }

    if (!phoneForm.code) {
      newErrors.code = '请输入验证码';
    } else if (phoneForm.code.length !== 6) {
      newErrors.code = '验证码为6位数字';
    }

    if (!phoneForm.agreeToTerms) {
      newErrors.agreement = '请阅读并同意服务协议';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [phoneForm]);

  const validatePasswordForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!passwordForm.account) {
      newErrors.account = '请输入账号/手机号/身份证号';
    }

    if (!passwordForm.password) {
      newErrors.password = '请输入密码';
    } else if (passwordForm.password.length < 6) {
      newErrors.password = '密码长度不能少于6位';
    }

    if (!passwordForm.agreeToTerms) {
      newErrors.agreement = '请阅读并同意服务协议';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [passwordForm]);

  const validateCertForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!certForm.name) {
      newErrors.name = '请输入姓名';
    } else if (!validateName(certForm.name)) {
      newErrors.name = '请输入真实姓名';
    }

    if (!certForm.idCard) {
      newErrors.idCard = '请输入身份证号';
    } else if (!validateIdCard(certForm.idCard)) {
      newErrors.idCard = '请输入正确的身份证号';
    }

    if (!certForm.agreeToTerms) {
      newErrors.agreement = '请阅读并同意服务协议';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [certForm]);

  const handleSendCode = async () => {
    if (!phoneForm.phone || !validatePhone(phoneForm.phone)) {
      setErrors(prev => ({ ...prev, phone: '请输入正确的手机号' }));
      return;
    }

    setLoading(true);
    try {
      const success = await sendSmsCode(phoneForm.phone);
      if (success) {
        Taro.showToast({ title: '验证码已发送', icon: 'success' });
        setCountdown(60);
        setErrors(prev => {
          const { phone, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error('[AuthPage] 发送验证码失败', error);
      Taro.showToast({ title: '发送失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!validatePhoneForm()) return;

    setLoading(true);
    try {
      const params: LoginParams = {
        phone: phoneForm.phone,
        code: phoneForm.code,
        loginType: 'sms'
      };
      const success = await login(params);
      if (success) {
        if (phoneForm.rememberMe) {
          Taro.setStorageSync('rememberedPhone', phoneForm.phone);
        } else {
          Taro.removeStorageSync('rememberedPhone');
        }
        Taro.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/home/index' });
        }, 1000);
      } else {
        Taro.showToast({ title: '验证码错误，请重试', icon: 'none' });
      }
    } catch (error) {
      console.error('[AuthPage] 短信登录失败', error);
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!validatePasswordForm()) return;

    setLoading(true);
    try {
      const params: LoginParams = {
        account: passwordForm.account,
        password: passwordForm.password,
        loginType: 'password'
      };
      const success = await login(params);
      if (success) {
        if (passwordForm.rememberMe) {
          Taro.setStorageSync('rememberedPhone', passwordForm.account);
        }
        Taro.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/home/index' });
        }, 1000);
      } else {
        Taro.showToast({ title: '账号或密码错误', icon: 'none' });
      }
    } catch (error) {
      console.error('[AuthPage] 密码登录失败', error);
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCertLogin = async () => {
    if (!validateCertForm()) return;

    setShowFaceAuthModal(true);
    setFaceAuthStatus('idle');
  };

  const startFaceAuth = async () => {
    setFaceAuthStatus('scanning');
    setFaceAuthing(true);

    try {
      const success = await faceAuth({
        name: certForm.name,
        idCard: certForm.idCard,
        type: 'login'
      });

      if (success) {
        setFaceAuthStatus('success');

        setTimeout(async () => {
          try {
            const params: LoginParams = {
              name: certForm.name,
              idCard: certForm.idCard,
              loginType: 'face'
            };
            const loginSuccess = await login(params);
            if (loginSuccess) {
              Taro.showToast({ title: '认证成功，正在登录', icon: 'success' });
              setShowFaceAuthModal(false);
              setTimeout(() => {
                Taro.switchTab({ url: '/pages/home/index' });
              }, 1000);
            }
          } catch (error) {
            console.error('[AuthPage] 人脸登录失败', error);
            Taro.showToast({ title: '登录失败，请重试', icon: 'none' });
            setShowFaceAuthModal(false);
          } finally {
            setFaceAuthing(false);
          }
        }, 1500);
      } else {
        Taro.showToast({ title: '人脸核验失败，请重试', icon: 'none' });
        setFaceAuthStatus('idle');
        setFaceAuthing(false);
      }
    } catch (error) {
      console.error('[AuthPage] 人脸核验失败', error);
      Taro.showToast({ title: '核验失败，请重试', icon: 'none' });
      setFaceAuthStatus('idle');
      setFaceAuthing(false);
    }
  };

  const handleGovernmentAuth = () => {
    setShowGovModal(true);
  };

  const confirmGovernmentAuth = async () => {
    setShowGovModal(false);
    setLoading(true);

    try {
      const authUrl = getGovernmentAuthUrl();
      console.log('[AuthPage] 跳转到政务中台:', authUrl);

      Taro.showToast({ title: '正在跳转政务中台...', icon: 'none', duration: 2000 });

      setTimeout(async () => {
        try {
          const mockCode = `gov_${Date.now()}`;
          const success = await governmentAuthCallback(mockCode);
          if (success) {
            Taro.showToast({ title: '登录成功', icon: 'success' });
            setTimeout(() => {
              Taro.switchTab({ url: '/pages/home/index' });
            }, 1000);
          }
        } catch (error) {
          console.error('[AuthPage] 政务中台认证失败', error);
          Taro.showToast({ title: '认证失败，请重试', icon: 'none' });
        } finally {
          setLoading(false);
        }
      }, 2000);
    } catch (error) {
      console.error('[AuthPage] 政务中台跳转失败', error);
      Taro.showToast({ title: '跳转失败，请重试', icon: 'none' });
      setLoading(false);
    }
  };

  const handleOtherLogin = (type: string) => {
    Taro.showToast({ title: `${type}登录功能开发中`, icon: 'none' });
  };

  const clearPhoneInput = () => {
    setPhoneForm(prev => ({ ...prev, phone: '' }));
    setErrors(prev => {
      const { phone, ...rest } = prev;
      return rest;
    });
  };

  const clearAccountInput = () => {
    setPasswordForm(prev => ({ ...prev, account: '' }));
    setErrors(prev => {
      const { account, ...rest } = prev;
      return rest;
    });
  };

  const clearNameInput = () => {
    setCertForm(prev => ({ ...prev, name: '' }));
    setErrors(prev => {
      const { name, ...rest } = prev;
      return rest;
    });
  };

  const clearIdCardInput = () => {
    setCertForm(prev => ({ ...prev, idCard: '' }));
    setErrors(prev => {
      const { idCard, ...rest } = prev;
      return rest;
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.logoSection}>
          <View className={styles.logoIcon}>🏛️</View>
          <Text className={styles.appName}>江苏政务服务</Text>
          <Text className={styles.appSlogan}>让政务服务更便捷 让群众办事更省心</Text>
        </View>

        <View className={styles.authCard}>
          <View className={styles.tabs}>
            <Text
              className={`${styles.tabItem} ${activeTab === 'sms' ? styles.active : ''}`}
              onClick={() => {
                setActiveTab('sms');
                setErrors({});
              }}
            >
              短信登录
            </Text>
            <Text
              className={`${styles.tabItem} ${activeTab === 'password' ? styles.active : ''}`}
              onClick={() => {
                setActiveTab('password');
                setErrors({});
              }}
            >
              密码登录
            </Text>
            <Text
              className={`${styles.tabItem} ${activeTab === 'cert' ? styles.active : ''}`}
              onClick={() => {
                setActiveTab('cert');
                setErrors({});
              }}
            >
              证件登录
            </Text>
          </View>

          <View className={styles.tabContent}>
            {activeTab === 'sms' && (
              <View>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>手机号</Text>
                  <View className={`${styles.inputWrapper} ${errors.phone ? styles.error : ''}`}>
                    <Text className={styles.inputIcon}>📱</Text>
                    <Input
                      className={styles.input}
                      type="number"
                      placeholder="请输入手机号"
                      maxlength={11}
                      value={phoneForm.phone}
                      onInput={e => setPhoneForm(prev => ({ ...prev, phone: e.detail.value }))}
                    />
                    <View className={styles.inputSuffix}>
                      {phoneForm.phone && (
                        <Text
                          className={`${styles.clearBtn} ${styles.visible}`}
                          onClick={clearPhoneInput}
                        >
                          <Text>×</Text>
                        </Text>
                      )}
                    </View>
                  </View>
                  {errors.phone && <Text className={styles.errorMsg}>{errors.phone}</Text>}
                </View>

                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>验证码</Text>
                  <View className={`${styles.inputWrapper} ${errors.code ? styles.error : ''}`}>
                    <Text className={styles.inputIcon}>🔐</Text>
                    <Input
                      className={styles.input}
                      type="number"
                      placeholder="请输入6位验证码"
                      maxlength={6}
                      value={phoneForm.code}
                      onInput={e => setPhoneForm(prev => ({ ...prev, code: e.detail.value }))}
                    />
                    <View className={styles.inputSuffix}>
                      <Text
                        className={`${styles.codeBtn} ${countdown > 0 ? styles.disabled : ''}`}
                        onClick={countdown > 0 ? undefined : handleSendCode}
                      >
                        {countdown > 0 ? `${countdown}s后重试` : '获取验证码'}
                      </Text>
                    </View>
                  </View>
                  {errors.code && <Text className={styles.errorMsg}>{errors.code}</Text>}
                </View>

                <View className={styles.formActions}>
                  <View
                    className={styles.rememberMe}
                    onClick={() => setPhoneForm(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
                  >
                    <View className={`${styles.checkbox} ${phoneForm.rememberMe ? styles.checked : ''}`}>
                      {phoneForm.rememberMe && <Text>✓</Text>}
                    </View>
                    <Text className={styles.rememberText}>记住手机号</Text>
                  </View>
                </View>

                <View
                  className={`${styles.submitBtn} ${(loading || !phoneForm.phone || !phoneForm.code) ? styles.disabled : ''}`}
                  onClick={!loading && phoneForm.phone && phoneForm.code ? handlePhoneLogin : undefined}
                >
                  <Text>{loading ? '登录中...' : '登 录'}</Text>
                </View>
              </View>
            )}

            {activeTab === 'password' && (
              <View>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>账号</Text>
                  <View className={`${styles.inputWrapper} ${errors.account ? styles.error : ''}`}>
                    <Text className={styles.inputIcon}>👤</Text>
                    <Input
                      className={styles.input}
                      placeholder="请输入账号/手机号/身份证号"
                      value={passwordForm.account}
                      onInput={e => setPasswordForm(prev => ({ ...prev, account: e.detail.value }))}
                    />
                    <View className={styles.inputSuffix}>
                      {passwordForm.account && (
                        <Text
                          className={`${styles.clearBtn} ${styles.visible}`}
                          onClick={clearAccountInput}
                        >
                          <Text>×</Text>
                        </Text>
                      )}
                    </View>
                  </View>
                  {errors.account && <Text className={styles.errorMsg}>{errors.account}</Text>}
                </View>

                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>密码</Text>
                  <View className={`${styles.inputWrapper} ${errors.password ? styles.error : ''}`}>
                    <Text className={styles.inputIcon}>🔒</Text>
                    <Input
                      className={styles.input}
                      password={!passwordForm.showPassword}
                      placeholder="请输入登录密码"
                      value={passwordForm.password}
                      onInput={e => setPasswordForm(prev => ({ ...prev, password: e.detail.value }))}
                    />
                    <View className={styles.inputSuffix}>
                      <Text
                        className={styles.passwordToggle}
                        onClick={() => setPasswordForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      >
                        {passwordForm.showPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    </View>
                  </View>
                  {errors.password && <Text className={styles.errorMsg}>{errors.password}</Text>}
                </View>

                <View className={styles.formActions}>
                  <View
                    className={styles.rememberMe}
                    onClick={() => setPasswordForm(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
                  >
                    <View className={`${styles.checkbox} ${passwordForm.rememberMe ? styles.checked : ''}`}>
                      {passwordForm.rememberMe && <Text>✓</Text>}
                    </View>
                    <Text className={styles.rememberText}>记住账号</Text>
                  </View>
                  <Text
                    className={styles.forgotPassword}
                    onClick={() => Taro.showToast({ title: '请联系客服重置密码', icon: 'none' })}
                  >
                    忘记密码？
                  </Text>
                </View>

                <View
                  className={`${styles.submitBtn} ${(loading || !passwordForm.account || !passwordForm.password) ? styles.disabled : ''}`}
                  onClick={!loading && passwordForm.account && passwordForm.password ? handlePasswordLogin : undefined}
                >
                  <Text>{loading ? '登录中...' : '登 录'}</Text>
                </View>
              </View>
            )}

            {activeTab === 'cert' && (
              <View>
                <View className={styles.goldCard}>
                  <View className={styles.goldCardHeader}>
                    <Text className={styles.goldCardIcon}>🥇</Text>
                    <Text className={styles.goldCardTitle}>实名证件登录</Text>
                  </View>
                  <Text className={styles.goldCardDesc}>
                    使用身份证号和姓名进行实名认证，配合人脸核验完成登录，享受更高级别的安全保护。
                  </Text>
                </View>

                <View className={styles.certInputRow}>
                  <View className={styles.formGroup}>
                    <Text className={styles.formLabel}>姓名</Text>
                    <View className={`${styles.inputWrapper} ${errors.name ? styles.error : ''}`}>
                      <Text className={styles.inputIcon}>📝</Text>
                      <Input
                        className={styles.input}
                        placeholder="真实姓名"
                        value={certForm.name}
                        onInput={e => setCertForm(prev => ({ ...prev, name: e.detail.value }))}
                      />
                      {certForm.name && (
                        <Text
                          className={`${styles.clearBtn} ${styles.visible}`}
                          onClick={clearNameInput}
                        >
                          <Text>×</Text>
                        </Text>
                      )}
                    </View>
                    {errors.name && <Text className={styles.errorMsg}>{errors.name}</Text>}
                  </View>
                </View>

                <View className={styles.certInputRow}>
                  <View className={styles.formGroup} style={{ width: '100%' }}>
                    <Text className={styles.formLabel}>身份证号</Text>
                    <View className={`${styles.inputWrapper} ${errors.idCard ? styles.error : ''}`}>
                      <Text className={styles.inputIcon}>🪪</Text>
                      <Input
                        className={styles.input}
                        placeholder="请输入18位身份证号"
                        maxlength={18}
                        value={certForm.idCard}
                        onInput={e => setCertForm(prev => ({ ...prev, idCard: e.detail.value.toUpperCase() }))}
                      />
                      {certForm.idCard && (
                        <Text
                          className={`${styles.clearBtn} ${styles.visible}`}
                          onClick={clearIdCardInput}
                        >
                          <Text>×</Text>
                        </Text>
                      )}
                    </View>
                    {errors.idCard && <Text className={styles.errorMsg}>{errors.idCard}</Text>}
                  </View>
                </View>

                <View
                  className={`${styles.submitBtn} ${(loading || !certForm.name || !certForm.idCard) ? styles.disabled : ''}`}
                  onClick={!loading && certForm.name && certForm.idCard ? handleCertLogin : undefined}
                >
                  <Text>{loading ? '处理中...' : '开始人脸核验'}</Text>
                </View>
              </View>
            )}

            {errors.agreement && (
              <Text className={styles.errorMsg}>{errors.agreement}</Text>
            )}

            <View className={styles.divider}>
              <Text>其他登录方式</Text>
            </View>

            <View className={styles.otherLoginMethods}>
              <View className={styles.loginMethod} onClick={handleGovernmentAuth}>
                <View className={`${styles.methodIcon} ${styles.gov}`}>
                  <Text>🏛️</Text>
                </View>
                <Text className={styles.methodName}>政务中台</Text>
              </View>
              <View className={styles.loginMethod} onClick={() => handleOtherLogin('微信')}>
                <View className={`${styles.methodIcon} ${styles.wechat}`}>
                  <Text>💬</Text>
                </View>
                <Text className={styles.methodName}>微信</Text>
              </View>
              <View className={styles.loginMethod} onClick={() => handleOtherLogin('支付宝')}>
                <View className={`${styles.methodIcon} ${styles.alipay}`}>
                  <Text>💰</Text>
                </View>
                <Text className={styles.methodName}>支付宝</Text>
              </View>
            </View>

            <View className={styles.privacyTip}>
              <Text className={styles.privacyIcon}>🔒</Text>
              <Text className={styles.privacyText}>
                我们严格保护您的个人信息和隐私安全。登录即表示您已阅读并同意
                <Text className={styles.link} onClick={() => Taro.showToast({ title: '用户协议', icon: 'none' })}>《用户协议》</Text>
                和
                <Text className={styles.link} onClick={() => Taro.showToast({ title: '隐私政策', icon: 'none' })}>《隐私政策》</Text>
              </Text>
            </View>

            <View
              className={styles.agreement}
              onClick={() => {
                const targetForm = activeTab === 'sms' ? 'phoneForm' : activeTab === 'password' ? 'passwordForm' : 'certForm';
                if (targetForm === 'phoneForm') {
                  setPhoneForm(prev => ({ ...prev, agreeToTerms: !prev.agreeToTerms }));
                } else if (targetForm === 'passwordForm') {
                  setPasswordForm(prev => ({ ...prev, agreeToTerms: !prev.agreeToTerms }));
                } else {
                  setCertForm(prev => ({ ...prev, agreeToTerms: !prev.agreeToTerms }));
                }
              }}
            >
              <View className={styles.agreementCheckbox}>
                <View className={`${styles.checkbox} ${
                  (activeTab === 'sms' && phoneForm.agreeToTerms) ||
                  (activeTab === 'password' && passwordForm.agreeToTerms) ||
                  (activeTab === 'cert' && certForm.agreeToTerms)
                    ? styles.checked : ''
                }`}>
                  {((activeTab === 'sms' && phoneForm.agreeToTerms) ||
                    (activeTab === 'password' && passwordForm.agreeToTerms) ||
                    (activeTab === 'cert' && certForm.agreeToTerms)) && <Text>✓</Text>}
                </View>
              </View>
              <Text className={styles.agreementText}>
                我已阅读并同意
                <Text className={styles.link} onClick={(e) => { e.stopPropagation(); Taro.showToast({ title: '用户协议', icon: 'none' }); }}>《用户协议》</Text>
                、
                <Text className={styles.link} onClick={(e) => { e.stopPropagation(); Taro.showToast({ title: '隐私政策', icon: 'none' }); }}>《隐私政策》</Text>
                及
                <Text className={styles.link} onClick={(e) => { e.stopPropagation(); Taro.showToast({ title: '人脸认证须知', icon: 'none' }); }}>《人脸认证须知》</Text>
                ，并授权平台获取必要的信息用于身份核验。
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.footer}>
          <Text className={styles.copyright}>
            江苏省大数据管理中心 主办{'\n'}
            技术支持电话：12345
          </Text>
          <View className={styles.securityBadges}>
            <View className={styles.securityBadge}>
              <Text className={styles.securityIcon}>🔐</Text>
              <Text className={styles.securityText}>SSL加密</Text>
            </View>
            <View className={styles.securityBadge}>
              <Text className={styles.securityIcon}>🛡️</Text>
              <Text className={styles.securityText}>安全认证</Text>
            </View>
            <View className={styles.securityBadge}>
              <Text className={styles.securityIcon}>📜</Text>
              <Text className={styles.securityText}>等保三级</Text>
            </View>
          </View>
        </View>
      </View>

      {showFaceAuthModal && (
        <View
          className={styles.faceAuthModal}
          onClick={() => !faceAuthing && setShowFaceAuthModal(false)}
        >
          <View className={styles.faceAuthContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.faceAuthTitle}>人脸核验</Text>
            <Text className={styles.faceAuthDesc}>
              请将面部正对摄像头，保持光线充足
            </Text>

            <View className={`${styles.faceAuthFrame} ${
              faceAuthStatus === 'scanning' ? styles.scanning :
              faceAuthStatus === 'success' ? styles.success : ''
            }`}>
              <Text className={`${styles.faceIcon} ${faceAuthStatus === 'success' ? styles.success : ''}`}>
                {faceAuthStatus === 'success' ? '✅' : '😊'}
              </Text>
              {faceAuthStatus === 'scanning' && <View className={styles.faceScanLine} />}
            </View>

            <View className={styles.faceAuthTips}>
              <View className={styles.faceTip}>
                <Text className={styles.faceTipIcon}>💡</Text>
                <Text className={styles.faceTipText}>光线充足</Text>
              </View>
              <View className={styles.faceTip}>
                <Text className={styles.faceTipIcon}>👀</Text>
                <Text className={styles.faceTipText}>正视镜头</Text>
              </View>
              <View className={styles.faceTip}>
                <Text className={styles.faceTipIcon}>🚫</Text>
                <Text className={styles.faceTipText}>不戴墨镜</Text>
              </View>
            </View>

            <Text className={`${styles.faceAuthStatus} ${
              faceAuthStatus === 'scanning' ? styles.scanning :
              faceAuthStatus === 'success' ? styles.success : ''
            }`}>
              {faceAuthStatus === 'idle' && '点击开始核验按钮'}
              {faceAuthStatus === 'scanning' && '正在识别中...'}
              {faceAuthStatus === 'success' && '核验成功！'}
            </Text>

            <View className={styles.faceAuthActions}>
              <View
                className={`${styles.modalBtn} ${styles.cancel}`}
                onClick={() => !faceAuthing && setShowFaceAuthModal(false)}
              >
                取消
              </View>
              <View
                className={`${styles.modalBtn} ${styles.confirm} ${
                  faceAuthStatus !== 'idle' ? styles.disabled : ''
                }`}
                onClick={faceAuthStatus === 'idle' ? startFaceAuth : undefined}
              >
                {faceAuthing ? '核验中...' : '开始核验'}
              </View>
            </View>
          </View>
        </View>
      )}

      {showGovModal && (
        <View
          className={styles.governmentAuthModal}
          onClick={() => setShowGovModal(false)}
        >
          <View className={styles.govModalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.govModalHeader}>
              <View className={styles.govModalIcon}>🏛️</View>
              <Text className={styles.govModalTitle}>江苏政务服务网</Text>
              <Text className={styles.govModalSubtitle}>
                跳转到江苏省政务服务平台进行统一身份认证
              </Text>
            </View>

            <View className={styles.govFeatureList}>
              <View className={styles.govFeature}>
                <Text className={styles.govFeatureIcon}>🔐</Text>
                <Text className={styles.govFeatureText}>统一身份认证，一次登录全网通行</Text>
              </View>
              <View className={styles.govFeature}>
                <Text className={styles.govFeatureIcon}>🛡️</Text>
                <Text className={styles.govFeatureText}>政务级安全保障，信息加密传输</Text>
              </View>
              <View className={styles.govFeature}>
                <Text className={styles.govFeatureIcon}>⚡</Text>
                <Text className={styles.govFeatureText}>快速认证，无需重复填写信息</Text>
              </View>
              <View className={styles.govFeature}>
                <Text className={styles.govFeatureIcon}>📋</Text>
                <Text className={styles.govFeatureText}>已接入全省50+部门业务系统</Text>
              </View>
            </View>

            <View className={styles.govModalActions}>
              <View
                className={`${styles.modalBtn} ${styles.cancel}`}
                onClick={() => setShowGovModal(false)}
              >
                取消
              </View>
              <View
                className={`${styles.modalBtn} ${styles.confirm}`}
                onClick={confirmGovernmentAuth}
              >
                立即跳转
              </View>
            </View>
          </View>
        </View>
      )}

      {loading && (
        <View className={styles.loadingOverlay}>
          <View className={styles.loadingContent}>
            <View className={styles.loadingSpinner} />
            <Text className={styles.loadingText}>处理中...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AuthPage;
