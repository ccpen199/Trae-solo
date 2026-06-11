import { useEffect, useState } from 'react';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import { useWeatherStore } from '../stores/weatherStore';
import WeatherCard from '../components/WeatherCard';
import MinutelyChart from '../components/MinutelyChart';
import LifeIndexGrid from '../components/LifeIndexGrid';
import HourlyStrip from '../components/HourlyStrip';
import { cn } from '../lib/utils';

function AlertBanner() {
  const { alerts, loading } = useWeatherStore();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visibleAlerts = alerts.filter((alert) => !dismissed.includes(alert.id));

  if (loading.alerts || visibleAlerts.length === 0) return null;

  const getAlertColor = (levelCode: number) => {
    if (levelCode >= 4) return { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-red-500/20' };
    if (levelCode >= 3) return { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', glow: 'shadow-orange-500/20' };
    if (levelCode >= 2) return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' };
    return { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', glow: 'shadow-blue-500/20' };
  };

  return (
    <div className="space-y-2 mb-6">
      {visibleAlerts.map((alert) => {
        const colors = getAlertColor(alert.levelCode);
        return (
          <div
            key={alert.id}
            className={cn(
              'relative overflow-hidden rounded-xl border backdrop-blur-sm p-4 transition-all',
              colors.bg,
              colors.border,
              `shadow-lg ${colors.glow}`
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
                <AlertTriangle className={cn('w-5 h-5', colors.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', colors.bg, colors.text, 'border', colors.border)}>
                    {alert.level}
                  </span>
                  <span className="text-sm font-medium text-white">{alert.title}</span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-2">{alert.content}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-slate-400">
                    发布时间: {new Date(alert.publishTime).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button className={cn('text-xs flex items-center gap-1 font-medium', colors.text, 'hover:underline')}>
                    查看详情 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setDismissed((prev) => [...prev, alert.id])}
                className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { 
    currentCity, 
    currentWeather, 
    minutelyPrecipitation, 
    hourlyForecast, 
    lifeIndices, 
    favoriteCities,
    loading, 
    fetchAllWeatherData,
    fetchFavoriteCities,
    toggleFavoriteCity,
    setToast,
  } = useWeatherStore();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    fetchFavoriteCities();
  }, [fetchFavoriteCities]);

  useEffect(() => {
    if (currentCity) {
      fetchAllWeatherData(currentCity.id);
      
      if (initialLoadDone) {
        const isAlreadyFavorite = favoriteCities.some(c => c.id === currentCity.id);
        if (!isAlreadyFavorite) {
          toggleFavoriteCity(currentCity.id, currentCity.name);
        } else {
          setToast({ message: `${currentCity.name} 已在关注列表中`, type: 'info' });
        }
      } else {
        setInitialLoadDone(true);
      }
    }
  }, [currentCity?.id]);

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <AlertBanner />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <WeatherCard
              data={currentWeather}
              loading={loading.current}
            />
          </div>
          <div className="lg:col-span-1">
            <MinutelyChart
              data={minutelyPrecipitation}
              loading={loading.minutely}
              className="h-full"
            />
          </div>
        </div>

        <div className="mb-6">
          <HourlyStrip
            data={hourlyForecast}
            loading={loading.hourly}
          />
        </div>

        <LifeIndexGrid
          data={lifeIndices}
          loading={loading.indices}
        />
      </div>
    </div>
  );
}
