import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  ChevronRight,
  MapPin,
  User,
  Phone,
  Package,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Volume2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'

const voiceHistoryData = [
  { id: 1, text: '帮我寄一个快递，从北京市朝阳区寄到上海市浦东新区，收件人李四，电话13900139001，物品是普通文件，重量1公斤', time: '2024-05-20 15:30:25', status: 'success' },
  { id: 2, text: '我要发一个电子产品，从广州天河到深圳南山，收件人赵六，手机号13900139002，走航空快递', time: '2024-05-19 11:20:15', status: 'success' },
  { id: 3, text: '寄件人张三，电话13800138001...', time: '2024-05-18 09:15:33', status: 'failed' },
]

const goodsTypes = [
  { value: '普通物品', label: '普通物品' },
  { value: '电子产品', label: '电子产品' },
  { value: '服装', label: '服装' },
  { value: '文件', label: '文件' },
  { value: '易碎品', label: '易碎品' },
  { value: '食品', label: '食品' },
  { value: '其他', label: '其他' },
]

const VoiceOrder: React.FC = () => {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [recognizedText, setRecognizedText] = useState('')
  const [editingText, setEditingText] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<any>(null)
  const [showHistory, setShowHistory] = useState(false)

  const steps = ['语音录制', '识别确认', '提交订单']
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      waveformIntervalRef.current = setInterval(() => {
        setWaveformData(prev => {
          const newData = [...prev, Math.random() * 0.8 + 0.2]
          return newData.length > 50 ? newData.slice(-50) : newData
        })
      }, 100)
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current)
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current)
    }
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    setWaveformData([])
    setRecognizedText('')
    setExtractedInfo(null)
  }

  const stopRecording = () => {
    setIsRecording(false)
    setLoading(true)
    setTimeout(() => {
      const mockText = '帮我寄一个快递，寄件人张三，电话13800138001，地址是北京市朝阳区xxx路123号。收件人李四，电话13900139001，地址是上海市浦东新区xxx路456号。物品是普通文件，重量1公斤，走标准快递就可以了。'
      setRecognizedText(mockText)
      setExtractedInfo({
        sender_name: '张三',
        sender_phone: '13800138001',
        sender_address: '北京市朝阳区xxx路123号',
        receiver_name: '李四',
        receiver_phone: '13900139001',
        receiver_address: '上海市浦东新区xxx路456号',
        goods_type: '文件',
        weight: 1,
        urgency: 'standard',
        confidence: 0.95,
      })
      setLoading(false)
      addNotification({ type: 'success', message: '语音识别完成！' })
    }, 2000)
  }

  const handleTextEdit = () => {
    setEditingText(true)
  }

  const handleTextSave = () => {
    setEditingText(false)
    setLoading(true)
    setTimeout(() => {
      setExtractedInfo({
        sender_name: '张三',
        sender_phone: '13800138001',
        sender_address: '北京市朝阳区xxx路123号',
        receiver_name: '李四',
        receiver_phone: '13900139001',
        receiver_address: '上海市浦东新区xxx路456号',
        goods_type: '文件',
        weight: 1,
        urgency: 'standard',
        confidence: 0.95,
      })
      setLoading(false)
      addNotification({ type: 'success', message: '信息重新提取完成！' })
    }, 1000)
  }

  const handleInputChange = (field: string, value: any) => {
    setExtractedInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleReExtract = () => {
    if (!recognizedText.trim()) {
      addNotification({ type: 'error', message: '请先录制或输入语音文本' })
      return
    }
    setLoading(true)
    setTimeout(() => {
      setExtractedInfo({
        sender_name: '张三',
        sender_phone: '13800138001',
        sender_address: '北京市朝阳区xxx路123号',
        receiver_name: '李四',
        receiver_phone: '13900139001',
        receiver_address: '上海市浦东新区xxx路456号',
        goods_type: '文件',
        weight: 1,
        urgency: 'standard',
        confidence: 0.95,
      })
      setLoading(false)
      addNotification({ type: 'success', message: '智能提取完成！' })
    }, 1000)
  }

  const handleHistorySelect = (item: any) => {
    if (item.status === 'success') {
      setRecognizedText(item.text)
      setShowHistory(false)
      addNotification({ type: 'success', message: '已加载历史记录' })
    }
  }

  const handleNext = () => {
    if (currentStep === 0) {
      if (!recognizedText) {
        addNotification({ type: 'error', message: '请先完成语音录制' })
        return
      }
      if (!extractedInfo) {
        addNotification({ type: 'error', message: '请等待语音识别完成' })
        return
      }
    }
    setCurrentStep(prev => prev + 1)
  }

  const handleSubmit = async () => {
    if (!recognizedText) {
      addNotification({ type: 'error', message: '请先完成语音录制' })
      return
    }
    setSubmitting(true)
    try {
      const result = await api.orders.voice(recognizedText, 1)
      if (result.success) {
        addNotification({ type: 'success', message: '语音转单成功！' })
        setTimeout(() => navigate('/track'), 1500)
      }
    } catch (error) {
      addNotification({ type: 'error', message: '提交失败，请重试' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-sf-light">语音转单</h1>
        <p className="text-sf-light/50 text-sm mt-1">电话语音录入，智能识别寄件信息，一键转单</p>
      </div>

      <div className="flex items-center justify-center mb-10">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-display transition-all ${
                  index < currentStep
                    ? 'bg-sf-green text-white'
                    : index === currentStep
                    ? 'bg-sf-red text-white'
                    : 'bg-sf-dark text-sf-light/50 border border-sf-blue/30'
                }`}
              >
                {index < currentStep ? <Check size={18} /> : index + 1}
              </div>
              <span
                className={`text-sm ${
                  index <= currentStep ? 'text-sf-light' : 'text-sf-light/50'
                }`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-20 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-sf-green' : 'bg-sf-dark'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="glass rounded-2xl p-8 border border-sf-blue/30">
        {currentStep === 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="relative inline-block">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-sf-red animate-pulse shadow-lg shadow-sf-red/50'
                      : 'bg-sf-dark border-2 border-sf-blue/30 hover:border-sf-red/50'
                  }`}
                >
                  {isRecording ? (
                    <Square size={48} className="text-white" />
                  ) : (
                    <Mic size={48} className="text-sf-light" />
                  )}
                </button>
                {isRecording && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-sf-red rounded-full flex items-center justify-center animate-ping" />
                )}
              </div>
              <div className="mt-6">
                <div className="text-3xl font-display text-sf-light">{formatTime(recordingTime)}</div>
                <p className="text-sf-light/50 text-sm mt-2">
                  {isRecording ? '正在录音，请说出您的寄件需求...' : recognizedText ? '录音完成，点击重新录制' : '点击麦克风开始录制'}
                </p>
              </div>
            </div>

            {isRecording && (
              <div className="flex items-end justify-center gap-1 h-24 px-4">
                {waveformData.map((height, index) => (
                  <div
                    key={index}
                    className="w-2 bg-gradient-to-t from-sf-blue to-sf-red rounded-full transition-all duration-100"
                    style={{ height: `${height * 100}%` }}
                  />
                ))}
                {Array.from({ length: Math.max(0, 50 - waveformData.length) }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="w-2 bg-sf-dark rounded-full"
                    style={{ height: '4px' }}
                  />
                ))}
              </div>
            )}

            {!isRecording && recognizedText && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 px-6 h-10 bg-sf-blue text-white rounded-lg hover:bg-sf-blue/90 transition-colors"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  {isPlaying ? '暂停播放' : '播放录音'}
                </button>
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-6 h-10 border border-sf-blue/30 rounded-lg text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
                >
                  <RotateCcw size={18} />
                  重新录制
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-6 h-10 border border-sf-blue/30 rounded-lg text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
                >
                  <Clock size={18} />
                  历史记录
                </button>
              </div>
            )}

            {loading && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 size={24} className="animate-spin text-sf-blue" />
                  <span className="text-sf-light">正在进行语音识别...</span>
                </div>
              </div>
            )}

            {showHistory && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sf-light font-medium">语音历史记录</h4>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-sf-light/50 hover:text-sf-light transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-3">
                  {voiceHistoryData.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleHistorySelect(item)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        item.status === 'success'
                          ? 'border-sf-blue/20 hover:border-sf-blue/40 hover:bg-sf-dark/30'
                          : 'border-sf-red/20 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sf-light text-sm line-clamp-2">{item.text}</p>
                          <p className="text-sf-light/50 text-xs mt-2">{item.time}</p>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          item.status === 'success' ? 'bg-sf-green/10 text-sf-green' : 'bg-sf-red/10 text-sf-red'
                        }`}>
                          {item.status === 'success' ? '成功' : '失败'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recognizedText && !loading && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-sf-yellow" />
                    <h4 className="text-sf-light font-medium">识别结果</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingText ? (
                      <>
                        <button
                          onClick={handleTextSave}
                          className="flex items-center gap-1 px-3 h-8 bg-sf-green text-white text-sm rounded-lg hover:bg-sf-green/90 transition-colors"
                        >
                          <Check size={14} />
                          保存
                        </button>
                        <button
                          onClick={() => setEditingText(false)}
                          className="flex items-center gap-1 px-3 h-8 border border-sf-red/30 text-sf-red text-sm rounded-lg hover:bg-sf-red/10 transition-colors"
                        >
                          <X size={14} />
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleTextEdit}
                        className="flex items-center gap-1 px-3 h-8 border border-sf-blue/30 text-sf-light/70 text-sm rounded-lg hover:border-sf-blue/50 transition-colors"
                      >
                        <Edit3 size={14} />
                        编辑
                      </button>
                    )}
                  </div>
                </div>
                {editingText ? (
                  <textarea
                    value={recognizedText}
                    onChange={(e) => setRecognizedText(e.target.value)}
                    className="w-full h-32 px-4 py-3 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors text-sm"
                  />
                ) : (
                  <p className="text-sf-light/80 text-sm leading-relaxed">{recognizedText}</p>
                )}
              </div>
            )}

            {extractedInfo && !loading && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-green/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-sf-green" />
                    <h4 className="text-sf-light font-medium">智能提取信息</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-sf-light/50">置信度: {(extractedInfo.confidence * 100).toFixed(0)}%</span>
                    <button
                      onClick={handleReExtract}
                      className="flex items-center gap-1 px-3 h-8 border border-sf-blue/30 text-sf-light/70 text-sm rounded-lg hover:border-sf-blue/50 transition-colors"
                    >
                      <RotateCcw size={14} />
                      重新提取
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-sf-red" />
                    <span className="text-sf-light/50">寄件人:</span>
                    <span className="text-sf-light">{extractedInfo.sender_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-sf-red" />
                    <span className="text-sf-light/50">电话:</span>
                    <span className="text-sf-light">{extractedInfo.sender_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin size={14} className="text-sf-red" />
                    <span className="text-sf-light/50">寄件地址:</span>
                    <span className="text-sf-light">{extractedInfo.sender_address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-sf-blue" />
                    <span className="text-sf-light/50">收件人:</span>
                    <span className="text-sf-light">{extractedInfo.receiver_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-sf-blue" />
                    <span className="text-sf-light/50">电话:</span>
                    <span className="text-sf-light">{extractedInfo.receiver_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin size={14} className="text-sf-blue" />
                    <span className="text-sf-light/50">收件地址:</span>
                    <span className="text-sf-light">{extractedInfo.receiver_address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-sf-yellow" />
                    <span className="text-sf-light/50">物品:</span>
                    <span className="text-sf-light">{extractedInfo.goods_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 size={14} className="text-sf-yellow" />
                    <span className="text-sf-light/50">重量:</span>
                    <span className="text-sf-light">{extractedInfo.weight} kg</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User size={18} className="text-sf-red" />
                <h3 className="text-lg font-display text-sf-light">寄件人信息</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">姓名</label>
                  <input
                    type="text"
                    value={extractedInfo?.sender_name || ''}
                    onChange={(e) => handleInputChange('sender_name', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">手机号</label>
                  <input
                    type="tel"
                    value={extractedInfo?.sender_phone || ''}
                    onChange={(e) => handleInputChange('sender_phone', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-sf-light/70 mb-2">详细地址</label>
                  <input
                    type="text"
                    value={extractedInfo?.sender_address || ''}
                    onChange={(e) => handleInputChange('sender_address', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-sf-blue/20" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-sf-blue" />
                <h3 className="text-lg font-display text-sf-light">收件人信息</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">姓名</label>
                  <input
                    type="text"
                    value={extractedInfo?.receiver_name || ''}
                    onChange={(e) => handleInputChange('receiver_name', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">手机号</label>
                  <input
                    type="tel"
                    value={extractedInfo?.receiver_phone || ''}
                    onChange={(e) => handleInputChange('receiver_phone', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-sf-light/70 mb-2">详细地址</label>
                  <input
                    type="text"
                    value={extractedInfo?.receiver_address || ''}
                    onChange={(e) => handleInputChange('receiver_address', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-sf-blue/20" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} className="text-sf-yellow" />
                <h3 className="text-lg font-display text-sf-light">物品信息</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">物品类型</label>
                  <select
                    value={extractedInfo?.goods_type || '普通物品'}
                    onChange={(e) => handleInputChange('goods_type', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                  >
                    {goodsTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">重量 (kg)</label>
                  <input
                    type="number"
                    value={extractedInfo?.weight || 1}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 1)}
                    min="0.1"
                    step="0.1"
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">时效要求</label>
                  <select
                    value={extractedInfo?.urgency || 'standard'}
                    onChange={(e) => handleInputChange('urgency', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                  >
                    <option value="standard">标准快递</option>
                    <option value="express">航空快递</option>
                    <option value="urgent">特快专递</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-sf-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic size={40} className="text-sf-yellow" />
              </div>
              <h3 className="text-xl font-display text-sf-light">确认语音订单</h3>
              <p className="text-sf-light/50 text-sm mt-1">请核对以下转单信息</p>
            </div>

            <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
              <h4 className="text-sf-light/70 text-sm mb-3">语音原文</h4>
              <p className="text-sf-light text-sm leading-relaxed">{recognizedText}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-sf-dark/50 rounded-xl">
                <h4 className="text-sf-light/70 text-sm mb-4">寄件人</h4>
                <div className="space-y-2 text-sf-light">
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">姓名</span>
                    <span>{extractedInfo?.sender_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">手机</span>
                    <span>{extractedInfo?.sender_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">地址</span>
                    <span>{extractedInfo?.sender_address}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-sf-dark/50 rounded-xl">
                <h4 className="text-sf-light/70 text-sm mb-4">收件人</h4>
                <div className="space-y-2 text-sf-light">
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">姓名</span>
                    <span>{extractedInfo?.receiver_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">手机</span>
                    <span>{extractedInfo?.receiver_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">地址</span>
                    <span>{extractedInfo?.receiver_address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-sf-dark/50 rounded-xl">
              <div className="grid grid-cols-4 gap-4 text-sf-light">
                <div>
                  <div className="text-sf-light/50 text-sm">物品类型</div>
                  <div className="mt-1">{extractedInfo?.goods_type}</div>
                </div>
                <div>
                  <div className="text-sf-light/50 text-sm">重量</div>
                  <div className="mt-1">{extractedInfo?.weight} kg</div>
                </div>
                <div>
                  <div className="text-sf-light/50 text-sm">时效</div>
                  <div className="mt-1">
                    {extractedInfo?.urgency === 'standard' ? '标准快递' : extractedInfo?.urgency === 'express' ? '航空快递' : '特快专递'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sf-light/50 text-sm">预估运费</div>
                  <div className="mt-1 text-2xl font-display text-sf-red">
                    ¥{((extractedInfo?.weight || 1) * 15).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-10 pt-6 border-t border-sf-blue/20">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0 || submitting}
            className="px-6 h-11 rounded-lg border border-sf-blue/30 text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一步
          </button>
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors"
            >
              下一步
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  提交中...
                </>
              ) : (
                '确认转单'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default VoiceOrder
