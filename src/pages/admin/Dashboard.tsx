import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import {
  Package,
  ClipboardCheck,
  Wallet,
  Scale,
  Clock,
  AlertTriangle,
  Shield,
  Truck,
  Shirt,
  BookOpen,
  Smartphone,
  ChevronRight,
  User,
  Banknote,
  UserCheck,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Star,
  BarChart3,
  Heart,
  Leaf,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CircleDot,
  Search,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Category, PayoutMethod, ProcessorStatus, QualityOrderStatus, PayoutStatus, OrderStatus } from '../../../shared/types';

const categoryIconMap: Record<Category, typeof Package> = {
  clothing: Shirt,
  books: BookOpen,
  phones: Smartphone,
};

const categoryLabelMap: Record<Category, string> = {
  clothing: '衣物',
  books: '图书',
  phones: '手机数码',
};

const processorStatusMap: Record<ProcessorStatus, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'bg-neutral-100 text-neutral-600' },
  reviewing: { label: '审核中', className: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', className: 'bg-eco-100 text-eco-700' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700' },
};

const qualityOrderStatusMap: Record<QualityOrderStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-amber-100 text-amber-700' },
  'ai-screening': { label: 'AI质检中', className: 'bg-cyan-100 text-cyan-700' },
  'manual-inspection': { label: '人工复检', className: 'bg-indigo-100 text-indigo-700' },
  completed: { label: '已完成', className: 'bg-eco-100 text-eco-700' },
};

const payoutStatusMap: Record<PayoutStatus, { label: string; className: string }> = {
  pending: { label: '待打款', className: 'bg-amber-100 text-amber-700' },
  processing: { label: '处理中', className: 'bg-cyan-100 text-cyan-700' },
  success: { label: '已到账', className: 'bg-eco-100 text-eco-700' },
  failed: { label: '打款失败', className: 'bg-red-100 text-red-700' },
};

const payoutMethodTagMap: Record<PayoutMethod, { label: string; className: string; icon: typeof Wallet }> = {
  wechat_wallet: { label: '微信', className: 'bg-green-100 text-green-700', icon: Wallet },
  bank_card: { label: '银行卡', className: 'bg-blue-100 text-blue-700', icon: Banknote },
};

const greenGradient = (opacity = 1) => ({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(16, 185, 129, ${opacity})` },
    { offset: 1, color: `rgba(16, 185, 129, 0.1)` },
  ],
});

const tealGradient = (opacity = 1) => ({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(20, 184, 166, ${opacity})` },
    { offset: 1, color: `rgba(20, 184, 166, 0.1)` },
  ],
});

const miniTrendOption = (data: number[], color: string) => ({
  grid: { left: 0, right: 0, top: 5, bottom: 0 },
  xAxis: {
    type: 'category',
    show: false,
    data: data.map((_, i) => i),
  },
  yAxis: {
    type: 'value',
    show: false,
    min: (value: { min: number }) => value.min * 0.8,
  },
  series: [
    {
      type: 'line',
      smooth: true,
      symbol: 'none',
      data,
      lineStyle: { width: 2, color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${color}33` },
            { offset: 1, color: `${color}05` },
          ],
        },
      },
    },
  ],
});

const commonAxisStyle = {
  axisLine: { lineStyle: { color: '#E5E7EB' } },
  axisLabel: { color: '#6B7280', fontSize: 12 },
  splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
};

interface FlowStep {
  key: string;
  label: string;
  icon: typeof Package;
  color: string;
  bgColor: string;
  route: string;
}

const flowSteps: FlowStep[] = [
  { key: 'pending', label: '待取件', icon: Package, color: 'text-amber-600', bgColor: 'bg-amber-500', route: '/admin/logistics' },
  { key: 'inspecting', label: '质检中', icon: Search, color: 'text-cyan-600', bgColor: 'bg-cyan-500', route: '/admin/quality' },
  { key: 'priced', label: '待定价', icon: Tag, color: 'text-indigo-600', bgColor: 'bg-indigo-500', route: '/admin/pricing' },
  { key: 'paid', label: '待打款', icon: Wallet, color: 'text-emerald-600', bgColor: 'bg-emerald-500', route: '/admin/payout' },
  { key: 'completed', label: '已完成', icon: CheckCircle, color: 'text-eco-600', bgColor: 'bg-eco-500', route: '/admin/orders' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { qualityOrders, payouts, processors, orders, analytics, couriers } = useStore();

  const todayOrders = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return orders.filter((o) => dayjs(o.createdAt).format('YYYY-MM-DD') === today).length;
  }, [orders]);

  const pendingQualityOrders = useMemo(
    () => qualityOrders.filter((q) => q.status === 'pending' || q.status === 'ai-screening'),
    [qualityOrders]
  );

  const pendingPayouts = useMemo(
    () => payouts.filter((p) => p.status === 'pending' || p.status === 'processing'),
    [payouts]
  );

  const totalRecycled = analytics?.overview.totalRecycledKg || 0;

  const kpiCards = useMemo(() => {
    const trend = analytics?.orderTrend || [];
    return [
      {
        label: '今日订单',
        value: todayOrders || 620,
        suffix: '单',
        icon: Package,
        gradient: 'from-eco-500 to-eco-600',
        trend: '+12.5%',
        trendData: trend.map((t) => t.count),
        trendColor: '#10B981',
      },
      {
        label: '待质检',
        value: analytics?.overview.pendingQualityOrders || pendingQualityOrders.length,
        suffix: '单',
        icon: ClipboardCheck,
        gradient: 'from-amber-500 to-orange-500',
        trend: '+5.2%',
        trendData: [18, 22, 20, 25, 23, 26, 28],
        trendColor: '#F59E0B',
      },
      {
        label: '待打款',
        value: analytics?.overview.pendingPayouts || pendingPayouts.length,
        suffix: '单',
        icon: Wallet,
        gradient: 'from-cyan-500 to-teal-500',
        trend: '-3.1%',
        trendData: [62, 58, 60, 55, 58, 56, 56],
        trendColor: '#06B6D4',
      },
      {
        label: '累计回收',
        value: totalRecycled,
        suffix: 'kg',
        icon: Scale,
        gradient: 'from-teal-500 to-emerald-600',
        trend: '+8.3%',
        trendData: trend.map((t) => t.kg),
        trendColor: '#14B8A6',
      },
    ];
  }, [todayOrders, pendingQualityOrders.length, pendingPayouts.length, totalRecycled, analytics]);

  const trendChartOption = useMemo(() => {
    const trend = analytics?.orderTrend || [];
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['订单数', '回收量(kg)'], top: 0, textStyle: { color: '#6B7280' } },
      grid: { left: 50, right: 50, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: trend.map((o) => o.date.slice(5)),
        boundaryGap: false,
        ...commonAxisStyle,
      },
      yAxis: [
        { type: 'value', name: '订单数', ...commonAxisStyle },
        { type: 'value', name: 'kg', ...commonAxisStyle },
      ],
      series: [
        {
          name: '订单数',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: trend.map((o) => o.count),
          lineStyle: { width: 3, color: '#10B981' },
          itemStyle: { color: '#10B981' },
          areaStyle: { color: greenGradient() },
        },
        {
          name: '回收量(kg)',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          yAxisIndex: 1,
          data: trend.map((o) => o.kg),
          lineStyle: { width: 3, color: '#14B8A6' },
          itemStyle: { color: '#14B8A6' },
          areaStyle: { color: tealGradient() },
        },
      ],
    };
  }, [analytics]);

  const categoryPieOption = useMemo(() => {
    const dist = analytics?.categoryDistribution || [];
    const colors = ['#10B981', '#14B8A6', '#06B6D4'];
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#6B7280' } },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          data: dist.map((d, i) => ({
            value: d.count,
            name: d.category,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    };
  }, [analytics]);

  const pendingProcessorReviews = useMemo(
    () => processors.filter((p) => p.status === 'pending' || p.status === 'reviewing'),
    [processors]
  );

  const flowStepCounts = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      inspecting: 0,
      priced: 0,
      paid: 0,
      completed: 0,
    };
    orders.forEach((o) => {
      const statusMap: Record<OrderStatus, string> = {
        pending: 'pending',
        assigned: 'pending',
        picked: 'inspecting',
        inspecting: 'inspecting',
        priced: 'priced',
        confirmed: 'paid',
        paid: 'paid',
        completed: 'completed',
        cancelled: 'completed',
      };
      const key = statusMap[o.status];
      if (key) counts[key]++;
    });
    return counts;
  }, [orders]);

  const payoutSummary = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayPayouts = payouts.filter((p) => dayjs(p.createdAt).format('YYYY-MM-DD') === today);
    const todayTotal = todayPayouts.reduce((sum, p) => sum + p.amount, 0);
    const wechatAmount = todayPayouts.filter((p) => p.method === 'wechat_wallet').reduce((sum, p) => sum + p.amount, 0);
    const bankAmount = todayPayouts.filter((p) => p.method === 'bank_card').reduce((sum, p) => sum + p.amount, 0);
    const wechatPercent = todayTotal > 0 ? ((wechatAmount / todayTotal) * 100).toFixed(1) : '0';
    const bankPercent = todayTotal > 0 ? ((bankAmount / todayTotal) * 100).toFixed(1) : '0';

    const topPending = [...pendingPayouts]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((p) => {
        const order = orders.find((o) => o.id === p.orderId);
        return {
          id: p.id,
          amount: p.amount,
          orderNo: order?.orderNo || p.orderId,
          method: p.method,
          userName: p.userName || p.accountInfo.accountName,
        };
      });

    return {
      todayTotal,
      wechatAmount,
      bankAmount,
      wechatPercent,
      bankPercent,
      topPending,
    };
  }, [payouts, pendingPayouts, orders]);

  const processorStats = useMemo(() => {
    const pending = processors.filter((p) => p.status === 'pending' || p.status === 'reviewing').length;
    const approved = processors.filter((p) => p.status === 'approved').length;
    const thisMonth = processors.filter((p) => {
      const created = p.reviewHistory[0]?.createdAt;
      if (!created) return false;
      return dayjs(created).format('YYYY-MM') === dayjs().format('YYYY-MM');
    }).length;

    const recentReviews = [...processors]
      .filter((p) => p.reviewHistory.length > 0)
      .sort((a, b) => {
        const aTime = a.reviewHistory[a.reviewHistory.length - 1]?.createdAt || '';
        const bTime = b.reviewHistory[b.reviewHistory.length - 1]?.createdAt || '';
        return dayjs(bTime).valueOf() - dayjs(aTime).valueOf();
      })
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        companyName: p.companyName,
        status: p.status,
        reviewTime: p.reviewHistory[p.reviewHistory.length - 1]?.createdAt || '-',
      }));

    return { pending, approved, thisMonth, recentReviews };
  }, [processors]);

  const courierStats = useMemo(() => {
    const online = couriers.filter((c) => c.status === 'online').length;
    const busy = couriers.filter((c) => c.status === 'busy').length;
    const offline = couriers.filter((c) => c.status === 'offline').length;
    const total = couriers.length || 1;

    const todayAssigned = orders.filter((o) =>
      (o.status === 'assigned' || o.status === 'picked') &&
      dayjs(o.createdAt).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    ).length;

    const todayPending = orders.filter((o) =>
      o.status === 'pending' &&
      dayjs(o.createdAt).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    ).length;

    const avgResponseTime = 28;

    const topRated = [...couriers]
      .sort((a, b) => b.rating - a.rating || b.orderCount - a.orderCount)
      .slice(0, 3)
      .map((c) => ({
        id: c.id,
        name: c.name,
        rating: c.rating,
        orderCount: c.orderCount,
        status: c.status,
      }));

    return {
      online,
      busy,
      offline,
      onlinePercent: ((online / total) * 100).toFixed(0),
      busyPercent: ((busy / total) * 100).toFixed(0),
      offlinePercent: ((offline / total) * 100).toFixed(0),
      todayAssigned,
      todayPending,
      avgResponseTime,
      topRated,
    };
  }, [couriers, orders]);

  const analyticsOverview = useMemo(() => {
    if (!analytics) {
      return {
        activeUsers: 0,
        totalDonation: 0,
        totalCarbonSavedKg: 0,
      };
    }
    return {
      activeUsers: analytics.user.monthlyActiveUsers,
      totalDonation: analytics.donation.totalDonation,
      totalCarbonSavedKg: analytics.overview.totalCarbonSavedKg,
    };
  }, [analytics]);

  const isOverdue = (createdAt: string, hoursThreshold = 24) => {
    return dayjs().diff(dayjs(createdAt), 'hour') > hoursThreshold;
  };

  const renderFlowSteps = () => (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-neutral-800">履约流程概览</h3>
        <button
          onClick={() => navigate('/admin/orders')}
          className="text-sm text-eco-600 hover:text-eco-700 flex items-center gap-1 font-medium"
        >
          全部订单
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {flowSteps.map((step, index) => {
          const StepIcon = step.icon;
          const count = flowStepCounts[step.key] || 0;
          return (
            <div
              key={step.key}
              onClick={() => navigate(step.route)}
              className="relative flex flex-col items-center p-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110',
                  step.bgColor + '/10'
                )}
              >
                <StepIcon className={cn('w-6 h-6', step.color)} />
              </div>
              <p className="text-sm font-medium text-neutral-700">{step.label}</p>
              <p className={cn('text-xl font-bold mt-1', step.color)}>{count}</p>
              {index < flowSteps.length - 1 && (
                <div className="absolute top-8 -right-1 w-2 h-0.5 bg-neutral-200" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPayoutSummary = () => (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-neutral-800">分账去向摘要</h3>
        </div>
        <button
          onClick={() => navigate('/admin/payout')}
          className="text-sm text-eco-600 hover:text-eco-700 flex items-center gap-1 font-medium"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">今日打款总额</p>
            <p className="text-2xl font-bold text-neutral-800 mt-1">
              ¥{payoutSummary.todayTotal.toFixed(2)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-green-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">微信零钱</span>
            </div>
            <p className="text-lg font-bold text-green-700">
              ¥{payoutSummary.wechatAmount.toFixed(2)}
            </p>
            <p className="text-xs text-green-600/70">{payoutSummary.wechatPercent}%</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">银行卡</span>
            </div>
            <p className="text-lg font-bold text-blue-700">
              ¥{payoutSummary.bankAmount.toFixed(2)}
            </p>
            <p className="text-xs text-blue-600/70">{payoutSummary.bankPercent}%</p>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100">
          <p className="text-sm font-medium text-neutral-700 mb-3">待打款 Top 3</p>
          <div className="space-y-2">
            {payoutSummary.topPending.length === 0 ? (
              <div className="text-center text-neutral-400 text-sm py-4">暂无待打款</div>
            ) : (
              payoutSummary.topPending.map((item, idx) => {
                const methodTag = payoutMethodTagMap[item.method];
                const MethodIcon = methodTag.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate('/admin/payout')}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{item.orderNo}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MethodIcon className="w-3 h-3 text-neutral-400" />
                          <span className="text-xs text-neutral-500 truncate">{item.userName}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-neutral-800 flex-shrink-0">
                      ¥{item.amount.toFixed(0)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProcessorReview = () => (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-neutral-800">处理商资质审核</h3>
        </div>
        <button
          onClick={() => navigate('/admin/processors')}
          className="text-sm text-eco-600 hover:text-eco-700 flex items-center gap-1 font-medium"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-xl bg-amber-50">
            <p className="text-2xl font-bold text-amber-600">{processorStats.pending}</p>
            <p className="text-xs text-amber-600/70 mt-1">待审核</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-eco-50">
            <p className="text-2xl font-bold text-eco-600">{processorStats.approved}</p>
            <p className="text-xs text-eco-600/70 mt-1">已通过</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-indigo-50">
            <p className="text-2xl font-bold text-indigo-600">{processorStats.thisMonth}</p>
            <p className="text-xs text-indigo-600/70 mt-1">本月新增</p>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100">
          <p className="text-sm font-medium text-neutral-700 mb-3">最近审核</p>
          <div className="space-y-2">
            {processorStats.recentReviews.length === 0 ? (
              <div className="text-center text-neutral-400 text-sm py-4">暂无审核记录</div>
            ) : (
              processorStats.recentReviews.map((item) => {
                const statusInfo = processorStatusMap[item.status];
                const StatusIcon = item.status === 'approved' ? CheckCircle : item.status === 'rejected' ? XCircle : Clock;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate('/admin/processors')}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', statusInfo.className)}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{item.companyName}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{item.reviewTime}</p>
                      </div>
                    </div>
                    <span className={cn('badge text-xs flex-shrink-0', statusInfo.className)}>
                      {statusInfo.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogisticsOverview = () => (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-eco-600" />
          <h3 className="font-bold text-neutral-800">物流派单概况</h3>
        </div>
        <button
          onClick={() => navigate('/admin/logistics')}
          className="text-sm text-eco-600 hover:text-eco-700 flex items-center gap-1 font-medium"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-eco-50 p-3 text-center">
            <p className="text-2xl font-bold text-eco-600">{courierStats.todayAssigned}</p>
            <p className="text-xs text-eco-600/70 mt-1">今日已派单</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{courierStats.todayPending}</p>
            <p className="text-xs text-amber-600/70 mt-1">待派单</p>
          </div>
          <div className="rounded-xl bg-cyan-50 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-cyan-600">{courierStats.avgResponseTime}</p>
              <span className="text-xs text-cyan-600/70">min</span>
            </div>
            <p className="text-xs text-cyan-600/70 mt-1">平均响应</p>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100">
          <p className="text-sm font-medium text-neutral-700 mb-3">快递员状态</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-eco-500 transition-all"
                style={{ width: `${courierStats.onlinePercent}%` }}
              />
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${courierStats.busyPercent}%` }}
              />
              <div
                className="h-full bg-neutral-300 transition-all"
                style={{ width: `${courierStats.offlinePercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-eco-500" />
              <span className="text-neutral-600">在线 {courierStats.onlinePercent}%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-neutral-600">忙碌 {courierStats.busyPercent}%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neutral-300" />
              <span className="text-neutral-600">离线 {courierStats.offlinePercent}%</span>
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100">
          <p className="text-sm font-medium text-neutral-700 mb-3">Top 评分快递员</p>
          <div className="space-y-2">
            {courierStats.topRated.map((courier, idx) => (
              <div
                key={courier.id}
                onClick={() => navigate('/admin/logistics')}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{courier.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-neutral-500">{courier.rating}</span>
                      <span className="text-xs text-neutral-300">·</span>
                      <span className="text-xs text-neutral-400">{courier.orderCount}单</span>
                    </div>
                  </div>
                </div>
                <span className={cn(
                  'badge text-xs',
                  courier.status === 'online' ? 'bg-eco-100 text-eco-700' :
                  courier.status === 'busy' ? 'bg-amber-100 text-amber-700' :
                  'bg-neutral-100 text-neutral-600'
                )}>
                  {courier.status === 'online' ? '在线' : courier.status === 'busy' ? '忙碌' : '离线'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsEntry = () => (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-eco-600" />
            <h3 className="font-bold text-neutral-800">数据看板</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl bg-gradient-to-br from-eco-50 to-teal-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-eco-500 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-lg font-bold text-neutral-800">
              {analyticsOverview.activeUsers.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">月活跃用户</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-lg font-bold text-neutral-800">3大品类</p>
            <p className="text-xs text-neutral-500 mt-0.5">品类分布趋势</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-lg font-bold text-neutral-800">
              ¥{analyticsOverview.totalDonation.toFixed(0)}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">公益捐赠总额</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-lg font-bold text-neutral-800">
              {analyticsOverview.totalCarbonSavedKg.toFixed(0)}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">环保减碳(kg)</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/analytics')}
          className="w-full py-3 px-4 bg-gradient-to-r from-eco-500 to-teal-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-eco-600 hover:to-teal-600 transition-all shadow-lg shadow-eco-500/25 hover:shadow-eco-500/40 active:scale-[0.98]"
        >
          进入数据看板
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {renderFlowSteps()}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map(({ label, value, suffix, icon: Icon, gradient, trend, trendData, trendColor }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-neutral-800">
                  {typeof value === 'number' && value % 1 !== 0
                    ? value.toFixed(1)
                    : value.toLocaleString()}
                  <span className="text-base font-normal text-neutral-400 ml-1">{suffix}</span>
                </p>
              </div>
              <div
                className={cn(
                  'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                  gradient
                )}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="flex-1 h-12">
                <ReactECharts
                  option={miniTrendOption(trendData, trendColor)}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
              <span
                className={cn(
                  'text-sm font-medium flex items-center gap-0.5',
                  trend.startsWith('+') ? 'text-eco-600' : 'text-red-500'
                )}
              >
                {trend.startsWith('+') ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-neutral-800">待处理质检工单</h3>
              <span className="badge bg-amber-100 text-amber-700">
                {pendingQualityOrders.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/admin/quality')}
              className="text-sm text-eco-600 hover:text-eco-700 flex items-center gap-1 font-medium"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-neutral-100 max-h-[340px] overflow-auto scrollbar-thin">
            {pendingQualityOrders.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-sm">暂无待处理工单</div>
            ) : (
              pendingQualityOrders.map((q) => {
                const order = orders.find((o) => o.id === q.orderId);
                const CatIcon = order ? categoryIconMap[order.category] : Package;
                const overdue = isOverdue(q.createdAt, 12);
                const statusInfo = qualityOrderStatusMap[q.status];
                return (
                  <div
                    key={q.id}
                    onClick={() => navigate(`/admin/quality/${q.id}`)}
                    className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-eco-50 flex items-center justify-center flex-shrink-0">
                        <CatIcon className="w-5 h-5 text-eco-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono text-sm font-semibold text-neutral-800 truncate">
                            {q.id.slice(0, 8)}
                          </p>
                          <span className="text-xs text-neutral-400">
                            订单: {order?.orderNo || q.orderId}
                          </span>
                          <span className={cn('badge text-xs', statusInfo.className)}>
                            {statusInfo.label}
                          </span>
                          {overdue && (
                            <span className="badge bg-red-100 text-red-700 flex items-center gap-0.5 text-xs">
                              <AlertTriangle className="w-3 h-3" />
                              超期
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {order && (
                            <span className="badge bg-eco-50 text-eco-700 text-xs">
                              {categoryLabelMap[order.category]}
                            </span>
                          )}
                          <span className="text-xs text-neutral-400">{q.createdAt}</span>
                          {q.assignee ? (
                            <span className="text-xs text-neutral-500 flex items-center gap-0.5">
                              <UserCheck className="w-3 h-3" />
                              {q.assignee}
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-300">未分配</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-600" />
              <h3 className="font-bold text-neutral-800">待打款订单</h3>
              <span className="badge bg-cyan-100 text-cyan-700">{pendingPayouts.length}</span>
            </div>
            <button
              onClick={() => navigate('/admin/payout')}
              className="text-sm text-eco-600 hover:text-eco-700 flex items-center gap-1 font-medium"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-neutral-100 max-h-[340px] overflow-auto scrollbar-thin">
            {pendingPayouts.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-sm">暂无待打款订单</div>
            ) : (
              pendingPayouts.map((p) => {
                const order = orders.find((o) => o.id === p.orderId);
                const methodTag = payoutMethodTagMap[p.method];
                const statusInfo = payoutStatusMap[p.status];
                const MethodIcon = methodTag.icon;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate('/admin/payout')}
                    className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                        <MethodIcon className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono text-sm font-semibold text-neutral-800 truncate">
                            {order?.orderNo || p.orderId}
                          </p>
                          <span className={cn('badge text-xs', methodTag.className)}>
                            {methodTag.label}
                          </span>
                          <span className={cn('badge text-xs', statusInfo.className)}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-500 flex items-center gap-0.5">
                            <User className="w-3 h-3" />
                            {p.userName || p.accountInfo.accountName}
                          </span>
                          <span className="text-xs text-neutral-300">·</span>
                          <span className="text-xs text-neutral-400">{p.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-lg font-bold text-neutral-800">
                        ¥{p.amount.toFixed(2)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-300" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {renderProcessorReview()}
        {renderLogisticsOverview()}
        {renderPayoutSummary()}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-bold text-neutral-800 mb-4">近7日运营趋势</h3>
          <ReactECharts option={trendChartOption} style={{ height: 320 }} />
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-neutral-800 mb-4">品类分布</h3>
          <ReactECharts option={categoryPieOption} style={{ height: 320 }} />
        </div>
      </div>

      {renderAnalyticsEntry()}
    </div>
  );
}
