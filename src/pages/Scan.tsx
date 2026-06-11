import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react'
import { ScanLine, Upload, Save, Clock, ChevronRight, Edit2, CheckCircle2, History, Eye,
  ShieldCheck, Truck, FileSpreadsheet, AlertTriangle, XCircle, ArrowRight, RotateCcw,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import type { WaybillScanResult } from '../../shared/types'

type Tab = 'barcode' | 'ocr'
type ScanFields = Pick<WaybillScanResult, 'id' | 'waybillNo' | 'senderName' | 'senderPhone' | 'senderAddress' | 'receiverName' | 'receiverPhone' | 'receiverAddress'>
type ScanFull = ScanFields & WaybillScanResult

const FIELDS: { key: keyof ScanFields; label: string; span2?: boolean }[] = [
  { key: 'waybillNo', label: '运单号' },
  { key: 'senderName', label: '寄件人' },
  { key: 'senderPhone', label: '寄件电话' },
  { key: 'senderAddress', label: '寄件地址', span2: true },
  { key: 'receiverName', label: '收件人' },
  { key: 'receiverPhone', label: '收件电话' },
  { key: 'receiverAddress', label: '收件地址', span2: true },
]

const reviewBadge = (s?: string) => {
  switch (s) {
    case 'auto_pass': return { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: '自动复核通过', Icon: ShieldCheck }
    case 'manual_edited': return { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', label: '用户编辑保存', Icon: Edit2 }
    case 'review_passed': return { cls: 'bg-violet-500/15 text-violet-400 border-violet-500/30', label: '人工复核通过', Icon: ShieldCheck }
    case 'pending_review': return { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: '待人工复核', Icon: AlertTriangle }
    default: return { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: '未处理', Icon: Clock }
  }
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value > 0.9 ? 'bg-emerald-500' : value > 0.7 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = value > 0.9 ? 'text-emerald-400' : value > 0.7 ? 'text-amber-400' : 'text-red-400'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">置信度</span>
        <span className={`font-mono-num text-sm font-medium ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CornerMarkers() {
  const cls = 'absolute w-5 h-5 border-amber-500'
  return (
    <>
      <span className={`${cls} top-0 left-0 border-t-2 border-l-2`} />
      <span className={`${cls} top-0 right-0 border-t-2 border-r-2`} />
      <span className={`${cls} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${cls} bottom-0 right-0 border-b-2 border-r-2`} />
    </>
  )
}

export default function Scan() {
  const [tab, setTab] = useState<Tab>('barcode')
  const [scanning, setScanning] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<WaybillScanResult | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [detailView, setDetailView] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const limit = 10

  useEffect(() => {
    fetchHistory()
  }, [page])

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/scan/history?page=${page}&limit=${limit}`)
      const data = await res.json()
      setHistory(data.data ?? data)
      setTotal(data.pagination?.total ?? (data.data ?? data).length)
    } catch {}
  }

  const handleBarcodeScan = async () => {
    setScanning(true)
    setResult(null)
    setSaveSuccess(false)
    try {
      const res = await fetch('/api/scan/barcode', { method: 'POST' })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult(null)
    } finally {
      setScanning(false)
      fetchHistory()
    }
  }

  const handleOcrScan = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setProcessing(true)
    setResult(null)
    setSaveSuccess(false)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/scan/ocr', { method: 'POST', body: fd })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult(null)
    } finally {
      setProcessing(false)
      fetchHistory()
    }
  }

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const dt = new DataTransfer()
      dt.items.add(file)
      if (fileRef.current) fileRef.current.files = dt.files
      setPreview(URL.createObjectURL(file))
    }
  }, [])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  const handleSave = async (withManualReview = false) => {
    if (!result?.id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/scan/${result.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waybillNo: result.waybillNo,
          senderName: result.senderName,
          senderPhone: result.senderPhone,
          senderAddress: result.senderAddress,
          receiverName: result.receiverName,
          receiverPhone: result.receiverPhone,
          receiverAddress: result.receiverAddress,
          reviewer: withManualReview ? '人工复核员' : undefined,
          manualReview: withManualReview,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult({ ...data })
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3500)
        fetchHistory()
      }
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleManualReview = async (passed: boolean, note = '') => {
    if (!result?.id) return
    try {
      const res = await fetch(`/api/scan/${result.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passed, note, reviewer: '当前用户' }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult({ ...data })
        fetchHistory()
      }
    } catch {}
  }

  const viewDetail = (item: any) => {
    setDetailView(item.id)
    setResult(item)
    setSaveSuccess(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeDetail = () => {
    setDetailView(null)
    setResult(null)
    setPreview(null)
    setSaveSuccess(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const updateField = (key: keyof ScanFields, value: string) => {
    setResult((prev: any) => (prev ? { ...prev, [key]: value } : prev))
  }

  const formatDate = (s: string) => s?.replace('T', ' ').slice(0, 16) ?? ''

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">面单识别</h1>
        <span className="badge-info">共 {total} 条历史记录</span>
      </div>

      {detailView && result && (
        <div className="card space-y-4 animate-slide-up border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-amber-500" />
              <h3 className="section-title mb-0">扫描记录详情</h3>
              <span className={result.scanType === 'barcode' ? 'badge-info' : 'badge-warning'}>
                {result.scanType === 'barcode' ? '扫码识别' : 'OCR识别'}
              </span>
              {result.isEdited && <span className="badge badge-neutral">已编辑</span>}
            </div>
            <button onClick={closeDetail} className="btn-secondary text-sm px-3 py-1.5">
              关闭详情
            </button>
          </div>
          {result.confidence !== undefined && <ConfidenceBar value={result.confidence} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIELDS.map(({ key, label, span2 }) => (
              <div key={key} className={span2 ? 'sm:col-span-2' : ''}>
                <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                <input className="input-field w-full" value={(result as any)[key] ?? ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField(key, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-500">
              创建于 {formatDate(result.createdAt ?? '')}
              {result.updatedAt && result.updatedAt !== result.createdAt && ` · 更新于 ${formatDate(result.updatedAt)}`}
            </div>
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-emerald-400 text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />已保存
                </span>
              )}
              <button onClick={() => handleSave(false)} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!detailView && (
        <>
          <div className="flex border-b border-slate-800">
            {(['barcode', 'ocr'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setResult(null); setPreview(null); setSaveSuccess(false) }}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'barcode' ? <ScanLine className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {t === 'barcode' ? '扫码识别' : 'OCR识别'}
              </button>
            ))}
          </div>

          {tab === 'barcode' && (
            <div className="card flex flex-col items-center">
              <div className="relative w-72 h-48 border-dashed border-2 border-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                <CornerMarkers />
                {scanning && (
                  <div className="absolute inset-x-0 h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-[scan-line_2s_ease-in-out_infinite]" />
                )}
                <p className="text-sm text-slate-500 z-10">将面单条码对准扫描框</p>
              </div>
              <button
                onClick={handleBarcodeScan}
                disabled={scanning}
                className="btn-primary mt-6 flex items-center gap-2"
                style={scanning ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                <ScanLine className={`w-4 h-4 ${scanning ? 'animate-pulse' : ''}`} />
                {scanning ? '扫描中...' : '开始扫描'}
              </button>
            </div>
          )}

          {tab === 'ocr' && (
            <div className="card flex flex-col items-center">
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
                className="w-full h-52 border-dashed border-2 border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors overflow-hidden"
              >
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-sm text-slate-500">点击或拖拽上传面单图片</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button
                onClick={handleOcrScan}
                disabled={processing || !preview}
                className="btn-primary mt-6 flex items-center gap-2"
                style={processing || !preview ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {processing ? (
                  <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />识别中...</>
                ) : (
                  '开始识别'
                )}
              </button>
            </div>
          )}

          {result && (
            <div className="card space-y-4 animate-slide-up">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="section-title mb-0">识别结果</h3>
                  <span className={result.scanType === 'barcode' ? 'badge-info' : 'badge-warning'}>
                    {result.scanType === 'barcode' ? '扫码' : 'OCR'}
                  </span>
                  {saveSuccess && (
                    <span className="text-emerald-400 text-sm flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />已保存
                    </span>
                  )}
                </div>
                {result.reviewStatus && (() => {
                  const r = reviewBadge(result.reviewStatus)
                  const Icon = r.Icon
                  return (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${r.cls}`}>
                      <Icon className="w-3 h-3" />{r.label}
                    </span>
                  )
                })()}
              </div>

              {(result as any).reviewConclusion && (
                <div className={`p-3 rounded-lg border ${
                  result.reviewStatus === 'pending_review'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                  <div className="flex items-start gap-2">
                    {result.reviewStatus === 'pending_review'
                      ? <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      : <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200">{(result as any).reviewConclusion}</p>
                      {(result as any).reviewer && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          审核人: <span className="text-slate-400">{(result as any).reviewer}</span>
                          {(result as any).reviewedAt && ` · ${formatDate((result as any).reviewedAt)}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {result.confidence !== undefined && <ConfidenceBar value={result.confidence} />}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FIELDS.map(({ key, label, span2 }) => (
                  <div key={key} className={span2 ? 'sm:col-span-2' : ''}>
                    <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                    <input className="input-field w-full" value={(result as any)[key] ?? ''} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField(key, e.target.value)} />
                  </div>
                ))}
              </div>

              {(result as any).syncedWaybillId && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">复核链路</p>
                      <p className="text-sm text-emerald-400 font-medium">
                        {result.reviewStatus === 'auto_pass' ? '系统自动通过' : result.reviewStatus === 'manual_edited' ? '人工编辑通过' : '复核通过'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">运单管理</p>
                      <p className="text-sm text-blue-400 font-medium truncate">
                        已创建 {(result as any).syncedFee && `· ¥${(result as any).syncedFee}`}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono-num truncate">{(result as any).syncedWaybillId}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">物流追踪</p>
                      <p className="text-sm text-violet-400 font-medium">
                        {(result as any).syncedTracking ? '首节点已同步' : '待同步'}
                      </p>
                      <p className="text-[10px] text-slate-600">状态: created</p>
                    </div>
                  </div>
                </div>
              )}

              {result.reviewStatus === 'pending_review' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="flex-1 text-sm text-slate-300">该记录置信度不足，需人工复核确认后再同步</div>
                  <button onClick={() => handleManualReview(true, '人工复核通过')}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3" />复核通过
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button onClick={() => handleSave(false)} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? '保存中...' : '保存记录'}
                </button>
                <button onClick={() => handleSave(true)} disabled={saving} className="btn-secondary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />保存并复核
                </button>
                {saveSuccess && !result.reviewStatus && (
                  <span className="text-xs text-slate-500 ml-2 flex items-center gap-1">
                    <RotateCcw className="w-3 h-3 animate-spin" />链路同步中...
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <h2 className="section-title mb-0">扫描历史</h2>
          </div>
          <button onClick={fetchHistory} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />刷新
          </button>
        </div>
        <div className="card space-y-0 divide-y divide-slate-800">
          {history.length === 0 && (
            <p className="text-slate-500 text-sm py-6 text-center">暂无扫描记录</p>
          )}
          {history.map((item: any) => (
            <button
              key={item.id}
              onClick={() => viewDetail(item)}
              className="w-full flex items-center gap-3 py-3 first:pt-0 last:pb-0 group text-left hover:bg-slate-800/30 -mx-6 px-6 transition-colors"
            >
              <div className="flex-1 flex items-center gap-3 min-w-0 flex-wrap">
                <span className="font-mono-num text-sm text-slate-200 shrink-0">{item.waybillNo}</span>
                <span className={item.scanType === 'barcode' ? 'badge-info' : 'badge-warning'}>
                  {item.scanType === 'barcode' ? '扫码' : 'OCR'}
                </span>
                {item.isEdited && <span className="badge-neutral">已编辑</span>}
                {item.reviewStatus && (() => {
                  const r = reviewBadge(item.reviewStatus)
                  const Icon = r.Icon
                  return (
                    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${r.cls}`}>
                      <Icon className="w-3 h-3" />{r.label}
                    </span>
                  )
                })()}
                <span className={`text-xs font-mono-num shrink-0 ${
                  item.confidence > 0.9 ? 'text-emerald-400' : item.confidence > 0.7 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {Math.round(item.confidence * 100)}%
                </span>
                {item.syncedWaybillId && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <FileSpreadsheet className="w-3 h-3" />已建运单
                  </span>
                )}
                <span className="text-xs text-slate-500 truncate">
                  {item.senderName} → {item.receiverName}
                </span>
              </div>
              <span className="text-xs text-slate-600 font-mono-num shrink-0">{formatDate(item.createdAt)}</span>
              <Edit2 className="w-4 h-4 text-slate-600 group-hover:text-amber-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
        {total > limit && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm px-3 py-1.5"
              style={page === 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              上一页
            </button>
            <span className="text-sm text-slate-500">
              第 {page} / {Math.ceil(total / limit)} 页
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="btn-secondary text-sm px-3 py-1.5"
              style={page >= Math.ceil(total / limit) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
