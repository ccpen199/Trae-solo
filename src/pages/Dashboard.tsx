import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Package,
  ShoppingCart,
  DollarSign,
  PackageOpen,
  AlertTriangle,
  ArrowRight,
  Truck,
  Archive,
  Shirt,
  Sparkles,
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import StatCard from '../components/UI/StatCard';
import StatusBadge from '../components/UI/StatusBadge';
import { cabinetApi, packageApi } from '../lib/api';
import type { Cabinet, PackageItem } from '../lib/api';
import { useCabinetStore } from '../store/cabinetStore';

interface Alert {
  id: string;
  type: string;
  message: string;
  cabinetName: string;
  severity: string;
  time: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { setCabinets, setPackages } = useCabinetStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCabinets: 0,
    activePackages: 0,
    todayOrders: 0,
    revenue: 0,
  });
  const [cabinets, setCabinetsState] = useState<Cabinet[]>([]);
  const [recentPackages, setRecentPackages] = useState<PackageItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cabinetRes, packageRes] = await Promise.all([
        cabinetApi.getAll(),
        packageApi.getAll(),
      ]);

      if (cabinetRes.success && cabinetRes.data) {
        const cabinetData = cabinetRes.data as Cabinet[];
        setCabinets(cabinetData);
        setCabinetsState(cabinetData.slice(0, 5));
        setStats((s) => ({ ...s, totalCabinets: cabinetData.length }));
      }

      if (packageRes.success && packageRes.data) {
        const packageData = packageRes.data as PackageItem[];
        setPackages(packageData);
        setRecentPackages(packageData.slice(0, 5));
        setStats((s) => ({
          ...s,
          activePackages: packageData.filter((p) =>
            ['pending', 'processing'].includes(p.status)
          ).length,
          todayOrders: Math.floor(Math.random() * 50) + 20,
          revenue: Math.floor(Math.random() * 10000) + 5000,
        }));
      }

      setAlerts([
        {
          id: '1',
          type: 'temperature',
          message: '温度异常警告',
          cabinetName: 'A栋1号柜',
          severity: 'warning',
          time: '5分钟前',
        },
        {
          id: '2',
          type: 'door',
          message: '柜门未关提醒',
          cabinetName: 'B栋2号柜',
          severity: 'error',
          time: '12分钟前',
        },
        {
          id: '3',
          type: 'network',
          message: '网络连接中断',
          cabinetName: 'C栋3号柜',
          severity: 'error',
          time: '30分钟前',
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: <Truck className="w-6 h-6" />,
      label: '快递寄件',
      path: '/shipping',
      color: 'bg-sky-50 text-sky-600',
    },
    {
      icon: <Archive className="w-6 h-6" />,
      label: '物品存储',
      path: '/storage',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: <Shirt className="w-6 h-6" />,
      label: '洗衣服务',
      path: '/laundry',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      label: '家政服务',
      path: '/housekeeping',
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-500">加载中...</span>
            </div>
          </div>
        ) : (
          <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">控制面板</h1>
          <p className="text-slate-500 text-sm mt-1">欢迎回来，这是您的运营概览</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="柜子总数"
          value={stats.totalCabinets}
          icon={<Box className="w-6 h-6" />}
          trend={12}
          trendLabel="较上月"
          color="sky"
        />
        <StatCard
          title="活跃包裹"
          value={stats.activePackages}
          icon={<Package className="w-6 h-6" />}
          trend={8}
          trendLabel="较昨日"
          color="emerald"
        />
        <StatCard
          title="今日订单"
          value={stats.todayOrders}
          icon={<ShoppingCart className="w-6 h-6" />}
          trend={15}
          trendLabel="较昨日"
          color="amber"
        />
        <StatCard
          title="今日营收"
          value={`¥${stats.revenue.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          trend={23}
          trendLabel="较昨日"
          color="slate"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50 transition-all group"
            >
              <div
                className={`p-3 rounded-xl ${action.color} group-hover:scale-110 transition-transform`}
              >
                {action.icon}
              </div>
              <span className="text-sm font-medium text-slate-700">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800">柜子占用率</h2>
            <button
              onClick={() => navigate('/cabinets')}
              className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {cabinets.map((cabinet) => {
              const rate =
                cabinet.totalCompartments > 0
                  ? Math.round(
                      (cabinet.occupiedCompartments / cabinet.totalCompartments) *
                        100
                    )
                  : 0;
              return (
                <div key={cabinet.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        {cabinet.name}
                      </span>
                      <StatusBadge status={cabinet.status as 'online' | 'offline'} />
                    </div>
                    <span className="text-sm text-slate-500">
                      {cabinet.occupiedCompartments}/{cabinet.totalCompartments} ({rate}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${rate}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{cabinet.location}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800">活跃告警</h2>
            <span className="flex items-center gap-1 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              {alerts.length} 个告警
            </span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'error'
                    ? 'bg-red-50 border-red-100'
                    : 'bg-amber-50 border-amber-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`w-5 h-5 mt-0.5 ${
                        alert.severity === 'error' ? 'text-red-500' : 'text-amber-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {alert.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {alert.cabinetName} · {alert.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">最近包裹</h2>
          <button
            onClick={() => navigate('/packages')}
            className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            查看全部 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  运单号
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  收件人
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPackages.map((pkg) => (
                <tr
                  key={pkg.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/packages/${pkg.id}`)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-sky-600">
                    {pkg.trackingNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {pkg.type === 'send' ? '寄件' : pkg.type === 'receive' ? '收件' : '存储'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{pkg.receiverName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={
                        (pkg.status as 'pending' | 'processing' | 'completed') || 'pending'
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(pkg.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
          </>
        )}
      </div>
    </Layout>
  );
}
