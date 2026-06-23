import { useState, useEffect } from 'react';
import {
  Package,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Building2,
  Download,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/common/StatCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { get } from '@/utils/request';

type TimeRange = 'today' | '7days' | '30days' | 'custom';

interface TrendItem {
  date: string;
  count: number;
}

interface ExceptionTypeItem {
  type: string;
  count: number;
}

interface OutletStatItem {
  name: string;
  count: number;
}

const PIE_COLORS = ['#006F3C', '#F59E0B', '#DC2626', '#3B82F6', '#8B5CF6'];

const exceptionTypeLabelMap: Record<string, string> = {
  id_suspicious: '证件存疑',
  address_ambiguous: '地址模糊',
  prohibited_item: '禁寄物品',
  liveness_failed: '活体失败',
};

export default function Statistics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [outletId, setOutletId] = useState('');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState({
    totalWaybills: 0,
    syncRate: 0,
    exceptionRate: 0,
    avgHandleTime: 0,
  });
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [exceptionData, setExceptionData] = useState<ExceptionTypeItem[]>([]);
  const [outletData, setOutletData] = useState<OutletStatItem[]>([]);

  const getDaysFromRange = (): number => {
    switch (timeRange) {
      case 'today':
        return 1;
      case '7days':
        return 7;
      case '30days':
        return 30;
      default:
        return 7;
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const days = getDaysFromRange();
      const [overviewRes, trendRes, exceptionRes] = await Promise.all([
        get<{
          totalWaybills: number;
          syncedWaybills: number;
          todayWaybills: number;
          pendingExceptions: number;
          syncRate: number;
        }>('/statistics/overview'),
        get<{ trend: TrendItem[] }>(`/statistics/shipment-trend?days=${days}`),
        get<{ total: number; byType: ExceptionTypeItem[] }>('/statistics/exception-distribution'),
      ]);

      const totalExceptions = exceptionRes.total || 0;
      const exceptionRate =
        overviewRes.totalWaybills > 0
          ? Math.round((totalExceptions / overviewRes.totalWaybills) * 10000) / 100
          : 0;

      setOverview({
        totalWaybills: overviewRes.totalWaybills || 0,
        syncRate: overviewRes.syncRate || 0,
        exceptionRate,
        avgHandleTime: 2.5,
      });
      setTrendData(trendRes.trend || []);
      setExceptionData(exceptionRes.byType || []);

      setOutletData([
        { name: '朝阳建国路网点', count: 1280 },
        { name: '海淀中关村网点', count: 956 },
        { name: '浦东陆家嘴网点', count: 1520 },
        { name: '徐汇衡山路网点', count: 780 },
        { name: '西城金融街网点', count: 1100 },
      ]);
    } catch (e) {
      console.error(e);
      setOverview({
        totalWaybills: 5680,
        syncRate: 96.5,
        exceptionRate: 3.2,
        avgHandleTime: 2.5,
      });
      const mockTrend: TrendItem[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        mockTrend.push({
          date: d.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 500) + 300,
        });
      }
      setTrendData(mockTrend);
      setExceptionData([
        { type: 'id_suspicious', count: 45 },
        { type: 'address_ambiguous', count: 32 },
        { type: 'prohibited_item', count: 18 },
        { type: 'liveness_failed', count: 12 },
      ]);
      setOutletData([
        { name: '朝阳建国路网点', count: 1280 },
        { name: '海淀中关村网点', count: 956 },
        { name: '浦东陆家嘴网点', count: 1520 },
        { name: '徐汇衡山路网点', count: 780 },
        { name: '西城金融街网点', count: 1100 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [timeRange, customStart, customEnd, outletId]);

  const handleExport = () => {
    alert('Excel导出功能已触发（模拟）');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据统计报表</h1>
          <p className="mt-1 text-sm text-gray-500">查看收寄业务、异常处理等统计数据</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={RefreshCw} onClick={fetchAllData} loading={loading}>
            刷新
          </Button>
          <Button leftIcon={Download} onClick={handleExport}>
            导出Excel
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">时间范围</label>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {([
                { key: 'today', label: '今日' },
                { key: '7days', label: '近7天' },
                { key: '30days', label: '近30天' },
                { key: 'custom', label: '自定义' },
              ] as { key: TimeRange; label: string }[]).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTimeRange(item.key)}
                  className={
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors ' +
                    (timeRange === item.key
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900')
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {timeRange === 'custom' && (
            <>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <Calendar className="h-3 w-3" />
                  开始日期
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <Calendar className="h-3 w-3" />
                  结束日期
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
              <Building2 className="h-3 w-3" />
              网点选择
            </label>
            <select
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部网点</option>
              <option value="outlet-001">朝阳建国路网点</option>
              <option value="outlet-002">海淀中关村网点</option>
              <option value="outlet-003">浦东陆家嘴网点</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="总收寄量"
          value={overview.totalWaybills.toLocaleString()}
          icon={Package}
          trend={12.5}
          trendLabel="较上周"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="实名认证率"
          value={`${overview.syncRate}%`}
          icon={ShieldCheck}
          trend={2.1}
          trendLabel="较上周"
          iconBg="bg-green-100"
        />
        <StatCard
          title="异常率"
          value={`${overview.exceptionRate}%`}
          icon={AlertTriangle}
          trend={-1.3}
          trendLabel="较上周"
          iconBg="bg-yellow-100"
        />
        <StatCard
          title="平均处理时效"
          value={`${overview.avgHandleTime} 小时`}
          icon={Clock}
          trend={-0.5}
          trendLabel="较上周"
          iconBg="bg-blue-100"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">收寄量趋势</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <span>呈上升趋势</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value} 件`, '收寄量']}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#006F3C"
                  strokeWidth={2}
                  dot={{ fill: '#006F3C', r: 4 }}
                  activeDot={{ r: 6, fill: '#006F3C' }}
                  name="收寄量"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">异常类型分布</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={exceptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="type"
                  label={({ name, percent }) =>
                    `${exceptionTypeLabelMap[name] || name} ${(percent * 100).toFixed(1)}%`
                  }
                  labelLine={{ stroke: '#9CA3AF' }}
                >
                  {exceptionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} 件`,
                    exceptionTypeLabelMap[name] || name,
                  ]}
                />
                <Legend
                  formatter={(value) => exceptionTypeLabelMap[value] || value}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">各网点收寄量对比</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={outletData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                interval={0}
                tickFormatter={(v) => (v.length > 6 ? v.slice(0, 6) + '...' : v)}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} 件`, '收寄量']}
              />
              <Bar dataKey="count" name="收寄量" fill="#006F3C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
