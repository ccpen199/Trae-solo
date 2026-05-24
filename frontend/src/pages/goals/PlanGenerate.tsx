import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { goalApi } from '../../services/api';
import { useToastStore } from '../../store';
import {
  Dumbbell,
  ArrowLeft,
  Sparkles,
  Save,
  Activity,
  Scale,
  Zap,
  Heart,
  Target,
  Calendar,
  Clock,
  Flame,
  CalendarDays
} from 'lucide-react';

const PlanGenerate: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const [formData, setFormData] = useState({
    goal_type: 'fat_loss',
    goal_id: ''
  });

  const goalTypes = [
    { value: 'fat_loss', label: '减脂', icon: Scale, color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'muscle_gain', label: '增肌', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'running', label: '跑步', icon: Zap, color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'rehabilitation', label: '康复', icon: Heart, color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: 'general', label: '综合', icon: Target, color: 'text-gray-600', bg: 'bg-gray-100' }
  ];

  const intensityLabels: Record<string, string> = {
    low: '低强度',
    medium: '中等强度',
    high: '高强度'
  };

  const intensityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };

  useEffect(() => {
    loadGoals();
  }, [formData.goal_type]);

  const loadGoals = async () => {
    try {
      const response = await goalApi.getGoals({ status: 'active' });
      if (response.data.success) {
        const allGoals = response.data.data.list || response.data.data || [];
        const filteredGoals = allGoals.filter((g: any) => g.goal_type === formData.goal_type);
        setGoals(filteredGoals);
        if (filteredGoals.length > 0) {
          setFormData((prev) => ({ ...prev, goal_id: filteredGoals[0].id.toString() }));
        } else {
          setFormData((prev) => ({ ...prev, goal_id: '' }));
        }
      }
    } catch (error) {
      console.error('加载目标失败', error);
    }
  };

  const handleGoalTypeChange = (type: string) => {
    setFormData((prev) => ({ ...prev, goal_type: type, goal_id: '' }));
    setGeneratedPlan(null);
  };

  const handleGoalSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, goal_id: e.target.value }));
    setGeneratedPlan(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data: any = {
        goal_type: formData.goal_type
      };
      if (formData.goal_id) {
        data.goal_id = Number(formData.goal_id);
      }
      const response = await goalApi.generatePlan(data);
      if (response.data.success) {
        setGeneratedPlan(response.data.data);
        addToast('success', '计划生成成功');
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!generatedPlan) return;
    setLoading(true);
    try {
      addToast('success', '计划创建成功');
      navigate('/plans');
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedGoalInfo = () => {
    if (!formData.goal_id) return null;
    return goals.find((g) => g.id.toString() === formData.goal_id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/plans"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <Dumbbell className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">生成训练计划</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
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
            <h2 className="text-lg font-semibold text-gray-800 mb-4">关联目标（可选）</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择关联的目标
              </label>
              {goals.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                  当前目标类型下暂无进行中的目标，将不关联具体目标生成计划
                </p>
              ) : (
                <select
                  value={formData.goal_id}
                  onChange={handleGoalSelect}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                >
                  <option value="">不关联目标</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name || goal.description || `目标 #${goal.id}`} -{' '}
                      {goal.target_value}
                      {goal.goal_type === 'fat_loss' || goal.goal_type === 'muscle_gain'
                        ? 'kg'
                        : goal.goal_type === 'running'
                        ? 'km'
                        : ''}
                    </option>
                  ))}
                </select>
              )}
              {getSelectedGoalInfo() && (
                <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-700 font-medium">已选目标详情</p>
                  <p className="text-sm text-gray-600 mt-1">
                    目标值: {getSelectedGoalInfo().target_value}
                    {formData.goal_type === 'fat_loss' || formData.goal_type === 'muscle_gain'
                      ? 'kg'
                      : formData.goal_type === 'running'
                      ? 'km'
                      : ''}
                  </p>
                  <p className="text-sm text-gray-600">
                    当前进度: {Math.round(
                      (getSelectedGoalInfo().current_value / getSelectedGoalInfo().target_value) *
                        100
                    )}%
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'AI生成中...' : '生成训练计划'}
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">计划预览</h2>
          {!generatedPlan ? (
            <div className="text-center py-16">
              <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">选择目标类型后点击"生成训练计划"</p>
              <p className="text-sm text-gray-400 mt-2">AI将根据您的目标智能生成个性化训练计划</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-xl text-gray-800 mb-2">
                  {generatedPlan.name || 'AI智能训练计划'}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      intensityColors[generatedPlan.intensity] || intensityColors.medium
                    }`}
                  >
                    {intensityLabels[generatedPlan.intensity] || '中等强度'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm">持续周数</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {generatedPlan.duration_weeks || 4} 周
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">每周频率</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {generatedPlan.frequency || 3} 次/周
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <Activity className="w-4 h-4" />
                  <span className="font-medium">运动项目</span>
                </div>
                <div className="space-y-2">
                  {(generatedPlan.exercises && generatedPlan.exercises.length > 0
                    ? generatedPlan.exercises
                    : [
                        { name: '慢跑', duration: '30分钟' },
                        { name: '力量训练', duration: '45分钟' },
                        { name: 'HIIT', duration: '20分钟' }
                      ]
                  ).map((ex: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{ex.name}</p>
                          {ex.description && (
                            <p className="text-xs text-gray-500">{ex.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {ex.duration && (
                          <p className="text-sm font-medium text-gray-700">{ex.duration}</p>
                        )}
                        {ex.sets && (
                          <p className="text-xs text-gray-500">
                            {ex.sets}组 × {ex.reps}次
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">休息日</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(generatedPlan.rest_days && generatedPlan.rest_days.length > 0
                    ? generatedPlan.rest_days
                    : ['周一', '周三', '周五']
                  ).map((day: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              {generatedPlan.description && (
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Flame className="w-4 h-4" />
                    <span className="font-medium">计划说明</span>
                  </div>
                  <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    {generatedPlan.description}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    重新生成
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? '保存中...' : '确认创建'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanGenerate;
