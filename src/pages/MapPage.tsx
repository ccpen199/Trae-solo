import { useState, useMemo } from 'react';
import {
  MapPin, Search,
  Briefcase, Bike, Bus, Footprints
} from 'lucide-react';
import { heatmapData, jobs } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { HeatmapData } from '../types';

const COMMUTE_RADIUS: Record<'walk' | 'bike' | 'bus', number> = {
  walk: 60,
  bike: 120,
  bus: 200,
};

const COMMUTE_COLORS: Record<'walk' | 'bike' | 'bus', string> = {
  walk: '#22c55e',
  bike: '#3b82f6',
  bus: '#f97316',
};

const MapPage = () => {
  const { setCommutePreference } = useApp();
  const [commuteType, setCommuteType] = useState<'walk' | 'bike' | 'bus'>('walk');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedRegionIndex, setSelectedRegionIndex] = useState<number | null>(null);
  const [searchLocation, setSearchLocation] = useState('');

  const commuteOptions = [
    { id: 'walk' as const, label: '步行', icon: Footprints, time: '15分钟', distance: '约1公里' },
    { id: 'bike' as const, label: '骑行', icon: Bike, time: '15分钟', distance: '约3公里' },
    { id: 'bus' as const, label: '公交', icon: Bus, time: '15分钟', distance: '约5公里' },
  ];

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 0.8) return 'bg-red-500';
    if (intensity >= 0.6) return 'bg-orange-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    if (intensity >= 0.2) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getIntensityOpacity = (intensity: number) => {
    return 0.3 + intensity * 0.7;
  };

  const sortedHeatmapData = useMemo(() => {
    return [...heatmapData].sort((a, b) => b.intensity - a.intensity);
  }, []);

  const selectedData: HeatmapData | null = selectedRegionIndex !== null
    ? sortedHeatmapData[selectedRegionIndex]
    : null;

  const nearbyJobs = useMemo(() => {
    if (!selectedData) return [];
    const regionName = selectedData.region;
    const filtered = jobs.filter(job => job.location.includes(regionName));
    return filtered;
  }, [selectedData]);

  const handleSetCommutePreference = () => {
    setCommutePreference(commuteType);
  };

  const currentRadius = COMMUTE_RADIUS[commuteType];
  const currentColor = COMMUTE_COLORS[commuteType];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">地图找岗</h1>
          <p className="text-gray-500">按通勤距离找工作，附近好岗一目了然</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索位置或地址..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
              />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 mb-3">通勤方式 · 15分钟圈</p>
              <div className="grid grid-cols-3 gap-2">
                {commuteOptions.map(option => {
                  const Icon = option.icon;
                  const isActive = commuteType === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setCommuteType(option.id)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        isActive
                          ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-1 ${isActive ? '' : 'text-gray-400'}`} />
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                        {option.distance}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">岗位热力图</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-500">热力图</span>
                  <div
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      showHeatmap ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                    onClick={() => setShowHeatmap(!showHeatmap)}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                        showHeatmap ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </label>
              </div>

              <div className="relative h-96 bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                <div className="absolute left-4 top-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-sm text-gray-600 z-20">
                  <MapPin className="w-4 h-4 inline mr-1 text-primary-500" />
                  我的位置
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="relative">
                    <div className="w-4 h-4 bg-primary-500 rounded-full border-2 border-white shadow-lg" />
                    <div className="absolute inset-0 w-4 h-4 bg-primary-500 rounded-full animate-ping" />
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div
                    className="absolute rounded-full border-2 transition-all duration-500"
                    style={{
                      width: `${COMMUTE_RADIUS.walk * 2}px`,
                      height: `${COMMUTE_RADIUS.walk * 2}px`,
                      left: `${-COMMUTE_RADIUS.walk}px`,
                      top: `${-COMMUTE_RADIUS.walk}px`,
                      borderColor: COMMUTE_COLORS.walk,
                      backgroundColor: commuteType === 'walk' ? `${COMMUTE_COLORS.walk}15` : 'transparent',
                      opacity: commuteType === 'walk' ? 1 : 0.4,
                    }}
                  />
                  <div
                    className="absolute rounded-full border-2 transition-all duration-500"
                    style={{
                      width: `${COMMUTE_RADIUS.bike * 2}px`,
                      height: `${COMMUTE_RADIUS.bike * 2}px`,
                      left: `${-COMMUTE_RADIUS.bike}px`,
                      top: `${-COMMUTE_RADIUS.bike}px`,
                      borderColor: COMMUTE_COLORS.bike,
                      backgroundColor: commuteType === 'bike' ? `${COMMUTE_COLORS.bike}15` : 'transparent',
                      opacity: commuteType === 'bike' ? 1 : 0.4,
                    }}
                  />
                  <div
                    className="absolute rounded-full border-2 transition-all duration-500"
                    style={{
                      width: `${COMMUTE_RADIUS.bus * 2}px`,
                      height: `${COMMUTE_RADIUS.bus * 2}px`,
                      left: `${-COMMUTE_RADIUS.bus}px`,
                      top: `${-COMMUTE_RADIUS.bus}px`,
                      borderColor: COMMUTE_COLORS.bus,
                      backgroundColor: commuteType === 'bus' ? `${COMMUTE_COLORS.bus}15` : 'transparent',
                      opacity: commuteType === 'bus' ? 1 : 0.4,
                    }}
                  />
                  <div
                    className="absolute rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500"
                    style={{
                      width: 'auto',
                      height: 'auto',
                      left: `${currentRadius}px`,
                      top: `${-currentRadius - 20}px`,
                      color: currentColor,
                      backgroundColor: 'white',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    {commuteOptions.find(o => o.id === commuteType)?.label} 15分钟
                  </div>
                </div>

                {showHeatmap && (
                  <div className="absolute inset-0 pointer-events-none">
                    {sortedHeatmapData.map((data, index) => {
                      const x = 50 + (data.lng - 121.45) * 800;
                      const y = 50 + (31.23 - data.lat) * 600;
                      const size = 30 + data.intensity * 50 + (currentRadius / 4);

                      return (
                        <div
                          key={index}
                          className={`absolute rounded-full cursor-pointer transition-all duration-300 hover:scale-110 ${getIntensityColor(data.intensity)}`}
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                            opacity: getIntensityOpacity(data.intensity) * 0.6,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'auto',
                            filter: 'blur(8px)',
                          }}
                          onClick={() => setSelectedRegionIndex(selectedRegionIndex === index ? null : index)}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="absolute inset-0">
                  {sortedHeatmapData.map((data, index) => (
                    <div
                      key={`marker-${index}`}
                      className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-10 ${
                        selectedRegionIndex === index ? 'scale-125 z-20' : ''
                      }`}
                      style={{
                        left: `${50 + (data.lng - 121.45) * 800}%`,
                        top: `${50 + (31.23 - data.lat) * 600}%`,
                      }}
                      onClick={() => setSelectedRegionIndex(selectedRegionIndex === index ? null : index)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${
                        selectedRegionIndex === index ? 'bg-primary-600 ring-4 ring-primary-200' : 'bg-white text-primary-600 border-2 border-primary-500'
                      }`}>
                        {data.jobCount}
                      </div>
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap bg-white/80 px-1.5 py-0.5 rounded">
                        {data.region}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 mb-2">通勤范围</p>
                  <div className="space-y-1.5">
                    {commuteOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <div key={option.id} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COMMUTE_COLORS[option.id] }}
                          />
                          <Icon className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600">{option.label} {option.distance}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 mb-2">岗位热度</p>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-blue-500" style={{ opacity: 0.4 }} />
                    <div className="w-4 h-4 rounded-full bg-green-500" style={{ opacity: 0.5 }} />
                    <div className="w-4 h-4 rounded-full bg-yellow-500" style={{ opacity: 0.6 }} />
                    <div className="w-4 h-4 rounded-full bg-orange-500" style={{ opacity: 0.7 }} />
                    <div className="w-4 h-4 rounded-full bg-red-500" style={{ opacity: 0.8 }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>低</span>
                    <span>高</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">
                  {selectedData ? `${selectedData.region}岗位` : '区域岗位分布'}
                </h3>
              </div>

              {selectedData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-primary-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-primary-600">{selectedData.jobCount}</p>
                      <p className="text-xs text-gray-500">在招岗位</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedData.seekerCount}</p>
                      <p className="text-xs text-gray-500">求职人数</p>
                    </div>
                  </div>

                  {nearbyJobs.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {nearbyJobs.map(job => (
                        <div
                          key={job.id}
                          className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-gray-800 text-sm">{job.title}</h4>
                            <span className="text-accent-600 font-semibold text-sm">{job.salary}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{job.companyName}</span>
                            {job.videoThumbnail && (
                              <span className="flex items-center gap-1 text-xs text-primary-500">
                                <Briefcase className="w-3 h-3" />
                                视频岗
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">该区域暂无匹配岗位</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">点击地图上的区域</p>
                  <p className="text-gray-400 text-xs">查看该区域的岗位信息</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">热门区域</h3>
              <div className="space-y-3">
                {sortedHeatmapData.slice(0, 6).map((data, index) => (
                  <div
                    key={data.region}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                      selectedRegionIndex === index ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedRegionIndex(selectedRegionIndex === index ? null : index)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{data.region}</p>
                        <p className="text-xs text-gray-500">{data.jobCount}个岗位 · 热度 {Math.round(data.intensity * 100)}%</p>
                      </div>
                    </div>
                    {index < 3 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                        热门
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-2">设置通勤范围</h3>
              <p className="text-sm text-white/80 mb-2">
                当前选择: {commuteOptions.find(o => o.id === commuteType)?.label} 15分钟
              </p>
              <p className="text-xs text-white/70 mb-4">
                将通勤偏好设置到个人偏好，获取更精准的岗位推荐
              </p>
              <button
                onClick={handleSetCommutePreference}
                className="w-full py-2.5 bg-white text-primary-600 font-medium rounded-xl hover:bg-white/90 transition-colors"
              >
                立即设置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
