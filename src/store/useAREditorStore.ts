import { create } from 'zustand';
import type { ARContent } from '@/types';
import { getARContentByPOI, updateARContent } from '@/services/api';

interface AREditorState {
  currentContent: ARContent | null;
  selectedTimelineSegment: string | null;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  loadARContent: (poiId: string) => void;
  selectSegment: (id: string | null) => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  updateContent: (data: Partial<ARContent>) => void;
}

export const useAREditorStore = create<AREditorState>((set, get) => ({
  currentContent: null,
  selectedTimelineSegment: null,
  isPlaying: false,
  currentTime: 0,
  totalDuration: 0,
  loadARContent: (poiId) => {
    const content = getARContentByPOI(poiId);
    if (content) {
      const maxEnd = content.timeline.reduce(
        (max, seg) => Math.max(max, seg.endTime),
        0,
      );
      set({
        currentContent: content,
        totalDuration: content.duration ?? maxEnd,
        currentTime: 0,
        isPlaying: false,
        selectedTimelineSegment: null,
      });
    } else {
      set({
        currentContent: null,
        totalDuration: 0,
        currentTime: 0,
        isPlaying: false,
        selectedTimelineSegment: null,
      });
    }
  },
  selectSegment: (id) => {
    set({ selectedTimelineSegment: id });
  },
  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },
  setCurrentTime: (time) => {
    const { totalDuration } = get();
    const clampedTime = Math.max(0, Math.min(time, totalDuration));
    set({ currentTime: clampedTime });
    if (clampedTime >= totalDuration) {
      set({ isPlaying: false });
    }
  },
  updateContent: (data) => {
    const { currentContent } = get();
    if (!currentContent) return;
    const updated = updateARContent(currentContent.id, data);
    if (updated) {
      set({ currentContent: updated });
    }
  },
}));
