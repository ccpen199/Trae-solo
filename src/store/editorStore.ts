import { create } from 'zustand';
import type { EditorLayer } from '@/types';

interface EditorSnapshot {
  layers: EditorLayer[];
}

interface EditorState {
  layers: EditorLayer[];
  selectedLayerId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  history: EditorSnapshot[];
  historyIndex: number;
}

interface EditorActions {
  addLayer: (layer: EditorLayer) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<EditorLayer>) => void;
  selectLayer: (id: string | null) => void;
  moveLayerOrder: (fromIndex: number, toIndex: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  setLayers: (layers: EditorLayer[]) => void;
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;
}

const initialState: EditorState = {
  layers: [],
  selectedLayerId: null,
  canvasWidth: 800,
  canvasHeight: 600,
  history: [{ layers: [] }],
  historyIndex: 0,
};

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  ...initialState,

  addLayer: (layer: EditorLayer) => {
    set((state) => {
      const newLayers = [...state.layers, layer];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ layers: newLayers });
      return {
        layers: newLayers,
        selectedLayerId: layer.id,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  removeLayer: (id: string) => {
    set((state) => {
      const newLayers = state.layers.filter((l) => l.id !== id);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ layers: newLayers });
      return {
        layers: newLayers,
        selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  updateLayer: (id: string, updates: Partial<EditorLayer>) => {
    set((state) => {
      const newLayers = state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      );
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ layers: newLayers });
      return {
        layers: newLayers,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  selectLayer: (id: string | null) => {
    set({ selectedLayerId: id });
  },

  moveLayerOrder: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ layers: newLayers });
      return {
        layers: newLayers,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  setCanvasSize: (width: number, height: number) => {
    set({ canvasWidth: width, canvasHeight: height });
  },

  setLayers: (layers: EditorLayer[]) => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ layers });
      return {
        layers,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const snapshot = state.history[newIndex];
      return {
        layers: snapshot.layers,
        historyIndex: newIndex,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const snapshot = state.history[newIndex];
      return {
        layers: snapshot.layers,
        historyIndex: newIndex,
      };
    });
  },

  saveSnapshot: () => {
    const { layers, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ layers: [...layers] });
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
}));
