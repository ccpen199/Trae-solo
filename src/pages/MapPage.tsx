import { useState } from 'react';
import {
  MapPin, Filter, Search,
  Briefcase, Bike, Bus, ChevronRight, Footprints
} from 'lucide-react';
import { heatmapData, jobs } from '../data/mockData';

const MapPage = () => {
  const [commuteType, setCommuteType] = useState<'walk' | 'bike' | 'bus'>('walk');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [searchLocation, setSearchLocation] = useState('');

  const commuteOptions = [
    { id: 'walk', label: '步行', icon: Footprints, time: '15分钟', distance: '约1公里' },
    { id: 'bike', label: '骑行', icon: Bike, time: '15分钟', distance: '约3公里' },
    { id: 'bus', label: '公交', icon: Bus, time: '15分钟', distance: '约5公里' },
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

  const selectedData = selectedRegion !== null ? heatmapData[selectedRegion] : null;
  const nearbyJobs = selectedData ? jobs.slice(0, 3) : [];

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
                      onClick={() => setCommuteType(option.id as typeof commuteType)}
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

              <div className="relative h-96 bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
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

                <div className="absolute left-4 top-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-sm text-gray-600">
                  <MapPin className="w-4 h-4 inline mr-1 text-primary-500" />
                  我的位置
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-4 h-4 bg-primary-500 rounded-full border-2 border-white shadow-lg" />
                    <div className="absolute inset-0 w-4 h-4 bg-primary-500 rounded-full animate-ping" />
                  </div>
                </div>

                {showHeatmap && (
                  <div className="absolute inset-0 pointer-events-none">
                    {heatmapData.map((data, index) => {
                      const x = 50 + (data.lng - 121.45) * 800;
                      const y = 50 + (31.23 - data.lat) * 600;
                      const size = 40 + data.intensity * 60;

                      return (
                        <div
                          key={index}
                          className={`absolute rounded-full cursor-pointer transition-all hover:scale-110 heatmap-cell ${getIntensityColor(data.intensity)}`}
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
                          onClick={() => setSelectedRegion(index)}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="absolute inset-0 pointer-events-none">
                  {heatmapData.map((data, index) => (
                    <div
                      key={`marker-${index}`}
                      className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                        selectedRegion === index ? 'scale-125 z-10' : ''
                      }`}
                      style={{
                        left: `${50 + (data.lng - 121.45) * 800}%`,
                        top: `${50 + (31.23 - data.lat) * 600}%`,
                        pointerEvents: 'auto',
                      }}
                      onClick={() => setSelectedRegion(selectedRegion === index ? null : index)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${
                        selectedRegion === index ? 'bg-primary-600 ring-4 ring-primary-200' : 'bg-white text-primary-600 border-2 border-primary-500'
                      }`}>
                        {data.jobCount}
                      </div>
                    </div>
                  ))}
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
                  {selectedData ? '该区域岗位' : '区域岗位分布'}
                </h3>
                <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
                  筛选
                  <Filter className="w-4 h-4" />
                </button>
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

                  <div className="space-y-3">
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

                  <button className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1">
                    查看更多
                    <ChevronRight className="w-4 h-4" />
                  </button>
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
                {[
                  { name: '静安区', jobs: 156, seekers: 2340, hot: true },
                  { name: '浦东新区', jobs: 178, seekers: 2560, hot: true },
                  { name: '徐汇区', jobs: 124, seekers: 1890, hot: false },
                  { name: '长宁区', jobs: 89, seekers: 1450, hot: false },
                  { name: '黄浦区', jobs: 67, seekers: 1120, hot: false },
                ].map((region, index) => (
                  <div
                    key={region.name}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRegion(index < heatmapData.length ? index : null)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{region.name}</p>
                        <p className="text-xs text-gray-500">{region.jobs}个岗位</p>
                      </div>
                    </div>
                    {region.hot && (
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
              <p className="text-sm text-white/80 mb-4">
                自定义通勤时间和方式，精准找到合适的工作
              </p>
              <button className="w-full py-2.5 bg-white text-primary-600 font-medium rounded-xl hover:bg-white/90 transition-colors">
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
