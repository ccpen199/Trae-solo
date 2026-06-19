import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FileText,
  Filter,
  Calculator,
  FlaskConical,
  Tag,
  ArrowUpDown,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type {
  Category,
  PricingCondition,
  PricingField,
  PricingFormulaType,
  PricingOperator,
  PricingRule,
} from '../../../shared/types';

const categoryOptions: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: '全品类' },
  { value: 'clothing', label: '衣服' },
  { value: 'books', label: '图书' },
  { value: 'phones', label: '手机' },
];

const fieldOptions: { value: PricingField; label: string }[] = [
  { value: 'weight', label: '重量 (kg)' },
  { value: 'condition', label: '成色 (1-10)' },
  { value: 'brand', label: '品牌' },
  { value: 'model', label: '型号' },
  { value: 'quantity', label: '数量' },
];

const operatorOptions: { value: PricingOperator; label: string; needTwoValues?: boolean }[] = [
  { value: 'eq', label: '等于' },
  { value: 'gt', label: '大于' },
  { value: 'lt', label: '小于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lte', label: '小于等于' },
  { value: 'in', label: '包含于' },
  { value: 'between', label: '介于', needTwoValues: true },
];

const formulaTypeOptions: { value: PricingFormulaType; label: string }[] = [
  { value: 'per_kg', label: '按公斤计价' },
  { value: 'per_item', label: '按件计价' },
  { value: 'fixed', label: '固定价格' },
  { value: 'percentage', label: '比例计价' },
];

const multiplierFieldOptions: { value: string; label: string }[] = [
  { value: 'condition', label: '成色' },
  { value: 'weight', label: '重量' },
  { value: 'brand', label: '品牌' },
  { value: 'quantity', label: '数量' },
];

type DropdownKey = 'category' | `field-${number}` | `operator-${number}` | 'formulaType' | `multiField-${number}` | null;

export default function PricingEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { pricingRules, brands } = useStore();
  const isNew = id === 'new';
  const existingRule = pricingRules.find((r) => r.id === id);

  const [name, setName] = useState(existingRule?.name || '');
  const [category, setCategory] = useState<Category | 'all'>(existingRule?.category || 'all');
  const [priority, setPriority] = useState(existingRule?.priority || 10);
  const [enabled, setEnabled] = useState(existingRule?.enabled ?? true);
  const [conditions, setConditions] = useState<PricingCondition[]>(
    existingRule?.conditions || [{ field: 'weight', operator: 'gt', value: 0 }]
  );
  const [formulaType, setFormulaType] = useState<PricingFormulaType>(existingRule?.formula.type || 'per_kg');
  const [basePrice, setBasePrice] = useState(existingRule?.formula.basePrice || 0);
  const [multipliers, setMultipliers] = useState<{ field: string; factor: number }[]>(
    existingRule?.formula.multipliers || []
  );
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);

  const [testWeight, setTestWeight] = useState(5);
  const [testCondition, setTestCondition] = useState(7);
  const [testBrand, setTestBrand] = useState('Apple');
  const [testQuantity, setTestQuantity] = useState(10);

  const addCondition = () => {
    setConditions((prev) => [...prev, { field: 'weight', operator: 'gt', value: 0 }]);
  };

  const removeCondition = (idx: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx: number, updates: Partial<PricingCondition>) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...updates } : c))
    );
  };

  const addMultiplier = () => {
    setMultipliers((prev) => [...prev, { field: 'condition', factor: 0.1 }]);
  };

  const removeMultiplier = (idx: number) => {
    setMultipliers((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMultiplier = (idx: number, field: string, factor: number) => {
    setMultipliers((prev) =>
      prev.map((m, i) => (i === idx ? { field, factor } : m))
    );
  };

  const testResult = useMemo(() => {
    let price = basePrice;

    if (formulaType === 'per_kg') {
      price = basePrice * testWeight;
    } else if (formulaType === 'per_item') {
      price = basePrice * testQuantity;
    }

    multipliers.forEach((m) => {
      let fieldValue = 0;
      if (m.field === 'condition') fieldValue = testCondition;
      else if (m.field === 'weight') fieldValue = testWeight;
      else if (m.field === 'quantity') fieldValue = testQuantity;
      else if (m.field === 'brand') fieldValue = brands.some((b) => b.name === testBrand) ? 1.5 : 1;
      price += price * fieldValue * m.factor;
    });

    return Number(price.toFixed(2));
  }, [basePrice, formulaType, multipliers, testWeight, testCondition, testBrand, testQuantity]);

  const handleSave = () => {
    const rule: PricingRule = {
      id: existingRule?.id || `rule-${Date.now()}`,
      name,
      category,
      priority,
      enabled,
      conditions,
      formula: {
        type: formulaType,
        basePrice,
        multipliers,
      },
    };
    console.log('保存规则:', rule);
    navigate('/admin/pricing');
  };

  const renderDropdown = (
    key: DropdownKey,
    value: string,
    options: { value: string; label: string }[],
    onChange: (v: string) => void,
    className?: string
  ) => (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
        className="w-full input-base !py-2.5 flex items-center justify-between text-left"
      >
        <span>{options.find((o) => o.value === value)?.label || value}</span>
        <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform', openDropdown === key && 'rotate-180')} />
      </button>
      {openDropdown === key && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-neutral-100 z-50 overflow-hidden max-h-56 overflow-y-auto animate-fade-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpenDropdown(null);
              }}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm transition-colors',
                value === opt.value ? 'bg-eco-50 text-eco-700 font-medium' : 'text-neutral-700 hover:bg-neutral-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 animate-fade-in" onClick={() => setOpenDropdown(null)}>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/pricing')}
          className="p-2.5 rounded-xl bg-white shadow-card border border-neutral-100 hover:bg-eco-50 hover:border-eco-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{isNew ? '新增定价规则' : '编辑定价规则'}</h1>
          <p className="text-sm text-neutral-500 mt-1">配置回收定价的条件和计算公式</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-eco-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-800">基本信息</h3>
                <p className="text-xs text-neutral-400 mt-0.5">规则名称和适用范围</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setEnabled(!enabled); }} className="p-1">
                {enabled ? (
                  <ToggleRight className="w-10 h-10 text-eco-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-neutral-300" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label-base">规则名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入规则名称，如：衣物基础定价"
                  className="input-base"
                />
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <label className="label-base">适用品类</label>
                {renderDropdown(
                  'category',
                  category,
                  categoryOptions as unknown as { value: string; label: string }[],
                  (v) => setCategory(v as Category | 'all')
                )}
              </div>
              <div>
                <label className="label-base flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                  优先级（数字越小优先级越高）
                </label>
                <input
                  type="number"
                  min={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="input-base"
                />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-eco-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">匹配条件</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">设置规则生效的前置条件</p>
                </div>
              </div>
              <button
                onClick={addCondition}
                className="btn-secondary !py-2 !px-3 text-sm gap-1.5"
              >
                <Plus className="w-4 h-4" />
                添加条件
              </button>
            </div>

            {conditions.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-sm border-2 border-dashed border-neutral-200 rounded-xl">
                暂无匹配条件，规则将对所有物品生效
              </div>
            ) : (
              <div className="space-y-3">
                {conditions.map((cond, idx) => {
                  const op = operatorOptions.find((o) => o.value === cond.operator);
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl animate-slide-up"
                      style={{ animationDelay: `${idx * 30}ms` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-3">
                          <label className="text-xs text-neutral-400 mb-1 block">条件字段</label>
                          {renderDropdown(
                            `field-${idx}` as DropdownKey,
                            cond.field,
                            fieldOptions as unknown as { value: string; label: string }[],
                            (v) => updateCondition(idx, { field: v as PricingField })
                          )}
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-xs text-neutral-400 mb-1 block">操作符</label>
                          {renderDropdown(
                            `operator-${idx}` as DropdownKey,
                            cond.operator,
                            operatorOptions as unknown as { value: string; label: string }[],
                            (v) => updateCondition(idx, { operator: v as PricingOperator })
                          )}
                        </div>
                        <div className={cn('md:col-span-6', op?.needTwoValues && 'md:col-span-6')}>
                          <label className="text-xs text-neutral-400 mb-1 block">
                            {op?.needTwoValues ? '值范围（最小值 - 最大值）' : '值'}
                          </label>
                          {op?.needTwoValues ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={Array.isArray(cond.value) ? cond.value[0] : ''}
                                onChange={(e) =>
                                  updateCondition(idx, {
                                    value: [e.target.value, Array.isArray(cond.value) ? cond.value[1] : ''],
                                  })
                                }
                                placeholder="最小值"
                                className="input-base !py-2.5"
                              />
                              <span className="text-neutral-400">-</span>
                              <input
                                type="text"
                                value={Array.isArray(cond.value) ? cond.value[1] : ''}
                                onChange={(e) =>
                                  updateCondition(idx, {
                                    value: [Array.isArray(cond.value) ? cond.value[0] : '', e.target.value],
                                  })
                                }
                                placeholder="最大值"
                                className="input-base !py-2.5"
                              />
                            </div>
                          ) : op?.value === 'in' ? (
                            <input
                              type="text"
                              value={Array.isArray(cond.value) ? cond.value.join(', ') : String(cond.value || '')}
                              onChange={(e) =>
                                updateCondition(idx, {
                                  value: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                                })
                              }
                              placeholder="多个值用逗号分隔，如：Apple, 华为, 三星"
                              className="input-base !py-2.5"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(cond.value ?? '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                const numVal = Number(val);
                                updateCondition(idx, {
                                  value: isNaN(numVal) ? val : numVal,
                                });
                              }}
                              placeholder="请输入条件值"
                              className="input-base !py-2.5"
                            />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCondition(idx)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors mt-6"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-eco-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">定价公式</h3>
                <p className="text-xs text-neutral-400 mt-0.5">配置价格计算方式和调整系数</p>
              </div>
            </div>

            <div className="space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-base">计价方式</label>
                  {renderDropdown(
                    'formulaType',
                    formulaType,
                    formulaTypeOptions as unknown as { value: string; label: string }[],
                    (v) => setFormulaType(v as PricingFormulaType)
                  )}
                </div>
                <div>
                  <label className="label-base flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-eco-500" />
                    基础价格 (元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-neutral-700">乘数字段（可选）</label>
                  <button
                    onClick={addMultiplier}
                    className="text-sm text-eco-600 hover:text-eco-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    添加乘数
                  </button>
                </div>
                {multipliers.length === 0 ? (
                  <div className="py-6 text-center text-neutral-400 text-sm border-2 border-dashed border-neutral-200 rounded-xl">
                    暂无乘数字段，将按基础价格计算
                  </div>
                ) : (
                  <div className="space-y-3">
                    {multipliers.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-eco-50/50 rounded-xl animate-slide-up"
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-6">
                            <label className="text-xs text-neutral-400 mb-1 block">字段</label>
                            {renderDropdown(
                              `multiField-${idx}` as DropdownKey,
                              m.field,
                              multiplierFieldOptions,
                              (v) => updateMultiplier(idx, v, m.factor)
                            )}
                          </div>
                          <div className="md:col-span-5">
                            <label className="text-xs text-neutral-400 mb-1 block">系数因子</label>
                            <input
                              type="number"
                              step="0.01"
                              value={m.factor}
                              onChange={(e) => updateMultiplier(idx, m.field, Number(e.target.value))}
                              className="input-base !py-2.5"
                            />
                          </div>
                          <div className="md:col-span-1 flex items-end justify-end">
                            <button
                              onClick={() => removeMultiplier(idx)}
                              className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-gradient-to-r from-eco-50 to-emerald-50 rounded-xl border border-eco-200">
                <p className="text-sm text-neutral-600">
                  <span className="font-semibold text-eco-700">公式预览：</span>
                  最终价格 = {formulaType === 'per_kg' ? `基础价 × 重量` : formulaType === 'per_item' ? `基础价 × 数量` : '基础价'}
                  {multipliers.length > 0 &&
                    multipliers.map((m) => ` × (1 + ${m.field} × ${m.factor})`).join('')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">模拟测试</h3>
                <p className="text-xs text-neutral-400 mt-0.5">输入参数验证定价结果</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-base">重量 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={testWeight}
                  onChange={(e) => setTestWeight(Number(e.target.value))}
                  className="input-base"
                />
              </div>
              <div>
                <label className="label-base">成色 (1-10)</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={testCondition}
                  onChange={(e) => setTestCondition(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-neutral-400">1</span>
                  <span className="text-sm font-bold text-eco-600">{testCondition}</span>
                  <span className="text-xs text-neutral-400">10</span>
                </div>
              </div>
              <div>
                <label className="label-base">品牌</label>
                <input
                  type="text"
                  value={testBrand}
                  onChange={(e) => setTestBrand(e.target.value)}
                  placeholder="如：Apple、华为"
                  className="input-base"
                />
              </div>
              <div>
                <label className="label-base">数量</label>
                <input
                  type="number"
                  min={1}
                  value={testQuantity}
                  onChange={(e) => setTestQuantity(Number(e.target.value))}
                  className="input-base"
                />
              </div>
            </div>

            <div className="mt-5 p-5 bg-gradient-to-br from-eco-500 to-eco-600 rounded-xl text-white">
              <p className="text-sm text-eco-100 mb-1">测试结果</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">¥{testResult.toFixed(2)}</span>
              </div>
              <p className="text-xs text-eco-100 mt-2">
                {formulaType === 'per_kg' && `${basePrice}元/kg × ${testWeight}kg = ¥${(basePrice * testWeight).toFixed(2)}`}
                {formulaType === 'per_item' && `${basePrice}元/件 × ${testQuantity}件 = ¥${(basePrice * testQuantity).toFixed(2)}`}
                {formulaType === 'fixed' && `固定价格 ¥${basePrice.toFixed(2)}`}
                {formulaType === 'percentage' && `比例计价 × 基础价 ¥${basePrice.toFixed(2)}`}
              </p>
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary w-full gap-2 py-4">
            <Save className="w-5 h-5" />
            保存规则
          </button>
        </div>
      </div>
    </div>
  );
}
