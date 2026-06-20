import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Users,
  MapPin,
  Fish,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Clock,
  Zap,
} from 'lucide-react';

export default function AdminOverview() {
  const { theme, dataSources, modelVersions, userBehaviorData } = useAppStore();
  
  const stats = [
    { label: '总用户数', value: '12,586', change: '+12.5%', trend: 'up', icon: Users, color: 'text-lake-green-400', bg: 'bg-lake-green-500/10' },
    { label: '活跃钓点', value: '328', change: '+5.2%', trend: 'up', icon: MapPin, color: 'text-deep-sea-400', bg: 'bg-deep-sea-500/10' },
    { label: '今日渔获', value: '1,247', change: '-3.1%', trend: 'down', icon: Fish, color: 'text-sunset-orange-400', bg: 'bg-sunset-orange-500/10' },
    { label: 'API调用', value: '45.2K', change: '+18.7%', trend: 'up', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              'rounded-2xl p-5 transition-all card-hover animate-slide-up',
              theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
            )}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bg)}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <span className={cn(
                'text-sm font-medium flex items-center gap-1',
                stat.trend === 'up' ? 'text-lake-green-400' : 'text-red-400'
              )}>
                {stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-moonlight-400">{stat.label}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 用户行为趋势 */}
        <div className={cn(
          'rounded-2xl p-6',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity size={20} className="text-lake-green-400" />
            近30天用户活跃度
          </h3>
          <div className="h-64 flex items-end justify-around gap-1">
            {userBehaviorData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-deep-sea-500 to-lake-green-400 transition-all hover:from-lake-green-500 hover:to-lake-green-300"
                  style={{ height: `${(day.activeUsers / 800) * 100}%`, minHeight: '8px' }}
                />
                {index % 5 === 0 && (
                  <span className="text-xs text-moonlight-400">第{index + 1}天</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* 数据源状态 */}
        <div className={cn(
          'rounded-2xl p-6',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye size={20} className="text-deep-sea-400" />
            数据源状态
          </h3>
          <div className="space-y-3">
            {dataSources.map((source, index) => (
              <div
                key={source.id}
                className={cn(
                  'p-4 rounded-xl flex items-center justify-between',
                  theme === 'dark' ? 'bg-deep-sea-800/50' : 'bg-moonlight-50'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    source.status === 'active' ? 'bg-lake-green-400 animate-pulse' :
                    source.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                  )} />
                  <div>
                    <p className="font-medium text-sm">{source.name}</p>
                    <p className="text-xs text-moonlight-400">{source.typeName} · 更新频率: {source.updateFrequency}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-moonlight-400">延迟</p>
                  <p className="font-medium text-sm">{source.latency}ms</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 模型版本 */}
      <div className={cn(
        'rounded-2xl p-6',
        theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
      )}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-yellow-400" />
          指数模型版本
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-moonlight-400 border-b border-deep-sea-700/30">
                <th className="pb-3 font-medium">版本号</th>
                <th className="pb-3 font-medium">名称</th>
                <th className="pb-3 font-medium">状态</th>
                <th className="pb-3 font-medium">准确率</th>
                <th className="pb-3 font-medium">发布时间</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {modelVersions.map((version, index) => (
                <tr
                  key={version.id}
                  className={cn(
                    'border-b border-deep-sea-700/20',
                    theme === 'dark' ? 'hover:bg-deep-sea-800/30' : 'hover:bg-moonlight-50'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="py-4 font-mono text-sm">v{version.version}</td>
                  <td className="py-4 font-medium">{version.name}</td>
                  <td className="py-4">
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      version.status === 'production'
                        ? 'bg-lake-green-500/20 text-lake-green-400'
                        : version.status === 'testing'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-moonlight-500/20 text-moonlight-400'
                    )}>
                      {version.statusName}
                    </span>
                  </td>
                  <td className="py-4">{version.accuracy}%</td>
                  <td className="py-4 text-moonlight-400 text-sm">
                    {version.releaseDate}
                  </td>
                  <td className="py-4">
                    <button className="text-lake-green-400 text-sm hover:underline">
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
