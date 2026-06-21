import { create } from "zustand";

export type Lang = "zh" | "it";

interface LangState {
  lang: Lang;
  toggleLang: () => void;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: "zh",
  toggleLang: () => set((state) => ({ lang: state.lang === "zh" ? "it" : "zh" })),
  setLang: (lang) => set({ lang }),
}));
