import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Save, Send, Calendar, DollarSign, FileText, CheckCircle, ListChecks } from 'lucide-react';
import { taskApi } from '../../lib/api';
import { TASK_TYPE_LABELS } from '../../../shared/types';
import type { TaskType, TaskCreateRequest, ReviewNode, Milestone } from '../../../shared/types';

const TaskPublish = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<TaskCreateRequest>({
    title: '',
    description: '',
    type: 'ui_design',
    budgetMin: 1000,
    budgetMax: 5000,
    durationDays: 15,
    tags: [],
    deliveryStandards: '',
    reviewNodes: [
      { id: '1', name: '初稿评审', description: '设计方向确认', order: 1, completed: false, completedAt: null },
      { id: '2', name: '终稿评审', description: '最终交付物验收', order: 2, completed: false, completedAt: null },
    ],
    milestones: [
      { id: '1', name: '初稿完成', description: '提交设计初稿供评审', amount: 2500, dueDate: '', status: 'pending' },
      { id: '2', name: '终稿完成', description: '提交最终设计文件', amount: 2500, dueDate: '', status: 'pending' },
    ],
  });

  const [newTag, setNewTag] = useState('');

  const types: { value: TaskType; label: string; desc: string }[] = [
    { value: 'ui_design', label: 'UI设计', desc: '网页、APP、软件界面设计' },
    { value: 'industrial_design', label: '工业设计', desc: '产品外观、结构设计' },
    { value: 'animation', label: '动漫设计', desc: '动画、漫画、插画设计' },
    { value: 'software', label: '软件开发', desc: '网站、小程序、APP开发' },
    { value: 'trademark', label: '商标注册', desc: '商标设计、注册申请' },
    { value: 'copywriting', label: '文案策划', desc: '品牌文案、营销策划' },
  ];

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addReviewNode = () => {
    const newNode: ReviewNode = {
      id: String(Date.now()),
      name: '',
      description: '',
      order: formData.reviewNodes.length + 1,
      completed: false,
      completedAt: null,
    };
    setFormData({ ...formData, reviewNodes: [...formData.reviewNodes, newNode] });
  };

  const removeReviewNode = (id: string) => {
    setFormData({
      ...formData,
      reviewNodes: formData.reviewNodes
        .filter(n => n.id !== id)
        .map((n, idx) => ({ ...n, order: idx + 1 })),
    });
  };

  const updateReviewNode = (id: string, field: 'name' | 'description', value: string) => {
    setFormData({
      ...formData,
      reviewNodes: formData.reviewNodes.map(n => n.id === id ? { ...n, [field]: value } : n),
    });
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: String(Date.now()),
      name: '',
      description: '',
      amount: 0,
      dueDate: '',
      status: 'pending',
    };
    setFormData({ ...formData, milestones: [...formData.milestones, newMilestone] });
  };

  const removeMilestone = (id: string) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter(m => m.id !== id),
    });
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string | number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.map(m => m.id === id ? { ...m, [field]: value } : m),
    });
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      const task = await taskApi.create(formData);
      if (publish) {
        await taskApi.publish(task.id);
      }
      navigate('/tasks');
    } catch (err) {
      console.error('Failed to save task:', err);
      alert(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const totalMilestoneAmount = formData.milestones.reduce((sum, m) => sum + m.amount, 0);

  const steps = [
    { id: 1, label: '基本信息', icon: FileText },
    { id: 2, label: '预算周期', icon: DollarSign },
    { id: 3, label: '审核节点', icon: ListChecks },
    { id: 4, label: '里程碑', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tasks')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">发布需求</h2>
          <p className="text-slate-500 mt-1">填写需求详情，寻找专业服务商</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > s.id ? <CheckCircle className="w-5 h-5" /> : s.id}
                </div>
                <span
                  className={`font-medium hidden sm:block ${
                    step >= s.id ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded-full ${
                    step > s.id ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">需求类型</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {types.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setFormData({ ...formData, type: t.value })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.type === t.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        formData.type === t.value ? 'text-blue-600' : 'text-slate-800'
                      }`}
                    >
                      {t.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">需求标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入需求标题，简洁明了地描述您的需求"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">需求描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="详细描述您的需求，包括设计风格、功能要求、参考案例等"
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">需求标签</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="输入标签后按回车添加"
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">交付标准</label>
              <textarea
                value={formData.deliveryStandards}
                onChange={(e) => setFormData({ ...formData, deliveryStandards: e.target.value })}
                placeholder="描述您期望的交付物标准，如文件格式、分辨率、源文件要求等"
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">最低预算（元）</label>
                <input
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: Number(e.target.value) })}
                  min="0"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">最高预算（元）</label>
                <input
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                  min={formData.budgetMin}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-blue-700 text-sm">
                <strong>提示：</strong>合理的预算区间有助于吸引更多优质服务商。平台将收取 5% 作为服务费。
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">项目周期（天）</label>
              <input
                type="number"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                min="1"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <p className="text-amber-700 text-sm">
                <strong>审核节点：</strong>设置项目过程中的评审节点，确保项目按预期推进。每个节点都需要雇主确认后才能进入下一阶段。
              </p>
            </div>

            <div className="space-y-4">
              {formData.reviewNodes.map((node, idx) => (
                <div key={node.id} className="p-4 bg-slate-50 rounded-xl relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-slate-700">评审节点 {idx + 1}</span>
                    {formData.reviewNodes.length > 1 && (
                      <button
                        onClick={() => removeReviewNode(node.id)}
                        className="ml-auto p-1 hover:bg-slate-200 rounded"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">节点名称</label>
                      <input
                        type="text"
                        value={node.name}
                        onChange={(e) => updateReviewNode(node.id, 'name', e.target.value)}
                        placeholder="如：初稿评审"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">评审说明</label>
                      <input
                        type="text"
                        value={node.description}
                        onChange={(e) => updateReviewNode(node.id, 'description', e.target.value)}
                        placeholder="如：设计方向确认"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addReviewNode}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加评审节点
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
              <p className="text-emerald-700 text-sm">
                <strong>里程碑：</strong>将项目拆分为多个里程碑，每个里程碑对应部分款项。服务商完成里程碑并经您确认后，对应款项将被释放。
              </p>
            </div>

            <div className="space-y-4">
              {formData.milestones.map((milestone, idx) => (
                <div key={milestone.id} className="p-4 bg-slate-50 rounded-xl relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-slate-700">里程碑 {idx + 1}</span>
                    {formData.milestones.length > 1 && (
                      <button
                        onClick={() => removeMilestone(milestone.id)}
                        className="ml-auto p-1 hover:bg-slate-200 rounded"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">里程碑名称</label>
                      <input
                        type="text"
                        value={milestone.name}
                        onChange={(e) => updateMilestone(milestone.id, 'name', e.target.value)}
                        placeholder="如：初稿完成"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">交付说明</label>
                      <input
                        type="text"
                        value={milestone.description}
                        onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                        placeholder="交付内容说明"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">金额（元）</label>
                      <input
                        type="number"
                        value={milestone.amount}
                        onChange={(e) => updateMilestone(milestone.id, 'amount', Number(e.target.value))}
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">截止日期</label>
                      <input
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-100 rounded-xl">
              <span className="font-medium text-slate-700">里程碑总金额</span>
              <span className={`text-xl font-bold ${totalMilestoneAmount >= formData.budgetMin && totalMilestoneAmount <= formData.budgetMax ? 'text-emerald-600' : 'text-red-600'}`}>
                ¥{totalMilestoneAmount.toLocaleString()}
              </span>
            </div>

            {totalMilestoneAmount < formData.budgetMin && (
              <p className="text-red-500 text-sm">里程碑总金额不能低于最低预算</p>
            )}
            {totalMilestoneAmount > formData.budgetMax && (
              <p className="text-red-500 text-sm">里程碑总金额不能超过最高预算</p>
            )}

            <button
              onClick={addMilestone}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加里程碑
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-slate-200 mt-8">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1 || saving}
            className="px-6 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一步
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存草稿
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(s => Math.min(4, s + 1))}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={() => handleSave(true)}
                disabled={saving || totalMilestoneAmount < formData.budgetMin || totalMilestoneAmount > formData.budgetMax}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/30"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    发布中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    立即发布
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPublish;
