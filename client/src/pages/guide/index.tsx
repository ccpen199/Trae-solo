import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { guideApi, groupApi, businessApi } from '../../services/api';
import { TourGroupStatus, UserRole, TripReport } from '../../types';
import dayjs from 'dayjs';

const statusBadgeClass: Record<TourGroupStatus, string> = {
  [TourGroupStatus.DRAFT]: 'badge-secondary',
  [TourGroupStatus.PUBLISHED]: 'badge-primary',
  [TourGroupStatus.FULL]: 'badge-warning',
  [TourGroupStatus.CONFIRMED]: 'badge-success',
  [TourGroupStatus.IN_PROGRESS]: 'badge-primary',
  [TourGroupStatus.COMPLETED]: 'badge-success',
  [TourGroupStatus.CANCELLED]: 'badge-danger',
};

const statusLabel: Record<TourGroupStatus, string> = {
  [TourGroupStatus.DRAFT]: '草稿',
  [TourGroupStatus.PUBLISHED]: '已发布',
  [TourGroupStatus.FULL]: '已满',
  [TourGroupStatus.CONFIRMED]: '已确认',
  [TourGroupStatus.IN_PROGRESS]: '进行中',
  [TourGroupStatus.COMPLETED]: '已完成',
  [TourGroupStatus.CANCELLED]: '已取消',
};

export const GuideTasksPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const result = await guideApi.getTasks({
          page: pagination.page,
          pageSize: pagination.pageSize,
        });
        setTasks(result.data);
        setPagination({
          ...pagination,
          total: result.total,
          totalPages: result.totalPages,
        });
      } catch (error) {
        console.error('获取任务列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [pagination.page, pagination.pageSize]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">我的任务</h1>
        <p className="text-gray-500 mt-1">查看您的出团任务</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {task.tour?.name}
                      </h3>
                      <span className={`badge ${statusBadgeClass[task.status]}`}>
                        {statusLabel[task.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>📅 {dayjs(task.startDate).format('YYYY-MM-DD')} - {dayjs(task.endDate).format('YYYY-MM-DD')}</span>
                      <span>👥 {task.passengerCount || 0} 人</span>
                      <span>团号: {task.code}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {task.status === TourGroupStatus.CONFIRMED && (
                      <button
                        onClick={async () => {
                          try {
                            await guideApi.startTour(task.id);
                            alert('行程已开始');
                            window.location.reload();
                          } catch (error: any) {
                            alert(error.message || '操作失败');
                          }
                        }}
                        className="btn btn-primary"
                      >
                        开始行程
                      </button>
                    )}
                    {task.status === TourGroupStatus.IN_PROGRESS && (
                      <>
                        <button
                          onClick={() => navigate(`/guide/reports/${task.id}`)}
                          className="btn btn-secondary"
                        >
                          行程上报
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('确定要结束此行程吗？')) {
                              try {
                                await guideApi.completeTour(task.id);
                                alert('行程已完成');
                                window.location.reload();
                              } catch (error: any) {
                                alert(error.message || '操作失败');
                              }
                            }
                          }}
                          className="btn btn-success"
                        >
                          结束行程
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => navigate(`/guide/tasks/${task.id}`)}
                      className="btn btn-secondary"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无任务</h3>
            <p className="text-gray-500">您目前没有出团任务</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const GuideReportPage: React.FC = () => {
  const { user } = useAuthStore();
  const [groupId, setGroupId] = useState<string>('');
  const [task, setTask] = useState<any>(null);
  const [reports, setReports] = useState<TripReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    dayNumber: 1,
    title: '',
    content: '',
    weather: '',
    issues: '',
    touristStatus: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!groupId) return;

      setLoading(true);
      try {
        const [taskData, reportsData] = await Promise.all([
          guideApi.getTask(groupId),
          guideApi.getReports(groupId),
        ]);
        setTask(taskData);
        setReports(reportsData.data);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;

    setSubmitting(true);
    try {
      await guideApi.createReport({
        groupId,
        ...formData,
      });
      alert('报告提交成功');
      setFormData({
        dayNumber: 1,
        title: '',
        content: '',
        weather: '',
        issues: '',
        touristStatus: '',
      });

      const reportsData = await guideApi.getReports(groupId);
      setReports(reportsData.data);
    } catch (error: any) {
      alert(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">行程上报</h1>
        <p className="text-gray-500 mt-1">记录行程中的情况和问题</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">新建报告</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">选择团期</label>
                <select
                  className="select"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  required
                >
                  <option value="">请选择团期</option>
                  <option value="demo">示例团期</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">天数</label>
                  <select
                    className="select"
                    value={formData.dayNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dayNumber: parseInt(e.target.value) }))}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => (
                      <option key={n} value={n}>第 {n} 天</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">天气</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如：晴、多云"
                    value={formData.weather}
                    onChange={(e) => setFormData((prev) => ({ ...prev, weather: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">报告标题 *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入报告标题"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="form-label">报告内容 *</label>
                <textarea
                  className="input h-32 resize-none"
                  placeholder="请详细描述行程情况"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="form-label">游客状态</label>
                <textarea
                  className="input h-20 resize-none"
                  placeholder="游客的整体状态，如：一切正常、部分游客身体不适等"
                  value={formData.touristStatus}
                  onChange={(e) => setFormData((prev) => ({ ...prev, touristStatus: e.target.value }))}
                />
              </div>

              <div>
                <label className="form-label">异常问题</label>
                <textarea
                  className="input h-20 resize-none"
                  placeholder="如遇任何问题请在此说明"
                  value={formData.issues}
                  onChange={(e) => setFormData((prev) => ({ ...prev, issues: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !groupId}
                className="w-full btn btn-primary"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <span className="loading-spinner mr-2"></span>
                    提交中...
                  </span>
                ) : (
                  '提交报告'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">历史报告</h2>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="loading-spinner"></div>
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{report.title}</h4>
                      <span className="text-sm text-gray-500">
                        第 {report.dayNumber} 天
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                      {report.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>报告人: {report.reporter?.name}</span>
                      <span>{dayjs(report.createdAt).format('MM-DD HH:mm')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">📝</span>
                <p className="text-gray-500">暂无报告</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const StatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const result = await businessApi.getBusinessStatistics({
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined,
        });
        setStats(result);
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
          <p className="text-gray-500 mt-1">查看经营数据和统计报表</p>
        </div>

        <div className="flex items-end gap-4">
          <div>
            <label className="form-label">开始日期</label>
            <input
              type="date"
              className="input"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">结束日期</label>
            <input
              type="date"
              className="input"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="loading-spinner"></div>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500 mb-1">总营收</p>
                <p className="text-3xl font-bold text-primary-600">
                  ¥{stats.totalRevenue?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500 mb-1">总订单数</p>
                <p className="text-3xl font-bold text-success-600">
                  {stats.totalOrders || 0}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500 mb-1">总游客数</p>
                <p className="text-3xl font-bold text-warning-600">
                  {stats.totalTourists || 0}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500 mb-1">成团率</p>
                <p className="text-3xl font-bold text-primary-600">
                  {stats.confirmationRate || '0%'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">团期统计</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary-600">{stats.totalGroups || 0}</p>
                    <p className="text-sm text-gray-500">总团期</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success-600">{stats.confirmedGroups || 0}</p>
                    <p className="text-sm text-gray-500">已成团</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-warning-600">
                      {(stats.totalGroups || 0) - (stats.confirmedGroups || 0)}
                    </p>
                    <p className="text-sm text-gray-500">未成团</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">热门线路排行榜</h2>
              </div>
              <div className="card-body">
                {stats.topTours && stats.topTours.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topTours.slice(0, 5).map((tour: any, index: number) => (
                      <div key={tour.tourId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{tour.tourName}</p>
                            <p className="text-xs text-gray-500">{tour.orders} 订单 · {tour.groups} 团期</p>
                          </div>
                        </div>
                        <p className="font-semibold text-primary-600">
                          ¥{tour.revenue?.toLocaleString() || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">暂无数据</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无数据</h3>
            <p className="text-gray-500">暂无统计数据</p>
          </div>
        </div>
      )}
    </div>
  );
};
