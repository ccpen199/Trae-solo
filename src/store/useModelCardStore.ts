import { create } from 'zustand';
import type {
  ModelCardTemplate,
  ModelCard,
  CanvasElement,
  EditorHistoryState,
  ExportOption,
  BackgroundPreset,
} from '@shared/types';
import { mockModelCardTemplates, createInitialCanvasElements, mockExportOptions, mockBackgroundPresets } from '../data/mockData';

interface ModelCardState {
  templates: ModelCardTemplate[];
  currentTemplate: ModelCardTemplate | null;
  modelCards: ModelCard[];
  currentModelCard: ModelCard | null;
  loading: boolean;
  error: string | null;
  processingStep: 'idle' | 'removing_bg' | 'exporting' | 'complete';

  elements: CanvasElement[];
  selectedElementId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  zoom: number;
  showGrid: boolean;
  showPreview: boolean;

  history: EditorHistoryState[];
  historyIndex: number;
  maxHistory: number;

  exportOptions: ExportOption[];
  backgroundPresets: BackgroundPreset[];
  selectedBackgroundPreset: BackgroundPreset | null;
  originalPhotoUrl: string | null;
  generatedBackgroundUrl: string | null;
  isGeneratingBackground: boolean;
}

interface ModelCardActions {
  fetchTemplates: () => Promise<void>;
  selectTemplate: (templateId: string) => ModelCardTemplate | null;
  createModelCard: (artistProfileId: string, templateId: string, name: string) => Promise<ModelCard | null>;
  updateModelCard: (id: string, updates: Partial<ModelCard>) => Promise<ModelCard | null>;
  removeBackground: (modelCardId: string) => Promise<boolean>;
  exportModelCard: (id: string, size?: string) => Promise<string | null>;
  clearCurrentTemplate: () => void;
  clearCurrentModelCard: () => void;
  clearError: () => void;

  initializeEditor: (templateId?: string) => void;
  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  duplicateElement: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  lockElement: (id: string, locked: boolean) => void;

  setCanvasSize: (width: number, height: number) => void;
  setBackgroundColor: (color: string) => void;
  setZoom: (zoom: number) => void;
  setShowGrid: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;

  setSelectedBackgroundPreset: (preset: BackgroundPreset | null) => void;
  setOriginalPhotoUrl: (url: string | null) => void;
  generateBackground: () => Promise<void>;
}

type ModelCardStore = ModelCardState & ModelCardActions;

const generateId = (prefix: string): string => {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
};

const getImageUrl = (prompt: string): string => {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;
};

const mockModelCards: ModelCard[] = [
  {
    id: 'modelcard-1',
    artistProfileId: 'artist-1',
    templateId: 'template-1',
    name: '林雨婷 - 职业模卡',
    customizations: {
      theme: 'gold',
      layout: 'classic',
      showContact: true,
    },
    exportedUrl: getImageUrl('professional model card elegant design gold black'),
    exportedSizes: ['1080x1920', '1080x1080'],
  },
  {
    id: 'modelcard-2',
    artistProfileId: 'artist-1',
    templateId: 'template-2',
    name: '林雨婷 - Instagram 博主',
    customizations: {
      theme: 'modern',
      layout: 'instagram',
      showStats: true,
    },
    exportedUrl: getImageUrl('instagram model card influencer style modern'),
    exportedSizes: ['1080x1080'],
  },
];

export const useModelCardStore = create<ModelCardStore>((set, get) => ({
  templates: mockModelCardTemplates,
  currentTemplate: null,
  modelCards: mockModelCards,
  currentModelCard: null,
  loading: false,
  error: null,
  processingStep: 'idle',

  elements: [],
  selectedElementId: null,
  canvasWidth: 1080,
  canvasHeight: 1920,
  backgroundColor: '#1a1a2e',
  zoom: 0.5,
  showGrid: true,
  showPreview: false,

  history: [],
  historyIndex: -1,
  maxHistory: 50,

  exportOptions: mockExportOptions,
  backgroundPresets: mockBackgroundPresets,
  selectedBackgroundPreset: null,
  originalPhotoUrl: null,
  generatedBackgroundUrl: null,
  isGeneratingBackground: false,

  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ templates: mockModelCardTemplates, loading: false });
    } catch (error) {
      set({ error: '获取模板列表失败', loading: false });
    }
  },

  selectTemplate: (templateId: string) => {
    const template = get().templates.find(t => t.id === templateId) || mockModelCardTemplates.find(t => t.id === templateId);
    if (template) {
      set({ currentTemplate: template });
      return template;
    }
    return null;
  },

  createModelCard: async (artistProfileId: string, templateId: string, name: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newModelCard: ModelCard = {
        id: generateId('modelcard'),
        artistProfileId,
        templateId,
        name,
        customizations: {},
        exportedSizes: [],
      };
      
      set((state) => ({
        modelCards: [...state.modelCards, newModelCard],
        currentModelCard: newModelCard,
        loading: false,
      }));
      
      return newModelCard;
    } catch (error) {
      set({ error: '创建模卡失败', loading: false });
      return null;
    }
  },

  updateModelCard: async (id: string, updates: Partial<ModelCard>) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set((state) => {
        const modelCards = state.modelCards.map(mc =>
          mc.id === id ? { ...mc, ...updates } : mc
        );
        const currentModelCard = state.currentModelCard?.id === id
          ? { ...state.currentModelCard, ...updates }
          : state.currentModelCard;
        return { modelCards, currentModelCard, loading: false };
      });
      
      return get().modelCards.find(mc => mc.id === id) || null;
    } catch (error) {
      set({ error: '更新模卡失败', loading: false });
      return null;
    }
  },

  removeBackground: async (modelCardId: string) => {
    set({ loading: true, error: null, processingStep: 'removing_bg' });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      set((state) => ({
        modelCards: state.modelCards.map(mc =>
          mc.id === modelCardId
            ? {
                ...mc,
                customizations: {
                  ...mc.customizations,
                  backgroundRemoved: true,
                },
              }
            : mc
        ),
        loading: false,
        processingStep: 'idle',
      }));
      
      return true;
    } catch (error) {
      set({ error: '去除背景失败', loading: false, processingStep: 'idle' });
      return false;
    }
  },

  exportModelCard: async (id: string, size?: string) => {
    set({ loading: true, error: null, processingStep: 'exporting' });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const exportedUrl = getImageUrl('professional model card export high quality design');
      const exportSize = size || '1080x1920';
      
      set((state) => ({
        modelCards: state.modelCards.map(mc =>
          mc.id === id
            ? {
                ...mc,
                exportedUrl,
                exportedSizes: mc.exportedSizes.includes(exportSize)
                  ? mc.exportedSizes
                  : [...mc.exportedSizes, exportSize],
              }
            : mc
        ),
        currentModelCard: state.currentModelCard?.id === id
          ? {
              ...state.currentModelCard,
              exportedUrl,
              exportedSizes: state.currentModelCard.exportedSizes.includes(exportSize)
                ? state.currentModelCard.exportedSizes
                : [...state.currentModelCard.exportedSizes, exportSize],
            }
          : state.currentModelCard,
        loading: false,
        processingStep: 'complete',
      }));
      
      setTimeout(() => set({ processingStep: 'idle' }), 1000);
      
      return exportedUrl;
    } catch (error) {
      set({ error: '导出模卡失败', loading: false, processingStep: 'idle' });
      return null;
    }
  },

  clearCurrentTemplate: () => {
    set({ currentTemplate: null });
  },

  clearCurrentModelCard: () => {
    set({ currentModelCard: null });
  },

  clearError: () => {
    set({ error: null });
  },

  initializeEditor: (templateId?: string) => {
    const template = templateId ? get().templates.find(t => t.id === templateId) : null;
    const elements = createInitialCanvasElements(templateId);
    const canvasWidth = template?.width || 1080;
    const canvasHeight = template?.height || 1920;
    const bgElement = elements.find(el => el.id === 'el-bg');
    const backgroundColor = bgElement?.content?.shapeColor || '#1a1a2e';

    set({
      elements,
      selectedElementId: null,
      canvasWidth,
      canvasHeight,
      backgroundColor,
      zoom: canvasHeight > 1200 ? 0.4 : 0.6,
      history: [],
      historyIndex: -1,
    });

    setTimeout(() => get().saveToHistory(), 0);
  },

  setElements: (elements: CanvasElement[]) => {
    set({ elements });
  },

  addElement: (element: CanvasElement) => {
    set((state) => {
      const newElements = [...state.elements, element];
      return {
        elements: newElements,
        selectedElementId: element.id,
      };
    });
    setTimeout(() => get().saveToHistory(), 0);
  },

  updateElement: (id: string, updates: Partial<CanvasElement>) => {
    set((state) => ({
      elements: state.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },

  removeElement: (id: string) => {
    set((state) => ({
      elements: state.elements.filter(el => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    setTimeout(() => get().saveToHistory(), 0);
  },

  selectElement: (id: string | null) => {
    set({ selectedElementId: id });
  },

  duplicateElement: (id: string) => {
    const element = get().elements.find(el => el.id === id);
    if (element && !element.locked) {
      const newElement: CanvasElement = {
        ...element,
        id: generateId('el'),
        x: element.x + 20,
        y: element.y + 20,
        zIndex: Math.max(...get().elements.map(el => el.zIndex)) + 1,
      };
      get().addElement(newElement);
    }
  },

  bringToFront: (id: string) => {
    const maxZ = Math.max(...get().elements.map(el => el.zIndex));
    get().updateElement(id, { zIndex: maxZ + 1 });
    setTimeout(() => get().saveToHistory(), 0);
  },

  sendToBack: (id: string) => {
    const minZ = Math.min(...get().elements.filter(el => el.id !== 'el-bg').map(el => el.zIndex));
    get().updateElement(id, { zIndex: minZ - 1 });
    setTimeout(() => get().saveToHistory(), 0);
  },

  lockElement: (id: string, locked: boolean) => {
    get().updateElement(id, { locked });
  },

  setCanvasSize: (width: number, height: number) => {
    set((state) => {
      const bgElement = state.elements.find(el => el.id === 'el-bg');
      let elements = state.elements;
      if (bgElement) {
        elements = state.elements.map(el =>
          el.id === 'el-bg'
            ? { ...el, width, height }
            : el
        );
      }
      return {
        canvasWidth: width,
        canvasHeight: height,
        elements,
      };
    });
    setTimeout(() => get().saveToHistory(), 0);
  },

  setBackgroundColor: (color: string) => {
    set((state) => {
      const elements = state.elements.map(el =>
        el.id === 'el-bg'
          ? { ...el, content: { ...el.content, shapeColor: color } }
          : el
      );
      return {
        backgroundColor: color,
        elements,
      };
    });
    setTimeout(() => get().saveToHistory(), 0);
  },

  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.1, Math.min(3, zoom)) });
  },

  setShowGrid: (show: boolean) => {
    set({ showGrid: show });
  },

  setShowPreview: (show: boolean) => {
    set({ showPreview: show });
  },

  saveToHistory: () => {
    const state = get();
    const currentState: EditorHistoryState = {
      elements: JSON.parse(JSON.stringify(state.elements)),
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      backgroundColor: state.backgroundColor,
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(currentState);

    if (newHistory.length > state.maxHistory) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const prevState = state.history[state.historyIndex - 1];
      set({
        elements: prevState.elements,
        canvasWidth: prevState.canvasWidth,
        canvasHeight: prevState.canvasHeight,
        backgroundColor: prevState.backgroundColor,
        historyIndex: state.historyIndex - 1,
        selectedElementId: null,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1];
      set({
        elements: nextState.elements,
        canvasWidth: nextState.canvasWidth,
        canvasHeight: nextState.canvasHeight,
        backgroundColor: nextState.backgroundColor,
        historyIndex: state.historyIndex + 1,
        selectedElementId: null,
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  setSelectedBackgroundPreset: (preset: BackgroundPreset | null) => {
    set({ selectedBackgroundPreset: preset });
  },

  setOriginalPhotoUrl: (url: string | null) => {
    set({ originalPhotoUrl: url });
  },

  generateBackground: async () => {
    set({ isGeneratingBackground: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const preset = get().selectedBackgroundPreset;
      const generatedUrl = preset 
        ? getImageUrl(`professional model photo with ${preset.name} background high quality`)
        : getImageUrl('professional model photo with studio background high quality');

      set({
        generatedBackgroundUrl: generatedUrl,
        isGeneratingBackground: false,
      });
    } catch (error) {
      set({ error: '生成背景失败', isGeneratingBackground: false });
    }
  },
}));

export default useModelCardStore;
