import { Mic, MicOff, RefreshCw, AlertCircle } from 'lucide-react';
import useVoiceRecognition from '@/hooks/useVoiceRecognition';
import { useState } from 'react';

interface VoiceInputProps {
  onTextChange?: (text: string) => void;
  onVoiceEnd?: (fullText: string) => void;
  placeholder?: string;
  className?: string;
}

const VoiceInput = ({ onTextChange, onVoiceEnd, placeholder = '点击麦克风开始语音录入...', className = '' }: VoiceInputProps) => {
  const [showError, setShowError] = useState(false);

  const { isListening, transcript, interimTranscript, startListening, stopListening, resetTranscript, isSupported } =
    useVoiceRecognition({
      onResult: (text) => {
        onTextChange?.(transcript + text);
      },
      onEnd: () => {
        if (transcript) {
          onVoiceEnd?.(transcript);
        }
      },
      onError: () => {
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      },
    });

  const displayText = transcript || interimTranscript;

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-amber-50 border border-amber-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">您的浏览器不支持语音识别功能</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`min-h-32 p-4 border-2 rounded-xl transition-all duration-300 ${
          isListening
            ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-100'
            : 'border-zinc-200 bg-white hover:border-zinc-300'
        }`}
      >
        {displayText ? (
          <p className="text-zinc-700 leading-relaxed">
            {displayText}
            {isListening && <span className="inline-block w-1 h-4 bg-primary-500 ml-1 animate-pulse"></span>}
          </p>
        ) : (
          <p className="text-zinc-400 italic">{placeholder}</p>
        )}

        {showError && (
          <div className="mt-2 flex items-center gap-2 text-danger-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>语音识别出错，请重试</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
            isListening
              ? 'bg-gradient-to-r from-danger-500 to-danger-600 text-white shadow-lg shadow-danger-200 animate-pulse-soft'
              : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              <span>停止录音</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>开始录音</span>
            </>
          )}
        </button>

        {transcript && (
          <button
            onClick={() => {
              resetTranscript();
              onTextChange?.('');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-zinc-600 hover:text-primary-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">重新录入</span>
          </button>
        )}

        {isListening && (
          <div className="flex items-center gap-1 ml-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1 bg-primary-500 rounded-full animate-bounce"
                style={{
                  height: `${12 + Math.random() * 16}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s',
                }}
              />
            ))}
            <span className="ml-2 text-sm text-primary-600 font-medium">正在识别...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInput;
