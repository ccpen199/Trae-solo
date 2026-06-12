import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle2, Loader2, FileText, Target, ArrowRight, Sparkles, FileDown, Edit3, ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Clock, Check, Eye, EyeOff, ListChecks, X, Bookmark, Zap } from 'lucide-react';

type Step = 'upload' | 'analyzing' | 'results';
type SuggestionTab = 'pending' | 'fixed' | 'history';
type DiffMode = 'inline' | 'side';
type Priority = '高' | '中' | '低';
type Category = '动词' | '量化' | '排版' | 'ATS';

interface Suggestion {
  id: string;
  priority: Priority;
  title: string;
  desc: string;
  category: Category;
  fixed: boolean;
  fixedAt?: string;
  before?: string;
  after?: string;
  compareType?: '动词' | '量化' | '排版';
  sectionRef?: string;
  scoreDelta?: number;
}

interface ParseSection {
  name: string;
  status: 'ok' | 'warn' | 'miss';
  summary: string;
  raw: string;
}

interface HistoryEntry {
  time: string;
  action: string;
  delta: number | null;
  type: 'upload' | 'analyze' | 'fix' | 'export' | 'apply';
}

interface RecentFile {
  name: string;
  date: string;
  score: number;
}

const SUB_SCORES = [
  { label: '动词强度', score: 72, color: 'from-purple-400 to-purple-600' },
  { label: '量化完整度', score: 58, color: 'from-sky-400 to-sky-600' },
  { label: '排版', score: 85, color: 'from-violet-400 to-violet-600' },
  { label: 'ATS兼容度', score: 67, color: 'from-emerald-400 to-emerald-600' },
];

const PARSE_SECTIONS: ParseSection[] = [
  { name: '基本信息', status: 'ok', summary: '张明远 / 高级前端工程师 / 上海', raw: '姓名：张明远\n职位：高级前端工程师\n城市：上海\n电话：138****8888\n邮箱：zhangmy@email.com\n工作年限：5年\n期望薪资：30-50K' },
  { name: '个人总结', status: 'ok', summary: '提取成功，84 字', raw: '5年前端开发经验，精通 React/Vue 技术栈，擅长大型 Web 应用架构设计与性能优化。曾主导多个千万级用户产品的前端重构，具备良好的团队协作能力和技术分享精神。' },
  { name: '工作经历', status: 'ok', summary: '2 条记录（字节跳动 + 美团）', raw: '【字节跳动】高级前端工程师 | 2021.03 - 至今\n负责抖音电商核心模块开发，推动性能优化项目，参与团队建设和新人培训。\n\n【美团】前端工程师 | 2019.06 - 2021.02\n参与外卖商家端系统建设，负责订单管理模块，协助完成产品上线。' },
  { name: '项目经历', status: 'ok', summary: '1 条记录', raw: '【电商大促活动平台】技术负责人 | 2023.06 - 2023.11\n负责项目管理，推动项目进展。搭建跨端活动配置平台，支持可视化拖拽。参与团队建设和培训，协助完成产品上线。' },
  { name: '教育背景', status: 'ok', summary: '1 条（北京大学 硕士）', raw: '北京大学 | 计算机科学与技术 | 硕士 | 2017.09 - 2019.06\n浙江大学 | 软件工程 | 学士 | 2013.09 - 2017.06' },
  { name: '技能', status: 'warn', summary: '12 个关键词，建议分类', raw: 'React, Vue, TypeScript, Node.js, Webpack, Vite, Redux, MobX, GraphQL, Docker, CI/CD, 性能优化' },
  { name: '证书', status: 'miss', summary: '未找到，建议补充', raw: '' },
];

const INITIAL_SUGGESTIONS: Suggestion[] = [
  { id: 's1', priority: '高', title: '弱动词"负责"出现5次', desc: '建议替换为更有冲击力的强动词，体现主导权和影响力', category: '动词', fixed: false, before: '负责项目管理，推动项目进展', after: '主导5个核心项目，推动交付效率提升30%', compareType: '动词', sectionRef: '项目经历', scoreDelta: 3 },
  { id: 's2', priority: '高', title: '弱动词"参与"出现3次', desc: '建议替换为体现主导性的动词，突出个人贡献', category: '动词', fixed: false, before: '参与团队建设和培训', after: '搭建12人跨职能团队，建立标准化培训体系', compareType: '动词', sectionRef: '工作经历', scoreDelta: 3 },
  { id: 's3', priority: '中', title: '弱动词"协助"出现2次', desc: '建议替换为体现贡献度的动词，展示独立价值', category: '动词', fixed: false, before: '协助完成产品上线', after: '引领产品从0到1上线，首月获客10万+', compareType: '动词', sectionRef: '工作经历', scoreDelta: 2 },
  { id: 's4', priority: '高', title: '缺少团队规模量化', desc: '补充管理团队人数，如"带领8人团队"，让规模感更具体', category: '量化', fixed: false, before: '负责团队建设', after: '带领8人前端团队，覆盖3条核心业务线', compareType: '量化', sectionRef: '工作经历', scoreDelta: 3 },
  { id: 's5', priority: '中', title: '缺少预算金额描述', desc: '增加项目预算规模，如"负责500万预算项目"，体现担当级别', category: '量化', fixed: false, compareType: '量化', sectionRef: '项目经历', scoreDelta: 2 },
  { id: 's6', priority: '中', title: '缺少业务数据支撑', desc: '工作成果需补充具体数字，如DAU、转化率、节省成本等', category: '量化', fixed: false, compareType: '量化', sectionRef: '项目经历', scoreDelta: 2 },
  { id: 's7', priority: '中', title: '技能分类混乱', desc: '按技术栈/软技能/工具分组展示，便于HR快速扫描', category: '排版', fixed: false, compareType: '排版', sectionRef: '技能', scoreDelta: 2 },
  { id: 's8', priority: '低', title: '页面留白不足', desc: '增加行间距和段落间距提升可读性，避免信息拥挤', category: '排版', fixed: false, compareType: '排版', sectionRef: '基本信息', scoreDelta: 1 },
];

const ANALYSIS_STEPS = [
  { label: 'OCR识别', sub: '提取文字轮廓...' },
  { label: '结构化提取', sub: '基本信息 ✓ 工作经历 ✓ 项目经历...' },
  { label: 'ATS关键词检测', sub: '已匹配 12 个行业核心词' },
  { label: '动词与量化分析', sub: '弱动词发现: 5个, 量化数据: 8项' },
  { label: 'AI优化建议生成', sub: '构建上下文...' },
];

const RECENT_FILES: RecentFile[] = [
  { name: '产品经理_张三_2024.pdf', date: '2024-06-10', score: 78 },
  { name: '前端开发_李四_5年.docx', date: '2024-06-08', score: 65 },
  { name: '运营主管_王五_v3.pdf', date: '2024-06-05', score: 82 },
];

const priorityBg: Record<Priority, string> = { '高': 'bg-red-500 text-white', '中': 'bg-amber-500 text-white', '低': 'bg-gray-400 text-white' };
const categoryBg: Record<Category, string> = { '动词': 'bg-purple-50 text-purple-700 border-purple-200', '量化': 'bg-sky-50 text-sky-700 border-sky-200', '排版': 'bg-violet-50 text-violet-700 border-violet-200', 'ATS': 'bg-emerald-50 text-emerald-700 border-emerald-200' };

export default function Lab() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [activeFileName, setActiveFileName] = useState('');
  const [isSample, setIsSample] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(INITIAL_SUGGESTIONS);
  const [tab, setTab] = useState<SuggestionTab>('pending');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [highlightSection, setHighlightSection] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<Record<string, boolean>>({});
  const [diffMode, setDiffMode] = useState<DiffMode>('side');
  const [compareGroup, setCompareGroup] = useState<'动词' | '量化' | '排版'>('动词');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [diffOpen, setDiffOpen] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const addHistory = (e: Omit<HistoryEntry, 'time'>) => {
    const t = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setHistory(prev => [...prev, { ...e, time: t }]);
  };

  useEffect(() => {
    if (step !== 'analyzing') return;
    setAnalysisStep(0);
    setElapsed(0);
    const stepTimer = setInterval(() => setAnalysisStep(s => Math.min(s + 1, ANALYSIS_STEPS.length)), 600);
    const elapsedTimer = setInterval(() => setElapsed(e => +(e + 0.1).toFixed(1)), 100);
    const doneTimer = setTimeout(() => {
      clearInterval(stepTimer);
      clearInterval(elapsedTimer);
      addHistory({ action: `分析完成 · 初始评分: 70 · 发现${INITIAL_SUGGESTIONS.length}项可优化`, type: 'analyze', delta: null });
      setStep('results');
    }, 3200);
    return () => { clearInterval(stepTimer); clearInterval(elapsedTimer); clearTimeout(doneTimer); };
  }, [step]);

  useEffect(() => {
    if (!highlightSection) return;
    setExpandedSection(highlightSection);
    const t = setTimeout(() => setHighlightSection(null), 2500);
    return () => clearTimeout(t);
  }, [highlightSection]);

  const stats = useMemo(() => {
    const fixed = suggestions.filter(s => s.fixed).length;
    const total = suggestions.length;
    const delta = suggestions.filter(s => s.fixed).reduce((s, x) => s + (x.scoreDelta || 0), 0);
    return { fixed, total, current: 70 + delta, projected: 86 };
  }, [suggestions]);

  const startAnalyze = (name: string, sample = false) => {
    setActiveFileName(name);
    setIsSample(sample);
    setSuggestions(INITIAL_SUGGESTIONS.map(s => ({ ...s, fixed: false, fixedAt: undefined })));
    setHistory([]);
    addHistory({ action: `上传文件 "${name}" · 原始评分: --`, type: 'upload', delta: null });
    setStep('analyzing');
  };

  const triggerSample = () => startAnalyze('示例简历_张明远.pdf', true);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { alert('文件超过 10MB 限制'); return; }
    startAnalyze(f.name);
  };

  const handleFix = (id: string) => {
    const s = suggestions.find(x => x.id === id);
    if (!s) return;
    const now = new Date().toLocaleTimeString('zh-CN', { hour12: false, minute: '2-digit' });
    setSuggestions(prev => prev.map(x => x.id === id ? { ...x, fixed: true, fixedAt: now } : x));
    addHistory({ action: `标记 [${s.category}-${s.title.slice(0, 8)}] 为已修复 · +${s.scoreDelta || 0} ATS分`, delta: s.scoreDelta || 0, type: 'fix' });
  };

  const handleUnfix = (id: string) => {
    setSuggestions(prev => prev.map(x => x.id === id ? { ...x, fixed: false, fixedAt: undefined } : x));
  };

  const locateSection = (name?: string) => {
    if (!name) return;
    setHighlightSection(name);
    sectionRefs.current[name]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const buildReport = () => {
    const pending = suggestions.filter(s => !s.fixed);
    const fixed = suggestions.filter(s => s.fixed);
    const L: string[] = [];
    L.push('========================================\n           简历优化分析报告\n========================================\n');
    L.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
    L.push(`文件名称: ${activeFileName}`);
    L.push(`文件大小: 247KB · 页数: 2 · 字符数: 1847 · 词数: 1205`);
    L.push(`提取成功率: 96%\n`);
    L.push('----------------------------------------\n          📄 解析内容明细\n----------------------------------------');
    PARSE_SECTIONS.forEach(sec => { L.push(`\n【${sec.name}】${sec.status === 'ok' ? '✓' : sec.status === 'warn' ? '⚠' : '✗'} ${sec.summary}`); if (sec.raw) L.push(sec.raw + '\n'); });
    L.push('\n----------------------------------------\n         ATS 综合兼容性评分\n----------------------------------------');
    L.push(`  当前评分: ${stats.current}/100  ·  全部优化后可达: ${stats.projected}/100 (+${stats.projected - stats.current}分)\n`);
    SUB_SCORES.forEach(a => L.push(`  ${a.label}：${a.score}分`));
    L.push('');
    if (fixed.length) {
      L.push(`----------------------------------------\n          已修复 (${fixed.length})\n----------------------------------------`);
      fixed.forEach((s, i) => { L.push(`\n  ${i + 1}. [${s.priority}][${s.category}] ${s.title}\n     ${s.desc}`); if (s.before && s.after) L.push(`     原文: ${s.before}\n     优化: ${s.after}`); if (s.fixedAt) L.push(`     修复时间: ${s.fixedAt}`); });
      L.push('');
    }
    L.push(`----------------------------------------\n          待修复 (${pending.length})\n----------------------------------------`);
    pending.forEach((s, i) => { L.push(`\n  ${i + 1}. [${s.priority}][${s.category}] ${s.title}\n     ${s.desc}`); if (s.before && s.after) L.push(`     建议: ${s.before}  →  ${s.after}`); });
    L.push(`\n----------------------------------------\n          操作日志 (${history.length}条)\n----------------------------------------`);
    history.forEach(h => L.push(`  ${h.time}  ${h.action}${h.delta ? `  (+${h.delta}分)` : ''}`));
    L.push('\n========================================\n      本报告由 AI 简历实验室自动生成\n========================================');
    return L.join('\n');
  };

  const downloadFile = (content: string, name: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    addHistory({ action: `导出分析报告: ${name}`, type: 'export', delta: null });
  };

  const handleExport = () => downloadFile(buildReport(), `简历分析报告_${Date.now()}.txt`);

  const handleApplyAll = () => {
    setApplying(true);
    addHistory({ action: '一键应用所有优化 · 生成 v2 快照', type: 'apply', delta: null });
    setTimeout(() => { setApplying(false); navigate('/editor/resume-1'); }, 2000);
  };

  const compareList = useMemo(() => suggestions.filter(s => s.compareType === compareGroup && s.before && s.after), [compareGroup, suggestions]);

  return (
    <div className="min-h-full p-6 space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">📚 简历实验室 - PDF智能解析与优化</h1>
            <p className="text-sm text-gray-500 mt-1">上传简历PDF，AI将从4个维度智能分析并给出可复查的优化建议</p>
          </div>
          <div className="relative w-full sm:w-80">
            <button onClick={() => setGuideOpen(o => !o)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-brand-300 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Bookmark className="w-4 h-4 text-brand-500" /> 📖 使用指南</span>
              {guideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>{guideOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-2 p-4 bg-gradient-to-br from-brand-50 to-emerald-50 border border-brand-200 rounded-xl text-xs text-gray-600 space-y-2">
                  <p><b>完整流程：</b></p>
                  <p>① 上传 PDF/DOCX → ② AI自动解析（OCR→结构化→关键词→动词量化→建议）</p>
                  <p>③ 查看评分与解析 → ④ 按建议逐条修复（可定位原文）</p>
                  <p>⑤ 对比视图确认 → ⑥ 导出报告/一键跳转编辑器</p>
                </div>
              </motion.div>
            )}</AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="up" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
            <div className={`relative rounded-3xl border-2 border-dashed transition-all p-12 text-center ${dragOver ? 'border-brand-500 bg-brand-50/60 border-[3px]' : 'border-gray-300 bg-white hover:border-brand-300 hover:bg-gray-50'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0] || null); }}
              onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} />
              <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-emerald-500 flex items-center justify-center shadow-lg mb-4 transition-transform ${dragOver ? 'scale-110' : ''}`}>
                <Upload className="w-8 h-8 text-white" />
              </div>
              <p className="text-xl font-semibold text-gray-800">{dragOver ? '✨ 松开上传文件' : '拖拽简历到此处'}</p>
              <p className="text-sm text-gray-500 mt-1">或点击选择文件上传</p>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> 支持格式: PDF / DOCX · 最大 10MB · 建议扫描分辨率 300dpi</span>
              </div>
              <p className="mt-2 text-xs text-amber-600">📌 注意: 图片型PDF需OCR识别，耗时约增加3秒</p>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={triggerSample} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                <Sparkles className="w-4 h-4" /> ✨ 试试示例简历？
              </button>
              <div className="relative">
                <button onClick={() => setRecentOpen(o => !o)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:border-brand-300 transition-colors">
                  <Clock className="w-4 h-4" /> 📂 从最近上传选择
                  {recentOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <AnimatePresence>{recentOpen && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 z-30">
                    {RECENT_FILES.map((f, i) => (
                      <button key={i} onClick={() => { setRecentOpen(false); startAnalyze(f.name); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-left">
                        <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-brand-500" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                          <p className="text-xs text-gray-400">{f.date}</p>
                        </div>
                        <span className={`text-sm font-bold ${f.score >= 80 ? 'text-emerald-500' : f.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{f.score}分</span>
                      </button>
                    ))}
                  </motion.div>
                )}</AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div key="an" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 gap-8 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="relative w-28 h-28">
              <svg width="112" height="112" className="-rotate-90">
                <circle cx="56" cy="56" r="48" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                <motion.circle cx="56" cy="56" r="48" fill="none" stroke="url(#anGrad)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 48} initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                  animate={{ strokeDashoffset: (1 - (analysisStep / ANALYSIS_STEPS.length)) * 2 * Math.PI * 48 }} transition={{ duration: 0.5 }} />
                <defs><linearGradient id="anGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00D68F" /><stop offset="100%" stopColor="#10B981" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-brand-600">{Math.round((analysisStep / ANALYSIS_STEPS.length) * 100)}%</span></div>
            </div>
            <p className="text-lg font-semibold text-gray-700">正在深度分析简历...</p>
            <p className="text-sm text-gray-400 font-mono">已用时 {elapsed.toFixed(1)}s / 预计总耗时 3.2s</p>
            <div className="flex flex-col gap-3 w-96">
              {ANALYSIS_STEPS.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {i < analysisStep ? <CheckCircle2 className="w-5 h-5 text-brand-500" /> :
                     i === analysisStep ? <Loader2 className="w-5 h-5 text-brand-500 animate-spin" /> :
                     <div className="w-5 h-5 rounded-full border-2 border-gray-200" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${i < analysisStep ? 'text-brand-600' : i === analysisStep ? 'text-brand-500' : 'text-gray-400'}`}>{s.label}</p>
                    <p className={`text-xs mt-0.5 ${i < analysisStep ? 'text-gray-500' : i === analysisStep ? 'text-brand-400' : 'text-gray-300'}`}>
                      {i === analysisStep ? s.sub : i < analysisStep ? '✓ 完成' : '等待中...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div key="res" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto space-y-5 pb-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <button onClick={() => setStep('upload')} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-brand-600 bg-white hover:bg-brand-50 rounded-xl border border-gray-200 hover:border-brand-200 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> ← 返回重新上传
              </button>
              {isSample && <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-xs font-medium flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> 示例简历</span>}
            </div>

            <div className="bg-gradient-to-br from-brand-500 via-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-white/70 text-sm font-medium">🎯 ATS 综合兼容性评分</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <motion.span className="text-6xl font-bold" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}>{stats.current}</motion.span>
                    <span className="text-2xl text-white/60">/100</span>
                  </div>
                  <p className="text-white/80 mt-3 text-sm">💡 全部优化后预估可达: <span className="font-bold text-white text-base">{stats.projected}/100</span> <span className="ml-2">+{stats.projected - stats.current}分提升</span></p>
                </div>
                <div className="relative w-24 h-24">
                  <svg width="96" height="96" className="-rotate-90">
                    <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                    <motion.circle cx="48" cy="48" r="42" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42} initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      animate={{ strokeDashoffset: (1 - (stats.current / 100)) * 2 * Math.PI * 42 }} transition={{ duration: 1, delay: 0.3 }} />
                  </svg>
                  <Target className="absolute inset-0 m-auto w-8 h-8 text-white/50" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-5">
                {SUB_SCORES.map(s => (
                  <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/70">{s.label}</p>
                      <span className="text-lg font-bold">{s.score}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <motion.div className={`h-full bg-gradient-to-r ${s.color} rounded-full`} initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ duration: 0.8, delay: 0.4 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-white/80 pt-3 border-t border-white/15 flex-wrap">
                <span>📄 {activeFileName}</span><span>·</span><span>247KB</span><span>·</span><span>2页</span><span>·</span><span>1847字符</span><span>·</span><span>1205词</span><span>·</span><span className="text-emerald-200">解析96%</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-brand-500" /> 📑 解析报告</h3>
              <div className="space-y-2">
                {PARSE_SECTIONS.map(sec => (
                  <div key={sec.name} ref={el => { sectionRefs.current[sec.name] = el; }}
                    className={`border rounded-xl overflow-hidden transition-all ${highlightSection === sec.name ? 'border-brand-400 ring-2 ring-brand-200 shadow-md bg-brand-50/40' : 'border-gray-100'}`}>
                    <button onClick={() => setExpandedSection(expandedSection === sec.name ? null : sec.name)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left">
                      {sec.status === 'ok' ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> :
                       sec.status === 'warn' ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" /> :
                       <X className="w-5 h-5 text-red-400 shrink-0" />}
                      <span className="text-sm font-medium text-gray-700 flex-1">{sec.name}</span>
                      <span className={`text-xs ${sec.status === 'ok' ? 'text-gray-500' : sec.status === 'warn' ? 'text-amber-600' : 'text-red-500'}`}>{sec.summary}</span>
                      {expandedSection === sec.name ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    <AnimatePresence>
                      {expandedSection === sec.name && sec.raw && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-3 pb-3"><pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed">{sec.raw}</pre></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-brand-500" /> ✅ 建议追踪系统</h3>
                <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-1.5">
                  <span className="text-gray-500">已修复</span>
                  <span className="font-bold text-brand-600">{stats.fixed}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">{stats.total}</span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden ml-1">
                    <motion.div className="h-full bg-gradient-to-r from-brand-400 to-emerald-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${(stats.fixed / stats.total) * 100}%` }} transition={{ duration: 0.5 }} />
                  </div>
                  <span className="text-xs text-gray-500 ml-1">综合评分: {stats.current} → <span className="text-emerald-600 font-bold">{stats.projected}</span> (预计)</span>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-4 border-b border-gray-100 -mx-5 px-5">
                {(['pending', 'fixed', 'history'] as SuggestionTab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-medium transition-colors relative ${tab === t ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t === 'pending' && `待修复 (${suggestions.filter(s => !s.fixed).length})`}
                    {t === 'fixed' && `已修复 (${suggestions.filter(s => s.fixed).length})`}
                    {t === 'history' && `修改日志`}
                    {tab === t && <motion.div layoutId="tabLine" className="absolute -bottom-px left-0 right-0 h-0.5 bg-brand-500" />}
                  </button>
                ))}
              </div>
              {tab === 'history' ? (
                <div className="space-y-2">
                  {history.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无操作记录</p> :
                    history.map((h, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                          style={{ background: h.type === 'fix' ? '#D1FAE5' : h.type === 'upload' ? '#DBEAFE' : h.type === 'analyze' ? '#FEF3C7' : h.type === 'export' ? '#EDE9FE' : '#DCFCE7' }}>
                          {h.type === 'fix' && <Check className="w-4 h-4 text-emerald-600" />}
                          {h.type === 'upload' && <FileText className="w-4 h-4 text-blue-600" />}
                          {h.type === 'analyze' && <Zap className="w-4 h-4 text-amber-600" />}
                          {h.type === 'export' && <FileDown className="w-4 h-4 text-violet-600" />}
                          {h.type === 'apply' && <Sparkles className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="flex-1 min-w-0"><p className="text-sm text-gray-700">{h.action}</p><p className="text-xs text-gray-400 mt-0.5 font-mono">{h.time}</p></div>
                        {h.delta && <span className="text-sm font-bold text-emerald-500 shrink-0">+{h.delta}</span>}
                      </motion.div>
                    ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const list = suggestions.filter(s => tab === 'pending' ? !s.fixed : s.fixed);
                    if (list.length === 0) return <p className="text-sm text-gray-400 text-center py-8">{tab === 'pending' ? '🎉 所有建议已修复！' : '暂无已修复项目'}</p>;
                    return list.map((s, i) => (
                      <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-md shrink-0 ${priorityBg[s.priority]}`}>{s.priority}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                              <span className={`px-2 py-0.5 text-xs rounded-md border ${categoryBg[s.category]}`}>{s.category}</span>
                              {s.fixed && s.fixedAt && <span className="text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded"><Check className="w-3 h-3" /> ✓ {s.fixedAt} 已修复</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                            {s.before && s.after && (
                              <>
                                <button onClick={() => setShowDetail({ ...showDetail, [s.id]: !showDetail[s.id] })} className="mt-2 text-xs text-brand-600 flex items-center gap-1 hover:text-brand-700">
                                  {showDetail[s.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  {showDetail[s.id] ? '收起对比' : 'BEFORE / AFTER 对比'}
                                </button>
                                <AnimatePresence>
                                  {showDetail[s.id] && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2.5 bg-red-50 rounded-lg border border-red-100"><p className="text-red-400 font-medium mb-1 flex items-center gap-1">✗ 优化前</p><p className="text-red-600 line-through decoration-red-400 decoration-2">{s.before}</p></div>
                                        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100"><p className="text-emerald-500 font-medium mb-1 flex items-center gap-1">✓ 优化后</p><p className="text-emerald-700 font-semibold">{s.after}</p></div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </>
                            )}
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              {!s.fixed ? (
                                <button onClick={() => handleFix(s.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg font-medium transition-colors">
                                  <Check className="w-3.5 h-3.5" /> 标记已修复
                                </button>
                              ) : (
                                <button onClick={() => handleUnfix(s.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg font-medium transition-colors">
                                  撤销修复
                                </button>
                              )}
                              <button onClick={() => locateSection(s.sectionRef)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-gray-600 text-xs rounded-lg font-medium transition-colors">
                                <Target className="w-3.5 h-3.5 text-brand-500" /> 在原文中定位
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ));
                  })()}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <button onClick={() => setDiffOpen(o => !o)} className="w-full flex items-center justify-between mb-0">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-500" /> 🆚 对比视图</h3>
                {diffOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              <AnimatePresence>
                {diffOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                          {(['动词', '量化', '排版'] as const).map(g => (
                            <button key={g} onClick={() => setCompareGroup(g)} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${compareGroup === g ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{g}</button>
                          ))}
                        </div>
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                          <button onClick={() => setDiffMode('side')} className={`px-3 py-1 text-xs rounded-md transition-colors ${diffMode === 'side' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}>并排</button>
                          <button onClick={() => setDiffMode('inline')} className={`px-3 py-1 text-xs rounded-md transition-colors ${diffMode === 'inline' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}>内联</button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {compareList.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无该类型的对比示例（修复后将移入已修复）</p> :
                          compareList.map((c, i) => (
                            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`p-4 bg-gray-50 rounded-xl ${diffMode === 'side' ? 'grid grid-cols-2 gap-4' : ''}`}>
                              {diffMode === 'side' ? (
                                <>
                                  <div><p className="text-xs font-medium text-gray-400 mb-2">优化前（红色删除线）</p><p className="text-sm text-gray-600 line-through decoration-red-400 decoration-2">{c.before}</p></div>
                                  <div><p className="text-xs font-medium text-emerald-500 mb-2">优化后（绿色加粗）</p><p className="text-sm text-emerald-700 font-semibold">{c.after}</p></div>
                                </>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2"><span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded shrink-0 font-bold">前</span><p className="text-sm text-gray-600 line-through decoration-red-400 decoration-2">{c.before}</p></div>
                                  <div className="flex items-start gap-2"><span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded shrink-0 font-bold">后</span><p className="text-sm text-emerald-700 font-semibold">{c.after}</p></div>
                                </div>
                              )}
                              <div className={diffMode === 'side' ? 'col-span-2 mt-2 pt-2 border-t border-gray-200' : 'mt-2 pt-2 border-t border-gray-200'}>
                                <button onClick={() => locateSection(c.sectionRef)} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                                  <ListChecks className="w-3 h-3" /> 对应建议链接 → 「{c.title.slice(0, 12)}」
                                </button>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="sticky bottom-4 z-20">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{stats.fixed}</span> / {stats.total} 项已修复 · 评分进度 <span className="font-bold text-brand-600">{stats.current}</span> → <span className="font-bold text-emerald-600">{stats.projected}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                      <FileDown className="w-4 h-4" /> 📥 导出完整分析报告
                    </button>
                    <button onClick={handleApplyAll} disabled={applying}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white shadow-lg transition-all text-sm ${applying ? 'bg-brand-400 cursor-wait' : 'bg-gradient-to-r from-brand-500 to-emerald-500 hover:shadow-xl hover:scale-[1.02]'}`}>
                      {applying ? <><Loader2 className="w-4 h-4 animate-spin" /> 应用{stats.total}项优化... 生成v2快照...</> :
                        <><Zap className="w-4 h-4" /> ⚡ 一键应用所有优化并跳转编辑器</>}
                    </button>
                    <button onClick={() => navigate('/editor/resume-1')} className="flex items-center gap-1 px-4 py-2.5 text-brand-600 hover:text-brand-700 text-sm font-medium">
                      <Edit3 className="w-4 h-4" /> 仅跳转 <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
