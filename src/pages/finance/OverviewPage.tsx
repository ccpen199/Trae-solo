import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CreditCard,
  HandCoins,
  HeartPulse,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cn, formatCurrency, formatDateTime } from '../../utils';
import type { FinanceLedger } from '../../types';

interface KpiCardProps {
  title: string;
  value: string;
  trend: number;
  gradient: string;
  icon: typeof Banknote;
  iconBg: string;
}

function KpiCard({ title, value, trend, gradient, icon: Icon, iconBg }: KpiCardProps) {
  const isUp = trend >= 0;
  return (
    <div className={cn('rounded-2xl p-5 text-white shadow-lg relative overflow-hidden', gradient)}>
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10"></div>
      <div className="absolute -right-10 -bottom-10 w-24 h-24 rounded-full bg-white/5"></div>
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm opacity-90 mb-1">{title}</div>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
          </div>
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', iconBg)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          {isUp ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          <span className="font-medium">{Math.abs(trend)}%</span>
          <span className="opacity-75 ml-1">较昨日</span>
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { mockLedgers } = useAppStore();

  const kpis = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLedgers = mockLedgers.filter((l) => l.createdAt >= todayStart);

    const turnover = todayLedgers
      .filter((l) => l.type === 'pay' && l.status === 'success')
      .reduce((s, l) => s + l.amount, 0);
    const commission = todayLedgers
      .filter((l) => l.type === 'commission')
      .reduce((s, l) => s + l.amount, 0);
    const riderPayout = todayLedgers
      .filter((l) => l.type === 'payout')
      .reduce((s, l) => s + l.amount, 0);
    const feeCost = todayLedgers
      .filter((l) => l.type === 'fee')
      .reduce((s, l) => s + l.amount, 0);

    return {
      turnover: { value: turnover + 128560, trend: 12.5 },
      commission: { value: commission + 19284, trend: 8.3 },
      riderPayout: { value: riderPayout + 98650, trend: 15.2 },
      feeCost: { value: feeCost + 3858, trend: -2.1 },
    };
  }, [mockLedgers]);

  const revenueExpenseOption = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const revenue = [82000, 95000, 110000, 98000, 125000, 138000, 128560];
    const expense = [65000, 78000, 88000, 82000, 105000, 115000, 102508];
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v: number) => `¥${v.toLocaleString()}`,
      },
      legend: {
        data: ['收入', '支出'],
        textStyle: { color: '#6B7280' },
        top: 0,
      },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: days,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#6B7280' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#F3F4F6' } },
        axisLabel: { color: '#6B7280', formatter: (v: number) => `${v / 10000}万` },
      },
      series: [
        {
          name: '收入',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: revenue,
          lineStyle: { color: '#1E40FF', width: 3 },
          itemStyle: { color: '#1E40FF' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(30,64,255,0.25)' },
                { offset: 1, color: 'rgba(30,64,255,0.01)' },
              ],
            },
          },
        },
        {
          name: '支出',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: expense,
          lineStyle: { color: '#FF6B1A', width: 3 },
          itemStyle: { color: '#FF6B1A' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255,107,26,0.2)' },
                { offset: 1, color: 'rgba(255,107,26,0.01)' },
              ],
            },
          },
        },
      ],
    };
  }, []);

  const splitOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', valueFormatter: (v: number) => `${v}%` },
    legend: { bottom: 0, textStyle: { color: '#6B7280' } },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: true, position: 'center', formatter: '{d}%', fontSize: 24, fontWeight: 'bold' },
        emphasis: {
          label: { show: true, fontSize: 24, fontWeight: 'bold' },
        },
        labelLine: { show: false },
        data: [
          {
            value: 15,
            name: '平台佣金',
            itemStyle: { color: '#1E40FF' },
            label: { color: '#1E40FF' },
          },
          {
            value: 85,
            name: '骑手分成',
            itemStyle: { color: '#00C48C' },
            label: { color: '#00C48C', show: false },
          },
        ],
      },
    ],
  }), []);

  const channels = useMemo(() => [
    {
      name: '微信支付',
      icon: '💚',
      successRate: 99.2,
      requestCount: 8421,
      dailyLimit: 500000,
      used: 312450,
      status: 'healthy' as const,
    },
    {
      name: '支付宝',
      icon: '💙',
      successRate: 98.8,
      requestCount: 5230,
      dailyLimit: 500000,
      used: 198720,
      status: 'healthy' as const,
    },
    {
      name: '银联支付',
      icon: '💳',
      successRate: 96.5,
      requestCount: 892,
      dailyLimit: 200000,
      used: 28600,
      status: 'warning' as const,
    },
    {
      name: '余额支付',
      icon: '💰',
      successRate: 99.9,
      requestCount: 1560,
      dailyLimit: 300000,
      used: 45830,
      status: 'healthy' as const,
    },
  ], []);

  const abnormalLedgers = useMemo(() => {
    const failed = mockLedgers.filter((l) => l.status === 'failed');
    const pending = mockLedgers.filter((l) => l.status === 'pending');
    return [...failed, ...pending.slice(0, 3)].slice(0, 8);
  }, [mockLedgers]);

  const channelColors: Record<string, string> = {
    wechat: 'text-green-600 bg-green-50',
    alipay: 'text-blue-600 bg-blue-50',
    unionpay: 'text-red-600 bg-red-50',
    balance: 'text-yellow-600 bg-yellow-50',
  };

  const channelText: Record<string, string> = {
    wechat: '微信',
    alipay: '支付宝',
    unionpay: '银联',
    balance: '余额',
  };

  const typeText: Record<FinanceLedger['type'], string> = {
    pay: '支付',
    refund: '退款',
    payout: '打款',
    commission: '佣金',
    fee: '手续费',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Wallet className="w-7 h-7 text-primary" />
              财务概览
            </h1>
            <p className="text-sm text-gray-500 mt-1">实时掌握平台资金流动与经营状况</p>
          </div>
          <div className="text-sm text-gray-500">
            数据更新于 <span className="font-mono text-gray-700">{formatDateTime(new Date())}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="今日流水"
            value={`¥${kpis.turnover.value.toLocaleString()}`}
            trend={kpis.turnover.trend}
            gradient="bg-gradient-to-br from-primary to-blue-600"
            icon={Banknote}
            iconBg="bg-white/20"
          />
          <KpiCard
            title="平台佣金"
            value={`¥${kpis.commission.value.toLocaleString()}`}
            trend={kpis.commission.trend}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            icon={HandCoins}
            iconBg="bg-white/20"
          />
          <KpiCard
            title="骑手支出"
            value={`¥${kpis.riderPayout.value.toLocaleString()}`}
            trend={kpis.riderPayout.trend}
            gradient="bg-gradient-to-br from-accent to-orange-600"
            icon={CreditCard}
            iconBg="bg-white/20"
          />
          <KpiCard
            title="通道成本"
            value={`¥${kpis.feeCost.value.toLocaleString()}`}
            trend={kpis.feeCost.trend}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            icon={PiggyBank}
            iconBg="bg-white/20"
          />
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card className="col-span-2">
            <CardHeader className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-gray-900">近7日收入支出趋势</h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-primary"></span>
                  收入 ¥676,560
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-accent"></span>
                  支出 ¥535,508
                </span>
                <span className="font-semibold text-success">
                  净利润 ¥{(676560 - 535508).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ReactECharts option={revenueExpenseOption} style={{ height: 320 }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-gray-900">分账比例</h3>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ReactECharts option={splitOption} style={{ height: 220 }} />
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-xs text-blue-600 mb-1">平台佣金</div>
                  <div className="text-lg font-bold text-blue-700">15%</div>
                  <div className="text-[10px] text-blue-500">¥19,284 今日</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-xs text-emerald-600 mb-1">骑手分成</div>
                  <div className="text-lg font-bold text-emerald-700">85%</div>
                  <div className="text-[10px] text-emerald-500">¥98,650 今日</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-danger" />
                <h3 className="text-sm font-semibold text-gray-900">最近异常流水</h3>
              </div>
              <Badge variant="danger">{abnormalLedgers.length} 条异常</Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">流水号</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">类型</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">通道</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">金额</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">关联订单</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">状态</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {abnormalLedgers.map((l) => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-gray-600">{l.id.slice(-12)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-700">{typeText[l.type]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-md text-xs font-medium',
                          channelColors[l.channel]
                        )}>
                          {channelText[l.channel]}
                        </span>
                      </td>
                      <td className={cn(
                        'px-4 py-3 text-right font-semibold',
                        l.status === 'failed' ? 'text-danger' : l.status === 'pending' ? 'text-accent' : 'text-gray-900'
                      )}>
                        {l.direction === 'debit' ? '+' : '-'}{formatCurrency(l.amount)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {l.orderId ? l.orderId.slice(-8) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={l.status === 'failed' ? 'danger' : 'warning'}>
                          {l.status === 'failed' ? '失败' : l.status === 'pending' ? '处理中' : '成功'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {formatDateTime(l.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {abnormalLedgers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                        暂无异常流水
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-success" />
                <h3 className="text-sm font-semibold text-gray-900">支付通道健康度</h3>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {channels.map((ch) => {
                const usagePercent = (ch.used / ch.dailyLimit) * 100;
                const isWarn = ch.status === 'warning';
                return (
                  <div key={ch.name} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{ch.icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{ch.name}</div>
                          <div className="text-[10px] text-gray-500">请求量 {ch.requestCount.toLocaleString()} 笔</div>
                        </div>
                      </div>
                      <Badge variant={isWarn ? 'warning' : 'success'}>
                        {isWarn ? '注意' : '健康'}
                      </Badge>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-500">成功率</span>
                        <span className={cn('font-semibold', isWarn ? 'text-accent' : 'text-success')}>
                          {ch.successRate}%
                        </span>
                      </div>
                      <ProgressBar
                        value={ch.successRate}
                        variant={isWarn ? 'accent' : 'success'}
                        height={5}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-500">当日限额</span>
                        <span className="text-gray-700 font-medium">
                          ¥{ch.used.toLocaleString()} / ¥{ch.dailyLimit.toLocaleString()}
                        </span>
                      </div>
                      <ProgressBar
                        value={usagePercent}
                        variant="primary"
                        height={5}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
