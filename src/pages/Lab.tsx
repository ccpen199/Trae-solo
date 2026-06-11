import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle2, Loader2, FileText, Target, ArrowRight, Sparkles, FileDown, Edit3, ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Clock, Check, Eye, EyeOff, ListChecks } from 'lucide-react';

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
}

interface ParseSection {
  name: string;
  status: 'ok' | 'warn';
  summary: string;
  raw: string;
}

const ATS = [
  { label: '关键词匹配', score: 65, desc: '缺少12个行业核心关键词', color: 'from-amber-400 to-orange-500' },
  { label: '格式解析度', score: 82, desc: '表格/图片内容可能无法解析', color: 'from-emerald-400 to-teal-500' },
  { label: '排版结构化', score: 75, desc: '部分章节层级不清晰', color: 'from-sky-400 to-blue-500' },
  { label: '字符兼容性', score: 90, desc: '特殊字符可能乱码', color: 'from-violet-400 to-purple-500' },
];

const PARSE_SECTIONS: ParseSection[] = [
  { name: '基本信息', status: 'ok', summary: '张明远 / 高级前端工程师 / 上海', raw: '姓名：张明远\n职位：高级前端工程师\n城市：上海\n电话：138****8888\n邮箱：zhangmy@email.com\n工作年限：5年' },
  { name: '个人总结', status: 'ok', summary: '提取成功，84 字', raw: '5年前端开发经验，精通 React/Vue 技术栈，擅长大型 Web 应用架构设计与性能优化。曾主导多个千万级用户产品的前端重构，具备良好的团队协作能力和技术分享精神。' },
  { name: '工作经历', status: 'ok', summary: '2 条记录（字节跳动 + 美团）', raw: '【字节跳动】高级前端工程师 | 2022.03 - 至今\n负责抖音电商核心模块开发，主导性能优化项目...\n\n【美团】前端工程师 | 2020.06 - 2022.02\n参与外卖商家端系统建设，负责订单管理模块...' },
  { name: '项目经历', status: 'ok', summary: '1 条记录', raw: '【电商大促活动平台】技术负责人 | 2023.06 - 2023.11\n搭建跨端活动配置平台，支持可视化拖拽...' },
  { name: '教育背景', status: 'ok', summary: '1 条（北京大学 硕士）', raw: '北京大学 | 计算机科学与技术 | 硕士 | 2018.09 - 2020.06' },
  { name: '技能标签', status: 'ok', summary: '12 个关键词', raw: 'React, Vue, TypeScript, Node.js, Webpack, Vite, Redux, MobX, GraphQL, Docker, CI/CD, 性能优化' },
  { name: '专业证书', status: 'warn', summary: '未找到，建议补充', raw: '' },
];

const INITIAL_SUGGESTIONS: Suggestion[] = [
  { id: 's1', priority: '高', title: '弱动词"负责"出现5次', desc: '建议替换为更有冲击力的强动词', category: '动词', fixed: true, fixedAt: '14:42', before: '负责项目管理，推动项目进展', after: '主导5个核心项目，推动交付效率提升30%', compareType: '动词' },
  { id: 's2', priority: '高', title: '弱动词"参与"出现3次', desc: '建议替换为体现主导性的动词', category: '动词', fixed: true, fixedAt: '14:42', before: '参与团队建设和培训', after: '搭建12人跨职能团队，建立标准化培训体系', compareType: '动词' },
  { id: 's3', priority: '中', title: '弱动词"协助"出现2次', desc: '建议替换为体现贡献度的动词', category: '动词', fixed: true, fixedAt: '14:42', before: '协助完成产品上线', after: '引领产品从0到1上线，首月获客10万+', compareType: '动词' },
  { id: 's4', priority: '高', title: '缺少团队规模量化', desc: '补充管理团队人数，如"带领8人团队"', category: '量化', fixed: false },
  { id: 's5', priority: '中', title: '缺少预算金额描述', desc: '增加项目预算规模，如"负责500万预算项目"', category: '量化', fixed: false },
  { id: 's6', priority: '中', title: '技能分类混乱', desc: '按技术栈/软技能/工具分组展示', category: '排版', fixed: true, fixedAt: '14:43' },
  { id: 's7', priority: '低', title: '个人信息过长', desc: '建议精简至2-3行核心信息', category: '排版', fixed: false },
  { id: 's8', priority: '低', title: '页面留白不足', desc: '增加行间距和段落间距提升可读性', category: '排版', fixed: false },
];

const HISTORY_LOG = [
  { time: '14:40', action: '点击"试试示例简历？" → 开始分析', delta: null, icon: 'start' },
  { time: '14:41', action: '分析完成 · 发现 8 项可优化', delta: null, icon: 'done' },
  { time: '14:42', action: '一键替换弱动词 → 已修复 3 项', delta: '+8', icon: 'fix' },
  { time: '14:43', action: '标记"技能分类"为已修复 → 已修复 1 项', delta: '+3', icon: 'fix' },
];

const ANALYSIS_STEPS = ['OCR文字识别', '结构化信息提取', 'ATS兼容性检测', '动词强度分析', 'AI优化建议生成'];

const priorityColor: Record<Priority, string> = { '高': 'bg-red-100 text-red-600', '中': 'bg-amber-100 text-amber-600', '低': 'bg-sky-100 text-sky-600' };
const categoryColor: Record<Category, string> = { '动词': 'bg-purple-50 text-purple-600', '量化': 'bg-sky-50 text-sky-600', '排版': 'bg-violet-50 text-violet-600', 'ATS': 'bg-emerald-50 text-emerald-600' };

export default function Lab() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [activeFileName, setActiveFileName] = useState('');
  const [isSample, setIsSample] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ size: string; pages: number; time: string } | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(INITIAL_SUGGESTIONS);
  const [tab, setTab] = useState<SuggestionTab>('pending');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<Record<string, boolean>>({});
  const [diffMode, setDiffMode] = useState<DiffMode>('side');
  const [compareGroup, setCompareGroup] = useState<'动词' | '量化' | '排版'>('动词');

  useEffect(() => {
    if (step !== 'analyzing') return;
    const t = setTimeout(() => setStep('results'), 3000);
    return () => clearTimeout(t);
  }, [step]);

  const stats = useMemo(() => {
    const fixed = suggestions.filter(s => s.fixed).length;
    const total = suggestions.length;
    return { fixed, total, projectTo: 70 + fixed * 4 };
  }, [suggestions]);

  const triggerSample = () => {
    setIsSample(true);
    setActiveFileName('示例简历_张明远_5年前端.pdf');
    setFileInfo({ size: '247KB', pages: 2, time: '3.2s' });
    setSuggestions(INITIAL_SUGGESTIONS);
    setStep('analyzing');
  };

  const handleFix = (id: string) => setSuggestions(prev => prev.map(s => s.id === id ? { ...s, fixed: true, fixedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) } : s));

  const buildReport = (onlyPending = false) => {
    const pending = suggestions.filter(s => !s.fixed);
    const fixed = suggestions.filter(s => s.fixed);
    const L: string[] = [];
    L.push('========================================\n           简历优化分析报告\n========================================\n');
    L.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
    L.push(`文件名称: ${activeFileName || '未命名简历.pdf'}`);
    if (fileInfo) L.push(`页数: ${fileInfo.pages} 页 · 字符数: 1847 · 词数: 1205\n提取成功率: 96%`);
    L.push('');
    if (!onlyPending) {
      L.push('----------------------------------------\n          📄 解析内容明细\n----------------------------------------');
      PARSE_SECTIONS.forEach(sec => { L.push(`\n【${sec.name}】${sec.status === 'ok' ? '✓' : '⚠'} ${sec.summary}`); if (sec.raw) L.push(sec.raw); });
      L.push('');
    }
    L.push('----------------------------------------\n         ATS 综合兼容性评分: 70/100\n----------------------------------------\n');
    ATS.forEach(a => L.push(`  ${a.label}：${a.score}分 - ${a.desc}`));
    L.push('');
    if (!onlyPending) {
      L.push(`----------------------------------------\n          已修复 (${fixed.length})\n----------------------------------------`);
      fixed.forEach((s, i) => { L.push(`\n  ${i + 1}. [${s.priority}][${s.category}] ${s.title}\n     ${s.desc}`); if (s.fixedAt) L.push(`     修复时间: ${s.fixedAt}`); });
      L.push('');
    }
    L.push(`----------------------------------------\n          待修复 (${pending.length})\n----------------------------------------`);
    pending.forEach((s, i) => L.push(`\n  ${i + 1}. [${s.priority}][${s.category}] ${s.title}\n     ${s.desc}`));
    L.push(`\n预计修复后评分: ${stats.projectTo}/100\n`);
    L.push('========================================\n      本报告由 AI 简历实验室自动生成\n========================================');
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
  };

  const handleExport = (onlyPending = false) => downloadFile(buildReport(onlyPending), `简历分析报告_${onlyPending ? '待修复清单_' : ''}${Date.now()}.txt`);

  const compareList = useMemo(() => suggestions.filter(s => s.compareType === compareGroup && s.before && s.after), [compareGroup, suggestions]);

  return (
    <div className="min-h-full p-8">
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="up" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-8">
            <div className="relative w-full max-w-xl">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #00D68F 0.8px, transparent 0.8px)', backgroundSize: '24px 24px' }} />
              <button onClick={() => setStep('analyzing')} className="relative w-full py-16 border-2 border-dashed border-brand-300 rounded-3xl bg-white/70 backdrop-blur-sm flex flex-col items-center gap-4 cursor-pointer hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-lg transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Upload className="w-8 h-8 text-white" /></div>
                <div className="text-center"><p className="text-xl font-semibold text-gray-800">拖拽简历到此处</p><p className="text-sm text-gray-500 mt-1">或点击选择文件上传</p></div>
                <div className="flex items-center gap-2 text-xs text-gray-400"><FileText className="w-4 h-4" /><span>支持 PDF、DOCX 格式，最大 10MB</span></div>
              </button>
              <div className="flex justify-center mt-4"><button onClick={triggerSample} className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"><Sparkles className="w-4 h-4" /> 试试示例简历？</button></div>
            </div>
            <div className="w-full max-w-xl space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> 最近上传</h3>
              {[{ n: '产品经理_张三.pdf', d: '2024-01-15', s: 78 }, { n: '前端开发_李四.docx', d: '2024-01-10', s: 65 }].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-sm cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center"><FileText className="w-5 h-5 text-brand-500" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{f.n}</p><p className="text-xs text-gray-400">{f.d}</p></div>
                  <span className={`text-sm font-bold ${f.s >= 80 ? 'text-emerald-500' : f.s >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{f.s}分</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div key="an" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                <svg width="100" height="100" className="-rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="5" />
                  <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#00D68F" strokeWidth="5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 42} animate={{ strokeDashoffset: 0 }} transition={{ duration: 2.5, ease: 'linear' }} initial={{ strokeDashoffset: 2 * Math.PI * 42 }} />
                </svg>
                <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-brand-500 animate-spin" />
              </div>
              <p className="text-lg font-medium text-gray-700">正在深度分析简历...</p>
              <div className="flex flex-col gap-3 w-64">
                {ANALYSIS_STEPS.map((l, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {i < 2 ? <CheckCircle2 className="w-5 h-5 text-brand-500" /> : i === 2 ? <Loader2 className="w-5 h-5 text-brand-500 animate-spin" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-200" />}
                    <span className={`text-sm ${i <= 2 ? (i === 2 ? 'text-brand-500 font-medium' : 'text-brand-600') : 'text-gray-400'}`}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div key="res" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-5 pb-12">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex items-center justify-between">
              <button onClick={() => setStep('upload')} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-brand-600 bg-white hover:bg-brand-50 rounded-xl border border-gray-200 hover:border-brand-200 text-sm font-medium"><ArrowLeft className="w-4 h-4" /> 返回重新上传</button>
              {isSample && <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-xs font-medium flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> 示例简历</span>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-brand-500" /> 📄 简历解析报告</h3>
              <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
                <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center"><FileText className="w-5 h-5 text-brand-500" /></div><div><p className="text-xs text-gray-400">文件名</p><p className="text-sm font-medium text-gray-800">{activeFileName}</p></div></div>
                <div className="h-8 w-px bg-gray-200" />
                <div><p className="text-xs text-gray-400">页数</p><p className="text-sm font-medium text-gray-800">{fileInfo?.pages || 2} 页 · 字符数 1847 · 词数 1205</p></div>
                <div className="h-8 w-px bg-gray-200" />
                <div><p className="text-xs text-gray-400">提取成功率</p><p className="text-sm font-bold text-emerald-600">96% <span className="text-xs text-amber-500 font-normal">（2 sections 警告）</span></p></div>
              </div>
              <div className="space-y-2">
                {PARSE_SECTIONS.map(sec => (
                  <div key={sec.name} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedSection(expandedSection === sec.name ? null : sec.name)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left">
                      {sec.status === 'ok' ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
                      <span className="text-sm font-medium text-gray-700 flex-1">{sec.name}</span>
                      <span className={`text-xs ${sec.status === 'ok' ? 'text-gray-500' : 'text-amber-600'}`}>{sec.summary}</span>
                      {expandedSection === sec.name ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    <AnimatePresence>
                      {expandedSection === sec.name && sec.raw && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-3 pb-3"><pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-mono">{sec.raw}</pre></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-gradient-to-br from-brand-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">ATS 综合兼容性评分</p>
                  <div className="flex items-baseline gap-2 mt-1"><motion.span className="text-5xl font-bold" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }}>70</motion.span><span className="text-2xl text-white/60">/100</span></div>
                  <p className="text-white/80 mt-2 text-sm">已修复 {stats.fixed}/{stats.total} 项 · 预计可提升至 <span className="font-bold text-white">{stats.projectTo}</span> 分</p>
                </div>
                <Target className="w-12 h-12 text-white/50" />
              </div>
              <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden"><motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${(stats.fixed / stats.total) * 100}%` }} transition={{ duration: 0.8, delay: 0.4 }} /></div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1 mb-4 border-b border-gray-100 -mx-5 px-5">
                {(['pending', 'fixed', 'history'] as SuggestionTab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-medium transition-colors relative ${tab === t ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t === 'pending' && `待修复 (${suggestions.filter(s => !s.fixed).length})`}
                    {t === 'fixed' && `已修复 (${suggestions.filter(s => s.fixed).length})`}
                    {t === 'history' && `修改记录`}
                    {tab === t && <motion.div layoutId="tabLine" className="absolute -bottom-px left-0 right-0 h-0.5 bg-brand-500" />}
                  </button>
                ))}
              </div>
              {tab === 'history' ? (
                <div className="space-y-3">
                  {HISTORY_LOG.map((h, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">{h.icon === 'fix' ? <Check className="w-4 h-4 text-brand-600" /> : <Sparkles className="w-4 h-4 text-brand-600" />}</div>
                      <div className="flex-1"><p className="text-sm text-gray-700">{h.action}</p><p className="text-xs text-gray-400 mt-0.5">{h.time}</p></div>
                      {h.delta && <span className="text-sm font-bold text-emerald-500">{h.delta}</span>}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestions.filter(s => tab === 'pending' ? !s.fixed : s.fixed).map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md shrink-0 ${priorityColor[s.priority]}`}>{s.priority}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-800">{s.title}</p>
                            <span className={`px-2 py-0.5 text-xs rounded-md ${categoryColor[s.category]}`}>{s.category}</span>
                            {s.fixedAt && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> {s.fixedAt} 已修复</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                          {s.before && s.after && (
                            <button onClick={() => setShowDetail({ ...showDetail, [s.id]: !showDetail[s.id] })} className="mt-2 text-xs text-brand-600 flex items-center gap-1 hover:text-brand-700">
                              {showDetail[s.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {showDetail[s.id] ? '隐藏建议修改' : '显示建议修改'}
                            </button>
                          )}
                          <AnimatePresence>
                            {showDetail[s.id] && s.before && s.after && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                  <div className="p-2 bg-red-50 rounded-lg"><p className="text-red-400 font-medium mb-1">优化前</p><p className="text-red-600 line-through">{s.before}</p></div>
                                  <div className="p-2 bg-emerald-50 rounded-lg"><p className="text-emerald-500 font-medium mb-1">优化后</p><p className="text-emerald-700 font-medium">{s.after}</p></div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {!s.fixed && <button onClick={() => handleFix(s.id)} className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs rounded-lg font-medium transition-colors shrink-0">标记已修复</button>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-500" /> 优化前后对比</h2>
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    {(['动词', '量化', '排版'] as const).map(g => (
                      <button key={g} onClick={() => setCompareGroup(g)} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${compareGroup === g ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}>{g}</button>
                    ))}
                  </div>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => setDiffMode('side')} className={`px-2 py-1 text-xs rounded-md ${diffMode === 'side' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}>并排</button>
                    <button onClick={() => setDiffMode('inline')} className={`px-2 py-1 text-xs rounded-md ${diffMode === 'inline' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}>内联</button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {compareList.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无该类型的对比示例</p> : compareList.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`p-4 bg-gray-50 rounded-xl ${diffMode === 'side' ? 'grid grid-cols-2 gap-4' : ''}`}>
                    {diffMode === 'side' ? (
                      <>
                        <div><p className="text-xs font-medium text-gray-400 mb-2">优化前</p><p className="text-sm text-gray-500 line-through decoration-red-400 decoration-2">{c.before}</p></div>
                        <div><p className="text-xs font-medium text-emerald-500 mb-2">优化后</p><p className="text-sm text-emerald-600 font-medium">{c.after}</p></div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2"><span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded shrink-0">前</span><p className="text-sm text-gray-500 line-through decoration-red-400">{c.before}</p></div>
                        <div className="flex items-start gap-2"><span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded shrink-0">后</span><p className="text-sm text-emerald-600 font-medium">{c.after}</p></div>
                      </div>
                    )}
                    <div className={diffMode === 'side' ? 'col-span-2 mt-2 pt-2 border-t border-gray-200' : 'mt-2 pt-2 border-t border-gray-200'}>
                      <button className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"><ListChecks className="w-3 h-3" /> 查看在原文中的位置</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button onClick={() => { setApplying(true); setTimeout(() => { setApplying(false); setApplied(true); navigate('/editor/resume-1'); }, 2000); }}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-medium text-white shadow-lg transition-all ${applying ? 'bg-brand-400 cursor-wait' : applied ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-emerald-500 hover:shadow-xl hover:scale-[1.02]'}`}>
                {applying ? <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> 正在应用...</span> : applied ? '✓ 已应用所有优化' : '一键应用所有优化'}
              </button>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => handleExport(false)} className="flex-1 sm:flex-none px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"><FileDown className="w-4 h-4" /> 导出完整报告</button>
                <button onClick={() => handleExport(true)} className="flex-1 sm:flex-none px-5 py-3 bg-white border border-brand-200 text-brand-600 rounded-xl font-medium hover:bg-brand-50 flex items-center justify-center gap-2"><ListChecks className="w-4 h-4" /> 只导待修复</button>
              </div>
              <button onClick={() => navigate('/editor/resume-1')} className="w-full sm:w-auto px-6 py-3 text-brand-600 font-medium hover:text-brand-700 flex items-center justify-center gap-1"><Edit3 className="w-4 h-4" /> 去编辑器精修 <ArrowRight className="w-4 h-4" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
