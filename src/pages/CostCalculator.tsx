import React, { useState, useEffect } from 'react'
import {
  Calculator,
  Building2,
  ArrowUpDown,
  Ruler,
  Weight,
  Wrench,
  MapPin,
  ChevronRight,
  Clock,
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Share2,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'

interface CalculationResult {
  baseFee: number
  floorFee: number
  disassemblyFee: number
  distanceFee: number
  weightFee: number
  sizeFee: number
  total: number
  breakdown: Array<{
    name: string
    value: number
    formula: string
    description: string
  }>
  comparison?: {
    withElevator: number
    withoutElevator: number
    savings: number
  }
}

interface HistoryRecord {
  id: number
  date: string
  itemName: string
  weight: number
  floors: number
  hasElevator: boolean
  total: number
  result: CalculationResult
}

const presetItems = [
  { name: '沙发', weight: 80, length: 200, width: 90, height: 80 },
  { name: '衣柜', weight: 120, length: 180, width: 60, height: 220 },
  { name: '冰箱', weight: 80, length: 70, width: 70, height: 180 },
  { name: '洗衣机', weight: 60, length: 60, width: 60, height: 85 },
  { name: '钢琴', weight: 250, length: 150, width: 60, height: 120 },
  { name: '保险柜', weight: 150, length: 80, width: 50, height: 80 },
]

const distanceOptions = [
  { value: 0, label: '同城搬运', desc: '5公里内' },
  { value: 1, label: '近郊运输', desc: '5-20公里' },
  { value: 2, label: '跨区运输', desc: '20-50公里' },
  { value: 3, label: '长途运输', desc: '50公里以上' },
]

const CostCalculator: React.FC = () => {
  const { addNotification } = useAppStore()
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showFormula, setShowFormula] = useState(false)

  const [formData, setFormData] = useState({
    itemName: '沙发',
    weight: 80,
    length: 200,
    width: 90,
    height: 80,
    quantity: 1,
    has_elevator: 1,
    floors: 5,
    floor_height: 3,
    disassembly_required: 0,
    distance_level: 0,
    from_address: '',
    to_address: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem('calculator_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse history')
      }
    }
  }, [])

  const saveToHistory = (res: CalculationResult) => {
    const newRecord: HistoryRecord = {
      id: Date.now(),
      date: new Date().toLocaleString('zh-CN'),
      itemName: formData.itemName,
      weight: formData.weight,
      floors: formData.floors,
      hasElevator: formData.has_elevator === 1,
      total: res.total,
      result: res,
    }
    const updated = [newRecord, ...history].slice(0, 20)
    setHistory(updated)
    localStorage.setItem('calculator_history', JSON.stringify(updated))
  }

  const handlePresetSelect = (item: typeof presetItems[0]) => {
    setFormData(prev => ({
      ...prev,
      itemName: item.name,
      weight: item.weight,
      length: item.length,
      width: item.width,
      height: item.height,
    }))
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculate = async () => {
    if (formData.weight <= 0 || formData.floors <= 0) {
      addNotification({ type: 'error', message: '请输入有效的重量和楼层数' })
      return
    }

    setCalculating(true)
    try {
      const result = await api.bulk.calculator({
        weight: formData.weight,
        quantity: formData.quantity,
        floors: formData.floors,
        has_elevator: formData.has_elevator,
        floor_height: formData.floor_height,
        disassembly_required: formData.disassembly_required,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        distance_level: formData.distance_level,
        fromAddress: formData.from_address,
        toAddress: formData.to_address,
      })

      if (result.success && result.data) {
        const data = result.data as CalculationResult
        
        const compareResult = await api.bulk.calculator({
          weight: formData.weight,
          quantity: formData.quantity,
          floors: formData.floors,
          has_elevator: 0,
          floor_height: formData.floor_height,
          disassembly_required: formData.disassembly_required,
          length: formData.length,
          width: formData.width,
          height: formData.height,
          distance_level: formData.distance_level,
        })

        if (compareResult.success && compareResult.data) {
          const withoutElevator = (compareResult.data as CalculationResult).total
          data.comparison = {
            withElevator: data.total,
            withoutElevator: withoutElevator,
            savings: withoutElevator - data.total,
          }
        }

        setResult(data)
        saveToHistory(data)
        addNotification({ type: 'success', message: '费用测算完成' })
      }
    } catch (error) {
      console.error('Calculation failed:', error)
      addNotification({ type: 'error', message: '测算失败，请重试' })
    } finally {
      setCalculating(false)
    }
  }

  const loadHistoryRecord = (record: HistoryRecord) => {
    setResult(record.result)
    setShowHistory(false)
    addNotification({ type: 'success', message: '已加载历史测算记录' })
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('calculator_history')
    addNotification({ type: 'success', message: '历史记录已清空' })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display text-sf-light">楼层搬运费智能测算</h1>
          <p className="text-sf-light/50 text-sm mt-1">智能估算大件物品搬运费用，透明报价一目了然</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-4 h-11 rounded-lg border transition-all ${
            showHistory
              ? 'bg-sf-blue/10 border-sf-blue/50 text-sf-blue'
              : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
          }`}
        >
          <History size={18} />
          历史记录
          <span className="px-2 py-0.5 bg-sf-red/20 text-sf-red text-xs rounded-full">
            {history.length}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 border border-sf-blue/30">
            <h3 className="text-lg font-display text-sf-light mb-4 flex items-center gap-2">
              <Package size={18} className="text-sf-red" />
              物品信息
            </h3>

            <div className="mb-6">
              <label className="block text-sm text-sf-light/70 mb-3">快速选择物品</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {presetItems.map(item => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handlePresetSelect(item)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      formData.itemName === item.name
                        ? 'bg-sf-red/10 border-sf-red/50 text-sf-red'
                        : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                    }`}
                  >
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-sf-light/50 mt-1">{item.weight}kg</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm text-sf-light/70 mb-2">物品名称</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => handleInputChange('itemName', e.target.value)}
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  placeholder="物品名称"
                />
              </div>
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">
                  <span className="flex items-center gap-1">
                    <Weight size={12} className="text-sf-yellow" />
                    重量 (kg)
                  </span>
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  min="1"
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">数量</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">长 (cm)</label>
                <input
                  type="number"
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', parseFloat(e.target.value) || 0)}
                  min="1"
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">宽 (cm)</label>
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) => handleInputChange('width', parseFloat(e.target.value) || 0)}
                  min="1"
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm text-sf-light/70 mb-2">高 (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || 0)}
                  min="1"
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-sf-blue/30">
            <h3 className="text-lg font-display text-sf-light mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-sf-blue" />
              楼层搬运信息
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-sf-light/70 mb-3">电梯情况</label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('has_elevator', 1)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      formData.has_elevator === 1
                        ? 'bg-sf-green/10 border-sf-green/50'
                        : 'bg-sf-dark/50 border-sf-blue/20 hover:border-sf-blue/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        formData.has_elevator === 1 ? 'bg-sf-green/20' : 'bg-sf-dark'
                      }`}>
                        <CheckCircle2 size={16} className={formData.has_elevator === 1 ? 'text-sf-green' : 'text-sf-light/30'} />
                      </div>
                      <div>
                        <div className={`font-medium ${
                          formData.has_elevator === 1 ? 'text-sf-green' : 'text-sf-light/70'
                        }`}>有电梯</div>
                        <div className="text-xs text-sf-light/50">使用电梯搬运，费用较低</div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('has_elevator', 0)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      formData.has_elevator === 0
                        ? 'bg-sf-orange/10 border-sf-orange/50'
                        : 'bg-sf-dark/50 border-sf-blue/20 hover:border-sf-blue/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        formData.has_elevator === 0 ? 'bg-sf-orange/20' : 'bg-sf-dark'
                      }`}>
                        <XCircle size={16} className={formData.has_elevator === 0 ? 'text-sf-orange' : 'text-sf-light/30'} />
                      </div>
                      <div>
                        <div className={`font-medium ${
                          formData.has_elevator === 0 ? 'text-sf-orange' : 'text-sf-light/70'
                        }`}>无电梯</div>
                        <div className="text-xs text-sf-light/50">人工楼梯搬运，费用较高</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-sf-light/70 mb-2">
                  <span className="flex items-center gap-1">
                    <ArrowUpDown size={12} className="text-sf-blue" />
                    楼层数
                  </span>
                </label>
                <input
                  type="range"
                  value={formData.floors}
                  onChange={(e) => handleInputChange('floors', parseInt(e.target.value))}
                  min="1"
                  max="60"
                  className="w-full h-2 bg-sf-dark rounded-lg appearance-none cursor-pointer accent-sf-red"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sf-light/50 text-xs">1层</span>
                  <span className="text-2xl font-display text-sf-red">{formData.floors}</span>
                  <span className="text-sf-light/50 text-xs">60层</span>
                </div>

                <label className="block text-sm text-sf-light/70 mb-2 mt-6">
                  <span className="flex items-center gap-1">
                    <Ruler size={12} className="text-sf-yellow" />
                    层高 (米)
                  </span>
                </label>
                <input
                  type="number"
                  value={formData.floor_height}
                  onChange={(e) => handleInputChange('floor_height', parseFloat(e.target.value) || 2.8)}
                  min="2"
                  max="5"
                  step="0.1"
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-sf-light/70 mb-3">附加服务</label>

                <div className="mb-4">
                  <div className="flex items-center justify-between p-3 bg-sf-dark/50 rounded-lg border border-sf-blue/20">
                    <div className="flex items-center gap-2">
                      <Wrench size={16} className="text-sf-yellow" />
                      <span className="text-sm text-sf-light/70">拆装服务</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('disassembly_required', formData.disassembly_required === 1 ? 0 : 1)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        formData.disassembly_required === 1 ? 'bg-sf-red' : 'bg-sf-dark border border-sf-blue/30'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        formData.disassembly_required === 1 ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                <label className="block text-sm text-sf-light/70 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-sf-green" />
                    运输距离
                  </span>
                </label>
                <select
                  value={formData.distance_level}
                  onChange={(e) => handleInputChange('distance_level', parseInt(e.target.value))}
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                >
                  {distanceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-sf-blue/30">
            <h3 className="text-lg font-display text-sf-light mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-sf-green" />
              起止地址（选填）
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">出发地址</label>
                <input
                  type="text"
                  value={formData.from_address}
                  onChange={(e) => handleInputChange('from_address', e.target.value)}
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  placeholder="请输入出发地址"
                />
              </div>
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">到达地址</label>
                <input
                  type="text"
                  value={formData.to_address}
                  onChange={(e) => handleInputChange('to_address', e.target.value)}
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  placeholder="请输入到达地址"
                />
              </div>
            </div>
          </div>

          <button
            onClick={calculate}
            disabled={calculating}
            className="w-full h-14 bg-sf-red text-white rounded-xl hover:bg-sf-red/90 transition-colors flex items-center justify-center gap-3 text-lg font-display disabled:opacity-50"
          >
            {calculating ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                测算中...
              </>
            ) : (
              <>
                <Calculator size={22} />
                立即测算费用
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          {showHistory && (
            <div className="glass rounded-2xl p-6 border border-sf-blue/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display text-sf-light flex items-center gap-2">
                  <Clock size={18} className="text-sf-blue" />
                  测算历史
                </h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-sf-light/50 hover:text-sf-red transition-colors"
                >
                  清空记录
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <History size={32} className="text-sf-light/30 mx-auto mb-3" />
                  <p className="text-sf-light/50 text-sm">暂无测算记录</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map(record => (
                    <div
                      key={record.id}
                      onClick={() => loadHistoryRecord(record)}
                      className="p-4 bg-sf-dark/50 rounded-lg border border-sf-blue/20 hover:border-sf-blue/40 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sf-light font-medium">{record.itemName}</span>
                        <span className="text-sf-red font-display">¥{record.total.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-sf-light/50">
                        <span>{record.weight}kg</span>
                        <span>·</span>
                        <span>{record.floors}层</span>
                        <span>·</span>
                        <span className={record.hasElevator ? 'text-sf-green' : 'text-sf-orange'}>
                          {record.hasElevator ? '有电梯' : '无电梯'}
                        </span>
                      </div>
                      <div className="text-xs text-sf-light/40 mt-2">{record.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="glass rounded-2xl border border-sf-red/30 overflow-hidden">
              <div className="bg-gradient-to-r from-sf-red to-sf-orange p-6">
                <div className="text-sf-light/80 text-sm">预估总费用</div>
                <div className="text-4xl font-display text-white mt-1">
                  ¥{result.total.toFixed(2)}
                </div>
                <div className="text-sf-light/70 text-xs mt-2">
                  测算时间：{new Date().toLocaleString('zh-CN')}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sf-light font-medium">费用明细</h4>
                    <button
                      onClick={() => setShowFormula(!showFormula)}
                      className="flex items-center gap-1 text-xs text-sf-light/50 hover:text-sf-blue transition-colors"
                    >
                      <Info size={12} />
                      {showFormula ? '隐藏公式' : '显示公式'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {result.breakdown.map((item, idx) => (
                      <div key={idx} className="group">
                        <div className="flex items-center justify-between p-3 bg-sf-dark/50 rounded-lg">
                          <div className="flex-1">
                            <div className="text-sm text-sf-light">{item.name}</div>
                            {showFormula && (
                              <div className="text-xs text-sf-light/50 mt-1 font-mono">
                                {item.formula}
                              </div>
                            )}
                          </div>
                          <div className="text-sf-light font-medium">
                            ¥{item.value.toFixed(2)}
                          </div>
                        </div>
                        {showFormula && (
                          <div className="text-xs text-sf-light/40 mt-1 px-3">
                            {item.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {result.comparison && (
                  <div className="p-4 bg-sf-dark/50 rounded-xl">
                    <h4 className="text-sf-light font-medium mb-4 flex items-center gap-2">
                      {result.comparison.savings > 0 ? (
                        <TrendingDown size={16} className="text-sf-green" />
                      ) : (
                        <TrendingUp size={16} className="text-sf-red" />
                      )}
                      电梯对比分析
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-sf-light/70">有电梯费用</span>
                        <span className="text-sf-green font-medium">
                          ¥{result.comparison.withElevator.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-sf-light/70">无电梯费用</span>
                        <span className="text-sf-orange font-medium">
                          ¥{result.comparison.withoutElevator.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-px bg-sf-blue/20" />
                      <div className="flex items-center justify-between">
                        <span className="text-sf-light/70 text-sm">
                          {result.comparison.savings > 0 ? '使用电梯可节省' : '无电梯额外支出'}
                        </span>
                        <span className={`text-lg font-display ${
                          result.comparison.savings > 0 ? 'text-sf-green' : 'text-sf-red'
                        }`}>
                          ¥{Math.abs(result.comparison.savings).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button className="flex-1 h-10 flex items-center justify-center gap-2 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 hover:border-sf-blue/40 transition-colors text-sm">
                    <RefreshCw size={14} />
                    重新测算
                  </button>
                  <button className="flex-1 h-10 flex items-center justify-center gap-2 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 hover:border-sf-blue/40 transition-colors text-sm">
                    <Download size={14} />
                    保存结果
                  </button>
                  <button className="flex-1 h-10 flex items-center justify-center gap-2 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 hover:border-sf-blue/40 transition-colors text-sm">
                    <Share2 size={14} />
                    分享
                  </button>
                </div>
              </div>
            </div>
          )}

          {!result && !calculating && (
            <div className="glass rounded-2xl p-8 border border-sf-blue/30 text-center">
              <div className="w-20 h-20 bg-sf-dark rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator size={36} className="text-sf-light/30" />
              </div>
              <h3 className="text-lg font-display text-sf-light mb-2">费用测算器</h3>
              <p className="text-sf-light/50 text-sm">
                填写物品信息和搬运条件，系统将智能估算搬运费用
              </p>
              <div className="mt-6 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-sf-light/70">
                  <CheckCircle2 size={16} className="text-sf-green shrink-0" />
                  <span>支持多种大件物品预设参数</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-sf-light/70">
                  <CheckCircle2 size={16} className="text-sf-green shrink-0" />
                  <span>智能计算楼层搬运费用</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-sf-light/70">
                  <CheckCircle2 size={16} className="text-sf-green shrink-0" />
                  <span>电梯/楼梯费用对比分析</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-sf-light/70">
                  <CheckCircle2 size={16} className="text-sf-green shrink-0" />
                  <span>透明计算公式可追溯</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CostCalculator
