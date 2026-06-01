import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  QrCode,
  Camera,
  History,
  MapPin,
  Phone,
  User,
  Package,
  Send,
  Check,
  Loader2,
  RefreshCw,
  Zap,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'

const scanHistoryData = [
  { id: 1, qrCode: 'SF202405200001', time: '2024-05-20 14:30:25', address: '北京市朝阳区xxx路123号', status: 'success' },
  { id: 2, qrCode: 'SF202405190002', time: '2024-05-19 10:15:33', address: '上海市浦东新区xxx路456号', status: 'success' },
  { id: 3, qrCode: 'SF202405180003', time: '2024-05-18 16:45:12', address: '广州市天河区xxx路789号', status: 'failed' },
]

const goodsTypes = [
  { value: '普通物品', label: '普通物品' },
  { value: '电子产品', label: '电子产品' },
  { value: '服装', label: '服装' },
  { value: '文件', label: '文件' },
  { value: '其他', label: '其他' },
]

const ScanOrder: React.FC = () => {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [scanResult, setScanResult] = useState<any>(null)
  const [qrCodeValue, setQrCodeValue] = useState('')
  const [formData, setFormData] = useState({
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    goods_type: '普通物品',
    weight: 1,
    urgency: 'standard' as 'standard' | 'express' | 'urgent',
  })

  const steps = ['扫码获取', '信息确认', '提交订单']

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const startScanning = () => {
    setScanning(true)
    setScanProgress(0)
    setScanResult(null)
  }

  const stopScanning = () => {
    setScanning(false)
  }

  useEffect(() => {
    if (scanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setScanning(false)
            const mockResult = {
              qrCode: `SF${Date.now()}`,
              sender_name: '张三',
              sender_phone: '13800138001',
              sender_address: '北京市朝阳区xxx路123号',
              receiver_name: '李四',
              receiver_phone: '13900139001',
              receiver_address: '上海市浦东新区xxx路456号',
            }
            setScanResult(mockResult)
            setQrCodeValue(mockResult.qrCode)
            setFormData(prev => ({
              ...prev,
              sender_name: mockResult.sender_name,
              sender_phone: mockResult.sender_phone,
              sender_address: mockResult.sender_address,
              receiver_name: mockResult.receiver_name,
              receiver_phone: mockResult.receiver_phone,
              receiver_address: mockResult.receiver_address,
            }))
            setCurrentStep(1)
            addNotification({ type: 'success', message: '扫码成功！已自动填充寄件信息' })
            return 100
          }
          return prev + 2
        })
      }, 50)
      return () => clearInterval(interval)
    }
  }, [scanning])

  const handleManualInput = () => {
    if (!qrCodeValue.trim()) {
      addNotification({ type: 'error', message: '请输入二维码内容' })
      return
    }
    setLoading(true)
    setTimeout(() => {
      const mockResult = {
        qrCode: qrCodeValue,
        sender_name: '王五',
        sender_phone: '13800138002',
        sender_address: '广州市天河区xxx路789号',
        receiver_name: '赵六',
        receiver_phone: '13900139002',
        receiver_address: '深圳市南山区xxx路012号',
      }
      setScanResult(mockResult)
      setFormData(prev => ({
        ...prev,
        sender_name: mockResult.sender_name,
        sender_phone: mockResult.sender_phone,
        sender_address: mockResult.sender_address,
        receiver_name: mockResult.receiver_name,
        receiver_phone: mockResult.receiver_phone,
        receiver_address: mockResult.receiver_address,
      }))
      setLoading(false)
      setCurrentStep(1)
      addNotification({ type: 'success', message: '信息获取成功！' })
    }, 1000)
  }

  const handleHistorySelect = (item: any) => {
    if (item.status === 'success') {
      setQrCodeValue(item.qrCode)
      setFormData(prev => ({
        ...prev,
        sender_address: item.address,
      }))
      setShowHistory(false)
      addNotification({ type: 'success', message: '已选择历史记录' })
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.receiver_name || !formData.receiver_phone || !formData.receiver_address) {
        addNotification({ type: 'error', message: '请填写完整的收件信息' })
        return
      }
      setCurrentStep(2)
    }
  }

  const handleSubmit = async () => {
    if (!qrCodeValue) {
      addNotification({ type: 'error', message: '请先完成扫码' })
      return
    }
    setSubmitting(true)
    try {
      const result = await api.orders.scan(qrCodeValue, 1)
      if (result.success) {
        addNotification({ type: 'success', message: '扫码下单成功！' })
        setTimeout(() => navigate('/track'), 1500)
      }
    } catch (error) {
      addNotification({ type: 'error', message: '提交失败，请重试' })
    } finally {
      setSubmitting(false)
    }
  }

  const generateNewQR = () => {
    const newQr = `SF${Date.now()}`
    setQrCodeValue(newQr)
    addNotification({ type: 'success', message: '新二维码已生成' })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-sf-light">扫码下单</h1>
        <p className="text-sf-light/50 text-sm mt-1">微信小程序扫码，快速获取寄件信息，一键下单</p>
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
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto bg-sf-black/50 rounded-2xl border border-sf-blue/30 overflow-hidden">
                {scanning ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sf-red/20 to-transparent animate-pulse" />
                    <div
                      className="absolute left-4 right-4 h-0.5 bg-sf-red shadow-lg shadow-sf-red/50"
                      style={{
                        transform: `translateY(${-50 + scanProgress}%)`,
                        transition: 'transform 0.05s linear',
                      }}
                    />
                    <div className="relative z-10 text-center">
                      <Camera size={64} className="mx-auto text-sf-light/80 mb-4 animate-pulse" />
                      <p className="text-sf-light/70">正在扫描二维码...</p>
                      <p className="text-sf-light/50 text-sm mt-2">{scanProgress}%</p>
                    </div>
                    <div className="absolute inset-4 border-2 border-dashed border-sf-blue/50 rounded-xl">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-sf-red rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-sf-red rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-sf-red rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-sf-red rounded-br-lg" />
                    </div>
                  </div>
                ) : scanResult ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-sf-green/10 rounded-full flex items-center justify-center mb-4">
                      <Check size={48} className="text-sf-green" />
                    </div>
                    <p className="text-sf-light text-lg">扫码成功</p>
                    <p className="text-sf-light/50 text-sm mt-1">{qrCodeValue}</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8">
                    <div className="w-48 h-48 bg-white p-4 rounded-xl mb-6">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {Array.from({ length: 8 }).map((_, i) =>
                          Array.from({ length: 8 }).map((_, j) => (
                            <rect
                              key={`${i}-${j}`}
                              x={10 + j * 10}
                              y={10 + i * 10}
                              width="8"
                              height="8"
                              fill={Math.random() > 0.4 ? '#1A1A2E' : 'transparent'}
                              rx="1"
                            />
                          ))
                        )}
                        <rect x="10" y="10" width="20" height="20" fill="#1A1A2E" rx="2" />
                        <rect x="14" y="14" width="12" height="12" fill="white" rx="1" />
                        <rect x="17" y="17" width="6" height="6" fill="#1A1A2E" />
                        <rect x="70" y="10" width="20" height="20" fill="#1A1A2E" rx="2" />
                        <rect x="74" y="14" width="12" height="12" fill="white" rx="1" />
                        <rect x="77" y="17" width="6" height="6" fill="#1A1A2E" />
                        <rect x="10" y="70" width="20" height="20" fill="#1A1A2E" rx="2" />
                        <rect x="14" y="74" width="12" height="12" fill="white" rx="1" />
                        <rect x="17" y="77" width="6" height="6" fill="#1A1A2E" />
                      </svg>
                    </div>
                    <p className="text-sf-light text-center">将二维码放入框内自动扫描</p>
                    <p className="text-sf-light/50 text-sm text-center mt-1">或手动输入二维码内容</p>
                  </div>
                )}
              </div>

              {scanning && (
                <button
                  onClick={stopScanning}
                  className="absolute top-4 right-4 w-10 h-10 bg-sf-dark/80 rounded-full flex items-center justify-center text-sf-light/70 hover:text-sf-light transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {!scanning && (
              <div className="flex flex-wrap gap-3 justify-center">
                {!scanResult ? (
                  <>
                    <button
                      onClick={startScanning}
                      className="flex items-center gap-2 px-6 h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors"
                    >
                      <Camera size={18} />
                      开始扫码
                    </button>
                    <button
                      onClick={generateNewQR}
                      className="flex items-center gap-2 px-6 h-11 bg-sf-blue text-white rounded-lg hover:bg-sf-blue/90 transition-colors"
                    >
                      <RefreshCw size={18} />
                      生成二维码
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setScanResult(null)
                      setQrCodeValue('')
                      setCurrentStep(0)
                    }}
                    className="flex items-center gap-2 px-6 h-11 bg-sf-blue text-white rounded-lg hover:bg-sf-blue/90 transition-colors"
                  >
                    <RefreshCw size={18} />
                    重新扫码
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-6 h-11 border border-sf-blue/30 rounded-lg text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
                >
                  <History size={18} />
                  历史记录
                </button>
              </div>
            )}

            {!scanning && !scanResult && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                <h4 className="text-sf-light font-medium mb-4">手动输入二维码</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={qrCodeValue}
                    onChange={(e) => setQrCodeValue(e.target.value)}
                    className="flex-1 h-11 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入二维码内容"
                  />
                  <button
                    onClick={handleManualInput}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 h-11 bg-sf-green text-white rounded-lg hover:bg-sf-green/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    确认
                  </button>
                </div>
              </div>
            )}

            {showHistory && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sf-light font-medium">扫码历史记录</h4>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-sf-light/50 hover:text-sf-light transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-3">
                  {scanHistoryData.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleHistorySelect(item)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        item.status === 'success'
                          ? 'border-sf-blue/20 hover:border-sf-blue/40 hover:bg-sf-dark/30'
                          : 'border-sf-red/20 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <QrCode size={20} className={item.status === 'success' ? 'text-sf-blue' : 'text-sf-red'} />
                          <div>
                            <div className="text-sf-light text-sm">{item.qrCode}</div>
                            <div className="text-sf-light/50 text-xs">{item.address}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs ${item.status === 'success' ? 'text-sf-green' : 'text-sf-red'}`}>
                            {item.status === 'success' ? '成功' : '失败'}
                          </div>
                          <div className="text-sf-light/50 text-xs">{item.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                <h3 className="text-lg font-display text-sf-light">寄件人信息 (扫码获取)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">姓名</label>
                  <input
                    type="text"
                    value={formData.sender_name}
                    onChange={(e) => handleInputChange('sender_name', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">手机号</label>
                  <input
                    type="tel"
                    value={formData.sender_phone}
                    onChange={(e) => handleInputChange('sender_phone', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-sf-light/70 mb-2">详细地址</label>
                  <input
                    type="text"
                    value={formData.sender_address}
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
                    value={formData.receiver_name}
                    onChange={(e) => handleInputChange('receiver_name', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入收件人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">手机号</label>
                  <input
                    type="tel"
                    value={formData.receiver_phone}
                    onChange={(e) => handleInputChange('receiver_phone', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入手机号"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-sf-light/70 mb-2">详细地址</label>
                  <input
                    type="text"
                    value={formData.receiver_address}
                    onChange={(e) => handleInputChange('receiver_address', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入详细地址"
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
                    value={formData.goods_type}
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
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 1)}
                    min="0.1"
                    step="0.1"
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">时效要求</label>
                  <select
                    value={formData.urgency}
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
              <div className="w-20 h-20 bg-sf-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode size={40} className="text-sf-blue" />
              </div>
              <h3 className="text-xl font-display text-sf-light">确认扫码订单</h3>
              <p className="text-sf-light/50 text-sm mt-1">二维码: {qrCodeValue}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-sf-dark/50 rounded-xl">
                <h4 className="text-sf-light/70 text-sm mb-4">寄件人</h4>
                <div className="space-y-2 text-sf-light">
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">姓名</span>
                    <span>{formData.sender_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">手机</span>
                    <span>{formData.sender_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">地址</span>
                    <span>{formData.sender_address}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-sf-dark/50 rounded-xl">
                <h4 className="text-sf-light/70 text-sm mb-4">收件人</h4>
                <div className="space-y-2 text-sf-light">
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">姓名</span>
                    <span>{formData.receiver_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">手机</span>
                    <span>{formData.receiver_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">地址</span>
                    <span>{formData.receiver_address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-sf-dark/50 rounded-xl">
              <div className="grid grid-cols-4 gap-4 text-sf-light">
                <div>
                  <div className="text-sf-light/50 text-sm">物品类型</div>
                  <div className="mt-1">{formData.goods_type}</div>
                </div>
                <div>
                  <div className="text-sf-light/50 text-sm">重量</div>
                  <div className="mt-1">{formData.weight} kg</div>
                </div>
                <div>
                  <div className="text-sf-light/50 text-sm">时效</div>
                  <div className="mt-1">
                    {formData.urgency === 'standard' ? '标准快递' : formData.urgency === 'express' ? '航空快递' : '特快专递'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sf-light/50 text-sm">预估运费</div>
                  <div className="mt-1 text-2xl font-display text-sf-red">
                    ¥{(formData.weight * 15).toFixed(2)}
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
                '确认下单'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScanOrder
