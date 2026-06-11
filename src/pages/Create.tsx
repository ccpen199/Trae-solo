import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, FileText, RotateCcw, Zap, Layout, Check, X } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useResumeStore } from '@/stores/resumeStore';
import type { Resume } from '@/types/resume';

const termReplacements: Record<string, string> = {
  '做了': '主导推进', '负责': '牵头负责', '配合': '跨部门协作', '参与': '深度参与',
  '用了React': '基于React 18 + TypeScript构建', '优化': '系统性优化', '开发': '工程化开发',
  '完成': '高质量交付', '提升': '显著提升', '解决': '创新性解决',
};

const termBenefits: Record<string, string> = {
  '做了→主导推进': '体现ownership，ATS识别为主动贡献', '负责→牵头负责': '突出领导力，匹配高级岗位关键词',
  '配合→跨部门协作': '体现软技能，大厂高频筛选词', '参与→深度参与': '避免边缘角色感，强化核心贡献',
  '用了React→基于React 18 + TypeScript构建': '精确技术栈匹配，提升技术评级',
  '优化→系统性优化': '体现方法论，避免浅层描述', '开发→工程化开发': '突出工程能力，匹配架构岗要求',
  '完成→高质量交付': '强调结果导向，项目管理能力加分', '提升→显著提升': '量化效果暗示，吸引HR注意力',
  '解决→创新性解决': '突出创造力，匹配技术突破场景',
};

const starData = {
  original: '负责飞书文档编辑器的开发工作，优化了加载性能，提升了用户体验。',
  star: { s: '飞书文档编辑器首屏加载耗时3.2秒，严重影响用户留存与编辑体验', t: '作为核心模块负责人，主导编辑器渲染链路全面重构',
    a: '引入虚拟滚动与增量渲染机制，重构SSR数据预取流程，实现关键资源预加载策略',
    r: '首屏加载时间从3.2s降至0.8s（提升75%），用户留存率提升23%，获季度技术突破奖' },
};

function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>
  );
}

function renderEnhanced(text: string) {
  let result = text;
  Object.entries(termReplacements).forEach(([o, e]) => { if (result.includes(o)) result = result.split(o).join(`<H>${e}</H>`); });
  return result.split(/(<H>.*?<\/H>)/g).map((p, i) =>
    p.startsWith('<H>') && p.endsWith('</H>') ? <mark key={i} className="bg-brand-500/20 text-brand-700 px-0.5 rounded font-semibold">{p.slice(3, -4)}</mark> : <span key={i}>{p}</span>
  );
}

function TypingIndicator() {
  return (<div className="flex items-start gap-3 mb-4"><div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
    <Sparkles className="w-4 h-4 text-brand-500" /></div>
    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm"><div className="flex gap-1.5">
      {[0, 1, 2].map(i => (<motion.span key={i} className="w-2 h-2 rounded-full bg-brand-500" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />))}
    </div></div></div>);
}

type VLabel = 'v1 初始' | 'v2 对话修改' | 'v3 术语强化';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isTyping]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); } }, [toast]);
  useEffect(() => { if (verSnaps.length === 0) setVerSnaps([JSON.parse(JSON.stringify(resume))]); }, []);

  const showToast = (m: string) => setToast(m);
  const saveVer = (label: VLabel) => { setVerSnaps(p => [...p, JSON.parse(JSON.stringify(resume))]); setCurrentVer(verSnaps.length); showToast(`${label} 已保存`); };
  const restoreVer = (i: number) => { if (verSnaps[i]) { setResume(verSnaps[i]); setCurrentVer(i); showToast(`已恢复至 v${i + 1}`); } };

  const applyChatToResume = (content: string) => {
    let changed = false;
    const expSec = resume.sections.find(s => s.type === 'experience');
    if ((content.includes('前端') || content.includes('工程师') || content.includes('产品')) && expSec?.items[0]) {
      const pos = content.includes('产品') ? '高级产品经理' : content.includes('架构') ? '前端架构师' : '高级前端工程师';
      updateItem(expSec.id, expSec.items[0].id, { position: pos }); changed = true;
    }
    if ((content.includes('字节') || content.includes('阿里') || content.includes('腾讯') || content.includes('美团')) && expSec?.items[0]) {
      const c = content.includes('字节') ? '字节跳动' : content.includes('阿里') ? '阿里巴巴' : content.includes('腾讯') ? '腾讯' : '美团';
      updateItem(expSec.id, expSec.items[0].id, { company: c }); changed = true;
    }
    if (changed && currentVer < 1) saveVer('v2 对话修改');
  };

  const handleSend = () => { const t = input.trim(); if (!t || isTyping) return; applyChatToResume(t); sendMessage(t); setInput(''); };
  const handleReset = () => { clearMessages(); if (verSnaps[0]) { setResume(verSnaps[0]); setCurrentVer(0); } setIsEnhanced(false); setShowTermDiff(false); setIsAtsMode(false); showToast('对话与简历已重置'); };
  const handleEnhance = () => { setIsEnhanced(!isEnhanced); if (!isEnhanced) { setShowTermDiff(true); if (currentVer < 2) saveVer('v3 术语强化'); } else setShowTermDiff(false); };
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
  const rTxt = (t: string) => isEnhanced ? renderEnhanced(t) : t;
  const vBadges: VLabel[] = ['v1 初始', 'v2 对话修改', 'v3 术语强化'];

  return (<div className="flex h-screen relative">
    <AnimatePresence>{toast && (<motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-brand-900 text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2">
      <Check className="w-4 h-4 text-brand-400" />{toast}</motion.div>)}</AnimatePresence>

    <div className="w-[40%] flex flex-col border-r border-surface-200 bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
        <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-500" /><h2 className="font-display text-lg font-bold text-brand-900">AI对话创作</h2></div>
        <button onClick={handleReset} className="btn-ghost flex items-center gap-1.5 text-sm"><RotateCcw className="w-3.5 h-3.5" />新对话</button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {messages.map(m => (<div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
          {m.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mr-2.5 mt-1"><Sparkles className="w-3.5 h-3.5 text-brand-500" /></div>}
          <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand-900 text-white rounded-2xl rounded-br-sm' : 'bg-white text-brand-900 rounded-2xl rounded-bl-sm shadow-sm border border-surface-100'}`}>
            {renderBold(m.content)}</div></div>))}
        {isTyping && <TypingIndicator />}
      </div>
      <div className="px-5 py-4 border-t border-surface-200">
        <div className="flex items-center gap-2 bg-surface-50 rounded-xl px-4 py-2.5 border border-surface-200 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="描述您的职业背景、项目经历...（例：我想求职前端工程师，曾在字节工作）"
            className="flex-1 bg-transparent outline-none text-sm text-brand-900 placeholder:text-surface-300" />
          <button onClick={handleSend} disabled={!input.trim() || isTyping}
            className="w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-surface-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
            <Send className="w-4 h-4 text-white" /></button></div></div></div>

    <div className="w-[60%] flex flex-col bg-surface-50 relative">
      <div className="flex items-center justify-between px-6 py-3 border-b border-surface-200 bg-white">
        <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-brand-500" /><h2 className="font-display text-lg font-bold text-brand-900">实时简历预览</h2></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowStar(!showStar)} className={`btn-ghost text-xs flex items-center gap-1 ${showStar ? 'bg-brand-50 text-brand-700' : ''}`}><RotateCcw className="w-3 h-3" />STAR重写</button>
          <button onClick={handleEnhance} className={`btn-ghost text-xs flex items-center gap-1 ${isEnhanced ? 'bg-brand-50 text-brand-700' : ''}`}>
            {isEnhanced ? <Check className="w-3 h-3" /> : <Zap className="w-3 h-3" />}{isEnhanced ? '已强化' : '术语强化'}</button>
          <button onClick={() => setIsAtsMode(!isAtsMode)} className={`btn-ghost text-xs flex items-center gap-1 ${isAtsMode ? 'bg-gray-100 text-gray-800' : ''}`}><Layout className="w-3 h-3" />ATS排版</button>
        </div></div>
      <div className="px-6 py-2 flex items-center gap-2 bg-white border-b border-surface-100">
        <span className="text-xs text-surface-300 font-medium">版本：</span>
        {vBadges.slice(0, Math.max(1, currentVer + 1)).map((label, i) => (<button key={i} onClick={() => restoreVer(i)}
          className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all ${currentVer === i ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}>{label}</button>))}
        {isAtsMode && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-medium">ATS友好模式已启用</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className={`mx-auto max-w-[680px] ${isAtsMode ? 'bg-white border-2 border-gray-300' : 'bg-white rounded-lg shadow-lg'} resume-preview`} style={{ aspectRatio: '210/297' }}>
          <div className="p-8 h-full flex flex-col">
            <div className="text-center mb-5">
              <h1 className={`${isAtsMode ? 'font-sans text-black' : 'font-display text-brand-900'} text-2xl font-bold tracking-wide`}>{name}</h1>
              <p className={`mt-1 text-sm font-medium ${isAtsMode ? 'text-gray-700 font-sans' : 'text-brand-600'}`}>{title}</p>
              <div className={`mt-3 h-[2px] ${isAtsMode ? 'bg-gray-400' : 'bg-gradient-to-r from-transparent via-brand-500 to-transparent'}`} /></div>
            <div className={`flex-1 space-y-4 text-[13px] overflow-hidden ${boCls}`}>
              {summarySec && <div className={`${bCls} pl-3 section-spacing`}><h3 className={`${tCls} font-bold text-sm mb-1.5`}>{summarySec.title}</h3><p className="leading-relaxed">{rTxt(summary)}</p></div>}
              {expSec && <div className={`${bCls} pl-3 section-spacing`}><h3 className={`${tCls} font-bold text-sm mb-1.5`}>{expSec.title}</h3>
                {expSec.items.map(it => (<div key={it.id} className="mb-3 last:mb-0">
                  <div className="flex justify-between items-baseline"><span className={`font-semibold ${isAtsMode ? 'text-black' : 'text-brand-900'}`}>{it.fields.company as string}</span>
                    <span className={`text-xs font-mono ${isAtsMode ? 'text-gray-600' : 'text-brand-600'}`}>{it.fields.period as string}</span></div>
                  <p className={`text-xs mb-1 ${isAtsMode ? 'text-gray-700' : 'text-brand-700'}`}>{it.fields.position as string}</p>
                  <p className="leading-relaxed">{rTxt(it.fields.description as string)}</p></div>))}</div>}
              {projSec && <div className={`${bCls} pl-3 section-spacing`}><h3 className={`${tCls} font-bold text-sm mb-1.5`}>{projSec.title}</h3>
                {projSec.items.map(it => (<div key={it.id}><span className={`font-semibold ${isAtsMode ? 'text-black' : 'text-brand-900'}`}>{it.fields.name as string}</span>
                  <p className="leading-relaxed mt-0.5">{rTxt(it.fields.description as string)}</p></div>))}</div>}
              {eduSec && <div className={`${bCls} pl-3 section-spacing`}><h3 className={`${tCls} font-bold text-sm mb-1.5`}>{eduSec.title}</h3>
                {eduSec.items.map(it => (<p key={it.id}>{(it.fields.school as string) + ' · ' + (it.fields.major as string) + ' · ' + (it.fields.degree as string) + '（' + (it.fields.period as string) + '）'}</p>))}</div>}
              {skillSec && <div className={`${bCls} pl-3 section-spacing`}><h3 className={`${tCls} font-bold text-sm mb-1.5`}>{skillSec.title}</h3>
                <div className="flex flex-wrap gap-1.5">{skillSec.items.map(it => (<span key={it.id} className={`px-2.5 py-0.5 rounded text-xs font-medium ${isAtsMode ? 'bg-gray-100 text-gray-800 border border-gray-300' : 'bg-brand-50 text-brand-700'}`}>{it.fields.items as string}</span>))}</div>
              </div>}</div></div></div></div>

      <AnimatePresence mode="wait">
        {showStar && (<motion.div key="star" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-surface-200 rounded-t-2xl shadow-2xl" style={{ maxHeight: '45%' }}>
          <div className="px-6 py-4"><div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-brand-900">STAR法则重写</h3>
            <button onClick={() => setShowStar(false)} className="text-surface-300 hover:text-brand-700 text-xl leading-none">&times;</button></div>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto" style={{ maxHeight: 'calc(45vh - 80px)' }}>
              <div className="bg-surface-50 rounded-xl p-4 border border-surface-200"><p className="text-xs font-semibold text-surface-300 uppercase tracking-wider mb-2">原始描述</p>
                <p className="text-sm text-brand-800 leading-relaxed">{starData.original}</p></div>
              <div className="bg-brand-50/50 rounded-xl p-4 border border-brand-200"><p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">STAR重写</p>
                <div className="space-y-2.5 text-sm">{(['s', 't', 'a', 'r'] as const).map(k => (<div key={k}><span className="inline-block px-1.5 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded mr-1.5 uppercase">{k}</span>
                  <span className="text-brand-800 leading-relaxed">{starData.star[k]}</span></div>))}</div></div></div></div></motion.div>)}
        {showTermDiff && !showStar && (<motion.div key="term" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-surface-200 rounded-t-2xl shadow-2xl" style={{ maxHeight: '45%' }}>
          <div className="px-6 py-4"><div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-brand-900 flex items-center gap-2"><Zap className="w-4 h-4 text-brand-500" />术语强化对比</h3>
            <button onClick={() => setShowTermDiff(false)} className="text-surface-300 hover:text-brand-700 text-xl leading-none flex items-center"><X className="w-4 h-4" /></button></div>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(45vh - 80px)' }}>
              {Object.entries(termReplacements).map(([o, e], i) => (<motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="grid grid-cols-3 gap-3 items-center bg-surface-50 rounded-lg p-3 border border-surface-200">
                <div><p className="text-[10px] text-surface-300 uppercase font-semibold mb-0.5">原始术语</p><p className="text-sm text-brand-700 line-through decoration-surface-300">{o}</p></div>
                <div className="text-center"><span className="inline-block px-2 py-0.5 bg-brand-500 text-white text-xs font-bold rounded">→</span></div>
                <div><p className="text-[10px] text-brand-600 uppercase font-semibold mb-0.5">强化术语</p><p className="text-sm font-semibold text-brand-700">{e}</p></div>
                <div className="col-span-3 mt-1 pt-2 border-t border-surface-200"><p className="text-xs text-surface-400"><Check className="w-3 h-3 inline mr-1 text-brand-500" />ATS收益：{termBenefits[`${o}→${e}`]}</p></div>
              </motion.div>))}</div></div></motion.div>)}
      </AnimatePresence></div></div>);
}
