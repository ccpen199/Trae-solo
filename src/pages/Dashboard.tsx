import { useAppStore } from '@/store/useAppStore';
import FishingHeatmap from '@/components/charts/FishingHeatmap';
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  MapPin,
  Fish,
  Anchor,
  Clock,
  Sunrise,
  Sunset,
  Moon,
  Zap,
  TrendingUp,
  Star,
  ChevronRight,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { format } from 'date-fns';

export default function Dashboard() {
  const {
    selectedSpot,
    selectedSpecies,
    selectedMethod,
    currentIndex,
    currentEnvironment,
    spots,
    species,
    methods,
    setSelectedSpot,
    setSelectedSpecies,
    setSelectedMethod,
    theme,
  } = useAppStore();
  
  const [showSpotPicker, setShowSpotPicker] = useState(false);
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  
  if (!currentIndex || !currentEnvironment || !selectedSpot || !selectedSpecies || !selectedMethod) {
    return <div className="flex items-center justify-center h-96">加载中...</div>;
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-lake-green-400';
    if (score >= 65) return 'text-deep-sea-400';
    if (score >= 45) return 'text-yellow-400';
    return 'text-sunset-orange-400';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-lake-green-500/20 to-lake-green-500/5';
    if (score >= 65) return 'from-deep-sea-500/20 to-deep-sea-500/5';
    if (score >= 45) return 'from-yellow-500/20 to-yellow-500/5';
    return 'from-sunset-orange-500/20 to-sunset-orange-500/5';
  };
  
  const getScoreRingColor = (score: number) => {
    if (score >= 80) return '#00d4aa';
    if (score >= 65) return '#0a84ff';
    if (score >= 45) return '#facc15';
    return '#ff6b35';
  };
  
  const scoreRingColor = getScoreRingColor(currentIndex.overallScore);
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部：指数总览 + 选择器 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 钓鱼指数大卡片 */}
        <div className={cn(
          'lg:col-span-1 rounded-2xl p-6 bg-gradient-to-br',
          getScoreBg(currentIndex.overallScore),
          theme === 'dark' ? 'border border-deep-sea-700/50' : 'border border-moonlight-200'
        )}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">今日钓鱼指数</h3>
            <span className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              currentIndex.level === 'excellent' ? 'bg-lake-green-500/20 text-lake-green-400' :
              currentIndex.level === 'good' ? 'bg-deep-sea-500/20 text-deep-sea-400' :
              currentIndex.level === 'fair' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-sunset-orange-500/20 text-sunset-orange-400'
            )}>
              {currentIndex.levelName}
            </span>
          </div>
          
          <div className="flex items-center justify-center py-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-moonlight-700/30"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke={scoreRingColor}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${currentIndex.overallScore * 5.02} 502`}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 8px ${scoreRingColor}40)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-5xl font-bold', getScoreColor(currentIndex.overallScore))}>
                  {currentIndex.overallScore}
                </span>
                <span className="text-sm text-moonlight-400 mt-1">综合评分</span>
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-moonlight-300 mt-2">
            {currentIndex.suggestion}
          </p>
          
          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-deep-sea-700/50">
            <div className="text-center">
              <p className="text-xs text-moonlight-400">推荐饵料</p>
              <p className="font-medium text-lake-green-400">{currentIndex.bestBait}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-moonlight-400">推荐水深</p>
              <p className="font-medium text-deep-sea-400">{currentIndex.bestDepth}</p>
            </div>
          </div>
        </div>
        
        {/* 选择器 + 环境数据 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 三维选择器 */}
          <div className={cn(
            'rounded-2xl p-5',
            theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
          )}>
            <h3 className="text-base font-semibold mb-4">垂钓条件设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 钓点选择 */}
              <div className="relative">
                <label className="text-xs text-moonlight-400 mb-2 block">选择钓点</label>
                <button
                  onClick={() => setShowSpotPicker(!showSpotPicker)}
                  className={cn(
                    'w-full p-3 rounded-xl flex items-center gap-3 transition-all',
                    theme === 'dark' 
                      ? 'bg-deep-sea-800/50 hover:bg-deep-sea-700/50 border border-deep-sea-700' 
                      : 'bg-moonlight-50 hover:bg-moonlight-100 border border-moonlight-200'
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-lake-green-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-lake-green-400" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm truncate">{selectedSpot.name}</p>
                    <p className="text-xs text-moonlight-400 truncate">{selectedSpot.city} · {selectedSpot.waterTypeName}</p>
                  </div>
                  <ChevronRight size={16} className="text-moonlight-400 flex-shrink-0" />
                </button>
                
                {showSpotPicker && (
                  <div className={cn(
                    'absolute top-full left-0 right-0 mt-2 z-10 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto',
                    theme === 'dark' ? 'bg-deep-sea-800 border border-deep-sea-700' : 'bg-white border border-moonlight-200'
                  )}>
                    {spots.map(spot => (
                      <button
                        key={spot.id}
                        onClick={() => {
                          setSelectedSpot(spot);
                          setShowSpotPicker(false);
                        }}
                        className={cn(
                          'w-full p-3 text-left flex items-center gap-3 transition-colors',
                          selectedSpot.id === spot.id ? 'bg-lake-green-500/10' : 'hover:bg-deep-sea-700/50'
                        )}
                      >
                        <MapPin size={16} className="text-lake-green-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{spot.name}</p>
                          <p className="text-xs text-moonlight-400">{spot.waterTypeName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 鱼种选择 */}
              <div className="relative">
                <label className="text-xs text-moonlight-400 mb-2 block">目标鱼种</label>
                <button
                  onClick={() => setShowSpeciesPicker(!showSpeciesPicker)}
                  className={cn(
                    'w-full p-3 rounded-xl flex items-center gap-3 transition-all',
                    theme === 'dark' 
                      ? 'bg-deep-sea-800/50 hover:bg-deep-sea-700/50 border border-deep-sea-700' 
                      : 'bg-moonlight-50 hover:bg-moonlight-100 border border-moonlight-200'
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-deep-sea-500/20 flex items-center justify-center flex-shrink-0">
                    <Fish size={18} className="text-deep-sea-400" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm truncate">{selectedSpecies.name}</p>
                    <p className="text-xs text-moonlight-400 truncate">难度 {selectedSpecies.difficulty}/100</p>
                  </div>
                  <ChevronRight size={16} className="text-moonlight-400 flex-shrink-0" />
                </button>
                
                {showSpeciesPicker && (
                  <div className={cn(
                    'absolute top-full left-0 right-0 mt-2 z-10 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto',
                    theme === 'dark' ? 'bg-deep-sea-800 border border-deep-sea-700' : 'bg-white border border-moonlight-200'
                  )}>
                    {species.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSpecies(s);
                          setShowSpeciesPicker(false);
                        }}
                        className={cn(
                          'w-full p-3 text-left flex items-center gap-3 transition-colors',
                          selectedSpecies.id === s.id ? 'bg-deep-sea-500/10' : 'hover:bg-deep-sea-700/50'
                        )}
                      >
                        <Fish size={16} className="text-deep-sea-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.name}</p>
                          <p className="text-xs text-moonlight-400">{s.aliases[0] || ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 钓法选择 */}
              <div className="relative">
                <label className="text-xs text-moonlight-400 mb-2 block">垂钓方式</label>
                <button
                  onClick={() => setShowMethodPicker(!showMethodPicker)}
                  className={cn(
                    'w-full p-3 rounded-xl flex items-center gap-3 transition-all',
                    theme === 'dark' 
                      ? 'bg-deep-sea-800/50 hover:bg-deep-sea-700/50 border border-deep-sea-700' 
                      : 'bg-moonlight-50 hover:bg-moonlight-100 border border-moonlight-200'
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-sunset-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Anchor size={18} className="text-sunset-orange-400" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm truncate">{selectedMethod.name}</p>
                    <p className="text-xs text-moonlight-400 truncate">{selectedMethod.type}</p>
                  </div>
                  <ChevronRight size={16} className="text-moonlight-400 flex-shrink-0" />
                </button>
                
                {showMethodPicker && (
                  <div className={cn(
                    'absolute top-full left-0 right-0 mt-2 z-10 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto',
                    theme === 'dark' ? 'bg-deep-sea-800 border border-deep-sea-700' : 'bg-white border border-moonlight-200'
                  )}>
                    {methods.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedMethod(m);
                          setShowMethodPicker(false);
                        }}
                        className={cn(
                          'w-full p-3 text-left flex items-center gap-3 transition-colors',
                          selectedMethod.id === m.id ? 'bg-sunset-orange-500/10' : 'hover:bg-deep-sea-700/50'
                        )}
                      >
                        <Anchor size={16} className="text-sunset-orange-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          <p className="text-xs text-moonlight-400">{m.description.slice(0, 20)}...</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 环境因子数据 */}
          <div className={cn(
            'rounded-2xl p-5',
            theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
          )}>
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Gauge size={18} className="text-lake-green-400" />
              实时环境数据
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EnvCard
                icon={<Thermometer size={20} />}
                label="气温"
                value={`${currentEnvironment.temperature}°C`}
                sub={`水温 ${currentEnvironment.waterTemp}°C`}
                color="text-orange-400"
                bgColor="bg-orange-500/10"
                theme={theme}
              />
              <EnvCard
                icon={<Droplets size={20} />}
                label="气压"
                value={`${currentEnvironment.pressure} hPa`}
                sub={currentEnvironment.pressureTrend === 'rising' ? '上升趋势 ↗' : currentEnvironment.pressureTrend === 'falling' ? '下降趋势 ↘' : '稳定 →'}
                color="text-blue-400"
                bgColor="bg-blue-500/10"
                theme={theme}
              />
              <EnvCard
                icon={<Wind size={20} />}
                label="风力"
                value={`${currentEnvironment.windSpeed} m/s`}
                sub={currentEnvironment.windDirectionName}
                color="text-cyan-400"
                bgColor="bg-cyan-500/10"
                theme={theme}
              />
              <EnvCard
                icon={<Zap size={20} />}
                label="溶解氧"
                value={`${currentEnvironment.dissolvedOxygen} mg/L`}
                sub={currentEnvironment.dissolvedOxygen >= 8 ? '溶氧充足' : currentEnvironment.dissolvedOxygen >= 5 ? '溶氧一般' : '溶氧偏低'}
                color="text-emerald-400"
                bgColor="bg-emerald-500/10"
                theme={theme}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-deep-sea-700/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Sunrise size={16} className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-moonlight-400">日出</p>
                  <p className="text-sm font-medium">{format(new Date(currentEnvironment.sunrise), 'HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Sunset size={16} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-moonlight-400">日落</p>
                  <p className="text-sm font-medium">{format(new Date(currentEnvironment.sunset), 'HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Moon size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-moonlight-400">月相</p>
                  <p className="text-sm font-medium">{currentEnvironment.moonPhaseName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 14天热力图 */}
      <div className={cn(
        'rounded-2xl p-5',
        theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Calendar size={18} className="text-lake-green-400" />
            14天钓鱼指数热力图
          </h3>
          <div className="flex items-center gap-2 text-xs text-moonlight-400">
            <span className="w-3 h-3 rounded-sm bg-blue-900"></span> 低
            <span className="w-3 h-3 rounded-sm bg-cyan-500"></span>
            <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
            <span className="w-3 h-3 rounded-sm bg-yellow-500"></span>
            <span className="w-3 h-3 rounded-sm bg-orange-500"></span> 高
          </div>
        </div>
        <FishingHeatmap />
      </div>
      
      {/* 指数因子详情 + 推荐钓点 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 因子详情 */}
        <div className={cn(
          'rounded-2xl p-5',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-lake-green-400" />
            指数构成分析
          </h3>
          <div className="space-y-4">
            {currentIndex.factors.map((factor, index) => (
              <div key={factor.key} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">{factor.name}</span>
                  <span className={cn('text-sm font-medium', getScoreColor(factor.score))}>
                    {factor.score}分
                  </span>
                </div>
                <div className="h-2 rounded-full bg-moonlight-700/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${factor.score}%`,
                      background: factor.score >= 70 ? 'linear-gradient(90deg, #00d4aa, #34d399)' :
                                 factor.score >= 50 ? 'linear-gradient(90deg, #0a84ff, #06b6d4)' :
                                 factor.score >= 30 ? 'linear-gradient(90deg, #facc15, #f97316)' :
                                 'linear-gradient(90deg, #ff6b35, #ef4444)',
                    }}
                  />
                </div>
                <p className="text-xs text-moonlight-400 mt-1">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* 推荐钓点 */}
        <div className={cn(
          'lg:col-span-2 rounded-2xl p-5',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-yellow-400" />
            推荐钓点
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spots.slice(0, 4).map((spot, index) => (
              <div
                key={spot.id}
                onClick={() => setSelectedSpot(spot)}
                className={cn(
                  'rounded-xl overflow-hidden cursor-pointer transition-all duration-300 card-hover',
                  theme === 'dark' ? 'bg-deep-sea-800/50' : 'bg-moonlight-50'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={spot.images[0]}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      spot.waterType === 'sea' ? 'bg-blue-500/80 text-white' :
                      spot.waterType === 'lake' ? 'bg-emerald-500/80 text-white' :
                      spot.waterType === 'river' ? 'bg-cyan-500/80 text-white' :
                      'bg-purple-500/80 text-white'
                    )}>
                      {spot.waterTypeName}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-white">{spot.rating}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-medium mb-1">{spot.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-moonlight-400">
                    <MapPin size={12} />
                    <span>{spot.city}</span>
                    <span>·</span>
                    <span>水深 {spot.avgDepth}m</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      spot.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      spot.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    )}>
                      {spot.difficultyName}
                    </span>
                    <button className="text-xs text-lake-green-400 font-medium flex items-center gap-1 hover:underline">
                      查看详情 <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface EnvCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
  bgColor: string;
  theme: string;
}

function EnvCard({ icon, label, value, sub, color, bgColor, theme }: EnvCardProps) {
  return (
    <div className={cn(
      'p-4 rounded-xl transition-all duration-300',
      theme === 'dark' ? 'bg-deep-sea-800/30 hover:bg-deep-sea-800/50' : 'bg-moonlight-50 hover:bg-moonlight-100'
    )}>
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bgColor)}>
          <span className={color}>{icon}</span>
        </div>
        <span className="text-xs text-moonlight-400">{label}</span>
      </div>
      <p className="text-xl font-bold mb-1">{value}</p>
      <p className="text-xs text-moonlight-400">{sub}</p>
    </div>
  );
}
