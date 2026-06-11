import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, Loader2, Circle, AlertTriangle, Info } from 'lucide-react';

type Step = 'upload' | 'analyzing' | 'results';

const SCORES = [
  { label: '动词强度', value: 72, color: 'brand-500' },
  { label: '量化完整度', value: 58, color: 'gold-500' },
  { label: '排版评分', value: 85, color: 'brand-500' },
  { label: 'ATS兼容度', value: 67, color: 'brand-500' },
];

const SUGGESTIONS = [
  { id: 1, priority: '高' as const, title: "动词'负责'强度不足", desc: '建议替换为"主导""推动""搭建"等强动词，增强表达力', icon: 'warning' as const },
  { id: 2, priority: '中' as const, title: '缺少量化数据', desc: '工作成果缺乏数字支撑，建议补充关键指标如"提升30%""管理5人团队"', icon: 'warning' as const },
  { id: 3, priority: '低' as const, title: '技能分类不够清晰', desc: '技术栈与软技能混排，建议按类别分组展示', icon: 'info' as const },
];

function ScoreGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const stroke = color === 'gold-500' ? '#D4A843' : '#00D68F';
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <motion.circle
          cx="44" cy="44" r={r} fill="none" stroke={stroke} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-lg font-semibold" style={{ marginTop: 24 }}>{value}</span>
      <span className="text-sm text-surface-300">{label}</span>
    </div>
  );
}

function PriorityBadge({ level }: { level: '高' | '中' | '低' }) {
  const cls = level === '高' ? 'bg-red-100 text-red-600' : level === '中' ? 'bg-yellow-50 text-gold-500' : 'bg-gray-100 text-gray-500';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{level}</span>;
}

export default function Lab() {
  const [step, setStep] = useState<Step>('upload');
  const [applied, setApplied] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (step !== 'analyzing') return;
    const t = setTimeout(() => setStep('results'), 3000);
    return () => clearTimeout(t);
  }, [step]);

  const toggleApply = (id: number) => {
    setApplied(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-full p-8">
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-[calc(100vh-4rem)]"
          >
            <div className="relative w-full max-w-xl">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'radial-gradient(circle, #00D68F 0.8px, transparent 0.8px)',
                backgroundSize: '20px 20px',
              }} />
              <button onClick={() => setStep('analyzing')}
                className="relative w-full py-20 border-dashed border-2 border-brand-300 rounded-2xl bg-white/60 backdrop-blur flex flex-col items-center gap-3 cursor-pointer hover:border-brand-500 hover:bg-brand-50/40 transition-colors"
              >
                <Upload className="w-10 h-10 text-brand-500" />
                <p className="text-lg font-medium text-gray-700">拖拽PDF简历到此处</p>
                <p className="text-sm text-surface-300">或点击选择文件</p>
              </button>
            </div>
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-[calc(100vh-4rem)]"
          >
            <div className="flex flex-col items-center gap-8">
              <svg width="80" height="80" className="-rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" strokeWidth="5" />
                <motion.circle cx="40" cy="40" r="34" fill="none" stroke="#00D68F" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray={2 * Math.PI * 34}
                  animate={{ strokeDashoffset: 0 }} transition={{ duration: 2.5, ease: 'linear' }}
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                />
              </svg>
              <p className="text-lg font-medium text-gray-700">正在解析简历...</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'OCR识别', Icon: CheckCircle2, done: true },
                  { label: '结构化提取', Icon: Loader2, active: true },
                  { label: 'AI优化分析', Icon: Circle, pending: true },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <s.Icon className={`w-5 h-5 ${s.done ? 'text-brand-500' : s.active ? 'text-brand-500 animate-spin' : 'text-gray-300'}`} />
                    <span className={s.done ? 'text-brand-500' : s.active ? 'text-brand-500' : 'text-gray-400'}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto space-y-8"
          >
            {/* Score Dashboard */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-center gap-10 flex-wrap">
                {SCORES.map((s) => (
                  <div key={s.label} className="relative flex flex-col items-center">
                    <ScoreGauge {...s} />
                  </div>
                ))}
                <div className="flex flex-col items-center justify-center px-6">
                  <motion.span className="text-5xl font-bold text-brand-500"
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >70</motion.span>
                  <span className="text-sm text-surface-300 mt-1">综合评分</span>
                </div>
              </div>
            </section>

            {/* Optimization Suggestions */}
            <section className="bg-white rounded-2xl p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">优化建议</h2>
              {SUGGESTIONS.map((s) => (
                <div key={s.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${applied.has(s.id) ? 'border-brand-200 bg-brand-50/40' : 'border-gray-100'}`}>
                  <div className="mt-1">{s.icon === 'warning' ? <AlertTriangle className="w-5 h-5 text-gold-500" /> : <Info className="w-5 h-5 text-gray-400" />}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <PriorityBadge level={s.priority} />
                      <span className="font-medium text-gray-800">{s.title}</span>
                    </div>
                    <p className="text-sm text-surface-300">{s.desc}</p>
                  </div>
                  <button onClick={() => toggleApply(s.id)}
                    className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${applied.has(s.id) ? 'bg-brand-100 text-brand-700' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
                  >{applied.has(s.id) ? '已修复' : '一键修复'}</button>
                </div>
              ))}
            </section>

            {/* Before/After Comparison */}
            <section className="grid grid-cols-2 gap-6 pb-8">
              {[
                { title: '优化前', content: [
                  { old: '负责项目管理，推动项目进展', new: '' },
                  { old: '参与团队建设', new: '' },
                ]},
                { title: '优化后', content: [
                  { old: '负责项目管理，推动项目进展', new: '主导5个核心项目，推动交付效率提升30%' },
                  { old: '参与团队建设', new: '搭建12人跨职能团队，建立标准化流程' },
                ]},
              ].map((panel) => (
                <div key={panel.title} className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 mb-4">{panel.title}</h3>
                  <div className="space-y-3">
                    {panel.content.map((line, i) => (
                      <div key={i}>
                        {panel.title === '优化前' ? (
                          <p className="text-gray-500 line-through decoration-red-400">{line.old}</p>
                        ) : (
                          <>
                            <p className="text-gray-400 line-through decoration-red-300 text-sm">{line.old}</p>
                            <p className="text-brand-500 font-medium">{line.new}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
