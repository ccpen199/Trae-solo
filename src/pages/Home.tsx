import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare, FlaskConical, Palette, ArrowRight,
  ChevronLeft, ChevronRight, Sparkles, Star, FileText, TrendingUp,
} from 'lucide-react';
import { mockCases } from '@/data/mockCases';

const features = [
  { icon: MessageSquare, title: 'AI对话创作', desc: '用自然语言描述经历，AI 自动生成结构化简历内容，告别空白页面' },
  { icon: FlaskConical, title: '简历实验室', desc: '上传 PDF 深度分析，获取 ATS 评分与 HR 视角的优化建议' },
  { icon: Palette, title: '模板引擎', desc: 'CSS 主题自由切换，拖拽排版实时预览，打造专属视觉风格' },
];

const stats = [
  { value: 78, suffix: '%', label: 'ATS通过率', color: 'text-brand-500' },
  { value: 50000, suffix: '+', label: '用户', color: 'text-gold-500' },
  { value: 35, suffix: '%', label: '优化效果提升', color: 'text-brand-500' },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const step = Math.max(1, Math.floor(value / 60));
        let v = 0;
        const id = setInterval(() => {
          v += step;
          if (v >= value) { v = value; clearInterval(id); }
          setCurrent(v);
        }, 16);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  const formatted = value >= 1000 ? current.toLocaleString() : current;
  return <span ref={ref}>{formatted}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' } }),
};

export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  const showcaseCases = mockCases.slice(0, 4);

  return (
    <div className="min-h-screen bg-surface-50 overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-900">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-950 to-brand-900 animate-gradient-flow bg-[length:200%_200%]" />
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-brand-500/30 animate-pulse-glow"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
        <div className="absolute left-[8%] top-[20%] w-48 h-64 rounded-xl border border-brand-500/20 bg-white/5 backdrop-blur-sm p-4 animate-float shadow-2xl shadow-brand-500/10">
          <div className="h-3 w-20 bg-brand-500/30 rounded mb-3" />
          <div className="h-2 w-full bg-white/10 rounded mb-2" />
          <div className="h-2 w-4/5 bg-white/10 rounded mb-2" />
          <div className="h-2 w-3/5 bg-white/10 rounded mb-4" />
          <div className="h-2 w-full bg-brand-500/20 rounded mb-2" />
          <div className="h-2 w-2/3 bg-brand-500/20 rounded" />
        </div>
        <div className="absolute right-[10%] top-[25%] w-44 h-56 rounded-xl border border-gold-500/20 bg-white/5 backdrop-blur-sm p-4 animate-float-delay shadow-2xl shadow-gold-500/10">
          <div className="h-3 w-16 bg-gold-500/30 rounded mb-3" />
          <div className="h-2 w-full bg-white/10 rounded mb-2" />
          <div className="h-2 w-3/4 bg-white/10 rounded mb-4" />
          <div className="h-2 w-full bg-gold-500/20 rounded mb-2" />
          <div className="h-2 w-1/2 bg-gold-500/20 rounded" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Sparkles className="w-8 h-8 text-brand-500 mx-auto mb-6" />
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
              ResumeForge<span className="text-brand-500"> AI</span>
            </h1>
            <p className="font-body text-lg md:text-xl text-brand-200/80 mb-10 max-w-xl mx-auto leading-relaxed">
              AI 原生简历创作平台 — 用对话重塑简历，用数据驱动决策
            </p>
            <Link to="/create" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
              开始创作 <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl md:text-5xl font-bold text-brand-900 mb-4">
              核心能力
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="font-body text-surface-300 text-lg">
              三位一体，重新定义简历创作流程
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-card card-hover p-8 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-brand-500/10 flex items-center justify-center mx-auto mb-5">
                  <f.icon className="w-7 h-7 text-brand-500" />
                </div>
                <h3 className="font-display text-xl font-bold text-brand-900 mb-3">{f.title}</h3>
                <p className="font-body text-surface-300 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cases Carousel */}
      <section className="py-28 px-6 bg-brand-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">案例展示</h2>
              <p className="font-body text-brand-200/60">真实用户，真实成果</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-full border border-brand-500/30 flex items-center justify-center text-brand-500 hover:bg-brand-500/10 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => scroll(1)} className="w-10 h-10 rounded-full border border-brand-500/30 flex items-center justify-center text-brand-500 hover:bg-brand-500/10 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="flex gap-6 overflow-x-auto scrollbar-none pb-4" style={{ scrollbarWidth: 'none' }}>
            {showcaseCases.map((c, i) => (
              <motion.div
                key={c.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="min-w-[300px] flex-shrink-0 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-brand-500/20 text-brand-400">{c.industry}</span>
                  <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-gold-500/20 text-gold-400">{c.position}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">{c.title}</h3>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                  <span className="font-mono text-sm text-gold-500">{c.rating}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 text-xs font-body bg-white/5 text-brand-200/70 rounded">{t}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Data */}
      <section className="py-28 px-6 bg-surface-50">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl md:text-5xl font-bold text-brand-900 mb-4">
              数据说话
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="font-body text-surface-300 text-lg">
              用效果证明实力
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-12">
            {stats.map((s, i) => (
              <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
                <div className={`font-display text-5xl md:text-6xl font-bold ${s.color} mb-3`}>
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                </div>
                <div className="flex items-center justify-center gap-2 font-body text-surface-300">
                  {i === 0 && <FileText className="w-4 h-4" />}
                  {i === 1 && <TrendingUp className="w-4 h-4" />}
                  {i === 2 && <Sparkles className="w-4 h-4" />}
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-28 px-6 bg-brand-900">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
              准备好打造你的<span className="text-brand-500">理想简历</span>了吗？
            </h2>
            <p className="font-body text-brand-200/60 text-lg mb-10">
              无需模板，无需焦虑 — 让 AI 成为你的简历搭档
            </p>
            <Link to="/create" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
              开始创作 <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
