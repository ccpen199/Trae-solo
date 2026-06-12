import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Star, ChevronRight, User, FileText, TrendingUp, Zap, Lightbulb, RotateCcw, MessageCircle, Eye, EyeOff, GitCompare, Shield, FileType, Globe, ArrowRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { mockCases } from '@/data/mockCases';

const navLinks = ['首页', 'AI创作', '简历实验室', '发现分类', '后台管理'];
const navPaths = ['/', '/create', '/lab', '/cases', '/admin'];
const quickPrompts = ['我是3年前端工程师', '想转产品经理', '刚毕业求职', '优化现有简历'];
const industryFilters = ['全部', '互联网', '金融', '科技', '设计', '教育'];
const sparklineData = [{ v: 62 }, { v: 65 }, { v: 68 }, { v: 72 }, { v: 75 }, { v: 78 }];
const stats = [
  { value: 78, suffix: '%', label: 'ATS通过率', icon: FileText, color: 'text-brand-500' },
  { value: 50000, suffix: '+', label: '用户', icon: Zap, color: 'text-gold-500' },
  { value: 35, suffix: '%', label: '优化提升', icon: TrendingUp, color: 'text-brand-500' },
  { value: 1000, suffix: '+', label: '案例模板', icon: Lightbulb, color: 'text-gold-500' },
];

interface ResumeVariant { n: string; t: string; sm: string; ex: string; pj: string; ed: string; sk: string[]; exE?: string; smE?: string; }

const V: ResumeVariant[] = [
  { n: '李明轩', t: '全栈工程师', sm: '5年全栈开发经验，擅长React与Node.js，主导过多个大型项目从0到1的构建。', ex: '高级全栈工程师 · 字节跳动 2021-至今\n全栈开发 · 美团 2019-2021', pj: '电商中台重构、低代码平台搭建、微服务架构升级', ed: '北京大学 · 计算机科学与技术 硕士', sk: ['React', 'TypeScript', 'Node.js', 'Vue', 'MySQL', 'Docker'] },
  { n: '王佳怡', t: '前端工程师', sm: '3年前端开发经验，精通React/Vue双栈，字节跳动+创业公司背景。', ex: '高级前端工程师 · 字节跳动 2022-至今\n前端开发 · 星辰科技 2021-2022', pj: '抖音创作者平台核心模块、低代码可视化引擎、H5性能优化', ed: '浙江大学 · 软件工程 学士', sk: ['React', 'Vue3', 'TypeScript', 'Webpack', 'Vite', 'TailwindCSS'] },
  { n: '陈子墨', t: '产品经理', sm: '5年互联网产品经验，跨职能项目管理能力强，用户洞察与商业分析兼备。', ex: '高级产品经理 · 腾讯 2022-至今\n产品经理 · 京东 2020-2022', pj: '微信支付电商解决方案（GMV+38%）、PLUS会员体系重构、增长策略', ed: '复旦大学 · 市场营销 硕士', sk: ['产品设计', '数据分析', 'A/B测试', 'PRD撰写', '用户研究', 'SQL'] },
  { n: '林小雨', t: '应届毕业生', sm: '2026届应届，成绩优异，多段名企实习，校园活动丰富，学习能力强。', ex: '产品运营实习生 · 阿里巴巴 2025.07-10\n数据分析实习生 · 字节跳动 2025.03-06', pj: '学生会主席（10+活动）、双创大赛金奖、GPA3.8/4.0 专业前5%', ed: '上海交大 · 信息管理与信息系统 学士 2022-2026', sk: ['Excel', 'SQL', 'Python', 'PPT', '沟通协作', '项目管理'] },
  { n: '郑昊然', t: '高级数据分析师', sm: '6年数据分析经验，擅长用数据驱动决策，量化成果获顶级面试官好评。', ex: '高级数据分析师 · 蚂蚁集团 2022-至今\n数据分析师 · 携程 2020-2022', pj: '风控模型迭代（坏账-24%）、留存体系搭建（30日留存+18%）、ROI优化', ed: '中科大 · 统计学 硕士', sk: ['SQL', 'Python', 'Tableau', '机器学习', 'A/B测试', '统计学'] },
  { n: '张艺涵', t: 'UI/UX设计师', sm: '4年产品设计经验，作品集丰富，用户体验与视觉表达俱佳。', ex: '高级UI设计师 · 网易 2022-至今\nUX设计师 · 小米 2020-2022', pj: '网易云音乐社区改版（DAU+12%）、小米商城视觉升级、设计系统搭建', ed: '中央美院 · 视觉传达设计 学士', sk: ['Figma', 'Sketch', 'Principle', '用户研究', '原型设计', '设计系统'] },
];

const STAR: { o: string; s: { l: string; c: string }[] }[] = [
  { o: '负责电商平台前端开发', s: [{ l: 'S 背景', c: '公司电商平台流量高峰页面卡顿，转化率持续下降' }, { l: 'T 任务', c: '作为全栈核心，重构商品详情页与购物车，性能提升30%' }, { l: 'A 行动', c: '采用React18并发特性、虚拟滚动、图片懒加载、组件缓存' }, { l: 'R 结果', c: '首屏加载从3.2s降至1.1s，转化率提升22%，获季度技术奖' }] },
  { o: '负责抖音创作者平台开发', s: [{ l: 'S 背景', c: '创作者平台内容发布页白屏率高达8%，投诉量月增20%' }, { l: 'T 任务', c: '作为前端Owner，重构发布流程，白屏率降至1%以内' }, { l: 'A 行动', c: '拆分巨型组件，路由级懒加载，ServiceWorker离线缓存' }, { l: 'R 结果', c: '白屏率降至0.6%，发布成功率+15%，创作者NPS上涨28分' }] },
  { o: '负责支付电商解决方案', s: [{ l: 'S 背景', c: '微信支付电商GMV增长瓶颈，商家接入复杂、转化率低' }, { l: 'T 任务', c: '设计一站式电商支付方案，目标GMV提升30%' }, { l: 'A 行动', c: '设计分账、担保、营销三合一产品包，联动5条业务线' }, { l: 'R 结果', c: '上线半年GMV+38%，商家接入效率+60%，成为行业标杆' }] },
  { o: '参与阿里产品运营实习', s: [{ l: 'S 背景', c: '阿里电商大促用户流失加剧，新客获取成本攀升' }, { l: 'T 任务', c: '作为产品运营实习生，负责用户增长活动策划落地' }, { l: 'A 行动', c: '设计落地3轮大促互动玩法，联动5个流量渠道' }, { l: 'R 结果', c: '带动新用户增长12万，30日留存提升8个百分点' }] },
  { o: '负责风控模型迭代', s: [{ l: 'S 背景', c: '互金业务坏账率攀升至2.8%，规则引擎误杀率高' }, { l: 'T 任务', c: '主导风控模型迭代，目标坏账率下降20%' }, { l: 'A 行动', c: '构建XGBoost+图神经网络融合模型，引入300+新特征' }, { l: 'R 结果', c: '坏账率下降24%至2.1%，误杀率降低18%，年省5000万' }] },
  { o: '负责网易云音乐社区改版', s: [{ l: 'S 背景', c: '云音乐社区停留时长下滑，互动率降至3.2%' }, { l: 'T 任务', c: '作为主设计师，负责社区整体改版，DAU提升10%+' }, { l: 'A 行动', c: '重设信息流架构，引入话题气泡、音乐卡片新组件' }, { l: 'R 结果', c: 'DAU增长12%，停留时长+5分钟，互动率回升至5.8%' }] },
];

interface FItem { q: string; a: string; k: 'ex' | 'sm'; t: string; }
const FU: Record<string, { vi: number; sl: string; it: FItem[] }> = {
  '我是3年前端工程师': { vi: 1, sl: '求职意向 = 3年前端工程师', it: [
    { q: '主导过什么核心项目？有量化成果吗？', a: '主导过抖音创作者平台核心模块重构，日活提升15%', k: 'ex', t: '高级前端工程师 · 字节跳动 2022-至今（核心模块Owner，DAU+15%）\n前端开发 · 星辰科技 2021-2022' },
    { q: '技术栈是 React/Vue/Angular 还是其他？', a: '主要使用 React + TypeScript，也有 Vue3 项目经验', k: 'sm', t: '3年前端开发经验，精通React/Vue双栈（React+TS为主），熟悉Vite/Webpack构建优化，字节跳动+创业公司背景。' },
  ]},
  '刚毕业求职': { vi: 3, sl: '求职意向 = 刚毕业求职', it: [
    { q: '你有几段实习经历？能简单说一下实习内容吗？', a: '有2段实习：阿里产品运营3个月，字节数据分析3个月', k: 'ex', t: '产品运营实习生 · 阿里巴巴 2025.07-10（用户增长项目，新客+12万）\n数据分析实习生 · 字节跳动 2025.03-06（运营报表自动化，效率+40%）' },
    { q: '专业成绩和校园活动要突出吗？', a: 'GPA3.8/4.0专业前5%，学生会主席组织10+活动', k: 'sm', t: '2026届应届，GPA3.8/4.0专业前5%，多段名企实习（阿里+字节），学生会主席组织10+校园活动，双创大赛金奖，学习能力与执行力兼备。' },
  ]},
  '想转产品经理': { vi: 2, sl: '求职意向 = 转产品经理', it: [
    { q: '之前是什么岗位？有多少年经验？', a: '之前是3年前端开发，对产品设计有浓厚兴趣', k: 'sm', t: '3年前端转产品，技术背景强能与开发高效沟通，用户思维敏锐，独立设计过2款小程序原型，跨职能协作经验丰富。' },
    { q: '转产品的核心优势是什么？', a: '技术背景+用户思维+数据敏感度，能快速落地', k: 'ex', t: '高级产品经理（转岗）· 腾讯 2022-至今\n前端开发工程师 · 京东 2020-2022（期间主导3个需求从设计到落地）' },
  ]},
  '优化现有简历': { vi: 0, sl: '求职意向 = 优化现有简历', it: [
    { q: '主要投递什么岗位？目标行业是？', a: '主要投递互联网大厂高级前端，也考虑新能源AI公司', k: 'sm', t: '5年全栈开发经验，目标高级前端/全栈岗位，擅长React与Node.js，主导过多个大型项目从0到1构建，具备跨行业适配能力。' },
  ]},
};

interface Ver { id: number; vi: number; src: string; ts: string; cv?: Partial<ResumeVariant>; badge?: string; }

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [cur, setCur] = useState(0); const ref = useRef<HTMLSpanElement>(null); const s = useRef(false);
  useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !s.current) { s.current = true; const step = Math.max(1, Math.floor(value / 60)); let v = 0;
      const id = setInterval(() => { v += step; if (v >= value) { v = value; clearInterval(id); } setCur(v); }, 16); }
  }, { threshold: 0.5 }); o.observe(el); return () => o.disconnect(); }, [value]);
  return <span ref={ref}>{value >= 1000 ? cur.toLocaleString() : cur}{suffix}</span>;
}

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }) };

export default function Home() {
  const nav = useNavigate(); const nid = useRef(2);
  const [prompt, setPrompt] = useState(''); const [acf, setAcf] = useState('互联网');
  const [sb, setSb] = useState(false); const [sbT, setSbT] = useState('已更新简历');
  const [hs, setHs] = useState<number | null>(null); const [fu, setFu] = useState<FItem[]>([]);
  const [chip, setChip] = useState(''); const [showSTAR, setShowSTAR] = useState(false);
  const [cmp, setCmp] = useState(false); const [sel, setSel] = useState<number[]>([]);
  const [ats, setAts] = useState(false);
  const [vers, setVers] = useState<Ver[]>([{ id: 1, vi: 0, src: '✓ 生成依据：默认示例模板', ts: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }]);
  const [av, setAv] = useState(1);

  const actV = useMemo(() => vers.find(v => v.id === av) || vers[0], [vers, av]);
  const mr: ResumeVariant = useMemo(() => ({ ...V[actV.vi], ...(actV.cv || {}) }), [actV]);
  const aSTAR = STAR[actV.vi];
  const sc = acf === '全部' ? mockCases.slice(0, 6) : mockCases.filter(c => c.industry === acf).slice(0, 6);
  const pc = sc.length;
  const secs = [{ t: mr.n, s: mr.t, b: true }, { t: '个人总结', s: mr.smE || mr.sm }, { t: '工作经历', s: mr.exE || mr.ex, m: true }, { t: '项目经历', s: mr.pj }, { t: '教育背景', s: mr.ed }, { t: '技能', tags: mr.sk, it: true }];

  const addV = (vi: number, src: string, opts?: { cv?: Partial<ResumeVariant>; badge?: string }) => {
    const id = nid.current++; const nv: Ver = { id, vi, src: `✓ 生成依据：${src}`, ts: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), cv: opts?.cv, badge: opts?.badge };
    setVers(p => [...p, nv]); setAv(id); return id;
  };
  const toast = (t: string) => { setSbT(t); setSb(true); setTimeout(() => setSb(false), 2200); };

  const onChip = (pt: string) => {
    const c = FU[pt]; if (!c) return; setChip(pt); setPrompt(pt); addV(c.vi, c.sl);
    toast('已根据求职意向更新简历'); setTimeout(() => setFu(c.it), 400); setSel([]);
  };

  const onFU = (it: FItem) => {
    setPrompt(p => (p ? `${p}\n${it.a}` : it.a));
    const cv: Partial<ResumeVariant> = it.k === 'ex' ? { exE: it.t } : { smE: it.t };
    addV(actV.vi, `对话关键词 = ${chip} + ${it.q.slice(0, 8)}`, { cv, badge: '✓ 已补充信息' });
    setFu([]); toast('已补充信息，生成定制化版本');
  };

  const onSend = () => { if (prompt.trim()) { addV(actV.vi, '用户自定义输入'); toast('已生成新版本'); nav('/create', { state: { initialPrompt: prompt } }); } };
  const selVer = (id: number) => cmp ? setSel(p => p.includes(id) ? p.filter(x => x !== id) : p.length < 2 ? [...p, id] : [p[1], id]) : setAv(id);
  const rollback = (tid: number) => { setVers(p => p.slice(0, p.findIndex(v => v.id === tid) + 1)); setAv(tid); setSel([]); toast('已回滚到该版本'); };
  const genSTAR = () => { addV(actV.vi, actV.src.replace('✓ 生成依据：', '') + ' + STAR改写'); toast('已基于STAR生成下一个版本'); };
  const vnum = vers.findIndex(v => v.id === av) + 1;
  const akey = `${actV.id}-${ats ? 'ats' : 'n'}`;
  const gsc = (i: number) => (ats ? 'border-b border-dashed border-gray-400 pb-2 ' : 'border-l-2 border-brand-500 pl-3 ') + (i === 0 ? 'mb-4 ' : i < 5 ? 'mb-3 ' : '') + (i === 5 && ats ? 'border-b-0 ' : '');

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
        <AnimatePresence>{sb && <motion.div initial={{ opacity: 0, y: -20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.8 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full bg-gold-500 text-brand-900 font-body text-sm font-semibold shadow-xl shadow-gold-500/40 flex items-center gap-2"><Sparkles className="w-4 h-4" /> ✓ {sbT}</motion.div>}</AnimatePresence>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex-1 flex flex-col justify-center pt-8">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">你好，我是你的<br /><span className="text-brand-400">简历AI搭档</span></h1>
            <p className="font-body text-brand-200/70 text-lg mb-8 max-w-md">用自然语言描述你的职业经历，我会帮你生成专业简历</p>
            <div className="flex flex-wrap gap-3 mb-6">{quickPrompts.map((t, i) => (
              <motion.button key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} onClick={() => onChip(t)} className={`px-4 py-2 rounded-full font-body text-sm transition-all ${chip === t ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-white/10 border border-white/20 text-white/90 hover:bg-brand-500/30 hover:border-brand-400/50'}`}>{t}</motion.button>
            ))}</div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative">
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend())} placeholder="告诉我你的职业背景、项目经历、求职意向..." className="w-full h-32 p-5 pr-16 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-body resize-none focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-transparent backdrop-blur-sm" rows={4} />
              <button onClick={onSend} className="absolute right-4 bottom-4 w-12 h-12 rounded-xl bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center transition-all hover:shadow-lg hover:shadow-brand-500/30"><Send className="w-5 h-5" /></button>
            </motion.div>
            <AnimatePresence>{fu.length > 0 && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-brand-300/70 text-xs font-body mb-2"><MessageCircle className="w-3.5 h-3.5" /> AI 想进一步了解你：</div>
              {fu.map((it, i) => (
                <motion.button key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.25, type: 'spring', stiffness: 200 }} onClick={() => onFU(it)} className="w-full text-left px-4 py-3 rounded-xl bg-white/8 border border-brand-400/20 text-brand-100/90 font-body text-sm hover:bg-brand-500/20 hover:border-brand-400/40 transition-all flex items-start gap-2 group">
                  <span className="text-brand-400 mt-0.5">Q{i + 1}.</span><span className="flex-1">{it.q}</span>
                  <ChevronRight className="w-4 h-4 text-brand-400/50 group-hover:text-brand-300 group-hover:translate-x-0.5 transition-all mt-0.5 shrink-0" />
                </motion.button>
              ))}
            </motion.div>}</AnimatePresence>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex-1 flex flex-col items-center justify-center relative gap-4 pt-8">
            <div className="relative w-full max-w-sm">
              <motion.div key={vnum} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-3 -right-3 z-10 px-4 py-2 rounded-full bg-gold-500 text-brand-900 font-body text-sm font-semibold shadow-lg shadow-gold-500/30 flex items-center gap-2"><Sparkles className="w-4 h-4" /> 生成版本 v{vnum}</motion.div>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-12 left-0 z-10 px-3 py-1.5 rounded-lg bg-brand-500/20 border border-brand-400/30 text-brand-200 font-body text-xs flex items-center gap-1.5 backdrop-blur-sm max-w-[280px]"><Sparkles className="w-3 h-3 shrink-0" /><span className="truncate">{actV.src}</span></motion.div>
              <div className="absolute top-16 -right-2 z-10 flex flex-col items-end gap-2">
                {actV.badge && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-sm"><Sparkles className="w-3 h-3" /> {actV.badge}</motion.div>}
                <div className="flex items-center gap-2">
                  <button onClick={() => setAts(!ats)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all ${ats ? 'bg-gray-800 text-gray-100 border border-gray-600' : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'}`}>{ats ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} ATS模式</button>
                  <button onClick={() => setShowSTAR(!showSTAR)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all ${showSTAR ? 'bg-gold-500 text-brand-900' : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'}`}><Star className="w-3 h-3" /> {showSTAR ? '隐藏STAR' : '查看STAR'}</button>
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={akey} initial={{ opacity: 0, rotateY: -15, scale: 0.95 }} animate={{ opacity: 1, rotateY: 0, scale: 1 }} exit={{ opacity: 0, rotateY: 15, scale: 0.95 }} transition={{ duration: 0.4, ease: 'easeOut' }} className={`aspect-[210/297] rounded-xl shadow-2xl p-6 resume-preview mt-16 ${ats ? 'bg-white border-2 border-gray-300 font-mono' : 'bg-white shadow-black/30'}`}>
                  {secs.map((s, i) => (
                    <div key={i} className={gsc(i)}>
                      <h3 className={`font-bold ${ats ? 'text-gray-900' : 'text-brand-900'} ${s.b ? 'font-display text-xl' : 'font-display text-sm'} ${i === 0 ? '' : 'mb-1'}`}>{s.t}</h3>
                      {s.b && <p className={`text-sm font-medium ${ats ? 'text-gray-700' : 'text-brand-600'}`}>{s.s}</p>}
                      {s.m && s.s?.split('\n').map((ln, j) => <p key={j} className={`text-xs ${j === 0 ? `font-semibold ${ats ? 'text-gray-800' : 'text-brand-800'}` : ats ? 'text-gray-600' : 'text-brand-600/70'}`}>{ln}</p>)}
                      {!s.b && !s.m && !s.it && <p className={`text-xs leading-relaxed ${ats ? 'text-gray-700' : 'text-brand-700/80'}`}>{s.s}</p>}
                      {s.it && <div className="flex flex-wrap gap-1">{s.tags?.map((tg: string) => <span key={tg} className={`px-2 py-0.5 text-[10px] rounded ${ats ? 'bg-gray-200 text-gray-800 border border-gray-400' : 'bg-brand-100 text-brand-700'}`}>{tg}</span>)}</div>}
                    </div>
                  ))}
                  {ats && <div className="mt-3 pt-2 border-t border-dashed border-gray-400 text-[10px] text-gray-500 font-mono">✓ ATS兼容布局启用，预计通过率 +12%</div>}
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence>{showSTAR && <motion.div initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: 10, height: 0 }} className="w-full max-w-sm overflow-hidden">
              <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-xl">
                <div className="text-xs font-bold text-brand-800 mb-2 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" /> STAR 改写依据 · {V[actV.vi].t}</div>
                <div className="mb-3 p-2 bg-gray-100 rounded text-xs text-gray-600 line-through">原文：{aSTAR.o}</div>
                <div className="space-y-2">{aSTAR.s.map((it, i) => (
                  <div key={i} className="flex gap-2"><span className="text-[10px] font-bold text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded shrink-0 h-fit">{it.l}</span><span className="text-xs text-gray-700"><span className="text-emerald-600 font-medium">{it.c.slice(0, 4)}</span>{it.c.slice(4)}</span></div>
                ))}</div>
                <button onClick={genSTAR} className="mt-3 w-full py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"><Sparkles className="w-3 h-3" /> 基于该STAR生成下一个版本</button>
              </div>
            </motion.div>}</AnimatePresence>

            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-xs font-body">历史版本（共 {vers.length} 个）:</span>
                <button onClick={() => { setCmp(!cmp); setSel([]); }} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${cmp ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}><GitCompare className="w-3 h-3" /> {cmp ? '退出对比' : '对比模式'}</button>
              </div>
              <div className="flex flex-wrap gap-2">{vers.map((vr) => {
                const vn = vers.findIndex(v => v.id === vr.id) + 1; const isA = vr.id === av;
                return <div key={vr.id} className="relative group">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => selVer(vr.id)} className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${sel.includes(vr.id) ? 'bg-gold-500 text-brand-900 font-bold ring-2 ring-gold-300' : isA ? 'bg-brand-400 text-brand-900 font-bold shadow-md shadow-brand-400/30' : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'}`}>v{vn}</motion.button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 flex flex-col items-center gap-1">
                    <div className="text-[9px] text-white/60 font-mono whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded">{vr.ts} · {V[vr.vi].n}</div>
                    {!isA && <button onClick={e => { e.stopPropagation(); rollback(vr.id); }} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded flex items-center gap-0.5 whitespace-nowrap shadow-lg"><RotateCcw className="w-2.5 h-2.5" /> 回滚到此</button>}
                  </div>
                </div>;
              })}</div>
              <AnimatePresence>{cmp && sel.length === 2 && (() => {
                const va = vers.find(v => v.id === sel[0]); const vb = vers.find(v => v.id === sel[1]); if (!va || !vb) return null;
                const na = vers.findIndex(v => v.id === va.id) + 1; const nb = vers.findIndex(v => v.id === vb.id) + 1;
                return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-4 bg-white/95 backdrop-blur rounded-xl p-3 shadow-xl">
                  <div className="text-xs font-bold text-brand-800 mb-2 flex items-center gap-1"><GitCompare className="w-3.5 h-3.5" /> v{na}（{V[va.vi].n}） vs v{nb}（{V[vb.vi].n}）</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-red-50 rounded border border-red-200"><div className="text-red-600 font-bold mb-1">v{na}（旧）</div><div className="text-red-500/80 leading-relaxed">{V[va.vi].sm.slice(0, 28)}...</div></div>
                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200"><div className="text-emerald-600 font-bold mb-1">v{nb}（新）</div><div className="text-emerald-700/80 leading-relaxed">{V[vb.vi].sm.slice(0, 28)}...</div></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">点击版本标签切换查看</span>
                    <button onClick={() => rollback(va.id)} className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center gap-0.5"><RotateCcw className="w-2.5 h-2.5" /> 回滚到v{na}</button>
                  </div>
                </motion.div>;
              })()}</AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="px-2.5 py-1 bg-brand-100 text-brand-600 text-xs font-bold rounded-full">预览</span><h2 className="font-display text-3xl font-bold text-brand-900">📚 精选案例库预览（仅显示前6份）</h2></div>
              <p className="font-body text-surface-300 text-sm"><span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-bold mr-2 border border-amber-200">筛选预览</span>当前行业 = <span className="text-brand-500 font-bold">{acf}</span> / 显示 <span className="text-brand-500 font-bold">{pc}</span> 份 / 完整案例库共 <span className="text-brand-500 font-bold">{mockCases.length}</span> 份</p>
            </div>
            <Link to="/cases" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-body text-sm font-bold rounded-full transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5">前往完整案例库筛选200+行业/岗位/经验层级 <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">{industryFilters.map(ind => (
            <button key={ind} onClick={() => setAcf(ind)} className={`px-4 py-2 rounded-full font-body text-sm transition-all relative ${acf === ind ? 'bg-brand-500 text-white shadow-md' : 'bg-surface-100 text-surface-300 hover:bg-surface-200'}`}>{ind}{acf === ind && <motion.span layoutId="cfu" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full" />}</button>
          ))}</div>
          <div className="grid md:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">{sc.map((c, i) => (
              <motion.div key={c.id} layout custom={i} variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }} whileInView="visible" viewport={{ once: true }} className="group">
                <Link to={`/cases/${c.id}`} className="block card-hover">
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 mb-3 flex items-center justify-center relative overflow-hidden">
                    <span className="font-display text-2xl font-bold text-white/90 z-10">{c.title.slice(0, 8)}</span>
                    <div className="absolute top-2 right-2 px-2 py-1 bg-gold-500/90 text-brand-900 text-[10px] font-bold rounded-full z-10 flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" /> HR点评: {c.hrReviews.length}</div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-white/15 text-white text-[10px] rounded z-10 backdrop-blur-sm">👁 预览 · 点击查看完整</div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                  <h3 className="font-display font-bold text-brand-900 mb-1 group-hover:text-brand-500 transition-colors">{c.title}</h3>
                  <div className="flex items-center gap-3"><span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-600">{c.industry}</span><div className="flex items-center gap-1"><Star className="w-3 h-3 text-gold-500 fill-gold-500" /><span className="text-xs font-mono text-gold-600">{c.rating}</span></div></div>
                </Link>
              </motion.div>
            ))}</AnimatePresence>
            {sc.length === 0 && <div className="col-span-3 py-16 text-center text-surface-300 font-body">该行业暂无案例，敬请期待</div>}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex items-end justify-between mb-14 flex-wrap gap-4">
            <div><div className="flex items-center gap-2 mb-2"><span className="px-2.5 py-1 bg-gold-100 text-gold-600 text-xs font-bold rounded-full">预览</span><h2 className="font-display text-3xl font-bold text-brand-900">📊 平台数据概览</h2></div><motion.p variants={fadeUp} custom={1} className="font-body text-surface-300 text-sm">此为首页预览数据，完整报表请前往数据看板</motion.p></div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-brand-900 font-body text-sm font-bold rounded-full transition-all shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5">前往数据看板查看完整质量趋势/模板热力图报表 <ArrowRight className="w-4 h-4" /></Link>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{stats.map((s, i) => (
            <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative text-center p-6 rounded-2xl bg-white shadow-sm cursor-pointer group border border-transparent hover:border-brand-200 transition-all" onMouseEnter={() => setHs(i)} onMouseLeave={() => setHs(null)}>
              <Link to="/dashboard" className="block">
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-surface-100 text-surface-300 text-[9px] rounded font-bold">预览</div>
                <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-3`} />
                <div className={`font-display text-4xl font-bold ${s.color} mb-2`}><AnimatedNumber value={s.value} suffix={s.suffix} /></div>
                <p className="font-body text-sm text-surface-300">{s.label}</p>
                {i === 0 && <div className="h-10 mt-3"><ResponsiveContainer width="100%" height="100%"><LineChart data={sparklineData}><Line type="monotone" dataKey="v" stroke="#00D68F" strokeWidth={1.5} dot={false} /></LineChart></ResponsiveContainer></div>}
                <AnimatePresence>{hs === i && <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-brand-900 text-white text-xs font-body whitespace-nowrap shadow-lg z-10">前往看板查看详情 <ChevronRight className="inline w-3 h-3" /><div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-900 rotate-45" /></motion.div>}</AnimatePresence>
              </Link>
            </motion.div>
          ))}</div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div><div className="flex items-center gap-2 mb-2"><span className="px-2.5 py-1 bg-emerald-100 text-emerald-600 text-xs font-bold rounded-full">预览</span><h2 className="font-display text-3xl font-bold text-brand-900">更多平台能力预览</h2></div><p className="font-body text-surface-300 text-sm">前往对应页面使用完整功能</p></div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="p-6 rounded-2xl bg-gradient-to-br from-brand-50 to-white border border-brand-100 relative overflow-hidden">
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-brand-500/10 text-brand-500 text-[10px] rounded-full font-bold">能力预览</div>
              <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center gap-1.5 text-white shadow-lg shadow-brand-500/20"><FileType className="w-5 h-5" /><Globe className="w-5 h-5" /></div><div><h3 className="font-display text-xl font-bold text-brand-900">三端导出能力预览</h3><p className="font-body text-sm text-surface-300">PDF / Word / Web 一键导出</p></div></div>
              <div className="grid grid-cols-3 gap-3 mb-5">{[{ n: 'PDF', c: 'from-red-400 to-red-600', d: '标准排版' }, { n: 'Word', c: 'from-blue-400 to-blue-600', d: '可编辑' }, { n: 'Web', c: 'from-emerald-400 to-emerald-600', d: '在线分享' }].map(x => (
                <div key={x.n} className="text-center p-3 rounded-xl bg-white border border-gray-100 shadow-sm"><div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${x.c} flex items-center justify-center text-white font-bold text-xs`}>{x.n}</div><div className="text-[11px] font-medium text-brand-800">{x.n}</div><div className="text-[9px] text-surface-300">{x.d}</div></div>
              ))}</div>
              <Link to="/editor/resume-1" className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-body text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">前往简历编辑器使用完整导出功能 <ArrowRight className="w-4 h-4" /></Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 relative overflow-hidden">
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-violet-500/10 text-violet-600 text-[10px] rounded-full font-bold">安全预览</div>
              <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20"><Shield className="w-6 h-6" /></div><div><h3 className="font-display text-xl font-bold text-brand-900">端到端加密与数据迁移</h3><p className="font-body text-sm text-surface-300">你的简历数据，只有你能访问</p></div></div>
              <div className="space-y-2.5 mb-5">{[{ t: 'AES-256 端到端加密', d: '简历内容本地加密后上传' }, { t: '一键数据迁移包', d: '导出所有数据换账号无缝迁移' }, { t: '隐私模式', d: '本地模式不上传任何数据' }].map((x, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-gray-100"><div className="w-7 h-7 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-brand-800">{x.t}</div><div className="text-[10px] text-surface-300 truncate">{x.d}</div></div></div>
              ))}</div>
              <Link to="/profile" className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-body text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">前往个人中心配置加密密钥/导出迁移包 <ArrowRight className="w-4 h-4" /></Link>
            </motion.div>
          </div>
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
