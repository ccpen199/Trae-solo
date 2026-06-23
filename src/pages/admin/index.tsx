import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { usePullDownRefresh } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/useUserStore';
import { organizationService } from '@/services/organizationService';
import { pluginService } from '@/services/pluginService';
import { OrgLevel } from '@/types/organization';
import styles from './index.module.scss';

interface AdminStat {
  icon: string;
  iconClass: string;
  value: number;
  label: string;
  trend: number;
  trendType: 'up' | 'down';
}

interface AdminMenu {
  id: string;
  icon: string;
  iconClass: string;
  name: string;
  permission: string;
}

interface DataScopeItem {
  id: string;
  name: string;
  level: OrgLevel;
  userCount: number;
  orgCount: number;
  canManage: boolean;
}

interface AuditLog {
  id: string;
  userName: string;
  operation: string;
  type: 'login' | 'permission' | 'data' | 'system';
  desc: string;
  time: string;
  status: 'success' | 'failed';
  ip: string;
}

const levelNames: Record<OrgLevel, string> = {
  province: '省公司',
  city: '市公司',
  team: '班组'
};

const AdminPage: React.FC = () => {
  const { userInfo, checkPermission } = useUserStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeScope, setActiveScope] = useState<string>('all');
  const [stats, setStats] = useState<AdminStat[]>([]);
  const [dataScopes, setDataScopes] = useState<DataScopeItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [availableScopes, setAvailableScopes] = useState<{id: string; name: string}[]>([]);

  const isProvinceAdmin = useMemo(() => {
    return userInfo?.roles?.includes('province_admin') || userInfo?.orgLevel === 'province';
  }, [userInfo]);

  const isCityAdmin = useMemo(() => {
    return userInfo?.roles?.includes('city_admin') || userInfo?.orgLevel === 'city';
  }, [userInfo]);

  const menus: AdminMenu[] = useMemo(() => {
    const allMenus: AdminMenu[] = [
      { id: 'user', icon: '👤', iconClass: 'user', name: '用户管理', permission: 'admin:user' },
      { id: 'role', icon: '🔐', iconClass: 'role', name: '角色权限', permission: 'admin:role' },
      { id: 'org', icon: '🏢', iconClass: 'org', name: '组织架构', permission: 'admin:org' },
      { id: 'plugin', icon: '📦', iconClass: 'plugin', name: '应用管理', permission: 'admin:plugin' },
      { id: 'audit', icon: '📋', iconClass: 'audit', name: '审计日志', permission: 'admin:audit' },
      { id: 'report', icon: '📊', iconClass: 'report', name: '数据报表', permission: 'admin:report' },
      { id: 'data', icon: '💾', iconClass: 'data', name: '数据权限', permission: 'admin:data' },
      { id: 'system', icon: '⚙️', iconClass: 'system', name: '系统设置', permission: 'admin:system' },
    ];

    return allMenus.filter(menu => checkPermission(menu.permission));
  }, [checkPermission]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const orgStats = await organizationService.getOrgStats();
      const pluginStats = await pluginService.getPluginList({ page: 1, pageSize: 100 });

      const newStats: AdminStat[] = [
        {
          icon: '👥',
          iconClass: 'blue',
          value: orgStats.totalEmployees,
          label: '活跃用户',
          trend: 12.5,
          trendType: 'up'
        },
        {
          icon: '🏛️',
          iconClass: 'green',
          value: orgStats.totalOrgs,
          label: '组织数量',
          trend: 2.3,
          trendType: 'up'
        },
        {
          icon: '📦',
          iconClass: 'orange',
          value: pluginStats.total,
          label: '接入应用',
          trend: 8.1,
          trendType: 'up'
        },
        {
          icon: '📝',
          iconClass: 'purple',
          value: 128,
          label: '今日审批',
          trend: 5.2,
          trendType: 'down'
        }
      ];
      setStats(newStats);

      const scopes: {id: string; name: string}[] = [{ id: 'all', name: '全部可见' }];
      const scopeData: DataScopeItem[] = [];

      if (isProvinceAdmin) {
        scopes.push(
          { id: 'city-1', name: '济南市公司' },
          { id: 'city-2', name: '青岛市公司' },
          { id: 'city-3', name: '烟台市公司' }
        );
        scopeData.push(
          { id: 'city-1', name: '济南市公司', level: 'city', userCount: 1256, orgCount: 24, canManage: true },
          { id: 'city-2', name: '青岛市公司', level: 'city', userCount: 1189, orgCount: 21, canManage: true },
          { id: 'city-3', name: '烟台市公司', level: 'city', userCount: 967, orgCount: 18, canManage: true }
        );
      } else if (isCityAdmin) {
        scopes.push(
          { id: 'team-1', name: '运维一班' },
          { id: 'team-2', name: '运维二班' },
          { id: 'team-3', name: '营销一班' },
          { id: 'team-4', name: '营销二班' }
        );
        scopeData.push(
          { id: 'team-1', name: '运维一班', level: 'team', userCount: 32, orgCount: 1, canManage: true },
          { id: 'team-2', name: '运维二班', level: 'team', userCount: 28, orgCount: 1, canManage: true },
          { id: 'team-3', name: '营销一班', level: 'team', userCount: 45, orgCount: 1, canManage: true },
          { id: 'team-4', name: '营销二班', level: 'team', userCount: 38, orgCount: 1, canManage: true }
        );
      } else {
        scopeData.push(
          { id: 'team-1', name: '运维一班', level: 'team', userCount: 32, orgCount: 1, canManage: false }
        );
      }

      setAvailableScopes(scopes);
      setDataScopes(scopeData);

      const mockLogs: AuditLog[] = [
        {
          id: '1',
          userName: '张明',
          operation: '用户登录',
          type: 'login',
          desc: '使用生物识别登录系统',
          time: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
          status: 'success',
          ip: '10.0.0.123'
        },
        {
          id: '2',
          userName: '李华',
          operation: '权限变更',
          type: 'permission',
          desc: '为用户"王强"分配了"应用管理员"角色',
          time: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
          status: 'success',
          ip: '10.0.0.124'
        },
        {
          id: '3',
          userName: '王芳',
          operation: '数据导出',
          type: 'data',
          desc: '导出2024年1月用户活跃度报表',
          time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          status: 'success',
          ip: '10.0.0.125'
        },
        {
          id: '4',
          userName: '赵强',
          operation: 'HR同步',
          type: 'system',
          desc: '执行全量组织架构同步',
          time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          status: 'success',
          ip: '10.0.0.1'
        },
        {
          id: '5',
          userName: '孙伟',
          operation: '敏感操作',
          type: 'data',
          desc: '尝试访问超出权限范围的数据',
          time: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          status: 'failed',
          ip: '10.0.0.130'
        }
      ];
      setAuditLogs(mockLogs);

    } catch (error) {
      console.error('加载运营数据失败', error);
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }
  }, [isProvinceAdmin, isCityAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    loadData();
  });

  const handleMenuClick = (menu: AdminMenu) => {
    if (!checkPermission(menu.permission)) {
      Taro.showToast({ title: '没有操作权限', icon: 'none' });
      return;
    }
    Taro.showToast({ title: `进入${menu.name}`, icon: 'none' });
  };

  const handleScopeManage = (scope: DataScopeItem) => {
    if (!scope.canManage) {
      Taro.showToast({ title: '没有管理权限', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList: ['查看用户列表', '管理员配置', '数据导出', '权限审计'],
      success: (res) => {
        const tips = ['查看用户', '管理员配置', '数据导出', '权限审计'];
        Taro.showToast({ title: tips[res.tapIndex], icon: 'none' });
      }
    });
  };

  const handleLogClick = (log: AuditLog) => {
    Taro.showModal({
      title: '操作详情',
      content: `操作人：${log.userName}\n操作类型：${log.operation}\n操作描述：${log.desc}\n操作时间：${log.time}\nIP地址：${log.ip}\n操作状态：${log.status === 'success' ? '成功' : '失败'}`,
      showCancel: false
    });
  };

  const currentScopeLabel = useMemo(() => {
    if (isProvinceAdmin) return '省公司管理员 - 全省数据可见';
    if (isCityAdmin) return '市公司管理员 - 本市数据可见';
    return '班组管理员 - 本班组数据可见';
  }, [isProvinceAdmin, isCityAdmin]);

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
        <View className={styles.permissionBanner}>
          <Text className={styles.permissionIcon}>🔐</Text>
          <View className={styles.permissionInfo}>
            <Text className={styles.permissionTitle}>{currentScopeLabel}</Text>
            <Text className={styles.permissionDesc}>
              数据权限已自动隔离，您仅能查看管辖范围内的数据
            </Text>
          </View>
          <View className={styles.permissionScope}>
            {isProvinceAdmin ? '省级' : isCityAdmin ? '市级' : '班组级'}
          </View>
        </View>

        <View className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} className={styles.statCard}>
              <View className={styles.statCardHeader}>
                <View className={classnames(styles.statIcon, styles[stat.iconClass])}>
                  <Text>{stat.icon}</Text>
                </View>
                <View className={classnames(styles.statTrend, styles[stat.trendType])}>
                  <Text>{stat.trendType === 'up' ? '↑' : '↓'}</Text>
                  <Text>{stat.trend}%</Text>
                </View>
              </View>
              <Text className={styles.statValue}>{stat.value}</Text>
              <Text className={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>⚡</Text>
              <Text>管理功能</Text>
            </View>
          </View>
          
          <View className={styles.menuGrid}>
            {menus.map(menu => (
              <View
                key={menu.id}
                className={styles.menuItem}
                onClick={() => handleMenuClick(menu)}
              >
                <View className={classnames(styles.menuIcon, styles[menu.iconClass])}>
                  <Text>{menu.icon}</Text>
                </View>
                <Text className={styles.menuName}>{menu.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>👁️</Text>
              <Text>数据权限范围</Text>
            </View>
            <Text
              className={styles.sectionMore}
              onClick={() => Taro.showToast({ title: '权限配置', icon: 'none' })}
            >
              配置 →
            </Text>
          </View>

          <View className={styles.scopeSelector}>
            <Text className={styles.scopeLabel}>查看：</Text>
            <ScrollView className={styles.scopeTabs} scrollX showScrollbar={false}>
              {availableScopes.map(scope => (
                <View
                  key={scope.id}
                  className={classnames(
                    styles.scopeTab,
                    activeScope === scope.id && styles.active
                  )}
                  onClick={() => setActiveScope(scope.id)}
                >
                  {scope.name}
                </View>
              ))}
            </ScrollView>
          </View>

          <View className={styles.dataScopeList}>
            {dataScopes.map(scope => (
              <View
                key={scope.id}
                className={styles.dataScopeItem}
                onClick={() => handleScopeManage(scope)}
              >
                <View className={styles.dataScopeInfo}>
                  <View className={styles.dataScopeName}>
                    <Text>{scope.name}</Text>
                    <View className={classnames(styles.dataScopeLevel, styles[scope.level])}>
                      {levelNames[scope.level]}
                    </View>
                  </View>
                  <Text className={styles.dataScopeStats}>
                    {scope.userCount} 名用户 · {scope.orgCount} 个组织
                  </Text>
                </View>
                <Text className={styles.dataScopeAction}>
                  {scope.canManage ? '管理 →' : '仅查看'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>📋</Text>
              <Text>审计日志</Text>
            </View>
            <Text
              className={styles.sectionMore}
              onClick={() => Taro.showToast({ title: '查看全部', icon: 'none' })}
            >
              全部 →
            </Text>
          </View>

          <View className={styles.tabs}>
            {[
              { key: 'overview', label: '全部' },
              { key: 'login', label: '登录' },
              { key: 'permission', label: '权限' },
              { key: 'data', label: '数据' }
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

          <View className={styles.logList}>
            {auditLogs
              .filter(log => activeTab === 'overview' || log.type === activeTab)
              .map(log => (
              <View
                key={log.id}
                className={styles.logItem}
                onClick={() => handleLogClick(log)}
              >
                <View className={styles.logAvatar}>
                  <Text>{log.userName.charAt(0)}</Text>
                </View>
                <View className={styles.logContent}>
                  <View className={styles.logTitle}>
                    <Text>{log.operation}</Text>
                    <View className={classnames(styles.logType, styles[log.type])}>
                      {log.type === 'login' && '登录'}
                      {log.type === 'permission' && '权限'}
                      {log.type === 'data' && '数据'}
                      {log.type === 'system' && '系统'}
                    </View>
                  </View>
                  <Text className={styles.logDesc}>{log.desc}</Text>
                  <View className={styles.logMeta}>
                    <Text>{log.userName}</Text>
                    <Text>{dayjs(log.time).format('HH:mm')}</Text>
                    <Text className={classnames(styles.logStatus, styles[log.status])}>
                      {log.status === 'success' ? '成功' : '失败'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default AdminPage;
