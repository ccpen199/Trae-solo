import { create } from 'zustand';
import type { Currency, Language } from '@/shared/types';
import { DEFAULT_CURRENCY, DEFAULT_LANGUAGE, storeGet, storeSet } from '@/utils/api';

interface AppState {
  language: Language;
  currency: Currency;
  region: string | null;
  setLanguage: (l: Language) => void;
  setCurrency: (c: Currency) => void;
  setRegion: (r: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: storeGet('sp.lang', DEFAULT_LANGUAGE),
  currency: storeGet('sp.cur', DEFAULT_CURRENCY),
  region: storeGet<string | null>('sp.region', null),
  setLanguage: (l) => { set({ language: l }); storeSet('sp.lang', l); },
  setCurrency: (c) => { set({ currency: c }); storeSet('sp.cur', c); },
  setRegion: (r) => { set({ region: r }); storeSet('sp.region', r); },
}));
