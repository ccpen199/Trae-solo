import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { packageApi, reservationApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedPackage, setSelectedPackage } = useAppStore();
  const [featuredPackages, setFeaturedPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedPackages();
  }, []);

  const fetchFeaturedPackages = async () => {
    try {
      const response = await packageApi.getAll();
      setFeaturedPackages(response.data.slice(0, 3));
    } catch (error) {
      console.error('获取套餐列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    navigate('/reservation');
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            专业体检，守护健康
          </h1>
          <p className="text-lg text-blue-100 mb-6">
            选择适合您的体检套餐，智能预约，实时导检，一键获取报告。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/packages"
              className="px-6 py-3 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              浏览套餐
            </Link>
            <Link
              to="/reservations"
              className="px-6 py-3 bg-blue-500 bg-opacity-30 text-white rounded-lg font-medium hover:bg-opacity-40 transition-colors"
            >
              我的预约
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">在线预约</h3>
          <p className="text-sm text-gray-500">灵活选择套餐和时间</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">智能导检</h3>
          <p className="text-sm text-gray-500">动态优化检查流程</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">风险预警</h3>
          <p className="text-sm text-gray-500">异常指标实时提示</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">电子报告</h3>
          <p className="text-sm text-gray-500">一键生成PDF报告</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">精选套餐</h2>
          <Link
            to="/packages"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            查看全部 →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectPackage(pkg)}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{pkg.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-red-600">¥{pkg.price}</span>
                      <span className="text-sm text-gray-400 line-through">¥{pkg.originalPrice}</span>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      立即预约
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">体检流程</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-blue-600">
              1
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">选择套餐</h3>
            <p className="text-sm text-gray-500">浏览并选择合适的体检套餐</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-blue-600">
              2
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">在线预约</h3>
            <p className="text-sm text-gray-500">选择方便的日期和时间</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-blue-600">
              3
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">现场体检</h3>
            <p className="text-sm text-gray-500">智能导检，高效完成检查</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-blue-600">
              4
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">获取报告</h3>
            <p className="text-sm text-gray-500">在线查看电子体检报告</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
