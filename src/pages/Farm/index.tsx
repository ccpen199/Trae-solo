import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Crop, Droplets, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { farmPlots } from '@/mocks'
import type { FarmPlot } from '@/types'

const cropOptions = [...new Set(farmPlots.map(p => p.crop))]
const soilOptions = [...new Set(farmPlots.map(p => p.soilType))]

const cropBadgeColor: Record<string, string> = {
  '水稻': 'bg-green-100 text-green-700',
  '西红柿': 'bg-red-100 text-red-700',
  '苹果': 'bg-rose-100 text-rose-700',
}

function getLastRecordDate(plot: FarmPlot): string {
  if (plot.records.length === 0) return '暂无记录'
  return plot.records[plot.records.length - 1].date
}

interface FormData {
  name: string
  crop: string
  area: string
  soilType: string
  lat: string
  lng: string
}

const initialForm: FormData = {
  name: '',
  crop: '水稻',
  area: '',
  soilType: '黑土',
  lat: '',
  lng: '',
}

export default function FarmPage() {
  const navigate = useNavigate()
  const [cropFilter, setCropFilter] = useState<string>('all')
  const [soilFilter, setSoilFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(initialForm)
  const [plots, setPlots] = useState<FarmPlot[]>(farmPlots)
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState(false)

  useEffect(() => {
    if (newlyAddedId) {
      const timer = setTimeout(() => setNewlyAddedId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [newlyAddedId])

  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => setSuccessBanner(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [successBanner])

  const filtered = useMemo(() => {
    return plots.filter(p => {
      if (cropFilter !== 'all' && p.crop !== cropFilter) return false
      if (soilFilter !== 'all' && p.soilType !== soilFilter) return false
      return true
    })
  }, [plots, cropFilter, soilFilter])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.area || !form.lat || !form.lng) return
    const newId = `FP-${Date.now()}`
    const newPlot: FarmPlot = {
      id: newId,
      name: form.name.trim(),
      crop: form.crop,
      area: Number(form.area),
      soilType: form.soilType,
      location: { lat: Number(form.lat), lng: Number(form.lng) },
      records: [],
    }
    setPlots(prev => [...prev, newPlot])
    setNewlyAddedId(newId)
    setShowForm(false)
    setForm(initialForm)
    setSuccessBanner(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-earth-500">种植档案管理</h1>
          <p className="text-gray-500 mt-1">地块管理与农事记录</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
        >
          <Plus size={18} />
          新增地块
        </button>
      </div>

      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            新增成功
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Crop size={16} className="text-gray-400" />
          <select
            value={cropFilter}
            onChange={e => setCropFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
          >
            <option value="all">全部作物</option>
            {cropOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-gray-400" />
          <select
            value={soilFilter}
            onChange={e => setSoilFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
          >
            <option value="all">全部土壤</option>
            {soilOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((plot, i) => (
          <motion.div
            key={plot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(`/farm/plot/${plot.id}`)}
            className={`bg-white rounded-lg shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer overflow-hidden ${
              newlyAddedId === plot.id
                ? 'border-2 border-primary-400'
                : 'border border-gray-100'
            }`}
          >
            <div className="h-32 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative">
              <MapPin size={32} className="text-primary-400" />
              <span className="absolute bottom-2 right-3 text-xs text-primary-500 bg-white/80 px-2 py-0.5 rounded">
                {plot.location.lat.toFixed(2)}°N, {plot.location.lng.toFixed(2)}°E
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg font-semibold text-earth-500">{plot.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${cropBadgeColor[plot.crop] ?? 'bg-gray-100 text-gray-600'}`}>
                  {plot.crop}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span>{plot.area} 亩</span>
                <span className="text-gray-300">|</span>
                <span>{plot.soilType}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>农事记录 {plot.records.length} 条</span>
                <span>最近 {getLastRecordDate(plot)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          没有匹配的地块
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-xl font-semibold text-earth-500">新增地块</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地块名称 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                    placeholder="请输入地块名称"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">作物类型</label>
                    <select
                      value={form.crop}
                      onChange={e => setForm(f => ({ ...f, crop: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                    >
                      <option value="水稻">水稻</option>
                      <option value="西红柿">西红柿</option>
                      <option value="苹果">苹果</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">面积（亩）</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      value={form.area}
                      onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">土壤类型</label>
                  <select
                    value={form.soilType}
                    onChange={e => setForm(f => ({ ...f, soilType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                  >
                    <option value="黑土">黑土</option>
                    <option value="壤土">壤土</option>
                    <option value="沙壤土">沙壤土</option>
                    <option value="粘土">粘土</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">经度</label>
                    <input
                      type="number"
                      required
                      step="0.0001"
                      value={form.lat}
                      onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      placeholder="如: 44.9087"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">纬度</label>
                    <input
                      type="number"
                      required
                      step="0.0001"
                      value={form.lng}
                      onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      placeholder="如: 127.1567"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
