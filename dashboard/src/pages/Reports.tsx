import { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  RefreshCw,
  TrendingUp,
  Users,
  Store,
  MapPin,
} from 'lucide-react';
import { useVerificationStore } from '../stores/verificationStore';
import { StatCard } from '../components/common/StatCard';
import { LineChart } from '../components/common/LineChart';
import { BarChart } from '../components/common/BarChart';
import { PieChart } from '../components/common/PieChart';
import { PageLoading } from '../components/common/Loading';
import dayjs from 'dayjs';

export default function Reports() {
  const { stats, trendData, isLoading, fetchStats, fetchTrendData } =
    useVerificationStore();
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchTrendData(Number(dateRange));
  }, [fetchStats, fetchTrendData, dateRange]);

  const categoryData = [
    { name: '餐饮美食', value: 35 },
    { name: '零售百货', value: 28 },
    { name: '生活服务', value: 18 },
    { name: '休闲娱乐', value: 12 },
    { name: '其他', value: 7 },
  ];

  const districtData = [
    { name: '沈河区', value: 12560 },
    { name: '和平区', value: 10890 },
    { name: '大东区', value: 8650 },
    { name: '皇姑区', value: 7230 },
    { name: '铁西区', value: 6890 },
    { name: '浑南区', value: 5420 },
    { name: '于洪区', value: 4150 },
    { name: '沈北新区', value: 3280 },
  ];

  const terminalData = [
    { name: 'POS机', value: 55 },
    { name: '小程序', value: 35 },
    { name: '城市码', value: 10 },
  ];

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('报表导出成功！');
    }, 1500);
  };

  if (isLoading && !stats) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">数据报表</h1>
          <p className="text-gray-500 mt-1">多维度数据分析和报表导出</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">近7天</option>
            <option value="14">近14天</option>
            <option value="30">近30天</option>
            <option value="90">近90天</option>
          </select>
          <button
            className="btn-outline flex items-center gap-2"
            onClick={() => fetchTrendData(Number(dateRange))}
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出报表
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="累计发券"
          value={stats?.totalCoupons || 0}
          icon={<BarChart3 className="w-5 h-5" />}
          trend={12.5}
          trendLabel="较上月"
          color="blue"
        />
        <StatCard
          title="累计核销"
          value={stats?.usedCoupons || 0}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={8.3}
          trendLabel="较上月"
          color="green"
        />
        <StatCard
          title="活跃商户"
          value={stats?.activeMerchants || 0}
          icon={<Store className="w-5 h-5" />}
          trend={5.2}
          trendLabel="较上月"
          color="orange"
        />
        <StatCard
          title="累计补贴"
          value={stats?.totalSubsidy || 0}
          prefix="¥"
          icon={<BarChart3 className="w-5 h-5" />}
          trend={-2.1}
          trendLabel="较上月"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">核销趋势</div>
          <div className="card-body">
            <LineChart data={trendData} height={300} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">各行政区核销情况</div>
          <div className="card-body">
            <BarChart
              data={districtData}
              height={300}
              color="#1E40AF"
              horizontal
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">行业分类分布</div>
          <div className="card-body">
            <PieChart data={categoryData} height={300} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">核销渠道分布</div>
          <div className="card-body">
            <PieChart
              data={terminalData}
              height={300}
              colors={['#1E40AF', '#F97316', '#10B981']}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">核心指标汇总</div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    指标
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    今日
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    本周
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    本月
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    累计
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    环比
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { name: '核销笔数', today: 1256, week: 8956, month: 35680, total: 125680, trend: 12.5 },
                  { name: '核销金额(元)', today: 28560, week: 198560, month: 856000, total: 3256800, trend: 8.3 },
                  { name: '优惠金额(元)', today: 5720, week: 39850, month: 175200, total: 652400, trend: -2.1 },
                  { name: '客单价(元)', today: 22.74, week: 22.17, month: 23.98, total: 25.91, trend: 3.2 },
                  { name: '活跃用户', today: 1156, week: 6890, month: 25680, total: 89560, trend: 6.7 },
                  { name: '核销率', today: '68.2%', week: '65.8%', month: '63.5%', total: '65.1%', trend: 2.1 },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-800">
                      {row.today}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-800">
                      {row.week}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-800">
                      {row.month}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                      {row.total}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span
                        className={`font-medium ${
                          (row.trend as number) >= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                        }`}
                      >
                        {(row.trend as number) >= 0 ? '+' : ''}
                        {row.trend}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
