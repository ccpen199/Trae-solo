import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import SearchBar from '../../components/SearchBar';
import AccessibilityFab from '../../components/AccessibilityFab';
import { useAppStore } from '../../store/appStore';
import classnames from 'classnames';

type CertStatus = 'valid' | 'expiring' | 'expired';
type CertCategory = 'identity' | 'social' | 'driving' | 'property' | 'other';

interface Certificate {
  id: string;
  icon: string;
  name: string;
  department: string;
  validFrom: string;
  validTo: string;
  status: CertStatus;
  category: CertCategory;
  cached: boolean;
  holderName: string;
  certNumber: string;
  usageRecords: { date: string; scene: string }[];
}

const categoryTabs: { key: CertCategory | 'all'; name: string }[] = [
  { key: 'all', name: '全部' },
  { key: 'identity', name: '身份证明' },
  { key: 'social', name: '社保证明' },
  { key: 'driving', name: '驾驶出行' },
  { key: 'property', name: '房产税务' },
  { key: 'other', name: '其他' },
];

const certificates: Certificate[] = [
  {
    id: 'cert-1',
    icon: '🪪',
    name: '身份证电子副本',
    department: '公安局',
    validFrom: '2020-06-15',
    validTo: '2040-06-15',
    status: 'valid',
    category: 'identity',
    cached: true,
    holderName: '张三',
    certNumber: '4101**********1234',
    usageRecords: [
      { date: '2026-05-20', scene: '政务服务大厅身份核验' },
      { date: '2026-04-12', scene: '银行开户身份验证' },
      { date: '2026-03-08', scene: '酒店入住登记' },
    ],
  },
  {
    id: 'cert-2',
    icon: '🛡️',
    name: '社保卡',
    department: '人社局',
    validFrom: '2021-01-10',
    validTo: '2031-01-10',
    status: 'valid',
    category: 'social',
    cached: true,
    holderName: '张三',
    certNumber: 'HB2021****5678',
    usageRecords: [
      { date: '2026-06-01', scene: '门诊医保结算' },
      { date: '2026-05-15', scene: '药店购药医保支付' },
    ],
  },
  {
    id: 'cert-3',
    icon: '💊',
    name: '医保电子凭证',
    department: '医保局',
    validFrom: '2022-03-01',
    validTo: '2027-03-01',
    status: 'valid',
    category: 'social',
    cached: false,
    holderName: '张三',
    certNumber: 'YB2022****9012',
    usageRecords: [
      { date: '2026-06-10', scene: '医院挂号结算' },
      { date: '2026-05-28', scene: '医保账户查询' },
    ],
  },
  {
    id: 'cert-4',
    icon: '🚗',
    name: '驾驶证',
    department: '交警支队',
    validFrom: '2019-08-20',
    validTo: '2025-08-20',
    status: 'expiring',
    category: 'driving',
    cached: false,
    holderName: '张三',
    certNumber: 'JS2019****3456',
    usageRecords: [
      { date: '2026-05-30', scene: '租车平台身份验证' },
      { date: '2026-04-22', scene: '交通违法处理' },
    ],
  },
  {
    id: 'cert-5',
    icon: '🏠',
    name: '公积金缴存证明',
    department: '公积金中心',
    validFrom: '2026-01-01',
    validTo: '2027-01-01',
    status: 'valid',
    category: 'social',
    cached: true,
    holderName: '张三',
    certNumber: 'GJJ2026****7890',
    usageRecords: [
      { date: '2026-06-05', scene: '房贷申请提交' },
      { date: '2026-03-15', scene: '公积金提取办理' },
    ],
  },
  {
    id: 'cert-6',
    icon: '📋',
    name: '社保参保证明',
    department: '人社局',
    validFrom: '2026-06-01',
    validTo: '2027-06-01',
    status: 'valid',
    category: 'social',
    cached: true,
    holderName: '张三',
    certNumber: 'SB2026****2345',
    usageRecords: [
      { date: '2026-06-12', scene: '居住证办理' },
      { date: '2026-05-01', scene: '子女入学报名' },
    ],
  },
  {
    id: 'cert-7',
    icon: '🏗️',
    name: '不动产权证明',
    department: '自然资源局',
    validFrom: '2018-12-05',
    validTo: '长期',
    status: 'valid',
    category: 'property',
    cached: false,
    holderName: '张三',
    certNumber: 'BD2018****6789',
    usageRecords: [
      { date: '2026-02-20', scene: '二手房交易过户' },
      { date: '2025-11-10', scene: '抵押贷款申请' },
    ],
  },
  {
    id: 'cert-8',
    icon: '🧾',
    name: '个税完税证明',
    department: '税务局',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'valid',
    category: 'property',
    cached: false,
    holderName: '张三',
    certNumber: 'GS2026****0123',
    usageRecords: [
      { date: '2026-04-01', scene: '年度个税汇算清缴' },
      { date: '2026-03-10', scene: '贷款收入证明补充' },
    ],
  },
  {
    id: 'cert-9',
    icon: '📌',
    name: '居住证',
    department: '公安局',
    validFrom: '2024-09-01',
    validTo: '2025-09-01',
    status: 'expired',
    category: 'identity',
    cached: false,
    holderName: '张三',
    certNumber: 'JZ2024****4567',
    usageRecords: [
      { date: '2025-08-15', scene: '子女入学登记' },
      { date: '2025-05-20', scene: '社区服务登记' },
    ],
  },
  {
    id: 'cert-10',
    icon: '👶',
    name: '出生医学证明',
    department: '卫健委',
    validFrom: '2022-07-10',
    validTo: '长期',
    status: 'valid',
    category: 'other',
    cached: false,
    holderName: '张小四',
    certNumber: 'CS2022****8901',
    usageRecords: [
      { date: '2024-09-01', scene: '幼儿园入学报名' },
      { date: '2022-08-05', scene: '户口登记' },
    ],
  },
  {
    id: 'cert-11',
    icon: '💍',
    name: '结婚证',
    department: '民政局',
    validFrom: '2021-05-20',
    validTo: '长期',
    status: 'valid',
    category: 'other',
    cached: false,
    holderName: '张三、李四',
    certNumber: 'JH2021****2345',
    usageRecords: [
      { date: '2024-03-15', scene: '房产共有登记' },
      { date: '2023-06-01', scene: '生育登记办理' },
    ],
  },
  {
    id: 'cert-12',
    icon: '🏢',
    name: '营业执照',
    department: '市场监管局',
    validFrom: '2023-04-18',
    validTo: '长期',
    status: 'valid',
    category: 'other',
    cached: true,
    holderName: '郑州某某科技有限公司',
    certNumber: 'YY2023****6789',
    usageRecords: [
      { date: '2026-05-25', scene: '银行对公账户开立' },
      { date: '2026-01-10', scene: '年度报告公示' },
      { date: '2025-09-08', scene: '招投标资质验证' },
    ],
  },
];

const statusConfig: Record<CertStatus, { label: string; className: string }> = {
  valid: { label: '有效', className: 'statusValid' },
  expiring: { label: '即将过期', className: 'statusExpiring' },
  expired: { label: '已过期', className: 'statusExpired' },
};

const CertificateListPage: React.FC = () => {
  const { speak, offlineMode } = useAppStore();
  const [activeTab, setActiveTab] = useState<CertCategory | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredCerts = useMemo(() => {
    let result = certificates;
    if (activeTab !== 'all') {
      result = result.filter(c => c.category === activeTab);
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      result = result.filter(
        c => c.name.toLowerCase().includes(kw) || c.department.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [activeTab, keyword]);

  const cachedCount = useMemo(
    () => certificates.filter(c => c.cached).length,
    []
  );

  const handleTabChange = useCallback(
    (key: CertCategory | 'all') => {
      setActiveTab(key);
      const tab = categoryTabs.find(t => t.key === key);
      speak(tab ? `切换到${tab.name}分类` : '查看全部分类');
    },
    [speak]
  );

  const handleCardClick = useCallback(
    (cert: Certificate) => {
      speak(`${cert.name}，${statusConfig[cert.status].label}`);
      setSelectedCert(cert);
      setShowDetail(true);
    },
    [speak]
  );

  const handleCloseDetail = useCallback(() => {
    setShowDetail(false);
    speak('关闭证照详情');
  }, [speak]);

  const handleView = useCallback(
    (cert: Certificate) => {
      speak(`正在查看${cert.name}`);
      Taro.showToast({ title: `正在打开${cert.name}`, icon: 'none' });
    },
    [speak]
  );

  const handleDownload = useCallback(
    (cert: Certificate) => {
      if (offlineMode) {
        Taro.showToast({ title: '离线模式下暂不支持下载', icon: 'none' });
        return;
      }
      speak(`正在下载${cert.name}`);
      Taro.showToast({ title: `${cert.name}下载中...`, icon: 'none' });
    },
    [speak, offlineMode]
  );

  const handleCache = useCallback(
    (cert: Certificate) => {
      if (cert.cached) {
        speak(`${cert.name}已缓存`);
        Taro.showToast({ title: `${cert.name}已缓存`, icon: 'none' });
        return;
      }
      speak(`正在缓存${cert.name}到本地`);
      Taro.showToast({ title: `${cert.name}缓存中...`, icon: 'none' });
    },
    [speak]
  );

  const handleSearch = useCallback(
    (kw: string) => {
      setKeyword(kw);
    },
    []
  );

  return (
    <View className={styles.container}>
      <SearchBar placeholder="搜索证照名称、发放部门..." onSearch={handleSearch} />

      {offlineMode && (
        <View className={styles.offlineBanner}>
          <Text>📴 离线模式 - 已缓存 {cachedCount} 项证照可离线查看</Text>
        </View>
      )}

      <View className={styles.categoryTabs}>
        {categoryTabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.tabActive)}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text>{tab.name}</Text>
          </View>
        ))}
      </View>

      <View className={styles.listHeader}>
        <Text className={styles.listTitle}>我的证照</Text>
        <Text className={styles.listMeta}>共 {filteredCerts.length} 项</Text>
      </View>

      {filteredCerts.length > 0 ? (
        <View className={styles.certGrid}>
          {filteredCerts.map(cert => (
            <View
              key={cert.id}
              className={styles.certCard}
              onClick={() => handleCardClick(cert)}
            >
              <View className={styles.certHeader}>
                <View className={styles.certIconWrap}>
                  <Text className={styles.certIcon}>{cert.icon}</Text>
                </View>
                <View className={styles.certInfo}>
                  <Text className={styles.certName}>{cert.name}</Text>
                  <Text className={styles.certDept}>{cert.department}</Text>
                </View>
              </View>
              <View className={styles.certMeta}>
                <Text className={styles.certValid}>有效期至 {cert.validTo}</Text>
                <View
                  className={classnames(
                    styles.statusTag,
                    styles[statusConfig[cert.status].className]
                  )}
                >
                  <Text>{statusConfig[cert.status].label}</Text>
                </View>
              </View>
              <View className={styles.certFooter}>
                {cert.cached && (
                  <View className={styles.cachedTag}>
                    <Text>📥 已缓存</Text>
                  </View>
                )}
                <View className={styles.certActions}>
                  <View
                    className={styles.actionBtn}
                    onClick={e => { e.stopPropagation(); handleView(cert); }}
                  >
                    <Text>查看</Text>
                  </View>
                  <View
                    className={styles.actionBtn}
                    onClick={e => { e.stopPropagation(); handleDownload(cert); }}
                  >
                    <Text>下载</Text>
                  </View>
                  <View
                    className={classnames(
                      styles.actionBtn,
                      cert.cached && styles.actionBtnCached
                    )}
                    onClick={e => { e.stopPropagation(); handleCache(cert); }}
                  >
                    <Text>{cert.cached ? '已缓存' : '缓存'}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className={styles.emptyTip}>
          <Text className={styles.emptyIcon}>🔍</Text>
          <Text className={styles.emptyText}>未找到匹配的证照</Text>
          <Text
            className={styles.emptyAction}
            onClick={() => { setActiveTab('all'); setKeyword(''); }}
          >
            清除筛选条件
          </Text>
        </View>
      )}

      {showDetail && selectedCert && (
        <View className={styles.modalMask} onClick={handleCloseDetail}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <View className={styles.modalTitleRow}>
                <Text className={styles.modalIcon}>{selectedCert.icon}</Text>
                <View className={styles.modalTitleInfo}>
                  <Text className={styles.modalTitle}>{selectedCert.name}</Text>
                  <Text className={styles.modalDept}>{selectedCert.department}</Text>
                </View>
              </View>
              <View className={styles.modalClose} onClick={handleCloseDetail}>
                <Text>✕</Text>
              </View>
            </View>

            <ScrollView scrollY className={styles.modalBody}>
              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>证照信息</Text>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>持有人</Text>
                  <Text className={styles.detailValue}>{selectedCert.holderName}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>证照编号</Text>
                  <Text className={styles.detailValue}>{selectedCert.certNumber}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>发放部门</Text>
                  <Text className={styles.detailValue}>{selectedCert.department}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>有效期起</Text>
                  <Text className={styles.detailValue}>{selectedCert.validFrom}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>有效期至</Text>
                  <Text className={styles.detailValue}>{selectedCert.validTo}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>当前状态</Text>
                  <View
                    className={classnames(
                      styles.statusTag,
                      styles[statusConfig[selectedCert.status].className]
                    )}
                  >
                    <Text>{statusConfig[selectedCert.status].label}</Text>
                  </View>
                </View>
              </View>

              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>核验二维码</Text>
                <View className={styles.qrCodeWrap}>
                  <View className={styles.qrCodePlaceholder}>
                    <Text className={styles.qrCodeIcon}>▣</Text>
                    <Text className={styles.qrCodeText}>扫码核验证照真伪</Text>
                  </View>
                  <Text className={styles.qrCodeHint}>二维码5分钟内有效，可刷新</Text>
                </View>
              </View>

              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>使用记录</Text>
                {selectedCert.usageRecords.map((record, idx) => (
                  <View key={idx} className={styles.recordItem}>
                    <View className={styles.recordDot} />
                    <View className={styles.recordContent}>
                      <Text className={styles.recordScene}>{record.scene}</Text>
                      <Text className={styles.recordDate}>{record.date}</Text>
                    </View>
                  </View>
                ))}
                {selectedCert.usageRecords.length === 0 && (
                  <Text className={styles.noRecords}>暂无使用记录</Text>
                )}
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              <View
                className={styles.modalBtn}
                onClick={() => handleView(selectedCert)}
              >
                <Text>查看原件</Text>
              </View>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnPrimary)}
                onClick={() => handleDownload(selectedCert)}
              >
                <Text>下载证明</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <AccessibilityFab />
    </View>
  );
};

export default CertificateListPage;
