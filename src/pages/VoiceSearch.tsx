import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Search, Brain, MapPin, Tag, MessageCircleQuestion } from 'lucide-react'
import { api } from '@/utils/api'
import { CATEGORIES } from '@/types'
import type { Post } from '@/types'
import PostCard from '@/components/PostCard'
import { EmptyState, SkeletonCard } from '@/components/StateFeedback'

const EXAMPLE_PHRASES = ['找朝阳区合租', '北京求职程序员', '上海二手iPhone']

const MOCK_POSTS: Post[] = Array.from({ length: 6 }, (_, i) => ({
  id: `mock-${i}`,
  category: 'share',
  title: ['朝阳合租主卧近地铁', '望京精装次卧招室友', '三里屯合租限女生', '国贸附近合租低价', 'CBD合租拎包入住', '双井合租朝南主卧'][i],
  description: '',
  price: [2800, 2200, 2500, 1800, 3200, 2600][i],
  province: '北京市',
  city: '北京市',
  district: '朝阳区',
  authorId: '1',
  authorType: 'user',
  status: 'approved',
  riskScore: 0,
  isTop: i < 2,
  views: 100 + i * 30,
  leads: 10 + i * 3,
  conversions: 2 + i,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}))

export default function VoiceSearch() {
  const navigate = useNavigate()
  const [recording, setRecording] = useState(false)
  const [timer, setTimer] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [typing, setTyping] = useState(false)
  const [intent, setIntent] = useState<{ category: string; region: string; keyword: string } | null>(null)
  const [results, setResults] = useState<Post[]>([])
  const [resultsLoading, setResultsLoading] = useState(false)
  const [textInput, setTextInput] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const phraseRef = useRef(0)

  const startRecording = useCallback(() => {
    setRecording(true)
    setTimer(0)
    setTranscription('')
    setIntent(null)
    setResults([])
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t >= 2) {
          clearInterval(timerRef.current)
          setRecording(false)
          return 3
        }
        return t + 1
      })
    }, 1000)
  }, [])

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current)
    setRecording(false)
    setTimer(3)
  }, [])

  useEffect(() => {
    if (timer === 3 && !recording && !transcription) {
      const phrase = EXAMPLE_PHRASES[phraseRef.current % EXAMPLE_PHRASES.length]
      phraseRef.current++
      setTyping(true)
      let i = 0
      const typeInterval = setInterval(() => {
        i++
        setTranscription(phrase.slice(0, i))
        if (i >= phrase.length) {
          clearInterval(typeInterval)
          setTyping(false)
          setIntent({ category: '房屋合租', region: '北京 · 朝阳', keyword: '合租' })
          loadResults('share', '朝阳区')
        }
      }, 80)
    }
  }, [timer, recording])

  const loadResults = async (category: string, district: string) => {
    setResultsLoading(true)
    try {
      const catKey = CATEGORIES.find((c) => c.label === category)?.key
      const data = await api.posts.list({ category: catKey, district })
      setResults(data.posts)
    } catch {
      setResults(MOCK_POSTS)
    } finally {
      setResultsLoading(false)
    }
  }

  const toggleMic = () => {
    if (recording) stopRecording()
    else startRecording()
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-navy-900">语音智能搜索</h1>
        <p className="text-slate-500 mt-2">说出你的需求，AI自动匹配类目和区域</p>
      </div>

      <div className="flex flex-col items-center">
        <button onClick={toggleMic} className="relative">
          {recording && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse-ring" />
          )}
          <span
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-colors ${
              recording ? 'bg-red-500' : 'bg-navy-800'
            }`}
          >
            {recording ? (
              <MicOff className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </span>
        </button>

        {recording && (
          <div className="flex items-end gap-1.5 mt-6 h-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1.5 bg-red-400 rounded-full animate-wave"
                style={{ height: '16px', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {recording && (
          <p className="mt-3 text-slate-500 tabular-nums">{timer}s</p>
        )}
      </div>

      <div className="card p-6 mt-8">
        <h2 className="text-sm font-semibold text-navy-800 mb-3">语音转文本</h2>
        <div className="min-h-[48px] text-lg text-slate-700">
          {transcription ? (
            <span>
              {transcription}
              {typing && <span className="animate-pulse">|</span>}
            </span>
          ) : recording ? (
            <span className="text-slate-400">
              正在聆听<span className="animate-pulse">...</span>
            </span>
          ) : (
            <span className="text-slate-400">点击麦克风开始语音输入...</span>
          )}
        </div>
      </div>

      {intent && (
        <div className="card p-6 mt-4 animate-slide-up">
          <h2 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-500" />
            意图识别
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1 mb-1.5">
                <Tag className="w-3 h-3" /> 类目匹配
              </span>
              <span className="badge badge-info">{intent.category}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1 mb-1.5">
                <MapPin className="w-3 h-3" /> 区域匹配
              </span>
              <span className="badge badge-success">{intent.region}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1 mb-1.5">
                <Search className="w-3 h-3" /> 关键词提取
              </span>
              <span className="badge badge-warning">{intent.keyword}</span>
            </div>
          </div>
        </div>
      )}

      {(intent || resultsLoading || results.length > 0) && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-navy-800 mb-4">
            搜索结果
            {!resultsLoading && <span className="ml-2 text-slate-400 font-normal">({results.length}条)</span>}
          </h2>
          {resultsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={<MessageCircleQuestion className="w-16 h-16 text-slate-300 mb-2" />}
              title="没有找到匹配的结果"
              description="尝试调整语音描述或使用文字搜索输入更精确的关键词"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {results.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && textInput.trim()) {
              navigate(`/list?q=${encodeURIComponent(textInput.trim())}`)
            }
          }}
          placeholder="手动输入搜索内容..."
          className="input pl-10 w-full"
        />
      </div>
    </div>
  )
}
