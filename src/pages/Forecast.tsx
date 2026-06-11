import { useWeatherStore } from '../stores/weatherStore';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ReferenceLine,
} from 'recharts';
import {
  Sunrise,
  Sunset,
  Sun,
  Droplets,
  Wind,
  ThermometerSun,
  CloudRain,
  CloudSun,
  Eye,
  Gauge,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Cpu,
  Star,
  Loader2,
  UserCheck,
  Clock,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

export default function Forecast() {
  const { currentCity, hourlyForecast, dailyForecast, currentWeather, loading, favoriteCities, favoriteLoading, toggleFavoriteCity } = useWeatherStore();
  const [reviewActions, setReviewActions] = useState<Record<string, string>>({});

  const isFavorite = currentCity ? favoriteCities.some(c => c.id === currentCity.id) : false;
  const isLoading = currentCity ? favoriteLoading === currentCity.id : false;

  const handleToggleFavorite = async () => {
    if (!currentCity || isLoading) return;
    await toggleFavoriteCity(currentCity.id, currentCity.name);
  };

  const handleReviewAction = (date: string, action: string) => {
    setReviewActions(prev => ({ ...prev, [date]: action }));
  };

  const formatHour = (time: string) => {
    const date = new Date(time);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month}/${day} ${weekDays[date.getDay()]}`;
  };

  const getWeatherIcon = (weatherCode: string, size = 20) => {
    const code = weatherCode?.toLowerCase() || '';
    if (code.includes('rain') || code.includes('雨')) {
      return <CloudRain className={cn(`w-${size} h-${size}`, 'text-blue-400')} />;
    }
    return <CloudSun className={cn(`w-${size} h-${size}`, 'text-yellow-400')} />;
  };

  const hourlyData = hourlyForecast.slice(0, 24).map((item) => ({
    time: formatHour(item.time),
    温度: item.temperature,
    降水概率: Math.round(item.precipitation * 10),
    湿度: item.humidity,
    风速: item.windSpeed,
  }));

  const dailyData = dailyForecast.map((item) => ({
    date: formatDate(item.date),
    最高温: item.tempHigh,
    最低温: item.tempLow,
    降水概率: item.precipitationProbability,
    紫外线: item.uvIndex,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">天气预报</h1>
            <p className="text-slate-400 text-sm mt-1">
              {currentCity?.name} · {currentCity?.province}
            </p>
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ml-auto',
              isFavorite
                ? 'text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30'
                : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 border border-slate-600/30 hover:border-yellow-500/30',
              isLoading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />}
            {isFavorite ? '已关注' : '加关注'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card glow-blue p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ThermometerSun className="w-5 h-5 text-orange-400" />
            当前天气
          </h2>
          {loading.current ? (
            <div className="skeleton h-32 rounded-lg" />
          ) : currentWeather ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-5xl font-bold text-gradient">
                    {Math.round(currentWeather.temperature)}°
                  </span>
                  <p className="text-slate-400 text-sm mt-1">
                    体感 {Math.round(currentWeather.feelsLike)}°
                  </p>
                </div>
                {getWeatherIcon(currentWeather.weatherCode)}
              </div>
              <p className="text-white text-lg">{currentWeather.weather}</p>
            </div>
          ) : null}
        </div>

        <div className="glass-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sunrise className="w-5 h-5 text-yellow-400" />
            日出日落与生活指数
          </h2>
          {dailyForecast.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Sunrise className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">日出</p>
                  <p className="text-white font-medium">{dailyForecast[0]?.sunrise || '--'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Sunset className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">日落</p>
                  <p className="text-white font-medium">{dailyForecast[0]?.sunset || '--'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">紫外线</p>
                  <p className="text-white font-medium">{dailyForecast[0]?.uvIndex || 0} 级</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">湿度</p>
                  <p className="text-white font-medium">{currentWeather?.humidity || 0}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Wind className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">风速</p>
                  <p className="text-white font-medium">{currentWeather?.windSpeed || 0} km/h</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">能见度</p>
                  <p className="text-white font-medium">{currentWeather?.visibility || 0} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">气压</p>
                  <p className="text-white font-medium">{currentWeather?.pressure || 0} hPa</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-400/20 flex items-center justify-center">
                  <CloudRain className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">降水量</p>
                  <p className="text-white font-medium">{currentWeather?.precipitation || 0} mm</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="skeleton h-24 rounded-lg" />
          )}
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-blue-400" />
          24小时逐时预报
        </h2>
        {loading.hourly ? (
          <div className="skeleton h-80 rounded-lg" />
        ) : hourlyData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hourlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  label={{ value: '温度(°C)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  label={{ value: '降水概率(%)', angle: 90, position: 'insideRight', fill: '#94A3B8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#E2E8F0',
                  }}
                  labelStyle={{ color: '#60A5FA' }}
                />
                <Legend
                  wrapperStyle={{ color: '#94A3B8' }}
                />
                <Area
                  type="monotone"
                  dataKey="温度"
                  yAxisId="left"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  fill="url(#tempGradient)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#60A5FA' }}
                />
                <Bar
                  dataKey="降水概率"
                  yAxisId="right"
                  fill="#22D3EE"
                  opacity={0.6}
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12">暂无逐时预报数据</p>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-400" />
          15天趋势预报
        </h2>
        {loading.daily ? (
          <div className="skeleton h-80 rounded-lg" />
        ) : dailyData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="lowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  label={{ value: '温度(°C)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  label={{ value: '降水概率(%)', angle: 90, position: 'insideRight', fill: '#94A3B8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#E2E8F0',
                  }}
                  labelStyle={{ color: '#60A5FA' }}
                />
                <Legend wrapperStyle={{ color: '#94A3B8' }} />
                <Bar
                  dataKey="最高温"
                  yAxisId="left"
                  fill="url(#highGradient)"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="最低温"
                  yAxisId="left"
                  fill="url(#lowGradient)"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Line
                  type="monotone"
                  dataKey="降水概率"
                  yAxisId="right"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  dot={{ fill: '#22D3EE', r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12">暂无逐日预报数据</p>
        )}

        {dailyForecast.length > 0 && (
          <>
            <div className="mt-6 pt-5 border-t border-slate-700/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2.5 text-xs bg-slate-800/40 px-3 py-2.5 rounded-lg border border-slate-700/30">
                <Cpu className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-slate-400">算法模型</p>
                  <p className="text-white font-medium">融合加权 v{dailyForecast[0]?.algorithmParams?.modelVersion || '2.3.1'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-xs bg-slate-800/40 px-3 py-2.5 rounded-lg border border-slate-700/30">
                <Settings className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-slate-400">参数口径</p>
                  <p className="text-white font-medium">远期不确定性因子 1.00 ~ 1.30</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-xs bg-slate-800/40 px-3 py-2.5 rounded-lg border border-slate-700/30">
                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-slate-400">趋势可信度</p>
                  <p className="text-white font-medium">近3天 ≥ {dailyForecast[2]?.credibility || 70}%，远3天 ≥ {dailyForecast[14]?.credibility || 35}%</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {dailyForecast.slice(0, 15).map((day, index) => {
                const reviewConfig: Record<string, { dot: string; label: string; text: string; bg: string }> = {
                  normal: { dot: 'bg-emerald-500', label: '正常', text: 'text-emerald-400', bg: '' },
                  warning: { dot: 'bg-amber-500', label: '待复核', text: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
                  reviewed: { dot: 'bg-red-500', label: '人工标记', text: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
                };
                const review = day.reviewStatus ? reviewConfig[day.reviewStatus] : reviewConfig.normal;
                const reviewAction = reviewActions[day.date];
                return (
                  <div
                    key={index}
                    className={cn(
                      'p-3 rounded-xl border text-center hover:bg-slate-700/40 transition-colors relative',
                      review.bg || 'bg-slate-800/40 border-slate-700/30'
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-slate-400 text-xs">{formatDate(day.date)}</p>
                      <span className="flex items-center gap-1" title={review.label}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', review.dot)} />
                      </span>
                    </div>
                    <div className="my-1.5 flex justify-center">
                      {getWeatherIcon(day.dayWeather, 6)}
                    </div>
                    <p className="text-white text-xs mb-1">{day.dayWeather}</p>
                    <div className="flex justify-center gap-2 text-sm">
                      <span className="text-orange-400">{Math.round(day.tempHigh)}°</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-blue-400">{Math.round(day.tempLow)}°</span>
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-400 text-xs">{day.precipitationProbability}%</span>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-700/30 flex items-center justify-between text-[10px]">
                      <span className={cn(review.text)}>
                        {reviewAction ? (
                          <span className="flex items-center gap-0.5">
                            <UserCheck className="w-2.5 h-2.5" />
                            {reviewAction === 'confirmed' ? '已确认' : '已驳回'}
                          </span>
                        ) : review.label}
                      </span>
                      <span className="text-slate-500">
                        可信 <span className={cn('font-medium', (day.credibility || 0) >= 60 ? 'text-emerald-400' : 'text-amber-400')}>{day.credibility || '--'}%</span>
                      </span>
                    </div>
                    {day.anomalyNote && !reviewAction && (
                      <div className="mt-1.5 text-[10px] text-amber-400/90 bg-amber-500/10 rounded px-1.5 py-1 line-clamp-2" title={day.anomalyNote}>
                        <Info className="w-2.5 h-2.5 inline mr-0.5" />
                        {day.anomalyNote}
                      </div>
                    )}
                    {day.reviewStatus && day.reviewStatus !== 'normal' && !reviewAction && (
                      <div className="mt-1.5 flex gap-1">
                        <button
                          onClick={() => handleReviewAction(day.date, 'confirmed')}
                          className="flex-1 text-[10px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-0.5"
                        >
                          <UserCheck className="w-2.5 h-2.5" />
                          确认
                        </button>
                        <button
                          onClick={() => handleReviewAction(day.date, 'rejected')}
                          className="flex-1 text-[10px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-0.5"
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          驳回
                        </button>
                      </div>
                    )}
                    {reviewAction && (
                      <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 复查完成
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
