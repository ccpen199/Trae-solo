import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const categories = [
  { value: 'survey', label: '问卷调研' },
  { value: 'video', label: '视频观看' },
  { value: 'promotion', label: '地推打卡' },
  { value: 'blessing', label: '祝福征集' },
];

export default function PublishTask() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    title: '',
    category: 'survey',
    description: '',
    requirements: '',
    reward: '',
    totalCount: '',
    duration: 3600,
  });
  const [escrowAgreed, setEscrowAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.tasks.templates();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    }
  };

  const useTemplate = (template) => {
    setForm((prev) => ({
      ...prev,
      category: template.category,
      description: template.description || '',
      requirements: template.requirements || '',
      reward: template.default_reward || '',
    }));
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const reward = parseFloat(form.reward);
    const totalCount = parseInt(form.totalCount, 10);
    const duration = parseInt(form.duration, 10);
    const totalAmount = reward * totalCount;

    if (isNaN(reward) || reward < 0.01) {
      setError('单份赏金不能低于0.01元');
      return;
    }
    if (isNaN(totalCount) || totalCount < 1) {
      setError('任务份数不能少于1');
      return;
    }
    if (totalAmount > (user.balance || 0)) {
      setError('余额不足，请先充值');
      return;
    }
    if (!escrowAgreed) {
      setError('请阅读并同意悬赏发布协议');
      return;
    }

    setLoading(true);
    try {
      const result = await api.tasks.create({
        title: form.title,
        category: form.category,
        description: form.description,
        requirements: form.requirements,
        reward,
        totalCount,
        duration: isNaN(duration) || duration <= 0 ? 3600 : duration,
      });
      await refreshProfile();
      navigate(`/tasks/${result.taskId}`);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const reward = parseFloat(form.reward) || 0;
  const totalCount = parseInt(form.totalCount, 10) || 0;
  const totalAmount = reward * totalCount;
  const balance = user.balance || 0;
  const balanceSufficient = totalAmount > 0 && totalAmount <= balance;
  const canSubmit = escrowAgreed && balanceSufficient && !loading;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <h1 className="text-2xl font-bold mb-6">发布任务</h1>

      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">当前余额</div>
            <div className="text-2xl font-bold text-blue-600">¥{balance.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">预计托管金额</div>
            <div className={`text-2xl font-bold ${balanceSufficient ? 'text-orange-500' : 'text-red-500'}`}>
              ¥{totalAmount.toFixed(2)}
            </div>
          </div>
        </div>
        {totalAmount > 0 && !balanceSufficient && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">
            余额不足，请先充值后再发布任务
          </div>
        )}
      </div>

      {templates.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h3 className="font-medium mb-3">快速使用模板</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => useTemplate(template)}
                className="border rounded-lg p-3 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-gray-500">
                  {categories.find((c) => c.value === template.category)?.label || template.category} · ¥{template.default_reward}起
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-5">
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">
            任务标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入任务标题"
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">任务分类</label>
          <select
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">
            任务描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请详细描述任务内容"
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">完成条件与验收标准</label>
          <textarea
            value={form.requirements}
            onChange={(e) => updateField('requirements', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请列出完成任务的具体要求和验收标准"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              单份赏金（元） <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.reward}
              onChange={(e) => updateField('reward', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              任务份数 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.totalCount}
              onChange={(e) => updateField('totalCount', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">任务时长（秒）</label>
            <input
              type="number"
              min="60"
              step="60"
              value={form.duration}
              onChange={(e) => updateField('duration', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="3600"
            />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
          <div className="font-medium text-amber-800 mb-1">法律合规提示</div>
          <div className="text-sm text-amber-700">
            发布者需确保任务内容合法合规，不得涉及违法违规内容。平台有权下架违规任务并冻结相关资金。
          </div>
        </div>

        <div className="mb-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={escrowAgreed}
              onChange={(e) => setEscrowAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              我已阅读并同意《悬赏发布协议》，确认托管赏金至平台监管账户
            </span>
          </label>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 rounded px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '发布中...' : '确认发布并托管赏金'}
        </button>
      </form>
    </div>
  );
}
