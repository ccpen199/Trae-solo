import { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Thermometer,
  Gauge,
  Wifi,
  HardDrive,
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import { alerts } from '@/data/mockData';
import { useAppStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import type { Alert } from '@/types';

const levelMap = {
  low: { label: '低', color: 'bg-cyber-500/20 text-cyber-400', border: 'border-cyber-500' },
  medium: { label: '中', color: 'bg-yellow-500/20 text-yellow-400', border: 'border-yellow-500' },
  high: { label: '高', color: 'bg-neon-orange/20 text-neon-orange', border: 'border-neon-orange' },
  critical: { label: '严重', color: 'bg-neon-red/20 text-neon-red', border: 'border-neon-red' },
};

const statusMap = {
  pending: { label: '待处理', color: 'bg-neon-red/20 text-neon-red' },
  processing: { label: '处理中', color: 'bg-neon-orange/20 text-neon-orange' },
  resolved: { label: '已解决', color: 'bg-neon-green/20 text-neon-green' },
};

const typeMap: Record<string, { label: string; icon: any }> = {
  temperature: { label: '温度异常', icon: Thermometer },
  performance: { label: '性能下降', icon: Gauge },
  network: { label: '网络问题', icon: Wifi },
  hardware: { label: '硬件故障', icon: HardDrive },
};

const levelOptions = ['全部等级', '低', '中', '高', '严重'];
const statusOptions = ['全部状态', '待处理', '处理中', '已解决'];
const typeOptions = ['全部类型', '温度异常', '性能下降', '网络问题', '硬件故障'];

export default function AlertCenter() {
  const { currentStoreId } = useAppStore();
  const [selectedLevel, setSelectedLevel] = useState('全部等级');
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [selectedType, setSelectedType] = useState('全部类型');
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const storeAlerts = alerts.filter((a) => a.storeId === currentStoreId);

  const filteredAlerts = storeAlerts.filter((alert) => {
    const levelKey = selectedLevel === '全部等级' ? '' :
      Object.entries(levelMap).find(([, v]) => v.label === selectedLevel)?.[0] || '';
    const statusKey = selectedStatus === '全部状态' ? '' :
      Object.entries(statusMap).find(([, v]) => v.label === selectedStatus)?.[0] || '';
    const typeKey = selectedType === '全部类型' ? '' :
      Object.entries(typeMap).find(([, v]) => v.label === selectedType)?.[0] || '';

    const matchLevel = !levelKey || alert.level === levelKey;
    const matchStatus = !statusKey || alert.status === statusKey;
    const matchType = !typeKey || alert.type === typeKey;
    const matchSearch = !searchText ||
      alert.deviceName.toLowerCase().includes(searchText.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchText.toLowerCase());

    return matchLevel && matchStatus && matchType && matchSearch;
  });

  const stats = {
    total: storeAlerts.length,
    pending: storeAlerts.filter((a) => a.status === 'pending').length,
    processing: storeAlerts.filter((a) => a.status === 'processing').length,
    critical: storeAlerts.filter((a) => a.level === 'critical' && a.status !== 'resolved').length,
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleResolve = (id: string) => {
    console.log('处理告警:', id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">故障预警中心</h1>
          <p className="text-dark-400 mt-1">监控设备告警与处理记录</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-500/20">
              <AlertTriangle className="w-5 h-5 text-cyber-400" />
            </div>
            <p className="text-dark-400 text-sm">告警总数</p>
          </div>
          <p className="text-2xl font-bold text-white font-orbitron">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-red/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-red/20">
              <AlertCircle className="w-5 h-5 text-neon-red" />
            </div>
            <p className="text-dark-400 text-sm">待处理</p>
          </div>
          <p className="text-2xl font-bold text-neon-red font-orbitron">{stats.pending}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-orange/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-orange/20">
              <Wrench className="w-5 h-5 text-neon-orange" />
            </div>
            <p className="text-dark-400 text-sm">处理中</p>
          </div>
          <p className="text-2xl font-bold text-neon-orange font-orbitron">{stats.processing}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-red/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-red/30 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-neon-red" />
            </div>
            <p className="text-dark-400 text-sm">严重告警</p>
          </div>
          <p className="text-2xl font-bold text-neon-red font-orbitron">{stats.critical}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索设备/告警信息..."
              className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {levelOptions.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <button className="flex items-center gap-2 h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
          高级筛选
        </button>
      </div>

      <div className="space-y-3">
        {filteredAlerts.map((alert: Alert) => {
          const levelInfo = levelMap[alert.level];
          const statusInfo = statusMap[alert.status];
          const typeInfo = typeMap[alert.type];
          const TypeIcon = typeInfo.icon;
          const isExpanded = expandedId === alert.id;

          return (
            <div
              key={alert.id}
              className={cn(
                'rounded-xl bg-dark-800/50 border overflow-hidden transition-all duration-300',
                alert.status === 'pending' && 'border-l-4',
                alert.status === 'pending' && alert.level === 'critical' && levelInfo.border,
                alert.status === 'pending' && alert.level !== 'critical' && 'border-l-cyber-500',
                alert.status !== 'pending' && 'border-cyber-800/50',
                alert.status === 'pending' && 'hover:border-l-cyber-400'
              )}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(alert.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'p-2.5 rounded-lg',
                      alert.level === 'critical' && 'bg-neon-red/20',
                      alert.level === 'high' && 'bg-neon-orange/20',
                      alert.level === 'medium' && 'bg-yellow-500/20',
                      alert.level === 'low' && 'bg-cyber-500/20'
                    )}>
                      <TypeIcon className={cn(
                        'w-5 h-5',
                        alert.level === 'critical' && 'text-neon-red',
                        alert.level === 'high' && 'text-neon-orange',
                        alert.level === 'medium' && 'text-yellow-400',
                        alert.level === 'low' && 'text-cyber-400'
                      )} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-medium">{alert.deviceName}</h3>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', levelInfo.color)}>
                          {levelInfo.label}
                        </span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-dark-300">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(alert.createdAt)}
                        </span>
                        <span>{typeInfo.label}</span>
                      </div>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-dark-400 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-dark-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-dark-700">
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-dark-300">告警详情</h4>
                      <div className="text-sm text-dark-400 space-y-2">
                        <p>告警ID: {alert.id}</p>
                        <p>设备: {alert.deviceName}</p>
                        <p>门店: {alert.storeName}</p>
                        <p>告警类型: {typeInfo.label}</p>
                        <p>告警等级: {levelInfo.label}</p>
                        <p>创建时间: {new Date(alert.createdAt).toLocaleString('zh-CN')}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-dark-300">处理记录</h4>
                      {alert.status === 'pending' ? (
                        <p className="text-sm text-dark-500">暂无处理记录</p>
                      ) : (
                        <div className="text-sm text-dark-400 space-y-2">
                          <p>处理人: {alert.handler || '未分配'}</p>
                          {alert.resolvedAt && (
                            <p>解决时间: {new Date(alert.resolvedAt).toLocaleString('zh-CN')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark-700 flex gap-3">
                    {alert.status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(alert.id);
                          }}
                          className="flex items-center gap-2 h-9 px-4 bg-neon-green hover:bg-neon-green/80 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          开始处理
                        </button>
                        <button className="flex items-center gap-2 h-9 px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors">
                          <User className="w-4 h-4" />
                          指派处理
                        </button>
                      </>
                    )}
                    {alert.status === 'processing' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(alert.id);
                        }}
                        className="flex items-center gap-2 h-9 px-4 bg-neon-green hover:bg-neon-green/80 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        标记已解决
                      </button>
                    )}
                    {alert.status === 'resolved' && (
                      <span className="flex items-center gap-2 text-neon-green text-sm">
                        <CheckCircle className="w-4 h-4" />
                        已解决
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的告警</p>
        </div>
      )}
    </div>
  );
}
