import { useEffect, useState } from 'react';
import {
  Ticket,
  QrCode,
  DollarSign,
  Store,
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVerificationStore } from '../stores/verificationStore';
import { useAlertStore } from '../stores/alertStore';
import { mockVerificationService } from '../services/mockService';
import { StatCard } from '../components/common/StatCard';
import { LineChart } from '../components/common/LineChart';
import { PieChart } from '../components/common/PieChart';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageLoading } from '../components/common/Loading';
import dayjs from 'dayjs';
import type { VerificationRecord } from '@shared/types';

export default function Dashboard() {
  const { stats, trendData, isLoading, fetchStats, fetchTrendData, records, fetchRecords } =
    useVerificationStore();
  const { alerts, fetchAlerts } = useAlertStore();

  const [couponDistribution, setCouponDistribution] = useState<
    { name: string; value: number }[]
  >([]);

  useEffect(() => {
    fetchStats();
    fetchTrendData(14);
    fetchRecords({ page: 1, pageSize: 5 });
    fetchAlerts({ page: 1, pageSize: 5, read: false });
    mockVerificationService.getCouponDistribution().then((data) => setCouponDistribution(data));
  }, [fetchStats, fetchTrendData, fetchRecords, fetchAlerts]);

  const recentColumns = [
    {
      key: 'time',
      header: '核销时间',
      render: (row: VerificationRecord) =>
        dayjs(row.verifiedAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'orderNo',
      header: '订单号',
      render: (row: VerificationRecord) => (
        <span className="font-mono text-xs">{row.orderNo}</span>
      ),
    },
    {
      key: 'amount',
      header: '实付金额',
      align: 'right' as const,
      render: (row: VerificationRecord) => `¥${row.amount.toFixed(2)}`,
    },
    {
      key: 'discountAmount',
      header: '优惠金额',
      align: 'right' as const,
      render: (row: VerificationRecord) => (
        <span className="text-accent-600">¥{row.discountAmount.toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      align: 'center' as const,
      render: (row: VerificationRecord) => (
        <StatusBadge status={row.status} type="verification" />
      ),
    },
  ];

  if (isLoading && !stats) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
          <p className="text-gray-500 mt-1">
            欢迎回来，今天是 {dayjs().format('YYYY年MM月DD日 dddd')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline">
            <Calendar className="w-4 h-4 inline mr-2" />
            今日
          </button>
          <button className="btn-primary">
            <TrendingUp className="w-4 h-4 inline mr-2" />
            查看报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="累计发券"
          value={stats?.totalCoupons || 0}
          icon={<Ticket className="w-5 h-5" />}
          trend={12.5}
          trendLabel="较上月"
          color="blue"
        />
        <StatCard
          title="累计核销"
          value={stats?.usedCoupons || 0}
          icon={<QrCode className="w-5 h-5" />}
          trend={8.3}
          trendLabel="较上月"
          color="green"
        />
        <StatCard
          title="核销率"
          value={`${stats?.verificationRate || 0}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={3.2}
          trendLabel="较上月"
          color="orange"
        />
        <StatCard
          title="累计补贴"
          value={stats?.totalSubsidy || 0}
          prefix="¥"
          icon={<DollarSign className="w-5 h-5" />}
          trend={-2.1}
          trendLabel="较上月"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日核销"
          value={stats?.todayVerifications || 0}
          icon={<QrCode className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="今日金额"
          value={stats?.todayAmount || 0}
          prefix="¥"
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="活跃活动"
          value={stats?.activeActivities || 0}
          icon={<Ticket className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="活跃商户"
          value={stats?.activeMerchants || 0}
          icon={<Store className="w-5 h-5" />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            核销趋势
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="7">近7天</option>
              <option value="14" selected>
                近14天
              </option>
              <option value="30">近30天</option>
              <option value="90">近90天</option>
            </select>
          </div>
          <div className="card-body">
            <LineChart data={trendData} height={320} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">优惠券类型分布</div>
          <div className="card-body">
            <PieChart data={couponDistribution} height={320} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            最近核销
            <Link
              to="/verification"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <DataTable
            columns={recentColumns}
            data={records}
            loading={isLoading}
            rowKey={(row) => row.id}
          />
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-500" />
              告警通知
            </div>
            <Link
              to="/alerts"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">暂无告警</div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        alert.level === 'critical'
                          ? 'bg-danger-500'
                          : alert.level === 'warning'
                          ? 'bg-warning-500'
                          : 'bg-primary-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {dayjs(alert.createdAt).format('MM-DD HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
