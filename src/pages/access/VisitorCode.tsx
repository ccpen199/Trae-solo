import { useState, useEffect } from 'react'
import { Plus, Clock, Copy, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

interface VisitorCode {
  id: string
  code: string
  validHours: number
  maxUses: number
  usedCount: number
  expiresAt: string
  createdAt: string
}

export default function VisitorCode() {
  const [showForm, setShowForm] = useState(false)
  const [validHours, setValidHours] = useState(24)
  const [maxUses, setMaxUses] = useState(3)
  const [codes, setCodes] = useState<VisitorCode[]>([
    { id: '1', code: 'VC-839201', validHours: 24, maxUses: 3, usedCount: 1, expiresAt: '2026-06-11 10:30:00', createdAt: '2026-06-10 10:30:00' },
    { id: '2', code: 'VC-728456', validHours: 48, maxUses: 5, usedCount: 3, expiresAt: '2026-06-12 08:00:00', createdAt: '2026-06-10 08:00:00' },
  ])
  const [countdowns, setCountdowns] = useState<Record<string, string>>({})

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      const next: Record<string, string> = {}
      codes.forEach((c) => {
        const diff = new Date(c.expiresAt).getTime() - now
        if (diff <= 0) { next[c.id] = '已过期'; return }
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        next[c.id] = `${h}时${m}分${s}秒`
      })
      setCountdowns(next)
    }, 1000)
    return () => clearInterval(timer)
  }, [codes])

  const handleGenerate = () => {
    const newCode: VisitorCode = {
      id: Date.now().toString(),
      code: `VC-${Math.floor(100000 + Math.random() * 900000)}`,
      validHours,
      maxUses,
      usedCount: 0,
      expiresAt: new Date(Date.now() + validHours * 3600000).toISOString().replace('T', ' ').slice(0, 19),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }
    setCodes((prev) => [newCode, ...prev])
    setShowForm(false)
  }

  const handleRevoke = (id: string) => {
    setCodes((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="访客码管理"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="h-9 px-4 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
          >
            <Plus size={16} />生成访客码
          </button>
        }
      />

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">生成新访客码</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">有效时长（小时）</label>
              <select
                value={validHours}
                onChange={(e) => setValidHours(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={6}>6小时</option>
                <option value={12}>12小时</option>
                <option value={24}>24小时</option>
                <option value={48}>48小时</option>
                <option value={72}>72小时</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">最大使用次数</label>
              <select
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={1}>1次</option>
                <option value={3}>3次</option>
                <option value={5}>5次</option>
                <option value={10}>10次</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleGenerate} className="h-9 px-6 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">确认生成</button>
            <button onClick={() => setShowForm(false)} className="h-9 px-6 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">取消</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {codes.map((code) => (
          <div key={code.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-slate-800">{code.code}</span>
                <button className="p-1 text-slate-400 hover:text-emerald-500 transition-colors" title="复制">
                  <Copy size={14} />
                </button>
              </div>
              <button onClick={() => handleRevoke(code.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="作废">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-slate-400">有效时长</div>
                <div className="text-sm font-medium text-slate-700">{code.validHours}h</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">已用/次数</div>
                <div className="text-sm font-medium text-slate-700">{code.usedCount}/{code.maxUses}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">剩余时间</div>
                <div className="text-sm font-medium text-emerald-600 flex items-center justify-center gap-1">
                  <Clock size={12} />
                  {countdowns[code.id] || '--'}
                </div>
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(code.usedCount / code.maxUses) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex justify-center">
              <div className="w-28 h-28 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center">
                <div className="text-xs text-slate-400 text-center">二维码<br/>占位区域</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
