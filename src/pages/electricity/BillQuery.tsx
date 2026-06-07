import { useEffect, useState } from 'react';
import { Zap, Search, ChevronUp, ChevronDown, Clock, TrendingUp, Sun, Moon, Sunrise, Info } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Bill {
  id: string;
  period: string;
  amount: number;
  usage: number;
  peakUsage: number;
  valleyUsage: number;
  flatUsage: number;
  status: 'paid' | 'unpaid' | 'overdue';
  dueDate: string;
  paidAt?: string;
}

interface Tariff {
  periodType: string;
  periodName: string;
  pricePerKwh: number;
  hours: string;
}

interface PriceTariffData {
  currentPeriod: string;
  currentPeriodName: string;
  currentPrice: number;
  tariffs: Tariff[];
  now: string;
}

type SortField = 'period' | 'amount' | 'usage' | 'status';
type SortDir = 'asc' | 'desc';

const mockBills: Bill[] = [
  { id: '1', period: '2026-05', amount: 856.3, usage: 1230, peakUsage: 420, valleyUsage: 310, flatUsage: 500, status: 'unpaid', dueDate: '2026-06-15' },
  { id: '2', period: '2026-04', amount: 792.1, usage: 1150, peakUsage: 380, valleyUsage: 290, flatUsage: 480, status: 'paid', dueDate: '2026-05-15', paidAt: '2026-05-10' },
  { id: '3', period: '2026-03', amount: 910.5, usage: 1320, peakUsage: 450, valleyUsage: 350, flatUsage: 520, status: 'paid', dueDate: '2026-04-15', paidAt: '2026-04-08' },
  { id: '4', period: '2026-02', amount: 680.2, usage: 980, peakUsage: 320, valleyUsage: 260, flatUsage: 400, status: 'paid', dueDate: '2026-03-15', paidAt: '2026-03-12' },
  { id: '5', period: '2026-01', amount: 950.0, usage: 1380, peakUsage: 480, valleyUsage: 360, flatUsage: 540, status: 'paid', dueDate: '2026-02-15', paidAt: '2026-02-10' },
  { id: '6', period: '2025-12', amount: 1020.5, usage: 1480, peakUsage: 520, valleyUsage: 380, flatUsage: 580, status: 'paid', dueDate: '2026-01-15', paidAt: '2026-01-08' },
];

const mockTariffs: PriceTariffData = {
  currentPeriod: 'peak',
  currentPeriodName: '峰时',
  currentPrice: 0.84,
  tariffs: [
    { periodType: 'peak', periodName: '峰时', pricePerKwh: 0.84, hours: '07:00-10:00, 15:00-21:00' },
    { periodType: 'flat', periodName: '平时', pricePerKwh: 0.62, hours: '10:00-15:00, 21:00-23:00' },
    { periodType: 'valley', periodName: '谷时', pricePerKwh: 0.35, hours: '23:00-07:00' },
  ],
  now: dayjs().format('YYYY-MM-DD HH:mm:ss')
};

function normalizeBill(row: any): Bill {
  return {
    id: String(row.id),
    period: String(row.period ?? row.billingPeriod ?? ''),
    amount: Number(row.amount ?? row.totalAmount ?? 0),
    usage: Number(row.usage ?? row.totalKwh ?? 0),
    peakUsage: Number(row.peakUsage ?? row.peakKwh ?? 0),
    valleyUsage: Number(row.valleyUsage ?? row.valleyKwh ?? 0),
    flatUsage: Number(row.flatUsage ?? row.flatKwh ?? 0),
    status: row.status || 'unpaid',
    dueDate: String(row.dueDate ?? row.due_date ?? ''),
    paidAt: row.paidAt ?? row.paid_at,
  };
}

function normalizeTariff(row: any): Tariff {
  return {
    periodType: String(row.periodType || row.period_type || ''),
    periodName: String(row.periodName || row.period_name || ''),
    pricePerKwh: Number(row.pricePerKwh || row.price_per_kwh || 0),
    hours: String(row.hours || ''),
  };
}

export default function BillQuery() {
  const { user } = useAuthStore();
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('period');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [tariffData, setTariffData] = useState<PriceTariffData>(mockTariffs);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Bill[]>('/electricity/bills');
        setBills(Array.isArray(res) ? res.map(normalizeBill) : mockBills);
        
        const tariffRes = await api.get<PriceTariffData>('/electricity/price-tariff');
        if (tariffRes && tariffRes.tariffs) {
          setTariffData({
            currentPeriod: tariffRes.currentPeriod,
            currentPeriodName: tariffRes.currentPeriodName,
            currentPrice: tariffRes.currentPrice,
            tariffs: tariffRes.tariffs.map(normalizeTariff),
            now: tariffRes.now,
          });
        }
      } catch {
        setBills(mockBills);
        setTariffData(mockTariffs);
      } finally {
        setLoading(false);
      }
    };
    load();

    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filtered = bills
    .filter((b) => {
      if (periodFilter && !String(b.period).includes(periodFilter)) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'period') return a.period.localeCompare(b.period) * dir;
      if (sortField === 'amount') return (a.amount - b.amount) * dir;
      if (sortField === 'usage') return (a.usage - b.usage) * dir;
      if (sortField === 'status') return a.status.localeCompare(b.status) * dir;
      return 0;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={14} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const statusLabel = (s: string) => (s === 'paid' ? '已缴' : s === 'overdue' ? '逾期' : '待缴');
  const statusBadge = (s: string) => (s === 'paid' ? 'badge-green' : s === 'overdue' ? 'badge-red' : 'badge-amber');

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case 'peak': return <Sun size={18} className="text-orange-500" />;
      case 'valley': return <Moon size={18} className="text-blue-500" />;
      default: return <Sunrise size={18} className="text-amber-500" />;
    }
  };

  const getPeriodBg = (period: string) => {
    switch (period) {
      case 'peak': return 'from-orange-500/10 to-orange-500/5 border-orange-200 dark:border-orange-800';
      case 'valley': return 'from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-800';
      default: return 'from-amber-500/10 to-amber-500/5 border-amber-200 dark:border-amber-800';
    }
  };

  const getPeriodTextColor = (period: string) => {
    switch (period) {
      case 'peak': return 'text-orange-600 dark:text-orange-400';
      case 'valley': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-amber-600 dark:text-amber-400';
    }
  };

  const currentPeriod = tariffData.currentPeriod;
  const avgPrice = tariffData.tariffs.length > 0 
    ? (tariffData.tariffs.reduce((sum, t) => sum + t.pricePerKwh, 0) / tariffData.tariffs.length).toFixed(2)
    : '0.60';

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <Zap size={28} className="text-csg-amber" />
        <div>
          <h1 className="page-title">电费查询</h1>
          <p className="page-desc">查询历史电费账单明细，了解峰谷平电价标准</p>
        </div>
      </div>

      <div className={`card p-5 bg-gradient-to-r ${getPeriodBg(currentPeriod)} border`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg ${getPeriodTextColor(currentPeriod)}`}>
              {getPeriodIcon(currentPeriod)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">当前时段</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPeriodTextColor(currentPeriod)} bg-white/80 dark:bg-gray-700/80`}>
                  {tariffData.currentPeriodName}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                ¥{tariffData.currentPrice.toFixed(2)} <span className="text-lg font-normal text-gray-500">/ kWh</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <Clock size={14} />
                <span>{currentTime.format('YYYY-MM-DD HH:mm')}</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>执行标准：{tariffData.tariffs.find(t => t.periodType === currentPeriod)?.hours}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-sm text-gray-500 dark:text-gray-400">平均电价</div>
            <div className="text-2xl font-bold text-csg-navy">¥{avgPrice} / kWh</div>
            <div className="text-xs text-gray-400 mt-1">峰谷平综合平均</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tariffData.tariffs.map((t) => (
          <div key={t.periodType} className={`card p-4 bg-gradient-to-br ${getPeriodBg(t.periodType)} border`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow ${getPeriodTextColor(t.periodType)}`}>
                {getPeriodIcon(t.periodType)}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{t.periodName}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">¥{t.pricePerKwh.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock size={12} />
              {t.hours}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 bg-gradient-to-r from-csg-green/5 to-csg-green/10 border border-csg-green/20">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-csg-green mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gray-900 dark:text-white mb-1">节能建议：</p>
            <p className="text-gray-600 dark:text-gray-300">
              当前处于{tariffData.currentPeriodName}时段，电价{tariffData.currentPrice.toFixed(2)}元/度。
              {currentPeriod === 'peak' && ' 建议尽量减少大功率电器使用，将洗衣机、热水器等设备移至谷时（23:00-07:00）使用，可节省约58%电费。'}
              {currentPeriod === 'valley' && ' 此时段电价最低，是使用大功率电器的最佳时机！'}
              {currentPeriod === 'flat' && ' 建议关注峰谷时段电价差异，合理安排用电计划。'}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">账单周期</label>
            <input
              type="text"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              placeholder="如 2026-05"
              className="input-field w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">状态</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field w-32">
              <option value="">全部</option>
              <option value="paid">已缴</option>
              <option value="unpaid">待缴</option>
              <option value="overdue">逾期</option>
            </select>
          </div>
          <button onClick={() => { setPeriodFilter(''); setStatusFilter(''); }} className="btn-outline text-sm">
            重置
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="cursor-pointer select-none" onClick={() => toggleSort('period')}>
                <span className="flex items-center gap-1">账单周期 <SortIcon field="period" /></span>
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort('usage')}>
                <span className="flex items-center gap-1">总用电量 <SortIcon field="usage" /></span>
              </th>
              <th className="text-orange-600 dark:text-orange-400">
                <span className="flex items-center gap-1"><Sun size={12} /> 峰时</span>
              </th>
              <th className="text-blue-600 dark:text-blue-400">
                <span className="flex items-center gap-1"><Moon size={12} /> 谷时</span>
              </th>
              <th className="text-amber-600 dark:text-amber-400">
                <span className="flex items-center gap-1"><Sunrise size={12} /> 平时</span>
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                <span className="flex items-center gap-1">金额 <SortIcon field="amount" /></span>
              </th>
              <th>到期日</th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
                <span className="flex items-center gap-1">状态 <SortIcon field="status" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((bill) => (
              <tr key={bill.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => setSelectedBill(bill)}>
                <td className="font-medium text-gray-900 dark:text-white">{bill.period}</td>
                <td>{bill.usage} kWh</td>
                <td className="text-orange-600 dark:text-orange-400">{bill.peakUsage} kWh</td>
                <td className="text-blue-600 dark:text-blue-400">{bill.valleyUsage} kWh</td>
                <td className="text-amber-600 dark:text-amber-400">{bill.flatUsage} kWh</td>
                <td className="font-medium">¥{bill.amount.toFixed(1)}</td>
                <td>{dayjs(bill.dueDate).format('YYYY-MM-DD')}</td>
                <td><span className={statusBadge(bill.status)}>{statusLabel(bill.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">没有找到匹配的账单</div>
        )}
      </div>

      {selectedBill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedBill.period} 账单详情</h3>
              <button onClick={() => setSelectedBill(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <ChevronUp size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-b from-orange-50 to-orange-50/50 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg">
                  <Sun size={20} className="mx-auto text-orange-500 mb-1" />
                  <div className="text-xs text-gray-500">峰时用电</div>
                  <div className="text-lg font-bold text-orange-600">{selectedBill.peakUsage} kWh</div>
                  <div className="text-xs text-gray-400">¥{(selectedBill.peakUsage * 0.84).toFixed(2)}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-b from-amber-50 to-amber-50/50 dark:from-amber-900/20 dark:to-amber-900/10 rounded-lg">
                  <Sunrise size={20} className="mx-auto text-amber-500 mb-1" />
                  <div className="text-xs text-gray-500">平时用电</div>
                  <div className="text-lg font-bold text-amber-600">{selectedBill.flatUsage} kWh</div>
                  <div className="text-xs text-gray-400">¥{(selectedBill.flatUsage * 0.62).toFixed(2)}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-b from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg">
                  <Moon size={20} className="mx-auto text-blue-500 mb-1" />
                  <div className="text-xs text-gray-500">谷时用电</div>
                  <div className="text-lg font-bold text-blue-600">{selectedBill.valleyUsage} kWh</div>
                  <div className="text-xs text-gray-400">¥{(selectedBill.valleyUsage * 0.35).toFixed(2)}</div>
                </div>
              </div>

              <div className="p-4 bg-csg-navy/5 dark:bg-csg-navy/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">合计用电量</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{selectedBill.usage} kWh</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">合计金额</div>
                    <div className="text-2xl font-bold text-csg-navy">¥{selectedBill.amount.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">状态：</span>
                  <span className={statusBadge(selectedBill.status)}>{statusLabel(selectedBill.status)}</span>
                </div>
                <div>
                  <span className="text-gray-500">到期日：</span>
                  <span className="text-gray-900 dark:text-white">{dayjs(selectedBill.dueDate).format('YYYY-MM-DD')}</span>
                </div>
                {selectedBill.paidAt && (
                  <div className="col-span-2">
                    <span className="text-gray-500">缴费时间：</span>
                    <span className="text-gray-900 dark:text-white">{dayjs(selectedBill.paidAt).format('YYYY-MM-DD HH:mm')}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingUp size={16} className="text-csg-green mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">用电分析：</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      本周期峰时用电占比 {((selectedBill.peakUsage / selectedBill.usage) * 100).toFixed(1)}%，
                      谷时用电占比 {((selectedBill.valleyUsage / selectedBill.usage) * 100).toFixed(1)}%。
                      {selectedBill.valleyUsage / selectedBill.usage < 0.25 && 
                        ' 建议增加谷时用电比例，将可节省更多电费。'}
                      {selectedBill.peakUsage / selectedBill.usage > 0.4 && 
                        ' 峰时用电占比较高，建议调整用电时间。'}
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedBill(null)} className="btn-primary w-full">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
