import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  Cell,
  Pie,
  PieChart,
} from 'recharts';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/utils/calculator';

export function TrendChart() {
  const bills = useAppStore((s) => s.bills);
  const months = Array.from({ length: 6 }, (_, i) => now().subtract(5 - i, 'month'));
  const data = months.map((m) => {
    const key = m.format('YYYY-MM');
    const monthBills = bills.filter((b) => dayjs(b.periodStart).format('YYYY-MM') === key);
    const income = monthBills.reduce((s, b) => s + b.paidAmount, 0);
    const expected = monthBills.reduce((s, b) => s + b.totalAmount, 0);
    const expense = monthBills.length * 0;
    const net = income - expense;
    return {
      month: m.format('M月'),
      应收: Math.round(expected * 100) / 100,
      实收: Math.round(income * 100) / 100,
      净收益: Math.round(net * 100) / 100,
    };
  });

  return (
    <div className="card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="kicker mb-1.5">收支趋势</div>
          <h3 className="font-serif text-base font-semibold text-slate-900">近6个月收入一览</h3>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F766E" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0F766E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 10000 ? `${(v / 10000).toFixed(1)}w` : v)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                fontSize: 12,
              }}
              formatter={(v: number) => formatCurrency(v)}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="应收" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={22} />
            <Bar dataKey="实收" fill="#0F766E" radius={[6, 6, 0, 0]} barSize={22} />
            <Area
              type="monotone"
              dataKey="净收益"
              stroke="#F59E0B"
              strokeWidth={2.5}
              fill="url(#netGrad)"
              dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PropertyRankChart() {
  const bills = useAppStore((s) => s.bills);
  const properties = useAppStore((s) => s.properties);
  const revenue = properties.map((p) => {
    const pb = bills.filter((b) => b.propertyId === p.id);
    const total = pb.reduce((s, b) => s + b.paidAmount, 0);
    return { name: shortTitle(p.title), revenue: Math.round(total) };
  });
  const sorted = [...revenue].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  return (
    <div className="card p-5 rounded-2xl">
      <div className="mb-4">
        <div className="kicker mb-1.5">房源排行</div>
        <h3 className="font-serif text-base font-semibold text-slate-900">Top 房源收益榜</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 10000 ? `${(v / 10000).toFixed(1)}w` : v)}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11, fill: '#475569' }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(v: number) => formatCurrency(v)}
            />
            <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={18}>
              {sorted.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#0F766E' : i === 1 ? '#115e59' : i === 2 ? '#134e4a' : '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function FeePieChart() {
  const bills = useAppStore((s) => s.bills);
  const byType: Record<string, number> = {};
  for (const b of bills) {
    for (const it of b.items) {
      byType[it.name.includes('租金') ? '租金' : it.name.includes('水') ? '水费' : it.name.includes('电') ? '电费' : it.name.includes('燃气') ? '燃气费' : it.name.includes('物业') ? '物业费' : '其他'] =
        (byType[it.name.includes('租金') ? '租金' : it.name.includes('水') ? '水费' : it.name.includes('电') ? '电费' : it.name.includes('燃气') ? '燃气费' : it.name.includes('物业') ? '物业费' : '其他'] ??
          0) + it.amount;
    }
  }
  const data = Object.entries(byType).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  const COLORS = ['#0F766E', '#0ea5e9', '#f59e0b', '#f97316', '#8b5cf6', '#94a3b8'];

  return (
    <div className="card p-5 rounded-2xl">
      <div className="mb-4">
        <div className="kicker mb-1.5">费用构成</div>
        <h3 className="font-serif text-base font-semibold text-slate-900">收入类型占比</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(v: number) => formatCurrency(v)}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              formatter={(val) => <span className="text-slate-600">{val}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function OverdueList() {
  const bills = useAppStore((s) => s.bills);
  const tenants = useAppStore((s) => s.tenants);
  const properties = useAppStore((s) => s.properties);
  const today = now();

  const alerts = bills
    .filter((b) => {
      if (b.status === 'paid' || b.status === 'cancelled') return false;
      const diff = dayjs(b.dueDate).diff(today, 'day');
      return diff <= 3;
    })
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
    .slice(0, 5);

  if (alerts.length === 0) {
    return (
      <div className="card p-5 rounded-2xl h-full">
        <div className="mb-4">
          <div className="kicker mb-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">全部正常</div>
          <h3 className="font-serif text-base font-semibold text-slate-900">收租提醒</h3>
        </div>
        <div className="py-10 text-center text-sm text-slate-500">
          <div className="text-4xl mb-2">✅</div>
          暂无临近或逾期账单，保持良好！
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 rounded-2xl h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="kicker mb-1.5 bg-rose-50 text-rose-700 border-rose-200">待处理 {alerts.length}</div>
          <h3 className="font-serif text-base font-semibold text-slate-900">收租提醒 · 逾期预警</h3>
        </div>
      </div>
      <div className="space-y-3">
        {alerts.map((b) => {
          const tenant = tenants.find((t) => t.id === b.tenantId);
          const prop = properties.find((p) => p.id === b.propertyId);
          const diff = dayjs(b.dueDate).diff(today, 'day');
          const isOverdue = diff < 0;
          const unpaid = b.totalAmount - b.paidAmount;
          return (
            <div
              key={b.id}
              className={
                'p-3 rounded-xl border transition-all hover:shadow-md ' +
                (isOverdue
                  ? 'bg-rose-50/60 border-rose-200'
                  : diff <= 3
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-white border-slate-200')
              }
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={
                      'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ' +
                      (isOverdue ? 'bg-rose-500' : diff <= 3 ? 'bg-amber-500' : 'bg-brand-600')
                    }
                  >
                    {tenant?.name?.[0] ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{tenant?.name ?? '未绑定'}</div>
                    <div className="text-[11px] text-slate-500 truncate">{shortTitle(prop?.title ?? '')}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(unpaid)}</div>
                  <div
                    className={
                      'text-[11px] font-medium ' +
                      (isOverdue ? 'text-rose-700' : diff <= 3 ? 'text-amber-700' : 'text-slate-500')
                    }
                  >
                    {isOverdue ? `逾期 ${-diff} 天` : diff === 0 ? '今天到期' : `${diff} 天后到期`}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  账期 {dayjs(b.periodStart).format('MM/DD')}~{dayjs(b.periodEnd).format('MM/DD')}
                </div>
                <div className="flex gap-1.5">
                  <button className="text-[11px] px-2 py-1 rounded-md bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-50">
                    催缴
                  </button>
                  <button className="text-[11px] px-2 py-1 rounded-md bg-brand-700 text-white hover:bg-brand-800">
                    收款
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function now() {
  return dayjs();
}

function shortTitle(t: string): string {
  if (!t) return '';
  return t.length > 8 ? t.slice(0, 7) + '…' : t;
}
