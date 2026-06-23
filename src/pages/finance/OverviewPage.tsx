import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckSquare,
  CreditCard,
  HandCoins,
  HeartPulse,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Wallet,
  X,
  XCircle,
  Clock,
  User as UserIcon,
  Bike,
  Landmark,
  Info,
  Link2,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { cn, formatCurrency, formatDateTime, generateId } from '../../utils';
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

type ReviewResult = 'refund' | 'manual' | 'void';

interface SplitChain {
  orderId: string;
  orderTitle: string;
  pay: FinanceLedger | null;
  commission: FinanceLedger | null;
  payout: FinanceLedger | null;
  fee: FinanceLedger | null;
  totalAmount: number;
  status: 'success' | 'abnormal' | 'pending';
}

type AbnormalTab = 'all' | 'pay_failed' | 'payout_failed' | 'split_abnormal' | 'handled';

export default function OverviewPage() {
  const {
    mockLedgers,
    mockOrders,
    updateLedger,
    addLedger,
    addToast,
    retryLedger,
    compensateLedger,
    closeLedgerManual,
    markLedgerReviewing,
  } = useAppStore();

  const [abnormalTab, setAbnormalTab] = useState<AbnormalTab>('all');
  const [retryLoadingId, setRetryLoadingId] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<FinanceLedger | null>(null);
  const [retryModal, setRetryModal] = useState<FinanceLedger | null>(null);
  const [compensateModal, setCompensateModal] = useState<FinanceLedger | null>(null);
  const [closeModal, setCloseModal] = useState<FinanceLedger | null>(null);
  const [reviewModal, setReviewModal] = useState<FinanceLedger | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult>('refund');
  const [reviewNote, setReviewNote] = useState('');
  const [chainDetailOrder, setChainDetailOrder] = useState<SplitChain | null>(null);

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
    let filtered: FinanceLedger[] = [];

    switch (abnormalTab) {
      case 'all':
        filtered = mockLedgers.filter(
          (l) => l.status === 'failed' || l.status === 'retrying' || l.status === 'pending'
        );
        break;
      case 'pay_failed':
        filtered = mockLedgers.filter((l) => l.status === 'failed' && l.type === 'pay');
        break;
      case 'payout_failed':
        filtered = mockLedgers.filter((l) => l.status === 'failed' && l.type === 'payout');
        break;
      case 'split_abnormal':
        filtered = mockLedgers.filter(
          (l) =>
            (l.status === 'failed' || l.status === 'retrying') &&
            (l.type === 'commission' || l.type === 'fee' || l.type === 'payout')
        );
        break;
      case 'handled':
        filtered = mockLedgers.filter(
          (l) =>
            l.status === 'compensated' ||
            l.status === 'reversed' ||
            l.status === 'manual_closed' ||
            l.status === 'reviewing'
        );
        break;
    }

    return filtered.slice(0, 15);
  }, [mockLedgers, abnormalTab]);

  const abnormalStats = useMemo(() => {
    const payFailed = mockLedgers.filter((l) => l.status === 'failed' && l.type === 'pay').length;
    const payoutFailed = mockLedgers.filter((l) => l.status === 'failed' && l.type === 'payout').length;
    const splitAbnormal = mockLedgers.filter(
      (l) =>
        (l.status === 'failed' || l.status === 'retrying') &&
        (l.type === 'commission' || l.type === 'fee' || l.type === 'payout')
    ).length;
    const handled = mockLedgers.filter(
      (l) =>
        l.status === 'compensated' || l.status === 'reversed' || l.status === 'manual_closed'
    ).length;
    return { payFailed, payoutFailed, splitAbnormal, handled };
  }, [mockLedgers]);

  const splitChains = useMemo<SplitChain[]>(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = mockOrders.slice(0, 8);
    return todayOrders.map((order) => {
      const orderLedgers = mockLedgers.filter((l) => l.orderId === order.id && l.createdAt >= todayStart);
      const pay = orderLedgers.find((l) => l.type === 'pay') || null;
      const commission = orderLedgers.find((l) => l.type === 'commission') || null;
      const payout = orderLedgers.find((l) => l.type === 'payout') || null;
      const fee = orderLedgers.find((l) => l.type === 'fee') || null;

      const allExist = pay && commission && payout && fee;
      const allSuccess = allExist &&
        pay.status === 'success' && commission.status === 'success' &&
        payout.status === 'success' && fee.status === 'success';
      const anyFailed = pay?.status === 'failed' || commission?.status === 'failed' ||
        payout?.status === 'failed' || fee?.status === 'failed';

      return {
        orderId: order.id,
        orderTitle: order.title,
        pay,
        commission,
        payout,
        fee,
        totalAmount: order.totalAmount,
        status: allSuccess ? 'success' : anyFailed ? 'abnormal' : 'pending',
      };
    });
  }, [mockLedgers, mockOrders]);

  const splitChainStats = useMemo(() => {
    const success = splitChains.filter((c) => c.status === 'success').length;
    const abnormal = splitChains.filter((c) => c.status === 'abnormal').length;
    const pending = splitChains.filter((c) => c.status === 'pending').length;
    return { success, abnormal, pending };
  }, [splitChains]);

  const flowNodes = useMemo(() => {
    const userBalancePool = mockWallets.reduce((s, w) => s + w.balance, 0);

    const frozenOrderAmount = mockOrders
      .filter((o) => o.status === 'pending_accept' || o.status === 'picking' || o.status === 'delivering')
      .reduce((s, o) => s + o.totalAmount, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completedOrderAmount = mockOrders
      .filter((o) => o.status === 'completed' && o.deliveredAt && o.deliveredAt >= todayStart)
      .reduce((s, o) => s + o.totalAmount, 0);

    const platformCommission = mockLedgers
      .filter((l) => l.type === 'commission' && l.status === 'success')
      .reduce((s, l) => s + l.amount, 0);

    const riderWithdrawable = mockLedgers
      .filter((l) => l.type === 'payout' && l.status === 'success' && l.accountType === 'rider_wallet')
      .reduce((s, l) => s + l.amount, 0);

    return [
      { key: 'userBalance', label: '用户余额池', amount: userBalancePool + 85600, gradient: 'from-blue-500 to-blue-600', icon: Wallet, page: 'userBalances' },
      { key: 'frozenOrders', label: '订单冻结', amount: frozenOrderAmount + 12800, gradient: 'from-amber-500 to-orange-500', icon: CreditCard, page: 'orders' },
      { key: 'completedOrders', label: '已完成订单', amount: completedOrderAmount + 42680, gradient: 'from-emerald-500 to-teal-500', icon: CheckSquare, page: 'orders' },
      { key: 'platformCommission', label: '平台佣金', amount: platformCommission + 19284, gradient: 'from-violet-500 to-purple-600', icon: Landmark, page: 'overview' },
      { key: 'riderPayout', label: '骑手可提现', amount: riderWithdrawable + 98650, gradient: 'from-primary to-blue-600', icon: Banknote, page: 'riderPayout' },
    ] as const;
  }, [mockWallets, mockOrders, mockLedgers]);

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
    recharge: '充值',
    compensation: '补偿',
    retry: '重试',
  };

  const statusConfig: Record<FinanceLedger['status'], { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }> = {
    pending: { variant: 'warning', label: '处理中' },
    success: { variant: 'success', label: '成功' },
    failed: { variant: 'danger', label: '失败' },
    retrying: { variant: 'warning', label: '重试中' },
    reviewing: { variant: 'info', label: '复核中' },
    compensated: { variant: 'success', label: '已补偿' },
    reversed: { variant: 'danger', label: '已冲正' },
    manual_closed: { variant: 'info', label: '人工关闭' },
  };

  const openDetail = (ledger: FinanceLedger) => {
    setDetailModal(ledger);
  };

  const openRetry = (ledger: FinanceLedger) => {
    setRetryModal(ledger);
  };

  const handleRetryConfirm = async () => {
    if (!retryModal || retryLoadingId) return;
    setRetryLoadingId(retryModal.id);
    setRetryModal(null);
    await retryLedger(retryModal.id);
    setRetryLoadingId(null);
  };

  const openCompensate = (ledger: FinanceLedger) => {
    setCompensateModal(ledger);
  };

  const handleCompensateConfirm = (amount: number, reason: string, account: string) => {
    if (!compensateModal) return;
    compensateLedger(compensateModal.id, amount, reason, account);
    setCompensateModal(null);
  };

  const openClose = (ledger: FinanceLedger) => {
    setCloseModal(ledger);
  };

  const handleCloseConfirm = (remark: string) => {
    if (!closeModal) return;
    closeLedgerManual(closeModal.id, remark);
    setCloseModal(null);
  };

  const openReview = (ledger: FinanceLedger) => {
    setReviewModal(ledger);
    setReviewResult('refund');
    setReviewNote('');
  };

  const handleReviewConfirm = () => {
    if (!reviewModal) return;
    if (!reviewNote.trim()) {
      addToast({ message: '请填写复核备注', type: 'error' });
      return;
    }

    updateLedger(reviewModal.id, { status: 'reviewing' });
    addToast({ message: `流水 ${reviewModal.id.slice(-8)} 已提交复核`, type: 'info' });

    setTimeout(() => {
      let finalStatus: FinanceLedger['status'];
      let finalNote: string;
      switch (reviewResult) {
        case 'refund':
          finalStatus = 'reversed';
          finalNote = `原路退回: ${reviewNote}`;
          break;
        case 'manual':
          finalStatus = 'compensated';
          finalNote = `人工打款: ${reviewNote}`;
          break;
        case 'void':
          finalStatus = 'reversed';
          finalNote = `标记作废: ${reviewNote}`;
          break;
      }

      updateLedger(reviewModal.id, {
        status: finalStatus,
        reviewNote: finalNote,
        reviewedBy: '财务管理员',
        reviewedAt: new Date(),
      });

      const resultText: Record<ReviewResult, string> = {
        refund: '原路退回',
        manual: '人工打款',
        void: '标记作废',
      };
      addToast({
        message: `复核完成: ${resultText[reviewResult]} - 流水 ${reviewModal.id.slice(-8)}`,
        type: finalStatus === 'reversed' ? 'warning' : 'success',
      });
    }, 1200);

    setReviewModal(null);
    setReviewNote('');
  };

  const chainStatusConfig = {
    success: { bg: 'bg-green-500', text: 'text-green-600', label: '成功' },
    abnormal: { bg: 'bg-red-500', text: 'text-red-600', label: '异常' },
    pending: { bg: 'bg-yellow-500', text: 'text-yellow-600', label: '待处理' },
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

        <Card className="mb-6">
          <CardHeader className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-gray-900">资金流向链路</h3>
              <span className="text-[11px] text-gray-400 ml-2">点击节点查看明细</span>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-5">
            <div className="flex items-center justify-between gap-2">
              {flowNodes.map((node, idx) => (
                <div key={node.key} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      'flex-1 rounded-2xl p-4 text-white shadow-md cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg relative overflow-hidden bg-gradient-to-br',
                      node.gradient
                    )}
                    onClick={() => {
                      addToast({ message: `跳转到${node.label}明细页`, type: 'info' });
                    }}
                  >
                    <div className="absolute -right-5 -top-5 w-20 h-20 rounded-full bg-white/10"></div>
                    <div className="absolute -right-8 -bottom-8 w-16 h-16 rounded-full bg-white/5"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                          <node.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium opacity-90">{node.label}</span>
                      </div>
                      <div className="text-2xl font-bold tracking-tight">
                        ¥{Math.floor(node.amount).toLocaleString()}
                      </div>
                      <div className="text-[10px] opacity-75 mt-1">
                        {idx === 0 ? `${mockWallets.length} 个用户` :
                         idx === 1 ? '进行中订单' :
                         idx === 2 ? '今日已完成' :
                         idx === 3 ? '累计抽佣 15%' :
                         '骑手钱包余额'}
                      </div>
                    </div>
                  </div>
                  {idx < flowNodes.length - 1 && (
                    <div className="shrink-0 text-gray-300">
                      <ArrowUpRight className="w-5 h-5 rotate-45" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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

              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-primary" />
                    今日分账链路总览
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>成功 {splitChainStats.success}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>异常 {splitChainStats.abnormal}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>待处理 {splitChainStats.pending}</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {splitChains.map((chain) => {
                    const sc = chainStatusConfig[chain.status];
                    return (
                      <div
                        key={chain.orderId}
                        onClick={() => setChainDetailOrder(chain)}
                        className="p-2.5 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/[0.02] cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={cn('w-1.5 h-1.5 rounded-full', sc.bg)}></span>
                          <span className="text-[11px] font-medium text-gray-800 truncate flex-1">
                            {chain.orderTitle}
                          </span>
                          <span className={cn('text-[10px] font-medium', sc.text)}>{sc.label}</span>
                          <span className="text-[10px] font-bold text-gray-700">¥{chain.totalAmount.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 flex items-center gap-0.5">
                            <div className="h-1 flex-1 rounded bg-blue-500/80" title="用户支付"></div>
                            <div className="h-1 flex-[0.15] rounded bg-primary/80" title="平台抽佣15%"></div>
                            <div className="h-1 flex-[0.85] rounded bg-emerald-500/80" title="骑手收入85%"></div>
                            <div className="h-1 w-4 rounded bg-violet-500/80" title="通道费"></div>
                          </div>
                          <Info className="w-3 h-3 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-danger" />
                  <h3 className="text-sm font-semibold text-gray-900">异常流水管理</h3>
                </div>
                <Badge variant="danger">{abnormalStats.payFailed + abnormalStats.payoutFailed + abnormalStats.splitAbnormal} 条待处理</Badge>
              </div>
              <Tabs value={abnormalTab} onValueChange={(v) => setAbnormalTab(v as AbnormalTab)}>
                <TabList>
                  <Tab value="all">全部</Tab>
                  <Tab value="pay_failed">
                    支付失败
                    <Badge variant="danger" className="ml-1.5 !text-[10px] !px-1.5 !py-0">{abnormalStats.payFailed}</Badge>
                  </Tab>
                  <Tab value="payout_failed">
                    提现失败
                    <Badge variant="danger" className="ml-1.5 !text-[10px] !px-1.5 !py-0">{abnormalStats.payoutFailed}</Badge>
                  </Tab>
                  <Tab value="split_abnormal">
                    分账异常
                    <Badge variant="warning" className="ml-1.5 !text-[10px] !px-1.5 !py-0">{abnormalStats.splitAbnormal}</Badge>
                  </Tab>
                  <Tab value="handled">
                    已处理
                    <Badge variant="success" className="ml-1.5 !text-[10px] !px-1.5 !py-0">{abnormalStats.handled}</Badge>
                  </Tab>
                </TabList>
              </Tabs>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">流水号</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">类型</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">通道</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">金额</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">失败原因</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">状态</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">时间</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {abnormalLedgers.map((l) => {
                    const sc = statusConfig[l.status];
                    const isFailed = l.status === 'failed';
                    const isHandled = ['compensated', 'reversed', 'manual_closed', 'reviewing'].includes(l.status);
                    return (
                      <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-gray-600">{l.id.slice(-12)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-700">{typeText[l.type]}</span>
                          {l.retryCount && l.retryCount > 0 && (
                            <span className="ml-1.5 text-[10px] text-accent">重试{l.retryCount}次</span>
                          )}
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
                        <td className="px-4 py-3">
                          <div className="max-w-[160px] truncate text-[11px] text-gray-500" title={l.failureReason || l.remark}>
                            {l.failureReason || l.remark || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant={sc.variant}>{sc.label}</Badge>
                            {l.status === 'manual_closed' && (
                              <span className="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">人工</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                          {formatDateTime(l.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openDetail(l)}
                              className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                              title="查看详情"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {isFailed && (
                              <>
                                <button
                                  onClick={() => openRetry(l)}
                                  disabled={retryLoadingId === l.id}
                                  className={cn(
                                    'p-1.5 rounded-lg transition-all',
                                    retryLoadingId === l.id
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                  )}
                                  title="重试打款"
                                >
                                  <RefreshCw className={cn('w-3.5 h-3.5', retryLoadingId === l.id && 'animate-spin')} />
                                </button>
                                <button
                                  onClick={() => openCompensate(l)}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                                  title="手动补偿"
                                >
                                  <HeartPulse className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openClose(l)}
                                  className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all"
                                  title="标记已处理"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {isHandled && (
                              <span className="text-[10px] text-gray-400">已处置</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {abnormalLedgers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
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

      <DetailModal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        ledger={detailModal}
        onRetry={() => {
          if (detailModal) {
            setRetryModal(detailModal);
            setDetailModal(null);
          }
        }}
        onCompensate={() => {
          if (detailModal) {
            setCompensateModal(detailModal);
            setDetailModal(null);
          }
        }}
        onCloseManual={() => {
          if (detailModal) {
            setCloseModal(detailModal);
            setDetailModal(null);
          }
        }}
        retryLoading={retryLoadingId === detailModal?.id}
      />

      <RetryModal
        isOpen={!!retryModal}
        onClose={() => setRetryModal(null)}
        ledger={retryModal}
        onConfirm={handleRetryConfirm}
        loading={retryLoadingId === retryModal?.id}
      />

      <CompensateModal
        isOpen={!!compensateModal}
        onClose={() => setCompensateModal(null)}
        ledger={compensateModal}
        onConfirm={handleCompensateConfirm}
      />

      <CloseModal
        isOpen={!!closeModal}
        onClose={() => setCloseModal(null)}
        ledger={closeModal}
        onConfirm={handleCloseConfirm}
      />

      <Modal
        isOpen={!!reviewModal}
        onClose={() => { setReviewModal(null); setReviewNote(''); }}
        title="流水复核"
        size="md"
      >
        {reviewModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-violet-800 mb-0.5">复核后流水进入终态</div>
                  <div className="text-xs text-violet-700">请根据实际情况选择合适的处置方式</div>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-500">流水号</span>
                <span className="font-mono text-gray-800">{reviewModal.id.slice(-12)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">原金额</span>
                <span className="font-bold text-danger">-{formatCurrency(reviewModal.amount)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">处置结果</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: 'refund' as const, label: '原路退回', icon: X, desc: '资金原路返回' },
                  { key: 'manual' as const, label: '人工打款', icon: HandCoins, desc: '线下转账处理' },
                  { key: 'void' as const, label: '标记作废', icon: CheckSquare, desc: '流水冲正作废' },
                ]).map((opt) => {
                  const active = reviewResult === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setReviewResult(opt.key)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left transition-all',
                        active
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2',
                        active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                      )}>
                        <opt.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className={cn('text-xs font-semibold mb-0.5', active ? 'text-primary' : 'text-gray-800')}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-gray-500">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">复核备注 *</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="请详细描述复核处理说明..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
                onClick={() => { setReviewModal(null); setReviewNote(''); }}
              >
                取消
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleReviewConfirm}>
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                提交复核
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!chainDetailOrder}
        onClose={() => setChainDetailOrder(null)}
        title={`分账链路详情 - ${chainDetailOrder?.orderTitle}`}
        size="lg"
      >
        {chainDetailOrder && (
          <div className="space-y-5">
            <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-gray-500 mb-0.5">订单号</div>
                <div className="font-mono text-sm text-gray-800">{chainDetailOrder.orderId}</div>
              </div>
              <Badge variant={chainDetailOrder.status === 'success' ? 'success' : chainDetailOrder.status === 'abnormal' ? 'danger' : 'warning'}>
                {chainStatusConfig[chainDetailOrder.status].label}
              </Badge>
            </div>

            <div className="relative">
              <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
              {[
                { key: 'pay', label: '用户支付', ledger: chainDetailOrder.pay, amount: chainDetailOrder.totalAmount, icon: ShoppingBag, color: 'bg-blue-500', text: 'text-blue-600' },
                { key: 'commission', label: '平台抽佣15%', ledger: chainDetailOrder.commission, amount: chainDetailOrder.totalAmount * 0.15, icon: Landmark, color: 'bg-primary', text: 'text-primary' },
                { key: 'payout', label: '骑手收入85%', ledger: chainDetailOrder.payout, amount: chainDetailOrder.totalAmount * 0.85, icon: Bike, color: 'bg-emerald-500', text: 'text-emerald-600' },
                { key: 'fee', label: '通道手续费', ledger: chainDetailOrder.fee, amount: chainDetailOrder.totalAmount * 0.006, icon: CreditCard, color: 'bg-violet-500', text: 'text-violet-600' },
              ].map((step, idx) => (
                <div key={step.key} className="relative flex gap-4 py-3">
                  <div className={cn(
                    'relative z-10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                    step.color,
                    'text-white'
                  )}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{step.label}</span>
                        <Badge variant={
                          step.ledger?.status === 'success' ? 'success' :
                          step.ledger?.status === 'failed' ? 'danger' :
                          step.ledger ? 'warning' : 'default'
                        }>
                          {step.ledger ? statusConfig[step.ledger.status].label : '待生成'}
                        </Badge>
                      </div>
                      <span className={cn('text-sm font-bold', step.text)}>
                        {idx === 0 ? '+' : idx === 1 ? '' : idx === 2 ? '-' : '-'}{formatCurrency(step.amount)}
                      </span>
                    </div>
                    {step.ledger && (
                      <div className="text-[11px] text-gray-500 space-y-0.5">
                        <div>流水号: <span className="font-mono text-gray-700">{step.ledger.id.slice(-12)}</span></div>
                        <div>通道: <span className="text-gray-700">{channelText[step.ledger.channel]}</span> · 时间: <span className="font-mono text-gray-700">{formatDateTime(step.ledger.createdAt)}</span></div>
                        {step.ledger.channelTxnId && <div>通道流水: <span className="font-mono text-gray-700">{step.ledger.channelTxnId.slice(-12)}</span></div>}
                      </div>
                    )}
                    {!step.ledger && (
                      <div className="text-[11px] text-gray-400 italic">等待分账任务生成...</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
                onClick={() => setChainDetailOrder(null)}
              >
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
