import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shirt,
  BookOpen,
  Smartphone,
  Layers,
  Calculator,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockPricingRules } from '@/data/mockData';
import type { Category, PricingRule } from '../../../shared/types';

type TabKey = Category | 'all';

const tabs: { key: TabKey; label: string; icon: typeof Shirt }[] = [
  { key: 'all', label: '全部', icon: Layers },
  { key: 'clothing', label: '衣服', icon: Shirt },
  { key: 'books', label: '图书', icon: BookOpen },
  { key: 'phones', label: '手机', icon: Smartphone },
];

const formulaLabelMap: Record<string, string> = {
  per_kg: '按公斤计价',
  per_item: '按件计价',
  fixed: '固定价格',
  percentage: '比例计价',
};

const fieldLabelMap: Record<string, string> = {
  weight: '重量',
  condition: '成色',
  brand: '品牌',
  model: '型号',
  quantity: '数量',
};

const operatorLabelMap: Record<string, string> = {
  eq: '等于',
  gt: '大于',
  lt: '小于',
  gte: '大于等于',
  lte: '小于等于',
  in: '包含',
  between: '介于',
};

export default function PricingList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [rules, setRules] = useState<PricingRule[]>(mockPricingRules);

  const filteredRules = rules.filter((r) => {
    if (activeTab === 'all') return true;
    return r.category === activeTab;
  });

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const getFormulaDesc = (rule: PricingRule) => {
    const parts: string[] = [];
    parts.push(`基础价 ¥${rule.formula.basePrice}`);
    if (rule.formula.multipliers.length > 0) {
      const multiplierDesc = rule.formula.multipliers
        .map((m) => `${fieldLabelMap[m.field] || m.field}×${m.factor}`)
        .join(' + ');
      parts.push(multiplierDesc);
    }
    return parts.join('，');
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">定价规则引擎</h1>
          <p className="text-sm text-neutral-500 mt-1">配置不同品类和条件下的回收定价规则</p>
        </div>
        <button
          onClick={() => navigate('/admin/pricing/new')}
          className="btn-primary gap-2"
        >
          <Plus className="w-4.5 h-4.5" />
          新增规则
        </button>
      </div>

      <div className="card p-1.5 mb-6 inline-flex">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          const count = key === 'all' ? rules.length : rules.filter((r) => r.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-eco-500 to-eco-600 text-white shadow-card'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredRules.length === 0 ? (
        <div className="card p-16 text-center">
          <Calculator className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
          <p className="text-neutral-400">暂无定价规则</p>
          <button
            onClick={() => navigate('/admin/pricing/new')}
            className="btn-secondary mt-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            创建第一条规则
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRules.map((rule, idx) => {
            const CatIcon = tabs.find((t) => t.key === rule.category)?.icon || Layers;
            return (
              <div
                key={rule.id}
                className={cn(
                  'card p-5 animate-slide-up transition-all duration-300',
                  !rule.enabled && 'opacity-60'
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
                        rule.enabled
                          ? 'bg-gradient-to-br from-eco-100 to-emerald-100'
                          : 'bg-neutral-100'
                      )}
                    >
                      <CatIcon
                        className={cn(
                          'w-5 h-5',
                          rule.enabled ? 'text-eco-600' : 'text-neutral-400'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-800">{rule.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                        <span className="text-xs text-neutral-400">优先级 {rule.priority}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggleRule(rule.id)} className="p-1">
                    {rule.enabled ? (
                      <ToggleRight className="w-9 h-9 text-eco-500" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-neutral-300" />
                    )}
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Filter className="w-4 h-4 text-eco-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">匹配条件</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rule.conditions.length === 0 ? (
                          <span className="text-xs text-neutral-400">无特殊条件</span>
                        ) : (
                          rule.conditions.map((cond, i) => (
                            <span
                              key={i}
                              className="badge bg-neutral-100 text-neutral-600"
                            >
                              {fieldLabelMap[cond.field] || cond.field}{' '}
                              {operatorLabelMap[cond.operator] || cond.operator}{' '}
                              {Array.isArray(cond.value) ? cond.value.join('/') : String(cond.value)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-eco-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">定价公式</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge bg-eco-50 text-eco-700">
                          {formulaLabelMap[rule.formula.type] || rule.formula.type}
                        </span>
                        <p className="text-sm text-neutral-600">{getFormulaDesc(rule)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => navigate(`/admin/pricing/${rule.id}`)}
                    className="flex-1 btn-secondary !py-2 !px-3 text-sm gap-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                  <button className="btn-secondary !py-2 !px-3 text-sm gap-1.5 text-red-500 hover:!text-red-500 hover:!border-red-300 hover:!bg-red-50">
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
