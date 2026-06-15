import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/Card';
import Loading from '../../components/Loading';

interface Stats {
  userCount: number;
  postCount: number;
  pendingPostCount: number;
  circleCount: number;
  activityCount: number;
  todayPosts: number;
  todayUsers: number;
  todayActivities: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: '用户总数', value: stats.userCount, icon: '👥', color: 'bg-blue-500' },
    { label: '爆料总数', value: stats.postCount, icon: '📝', color: 'bg-green-500' },
    { label: '待审核', value: stats.pendingPostCount, icon: '⏳', color: 'bg-yellow-500' },
    { label: '圈子数量', value: stats.circleCount, icon: '👨‍👩‍👧‍👦', color: 'bg-purple-500' },
    { label: '活动数量', value: stats.activityCount, icon: '🎉', color: 'bg-pink-500' },
  ] : [];

  if (loading) {
    return (
      <div className="py-12">
        <Loading text="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">数据概览</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">今日数据</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">新增爆料</span>
              <span className="font-semibold text-green-600">+{stats?.todayPosts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">新增用户</span>
              <span className="font-semibold text-blue-600">+{stats?.todayUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">新增活动</span>
              <span className="font-semibold text-purple-600">+{stats?.todayActivities || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">快捷操作</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/admin/reviews" className="p-4 bg-yellow-50 rounded-xl text-center hover:bg-yellow-100 transition-colors">
              <span className="text-2xl block mb-1">✅</span>
              <span className="text-sm text-gray-700">爆料审核</span>
            </Link>
            <Link to="/admin/heatmap" className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition-colors">
              <span className="text-2xl block mb-1">🗺️</span>
              <span className="text-sm text-gray-700">舆情热力图</span>
            </Link>
            <div className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100 transition-colors cursor-pointer">
              <span className="text-2xl block mb-1">👥</span>
              <span className="text-sm text-gray-700">用户管理</span>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center hover:bg-purple-100 transition-colors cursor-pointer">
              <span className="text-2xl block mb-1">⚙️</span>
              <span className="text-sm text-gray-700">系统设置</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
