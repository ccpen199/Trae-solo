import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin, Search, ChevronDown, Phone, Clock, Calendar,
  DoorOpen, Ticket, Shield, Briefcase, UserCog, Scale,
  LogOut, Move, ZoomIn, ZoomOut, RotateCcw, Users,
  CheckCircle2, Sparkles, X, ChevronRight, Building2,
  Eye, FileCheck, AlertCircle, XCircle, Handshake
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import api from '@/api/client';

const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const colors: Record<string, string> = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-gov-500',
  };
  const el = document.createElement('div');
  el.className = `fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${colors[type]} animate-fade-in-up`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 2500);
};

interface Outlet {
  id: string | number;
  name: string;
  address: string;
  phone: string;
  workTime: string;
  services: string[];
  queueData?: { name: string; count: number }[];
}

interface VRHotspot {
  id: string;
  name: string;
  icon: React.ElementType;
  desc: string;
  position: { x: number; y: number };
}

const staticOutlets: Outlet[] = [
  {
    id: 1,
    name: '市民中心人社服务大厅',
    address: '人民中路101号市民中心1-2层',
    phone: '0571-12333-01',
    workTime: '周一至周五 9:00-17:00\n周六 9:00-12:00',
    services: ['社保业务', '就业登记', '人才服务', '劳动仲裁', '社保卡服务', '政策咨询'],
    queueData: [
      { name: '社保窗口', count: 12 },
      { name: '就业窗口', count: 8 },
      { name: '人才窗口', count: 5 },
      { name: '仲裁窗口', count: 3 },
      { name: '综合窗口', count: 15 },
    ],
  },
  {
    id: 2,
    name: '高新区政务服务中心',
    address: '科技大道88号政务中心3楼',
    phone: '0571-12333-02',
    workTime: '周一至周五 9:00-17:30',
    services: ['社保业务', '就业登记', '人才服务', '社保卡服务'],
    queueData: [
      { name: '社保窗口', count: 6 },
      { name: '就业窗口', count: 4 },
      { name: '人才窗口', count: 7 },
      { name: '综合窗口', count: 9 },
    ],
  },
  {
    id: 3,
    name: '东区街道便民服务中心',
    address: '解放东路256号',
    phone: '0571-12333-03',
    workTime: '周一至周五 8:30-17:00',
    services: ['社保业务', '就业登记', '社保卡服务', '政策咨询'],
    queueData: [
      { name: '社保窗口', count: 2 },
      { name: '就业窗口', count: 1 },
      { name: '综合窗口', count: 4 },
    ],
  },
  {
    id: 4,
    name: '经开区综合服务中心',
    address: '开发大道999号',
    phone: '0571-12333-04',
    workTime: '周一至周五 9:00-17:00',
    services: ['社保业务', '就业登记', '人才服务', '劳动仲裁'],
    queueData: [
      { name: '社保窗口', count: 9 },
      { name: '就业窗口', count: 5 },
      { name: '人才窗口', count: 6 },
      { name: '仲裁窗口', count: 2 },
      { name: '综合窗口', count: 11 },
    ],
  },
  {
    id: 5,
    name: '西湖区政务服务站',
    address: '湖滨南路66号',
    phone: '0571-12333-05',
    workTime: '周一至周五 9:00-17:00\n周日 9:00-15:00',
    services: ['社保业务', '社保卡服务', '政策咨询'],
    queueData: [
      { name: '社保窗口', count: 4 },
      { name: '综合窗口', count: 6 },
    ],
  },
];

const vrHotspots: VRHotspot[] = [
  { id: 'entrance', name: '入口', icon: DoorOpen, desc: '大门入口处，设有无障碍通道和安检区', position: { x: 10, y: 50 } },
  { id: 'ticket', name: '取号区', icon: Ticket, desc: '自助取号机，支持身份证/社保卡取号', position: { x: 25, y: 35 } },
  { id: 'social', name: '社保窗口', icon: Shield, desc: '1-6号窗口，办理参保、转移、待遇等业务', position: { x: 45, y: 20 } },
  { id: 'employ', name: '就业窗口', icon: Briefcase, desc: '7-10号窗口，办理失业登记、就业援助', position: { x: 60, y: 70 } },
  { id: 'talent', name: '人才窗口', icon: UserCog, desc: '11-13号窗口，职称评审、人才引进服务', position: { x: 75, y: 30 } },
  { id: 'arbitrate', name: '仲裁窗口', icon: Scale, desc: '14-15号窗口，劳动仲裁申请受理', position: { x: 85, y: 65 } },
  { id: 'exit', name: '出口', icon: LogOut, desc: '出口通道，旁边设有评价器', position: { x: 92, y: 50 } },
];

const queueBarColors = ['#165DFF', '#10B981', '#E6A23C', '#8B5CF6', '#F97316', '#06B6D4'];

export default function OutletsVRPage() {
  const [outlets, setOutlets] = useState<Outlet[]>(staticOutlets);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet>(staticOutlets[0]);
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeHotspot, setActiveHotspot] = useState<VRHotspot>(vrHotspots[0]);
  const [vrConfig, setVrConfig] = useState<any>(null);
  const [queueUpdatedAt, setQueueUpdatedAt] = useState('2分钟前');
  const [appointments, setAppointments] = useState([
    { id: 1, outlet: '市民中心人社服务大厅', business: '失业登记', date: '2026-06-12 09:30', status: '待办理', statusType: 'warning' },
    { id: 2, outlet: '高新区政务服务中心', business: '社保参保证明', date: '2026-05-20 14:00', status: '已完成', statusType: 'success' },
  ]);
  const [visitRecords] = useState([
    { id: 1, outlet: '市民中心人社服务大厅', business: '失业登记办理', date: '2026-05-28 14:32', window: '就业3号窗', status: '已办结' },
    { id: 2, outlet: '高新区政务服务中心', business: '社保查询', date: '2026-05-15 09:18', window: '社保2号窗', status: '已办结' },
  ]);
  const [appointmentLoading, setAppointmentLoading] = useState(false);

  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });

  const vrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const data = await api.get('/outlets');
        if (data && Array.isArray(data) && data.length > 0) {
          setOutlets(data);
          setSelectedOutlet(data[0]);
        }
      } catch {
        setOutlets(staticOutlets);
      }
    };
    fetchOutlets();
  }, []);

  useEffect(() => {
    const fetchVRConfig = async () => {
      if (!selectedOutlet?.id) return;
      try {
        const data = await api.get(`/outlets/${selectedOutlet.id}/vr`);
        if (data) {
          setVrConfig(data);
        }
      } catch {
        setVrConfig(null);
      }
    };
    fetchVRConfig();
  }, [selectedOutlet]);

  const filteredOutlets = outlets.filter((o) =>
    !searchText || o.name.includes(searchText) || o.address.includes(searchText)
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: rotation.x,
      rotY: rotation.y,
    };
  }, [rotation]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setRotation({
      x: Math.max(-20, Math.min(20, dragStart.current.rotX + dy * 0.15)),
      y: dragStart.current.rotY + dx * 0.2,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const resetVR = () => {
    setRotation({ x: 0, y: 0 });
    setScale(1);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setQueueUpdatedAt('刚刚');
      setTimeout(() => setQueueUpdatedAt('1分钟前'), 30000);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAppointment = () => {
    if (appointmentLoading) return;
    setAppointmentLoading(true);
    setTimeout(() => {
      const newAppt = {
        id: Date.now(),
        outlet: selectedOutlet?.name || '',
        business: '综合业务',
        date: new Date(Date.now() + 86400000).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
        status: '预约成功',
        statusType: 'success',
      };
      setAppointments((prev) => [newAppt, ...prev]);
      setAppointmentLoading(false);
      toast(`预约成功！${selectedOutlet?.name} · 明日 10:00`, 'success');
    }, 1000);
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center shadow-gov">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">服务网点 VR 实景导航</h1>
            <p className="text-sm text-gray-500">360°全景漫游 · 智能导览 · 预约办理</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <button
                onClick={() => setOutletDropdownOpen(!outletDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-gov-300 bg-gray-50/50 hover:bg-white transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gov-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4.5 h-4.5 text-gov-600" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs text-gray-400">当前选择网点</p>
                    <p className="font-semibold text-gray-800 truncate">{selectedOutlet?.name}</p>
                  </div>
                </div>
                <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform flex-shrink-0', outletDropdownOpen && 'rotate-180')} />
              </button>

              {outletDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-30 overflow-hidden max-h-80">
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="搜索网点名称或地址..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-64">
                    {filteredOutlets.map((outlet) => (
                      <button
                        key={outlet.id}
                        onClick={() => {
                          setSelectedOutlet(outlet);
                          setOutletDropdownOpen(false);
                          setActiveHotspot(vrHotspots[0]);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-3 hover:bg-gov-50 transition-colors border-b border-gray-50 last:border-b-0',
                          selectedOutlet?.id === outlet.id && 'bg-gov-50/80'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className={cn('w-4 h-4 mt-0.5 flex-shrink-0', selectedOutlet?.id === outlet.id ? 'text-gov-600' : 'text-gray-400')} />
                          <div className="flex-1 min-w-0">
                            <p className={cn('font-medium truncate', selectedOutlet?.id === outlet.id ? 'text-gov-700' : 'text-gray-700')}>
                              {outlet.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{outlet.address}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索网点..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 hover:border-gov-300 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-gov-400 focus:ring-4 focus:ring-gov-100 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-gov-600" />
                  <h2 className="font-bold text-gray-800">VR 全景漫游</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-gov-100 text-gov-700 text-xs font-medium border border-gov-200">
                    360°
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gov-50 hover:text-gov-600 hover:border-gov-200 transition-colors"
                    title="缩小"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetVR}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gov-50 hover:text-gov-600 hover:border-gov-200 transition-colors"
                    title="重置视角"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setScale((s) => Math.min(1.5, s + 0.1))}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gov-50 hover:text-gov-600 hover:border-gov-200 transition-colors"
                    title="放大"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                ref={vrContainerRef}
                className="relative h-[420px] md:h-[500px] overflow-hidden select-none"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `
                      radial-gradient(ellipse 80% 60% at 30% 40%, rgba(22, 93, 255, 0.12) 0%, transparent 50%),
                      radial-gradient(ellipse 60% 50% at 70% 60%, rgba(230, 162, 60, 0.1) 0%, transparent 50%),
                      linear-gradient(135deg, #0E2C6B 0%, #165DFF 25%, #0E4AD9 50%, #165DFF 75%, #0A1F4D 100%)
                    `,
                    transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`,
                    transformStyle: 'preserve-3d',
                    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="vrgrid" width="60" height="60" patternUnits="userSpaceOnUse">
                          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#vrgrid)" />
                    </svg>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[85%] h-[75%] rounded-3xl border-[3px] border-white/10 bg-white/5 backdrop-blur-[2px] overflow-hidden shadow-2xl"
                      style={{ boxShadow: '0 0 80px rgba(22, 93, 255, 0.3), inset 0 0 60px rgba(255,255,255,0.05)' }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-gold-400/20 to-transparent flex items-center px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-white/80 text-sm font-medium tracking-wider">{selectedOutlet?.name} · 实景大厅</p>
                        </div>
                      </div>

                      <div className="absolute top-14 left-0 right-0 bottom-0 p-6 grid grid-cols-3 grid-rows-2 gap-4">
                        {['社保服务区', '就业服务区', '人才服务区', '仲裁服务区', '自助办理区', '休息等候区'].map((area, i) => {
                          const colors = [
                            'from-blue-500/30 to-cyan-500/20 border-blue-400/40',
                            'from-emerald-500/30 to-teal-500/20 border-emerald-400/40',
                            'from-purple-500/30 to-indigo-500/20 border-purple-400/40',
                            'from-orange-500/30 to-red-500/20 border-orange-400/40',
                            'from-gold-500/30 to-yellow-500/20 border-gold-400/40',
                            'from-pink-500/30 to-rose-500/20 border-pink-400/40',
                          ];
                          return (
                            <div
                              key={i}
                              className={cn(
                                'rounded-2xl border-2 bg-gradient-to-br flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-all duration-300 backdrop-blur-sm',
                                colors[i]
                              )}
                              onClick={() => setActiveHotspot(vrHotspots[(i + 2) % vrHotspots.length])}
                            >
                              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                {i === 0 && <Shield className="w-5 h-5 text-white" />}
                                {i === 1 && <Briefcase className="w-5 h-5 text-white" />}
                                {i === 2 && <UserCog className="w-5 h-5 text-white" />}
                                {i === 3 && <Scale className="w-5 h-5 text-white" />}
                                {i === 4 && <Ticket className="w-5 h-5 text-white" />}
                                {i === 5 && <Users className="w-5 h-5 text-white" />}
                              </div>
                              <p className="text-white font-semibold text-sm tracking-wide">{area}</p>
                              <p className="text-white/60 text-xs">
                                {i % 2 === 0 ? (i + 3) * 2 + '人办理中' : (i + 2) + '个窗口'}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md">
                        <Move className="w-4 h-4 text-white/80" />
                        <span className="text-white/80 text-xs">拖动鼠标旋转视角 · 点击区域切换场景</span>
                      </div>
                    </div>
                  </div>

                  {vrHotspots.map((hotspot) => {
                    const Icon = hotspot.icon;
                    const isActive = activeHotspot?.id === hotspot.id;
                    return (
                      <button
                        key={hotspot.id}
                        onClick={() => setActiveHotspot(hotspot)}
                        className="absolute group"
                        style={{
                          left: `${hotspot.position.x}%`,
                          top: `${hotspot.position.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="relative">
                          {isActive && (
                            <div className="absolute -inset-2 rounded-full border-2 border-gold-400 animate-ping opacity-40"></div>
                          )}
                          <div className={cn(
                            'w-11 h-11 rounded-full flex items-center justify-center shadow-xl border-2 transition-all duration-300',
                            isActive
                              ? 'bg-gradient-to-br from-gold-400 to-gold-600 border-white scale-110'
                              : 'bg-white/95 border-gov-300 hover:scale-110 hover:border-gold-400'
                          )}>
                            <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-gov-700')} />
                          </div>
                          <div className={cn(
                            'absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg transition-all duration-200 z-10',
                            isActive
                              ? 'bg-gold-500 text-white opacity-100'
                              : 'bg-white text-gray-700 opacity-0 group-hover:opacity-100 border border-gray-200'
                          )}>
                            {hotspot.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {activeHotspot && (
                  <div className="absolute left-4 right-4 bottom-4 md:left-6 md:right-auto md:max-w-sm bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60 p-5 animate-fade-in-up">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg flex-shrink-0">
                        {(() => {
                          const Icon = activeHotspot.icon;
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-800">{activeHotspot.name}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                            正常开放
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">{activeHotspot.desc}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <span className="flex items-center gap-1 text-gray-400">
                            <Users className="w-3.5 h-3.5" />
                            等待 {Math.floor(Math.random() * 10) + 2} 人
                          </span>
                          <span className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            约 15 分钟
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveHotspot(null)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <Move className="w-3.5 h-3.5" />
                  导航热点 · 点击快速跳转
                </p>
                <div className="flex flex-wrap gap-2">
                  {vrHotspots.map((hotspot) => {
                    const Icon = hotspot.icon;
                    const isActive = activeHotspot?.id === hotspot.id;
                    return (
                      <button
                        key={hotspot.id}
                        onClick={() => setActiveHotspot(hotspot)}
                        className={cn(
                          'group flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
                          isActive
                            ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-white border-gold-500 shadow-md scale-105'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gov-300 hover:bg-gov-50 hover:text-gov-700'
                        )}
                      >
                        <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-gov-500 group-hover:text-gov-600')} />
                        {hotspot.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-gov-500" />
                  办事动线 · 到场引导
                </p>
                <div className="flex items-center gap-1">
                  {[
                    { icon: DoorOpen, label: '入口安检' },
                    { icon: Ticket, label: '取号排队' },
                    { icon: Clock, label: '等候叫号' },
                    { icon: Shield, label: '窗口办理' },
                    { icon: FileCheck, label: '办结评价' },
                    { icon: LogOut, label: '离场' },
                  ].map((step, i) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={i} className="flex items-center gap-1 flex-1">
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-gov-50 flex items-center justify-center border border-gov-200">
                            <StepIcon className="w-3.5 h-3.5 text-gov-600" />
                          </div>
                          <span className="text-[9px] text-gray-500 text-center leading-tight">{step.label}</span>
                        </div>
                        {i < 5 && <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  网点服务能力
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '窗口数量', value: '15个', sub: '含无障碍2个' },
                    { label: '日均接待', value: '380人', sub: '满意率98.2%' },
                    { label: '平均等候', value: '12分钟', sub: '最长35分钟' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg p-2.5 border border-gray-100 text-center">
                      <p className="text-sm font-bold text-gray-800">{item.value}</p>
                      <p className="text-[10px] font-medium text-gray-600 mt-0.5">{item.label}</p>
                      <p className="text-[9px] text-gray-400">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">实时排队情况</h2>
                    <p className="text-sm text-gray-500">各窗口当前等待人数</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    实时更新
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{queueUpdatedAt}</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedOutlet?.queueData || []} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={12} width={75} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(22, 93, 255, 0.05)' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(value: number) => [`${value} 人`, '等待人数']}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                      {(selectedOutlet?.queueData || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={queueBarColors[index % queueBarColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
              <div className="h-2 bg-gradient-to-r from-gov-500 via-gov-400 to-gold-400"></div>
              <div className="p-6 space-y-5">
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center shadow-gov flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-lg leading-snug">{selectedOutlet?.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-medium text-emerald-600">营业中</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                      <MapPin className="w-4.5 h-4.5 text-gov-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">地址</p>
                        <p className="text-sm text-gray-700 font-medium">{selectedOutlet?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                      <Phone className="w-4.5 h-4.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">联系电话</p>
                        <p className="text-sm text-gray-700 font-medium">{selectedOutlet?.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                      <Clock className="w-4.5 h-4.5 text-gold-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">工作时间</p>
                        <p className="text-sm text-gray-700 font-medium whitespace-pre-line leading-relaxed">
                          {selectedOutlet?.workTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">可办业务</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOutlet?.services.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gov-50/80 text-gov-700 text-xs font-medium border border-gov-100"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-gov-500" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 space-y-3 border-t border-gray-100">
                  <button
                    onClick={handleAppointment}
                    disabled={appointmentLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gov-500 to-gov-700 text-white font-semibold hover:shadow-gov-lg transition-all duration-300 hover:scale-[1.02] shadow-gov flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Calendar className="w-5 h-5" />
                    {appointmentLoading ? '预约中...' : '预约办理'}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-gov-300 hover:bg-gov-50 hover:text-gov-700 transition-all duration-200 flex items-center justify-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      地图导航
                    </button>
                    <button className="py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 flex items-center justify-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      一键呼叫
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4.5 h-4.5 text-gov-500" />
                  <h3 className="font-semibold text-gray-800 text-sm">我的预约</h3>
                </div>
                <span className="text-xs text-gray-400">{appointments.filter(a => a.statusType === 'warning').length} 项待办</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
                {appointments.map((apt) => {
                  const statusColors: Record<string, string> = {
                    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    warning: 'bg-gold-50 text-gold-700 border-gold-200',
                    info: 'bg-gov-50 text-gov-700 border-gov-200',
                    danger: 'bg-red-50 text-red-700 border-red-200',
                  };
                  return (
                    <div key={apt.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{apt.business}</p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {apt.date}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{apt.outlet}</p>
                        </div>
                        <span className={cn(
                          'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          statusColors[apt.statusType]
                        )}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Handshake className="w-4.5 h-4.5 text-emerald-500" />
                  <h3 className="font-semibold text-gray-800 text-sm">到场引导记录</h3>
                </div>
                <span className="text-xs text-gray-400">{visitRecords.length} 条</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {visitRecords.map((rec) => (
                  <div key={rec.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{rec.business}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rec.date} · {rec.window}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{rec.outlet}</p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gold-50 to-gov-50/50 rounded-2xl border-2 border-gold-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">智能推荐</h3>
                  <p className="text-xs text-gray-500">基于当前情况推荐</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4 border border-gold-100 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">建议前往窗口</p>
                  <p className="font-semibold text-gray-800">综合窗口（人最少）</p>
                  <p className="text-xs text-emerald-600 mt-1">预计等待时间 <span className="font-bold">5 分钟</span></p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gold-100 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">高峰时段提示</p>
                  <p className="text-sm text-gray-700">当前为平峰时段，建议<span className="font-semibold text-gov-600">尽快前往</span>办理</p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
