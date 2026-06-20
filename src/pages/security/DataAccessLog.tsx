import React, { useMemo, useState } from 'react';
import {
  FileText,
  Eye,
  Download,
  Upload,
  MapPin,
  Monitor,
  Search,
  Filter,
  Download as DownloadIcon,
  AlertTriangle,
  CalendarDays,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

type AccessAction = 'view' | 'download' | 'export';

interface AccessLogEntry {
  id: string;
  timestamp: Date;
  viewer: {
    id: string;
    name: string;
    type: 'company' | 'individual' | 'agency' | 'system';
  };
  dataType: string;
  action: AccessAction;
  ipAddress: string;
  device: string;
  isSuspicious: boolean;
  suspiciousReason?: string;
}

const mockAccessLogs: AccessLogEntry[] = Array.from({ length: 35 }, (_, i) => {
  const viewers = [
    { id: 'v1', name: '星耀模特经纪有限公司', type: 'agency' as const },
    { id: 'v2', name: '华谊兄弟时尚文化传媒', type: 'company' as const },
    { id: 'v3', name: '张伟 (摄影师)', type: 'individual' as const },
    { id: 'v4', name: '新锐模特工作室', type: 'agency' as const },
    { id: 'v5', name: '系统自动备份', type: 'system' as const },
  ];
  const dataTypes = ['基本信息', '照片资料', '联系方式', '身体数据', '日程安排', '完整资料'];
  const actions: AccessAction[] = ['view', 'view', 'view', 'download', 'export'];
  const devices = ['Chrome (Windows)', 'Safari (MacOS)', 'Chrome (iOS)', 'Firefox (Android)', 'Edge (Windows)'];

  const timestamp = new Date();
  timestamp.setHours(timestamp.getHours() - i * 4 - Math.floor(Math.random() * 3));

  const isSuspicious = i === 7 || i === 18;

  return {
    id: `log-${i + 1}`,
    timestamp,
    viewer: viewers[i % viewers.length],
    dataType: dataTypes[i % dataTypes.length],
    action: actions[i % actions.length],
    ipAddress: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    device: devices[i % devices.length],
    isSuspicious,
    suspiciousReason: isSuspicious ? (i === 7 ? '异常地理位置访问' : '短时间内频繁下载数据') : undefined,
  };
});

const getActionIcon = (action: AccessAction) => {
  switch (action) {
    case 'view':
      return <Eye className="w-4 h-4" />;
    case 'download':
      return <Download className="w-4 h-4" />;
    case 'export':
      return <Upload className="w-4 h-4" />;
  }
};

const getActionLabel = (action: AccessAction) => {
  switch (action) {
    case 'view':
      return '查看';
    case 'download':
      return '下载';
    case 'export':
      return '导出';
  }
};

const getActionBadgeVariant = (action: AccessAction): 'primary' | 'secondary' | 'success' => {
  switch (action) {
    case 'view':
      return 'secondary';
    case 'download':
      return 'primary';
    case 'export':
      return 'success';
  }
};

const PAGE_SIZE = 10;

const DataAccessLog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterViewer, setFilterViewer] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<AccessAction | 'all'>('all');
  const [filterDataType, setFilterDataType] = useState<string | null>(null);
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const allViewers = useMemo(() => {
    const unique = new Map<string, { id: string; name: string }>();
    mockAccessLogs.forEach((log) => {
      if (!unique.has(log.viewer.id)) {
        unique.set(log.viewer.id, { id: log.viewer.id, name: log.viewer.name });
      }
    });
    return Array.from(unique.values());
  }, []);

  const allDataTypes = useMemo(() => {
    return Array.from(new Set(mockAccessLogs.map((l) => l.dataType)));
  }, []);

  const filteredLogs = useMemo(() => {
    return mockAccessLogs.filter((log) => {
      if (searchQuery && !log.viewer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (log.timestamp < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (log.timestamp > to) return false;
      }
      if (filterViewer && log.viewer.id !== filterViewer) return false;
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (filterDataType && log.dataType !== filterDataType) return false;
      if (showSuspiciousOnly && !log.isSuspicious) return false;
      return true;
    });
  }, [searchQuery, dateFrom, dateTo, filterViewer, filterAction, filterDataType, showSuspiciousOnly]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const stats = useMemo(() => ({
    total: mockAccessLogs.length,
    views: mockAccessLogs.filter((l) => l.action === 'view').length,
    downloads: mockAccessLogs.filter((l) => l.action === 'download').length,
    exports: mockAccessLogs.filter((l) => l.action === 'export').length,
    suspicious: mockAccessLogs.filter((l) => l.isSuspicious).length,
  }), []);

  const handleExportCSV = () => {
    const headers = ['时间', '访问者', '数据类型', '操作', 'IP地址', '设备', '可疑活动'];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN }),
      log.viewer.name,
      log.dataType,
      getActionLabel(log.action),
      log.ipAddress,
      log.device,
      log.isSuspicious ? `是 - ${log.suspiciousReason || ''}` : '否',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `数据访问日志_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="w-8 h-8 text-rose-500" />
                数据访问审计日志
              </h1>
              <p className="text-midnight-300">完整记录所有对你数据的访问操作</p>
            </div>
            <Button
              variant="secondary"
              leftIcon={<DownloadIcon className="w-4 h-4" />}
              onClick={handleExportCSV}
            >
              导出 CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <CardContent className="p-4">
              <p className="text-sm text-midnight-400">总访问次数</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4">
              <p className="text-sm text-midnight-400">查看次数</p>
              <p className="text-2xl font-bold text-sapphire-400 mt-1">{stats.views}</p>
            </CardContent>
          </Card>
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4">
              <p className="text-sm text-midnight-400">下载次数</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{stats.downloads}</p>
            </CardContent>
          </Card>
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-4">
              <p className="text-sm text-midnight-400">导出次数</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.exports}</p>
            </CardContent>
          </Card>
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-4">
              <p className="text-sm text-midnight-400">可疑活动</p>
              <p className={cn(
                'text-2xl font-bold mt-1',
                stats.suspicious > 0 ? 'text-red-400' : 'text-emerald-400'
              )}>
                {stats.suspicious}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card variant="glass" className="mb-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-rose-500" />
              筛选条件
            </CardTitle>
            <CardDescription>根据时间、访问者、操作类型等筛选日志</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="搜索访问者"
                placeholder="输入公司或个人名称"
                leftIcon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Input
                label="开始日期"
                type="date"
                leftIcon={<CalendarDays className="w-4 h-4" />}
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Input
                label="结束日期"
                type="date"
                leftIcon={<CalendarDays className="w-4 h-4" />}
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">访问者</label>
                <select
                  className={cn(
                    'w-full h-11 px-4 rounded-xl text-white bg-midnight-900/50 border-2 border-midnight-700',
                    'focus:outline-none focus:border-rose-500 transition-all duration-300'
                  )}
                  value={filterViewer || ''}
                  onChange={(e) => {
                    setFilterViewer(e.target.value || null);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">全部访问者</option>
                  {allViewers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">操作类型</label>
                <select
                  className={cn(
                    'w-full h-11 px-4 rounded-xl text-white bg-midnight-900/50 border-2 border-midnight-700',
                    'focus:outline-none focus:border-rose-500 transition-all duration-300'
                  )}
                  value={filterAction}
                  onChange={(e) => {
                    setFilterAction(e.target.value as AccessAction | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">全部操作</option>
                  <option value="view">查看</option>
                  <option value="download">下载</option>
                  <option value="export">导出</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">数据类型</label>
                <select
                  className={cn(
                    'w-full h-11 px-4 rounded-xl text-white bg-midnight-900/50 border-2 border-midnight-700',
                    'focus:outline-none focus:border-rose-500 transition-all duration-300'
                  )}
                  value={filterDataType || ''}
                  onChange={(e) => {
                    setFilterDataType(e.target.value || null);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">全部类型</option>
                  {allDataTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300',
                      showSuspiciousOnly
                        ? 'bg-gradient-primary border-rose-500'
                        : 'border-midnight-600 bg-midnight-900/50'
                    )}
                    onClick={() => {
                      setShowSuspiciousOnly(!showSuspiciousOnly);
                      setCurrentPage(1);
                    }}
                  >
                    {showSuspiciousOnly && (
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-midnight-200">仅显示可疑活动</span>
                </label>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setDateFrom('');
                    setDateTo('');
                    setFilterViewer(null);
                    setFilterAction('all');
                    setFilterDataType(null);
                    setShowSuspiciousOnly(false);
                    setCurrentPage(1);
                  }}
                >
                  重置筛选
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sapphire-500" />
                访问日志记录
              </CardTitle>
              <CardDescription>
                共 {filteredLogs.length} 条记录
                {filteredLogs.length !== mockAccessLogs.length && ` (已筛选，原始 ${mockAccessLogs.length} 条)`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-midnight-700">
                    <th className="text-left px-6 py-4 text-sm font-medium text-midnight-300">时间</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-midnight-300">访问者</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-midnight-300">数据类型</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-midnight-300">操作</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-midnight-300">IP地址</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-midnight-300">设备</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-midnight-300">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <FileText className="w-12 h-12 text-midnight-600 mx-auto mb-4" />
                        <p className="text-midnight-400">暂无符合条件的日志记录</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log, index) => (
                      <tr
                        key={log.id}
                        className={cn(
                          'border-b border-midnight-700/50 transition-colors hover:bg-midnight-800/30',
                          log.isSuspicious && 'bg-red-500/5'
                        )}
                        style={{ animationDelay: `${700 + index * 30}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-white">
                              {format(new Date(log.timestamp), 'yyyy-MM-dd', { locale: zhCN })}
                            </span>
                            <span className="text-xs text-midnight-400">
                              {format(new Date(log.timestamp), 'HH:mm:ss', { locale: zhCN })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-midnight-400" />
                            <span className="text-sm text-white">{log.viewer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-midnight-200">{log.dataType}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                            <span className="flex items-center gap-1">
                              {getActionIcon(log.action)}
                              {getActionLabel(log.action)}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-midnight-300">{log.ipAddress}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Monitor className="w-3.5 h-3.5 text-midnight-500" />
                            <span className="text-sm text-midnight-300">{log.device}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {log.isSuspicious ? (
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-sm text-red-400" title={log.suspiciousReason}>
                                {log.suspiciousReason || '可疑'}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="success" size="sm" dot>
                              正常
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-midnight-700">
                <p className="text-sm text-midnight-400">
                  显示第 {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredLogs.length)} 条，
                  共 {filteredLogs.length} 条
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-midnight-300 px-3">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataAccessLog;
