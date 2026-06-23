import { useState } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { speak, stopSpeaking } from "@/utils/voice";
import { useAccessibilityStore } from "@/store/accessibilityStore";

interface VoiceButtonProps {
  text: string;
  label?: string;
}

export default function VoiceButton({ text, label = "播报" }: VoiceButtonProps) {
  const config = useAccessibilityStore();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleClick = async () => {
    if (!config.voiceEnabled) return;

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      await speak(text, config);
    } catch {
      // ignore
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!config.voiceEnabled}
      className={cn(
        "a11y-btn a11y-btn-outline",
        !config.voiceEnabled && "opacity-50 cursor-not-allowed"
      )}
      aria-label={label}
    >
      <Volume2
        className={cn("w-6 h-6", isSpeaking && "animate-pulse-soft")}
      />
      <span>{label}</span>
    </button>
  );
}
