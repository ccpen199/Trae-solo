import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, ChevronRight, Fish, Droplets, Thermometer, Search, Filter, Navigation, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function Spots() {
  const navigate = useNavigate();
  const { spots, species, theme, setSelectedSpot } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  const filteredSpots = spots.filter(spot => {
    const matchesSearch = spot.name.includes(searchTerm) || spot.city.includes(searchTerm);
    const matchesType = filterType === 'all' || spot.waterType === filterType;
    return matchesSearch && matchesType;
  });
  
  const waterTypes = [
    { value: 'all', label: '全部' },
    { value: 'lake', label: '湖泊' },
    { value: 'river', label: '江河' },
    { value: 'sea', label: '海洋' },
    { value: 'reservoir', label: '水库' },
  ];
  
  const getFishName = (fishId: string) => {
    const fish = species.find(s => s.id === fishId);
    return fish?.name || fishId;
  };
  
  const handleCardClick = (spot: any) => {
    setSelectedSpot(spot);
    navigate(`/spots/${spot.id}`);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 搜索和筛选 */}
      <div className={cn(
        'rounded-2xl p-5',
        theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
      )}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-moonlight-400" />
            <input
              type="text"
              placeholder="搜索钓点名称或城市..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                'w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all',
                theme === 'dark'
                  ? 'bg-deep-sea-800/50 border-deep-sea-700 text-moonlight-100 placeholder-moonlight-500 focus:border-lake-green-500/50'
                  : 'bg-moonlight-50 border-moonlight-200 text-deep-sea-900 placeholder-moonlight-400 focus:border-lake-green-500/50'
              )}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <Filter size={18} className="text-moonlight-400 flex-shrink-0" />
            {waterTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                  filterType === type.value
                    ? 'bg-lake-green-500/20 text-lake-green-400'
                    : theme === 'dark'
                      ? 'text-moonlight-400 hover:bg-deep-sea-800'
                      : 'text-moonlight-600 hover:bg-moonlight-100'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 钓点列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpots.map((spot: any, index: number) => (
          <div
            key={spot.id}
            className={cn(
              'rounded-2xl overflow-hidden card-hover transition-all duration-300 cursor-pointer animate-slide-up flex flex-col',
              theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
            )}
            style={{ animationDelay: `${index * 80}ms` }}
            onClick={() => handleCardClick(spot)}
          >
            <div className="relative h-48 overflow-hidden flex-shrink-0">
              <img
                src={spot.images[0]}
                alt={spot.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
              <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  spot.waterType === 'sea' ? 'bg-blue-500/80 text-white' :
                  spot.waterType === 'lake' ? 'bg-emerald-500/80 text-white' :
                  spot.waterType === 'river' ? 'bg-cyan-500/80 text-white' :
                  'bg-purple-500/80 text-white'
                )}>
                  {spot.waterTypeName}
                </span>
                {spot.obstacles && spot.obstacles.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/80 text-white flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {spot.obstacles.length}处障碍
                  </span>
                )}
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium text-white">{spot.rating}</span>
              </div>
            </div>
            
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-lg font-semibold mb-2">{spot.name}</h3>
              <div className="flex items-center gap-2 text-sm text-moonlight-400 mb-3">
                <MapPin size={14} />
                <span className="truncate">{spot.city}</span>
              </div>
              
              {/* 坐标信息 */}
              <div className="flex items-center gap-1 text-xs text-moonlight-500 mb-3 px-2 py-1.5 rounded-lg bg-deep-sea-800/30">
                <Navigation size={12} className="text-lake-green-400" />
                <span>{spot.latitude.toFixed(3)}°N, {spot.longitude.toFixed(3)}°E</span>
                <span className="mx-1">·</span>
                <span>面积 {spot.area}km²</span>
              </div>
              
              {/* 鱼种信息 - 标签样式 */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {spot.targetSpecies.slice(0, 4).map((fishId: string) => {
                  const fishName = getFishName(fishId);
                  return (
                    <span
                      key={fishId}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1',
                        theme === 'dark' ? 'bg-lake-green-500/10 text-lake-green-400 border border-lake-green-500/20' : 'bg-lake-green-50 text-lake-green-600 border border-lake-green-200'
                      )}
                    >
                      <Fish size={10} />
                      {fishName}
                    </span>
                  );
                })}
                {spot.targetSpecies.length > 4 && (
                  <span className="px-2 py-0.5 rounded-md text-xs text-moonlight-400">
                    +{spot.targetSpecies.length - 4}
                  </span>
                )}
              </div>
              
              {/* 核心字段：水温、水深、溶氧、难度 */}
              <div className="grid grid-cols-4 gap-2 mb-4 pt-3 border-t border-deep-sea-700/30">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5 text-lake-green-400 mb-0.5">
                    <Thermometer size={13} />
                  </div>
                  <span className="text-xs font-semibold">{spot.waterTemp ?? 22}°C</span>
                  <p className="text-[10px] text-moonlight-500">水温</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5 text-deep-sea-400 mb-0.5">
                    <Droplets size={13} />
                  </div>
                  <span className="text-xs font-semibold">{spot.avgDepth}m</span>
                  <p className="text-[10px] text-moonlight-500">水深</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5 text-blue-400 mb-0.5">
                    <Droplets size={13} />
                  </div>
                  <span className="text-xs font-semibold">{spot.maxDepth}m</span>
                  <p className="text-[10px] text-moonlight-500">最深</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5 text-sunset-orange-400 mb-0.5">
                    <Star size={13} />
                  </div>
                  <span className="text-xs font-semibold">{spot.difficulty}/5</span>
                  <p className="text-[10px] text-moonlight-500">难度</p>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(spot);
                }}
                className="mt-auto w-full py-2.5 rounded-xl bg-gradient-to-r from-lake-green-500/20 to-deep-sea-500/20 text-lake-green-400 font-medium flex items-center justify-center gap-2 hover:from-lake-green-500/30 hover:to-deep-sea-500/30 transition-all"
              >
                查看详情
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
