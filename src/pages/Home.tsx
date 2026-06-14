import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Search, BadgeCheck, Banknote, CalendarCheck } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';

function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const counted = useCountUp(value);
  return (
    <div className="rounded-xl bg-white p-6 shadow-card text-center">
      <div className="text-3xl font-bold text-forest-700">
        {counted.toLocaleString()}<span className="text-lg text-mint-500 ml-0.5">{suffix}</span>
      </div>
      <div className="mt-1 text-sm text-neutral-muted">{label}</div>
    </div>
  );
}

const CATEGORIES = [
  { key: 'clothing', desc: '品牌衣物、鞋帽配饰，让闲置焕新' },
  { key: 'book', desc: '教材读物、畅销好书，知识循环流转' },
  { key: 'phone', desc: '手机数码、智能设备，环保回收再利用' },
];

const STEPS = [
  { icon: CalendarCheck, label: '预约' },
  { icon: Truck, label: '上门' },
  { icon: Search, label: '质检' },
  { icon: BadgeCheck, label: '估价' },
  { icon: Banknote, label: '打款' },
];

const MOCK_CHARITY = [
  { name: '山区儿童图书角', progress: 72, raised: 3600, target: 5000 },
  { name: '绿色校园计划', progress: 45, raised: 2250, target: 5000 },
];

function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/20"
          style={{
            width: `${4 + (i % 5) * 2}px`,
            height: `${4 + (i % 5) * 2}px`,
            left: `${(i * 5.2) % 100}%`,
            top: `${(i * 7.3 + 10) % 100}%`,
            animation: `float ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function HeroSection() {
  return (
    <div className="relative bg-gradient-to-br from-forest-700 via-forest-600 to-mint-400 py-20 text-white overflow-hidden">
      <Particles />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">让旧物重获新生</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
          专业C2B回收平台，智能估价、上门取件、透明质检、即时打款
        </p>
        <Link
          to="/estimate"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-accent-dark hover:shadow-xl"
        >
          立即估价 <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          100% { transform: translateY(-20px) scale(1.2); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

function ProcessFlow() {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-700 ring-2 ring-forest-200">
              <step.icon className="h-5 w-5" />
            </div>
            <span className="mt-2 text-sm font-medium text-neutral-text">{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="mx-2 h-0.5 w-8 sm:w-16 bg-forest-200 -mt-5" />
          )}
        </div>
      ))}
    </div>
  );
}

function CharityPreview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {MOCK_CHARITY.map((p) => (
        <div key={p.name} className="rounded-xl bg-white p-5 shadow-card">
          <h4 className="font-semibold text-neutral-text">{p.name}</h4>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-mint-400 to-forest-500"
              style={{ width: `${p.progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-muted">
            <span>已筹 ¥{p.raised.toLocaleString()}</span>
            <span>目标 ¥{p.target.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <HeroSection />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <StatCard value={12580} suffix="件" label="累计回收" />
          <StatCard value={8320} suffix="kg" label="减碳量" />
          <StatCard value={6800} suffix="人" label="服务用户" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-forest-700 mb-6">回收分类</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="group rounded-xl bg-white p-6 shadow-card transition hover:shadow-card-hover">
              <CategoryIcon category={cat.key} size="lg" />
              <p className="mt-3 text-sm text-neutral-muted">{cat.desc}</p>
              <Link
                to={`/estimate?category=${cat.key}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-mint-500 transition group-hover:text-forest-700"
              >
                去估价 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-forest-700 mb-6">回收流程</h2>
        <div className="rounded-xl bg-white p-8 shadow-card">
          <ProcessFlow />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-forest-700">公益项目</h2>
          <Link to="/charity" className="text-sm font-medium text-mint-500 hover:text-forest-700">
            查看全部 →
          </Link>
        </div>
        <CharityPreview />
      </section>
    </div>
  );
}
