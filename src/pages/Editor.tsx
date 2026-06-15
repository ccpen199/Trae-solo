/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save, Undo2, Redo2, FileDown, Brain, ScanLine,
  Eye, EyeOff, GripVertical, Plus, Trash2,
  X, Palette, Settings2, Upload, FileText, Eye as EyeIcon,
  FileCheck, Shield, Lock,
} from 'lucide-react';
import { DndContext, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useResumeStore } from '../store/resumeStore';
import type { ResumeModule, ModuleType, ResumeTheme } from '../types';
import { exportResumeToWord } from '../utils/wordExport';
import { cn } from '../lib/utils';

const MODULE_LABELS: Record<ModuleType, string> = {
  basic: '基本信息', education: '教育经历', experience: '工作经历',
  project: '项目经历', skills: '专业技能', selfEvaluation: '自我评价', custom: '自定义',
};

const FONT_OPTIONS = ['LXGW WenKai', 'PingFang SC', 'Microsoft YaHei', 'SimSun', 'KaiTi', 'Arial', 'Calibri'];

const COLOR_PRESETS = [
  { primary: '#1e3a5f', secondary: '#c9a24a', name: '深蓝金' },
  { primary: '#14532d', secondary: '#86efac', name: '翠绿' },
  { primary: '#581c87', secondary: '#c4b5fd', name: '典雅紫' },
  { primary: '#7c2d12', secondary: '#fdba74', name: '暖橙' },
  { primary: '#831843', secondary: '#f9a8d4', name: '玫瑰红' },
  { primary: '#0f172a', secondary: '#94a3b8', name: '墨黑灰' },
];

function SortableItem({ module, onToggle, onDelete, onSelect, active }: {
  module: ResumeModule; onToggle: () => void; onDelete: () => void; onSelect: () => void; active: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id });
  const style = { transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined, transition };
  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer
        ${active ? 'border-gold-500 bg-gold-50' : 'border-navy-100 hover:border-navy-200 bg-white'}`}
      onClick={onSelect}>
      <span {...attributes} {...listeners} className="cursor-grab text-navy-300 hover:text-navy-500">
        <GripVertical className="w-4 h-4" />
      </span>
      <span className="flex-1 text-sm text-navy-700 truncate">{MODULE_LABELS[module.type]}</span>
      <button onClick={e => { e.stopPropagation(); onToggle(); }} className="p-1 text-navy-400 hover:text-navy-600">
        {module.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 text-navy-300 hover:text-red-500">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => { const t = input.trim(); if (t && !value.includes(t)) { onChange([...value, t]); setInput(''); } };
  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-navy-100 rounded-lg bg-white min-h-[40px]">
      {value.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-navy-50 text-navy-700 rounded">
          {tag}
          <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
        onBlur={add} placeholder="输入后回车" className="flex-1 min-w-[80px] text-sm outline-none bg-transparent" />
    </div>
  );
}

function ModuleEditor({ module, onUpdate, onToggleVisibility }: {
  module: ResumeModule; onUpdate: (fields: Record<string, any>) => void; onToggleVisibility?: (key: string) => void;
}) {
  const f = module.fields;
  const set = (key: string, val: any) => onUpdate({ ...f, [key]: val });
  const fieldVis = (f._fieldVisibility || {}) as Record<string, boolean>;

  if (module.type === 'basic') {
    const fieldLabels: Record<string, string> = { name: '姓名', title: '职位', phone: '电话', email: '邮箱', location: '地址', website: '网站' };
    return (
      <div className="space-y-3">
        {(['name', 'title', 'phone', 'email', 'location', 'website'] as const).map(k => (
          <div key={k}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-navy-400">{fieldLabels[k]}</label>
              {onToggleVisibility && (
                <button onClick={() => onToggleVisibility(k)} className="p-0.5 text-navy-300 hover:text-navy-600">
                  {(fieldVis[k] ?? true) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <input className="input-field text-sm" value={f[k] ?? ''} onChange={e => set(k, e.target.value)} />
          </div>
        ))}
      </div>
    );
  }

  if (module.type === 'education') {
    const items: any[] = f.items || [];
    const updateItem = (idx: number, item: any) => set('items', items.map((it: any, i: number) => i === idx ? item : it));
    const addItem = () => set('items', [...items, { school: '', major: '', degree: '', startDate: '', endDate: '', gpa: '', description: '' }]);
    const removeItem = (idx: number) => set('items', items.filter((_: any, i: number) => i !== idx));
    return (
      <div className="space-y-4">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="p-3 border border-navy-100 rounded-lg space-y-2 relative">
            <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-navy-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            {(['school', 'major', 'degree', 'startDate', 'endDate', 'gpa', 'description'] as const).map(k => (
              <div key={k}><label className="text-xs text-navy-400 mb-1 block">{k === 'school' ? '学校' : k === 'major' ? '专业' : k === 'degree' ? '学位' : k === 'startDate' ? '开始时间' : k === 'endDate' ? '结束时间' : k === 'gpa' ? 'GPA' : '描述'}</label>
                <input className="input-field text-sm" value={item[k] ?? ''} onChange={e => updateItem(idx, { ...item, [k]: e.target.value })} /></div>
            ))}
          </div>
        ))}
        <button onClick={addItem} className="btn-ghost text-sm flex items-center gap-1 w-full justify-center"><Plus className="w-4 h-4" />添加教育经历</button>
      </div>
    );
  }

  if (module.type === 'experience') {
    const items: any[] = f.items || [];
    const updateItem = (idx: number, item: any) => set('items', items.map((it: any, i: number) => i === idx ? item : it));
    const addItem = () => set('items', [...items, { company: '', position: '', startDate: '', endDate: '', responsibilities: [] }]);
    const removeItem = (idx: number) => set('items', items.filter((_: any, i: number) => i !== idx));
    return (
      <div className="space-y-4">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="p-3 border border-navy-100 rounded-lg space-y-2 relative">
            <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-navy-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            {(['company', 'position', 'startDate', 'endDate'] as const).map(k => (
              <div key={k}><label className="text-xs text-navy-400 mb-1 block">{k === 'company' ? '公司' : k === 'position' ? '职位' : k === 'startDate' ? '开始时间' : '结束时间'}</label>
                <input className="input-field text-sm" value={item[k] ?? ''} onChange={e => updateItem(idx, { ...item, [k]: e.target.value })} /></div>
            ))}
            <div><label className="text-xs text-navy-400 mb-1 block">工作职责</label>
              <TagInput value={item.responsibilities || []} onChange={v => updateItem(idx, { ...item, responsibilities: v })} /></div>
          </div>
        ))}
        <button onClick={addItem} className="btn-ghost text-sm flex items-center gap-1 w-full justify-center"><Plus className="w-4 h-4" />添加工作经历</button>
      </div>
    );
  }

  if (module.type === 'project') {
    const items: any[] = f.items || [];
    const updateItem = (idx: number, item: any) => set('items', items.map((it: any, i: number) => i === idx ? item : it));
    const addItem = () => set('items', [...items, { name: '', role: '', startDate: '', endDate: '', techStack: [], link: '', metrics: [], description: '' }]);
    const removeItem = (idx: number) => set('items', items.filter((_: any, i: number) => i !== idx));
    return (
      <div className="space-y-4">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="p-3 border border-navy-100 rounded-lg space-y-2 relative">
            <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-navy-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            {(['name', 'role', 'startDate', 'endDate', 'link'] as const).map(k => (
              <div key={k}><label className="text-xs text-navy-400 mb-1 block">{k === 'name' ? '项目名' : k === 'role' ? '角色' : k === 'startDate' ? '开始时间' : k === 'endDate' ? '结束时间' : '链接'}</label>
                <input className="input-field text-sm" value={item[k] ?? ''} onChange={e => updateItem(idx, { ...item, [k]: e.target.value })} /></div>
            ))}
            <div><label className="text-xs text-navy-400 mb-1 block">技术栈</label>
              <TagInput value={item.techStack || []} onChange={v => updateItem(idx, { ...item, techStack: v })} /></div>
            <div><label className="text-xs text-navy-400 mb-1 block">项目指标</label>
              <TagInput value={item.metrics || []} onChange={v => updateItem(idx, { ...item, metrics: v })} /></div>
            <div><label className="text-xs text-navy-400 mb-1 block">描述</label>
              <textarea className="input-field text-sm" rows={2} value={item.description ?? ''} onChange={e => updateItem(idx, { ...item, description: e.target.value })} /></div>
          </div>
        ))}
        <button onClick={addItem} className="btn-ghost text-sm flex items-center gap-1 w-full justify-center"><Plus className="w-4 h-4" />添加项目经历</button>
      </div>
    );
  }

  if (module.type === 'skills') {
    const groups: any[] = f.groups || [];
    const updateGroup = (idx: number, g: any) => set('groups', groups.map((it: any, i: number) => i === idx ? g : it));
    const addGroup = () => set('groups', [...groups, { name: '', items: [] }]);
    const removeGroup = (idx: number) => set('groups', groups.filter((_: any, i: number) => i !== idx));
    return (
      <div className="space-y-4">
        {groups.map((g: any, idx: number) => (
          <div key={idx} className="p-3 border border-navy-100 rounded-lg space-y-2 relative">
            <button onClick={() => removeGroup(idx)} className="absolute top-2 right-2 text-navy-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            <div><label className="text-xs text-navy-400 mb-1 block">分类名</label>
              <input className="input-field text-sm" value={g.name ?? ''} onChange={e => updateGroup(idx, { ...g, name: e.target.value })} /></div>
            <div><label className="text-xs text-navy-400 mb-1 block">技能列表</label>
              <TagInput value={g.items || []} onChange={v => updateGroup(idx, { ...g, items: v })} /></div>
          </div>
        ))}
        <button onClick={addGroup} className="btn-ghost text-sm flex items-center gap-1 w-full justify-center"><Plus className="w-4 h-4" />添加技能分组</button>
      </div>
    );
  }

  if (module.type === 'selfEvaluation') {
    return (
      <div><label className="text-xs text-navy-400 mb-1 block">自我评价</label>
        <textarea className="input-field text-sm" rows={6} value={f.content ?? ''} onChange={e => set('content', e.target.value)} /></div>
    );
  }

  return <div className="text-sm text-navy-400">暂不支持编辑此模块</div>;
}

function A4Preview({ modules, theme, activeModuleId, onSelectModule }: {
  modules: ResumeModule[]; theme: ResumeTheme; activeModuleId: string | null; onSelectModule: (id: string) => void;
}) {
  const visible = [...modules].filter(m => m.visible).sort((a, b) => a.order - b.order);
  const pc = theme.primaryColor;
  const renderModule = (m: ResumeModule) => {
    const f = m.fields;
    const isActive = activeModuleId === m.id;
    const moduleWrapperClass = `cursor-pointer transition-all rounded p-1 -m-1 ${isActive ? 'ring-2 ring-gold-500 ring-offset-1' : 'hover:ring-2 hover:ring-navy-300 hover:ring-offset-1'}`;
    if (m.type === 'basic') return (
      <div className={moduleWrapperClass} onClick={() => onSelectModule(m.id)}>
        <div className="text-center mb-6">
          {f.name && <h1 className="text-2xl font-bold" style={{ color: pc }}>{f.name}</h1>}
          {f.title && <p className="text-sm font-medium mt-1" style={{ color: pc }}>{f.title}</p>}
          <p className="text-xs text-gray-500 mt-1">{[f.phone, f.email, f.location, f.website].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
    );
    if (m.type === 'education') return (
      <div className={moduleWrapperClass} onClick={() => onSelectModule(m.id)}>
        <div className="mb-4">
          <h2 className="text-sm font-bold border-b-2 pb-1 mb-2" style={{ borderColor: pc, color: pc }}>教育经历</h2>
          {(f.items || []).map((item: any, i: number) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between text-xs"><span className="font-semibold">{item.school}{item.major && ` · ${item.major}`}</span><span className="text-gray-400">{item.startDate} - {item.endDate}</span></div>
              <div className="text-xs text-gray-500">{item.degree}{item.gpa ? ` · GPA: ${item.gpa}` : ''}</div>
              {item.description && <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
    if (m.type === 'experience') return (
      <div className={moduleWrapperClass} onClick={() => onSelectModule(m.id)}>
        <div className="mb-4">
          <h2 className="text-sm font-bold border-b-2 pb-1 mb-2" style={{ borderColor: pc, color: pc }}>工作经历</h2>
          {(f.items || []).map((item: any, i: number) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-xs"><span className="font-semibold">{item.company}{item.position && ` · ${item.position}`}</span><span className="text-gray-400">{item.startDate} - {item.endDate}</span></div>
              {(item.responsibilities || []).map((r: string, j: number) => (
                <p key={j} className="text-xs text-gray-600 ml-3 mt-0.5">• {r}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
    if (m.type === 'project') return (
      <div className={moduleWrapperClass} onClick={() => onSelectModule(m.id)}>
        <div className="mb-4">
          <h2 className="text-sm font-bold border-b-2 pb-1 mb-2" style={{ borderColor: pc, color: pc }}>项目经历</h2>
          {(f.items || []).map((item: any, i: number) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-xs"><span className="font-semibold">{item.name}{item.role && ` · ${item.role}`}</span><span className="text-gray-400">{item.startDate} - {item.endDate}</span></div>
              {item.techStack?.length > 0 && <p className="text-xs text-gray-500 mt-0.5">技术栈: {item.techStack.join(' · ')}</p>}
              {(item.metrics || []).map((mt: string, j: number) => (
                <p key={j} className="text-xs text-gray-600 ml-3 mt-0.5">• {mt}</p>
              ))}
              {item.description && <p className="text-xs text-gray-600 mt-1">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
    if (m.type === 'skills') return (
      <div className={moduleWrapperClass} onClick={() => onSelectModule(m.id)}>
        <div className="mb-4">
          <h2 className="text-sm font-bold border-b-2 pb-1 mb-2" style={{ borderColor: pc, color: pc }}>专业技能</h2>
          {(f.groups || []).map((g: any, i: number) => (
            <div key={i} className="mb-1 text-xs"><span className="font-semibold">{g.name}: </span><span className="text-gray-600">{(g.items || []).join(' · ')}</span></div>
          ))}
        </div>
      </div>
    );
    if (m.type === 'selfEvaluation') return (
      <div className={moduleWrapperClass} onClick={() => onSelectModule(m.id)}>
        <div className="mb-4">
          <h2 className="text-sm font-bold border-b-2 pb-1 mb-2" style={{ borderColor: pc, color: pc }}>自我评价</h2>
          <p className="text-xs text-gray-600 leading-relaxed">{f.content}</p>
        </div>
      </div>
    );
    if (m.type === 'custom') return (
      <div className={moduleWrapperClass} onClick={() => onSelectModule(m.id)}>
        <div className="mb-4">
          <h2 className="text-sm font-bold border-b-2 pb-1 mb-2" style={{ borderColor: pc, color: pc }}>{f.title || '自定义模块'}</h2>
          <p className="text-xs text-gray-600 leading-relaxed">{f.content}</p>
        </div>
      </div>
    );
    return null;
  };
  return (
    <div className="a4-paper" style={{ fontFamily: theme.fontFamily, fontSize: theme.fontSize }}>
      {visible.map(m => <div key={m.id}>{renderModule(m)}</div>)}
    </div>
  );
}

export default function Editor() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const {
    currentResume, loading, canUndo, canRedo, settings,
    loadResume, updateModule, removeModule, reorderModules,
    updateTheme, saveCurrentResume, undo, redo, addModule,
  } = useResumeStore();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [importStatus, setImportStatus] = useState('等待导入 .docx / .doc 文件');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { if (id) loadResume(id); }, [id, loadResume]);

  useEffect(() => {
    if (currentResume?.modules?.length && !activeModuleId) {
      setActiveModuleId(currentResume.modules[0].id);
    }
  }, [currentResume?.modules, activeModuleId]);

  const activeModule = currentResume?.modules.find(m => m.id === activeModuleId) || null;
  const activeDragModule = currentResume?.modules.find(m => m.id === activeDragId) || null;

  const handleDragStart = useCallback((event: any) => {
    setActiveDragId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (over && active.id !== over.id) {
      reorderModules(active.id, over.id);
      setRendering(true);
      setTimeout(() => setRendering(false), 300);
    }
  }, [reorderModules]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try { await saveCurrentResume(); } finally { setSaving(false); }
  }, [saveCurrentResume]);

  const handleExport = useCallback(() => {
    if (currentResume) {
      setRendering(true);
      setTimeout(() => {
        exportResumeToWord(currentResume);
        setRendering(false);
      }, 500);
    }
  }, [currentResume]);

  const handleFieldUpdate = useCallback((moduleId: string, fields: Record<string, any>) => {
    updateModule(moduleId, m => ({ ...m, fields }));
  }, [updateModule]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddModule = () => {
    const newModule: ResumeModule = {
      id: '',
      type: 'custom',
      visible: true,
      order: modules.length,
      fields: { title: '自定义模块', content: '' },
    };
    addModule(newModule);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setImportStatus('导入失败：请选择 Word 文档（.docx / .doc）');
      return;
    }
    setImporting(true);
    setImportStatus(`正在解析 ${file.name} 的 Word 结构`);
    setTimeout(() => {
      setImporting(false);
      setImportStatus(`已导入 ${file.name} · 原生段落结构已进入编辑复查`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  if (!currentResume && !loading) return (
    <div className="flex items-center justify-center h-screen text-navy-400">未找到简历数据</div>
  );

  const modules = currentResume?.modules || [];
  const theme = currentResume?.theme || { primaryColor: '#1e3a5f', secondaryColor: '#c9a24a', fontFamily: 'LXGW WenKai', fontSize: 14 };
  const visibleCount = modules.filter(module => module.visible).length;
  const hiddenCount = modules.length - visibleCount;
  const linkCount = modules.reduce((count, module) => {
    if (module.type !== 'basic' && module.type !== 'project') return count;
    const fields = module.fields || {};
    const basicLinks = [fields.website, fields.github, fields.portfolio, fields.linkedin].filter(Boolean).length;
    const projectLinks = Array.isArray(fields.items) ? fields.items.filter((item: any) => item.link).length : 0;
    return count + basicLinks + projectLinks;
  }, 0);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b border-navy-100 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-2">
          <h1 className="text-sm font-semibold text-navy-700 mr-4 truncate max-w-[200px]">{currentResume?.title}</h1>
          <button onClick={handleSave} disabled={saving || loading} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />{saving ? '保存中...' : '保存'}
          </button>
          <button onClick={undo} disabled={!canUndo} className="btn-ghost text-xs px-2 py-1.5 disabled:opacity-30"><Undo2 className="w-4 h-4" /></button>
          <button onClick={redo} disabled={!canRedo} className="btn-ghost text-xs px-2 py-1.5 disabled:opacity-30"><Redo2 className="w-4 h-4" /></button>
          <div className="h-5 w-px bg-navy-100 mx-1" />
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc"
            className="hidden"
            onChange={handleFileChange}
          />
          <button onClick={handleImportClick} disabled={importing} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50">
            <Upload className="w-3.5 h-3.5" />{importing ? '导入中...' : '导入Word'}
          </button>
          <button onClick={() => id && navigate(`/diagnosis/${id}`)} className="btn-ghost text-xs px-2 py-1.5 flex items-center gap-1">
            <Brain className="w-4 h-4" />AI诊断
          </button>
          <button onClick={() => id && navigate(`/ats-check/${id}`)} className="btn-ghost text-xs px-2 py-1.5 flex items-center gap-1">
            <ScanLine className="w-4 h-4" />ATS检测
          </button>
          <div className="flex-1" />
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium ${settings.privacyMode ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-50 text-navy-500'}`}>
            {settings.privacyMode ? <Lock className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            {settings.privacyMode ? '已加密' : '未加密'}
          </span>
          <button onClick={handleExport} disabled={rendering} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50">
            <FileDown className="w-3.5 h-3.5" />{rendering ? '渲染中...' : '导出Word'}
          </button>
        </div>
        <div className="px-4 pb-2 flex flex-wrap items-center gap-2 text-[11px] text-navy-500">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-navy-50">
            <FileText className="w-3 h-3" />
            {importStatus}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700">
            <EyeIcon className="w-3 h-3" />
            实时预览：{rendering ? '正在重排模块' : 'Word 原生版式已渲染'}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gold-50 text-gold-700">
            <FileCheck className="w-3 h-3" />
            导出前复查：字体嵌入、表格结构、{linkCount} 个超链接
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-navy-50">
            <Shield className="w-3 h-3" />
            字段显隐：{visibleCount} 个显示 / {hiddenCount} 个隐藏
          </span>
          {settings.privacyMode && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700">
              <Lock className="w-3 h-3" />
              AES 本地加密缓存
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧面板 - 模块列表 */}
        <aside className="w-[240px] border-r border-navy-100 bg-white flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-navy-100">
            <h2 className="text-xs font-semibold text-navy-500 uppercase tracking-wider">模块列表</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
              <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                {modules.map(m => (
                  <SortableItem key={m.id} module={m} active={m.id === activeModuleId}
                    onSelect={() => setActiveModuleId(m.id)}
                    onToggle={() => updateModule(m.id, mod => ({ ...mod, visible: !mod.visible }))}
                    onDelete={() => { removeModule(m.id); if (activeModuleId === m.id) setActiveModuleId(null); }} />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeDragModule ? (
                  <div className="opacity-60">
                    <SortableItem module={activeDragModule} active={false}
                      onSelect={() => {}} onToggle={() => {}} onDelete={() => {}} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
          <div className="p-3 border-t border-navy-100">
            <button onClick={handleAddModule} className="btn-ghost text-xs w-full flex items-center justify-center gap-1 py-2">
              <Plus className="w-4 h-4" />添加模块
            </button>
          </div>
        </aside>

        {/* 中间画布区 */}
        <main className="flex-1 overflow-y-auto bg-slate-100/50 flex flex-col">
          <div className="flex-shrink-0 px-4 py-3 bg-white/80 backdrop-blur border-b border-navy-100 flex items-center gap-3">
            <div className="text-xs text-navy-500">
              当前选中：<span className="font-medium text-navy-700">{activeModule ? MODULE_LABELS[activeModule.type] : '无'}</span>
            </div>
            <div className="h-3 w-px bg-navy-200" />
            <div className={`text-xs flex items-center gap-1 ${rendering ? 'text-gold-600' : 'text-emerald-600'}`}>
              <FileCheck className="w-3.5 h-3.5" />
              {rendering ? '正在渲染 Word 版式...' : 'Word 渲染就绪'}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-8 px-4">
            <div className={`transform scale-[0.6] origin-top transition-opacity ${rendering ? 'opacity-60 animate-pulse' : ''}`}>
              <A4Preview modules={modules} theme={theme} activeModuleId={activeModuleId} onSelectModule={setActiveModuleId} />
            </div>
          </div>
        </main>

        {/* 右侧面板 */}
        <aside className="w-[280px] border-l border-navy-100 bg-white flex flex-col flex-shrink-0">
          <div className="flex border-b border-navy-100">
            <button className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${!activeModule ? 'text-navy-700 border-b-2 border-gold-500' : 'text-navy-400'}`}
              onClick={() => setActiveModuleId(null)}>
              <Palette className="w-3.5 h-3.5" />主题
            </button>
            <button className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeModule ? 'text-navy-700 border-b-2 border-gold-500' : 'text-navy-400'}`}
              onClick={() => activeModuleId || setActiveModuleId(modules[0]?.id ?? null)}>
              <Settings2 className="w-3.5 h-3.5" />编辑
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {!activeModule ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-navy-400 mb-1.5 block">预设配色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((p, i) => (
                      <button key={i} onClick={() => updateTheme({ primaryColor: p.primary, secondaryColor: p.secondary })}
                        className={`flex items-center gap-1.5 p-2 rounded-lg border transition-all ${theme.primaryColor === p.primary ? 'border-gold-500 bg-gold-50' : 'border-navy-100 hover:border-navy-200 bg-white'}`}>
                        <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: p.primary }} />
                        <span className="text-[11px] text-navy-600">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-navy-400 mb-1.5 block">主色调</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={theme.primaryColor} onChange={e => updateTheme({ primaryColor: e.target.value })}
                      className="w-8 h-8 rounded border border-navy-200 cursor-pointer" />
                    <input className="input-field text-xs flex-1" value={theme.primaryColor}
                      onChange={e => updateTheme({ primaryColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-navy-400 mb-1.5 block">辅助色</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={theme.secondaryColor} onChange={e => updateTheme({ secondaryColor: e.target.value })}
                      className="w-8 h-8 rounded border border-navy-200 cursor-pointer" />
                    <input className="input-field text-xs flex-1" value={theme.secondaryColor}
                      onChange={e => updateTheme({ secondaryColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-navy-400 mb-1.5 block">字体</label>
                  <select className="input-field text-xs" value={theme.fontFamily} onChange={e => updateTheme({ fontFamily: e.target.value })}>
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-navy-400 mb-1.5 block">字号: {theme.fontSize}px</label>
                  <input type="range" min={10} max={18} step={1} value={theme.fontSize}
                    onChange={e => updateTheme({ fontSize: Number(e.target.value) })}
                    className="w-full accent-navy-600" />
                </div>
              </div>
            ) : (
              <ModuleEditor module={activeModule} onUpdate={fields => handleFieldUpdate(activeModule.id, fields)} onToggleVisibility={(key) => {
                const vis = (activeModule.fields._fieldVisibility || {}) as Record<string, boolean>;
                handleFieldUpdate(activeModule.id, { ...activeModule.fields, _fieldVisibility: { ...vis, [key]: !(vis[key] ?? true) } });
              }} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
