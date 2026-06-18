import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Search,
  Filter,
  Hash,
  AlertCircle,
  Flame,
  Users,
  ShoppingCart,
  Eye,
  CreditCard,
  Download,
  ChevronDown,
} from 'lucide-react';

const communities = [
  { id: 'all', name: '全部社区', subdomain: 'all' },
  { id: 'chaoyang', name: '朝阳家园', subdomain: 'chaoyang' },
  { id: 'haidian', name: '海淀花园', subdomain: 'haidian' },
  { id: 'dongcheng', name: '东城景苑', subdomain: 'dongcheng' },
  { id: 'xicheng', name: '西城国际', subdomain: 'xicheng' },
  { id: 'wangjing', name: '望京新城', subdomain: 'wangjing' },
  { id: 'shijingshan', name: '石景山家园', subdomain: 'shijingshan' },
  { id: 'fengtai', name: '丰台花园', subdomain: 'fengtai' },
  { id: 'tongzhou', name: '通州新城', subdomain: 'tongzhou' },
  { id: 'changping', name: '昌平家园', subdomain: 'changping' },
];

const subdomainTabs = [
  { id: 'all', name: '全部' },
  { id: 'chaoyang', name: 'chaoyang' },
  { id: 'haidian', name: 'haidian' },
  { id: 'dongcheng', name: 'dongcheng' },
  { id: 'xicheng', name: 'xicheng' },
  { id: 'wangjing', name: 'wangjing' },
  { id: 'shijingshan', name: 'shijingshan' },
];

const postTrendData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 4, 20 + i);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const basePosts = 180 + Math.sin(i * 0.3) * 40 + i * 3;
  const baseUsers = 420 + Math.sin(i * 0.25) * 80 + i * 5;
  return {
    date: `${month}-${day}`,
    posts: Math.round(basePosts + (Math.random() - 0.5) * 30),
    participants: Math.round(baseUsers + (Math.random() - 0.5) * 50),
  };
});

const conversionTrendData = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(2026, 5, 5 + i);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const views = 8500 + Math.round(Math.sin(i * 0.4) * 1200 + i * 180 + Math.random() * 500);
  const addCart = Math.round(views * (0.18 + Math.random() * 0.04));
  const orders = Math.round(addCart * (0.42 + Math.random() * 0.06));
  const paid = Math.round(orders * (0.78 + Math.random() * 0.08));
  return {
    date: `${month}-${day}`,
    views,
    addCart,
    orders,
    paid,
    conversion: views > 0 ? Number(((paid / views) * 100).toFixed(2)) : 0,
  };
});

const complaintTrendData = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(2026, 5, 5 + i);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const baseResponse = 28 - i * 0.8 + (Math.random() - 0.5) * 6;
  const baseResolve = 72 + i * 1.2 + (Math.random() - 0.5) * 5;
  return {
    date: `${month}-${day}`,
    avgMinutes: Math.max(5, Math.round(baseResponse)),
    resolve24h: Math.min(98, Math.round(baseResolve)),
  };
});

const communityDetailData = [
  { name: '朝阳家园', subdomain: 'chaoyang', posts: 1284, activeUsers: 2486, gmv: 186420, conversion: 5.82, responseMin: 8, health: 92.4 },
  { name: '海淀花园', subdomain: 'haidian', posts: 1156, activeUsers: 2120, gmv: 158780, conversion: 5.34, responseMin: 11, health: 90.1 },
  { name: '东城景苑', subdomain: 'dongcheng', posts: 982, activeUsers: 1860, gmv: 132340, conversion: 4.92, responseMin: 14, health: 88.7 },
  { name: '西城国际', subdomain: 'xicheng', posts: 870, activeUsers: 1640, gmv: 116520, conversion: 4.68, responseMin: 16, health: 85.3 },
  { name: '望京新城', subdomain: 'wangjing', posts: 812, activeUsers: 1520, gmv: 98760, conversion: 4.41, responseMin: 19, health: 83.6 },
  { name: '石景山家园', subdomain: 'shijingshan', posts: 698, activeUsers: 1340, gmv: 82430, conversion: 4.12, responseMin: 22, health: 80.2 },
  { name: '丰台花园', subdomain: 'fengtai', posts: 612, activeUsers: 1180, gmv: 72180, conversion: 3.87, responseMin: 26, health: 77.8 },
  { name: '通州新城', subdomain: 'tongzhou', posts: 548, activeUsers: 1020, gmv: 63560, conversion: 3.62, responseMin: 31, health: 74.5 },
  { name: '昌平家园', subdomain: 'changping', posts: 462, activeUsers: 880, gmv: 52340, conversion: 3.34, responseMin: 38, health: 70.2 },
  { name: '大兴御园', subdomain: 'daxing', posts: 398, activeUsers: 720, gmv: 42180, conversion: 3.01, responseMin: 45, health: 66.8 },
];

const hotTopics = [
  { rank: 1, title: '#小区电动车充电桩扩容方案讨论', heat: 28471, posts: 342, trend: 'up', delta: 158 },
  { rank: 2, title: '#物业保洁服务提升满意度调查', heat: 21568, posts: 268, trend: 'up', delta: 92 },
  { rank: 3, title: '#半径优选618生鲜团购活动', heat: 18934, posts: 186, trend: 'up', delta: 234 },
  { rank: 4, title: '#社区垃圾分类新规宣传周', heat: 15247, posts: 152, trend: 'down', delta: 28 },
  { rank: 5, title: '#邻居二手闲置物品交易会', heat: 12863, posts: 198, trend: 'up', delta: 76 },
  { rank: 6, title: '#地下车库漏水问题跟进', heat: 10234, posts: 124, trend: 'down', delta: 45 },
  { rank: 7, title: '#儿童游乐场安全改造投票', heat: 8972, posts: 98, trend: 'up', delta: 52 },
  { rank: 8, title: '#物业费用途公开透明化建议', heat: 7654, posts: 112, trend: 'up', delta: 31 },
  { rank: 9, title: '#小区快递柜新增点位征集', heat: 6238, posts: 76, trend: 'down', delta: 18 },
  { rank: 10, title: '#社区健身器材更新计划', heat: 5421, posts: 62, trend: 'up', delta: 24 },
];

const complaintTypes = [
  { name: '噪音扰民', value: 128, color: '#ef4444' },
  { name: '环境卫生', value: 96, color: '#f97316' },
  { name: '物业服务', value: 84, color: '#eab308' },
  { name: '设施维修', value: 72, color: '#22c55e' },
  { name: '停车管理', value: 64, color: '#06b6d4' },
  { name: '邻里纠纷', value: 48, color: '#8b5cf6' },
  { name: '安全隐患', value: 36, color: '#ec4899' },
  { name: '其他', value: 22, color: '#6b7280' },
];

interface MetricCard {
  icon: typeof MessageSquare;
  title: string;
  value: string;
  suffix?: string;
  delta: string;
  trend: 'up' | 'down';
  trendGood: boolean;
  color: string;
  ring: string;
  desc: string;
}

const metricCards: MetricCard[] = [
  {
    icon: MessageSquare,
    title: '发帖活跃度',
    value: '4,286',
    suffix: '帖/周',
    delta: '+12.4%',
    trend: 'up',
    trendGood: true,
    color: 'from-blue-500 to-cyan-500',
    ring: 'ring-blue-100',
    desc: '较上周环比，含话题帖+评论',
  },
  {
    icon: TrendingUp,
    title: '交易转化率',
    value: '4.82',
    suffix: '%',
    delta: '+0.63%',
    trend: 'up',
    trendGood: true,
    color: 'from-emerald-500 to-teal-500',
    ring: 'ring-emerald-100',
    desc: '支付成功 / 商品浏览 UV',
  },
  {
    icon: Clock,
    title: '投诉平均响应时长',
    value: '18',
    suffix: '分钟',
    delta: '-6分',
    trend: 'down',
    trendGood: true,
    color: 'from-amber-500 to-orange-500',
    ring: 'ring-amber-100',
    desc: 'SLA 目标 ≤30 分钟',
  },
  {
    icon: CheckCircle2,
    title: '24h 投诉解决率',
    value: '89.4',
    suffix: '%',
    delta: '+5.2%',
    trend: 'up',
    trendGood: true,
    color: 'from-green-500 to-emerald-500',
    ring: 'ring-green-100',
    desc: '目标线 85% · 当前达标',
  },
  {
    icon: Package,
    title: '半径优选完单率',
    value: '96.8',
    suffix: '%',
    delta: '+1.4%',
    trend: 'up',
    trendGood: true,
    color: 'from-indigo-500 to-purple-500',
    ring: 'ring-indigo-100',
    desc: '支付订单 / 最终完成配送',
  },
  {
    icon: Gift,
    title: '小金库红包核销率',
    value: '78.3',
    suffix: '%',
    delta: '-2.1%',
    trend: 'down',
    trendGood: false,
    color: 'from-rose-500 to-pink-500',
    ring: 'ring-rose-100',
    desc: '已使用 / 发放红包总额',
  },
];

function MetricCardComponent({ card }: { card: MetricCard }) {
  const TrendIcon = card.trend === 'up' ? ArrowUpRight : ArrowDownRight;
  const trendColor = card.trendGood
    ? card.trend === 'up'
      ? 'text-emerald-600 bg-emerald-50'
      : 'text-emerald-600 bg-emerald-50'
    : card.trend === 'down'
    ? 'text-red-500 bg-red-50'
    : 'text-red-500 bg-red-50';

  return (
    <div className="card relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${card.color} opacity-5 -mr-14 -mt-14 group-hover:opacity-10 transition-opacity`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.color} text-white shadow-lg shadow-black/5 ring-4 ${card.ring}`}>
            <card.icon className="w-6 h-6" />
          </div>
          <div className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-0.5 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {card.delta}
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight tabular-nums">{card.value}</span>
          {card.suffix && <span className="text-sm text-gray-500 font-medium">{card.suffix}</span>}
        </div>
        <p className="text-sm font-semibold text-gray-700 mt-1">{card.title}</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{card.desc}</p>
      </div>
    </div>
  );
}

function HealthScoreDisplay({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 90) return { text: 'text-emerald-600', bg: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-100' };
    if (s >= 80) return { text: 'text-blue-600', bg: 'from-blue-400 to-indigo-500', ring: 'ring-blue-100' };
    if (s >= 70) return { text: 'text-amber-600', bg: 'from-amber-400 to-orange-500', ring: 'ring-amber-100' };
    return { text: 'text-red-600', bg: 'from-red-400 to-rose-500', ring: 'ring-red-100' };
  };
  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 56;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="56" stroke="#f3f4f6" strokeWidth="10" fill="none" />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="url(#scoreGradient)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={score >= 90 ? 'stop-emerald-400' : score >= 80 ? 'stop-blue-400' : score >= 70 ? 'stop-amber-400' : 'stop-red-400'} style={{ stopColor: score >= 90 ? '#34d399' : score >= 80 ? '#60a5fa' : score >= 70 ? '#fbbf24' : '#f87171' }} />
              <stop offset="100%" className={score >= 90 ? 'stop-teal-500' : score >= 80 ? 'stop-indigo-500' : score >= 70 ? 'stop-orange-500' : 'stop-rose-500'} style={{ stopColor: score >= 90 ? '#14b8a6' : score >= 80 ? '#6366f1' : score >= 70 ? '#f97316' : '#f43f5e' }} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold tracking-tight tabular-nums ${colors.text}`}>{score}</span>
          <span className="text-xs text-gray-400 font-medium">/ 100 分</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors.bg} animate-pulse`} />
          <span className="text-xs font-medium text-gray-500">综合健康等级</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${colors.bg} text-white`}>
            {score >= 90 ? '优秀' : score >= 80 ? '良好' : score >= 70 ? '一般' : '需关注'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-blue-500" />
            <span className="text-gray-500">发帖活跃度</span>
            <span className="font-bold text-gray-700 ml-auto">A+</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-gray-500">交易转化</span>
            <span className="font-bold text-gray-700 ml-auto">A</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-500" />
            <span className="text-gray-500">投诉响应</span>
            <span className="font-bold text-gray-700 ml-auto">A</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gift className="w-3 h-3 text-rose-500" />
            <span className="text-gray-500">红包活跃</span>
            <span className="font-bold text-gray-700 ml-auto">B+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunityHealthPage() {
  const [selectedCommunity, setSelectedCommunity] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const overallScore = useMemo(() => {
    if (selectedCommunity === 'all') return 86.5;
    const found = communityDetailData.find((c) => c.subdomain === selectedCommunity);
    return found?.health ?? 86.5;
  }, [selectedCommunity]);

  const filteredCommunities = useMemo(() => {
    return communityDetailData.filter(
      (c) =>
        c.name.includes(searchQuery) ||
        c.subdomain.includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="space-y-5">
      <div className="card bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-bold">
                ADMIN · 运营中心
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">社区健康度仪表盘</h1>
            <p className="text-sm text-gray-500 mt-1">
              全方位监控各子域社区运营数据 · 发帖 · 交易 · 投诉 · 红包四维健康度评估 · 更新时间 2026-06-18 14:32
            </p>
          </div>
          <HealthScoreDisplay score={overallScore} />
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col lg:flex-row gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">社区选择器：</label>
            <div className="relative">
              <select
                value={selectedCommunity}
                onChange={(e) => {
                  setSelectedCommunity(e.target.value);
                  setActiveTab(e.target.value);
                }}
                className="input-field w-56 pr-8 appearance-none cursor-pointer bg-white"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.subdomain !== 'all' ? ` (${c.subdomain})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {subdomainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedCommunity(tab.id);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-mono font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-500 to-indigo-500 text-white shadow-sm shadow-primary-500/20'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="lg:ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索社区名/子域..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-52 pl-9 text-sm"
              />
            </div>
            <button className="btn-secondary flex items-center gap-1.5 text-sm">
              <Filter className="w-4 h-4" />
              筛选
            </button>
            <button className="btn-secondary flex items-center gap-1.5 text-sm">
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {metricCards.map((card) => (
          <MetricCardComponent key={card.title} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                发帖活跃度趋势（近 30 天）
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">双轴：每日发帖数 + 参与人数（含评论/点赞）</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" /> 发帖数
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-teal-500" /> 参与人数
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={postTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="postsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="posts"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#postsGradient)"
                name="发帖数"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="participants"
                stroke="#14b8a6"
                strokeWidth={2.5}
                fill="url(#usersGradient)"
                name="参与人数"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-500" />
                交易转化率趋势
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">漏斗：浏览UV → 加购 → 下单 → 支付成功</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversionTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 8]} />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="views" stroke="#94a3b8" strokeWidth={2} dot={false} name="浏览UV" />
              <Line yAxisId="left" type="monotone" dataKey="addCart" stroke="#60a5fa" strokeWidth={2} dot={false} name="加购" />
              <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} dot={false} name="下单" />
              <Line yAxisId="left" type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="支付成功" />
              <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} name="转化率%" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                投诉响应时长趋势
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">双Y轴：平均响应分钟数 + 24h解决率%</p>
            </div>
            <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              目标 85% 已达标
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={complaintTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 50]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine yAxisId="right" y={85} stroke="#10b981" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: '目标线 85%', position: 'right', fontSize: 10, fill: '#10b981', fontWeight: 'bold' }} />
              <Line yAxisId="left" type="monotone" dataKey="avgMinutes" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} name="平均响应(分钟)" />
              <Line yAxisId="right" type="monotone" dataKey="resolve24h" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} name="24h解决率%" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-500" />
              分社区明细对比
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">基于四维指标加权计算综合健康得分（发帖30%·交易30%·投诉25%·红包15%）</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> ≥90 优秀</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 80-89 良好</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 70-79 一般</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> {'<70'} 需关注</span>
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 -mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium rounded-tl-lg">#</th>
                <th className="text-left px-4 py-3 font-medium">社区 / 子域</th>
                <th className="text-right px-4 py-3 font-medium">发帖数</th>
                <th className="text-right px-4 py-3 font-medium">活跃用户</th>
                <th className="text-right px-4 py-3 font-medium">交易 GMV</th>
                <th className="text-right px-4 py-3 font-medium">转化率</th>
                <th className="text-right px-4 py-3 font-medium">投诉响应</th>
                <th className="text-left px-4 py-3 font-medium rounded-tr-lg">健康综合得分</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommunities.map((c, idx) => {
                const getHealthColor = (h: number) => {
                  if (h >= 90) return 'from-emerald-400 to-teal-500';
                  if (h >= 80) return 'from-blue-400 to-indigo-500';
                  if (h >= 70) return 'from-amber-400 to-orange-500';
                  return 'from-red-400 to-rose-500';
                };
                const getHealthText = (h: number) => {
                  if (h >= 90) return 'text-emerald-700';
                  if (h >= 80) return 'text-blue-700';
                  if (h >= 70) return 'text-amber-700';
                  return 'text-red-700';
                };
                return (
                  <tr key={c.subdomain} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition">
                    <td className="px-4 py-3.5">
                      <span className={`w-6 h-6 inline-flex items-center justify-center text-xs font-bold rounded-full ${
                        idx < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{c.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">{c.subdomain}.neighborhood.cn</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="text-gray-700 font-semibold tabular-nums">{c.posts.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-0.5 mt-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        +{(8 + idx * 0.5).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-gray-700 font-semibold tabular-nums">{c.activeUsers.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="text-gray-900 font-bold tabular-nums">¥{(c.gmv / 1000).toFixed(1)}K</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-bold tabular-nums ${c.conversion >= 4.5 ? 'text-emerald-600' : c.conversion >= 3.5 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {c.conversion}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock className={`w-3.5 h-3.5 ${c.responseMin <= 15 ? 'text-emerald-500' : c.responseMin <= 25 ? 'text-amber-500' : 'text-red-500'}`} />
                        <span className={`font-semibold tabular-nums ${c.responseMin <= 15 ? 'text-emerald-700' : c.responseMin <= 25 ? 'text-amber-700' : 'text-red-700'}`}>
                          {c.responseMin}分
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[140px]">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${getHealthColor(c.health)} transition-all duration-500`}
                              style={{ width: `${c.health}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-sm font-extrabold tabular-nums w-12 text-right ${getHealthText(c.health)}`}>
                          {c.health}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                TOP 10 热门话题
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">近7日热度加权计算 · 可复核运营热点</p>
            </div>
            <button className="text-xs text-primary-600 hover:underline font-medium flex items-center gap-0.5">
              话题管理 <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5 -mx-2">
            {hotTopics.map((topic) => (
              <div
                key={topic.rank}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-orange-50/40 transition group cursor-pointer"
              >
                <span className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                  topic.rank === 1
                    ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-sm'
                    : topic.rank === 2
                    ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-sm'
                    : topic.rank === 3
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {topic.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-primary-700 transition">{topic.title}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                      <MessageSquare className="w-3 h-3" /> {topic.posts} 帖
                    </span>
                    <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
                      topic.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {topic.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {topic.delta}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-extrabold text-gray-900 tabular-nums flex items-center gap-0.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    {(topic.heat / 1000).toFixed(1)}K
                  </div>
                  <div className="text-[10px] text-gray-400">热度</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                投诉类型分布
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">近30日投诉分类统计 · 合计 550 件</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={78}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {complaintTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [`${value} 件`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5">
              {complaintTypes.map((type) => {
                const total = complaintTypes.reduce((s, t) => s + t.value, 0);
                const percent = (type.value / total) * 100;
                return (
                  <div key={type.name} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: type.color }} />
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">{type.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 tabular-nums">{type.value}</span>
                        <span className="text-gray-400 tabular-nums w-10 text-right">{percent.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: type.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-2">
            {[
              { icon: Eye, label: '待受理', value: '23', color: 'text-amber-600 bg-amber-50' },
              { icon: Users, label: '处理中', value: '38', color: 'text-blue-600 bg-blue-50' },
              { icon: CreditCard, label: '待回访', value: '15', color: 'text-purple-600 bg-purple-50' },
              { icon: CheckCircle2, label: '已完结', value: '474', color: 'text-emerald-600 bg-emerald-50' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-3 ${s.color}`}>
                <s.icon className="w-4 h-4 mb-1" />
                <div className="text-xl font-extrabold tabular-nums">{s.value}</div>
                <div className="text-[10px] font-medium opacity-80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
