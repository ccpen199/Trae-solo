import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  Minus,
  CircleHelp,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Tabs, TabList, Tab, TabPanel } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { generateMockFinanceLedgers, generateMockWallets, generateMockUsers } from '../../utils/mockData';
import type { FinanceLedger, UserWallet } from '../../types';

type LedgerTab = 'recharge' | 'consume' | 'refund';

const rechargeAmounts = [50, 100, 200, 500];

const typeLabels: Record<string, string> = {
  pay: '订单支付',
  refund: '退款到账',
  payout: '骑手结算',
  commission: '平台佣金',
  fee: '平台服务费',
};

const channelMeta: Record<string, { label: string; color: string }> = {
  wechat: { label: '微信支付', color: '#07C160' },
  alipay: { label: '支付宝', color: '#1677FF' },
  unionpay: { label: '银联', color: '#E60012' },
  balance: { label: '余额', color: '#1E40FF' },
};

const statusBadge: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }> = {
  success: { variant: 'success', label: '成功' },
  pending: { variant: 'warning', label: '处理中' },
  failed: { variant: 'danger', label: '失败' },
};

function WechatIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M9 4C4.6 4 1 6.9 1 10.5C1 12.5 2 14.3 3.7 15.5L3 18L5.8 16.8C6.8 17.1 7.9 17.2 9 17.2H9.4C9.1 16.4 9 15.6 9 14.7C9 10.8 12.6 7.7 17 7.7C17.3 7.7 17.7 7.7 18 7.8C16.8 5.7 14.2 4 9 4ZM6.5 9C5.7 9 5 8.3 5 7.5C5 6.7 5.7 6 6.5 6C7.3 6 8 6.7 8 7.5C8 8.3 7.3 9 6.5 9ZM11.5 9C10.7 9 10 8.3 10 7.5C10 6.7 10.7 6 11.5 6C12.3 6 13 6.7 13 7.5C13 8.3 12.3 9 11.5 9Z"
        fill="#07C160"
      />
      <path
        d="M23 14.7C23 11.7 20.1 9.3 16.5 9.3C12.9 9.3 10 11.7 10 14.7C10 17.7 12.9 20.1 16.5 20.1C17.4 20.1 18.3 20 19.1 19.7L21.5 20.5L21 18.5C22.2 17.5 23 16.2 23 14.7ZM14 13.9C13.4 13.9 13 13.5 13 12.9C13 12.3 13.4 11.9 14 11.9C14.6 11.9 15 12.3 15 12.9C15 13.5 14.6 13.9 14 13.9ZM19 13.9C18.4 13.9 18 13.5 18 12.9C18 12.3 18.4 11.9 19 11.9C19.6 11.9 20 12.3 20 12.9C20 13.5 19.6 13.9 19 13.9Z"
        fill="#07C160"
      />
    </svg>
  );
}

function AlipayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M19.5 3H4.5C3.7 3 3 3.7 3 4.5V19.5C3 20.3 3.7 21 4.5 21H19.5C20.3 21 21 20.3 21 19.5V4.5C21 3.7 20.3 3 19.5 3Z"
        fill="#1677FF"
      />
      <path
        d="M15.4 15.3C14.2 15.8 12.9 16 11.5 16C10.1 16 8.8 15.9 7.6 15.5L6.2 17.8H4.9L7.3 13.8C6.3 12.9 5.7 11.8 5.7 10.7C5.7 8.6 7.4 6.9 9.6 6.9C13 6.9 14.7 9.2 14.7 9.2L13.6 10C13.1 9.2 12.2 8.5 11 8.5C9.6 8.5 8.7 9.4 8.7 10.5C8.7 11.2 9 11.8 9.5 12.2H12.6C13.8 12.2 14.9 12.7 15.8 13.6C16.7 14.5 17.2 15.6 17.2 16.8C17.2 16.3 17.1 15.8 16.9 15.4L15.4 15.3Z"
        fill="#fff"
      />
    </svg>
  );
}

export default function WalletPage() {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<LedgerTab>('consume');
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [ledgers, setLedgers] = useState<FinanceLedger[]>([]);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'wechat' | 'alipay'>('wechat');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const users = generateMockUsers(10);
    const wallets = generateMockWallets(users);
    const mockLedgers = generateMockFinanceLedgers();
    mockLedgers.sort((a, b) => {
      const aT = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bT = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return bT - aT;
    });
    setWallet(wallets[0] || null);
    setLedgers(mockLedgers);
  }, []);

  const filteredLedgers = useMemo(() => {
    switch (activeTab) {
      case 'recharge':
        return ledgers.filter((l) => l.direction === 'credit' && l.type !== 'refund');
      case 'refund':
        return ledgers.filter((l) => l.type === 'refund');
      default:
        return ledgers.filter((l) => l.direction === 'debit');
    }
  }, [ledgers, activeTab]);

  const stats = useMemo(
    () => ({
      recharge: ledgers
        .filter((l) => l.direction === 'credit' && l.type !== 'refund' && l.status === 'success')
        .reduce((s, l) => s + l.amount, 0),
      consume: ledgers
        .filter((l) => l.direction === 'debit' && l.status === 'success')
        .reduce((s, l) => s + l.amount, 0),
      refund: ledgers
        .filter((l) => l.type === 'refund' && l.status === 'success')
        .reduce((s, l) => s + l.amount, 0),
    }),
    [ledgers]
  );

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount || 0;

  const handleRecharge = async () => {
    if (finalAmount <= 0) {
      addToast({ type: 'error', message: '请选择或输入充值金额' });
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);
    if (wallet) {
      setWallet({ ...wallet, balance: wallet.balance + finalAmount });
    }
    setRechargeModalOpen(false);
    setSelectedAmount(100);
    setCustomAmount('');
    addToast({ type: 'success', message: `成功充值 ¥${finalAmount.toFixed(2)}！`, duration: 3000 });
  };

  const formatDate = (d: Date | string) => {
    const date = d instanceof Date ? d : new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    if (days === 1) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const totalDisplay = useMemo(() => {
    const val = wallet?.balance || 0;
    const str = val.toFixed(2);
    const [intPart, decPart] = str.split('.');
    return { int: intPart, dec: decPart };
  }, [wallet]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-b from-dark via-dark to-dark/95 pb-8"
    >
      <div className="sticky top-0 z-30 bg-dark/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">我的钱包</h1>
          <button
            onClick={() =>
              addToast({ type: 'info', message: '钱包帮助中心即将开放', duration: 2000 })
            }
            className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
          >
            <CircleHelp size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl p-6 border border-white/10 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #1E40FF 0%, #6366F1 40%, #8B5CF6 75%, #A855F7 100%)',
          }}
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute top-4 right-4 opacity-40">
            <ShieldCheck size={24} className="text-white" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
              <Wallet size={16} />
              <span>账户余额</span>
            </div>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-white/90 text-2xl font-bold mb-2">¥</span>
              <span className="text-white text-6xl font-black tabular-nums leading-none tracking-tight">
                {totalDisplay.int}
              </span>
              <span className="text-white/80 text-2xl font-bold mb-1 tabular-nums">.{totalDisplay.dec}</span>
            </div>

            {wallet && wallet.frozen > 0 && (
              <div className="text-xs text-white/60 mb-5">
                冻结金额：<span className="text-white/90 font-semibold">¥{wallet.frozen.toFixed(2)}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="accent"
                size="lg"
                onClick={() => setRechargeModalOpen(true)}
                className="!rounded-xl !h-11 flex-1 shadow-xl shadow-accent/30"
              >
                <Plus size={18} className="mr-1.5" />
                充值
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => addToast({ type: 'info', message: '提现功能即将开放', duration: 2000 })}
                className="!rounded-xl !h-11 flex-1 !border-white/20 !text-white hover:!bg-white/10"
              >
                <Minus size={18} className="mr-1.5" />
                提现
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: '累计充值', val: stats.recharge, icon: <ArrowDownLeft size={16} />, tint: 'text-success' },
            { label: '累计消费', val: stats.consume, icon: <ArrowUpRight size={16} />, tint: 'text-danger' },
            { label: '累计退款', val: stats.refund, icon: <RefreshCw size={16} />, tint: 'text-primary' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/[0.07] transition-colors"
            >
              <div className={`mb-2 ${s.tint}`}>{s.icon}</div>
              <div className="text-lg font-bold text-white tabular-nums">¥{s.val.toFixed(0)}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LedgerTab)}>
            <div className="bg-dark/50 rounded-2xl p-1.5 border border-white/10">
              <TabList className="!bg-transparent !p-0 w-full">
                {([
                  { k: 'recharge', l: '充值' },
                  { k: 'consume', l: '消费' },
                  { k: 'refund', l: '退款' },
                ] as { k: LedgerTab; l: string }[]).map((t) => (
                  <Tab key={t.k} value={t.k} className="!flex-1 !px-3 !text-sm !rounded-xl">
                    {t.l}
                  </Tab>
                ))}
              </TabList>
            </div>

            {(['recharge', 'consume', 'refund'] as LedgerTab[]).map((tab) => (
              <TabPanel key={tab} value={tab}>
                <LedgerList
                  ledgers={filteredLedgers.filter((l) => {
                    if (tab === 'recharge') return l.direction === 'credit' && l.type !== 'refund';
                    if (tab === 'refund') return l.type === 'refund';
                    return l.direction === 'debit';
                  })}
                  formatDate={formatDate}
                />
              </TabPanel>
            ))}
          </Tabs>
        </motion.div>
      </div>

      <AnimatePresence>
        {rechargeModalOpen && (
          <Modal
            isOpen={rechargeModalOpen}
            onClose={() => !processing && setRechargeModalOpen(false)}
            title="账户充值"
            size="md"
          >
            <div className="space-y-6">
              <div
                className="rounded-2xl p-5 text-white text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1E40FF 0%, #6366F1 50%, #8B5CF6 100%)',
                }}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-accent/20 blur-2xl" />
                <div className="relative">
                  <div className="text-xs text-white/60 mb-1">充值金额</div>
                  <div className="flex items-end justify-center gap-0.5">
                    <span className="text-white/90 text-xl font-bold mb-1">¥</span>
                    <span className="text-5xl font-black tabular-nums leading-none">
                      {finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-800 mb-3">选择金额</div>
                <div className="grid grid-cols-4 gap-2.5">
                  {rechargeAmounts.map((amt) => {
                    const active = !customAmount && selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        onClick={() => {
                          setSelectedAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`relative h-14 rounded-xl border text-sm font-bold transition-all overflow-hidden ${
                          active
                            ? 'bg-gradient-to-br from-primary to-violet-500 text-white border-transparent shadow-lg shadow-primary/25'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        ¥{amt}
                        {amt >= 200 && (
                          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-accent text-white text-[9px] font-bold flex items-center gap-0.5">
                            <Sparkles size={8} />
                            送
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-800 mb-2">自定义金额</div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¥</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      if (e.target.value) setSelectedAmount(null);
                    }}
                    onFocus={() => setSelectedAmount(null)}
                    placeholder="输入任意金额"
                    min={0}
                    max={50000}
                    className="w-full h-12 pl-8 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-bold outline-none focus:border-primary/50 focus:bg-white transition-all text-base"
                  />
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-800 mb-3">支付方式</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['wechat', 'alipay'] as const).map((ch) => {
                    const active = selectedChannel === ch;
                    const meta = channelMeta[ch];
                    return (
                      <button
                        key={ch}
                        onClick={() => setSelectedChannel(ch)}
                        className={`flex items-center gap-3 px-4 h-14 rounded-xl border transition-all ${
                          active
                            ? 'bg-white border-2 shadow-md'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        style={active ? { borderColor: meta.color } : undefined}
                      >
                        {ch === 'wechat' ? <WechatIcon size={26} /> : <AlipayIcon size={26} />}
                        <span className="font-semibold text-gray-800 text-sm">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={processing}
                onClick={handleRecharge}
                className="!h-12 !rounded-xl !text-base shadow-lg shadow-primary/25"
              >
                {processing ? '支付处理中...' : `确认支付 ¥${finalAmount.toFixed(2)}`}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck size={14} className="text-gray-400" />
                <span>支付安全由银联保障 · 7×24小时客服</span>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface LedgerListProps {
  ledgers: FinanceLedger[];
  formatDate: (d: Date | string) => string;
}

function LedgerList({ ledgers, formatDate }: LedgerListProps) {
  if (ledgers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-16 text-center"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-white/5 flex items-center justify-center">
          <Clock size={32} className="text-white/20" />
        </div>
        <div className="text-white/60 text-sm">暂无流水记录</div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[11px] text-white/40 font-semibold border-b border-white/5 bg-white/[0.02]">
        <div className="col-span-4">日期 / 类型</div>
        <div className="col-span-3">来源</div>
        <div className="col-span-2 text-right">金额</div>
        <div className="col-span-3 text-right">状态</div>
      </div>

      <div className="divide-y divide-white/5">
        {ledgers.map((l, idx) => {
          const isDebit = l.direction === 'debit';
          const badge = statusBadge[l.status] || statusBadge.pending;
          const ChannelIcon = l.channel === 'wechat' ? WechatIcon : l.channel === 'alipay' ? AlipayIcon : null;
          return (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-white/[0.03] transition-colors cursor-pointer group"
            >
              <div className="col-span-4 min-w-0">
                <div className="text-sm text-white/90 font-medium truncate">
                  {typeLabels[l.type] || l.type}
                </div>
                <div className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1">
                  <Clock size={10} />
                  <span>{formatDate(l.createdAt)}</span>
                </div>
              </div>

              <div className="col-span-3 min-w-0">
                <div className="flex items-center gap-1.5">
                  {ChannelIcon && <ChannelIcon size={14} />}
                  <span className="text-xs text-white/60 truncate">
                    {channelMeta[l.channel]?.label || l.channel}
                  </span>
                </div>
                {l.orderId && (
                  <div className="text-[10px] text-white/30 mt-0.5 font-mono truncate">
                    #{l.orderId.slice(-6).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="col-span-2 text-right">
                <div
                  className={`text-sm font-bold tabular-nums ${
                    isDebit ? 'text-danger' : 'text-success'
                  }`}
                >
                  {isDebit ? '-' : '+'}¥{l.amount.toFixed(2)}
                </div>
              </div>

              <div className="col-span-3 flex items-center justify-end gap-1.5">
                <Badge variant={badge.variant}>{badge.label}</Badge>
                <ChevronRight
                  size={14}
                  className="text-white/15 group-hover:text-white/40 transition-colors"
                />
              </div>

              {l.status === 'success' && (
                <CheckCircle size={12} className="hidden" />
              )}
              {l.status === 'failed' && <XCircle size={12} className="hidden" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
