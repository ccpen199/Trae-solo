import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { pluginService } from '@/services/pluginService';
import { Plugin, PluginCategoryItem } from '@/types/plugin';
import styles from './index.module.scss';

const myApps = [
  { id: 'oa', name: 'OA办公', icon: '📋', category: 'oa', badge: 3, offline: true },
  { id: 'erp', name: 'ERP系统', icon: '📊', category: 'erp', new: true },
  { id: 'finance', name: '财务系统', icon: '💰', category: 'finance' },
  { id: 'hr', name: 'HR系统', icon: '👥', category: 'hr' },
  { id: 'safety', name: '安监系统', icon: '🛡️', category: 'safety', badge: 1 },
  { id: 'production', name: '生产系统', icon: '🏭', category: 'production' },
  { id: 'admin', name: '运营后台', icon: '⚙️', category: 'admin' },
  { id: 'more', name: '更多', icon: '➕', category: 'default' }
];

const AppsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<PluginCategoryItem[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5', '6']));

  const loadData = useCallback(async () => {
    try {
      const [catRes, pluginRes] = await Promise.all([
        pluginService.getCategories(),
        pluginService.getPluginList({ page: 1, pageSize: 20 })
      ]);

      setCategories([{ id: 'all', code: 'oa' as const, name: '全部', icon: '📦', count: pluginRes.total }, ...catRes]);
      setPlugins(pluginRes.list);
    } catch (error) {
      console.error('加载应用数据失败', error);
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

  const filteredPlugins = useMemo(() => {
    if (activeCategory === 'all') return plugins;
    return plugins.filter(p => p.category === activeCategory);
  }, [plugins, activeCategory]);

  const handleAppClick = async (app: typeof myApps[0]) => {
    if (app.id === 'more') {
      Taro.showToast({ title: '更多应用', icon: 'none' });
      return;
    }

    try {
      Taro.showLoading({ title: '加载中...' });
      const result = await pluginService.openPlugin(app.id);
      Taro.hideLoading();

      Taro.navigateTo({
        url: `/pages/plugin-detail/index?id=${app.id}&url=${encodeURIComponent(result.h5Url)}&token=${result.ssoToken}`
      });
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '打开应用失败', icon: 'error' });
    }
  };

  const handlePluginClick = async (plugin: Plugin) => {
    if (installedIds.has(plugin.id)) {
      try {
        Taro.showLoading({ title: '加载中...' });
        const result = await pluginService.openPlugin(plugin.id);
        Taro.hideLoading();

        Taro.navigateTo({
          url: `/pages/plugin-detail/index?id=${plugin.id}&url=${encodeURIComponent(result.h5Url)}&token=${result.ssoToken}`
        });
      } catch (error) {
        Taro.hideLoading();
        Taro.showToast({ title: '打开应用失败', icon: 'error' });
      }
    }
  };

  const handleInstall = async (plugin: Plugin, e: any) => {
    e.stopPropagation();

    if (installedIds.has(plugin.id)) {
      Taro.showToast({ title: '已安装', icon: 'success' });
      return;
    }

    Taro.showLoading({ title: '安装中...' });
    try {
      await pluginService.installPlugin(plugin.id);
      setInstalledIds(prev => new Set([...prev, plugin.id]));
      Taro.hideLoading();
      Taro.showToast({ title: '安装成功', icon: 'success' });
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '安装失败', icon: 'error' });
    }
  };

  if (loading && !refreshing) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}>加载中...</View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.searchBar}>
          <Text className={styles.icon}>🔍</Text>
          <Text className={styles.placeholder}>搜索应用</Text>
        </View>
      </View>

      <ScrollView
        className={styles.content}
        scrollY
        enhanced
        showScrollbar={false}
      >
        <View className={styles.offlineInfo}>
          <Text className={styles.icon}>📦</Text>
          <Text className={styles.text}>已离线缓存 6 个应用，支持离线访问</Text>
          <Text
            className={styles.manageBtn}
            onClick={() => Taro.navigateTo({ url: '/pages/offline/index' })}
          >
            管理
          </Text>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>我的应用</Text>
            <Text
              className={styles.sectionMore}
              onClick={() => Taro.showToast({ title: '管理应用', icon: 'none' })}
            >
              管理 →
            </Text>
          </View>
          <View className={styles.myApps}>
            <View className={styles.myAppsGrid}>
              {myApps.map(app => (
                <View
                  key={app.id}
                  className={styles.appItem}
                  onClick={() => handleAppClick(app)}
                >
                  <View className={`${styles.appIcon} ${styles[app.category]}`}>
                    <Text>{app.icon}</Text>
                    {app.badge && app.badge > 0 && (
                      <View className={styles.badge}>
                        {app.badge > 99 ? '99+' : app.badge}
                      </View>
                    )}
                    {app.new && (
                      <View className={styles.newTag}>新</View>
                    )}
                    {app.offline && (
                      <View className={styles.offlineTag}>离线</View>
                    )}
                  </View>
                  <Text className={styles.appName}>{app.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>应用市场</Text>
          </View>

          <ScrollView className={styles.categoryTabs} scrollX showScrollbar={false}>
            {categories.map(cat => (
              <View
                key={cat.id}
                className={classnames(styles.categoryTab, activeCategory === cat.id && styles.active)}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.icon} {cat.name} ({cat.count})
              </View>
            ))}
          </ScrollView>

          {filteredPlugins.length > 0 ? (
            <View className={styles.pluginList}>
              {filteredPlugins.map(plugin => {
                const isInstalled = installedIds.has(plugin.id);
                return (
                  <View
                    key={plugin.id}
                    className={styles.pluginCard}
                    onClick={() => handlePluginClick(plugin)}
                  >
                    <View className={styles.pluginHeader}>
                      <View className={`${styles.pluginIcon} ${styles[plugin.category] || styles.default}`}>
                        <Text>{plugin.icon}</Text>
                      </View>
                      <View className={styles.pluginInfo}>
                        <Text className={styles.pluginName}>{plugin.name}</Text>
                        <Text className={styles.pluginCategory}>{plugin.categoryName}</Text>
                      </View>
                    </View>
                    <Text className={styles.pluginDesc}>{plugin.description}</Text>
                    <View className={styles.pluginMeta}>
                      <View className={styles.pluginStats}>
                        <Text>{plugin.installCount}人安装</Text>
                        <Text>⭐ {plugin.rating}</Text>
                      </View>
                      <View
                        className={classnames(styles.installBtn, isInstalled && styles.installed)}
                        onClick={(e) => handleInstall(plugin, e)}
                      >
                        {isInstalled ? '打开' : '安装'}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className={styles.emptyState}>暂无应用</View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default AppsPage;
