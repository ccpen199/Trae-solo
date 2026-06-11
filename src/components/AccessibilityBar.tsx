import React, { useState } from 'react';
import { Type, Contrast, Volume2, VolumeX, Settings, X, Minus, Plus } from 'lucide-react';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { useVoice } from '@/hooks/useVoice';
import type { AccessibilityConfig } from '../../shared/types';

export default function AccessibilityBar() {
  const { fontSize, contrast, voiceEnabled, voiceSpeed, setFontSize, setContrast, toggleVoiceEnabled, setVoiceSpeed } =
    useAccessibilityStore();
  const { speak, isSupported } = useVoice();
  const [isExpanded, setIsExpanded] = useState(false);

  const fontSizeOptions: { value: AccessibilityConfig['fontSize']; label: string }[] = [
    { value: 'normal', label: '标准' },
    { value: 'large', label: '大号' },
    { value: 'xlarge', label: '超大号' },
  ];

  const handleFontSizeChange = (size: AccessibilityConfig['fontSize']) => {
    setFontSize(size);
    const label = fontSizeOptions.find((o) => o.value === size)?.label;
    speak(`字号已调整为${label}`);
  };

  const handleContrastToggle = () => {
    const newContrast: AccessibilityConfig['contrast'] = contrast === 'normal' ? 'high' : 'normal';
    setContrast(newContrast);
    speak(newContrast === 'high' ? '已开启高对比度模式' : '已关闭高对比度模式');
  };

  const handleVoiceToggle = () => {
    toggleVoiceEnabled();
    speak(voiceEnabled ? '已关闭语音播报' : '已开启语音播报');
  };

  const handleSpeedChange = (delta: number) => {
    const newSpeed = Math.max(0.5, Math.min(2, voiceSpeed + delta));
    setVoiceSpeed(newSpeed);
    speak(`语速已调整为${newSpeed.toFixed(1)}倍`);
  };

  const handleSpeakDemo = () => {
    speak('欢迎使用银发数字生活工作台，我是您的语音助手。');
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      speak('无障碍设置栏已展开');
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleExpand}
          className="w-16 h-16 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
          aria-label="打开无障碍设置"
        >
          <Settings className="w-8 h-8" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
      <div className="bg-primary text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7" />
          <span className="text-xl font-bold">无障碍设置</span>
        </div>
        <button
          onClick={toggleExpand}
          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/20 transition-colors"
          aria-label="关闭无障碍设置"
        >
          <X className="w-7 h-7" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <Type className="w-6 h-6 text-primary" />
            <span>字号调节</span>
          </div>
          <div className="flex gap-2">
            {fontSizeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFontSizeChange(option.value)}
                className={`flex-1 py-3 px-4 rounded-xl text-lg font-bold transition-all min-h-[48px] ${
                  fontSize === option.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={fontSize === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <Contrast className="w-6 h-6 text-primary" />
            <span>高对比度</span>
          </div>
          <button
            onClick={handleContrastToggle}
            className={`w-full py-4 px-4 rounded-xl text-lg font-bold transition-all min-h-[56px] flex items-center justify-between ${
              contrast === 'high'
                ? 'bg-gray-900 text-yellow-400 shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={contrast === 'high'}
          >
            <span>{contrast === 'high' ? '已开启' : '已关闭'}</span>
            <div
              className={`w-14 h-8 rounded-full relative transition-colors ${
                contrast === 'high' ? 'bg-yellow-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  contrast === 'high' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </div>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            {voiceEnabled ? <Volume2 className="w-6 h-6 text-primary" /> : <VolumeX className="w-6 h-6 text-gray-400" />}
            <span>语音播报</span>
          </div>
          <button
            onClick={handleVoiceToggle}
            disabled={!isSupported}
            className={`w-full py-4 px-4 rounded-xl text-lg font-bold transition-all min-h-[56px] flex items-center justify-between ${
              !isSupported
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : voiceEnabled
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={voiceEnabled && isSupported}
          >
            <span>{!isSupported ? '设备不支持' : voiceEnabled ? '已开启' : '已关闭'}</span>
            <div
              className={`w-14 h-8 rounded-full relative transition-colors ${
                voiceEnabled && isSupported ? 'bg-sky-300' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  voiceEnabled && isSupported ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </div>
          </button>

          {voiceEnabled && isSupported && (
            <div className="space-y-3 pl-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-700">语速调节</span>
                <span className="text-lg font-bold text-primary">{voiceSpeed.toFixed(1)}x</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSpeedChange(-0.1)}
                  className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                  aria-label="减慢语速"
                >
                  <Minus className="w-6 h-6" />
                </button>
                <div className="flex-1 h-3 bg-gray-200 rounded-full relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
                    style={{ width: `${((voiceSpeed - 0.5) / 1.5) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => handleSpeedChange(0.1)}
                  className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                  aria-label="加快语速"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              <button
                onClick={handleSpeakDemo}
                className="w-full py-3 px-4 bg-sky-100 text-sky-700 rounded-xl text-lg font-bold hover:bg-sky-200 transition-colors min-h-[48px]"
              >
                试听语音效果
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
