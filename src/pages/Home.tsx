import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Send, FlaskConical, Palette, BarChart3, Star, ChevronRight,
  User, FileText, TrendingUp, Zap, Lightbulb, Upload
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { mockCases } from '@/data/mockCases';

const navLinks = ['首页', 'AI创作', '简历实验室', '案例库', '数据看板'];
const navPaths = ['/', '/create', '/lab', '/cases', '/dashboard'];
const quickPrompts = ['我是3年前端工程师', '想转产品经理', '刚毕业求职', '优化现有简历'];
const industryFilters = ['互联网', '金融', '科技', '设计', '教育'];
const sparklineData = [{v: 62}, {v: 65}, {v: 68}, {v: 72}, {v: 75}, {v: 78}];
const stats = [
  { value: 78, suffix: '%', label: 'ATS通过率', icon: FileText, color: 'text-brand-500' },
  { value: 50000, suffix: '+', label: '用户', icon: Zap, color: 'text-gold-500' },
  { value: 35, suffix: '%', label: '优化提升', icon: TrendingUp, color: 'text-brand-500' },
  { value: 1000, suffix: '+', label: '案例模板', icon: Lightbulb, color: 'text-gold-500' },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const step = Math.max(1, Math.floor(value / 60));
        let v = 0;
        const id = setInterval(() => { v += step; if (v >= value) { v = value; clearInterval(id); } setCurrent(v); }, 16);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  const formatted = value >= 1000 ? current.toLocaleString() : current;
  return <span ref={ref}>{formatted}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

export default function Home() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [activeIndustry, setActiveIndustry] = useState('互联网');
  const showcaseCases = mockCases.filter(c => c.industry === activeIndustry).slice(0, 6);

  const handleSend = () => { if (prompt.trim()) navigate('/create', { state: { initialPrompt: prompt } }); };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-500" />
            <span className="font-display text-xl font-bold text-brand-900">ResumeForge AI</span>
          </Link>
          <div className="flex items-center gap-8">
            {navLinks.map((name, i) => (
              <Link key={name} to={navPaths[i]} className={`font-body text-sm font-medium transition-colors relative pb-1 ${i === 0 ? 'text-brand-500' : 'text-brand-700 hover:text-brand-500'}`}>
                {name}
                {i === 0 && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />}
              </Link>
            ))}
          </div>
          <button className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 hover:bg-brand-200 transition-colors">
            <User className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Workspace */}
      <section className="min-h-screen pt-20 pb-16 px-6 bg-gradient-to-br from-brand-900 via-brand-900 to-brand-950">
        <div className="max-w-7xl mx-auto h-[calc(100vh-10rem)] flex gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex-1 flex flex-col justify-center">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
              你好，我是你的<br/><span className="text-brand-400">简历AI搭档</span>
            </h1>
            <p className="font-body text-brand-200/70 text-lg mb-8 max-w-md">用自然语言描述你的职业经历，我会帮你生成专业简历</p>
            <div className="flex flex-wrap gap-3 mb-8">
              {quickPrompts.map((text, i) => (
                <motion.button key={text} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                  onClick={() => setPrompt(text)}
                  className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 font-body text-sm hover:bg-brand-500/30 hover:border-brand-400/50 transition-all">
                  {text}
                </motion.button>
              ))}
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="告诉我你的职业背景、项目经历、求职意向..."
                className="w-full h-32 p-5 pr-16 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-body resize-none focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-transparent backdrop-blur-sm" rows={4} />
              <button onClick={handleSend} className="absolute right-4 bottom-4 w-12 h-12 rounded-xl bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center transition-all hover:shadow-lg hover:shadow-brand-500/30">
                <Send className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex-1 flex items-center justify-center relative">
            <div className="relative w-full max-w-sm">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-3 -right-3 z-10 px-4 py-2 rounded-full bg-gold-500 text-brand-900 font-body text-sm font-semibold shadow-lg shadow-gold-500/30 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI生成中...
              </motion.div>
              <div className="aspect-[210/297] bg-white rounded-xl shadow-2xl shadow-black/30 p-6 resume-preview">
                {[{ t: '李明轩', s: '全栈工程师', big: true },
                  { t: '个人总结', s: '5年全栈开发经验，擅长React与Node.js...' },
                  { t: '工作经历', s: '高级前端工程师 · 字节跳动 2021-至今\n前端开发 · 美团 2019-2021', multi: true },
                  { t: '项目经历', s: '电商中台重构、低代码平台搭建...' },
                  { t: '教育背景', s: '北京大学 · 计算机科学与技术' },
                  { t: '技能', tags: ['React', 'TypeScript', 'Node.js', 'Vue'], isTags: true },
                ].map((sec, i) => (
                  <div key={i} className={`border-l-2 border-brand-500 pl-3 ${i < 5 ? 'mb-3' : ''} ${i === 0 ? 'mb-4' : ''}`}>
                    <h3 className={`font-bold text-brand-900 ${sec.big ? 'font-display text-xl' : 'font-display text-sm'} ${i === 0 ? '' : 'mb-1'}`}>{sec.t}</h3>
                    {sec.big && <p className="text-brand-600 text-sm font-medium">{sec.s}</p>}
                    {sec.multi && sec.s?.split('\n').map((line, j) => (
                      <p key={j} className={`text-xs ${j === 0 ? 'font-semibold text-brand-800' : 'text-brand-600/70'}`}>{line}</p>
                    ))}
                    {!sec.big && !sec.multi && !sec.isTags && <p className="text-xs text-brand-700/80 leading-relaxed">{sec.s}</p>}
                    {sec.isTags && (
                      <div className="flex flex-wrap gap-1">
                        {sec.tags?.map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-[10px] rounded bg-brand-100 text-brand-700">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-surface-50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl font-bold text-brand-900 mb-3">核心能力</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="font-body text-surface-300">三位一体，重新定义简历创作流程</motion.p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FlaskConical, title: '简历实验室', to: '/lab', bgClass: 'bg-brand-500/10', textClass: 'text-brand-500' },
              { icon: Palette, title: '模板引擎', to: '/editor/resume-1', bgClass: 'bg-gold-500/10', textClass: 'text-gold-500' },
              { icon: BarChart3, title: '数据洞察', to: '/dashboard', bgClass: 'bg-brand-500/10', textClass: 'text-brand-500' },
            ].map((f, i) => (
              <motion.div key={f.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Link to={f.to} className="glass-card card-hover block p-6 h-full">
                  <div className={`w-12 h-12 rounded-xl ${f.bgClass} flex items-center justify-center mb-4`}>
                    <f.icon className={`w-6 h-6 ${f.textClass}`} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-brand-900 mb-3">{f.title}</h3>
                  {i === 0 && (
                    <>
                      <div className="border-2 border-dashed border-surface-200 rounded-lg p-4 mb-3 bg-surface-50">
                        <Upload className="w-6 h-6 text-surface-300 mx-auto mb-1" />
                        <p className="text-xs text-surface-300 text-center">上传PDF分析</p>
                      </div>
                      <div className="h-16 bg-surface-100 rounded-lg flex items-center justify-center">
                        <div className="text-center"><div className="font-display text-2xl font-bold text-brand-500">78%</div><div className="text-xs text-surface-300">ATS评分</div></div>
                      </div>
                    </>
                  )}
                  {i === 1 && (
                    <div className="flex gap-2">
                      {['bg-brand-900', 'bg-brand-500', 'bg-gold-500'].map((c, j) => (
                        <div key={j} className={`flex-1 aspect-[3/4] ${c} rounded-md shadow-sm`}>
                          <div className="h-1 bg-white/30 m-1.5 rounded" />
                          <div className="h-0.5 bg-white/20 mx-1.5 mb-1 rounded" />
                          <div className="h-0.5 bg-white/20 mx-1.5 w-2/3 rounded" />
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 2 && (
                    <div className="h-24 bg-surface-50 rounded-lg p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}><Line type="monotone" dataKey="v" stroke="#00D68F" strokeWidth={2} dot={false} /></LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cases */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-4xl font-bold text-brand-900 mb-2">精选案例</h2>
              <p className="font-body text-surface-300">真实用户，真实成果</p>
            </div>
            <Link to="/cases" className="flex items-center gap-1 text-brand-500 font-body text-sm font-medium hover:text-brand-600">
              查看全部案例 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-2 mb-8">
            {industryFilters.map((ind) => (
              <button key={ind} onClick={() => setActiveIndustry(ind)}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                  activeIndustry === ind ? 'bg-brand-500 text-white shadow-md' : 'bg-surface-100 text-surface-300 hover:bg-surface-200'
                }`}>
                {ind}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {showcaseCases.slice(0, 6).map((c, i) => (
              <motion.div key={c.id} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="group">
                <Link to={`/cases/${c.id}`} className="block card-hover">
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 mb-3 flex items-center justify-center relative overflow-hidden">
                    <span className="font-display text-2xl font-bold text-white/90 z-10">{c.title.slice(0, 8)}</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                  <h3 className="font-display font-bold text-brand-900 mb-1 group-hover:text-brand-500 transition-colors">{c.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-600">{c.industry}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                      <span className="text-xs font-mono text-gold-600">{c.rating}</span>
                    </div>
                    <span className="text-xs text-surface-300">{c.hrReviews.length}条HR点评</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl font-bold text-brand-900 mb-3">数据说话</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="font-body text-surface-300">用效果证明实力</motion.p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center p-6 rounded-2xl bg-white shadow-sm">
                <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-3`} />
                <div className={`font-display text-4xl font-bold ${s.color} mb-2`}>
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                </div>
                <p className="font-body text-sm text-surface-300">{s.label}</p>
                {i === 0 && (
                  <div className="h-10 mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineData}><Line type="monotone" dataKey="v" stroke="#00D68F" strokeWidth={1.5} dot={false} /></LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-brand-900">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              准备好打造你的<span className="text-brand-400">理想简历</span>了吗？
            </h2>
            <p className="font-body text-brand-200/60 text-lg mb-10">立即开始，让 AI 成为你的简历搭档</p>
            <Link to="/create" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
              <Sparkles className="w-5 h-5" /> 立即开始
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
