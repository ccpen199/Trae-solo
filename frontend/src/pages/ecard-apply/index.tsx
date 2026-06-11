import React, { useState, useCallback } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { PageHeader } from '@/components';
import { applyECard, activateECard } from '@/services/license';
import { faceAuth, getCurrentUser } from '@/services/auth';
import { getInsuranceInfo } from '@/services/user';
import { validateName, validateIdCard, validatePhone } from '@/utils/validator';
import { maskIdCard, maskPhone, formatDateTime } from '@/utils/format';
import type { InsuranceInfo } from '@/types/user';
import styles from './index.module.scss';

interface FormData {
  name: string;
  idCard: string;
  phone: string;
  insuredArea: string;
  deliveryMethod: 'self_pickup' | 'mail';
  deliveryAddress: string;
  bankName: string;
  bankCardNumber: string;
}

interface FormErrors {
  name?: string;
  idCard?: string;
  phone?: string;
  insuredArea?: string;
}

type ApplyStep = 'form' | 'face_auth' | 'review' | 'success';

const ECardApplyPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ApplyStep>('form');
  const [faceVerified, setFaceVerified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [applyResult, setApplyResult] = useState<{ cardNumber: string; applyTime: string } | null>(null);
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    idCard: '',
    phone: '',
    insuredArea: '',
    deliveryMethod: 'self_pickup',
    deliveryAddress: '',
    bankName: '',
    bankCardNumber: ''
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const insuredAreas = [
    { label: '南京市', value: '320100' },
    { label: '苏州市', value: '320500' },
    { label: '无锡市', value: '320200' },
    { label: '常州市', value: '320400' },
    { label: '镇江市', value: '321100' },
    { label: '南通市', value: '320600' },
    { label: '扬州市', value: '321000' },
    { label: '泰州市', value: '321200' },
    { label: '盐城市', value: '320900' },
    { label: '连云港市', value: '320700' },
    { label: '徐州市', value: '320300' },
    { label: '淮安市', value: '320800' },
    { label: '宿迁市', value: '321300' }
  ];

  const banks = [
    { label: '中国工商银行', value: 'ICBC' },
    { label: '中国建设银行', value: 'CCB' },
    { label: '中国农业银行', value: 'ABC' },
    { label: '中国银行', value: 'BOC' },
    { label: '交通银行', value: 'BOCOM' },
    { label: '江苏银行', value: 'JSB' },
    { label: '南京银行', value: 'NJCB' }
  ];

  const progressSteps = [
    { key: 'form', title: '填写信息' },
    { key: 'face_auth', title: '人脸核验' },
    { key: 'review', title: '提交审核' },
    { key: 'success', title: '申领完成' }
  ];

  const loadUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      const [user, insurance] = await Promise.all([
        getCurrentUser(),
        getInsuranceInfo()
      ]);
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          idCard: user.idCard || '',
          phone: user.phone || ''
        }));
      }
      setInsuranceInfo(insurance);
    } catch (error) {
      console.error('[ECardApplyPage] 加载用户信息失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    loadUserInfo();
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    const nameResult = validateName(formData.name);
    if (!nameResult.valid) {
      errors.name = nameResult.message;
    }

    const idCardResult = validateIdCard(formData.idCard);
    if (!idCardResult.valid) {
      errors.idCard = idCardResult.message;
    }

    const phoneResult = validatePhone(formData.phone);
    if (!phoneResult.valid) {
      errors.phone = phoneResult.message;
    }

    if (!formData.insuredArea) {
      errors.insuredArea = '请选择参保地';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFaceAuth = async () => {
    Taro.showLoading({ title: '人脸核验中...' });
    try {
      const success = await faceAuth({
        faceImage: `face_${Date.now()}.jpg`,
        liveAction: 'blink'
      });
      if (success) {
        setFaceVerified(true);
        Taro.showToast({ title: '核验成功', icon: 'success' });
        setTimeout(() => {
          setCurrentStep('review');
        }, 1500);
      } else {
        Taro.showToast({ title: '核验失败，请重试', icon: 'none' });
      }
    } catch (error) {
      console.error('[ECardApplyPage] 人脸核验失败', error);
      Taro.showToast({ title: '核验失败，请重试', icon: 'none' });
    } finally {
      Taro.hideLoading();
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'form') {
      if (validateForm()) {
        setCurrentStep('face_auth');
      }
    } else if (currentStep === 'review') {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await applyECard({
        name: formData.name,
        idCard: formData.idCard,
        phone: formData.phone,
        deliveryMethod: formData.deliveryMethod,
        deliveryAddress: formData.deliveryAddress,
        bankName: formData.bankName,
        bankCardNumber: formData.bankCardNumber
      });

      if (result.success && result.cardNumber) {
        await activateECard();
        setApplyResult({
          cardNumber: result.cardNumber,
          applyTime: new Date().toISOString()
        });
        setCurrentStep('success');
        setShowSuccess(true);
      } else {
        Taro.showToast({ title: result.message || '申领失败', icon: 'none' });
      }
    } catch (error) {
      console.error('[ECardApplyPage] 提交申请失败', error);
      Taro.showToast({ title: '申领失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleInsuredAreaChange = (e: any) => {
    const index = e.detail.value;
    handleInputChange('insuredArea', insuredAreas[index].value);
  };

  const handleBankChange = (e: any) => {
    const index = e.detail.value;
    handleInputChange('bankName', banks[index].label);
  };

  const handleGoHome = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  const handleViewCard = () => {
    Taro.navigateTo({ url: '/pages/license/index' });
  };

  const getCurrentProgress = () => {
    const stepIndex = progressSteps.findIndex(s => s.key === currentStep);
    return ((stepIndex + 1) / progressSteps.length) * 100;
  };

  const getStepStatus = (stepKey: string) => {
    const currentIndex = progressSteps.findIndex(s => s.key === currentStep);
    const stepIndex = progressSteps.findIndex(s => s.key === stepKey);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <View className={styles.page}>
      <PageHeader
        title="电子社保卡申领"
        subtitle="线上申领 极速制卡 全国通用"
      />

      <View className={styles.content}>
        <View className={styles.progressSection}>
          <View className={styles.progressHeader}>
            <Text className={styles.title}>申领进度</Text>
            <Text className={styles.progressText}>{Math.round(getCurrentProgress())}%</Text>
          </View>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${getCurrentProgress()}%` }} />
          </View>
          <View className={styles.progressSteps}>
            {progressSteps.map(step => {
              const status = getStepStatus(step.key);
              return (
                <View key={step.key} className={styles.step}>
                  <View className={`${styles.stepDot} ${styles[status]}`}>
                    {status === 'completed' ? '✓' : progressSteps.indexOf(step) + 1}
                  </View>
                  <Text className={`${styles.stepText} ${styles[status]}`}>{step.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {currentStep === 'form' && (
          <View className={styles.formCard}>
            <View className={styles.formTitle}>
              <Text className={styles.icon}>📝</Text>
              <Text>填写申领信息</Text>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>
                姓名
              </Text>
              <Input
                className={styles.input}
                placeholder="请输入真实姓名"
                value={formData.name}
                onInput={e => handleInputChange('name', e.detail.value)}
              />
              {formErrors.name && <Text className={styles.error}>{formErrors.name}</Text>}
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>
                身份证号
              </Text>
              <Input
                className={styles.input}
                placeholder="请输入18位身份证号"
                value={formData.idCard}
                onInput={e => handleInputChange('idCard', e.detail.value)}
                maxLength={18}
              />
              {formData.idCard && (
                <Text style={{ fontSize: '22rpx', color: '#909399', marginTop: '8rpx' }}>
                  {maskIdCard(formData.idCard)}
                </Text>
              )}
              {formErrors.idCard && <Text className={styles.error}>{formErrors.idCard}</Text>}
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>
                手机号
              </Text>
              <Input
                className={styles.input}
                placeholder="请输入11位手机号"
                value={formData.phone}
                onInput={e => handleInputChange('phone', e.detail.value)}
                type="number"
                maxLength={11}
              />
              {formData.phone && (
                <Text style={{ fontSize: '22rpx', color: '#909399', marginTop: '8rpx' }}>
                  {maskPhone(formData.phone)}
                </Text>
              )}
              {formErrors.phone && <Text className={styles.error}>{formErrors.phone}</Text>}
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>
                参保地
              </Text>
              <Picker
                mode="selector"
                range={insuredAreas.map(a => a.label)}
                value={insuredAreas.findIndex(a => a.value === formData.insuredArea)}
                onChange={handleInsuredAreaChange}
              >
                <View className={styles.picker}>
                  <Text className={formData.insuredArea ? '' : styles.placeholder}>
                    {formData.insuredArea
                      ? insuredAreas.find(a => a.value === formData.insuredArea)?.label
                      : '请选择参保地'}
                  </Text>
                  <Text className={styles.arrow}>›</Text>
                </View>
              </Picker>
              {formErrors.insuredArea && <Text className={styles.error}>{formErrors.insuredArea}</Text>}
            </View>

            {insuranceInfo && (
              <View style={{ background: '#f5f7fa', borderRadius: '12rpx', padding: '24rpx', marginBottom: '24rpx' }}>
                <Text style={{ fontSize: '24rpx', color: '#909399', marginBottom: '12rpx' }}>参保状态</Text>
                <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8rpx' }}>
                  <Text style={{ fontSize: '26rpx', color: '#606266' }}>险种类型</Text>
                  <Text style={{ fontSize: '26rpx', color: '#303133', fontWeight: '500' }}>{insuranceInfo.type}</Text>
                </View>
                <View style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: '26rpx', color: '#606266' }}>缴费状态</Text>
                  <Text style={{ fontSize: '26rpx', color: insuranceInfo.status === 'normal' ? '#52C41A' : '#FA8C16', fontWeight: '500' }}>
                    {insuranceInfo.status === 'normal' ? '正常缴费' : '缴费暂停'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {currentStep === 'face_auth' && (
          <View className={styles.faceAuthSection}>
            <View className={styles.sectionHeader}>
              <View className={styles.title}>
                <Text className={styles.icon}>👤</Text>
                <Text>人脸识别核验</Text>
              </View>
              <View className={`${styles.status} ${faceVerified ? 'success' : 'pending'}`}>
                {faceVerified ? '已核验' : '待核验'}
              </View>
            </View>

            {!faceVerified ? (
              <View className={styles.faceAuthCard}>
                <View className={styles.faceIcon}>📷</View>
                <Text className={styles.faceTip}>
                  为确保是您本人操作，需要进行人脸识别核验。{'\n'}
                  请保持光线充足，面部正对摄像头。
                </Text>
                <View className={styles.authBtn} onClick={handleFaceAuth}>
                  开始人脸识别
                </View>
              </View>
            ) : (
              <View style={{ background: 'rgba(82, 196, 26, 0.05)', borderRadius: '12rpx', padding: '32rpx', textAlign: 'center' }}>
                <Text style={{ fontSize: '60rpx', display: 'block', marginBottom: '16rpx' }}>✅</Text>
                <Text style={{ fontSize: '28rpx', color: '#52C41A', fontWeight: '600' }}>人脸核验通过</Text>
                <Text style={{ fontSize: '24rpx', color: '#909399', marginTop: '8rpx', display: 'block' }}>
                  核验时间：{formatDateTime(new Date())}
                </Text>
              </View>
            )}
          </View>
        )}

        {currentStep === 'review' && (
          <View className={styles.formCard}>
            <View className={styles.formTitle}>
              <Text className={styles.icon}>📋</Text>
              <Text>确认申领信息</Text>
            </View>

            <View style={{ gap: '24rpx', display: 'flex', flexDirection: 'column' }}>
              <View style={{ display: 'flex', justifyContent: 'space-between', padding: '16rpx 0', borderBottom: '1rpx solid #f0f0f0' }}>
                <Text style={{ fontSize: '26rpx', color: '#909399' }}>姓名</Text>
                <Text style={{ fontSize: '26rpx', color: '#303133', fontWeight: '500' }}>{formData.name}</Text>
              </View>
              <View style={{ display: 'flex', justifyContent: 'space-between', padding: '16rpx 0', borderBottom: '1rpx solid #f0f0f0' }}>
                <Text style={{ fontSize: '26rpx', color: '#909399' }}>身份证号</Text>
                <Text style={{ fontSize: '26rpx', color: '#303133', fontFamily: 'monospace' }}>{maskIdCard(formData.idCard)}</Text>
              </View>
              <View style={{ display: 'flex', justifyContent: 'space-between', padding: '16rpx 0', borderBottom: '1rpx solid #f0f0f0' }}>
                <Text style={{ fontSize: '26rpx', color: '#909399' }}>手机号</Text>
                <Text style={{ fontSize: '26rpx', color: '#303133' }}>{maskPhone(formData.phone)}</Text>
              </View>
              <View style={{ display: 'flex', justifyContent: 'space-between', padding: '16rpx 0', borderBottom: '1rpx solid #f0f0f0' }}>
                <Text style={{ fontSize: '26rpx', color: '#909399' }}>参保地</Text>
                <Text style={{ fontSize: '26rpx', color: '#303133' }}>
                  {insuredAreas.find(a => a.value === formData.insuredArea)?.label}
                </Text>
              </View>
              <View style={{ display: 'flex', justifyContent: 'space-between', padding: '16rpx 0' }}>
                <Text style={{ fontSize: '26rpx', color: '#909399' }}>人脸核验</Text>
                <Text style={{ fontSize: '26rpx', color: '#52C41A', fontWeight: '500' }}>已通过 ✓</Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.noticeSection}>
          <View className={styles.noticeTitle}>
            <Text className={styles.icon}>💡</Text>
            <Text>温馨提示</Text>
          </View>
          <View className={styles.noticeContent}>
            <Text className={styles.noticeItem}>电子社保卡与实体社保卡一一对应，具有同等法律效力</Text>
            <Text className={styles.noticeItem}>申领成功后，可在"我的证照"中查看和使用</Text>
            <Text className={styles.noticeItem}>社保卡金融功能需本人到银行网点激活</Text>
            <Text className={styles.noticeItem}>请妥善保管您的社保卡密码，不要泄露给他人</Text>
            <Text className={styles.noticeItem}>长三角地区已实现电子社保卡互认互通</Text>
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <View
          className={`${styles.submitBtn} ${loading ? 'disabled' : ''}`}
          onClick={!loading ? handleNextStep : undefined}
        >
          {loading ? '提交中...' : currentStep === 'form' ? '下一步' : currentStep === 'face_auth' ? (faceVerified ? '下一步' : '请先完成人脸核验') : '提交申领'}
        </View>
        <Text className={styles.btnTip}>点击提交即表示您同意《电子社保卡服务协议》</Text>
      </View>

      {showSuccess && applyResult && (
        <View className={styles.successModal}>
          <View className={styles.modalContent}>
            <View className={styles.successIcon}>🎉</View>
            <Text className={styles.successTitle}>申领提交成功</Text>
            <Text className={styles.successDesc}>
              您的电子社保卡申请已提交，将在3个工作日内完成制卡。
            </Text>
            <View className={styles.cardInfo}>
              <View className={styles.infoItem}>
                <Text className={styles.label}>社保卡号</Text>
                <Text className={styles.value}>{maskIdCard(applyResult.cardNumber)}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.label}>申请时间</Text>
                <Text className={styles.value}>{formatDateTime(applyResult.applyTime)}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.label}>预计制卡完成</Text>
                <Text className={styles.value}>3个工作日内</Text>
              </View>
            </View>
            <View className={styles.modalBtns}>
              <View className={`${styles.btn} outline`} onClick={handleGoHome}>
                返回首页
              </View>
              <View className={`${styles.btn} primary`} onClick={handleViewCard}>
                查看证照
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ECardApplyPage;
