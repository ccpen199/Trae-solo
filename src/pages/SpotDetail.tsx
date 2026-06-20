import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import FishingHeatmap from '@/components/charts/FishingHeatmap';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  AlertTriangle,
  Fish,
  Anchor,
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  Sunrise,
  Sunset,
  Moon,
  Star,
  ChevronRight,
  Sparkles,
  Waves,
  Mountain,
  TreePine,
  Clock,
  Zap,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Obstacle, FishSpecies, HabitType } from '@/types';

const obstacleIcons: Record<string, any> = {
  rock: Mountain,
  tree: TreePine,
  weed: Waves,
  island: Anchor,
  platform: Anchor,
  other: AlertTriangle,
};

const obstacleRiskMap: Record<string, 'high' | 'medium' | 'low'> = {
  rock: 'high',
  tree: 'high',
  weed: 'medium',
  island: 'low',
  platform: 'low',
  other: 'medium',
};

const difficultyProgressMap: Record<string, number> = {
  easy: 33,
  medium: 66,
  hard: 100,
};

const habitColorMap: Record<HabitType, string> = {
  temperature: 'bg-orange-500/10 text-orange-400',
  oxygen: 'bg-blue-500/10 text-blue-400',
  nocturnal: 'bg-purple-500/10 text-purple-400',
  phototaxis: 'bg-yellow-500/10 text-yellow-400',
  pressure: 'bg-green-500/10 text-green-400',
  tide: 'bg-cyan-500/10 text-cyan-400',
};

export default function SpotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    theme,
    spots,
    species,
    methods,
    selectedSpecies,
    selectedMethod,
    setSelectedSpecies,
    setSelectedMethod,
    currentIndex,
    heatmapData,
    currentEnvironment,
  } = useAppStore();

  const spot = spots.find(s => s.id === id);

  if (!spot) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle size={64} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">钓点不存在</h2>
        <p className="text-moonlight-400 mb-6">找不到您请求的钓点信息</p>
        <button
          onClick={() => navigate('/spots')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-lake-green-500 to-deep-sea-500 text-white font-medium"
        >
          返回钓点列表
        </button>
      </div>
    );
  }

  const spotSpecies = species.filter(s => spot.fishSpecies.includes(s.id));
  const recommendedMethods = methods.filter(m => m.suitableWater.includes(spot.waterType));

  const waterTypeColor: Record<string, string> = {
    lake: 'bg-emerald-500/20 text-emerald-400',
    river: 'bg-cyan-500/20 text-cyan-400',
    sea: 'bg-blue-500/20 text-blue-400',
    reservoir: 'bg-purple-500/20 text-purple-400',
    pond: 'bg-amber-500/20 text-amber-400',
  };

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'HH:mm');
  };

  const formatFixed = (val: number, digits = 1) => {
    if (typeof val !== 'number' || isNaN(val)) return '0';
    return val.toFixed(digits);
  };

  const methodTypeName: Record<string, string> = {
    tai: '台钓',
    lure: '路亚',
    sea: '海钓',
    blackpit: '黑坑',
  };

  const getRiskLabel = (risk: string) => {
    return risk === 'high' ? '高风险' : risk === 'medium' ? '中风险' : '低风险';
  };

  const getRiskClass = (risk: string) => {
    return risk === 'high'
      ? 'bg-red-500/20 text-red-400'
      : risk === 'medium'
      ? 'bg-yellow-500/20 text-yellow-400'
      : 'bg-blue-500/20 text-blue-400';
  };

  const getRiskBadgeClass = (risk: string) => {
    return risk === 'high'
      ? 'bg-red-500/10 text-red-400'
      : risk === 'medium'
      ? 'bg-yellow-500/10 text-yellow-400'
      : 'bg-blue-500/10 text-blue-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-moonlight-400 hover:text-lake-green-400 transition-colors"
      >
        <ArrowLeft size={18} />
        <span>返回</span>
      </button>

      <div className="relative h-64 rounded-3xl overflow-hidden">
        <img
          src={spot.images[0]}
          alt={spot.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-sea-900 via-deep-sea-900/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  waterTypeColor[spot.waterType] || 'bg-gray-500/20 text-gray-400'
                )}>
                  {spot.waterTypeName}
                </span>
                {spot.isCharged && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                    收费钓场
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">{spot.rating}</span>
                  <span className="text-xs text-moonlight-400">({spot.reviewCount})</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-2">{spot.name}</h1>
              <p className="text-moonlight-300 max-w-2xl">{spot.description}</p>
            </div>
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
              <Navigation size={16} className="text-lake-green-400" />
              <span className="text-sm">
                {spot.latitude.toFixed(4)}°N, {spot.longitude.toFixed(4)}°E
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn(
          'rounded-2xl p-6',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-lake-green-400" />
            地理信息
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-moonlight-400 mb-1">纬度</p>
                <p className="font-semibold">{spot.latitude.toFixed(6)}°</p>
              </div>
              <div>
                <p className="text-xs text-moonlight-400 mb-1">经度</p>
                <p className="font-semibold">{spot.longitude.toFixed(6)}°</p>
              </div>
              <div>
                <p className="text-xs text-moonlight-400 mb-1">水体类型</p>
                <p className="font-semibold">{spot.waterTypeName}</p>
              </div>
              <div>
                <p className="text-xs text-moonlight-400 mb-1">所在地区</p>
                <p className="font-semibold">{spot.province && spot.city ? `${spot.province} ${spot.city}` : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-moonlight-400 mb-1">平均水深</p>
                <p className="font-semibold">{spot.avgDepth} m</p>
              </div>
              <div>
                <p className="text-xs text-moonlight-400 mb-1">最大水深</p>
                <p className="font-semibold">{spot.maxDepth} m</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-moonlight-400 mb-2">难度等级</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-deep-sea-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lake-green-500 via-yellow-500 to-sunset-orange-500"
                    style={{ width: `${difficultyProgressMap[spot.difficulty]}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{spot.difficultyName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          'rounded-2xl p-6',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-sunset-orange-400" />
            障碍物标注 ({spot.obstacles.length})
          </h3>
          {spot.obstacles.length === 0 ? (
            <div className="text-center py-8 text-moonlight-400">
              <CheckCircle2 size={40} className="mx-auto mb-2 text-lake-green-400" />
              <p>该水域暂无明显障碍物</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {spot.obstacles.map((obs: Obstacle, idx: number) => {
                const Icon = obstacleIcons[obs.type] || AlertTriangle;
                const risk = obstacleRiskMap[obs.type] || 'medium';
                return (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-xl',
                      theme === 'dark' ? 'bg-deep-sea-800/50' : 'bg-moonlight-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        getRiskClass(risk)
                      )}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{obs.typeName}</p>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs',
                            getRiskBadgeClass(risk)
                          )}>
                            {getRiskLabel(risk)}
                          </span>
                        </div>
                        {obs.position && (
                          <p className="text-xs text-moonlight-400 mt-1">
                            位置: {obs.position.lat.toFixed(4)}°N, {obs.position.lng.toFixed(4)}°E
                          </p>
                        )}
                        {obs.description && (
                          <p className="text-xs text-moonlight-400 mt-1">{obs.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={cn(
          'rounded-2xl p-6',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gauge size={20} className="text-deep-sea-400" />
            实时环境因子
          </h3>
          {currentEnvironment ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-deep-sea-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge size={14} className="text-lake-green-400" />
                    <span className="text-xs text-moonlight-400">气压</span>
                  </div>
                  <p className="text-xl font-bold">{formatFixed(currentEnvironment.pressure, 0)} <span className="text-xs text-moonlight-400">hPa</span></p>
                </div>
                <div className="p-3 rounded-xl bg-deep-sea-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer size={14} className="text-sunset-orange-400" />
                    <span className="text-xs text-moonlight-400">水温</span>
                  </div>
                  <p className="text-xl font-bold">{formatFixed(currentEnvironment.waterTemp)} <span className="text-xs text-moonlight-400">°C</span></p>
                </div>
                <div className="p-3 rounded-xl bg-deep-sea-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets size={14} className="text-blue-400" />
                    <span className="text-xs text-moonlight-400">溶解氧</span>
                  </div>
                  <p className="text-xl font-bold">{formatFixed(currentEnvironment.dissolvedOxygen)} <span className="text-xs text-moonlight-400">mg/L</span></p>
                </div>
                <div className="p-3 rounded-xl bg-deep-sea-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind size={14} className="text-cyan-400" />
                    <span className="text-xs text-moonlight-400">风速</span>
                  </div>
                  <p className="text-xl font-bold">{formatFixed(currentEnvironment.windSpeed)} <span className="text-xs text-moonlight-400">m/s</span></p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-deep-sea-700/30">
                <div className="text-center">
                  <Sunrise size={16} className="mx-auto mb-1 text-yellow-400" />
                  <p className="text-xs text-moonlight-400">日出</p>
                  <p className="text-sm font-medium">{formatTime(currentEnvironment.sunrise)}</p>
                </div>
                <div className="text-center">
                  <Moon size={16} className="mx-auto mb-1 text-blue-300" />
                  <p className="text-xs text-moonlight-400">月相</p>
                  <p className="text-sm font-medium">{currentEnvironment.moonPhaseName}</p>
                </div>
                <div className="text-center">
                  <Sunset size={16} className="mx-auto mb-1 text-orange-400" />
                  <p className="text-xs text-moonlight-400">日落</p>
                  <p className="text-sm font-medium">{formatTime(currentEnvironment.sunset)}</p>
                </div>
              </div>
              {currentEnvironment.tideType && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-moonlight-400">当前潮汐</p>
                      <p className="font-semibold">{currentEnvironment.tideTypeName}</p>
                    </div>
                    {currentEnvironment.tideHeight !== undefined && (
                      <div className="text-right">
                        <p className="text-xs text-moonlight-400">潮高</p>
                        <p className="font-semibold">{currentEnvironment.tideHeight}m</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-moonlight-400">
              <Gauge size={40} className="mx-auto mb-2 opacity-50" />
              <p>正在加载环境数据...</p>
            </div>
          )}
        </div>
      </div>

      <div className={cn(
        'rounded-3xl p-8',
        theme === 'dark' ? 'bg-gradient-to-br from-deep-sea-900/80 via-deep-sea-800/50 to-deep-sea-900/80 border border-deep-sea-700/50' : 'bg-gradient-to-br from-moonlight-50 via-white to-moonlight-50 border border-moonlight-200'
      )}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
              <Sparkles size={24} className="text-lake-green-400" />
              四维钓鱼指数引擎
            </h2>
            <p className="text-moonlight-400">时间 × 钓点 × 钓法 × 鱼种，14天逐小时智能预测</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-moonlight-400 mb-2 block">目标鱼种</label>
              <select
                value={selectedSpecies?.id || ''}
                onChange={(e) => {
                  const s = species.find(x => x.id === e.target.value);
                  if (s) setSelectedSpecies(s);
                }}
                className={cn(
                  'min-w-36 px-4 py-2.5 rounded-xl border outline-none transition-all',
                  theme === 'dark'
                    ? 'bg-deep-sea-800/80 border-deep-sea-700 text-moonlight-100 focus:border-lake-green-500/50'
                    : 'bg-white border-moonlight-200 text-deep-sea-900 focus:border-lake-green-500/50'
                )}
              >
                {spotSpecies.map((s: FishSpecies) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-moonlight-400 mb-2 block">钓法</label>
              <select
                value={selectedMethod?.id || ''}
                onChange={(e) => {
                  const m = methods.find(x => x.id === e.target.value);
                  if (m) setSelectedMethod(m);
                }}
                className={cn(
                  'min-w-36 px-4 py-2.5 rounded-xl border outline-none transition-all',
                  theme === 'dark'
                    ? 'bg-deep-sea-800/80 border-deep-sea-700 text-moonlight-100 focus:border-lake-green-500/50'
                    : 'bg-white border-moonlight-200 text-deep-sea-900 focus:border-lake-green-500/50'
                )}
              >
                {recommendedMethods.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {currentIndex && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-lake-green-500/10 via-deep-sea-500/5 to-transparent border border-lake-green-500/20">
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="text-center lg:text-left">
                <p className="text-sm text-moonlight-400 mb-1">当前综合评分</p>
                <div className="flex items-baseline justify-center lg:justify-start gap-2">
                  <span className="text-7xl font-bold bg-gradient-to-r from-lake-green-400 to-deep-sea-400 bg-clip-text text-transparent">
                    {currentIndex.overallScore}
                  </span>
                  <span className="text-moonlight-400">/ 100</span>
                </div>
                <p className={cn(
                  'mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full',
                  currentIndex.level === 'excellent' ? 'bg-lake-green-500/20 text-lake-green-400' :
                  currentIndex.level === 'good' ? 'bg-deep-sea-500/20 text-deep-sea-400' :
                  currentIndex.level === 'fair' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-sunset-orange-500/20 text-sunset-orange-400'
                )}>
                  <Zap size={14} />
                  {currentIndex.levelName}
                </p>
              </div>
              <div className="h-px lg:h-20 lg:w-px bg-deep-sea-700/50 lg:bg-deep-sea-700" />
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {currentIndex.factors.slice(0, 4).map((factor, idx: number) => (
                  <div key={idx} className="text-center lg:text-left">
                    <p className="text-xs text-moonlight-400 mb-1">{factor.name}</p>
                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                      <div className="w-16 h-2 rounded-full bg-deep-sea-700 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full',
                            factor.score >= 75 ? 'bg-lake-green-500' :
                            factor.score >= 50 ? 'bg-yellow-500' : 'bg-sunset-orange-500'
                          )}
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{factor.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-deep-sea-700/30">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentIndex.factors.slice(4, 7).map((factor, idx: number) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-moonlight-400">{factor.name}</span>
                      <span className="text-xs font-medium">{factor.score}分</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-deep-sea-700 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full',
                          factor.score >= 75 ? 'bg-lake-green-500' :
                          factor.score >= 50 ? 'bg-yellow-500' : 'bg-sunset-orange-500'
                        )}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {currentIndex.suggestion && (
              <div className="mt-4 p-3 rounded-xl bg-deep-sea-800/30">
                <p className="text-sm text-moonlight-300">
                  <span className="font-medium text-lake-green-400">建议：</span>
                  {currentIndex.suggestion}
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Target size={18} className="text-lake-green-400" />
              14天 × 24小时 钓鱼指数热力图
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-gradient-to-r from-sunset-orange-500 via-yellow-500 to-lake-green-500" />
                <span className="text-moonlight-400">低 → 高</span>
              </div>
              <span className="text-moonlight-500">
                {format(new Date(), 'MM/dd')} - {format(new Date(Date.now() + 13 * 86400000), 'MM/dd')}
              </span>
            </div>
          </div>
          <FishingHeatmap data={heatmapData} height={420} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cn(
          'rounded-2xl p-6',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Fish size={20} className="text-lake-green-400" />
            目标鱼种 ({spotSpecies.length})
          </h3>
          <div className="space-y-3">
            {spotSpecies.map((s: FishSpecies) => (
              <div
                key={s.id}
                className={cn(
                  'p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]',
                  theme === 'dark' ? 'bg-deep-sea-800/50 hover:bg-deep-sea-800' : 'bg-moonlight-50 hover:bg-moonlight-100',
                  selectedSpecies?.id === s.id && 'ring-2 ring-lake-green-500/50'
                )}
                onClick={() => setSelectedSpecies(s)}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={s.image}
                    alt={s.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{s.name}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-lake-green-500/10 text-lake-green-400">
                        {s.scientificName}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {s.habits.map(h => (
                        <span
                          key={h.type}
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs',
                            habitColorMap[h.type] || 'bg-gray-500/10 text-gray-400'
                          )}
                        >
                          {h.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-moonlight-400">
                      <span>适宜水温: {s.optimalTemp[0]}-{s.optimalTemp[1]}°C</span>
                      <span>·</span>
                      <span>栖息水层: {s.optimalDepth[0]}-{s.optimalDepth[1]}m</span>
                    </div>
                    <p className="text-xs text-moonlight-400 mt-1">
                      觅食时段: {s.feedingTimes.join('、')}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-moonlight-500 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(
          'rounded-2xl p-6',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Anchor size={20} className="text-deep-sea-400" />
            推荐钓法
          </h3>
          <div className="space-y-3">
            {recommendedMethods.map(m => (
              <div
                key={m.id}
                className={cn(
                  'p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]',
                  theme === 'dark' ? 'bg-deep-sea-800/50 hover:bg-deep-sea-800' : 'bg-moonlight-50 hover:bg-moonlight-100',
                  selectedMethod?.id === m.id && 'ring-2 ring-deep-sea-500/50'
                )}
                onClick={() => setSelectedMethod(m)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    {m.name}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-deep-sea-500/10 text-deep-sea-400">
                      {methodTypeName[m.type] || m.type}
                    </span>
                  </h4>
                  <ChevronRight size={20} className="text-moonlight-500" />
                </div>
                <p className="text-sm text-moonlight-400 mb-3">{m.description}</p>
                <div>
                  <p className="text-xs text-moonlight-500 mb-2">核心装备:</p>
                  <div className="flex flex-wrap gap-2">
                    {m.equipment.slice(0, 5).map(eq => (
                      <span
                        key={eq}
                        className="px-2 py-1 rounded-lg text-xs bg-moonlight-700/20 text-moonlight-300"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {spot.rules && spot.rules.length > 0 && (
        <div className={cn(
          'rounded-2xl p-6',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-yellow-400" />
            钓场规则
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {spot.rules.map((rule: string, idx: number) => (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-xl flex items-start gap-3',
                  theme === 'dark' ? 'bg-deep-sea-800/30' : 'bg-moonlight-50'
                )}
              >
                <CheckCircle2 size={18} className="text-lake-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
