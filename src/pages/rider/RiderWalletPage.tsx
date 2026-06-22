import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Wallet,
  Banknote,
  History,
  ChevronRight,
  Check,
  X,
  CreditCard,
  Smartphone,
  Landmark,
  Clock,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Search,
} from 'lucide-react';

import { useAppStore } from '@/stores/appStore';
import { generateMockFinanceLedgers, generateMockOrders } from '../../utils/mockData';
import { formatCurrency, formatDateTime, cn } from '../../utils';
import { Tabs, TabList, Tab, TabPanel } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { FinanceLedger } from '../../types';

type LedgerTab = 'available' | 'pending' | 'withdrawn';
type WithdrawMethod = 'wechat' | 'alipay' | 'bankcard';

const METHOD_META: Record<WithdrawMethod, { label: string; icon: React.ReactNode; tint: string; sub: string }> = {
  wechat: {
    label: '微信钱包',
    sub: '实时到账',
    icon: <Smartphone size={20} />,
    tint: 'from-green-500 to-emerald-500',
  },
  alipay: {
    label: '支付宝',
    sub: '实时到账',
    icon: <CreditCard size={20} />,
    tint: 'from-sky-500 to-blue-500',
  },
  bankcard: {
    label: '银行卡',
    sub: 'T+1到账',
    icon: <Landmark size={20} />,
    tint: 'from-violet-500 to-indigo-500',
  },
};

const STATUS_BADGE: Record<FinanceLedger['status'], { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
  success: { variant: 'success', label: '已完成' },
  pending: { variant: 'warning', label: '处理中' },
  failed: { variant: 'danger', label: '失败' },
};

function generateWithdrawRecords(base: FinanceLedger[]): FinanceLedger[] {
  return base.map((l, idx) => ({
    ...l,
    type: 'payout',
    direction: 'credit',
    amount: Math.round((20 + idx * 7.5) * 100) / 100,
    status: ['success', 'success', 'pending', 'success', 'failed', 'success'][idx % 6] as FinanceLedger['status'],
  }));
}

export default function RiderWalletPage() {
  const addToast = useAppStore((s) => s.addToast);

  const baseLedgers = useMemo(() => generateMockFinanceLedgers(generateMockOrders(10, [])), []);
  const allLedgers = useMemo(() => {
    const base = baseLedgers.map((l, idx) => ({
      ...l,
      id: l.id,
      orderId: `ord_${(1000 + idx).toString(36)}`,
      type: (['commission', 'commission', 'fee', 'refund'] as const)[idx % 4] as FinanceLedger['type'],
    }));
    return base;
  }, [baseLedgers]);

  const walletData = useMemo(() => ({
    available: 1286.58,
    pending: 842.3,
    withdrawn: 15820.45,
  }), []);

  const [ledgerTab, setLedgerTab] = useState<LedgerTab>('available');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>('wechat');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLedgers = useMemo(() => {
    let list: FinanceLedger[] = [];
    switch (ledgerTab) {
      case 'available':
        list = allLedgers.filter((l) => l.status === 'success' && l.type !== 'payout');
        break;
      case 'pending':
        list = allLedgers.filter((l) => l.status === 'pending');
        break;
      case 'withdrawn':
        list = generateWithdrawRecords(baseLedgers);
        break;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((l) => l.orderId?.toLowerCase().includes(q) || l.id.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allLedgers, baseLedgers, ledgerTab, searchQuery]);



  const handleCopyBalance = () => {
    navigator.clipboard?.writeText(walletData.available.toFixed(2));
    addToast({ type: 'success', message: '金额已复制', duration: 1500 });
  };

  const handleFillAll = () => {
    setWithdrawAmount(walletData.available.toFixed(2));
  };

  const handleConfirmWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast({ type: 'error', message: '请输入有效的提现金额', duration: 2000 });
      return;
    }
    if (amt > walletData.available) {
      addToast({ type: 'error', message: '提现金额不能超过可提现余额', duration: 2000 });
      return;
    }
    addToast({
      type: 'success',
      message: `已申请提现 ${formatCurrency(amt)} 至 ${METHOD_META[withdrawMethod].label}`,
      duration: 3000,
    });
    setWithdrawModalOpen(false);
    setWithdrawAmount('');
  };

  const renderBigCard = () => (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-indigo-600 via-primary to-violet-700 border border-white/15 shadow-2xl">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-accent/15 blur-3xl" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12) 0, transparent 45%)',
        }}
      />

      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <div className="text-xs text-white/75">骑手钱包</div>
            <div className="text-[11px] text-white/50 flex items-center gap-1">
              <Sparkles size={10} />
              招商银行(尾号8821)
            </div>
          </div>
        </div>
        <button
          onClick={() => setBalanceHidden((h) => !h)}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
        >
          {balanceHidden ? <EyeOff size={16} className="text-white/80" /> : <Eye size={16} className="text-white/80" />}
        </button>
      </div>

      <div className="relative grid grid-cols-3 gap-3 mb-4">
        <div className="col-span-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-white/65">可提现金额</span>
            <Badge variant="default" className="bg-white/15 text-white/90 text-[9px] py-0 px-1.5 border border-white/20">
              T+0到账
            </Badge>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm text-white/70">¥</span>
            <button
              onClick={handleCopyBalance}
              className="text-4xl font-black tabular-nums text-white tracking-tight hover:text-white/90 transition-colors"
            >
              {balanceHidden ? '******' : walletData.available.toFixed(2)}
            </button>
            {!balanceHidden && (
              <Copy size={14} className="text-white/40 hover:text-white/70 transition-colors mb-2" />
            )}
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-3">
          <div className="flex items-center gap-1.5 mb-1.5 text-white/65">
            <Clock size={12} />
            <span className="text-[11px]">待结算金额</span>
          </div>
          <div className="text-lg font-bold tabular-nums text-white">
            {balanceHidden ? '****' : formatCurrency(walletData.pending)}
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-3">
          <div className="flex items-center gap-1.5 mb-1.5 text-white/65">
            <Banknote size={12} />
            <span className="text-[11px]">已提现累计</span>
          </div>
          <div className="text-lg font-bold tabular-nums text-white">
            {balanceHidden ? '****' : formatCurrency(walletData.withdrawn)}
          </div>
        </div>
      </div>

      <div className="relative mt-4 rounded-xl bg-white/8 backdrop-blur border border-white/10 px-3 py-2.5 flex items-start gap-2">
        <AlertCircle size={14} className="text-yellow-300 shrink-0 mt-0.5" />
        <div className="text-[11px] text-white/75 leading-relaxed">
          提现申请提交后，微信/支付宝实时到账，银行卡T+1工作日到账。每日最高限额 ¥20,000。
        </div>
      </div>
    </div>
  );

  const renderActions = () => (
    <div className="grid grid-cols-[1.4fr_1fr] gap-2.5">
      <Button
        variant="accent"
        size="lg"
        fullWidth
        onClick={() => setWithdrawModalOpen(true)}
      >
        <Banknote size={18} />
        立即提现
      </Button>
      <Button
        variant="outline"
        size="lg"
        fullWidth
        onClick={() => {
          setLedgerTab('withdrawn');
          addToast({ type: 'info', message: '已切换到提现记录', duration: 1500 });
        }}
      >
        <History size={18} />
        提现记录
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      <div className="px-4 pt-4 pb-3 space-y-4 shrink-0">
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold flex-1">我的钱包</h1>
          <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors shrink-0">
            <Filter size={16} className="text-white/70" />
          </button>
        </div>

        {renderBigCard()}
        {renderActions()}
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4">
        <Tabs value={ledgerTab} onValueChange={(v) => setLedgerTab(v as LedgerTab)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-accent" />
              <h2 className="text-base font-bold">资金流水</h2>
              <span className="text-[11px] text-white/35">共 {filteredLedgers.length} 条</span>
            </div>
          </div>
          <TabList className="w-full bg-white/[0.04]">
            <Tab value="available" className="flex-1 text-xs py-1.5">
              可提现
            </Tab>
            <Tab value="pending" className="flex-1 text-xs py-1.5">
              待结算
            </Tab>
            <Tab value="withdrawn" className="flex-1 text-xs py-1.5">
              已提现
            </Tab>
          </TabList>

          <div className="relative mt-3 mb-2 shrink-0">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索订单号 / 流水号"
              className="w-full h-10 rounded-xl bg-white/[0.03] border border-white/10 pl-9 pr-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
            />
          </div>

          <TabPanel value={ledgerTab} className="mt-2 flex-1 min-h-0">
            <div className="h-full overflow-y-auto -mx-4 px-4 pb-2 space-y-2">
              {filteredLedgers.length === 0 ? (
                <EmptyLedgerState tab={ledgerTab} />
              ) : (
                filteredLedgers.map((ledger) => (
                  <LedgerItem key={ledger.id} ledger={ledger} tab={ledgerTab} />
                ))
              )}
            </div>
          </TabPanel>
        </Tabs>
      </div>

      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        size="md"
        title="申请提现"
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-violet-500/10 border border-primary/20 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/55">可提现余额</span>
              <button
                onClick={handleFillAll}
                className="text-[11px] text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                全部提现
              </button>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-white/50">¥</span>
              <span className="text-3xl font-black tabular-nums text-white">
                {walletData.available.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-2">提现金额</label>
            <div className="relative rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-primary/40 transition-all overflow-hidden">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-white/60">¥</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full h-14 bg-transparent pl-10 pr-4 text-2xl font-bold tabular-nums text-white placeholder:text-white/15 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-2.5">收款方式</label>
            <div className="space-y-2">
              {(Object.keys(METHOD_META) as WithdrawMethod[]).map((key) => {
                const meta = METHOD_META[key];
                const selected = withdrawMethod === key;
                return (
                  <button
                    key={key}
                    onClick={() => setWithdrawMethod(key)}
                    className={cn(
                      'w-full rounded-2xl border p-3.5 flex items-center gap-3.5 transition-all',
                      selected
                        ? 'border-primary/50 bg-primary/10 shadow-lg shadow-primary/10'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15',
                    )}
                  >
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg shrink-0',
                        meta.tint,
                      )}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-semibold text-white">{meta.label}</div>
                      <div className="text-[11px] text-white/45">{meta.sub}</div>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        selected ? 'border-primary bg-primary' : 'border-white/20',
                      )}
                    >
                      {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-accent/8 border border-accent/15 p-3 flex items-start gap-2.5">
            <Clock size={15} className="text-accent shrink-0 mt-0.5" />
            <div className="text-[11px] text-white/70 leading-relaxed">
              <div className="font-semibold text-accent mb-0.5">预计到账时间</div>
              {withdrawMethod === 'bankcard'
                ? '提交后 1 个工作日内到账，节假日顺延。'
                : '提交后立即处理，通常 2 小时内到账。'}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => setWithdrawModalOpen(false)}
            >
              <X size={18} />
              取消
            </Button>
            <Button variant="accent" size="lg" fullWidth onClick={handleConfirmWithdraw}>
              <TrendingUp size={18} />
              确认提现
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function LedgerItem({ ledger, tab }: { ledger: FinanceLedger; tab: LedgerTab }) {
  const isIncome = ledger.direction === 'credit';
  const statusMeta = STATUS_BADGE[ledger.status];

  const typeLabelMap: Record<string, { label: string; tint: string; iconBg: string }> = {
    commission: { label: '配送佣金', tint: 'text-success', iconBg: 'bg-success/15' },
    payout: { label: '提现', tint: 'text-accent', iconBg: 'bg-accent/15' },
    refund: { label: '退款', tint: 'text-violet-400', iconBg: 'bg-violet-500/15' },
    fee: { label: '平台费用', tint: 'text-danger', iconBg: 'bg-danger/15' },
    pay: { label: '用户支付', tint: 'text-primary', iconBg: 'bg-primary/15' },
  };
  const typeMeta = typeLabelMap[ledger.type] || typeLabelMap.commission;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group rounded-2xl bg-white/[0.03] border border-white/8 p-3.5 hover:bg-white/[0.05] hover:border-white/15 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3.5">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', typeMeta.iconBg)}>
          <Wallet size={18} className={typeMeta.tint} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-white truncate">{typeMeta.label}</span>
              {tab !== 'available' && (
                <Badge variant={statusMeta.variant} className="py-0 px-1.5 text-[9px]">
                  {statusMeta.label}
                </Badge>
              )}
            </div>
            <div
              className={cn(
                'text-base font-bold tabular-nums shrink-0',
                isIncome ? 'text-success' : 'text-danger',
              )}
            >
              {isIncome ? '+' : '-'}{formatCurrency(ledger.amount)}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-white/40 truncate">
              {ledger.orderId ? `订单 ${ledger.orderId.slice(0, 12)}...` : `流水 ${ledger.id.slice(0, 12)}...`}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-white/35 tabular-nums">
                {formatDateTime(ledger.createdAt)}
              </span>
              <ChevronRight size={12} className="text-white/15 group-hover:text-white/40 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyLedgerState({ tab }: { tab: LedgerTab }) {
  const meta: Record<LedgerTab, { label: string; hint: string }> = {
    available: { label: '暂无可提现记录', hint: '完成配送后的收入会在此显示' },
    pending: { label: '暂无待结算记录', hint: '结算周期内的订单收入会在此显示' },
    withdrawn: { label: '暂无提现记录', hint: '提交的提现申请会在此显示进度' },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-white/30"
      >
        <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
          <History size={30} className="opacity-50" />
        </div>
        <p className="text-sm mb-1">{meta[tab].label}</p>
        <p className="text-xs text-white/20">{meta[tab].hint}</p>
      </motion.div>
    </AnimatePresence>
  );
}
