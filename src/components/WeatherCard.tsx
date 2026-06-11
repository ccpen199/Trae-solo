import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Eye,
  RefreshCw,
  Star,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
  History,
  FileCheck,
} from 'lucide-react';
import type { CurrentWeather, DataSourceContribution } from '../../shared/types';
import { useWeatherStore } from '../stores/weatherStore';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

interface WeatherCardProps {
  data: CurrentWeather | null;
  loading?: boolean;
  className?: string;
}

const weatherIcons: Record<string, React.FC<{ className?: string }>> = {
  sun: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  thunder: CloudLightning,
  fog: CloudFog,
};

function getWeatherIcon(code: string) {
  if (code.includes('sun') || code.includes('clear')) return Sun;
  if (code.includes('rain')) return CloudRain;
  if (code.includes('snow')) return CloudSnow;
  if (code.includes('thunder') || code.includes('storm')) return CloudLightning;
  if (code.includes('fog') || code.includes('mist') || code.includes('haze')) return CloudFog;
  if (code.includes('cloud')) return Cloud;
  return Sun;
}

export default function WeatherCard({ data, loading, className }: WeatherCardProps) {
  const { favoriteCities, favoriteLoading, toast, toggleFavoriteCity, clearToast } = useWeatherStore();
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const isFavorite = data ? favoriteCities.some(c => c.id === data.cityId) : false;
  const isLoading = data ? favoriteLoading === data.cityId : false;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data || isLoading) return;
    await toggleFavoriteCity(data.cityId, data.cityName);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(clearToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  if (loading || !data) {
    return (
      <div className={cn('glass-card glow-blue p-8', className)}>
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-slate-700/50 rounded-lg mb-4"></div>
          <div className="flex items-center justify-between">
            <div className="h-24 w-24 bg-slate-700/50 rounded-full"></div>
            <div className="h-20 w-40 bg-slate-700/50 rounded-2xl"></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-700/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const WeatherIcon = getWeatherIcon(data.weatherCode);

  return (
    <div className={cn('glass-card glow-blue p-6 md:p-8 relative overflow-hidden', className)}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-cyan-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white mb-1">{data.cityName}</h2>
                <button
                  onClick={handleToggleFavorite}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium',
                    isFavorite
                      ? 'text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30'
                      : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 border border-slate-600/30 hover:border-yellow-500/30',
                    isLoading && 'opacity-60 cursor-not-allowed'
                  )}
                  title={isFavorite ? '点击取消关注' : '点击添加关注'}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />
                  )}
                  <span>{isFavorite ? '已关注' : '加关注'}</span>
                </button>
              </div>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <RefreshCw className="w-3 h-3" />
              更新于 {new Date(data.updateTime).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center">
            <WeatherIcon className="w-10 h-10 md:w-12 md:h-12 text-blue-400" />
          </div>
        </div>

        <div className="flex items-end gap-4 mb-8">
          <div className="text-7xl md:text-8xl font-bold text-gradient leading-none">
            {Math.round(data.temperature)}
            <span className="text-3xl md:text-4xl font-normal text-slate-400 ml-1">°C</span>
          </div>
          <div className="pb-3">
            <p className="text-lg text-white font-medium">{data.weather}</p>
            <p className="text-slate-400 text-sm">体感 {Math.round(data.feelsLike)}°C</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-slate-800/40 rounded-xl p-3 md:p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-1">
              <Droplets className="w-4 h-4 text-blue-400" />
              湿度
            </div>
            <p className="text-lg md:text-xl font-semibold text-white">{data.humidity}%</p>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3 md:p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-1">
              <Wind className="w-4 h-4 text-cyan-400" />
              风力
            </div>
            <p className="text-lg md:text-xl font-semibold text-white">
              {data.windDirection} {data.windScale}
            </p>
            <p className="text-xs text-slate-500">{data.windSpeed} km/h</p>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3 md:p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-1">
              <Gauge className="w-4 h-4 text-emerald-400" />
              气压
            </div>
            <p className="text-lg md:text-xl font-semibold text-white">{data.pressure} hPa</p>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3 md:p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-1">
              <Eye className="w-4 h-4 text-purple-400" />
              能见度
            </div>
            <p className="text-lg md:text-xl font-semibold text-white">{data.visibility} km</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              多源数据融合
            </span>
            {data.sourceDetails && data.sourceDetails.length > 0 && (
              <span className="text-xs text-slate-500">
                可信度: {data.sourceDetails.filter(s => s.status !== 'circuit_break').map(s => s.credibility).filter(c => c > 0).join('% / ')}%
              </span>
            )}
          </div>
          {data.sourceDetails && data.sourceDetails.length > 0 ? (
            <div className="space-y-2">
              {data.sourceDetails.map((source) => (
                <SourceDetail key={source.id} source={source} />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {data.dataSources.slice(0, 3).map((source, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 rounded-md bg-slate-800/60 text-slate-400 border border-slate-700/30"
                >
                  {source}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right fade-in duration-300',
          toast.type === 'success' && 'bg-emerald-500/90 border-emerald-400/50 text-white',
          toast.type === 'error' && 'bg-red-500/90 border-red-400/50 text-white',
          toast.type === 'info' && 'bg-blue-500/90 border-blue-400/50 text-white'
        )}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5" />}
          {toast.type === 'info' && <AlertTriangle className="w-5 h-5" />}
          <span className="font-medium text-sm">{toast.message}</span>
          <button onClick={clearToast} className="ml-2 hover:opacity-80 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function SourceDetail({ source }: { source: DataSourceContribution }) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig: Record<string, { label: string; dotColor: string; textColor: string; bgColor: string }> = {
    online: { label: '在线', dotColor: 'bg-emerald-500', textColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    degraded: { label: '降级', dotColor: 'bg-amber-500', textColor: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    circuit_break: { label: '熔断', dotColor: 'bg-red-500', textColor: 'text-red-400', bgColor: 'bg-red-500/10' },
    offline: { label: '离线', dotColor: 'bg-slate-500', textColor: 'text-slate-400', bgColor: 'bg-slate-500/10' },
  };
  const complianceConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    compliant: { label: '合规', color: 'text-emerald-400', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    warning: { label: '预警', color: 'text-amber-400', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    non_compliant: { label: '不合规', color: 'text-red-400', icon: <XCircle className="w-3.5 h-3.5" /> },
  };
  const config = statusConfig[source.status] || statusConfig.offline;
  const compliance = source.complianceStatus ? complianceConfig[source.complianceStatus] : null;
  const passedChecks = source.qualityChecks.filter(c => c.passed).length;
  const totalChecks = source.qualityChecks.length;
  const failedChecks = source.qualityChecks.filter(c => !c.passed);
  const typeLabels: Record<string, string> = { official: '国家气象局', radar: '雷达卫星', iot: 'IoT微站' };

  return (
    <div className={cn('p-3 rounded-lg border transition-all', source.status === 'circuit_break' ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/30 border-slate-700/30')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', config.dotColor, source.status === 'circuit_break' && 'animate-pulse')} />
          <span className="text-white text-xs font-medium">{typeLabels[source.type] || source.name}</span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded', config.bgColor, config.textColor)}>{config.label}</span>
          {compliance && (
            <span className={cn('text-xs px-1.5 py-0.5 rounded bg-slate-700/50 flex items-center gap-1', compliance.color)}>
              {compliance.icon}
              {compliance.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {source.credibility > 0 ? (
            <span className="text-xs text-cyan-400 font-medium">可信度 {source.credibility}%</span>
          ) : (
            <span className="text-xs text-slate-500">未参与融合</span>
          )}
          {(failedChecks.length > 0 || source.circuitBreakReason || source.reviewRecords) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
            >
              {expanded ? '收起' : '详情'}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>质量分: <span className={cn('font-medium', source.qualityScore >= 90 ? 'text-emerald-400' : source.qualityScore >= 70 ? 'text-amber-400' : 'text-red-400')}>{source.qualityScore}</span></span>
        <span>权重: {source.weight}</span>
        <span>有效权重: {source.effectiveWeight}</span>
        {source.values && (
          <span>温度: {source.values.temperature}°C / 湿度: {source.values.humidity}%</span>
        )}
      </div>
      {source.qualityChecks.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            {source.qualityChecks.map((check, i) => (
              check.passed ? (
                <CheckCircle key={i} className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle key={i} className="w-3 h-3 text-red-400" />
              )
            ))}
          </div>
          <span className={cn('text-xs', passedChecks === totalChecks ? 'text-emerald-400' : 'text-amber-400')}>
            校验 {passedChecks}/{totalChecks} 通过
          </span>
          {passedChecks < totalChecks && (
            <span className="text-xs text-slate-500">
              ({failedChecks.map(c => c.ruleName).join(', ')})
            </span>
          )}
        </div>
      )}

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-3">
          {failedChecks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-medium">失败规则明细</span>
              </div>
              <div className="space-y-1.5">
                {failedChecks.map((check, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-red-500/5 px-2 py-1.5 rounded border border-red-500/10">
                    <span className="text-slate-300">{check.ruleName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">实际: <span className="text-red-400">{check.actualValue}</span></span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">期望: <span className="text-emerald-400">{formatThreshold(check.operator, check.threshold)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {source.anomalyValues && source.anomalyValues.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-red-400 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-medium">异常值检测</span>
              </div>
              <div className="space-y-1.5">
                {source.anomalyValues.map((anomaly, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-red-500/5 px-2 py-1.5 rounded border border-red-500/10">
                    <span className="text-slate-300">{anomaly.field}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-medium">{anomaly.value}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-emerald-400">{anomaly.expected}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {source.circuitBreakReason && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-red-400 mb-2">
                <XCircle className="w-3.5 h-3.5" />
                <span className="font-medium">熔断结论</span>
              </div>
              <div className="text-xs bg-red-500/5 px-2 py-1.5 rounded border border-red-500/10">
                <p className="text-slate-300">{source.circuitBreakReason}</p>
                {source.circuitBreakTime && (
                  <p className="text-slate-500 mt-1">
                    熔断时间: {new Date(source.circuitBreakTime).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            </div>
          )}

          {source.reviewRecords && source.reviewRecords.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-blue-400 mb-2">
                <History className="w-3.5 h-3.5" />
                <span className="font-medium">可信度复查记录</span>
              </div>
              <div className="space-y-1.5">
                {source.reviewRecords.map((record, i) => (
                  <div key={i} className="text-xs bg-blue-500/5 px-2 py-1.5 rounded border border-blue-500/10">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">
                        <span className="text-blue-400 font-medium">{record.reviewer}</span>
                        <span className="text-slate-500 mx-1">·</span>
                        {record.action}
                      </span>
                      <span className="text-slate-500">
                        {new Date(record.time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">{record.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {compliance && (
            <div>
              <div className={cn('flex items-center gap-1.5 text-xs mb-2', compliance.color)}>
                <FileCheck className="w-3.5 h-3.5" />
                <span className="font-medium">合规服务输出</span>
              </div>
              <div className={cn(
                'text-xs px-2 py-1.5 rounded border',
                source.complianceStatus === 'non_compliant'
                  ? 'bg-red-500/5 border-red-500/10'
                  : source.complianceStatus === 'warning'
                  ? 'bg-amber-500/5 border-amber-500/10'
                  : 'bg-emerald-500/5 border-emerald-500/10'
              )}>
                <div className="flex items-center gap-2">
                  <span className={compliance.color}>{compliance.icon}</span>
                  <span className="text-slate-300">
                    {source.complianceStatus === 'non_compliant'
                      ? '当前数据源不合规，不可用于气象信息服务发布'
                      : source.complianceStatus === 'warning'
                      ? '当前数据源预警状态，需人工确认后方可发布'
                      : '当前数据源合规，可用于气象信息服务发布'}
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  {source.complianceStatus === 'non_compliant'
                    ? `依据《气象信息服务管理办法》第十五条，校验通过率${passedChecks}/${totalChecks}不满足≥80%要求，禁止对外发布`
                    : source.complianceStatus === 'warning'
                    ? `依据《气象信息服务管理办法》第十二条，校验通过率${passedChecks}/${totalChecks}，质量分${source.qualityScore}，需人工复核确认`
                    : `符合《气象信息服务管理办法》第十条要求，校验通过率${passedChecks}/${totalChecks}，质量分${source.qualityScore}`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {source.status === 'circuit_break' && !expanded && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
          <AlertTriangle className="w-3 h-3" />
          <span>已熔断，数据不参与融合计算</span>
        </div>
      )}
    </div>
  );
}

function formatThreshold(operator: string, threshold: number | [number, number]): string {
  switch (operator) {
    case '>': return `> ${threshold}`;
    case '<': return `< ${threshold}`;
    case '>=': return `≥ ${threshold}`;
    case '<=': return `≤ ${threshold}`;
    case '==': return `= ${threshold}`;
    case '!=': return `≠ ${threshold}`;
    case 'range': {
      if (Array.isArray(threshold)) {
        return `${threshold[0]} ~ ${threshold[1]}`;
      }
      const str = String(threshold).replace(/[\[\]]/g, '');
      const parts = str.split(',').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return `${parts[0]} ~ ${parts[1]}`;
      }
      return String(threshold);
    }
    default: return String(threshold);
  }
}
