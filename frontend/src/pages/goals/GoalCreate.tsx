import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { goalApi } from '../../services/api';
import { useToastStore } from '../../store';
import { Target, ArrowLeft, Save, Activity, Scale, Heart, Zap } from 'lucide-react';
import dayjs from 'dayjs';

const GoalCreate: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    goal_type: 'fat_loss',
    target_value: '',
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    baseline_weight: '',
    baseline_body_fat: '',
    baseline_muscle_mass: '',
    baseline_running_distance: '',
    baseline_heart_rate: '',
    description: ''
  });

  const goalTypes = [
    { value: 'fat_loss', label: '减脂', icon: Scale, color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'muscle_gain', label: '增肌', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'running', label: '跑步', icon: Zap, color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'rehabilitation', label: '康复', icon: Heart, color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: 'general', label: '综合', icon: Target, color: 'text-gray-600', bg: 'bg-gray-100' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoalTypeChange = (type: string) => {
    setFormData((prev) => ({ ...prev, goal_type: type }));
  };

  const getTargetUnit = () => {
    switch (formData.goal_type) {
      case 'fat_loss':
        return 'kg';
      case 'muscle_gain':
        return 'kg';
      case 'running':
        return 'km';
      default:
        return '';
    }
  };

  const getTargetPlaceholder = () => {
    switch (formData.goal_type) {
      case 'fat_loss':
        return '例如：5 (表示目标减重5kg)';
      case 'muscle_gain':
        return '例如：3 (表示目标增肌3kg)';
      case 'running':
        return '例如：100 (表示目标跑步100km)';
      default:
        return '请输入目标值';
    }
  };

  const validate = () => {
    if (!formData.target_value || Number(formData.target_value) <= 0) {
      addToast('error', '请输入有效的目标值');
      return false;
    }
    if (!formData.start_date || !formData.end_date) {
      addToast('error', '请选择起止日期');
      return false;
    }
    if (dayjs(formData.end_date).isBefore(dayjs(formData.start_date))) {
      addToast('error', '结束日期不能早于开始日期');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const baselineData: any = {};
      if (formData.baseline_weight) baselineData.weight = Number(formData.baseline_weight);
      if (formData.baseline_body_fat) baselineData.body_fat = Number(formData.baseline_body_fat);
      if (formData.baseline_muscle_mass) baselineData.muscle_mass = Number(formData.baseline_muscle_mass);
      if (formData.baseline_running_distance)
        baselineData.running_distance = Number(formData.baseline_running_distance);
      if (formData.baseline_heart_rate) baselineData.heart_rate = Number(formData.baseline_heart_rate);

      const submitData = {
        goal_type: formData.goal_type,
        target_value: Number(formData.target_value),
        start_date: formData.start_date,
        end_date: formData.end_date,
        baseline_data: Object.keys(baselineData).length > 0 ? baselineData : undefined,
        description: formData.description || undefined
      };

      const response = await goalApi.createGoal(submitData);
      if (response.data.success) {
        addToast('success', '目标创建成功');
        navigate('/goals');
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/goals"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">创建目标</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">选择目标类型</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {goalTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.goal_type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleGoalTypeChange(type.value)}
                  className={`p-4 rounded-xl border-2 transition text-center ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`w-12 h-12 ${type.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}
                  >
                    <Icon className={`w-6 h-6 ${type.color}`} />
                  </div>
                  <p className="font-medium text-gray-800">{type.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标值 ({getTargetUnit()})
              </label>
              <input
                type="number"
                name="target_value"
                value={formData.target_value}
                onChange={handleChange}
                placeholder={getTargetPlaceholder()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始日期
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                结束日期
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标描述
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="例如：夏天前减掉5kg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">基线数据（可选）</h2>
          <p className="text-sm text-gray-500 mb-4">填写当前身体数据，以便后续追踪进度变化</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                体重 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="baseline_weight"
                value={formData.baseline_weight}
                onChange={handleChange}
                placeholder="例如：70.5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                体脂率 (%)
              </label>
              <input
                type="number"
                step="0.1"
                name="baseline_body_fat"
                value={formData.baseline_body_fat}
                onChange={handleChange}
                placeholder="例如：20.5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                肌肉量 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="baseline_muscle_mass"
                value={formData.baseline_muscle_mass}
                onChange={handleChange}
                placeholder="例如：35.0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                单次跑步距离 (km)
              </label>
              <input
                type="number"
                step="0.1"
                name="baseline_running_distance"
                value={formData.baseline_running_distance}
                onChange={handleChange}
                placeholder="例如：5.0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                静息心率 (次/分)
              </label>
              <input
                type="number"
                name="baseline_heart_rate"
                value={formData.baseline_heart_rate}
                onChange={handleChange}
                placeholder="例如：70"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            to="/goals"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? '创建中...' : '创建目标'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoalCreate;
