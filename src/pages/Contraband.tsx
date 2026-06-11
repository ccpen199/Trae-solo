import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { Upload, Search, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react'

type Tab = 'image' | 'text'
type RiskLevel = 'none' | 'low' | 'medium' | 'high'

interface DetectionResult {
  riskLevel: RiskLevel
  isContraband: boolean
  matchedItems: { name: string; category: string; risk: RiskLevel }[]
  description: string
}

interface LibraryItem {
  name: string
  category: string
  risk: RiskLevel
  keywords: string[]
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  none: { label: '通过', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  low: { label: '低风险', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  medium: { label: '中风险', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  high: { label: '高风险', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
}

const RISK_BADGE: Record<RiskLevel, string> = {
  none: 'badge-success',
  low: 'badge-warning',
  medium: 'badge-warning',
  high: 'badge-danger',
}

function riskBadgeCls(level: RiskLevel): string {
  if (level === 'medium') return 'badge bg-orange-500/15 text-orange-400 border border-orange-500/20 text-xs font-medium px-2 py-0.5 rounded-full'
  return RISK_BADGE[level]
}

export default function Contraband() {
  const [tab, setTab] = useState<Tab>('image')
  const [preview, setPreview] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [library, setLibrary] = useState<LibraryItem[]>([])
  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) {
      const dt = new DataTransfer()
      dt.items.add(file)
      if (fileRef.current) fileRef.current.files = dt.files
      setPreview(URL.createObjectURL(file))
    }
  }, [])

  const handleImageDetect = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/contraband/image', { method: 'POST', body: fd })
      const data: DetectionResult = await res.json()
      setResult(data)
    } catch { setResult(null) } finally { setLoading(false) }
  }

  const handleTextDetect = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/contraband/text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const data: DetectionResult = await res.json()
      setResult(data)
    } catch { setResult(null) } finally { setLoading(false) }
  }

  const handleReset = () => {
    setResult(null)
    setPreview(null)
    setText('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/contraband/library')
      const data: LibraryItem[] = await res.json()
      setLibrary(data)
    } catch {}
  }

  const filtered = library.filter((item) => {
    const q = search.toLowerCase()
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.keywords.some((k) => k.toLowerCase().includes(q))
  })

  const rc = result ? RISK_CONFIG[result.riskLevel] : null

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex border-b border-slate-800 mb-6">
            {(['image', 'text'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); handleReset() }}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'image' ? '图像识别' : '文本校验'}
              </button>
            ))}
          </div>

          {tab === 'image' && (
            <div className="space-y-5">
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="h-52 border-dashed border-2 border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors overflow-hidden"
              >
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-sm text-slate-500">上传物品图片进行AI识别</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button
                onClick={handleImageDetect}
                disabled={loading || !preview}
                className="btn-primary w-full flex items-center justify-center gap-2"
                style={loading || !preview ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {loading ? <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />识别中...</> : '开始识别'}
              </button>
            </div>
          )}

          {tab === 'text' && (
            <div className="space-y-5">
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="输入物品名称或描述进行违禁品校验"
                  rows={6}
                  className="input-field w-full resize-none pr-14"
                />
                <span className="absolute bottom-3 right-3 text-xs text-slate-500 font-mono-num">{text.length}</span>
              </div>
              <button
                onClick={handleTextDetect}
                disabled={loading || !text.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
                style={loading || !text.trim() ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {loading ? <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />校验中...</> : '开始校验'}
              </button>
            </div>
          )}
        </div>

        <div className="card flex flex-col">
          <h2 className="section-title">检测结果</h2>
          {!result ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">等待检测输入</div>
          ) : (
            <div className="space-y-5 animate-slide-up flex-1">
              <div className={`rounded-lg p-4 border ${rc?.bg} ${rc?.border}`}>
                <div className="flex items-center gap-3">
                  {result.isContraband ? (
                    <AlertTriangle className={`w-7 h-7 ${rc?.color}`} />
                  ) : (
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  )}
                  <div>
                    <p className={`text-xl font-bold ${rc?.color}`}>{rc?.label}</p>
                    <p className="text-sm text-slate-400">
                      {result.isContraband ? '检测到违禁物品' : '未检测到违禁物品'}
                    </p>
                  </div>
                </div>
              </div>

              {result.matchedItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">匹配项</p>
                  {result.matchedItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-200">{item.name}</span>
                        <span className="text-xs text-slate-500">{item.category}</span>
                      </div>
                      <span className={riskBadgeCls(item.risk)}>{RISK_CONFIG[item.risk].label}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.description && (
                <p className="text-sm text-slate-400 leading-relaxed">{result.description}</p>
              )}

              <button onClick={handleReset} className="btn-secondary flex items-center gap-2 w-full justify-center">
                <RotateCcw className="w-4 h-4" />重新检测
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">违禁品库</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索名称、类别或关键词"
                className="input-field pl-9 text-sm w-64"
              />
            </div>
            <button onClick={fetchLibrary} className="btn-secondary text-sm px-3 py-1.5">加载</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-left border-b border-slate-800">
                <th className="pb-3 font-medium">名称</th>
                <th className="pb-3 font-medium">类别</th>
                <th className="pb-3 font-medium">风险等级</th>
                <th className="pb-3 font-medium">关键词</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-500">暂无数据</td></tr>
              )}
              {filtered.map((item, i) => (
                <tr key={i} className="text-slate-300">
                  <td className="py-3">{item.name}</td>
                  <td className="py-3 text-slate-400">{item.category}</td>
                  <td className="py-3"><span className={riskBadgeCls(item.risk)}>{RISK_CONFIG[item.risk].label}</span></td>
                  <td className="py-3 text-slate-500">{item.keywords.join('、')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
