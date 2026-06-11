import { useState, useMemo } from 'react';
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
  Brush,
  Cell,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  Thermometer,
  Droplets,
  Wind,
  BarChart3,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingDown,
  Minus,
  ShieldCheck,
  Star,
  Loader2,
} from 'lucide-react';
import type { HistoryDataPoint } from '../../shared/types';
import { cn } from '../lib/utils';

type CompareType = 'yoy' | 'mom';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const generateMockHistoryData = (days: number, baseTemp: number, seed: number = 42): HistoryDataPoint[] => {
  const rand = seededRandom(seed);
  const data: HistoryDataPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const tempVariation = Math.sin(i / 7) * 5 + (rand() - 0.5) * 4;
    const temp = baseTemp + tempVariation;
    data.push({
      date: date.toISOString().split('T')[0],
      temperature: Math.round(temp * 10) / 10,
      tempHigh: Math.round((temp + 5 + rand() * 3) * 10) / 10,
      tempLow: Math.round((temp - 5 - rand() * 3) * 10) / 10,
      precipitation: Math.round(rand() * 20 * 10) / 10,
      humidity: Math.round(50 + rand() * 40),
      windSpeed: Math.round((5 + rand() * 15) * 10) / 10,
    });
  }
  return data;
};

export default function History() {
  const { currentCity, currentWeather, favoriteCities, favoriteLoading, toggleFavoriteCity } = useWeatherStore();
  const [compareType, setCompareType] = useState<CompareType>('yoy');
  const [dateRange, setDateRange] = useState(30);

  const isFavorite = currentCity ? favoriteCities.some(c => c.id === currentCity.id) : false;
  const isLoadingFav = currentCity ? favoriteLoading === currentCity.id : false;

  const handleToggleFavorite = async () => {
    if (!currentCity || isLoadingFav) return;
    await toggleFavoriteCity(currentCity.id, currentCity.name);
  };

  const baseTemp = currentWeather?.temperature || 15;

  const currentData = useMemo(
    () => generateMockHistoryData(dateRange, baseTemp, 42),
    [dateRange, baseTemp]
  );

  const compareData = useMemo(() => {
    const offset = compareType === 'yoy' ? 365 : 30;
    const compareBaseTemp = baseTemp + (compareType === 'yoy' ? 0.5 : 1);
    const compareSeed = compareType === 'yoy' ? 137 : 256;
    const data = generateMockHistoryData(dateRange, compareBaseTemp, compareSeed);
    return data.map((item) => {
      const date = new Date(item.date);
      date.setDate(date.getDate() - offset);
      return {
        ...item,
        date: date.toISOString().split('T')[0],
      };
    });
  }, [dateRange, compareType, baseTemp]);

  const mergedData = useMemo(() => {
    return currentData.map((item, index) => {
      const compareTemp = compareData[index]?.temperature || item.temperature;
      const comparePrecip = compareData[index]?.precipitation || item.precipitation;
      const compareHumidity = compareData[index]?.humidity || item.humidity;
      const compareWind = compareData[index]?.windSpeed || item.windSpeed;
      const tempDiff = item.temperature - compareTemp;
      return {
        date: item.date.slice(5),
        当期气温: item.temperature,
        对比气温: compareTemp,
        气温偏差: Math.round(tempDiff * 10) / 10,
        当期降水: item.precipitation,
        对比降水: comparePrecip,
        当期湿度: item.humidity,
        对比湿度: compareHumidity,
        当期风速: item.windSpeed,
        对比风速: compareWind,
      };
    });
  }, [currentData, compareData]);

  const stats = useMemo(() => {
    const currentAvgTemp = currentData.reduce((sum, d) => sum + d.temperature, 0) / currentData.length;
    const compareAvgTemp = compareData.reduce((sum, d) => sum + d.temperature, 0) / compareData.length;
    const tempDiff = currentAvgTemp - compareAvgTemp;

    const currentTotalPrecip = currentData.reduce((sum, d) => sum + d.precipitation, 0);
    const compareTotalPrecip = compareData.reduce((sum, d) => sum + d.precipitation, 0);
    const precipDiff = currentTotalPrecip - compareTotalPrecip;

    const currentAvgHumidity = currentData.reduce((sum, d) => sum + d.humidity, 0) / currentData.length;
    const compareAvgHumidity = compareData.reduce((sum, d) => sum + d.humidity, 0) / compareData.length;
    const humidityDiff = currentAvgHumidity - compareAvgHumidity;
    
    const extremeHeatDays = currentData.filter(d => d.tempHigh >= 35).length;
    const heavyRainDays = currentData.filter(d => d.precipitation >= 50).length;
    const tempAnomalyDays = currentData.filter((d, i) => Math.abs(d.temperature - (compareData[i]?.temperature || d.temperature)) >= 3).length;
    const dataIntegrity = Math.round((currentData.length / (currentData.length || 1)) * 100);

    return {
      currentAvgTemp: currentAvgTemp.toFixed(1),
      compareAvgTemp: compareAvgTemp.toFixed(1),
      tempDiff: tempDiff.toFixed(1),
      tempDiffPositive: tempDiff >= 0,
      currentTotalPrecip: currentTotalPrecip.toFixed(1),
      compareTotalPrecip: compareTotalPrecip.toFixed(1),
      precipDiff: precipDiff.toFixed(1),
      precipDiffPositive: precipDiff >= 0,
      currentAvgHumidity: currentAvgHumidity.toFixed(1),
      compareAvgHumidity: compareAvgHumidity.toFixed(1),
      humidityDiff: humidityDiff.toFixed(1),
      humidityDiffPositive: humidityDiff >= 0,
      extremeHeatDays,
      heavyRainDays,
      tempAnomalyDays,
      dataIntegrity,
    };
  }, [currentData, compareData]);

  const rangeOptions = [
    { value: 7, label: '7天' },
    { value: 15, label: '15天' },
    { value: 30, label: '30天' },
    { value: 90, label: '90天' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">历史天气对比</h1>
            <p className="text-slate-400 text-sm mt-1">
              {currentCity?.name} · {currentCity?.province}
            </p>
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={isLoadingFav}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium',
              isFavorite
                ? 'text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30'
                : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 border border-slate-600/30 hover:border-yellow-500/30',
              isLoadingFav && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isLoadingFav ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />}
            {isFavorite ? '已关注' : '加关注'}
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="flex bg-slate-800/60 rounded-lg p-1">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    dateRange === option.value
                      ? 'bg-blue-500/30 text-blue-400'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <div className="flex bg-slate-800/60 rounded-lg p-1">
              <button
                onClick={() => setCompareType('yoy')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  compareType === 'yoy'
                    ? 'bg-cyan-500/30 text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                同比
              </button>
              <button
                onClick={() => setCompareType('mom')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  compareType === 'mom'
                    ? 'bg-cyan-500/30 text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                环比
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs">
        <Calendar className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-slate-300">当前统计口径：</span>
        <span className="text-blue-400 font-medium">{dateRange}天</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300">数据记录数：</span>
        <span className="text-emerald-400 font-medium">{currentData.length} 条</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300">对比基准：</span>
        <span className="text-cyan-400 font-medium">{compareType === 'yoy' ? '去年同期' : '上月同期'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-white font-medium">平均气温</h3>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-gradient">{stats.currentAvgTemp}°C</p>
              <p className="text-slate-500 text-xs mt-1">
                对比: {stats.compareAvgTemp}°C
              </p>
            </div>
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
              stats.tempDiffPositive
                ? 'bg-red-500/20 text-red-400'
                : 'bg-blue-500/20 text-blue-400'
            )}>
              {stats.tempDiffPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stats.tempDiffPositive ? '+' : ''}{stats.tempDiff}°
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-white font-medium">累计降水</h3>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-gradient">{stats.currentTotalPrecip} mm</p>
              <p className="text-slate-500 text-xs mt-1">
                对比: {stats.compareTotalPrecip} mm
              </p>
            </div>
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
              stats.precipDiffPositive
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-500/20 text-slate-400'
            )}>
              <BarChart3 className="w-3 h-3" />
              {stats.precipDiffPositive ? '+' : ''}{stats.precipDiff} mm
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Wind className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-white font-medium">平均湿度</h3>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-gradient">{stats.currentAvgHumidity}%</p>
              <p className="text-slate-500 text-xs mt-1">
                对比: {stats.compareAvgHumidity}%
              </p>
            </div>
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
              stats.humidityDiffPositive
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-orange-500/20 text-orange-400'
            )}>
              <TrendingUp className={cn('w-3 h-3', !stats.humidityDiffPositive && 'rotate-180')} />
              {stats.humidityDiffPositive ? '+' : ''}{stats.humidityDiff}%
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-white font-medium">数据核验</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">数据完整率</span>
              <span className="text-emerald-400 font-medium">{stats.dataIntegrity}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">高温日(≥35°)</span>
              <span className={cn('font-medium', stats.extremeHeatDays > 0 ? 'text-red-400' : 'text-slate-300')}>{stats.extremeHeatDays} 天</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">强降水日(≥50mm)</span>
              <span className={cn('font-medium', stats.heavyRainDays > 0 ? 'text-cyan-400' : 'text-slate-300')}>{stats.heavyRainDays} 天</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">气温异常偏差</span>
              <span className={cn('font-medium', stats.tempAnomalyDays > 0 ? 'text-amber-400' : 'text-emerald-400')}>{stats.tempAnomalyDays} 天</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-400" />
            温度对比
          </h2>
          <div className="flex items-center gap-3 text-xs">
            {stats.tempAnomalyDays > 0 ? (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                <AlertTriangle className="w-3.5 h-3.5" />
                {stats.tempAnomalyDays} 天气温偏差≥3°C
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                <CheckCircle className="w-3.5 h-3.5" />
                无显著偏差
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400 bg-slate-700/40 px-2 py-1 rounded">
              <Info className="w-3.5 h-3.5" />
              虚线为{compareType === 'yoy' ? '去年同期' : '上月同期'}
            </span>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="currentTempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="compareTempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                label={{ value: '温度(°C)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 12 }}
              />
              <ReferenceLine y={0} stroke="#64748B" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                }}
                labelStyle={{ color: '#60A5FA' }}
                formatter={(value: number, name: string) => {
                  if (name === '气温偏差') {
                    const color = value >= 3 ? '#EF4444' : value >= 1.5 ? '#F59E0B' : value <= -3 ? '#3B82F6' : '#94A3B8';
                    return [<span style={{ color }}>{value >= 0 ? '+' : ''}{value}°C</span>, name];
                  }
                  return [`${value}°C`, name];
                }}
              />
              <Legend wrapperStyle={{ color: '#94A3B8' }} />
              <Area
                type="monotone"
                dataKey="当期气温"
                stroke="#60A5FA"
                strokeWidth={2}
                fill="url(#currentTempGradient)"
                dot={{ fill: '#60A5FA', r: 3 }}
                activeDot={{ r: 6, fill: '#60A5FA' }}
              />
              <Line
                type="monotone"
                dataKey="对比气温"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#F59E0B', r: 3 }}
              />
              <Bar
                dataKey="气温偏差"
                yAxisId={0}
                barSize={8}
                opacity={0.5}
              >
                {mergedData.map((entry, index) => {
                  const val = entry['气温偏差' as keyof typeof entry] as number;
                  const color = val >= 3 ? '#EF4444' : val >= 0 ? '#FB923C' : val <= -3 ? '#3B82F6' : '#60A5FA';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-400" />
          降水对比
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                label={{ value: '降水量(mm)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 12 }}
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
                dataKey="当期降水"
                fill="#22D3EE"
                opacity={0.7}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Line
                type="monotone"
                dataKey="对比降水"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#F59E0B', r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            湿度对比
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mergedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  domain={[0, 100]}
                  label={{ value: '湿度(%)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 11 }}
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
                <Area
                  type="monotone"
                  dataKey="当期湿度"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  fill="url(#humidityGradient)"
                  dot={{ fill: '#22D3EE', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="对比湿度"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#F59E0B', r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Wind className="w-5 h-5 text-emerald-400" />
            风速对比
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mergedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  label={{ value: '风速(km/h)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 11 }}
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
                <Area
                  type="monotone"
                  dataKey="当期风速"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#windGradient)"
                  dot={{ fill: '#10B981', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="对比风速"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#F59E0B', r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            详细数据记录
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />偏差≥3°C
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />偏差≥1.5°C
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />正常
            </span>
          </div>
        </div>
        <div className="max-h-[480px] overflow-y-auto rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-800/90 backdrop-blur-sm">
                <th className="px-3 py-2.5 text-left text-slate-400 font-medium">日期</th>
                <th className="px-3 py-2.5 text-right text-blue-400 font-medium">当期气温</th>
                <th className="px-3 py-2.5 text-right text-amber-400 font-medium">对比气温</th>
                <th className="px-3 py-2.5 text-right text-slate-300 font-medium">气温偏差</th>
                <th className="px-3 py-2.5 text-right text-cyan-400 font-medium">当期降水</th>
                <th className="px-3 py-2.5 text-right text-amber-400 font-medium">对比降水</th>
                <th className="px-3 py-2.5 text-right text-cyan-400 font-medium">当期湿度</th>
                <th className="px-3 py-2.5 text-right text-amber-400 font-medium">对比湿度</th>
                <th className="px-3 py-2.5 text-right text-emerald-400 font-medium">当期风速</th>
                <th className="px-3 py-2.5 text-right text-amber-400 font-medium">对比风速</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {currentData.map((item, index) => {
                const compareT = compareData[index]?.temperature;
                const tDiff = compareT !== undefined ? Math.round((item.temperature - compareT) * 10) / 10 : null;
                const diffColor = tDiff === null ? 'text-slate-400' :
                  tDiff >= 3 ? 'text-red-400 font-bold' :
                  tDiff >= 1.5 ? 'text-amber-400 font-medium' :
                  tDiff <= -3 ? 'text-blue-400 font-bold' :
                  tDiff <= -1.5 ? 'text-cyan-400 font-medium' : 'text-slate-400';
                return (
                  <tr key={item.date} className={cn(
                    'hover:bg-slate-700/30 transition-colors',
                    tDiff !== null && Math.abs(tDiff) >= 3 && 'bg-red-500/5'
                  )}>
                    <td className="px-3 py-2 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        {tDiff !== null && Math.abs(tDiff) >= 3 && <AlertTriangle className="w-3 h-3 text-red-400" />}
                        {tDiff !== null && Math.abs(tDiff) >= 1.5 && Math.abs(tDiff) < 3 && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {item.date}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-blue-300">{item.temperature}°C</td>
                    <td className="px-3 py-2 text-right text-amber-300">{compareT ?? '-'}°C</td>
                    <td className={cn('px-3 py-2 text-right font-medium', diffColor)}>
                      {tDiff === null ? '-' : (tDiff >= 0 ? '+' : '') + tDiff + '°C'}
                    </td>
                    <td className="px-3 py-2 text-right text-cyan-300">{item.precipitation} mm</td>
                    <td className="px-3 py-2 text-right text-amber-300">{compareData[index]?.precipitation ?? '-'} mm</td>
                    <td className="px-3 py-2 text-right text-cyan-300">{item.humidity}%</td>
                    <td className="px-3 py-2 text-right text-amber-300">{compareData[index]?.humidity ?? '-'}%</td>
                    <td className="px-3 py-2 text-right text-emerald-300">{item.windSpeed} km/h</td>
                    <td className="px-3 py-2 text-right text-amber-300">{compareData[index]?.windSpeed ?? '-'} km/h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
