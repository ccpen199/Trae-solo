import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Upload,
  TrendingUp,
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
  Briefcase,
} from 'lucide-react';
import CaseCard from '@/components/CaseCard';
import { mockCases, mockDesigners, mockMaterials, mockQualityScores } from '@/mock/data';

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

const baseCityCounts: Record<string, number> = {};
mockCases.forEach(c => { baseCityCounts[c.city] = (baseCityCounts[c.city] || 0) + 1; });

const cityCountMap: Record<string, number> = {};
Object.entries(baseCityCounts).forEach(([city, base]) => {
  const scaled = base * 1000 + Math.floor(Math.random() * 500) + 100;
  cityCountMap[city] = scaled;
});

const hotCities = Object.entries(cityCountMap).map(([name, count]) => ({
  name,
  count,
  color: cityColorMap[name] || 'from-gray-400 to-gray-500',
}));

const stats = [
  { label: '累计收录案例', value: 143800, suffix: '+', sublabel: '千万级案例库持续同步', icon: FileText, color: 'from-teal-500 to-cyan-600' },
  { label: '覆盖城市', value: 320, suffix: '+', sublabel: '全国主要城市已开通', icon: MapPin, color: 'from-orange-500 to-amber-600' },
  { label: '认证设计师', value: 3200, suffix: '+', sublabel: '严格资质审核入驻', icon: Users, color: 'from-violet-500 to-indigo-600' },
  { label: '核验通过率', value: 98.6, suffix: '%', sublabel: '多维度质量评分模型', icon: Award, color: 'from-rose-500 to-pink-600', isDecimal: true },
];

function useCountUp(target: number) {
  return { count: target };
}

function formatNumber(num: number, isDecimal: boolean = false) {
  if (isDecimal) {
    return num.toFixed(1);
  }
  if (num >= 10000) {
    const wan = num / 10000;
    return wan.toFixed(1) + '万';
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

function StatCard({ stat, delay }: { stat: typeof stats[0]; delay: number }) {
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
      <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
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
  };
});

const designerListWithStatus = [
  ...mockDesigners,
  {
    id: 'designer-pending-1',
    userId: 'user-pending-1',
    name: '赵磊',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaolei',
    status: 'pending' as const,
    applyTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    title: '新锐设计师',
    company: '尚品宅配',
    certificationNo: 'CERT2024099',
    yearsOfExperience: 4,
    qualityScore: 0,
    totalCases: 0,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    styleTags: ['现代简约'],
    specialties: ['现代简约'],
    experience: 4,
    rating: 0,
    completedCases: 0,
    bio: '',
    portfolio: [],
  },
  {
    id: 'designer-pending-2',
    userId: 'user-pending-2',
    name: '孙雪',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunxue',
    status: 'pending' as const,
    applyTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    title: '设计师',
    company: '艺邦装饰',
    certificationNo: 'CERT2024100',
    yearsOfExperience: 2,
    qualityScore: 0,
    totalCases: 0,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    styleTags: ['ins风'],
    specialties: ['ins风'],
    experience: 2,
    rating: 0,
    completedCases: 0,
    bio: '',
    portfolio: [],
  },
  {
    id: 'designer-rejected-1',
    userId: 'user-rejected-1',
    name: '周杰',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoujie',
    status: 'rejected' as const,
    applyTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    title: '设计师',
    company: '个人工作室',
    certificationNo: 'CERT2024088',
    yearsOfExperience: 1,
    qualityScore: 0,
    totalCases: 0,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    styleTags: ['现代简约'],
    specialties: ['现代简约'],
    experience: 1,
    rating: 0,
    completedCases: 0,
    bio: '',
    portfolio: [],
  },
];

const pendingDesignerCount = designerListWithStatus.filter((d) => d.status === 'pending').length;
const approvedDesignerCountStatus = designerListWithStatus.filter((d) => d.status === 'approved').length;
const rejectedDesignerCount = designerListWithStatus.filter((d) => d.status === 'rejected').length;

interface DesignerWithExtra {
  id: string;
  name: string;
  avatar: string;
  status: string;
  applyTime?: string;
  createdAt?: Date;
  qualityScore: number;
  completedCases: number;
  portfolioCount: number;
  certificationVerified: boolean;
}

const recentDesigners: DesignerWithExtra[] = [
  {
    id: 'designer-pending-1',
    name: '赵磊',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaolei',
    status: 'pending',
    applyTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    qualityScore: 0,
    completedCases: 0,
    portfolioCount: 8,
    certificationVerified: true,
  },
  {
    id: 'designer-approved-1',
    name: '林思远',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linsiyuan',
    status: 'approved',
    applyTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    qualityScore: 4.8,
    completedCases: 32,
    portfolioCount: 15,
    certificationVerified: true,
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
  };
});

interface PdfDeliveryItem {
  id: string;
  caseName: string;
  generatedAt: string;
  pages: number;
  status: 'downloaded' | 'pending';
  hasWatermark: boolean;
  watermarkInfo: string;
  pageDetails: string;
  downloadCount: number;
}

const pdfDeliveryList: PdfDeliveryItem[] = [
  {
    id: 'pdf-001',
    caseName: mockCases[0]?.title?.slice(0, 12) + '...' || '案例方案',
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    pages: 32,
    status: 'downloaded',
    hasWatermark: true,
    watermarkInfo: '水印含业主姓名、案例ID、交付日期',
    pageDetails: '封面1 · 户型图2 · 水电图3 · 验收照片12 · 建材清单6 · 施工数据8',
    downloadCount: 3,
  },
  {
    id: 'pdf-002',
    caseName: mockCases[1]?.title?.slice(0, 12) + '...' || '案例方案',
    generatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    pages: 38,
    status: 'pending',
    hasWatermark: true,
    watermarkInfo: '水印含业主姓名、案例ID、交付日期',
    pageDetails: '封面1 · 户型图3 · 水电图4 · 验收照片14 · 建材清单7 · 施工数据9',
    downloadCount: 0,
  },
  {
    id: 'pdf-003',
    caseName: mockCases[2]?.title?.slice(0, 12) + '...' || '案例方案',
    generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    pages: 28,
    status: 'downloaded',
    hasWatermark: true,
    watermarkInfo: '水印含业主姓名、案例ID、交付日期',
    pageDetails: '封面1 · 户型图2 · 水电图2 · 验收照片10 · 建材清单5 · 施工数据8',
    downloadCount: 2,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');

  const featuredCases = mockCases.slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/cases?keyword=${encodeURIComponent(searchKeyword)}`);
  };

  const handleCityClick = (city: string) => {
    navigate(`/cases?city=${encodeURIComponent(city)}`);
  };

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
            聚合14万+真实施工案例、320+城市建材供应数据、3200+认证设计师资源，以户型匹配、建材比价、验收核验三维驱动装修决策
          </p>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl p-2 gap-2">
              <div className="flex items-center flex-1 gap-3 px-4">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索14万+真实案例、320+城市、3200+设计师..."
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
              <span className="text-sm">验收照片实地拍摄 · 百万张核验入库</span>
            </div>
            <div className="w-px h-4 bg-teal-100/20" />
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">建材数据真实比价 · 京东/天猫/本地三渠道</span>
            </div>
            <div className="w-px h-4 bg-teal-100/20" />
            <div className="flex items-center gap-2">
              <HomeIcon className="w-4 h-4" />
              <span className="text-sm">户型匹配AI智能 · 千万级样本训练</span>
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
              <StatCard key={stat.label} stat={stat} delay={idx * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* Hot Cities Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">热门城市</h2>
              <p className="text-gray-500 dark:text-gray-400">选择你所在的城市，查看本地真实装修案例</p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="hidden sm:inline-flex items-center gap-1 text-primary hover:text-primary-600 font-medium transition-colors"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {hotCities.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCityClick(city.name)}
                className="group relative p-5 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${city.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">{city.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-primary">{formatCityCount(city.count)}+</span> 案例
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cases Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">精选案例</h2>
              <p className="text-gray-500 dark:text-gray-400">高评分真实装修案例，给你灵感与参考</p>
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
                <CaseCard caseData={caseItem} />
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
              <div className="p-5 pb-3 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">采购比价结果</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">建材多渠道价格对比</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {priceCompareList.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</span>
                        {item.status === 'verified' && (
                          <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex-shrink-0">
                            <ShieldCheck className="w-3 h-3" />
                            已验证
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            待验证
                          </span>
                        )}
                        {item.status === 'expired' && (
                          <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex-shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            已过期
                          </span>
                        )}
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
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold mb-1.5">
                        <CheckCircle className="w-3 h-3" />
                        <span>{item.bestChannel}最优 · 省¥{item.saveAmount}</span>
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
                          onClick={() => navigate('/purchase-list?from=home')}
                          className="flex-1 text-xs py-1.5 px-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium transition-colors"
                        >
                          加入采购清单
                        </button>
                        <button
                          onClick={() => navigate('/purchase-list?from=home')}
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
              <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  onClick={() => navigate('/purchase-list')}
                  className="w-full inline-flex items-center justify-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
                >
                  比价采购清单
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel 2: Designer Review Status - Violet */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className="p-5 pb-3 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">设计师审核状态</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">入驻申请实时审核</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{pendingDesignerCount}</div>
                    <div className="text-xs text-amber-600/80 dark:text-amber-400/80">待审核</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">{approvedDesignerCountStatus}</div>
                    <div className="text-xs text-green-600/80 dark:text-green-400/80">已通过</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">{rejectedDesignerCount}</div>
                    <div className="text-xs text-red-600/80 dark:text-red-400/80">已拒绝</div>
                  </div>
                </div>
                <div className="p-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-400">
                      <Zap className="w-3 h-3" />
                      <span>今日审核动态</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-600 dark:text-gray-400">
                    <span>今日审核：12位</span>
                    <span className="text-green-600 dark:text-green-400">通过：10位</span>
                    <span className="text-red-600 dark:text-red-400">拒绝：2位</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>平均审核时长：2.3小时</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {recentDesigners.map((d) => (
                    <div key={d.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
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
                                资质证书已核验
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="inline-flex items-center gap-0.5">
                              <Briefcase className="w-2.5 h-2.5" />
                              作品集 {d.portfolioCount}套
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {d.status === 'pending' && (
                            <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              <Clock className="w-3 h-3" />
                              待审核
                            </span>
                          )}
                          {d.status === 'approved' && (
                            <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              已通过
                            </span>
                          )}
                          {d.status === 'rejected' && (
                            <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                              <AlertTriangle className="w-3 h-3" />
                              已拒绝
                            </span>
                          )}
                        </div>
                        {d.status === 'approved' && (
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                              <Star className="w-2.5 h-2.5 fill-amber-500" />
                              {d.qualityScore}
                            </span>
                            <span>完成案例 {d.completedCases}套</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700">
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
              <div className="p-5 pb-3 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">质量评分样本</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">多维度案例质量评估</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {qualityScoreList.map((qs) => (
                    <div key={qs.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
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
                      <div className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
                        <FileText className="w-3 h-3" />
                        <span>{qs.deliverableCount}类资料可导出</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full inline-flex items-center justify-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors"
                >
                  查看评分模型
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel 4: PDF Delivery Records - Emerald */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className="p-5 pb-3 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                    <FileDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">PDF交付记录</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">方案文档一键导出</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {pdfDeliveryList.map((pdf) => (
                    <div key={pdf.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{pdf.caseName}</span>
                        {pdf.status === 'downloaded' && (
                          <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex-shrink-0">
                            <ShieldCheck className="w-3 h-3" />
                            已下载
                          </span>
                        )}
                        {pdf.status === 'pending' && (
                          <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            待下载
                          </span>
                        )}
                      </div>
                      {pdf.hasWatermark && (
                        <div className="flex items-center gap-1 mb-1">
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            ✓ 带水印防伪
                          </span>
                        </div>
                      )}
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
                          {pdf.generatedAt}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileDown className="w-3 h-3" />
                          已下载 {pdf.downloadCount}次
                        </span>
                      </div>
                      <button
                        onClick={() => navigate('/pdf-delivery/case-001')}
                        className="w-full text-xs py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
                      >
                        {pdf.status === 'downloaded' ? '预览' : '下载'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  onClick={() => navigate('/purchase-list')}
                  className="w-full inline-flex items-center justify-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
                >
                  生成交付包
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
    </div>
  );
}
