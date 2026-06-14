import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import { useEstimateStore } from '@/stores/useEstimateStore';
import { CATEGORY_LABELS, BRAND_LISTS, MODEL_LISTS, CONDITION_OPTIONS } from '@/utils/constants';

const CATEGORIES = ['clothing', 'book', 'phone'] as const;

function StepIndicator({ current }: { current: number }) {
  const steps = ['选择分类', '填写参数', '估价结果'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
            i < current ? 'bg-forest-700 text-white' : i === current ? 'bg-mint-400 text-white' : 'bg-gray-100 text-neutral-muted'
          }`}>
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          <span className={`ml-1.5 text-sm ${i === current ? 'font-medium text-forest-700' : 'text-neutral-muted'}`}>{label}</span>
          {i < steps.length - 1 && <div className="mx-3 h-px w-8 bg-neutral-border" />}
        </div>
      ))}
    </div>
  );
}

function CategorySelect({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`rounded-xl p-6 text-left transition-all ${
            selected === cat
              ? 'bg-mint-50 ring-2 ring-mint-400 shadow-card-hover'
              : 'bg-white shadow-card hover:shadow-card-hover'
          }`}
        >
          <CategoryIcon category={cat} size="lg" />
          <p className="mt-2 text-sm text-neutral-muted">{CATEGORY_LABELS[cat]}</p>
        </button>
      ))}
    </div>
  );
}

function CategorySwitch({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {CATEGORIES.map((cat) => {
        const label = CATEGORY_LABELS[cat];
        return (
          <button
            key={cat}
            type="button"
            aria-label={`${label} ${label}`}
            onClick={() => onSelect(cat)}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              selected === cat
                ? 'border-mint-400 bg-mint-50 text-forest-700'
                : 'border-neutral-border bg-white text-neutral-text hover:bg-gray-50'
            }`}
          >
            <CategoryIcon category={cat} size="sm" showLabel={false} />
            <span>{label}</span>
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ParamForm({
  category,
  onCategoryChange,
  onSubmit,
}: {
  category: string;
  onCategoryChange: (c: string) => void;
  onSubmit: (d: Record<string, string>) => void;
}) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');

  useEffect(() => {
    setBrand('');
    setModel('');
    setCondition('');
    setWeight('');
    setAge('');
  }, [category]);

  const brands = BRAND_LISTS[category] || [];
  const models = MODEL_LISTS[category] || [];
  const filteredModels = category === 'phone' && brand
    ? models.filter((m) => {
        const bm: Record<string, string> = { Apple: 'iPhone', Huawei: 'Mate|P', Xiaomi: 'Redmi', OPPO: 'Reno', vivo: 'X', Samsung: 'Galaxy' };
        return m.value.includes(bm[brand] || brand);
      })
    : models;
  const handleSubmit = () => {
    const data: Record<string, string> = { category, brand, condition };
    if (model) data.model = model;
    if (weight) data.weight = weight;
    if (age) data.age = age;
    onSubmit(data);
  };
  const valid = brand && condition;
  const inputCls = 'w-full rounded-xl border border-neutral-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mint-400';
  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div>
        <label className="block text-sm font-medium text-neutral-text mb-1.5">回收分类</label>
        <CategorySwitch selected={category} onSelect={onCategoryChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-text mb-1.5">{category === 'book' ? '出版社' : '品牌'}</label>
        <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); }} className={inputCls}>
          <option value="">请选择</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      {filteredModels.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-neutral-text mb-1.5">{category === 'book' ? '书名' : '型号'}</label>
          <select value={model} onChange={(e) => setModel(e.target.value)} className={inputCls}>
            <option value="">请选择</option>
            {filteredModels.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-neutral-text mb-1.5">成色</label>
        <div className="flex gap-2 flex-wrap">
          {CONDITION_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setCondition(opt.value)}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                condition === opt.value ? 'bg-mint-50 text-forest-700 ring-1 ring-mint-400' : 'bg-gray-50 text-neutral-text hover:bg-gray-100'
              }`}>{opt.label}</button>
          ))}
        </div>
      </div>
      {category !== 'phone' && (
        <div>
          <label className="block text-sm font-medium text-neutral-text mb-1.5">重量 (kg)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="请输入重量" min="0" step="0.1" className={inputCls} />
        </div>
      )}
      {category === 'phone' && (
        <div>
          <label className="block text-sm font-medium text-neutral-text mb-1.5">使用时长</label>
          <select value={age} onChange={(e) => setAge(e.target.value)} className={inputCls}>
            <option value="">请选择</option>
            <option value="0-6">6个月以内</option>
            <option value="6-12">6-12个月</option>
            <option value="12-24">1-2年</option>
            <option value="24+">2年以上</option>
          </select>
        </div>
      )}
      <button onClick={handleSubmit} disabled={!valid}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed">获取估价</button>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  return (
    <div className="relative h-24 w-24">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#52B788" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-forest-700">{value}%</div>
    </div>
  );
}

const MOCK_FACTORS = [
  { label: '品牌溢价', weight: 30 },
  { label: '成色评估', weight: 25 },
  { label: '市场供需', weight: 25 },
  { label: '使用时长', weight: 20 },
];

function ResultPanel({ result, category }: { result: Record<string, unknown>; category: string }) {
  const navigate = useNavigate();
  const minPrice = Number(result.minPrice || 50);
  const maxPrice = Number(result.maxPrice || 200);
  const suggested = Number(result.suggestedPrice || Math.round((minPrice + maxPrice) / 2));
  const confidence = Number(result.confidence || 85);
  const categoryLabel = CATEGORY_LABELS[category] || category;

  return (
    <div className="text-center space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-forest-700 to-mint-400 p-8 text-white">
        <p className="text-sm text-white/70">预估价格范围</p>
        <p className="mt-2 text-4xl font-bold">¥{minPrice} - ¥{maxPrice}</p>
        <p className="mt-2 text-sm text-white/80">建议价格：<span className="text-xl font-semibold text-accent-light">¥{suggested}</span></p>
      </div>
      <div className="flex items-center justify-center gap-8">
        <ConfidenceRing value={confidence} />
        <div className="text-left">
          <p className="text-sm font-medium text-neutral-text">估价置信度</p>
          <p className="text-xs text-neutral-muted mt-1">基于AI模型综合评估</p>
        </div>
      </div>
      <div className="rounded-xl bg-white p-6 shadow-card text-left">
        <h4 className="text-sm font-semibold text-neutral-text mb-3">价格影响因素</h4>
        {MOCK_FACTORS.map((f) => (
          <div key={f.label} className="flex items-center gap-3 mb-2">
            <span className="w-20 text-xs text-neutral-muted">{f.label}</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-mint-400" style={{ width: `${f.weight}%` }} />
            </div>
            <span className="text-xs font-medium text-forest-700">{f.weight}%</span>
          </div>
        ))}
      </div>
      <div className="grid gap-3 rounded-xl bg-white p-6 text-left shadow-card sm:grid-cols-2">
        <div>
          <p className="text-xs text-neutral-muted">估价对象</p>
          <p className="mt-1 text-sm font-medium text-neutral-text">{categoryLabel} · AI初筛 · 多级定价</p>
        </div>
        <div>
          <p className="text-xs text-neutral-muted">预约取件</p>
          <p className="mt-1 text-sm font-medium text-neutral-text">今日 18:00-20:00 或明日 9:00-12:00</p>
        </div>
        <div>
          <p className="text-xs text-neutral-muted">快递员LBS派单</p>
          <p className="mt-1 text-sm font-medium text-neutral-text">最近网点 1.2km · 预计30分钟接单</p>
        </div>
        <div>
          <p className="text-xs text-neutral-muted">质检SOP</p>
          <p className="mt-1 text-sm font-medium text-neutral-text">图片上传 · AI初筛 · 人工复核 · T+0打款</p>
        </div>
      </div>
      <button onClick={() => navigate('/appointment', { state: { estimate: result, category } })}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 font-semibold text-white transition hover:bg-accent-dark">
        立即预约 <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function Estimate() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const { submitEstimate, loading } = useEstimateStore();

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && CATEGORIES.includes(cat as typeof CATEGORIES[number])) {
      setCategory(cat);
      setStep(1);
    }
  }, [searchParams]);

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setResult(null);
    setStep(1);
  };

  const handleFormSubmit = async (data: Record<string, string>) => {
    const res = await submitEstimate(data);
    if (res) {
      setResult(res as Record<string, unknown>);
      setStep(2);
    } else {
      setResult({ minPrice: 50, maxPrice: 200, suggestedPrice: 125, confidence: 85 });
      setStep(2);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <StepIndicator current={step} />
      <div className={`transition-all duration-300 ${step === 0 ? '' : 'hidden'}`}>
        <h2 className="text-xl font-bold text-forest-700 text-center mb-6">选择回收分类</h2>
        <CategorySelect selected={category} onSelect={handleCategorySelect} />
      </div>
      <div className={`transition-all duration-300 ${step === 1 ? '' : 'hidden'}`}>
        <div className="flex items-center justify-center gap-2 mb-6">
          <CategoryIcon category={category} size="md" />
          <h2 className="text-xl font-bold text-forest-700">填写回收参数</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-mint-400" /></div>
        ) : (
          <ParamForm category={category} onCategoryChange={handleCategorySelect} onSubmit={handleFormSubmit} />
        )}
      </div>
      <div className={`transition-all duration-300 ${step === 2 ? '' : 'hidden'}`}>
        {result && <ResultPanel result={result} category={category} />}
      </div>
    </div>
  );
}
