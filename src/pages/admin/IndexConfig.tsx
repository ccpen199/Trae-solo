import { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  Save,
  RefreshCw,
  Eye,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Umbrella,
  Shirt,
  Car,
  Dumbbell,
  Snowflake,
  Plane,
  Car as CarIcon,
  Heart,
} from 'lucide-react';
import { adminApi } from '../../api';
import type { IndexParameter } from '../../../shared/types';
import { cn } from '../../lib/utils';

const indexIcons: Record<string, React.ElementType> = {
  aqi: Wind,
  pm25: Wind,
  uv: Sun,
  feels_like: Thermometer,
  dressing: Shirt,
  car_wash: Car,
  sports: Dumbbell,
  cold: Snowflake,
  drying: Umbrella,
  travel: Plane,
  traffic: CarIcon,
  comfort: Heart,
};

const indexColors: Record<string, string> = {
  aqi: 'from-emerald-500 to-teal-400',
  pm25: 'from-slate-500 to-slate-400',
  uv: 'from-amber-500 to-orange-400',
  feels_like: 'from-red-500 to-rose-400',
  dressing: 'from-blue-500 to-cyan-400',
  car_wash: 'from-cyan-500 to-blue-400',
  sports: 'from-green-500 to-emerald-400',
  cold: 'from-sky-500 to-blue-400',
  drying: 'from-yellow-500 to-amber-400',
  travel: 'from-purple-500 to-violet-400',
  traffic: 'from-orange-500 to-amber-400',
  comfort: 'from-pink-500 to-rose-400',
};

export default function IndexConfig() {
  const [indexParams, setIndexParams] = useState<IndexParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIndex, setSavingIndex] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const [editedParams, setEditedParams] = useState<Record<string, Record<string, number>>>({});
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await adminApi.getIndexParams();
        setIndexParams(data);
        if (data.length > 0) {
          setActiveIndex(data[0].indexType);
        }
      } catch (error) {
        console.error('Failed to fetch index params:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const initialEdited: Record<string, Record<string, number>> = {};
    indexParams.forEach((param) => {
      initialEdited[param.indexType] = {};
      param.parameters.forEach((p) => {
        initialEdited[param.indexType][p.key] = p.value;
      });
    });
    setEditedParams(initialEdited);
  }, [indexParams]);

  const handleParamChange = (indexType: string, paramKey: string, value: number) => {
    setEditedParams((prev) => ({
      ...prev,
      [indexType]: {
        ...prev[indexType],
        [paramKey]: value,
      },
    }));

    const original = indexParams.find((ip) => ip.indexType === indexType);
    const originalParam = original?.parameters.find((p) => p.key === paramKey);
    if (originalParam && originalParam.value !== value) {
      setHasChanges((prev) => ({ ...prev, [indexType]: true }));
    } else {
      const allParams = original?.parameters || [];
      const hasOtherChanges = allParams.some((p) => {
        if (p.key === paramKey) return false;
        return editedParams[indexType]?.[p.key] !== p.value;
      });
      if (!hasOtherChanges) {
        setHasChanges((prev) => ({ ...prev, [indexType]: false }));
      }
    }
  };

  const handleSave = async (indexType: string) => {
    setSavingIndex(indexType);
    try {
      const param = indexParams.find((ip) => ip.indexType === indexType);
      if (!param) return;

      const updatedParams = param.parameters.map((p) => ({
        ...p,
        value: editedParams[indexType]?.[p.key] ?? p.value,
      }));

      const updated = await adminApi.updateIndexParam(indexType, {
        parameters: updatedParams,
      });

      setIndexParams((prev) =>
        prev.map((ip) => (ip.indexType === indexType ? updated : ip))
      );
      setHasChanges((prev) => ({ ...prev, [indexType]: false }));
    } catch (error) {
      console.error('Failed to save index params:', error);
    } finally {
      setSavingIndex(null);
    }
  };

  const handleReset = (indexType: string) => {
    const param = indexParams.find((ip) => ip.indexType === indexType);
    if (!param) return;

    const resetValues: Record<string, number> = {};
    param.parameters.forEach((p) => {
      resetValues[p.key] = p.value;
    });

    setEditedParams((prev) => ({
      ...prev,
      [indexType]: resetValues,
    }));
    setHasChanges((prev) => ({ ...prev, [indexType]: false }));
  };

  const calculatePreview = (indexType: string) => {
    const params = editedParams[indexType] || {};
    const paramKeys = Object.keys(params);
    if (paramKeys.length === 0) return 0;

    const total = paramKeys.reduce((sum, key) => sum + params[key], 0);
    const avg = total / paramKeys.length;
    return Math.min(100, Math.max(0, Math.round(avg)));
  };

  const getPreviewLevel = (score: number) => {
    if (score >= 80) return { label: '优秀', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (score >= 60) return { label: '良好', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score >= 40) return { label: '中等', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    return { label: '较差', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const activeParam = indexParams.find((ip) => ip.indexType === activeIndex);
  const previewScore = activeIndex ? calculatePreview(activeIndex) : 0;
  const previewLevel = getPreviewLevel(previewScore);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-700/50 rounded" />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3 h-96 bg-slate-700/30 rounded-2xl" />
            <div className="col-span-9 h-96 bg-slate-700/30 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">指数参数配置</h1>
        <p className="text-slate-400">
          配置12类生活指数的计算参数，实时预览计算结果
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3 px-2">指数分类</h3>
            <div className="space-y-1">
              {indexParams.map((param) => {
                const Icon = indexIcons[param.indexType] || Settings;
                const isActive = activeIndex === param.indexType;
                const hasChange = hasChanges[param.indexType];

                return (
                  <button
                    key={param.indexType}
                    onClick={() => setActiveIndex(param.indexType)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                      isActive
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        isActive
                          ? 'bg-blue-500/30'
                          : 'bg-slate-700/50'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {param.indexName}
                        </span>
                        {hasChange && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {param.parameters.length} 个参数
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9">
          {activeParam && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br',
                      indexColors[activeParam.indexType] || 'from-blue-500 to-cyan-400'
                    )}
                  >
                    {(() => {
                      const Icon = indexIcons[activeParam.indexType] || Settings;
                      return <Icon className="w-7 h-7 text-white" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {activeParam.indexName}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      版本 {activeParam.version} · 更新于{' '}
                      {new Date(activeParam.updateTime).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReset(activeParam.indexType)}
                    disabled={!hasChanges[activeParam.indexType]}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重置
                  </button>
                  <button
                    onClick={() => handleSave(activeParam.indexType)}
                    disabled={!hasChanges[activeParam.indexType] || savingIndex === activeParam.indexType}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {savingIndex === activeParam.indexType ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>

              <div className="mb-8 p-5 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-white font-medium">实时预览</h3>
                </div>
                <div className="flex items-center gap-8">
                  <div className="relative">
                    <svg className="w-32 h-32" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        stroke="rgba(100, 116, 139, 0.2)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        stroke="url(#previewGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(previewScore / 100) * 327} 327`}
                        transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                      <defs>
                        <linearGradient id="previewGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#22D3EE" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-white">{previewScore}</span>
                      <span className={cn('text-xs font-medium', previewLevel.color)}>
                        {previewLevel.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-4">
                    {activeParam.parameters.slice(0, 4).map((p) => (
                      <div key={p.key} className="text-sm">
                        <span className="text-slate-400">{p.name}：</span>
                        <span className="text-white font-medium">
                          {editedParams[activeParam.indexType]?.[p.key] ?? p.value}
                          <span className="text-slate-500 text-xs ml-1">{p.unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  参数配置
                </h3>

                <div className="grid gap-5">
                  {activeParam.parameters.map((param) => {
                    const currentValue =
                      editedParams[activeParam.indexType]?.[param.key] ?? param.value;
                    const percentage =
                      ((currentValue - param.min) / (param.max - param.min)) * 100;

                    return (
                      <div
                        key={param.key}
                        className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-white font-medium text-sm">{param.name}</h4>
                            <p className="text-slate-500 text-xs mt-0.5">
                              {param.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-gradient">
                              {currentValue}
                            </span>
                            <span className="text-slate-500 text-sm ml-1">{param.unit}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-500 w-10 text-right">
                            {param.min}
                          </span>
                          <div className="flex-1 relative">
                            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <input
                              type="range"
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              value={currentValue}
                              onChange={(e) =>
                                handleParamChange(
                                  activeParam.indexType,
                                  param.key,
                                  Number(e.target.value)
                                )
                              }
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-10">
                            {param.max}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
