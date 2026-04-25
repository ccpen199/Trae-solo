import { useState, useEffect } from 'react';
import { dashboardAPI, productsAPI } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [priceComparison, setPriceComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboardRes, productsRes] = await Promise.all([
        dashboardAPI.getStats(),
        productsAPI.getAll()
      ]);
      
      setStats(dashboardRes.data.stats);
      setRecentProducts(dashboardRes.data.recentProducts);
      setPriceComparison(dashboardRes.data.priceComparison);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const priceChartData = {
    labels: priceComparison.map(item => item.product_name),
    datasets: [
      {
        label: '最低价',
        data: priceComparison.map(item => item.min_price),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: '平均价',
        data: priceComparison.map(item => item.avg_price),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: '最高价',
        data: priceComparison.map(item => item.max_price),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  const stockStatusData = {
    labels: ['有库存', '库存紧张', '缺货'],
    datasets: [
      {
        data: [
          recentProducts.filter(p => p.stock_status === 'In Stock').length,
          recentProducts.filter(p => p.stock_status === 'Limited Stock').length,
          recentProducts.filter(p => p.stock_status === 'Out of Stock').length,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">监控仪表盘</h1>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">监控竞品</p>
              <p className="text-3xl font-bold text-gray-800">{stats?.total_competitors || 0}</p>
            </div>
            <div className="text-4xl">🏪</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">监控产品</p>
              <p className="text-3xl font-bold text-gray-800">{stats?.total_products || 0}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">未读告警</p>
              <p className="text-3xl font-bold text-red-500">{stats?.unread_alerts || 0}</p>
            </div>
            <div className="text-4xl">🔔</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均价格</p>
              <p className="text-3xl font-bold text-green-500">
                ${stats?.avg_price ? stats.avg_price.toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 产品价格对比</h2>
          <div className="h-80">
            {priceComparison.length > 0 ? (
              <Bar data={priceChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                暂无价格对比数据
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📈 库存状态分布</h2>
          <div className="h-80">
            {recentProducts.length > 0 ? (
              <Doughnut data={stockStatusData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                暂无库存数据
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🕐 最近更新的产品</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  产品名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  竞品平台
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前价格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  原价
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  库存状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新时间
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.competitor_name}</div>
                    <div className="text-xs text-gray-400">{product.platform}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-green-600">
                      ${product.current_price?.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${
                      product.original_price > product.current_price ? 'line-through text-gray-400' : 'text-gray-600'
                    }`}>
                      ${product.original_price?.toFixed(2)}
                    </span>
                    {product.original_price > product.current_price && (
                      <span className="ml-2 text-xs text-red-500">
                        降价 {((product.original_price - product.current_price) / product.original_price * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stock_status === 'In Stock' 
                        ? 'bg-green-100 text-green-800'
                        : product.stock_status === 'Limited Stock'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock_status === 'In Stock' ? '有库存' : 
                       product.stock_status === 'Limited Stock' ? '库存紧张' : '缺货'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.recorded_at).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
