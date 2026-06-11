import { useState, useEffect } from 'react'
import { Upload, Camera, CheckCircle, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import { mockDiagnosisResult } from '@/mocks/data'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

type PageState = 'upload' | 'analyzing' | 'result'

const breakdown = [
  { label: '制冷剂不足', value: 92 },
  { label: '压缩机故障', value: 5 },
  { label: '其他', value: 3 },
]

const urgencyMap: Record<string, { label: string; cls: string }> = {
  low: { label: '低优先', cls: 'tag-cyber' },
  medium: { label: '中等', cls: 'tag-warm' },
  high: { label: '紧急', cls: 'bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-xs rounded' },
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 40
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(46,242,165,0.1)" strokeWidth="6" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="#2EF2A5" strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <span className="text-2xl font-bold text-cyber-400">{value}%</span>
    </div>
  )
}

export default function Diagnosis() {
  const [state, setState] = useState<PageState>('upload')
  const [progress, setProgress] = useState(0)
  const navigate = useNavigate()

  const handleUpload = () => {
    setState('analyzing')
    setProgress(0)
  }

  useEffect(() => {
    if (state !== 'analyzing') return
    const step = 100 / (3000 / 30)
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + step
        if (next >= 100) {
          clearInterval(timer)
          setTimeout(() => setState('result'), 300)
          return 100
        }
        return next
      })
    }, 30)
    return () => clearInterval(timer)
  }, [state])

  return (
    <div className="min-h-screen p-4 pb-8">
      <AnimatePresence mode="wait">
        {state === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center pt-20">
            <div onClick={handleUpload}
              className="w-full max-w-sm h-64 border-2 border-dashed border-cyber-400/30 rounded-2xl
                flex flex-col items-center justify-center gap-4 cursor-pointer
                hover:border-cyber-400/60 hover:bg-cyber-400/5 transition-all duration-300">
              <Upload className="w-12 h-12 text-cyber-400/60" />
              <p className="text-navy-100/70 text-sm">拖拽或点击上传故障照片</p>
            </div>
            <button onClick={handleUpload}
              className="mt-6 btn-secondary flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4" />
              拍照上传
            </button>
          </motion.div>
        )}

        {state === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center pt-16">
            <div className="relative w-full max-w-sm h-64 rounded-2xl overflow-hidden bg-navy-600/50 cyber-border">
              <div className="absolute inset-0 bg-gradient-to-b from-cyber-400/5 to-transparent" />
              <motion.div className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-cyber-400 to-transparent shadow-[0_0_15px_#2EF2A5]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
            </div>
            <p className="mt-6 text-cyber-400 font-medium animate-pulse">AI正在分析故障...</p>
            <div className="mt-4 w-full max-w-xs">
              <div className="flex justify-between text-xs text-navy-200/60 mb-1">
                <span>分析进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-cyber-400 to-cyber-300 rounded-full"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>
          </motion.div>
        )}

        {state === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            <div className="glass-card p-5 cyber-border">
              <div className="flex items-center justify-between mb-4">
                <span className="tag-cyber">{mockDiagnosisResult.categoryLabel}</span>
                <div className="flex items-center gap-3">
                  <ConfidenceRing value={mockDiagnosisResult.confidence} />
                </div>
              </div>
              <h2 className="text-xl font-bold text-navy-50 mb-2">{mockDiagnosisResult.faultType}</h2>
              <p className="text-sm text-navy-200/70 leading-relaxed">{mockDiagnosisResult.description}</p>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-navy-100 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warm-500" />
                置信度分析
              </h3>
              <div className="space-y-3">
                {breakdown.map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-navy-200/70">{item.label}</span>
                      <span className="text-cyber-400">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-navy-700/60 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.value > 50 ? 'bg-gradient-to-r from-cyber-400 to-cyber-300' : 'bg-navy-400/50'}`}
                        style={{ width: `${item.value}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-navy-100 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyber-400" />
                推荐服务
              </h3>
              <div className="space-y-3">
                {mockDiagnosisResult.recommendedServices.map(svc => (
                  <div key={svc.id} className="p-4 rounded-xl bg-navy-700/40 border border-cyber-400/10 hover:border-cyber-400/25 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-navy-50">{svc.name}</h4>
                      <span className={urgencyMap[svc.urgency].cls}>{urgencyMap[svc.urgency].label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-navy-200/60 mb-3">
                      <span className="flex items-center gap-1">
                        <span className="text-cyber-400">¥{svc.estimatedPrice.min}-{svc.estimatedPrice.max}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{svc.estimatedDuration}
                      </span>
                    </div>
                    <button onClick={() => navigate('/services')}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-1 ml-auto">
                      预约服务<ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
