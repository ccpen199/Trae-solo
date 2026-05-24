import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workoutApi } from '../../services/api';
import { useToastStore } from '../../store';
import {
  ArrowLeft,
  Undo2,
  Activity,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Flame,
  Star,
  AlertTriangle,
  RefreshCw,
  FileText,
  Watch,
  Target
} from 'lucide-react';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const WorkoutDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<any>(null);
  const [revokeModal, setRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

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

  const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6'];

  const heartRateZoneLabels: Record<string, string> = {
    zone1: '热身区 (60%以下)',
    zone2: '燃脂区 (60-70%)',
    zone3: '有氧区 (70-80%)',
    zone4: '无氧区 (80-90%)',
    zone5: '极限区 (90%以上)'
  };

  useEffect(() => {
    if (id) {
      loadWorkoutDetail();
    }
  }, [id]);

  const loadWorkoutDetail = async () => {
    try {
      setLoading(true);
      const response = await workoutApi.getWorkout(parseInt(id!));
      if (response.data.success) {
        setWorkout(response.data.data);
      }
    } catch (error) {
      addToast('error', '加载运动详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      const response = await workoutApi.revokeWorkout(parseInt(id!), { reason: revokeReason });
      if (response.data.success) {
        addToast('success', '记录已撤销');
        setRevokeModal(false);
        loadWorkoutDetail();
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '撤销失败');
    }
  };

  const getHeartRateZoneData = () => {
    if (!workout?.heart_rate_zones) return [];
    return Object.entries(workout.heart_rate_zones).map(([key, value]: [string, any]) => ({
      name: heartRateZoneLabels[key] || key,
      value: value.percentage || value
    }));
  };

  const getTrackBounds = () => {
    if (!workout?.track_data || workout.track_data.length === 0) return null;
    const lats = workout.track_data.map((p: any) => p.latitude);
    const lngs = workout.track_data.map((p: any) => p.longitude);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  };

  const getTrackSvgPath = () => {
    if (!workout?.track_data || workout.track_data.length === 0) return '';
    const bounds = getTrackBounds();
    if (!bounds) return '';

    const width = 600;
    const height = 300;
    const padding = 20;

    const latRange = bounds.maxLat - bounds.minLat || 0.01;
    const lngRange = bounds.maxLng - bounds.minLng || 0.01;

    const points = workout.track_data.map((p: any) => {
      const x = ((p.longitude - bounds.minLng) / lngRange) * (width - padding * 2) + padding;
      const y = height - ((p.latitude - bounds.minLat) / latRange) * (height - padding * 2) - padding;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Activity className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500">未找到该运动记录</p>
        <button
          onClick={() => navigate('/workouts')}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workouts')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">运动详情</h1>
            <p className="text-sm text-gray-500">
              {dayjs(workout.start_time).format('YYYY年MM月DD日 HH:mm')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[workout.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {statusLabels[workout.status] || workout.status}
          </span>
          {workout.status !== 'revoked' && (
            <button
              onClick={() => setRevokeModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition"
            >
              <Undo2 className="w-4 h-4" />
              撤销记录
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">运动类型</p>
              <p className="font-semibold text-gray-800">
                {workoutTypeLabels[workout.workout_type] || workout.workout_type}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">运动时长</p>
              <p className="font-semibold text-gray-800">
                {Math.round(workout.duration_seconds / 60)} 分钟
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">消耗卡路里</p>
              <p className="font-semibold text-gray-800">
                {Math.round(workout.calories_burned)} kcal
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">表现评分</p>
              <p className="font-semibold text-gray-800">{workout.performance_score || '-'} 分</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">开始时间</p>
                  <p className="text-sm text-gray-800">
                    {dayjs(workout.start_time).format('YYYY-MM-DD HH:mm:ss')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">结束时间</p>
                  <p className="text-sm text-gray-800">
                    {dayjs(workout.end_time).format('YYYY-MM-DD HH:mm:ss')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">运动距离</p>
                  <p className="text-sm text-gray-800">{workout.distance?.toFixed(2) || 0} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">平均心率</p>
                  <p className="text-sm text-gray-800">{workout.avg_heart_rate || '-'} bpm</p>
                </div>
              </div>
              {workout.plan_id && (
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">关联计划</p>
                    <p className="text-sm text-gray-800">计划 #{workout.plan_id}</p>
                  </div>
                </div>
              )}
              {workout.device_id && (
                <div className="flex items-center gap-3">
                  <Watch className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">关联设备</p>
                    <p className="text-sm text-gray-800">设备 #{workout.device_id}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {workout.track_data && workout.track_data.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                运动轨迹
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <svg viewBox="0 0 600 300" className="w-full h-64">
                  <defs>
                    <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <path
                    d={getTrackSvgPath()}
                    fill="none"
                    stroke="url(#trackGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {workout.track_data.length > 0 && (
                    <>
                      <circle
                        cx={
                          ((workout.track_data[0].longitude - getTrackBounds()!.minLng) /
                            (getTrackBounds()!.maxLng - getTrackBounds()!.minLng || 0.01)) *
                            560 +
                          20
                        }
                        cy={
                          300 -
                            ((workout.track_data[0].latitude - getTrackBounds()!.minLat) /
                              (getTrackBounds()!.maxLat - getTrackBounds()!.minLat || 0.01)) *
                              260 -
                            20
                        }
                        r="6"
                        fill="#22c55e"
                      />
                      <circle
                        cx={
                          ((workout.track_data[workout.track_data.length - 1].longitude -
                            getTrackBounds()!.minLng) /
                            (getTrackBounds()!.maxLng - getTrackBounds()!.minLng || 0.01)) *
                            560 +
                          20
                        }
                        cy={
                          300 -
                            ((workout.track_data[workout.track_data.length - 1].latitude -
                              getTrackBounds()!.minLat) /
                              (getTrackBounds()!.maxLat - getTrackBounds()!.minLat || 0.01)) *
                              260 -
                            20
                        }
                        r="6"
                        fill="#ef4444"
                      />
                    </>
                  )}
                </svg>
                <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span> 起点
                  </span>
                  <span>共 {workout.track_data.length} 个轨迹点</span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span> 终点
                  </span>
                </div>
              </div>
            </div>
          )}

          {workout.notes && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                备注
              </h3>
              <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{workout.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {workout.heart_rate_zones && Object.keys(workout.heart_rate_zones).length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">心率区间分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getHeartRateZoneData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ value }) => `${value}%`}
                    >
                      {getHeartRateZoneData().map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, '占比']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {getHeartRateZoneData().map((zone, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className="text-gray-600">{zone.name}</span>
                    </div>
                    <span className="font-medium text-gray-800">{zone.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workout.recovery_suggestion && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                恢复建议
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    1
                  </span>
                  <p className="text-sm text-gray-700">{workout.recovery_suggestion}</p>
                </div>
              </div>
            </div>
          )}

          {workout.risk_notes && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                风险提示
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-gray-700">{workout.risk_notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {revokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">撤销运动记录</h3>
            <p className="text-sm text-gray-600 mb-4">
              撤销后该记录将被标记为已撤销，相关数据将不再计入统计。请输入撤销原因：
            </p>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="请输入撤销原因..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRevokeModal(false);
                  setRevokeReason('');
                }}
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

export default WorkoutDetail;
