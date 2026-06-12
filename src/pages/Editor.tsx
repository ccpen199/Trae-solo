import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical, ChevronDown, ChevronRight, Download, Save, Palette, Plus, X, GitCompare,
  FileDown, FileText, Globe, RotateCcw, Check, Lock, Shield, Sparkles, Clock, Package,
  History, ArrowRight, Trash2, Eye, Mail, ChevronLeft, PanelRightOpen, PanelRightClose,
} from 'lucide-react';
import { useResumeStore } from '@/stores/resumeStore';
import { templates, themePresets } from '@/data/mockTemplates';
import type { ResumeSection } from '@/types/resume';

const FIELD_LABELS: Record<string, Record<string, string>> = {
  summary: { content: '内容' }, experience: { company: '公司', position: '职位', period: '时间', description: '描述', highlights: '亮点' },
  education: { school: '学校', major: '专业', degree: '学位', period: '时间', gpa: 'GPA' }, skill: { category: '分类', items: '技能列表' },
  project: { name: '项目名', period: '时间', role: '角色', description: '描述', highlights: '亮点' },
};
const DEFAULT_FIELDS: Record<string, Record<string, string | string[]>> = {
  summary: { content: '' }, experience: { company: '', position: '', period: '', description: '', highlights: [] },
  education: { school: '', major: '', degree: '', period: '', gpa: '' }, skill: { category: '', items: '' },
  project: { name: '', period: '', role: '', description: '', highlights: [] },
};
type ExportFormat = 'pdf' | 'word' | 'web';

const exportHistory = [
  { id: 'h1', date: '2026-06-12 14:30', version: 'v3', format: 'pdf', name: '投递阿里.pdf', size: '247KB' },
  { id: 'h2', date: '2026-06-10 10:15', version: 'v2', format: 'pdf', name: '星巴克投递版.pdf', size: '231KB' },
  { id: 'h3', date: '2026-06-08 09:42', version: 'v1', format: 'word', name: '初始版本.docx', size: '32KB' },
];

const versionTimeline = [
  { v: 'v3', date: '2026-06-12', note: '优化项目经历描述 · 添加量化指标', changes: { add: 8, mod: 5, del: 2 }, ats: 78, active: true },
  { v: 'v2', date: '2026-06-05', note: '调整排版布局 · 增加技能分类', changes: { add: 5, mod: 3, del: 1 }, ats: 71, active: false },
  { v: 'v1', date: '2026-06-01', note: '初始版本创建', changes: { add: 23, mod: 0, del: 0 }, ats: 62, active: false },
];

function sha256Mock(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0') + '-A7F2-9BC3';
}

function SortableSection({ section }: { section: ResumeSection }) {
  const { toggleSectionCollapse, updateItem, addItem, activeSection, setActiveSection } = useResumeStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isActive = activeSection === section.id;
  const labels = FIELD_LABELS[section.type] || {};
  return (
    <div ref={setNodeRef} style={style} className={`bg-white rounded-lg border mb-2 transition-colors ${isActive ? 'border-brand-500 shadow-md' : 'border-surface-200'}`}>
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setActiveSection(isActive ? null : section.id)}>
        <button {...attributes} {...listeners} className="cursor-grab text-surface-300 hover:text-brand-500" onClick={(e) => e.stopPropagation()}><GripVertical className="w-4 h-4" /></button>
        <span className="font-body font-semibold text-sm text-brand-900 flex-1">{section.title}</span>
        <button className="text-surface-300 hover:text-brand-500" onClick={(e) => { e.stopPropagation(); toggleSectionCollapse(section.id); }}>
          {section.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {!section.collapsed && (
        <div className="px-3 pb-3 space-y-3">
          {section.items.map((item) => (
            <div key={item.id} className="space-y-1.5">
              {Object.entries(item.fields).map(([key, value]) => (
                <div key={key}>
                  <label className="text-[10px] text-surface-300 font-body">{labels[key] || key}</label>
                  {key === 'content' || key === 'description' ? (
                    <textarea className="w-full text-xs border border-surface-200 rounded px-2 py-1.5 font-body resize-none focus:outline-none focus:border-brand-500" rows={2}
                      value={typeof value === 'string' ? value : value.join('\n')} onChange={(e) => updateItem(section.id, item.id, { [key]: e.target.value })} />
                  ) : key === 'highlights' ? (
                    <textarea className="w-full text-xs border border-surface-200 rounded px-2 py-1.5 font-body resize-none focus:outline-none focus:border-brand-500" rows={2}
                      value={Array.isArray(value) ? value.join('\n') : String(value)} onChange={(e) => updateItem(section.id, item.id, { [key]: e.target.value.split('\n').filter(Boolean) })} />
                  ) : (
                    <input className="w-full text-xs border border-surface-200 rounded px-2 py-1.5 font-body focus:outline-none focus:border-brand-500"
                      value={typeof value === 'string' ? value : String(value)} onChange={(e) => updateItem(section.id, item.id, { [key]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
          ))}
          <button className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-body"
            onClick={() => addItem(section.id, { id: `${section.type}-${Date.now()}`, fields: { ...(DEFAULT_FIELDS[section.type] || {}) } })}>
            <Plus className="w-3.5 h-3.5" /> 添加条目
          </button>
        </div>
      )}
    </div>
  );
}

function LivePreview() {
  const { resume } = useResumeStore();
  const { theme, sections } = resume;
  const cssVars = {
    '--resume-primary': theme.primaryColor, '--resume-secondary': theme.secondaryColor, '--resume-accent': theme.accentColor,
    '--resume-font-heading': theme.fontHeading, '--resume-font-body': theme.fontBody, '--resume-font-size': `${theme.fontSize}px`,
    '--resume-line-height': String(theme.lineHeight), '--resume-section-spacing': `${theme.sectionSpacing}px`,
  } as React.CSSProperties;
  return (
    <div className="flex-1 overflow-auto p-6 flex justify-center bg-surface-100" style={cssVars}>
      <div className="bg-white shadow-xl rounded-lg w-full max-w-[595px] min-h-[842px] resume-preview p-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--resume-font-heading)', color: 'var(--resume-primary)' }}>{resume.title}</h1>
        <div className="w-16 h-1 mb-6 rounded" style={{ backgroundColor: 'var(--resume-secondary)' }} />
        {sections.map((section) => (
          <div key={section.id} className="section-spacing" style={{ borderLeft: `3px solid var(--resume-secondary)`, paddingLeft: 12 }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--resume-primary)', fontFamily: 'var(--resume-font-heading)' }}>{section.title}</h2>
            {section.items.map((item) => (
              <div key={item.id} className="mb-2">
                {section.type === 'summary' && <p className="text-xs">{String(item.fields.content ?? '')}</p>}
                {section.type === 'experience' && (<>
                  <div className="flex justify-between items-baseline"><span className="text-xs font-semibold">{String(item.fields.company ?? '')}</span><span className="text-[10px] text-gray-500">{String(item.fields.period ?? '')}</span></div>
                  <p className="text-[10px] text-gray-600">{String(item.fields.position ?? '')}</p>
                  <p className="text-[10px] mt-1">{String(item.fields.description ?? '')}</p>
                </>)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [pageRange, setPageRange] = useState('all');
  const [addWatermark, setAddWatermark] = useState(false);
  const [includeVersion, setIncludeVersion] = useState(true);
  const [encrypt, setEncrypt] = useState(false);
  const [password, setPassword] = useState('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const timerRef = useRef<number | null>(null);

  const formatInfo: Record<ExportFormat, { name: string; size: string; ats: string; color: string }> = {
    pdf: { name: 'PDF 格式', size: '247KB', ats: '98%', color: 'from-red-500 to-rose-600' },
    word: { name: 'Word 格式', size: '32KB', ats: '95%', color: 'from-blue-500 to-indigo-600' },
    web: { name: 'Web 网页', size: '125KB', ats: '85%', color: 'from-emerald-500 to-teal-600' },
  };

  useEffect(() => {
    if (step !== 3) return;
    setProgress(0);
    const phases = [
      { p: 30, t: '渲染内容...' }, { p: 55, t: '嵌入字体...' },
      { p: 80, t: `生成${format.toUpperCase()}...` }, { p: 95, t: '添加水印...' }, { p: 100, t: '✓ 完成!' },
    ];
    let idx = 0;
    setPhase(phases[0].t);
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        const next = p + 2;
        while (idx < phases.length && next >= phases[idx].p) { setPhase(phases[idx].t); idx++; }
        if (next >= 100) { if (timerRef.current) clearInterval(timerRef.current); return 100; }
        return next;
      });
    }, 30);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, format]);

  const handleDownload = () => {
    const genTime = new Date().toLocaleString('zh-CN');
    const content = `ResumeForge AI 导出文件凭证\n========================\n格式: ${format.toUpperCase()}\n版本: v3\n生成时间: ${genTime}\nATS兼容性: ${formatInfo[format].ats}\n预计文件大小: ${formatInfo[format].size}\n页码范围: ${pageRange}\n含版本信息: ${includeVersion}\n水印: ${addWatermark}\n加密: ${encrypt ? '是' : '否'}\n校验码(SHA-256): ${sha256Mock(genTime + format)}\n\n--- 简历内容预览 ---\n标题: ResumeForge AI Sample\n此为演示文件，实际导出需后端渲染。`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `简历导出-v3.${format === 'web' ? 'html' : format}`; a.click();
    URL.revokeObjectURL(url);
  };

  const steps = [
    { n: 1, t: '选择格式' }, { n: 2, t: '导出选项' }, { n: 3, t: '生成文件' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-surface-100 bg-gradient-to-r from-brand-900 to-brand-800 text-white flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-xl flex items-center gap-2"><Package className="w-5 h-5" /> 📦 导出中心 · 三步导出向导</h3>
            <p className="text-xs text-brand-200/80 mt-0.5">选择格式 → 配置选项 → 生成文件</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-4 bg-surface-50/50 border-b border-surface-100">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${step >= s.n ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md' : 'bg-surface-200 text-surface-400'}`}>
                  {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                </div>
                <span className={`text-sm font-medium ${step >= s.n ? 'text-brand-900' : 'text-surface-400'}`}>{s.t}</span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded-full mx-1 ${step > s.n ? 'bg-brand-500' : 'bg-surface-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 min-h-[380px]">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-surface-700 mb-3">请选择导出格式：</p>
              <div className="grid grid-cols-3 gap-4">
                {(['pdf', 'word', 'web'] as ExportFormat[]).map(f => {
                  const info = formatInfo[f];
                  const Icon = f === 'pdf' ? FileDown : f === 'word' ? FileText : Globe;
                  const sel = format === f;
                  return (
                    <button key={f} onClick={() => setFormat(f)}
                      className={`p-5 rounded-xl border-2 transition-all text-left ${sel ? 'border-brand-500 bg-brand-50/50 shadow-lg scale-[1.02]' : 'border-surface-200 hover:border-brand-300 bg-white'}`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center mb-3 shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-display font-bold text-brand-900 mb-1">{info.name}</p>
                      <div className="space-y-0.5 text-[11px] text-surface-500">
                        <p>预计大小: <b className="font-mono">{info.size}</b></p>
                        <p>ATS兼容: <b className="font-mono text-emerald-600">{info.ats}</b></p>
                      </div>
                      {sel && <div className="mt-3 flex items-center gap-1 text-xs text-brand-600 font-semibold"><Check className="w-3.5 h-3.5" /> 已选择</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 max-w-lg mx-auto">
              <div>
                <p className="text-sm font-semibold text-brand-900 mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4" /> 页码范围</p>
                <div className="flex gap-2">
                  {[{ k: 'all', l: '全部页码' }, { k: '1-2', l: '第 1-2 页' }, { k: 'custom', l: '自定义' }].map(r => (
                    <button key={r.k} onClick={() => setPageRange(r.k)} className={`flex-1 py-2.5 text-sm rounded-xl border-2 transition-all font-medium ${pageRange === r.k ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-500 hover:border-surface-300'}`}>{r.l}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { k: includeVersion, s: setIncludeVersion, l: '包含版本信息 (v3)', d: '页眉/页脚添加版本号与生成时间' },
                  { k: addWatermark, s: setAddWatermark, l: '添加水印「ResumeForge AI」', d: '防止文件滥用与非法传播' },
                  { k: encrypt, s: setEncrypt, l: '加密文件（密码保护）', d: '打开文件需输入密码' },
                ].map((o, i) => (
                  <label key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50/50 border border-surface-100 cursor-pointer hover:bg-surface-50 transition-colors">
                    <input type="checkbox" checked={o.k} onChange={e => o.s(e.target.checked)} className="w-5 h-5 mt-0.5 accent-brand-500 rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-900 flex items-center gap-1.5">{i === 2 && <Lock className="w-3.5 h-3.5 text-amber-600" />}{i === 1 && <Sparkles className="w-3.5 h-3.5 text-brand-500" />}{i === 0 && <Shield className="w-3.5 h-3.5 text-emerald-600" />}{o.l}</p>
                      <p className="text-[11px] text-surface-500 mt-0.5">{o.d}</p>
                    </div>
                  </label>
                ))}
                {encrypt && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-8">
                    <input type="password" placeholder="设置打开密码..." value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-brand-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 bg-white" />
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-6 space-y-6 text-center">
              <div className="relative w-36 h-36 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" stroke="#EEF0F4" strokeWidth="10" fill="none" />
                  <circle cx="60" cy="60" r="50" stroke="url(#pg)" strokeWidth="10" fill="none" strokeLinecap="round"
                    strokeDasharray={314.159} strokeDashoffset={314.159 - (314.159 * progress) / 100} style={{ transition: 'stroke-dashoffset 0.15s ease' }} />
                  <defs><linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00D68F" /><stop offset="100%" stopColor="#0EA5E9" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {progress >= 100 ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"><Check className="w-8 h-8 text-white" /></motion.div>
                  ) : (
                    <><span className="font-display font-bold text-3xl text-brand-900 font-mono">{progress}%</span><span className="text-[10px] text-surface-400 mt-0.5">{phase}</span></>
                  )}
                </div>
              </div>
              {progress < 100 ? (
                <p className="text-sm font-medium text-surface-600">正在生成 <b>{formatInfo[format].name}</b> 文件，请稍候...</p>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <p className="font-display font-bold text-xl text-emerald-700">✓ 导出完成！</p>
                    <p className="text-xs text-surface-500 mt-1">文件已准备好下载 · 校验通过</p>
                  </div>
                  <div className="max-w-md mx-auto p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-sky-50 border border-emerald-200 text-left text-xs space-y-1.5">
                    {[
                      { l: '文件格式', v: format.toUpperCase() },
                      { l: '文件大小', v: formatInfo[format].size },
                      { l: '生成时间', v: new Date().toLocaleString('zh-CN') },
                      { l: '版本号', v: 'v3 (当前)' },
                      { l: 'ATS兼容性', v: `${formatInfo[format].ats}` },
                      { l: 'SHA-256校验', v: sha256Mock(new Date().toISOString() + format), cls: 'font-mono text-[10px]' },
                    ].map((r, i) => (
                      <div key={i} className="flex justify-between gap-4">
                        <span className="text-surface-500 shrink-0">{r.l}</span>
                        <span className={`font-mono text-brand-800 font-semibold text-right break-all ${r.cls || ''}`}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-surface-200 text-surface-600 text-sm font-medium hover:border-surface-300 transition-colors">关闭</button>
                    <button onClick={handleDownload} className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2">
                      <Download className="w-4 h-4" /> 📥 下载文件
                    </button>
                    <button onClick={() => alert('邮箱发送功能演示模式')} className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white text-sm font-medium hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> 📧 发送邮箱
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-surface-100 bg-surface-50/30 flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(s => (s - 1) as 1 | 2 | 3) : onClose()} className="px-4 py-2 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4" /> {step > 1 ? '上一步' : '取消'}
          </button>
          <div className="text-xs text-surface-400 font-mono">当前选择: {format.toUpperCase()} · {pageRange}</div>
          {step < 3 && (
            <button onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)} className="px-5 py-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white text-sm font-medium hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/25 flex items-center gap-1.5">
              {step === 2 ? '开始生成' : '下一步'} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function VersionDiffModal({ vA, vB, onClose }: { vA: string; vB: string; onClose: () => void }) {
  const stats = { added: 8, modified: 5, deleted: 2, total: 15 };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-gradient-to-r from-brand-900 to-brand-800 text-white">
          <div>
            <h3 className="font-display font-bold text-xl flex items-center gap-2"><GitCompare className="w-5 h-5" /> 版本对比 · {vB} ↔ {vA}</h3>
            <p className="text-xs text-brand-200/80 mt-0.5">共修改 <b className="font-mono text-gold-300">{stats.total}</b> 处 · 新增 <b className="text-emerald-300">{stats.added}</b> · 修改 <b className="text-amber-300">{stats.modified}</b> · 删除 <b className="text-red-300">{stats.deleted}</b></p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors flex items-center gap-1.5"><RotateCcw className="w-4 h-4" /> 恢复到 {vB}</button>
            <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden grid grid-cols-2 min-h-[400px]">
          <div className="border-r border-surface-100 flex flex-col">
            <div className="px-5 py-3 bg-surface-50 border-b border-surface-100"><p className="font-display font-semibold text-surface-400 text-sm">旧版本 · {vB}</p><p className="text-[10px] text-surface-300 font-mono">2026-06-05</p></div>
            <div className="p-5 overflow-auto text-xs leading-relaxed space-y-2.5 font-mono">
              <p className="text-surface-300 font-semibold not-italic font-body mb-1">【个人总结】</p>
              <p className="text-surface-600">5年互联网产品运营经验，熟悉用户增长和数据分析。</p>
              <p className="text-surface-300 font-semibold not-italic font-body mt-3 mb-1">【工作经历 · 字节跳动】</p>
              <p className="line-through text-red-500 bg-red-50 px-1.5 py-0.5 rounded">负责抖音DAU增长项目，月活提升5%</p>
              <p className="text-surface-600">主导用户留存策略优化。</p>
              <p className="text-surface-300 font-semibold not-italic font-body mt-3 mb-1">【项目经历】</p>
              <p className="text-surface-600">短视频内容运营项目，覆盖用户100万+</p>
              <p className="line-through text-red-500 bg-red-50 px-1.5 py-0.5 rounded">活动转化率提升12%</p>
            </div>
          </div>
          <div className="flex flex-col bg-gradient-to-br from-emerald-50/30 to-sky-50/30">
            <div className="px-5 py-3 bg-emerald-50/50 border-b border-emerald-100"><p className="font-display font-semibold text-emerald-700 text-sm">新版本 · {vA}（当前）</p><p className="text-[10px] text-emerald-500 font-mono">2026-06-12</p></div>
            <div className="p-5 overflow-auto text-xs leading-relaxed space-y-2.5 font-mono">
              <p className="text-surface-400 font-semibold not-italic font-body mb-1">【个人总结】</p>
              <p className="text-brand-900">5年互联网产品运营经验。<span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold not-italic">+ 具备从0到1搭建增长体系能力</span></p>
              <p className="text-surface-400 font-semibold not-italic font-body mt-3 mb-1">【工作经历 · 字节跳动】</p>
              <p className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold not-italic">+ 带领5人团队，月活提升15%</p>
              <p className="text-brand-900">主导用户留存策略优化。<span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold not-italic">+ 7日留存率从32%提升至45%</span></p>
              <p className="text-surface-400 font-semibold not-italic font-body mt-3 mb-1">【项目经历】</p>
              <p className="text-brand-900">短视频内容运营项目，覆盖用户100万+</p>
              <p className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold not-italic">+ 活动ROI达1:4.2，获年度最佳增长项目</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ThemePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { resume, setTheme } = useResumeStore();
  const getCur = () => themePresets.find(t => t.primaryColor === resume.theme.primaryColor)?.name || '自定义';
  return (
    <AnimatePresence>{open && (
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 p-5 overflow-auto">
        <div className="flex justify-between items-center mb-4"><h3 className="font-display font-bold text-brand-900">主题设置</h3><button onClick={onClose}><X className="w-4 h-4 text-surface-300 hover:text-brand-500" /></button></div>
        <div className="space-y-4">
          <div><p className="text-xs font-body text-surface-300 mb-2">色彩预设 · 当前: {getCur()}</p>
            <div className="grid grid-cols-3 gap-2">
              {themePresets.map((p) => (
                <button key={p.id} onClick={() => setTheme({ primaryColor: p.primaryColor, secondaryColor: p.secondaryColor, accentColor: p.accentColor })}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-surface-200 hover:border-brand-500 transition-colors">
                  <div className="flex gap-0.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primaryColor }} /><span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.secondaryColor }} /><span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.accentColor }} /></div>
                  <span className="text-[10px] font-body">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )}</AnimatePresence>
  );
}

export default function Editor() {
  const { resume, selectedTemplate, setTemplate, reorderSections, saveVersion } = useResumeStore();
  const [themeOpen, setThemeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [diffSel, setDiffSel] = useState<string[]>([]);
  const [diffOpen, setDiffOpen] = useState(false);
  const [toast, setToast] = useState('');
  const sectionIds = resume.sections.map((s) => s.id);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = sectionIds.indexOf(active.id as string);
      const newIdx = sectionIds.indexOf(over.id as string);
      const ids = [...sectionIds];
      ids.splice(oldIdx, 1); ids.splice(newIdx, 0, active.id as string);
      reorderSections(ids);
    }
  };
  const reDownload = (h: typeof exportHistory[0]) => {
    const blob = new Blob([`ResumeForge 历史文件重新下载\n${h.name}\n版本: ${h.version}\n时间: ${h.date}\n大小: ${h.size}\n校验: ${sha256Mock(h.id)}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = h.name; a.click(); URL.revokeObjectURL(url);
    showToast(`📥 已下载: ${h.name}`);
  };
  const toggleDiff = (v: string) => {
    setDiffSel(prev => {
      if (prev.includes(v)) return prev.filter(x => x !== v);
      if (prev.length >= 2) return [prev[1], v];
      return [...prev, v];
    });
  };
  const openDiff = () => { if (diffSel.length === 2) setDiffOpen(true); };

  return (
    <div className="h-full flex flex-col bg-surface-50/30">
      <div className="sticky top-0 z-40 bg-white border-b border-surface-200 px-4 py-2.5 flex items-center gap-3">
        <div className="flex-1 overflow-x-auto flex gap-2 py-1">
          {templates.map((t) => (
            <button key={t.id} onClick={() => setTemplate(t.id)} className={`shrink-0 px-3 py-2 rounded-lg border text-left transition-all ${selectedTemplate === t.id ? 'border-brand-500 shadow-md bg-brand-50' : 'border-surface-200 hover:border-surface-300'}`}>
              <p className="text-xs font-body font-semibold text-brand-900">{t.name}</p>
              <span className="text-[10px] text-surface-300 font-body">{t.category}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setPanelOpen(!panelOpen)} className="btn-ghost flex items-center gap-1.5 text-xs py-2" title="切换导出面板">
            {panelOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />} 导出面板
          </button>
          <button onClick={() => { saveVersion('手动保存'); showToast('✓ 版本已保存: v3'); }} className="btn-ghost flex items-center gap-1.5 text-xs py-2"><Save className="w-3.5 h-3.5" /> 保存版本</button>
          <button onClick={() => setThemeOpen(true)} className="btn-ghost flex items-center gap-1.5 text-xs py-2"><Palette className="w-3.5 h-3.5" /> 主题</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[360px] shrink-0 border-r border-surface-200 overflow-auto p-3 bg-white">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
              {resume.sections.map((s) => <SortableSection key={s.id} section={s} />)}
            </SortableContext>
          </DndContext>
        </div>

        <LivePreview />

        <AnimatePresence>
          {panelOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="shrink-0 border-l border-surface-200 bg-white overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 bg-gradient-to-r from-brand-50 to-sky-50">
                <div>
                  <h3 className="font-display font-bold text-brand-900 flex items-center gap-1.5"><Package className="w-4 h-4" /> 📦 导出中心</h3>
                  <p className="text-[10px] text-surface-400 mt-0.5">版本管理 · 格式导出 · 历史记录</p>
                </div>
                <button onClick={() => setPanelOpen(false)} className="w-7 h-7 rounded-lg hover:bg-white/80 flex items-center justify-center text-surface-400 hover:text-brand-600 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-800 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full font-medium">当前版本</span>
                    <span className="text-[10px] text-brand-200 font-mono">v3 · 最新</span>
                  </div>
                  <p className="font-display font-bold text-2xl font-mono">78<span className="text-lg font-normal text-brand-200 ml-0.5">%</span></p>
                  <p className="text-[11px] text-brand-200 mt-0.5">ATS通过率预估</p>
                  <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
                    <div><p className="text-brand-300/70">版本</p><p className="font-semibold font-mono">v3</p></div>
                    <div><p className="text-brand-300/70">已编辑</p><p className="font-semibold font-mono">15 处</p></div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-brand-900 mb-2.5 flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> 选择格式导出</p>
                  <div className="space-y-2">
                    {([
                      { f: 'pdf' as ExportFormat, n: 'PDF', c: 'from-red-500 to-rose-600', s: '247KB', a: '98%' },
                      { f: 'word' as ExportFormat, n: 'Word', c: 'from-blue-500 to-indigo-600', s: '32KB', a: '95%' },
                      { f: 'web' as ExportFormat, n: 'Web网页', c: 'from-emerald-500 to-teal-600', s: '125KB', a: '85%' },
                    ]).map(x => (
                      <button key={x.f} onClick={() => setExportOpen(true)} className="w-full p-3.5 rounded-xl border-2 border-surface-100 bg-white hover:border-brand-300 hover:bg-brand-50/30 transition-all flex items-center gap-3 text-left group">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${x.c} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                          {x.f === 'pdf' ? <FileDown className="w-5 h-5 text-white" /> : x.f === 'word' ? <FileText className="w-5 h-5 text-white" /> : <Globe className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-brand-900 text-sm">{x.n}</p>
                          <p className="text-[10px] text-surface-500">预计 {x.s} · ATS兼容 <b className="font-mono text-emerald-600">{x.a}</b></p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-semibold text-brand-900 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> 最近导出</p>
                    <span className="text-[10px] text-surface-400">共 {exportHistory.length} 条</span>
                  </div>
                  <div className="space-y-2">
                    {exportHistory.map(h => (
                      <div key={h.id} className="p-3 rounded-xl bg-surface-50/60 border border-surface-100 hover:bg-surface-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-brand-900 truncate">{h.name}</p>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-surface-400 flex-wrap">
                              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-surface-200">{h.version}</span>
                              <span className="uppercase font-mono">{h.format}</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{h.date.slice(5)}</span>
                            </div>
                          </div>
                          <button onClick={() => reDownload(h)} className="shrink-0 w-7 h-7 rounded-lg bg-white border border-surface-200 hover:border-brand-400 hover:bg-brand-50 flex items-center justify-center text-surface-400 hover:text-brand-600 transition-all" title="重新下载">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-semibold text-brand-900 flex items-center gap-1.5"><GitCompare className="w-3.5 h-3.5" /> 版本时间线</p>
                    {diffSel.length === 2 && (
                      <button onClick={openDiff} className="text-[10px] px-2.5 py-1 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors shadow-sm">对比选中</button>
                    )}
                  </div>
                  <div className="relative pl-5 space-y-3">
                    <div className="absolute left-2 top-1.5 bottom-1.5 w-px bg-gradient-to-b from-brand-500 via-brand-300 to-surface-200" />
                    {versionTimeline.map(v => {
                      const sel = diffSel.includes(v.v);
                      return (
                        <div key={v.v} className="relative">
                          <button onClick={() => toggleDiff(v.v)} className={`absolute -left-5 top-1 w-4 h-4 rounded-full border-2 transition-all ${v.active ? 'bg-brand-500 border-white shadow-md ring-2 ring-brand-500/30' : sel ? 'bg-emerald-500 border-white ring-2 ring-emerald-300' : 'bg-white border-surface-300 hover:border-brand-400'}`} />
                          <div onClick={() => toggleDiff(v.v)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${sel ? 'border-emerald-400 bg-emerald-50/50' : 'border-surface-100 bg-white hover:border-brand-200 hover:bg-brand-50/30'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-sm ${v.active ? 'text-brand-700' : 'text-surface-600'}`}>{v.v}</span>
                                {v.active && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-500 text-white font-bold">当前</span>}
                              </div>
                              <span className="font-mono text-[10px] text-surface-400">{v.date.slice(5)}</span>
                            </div>
                            <p className="text-[11px] text-brand-900 mb-1.5">{v.note}</p>
                            <div className="flex items-center gap-2 text-[10px] flex-wrap">
                              <span className="text-emerald-600 font-mono">+{v.changes.add}</span>
                              <span className="text-amber-600 font-mono">~{v.changes.mod}</span>
                              <span className="text-red-500 font-mono">-{v.changes.del}</span>
                              <span className="ml-auto font-bold text-brand-700 font-mono flex items-center gap-0.5"><Shield className="w-3 h-3" />ATS {v.ats}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-surface-400 mt-2.5 flex items-center gap-1"><Eye className="w-3 h-3" /> 点击两个版本选中后进行对比</p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
      <AnimatePresence>
        {exportOpen && <ExportWizard onClose={() => setExportOpen(false)} />}
        {diffOpen && diffSel.length === 2 && <VersionDiffModal vA={diffSel[0]} vB={diffSel[1]} onClose={() => { setDiffOpen(false); setDiffSel([]); }} />}
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-900 text-white px-5 py-2.5 rounded-xl shadow-xl text-sm font-body z-50">{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
