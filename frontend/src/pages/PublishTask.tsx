import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_MAP } from '../types';

const steps = ['基本信息', '配置设置', '附加设置'];

export default function PublishTask() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'ui_design',
    budget_type: 'fixed',
    budget_min: '',
    budget_max: '',
    cycle_days: '',
    delivery_standards: '',
    nda_required: false,
    ip_ownership: 'employer',
    prepayment_ratio: '50',
    penalty_clause: '',
    review_nodes: '',
  });

  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const body: any = {
        title: form.title,
        description: form.description,
        category: form.category,
        budget_type: form.budget_type,
        budget_min: Number(form.budget_min),
        budget_max: Number(form.budget_max),
        cycle_days: Number(form.cycle_days),
        delivery_standards: form.delivery_standards || undefined,
        nda_required: form.nda_required,
        ip_ownership: form.ip_ownership,
        prepayment_ratio: Number(form.prepayment_ratio),
        penalty_clause: form.penalty_clause || undefined,
        review_nodes: form.review_nodes ? form.review_nodes.split(',').map((s) => s.trim()) : [],
      };
      const res = await api.post<any, { data: any }>('/tasks', body);
      navigate(`/tasks/${res.data.id}`);
    } catch (err: any) {
      setError(err.message || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">发布需求</h1>

      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < step ? <CheckCircle size={18} /> : i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'text-primary font-medium' : 'text-gray-400'}`}>{label}</span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      <div className="card">
        {error && <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-xl">{error}</div>}

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">任务标题 *</label>
              <input type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} className="input-field" placeholder="请输入任务标题" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">任务描述 *</label>
              <textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} className="input-field min-h-[120px]" placeholder="请详细描述您的需求" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">服务分类 *</label>
                <select value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="input-field">
                  {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">预算类型</label>
                <select value={form.budget_type} onChange={(e) => updateForm({ budget_type: e.target.value })} className="input-field">
                  <option value="fixed">固定预算</option>
                  <option value="hourly">按小时</option>
                  <option value="negotiable">面议</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">最低预算 *</label>
                <input type="number" value={form.budget_min} onChange={(e) => updateForm({ budget_min: e.target.value })} className="input-field" placeholder="元" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">最高预算 *</label>
                <input type="number" value={form.budget_max} onChange={(e) => updateForm({ budget_max: e.target.value })} className="input-field" placeholder="元" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">交付周期 *</label>
                <input type="number" value={form.cycle_days} onChange={(e) => updateForm({ cycle_days: e.target.value })} className="input-field" placeholder="天" required />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">交付标准</label>
              <textarea value={form.delivery_standards} onChange={(e) => updateForm({ delivery_standards: e.target.value })} className="input-field min-h-[100px]" placeholder="请描述交付标准和验收条件" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">审核节点</label>
              <input type="text" value={form.review_nodes} onChange={(e) => updateForm({ review_nodes: e.target.value })} className="input-field" placeholder="用逗号分隔，如：初稿审核, 中期审核, 终稿审核" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">首付比例</label>
              <div className="flex items-center gap-3">
                <input type="range" min="0" max="100" step="10" value={form.prepayment_ratio} onChange={(e) => updateForm({ prepayment_ratio: e.target.value })} className="flex-1" />
                <span className="text-sm font-medium w-12 text-center">{form.prepayment_ratio}%</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="nda" checked={form.nda_required} onChange={(e) => updateForm({ nda_required: e.target.checked })} className="w-4 h-4 text-primary rounded" />
              <label htmlFor="nda" className="text-sm text-gray-700">需要签署保密协议 (NDA)</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">知识产权归属</label>
              <select value={form.ip_ownership} onChange={(e) => updateForm({ ip_ownership: e.target.value })} className="input-field">
                <option value="employer">雇主所有</option>
                <option value="provider">服务商所有</option>
                <option value="shared">共同所有</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">违约条款</label>
              <textarea value={form.penalty_clause} onChange={(e) => updateForm({ penalty_clause: e.target.value })} className="input-field min-h-[80px]" placeholder="如：延期交付每天扣罚合同金额的1%" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-outline flex items-center gap-1 text-sm">
              <ChevronLeft size={16} /> 上一步
            </button>
          ) : (
            <div />
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary flex items-center gap-1 text-sm">
              下一步 <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-accent flex items-center gap-1 text-sm disabled:opacity-50">
              {loading ? '发布中...' : '发布任务'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
