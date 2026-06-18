import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { AccessibilityConfig, AppState } from '../types';

const A11Y_STORAGE_KEY = 'zz_gov_a11y_config';
const OFFLINE_STORAGE_KEY = 'zz_gov_offline_config';

const defaultA11y: AccessibilityConfig = {
  enabled: false,
  highContrast: false,
  largeFont: false,
  voiceNavigation: false,
  speakRate: 1.0,
  autoReadContent: false
};

interface AppStoreState extends AppState {
  isInitialized: boolean;

  init: () => Promise<void>;
  setAccessibility: (config: Partial<AccessibilityConfig>) => void;
  toggleHighContrast: () => void;
  toggleLargeFont: () => void;
  toggleVoiceNavigation: () => void;
  speak: (text: string) => void;
  stopSpeak: () => void;
  setOfflineMode: (enabled: boolean) => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  accessibility: defaultA11y,
  offlineMode: false,
  offlinePackageVersion: undefined,
  lastSyncTime: undefined,
  isInitialized: false,

  init: async () => {
    console.log('[AppStore] init start');
    try {
      const a11yStr = Taro.getStorageSync(A11Y_STORAGE_KEY);
      const offlineStr = Taro.getStorageSync(OFFLINE_STORAGE_KEY);

      let a11y = defaultA11y;
      let offline = false;
      let version: string | undefined;
      let syncTime: string | undefined;

      if (a11yStr) {
        try {
          a11y = { ...defaultA11y, ...JSON.parse(a11yStr) };
        } catch (e) {
          console.error('[AppStore] parse a11y config error:', e);
        }
      }

      if (offlineStr) {
        try {
          const offlineCfg = JSON.parse(offlineStr);
          offline = offlineCfg.enabled || false;
          version = offlineCfg.version;
          syncTime = offlineCfg.lastSyncTime;
        } catch (e) {
          console.error('[AppStore] parse offline config error:', e);
        }
      }

      if (a11y.highContrast || a11y.largeFont) {
        a11y.enabled = true;
      }

      set({
        accessibility: a11y,
        offlineMode: offline,
        offlinePackageVersion: version,
        lastSyncTime: syncTime,
        isInitialized: true
      });

      console.log('[AppStore] init success, a11y:', a11y.enabled, 'offline:', offline);
    } catch (err) {
      console.error('[AppStore] init error:', err);
      set({ isInitialized: true });
    }
  },

  setAccessibility: (config) => {
    const current = get().accessibility;
    const newConfig = { ...current, ...config };
    newConfig.enabled = newConfig.highContrast || newConfig.largeFont || newConfig.voiceNavigation || newConfig.enabled;
    Taro.setStorageSync(A11Y_STORAGE_KEY, JSON.stringify(newConfig));
    set({ accessibility: newConfig });
    console.log('[AppStore] setAccessibility:', newConfig);
  },

  toggleHighContrast: () => {
    const a11y = get().accessibility;
    get().setAccessibility({ highContrast: !a11y.highContrast });
    Taro.showToast({ title: `高对比度模式已${!a11y.highContrast ? '开启' : '关闭'}`, icon: 'none' });
  },

  toggleLargeFont: () => {
    const a11y = get().accessibility;
    get().setAccessibility({ largeFont: !a11y.largeFont });
    Taro.showToast({ title: `大字体模式已${!a11y.largeFont ? '开启' : '关闭'}`, icon: 'none' });
  },

  toggleVoiceNavigation: () => {
    const a11y = get().accessibility;
    const enabled = !a11y.voiceNavigation;
    get().setAccessibility({ voiceNavigation: enabled });
    Taro.showToast({ title: `语音导航已${enabled ? '开启' : '关闭'}`, icon: 'none' });
  },

  speak: (text) => {
    if (!get().accessibility.voiceNavigation) return;
    console.log('[AppStore] speak:', text.substring(0, 50) + '...');
    try {
      if (process.env.TARO_ENV === 'h5') {
        if ('speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = 'zh-CN';
          utter.rate = get().accessibility.speakRate;
          window.speechSynthesis.speak(utter);
        }
      }
    } catch (e) {
      console.error('[AppStore] speak error:', e);
    }
  },

  stopSpeak: () => {
    try {
      if (process.env.TARO_ENV === 'h5' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.error('[AppStore] stopSpeak error:', e);
    }
  },

  setOfflineMode: (enabled) => {
    const config = {
      enabled,
      version: get().offlinePackageVersion || '1.0.0',
      lastSyncTime: new Date().toISOString()
    };
    Taro.setStorageSync(OFFLINE_STORAGE_KEY, JSON.stringify(config));
    set({
      offlineMode: enabled,
      offlinePackageVersion: config.version,
      lastSyncTime: config.lastSyncTime
    });
    Taro.showToast({ title: `离线模式已${enabled ? '开启' : '关闭'}`, icon: 'none' });
  }
}));
