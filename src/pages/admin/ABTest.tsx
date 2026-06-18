import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FlaskConical, Eye, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getABTests, createABTest, completeABTest } from '@/services/api'
import { useScenicStore } from '@/store/useScenicStore'
import type { ABTest as ABTestType } from '@/types'

const statusConfig = {
  running: { label: '进行中', color: 'text-emerald-400', bg: 'bg-emerald-400/10', pulse: true },
  completed: { label: '已完成', color: 'text-gray-400', bg: 'bg-gray-400/10', pulse: false },
  pending: { label: '待启动', color: 'text-amber-500', bg: 'bg-amber-500/10', pulse: false },
}

function VariantBar({ label, impressions, rate }: { label: string; impressions: number; rate: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono text-gray-300">{impressions.toLocaleString()} 次展示</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rate * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            label === 'Variant A' ? 'bg-indigo-600' : 'bg-amber-600'
          )}
        />
      </div>
      <div className="text-right font-mono text-xs text-gray-500">
        转化率 {(rate * 100).toFixed(1)}%
      </div>
    </div>
  )
}

export default function ABTest() {
  const [tests, setTests] = useState<ABTestType[]>([])
  const [scenicFilter, setScenicFilter] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', scenicId: '', variantA: '', variantB: '' })
  const { scenicAreas, loadScenicAreas } = useScenicStore()

  useEffect(() => {
    loadScenicAreas()
  }, [loadScenicAreas])

  useEffect(() => {
    const data = getABTests(scenicFilter || undefined)
    setTests(data)
  }, [scenicFilter])

  const handleCreate = () => {
    if (!form.name || !form.scenicId || !form.variantA || !form.variantB) return
    createABTest({
      scenicId: form.scenicId,
      name: form.name,
      description: '',
      variantA: form.variantA,
      variantB: form.variantB,
      status: 'pending',
      startDate: new Date().toISOString(),
      metrics: {
        variantAImpressions: 0,
        variantBImpressions: 0,
        variantAConversions: 0,
        variantBConversions: 0,
        variantAConversionRate: 0,
        variantBConversionRate: 0,
      },
    })
    setShowModal(false)
    setForm({ name: '', scenicId: '', variantA: '', variantB: '' })
    setTests(getABTests(scenicFilter || undefined))
  }

  const handleComplete = (id: string) => {
    completeABTest(id)
    setTests(getABTests(scenicFilter || undefined))
  }

  const getScenicName = (scenicId: string) =>
    scenicAreas.find((s) => s.id === scenicId)?.name ?? scenicId

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-amber-600" />
          <h1 className="text-2xl font-semibold text-gray-100">AB测试中心</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-900 px-4 py-2 text-sm text-gray-100 transition hover:bg-indigo-800"
        >
          <Plus className="h-4 w-4" />
          新建测试
        </button>
      </div>

      <div className="mb-6">
        <select
          value={scenicFilter}
          onChange={(e) => setScenicFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#1E1E2E] px-3 py-2 text-sm text-gray-300 outline-none focus:border-indigo-800"
        >
          <option value="">全部景区</option>
          {scenicAreas.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {tests.map((test, i) => {
            const cfg = statusConfig[test.status]
            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-100">{test.name}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">{getScenicName(test.scenicId)}</p>
                  </div>
                  <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', cfg.bg, cfg.color)}>
                    {cfg.pulse && <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>}
                    {cfg.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <VariantBar
                    label="Variant A"
                    impressions={test.metrics.variantAImpressions}
                    rate={test.metrics.variantAConversionRate}
                  />
                  <VariantBar
                    label="Variant B"
                    impressions={test.metrics.variantBImpressions}
                    rate={test.metrics.variantBConversionRate}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-gray-500">
                  <div className="flex gap-4">
                    <span>A: {test.variantA}</span>
                    <span>B: {test.variantB}</span>
                  </div>
                  <div className="flex gap-2">
                    {test.status === 'running' && (
                      <button
                        onClick={() => handleComplete(test.id)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-emerald-400 transition hover:bg-emerald-400/10"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        完成测试
                      </button>
                    )}
                    <button className="flex items-center gap-1 rounded px-2 py-1 text-gray-400 transition hover:bg-white/5">
                      <Eye className="h-3.5 w-3.5" />
                      查看详情
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-white/10 bg-[#1E1E2E] p-6"
            >
              <h2 className="mb-4 text-lg font-semibold text-gray-100">新建AB测试</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">测试名称</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">选择景区</label>
                  <select
                    value={form.scenicId}
                    onChange={(e) => setForm((f) => ({ ...f, scenicId: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-800"
                  >
                    <option value="">请选择景区</option>
                    {scenicAreas.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">变体A名称</label>
                  <input
                    value={form.variantA}
                    onChange={(e) => setForm((f) => ({ ...f, variantA: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">变体B名称</label>
                  <input
                    value={form.variantB}
                    onChange={(e) => setForm((f) => ({ ...f, variantB: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-800"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 transition hover:bg-white/5"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="rounded-lg bg-indigo-900 px-4 py-2 text-sm text-gray-100 transition hover:bg-indigo-800"
                >
                  创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
