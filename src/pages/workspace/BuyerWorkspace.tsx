import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Empty } from '@/components/Empty';
import { useAuthStore } from '@/store/authStore';
import {
  User, Building2, Clock, DollarSign, Package,
  RefreshCw, Search, ShoppingCart, Heart, BarChart3,
  TrendingUp, Bell, MapPin, ChevronRight, Star,
  FileText, MessageSquare, Eye, ArrowRight, X,
  CheckCircle, Truck, CircleDot, CircleCheckBig
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InquiryItem {
  id: string;
  category: string;
  targetAmount: number;
  targetPrice: number;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  replies: number;
  stationName: string;
}

interface FavoriteSupply {
  id: string;
  category: string;
  purity: string;
  weight: number;
  price: number;
  location: string;
  stationName: string;
  certified: boolean;
}

interface PurchaseOrder {
  id: string;
  category: string;
  quantity: number;
  supplierName: string;
  amount: number;
  status: 'pending_payment' | 'paid' | 'shipping' | 'received' | 'completed';
  createdAt: string;
  progress: number;
}

const BuyerWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inquiries' | 'favorites' | 'orders'>('inquiries');

  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSupply[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInquiries([
        { id: 'INQ001', category: '废铜', targetAmount: 50, targetPrice: 58000, status: 'pending', createdAt: '2025-06-20 09:15', replies: 0, stationName: '-' },
        { id: 'INQ002', category: '废铝', targetAmount: 100, targetPrice: 13500, status: 'quoted', createdAt: '2025-06-19 14:30', replies: 3, stationName: '永达回收' },
        { id: 'INQ003', category: '不锈钢', targetAmount: 30, targetPrice: 12000, status: 'accepted', createdAt: '2025-06-18 10:00', replies: 5, stationName: '金诚回收' },
        { id: 'INQ004', category: '废锌', targetAmount: 80, targetPrice: 18000, status: 'quoted', createdAt: '2025-06-17 16:45', replies: 2, stationName: '华盛再生' },
        { id: 'INQ005', category: '电子废料', targetAmount: 20, targetPrice: 25000, status: 'expired', createdAt: '2025-06-15 08:00', replies: 1, stationName: '绿源环保' },
      ]);
      setFavorites([
        { id: 'S001', category: '废铜', purity: '≥99%', weight: 25, price: 58500, location: '江苏苏州', stationName: '永达回收站', certified: true },
        { id: 'S002', category: '废铝', purity: '≥95%', weight: 60, price: 13800, location: '浙江杭州', stationName: '鑫源再生', certified: true },
        { id: 'S003', category: '不锈钢', purity: '304', weight: 15, price: 12500, location: '广东佛山', stationName: '恒丰金属', certified: false },
        { id: 'S004', category: '废铅', purity: '≥97%', weight: 40, price: 15200, location: '山东济南', stationName: '华鑫回收', certified: true },
      ]);
      setOrders([
        { id: 'PO20250620001', category: '废铜', quantity: 50, supplierName: '永达回收站', amount: 2925000, status: 'pending_payment', createdAt: '2025-06-20', progress: 1 },
        { id: 'PO20250619002', category: '废铝', quantity: 100, supplierName: '鑫源再生', amount: 1350000, status: 'paid', createdAt: '2025-06-19', progress: 2 },
        { id: 'PO20250618003', category: '不锈钢', quantity: 30, supplierName: '恒丰金属', amount: 375000, status: 'shipping', createdAt: '2025-06-18', progress: 3 },
        { id: 'PO20250615004', category: '废锌', quantity: 80, supplierName: '华盛再生', amount: 1440000, status: 'received', createdAt: '2025-06-15', progress: 4 },
        { id: 'PO20250610005', category: '废铅', quantity: 40, supplierName: '华鑫回收', amount: 608000, status: 'completed', createdAt: '2025-06-10', progress: 5 },
      ]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'info' | 'warning' | 'success' | 'danger' | 'default'; label: string }> = {
      pending: { variant: 'warning', label: '待回复' },
      quoted: { variant: 'info', label: '已报价' },
      accepted: { variant: 'success', label: '已接受' },
      rejected: { variant: 'danger', label: '已拒绝' },
      expired: { variant: 'default', label: '已过期' },
      pending_payment: { variant: 'warning', label: '待付款' },
      paid: { variant: 'info', label: '已付款' },
      shipping: { variant: 'info', label: '运输中' },
      received: { variant: 'success', label: '已收货' },
      completed: { variant: 'success', label: '已完成' },
    };
    const cfg = map[status] || { variant: 'default' as const, label: status };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const getProgressSteps = () => ['待付款', '已付款', '运输中', '已收货', '已完成'];

  const stats = [
    { label: '待处理报价', value: inquiries.filter(i => i.status === 'quoted').length, icon: MessageSquare, color: 'from-blue-500 to-cyan-500' },
    { label: '已收藏货源', value: favorites.length, icon: Heart, color: 'from-red-500 to-pink-500' },
    { label: '采购中订单', value: orders.filter(o => !['completed', 'received'].includes(o.status)).length, icon: ShoppingCart, color: 'from-green-500 to-emerald-500' },
    { label: '累计采购量', value: '1,280', unit: '吨', icon: Package, color: 'from-purple-500 to-indigo-500' },
  ];

  return (
    <Layout requireAuth>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <ShoppingCart className="w-7 h-7" />
                采购方工作台
              </h1>
              <p className="text-blue-100 mt-1">
                欢迎回来，{user?.companyName || '采购经理'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />刷新
              </Button>
              <Button className="bg-white text-blue-600 hover:bg-white/90" onClick={() => navigate('/supplies')}>
                去市场找货 <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">{stat.label}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold">{stat.value}</span>
                      {stat.unit && <span className="text-sm text-blue-100">{stat.unit}</span>}
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Search, label: '去市场找货', path: '/supplies', color: 'bg-blue-50 text-blue-600' },
            { icon: MessageSquare, label: '批量询价', path: '/supplies', color: 'bg-green-50 text-green-600' },
            { icon: ShoppingCart, label: '发起采购', path: '/supplies', color: 'bg-purple-50 text-purple-600' },
            { icon: BarChart3, label: '数据看板', path: '/dashboard', color: 'bg-orange-50 text-orange-600' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className={`${item.color} rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all group`}
            >
              <item.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{item.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex border-b border-slate-100">
            {[
              { key: 'inquiries', label: '我的询价', icon: MessageSquare, count: inquiries.length },
              { key: 'favorites', label: '货源收藏', icon: Heart, count: favorites.length },
              { key: 'orders', label: '采购订单', icon: ShoppingCart, count: orders.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : (
              <>
                {activeTab === 'inquiries' && (
                  <div className="space-y-3">
                    {inquiries.length === 0 ? (
                      <Empty title="暂无询价" description="去市场找货后发起询价" />
                    ) : (
                      inquiries.map((inq) => (
                        <div key={inq.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{inq.category}</span>
                              {getStatusBadge(inq.status)}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                              <span>目标: {inq.targetAmount}吨 × ¥{inq.targetPrice.toLocaleString()}/吨</span>
                              {inq.replies > 0 && <span className="text-blue-600">{inq.replies}条回复</span>}
                              {inq.stationName !== '-' && <span>最近: {inq.stationName}</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-400">{inq.createdAt}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {inq.status === 'quoted' && (
                                <Button size="sm" variant="primary" className="text-xs">
                                  <Eye className="w-3 h-3 mr-1" />查看报价
                                </Button>
                              )}
                              {inq.status === 'pending' && (
                                <Button size="sm" variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />等待回复
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'favorites' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.length === 0 ? (
                      <Empty title="暂无收藏" description="浏览货源市场时可以收藏感兴趣的货源" />
                    ) : (
                      favorites.map((fav) => (
                        <div key={fav.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all group">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">{fav.category}</span>
                                {fav.certified && <Badge variant="success">已认证</Badge>}
                              </div>
                              <div className="mt-2 space-y-1 text-sm text-slate-500">
                                <p>纯度: {fav.purity} · 吨位: {fav.weight}吨</p>
                                <p>位置: {fav.location}</p>
                                <p>供应商: {fav.stationName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">¥{fav.price.toLocaleString()}</p>
                              <p className="text-xs text-slate-400">元/吨</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                            <Button size="sm" variant="primary" className="flex-1">
                              <MessageSquare className="w-3 h-3 mr-1" />立即询价
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                              <X className="w-3 h-3 mr-1" />取消收藏
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <Empty title="暂无订单" description="询价确认后会生成采购订单" />
                    ) : (
                      orders.map((order) => {
                        const steps = getProgressSteps();
                        return (
                          <div key={order.id} className="border border-slate-200 rounded-xl p-5">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-slate-500">{order.id}</span>
                                  {getStatusBadge(order.status)}
                                </div>
                                <div className="mt-2 flex items-center gap-4">
                                  <span className="font-semibold text-slate-800">{order.category}</span>
                                  <span className="text-sm text-slate-500">{order.quantity}吨</span>
                                  <span className="text-sm text-slate-500">供应商: {order.supplierName}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-800">¥{(order.amount / 10000).toFixed(1)}万</p>
                                <p className="text-xs text-slate-400">{order.createdAt}</p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                {steps.map((step, idx) => (
                                  <div key={idx} className="flex items-center">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                      idx < order.progress
                                        ? 'bg-blue-500 text-white'
                                        : idx === order.progress - 1
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-slate-200 text-slate-500'
                                    }`}>
                                      {idx < order.progress ? (
                                        <CheckCircle className="w-4 h-4" />
                                      ) : (
                                        idx + 1
                                      )}
                                    </div>
                                    {idx < steps.length - 1 && (
                                      <div className={`w-16 h-0.5 mx-1 ${
                                        idx < order.progress - 1 ? 'bg-blue-500' : 'bg-slate-200'
                                      }`} />
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                {steps.map((step, idx) => (
                                  <span key={idx} className={idx < order.progress ? 'text-blue-600 font-medium' : ''}>{step}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                              {order.status === 'pending_payment' && (
                                <Button size="sm" variant="primary">立即付款</Button>
                              )}
                              {order.status === 'shipping' && (
                                <Button size="sm" variant="primary">确认收货</Button>
                              )}
                              <Button size="sm" variant="outline">
                                <Eye className="w-3 h-3 mr-1" />订单详情
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerWorkspace;
