import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical, ChevronDown, ChevronRight, Download, Save, Palette,
  Plus, FileDown, FileText, Globe, X, GitCompare, RotateCcw, Check,
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
                  {Array.isArray(item.fields.highlights) && <ul className="mt-1 pl-3">{(item.fields.highlights as string[]).map((h, i) => <li key={i} className="text-[10px] list-disc">{h}</li>)}</ul>}
                </>)}
                {section.type === 'education' && <div className="flex justify-between"><span className="text-xs font-semibold">{String(item.fields.school ?? '')} · {String(item.fields.major ?? '')}</span><span className="text-[10px] text-gray-500">{String(item.fields.period ?? '')}</span></div>}
                {section.type === 'skill' && <p className="text-[10px]"><span className="font-semibold">{String(item.fields.category ?? '')}：</span>{String(item.fields.items ?? '')}</p>}
                {section.type === 'project' && (<>
                  <div className="flex justify-between items-baseline"><span className="text-xs font-semibold">{String(item.fields.name ?? '')}</span><span className="text-[10px] text-gray-500">{String(item.fields.period ?? '')}</span></div>
                  <p className="text-[10px] text-gray-600">{String(item.fields.role ?? '')}</p>
                  {Array.isArray(item.fields.highlights) && <ul className="mt-1 pl-3">{(item.fields.highlights as string[]).map((h, i) => <li key={i} className="text-[10px] list-disc">{h}</li>)}</ul>}
                </>)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportModal({ format, onClose }: { format: ExportFormat; onClose: () => void }) {
  const [step, setStep] = useState<'options' | 'progress' | 'done'>('options');
  const [progress, setProgress] = useState(0);
  const [pageRange, setPageRange] = useState('all');
  const [includeVersion, setIncludeVersion] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [resolution, setResolution] = useState<'standard' | 'high'>('standard');
  const timerRef = useRef<number | null>(null);
  const titles: Record<ExportFormat, string> = { pdf: '导出为 PDF', word: '导出为 Word', web: '导出为 网页' };
  const formatLabels: Record<ExportFormat, string> = { pdf: 'PDF', word: 'Word', web: 'HTML' };
  const handleExport = () => {
    setStep('progress'); setProgress(0);
    timerRef.current = window.setInterval(() => {
      setProgress((p) => { if (p >= 100) { if (timerRef.current) clearInterval(timerRef.current); setStep('done'); return 100; } return p + 2; });
    }, 30);
  };
  const handleDownload = () => {
    const content = `ResumeForge Export\nFormat: ${formatLabels[format]}\nPages: ${pageRange}\nVersion: ${includeVersion}\nWatermark: ${addWatermark}\n${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `resume-export.${format === 'web' ? 'html' : format}`; a.click();
    URL.revokeObjectURL(url);
  };
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <h3 className="font-display font-bold text-brand-900 text-lg">{titles[format]}</h3>
          <button onClick={onClose} className="text-surface-300 hover:text-brand-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          {step === 'options' && (
            <div className="space-y-4">
              <div className="w-full h-32 bg-surface-50 rounded-lg border border-surface-100 flex items-center justify-center">
                <div className="w-16 h-24 bg-white shadow rounded border border-surface-200 flex flex-col gap-1 p-1.5">
                  <div className="h-2 w-10 bg-brand-500/30 rounded" /><div className="h-1 w-full bg-surface-100 rounded" /><div className="h-1 w-3/4 bg-surface-100 rounded" /><div className="h-1 w-5/6 bg-surface-100 rounded mt-1.5" />
                </div>
              </div>
              <div><p className="text-xs font-body font-medium text-brand-900 mb-2">页码范围</p>
                <div className="flex gap-2">
                  {['all', '1-2', 'custom'].map((r) => (
                    <button key={r} onClick={() => setPageRange(r)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${pageRange === r ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-surface-200 text-surface-400 hover:border-surface-300'}`}>
                      {r === 'all' ? '全部' : r === '1-2' ? '第1-2页' : '自定义'}
                    </button>
                  ))}
                </div>
              </div>
              {format === 'pdf' && (
                <div><p className="text-xs font-body font-medium text-brand-900 mb-2">分辨率</p>
                  <div className="flex gap-2">
                    {[{ k: 'standard', l: '标准' }, { k: 'high', l: '高清' }].map((r) => (
                      <button key={r.k} onClick={() => setResolution(r.k as typeof resolution)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${resolution === r.k ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-surface-200 text-surface-400 hover:border-surface-300'}`}>{r.l}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer"><input type="checkbox" checked={includeVersion} onChange={(e) => setIncludeVersion(e.target.checked)} className="w-4 h-4 accent-brand-500 rounded" /><span className="text-xs font-body text-surface-600">包含版本号</span></label>
                <label className="flex items-center gap-2.5 cursor-pointer"><input type="checkbox" checked={addWatermark} onChange={(e) => setAddWatermark(e.target.checked)} className="w-4 h-4 accent-brand-500 rounded" /><span className="text-xs font-body text-surface-600">添加水印</span></label>
              </div>
              <button onClick={handleExport} className="w-full btn-primary py-2 text-sm flex items-center justify-center gap-2"><Download className="w-4 h-4" /> 开始导出</button>
            </div>
          )}
          {step === 'progress' && (
            <div className="py-6 space-y-3 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-brand-50 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
              </div>
              <p className="font-display font-semibold text-brand-900 text-sm">正在生成{formatLabels[format]}...</p>
              <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden"><motion.div className="h-full bg-brand-500 rounded-full" style={{ width: `${progress}%` }} /></div>
              <p className="text-center text-xs font-mono text-surface-400">{progress}%</p>
            </div>
          )}
          {step === 'done' && (
            <div className="py-5 space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-500/10 flex items-center justify-center"><Check className="w-6 h-6 text-brand-500" /></div>
              <div><p className="font-display font-bold text-brand-900">✓ 导出完成</p><p className="text-xs font-body text-surface-400 mt-0.5">文件已准备好下载</p></div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2 text-sm font-medium rounded-lg border border-surface-200 text-surface-500 hover:border-brand-300 hover:text-brand-500 transition-colors">继续编辑</button>
                <button onClick={handleDownload} className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2"><FileDown className="w-4 h-4" /> 下载文件</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function VersionDiffModal({ onClose }: { onClose: () => void }) {
  const stats = { added: 8, modified: 5, deleted: 2, total: 15 };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-surface-100">
          <div><h3 className="font-display font-bold text-brand-900">版本对比</h3><p className="text-xs font-body text-surface-400">本次修改 {stats.total} 处: 新增 {stats.added}, 修改 {stats.modified}, 删除 {stats.deleted}</p></div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 text-amber-600 border border-amber-200"><RotateCcw className="w-3.5 h-3.5" /> 恢复到上一版本</button>
            <button onClick={onClose} className="text-surface-300 hover:text-brand-500"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 flex-1 overflow-hidden text-xs font-body">
          <div className="border-r border-surface-100 flex flex-col">
            <div className="px-4 py-2 bg-surface-50 border-b border-surface-100"><p className="font-display font-semibold text-surface-400">上一版本 · v2</p><p className="text-[10px] text-surface-300">2026-06-05</p></div>
            <div className="p-4 overflow-auto text-surface-500 space-y-2 leading-relaxed">
              <p className="text-surface-300">【个人总结】</p><p>5年互联网产品运营经验，熟悉用户增长和数据分析。</p>
              <p className="text-surface-300 mt-2">【工作经历 · 字节跳动】</p>
              <p><span className="line-through text-red-500 bg-red-50">负责抖音DAU增长项目，月活提升5%</span></p><p>主导用户留存策略优化。</p>
              <p className="text-surface-300 mt-2">【项目经历】</p><p>短视频内容运营项目，覆盖用户100万+</p>
              <p><span className="line-through text-red-500 bg-red-50">活动转化率提升12%</span></p>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="px-4 py-2 bg-brand-50/50 border-b border-brand-100"><p className="font-display font-semibold text-brand-600">当前版本 · v3</p><p className="text-[10px] text-brand-400">2026-06-10</p></div>
            <div className="p-4 overflow-auto text-brand-900 space-y-2 leading-relaxed">
              <p className="text-surface-400">【个人总结】</p><p>5年互联网产品运营经验。<span className="bg-green-100 text-green-700 px-1 rounded">具备从0到1搭建增长体系能力</span></p>
              <p className="text-surface-400 mt-2">【工作经历 · 字节跳动】</p>
              <p><span className="bg-green-100 text-green-700 px-1 rounded">带领5人团队，月活提升15%</span></p>
              <p>主导用户留存策略优化。<span className="bg-green-100 text-green-700 px-1 rounded">7日留存率从32%提升至45%</span></p>
              <p className="text-surface-400 mt-2">【项目经历】</p><p>短视频内容运营项目，覆盖用户100万+</p>
              <p><span className="bg-green-100 text-green-700 px-1 rounded">活动ROI达1:4.2，获年度最佳增长项目</span></p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ThemePanel({ open, onClose, onThemeChange }: { open: boolean; onClose: () => void; onThemeChange: (from: string, to: string) => void }) {
  const { resume, setTheme } = useResumeStore();
  const getCur = () => themePresets.find(t => t.primaryColor === resume.theme.primaryColor)?.name || '自定义';
  return (
    <AnimatePresence>{open && (
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 p-5 overflow-auto">
        <div className="flex justify-between items-center mb-4"><h3 className="font-display font-bold text-brand-900">主题设置</h3><button onClick={onClose}><X className="w-4 h-4 text-surface-300 hover:text-brand-500" /></button></div>
        <div className="space-y-4">
          <div><p className="text-xs font-body text-surface-300 mb-2">色彩预设</p>
            <div className="grid grid-cols-3 gap-2">
              {themePresets.map((p) => (
                <button key={p.id} onClick={() => { const from = getCur(); setTheme({ primaryColor: p.primaryColor, secondaryColor: p.secondaryColor, accentColor: p.accentColor }); onThemeChange(from, p.name); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-surface-200 hover:border-brand-500 transition-colors">
                  <div className="flex gap-0.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primaryColor }} /><span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.secondaryColor }} /><span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.accentColor }} /></div>
                  <span className="text-[10px] font-body">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div><p className="text-xs font-body text-surface-300 mb-1">字体大小：{resume.theme.fontSize}px</p><input type="range" min={10} max={18} value={resume.theme.fontSize} onChange={(e) => setTheme({ fontSize: +e.target.value })} className="w-full accent-brand-500" /></div>
          <div><p className="text-xs font-body text-surface-300 mb-1">行高：{resume.theme.lineHeight}</p><input type="range" min={1.2} max={2.0} step={0.1} value={resume.theme.lineHeight} onChange={(e) => setTheme({ lineHeight: +e.target.value })} className="w-full accent-brand-500" /></div>
          <div><p className="text-xs font-body text-surface-300 mb-1">段落间距：{resume.theme.sectionSpacing}px</p><input type="range" min={8} max={28} value={resume.theme.sectionSpacing} onChange={(e) => setTheme({ sectionSpacing: +e.target.value })} className="w-full accent-brand-500" /></div>
        </div>
      </motion.div>
    )}</AnimatePresence>
  );
}

export default function Editor() {
  const { resume, selectedTemplate, setTemplate, reorderSections, saveVersion } = useResumeStore();
  const [themeOpen, setThemeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [themeBadge, setThemeBadge] = useState('');
  const sectionIds = resume.sections.map((s) => s.id);
  const badgeTimerRef = useRef<number | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };
  const handleThemeChange = (from: string, to: string) => {
    setThemeBadge(`已切换主题: ${from} → ${to}`);
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    badgeTimerRef.current = window.setTimeout(() => setThemeBadge(''), 1500);
  };
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
  return (
    <div className="h-full flex flex-col">
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
          <button onClick={() => setDiffOpen(true)} className="btn-ghost flex items-center gap-1.5 text-xs py-2"><GitCompare className="w-3.5 h-3.5" /> 版本对比</button>
          <div className="relative">
            <button onClick={() => setExportOpen(!exportOpen)} className="btn-ghost flex items-center gap-1.5 text-xs py-2"><Download className="w-3.5 h-3.5" /> 导出</button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-surface-200 py-1 w-32 z-50">
                <button onClick={() => { setExportOpen(false); setExportFormat('pdf'); }} className="w-full px-3 py-2 text-xs font-body hover:bg-surface-50 flex items-center gap-2"><FileDown className="w-3.5 h-3.5" />PDF</button>
                <button onClick={() => { setExportOpen(false); setExportFormat('word'); }} className="w-full px-3 py-2 text-xs font-body hover:bg-surface-50 flex items-center gap-2"><FileText className="w-3.5 h-3.5" />Word</button>
                <button onClick={() => { setExportOpen(false); setExportFormat('web'); }} className="w-full px-3 py-2 text-xs font-body hover:bg-surface-50 flex items-center gap-2"><Globe className="w-3.5 h-3.5" />Web</button>
              </div>
            )}
          </div>
          <button onClick={() => { saveVersion('手动保存'); showToast('版本已保存'); }} className="btn-ghost flex items-center gap-1.5 text-xs py-2"><Save className="w-3.5 h-3.5" /> 保存版本</button>
          <button onClick={() => setThemeOpen(true)} className="btn-ghost flex items-center gap-1.5 text-xs py-2"><Palette className="w-3.5 h-3.5" /> 主题</button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[380px] shrink-0 border-r border-surface-200 overflow-auto p-3">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
              {resume.sections.map((s) => <SortableSection key={s.id} section={s} />)}
            </SortableContext>
          </DndContext>
        </div>
        <LivePreview />
      </div>
      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} onThemeChange={handleThemeChange} />
      <AnimatePresence>
        {exportFormat && <ExportModal format={exportFormat} onClose={() => setExportFormat(null)} />}
        {diffOpen && <VersionDiffModal onClose={() => setDiffOpen(false)} />}
        {themeBadge && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-1/2 -translate-x-1/2 bg-brand-900 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-body z-50 flex items-center gap-2">
            <Palette className="w-3.5 h-3.5" /> {themeBadge}
          </motion.div>
        )}
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-900 text-white px-5 py-2.5 rounded-lg shadow-xl text-sm font-body z-50">{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
