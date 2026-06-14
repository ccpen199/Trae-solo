import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import ReactECharts from 'echarts-for-react';
import {
  MapPin, Clock, Star, AlertTriangle, TrendingUp, Users, ShoppingBag, Wallet,
  Camera, User, Shield, FileCheck, CheckCircle as CheckCircleImport, XCircle,
  ChevronRight, Zap, Navigation, ScanFace, Image, Clock3, Banknote,
  Award, AlertCircle, Wrench, Snowflake, Droplets, Lock, Flame, Bug, Eye,
  CheckCircle2, Circle,
} from 'lucide-react';
import { workers } from '@/data/workers';
import { laborRates } from '@/data/parts';
import { escrowRecords } from '@/data/quality';
import type { Order, SkillCert, SkillCertStatus } from '@/types';

const mapWidth = 800;
const mapHeight = 500;

interface MapPoint {
  id: string;
  x: number;
  y: number;
  type: 'order' | 'worker';
  status?: string;
  label?: string;
}

function CheckCircle(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function getIcon(icon: string) {
  const map: Record<string, React.ElementType> = {
    'snowflake': Snowflake, 'zap': Zap, 'droplets': Droplets,
    'flame': Flame, 'lock': Lock, 'wrench': Wrench,
    'tv': Zap, 'bug': Bug,
  };
  return map[icon] || Wrench;
}

function getCertStatusInfo(status: SkillCertStatus) {
  const map: Record<SkillCertStatus, { label: string; color: string; dot: string }> = {
    verified: { label: '已认证', color: 'text-green-600', dot: 'bg-green-500' },
    under_review: { label: '人工复核中', color: 'text-blue-600', dot: 'bg-blue-500' },
    ocr_recognized: { label: 'OCR已识别', color: 'text-purple-600', dot: 'bg-purple-500' },
    pending: { label: '待提交', color: 'text-amber-600', dot: 'bg-amber-500' },
    expired: { label: '已过期', color: 'text-red-600', dot: 'bg-red-500' },
  };
  return map[status];
}

function MapView() {
  const { orders, workers } = useAppStore();
  const [points, setPoints] = useState<MapPoint[]>([]);

  useEffect(() => {
    const orderPoints: MapPoint[] = orders
      .filter(o => o.status === 'in_service' || o.status === 'pending' || o.status === 'matched')
      .map((o, i) => ({
        id: `o-${o.id}`,
        x: 100 + (i * 60) % 600,
        y: 80 + ((i * 47) % 350),
        type: 'order',
        status: o.status,
        label: o.faultTypeName,
      }));

    const workerPoints: MapPoint[] = workers
      .filter(w => w.status !== 'offline')
      .map((w, i) => ({
        id: `w-${w.id}`,
        x: 150 + (i * 53) % 550,
        y: 120 + ((i * 39) % 300),
        type: 'worker',
        status: w.status,
        label: w.name,
      }));

    setPoints([...orderPoints, ...workerPoints]);
  }, [orders, workers]);

  const roads = [
    { d: 'M0,200 L800,180', stroke: '#334155', strokeWidth: 3 },
    { d: 'M0,320 L800,340', stroke: '#334155', strokeWidth: 3 },
    { d: 'M120,0 L100,500', stroke: '#334155', strokeWidth: 2 },
    { d: 'M350,0 L370,500', stroke: '#334155', strokeWidth: 2 },
    { d: 'M580,0 L600,500', stroke: '#334155', strokeWidth: 2 },
    { d: 'M700,0 L720,500', stroke: '#334155', strokeWidth: 2 },
    { d: 'M0,260 L800,250', stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' },
    { d: 'M200,0 L210,500', stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' },
    { d: 'M480,0 L490,500', stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' },
  ];

  const blocks = [
    { x: 0, y: 0, w: 100, h: 200, name: '陆家嘴CBD' },
    { x: 100, y: 0, w: 250, h: 200, name: '潍坊新村' },
    { x: 350, y: 0, w: 230, h: 180, name: '塘桥' },
    { x: 580, y: 0, w: 220, h: 200, name: '南码头' },
    { x: 0, y: 200, w: 120, h: 120, name: '源深' },
    { x: 120, y: 200, w: 230, h: 120, name: '世纪公园' },
    { x: 350, y: 180, w: 230, h: 140, name: '花木' },
    { x: 580, y: 200, w: 220, h: 140, name: '北蔡' },
    { x: 0, y: 320, w: 100, h: 180, name: '洋泾' },
    { x: 100, y: 320, w: 270, h: 180, name: '金桥' },
    { x: 370, y: 320, w: 210, h: 180, name: '张江' },
    { x: 580, y: 340, w: 220, h: 160, name: '高行' },
  ];

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
      <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="glow-orange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-blue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

        {blocks.map((b, i) => (
          <g key={i}>
            <rect
              x={b.x + 2} y={b.y + 2} width={b.w - 4} height={b.h - 4}
              fill="rgba(30,41,59,0.5)" stroke="#334155" strokeWidth="1" rx="4"
            />
            <text x={b.x + b.w / 2} y={b.y + 20} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">
              {b.name}
            </text>
          </g>
        ))}

        {roads.map((road, i) => (
          <path key={i} d={road.d} stroke={road.stroke} strokeWidth={road.strokeWidth} strokeDasharray={road.strokeDasharray || ''} fill="none" opacity="0.7" />
        ))}

        {points.map(p => (
          <g key={p.id}>
            {p.type === 'order' ? (
              <>
                <motion.circle cx={p.x} cy={p.y} r="22" fill="url(#glow-orange)"
                  initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }} />
                <circle cx={p.x} cy={p.y} r="10" fill="#f97316" stroke="white" strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="4" fill="white" />
              </>
            ) : (
              <>
                <motion.circle cx={p.x} cy={p.y} r="18" fill="url(#glow-blue)"
                  initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
                <circle cx={p.x} cy={p.y} r="8" fill={p.status === 'busy' ? '#f59e0b' : '#22c55e'} stroke="white" strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>

      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-slate-700/50">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-300">待处理订单</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-300">在线师傅</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-300">服务中</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-700/50">
        <p className="text-xs text-slate-400">上海 · 浦东新区</p>
        <p className="text-sm font-semibold text-white">实时调度地图</p>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string; value: string | number; unit?: string;
  trend?: string; trendUp?: boolean;
  icon: React.ElementType; color: string;
}

function StatCard({ label, value, unit, trend, trendUp, icon: Icon, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/50 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
              <TrendingUp className={`w-3.5 h-3.5 ${!trendUp && 'rotate-180'}`} />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('500', '100').replace('600', '100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

function WorkerCertsDisplay({ certs }: { certs: SkillCert[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {certs.slice(0, 3).map(cert => {
        const info = getCertStatusInfo(cert.status);
        return (
          <div key={cert.categoryId} className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-200/50">
            <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
            <span className="text-[10px] text-slate-600">{cert.categoryName}</span>
            <span className={`text-[10px] font-medium ${info.color}`}>{info.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MatchReasonsDisplay({ order }: { order: Order }) {
  if (!order.matchReasons || order.matchReasons.length === 0) {
    return <p className="text-xs text-slate-400">正在匹配附近师傅...</p>;
  }
  const iconMap: Record<string, React.ElementType> = {
    distance: Navigation, skill: Award, rating: Star, history: CheckCircle2,
  };
  return (
    <div className="space-y-1.5">
      {order.matchReasons.map(r => {
        const Icon = iconMap[r.type] || Zap;
        return (
          <div key={r.type} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-3 h-3 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-700">{r.reason}</p>
              <p className="text-[11px] text-slate-500">{r.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComplianceDisplay({ order }: { order: Order }) {
  const gpsCheckin = order.checkIns.find(c => c.type === 'gps');
  const faceCheckin = order.checkIns.find(c => c.type === 'face');
  const completeCheckin = order.checkIns.find(c => c.type === 'complete');

  const requiredPhotos = order.processPhotos.filter(p => p.isRequired);
  const hiddenPhotos = order.processPhotos.filter(p => p.isHiddenWork);
  const uploadedCount = requiredPhotos.filter(p => p.timestamp).length;
  const hiddenUploaded = hiddenPhotos.filter(p => p.timestamp).length;

  const hasGps = !!gpsCheckin;
  const hasFace = !!faceCheckin;
  const hasPhotosRequired = requiredPhotos.length > 0 ? uploadedCount === requiredPhotos.length : order.status === 'pending' || order.status === 'matched';
  const hasHiddenOk = hiddenPhotos.length > 0 ? hiddenUploaded === hiddenPhotos.length : true;

  const allCompliant = hasGps && hasFace && hasPhotosRequired && hasHiddenOk;

  const items = [
    { label: 'GPS定位打卡', done: hasGps, icon: MapPin, detail: gpsCheckin ? `精度${gpsCheckin.location.accuracy}m` : '未打卡', ok: gpsCheckin?.verified ?? false },
    { label: '人脸识别验证', done: hasFace, icon: ScanFace, detail: faceCheckin ? (faceCheckin.verified ? '本人验证通过' : '验证失败') : '未验证', ok: faceCheckin?.verified ?? false },
    { label: '工序照片上传', done: hasPhotosRequired, icon: Camera, detail: requiredPhotos.length > 0 ? `${uploadedCount}/${requiredPhotos.length}张` : '无要求', ok: hasPhotosRequired, required: requiredPhotos.length > 0 },
    { label: '隐蔽工程图', done: hasHiddenOk, icon: Shield, detail: hiddenPhotos.length > 0 ? `${hiddenUploaded}/${hiddenPhotos.length}张(必传)` : '无要求', ok: hasHiddenOk, required: hiddenPhotos.length > 0, isHidden: true },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          合规校验
        </p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          allCompliant ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
        }`}>
          {allCompliant ? '全部通过' : '待完成'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`p-2 rounded-lg border ${
              item.done
                ? item.ok ? 'bg-green-50/50 border-green-200/50' : 'bg-red-50/50 border-red-200/50'
                : item.required
                ? item.isHidden
                  ? 'bg-red-50/50 border-red-200/50'
                  : 'bg-amber-50/50 border-amber-200/50'
                : 'bg-slate-50 border-slate-200/50'
            }`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className={`w-3.5 h-3.5 ${
                  item.done ? (item.ok ? 'text-green-600' : 'text-red-500') : item.required ? (item.isHidden ? 'text-red-500' : 'text-amber-500') : 'text-slate-400'
                }`} />
                <span className={`text-[11px] font-medium ${
                  item.done ? (item.ok ? 'text-green-700' : 'text-red-600') : item.required ? (item.isHidden ? 'text-red-600' : 'text-amber-600') : 'text-slate-500'
                }`}>{item.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 ml-5">{item.detail}</p>
            </div>
          );
        })}
      </div>
      {completeCheckin && (
        <div className="flex items-center gap-1.5 p-2 bg-blue-50/50 rounded-lg border border-blue-200/50">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[11px] font-medium text-blue-700">已完工打卡</span>
          <span className="text-[10px] text-blue-600 ml-auto">{completeCheckin.time.split(' ')[1]?.slice(0, 5)}</span>
        </div>
      )}
    </div>
  );
}

function EscrowFlowDisplay({ order }: { order: Order }) {
  const escrow = escrowRecords.find(e => e.orderId === order.id);

  if (!escrow) {
    return (
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/50">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Clock3 className="w-3.5 h-3.5" />
          {order.status === 'pending' || order.status === 'matched'
            ? '等待业主支付，支付后资金将进入平台担保账户'
            : '担保记录创建中...'}
        </p>
      </div>
    );
  }

  const steps = [
    { key: 'frozen', label: '付款冻结', done: !!escrow.frozenAt, time: escrow.frozenAt, icon: Banknote },
    { key: 'acceptance', label: '验收确认', done: !!escrow.acceptanceAt, time: escrow.acceptanceAt || undefined, icon: User },
    { key: 'release', label: 'T+1释放', done: escrow.status === 'released', time: escrow.releaseAt || escrow.expectedReleaseAt || undefined, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-orange-500" />
          资金担保流转
        </p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          escrow.status === 'released' ? 'bg-green-100 text-green-600' :
          escrow.releaseBasis?.includes('争议') ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
        }`}>
          {escrow.status === 'released' ? '已释放' : escrow.releaseBasis?.includes('争议') ? '争议暂缓' : '冻结中'}
        </span>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200/50 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-orange-600">担保金额</span>
          <span className="text-base font-bold text-orange-600">¥{escrow.amount}</span>
        </div>
        {escrow.releaseBasis && (
          <p className="text-[10px] text-orange-700 mt-1">{escrow.releaseBasis}</p>
        )}
      </div>

      <div className="relative pl-1">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isLast = idx === steps.length - 1;
          return (
            <div key={step.key} className="flex items-start gap-2 pb-2 last:pb-0 relative">
              {!isLast && (
                <div className={`absolute left-[9px] top-4 w-0.5 ${step.done ? 'bg-green-300' : 'bg-slate-200'}`}
                  style={{ height: 'calc(100% - 16px)' }} />
              )}
              <div className={`relative z-10 w-4.5 h-4.5 w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 ${
                step.done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                <StepIcon className="w-3 h-3" />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <p className={`text-[11px] font-medium ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  {step.time && (
                    <span className="text-[10px] text-slate-400">
                      {step.done ? step.time : `预计 ${step.time}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderDetailPanel({ order }: { order: Order }) {
  const worker = order.workerId ? workers.find(w => w.id === order.workerId) : null;
  const cityRate = laborRates.find(r => r.city === (order.city || '上海'));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold text-slate-800 text-sm">{order.faultTypeName}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{order.id}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400">匹配得分</p>
          <p className="text-lg font-bold text-orange-500">{order.matchScore || '—'}</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
          <User className="w-3 h-3" />
          指派师傅
        </p>
        {worker ? (
          <div className="p-3 bg-white rounded-lg border border-slate-200/50 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <img src={worker.avatar} alt={worker.name} className="w-10 h-10 rounded-full bg-slate-200 ring-2 ring-white shadow-sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-slate-800 truncate">{worker.name}</p>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-slate-600 font-medium">{worker.rating}</span>
                </div>
                <p className="text-[11px] text-slate-500">{worker.orderCount}单 · {order.distanceKm || worker.distanceKm || '?'}km</p>
              </div>
              <button className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 mb-1.5">资质证件 · 人工复核状态</p>
              <WorkerCertsDisplay certs={worker.skills} />
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/50 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-amber-700">系统正在匹配就近持证师傅...</p>
          </div>
        )}
      </div>

      <div>
        <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          匹配原因（就近+技能+评分）
        </p>
        <MatchReasonsDisplay order={order} />
      </div>

      {order.quote && cityRate && (
        <div>
          <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
            <Wallet className="w-3 h-3" />
            透明报价 · {order.city || '上海'}基准工时费 ¥{cityRate.baseRate}/小时
          </p>
          <div className="p-3 bg-white rounded-lg border border-slate-200/50 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-slate-500">配件费</p>
                <p className="text-sm font-bold text-slate-700">¥{order.quote.totalParts}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">工时费</p>
                <p className="text-sm font-bold text-slate-700">¥{order.quote.totalLabor}</p>
                <p className="text-[9px] text-slate-400">{order.quote.laborHours}h × ¥{order.quote.cityBaseRate}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">合计</p>
                <p className="text-sm font-bold text-orange-600">¥{order.quote.totalAmount}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">平台服务费 ¥{order.quote.platformFee}</span>
              <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                平台担保
              </span>
            </div>
          </div>
        </div>
      )}

      <ComplianceDisplay order={order} />

      <EscrowFlowDisplay order={order} />
    </motion.div>
  );
}

function OrderTickerWithDetail() {
  const { orders } = useAppStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');

  const activeOrders = orders.filter(o => o.status !== 'reviewed');
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  return (
    <div className="grid grid-cols-5 gap-4 h-full">
      <div className="col-span-2 bg-white rounded-xl border border-slate-200/50 shadow-sm flex flex-col min-h-0">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-slate-800 text-sm">实时订单动态</h3>
          <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
            {activeOrders.length} 单
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {orders.slice(0, 8).map((order, idx) => {
            const isSelected = selectedOrderId === order.id;
            const worker = order.workerId ? workers.find(w => w.id === order.workerId) : null;
            return (
              <motion.button
                key={order.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setSelectedOrderId(order.id)}
                className={`w-full p-2.5 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'bg-orange-50 border border-orange-200 shadow-sm'
                    : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      order.status === 'pending' ? 'bg-orange-500 animate-pulse' :
                      order.status === 'matched' ? 'bg-blue-500' :
                      order.status === 'in_service' ? 'bg-green-500' :
                      order.status === 'completed' ? 'bg-purple-500' :
                      'bg-slate-400'
                    }`} />
                    <p className={`text-xs font-medium truncate ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>
                      {order.faultTypeName}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {order.createdAt.split(' ')[1]?.slice(0, 5)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate ml-4">
                  {order.homeownerAddress.slice(0, 20)}
                </p>
                {worker && (
                  <div className="flex items-center gap-1.5 mt-1.5 ml-4">
                    <img src={worker.avatar} alt="" className="w-3.5 h-3.5 rounded-full bg-slate-200" />
                    <span className="text-[10px] text-slate-500">{worker.name}</span>
                    <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />{worker.rating}
                    </span>
                    {order.matchScore && (
                      <span className="ml-auto text-[10px] text-orange-500 font-medium">匹配{order.matchScore}</span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="col-span-3 min-h-0 overflow-y-auto">
        {selectedOrder && <OrderDetailPanel order={selectedOrder} />}
      </div>
    </div>
  );
}

function TrendChart() {
  const { orderTrendData } = useAppStore();

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    grid: { left: 40, right: 20, top: 30, bottom: 20 },
    legend: {
      data: ['订单数', '完成数'],
      textStyle: { color: '#64748b', fontSize: 11 },
      top: 0, right: 0,
    },
    xAxis: {
      type: 'category',
      data: orderTrendData.dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    series: [
      {
        name: '订单数', type: 'line', smooth: true, data: orderTrendData.orders,
        lineStyle: { color: '#f97316', width: 2 },
        itemStyle: { color: '#f97316' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249,115,22,0.25)' },
              { offset: 1, color: 'rgba(249,115,22,0.02)' },
            ],
          },
        },
      },
      {
        name: '完成数', type: 'line', smooth: true, data: orderTrendData.completed,
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34,197,94,0.2)' },
              { offset: 1, color: 'rgba(34,197,94,0.02)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-4 h-full">
      <h3 className="font-semibold text-slate-800 text-sm mb-1">近7日订单趋势</h3>
      <div className="h-36">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { dashboardStats } = useAppStore();

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">调度大屏</h2>
          <p className="text-sm text-slate-500 mt-1">就近响应 + 技能匹配 + 价格透明 · 全链路业务闭环</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            2024年6月14日 星期五 · 上海
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="今日订单" value={dashboardStats.todayOrders} trend="+12.5%" trendUp icon={ShoppingBag} color="text-orange-500" />
        <StatCard label="完成率" value={dashboardStats.completionRate} unit="%" trend="+3.2%" trendUp icon={CheckCircle} color="text-green-500" />
        <StatCard label="在线师傅" value={dashboardStats.onlineWorkers} trend="+2" trendUp icon={Users} color="text-blue-500" />
        <StatCard label="担保资金" value={dashboardStats.escrowAmount.toLocaleString()} unit="元" trend="+2,330" trendUp icon={Wallet} color="text-purple-500" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <div className="h-[380px]">
            <MapView />
          </div>
        </div>
        <div className="col-span-1 h-[380px]">
          <OrderTickerWithDetail />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-1">
          <TrendChart />
        </div>
        <div className="col-span-1 bg-white rounded-xl border border-slate-200/50 shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">服务合规概览</h3>
          <div className="space-y-3">
            {[
              { label: 'GPS打卡率', value: 98.2, color: 'from-blue-400 to-blue-600' },
              { label: '人脸验证通过率', value: 99.5, color: 'from-green-400 to-green-600' },
              { label: '工序照片上传率', value: 94.8, color: 'from-purple-400 to-purple-600' },
              { label: '隐蔽工程必传率', value: 91.3, color: 'from-orange-400 to-orange-600' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">{item.label}</span>
                  <span className="text-xs font-semibold text-slate-700">{item.value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-100">
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200/50">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">今日待办</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    3笔待处理质量工单 · 1笔争议担保资金 · 2位师傅资质待复核
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-1 bg-white rounded-xl border border-slate-200/50 shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">质量预警</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-600">差评率</span>
                <span className="text-xs font-semibold text-red-500">{dashboardStats.badReviewRate}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" style={{ width: `${dashboardStats.badReviewRate * 10}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-600">平均响应</span>
                <span className="text-xs font-semibold text-blue-600">{dashboardStats.avgResponseTime}分钟</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
              {[
                { kw: '迟到', count: 12, up: true },
                { kw: '乱收费', count: 8, up: false },
                { kw: '态度差', count: 6, up: false },
              ].map(hot => (
                <div key={hot.kw} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <span className="text-xs font-medium text-slate-700 bg-red-100 text-red-600 px-2 py-0.5 rounded">{hot.kw}</span>
                  <span className="text-xs font-bold text-slate-600 ml-auto">{hot.count}</span>
                  <TrendingUp className={`w-3 h-3 ${hot.up ? 'text-red-500' : 'text-green-500'} ${!hot.up && 'rotate-180'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
