import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, Save, Clock, Tag } from 'lucide-react'
import { apiGet, apiPost } from '@/utils/api'

export default function ShowtimeConfig() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [zones, setZones] = useState<any[]>([
    { name: 'VIP区', color: '#D4AF37', rows: 3, cols: 6, sortOrder: 0 },
    { name: 'A区', color: '#8B1A2B', rows: 5, cols: 8, sortOrder: 1 },
    { name: 'B区', color: '#1E88E5', rows: 6, cols: 10, sortOrder: 2 },
  ])
  const [pricingTiers, setPricingTiers] = useState<any[]>([
    { name: '早鸟票', tierType: 'early_bird', price: 280, quota: 100 },
    { name: '预售票', tierType: 'presale', price: 580, quota: 200 },
    { name: '全价票', tierType: 'full', price: 880, quota: 500 },
    { name: 'VIP票', tierType: 'vip', price: 1680, quota: 80 },
  ])
  const [startTime, setStartTime] = useState('2026-06-20 19:30')
  const [saleStartTime, setSaleStartTime] = useState('2026-06-10 10:00')
  const [presaleStartTime, setPresaleStartTime] = useState('2026-06-08 10:00')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiPost('/showtimes', {
        eventId: parseInt(id || '1'),
        startTime,
        saleStartTime,
        presaleStartTime,
        zones,
        pricingTiers,
      })
      alert('保存成功！')
      navigate('/organizer/events')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const addZone = () => {
    const colors = ['#D4AF37', '#8B1A2B', '#1E88E5', '#43A047', '#8E24AA']
    setZones([
      ...zones,
      { name: `新区${zones.length + 1}`, color: colors[zones.length % colors.length], rows: 5, cols: 8, sortOrder: zones.length },
    ])
  }

  const removeZone = (idx: number) => {
    setZones(zones.filter((_, i) => i !== idx))
  }

  const addTier = () => {
    setPricingTiers([...pricingTiers, { name: '新票价', tierType: 'discount', price: 380, quota: 100 }])
  }

  const removeTier = (idx: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== idx))
  }

  return (
    <div className="min-h-screen bg-gradient-dark pb-32">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="flex-1" />
          <span className="text-gold-400 text-sm">场次配置</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="font-display text-3xl text-gold-400 mb-8">场次配置</h1>

        <div className="glass-card p-6 mb-8">
          <h2 className="section-title mb-6">
            <Clock size={20} className="inline mr-2" />
            时间设置
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-carbon-400 mb-2">演出开始时间</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm text-carbon-400 mb-2">正式开售时间</label>
              <input
                type="text"
                value={saleStartTime}
                onChange={(e) => setSaleStartTime(e.target.value)}
                className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm text-carbon-400 mb-2">预售开始时间</label>
              <input
                type="text"
                value={presaleStartTime}
                onChange={(e) => setPresaleStartTime(e.target.value)}
                className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none transition"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">座位分区配置</h2>
            <button onClick={addZone} className="wine-gradient-btn text-sm flex items-center gap-2">
              <Plus size={16} />
              添加分区
            </button>
          </div>
          <div className="space-y-4">
            {zones.map((zone, idx) => (
              <div key={idx} className="border border-carbon-700 rounded-xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  <input
                    type="color"
                    value={zone.color}
                    onChange={(e) => {
                      const newZones = [...zones]
                      newZones[idx].color = e.target.value
                      setZones(newZones)
                    }}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border border-carbon-600"
                  />
                  <input
                    type="text"
                    value={zone.name}
                    onChange={(e) => {
                      const newZones = [...zones]
                      newZones[idx].name = e.target.value
                      setZones(newZones)
                    }}
                    className="flex-1 bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none transition"
                  />
                  <button
                    onClick={() => removeZone(idx)}
                    className="text-wine-400 hover:text-wine-300 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-carbon-400 block mb-1">排数</label>
                    <input
                      type="number"
                      value={zone.rows}
                      min={1}
                      onChange={(e) => {
                        const newZones = [...zones]
                        newZones[idx].rows = parseInt(e.target.value) || 1
                        setZones(newZones)
                      }}
                      className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-carbon-400 block mb-1">列数</label>
                    <input
                      type="number"
                      value={zone.cols}
                      min={1}
                      onChange={(e) => {
                        const newZones = [...zones]
                        newZones[idx].cols = parseInt(e.target.value) || 1
                        setZones(newZones)
                      }}
                      className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500 outline-none"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-carbon-400 mb-2">预览 ({zone.rows * zone.cols} 座)</div>
                  <div className="flex flex-col items-center gap-1">
                    {Array.from({ length: Math.min(zone.rows, 4) }).map((_, r) => (
                      <div key={r} className="flex gap-1">
                        {Array.from({ length: Math.min(zone.cols, 10) }).map((_, c) => (
                          <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: zone.color, opacity: 0.7 }} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">
              <Tag size={20} className="inline mr-2" />
              阶梯票价策略
            </h2>
            <button onClick={addTier} className="wine-gradient-btn text-sm flex items-center gap-2">
              <Plus size={16} />
              添加票价
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pricingTiers.map((tier, idx) => (
              <div key={idx} className="border border-carbon-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => {
                      const newTiers = [...pricingTiers]
                      newTiers[idx].name = e.target.value
                      setPricingTiers(newTiers)
                    }}
                    className="flex-1 bg-transparent text-white font-medium focus:outline-none"
                  />
                  <button
                    onClick={() => removeTier(idx)}
                    className="text-wine-400 hover:text-wine-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-carbon-400 block mb-1">价格 (¥)</label>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => {
                        const newTiers = [...pricingTiers]
                        newTiers[idx].price = parseFloat(e.target.value) || 0
                        setPricingTiers(newTiers)
                      }}
                      className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-carbon-400 block mb-1">配额</label>
                    <input
                      type="number"
                      value={tier.quota}
                      onChange={(e) => {
                        const newTiers = [...pricingTiers]
                        newTiers[idx].quota = parseInt(e.target.value) || 0
                        setPricingTiers(newTiers)
                      }}
                      className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500 outline-none"
                    />
                  </div>
                </div>
                <select
                  value={tier.tierType}
                  onChange={(e) => {
                    const newTiers = [...pricingTiers]
                    newTiers[idx].tierType = e.target.value
                    setPricingTiers(newTiers)
                  }}
                  className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500 outline-none"
                >
                  <option value="early_bird">早鸟票</option>
                  <option value="presale">预售票</option>
                  <option value="full">全价票</option>
                  <option value="vip">VIP票</option>
                  <option value="discount">折扣票</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-carbon-950/95 backdrop-blur-xl border-t border-carbon-800">
        <div className="container mx-auto flex justify-end gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 rounded-lg border border-carbon-600 text-carbon-300 hover:text-white transition"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="gold-gradient-btn px-12 py-3 font-bold flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  )
}
