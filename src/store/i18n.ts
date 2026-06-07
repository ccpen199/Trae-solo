import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'zh' | 'en';
type Namespace = 'common' | 'dashboard' | 'auth' | 'property' | 'compliance';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

interface I18nState {
  language: Language;
  translations: Translations;
  loading: boolean;
  t: (key: string, namespace?: Namespace) => string;
  setLanguage: (lang: Language) => void;
  loadTranslations: (lang: Language) => Promise<void>;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'zh',
      translations: {},
      loading: false,
      t: (key: string, namespace: Namespace = 'common') => {
        const { translations, language } = get();
        const fullKey = `${namespace}.${key}`;
        return translations[language]?.[fullKey] || key;
      },
      setLanguage: (lang: Language) => {
        set({ language: lang });
        get().loadTranslations(lang);
      },
      loadTranslations: async (lang: Language) => {
        set({ loading: true });
        try {
          const response = await fetch(`/api/i18n/translations?lang=${lang}`);
          if (response.ok) {
            const payload = await response.json();
            const translations = payload.data?.translations || payload.translations || {};
            const namespace = payload.data?.namespace || 'common';
            const flatTranslations: { [key: string]: string } = {};
            Object.entries(translations).forEach(([ns, keys]) => {
              if (keys && typeof keys === 'object') {
                Object.entries(keys as Record<string, string>).forEach(([k, v]) => {
                  flatTranslations[`${ns}.${k}`] = v;
                });
                return;
              }
              flatTranslations[`${namespace}.${ns}`] = String(keys);
            });
            set((state) => ({
              translations: { ...state.translations, [lang]: flatTranslations },
              loading: false,
            }));
          }
        } catch (error) {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'i18n-storage',
      partialize: (state) => ({ language: state.language, translations: state.translations }),
    }
  )
);
