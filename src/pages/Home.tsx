import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, FlaskConical, Palette, BarChart3, Star, ChevronRight, User, FileText, TrendingUp, Zap, Lightbulb, Upload, Eye, EyeOff, GitCompare, RotateCcw, MessageCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { mockCases } from '@/data/mockCases';

const navLinks = ['首页', 'AI创作', '简历实验室', '发现分类', '后台管理'];
const navPaths = ['/', '/create', '/lab', '/cases', '/admin'];
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

const FOLLOW_UPS: Record<string, { q: string; a: string }[]> = {
  '我是3年前端工程师': [
    { q: '主导过什么核心项目？有量化成果吗？', a: '主导过抖音创作者平台核心模块重构，日活提升15%，页面加载速度优化40%' },
    { q: '技术栈是 React/Vue/Angular 还是其他？', a: '主要使用 React + TypeScript，也有 Vue3 项目经验，熟悉 Vite/Webpack 构建工具' },
    { q: '目标岗位是纯技术还是带管理方向？', a: '目标是高级前端工程师，短期专注技术深耕，未来有机会也想尝试 Tech Lead 方向' },
  ],
  '刚毕业求职': [
    { q: '你有几段实习经历？能简单说一下实习内容吗？', a: '有2段实习：阿里产品运营实习3个月，字节数据分析实习3个月，参与过用户增长项目' },
    { q: '专业成绩和校园活动要突出吗？', a: 'GPA 3.8/4.0 专业前5%，担任学生会主席组织过10+场校园活动，获双创大赛金奖' },
    { q: '最想去什么行业求职？', a: '优先考虑互联网行业，对产品经理和数据分析岗位比较感兴趣' },
  ],
  '想转产品经理': [
    { q: '之前是什么岗位？有多少年经验？', a: '之前是3年前端开发，对产品设计和用户体验有浓厚兴趣' },
    { q: '有没有产品相关的项目或作品？', a: '独立设计过2款小程序原型，负责过团队内部的需求分析和PRD撰写' },
    { q: '转产品的核心优势是什么？', a: '技术背景强，能与开发高效沟通；用户思维敏锐，善于从数据中发现问题' },
  ],
  '优化现有简历': [
    { q: '主要投递什么岗位？目标行业是？', a: '主要投递互联网大厂的高级前端岗位，也考虑新能源和AI公司' },
    { q: '现在简历最大的问题是什么？', a: '感觉工作经历描述太笼统，缺少量化成果，关键词不够突出' },
    { q: '有什么特别想突出的亮点吗？', a: '想突出从0到1搭建低代码平台的经验，以及团队技术分享的贡献' },
  ],
};

const STAR_DATA = {
  original: '负责电商平台前端开发',
  star: [
    { label: 'S 背景', content: '公司电商平台面临流量高峰时页面卡顿，用户转化率持续下降' },
    { label: 'T 任务', content: '作为核心开发，负责重构商品详情页和购物车模块，提升性能30%以上' },
    { label: 'A 行动', content: '采用 React 18 并发特性，实施虚拟滚动、图片懒加载，搭建组件级缓存策略' },
    { label: 'R 结果', content: '首屏加载从 3.2s 降至 1.1s，转化率提升 22%，获季度技术突破奖' },
  ],
};

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

export default function Home() {
  const nav = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [rv, setRv] = useState(0);
  const [acf, setAcf] = useState('互联网');
  const [ver, setVer] = useState(1);
  const [vh, setVh] = useState<number[]>([0]);
  const [sb, setSb] = useState(false);
  const [hs, setHs] = useState<number | null>(null);
  const [followUps, setFollowUps] = useState<{ q: string; a: string }[]>([]);
  const [activeChip, setActiveChip] = useState<string>('');
  const [showSTAR, setShowSTAR] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedV, setSelectedV] = useState<number[]>([]);
  const [atsMode, setAtsMode] = useState(false);
  const [genSource, setGenSource] = useState('✓ 生成依据：默认示例模板');

  const r = V[rv];
  const sc = acf === '全部' ? mockCases.slice(0, 6) : mockCases.filter(c => c.industry === acf).slice(0, 6);
  const totalIndustryCases = mockCases.filter(c => c.industry === acf).length;
  const sections = [{ t: r.n, s: r.t, b: true }, { t: '个人总结', s: r.sm }, { t: '工作经历', s: r.ex, m: true }, { t: '项目经历', s: r.pj }, { t: '教育背景', s: r.ed }, { t: '技能', tags: r.sk, it: true }];

  const tu = (i: number, pt?: string) => {
    setRv(i);
    if (pt) {
      setPrompt(pt); setActiveChip(pt); setFollowUps([]);
      setGenSource(`✓ 生成依据：求职意向 = ${pt}`);
      setTimeout(() => setFollowUps(FOLLOW_UPS[pt] || []), 400);
    }
    setVer(v => v + 1); setVh(p => [...p, i]);
    setSb(true); setTimeout(() => setSb(false), 2200); setSelectedV([]);
  };

  const handleFollowUp = (q: string, a: string) => {
    setPrompt(prompt ? `${prompt}\n${a}` : a);
    setGenSource(`✓ 生成依据：对话关键词 = ${activeChip} + ${q.slice(0, 8)}`);
    setVer(v => v + 1);
    const nextRv = (rv + 1) % V.length;
    setRv(nextRv); setVh(p => [...p, nextRv]); setFollowUps([]);
    setSb(true); setTimeout(() => setSb(false), 2200);
  };

  const hsnd = () => { if (prompt.trim()) { setVer(v => v + 1); setVh(p => [...p, rv]); setGenSource('✓ 生成依据：用户自定义输入'); nav('/create', { state: { initialPrompt: prompt } }); } };
  const hrv = (i: number, vi: number) => {
    if (compareMode) setSelectedV(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 2 ? [...prev, i] : [prev[1], i]);
    else { setRv(vi); setVer(i + 1); }
  };
  const rollback = (idx: number) => { setRv(vh[idx]); setVer(idx + 1); setVh(vh.slice(0, idx + 1)); setSelectedV([]); };

  const getSecCls = (i: number) => {
    const base = atsMode ? 'border-b border-dashed border-gray-400 pb-2 ' : 'border-l-2 border-brand-500 pl-3 ';
    const mb = i === 0 ? 'mb-4 ' : i < 5 ? 'mb-3 ' : '';
    const lastFix = i === 5 && atsMode ? 'border-b-0 ' : '';
    return base + mb + lastFix;
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><Sparkles className="w-6 h-6 text-brand-500" /><span className="font-display text-xl font-bold text-brand-900">ResumeForge AI</span></Link>
          <div className="flex items-center gap-8">{navLinks.map((nm, i) => (
            <Link key={nm} to={navPaths[i]} className={`font-body text-sm font-medium transition-colors relative pb-1 ${i === 0 ? 'text-brand-500' : 'text-brand-700 hover:text-brand-500'}`}>
              {nm}{i === 0 && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />}
            </Link>
          ))}</div>
          <button className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 hover:bg-brand-200 transition-colors"><User className="w-4 h-4" /></button>
        </div>
      </nav>

      <section className="min-h-screen pt-20 pb-16 px-6 bg-gradient-to-br from-brand-900 via-brand-900 to-brand-950 relative overflow-hidden">
        <AnimatePresence>{sb && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.8 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full bg-gold-500 text-brand-900 font-body text-sm font-semibold shadow-xl shadow-gold-500/40 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> ✓ 已根据求职意向更新简历
          </motion.div>
        )}</AnimatePresence>

        <div className="max-w-7xl mx-auto h-auto flex flex-col lg:flex-row gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex-1 flex flex-col justify-center pt-8">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">你好，我是你的<br /><span className="text-brand-400">简历AI搭档</span></h1>
            <p className="font-body text-brand-200/70 text-lg mb-8 max-w-md">用自然语言描述你的职业经历，我会帮你生成专业简历</p>
            <div className="flex flex-wrap gap-3 mb-6">{quickPrompts.map((t, i) => (
              <motion.button key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} onClick={() => tu(i + 1, t)}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all ${activeChip === t ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-white/10 border border-white/20 text-white/90 hover:bg-brand-500/30 hover:border-brand-400/50'}`}>{t}</motion.button>
            ))}</div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), hsnd())}
                placeholder="告诉我你的职业背景、项目经历、求职意向..."
                className="w-full h-32 p-5 pr-16 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-body resize-none focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-transparent backdrop-blur-sm" rows={4} />
              <button onClick={hsnd} className="absolute right-4 bottom-4 w-12 h-12 rounded-xl bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center transition-all hover:shadow-lg hover:shadow-brand-500/30"><Send className="w-5 h-5" /></button>
            </motion.div>

            <AnimatePresence>
              {followUps.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-5 space-y-2">
                  <div className="flex items-center gap-2 text-brand-300/70 text-xs font-body mb-2"><MessageCircle className="w-3.5 h-3.5" /> AI 想进一步了解你：</div>
                  {followUps.map((item, i) => (
                    <motion.button key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.25, type: 'spring', stiffness: 200 }}
                      onClick={() => handleFollowUp(item.q, item.a)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/8 border border-brand-400/20 text-brand-100/90 font-body text-sm hover:bg-brand-500/20 hover:border-brand-400/40 transition-all flex items-start gap-2 group">
                      <span className="text-brand-400 mt-0.5">Q{i + 1}.</span>
                      <span className="flex-1">{item.q}</span>
                      <ChevronRight className="w-4 h-4 text-brand-400/50 group-hover:text-brand-300 group-hover:translate-x-0.5 transition-all mt-0.5 shrink-0" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex-1 flex flex-col items-center justify-center relative gap-4 pt-8">
            <div className="relative w-full max-w-sm">
              <motion.div key={ver} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-3 -right-3 z-10 px-4 py-2 rounded-full bg-gold-500 text-brand-900 font-body text-sm font-semibold shadow-lg shadow-gold-500/30 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 生成版本 v{ver}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-12 left-0 z-10 px-3 py-1.5 rounded-lg bg-brand-500/20 border border-brand-400/30 text-brand-200 font-body text-xs flex items-center gap-1.5 backdrop-blur-sm max-w-[280px] truncate">
                <Sparkles className="w-3 h-3 shrink-0" /> <span className="truncate">{genSource}</span>
              </motion.div>

              <div className="absolute top-16 -right-2 z-10 flex items-center gap-2">
                <button onClick={() => setAtsMode(!atsMode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all ${atsMode ? 'bg-gray-800 text-gray-100 border border-gray-600' : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'}`}>
                  {atsMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} ATS友好模式
                </button>
                <button onClick={() => setShowSTAR(!showSTAR)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all ${showSTAR ? 'bg-gold-500 text-brand-900' : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'}`}>
                  <Star className="w-3 h-3" /> {showSTAR ? '隐藏STAR' : '查看STAR改写依据'}
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={rv + (atsMode ? 'ats' : 'normal')} initial={{ opacity: 0, rotateY: -15, scale: 0.95 }} animate={{ opacity: 1, rotateY: 0, scale: 1 }} exit={{ opacity: 0, rotateY: 15, scale: 0.95 }} transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`aspect-[210/297] rounded-xl shadow-2xl p-6 resume-preview mt-16 ${atsMode ? 'bg-white border-2 border-gray-300 font-mono' : 'bg-white shadow-black/30'}`}>
                  {sections.map((sec, i) => (
                    <div key={i} className={getSecCls(i)}>
                      <h3 className={`font-bold ${atsMode ? 'text-gray-900' : 'text-brand-900'} ${sec.b ? 'font-display text-xl' : 'font-display text-sm'} ${i === 0 ? '' : 'mb-1'}`}>{sec.t}</h3>
                      {sec.b && <p className={`text-sm font-medium ${atsMode ? 'text-gray-700' : 'text-brand-600'}`}>{sec.s}</p>}
                      {sec.m && sec.s?.split('\n').map((ln, j) => <p key={j} className={`text-xs ${j === 0 ? `font-semibold ${atsMode ? 'text-gray-800' : 'text-brand-800'}` : atsMode ? 'text-gray-600' : 'text-brand-600/70'}`}>{ln}</p>)}
                      {!sec.b && !sec.m && !sec.it && <p className={`text-xs leading-relaxed ${atsMode ? 'text-gray-700' : 'text-brand-700/80'}`}>{sec.s}</p>}
                      {sec.it && <div className="flex flex-wrap gap-1">{sec.tags?.map((tg: string) => <span key={tg} className={`px-2 py-0.5 text-[10px] rounded ${atsMode ? 'bg-gray-200 text-gray-800 border border-gray-400' : 'bg-brand-100 text-brand-700'}`}>{tg}</span>)}</div>}
                    </div>
                  ))}
                  {atsMode && <div className="mt-3 pt-2 border-t border-dashed border-gray-400 text-[10px] text-gray-500 font-mono">✓ ATS兼容布局已启用，预计通过率 +12%</div>}
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showSTAR && (
                <motion.div initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: 10, height: 0 }} className="w-full max-w-sm overflow-hidden">
                  <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-xl">
                    <div className="text-xs font-bold text-brand-800 mb-2 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" /> STAR 改写依据</div>
                    <div className="mb-3 p-2 bg-gray-100 rounded text-xs text-gray-600 line-through">原文：{STAR_DATA.original}</div>
                    <div className="space-y-2">
                      {STAR_DATA.star.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded shrink-0 h-fit">{item.label}</span>
                          <span className="text-xs text-gray-700"><span className="text-emerald-600 font-medium">{item.content.slice(0, 4)}</span>{item.content.slice(4)}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { setVer(v => v + 1); setVh(p => [...p, rv]); setSb(true); setTimeout(() => setSb(false), 2200); }} className="mt-3 w-full py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" /> 基于该STAR生成下一个版本
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-xs font-body">历史版本:</span>
                <button onClick={() => { setCompareMode(!compareMode); setSelectedV([]); }} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${compareMode ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                  <GitCompare className="w-3 h-3" /> {compareMode ? '退出对比' : '对比模式'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {vh.map((vi, i) => (
                  <div key={i} className="relative group">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => hrv(i, vi)}
                      className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${selectedV.includes(i) ? 'bg-gold-500 text-brand-900 font-bold ring-2 ring-gold-300' : i + 1 === ver ? 'bg-brand-400 text-brand-900 font-bold shadow-md shadow-brand-400/30' : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'}`}>v{i + 1}</motion.button>
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <button onClick={(e) => { e.stopPropagation(); rollback(i); }} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded flex items-center gap-0.5 whitespace-nowrap shadow-lg"><RotateCcw className="w-2.5 h-2.5" /> 回滚到此版本</button>
                    </div>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {compareMode && selectedV.length === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-4 bg-white/95 backdrop-blur rounded-xl p-3 shadow-xl">
                    <div className="text-xs font-bold text-brand-800 mb-2 flex items-center gap-1"><GitCompare className="w-3.5 h-3.5" /> v{selectedV[0] + 1} vs v{selectedV[1] + 1} 版本对比</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-red-50 rounded border border-red-200">
                        <div className="text-red-600 font-bold mb-1">v{selectedV[0] + 1}（旧）</div>
                        <div className="text-red-500/80 leading-relaxed">负责<s className="bg-red-100">电商平台</s>前端开发，<s className="bg-red-100">参与</s>多个项目</div>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                        <div className="text-emerald-600 font-bold mb-1">v{selectedV[1] + 1}（新）</div>
                        <div className="text-emerald-700/80 leading-relaxed"><span className="bg-emerald-100 font-medium">主导</span>商品详情页重构，<span className="bg-emerald-100 font-medium">转化率+22%</span></div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">新增 12 处修改 · 优化 8 个关键词 · 提升ATS评分 6%</span>
                      <button onClick={() => rollback(selectedV[0])} className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center gap-0.5"><RotateCcw className="w-2.5 h-2.5" /> 回滚到旧版</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-brand-100 text-brand-600 text-xs font-bold rounded-full">案例库</span>
                <h2 className="font-display text-4xl font-bold text-brand-900">精选案例库预览</h2>
              </div>
              <p className="font-body text-surface-300">按行业筛选：当前显示<span className="text-brand-500 font-bold mx-1">{acf === '全部' ? mockCases.length : totalIndustryCases}</span>份{acf !== '全部' ? acf : ''}行业案例 / 共 <span className="text-brand-500 font-bold">{mockCases.length}</span> 份</p>
            </div>
            <Link to="/cases" className="flex items-center gap-1 px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-600 font-body text-sm font-medium rounded-full transition-colors">查看全部 <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">{industryFilters.map((ind) => (
            <button key={ind} onClick={() => setAcf(ind)}
              className={`px-4 py-2 rounded-full font-body text-sm transition-all relative ${acf === ind ? 'bg-brand-500 text-white shadow-md' : 'bg-surface-100 text-surface-300 hover:bg-surface-200'}`}>
              {ind}{acf === ind && <motion.span layoutId="cfu" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full" />}
            </button>
          ))}</div>
          <div className="grid md:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">{sc.map((c, i) => (
              <motion.div key={c.id} layout custom={i} variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }} whileInView="visible" viewport={{ once: true }} className="group">
                <Link to={`/cases/${c.id}`} className="block card-hover">
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 mb-3 flex items-center justify-center relative overflow-hidden">
                    <span className="font-display text-2xl font-bold text-white/90 z-10">{c.title.slice(0, 8)}</span>
                    <div className="absolute top-2 right-2 px-2 py-1 bg-gold-500/90 text-brand-900 text-[10px] font-bold rounded-full z-10 flex items-center gap-0.5">
                      <MessageCircle className="w-2.5 h-2.5" /> HR点评锚点: {c.hrReviews.length}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                  <h3 className="font-display font-bold text-brand-900 mb-1 group-hover:text-brand-500 transition-colors">{c.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-600">{c.industry}</span>
                    <div className="flex items-center gap-1"><Star className="w-3 h-3 text-gold-500 fill-gold-500" /><span className="text-xs font-mono text-gold-600">{c.rating}</span></div>
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
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex items-end justify-between mb-14">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-gold-100 text-gold-600 text-xs font-bold rounded-full">数据中心</span>
                <h2 className="font-display text-4xl font-bold text-brand-900">平台数据概览</h2>
              </div>
              <motion.p variants={fadeUp} custom={1} className="font-body text-surface-300">用效果证明实力，数据不会说谎</motion.p>
            </div>
            <Link to="/dashboard" className="flex items-center gap-1 px-4 py-2 bg-gold-50 hover:bg-gold-100 text-gold-600 font-body text-sm font-medium rounded-full transition-colors">查看完整报表 <ChevronRight className="w-4 h-4" /></Link>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{stats.map((s, i) => (
            <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative text-center p-6 rounded-2xl bg-white shadow-sm cursor-pointer group" onMouseEnter={() => setHs(i)} onMouseLeave={() => setHs(null)}>
              <Link to="/dashboard" className="block">
                <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-3`} />
                <div className={`font-display text-4xl font-bold ${s.color} mb-2`}><AnimatedNumber value={s.value} suffix={s.suffix} /></div>
                <p className="font-body text-sm text-surface-300">{s.label}</p>
                {i === 0 && <div className="h-10 mt-3"><ResponsiveContainer width="100%" height="100%"><LineChart data={sparklineData}><Line type="monotone" dataKey="v" stroke="#00D68F" strokeWidth={1.5} dot={false} /></LineChart></ResponsiveContainer></div>}
                <AnimatePresence>{hs === i && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs font-body whitespace-nowrap shadow-lg z-10">
                    查看详情 <ChevronRight className="inline w-3 h-3" /><div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-900 rotate-45" />
                  </motion.div>
                )}</AnimatePresence>
              </Link>
            </motion.div>
          ))}</div>
        </div>
      </section>

      <section className="py-20 px-6 bg-brand-900">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">准备好打造你的<span className="text-brand-400">理想简历</span>了吗？</h2>
            <p className="font-body text-brand-200/60 text-lg mb-8">立即开始，让 AI 成为你的简历搭档</p>
            <Link to="/create" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"><Sparkles className="w-5 h-5" /> 立即开始</Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
