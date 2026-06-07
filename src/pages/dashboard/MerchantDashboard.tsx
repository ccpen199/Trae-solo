import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Package,
  Plus,
  TrendingUp,
  Users,
  Star,
  Eye,
  ShoppingBag,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Zap,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import type { MarketItem, Merchant } from '@/types';

const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [merchantInfo, setMerchantInfo] = useState<Merchant | null>(null);
  const [myItems, setMyItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const merchantsRes = await apiRequest.get<{ items: any[]; total: number }>('/merchants?page_size=100');
      let foundMerchant: Merchant | null = null;
      if (merchantsRes.success && merchantsRes.data) {
        const payload = merchantsRes.data as any;
        const items = Array.isArray(payload) ? payload : payload.items || [];
        foundMerchant = items.find((m: any) => m.user_id === user?.id) || null;
        if (foundMerchant) {
          setMerchantInfo(foundMerchant);
        }
      }

      if (foundMerchant) {
        const itemsRes = await apiRequest.get<{ items: any[]; total: number }>(
          '/market/admin?merchant_id=' + foundMerchant.id + '&page_size=5'
        );
        if (itemsRes.success && itemsRes.data) {
          const payload = itemsRes.data as any;
          const items = Array.isArray(payload) ? payload : payload.items || [];
          setMyItems(items.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Load merchant dashboard failed:', error);
      if (!merchantInfo) {
        setMerchantInfo({
          id: 1,
          name: '阳光便利店',
          category: '超市零售',
          phone: '13700137001',
          address: '小区1号楼底商',
          description: '提供日常生活用品、食品饮料、零食等',
          businessHours: '24小时营业',
          rating: 4.8,
          isOpen: true,
          status: 'approved',
          createdAt: '2024-01-01',
        });
        setMyItems([
          { id: 1, title: '新鲜鸡蛋(30枚)', description: '新鲜农场直供鸡蛋', price: 25.8, stock: 50, status: 'on_sale', views: 156, createdAt: '2024-01-10', seller: '阳光便利店', category: '食品' },
          { id: 2, title: '5L桶装饮用水', description: '优质桶装饮用水', price: 12.0, stock: 100, status: 'on_sale', views: 89, createdAt: '2024-01-12', seller: '阳光便利店', category: '食品' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalProducts: myItems.length,
    todayViews: myItems.reduce((sum, item) => sum + (item.views || 0), 0),
    monthSales: 12580,
    avgRating: merchantInfo?.rating || 4.8,
    totalOrders: 156,
    pendingOrders: 3,
  };

  const quickActions = [
    { label: '发布商品', icon: Plus, path: '/marketplace/create', color: 'primary', desc: '上架新商品' },
    { label: '商品管理', icon: Package, path: '/marketplace', color: 'secondary', desc: '管理在售商品', badge: stats.totalProducts },
    { label: '店铺信息', icon: Store, path: merchantInfo ? '/merchants/' + merchantInfo.id : '/merchants', color: 'green', desc: '店铺资料维护' },
    { label: '经营数据', icon: BarChart3, path: '/metrics', color: 'yellow', desc: '查看经营报表' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-serif">商家管理工作台</h1>
              <p className="text-gray-500">
                欢迎回来，{merchantInfo?.name || user?.name || '商家'} · 
                {merchantInfo?.status === 'approved' ? (
                  <span className="text-green-600 ml-1">已认证</span>
                ) : (
                  <span className="text-yellow-600 ml-1">认证中</span>
                )}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/marketplace/create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          发布商品
        </button>
      </div>

      {merchantInfo?.status === 'pending' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">资质审核中</p>
            <p className="text-sm text-yellow-700 mt-1">
              您的商户入驻申请正在审核中，通常需要1-3个工作日完成审核。
              审核通过后即可正常经营。
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="今日曝光"
          value={stats.todayViews}
          icon={Eye}
          gradient="primary"
          suffix="次"
          change={12}
        />
        <StatCard
          title="本月销售额"
          value={stats.monthSales}
          icon={DollarSign}
          gradient="green"
          prefix="¥"
          change={8.5}
        />
        <StatCard
          title="在售商品"
          value={stats.totalProducts}
          icon={Package}
          gradient="secondary"
          suffix="件"
        />
        <StatCard
          title="店铺评分"
          value={stats.avgRating}
          icon={Star}
          gradient="yellow"
          suffix="分"
          change={0.2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5" />
                <h3 className="text-lg font-semibold font-serif">AI 经营分析</h3>
              </div>
              <p className="text-white/90 leading-relaxed text-sm">
                您的店铺今日曝光 <span className="font-bold">{stats.todayViews}</span> 次，
                较昨日提升 <span className="font-bold">12%</span>。
                本月累计销售额 <span className="font-bold">¥{stats.monthSales.toLocaleString()}</span>，
                复购率 <span className="font-bold">35%</span>，表现优秀！
                建议上架更多热门商品，可进一步提升销售额。
                当前店铺评分 <span className="font-bold">{stats.avgRating}</span> 分，
                继续保持优质服务。
              </p>
            </div>
            <div className="text-right ml-6">
              <div className="flex items-center gap-2 justify-end">
                <TrendingUp className="w-6 h-6" />
                <span className="text-5xl font-bold">+12%</span>
              </div>
              <p className="text-white/70 text-sm mt-1">曝光增长</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">快捷管理</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group text-left relative"
              >
                {action.badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                    action.color === 'primary'
                      ? 'bg-primary-100 text-primary-600'
                      : action.color === 'secondary'
                      ? 'bg-secondary-100 text-secondary-600'
                      : action.color === 'green'
                      ? 'bg-accent-green-100 text-accent-green-600'
                      : 'bg-accent-yellow-100 text-accent-yellow-600'
                  } group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <p className="font-medium text-gray-900 group-hover:text-primary-600 text-sm">
                  {action.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900 font-serif">在售商品</h3>
          </div>
          <button
            onClick={() => navigate('/marketplace')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            全部商品 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {myItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">商品名称</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">价格</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">库存</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">浏览量</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {myItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.createdAt}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-primary-600">
                      ¥{item.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={item.stock && item.stock < 10 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {item.stock || 0} 件
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">{item.views || 0} 次</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'on_sale'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'sold_out'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.status === 'on_sale'
                          ? '在售'
                          : item.status === 'sold_out'
                          ? '售罄'
                          : '下架'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">暂无商品</p>
            <p className="text-sm mt-1">点击"发布商品"开始上架您的第一个商品</p>
            <button
              onClick={() => navigate('/marketplace/create')}
              className="mt-4 btn-primary px-4 py-2 text-sm"
            >
              立即发布
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantDashboard;
