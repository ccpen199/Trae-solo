import { create } from 'zustand';
import { db, generateId } from '@/db';
import type { Note, NoteParagraph, PageAnchor, OCRResult, NoteSourceType } from '@/types';
import dayjs from 'dayjs';

interface OCRQueueItem {
  imageId: string;
  dataUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  result?: OCRResult;
}

interface NoteStore {
  notes: Note[];
  currentNote: Note | null;
  paragraphs: NoteParagraph[];
  anchors: PageAnchor[];
  ocrQueue: OCRQueueItem[];
  ocrWorkerBusy: boolean;
  loading: boolean;

  loadNotes: (bookId?: string) => Promise<void>;
  loadNoteDetail: (noteId: string) => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateNote: (id: string, changes: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addParagraph: (noteId: string, text: string, orderIndex: number) => Promise<string>;
  updateParagraph: (id: string, text: string) => Promise<void>;
  deleteParagraph: (id: string) => Promise<void>;
  addPageAnchor: (noteId: string, pageNumber: number, confidence?: number) => Promise<string>;
  removePageAnchor: (id: string) => Promise<void>;
  addToOCRQueue: (dataUrl: string) => string;
  updateOCRQueueItem: (imageId: string, updates: Partial<OCRQueueItem>) => void;
  removeFromOCRQueue: (imageId: string) => void;
  processOCRQueue: () => Promise<void>;
  getNotesByBook: (bookId: string) => Note[];
  getTodayNoteCount: () => number;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  currentNote: null,
  paragraphs: [],
  anchors: [],
  ocrQueue: [],
  ocrWorkerBusy: false,
  loading: false,

  loadNotes: async (bookId) => {
    set({ loading: true });
    let notes: Note[];
    if (bookId) {
      notes = await db.notes.where('bookId').equals(bookId).toArray();
    } else {
      notes = await db.notes.orderBy('createdAt').reverse().toArray();
    }
    set({ notes, loading: false });
  },

  loadNoteDetail: async (noteId) => {
    const note = await db.notes.get(noteId);
    if (!note) return;
    const paragraphs = await db.noteParagraphs.where('noteId').equals(noteId).sortBy('orderIndex');
    const anchors = await db.pageAnchors.where('noteId').equals(noteId).toArray();
    set({ currentNote: note, paragraphs, anchors });
  },

  addNote: async (noteData) => {
    const id = generateId();
    const now = dayjs().toISOString();
    const note: Note = { ...noteData, id, createdAt: now, updatedAt: now };
    await db.notes.add(note);
    set(state => ({ notes: [note, ...state.notes] }));
    return id;
  },

  updateNote: async (id, changes) => {
    const updated = { ...changes, updatedAt: dayjs().toISOString() };
    await db.notes.update(id, updated);
    set(state => ({
      notes: state.notes.map(n => (n.id === id ? { ...n, ...updated } : n)),
      currentNote: state.currentNote?.id === id
        ? { ...state.currentNote, ...updated }
        : state.currentNote,
    }));
  },

  deleteNote: async (id) => {
    await db.notes.delete(id);
    await db.noteParagraphs.where('noteId').equals(id).delete();
    await db.pageAnchors.where('noteId').equals(id).delete();
    set(state => ({
      notes: state.notes.filter(n => n.id !== id),
      currentNote: state.currentNote?.id === id ? null : state.currentNote,
      paragraphs: state.currentNote?.id === id ? [] : state.paragraphs,
      anchors: state.currentNote?.id === id ? [] : state.anchors,
    }));
  },

  addParagraph: async (noteId, text, orderIndex) => {
    const id = generateId();
    const para: NoteParagraph = { id, noteId, text, orderIndex };
    await db.noteParagraphs.add(para);
    set(state => {
      if (state.currentNote?.id === noteId) {
        const newParagraphs = [...state.paragraphs, para].sort((a, b) => a.orderIndex - b.orderIndex);
        return { paragraphs: newParagraphs };
      }
      return {};
    });
    return id;
  },

  updateParagraph: async (id, text) => {
    await db.noteParagraphs.update(id, { text });
    set(state => ({
      paragraphs: state.paragraphs.map(p => (p.id === id ? { ...p, text } : p)),
    }));
  },

  deleteParagraph: async (id) => {
    await db.noteParagraphs.delete(id);
    set(state => ({
      paragraphs: state.paragraphs.filter(p => p.id !== id),
    }));
  },

  addPageAnchor: async (noteId, pageNumber, confidence) => {
    const id = generateId();
    const anchor: PageAnchor = { id, noteId, pageNumber, confidence: confidence ?? 1 };
    await db.pageAnchors.add(anchor);
    set(state => {
      if (state.currentNote?.id === noteId) {
        return { anchors: [...state.anchors, anchor] };
      }
      return {};
    });
    return id;
  },

  removePageAnchor: async (id) => {
    await db.pageAnchors.delete(id);
    set(state => ({
      anchors: state.anchors.filter(a => a.id !== id),
    }));
  },

  addToOCRQueue: (dataUrl) => {
    const imageId = generateId();
    const item: OCRQueueItem = { imageId, dataUrl, status: 'pending', progress: 0 };
    set(state => ({ ocrQueue: [...state.ocrQueue, item] }));
    return imageId;
  },

  updateOCRQueueItem: (imageId, updates) => {
    set(state => ({
      ocrQueue: state.ocrQueue.map(item =>
        item.imageId === imageId ? { ...item, ...updates } : item
      ),
    }));
  },

  removeFromOCRQueue: (imageId) => {
    set(state => ({
      ocrQueue: state.ocrQueue.filter(item => item.imageId !== imageId),
    }));
  },

  processOCRQueue: async () => {
    const state = get();
    if (state.ocrWorkerBusy) return;
    const pending = state.ocrQueue.filter(item => item.status === 'pending');
    if (pending.length === 0) return;

    set({ ocrWorkerBusy: true });

    for (const item of pending) {
      get().updateOCRQueueItem(item.imageId, { status: 'processing', progress: 0 });

      try {
        const Tesseract = await import('tesseract.js');
        const worker = await Tesseract.createWorker('chi_sim+eng', 1, {
          logger: (m: any) => {
            if (m.progress !== undefined) {
              get().updateOCRQueueItem(item.imageId, {
                progress: m.progress,
              });
            }
          },
        });

        const { data } = await worker.recognize(item.dataUrl);

        const paragraphs: OCRResult['paragraphs'] = (data.paragraphs || [])
          .filter((p: any) => p.text.trim())
          .map((p: any, i: number) => ({
            orderIndex: i,
            text: p.text.trim(),
            bbox: p.bbox
              ? { x0: p.bbox.x0, y0: p.bbox.y0, x1: p.bbox.x1, y1: p.bbox.y1 }
              : undefined,
            confidence: p.confidence / 100,
          }));

        const result: OCRResult = {
          imageId: item.imageId,
          text: data.text,
          paragraphs,
        };

        get().updateOCRQueueItem(item.imageId, {
          status: 'done',
          progress: 1,
          result,
        });

        await worker.terminate();
      } catch (err: any) {
        get().updateOCRQueueItem(item.imageId, {
          status: 'error',
          progress: 0,
        });
      }
    }

    set({ ocrWorkerBusy: false });
  },

  getNotesByBook: (bookId) => {
    return get().notes.filter(n => n.bookId === bookId);
  },

  getTodayNoteCount: () => {
    const today = dayjs().format('YYYY-MM-DD');
    return get().notes.filter(n => dayjs(n.createdAt).format('YYYY-MM-DD') === today).length;
  },
}));
