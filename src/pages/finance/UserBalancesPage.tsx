import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Ban,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Plus,
  RefreshCw,
  Undo2,
  Search,
  SlidersHorizontal,
  TrendingUp,
  User as UserIcon,
  Wallet,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cn, generateId } from '../../utils';
import type { User, UserWallet } from '../../types';

interface BalanceRow {
  user: User;
  wallet: UserWallet;
  todayRecharge: number;
  todaySpend: number;
  trendData: number[];
  ledgers: Array<{
    id: string;
    type: 'recharge' | 'consume' | 'refund' | 'freeze';
    amount: number;
    status: 'success' | 'pending' | 'failed';
    time: Date;
    desc: string;
  }>;
}

type ActionType = 'recharge' | 'refund' | 'freeze';

export default function UserBalancesPage() {
  const { mockUsers, mockWallets, mockLedgers, showToast } = useAppStore();

  const [searchText, setSearchText] = useState('');
  const [balanceRange, setBalanceRange] = useState({ min: '', max: '' });
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: ActionType;
    row: BalanceRow;
  } | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionRemark, setActionRemark] = useState('');
  const [actionOperator, setActionOperator] = useState('财务管理员');
  const [showAllLedgers, setShowAllLedgers] = useState<string | null>(null);

  const balanceRows = useMemo<BalanceRow[]>(() => {
    return mockUsers.map((user) => {
      const wallet = mockWallets.find((w) => w.userId === user.id) ?? {
        id: generateId('wlt'),
        userId: user.id,
        balance: 0,
        frozen: 0,
        currency: 'CNY',
      };
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const userLedgers = mockLedgers.filter((l) => l.userId === user.id || l.orderId === user.id);
      const todayRecharge = userLedgers
        .filter((l) => l.createdAt >= todayStart && l.type === 'recharge' && l.direction === 'debit')
        .reduce((s, l) => s + l.amount, 0) + Math.floor(Math.random() * 500) + 50;
      const todaySpend = userLedgers
        .filter((l) => l.createdAt >= todayStart && l.direction === 'credit')
        .reduce((s, l) => s + l.amount, 0) + Math.floor(Math.random() * 300) + 20;
      const trendData = Array.from({ length: 7 }, () => Math.floor(Math.random() * 500) + 100);

      const ledgerTypes: Array<'recharge' | 'consume' | 'refund' | 'freeze'> = ['recharge', 'consume', 'consume', 'refund', 'consume', 'recharge', 'freeze', 'consume', 'consume', 'recharge'];
      const statuses: Array<'success' | 'pending' | 'failed'> = ['success', 'success', 'success', 'success', 'pending', 'failed', 'success', 'success', 'success', 'success'];
      const ledgers = Array.from({ length: 10 }, (_, i) => {
        const type = ledgerTypes[i % ledgerTypes.length];
        const amt = type === 'recharge' ? Math.floor(Math.random() * 500) + 50 :
                    type === 'refund' ? Math.floor(Math.random() * 100) + 20 :
                    type === 'freeze' ? Math.floor(Math.random() * 200) + 50 :
                    Math.floor(Math.random() * 150) + 20;
        return {
          id: generateId('led'),
          type,
          amount: amt,
          status: statuses[i % statuses.length],
          time: new Date(Date.now() - i * 3600000 * (Math.random() * 3 + 1)),
          desc: type === 'recharge' ? '余额充值' :
                type === 'consume' ? '订单支付' :
                type === 'refund' ? '订单退款' : '余额冻结',
        };
      }).sort((a, b) => b.time.getTime() - a.time.getTime());

      return { user, wallet, todayRecharge, todaySpend, trendData, ledgers };
    });
  }, [mockUsers, mockWallets, mockLedgers]);

  const filteredRows = useMemo(() => {
    let list = balanceRows;
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.user.id.toLowerCase().includes(kw) ||
          r.user.phone.includes(kw) ||
          r.user.nickname.toLowerCase().includes(kw)
      );
    }
    const min = balanceRange.min ? parseFloat(balanceRange.min) : -Infinity;
    const max = balanceRange.max ? parseFloat(balanceRange.max) : Infinity;
    list = list.filter((r) => r.wallet.balance >= min && r.wallet.balance <= max);
    return list;
  }, [balanceRows, searchText, balanceRange]);

  const stats = useMemo(() => {
    const totalBalance = balanceRows.reduce((s, r) => s + r.wallet.balance, 0);
    const totalFrozen = balanceRows.reduce((s, r) => s + r.wallet.frozen, 0);
    const totalRecharge = balanceRows.reduce((s, r) => s + r.todayRecharge, 0);
    const totalSpend = balanceRows.reduce((s, r) => s + r.todaySpend, 0);
    const highValueUsers = balanceRows.filter((r) => r.wallet.balance >= 1000).length;
    return { totalBalance, totalFrozen, totalRecharge, totalSpend, highValueUsers, count: balanceRows.length };
  }, [balanceRows]);

  const getTrendOption = (data: number[]) => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => `¥${v}` },
    grid: { left: 30, right: 10, top: 10, bottom: 20 },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF', fontSize: 9 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
      axisLabel: { color: '#9CA3AF', fontSize: 9 },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        data,
        lineStyle: { color: '#1E40FF', width: 2 },
        itemStyle: { color: '#1E40FF' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(30,64,255,0.15)' },
              { offset: 1, color: 'rgba(30,64,255,0)' },
            ],
          },
        },
      },
    ],
  });

  const handleActionConfirm = () => {
    if (!actionModal) return;
    const amount = parseFloat(actionAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('请输入有效金额', 'error');
      return;
    }
    const actionText: Record<ActionType, string> = {
      recharge: `充值 ¥${amount} 成功`,
      refund: `退款 ¥${amount} 成功`,
      freeze: `已冻结 ¥${amount}`,
    };
    showToast(actionText[actionModal.type], 'success');
    setActionModal(null);
    setActionAmount('');
    setActionReason('');
  };

  const actionConfig: Record<ActionType, { title: string; color: string; btnVariant: 'primary' | 'accent' | 'danger'; hint: string }> = {
    recharge: { title: '用户充值', color: 'text-success', btnVariant: 'primary', hint: '将资金增加到用户可用余额' },
    refund: { title: '余额退款', color: 'text-accent', btnVariant: 'accent', hint: '从用户余额退还资金到原支付账户' },
    freeze: { title: '冻结余额', color: 'text-danger', btnVariant: 'danger', hint: '冻结部分余额，用户暂时无法使用' },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Wallet className="w-7 h-7 text-primary" />
              用户余额管理
            </h1>
            <p className="text-sm text-gray-500 mt-1">管理用户钱包余额、充值、退款与冻结操作</p>
          </div>
          <Button variant="primary" onClick={() => showToast('已导出余额报表', 'success')}>
            <CreditCard className="w-4 h-4 mr-1.5" />
            导出报表
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">总用户数</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.count}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">总可用余额</div>
                  <div className="text-2xl font-bold text-primary">¥{stats.totalBalance.toLocaleString()}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">总冻结金额</div>
                  <div className="text-2xl font-bold text-danger">¥{stats.totalFrozen.toLocaleString()}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">今日充值</div>
                  <div className="text-2xl font-bold text-success">¥{stats.totalRecharge.toLocaleString()}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">今日消费</div>
                  <div className="text-2xl font-bold text-accent">¥{stats.totalSpend.toLocaleString()}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索用户ID / 手机号 / 昵称"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">余额区间:</span>
                <input
                  type="number"
                  placeholder="最小"
                  value={balanceRange.min}
                  onChange={(e) => setBalanceRange({ ...balanceRange, min: e.target.value })}
                  className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="最大"
                  value={balanceRange.max}
                  onChange={(e) => setBalanceRange({ ...balanceRange, max: e.target.value })}
                  className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-gray-500">高价值用户(≥1000)</span>
                <Badge variant="info">{stats.highValueUsers}人</Badge>
                <Button variant="outline" size="sm" className="!text-gray-600 !border-gray-300 !bg-white hover:!bg-gray-50">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  重置筛选
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="w-10"></th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3.5">用户</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3.5">可用余额</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3.5">冻结金额</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3.5">今日充值</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3.5">今日消费</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3.5">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isExpanded = expandedUserId === row.user.id;
                  return (
                    <>
                      <motion.tr
                        key={row.user.id}
                        className={cn(
                          'border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer',
                          row.wallet.frozen > 0 && 'bg-red-50/30'
                        )}
                        onClick={() => setExpandedUserId(isExpanded ? null : row.user.id)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={row.user.avatarUrl}
                              alt=""
                              className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{row.user.nickname}</span>
                                {row.user.isVerified && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">已认证</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {row.user.phone} · {row.user.id.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="font-bold text-primary text-lg">¥{row.wallet.balance.toFixed(2)}</div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className={cn('font-semibold', row.wallet.frozen > 0 ? 'text-danger' : 'text-gray-400')}>
                            ¥{row.wallet.frozen.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="text-success font-medium">+¥{row.todayRecharge.toFixed(0)}</div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="text-accent font-medium">-¥{row.todaySpend.toFixed(0)}</div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setActionModal({ type: 'recharge', row })}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              充值
                            </Button>
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => setActionModal({ type: 'refund', row })}
                            >
                              <Undo2 className="w-3 h-3 mr-1" />
                              退款
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setActionModal({ type: 'freeze', row })}
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              冻结
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            key={`${row.user.id}_detail`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-gradient-to-r from-primary/[0.02] to-transparent"
                          >
                            <td colSpan={7} className="px-6 py-5">
                              <div className="flex gap-6">
                                <div className="w-64 shrink-0 p-4 rounded-xl bg-white border border-gray-100">
                                  <div className="text-xs font-semibold text-gray-900 mb-3">账户概览</div>
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500">账户等级</span>
                                      <span className="font-medium text-gray-900">
                                        {row.wallet.balance >= 5000 ? 'VIP3' : row.wallet.balance >= 1000 ? 'VIP2' : '普通用户'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500">注册时间</span>
                                      <span className="font-mono text-gray-700">{row.user.createdAt.toLocaleDateString('zh-CN')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500">余额占比</span>
                                      <span className="font-medium text-gray-900">
                                        {stats.totalBalance > 0 ? ((row.wallet.balance / stats.totalBalance) * 100).toFixed(2) : 0}%
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                                      <span className="text-gray-500">余额健康度</span>
                                      <span className="font-semibold text-success">良好</span>
                                    </div>
                                    <ProgressBar
                                      value={Math.min(100, (row.wallet.balance / 5000) * 100)}
                                      variant="success"
                                      height={6}
                                    />
                                  </div>
                                </div>
                                <div className="flex-1 p-4 rounded-xl bg-white border border-gray-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-semibold text-gray-900">近7日余额变化趋势</div>
                                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                      <span>日均: ¥{(row.trendData.reduce((s, v) => s + v, 0) / 7).toFixed(0)}</span>
                                      <span className="text-success font-semibold">
                                        <TrendingUp className="w-3 h-3 inline mr-0.5" />
                                        +{(row.trendData[6] - row.trendData[0]).toFixed(0)}
                                      </span>
                                    </div>
                                  </div>
                                  <ReactECharts option={getTrendOption(row.trendData)} style={{ height: 180 }} />
                                </div>
                                <div className="w-72 shrink-0 p-4 rounded-xl bg-white border border-gray-100">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-primary" />
                                      资金流水时间线
                                    </div>
                                    <button
                                      onClick={() => setShowAllLedgers(showAllLedgers === row.user.id ? null : row.user.id)}
                                      className="text-[11px] text-primary hover:text-primary/80 font-medium"
                                    >
                                      {showAllLedgers === row.user.id ? '收起' : '查看全部'}
                                    </button>
                                  </div>
                                  <div className="relative">
                                    <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-100"></div>
                                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                                      {(showAllLedgers === row.user.id ? row.ledgers : row.ledgers.slice(0, 5)).map((ledger, i) => {
                                        const isIncome = ledger.type === 'recharge' || ledger.type === 'refund';
                                        const typeConfig = {
                                          recharge: { icon: Plus, color: 'text-success', bg: 'bg-green-500' },
                                          consume: { icon: TrendingUp, color: 'text-danger', bg: 'bg-red-500' },
                                          refund: { icon: Undo2, color: 'text-success', bg: 'bg-emerald-500' },
                                          freeze: { icon: Ban, color: 'text-warning', bg: 'bg-amber-500' },
                                        };
                                        const config = typeConfig[ledger.type];
                                        return (
                                          <div key={ledger.id} className="relative pl-5">
                                            <div className={cn(
                                              'absolute left-0 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white',
                                              config.bg
                                            )}></div>
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                  <span className="text-xs font-medium text-gray-900">{ledger.desc}</span>
                                                  <Badge variant={
                                                    ledger.status === 'success' ? 'success' :
                                                    ledger.status === 'failed' ? 'danger' : 'warning'
                                                  } className="!text-[9px] !py-0 !px-1.5">
                                                    {ledger.status === 'success' ? '成功' :
                                                     ledger.status === 'failed' ? '失败' : '处理中'}
                                                  </Badge>
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-mono">
                                                  {ledger.time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                              </div>
                                              <span className={cn('text-xs font-bold shrink-0', isIncome ? 'text-success' : 'text-danger')}>
                                                {isIncome ? '+' : '-'}¥{ledger.amount.toFixed(2)}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="text-lg font-semibold text-gray-700 mb-1">无匹配用户</div>
                      <div className="text-sm text-gray-500">尝试调整搜索条件或筛选范围</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
            <div className="text-xs text-gray-500">
              显示 <span className="font-semibold text-gray-700">{filteredRows.length}</span> / {balanceRows.length} 条
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                    p === 1 ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-600'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setActionAmount(''); setActionReason(''); setActionRemark(''); setActionOperator('财务管理员'); }}
        title={actionModal ? actionConfig[actionModal.type].title : ''}
        size="sm"
      >
        {actionModal && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <img
                  src={actionModal.row.user.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full bg-white border border-gray-200"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{actionModal.row.user.nickname}</div>
                  <div className="text-xs text-gray-500 font-mono">{actionModal.row.user.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">当前余额</div>
                  <div className="text-lg font-bold text-primary">¥{actionModal.row.wallet.balance.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className={cn('p-3 rounded-xl text-xs',
              actionModal.type === 'recharge' ? 'bg-green-50 text-green-700' :
              actionModal.type === 'refund' ? 'bg-orange-50 text-orange-700' :
              'bg-red-50 text-red-700'
            )}>
              💡 {actionConfig[actionModal.type].hint}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">金额 (CNY)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">¥</span>
                <input
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-lg font-semibold focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[50, 100, 200, 500, 1000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setActionAmount(v.toString())}
                    className="flex-1 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 font-medium transition-colors"
                  >
                    ¥{v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">操作原因</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={2}
                placeholder="请输入操作原因(选填)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">操作备注</label>
              <textarea
                value={actionRemark}
                onChange={(e) => setActionRemark(e.target.value)}
                rows={2}
                placeholder="请输入操作备注(选填)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">操作人</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={actionOperator}
                  onChange={(e) => setActionOperator(e.target.value)}
                  placeholder="请输入操作人姓名"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 !text-gray-700 !border-gray-300 hover:!bg-gray-100"
                onClick={() => { setActionModal(null); setActionAmount(''); setActionReason(''); setActionRemark(''); setActionOperator('财务管理员'); }}
              >
                取消
              </Button>
              <Button
                variant={actionConfig[actionModal.type].btnVariant}
                className="flex-1"
                onClick={handleActionConfirm}
              >
                确认{actionModal.type === 'recharge' ? '充值' : actionModal.type === 'refund' ? '退款' : '冻结'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
