import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Search, Eye, Edit2, Copy, Trash2,
  Settings2, ZoomIn, ZoomOut, Download, Save, RotateCcw,
  Type, Image, ListChecks, Award, Star, PenLine,
  Shield, Droplets, Layout, Palette, Layers, Move,
  ChevronRight, Check, X, GripVertical, Maximize2,
  Sliders, AlignLeft, AlignCenter, AlignRight, Grid3x3,
  Sparkles, Sticker, QrCode, Clock, AlignJustify, ScrollText, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

type ModuleKey = 'title' | 'artworkImage' | 'conclusion' | 'rating' | 'checklist' | 'signature' | 'blockchain' | 'watermark';

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  updatedAt: string;
  usage: number;
  status: 'active' | 'disabled';
  creator: string;
  isDefault?: boolean;
  paperSize: 'A4' | 'A5' | 'certificate';
  theme: 'jade' | 'royal' | 'cinnabar' | 'elegant';
  perforationStamp: {
    enabled: boolean;
    text: string;
    customText?: string;
    color: 'cinnabar' | 'jade' | 'gold';
    widthPercent: number;
    position: 'left' | 'right' | 'both';
  };
}

interface CanvasModule {
  key: ModuleKey;
  name: string;
  icon: typeof Type;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  visible: boolean;
  config: Record<string, unknown>;
}

const moduleDefinitions: { key: ModuleKey; name: string; icon: typeof Type; defaultW: number; defaultH: number }[] = [
  { key: 'title', name: '证书标题', icon: Type, defaultW: 80, defaultH: 10 },
  { key: 'artworkImage', name: '藏品图像区', icon: Image, defaultW: 45, defaultH: 30 },
  { key: 'conclusion', name: '专家结论区', icon: AlignLeft, defaultW: 90, defaultH: 18 },
  { key: 'rating', name: '真伪评级区', icon: Award, defaultW: 30, defaultH: 15 },
  { key: 'checklist', name: '鉴定要点清单', icon: ListChecks, defaultW: 90, defaultH: 18 },
  { key: 'signature', name: '专家签名区', icon: PenLine, defaultW: 90, defaultH: 12 },
  { key: 'blockchain', name: '区块链存证区', icon: QrCode, defaultW: 30, defaultH: 10 },
  { key: 'watermark', name: '防伪水印', icon: Shield, defaultW: 100, defaultH: 100 },
];

const paperSizes = {
  A4: { label: 'A4 标准', w: 210, h: 297, ratio: 297 / 210 },
  A5: { label: 'A5 便携', w: 148, h: 210, ratio: 210 / 148 },
  certificate: { label: '竖版证书', w: 200, h: 280, ratio: 280 / 200 },
};

const themes = {
  jade: { label: '墨玉绿', primary: '#1a4d3e', accent: '#C9A961', bg: '#F5F1E8' },
  royal: { label: '皇家蓝', primary: '#1e3a5f', accent: '#C9A961', bg: '#F8F5EE' },
  cinnabar: { label: '朱红', primary: '#8B2500', accent: '#FFD700', bg: '#FDF5F0' },
  elegant: { label: '淡雅灰', primary: '#4a4a4a', accent: '#9a8a6f', bg: '#FAFAF7' },
};

const themeColors: Record<keyof typeof themes, { panel: string; text: string; accent: string }> = {
  jade: { panel: 'from-jade-900 to-jade-800', text: 'text-jade-50', accent: 'bg-gold-gradient' },
  royal: { panel: 'from-[#1e3a5f] to-[#2d5a8f]', text: 'text-blue-50', accent: 'bg-gold-gradient' },
  cinnabar: { panel: 'from-[#8B2500] to-[#a63a12]', text: 'text-orange-50', accent: 'bg-gradient-to-r from-yellow-500 to-amber-500' },
  elegant: { panel: 'from-gray-700 to-gray-600', text: 'text-gray-100', accent: 'bg-gradient-to-r from-amber-600 to-stone-600' },
};

const defaultTemplates: Template[] = [
  { id: 'TPL001', name: '陶瓷鉴定证书模板', category: '陶瓷', thumbnail: '', updatedAt: '2024-06-12 14:30', usage: 1280, status: 'active', creator: '平台官方', isDefault: true, paperSize: 'A4', theme: 'jade', perforationStamp: { enabled: true, text: '鉴真阁', color: 'cinnabar', widthPercent: 10, position: 'both' } },
  { id: 'TPL002', name: '玉器鉴定证书模板', category: '玉器', thumbnail: '', updatedAt: '2024-06-10 09:15', usage: 960, status: 'active', creator: '平台官方', isDefault: true, paperSize: 'A4', theme: 'royal', perforationStamp: { enabled: true, text: '鉴真阁', color: 'jade', widthPercent: 10, position: 'both' } },
  { id: 'TPL003', name: '书画鉴定证书模板', category: '书画', thumbnail: '', updatedAt: '2024-06-08 16:45', usage: 780, status: 'active', creator: '平台官方', isDefault: true, paperSize: 'certificate', theme: 'cinnabar', perforationStamp: { enabled: true, text: '鉴真阁', color: 'cinnabar', widthPercent: 10, position: 'both' } },
  { id: 'TPL004', name: '青铜器鉴定证书模板', category: '青铜器', thumbnail: '', updatedAt: '2024-06-05 11:20', usage: 420, status: 'active', creator: '平台官方', paperSize: 'A4', theme: 'elegant', perforationStamp: { enabled: false, text: '鉴真阁', color: 'gold', widthPercent: 10, position: 'both' } },
  { id: 'TPL005', name: '钱币鉴定证书模板', category: '钱币', thumbnail: '', updatedAt: '2024-06-01 10:00', usage: 650, status: 'disabled', creator: '管理员-周', paperSize: 'A5', theme: 'jade', perforationStamp: { enabled: true, text: '鉴真阁', color: 'cinnabar', widthPercent: 10, position: 'both' } },
  { id: 'TPL006', name: '通用鉴定证书模板', category: '通用', thumbnail: '', updatedAt: '2024-05-28 15:30', usage: 2100, status: 'active', creator: '平台官方', isDefault: true, paperSize: 'A4', theme: 'jade', perforationStamp: { enabled: true, text: '鉴真阁', color: 'cinnabar', widthPercent: 10, position: 'both' } },
];

const categories = ['全品类', '陶瓷', '玉器', '书画', '青铜器', '钱币', '珠宝玉石', '古籍善本', '杂项', '通用'];

interface EditorAreaProps {
  template: Template;
  onUpdate: (tpl: Template) => void;
  onSave: () => void;
  themeColors: Record<string, { primary: string; gradient: string; seal: string; text: string }>;
}

function EditorArea({ template, onUpdate, onSave }: EditorAreaProps) {
  const [zoom, setZoom] = useState(72);
  const [showGrid, setShowGrid] = useState(true);
  const [paperSize, setPaperSize] = useState<Template['paperSize']>(template.paperSize);
  const [theme, setTheme] = useState<Template['theme']>(template.theme);
  const [tplName, setTplName] = useState(template.name);
  const [tplCategory, setTplCategory] = useState(template.category);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const editingTpl = template;
  const setEditingTpl = (updater: Template | ((prev: Template) => Template)) => {
    if (typeof updater === 'function') {
      onUpdate(updater(editingTpl));
    } else {
      onUpdate(updater);
    }
  };
  const [modules, setModules] = useState<CanvasModule[]>([
    { key: 'title', name: '证书标题', icon: Type, x: 10, y: 4, w: 80, h: 8, z: 10, visible: true, config: { fontSize: 24, fontWeight: 'bold', color: themes[theme].primary, align: 'center' } },
    { key: 'artworkImage', name: '藏品图像区', icon: Image, x: 20, y: 15, w: 60, h: 22, z: 5, visible: true, config: { layout: '1' as '1' | '2x2' | '3col' } },
    { key: 'conclusion', name: '专家结论区', icon: AlignLeft, x: 8, y: 40, w: 84, h: 12, z: 6, visible: true, config: { style: 'paragraph' as 'text' | 'bullets' | 'paragraph_rating' } },
    { key: 'rating', name: '真伪评级区', icon: Award, x: 30, y: 54, w: 40, h: 10, z: 7, visible: true, config: { style: 'seal' as 'seal' | 'progress' | 'stars' } },
    { key: 'checklist', name: '鉴定要点清单', icon: ListChecks, x: 8, y: 66, w: 84, h: 10, z: 8, visible: true, config: { count: 5 } },
    { key: 'signature', name: '专家签名区', icon: PenLine, x: 8, y: 79, w: 84, h: 7, z: 9, visible: true, config: { showLevelSeal: true } },
    { key: 'blockchain', name: '区块链存证区', icon: QrCode, x: 72, y: 88, w: 20, h: 8, z: 4, visible: true, config: { showHash: true, showQR: true, showTimestamp: true } },
    { key: 'watermark', name: '防伪水印', icon: Shield, x: 0, y: 0, w: 100, h: 100, z: 1, visible: true, config: { text: '鉴真阁', fontSize: 16, opacity: 6, rotation: 30, density: 50 } },
  ]);
  const [selectedModule, setSelectedModule] = useState<ModuleKey | null>('title');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ key: ModuleKey; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [resizing, setResizing] = useState<{ key: ModuleKey; handle: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number } | null>(null);

  const themeCfg = themes[theme];
  const thColors = themeColors[theme];
  const paperCfg = paperSizes[paperSize];

  const selMod = modules.find(m => m.key === selectedModule);

  const updateModule = (key: ModuleKey, patch: Partial<CanvasModule>) => {
    setModules(ms => ms.map(m => m.key === key ? { ...m, ...patch, config: { ...m.config, ...(patch.config || {}) } } : m));
  };

  const toggleModule = (key: ModuleKey) => {
    setModules(ms => ms.map(m => m.key === key ? { ...m, visible: !m.visible } : m));
    if (selectedModule === key) setSelectedModule(null);
  };

  const resetModules = () => {
    setZoom(72);
    setShowGrid(true);
    setPaperSize(template.paperSize);
    setTheme(template.theme);
  };

  const saveTemplate = () => {
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2200);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    if (dragging) {
      const dx = px - dragging.startX;
      const dy = py - dragging.startY;
      const mod = modules.find(m => m.key === dragging.key)!;
      const newX = Math.max(0, Math.min(100 - mod.w, dragging.origX + dx));
      const newY = Math.max(0, Math.min(100 - mod.h, dragging.origY + dy));
      updateModule(dragging.key, { x: Math.round(newX), y: Math.round(newY) });
    }
    if (resizing) {
      const dx = px - resizing.startX;
      const dy = py - resizing.startY;
      let { origX, origY, origW, origH } = resizing;
      if (resizing.handle.includes('e')) origW = Math.max(8, origW + dx);
      if (resizing.handle.includes('w')) { const nw = Math.max(8, origW - dx); origX = origX + (origW - nw); origW = nw; }
      if (resizing.handle.includes('s')) origH = Math.max(4, origH + dy);
      if (resizing.handle.includes('n')) { const nh = Math.max(4, origH - dy); origY = origY + (origH - nh); origH = nh; }
      updateModule(resizing.key, {
        x: Math.round(Math.max(0, origX)),
        y: Math.round(Math.max(0, origY)),
        w: Math.round(Math.min(100 - (origX > 0 ? 0 : 0), origW)),
        h: Math.round(Math.min(100 - (origY > 0 ? 0 : 0), origH)),
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  const startDrag = (e: React.MouseEvent, m: CanvasModule) => {
    if (!canvasRef.current) return;
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setSelectedModule(m.key);
    setDragging({
      key: m.key,
      startX: ((e.clientX - rect.left) / rect.width) * 100,
      startY: ((e.clientY - rect.top) / rect.height) * 100,
      origX: m.x, origY: m.y,
    });
  };

  const startResize = (e: React.MouseEvent, m: CanvasModule, handle: string) => {
    if (!canvasRef.current) return;
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setResizing({
      key: m.key, handle,
      startX: ((e.clientX - rect.left) / rect.width) * 100,
      startY: ((e.clientY - rect.top) / rect.height) * 100,
      origX: m.x, origY: m.y, origW: m.w, origH: m.h,
    });
  };

  return (
    <>
      <div className="col-span-12 lg:col-span-6 space-y-4">
        <Card>
          <Card.Content className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] text-jade-400 block mb-1">模板名称</label>
                <Input size={undefined as never} value={tplName} onChange={e => setTplName(e.target.value)} />
              </div>
              <div className="w-32">
                <label className="text-[10px] text-jade-400 block mb-1">适用品类</label>
                <select value={tplCategory} onChange={e => setTplCategory(e.target.value)} className="input-field text-sm h-[38px]">
                  {categories.filter(c => c !== '全品类').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="w-36">
                <label className="text-[10px] text-jade-400 block mb-1">纸张尺寸</label>
                <div className="flex gap-1">
                  {(Object.keys(paperSizes) as (keyof typeof paperSizes)[]).map(k => (
                    <button
                      key={k}
                      onClick={() => setPaperSize(k)}
                      className={cn(
                        'flex-1 py-2 text-[10px] rounded-md font-medium border transition-all',
                        paperSize === k ? `${thColors.accent} text-white border-transparent shadow-sm` : 'bg-rice-50 text-jade-600 border-gold-200 hover:border-gold-300'
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-1">
                <button onClick={() => setZoom(z => Math.max(40, z - 8))} className="p-2 rounded-md bg-rice-100 hover:bg-gold-50 text-jade-600 border border-gold-200 transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="w-16 text-center">
                  <label className="text-[10px] text-jade-400 block mb-1">缩放</label>
                  <span className="text-xs font-bold text-jade-700 tabular-nums">{zoom}%</span>
                </div>
                <button onClick={() => setZoom(z => Math.min(120, z + 8))} className="p-2 rounded-md bg-rice-100 hover:bg-gold-50 text-jade-600 border border-gold-200 transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gold-100">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowGrid(g => !g)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5',
                    showGrid ? 'border-gold-400 bg-gold-50 text-gold-700' : 'border-gold-200 bg-rice-50 text-jade-600 hover:border-gold-300'
                  )}
                >
                  <Grid3x3 className="w-3.5 h-3.5" /> 网格辅助
                </button>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-gold-200 bg-rice-50 text-jade-600 hover:border-gold-300 transition-all flex items-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> 适应画布
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>预览</Button>
                <Button variant="secondary" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5" />} onClick={resetModules}>重置</Button>
                <Button variant="primary" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />} onClick={saveTemplate}>保存模板</Button>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="bg-gradient-to-br from-jade-900/5 to-gold-500/5 p-4 md:p-6">
          <div className="flex justify-center overflow-auto scrollbar-thin">
            <div
              ref={canvasRef}
              className="relative shadow-2xl rounded-sm overflow-hidden select-none"
              style={{
                width: `${zoom * 2.8}px`,
                height: `${zoom * 2.8 * paperCfg.ratio}px`,
                backgroundColor: themeCfg.bg,
                backgroundImage: showGrid
                  ? `linear-gradient(rgba(201,169,97,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,97,0.08) 1px, transparent 1px)`
                  : undefined,
                backgroundSize: `${zoom * 0.28}px ${zoom * 0.28}px`,
                border: `1px solid ${themeCfg.accent}40`,
              }}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onClick={() => setSelectedModule(null)}
            >
              {modules.find(m => m.key === 'watermark')?.visible && (() => {
                const wm = modules.find(m => m.key === 'watermark')!;
                const cfg = wm.config as { text: string; fontSize: number; opacity: number; rotation: number; density: number };
                const count = Math.max(3, Math.round(cfg.density / 10));
                return (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: count * count }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute font-serif font-bold whitespace-nowrap select-none"
                        style={{
                          left: `${(i % count) * (100 / count) + (5 - count * 2)}%`,
                          top: `${Math.floor(i / count) * (100 / count) + (5 - count * 2)}%`,
                          fontSize: `${cfg.fontSize * 0.6}px`,
                          color: themeCfg.primary,
                          opacity: cfg.opacity / 100,
                          transform: `rotate(${cfg.rotation}deg)`,
                        }}
                      >
                        {cfg.text}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {modules.filter(m => m.visible && m.key !== 'watermark').map(m => {
                const isSel = selectedModule === m.key;
                const cfg = m.config as Record<string, unknown>;
                const renderContent = () => {
                  switch (m.key) {
                    case 'title':
                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <div className={cn('h-0.5 rounded w-16', thColors.accent)} />
                          <div
                            className="font-serif font-bold"
                            style={{
                              fontSize: `${(cfg.fontSize as number) * 0.6}px`,
                              color: cfg.color as string,
                              textAlign: cfg.align as CanvasTextAlign,
                              letterSpacing: '0.05em',
                            }}
                          >
                            文物鉴定证书
                          </div>
                          <div className="text-[8px]" style={{ color: themeCfg.primary, opacity: 0.6 }}>
                            CULTURAL RELIC APPRAISAL CERTIFICATE
                          </div>
                        </div>
                      );
                    case 'artworkImage':
                      const layout = cfg.layout as string;
                      const gridCols = layout === '2x2' ? 2 : layout === '3col' ? 3 : 1;
                      return (
                        <div className="w-full h-full p-1" style={{ backgroundColor: '#fff', border: `1px solid ${themeCfg.accent}30`, borderRadius: 2 }}>
                          <div className={cn('grid h-full gap-0.5', gridCols === 1 ? 'grid-cols-1' : gridCols === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                            {Array.from({ length: gridCols * gridCols }).map((_, i) => (
                              <div key={i} className="bg-gradient-to-br from-rice-50 to-gold-50/40 flex items-center justify-center border border-gold-100/50">
                                <Image className="w-3 h-3 text-gold-300" />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    case 'conclusion':
                      return (
                        <div className="w-full h-full p-1.5" style={{ backgroundColor: '#fff8', border: `1px dashed ${themeCfg.primary}20`, borderRadius: 2 }}>
                          <div className="text-[9px] font-bold mb-0.5" style={{ color: themeCfg.primary }}>专家鉴定结论：</div>
                          {cfg.style === 'bullets' ? (
                            <ul className="space-y-0.5 pl-2">
                              {['胎质细腻，符合时代特征', '纹饰绘制流畅自然', '款识书法规整有力'].map(t => (
                                <li key={t} className="text-[7px] text-jade-700 list-disc">{t}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[7px] text-jade-600 leading-relaxed">
                              经综合鉴定，该藏品器型规整，胎釉老化痕迹自然，纹饰风格鲜明，符合所述年代特征。
                            </p>
                          )}
                        </div>
                      );
                    case 'rating':
                      if (cfg.style === 'seal') {
                        return (
                          <div className="w-full h-full flex items-center justify-center">
                            <div
                              className="w-10 h-10 rounded flex items-center justify-center font-serif font-bold text-xs rotate-[-6deg] shadow-seal"
                              style={{
                                backgroundColor: '#c0392b',
                                color: '#fff8e7',
                                border: '2px double #fff8e7',
                              }}
                            >
                              真品
                            </div>
                          </div>
                        );
                      }
                      if (cfg.style === 'stars') {
                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={cn('w-3 h-3', s <= 4 ? 'text-gold-500 fill-gold-500' : 'text-gold-200')} />
                              ))}
                            </div>
                            <span className="text-[8px] font-bold" style={{ color: themeCfg.primary }}>四级珍品</span>
                          </div>
                        );
                      }
                      return (
                        <div className="w-full h-full flex flex-col justify-center px-2 gap-0.5">
                          <div className="flex justify-between text-[8px]"><span style={{ color: themeCfg.primary }}>真品指数</span><span className="font-bold text-gold-700">88%</span></div>
                          <div className="h-1.5 bg-rice-200 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', thColors.accent)} style={{ width: '88%' }} />
                          </div>
                        </div>
                      );
                    case 'checklist':
                      const count = cfg.count as number;
                      const items = ['器型', '胎质', '釉面', '纹饰', '款识', '工艺', '老化痕迹', '包浆'];
                      return (
                        <div className="w-full h-full p-1" style={{ backgroundColor: '#fff6', border: `1px solid ${themeCfg.accent}15`, borderRadius: 2 }}>
                          <div className={cn('grid gap-x-2 gap-y-0.5', count <= 4 ? 'grid-cols-2' : 'grid-cols-2')}>
                            {items.slice(0, count).map((it, i) => (
                              <div key={i} className="flex items-center gap-1 text-[7px]">
                                <div className="w-2.5 h-2.5 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeCfg.primary }}>
                                  <Check className="w-1.5 h-1.5 text-white" />
                                </div>
                                <span style={{ color: themeCfg.primary }}>{it}</span>
                                <span className="ml-auto font-mono opacity-60">{i + 1}.</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    case 'signature':
                      return (
                        <div className="w-full h-full flex items-center justify-between px-2 border-t" style={{ borderColor: `${themeCfg.accent}30` }}>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-5 flex items-center justify-center border-b-2 border-gold-400/40">
                              <PenLine className="w-3 h-3 text-jade-300" />
                            </div>
                            <div>
                              <div className="text-[8px] font-bold" style={{ color: themeCfg.primary }}>鉴定专家</div>
                              <div className="text-[6px] text-jade-500">（签名）</div>
                            </div>
                          </div>
                          {cfg.showLevelSeal && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center font-serif text-[7px] font-bold"
                                style={{ color: themeCfg.primary, border: `1px solid ${themeCfg.primary}60` }}
                              >
                                省级
                              </div>
                              <div className="text-[6px] text-right" style={{ color: themeCfg.primary, opacity: 0.7 }}>
                                <div>日期：2024.06.18</div>
                                <div>编号：JZG202400XXX</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    case 'blockchain':
                      return (
                        <div className="w-full h-full flex items-center gap-1 p-0.5">
                          <div className="w-5 h-5 bg-white flex items-center justify-center" style={{ border: `1px solid ${themeCfg.primary}30` }}>
                            <QrCode className="w-3.5 h-3.5" style={{ color: themeCfg.primary }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            {cfg.showHash && <div className="text-[5px] font-mono truncate" style={{ color: themeCfg.primary, opacity: 0.8 }}>0x7f3a...9e2b</div>}
                            {cfg.showTimestamp && <div className="text-[4px]" style={{ color: themeCfg.primary, opacity: 0.6 }}>存证时间:2024-06-18</div>}
                          </div>
                        </div>
                      );
                    default:
                      return <div className="w-full h-full bg-rice-100" />;
                  }
                };

                return (
                  <div
                    key={m.key}
                    className={cn(
                      'absolute group/mod cursor-move transition-shadow',
                      isSel && 'ring-2 z-50',
                    )}
                    style={{
                      left: `${m.x}%`,
                      top: `${m.y}%`,
                      width: `${m.w}%`,
                      height: `${m.h}%`,
                      zIndex: isSel ? 100 : m.z,
                      boxShadow: isSel ? '0 0 0 2px #C9A961, 0 4px 20px rgba(201,169,97,0.35)' : undefined,
                      borderRadius: 2,
                    }}
                    onMouseDown={e => startDrag(e, m)}
                    onClick={e => { e.stopPropagation(); setSelectedModule(m.key); }}
                  >
                    {renderContent()}

                    {isSel && m.key !== 'watermark' && (
                      <>
                        {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => {
                          const pos: Record<string, string> = {
                            nw: '-top-1 -left-1 cursor-nw-resize',
                            n: '-top-1 left-1/2 -translate-x-1/2 cursor-n-resize',
                            ne: '-top-1 -right-1 cursor-ne-resize',
                            e: 'top-1/2 -right-1 -translate-y-1/2 cursor-e-resize',
                            se: '-bottom-1 -right-1 cursor-se-resize',
                            s: '-bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize',
                            sw: '-bottom-1 -left-1 cursor-sw-resize',
                            w: 'top-1/2 -left-1 -translate-y-1/2 cursor-w-resize',
                          };
                          return (
                            <div
                              key={h}
                              onMouseDown={e => startResize(e, m, h)}
                              className={cn('absolute w-2.5 h-2.5 rounded-full bg-white border-2 border-gold-500 shadow-md', pos[h])}
                            />
                          );
                        })}
                        <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-gold-gradient text-white whitespace-nowrap shadow flex items-center gap-1">
                          <GripVertical className="w-2.5 h-2.5" />
                          {m.name}
                          <span className="opacity-70 ml-1 font-mono">{m.w}×{m.h}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-3 space-y-4">
        <Card>
          <Card.Header className="!py-3">
            <Card.Title className="!text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-gold-500" />
              布局模块
            </Card.Title>
            <Card.Description className="!text-[10px]">拖拽或点击添加</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-1.5">
            {moduleDefinitions.map(def => {
              const m = modules.find(mm => mm.key === def.key)!;
              return (
                <button
                  key={def.key}
                  onClick={() => { toggleModule(def.key); if (m.visible) setSelectedModule(def.key); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-2 rounded-md border text-left transition-all group',
                    m.visible && selectedModule === def.key
                      ? 'border-gold-400 bg-gold-50/70 shadow-sm'
                      : m.visible
                        ? 'border-gold-200 bg-rice-50 hover:border-gold-300'
                        : 'border-rice-100 bg-rice-50/50 opacity-60 hover:opacity-100'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded flex items-center justify-center flex-shrink-0',
                    m.visible ? thColors.accent + ' text-white shadow-sm' : 'bg-rice-200 text-jade-400'
                  )}>
                    <def.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-xs font-semibold truncate', m.visible ? 'text-jade-700' : 'text-jade-400 line-through')}>{def.name}</div>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0',
                    m.visible ? 'bg-jade-500 border-jade-500' : 'bg-rice-100 border-gold-200'
                  )}>
                    {m.visible && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </Card.Content>
        </Card>

        {selMod && (
          <Card>
            <Card.Header className="!py-3">
              <Card.Title className="!text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-gold-500" />
                <span className="flex-1">模块属性</span>
                <Badge variant="default" className="!text-[9px] !py-0">{selMod.name}</Badge>
              </Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { k: 'x', label: 'X 位置', v: selMod.x },
                  { k: 'y', label: 'Y 位置', v: selMod.y },
                  { k: 'w', label: '宽度 %', v: selMod.w },
                  { k: 'h', label: '高度 %', v: selMod.h },
                ].map(it => (
                  <div key={it.k}>
                    <label className="text-[10px] text-jade-500 block mb-1">{it.label}</label>
                    <input
                      type="number"
                      value={it.v}
                      min={0}
                      max={100}
                      onChange={e => updateModule(selMod.key, { [it.k]: Number(e.target.value) } as Partial<CanvasModule>)}
                      className="input-field text-xs h-8 px-2"
                    />
                  </div>
                ))}
              </div>

              {selMod.key === 'title' && (() => {
                const cfg = selMod.config as { fontSize: number; fontWeight: string; color: string; align: string };
                return (
                  <div className="space-y-3 pt-3 border-t border-gold-100">
                    <div>
                      <label className="label-field !text-[10px] !mb-1">字号: {cfg.fontSize}px</label>
                      <input type="range" min={14} max={48} value={cfg.fontSize} onChange={e => updateModule('title', { config: { fontSize: Number(e.target.value) } })} className="w-full accent-gold-500" />
                    </div>
                    <div>
                      <label className="label-field !text-[10px] !mb-1">字体颜色</label>
                      <div className="flex gap-1.5">
                        {Object.values(themes).map((t, i) => (
                          <button
                            key={i}
                            onClick={() => updateModule('title', { config: { color: t.primary } })}
                            className={cn('w-7 h-7 rounded border-2 transition-all', cfg.color === t.primary ? 'border-gold-500 scale-110' : 'border-transparent')}
                            style={{ backgroundColor: t.primary }}
                          />
                        ))}
                        <input type="color" value={cfg.color} onChange={e => updateModule('title', { config: { color: e.target.value } })} className="w-7 h-7 rounded border-0 p-0 cursor-pointer" />
                      </div>
                    </div>
                    <div>
                      <label className="label-field !text-[10px] !mb-1">对齐方式</label>
                      <div className="flex gap-1">
                        {[{ k: 'left', i: AlignLeft }, { k: 'center', i: AlignCenter }, { k: 'right', i: AlignRight }].map(a => (
                          <button
                            key={a.k}
                            onClick={() => updateModule('title', { config: { align: a.k } })}
                            className={cn(
                              'flex-1 py-1.5 rounded border transition-all flex justify-center',
                              cfg.align === a.k ? 'border-gold-400 bg-gold-50 text-gold-700' : 'border-gold-200 bg-rice-50 text-jade-500 hover:border-gold-300'
                            )}
                          >
                            <a.i className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selMod.key === 'artworkImage' && (
                <div className="pt-3 border-t border-gold-100">
                  <label className="label-field !text-[10px] !mb-2">图像布局</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ k: '1', label: '单图', hint: '1张大图' }, { k: '2x2', label: '2×2', hint: '4格缩略' }, { k: '3col', label: '3列', hint: '横排对比' }].map(opt => (
                      <button
                        key={opt.k}
                        onClick={() => updateModule('artworkImage', { config: { layout: opt.k } })}
                        className={cn(
                          'p-2 rounded-lg border-2 text-center transition-all',
                          (selMod.config as { layout: string }).layout === opt.k
                            ? 'border-gold-400 bg-gold-50 shadow-sm'
                            : 'border-gold-200 bg-rice-50 hover:border-gold-300'
                        )}
                      >
                        <div className="w-full aspect-[4/3] bg-white/60 border border-gold-100 rounded mb-1 flex items-center justify-center">
                          {opt.k === '1' && <div className="w-3/4 h-3/4 bg-jade-50 rounded border border-jade-100" />}
                          {opt.k === '2x2' && (
                            <div className="w-3/4 h-3/4 grid grid-cols-2 gap-0.5">
                              {[0,1,2,3].map(i => <div key={i} className="bg-jade-50 rounded-sm border border-jade-100" />)}
                            </div>
                          )}
                          {opt.k === '3col' && (
                            <div className="w-11/12 h-1/2 grid grid-cols-3 gap-0.5">
                              {[0,1,2].map(i => <div key={i} className="bg-jade-50 rounded-sm border border-jade-100" />)}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] font-semibold text-jade-700">{opt.label}</div>
                        <div className="text-[8px] text-jade-400">{opt.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selMod.key === 'conclusion' && (
                <div className="pt-3 border-t border-gold-100">
                  <label className="label-field !text-[10px] !mb-2">结论样式</label>
                  <div className="space-y-1.5">
                    {[{ k: 'text', label: '纯文本' }, { k: 'bullets', label: '要点列表' }, { k: 'paragraph_rating', label: '段落+评分' }].map(opt => (
                      <button
                        key={opt.k}
                        onClick={() => updateModule('conclusion', { config: { style: opt.k } })}
                        className={cn(
                          'w-full px-3 py-1.5 rounded border text-left text-xs font-medium transition-all',
                          (selMod.config as { style: string }).style === opt.k
                            ? 'border-gold-400 bg-gold-50 text-gold-700'
                            : 'border-gold-200 bg-rice-50 text-jade-600 hover:border-gold-300'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selMod.key === 'rating' && (
                <div className="pt-3 border-t border-gold-100">
                  <label className="label-field !text-[10px] !mb-2">真伪评级样式</label>
                  <div className="space-y-1.5">
                    {[{ k: 'seal', label: '印章样式（推荐）' }, { k: 'progress', label: '进度条样式' }, { k: 'stars', label: '星级样式' }].map(opt => (
                      <button
                        key={opt.k}
                        onClick={() => updateModule('rating', { config: { style: opt.k } })}
                        className={cn(
                          'w-full px-3 py-1.5 rounded border text-left text-xs font-medium transition-all',
                          (selMod.config as { style: string }).style === opt.k
                            ? 'border-gold-400 bg-gold-50 text-gold-700'
                            : 'border-gold-200 bg-rice-50 text-jade-600 hover:border-gold-300'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selMod.key === 'checklist' && (
                <div className="pt-3 border-t border-gold-100">
                  <label className="label-field !text-[10px] !mb-1">
                    鉴定要点数量: <strong className="text-jade-700">{(selMod.config as { count: number }).count}</strong> 条
                  </label>
                  <input
                    type="range" min={4} max={8}
                    value={(selMod.config as { count: number }).count}
                    onChange={e => updateModule('checklist', { config: { count: Number(e.target.value) } })}
                    className="w-full accent-gold-500"
                  />
                </div>
              )}

              {selMod.key === 'signature' && (
                <div className="pt-3 border-t border-gold-100 space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-rice-50 border border-gold-200 cursor-pointer hover:border-gold-300">
                    <span className="text-xs font-medium text-jade-700">显示等级印章</span>
                    <input
                      type="checkbox"
                      checked={(selMod.config as { showLevelSeal: boolean }).showLevelSeal}
                      onChange={e => updateModule('signature', { config: { showLevelSeal: e.target.checked } })}
                      className="w-4 h-4 rounded accent-gold-500"
                    />
                  </label>
                </div>
              )}

              {selMod.key === 'blockchain' && (
                <div className="pt-3 border-t border-gold-100 space-y-2">
                  {[
                    { k: 'showQR', label: '显示二维码' },
                    { k: 'showHash', label: '显示交易哈希' },
                    { k: 'showTimestamp', label: '显示时间戳' },
                  ].map(item => (
                    <label key={item.k} className="flex items-center justify-between p-2 rounded-lg bg-rice-50 border border-gold-200 cursor-pointer hover:border-gold-300">
                      <span className="text-xs font-medium text-jade-700">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={(selMod.config as Record<string, boolean>)[item.k]}
                        onChange={e => updateModule('blockchain', { config: { [item.k]: e.target.checked } })}
                        className="w-4 h-4 rounded accent-gold-500"
                      />
                    </label>
                  ))}
                </div>
              )}

              {selMod.key === 'watermark' && (() => {
                const cfg = selMod.config as { text: string; fontSize: number; opacity: number; rotation: number; density: number };
                return (
                  <div className="space-y-3 pt-3 border-t border-gold-100">
                    <div>
                      <label className="label-field !text-[10px] !mb-1">水印文字</label>
                      <input value={cfg.text} onChange={e => updateModule('watermark', { config: { text: e.target.value } })} className="input-field text-xs h-8 px-2" />
                    </div>
                    {[{ k: 'fontSize', label: '字号', min: 10, max: 40, unit: 'px' },
                      { k: 'opacity', label: '透明度', min: 1, max: 30, unit: '%' },
                      { k: 'rotation', label: '旋转角度', min: 0, max: 90, unit: '°' },
                      { k: 'density', label: '密度', min: 20, max: 100, unit: '' }].map(s => (
                      <div key={s.k}>
                        <label className="label-field !text-[10px] !mb-1 flex justify-between">
                          <span>{s.label}</span>
                          <span className="font-mono font-bold text-jade-700">{cfg[s.k as keyof typeof cfg]}{s.unit}</span>
                        </label>
                        <input
                          type="range" min={s.min} max={s.max}
                          value={cfg[s.k as keyof typeof cfg] as number}
                          onChange={e => updateModule('watermark', { config: { [s.k]: Number(e.target.value) } })}
                          className="w-full accent-gold-500"
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="pt-2 border-t border-gold-100">
                <label className="flex items-center justify-between p-2 rounded-lg bg-rice-50 border border-gold-200 cursor-pointer hover:border-gold-300 mb-2">
                  <span className="text-xs font-medium text-jade-700">模块可见</span>
                  <input
                    type="checkbox"
                    checked={selMod.visible}
                    onChange={() => toggleModule(selMod.key)}
                    className="w-4 h-4 rounded accent-gold-500"
                  />
                </label>
              </div>
            </Card.Content>
          </Card>
        )}

        <Card>
          <Card.Header className="!py-3">
            <Card.Title className="!text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-gold-600" />
              配色主题
            </Card.Title>
          </Card.Header>
          <Card.Content className="!p-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { k: 'jade', name: '墨玉绿', bg: 'from-jade-600 to-jade-800', ring: 'ring-jade-500' },
                { k: 'porcelain', name: '皇家蓝', bg: 'from-porcelain-600 to-porcelain-800', ring: 'ring-porcelain-500' },
                { k: 'cinnabar', name: '朱红', bg: 'from-cinnabar-600 to-cinnabar-800', ring: 'ring-cinnabar-500' },
                { k: 'gray', name: '淡雅灰', bg: 'from-stone-500 to-stone-700', ring: 'ring-stone-400' },
              ].map(t => (
                <button
                  key={t.k}
                  onClick={() => setEditingTpl({ ...editingTpl, theme: t.k as Template['theme'] })}
                  className={cn(
                    'p-3 rounded-xl border-2 transition-all group',
                    editingTpl.theme === t.k
                      ? `border-gold-400 bg-gold-50 shadow-lg ${t.ring} ring-2 ring-offset-2`
                      : 'border-gold-100 hover:border-gold-300 bg-white',
                  )}
                >
                  <div className={cn('w-full h-10 rounded-lg mb-2 bg-gradient-to-r shadow-md', t.bg)} />
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-bold', editingTpl.theme === t.k ? 'text-gold-700' : 'text-stone-600')}>
                      {t.name}
                    </span>
                    {editingTpl.theme === t.k && <Check className="w-3.5 h-3.5 text-gold-600" />}
                  </div>
                </button>
              ))}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="!py-3">
            <Card.Title className="!text-sm flex items-center gap-2">
              <Sticker className="w-4 h-4 text-gold-600" />
              骑缝章设置
            </Card.Title>
          </Card.Header>
          <Card.Content className="!p-3 space-y-4">
            <label className="flex items-center justify-between p-2 rounded-lg bg-rice-50 border border-gold-200 cursor-pointer hover:border-gold-300">
              <div>
                <div className="text-xs font-bold text-jade-700">启用骑缝章</div>
                <div className="text-[10px] text-stone-400">多页报告拼接处防伪</div>
              </div>
              <input
                type="checkbox"
                checked={editingTpl.perforationStamp.enabled}
                onChange={e => setEditingTpl({
                  ...editingTpl,
                  perforationStamp: { ...editingTpl.perforationStamp, enabled: e.target.checked },
                })}
                className="w-4 h-4 rounded accent-gold-500"
              />
            </label>

            <div className={cn('space-y-3 transition-all duration-300', !editingTpl.perforationStamp.enabled && 'opacity-40 pointer-events-none')}>
              <div>
                <label className="label-field !text-[10px] !mb-1.5">印章文字</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['鉴真阁', '鉴真阁骑缝', '定制'].map((txt, i) => (
                    <button
                      key={txt}
                      onClick={() => {
                        if (i < 2) {
                          setEditingTpl({ ...editingTpl, perforationStamp: { ...editingTpl.perforationStamp, text: txt, customText: '' } });
                        }
                      }}
                      className={cn(
                        'px-2 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        (i === 2 ? editingTpl.perforationStamp.customText : editingTpl.perforationStamp.text === txt && !editingTpl.perforationStamp.customText)
                          ? 'border-gold-400 bg-gold-50 text-gold-700 shadow-sm'
                          : 'border-gold-100 text-stone-500 hover:border-gold-300 bg-white',
                      )}
                    >
                      {txt}
                    </button>
                  ))}
                </div>
                {editingTpl.perforationStamp.customText !== undefined && (
                  <input
                    value={editingTpl.perforationStamp.customText}
                    placeholder="输入自定义文字..."
                    onChange={e => setEditingTpl({
                      ...editingTpl,
                      perforationStamp: { ...editingTpl.perforationStamp, customText: e.target.value },
                    })}
                    className="input-field text-xs h-7 px-2 mt-2 w-full"
                  />
                )}
              </div>

              <div>
                <label className="label-field !text-[10px] !mb-1.5">印章颜色</label>
                <div className="flex gap-2">
                  {[
                    { k: 'cinnabar', name: '朱砂红', cls: 'bg-cinnabar-600' },
                    { k: 'jade', name: '墨玉绿', cls: 'bg-jade-700' },
                    { k: 'gold', name: '鎏金色', cls: 'bg-gold-500' },
                  ].map(c => (
                    <button
                      key={c.k}
                      onClick={() => setEditingTpl({
                        ...editingTpl,
                        perforationStamp: { ...editingTpl.perforationStamp, color: c.k as 'cinnabar' | 'jade' | 'gold' },
                      })}
                      className={cn(
                        'flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all',
                        editingTpl.perforationStamp.color === c.k
                          ? 'border-gold-400 bg-gold-50 shadow-sm'
                          : 'border-gold-100 hover:border-gold-300 bg-white',
                      )}
                    >
                      <span className={cn('w-3 h-3 rounded-full shadow-inner', c.cls)} />
                      <span className="text-stone-600 font-medium">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-field !text-[10px] !mb-1 flex justify-between">
                  <span>宽度占比</span>
                  <span className="font-mono font-bold text-jade-700">{editingTpl.perforationStamp.widthPercent}%</span>
                </label>
                <input
                  type="range" min={5} max={15}
                  value={editingTpl.perforationStamp.widthPercent}
                  onChange={e => setEditingTpl({
                    ...editingTpl,
                    perforationStamp: { ...editingTpl.perforationStamp, widthPercent: Number(e.target.value) },
                  })}
                  className="w-full accent-gold-500"
                />
              </div>

              <div>
                <label className="label-field !text-[10px] !mb-1.5">位置</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { k: 'left', name: '左侧', icon: AlignLeft },
                    { k: 'right', name: '右侧', icon: AlignRight },
                    { k: 'both', name: '左右', icon: AlignJustify },
                  ].map(p => (
                    <button
                      key={p.k}
                      onClick={() => setEditingTpl({
                        ...editingTpl,
                        perforationStamp: { ...editingTpl.perforationStamp, position: p.k as 'left' | 'right' | 'both' },
                      })}
                      className={cn(
                        'flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs transition-all',
                        editingTpl.perforationStamp.position === p.k
                          ? 'border-gold-400 bg-gold-50 text-gold-700 shadow-sm'
                          : 'border-gold-100 text-stone-500 hover:border-gold-300 bg-white',
                      )}
                    >
                      <p.icon className="w-4 h-4" />
                      <span className="font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </>
  );
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [editingTplId, setEditingTplId] = useState<string | null>('TPL001');
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showSaveToast, setShowSaveToast] = useState(false);

  const editingTpl = templates.find(t => t.id === editingTplId) || templates[0];

  const categories = [
    { k: 'all', name: '全部' },
    { k: '陶瓷', name: '陶瓷' },
    { k: '玉器', name: '玉器' },
    { k: '书画', name: '书画' },
    { k: '青铜', name: '青铜' },
    { k: '钱币', name: '钱币' },
  ];

  const filteredTemplates = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const updateEditingTpl = (newTpl: Template) => {
    setTemplates(prev => prev.map(t => t.id === newTpl.id ? { ...newTpl, updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') } : t));
  };

  const handleCopy = (tpl: Template) => {
    const newTpl: Template = {
      ...tpl,
      id: `TPL${Date.now().toString().slice(-6)}`,
      name: `${tpl.name} (副本)`,
      usage: 0,
      status: 'disabled',
      isDefault: false,
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    };
    setTemplates([...templates, newTpl]);
  };

  const handleToggleStatus = (tpl: Template) => {
    setTemplates(prev => prev.map(x => x.id === tpl.id
      ? { ...x, status: x.status === 'active' ? 'disabled' : 'active', updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') }
      : x));
  };

  const handleSetDefault = (tpl: Template) => {
    setTemplates(prev => prev.map(x => ({
      ...x,
      isDefault: x.id === tpl.id,
      updatedAt: x.id === tpl.id ? new Date().toISOString() : x.updatedAt,
    })));
  };

  const handleSave = () => {
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2200);
  };

  const themeColors: Record<string, { primary: string; gradient: string; seal: string; text: string }> = {
    jade: { primary: 'text-jade-700', gradient: 'from-jade-600 to-jade-800', seal: 'text-jade-700 border-jade-500', text: 'text-jade-900' },
    royal: { primary: 'text-porcelain-700', gradient: 'from-porcelain-600 to-porcelain-800', seal: 'text-porcelain-700 border-porcelain-500', text: 'text-porcelain-900' },
    cinnabar: { primary: 'text-cinnabar-700', gradient: 'from-cinnabar-600 to-cinnabar-800', seal: 'text-cinnabar-700 border-cinnabar-500', text: 'text-cinnabar-900' },
    elegant: { primary: 'text-stone-700', gradient: 'from-stone-500 to-stone-700', seal: 'text-stone-700 border-stone-400', text: 'text-stone-900' },
  };

  return (
    <div className="min-h-screen bg-paper">
      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 40 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 text-white shadow-2xl shadow-gold-300/40 border border-gold-300 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm">
              <Check className="w-5 h-5" strokeWidth={3} />
            </div>
            <div>
              <div className="font-bold text-sm">模板保存成功</div>
              <div className="text-[11px] text-white/80">已同步到云端 · 可随时恢复历史版本</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 h-screen flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-ink-gradient flex items-center justify-center shadow-lg shadow-jade-500/20">
              <ScrollText className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-jade-900 tracking-wide">报告模板配置中心</h1>
              <p className="text-sm text-stone-500 mt-0.5">所见即所得可视化编辑器 · 防伪水印 · 区块链存证</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" leftIcon={<Layers className="w-4 h-4" />}>版本历史</Button>
            <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>批量导出</Button>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>新建模板</Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-5 overflow-hidden">
          <div className="col-span-3 flex flex-col gap-3 overflow-hidden">
            <Card className="flex-shrink-0">
              <Card.Content className="!p-3 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="搜索模板名称..."
                    className="input-field !pl-9 h-9 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(c => (
                    <button
                      key={c.k}
                      onClick={() => setFilterCategory(c.k)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                        filterCategory === c.k
                          ? 'bg-gold-500 text-white border-gold-500 shadow-md shadow-gold-200'
                          : 'bg-white text-stone-500 border-gold-100 hover:border-gold-300',
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </Card.Content>
            </Card>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {filteredTemplates.map(tpl => (
                <motion.div
                  key={tpl.id}
                  layout
                  whileHover={{ y: -2 }}
                  onClick={() => setEditingTplId(tpl.id)}
                  className={cn(
                    'relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300',
                    editingTplId === tpl.id
                      ? 'border-gold-400 shadow-2xl shadow-gold-300/30 ring-2 ring-gold-200 ring-offset-2'
                      : 'border-gold-100 bg-white hover:border-gold-300 hover:shadow-lg',
                  )}
                >
                  <div className={cn(
                    'absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b',
                    themeColors[tpl.theme].gradient,
                  )} />
                  {tpl.isDefault && (
                    <div className="absolute top-2 left-3 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-500 text-white shadow-md flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" /> 默认
                    </div>
                  )}

                  <div className="p-3 pl-4">
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-jade-900 truncate pr-2">{tpl.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-jade-50 text-jade-700 font-medium">{tpl.category}</span>
                          <Tag variant={tpl.status === 'active' ? 'jade' : 'outline'} className="text-[10px] px-1.5 py-0.5">
                            {tpl.status === 'active' ? '已启用' : '已禁用'}
                          </Tag>
                        </div>
                      </div>
                    </div>

                    <div className="aspect-[1/1.4] rounded-xl bg-gradient-to-br from-stone-50 via-white to-rice-100 border border-gold-100 mb-2.5 relative overflow-hidden shadow-inner">
                      <div className={cn('absolute top-4 left-4 right-4 h-4 rounded bg-gradient-to-r opacity-60', themeColors[tpl.theme].gradient)} />
                      <div className="absolute top-10 left-4 right-4 h-10 rounded-lg bg-white border border-gold-100 shadow-sm" />
                      <div className={cn('absolute bottom-10 left-4 w-14 h-14 rounded-full border-2 opacity-50 -rotate-6', themeColors[tpl.theme].seal)}>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">鉴真阁</span>
                      </div>
                      <div className="absolute bottom-3 left-4 right-4 h-0.5 bg-stone-300 rounded-full" />
                      <div className="absolute bottom-5 left-4 w-12 h-0.5 bg-stone-200 rounded-full" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-2.5">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {tpl.usage.toLocaleString()}次
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(tpl.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {[
                        { icon: Eye, title: '预览' },
                        { icon: Copy, title: '复制', action: () => handleCopy(tpl) },
                        { icon: tpl.status === 'active' ? EyeOff : Eye, title: tpl.status === 'active' ? '禁用' : '启用', action: () => handleToggleStatus(tpl) },
                        { icon: Star, title: '设默认', action: () => handleSetDefault(tpl) },
                        { icon: Trash2, title: '删除', danger: true },
                      ].map((btn, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); btn.action?.(); }}
                          title={btn.title}
                          className={cn(
                            'aspect-square rounded-lg flex items-center justify-center border transition-all',
                            btn.danger
                              ? 'border-cinnabar-100 text-cinnabar-500 hover:bg-cinnabar-50 hover:border-cinnabar-300'
                              : 'border-gold-100 text-stone-400 hover:text-gold-700 hover:bg-gold-50 hover:border-gold-300 hover:shadow-sm',
                          )}
                        >
                          <btn.icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="col-span-9 overflow-hidden">
            <EditorArea
              template={editingTpl}
              onUpdate={updateEditingTpl}
              onSave={handleSave}
              themeColors={themeColors}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
