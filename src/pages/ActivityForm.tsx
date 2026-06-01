import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { activityApi, prizeApi } from '../lib/api';
import type { Activity, Prize, PrizeConfig } from '../../shared/types.js';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

export default function ActivityForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [formData, setFormData] = useState<Partial<Activity>>({
    name: '',
    description: '',
    theme: 'default',
    startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
    status: 'draft',
    participationRules: {
      requireLogin: true,
      dailyLimit: 3,
      totalLimit: 10,
      requiredTasks: [],
      eligibleUserGroups: [],
    },
    lotteryRules: {
      type: 'wheel',
      probabilityMode: 'weighted',
      winLimit: 1,
      preventDuplicateWin: true,
    },
    pageConfig: {
      primaryColor: '#3B82F6',
      backgroundColor: '#F3F4F6',
    },
    prizeConfigs: [],
  });

  useEffect(() => {
    loadPrizes();
    if (isEdit) {
      loadActivity();
    }
  }, [id]);

  const loadPrizes = async () => {
    try {
      const res = await prizeApi.getAll();
      if (res.data.code === 200) {
        setPrizes(res.data.data || []);
      }
    } catch (error) {
      console.error('Load prizes failed:', error);
    }
  };

  const loadActivity = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await activityApi.getDetail(parseInt(id));
      if (res.data.code === 200 && res.data.data) {
        const activity = res.data.data;
        setFormData({
          ...activity,
          startTime: new Date(activity.startTime).toISOString().slice(0, 16),
          endTime: new Date(activity.endTime).toISOString().slice(0, 16),
        });
      }
    } catch (error) {
      console.error('Load activity failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = {
        ...formData,
        startTime: new Date(formData.startTime!).toISOString(),
        endTime: new Date(formData.endTime!).toISOString(),
      };

      if (isEdit) {
        await activityApi.update(parseInt(id!), submitData);
      } else {
        await activityApi.create(submitData);
      }
      navigate('/activities');
    } catch (error: any) {
      alert(error.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addPrizeConfig = () => {
    const newConfig: PrizeConfig = {
      id: Date.now(),
      activityId: 0,
      prizeId: prizes[0]?.id || 0,
      probability: 10,
      position: (formData.prizeConfigs?.length || 0) + 1,
    };
    setFormData({
      ...formData,
      prizeConfigs: [...(formData.prizeConfigs || []), newConfig],
    });
  };

  const updatePrizeConfig = (index: number, field: keyof PrizeConfig, value: any) => {
    const newConfigs = [...(formData.prizeConfigs || [])];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setFormData({ ...formData, prizeConfigs: newConfigs });
  };

  const removePrizeConfig = (index: number) => {
    const newConfigs = [...(formData.prizeConfigs || [])];
    newConfigs.splice(index, 1);
    setFormData({ ...formData, prizeConfigs: newConfigs });
  };

  const addTask = () => {
    const newTask = {
      id: `task_${Date.now()}`,
      name: '新任务',
      type: 'view' as const,
      description: '',
    };
    setFormData({
      ...formData,
      participationRules: {
        ...formData.participationRules!,
        requiredTasks: [...(formData.participationRules?.requiredTasks || []), newTask],
      },
    });
  };

  const updateTask = (index: number, field: string, value: any) => {
    const newTasks = [...(formData.participationRules?.requiredTasks || [])];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setFormData({
      ...formData,
      participationRules: {
        ...formData.participationRules!,
        requiredTasks: newTasks,
      },
    });
  };

  const removeTask = (index: number) => {
    const newTasks = [...(formData.participationRules?.requiredTasks || [])];
    newTasks.splice(index, 1);
    setFormData({
      ...formData,
      participationRules: {
        ...formData.participationRules!,
        requiredTasks: newTasks,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/activities')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? '编辑活动' : '新建活动'}
          </h1>
          <p className="text-gray-500 mt-1">配置抽奖活动的基本信息和规则</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">基本信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">活动名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">主题</label>
              <input
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">开始时间 *</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">结束时间 *</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">活动描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">参与规则</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">每日抽奖次数限制</label>
              <input
                type="number"
                min="0"
                value={formData.participationRules?.dailyLimit}
                onChange={(e) => setFormData({
                  ...formData,
                  participationRules: {
                    ...formData.participationRules!,
                    dailyLimit: parseInt(e.target.value),
                  },
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">总抽奖次数限制</label>
              <input
                type="number"
                min="0"
                value={formData.participationRules?.totalLimit}
                onChange={(e) => setFormData({
                  ...formData,
                  participationRules: {
                    ...formData.participationRules!,
                    totalLimit: parseInt(e.target.value),
                  },
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">中奖次数限制</label>
              <input
                type="number"
                min="0"
                value={formData.lotteryRules?.winLimit}
                onChange={(e) => setFormData({
                  ...formData,
                  lotteryRules: {
                    ...formData.lotteryRules!,
                    winLimit: parseInt(e.target.value),
                  },
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">必做任务</label>
              <button
                type="button"
                onClick={addTask}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus size={16} /> 添加任务
              </button>
            </div>
            
            {formData.participationRules?.requiredTasks?.map((task, index) => (
              <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={task.name}
                  onChange={(e) => updateTask(index, 'name', e.target.value)}
                  placeholder="任务名称"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={task.type}
                  onChange={(e) => updateTask(index, 'type', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="view">浏览</option>
                  <option value="share">分享</option>
                  <option value="login">登录</option>
                  <option value="custom">自定义</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeTask(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">奖品配置</h2>
          
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">配置抽奖奖品及中奖概率</p>
            <button
              type="button"
              onClick={addPrizeConfig}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus size={16} /> 添加奖品
            </button>
          </div>

          <div className="space-y-3">
            {formData.prizeConfigs?.map((config, index) => (
              <div key={config.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <select
                  value={config.prizeId}
                  onChange={(e) => updatePrizeConfig(index, 'prizeId', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {prizes.map((prize) => (
                    <option key={prize.id} value={prize.id}>
                      {prize.name} (库存: {prize.totalStock - prize.usedStock})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 w-48">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={config.probability}
                    onChange={(e) => updatePrizeConfig(index, 'probability', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePrizeConfig(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {(!formData.prizeConfigs || formData.prizeConfigs.length === 0) && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              点击上方"添加奖品"按钮配置奖品
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">页面样式</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">主题色</label>
              <input
                type="color"
                value={formData.pageConfig?.primaryColor}
                onChange={(e) => setFormData({
                  ...formData,
                  pageConfig: { ...formData.pageConfig!, primaryColor: e.target.value },
                })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">背景色</label>
              <input
                type="color"
                value={formData.pageConfig?.backgroundColor}
                onChange={(e) => setFormData({
                  ...formData,
                  pageConfig: { ...formData.pageConfig!, backgroundColor: e.target.value },
                })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">抽奖形式</label>
              <select
                value={formData.lotteryRules?.type}
                onChange={(e) => setFormData({
                  ...formData,
                  lotteryRules: { ...formData.lotteryRules!, type: e.target.value as any },
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="wheel">转盘</option>
                <option value="grid">九宫格</option>
                <option value="slot">老虎机</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/activities')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
