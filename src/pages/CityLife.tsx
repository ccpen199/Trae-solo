import { useState } from 'react';
import {
  Bus, Train, MapPin, Search, Clock, ChevronRight, AlertTriangle,
  Stethoscope, Building2, Star, Calendar, Ticket, UserCheck,
  TrendingUp, BarChart3, Users, Eye, Plus, X, Heart,
  Share2, Navigation, Map as MapIcon, CheckCircle2, Minus, CircleDot,
  BookOpen, Dumbbell, Trophy, Landmark
} from 'lucide-react';
import { transitInfos, hospitalAppointments, venueInfos } from '../data/mock';
import type { TransitInfo, HospitalAppointment, VenueInfo } from '../types';

const venueTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  library: { icon: BookOpen, color: 'from-blue-500 to-indigo-600', label: '图书馆' },
  gym: { icon: Dumbbell, color: 'from-emerald-500 to-teal-600', label: '运动场馆' },
  museum: { icon: Landmark, color: 'from-amber-500 to-orange-600', label: '博物馆' },
  stadium: { icon: Trophy, color: 'from-rose-500 to-pink-600', label: '体育中心' },
  community: { icon: Users, color: 'from-purple-500 to-violet-600', label: '文化站' },
};


const transitStatusConfig: Record<string, { label: string; color: string; dot: string }> = {
  normal: { label: '运行正常', color: 'text-emerald-600 bg-emerald-50', dot: 'bg-emerald-500' },
  delay: { label: '轻微延误', color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-500 animate-pulse-slow' },
  suspended: { label: '暂停运行', color: 'text-red-600 bg-red-50', dot: 'bg-red-500' },
};

const tabs = [
  { key: 'transit', label: '公共交通', icon: Train, color: 'from-blue-500 to-indigo-600' },
  { key: 'hospital', label: '预约挂号', icon: Stethoscope, color: 'from-rose-500 to-pink-600' },
  { key: 'venue', label: '文体场馆', icon: Ticket, color: 'from-emerald-500 to-teal-600' },
];

export default function CityLife() {
  const [activeTab, setActiveTab] = useState<string>('transit');
  const [selectedVenueType, setSelectedVenueType] = useState<string>('all');
  const [selectedHospital, setSelectedHospital] = useState<string | null>(hospitalAppointments[0].id);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ hospitalId: string; timeIdx: number } | null>(null);

  const currentHospital = hospitalAppointments.find(h => h.id === selectedHospital);

  const filteredVenues = selectedVenueType === 'all'
    ? venueInfos
    : venueInfos.filter(v => v.type === selectedVenueType);

  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="rounded-3xl p-6 md:p-10 mb-8 relative overflow-hidden shadow-xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-40 right-10 w-[500px] h-[500px] bg-cyan-300 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-emerald-300 rounded-full blur-3xl" />
        </div>
        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm mb-4">
              <MapPin className="w-4 h-4" />
              服务 528 万厦门市民
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              城市生活圈 · 让城市更<span className="text-yellow-300">智慧</span>更美好
            </h2>
            <p className="text-white/80 leading-relaxed mb-6">
              实时公交地铁到站、全市三级医院号源池、文体场馆余量可视化，
              打通交通、医疗、文化、体育资源，让便民服务尽在掌握。
            </p>

            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索站点、医院、场馆名称…"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-gray-800 shadow-2xl focus:outline-none focus:ring-4 focus:ring-yellow-300/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '公交线路', val: '327条', color: 'bg-blue-400/30' },
              { label: '地铁线路', val: '5条', color: 'bg-emerald-400/30' },
              { label: '接入医院', val: '86家', color: 'bg-rose-400/30' },
              { label: '文体场馆', val: '342个', color: 'bg-amber-400/30' },
            ].map(s => (
              <div key={s.label} className={`p-4 md:p-5 rounded-2xl ${s.color} backdrop-blur-sm border border-white/20 text-center hover:scale-105 transition-transform cursor-pointer`}>
                <p className="text-2xl md:text-3xl font-bold">{s.val}</p>
                <p className="text-sm text-white/80 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl text-base font-semibold transition-all duration-300 ${
                  active
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-xl scale-[1.02]`
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? '' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === 'transit' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="gov-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-gov-600" />
                  实时到站信息
                </h3>
                <button className="text-sm text-gov-600 hover:text-gov-800 font-medium flex items-center gap-1">
                  <MapIcon className="w-4 h-4" />线路地图
                </button>
              </div>

              <div className="relative mb-5">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="输入站点名称查询实时信息…"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-gov-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-100"
                />
              </div>

              <div className="space-y-3">
                {transitInfos.map((item: TransitInfo) => {
                  const statusCfg = transitStatusConfig[item.status];
                  const isMetro = item.line.startsWith('地铁') || item.line.startsWith('BRT');
                  return (
                    <div
                      key={item.id}
                      className="group p-5 rounded-2xl border border-gray-100 hover:border-gov-200 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                            isMetro
                              ? 'bg-gradient-to-br from-sky-500 to-indigo-600'
                              : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          }`}>
                            {isMetro ? <Train className="w-7 h-7" /> : <Bus className="w-7 h-7" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                isMetro ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>{item.line}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color} border flex items-center gap-1`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />{statusCfg.label}
                              </span>
                            </div>
                            <p className="text-gray-700 font-medium mt-2 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-gray-400" />{item.station}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">方向：{item.direction}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-center">
                            <div className="inline-flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-gov-600">{item.nextArrival}</span>
                              <span className="text-sm text-gray-500">分钟</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">下一班</p>
                          </div>
                          <div className="w-px h-12 bg-gray-100" />
                          <div className="text-center">
                            <div className="inline-flex items-baseline gap-1">
                              <span className="text-xl font-semibold text-gray-600">{item.nextNextArrival}</span>
                              <span className="text-xs text-gray-400">分</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">第二班</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gov-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="gov-card p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                我的收藏站点
              </h3>
              <div className="space-y-2.5">
                {[
                  { name: '镇海路站', line: '地铁1号线', min: 3, dir: '往岩内' },
                  { name: '湖滨东路站', line: '地铁2/3号线', min: 5, dir: '换乘站' },
                  { name: '中山路站', line: '公交1/20路', min: 8, dir: '往火车站' },
                ].map((fav, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gov-50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gov-100 flex items-center justify-center text-gray-400 group-hover:text-gov-600 transition-colors">
                      <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{fav.name}</p>
                      <p className="text-xs text-gray-500 truncate">{fav.line} · {fav.dir}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gov-600">{fav.min}<span className="text-xs ml-0.5">分</span></p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 gov-btn-secondary">
                <Plus className="w-4 h-4" />添加站点
              </button>
            </div>

            <div className="gov-card p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gov-600" />
                今日出行数据
              </h3>
              <div className="space-y-4">
                {[
                  { name: '地铁客运量', val: '128.6万人次', pct: 82, color: 'bg-sky-500' },
                  { name: '公交客运量', val: '96.3万人次', pct: 68, color: 'bg-emerald-500' },
                  { name: 'BRT客运量', val: '35.8万人次', pct: 56, color: 'bg-amber-500' },
                ].map(s => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-600">{s.name}</span>
                      <span className="font-semibold text-gray-800">{s.val}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hospital' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="gov-card p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索医院名称、科室、医生…"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-gov-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-100"
                />
              </div>
            </div>

            <div className="space-y-3">
              {hospitalAppointments.map((h: HospitalAppointment) => {
                const active = selectedHospital === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => { setSelectedHospital(h.id); setSelectedTimeSlot(null); }}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-300 shadow-md'
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-gray-900">{h.hospital}</h3>
                          <span className="gov-badge bg-rose-50 text-rose-700 border border-rose-200">{h.level}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium text-gray-800">{h.department}</span> · {h.doctor} <span className="text-gray-400">({h.title})</span>
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />{h.date}
                          </span>
                          <span className="flex items-center gap-1 text-rose-600 font-medium">
                            <Ticket className="w-3.5 h-3.5" />¥{h.fee}
                          </span>
                        </div>
                      </div>
                      <div className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold ${
                        active ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {h.timeSlots.filter(t => t.available > 0).length}个时段
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            {currentHospital && (
              <div className="gov-card p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{currentHospital.hospital}</h3>
                      <span className="gov-badge bg-rose-50 text-rose-700 border border-rose-200">{currentHospital.level}</span>
                      <span className="flex items-center gap-1 text-amber-500 text-sm font-medium">
                        <Star className="w-4 h-4 fill-amber-400" />4.9 (12,583评价)
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />思明区上古路10号</span>
                      <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{currentHospital.department}</span>
                      <span className="flex items-center gap-1"><UserCheck className="w-4 h-4" />{currentHospital.doctor} {currentHospital.title}</span>
                    </div>
                  </div>
                  <button className="gov-btn-primary self-start">
                    <Eye className="w-4 h-4" />查看医院详情
                  </button>
                </div>

                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  选择就诊时段
                  <span className="ml-2 text-sm font-normal text-gray-400">{currentHospital.date}</span>
                </h4>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                  {currentHospital.timeSlots.map((slot, idx) => {
                    const isFull = slot.available === 0;
                    const ratio = (slot.available / slot.total) * 100;
                    const active = selectedTimeSlot?.hospitalId === currentHospital.id && selectedTimeSlot?.timeIdx === idx;
                    return (
                      <button
                        key={idx}
                        disabled={isFull}
                        onClick={() => setSelectedTimeSlot({ hospitalId: currentHospital.id, timeIdx: idx })}
                        className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                          isFull
                            ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                            : active
                            ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-400 shadow-md'
                            : 'bg-white border-gray-100 hover:border-rose-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className={`font-bold ${isFull ? 'text-gray-400' : active ? 'text-rose-700' : 'text-gray-800'}`}>
                            {slot.time}
                          </p>
                          {isFull ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">已约满</span>
                          ) : ratio > 50 ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />号源充足
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-slow" />即将约满
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${ratio > 50 ? 'bg-emerald-500' : ratio > 0 ? 'bg-amber-500' : 'bg-gray-300'}`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${isFull ? 'text-gray-400' : 'text-gray-600'}`}>
                            {slot.available}/{slot.total}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedTimeSlot && currentHospital.timeSlots[selectedTimeSlot.timeIdx].available > 0 && (
                  <div className="animate-fade-in rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-white to-rose-50/40 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <p className="font-bold text-gray-900">已选择就诊时段</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {currentHospital.date} {currentHospital.timeSlots[selectedTimeSlot.timeIdx].time}
                          </span>
                          <span className="w-px h-4 bg-gray-200 hidden sm:block" />
                          <span className="flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-gray-400" />
                            {currentHospital.department} · {currentHospital.doctor}
                          </span>
                          <span className="w-px h-4 bg-gray-200 hidden sm:block" />
                          <span className="font-bold text-rose-600 text-lg">¥{currentHospital.fee}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button className="gov-btn-secondary !px-5">
                          <Share2 className="w-4 h-4" />分享
                        </button>
                        <button className="gov-btn-primary !bg-gradient-to-r !from-rose-500 !to-pink-600 !hover:from-rose-400 !hover:to-pink-500 !px-6 shadow-lg shadow-rose-500/30">
                          <Ticket className="w-4 h-4" />确认挂号
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'venue' && (
        <div>
          <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedVenueType('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedVenueType === 'all'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >全部类型</button>
              {Object.entries(venueTypeConfig).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedVenueType(key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedVenueType === key
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />{cfg.label}
                  </button>
                );
              })}
            </div>
            <button className="gov-btn-secondary !py-2 !px-4 text-sm">
              <MapIcon className="w-4 h-4" />地图视图
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVenues.map((venue: VenueInfo) => {
              const cfg = venueTypeConfig[venue.type] || venueTypeConfig.community;
              const Icon = cfg.icon;
              const usage = Math.round((venue.currentUsage / venue.capacity) * 100);
              const usageColor = usage >= 85 ? 'from-rose-500 to-red-600' : usage >= 60 ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-600';
              return (
                <div key={venue.id} className="gov-card overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
                  <div className={`h-40 bg-gradient-to-br ${cfg.color} relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                    </div>
                    <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                      <div className="flex items-start justify-between">
                        <div className={`w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-medium">
                          {cfg.label}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold leading-tight drop-shadow-sm">{venue.name}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4 line-clamp-1">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      {venue.address}
                    </p>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">当前在馆</span>
                        <span className={`font-bold bg-gradient-to-r ${usageColor} bg-clip-text text-transparent`}>
                          {usage}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${usageColor} rounded-full transition-all duration-700`}
                          style={{ width: `${usage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <span><span className="font-semibold text-gray-600">{venue.currentUsage.toLocaleString()}</span> / {venue.capacity.toLocaleString()} 人</span>
                        {usage >= 85 ? (
                          <span className="text-rose-600 flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />人流较大
                          </span>
                        ) : usage >= 60 ? (
                          <span className="text-amber-600 flex items-center gap-1 font-medium">
                            <CircleDot className="w-3.5 h-3.5" />适中
                          </span>
                        ) : (
                          <span className="text-emerald-600 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />余位充足
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />今日 {venue.todayOpening}
                      </span>
                      <button className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-sm flex items-center gap-1.5 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                        <Ticket className="w-4 h-4" />
                        立即预约
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
