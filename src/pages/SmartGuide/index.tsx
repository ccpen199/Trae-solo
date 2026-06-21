import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Mic, Check, ChevronDown, ChevronRight, Clock, FileCheck, Upload, AlertCircle, Loader2, ArrowRight, Lightbulb, BookOpen } from 'lucide-react'
import { mockServices } from '@/data/mockData'
import { useStore } from '@/store/useStore'
import type { ServiceItem, ServiceStep } from '@/types'

interface UploadedMaterial { name: string; status: 'uploading' | 'reviewing' | 'passed' | 'failed'; progress: number; feedback?: string }

const keywordMap = [
  { keywords: ['社保', '保险'], serviceName: '社保查询' },
  { keywords: ['公积金', '住房'], serviceName: '公积金提取' },
  { keywords: ['户籍', '户口', '落户'], serviceName: '户籍登记' },
  { keywords: ['挂号', '医院', '看病'], serviceName: '医院挂号' },
  { keywords: ['景点', '旅游', '玩'], serviceName: '景点预约' },
  { keywords: ['公交', '地铁', '乘车', '出行'], serviceName: '扫码乘车' },
]

function findService(input: string): ServiceItem | null {
  for (const { keywords, serviceName } of keywordMap) {
    if (keywords.some((k) => input.includes(k))) return mockServices.find((s) => s.name === serviceName) ?? null
  }
  return null
}

export default function SmartGuide() {
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [currentFlowStep, setCurrentFlowStep] = useState(1)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [uploadedMaterials, setUploadedMaterials] = useState<UploadedMaterial[]>([])
  const [activeTab, setActiveTab] = useState<'chat' | 'flow'>('chat')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { chatMessages, addChatMessage } = useStore()

  const selectedService = mockServices.find((s) => s.id === selectedServiceId) || null

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, isTyping])
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px' } }, [inputText])

  const initMaterials = (service: ServiceItem) => {
    const mats = [...new Set(service.steps.flatMap((s) => s.requiredMaterials))]
    setUploadedMaterials(mats.map((m) => ({ name: m, status: 'uploading', progress: 0 })))
  }

  const sendMessage = (text: string, svc?: ServiceItem | null) => {
    addChatMessage({ id: `msg-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toLocaleString('zh-CN') })
    setIsTyping(true)
    setTimeout(() => {
      const service = svc || findService(text)
      if (service) {
        const content = `为您找到「${service.name}」服务。\n\n${service.description}\n\n办理流程共${service.steps.length}个步骤，预计${service.avgProcessingDays}个工作日办结。`
        addChatMessage({ id: `msg-${Date.now()}-ai`, role: 'assistant', content, timestamp: new Date().toLocaleString('zh-CN'), relatedService: service.name, flowSteps: service.steps })
        setSelectedServiceId(service.id); setCurrentFlowStep(1); setExpandedStep(1); initMaterials(service)
      } else {
        addChatMessage({ id: `msg-${Date.now()}-ai`, role: 'assistant', content: '我可以帮您办理政务服务，请告诉我您的需求。例如：\n• "我想查社保"\n• "公积金怎么提取"\n• "户口迁移怎么办"', timestamp: new Date().toLocaleString('zh-CN') })
      }
      setIsTyping(false)
    }, 1000)
  }

  const handleSend = () => { const text = inputText.trim(); if (!text || isTyping) return; setInputText(''); sendMessage(text) }
  const handleViewFlow = (service: ServiceItem) => { setSelectedServiceId(service.id); setCurrentFlowStep(1); setExpandedStep(1); initMaterials(service); if (window.innerWidth < 1024) setActiveTab('flow') }

  const handleUpload = (materialName: string) => {
    setUploadedMaterials((prev) => prev.map((m) => (m.name === materialName ? { ...m, status: 'uploading', progress: 0 } : m)))
    const interval = setInterval(() => {
      setUploadedMaterials((prev) => prev.map((m) => {
        if (m.name === materialName && m.status === 'uploading') {
          const p = Math.min(m.progress + 20, 100)
          if (p >= 100) { clearInterval(interval); setTimeout(() => simulateReview(materialName), 500); return { ...m, progress: 100, status: 'reviewing' } }
          return { ...m, progress: p }
        }
        return m
      }))
    }, 200)
  }

  const simulateReview = (materialName: string) => {
    setTimeout(() => {
      const passed = Math.random() > 0.3
      setUploadedMaterials((prev) => prev.map((m) => m.name === materialName ? { ...m, status: passed ? 'passed' : 'failed', feedback: passed ? '材料预审通过，信息完整有效' : '材料需补正：请确保图片清晰可见，信息完整' } : m))
    }, 1500)
  }

  const allRequiredMaterials = selectedService ? [...new Set(selectedService.steps.flatMap((s) => s.requiredMaterials))] : []
  const statusColors: Record<string, string> = { passed: 'bg-success/10 text-success', failed: 'bg-error/10 text-error', reviewing: 'bg-gold-400/10 text-gold-500', uploading: 'bg-gray-100 text-gray-500' }
  const statusText: Record<string, string> = { passed: '预审通过', failed: '需补正', reviewing: 'AI审核中', uploading: '待上传' }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <h1 className="section-title mb-6">智能导办</h1>
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[550px]">
          <div className={`flex-1 ${selectedService ? 'lg:max-w-[60%]' : 'lg:max-w-full'} flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}>
            <div className="lg:hidden flex border-b border-gray-100">
              {(['chat', 'flow'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-500'}`}>
                  {tab === 'chat' ? '智能对话' : '办事流程'}
                </button>
              ))}
            </div>
            <div className="hidden lg:flex px-5 py-3 border-b border-gray-100 items-center gap-2">
              <Bot className="w-4 h-4 text-primary-500" /><span className="text-sm font-medium text-gray-700">智能对话</span>
            </div>
            <AnimatePresence mode="wait">
              {(activeTab === 'chat' || window.innerWidth >= 1024) && (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hide">
                    {chatMessages.map((msg, idx) => (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.02 }} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-white" /></div>}
                        <div className="max-w-[75%] flex flex-col gap-2">
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user' ? 'bg-gradient-to-r from-blue-500 to-primary-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-700 rounded-bl-sm'}`}>{msg.content}</div>
                          {msg.relatedService && msg.role === 'assistant' && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-800 text-sm">{msg.relatedService}</span>
                                <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">在线办理</span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => { const svc = mockServices.find((s) => s.name === msg.relatedService); if (svc) handleViewFlow(svc) }} className="flex-1 text-xs py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                                  <BookOpen className="w-3 h-3" />查看办事流程
                                </button>
                                <button className="flex-1 text-xs py-2 bg-gradient-to-r from-gold-400 to-gold-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                                  <ArrowRight className="w-3 h-3" />立即办理
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        {msg.role === 'user' && <div className="w-8 h-8 flex-shrink-0" />}
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-white" /></div>
                        <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <div className="flex items-end gap-2">
                      <textarea ref={textareaRef} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="请描述您想办理的业务..." rows={1} className="input-field flex-1 resize-none py-2.5" />
                      <button className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"><Mic className="w-4 h-4" /></button>
                      <button onClick={handleSend} disabled={!inputText.trim() || isTyping} className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-primary-500 flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedService && (
            <div className="lg:w-[40%] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="hidden lg:block px-5 py-3 border-b border-gray-100">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700"><ArrowRight className="w-4 h-4 text-gold-400" />办事流程 & 材料预审</span>
              </div>
              <AnimatePresence mode="wait">
                {(activeTab === 'flow' || window.innerWidth >= 1024) && (
                  <motion.div key="flow" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide">
                    <div className="mb-6"><h3 className="font-semibold text-gray-800 mb-1">{selectedService.name}</h3><p className="text-xs text-gray-400">预计 {selectedService.avgProcessingDays} 个工作日办结</p></div>
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-gold-400" />办事流程图</h4>
                      <div className="space-y-0">
                        {selectedService.steps.map((step: ServiceStep, idx: number) => {
                          const isCompleted = step.order < currentFlowStep, isCurrent = step.order === currentFlowStep, isExpanded = expandedStep === step.order
                          return (
                            <motion.div key={step.order} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  <button onClick={() => setExpandedStep(isExpanded ? null : step.order)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${isCompleted ? 'bg-success text-white' : isCurrent ? 'bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900 ring-2 ring-gold-200' : 'bg-gray-100 text-gray-400'}`}>
                                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.order}
                                  </button>
                                  {idx < selectedService.steps.length - 1 && <div className={`w-0.5 h-8 ${isCompleted ? 'bg-success' : 'bg-gray-200'}`} />}
                                </div>
                                <div className="pb-6 min-w-0 flex-1">
                                  <button onClick={() => setExpandedStep(isExpanded ? null : step.order)} className="w-full text-left flex items-center justify-between">
                                    <p className={`text-sm font-medium ${isCurrent ? 'text-gold-500' : isCompleted ? 'text-success' : 'text-gray-500'}`}>{step.title}</p>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                        <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                          {step.estimatedDays > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{step.estimatedDays}天</span>}
                                          {step.requiredMaterials.length > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><FileCheck className="w-3 h-3" />{step.requiredMaterials.length}份材料</span>}
                                        </div>
                                        {step.requiredMaterials.length > 0 && <div className="mt-2 space-y-1">{step.requiredMaterials.map((mat) => <div key={mat} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">• {mat}</div>)}</div>}
                                        {isCurrent && step.order < selectedService.steps.length && <button onClick={() => setCurrentFlowStep((s) => Math.min(s + 1, selectedService.steps.length))} className="mt-2 text-xs text-gold-500 font-medium hover:text-gold-600 transition-colors flex items-center gap-1">下一步 <ChevronRight className="w-3 h-3" /></button>}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary-500" />材料预审</h4>
                      {allRequiredMaterials.length > 0 ? (
                        <div className="space-y-3">
                          {uploadedMaterials.map((mat, idx) => (
                            <motion.div key={mat.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-700">{mat.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[mat.status]}`}>{statusText[mat.status]}</span>
                              </div>
                              {mat.status === 'uploading' && <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${mat.progress}%` }} className="h-full bg-primary-500 rounded-full" /></div>}
                              {mat.status === 'reviewing' && <div className="flex items-center gap-2 text-xs text-gold-500"><Loader2 className="w-3 h-3 animate-spin" />AI智能审核中...</div>}
                              {mat.feedback && <div className={`text-xs mt-1 flex items-start gap-1 ${mat.status === 'passed' ? 'text-success' : 'text-error'}`}>{mat.status === 'passed' ? <Check className="w-3 h-3 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />}{mat.feedback}</div>}
                              {(mat.status === 'failed' || mat.progress === 0) && <button onClick={() => handleUpload(mat.name)} disabled={mat.status === 'uploading' || mat.status === 'reviewing'} className="mt-2 w-full text-xs py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-300 hover:text-primary-500 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"><Upload className="w-3 h-3" />{mat.status === 'failed' ? '重新上传' : '上传材料'}</button>}
                            </motion.div>
                          ))}
                        </div>
                      ) : <div className="text-center py-6 text-gray-400 text-sm"><Check className="w-8 h-8 mx-auto mb-2 text-success" /><p>无需上传材料</p></div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!selectedService && (
            <div className="hidden lg:flex lg:w-[40%] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-col items-center justify-center p-8 text-center">
              <Lightbulb className="w-12 h-12 text-gold-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">智能导办助手</h3>
              <p className="text-sm text-gray-400 mb-6">描述您想办理的业务，我将为您智能推荐服务，并展示详细的办事流程和所需材料。</p>
              <div className="space-y-2 w-full max-w-xs">
                {['社保查询', '公积金提取', '户籍登记', '医院挂号'].map((item) => (
                  <button key={item} onClick={() => sendMessage(`我想办理${item}`, mockServices.find((s) => s.name === item))} className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gold-400" />{item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
