import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { PageHeader, LicenseCard } from '@/components';
import { getLicenseList, getECardInfo } from '@/services/license';
import type { License, ECardInfo } from '@/types/license';
import { formatMoney, maskIdCard } from '@/utils/format';
import styles from './index.module.scss';

const LicensePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [eCardInfo, setECardInfo] = useState<ECardInfo | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');

  const tabs = [
    { key: 'all', name: '全部', filter: () => true },
    { key: 'active', name: '有效', filter: (l: License) => l.status === 'active' },
    { key: 'expiring', name: '即将到期', filter: (l: License) => l.status === 'expiring' },
    { key: 'expired', name: '已过期', filter: (l: License) => l.status === 'expired' || l.status === 'revoked' }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [licenseList, eCard] = await Promise.all([
        getLicenseList(),
        getECardInfo()
      ]);
      setLicenses(licenseList);
      setFilteredLicenses(licenseList);
      setECardInfo(eCard);
    } catch (error) {
      console.error('[LicensePage] 加载数据失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    loadData();
  });

  useEffect(() => {
    const tab = tabs.find(t => t.key === activeTab);
    if (tab) {
      setFilteredLicenses(licenses.filter(tab.filter));
    }
  }, [activeTab, licenses]);

  const handleTabClick = (key: string) => {
    setActiveTab(key as any);
  };

  const handleLicenseClick = (license: License) => {
    Taro.navigateTo({
      url: `/pages/license/detail?id=${license.id}`
    });
  };

  const handleShowQRCode = async () => {
    Taro.showLoading({ title: '生成二维码中...' });
    try {
      const { showECardQRCode } = await import('@/services/license');
      const data = await showECardQRCode();
      setQrCodeData(data);
      setShowQRCode(true);
    } catch (error) {
      Taro.showToast({ title: '生成失败', icon: 'none' });
    } finally {
      Taro.hideLoading();
    }
  };

  const handleApplyECard = () => {
    Taro.navigateTo({ url: '/pages/license/apply-ecard' });
  };

  const handleVerifyLicense = () => {
    Taro.navigateTo({ url: '/pages/license/verify' });
  };

  const handleAddLicense = () => {
    Taro.showActionSheet({
      itemList: ['添加电子证照', '关联实体证照', '证照扫描入库']
    }).then(res => {
      if (res.tapIndex === 0) {
        Taro.navigateTo({ url: '/pages/license/apply' });
      } else if (res.tapIndex === 1) {
        Taro.showToast({ title: '功能开发中', icon: 'none' });
      } else if (res.tapIndex === 2) {
        Taro.showToast({ title: '功能开发中', icon: 'none' });
      }
    }).catch(() => {});
  };

  const getStats = () => {
    return {
      total: licenses.length,
      active: licenses.filter(l => l.status === 'active').length,
      expiring: licenses.filter(l => l.status === 'expiring').length,
      expired: licenses.filter(l => l.status === 'expired' || l.status === 'revoked').length
    };
  };

  const stats = getStats();

  return (
    <View className={styles.page}>
      <PageHeader
        title="我的证照"
        subtitle="电子证照 随身携带 亮证即用"
      />

      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        {eCardInfo && (
          <View className={styles.ecardSection}>
            <View className={styles.ecardCard} onClick={handleShowQRCode}>
              <View className={styles.ecardGradient}>
                <View className={styles.ecardHeader}>
                  <View>
                    <Text className={styles.ecardLabel}>社会保障卡（电子）</Text>
                    <View className={styles.ecardStatus}>{eCardInfo.status === 'active' ? '已激活' : '未激活'}</View>
                  </View>
                  <View className={styles.ecardQRTip}>
                    <Text className={styles.ecardQRIcon}>📱</Text>
                    <Text className={styles.ecardQRText}>点击出示</Text>
                  </View>
                </View>
                <View className={styles.ecardBody}>
                  <Text className={styles.ecardName}>{eCardInfo.holderName}</Text>
                  <Text className={styles.ecardNumber}>{maskIdCard(eCardInfo.cardNumber)}</Text>
                  <Text className={styles.ecardIssue}>签发机关：{eCardInfo.issuer}</Text>
                </View>
                <View className={styles.ecardFooter}>
                  <View className={styles.ecardBalance}>
                    <Text className={styles.ecardBalanceLabel}>医保个人账户</Text>
                    <Text className={styles.ecardBalanceValue}>¥{formatMoney(eCardInfo.medicalBalance)}</Text>
                  </View>
                  <View className={styles.ecardValidity}>
                    <Text className={styles.ecardValidityLabel}>有效期至</Text>
                    <Text className={styles.ecardValidityValue}>{eCardInfo.validDate?.slice(0, 10)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className={styles.ecardActions}>
              <View className={styles.ecardAction} onClick={handleShowQRCode}>
                <Text className={styles.ecardActionIcon}>📱</Text>
                <Text className={styles.ecardActionText}>刷码</Text>
              </View>
              <View className={styles.ecardAction} onClick={handleVerifyLicense}>
                <Text className={styles.ecardActionIcon}>🔍</Text>
                <Text className={styles.ecardActionText}>验真</Text>
              </View>
              <View className={styles.ecardAction}>
                <Text className={styles.ecardActionIcon}>💰</Text>
                <Text className={styles.ecardActionText}>缴费</Text>
              </View>
              <View className={styles.ecardAction}>
                <Text className={styles.ecardActionIcon}>📄</Text>
                <Text className={styles.ecardActionText}>凭证</Text>
              </View>
              <View className={styles.ecardAction}>
                <Text className={styles.ecardActionIcon}>🔒</Text>
                <Text className={styles.ecardActionText}>挂失</Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.statsSection}>
          <View className={styles.statsCard}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.total}</Text>
              <Text className={styles.statLabel}>全部证照</Text>
            </View>
            <View className={styles.statDivider} />
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#52C41A' }}>{stats.active}</Text>
              <Text className={styles.statLabel}>有效</Text>
            </View>
            <View className={styles.statDivider} />
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#FA8C16' }}>{stats.expiring}</Text>
              <Text className={styles.statLabel}>即将到期</Text>
            </View>
            <View className={styles.statDivider} />
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#F5222D' }}>{stats.expired}</Text>
              <Text className={styles.statLabel}>已过期</Text>
            </View>
          </View>
        </View>

        <View className={styles.tabSection}>
          <View className={styles.tabBar}>
            {tabs.map(tab => (
              <View
                key={tab.key}
                className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
                onClick={() => handleTabClick(tab.key)}
              >
                <Text className={styles.tabName}>{tab.name}</Text>
                {activeTab === tab.key && <View className={styles.tabIndicator} />}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.licenseSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>我的证照</Text>
            <View className={styles.addBtn} onClick={handleAddLicense}>
              <Text className={styles.addIcon}>+</Text>
              <Text className={styles.addText}>添加</Text>
            </View>
          </View>

          {!eCardInfo?.status || eCardInfo.status !== 'active' ? (
            <View className={styles.noECardTip} onClick={handleApplyECard}>
              <Text className={styles.noECardIcon}>💳</Text>
              <View className={styles.noECardContent}>
                <Text className={styles.noECardTitle}>您还没有电子社保卡</Text>
                <Text className={styles.noECardDesc}>立即申领，享受便捷人社服务</Text>
              </View>
              <View className={styles.noECardBtn}>去申领</View>
            </View>
          ) : null}

          <View className={styles.licenseList}>
            {filteredLicenses.map(license => (
              <View key={license.id} className={styles.licenseItem}>
                <LicenseCard
                  license={license}
                  onClick={handleLicenseClick}
                />
              </View>
            ))}
            {filteredLicenses.length === 0 && (
              <View className={styles.empty}>
                <Text className={styles.emptyIcon}>📄</Text>
                <Text className={styles.emptyText}>暂无证照数据</Text>
              </View>
            )}
          </View>
        </View>

        <View className={styles.tipsSection}>
          <View className={styles.tipsCard}>
            <View className={styles.tipsHeader}>
              <Text className={styles.tipsIcon}>💡</Text>
              <Text className={styles.tipsTitle}>证照使用须知</Text>
            </View>
            <View className={styles.tipsContent}>
              <Text className={styles.tipItem}>• 电子证照与实体证照具有同等法律效力</Text>
              <Text className={styles.tipItem}>• 请妥善保管您的电子社保卡密码</Text>
              <Text className={styles.tipItem}>• 证照到期前请及时办理续期</Text>
              <Text className={styles.tipItem}>• 长三角地区证照已实现互认互通</Text>
            </View>
          </View>
        </View>

        <View className={styles.footer}>
          <Text className={styles.footerText}>— 证照数据由江苏省人力资源和社会保障厅提供 —</Text>
        </View>
      </ScrollView>

      {showQRCode && qrCodeData && (
        <View className={styles.qrModal} onClick={() => setShowQRCode(false)}>
          <View className={styles.qrModalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.qrModalHeader}>
              <Text className={styles.qrModalTitle}>电子社保卡二维码</Text>
              <View className={styles.qrModalClose} onClick={() => setShowQRCode(false)}>✕</View>
            </View>
            <View className={styles.qrCodeBox}>
              <View className={styles.qrCode}>
                <Text className={styles.qrCodeData}>{qrCodeData.slice(0, 20)}...</Text>
              </View>
              <Text className={styles.qrTip}>请将二维码靠近扫码设备</Text>
              <Text className={styles.qrCountdown}>二维码有效期 60 秒</Text>
            </View>
            <View className={styles.qrUserInfo}>
              <Text className={styles.qrUserName}>{eCardInfo?.holderName}</Text>
              <Text className={styles.qrUserCard}>{maskIdCard(eCardInfo?.cardNumber || '')}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default LicensePage;
