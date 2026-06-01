import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';
import {
  FileText,
  ShoppingCart,
  DollarSign,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({
    demands: 0,
    quotes: 0,
    orders: 0,
    balance: 0,
  });
  const [recentDemands, setRecentDemands] = useState<any[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [demandsRes, quotesRes, ordersRes, accountRes] = await Promise.all([
        api.demands.my({ limit: 5 }),
        api.quotes.my({ limit: 5 }),
        api.orders.my({ limit: 5 }),
        api.accounts.balance(),
      ]);

      setStats({
        demands: demandsRes.data?.pagination?.total || 0,
        quotes: quotesRes.data?.pagination?.total || 0,
        orders: ordersRes.data?.pagination?.total || 0,
        balance: accountRes.data?.account?.balance || 0,
      });

      setRecentDemands(demandsRes.data?.list || []);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
    published: { label: '已发布', color: 'bg-blue-100 text-blue-600' },
    quoted: { label: '已报价', color: 'bg-purple-100 text-purple-600' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            欢迎回来，{user?.real_name || user?.username}
          </h1>
          <p className="text-gray-600 mt-1">这是您的工作台概览</p>
        </div>
        {user?.role === 'buyer' && (
          <Link
            to="/demands/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FileText size={18} />
            发布需求
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">需求数量</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.demands}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">报价数量</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.quotes}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">订单数量</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.orders}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">账户余额</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">¥{stats.balance.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <DollarSign className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近需求</h2>
            <Link to="/demands" className="text-blue-600 text-sm hover:underline">
              查看全部
            </Link>
          </div>
          {recentDemands.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无需求数据</p>
          ) : (
            <div className="space-y-4">
              {recentDemands.map((demand) => {
                const status = statusMap[demand.status] || statusMap.draft;
                return (
                  <div
                    key={demand.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{demand.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {demand.industry} · {demand.region}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 gap-4">
            {user?.role === 'buyer' && (
              <>
                <Link
                  to="/demands/create"
                  className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <FileText className="text-blue-600 mb-2" size={28} />
                  <span className="text-sm font-medium text-gray-900">发布需求</span>
                </Link>
                <Link
                  to="/quotes"
                  className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <ShoppingCart className="text-purple-600 mb-2" size={28} />
                  <span className="text-sm font-medium text-gray-900">查看报价</span>
                </Link>
              </>
            )}
            {user?.role === 'supplier' && (
              <>
                <Link
                  to="/demands"
                  className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <FileText className="text-blue-600 mb-2" size={28} />
                  <span className="text-sm font-medium text-gray-900">需求大厅</span>
                </Link>
                <Link
                  to="/enterprises"
                  className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <Building2 className="text-green-600 mb-2" size={28} />
                  <span className="text-sm font-medium text-gray-900">企业管理</span>
                </Link>
              </>
            )}
            <Link
              to="/orders"
              className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
            >
              <TrendingUp className="text-green-600 mb-2" size={28} />
              <span className="text-sm font-medium text-gray-900">订单管理</span>
            </Link>
            <Link
              to="/account"
              className="flex flex-col items-center justify-center p-6 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <DollarSign className="text-orange-600 mb-2" size={28} />
              <span className="text-sm font-medium text-gray-900">账户中心</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
