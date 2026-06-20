import React, { useState, useRef } from 'react';
import { Upload, Wand2, Sparkles, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useModelCardStore from '@/store/useModelCardStore';
import { cn } from '@/lib/utils';
import type { BackgroundPreset } from '@shared/types';

const AIBackgroundPanel: React.FC = () => {
  const {
    backgroundPresets,
    selectedBackgroundPreset,
    setSelectedBackgroundPreset,
    originalPhotoUrl,
    setOriginalPhotoUrl,
    generatedBackgroundUrl,
    isGeneratingBackground,
    generateBackground,
    setBackgroundColor,
  } = useModelCardStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [customColor, setCustomColor] = useState('#1a1a2e');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'studio', label: '影棚' },
    { id: 'outdoor', label: '户外' },
    { id: 'urban', label: '都市' },
    { id: 'abstract', label: '抽象' },
  ];

  const filteredPresets = activeCategory === 'all'
    ? backgroundPresets
    : backgroundPresets.filter(p => p.category === activeCategory);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset: BackgroundPreset) => {
    setSelectedBackgroundPreset(preset);
    if (preset.gradient) {
      const colorMatch = preset.gradient.match(/#[a-fA-F0-9]{6}/g);
      if (colorMatch && colorMatch.length > 0) {
        setBackgroundColor(colorMatch[0]);
      }
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-400" />
          AI 背景替换
        </h4>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-midnight-600 rounded-xl p-6 text-center cursor-pointer hover:border-rose-500/50 hover:bg-midnight-800/30 transition-all duration-300"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {originalPhotoUrl ? (
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <img
                src={originalPhotoUrl}
                alt="Original"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm">点击更换图片</p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-midnight-400 mx-auto mb-3" />
              <p className="text-sm text-midnight-300">点击上传原始照片</p>
              <p className="text-xs text-midnight-500 mt-1">支持 JPG, PNG 格式</p>
            </>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white mb-3">背景预设</h4>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300",
                activeCategory === cat.id
                  ? "bg-gradient-primary text-white"
                  : "bg-midnight-800 text-midnight-400 hover:text-white hover:bg-midnight-700"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filteredPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300",
                selectedBackgroundPreset?.id === preset.id
                  ? "border-rose-500 ring-2 ring-rose-500/30"
                  : "border-midnight-700 hover:border-midnight-600"
              )}
            >
              <img
                src={preset.thumbnailUrl}
                alt={preset.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 to-transparent" />
              <p className="absolute bottom-2 left-2 right-2 text-xs text-white font-medium truncate">
                {preset.name}
              </p>
              {selectedBackgroundPreset?.id === preset.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          纯色背景
        </h4>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              setBackgroundColor(e.target.value);
            }}
            className="w-12 h-12 rounded-xl border-2 border-midnight-600 cursor-pointer bg-transparent"
          />
          <Input
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                setBackgroundColor(e.target.value);
              }
            }}
            size="sm"
          />
        </div>
      </div>

      <Button
        variant="primary"
        className="w-full"
        leftIcon={<Wand2 className="w-4 h-4" />}
        onClick={generateBackground}
        loading={isGeneratingBackground}
        disabled={!originalPhotoUrl && !selectedBackgroundPreset}
      >
        {isGeneratingBackground ? '生成中...' : 'AI 生成背景'}
      </Button>

      {generatedBackgroundUrl && originalPhotoUrl && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">效果对比</h4>
          <div className="relative rounded-xl overflow-hidden aspect-square">
            <img
              src={generatedBackgroundUrl}
              alt="After"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={originalPhotoUrl}
                alt="Before"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-lg"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                <div className="flex gap-0.5">
                  <ChevronLeft className="w-3 h-3 text-midnight-800" />
                  <ChevronRight className="w-3 h-3 text-midnight-800" />
                </div>
              </div>
            </div>
            <div
              className="absolute top-0 bottom-0 w-full cursor-ew-resize"
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const handleMove = (moveEvent: MouseEvent) => {
                  const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                  setSliderPosition(x);
                };
                const handleUp = () => {
                  document.removeEventListener('mousemove', handleMove);
                  document.removeEventListener('mouseup', handleUp);
                };
                document.addEventListener('mousemove', handleMove);
                document.addEventListener('mouseup', handleUp);
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-midnight-400">
            <span>原图</span>
            <span>AI 生成</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIBackgroundPanel;
