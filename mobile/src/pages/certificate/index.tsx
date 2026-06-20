import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import dayjs from 'dayjs';
import PageContainer from '@/components/PageContainer';
import { getUserCert, refreshCert } from '@/services/auth';
import type { CACertificate, ElectronicLicense } from '@/types';
import { mockCertificate, mockLicenses, mockUser } from '@/data/mock';
import styles from './index.module.scss';

const CertificatePage: React.FC = () => {
  const [cert, setCert] = useState<CACertificate>(mockCertificate);
  const [licenses] = useState<ElectronicLicense[]>(mockLicenses);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCert = useCallback(async () => {
    try {
      const c = await getUserCert();
      setCert(c);
    } catch (err: any) {
      console.error('[Cert] 加载证书失败:', err);
    } finally {
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => { loadCert(); }, [loadCert]);
  useDidShow(() => loadCert());
  usePullDownRefresh(() => loadCert());

  const daysLeft = dayjs(cert.validTo).diff(dayjs(), 'day');
  const totalDays = dayjs(cert.validTo).diff(dayjs(cert.validFrom), 'day');
  const passedDays = totalDays - daysLeft;
  const progressPct = totalDays > 0 ? Math.max(0, Math.min(100, (passedDays / totalDays) * 100)) : 0;

  const handleRefreshCert = async () => {
    setRefreshing(true);
    Taro.showLoading({ title: '证书续期中...', mask: true });
    try {
      const newCert = await refreshCert();
      setCert(newCert);
      Taro.hideLoading();
      Taro.showModal({
        title: '续期成功',
        content: `CA数字证书续期成功！\n\n新有效期至：${newCert.validTo.slice(0, 10)}\n\n请妥善保管您的证书信息。`,
        showCancel: false,
        confirmColor: '#1E5DAB'
      });
    } catch (err: any) {
      Taro.hideLoading();
      console.error('[Cert] 续期失败:', err);
      Taro.showModal({
        title: '续期提示',
        content: '演示环境续期服务暂不可用，是否模拟续期成功？',
        success: (r) => {
          if (r.confirm) {
            const newCert = { ...cert, validTo: dayjs(cert.validTo).add(2, 'year').format('YYYY-MM-DD HH:mm:ss') };
            setCert(newCert);
            Taro.showToast({ title: '续期成功（演示）', icon: 'success' });
          }
        }
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewDetails = () => {
    Taro.showModal({
      title: 'CA证书详情',
      content: `证书序列号：${cert.certSn}\n\n签发机构：${cert.issuer}\n证书主题：${cert.subject}\n\n算法类型：${cert.certType}（国家商用密码）\n证书状态：${cert.status === 'active' ? '有效' : '已失效'}\n\n公钥摘要：\n${cert.publicKey.slice(0, 64)}...\n\n* 本证书由省级电子认证服务中心签发，符合《电子签名法》规定，可用于政务业务电子签名。`,
      showCancel: false,
      confirmColor: '#1E5DAB'
    });
  };

  const handleLicenseDetail = (lic: ElectronicLicense) => {
    Taro.showModal({
      title: lic.licenseType,
      content: `持有人：${lic.holderName}\n证照号：${lic.licenseNo}\n签发机关：${lic.issuer}\n签发日期：${lic.issueDate}\n有效期至：${lic.validTo}\n\n状态：${lic.status === 'valid' ? '有效' : lic.status === 'expired' ? '已过期' : '已注销'}\n\n* 本证照来源于省级电子证照库，与实体证照具有同等法律效力。`,
      confirmText: '查看证照',
      cancelText: '关闭',
      confirmColor: '#1E5DAB'
    });
  };

  return (
    <PageContainer scroll padding safeBottom>
      {/* CA数字证书卡片 */}
      <View className={styles.certCard}>
        <View className={styles.certHeader}>
          <View className={styles.certTitleRow}>
            <Text className={styles.certIcon}>🔐</Text>
            <Text className={styles.certTitle}>CA数字证书</Text>
            <View className={styles.certTypeTag}>{cert.certType} 国密</View>
          </View>
          <View className={styles.certStatus}>
            <View className={styles.certDot} />
            <Text>{cert.status === 'active' ? '证书有效' : '已失效'}</Text>
          </View>
        </View>

        <View className={styles.certSn}>
          <View className={styles.certSnLabel}>证书序列号</View>
          <View className={styles.certSnValue}>{cert.certSn}</View>
        </View>

        <View className={styles.certOwnerRow}>
          <View className={styles.certField}>
            <Text className={styles.certFieldLabel}>持有人</Text>
            <Text className={styles.certFieldValue}>{mockUser.name}</Text>
          </View>
          <View className={styles.certField}>
            <Text className={styles.certFieldLabel}>身份证</Text>
            <Text className={styles.certFieldValue}>{mockUser.idCardNo}</Text>
          </View>
          <View className={styles.certField}>
            <Text className={styles.certFieldLabel}>签发机构</Text>
            <Text className={styles.certFieldValue}>{cert.issuer.slice(0, 8)}...</Text>
          </View>
          <View className={styles.certField}>
            <Text className={styles.certFieldLabel}>签发日期</Text>
            <Text className={styles.certFieldValue}>{cert.validFrom.slice(0, 10)}</Text>
          </View>
        </View>

        <View className={styles.certValidity}>
          <View className={styles.certValidityRow}>
            <Text className={styles.certValidityLabel}>有效期</Text>
            <Text className={styles.certValidityValue}>
              {cert.validFrom.slice(0, 10)} ~ {cert.validTo.slice(0, 10)}
            </Text>
          </View>
          <View className={styles.certProgress}>
            <View className={styles.certProgressFill} style={{ width: `${progressPct}%` }} />
          </View>
          <View className={styles.certDaysLeft}>
            {daysLeft > 30
              ? `剩余 ${daysLeft} 天到期`
              : daysLeft > 0
                ? `⚠️ 即将到期，剩余 ${daysLeft} 天`
                : '🔴 证书已过期'}
          </View>
        </View>
      </View>

      {/* 证书操作 */}
      <View className={styles.actionRow}>
        <Button className={`${styles.actionBtn} ${styles.btnOutline}`} onClick={handleViewDetails}>
          证书详情
        </Button>
        {daysLeft < 90 && (
          <Button
            className={`${styles.actionBtn} ${styles.btnSuccess}`}
            onClick={handleRefreshCert}
            loading={refreshing}
          >
            续期证书
          </Button>
        )}
      </View>

      {/* 电子证照 */}
      <View className={styles.sectionCard}>
        <View className={styles.sectionTitle}>
          <Text style={{ fontSize: '32rpx' }}>🪪</Text>
          <Text>我的电子证照</Text>
          <View style={{
            marginLeft: 'auto',
            fontSize: '22rpx',
            color: '#00B42A',
            padding: '4rpx 12rpx',
            background: 'rgba(0,180,42,0.08)',
            borderRadius: '8rpx'
          }}>
            省级证照库
          </View>
        </View>

        {licenses.map(lic => (
          <View
            key={lic.id}
            className={styles.licenseItem}
            onClick={() => handleLicenseDetail(lic)}
          >
            <View className={styles.licenseIcon} style={{
              background: lic.licenseType.includes('身份')
                ? 'linear-gradient(135deg, #E8F0FE, #D4E4FC)'
                : 'linear-gradient(135deg, #E8FCF0, #CCF0D9)'
            }}>
              <Text>{lic.licenseType.includes('身份') ? '🪪' : '📋'}</Text>
            </View>
            <View className={styles.licenseInfo}>
              <Text className={styles.licenseName}>{lic.licenseType}</Text>
              <View className={styles.licenseMeta}>
                <Text>持有人：{lic.holderName}</Text>
                {'\n'}
                <Text>证照号：{lic.licenseNo}</Text>
                {'\n'}
                <Text>有效期至：{lic.validTo}</Text>
              </View>
            </View>
            <View className={styles.licenseStatusTag} style={{
              background: lic.status === 'valid' ? 'rgba(0,180,42,0.08)' : 'rgba(245,63,63,0.08)',
              color: lic.status === 'valid' ? '#00B42A' : '#F53F3F'
            }}>
              <Text>{lic.status === 'valid' ? '有效' : lic.status === 'expired' ? '过期' : '注销'}</Text>
            </View>
          </View>
        ))}

        <View className={styles.actionRow}>
          <Button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={() => {
            Taro.showToast({ title: '证照同步中...', icon: 'loading', duration: 1500 });
          }}>
            同步更多证照
          </Button>
        </View>
      </View>

      {/* 安全保障 */}
      <View className={styles.sectionCard}>
        <View className={styles.sectionTitle}>
          <Text style={{ fontSize: '32rpx' }}>🛡️</Text>
          <Text>安全保障说明</Text>
        </View>
        <View className={styles.securityList}>
          {[
            { icon: '🔐', iconBg: 'linear-gradient(135deg, #E8F0FE, #D4E4FC)', name: 'SM2/SM4国密算法', desc: '采用国家密码管理局认证的商用密码算法进行端到端加密，符合政务信息安全要求' },
            { icon: '🏛️', iconBg: 'linear-gradient(135deg, #E8FCF0, #CCF0D9)', name: '省级CA中心签发', desc: '数字证书由省级电子认证服务中心（CA）签发，列入国家信任锚目录' },
            { icon: '⏰', iconBg: 'linear-gradient(135deg, #FCF3E8, #F8E4CC)', name: '权威时间戳（TSA）', desc: '全部签署操作通过国家授时中心时间戳服务固化，精确到毫秒级' },
            { icon: '☁️', iconBg: 'linear-gradient(135deg, #F4E8FC, #E4CCF8)', name: '政务云存储', desc: '所有证书、签名、档案均存储于省级政务云，符合数据安全法要求' }
          ].map((item, idx) => (
            <View key={idx} className={styles.securityItem}>
              <View className={styles.securityIcon} style={{ background: item.iconBg }}>
                <Text>{item.icon}</Text>
              </View>
              <View className={styles.securityContent}>
                <Text className={styles.securityName}>{item.name}</Text>
                <Text className={styles.securityDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </PageContainer>
  );
};

export default CertificatePage;
