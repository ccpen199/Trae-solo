import { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Calculator,
  DollarSign,
  TrendingUp,
  Layers,
  Save,
  X,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

interface Tier {
  tier: number;
  rangeStart: number;
  rangeEnd: number | null;
  unitPrice: number;
}

interface PricingRule {
  id: string;
  name: string;
  user_type: string;
  tiers: Tier[];
  effective_from: string;
  effective_to: string | null;
  status: string;
  created_at?: string;
}

interface SimulationResult {
  consumption: number;
  total_amount: number;
  rule_id: string;
  rule_name: string;
  tier_details: Array<{
    tier: number;
    rangeStart: number;
    rangeEnd: number | null;
    unitPrice: number;
    consumption: number;
    amount: number;
  }>;
}

const userTypeLabels: Record<string, string> = {
  residential: '居民用气',
  commercial: '商业用气',
  industrial: '工业用气',
};

const userTypeColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  residential: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  commercial: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  industrial: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

const CHART_COLORS = ['#0052CC', '#FF6B35', '#10B981', '#F59E0B', '#6B7280'];

export default function AdminPricing() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    user_type: 'residential',
    tiers: [{ tier: 1, rangeStart: 0, rangeEnd: 30, unitPrice: 2.5 }] as Tier[],
    effective_from: new Date().toISOString().split('T')[0],
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  const [simulateRuleId, setSimulateRuleId] = useState<string>('');
  const [simulateConsumption, setSimulateConsumption] = useState<number>(100);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  useEffect(() => {
    if (rules.length > 0 && !simulateRuleId) {
      setSimulateRuleId(rules[0].id);
    }
  }, [rules, simulateRuleId]);

  useEffect(() => {
    if (simulateRuleId) {
      handleSimulate();
    }
  }, [simulateRuleId, simulateConsumption]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tiered-pricing');
      const data = await res.json();
      if (data.success) {
        setRules(data.data);
      } else {
        setError(data.error || '获取计价规则失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取计价规则失败');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (rule?: PricingRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        user_type: rule.user_type,
        tiers: [...rule.tiers],
        effective_from: rule.effective_from,
        status: rule.status,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        user_type: 'residential',
        tiers: [{ tier: 1, rangeStart: 0, rangeEnd: 30, unitPrice: 2.5 }],
        effective_from: new Date().toISOString().split('T')[0],
        status: 'active',
      });
    }
    setEditModalOpen(true);
  };

  const addTier = () => {
    const lastTier = formData.tiers[formData.tiers.length - 1];
    const newTier: Tier = {
      tier: formData.tiers.length + 1,
      rangeStart: lastTier.rangeEnd || 0,
      rangeEnd: (lastTier.rangeEnd || 0) + 50,
      unitPrice: lastTier.unitPrice + 0.5,
    };
    setFormData({ ...formData, tiers: [...formData.tiers, newTier] });
  };

  const removeTier = (index: number) => {
    if (formData.tiers.length <= 1) return;
    const newTiers = formData.tiers.filter((_, i) => i !== index).map((t, i) => ({
      ...t,
      tier: i + 1,
    }));
    setFormData({ ...formData, tiers: newTiers });
  };

  const updateTier = (index: number, field: keyof Tier, value: number) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('请输入规则名称');
      return;
    }
    if (formData.tiers.length === 0) {
      alert('请至少添加一个阶梯档位');
      return;
    }

    try {
      setSaving(true);
      const url = editingRule ? `/api/tiered-pricing/${editingRule.id}` : '/api/tiered-pricing';
      const method = editingRule ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setEditModalOpen(false);
        fetchRules();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulate = async () => {
    if (!simulateRuleId || simulateConsumption <= 0) return;

    try {
      setSimulating(true);
      const res = await fetch('/api/tiered-pricing/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumption: simulateConsumption,
          rule_id: simulateRuleId,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSimulationResult(data.data);
      }
    } catch (err) {
      console.error('模拟计算失败', err);
    } finally {
      setSimulating(false);
    }
  };

  const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

  const chartData = simulationResult
    ? simulationResult.tier_details.map((item, index) => ({
        name: `第${item.tier}档`,
        费用: item.amount,
        用量: item.consumption,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
    : [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-600" />
            </div>
            阶梯计价规则配置
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理各类用户的阶梯气价规则，支持灵活配置</p>
        </div>
        <Button icon={Plus} onClick={() => openEditModal()}>
          新建规则
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-32 bg-gray-100 rounded-lg" />
            </div>
          ))
        ) : (
          rules.map((rule) => {
            const colors = userTypeColors[rule.user_type] || userTypeColors.residential;
            return (
              <div
                key={rule.id}
                className={cn(
                  'bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group',
                  'border-t-4',
                  rule.user_type === 'residential' && 'border-t-blue-500',
                  rule.user_type === 'commercial' && 'border-t-amber-500',
                  rule.user_type === 'industrial' && 'border-t-emerald-500'
                )}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                        {rule.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
                        <span className={cn('text-sm', colors.text)}>
                          {userTypeLabels[rule.user_type] || rule.user_type}
                        </span>
                      </div>
                    </div>
                    <StatusBadge
                      variant={rule.status === 'active' ? 'success' : 'default'}
                      icon
                    >
                      {rule.status === 'active' ? '已启用' : '已停用'}
                    </StatusBadge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {rule.tiers.slice(0, 3).map((tier) => (
                      <div
                        key={tier.tier}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-lg text-sm',
                          colors.bg
                        )}
                      >
                        <span className={cn('font-medium', colors.text)}>第{tier.tier}档</span>
                        <span className="text-gray-600">
                          {tier.rangeStart} - {tier.rangeEnd !== null ? tier.rangeEnd : '∞'} m³
                        </span>
                        <span className="font-semibold text-gray-800">
                          ¥{tier.unitPrice.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {rule.tiers.length > 3 && (
                      <p className="text-xs text-gray-400 text-center">
                        还有 {rule.tiers.length - 3} 个档位...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                    <span>生效日期：{rule.effective_from}</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {rule.tiers.length} 档阶梯
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      className="flex-1"
                      onClick={() => openEditModal(rule)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Calculator}
                      className="flex-1"
                      onClick={() => {
                        setSimulateRuleId(rule.id);
                      }}
                    >
                      试算
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-accent-500" />
              费用模拟计算器
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">输入用气量，实时计算各档费用明细</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择计价规则
              </label>
              <select
                value={simulateRuleId}
                onChange={(e) => setSimulateRuleId(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors"
              >
                {rules.map((rule) => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用气量 (立方米)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={simulateConsumption}
                  onChange={(e) => setSimulateConsumption(Number(e.target.value))}
                  className="w-full h-12 px-4 pr-12 border border-gray-200 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  m³
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {[50, 100, 200, 500].map((val) => (
                <button
                  key={val}
                  onClick={() => setSimulateConsumption(val)}
                  className={cn(
                    'flex-1 h-9 text-sm rounded-lg border transition-all',
                    simulateConsumption === val
                      ? 'bg-primary-50 border-primary-500 text-primary-600 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {val}m³
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {simulating ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-400">计算中...</p>
                </div>
              </div>
            ) : simulationResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-4">
                    <p className="text-sm text-primary-600 mb-1">总用气量</p>
                    <p className="text-2xl font-bold text-primary-700">
                      {simulationResult.consumption}
                      <span className="text-base font-normal ml-1">m³</span>
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-accent-50 to-accent-100/50 rounded-xl p-4">
                    <p className="text-sm text-accent-600 mb-1">总费用</p>
                    <p className="text-2xl font-bold text-accent-600">
                      ¥{simulationResult.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => [`¥${value.toFixed(2)}`, '费用']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                          padding: '12px 16px',
                        }}
                      />
                      <Bar dataKey="费用" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-600">档位</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-600">用量区间</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-600">单价</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-600">本档用量</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-600">费用</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {simulationResult.tier_details.map((tier, index) => (
                        <tr key={tier.tier} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              第{tier.tier}档
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {tier.rangeStart} - {tier.rangeEnd !== null ? tier.rangeEnd : '∞'} m³
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            ¥{tier.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-800">
                            {tier.consumption} m³
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            ¥{tier.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={editingRule ? '编辑计价规则' : '新建计价规则'}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              取消
            </Button>
            <Button icon={Save} onClick={handleSave} loading={saving}>
              保存规则
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                规则名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入规则名称"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                用户类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors"
              >
                <option value="residential">居民用气</option>
                <option value="commercial">商业用气</option>
                <option value="industrial">工业用气</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                生效日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.effective_from}
                onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors"
              >
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                阶梯档位配置 <span className="text-red-500">*</span>
              </label>
              <Button
                variant="ghost"
                size="sm"
                icon={Plus}
                onClick={addTier}
              >
                添加档位
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-16">档位</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">起始用量 (m³)</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">结束用量 (m³)</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">单价 (元/m³)</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600 w-16">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.tiers.map((tier, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2.5 font-medium text-gray-700">第{tier.tier}档</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={tier.rangeStart}
                          onChange={(e) => updateTier(index, 'rangeStart', Number(e.target.value))}
                          className="w-full h-8 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={tier.rangeEnd ?? ''}
                          onChange={(e) => updateTier(index, 'rangeEnd', e.target.value ? Number(e.target.value) : 0)}
                          placeholder="不限"
                          className="w-full h-8 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={tier.unitPrice}
                          onChange={(e) => updateTier(index, 'unitPrice', Number(e.target.value))}
                          className="w-full h-8 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeTier(index)}
                          disabled={formData.tiers.length <= 1}
                          className={cn(
                            'p-1.5 rounded transition-colors',
                            formData.tiers.length <= 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              提示：最后一档的结束用量留空表示不限量
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
