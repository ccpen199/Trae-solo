import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { PageHeader } from '@/components';
import { getCoordinationNodes, getCrossProvinceServices, getDataExchangeRecords, getCoordinationStats } from '@/services/crossProvince';
import { formatDateTime, formatNumber, formatBytes } from '@/utils/format';
import styles from './index.module.scss';

interface ProvinceCoordinationNode {
  code: string;
  name: string;
  status: string;
  endpoint: string;
  supportedServices: string[];
  responseTime: number;
  lastSyncTime: string;
  load: number;
  errorRate: number;
}

interface CrossProvinceService {
  id: string;
  serviceCode: string;
  serviceName: string;
  category: string;
  description: string;
  sourceProvince: string;
  targetProvinces: string[];
  supportedProvinces: string[];
  isOnline: boolean;
  averageProcessingTime: number;
  successRate: number;
  applyCount: number;
  satisfaction: number;
  enableStatus: string;
  businessLine: string;
}

interface DataExchangeRecord {
  id: string;
  sourceProvince: string;
  targetProvince: string;
  dataType: string;
  requestId: string;
  status: string;
  requestTime: string;
  responseTime: string | null;
  duration: number;
  dataSize: number;
  businessNo: string;
  errorCode: string | null;
  errorMessage: string | null;
  encryptionMethod: string;
  transmissionMethod: string;
}

interface CoordinationStats {
  todayTasks: number;
  todaySuccess: number;
  todayFail: number;
  successRate: number;
  averageResponseTime: number;
  activeNodes: number;
  totalServices: number;
  monthlyTasks: number;
  dataExchangeVolume: number;
}

const CrossProvincePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'exchange'>('services');
  const [activeCategory, setActiveCategory] = useState('all');
  const [nodes, setNodes] = useState<ProvinceCoordinationNode[]>([]);
  const [services, setServices] = useState<CrossProvinceService[]>([]);
  const [exchangeRecords, setExchangeRecords] = useState<DataExchangeRecord[]>([]);
  const [stats, setStats] = useState<CoordinationStats | null>(null);
  const [showNodeDetail, setShowNodeDetail] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ProvinceCoordinationNode | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nodesData, servicesData, recordsData, statsData] = await Promise.all([
        getCoordinationNodes(),
        getCrossProvinceServices(),
        getDataExchangeRecords(),
        getCoordinationStats()
      ]);
      setNodes(nodesData as unknown as ProvinceCoordinationNode[]);
      setServices(servicesData as unknown as CrossProvinceService[]);
      setExchangeRecords(recordsData as unknown as DataExchangeRecord[]);
      setStats(statsData as CoordinationStats);
    } catch (error) {
      console.error('[CrossProvincePage] 加载数据失败', error);
      Taro.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    loadData();
  });

  const getProvinceIcon = (code: string) => {
    const icons: Record<string, string> = {
      JS: '🏛️',
      SH: '🏙️',
      ZJ: '🌊',
      AH: '⛰️'
    };
    return icons[code] || '📍';
  };

  const getProvinceName = (code: string) => {
    const names: Record<string, string> = {
      JS: '江苏',
      SH: '上海',
      ZJ: '浙江',
      AH: '安徽'
    };
    return names[code] || code;
  };

  const getServiceIcon = (businessLine: string) => {
    const icons: Record<string, string> = {
      pension: '👴',
      medical: '🏥',
      unemployment: '📋',
      title: '🎓',
      default: '📄'
    };
    return icons[businessLine] || icons.default;
  };

  const getServiceCategories = () => {
    const categories = new Set(services.map(s => s.category));
    return ['all', ...Array.from(categories)];
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      all: '全部',
      '养老保险': '养老保险',
      '医疗保险': '医疗保险',
      '失业保险': '失业保险',
      '职称评审': '职称评审'
    };
    return names[category] || category;
  };

  const getFilteredServices = () => {
    if (activeCategory === 'all') return services;
    return services.filter(s => s.category === activeCategory);
  };

  const getExchangeStatusClass = (status: string) => {
    switch (status) {
      case 'success': return styles.exchangeStatusSuccess;
      case 'processing': return styles.exchangeStatusProcessing;
      case 'failed': return styles.exchangeStatusFailed;
      default: return '';
    }
  };

  const getExchangeStatusText = (status: string) => {
    const texts: Record<string, string> = {
      success: '交换成功',
      processing: '交换中',
      failed: '交换失败'
    };
    return texts[status] || status;
  };

  const getDataTypeName = (type: string) => {
    const names: Record<string, string> = {
      pension_cert: '养老待遇认证',
      ss_transfer: '社保关系转移',
      title_declare: '职称申报',
      medical_reimbursement: '医保报销'
    };
    return names[type] || type;
  };

  const handleNodeClick = (node: ProvinceCoordinationNode) => {
    setSelectedNode(node);
    setShowNodeDetail(true);
  };

  const handleServiceClick = (service: CrossProvinceService) => {
    Taro.showToast({ title: `即将办理：${service.serviceName}`, icon: 'none' });
  };

  const getHealthBarClass = (rate: number) => {
    if (rate >= 99) return styles.healthBarFill;
    if (rate >= 95) return styles.healthBarFillWarning;
    return styles.healthBarFillDanger;
  };

  const getLoadStatus = (load: number) => {
    if (load < 0.5) return '低';
    if (load < 0.8) return '中';
    return '高';
  };

  const getLoadColor = (load: number) => {
    if (load < 0.5) return '$color-success';
    if (load < 0.8) return '$color-warning';
    return '$color-danger';
  };

  if (loading) {
    return (
      <View className={styles.page}>
        <PageHeader title="长三角跨省通办" subtitle="一市三省 协同联动 数据共享" />
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  const filteredServices = getFilteredServices();
  const categories = getServiceCategories();

  return (
    <View className={styles.page}>
      <PageHeader title="长三角跨省通办" subtitle="一市三省 协同联动 数据共享" />

      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        {stats && (
          <View className={styles.headerCard}>
            <Text className={styles.headerTitle}>长三角政务服务一体化</Text>
            <Text className={styles.headerSubtitle}>江苏 · 上海 · 浙江 · 安徽 四地协同</Text>
            <View className={styles.statsRow}>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{formatNumber(stats.todayTasks)}</Text>
                <Text className={styles.statLabel}>今日协同任务</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{stats.successRate}%</Text>
                <Text className={styles.statLabel}>成功率</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{stats.averageResponseTime}ms</Text>
                <Text className={styles.statLabel}>平均响应</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{stats.dataExchangeVolume}GB</Text>
                <Text className={styles.statLabel}>月数据交换</Text>
              </View>
            </View>
          </View>
        )}

        <View className={`${styles.section} ${styles.nodesMap}`}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>协同节点</Text>
            <Text className={styles.sectionAction} onClick={loadData}>刷新</Text>
          </View>
          <Text className={styles.sectionDesc}>点击节点查看详细信息和运行状态</Text>
          
          <View className={styles.mapVisual}>
            <View className={styles.nodesConnection}>
              <View className={styles.connectionLine} />
              {nodes.map((node, index) => (
                <View
                  key={node.code}
                  className={styles.nodeItem}
                  onClick={() => handleNodeClick(node)}
                >
                  <View className={`${styles.nodeCircle} ${index === 0 ? styles.nodeCircleActive : ''}`}>
                    <Text className={`${styles.nodeIcon} ${index === 0 ? styles.nodeIconActive : ''}`}>
                      {getProvinceIcon(node.code)}
                    </Text>
                  </View>
                  <Text className={styles.nodeName}>{node.name}</Text>
                  <Text className={styles.nodeStatus}>
                    {node.status === 'active' ? '● 运行正常' : '○ 离线'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.nodeDetail}>
            <View className={styles.nodeDetailItem}>
              <Text className={styles.detailLabel}>活动节点</Text>
              <Text className={styles.detailValue}>{stats?.activeNodes || 0} 个</Text>
            </View>
            <View className={styles.nodeDetailItem}>
              <Text className={styles.detailLabel}>上线服务</Text>
              <Text className={styles.detailValue}>{stats?.totalServices || 0} 项</Text>
            </View>
            <View className={styles.nodeDetailItem}>
              <Text className={styles.detailLabel}>本月办件</Text>
              <Text className={styles.detailValue}>{formatNumber(stats?.monthlyTasks || 0)} 件</Text>
            </View>
            <View className={styles.nodeDetailItem}>
              <Text className={styles.detailLabel}>今日办结</Text>
              <Text className={styles.detailValue}>{formatNumber(stats?.todaySuccess || 0)} 件</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>跨省通办服务</Text>
          </View>

          <View className={styles.tabBar}>
            <View
              className={`${styles.tabItem} ${activeTab === 'services' ? styles.tabItemActive : ''}`}
              onClick={() => setActiveTab('services')}
            >
              服务列表 ({services.length})
            </View>
            <View
              className={`${styles.tabItem} ${activeTab === 'exchange' ? styles.tabItemActive : ''}`}
              onClick={() => setActiveTab('exchange')}
            >
              交换记录 ({exchangeRecords.length})
            </View>
          </View>

          {activeTab === 'services' && (
            <>
              <View className={styles.serviceCategoryFilter}>
                {categories.map(cat => (
                  <Text
                    key={cat}
                    className={`${styles.categoryChip} ${activeCategory === cat ? styles.categoryChipActive : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {getCategoryName(cat)}
                  </Text>
                ))}
              </View>

              <View className={styles.serviceList}>
                {filteredServices.map(service => (
                  <View
                    key={service.id}
                    className={styles.serviceItem}
                    onClick={() => handleServiceClick(service)}
                  >
                    <View className={styles.serviceHeader}>
                      <Text className={styles.serviceIcon}>
                        {getServiceIcon(service.businessLine)}
                      </Text>
                      <View className={styles.serviceInfo}>
                        <Text className={styles.serviceName}>{service.serviceName}</Text>
                        <Text className={styles.serviceDesc}>{service.description}</Text>
                        <View className={styles.serviceProvinces}>
                          {service.supportedProvinces.map((p, i) => (
                            <Text key={i} className={styles.provinceBadge}>{p}</Text>
                          ))}
                        </View>
                      </View>
                      <Text className={styles.serviceArrow}>›</Text>
                    </View>
                    <View className={styles.serviceMeta}>
                      <Text className={`${styles.serviceTag} ${styles.serviceTagPrimary}`}>
                        ⏱️ 平均 {service.averageProcessingTime} 天
                      </Text>
                      <Text className={`${styles.serviceTag} ${styles.serviceTagSuccess}`}>
                        ✅ 成功率 {service.successRate}%
                      </Text>
                      <Text className={`${styles.serviceTag} ${styles.serviceTagWarning}`}>
                        👥 已办 {formatNumber(service.applyCount)} 件
                      </Text>
                      <Text className={styles.serviceTag}>
                        ⭐ 满意度 {service.satisfaction}%
                      </Text>
                    </View>
                  </View>
                ))}
                {filteredServices.length === 0 && (
                  <View className={styles.empty}>
                    <Text className={styles.emptyIcon}>📋</Text>
                    <Text className={styles.emptyText}>暂无相关服务</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {activeTab === 'exchange' && (
            <View className={styles.exchangeList}>
              {exchangeRecords.map(record => (
                <View key={record.id} className={styles.exchangeItem}>
                  <View className={styles.exchangeHeader}>
                    <View className={styles.exchangeRoute}>
                      <Text className={styles.exchangeProvince}>
                        {getProvinceName(record.sourceProvince)}
                      </Text>
                      <Text className={styles.exchangeArrow}>→</Text>
                      <Text className={styles.exchangeProvince}>
                        {getProvinceName(record.targetProvince)}
                      </Text>
                    </View>
                    <Text className={`${styles.exchangeStatus} ${getExchangeStatusClass(record.status)}`}>
                      {getExchangeStatusText(record.status)}
                    </Text>
                  </View>
                  <View className={styles.exchangeInfo}>
                    <View className={styles.exchangeInfoItem}>
                      <Text className={styles.exchangeInfoLabel}>数据类型：</Text>
                      <Text className={styles.exchangeInfoValue}>
                        {getDataTypeName(record.dataType)}
                      </Text>
                    </View>
                    <View className={styles.exchangeInfoItem}>
                      <Text className={styles.exchangeInfoLabel}>业务编号：</Text>
                      <Text className={styles.exchangeInfoValue}>{record.businessNo}</Text>
                    </View>
                    <View className={styles.exchangeInfoItem}>
                      <Text className={styles.exchangeInfoLabel}>请求时间：</Text>
                      <Text className={styles.exchangeInfoValue}>
                        {formatDateTime(record.requestTime)}
                      </Text>
                    </View>
                    {record.duration > 0 && (
                      <View className={styles.exchangeInfoItem}>
                        <Text className={styles.exchangeInfoLabel}>耗时：</Text>
                        <Text className={styles.exchangeInfoValue}>{record.duration}ms</Text>
                      </View>
                    )}
                    <View className={styles.exchangeInfoItem}>
                      <Text className={styles.exchangeInfoLabel}>数据量：</Text>
                      <Text className={styles.exchangeInfoValue}>
                        {formatBytes(record.dataSize)}
                      </Text>
                    </View>
                    <View className={styles.exchangeInfoItem}>
                      <Text className={styles.exchangeInfoLabel}>加密方式：</Text>
                      <Text className={styles.exchangeInfoValue}>{record.encryptionMethod}</Text>
                    </View>
                  </View>
                </View>
              ))}
              {exchangeRecords.length === 0 && (
                <View className={styles.empty}>
                  <Text className={styles.emptyIcon}>🔄</Text>
                  <Text className={styles.emptyText}>暂无交换记录</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {showNodeDetail && selectedNode && (
        <View className={styles.nodeDetailModal} onClick={() => setShowNodeDetail(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>节点详情 - {selectedNode.name}</Text>
              <Text className={styles.modalClose} onClick={() => setShowNodeDetail(false)}>✕</Text>
            </View>

            <View className={styles.nodeInfoCard}>
              <View className={styles.nodeInfoRow}>
                <Text className={styles.nodeInfoLabel}>节点代码</Text>
                <Text className={styles.nodeInfoValue}>{selectedNode.code}</Text>
              </View>
              <View className={styles.nodeInfoRow}>
                <Text className={styles.nodeInfoLabel}>运行状态</Text>
                <Text className={styles.nodeInfoValue}>
                  {selectedNode.status === 'active' ? '● 运行正常' : '○ 离线'}
                </Text>
              </View>
              <View className={styles.nodeInfoRow}>
                <Text className={styles.nodeInfoLabel}>接口地址</Text>
                <Text className={styles.nodeInfoValue}>{selectedNode.endpoint}</Text>
              </View>
              <View className={styles.nodeInfoRow}>
                <Text className={styles.nodeInfoLabel}>最后同步</Text>
                <Text className={styles.nodeInfoValue}>
                  {formatDateTime(selectedNode.lastSyncTime)}
                </Text>
              </View>
            </View>

            <View>
              <Text className={styles.sectionTitle} style={{ marginBottom: 12 }}>支持的服务</Text>
              <View className={styles.servicesList}>
                {selectedNode.supportedServices.map((s, i) => (
                  <Text key={i} className={styles.serviceChip}>
                    {getDataTypeName(s.toLowerCase())}
                  </Text>
                ))}
              </View>
            </View>

            <View className={styles.healthSection}>
              <Text className={styles.sectionTitle} style={{ marginBottom: 12 }}>健康状况</Text>
              
              <Text style={{ fontSize: 13, color: '$color-text-secondary', marginBottom: 8 }}>
                响应时间：{selectedNode.responseTime}ms
              </Text>
              <View className={styles.healthBar}>
                <View
                  className={getHealthBarClass(100 - selectedNode.errorRate * 100)}
                  style={{ width: `${Math.min(100, 100 - selectedNode.responseTime / 5)}%` }}
                />
              </View>
              <View className={styles.healthLabels}>
                <Text>快</Text>
                <Text>慢</Text>
              </View>

              <Text style={{ fontSize: 13, color: '$color-text-secondary', margin: '16px 0 8px' }}>
                系统负载：{getLoadStatus(selectedNode.load)} ({Math.round(selectedNode.load * 100)}%)
              </Text>
              <View className={styles.healthBar}>
                <View
                  className={getHealthBarClass((1 - selectedNode.load) * 100)}
                  style={{ width: `${selectedNode.load * 100}%` }}
                />
              </View>
              <View className={styles.healthLabels}>
                <Text>低</Text>
                <Text>高</Text>
              </View>

              <Text style={{ fontSize: 13, color: '$color-text-secondary', margin: '16px 0 8px' }}>
                错误率：{(selectedNode.errorRate * 100).toFixed(3)}%
              </Text>
              <View className={styles.healthBar}>
                <View
                  className={getHealthBarClass((1 - selectedNode.errorRate) * 100)}
                  style={{ width: `${(1 - selectedNode.errorRate) * 100}%` }}
                />
              </View>
              <View className={styles.healthLabels}>
                <Text>好</Text>
                <Text>差</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default CrossProvincePage;
