import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, FileText, RotateCcw, Zap, Layout, Check, X, ArrowRight, Clock, History, MessageSquare, BookOpen, ChevronRight, Eye, EyeOff, Undo2, Archive, GitCompare, Star, BookMarked, Edit3, TrendingUp } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useResumeStore } from '@/stores/resumeStore';
import type { Resume } from '@/types/resume';

const termList = [
  { o: '做了', e: '主导推进' }, { o: '负责', e: '牵头负责' },
  { o: '配合', e: '跨部门协作' }, { o: '参与', e: '深度参与' },
  { o: '用了React', e: '基于React 18 + TypeScript构建' }, { o: '优化', e: '系统性优化' },
  { o: '开发', e: '工程化开发' }, { o: '完成', e: '高质量交付' },
  { o: '提升', e: '显著提升' }, { o: '解决', e: '创新性解决' },
];

interface FieldChange { field: string; before: string; after: string; }

interface HistoryEntry {
  id: string; timestamp: string;
  action: 'chat_message' | 'star_rewrite' | 'terminology' | 'ats_layout' | 'section_edit';
  actionLabel: string; iconType: 'chat' | 'star' | 'book' | 'ats' | 'edit';
  changes: FieldChange[]; deltaATS: number; snapshotId: string;
}

interface Snapshot {
  id: string; label: string; timestamp: string; trigger: string;
  resumeData: Resume; atsScore: number;
}

interface HistoricalSession {
  id: string; createdAt: string; title: string; messageCount: number;
  startPosition: string; snapshots: Snapshot[]; history: HistoryEntry[];
  messages: { role: 'user' | 'assistant'; content: string }[];
}

const iconMap: Record<string, any> = { chat: MessageSquare, star: Star, book: BookMarked, ats: Layout, edit: Edit3 };
const iconColorMap: Record<string, string> = { chat: 'text-blue-500', star: 'text-amber-500', book: 'text-purple-500', ats: 'text-emerald-500', edit: 'text-orange-500' };
const iconBgMap: Record<string, string> = { chat: 'bg-blue-50', star: 'bg-amber-50', book: 'bg-purple-50', ats: 'bg-emerald-50', edit: 'bg-orange-50' };

function genId(prefix = '') { return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function nowTime() { return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }
function cloneResume(r: Resume): Resume { return JSON.parse(JSON.stringify(r)); }
function renderBold(text: string) { return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>); }

function buildInitialSnapshots(baseResume: Resume): Snapshot[] {
  const r1 = cloneResume(baseResume);
  const r2 = cloneResume(baseResume);
  const exp2 = r2.sections.find(s => s.type === 'experience')!;
  exp2.items[0].fields.position = '高级前端工程师';
  exp2.items[0].fields.company = '字节跳动';
  const r3 = cloneResume(r2);
  const exp3 = r3.sections.find(s => s.type === 'experience')!;
  exp3.items[0].fields.description = exp3.items[0].starRewrite!.result;
  const r4 = cloneResume(r3);
  return [
    { id: 's-init', label: 'v1', timestamp: '09:12', trigger: '初始创建', resumeData: r1, atsScore: 62 },
    { id: 's-chat', label: 'v2', timestamp: '09:15', trigger: '对话: "想找前端工作"', resumeData: r2, atsScore: 67 },
    { id: 's-star', label: 'v3', timestamp: '09:18', trigger: 'STAR重写', resumeData: r3, atsScore: 75 },
    { id: 's-term', label: 'v4', timestamp: '09:22', trigger: '术语强化', resumeData: r4, atsScore: 79 },
  ];
}

function buildInitialHistory(): HistoryEntry[] {
  return [
    { id: 'h3', timestamp: '09:22', action: 'terminology', actionLabel: '术语强化', iconType: 'book', changes: termList.map(t => ({ field: '全局关键词', before: t.o, after: t.e })), deltaATS: 4, snapshotId: 's-term' },
    { id: 'h2', timestamp: '09:18', action: 'star_rewrite', actionLabel: 'STAR法则重写', iconType: 'star', changes: [{ field: '工作经历#1 描述', before: '负责抖音电商核心交易链路的前端架构设计与性能优化，主导微前端改造项目', after: '页面加载速度提升40%，交易转化率提升15%，开发效率提升30%，方案推广至5个业务线' }], deltaATS: 8, snapshotId: 's-star' },
    { id: 'h1', timestamp: '09:15', action: 'chat_message', actionLabel: '自然语言修改', iconType: 'chat', changes: [{ field: '职位', before: '高级前端工程师', after: '高级前端工程师' }, { field: '公司(最新)', before: '字节跳动', after: '字节跳动' }], deltaATS: 5, snapshotId: 's-chat' },
  ];
}

function buildHistoricalSessions(baseResume: Resume): HistoricalSession[] {
  const s1r1 = cloneResume(baseResume);
  const s1r2 = cloneResume(baseResume);
  s1r2.sections.find(s => s.type === 'experience')!.items[0].fields.position = '高级前端工程师';
  const s1r3 = cloneResume(s1r2);
  const s1r4 = cloneResume(s1r3);
  s1r4.sections.find(s => s.type === 'experience')!.items[0].fields.description = s1r4.sections.find(s => s.type === 'experience')!.items[0].starRewrite!.result;
  const s2r1 = cloneResume(baseResume);
  s2r1.sections.find(s => s.type === 'summary')!.items[0].fields.content = '3年互联网产品经验，擅长用户研究与数据驱动决策';
  const s2r2 = cloneResume(s2r1);
  const s2exp2 = s2r2.sections.find(s => s.type === 'experience')!;
  s2exp2.items[0].fields.position = '产品经理';
  s2exp2.items[0].fields.description = '负责抖音电商核心交易链路产品规划';
  return [
    { id: 'hs-1', createdAt: '2026-06-10 14:30', title: '3年前端工程师求职', messageCount: 8, startPosition: '高级前端工程师',
      snapshots: [
        { id: 'hs1-s1', label: 'v1', timestamp: '14:30', trigger: '初始创建', resumeData: s1r1, atsScore: 62 },
        { id: 'hs1-s2', label: 'v2', timestamp: '14:35', trigger: '对话修改', resumeData: s1r2, atsScore: 66 },
        { id: 'hs1-s3', label: 'v3', timestamp: '14:42', trigger: 'ATS排版', resumeData: s1r3, atsScore: 72 },
        { id: 'hs1-s4', label: 'v4', timestamp: '14:50', trigger: 'STAR重写', resumeData: s1r4, atsScore: 79 },
      ],
      history: [
        { id: 'hs1-h3', timestamp: '14:50', action: 'star_rewrite', actionLabel: 'STAR重写', iconType: 'star', changes: [{ field: '工作经历描述', before: '负责架构...', after: '加载40%...' }], deltaATS: 7, snapshotId: 'hs1-s4' },
        { id: 'hs1-h2', timestamp: '14:42', action: 'ats_layout', actionLabel: 'ATS排版优化', iconType: 'ats', changes: [{ field: '全局配色', before: '品牌绿', after: '纯黑白' }, { field: '字体', before: '衬线体', after: '无衬线' }, { field: '分隔线', before: '实线', after: '虚线' }], deltaATS: 6, snapshotId: 'hs1-s3' },
        { id: 'hs1-h1', timestamp: '14:35', action: 'chat_message', actionLabel: '对话修改职位', iconType: 'chat', changes: [{ field: '职位', before: '高级前端工程师', after: '高级前端工程师' }], deltaATS: 4, snapshotId: 'hs1-s2' },
      ],
      messages: [{ role: 'user', content: '我是3年前端工程师，想找大厂工作' }, { role: 'assistant', content: '好的，我来帮您优化简历...' }],
    },
    { id: 'hs-2', createdAt: '2026-06-08 10:15', title: '产品经理转行', messageCount: 12, startPosition: '产品经理',
      snapshots: [
        { id: 'hs2-s1', label: 'v1', timestamp: '10:15', trigger: '初始创建', resumeData: s2r1, atsScore: 58 },
        { id: 'hs2-s2', label: 'v2', timestamp: '10:22', trigger: '对话修改', resumeData: s2r2, atsScore: 62 },
        { id: 'hs2-s3', label: 'v3', timestamp: '10:30', trigger: '术语强化', resumeData: cloneResume(s2r2), atsScore: 67 },
        { id: 'hs2-s4', label: 'v4', timestamp: '10:38', trigger: 'STAR重写', resumeData: cloneResume(s2r2), atsScore: 71 },
        { id: 'hs2-s5', label: 'v5', timestamp: '10:45', trigger: 'ATS排版', resumeData: cloneResume(s2r2), atsScore: 74 },
        { id: 'hs2-s6', label: 'v6', timestamp: '10:52', trigger: '对话补充项目', resumeData: cloneResume(s2r2), atsScore: 76 },
      ],
      history: [
        { id: 'hs2-h5', timestamp: '10:52', action: 'chat_message', actionLabel: '补充项目经历', iconType: 'chat', changes: [{ field: '项目', before: '1个', after: '3个' }], deltaATS: 2, snapshotId: 'hs2-s6' },
        { id: 'hs2-h4', timestamp: '10:45', action: 'ats_layout', actionLabel: 'ATS排版', iconType: 'ats', changes: [{ field: '排版', before: '默认', after: 'ATS优化' }], deltaATS: 3, snapshotId: 'hs2-s5' },
        { id: 'hs2-h3', timestamp: '10:38', action: 'star_rewrite', actionLabel: 'STAR重写', iconType: 'star', changes: [{ field: '工作经历', before: '负责产品规划', after: '用户增长30%' }], deltaATS: 4, snapshotId: 'hs2-s4' },
        { id: 'hs2-h2', timestamp: '10:30', action: 'terminology', actionLabel: '术语强化', iconType: 'book', changes: termList.slice(0, 6).map(t => ({ field: '关键词', before: t.o, after: t.e })), deltaATS: 5, snapshotId: 'hs2-s3' },
        { id: 'hs2-h1', timestamp: '10:22', action: 'chat_message', actionLabel: '对话修改', iconType: 'chat', changes: [{ field: '职位方向', before: '前端工程师', after: '产品经理' }], deltaATS: 4, snapshotId: 'hs2-s2' },
      ],
      messages: [{ role: 'user', content: '我想转产品经理方向' }, { role: 'assistant', content: '好的，我帮您调整简历方向...' }],
    },
  ];
}

type Tab = 'changes' | 'versions';

function createInitialState(resume: Resume) {
  const snapshots = buildInitialSnapshots(resume);
  return { snapshots, history: buildInitialHistory(), currentSnapshotId: snapshots[snapshots.length - 1].id, historicalSessions: buildHistoricalSessions(resume) };
}

export default function Create() {
  const { messages, isTyping, sendMessage, clearMessages, addMessage } = useChatStore();
  const { resume: storeResume, setResume } = useResumeStore();
  const initState = useMemo(() => createInitialState(storeResume), []);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(initState.snapshots);
  const [history, setHistory] = useState<HistoryEntry[]>(initState.history);
  const [currentSnapshotId, setCurrentSnapshotId] = useState<string>(initState.currentSnapshotId);
  const [historicalSessions, setHistoricalSessions] = useState<HistoricalSession[]>(initState.historicalSessions);
  const [input, setInput] = useState('');
  const [showStar, setShowStar] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [showTermDiff, setShowTermDiff] = useState(false);
  const [isAtsMode, setIsAtsMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAttr, setShowAttr] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<Tab>('changes');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareFrom, setCompareFrom] = useState<string | null>(null);
  const [compareTo, setCompareTo] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isTyping]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); } }, [toast]);

  const currentSnapshot = snapshots.find(s => s.id === currentSnapshotId) ?? snapshots[0];
  const displayResume = currentSnapshot?.resumeData ?? storeResume;
  const currentAts = currentSnapshot?.atsScore ?? 62;
  const initialAts = snapshots[0]?.atsScore ?? 62;
  const showToast = (m: string) => setToast(m);

  const pushSnapshot = (trigger: string, newResume: Resume, delta: number) => {
    const prevScore = snapshots[snapshots.length - 1]?.atsScore ?? 62;
    const newSnap: Snapshot = { id: genId('snap-'), label: `v${snapshots.length + 1}`, timestamp: nowTime(), trigger, resumeData: cloneResume(newResume), atsScore: prevScore + delta };
    setSnapshots(p => [...p, newSnap]);
    setCurrentSnapshotId(newSnap.id);
    setResume(cloneResume(newResume));
    return newSnap;
  };

  const pushHistoryEntry = (entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'snapshotId'>, snapshotId: string) => {
    setHistory(p => [{ ...entry, id: genId('h-'), timestamp: nowTime(), snapshotId }, ...p]);
  };

  const restoreSnapshot = (snapId: string) => {
    const s = snapshots.find(x => x.id === snapId);
    if (!s) return;
    setCurrentSnapshotId(snapId);
    setResume(cloneResume(s.resumeData));
    showToast(`已恢复至 ${s.label}`);
  };

  const undoStep = (entryId: string) => {
    const entry = history.find(h => h.id === entryId);
    if (!entry) return;
    const targetSnapIdx = snapshots.findIndex(s => s.id === entry.snapshotId);
    if (targetSnapIdx <= 0) return;
    const prevSnap = snapshots[targetSnapIdx - 1];
    restoreSnapshot(prevSnap.id);
  };

  const applyChatChanges = (changes: FieldChange[]) => {
    const r = cloneResume(displayResume);
    changes.forEach(c => {
      const exp = r.sections.find(s => s.type === 'experience');
      if (!exp || !exp.items[0]) return;
      if (c.field === '职位') exp.items[0].fields.position = c.after;
      else if (c.field === '公司(最新)') exp.items[0].fields.company = c.after;
    });
    return r;
  };

  const applyChatToResume = (content: string) => {
    const changes: FieldChange[] = [];
    const exp = displayResume.sections.find(s => s.type === 'experience');
    if (!exp || !exp.items[0]) return null;
    if (content.includes('前端')) {
      const before = exp.items[0].fields.position as string;
      changes.push({ field: '职位', before, after: '高级前端工程师' });
    }
    if (content.includes('字节')) {
      const before = exp.items[0].fields.company as string;
      changes.push({ field: '公司(最新)', before, after: '字节跳动' });
    }
    if (content.includes('产品')) {
      const before = exp.items[0].fields.position as string;
      changes.push({ field: '职位', before, after: '高级产品经理' });
    }
    if (changes.length === 0) return null;
    const newResume = applyChatChanges(changes);
    const snap = pushSnapshot(`对话: "${content.slice(0, 12)}${content.length > 12 ? '...' : ''}"`, newResume, 3);
    pushHistoryEntry({ action: 'chat_message', actionLabel: '自然语言修改', iconType: 'chat', changes, deltaATS: 3 }, snap.id);
    return snap;
  };

  const handleSend = () => {
    const t = input.trim();
    if (!t || isTyping) return;
    applyChatToResume(t);
    sendMessage(t);
    setInput('');
  };

  const handleStar = () => {
    if (showStar) { setShowStar(false); return; }
    const r = cloneResume(displayResume);
    const exp = r.sections.find(s => s.type === 'experience');
    if (!exp || !exp.items[0] || !exp.items[0].starRewrite) { setShowStar(true); return; }
    const item = exp.items[0];
    const changes: FieldChange[] = [{ field: '工作经历#1 描述', before: item.fields.description as string, after: item.starRewrite.result }];
    item.fields.description = item.starRewrite.result;
    const snap = pushSnapshot('STAR重写', r, 8);
    pushHistoryEntry({ action: 'star_rewrite', actionLabel: 'STAR法则重写', iconType: 'star', changes, deltaATS: 8 }, snap.id);
    setShowStar(true);
    showToast('STAR重写已应用 · ATS +8');
  };

  const handleEnhance = () => {
    if (isEnhanced) { setIsEnhanced(false); setShowTermDiff(false); return; }
    const changes: FieldChange[] = termList.map(t => ({ field: '全局关键词替换', before: t.o, after: t.e }));
    const snap = pushSnapshot('术语强化', cloneResume(displayResume), 5);
    pushHistoryEntry({ action: 'terminology', actionLabel: '术语强化', iconType: 'book', changes, deltaATS: 5 }, snap.id);
    setIsEnhanced(true);
    setShowTermDiff(true);
    showToast('术语强化已应用 · ATS +5');
  };

  const handleAts = () => {
    if (isAtsMode) { setIsAtsMode(false); return; }
    const changes: FieldChange[] = [{ field: '全局配色', before: '品牌绿渐变', after: '纯黑白' }, { field: '字体风格', before: '衬线+无衬线混合', after: '无衬线字体' }, { field: '分隔线', before: '渐变实线', after: '黑色虚线' }];
    const snap = pushSnapshot('ATS排版优化', cloneResume(displayResume), 6);
    pushHistoryEntry({ action: 'ats_layout', actionLabel: 'ATS排版优化', iconType: 'ats', changes, deltaATS: 6 }, snap.id);
    setIsAtsMode(true);
    showToast('ATS排版已启用 · ATS +6');
  };

  const restoreSession = (s: HistoricalSession) => {
    setSnapshots(s.snapshots);
    setHistory(s.history);
    setCurrentSnapshotId(s.snapshots[s.snapshots.length - 1].id);
    setResume(cloneResume(s.snapshots[s.snapshots.length - 1].resumeData));
    clearMessages();
    s.messages.forEach(m => addMessage({ role: m.role, content: m.content }));
    setShowHistory(false);
    showToast(`已恢复会话：${s.title}`);
  };

  const confirmNewSession = () => {
    const expItem = displayResume.sections.find(s => s.type === 'experience')?.items[0];
    const pos = (expItem?.fields?.position as string) || '未命名会话';
    const newSess: HistoricalSession = { id: genId('hs-'), createdAt: new Date().toLocaleString('zh-CN').slice(5, 16), title: pos, messageCount: messages.length, startPosition: pos, snapshots: [...snapshots], history: [...history], messages: messages.map(m => ({ role: m.role, content: m.content })) };
    setHistoricalSessions(p => [newSess, ...p]);
    const fresh = createInitialState(storeResume);
    setSnapshots(fresh.snapshots);
    setHistory(fresh.history);
    setCurrentSnapshotId(fresh.snapshots[fresh.snapshots.length - 1].id);
    clearMessages();
    setResume(cloneResume(fresh.snapshots[0].resumeData));
    setIsEnhanced(false); setShowTermDiff(false); setIsAtsMode(false);
    setShowConfirm(false);
    showToast('已归档并开启新会话');
  };

  const sections = displayResume.sections.slice().sort((a, b) => a.order - b.order);
  const summarySec = sections.find(s => s.type === 'summary');
  const expSec = sections.find(s => s.type === 'experience');
  const projSec = sections.find(s => s.type === 'project');
  const eduSec = sections.find(s => s.type === 'education');
  const skillSec = sections.find(s => s.type === 'skill');
  const summary = (summarySec?.items[0]?.fields?.content as string) || '';
  const name = '张明远';
  const title = (expSec?.items[0]?.fields?.position as string) || '高级前端工程师';
  const bCls = isAtsMode ? 'border-l-2 border-dashed border-gray-400' : 'border-l-2 border-brand-500';
  const tCls = isAtsMode ? 'text-black font-sans' : 'text-brand-900 font-display';
  const boCls = isAtsMode ? 'text-gray-800 font-sans' : 'text-brand-800';
  const rTxt = (t: string) => {
    if (!isEnhanced) return t;
    let result = t;
    termList.forEach(({ o, e }) => { if (result.includes(o)) result = result.split(o).join(`<H>${e}</H>`); });
    return result.split(/(<H>.*?<\/H>)/g).map((p, i) => p.startsWith('<H>') && p.endsWith('</H>') ? <mark key={i} className="bg-brand-500/20 text-brand-700 px-0.5 rounded font-semibold">{p.slice(3, -4)}</mark> : <span key={i}>{p}</span>);
  };

  const TypingIndicator = () => (<div className="flex items-start gap-3 mb-4"><div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-brand-500" /></div><div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm"><div className="flex gap-1.5">{[0, 1, 2].map(i => (<motion.span key={i} className="w-2 h-2 rounded-full bg-brand-500" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />))}</div></div></div>);

  const Tag = ({ type, text }: { type: string; text: string }) => {
    const icons: Record<string, string> = { chat: '💬', term: '📚', star: '⭐', ats: '📄' };
    return (<span className="group relative inline-flex items-center gap-1 text-[10px] text-surface-300 ml-1 align-middle"><span>{icons[type]}</span><span className="hidden group-hover:inline-flex absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap bg-brand-900 text-white text-[10px] px-2 py-1 rounded z-10">{text}</span></span>);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const atsColor = currentAts >= 75 ? 'text-emerald-600' : currentAts >= 65 ? 'text-amber-600' : 'text-red-500';
  const compareSnap1 = compareFrom ? snapshots.find(s => s.id === compareFrom) : null;
  const compareSnap2 = compareTo ? snapshots.find(s => s.id === compareTo) : null;
  const selectedCount = (compareFrom ? 1 : 0) + (compareTo ? 1 : 0);

  return (<div className="flex h-screen relative overflow-hidden">
    <AnimatePresence>{toast && (<motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-brand-900 text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2"><Check className="w-4 h-4 text-brand-400" />{toast}</motion.div>)}</AnimatePresence>

    <AnimatePresence>{showConfirm && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl p-6 w-[380px]"><h3 className="font-display text-lg font-bold text-brand-900 mb-2">开启新会话？</h3><p className="text-sm text-surface-500 mb-5">当前对话和简历修改记录将被归档，可在历史会话中恢复。</p><div className="flex gap-2 justify-end"><button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm text-surface-500 hover:bg-surface-50 rounded-lg">取消</button><button onClick={confirmNewSession} className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-1.5"><Archive className="w-3.5 h-3.5" />开始新会话</button></div></motion.div></motion.div>)}</AnimatePresence>

    <AnimatePresence>{showHistory && (<motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed left-0 top-0 bottom-0 w-[340px] z-40 bg-white border-r border-surface-200 shadow-2xl flex flex-col"><div className="flex items-center justify-between px-5 py-4 border-b border-surface-200"><h3 className="font-display font-bold text-brand-900 flex items-center gap-2"><History className="w-4 h-4 text-brand-500" />历史会话</h3><button onClick={() => setShowHistory(false)} className="text-surface-300 hover:text-brand-700"><X className="w-4 h-4" /></button></div><div className="flex-1 overflow-y-auto p-4 space-y-2">{historicalSessions.map((s, i) => (<motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="p-3 bg-surface-50 rounded-xl border border-surface-100 hover:border-brand-200 cursor-pointer transition-colors" onClick={() => restoreSession(s)}><div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-brand-900">{s.title}</p><span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">{s.snapshots[0].label}-{s.snapshots[s.snapshots.length - 1].label} · ATS {s.snapshots[0].atsScore}→{s.snapshots[s.snapshots.length - 1].atsScore}%</span></div><div className="flex items-center gap-3 text-xs text-surface-400"><span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{s.messageCount}条消息</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.createdAt}</span></div><button onClick={(e) => { e.stopPropagation(); restoreSession(s); }} className="mt-2 w-full text-xs py-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors flex items-center justify-center gap-1">恢复此会话</button></motion.div>))}</div></motion.div>)}</AnimatePresence>

    <div className="w-[38%] flex flex-col border-r border-surface-200 bg-white">
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200">
        <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-500" /><h2 className="font-display text-lg font-bold text-brand-900">AI对话创作</h2></div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowHistory(true)} className="btn-ghost p-2 text-surface-400 hover:text-brand-600" title="历史会话"><History className="w-4 h-4" /></button>
          <button onClick={() => setShowConfirm(true)} className="btn-ghost flex items-center gap-1.5 text-sm"><RotateCcw className="w-3.5 h-3.5" />新对话</button>
        </div>
      </div>
      <div className="flex border-b border-surface-100 px-3">
        <button onClick={() => setSidebarTab('changes')} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${sidebarTab === 'changes' ? 'border-brand-500 text-brand-700' : 'border-transparent text-surface-400'}`}>修改时间线</button>
        <button onClick={() => setSidebarTab('versions')} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${sidebarTab === 'versions' ? 'border-brand-500 text-brand-700' : 'border-transparent text-surface-400'}`}>版本快照</button>
      </div>

      {sidebarTab === 'changes' ? (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {history.length === 0 ? (<p className="text-center text-xs text-surface-300 py-8 flex flex-col items-center gap-2"><BookOpen className="w-6 h-6" />暂无修改记录<br />开始对话或使用优化功能</p>) : history.map((l, i) => {
            const Icon = iconMap[l.iconType];
            return (<motion.div key={l.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="relative">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full ${iconBgMap[l.iconType]} border border-surface-200 flex items-center justify-center`}><Icon className={`w-4 h-4 ${iconColorMap[l.iconType]}`} /></div>
                  {i < history.length - 1 && <div className="w-px flex-1 bg-surface-100 my-1" />}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-semibold text-brand-900">{l.actionLabel}</p>
                        <span className="text-[10px] font-bold text-emerald-600">+{l.deltaATS} ATS</span>
                      </div>
                      <p className="text-[10px] text-surface-300 mt-0.5">{l.timestamp} · {l.changes.length}项变更</p>
                    </div>
                    <button onClick={() => undoStep(l.id)} className="text-surface-300 hover:text-brand-600 p-1 flex-shrink-0" title="撤销此步"><Undo2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <button onClick={() => setExpandedLog(expandedLog === l.id ? null : l.id)} className="mt-1 text-[10px] text-brand-500 flex items-center gap-0.5">查看{l.changes.length}项变更详情<ChevronRight className={`w-3 h-3 transition-transform ${expandedLog === l.id ? 'rotate-90' : ''}`} /></button>
                  {expandedLog === l.id && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 p-2 bg-surface-50 rounded-lg text-[11px] space-y-1.5 max-h-[200px] overflow-y-auto">
                    {l.changes.map((c, ci) => (<div key={ci} className="space-y-0.5">
                      <p className="text-[10px] font-medium text-surface-400">{c.field}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <p className="text-red-500 line-through decoration-red-400 break-all">{c.before}</p>
                        <p className="text-emerald-600 break-all">{c.after}</p>
                      </div>
                    </div>))}
                  </motion.div>)}
                </div>
              </div>
            </motion.div>);
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => { setCompareMode(!compareMode); setCompareFrom(null); setCompareTo(null); setShowCompareModal(false); }} className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${compareMode ? 'bg-brand-50 border-brand-300 text-brand-800' : 'bg-white border-surface-200 text-surface-500 hover:bg-surface-50'}`}>
              <div className="flex items-center gap-1"><GitCompare className="w-3 h-3" />{compareMode ? `对比中 (${selectedCount}/2)` : '对比快照'}</div>
            </button>
            {compareMode && selectedCount === 2 && (<button onClick={() => setShowCompareModal(true)} className="text-xs px-2.5 py-1 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors flex items-center gap-1"><Eye className="w-3 h-3" />查看对比</button>)}
          </div>
          {compareMode && (<div className="text-[10px] text-surface-400 mb-2 px-1">{selectedCount === 0 ? '请先选择第一个快照' : selectedCount === 1 ? '请选择第二个快照' : '点击"查看对比"按钮'}</div>)}
          {snapshots.map((s, idx) => {
            const isFrom = compareFrom === s.id;
            const isTo = compareTo === s.id;
            const active = currentSnapshotId === s.id;
            const ringCls = isFrom ? 'ring-2 ring-blue-400' : isTo ? 'ring-2 ring-amber-400' : '';
            const delta = idx === 0 ? 0 : s.atsScore - snapshots[idx - 1].atsScore;
            return (<button key={s.id} onClick={() => {
              if (compareMode) {
                if (isFrom) setCompareFrom(null);
                else if (isTo) setCompareTo(null);
                else if (!compareFrom) setCompareFrom(s.id);
                else if (!compareTo) setCompareTo(s.id);
              } else { restoreSnapshot(s.id); }
            }} className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${active && !compareMode ? 'bg-brand-50 border-brand-300' : 'bg-white border-surface-200 hover:border-brand-200 hover:bg-surface-50'} ${ringCls}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${active && !compareMode ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600'}`}>{s.label}</span>
                  {idx > 0 && <span className={`text-[10px] ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{delta >= 0 ? '+' : ''}{delta}%</span>}
                </div>
                <span className="text-[10px] text-surface-300">{s.timestamp}</span>
              </div>
              <div className="text-[11px] text-surface-500">{s.trigger}</div>
              <div className="mt-1 h-1.5 bg-surface-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${s.atsScore >= 75 ? 'bg-emerald-500' : s.atsScore >= 65 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(s.atsScore, 100)}%` }} /></div>
            </button>);
          })}
          <div className="text-center text-[11px] font-medium mt-3 flex items-center justify-center gap-1.5 pt-2 border-t border-surface-100">
            <span className="text-surface-400">累计 ATS: <span className={atsColor}>{initialAts}%</span> → <span className={atsColor}>{currentAts}%</span></span>
            <span className="text-emerald-600">{currentAts - initialAts >= 0 ? '+' : ''}{currentAts - initialAts}%</span>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="max-h-[45%] overflow-y-auto px-5 py-3 space-y-1 border-t border-surface-100 bg-surface-50/50">
        {messages.map(m => (<div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>{m.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mr-2.5 mt-1"><Sparkles className="w-3.5 h-3.5 text-brand-500" /></div>}<div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand-900 text-white rounded-2xl rounded-br-sm' : 'bg-white text-brand-900 rounded-2xl rounded-bl-sm shadow-sm border border-surface-100'}`}>{renderBold(m.content)}</div></div>))}
        {isTyping && <TypingIndicator />}
      </div>
      <div className="px-5 py-3 border-t border-surface-200"><div className="flex items-center gap-2 bg-surface-50 rounded-xl px-4 py-2 border border-surface-200 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="描述您的职业背景、项目经历..." className="flex-1 bg-transparent outline-none text-sm text-brand-900 placeholder:text-surface-300" /><button onClick={handleSend} disabled={!input.trim() || isTyping} className="w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-surface-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"><Send className="w-4 h-4 text-white" /></button></div></div>
    </div>

    <div className="flex-1 flex flex-col bg-surface-50 relative">
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200 bg-white">
        <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-brand-500" /><h2 className="font-display text-lg font-bold text-brand-900">实时简历预览</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-500 ml-2">{currentSnapshot?.label || 'v1'}</span>
          <span className={`text-xs font-bold ${atsColor}`}>ATS {currentAts}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAttr(!showAttr)} className={`btn-ghost text-xs flex items-center gap-1 ${showAttr ? 'bg-brand-50 text-brand-700' : ''}`}>{showAttr ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}生成依据</button>
          <button onClick={handleStar} className={`btn-ghost text-xs flex items-center gap-1 ${showStar ? 'bg-amber-50 text-amber-700' : ''}`}><Star className="w-3 h-3" />STAR重写</button>
          <button onClick={handleEnhance} className={`btn-ghost text-xs flex items-center gap-1 ${isEnhanced ? 'bg-purple-50 text-purple-700' : ''}`}>{isEnhanced ? <Check className="w-3 h-3" /> : <Zap className="w-3 h-3" />}{isEnhanced ? '已强化' : '术语强化'}</button>
          <button onClick={handleAts} className={`btn-ghost text-xs flex items-center gap-1 ${isAtsMode ? 'bg-gray-100 text-gray-800' : ''}`}><Layout className="w-3 h-3" />ATS排版</button>
        </div>
      </div>
      <div className="px-5 py-2 flex items-center gap-2 bg-white border-b border-surface-100">
        <span className="text-xs text-surface-300 font-medium">版本：</span>
        {snapshots.map((s) => (<button key={s.id} onClick={() => restoreSnapshot(s.id)} className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all ${currentSnapshotId === s.id ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}>{s.label}</button>))}
        {isAtsMode && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-medium">ATS友好模式已启用</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className={`mx-auto max-w-[620px] ${isAtsMode ? 'bg-white border-2 border-gray-300' : 'bg-white rounded-lg shadow-lg'} resume-preview`} style={{ aspectRatio: '210/297' }}>
          <div className="p-7 h-full flex flex-col">
            <div className="text-center mb-4">
              <h1 className={`${isAtsMode ? 'font-sans text-black' : 'font-display text-brand-900'} text-2xl font-bold tracking-wide`}>{name}</h1>
              <p className={`mt-1 text-sm font-medium ${isAtsMode ? 'text-gray-700 font-sans' : 'text-brand-600'}`}>{title}{showAttr && <Tag type="chat" text={`来自${currentSnapshot?.trigger || '初始状态'}`} />}</p>
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
        {showStar && (<motion.div key="star" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 bg-white border-t border-surface-200 rounded-t-2xl shadow-2xl" style={{ maxHeight: '45%' }}><div className="px-6 py-4"><div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-brand-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />STAR法则重写</h3><button onClick={() => setShowStar(false)} className="text-surface-300 hover:text-brand-700"><X className="w-4 h-4" /></button></div><div className="grid grid-cols-2 gap-4 overflow-y-auto" style={{ maxHeight: 'calc(45vh - 80px)' }}><div className="bg-surface-50 rounded-xl p-4 border border-surface-200"><p className="text-xs font-semibold text-surface-300 uppercase tracking-wider mb-2">原始描述</p><p className="text-sm text-brand-800 leading-relaxed">{expSec?.items[0]?.starRewrite?.original || '暂无数据'}</p></div><div className="bg-brand-50/50 rounded-xl p-4 border border-brand-200"><p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">STAR重写 (ATS +8)</p><div className="space-y-2 text-sm">{expSec?.items[0]?.starRewrite && (['situation', 'task', 'action', 'result'] as const).map((k) => (<div key={k}><span className="inline-block px-1.5 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded mr-1.5 uppercase">{k.charAt(0)}</span><span className="text-brand-800 leading-relaxed">{expSec.items[0].starRewrite![k]}</span></div>))}</div></div></div></div></motion.div>)}
        {showTermDiff && !showStar && (<motion.div key="term" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 bg-white border-t border-surface-200 rounded-t-2xl shadow-2xl" style={{ maxHeight: '48%' }}><div className="px-6 py-4"><div className="flex items-center justify-between mb-3"><h3 className="font-display font-bold text-brand-900 flex items-center gap-2"><Zap className="w-4 h-4 text-brand-500" />术语强化对比</h3><div className="flex items-center gap-3"><span className="text-xs text-brand-600 font-medium bg-brand-50 px-3 py-1 rounded-full">ATS {initialAts}% → <strong className="text-brand-700">{currentAts}%</strong></span><button onClick={() => setShowTermDiff(false)} className="text-surface-300 hover:text-brand-700"><X className="w-4 h-4" /></button></div></div><div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 'calc(48vh - 85px)' }}>{termList.map((t, i) => (<motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center rounded-lg p-2.5 border bg-surface-50 border-surface-200"><div><p className="text-[10px] text-surface-300 uppercase font-semibold mb-0.5">BEFORE</p><p className="text-sm text-red-500 line-through decoration-red-400">{t.o}</p></div><div className="text-surface-300"><ArrowRight className="w-4 h-4" /></div><div><p className="text-[10px] text-brand-600 uppercase font-semibold mb-0.5">AFTER</p><p className="text-sm font-semibold text-emerald-600">{t.e}</p></div></motion.div>))}</div></div></motion.div>)}
      </AnimatePresence>

      <AnimatePresence>
        {showCompareModal && compareSnap1 && compareSnap2 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-8" onClick={(e) => { if (e.target === e.currentTarget) setShowCompareModal(false); }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h3 className="font-display text-lg font-bold text-brand-900 flex items-center gap-2"><GitCompare className="w-5 h-5 text-brand-500" />版本快照对比</h3>
              <button onClick={() => setShowCompareModal(false)} className="text-surface-300 hover:text-brand-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {[{ snap: compareSnap1, color: 'blue', tag: 'FROM' }, { snap: compareSnap2, color: 'amber', tag: 'TO' }].map(({ snap, color }, gi) => {
                  const exp = snap.resumeData.sections.find(s => s.type === 'experience')!;
                  const vals = [{ field: '职位', value: exp.items[0].fields.position as string }, { field: '公司', value: exp.items[0].fields.company as string }, { field: '描述', value: exp.items[0].fields.description as string }];
                  return (<div key={gi}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1.5 bg-${color}-50 text-${color}-700 rounded-lg font-bold text-sm`}>{snap.label} · {snap.trigger}</span>
                      <span className="text-xs text-surface-400">{snap.timestamp}</span>
                    </div>
                    <div className={`p-4 bg-surface-50 rounded-xl border border-${color}-200`}>
                      <p className="text-xs text-surface-400 mb-2">ATS 分数</p>
                      <p className={`text-2xl font-bold font-mono text-${color}-600`}>{snap.atsScore}%</p>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      {vals.map((c, i) => (<div key={i} className={`p-2 rounded border ${gi === 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <p className={`text-[10px] font-medium mb-0.5 ${gi === 0 ? 'text-red-500' : 'text-emerald-600'}`}>{c.field}</p>
                        <p className={gi === 0 ? 'text-red-600' : 'text-emerald-700'}>{c.value}</p>
                      </div>))}
                    </div>
                  </div>);
                })}
              </div>
              <div className="mt-6 p-4 bg-brand-50 rounded-xl border border-brand-200">
                <p className="text-xs font-semibold text-brand-700 mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" />总体变化</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm">ATS 变化: <span className="font-bold font-mono text-emerald-600">{compareSnap2.atsScore - compareSnap1.atsScore >= 0 ? '+' : ''}{compareSnap2.atsScore - compareSnap1.atsScore}%</span></span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>)}
      </AnimatePresence>
    </div>
  </div>);
}
