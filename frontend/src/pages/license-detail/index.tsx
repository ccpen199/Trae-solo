import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { PageHeader } from '@/components';
import { getLicenseDetail, reportLoss, unreportLoss, getLicenseUsageRecords, showECardQRCode } from '@/services/license';
import type { License, LicenseStatus, LicenseType } from '@/types/license';
import { formatDate, formatDateTime, maskIdCard, formatLicenseNumber } from '@/utils/format';
import styles from './index.module.scss';

const LicenseDetailPage: React.FC = () => {
  const router = useRouter();
  const licenseId = router.params.id || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [license, setLicense] = useState<License | null>(null);
  const [activeTab, setActiveTab] = useState<'verify' | 'usage'>('verify');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCountdown, setQrCountdown] = useState(60);
  const [showLossModal, setShowLossModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!licenseId) {
      Taro.showToast({ title: '证照ID不存在', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      const data = await getLicenseDetail(licenseId);
      setLicense(data);
    } catch (error) {
      console.error('[LicenseDetailPage] 加载数据失败', error);
      Taro.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [licenseId]);

  useDidShow(() => {
    loadData();
  });

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (showQRModal && qrCountdown > 0) {
      timer = setInterval(() => {
        setQrCountdown(prev => prev - 1);
      }, 1000);
    }
    if (qrCountdown === 0) {
      setShowQRModal(false);
    }
    return () => clearInterval(timer);
  }, [showQRModal, qrCountdown]);

  const getStatusClass = (status: LicenseStatus) => {
    switch (status) {
      case 'valid': return styles.licenseStatusActive;
      case 'expiring': return styles.licenseStatusExpiring;
      case 'expired':
      case 'revoked': return styles.licenseStatusExpired;
      default: return '';
    }
  };

  const getStatusText = (status: LicenseStatus) => {
    const texts: Record<LicenseStatus, string> = {
      valid: '有效',
      expiring: '即将到期',
      expired: '已过期',
      revoked: '已吊销',
      pending: '待领取'
    };
    return texts[status] || status;
  };

  const getLicenseIcon = (type: LicenseType) => {
    const icons: Record<LicenseType, string> = {
      social_security_card: '💳',
      professional_qualification: '📜',
      title_certificate: '🎓',
      pension_certificate: '👴',
      unemployment_certificate: '📋',
      labor_contract: '📝',
      other: '📄'
    };
    return icons[type] || '📄';
  };

  const getLicenseTypeName = (type: LicenseType) => {
    const names: Record<LicenseType, string> = {
      social_security_card: '社会保障卡',
      professional_qualification: '职业资格证书',
      title_certificate: '职称证书',
      pension_certificate: '养老待遇领取证',
      unemployment_certificate: '失业登记证',
      labor_contract: '劳动合同',
      other: '其他证照'
    };
    return names[type] || type;
  };

  const getVerifyMethodText = (method: string) => {
    const texts: Record<string, string> = {
      qrcode: '扫码验真',
      manual: '人工核验',
      online: '在线验真'
    };
    return texts[method] || method;
  };

  const getVerifyResultClass = (result: string) => {
    switch (result) {
      case 'valid': return styles.recordResultValid;
      case 'invalid': return styles.recordResultInvalid;
      case 'expired': return styles.recordResultExpired;
      default: return '';
    }
  };

  const getVerifyResultText = (result: string) => {
    const texts: Record<string, string> = {
      valid: '证照有效',
      invalid: '证照无效',
      expired: '证照过期'
    };
    return texts[result] || result;
  };

  const getUsageResultClass = (result: string) => {
    return result === 'success' ? styles.recordResultSuccess : styles.recordResultFailed;
  };

  const getUsageResultText = (result: string) => {
    return result === 'success' ? '使用成功' : '使用失败';
  };

  const handleShowQRCode = async () => {
    Taro.showLoading({ title: '生成二维码中...' });
    try {
      const data = await showECardQRCode();
      setQrCodeData(data);
      setQrCountdown(60);
      setShowQRModal(true);
    } catch (error) {
      console.error('[LicenseDetailPage] 生成二维码失败', error);
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' });
    } finally {
      Taro.hideLoading();
    }
  };

  const handleRefreshQR = async () => {
    Taro.showLoading({ title: '刷新中...' });
    try {
      const data = await showECardQRCode();
      setQrCodeData(data);
      setQrCountdown(60);
    } catch (error) {
      console.error('[LicenseDetailPage] 刷新二维码失败', error);
      Taro.showToast({ title: '刷新失败', icon: 'none' });
    } finally {
      Taro.hideLoading();
    }
  };

  const handleReportLoss = async () => {
    if (!license) return;

    setSubmitting(true);
    try {
      if (license.status === 'revoked') {
        const result = await unreportLoss(license.id);
        if (result.success) {
          Taro.showToast({ title: result.message, icon: 'success' });
          setShowLossModal(false);
          loadData();
        } else {
          Taro.showToast({ title: result.message, icon: 'none' });
        }
      } else {
        const result = await reportLoss(license.id);
        if (result.success) {
          Taro.showToast({ title: result.message, icon: 'success' });
          setShowLossModal(false);
          loadData();
        } else {
          Taro.showToast({ title: result.message, icon: 'none' });
        }
      }
    } catch (error) {
      console.error('[LicenseDetailPage] 操作失败', error);
      Taro.showToast({ title: '操作失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenew = async () => {
    if (!license) return;

    setSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      Taro.showToast({ title: '续期申请已提交，请等待审核', icon: 'success' });
      setShowRenewModal(false);
      loadData();
    } catch (error) {
      console.error('[LicenseDetailPage] 续期失败', error);
      Taro.showToast({ title: '续期失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const canReportLoss = () => {
    if (!license) return false;
    return license.status === 'valid' || license.status === 'expiring';
  };

  const canUnreportLoss = () => {
    if (!license) return false;
    return license.status === 'revoked';
  };

  const canRenew = () => {
    if (!license) return false;
    return license.status === 'expiring' || license.status === 'expired';
  };

  if (loading) {
    return (
      <View className={styles.page}>
        <PageHeader title="证照详情" subtitle="查看证照详细信息和使用记录" />
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  if (!license) {
    return (
      <View className={styles.page}>
        <PageHeader title="证照详情" subtitle="查看证照详细信息和使用记录" />
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>📭</Text>
          <Text className={styles.emptyText}>证照不存在或已被删除</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <PageHeader title="证照详情" subtitle="查看证照详细信息和使用记录" />

      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        <View className={styles.licenseCard}>
          <View className={styles.licenseHeader}>
            <Text className={styles.licenseIcon}>{getLicenseIcon(license.type)}</Text>
            <View style={{ flex: 1 }}>
              <Text className={styles.licenseType}>{getLicenseTypeName(license.type)}</Text>
              <Text className={styles.licenseName}>{license.name}</Text>
              <Text className={`${styles.licenseStatus} ${getStatusClass(license.status)}`}>
                {getStatusText(license.status)}
              </Text>
            </View>
          </View>
          <View className={styles.licenseInfo}>
            <View className={styles.licenseInfoRow}>
              <Text className={styles.licenseInfoLabel}>证照编号</Text>
              <Text className={`${styles.licenseInfoValue} ${styles.licenseNumber}`}>
                {formatLicenseNumber(license.licenseNumber)}
              </Text>
            </View>
            <View className={styles.licenseInfoRow}>
              <Text className={styles.licenseInfoLabel}>持证人</Text>
              <Text className={styles.licenseInfoValue}>{license.holderName}</Text>
            </View>
            <View className={styles.licenseInfoRow}>
              <Text className={styles.licenseInfoLabel}>身份证号</Text>
              <Text className={styles.licenseInfoValue}>{maskIdCard(license.holderIdCard)}</Text>
            </View>
            <View className={styles.licenseInfoRow}>
              <Text className={styles.licenseInfoLabel}>签发机关</Text>
              <Text className={styles.licenseInfoValue}>{license.issuer}</Text>
            </View>
          </View>
          <View className={styles.licenseFooter}>
            <View className={styles.licenseFooterItem}>
              <Text className={styles.licenseFooterLabel}>签发日期</Text>
              <Text className={styles.licenseFooterValue}>{formatDate(license.issueDate)}</Text>
            </View>
            <View className={styles.licenseFooterItem}>
              <Text className={styles.licenseFooterLabel}>有效期起</Text>
              <Text className={styles.licenseFooterValue}>{formatDate(license.validFrom)}</Text>
            </View>
            <View className={styles.licenseFooterItem}>
              <Text className={styles.licenseFooterLabel}>有效期至</Text>
              <Text className={styles.licenseFooterValue}>{formatDate(license.validTo)}</Text>
            </View>
          </View>
        </View>

        <View className={styles.qrSection}>
          <Text className={styles.qrTitle}>证照二维码</Text>
          <View className={styles.qrCodeBox}>
            <View className={styles.qrCode} />
            <Text className={styles.qrCodeData}>{license.qrCode.slice(0, 20)}...</Text>
          </View>
          <Text className={styles.qrTip}>点击按钮出示二维码进行亮证核验</Text>
          <Text className={styles.refreshBtn} onClick={handleShowQRCode}>
            出示二维码
          </Text>
        </View>

        <View className={styles.verifySection}>
          <View className={styles.verifySuccess}>
            <Text className={styles.verifyIcon}>✅</Text>
            <View className={styles.verifyContent}>
              <Text className={styles.verifyTitle}>证照已通过官方验真</Text>
              <Text className={styles.verifyDesc}>该证照信息与签发机关数据一致，真实有效</Text>
            </View>
          </View>
          <View className={styles.verifyInfo}>
            <Text className={styles.verifyLabel}>验证码</Text>
            <Text className={styles.verifyValue}>{license.verifyCode}</Text>
          </View>
          <View className={styles.verifyInfo}>
            <Text className={styles.verifyLabel}>最后验真时间</Text>
            <Text className={styles.verifyValue}>
              {license.verifyRecords.length > 0 
                ? formatDateTime(license.verifyRecords[0].verifyTime)
                : '暂无验真记录'}
            </Text>
          </View>
          <View className={styles.verifyInfo}>
            <Text className={styles.verifyLabel}>累计验真次数</Text>
            <Text className={styles.verifyValue}>{license.verifyRecords.length} 次</Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>证照记录</Text>
          </View>
          <View className={styles.tabBar}>
            <View
              className={`${styles.tabItem} ${activeTab === 'verify' ? styles.tabItemActive : ''}`}
              onClick={() => setActiveTab('verify')}
            >
              验真记录 ({license.verifyRecords.length})
            </View>
            <View
              className={`${styles.tabItem} ${activeTab === 'usage' ? styles.tabItemActive : ''}`}
              onClick={() => setActiveTab('usage')}
            >
              使用记录 ({license.usageRecords.length})
            </View>
          </View>

          {activeTab === 'verify' && (
            <View className={styles.recordList}>
              {license.verifyRecords.map(record => (
                <View key={record.id} className={styles.recordItem}>
                  <View className={styles.recordHeader}>
                    <Text className={styles.recordTitle}>{getVerifyMethodText(record.verifyMethod)}</Text>
                    <Text className={styles.recordTime}>{formatDateTime(record.verifyTime)}</Text>
                  </View>
                  <Text className={styles.recordMeta}>
                    核验人：{record.verifier} · 核验地点：{record.verifyLocation}
                  </Text>
                  <Text className={`${styles.recordResult} ${getVerifyResultClass(record.result)}`}>
                    {getVerifyResultText(record.result)}
                  </Text>
                </View>
              ))}
              {license.verifyRecords.length === 0 && (
                <View className={styles.empty}>
                  <Text className={styles.emptyIcon}>🔍</Text>
                  <Text className={styles.emptyText}>暂无验真记录</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'usage' && (
            <View className={styles.recordList}>
              {license.usageRecords.map(record => (
                <View key={record.id} className={styles.recordItem}>
                  <View className={styles.recordHeader}>
                    <Text className={styles.recordTitle}>{record.usageScene}</Text>
                    <Text className={styles.recordTime}>{formatDateTime(record.usageTime)}</Text>
                  </View>
                  <Text className={styles.recordMeta}>
                    使用地点：{record.usageLocation} · 操作人：{record.operator}
                  </Text>
                  <Text className={`${styles.recordResult} ${getUsageResultClass(record.result)}`}>
                    {getUsageResultText(record.result)}
                  </Text>
                </View>
              ))}
              {license.usageRecords.length === 0 && (
                <View className={styles.empty}>
                  <Text className={styles.emptyIcon}>📋</Text>
                  <Text className={styles.emptyText}>暂无使用记录</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>详细信息</Text>
          </View>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>证照类型代码</Text>
              <Text className={styles.infoValue}>{license.type}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>签发机关代码</Text>
              <Text className={styles.infoValue}>{license.issuerCode}</Text>
            </View>
            {license.frontImage && (
              <View className={`${styles.infoItem} ${styles.infoItemFull}`}>
                <Text className={styles.infoLabel}>证照正面</Text>
                <Text
                  className={styles.infoValue}
                  style={{ color: '$color-primary' }}
                  onClick={() => license.frontImage && Taro.previewImage({ urls: [license.frontImage] })}
                >
                  点击查看
                </Text>
              </View>
            )}
            {license.backImage && (
              <View className={`${styles.infoItem} ${styles.infoItemFull}`}>
                <Text className={styles.infoLabel}>证照背面</Text>
                <Text
                  className={styles.infoValue}
                  style={{ color: '$color-primary' }}
                  onClick={() => license.backImage && Taro.previewImage({ urls: [license.backImage] })}
                >
                  点击查看
                </Text>
              </View>
            )}
            {license.electronicSignature && (
              <View className={`${styles.infoItem} ${styles.infoItemFull}`}>
                <Text className={styles.infoLabel}>电子签名</Text>
                <Text className={styles.infoValue}>已添加电子签名</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View className={styles.footer}>
        <View
          className={`${styles.btn} ${canReportLoss() || canUnreportLoss() ? styles.btnDanger : styles.btnDisabled}`}
          onClick={() => (canReportLoss() || canUnreportLoss()) && setShowLossModal(true)}
        >
          {canUnreportLoss() ? '解挂失照' : '挂失'}
        </View>
        <View
          className={`${styles.btn} ${canRenew() ? styles.btnPrimary : styles.btnDisabled}`}
          onClick={() => canRenew() && setShowRenewModal(true)}
        >
          续期
        </View>
      </View>

      {showQRModal && qrCodeData && (
        <View className={styles.qrModal} onClick={() => setShowQRModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>证照二维码</Text>
              <Text className={styles.modalClose} onClick={() => setShowQRModal(false)}>✕</Text>
            </View>
            <View className={styles.qrCodeBox}>
              <View className={styles.qrCode} />
              <Text className={styles.qrCodeData}>{qrCodeData.slice(0, 30)}...</Text>
            </View>
            <Text className={styles.qrTip}>请将二维码靠近扫码设备</Text>
            <Text className={styles.qrCountdown}>二维码有效期 {qrCountdown} 秒</Text>
            <Text style={{ textAlign: 'center', color: '$color-primary', marginTop: 12, fontSize: 14 }} onClick={handleRefreshQR}>
              刷新二维码
            </Text>
            <View className={styles.userInfo}>
              <Text className={styles.userName}>{license.holderName}</Text>
              <Text className={styles.userCard}>{maskIdCard(license.holderIdCard)}</Text>
            </View>
          </View>
        </View>
      )}

      {showLossModal && (
        <View className={styles.confirmModal} onClick={() => !submitting && setShowLossModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalIcon}>
              {canUnreportLoss() ? '🔓' : '🔒'}
            </Text>
            <Text className={styles.modalTitle}>
              {canUnreportLoss() ? '确认解挂失照' : '确认挂失证照'}
            </Text>
            <Text className={styles.modalDesc}>
              {canUnreportLoss()
                ? '解挂后证照将恢复正常使用，请确认是否继续？'
                : '挂失后证照将无法使用，如需恢复需办理解挂手续。请确认是否继续？'}
            </Text>
            {!canUnreportLoss() && (
              <View className={styles.modalWarning}>
                ⚠️ 温馨提示：挂失后请及时补办新卡，避免影响您的正常使用。
              </View>
            )}
            <View className={styles.modalActions}>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                onClick={() => setShowLossModal(false)}
              >
                取消
              </View>
              <View
                className={`${styles.modalBtn} ${canUnreportLoss() ? styles.modalBtnPrimary : styles.modalBtnConfirm} ${submitting ? styles.modalBtnDisabled : ''}`}
                onClick={!submitting ? handleReportLoss : undefined}
              >
                {submitting ? '提交中...' : (canUnreportLoss() ? '确认解挂' : '确认挂失')}
              </View>
            </View>
          </View>
        </View>
      )}

      {showRenewModal && (
        <View className={styles.confirmModal} onClick={() => !submitting && setShowRenewModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalIcon}>🔄</Text>
            <Text className={styles.modalTitle}>确认续期证照</Text>
            <Text className={styles.modalDesc}>
              续期申请提交后将在3个工作日内完成审核，续期成功后有效期将延长1年。请确认是否继续？
            </Text>
            <View className={styles.modalWarning}>
              ⚠️ 续期费用：¥0.00（免费续期）· 预计审核时间：1-3个工作日
            </View>
            <View className={styles.modalActions}>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                onClick={() => setShowRenewModal(false)}
              >
                取消
              </View>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnPrimary} ${submitting ? styles.modalBtnDisabled : ''}`}
                onClick={!submitting ? handleRenew : undefined}
              >
                {submitting ? '提交中...' : '确认续期'}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default LicenseDetailPage;
