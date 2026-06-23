import { create } from "zustand";
import type { FontSize, ContrastMode, AccessibilityConfig } from "@/types";

interface AccessibilityState extends AccessibilityConfig {
  setFontSize: (size: FontSize) => void;
  setContrast: (mode: ContrastMode) => void;
  toggleVoiceEnabled: () => void;
  setVoiceGender: (gender: "male" | "female") => void;
  setVoiceRate: (rate: number) => void;
  applyToDocument: () => void;
}

const getInitialState = (): AccessibilityConfig => {
  if (typeof window === "undefined") {
    return {
      fontSize: "large",
      contrast: "normal",
      voiceEnabled: true,
      voiceGender: "female",
      voiceRate: 0.9,
    };
  }

  try {
    const saved = localStorage.getItem("accessibilityConfig");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }

  return {
    fontSize: "large",
    contrast: "normal",
    voiceEnabled: true,
    voiceGender: "female",
    voiceRate: 0.9,
  };
};

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  ...getInitialState(),

  setFontSize: (size) => {
    set({ fontSize: size });
    get().applyToDocument();
    try {
      localStorage.setItem(
        "accessibilityConfig",
        JSON.stringify({ ...get() })
      );
    } catch {
      // ignore
    }
  },

  setContrast: (mode) => {
    set({ contrast: mode });
    get().applyToDocument();
    try {
      localStorage.setItem(
        "accessibilityConfig",
        JSON.stringify({ ...get() })
      );
    } catch {
      // ignore
    }
  },

  toggleVoiceEnabled: () => {
    set({ voiceEnabled: !get().voiceEnabled });
    try {
      localStorage.setItem(
        "accessibilityConfig",
        JSON.stringify({ ...get() })
      );
    } catch {
      // ignore
    }
  },

  setVoiceGender: (gender) => {
    set({ voiceGender: gender });
    try {
      localStorage.setItem(
        "accessibilityConfig",
        JSON.stringify({ ...get() })
      );
    } catch {
      // ignore
    }
  },

  setVoiceRate: (rate) => {
    set({ voiceRate: rate });
    try {
      localStorage.setItem(
        "accessibilityConfig",
        JSON.stringify({ ...get() })
      );
    } catch {
      // ignore
    }
  },

  applyToDocument: () => {
    if (typeof document === "undefined") return;

    const { fontSize, contrast } = get();
    const html = document.documentElement;

    html.classList.remove("font-size-base", "font-size-large", "font-size-xlarge");
    html.classList.add(`font-size-${fontSize}`);

    if (contrast === "high") {
      html.classList.add("high-contrast");
    } else {
      html.classList.remove("high-contrast");
    }
  },
}));
