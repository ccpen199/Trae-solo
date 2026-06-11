import { useState, useEffect, useRef } from 'react'
import { Video, Volume2, Maximize, Settings, Send, CheckCircle, Circle, Loader, MessageCircle } from 'lucide-react'
import { liveSteps, mockBarrageMessages } from '@/mocks/data'
import { motion, AnimatePresence } from 'framer-motion'

export default function Live() {
  const [chatMessages, setChatMessages] = useState<string[]>([])
  const [inputText, setInputText] = useState('')
  const [barrageIndex, setBarrageIndex] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setBarrageIndex(prev => {
        const next = prev + 1
        if (next <= mockBarrageMessages.length) {
          setChatMessages(msgs => [...msgs, mockBarrageMessages[prev]])
        }
        return next
      })
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = () => {
    if (!inputText.trim()) return
    setChatMessages(prev => [...prev, inputText.trim()])
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 grid-bg">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-3rem)]">
        <div className="lg:w-[65%] flex flex-col gap-4">
          <div className="glass-card relative flex-1 flex items-center justify-center min-h-[300px] overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span className="flex items-center gap-1.5 bg-red-600/90 px-3 py-1 rounded-full text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                直播中
              </span>
              <span className="tag-cyber">LIVE</span>
            </div>
            <div className="flex flex-col items-center gap-3 text-navy-200">
              <Video size={64} className="text-cyber-400/40" />
              <span className="text-lg font-medium">工程师直播检修中</span>
            </div>
            <div className="absolute inset-0 pointer-events-none animate-scan-line opacity-10">
              <div className="w-full h-px bg-cyber-400 shadow-[0_0_20px_#2EF2A5]" />
            </div>
          </div>

          <div className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-navy-100 hover:text-cyber-400 transition-colors text-sm">
                <Volume2 size={18} /> 音量
              </button>
              <button className="flex items-center gap-1.5 text-navy-100 hover:text-cyber-400 transition-colors text-sm">
                <Settings size={18} /> 画质
              </button>
              <button className="flex items-center gap-1.5 text-navy-100 hover:text-cyber-400 transition-colors text-sm">
                <Maximize size={18} /> 全屏
              </button>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-navy-200">工程师:</span>
              <span className="text-cyber-400 font-medium">张明辉</span>
              <span className="text-navy-300">|</span>
              <span className="text-navy-200">服务:</span>
              <span className="tag-cyber">热水器漏水维修</span>
            </div>
          </div>
        </div>

        <div className="lg:w-[35%] flex flex-col gap-4 min-h-0">
          <div className="glass-card p-4">
            <h3 className="text-cyber-400 font-semibold mb-4 flex items-center gap-2">
              <Loader size={16} /> 服务步骤
            </h3>
            <div className="space-y-0">
              {liveSteps.map((step, i) => (
                <motion.div
                  key={step.index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    {step.status === 'done' ? (
                      <CheckCircle size={22} className="text-cyber-400 shrink-0" />
                    ) : step.status === 'doing' ? (
                      <div className="relative shrink-0">
                        <Circle size={22} className="text-cyber-400 animate-pulse" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-cyber-400 animate-ping" />
                        </span>
                      </div>
                    ) : (
                      <Circle size={22} className="text-navy-300 shrink-0" />
                    )}
                    {i < liveSteps.length - 1 && (
                      <div className={`w-px h-8 mt-1 ${step.status === 'done' ? 'bg-cyber-400/60' : 'bg-navy-300/30'}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${step.status === 'pending' ? 'text-navy-300' : 'text-navy-50'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-navy-200 mt-0.5">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden">
            <h3 className="text-cyber-400 font-semibold p-4 pb-2 flex items-center gap-2 shrink-0">
              <MessageCircle size={16} /> 实时互动
            </h3>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-0">
              <AnimatePresence>
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-navy-100 bg-navy-600/40 rounded-lg px-3 py-1.5"
                  >
                    {msg}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-cyber-400/10 flex gap-2 shrink-0">
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="发送互动消息..."
                className="flex-1 bg-navy-700/50 border border-cyber-400/20 rounded-lg px-3 py-2 text-sm text-navy-50 placeholder-navy-300 focus:outline-none focus:border-cyber-400/50 transition-colors"
              />
              <button
                onClick={handleSend}
                className="btn-primary px-3 py-2 flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
