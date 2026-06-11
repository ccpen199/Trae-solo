/// <reference types="vite/client" />

interface Window {
  speechSynthesis: SpeechSynthesis;
}

declare const SpeechSynthesisUtterance: {
  new (text: string): SpeechSynthesisUtterance;
};

interface SpeechSynthesisUtterance {
  lang: string;
  rate: number;
  onend: (() => void) | null;
}

interface SpeechSynthesis {
  speak: (utterance: SpeechSynthesisUtterance) => void;
  cancel: () => void;
}
