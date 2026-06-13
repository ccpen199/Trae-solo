import { useState } from 'react'
import {
  Volume2, Eye, Type, Monitor, RotateCcw, Accessibility, Check,
} from 'lucide-react'
import { useAccessibilityStore } from '@/stores/useAccessibilityStore'
import { cn } from '@/lib/utils'

type FontSize = 'normal' | 'large' | 'xlarge'

const fontSizeOptions: { value: FontSize; label: string }[] = [
  { value: 'normal', label: '标准' },
  { value: 'large', label: '大' },
  { value: 'xlarge', label: '特大' },
]

const testText = '欢迎使用政务服务无障碍功能，我们将为您提供更贴心的服务体验。'

export default function AccessibilityPage() {
  const store = useAccessibilityStore()
  const [speaking, setSpeaking] = useState(false)

  const handleTestSpeak = () => {
    if (speaking) return
    setSpeaking(true)
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(testText)
    utterance.lang = 'zh-CN'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="bg-gov-gradient px-6 pt-12 pb-8 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Accessibility className="w-7 h-7" />
          无障碍设置
        </h1>
        <p className="mt-2 text-white/80 text-sm">
          根据您的需要调整页面显示和辅助功能，让服务更易用
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gov-50 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-gov-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">语音导航</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  开启后点击页面元素将自动朗读
                </div>
              </div>
            </div>
            <button
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors duration-200',
                store.voiceNavigation ? 'bg-gov-600' : 'bg-slate-300'
              )}
              onClick={store.toggleVoiceNavigation}
              role="switch"
              aria-checked={store.voiceNavigation}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200',
                  store.voiceNavigation ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gov-50 flex items-center justify-center">
              <Type className="w-5 h-5 text-gov-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">字体大小</div>
              <div className="text-xs text-slate-500 mt-0.5">
                选择适合您的字体大小
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {fontSizeOptions.map((opt) => (
              <button
                key={opt.value}
                className={cn(
                  store.fontSize === opt.value ? 'tab-btn-active' : 'tab-btn'
                )}
                onClick={() => store.setFontSize(opt.value)}
              >
                {store.fontSize === opt.value && (
                  <Check className="w-3.5 h-3.5" />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gov-50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-gov-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">高对比度模式</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  增强文字与背景的对比度
                </div>
              </div>
            </div>
            <button
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors duration-200',
                store.highContrast ? 'bg-gov-600' : 'bg-slate-300'
              )}
              onClick={store.toggleHighContrast}
              role="switch"
              aria-checked={store.highContrast}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200',
                  store.highContrast ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <p className="text-slate-700">
              这是一段示例文字，用于预览高对比度模式的效果。开启后页面将以黑底白字显示，边框更加醒目。
            </p>
            <button className="btn-primary text-sm py-2">示例按钮</button>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gov-50 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-gov-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">读屏模式</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  为屏幕阅读器优化页面结构
                </div>
              </div>
            </div>
            <button
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors duration-200',
                store.screenReader ? 'bg-gov-600' : 'bg-slate-300'
              )}
              onClick={store.toggleScreenReader}
              role="switch"
              aria-checked={store.screenReader}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200',
                  store.screenReader ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-slate-900 mb-3">语音测试</h3>
          <p className="text-sm text-slate-500 mb-3">
            点击下方按钮试听语音朗读效果
          </p>
          <button
            className="btn-secondary text-sm"
            onClick={handleTestSpeak}
            disabled={speaking}
          >
            <Volume2 className={cn('w-4 h-4', speaking && 'animate-pulse')} />
            {speaking ? '正在朗读...' : '试听语音'}
          </button>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-all"
          onClick={store.resetSettings}
        >
          <RotateCcw className="w-4 h-4" />
          恢复默认设置
        </button>
      </div>
    </div>
  )
}
