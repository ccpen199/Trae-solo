import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  Database,
  Plus,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  MoreHorizontal,
  Search,
} from 'lucide-react';

export default function DataSources() {
  const { dataSources, theme } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    active: { label: '运行中', color: 'text-lake-green-400', bg: 'bg-lake-green-500/20', icon: CheckCircle },
    degraded: { label: '降级', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
    error: { label: '异常', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
  };
  
  const typeFilters = [
    { value: 'all', label: '全部' },
    { value: 'weather', label: '气象' },
    { value: 'ocean', label: '海洋' },
    { value: 'hydrology', label: '水文' },
    { value: 'astronomy', label: '天文' },
  ];
  
  const filteredSources = dataSources.filter(source => {
    const matchesSearch = source.name.includes(searchTerm) || source.provider.includes(searchTerm);
    const matchesType = filterType === 'all' || source.type === filterType;
    return matchesSearch && matchesType;
  });
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部操作栏 */}
      <div className={cn(
        'rounded-2xl p-5',
        theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
      )}>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-lake-green-500/10 flex items-center justify-center">
              <Database size={24} className="text-lake-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">数据源管理</h2>
              <p className="text-sm text-moonlight-400">共 {dataSources.length} 个数据源，{dataSources.filter(s => s.status === 'active').length} 个正常运行</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 rounded-xl border border-deep-sea-700/50 text-moonlight-300 text-sm font-medium flex items-center gap-2 hover:bg-deep-sea-800/30 transition-all">
              <RefreshCw size={16} />
              刷新全部
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lake-green-500 to-deep-sea-500 text-white text-sm font-medium flex items-center gap-2 hover:from-lake-green-600 hover:to-deep-sea-600 transition-all">
              <Plus size={16} />
              添加数据源
            </button>
          </div>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="mt-5 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-moonlight-400" />
            <input
              type="text"
              placeholder="搜索数据源名称或提供商..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                'w-full pl-12 pr-4 py-2.5 rounded-xl border outline-none transition-all',
                theme === 'dark'
                  ? 'bg-deep-sea-800/50 border-deep-sea-700 text-moonlight-100 placeholder-moonlight-500 focus:border-lake-green-500/50'
                  : 'bg-moonlight-50 border-moonlight-200 text-deep-sea-900 placeholder-moonlight-400 focus:border-lake-green-500/50'
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            {typeFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterType(filter.value)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  filterType === filter.value
                    ? 'bg-lake-green-500/20 text-lake-green-400'
                    : 'text-moonlight-400 hover:bg-deep-sea-800/30'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 数据源列表 */}
      <div className="space-y-4">
        {filteredSources.map((source, index) => {
          const status = statusConfig[source.status];
          const StatusIcon = status.icon;
          
          return (
            <div
              key={source.id}
              className={cn(
                'rounded-2xl p-5 transition-all card-hover animate-slide-up',
                theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center',
                    source.type === 'weather' ? 'bg-blue-500/10' :
                    source.type === 'ocean' ? 'bg-cyan-500/10' :
                    source.type === 'hydrology' ? 'bg-emerald-500/10' :
                    'bg-purple-500/10'
                  )}>
                    <Database size={28} className={cn(
                      source.type === 'weather' ? 'text-blue-400' :
                      source.type === 'ocean' ? 'text-cyan-400' :
                      source.type === 'hydrology' ? 'text-emerald-400' :
                      'text-purple-400'
                    )} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{source.name}</h3>
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5', status.bg, status.color)}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-moonlight-400 mt-1">{source.description}</p>
                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <p className="text-xs text-moonlight-500">提供商</p>
                        <p className="text-sm font-medium">{source.provider}</p>
                      </div>
                      <div>
                        <p className="text-xs text-moonlight-500">数据类型</p>
                        <p className="text-sm font-medium">{source.typeName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-moonlight-500">更新频率</p>
                        <p className="text-sm font-medium">{source.updateFrequency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-moonlight-500">延迟</p>
                        <p className="text-sm font-medium">{source.latency}ms</p>
                      </div>
                      <div>
                        <p className="text-xs text-moonlight-500">覆盖区域</p>
                        <p className="text-sm font-medium">{source.coverage}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg text-moonlight-400 hover:bg-deep-sea-800/50 transition-colors">
                    <Settings size={18} />
                  </button>
                  <button className="p-2 rounded-lg text-moonlight-400 hover:bg-deep-sea-800/50 transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>
              
              {/* 数据字段标签 */}
              <div className="mt-4 pt-4 border-t border-deep-sea-700/30 flex flex-wrap gap-2">
                {source.dataFields.map(field => (
                  <span
                    key={field}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs',
                      theme === 'dark' ? 'bg-deep-sea-800/50 text-moonlight-300' : 'bg-moonlight-100 text-moonlight-600'
                    )}
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
