import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Upload,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Users,
  Award,
  LayoutGrid,
  ChevronRight,
  Sparkles,
  FileText,
  ArrowRight,
  Camera,
  Building2,
  Home as HomeIcon,
  Eye,
  ShoppingCart,
  FileDown,
  Layers,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Star,
  CheckCircle,
  Zap,
  Calculator,
  Database,
  Truck,
  Brain,
  ClipboardList,
  UserCheck,
  User,
  Repeat,
  RefreshCw,
  Filter,
  Download,
  Loader2,
  Activity,
  Info,
  ExternalLink,
  X,
} from 'lucide-react';
import CaseCard from '@/components/CaseCard';
import { mockCases, mockMaterials, mockQualityScores } from '@/mock/data';

const cityColorMap: Record<string, string> = {
  '北京': 'from-red-400 to-rose-500',
  '上海': 'from-blue-400 to-indigo-500',
  '广州': 'from-emerald-400 to-teal-500',
  '深圳': 'from-cyan-400 to-sky-500',
  '杭州': 'from-green-400 to-emerald-500',
  '成都': 'from-orange-400 to-amber-500',
  '武汉': 'from-violet-400 to-purple-500',
  '南京': 'from-pink-400 to-fuchsia-500',
  '西安': 'from-amber-400 to-yellow-500',
  '重庆': 'from-rose-400 to-red-500',
  '苏州': 'from-teal-400 to-cyan-500',
  '天津': 'from-indigo-400 to-blue-500',
};

type SupplyStatus = '充足' | '正常' | '部分缺货';

interface CitySupplyData {
  name: string;
  count: number;
  color: string;
  supplyStatus: SupplyStatus;
  supplierCount: number;
  stockRate: number;
  deliveryTime: string;
  categories: string[];
}

type PriceCompareStatus = 'compared' | 'comparing' | 'fluctuating';
type PriceTrend = 'up' | 'down' | 'stable';

const supplyStatusColors: Record<SupplyStatus, string> = {
  '充足': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  '正常': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  '部分缺货': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const citySupplyData: CitySupplyData[] = [
  { name: '北京', count: 1856000, color: cityColorMap['北京'], supplyStatus: '充足', supplierCount: 1235, stockRate: 98, deliveryTime: '当日达', categories: ['瓷砖', '地板', '卫浴', '橱柜', '门窗'] },
  { name: '上海', count: 1723000, color: cityColorMap['上海'], supplyStatus: '充足', supplierCount: 1185, stockRate: 97, deliveryTime: '当日达', categories: ['瓷砖', '地板', '卫浴', '橱柜', '门窗', '灯具'] },
  { name: '广州', count: 1458000, color: cityColorMap['广州'], supplyStatus: '充足', supplierCount: 1023, stockRate: 96, deliveryTime: '当日达', categories: ['瓷砖', '地板', '卫浴', '橱柜'] },
  { name: '深圳', count: 1386000, color: cityColorMap['深圳'], supplyStatus: '正常', supplierCount: 856, stockRate: 92, deliveryTime: '次日达', categories: ['瓷砖', '地板', '卫浴', '门窗'] },
  { name: '杭州', count: 1125000, color: cityColorMap['杭州'], supplyStatus: '充足', supplierCount: 987, stockRate: 95, deliveryTime: '次日达', categories: ['瓷砖', '地板', '卫浴', '橱柜', '门窗'] },
  { name: '成都', count: 987000, color: cityColorMap['成都'], supplyStatus: '正常', supplierCount: 785, stockRate: 88, deliveryTime: '次日达', categories: ['瓷砖', '地板', '卫浴'] },
  { name: '武汉', count: 892000, color: cityColorMap['武汉'], supplyStatus: '正常', supplierCount: 698, stockRate: 85, deliveryTime: '3-5日', categories: ['瓷砖', '地板', '橱柜'] },
  { name: '南京', count: 824000, color: cityColorMap['南京'], supplyStatus: '部分缺货', supplierCount: 523, stockRate: 76, deliveryTime: '3-5日', categories: ['瓷砖', '地板', '卫浴'] },
  { name: '西安', count: 756000, color: cityColorMap['西安'], supplyStatus: '正常', supplierCount: 612, stockRate: 82, deliveryTime: '3-5日', categories: ['瓷砖', '地板', '门窗'] },
  { name: '重庆', count: 698000, color: cityColorMap['重庆'], supplyStatus: '部分缺货', supplierCount: 489, stockRate: 72, deliveryTime: '3-5日', categories: ['瓷砖', '卫浴', '橱柜'] },
  { name: '苏州', count: 623000, color: cityColorMap['苏州'], supplyStatus: '充足', supplierCount: 558, stockRate: 93, deliveryTime: '次日达', categories: ['瓷砖', '地板', '卫浴', '橱柜'] },
  { name: '天津', count: 512000, color: cityColorMap['天津'], supplyStatus: '正常', supplierCount: 442, stockRate: 86, deliveryTime: '次日达', categories: ['瓷砖', '地板', '卫浴'] },
];

const hotCities = [...citySupplyData].sort((a, b) => b.count - a.count);

const stats = [
  {
    label: '案例数据规模',
    value: 12800000,
    suffix: '+',
    sublabel: '千万级案例库持续同步',
    icon: Database,
    color: 'from-teal-500 to-cyan-600',
    isMillion: true,
    dataSource: '全国28省市2,300+装修公司ERP系统同步',
    samplingMethod: '全量同步 · 每月抽样复核1%',
    traceType: 'navigate' as const,
    traceUrl: '/cases',
    traceLabel: '案例库',
    updateFrequency: '每日同步',
    lastReviewDate: '2026-06-10',
  },
  {
    label: '覆盖城市',
    value: 320,
    suffix: '+',
    sublabel: '全国主要城市已开通',
    icon: MapPin,
    color: 'from-orange-500 to-amber-600',
    dataSource: '住建部公开数据 + 合作装修公司覆盖',
    samplingMethod: '地级市及以上城市全覆盖',
    traceType: 'scroll' as const,
    traceTarget: 'city-supply-section',
    traceLabel: '城市供应热力区',
    updateFrequency: '每月更新',
    lastReviewDate: '2026-06-01',
  },
  {
    label: '认证设计师',
    value: 32000,
    suffix: '+',
    sublabel: '严格资质审核入驻',
    icon: Award,
    color: 'from-violet-500 to-indigo-600',
    dataSource: '中国建筑装饰协会认证 + 平台资质审核',
    samplingMethod: '100%资质核验 · 每季度复查',
    traceType: 'navigate' as const,
    traceUrl: '/admin/dashboard',
    traceLabel: '管理后台',
    updateFrequency: '实时审核',
    lastReviewDate: '2026-06-15',
  },
  {
    label: '核验通过率',
    value: 98.6,
    suffix: '%',
    sublabel: '多维度质量评分模型',
    icon: ShieldCheck,
    color: 'from-rose-500 to-pink-600',
    isDecimal: true,
    dataSource: 'AI质检 + 第三方监理复核 + 业主确认',
    samplingMethod: '所有上线案例100%核验',
    traceType: 'scroll' as const,
    traceTarget: 'quality-assurance-section',
    traceLabel: '质量保障链路区',
    updateFrequency: '每案例核验',
    lastReviewDate: '2026-06-14',
    hasScoreModel: true,
  },
];

type StatItem = typeof stats[0];

function useCountUp(target: number) {
  return { count: target };
}

function formatNumber(num: number, isDecimal: boolean = false) {
  if (isDecimal) {
    return num.toFixed(1);
  }
  if (num >= 100000000) {
    const yi = num / 100000000;
    return yi.toFixed(1).replace(/\.0$/, '') + '亿';
  }
  if (num >= 10000) {
    const wan = num / 10000;
    const wanStr = wan.toFixed(1).replace(/\.0$/, '');
    return parseInt(wanStr).toLocaleString('zh-CN') + (wanStr.includes('.') ? wanStr.slice(wanStr.indexOf('.')) : '') + '万';
  }
  if (num >= 1000) {
    return Math.floor(num).toLocaleString('zh-CN');
  }
  return Math.floor(num).toString();
}

function formatCityCount(num: number) {
  if (num >= 10000) {
    const wan = num / 10000;
    return wan.toFixed(1) + '万';
  }
  return Math.floor(num).toLocaleString('zh-CN');
}

function StatCard({
  stat,
  delay,
  index,
  onTraceClick,
  onCredibilityClick,
  onScoreModelClick,
}: {
  stat: StatItem;
  delay: number;
  index: number;
  onTraceClick: (stat: StatItem) => void;
  onCredibilityClick: (tabIndex: number) => void;
  onScoreModelClick?: () => void;
}) {
  const { count } = useCountUp(stat.value);
  const Icon = stat.icon;

  return (
    <div
      className="relative p-6 bg-white rounded-2xl shadow-lg border border-gray-100 dark:bg-slate-800 dark:border-slate-700 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-heading">
        {formatNumber(count, stat.isDecimal)}{stat.suffix}
        <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1">（{stat.sublabel}）</span>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">{stat.label}</div>

      <div className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-start gap-1">
          <Database className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
          <span className="line-clamp-1">来源：{stat.dataSource}</span>
        </div>
        <div className="flex items-start gap-1">
          <RefreshCw className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
          <span className="line-clamp-1">抽样口径：{stat.samplingMethod}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCredibilityClick(index);
            }}
            className="inline-flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline underline-offset-2 hover:no-underline transition-colors"
          >
            <Info className="w-3 h-3" />
            <span>数据可追溯</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTraceClick(stat);
            }}
            className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>查看{stat.traceLabel}</span>
          </button>
          {stat.hasScoreModel && onScoreModelClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onScoreModelClick();
              }}
              className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors font-medium"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>查看评分模型</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const decisionSteps = [
  { icon: Eye, title: '浏览案例', desc: '按城市、风格、户型筛选', path: '/cases', color: 'from-teal-500 to-cyan-600' },
  { icon: Layers, title: '查看详细数据', desc: '户型图/水电图/验收照片', path: '/cases/case-001?section=evidence', color: 'from-orange-500 to-amber-600' },
  { icon: Sparkles, title: '3D方案预览', desc: 'AI户型匹配与3D漫游', path: '/floorplan-match', color: 'from-violet-500 to-indigo-600' },
  { icon: ShoppingCart, title: '采购清单比价', desc: '建材多渠道比价', path: '/purchase-list', color: 'from-emerald-500 to-teal-600' },
  { icon: FileDown, title: '生成PDF交付包', desc: '一键导出完整方案', path: '/purchase-list', color: 'from-rose-500 to-pink-600' },
];

const qualitySteps = [
  { icon: ClipboardList, title: '数据采集', desc: 'ERP系统对接 · 人工审核', color: 'from-teal-500 to-cyan-600' },
  { icon: Brain, title: 'AI质检', desc: '图像识别 · OCR反查 · 异常检测', color: 'from-violet-500 to-indigo-600' },
  { icon: UserCheck, title: '监理复核', desc: '第三方监理 · 现场核查', color: 'from-orange-500 to-amber-600' },
  { icon: User, title: '业主确认', desc: '业主验收 · 评价反馈', color: 'from-rose-500 to-pink-600' },
  { icon: Repeat, title: '定期抽检', desc: '月度抽检 · 季度复审', color: 'from-emerald-500 to-teal-600' },
];

type MaterialVerifyStatus = 'verified' | 'pending' | 'expired';

interface PriceCompareItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  bestChannel: string;
  bestPrice: number;
  saveAmount: number;
  jdPrice?: number;
  tmallPrice?: number;
  localPrice?: number;
  status: MaterialVerifyStatus;
  priceSource: string;
  localSupply: string;
  formula: string;
  compareStatus: PriceCompareStatus;
  priceTrend: PriceTrend;
  priceChange: number;
  lastUpdated: string;
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '刚刚更新';
  if (diffMins < 60) return `${diffMins}分钟前更新`;
  if (diffHours < 24) return `${diffHours}小时前更新`;
  if (diffDays < 7) return `${diffDays}天前更新`;
  return date.toLocaleDateString('zh-CN');
}

const priceCompareList: PriceCompareItem[] = mockMaterials.slice(0, 3).map((m, idx) => {
  const prices = [
    { channel: '京东', price: m.jdPrice },
    { channel: '天猫', price: m.tmallPrice },
    { channel: '本地', price: m.localSuppliers?.[0]?.price },
  ].filter((p): p is { channel: string; price: number } => p.price != null);
  const best = prices.reduce((min, p) => (p.price < min.price ? p : min), prices[0]);
  const maxPrice = Math.max(...prices.map(p => p.price));
  const statuses: MaterialVerifyStatus[] = ['verified', 'pending', 'verified'];
  const localSupplies = [
    '北京朝阳建材市场 · 现货 · 当日配送',
    '上海浦东建材城 · 现货 · 次日配送',
    '广州白云建材城 · 现货 · 当日配送',
  ];
  const formulas = [
    '用量=面积×1.05（含5%损耗）',
    '用量=面积×1.1（含10%损耗）',
    '用量=(长×宽)×0.8（按需裁切）',
  ];
  const compareStatuses: PriceCompareStatus[] = ['compared', 'comparing', 'fluctuating'];
  const priceTrends: PriceTrend[] = ['down', 'stable', 'up'];
  const priceChanges = [-3.2, 0.5, 6.8];
  const lastUpdatedTimes = [
    new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  ];
  return {
    id: m.id,
    name: `${m.brand} ${m.model}`,
    brand: m.brand,
    model: m.model,
    bestChannel: best.channel,
    bestPrice: best.price,
    saveAmount: maxPrice - best.price,
    jdPrice: m.jdPrice,
    tmallPrice: m.tmallPrice,
    localPrice: m.localSuppliers?.[0]?.price,
    status: statuses[idx % 3],
    priceSource: '京东API实时 · 天猫API实时 · 本地建材市场实地采价',
    localSupply: localSupplies[idx % 3],
    formula: formulas[idx % 3],
    compareStatus: compareStatuses[idx % 3],
    priceTrend: priceTrends[idx % 3],
    priceChange: priceChanges[idx % 3],
    lastUpdated: lastUpdatedTimes[idx % 3],
  };
});

type DesignerReviewStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

interface DesignerWithExtra {
  id: string;
  name: string;
  avatar: string;
  status: DesignerReviewStatus;
  applyTime?: string;
  createdAt?: Date;
  qualityScore: number;
  completedCases: number;
  portfolioCount: number;
  certificationVerified: boolean;
  reviewProgress: string;
  reviewer?: string;
  rejectionReason?: string;
}

const recentDesigners: DesignerWithExtra[] = [
  {
    id: 'designer-pending-1',
    name: '赵磊',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaolei',
    status: 'pending',
    applyTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    qualityScore: 0,
    completedCases: 0,
    portfolioCount: 8,
    certificationVerified: true,
    reviewProgress: '已提交2小时 · 预计1小时内处理',
  },
  {
    id: 'designer-reviewing-1',
    name: '孙雪',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunxue',
    status: 'reviewing',
    applyTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    qualityScore: 0,
    completedCases: 0,
    portfolioCount: 12,
    certificationVerified: true,
    reviewProgress: '资质核验中 · 由张监理处理',
    reviewer: '张监理',
  },
  {
    id: 'designer-approved-1',
    name: '林思远',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linsiyuan',
    status: 'approved',
    applyTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    qualityScore: 4.8,
    completedCases: 12,
    portfolioCount: 15,
    certificationVerified: true,
    reviewProgress: '审核通过 · 已上线12套案例',
  },
  {
    id: 'designer-rejected-1',
    name: '周杰',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoujie',
    status: 'rejected',
    applyTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    qualityScore: 0,
    completedCases: 0,
    portfolioCount: 3,
    certificationVerified: false,
    reviewProgress: '审核拒绝 · 原因：资质存疑',
    rejectionReason: '资质存疑',
  },
];

interface QualityScoreItem {
  id: string;
  title: string;
  totalScore: number;
  completeness: number;
  photoQuality: number;
  dataAccuracy: number;
  designScore: number;
  scoreSource: string;
  reviewRecords: { date: string; reviewer: string; type: string }[];
  deliverableCount: number;
  lastRecheckTime: string;
  recheckCount: number;
  recheckPassed: boolean;
}

const qualityScoreList: QualityScoreItem[] = mockQualityScores.slice(0, 2).map((qs, idx) => {
  const caseItem = mockCases.find((c) => c.id === qs.caseId);
  const reviewRecordSets = [
    [
      { date: '2025-03-15', reviewer: '监理·刘工', type: '第1次评分' },
      { date: '2025-04-20', reviewer: 'AI质检', type: '第2次复查' },
      { date: '2025-05-01', reviewer: '业主验收', type: '最终确认' },
    ],
    [
      { date: '2025-02-10', reviewer: '监理·王工', type: '第1次评分' },
      { date: '2025-03-15', reviewer: 'AI质检', type: '第2次复查' },
      { date: '2025-04-05', reviewer: '业主验收', type: '最终确认' },
    ],
  ];
  const lastRecheckTimes = [
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  ];
  const recheckCounts = [3, 2];
  return {
    id: qs.id,
    title: caseItem?.title || '',
    totalScore: qs.totalScore || 0,
    completeness: qs.completeness || 0,
    photoQuality: qs.photoQuality || 0,
    dataAccuracy: qs.dataAccuracy || 0,
    designScore: qs.designScore || 0,
    scoreSource: '监理评分 + AI质检 + 业主反馈',
    reviewRecords: reviewRecordSets[idx % 2],
    deliverableCount: 6,
    lastRecheckTime: lastRecheckTimes[idx % 2],
    recheckCount: recheckCounts[idx % 2],
    recheckPassed: true,
  };
});

type PdfDeliveryStatus = 'delivered' | 'pending' | 'generating';

interface PdfDeliveryItem {
  id: string;
  caseName: string;
  generatedAt: string;
  pages: number;
  status: PdfDeliveryStatus;
  hasWatermark: boolean;
  watermarkInfo: string;
  pageDetails: string;
  downloadCount: number;
  generationTime: number;
  deliveredAt?: string;
}

const pdfDeliveryList: PdfDeliveryItem[] = [
  {
    id: 'pdf-001',
    caseName: mockCases[0]?.title?.slice(0, 12) + '...' || '案例方案',
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    pages: 32,
    status: 'delivered',
    hasWatermark: true,
    watermarkInfo: '水印含业主姓名、案例ID、交付日期',
    pageDetails: '封面1 · 户型图2 · 水电图3 · 验收照片12 · 建材清单6 · 施工数据8',
    downloadCount: 3,
    generationTime: 2.3,
  },
  {
    id: 'pdf-002',
    caseName: mockCases[1]?.title?.slice(0, 12) + '...' || '案例方案',
    generatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    pages: 38,
    status: 'generating',
    hasWatermark: false,
    watermarkInfo: '水印含业主姓名、案例ID、交付日期',
    pageDetails: '封面1 · 户型图3 · 水电图4 · 验收照片14 · 建材清单7 · 施工数据9',
    downloadCount: 0,
    generationTime: 0,
  },
  {
    id: 'pdf-003',
    caseName: mockCases[2]?.title?.slice(0, 12) + '...' || '案例方案',
    generatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    pages: 28,
    status: 'pending',
    hasWatermark: true,
    watermarkInfo: '水印含业主姓名、案例ID、交付日期',
    pageDetails: '封面1 · 户型图2 · 水电图2 · 验收照片10 · 建材清单5 · 施工数据8',
    downloadCount: 0,
    generationTime: 1.8,
  },
  {
    id: 'pdf-004',
    caseName: mockCases[3]?.title?.slice(0, 12) + '...' || '案例方案',
    generatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    pages: 42,
    status: 'delivered',
    hasWatermark: true,
    watermarkInfo: '水印含业主姓名、案例ID、交付日期',
    pageDetails: '封面1 · 户型图4 · 水电图5 · 验收照片16 · 建材清单8 · 施工数据8',
    downloadCount: 5,
    generationTime: 3.1,
  },
];

const pendingDesignerCountNew = recentDesigners.filter((d) => d.status === 'pending' || d.status === 'reviewing').length;

export default function Home() {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [citySearchKeyword, setCitySearchKeyword] = useState('');
  const [showCredibilityModal, setShowCredibilityModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showSyncLogModal, setShowSyncLogModal] = useState(false);

  const featuredCases = mockCases.slice(0, 6);
  
  const todayGeneratedCount = pdfDeliveryList.filter(p => 
    new Date(p.generatedAt).toDateString() === new Date().toDateString()
  ).length;

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/cases?city=${encodeURIComponent(citySearchKeyword)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/cases?keyword=${encodeURIComponent(searchKeyword)}`);
  };

  const handleCityClick = (city: string) => {
    navigate(`/cases?city=${encodeURIComponent(city)}`);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTraceClick = (stat: StatItem) => {
    if (stat.traceType === 'navigate' && stat.traceUrl) {
      navigate(stat.traceUrl);
    } else if (stat.traceType === 'scroll' && stat.traceTarget) {
      scrollToSection(stat.traceTarget);
    }
  };

  const openCredibilityModal = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setShowCredibilityModal(true);
  };

  const syncLogData = [
    { time: '2026-06-15 09:30', source: '北京装修公司ERP', count: 256, status: '成功' },
    { time: '2026-06-15 08:00', source: '上海装修公司ERP', count: 189, status: '成功' },
    { time: '2026-06-15 06:30', source: '广州装修公司ERP', count: 142, status: '成功' },
    { time: '2026-06-15 05:00', source: '深圳装修公司ERP', count: 135, status: '成功' },
    { time: '2026-06-15 03:30', source: '杭州装修公司ERP', count: 98, status: '成功' },
    { time: '2026-06-15 02:00', source: '成都装修公司ERP', count: 87, status: '成功' },
    { time: '2026-06-15 00:30', source: '武汉装修公司ERP', count: 76, status: '成功' },
    { time: '2026-06-14 23:00', source: '南京装修公司ERP', count: 65, status: '成功' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-300/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 container text-center px-4 pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8 animate-fade-in-down">
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span className="text-sm text-teal-100">千万级案例数据平台</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up font-heading">
            真实施工数据，
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-teal-200 via-cyan-200 to-teal-300 bg-clip-text text-transparent">
              让装修决策有据可依
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-teal-100/80 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            聚合1,280万+真实施工案例、320+城市建材供应数据、3.2万+认证设计师资源，以户型匹配、建材比价、验收核验三维驱动装修决策
          </p>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl p-2 gap-2">
              <div className="flex items-center flex-1 gap-3 px-4">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索1,280万+真实案例、320+城市、3.2万+设计师..."
                  className="flex-1 py-3 text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none text-base"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">搜索案例</span>
              </button>
            </div>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <button
              onClick={() => navigate('/floorplan-match')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 font-medium"
            >
              <Upload className="w-5 h-5" />
              <span>上传户型图找相似</span>
            </button>
            <button
              onClick={() => navigate('/cases')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent-600 transition-all duration-300 font-medium shadow-lg"
            >
              <LayoutGrid className="w-5 h-5" />
              <span>浏览全部案例</span>
            </button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-teal-100/60 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="text-sm">验收照片实地拍摄 · 千万张核验入库</span>
            </div>
            <div className="w-px h-4 bg-teal-100/20" />
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">建材数据真实比价 · 京东/天猫/本地三渠道 · 百万级SKU</span>
            </div>
            <div className="w-px h-4 bg-teal-100/20" />
            <div className="flex items-center gap-2">
              <HomeIcon className="w-4 h-4" />
              <span className="text-sm">户型匹配AI智能 · 千万级样本训练 · 95.8%识别准确率</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-white/50 rotate-90" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">平台数据</h2>
            <p className="text-gray-500 dark:text-gray-400">用真实数据说话，让装修不再盲目</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <StatCard
                key={stat.label}
                stat={stat}
                delay={idx * 100}
                index={idx}
                onTraceClick={handleTraceClick}
                onCredibilityClick={openCredibilityModal}
                onScoreModelClick={() => scrollToSection('quality-assurance-section')}
              />
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-teal-500 animate-spin-slow" />
              <span>● 实时同步 · 最近同步：2026-06-15 09:30 · 今日新增：1,284例</span>
            </div>
            <button
              onClick={() => setShowSyncLogModal(true)}
              className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline underline-offset-2 transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>同步日志</span>
            </button>
          </div>
        </div>
      </section>

      {/* Hot Cities Section */}
      <section id="city-supply-section" className="py-20 bg-white dark:bg-slate-800">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">城市建材供应热力</h2>
              <p className="text-gray-500 dark:text-gray-400">查看各城市案例规模与建材供应状态</p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="hidden sm:inline-flex items-center gap-1 text-primary hover:text-primary-600 font-medium transition-colors"
            >
              查看全部320个城市
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {hotCities.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCityClick(city.name)}
                className="group relative p-5 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${city.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${supplyStatusColors[city.supplyStatus]}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {city.supplyStatus}
                  </span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">{city.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span className="font-medium text-primary">{formatCityCount(city.count)}+</span> 案例
                </div>
                <div className="space-y-1.5 mb-2">
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                    <Truck className="w-3 h-3" />
                    <span>本地供应商{city.supplierCount.toLocaleString()}家 · 现货率{city.stockRate}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span className="inline-flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        city.deliveryTime === '当日达' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        city.deliveryTime === '次日达' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {city.deliveryTime}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {city.categories.slice(0, 4).map((cat, idx) => (
                    <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                      {cat}
                    </span>
                  ))}
                  {city.categories.length > 4 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                      +{city.categories.length - 4}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-8">
            <form onSubmit={handleCitySearch} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
              <div className="relative flex-1 w-full">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={citySearchKeyword}
                  onChange={(e) => setCitySearchKeyword(e.target.value)}
                  placeholder="输入城市名称查询供应状态"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                查询供应
              </button>
            </form>
          </div>
          <div className="mt-6 text-center sm:hidden">
            <button
              onClick={() => navigate('/cases')}
              className="inline-flex items-center gap-1 text-primary hover:text-primary-600 font-medium transition-colors"
            >
              查看全部320个城市
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Cases Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">可核验真实案例</h2>
              <p className="text-gray-500 dark:text-gray-400">所有案例均含户型SVG、水电点位、验收照片、建材清单，支持施工质量追溯</p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="hidden sm:inline-flex items-center gap-1 text-primary hover:text-primary-600 font-medium transition-colors"
            >
              查看更多
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCases.map((caseItem, idx) => (
              <div
                key={caseItem.id}
                style={{ animationDelay: `${idx * 100}ms` }}
                className="animate-fade-in-up"
              >
                <CaseCard caseData={caseItem} showSource={true} expandable={true} />
              </div>
            ))}
          </div>
          <div className="mt-10 text-center sm:hidden">
            <button
              onClick={() => navigate('/cases')}
              className="btn-primary inline-flex items-center gap-2"
            >
              查看更多案例
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Decision Chain Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">决策链路</h2>
            <p className="text-gray-500 dark:text-gray-400">从浏览到交付，一站式闭环服务</p>
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0">
            {decisionSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex items-center">
                  <button
                    onClick={() => navigate(step.path)}
                    className="group relative w-48 p-5 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center"
                  >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow">
                      {idx + 1}
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">{step.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{step.desc}</div>
                  </button>
                  {idx < decisionSteps.length - 1 && (
                    <div className="hidden lg:flex items-center px-3 text-gray-300 dark:text-gray-600">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                  {idx < decisionSteps.length - 1 && (
                    <div className="lg:hidden text-gray-300 dark:text-gray-600 my-1">
                      <ChevronRight className="w-4 h-4 rotate-90 mx-auto" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quality Assurance Section */}
      <section id="quality-assurance-section" className="py-20 bg-white dark:bg-slate-800">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">质量保障链路</h2>
            <p className="text-gray-500 dark:text-gray-400">五重质量控制，确保案例数据真实可靠</p>
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0 mb-10">
            {qualitySteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex items-center w-full lg:w-auto">
                  <div className="group relative flex-1 lg:w-48 p-5 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow">
                      {idx + 1}
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">{step.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{step.desc}</div>
                  </div>
                  {idx < qualitySteps.length - 1 && (
                    <div className="hidden lg:flex items-center px-3 text-gray-300 dark:text-gray-600">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                  {idx < qualitySteps.length - 1 && (
                    <div className="lg:hidden text-gray-300 dark:text-gray-600 my-1">
                      <ChevronRight className="w-4 h-4 rotate-90 mx-auto" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                质量问题召回率：<span className="font-bold text-green-600 dark:text-green-400">0.3%</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                用户满意度：<span className="font-bold text-amber-600 dark:text-amber-400">96.8%</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Business Data Preview Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">平台业务运行中</h2>
            <p className="text-gray-500 dark:text-gray-400">实时展示平台真实业务数据与审核状态</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Panel 1: Purchase Price Compare - Teal */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className="p-4 pb-3 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">采购比价结果</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        实时比价中
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">建材多渠道价格对比</p>
                  </div>
                </div>
                <div className="space-y-2.5 flex-1 flex flex-col justify-start overflow-auto">
                  {priceCompareList.map((item) => (
                    <div key={item.id} className="p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex-shrink-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.compareStatus === 'compared' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              <CheckCircle className="w-2.5 h-2.5" />
                              已比价
                            </span>
                          )}
                          {item.compareStatus === 'comparing' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              比价中
                            </span>
                          )}
                          {item.compareStatus === 'fluctuating' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              价格波动
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs mb-1.5 flex-wrap">
                        {item.jdPrice && (
                          <span className={`px-2 py-0.5 rounded ${item.bestChannel === '京东' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                            京东 ¥{item.jdPrice}
                          </span>
                        )}
                        {item.tmallPrice && (
                          <span className={`px-2 py-0.5 rounded ${item.bestChannel === '天猫' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                            天猫 ¥{item.tmallPrice}
                          </span>
                        )}
                        {item.localPrice && (
                          <span className={`px-2 py-0.5 rounded ${item.bestChannel === '本地' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                            本地 ¥{item.localPrice}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          <span>{item.bestChannel}最优 · 省¥{item.saveAmount}</span>
                        </div>
                        <div className={`flex items-center gap-0.5 text-xs font-semibold ${
                          item.priceTrend === 'up' ? 'text-red-600 dark:text-red-400' :
                          item.priceTrend === 'down' ? 'text-green-600 dark:text-green-400' :
                          'text-gray-500 dark:text-gray-400'
                        }`}>
                          {item.priceTrend === 'up' && <TrendingUp className="w-3 h-3" />}
                          {item.priceTrend === 'down' && <TrendingDown className="w-3 h-3" />}
                          {item.priceTrend === 'stable' && <Minus className="w-3 h-3" />}
                          <span>
                            {item.priceTrend === 'up' ? '↑' : item.priceTrend === 'down' ? '↓' : '↔'}
                            {Math.abs(item.priceChange)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        <Clock className="w-3 h-3 text-teal-500" />
                        <span>{getRelativeTime(item.lastUpdated)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        <Zap className="w-3 h-3 text-teal-500" />
                        <span className="truncate">{item.priceSource}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        <MapPin className="w-3 h-3 text-teal-500" />
                        <span className="truncate">{item.localSupply}</span>
                      </div>
                      <div className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 mb-2">
                        <Calculator className="w-3 h-3" />
                        <span>{item.formula}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate('/purchase-list?from=home&action=add&id=' + item.id)}
                          className="flex-1 text-xs py-1.5 px-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium transition-colors"
                        >
                          加入采购清单
                        </button>
                        <button
                          onClick={() => navigate('/purchase-list?from=home&id=' + item.id)}
                          className="flex-1 text-xs py-1.5 px-2 rounded-lg bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-200 font-medium transition-colors inline-flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          查看详情
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 flex-shrink-0 space-y-2">
                <button
                  onClick={() => navigate('/purchase-list?batchAdd=true')}
                  className="w-full text-xs py-1.5 px-3 rounded-lg bg-teal-100 dark:bg-teal-900/30 hover:bg-teal-200 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-400 font-medium transition-colors inline-flex items-center justify-center gap-1"
                >
                  <ShoppingCart className="w-3 h-3" />
                  批量加入采购清单
                </button>
                <button
                  onClick={() => navigate('/purchase-list?report=today')}
                  className="w-full inline-flex items-center justify-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
                >
                  <Activity className="w-4 h-4" />
                  查看今日比价报告
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel 2: Designer Review Status - Violet */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className="p-4 pb-3 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">设计师审核状态</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        今日待审核：{pendingDesignerCountNew}位
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">入驻申请实时审核</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-2 flex-shrink-0">
                  <div className="text-center p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-base font-bold text-green-600 dark:text-green-400">83%</div>
                    <div className="text-[9px] text-green-600/80 dark:text-green-400/80">今日通过率</div>
                  </div>
                  <div className="text-center p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-base font-bold text-blue-600 dark:text-blue-400">2.3h</div>
                    <div className="text-[9px] text-blue-600/80 dark:text-blue-400/80">平均审核时长</div>
                  </div>
                  <div className="text-center p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400">{pendingDesignerCountNew}</div>
                    <div className="text-[9px] text-amber-600/80 dark:text-amber-400/80">待审核队列</div>
                  </div>
                </div>
                <div className="space-y-2 flex-1 flex flex-col justify-start overflow-auto">
                  {recentDesigners.map((d) => (
                    <div key={d.id} className="p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex-shrink-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <img
                          src={d.avatar}
                          alt={d.name}
                          className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{d.name}</span>
                            {d.certificationVerified && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                资质已核验
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {d.reviewProgress}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {d.status === 'pending' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              <Clock className="w-2.5 h-2.5" />
                              待审核
                            </span>
                          )}
                          {d.status === 'reviewing' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              审核中
                            </span>
                          )}
                          {d.status === 'approved' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              <CheckCircle className="w-2.5 h-2.5" />
                              已通过
                            </span>
                          )}
                          {d.status === 'rejected' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              已拒绝
                            </span>
                          )}
                        </div>
                        {(d.status === 'pending' || d.status === 'reviewing') && (
                          <button
                            onClick={() => navigate(`/admin/dashboard?designerId=${d.id}`)}
                            className="text-[10px] py-1 px-2 rounded bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors flex-shrink-0"
                          >
                            快速审核
                          </button>
                        )}
                        {d.status === 'approved' && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span className="font-semibold text-amber-600 dark:text-amber-400">{d.qualityScore}</span>
                            <span>· {d.completedCases}套案例</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 flex-shrink-0">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full inline-flex items-center justify-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors"
                >
                  进入审核后台
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel 3: Quality Score Samples - Orange */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className="p-4 pb-3 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">质量评分样本</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">多维度案例质量评估</p>
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <CheckCircle className="w-2.5 h-2.5" />
                        本月复查通过率：98.6%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5 flex-1 flex flex-col justify-start overflow-auto">
                  {qualityScoreList.map((qs) => (
                    <div key={qs.id} className="p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex-shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-2">{qs.title?.slice(0, 10)}...</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{qs.totalScore?.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 mb-2">
                        {[
                          { label: '完整性', value: qs.completeness },
                          { label: '照片质量', value: qs.photoQuality },
                          { label: '数据准确性', value: qs.dataAccuracy },
                          { label: '设计创意', value: qs.designScore },
                        ].map((dim) => (
                          <div key={dim.label} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 w-12 flex-shrink-0">{dim.label}</span>
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${((dim.value || 0) / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 w-6 text-right flex-shrink-0">{dim.value?.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
                        <div className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-orange-500" />
                          <span>最近复查：{getRelativeTime(qs.lastRecheckTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Repeat className="w-3 h-3 text-orange-500" />
                          <span>已复查{qs.recheckCount}次</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
                        <Zap className="w-3 h-3 text-orange-500" />
                        <span className="truncate">{qs.scoreSource}</span>
                      </div>
                      <div className="space-y-0.5 mb-1.5">
                        {qs.reviewRecords.map((rec, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                            <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                            <span>✓ {rec.type}：{rec.date} {rec.reviewer}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
                          <FileText className="w-3 h-3" />
                          <span>{qs.deliverableCount}类资料可导出</span>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/dashboard?recheckCaseId=${qs.id}`)}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          启动复查
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 flex-shrink-0 space-y-2">
                <button
                  onClick={() => navigate('/admin/dashboard?action=batchRecheck')}
                  className="w-full text-xs py-1.5 px-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 font-medium transition-colors inline-flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  启动新一轮复查
                </button>
                <button
                  onClick={() => navigate('/admin/dashboard?section=quality')}
                  className="w-full inline-flex items-center justify-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors"
                >
                  查看评分模型
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel 4: PDF Delivery Records - Emerald */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className="p-4 pb-3 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                    <FileDown className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">PDF交付记录</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                        <FileText className="w-2.5 h-2.5" />
                        今日生成：{todayGeneratedCount}份
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">方案文档一键导出</p>
                  </div>
                </div>
                <div className="space-y-2.5 flex-1 flex flex-col justify-start overflow-auto">
                  {pdfDeliveryList.map((pdf) => (
                    <div key={pdf.id} className="p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex-shrink-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{pdf.caseName}</span>
                        <div className="flex-shrink-0">
                          {pdf.status === 'delivered' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              <CheckCircle className="w-2.5 h-2.5" />
                              已交付
                            </span>
                          )}
                          {pdf.status === 'pending' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              <Clock className="w-2.5 h-2.5" />
                              待下载
                            </span>
                          )}
                          {pdf.status === 'generating' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              生成中
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                        {pdf.hasWatermark ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-2.5 h-2.5" />
                            已添加水印
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            待加水印
                          </span>
                        )}
                        {pdf.generationTime > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                            <Zap className="w-2.5 h-2.5" />
                            生成耗时：{pdf.generationTime}秒
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        {pdf.watermarkInfo}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        <FileText className="w-3 h-3 text-emerald-500" />
                        <span className="truncate">{pdf.pageDetails}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {pdf.status === 'delivered' && pdf.deliveredAt 
                            ? `交付：${getRelativeTime(pdf.deliveredAt)}`
                            : `生成：${getRelativeTime(pdf.generatedAt)}`
                          }
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          已下载 {pdf.downloadCount}次
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/pdf-delivery/${pdf.id}?from=home`)}
                        className="w-full text-xs py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
                      >
                        {pdf.status === 'generating' ? '生成中...' : pdf.status === 'delivered' ? '预览交付包' : '下载交付包'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 flex-shrink-0">
                <button
                  onClick={() => navigate('/pdf-delivery?from=home&action=create')}
                  className="w-full inline-flex items-center justify-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  生成我的交付包
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floorplan Match CTA Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-slate-800 p-8 sm:p-12 lg:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent" />
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                  <TrendingUp className="w-4 h-4 text-teal-300" />
                  <span className="text-sm text-teal-100">AI 智能户型匹配</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-heading leading-tight">
                  上传户型图，一键匹配
                  <br />
                  <span className="text-teal-200">相似真实装修案例</span>
                </h2>
                <p className="text-teal-100/80 text-lg mb-8 max-w-lg">
                  AI 智能识别户型结构，从真实案例库中为你匹配最相似的装修方案，预算、风格、建材一目了然
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/floorplan-match')}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white font-medium rounded-xl hover:bg-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
                  >
                    <Upload className="w-5 h-5" />
                    上传户型图
                  </button>
                  <button
                    onClick={() => navigate('/floorplan-match')}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-lg"
                  >
                    了解更多
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-2xl blur-2xl" />
                  <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-white font-semibold">户型识别</div>
                        <div className="text-teal-100/70 text-sm">AI 自动识别户型结构</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center mb-3">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-white font-semibold">智能匹配</div>
                        <div className="text-teal-100/70 text-sm">相似度算法精准推荐</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center mb-3">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-white font-semibold">质量评分</div>
                        <div className="text-teal-100/70 text-sm">真实验收质量数据</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-white font-semibold">本地案例</div>
                        <div className="text-teal-100/70 text-sm">同城同小区真实案例</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Credibility Modal */}
      {showCredibilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCredibilityModal(false)}>
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">数据可信度说明</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">平台核心指标数据来源与核验标准</p>
                </div>
              </div>
              <button
                onClick={() => setShowCredibilityModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex border-b border-gray-100 dark:border-slate-700">
              {stats.map((stat, idx) => (
                <button
                  key={stat.label}
                  onClick={() => setActiveTab(idx)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === idx
                      ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <stat.icon className="w-4 h-4" />
                    <span className="truncate">{stat.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {stats[activeTab] && (
                (() => {
                  const currentStat = stats[activeTab];
                  const StatIcon = currentStat.icon;
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${currentStat.color} flex items-center justify-center shadow-lg`}>
                          <StatIcon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(currentStat.value, currentStat.isDecimal)}{currentStat.suffix}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{currentStat.label}</div>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="w-4 h-4 text-teal-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">数据来源渠道</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{currentStat.dataSource}</p>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <RefreshCw className="w-4 h-4 text-orange-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">抽样与核验方法</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{currentStat.samplingMethod}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-violet-500" />
                              <span className="font-semibold text-gray-900 dark:text-white">更新频率</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{currentStat.updateFrequency}</p>
                          </div>

                          <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="font-semibold text-gray-900 dark:text-white">最近复核时间</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{currentStat.lastReviewDate}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                        <button
                          onClick={() => {
                            handleTraceClick(currentStat);
                            setShowCredibilityModal(false);
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>查看详细方法论</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sync Log Modal */}
      {showSyncLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSyncLogModal(false)}>
          <div className="relative w-full max-w-lg max-h-[80vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">最近24小时同步记录</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">数据同步日志 · 今日新增：1,284例</p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncLogModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {syncLogData.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{log.source}</span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium flex-shrink-0">+{log.count}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{log.time}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex-shrink-0">{log.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">24小时同步总次数</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{syncLogData.length} 次</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500 dark:text-gray-400">24小时新增案例</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">1,284 例</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500 dark:text-gray-400">同步成功率</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
