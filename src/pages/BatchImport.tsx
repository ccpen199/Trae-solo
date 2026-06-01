import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileText,
  Grid3X3,
  Link2,
  Check,
  X,
  Loader2,
  ArrowRight,
  Settings,
  Table,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  ShoppingCart,
  Store,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { Order } from '../../api/types'

const importSources = [
  { value: 'excel', label: 'Excel/CSV导入', icon: FileText, color: 'text-sf-green' },
  { value: 'json', label: 'JSON粘贴', icon: ClipboardPaste, color: 'text-sf-blue' },
  { value: 'taobao', label: '淘宝API对接', icon: ShoppingCart, color: 'text-sf-orange' },
  { value: 'jd', label: '京东API对接', icon: Store, color: 'text-sf-red' },
]

const fieldMappingOptions = [
  { value: 'sender_name', label: '寄件人姓名' },
  { value: 'sender_phone', label: '寄件人电话' },
  { value: 'sender_address', label: '寄件人地址' },
  { value: 'receiver_name', label: '收件人姓名' },
  { value: 'receiver_phone', label: '收件人电话' },
  { value: 'receiver_address', label: '收件人地址' },
  { value: 'goods_type', label: '物品类型' },
  { value: 'weight', label: '重量(kg)' },
  { value: 'urgency', label: '时效要求' },
]

const samplePreviewData = [
  { sender_name: '张三', sender_phone: '13800138001', sender_address: '北京市朝阳区xxx路123号', receiver_name: '李四', receiver_phone: '13900139001', receiver_address: '上海市浦东新区xxx路456号', goods_type: '普通物品', weight: '2', urgency: 'standard' },
  { sender_name: '王五', sender_phone: '13800138002', sender_address: '广州市天河区xxx路789号', receiver_name: '赵六', receiver_phone: '13900139002', receiver_address: '深圳市南山区xxx路012号', goods_type: '电子产品', weight: '1.5', urgency: 'express' },
  { sender_name: '孙七', sender_phone: '13800138003', sender_address: '杭州市西湖区xxx路345号', receiver_name: '周八', receiver_phone: '13900139003', receiver_address: '南京市鼓楼区xxx路678号', goods_type: '服装', weight: '3', urgency: 'standard' },
]

const BatchImport: React.FC = () => {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [selectedSource, setSelectedSource] = useState('excel')
  const [previewData, setPreviewData] = useState<any[]>([])
  const [jsonInput, setJsonInput] = useState('')
  const [showFieldMapping, setShowFieldMapping] = useState(false)
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({
    '寄件人': 'sender_name',
    '联系电话': 'sender_phone',
    '寄件地址': 'sender_address',
    '收件人': 'receiver_name',
    '收件电话': 'receiver_phone',
    '收件地址': 'receiver_address',
    '物品类型': 'goods_type',
    '重量': 'weight',
    '时效': 'urgency',
  })
  const [apiConfig, setApiConfig] = useState({
    appKey: '',
    appSecret: '',
    shopId: '',
    startDate: '',
    endDate: '',
  })
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
  })

  const steps = ['选择导入方式', '配置与预览', '确认导入']

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLoading(true)
      setTimeout(() => {
        setPreviewData(samplePreviewData)
        setLoading(false)
        addNotification({ type: 'success', message: `文件 "${file.name}" 解析成功，共 ${samplePreviewData.length} 条数据` })
      }, 1500)
    }
  }

  const handleJsonParse = () => {
    if (!jsonInput.trim()) {
      addNotification({ type: 'error', message: '请输入JSON数据' })
      return
    }
    try {
      const parsed = JSON.parse(jsonInput)
      const data = Array.isArray(parsed) ? parsed : parsed.orders || parsed.data || []
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('未找到有效的订单数据')
      }
      setPreviewData(data)
      addNotification({ type: 'success', message: `JSON解析成功，共 ${data.length} 条数据` })
    } catch (error) {
      addNotification({ type: 'error', message: 'JSON格式错误，请检查' })
    }
  }

  const handleApiSync = () => {
    if (!apiConfig.appKey || !apiConfig.appSecret) {
      addNotification({ type: 'error', message: '请填写API配置信息' })
      return
    }
    setLoading(true)
    setTimeout(() => {
      setPreviewData(samplePreviewData)
      setLoading(false)
      addNotification({ type: 'success', message: `API同步成功，共 ${samplePreviewData.length} 条订单数据` })
    }, 2000)
  }

  const handleFieldMappingChange = (sourceField: string, targetField: string) => {
    setFieldMapping(prev => ({ ...prev, [sourceField]: targetField }))
  }

  const handleNext = () => {
    if (currentStep === 0) {
      if ((selectedSource === 'excel' && previewData.length === 0) ||
          (selectedSource === 'json' && previewData.length === 0) ||
          ((selectedSource === 'taobao' || selectedSource === 'jd') && previewData.length === 0)) {
        addNotification({ type: 'error', message: '请先完成数据导入或同步' })
        return
      }
    }
    setCurrentStep(prev => prev + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setImportProgress(0)
    const mappedOrders = previewData.map((item, index) => {
      const mapped: any = { user_id: 1 }
      Object.entries(fieldMapping).forEach(([sourceKey, targetKey]) => {
        if (item[sourceKey] !== undefined) {
          mapped[targetKey] = item[sourceKey]
        }
      })
      return mapped
    })

    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + 10
      })
    }, 300)

    try {
      const result = await api.orders.batch(mappedOrders)
      clearInterval(interval)
      setImportProgress(100)
      if (result.success) {
        setImportStats({
          total: mappedOrders.length,
          success: Math.floor(mappedOrders.length * 0.95),
          failed: Math.floor(mappedOrders.length * 0.05),
        })
        addNotification({ type: 'success', message: `批量导入成功！共导入 ${mappedOrders.length} 条订单` })
        setTimeout(() => navigate('/track'), 2000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      clearInterval(interval)
      addNotification({ type: 'error', message: '批量导入失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-sf-light">批量导入</h1>
        <p className="text-sf-light/50 text-sm mt-1">支持Excel/CSV文件、JSON数据及电商平台API批量导入订单</p>
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
            <div>
              <h3 className="text-lg font-display text-sf-light mb-4">选择导入方式</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {importSources.map((source) => (
                  <div
                    key={source.value}
                    onClick={() => setSelectedSource(source.value)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSource === source.value
                        ? 'border-sf-red bg-sf-red/5'
                        : 'border-sf-blue/20 bg-sf-dark/30 hover:border-sf-blue/40'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <source.icon size={32} className={`${source.color} mb-3`} />
                      <span className="text-sf-light text-sm font-medium">{source.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedSource === 'excel' && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-sf-blue/30 rounded-xl p-10 text-center cursor-pointer hover:border-sf-red/50 transition-colors"
                >
                  <Upload size={48} className="mx-auto text-sf-blue mb-4" />
                  <p className="text-sf-light mb-2">点击或拖拽文件到此处上传</p>
                  <p className="text-sf-light/50 text-sm">支持 .xlsx, .xls, .csv 格式，最大 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {previewData.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sf-green">
                    <CheckCircle2 size={18} />
                    <span className="text-sm">已导入 {previewData.length} 条数据</span>
                  </div>
                )}
              </div>
            )}

            {selectedSource === 'json' && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                <label className="block text-sm text-sf-light/70 mb-3">粘贴JSON数据</label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full h-48 px-4 py-3 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors font-mono text-sm"
                  placeholder='[{"sender_name": "张三", "sender_phone": "13800138000", "sender_address": "北京市朝阳区", "receiver_name": "李四", "receiver_phone": "13900139000", "receiver_address": "上海市浦东新区", "goods_type": "普通物品", "weight": 1, "urgency": "standard"}]'
                />
                <button
                  onClick={handleJsonParse}
                  disabled={loading}
                  className="mt-4 flex items-center gap-2 px-6 h-10 bg-sf-blue text-white rounded-lg hover:bg-sf-blue/90 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Grid3X3 size={16} />}
                  解析数据
                </button>
                {previewData.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sf-green">
                    <CheckCircle2 size={18} />
                    <span className="text-sm">已解析 {previewData.length} 条数据</span>
                  </div>
                )}
              </div>
            )}

            {(selectedSource === 'taobao' || selectedSource === 'jd') && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                <div className="flex items-center gap-2 mb-4">
                  <Link2 size={18} className="text-sf-blue" />
                  <h4 className="text-sf-light font-medium">
                    {selectedSource === 'taobao' ? '淘宝' : '京东'} API配置
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-sf-light/70 mb-2">App Key</label>
                    <input
                      type="text"
                      value={apiConfig.appKey}
                      onChange={(e) => setApiConfig(prev => ({ ...prev, appKey: e.target.value }))}
                      className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                      placeholder="请输入App Key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-sf-light/70 mb-2">App Secret</label>
                    <input
                      type="password"
                      value={apiConfig.appSecret}
                      onChange={(e) => setApiConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                      className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                      placeholder="请输入App Secret"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-sf-light/70 mb-2">店铺ID</label>
                    <input
                      type="text"
                      value={apiConfig.shopId}
                      onChange={(e) => setApiConfig(prev => ({ ...prev, shopId: e.target.value }))}
                      className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                      placeholder="请输入店铺ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-sf-light/70 mb-2">时间范围</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={apiConfig.startDate}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, startDate: e.target.value }))}
                        className="flex-1 h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                      />
                      <input
                        type="date"
                        value={apiConfig.endDate}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, endDate: e.target.value }))}
                        className="flex-1 h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleApiSync}
                  disabled={loading}
                  className="mt-4 flex items-center gap-2 px-6 h-10 bg-sf-orange text-white rounded-lg hover:bg-sf-orange/90 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                  同步订单
                </button>
                {previewData.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sf-green">
                    <CheckCircle2 size={18} />
                    <span className="text-sm">已同步 {previewData.length} 条订单</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display text-sf-light">数据预览</h3>
                <p className="text-sf-light/50 text-sm mt-1">共 {previewData.length} 条数据，核对无误后可继续</p>
              </div>
              <button
                onClick={() => setShowFieldMapping(!showFieldMapping)}
                className="flex items-center gap-2 px-4 h-10 border border-sf-blue/30 rounded-lg text-sf-light/70 hover:border-sf-blue/50 transition-colors"
              >
                <Settings size={16} />
                字段映射
                {showFieldMapping ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showFieldMapping && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                <h4 className="text-sf-light font-medium mb-4">字段映射配置</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(fieldMapping).map(([sourceKey, targetValue]) => (
                    <div key={sourceKey}>
                      <label className="block text-xs text-sf-light/50 mb-1">{sourceKey}</label>
                      <select
                        value={targetValue}
                        onChange={(e) => handleFieldMappingChange(sourceKey, e.target.value)}
                        className="w-full h-9 px-3 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light text-sm focus:outline-none focus:border-sf-red/50 transition-colors"
                      >
                        <option value="">-- 不导入 --</option>
                        {fieldMappingOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-sf-blue/20">
              <table className="w-full">
                <thead className="bg-sf-dark">
                  <tr>
                    {previewData[0] && Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="px-4 py-3 text-left text-xs font-medium text-sf-light/70 uppercase tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-blue/10">
                  {previewData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-sf-dark/30">
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 text-sm text-sf-light/80">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 5 && (
                <div className="px-4 py-3 bg-sf-dark/50 text-center text-sm text-sf-light/50">
                  还有 {previewData.length - 5} 条数据未显示
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-sf-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Table size={40} className="text-sf-blue" />
              </div>
              <h3 className="text-xl font-display text-sf-light">确认批量导入</h3>
              <p className="text-sf-light/50 text-sm mt-1">请核对以下信息，确认无误后提交导入</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-sf-dark/50 rounded-xl text-center">
                <div className="text-4xl font-display text-sf-blue mb-2">{previewData.length}</div>
                <div className="text-sf-light/70 text-sm">总订单数</div>
              </div>
              <div className="p-6 bg-sf-dark/50 rounded-xl text-center">
                <div className="text-4xl font-display text-sf-green mb-2">
                  {Object.values(fieldMapping).filter(v => v).length}
                </div>
                <div className="text-sf-light/70 text-sm">映射字段</div>
              </div>
              <div className="p-6 bg-sf-dark/50 rounded-xl text-center">
                <div className="text-4xl font-display text-sf-yellow mb-2">
                  ¥{(previewData.length * 15).toFixed(2)}
                </div>
                <div className="text-sf-light/70 text-sm">预估运费</div>
              </div>
            </div>

            {importProgress > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-sf-light/70">导入进度</span>
                  <span className="text-sf-light">{importProgress}%</span>
                </div>
                <div className="h-3 bg-sf-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sf-blue to-sf-red transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                {importProgress === 100 && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-sf-blue">
                      <FileText size={16} />
                      <span>总计: {importStats.total}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sf-green">
                      <Check size={16} />
                      <span>成功: {importStats.success}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sf-red">
                      <X size={16} />
                      <span>失败: {importStats.failed}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between mt-10 pt-6 border-t border-sf-blue/20">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0 || loading}
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
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  导入中...
                </>
              ) : (
                '确认导入'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BatchImport
