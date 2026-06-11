import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Laptop, ChevronDown, ChevronRight, Check, Zap, Shield, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApi } from '@/hooks/useApi'

const brands = ['Apple', '华为', '小米', 'OPPO', 'vivo', '三星']
const models: Record<string, string[]> = {
  Apple: ['iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro', 'MacBook Air M2', 'iPad Pro'],
  华为: ['Mate 60 Pro', 'P60 Pro', 'MatePad Pro', 'MateBook X Pro'],
  小米: ['14 Pro', '14', 'Redmi K70', 'Mi Pad 6'],
  OPPO: ['Find X7', 'Reno 11', 'Pad 2'],
  vivo: ['X100 Pro', 'X100', 'iQOO 12'],
  三星: ['Galaxy S24 Ultra', 'Galaxy S24', 'Galaxy Tab S9'],
}
const types = ['屏幕', '电池', '主板', '摄像头', '充电口', '其他']

const symptomCategories = [
  {
    label: '硬件故障',
    icon: AlertTriangle,
    symptoms: ['屏幕碎裂', '屏幕闪烁', '电池鼓包', '电池续航差', '摄像头模糊', '按键失灵', '充电异常', '扬声器无声'],
  },
  {
    label: '软件问题',
    icon: Zap,
    symptoms: ['系统卡顿', '频繁重启', '应用闪退', '无法开机', '系统升级失败', '存储空间不足'],
  },
  {
    label: '网络异常',
    icon: Shield,
    symptoms: ['WiFi无法连接', '蓝牙故障', '信号弱', '无法通话', '数据网络异常'],
  },
]

interface DiagnosisResult {
  issue: string
  confidence: number
  priceRange: string
  timeEstimate: string
}

const mockResults: DiagnosisResult[] = [
  { issue: '屏幕总成损坏', confidence: 92, priceRange: '¥299-599', timeEstimate: '30-60分钟' },
  { issue: '排线松动', confidence: 65, priceRange: '¥99-199', timeEstimate: '15-30分钟' },
  { issue: '主板短路', confidence: 23, priceRange: '¥599-1299', timeEstimate: '2-4小时' },
]

export default function Diagnosis() {
  const navigate = useNavigate()
  const { request, loading } = useApi<DiagnosisResult[]>()
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({ '硬件故障': true })
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [results, setResults] = useState<DiagnosisResult[] | null>(null)

  const toggleCategory = (label: string) => {
    setExpandedCategories((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    )
  }

  const handleDiagnose = async () => {
    try {
      const data = await request('/api/diagnosis/analyze', {
        method: 'POST',
        body: JSON.stringify({ brand: selectedBrand, model: selectedModel, symptoms: selectedSymptoms }),
      })
      setResults(data)
    } catch {
      setResults(mockResults)
    }
  }

  return (
    <div className="min-h-screen bg-surface-light px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl animate-fade-in">
        <h1 className="font-title text-3xl font-bold text-primary">智能诊断</h1>
        <p className="mt-2 text-gray-500">选择设备型号和症状，获取智能诊断结果</p>

        <div className="mt-8 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-title text-lg font-semibold text-primary">选择设备</h3>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">品牌</label>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => { setSelectedBrand(brand); setSelectedModel('') }}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                      selectedBrand === brand
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300',
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {selectedBrand && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">型号</label>
                <div className="flex flex-wrap gap-2">
                  {(models[selectedBrand] || []).map((model) => (
                    <button
                      key={model}
                      onClick={() => setSelectedModel(model)}
                      className={cn(
                        'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                        selectedModel === model
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300',
                      )}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedModel && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">故障类型</label>
                <div className="flex flex-wrap gap-2">
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                        selectedType === type
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300',
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-title text-lg font-semibold text-primary">症状选择</h3>
            {selectedSymptoms.length > 0 && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                已选 {selectedSymptoms.length} 项
              </span>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {symptomCategories.map((category) => (
              <div key={category.label} className="rounded-lg border border-gray-100">
                <button
                  onClick={() => toggleCategory(category.label)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <category.icon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">{category.label}</span>
                  </div>
                  {expandedCategories[category.label] ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {expandedCategories[category.label] && (
                  <div className="flex flex-wrap gap-2 border-t border-gray-50 px-4 py-3">
                    {category.symptoms.map((symptom) => {
                      const isSelected = selectedSymptoms.includes(symptom)
                      return (
                        <button
                          key={symptom}
                          onClick={() => toggleSymptom(symptom)}
                          className={cn(
                            'flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all',
                            isSelected
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300',
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          {symptom}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleDiagnose}
            disabled={!selectedBrand || selectedSymptoms.length === 0 || loading}
            className="gradient-accent mt-6 w-full rounded-lg py-3 font-medium text-primary transition-all disabled:opacity-50"
          >
            {loading ? '诊断中...' : '开始智能诊断'}
          </button>
        </div>

        {results && (
          <div className="mt-6 animate-slide-up rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-title text-lg font-semibold text-primary">诊断结果</h3>
            <div className="mt-4 space-y-4">
              {results.map((result, index) => (
                <div key={index} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-primary">{result.issue}</h4>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      result.confidence >= 80 ? 'bg-green-100 text-green-700' :
                      result.confidence >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600',
                    )}>
                      置信度 {result.confidence}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        result.confidence >= 80 ? 'bg-accent' :
                        result.confidence >= 50 ? 'bg-alert' :
                        'bg-gray-400',
                      )}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                    <span>参考价格: <span className="font-medium text-accent">{result.priceRange}</span></span>
                    <span>预计时间: {result.timeEstimate}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/booking')}
              className="gradient-accent mt-4 w-full rounded-lg py-3 font-medium text-primary"
            >
              立即预约
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
