import { useState, useEffect } from 'react';
import { BarChart3, Clock, ThumbsUp, ThumbsDown, RefreshCw, TrendingUp, TrendingDown, Star, Users } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import DataTable from '../../components/UI/DataTable';
import StatCard from '../../components/UI/StatCard';
import { adminApi } from '../../lib/api';

interface ServiceMetric {
  name: string;
  avgDeliveryTime: number;
  complaintRate: number;
  repurchaseRate: number;
  totalOrders: number;
}

interface Review {
  id: string;
  userName: string;
  serviceType: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function QualityBoard() {
  const [metrics, setMetrics] = useState<ServiceMetric[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [metricsRes, reviewsRes] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getReviews()
      ]);
      setMetrics((metricsRes.data as ServiceMetric[]) || []);
      setReviews((reviewsRes.data as Review[]) || []);
    } catch (error) {
      setMetrics([
        { name: '快递服务', avgDeliveryTime: 45, complaintRate: 1.2, repurchaseRate: 68, totalOrders: 1256 },
        { name: '存储服务', avgDeliveryTime: 0, complaintRate: 0.5, repurchaseRate: 75, totalOrders: 892 },
        { name: '洗衣服务', avgDeliveryTime: 24 * 60, complaintRate: 2.1, repurchaseRate: 55, totalOrders: 567 },
        { name: '家政服务', avgDeliveryTime: 0, complaintRate: 1.8, repurchaseRate: 62, totalOrders: 423 },
      ]);
      setReviews([
        { id: '1', userName: '张*明', serviceType: '快递服务', rating: 5, comment: '取件非常方便，柜子位置很好找', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', userName: '李*华', serviceType: '洗衣服务', rating: 4, comment: '洗得很干净，就是时间有点长', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', userName: '王*芳', serviceType: '家政服务', rating: 5, comment: '阿姨打扫得很仔细，非常满意', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '4', userName: '赵*强', serviceType: '存储服务', rating: 3, comment: '价格有点贵，希望能有优惠', createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: '5', userName: '陈*丽', serviceType: '快递服务', rating: 2, comment: '柜子坏了，取件遇到问题', createdAt: new Date(Date.now() - 259200000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const reviewColumns = [
    { key: 'userName', title: '用户' },
    { key: 'serviceType', title: '服务类型' },
    {
      key: 'rating',
      title: '评分',
      render: (row: Review) => (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < row.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
            />
          ))}
        </div>
      )
    },
    { key: 'comment', title: '评价内容' },
    {
      key: 'createdAt',
      title: '时间',
      render: (row: Review) => new Date(row.createdAt).toLocaleString('zh-CN')
    }
  ];

  const overallMetrics = {
    avgDeliveryTime: metrics.length > 0 ? Math.round(
      metrics.filter(m => m.avgDeliveryTime > 0).reduce((sum, m) => sum + m.avgDeliveryTime, 0) /
      metrics.filter(m => m.avgDeliveryTime > 0).length
    ) : 0,
    complaintRate: metrics.length > 0 ? (
      metrics.reduce((sum, m) => sum + m.complaintRate * m.totalOrders, 0) /
      metrics.reduce((sum, m) => sum + m.totalOrders, 0)
    ).toFixed(2) : 0,
    repurchaseRate: metrics.length > 0 ? Math.round(
      metrics.reduce((sum, m) => sum + m.repurchaseRate * m.totalOrders, 0) /
      metrics.reduce((sum, m) => sum + m.totalOrders, 0)
    ) : 0,
    totalUsers: 12580
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-emerald-600';
    if (rating >= 3) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-sky-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">服务质量看板</h1>
              <p className="text-slate-500">监控各服务线的质量指标和用户反馈</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            title="平均配送时效"
            value={`${overallMetrics.avgDeliveryTime} 分钟`}
            icon={<Clock className="w-6 h-6" />}
            trend={-5.2}
            trendLabel="较上月"
            color="sky"
          />
          <StatCard
            title="投诉率"
            value={`${overallMetrics.complaintRate}%`}
            icon={<ThumbsDown className="w-6 h-6" />}
            trend={-0.3}
            trendLabel="较上月"
            color="red"
          />
          <StatCard
            title="复购率"
            value={`${overallMetrics.repurchaseRate}%`}
            icon={<ThumbsUp className="w-6 h-6" />}
            trend={2.8}
            trendLabel="较上月"
            color="emerald"
          />
          <StatCard
            title="活跃用户"
            value={overallMetrics.totalUsers.toLocaleString()}
            icon={<Users className="w-6 h-6" />}
            trend={12}
            trendLabel="较上月"
            color="amber"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">各服务线对比</h2>
          </div>
          <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map(metric => (
              <div key={metric.name} className="border border-slate-200 rounded-lg p-4 hover:border-sky-300 transition-colors">
                <h3 className="font-semibold text-slate-800 mb-4">{metric.name}</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">总订单</span>
                      <span className="font-medium text-slate-800">{metric.totalOrders}</span>
                    </div>
                  </div>
                  
                  {metric.avgDeliveryTime > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">平均时效</span>
                        <span className="font-medium text-slate-800">
                          {metric.avgDeliveryTime > 60 
                            ? `${Math.round(metric.avgDeliveryTime / 60)}小时` 
                            : `${metric.avgDeliveryTime}分钟`}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">投诉率</span>
                      <span className={`font-medium ${metric.complaintRate > 2 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {metric.complaintRate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${metric.complaintRate > 2 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(metric.complaintRate * 20, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">复购率</span>
                      <span className="font-medium text-sky-600">{metric.repurchaseRate}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500"
                        style={{ width: `${metric.repurchaseRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">最近评价</h2>
          </div>
          <DataTable
            columns={reviewColumns}
            data={reviews}
            loading={loading}
            emptyText="暂无评价"
          />
        </div>
      </div>
    </Layout>
  );
}
