import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { pluginService } from '@/services/pluginService';
import styles from './index.module.scss';

interface OfflinePackageItem {
  id: string;
  pluginId: string;
  pluginName: string;
  icon: string;
  category: string;
  version: string;
  newVersion?: string;
  size: number;
  installedSize: number;
  updateTime: string;
  status: 'installed' | 'update' | 'downloading' | 'not_installed';
  isMandatory?: boolean;
  downloadProgress?: number;
  lastUseTime: string;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const OfflinePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('installed');
  const [packages, setPackages] = useState<OfflinePackageItem[]>([]);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);
  const [hasMandatoryUpdate, setHasMandatoryUpdate] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const totalSize = useMemo(() => {
    return packages
      .filter(p => p.status === 'installed' || p.status === 'update')
      .reduce((sum, p) => sum + p.installedSize, 0);
  }, [packages]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      await pluginService.getOfflinePackages();
      
      const mockPackages: OfflinePackageItem[] = [
        {
          id: '1',
          pluginId: 'oa',
          pluginName: 'OA办公',
          icon: '📋',
          category: 'oa',
          version: '2.3.1',
          size: 15 * 1024 * 1024,
          installedSize: 15 * 1024 * 1024,
          updateTime: '2024-01-15 10:30:00',
          status: 'installed',
          lastUseTime: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss')
        },
        {
          id: '2',
          pluginId: 'erp',
          pluginName: 'ERP系统',
          icon: '📊',
          category: 'erp',
          version: '1.8.0',
          newVersion: '1.9.0',
          size: 22 * 1024 * 1024,
          installedSize: 22 * 1024 * 1024,
          updateTime: '2024-01-10 14:20:00',
          status: 'update',
          isMandatory: false,
          lastUseTime: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss')
        },
        {
          id: '3',
          pluginId: 'safety',
          pluginName: '安监系统',
          icon: '🛡️',
          category: 'safety',
          version: '3.1.0',
          newVersion: '3.2.0',
          size: 18 * 1024 * 1024,
          installedSize: 18 * 1024 * 1024,
          updateTime: '2024-01-12 09:15:00',
          status: 'update',
          isMandatory: true,
          lastUseTime: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss')
        },
        {
          id: '4',
          pluginId: 'hr',
          pluginName: 'HR系统',
          icon: '👥',
          category: 'hr',
          version: '2.0.5',
          size: 12 * 1024 * 1024,
          installedSize: 12 * 1024 * 1024,
          updateTime: '2024-01-08 16:45:00',
          status: 'installed',
          lastUseTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
        },
        {
          id: '5',
          pluginId: 'finance',
          pluginName: '财务系统',
          icon: '💰',
          category: 'finance',
          version: '1.5.2',
          size: 25 * 1024 * 1024,
          installedSize: 25 * 1024 * 1024,
          updateTime: '2024-01-05 11:00:00',
          status: 'installed',
          lastUseTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss')
        },
        {
          id: '6',
          pluginId: 'production',
          pluginName: '生产系统',
          icon: '🏭',
          category: 'production',
          version: '4.2.1',
          newVersion: '4.3.0',
          size: 35 * 1024 * 1024,
          installedSize: 35 * 1024 * 1024,
          updateTime: '2024-01-03 08:30:00',
          status: 'update',
          isMandatory: false,
          lastUseTime: dayjs().subtract(12, 'hour').format('YYYY-MM-DD HH:mm:ss')
        }
      ];

      setPackages(mockPackages);
      setHasMandatoryUpdate(mockPackages.some(p => p.isMandatory && p.status === 'update'));

    } catch (error) {
      console.error('加载离线包数据失败', error);
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    loadData();
  });

  const handleDownload = async (pkg: OfflinePackageItem) => {
    if (downloadingId) {
      Taro.showToast({ title: '有任务正在下载', icon: 'none' });
      return;
    }

    if (pkg.isMandatory) {
      Taro.showModal({
        title: '强制更新',
        content: `${pkg.pluginName} 有重要安全更新，必须更新后才能使用。`,
        showCancel: false,
        confirmText: '立即更新'
      });
    }

    setDownloadingId(pkg.id);
    setPackages(prev => prev.map(p => 
      p.id === pkg.id ? { ...p, status: 'downloading', downloadProgress: 0 } : p
    ));

    try {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setPackages(prev => prev.map(p => 
          p.id === pkg.id ? { ...p, downloadProgress: i } : p
        ));
      }

      setPackages(prev => prev.map(p => 
        p.id === pkg.id 
          ? { 
              ...p, 
              status: 'installed', 
              version: p.newVersion || p.version,
              installedSize: p.size,
              newVersion: undefined,
              isMandatory: false
            } 
          : p
      ));

      Taro.showToast({ title: `${pkg.pluginName} 更新成功`, icon: 'success' });
    } catch (error) {
      setPackages(prev => prev.map(p => 
        p.id === pkg.id ? { ...p, status: 'update', downloadProgress: undefined } : p
      ));
      Taro.showToast({ title: '下载失败', icon: 'error' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (pkg: OfflinePackageItem) => {
    Taro.showModal({
      title: '删除离线包',
      content: `确定要删除 ${pkg.pluginName} 的离线包吗？删除后需要联网才能使用。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await pluginService.clearOfflineCache(pkg.pluginId);
            setPackages(prev => prev.filter(p => p.id !== pkg.id));
            Taro.showToast({ title: '删除成功', icon: 'success' });
          } catch (error) {
            Taro.showToast({ title: '删除失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleUpdateAll = () => {
    const updatePackages = packages.filter(p => p.status === 'update');
    if (updatePackages.length === 0) {
      Taro.showToast({ title: '暂无更新', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '批量更新',
      content: `确定要更新 ${updatePackages.length} 个应用吗？总计需要下载约 ${formatSize(updatePackages.reduce((sum, p) => sum + p.size, 0))}。`,
      success: async (res) => {
        if (res.confirm) {
          for (const pkg of updatePackages) {
            await handleDownload(pkg);
          }
        }
      }
    });
  };

  const handleCheckUpdate = async () => {
    Taro.showLoading({ title: '检查更新中...' });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      Taro.hideLoading();
      
      const updateCount = packages.filter(p => p.status === 'update').length;
      if (updateCount > 0) {
        Taro.showToast({ title: `发现 ${updateCount} 个更新`, icon: 'success' });
      } else {
        Taro.showToast({ title: '已是最新版本', icon: 'success' });
      }
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '检查更新失败', icon: 'error' });
    }
  };

  const handleMandatoryUpdate = () => {
    const mandatoryPkg = packages.find(p => p.isMandatory && p.status === 'update');
    if (mandatoryPkg) {
      handleDownload(mandatoryPkg);
    }
  };

  const handleClearAll = () => {
    Taro.showModal({
      title: '清除所有缓存',
      content: `确定要清除所有离线包吗？将释放约 ${formatSize(totalSize)} 存储空间。`,
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '清除中...' });
          try {
            await pluginService.clearOfflineCache();
            setPackages(prev => prev.filter(p => p.status !== 'installed'));
            Taro.hideLoading();
            Taro.showToast({ title: '清除成功', icon: 'success' });
          } catch (error) {
            Taro.hideLoading();
            Taro.showToast({ title: '清除失败', icon: 'error' });
          }
        }
      }
    });
  };

  const filteredPackages = useMemo(() => {
    switch (activeTab) {
      case 'installed':
        return packages.filter(p => p.status === 'installed' || p.status === 'update');
      case 'update':
        return packages.filter(p => p.status === 'update');
      default:
        return packages;
    }
  }, [packages, activeTab]);

  if (loading && !refreshing) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>加载中...</View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView
        scrollY
        enhanced
        showScrollbar={false}
      >
        <View className={styles.overviewCard}>
          <View className={styles.overviewHeader}>
            <View className={styles.overviewTitle}>
              <Text className={styles.overviewIcon}>📦</Text>
              <Text>离线包管理</Text>
            </View>
            <View className={styles.overviewAction} onClick={handleCheckUpdate}>
              <Text>🔄</Text>
              <Text>检查更新</Text>
            </View>
          </View>
          
          <View className={styles.overviewStats}>
            <View className={styles.overviewStat}>
              <Text className={styles.overviewStatValue}>{packages.filter(p => p.status === 'installed' || p.status === 'update').length}</Text>
              <Text className={styles.overviewStatLabel}>已安装</Text>
            </View>
            <View className={styles.overviewStat}>
              <Text className={styles.overviewStatValue}>{packages.filter(p => p.status === 'update').length}</Text>
              <Text className={styles.overviewStatLabel}>可更新</Text>
            </View>
            <View className={styles.overviewStat}>
              <Text className={styles.overviewStatValue}>{formatSize(totalSize)}</Text>
              <Text className={styles.overviewStatLabel}>已使用</Text>
            </View>
          </View>
        </View>

        {hasMandatoryUpdate && (
          <View className={styles.updateBanner}>
            <Text className={styles.updateBannerIcon}>⚠️</Text>
            <View className={styles.updateBannerInfo}>
              <Text className={styles.updateBannerTitle}>发现强制更新</Text>
              <Text className={styles.updateBannerDesc}>安监系统有重要安全补丁，必须立即更新</Text>
            </View>
            <View className={styles.updateBannerBtn} onClick={handleMandatoryUpdate}>
              立即更新
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>📲</Text>
              <Text>离线应用</Text>
            </View>
            <Text className={styles.sectionMore} onClick={handleUpdateAll}>
              全部更新 →
            </Text>
          </View>

          <View className={styles.tabs}>
            {[
              { key: 'installed', label: `已安装 (${packages.filter(p => p.status === 'installed' || p.status === 'update').length})` },
              { key: 'update', label: `可更新 (${packages.filter(p => p.status === 'update').length})` }
            ].map(tab => (
              <View
                key={tab.key}
                className={classnames(styles.tab, activeTab === tab.key && styles.active)}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </View>
            ))}
          </View>

          {filteredPackages.length > 0 ? (
            <View className={styles.packageList}>
              {filteredPackages.map(pkg => (
                <View key={pkg.id} className={styles.packageItem}>
                  <View className={classnames(styles.packageIcon, styles[pkg.category])}>
                    <Text>{pkg.icon}</Text>
                  </View>
                  <View className={styles.packageInfo}>
                    <View className={styles.packageName}>
                      <Text>{pkg.pluginName}</Text>
                      {pkg.status === 'installed' && (
                        <View className={classnames(styles.packageTag, styles.installed)}>已安装</View>
                      )}
                      {pkg.status === 'update' && pkg.isMandatory && (
                        <View className={classnames(styles.packageTag, styles.mandatory)}>强制</View>
                      )}
                      {pkg.status === 'update' && !pkg.isMandatory && (
                        <View className={classnames(styles.packageTag, styles.update)}>可更新</View>
                      )}
                      {pkg.status === 'downloading' && (
                        <View className={classnames(styles.packageTag, styles.downloading)}>下载中</View>
                      )}
                    </View>
                    <View className={styles.packageMeta}>
                      <Text className={styles.packageVersion}>
                        v{pkg.version}
                        {pkg.newVersion && ` → v${pkg.newVersion}`}
                      </Text>
                      <Text className={styles.packageSize}>
                        {pkg.status === 'update' ? `更新包 ${formatSize(pkg.size)}` : formatSize(pkg.installedSize)}
                      </Text>
                      <Text className={styles.packageTime}>
                        {dayjs(pkg.lastUseTime).format('YYYY-MM-DD')}使用
                      </Text>
                    </View>
                  </View>
                  
                  {pkg.status === 'downloading' ? (
                    <View className={styles.progressContainer}>
                      <View className={styles.progressBar}>
                        <View 
                          className={styles.progressFill} 
                          style={{ width: `${pkg.downloadProgress || 0}%` }}
                        />
                      </View>
                      <Text className={styles.progressText}>{pkg.downloadProgress || 0}%</Text>
                    </View>
                  ) : (
                    <View className={styles.packageAction}>
                      {pkg.status === 'update' && (
                        <View 
                          className={classnames(styles.actionBtn, pkg.isMandatory ? styles.warning : styles.primary)}
                          onClick={() => handleDownload(pkg)}
                        >
                          <Text>⬇️</Text>
                          <Text>更新</Text>
                        </View>
                      )}
                      {pkg.status === 'installed' && (
                        <View 
                          className={classnames(styles.actionBtn, styles.secondary)}
                          onClick={() => handleDelete(pkg)}
                        >
                          <Text>🗑️</Text>
                          <Text>删除</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>暂无离线应用</View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>💾</Text>
              <Text>存储空间</Text>
            </View>
          </View>
          
          <View className={styles.storageInfo}>
            <View className={styles.storageBar}>
              <View className={styles.storageUsed} style={{ width: `${Math.min(100, (totalSize / (500 * 1024 * 1024)) * 100)}%` }} />
              <View className={styles.storageFree} />
            </View>
            <View className={styles.storageText}>
              <Text>已使用: {formatSize(totalSize)}</Text>
              <Text>可用: {formatSize(500 * 1024 * 1024 - totalSize)}</Text>
            </View>
          </View>

          <View className={styles.settingsSection}>
            <View className={styles.settingItem}>
              <View className={styles.settingInfo}>
                <Text className={styles.settingName}>自动更新</Text>
                <Text className={styles.settingDesc}>WiFi下自动下载并安装更新</Text>
              </View>
              <View 
                className={classnames(styles.switch, autoUpdate && styles.active)}
                onClick={() => setAutoUpdate(!autoUpdate)}
              >
                <View className={styles.switchHandle} />
              </View>
            </View>
            <View className={styles.settingItem}>
              <View className={styles.settingInfo}>
                <Text className={styles.settingName}>仅WiFi下载</Text>
                <Text className={styles.settingDesc}>避免使用移动数据流量下载</Text>
              </View>
              <View 
                className={classnames(styles.switch, wifiOnly && styles.active)}
                onClick={() => setWifiOnly(!wifiOnly)}
              >
                <View className={styles.switchHandle} />
              </View>
            </View>
            <View className={styles.settingItem}>
              <View className={styles.settingInfo}>
                <Text className={styles.settingName}>自动清理</Text>
                <Text className={styles.settingDesc}>30天未使用自动删除离线包</Text>
              </View>
              <View 
                className={classnames(styles.switch, autoDelete && styles.active)}
                onClick={() => setAutoDelete(!autoDelete)}
              >
                <View className={styles.switchHandle} />
              </View>
            </View>
            <View className={styles.settingItem}>
              <View className={styles.settingInfo}>
                <Text className={styles.settingName}>清除所有缓存</Text>
                <Text className={styles.settingDesc}>删除所有已下载的离线包</Text>
              </View>
              <View 
                className={classnames(styles.actionBtn, styles.secondary)}
                onClick={handleClearAll}
              >
                清除
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section} style={{ marginBottom: 40 }}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>📝</Text>
              <Text>更新日志</Text>
            </View>
          </View>
          
          <View className={styles.updateLogSection}>
            <View className={styles.updateLogItem}>
              <View className={styles.updateLogHeader}>
                <View className={styles.updateLogVersion}>
                  v2.3.1
                  <View className={styles.updateLogTag}>当前版本</View>
                </View>
                <Text className={styles.updateLogTime}>2024-01-15</Text>
              </View>
              <Text className={styles.updateLogContent}>
                • 优化离线加载速度，提升30%启动时间\n• 修复偶发的白屏问题\n• 新增国密SM4加密支持\n• 优化弱网环境下的缓存策略
              </Text>
            </View>
            <View className={styles.updateLogItem}>
              <View className={styles.updateLogHeader}>
                <View className={styles.updateLogVersion}>
                  v2.3.0
                </View>
                <Text className={styles.updateLogTime}>2024-01-10</Text>
              </View>
              <Text className={styles.updateLogContent}>
                • 新增预加载机制，支持静默更新\n• 优化增量更新算法，减少下载流量\n• 新增强制更新功能\n• 修复已知安全漏洞
              </Text>
            </View>
            <View className={styles.updateLogItem}>
              <View className={styles.updateLogHeader}>
                <View className={styles.updateLogVersion}>
                  v2.2.0
                </View>
                <Text className={styles.updateLogTime}>2024-01-05</Text>
              </View>
              <Text className={styles.updateLogContent}>
                • 支持分模块下载，按需加载\n• 新增断点续传功能\n• 优化存储空间管理\n• 新增更新日志查看
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default OfflinePage;
