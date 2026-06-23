import type { AccessibilityConfig } from "@/types";

export const isSpeechSupported = (): boolean => {
  return typeof window !== "undefined" && "speechSynthesis" in window;
};

export const getChineseVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(
    (v) => v.lang.startsWith("zh") || v.lang === "cmn-Hans-CN"
  );
};

export const speak = (
  text: string,
  config: AccessibilityConfig
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!config.voiceEnabled) {
      resolve();
      return;
    }

    if (!isSpeechSupported()) {
      reject(new Error("浏览器不支持语音播报"));
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = config.voiceRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = getChineseVoices();
    if (voices.length > 0) {
      const target =
        config.voiceGender === "female"
          ? voices.find(
              (v) =>
                v.name.includes("女") ||
                v.name.includes("Female") ||
                v.name.includes("female")
            ) || voices[0]
          : voices.find(
              (v) =>
                v.name.includes("男") ||
                v.name.includes("Male") ||
                v.name.includes("male")
            ) || voices[0];
      utterance.voice = target;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
};

export const stopSpeaking = (): void => {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
};

export const pauseSpeaking = (): void => {
  if (isSpeechSupported()) {
    window.speechSynthesis.pause();
  }
};

export const resumeSpeaking = (): void => {
  if (isSpeechSupported()) {
    window.speechSynthesis.resume();
  }
};
