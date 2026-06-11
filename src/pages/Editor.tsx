import { useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical, ChevronDown, ChevronRight, Download, Save, Palette,
  Plus, FileDown, FileText, Globe, X,
} from 'lucide-react';
import { useResumeStore } from '@/stores/resumeStore';
import { templates, themePresets } from '@/data/mockTemplates';
import type { ResumeSection } from '@/types/resume';

const FIELD_LABELS: Record<string, Record<string, string>> = {
  summary: { content: '内容' },
  experience: { company: '公司', position: '职位', period: '时间', description: '描述', highlights: '亮点' },
  education: { school: '学校', major: '专业', degree: '学位', period: '时间', gpa: 'GPA' },
  skill: { category: '分类', items: '技能列表' },
  project: { name: '项目名', period: '时间', role: '角色', description: '描述', highlights: '亮点' },
};

const DEFAULT_FIELDS: Record<string, Record<string, string | string[]>> = {
  summary: { content: '' },
  experience: { company: '', position: '', period: '', description: '', highlights: [] },
  education: { school: '', major: '', degree: '', period: '', gpa: '' },
  skill: { category: '', items: '' },
  project: { name: '', period: '', role: '', description: '', highlights: [] },
};

function SortableSection({ section }: { section: ResumeSection }) {
  const { toggleSectionCollapse, updateItem, addItem, activeSection, setActiveSection } = useResumeStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isActive = activeSection === section.id;
  const labels = FIELD_LABELS[section.type] || {};

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white rounded-lg border mb-2 transition-colors ${isActive ? 'border-brand-500 shadow-md' : 'border-surface-200'}`}>
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onClick={() => setActiveSection(isActive ? null : section.id)}>
        <button {...attributes} {...listeners} className="cursor-grab text-surface-300 hover:text-brand-500"
          onClick={(e) => e.stopPropagation()}>
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="font-body font-semibold text-sm text-brand-900 flex-1">{section.title}</span>
        <button className="text-surface-300 hover:text-brand-500"
          onClick={(e) => { e.stopPropagation(); toggleSectionCollapse(section.id); }}>
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
                    <textarea className="w-full text-xs border border-surface-200 rounded px-2 py-1.5 font-body resize-none focus:outline-none focus:border-brand-500"
                      rows={2} value={typeof value === 'string' ? value : value.join('\n')}
                      onChange={(e) => updateItem(section.id, item.id, { [key]: e.target.value })} />
                  ) : key === 'highlights' ? (
                    <textarea className="w-full text-xs border border-surface-200 rounded px-2 py-1.5 font-body resize-none focus:outline-none focus:border-brand-500"
                      rows={2} value={Array.isArray(value) ? value.join('\n') : String(value)}
                      onChange={(e) => updateItem(section.id, item.id, { [key]: e.target.value.split('\n').filter(Boolean) })} />
                  ) : (
                    <input className="w-full text-xs border border-surface-200 rounded px-2 py-1.5 font-body focus:outline-none focus:border-brand-500"
                      value={typeof value === 'string' ? value : String(value)}
                      onChange={(e) => updateItem(section.id, item.id, { [key]: e.target.value })} />
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
    '--resume-primary': theme.primaryColor, '--resume-secondary': theme.secondaryColor,
    '--resume-accent': theme.accentColor, '--resume-font-heading': theme.fontHeading,
    '--resume-font-body': theme.fontBody, '--resume-font-size': `${theme.fontSize}px`,
    '--resume-line-height': String(theme.lineHeight), '--resume-section-spacing': `${theme.sectionSpacing}px`,
  } as React.CSSProperties;

  return (
    <div className="flex-1 overflow-auto p-6 flex justify-center bg-surface-100" style={cssVars}>
      <div className="bg-white shadow-xl rounded-lg w-full max-w-[595px] min-h-[842px] resume-preview p-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--resume-font-heading)', color: 'var(--resume-primary)' }}>
          {resume.title}
        </h1>
        <div className="w-16 h-1 mb-6 rounded" style={{ backgroundColor: 'var(--resume-secondary)' }} />
        {sections.map((section) => (
          <div key={section.id} className="section-spacing" style={{ borderLeft: `3px solid var(--resume-secondary)`, paddingLeft: 12 }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--resume-primary)', fontFamily: 'var(--resume-font-heading)' }}>
              {section.title}
            </h2>
            {section.items.map((item) => (
              <div key={item.id} className="mb-2">
                {section.type === 'summary' && <p className="text-xs">{String(item.fields.content ?? '')}</p>}
                {section.type === 'experience' && (
                  <>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-semibold">{String(item.fields.company ?? '')}</span>
                      <span className="text-[10px] text-gray-500">{String(item.fields.period ?? '')}</span>
                    </div>
                    <p className="text-[10px] text-gray-600">{String(item.fields.position ?? '')}</p>
                    <p className="text-[10px] mt-1">{String(item.fields.description ?? '')}</p>
                    {Array.isArray(item.fields.highlights) && (
                      <ul className="mt-1 pl-3">{(item.fields.highlights as string[]).map((h, i) => <li key={i} className="text-[10px] list-disc">{h}</li>)}</ul>
                    )}
                  </>
                )}
                {section.type === 'education' && (
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold">{String(item.fields.school ?? '')} · {String(item.fields.major ?? '')}</span>
                    <span className="text-[10px] text-gray-500">{String(item.fields.period ?? '')}</span>
                  </div>
                )}
                {section.type === 'skill' && (
                  <p className="text-[10px]"><span className="font-semibold">{String(item.fields.category ?? '')}：</span>{String(item.fields.items ?? '')}</p>
                )}
                {section.type === 'project' && (
                  <>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-semibold">{String(item.fields.name ?? '')}</span>
                      <span className="text-[10px] text-gray-500">{String(item.fields.period ?? '')}</span>
                    </div>
                    <p className="text-[10px] text-gray-600">{String(item.fields.role ?? '')}</p>
                    {Array.isArray(item.fields.highlights) && (
                      <ul className="mt-1 pl-3">{(item.fields.highlights as string[]).map((h, i) => <li key={i} className="text-[10px] list-disc">{h}</li>)}</ul>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { resume, setTheme } = useResumeStore();
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed right-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 p-5 overflow-auto">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-display font-bold text-brand-900">主题设置</h3>
            <button onClick={onClose}><X className="w-4 h-4 text-surface-300 hover:text-brand-500" /></button>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-body text-surface-300 mb-2">色彩预设</p>
              <div className="grid grid-cols-3 gap-2">
                {themePresets.map((p) => (
                  <button key={p.id}
                    onClick={() => setTheme({ primaryColor: p.primaryColor, secondaryColor: p.secondaryColor, accentColor: p.accentColor })}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-surface-200 hover:border-brand-500 transition-colors">
                    <div className="flex gap-0.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primaryColor }} />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.secondaryColor }} />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.accentColor }} />
                    </div>
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
      )}
    </AnimatePresence>
  );
}

export default function Editor() {
  const { resume, selectedTemplate, setTemplate, reorderSections, saveVersion } = useResumeStore();
  const [themeOpen, setThemeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState('');
  const sectionIds = resume.sections.map((s) => s.id);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = sectionIds.indexOf(active.id as string);
      const newIdx = sectionIds.indexOf(over.id as string);
      const ids = [...sectionIds];
      ids.splice(oldIdx, 1);
      ids.splice(newIdx, 0, active.id as string);
      reorderSections(ids);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-40 bg-white border-b border-surface-200 px-4 py-2.5 flex items-center gap-3">
        <div className="flex-1 overflow-x-auto flex gap-2 py-1">
          {templates.map((t) => (
            <button key={t.id} onClick={() => setTemplate(t.id)}
              className={`shrink-0 px-3 py-2 rounded-lg border text-left transition-all ${selectedTemplate === t.id ? 'border-brand-500 shadow-md bg-brand-50' : 'border-surface-200 hover:border-surface-300'}`}>
              <p className="text-xs font-body font-semibold text-brand-900">{t.name}</p>
              <span className="text-[10px] text-surface-300 font-body">{t.category}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button onClick={() => setExportOpen(!exportOpen)} className="btn-ghost flex items-center gap-1.5 text-xs py-2">
              <Download className="w-3.5 h-3.5" /> 导出
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-surface-200 py-1 w-32 z-50">
                <button onClick={() => { setExportOpen(false); showToast('正在导出PDF...'); }} className="w-full px-3 py-2 text-xs font-body hover:bg-surface-50 flex items-center gap-2"><FileDown className="w-3.5 h-3.5" />PDF</button>
                <button onClick={() => { setExportOpen(false); showToast('正在导出Word...'); }} className="w-full px-3 py-2 text-xs font-body hover:bg-surface-50 flex items-center gap-2"><FileText className="w-3.5 h-3.5" />Word</button>
                <button onClick={() => { setExportOpen(false); showToast('正在导出Web...'); }} className="w-full px-3 py-2 text-xs font-body hover:bg-surface-50 flex items-center gap-2"><Globe className="w-3.5 h-3.5" />Web</button>
              </div>
            )}
          </div>
          <button onClick={() => { saveVersion('手动保存'); showToast('版本已保存'); }} className="btn-ghost flex items-center gap-1.5 text-xs py-2">
            <Save className="w-3.5 h-3.5" /> 保存版本
          </button>
          <button onClick={() => setThemeOpen(true)} className="btn-ghost flex items-center gap-1.5 text-xs py-2">
            <Palette className="w-3.5 h-3.5" /> 主题
          </button>
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

      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-900 text-white px-5 py-2.5 rounded-lg shadow-xl text-sm font-body z-50">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
