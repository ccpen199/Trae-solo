import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Pencil, Calculator } from 'lucide-react';
import { usePricingStore } from '@/stores/usePricingStore';
import { CATEGORY_LABELS, CONDITION_OPTIONS, BRAND_LISTS } from '@/utils/constants';

const TYPE_LABELS: Record<string, string> = { weight: '重量', model: '型号', market: '市场' };
const TYPE_COLORS: Record<string, string> = {
  weight: 'bg-blue-50 text-blue-700',
  model: 'bg-purple-50 text-purple-700',
  market: 'bg-amber-50 text-amber-700',
};
const OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'between'];
const OP_LABELS: Record<string, string> = {
  eq: '等于', neq: '不等于', gt: '大于', gte: '大于等于', lt: '小于', lte: '小于等于', in: '包含', between: '区间',
};
const FIELDS = ['weight', 'brand', 'condition', 'model', 'age'];
const FIELD_LABELS: Record<string, string> = {
  weight: '重量', brand: '品牌', condition: '成色', model: '型号', age: '使用时长',
};

interface ConditionRow {
  field: string;
  operator: string;
  value: string;
}

interface RuleForm {
  [key: string]: unknown;
  name: string;
  category: string;
  type: string;
  conditions: ConditionRow[];
  modifier: number;
  priority: number;
  enabled: boolean;
}

const emptyForm: RuleForm = {
  name: '', category: 'clothing', type: 'weight', conditions: [], modifier: 1, priority: 1, enabled: true,
};

function CategoryBadge({ category }: { category: string }) {
  const label = CATEGORY_LABELS[category] || category;
  return <span className="rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-medium text-forest-700">{label}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const label = TYPE_LABELS[type] || type;
  const color = TYPE_COLORS[type] || 'bg-gray-50 text-gray-700';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}

export default function Pricing() {
  const { rules, loading, fetchRules, createRule, updateRule, calculatePrice } = usePricingStore();
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [toast, setToast] = useState('');

  const [calcCategory, setCalcCategory] = useState('clothing');
  const [calcBrand, setCalcBrand] = useState('');
  const [calcCondition, setCalcCondition] = useState('');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcResult, setCalcResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const ruleList = (rules as Record<string, unknown>[]) || [];
  const filtered = categoryFilter === '全部'
    ? ruleList
    : ruleList.filter((r) => (r.category as string) === categoryFilter);

  const openNewForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEditForm = (rule: Record<string, unknown>) => {
    setForm({
      name: (rule.name as string) || '',
      category: (rule.category as string) || 'clothing',
      type: (rule.type as string) || 'weight',
      conditions: ((rule.conditions as ConditionRow[]) || []).map((c) => ({ ...c })),
      modifier: (rule.modifier as number) || 1,
      priority: (rule.priority as number) || 1,
      enabled: (rule.enabled as boolean) !== false,
    });
    setEditingId((rule.id as string) || null);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateRule(editingId, form);
        showToast('规则已更新');
      } else {
        await createRule(form);
        showToast('规则已创建');
      }
      setShowForm(false);
      fetchRules();
    } catch { showToast('操作失败'); }
  };

  const handleToggle = async (rule: Record<string, unknown>) => {
    try {
      await updateRule((rule.id as string), { ...rule, enabled: !(rule.enabled as boolean) });
      fetchRules();
    } catch { showToast('操作失败'); }
  };

  const handleCalculate = async () => {
    try {
      const res = await calculatePrice({
        category: calcCategory, brand: calcBrand, condition: calcCondition, weight: Number(calcWeight),
      });
      setCalcResult(res as Record<string, unknown>);
    } catch { showToast('计算失败'); }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-forest-700 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['全部', ...Object.entries(CATEGORY_LABELS).map(([, v]) => v)].map((c) => (
            <button
              key={c} onClick={() => setCategoryFilter(c)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === c ? 'bg-forest-700 text-white' : 'bg-white text-neutral-text hover:bg-forest-50'
              }`}
            >{c}</button>
          ))}
        </div>
        <button onClick={openNewForm} className="flex items-center gap-2 rounded-lg bg-forest-700 px-4 py-2 text-sm text-white hover:bg-forest-800">
          <Plus className="h-4 w-4" /> 新建规则
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-border bg-neutral-bg">
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">规则名称</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">品类</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">类型</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">系数</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">优先级</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">状态</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-border animate-pulse">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-20 rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.map((rule) => (
              <tr key={(rule.id as string)} className="border-b border-neutral-border hover:bg-neutral-bg/50">
                <td className="px-4 py-3 font-medium text-neutral-text">{rule.name as string}</td>
                <td className="px-4 py-3"><CategoryBadge category={(rule.category as string) || ''} /></td>
                <td className="px-4 py-3"><TypeBadge type={(rule.type as string) || ''} /></td>
                <td className="px-4 py-3 text-neutral-text">×{(rule.modifier as number)?.toFixed(2)}</td>
                <td className="px-4 py-3 text-neutral-text">{rule.priority as number}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(rule)} className={`relative h-6 w-11 rounded-full transition-colors ${(rule.enabled as boolean) ? 'bg-forest-700' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${(rule.enabled as boolean) ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEditForm(rule)} className="text-neutral-muted hover:text-forest-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-text">{editingId ? '编辑规则' : '新建规则'}</h3>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-neutral-muted" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-neutral-muted">规则名称</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-neutral-muted">品类</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-neutral-muted">类型</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs text-neutral-muted">条件</label>
                  <button onClick={() => setForm((f) => ({ ...f, conditions: [...f.conditions, { field: 'weight', operator: 'gte', value: '' }] }))}
                    className="text-xs text-forest-700 hover:underline">+ 添加条件</button>
                </div>
                {form.conditions.map((cond, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <select value={cond.field} onChange={(e) => {
                      const next = [...form.conditions]; next[i] = { ...next[i], field: e.target.value }; setForm((f) => ({ ...f, conditions: next }));
                    }} className="rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none">
                      {FIELDS.map((f) => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}
                    </select>
                    <select value={cond.operator} onChange={(e) => {
                      const next = [...form.conditions]; next[i] = { ...next[i], operator: e.target.value }; setForm((f) => ({ ...f, conditions: next }));
                    }} className="rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none">
                      {OPERATORS.map((op) => <option key={op} value={op}>{OP_LABELS[op]}</option>)}
                    </select>
                    <input value={cond.value} onChange={(e) => {
                      const next = [...form.conditions]; next[i] = { ...next[i], value: e.target.value }; setForm((f) => ({ ...f, conditions: next }));
                    }} placeholder="值" className="flex-1 rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none" />
                    <button onClick={() => {
                      const next = form.conditions.filter((_, idx) => idx !== i); setForm((f) => ({ ...f, conditions: next }));
                    }}><X className="h-4 w-4 text-neutral-muted" /></button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-neutral-muted">乘数系数</label>
                  <input type="number" step="0.01" value={form.modifier} onChange={(e) => setForm((f) => ({ ...f, modifier: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-neutral-muted">优先级</label>
                  <input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-muted">启用</label>
                <button onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))} className={`relative h-6 w-11 rounded-full transition-colors ${form.enabled ? 'bg-forest-700' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-neutral-border px-4 py-2 text-sm text-neutral-text hover:bg-neutral-bg">取消</button>
              <button onClick={handleSubmit} className="rounded-lg bg-forest-700 px-4 py-2 text-sm text-white hover:bg-forest-800">确认</button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-neutral-text">
          <Calculator className="h-5 w-5" /> 价格计算器
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="mb-1 block text-xs text-neutral-muted">品类</label>
            <select value={calcCategory} onChange={(e) => setCalcCategory(e.target.value)}
              className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none">
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-muted">品牌</label>
            <select value={calcBrand} onChange={(e) => setCalcBrand(e.target.value)}
              className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none">
              <option value="">选择品牌</option>
              {(BRAND_LISTS[calcCategory] || []).map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-muted">成色</label>
            <select value={calcCondition} onChange={(e) => setCalcCondition(e.target.value)}
              className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none">
              <option value="">选择成色</option>
              {CONDITION_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-muted">重量(kg)</label>
            <input type="number" value={calcWeight} onChange={(e) => setCalcWeight(e.target.value)}
              className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none" />
          </div>
        </div>
        <button onClick={handleCalculate} className="mt-4 rounded-lg bg-forest-700 px-4 py-2 text-sm text-white hover:bg-forest-800">
          计算
        </button>
        {calcResult && (
          <div className="mt-4 rounded-xl bg-forest-50 p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-neutral-muted">基础价格</p><p className="text-lg font-bold text-neutral-text">¥{(calcResult.base_price as number)?.toFixed(2)}</p></div>
              <div><p className="text-xs text-neutral-muted">调整项</p><p className="text-lg font-bold text-forest-700">+¥{(calcResult.adjustment as number)?.toFixed(2)}</p></div>
              <div><p className="text-xs text-neutral-muted">最终价格</p><p className="text-lg font-bold text-forest-700">¥{(calcResult.final_price as number)?.toFixed(2)}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
