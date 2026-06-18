import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, AlertTriangle, Loader2, Clock, MapPin, ChevronRight,
  Smartphone, Wifi, Globe, Sparkles, Ruler, Battery, Cpu, Radio,
  X, Box, Music, ImageIcon, MessageCircle, Download, Map, ArrowLeft
} from 'lucide-react';
import { useScenicStore } from '@/store/useScenicStore';
import { getScenicArea, getARContents } from '@/services/api';
import { calculateDistance } from '@/utils/geo';
import type { ScenicArea, ARContent } from '@/types';
import { cn } from '@/lib/utils';

type PipelinePhase =
  | 'welcome'
  | 'device_check'
  | 'offline_cache'
  | 'complete';

type DeviceCheckItem = {
  key: string;
  label: string;
  icon: typeof Smartphone;
  status: 'pending' | 'checking' | 'pass' | 'warn' | 'fail';
  detail: string;
};

type CacheItem = {
  id: string;
  name: string;
  type: 'model' | 'audio' | 'image' | 'text';
  size: string;
  status: 'pending' | 'loading' | 'done';
  progress: number;
};

const deviceCheckList: DeviceCheckItem[] = [
  { key: 'webgl', label: 'WebGL 图形渲染', icon: Cpu, status: 'pending', detail: '用于渲染3D文物模型' },
  { key: 'xr', label: 'WebXR AR能力', icon: Radio, status: 'pending', detail: '用于空间定位与叠加' },
  { key: 'gps', label: '地理位置服务', icon: MapPin, status: 'pending', detail: '用于POI触发与半径检测' },
  { key: 'audio', label: '音频解码支持', icon: Music, status: 'pending', detail: '用于讲解语音播放' },
  { key: 'storage', label: '本地存储容量', icon: Box, status: 'pending', detail: '用于5km离线缓存' },
  { key: 'battery', label: '电量状态评估', icon: Battery, status: 'pending', detail: 'AR功耗约为普通2倍' },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Welcome() {
  const { scenicId } = useParams<{ scenicId: string }>();
  const navigate = useNavigate();
  const { tourRoutes, loadTourRoutes, loadPOIs, pois } = useScenicStore();
  const [scenic, setScenic] = useState<ScenicArea | undefined>();
  const [phase, setPhase] = useState<PipelinePhase>('welcome');

  const [deviceChecks, setDeviceChecks] = useState<DeviceCheckItem[]>(deviceCheckList);
  const [currentDeviceIdx, setCurrentDeviceIdx] = useState(-1);

  const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
  const [cacheOverall, setCacheOverall] = useState(0);
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [showDistanceInfo, setShowDistanceInfo] = useState(false);

  useEffect(() => {
    if (!scenicId) return;
    const area = getScenicArea(scenicId);
    setScenic(area);
    loadPOIs(scenicId);
    loadTourRoutes(scenicId);

    if (navigator.geolocation && area) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const d = calculateDistance(
            pos.coords.latitude, pos.coords.longitude,
            area.center.lat, area.center.lng,
          );
          setUserDistance(d);
        },
        () => setUserDistance(2.3),
        { timeout: 3000 },
      );
    } else if (area) {
      setUserDistance(2.3);
    }
  }, [scenicId, loadPOIs, loadTourRoutes]);

  useEffect(() => {
    if (phase !== 'offline_cache' || !scenicId) return;
    const ars = getARContents(scenicId);
    const items: CacheItem[] = [];
    ars.forEach((ar: ARContent) => {
      items.push({ id: `${ar.id}-model`, name: `${ar.name} · 3D模型`, type: 'model', size: `${(8 + Math.random() * 20).toFixed(1)}MB`, status: 'pending', progress: 0 });
      (ar.audioTracks || []).forEach((a, idx) => {
        items.push({ id: `${ar.id}-audio-${idx}`, name: `${a.language} · ${ar.name}讲解`, type: 'audio', size: `${(2 + Math.random() * 5).toFixed(1)}MB`, status: 'pending', progress: 0 });
      });
      (ar.historyImages || []).slice(0, 2).forEach((_, idx) => {
        items.push({ id: `${ar.id}-img-${idx}`, name: `${ar.name} · 历史影像${idx + 1}`, type: 'image', size: `${(1 + Math.random() * 3).toFixed(1)}MB`, status: 'pending', progress: 0 });
      });
    });
    items.push({ id: 'poi-data', name: 'POI坐标数据包', type: 'text', size: '128KB', status: 'pending', progress: 0 });
    setCacheItems(items);
  }, [phase, scenicId]);

  useEffect(() => {
    if (phase !== 'device_check') return;
    let i = 0;
    setDeviceChecks(deviceCheckList);
    setCurrentDeviceIdx(0);

    const runNext = () => {
      if (i >= deviceCheckList.length) {
        setTimeout(() => setPhase('offline_cache'), 600);
        return;
      }
      const curr = deviceCheckList[i];
      setCurrentDeviceIdx(i);

      setDeviceChecks((prev) => prev.map((c, idx) => idx === i ? { ...c, status: 'checking' } : c));

      const checkDuration = 600 + Math.random() * 900;

      setTimeout(() => {
        let s: DeviceCheckItem['status'] = 'pass';
        let detail = curr.detail;
        switch (curr.key) {
          case 'xr':
            s = typeof navigator.xr !== 'undefined' ? 'pass' : 'warn';
            detail = s === 'pass' ? '支持WebXR AR会话' : '降级为视觉伪AR模式';
            break;
          case 'webgl':
            s = 'pass';
            detail = 'WebGL 2.0 支持，抗锯齿可用';
            break;
          case 'gps':
            s = userDistance !== null ? 'pass' : 'warn';
            detail = userDistance !== null ? `当前距景区 ${userDistance.toFixed(1)}km` : '使用IP级定位';
            break;
          case 'audio':
            s = 'pass'; detail = '支持AAC/Opus多格式解码'; break;
          case 'storage':
            s = 'pass'; detail = '可用空间 > 500MB，满足离线缓存'; break;
          case 'battery':
            s = Math.random() > 0.3 ? 'pass' : 'warn';
            detail = s === 'pass' ? '电量充足，建议开启省电模式' : '电量较低，AR模式续航约45分钟';
            break;
        }
        setDeviceChecks((prev) => prev.map((c, idx) => idx === i ? { ...c, status: s, detail } : c));
        i += 1;
        setTimeout(runNext, 250);
      }, checkDuration);
    };
    runNext();
  }, [phase, userDistance]);

  useEffect(() => {
    if (phase !== 'offline_cache' || cacheItems.length === 0) return;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setCacheItems((prev) => {
        const next = [...prev];
        let anyPending = false;
        let processedCount = 0;
        let totalProgress = 0;

        for (let k = 0; k < next.length; k++) {
          const item = next[k];
          if (item.status === 'done') {
            totalProgress += 100;
            processedCount++;
            continue;
          }
          if (item.status === 'pending') {
            if (!anyPending) {
              next[k] = { ...item, status: 'loading', progress: 5 + Math.random() * 15 };
              anyPending = true;
            }
            continue;
          }
          if (item.status === 'loading') {
            anyPending = true;
            const inc = 8 + Math.random() * 18;
            const np = Math.min(100, item.progress + inc);
            next[k] = {
              ...item,
              progress: np,
              status: np >= 100 ? 'done' : 'loading',
            };
            totalProgress += np;
            processedCount++;
          }
        }

        const overall = processedCount > 0 ? Math.round((totalProgress / (next.length * 100)) * 100) : 0;
        setCacheOverall(overall);

        if (overall >= 100) {
          setTimeout(() => { if (!cancelled) setPhase('complete'); }, 500);
        } else {
          setTimeout(tick, 180 + Math.random() * 220);
        }
        return next;
      });
    };

    setTimeout(tick, 400);
    return () => { cancelled = true; };
  }, [phase, cacheItems.length]);

  const getDeviceStatusColor = (s: DeviceCheckItem['status']) => {
    switch (s) {
      case 'pass': return 'text-emerald-400';
      case 'warn': return 'text-amber-400';
      case 'fail': return 'text-red-400';
      case 'checking': return 'text-amber-400 animate-pulse';
      default: return 'text-gray-600';
    }
  };

  const arOverallPass = deviceChecks.filter((c) => c.status === 'pass').length;
  const arOverallWarn = deviceChecks.filter((c) => c.status === 'warn').length;

  if (!scenic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1120]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (phase === 'device_check') {
    return (
      <div className="min-h-screen bg-[#0F1120] text-white px-5 py-10">
        <button
          onClick={() => setPhase('welcome')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> 返回欢迎页
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-7 max-w-md mx-auto"
        >
          <div className="flex items-center justify-center mb-5">
            <div className="relative w-16 h-16 rounded-2xl bg-indigo-900/40 border border-indigo-800/40 flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-indigo-400" />
              {arOverallPass === 0 && (
                <Loader2 className="absolute -right-1 -bottom-1 w-5 h-5 text-amber-500 animate-spin" />
              )}
              {arOverallPass > 0 && currentDeviceIdx < deviceCheckList.length && (
                <span className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-amber-500 text-[10px] font-bold flex items-center justify-center">
                  {currentDeviceIdx + 1}/{deviceCheckList.length}
                </span>
              )}
            </div>
          </div>

          <h2 className="text-center text-lg font-serif font-bold mb-1">WebAR 设备兼容性检测</h2>
          <p className="text-center text-[11px] text-gray-500 mb-6">
            正在评估您的设备是否满足AR导览体验要求
          </p>

          <div className="space-y-2 mb-6">
            {deviceChecks.map((check, i) => (
              <motion.div
                key={check.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-2xl border transition-all',
                  check.status === 'checking'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : check.status === 'pass'
                      ? 'bg-emerald-500/5 border-emerald-500/10'
                      : check.status === 'warn'
                        ? 'bg-amber-500/5 border-amber-500/10'
                        : 'bg-white/5 border-white/5',
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  check.status === 'pending' ? 'bg-white/5' : 'bg-black/20',
                )}>
                  <check.icon size={16} className={getDeviceStatusColor(check.status)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-medium text-gray-200">{check.label}</p>
                    {check.status === 'checking' && <Loader2 size={12} className="text-amber-400 animate-spin" />}
                    {check.status === 'pass' && <CheckCircle size={12} className="text-emerald-400" />}
                    {check.status === 'warn' && <AlertTriangle size={12} className="text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-snug">{check.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {currentDeviceIdx >= deviceCheckList.length && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-amber-600/10 border border-amber-600/20"
            >
              <div className="flex items-center gap-2 mb-2">
                {arOverallWarn === 0 ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                <p className="text-xs font-medium text-gray-200">
                  {arOverallWarn === 0 ? '完全兼容，可享受完整AR体验' : `兼容 · ${arOverallWarn}项需降级处理`}
                </p>
              </div>
              <button
                onClick={() => setPhase('offline_cache')}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Download size={15} />
                继续：5km 离线预加载
                <ChevronRight size={15} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  if (phase === 'offline_cache' || phase === 'complete') {
    return (
      <div className="min-h-screen bg-[#0F1120] text-white px-5 py-10">
        <button
          onClick={() => setPhase('device_check')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6 disabled:opacity-50"
          disabled={phase !== 'offline_cache'}
        >
          <ArrowLeft size={14} /> 返回设备检测
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-7 max-w-md mx-auto"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center relative w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Globe className="w-8 h-8 text-emerald-400" />
              <div
                className="absolute -inset-3 rounded-full border-2 border-amber-500/30"
                style={{
                  clipPath: `polygon(0 0, ${cacheOverall}% 0, ${cacheOverall}% 100%, 0 100%)`,
                  background: 'conic-gradient(from 0deg, rgba(255,143,0,0.25), rgba(99,102,241,0.25))',
                  borderRadius: '100%',
                }}
              />
            </div>
            <h2 className="text-lg font-serif font-bold mb-1">半径 5km · 离线预加载</h2>
            <p className="text-[11px] text-gray-500">
              {scenic.name} · 包含 POI 坐标、3D 模型、讲解音频、历史影像
            </p>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="text-gray-400 flex items-center gap-1">
                <Ruler className="w-3 h-3" />
                距离景区 {userDistance !== null ? `${userDistance.toFixed(1)}km` : '...'} · 缓存范围 5km
              </span>
              <span className="font-mono text-amber-400 font-medium">{cacheOverall}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cacheOverall}%` }}
                transition={{ duration: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-500 to-amber-500"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-gray-600">
              <span>已加载 {cacheItems.filter((c) => c.status === 'done').length}/{cacheItems.length} 项</span>
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                预计节省 3G/4G 流量 {(cacheItems.length * 4.2).toFixed(0)}MB
              </span>
            </div>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 mb-5 -mr-1">
            {cacheItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl border transition-colors',
                  item.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/10' :
                  item.status === 'loading' ? 'bg-amber-500/5 border-amber-500/20' :
                  'bg-white/5 border-white/5',
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  item.type === 'model' ? 'bg-indigo-500/15' :
                  item.type === 'audio' ? 'bg-emerald-500/15' :
                  item.type === 'image' ? 'bg-purple-500/15' :
                  'bg-amber-500/15',
                )}>
                  {item.type === 'model' && <Box size={13} className="text-indigo-400" />}
                  {item.type === 'audio' && <Music size={13} className="text-emerald-400" />}
                  {item.type === 'image' && <ImageIcon size={13} className="text-purple-400" />}
                  {item.type === 'text' && <MessageCircle size={13} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-300 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-gray-500 w-16 text-right whitespace-nowrap">
                      {item.size} · {item.progress}%
                    </span>
                  </div>
                </div>
                {item.status === 'loading' && <Loader2 size={12} className="text-amber-400 animate-spin flex-shrink-0" />}
                {item.status === 'done' && <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />}
              </div>
            ))}
          </div>

          <AnimatePresence>
            {phase === 'complete' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-amber-600/10 border border-emerald-500/20 mb-3 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-emerald-300 mb-0.5">离线缓存完成</p>
                    <p className="text-[10px] text-gray-400 leading-snug">
                      所有 AR 内容已保存至本地，即使在弱网甚至无网环境也能正常使用。
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/visitor/ar/${scenicId}`)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-amber-900/40"
                >
                  <Sparkles className="w-4 h-4" />
                  开始 AR 导览体验
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1120] text-white">
      <div className="relative h-80 overflow-hidden">
        <img
          src={scenic.coverImage || `https://picsum.photos/seed/${scenic.id}/1200/600`}
          alt={scenic.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0F1120]" />
        <div className="absolute bottom-6 left-5 right-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-2"
          >
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-white/10 backdrop-blur border border-white/15 text-[10px]">
              <Map size={10} />
              {scenic.province} · {scenic.city}
            </span>
            {userDistance !== null && (
              <button
                onClick={() => setShowDistanceInfo(true)}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-amber-500/20 backdrop-blur border border-amber-500/30 text-[10px] text-amber-300"
              >
                <Ruler size={10} />
                距您 {userDistance.toFixed(1)}km
              </button>
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl font-bold leading-tight mb-1"
          >
            {scenic.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-xs text-gray-300"
          >
            AAAA{(scenic.level || '级景区')} · {pois.length} 处 POI · {tourRoutes.length} 条导览路线
          </motion.p>
        </div>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="px-5 pb-32 space-y-5"
      >
        <motion.p variants={fadeUp} className="text-sm text-gray-400 leading-relaxed mt-2">
          {scenic.description}
        </motion.p>

        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-2">
          {[
            { icon: Globe, label: 'AR体验', value: `${(arOverallPass || 6)}/6` },
            { icon: Download, label: '离线可用', value: '5km' },
            { icon: Sparkles, label: '互动内容', value: '23+' },
            { icon: MapPin, label: 'POI点位', value: `${pois.length}` },
          ].map((it) => (
            <div key={it.label} className="rounded-2xl glass p-3 text-center border border-white/5">
              <it.icon size={14} className="text-amber-500 mx-auto mb-1.5" />
              <p className="text-sm font-bold text-white">{it.value}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">{it.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp}>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            选择导览路线
          </h2>
          <div className="space-y-3">
            {tourRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => setPhase('device_check')}
                className="w-full text-left rounded-2xl p-4 glass hover:border-amber-600/40 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover:text-amber-400 transition-colors">{route.name}</p>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 leading-snug">{route.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.estimatedDuration}分钟
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {route.poiIds.length}个景点
                      </span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        <Download className="w-2.5 h-2.5" />
                        离线可用
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0F1120] via-[#0F1120] to-transparent">
        <button
          onClick={() => setPhase('device_check')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-amber-900/40"
        >
          <Sparkles className="w-4 h-4" />
          开始体验 · 检测设备并预加载
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-400" /> 免费</span>
          <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-400" /> 无需注册</span>
          <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-400" /> 微信扫码即用</span>
        </div>
      </div>

      <AnimatePresence>
        {showDistanceInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5"
            onClick={() => setShowDistanceInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">距离与离线覆盖</h3>
                <button onClick={() => setShowDistanceInfo(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="relative h-40 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-amber-600/10 border border-white/5 overflow-hidden mb-4 flex items-center justify-center">
                <div className="absolute w-52 h-52 rounded-full border-2 border-amber-500/20 border-dashed" />
                <div className="absolute w-36 h-36 rounded-full border border-indigo-500/30" />
                <div className="absolute w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-amber-400" />
                </div>
                <div className="absolute top-6 right-8 w-3 h-3 rounded-full bg-indigo-400 ring-4 ring-indigo-400/20" />
                <div className="absolute bottom-12 left-10 text-[9px] font-mono text-gray-400">
                  ↔ {userDistance?.toFixed(1)}km
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-amber-400/80">5km 离线缓存边界</div>
              </div>
              <div className="space-y-2 text-xs">
                <p className="text-gray-400">您当前位于景区 <span className="text-amber-400 font-mono">{userDistance?.toFixed(1)}km</span> 范围内。</p>
                <p className="text-gray-500 leading-relaxed">当进入 5km 半径时，系统自动激活 POI 监听与 AR 触发。点击下方按钮将完整缓存 5km 内的所有 AR 资源。</p>
              </div>
              <button
                onClick={() => { setShowDistanceInfo(false); setPhase('device_check'); }}
                className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-indigo-900 to-amber-600 text-sm text-white font-medium active:scale-[0.98] transition-transform"
              >
                检测设备并开始预加载
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
