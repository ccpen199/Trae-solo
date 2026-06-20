import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
  Smartphone, Camera, Watch, Briefcase, Gem, Laptop,
  Search, Sparkles, TrendingUp, TrendingDown,
  FileSearch, Truck, Banknote, ShieldCheck, Leaf,
  Award, Gauge, RefreshCw, Barcode,
  ChevronRight, ArrowRight, MessageCircle,
  ChevronDown, ChevronUp, Zap, CheckCircle2,
  X, Plus, Minus, Clock, MapPin, Users,
  Calendar, Package, Eye, FileCheck, QrCode,
  Download, AlertTriangle, Flame, Award as Trophy,
  Trash2, Heart, Building2, Shield, UserCheck,
  Activity, Target, ZapOff, CircleDot, BanknoteIcon,
  PackageCheck, Truck as TruckIcon, RefreshCcw,
  ScanEye, BadgeCheck, ShieldAlert, BarChart3,
  PieChart, AlertOctagon, Bell, MessageSquare,
  Phone, Globe, Wifi, Battery, Cpu, HardDrive,
  Camera as CameraIcon, Mic, Volume2, Fingerprint,
  MonitorSpeaker, Layers, Boxes, CircleDollarSign,
  Calculator, Database, ClipboardCheck, Info,
  XCircle, Share2, Lock as LockIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { CountUp } from '@/components/ui/CountUp';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { MarketTicker, LatestDeal, TimelineItem, GradeLevel } from '@/types';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

type CategoryId = 'phone' | 'camera' | 'watch' | 'bag' | 'jewelry' | 'laptop';
type GradeId = 'S' | 'A+' | 'A' | 'B+' | 'B';

interface BrandOption {
  id: string;
  name: string;
  avgPrice: number;
  hotModel?: string;
}

const categoryBrands: Record<CategoryId, BrandOption[]> = {
  phone: [
    { id: 'apple', name: 'Apple iPhone', avgPrice: 6800, hotModel: '15 Pro Max' },
    { id: 'huawei', name: '华为 Mate/Pura', avgPrice: 5200, hotModel: 'Mate 60 Pro+' },
    { id: 'samsung', name: '三星 Galaxy', avgPrice: 4500, hotModel: 'S24 Ultra' },
    { id: 'xiaomi', name: '小米 Ultra', avgPrice: 3200, hotModel: '15 Ultra' },
    { id: 'oppo', name: 'OPPO Find', avgPrice: 2800, hotModel: 'Find X7 Ultra' },
  ],
  camera: [
    { id: 'sony', name: '索尼 Alpha', avgPrice: 15800, hotModel: 'A7 IV' },
    { id: 'canon', name: '佳能 EOS R', avgPrice: 18500, hotModel: 'R5 Mark II' },
    { id: 'nikon', name: '尼康 Z', avgPrice: 16200, hotModel: 'Z8' },
    { id: 'leica', name: '徕卡 Q/M', avgPrice: 48000, hotModel: 'Q3' },
    { id: 'fujifilm', name: '富士 GFX/X', avgPrice: 12800, hotModel: 'X-T5' },
  ],
  watch: [
    { id: 'rolex', name: 'Rolex 劳力士', avgPrice: 89500, hotModel: 'Submariner 126610LN' },
    { id: 'omega', name: 'Omega 欧米茄', avgPrice: 32500, hotModel: 'Seamaster 300' },
    { id: 'ap', name: 'Audemars Piguet', avgPrice: 285000, hotModel: 'Royal Oak 15500ST' },
    { id: 'patek', name: 'Patek Philippe', avgPrice: 680000, hotModel: 'Nautilus 5711' },
    { id: 'iwc', name: 'IWC 万国', avgPrice: 42000, hotModel: 'Portugieser IW5035' },
  ],
  bag: [
    { id: 'hermes', name: 'Hermès 爱马仕', avgPrice: 185000, hotModel: 'Birkin 30 Togo' },
    { id: 'chanel', name: 'Chanel 香奈儿', avgPrice: 58500, hotModel: 'Classic Flap CF Medium' },
    { id: 'lv', name: 'Louis Vuitton', avgPrice: 22000, hotModel: 'Neverfull MM' },
    { id: 'dior', name: 'Dior 迪奥', avgPrice: 32800, hotModel: 'Lady Dior Medium' },
    { id: 'gucci', name: 'Gucci 古驰', avgPrice: 12500, hotModel: 'Dionysus GG' },
  ],
  jewelry: [
    { id: 'cartier', name: 'Cartier 卡地亚', avgPrice: 58000, hotModel: 'Love 手镯 18K 金' },
    { id: 'vca', name: 'Van Cleef & Arpels', avgPrice: 85000, hotModel: 'Alhambra 四叶草' },
    { id: 'bvlgari', name: 'Bvlgari 宝格丽', avgPrice: 42000, hotModel: 'B.Zero1 弹簧' },
    { id: 'tiffany', name: 'Tiffany 蒂芙尼', avgPrice: 28000, hotModel: 'T系列 18K金' },
    { id: 'graff', name: 'Graff 格拉夫', avgPrice: 168000, hotModel: 'Spiral 钻' },
  ],
  laptop: [
    { id: 'macbook', name: 'Apple MacBook', avgPrice: 9800, hotModel: 'Pro 16 M3 Max' },
    { id: 'thinkpad', name: 'ThinkPad X1', avgPrice: 8500, hotModel: 'Carbon Gen 12' },
    { id: 'dellxps', name: 'Dell XPS', avgPrice: 7200, hotModel: 'XPS 15' },
    { id: 'surface', name: 'Surface Laptop', avgPrice: 6800, hotModel: 'Laptop Studio 2' },
    { id: 'rog', name: 'ROG 游戏本', avgPrice: 11500, hotModel: 'Strix G18' },
  ],
};

const gradeMultipliers: Record<GradeId, { label: string; multiplier: number; color: string; bg: string }> = {
  'S':  { label: 'S 级 (99新)', multiplier: 0.92, color: 'text-jade-400', bg: 'bg-jade-500/15 border-jade-500/30' },
  'A+': { label: 'A+ 级 (98新)', multiplier: 0.85, color: 'text-forest-300', bg: 'bg-forest-500/15 border-forest-500/30' },
  'A':  { label: 'A 级 (95新)', multiplier: 0.78, color: 'text-gold-400', bg: 'bg-gold-500/15 border-gold-500/30' },
  'B+': { label: 'B+ 级 (9新)', multiplier: 0.70, color: 'text-amberLux-400', bg: 'bg-amberLux-500/15 border-amberLux-500/30' },
  'B':  { label: 'B 级 (85新)', multiplier: 0.62, color: 'text-coral-400', bg: 'bg-coral-500/15 border-coral-500/30' },
};

const categories = [
  { id: 'phone' as CategoryId, name: '手机', icon: 'smartphone', avgPrice: '¥5,200', gradient: 'from-forest-600/30 via-forest-700/20 to-transparent', Icon: Smartphone },
  { id: 'camera' as CategoryId, name: '相机', icon: 'camera', avgPrice: '¥16,800', gradient: 'from-forest-500/30 via-teal-700/20 to-transparent', Icon: Camera },
  { id: 'watch' as CategoryId, name: '名表', icon: 'watch', avgPrice: '¥68,000', gradient: 'from-gold-500/30 via-amber-600/20 to-transparent', Icon: Watch },
  { id: 'bag' as CategoryId, name: '包包', icon: 'briefcase', avgPrice: '¥35,000', gradient: 'from-gold-400/30 via-orange-600/20 to-transparent', Icon: Briefcase },
  { id: 'jewelry' as CategoryId, name: '珠宝', icon: 'gem', avgPrice: '¥55,000', gradient: 'from-forest-400/30 via-emerald-600/20 to-transparent', Icon: Gem },
  { id: 'laptop' as CategoryId, name: '笔记本', icon: 'laptop', avgPrice: '¥8,200', gradient: 'from-forest-500/30 via-cyan-700/20 to-transparent', Icon: Laptop },
];

const luxuryBrands = [
  'ROLEX', 'PATEK', 'AP', 'HERMÈS', 'CHANEL', 'LV', 'DIOR', 'CARTIER',
  'VCA', 'BVLGARI', 'TIFFANY', 'GUCCI', 'PRADA', 'FENDI', 'LOEWE',
  'APPLE', 'HUAWEI', 'SONY', 'CANON', 'NIKON', 'LEICA', 'RICHMOND',
  'OMEGA', 'IWC', 'JAEGER', 'BREITLING',
];

const marketTickers: MarketTicker[] = [
  { brand: 'Rolex', model: 'Submariner', price: 89500, change: 2.35 },
  { brand: 'Hermès', model: 'Birkin 30', price: 238000, change: 4.12 },
  { brand: 'Apple', model: 'iPhone 15PM', price: 8200, change: -1.08 },
  { brand: 'Cartier', model: 'Tank Solo', price: 32800, change: 1.56 },
  { brand: 'Chanel', model: 'Classic Flap', price: 68500, change: 3.21 },
  { brand: 'LV', model: 'Speedy 25', price: 18200, change: 0.89 },
  { brand: 'Sony', model: 'A7IV', price: 15800, change: -0.45 },
];

const processSteps = [
  { title: '发起估价', desc: '30秒智能估价', Icon: FileSearch, anchor: '#quick-evaluate' },
  { title: '上门检测', desc: '免费专人服务', Icon: Truck, anchor: '#city-network' },
  { title: '即时打款', desc: '验机秒到账', Icon: Banknote, anchor: '#instant-pay' },
  { title: '30天保障', desc: '无忧售后', Icon: ShieldCheck, anchor: '#return-fulfill' },
  { title: '环保贡献', desc: '绿色循环', Icon: Leaf, anchor: '#eco-contrib' },
];

const latestDeals: (LatestDeal & { time: string; serial: string; defects: string[]; functionPass: number; functionTotal: number })[] = [
  { id: '1', brand: 'Rolex', model: 'Submariner Date', grade: 'S', price: 89500, initial: 'R', gradient: 'from-forest-600/60 to-forest-800/60', time: '10分钟前', serial: 'RX5711-1A0108', defects: ['左表耳微痕 0.2mm', '表扣轻微花痕'], functionPass: 12, functionTotal: 12 },
  { id: '2', brand: 'Hermès', model: 'Birkin 30 Epsom', grade: 'A', price: 218000, initial: 'H', gradient: 'from-amber-600/60 to-gold-700/60', time: '25分钟前', serial: 'HK-B30-EP2024', defects: ['提手底部轻微磨损'], functionPass: 10, functionTotal: 10 },
  { id: '3', brand: 'Apple', model: 'iPhone 15 Pro Max 512', grade: 'S', price: 9200, initial: 'A', gradient: 'from-slate-600/60 to-ink-800/60', time: '32分钟前', serial: 'F2LXJ4K8Q0L9', defects: [], functionPass: 12, functionTotal: 12 },
  { id: '4', brand: 'Chanel', model: 'Classic Flap Medium', grade: 'A', price: 62800, initial: 'C', gradient: 'from-gold-500/60 to-amber-700/60', time: '48分钟前', serial: 'CF-M-LMB287', defects: ['边角轻微磨损 1处'], functionPass: 10, functionTotal: 10 },
  { id: '5', brand: 'Louis Vuitton', model: 'Neverfull MM', grade: 'B', price: 9800, initial: 'L', gradient: 'from-amber-700/60 to-yellow-800/60', time: '1小时前', serial: 'LV-NF-MM412', defects: ['内衬染色 2处', '肩带使用痕迹'], functionPass: 8, functionTotal: 10 },
  { id: '6', brand: 'Cartier', model: 'Love Bracelet 18K', grade: 'S', price: 48500, initial: 'C', gradient: 'from-gold-600/60 to-gold-800/60', time: '1.5小时前', serial: 'CR-LOVE-18K-76', defects: [], functionPass: 8, functionTotal: 8 },
  { id: '7', brand: 'Sony', model: 'A7R V 机身', grade: 'A', price: 22800, initial: 'S', gradient: 'from-forest-700/60 to-teal-800/60', time: '2小时前', serial: 'SN-A7RV-400218', defects: ['底盖轻微划痕'], functionPass: 12, functionTotal: 12 },
  { id: '8', brand: 'Omega', model: 'Seamaster 300', grade: 'A', price: 32500, initial: 'O', gradient: 'from-forest-600/60 to-blue-800/60', time: '2.5小时前', serial: 'OM-SMP-21030', defects: ['表圈微痕 1处'], functionPass: 12, functionTotal: 12 },
  { id: '9', brand: 'Dior', model: 'Lady Dior Mini', grade: 'S', price: 38500, initial: 'D', gradient: 'from-rose-600/60 to-gold-700/60', time: '3小时前', serial: 'DR-LDM-0528', defects: [], functionPass: 10, functionTotal: 10 },
  { id: '10', brand: 'Patek', model: 'Nautilus 5711', grade: 'S', price: 680000, initial: 'P', gradient: 'from-blue-800/70 to-forest-900/70', time: '4小时前', serial: 'PP-5711-1A-56', defects: [], functionPass: 12, functionTotal: 12 },
  { id: '11', brand: 'Gucci', model: 'GG Marmont', grade: 'B', price: 7200, initial: 'G', gradient: 'from-forest-700/60 to-emerald-900/60', time: '5小时前', serial: 'GC-GGM-4421', defects: ['链条褪色痕迹', '边角使用痕迹'], functionPass: 8, functionTotal: 10 },
  { id: '12', brand: 'Leica', model: 'Q2 全幅', grade: 'A', price: 38800, initial: 'L', gradient: 'from-rose-700/70 to-ink-900/70', time: '6小时前', serial: 'LC-Q2-52841', defects: ['热靴轻微磨损'], functionPass: 12, functionTotal: 12 },
];

interface InspectorProfile {
  id: string;
  name: string;
  avatar: string;
  level: 'S' | 'A';
  years: number;
  region: string;
  certs: { name: string; no: string; type: 'national' | 'brand' }[];
  totalOrders: number;
  flyCheckPass: number;
  avgDeviation: number;
  rating: number;
  deviation30d: number[];
}

const inspectors: InspectorProfile[] = [
  {
    id: 'INS-001',
    name: '王铭轩',
    avatar: 'W',
    level: 'S',
    years: 12,
    region: '上海',
    certs: [
      { name: '中检注册鉴定师', no: 'CIC-JD-2024-0821', type: 'national' },
      { name: '国字头奢侈品鉴定师', no: 'CAL-JD-2023-1156', type: 'national' },
      { name: 'Rolex 品牌专项认证', no: 'RLX-CERT-4821', type: 'brand' },
    ],
    totalOrders: 1285,
    flyCheckPass: 98.2,
    avgDeviation: 1.8,
    rating: 4.97,
    deviation30d: [1.2, 1.8, 2.1, 1.5, 1.9, 2.2, 1.6, 1.8, 2.0, 1.4, 1.7, 1.9, 2.3, 1.6, 1.5, 1.8, 2.0, 1.7, 1.3, 1.6, 1.9, 2.1, 1.8, 1.5, 1.7, 2.0, 1.6, 1.4, 1.8, 1.9],
  },
  {
    id: 'INS-028',
    name: '李思雨',
    avatar: 'L',
    level: 'S',
    years: 9,
    region: '北京',
    certs: [
      { name: '中检注册鉴定师', no: 'CIC-JD-2024-1102', type: 'national' },
      { name: '国字头奢侈品鉴定师', no: 'CAL-JD-2022-0875', type: 'national' },
      { name: 'Hermès 品牌专项认证', no: 'HMS-CERT-2156', type: 'brand' },
    ],
    totalOrders: 982,
    flyCheckPass: 97.8,
    avgDeviation: 2.1,
    rating: 4.95,
    deviation30d: [2.1, 1.9, 2.5, 2.2, 1.8, 2.3, 2.0, 1.7, 2.4, 2.1, 1.9, 2.2, 2.6, 1.8, 2.0, 2.3, 1.9, 2.1, 2.4, 1.7, 2.2, 2.0, 1.8, 2.3, 2.1, 2.5, 1.9, 2.2, 2.0, 1.8],
  },
  {
    id: 'INS-035',
    name: '陈浩然',
    avatar: 'C',
    level: 'A',
    years: 7,
    region: '深圳',
    certs: [
      { name: '中检注册鉴定师', no: 'CIC-JD-2025-0328', type: 'national' },
      { name: '国字头奢侈品鉴定师', no: 'CAL-JD-2024-0442', type: 'national' },
      { name: 'Audemars Piguet 专项', no: 'AP-CERT-0823', type: 'brand' },
    ],
    totalOrders: 756,
    flyCheckPass: 96.5,
    avgDeviation: 2.6,
    rating: 4.92,
    deviation30d: [2.5, 2.8, 2.2, 3.1, 2.6, 2.4, 2.9, 2.7, 2.3, 2.8, 3.0, 2.5, 2.7, 2.4, 2.9, 2.6, 3.2, 2.5, 2.8, 2.3, 2.7, 3.0, 2.6, 2.4, 2.8, 2.9, 2.5, 2.7, 2.3, 2.6],
  },
];

const rolexYearCodes: { code: string; year: string }[] = [
  { code: 'R', year: '1987' }, { code: 'L', year: '1989' }, { code: 'E', year: '1990' },
  { code: 'X', year: '1991' }, { code: 'N', year: '1992' }, { code: 'C', year: '1993' },
  { code: 'S', year: '1994' }, { code: 'W', year: '1995' }, { code: 'T', year: '1996' },
  { code: 'U', year: '1997' }, { code: 'A', year: '1998' }, { code: 'P', year: '2000' },
  { code: 'K', year: '2001' }, { code: 'Y', year: '2002' }, { code: 'F', year: '2003' },
  { code: 'D', year: '2005' }, { code: 'Z', year: '2006' }, { code: 'M', year: '2007' },
  { code: 'V', year: '2008' }, { code: 'G', year: '2010' }, { code: '1~', year: '2011' },
  { code: '2~', year: '2012' }, { code: '3~', year: '2013' }, { code: '4~', year: '2014' },
  { code: '5~', year: '2015' }, { code: '6~', year: '2016' }, { code: '7~', year: '2017' },
  { code: '8~', year: '2018' }, { code: '9~', year: '2019' }, { code: '0字头', year: '2026' },
];

const hermesYearCodes: { letter: string; shape: '○' | '□'; year: string }[] = [
  { letter: 'A', shape: '○', year: '1945' }, { letter: 'B', shape: '○', year: '1946' },
  { letter: 'T', shape: '○', year: '1967' }, { letter: 'Y', shape: '○', year: '1971' },
  { letter: 'A', shape: '□', year: '1971' }, { letter: 'B', shape: '□', year: '1972' },
  { letter: 'X', shape: '□', year: '1994' }, { letter: 'D', shape: '○', year: '2000' },
  { letter: 'G', shape: '○', year: '2003' }, { letter: 'J', shape: '□', year: '2006' },
  { letter: 'N', shape: '□', year: '2010' }, { letter: 'R', shape: '□', year: '2014' },
  { letter: 'X', shape: '○', year: '2016' }, { letter: 'A', shape: '○', year: '2017' },
  { letter: 'D', shape: '□', year: '2019' }, { letter: 'Y', shape: '□', year: '2020' },
  { letter: 'B', shape: '□', year: '2023' }, { letter: 'C', shape: '□', year: '2024' },
  { letter: 'D', shape: '○', year: '2025' }, { letter: 'E', shape: '○', year: '2026' },
];

const returnTimeline: TimelineItem[] = [
  { id: '1', title: '提交退货申请', description: '理由：佩戴效果不满意 | 凭证上传3张', time: '6/18 15:30', status: 'done' },
  { id: '2', title: '客服响应审核通过', description: '客服专员：李小姐 | 审核耗时 35 分钟', time: '6/18 16:05', status: 'done' },
  { id: '3', title: '顺丰上门取件', description: '运单号 SF1234567890 | 快递员：王师傅', time: '6/19 10:20', status: 'done' },
  { id: '4', title: '中心仓收货复检', description: '外观一致 ✅ 功能完整 ✅ 无人为损坏', time: '6/20 09:15', status: 'done' },
  { id: '5', title: '退款原路返回', description: '退款 ¥38,500 → 工商银行 ****8888', time: '6/20 14:30', status: 'done' },
  { id: '6', title: '用户到账确认', description: '到账短信已发送 | 服务评价 5★', time: '6/20 14:45', status: 'active' },
];

const citiesData = [
  { name: '上海', region: '华东', inspectors: 58, freeTime: '今日 14:00-20:00', arrivalTime: '45min', orders: 2850, premium: 18, areas: '静安/黄浦/浦东/徐汇/长宁', lng: 121.47, lat: 31.23 },
  { name: '杭州', region: '华东', inspectors: 32, freeTime: '今日 15:00-20:00', arrivalTime: '55min', orders: 1680, premium: 17, areas: '西湖/上城/滨江/余杭', lng: 120.15, lat: 30.28 },
  { name: '南京', region: '华东', inspectors: 24, freeTime: '明日 09:00-12:00', arrivalTime: '60min', orders: 1120, premium: 15, areas: '鼓楼/秦淮/建邺/江宁', lng: 118.78, lat: 32.07 },
  { name: '苏州', region: '华东', inspectors: 18, freeTime: '今日 16:00-19:00', arrivalTime: '50min', orders: 890, premium: 16, areas: '姑苏/园区/吴中', lng: 120.62, lat: 31.32 },
  { name: '宁波', region: '华东', inspectors: 15, freeTime: '明日 10:00-14:00', arrivalTime: '65min', orders: 720, premium: 15, areas: '海曙/鄞州/江北', lng: 121.55, lat: 29.87 },
  { name: '北京', region: '华北', inspectors: 52, freeTime: '今日 14:00-20:00', arrivalTime: '50min', orders: 2580, premium: 18, areas: '朝阳/海淀/西城/东城/丰台', lng: 116.40, lat: 39.90 },
  { name: '天津', region: '华北', inspectors: 18, freeTime: '明日 09:00-13:00', arrivalTime: '65min', orders: 860, premium: 14, areas: '和平/河西/南开/滨海', lng: 117.20, lat: 39.08 },
  { name: '青岛', region: '华北', inspectors: 14, freeTime: '今日 15:00-18:00', arrivalTime: '70min', orders: 680, premium: 14, areas: '市南/市北/崂山', lng: 120.38, lat: 36.07 },
  { name: '济南', region: '华北', inspectors: 12, freeTime: '明日 10:00-15:00', arrivalTime: '75min', orders: 540, premium: 13, areas: '历下/市中/槐荫', lng: 117.00, lat: 36.67 },
  { name: '深圳', region: '华南', inspectors: 45, freeTime: '今日 14:00-21:00', arrivalTime: '40min', orders: 2320, premium: 18, areas: '南山/福田/罗湖/宝安/龙华', lng: 114.06, lat: 22.55 },
  { name: '广州', region: '华南', inspectors: 38, freeTime: '今日 15:00-20:00', arrivalTime: '50min', orders: 1980, premium: 17, areas: '天河/越秀/海珠/番禺/白云', lng: 113.27, lat: 23.13 },
  { name: '厦门', region: '华南', inspectors: 16, freeTime: '明日 09:00-13:00', arrivalTime: '60min', orders: 780, premium: 15, areas: '思明/湖里/集美', lng: 118.08, lat: 24.48 },
  { name: '福州', region: '华南', inspectors: 10, freeTime: '明日 10:00-15:00', arrivalTime: '70min', orders: 450, premium: 13, areas: '鼓楼/台江/仓山', lng: 119.30, lat: 26.08 },
  { name: '成都', region: '西南', inspectors: 28, freeTime: '今日 14:00-19:00', arrivalTime: '55min', orders: 1420, premium: 16, areas: '锦江/青羊/高新/武侯', lng: 104.07, lat: 30.67 },
  { name: '重庆', region: '西南', inspectors: 22, freeTime: '今日 15:00-20:00', arrivalTime: '65min', orders: 1150, premium: 15, areas: '渝中/江北/南岸/渝北', lng: 106.55, lat: 29.56 },
  { name: '昆明', region: '西南', inspectors: 10, freeTime: '明日 10:00-14:00', arrivalTime: '70min', orders: 380, premium: 13, areas: '五华/盘龙/官渡', lng: 102.71, lat: 25.04 },
  { name: '武汉', region: '其他', inspectors: 18, freeTime: '今日 14:00-18:00', arrivalTime: '55min', orders: 890, premium: 14, areas: '江岸/江汉/武昌/洪山', lng: 114.31, lat: 30.59 },
  { name: '西安', region: '其他', inspectors: 16, freeTime: '明日 09:00-13:00', arrivalTime: '60min', orders: 760, premium: 14, areas: '雁塔/碑林/高新/未央', lng: 108.95, lat: 34.27 },
  { name: '长沙', region: '其他', inspectors: 12, freeTime: '今日 15:00-19:00', arrivalTime: '65min', orders: 580, premium: 13, areas: '芙蓉/雨花/岳麓/开福', lng: 112.94, lat: 28.23 },
  { name: '郑州', region: '其他', inspectors: 10, freeTime: '明日 10:00-14:00', arrivalTime: '70min', orders: 420, premium: 12, areas: '金水/二七/管城/郑东', lng: 113.65, lat: 34.76 },
  { name: '沈阳', region: '其他', inspectors: 10, freeTime: '明日 09:00-13:00', arrivalTime: '65min', orders: 380, premium: 12, areas: '和平/沈河/铁西/皇姑', lng: 123.43, lat: 41.81 },
];

const ecoRankData = [
  { rank: 1, name: '王**', carbon: 485, units: 12, medal: '🥇' },
  { rank: 2, name: '李**', carbon: 412, units: 9, medal: '🥈' },
  { rank: 3, name: '张**', carbon: 368, units: 11, medal: '🥉' },
  { rank: 4, name: '陈**', carbon: 328, units: 8, medal: '' },
  { rank: 5, name: '刘**', carbon: 295, units: 7, medal: '' },
  { rank: 6, name: '赵**', carbon: 268, units: 6, medal: '' },
  { rank: 7, name: '孙**', carbon: 245, units: 5, medal: '' },
  { rank: 8, name: '周**', carbon: 222, units: 6, medal: '' },
  { rank: 9, name: '吴**', carbon: 198, units: 4, medal: '' },
  { rank: 10, name: '郑**', carbon: 185, units: 5, medal: '' },
];

const slowMovingItems = [
  { brand: 'TAG Heuer', model: 'Carrera Calibre 5', days: 72, cost: 18500, price: 26800, suggestion: '降价拍卖 10%' },
  { brand: 'Prada', model: 'Galleria Saffiano 中号', days: 68, cost: 8800, price: 13800, suggestion: '翻新后上架' },
  { brand: 'Huawei', model: 'Mate X5 典藏版', days: 65, cost: 15800, price: 19800, suggestion: '降价拍卖 8%' },
  { brand: 'Longines', model: 'Master 名匠月相', days: 62, cost: 12500, price: 18500, suggestion: '翻新后上架' },
  { brand: 'Canon', model: 'EOS R5 套机', days: 61, cost: 32800, price: 38500, suggestion: '拆解回收零件' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // ============ Section 1: Hero 快速估价状态 ============
  const [evalCategory, setEvalCategory] = React.useState<CategoryId>('watch');
  const [evalBrand, setEvalBrand] = React.useState<string>('rolex');
  const [evalGrade, setEvalGrade] = React.useState<GradeId>('S');
  const [quoteLoading, setQuoteLoading] = React.useState(false);
  const [showQuote, setShowQuote] = React.useState(false);
  const [quoteResult, setQuoteResult] = React.useState<{ instant: number; standard: number; consignment: number; xianyuDiff: number } | null>(null);

  // ============ Section 2: 验真 Tab 状态 ============
  const [authTab, setAuthTab] = React.useState('phone');
  const [phoneSerial, setPhoneSerial] = React.useState('F2LXJ4K8Q0L9');
  const [parsedSerial, setParsedSerial] = React.useState<null | { factory: string; date: string; model: string; color: string }>(null);

  // ============ Section 3: 品类展开状态 ============
  const [expandedCat, setExpandedCat] = React.useState<CategoryId | null>(null);

  // ============ Section 5: 即时打款案例 ============
  const [showPayDemo, setShowPayDemo] = React.useState(false);

  // ============ Section 6: 成交详情展开 ============
  const [expandedDeal, setExpandedDeal] = React.useState<string | null>(null);

  // ============ Section 7: 退货详情展开 ============
  const [expandedReturnStep, setExpandedReturnStep] = React.useState<string | null>('1');

  // ============ Section 8: 城市筛选 ============
  const [cityRegion, setCityRegion] = React.useState('华东');

  // ============ Section 9: 环保计算器 ============
  const [ecoCategory, setEcoCategory] = React.useState<CategoryId>('phone');
  const [ecoBrand, setEcoBrand] = React.useState('apple');
  const [ecoCalcStage, setEcoCalcStage] = React.useState(0);

  // ============ Section 12: 客服弹窗 ============
  const [showSupport, setShowSupport] = React.useState(false);

  // ============ Section 1: 生成报价 ============
  const generateQuote = () => {
    setQuoteLoading(true);
    setShowQuote(false);
    setTimeout(() => {
      const brand = categoryBrands[evalCategory].find(b => b.id === evalBrand);
      const basePrice = brand?.avgPrice || 10000;
      const mult = gradeMultipliers[evalGrade].multiplier;
      const core = Math.round(basePrice * mult);
      setQuoteResult({
        instant: Math.round(core * 0.88),
        standard: core,
        consignment: Math.round(core * 1.12),
        xianyuDiff: 15 + Math.floor(Math.random() * 8),
      });
      setQuoteLoading(false);
      setShowQuote(true);
    }, 1500);
  };

  // ============ Section 2: 序列号解析 ============
  const parsePhoneSerial = (sn: string) => {
    if (sn.length !== 12) return;
    const factoryMap: Record<string, string> = {
      'C': '深圳富士康', 'D': '成都富士康', 'F': '郑州富士康',
      'G0': '上海和硕', 'C3': '深圳观澜', 'DN': '成都'
    };
    const yearCode = sn[3];
    const weekCode = sn.substring(4, 6);
    const yearMap: Record<string, number> = { 'K': 2013, 'L': 2014, 'M': 2015, 'N': 2016, 'P': 2017, 'Q': 2018, 'R': 2019, 'T': 2020, 'V': 2021, 'W': 2022, 'X': 2023, 'Y': 2024, 'Z': 2025, '0': 2025, '1': 2026, '2': 2026, '3': 2027 };
    const factory = factoryMap[sn.substring(0, 2)] || factoryMap[sn[0]] || '未知工厂';
    const year = yearMap[yearCode] || 2024;
    const week = parseInt(weekCode, 36) || Math.floor(Math.random() * 52) + 1;
    const modelMap: Record<string, string> = {
      'J4': 'iPhone 15 Pro', 'K8': 'iPhone 15 Pro Max', 'QY': 'iPhone 15',
      'QP': 'iPhone 15 Plus', '3N': 'iPhone 14 Pro', '3P': 'iPhone 14 Pro Max'
    };
    const model = modelMap[sn.substring(6, 8)] || '旗舰型号';
    const colorMap: Record<string, string> = {
      'L9': '原色钛金属', 'LL': '深空黑', 'LX': '白色', 'LV': '蓝色',
      'Q0': '沙漠金', 'MT': '玫瑰金', 'FH': '暗夜绿'
    };
    const color = colorMap[sn.substring(10, 12)] || sn.substring(10, 12) + '号色';
    setParsedSerial({ factory, date: `${year}年 第${week}周`, model, color });
  };

  React.useEffect(() => {
    parsePhoneSerial(phoneSerial);
  }, [phoneSerial]);

  React.useEffect(() => {
    if (ecoCalcStage > 0 && ecoCalcStage < 5) {
      const t = setTimeout(() => setEcoCalcStage(s => s + 1), 400);
      return () => clearTimeout(t);
    }
  }, [ecoCalcStage]);

  const ecoCalc = React.useMemo(() => {
    const brand = categoryBrands[ecoCategory].find(b => b.id === ecoBrand);
    const baseCarbon = brand?.avgPrice ? Math.round(brand.avgPrice / 80) : 50;
    return {
      carbon: baseCarbon,
      oil: Math.round(baseCarbon * 0.42),
      ore: Math.round(baseCarbon * 1.15),
      waste: Math.round(baseCarbon * 0.68),
      trees: Math.ceil(baseCarbon / 18),
      kwh: Math.round(baseCarbon * 1.2),
      days: Math.round(baseCarbon * 1.2 / 15),
    };
  }, [ecoCategory, ecoBrand]);

  const currentBrands = categoryBrands[evalCategory];

  const inspectorChartOption = (data: number[]) => ({
    grid: { left: 30, right: 15, top: 15, bottom: 25 },
    tooltip: { trigger: 'axis', backgroundColor: '#15151F', borderColor: 'rgba(201,169,98,0.3)', textStyle: { color: '#D7D7E0', fontSize: 11 } },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
      axisLabel: { color: '#86869B', fontSize: 9, interval: 4 },
      axisLine: { lineStyle: { color: '#2E2E3D' } },
    },
    yAxis: {
      type: 'value',
      max: 6,
      axisLabel: { color: '#86869B', fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#22222F', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#2BA179', width: 2 },
        itemStyle: { color: '#2BA179' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(43,161,121,0.25)' }, { offset: 1, color: 'rgba(43,161,121,0)' }] },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed' },
          data: [
            { yAxis: 3, lineStyle: { color: '#F39C12' }, label: { formatter: '3% 预警线', color: '#F39C12', fontSize: 9, position: 'insideEndTop' } },
            { yAxis: 5, lineStyle: { color: '#E74C3C' }, label: { formatter: '5% 停训线', color: '#E74C3C', fontSize: 9, position: 'insideEndTop' } },
            { yAxis: 3.5, lineStyle: { color: 'rgba(231,76,60,0.5)' }, label: { formatter: '行业均值 3.5%', color: '#86869B', fontSize: 9 } },
          ],
        },
      },
    ],
  });

  const gaugeOption = {
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 8,
      radius: '90%',
      progress: { show: true, width: 14 },
      axisLine: {
        lineStyle: {
          width: 14,
          color: [
            [0.375, '#1DB954'],
            [0.625, '#F39C12'],
            [1, '#E74C3C'],
          ],
        },
      },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '5%'],
        fontSize: 28,
        fontWeight: 'bold',
        color: '#D4BA7A',
        formatter: '{value}%',
      },
      data: [{ value: 1.72, name: '平均偏差率' }],
    }],
  };

  const stockAgeOption = {
    tooltip: { trigger: 'item', backgroundColor: '#15151F', borderColor: 'rgba(201,169,98,0.3)', textStyle: { color: '#D7D7E0' } },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#B4B4C4', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    series: [{
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, color: '#D4BA7A' } },
      labelLine: { show: false },
      data: [
        { value: 52, name: '0-7天', itemStyle: { color: '#1DB954' } },
        { value: 28, name: '8-15天', itemStyle: { color: '#2BA179' } },
        { value: 15, name: '16-30天', itemStyle: { color: '#F39C12' } },
        { value: 5, name: '>30天', itemStyle: { color: '#E74C3C' } },
      ],
    }],
  };

  const channelProfitOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#15151F', borderColor: 'rgba(201,169,98,0.3)', textStyle: { color: '#D7D7E0' } },
    legend: { textStyle: { color: '#B4B4C4', fontSize: 10 }, itemWidth: 10, itemHeight: 10, top: 0 },
    grid: { left: 40, right: 10, top: 35, bottom: 25 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLabel: { color: '#86869B', fontSize: 10 },
      axisLine: { lineStyle: { color: '#2E2E3D' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#86869B', fontSize: 10, formatter: '{value}万' },
      splitLine: { lineStyle: { color: '#22222F', type: 'dashed' } },
    },
    series: [
      { name: '拍卖', type: 'bar', stack: 'total', data: [42, 48, 52, 58, 65, 72], itemStyle: { color: '#C9A962' } },
      { name: '翻新', type: 'bar', stack: 'total', data: [28, 32, 35, 42, 48, 55], itemStyle: { color: '#2BA179' } },
      { name: '二手', type: 'bar', stack: 'total', data: [35, 38, 42, 45, 52, 58], itemStyle: { color: '#15634B' } },
      { name: '拆解', type: 'bar', stack: 'total', data: [8, 10, 12, 14, 15, 18], itemStyle: { color: '#F39C12' } },
    ],
  };

  const selectedEcoBrand = categoryBrands[ecoCategory].find((brand) => brand.id === ecoBrand);
  const baseCarbon = { phone: 85, camera: 165, watch: 42, bag: 120, jewelry: 55, laptop: 180 }[ecoCategory];
  const ecoComputed = {
    carbon: baseCarbon + Math.floor(Math.random() * 30),
    oil: Math.floor(baseCarbon * 0.45),
    ore: Math.floor(baseCarbon * 0.8),
    waste: Math.floor(baseCarbon * 0.3),
    trees: Math.ceil((baseCarbon + 15) / 18),
    kwh: Math.floor(baseCarbon * 1.8),
    days: Math.floor(baseCarbon * 1.8 / 8),
  };

  return (
    <div className="flex flex-col">

      {/* ============================================================= */}
      {/* Section 1: Hero 估价入口 */}
      {/* ============================================================= */}
      <section id="quick-evaluate" className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient-bg" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-forest-600/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 rounded-full bg-gold-500/10 blur-[120px]" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <motion.div {...fadeUp} className="space-y-8 max-w-xl">
              <Badge variant="gold" dot>
                <Sparkles className="w-3 h-3" />
                行业领先 · 全国 38 城连锁
              </Badge>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-balance">
                <span className="text-ink-50">让每一件奢侈品，</span>
                <br />
                <span className="gold-text">遇见更高价值</span>
              </h1>

              <p className="text-lg text-ink-300 leading-relaxed max-w-lg">
                臻回收 - 专业奢侈品回收平台。AI 智能检测 + 300+ 持证专家双重保障，
                全国 38 城免费上门，三档阶梯报价让闲置奢品回归应有价值。
              </p>

              {/* 60秒快速估价四步入口 */}
              <div id="quick-evaluate" className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-ink-400">
                  <Zap className="w-4 h-4 text-gold-400" />
                  <span className="font-medium text-gold-300">60 秒快速估价</span>
                  <span className="text-ink-500">· 无需跳转，即刻出结果</span>
                </div>

                <div className="space-y-3 p-4 rounded-3xl bg-ink-850/70 border border-white/[0.08] backdrop-blur-xl shadow-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-ink-400 mb-1.5 block font-semibold">STEP 1 · 选择品类</label>
                      <select
                        value={evalCategory}
                        onChange={(e) => { setEvalCategory(e.target.value as CategoryId); setEvalBrand(categoryBrands[e.target.value as CategoryId][0].id); setShowQuote(false); }}
                        className="w-full h-12 px-4 rounded-2xl bg-ink-800/80 border border-white/[0.06] text-ink-100 text-sm font-medium focus:outline-none focus:border-gold-500/50 appearance-none cursor-pointer"
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-ink-400 mb-1.5 block font-semibold">STEP 2 · 品牌型号</label>
                      <select
                        value={evalBrand}
                        onChange={(e) => { setEvalBrand(e.target.value); setShowQuote(false); }}
                        className="w-full h-12 px-4 rounded-2xl bg-ink-800/80 border border-white/[0.06] text-ink-100 text-sm font-medium focus:outline-none focus:border-gold-500/50 appearance-none cursor-pointer"
                      >
                        {currentBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-ink-400 mb-1.5 block font-semibold">STEP 3 · 成色评估</label>
                      <select
                        value={evalGrade}
                        onChange={(e) => { setEvalGrade(e.target.value as GradeId); setShowQuote(false); }}
                        className={cn('w-full h-12 px-4 rounded-2xl border text-sm font-medium focus:outline-none appearance-none cursor-pointer', gradeMultipliers[evalGrade].bg, gradeMultipliers[evalGrade].color)}
                      >
                        {(Object.keys(gradeMultipliers) as GradeId[]).map(g => (
                          <option key={g} value={g} className="bg-ink-800 text-ink-100">{gradeMultipliers[g].label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button
                    onClick={generateQuote}
                    loading={quoteLoading}
                    disabled={quoteLoading}
                    className="w-full h-14 text-base animate-glow-pulse"
                  >
                    <Zap className="w-5 h-5" />
                    {quoteLoading ? 'AI 分析价格行情中...' : '⚡ 生成报价'}
                  </Button>
                </div>

                {/* 报价浮动卡片 */}
                <AnimatePresence>
                  {showQuote && quoteResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                      className="relative rounded-3xl overflow-hidden shadow-gold"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-ink-800/95 via-ink-850/95 to-ink-900/95" />
                      <div className="absolute inset-0 border border-gold-500/30 rounded-3xl" />
                      <div className="relative p-6 space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-ink-950" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-ink-50">估价完成</h4>
                              <p className="text-xs text-ink-400">
                                {categories.find(c => c.id === evalCategory)?.name} · {currentBrands.find(b => b.id === evalBrand)?.name} · {gradeMultipliers[evalGrade].label}
                              </p>
                            </div>
                          </div>
                          <Badge variant="gold" className="gap-1.5">
                            <TrendingUp className="w-3 h-3" />
                            比闲鱼高 {quoteResult.xianyuDiff}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-4 rounded-2xl bg-coral-500/10 border border-coral-500/20">
                            <p className="text-[10px] uppercase tracking-wider text-coral-400 font-bold">即时变现</p>
                            <p className="text-xs text-ink-400 mt-1">30分钟到账</p>
                            <p className="text-2xl font-bold text-ink-50 font-display mt-2">¥{quoteResult.instant.toLocaleString()}</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-gold-500/15 border border-gold-500/30 relative">
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                              <Badge variant="gold" className="text-[10px]">推荐</Badge>
                            </div>
                            <p className="text-[10px] uppercase tracking-wider text-gold-400 font-bold">标准交易</p>
                            <p className="text-xs text-ink-400 mt-1">验机后T+1</p>
                            <p className="text-2xl font-bold gold-text font-display mt-2">¥{quoteResult.standard.toLocaleString()}</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-jade-500/10 border border-jade-500/20">
                            <p className="text-[10px] uppercase tracking-wider text-jade-400 font-bold">寄售最高价</p>
                            <p className="text-xs text-ink-400 mt-1">成交后结算</p>
                            <p className="text-2xl font-bold text-ink-50 font-display mt-2">¥{quoteResult.consignment.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button variant="ghost" size="md" className="flex-1" onClick={() => navigate('/evaluate')}>
                            <FileSearch className="w-4 h-4" />
                            详细估价 →
                          </Button>
                          <Button size="md" className="flex-1" onClick={() => navigate('/evaluate')}>
                            <Calendar className="w-4 h-4" />
                            立即预约上门
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-6 text-xs text-ink-400">
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-jade-400" />隐私保护</div>
                <div className="flex items-center gap-2"><Award className="w-4 h-4 text-gold-400" />保价回收</div>
                <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-forest-400" />免费上门</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <Card goldBorder className="p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gold-400" />
                    <h3 className="font-semibold text-ink-50">实时行情滚动</h3>
                  </div>
                  <Badge variant="success" dot>实时更新</Badge>
                </div>
                <div className="divide-y divide-white/[0.04] max-h-52 overflow-hidden">
                  {marketTickers.map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-ink-700/50 border border-white/[0.06] flex items-center justify-center text-xs font-bold text-gold-400">
                          {t.brand[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink-100">{t.brand}</p>
                          <p className="text-xs text-ink-400">{t.model}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-ink-100">¥{t.price.toLocaleString()}</p>
                        <p className={`text-xs font-medium flex items-center gap-0.5 justify-end ${t.change >= 0 ? 'text-jade-400' : 'text-coral-400'}`}>
                          {t.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {t.change >= 0 ? '+' : ''}{t.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-3 gap-4">
                <motion.div variants={fadeUp}>
                  <StatCard
                    icon={<Award className="w-6 h-6" />}
                    label="累计回收件数"
                    value={<CountUp end={128650} suffix="+" />}
                    trend="up"
                    trendPercent="+12.5%"
                  />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <StatCard
                    icon={<Leaf className="w-6 h-6" />}
                    label="节省碳吨数"
                    value={<CountUp end={5200} suffix="吨" />}
                    trend="up"
                    trendPercent="+8.3%"
                  />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <StatCard
                    icon={<Gauge className="w-6 h-6" />}
                    label="平均溢价幅度"
                    value={<CountUp end={15.8} decimals={1} suffix="%" />}
                    trend="up"
                    trendPercent="+2.1%"
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================= */}
      {/* Section 2: 真伪校验规则可视化 */}
      {/* ============================================================= */}
      <section className="relative py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.2 }} {...fadeUp} className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="info">
              <ScanEye className="w-3 h-3" />
              验真规则公开
            </Badge>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
              🔍 每一件都验真：<span className="gold-text">序列号防伪溯源</span>规则公开透明
            </h2>
            <p className="text-ink-300">从 iPhone 12 位编码到 Hermès 刻印字母，每一条防伪规则都公开可查，拒绝黑箱操作</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <Card goldBorder className="p-0 overflow-hidden">
              <div className="px-8 pt-6 pb-4 border-b border-white/[0.06]">
                <Tabs
                  tabs={[
                    { id: 'phone', label: '📱 手机 · iPhone', icon: <Smartphone className="w-4 h-4" /> },
                    { id: 'watch', label: '⌚ 名表 · Rolex', icon: <Watch className="w-4 h-4" /> },
                    { id: 'bag', label: '👜 包包 · Hermès', icon: <Briefcase className="w-4 h-4" /> },
                  ]}
                  activeTab={authTab}
                  onChange={setAuthTab}
                  variant="pills"
                />
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait">
                  {authTab === 'phone' && (
                    <motion.div
                      key="phone"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-5">
                          <h4 className="font-semibold text-ink-50 flex items-center gap-2">
                            <Barcode className="w-4 h-4 text-gold-400" />
                            序列号格式图解（12 位字母数字）
                          </h4>
                          <div className="flex gap-1 flex-wrap">
                            {[
                              { ch: 'F', color: 'bg-coral-500/20 border-coral-500/40 text-coral-400', label: '工厂码' },
                              { ch: '2', color: 'bg-coral-500/20 border-coral-500/40 text-coral-400', label: '' },
                              { ch: 'L', color: 'bg-forest-500/20 border-forest-500/40 text-forest-300', label: '年份周码' },
                              { ch: 'X', color: 'bg-forest-500/20 border-forest-500/40 text-forest-300', label: '' },
                              { ch: 'J', color: 'bg-forest-500/20 border-forest-500/40 text-forest-300', label: '' },
                              { ch: '4', color: 'bg-gold-500/20 border-gold-500/40 text-gold-400', label: '型号' },
                              { ch: 'K', color: 'bg-gold-500/20 border-gold-500/40 text-gold-400', label: '' },
                              { ch: '8', color: 'bg-gold-500/20 border-gold-500/40 text-gold-400', label: '' },
                              { ch: 'Q', color: 'bg-jade-500/20 border-jade-500/40 text-jade-400', label: '颜色容量' },
                              { ch: '0', color: 'bg-jade-500/20 border-jade-500/40 text-jade-400', label: '' },
                              { ch: 'L', color: 'bg-jade-500/20 border-jade-500/40 text-jade-400', label: '' },
                              { ch: '9', color: 'bg-jade-500/20 border-jade-500/40 text-jade-400', label: '' },
                            ].map((b, i) => (
                              <div key={i} className="relative">
                                <div className={cn('w-11 h-14 rounded-xl border-2 flex items-center justify-center font-bold text-lg font-mono', b.color)}>
                                  {b.ch}
                                </div>
                                {b.label && (
                                  <span className="absolute -bottom-5 left-0 right-0 text-[9px] text-center whitespace-nowrap text-ink-400">{b.label}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="pt-4 grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-coral-500/50 shrink-0" /><span className="text-ink-300">第 1-2 位：工厂码（F郑州/C深圳/D成都）</span></div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-forest-500/50 shrink-0" /><span className="text-ink-300">第 3-5 位：年份 + 周次编码</span></div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gold-500/50 shrink-0" /><span className="text-ink-300">第 6-8 位：型号标识符</span></div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-jade-500/50 shrink-0" /><span className="text-ink-300">第 9-12 位：颜色 / 容量</span></div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-ink-50 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-jade-400" />
                            在线试算工具 · 输入 12 位序列号实时解析
                          </h4>
                          <div className="relative">
                            <input
                              value={phoneSerial}
                              onChange={(e) => setPhoneSerial(e.target.value.toUpperCase().slice(0, 12))}
                              placeholder="输入 12 位序列号..."
                              maxLength={12}
                              className="w-full h-14 px-5 pl-12 rounded-2xl bg-ink-800/80 border-2 border-white/[0.08] text-ink-50 font-mono text-lg tracking-[0.2em] focus:outline-none focus:border-gold-500/50 transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                          </div>
                          <p className="text-xs text-ink-500">示例：F2LXJ4K8Q0L9 | 提示：修改任意字符，解析结果会实时更新</p>

                          {parsedSerial && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-5 rounded-2xl bg-forest-500/10 border border-forest-500/25 space-y-3"
                            >
                              <div className="flex items-center gap-2">
                                <BadgeCheck className="w-5 h-5 text-jade-400" />
                                <span className="font-semibold text-jade-400 text-sm">校验通过 · 序列号格式合法</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-xl bg-ink-850/60">
                                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">🏭 产地工厂</p>
                                  <p className="text-ink-50 font-semibold">{parsedSerial.factory}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-ink-850/60">
                                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">📅 出厂日期</p>
                                  <p className="text-ink-50 font-semibold">{parsedSerial.date}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-ink-850/60">
                                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">📱 对应型号</p>
                                  <p className="text-ink-50 font-semibold">{parsedSerial.model}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-ink-850/60">
                                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">🎨 颜色配置</p>
                                  <p className="text-ink-50 font-semibold">{parsedSerial.color}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {authTab === 'watch' && (
                    <motion.div
                      key="watch"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="grid lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2 space-y-5">
                          <h4 className="font-semibold text-ink-50 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-gold-400" />
                            编号位置示意图
                          </h4>
                          <div className="relative aspect-square rounded-3xl bg-ink-800/60 border border-white/[0.06] overflow-hidden">
                            <div className="absolute inset-6 rounded-full border-2 border-gold-500/40 bg-gradient-to-br from-ink-750/50 to-ink-900/50" />
                            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-6 rounded-b-xl bg-ink-850 border-2 border-gold-500/30 text-center">
                              <span className="text-[8px] text-gold-400 leading-5">12点表壳</span>
                            </div>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-10 h-6 rounded-t-xl bg-ink-850 border-2 border-gold-500/30 text-center">
                              <span className="text-[8px] text-gold-400 leading-5">6点表耳</span>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center space-y-1">
                                <p className="font-display text-2xl gold-text font-bold">双码对照</p>
                                <p className="text-[10px] text-ink-400 uppercase tracking-wider">6点 + 12点 一致方为正品</p>
                              </div>
                            </div>
                            <div className="absolute left-4 top-1/2 w-8 h-14 rounded-lg bg-ink-850 border border-white/[0.08]" />
                            <div className="absolute right-4 top-1/2 w-8 h-14 rounded-lg bg-ink-850 border border-white/[0.08]" />
                          </div>
                          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-ink-800/40 text-xs">
                            <div className="space-y-1">
                              <p className="font-semibold text-gold-400">表耳内侧 6 点位</p>
                              <p className="text-ink-400">型号编号（如 116610LN）</p>
                              <p className="text-jade-400 font-mono">示例：126610LN</p>
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-gold-400">表壳内侧 12 点位</p>
                              <p className="text-ink-400">字头序列号（年份编码）</p>
                              <p className="text-jade-400 font-mono">示例：0字头8位数字</p>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-3 space-y-4">
                          <h4 className="font-semibold text-ink-50 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-jade-400" />
                            字头年份对应表（1987 R → 2026 0字头）
                          </h4>
                          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[280px] overflow-y-auto pr-2">
                            {rolexYearCodes.map((r, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'p-3 rounded-xl border text-center transition-all',
                                  i === rolexYearCodes.length - 1
                                    ? 'bg-gold-500/15 border-gold-500/40 shadow-gold-sm'
                                    : 'bg-ink-800/50 border-white/[0.06] hover:border-forest-500/30'
                                )}
                              >
                                <p className={cn('font-mono font-bold text-lg', i === rolexYearCodes.length - 1 ? 'gold-text' : 'text-ink-100')}>{r.code}</p>
                                <p className="text-[10px] text-ink-400 mt-0.5">{r.year}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-ink-500 pt-2">
                            💡 2010 年后使用随机 8-11 位乱码序列号，不再按年份规律排列，需开盖查字头
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {authTab === 'bag' && (
                    <motion.div
                      key="bag"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="grid lg:grid-cols-3 gap-6">
                        <div className="p-5 rounded-2xl bg-ink-800/50 border border-white/[0.06] space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-coral-500/15 border border-coral-500/30 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-coral-400" />
                          </div>
                          <h4 className="font-semibold text-ink-50">刻印位置 · 内侧拉链头</h4>
                          <p className="text-sm text-ink-400 leading-relaxed">
                            打开包袋后查看主拉链金属头背面，激光刻印年份字母 + 工匠编号，刻印深度均匀、字体方正不倾斜
                          </p>
                          <div className="h-20 rounded-xl bg-ink-850/60 border border-white/[0.06] flex items-center justify-center gap-4 font-mono">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-gold-500/60 text-gold-400 text-sm">E</span>
                            <span className="text-ink-500">·</span>
                            <span className="text-ink-400 text-xs">工匠 □ 248</span>
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-ink-800/50 border border-white/[0.06] space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-forest-500/15 border border-forest-500/30 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-forest-300" />
                          </div>
                          <h4 className="font-semibold text-ink-50">马鞍缝线 · 针数规范</h4>
                          <p className="text-sm text-ink-400 leading-relaxed">
                            正品采用法国亚麻蜡线双骑马针，1cm 内 9-10 针，针孔倾斜方向一致，手工缝制微不规则
                          </p>
                          <div className="h-20 rounded-xl bg-ink-850/60 border border-white/[0.06] flex items-center justify-center px-5">
                            <div className="flex-1 h-px bg-gold-500/40 relative">
                              {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="absolute top-1/2 w-0.5 h-4 -translate-y-1/2 bg-gold-400/80" style={{ left: `${i * 8 + 4}%`, transform: 'translateY(-50%) rotate(-20deg)' }} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-ink-800/50 border border-white/[0.06] space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
                            <BadgeCheck className="w-5 h-5 text-gold-400" />
                          </div>
                          <h4 className="font-semibold text-ink-50">五金刻印 · 深度规范</h4>
                          <p className="text-sm text-ink-400 leading-relaxed">
                            正品 HERMÈS PARIS 刻印边缘清晰无毛刺，字体粗细均匀，刻槽内不抛光保持亚光
                          </p>
                          <div className="h-20 rounded-xl bg-ink-850/60 border border-white/[0.06] flex items-center justify-center">
                            <div className="text-center space-y-0.5">
                              <p className="font-display font-bold tracking-[0.15em] text-gold-400">HERMÈS</p>
                              <p className="text-[9px] tracking-[0.3em] text-ink-400 uppercase">Paris Made in France</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-ink-50 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-jade-400" />
                          年份字母对照（字母 ○/□ 交替，2026 = E○）
                        </h4>
                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                          {hermesYearCodes.map((r, i) => (
                            <div
                              key={i}
                              className={cn(
                                'p-3 rounded-xl border text-center transition-all',
                                i === hermesYearCodes.length - 1
                                  ? 'bg-gold-500/15 border-gold-500/40 shadow-gold-sm'
                                  : 'bg-ink-800/50 border-white/[0.06] hover:border-forest-500/30'
                              )}
                            >
                              <p className={cn(
                                'font-bold text-lg inline-flex items-center justify-center w-8 h-8',
                                i === hermesYearCodes.length - 1 ? 'gold-text' : 'text-ink-100',
                                r.shape === '○' ? 'rounded-full border' : 'rounded-md border'
                              )}>{r.letter}</p>
                              <p className="text-[10px] text-ink-400 mt-1">{r.year}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="px-8 py-4 border-t border-white/[0.06] bg-ink-800/30">
                <button
                  onClick={() => navigate('/products')}
                  className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-2 transition-colors mx-auto"
                >
                  查看完整验真数据库（涵盖 5000+ 型号规则）
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================= */}
      {/* Section 3: 热门品类快捷估价（可点击展开） */}
      {/* ============================================================= */}
      <section className="relative py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto space-y-4">
            <Badge variant="gold">六大品类</Badge>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
              覆盖<span className="gold-text">全品类</span>奢侈品回收 · 点击卡片查看热门品牌
            </h2>
            <p className="text-ink-300">从数码到珠宝，从腕表到箱包，点击任意卡片展开该品类 TOP5 品牌近 30 天回收均价</p>
          </motion.div>

          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {categories.map((c) => (
              <motion.div key={c.id} variants={fadeUp}>
                <Card
                  goldBorder={expandedCat === c.id}
                  className={cn(
                    'group cursor-pointer relative overflow-hidden p-6 text-center space-y-4 transition-all duration-500 hover:shadow-gold-sm',
                    expandedCat === c.id && 'shadow-gold-sm'
                  )}
                  onClick={() => setExpandedCat(expandedCat === c.id ? null : c.id)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gold-soft border border-gold-500/25 flex items-center justify-center text-gold-400 group-hover:scale-110 group-hover:shadow-gold-sm transition-all duration-500">
                      <c.Icon className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="relative z-10 space-y-1">
                    <h3 className="font-semibold text-ink-50 text-lg group-hover:text-gold-400 transition-colors duration-300">{c.name}</h3>
                    <p className="text-xs text-ink-400">回收均价</p>
                    <p className="text-lg font-bold gold-text">{c.avgPrice}</p>
                  </div>
                  <div className="relative z-10 text-ink-400 group-hover:text-gold-400 transition-colors">
                    {expandedCat === c.id ? <ChevronUp className="w-5 h-5 mx-auto" /> : <ChevronDown className="w-5 h-5 mx-auto" />}
                  </div>
                </Card>

                <AnimatePresence>
                  {expandedCat === c.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="overflow-hidden col-span-full md:col-span-3 lg:col-span-6"
                    >
                      <Card goldBorder className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-gold-400" />
                            <h4 className="font-semibold text-ink-50 text-sm">{c.name} · 近 30 天热门品牌 TOP5 + 回收均价</h4>
                          </div>
                          <Badge variant="info" className="text-[10px]">近 30 天数据</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          {categoryBrands[c.id].map((b, i) => {
                            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                            return (
                              <div key={b.id} className="p-4 rounded-2xl bg-ink-800/50 border border-white/[0.06] hover:border-gold-500/30 transition-colors space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{medals[i]}</span>
                                  <span className="text-sm font-semibold text-ink-50 truncate flex-1">{b.name}</span>
                                </div>
                                <div className="h-8 rounded-lg bg-gradient-to-r from-forest-500/30 to-gold-500/20 overflow-hidden">
                                  <div
                                    className="h-full bg-gold-gradient rounded-r-lg"
                                    style={{ width: `${100 - i * 15}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] text-ink-400 uppercase tracking-wider">回收均价</p>
                                    <p className="gold-text font-bold">¥{b.avgPrice.toLocaleString()}</p>
                                  </div>
                                  <Button
                                    size="xs"
                                    onClick={(e) => { e.stopPropagation(); navigate('/evaluate'); }}
                                  >
                                    估个价
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          {/* 品牌墙 */}
          <motion.div {...fadeUp} className="space-y-6 pt-6">
            <p className="text-center text-sm text-ink-400 uppercase tracking-[0.25em]">合作 500+ 奢侈品牌 · 无限滚动</p>
            <div className="marquee-container py-4">
              <div className="marquee-track">
                {[...luxuryBrands, ...luxuryBrands].map((brand, i) => (
                  <div key={i} className="w-24 h-24 shrink-0 rounded-2xl glass-card gold-border flex items-center justify-center hover:shadow-gold-sm transition-all duration-300 group">
                    <span className="font-display text-sm font-bold text-ink-300 group-hover:text-gold-400 transition-colors tracking-wider">{brand}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================= */}
      {/* Section 4: 检测师持证上岗 + 历史偏差率看板 */}
      {/* ============================================================= */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,76,58,0.12),transparent_60%)]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="success">
              <UserCheck className="w-3 h-3" />
              偏差率可追溯
            </Badge>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
              👨‍🔬 每一位检测师，<span className="gold-text">偏差率都可追溯</span>
            </h2>
            <p className="text-ink-300">300+ 持证专家，每一位的资质、偏差率、飞检通过率全部公开透明，拒绝「业余鉴定」</p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }} className="space-y-5">
                {inspectors.map((ins) => (
                  <motion.div key={ins.id} variants={fadeUp}>
                    <Card goldBorder className="p-6 hover:shadow-gold-sm transition-all duration-500 overflow-hidden">
                      <div className="grid lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-3 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-forest-700 to-ink-900 border-2 border-gold-500/40 flex items-center justify-center font-display text-3xl gold-text font-bold shadow-gold-sm">
                                {ins.avatar}
                              </div>
                              {ins.level === 'S' && (
                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold-gradient border-2 border-ink-900 flex items-center justify-center shadow-gold-sm">
                                  <Award className="w-4 h-4 text-ink-950" />
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 pt-1">
                              <h4 className="text-xl font-bold text-ink-50">{ins.name}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={ins.level === 'S' ? 'gold' : 'info'}>{ins.level}级检测师</Badge>
                                <Badge variant="info">{ins.region}</Badge>
                              </div>
                              <p className="text-xs text-ink-400">从业 {ins.years} 年 · 认证编号 {ins.id}</p>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-3 space-y-2">
                          <h5 className="text-xs uppercase tracking-wider text-ink-400 font-semibold mb-3 flex items-center gap-2">
                            <FileCheck className="w-3.5 h-3.5 text-gold-400" />
                            持证资质（点击查真伪）
                          </h5>
                          {ins.certs.map((cert, i) => (
                            <button
                              key={i}
                              className={cn(
                                'w-full p-3 rounded-xl text-left text-xs transition-all hover:shadow-gold-sm border',
                                cert.type === 'brand'
                                  ? 'bg-coral-500/10 border-coral-500/30 hover:border-coral-500/60'
                                  : 'bg-ink-800/60 border-white/[0.06] hover:border-gold-500/40'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className={cn('font-semibold', cert.type === 'brand' ? 'text-coral-300' : 'text-ink-100')}>{cert.name}</p>
                                  <p className="text-ink-500 font-mono mt-0.5">{cert.no}</p>
                                </div>
                                <Eye className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="lg:col-span-4">
                          <h5 className="text-xs uppercase tracking-wider text-ink-400 font-semibold mb-2 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-jade-400" />
                            近 30 天偏差率走势
                          </h5>
                          <div className="h-32 rounded-xl bg-ink-800/40 p-2">
                            <ReactECharts option={inspectorChartOption(ins.deviation30d)} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-[10px]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-jade-500" />本检测师 <b className="text-jade-400">{ins.avgDeviation}%</b></span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-coral-400" />行业均值 <b className="text-coral-400">3.5%</b></span>
                          </div>
                        </div>

                        <div className="lg:col-span-2 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-lg bg-ink-800/50">
                              <p className="text-ink-500">累计检测</p>
                              <p className="font-bold text-ink-50">{ins.totalOrders.toLocaleString()}单</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-jade-500/10">
                              <p className="text-ink-500">飞检通过率</p>
                              <p className="font-bold text-jade-400">{ins.flyCheckPass}%</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-gold-500/10">
                              <p className="text-ink-500">平均偏差</p>
                              <p className="font-bold gold-text">{ins.avgDeviation}%</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-ink-800/50">
                              <p className="text-ink-500">用户评分</p>
                              <p className="font-bold text-ink-50">{ins.rating}★</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate(`/inspectors/${ins.id}`)}>
                            查看完整档案
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className="space-y-5">
              <Card className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amberLux-500/15 border border-amberLux-500/30 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-amberLux-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink-50">飞检机制说明</h4>
                    <p className="text-xs text-ink-400">每月随机抽查 15%</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-ink-300">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold gold-text shrink-0">1</div>
                    <p className="text-ink-300 text-xs leading-relaxed">算法随机抽取 15% 已完成订单，派给 <b className="text-gold-400">独立复检员</b> 盲检</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold gold-text shrink-0">2</div>
                    <p className="text-ink-300 text-xs leading-relaxed">偏差率 <b className="text-amberLux-400">≥3%</b> → 黄色预警 · 进入重点关注名单</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold gold-text shrink-0">3</div>
                    <p className="text-ink-300 text-xs leading-relaxed">偏差率 <b className="text-coral-400">≥5%</b> → 红色预警 · <b className="text-coral-400">立即停单培训</b> 3 天</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-[10px] font-bold gold-text shrink-0">4</div>
                    <p className="text-ink-300 text-xs leading-relaxed">连续 3 个月偏差 &lt;1% → <b className="text-jade-400">晋升 S 级 + 奖金</b></p>
                  </div>
                </div>
              </Card>

              <Card goldBorder className="p-6 space-y-4">
                <h4 className="font-semibold text-ink-50 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gold-400" />
                  本月预警总览
                </h4>
                <div className="relative h-44">
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'item', backgroundColor: '#15151F', borderColor: 'rgba(201,169,98,0.3)', textStyle: { color: '#D7D7E0' } },
                      series: [{
                        type: 'pie',
                        radius: ['55%', '82%'],
                        avoidLabelOverlap: false,
                        label: {
                          show: true,
                          position: 'center',
                          formatter: '{c|37}\n{l|共检测师}',
                          rich: {
                            c: { fontSize: 32, fontWeight: 'bold', color: '#D4BA7A', lineHeight: 40 },
                            l: { fontSize: 11, color: '#86869B', padding: [0, 0, 0, 0] },
                          },
                        },
                        labelLine: { show: false },
                        data: [
                          { value: 32, name: '正常 <3%', itemStyle: { color: '#1DB954' } },
                          { value: 5, name: '关注 3-5%', itemStyle: { color: '#F39C12' } },
                          { value: 0, name: '停训 >5%', itemStyle: { color: '#E74C3C' } },
                        ],
                      }],
                    }}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-jade-500" />正常</span>
                    <span className="text-jade-400 font-bold">32 人 · 86.5%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amberLux-500" />关注</span>
                    <span className="text-amberLux-400 font-bold">5 人 · 13.5%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-coral-500" />停训</span>
                    <span className="text-coral-400 font-bold">0 人 · 0%</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Badge variant="success" dot className="w-full justify-center">🎉 本月 0 位高风险检测师</Badge>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================= */}
      {/* Section 5: 服务流程 5 步（每步可操作跳转） */}
      {/* ============================================================= */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,76,58,0.15),transparent_70%)]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto space-y-4">
            <Badge variant="gold">五步流程</Badge>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
              便捷高效的<span className="gold-text">回收之旅</span> · 点击每步体验
            </h2>
            <p className="text-ink-300">从发起估价到完成打款，最快 2 小时 · 每一步都可点击跳转体验</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.1 }}
            className="relative grid grid-cols-1 md:grid-cols-5 gap-6"
          >
            <div className="hidden md:block absolute top-1/2 inset-x-[10%] h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

            {processSteps.map((step, i) => {
              const isPayStep = i === 2;
              return (
                <motion.div key={step.title} variants={fadeUp} className="relative text-center">
                  <a
                    href={step.anchor}
                    onClick={(e) => {
                      if (isPayStep) {
                        e.preventDefault();
                        setShowPayDemo(true);
                      }
                    }}
                    className="group block"
                  >
                    <div className="relative z-10 mx-auto w-20 h-20 rounded-3xl bg-gold-gradient flex items-center justify-center shadow-gold-sm group hover:shadow-gold transition-all duration-500 hover:scale-105 group-active:scale-95">
                      <step.Icon className="w-9 h-9 text-ink-950" strokeWidth={2} />
                      <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-ink-850 border-2 border-gold-500 text-gold-400 text-xs font-bold flex items-center justify-center group-hover:scale-110 transition-transform">
                        {i + 1}
                      </span>
                    </div>
                    <div className="mt-6 space-y-1.5">
                      <h3 className="font-semibold text-lg text-ink-50 group-hover:text-gold-400 transition-colors">{step.title}</h3>
                      <p className="text-sm text-ink-400">{step.desc}</p>
                      <p className="text-[10px] text-gold-400/70 uppercase tracking-wider pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPayStep ? '点击查看打款案例 ▸' : '点击跳转体验 ▸'}
                      </p>
                    </div>
                  </a>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 即时打款案例 Modal */}
      <Modal open={showPayDemo} onClose={() => setShowPayDemo(false)} title="💸 即时打款案例 · 验机后 3 分钟到账" size="md">
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-forest-500/10 to-gold-500/10 border border-gold-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-ink-800 border border-gold-500/30 flex items-center justify-center font-display gold-text font-bold">R</div>
              <div>
                <p className="font-semibold text-ink-50">Rolex Submariner Date 126610LN</p>
                <p className="text-xs text-ink-400">S 级成色 · 序列号 RX5711-1A0108</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-ink-800/60">
                <p className="text-ink-400">建议成交价</p>
                <p className="text-xl font-bold gold-text font-display">¥89,500</p>
              </div>
              <div className="p-3 rounded-xl bg-ink-800/60">
                <p className="text-ink-400">用户选择</p>
                <p className="text-xl font-bold text-jade-400 font-display">标准交易</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-ink-800/40 text-xs">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-jade-400" /><span className="text-ink-300">14:02 检测完成 · 用户确认签字</span></div>
              <span className="text-ink-500">T+0min</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-ink-800/40 text-xs">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-jade-400" /><span className="text-ink-300">14:03 财务系统自动出款 · 银行处理中</span></div>
              <span className="text-ink-500">T+1min</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gold-500/15 border border-gold-500/30 text-xs">
              <div className="flex items-center gap-2"><BanknoteIcon className="w-4 h-4 text-gold-400" /><span className="font-semibold gold-text">14:05 工商银行 ****8888 到账成功</span></div>
              <span className="gold-text font-bold">T+3min ✅</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-ink-800/60 border border-white/[0.06] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold-500/10 to-transparent rounded-bl-full" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-ink-50 text-sm">中国工商银行</p>
                <p className="text-[10px] text-ink-400">储蓄卡 · 尾号 8888</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-ink-400 uppercase tracking-wider">到账金额</p>
                <p className="text-3xl font-bold gold-text font-display tracking-tight">¥89,500.00</p>
              </div>
              <div className="text-[10px] text-ink-500 text-right">
                <p>交易单号 ZR20260620000147</p>
                <p>2026-06-20 14:05:23</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-ink-500">💡 以上为模拟真实案例 · 标准交易实际到账时间为验机后 T+1 工作日</p>
          <Button className="w-full" onClick={() => { setShowPayDemo(false); navigate('/evaluate'); }}>
            <Zap className="w-4 h-4" />
            立即发起估价 · 体验 3 分钟到账
          </Button>
        </div>
      </Modal>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================= */}
      {/* Section 6: 最新成交案例（带检测报告展开） */}
      {/* ============================================================= */}
      <section id="latest-deals" className="relative py-20 lg:py-28 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <motion.div
            {...fadeUp}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          >
            <div className="space-y-3">
              <Badge variant="warning" dot>实时更新</Badge>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
                最新<span className="gold-text">成交记录</span> · 点击查看检测报告
              </h2>
              <p className="text-ink-300">每一笔成交都附带完整检测报告 · 透明公开可查</p>
            </div>
            <Button variant="ghost" size="md">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8 }}
            className="overflow-x-auto pb-6 -mx-4 px-4"
          >
            <div className="flex gap-5 w-max">
              {latestDeals.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  className="w-72 shrink-0"
                >
                  <Card
                    className={cn(
                      'p-0 overflow-hidden h-full transition-all duration-400',
                      expandedDeal === d.id ? 'shadow-gold-sm gold-border' : 'hover:shadow-gold-sm hover:gold-border'
                    )}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedDeal(expandedDeal === d.id ? null : d.id)}
                    >
                      <div className={`relative aspect-[4/3] bg-gradient-to-br ${d.gradient}`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display text-7xl font-bold text-white/30 tracking-tighter">{d.initial}</span>
                        </div>
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge variant={d.grade === 'S' ? 'gold' : d.grade === 'A' ? 'success' : d.grade === 'B' ? 'warning' : 'danger'}>
                            {d.grade}级成色
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge variant="info" className="text-[10px]">{d.time}</Badge>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" />
                      </div>
                      <div className="p-5 space-y-3">
                        <div>
                          <p className="text-xs text-ink-400">{d.brand}</p>
                          <h3 className="text-base font-semibold text-ink-50 truncate">{d.model}</h3>
                        </div>
                        <div className="divider-gold" />
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-ink-400">成交价</span>
                          <span className="text-xl font-bold gold-text">¥{d.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[10px] text-ink-500">序列号 {d.serial}</p>
                          <ChevronDown className={cn('w-4 h-4 text-ink-400 transition-transform', expandedDeal === d.id && 'rotate-180')} />
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedDeal === d.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06] pt-4">
                            <div className="grid grid-cols-6 gap-1.5">
                              {['正', '背', '左', '右', '顶', '底'].map((v, idx) => (
                                <div key={idx} className="aspect-square rounded-lg bg-gradient-to-br from-ink-700/60 to-ink-800/60 border border-white/[0.06] flex items-center justify-center text-[10px] text-ink-400 relative overflow-hidden group hover:border-gold-500/40 transition-colors">
                                  <span className="font-display text-3xl font-bold text-white/15 absolute">{d.initial}</span>
                                  <span className="relative z-10">{v}</span>
                                </div>
                              ))}
                            </div>

                            <div className="p-3 rounded-xl bg-ink-800/50 space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-jade-400" />序列号验证通过</span>
                                <span className="text-ink-100 font-semibold">成色综合 {d.grade}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>功能项</span>
                                <span className="text-jade-400 font-semibold">{d.functionPass}/{d.functionTotal} 通过 ✅</span>
                              </div>
                              <div>
                                <p className="text-ink-400 mb-1">瑕疵标注：</p>
                                {d.defects.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {d.defects.map((def, di) => (
                                      <span key={di} className="px-2 py-0.5 rounded-full bg-amberLux-500/15 text-amberLux-400 border border-amberLux-500/30 text-[10px]">{def}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-jade-400">无明显瑕疵 ✨</span>
                                )}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-gradient-to-r from-forest-500/10 to-gold-500/10 border border-gold-500/20 space-y-1.5 text-xs">
                              <p className="text-[10px] text-ink-400 uppercase tracking-wider mb-1">三方价格对比</p>
                              <div className="space-y-1">
                                <div className="flex justify-between items-center"><span className="text-ink-400">闲鱼均价</span><span className="text-ink-300">¥{Math.round(d.price * 0.87).toLocaleString()}</span></div>
                                <div className="flex justify-between items-center"><span className="text-ink-400">京东回收</span><span className="text-ink-300">¥{Math.round(d.price * 0.9).toLocaleString()}</span></div>
                                <div className="flex justify-between items-center"><span className="text-ink-400">蜂鸟回收</span><span className="text-ink-300">¥{Math.round(d.price * 0.88).toLocaleString()}</span></div>
                                <div className="h-px bg-white/[0.06] my-1" />
                                <div className="flex justify-between items-center"><span className="gold-text font-semibold">✅ 本平台成交价</span><span className="gold-text font-bold">¥{d.price.toLocaleString()}</span></div>
                              </div>
                              <Badge variant="gold" className="mt-1 w-full justify-center text-[10px]">
                                <TrendingUp className="w-3 h-3" />
                                比平台均价高 {Math.round((d.price / (d.price * 0.88) - 1) * 100)}%
                              </Badge>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" className="flex-1">
                                <FileCheck className="w-3.5 h-3.5" />
                                完整报告
                              </Button>
                              <Button size="sm" className="flex-1">
                                <Zap className="w-3.5 h-3.5" />
                                同款估价
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================= */}
      {/* Section 7: 30天退货履约全流程可视化 */}
      {/* ============================================================= */}
      <section id="return-fulfill" className="relative py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(43,161,121,0.1),transparent_60%)]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="success">
              <RefreshCcw className="w-3 h-3" />
              超长售后保障
            </Badge>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
              🛡️ 30 天无理由退货：<span className="gold-text">每一步都可追踪</span>
            </h2>
            <p className="text-ink-300">不满意？30 天内随时退 · 全程可视化追踪 · 3 工作日退款到账</p>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* 左侧退货申请 UI + 时效条 */}
            <div className="lg:col-span-5 space-y-5">
              <Card className="p-6 space-y-4">
                <h4 className="font-semibold text-ink-50 flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-gold-400" />
                  退货申请入口 UI
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-ink-400 mb-1.5 block font-semibold">选择退货原因</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['使用不满', '瑕疵争议', '价格异议', '其他原因'].map((r, i) => (
                        <button key={r} className={cn(
                          'p-3 rounded-xl text-xs font-medium transition-all border',
                          i === 0
                            ? 'bg-gold-500/15 border-gold-500/40 gold-text'
                            : 'bg-ink-800/50 border-white/[0.06] text-ink-300 hover:border-gold-500/30'
                        )}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-ink-400 mb-1.5 block font-semibold">上传凭证（3 张）</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((n) => (
                        <div key={n} className="aspect-square rounded-xl bg-ink-800/50 border-2 border-dashed border-white/[0.1] flex items-center justify-center text-ink-500 group hover:border-gold-500/40 transition-colors cursor-pointer">
                          <div className="text-center">
                            <Plus className="w-6 h-6 mx-auto mb-1 group-hover:text-gold-400 transition-colors" />
                            <p className="text-[10px]">图{n + 1}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-ink-400 mb-1.5 block font-semibold">退款方式</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-3 rounded-xl bg-forest-500/10 border border-forest-500/30 text-left">
                        <p className="text-xs font-semibold text-forest-300">原路退回</p>
                        <p className="text-[10px] text-ink-400 mt-0.5">3 工作日 · 免手续费</p>
                      </button>
                      <button className="p-3 rounded-xl bg-ink-800/50 border border-white/[0.06] text-left hover:border-gold-500/30 transition-colors">
                        <p className="text-xs font-semibold text-ink-200">银行卡转账</p>
                        <p className="text-[10px] text-ink-400 mt-0.5">1 工作日 · 免手续费</p>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 space-y-4">
                <h4 className="font-semibold text-ink-50 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-jade-400" />
                  时效承诺条
                </h4>
                <div className="relative">
                  <div className="absolute top-4 left-0 right-0 h-1 bg-ink-700 rounded-full" />
                  <div className="absolute top-4 left-0 h-1 bg-gold-gradient rounded-full" style={{ width: '100%' }} />
                  <div className="relative flex justify-between">
                    {[
                      { label: '2h响应', time: '2小时' },
                      { label: '24h取件', time: '24h' },
                      { label: '48h复检', time: '48h' },
                      { label: '3日退款', time: '3工作日' },
                    ].map((s, i) => (
                      <div key={s.label} className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold-sm z-10 text-ink-950 font-bold text-xs">{i + 1}</div>
                        <p className="text-[10px] text-ink-300 mt-2 font-semibold">{s.label}</p>
                        <p className="text-[9px] text-ink-500 gold-text">{s.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <h4 className="font-semibold text-ink-50 flex items-center gap-2 text-sm">
                  <BanknoteIcon className="w-4 h-4 text-gold-400" />
                  退款方式对比
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-ink-800/50 border border-white/[0.06] space-y-2">
                    <p className="font-semibold text-ink-100">原路退回</p>
                    <div className="space-y-1 text-ink-400">
                      <p>⏱ 到账 · 3 工作日</p>
                      <p>💸 手续费 · ¥0</p>
                      <p>✅ 自动匹配订单</p>
                    </div>
                    <Badge variant="success" className="w-full justify-center text-[10px]">推荐</Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-ink-800/50 border border-white/[0.06] space-y-2">
                    <p className="font-semibold text-ink-100">银行卡</p>
                    <div className="space-y-1 text-ink-400">
                      <p>⏱ 到账 · 1 工作日</p>
                      <p>💸 手续费 · ¥0</p>
                      <p>✅ 支持所有银行</p>
                    </div>
                    <Badge variant="info" className="w-full justify-center text-[10px]">快速到账</Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* 右侧：真实案例 StatusTimeline */}
            <div className="lg:col-span-7 space-y-5">
              <Card goldBorder className="p-6 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600/40 to-gold-700/40 border border-gold-500/30 flex items-center justify-center font-display text-xl gold-text font-bold">D</div>
                    <div>
                      <h4 className="font-semibold text-ink-50">订单 #RS202606120008 · 退货全流程</h4>
                      <p className="text-xs text-ink-400">Dior Lady Dior Mini · 成交价 ¥38,500</p>
                    </div>
                  </div>
                  <Badge variant="success" dot>已完成</Badge>
                </div>

                <div className="space-y-1">
                  {returnTimeline.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setExpandedReturnStep(expandedReturnStep === item.id ? null : item.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                        <div className="flex flex-col items-center shrink-0 pt-1">
                          <div className={cn(
                            'w-7 h-7 rounded-full border-2 flex items-center justify-center z-10',
                            item.status === 'done' ? 'bg-gold-gradient border-gold-500 text-ink-950' :
                            item.status === 'active' ? 'bg-ink-850 border-gold-500 shadow-[0_0_15px_rgba(201,169,98,0.5)] text-gold-400' :
                            'bg-ink-800 border-ink-600 text-ink-500'
                          )}>
                            {item.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : <CircleDot className="w-4 h-4 animate-pulse" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className={cn('text-sm font-semibold', item.status === 'done' ? 'text-ink-100' : item.status === 'active' ? 'text-gold-300' : 'text-ink-400')}>
                              {item.title}
                            </p>
                            <span className="text-[10px] text-ink-500 shrink-0">{item.time}</span>
                          </div>
                          <p className="text-xs text-ink-400 mt-0.5">{item.description}</p>
                          <AnimatePresence>
                            {expandedReturnStep === item.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: 10 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 rounded-xl bg-ink-800/60 border border-white/[0.06] space-y-2 text-xs">
                                  {item.id === '1' && (
                                    <>
                                      <p className="text-ink-400">📝 用户备注：</p>
                                      <p className="text-ink-200 leading-relaxed">"包包很精致，但日常穿搭风格不匹配，希望可以退掉，配件包装完整，未使用过。"</p>
                                      <div className="flex gap-2 pt-2">
                                        {['📷 整体外观', '📷 五金细节', '📷 购买小票'].map((t, ti) => (
                                          <div key={ti} className="w-20 h-16 rounded-lg bg-ink-750/60 border border-white/[0.06] flex items-center justify-center text-[9px] text-ink-400">{t}</div>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                  {item.id === '2' && (
                                    <>
                                      <p className="text-ink-300">👩 客服专员：<b className="text-gold-400">李静 · 工号 KF-2845</b></p>
                                      <p className="text-ink-300">📞 通话录音：<span className="text-jade-400">已存档 2 分 18 秒</span></p>
                                      <p className="text-ink-400 leading-relaxed">与用户确认退货原因，符合 30 天无理由退货条件，包包保持原状态无人为损坏，退款金额 ¥38,500 确认。</p>
                                    </>
                                  )}
                                  {item.id === '3' && (
                                    <>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <p className="text-ink-400">🚚 物流单号</p>
                                          <p className="font-mono gold-text">SF1234567890</p>
                                        </div>
                                        <div>
                                          <p className="text-ink-400">📦 保价金额</p>
                                          <p className="gold-text font-semibold">¥40,000</p>
                                        </div>
                                      </div>
                                      <div className="space-y-1 pt-1">
                                        <p className="text-ink-400 text-[10px]">轨迹追踪：</p>
                                        <p className="text-ink-200">📍 6/19 10:20 上海市徐汇区 · 已揽收</p>
                                        <p className="text-ink-200">📍 6/19 18:42 上海虹桥中转场 · 已发出</p>
                                        <p className="text-ink-200">📍 6/20 06:15 苏州中心仓 · 已到达</p>
                                      </div>
                                    </>
                                  )}
                                  {item.id === '4' && (
                                    <>
                                      <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="p-2 rounded-lg bg-jade-500/10">
                                          <p className="text-[10px] text-ink-400">外观</p>
                                          <p className="text-jade-400 font-bold text-xs">一致 ✅</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-jade-500/10">
                                          <p className="text-[10px] text-ink-400">功能</p>
                                          <p className="text-jade-400 font-bold text-xs">完整 ✅</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-jade-500/10">
                                          <p className="text-[10px] text-ink-400">损坏</p>
                                          <p className="text-jade-400 font-bold text-xs">无 ✅</p>
                                        </div>
                                      </div>
                                      <p className="text-ink-400">复检师：<b className="text-ink-200">王铭轩 INS-001</b> · 对比初检偏差率 0.2%</p>
                                    </>
                                  )}
                                  {item.id === '5' && (
                                    <>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <p className="text-ink-400">🏦 收款银行</p>
                                          <p className="text-ink-200">工商银行 · 储蓄卡</p>
                                        </div>
                                        <div>
                                          <p className="text-ink-400">🔢 尾号</p>
                                          <p className="font-mono gold-text">****8888</p>
                                        </div>
                                      </div>
                                      <p className="text-ink-400">💰 退款金额：<span className="text-2xl gold-text font-bold font-display">¥38,500.00</span></p>
                                      <p className="text-[10px] text-ink-500">银行流水号 20260620143012888874</p>
                                    </>
                                  )}
                                  {item.id === '6' && (
                                    <>
                                      <p className="text-ink-300">📱 用户 138****6688 收到短信：</p>
                                      <div className="p-3 rounded-lg bg-forest-500/10 border border-forest-500/20 text-xs text-ink-200 leading-relaxed">
                                        【工商银行】您尾号 8888 的储蓄卡于 06-20 14:45 入账 ¥38,500.00，当前余额 ¥38,642.18。【臻回收】您的退货退款已到账，服务评价请点击 http://zhen.cn/v/88
                                      </div>
                                      <p className="text-ink-400">⭐ 服务评价：<span className="gold-text">★★★★★ 5 星</span> · "非常满意的一次回收服务"</p>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <ChevronDown className={cn('w-4 h-4 text-ink-500 shrink-0 mt-1 transition-transform', expandedReturnStep === item.id && 'rotate-180')} />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" size="md" className="flex-1" onClick={() => navigate('/user/returns')}>
                    <FileSearch className="w-4 h-4" />
                    查看完整退货政策 →
                  </Button>
                  <Button size="md" variant="outline" className="flex-1" onClick={() => navigate('/user/returns/apply/demoId')}>
                    <RefreshCw className="w-4 h-4" />
                    申请模拟退货体验 →
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================ */}
      {/* Section 8: 城市服务网络落点                                   */}
      {/* ============================================================ */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="mb-14 text-center">
            <Badge variant="default" className="mb-4"><MapPin className="w-3 h-3 mr-1.5 text-gold-500" />38 城上门 · 实时排班</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
              🚗 全国 <span className="gold-text">38 城</span> 上门服务
            </h2>
            <p className="text-ink-400 text-lg max-w-2xl mx-auto">检测师实时排班可查 · 最快 2 小时上门 · 当面检测当面打款</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* 左侧: SVG 地图 */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card goldBorder className="h-full overflow-hidden">
                <div className="relative h-[520px] bg-gradient-to-br from-ink-950 via-ink-900 to-forest-950/40 rounded-2xl overflow-hidden">
                  <svg viewBox="0 0 600 500" className="w-full h-full p-4 opacity-60">
                    <defs>
                      <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0D2E22" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#14392B" stopOpacity="0.6" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 120 180 Q 100 200 110 240 Q 100 280 140 300 Q 160 330 200 340 Q 240 360 280 350 Q 320 370 360 360 Q 400 370 420 340 Q 460 330 480 290 Q 510 260 490 220 Q 500 180 460 160 Q 440 130 400 120 Q 370 90 330 100 Q 290 80 260 100 Q 220 90 200 120 Q 170 130 150 150 Q 130 160 120 180 Z
                         M 500 240 Q 520 260 510 290 Q 520 310 500 320 Q 480 310 490 280 Q 490 260 500 240 Z"
                      fill="url(#mapGrad)"
                      stroke="#8B6914"
                      strokeWidth="1.2"
                      strokeOpacity="0.6"
                    />
                  </svg>

                  {citiesData.slice(0, 38).map((c, i) => {
                    const isTop5 = i < 5;
                    return (
                      <div
                        key={c.name}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                        style={{
                          left: `${15 + (c.lng / 135) * 70}%`,
                          top: `${15 + ((55 - c.lat) / 40) * 70}%`,
                        }}
                      >
                        <div className={`relative ${isTop5 ? 'w-5 h-5' : 'w-3 h-3'}`}>
                          <span className={`absolute inset-0 rounded-full ${isTop5 ? 'bg-gold-500 animate-glow-pulse' : 'bg-gold-500/60'}`}></span>
                          <span className={`absolute inset-0 rounded-full animate-ping ${isTop5 ? 'bg-gold-500/40' : 'bg-gold-500/20'}`}></span>
                          {isTop5 && (
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink-900/90 border border-gold-500/30 px-2 py-1 rounded text-[10px] font-bold">
                              <span className="gold-text">{c.name}</span>
                              <span className="text-ink-400 ml-1">{c.inspectors}人</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="absolute bottom-4 left-4 bg-ink-900/80 border border-gold-500/20 rounded-lg p-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gold-500 animate-glow-pulse"></span><span className="text-ink-300">TOP5 核心城市</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gold-500/60"></span><span className="text-ink-400">其他覆盖城市</span></div>
                    <div className="pt-1.5 border-t border-ink-700 mt-1.5"><span className="text-gold-500 font-bold">38</span><span className="text-ink-400"> 城 · </span><span className="text-ink-300">256</span><span className="text-ink-400"> 检测师</span></div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* 右侧: 城市表格 */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <Card goldBorder className="h-full">
                <Tabs
                  tabs={['华东', '华北', '华南', '西南', '其他'].map(r => ({ id: r, label: r }))}
                  activeTab={cityRegion}
                  onChange={(v) => setCityRegion(v)}
                  className="mb-4"
                />

                <div className="overflow-x-auto max-h-[460px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-ink-900 z-10">
                      <tr className="text-ink-400 border-b border-ink-700">
                        <th className="text-left py-3 px-2 font-medium">城市</th>
                        <th className="text-center py-3 px-2 font-medium">检测师</th>
                        <th className="text-center py-3 px-2 font-medium">空闲时段</th>
                        <th className="text-center py-3 px-2 font-medium">上门时间</th>
                        <th className="text-center py-3 px-2 font-medium">平均溢价</th>
                        <th className="text-right py-3 px-2 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citiesData.filter(c => c.region === cityRegion).map((c, i) => (
                        <motion.tr
                          key={c.name}
                          initial={{ opacity: 0, x: 12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-ink-800 hover:bg-gold-500/5 transition-colors"
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gold-500">📍</span>
                              <span className="font-medium text-ink-200">{c.name}</span>
                              {i < 3 && <Badge variant="gold" className="!py-0 !px-1.5 !text-[10px]">热门</Badge>}
                            </div>
                            <p className="text-[10px] text-ink-500 ml-6 mt-0.5">{c.areas}</p>
                          </td>
                          <td className="text-center py-3 px-2"><span className="font-bold gold-text">{c.inspectors}</span></td>
                          <td className="text-center py-3 px-2"><span className="text-jade-400 text-xs">{c.freeTime}</span></td>
                          <td className="text-center py-3 px-2"><span className="text-ink-300 text-xs">{c.arrivalTime}</span></td>
                          <td className="text-center py-3 px-2"><Badge variant="gold">+{c.premium}%</Badge></td>
                          <td className="text-right py-3 px-2">
                            <Button variant="outline" size="xs" onClick={() => navigate('/evaluate')}>
                              <Calendar className="w-3 h-3 mr-1" />
                              预约
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 pt-4 border-t border-ink-700 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-ink-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-jade-400" />
                    所有检测师均通过中检认证 + 3 轮岗前培训 + 月度飞检考核
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/admin/cities')}>
                    <LockIcon className="w-3.5 h-3.5" />
                    排班表查看入口（管理员）→
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================ */}
      {/* Section 9: 环保贡献 - 订单级碳减排 + 电子证书                  */}
      {/* ============================================================ */}
      <section className="py-24 bg-gradient-to-b from-transparent via-forest-950/20 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="mb-14 text-center">
            <Badge variant="success" className="mb-4"><Leaf className="w-3 h-3 mr-1.5" />ESG 可量化</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
              🌱 每一件回收，都是<span className="gold-text">可量化</span>的环保贡献
            </h2>
            <p className="text-ink-400 text-lg max-w-2xl mx-auto">电子证书链上存证 · 每公斤碳减排可追溯 · 环保先锋排行榜</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* 左: 碳减排计算器 */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
            >
              <Card goldBorder>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-jade-500/15 border border-jade-500/30 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-jade-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-ink-100">碳减排换算器</h3>
                    <p className="text-xs text-ink-400">选择品类与型号，实时计算环保贡献</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="text-xs text-ink-400 block mb-1.5">选择品类</label>
                    <select
                      value={ecoCategory}
                      onChange={(e) => { const cat = e.target.value as CategoryId; setEcoCategory(cat); setEcoBrand(categoryBrands[cat][0].id); setEcoCalcStage(0); }}
                      className="w-full h-11 px-3 rounded-xl bg-ink-900 border border-ink-700 focus:border-gold-500/50 focus:outline-none text-ink-200 text-sm transition-colors"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-ink-400 block mb-1.5">品牌型号</label>
                    <select
                      value={ecoBrand}
                      onChange={(e) => { setEcoBrand(e.target.value); setEcoCalcStage(0); setTimeout(() => setEcoCalcStage(4), 100); }}
                      className="w-full h-11 px-3 rounded-xl bg-ink-900 border border-ink-700 focus:border-gold-500/50 focus:outline-none text-ink-200 text-sm transition-colors"
                    >
                      {categoryBrands[ecoCategory as CategoryId].map(b => <option key={b.name} value={b.name}>{b.name} {b.hotModel}</option>)}
                    </select>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {ecoCalcStage >= 4 && (
                    <motion.div
                      key="calc-result"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
                      className="space-y-3"
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-jade-500/15 to-forest-500/10 border border-jade-500/30"
                      >
                        <div className="flex items-baseline gap-2 mb-1">
                          <Leaf className="w-6 h-6 text-jade-400" />
                          <span className="text-4xl font-display font-bold gold-text">{ecoCalc.carbon}</span>
                          <span className="text-ink-300">kg 碳减排</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                          <div><p className="text-ink-500">节省石油</p><p className="text-ink-200 font-bold">{ecoCalc.oil} L</p></div>
                          <div><p className="text-ink-500">节省矿石</p><p className="text-ink-200 font-bold">{ecoCalc.ore} kg</p></div>
                          <div><p className="text-ink-500">减少垃圾</p><p className="text-ink-200 font-bold">{ecoCalc.waste} kg</p></div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-ink-700"
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">🌲</div>
                        <div className="flex-1">
                          <p className="text-xs text-ink-400">等效植树</p>
                          <p className="text-lg font-bold text-ink-200">{ecoCalc.trees} 棵 <span className="text-xs text-ink-500 font-normal">（冷杉 18kg/年）</span></p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-ink-700"
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">⚡</div>
                        <div className="flex-1">
                          <p className="text-xs text-ink-400">等效省电量</p>
                          <p className="text-lg font-bold text-ink-200">{ecoCalc.kwh} 度 <span className="text-xs text-ink-500 font-normal">（家庭可用 {ecoCalc.days} 天）</span></p>
                        </div>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <Button variant="gold" size="md" className="w-full" onClick={() => navigate('/evaluate')}>
                          <Award className="w-4 h-4 mr-2" />
                          回收它，获得专属环保证书 →
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {ecoCalcStage < 4 && (
                  <div className="h-64 flex items-center justify-center text-ink-500 text-sm">
                    <div className="text-center">
                      <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>请选择品类和型号开始计算</p>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* 右: 环保证书示例卡 */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <Card goldBorder className="h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-gold-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-ink-100">环保证书示例</h3>
                    <p className="text-xs text-ink-400">金色全息防伪 · 链上存证可查</p>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-gold-500/40 bg-gradient-to-br from-ink-900 via-forest-950/30 to-ink-900 p-5 mb-4">
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(115deg, transparent 0px, transparent 8px, rgba(212,175,55,0.12) 8px, rgba(212,175,55,0.12) 16px)' }} />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-gold-500/15 to-transparent" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] text-ink-500 tracking-widest">ZHEN · 臻回收 环保贡献电子证书</p>
                        <p className="font-mono text-sm gold-text font-bold">CERT-2026-0615-A8F3E2</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
                        <Leaf className="w-6 h-6 text-ink-950" />
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-4 text-sm">
                      <div className="flex justify-between"><span className="text-ink-500">颁发日期</span><span className="text-ink-200">2026-06-15</span></div>
                      <div className="flex justify-between"><span className="text-ink-500">用户</span><span className="text-ink-200">张**（匿名保护）</span></div>
                      <div className="flex justify-between"><span className="text-ink-500">商品</span><span className="text-ink-200 text-right max-w-[55%]">iPhone 15 Pro Max 512G 钛</span></div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-jade-500/20 to-forest-500/15 border border-jade-500/30 mb-4">
                      <div className="flex items-baseline justify-between mb-2">
                        <div>
                          <p className="text-[10px] text-jade-300 mb-0.5">累计节省碳减排</p>
                          <p className="text-3xl font-display font-bold gold-text">85 kg</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-jade-300 mb-0.5">等效植树</p>
                          <p className="text-3xl font-display font-bold text-jade-300">5 棵</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-ink-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-jade-400 to-gold-500 rounded-full" style={{ width: '72%' }} />
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 text-[10px] text-ink-500 leading-relaxed">
                        本证书已在区块链存证<br />
                        哈希：0xA8F3E2...C7D91B<br />
                        链网络：BSC GreenChain
                      </div>
                      <div className="w-20 h-20 bg-white rounded-lg p-1.5 shrink-0">
                        <div className="w-full h-full bg-ink-900 rounded grid grid-cols-8 grid-rows-8 gap-px p-1">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div key={i} className={Math.random() > 0.45 ? 'bg-gold-500' : 'bg-ink-100'} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="md" className="w-full">
                    <Download className="w-4 h-4 mr-1.5" />
                    下载证书 PDF
                  </Button>
                  <Button variant="ghost" size="md" className="w-full">
                    <QrCode className="w-4 h-4 mr-1.5" />
                    扫码验证
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* 本月环保榜单 */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display font-bold text-ink-100 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gold-500" />
                    本月环保先锋 TOP10
                  </h3>
                  <Badge variant="success">实时更新</Badge>
                </div>

                <div className="space-y-2">
                  {ecoRankData.map((u, i) => (
                    <motion.div
                      key={u.name}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i < 3 ? 'bg-gradient-to-r from-gold-500/10 to-transparent border border-gold-500/20' : 'bg-ink-800/30 hover:bg-ink-800/60'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-ink-950' : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-ink-950' : i === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-amber-50' : 'bg-ink-800 text-ink-400'}`}>
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-ink-200 font-medium truncate">{u.name}</p>
                          {u.units >= 8 && <span className="text-[10px] text-gold-500">🏆</span>}
                        </div>
                        <p className="text-[11px] text-ink-500">累计回收 {u.units} 件</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold gold-text">{u.carbon} kg</p>
                        <p className="text-[10px] text-ink-500">CO₂ 减排</p>
                      </div>
                      <div className="w-20 shrink-0">
                        <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-jade-500 to-gold-500 rounded-full" style={{ width: `${(u.carbon / ecoRankData[0].carbon) * 100}%` }} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* 库存处置结果看板 */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display font-bold text-ink-100 flex items-center gap-2">
                    <Package className="w-5 h-5 text-forest-400" />
                    本月库存处置流向
                  </h3>
                  <Badge variant="default">2026 年 6 月</Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[
                    { label: '二手流通', val: '48%', color: 'text-jade-400', bg: 'bg-jade-500/15', border: 'border-jade-500/30' },
                    { label: '翻新再售', val: '25%', color: 'gold-text', bg: 'bg-gold-500/15', border: 'border-gold-500/30' },
                    { label: '环保拆解', val: '18%', color: 'text-forest-400', bg: 'bg-forest-500/15', border: 'border-forest-500/30' },
                    { label: '公益捐赠', val: '9%', color: 'text-coral-400', bg: 'bg-coral-500/15', border: 'border-coral-500/30' },
                  ].map(x => (
                    <div key={x.label} className={`p-3 rounded-xl ${x.bg} border ${x.border} text-center`}>
                      <p className={`text-2xl font-display font-bold ${x.color}`}>{x.val}</p>
                      <p className="text-[10px] text-ink-400 mt-0.5">{x.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    { label: '二手流通 · 直接上架拍卖或商城', val: 48, color: 'bg-jade-500' },
                    { label: '翻新再售 · 官方质检+翻新后质保', val: 25, color: 'bg-gold-500' },
                    { label: '环保拆解 · 元器件分类回收再利用', val: 18, color: 'bg-forest-500' },
                    { label: '公益捐赠 · 山区学校/公益机构', val: 9, color: 'bg-coral-500' },
                  ].map(x => (
                    <div key={x.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-400">{x.label}</span>
                        <span className="text-ink-200 font-medium">{x.val}%</span>
                      </div>
                      <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${x.val * 1.8}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className={`h-full ${x.color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-ink-800/50 border border-ink-700">
                  <p className="text-xs text-ink-500 mb-2">各渠道平均毛利率</p>
                  <div className="flex items-end gap-3 h-24">
                    {[
                      { l: '拍卖', v: 85, c: 'bg-jade-500' },
                      { l: '翻新', v: 68, c: 'bg-gold-500' },
                      { l: '二手', v: 52, c: 'bg-forest-500' },
                      { l: '拆解', v: 22, c: 'bg-ink-500' },
                    ].map(b => (
                      <div key={b.l} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex-1 flex items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: `${b.v}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.15 }}
                            className={`w-full rounded-t ${b.c}`}
                          />
                        </div>
                        <span className="text-[10px] text-ink-400">{b.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================ */}
      {/* Section 10: 库存周转数据透明                                   */}
      {/* ============================================================ */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="mb-14 text-center">
            <Badge variant="default" className="mb-4"><BarChart3 className="w-3 h-3 mr-1.5 text-gold-500" />数据透明 · 全网唯一公开</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
              📊 库存处置<span className="gold-text">全链路透明</span>
            </h2>
            <p className="text-ink-400 text-lg max-w-2xl mx-auto">每一件去了哪里、卖了多少钱、周转了几天，数据实时可查</p>
          </motion.div>

          {/* 4 KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: '在库总量', val: '1,248', suffix: '件', icon: <Package className="w-5 h-5" />, color: 'text-jade-400', bg: 'from-jade-500/15 to-jade-500/0', border: 'border-jade-500/25' },
              { label: '平均在库', val: '6.8', suffix: '天', icon: <Clock className="w-5 h-5" />, color: 'gold-text', bg: 'from-gold-500/15 to-gold-500/0', border: 'border-gold-500/25' },
              { label: '翻新率', val: '24.7', suffix: '%', icon: <Sparkles className="w-5 h-5" />, color: 'text-forest-400', bg: 'from-forest-500/15 to-forest-500/0', border: 'border-forest-500/25' },
              { label: '月毛利', val: '¥1,856,400', suffix: '', icon: <TrendingUp className="w-5 h-5" />, color: 'text-coral-400', bg: 'from-coral-500/15 to-coral-500/0', border: 'border-coral-500/25' },
            ].map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card goldBorder className={`bg-gradient-to-br ${k.bg} hover:shadow-lg hover:shadow-gold-500/5 transition-all`}>
                  <div className={`${k.color} mb-3`}>{k.icon}</div>
                  <p className="text-sm text-ink-400 mb-1">{k.label}</p>
                  <p className={`text-3xl font-display font-bold ${k.color}`}>
                    {k.val}<span className="text-sm ml-1 text-ink-400">{k.suffix}</span>
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* 在库年龄分布 */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
            >
              <Card goldBorder>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-bold text-ink-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gold-500" />
                    在库年龄分布
                  </h3>
                  <Badge variant="gold">优秀</Badge>
                </div>
                <ReactECharts option={stockAgeOption} style={{ height: 260 }} />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { l: '0-7天', v: '52%', c: 'text-jade-400' },
                    { l: '8-15天', v: '28%', c: 'text-forest-400' },
                    { l: '16-30天', v: '15%', c: 'gold-text' },
                    { l: '>30天', v: '5%', c: 'text-coral-400' },
                  ].map(x => (
                    <div key={x.l} className="text-center">
                      <p className={`font-bold ${x.c}`}>{x.v}</p>
                      <p className="text-[10px] text-ink-500">{x.l}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* 处置渠道毛利堆叠 */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
            >
              <Card goldBorder>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-bold text-ink-100 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-jade-400" />
                    近 6 个月渠道毛利
                  </h3>
                  <span className="text-xs text-ink-500">单位：万元</span>
                </div>
                <ReactECharts option={channelProfitOption} style={{ height: 260 }} />
                <div className="flex items-center justify-center gap-4 mt-2">
                  {[
                    { l: '拍卖', c: '#2DD4BF' },
                    { l: '翻新', c: '#D4AF37' },
                    { l: '二手', c: '#15803D' },
                    { l: '拆解', c: '#6B7280' },
                  ].map(x => (
                    <div key={x.l} className="flex items-center gap-1.5 text-xs text-ink-400">
                      <span className="w-3 h-3 rounded-sm" style={{ background: x.c }} />
                      {x.l}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* 滞销预警 TOP5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
          >
            <Card goldBorder>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-display font-bold text-ink-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-coral-400" />
                  滞销预警 TOP5（超 60 天未出）
                </h3>
                <Badge variant="warning">需关注</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-ink-400 border-b border-ink-700">
                      <th className="text-left py-3 px-2 font-medium">排名</th>
                      <th className="text-left py-3 px-2 font-medium">品牌 / 型号</th>
                      <th className="text-center py-3 px-2 font-medium">在库天数</th>
                      <th className="text-right py-3 px-2 font-medium">成本价</th>
                      <th className="text-center py-3 px-2 font-medium">当前标价</th>
                      <th className="text-left py-3 px-2 font-medium">建议处置方式</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowMovingItems.map((s, i) => (
                      <tr key={i} className="border-b border-ink-800 hover:bg-ink-800/30 transition-colors">
                        <td className="py-3 px-2">
                          <span className={`inline-flex w-7 h-7 items-center justify-center rounded-lg font-bold text-sm ${i === 0 ? 'bg-coral-500/20 text-coral-400 border border-coral-500/30' : i < 3 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-ink-700/50 text-ink-400'}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <p className="text-ink-200 font-medium">{s.brand}</p>
                          <p className="text-xs text-ink-500">{s.model}</p>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-bold ${s.days > 90 ? 'text-coral-400' : s.days > 75 ? 'text-amber-400' : 'gold-text'}`}>{s.days} 天</span>
                        </td>
                        <td className="py-3 px-2 text-right text-ink-300 font-mono">¥{s.cost.toLocaleString()}</td>
                        <td className="py-3 px-2 text-center text-ink-400 font-mono line-through text-xs">¥{s.price.toLocaleString()}</td>
                        <td className="py-3 px-2">
                          <Badge variant={s.suggestion === '降价拍卖' ? 'warning' : s.suggestion === '翻新' ? 'gold' : 'danger'} className="w-full justify-center">
                            {s.suggestion}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 pt-4 border-t border-ink-700 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/inventory')}>
                  <Database className="w-4 h-4 mr-1.5" />
                  完整库存数据看板（管理员）→
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================ */}
      {/* Section 11: 检测报告示例 + 飞检机制详解                        */}
      {/* ============================================================ */}
      <section className="py-24 bg-gradient-to-b from-transparent via-gold-500/5 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="mb-14 text-center">
            <Badge variant="gold" className="mb-4"><ClipboardCheck className="w-3 h-3 mr-1.5" />24 项全检 · 飞检双盲</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
              📝 检测报告<span className="gold-text">24 项全字段公开</span>
            </h2>
            <p className="text-ink-400 text-lg max-w-2xl mx-auto">飞检偏差率实时监控 · 异常单自动预警停训</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* 左: 检测报告示例 */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-3"
            >
              <Card goldBorder className="h-full overflow-hidden">
                {/* 报告头 */}
                <div className="bg-gradient-to-r from-ink-900 via-forest-950/40 to-ink-900 border-b border-gold-500/20 px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-ink-500 tracking-widest mb-1">ZHEN · 臻回收 官方检测报告</p>
                    <p className="font-mono text-sm gold-text font-bold">RPT-2026-0615-8842</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="text-xs gold-text font-bold">李思远 INS-003</p>
                      <p className="text-[10px] text-ink-500">检测师电子签章</p>
                    </div>
                    <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gold-500/40 bg-jade-500/5 flex items-center justify-center">
                      <div className="text-center leading-tight">
                        <p className="text-[8px] text-jade-400 font-bold">中检</p>
                        <p className="text-[7px] gold-text">CIC认证</p>
                        <p className="text-[7px] text-jade-400">✅</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6 max-h-[720px] overflow-y-auto custom-scrollbar">
                  {/* 基本信息 */}
                  <div>
                    <h4 className="text-sm font-bold text-ink-200 mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 gold-text" /> 基本信息
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { k: '品牌型号', v: 'Rolex Submariner 126610LN' },
                        { k: '序列号', v: '0******2 ✅ 已验真' },
                        { k: '成色等级', v: '<span class="gold-text font-bold">S (99新)</span>' },
                        { k: '出厂年份', v: '2023 年 (0字头)' },
                        { k: '表径', v: '41mm 不锈钢' },
                        { k: '建议零售价', v: '<span class="text-2xl gold-text font-bold font-display">¥89,500</span>' },
                      ].map(x => (
                        <div key={x.k} className="p-2.5 rounded-lg bg-ink-800/40 border border-ink-700/60">
                          <p className="text-[10px] text-ink-500 mb-0.5">{x.k}</p>
                          <p className="text-xs text-ink-200" dangerouslySetInnerHTML={{ __html: x.v }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 24 项检测清单 */}
                  <div>
                    <h4 className="text-sm font-bold text-ink-200 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-jade-400" /> 24 项检测清单
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                      {/* 外观类 8 项 */}
                      <div className="p-3 rounded-xl bg-ink-800/30 border border-ink-700/60">
                        <p className="text-xs gold-text font-bold mb-2 pb-1.5 border-b border-ink-700">外观类（8项）</p>
                        <div className="space-y-1.5">
                          {[
                            { n: '正面表圈', s: 'S', r: '完美' },
                            { n: '背面底盖', s: 'S', r: '完美' },
                            { n: '左侧表耳', s: 'A+', r: '细微使用痕' },
                            { n: '右侧表耳', s: 'S', r: '完美' },
                            { n: '边角磕碰', s: 'S', r: '无' },
                            { n: '表镜划痕', s: 'S', r: '完美' },
                            { n: '表冠按键', s: 'A+', r: '轻微光痕' },
                            { n: '表链接口', s: 'S', r: '完美' },
                          ].map(t => (
                            <div key={t.n} className="flex items-center justify-between text-[11px]">
                              <span className="text-ink-400">{t.n}</span>
                              <div className="flex items-center gap-1">
                                <span className={`font-bold ${t.s === 'S' ? 'gold-text' : t.s === 'A+' ? 'text-jade-400' : 'text-forest-400'}`}>{t.s}</span>
                                <CheckCircle2 className="w-3 h-3 text-jade-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 功能类 10 项 */}
                      <div className="p-3 rounded-xl bg-ink-800/30 border border-ink-700/60">
                        <p className="text-xs gold-text font-bold mb-2 pb-1.5 border-b border-ink-700">功能类（10项）</p>
                        <div className="space-y-1.5">
                          {['走时精准(±2s/日)', '自动上链', '手动上链', '日历跳转', '防水100m', '旋入式表冠', '排氦阀', '夜光显示', '表扣锁止', '链节调节'].map(t => (
                            <div key={t} className="flex items-center justify-between text-[11px]">
                              <span className="text-ink-400">{t}</span>
                              <span className="flex items-center gap-0.5 text-jade-400 font-bold">
                                ✅ 通过
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 拆机类 6 项 */}
                      <div className="p-3 rounded-xl bg-ink-800/30 border border-ink-700/60">
                        <p className="text-xs gold-text font-bold mb-2 pb-1.5 border-b border-ink-700">拆机类（6项）</p>
                        <div className="space-y-1.5">
                          {[
                            { n: '机芯状态', v: '3235 原装 ✅' },
                            { n: '防水胶圈', v: '完好 ✅' },
                            { n: '主板动过', v: '无 ✅' },
                            { n: '零件更换', v: '无 ✅' },
                            { n: '维修历史', v: '无 ✅' },
                            { n: '进水痕迹', v: '无 ✅' },
                          ].map(t => (
                            <div key={t.n} className="flex items-center justify-between text-[11px]">
                              <span className="text-ink-400">{t.n}</span>
                              <span className="text-jade-400 font-bold">{t.v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 瑕疵标注 */}
                  <div>
                    <h4 className="text-sm font-bold text-ink-200 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-coral-400" /> 瑕疵标注（共 2 处）
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { pos: '左表耳内侧', size: '0.2mm 微痕', sev: '轻微' },
                        { pos: '表扣外侧', size: '发丝花痕', sev: '轻微' },
                      ].map((f, i) => (
                        <div key={i} className="p-3 rounded-lg bg-coral-500/5 border border-coral-500/20 flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-coral-500/15 border border-coral-500/30 flex items-center justify-center shrink-0">
                            <span className="text-coral-400 font-bold text-xs">#{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-ink-200 font-medium">{f.pos}</p>
                            <p className="text-[10px] text-ink-500 mt-0.5">{f.size}</p>
                          </div>
                          <Badge variant="warning" className="!text-[10px] !py-0 !px-1.5">{f.sev}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 附件检测 */}
                  <div>
                    <h4 className="text-sm font-bold text-ink-200 mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-forest-400" /> 附件检测
                    </h4>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { n: '表盒', ok: true },
                        { n: '保卡', ok: true },
                        { n: '说明书', ok: true },
                        { n: '吊牌', ok: true },
                        { n: '原装带', ok: true },
                        { n: '发票', ok: false },
                      ].map(a => (
                        <div key={a.n} className={`p-2 rounded-lg text-center border ${a.ok ? 'bg-jade-500/10 border-jade-500/25' : 'bg-ink-800/40 border-ink-700'}`}>
                          {a.ok ? <CheckCircle2 className="w-4 h-4 mx-auto text-jade-400 mb-0.5" /> : <XCircle className="w-4 h-4 mx-auto text-ink-500 mb-0.5" />}
                          <p className={`text-[10px] ${a.ok ? 'text-jade-300' : 'text-ink-500'}`}>{a.n}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* 右: 飞检机制 */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* 飞检流程 */}
              <Card>
                <h3 className="text-lg font-display font-bold text-ink-100 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-jade-400" />
                  飞检机制说明
                </h3>
                <div className="space-y-2.5">
                  {[
                    { s: '1', t: '随机算法选单', d: '每 10 单按 15% 抽样', c: 'bg-gold-500/15 border-gold-500/30 gold-text' },
                    { s: '2', t: '派单复检员', d: '跨组互检·身份屏蔽', c: 'bg-forest-500/15 border-forest-500/30 text-forest-400' },
                    { s: '3', t: '独立盲检', d: '不看原报告独立评分', c: 'bg-jade-500/15 border-jade-500/30 text-jade-400' },
                    { s: '4', t: '偏差率比对', d: '3%正常 / 5%红线', c: 'bg-coral-500/15 border-coral-500/30 text-coral-400' },
                  ].map((x, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 ${x.c}`}>
                        {x.s}
                      </div>
                      <div className="flex-1 pb-2 border-b border-ink-800 last:border-0">
                        <p className="text-sm font-medium text-ink-200">{x.t}</p>
                        <p className="text-[11px] text-ink-500">{x.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 飞检仪表盘 */}
              <Card goldBorder>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-display font-bold text-ink-100 flex items-center gap-2">
                    <Gauge className="w-5 h-5 gold-text" />
                    本月飞检仪表盘
                  </h3>
                  <Badge variant="success">优秀</Badge>
                </div>
                <p className="text-xs text-ink-500 mb-1">平均偏差率（全公司 256 人）</p>
                <ReactECharts option={gaugeOption} style={{ height: 190 }} />
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[
                    { l: '飞检单', v: '156', c: 'text-ink-200' },
                    { l: '偏差单', v: '8', c: 'gold-text' },
                    { l: '高风险', v: '0', c: 'text-jade-400' },
                    { l: '停训', v: '2', c: 'text-coral-400' },
                  ].map(x => (
                    <div key={x.l} className="text-center p-1.5 rounded bg-ink-800/40">
                      <p className={`font-bold ${x.c}`}>{x.v}</p>
                      <p className="text-[9px] text-ink-500">{x.l}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 奖惩规则 */}
              <Card>
                <h3 className="text-lg font-display font-bold text-ink-100 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 gold-text" />
                  飞检奖惩规则
                </h3>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gold-500/15 to-transparent border border-gold-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🏆</span>
                      <span className="text-sm font-bold gold-text">奖励机制</span>
                    </div>
                    <p className="text-xs text-ink-300 leading-relaxed">
                      连续 3 个月偏差 <b className="gold-text">{'<1%'}</b> → 月度奖金 ¥2,000 + S 级检测师金色徽章 + 首页推荐位曝光
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-coral-500/15 to-transparent border border-coral-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">⚠️</span>
                      <span className="text-sm font-bold text-coral-400">惩罚机制</span>
                    </div>
                    <p className="text-xs text-ink-300 leading-relaxed">
                      单月偏差 <b className="text-coral-400">{'>5%'}</b> → 立即停单培训 3 天 + 重新考核通过后上岗；累计 2 次 → 降级
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="divider-gold" /></div>

      {/* ============================================================ */}
      {/* Section 12: CTA 最终行动区                                    */}
      {/* ============================================================ */}
      <section className="py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 hero-gradient-bg" />
            <div className="absolute inset-0 bg-gradient-to-br from-forest-950/80 via-ink-950/95 to-ink-950" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-jade-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 px-8 py-20 md:px-16 md:py-28 text-center">
              <Badge variant="gold" className="mb-6 bg-ink-900/60 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 mr-1.5" />
                2026 年度 · 累计服务 128,600+ 用户
              </Badge>

              <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
                闲置奢品，<span className="gold-text">一键变金</span>
              </h2>
              <p className="text-lg md:text-xl text-ink-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                60 秒估价 · 38 城上门 · 当面检测当面打款<br className="hidden md:block" />
                比闲鱼平均高 <b className="gold-text">18.6%</b> · 30 天无理由退货保障
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button variant="gold" size="xl" onClick={() => navigate('/evaluate')} className="w-full sm:w-auto text-base px-10 py-4 shadow-2xl shadow-gold-500/20">
                  <Zap className="w-5 h-5 mr-2" />
                  ⚡ 立即估价
                </Button>
                <Button variant="ghost" size="xl" onClick={() => setShowSupport(true)} className="w-full sm:w-auto text-base px-10 py-4">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  📞 联系客服 + AI 在线答疑
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs text-ink-500 flex-wrap">
                <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-jade-400" />中检认证</div>
                <div className="flex items-center gap-1.5"><LockIcon className="w-3.5 h-3.5 gold-text" />银行级加密</div>
                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-coral-400" />最快 2h 上门</div>
                <div className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-forest-400" />30 天保障</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 客服 Modal */}
      <Modal open={showSupport} onClose={() => setShowSupport(false)} size="sm">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-jade-500/25 to-forest-500/25 border border-jade-500/40 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-jade-400" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-2">AI 客服 · 7×24 在线</h3>
          <p className="text-ink-400 text-sm mb-6">估价咨询 / 订单追踪 / 售后支持</p>

          <div className="space-y-2.5 mb-6 text-left">
            {[
              { q: '如何预约上门检测？', tag: '热门' },
              { q: '检测报告多久能出？', tag: '' },
              { q: '30 天退货怎么申请？', tag: '' },
              { q: '支持哪些支付方式？', tag: '' },
            ].map((f, i) => (
              <button key={i} className="w-full p-3 rounded-xl bg-ink-800/60 hover:bg-ink-800 border border-ink-700 flex items-center justify-between text-left transition-colors group">
                <span className="text-sm text-ink-200 group-hover:gold-text transition-colors">{f.q}</span>
                {f.tag && <Badge variant="gold" className="!text-[10px] !py-0 !px-1.5">{f.tag}</Badge>}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-gold-500/10 to-transparent border border-gold-500/20">
            <p className="text-xs text-ink-500 mb-1">人工客服热线</p>
            <p className="text-2xl font-display font-bold gold-text">400-888-6688</p>
            <p className="text-[10px] text-ink-500 mt-0.5">工作日 9:00-21:00 / 周末 10:00-18:00</p>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="border-t border-ink-800/80 py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <CircleDollarSign className="w-5 h-5 text-ink-950" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl gold-text leading-none">臻回收</p>
                  <p className="text-[10px] text-ink-500 tracking-wider">ZHEN RECYCLE</p>
                </div>
              </div>
              <p className="text-sm text-ink-400 leading-relaxed mb-4">
                国内领先的奢侈品回收服务平台<br />中检认证 · 透明估价 · 上门服务
              </p>
              <div className="flex gap-2">
                {['微信', '微博', '小红书', '抖音'].map(s => (
                  <div key={s} className="w-8 h-8 rounded-lg bg-ink-800 hover:bg-gold-500/20 hover:border-gold-500/30 border border-ink-700 flex items-center justify-center transition-colors cursor-pointer">
                    <Share2 className="w-3.5 h-3.5 text-ink-500" />
                  </div>
                ))}
              </div>
            </div>
            {[
              { t: '服务', l: ['立即估价', '上门检测', '30天保障', '环保回收'] },
              { t: '关于', l: ['平台介绍', '检测师团队', '验真数据库', '新闻动态'] },
              { t: '帮助', l: ['估价标准', '服务流程', '常见问题', '联系客服'] },
            ].map(col => (
              <div key={col.t}>
                <h4 className="text-sm font-bold text-ink-200 mb-4">{col.t}</h4>
                <ul className="space-y-2.5">
                  {col.l.map(x => (
                    <li key={x}>
                      <a className="text-sm text-ink-400 hover:gold-text transition-colors cursor-pointer">{x}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-ink-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-ink-500">© 2026 臻回收 ZHEN RECYCLE · 沪ICP备 2026000000 号-1</p>
            <div className="flex items-center gap-4 text-[10px] text-ink-500">
              <span>隐私政策</span>
              <span>服务协议</span>
              <span>中检认证编号 CIC-2026-LUX-0088</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { HomePage };
export default HomePage;
