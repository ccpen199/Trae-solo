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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Category, PayoutMethod, ProcessorStatus, QualityOrderStatus, PayoutStatus } from '../../../shared/types';

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

  const courierStats = useMemo(() => {
    const online = couriers.filter((c) => c.status === 'online').length;
    const busy = couriers.filter((c) => c.status === 'busy').length;
    const offline = couriers.filter((c) => c.status === 'offline').length;
    const todayPending = orders.filter((o) =>
      (o.status === 'pending' || o.status === 'assigned') &&
      dayjs(o.createdAt).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    ).length;
    return { online, busy, offline, todayPending };
  }, [couriers, orders]);

  const isOverdue = (createdAt: string, hoursThreshold = 24) => {
    return dayjs().diff(dayjs(createdAt), 'hour') > hoursThreshold;
  };

  return (
    <div className="space-y-5 animate-fade-in">
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
                  'text-sm font-medium',
                  trend.startsWith('+') ? 'text-eco-600' : 'text-red-500'
                )}
              >
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-neutral-800">处理商资质审核待办</h3>
              <span className="badge bg-indigo-100 text-indigo-700">
                {pendingProcessorReviews.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/admin/processors')}
              className="text-sm text-eco-600 hover:text-eco-700 flex items-center gap-1 font-medium"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-neutral-100 max-h-[300px] overflow-auto scrollbar-thin">
            {pendingProcessorReviews.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-sm">暂无审核待办</div>
            ) : (
              pendingProcessorReviews.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate('/admin/processors')}
                  className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-neutral-800 truncate">{p.companyName}</p>
                        <span className={cn('badge text-xs', processorStatusMap[p.status].className)}>
                          {processorStatusMap[p.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-neutral-500 flex items-center gap-0.5">
                          <User className="w-3 h-3" />
                          {p.contactName}
                        </span>
                        <span className="text-xs text-neutral-300">·</span>
                        <span className="text-xs text-neutral-400">
                          {p.reviewHistory[0]?.createdAt || '-'}
                        </span>
                        <span className="text-xs text-neutral-300">·</span>
                        <div className="flex items-center gap-1">
                          {p.categories.slice(0, 3).map((cat) => (
                            <span key={cat} className="badge bg-eco-50 text-eco-700 text-xs">
                              {categoryLabelMap[cat as Category] || cat}
                            </span>
                          ))}
                          {p.categories.length > 3 && (
                            <span className="text-xs text-neutral-400">+{p.categories.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-eco-600" />
              <h3 className="font-bold text-neutral-800">物流调度概况</h3>
            </div>
            <button
              onClick={() => navigate('/admin/logistics')}
              className="text-sm text-eco-600 hover:text-eco-700 flex items-center gap-1 font-medium"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            <div
              onClick={() => navigate('/admin/logistics')}
              className="cursor-pointer space-y-4"
            >
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-eco-50 p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-eco-600" />
                    <span className="text-xs text-eco-600 font-medium">在线</span>
                  </div>
                  <p className="text-2xl font-bold text-eco-700">{courierStats.online}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-amber-600 font-medium">忙碌</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">{courierStats.busy}</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs text-neutral-400 font-medium">离线</span>
                  </div>
                  <p className="text-2xl font-bold text-neutral-500">{courierStats.offline}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-eco-50 to-teal-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-eco-500 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">今日待派单</p>
                    <p className="text-xs text-neutral-400">待分配上门取件订单</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-eco-600">{courierStats.todayPending}</p>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
}
