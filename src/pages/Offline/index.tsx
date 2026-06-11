import { useState, useEffect } from 'react'
import { Wifi, WifiOff, FileText, Eye, Download, RefreshCw, Info, CheckCircle2 } from 'lucide-react'

type DocStatus = '已缓存' | '已过期' | '待更新'

interface CachedDoc {
  name: string
  cacheDate: string
  size: string
  expiryDate: string
  status: DocStatus
}

const cachedDocs: CachedDoc[] = [
  { name: '参保证明', cacheDate: '2026-05-20', size: '1.2 MB', expiryDate: '2026-06-20', status: '已缓存' },
  { name: '缴费记录证明', cacheDate: '2026-05-18', size: '0.8 MB', expiryDate: '2026-06-01', status: '已过期' },
  { name: '养老金领取证明', cacheDate: '2026-05-25', size: '1.5 MB', expiryDate: '2026-06-25', status: '已缓存' },
  { name: '失业登记证明', cacheDate: '2026-05-10', size: '0.6 MB', expiryDate: '2026-06-05', status: '待更新' },
  { name: '待遇资格认证证明', cacheDate: '2026-05-22', size: '1.0 MB', expiryDate: '2026-06-22', status: '已缓存' },
]

const pdfHistory = [
  { name: '参保证明', date: '2026-05-20 14:30', size: '1.2 MB' },
  { name: '缴费记录证明', date: '2026-05-18 09:15', size: '0.8 MB' },
  { name: '养老金领取证明', date: '2026-05-25 16:42', size: '1.5 MB' },
]

const docOptions = cachedDocs.map((d) => d.name)

const statusStyle: Record<DocStatus, string> = {
  '已缓存': 'bg-green-50 text-green-700 border-green-200',
  '已过期': 'bg-red-50 text-red-600 border-red-200',
  '待更新': 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

export default function Offline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [selectedDoc, setSelectedDoc] = useState(docOptions[0])
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [genSuccess, setGenSuccess] = useState(false)

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const handleGenerate = () => {
    if (generating) return
    setGenSuccess(false)
    setGenerating(true)
    setProgress(0)
    const steps = [20, 45, 70, 90, 100]
    steps.forEach((v, i) => {
      setTimeout(() => setProgress(v), (i + 1) * 400)
    })
    setTimeout(() => {
      setGenerating(false)
      setGenSuccess(true)
    }, 2200)
  }

  return (
    <div className="min-h-screen bg-surface-primary p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">离线服务</h1>
        <p className="text-sm text-gray-500 mt-1">离线缓存 · 关键证明随时可用</p>
      </div>

      <div className="gov-card p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              <Wifi className="w-3.5 h-3.5" /> 在线
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
              <WifiOff className="w-3.5 h-3.5" /> 离线
            </span>
          )}
          <span className="text-sm text-gray-600">已缓存 <span className="font-semibold text-gov-blue">5</span> 份证明材料</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gov-blue text-gov-blue hover:bg-gov-blue/5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> 全部更新
        </button>
      </div>

      <div className="gov-card p-6 mb-6">
        <h2 className="gov-section-title mb-4">已缓存证明材料</h2>
        <div className="space-y-3">
          {cachedDocs.map((doc) => (
            <div key={doc.name} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-surface-hover transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gov-blue/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gov-blue" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gov-blue-dark">{doc.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">缓存: {doc.cacheDate} · {doc.size} · 有效至 {doc.expiryDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusStyle[doc.status]}`}>{doc.status}</span>
                <button className="px-2.5 py-1 rounded text-xs font-medium text-gov-blue border border-gov-blue/20 hover:bg-gov-blue/5 transition-colors">
                  <Eye className="w-3.5 h-3.5 inline mr-0.5" />查看
                </button>
                <button className="px-2.5 py-1 rounded text-xs font-medium text-gov-gold-dark border border-gov-gold/30 hover:bg-gov-gold/5 transition-colors">
                  <Download className="w-3.5 h-3.5 inline mr-0.5" />生成PDF
                </button>
                <button className="px-2.5 py-1 rounded text-xs font-medium text-status-info border border-status-info/20 hover:bg-status-info/5 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5 inline mr-0.5" />更新缓存
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="gov-card p-6">
          <h2 className="gov-section-title mb-4">PDF生成</h2>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">选择证明类型</label>
            <select
              value={selectedDoc}
              onChange={(e) => { setSelectedDoc(e.target.value); setGenSuccess(false) }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gov-blue-dark bg-white focus:outline-none focus:border-gov-blue"
            >
              {docOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="mb-4 p-4 rounded-lg border border-gov-blue/10 bg-gov-blue/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gov-blue-dark">{selectedDoc}</span>
              <span className="text-xs text-gray-400">生成日期: 2026-06-09</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded border border-dashed border-gov-blue/30 bg-white flex items-center justify-center">
                <div className="grid grid-cols-5 gap-[1px] w-10 h-10">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`rounded-[0.5px] ${Math.random() > 0.4 ? 'bg-gov-blue-dark' : 'bg-gray-100'}`} />
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>二维码验真</p>
                <p>电子印章</p>
                <p>防伪水印</p>
              </div>
            </div>
          </div>

          {generating && (
            <div className="mb-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gov-blue to-gov-gold rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-right">{progress}%</p>
            </div>
          )}

          {genSuccess && !generating && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">生成成功</span>
              <button className="ml-auto flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-gov-blue text-white hover:bg-gov-blue-dark transition-colors">
                <Download className="w-3 h-3" /> 下载
              </button>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2.5 rounded-lg bg-gov-blue text-white text-sm font-medium hover:bg-gov-blue-dark transition-colors disabled:opacity-50"
          >
            {generating ? '生成中...' : '生成PDF'}
          </button>
        </div>

        <div className="gov-card p-6">
          <h2 className="gov-section-title mb-4">已生成PDF记录</h2>
          <div className="space-y-3">
            {pdfHistory.map((item) => (
              <div key={item.name + item.date} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-red-50 flex items-center justify-center">
                    <FileText className="w-4.5 h-4.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gov-blue-dark">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.date} · {item.size}</p>
                  </div>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border border-gov-blue/20 text-gov-blue hover:bg-gov-blue/5 transition-colors">
                  <Download className="w-3 h-3" /> 下载
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="gov-card p-4 flex items-start gap-3 border-l-4 border-gov-gold">
        <Info className="w-5 h-5 text-gov-gold shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600">离线模式下，您仍可查看已缓存的证明材料。建议定期更新缓存以确保材料有效性。</p>
      </div>
    </div>
  )
}
