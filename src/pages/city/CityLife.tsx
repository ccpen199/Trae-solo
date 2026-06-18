import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bus, Train, Hospital, Building2, ChevronRight, MapPin, Sun, Wind, Clock, Users, Calendar, Timer } from 'lucide-react';
import { useGet, useGetPaginated } from '../../hooks/useApi';
import Card from '../../components/Card';
import type { Hospital, Venue } from '../../../shared/types';
import { useState, useEffect } from 'react';

const tabs = [
  { path: 'transit', icon: Bus, label: '公交地铁', desc: '实时到站查询、线路规划', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-100', text: 'text-blue-600' },
  { path: 'hospitals', icon: Hospital, label: '预约挂号', desc: '医院号源池、在线预约', gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-100', text: 'text-rose-600' },
  { path: 'venues', icon: Building2, label: '文体场馆', desc: '场馆余量、活动预订', gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-100', text: 'text-violet-600' },
];

const busPreviewData = [
  { line: '1路', route: '火车站→轮渡', eta: 2, distance: 1.2, status: 'on-time' },
  { line: '950路', route: '理工学院→SM', eta: 5, distance: 3.1, status: 'delayed' },
  { line: 'BRT快1', route: '第一码头→厦门北站', eta: 1, distance: 0.6, status: 'on-time' },
  { line: '29路', route: '软件园→会展中心', eta: 8, distance: 4.5, status: 'scheduled' },
];

const departmentSlots = [
  { name: '内科', used: 23, total: 40 },
  { name: '外科', used: 35, total: 40 },
  { name: '儿科', used: 20, total: 20 },
  { name: '妇产科', used: 18, total: 30 },
];

export default function CityLife() {
  const location = useLocation();
  const isRoot = location.pathname === '/city';

  const [currentTime, setCurrentTime] = useState(new Date());
  const [busEta, setBusEta] = useState(busPreviewData);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const etaTimer = setInterval(() => {
      setBusEta(prev => prev.map(b => ({
        ...b,
        eta: Math.max(0, b.eta - (Math.random() > 0.6 ? 1 : 0)),
        distance: Math.max(0, +(b.distance - (Math.random() * 0.2)).toFixed(1)),
      })));
    }, 5000);
    return () => clearInterval(etaTimer);
  }, []);

  const { data: hospitalsData } = useGetPaginated<Hospital>(
    ['city-hospitals-desk'],
    '/city/health/hospitals?pageSize=10'
  );

  const { data: venuesData } = useGetPaginated<Venue>(
    ['city-venues-desk'],
    '/city/culture/venues?pageSize=20'
  );

  const { data: busData } = useGet<any>(
    ['city-bus-desk'],
    '/city/transport/bus?station=市政府站'
  );

  if (!isRoot) {
    return <Outlet />;
  }

  const hospitals = hospitalsData?.items ?? [];
  const venues = venuesData?.items ?? [];

  const totalDepartments = hospitals.reduce((sum, h) => sum + (h.departments?.length || 0), 0);
  const todayAvailableSlots = totalDepartments * 20 || 328;

  const totalCapacity = venues.reduce((sum, v) => sum + (v.capacity || 0), 0);
  const totalOccupancy = venues.reduce((sum, v) => sum + (v.currentOccupancy || 0), 0);
  const occupancyPct = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 58;
  const remainingSlots = totalCapacity - totalOccupancy || 1420;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'on-time': return '🟢';
      case 'delayed': return '🟡';
      default: return '⚪';
    }
  };

  const [serviceCount, setServiceCount] = useState(18234);
  useEffect(() => {
    const countTimer = setInterval(() => {
      setServiceCount(prev => prev + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(countTimer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <Card.Body>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">城市生活圈 · 厦门</h2>
                <p className="text-sm text-gray-500">公交地铁 · 预约挂号 · 文体场馆 · 一站直达</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">晴 28℃</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
                <Wind className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">优 AQI 32</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg">
                <Clock className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary tabular-nums">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Body className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">公交实时到站</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {busData?.arrivals?.length || 12}
                  <span className="text-lg font-normal text-gray-500 ml-1">条</span>
                </p>
                <p className="text-xs text-green-600 mt-1">最近一班 3 分钟后到站</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Bus className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">挂号号源池</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {todayAvailableSlots}
                  <span className="text-lg font-normal text-gray-500 ml-1">号</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{hospitals.length || 4} 家医院 · {totalDepartments || 10} 个科室</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">文体场馆余量</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {occupancyPct}
                  <span className="text-lg font-normal text-gray-500 ml-1">%</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">今日已预约 · 余量 {remainingSlots.toLocaleString()} 位</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">今日服务人次</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {serviceCount.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  实时更新中
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <Link key={tab.path} to={tab.path}>
            <Card hover className="h-full overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${tab.gradient}`} />
              <Card.Body className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${tab.bg} ${tab.text}`}>
                      <tab.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tab.label}</h3>
                      <p className="text-sm text-gray-500 mb-1">{tab.desc}</p>
                      <p className="text-xs text-gray-400">
                        {tab.path === 'transit' && `${busData?.arrivals?.length || 12}条线路实时运行 · 地铁3条线`}
                        {tab.path === 'hospitals' && `${hospitals.length || 4}家医院 · ${totalDepartments || 10}个科室 · 可预约`}
                        {tab.path === 'venues' && `${venues.length || 8}家场馆 · 今日活动进行中`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Card.Body>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">号源余量可视化</h3>
              <span className="text-xs text-gray-400">今日剩余号源</span>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              {departmentSlots.map((dept, idx) => {
                const pct = Math.round((dept.used / dept.total) * 100);
                const isFull = dept.used >= dept.total;
                const remaining = dept.total - dept.used;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700 w-16">{dept.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          isFull ? 'bg-red-100 text-red-600' : remaining <= dept.total * 0.2 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {isFull ? '已约满' : `余${remaining}号`}
                        </span>
                        <span className={`tabular-nums font-medium ${isFull ? 'text-red-600' : 'text-gray-900'}`}>
                          {dept.used}/{dept.total}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          isFull
                            ? 'bg-gradient-to-r from-red-400 to-red-500'
                            : 'bg-gradient-to-r from-primary to-orange-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">实时公交到站预览</h3>
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Timer className="w-3 h-3 animate-pulse" />
                实时刷新
              </span>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-gray-100">
              {busEta.map((bus, idx) => (
                <div
                  key={idx}
                  className="px-6 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-bold min-w-[50px] text-center">
                        {bus.line}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{bus.route}</p>
                        <p className="text-xs text-gray-400">距离 {bus.distance} km</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 tabular-nums">
                        下一班：<span className={`${bus.eta <= 2 ? 'text-green-600' : bus.eta <= 5 ? 'text-amber-600' : 'text-gray-600'}`}>{bus.eta}min</span>
                      </span>
                      <span className="text-lg">{getStatusDot(bus.status)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    </motion.div>
  );
}
