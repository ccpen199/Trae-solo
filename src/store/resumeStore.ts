import { create } from 'zustand';
import type { Resume, ResumeTheme, ResumeModule, TemplateCategory, AppSettings } from '../types';
import { saveResume, getResume, getResumes, deleteResume, saveSetting, getSetting, clearAllData } from '../utils/db';
import { encrypt, decrypt } from '../utils/crypto';

interface ResumeStore {
  currentResume: Resume | null;
  resumes: Resume[];
  settings: AppSettings;
  history: Resume[];
  historyIndex: number;
  loading: boolean;
  setCurrentResume: (resume: Resume | null) => void;
  updateResume: (updater: (resume: Resume) => Resume) => void;
  updateModule: (moduleId: string, updater: (module: ResumeModule) => ResumeModule) => void;
  addModule: (module: ResumeModule) => void;
  removeModule: (moduleId: string) => void;
  reorderModules: (activeId: string, overId: string) => void;
  updateTheme: (theme: Partial<ResumeTheme>) => void;
  saveCurrentResume: () => Promise<void>;
  loadResume: (id: string) => Promise<void>;
  loadAllResumes: () => Promise<void>;
  deleteResumeById: (id: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  createNewResume: (templateId: string, category: TemplateCategory, modules: ResumeModule[], theme: ResumeTheme) => void;
  createAndSaveResume: (templateId: string, category: TemplateCategory, modules: ResumeModule[], theme: ResumeTheme) => Promise<Resume | null>;
  clearData: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createResumeFromTemplate(
  templateId: string,
  modules: ResumeModule[],
  theme: ResumeTheme
): Resume {
  const now = Date.now();
  const basicModule = modules.find(m => m.type === 'basic');
  const name = basicModule?.fields?.name || '未命名简历';
  return {
    id: generateId(),
    title: name,
    templateId,
    theme: { ...theme },
    modules: modules.map(m => ({ ...m, id: m.id || generateId() })),
    createdAt: now,
    updatedAt: now,
  };
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  currentResume: null,
  resumes: [],
  settings: {
    privacyMode: true,
    encryptionKey: '',
    theme: 'light',
  },
  history: [],
  historyIndex: -1,
  loading: false,
  canUndo: false,
  canRedo: false,

  setCurrentResume: (resume) => {
    set({
      currentResume: resume ? { ...resume } : null,
      history: resume ? [{ ...resume }] : [],
      historyIndex: resume ? 0 : -1,
      canUndo: false,
      canRedo: false,
    });
  },

  updateResume: (updater) => {
    const { currentResume, history, historyIndex } = get();
    if (!currentResume) return;
    const updated = updater({ ...currentResume });
    updated.updatedAt = Date.now();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...updated });
    set({
      currentResume: updated,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false,
    });
  },

  updateModule: (moduleId, updater) => {
    get().updateResume(resume => ({
      ...resume,
      modules: resume.modules.map(m =>
        m.id === moduleId ? updater({ ...m }) : m
      ),
    }));
  },

  addModule: (module) => {
    get().updateResume(resume => ({
      ...resume,
      modules: [...resume.modules, { ...module, id: module.id || generateId(), order: resume.modules.length }],
    }));
  },

  removeModule: (moduleId) => {
    get().updateResume(resume => ({
      ...resume,
      modules: resume.modules.filter(m => m.id !== moduleId).map((m, i) => ({ ...m, order: i })),
    }));
  },

  reorderModules: (activeId, overId) => {
    get().updateResume(resume => {
      const modules = [...resume.modules];
      const oldIndex = modules.findIndex(m => m.id === activeId);
      const newIndex = modules.findIndex(m => m.id === overId);
      if (oldIndex === -1 || newIndex === -1) return resume;
      const [removed] = modules.splice(oldIndex, 1);
      modules.splice(newIndex, 0, removed);
      return {
        ...resume,
        modules: modules.map((m, i) => ({ ...m, order: i })),
      };
    });
  },

  updateTheme: (theme) => {
    get().updateResume(resume => ({
      ...resume,
      theme: { ...resume.theme, ...theme },
    }));
  },

  saveCurrentResume: async () => {
    const { currentResume, settings } = get();
    if (!currentResume) return;
    set({ loading: true });
    try {
      const resumeToSave = { ...currentResume, updatedAt: Date.now() };
      if (settings.privacyMode) {
        const encrypted = await encrypt(resumeToSave);
        await saveResume({ ...resumeToSave, _encrypted: encrypted } as any);
      } else {
        await saveResume(resumeToSave);
      }
      set({ currentResume: resumeToSave });
    } finally {
      set({ loading: false });
    }
  },

  loadResume: async (id) => {
    set({ loading: true });
    try {
      const data = await getResume(id);
      if (data) {
        let resume = data as Resume;
        if ((data as any)._encrypted) {
          try {
            resume = await decrypt<Resume>((data as any)._encrypted);
          } catch {
            console.warn('Failed to decrypt resume, using raw data');
          }
        }
        set({
          currentResume: resume,
          history: [resume],
          historyIndex: 0,
          canUndo: false,
          canRedo: false,
        });
      }
    } finally {
      set({ loading: false });
    }
  },

  loadAllResumes: async () => {
    set({ loading: true });
    try {
      const data = await getResumes();
      const resumes = await Promise.all(
        data.map(async (item) => {
          if ((item as any)._encrypted) {
            try {
              return await decrypt<Resume>((item as any)._encrypted);
            } catch {
              return item as Resume;
            }
          }
          return item as Resume;
        })
      );
      set({ resumes: resumes.sort((a, b) => b.updatedAt - a.updatedAt) });
    } finally {
      set({ loading: false });
    }
  },

  deleteResumeById: async (id) => {
    await deleteResume(id);
    set(state => ({
      resumes: state.resumes.filter(r => r.id !== id),
      currentResume: state.currentResume?.id === id ? null : state.currentResume,
    }));
  },

  loadSettings: async () => {
    try {
      const privacyMode = await getSetting('privacyMode');
      const theme = await getSetting('theme');
      set(state => ({
        settings: {
          ...state.settings,
          privacyMode: privacyMode !== undefined ? privacyMode as boolean : true,
          theme: theme ? theme as string : 'light',
        },
      }));
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  },

  updateSettings: async (newSettings) => {
    set(state => ({ settings: { ...state.settings, ...newSettings } }));
    for (const [key, value] of Object.entries(newSettings)) {
      await saveSetting(key, value);
    }
  },

  createNewResume: (templateId, category, modules, theme) => {
    const resume = createResumeFromTemplate(templateId, modules, theme);
    set({
      currentResume: resume,
      history: [resume],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  },

  createAndSaveResume: async (templateId, category, modules, theme) => {
    const resume = createResumeFromTemplate(templateId, modules, theme);
    const { settings } = get();
    set({
      currentResume: resume,
      history: [resume],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
    try {
      if (settings.privacyMode) {
        const encrypted = await encrypt(resume);
        await saveResume({ ...resume, _encrypted: encrypted } as any);
      } else {
        await saveResume(resume);
      }
      set(state => ({ resumes: [resume, ...state.resumes].sort((a, b) => b.updatedAt - a.updatedAt) }));
      return resume;
    } catch (e) {
      console.error('Failed to save new resume', e);
      return null;
    }
  },

  clearData: async () => {
    await clearAllData();
    set({
      currentResume: null,
      resumes: [],
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        currentResume: { ...history[newIndex] },
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        currentResume: { ...history[newIndex] },
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < history.length - 1,
      });
    }
  },
}));
