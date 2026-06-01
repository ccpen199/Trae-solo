import React, { useState, useEffect } from 'react'
import {
  Settings,
  Thermometer,
  Dog,
  GlassWater,
  Battery,
  Plus,
  Edit3,
  Save,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Package,
  Ruler,
  Shield,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { Protocol } from '../../api/types'

const categoryConfig = {
  medicine: { 
    label: '药品温控', 
    icon: Thermometer, 
    color: 'text-sf-green', 
    bg: 'bg-sf-green/10',
    border: 'border-sf-green/30'
  },
  pet: { 
    label: '宠物运输', 
    icon: Dog, 
    color: 'text-sf-yellow', 
    bg: 'bg-sf-yellow/10',
    border: 'border-sf-yellow/30'
  },
  fragile: { 
    label: '易碎品', 
    icon: GlassWater, 
    color: 'text-sf-orange', 
    bg: 'bg-sf-orange/10',
    border: 'border-sf-orange/30'
  },
  battery: { 
    label: '锂电池', 
    icon: Battery, 
    color: 'text-sf-red', 
    bg: 'bg-sf-red/10',
    border: 'border-sf-red/30'
  },
}

const applicableItems = {
  medicine: ['处方药', '生物制剂', '疫苗', '血液制品', '胰岛素', '其他药品'],
  pet: ['猫', '狗', '小型哺乳动物', '鸟类', '爬行动物', '其他宠物'],
  fragile: ['玻璃制品', '陶瓷', '精密仪器', '显示屏', '酒类', '其他易碎品'],
  battery: ['手机电池', '笔记本电池', '充电宝', '动力电池', '纽扣电池', '其他锂电池'],
}

const ProtocolConfig: React.FC = () => {
  const { addNotification } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  
  const [editForm, setEditForm] = useState<Partial<Protocol>>({
    name: '',
    category: 'medicine',
    requirements: '',
    temperature_range: '',
    container_spec: '',
    active: 1,
  })

  const [newProtocol, setNewProtocol] = useState<Partial<Protocol>>({
    name: '',
    category: 'medicine',
    requirements: '',
    temperature_range: '',
    container_spec: '',
    active: 1,
  })

  const [selectedItems, setSelectedItems] = useState<Record<number, string[]>>({})

  const fetchProtocols = async () => {
    setLoading(true)
    try {
      const result = await api.express.protocols.list()
      if (result.success && result.data) {
        const data = result.data as Protocol[]
        setProtocols(data)
        const items: Record<number, string[]> = {}
        data.forEach(p => {
          items[p.id] = applicableItems[p.category as keyof typeof applicableItems]?.slice(0, 3) || []
        })
        setSelectedItems(items)
      }
    } catch (error) {
      const mockData: Protocol[] = [
        { id: 1, name: '药品冷链运输协议', category: 'medicine', requirements: '全程冷链2-8℃，温度实时监控，每30分钟记录一次', temperature_range: '2-8℃', active: 1 },
        { id: 2, name: '生物制剂温控协议', category: 'medicine', requirements: '干冰保温，温度≤-15℃，禁止倒置', temperature_range: '-15℃以下', active: 1 },
        { id: 3, name: '宠物航空运输协议', category: 'pet', requirements: '航空箱规格：长50cm×宽40cm×高30cm，配备饮水装置，通风良好', container_spec: '50×40×30cm', active: 1 },
        { id: 4, name: '宠物陆运协议', category: 'pet', requirements: '航空箱规格：长60cm×宽45cm×高40cm，每隔2小时通风一次', container_spec: '60×45×40cm', active: 0 },
        { id: 5, name: '易碎品包装标准', category: 'fragile', requirements: '气泡膜包裹3层+泡沫箱+木架加固，贴易碎标签，轻放标识', active: 1 },
        { id: 6, name: '精密仪器运输协议', category: 'fragile', requirements: '定制海绵内衬+铝合金箱+防震标签，专人押运', active: 1 },
        { id: 7, name: '锂电池航空规范', category: 'battery', requirements: '绝缘包装，功率≤100Wh，单独隔离，禁止托运，仅限随身', active: 1 },
        { id: 8, name: '动力电池运输协议', category: 'battery', requirements: '防火防爆箱包装，SOC≤30%，配备灭火器，专车运输', active: 0 },
      ]
      setProtocols(mockData)
      const items: Record<number, string[]> = {}
      mockData.forEach(p => {
        items[p.id] = applicableItems[p.category as keyof typeof applicableItems]?.slice(0, 3) || []
      })
      setSelectedItems(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProtocols()
  }, [])

  const filteredProtocols = protocols.filter(p => {
    const matchesTab = activeTab === 'all' || p.category === activeTab
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.requirements.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handleToggleActive = async (id: number) => {
    const protocol = protocols.find(p => p.id === id)
    if (!protocol) return

    try {
      const result = await api.express.protocols.update(id, {
        ...protocol,
        active: protocol.active === 1 ? 0 : 1,
      })
      if (result.success) {
        setProtocols(prev => prev.map(p => 
          p.id === id ? { ...p, active: p.active === 1 ? 0 : 1 } : p
        ))
        addNotification({ type: 'success', message: `协议已${protocol.active === 1 ? '禁用' : '启用'}` })
      }
    } catch (error) {
      setProtocols(prev => prev.map(p => 
        p.id === id ? { ...p, active: p.active === 1 ? 0 : 1 } : p
      ))
      addNotification({ type: 'success', message: `协议已${protocol.active === 1 ? '禁用' : '启用'}` })
    }
  }

  const handleEdit = (protocol: Protocol) => {
    setEditingId(protocol.id)
    setEditForm({ ...protocol })
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name || !editForm.requirements) {
      addNotification({ type: 'error', message: '请填写完整的协议信息' })
      return
    }

    setSaving(true)
    try {
      const result = await api.express.protocols.update(editingId, editForm)
      if (result.success) {
        setProtocols(prev => prev.map(p => 
          p.id === editingId ? { ...p, ...editForm } as Protocol : p
        ))
        setEditingId(null)
        addNotification({ type: 'success', message: '协议更新成功' })
      }
    } catch (error) {
      setProtocols(prev => prev.map(p => 
        p.id === editingId ? { ...p, ...editForm } as Protocol : p
      ))
      setEditingId(null)
      addNotification({ type: 'success', message: '协议更新成功' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddProtocol = async () => {
    if (!newProtocol.name || !newProtocol.requirements) {
      addNotification({ type: 'error', message: '请填写完整的协议信息' })
      return
    }

    setSaving(true)
    try {
      const result = await api.express.protocols.create(newProtocol)
      if (result.success && result.data) {
        const created = result.data as Protocol
        setProtocols(prev => [...prev, created])
        setSelectedItems(prev => ({
          ...prev,
          [created.id]: applicableItems[created.category as keyof typeof applicableItems]?.slice(0, 3) || [],
        }))
        setShowAddForm(false)
        setNewProtocol({
          name: '',
          category: 'medicine',
          requirements: '',
          temperature_range: '',
          container_spec: '',
          active: 1,
        })
        addNotification({ type: 'success', message: '协议创建成功' })
      }
    } catch (error) {
      const created: Protocol = {
        id: Date.now(),
        name: newProtocol.name || '',
        category: newProtocol.category || 'medicine',
        requirements: newProtocol.requirements || '',
        temperature_range: newProtocol.temperature_range,
        container_spec: newProtocol.container_spec,
        active: newProtocol.active ?? 1,
      }
      setProtocols(prev => [...prev, created])
      setSelectedItems(prev => ({
        ...prev,
        [created.id]: applicableItems[created.category as keyof typeof applicableItems]?.slice(0, 3) || [],
      }))
      setShowAddForm(false)
      setNewProtocol({
        name: '',
        category: 'medicine',
        requirements: '',
        temperature_range: '',
        container_spec: '',
        active: 1,
      })
      addNotification({ type: 'success', message: '协议创建成功' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setProtocols(prev => prev.filter(p => p.id !== id))
    addNotification({ type: 'success', message: '协议已删除' })
  }

  const handleItemToggle = (protocolId: number, item: string) => {
    setSelectedItems(prev => {
      const current = prev[protocolId] || []
      const updated = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item]
      return { ...prev, [protocolId]: updated }
    })
  }

  const tabs = [
    { id: 'all', label: '全部协议', icon: Settings },
    { id: 'medicine', label: '药品温控', icon: Thermometer },
    { id: 'pet', label: '宠物运输', icon: Dog },
    { id: 'fragile', label: '易碎品', icon: GlassWater },
    { id: 'battery', label: '锂电池', icon: Battery },
  ]

  const stats = {
    total: protocols.length,
    active: protocols.filter(p => p.active === 1).length,
    medicine: protocols.filter(p => p.category === 'medicine').length,
    pet: protocols.filter(p => p.category === 'pet').length,
    fragile: protocols.filter(p => p.category === 'fragile').length,
    battery: protocols.filter(p => p.category === 'battery').length,
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-sf-light">特殊物品运输协议配置</h1>
        <p className="text-sf-light/50 text-sm mt-1">配置药品、宠物、易碎品、锂电池等特殊物品的运输规范</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="glass rounded-xl p-4 border border-sf-blue/30">
          <div className="text-3xl font-display text-sf-light">{stats.total}</div>
          <div className="text-xs text-sf-light/50 mt-1">协议总数</div>
        </div>
        <div className="glass rounded-xl p-4 border border-sf-green/30">
          <div className="text-3xl font-display text-sf-green">{stats.active}</div>
          <div className="text-xs text-sf-light/50 mt-1">已启用</div>
        </div>
        <div className="glass rounded-xl p-4 border border-sf-green/30">
          <div className="flex items-center gap-2">
            <Thermometer size={20} className="text-sf-green" />
            <span className="text-2xl font-display text-sf-light">{stats.medicine}</span>
          </div>
          <div className="text-xs text-sf-light/50 mt-1">药品温控</div>
        </div>
        <div className="glass rounded-xl p-4 border border-sf-yellow/30">
          <div className="flex items-center gap-2">
            <Dog size={20} className="text-sf-yellow" />
            <span className="text-2xl font-display text-sf-light">{stats.pet}</span>
          </div>
          <div className="text-xs text-sf-light/50 mt-1">宠物运输</div>
        </div>
        <div className="glass rounded-xl p-4 border border-sf-orange/30">
          <div className="flex items-center gap-2">
            <GlassWater size={20} className="text-sf-orange" />
            <span className="text-2xl font-display text-sf-light">{stats.fragile}</span>
          </div>
          <div className="text-xs text-sf-light/50 mt-1">易碎品</div>
        </div>
        <div className="glass rounded-xl p-4 border border-sf-red/30">
          <div className="flex items-center gap-2">
            <Battery size={20} className="text-sf-red" />
            <span className="text-2xl font-display text-sf-light">{stats.battery}</span>
          </div>
          <div className="text-xs text-sf-light/50 mt-1">锂电池</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 h-10 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-sf-red text-white'
                  : 'bg-sf-dark/50 border border-sf-blue/30 text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light'
              }`}
            >
              <tab.icon size={16} />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sf-light/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索协议..."
              className="w-full h-10 pl-10 pr-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
            />
          </div>
          <button
            onClick={fetchProtocols}
            disabled={loading}
            className="p-2 bg-sf-dark/50 border border-sf-blue/30 rounded-lg text-sf-light/70 hover:text-sf-light transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 h-10 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">新建协议</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass rounded-2xl p-6 border border-sf-blue/30 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display text-sf-light">新建运输协议</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 text-sf-light/50 hover:text-sf-light transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-sf-light/70 mb-2">协议名称</label>
              <input
                type="text"
                value={newProtocol.name}
                onChange={(e) => setNewProtocol(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                placeholder="例如：药品冷链运输协议"
              />
            </div>
            <div>
              <label className="block text-sm text-sf-light/70 mb-2">协议类别</label>
              <select
                value={newProtocol.category}
                onChange={(e) => setNewProtocol(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
              >
                <option value="medicine">药品温控</option>
                <option value="pet">宠物运输</option>
                <option value="fragile">易碎品</option>
                <option value="battery">锂电池</option>
              </select>
            </div>

            {newProtocol.category === 'medicine' && (
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">温度范围</label>
                <div className="relative">
                  <Thermometer size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sf-green" />
                  <input
                    type="text"
                    value={newProtocol.temperature_range}
                    onChange={(e) => setNewProtocol(prev => ({ ...prev, temperature_range: e.target.value }))}
                    className="w-full h-10 pl-10 pr-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="例如：2-8℃"
                  />
                </div>
              </div>
            )}

            {newProtocol.category === 'pet' && (
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">航空箱规格</label>
                <div className="relative">
                  <Ruler size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sf-yellow" />
                  <input
                    type="text"
                    value={newProtocol.container_spec}
                    onChange={(e) => setNewProtocol(prev => ({ ...prev, container_spec: e.target.value }))}
                    className="w-full h-10 pl-10 pr-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="例如：50×40×30cm"
                  />
                </div>
              </div>
            )}

            <div className={newProtocol.category === 'medicine' || newProtocol.category === 'pet' ? 'md:col-span-2' : 'md:col-span-2'}>
              <label className="block text-sm text-sf-light/70 mb-2">运输要求</label>
              <textarea
                value={newProtocol.requirements}
                onChange={(e) => setNewProtocol(prev => ({ ...prev, requirements: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors resize-none"
                placeholder="详细描述运输要求、包装标准、注意事项等..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddProtocol}
              disabled={saving}
              className="flex items-center gap-2 px-6 h-10 bg-sf-green text-white rounded-lg hover:bg-sf-green/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={18} />
                  保存协议
                </>
              )}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex items-center gap-2 px-6 h-10 border border-sf-blue/30 rounded-lg text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
            >
              <X size={18} />
              取消
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass rounded-2xl p-12 border border-sf-blue/30 flex items-center justify-center">
          <Loader2 size={32} className="text-sf-blue animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProtocols.map((protocol) => {
            const config = categoryConfig[protocol.category as keyof typeof categoryConfig]
            const isEditing = editingId === protocol.id

            return (
              <div
                key={protocol.id}
                className={`glass rounded-2xl p-6 border transition-all ${
                  config.border
                } ${
                  protocol.active === 0 ? 'opacity-60' : ''
                }`}
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-sf-light/70 mb-2">协议名称</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-sf-light/70 mb-2">协议类别</label>
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                        >
                          <option value="medicine">药品温控</option>
                          <option value="pet">宠物运输</option>
                          <option value="fragile">易碎品</option>
                          <option value="battery">锂电池</option>
                        </select>
                      </div>
                      {editForm.category === 'medicine' && (
                        <div>
                          <label className="block text-sm text-sf-light/70 mb-2">温度范围</label>
                          <input
                            type="text"
                            value={editForm.temperature_range}
                            onChange={(e) => setEditForm(prev => ({ ...prev, temperature_range: e.target.value }))}
                            className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                          />
                        </div>
                      )}
                      {editForm.category === 'pet' && (
                        <div>
                          <label className="block text-sm text-sf-light/70 mb-2">航空箱规格</label>
                          <input
                            type="text"
                            value={editForm.container_spec}
                            onChange={(e) => setEditForm(prev => ({ ...prev, container_spec: e.target.value }))}
                            className="w-full h-10 px-4 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                          />
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <label className="block text-sm text-sf-light/70 mb-2">运输要求</label>
                        <textarea
                          value={editForm.requirements}
                          onChange={(e) => setEditForm(prev => ({ ...prev, requirements: e.target.value }))}
                          rows={2}
                          className="w-full px-4 py-3 bg-sf-black/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 h-9 bg-sf-green text-white rounded-lg hover:bg-sf-green/90 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-2 px-4 h-9 border border-sf-blue/30 rounded-lg text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
                      >
                        <X size={16} />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center`}>
                          <config.icon size={24} className={config.color} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-display text-sf-light">{protocol.name}</h4>
                            <span className={`px-2 py-0.5 ${config.bg} ${config.color} text-xs rounded`}>
                              {config.label}
                            </span>
                            {protocol.active === 1 ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-sf-green/10 text-sf-green text-xs rounded">
                                <CheckCircle size={12} />
                                已启用
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-sf-dark text-sf-light/50 text-xs rounded">
                                已禁用
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-sf-light/50">
                            {protocol.temperature_range && (
                              <span className="flex items-center gap-1">
                                <Thermometer size={14} className="text-sf-green" />
                                {protocol.temperature_range}
                              </span>
                            )}
                            {protocol.container_spec && (
                              <span className="flex items-center gap-1">
                                <Ruler size={14} className="text-sf-yellow" />
                                {protocol.container_spec}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(protocol.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            protocol.active === 1
                              ? 'text-sf-green hover:bg-sf-green/10'
                              : 'text-sf-light/50 hover:bg-sf-dark'
                          }`}
                        >
                          {protocol.active === 1 ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                        <button
                          onClick={() => handleEdit(protocol)}
                          className="p-2 text-sf-blue hover:bg-sf-blue/10 rounded-lg transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(protocol.id)}
                          className="p-2 text-sf-light/50 hover:text-sf-red hover:bg-sf-red/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-sf-black/30 rounded-xl mb-4">
                      <div className="flex items-start gap-2">
                        <Shield size={16} className="text-sf-blue mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-sf-light/50 mb-1">运输要求</div>
                          <p className="text-sf-light/80 text-sm">{protocol.requirements}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Package size={14} className="text-sf-light/50" />
                        <span className="text-xs text-sf-light/50">适用物品类型</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {applicableItems[protocol.category as keyof typeof applicableItems]?.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleItemToggle(protocol.id, item)}
                            className={`px-3 py-1 rounded-full text-xs transition-all ${
                              selectedItems[protocol.id]?.includes(item)
                                ? 'bg-sf-red/10 text-sf-red border border-sf-red/30'
                                : 'bg-sf-dark text-sf-light/50 border border-sf-blue/20 hover:border-sf-blue/40'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}

          {filteredProtocols.length === 0 && (
            <div className="glass rounded-2xl p-12 border border-sf-blue/30 text-center">
              <AlertTriangle size={48} className="text-sf-yellow mx-auto mb-4 opacity-50" />
              <p className="text-sf-light/50">没有找到符合条件的协议</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProtocolConfig
