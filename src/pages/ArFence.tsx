import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  Marker,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CheckCircle,
  Circle as CircleIcon,
  Clock,
  Eye,
  EyeSlash,
  HandHeart,
  MapPin,
  MapTrifold,
  Megaphone,
  Plus,
  Polygon as PolygonIcon,
  ShieldWarning,
  Sparkle,
  Trash,
  Users,
  XCircle,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SHANGHAI_CENTER: [number, number] = [31.2304, 121.4737];

const fences = [
  {
    id: 'fence-1',
    name: '南京西路商圈',
    type: 'circle' as const,
    center: [31.2335, 121.4655] as [number, number],
    radius: 800,
    isOnline: true,
    infoCount: 12,
  },
  {
    id: 'fence-2',
    name: '陆家嘴金融区',
    type: 'circle' as const,
    center: [31.2397, 121.4998] as [number, number],
    radius: 1000,
    isOnline: true,
    infoCount: 8,
  },
  {
    id: 'fence-3',
    name: '外滩历史区',
    type: 'polygon' as const,
    coords: [
      [31.2400, 121.4820],
      [31.2450, 121.4900],
      [31.2380, 121.4950],
      [31.2320, 121.4900],
      [31.2340, 121.4830],
    ] as [number, number][],
    isOnline: false,
    infoCount: 5,
  },
];

const arInfos = [
  {
    id: 'ar-1',
    title: '限时咖啡买一送一',
    type: 'activity' as const,
    position: [31.2335, 121.4655] as [number, number],
    publisher: '星巴克外滩店',
    status: 'published' as const,
    createdAt: '2024-06-15 09:30',
    expireAt: '2024-06-22 22:00',
  },
  {
    id: 'ar-2',
    title: '走失老人协助寻找',
    type: 'help' as const,
    position: [31.2350, 121.4680] as [number, number],
    publisher: '用户_8821',
    status: 'pending' as const,
    createdAt: '2024-06-15 14:22',
    expireAt: '2024-06-16 14:22',
  },
  {
    id: 'ar-3',
    title: '陆家嘴灯光秀预告',
    type: 'notice' as const,
    position: [31.2397, 121.4998] as [number, number],
    publisher: '上海旅游局',
    status: 'published' as const,
    createdAt: '2024-06-14 18:00',
    expireAt: '2024-07-01 23:59',
  },
  {
    id: 'ar-4',
    title: '失物招领：黑色钱包',
    type: 'help' as const,
    position: [31.2410, 121.4970] as [number, number],
    publisher: '用户_3345',
    status: 'pending' as const,
    createdAt: '2024-06-15 11:05',
    expireAt: '2024-06-17 11:05',
  },
  {
    id: 'ar-5',
    title: '外滩美术馆特展导览',
    type: 'activity' as const,
    position: [31.2380, 121.4900] as [number, number],
    publisher: '外滩美术馆',
    status: 'rejected' as const,
    createdAt: '2024-06-13 10:00',
    expireAt: '2024-06-20 18:00',
  },
];

const typeConfig = {
  help: { label: '互助', icon: HandHeart, color: 'text-telecom', bg: 'bg-telecom/15' },
  notice: { label: '公告', icon: Megaphone, color: 'text-bank', bg: 'bg-bank/15' },
  activity: { label: '活动', icon: Sparkle, color: 'text-gold-400', bg: 'bg-gold-400/15' },
};

const statusConfig = {
  pending: { label: '待审核', color: 'text-warn', bg: 'bg-warn/15' },
  published: { label: '已发布', color: 'text-insurance', bg: 'bg-insurance/15' },
  rejected: { label: '已拒绝', color: 'text-risk', bg: 'bg-risk/15' },
  expired: { label: '已过期', color: 'text-gray-400', bg: 'bg-gray-500/15' },
};

function PulsingMarker({
  position,
  type,
  title,
}: {
  position: [number, number];
  type: keyof typeof typeConfig;
  title: string;
}) {
  const cfg = typeConfig[type];
  const IconComp = cfg.icon;

  const customIcon = L.divIcon({
    className: 'custom-pulse-marker',
    html: `<div style="position:relative;width:32px;height:32px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:currentColor;opacity:0.25;animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:currentColor;opacity:0.4;animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite 0.5s;"></div>
      <div style="position:absolute;inset:8px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(10,22,40,0.9);border:2px solid currentColor;box-shadow:0 0 12px currentColor;"></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker position={position} icon={customIcon}>
      <Popup>
        <div className="text-sm">
          <div className={`font-semibold ${cfg.color}`}>{title}</div>
          <div className="text-xs text-gray-400 mt-1">{cfg.label}</div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function ARFence() {
  const [selectedTab, setSelectedTab] = useState<'fences' | 'infos'>('fences');
  const [fenceStates, setFenceStates] = useState<Record<string, boolean>>(
    Object.fromEntries(fences.map((f) => [f.id, f.isOnline])),
  );
  const [infoStates, setInfoStates] = useState<
    Record<string, 'pending' | 'published' | 'rejected'>
  >(Object.fromEntries(arInfos.map((i) => [i.id, i.status])));

  const toggleFence = (id: string) => {
    setFenceStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setInfoStatus = (id: string, status: 'published' | 'rejected' | 'pending') => {
    setInfoStates((prev) => ({ ...prev, [id]: status }));
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.35; }
        50% { transform: scale(2.2); opacity: 0; }
      }
      .leaflet-popup-content-wrapper {
        background: rgba(10,22,40,0.95) !important;
        border: 1px solid rgba(201,169,98,0.3) !important;
        border-radius: 8px !important;
        color: #E5E7EB !important;
      }
      .leaflet-popup-tip {
        background: rgba(10,22,40,0.95) !important;
        border: 1px solid rgba(201,169,98,0.3) !important;
      }
      .leaflet-popup-close-button {
        color: #C9A962 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="h-full p-6 flex flex-col max-w-[1800px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold gold-gradient-text flex items-center gap-3">
            <MapTrifold size={28} className="text-gold-400" />
            AR 元宇宙地理围栏
          </h1>
          <p className="text-gray-400 mt-1 text-sm">上海区域 AR 互助信息与地理围栏管理</p>
        </div>
        <button className="btn-gold flex items-center gap-2">
          <Plus size={18} />
          新建围栏
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 min-h-0"
      >
        <div className="glass-card p-3 overflow-hidden relative">
          <MapContainer
            center={SHANGHAI_CENTER}
            zoom={12}
            style={{ height: '100%', width: '100%', borderRadius: '8px' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {fences.map((fence) => {
              const isOnline = fenceStates[fence.id];
              const strokeColor = isOnline ? '#C9A962' : '#6B7280';
              const fillColor = isOnline ? 'rgba(201,169,98,0.12)' : 'rgba(107,114,128,0.08)';

              if (fence.type === 'circle') {
                return (
                  <div key={fence.id}>
                    <Circle
                      center={fence.center}
                      radius={fence.radius}
                      pathOptions={{
                        color: strokeColor,
                        weight: 2,
                        fillColor,
                        fillOpacity: 1,
                        dashArray: isOnline ? undefined : '8, 8',
                      }}
                    />
                    <CircleMarker
                      center={fence.center}
                      radius={6}
                      pathOptions={{
                        color: strokeColor,
                        fillColor: strokeColor,
                        fillOpacity: 1,
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold text-gold-400">{fence.name}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {isOnline ? '已上线' : '已下线'}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </div>
                );
              }

              return (
                <Polygon
                  key={fence.id}
                  positions={fence.coords}
                  pathOptions={{
                    color: strokeColor,
                    weight: 2,
                    fillColor,
                    fillOpacity: 1,
                    dashArray: isOnline ? undefined : '8, 8',
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold text-gold-400">{fence.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {isOnline ? '已上线' : '已下线'}
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

            {arInfos.map((info) => (
              <PulsingMarker
                key={info.id}
                position={info.position}
                type={info.type}
                title={info.title}
              />
            ))}
          </MapContainer>

          <div className="absolute top-6 left-6 glass-card px-4 py-3 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={14} className="text-gold-400" />
              <span className="font-semibold">上海市中心</span>
            </div>
            <div className="text-gray-400">31.2304° N, 121.4737° E</div>
          </div>

          <div className="absolute bottom-6 left-6 glass-card px-4 py-3 flex flex-col gap-2 text-xs">
            <div className="font-semibold text-gray-200 mb-1">图例</div>
            <div className="flex items-center gap-2">
              <CircleIcon size={14} className="text-gold-400" weight="fill" />
              <span className="text-gray-300">圆形围栏（上线）</span>
            </div>
            <div className="flex items-center gap-2">
              <PolygonIcon size={14} className="text-gray-400" weight="fill" />
              <span className="text-gray-300">多边形围栏（下线）</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkle size={14} className="text-gold-400" />
              <span className="text-gray-300">AR 信息脉冲点</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col min-h-0">
          <div className="flex gap-2 mb-4 p-1 bg-space-900/60 rounded-lg">
            {(
              [
                { key: 'fences', label: '围栏列表', icon: CircleIcon, count: fences.length },
                { key: 'infos', label: '互助信息', icon: Users, count: arInfos.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
                  selectedTab === tab.key
                    ? 'bg-gold-400/20 text-gold-300 shadow-glow-gold'
                    : 'text-gray-400 hover:text-gray-200',
                )}
              >
                <tab.icon size={16} />
                {tab.label}
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    selectedTab === tab.key ? 'bg-gold-400/30' : 'bg-space-700',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selectedTab === 'fences' ? (
              <motion.div
                key="fences"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex-1 overflow-y-auto space-y-3 pr-1"
              >
                {fences.map((fence, i) => {
                  const isOnline = fenceStates[fence.id];
                  return (
                    <motion.div
                      key={fence.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-space-800/40 rounded-xl p-4 border border-gold-400/10 hover:border-gold-400/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'p-2 rounded-lg',
                              isOnline ? 'bg-gold-400/15 text-gold-400' : 'bg-gray-500/15 text-gray-400',
                            )}
                          >
                            {fence.type === 'circle' ? (
                              <CircleIcon size={18} />
                            ) : (
                              <PolygonIcon size={18} />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-100">{fence.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              {fence.type === 'circle' ? (
                                <>
                                  <CircleIcon size={10} /> 半径 {fence.radius}m
                                </>
                              ) : (
                                <>
                                  <PolygonIcon size={10} /> {fence.coords?.length} 顶点
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded-md font-medium',
                            isOnline ? 'bg-insurance/15 text-insurance' : 'bg-gray-500/15 text-gray-400',
                          )}
                        >
                          {isOnline ? '已上线' : '已下线'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Sparkle size={12} />
                          {fence.infoCount} 条 AR 信息
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleFence(fence.id)}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all',
                            isOnline
                              ? 'bg-risk/10 text-risk hover:bg-risk/20'
                              : 'bg-insurance/10 text-insurance hover:bg-insurance/20',
                          )}
                        >
                          {isOnline ? (
                            <>
                              <EyeSlash size={14} />
                              下线
                            </>
                          ) : (
                            <>
                              <Eye size={14} />
                              上线
                            </>
                          )}
                        </button>
                        <button className="px-3 py-2 rounded-lg bg-space-700/60 text-gray-300 hover:bg-space-700 transition-colors">
                          <Trash size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="infos"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 overflow-y-auto space-y-3 pr-1"
              >
                {arInfos.map((info, i) => {
                  const tc = typeConfig[info.type];
                  const sc = statusConfig[infoStates[info.id]];
                  const TypeIcon = tc.icon;
                  return (
                    <motion.div
                      key={info.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-space-800/40 rounded-xl p-4 border border-gold-400/10 hover:border-gold-400/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          <div className={cn('p-2 rounded-lg', tc.bg, tc.color)}>
                            <TypeIcon size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-100 truncate">{info.title}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{info.publisher}</div>
                          </div>
                        </div>
                        <span className={cn('text-xs px-2 py-1 rounded-md font-medium shrink-0 ml-2', sc.bg, sc.color)}>
                          {sc.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {info.createdAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShieldWarning size={11} />
                          过期 {info.expireAt.split(' ')[0]}
                        </span>
                      </div>

                      {infoStates[info.id] === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setInfoStatus(info.id, 'published')}
                            className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-insurance/10 text-insurance hover:bg-insurance/20 transition-all"
                          >
                            <CheckCircle size={14} />
                            审核通过
                          </button>
                          <button
                            onClick={() => setInfoStatus(info.id, 'rejected')}
                            className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-risk/10 text-risk hover:bg-risk/20 transition-all"
                          >
                            <XCircle size={14} />
                            拒绝
                          </button>
                        </div>
                      )}
                      {infoStates[info.id] !== 'pending' && (
                        <button
                          onClick={() => setInfoStatus(info.id, 'pending')}
                          className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-space-700/60 text-gray-300 hover:bg-space-700 transition-all"
                        >
                          <Clock size={14} />
                          重置为待审核
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
