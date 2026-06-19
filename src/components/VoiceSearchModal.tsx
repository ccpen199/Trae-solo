import { useState, useEffect } from 'react'
import { Mic, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import { CATEGORIES } from '@/types'
import type { Post } from '@/types'
import PostCard from './PostCard'

const EXAMPLE_PHRASES = [
  '我想找北京朝阳区的两室一厅租房',
  '上海浦东的二手车信息',
  '广州天河区月薪8K以上的招聘',
]

const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    category: 'rent',
    title: '朝阳区两室一厅精装修 拎包入住',
    description: '',
    price: 5500,
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    authorId: '1',
    authorType: 'merchant',
    merchantVerified: true,
    status: 'approved',
    riskScore: 0,
    isTop: false,
    views: 128,
    leads: 12,
    conversions: 3,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'mock-2',
    category: 'vehicle',
    title: '浦东新区个人二手车 大众朗逸2022款',
    description: '',
    price: 89000,
    province: '上海市',
    city: '上海市',
    district: '浦东新区',
    authorId: '2',
    authorType: 'user',
    status: 'approved',
    riskScore: 5,
    isTop: false,
    views: 256,
    leads: 23,
    conversions: 5,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'mock-3',
    category: 'job',
    title: '天河区互联网公司招聘前端工程师 8K-15K',
    description: '',
    province: '广东省',
    city: '广州市',
    district: '天河区',
    authorId: '3',
    authorType: 'merchant',
    merchantVerified: true,
    status: 'approved',
    riskScore: 2,
    isTop: true,
    views: 512,
    leads: 45,
    conversions: 10,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
]

export default function VoiceSearchModal() {
  const { voiceSearchOpen, setVoiceSearchOpen } = useAppStore()
  const [recording, setRecording] = useState(false)
  const [transcribedText, setTranscribedText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [intentCategory, setIntentCategory] = useState('')
  const [intentRegion, setIntentRegion] = useState('')
  const [intentKeywords, setIntentKeywords] = useState('')

  useEffect(() => {
    if (!voiceSearchOpen) {
      setRecording(false)
      setTranscribedText('')
      setShowResults(false)
      return
    }
    setRecording(true)
    setShowResults(false)
    setTranscribedText('')
    const phrase = EXAMPLE_PHRASES[phraseIndex % EXAMPLE_PHRASES.length]

    const charTimer = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        setTranscribedText(phrase.slice(0, i + 1))
        i++
        if (i >= phrase.length) {
          clearInterval(interval)
          setRecording(false)
          const cat = CATEGORIES.find((c) =>
            phrase.includes(c.label.slice(0, 2))
          )
          setIntentCategory(cat?.label || '租房')
          setIntentRegion('北京市 朝阳区')
          setIntentKeywords('两室一厅')
          setTimeout(() => setShowResults(true), 500)
        }
      }, 80)
      return () => clearInterval(interval)
    }, 300)

    return () => clearTimeout(charTimer)
  }, [voiceSearchOpen, phraseIndex])

  if (!voiceSearchOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-navy-800">语音搜索</h3>
          <button
            onClick={() => setVoiceSearchOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-8 flex flex-col items-center">
          <div className="relative mb-6">
            <div
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center',
                recording ? 'bg-red-50' : 'bg-navy-50'
              )}
            >
              <Mic
                className={cn(
                  'w-8 h-8',
                  recording ? 'text-red-500' : 'text-navy-600'
                )}
              />
            </div>
            {recording && (
              <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-pulse-ring" />
            )}
          </div>

          {recording && (
            <div className="flex items-end gap-1 h-8 mb-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1.5 bg-navy-400 rounded-full animate-wave origin-bottom"
                  style={{ height: '16px', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}

          {transcribedText && (
            <div className="w-full text-center mb-4">
              <p className="text-lg text-navy-800 font-medium">{transcribedText}</p>
            </div>
          )}

          {showResults && (
            <div className="w-full animate-fade-in">
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {intentCategory && (
                  <span className="badge bg-blue-50 text-blue-700">{intentCategory}</span>
                )}
                {intentRegion && (
                  <span className="badge bg-emerald-50 text-emerald-700">{intentRegion}</span>
                )}
                {intentKeywords && (
                  <span className="badge bg-amber-50 text-amber-700">{intentKeywords}</span>
                )}
              </div>

              <div className="space-y-3">
                {MOCK_POSTS.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {recording && !transcribedText && (
            <p className="text-sm text-slate-400">正在聆听...</p>
          )}
        </div>
      </div>
    </div>
  )
}
