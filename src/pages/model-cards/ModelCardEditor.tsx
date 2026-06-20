import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Eye,
  Download,
  Save,
  ArrowLeft,
  Grid3X3,
  Layers,
  Settings,
  Wand2,
  Plus,
  Minus,
  Maximize2,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import EditorCanvas from '@/components/model-cards/EditorCanvas';
import ElementPropertyPanel from '@/components/model-cards/ElementPropertyPanel';
import ElementLibrary from '@/components/model-cards/ElementLibrary';
import AIBackgroundPanel from '@/components/model-cards/AIBackgroundPanel';
import useModelCardStore from '@/store/useModelCardStore';
import { cn } from '@/lib/utils';
import type { ExportSize } from '@shared/types';

const ModelCardEditor: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const {
    currentTemplate,
    templates,
    initializeEditor,
    zoom,
    setZoom,
    showGrid,
    setShowGrid,
    undo,
    redo,
    canUndo,
    canRedo,
    setCanvasSize,
    exportOptions,
    exportModelCard,
    loading,
    processingStep,
    currentModelCard,
    createModelCard,
  } = useModelCardStore();

  const [activeLeftTab, setActiveLeftTab] = useState('elements');
  const [activeRightTab, setActiveRightTab] = useState('properties');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1920);
  const [cardName, setCardName] = useState('我的模卡');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const template = currentTemplate || templates.find(t => t.id === templateId);

  useEffect(() => {
    if (templateId) {
      initializeEditor(templateId);
    } else {
      initializeEditor();
    }
  }, [templateId, initializeEditor]);

  const handleExport = useCallback(async (sizeId: ExportSize, width?: number, height?: number) => {
    const exportOption = exportOptions.find(o => o.id === sizeId);
    if (exportOption) {
      if (sizeId === 'custom') {
        setCanvasSize(customWidth, customHeight);
      } else {
        setCanvasSize(exportOption.width, exportOption.height);
      }
      
      const sizeStr = sizeId === 'custom'
        ? `${customWidth}x${customHeight}`
        : `${exportOption.width}x${exportOption.height}`;

      if (currentModelCard) {
        await exportModelCard(currentModelCard.id, sizeStr);
      } else {
        const newCard = await createModelCard('artist-1', templateId || 'template-1', cardName);
        if (newCard) {
          await exportModelCard(newCard.id, sizeStr);
        }
      }
    }
    setShowExportDropdown(false);
  }, [exportOptions, customWidth, customHeight, setCanvasSize, currentModelCard, createModelCard, exportModelCard, templateId, cardName]);

  const handleSave = useCallback(async () => {
    if (currentModelCard) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } else {
      await createModelCard('artist-1', templateId || 'template-1', cardName);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  }, [currentModelCard, createModelCard, templateId, cardName]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-shrink-0 h-16 bg-midnight-900/80 backdrop-blur-xl border-b border-midnight-800 px-4 md:px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/model-cards')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            返回
          </Button>
          <div className="h-8 w-px bg-midnight-700" />
          <div>
            <Input
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-48 h-8 bg-transparent border-0 text-white font-semibold text-lg focus:outline-none focus:ring-0 p-0"
            />
            {template && (
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" size="sm">
                  {template.name}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-midnight-800/50 border border-midnight-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo()}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo()}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-8 w-px bg-midnight-700" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className={cn(showGrid && 'text-rose-400 bg-rose-500/10')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-midnight-800/50 border border-midnight-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm text-midnight-300 w-12 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(1)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          <div className="h-8 w-px bg-midnight-700" />

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              leftIcon={<Download className="w-4 h-4" />}
              rightIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              }
              loading={processingStep === 'exporting'}
            >
              导出
            </Button>

            {showExportDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportDropdown(false)}
                />
                <Card className="absolute right-0 top-full mt-2 w-72 p-2 z-50 shadow-xl">
                  <div className="p-2">
                    <p className="text-xs font-semibold text-midnight-400 uppercase tracking-wider mb-2 px-2">
                      社交媒体
                    </p>
                    {exportOptions.filter(o => o.category === 'social').map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleExport(option.id as ExportSize)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-midnight-800 transition-colors duration-200 group"
                      >
                        <span className="text-sm text-white">{option.name}</span>
                        <span className="text-xs text-midnight-400 group-hover:text-rose-400 transition-colors">
                          {option.width}×{option.height}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="px-2 py-1">
                    <p className="text-xs font-semibold text-midnight-400 uppercase tracking-wider mb-2 px-2">
                      打印
                    </p>
                    {exportOptions.filter(o => o.category === 'print').map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleExport(option.id as ExportSize)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-midnight-800 transition-colors duration-200 group"
                      >
                        <span className="text-sm text-white">{option.name}</span>
                        <span className="text-xs text-midnight-400 group-hover:text-rose-400 transition-colors">
                          {option.width}×{option.height}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-midnight-700">
                    <p className="text-xs font-semibold text-midnight-400 uppercase tracking-wider mb-2 px-2">
                      自定义尺寸
                    </p>
                    <div className="flex gap-2 p-2 mb-2">
                      <Input
                        type="number"
                        size="sm"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Number(e.target.value))}
                        placeholder="宽"
                      />
                      <Input
                        type="number"
                        size="sm"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Number(e.target.value))}
                        placeholder="高"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleExport('custom')}
                    >
                      导出自定义尺寸
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          >
            {saveSuccess ? '已保存' : '保存'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 flex-shrink-0 bg-midnight-900/50 border-r border-midnight-800 flex flex-col">
          <Tabs value={activeLeftTab} onValueChange={setActiveLeftTab} className="flex-1 flex flex-col">
            <TabsList className="m-4 mb-0 h-10">
              <TabsTrigger value="elements" className="flex-1 py-1.5 text-xs">
                <Layers className="w-4 h-4 mr-1" />
                元素
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 py-1.5 text-xs">
                <Wand2 className="w-4 h-4 mr-1" />
                AI 背景
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-hidden">
              <TabsContent value="elements" className="h-full mt-4 m-0 p-0">
                <ElementLibrary />
              </TabsContent>
              <TabsContent value="ai" className="h-full mt-4 m-0 p-0">
                <AIBackgroundPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <EditorCanvas />

          {processingStep === 'exporting' && (
            <div className="absolute inset-0 bg-midnight-900/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
                <p className="text-white font-medium mb-1">正在导出...</p>
                <p className="text-midnight-400 text-sm">请稍候，正在生成高质量图片</p>
              </div>
            </div>
          )}

          {processingStep === 'complete' && (
            <div className="absolute inset-0 bg-midnight-900/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-white font-medium mb-1">导出成功！</p>
                <p className="text-midnight-400 text-sm">图片已准备好下载</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-80 flex-shrink-0 bg-midnight-900/50 border-l border-midnight-800 flex flex-col">
          <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex-1 flex flex-col">
            <TabsList className="m-4 mb-0 h-10">
              <TabsTrigger value="properties" className="flex-1 py-1.5 text-xs">
                <Settings className="w-4 h-4 mr-1" />
                属性
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1 py-1.5 text-xs">
                <Eye className="w-4 h-4 mr-1" />
                预览
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-hidden">
              <TabsContent value="properties" className="h-full mt-4 m-0 p-0">
                <ElementPropertyPanel />
              </TabsContent>
              <TabsContent value="preview" className="h-full mt-4 m-0 p-0">
                <div className="p-6">
                  <h4 className="text-xs font-semibold text-midnight-200 mb-4 uppercase tracking-wider">
                    实时预览
                  </h4>
                  <div className="aspect-[9/16] bg-midnight-800 rounded-xl border border-midnight-700 overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-midnight-500 text-sm text-center px-4">
                        预览模式下<br />画布内容将实时显示
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-midnight-400">尺寸</span>
                      <span className="text-white">
                        {useModelCardStore.getState().canvasWidth} × {useModelCardStore.getState().canvasHeight}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-midnight-400">元素数量</span>
                      <span className="text-white">{useModelCardStore.getState().elements.length}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ModelCardEditor;
