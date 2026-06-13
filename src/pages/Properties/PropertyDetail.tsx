import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Eye,
  Maximize2,
  Layers,
  Box,
  Grid3x3,
  LayoutGrid,
  ShieldCheck,
  ShieldAlert,
  ParkingSquare,
  ArrowUpDown,
  CalendarDays,
  User,
  Phone,
  FileCheck,
  FileText,
  ChevronRight,
  Plus,
  X,
  Compass,
  MapPin as MapPinIcon,
  TrendingUp,
  Banknote,
  Percent,
  Clock,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import type {
  Property,
  FireInspectionStatus,
  RentClause,
} from '@/types';
import { mockProperties } from '@/mock';
import { cn } from '@/lib/utils';

type TabKey = 'vr' | 'ownership' | 'rent';

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'vr', label: 'VR全景', icon: Eye },
  { key: 'ownership', label: '产权信息', icon: FileCheck },
  { key: 'rent', label: '租赁条款', icon: FileText },
];

const fireStatusColorMap: Record<FireInspectionStatus, string> = {
  已通过: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  待验收: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  整改中: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  未申请: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30',
};

type InfoItemProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  highlight?: boolean;
};

function InfoItem({ icon: Icon, label, value, highlight }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gold-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-neutral-500">{label}</p>
        <p
          className={cn(
            'text-sm font-medium mt-0.5 truncate',
            highlight ? 'animate-shimmer-gold' : 'text-neutral-100'
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

type Hotspot = {
  id: string;
  x: number;
  y: number;
  label: string;
};

const mockHotspots: Hotspot[] = [
  { id: '1', x: 25, y: 45, label: '前台接待' },
  { id: '2', x: 55, y: 38, label: '开放办公区' },
  { id: '3', x: 78, y: 52, label: '会议室A' },
  { id: '4', x: 35, y: 68, label: '茶水间' },
  { id: '5', x: 68, y: 72, label: '独立办公室' },
];

function VRViewer({ property }: { property: Property }) {
  const vrImage = property.images.find((img) => img.isVr);
  const scenes = vrImage?.vrScenes ?? ['大堂入口', '前台区域', '开放办公区', '会议室'];
  const [activeScene, setActiveScene] = useState(0);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="space-y-5">
      <div className="card-base p-1 overflow-hidden">
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 40%, rgba(61, 93, 151, 0.6) 0%, rgba(15, 30, 49, 0.95) 70%), linear-gradient(180deg, #162C48 0%, #0F1E31 100%)',
            }}
          />

          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="vrGrid" width="5" height="5" patternUnits="userSpaceOnUse">
                  <path
                    d="M 5 0 L 0 0 0 5"
                    fill="none"
                    stroke="rgba(212, 168, 83, 0.15)"
                    strokeWidth="0.2"
                  />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#vrGrid)" />
            </svg>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-64 h-64 rounded-full border border-gold-500/20 flex items-center justify-center"
              >
                <div className="w-48 h-48 rounded-full border border-gold-500/15 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border border-gold-500/10 flex items-center justify-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center animate-glow-pulse"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(212,168,83,0.3) 0%, transparent 70%)',
                      }}
                    >
                      <Eye className="w-8 h-8 text-gold-400" />
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Compass className="w-10 h-10 text-gold-400/50" />
              </div>
            </div>
          </div>

          {mockHotspots.map((hotspot) => (
            <motion.button
              key={hotspot.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              className="absolute group"
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                <div
                  className="absolute inset-0 rounded-full animate-glow-pulse"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(212,168,83,0.4) 0%, transparent 70%)',
                    width: 32,
                    height: 32,
                    left: -16,
                    top: -16,
                  }}
                />
                <div className="w-4 h-4 rounded-full bg-gold-500 border-2 border-primary-900 relative z-10" />
                <MapPinIcon className="w-3 h-3 text-primary-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary-900/90 border border-gold-500/30 text-[11px] text-gold-300 backdrop-blur-sm">
                  {hotspot.label}
                </span>
              </div>
            </motion.button>
          ))}

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="chip chip-gold">
              <Eye className="w-3 h-3" />
              VR 全景漫游
            </span>
            <span className="chip">
              {scenes[activeScene]}
            </span>
          </div>

          <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <span className="text-[10px] text-neutral-400">朝向</span>
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full bg-primary-900/60 border border-gold-500/20 backdrop-blur-sm" />
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-gold-400" />
              </motion.div>
              <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] text-gold-400 font-bold">
                N
              </span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 chip">
            <Eye className="w-3 h-3 text-gold-400/70" />
            VR浏览量: <span className="text-gold-300 font-semibold ml-1">{property.vrViews.toLocaleString()}</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
            {scenes.map((scene, idx) => (
              <button
                key={scene}
                onClick={() => {
                  setActiveScene(idx);
                  setRotation((r) => r + (idx - activeScene) * 72);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[11px] font-medium backdrop-blur-sm border transition-all',
                  activeScene === idx
                    ? 'bg-gold-500/20 border-gold-500/50 text-gold-300'
                    : 'bg-primary-900/50 border-neutral-500/20 text-neutral-400 hover:border-gold-500/30 hover:text-neutral-200'
                )}
              >
                {scene}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-base p-5">
        <h4 className="text-sm font-semibold text-gold-300 mb-3">场景切换</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {scenes.map((scene, idx) => (
            <button
              key={scene}
              onClick={() => setActiveScene(idx)}
              className={cn(
                'relative aspect-video rounded-lg overflow-hidden border transition-all',
                activeScene === idx
                  ? 'border-gold-500/60 ring-2 ring-gold-400/30'
                  : 'border-neutral-500/20 hover:border-gold-500/40'
              )}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    idx % 2 === 0
                      ? 'linear-gradient(135deg, #162C48 0%, #1E3A5F 100%)'
                      : 'linear-gradient(135deg, #1E3A5F 0%, #2E4A80 100%)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-gold-400/40" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-primary-900/90 to-transparent">
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    activeScene === idx ? 'text-gold-300' : 'text-neutral-300'
                  )}
                >
                  {scene}
                </span>
              </div>
              {activeScene === idx && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold-400 animate-glow-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OwnershipInfo({ property }: { property: Property }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="card-base p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-gold-400" />
          </div>
          <h3 className="text-base font-bold animate-shimmer-gold">产权概况</h3>
        </div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem
            icon={Building2}
            label="产权类型"
            value={property.ownership.type}
          />
          <InfoItem
            icon={FileText}
            label="房产证号"
            value={property.ownership.certificateNumber}
          />
          <InfoItem
            icon={User}
            label="产权人"
            value={property.ownership.ownerName}
            highlight
          />
          <InfoItem
            icon={CalendarDays}
            label="到期日期"
            value={property.ownership.ownershipExpireDate}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="card-base p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <Maximize2 className="w-4 h-4 text-gold-400" />
          </div>
          <h3 className="text-base font-bold animate-shimmer-gold">物理参数</h3>
        </div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <InfoItem
            icon={Maximize2}
            label="建筑面积"
            value={`${property.spec.area} ㎡`}
            highlight
          />
          <InfoItem
            icon={Grid3x3}
            label="使用面积"
            value={`${property.spec.usableArea} ㎡`}
          />
          <InfoItem
            icon={Layers}
            label="层高"
            value={`${property.spec.ceilingHeight} m`}
          />
          <InfoItem
            icon={Box}
            label="承重"
            value={`${property.spec.loadCapacity} kg/㎡`}
          />
          <InfoItem
            icon={LayoutGrid}
            label="柱距"
            value={property.spec.columnSpacing}
          />
          <InfoItem
            icon={Eye}
            label="窗地比"
            value={property.spec.windowRatio}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="card-base p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-gold-400" />
          </div>
          <h3 className="text-base font-bold animate-shimmer-gold">消防验收</h3>
        </div>
        <div className="divider-gold mb-4" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {property.ownership.fireInspectionStatus === '已通过' ? (
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 text-amber-400" />
              </div>
            )}
            <div>
              <span
                className={cn(
                  'inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold border',
                  fireStatusColorMap[property.ownership.fireInspectionStatus]
                )}
              >
                {property.ownership.fireInspectionStatus}
              </span>
              {property.ownership.fireInspectionDate && (
                <p className="text-xs text-neutral-400 mt-1.5">
                  验收日期: {property.ownership.fireInspectionDate}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="card-base p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <ParkingSquare className="w-4 h-4 text-gold-400" />
          </div>
          <h3 className="text-base font-bold animate-shimmer-gold">配套设施</h3>
        </div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-primary-900/40 border border-gold-500/10 p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  property.ownership.hasElevator
                    ? 'bg-emerald-500/15 border border-emerald-500/30'
                    : 'bg-neutral-500/15 border border-neutral-500/30'
                )}
              >
                <ArrowUpDown
                  className={cn(
                    'w-5 h-5',
                    property.ownership.hasElevator ? 'text-emerald-400' : 'text-neutral-500'
                  )}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-500">电梯配置</p>
                <p
                  className={cn(
                    'text-sm font-semibold mt-0.5',
                    property.ownership.hasElevator ? 'text-emerald-300' : 'text-neutral-500'
                  )}
                >
                  {property.ownership.hasElevator ? '已配备' : '未配备'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-primary-900/40 border border-gold-500/10 p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  property.ownership.hasParking
                    ? 'bg-emerald-500/15 border border-emerald-500/30'
                    : 'bg-neutral-500/15 border border-neutral-500/30'
                )}
              >
                <ParkingSquare
                  className={cn(
                    'w-5 h-5',
                    property.ownership.hasParking ? 'text-emerald-400' : 'text-neutral-500'
                  )}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-500">车位数量</p>
                <p
                  className={cn(
                    'text-sm font-semibold mt-0.5',
                    property.ownership.hasParking ? 'text-emerald-300' : 'text-neutral-500'
                  )}
                >
                  {property.ownership.hasParking
                    ? `${property.ownership.parkingSpots} 个`
                    : '无车位'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

type RentTemplate = {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  monthlyRent: number;
  rentIncreaseRate: number;
  depositMonths: number;
  freeRentDays: number;
  minLeaseTerm: number;
  maxLeaseTerm: number;
  highlights: string[];
};

const rentTemplates: RentTemplate[] = [
  {
    id: 'standard',
    name: '标准商务',
    desc: '适合稳定企业长期办公',
    icon: Building2,
    monthlyRent: 1,
    rentIncreaseRate: 5,
    depositMonths: 3,
    freeRentDays: 45,
    minLeaseTerm: 24,
    maxLeaseTerm: 60,
    highlights: ['租金标准', '押金适中', '租期灵活'],
  },
  {
    id: 'long',
    name: '长租优惠',
    desc: '3年以上签约享受超值优惠',
    icon: TrendingUp,
    monthlyRent: 0.92,
    rentIncreaseRate: 3,
    depositMonths: 2,
    freeRentDays: 90,
    minLeaseTerm: 36,
    maxLeaseTerm: 120,
    highlights: ['租金92折', '年递增3%', '免租期3个月'],
  },
  {
    id: 'flexible',
    name: '灵活短租',
    desc: '适合项目型团队或过渡办公',
    icon: Clock,
    monthlyRent: 1.1,
    rentIncreaseRate: 0,
    depositMonths: 1,
    freeRentDays: 15,
    minLeaseTerm: 6,
    maxLeaseTerm: 24,
    highlights: ['可短租', '押金仅1个月', '随时退租'],
  },
];

type CustomClause = {
  id: string;
  title: string;
  content: string;
};

function RentTerms({ property }: { property: Property }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [customClauses, setCustomClauses] = useState<CustomClause[]>([
    {
      id: '1',
      title: '装修条款',
      content: '租户可自行装修，装修方案需经物业审批通过后方可施工，装修押金为1个月租金。',
    },
    {
      id: '2',
      title: '转租条款',
      content: '租期内如需转租，需提前30天书面通知业主，经业主同意后方可转租。',
    },
  ]);

  const currentTemplate = useMemo(
    () => rentTemplates.find((t) => t.id === selectedTemplate)!,
    [selectedTemplate]
  );

  const effectiveRent = property.rentClause.monthlyRent * currentTemplate.monthlyRent;

  const clauseItems: { icon: LucideIcon; label: string; value: string | number; unit?: string }[] = [
    {
      icon: Banknote,
      label: '月租单价',
      value: `¥${effectiveRent.toFixed(2)}`,
      unit: property.rentClause.rentUnit,
    },
    { icon: CreditCard, label: '付款方式', value: property.rentClause.paymentMethod },
    {
      icon: Percent,
      label: '年递增率',
      value: currentTemplate.rentIncreaseRate,
      unit: '%',
    },
    { icon: Banknote, label: '押金月数', value: currentTemplate.depositMonths, unit: '个月' },
    { icon: Clock, label: '免租期', value: currentTemplate.freeRentDays, unit: '天' },
    { icon: CalendarDays, label: '最短租期', value: currentTemplate.minLeaseTerm, unit: '个月' },
    { icon: CalendarDays, label: '最长租期', value: currentTemplate.maxLeaseTerm, unit: '个月' },
  ];

  const addClause = () => {
    const newClause: CustomClause = {
      id: Date.now().toString(),
      title: '新条款',
      content: '',
    };
    setCustomClauses((prev) => [...prev, newClause]);
  };

  const removeClause = (id: string) => {
    setCustomClauses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card-base p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <FileText className="w-4 h-4 text-gold-400" />
          </div>
          <h3 className="text-base font-bold animate-shimmer-gold">租赁条款</h3>
        </div>
        <div className="divider-gold mb-5" />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {clauseItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-lg bg-primary-900/40 border border-gold-500/10 p-3"
              >
                <Icon className="w-4 h-4 text-gold-400/70 mb-1.5" />
                <p className="text-[10px] text-neutral-500">{item.label}</p>
                <p className="text-sm font-semibold text-neutral-100 mt-0.5">
                  {item.value}
                  {item.unit && (
                    <span className="text-[10px] text-neutral-400 font-normal ml-0.5">
                      {item.unit}
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="card-base p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-gold-400" />
          </div>
          <h3 className="text-base font-bold animate-shimmer-gold">租赁模板</h3>
        </div>
        <div className="divider-gold mb-5" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rentTemplates.map((template) => {
            const Icon = template.icon;
            const selected = selectedTemplate === template.id;
            return (
              <motion.button
                key={template.id}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  'relative text-left rounded-xl p-4 border transition-all',
                  selected
                    ? 'bg-gold-500/10 border-gold-500/50 ring-2 ring-gold-400/20'
                    : 'bg-primary-900/40 border-neutral-500/20 hover:border-gold-500/30'
                )}
              >
                {selected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-[10px] font-bold text-primary-900 shadow-lg">
                    ✓
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      selected
                        ? 'bg-gold-500/20 border border-gold-500/40'
                        : 'bg-primary-700/50 border border-neutral-500/20'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        selected ? 'text-gold-400' : 'text-neutral-400'
                      )}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        'text-sm font-bold',
                        selected ? 'animate-shimmer-gold' : 'text-neutral-100'
                      )}
                    >
                      {template.name}
                    </p>
                    <p className="text-[11px] text-neutral-500">{template.desc}</p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  {template.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-gold-400/70 shrink-0" />
                      <span className="text-xs text-neutral-300">{h}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-gold-500/10">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        'text-lg font-bold',
                        selected ? 'text-gold-300' : 'text-neutral-200'
                      )}
                    >
                      {(template.monthlyRent * 100).toFixed(0)}%
                    </span>
                    <span className="text-[11px] text-neutral-500">基准租金</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="card-base p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-gold-400" />
            </div>
            <h3 className="text-base font-bold animate-shimmer-gold">自定义条款</h3>
          </div>
          <button onClick={addClause} className="btn-gold !py-1.5 !px-3 !text-xs">
            <Plus className="w-3.5 h-3.5" />
            添加条款
          </button>
        </div>
        <div className="divider-gold mb-4" />

        <div className="space-y-3">
          {customClauses.map((clause, idx) => (
            <motion.div
              key={clause.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="relative rounded-lg bg-primary-900/40 border border-gold-500/10 p-4 group"
            >
              <button
                onClick={() => removeClause(clause.id)}
                className="absolute top-3 right-3 w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold-500/15 border border-gold-500/30 text-[10px] font-bold text-gold-300">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={clause.title}
                  onChange={(e) => {
                    setCustomClauses((prev) =>
                      prev.map((c) =>
                        c.id === clause.id ? { ...c, title: e.target.value } : c
                      )
                    );
                  }}
                  className="flex-1 bg-transparent text-sm font-semibold text-neutral-100 outline-none border-b border-transparent focus:border-gold-500/40 transition-colors"
                />
              </div>
              <textarea
                value={clause.content}
                onChange={(e) => {
                  setCustomClauses((prev) =>
                    prev.map((c) =>
                      c.id === clause.id ? { ...c, content: e.target.value } : c
                    )
                  );
                }}
                rows={2}
                className="w-full bg-primary-900/30 rounded-md border border-gold-500/10 px-3 py-2 text-xs text-neutral-300 outline-none focus:border-gold-500/40 resize-none transition-colors"
                placeholder="输入条款内容..."
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('vr');

  const property: Property | undefined = useMemo(
    () => mockProperties.find((p) => p.id === id),
    [id]
  );

  if (!property) {
    return (
      <div className="min-h-screen bg-mesh-tech p-6 flex items-center justify-center">
        <div className="card-base p-12 text-center max-w-md">
          <Building2 className="w-16 h-16 mx-auto text-neutral-500/40" />
          <h2 className="mt-4 text-xl font-bold text-neutral-200">房源不存在</h2>
          <p className="mt-2 text-sm text-neutral-400">未找到编号为 {id} 的房源信息</p>
          <button onClick={() => navigate('/properties')} className="btn-primary mt-6">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-tech p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/properties')}
              className="w-10 h-10 rounded-lg bg-primary-900/60 border border-gold-500/20 flex items-center justify-center text-neutral-300 hover:border-gold-500/40 hover:text-gold-300 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold animate-shimmer-gold">{property.name}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gold-400/60" />
                  {property.location.city} {property.location.district}
                </span>
                <span>编号: {property.code}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 text-xs text-neutral-400 mr-2">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                浏览 {property.totalViews.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {property.ownerName}
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {property.ownerPhone}
              </span>
            </div>
            <button className="btn-primary" onClick={() => navigate(`/orders/create?propertyId=${property.id}`)}>
              <FileText className="w-4 h-4" />
              发起装修
            </button>
            <button className="btn-gold">
              <Phone className="w-4 h-4" />
              联系业主
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="w-4 h-4 text-gold-400/70" />
              <span className="text-[11px] text-neutral-500">建筑面积</span>
            </div>
            <p className="text-xl font-bold glow-text-gold">{property.spec.area}<span className="text-xs text-neutral-500 ml-1">㎡</span></p>
          </div>
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-gold-400/70" />
              <span className="text-[11px] text-neutral-500">层高</span>
            </div>
            <p className="text-xl font-bold text-neutral-100">{property.spec.ceilingHeight}<span className="text-xs text-neutral-500 ml-1">m</span></p>
          </div>
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-2">
              <Box className="w-4 h-4 text-gold-400/70" />
              <span className="text-[11px] text-neutral-500">承重</span>
            </div>
            <p className="text-xl font-bold text-neutral-100">{property.spec.loadCapacity}<span className="text-xs text-neutral-500 ml-1">kg/㎡</span></p>
          </div>
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-gold-400/70" />
              <span className="text-[11px] text-neutral-500">消防验收</span>
            </div>
            <p className={cn(
              "text-lg font-bold",
              property.ownership.fireInspectionStatus === '已通过' ? 'text-emerald-400' :
              property.ownership.fireInspectionStatus === '待验收' ? 'text-amber-400' :
              property.ownership.fireInspectionStatus === '整改中' ? 'text-rose-400' : 'text-neutral-400'
            )}>
              {property.ownership.fireInspectionStatus}
            </p>
          </div>
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-4 h-4 text-gold-400/70" />
              <span className="text-[11px] text-neutral-500">月租金</span>
            </div>
            <p className="text-xl font-bold glow-text-gold">¥{property.rentClause.monthlyRent}<span className="text-xs text-neutral-500 ml-1">/㎡·天</span></p>
          </div>
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-gold-400/70" />
              <span className="text-[11px] text-neutral-500">付款方式</span>
            </div>
            <p className="text-lg font-bold text-neutral-100">{property.rentClause.paymentMethod}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="card-base p-1.5"
        >
          <div className="flex gap-1 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'relative flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'text-gold-300'
                      : 'text-neutral-400 hover:text-neutral-200'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(212,168,83,0.18) 0%, rgba(212,168,83,0.05) 100%)',
                        boxShadow: 'inset 0 0 0 1px rgba(212, 168, 83, 0.25)',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon className={cn('w-4 h-4 relative z-10', active && 'drop-shadow-[0_0_6px_rgba(212,168,83,0.5)]')} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'vr' && <VRViewer property={property} />}
          {activeTab === 'ownership' && <OwnershipInfo property={property} />}
          {activeTab === 'rent' && <RentTerms property={property} />}
        </div>
      </div>
    </div>
  );
}
