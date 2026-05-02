import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { tourApi, businessApi } from '../../services/api';
import { Tour, UserRole } from '../../types';

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toursResponse, statsResponse] = await Promise.all([
          tourApi.getPublicList({ page: 1, pageSize: 6 }),
          user && user.role !== UserRole.TOURIST
            ? businessApi.getBusinessStatistics().catch(() => null)
            : null,
        ]);
        setTours(toursResponse.data);
        setStats(statsResponse);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (user && user.role !== UserRole.TOURIST) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-500 mt-1">欢迎回来，{user.name}</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">总营收</p>
                <p className="text-2xl font-bold text-primary-600 mt-2">
                  ¥{stats.totalRevenue?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">总订单</p>
                <p className="text-2xl font-bold text-success-600 mt-2">
                  {stats.totalOrders || 0}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">总游客</p>
                <p className="text-2xl font-bold text-warning-600 mt-2">
                  {stats.totalTourists || 0}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">成团率</p>
                <p className="text-2xl font-bold text-primary-600 mt-2">
                  {stats.confirmationRate || '0%'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-lg font-semibold">热门线路</h2>
              <Link to="/tours" className="text-primary-600 text-sm hover:text-primary-700">
                查看全部 →
              </Link>
            </div>
            <div className="card-body">
              {stats?.topTours && stats.topTours.length > 0 ? (
                <div className="space-y-4">
                  {stats.topTours.slice(0, 5).map((tour: any, index: number) => (
                    <div key={tour.tourId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-medium flex items-center justify-center mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{tour.tourName}</p>
                          <p className="text-sm text-gray-500">{tour.orders} 订单</p>
                        </div>
                      </div>
                      <p className="font-semibold text-primary-600">
                        ¥{tour.revenue?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">暂无数据</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">快速操作</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/tours"
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <span className="text-2xl mb-2 block">🗺️</span>
                  <p className="font-medium text-gray-900">线路管理</p>
                  <p className="text-sm text-gray-500">创建和管理线路</p>
                </Link>

                <Link
                  to="/groups"
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <span className="text-2xl mb-2 block">📅</span>
                  <p className="font-medium text-gray-900">团期管理</p>
                  <p className="text-sm text-gray-500">管理出团计划</p>
                </Link>

                <Link
                  to="/orders"
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <span className="text-2xl mb-2 block">📋</span>
                  <p className="font-medium text-gray-900">订单管理</p>
                  <p className="text-sm text-gray-500">处理订单和报名</p>
                </Link>

                <Link
                  to="/statistics"
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <span className="text-2xl mb-2 block">📊</span>
                  <p className="font-medium text-gray-900">数据统计</p>
                  <p className="text-sm text-gray-500">查看经营数据</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-r from-primary-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              探索世界，开启精彩旅程
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              精选优质旅游线路，专业导游团队，为您提供安全、舒适、难忘的旅行体验
            </p>
            <Link
              to="/tours"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
            >
              浏览线路 →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择我们</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              我们致力于为您提供最优质的旅游服务
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">品质保障</h3>
              <p className="text-gray-500">
                精选优质线路，专业团队全程服务，确保您的旅行体验
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">透明定价</h3>
              <p className="text-gray-500">
                明码标价，无隐形消费，让您的每一分钱都花得明白
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">安全保障</h3>
              <p className="text-gray-500">
                全程保险覆盖，专业客服24小时在线，让您出行无忧
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">热门线路</h2>
            <p className="text-gray-500">精选优质旅游线路，带您畅游天下</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : tours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tours.map((tour) => (
                <Link
                  key={tour.id}
                  to={`/tours/${tour.id}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center">
                    <span className="text-6xl">🌍</span>
                  </div>
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {tour.name}
                      </h3>
                      <span className="badge badge-primary">
                        {tour.days}天{tour.nights}晚
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {tour.description || `目的地: ${tour.destination}`}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-500 text-sm">成人价</span>
                        <p className="text-xl font-bold text-primary-600">
                          ¥{tour.basePrice.toLocaleString()}
                          <span className="text-sm font-normal text-gray-500">/人</span>
                        </p>
                      </div>
                      <span className="text-primary-600 font-medium">
                        查看详情 →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">暂无线路数据</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/tours"
              className="btn btn-primary px-8 py-3"
            >
              查看全部线路
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
