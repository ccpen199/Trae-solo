import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Mic, Check, ArrowRight, MessageSquare, ChevronRight } from 'lucide-react'
import { mockServices } from '@/data/mockData'
import { useStore } from '@/store/useStore'
import type { ServiceItem, ServiceStep } from '@/types'

const keywordMap: { keywords: string[]; serviceName: string }[] = [
  { keywords: ['公积金'], serviceName: '公积金提取' },
  { keywords: ['社保'], serviceName: '社保查询' },
  { keywords: ['户籍'], serviceName: '户籍登记' },
  { keywords: ['挂号', '医院'], serviceName: '社保查询' },
]

function findService(input: string): ServiceItem | null {
  for (const { keywords, serviceName } of keywordMap) {
    if (keywords.some((k) => input.includes(k))) {
      return mockServices.find((s) => s.name === serviceName) ?? null
    }
  }
  return null
}

function buildResponse(service: ServiceItem | null, _input: string): string {
  if (service) {
    return `为您找到「${service.name}」服务。\n\n${service.description}\n\n办理流程共${service.steps.length}个步骤，已在右侧为您展示。请问还有什么需要帮助的吗？`
  }
  return `您好！我暂时没有识别到具体业务，您可以尝试输入"公积金提取"、"社保查询"、"户籍登记"等关键词，我将为您提供详细的办理指引。`
}

export default function SmartGuide() {
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [identifiedService, setIdentifiedService] = useState<ServiceItem | null>(null)
  const [currentFlowStep, setCurrentFlowStep] = useState(1)
  const [showFlow, setShowFlow] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { chatMessages, addChatMessage } = useStore()

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = () => {
    const text = inputText.trim()
    if (!text || isTyping) return
    setInputText('')

    addChatMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleString('zh-CN'),
    })

    setIsTyping(true)
    setTimeout(() => {
      const service = findService(text)
      const content = buildResponse(service, text)
      const steps = service?.steps

      addChatMessage({
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content,
        timestamp: new Date().toLocaleString('zh-CN'),
        relatedService: service?.name,
        flowSteps: steps,
      })

      if (service) {
        setIdentifiedService(service)
        setCurrentFlowStep(1)
        setShowFlow(true)
      }
      setIsTyping(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="section-title">智能导办</h1>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[500px]">
          <div className="flex-1 lg:max-w-[60%] flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-700">智能对话</span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hide">
              {chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line
                    ${msg.role === 'user' ? 'bg-sky text-white rounded-br-sm' : 'bg-gray-100 text-gray-700 rounded-bl-sm'}`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-gray-400 animate-breathe">正在输入...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="请描述您想办理的业务..."
                className="input-field flex-1"
              />
              <button className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isTyping}
                className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:w-[40%] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <button
              onClick={() => setShowFlow(!showFlow)}
              className="lg:hidden w-full px-5 py-3 border-b border-gray-100 flex items-center justify-between text-sm font-medium text-gray-700"
            >
              <span className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-gold-400" />办理流程</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showFlow ? 'rotate-90' : ''}`} />
            </button>

            <div className="hidden lg:block px-5 py-3 border-b border-gray-100">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ArrowRight className="w-4 h-4 text-gold-400" />办理流程
              </span>
            </div>

            <AnimatePresence>
              {(showFlow || window.innerWidth >= 1024) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide"
                >
                  {identifiedService ? (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">{identifiedService.name}</h3>
                      <p className="text-xs text-gray-400 mb-4">{identifiedService.description}</p>
                      <div className="space-y-0">
                        {identifiedService.steps.map((step: ServiceStep, idx: number) => {
                          const isCompleted = step.order < currentFlowStep
                          const isCurrent = step.order === currentFlowStep
                          return (
                            <motion.div
                              key={step.order}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                                    ${isCompleted ? 'bg-success text-white' : isCurrent ? 'gradient-gold text-primary-900 ring-2 ring-gold-200' : 'bg-gray-100 text-gray-400'}`}>
                                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.order}
                                  </div>
                                  {idx < identifiedService.steps.length - 1 && (
                                    <div className={`w-0.5 h-8 ${isCompleted ? 'bg-success' : 'bg-gray-200'}`} />
                                  )}
                                </div>
                                <div className="pb-6 min-w-0">
                                  <p className={`text-sm font-medium ${isCurrent ? 'text-gold-500' : isCompleted ? 'text-success' : 'text-gray-500'}`}>{step.title}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                                  {isCurrent && (
                                    <button onClick={() => setCurrentFlowStep((s) => s + 1)} className="mt-2 text-xs text-gold-500 font-medium hover:text-gold-600 transition-colors flex items-center gap-1">
                                      下一步 <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm py-16">
                      <MessageSquare className="w-10 h-10 mb-3 text-gray-300" />
                      <p>请描述您想办理的业务...</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
