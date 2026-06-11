import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, FileText, RotateCcw, Zap, Layout, Check, X, ArrowRight, Clock, History, MessageSquare, BookOpen, ChevronRight, Eye, EyeOff, Undo2, Archive } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useResumeStore } from '@/stores/resumeStore';
import type { Resume } from '@/types/resume';
import type { ChatMessage } from '@/types/chat';

const termList = [
  { o: '做了', e: '主导推进', b: 'ATS关键词命中 +1' },
  { o: '负责', e: '牵头负责', b: '行业专业度提升' },
  { o: '配合', e: '跨部门协作', b: '软技能关键词命中' },
  { o: '参与', e: '深度参与', b: '核心贡献权重提升' },
  { o: '用了React', e: '基于React 18 + TypeScript构建', b: '技术栈精确匹配 +2' },
  { o: '优化', e: '系统性优化', b: '方法论关键词命中' },
  { o: '开发', e: '工程化开发', b: '架构能力体现' },
  { o: '完成', e: '高质量交付', b: '结果导向加分' },
  { o: '提升', e: '显著提升', b: '量化效果暗示' },
  { o: '解决', e: '创新性解决', b: '创造力关键词命中' },
];

const starData = {
  original: '负责飞书文档编辑器的开发工作，优化了加载性能，提升了用户体验。',
  star: { s: '飞书文档编辑器首屏加载耗时3.2秒，严重影响用户留存与编辑体验', t: '作为核心模块负责人，主导编辑器渲染链路全面重构', a: '引入虚拟滚动与增量渲染机制，重构SSR数据预取流程，实现关键资源预加载策略', r: '首屏加载时间从3.2s降至0.8s（提升75%），用户留存率提升23%，获季度技术突破奖' },
};

interface ChangeLog {
  id: string; time: string; type: 'chat' | 'term' | 'star' | 'ats';
  icon: string; desc: string; detail?: { before: string; after: string };
}

interface HistorySession {
  id: string; title: string; msgCount: number; version: string; time: string;
  resume: Resume; messages: ChatMessage[];
}

function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>);
}

function renderEnhanced(text: string, activeSet: Set<string>) {
  let result = text;
  termList.forEach(({ o, e }) => { if (activeSet.has(o) && result.includes(o)) result = result.split(o).join(`<H>${e}</H>`); });
  return result.split(/(<H>.*?<\/H>)/g).map((p, i) => p.startsWith('<H>') && p.endsWith('</H>') ? <mark key={i} className="bg-brand-500/20 text-brand-700 px-0.5 rounded font-semibold">{p.slice(3, -4)}</mark> : <span key={i}>{p}</span>);
}

function TypingIndicator() {
  return (<div className="flex items-start gap-3 mb-4"><div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-brand-500" /></div><div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm"><div className="flex gap-1.5">{[0, 1, 2].map(i => (<motion.span key={i} className="w-2 h-2 rounded-full bg-brand-500" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />))}</div></div></div>);
}

function Tag({ type, text }: { type: string; text: string }) {
  const icons: Record<string, string> = { chat: '💬', term: '📚', star: '⭐' };
  return (<span className="group relative inline-flex items-center gap-1 text-[10px] text-surface-300 ml-1 align-middle"><span>{icons[type]}</span><span className="hidden group-hover:inline-flex absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap bg-brand-900 text-white text-[10px] px-2 py-1 rounded z-10">{text}</span></span>);
}

type VLabel = 'v1 初始' | 'v2 对话修改' | 'v3 术语强化';
type Tab = 'changes' | 'history';

export default function Create() {
  const { messages, isTyping, sendMessage, clearMessages } = useChatStore();
  const { resume, setResume, updateItem } = useResumeStore();
  const [input, setInput] = useState('');
  const [showStar, setShowStar] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [showTermDiff, setShowTermDiff] = useState(false);
  const [isAtsMode, setIsAtsMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [currentVer, setCurrentVer] = useState(0);
  const [verSnaps, setVerSnaps] = useState<Resume[]>([]);
  const [activeTerms, setActiveTerms] = useState<Set<string>>(new Set(termList.map(t => t.o)));
  const [showAttr, setShowAttr] = useState(true);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [sidebarTab, setSidebarTab] = useState<Tab>('changes');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isTyping]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); } }, [toast]);
  useEffect(() => { if (verSnaps.length === 0) setVerSnaps([JSON.parse(JSON.stringify(resume))]); }, []);

  const addLog = (l: Omit<ChangeLog, 'id' | 'time'>) => setChangeLogs(p => [{ ...l, id: `log-${Date.now()}`, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }, ...p].slice(0, 20));
  const showToast = (m: string) => setToast(m);
  const saveVer = (label: VLabel) => { setVerSnaps(p => [...p, JSON.parse(JSON.stringify(resume))]); setCurrentVer(verSnaps.length); showToast(`${label} 已保存`); };
  const restoreVer = (i: number) => { if (verSnaps[i]) { setResume(verSnaps[i]); setCurrentVer(i); showToast(`已恢复至 v${i + 1}`); } };

  const applyChatToResume = (content: string) => {
    let changed = false;
    const expSec = resume.sections.find(s => s.type === 'experience');
    let oldPos = '', newPos = '';
    if ((content.includes('前端') || content.includes('工程师') || content.includes('产品')) && expSec?.items[0]) {
      oldPos = expSec.items[0].fields.position as string;
      newPos = content.includes('产品') ? '高级产品经理' : content.includes('架构') ? '前端架构师' : '高级前端工程师';
      updateItem(expSec.id, expSec.items[0].id, { position: newPos }); changed = true;
    }
    if (changed) {
      if (currentVer < 1) saveVer('v2 对话修改');
      addLog({ type: 'chat', icon: '💬', desc: `用户发送消息「${content.slice(0, 15)}${content.length > 15 ? '...' : ''}」→ 更新职位为「${newPos}」`, detail: { before: oldPos, after: newPos } });
    }
  };

  const handleSend = () => { const t = input.trim(); if (!t || isTyping) return; applyChatToResume(t); sendMessage(t); setInput(''); };
  const handleReset = () => setShowConfirm(true);
  const confirmNewSession = () => {
    const exp = resume.sections.find(s => s.type === 'experience');
    setSessions(p => [{
      id: `sess-${Date.now()}`, title: exp?.items[0]?.fields.position as string || '未命名会话',
      msgCount: messages.length, version: `v${currentVer + 1}`, time: new Date().toLocaleString('zh-CN'),
      resume: JSON.parse(JSON.stringify(resume)), messages: [...messages],
    }, ...p]);
    clearMessages(); if (verSnaps[0]) { setResume(verSnaps[0]); setCurrentVer(0); }
    setIsEnhanced(false); setShowTermDiff(false); setIsAtsMode(false); setChangeLogs([]); setActiveTerms(new Set(termList.map(t => t.o)));
    setShowConfirm(false); showToast('已归档并开启新会话');
  };
  const restoreSession = (s: HistorySession) => {
    setResume(s.resume); clearMessages(); s.messages.forEach(m => useChatStore.getState().addMessage({ role: m.role, content: m.content }));
    setCurrentVer(0); setShowHistory(false); showToast(`已恢复会话：${s.title}`);
  };
  const handleEnhance = () => {
    setIsEnhanced(!isEnhanced);
    if (!isEnhanced) { setShowTermDiff(true); if (currentVer < 2) saveVer('v3 术语强化'); addLog({ type: 'term', icon: '📚', desc: `点击术语强化 → 替换 ${activeTerms.size} 个弱动词，新增 12 个行业关键词` }); }
    else setShowTermDiff(false);
  };
  const toggleTerm = (o: string) => setActiveTerms(p => { const n = new Set(p); if (n.has(o)) n.delete(o); else n.add(o); return n; });
  const handleStar = () => { if (!showStar) addLog({ type: 'star', icon: '⭐', desc: '点击STAR改写 → 重写 2 条工作经历描述', detail: { before: starData.original, after: starData.star.r } }); setShowStar(!showStar); };
  const handleAts = () => { if (!isAtsMode) addLog({ type: 'ats', icon: '📄', desc: '开启ATS排版模式 → 应用ATS兼容样式' }); setIsAtsMode(!isAtsMode); };
  const undoLog = (id: string) => { setChangeLogs(p => p.filter(l => l.id !== id)); showToast('已撤销此步'); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const sections = resume.sections.slice().sort((a, b) => a.order - b.order);
  const summarySec = sections.find(s => s.type === 'summary');
  const expSec = sections.find(s => s.type === 'experience');
  const projSec = sections.find(s => s.type === 'project');
  const eduSec = sections.find(s => s.type === 'education');
  const skillSec = sections.find(s => s.type === 'skill');
  const summary = (summarySec?.items[0]?.fields?.content as string) || '';
  const name = '张明远';
  const title = expSec?.items[0]?.fields?.position || '高级前端工程师';
  const bCls = isAtsMode ? 'border-l-2 border-dashed border-gray-400' : 'border-l-2 border-brand-500';
  const tCls = isAtsMode ? 'text-black font-sans' : 'text-brand-900 font-display';
  const boCls = isAtsMode ? 'text-gray-800 font-sans' : 'text-brand-800';
  const rTxt = (t: string) => isEnhanced ? renderEnhanced(t, activeTerms) : t;
  const vBadges: VLabel[] = ['v1 初始', 'v2 对话修改', 'v3 术语强化'];
  const atsBefore = 62, atsAfter = 79;

  return (<div className="flex h-screen relative overflow-hidden">
    <AnimatePresence>{toast && (<motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-brand-900 text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2"><Check className="w-4 h-4 text-brand-400" />{toast}</motion.div>)}</AnimatePresence>

    <AnimatePresence>{showConfirm && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl p-6 w-[380px]"><h3 className="font-display text-lg font-bold text-brand-900 mb-2">开启新会话？</h3><p className="text-sm text-surface-500 mb-5">当前对话和简历修改记录将被归档，可在历史会话中恢复。</p><div className="flex gap-2 justify-end"><button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm text-surface-500 hover:bg-surface-50 rounded-lg">取消</button><button onClick={confirmNewSession} className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-1.5"><Archive className="w-3.5 h-3.5" />开始新会话</button></div></motion.div></motion.div>)}</AnimatePresence>

    <AnimatePresence>{showHistory && (<motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed left-0 top-0 bottom-0 w-[340px] z-40 bg-white border-r border-surface-200 shadow-2xl flex flex-col"><div className="flex items-center justify-between px-5 py-4 border-b border-surface-200"><h3 className="font-display font-bold text-brand-900 flex items-center gap-2"><History className="w-4 h-4 text-brand-500" />历史会话</h3><button onClick={() => setShowHistory(false)} className="text-surface-300 hover:text-brand-700"><X className="w-4 h-4" /></button></div><div className="flex-1 overflow-y-auto p-4 space-y-2">{sessions.length === 0 && <p className="text-center text-sm text-surface-300 py-10">暂无历史会话</p>}{sessions.map((s, i) => (<motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="p-3 bg-surface-50 rounded-xl border border-surface-100 hover:border-brand-200 cursor-pointer transition-colors" onClick={() => restoreSession(s)}><div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-brand-900">{s.title}</p><span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">{s.version}</span></div><div className="flex items-center gap-3 text-xs text-surface-400"><span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{s.msgCount}条消息</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.time.slice(5, 16)}</span></div></motion.div>))}</div></motion.div>)}</AnimatePresence>

    <div className="w-[38%] flex flex-col border-r border-surface-200 bg-white">
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200">
        <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-500" /><h2 className="font-display text-lg font-bold text-brand-900">AI对话创作</h2></div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowHistory(true)} className="btn-ghost p-2 text-surface-400 hover:text-brand-600" title="历史会话"><History className="w-4 h-4" /></button>
          <button onClick={handleReset} className="btn-ghost flex items-center gap-1.5 text-sm"><RotateCcw className="w-3.5 h-3.5" />新对话</button>
        </div>
      </div>
      <div className="flex border-b border-surface-100 px-3"><button onClick={() => setSidebarTab('changes')} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${sidebarTab === 'changes' ? 'border-brand-500 text-brand-700' : 'border-transparent text-surface-400'}`}>修改记录</button><button onClick={() => setSidebarTab('history')} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${sidebarTab === 'history' ? 'border-brand-500 text-brand-700' : 'border-transparent text-surface-400'}`}>版本快照</button></div>
      {sidebarTab === 'changes' ? (<div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">{changeLogs.length === 0 ? (<p className="text-center text-xs text-surface-300 py-8 flex flex-col items-center gap-2"><BookOpen className="w-6 h-6" />暂无修改记录<br />开始对话或使用优化功能</p>) : changeLogs.map((l, i) => (<motion.div key={l.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="relative"><div className="flex gap-3"><div className="flex flex-col items-center"><span className="w-7 h-7 rounded-full bg-surface-50 border border-surface-200 flex items-center justify-center text-sm">{l.icon}</span>{i < changeLogs.length - 1 && <div className="w-px flex-1 bg-surface-100 my-1" />}</div><div className="flex-1 pb-3"><div className="flex items-start justify-between gap-2"><div className="flex-1"><p className="text-xs font-medium text-brand-900">{l.desc}</p><p className="text-[10px] text-surface-300 mt-0.5">{l.time}</p></div><button onClick={() => undoLog(l.id)} className="text-surface-300 hover:text-brand-600 p-0.5 flex-shrink-0" title="撤销此步"><Undo2 className="w-3 h-3" /></button></div>{l.detail && (<button onClick={() => setExpandedLog(expandedLog === l.id ? null : l.id)} className="mt-1 text-[10px] text-brand-500 flex items-center gap-0.5">查看差异<ChevronRight className={`w-3 h-3 transition-transform ${expandedLog === l.id ? 'rotate-90' : ''}`} /></button>)}{expandedLog === l.id && l.detail && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 p-2 bg-surface-50 rounded-lg text-[11px] space-y-1"><p className="text-surface-400 line-through">修改前: {l.detail.before}</p><p className="text-brand-700">修改后: {l.detail.after}</p></motion.div>)}</div></div></motion.div>))}</div>) : (<div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">{vBadges.slice(0, Math.max(1, currentVer + 1)).map((label, i) => (<button key={i} onClick={() => restoreVer(i)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${currentVer === i ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-surface-50 text-surface-500 hover:bg-surface-100 border border-transparent'}`}><div className="flex items-center justify-between"><span className="font-medium">{label}</span>{currentVer === i && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">当前</span>}</div></button>))}</div>)}
      <div ref={scrollRef} className="max-h-[45%] overflow-y-auto px-5 py-3 space-y-1 border-t border-surface-100 bg-surface-50/50">
        {messages.map(m => (<div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>{m.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mr-2.5 mt-1"><Sparkles className="w-3.5 h-3.5 text-brand-500" /></div>}<div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand-900 text-white rounded-2xl rounded-br-sm' : 'bg-white text-brand-900 rounded-2xl rounded-bl-sm shadow-sm border border-surface-100'}`}>{renderBold(m.content)}</div></div>))}
        {isTyping && <TypingIndicator />}
      </div>
      <div className="px-5 py-3 border-t border-surface-200"><div className="flex items-center gap-2 bg-surface-50 rounded-xl px-4 py-2 border border-surface-200 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="描述您的职业背景、项目经历..." className="flex-1 bg-transparent outline-none text-sm text-brand-900 placeholder:text-surface-300" /><button onClick={handleSend} disabled={!input.trim() || isTyping} className="w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-surface-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"><Send className="w-4 h-4 text-white" /></button></div></div>
    </div>

    <div className="flex-1 flex flex-col bg-surface-50 relative">
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200 bg-white">
        <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-brand-500" /><h2 className="font-display text-lg font-bold text-brand-900">实时简历预览</h2></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAttr(!showAttr)} className={`btn-ghost text-xs flex items-center gap-1 ${showAttr ? 'bg-brand-50 text-brand-700' : ''}`}>{showAttr ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}生成依据</button>
          <button onClick={handleStar} className={`btn-ghost text-xs flex items-center gap-1 ${showStar ? 'bg-brand-50 text-brand-700' : ''}`}><RotateCcw className="w-3 h-3" />STAR重写</button>
          <button onClick={handleEnhance} className={`btn-ghost text-xs flex items-center gap-1 ${isEnhanced ? 'bg-brand-50 text-brand-700' : ''}`}>{isEnhanced ? <Check className="w-3 h-3" /> : <Zap className="w-3 h-3" />}{isEnhanced ? '已强化' : '术语强化'}</button>
          <button onClick={handleAts} className={`btn-ghost text-xs flex items-center gap-1 ${isAtsMode ? 'bg-gray-100 text-gray-800' : ''}`}><Layout className="w-3 h-3" />ATS排版</button>
        </div>
      </div>
      <div className="px-5 py-2 flex items-center gap-2 bg-white border-b border-surface-100">
        <span className="text-xs text-surface-300 font-medium">版本：</span>
        {vBadges.slice(0, Math.max(1, currentVer + 1)).map((label, i) => (<button key={i} onClick={() => restoreVer(i)} className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all ${currentVer === i ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}>{label}</button>))}
        {isAtsMode && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-medium">ATS友好模式已启用</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className={`mx-auto max-w-[620px] ${isAtsMode ? 'bg-white border-2 border-gray-300' : 'bg-white rounded-lg shadow-lg'} resume-preview`} style={{ aspectRatio: '210/297' }}>
          <div className="p-7 h-full flex flex-col">
            <div className="text-center mb-4">
              <h1 className={`${isAtsMode ? 'font-sans text-black' : 'font-display text-brand-900'} text-2xl font-bold tracking-wide`}>{name}</h1>
              <p className={`mt-1 text-sm font-medium ${isAtsMode ? 'text-gray-700 font-sans' : 'text-brand-600'}`}>{title}{showAttr && <Tag type="chat" text="来自对话消息: 「我是3年前端工程师...」" />}</p>
              <div className={`mt-3 h-[2px] ${isAtsMode ? 'bg-gray-400' : 'bg-gradient-to-r from-transparent via-brand-500 to-transparent'}`} />
            </div>
            <div className={`flex-1 space-y-3 text-[12px] overflow-hidden ${boCls}`}>
              {summarySec && <div className={`${bCls} pl-3`}><h3 className={`${tCls} font-bold text-sm mb-1`}>{summarySec.title}</h3><p className="leading-relaxed">{rTxt(summary)}{showAttr && isEnhanced && <Tag type="term" text="来自术语强化" />}</p></div>}
              {expSec && <div className={`${bCls} pl-3`}><h3 className={`${tCls} font-bold text-sm mb-1`}>{expSec.title}</h3>
                {expSec.items.map(it => (<div key={it.id} className="mb-2.5 last:mb-0">
                  <div className="flex justify-between items-baseline"><span className={`font-semibold ${isAtsMode ? 'text-black' : 'text-brand-900'}`}>{it.fields.company as string}</span><span className={`text-[11px] font-mono ${isAtsMode ? 'text-gray-600' : 'text-brand-600'}`}>{it.fields.period as string}</span></div>
                  <p className={`text-[11px] mb-0.5 ${isAtsMode ? 'text-gray-700' : 'text-brand-700'}`}>{it.fields.position as string}</p>
                  <p className="leading-relaxed">{rTxt(it.fields.description as string)}{showAttr && it.starRewrite && <Tag type="star" text="来自STAR法则改写" />}</p>
                </div>))}</div>}
              {projSec && <div className={`${bCls} pl-3`}><h3 className={`${tCls} font-bold text-sm mb-1`}>{projSec.title}</h3>{projSec.items.map(it => (<div key={it.id}><span className={`font-semibold ${isAtsMode ? 'text-black' : 'text-brand-900'}`}>{it.fields.name as string}</span><p className="leading-relaxed mt-0.5">{rTxt(it.fields.description as string)}</p></div>))}</div>}
              {eduSec && <div className={`${bCls} pl-3`}><h3 className={`${tCls} font-bold text-sm mb-1`}>{eduSec.title}</h3>{eduSec.items.map(it => (<p key={it.id}>{(it.fields.school as string) + ' · ' + (it.fields.major as string) + ' · ' + (it.fields.degree as string) + '（' + (it.fields.period as string) + '）'}</p>))}</div>}
              {skillSec && <div className={`${bCls} pl-3`}><h3 className={`${tCls} font-bold text-sm mb-1`}>{skillSec.title}{showAttr && isEnhanced && <Tag type="term" text="来自术语强化" />}</h3><div className="flex flex-wrap gap-1.5">{skillSec.items.map(it => (<span key={it.id} className={`px-2 py-0.5 rounded text-[11px] font-medium ${isAtsMode ? 'bg-gray-100 text-gray-800 border border-gray-300' : 'bg-brand-50 text-brand-700'}`}>{it.fields.items as string}</span>))}</div></div>}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showStar && (<motion.div key="star" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 bg-white border-t border-surface-200 rounded-t-2xl shadow-2xl" style={{ maxHeight: '45%' }}><div className="px-6 py-4"><div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-brand-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />STAR法则重写</h3><button onClick={() => setShowStar(false)} className="text-surface-300 hover:text-brand-700"><X className="w-4 h-4" /></button></div><div className="grid grid-cols-2 gap-4 overflow-y-auto" style={{ maxHeight: 'calc(45vh - 80px)' }}><div className="bg-surface-50 rounded-xl p-4 border border-surface-200"><p className="text-xs font-semibold text-surface-300 uppercase tracking-wider mb-2">原始描述</p><p className="text-sm text-brand-800 leading-relaxed">{starData.original}</p></div><div className="bg-brand-50/50 rounded-xl p-4 border border-brand-200"><p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">STAR重写</p><div className="space-y-2 text-sm">{(['s', 't', 'a', 'r'] as const).map(k => (<div key={k}><span className="inline-block px-1.5 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded mr-1.5 uppercase">{k}</span><span className="text-brand-800 leading-relaxed">{starData.star[k]}</span></div>))}</div></div></div></div></motion.div>)}
        {showTermDiff && !showStar && (<motion.div key="term" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 bg-white border-t border-surface-200 rounded-t-2xl shadow-2xl" style={{ maxHeight: '48%' }}><div className="px-6 py-4"><div className="flex items-center justify-between mb-3"><h3 className="font-display font-bold text-brand-900 flex items-center gap-2"><Zap className="w-4 h-4 text-brand-500" />术语强化对比</h3><div className="flex items-center gap-3"><span className="text-xs text-brand-600 font-medium bg-brand-50 px-3 py-1 rounded-full">已强化 {activeTerms.size} 个关键词 · ATS覆盖率 {atsBefore}% → <strong className="text-brand-700">{atsAfter}%</strong></span><button onClick={() => setShowTermDiff(false)} className="text-surface-300 hover:text-brand-700"><X className="w-4 h-4" /></button></div></div><div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 'calc(48vh - 85px)' }}>{termList.map((t, i) => (<motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center rounded-lg p-2.5 border transition-all ${activeTerms.has(t.o) ? 'bg-surface-50 border-surface-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}><div><p className="text-[10px] text-surface-300 uppercase font-semibold mb-0.5">BEFORE</p><p className={`text-sm ${activeTerms.has(t.o) ? 'text-red-500 line-through decoration-red-400' : 'text-surface-400'}`}>{t.o}</p></div><div className="text-surface-300"><ArrowRight className="w-4 h-4" /></div><div><p className="text-[10px] text-brand-600 uppercase font-semibold mb-0.5">AFTER</p><p className={`text-sm font-semibold ${activeTerms.has(t.o) ? 'text-emerald-600' : 'text-surface-400'}`}>{t.e}</p></div><div className="flex flex-col items-end gap-1"><button onClick={() => toggleTerm(t.o)} className={`w-9 h-5 rounded-full transition-colors relative ${activeTerms.has(t.o) ? 'bg-brand-500' : 'bg-surface-200'}`}><motion.div animate={{ x: activeTerms.has(t.o) ? 18 : 2 }} className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow" /></button><p className="text-[10px] text-surface-400 text-right max-w-[130px] leading-tight">{t.b}</p></div></motion.div>))}</div></div></motion.div>)}
      </AnimatePresence>
    </div>
  </div>);
}
