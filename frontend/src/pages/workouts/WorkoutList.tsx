import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workoutApi, goalApi } from '../../services/api';
import { useToastStore } from '../../store';
import {
  Activity,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Undo2,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Flame,
  Star
} from 'lucide-react';
import dayjs from 'dayjs';

const WorkoutList: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total: 0, total_pages: 0 });
  const [filters, setFilters] = useState({
    plan_id: '',
    workout_type: '',
    start_date: '',
    end_date: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [revokeModal, setRevokeModal] = useState<{ id: number | null; reason: string }>({ id: null, reason: '' });

  const workoutTypeLabels: Record<string, string> = {
    running: '跑步',
    cycling: '骑行',
    swimming: '游泳',
    walking: '步行',
    strength: '力量训练',
    hiit: 'HIIT',
    yoga: '瑜伽',
    other: '其他'
  };

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    skipped: 'bg-gray-100 text-gray-700',
    pending_review: 'bg-blue-100 text-blue-700',
    revoked: 'bg-red-100 text-red-700'
  };

  const statusLabels: Record<string, string> = {
    completed: '已完成',
    partial: '部分完成',
    skipped: '已跳过',
    pending_review: '待审核',
    revoked: '已撤销'
  };

  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        page_size: pagination.page_size
      };
      if (filters.plan_id) params.plan_id = filters.plan_id;
      if (filters.workout_type) params.workout_type = filters.workout_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await workoutApi.getWorkouts(params);
      if (response.data.success) {
        setWorkouts(response.data.data.list);
        setPagination({
          page: response.data.data.page,
          page_size: response.data.data.page_size,
          total: response.data.data.total,
          total_pages: Math.ceil(response.data.data.total / response.data.data.page_size)
        });
      }
    } catch (error) {
      addToast('error', '加载运动记录失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.page_size, filters, addToast]);

  const loadPlans = async () => {
    try {
      const response = await goalApi.getPlans({ status: 'active' });
      if (response.data.success) {
        setPlans(response.data.data.list || response.data.data);
      }
    } catch (error) {
      console.error('加载计划列表失败', error);
    }
  };

  useEffect(() => {
    loadWorkouts();
    loadPlans();
  }, [loadWorkouts]);

  const handleRevoke = async () => {
    if (!revokeModal.id) return;
    try {
      const response = await workoutApi.revokeWorkout(revokeModal.id, { reason: revokeModal.reason });
      if (response.data.success) {
        addToast('success', '记录已撤销');
        setRevokeModal({ id: null, reason: '' });
        loadWorkouts();
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '撤销失败');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadWorkouts();
  };

  const handleReset = () => {
    setFilters({ plan_id: '', workout_type: '', start_date: '', end_date: '' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  if (loading && workouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">运动记录</h1>
          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-sm">
            共 {pagination.total} 条
          </span>
        </div>
        <button
          onClick={() => navigate('/workouts/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          记录运动
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索运动记录..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
                showFilters ? 'bg-primary-50 border-primary-500 text-primary-600' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              重置
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联计划</label>
                <select
                  value={filters.plan_id}
                  onChange={(e) => handleFilterChange('plan_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">全部计划</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.plan_name || `计划 #${plan.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">运动类型</label>
                <select
                  value={filters.workout_type}
                  onChange={(e) => handleFilterChange('workout_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">全部类型</option>
                  {Object.entries(workoutTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  运动类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时长
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  距离
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  卡路里
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  评分
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  风险
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workouts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无运动记录</p>
                    <Link
                      to="/workouts/create"
                      className="inline-block mt-3 text-primary-600 hover:underline"
                    >
                      + 创建第一条记录
                    </Link>
                  </td>
                </tr>
              ) : (
                workouts.map((workout) => (
                  <tr key={workout.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {workoutTypeLabels[workout.workout_type] || workout.workout_type}
                          </p>
                          {workout.plan_id && (
                            <p className="text-xs text-gray-500">计划 #{workout.plan_id}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {dayjs(workout.start_time).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {Math.round(workout.duration_seconds / 60)} 分钟
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{workout.distance?.toFixed(2) || 0} km</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-sm">{Math.round(workout.calories_burned)} kcal</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-gray-800">
                          {workout.performance_score || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[workout.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {statusLabels[workout.status] || workout.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {workout.risk_notes && workout.risk_notes.length > 0 ? (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs">有风险</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/workouts/${workout.id}`)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {workout.status !== 'revoked' && (
                          <button
                            onClick={() => setRevokeModal({ id: workout.id, reason: '' })}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="撤销记录"
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.total_pages > 1 && (
          <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              显示 {(pagination.page - 1) * pagination.page_size + 1} -{' '}
              {Math.min(pagination.page * pagination.page_size, pagination.total)} 条，共{' '}
              {pagination.total} 条
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                let pageNum;
                if (pagination.total_pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.total_pages - 2) {
                  pageNum = pagination.total_pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-lg font-medium transition ${
                      pagination.page === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.total_pages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {revokeModal.id !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">撤销运动记录</h3>
            <p className="text-sm text-gray-600 mb-4">
              撤销后该记录将被标记为已撤销，相关数据将不再计入统计。请输入撤销原因：
            </p>
            <textarea
              value={revokeModal.reason}
              onChange={(e) => setRevokeModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="请输入撤销原因..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRevokeModal({ id: null, reason: '' })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleRevoke}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                确认撤销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutList;
