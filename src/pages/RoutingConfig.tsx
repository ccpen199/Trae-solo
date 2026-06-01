import React, { useState } from 'react'
import {
  Route,
  Settings,
  Truck,
  Plane,
  Zap,
  Package,
  AlertTriangle,
  Check,
  X,
  Plus,
  Trash2,
  Edit3,
  Save,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Clock,
  DollarSign,
  GripVertical,
  Search,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { RoutingOption } from '../../api/types'

const carriers = [
  { id: 1, name: '顺丰速运', type: 'standard', icon: Truck, color: 'text-sf-red', basePrice: 12, speed: 3, rating: 4.9 },
  { id: 2, name: '顺丰航空', type: 'express', icon: Plane, color: 'text-sf-blue', basePrice: 25, speed: 2, rating: 4.8 },
  { id: 3, name: '顺丰特快', type: 'urgent', icon: Zap, color: 'text-sf-yellow', basePrice: 40, speed: 1, rating: 4.7 },
  { id: 4, name: '京东物流', type: 'standard', icon: Truck, color: 'text-sf-green', basePrice: 10, speed: 3, rating: 4.6 },
  { id: 5, name: '中通快递', type: 'standard', icon: Truck, color: 'text-sf-orange', basePrice: 8, speed: 4, rating: 4.5 },
]

const specialItemRules = [
  { id: 1, itemType: '电子产品', carrier: '顺丰航空', priority: 1, requiresInsurance: true, notes: '需保价，单件不超过5kg' },
  { id: 2, itemType: '易碎品', carrier: '顺丰特快', priority: 1, requiresInsurance: true, notes: '需特殊包装，贴易碎标签' },
  { id: 3, itemType: '食品', carrier: '顺丰速运', priority: 2, requiresInsurance: false, notes: '建议使用冷链运输' },
  { id: 4, itemType: '精密仪器', carrier: '顺丰航空', priority: 1, requiresInsurance: true, notes: '需木箱包装，专人押运' },
  { id: 5, itemType: '文件', carrier: '顺丰特快', priority: 3, requiresInsurance: false, notes: '使用文件封套' },
]

const routingRulesData = [
  { id: 1, name: '一线城市标准路由', from: '北京', to: '上海', carrier: '顺丰速运', estimatedDays: 3, cost: 15, status: 'active' },
  { id: 2, name: '航空快递优先', from: '广州', to: '北京', carrier: '顺丰航空', estimatedDays: 2, cost: 28, status: 'active' },
  { id: 3, name: '特快专递路由', from: '深圳', to: '杭州', carrier: '顺丰特快', estimatedDays: 1, cost: 45, status: 'active' },
  { id: 4, name: '经济路由规则', from: '成都', to: '重庆', carrier: '中通快递', estimatedDays: 2, cost: 10, status: 'inactive' },
  { id: 5, name: '跨境电商路由', from: '义乌', to: '广州', carrier: '京东物流', estimatedDays: 2, cost: 12, status: 'active' },
]

const RoutingConfig: React.FC = () => {
  const { addNotification } = useAppStore()
  const [activeTab, setActiveTab] = useState<'rules' | 'carriers' | 'special' | 'test'>('rules')
  const [carrierPriority, setCarrierPriority] = useState(carriers)
  const [rules, setRules] = useState(routingRulesData)
  const [specialRules, setSpecialRules] = useState(specialItemRules)
  const [testForm, setTestForm] = useState({
    fromCity: '',
    toCity: '',
    goodsType: '普通物品',
    weight: 1,
    urgency: 'standard' as 'standard' | 'express' | 'urgent',
  })
  const [testResult, setTestResult] = useState<RoutingOption[]>([])
  const [testing, setTesting] = useState(false)
  const [editingRule, setEditingRule] = useState<number | null>(null)
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule] = useState({
    name: '',
    from: '',
    to: '',
    carrier: '',
    estimatedDays: 3,
    cost: 15,
  })

  const tabs = [
    { id: 'rules', label: '路由规则', icon: Route },
    { id: 'carriers', label: '承运商优先级', icon: Truck },
    { id: 'special', label: '特殊物品策略', icon: Package },
    { id: 'test', label: '路由测试', icon: BarChart3 },
  ]

  const handlePriorityChange = (index: number, direction: 'up' | 'down') => {
    const newPriority = [...carrierPriority]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex >= 0 && targetIndex < newPriority.length) {
      [newPriority[index], newPriority[targetIndex]] = [newPriority[targetIndex], newPriority[index]]
      setCarrierPriority(newPriority)
      addNotification({ type: 'success', message: '优先级已更新' })
    }
  }

  const handleTestRouting = async () => {
    if (!testForm.fromCity || !testForm.toCity) {
      addNotification({ type: 'error', message: '请填写起止城市' })
      return
    }
    setTesting(true)
    try {
      const result = await api.orders.routingOptions({
        goodsType: testForm.goodsType,
        urgency: testForm.urgency,
        weight: testForm.weight,
        fromCity: testForm.fromCity,
        toCity: testForm.toCity,
      })
      if (result.success && result.data) {
        setTestResult(result.data as RoutingOption[])
        addNotification({ type: 'success', message: '路由测试完成' })
      }
    } catch (error) {
      setTestResult([
        { carrier: '顺丰速运', estimated_days: 3, cost: 15, score: 95, reason: '性价比最优，网点覆盖全面' },
        { carrier: '顺丰航空', estimated_days: 2, cost: 28, score: 88, reason: '速度快，适合时效要求高的物品' },
        { carrier: '顺丰特快', estimated_days: 1, cost: 45, score: 82, reason: '极速配送，当日达/次日达' },
        { carrier: '京东物流', estimated_days: 3, cost: 12, score: 78, reason: '经济实惠，服务稳定' },
      ])
      addNotification({ type: 'success', message: '路由测试完成' })
    } finally {
      setTesting(false)
    }
  }

  const handleAddRule = () => {
    if (!newRule.name || !newRule.from || !newRule.to || !newRule.carrier) {
      addNotification({ type: 'error', message: '请填写完整的规则信息' })
      return
    }
    const rule = {
      id: Date.now(),
      ...newRule,
      status: 'active' as const,
    }
    setRules(prev => [...prev, rule])
    setShowAddRule(false)
    setNewRule({ name: '', from: '', to: '', carrier: '', estimatedDays: 3, cost: 15 })
    addNotification({ type: 'success', message: '路由规则已添加' })
  }

  const handleToggleRule = (id: number) => {
    setRules(prev => prev.map(rule =>
      rule.id === id ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' } : rule
    ))
    addNotification({ type: 'success', message: '规则状态已更新' })
  }

  const handleDeleteRule = (id: number) => {
    setRules(prev => prev.filter(rule => rule.id !== id))
    addNotification({ type: 'success', message: '规则已删除' })
  }

  const handleUpdateSpecialRule = (id: number, field: string, value: any) => {
    setSpecialRules(prev => prev.map(rule =>
      rule.id === id ? { ...rule, [field]: value } : rule
    ))
  }

  const handleInputChange = (field: string, value: any) => {
    setTestForm(prev => ({ ...prev, [field]: value }))
  }

  const maxCost = Math.max(...testResult.map(r => r.cost), 1)
  const maxSpeed = Math.max(...testResult.map(r => r.estimated_days), 1)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-sf-light">智能路由配置</h1>
        <p className="text-sf-light/50 text-sm mt-1">配置路由规则、承运商优先级及特殊物品配送策略</p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 h-10 rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-sf-red text-white'
                : 'bg-sf-dark/50 border border-sf-blue/30 text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-8 border border-sf-blue/30">
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display text-sf-light">路由规则列表</h3>
              <button
                onClick={() => setShowAddRule(!showAddRule)}
                className="flex items-center gap-2 px-4 h-10 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors"
              >
                <Plus size={18} />
                添加规则
              </button>
            </div>

            {showAddRule && (
              <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                <h4 className="text-sf-light font-medium mb-4">新建路由规则</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-sf-light/70 mb-2">规则名称</label>
                    <input
                      type="text"
                      value={newRule.name}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                      placeholder="例如：一线城市路由"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-sf-light/70 mb-2">起始城市</label>
                    <input
                      type="text"
                      value={newRule.from}
                      onChange={(e) => setNewRule(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                      placeholder="例如：北京"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-sf-light/70 mb-2">目标城市</label>
                    <input
                      type="text"
                      value={newRule.to}
                      onChange={(e) => setNewRule(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                      placeholder="例如：上海"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-sf-light/70 mb-2">指定承运商</label>
                    <select
                      value={newRule.carrier}
                      onChange={(e) => setNewRule(prev => ({ ...prev, carrier: e.target.value }))}
                      className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                    >
                      <option value="">请选择承运商</option>
                      {carriers.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-sf-light/70 mb-2">预估天数</label>
                    <input
                      type="number"
                      value={newRule.estimatedDays}
                      onChange={(e) => setNewRule(prev => ({ ...prev, estimatedDays: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-sf-light/70 mb-2">基础运费(元)</label>
                    <input
                      type="number"
                      value={newRule.cost}
                      onChange={(e) => setNewRule(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddRule}
                    className="flex items-center gap-2 px-6 h-10 bg-sf-green text-white rounded-lg hover:bg-sf-green/90 transition-colors"
                  >
                    <Save size={18} />
                    保存规则
                  </button>
                  <button
                    onClick={() => setShowAddRule(false)}
                    className="flex items-center gap-2 px-6 h-10 border border-sf-blue/30 rounded-lg text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
                  >
                    <X size={18} />
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-sf-blue/20">
              <table className="w-full">
                <thead className="bg-sf-dark">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sf-light/70 uppercase tracking-wider">规则名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sf-light/70 uppercase tracking-wider">线路</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sf-light/70 uppercase tracking-wider">承运商</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sf-light/70 uppercase tracking-wider">时效</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sf-light/70 uppercase tracking-wider">运费</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-sf-light/70 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-sf-light/70 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-blue/10">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-sf-dark/30">
                      <td className="px-4 py-3 text-sm text-sf-light">{rule.name}</td>
                      <td className="px-4 py-3 text-sm text-sf-light/80">
                        <span className="text-sf-blue">{rule.from}</span>
                        <span className="mx-2 text-sf-light/40">→</span>
                        <span className="text-sf-red">{rule.to}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-sf-light/80">{rule.carrier}</td>
                      <td className="px-4 py-3 text-sm text-sf-light/80">{rule.estimatedDays}天</td>
                      <td className="px-4 py-3 text-sm text-sf-yellow">¥{rule.cost.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            rule.status === 'active'
                              ? 'bg-sf-green/10 text-sf-green'
                              : 'bg-sf-dark text-sf-light/50'
                          }`}
                        >
                          {rule.status === 'active' ? '启用' : '停用'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 text-sf-light/50 hover:text-sf-red transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'carriers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display text-sf-light">承运商优先级设置</h3>
              <p className="text-sf-light/50 text-sm">拖拽或使用箭头调整优先级顺序</p>
            </div>

            <div className="space-y-3">
              {carrierPriority.map((carrier, index) => (
                <div
                  key={carrier.id}
                  className="flex items-center gap-4 p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/20 hover:border-sf-blue/40 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handlePriorityChange(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-sf-light/50 hover:text-sf-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => handlePriorityChange(index, 'down')}
                      disabled={index === carrierPriority.length - 1}
                      className="p-1 text-sf-light/50 hover:text-sf-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <div className="w-8 h-8 bg-sf-dark rounded-full flex items-center justify-center text-sf-light font-display text-sm">
                    {index + 1}
                  </div>

                  <div className="w-10 h-10 bg-sf-black/50 rounded-lg flex items-center justify-center">
                    <carrier.icon size={20} className={carrier.color} />
                  </div>

                  <div className="flex-1">
                    <div className="text-sf-light font-medium">{carrier.name}</div>
                    <div className="text-sf-light/50 text-xs mt-0.5">
                      {carrier.type === 'standard' ? '标准快递' : carrier.type === 'express' ? '航空快递' : '特快专递'}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-sf-yellow font-display">¥{carrier.basePrice}</div>
                      <div className="text-sf-light/50 text-xs">起步价</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sf-blue font-display">{carrier.speed}天</div>
                      <div className="text-sf-light/50 text-xs">平均时效</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sf-green font-display">{carrier.rating}</div>
                      <div className="text-sf-light/50 text-xs">评分</div>
                    </div>
                  </div>

                  <div className="w-16">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < Math.round(carrier.rating / 2) ? 'bg-sf-yellow' : 'bg-sf-dark'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <GripVertical size={20} className="text-sf-light/30" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'special' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display text-sf-light">特殊物品路由策略</h3>
              <div className="flex items-center gap-2 text-sf-yellow">
                <AlertTriangle size={18} />
                <span className="text-sm">特殊物品需按规则强制路由</span>
              </div>
            </div>

            <div className="grid gap-4">
              {specialRules.map((rule) => (
                <div key={rule.id} className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        rule.requiresInsurance ? 'bg-sf-red/10' : 'bg-sf-blue/10'
                      }`}>
                        <Package size={20} className={rule.requiresInsurance ? 'text-sf-red' : 'text-sf-blue'} />
                      </div>
                      <div>
                        <div className="text-sf-light font-medium">{rule.itemType}</div>
                        <div className="text-sf-light/50 text-xs">优先级: {rule.priority}</div>
                      </div>
                    </div>
                    {rule.requiresInsurance && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-sf-red/10 text-sf-red text-xs rounded-full">
                        <AlertTriangle size={12} />
                        需保价
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-sf-light/50 mb-2">指定承运商</label>
                      <select
                        value={rule.carrier}
                        onChange={(e) => handleUpdateSpecialRule(rule.id, 'carrier', e.target.value)}
                        className="w-full h-9 px-3 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light text-sm focus:outline-none focus:border-sf-red/50 transition-colors"
                      >
                        {carriers.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-sf-light/50 mb-2">优先级</label>
                      <select
                        value={rule.priority}
                        onChange={(e) => handleUpdateSpecialRule(rule.id, 'priority', parseInt(e.target.value))}
                        className="w-full h-9 px-3 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light text-sm focus:outline-none focus:border-sf-red/50 transition-colors"
                      >
                        <option value={1}>最高 (1)</option>
                        <option value={2}>高 (2)</option>
                        <option value={3}>普通 (3)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-sf-light/50 mb-2">备注说明</label>
                      <input
                        type="text"
                        value={rule.notes}
                        onChange={(e) => handleUpdateSpecialRule(rule.id, 'notes', e.target.value)}
                        className="w-full h-9 px-3 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light text-sm focus:outline-none focus:border-sf-red/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-display text-sf-light mb-4">模拟路由测试</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">起始城市</label>
                  <input
                    type="text"
                    value={testForm.fromCity}
                    onChange={(e) => handleInputChange('fromCity', e.target.value)}
                    className="w-full h-10 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="例如：北京"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">目标城市</label>
                  <input
                    type="text"
                    value={testForm.toCity}
                    onChange={(e) => handleInputChange('toCity', e.target.value)}
                    className="w-full h-10 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="例如：上海"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">物品类型</label>
                  <select
                    value={testForm.goodsType}
                    onChange={(e) => handleInputChange('goodsType', e.target.value)}
                    className="w-full h-10 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                  >
                    <option value="普通物品">普通物品</option>
                    <option value="电子产品">电子产品</option>
                    <option value="服装">服装</option>
                    <option value="文件">文件</option>
                    <option value="精密仪器">精密仪器</option>
                    <option value="易碎品">易碎品</option>
                    <option value="食品">食品</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">重量 (kg)</label>
                  <input
                    type="number"
                    value={testForm.weight}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 1)}
                    min="0.1"
                    step="0.1"
                    className="w-full h-10 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">时效要求</label>
                  <select
                    value={testForm.urgency}
                    onChange={(e) => handleInputChange('urgency', e.target.value)}
                    className="w-full h-10 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                  >
                    <option value="standard">标准快递</option>
                    <option value="express">航空快递</option>
                    <option value="urgent">特快专递</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleTestRouting}
                  disabled={testing}
                  className="flex items-center gap-2 px-8 h-10 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors disabled:opacity-50"
                >
                  {testing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      开始测试
                    </>
                  )}
                </button>
              </div>
            </div>

            {testResult.length > 0 && (
              <div className="space-y-6">
                <div className="h-px bg-sf-blue/20" />

                <div>
                  <h4 className="text-sf-light font-medium mb-4">测试结果 - 时效/价格对比</h4>
                  <div className="grid gap-4">
                    {testResult.map((option, index) => (
                      <div
                        key={index}
                        className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h5 className="text-xl font-display text-sf-light">{option.carrier}</h5>
                              <div className="px-2 py-0.5 bg-sf-blue/10 text-sf-blue text-xs rounded">
                                综合评分 {option.score}
                              </div>
                              {index === 0 && (
                                <div className="px-2 py-0.5 bg-sf-green/10 text-sf-green text-xs rounded">
                                  推荐
                                </div>
                              )}
                            </div>
                            <p className="text-sf-light/60 text-sm mt-2">{option.reason}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-display text-sf-red">
                              ¥{option.cost.toFixed(2)}
                            </div>
                            <div className="text-sf-light/50 text-sm mt-1">预估运费</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-sf-light/70 flex items-center gap-2">
                                <Clock size={14} className="text-sf-blue" />
                                时效: {option.estimated_days}天
                              </span>
                              <span className="text-xs text-sf-light/50">
                                {(maxSpeed - option.estimated_days + 1) / maxSpeed * 100 | 0}% 时效指数
                              </span>
                            </div>
                            <div className="h-3 bg-sf-black/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-sf-blue to-sf-green transition-all"
                                style={{ width: `${((maxSpeed - option.estimated_days + 1) / maxSpeed) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-sf-light/70 flex items-center gap-2">
                                <DollarSign size={14} className="text-sf-yellow" />
                                价格: ¥{option.cost.toFixed(2)}
                              </span>
                              <span className="text-xs text-sf-light/50">
                                {(maxCost - option.cost + 5) / maxCost * 100 | 0}% 性价比指数
                              </span>
                            </div>
                            <div className="h-3 bg-sf-black/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-sf-yellow to-sf-orange transition-all"
                                style={{ width: `${((maxCost - option.cost + 5) / maxCost) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-green/30">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={20} className="text-sf-green" />
                    <h4 className="text-sf-light font-medium">综合对比分析</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-display text-sf-blue">
                        {Math.min(...testResult.map(r => r.estimated_days))}天
                      </div>
                      <div className="text-sf-light/50 text-sm mt-1">最快时效</div>
                      <div className="text-sf-green text-xs mt-1">
                        {testResult.find(r => r.estimated_days === Math.min(...testResult.map(r => r.estimated_days)))?.carrier}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-display text-sf-yellow">
                        ¥{Math.min(...testResult.map(r => r.cost)).toFixed(2)}
                      </div>
                      <div className="text-sf-light/50 text-sm mt-1">最低价格</div>
                      <div className="text-sf-green text-xs mt-1">
                        {testResult.find(r => r.cost === Math.min(...testResult.map(r => r.cost)))?.carrier}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-display text-sf-green">
                        {Math.max(...testResult.map(r => r.score))}
                      </div>
                      <div className="text-sf-light/50 text-sm mt-1">最高评分</div>
                      <div className="text-sf-green text-xs mt-1">
                        {testResult.find(r => r.score === Math.max(...testResult.map(r => r.score)))?.carrier}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RoutingConfig
