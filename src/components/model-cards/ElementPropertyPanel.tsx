import React from 'react';
import { Copy, Trash2, Lock, Unlock, ArrowUpToLine, ArrowDownToLine, Type, Image, Shapes, Share2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import useModelCardStore from '@/store/useModelCardStore';
import { cn } from '@/lib/utils';
import type { CanvasElement } from '@shared/types';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-xs font-semibold text-midnight-200 mb-3 uppercase tracking-wider">{children}</h4>
);

const PropertyRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-sm text-midnight-400 mb-1.5">{label}</label>
    {children}
  </div>
);

const ElementPropertyPanel: React.FC = () => {
  const {
    elements,
    selectedElementId,
    updateElement,
    removeElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    lockElement,
    saveToHistory,
    backgroundColor,
    setBackgroundColor,
  } = useModelCardStore();

  const selectedElement = elements.find(e => e.id === selectedElementId);

  const handleUpdate = (updates: Partial<CanvasElement>) => {
    if (selectedElementId) {
      updateElement(selectedElementId, updates);
    }
  };

  const handleContentUpdate = (contentUpdates: Partial<NonNullable<CanvasElement['content']>>) => {
    if (selectedElement && selectedElementId) {
      updateElement(selectedElementId, {
        content: { ...selectedElement.content, ...contentUpdates },
      });
    }
  };

  if (!selectedElement) {
    return (
      <div className="p-6">
        <SectionTitle>画布属性</SectionTitle>
        <PropertyRow label="背景颜色">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-10 h-10 rounded-lg border-2 border-midnight-600 cursor-pointer bg-transparent"
            />
            <Input
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              size="sm"
            />
          </div>
        </PropertyRow>
        <div className="mt-6 p-4 rounded-lg bg-midnight-800/50 border border-midnight-700 text-center">
          <p className="text-sm text-midnight-400">选择一个元素来编辑其属性</p>
        </div>
      </div>
    );
  }

  const isLocked = selectedElement.locked;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>元素属性</SectionTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => duplicateElement(selectedElement.id)}
              disabled={isLocked}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => lockElement(selectedElement.id, !isLocked)}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => bringToFront(selectedElement.id)}
              disabled={isLocked}
            >
              <ArrowUpToLine className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => sendToBack(selectedElement.id)}
              disabled={isLocked}
            >
              <ArrowDownToLine className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeElement(selectedElement.id)}
              disabled={isLocked || selectedElement.id === 'el-bg'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>位置和尺寸</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <PropertyRow label="X">
            <Input
              type="number"
              size="sm"
              value={Math.round(selectedElement.x)}
              onChange={(e) => handleUpdate({ x: Number(e.target.value) })}
              disabled={isLocked}
            />
          </PropertyRow>
          <PropertyRow label="Y">
            <Input
              type="number"
              size="sm"
              value={Math.round(selectedElement.y)}
              onChange={(e) => handleUpdate({ y: Number(e.target.value) })}
              disabled={isLocked}
            />
          </PropertyRow>
          <PropertyRow label="宽度">
            <Input
              type="number"
              size="sm"
              value={Math.round(selectedElement.width)}
              onChange={(e) => handleUpdate({ width: Math.max(20, Number(e.target.value)) })}
              disabled={isLocked}
            />
          </PropertyRow>
          <PropertyRow label="高度">
            <Input
              type="number"
              size="sm"
              value={Math.round(selectedElement.height)}
              onChange={(e) => handleUpdate({ height: Math.max(20, Number(e.target.value)) })}
              disabled={isLocked}
            />
          </PropertyRow>
          <PropertyRow label="旋转">
            <Input
              type="number"
              size="sm"
              value={Math.round(selectedElement.rotation)}
              onChange={(e) => handleUpdate({ rotation: Number(e.target.value) })}
              disabled={isLocked}
            />
          </PropertyRow>
          <PropertyRow label="透明度">
            <Input
              type="number"
              size="sm"
              min={0}
              max={1}
              step={0.1}
              value={selectedElement.opacity}
              onChange={(e) => handleUpdate({ opacity: Math.max(0, Math.min(1, Number(e.target.value))) })}
              disabled={isLocked}
            />
          </PropertyRow>
        </div>
      </div>

      {selectedElement.type === 'text' && (
        <div>
          <SectionTitle>
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              文本属性
            </div>
          </SectionTitle>
          <PropertyRow label="文本内容">
            <textarea
              value={selectedElement.content?.text || ''}
              onChange={(e) => handleContentUpdate({ text: e.target.value })}
              disabled={isLocked}
              className="w-full h-24 bg-midnight-900/50 border-2 border-midnight-700 rounded-xl px-4 py-2 text-white text-sm focus:border-rose-500 focus:outline-none transition-all duration-300 resize-none"
            />
          </PropertyRow>
          <div className="grid grid-cols-2 gap-3">
            <PropertyRow label="字体大小">
              <Input
                type="number"
                size="sm"
                value={selectedElement.content?.fontSize || 16}
                onChange={(e) => handleContentUpdate({ fontSize: Number(e.target.value) })}
                disabled={isLocked}
              />
            </PropertyRow>
            <PropertyRow label="字体粗细">
              <Input
                type="number"
                size="sm"
                value={selectedElement.content?.fontWeight || 400}
                onChange={(e) => handleContentUpdate({ fontWeight: Number(e.target.value) })}
                disabled={isLocked}
              />
            </PropertyRow>
          </div>
          <PropertyRow label="字体">
            <select
              value={selectedElement.content?.fontFamily || 'Inter'}
              onChange={(e) => handleContentUpdate({ fontFamily: e.target.value })}
              disabled={isLocked}
              className="w-full h-11 bg-midnight-900/50 border-2 border-midnight-700 rounded-xl px-4 text-white text-sm focus:border-rose-500 focus:outline-none transition-all duration-300"
            >
              <option value="Inter">Inter</option>
              <option value="Playfair Display">Playfair Display</option>
            </select>
          </PropertyRow>
          <PropertyRow label="文字颜色">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={selectedElement.content?.color || '#ffffff'}
                onChange={(e) => handleContentUpdate({ color: e.target.value })}
                className="w-10 h-10 rounded-lg border-2 border-midnight-600 cursor-pointer bg-transparent"
                disabled={isLocked}
              />
              <Input
                value={selectedElement.content?.color || '#ffffff'}
                onChange={(e) => handleContentUpdate({ color: e.target.value })}
                size="sm"
                disabled={isLocked}
              />
            </div>
          </PropertyRow>
          <PropertyRow label="对齐方式">
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <Button
                  key={align}
                  variant={selectedElement.content?.textAlign === align ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleContentUpdate({ textAlign: align })}
                  disabled={isLocked}
                >
                  {align === 'left' ? <AlignLeft className="w-4 h-4" /> : align === 'center' ? <AlignCenter className="w-4 h-4" /> : <AlignRight className="w-4 h-4" />}
                </Button>
              ))}
            </div>
          </PropertyRow>
        </div>
      )}

      {selectedElement.type === 'photo' && (
        <div>
          <SectionTitle>
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              图片属性
            </div>
          </SectionTitle>
          <PropertyRow label="图片 URL">
            <Input
              size="sm"
              value={selectedElement.content?.imageUrl || ''}
              onChange={(e) => handleContentUpdate({ imageUrl: e.target.value })}
              disabled={isLocked}
              placeholder="https://..."
            />
          </PropertyRow>
          <PropertyRow label="圆角">
            <Input
              type="number"
              size="sm"
              value={selectedElement.content?.borderRadius || 0}
              onChange={(e) => handleContentUpdate({ borderRadius: Number(e.target.value) })}
              disabled={isLocked}
            />
          </PropertyRow>
        </div>
      )}

      {selectedElement.type === 'shape' && selectedElement.id !== 'el-bg' && (
        <div>
          <SectionTitle>
            <div className="flex items-center gap-2">
              <Shapes className="w-4 h-4" />
              形状属性
            </div>
          </SectionTitle>
          <PropertyRow label="填充颜色">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={selectedElement.content?.shapeColor || '#ffffff'}
                onChange={(e) => handleContentUpdate({ shapeColor: e.target.value })}
                className="w-10 h-10 rounded-lg border-2 border-midnight-600 cursor-pointer bg-transparent"
                disabled={isLocked}
              />
              <Input
                value={selectedElement.content?.shapeColor || '#ffffff'}
                onChange={(e) => handleContentUpdate({ shapeColor: e.target.value })}
                size="sm"
                disabled={isLocked}
              />
            </div>
          </PropertyRow>
          <div className="grid grid-cols-2 gap-3">
            <PropertyRow label="边框宽度">
              <Input
                type="number"
                size="sm"
                value={selectedElement.content?.borderWidth || 0}
                onChange={(e) => handleContentUpdate({ borderWidth: Number(e.target.value) })}
                disabled={isLocked}
              />
            </PropertyRow>
            <PropertyRow label="圆角">
              <Input
                type="number"
                size="sm"
                value={selectedElement.content?.borderRadius || 0}
                onChange={(e) => handleContentUpdate({ borderRadius: Number(e.target.value) })}
                disabled={isLocked}
              />
            </PropertyRow>
          </div>
          <PropertyRow label="边框颜色">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={selectedElement.content?.borderColor || '#ffffff'}
                onChange={(e) => handleContentUpdate({ borderColor: e.target.value })}
                className="w-10 h-10 rounded-lg border-2 border-midnight-600 cursor-pointer bg-transparent"
                disabled={isLocked}
              />
              <Input
                value={selectedElement.content?.borderColor || '#ffffff'}
                onChange={(e) => handleContentUpdate({ borderColor: e.target.value })}
                size="sm"
                disabled={isLocked}
              />
            </div>
          </PropertyRow>
        </div>
      )}

      {selectedElement.type === 'social-icon' && (
        <div>
          <SectionTitle>
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              社交图标属性
            </div>
          </SectionTitle>
          <PropertyRow label="图标类型">
            <select
              value={selectedElement.content?.socialIconType || 'instagram'}
              onChange={(e) => handleContentUpdate({ socialIconType: e.target.value as any })}
              disabled={isLocked}
              className="w-full h-11 bg-midnight-900/50 border-2 border-midnight-700 rounded-xl px-4 text-white text-sm focus:border-rose-500 focus:outline-none transition-all duration-300"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="wechat">微信</option>
              <option value="weibo">微博</option>
              <option value="xiaohongshu">小红书</option>
            </select>
          </PropertyRow>
          <PropertyRow label="图标颜色">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={selectedElement.content?.color || '#ffffff'}
                onChange={(e) => handleContentUpdate({ color: e.target.value })}
                className="w-10 h-10 rounded-lg border-2 border-midnight-600 cursor-pointer bg-transparent"
                disabled={isLocked}
              />
              <Input
                value={selectedElement.content?.color || '#ffffff'}
                onChange={(e) => handleContentUpdate({ color: e.target.value })}
                size="sm"
                disabled={isLocked}
              />
            </div>
          </PropertyRow>
        </div>
      )}

      <Button
        variant="primary"
        className="w-full"
        onClick={saveToHistory}
      >
        保存更改
      </Button>
    </div>
  );
};

export default ElementPropertyPanel;
