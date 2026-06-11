import { useState, useEffect } from 'react';
import { Search, X, MapPin, Star } from 'lucide-react';
import { citiesApi } from '../api';
import type { City } from '../../shared/types';
import { useWeatherStore } from '../stores/weatherStore';

interface CitySearchProps {
  onClose: () => void;
}

export default function CitySearch({ onClose }: CitySearchProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { 
    setCurrentCity, 
    fetchAllWeatherData, 
    favoriteCities, 
    favoriteLoading,
    fetchFavoriteCities, 
    toggleFavoriteCity,
    setToast,
  } = useWeatherStore();

  useEffect(() => {
    fetchFavoriteCities();
    citiesApi.getAll().then(setAllCities).catch(() => {});
  }, [fetchFavoriteCities]);

  useEffect(() => {
    if (keyword.trim()) {
      setSearchLoading(true);
      citiesApi.search(keyword).then((data) => {
        setResults(data);
        setSearchLoading(false);
      }).catch(() => setSearchLoading(false));
    } else {
      setResults([]);
    }
  }, [keyword]);

  const handleSelectCity = (city: City) => {
    const wasFavorite = favoriteCities.some(c => c.id === city.id);
    setCurrentCity(city);
    fetchAllWeatherData(city.id);
    onClose();
    
    if (!wasFavorite) {
      toggleFavoriteCity(city.id, city.name);
    } else {
      setToast({ message: `已切换到 ${city.name}（已关注）`, type: 'info' });
    }
  };

  const isFavorite = (cityId: string) => favoriteCities.some(c => c.id === cityId);
  const isCityLoading = (cityId: string) => favoriteLoading === cityId;

  const toggleFavorite = async (e: React.MouseEvent, city: City) => {
    e.stopPropagation();
    if (isCityLoading(city.id)) return;
    await toggleFavoriteCity(city.id, city.name);
  };

  const displayCities = keyword.trim() ? results : allCities;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索城市名称..."
          className="w-full pl-12 pr-12 py-3 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          autoFocus
        />
        <button
          onClick={onClose}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4">
        {!keyword && (
          <div className="mb-5">
            <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              我的关注 ({favoriteCities.length})
            </h3>
            {favoriteCities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {favoriteCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleSelectCity(city)}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-left transition-colors"
                  >
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <div>
                      <div className="text-white text-sm">{city.name}</div>
                      <div className="text-slate-500 text-xs">{city.province}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">暂无关注城市，点击下方城市卡片添加关注</p>
            )}
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            {keyword.trim() 
              ? (searchLoading ? '搜索中...' : `搜索结果 (${results.length})`) 
              : `全部城市 (${allCities.length})`}
          </h3>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {displayCities.map((city) => (
              <button
                key={city.id}
                onClick={() => handleSelectCity(city)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/60 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <div className="text-left">
                    <div className="text-white text-sm">{city.name}</div>
                    <div className="text-slate-500 text-xs">{city.province} · {city.country}</div>
                  </div>
                </div>
                <span
                  onClick={(e) => toggleFavorite(e, city)}
                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium ${
                    isFavorite(city.id)
                      ? 'text-yellow-500 bg-yellow-500/10 border border-yellow-500/30'
                      : 'text-slate-500 hover:text-yellow-500 hover:bg-yellow-500/10 border border-slate-600/30 hover:border-yellow-500/30'
                  } ${isCityLoading(city.id) && 'opacity-60 cursor-not-allowed'}`}
                  title={isFavorite(city.id) ? '取消关注' : '添加关注'}
                  role="button"
                  aria-disabled={isCityLoading(city.id)}
                >
                  <Star className={`w-4 h-4 ${isFavorite(city.id) ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">{isFavorite(city.id) ? '已关注' : '加关注'}</span>
                </span>
              </button>
            ))}
            {keyword.trim() && results.length === 0 && !searchLoading && (
              <p className="text-slate-500 text-sm text-center py-4">未找到匹配的城市</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
