import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, FlaskConical, Palette, BarChart3, Star, ChevronRight, User, FileText, TrendingUp, Zap, Lightbulb, Upload } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { mockCases } from '@/data/mockCases';

const navLinks = ['首页', 'AI创作', '简历实验室', '案例库', '数据看板'];
const navPaths = ['/', '/create', '/lab', '/cases', '/dashboard'];
const quickPrompts = ['我是3年前端工程师', '想转产品经理', '刚毕业求职', '优化现有简历'];
const industryFilters = ['全部', '互联网', '金融', '科技', '设计', '教育'];
const sparklineData = [{v: 62}, {v: 65}, {v: 68}, {v: 72}, {v: 75}, {v: 78}];
const stats = [
  { value: 78, suffix: '%', label: 'ATS通过率', icon: FileText, color: 'text-brand-500' },
  { value: 50000, suffix: '+', label: '用户', icon: Zap, color: 'text-gold-500' },
  { value: 35, suffix: '%', label: '优化提升', icon: TrendingUp, color: 'text-brand-500' },
  { value: 1000, suffix: '+', label: '案例模板', icon: Lightbulb, color: 'text-gold-500' },
];

const V = [
  { n: '李明轩', t: '全栈工程师', sm: '5年全栈开发经验，擅长React与Node.js，主导过多个大型项目从0到1的构建。', ex: '高级全栈工程师 · 字节跳动 2021-至今\n全栈开发 · 美团 2019-2021', pj: '电商中台重构、低代码平台搭建、微服务架构升级', ed: '北京大学 · 计算机科学与技术 硕士', sk: ['React', 'TypeScript', 'Node.js', 'Vue', 'MySQL', 'Docker'] },
  { n: '王佳怡', t: '前端工程师', sm: '3年前端开发经验，精通React/Vue双栈，字节跳动+创业公司背景。', ex: '高级前端工程师 · 字节跳动 2022-至今\n前端开发 · 星辰科技 2021-2022', pj: '抖音创作者平台核心模块、低代码可视化引擎、H5性能优化', ed: '浙江大学 · 软件工程 学士', sk: ['React', 'Vue3', 'TypeScript', 'Webpack', 'Vite', 'TailwindCSS'] },
  { n: '陈子墨', t: '产品经理', sm: '5年互联网产品经验，跨职能项目管理能力强，用户洞察与商业分析兼备。', ex: '高级产品经理 · 腾讯 2022-至今\n产品经理 · 京东 2020-2022', pj: '微信支付电商解决方案（GMV+38%）、PLUS会员体系重构、增长策略', ed: '复旦大学 · 市场营销 硕士', sk: ['产品设计', '数据分析', 'A/B测试', 'PRD撰写', '用户研究', 'SQL'] },
  { n: '林小雨', t: '应届毕业生', sm: '2026届应届，成绩优异，多段名企实习，校园活动丰富，学习能力强。', ex: '产品运营实习生 · 阿里巴巴 2025.07-10\n数据分析实习生 · 字节跳动 2025.03-06', pj: '学生会主席（10+活动）、双创大赛金奖、GPA3.8/4.0 专业前5%', ed: '上海交大 · 信息管理与信息系统 学士 2022-2026', sk: ['Excel', 'SQL', 'Python', 'PPT', '沟通协作', '项目管理'] },
  { n: '郑昊然', t: '高级数据分析师', sm: '6年数据分析经验，擅长用数据驱动决策，量化成果获顶级面试官好评。', ex: '高级数据分析师 · 蚂蚁集团 2022-至今\n数据分析师 · 携程 2020-2022', pj: '风控模型迭代（坏账-24%）、留存体系搭建（30日留存+18%）、ROI优化', ed: '中科大 · 统计学 硕士', sk: ['SQL', 'Python', 'Tableau', '机器学习', 'A/B测试', '统计学'] },
  { n: '张艺涵', t: 'UI/UX设计师', sm: '4年产品设计经验，作品集丰富，用户体验与视觉表达俱佳。', ex: '高级UI设计师 · 网易 2022-至今\nUX设计师 · 小米 2020-2022', pj: '网易云音乐社区改版（DAU+12%）、小米商城视觉升级、设计系统搭建', ed: '中央美院 · 视觉传达设计 学士', sk: ['Figma', 'Sketch', 'Principle', '用户研究', '原型设计', '设计系统'] },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const step = Math.max(1, Math.floor(value / 60));
        let v = 0;
        const id = setInterval(() => { v += step; if (v >= value) { v = value; clearInterval(id); } setCurrent(v); }, 16);
      }
    }, { threshold: 0.5 });
    obs.observe(el); return () => obs.disconnect();
  }, [value]);
  return <span ref={ref}>{value >= 1000 ? current.toLocaleString() : current}{suffix}</span>;
}

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }) };
const S = Sparkles, SR = Send, FC = FlaskConical, P = Palette, BC = BarChart3, ST = Star, CR = ChevronRight, U = User, FT = FileText, TU = TrendingUp, Z = Zap, LB = Lightbulb, UL = Upload;

export default function Home() {
  const nav = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [rv, setRv] = useState(0);
  const [acf, setAcf] = useState('全部');
  const [ver, setVer] = useState(1);
  const [vh, setVh] = useState<number[]>([0]);
  const [sb, setSb] = useState(false);
  const [hs, setHs] = useState<number | null>(null);
  const r = V[rv];
  const sc = acf === '全部' ? mockCases.slice(0, 6) : mockCases.filter(c => c.industry === acf).slice(0, 6);
  const tu = (i: number, pt?: string) => { setRv(i); if (pt) setPrompt(pt); setVer(v => v + 1); setVh(p => [...p, i]); setSb(true); setTimeout(() => setSb(false), 2200); };
  const hic = (ind: string, i: number) => { setAcf(ind); tu(Math.min(i + 1, V.length - 1)); };
  const hsnd = () => { if (prompt.trim()) { setVer(v => v + 1); setVh(p => [...p, rv]); nav('/create', { state: { initialPrompt: prompt } }); } };
  const hrv = (i: number, vi: number) => { setRv(vi); setVer(i + 1); };

  return (
    <div className="min-h-screen bg-surface-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><S className="w-6 h-6 text-brand-500" /><span className="font-display text-xl font-bold text-brand-900">ResumeForge AI</span></Link>
          <div className="flex items-center gap-8">{navLinks.map((nm, i) => (
            <Link key={nm} to={navPaths[i]} className={`font-body text-sm font-medium transition-colors relative pb-1 ${i === 0 ? 'text-brand-500' : 'text-brand-700 hover:text-brand-500'}`}>
              {nm}{i === 0 && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />}
            </Link>
          ))}</div>
          <button className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 hover:bg-brand-200 transition-colors"><U className="w-4 h-4" /></button>
        </div>
      </nav>

      <section className="min-h-screen pt-20 pb-16 px-6 bg-gradient-to-br from-brand-900 via-brand-900 to-brand-950 relative overflow-hidden">
        <AnimatePresence>{sb && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.8 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full bg-gold-500 text-brand-900 font-body text-sm font-semibold shadow-xl shadow-gold-500/40 flex items-center gap-2">
            <S className="w-4 h-4" /> ✓ 已根据求职意向更新简历
          </motion.div>
        )}</AnimatePresence>

        <div className="max-w-7xl mx-auto h-[calc(100vh-10rem)] flex gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex-1 flex flex-col justify-center">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">你好，我是你的<br /><span className="text-brand-400">简历AI搭档</span></h1>
            <p className="font-body text-brand-200/70 text-lg mb-8 max-w-md">用自然语言描述你的职业经历，我会帮你生成专业简历</p>
            <div className="flex flex-wrap gap-3 mb-8">{quickPrompts.map((t, i) => (
              <motion.button key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} onClick={() => tu(i + 1, t)}
                className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 font-body text-sm hover:bg-brand-500/30 hover:border-brand-400/50 transition-all">{t}</motion.button>
            ))}</div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), hsnd())}
                placeholder="告诉我你的职业背景、项目经历、求职意向..."
                className="w-full h-32 p-5 pr-16 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-body resize-none focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-transparent backdrop-blur-sm" rows={4} />
              <button onClick={hsnd} className="absolute right-4 bottom-4 w-12 h-12 rounded-xl bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center transition-all hover:shadow-lg hover:shadow-brand-500/30"><SR className="w-5 h-5" /></button>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex-1 flex flex-col items-center justify-center relative gap-4">
            <div className="relative w-full max-w-sm">
              <motion.div key={ver} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-3 -right-3 z-10 px-4 py-2 rounded-full bg-gold-500 text-brand-900 font-body text-sm font-semibold shadow-lg shadow-gold-500/30 flex items-center gap-2">
                <S className="w-4 h-4" /> 生成版本 v{ver}
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div key={rv} initial={{ opacity: 0, rotateY: -15, scale: 0.95 }} animate={{ opacity: 1, rotateY: 0, scale: 1 }} exit={{ opacity: 0, rotateY: 15, scale: 0.95 }} transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="aspect-[210/297] bg-white rounded-xl shadow-2xl shadow-black/30 p-6 resume-preview">
                  {[{ t: r.n, s: r.t, b: true }, { t: '个人总结', s: r.sm }, { t: '工作经历', s: r.ex, m: true }, { t: '项目经历', s: r.pj }, { t: '教育背景', s: r.ed }, { t: '技能', tags: r.sk, it: true }].map((sec, i) => (
                    <div key={i} className={`border-l-2 border-brand-500 pl-3 ${i < 5 ? 'mb-3' : ''} ${i === 0 ? 'mb-4' : ''}`}>
                      <h3 className={`font-bold text-brand-900 ${sec.b ? 'font-display text-xl' : 'font-display text-sm'} ${i === 0 ? '' : 'mb-1'}`}>{sec.t}</h3>
                      {sec.b && <p className="text-brand-600 text-sm font-medium">{sec.s}</p>}
                      {sec.m && sec.s?.split('\n').map((ln, j) => <p key={j} className={`text-xs ${j === 0 ? 'font-semibold text-brand-800' : 'text-brand-600/70'}`}>{ln}</p>)}
                      {!sec.b && !sec.m && !sec.it && <p className="text-xs text-brand-700/80 leading-relaxed">{sec.s}</p>}
                      {sec.it && <div className="flex flex-wrap gap-1">{sec.tags?.map((tg: string) => <span key={tg} className="px-2 py-0.5 text-[10px] rounded bg-brand-100 text-brand-700">{tg}</span>)}</div>}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-white/50 text-xs font-body mr-1">历史版本:</span>
              {vh.map((vi, i) => (
                <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => hrv(i, vi)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${i + 1 === ver ? 'bg-brand-400 text-brand-900 font-bold shadow-md shadow-brand-400/30' : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'}`}>v{i + 1}</motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface-50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl font-bold text-brand-900 mb-3">核心能力</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="font-body text-surface-300">三位一体，重新定义简历创作流程</motion.p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[{ icon: FC, title: '简历实验室', to: '/lab', bg: 'bg-brand-500/10', tc: 'text-brand-500' },
              { icon: P, title: '模板引擎', to: '/editor/resume-1', bg: 'bg-gold-500/10', tc: 'text-gold-500' },
              { icon: BC, title: '数据洞察', to: '/dashboard', bg: 'bg-brand-500/10', tc: 'text-brand-500' },
            ].map((f, i) => (
              <motion.div key={f.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Link to={f.to} className="glass-card card-hover block p-6 h-full">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}><f.icon className={`w-6 h-6 ${f.tc}`} /></div>
                  <h3 className="font-display text-lg font-bold text-brand-900 mb-3">{f.title}</h3>
                  {i === 0 && (<><div className="border-2 border-dashed border-surface-200 rounded-lg p-4 mb-3 bg-surface-50"><UL className="w-6 h-6 text-surface-300 mx-auto mb-1" /><p className="text-xs text-surface-300 text-center">上传PDF分析</p></div><div className="h-16 bg-surface-100 rounded-lg flex items-center justify-center"><div className="text-center"><div className="font-display text-2xl font-bold text-brand-500">78%</div><div className="text-xs text-surface-300">ATS评分</div></div></div></>)}
                  {i === 1 && (<div className="flex gap-2">{['bg-brand-900', 'bg-brand-500', 'bg-gold-500'].map((c, j) => (<div key={j} className={`flex-1 aspect-[3/4] ${c} rounded-md shadow-sm`}><div className="h-1 bg-white/30 m-1.5 rounded" /><div className="h-0.5 bg-white/20 mx-1.5 mb-1 rounded" /><div className="h-0.5 bg-white/20 mx-1.5 w-2/3 rounded" /></div>))}</div>)}
                  {i === 2 && (<div className="h-24 bg-surface-50 rounded-lg p-2"><ResponsiveContainer width="100%" height="100%"><LineChart data={sparklineData}><Line type="monotone" dataKey="v" stroke="#00D68F" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>)}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div><h2 className="font-display text-4xl font-bold text-brand-900 mb-2">精选案例</h2><p className="font-body text-surface-300">真实用户，真实成果 · 当前显示 <span className="text-brand-500 font-bold">{sc.length}</span> 条</p></div>
            <Link to="/cases" className="flex items-center gap-1 text-brand-500 font-body text-sm font-medium hover:text-brand-600">查看全部案例 <CR className="w-4 h-4" /></Link>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">{industryFilters.map((ind) => (
            <button key={ind} onClick={() => hic(ind, industryFilters.indexOf(ind) - 1)}
              className={`px-4 py-2 rounded-full font-body text-sm transition-all relative ${acf === ind ? 'bg-brand-500 text-white shadow-md' : 'bg-surface-100 text-surface-300 hover:bg-surface-200'}`}>
              {ind}{acf === ind && <motion.span layoutId="cfu" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full" />}
            </button>
          ))}</div>
          <div className="grid md:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">{sc.map((c, i) => (
              <motion.div key={c.id} layout custom={i} variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }} whileInView="visible" viewport={{ once: true }} className="group">
                <Link to={`/cases/${c.id}`} className="block card-hover">
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 mb-3 flex items-center justify-center relative overflow-hidden">
                    <span className="font-display text-2xl font-bold text-white/90 z-10">{c.title.slice(0, 8)}</span><div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                  <h3 className="font-display font-bold text-brand-900 mb-1 group-hover:text-brand-500 transition-colors">{c.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-600">{c.industry}</span>
                    <div className="flex items-center gap-1"><ST className="w-3 h-3 text-gold-500 fill-gold-500" /><span className="text-xs font-mono text-gold-600">{c.rating}</span></div>
                    <span className="text-xs text-surface-300">{c.hrReviews.length}条HR点评</span>
                  </div>
                </Link>
              </motion.div>
            ))}</AnimatePresence>
            {sc.length === 0 && <div className="col-span-3 py-16 text-center text-surface-300 font-body">该行业暂无案例，敬请期待</div>}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl font-bold text-brand-900 mb-3">数据说话</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="font-body text-surface-300">用效果证明实力</motion.p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{stats.map((s, i) => (
            <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative text-center p-6 rounded-2xl bg-white shadow-sm cursor-pointer group" onMouseEnter={() => setHs(i)} onMouseLeave={() => setHs(null)}>
              <Link to="/dashboard" className="block">
                <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-3`} />
                <div className={`font-display text-4xl font-bold ${s.color} mb-2`}><AnimatedNumber value={s.value} suffix={s.suffix} /></div>
                <p className="font-body text-sm text-surface-300">{s.label}</p>
                {i === 0 && (<div className="h-10 mt-3"><ResponsiveContainer width="100%" height="100%"><LineChart data={sparklineData}><Line type="monotone" dataKey="v" stroke="#00D68F" strokeWidth={1.5} dot={false} /></LineChart></ResponsiveContainer></div>)}
                <AnimatePresence>{hs === i && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs font-body whitespace-nowrap shadow-lg z-10">
                    查看详情 <CR className="inline w-3 h-3" /><div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-900 rotate-45" />
                  </motion.div>
                )}</AnimatePresence>
              </Link>
            </motion.div>
          ))}</div>
        </div>
      </section>

      <section className="py-24 px-6 bg-brand-900">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">准备好打造你的<span className="text-brand-400">理想简历</span>了吗？</h2>
            <p className="font-body text-brand-200/60 text-lg mb-10">立即开始，让 AI 成为你的简历搭档</p>
            <Link to="/create" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"><S className="w-5 h-5" /> 立即开始</Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
