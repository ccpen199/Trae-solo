import React, { useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { PageHeader, Timeline } from '@/components';
import { faceAuth, getCurrentUser } from '@/services/auth';
import { getPensionBalance } from '@/services/user';
import { applyMatter } from '@/services/matter';
import { maskIdCard, formatDateTime, formatDate } from '@/utils/format';
import type { UserInfo } from '@/types/user';
import styles from './index.module.scss';

interface CertRecord {
  id: string;
  date: string;
  method: 'face' | 'idcard' | 'bank' | 'community';
  status: 'success' | 'fail';
  result?: string;
  operator?: string;
  location?: string;
}

interface AuthMethod {
  key: string;
  name: string;
  desc: string;
  icon: string;
  enabled: boolean;
}

const PensionCertPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [pensionInfo, setPensionInfo] = useState<any>(null);
  const [certStatus, setCertStatus] = useState<'valid' | 'expired' | 'pending'>('valid');
  const [lastCertDate, setLastCertDate] = useState<string>('2026-01-15');
  const [nextCertDate, setNextCertDate] = useState<string>('2027-01-14');
  const [selectedMethod, setSelectedMethod] = useState<string>('face');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [certResult, setCertResult] = useState<{ certId: string; certTime: string; validTo: string } | null>(null);
  const [certRecords, setCertRecords] = useState<CertRecord[]>([]);
  const [authProgress, setAuthProgress] = useState(0);

  const authMethods: AuthMethod[] = [
    { key: 'face', name: '人脸识别认证', desc: '最便捷，刷脸即可完成', icon: '👤', enabled: true },
    { key: 'idcard', name: '身份证信息认证', desc: '需填写身份证号和姓名', icon: '🪪', enabled: true },
    { key: 'bank', name: '银行账户认证', desc: '通过养老金账户验证', icon: '🏦', enabled: true },
    { key: 'community', name: '社区线下认证', desc: '前往社区服务中心办理', icon: '🏘️', enabled: false }
  ];

  const mockCertRecords: CertRecord[] = [
    { id: '1', date: '2026-01-15 10:30:00', method: 'face', status: 'success', result: '认证通过', operator: '系统自动', location: '江苏省人社厅' },
    { id: '2', date: '2025-07-20 14:15:00', method: 'face', status: 'success', result: '认证通过', operator: '系统自动', location: '江苏省人社厅' },
    { id: '3', date: '2025-01-10 09:45:00', method: 'idcard', status: 'success', result: '认证通过', operator: '张XX', location: '南京市玄武区社保中心' },
    { id: '4', date: '2024-08-05 16:20:00', method: 'face', status: 'fail', result: '人脸不匹配', operator: '系统自动', location: '江苏省人社厅' },
    { id: '5', date: '2024-08-05 16:25:00', method: 'face', status: 'success', result: '认证通过', operator: '系统自动', location: '江苏省人社厅' }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [user, pension] = await Promise.all([
        getCurrentUser(),
        getPensionBalance()
      ]);
      setUserInfo(user);
      setPensionInfo(pension);
      setCertRecords(mockCertRecords);

      const now = new Date();
      const lastCert = new Date(lastCertDate);
      const nextCert = new Date(nextCertDate);
      if (now > nextCert) {
        setCertStatus('expired');
      } else if (now.getTime() - nextCert.getTime() < 30 * 24 * 60 * 60 * 1000) {
        setCertStatus('pending');
      } else {
        setCertStatus('valid');
      }
    } catch (error) {
      console.error('[PensionCertPage] 加载数据失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    loadData();
  });

  const handleMethodSelect = (method: AuthMethod) => {
    if (!method.enabled) {
      Taro.showToast({ title: '该认证方式暂未开放', icon: 'none' });
      return;
    }
    setSelectedMethod(method.key);
  };

  const handleStartAuth = () => {
    if (selectedMethod === 'face') {
      setShowAuthModal(true);
      setAuthProgress(0);
      startFaceAuth();
    } else if (selectedMethod === 'idcard') {
      Taro.showModal({
        title: '身份证信息认证',
        content: '确认使用当前身份信息进行认证？',
        success: (res) => {
          if (res.confirm) {
            submitCert('idcard');
          }
        }
      });
    } else if (selectedMethod === 'bank') {
      Taro.showModal({
        title: '银行账户认证',
        content: '将通过您的养老金发放账户进行验证，确认继续？',
        success: (res) => {
          if (res.confirm) {
            submitCert('bank');
          }
        }
      });
    }
  };

  const startFaceAuth = () => {
    const steps = [
      { progress: 20, tip: '正在检测人脸...' },
      { progress: 40, tip: '请眨眨眼...' },
      { progress: 60, tip: '请摇摇头...' },
      { progress: 80, tip: '正在比对身份...' },
      { progress: 100, tip: '认证完成' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setAuthProgress(steps[currentStep].progress);
        currentStep++;
      } else {
        clearInterval(interval);
        completeFaceAuth();
      }
    }, 1000);
  };

  const completeFaceAuth = async () => {
    try {
      const success = await faceAuth({
        faceImage: `face_cert_${Date.now()}.jpg`,
        liveAction: 'blink,shake'
      });

      if (success) {
        setShowAuthModal(false);
        await submitCert('face');
      } else {
        setShowAuthModal(false);
        Taro.showToast({ title: '人脸核验失败，请重试', icon: 'none' });
      }
    } catch (error) {
      console.error('[PensionCertPage] 人脸认证失败', error);
      setShowAuthModal(false);
      Taro.showToast({ title: '认证失败，请重试', icon: 'none' });
    }
  };

  const submitCert = async (method: string) => {
    setLoading(true);
    try {
      const result = await applyMatter({
        matterCode: 'PENSION_CERT',
        matterName: '养老待遇资格认证',
        matterType: 'pension_certification',
        formData: {
          method,
          name: userInfo?.name,
          idCard: userInfo?.idCard
        },
        materials: [],
        isUrgent: false,
        isCrossProvince: false
      });

      if (result.success) {
        const newCertDate = new Date();
        const validTo = new Date();
        validTo.setFullYear(validTo.getFullYear() + 1);

        setCertResult({
          certId: result.matterCode || '',
          certTime: newCertDate.toISOString(),
          validTo: validTo.toISOString()
        });

        setLastCertDate(newCertDate.toISOString().split('T')[0]);
        setNextCertDate(validTo.toISOString().split('T')[0]);
        setCertStatus('valid');

        const newRecord: CertRecord = {
          id: Date.now().toString(),
          date: formatDateTime(newCertDate.toISOString()),
          method: method as any,
          status: 'success',
          result: '认证通过',
          operator: '系统自动',
          location: '江苏省人社厅'
        };
        setCertRecords(prev => [newRecord, ...prev]);

        setShowSuccess(true);
      } else {
        Taro.showToast({ title: result.message || '认证失败', icon: 'none' });
      }
    } catch (error) {
      console.error('[PensionCertPage] 提交认证失败', error);
      Taro.showToast({ title: '认证失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
    setAuthProgress(0);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    loadData();
  };

  const getMethodText = (method: string) => {
    const methodMap: Record<string, string> = {
      face: '人脸识别',
      idcard: '身份证认证',
      bank: '银行账户',
      community: '社区认证'
    };
    return methodMap[method] || method;
  };

  const getStatusText = () => {
    const statusMap = {
      valid: { text: '认证有效', class: '' },
      expired: { text: '已过期', class: 'expired' },
      pending: { text: '即将到期', class: 'pending' }
    };
    return statusMap[certStatus];
  };

  return (
    <View className={styles.page}>
      <PageHeader
        title="养老待遇资格认证"
        subtitle="足不出户 在线认证 安心领取"
      />

      <View className={styles.content}>
        <View className={styles.statusCard}>
          <View className={styles.statusHeader}>
            <View>
              <Text className={styles.statusTitle}>当前认证状态</Text>
              <View className={`${styles.statusBadge} ${styles[getStatusText().class]}`}>
                {certStatus === 'valid' ? '✓' : certStatus === 'expired' ? '!' : '⏰'}
                {getStatusText().text}
              </View>
            </View>
          </View>
          <View className={styles.statusInfo}>
            <Text className={styles.userName}>{userInfo?.name || '---'}</Text>
            <Text className={styles.idCard}>{maskIdCard(userInfo?.idCard || '')}</Text>
            <Text className={styles.validDate}>
              上次认证：{formatDate(lastCertDate)} | 有效期至：{formatDate(nextCertDate)}
            </Text>
          </View>
        </View>

        {pensionInfo && (
          <View style={{ background: '#fff', borderRadius: '16rpx', padding: '32rpx', marginBottom: '24rpx' }}>
            <View style={{ fontSize: '28rpx', fontWeight: '600', color: '#303133', marginBottom: '20rpx' }}>
              📊 养老金信息
            </View>
            <View style={{ display: 'flex', justifyContent: 'space-around' }}>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: $color-primary, display: 'block' }}>
                  ¥{pensionInfo.monthlyPension?.toFixed(2) || '0.00'}
                </Text>
                <Text style={{ fontSize: '22rpx', color: '#909399' }}>月养老金</Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#52C41A', display: 'block' }}>
                  {pensionInfo.totalMonths || 0}
                </Text>
                <Text style={{ fontSize: '22rpx', color: '#909399' }}>累计缴费月数</Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#FA8C16', display: 'block' }}>
                  ¥{(pensionInfo.personalAccount || 0).toLocaleString()}
                </Text>
                <Text style={{ fontSize: '22rpx', color: '#909399' }}>个人账户</Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.noticeCard}>
          <View className={styles.noticeTitle}>
            <Text className={styles.icon}>📋</Text>
            <Text>认证须知</Text>
          </View>
          <View className={styles.noticeContent}>
            <Text className={styles.noticeItem}>养老待遇资格认证每年需要完成一次，未按时认证将暂停待遇发放</Text>
            <Text className={styles.noticeItem}>支持多种认证方式，推荐使用人脸识别，足不出户即可完成</Text>
            <Text className={styles.noticeItem}>认证过程中请确保光线充足，面部清晰可见</Text>
            <Text className={styles.noticeItem}>长三角地区异地居住人员可直接在线完成认证</Text>
            <Text className={styles.noticeItem}>如有疑问，请拨打服务热线：12333</Text>
          </View>
        </View>

        <View className={styles.authSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.icon}>🔐</Text>
            <Text>选择认证方式</Text>
          </View>
          <View className={styles.authMethods}>
            {authMethods.map(method => (
              <View
                key={method.key}
                className={`${styles.authMethodCard} ${selectedMethod === method.key ? 'active' : ''} ${!method.enabled ? 'disabled' : ''}`}
                onClick={() => handleMethodSelect(method)}
              >
                <View className={styles.methodIcon}>{method.icon}</View>
                <View className={styles.methodInfo}>
                  <Text className={styles.methodName}>{method.name}</Text>
                  <Text className={styles.methodDesc}>{method.desc}</Text>
                </View>
                <Text className={styles.methodArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>

        {selectedMethod === 'face' && (
          <View className={styles.faceAuthCard}>
            <View className={styles.faceIcon}>📷</View>
            <Text className={styles.faceTip}>
              请将面部对准摄像头，保持光线充足，按照提示完成眨眼、摇头等动作。
            </Text>
            <View className={styles.authBtn} onClick={handleStartAuth}>
              开始人脸识别认证
            </View>
          </View>
        )}

        <View className={styles.historySection}>
          <View className={styles.historyHeader}>
            <View className={styles.title}>
              <Text className={styles.icon}>📜</Text>
              <Text>认证历史记录</Text>
            </View>
            <Text className={styles.count}>共 {certRecords.length} 条记录</Text>
          </View>

          {certRecords.length > 0 ? (
            <View className={styles.historyList}>
              {certRecords.map(record => (
                <View key={record.id} className={styles.historyItem}>
                  <View className={`${styles.statusIcon} ${styles[record.status]}`}>
                    {record.status === 'success' ? '✓' : '✕'}
                  </View>
                  <View className={styles.historyInfo}>
                    <Text className={styles.date}>{record.date}</Text>
                    <Text className={styles.method}>
                      {getMethodText(record.method)} · {record.location}
                    </Text>
                  </View>
                  <View className={`${styles.historyStatus} ${styles[record.status]}`}>
                    {record.status === 'success' ? '成功' : '失败'}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.empty}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyText}>暂无认证记录</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.footer}>
        <View
          className={`${styles.authBtn} ${loading || certStatus === 'valid' ? 'disabled' : ''}`}
          onClick={!loading && certStatus !== 'valid' ? handleStartAuth : undefined}
        >
          {loading ? '认证中...' : certStatus === 'valid' ? '✓ 本年度已完成认证' : '立即认证'}
        </View>
        <Text className={styles.btnTip}>
          {certStatus === 'pending' ? '距离认证到期不足30天，请及时完成认证' : certStatus === 'expired' ? '您的认证已过期，请立即完成认证' : '下一次认证时间：' + formatDate(nextCertDate)}
        </Text>
      </View>

      {showAuthModal && (
        <View className={styles.authModal}>
          <View className={styles.closeBtn} onClick={handleCloseAuthModal}>✕</View>
          <Text className={styles.modalTitle}>养老待遇资格认证</Text>
          <View className={styles.cameraArea}>
            <View className={styles.faceIcon}>👤</View>
            <View className={styles.scanLine} />
            <Text className={styles.tipText}>
              {authProgress < 40 ? '请将面部对准框内' : authProgress < 80 ? '请按照提示做动作' : '正在验证身份...'}
            </Text>
          </View>
          <View className={styles.actionTips}>
            <Text className={styles.tip}>认证进度：{authProgress}%</Text>
            <Text className={styles.tip}>请保持光线充足，面部正对摄像头</Text>
          </View>
        </View>
      )}

      {showSuccess && certResult && (
        <View className={styles.successModal}>
          <View className={styles.modalContent}>
            <View className={styles.successIcon}>🎉</View>
            <Text className={styles.successTitle}>认证成功</Text>
            <Text className={styles.successDesc}>
              您已成功完成养老待遇资格认证，养老金将按时发放。
            </Text>
            <View className={styles.certInfo}>
              <View className={styles.infoItem}>
                <Text className={styles.label}>认证编号</Text>
                <Text className={styles.value}>{certResult.certId}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.label}>认证时间</Text>
                <Text className={styles.value}>{formatDateTime(certResult.certTime)}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.label}>有效期至</Text>
                <Text className={styles.value}>{formatDate(certResult.validTo)}</Text>
              </View>
            </View>
            <View className={styles.confirmBtn} onClick={handleCloseSuccess}>
              我知道了
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PensionCertPage;
