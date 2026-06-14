export function speakText(text, options = {}) {
  if (!window.speechSynthesis) {
    options.onError?.('当前浏览器不支持语音播报');
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = (e) => options.onError?.(e.error || '播报出错');
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking() {
  return window.speechSynthesis?.speaking || false;
}
