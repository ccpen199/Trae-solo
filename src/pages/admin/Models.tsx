import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  Cpu,
  Plus,
  Play,
  Pause,
  RotateCcw,
  GitBranch,
  Calendar,
  TrendingUp,
  Clock,
  MoreHorizontal,
  ChevronDown,
  Check,
  Zap,
} from 'lucide-react';

export default function Models() {
  const { modelVersions, theme } = useAppStore();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(modelVersions[0]?.id || null);
  
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    production: { label: '生产环境', color: 'text-lake-green-400', bg: 'bg-lake-green-500/20' },
    testing: { label: '测试中', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    deprecated: { label: '已弃用', color: 'text-moonlight-400', bg: 'bg-moonlight-500/20' },
  };
  
  const selectedModel = modelVersions.find(m => m.id === selectedVersion);
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部操作栏 */}
      <div className={cn(
        'rounded-2xl p-5',
        theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
      )}>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Cpu size={24} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">指数模型管理</h2>
              <p className="text-sm text-moonlight-400">管理钓鱼指数计算模型的版本与权重配置</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 rounded-xl border border-deep-sea-700/50 text-moonlight-300 text-sm font-medium flex items-center gap-2 hover:bg-deep-sea-800/30 transition-all">
              <RotateCcw size={16} />
              回滚版本
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lake-green-500 to-deep-sea-500 text-white text-sm font-medium flex items-center gap-2 hover:from-lake-green-600 hover:to-deep-sea-600 transition-all">
              <Plus size={16} />
              新建版本
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：版本列表 */}
        <div className={cn(
          'rounded-2xl p-5',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitBranch size={20} className="text-lake-green-400" />
            版本列表
          </h3>
          <div className="space-y-2">
            {modelVersions.map((version, index) => {
              const status = statusConfig[version.status];
              const isSelected = selectedVersion === version.id;
              
              return (
                <button
                  key={version.id}
                  onClick={() => setSelectedVersion(version.id)}
                  className={cn(
                    'w-full p-4 rounded-xl text-left transition-all',
                    isSelected
                      ? 'bg-lake-green-500/10 border border-lake-green-500/30'
                      : theme === 'dark'
                        ? 'bg-deep-sea-800/30 hover:bg-deep-sea-800/50 border border-transparent'
                        : 'bg-moonlight-50 hover:bg-moonlight-100 border border-transparent'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        version.status === 'production' ? 'bg-lake-green-500/20' :
                        version.status === 'testing' ? 'bg-yellow-500/20' :
                        'bg-moonlight-500/20'
                      )}>
                        <Cpu size={16} className={cn(
                          version.status === 'production' ? 'text-lake-green-400' :
                          version.status === 'testing' ? 'text-yellow-400' :
                          'text-moonlight-400'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">v{version.version}</p>
                        <p className="text-xs text-moonlight-400">{version.name}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={18} className="text-lake-green-400" />
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', status.bg, status.color)}>
                      {status.label}
                    </span>
                    <span className="text-xs text-moonlight-400">{version.releaseDate}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* 右侧：版本详情 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedModel && (
            <>
              {/* 基本信息 */}
              <div className={cn(
                'rounded-2xl p-6',
                theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
              )}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">v{selectedModel.version}</h3>
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        statusConfig[selectedModel.status].bg,
                        statusConfig[selectedModel.status].color
                      )}>
                        {statusConfig[selectedModel.status].label}
                      </span>
                    </div>
                    <p className="text-moonlight-400 mt-1">{selectedModel.name}</p>
                  </div>
                  <button className="p-2 rounded-lg text-moonlight-400 hover:bg-deep-sea-800/50 transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-deep-sea-800/30 text-center">
                    <Zap size={20} className="text-lake-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedModel.accuracy}%</p>
                    <p className="text-xs text-moonlight-400">预测准确率</p>
                  </div>
                  <div className="p-4 rounded-xl bg-deep-sea-800/30 text-center">
                    <TrendingUp size={20} className="text-deep-sea-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedModel.factors.length}</p>
                    <p className="text-xs text-moonlight-400">计算因子</p>
                  </div>
                  <div className="p-4 rounded-xl bg-deep-sea-800/30 text-center">
                    <Calendar size={20} className="text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm font-medium">{selectedModel.releaseDate}</p>
                    <p className="text-xs text-moonlight-400">发布日期</p>
                  </div>
                  <div className="p-4 rounded-xl bg-deep-sea-800/30 text-center">
                    <Clock size={20} className="text-sunset-orange-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedModel.updateCount}</p>
                    <p className="text-xs text-moonlight-400">迭代次数</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-3">更新说明</h4>
                  <p className="text-sm text-moonlight-300 leading-relaxed">
                    {selectedModel.description}
                  </p>
                </div>
              </div>
              
              {/* 因子权重配置 */}
              <div className={cn(
                'rounded-2xl p-6',
                theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
              )}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Cpu size={20} className="text-lake-green-400" />
                  因子权重配置
                </h3>
                <div className="space-y-4">
                  {selectedModel.factors.map((factor, index) => (
                    <div key={factor.key} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{factor.name}</span>
                        <span className="text-sm text-lake-green-400 font-medium">{factor.weight * 100}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-moonlight-700/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-lake-green-500 to-deep-sea-500"
                          style={{ width: `${factor.weight * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-moonlight-400 mt-1">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex items-center gap-4">
                <button className="flex-1 py-3 rounded-xl bg-gradient-to-r from-lake-green-500 to-deep-sea-500 text-white font-medium flex items-center justify-center gap-2 hover:from-lake-green-600 hover:to-deep-sea-600 transition-all">
                  <Play size={18} />
                  启用此版本
                </button>
                <button className="px-6 py-3 rounded-xl border border-deep-sea-700/50 text-moonlight-300 font-medium flex items-center justify-center gap-2 hover:bg-deep-sea-800/30 transition-all">
                  <RotateCcw size={18} />
                  回滚
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
