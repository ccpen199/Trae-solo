import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutApi, goalApi, deviceApi } from '../../services/api';
import { useToastStore } from '../../store';
import {
  ArrowLeft,
  Save,
  Activity,
  Watch,
  Calendar,
  MapPin,
  Heart,
  FileText,
  Star,
  Flame,
  AlertTriangle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const WorkoutCreate: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showHeartRateInput, setShowHeartRateInput] = useState(false);
  const [showTrackInput, setShowTrackInput] = useState(false);

  const [formData, setFormData] = useState({
    plan_id: '',
    device_id: '',
    workout_type: 'running',
    start_time: dayjs().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'),
    end_time: dayjs().format('YYYY-MM-DDTHH:mm'),
    distance: '',
    avg_heart_rate: '',
    heart_rate_samples: '',
    track_data: '',
    notes: ''
  });

  const workoutTypeOptions = [
    { value: 'running', label: '跑步' },
    { value: 'cycling', label: '骑行' },
    { value: 'swimming', label: '游泳' },
    { value: 'walking', label: '步行' },
    { value: 'strength', label: '力量训练' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'yoga', label: '瑜伽' },
    { value: 'other', label: '其他' }
  ];

  const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6'];

  const heartRateZoneLabels: Record<string, string> = {
    zone1: '热身区 (60%以下)',
    zone2: '燃脂区 (60-70%)',
    zone3: '有氧区 (70-80%)',
    zone4: '无氧区 (80-90%)',
    zone5: '极限区 (90%以上)'
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const [plansRes, devicesRes] = await Promise.all([
        goalApi.getPlans({ status: 'active' }),
        deviceApi.getDevices({ status: 'active' })
      ]);
      setPlans(plansRes.data.data.list || plansRes.data.data || []);
      setDevices(devicesRes.data.data || []);
    } catch (error) {
      addToast('error', '加载选项失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!formData.workout_type) {
      addToast('error', '请选择运动类型');
      return false;
    }
    if (!formData.start_time || !formData.end_time) {
      addToast('error', '请选择起止时间');
      return false;
    }
    if (dayjs(formData.end_time).isBefore(dayjs(formData.start_time))) {
      addToast('error', '结束时间不能早于开始时间');
      return false;
    }
    return true;
  };

  const parseHeartRateSamples = () => {
    if (!formData.heart_rate_samples.trim()) return null;
    try {
      const samples = formData.heart_rate_samples
        .split(/[,\s\n]+/)
        .filter((s) => s.trim())
        .map((s) => {
          const num = parseInt(s.trim(), 10);
          if (isNaN(num) || num < 30 || num > 220) {
            throw new Error(`无效心率值: ${s}`);
          }
          return num;
        });
      return samples;
    } catch (error: any) {
      addToast('error', error.message || '心率样本格式错误');
      return null;
    }
  };

  const parseTrackData = () => {
    if (!formData.track_data.trim()) return null;
    try {
      const points = formData.track_data
        .split(/\n+/)
        .filter((s) => s.trim())
        .map((line, index) => {
          const parts = line.split(/[,\s]+/).filter((s) => s.trim());
          if (parts.length < 2) {
            throw new Error(`轨迹点格式错误，应为: 纬度,经度 [,海拔]`);
          }
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          const alt = parts[2] ? parseFloat(parts[2]) : null;
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new Error(`无效经纬度: ${line}`);
          }
          return {
            timestamp: dayjs(formData.start_time).add(index * 30, 'second').toISOString(),
            latitude: lat,
            longitude: lng,
            altitude: alt
          };
        });
      return points;
    } catch (error: any) {
      addToast('error', error.message || '轨迹数据格式错误');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const heartRateSamples = showHeartRateInput ? parseHeartRateSamples() : null;
    if (showHeartRateInput && heartRateSamples === null) return;

    const trackData = showTrackInput ? parseTrackData() : null;
    if (showTrackInput && trackData === null) return;

    setSubmitting(true);
    try {
      const submitData: any = {
        workout_type: formData.workout_type,
        start_time: formData.start_time,
        end_time: formData.end_time
      };

      if (formData.plan_id) submitData.plan_id = parseInt(formData.plan_id);
      if (formData.device_id) submitData.device_id = parseInt(formData.device_id);
      if (formData.distance) submitData.distance = parseFloat(formData.distance);
      if (formData.avg_heart_rate) submitData.avg_heart_rate = parseInt(formData.avg_heart_rate);
      if (heartRateSamples) submitData.heart_rate_samples = heartRateSamples;
      if (trackData) submitData.track_data = trackData;
      if (formData.notes) submitData.notes = formData.notes;

      const response = await workoutApi.createWorkout(submitData);
      if (response.data.success) {
        setAnalysisResult(response.data.data);
        addToast('success', '运动记录创建成功');
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    navigate('/workouts');
  };

  const handleCreateAnother = () => {
    setFormData({
      plan_id: '',
      device_id: '',
      workout_type: 'running',
      start_time: dayjs().subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      end_time: dayjs().format('YYYY-MM-DDTHH:mm'),
      distance: '',
      avg_heart_rate: '',
      heart_rate_samples: '',
      track_data: '',
      notes: ''
    });
    setAnalysisResult(null);
    setShowHeartRateInput(false);
    setShowTrackInput(false);
  };

  const getHeartRateZoneData = () => {
    if (!analysisResult?.heart_rate_zones) return [];
    return Object.entries(analysisResult.heart_rate_zones).map(([key, value]: [string, any]) => ({
      name: heartRateZoneLabels[key] || key,
      value: value.percentage || value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (analysisResult) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workouts')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">运动分析结果</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">运动表现评分</p>
                <p className="text-3xl font-bold text-gray-800">
                  {analysisResult.performance_score}
                  <span className="text-lg font-normal text-gray-500">分</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">消耗卡路里</p>
                <p className="text-3xl font-bold text-gray-800">
                  {Math.round(analysisResult.calories_burned)}
                  <span className="text-lg font-normal text-gray-500">kcal</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">训练效果</p>
                <p className="text-3xl font-bold text-gray-800">
                  {analysisResult.training_effect || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">心率区间分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getHeartRateZoneData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ value }) => `${value}%`}
                  >
                    {getHeartRateZoneData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, '占比']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">恢复建议</h3>
            <div className="space-y-3">
              {analysisResult.recovery_suggestion ? (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <RefreshCw className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{analysisResult.recovery_suggestion}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">暂无恢复建议</p>
              )}
            </div>
          </div>
        </div>

        {analysisResult.risk_notes && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              风险提示
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-gray-700">{analysisResult.risk_notes}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCreateAnother}
            className="px-6 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
          >
            继续记录
          </button>
          <button
            onClick={handleContinue}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/workouts')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">记录运动</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Activity className="w-4 h-4 inline mr-1" />
                关联计划
              </label>
              <select
                value={formData.plan_id}
                onChange={(e) => handleInputChange('plan_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">选择计划（可选）</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.plan_name || `计划 #${plan.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Watch className="w-4 h-4 inline mr-1" />
                关联设备
              </label>
              <select
                value={formData.device_id}
                onChange={(e) => handleInputChange('device_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">选择设备（可选）</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.device_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Activity className="w-4 h-4 inline mr-1" />
              运动类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {workoutTypeOptions.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleInputChange('workout_type', type.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    formData.workout_type === type.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                开始时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                结束时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                距离 (km)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.distance}
                onChange={(e) => handleInputChange('distance', e.target.value)}
                placeholder="例如: 5.2"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Heart className="w-4 h-4 inline mr-1" />
                平均心率 (bpm)
              </label>
              <input
                type="number"
                min="30"
                max="220"
                value={formData.avg_heart_rate}
                onChange={(e) => handleInputChange('avg_heart_rate', e.target.value)}
                placeholder="例如: 145"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowHeartRateInput(!showHeartRateInput)}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            >
              <Heart className="w-4 h-4" />
              {showHeartRateInput ? '收起心率样本' : '添加心率样本数据'}
            </button>
            {showHeartRateInput && (
              <div className="mt-2">
                <textarea
                  value={formData.heart_rate_samples}
                  onChange={(e) => handleInputChange('heart_rate_samples', e.target.value)}
                  placeholder="输入心率样本，用逗号或空格分隔，例如: 120, 135, 142, 150, 145, 138"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">支持逗号、空格或换行分隔，范围: 30-220</p>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowTrackInput(!showTrackInput)}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            >
              <MapPin className="w-4 h-4" />
              {showTrackInput ? '收起轨迹数据' : '添加运动轨迹数据'}
            </button>
            {showTrackInput && (
              <div className="mt-2">
                <textarea
                  value={formData.track_data}
                  onChange={(e) => handleInputChange('track_data', e.target.value)}
                  placeholder="每行一个轨迹点，格式: 纬度,经度 [,海拔]&#10;例如:&#10;39.9042, 116.4074&#10;39.9045, 116.4078, 45"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none font-mono text-sm"
                  rows={5}
                />
                <p className="text-xs text-gray-500 mt-1">每行一个点，支持空格或逗号分隔经纬度，海拔可选</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              备注
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="记录运动感受、身体状态等..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/workouts')}
            className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? '提交中...' : '提交并分析'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutCreate;
