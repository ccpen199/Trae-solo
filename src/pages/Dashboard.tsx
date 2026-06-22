import { Link } from 'react-router-dom';
import { Building2, Users, AlertCircle, Wallet, Plus } from 'lucide-react';
import { useAppStore } from '@/store';
import dayjs from 'dayjs';
import StatCard from '@/components/common/StatCard';
import {
  FeePieChart,
  OverdueList,
  PropertyRankChart,
  TrendChart,
} from '@/components/dashboard/Charts';
import { formatCurrency } from '@/utils/calculator';

export default function Dashboard() {
  const properties = useAppStore((s) => s.properties);
  const tenants = useAppStore((s) => s.tenants);
  const bills = useAppStore((s) => s.bills);
  const now = dayjs();
  const thisMonthKey = now.format('YYYY-MM');

  const thisMonthBills = bills.filter((b) => dayjs(b.periodStart).format('YYYY-MM') === thisMonthKey);
  const expected = thisMonthBills.reduce((s, b) => s + b.totalAmount, 0);
  const collected = thisMonthBills.reduce((s, b) => s + b.paidAmount, 0);
  const overdue = bills.filter((b) => b.status === 'overdue').reduce((s, b) => s + b.totalAmount - b.paidAmount, 0);

  const totalProperties = properties.length;
  const rentedCount = properties.filter((p) => p.status === 'rented').length;
  const occupancyRate = totalProperties > 0 ? Math.round((rentedCount / totalProperties) * 100) : 0;
  const activeTenants = tenants.filter((t) => t.status === 'living').length;

  const miniTrend = bills
    .filter((b) => dayjs(b.periodStart).isAfter(now.subtract(6, 'month')))
    .reduce((acc: number[], b) => {
      const idx = 5 - now.diff(dayjs(b.periodStart), 'month');
      if (idx >= 0 && idx < 6) acc[idx] = (acc[idx] ?? 0) + b.paidAmount;
      return acc;
    }, new Array(6).fill(0))
    .map((v) => Math.round(v));

  const lastMonthExpected = bills
    .filter((b) => dayjs(b.periodStart).format('YYYY-MM') === now.subtract(1, 'month').format('YYYY-MM'))
    .reduce((s, b) => s + b.totalAmount, 0);
  const trendMoM = lastMonthExpected > 0 ? Math.round(((expected - lastMonthExpected) / lastMonthExpected) * 100) : 0;
  const collectRate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="kicker mb-2">财务总览</div>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            本月应收 <span className="text-brand-700">{formatCurrency(expected)}</span>
            <span className="text-slate-300 mx-2">·</span>
            已收 <span className="text-emerald-600">{formatCurrency(collected)}</span>
            <span className="text-sm text-slate-400 font-medium ml-2">（{collectRate}%）</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            截至 {now.format('YYYY年MM月DD日')} 数据快照 · 共管理 {totalProperties} 套房源，{activeTenants} 位在住租客
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/bills" className="btn-secondary">
            查看全部账单
          </Link>
          <Link to="/meter-reading" className="btn-primary">
            <Plus className="w-4 h-4" />
            立即抄表
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <StatCard
          label="本月应收租金"
          value={formatCurrency(expected)}
          icon={<Wallet className="w-4.5 h-4.5" />}
          trend={{ value: trendMoM, label: '环比上月' }}
          color="brand"
          miniChart={miniTrend}
        />
        <StatCard
          label="累计回款率"
          value={`${collectRate}%`}
          icon={<Building2 className="w-4.5 h-4.5" />}
          trend={{ value: collectRate - 85, label: '距目标' }}
          color="success"
          miniChart={miniTrend.map((v, i) => v + i * 500)}
        />
        <StatCard
          label="逾期未收金额"
          value={formatCurrency(overdue)}
          icon={<AlertCircle className="w-4.5 h-4.5" />}
          trend={{ value: overdue > 0 ? -12 : 0, label: '较上周' }}
          color={overdue > 0 ? 'danger' : 'success'}
          miniChart={new Array(6).fill(0).map((_, i) => Math.max(0, overdue - (5 - i) * 400))}
        />
        <StatCard
          label="房源入住率"
          value={`${occupancyRate}%`}
          icon={<Users className="w-4.5 h-4.5" />}
          trend={{ value: occupancyRate - 80, label: '健康度 80%' }}
          color="warn"
          miniChart={[60, 65, 68, 72, 75, occupancyRate]}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-5">
        <div className="xl:col-span-2">
          <TrendChart />
        </div>
        <OverdueList />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <PropertyRankChart />
        <FeePieChart />
      </div>

      <div className="card p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="kicker mb-1.5">合规提示</div>
            <h3 className="font-serif text-base font-semibold text-slate-900">
              民法典 · 租赁合同条款提醒
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {[
            {
              icon: '📜',
              title: '第705条 · 租期上限',
              desc: '租赁期限不得超过20年，超过部分无效。',
            },
            {
              icon: '💰',
              title: '第586条 · 押金上限',
              desc: '押金/定金不得超过主合同标的额的20%。',
            },
            {
              icon: '🔧',
              title: '第712条 · 维修义务',
              desc: '出租人应当履行租赁物的维修义务。',
            },
            {
              icon: '🏠',
              title: '第725条 · 买卖不破租',
              desc: '租赁物所有权变动，不影响租赁合同效力。',
            },
            {
              icon: '👀',
              title: '第726条 · 优先购买权',
              desc: '出租人出卖房屋，承租人享有优先购买权。',
            },
            {
              icon: '📤',
              title: '第716条 · 转租限制',
              desc: '承租人转租须经出租人同意，否则可解除。',
            },
          ].map((t) => (
            <div
              key={t.title}
              className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:shadow-cardHover hover:border-brand-100 transition-all duration-200"
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="font-semibold text-slate-900 mb-1 text-[13px]">{t.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
