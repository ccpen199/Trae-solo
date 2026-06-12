import { create } from 'zustand';
import { JournalEntry, StatsData, Emotion } from '@/types';

interface JournalStore {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'> & { timestamp?: number }) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
  getStats: () => StatsData;
}

const STORAGE_KEY = 'cat-language-lab-journal';

const loadFromStorage = (): JournalEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (entries: JournalEntry[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const generateId = () => {
  return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: loadFromStorage(),

  addEntry: (entry) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: generateId(),
      timestamp: entry.timestamp ?? Date.now(),
    };
    set((state) => {
      const newEntries = [newEntry, ...state.entries];
      saveToStorage(newEntries);
      return { entries: newEntries };
    });
  },

  removeEntry: (id) => {
    set((state) => {
      const newEntries = state.entries.filter((e) => e.id !== id);
      saveToStorage(newEntries);
      return { entries: newEntries };
    });
  },

  clearAll: () => {
    set({ entries: [] });
    saveToStorage([]);
  },

  getStats: (): StatsData => {
    const { entries } = get();
    const totalEntries = entries.length;
    const analysisCount = entries.filter((e) => e.type === 'analysis').length;
    const synthesisCount = entries.filter((e) => e.type === 'synthesis').length;

    const emotionCountMap = new Map<string, { emotion: Emotion; count: number }>();
    const sceneCountMap = new Map<string, number>();
    let totalConfidence = 0;
    let confidenceCount = 0;

    entries.forEach((entry) => {
      const emotionId = entry.emotion.id;
      if (!emotionCountMap.has(emotionId)) {
        emotionCountMap.set(emotionId, { emotion: entry.emotion, count: 0 });
      }
      emotionCountMap.get(emotionId)!.count++;

      if (entry.scene) {
        sceneCountMap.set(entry.scene, (sceneCountMap.get(entry.scene) || 0) + 1);
      }

      if (entry.confidence !== undefined) {
        totalConfidence += entry.confidence;
        confidenceCount++;
      }
    });

    const topEmotions = Array.from(emotionCountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        emotion: item.emotion,
        count: item.count,
        percentage: totalEntries > 0 ? (item.count / totalEntries) * 100 : 0,
      }));

    const sceneDistribution = Array.from(sceneCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([scene, count]) => ({
        scene,
        count,
        percentage: totalEntries > 0 ? (count / totalEntries) * 100 : 0,
      }));

    const weeklyTrend: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const count = entries.filter(
        (e) => e.timestamp >= dayStart && e.timestamp < dayEnd
      ).length;
      weeklyTrend.push({ date: dateStr, count });
    }

    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    return {
      totalEntries,
      analysisCount,
      synthesisCount,
      topEmotions,
      sceneDistribution,
      weeklyTrend,
      avgConfidence,
    };
  },
}));
