import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useUserStore } from '@/store/useUserStore';
import { getOperationLogs, exportLogs, clearExpiredLogs } from '@/utils/logger';
import { logOperation } from '@/utils/logger';
import type { OperationLogEntry } from '@/types/user';
import { OPERATION_MODULES, OPERATION_ACTIONS } from '@/types/user';

type ModuleFilter = 'all' | typeof OPERATION_MODULES[number];
type LevelFilter = 'all' | 'success' | 'failed' | 'warning';
type ComplianceFilter = 'all' | 'critical' | 'sensitive' | 'normal';

const MODULE_LABELS: Record<string, string> = {
  waybill: '运单管理',
  pickup: '揽件管理',
  delivery: '派件管理',
  exception: '异常处理',
  scan: '扫码操作',
  checkin: '打卡管理',
  archive: '归档管理',
  evaluation: '评价管理',
  system: '系统操作',
  sync: '数据同步'
};

const ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  query: '查询',
  scan: '扫码',
  sign: '签收',
  report: '上报',
  resolve: '处理',
  checkin: '上班打卡',
  checkout: '下班打卡',
  archive: '归档',
  sync: '同步',
  export: '导出',
  import: '导入',
  login: '登录',
  logout: '登出'
};

const COMPLIANCE_LABELS: Record<string, string> = {
  critical: '高风险',
  sensitive: '中风险',
  normal: '低风险'
};

const OperationLogPage: React.FC = () => {
  const { user } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<OperationLogEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>('all');
  const [dateRange, setDateRange] = useState<{ start?: number; end?: number }>({});
  const [exportLoading, setExportLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        module?: string;
        action?: string;
        startTime?: number;
        endTime?: number;
        status?: string;
      } = {};

      if (moduleFilter !== 'all') {
        params.module = moduleFilter;
      }
      if (levelFilter !== 'all') {
        params.status = levelFilter;
      }
      if (dateRange.start) {
        params.startTime = dateRange.start;
      }
      if (dateRange.end) {
        params.endTime = dateRange.end;
      }

      let filteredLogs = getOperationLogs(params);

      if (complianceFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.complianceLevel === complianceFilter);
      }

      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.targetName?.toLowerCase().includes(keyword) ||
          log.targetId?.toLowerCase().includes(keyword) ||
          log.action.toLowerCase().includes(keyword) ||
          log.userName.toLowerCase().includes(keyword)
        );
      }

      setLogs(filteredLogs);
    } catch (e) {
      console.error('[OperationLogPage] 加载数据失败:', e);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [moduleFilter, levelFilter, complianceFilter, searchKeyword, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    loadData();
  });

  const stats = useMemo(() => {
    return {
      total: logs.length,
      success: logs.filter(l => l.status === 'success').length,
      failed: logs.filter(l => l.status === 'failed').length,
      warning: logs.filter(l => l.status === 'warning').length,
      critical: logs.filter(l => l.complianceLevel === 'critical').length
    };
  }, [logs]);

  const moduleOptions: { value: ModuleFilter; label: string }[] = [
    { value: 'all', label: '全部模块' },
    ...OPERATION_MODULES.map(m => ({ value: m as ModuleFilter, label: MODULE_LABELS[m] || m }))
  ];

  const levelOptions: { value: LevelFilter; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'success', label: '成功' },
    { value: 'warning', label: '警告' },
    { value: 'failed', label: '失败' }
  ];

  const complianceOptions: { value: ComplianceFilter; label: string }[] = [
    { value: 'all', label: '全部等级' },
    { value: 'critical', label: '高风险' },
    { value: 'sensitive', label: '中风险' },
    { value: 'normal', label: '低风险' }
  ];

  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      success: '✅',
      failed: '❌',
      warning: '⚠️'
    };
    return icons[status] || '📋';
  };

  const formatTime = (timestamp: number): string => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
  };

  const formatDateOnly = (timestamp: number): string => {
    return dayjs(timestamp).format('YYYY-MM-DD');
  };

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!user || exportLoading) return;

    setExportLoading(true);
    try {
      const content = await exportLogs({
        startTime: dateRange.start,
        endTime: dateRange.end,
        format
      });

      const fileName = `operation_logs_${Date.now()}.${format}`;
      const filePath = `${Taro.env.USER_DATA_PATH}/${fileName}`;

      const fs = Taro.getFileSystemManager();
      fs.writeFileSync(filePath, content, 'utf8');

      await logOperation({
        userId: user.id,
        userName: user.name,
        module: 'system',
        action: 'export',
        targetType: 'operation_log',
        targetName: `操作日志导出-${format.toUpperCase()}`,
        status: 'success',
        complianceLevel: 'sensitive',
        retentionDays: 365,
        requestParams: {
          format,
          recordCount: logs.length,
          moduleFilter,
          levelFilter,
          complianceFilter
        },
        responseResult: { fileName, filePath }
      });

      Taro.showModal({
        title: '导出成功',
        content: `日志已导出为 ${format.toUpperCase()} 格式，共 ${logs.length} 条记录`,
        showCancel: false
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '导出失败';
      console.error('[OperationLogPage] 导出失败:', e);

      if (user) {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'system',
          action: 'export',
          targetType: 'operation_log',
          status: 'failed',
          errorMessage: errorMsg,
          complianceLevel: 'sensitive',
          retentionDays: 365
        });
      }

      Taro.showToast({ title: errorMsg, icon: 'none' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleShowExportOptions = () => {
    Taro.showActionSheet({
      itemList: ['导出为 JSON', '导出为 CSV'],
      success: (res) => {
        if (res.tapIndex === 0) {
          handleExport('json');
        } else if (res.tapIndex === 1) {
          handleExport('csv');
        }
      }
    });
  };

  const handleClearExpired = async () => {
    if (!user) return;

    Taro.showModal({
      title: '确认清理',
      content: '确定要清理过期的操作日志吗？此操作不可恢复。',
      confirmText: '确认清理',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            clearExpiredLogs();

            await logOperation({
              userId: user.id,
              userName: user.name,
              module: 'system',
              action: 'clear',
              targetType: 'operation_log',
              targetName: '清理过期日志',
              status: 'success',
              complianceLevel: 'sensitive',
              retentionDays: 365
            });

            Taro.showToast({ title: '清理成功', icon: 'success' });
            loadData();
          } catch (e) {
            const errorMsg = e instanceof Error ? e.message : '清理失败';
            console.error('[OperationLogPage] 清理失败:', e);
            Taro.showToast({ title: errorMsg, icon: 'none' });
          }
        }
      }
    });
  };

  const handleDateFilter = () => {
    Taro.showActionSheet({
      itemList: ['今天', '昨天', '近7天', '近30天', '全部'],
      success: (res) => {
        const now = dayjs();
        let start: number | undefined;
        let end: number | undefined;

        switch (res.tapIndex) {
          case 0:
            start = now.startOf('day').valueOf();
            end = now.endOf('day').valueOf();
            break;
          case 1:
            start = now.subtract(1, 'day').startOf('day').valueOf();
            end = now.subtract(1, 'day').endOf('day').valueOf();
            break;
          case 2:
            start = now.subtract(7, 'day').startOf('day').valueOf();
            end = now.endOf('day').valueOf();
            break;
          case 3:
            start = now.subtract(30, 'day').startOf('day').valueOf();
            end = now.endOf('day').valueOf();
            break;
          default:
            start = undefined;
            end = undefined;
            break;
        }

        setDateRange({ start, end });
      }
    });
  };

  const getDateRangeText = (): string => {
    if (!dateRange.start && !dateRange.end) return '全部时间';
    if (dateRange.start && dateRange.end) {
      return `${formatDateOnly(dateRange.start)} ~ ${formatDateOnly(dateRange.end)}`;
    }
    return '自定义范围';
  };

  const renderLogDetail = (log: OperationLogEntry) => {
    const details: { label: string; value: string }[] = [];

    if (log.targetId) {
      details.push({ label: '目标ID', value: log.targetId });
    }
    if (log.deviceInfo) {
      details.push({ label: '设备信息', value: log.deviceInfo });
    }
    if (log.location) {
      details.push({ label: '操作位置', value: log.location });
    }
    if (log.requestParams) {
      details.push({ label: '请求参数', value: JSON.stringify(log.requestParams, null, 2) });
    }
    if (log.responseResult) {
      details.push({ label: '返回结果', value: JSON.stringify(log.responseResult, null, 2) });
    }
    if (log.errorMessage) {
      details.push({ label: '错误信息', value: log.errorMessage });
    }

    details.push({ label: '保留期限', value: `${log.retentionDays} 天` });

    return details;
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>操作日志</Text>
        <Text className={styles.headerDesc}>所有操作均留痕可追溯，合规等级分类管理</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.total}</Text>
            <Text className={styles.label}>总计</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.success}</Text>
            <Text className={styles.label}>成功</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.warning}</Text>
            <Text className={styles.label}>警告</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{stats.failed}</Text>
            <Text className={styles.label}>失败</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        <View className={styles.searchBox}>
          <Text className={styles.icon}>🔍</Text>
          <Input
            className={styles.input}
            placeholder="搜索操作内容/目标"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>

        <View className={styles.dateFilter} onClick={handleDateFilter}>
          <Text>📅</Text>
          <Text>{getDateRangeText()}</Text>
        </View>

        <View className={styles.filterSection}>
          <Text className={styles.filterLabel}>模块筛选</Text>
          <View className={styles.filterTabs}>
            {moduleOptions.map(option => (
              <View
                key={option.value}
                className={classnames(styles.filterTab, moduleFilter === option.value && styles.active)}
                onClick={() => setModuleFilter(option.value)}
              >
                <Text>{option.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.filterSection}>
          <Text className={styles.filterLabel}>状态筛选</Text>
          <View className={styles.filterTabs}>
            {levelOptions.map(option => (
              <View
                key={option.value}
                className={classnames(styles.filterTab, levelFilter === option.value && styles.active)}
                onClick={() => setLevelFilter(option.value)}
              >
                <Text>{option.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.filterSection}>
          <Text className={styles.filterLabel}>合规等级</Text>
          <View className={styles.filterTabs}>
            {complianceOptions.map(option => (
              <View
                key={option.value}
                className={classnames(styles.filterTab, complianceFilter === option.value && styles.active)}
                onClick={() => setComplianceFilter(option.value)}
              >
                <Text>{option.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        scrollY
        className={styles.logList}
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        {loading ? (
          <View className={styles.loading}>
            <Text>加载中...</Text>
          </View>
        ) : logs.length > 0 ? (
          logs.map(log => (
            <View key={log.id} className={styles.logCard}>
              <View className={styles.logHeader}>
                <View className={classnames(styles.logIcon, styles[log.status])}>
                  <Text>{getStatusIcon(log.status)}</Text>
                </View>
                <View className={styles.logMain}>
                  <Text className={styles.logTitle}>{log.targetName || log.action}</Text>
                  <View className={styles.logMeta}>
                    <Text className={styles.metaItem}>
                      👤 {log.userName}
                    </Text>
                    <Text className={styles.metaItem}>
                      🕐 {formatTime(log.timestamp)}
                    </Text>
                  </View>
                  <View className={styles.logTags}>
                    <Text className={classnames(styles.logTag, styles.module)}>
                      {MODULE_LABELS[log.module] || log.module}
                    </Text>
                    <Text className={styles.logTag}>
                      {ACTION_LABELS[log.action] || log.action}
                    </Text>
                    <Text className={classnames(styles.logTag, styles[log.complianceLevel])}>
                      {COMPLIANCE_LABELS[log.complianceLevel] || log.complianceLevel}
                    </Text>
                  </View>
                </View>
              </View>

              {expandedId === log.id && (
                <View className={styles.logContent}>
                  {renderLogDetail(log).map((detail, index) => (
                    <View key={index} className={styles.contentRow}>
                      <Text className={styles.label}>{detail.label}</Text>
                      <Text className={styles.value}>{detail.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View className={styles.expandBtn} onClick={() => handleExpand(log.id)}>
                <Text>{expandedId === log.id ? '收起详情 ▲' : '查看详情 ▼'}</Text>
              </View>
            </View>
          ))
        ) : (
          <View className={styles.empty}>
            <Text className={styles.icon}>📋</Text>
            <Text className={styles.text}>暂无操作日志</Text>
          </View>
        )}
      </ScrollView>

      <View className={styles.bottomActionBar}>
        <View
          className={classnames(styles.actionBtn, styles.secondary, exportLoading && styles.disabled)}
          onClick={handleClearExpired}
        >
          <Text>🗑️ 清理过期</Text>
        </View>
        <View
          className={classnames(styles.actionBtn, styles.primary, (exportLoading || logs.length === 0) && styles.disabled)}
          onClick={handleShowExportOptions}
        >
          <Text>{exportLoading ? '导出中...' : '📤 导出日志'}</Text>
        </View>
      </View>
    </View>
  );
};

export default OperationLogPage;
