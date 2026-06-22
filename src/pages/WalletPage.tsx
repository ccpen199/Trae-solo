import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, getStatusLabel, getStatusClass, timeAgo, deviceFingerprint } from '@/utils';
import {
  Wallet, CreditCard, ArrowDownRight, ArrowUpRight, ShieldCheck,
  Clock, History, Lock, TrendingUp, PieChart, DollarSign, AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';

const earningData = Array.from({ length: 14 }, (_, i) => ({
  d: `第${i + 1}天`,
  收入: Math.round(80 + Math.random() * 420 + i * 20),
  支出: Math.round(40 + Math.random() * 180),
}));

const pieData = [
  { name: '服务费支出', value: 486, color: '#A855F7' },
  { name: '担保资金', value: 100.5, color: '#06B6D4' },
  { name: '可用余额', value: 1268.5, color: '#F59E0B' },
  { name: '累计收益', value: 0, color: '#10B981' },
];

export default function WalletPage() {
  const wallet = useAppStore(s => s.wallet);
  const transactions = useAppStore(s => s.transactions);
  const [tab, setTab] = useState<'all' | 'in' | 'out' | 'frozen'>('all');
  const [fp, setFp] = useState('');

  const filtered = transactions.filter(t => {
    if (tab === 'in') return t.amount > 0;
    if (tab === 'out') return t.amount < 0;
    return true;
  });

  return (
    <div className="pt-28 pb-24">
      <div className="container max-w-6xl">
        <div className="mb-10">
          <h1 className="section-title text-3xl md:text-4xl mb-2">
            <Wallet className="w-8 h-8 inline-block mr-3 text-gold-400"/>
            <span className="text-night-100">资金</span>
            <span className="text-gradient-gold"> 担保账户</span>
          </h1>
          <p className="text-night-400">禁止现金交易，所有资金经平台担保支付</p>
        </div>

        <div className="glass-card p-8 mb-6 relative overflow-hidden bg-gradient-to-br from-gold-500/10 via-night-800/60 to-esports-500/10">
          <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-gold-500/20 blur-[100px]" />
          <div className="absolute -bottom-24 left-20 w-72 h-72 rounded-full bg-esports-600/20 blur-[80px]" />
          <div className="relative grid lg:grid-cols-4 gap-6">
            {[
              { l: '可用余额', v: wallet.available, c: 'text-gradient-gold', icon: DollarSign, desc: '可提现 / 消费' },
              { l: '担保中', v: wallet.inEscrow, c: 'text-gradient-diamond', icon: ShieldCheck, desc: '订单履约中' },
              { l: '冻结金额', v: wallet.frozen, c: 'text-victory-red', icon: Lock, desc: '争议暂存' },
              { l: '累计资金流水', v: wallet.totalEarnings + 2568.3, c: 'text-gradient-esports', icon: TrendingUp, desc: '平台总流转' },
            ].map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl bg-night-900/40 border border-white/5 backdrop-blur relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-esports shadow-esports-glow flex items-center justify-center ${i === 0 ? '' : i === 1 ? '!bg-gradient-diamond' : i === 2 ? '!bg-gradient-to-r !from-victory-red !to-rose-500' : ''}`}>
                    <s.icon className="w-5 h-5 text-white"/>
                  </div>
                  <span className="text-[10px] text-night-500">{s.desc}</span>
                </div>
                <div className={`heading-display text-3xl data-number ${s.c}`}>{formatCurrency(s.v)}</div>
                <div className="text-sm text-night-400 mt-1">{s.l}</div>
              </motion.div>
            ))}
          </div>

          <div className="relative mt-8 flex flex-wrap gap-3">
            <button onClick={() => setFp(deviceFingerprint())} className="btn-primary px-8 py-3.5">
              <CreditCard className="w-4 h-4"/>
              充值到担保账户
            </button>
            <button className="btn-secondary px-8 py-3.5">
              <ArrowDownRight className="w-4 h-4"/>
              申请提现
            </button>
            <button className="btn-secondary px-8 py-3.5" disabled>
              <Lock className="w-4 h-4"/>
              提现记录
            </button>
            {fp && (
              <span className="ml-auto self-center badge-base bg-esports-500/15 text-esports-300 border border-esports-500/30">
                <ShieldCheck className="w-3 h-3"/>
                设备指纹: <code className="font-mono ml-1">{fp.slice(0, 14)}...</code>
              </span>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 glass-card p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3 className="font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-esports-400"/>
                近14天资金趋势
              </h3>
              <span className="text-xs text-night-500">单位: CNY</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={earningData}>
                  <defs>
                    <linearGradient id="ge1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4}/><stop offset="100%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ge2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3}/><stop offset="100%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="d" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false}/>
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false}/>
                  <Tooltip contentStyle={{ background: '#1F1F2E', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12 }}/>
                  <Area type="monotone" dataKey="收入" stroke="#F59E0B" strokeWidth={2.5} fill="url(#ge1)"/>
                  <Area type="monotone" dataKey="支出" stroke="#EF4444" strokeWidth={2} fill="url(#ge2)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-diamond-400"/>
              资金构成
            </h3>
            <div className="h-56">
              <ResponsiveContainer>
                <RePieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }}/>
                  <Tooltip contentStyle={{ background: '#1F1F2E', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12 }} formatter={v => formatCurrency(v as number)}/>
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 mt-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h3 className="font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-gold-400"/>
              资金流水
            </h3>
            <div className="flex gap-1 p-1 rounded-xl bg-night-800/50 border border-white/5">
              {[
                { k: 'all', l: '全部' }, { k: 'in', l: '收入' }, { k: 'out', l: '支出' },
              ].map(t => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k as typeof tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tab === t.k ? 'bg-gradient-esports text-white shadow-esports-glow' : 'text-night-400 hover:text-night-200'
                  }`}
                >{t.l}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs text-night-400">
                  <th className="p-4 font-medium">流水号</th>
                  <th className="p-4 font-medium">类型</th>
                  <th className="p-4 font-medium">关联订单</th>
                  <th className="p-4 font-medium">金额</th>
                  <th className="p-4 font-medium">时间</th>
                  <th className="p-4 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-night-400">{t.id}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 ${t.amount > 0 ? 'text-victory-green' : 'text-night-200'}`}>
                        {t.amount > 0 ? <ArrowDownRight className="w-4 h-4"/> : <ArrowUpRight className="w-4 h-4"/>}
                        {{ Deposit: '账户充值', Payment: '订单支付', Settlement: '结算收款', Refund: '争议退款', Withdraw: '提现申请', DisputeCompensation: '仲裁赔付' }[t.type] || t.type}
                      </span>
                    </td>
                    <td className="p-4 text-night-300 data-number">
                      {t.orderId ? <a href="#" className="text-esports-400 hover:underline">#{t.orderId}</a> : '-'}
                    </td>
                    <td className={`p-4 heading-display text-lg data-number font-bold ${t.amount > 0 ? 'text-victory-green' : 'text-night-100'}`}>
                      {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}
                    </td>
                    <td className="p-4 text-xs text-night-400 font-mono">{t.createdAt}</td>
                    <td className="p-4">
                      <span className={`badge-base ${
                        t.status === 'Completed' ? 'status-success' : t.status === 'Failed' ? 'status-dispute' : 'status-pending'
                      }`}>
                        {t.status === 'Completed' ? '已完成' : t.status === 'Failed' ? '失败' : '处理中'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6 mt-6 bg-gradient-to-r from-esports-500/10 to-diamond-500/10 border-esports-400/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-esports flex items-center justify-center shrink-0 shadow-esports-glow">
              <AlertTriangle className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h4 className="font-bold text-base mb-1">资金安全保障说明</h4>
              <ul className="text-sm text-night-300 space-y-1.5 leading-relaxed">
                <li>· 所有交易资金由<span className="text-esports-300">持牌第三方支付机构</span>担保托管，平台无法擅自挪用</li>
                <li>· 定金在验收确认前100%锁定，服务商无法提前结算</li>
                <li>· 提现采用T+1人工复核，大额交易触发反洗钱二次审核</li>
                <li>· 每笔资金流转均生成SHA256哈希存证，支持全程审计追溯</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
