import { Type, Contrast, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccessibilityStore } from "@/store/accessibilityStore";
import type { FontSize, ContrastMode } from "@/types";

const fontSizeLabels: Record<FontSize, string> = {
  base: "标准",
  large: "大",
  xlarge: "超大",
};

const fontSizeOrder: FontSize[] = ["base", "large", "xlarge"];

const contrastLabels: Record<ContrastMode, string> = {
  normal: "标准",
  high: "高对比",
};

export default function AccessibilityBar() {
  const {
    fontSize,
    contrast,
    voiceEnabled,
    setFontSize,
    setContrast,
    toggleVoiceEnabled,
  } = useAccessibilityStore();

  const cycleFontSize = () => {
    const currentIndex = fontSizeOrder.indexOf(fontSize);
    const nextIndex = (currentIndex + 1) % fontSizeOrder.length;
    setFontSize(fontSizeOrder[nextIndex]);
  };

  const toggleContrast = () => {
    setContrast(contrast === "normal" ? "high" : "normal");
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 py-3 px-4 shadow-a11y"
      style={{
        backgroundColor: "var(--color-card-bg)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={cycleFontSize}
          className="a11y-btn a11y-btn-secondary"
          aria-label={`字号：${fontSizeLabels[fontSize]}，点击切换`}
        >
          <Type className="w-6 h-6" />
          <span>字号：{fontSizeLabels[fontSize]}</span>
        </button>

        <button
          onClick={toggleContrast}
          className={cn(
            "a11y-btn",
            contrast === "high" ? "a11y-btn-primary" : "a11y-btn-outline"
          )}
          aria-label={`对比度：${contrastLabels[contrast]}，点击切换`}
        >
          <Contrast className="w-6 h-6" />
          <span>对比度：{contrastLabels[contrast]}</span>
        </button>

        <button
          onClick={toggleVoiceEnabled}
          className={cn(
            "a11y-btn",
            voiceEnabled ? "a11y-btn-primary" : "a11y-btn-ghost"
          )}
          aria-label={`语音播报：${voiceEnabled ? "开启" : "关闭"}，点击切换`}
        >
          {voiceEnabled ? (
            <Volume2 className="w-6 h-6" />
          ) : (
            <VolumeX className="w-6 h-6" />
          )}
          <span>语音：{voiceEnabled ? "开" : "关"}</span>
        </button>
      </div>
    </div>
  );
}
