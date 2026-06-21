import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { investorApi } from '@/lib/api.ts';
import { formatMoney, formatDateTime } from '@/utils/format.ts';
import { Coins, Wallet, Building2, FileDown, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { RevenueRecord, InvestorAccount } from '../../../shared/types.js';

export default function InvestorRevenue() {
  const [profile, setProfile] = useState<InvestorAccount | null>(null);
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [periods, setPeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, r] = await Promise.all([investorApi.profile(), investorApi.revenue()]);
        setProfile(p);
        setRecords(r);
        const uniquePeriods = Array.from(new Set(r.map((x) => x.period))).sort().reverse();
        setPeriods(uniquePeriods);
        if (uniquePeriods.length > 0) setPeriodFilter(uniquePeriods[0]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredRecords = periodFilter ? records.filter((r) => r.period === periodFilter) : records;
  const unsettledRecords = filteredRecords.filter((r) => !r.settled);

  const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.totalRevenue, 0);
  const totalInvestorShare = filteredRecords.reduce((sum, r) => sum + r.investorShare, 0);
  const totalPlatformShare = filteredRecords.reduce((sum, r) => sum + r.platformShare, 0);
  const totalSettled = filteredRecords.filter((r) => r.settled).reduce((sum, r) => sum + r.investorShare, 0);
  const totalUnsettled = unsettledRecords.reduce((sum, r) => sum + r.investorShare, 0);

  const pieData = [
    { name: '投资商收益', value: Number(totalInvestorShare.toFixed(2)), color: '#3364C6' },
    { name: '平台分成', value: Number(totalPlatformShare.toFixed(2)), color: '#00B4D8' },
  ];

  const handleSettle = async () => {
    if (!periodFilter || unsettledRecords.length === 0) return;
    setSettling(true);
    try {
      const result = await investorApi.settleRevenue(periodFilter);
      setRecords((prev) => prev.map((r) => {
        const updated = result.find((x) => x.id === r.id);
        return updated || r;
      }));
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return <AppLayout role="investor"><div className="flex items-center justify-center h-64"><div className="animate-pulse text-deep-blue-700">加载中...</div></div></AppLayout>;
  }

  return (
    <AppLayout role="investor">
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-graphite-800">收益结算</h2>
            <p className="text-sm text-graphite-500 mt-1">自动计算收益分成，支持按期对账结算</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-vibrant-orange-300/20 to-transparent" />
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-vibrant-orange-500 to-vibrant-orange-600 text-white flex items-center justify-center shadow-glow-orange mb-3">
              <Coins size={22} />
            </div>
            <p className="text-sm text-graphite-500 mb-1">累计总收益</p>
            <p className="text-2xl font-display font-bold text-gradient-orange bg-gradient-to-r from-vibrant-orange-500 to-vibrant-orange-600 bg-clip-text text-transparent">{formatMoney(profile?.totalRevenue || 0)}</p>
          </div>
          <div className="glass-card p-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center mb-3">
              <Wallet size={22} />
            </div>
            <p className="text-sm text-graphite-500 mb-1">可提现余额</p>
            <p className="text-2xl font-display font-bold text-green-600">{formatMoney(profile?.availableBalance || 0)}</p>
          </div>
          <div className="glass-card p-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-deep-blue-500 to-deep-blue-700 text-white flex items-center justify-center mb-3">
              <Building2 size={22} />
            </div>
            <p className="text-sm text-graphite-500 mb-1">分成比例</p>
            <p className="text-2xl font-display font-bold text-deep-blue-800">{(profile?.shareRatio || 0) * 100}%</p>
          </div>
          <div className="glass-card p-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aqua-500 to-aqua-700 text-white flex items-center justify-center mb-3">
              <TrendingUp size={22} />
            </div>
            <p className="text-sm text-graphite-500 mb-1">待结算金额</p>
            <p className="text-2xl font-display font-bold text-aqua-600">{formatMoney(totalUnsettled)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-graphite-800 flex items-center gap-2"><Calendar size={18} className="text-deep-blue-600" />收益周期</h3>
              <div className="flex gap-2">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriodFilter(p)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      periodFilter === p ? 'bg-gradient-to-r from-deep-blue-700 to-aqua-500 text-white shadow-md' : 'bg-graphite-100 text-graphite-600 hover:bg-graphite-200'
                    }`}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {filteredRecords.length === 0 ? (
                <div className="p-8 text-center text-graphite-500">暂无收益记录</div>
              ) : (
                filteredRecords.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl bg-gradient-to-r from-graphite-50 to-white border border-graphite-100 hover:shadow-md hover:border-aqua-200 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-graphite-800">{r.deviceName || '设备收益'}</h4>
                        <p className="text-xs text-graphite-500">收益周期：{r.period}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${r.settled ? 'bg-green-100 text-green-700' : 'bg-aqua-100 text-aqua-700'}`}>
                        {r.settled ? <><CheckCircle2 size={12} />已结算</> : '待结算'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-graphite-100">
                      <div>
                        <p className="text-xs text-graphite-500">总营收</p>
                        <p className="text-lg font-bold text-graphite-800">{formatMoney(r.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-graphite-500">我的收益 (70%)</p>
                        <p className="text-lg font-bold text-deep-blue-700">{formatMoney(r.investorShare)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-graphite-500">平台分成 (30%)</p>
                        <p className="text-lg font-bold text-graphite-500">{formatMoney(r.platformShare)}</p>
                      </div>
                    </div>
                    {r.settledAt && <p className="text-xs text-graphite-400 mt-3">结算时间：{formatDateTime(r.settledAt)}</p>}
                  </div>
                ))
              )}
            </div>
            {unsettledRecords.length > 0 && (
              <button
                onClick={handleSettle}
                disabled={settling}
                className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-deep-blue-700 to-aqua-500 text-white font-semibold shadow-lg hover:shadow-glow-aqua hover:-translate-y-0.5 transition-all disabled:opacity-60"
              >
                {settling ? '结算中...' : `一键结算 ${periodFilter} 期 (${formatMoney(totalUnsettled)})`}
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-graphite-800 mb-4 flex items-center gap-2"><Coins size={18} className="text-vibrant-orange-500" />收益分成分布</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatMoney(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-graphite-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-graphite-800">{formatMoney(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 bg-gradient-to-br from-deep-blue-50 to-white">
              <h3 className="font-semibold text-graphite-800 mb-3 flex items-center gap-2"><FileDown size={18} className="text-deep-blue-600" />导出对账</h3>
              <p className="text-sm text-graphite-500 mb-4">支持导出当期所有设备收益明细，用于财务对账</p>
              <button
                onClick={() => {
                  const rows = filteredRecords.map((r) => ({
                    '收益周期': r.period,
                    '设备名称': r.deviceName || '',
                    '设备ID': r.deviceId,
                    '总营收(元)': r.totalRevenue.toFixed(2),
                    '投资商收益(元)': r.investorShare.toFixed(2),
                    '平台分成(元)': r.platformShare.toFixed(2),
                    '状态': r.settled ? '已结算' : '待结算',
                    '结算时间': r.settledAt ? formatDateTime(r.settledAt) : '',
                  }));
                  import('@/utils/format').then(({ exportToCSV }) => {
                    exportToCSV(rows, `收益对账单_${periodFilter || '全部'}.csv`);
                  });
                }}
                className="w-full py-3 rounded-xl bg-white border-2 border-deep-blue-200 text-deep-blue-700 font-semibold hover:bg-deep-blue-50 hover:border-deep-blue-300 transition-all flex items-center justify-center gap-2"
              >
                <FileDown size={18} />导出CSV对账文件
              </button>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-semibold text-graphite-800 mb-3">结算统计</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-graphite-100">
                  <span className="text-graphite-600">本期总营收</span>
                  <span className="font-bold text-graphite-800">{formatMoney(totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-graphite-100">
                  <span className="text-graphite-600">已结算</span>
                  <span className="font-bold text-green-600">{formatMoney(totalSettled)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-graphite-600">待结算</span>
                  <span className="font-bold text-aqua-600">{formatMoney(totalUnsettled)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
