import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, Loader2, FileText, Zap, Target, Layers, ArrowRight, Sparkles, FileDown, Edit3 } from 'lucide-react';

type Step = 'upload' | 'analyzing' | 'results';

const ATS = [
  { label: '关键词匹配', score: 65, desc: '缺少12个行业核心关键词', color: 'from-amber-400 to-orange-500' },
  { label: '格式解析度', score: 82, desc: '表格/图片内容可能无法解析', color: 'from-emerald-400 to-teal-500' },
  { label: '排版结构化', score: 75, desc: '部分章节层级不清晰', color: 'from-sky-400 to-blue-500' },
  { label: '字符兼容性', score: 90, desc: '特殊字符可能乱码', color: 'from-violet-400 to-purple-500' },
];

const WEAK_VERBS = [{ w: '负责', n: 5 }, { w: '参与', n: 3 }, { w: '协助', n: 2 }];
const STRONG_VERBS = ['主导', '搭建', '推动', '优化', '引领'];
const QUANTIFY = [
  { a: '团队规模', s: '补充管理团队人数，如"带领8人团队"' },
  { a: '预算金额', s: '增加项目预算规模，如"负责500万预算项目"' },
  { a: '时间效率', s: '量化效率提升，如"将交付周期缩短40%"' },
];
const LAYOUT = [
  { i: '个人信息过长', t: '建议精简至2-3行核心信息' },
  { i: '技能分类混乱', t: '按技术栈/软技能/工具分组展示' },
  { i: '页面留白不足', t: '增加行间距和段落间距提升可读性' },
];
const COMPARE = [
  { b: '负责项目管理，推动项目进展', a: '主导5个核心项目，推动交付效率提升30%' },
  { b: '参与团队建设和培训', a: '搭建12人跨职能团队，建立标准化培训体系' },
  { b: '协助完成产品上线', a: '引领产品从0到1上线，首月获客10万+' },
  { b: '负责日常运营工作', a: '优化运营流程，将人力成本降低25%' },
];
const RECENT = [
  { n: '产品经理_张三.pdf', d: '2024-01-15', s: 78 },
  { n: '前端开发_李四.docx', d: '2024-01-10', s: 65 },
  { n: '运营专员_王五.pdf', d: '2024-01-05', s: 82 },
];

function Progress({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <motion.div className={`h-full rounded-full bg-gradient-to-r ${color}`}
        initial={{ width: 0 }} animate={{ width: `${score}%` }}
        transition={{ duration: 1, ease: 'easeOut' }} />
    </div>
  );
}

export default function Lab() {
  const [step, setStep] = useState<Step>('upload');
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (step !== 'analyzing') return;
    const t = setTimeout(() => setStep('results'), 3000);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="min-h-full p-8">
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="up" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-8">
            <div className="relative w-full max-w-xl">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle, #00D68F 0.8px, transparent 0.8px)',
                backgroundSize: '24px 24px' }} />
              <button onClick={() => setStep('analyzing')}
                className="relative w-full py-16 border-2 border-dashed border-brand-300 rounded-3xl bg-white/70 backdrop-blur-sm flex flex-col items-center gap-4 cursor-pointer hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-lg transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-gray-800">拖拽简历到此处</p>
                  <p className="text-sm text-gray-500 mt-1">或点击选择文件上传</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span>支持 PDF、DOCX 格式，最大 10MB</span>
                </div>
              </button>
              <div className="flex justify-center mt-4">
                <button className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium">
                  <Sparkles className="w-4 h-4" /> 试试示例简历？
                </button>
              </div>
            </div>
            <div className="w-full max-w-xl">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                最近上传
              </h3>
              <div className="space-y-2">
                {RECENT.map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{f.n}</p>
                      <p className="text-xs text-gray-400">{f.d}</p>
                    </div>
                    <span className={`text-sm font-bold ${f.s >= 80 ? 'text-emerald-500' : f.s >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                      {f.s}分
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div key="an" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                <svg width="100" height="100" className="-rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="5" />
                  <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#00D68F" strokeWidth="5"
                    strokeLinecap="round" strokeDasharray={2 * Math.PI * 42}
                    animate={{ strokeDashoffset: 0 }} transition={{ duration: 2.5, ease: 'linear' }}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }} />
                </svg>
                <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-brand-500 animate-spin" />
              </div>
              <p className="text-lg font-medium text-gray-700">正在深度分析简历...</p>
              <div className="flex flex-col gap-3 w-64">
                {['OCR文字识别', '结构化信息提取', 'ATS兼容性检测', '动词强度分析', 'AI优化建议生成'].map((l, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {i < 2 ? <CheckCircle2 className="w-5 h-5 text-brand-500" /> :
                     i === 2 ? <Loader2 className="w-5 h-5 text-brand-500 animate-spin" /> :
                     <div className="w-5 h-5 rounded-full border-2 border-gray-200" />}
                    <span className={`text-sm ${i <= 2 ? (i === 2 ? 'text-brand-500 font-medium' : 'text-brand-600') : 'text-gray-400'}`}>
                      {l}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div key="res" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto space-y-6 pb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-brand-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">ATS 综合兼容性评分</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <motion.span className="text-6xl font-bold"
                      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}>70</motion.span>
                    <span className="text-2xl text-white/60">/100</span>
                  </div>
                  <p className="text-white/80 mt-3 text-sm max-w-md">
                    您的简历通过了基础 ATS 检测，但在关键词匹配和结构化方面仍有优化空间。
                  </p>
                </div>
                <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Target className="w-14 h-14" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-500" /> ATS 兼容性明细
              </h2>
              <div className="space-y-5">
                {ATS.map((it, i) => (
                  <motion.div key={it.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-800">{it.label}</span>
                        <span className="text-xs text-gray-400 ml-2">{it.desc}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-700">{it.score}</span>
                    </div>
                    <Progress score={it.score} color={it.color} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> 动词强度分析
                </h2>
                <p className="text-sm text-gray-500 mb-2">弱动词检测</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {WEAK_VERBS.map((v, i) => (
                    <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                      {v.w} <span className="text-red-400 text-xs">({v.n}次)</span>
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mb-2">推荐强动词</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {STRONG_VERBS.map((v, i) => (
                    <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium">{v}</span>
                  ))}
                </div>
                <button className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition-shadow">
                  一键替换弱动词
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-sky-500" /> 量化分析
                </h2>
                <div className="flex items-center gap-3 mb-4 p-3 bg-emerald-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-xl font-bold text-emerald-600">8</span>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700">量化指标数</p>
                    <p className="text-xs text-emerald-500">表现良好，继续增强</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">待补充维度</p>
                <div className="space-y-2">
                  {QUANTIFY.map((q, i) => (
                    <div key={i} className="p-2.5 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">{q.a}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{q.s}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-500" /> 排版冗余分析
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-violet-500">72</span>
                  <span className="text-sm text-gray-400">/100</span>
                </div>
              </div>
              <div className="space-y-3 mb-5">
                {LAYOUT.map((it, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-600">{i + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{it.i}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{it.t}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-md transition-shadow">
                一键优化排版
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500" /> 优化前后对比
              </h2>
              <div className="space-y-4">
                {COMPARE.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-2">优化前</p>
                      <p className="text-sm text-gray-400 line-through decoration-red-400 decoration-2">{c.b}</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-medium">优化后</span>
                      <p className="text-xs font-medium text-emerald-500 mb-2 opacity-0">优化后</p>
                      <p className="text-sm text-emerald-600 font-medium">{c.a}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button onClick={() => setApplied(true)}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-medium text-white shadow-lg transition-all ${
                  applied ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-emerald-500 hover:shadow-xl hover:scale-[1.02]'
                }`}>
                {applied ? '✓ 已应用所有优化' : '一键应用所有优化'}
              </button>
              <button className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <FileDown className="w-4 h-4" /> 导出优化报告
              </button>
              <button className="w-full sm:w-auto px-6 py-3 text-brand-600 font-medium hover:text-brand-700 transition-colors flex items-center justify-center gap-1">
                <Edit3 className="w-4 h-4" /> 去编辑器精修 <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
