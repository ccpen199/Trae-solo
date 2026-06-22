import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import LayerPanel from '@/components/editor/LayerPanel';
import { photos } from '@/mock/data/photos';
import { templates } from '@/mock/data/templates';
import { products } from '@/mock/data/products';
import { useEditorStore } from '@/store/editorStore';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Eye,
  Download,
  ShoppingCart,
  Save,
  Image as ImageIcon,
  Type,
  Sticker,
  Frame,
  Sparkles,
  Move,
  Maximize2,
  RotateCw,
  Layers,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';

const materialCategories = [
  { id: 'background', name: '背景', icon: ImageIcon },
  { id: 'sticker', name: '贴纸', icon: Sticker },
  { id: 'frame', name: '边框', icon: Frame },
  { id: 'decoration', name: '装饰', icon: Sparkles },
];

const mockMaterials = {
  background: [
    { id: 'bg-1', name: '纯白背景', color: '#FFFFFF', thumbnail: '' },
    { id: 'bg-2', name: '米黄背景', color: '#FDFBF7', thumbnail: '' },
    { id: 'bg-3', name: '淡粉背景', color: '#FFE4D6', thumbnail: '' },
    { id: 'bg-4', name: '浅蓝背景', color: '#D9E4DE', thumbnail: '' },
    { id: 'bg-5', name: '暖橙渐变', color: 'linear-gradient(135deg, #FFE4D6 0%, #FFC7AD 100%)', thumbnail: '' },
    { id: 'bg-6', name: '复古纸纹', color: '#F5EFE0', thumbnail: '' },
  ],
  sticker: [
    { id: 'st-1', name: '可爱花朵', emoji: '🌸' },
    { id: 'st-2', name: '爱心', emoji: '❤️' },
    { id: 'st-3', name: '星星', emoji: '⭐' },
    { id: 'st-4', name: '彩虹', emoji: '🌈' },
    { id: 'st-5', name: '相机', emoji: '📷' },
    { id: 'st-6', name: '胶片', emoji: '🎞️' },
    { id: 'st-7', name: '气球', emoji: '🎈' },
    { id: 'st-8', name: '礼物', emoji: '🎁' },
  ],
  frame: [
    { id: 'fr-1', name: '简约白框', style: 'border-4 border-white' },
    { id: 'fr-2', name: '金色细框', style: 'border-2 border-gold-400' },
    { id: 'fr-3', name: '复古棕框', style: 'border-8 border-amber-700' },
    { id: 'fr-4', name: '胶片齿孔', style: 'film-perforation' },
  ],
  decoration: [
    { id: 'dc-1', name: '光斑效果', emoji: '✨' },
    { id: 'dc-2', name: '散景', emoji: '💫' },
    { id: 'dc-3', name: '漏光', emoji: '🌅' },
    { id: 'dc-4', name: '颗粒感', emoji: '🌫️' },
  ],
};

const textPresets = [
  { id: 'tp-1', name: '标题', fontSize: 48, fontWeight: 'bold', color: '#3A3530' },
  { id: 'tp-2', name: '副标题', fontSize: 32, fontWeight: '600', color: '#5E5749' },
  { id: 'tp-3', name: '正文', fontSize: 16, fontWeight: 'normal', color: '#3A3530' },
  { id: 'tp-4', name: '手写体', fontSize: 24, fontWeight: 'normal', color: '#8B2635', fontStyle: 'italic' },
  { id: 'tp-5', name: '复古标题', fontSize: 36, fontWeight: 'bold', color: '#D4542A' },
  { id: 'tp-6', name: '小字说明', fontSize: 12, fontWeight: 'normal', color: '#857B66' },
];

const fontOptions = [
  { value: 'serif', label: '思源宋体' },
  { value: 'sans', label: '苹方' },
  { value: 'display', label: '展示字体' },
];

export default function EditorPage() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const { layers, selectedLayerId, canvasWidth, canvasHeight, selectLayer, updateLayer, addLayer, removeLayer, undo, redo, historyIndex, history, setLayers, setCanvasSize } = useEditorStore();
  const { addItem } = useCartStore();
  const [zoom, setZoom] = useState(100);
  const [leftTab, setLeftTab] = useState('materials');
  const [materialCategory, setMaterialCategory] = useState('background');
  const [rightTab, setRightTab] = useState('layers');

  useEffect(() => {
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        if (template.canvasWidth && template.canvasHeight) {
          setCanvasSize(template.canvasWidth, template.canvasHeight);
        }
        if (template.layers && template.layers.length > 0) {
          setLayers(template.layers as any);
        }
      }
    }
  }, [templateId, setCanvasSize, setLayers]);

  const currentTemplate = templates.find((t) => t.id === templateId);
  const currentProduct = currentTemplate ? products.find((p) => p.id === currentTemplate.productId) : null;

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 10, 25));
  }, []);

  const handleAddToCart = useCallback(() => {
    const productName = currentProduct?.name || '相册';
    const productId = currentProduct?.id || 'album';
    const material = currentProduct?.materialOptions?.[0];
    const unitPrice = currentProduct ? Math.round(currentProduct.priceRange.min * 100) : 12800;

    const cartItem = {
      id: `cart-${Date.now()}`,
      templateId: templateId || 'custom',
      templateName: currentTemplate?.name || '自定义设计',
      templateThumbnail: currentTemplate?.thumbnailUrl || 'https://picsum.photos/seed/editor-preview/200/150',
      productId,
      productName,
      materialId: material?.name || 'mat-001',
      materialName: material?.name || '哑面相纸',
      quantity: 1,
      unitPrice,
      editorSnapshot: JSON.stringify(layers),
      renderedPreview: currentTemplate?.thumbnailUrl || 'https://picsum.photos/seed/editor-preview/200/150',
    };
    addItem(cartItem as any);
    navigate('/cart');
  }, [addItem, layers, navigate, currentProduct, currentTemplate, templateId]);

  const handleSaveDraft = useCallback(() => {
    alert('草稿已保存');
  }, []);

  const handleAddText = useCallback((preset: typeof textPresets[0]) => {
    const newLayer = {
      id: `text-${Date.now()}`,
      type: 'text' as const,
      name: preset.name,
      visible: true,
      locked: false,
      order: layers.length,
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      textData: {
        content: '双击编辑文字',
        fontSize: preset.fontSize,
        fontFamily: preset.fontStyle || 'serif',
        fontWeight: preset.fontWeight,
        color: preset.color,
        textAlign: 'left' as const,
        lineHeight: 1.5,
        letterSpacing: 0,
      },
    };
    addLayer(newLayer as any);
  }, [addLayer, layers.length]);

  const handleAddPhoto = useCallback((photo: typeof photos[0]) => {
    const newLayer = {
      id: `photo-${Date.now()}`,
      type: 'image' as const,
      name: `照片 ${layers.length + 1}`,
      visible: true,
      locked: false,
      order: layers.length,
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      rotation: 0,
      opacity: 1,
      imageData: {
        src: photo.url,
        originalWidth: photo.width,
        originalHeight: photo.height,
        objectFit: 'cover' as const,
      },
    };
    addLayer(newLayer as any);
  }, [addLayer, layers.length]);

  const handleLayerReorder = useCallback((newLayers: any[]) => {
    newLayers.forEach((layer, index) => {
      updateLayer(layer.id, { order: index });
    });
  }, [updateLayer]);

  const handleToggleVisibility = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { visible: !layer.visible });
    }
  }, [layers, updateLayer]);

  const handleToggleLock = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { locked: !layer.locked });
    }
  }, [layers, updateLayer]);

  const handleDeleteLayer = useCallback((layerId: string) => {
    removeLayer(layerId);
  }, [removeLayer]);

  const handleDuplicateLayer = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const newLayer = {
        ...layer,
        id: `${layer.id}-copy-${Date.now()}`,
        name: `${layer.name} 副本`,
        x: layer.x + 20,
        y: layer.y + 20,
        order: layers.length,
      };
      addLayer(newLayer);
    }
  }, [layers, addLayer]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-paper-100">
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧面板 */}
          <div className="w-72 flex-shrink-0 flex flex-col border-r border-paper-200 bg-white">
            <Tabs value={leftTab} onValueChange={setLeftTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="materials">素材库</TabsTrigger>
                <TabsTrigger value="photos">我的照片</TabsTrigger>
                <TabsTrigger value="text">文字</TabsTrigger>
              </TabsList>

              <TabsContent value="materials" className="flex-1 overflow-y-auto px-4 mt-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {materialCategories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setMaterialCategory(cat.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                          materialCategory === cat.id
                            ? 'bg-gradient-brand text-white shadow-soft'
                            : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {materialCategory === 'background' && mockMaterials.background.map(mat => (
                    <button
                      key={mat.id}
                      className="aspect-square rounded-lg border-2 border-paper-200 overflow-hidden hover:border-brand-400 transition-colors"
                      style={{ background: mat.color }}
                      title={mat.name}
                    />
                  ))}
                  {materialCategory === 'sticker' && mockMaterials.sticker.map(mat => (
                    <button
                      key={mat.id}
                      className="aspect-square rounded-lg border border-paper-200 bg-paper-50 flex items-center justify-center text-2xl hover:border-brand-400 hover:bg-brand-50 transition-all"
                      title={mat.name}
                    >
                      {mat.emoji}
                    </button>
                  ))}
                  {materialCategory === 'frame' && mockMaterials.frame.map(mat => (
                    <button
                      key={mat.id}
                      className={cn(
                        'aspect-square rounded-lg bg-white flex items-center justify-center',
                        mat.style,
                        'hover:border-brand-400 transition-all'
                      )}
                      title={mat.name}
                    >
                      <div className="w-3/4 h-3/4 bg-paper-100" />
                    </button>
                  ))}
                  {materialCategory === 'decoration' && mockMaterials.decoration.map(mat => (
                    <button
                      key={mat.id}
                      className="aspect-square rounded-lg border border-paper-200 bg-paper-50 flex items-center justify-center text-2xl hover:border-brand-400 hover:bg-brand-50 transition-all"
                      title={mat.name}
                    >
                      {mat.emoji}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="photos" className="flex-1 overflow-y-auto px-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  {photos.slice(0, 8).map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => handleAddPhoto(photo)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-400 transition-all group relative"
                    >
                      <img
                        src={photo.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Plus className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="text" className="flex-1 overflow-y-auto px-4 mt-4">
                <p className="text-sm text-paper-500 mb-3">点击添加文字样式</p>
                <div className="space-y-2">
                  {textPresets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleAddText(preset)}
                      className="w-full p-3 rounded-lg border border-paper-200 bg-white hover:border-brand-400 hover:bg-brand-50/50 transition-all text-left"
                    >
                      <p
                        className="font-medium mb-1"
                        style={{
                          fontSize: Math.min(preset.fontSize, 20),
                          fontWeight: preset.fontWeight,
                          color: preset.color,
                          fontStyle: preset.fontStyle === 'italic' ? 'italic' : 'normal',
                        }}
                      >
                        {preset.name}
                      </p>
                      <p className="text-xs text-paper-400">
                        {preset.fontSize}px · {preset.fontWeight}
                      </p>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 中间画布区 */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* 顶部工具栏 */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-paper-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                    canUndo ? 'text-paper-600 hover:bg-paper-100' : 'text-paper-300 cursor-not-allowed'
                  )}
                  title="撤销"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                    canRedo ? 'text-paper-600 hover:bg-paper-100' : 'text-paper-300 cursor-not-allowed'
                  )}
                  title="重做"
                >
                  <Redo2 className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-paper-200 mx-2" />

                <button
                  onClick={handleZoomOut}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-paper-600 hover:bg-paper-100 transition-colors"
                  title="缩小"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-paper-700 w-14 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-paper-600 hover:bg-paper-100 transition-colors"
                  title="放大"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                  预览
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                  导出
                </Button>
              </div>
            </div>

            {/* 画布区域 */}
            <div className="flex-1 overflow-auto bg-paper-200/50 flex items-center justify-center p-8">
              <div
                className="relative bg-white shadow-large rounded-sm"
                style={{
                  width: canvasWidth * (zoom / 100),
                  height: canvasHeight * (zoom / 100),
                  minWidth: 200,
                  minHeight: 150,
                }}
                onClick={() => selectLayer(null)}
              >
                {/* 纸张纹理效果 */}
                <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none rounded-sm" />

                {/* 图层渲染 */}
                {layers
                  .filter(l => l.visible)
                  .sort((a, b) => a.order - b.order)
                  .map(layer => {
                    const isSelected = layer.id === selectedLayerId;
                    const scale = zoom / 100;

                    return (
                      <div
                        key={layer.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectLayer(layer.id);
                        }}
                        className={cn(
                          'absolute cursor-move transition-shadow',
                          isSelected && 'ring-2 ring-brand-500 ring-offset-1'
                        )}
                        style={{
                          left: layer.x * scale,
                          top: layer.y * scale,
                          width: layer.width * scale,
                          height: layer.height * scale,
                          transform: `rotate(${layer.rotation}deg)`,
                          opacity: layer.opacity,
                        }}
                      >
                        {layer.type === 'image' && layer.imageData && (
                          <img
                            src={layer.imageData.src}
                            alt=""
                            className="w-full h-full object-cover rounded-sm"
                            draggable={false}
                          />
                        )}
                        {layer.type === 'text' && layer.textData && (
                          <div
                            className="w-full h-full flex items-center overflow-hidden"
                            style={{
                              fontSize: layer.textData.fontSize * scale,
                              fontFamily: layer.textData.fontFamily,
                              fontWeight: layer.textData.fontWeight,
                              color: layer.textData.color,
                              textAlign: layer.textData.textAlign,
                              lineHeight: layer.textData.lineHeight,
                              letterSpacing: layer.textData.letterSpacing,
                            }}
                          >
                            {layer.textData.content}
                          </div>
                        )}
                        {layer.type === 'shape' && layer.shapeData && (
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundColor: layer.shapeData.fill,
                              border: `${layer.shapeData.strokeWidth}px solid ${layer.shapeData.stroke}`,
                              borderRadius: layer.shapeData.borderRadius || 0,
                            }}
                          />
                        )}

                        {isSelected && !layer.locked && (
                          <>
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-nw-resize" />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-ne-resize" />
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-sw-resize" />
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-se-resize" />
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-n-resize" />
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-s-resize" />
                            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-w-resize" />
                            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-e-resize" />
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 画布尺寸信息 */}
            <div className="h-8 flex items-center justify-center border-t border-paper-200 bg-white flex-shrink-0">
              <span className="text-xs text-paper-500">
                画布尺寸：{canvasWidth} × {canvasHeight} px
              </span>
            </div>
          </div>

          {/* 右侧属性面板 */}
          <div className="w-72 flex-shrink-0 flex flex-col border-l border-paper-200 bg-white">
            <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="layers">
                  <Layers className="h-4 w-4 mr-1" />
                  图层
                </TabsTrigger>
                <TabsTrigger value="properties">
                  <Palette className="h-4 w-4 mr-1" />
                  属性
                </TabsTrigger>
              </TabsList>

              <TabsContent value="layers" className="flex-1 overflow-y-auto mt-4">
                <LayerPanel
                  layers={layers as any}
                  selectedLayerId={selectedLayerId || undefined}
                  onSelectLayer={selectLayer}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleLock={handleToggleLock}
                  onReorder={handleLayerReorder}
                  onDeleteLayer={handleDeleteLayer}
                  onDuplicateLayer={handleDuplicateLayer}
                />
              </TabsContent>

              <TabsContent value="properties" className="flex-1 overflow-y-auto px-4 mt-4">
                {selectedLayer ? (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold text-paper-900 mb-3 flex items-center gap-2">
                        <Move className="h-4 w-4 text-brand-500" />
                        位置与大小
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-paper-500 mb-1 block">X</label>
                          <Input
                            size="sm"
                            type="number"
                            value={Math.round(selectedLayer.x)}
                            onChange={(e) => updateLayer(selectedLayer.id, { x: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-paper-500 mb-1 block">Y</label>
                          <Input
                            size="sm"
                            type="number"
                            value={Math.round(selectedLayer.y)}
                            onChange={(e) => updateLayer(selectedLayer.id, { y: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-paper-500 mb-1 block">宽度</label>
                          <Input
                            size="sm"
                            type="number"
                            value={Math.round(selectedLayer.width)}
                            onChange={(e) => updateLayer(selectedLayer.id, { width: Number(e.target.value) })}
                            leftIcon={<Maximize2 className="h-3.5 w-3.5" />}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-paper-500 mb-1 block">高度</label>
                          <Input
                            size="sm"
                            type="number"
                            value={Math.round(selectedLayer.height)}
                            onChange={(e) => updateLayer(selectedLayer.id, { height: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-paper-900 mb-3 flex items-center gap-2">
                        <RotateCw className="h-4 w-4 text-brand-500" />
                        旋转与透明度
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-xs text-paper-500">旋转角度</label>
                            <span className="text-xs text-paper-700">{selectedLayer.rotation}°</span>
                          </div>
                          <Slider
                            min={-180}
                            max={180}
                            value={selectedLayer.rotation}
                            onChange={(val) => updateLayer(selectedLayer.id, { rotation: val })}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-xs text-paper-500">不透明度</label>
                            <span className="text-xs text-paper-700">{Math.round(selectedLayer.opacity * 100)}%</span>
                          </div>
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={selectedLayer.opacity}
                            onChange={(val) => updateLayer(selectedLayer.id, { opacity: val })}
                          />
                        </div>
                      </div>
                    </div>

                    {selectedLayer.type === 'text' && selectedLayer.textData && (
                      <div>
                        <h4 className="text-sm font-semibold text-paper-900 mb-3 flex items-center gap-2">
                          <Type className="h-4 w-4 text-brand-500" />
                          文字属性
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-paper-500 mb-1 block">字体</label>
                            <Select
                              size="sm"
                              options={fontOptions}
                              value={selectedLayer.textData.fontFamily}
                              onChange={(val) => updateLayer(selectedLayer.id, {
                                textData: { ...selectedLayer.textData, fontFamily: val }
                              } as any)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-paper-500 mb-1 block">字号</label>
                            <Input
                              size="sm"
                              type="number"
                              value={selectedLayer.textData.fontSize}
                              onChange={(e) => updateLayer(selectedLayer.id, {
                                textData: { ...selectedLayer.textData, fontSize: Number(e.target.value) }
                              } as any)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-paper-500 mb-1 block">颜色</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedLayer.textData.color}
                                onChange={(e) => updateLayer(selectedLayer.id, {
                                  textData: { ...selectedLayer.textData, color: e.target.value }
                                } as any)}
                                className="w-10 h-10 rounded border border-paper-300 cursor-pointer"
                              />
                              <Input
                                size="sm"
                                value={selectedLayer.textData.color}
                                onChange={(e) => updateLayer(selectedLayer.id, {
                                  textData: { ...selectedLayer.textData, color: e.target.value }
                                } as any)}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-paper-500 mb-1 block">对齐</label>
                            <div className="flex gap-1">
                              {['left', 'center', 'right'].map(align => {
                                const icons = { left: AlignLeft, center: AlignCenter, right: AlignRight };
                                const Icon = icons[align as keyof typeof icons];
                                return (
                                  <button
                                    key={align}
                                    onClick={() => updateLayer(selectedLayer.id, {
                                      textData: { ...selectedLayer.textData, textAlign: align as any }
                                    } as any)}
                                    className={cn(
                                      'flex-1 h-9 flex items-center justify-center rounded-md transition-colors',
                                      selectedLayer.textData?.textAlign === align
                                        ? 'bg-brand-100 text-brand-600'
                                        : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
                                    )}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-paper-500 mb-1 block">字距</label>
                              <Input
                                size="sm"
                                type="number"
                                value={selectedLayer.textData.letterSpacing}
                                onChange={(e) => updateLayer(selectedLayer.id, {
                                  textData: { ...selectedLayer.textData, letterSpacing: Number(e.target.value) }
                                } as any)}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-paper-500 mb-1 block">行距</label>
                              <Input
                                size="sm"
                                type="number"
                                step="0.1"
                                value={selectedLayer.textData.lineHeight}
                                onChange={(e) => updateLayer(selectedLayer.id, {
                                  textData: { ...selectedLayer.textData, lineHeight: Number(e.target.value) }
                                } as any)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleDeleteLayer(selectedLayer.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-darkroom-600 hover:bg-darkroom-50 rounded-md transition-colors text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除图层
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-paper-400">
                    <Layers className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">请选择一个图层</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="h-16 border-t border-paper-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-paper-500">
              共 {layers.length} 个图层
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="lg" onClick={handleSaveDraft} leftIcon={<Save className="h-4 w-4" />}>
              保存草稿
            </Button>
            <Button variant="secondary" size="lg" leftIcon={<Eye className="h-4 w-4" />}>
              预览
            </Button>
            <Button size="lg" onClick={handleAddToCart} leftIcon={<ShoppingCart className="h-4 w-4" />}>
              加入购物车
            </Button>
          </div>
        </div>
    </div>
  );
}
