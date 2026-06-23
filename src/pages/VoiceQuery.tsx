import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2, X } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { searchApi } from '@/services/api';
import { SearchResult } from '../../../shared/types';
import CategoryBadge from '@/components/CategoryBadge';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function VoiceQuery() {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentCity = useAppStore((state) => state.currentCity);

  const initAudioContext = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      audioContext.createMediaStreamSource(stream).connect(analyser);
    } catch (err) {
      console.error('Audio context error:', err);
    }
  }, []);

  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const levels: number[] = [];
    const step = Math.floor(dataArray.length / 20);
    for (let i = 0; i < 20; i++) {
      const sum = dataArray.slice(i * step, (i + 1) * step).reduce((a, b) => a + b, 0);
      levels.push(sum / step / 255);
    }
    setAudioLevels(levels);
    animationRef.current = requestAnimationFrame(updateAudioLevels);
  }, []);

  const stopAudioLevels = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    animationRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    setAudioLevels(Array(20).fill(0));
  }, []);

  const initRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('您的浏览器不支持语音识别功能');
      return null;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        event.results[i].isFinal ? (final += text) : (interim += text);
      }
      if (final) setFinalTranscript(prev => prev + final);
      setTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') setError(`语音识别错误: ${event.error}`);
      setIsListening(false);
      stopAudioLevels();
    };

    recognition.onend = () => {
      if (isListening && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) { /* ignore */ }
      }
    };

    return recognition;
  }, [isListening, stopAudioLevels]);

  const handleSearch = useCallback(async (query: string) => {
    if (!currentCity) { setError('请先选择城市'); return; }
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchApi.search(query.trim(), currentCity.id, 5);
      setResults(response.results);
      setShowResults(true);
    } catch (err) {
      setError('搜索失败，请稍后重试');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCity]);

  const startListening = useCallback(async () => {
    setError(null);
    setFinalTranscript('');
    setTranscript('');
    setResults([]);
    setShowResults(false);
    await initAudioContext();
    if (!recognitionRef.current) recognitionRef.current = initRecognition();
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      updateAudioLevels();
    } catch (err) {
      setError('无法启动语音识别');
      console.error('Start error:', err);
    }
  }, [initAudioContext, initRecognition, updateAudioLevels]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    stopAudioLevels();
    const fullText = finalTranscript + transcript;
    if (fullText.trim()) handleSearch(fullText);
  }, [finalTranscript, transcript, handleSearch, stopAudioLevels]);

  const speakResult = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const closeResults = useCallback(() => {
    setShowResults(false);
    setResults([]);
    setFinalTranscript('');
    setTranscript('');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      stopAudioLevels();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [stopAudioLevels]);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 p-4">
        <h1 className="text-xl font-bold text-gray-800 text-center">语音查询</h1>
      </div>

      {error && (
        <div className="absolute top-16 left-4 right-4 p-4 bg-red-500/90 text-white rounded-xl text-center z-20">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center justify-center min-h-screen px-6 pt-16 pb-24">
        <div className="w-full max-w-md space-y-8">
          <div className="h-32 flex items-center justify-center">
            <p className={`text-center text-lg transition-all duration-300 ${finalTranscript || transcript ? 'text-gray-800' : 'text-gray-400'}`}>
              {finalTranscript}
              <span className="text-green-600">{transcript}</span>
              {!finalTranscript && !transcript && (isListening ? '正在聆听...' : '点击下方按钮开始说话')}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1 h-16">
            {audioLevels.map((level, idx) => (
              <div
                key={idx}
                className="w-2 bg-gradient-to-t from-green-400 to-green-600 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(8, level * 60)}px`, opacity: isListening ? 1 : 0.3 }}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className="relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50"
            >
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-green-500/20 animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-green-500/10" />
                </>
              )}
              <div
                className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                  isListening ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-green-500 hover:bg-green-600 hover:scale-105'
                }`}
              >
                {isListening ? <MicOff className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
              </div>
            </button>
          </div>

          <p className="text-center text-sm text-gray-500">
            {isListening ? '再次点击停止录音并搜索' : '按住或点击麦克风开始语音查询'}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-30">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            <p className="text-gray-700 font-medium">正在搜索...</p>
          </div>
        </div>
      )}

      <div
        className={`fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl transform transition-all duration-500 ease-out z-40 ${
          showResults ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{ maxHeight: '75vh' }}
      >
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">搜索结果</h2>
            <button onClick={closeResults} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {results.length === 0 ? (
            <p className="text-center text-gray-500 py-8">未找到相关物品</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, idx) => (
                <div
                  key={result.item.id}
                  className={`p-5 rounded-2xl border-2 transition-all duration-500 ${
                    idx === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{result.item.name}</h3>
                      {result.matchedAlias && <p className="text-sm text-gray-500 mt-1">匹配: {result.matchedAlias}</p>}
                      <div className="mt-2"><CategoryBadge category={result.category} size="sm" /></div>
                    </div>
                    <button
                      onClick={() => speakResult(`${result.item.name}，${result.category.name}，${result.item.requirements}`)}
                      disabled={isSpeaking}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isSpeaking ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">{result.item.requirements}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
