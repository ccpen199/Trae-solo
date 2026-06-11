import { useState, useEffect } from 'react';
import { useWeatherStore } from '../stores/weatherStore';
import {
  MapPin,
  Star,
  Plus,
  X,
  Search,
  Trash2,
  CloudSun,
  CloudRain,
  Sun,
  Cloud,
} from 'lucide-react';
import { citiesApi, weatherApi } from '../api';
import type { City, CurrentWeather } from '../../shared/types';
import { cn } from '../lib/utils';

const hotCities: City[] = [
  { id: '110000', name: '北京', province: '北京市', country: '中国', latitude: 39.9042, longitude: 116.4074, adcode: '110000' },
  { id: '310000', name: '上海', province: '上海市', country: '中国', latitude: 31.2304, longitude: 121.4737, adcode: '310000' },
  { id: '440100', name: '广州', province: '广东省', country: '中国', latitude: 23.1291, longitude: 113.2644, adcode: '440100' },
  { id: '440300', name: '深圳', province: '广东省', country: '中国', latitude: 22.5431, longitude: 114.0579, adcode: '440300' },
  { id: '330100', name: '杭州', province: '浙江省', country: '中国', latitude: 30.2741, longitude: 120.1551, adcode: '330100' },
  { id: '320100', name: '南京', province: '江苏省', country: '中国', latitude: 32.0603, longitude: 118.7969, adcode: '320100' },
  { id: '510100', name: '成都', province: '四川省', country: '中国', latitude: 30.5728, longitude: 104.0668, adcode: '510100' },
  { id: '420100', name: '武汉', province: '湖北省', country: '中国', latitude: 30.5928, longitude: 114.3055, adcode: '420100' },
  { id: '610100', name: '西安', province: '陕西省', country: '中国', latitude: 34.3416, longitude: 108.9398, adcode: '610100' },
  { id: '500000', name: '重庆', province: '重庆市', country: '中国', latitude: 29.4316, longitude: 106.9123, adcode: '500000' },
  { id: '120000', name: '天津', province: '天津市', country: '中国', latitude: 39.0842, longitude: 117.2009, adcode: '120000' },
  { id: '370100', name: '济南', province: '山东省', country: '中国', latitude: 36.6512, longitude: 117.1201, adcode: '370100' },
];

interface CityWeather {
  [key: string]: CurrentWeather;
}

export default function Cities() {
  const {
    favoriteCities,
    currentCity,
    setCurrentCity,
    fetchAllWeatherData,
    fetchFavoriteCities,
    addFavoriteCity,
    removeFavoriteCity,
    loading,
  } = useWeatherStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cityWeathers, setCityWeathers] = useState<CityWeather>({});
  const [weatherLoading, setWeatherLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFavoriteCities();
  }, [fetchFavoriteCities]);

  useEffect(() => {
    const loadWeathers = async () => {
      const weathers: CityWeather = {};
      for (const city of favoriteCities) {
        try {
          const weather = await weatherApi.getCurrent(city.id);
          weathers[city.id] = weather;
        } catch (e) {
          console.error(`加载 ${city.name} 天气失败`, e);
        }
      }
      setCityWeathers(weathers);
    };
    if (favoriteCities.length > 0) {
      loadWeathers();
    }
  }, [favoriteCities]);

  useEffect(() => {
    if (searchKeyword.trim()) {
      setSearchLoading(true);
      citiesApi
        .search(searchKeyword)
        .then((data) => {
          setSearchResults(data);
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    } else {
      setSearchResults([]);
    }
  }, [searchKeyword]);

  const handleSelectCity = async (city: City) => {
    setCurrentCity(city);
    fetchAllWeatherData(city.id);
  };

  const handleAddFavorite = async (city: City) => {
    try {
      await addFavoriteCity(city.id);
    } catch (e) {
      console.error('添加关注失败', e);
    }
  };

  const handleRemoveFavorite = async (cityId: string) => {
    try {
      await removeFavoriteCity(cityId);
    } catch (e) {
      console.error('取消关注失败', e);
    }
  };

  const isFavorite = (cityId: string) => favoriteCities.some((c) => c.id === cityId);

  const isCurrentCity = (cityId: string) => currentCity?.id === cityId;

  const getWeatherIcon = (weatherCode?: string) => {
    const code = weatherCode?.toLowerCase() || '';
    if (code.includes('rain') || code.includes('雨')) {
      return <CloudRain className="w-8 h-8 text-blue-400" />;
    }
    if (code.includes('sunny') || code.includes('晴')) {
      return <Sun className="w-8 h-8 text-yellow-400" />;
    }
    if (code.includes('cloud') || code.includes('云')) {
      return <Cloud className="w-8 h-8 text-slate-400" />;
    }
    return <CloudSun className="w-8 h-8 text-yellow-400" />;
  };

  const CityCard = ({
    city,
    weather,
    showActions = true,
  }: {
    city: City;
    weather?: CurrentWeather;
    showActions?: boolean;
  }) => {
    const current = isCurrentCity(city.id);
    const fav = isFavorite(city.id);

    return (
      <div
        className={cn(
          'glass-card p-5 cursor-pointer transition-all hover:scale-[1.02] relative overflow-hidden group',
          current && 'ring-2 ring-blue-500/50 glow-blue'
        )}
        onClick={() => handleSelectCity(city)}
      >
        {current && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 bg-blue-500/30 text-blue-400 text-xs rounded-full">
              当前
            </span>
          </div>
        )}

        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-semibold text-lg">{city.name}</h3>
            </div>
            <p className="text-slate-500 text-xs mt-0.5 ml-6">
              {city.province}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            {weather ? (
              <>
                <p className="text-4xl font-bold text-gradient">
                  {Math.round(weather.temperature)}°
                </p>
                <p className="text-slate-400 text-sm mt-1">{weather.weather}</p>
              </>
            ) : (
              <div className="skeleton w-20 h-10 rounded-lg" />
            )}
          </div>
          {weather ? (
            getWeatherIcon(weather.weatherCode)
          ) : (
            <div className="skeleton w-8 h-8 rounded-lg" />
          )}
        </div>

        {weather && (
          <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between text-xs text-slate-400">
            <span>体感 {Math.round(weather.feelsLike)}°</span>
            <span>湿度 {weather.humidity}%</span>
          </div>
        )}

        {showActions && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {fav ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFavorite(city.id);
                }}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="取消关注"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddFavorite(city);
                }}
                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                title="添加关注"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">城市管理</h1>
        <p className="text-slate-400 text-sm mt-1">管理你关注的城市，查看多个城市天气</p>
      </div>

      <div className="mb-8">
        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索城市名称..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {searchKeyword && (
          <div className="mt-4">
            {searchLoading ? (
              <div className="skeleton h-12 rounded-lg max-w-lg" />
            ) : searchResults.length > 0 ? (
              <div className="glass-card max-w-lg overflow-hidden">
                {searchResults.map((city) => (
                  <div
                    key={city.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors cursor-pointer border-b border-slate-700/30 last:border-b-0"
                    onClick={() => handleSelectCity(city)}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-white text-sm">{city.name}</p>
                        <p className="text-slate-500 text-xs">
                          {city.province} · {city.country}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isFavorite(city.id)) {
                          handleRemoveFavorite(city.id);
                        } else {
                          handleAddFavorite(city);
                        }
                      }}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        isFavorite(city.id)
                          ? 'text-yellow-500 bg-yellow-500/10'
                          : 'text-slate-500 hover:text-yellow-500 hover:bg-yellow-500/10'
                      )}
                    >
                      <Star
                        className={cn(
                          'w-4 h-4',
                          isFavorite(city.id) && 'fill-current'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-4">未找到匹配的城市</p>
            )}
          </div>
        )}
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-white">我的关注</h2>
          <span className="text-slate-500 text-sm">({favoriteCities.length})</span>
        </div>

        {loading.favorites ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-40 rounded-xl" />
            ))}
          </div>
        ) : favoriteCities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favoriteCities.map((city) => (
              <CityCard
                key={city.id}
                city={city}
                weather={cityWeathers[city.id]}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">暂无关注城市</p>
            <p className="text-slate-500 text-sm mt-1">
              搜索或从热门城市中添加你关注的城市
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">热门城市</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {hotCities.map((city) => (
            <button
              key={city.id}
              onClick={() => handleSelectCity(city)}
              className={cn(
                'glass-card p-4 text-center transition-all hover:scale-[1.05] hover:bg-slate-700/40',
                isCurrentCity(city.id) && 'ring-2 ring-blue-500/50'
              )}
            >
              <p className="text-white font-medium">{city.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">{city.province}</p>
              {isFavorite(city.id) && (
                <div className="mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current mx-auto" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
