// 估价流程状态：Zustand Store

import { create } from 'zustand';
import type {
  AIAnalyzeResult, QuoteResult, ProductModel,
} from '@/types';

export type EvaluateStep = 'category' | 'brand' | 'model' | 'condition' | 'upload' | 'ai' | 'quote' | 'confirm';

interface ConditionAnswer {
  questionId: string;
  answer: string | boolean | number;
}

interface EvaluateState {
  step: EvaluateStep;
  selectedCategoryId: string | null;
  selectedBrandId: string | null;
  selectedModel: ProductModel | null;
  conditionAnswers: ConditionAnswer[];
  uploadedImages: { id: string; url: string; file?: File }[];
  aiResult: AIAnalyzeResult | null;
  quoteResult: QuoteResult | null;
  selectedTier: 'instant' | 'standard' | 'consignment' | null;

  setStep: (s: EvaluateStep) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setSelectedBrandId: (id: string | null) => void;
  setSelectedModel: (m: ProductModel | null) => void;
  setConditionAnswer: (qid: string, value: string | boolean | number) => void;
  addUploadedImage: (img: { id: string; url: string; file?: File }) => void;
  removeUploadedImage: (id: string) => void;
  clearUploadedImages: () => void;
  setAiResult: (r: AIAnalyzeResult | null) => void;
  setQuoteResult: (r: QuoteResult | null) => void;
  setSelectedTier: (t: 'instant' | 'standard' | 'consignment' | null) => void;

  resetAll: () => void;
  goBack: () => void;
}

const STEP_ORDER: EvaluateStep[] = ['category', 'brand', 'model', 'condition', 'upload', 'ai', 'quote', 'confirm'];

export const useEvaluateStore = create<EvaluateState>()((set, get) => ({
  step: 'category',
  selectedCategoryId: null,
  selectedBrandId: null,
  selectedModel: null,
  conditionAnswers: [],
  uploadedImages: [],
  aiResult: null,
  quoteResult: null,
  selectedTier: null,

  setStep: (s) => set({ step: s }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id, selectedBrandId: null, selectedModel: null }),
  setSelectedBrandId: (id) => set({ selectedBrandId: id, selectedModel: null }),
  setSelectedModel: (m) => set({ selectedModel: m }),
  setConditionAnswer: (qid, value) => set((st) => {
    const exists = st.conditionAnswers.findIndex((a) => a.questionId === qid);
    const next = [...st.conditionAnswers];
    if (exists >= 0) next[exists] = { questionId: qid, answer: value };
    else next.push({ questionId: qid, answer: value });
    return { conditionAnswers: next };
  }),
  addUploadedImage: (img) => set((st) => ({ uploadedImages: [...st.uploadedImages, img] })),
  removeUploadedImage: (id) => set((st) => ({ uploadedImages: st.uploadedImages.filter((i) => i.id !== id) })),
  clearUploadedImages: () => set({ uploadedImages: [] }),
  setAiResult: (r) => set({ aiResult: r }),
  setQuoteResult: (r) => set({ quoteResult: r }),
  setSelectedTier: (t) => set({ selectedTier: t }),

  resetAll: () => set({
    step: 'category',
    selectedCategoryId: null,
    selectedBrandId: null,
    selectedModel: null,
    conditionAnswers: [],
    uploadedImages: [],
    aiResult: null,
    quoteResult: null,
    selectedTier: null,
  }),

  goBack: () => {
    const idx = STEP_ORDER.indexOf(get().step);
    if (idx > 0) set({ step: STEP_ORDER[idx - 1] });
  },
}));

export default useEvaluateStore;
