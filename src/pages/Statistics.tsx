import { useState, useEffect } from 'react';
import {
  Car,
  CarFront,
  CheckCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  AlertTriangle,
  BarChart3,
  PieChart,
  Target,
  UserCheck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/utils';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: { value: number; isUp: boolean };
}

interface FunnelStage {
  stage: string;
  count: number;
  rate: number;
  width: string;
  color: string;
}

interface BarData {
  label: string;
  value: number;
  color: string;
}

interface PieData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface SalesRank {
  rank: number;
  name: string;
  salesCount: number;
  totalAmount: number;
  conversionRate: number;
  avatarColor: string;
}

const statConfig: Omit<StatCard, 'value' | 'trend'>[] = [
  { title: '总车源数', icon: Car, color: 'text-primary-700', bgColor: 'bg-primary-100' },
  { title: '在售车源', icon: CarFront, color: 'text-success-600', bgColor: 'bg-success-100' },
  { title: '已售车源', icon: CheckCircle, color: 'text-secondary-600', bgColor: 'bg-secondary-100' },
  { title: '预约总数', icon: Calendar, color: 'text-primary-600', bgColor: 'bg-primary-50' },
  { title: '订金支付', icon: DollarSign, color: 'text-success-700', bgColor: 'bg-success-50' },
  { title: '成交金额', icon: TrendingUp, color: 'text-secondary-700', bgColor: 'bg-secondary-50' },
  { title: '注册用户', icon: Users, color: 'text-primary-700', bgColor: 'bg-primary-100' },
  { title: '整体转化率', icon: Award, color: 'text-warning-600', bgColor: 'bg-warning-100' },
];

const mockStatsData: (string | number)[] = [
  1256, 892, 234, 456, 189, '¥5,678,900', 3456, '26.3%'
];

const mockFunnelData: FunnelStage[] = [
  { stage: '浏览车源', count: 12560, rate: 100, width: '100%', color: 'bg-primary-200' },
  { stage: '创建预约', count: 4520, rate: 36, width: '85%', color: 'bg-primary-300' },
  { stage: '看车试驾', count: 2890, rate: 64, width: '70%', color: 'bg-primary-400' },
  { stage: '支付订金', count: 1560, rate: 54, width: '55%', color: 'bg-primary-500' },
  { stage: '签订合同', count: 1120, rate: 72, width: '40%', color: 'bg-primary-600' },
  { stage: '完成过户', count: 890, rate: 79, width: '25%', color: 'bg-primary-700' },
];

const mockInspectionAnomalies: BarData[] = [
  { label: '事故车', value: 45, color: 'bg-danger-500' },
  { label: '水泡车', value: 23, color: 'bg-danger-400' },
  { label: '火烧车', value: 12, color: 'bg-danger-300' },
  { label: '调表车', value: 67, color: 'bg-warning-500' },
  { label: '产权纠纷', value: 18, color: 'bg-warning-400' },
  { label: '抵押未清', value: 34, color: 'bg-warning-300' },
  { label: '手续不全', value: 28, color: 'bg-secondary-400' },
];

const mockCancellationReasons: PieData[] = [
  { label: '价格偏高', value: 89, color: 'bg-danger-400', percentage: 28 },
  { label: '车况不满意', value: 67, color: 'bg-warning-400', percentage: 21 },
  { label: '找到更优车源', value: 56, color: 'bg-primary-400', percentage: 18 },
  { label: '资金问题', value: 45, color: 'bg-secondary-400', percentage: 14 },
  { label: '家人反对', value: 34, color: 'bg-success-400', percentage: 11 },
  { label: '其他原因', value: 27, color: 'bg-neutral-400', percentage: 8 },
];

const mockSalesRanking: SalesRank[] = [
  { rank: 1, name: '王销售', salesCount: 45, totalAmount: 1256000, conversionRate: 38.5, avatarColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600' },
  { rank: 2, name: '李销售', salesCount: 38, totalAmount: 987600, conversionRate: 34.2, avatarColor: 'bg-gradient-to-br from-gray-300 to-gray-500' },
  { rank: 3, name: '张销售', salesCount: 32, totalAmount: 876500, conversionRate: 31.8, avatarColor: 'bg-gradient-to-br from-amber-600 to-amber-800' },
  { rank: 4, name: '刘销售', salesCount: 28, totalAmount: 765400, conversionRate: 29.5, avatarColor: 'bg-gradient-to-br from-primary-400 to-primary-600' },
  { rank: 5, name: '陈销售', salesCount: 24, totalAmount: 654300, conversionRate: 26.8, avatarColor: 'bg-gradient-to-br from-primary-400 to-primary-600' },
  { rank: 6, name: '赵销售', salesCount: 21, totalAmount: 543200, conversionRate: 24.3, avatarColor: 'bg-gradient-to-br from-primary-400 to-primary-600' },
];

export default function Statistics() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [funnelExpanded, setFunnelExpanded] = useState(true);
  const [barExpanded, setBarExpanded] = useState(true);
  const [pieExpanded, setPieExpanded] = useState(true);
  const [rankExpanded, setRankExpanded] = useState(true);

  useEffect(() => {
    const cards: StatCard[] = statConfig.map((item, index) => ({
      ...item,
      value: mockStatsData[index],
      trend: { value: Math.floor(Math.random() * 20) + 1, isUp: Math.random() > 0.3 },
    }));
    setStats(cards);
    setTimeout(() => setLoading(false), 500);
  }, []);

  const getTrendColor = (isUp: boolean) => isUp ? 'text-success-600' : 'text-danger-600';

  const maxBarValue = Math.max(...mockInspectionAnomalies.map(d => d.value));

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="w-6 h-6 bg-yellow-400 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>;
    if (rank === 2) return <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>;
    if (rank === 3) return <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>;
    return <span className="w-6 h-6 bg-neutral-200 text-neutral-600 rounded-full flex items-center justify-center text-xs font-bold">{rank}</span>;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-noto-serif-sc text-2xl font-bold text-neutral-800 mb-1">
            运营统计
          </h1>
          <p className="text-sm text-neutral-500">平台运营数据概览与分析</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full" />
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h3 className="font-noto-serif-sc text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-700" />
                核心指标
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="card p-5 group hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 mb-1">{stat.title}</p>
                          <p className="font-noto-serif-sc text-2xl font-bold text-neutral-800 group-hover:text-primary-700 transition-colors">
                            {stat.value}
                          </p>
                          {stat.trend && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor(stat.trend.isUp)}`}>
                              <TrendingUp className={`w-4 h-4 ${!stat.trend.isUp ? 'rotate-180' : ''}`} />
                              <span>{stat.trend.value}% 较上月</span>
                            </div>
                          )}
                        </div>
                        <div className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <section className="card">
                <button
                  onClick={() => setFunnelExpanded(!funnelExpanded)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <h3 className="font-noto-serif-sc text-lg font-semibold text-neutral-800 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary-700" />
                    转化漏斗
                  </h3>
                  {funnelExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                </button>
                {funnelExpanded && (
                  <div className="px-5 pb-5">
                    <div className="space-y-3">
                      {mockFunnelData.map((stage, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-neutral-700">{stage.stage}</span>
                            <span className="text-sm text-neutral-500">
                              {stage.count.toLocaleString()} 人
                              {index > 0 && (
                                <span className="ml-2 text-primary-600 font-medium">
                                  转化率 {stage.rate}%
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-8 bg-neutral-100 rounded-lg overflow-hidden">
                            <div
                              className={`h-full ${stage.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-3`}
                              style={{ width: stage.width }}
                            >
                              {index < mockFunnelData.length - 1 && (
                                <ArrowRight className="w-4 h-4 text-white/70" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                      <p className="text-sm text-primary-700">
                        <UserCheck className="w-4 h-4 inline mr-1" />
                        从浏览到成交的整体转化率为 <span className="font-bold">7.1%</span>，较上月提升 <span className="font-bold">2.3%</span>
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section className="card">
                <button
                  onClick={() => setBarExpanded(!barExpanded)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <h3 className="font-noto-serif-sc text-lg font-semibold text-neutral-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-danger-600" />
                    检测异常统计
                  </h3>
                  {barExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                </button>
                {barExpanded && (
                  <div className="px-5 pb-5">
                    <div className="flex items-end justify-between gap-2 h-48 mb-4">
                      {mockInspectionAnomalies.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className={`w-full ${item.color} rounded-t-lg transition-all duration-500 relative group`}
                            style={{ height: `${(item.value / maxBarValue) * 100}%`, minHeight: '20px' }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.value} 台
                            </div>
                          </div>
                          <span className="text-xs text-neutral-600 text-center w-full truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center p-2 bg-neutral-50 rounded-lg">
                        <p className="text-lg font-bold text-danger-600">227</p>
                        <p className="text-xs text-neutral-500">异常总数</p>
                      </div>
                      <div className="text-center p-2 bg-neutral-50 rounded-lg">
                        <p className="text-lg font-bold text-warning-600">24</p>
                        <p className="text-xs text-neutral-500">占比 %</p>
                      </div>
                      <div className="text-center p-2 bg-neutral-50 rounded-lg">
                        <p className="text-lg font-bold text-success-600">94%</p>
                        <p className="text-xs text-neutral-500">处理率</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <section className="card">
                <button
                  onClick={() => setPieExpanded(!pieExpanded)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <h3 className="font-noto-serif-sc text-lg font-semibold text-neutral-800 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-secondary-600" />
                    退订原因分布
                  </h3>
                  {pieExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                </button>
                {pieExpanded && (
                  <div className="px-5 pb-5">
                    <div className="flex items-center gap-6">
                      <div className="relative w-36 h-36 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                          {mockCancellationReasons.reduce((acc, item, index) => {
                            const prevOffset = acc.offset;
                            acc.offset += item.percentage;
                            acc.elements.push(
                              <circle
                                key={index}
                                cx="18"
                                cy="18"
                                r="15.9155"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
                                strokeDashoffset={-prevOffset}
                                className={`${item.color.replace('bg-', 'text-')}`}
                              />
                            );
                            return acc;
                          }, { offset: 0, elements: [] as React.ReactNode[] }).elements}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-neutral-800">318</p>
                            <p className="text-xs text-neutral-500">退订总数</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {mockCancellationReasons.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm text-neutral-700 flex-1">{item.label}</span>
                            <span className="text-sm font-medium text-neutral-800">{item.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="card">
                <button
                  onClick={() => setRankExpanded(!rankExpanded)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <h3 className="font-noto-serif-sc text-lg font-semibold text-neutral-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-warning-500" />
                    销售效率排行榜
                  </h3>
                  {rankExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                </button>
                {rankExpanded && (
                  <div className="px-5 pb-5">
                    <div className="space-y-3">
                      {mockSalesRanking.map((item) => (
                        <div
                          key={item.rank}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${item.rank <= 3 ? 'bg-gradient-to-r from-warning-50 to-transparent' : 'hover:bg-neutral-50'}`}
                        >
                          {getRankBadge(item.rank)}
                          <div className={`w-10 h-10 ${item.avatarColor} rounded-full flex items-center justify-center text-white font-medium flex-shrink-0`}>
                            {item.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-800">{item.name}</p>
                            <p className="text-xs text-neutral-500">
                              成交 {item.salesCount} 台 · 转化率 {item.conversionRate}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary-700">{formatPrice(item.totalAmount)}</p>
                            <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${(item.salesCount / mockSalesRanking[0].salesCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
