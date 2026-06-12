import { create } from 'zustand';

export type Step = 1 | 2 | 3;
export type StyleType = 'modern' | 'nordic' | 'chinese' | 'luxury' | 'industrial' | 'japanese' | 'mediterranean';
export type RoomType = 'living' | 'master' | 'second' | 'kitchen' | 'bathroom' | 'dining' | 'study' | 'balcony';
export type LightMode = 'natural' | 'warm' | 'cool';
export type ViewMode = 'top' | 'front' | 'roam';
export type MaterialCategory = 'floor' | 'wall' | 'furniture';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  width: number;
  height: number;
  doors: number;
  windows: number;
}

export interface MaterialOption {
  id: string;
  name: string;
  color: string;
  roughness?: number;
  metalness?: number;
}

interface DGeneratorState {
  step: Step;
  setStep: (step: Step) => void;

  uploadedFile: File | null;
  uploadProgress: number;
  isRecognizing: boolean;
  recognitionDone: boolean;
  setUploadedFile: (file: File | null) => void;
  setUploadProgress: (progress: number) => void;
  setIsRecognizing: (v: boolean) => void;
  setRecognitionDone: (v: boolean) => void;
  resetUpload: () => void;

  rooms: Room[];
  updateRoom: (id: string, updates: Partial<Room>) => void;
  setRooms: (rooms: Room[]) => void;

  selectedStyle: StyleType;
  setSelectedStyle: (style: StyleType) => void;

  lightMode: LightMode;
  setLightMode: (mode: LightMode) => void;

  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  isDay: boolean;
  toggleDayNight: () => void;

  panelCollapsed: boolean;
  togglePanel: () => void;

  drawerOpen: boolean;
  toggleDrawer: () => void;

  autoArranged: boolean;
  setAutoArranged: (v: boolean) => void;
  triggerAutoArrange: () => void;

  selectedFurnitureId: string | null;
  setSelectedFurnitureId: (id: string | null) => void;

  materials: Record<MaterialCategory, MaterialOption[]>;
  selectedMaterials: Record<MaterialCategory, string>;
  selectMaterial: (category: MaterialCategory, id: string) => void;
}

const defaultRooms: Room[] = [
  { id: 'r1', name: '客厅', type: 'living', width: 4.2, height: 5.5, doors: 2, windows: 2 },
  { id: 'r2', name: '主卧', type: 'master', width: 3.6, height: 4.2, doors: 1, windows: 1 },
  { id: 'r3', name: '次卧', type: 'second', width: 3.0, height: 3.6, doors: 1, windows: 1 },
  { id: 'r4', name: '厨房', type: 'kitchen', width: 2.5, height: 3.2, doors: 1, windows: 1 },
  { id: 'r5', name: '卫生间', type: 'bathroom', width: 2.0, height: 2.4, doors: 1, windows: 0 },
];

const defaultMaterials: Record<MaterialCategory, MaterialOption[]> = {
  floor: [
    { id: 'f1', name: '橡木', color: '#DBBF85', roughness: 0.8 },
    { id: 'f2', name: '胡桃木', color: '#8B6914', roughness: 0.75 },
    { id: 'f3', name: '大理石白', color: '#F5F2ED', roughness: 0.3, metalness: 0.1 },
    { id: 'f4', name: '灰色水泥', color: '#8C8C8C', roughness: 0.9 },
    { id: 'f5', name: '赤陶砖', color: '#C4623A', roughness: 0.85 },
    { id: 'f6', name: '竹地板', color: '#CBA356', roughness: 0.7 },
  ],
  wall: [
    { id: 'w1', name: '象牙白', color: '#FAF8F5', roughness: 0.9 },
    { id: 'w2', name: '雾霾蓝', color: '#9CB8C2', roughness: 0.85 },
    { id: 'w3', name: '暖米灰', color: '#E8E4DD', roughness: 0.9 },
    { id: 'w4', name: '炭灰', color: '#555452', roughness: 0.8 },
    { id: 'w5', name: '赤陶橙', color: '#DE8F69', roughness: 0.85 },
    { id: 'w6', name: '抹茶绿', color: '#A8C098', roughness: 0.9 },
  ],
  furniture: [
    { id: 'fu1', name: '原木', color: '#CBA356', roughness: 0.6 },
    { id: 'fu2', name: '布艺灰', color: '#9A9489', roughness: 0.95 },
    { id: 'fu3', name: '金属黑', color: '#2A2A2A', roughness: 0.4, metalness: 0.7 },
    { id: 'fu4', name: '皮革棕', color: '#6B5010', roughness: 0.5 },
    { id: 'fu5', name: '象牙白', color: '#F5F2ED', roughness: 0.7 },
    { id: 'fu6', name: '墨绿', color: '#3D5B4C', roughness: 0.8 },
  ],
};

export const useDGeneratorStore = create<DGeneratorState>((set) => ({
  step: 1,
  setStep: (step) => set({ step }),

  uploadedFile: null,
  uploadProgress: 0,
  isRecognizing: false,
  recognitionDone: false,
  setUploadedFile: (file) => set({ uploadedFile: file }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setIsRecognizing: (v) => set({ isRecognizing: v }),
  setRecognitionDone: (v) => set({ recognitionDone: v }),
  resetUpload: () => set({ uploadedFile: null, uploadProgress: 0, isRecognizing: false, recognitionDone: false }),

  rooms: defaultRooms,
  updateRoom: (id, updates) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  setRooms: (rooms) => set({ rooms }),

  selectedStyle: 'modern',
  setSelectedStyle: (style) => set({ selectedStyle: style }),

  lightMode: 'natural',
  setLightMode: (mode) => set({ lightMode: mode }),

  viewMode: 'roam',
  setViewMode: (mode) => set({ viewMode: mode }),

  isDay: true,
  toggleDayNight: () => set((state) => ({ isDay: !state.isDay })),

  panelCollapsed: false,
  togglePanel: () => set((state) => ({ panelCollapsed: !state.panelCollapsed })),

  drawerOpen: false,
  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),

  autoArranged: false,
  setAutoArranged: (v) => set({ autoArranged: v }),
  triggerAutoArrange: () => {
    set({ autoArranged: false });
    setTimeout(() => set({ autoArranged: true }), 50);
  },

  selectedFurnitureId: null,
  setSelectedFurnitureId: (id) => set({ selectedFurnitureId: id }),

  materials: defaultMaterials,
  selectedMaterials: { floor: 'f1', wall: 'w1', furniture: 'fu1' },
  selectMaterial: (category, id) =>
    set((state) => ({
      selectedMaterials: { ...state.selectedMaterials, [category]: id },
    })),
}));
