import { useState, useEffect, useRef, type DragEvent } from 'react'
import {
  Plus, Upload, Printer, Search, MapPin, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, FileText, Clock, List, FileSpreadsheet,
  TrendingUp, TrendingDown, Package, CheckCircle, XCircle, Eye,
  ShoppingBag,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'created', label: '已创建' },
  { key: 'picked_up', label: '已取件' },
  { key: 'in_transit', label: '运输中' },
  { key: 'delivered', label: '已签收' },
  { key: 'returned', label: '退回' },
]

const SERVICE_LABELS: Record<string, string> = {
  standard: '标准快递',
  express: '特快专递',
  same_day: '当日达',
}

const TEMPLATE_LABELS: Record<string, string> = {
  standard: '标准面单',
  thermal: '热敏面单',
  a4: 'A4面单',
  ecommerce: '电商面单',
  merchant: '商家面单',
}

const PRINT_STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending: { label: '待打印', variant: 'warning' },
  printing: { label: '打印中', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  failed: { label: '打印失败', variant: 'danger' },
}

const MERCHANT_PLATFORMS = [
  { key: 'taobao', label: '淘宝店铺', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  { key: 'tmall', label: '天猫旗舰', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  { key: 'jd', label: '京东自营', cls: 'bg-red-600/15 text-red-500 border-red-600/30' },
  { key: 'pinduoduo', label: '拼多多店', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { key: 'douyin', label: '抖音小店', cls: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
]

export default function Waybill() {
  const [view, setView] = useState<'list' | 'imports' | 'prints'>('list')
  const [list, setList] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showPrint, setShowPrint] = useState(false)

  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<any>(null)
  const [importBatches, setImportBatches] = useState<any[]>([])
  const [importBatchesTotal, setImportBatchesTotal] = useState(0)
  const [importPage, setImportPage] = useState(1)
  const [selectedImportBatch, setSelectedImportBatch] = useState<any>(null)
  const [merchantPlatform, setMerchantPlatform] = useState('taobao')
  const [merchantCount, setMerchantCount] = useState(15)
  const [merchantImporting, setMerchantImporting] = useState(false)

  const [printBatches, setPrintBatches] = useState<any[]>([])
  const [printBatchesTotal, setPrintBatchesTotal] = useState(0)
  const [printPage, setPrintPage] = useState(1)
  const [selectedPrintBatch, setSelectedPrintBatch] = useState<any>(null)
  const [printTemplate, setPrintTemplate] = useState('standard')

  const [form, setForm] = useState<any>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const limit = 10

  useEffect(() => {
    fetchList()
    fetchCounts()
  }, [page, status, search, view])

  useEffect(() => {
    if (view === 'imports') fetchImportBatches()
    if (view === 'prints') fetchPrintBatches()
  }, [view, importPage, printPage])

  const fetchList = async () => {
    try {
      const statusQ = status ? `&status=${status}` : ''
      const searchQ = search ? `&search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/waybill?page=${page}&limit=${limit}${statusQ}${searchQ}`)
      const data = await res.json()
      setList(data.data ?? data)
      setTotal(data.pagination?.total ?? (data.data ?? data).length)
    } catch {}
  }

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/waybill/counts')
      const data = await res.json()
      setCounts(data)
    } catch {}
  }

  const fetchImportBatches = async () => {
    try {
      const res = await fetch(`/api/waybill/import-batches?page=${importPage}&limit=5`)
      const data = await res.json()
      setImportBatches(data.data ?? data)
      setImportBatchesTotal(data.pagination?.total ?? (data.data ?? data).length)
    } catch {}
  }

  const fetchPrintBatches = async () => {
    try {
      const res = await fetch(`/api/waybill/print-batches?page=${printPage}&limit=5`)
      const data = await res.json()
      setPrintBatches(data.data ?? data)
      setPrintBatchesTotal(data.pagination?.total ?? (data.data ?? data).length)
    } catch {}
  }

  const toggleAll = () => {
    if (selected.size === list.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(list.map((w: any) => w.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/waybill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowCreate(false)
        setForm({})
        fetchList()
        fetchCounts()
      }
    } catch {}
  }

  const handleImport = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setImportProgress(0)
    setImportResult(null)

    const interval = setInterval(() => {
      setImportProgress((p) => {
        if (p >= 90) {
          clearInterval(interval)
          return p
        }
        return p + 10
      })
    }, 100)

    const mockWaybills = Array.from({ length: 12 }, (_, i) => ({
      waybillNo: `BATCH${Date.now().toString().slice(-6)}${String(i + 1).padStart(3, '0')}`,
      senderName: '李商家',
      senderAddress: '杭州市西湖区文三路478号',
      receiverName: `收件人${i + 1}`,
      receiverAddress: i % 4 === 0 ? '' : `测试地址第${i + 1}号`,
      receiverPhone: i % 3 === 0 ? '123' : `138${String(10000000 + i).padStart(8, '0')}`,
      weight: i === 7 ? 60 : 1 + i * 0.5,
      serviceLevel: 'standard',
      fee: 12 + i * 2,
    }))

    setTimeout(async () => {
      clearInterval(interval)
      try {
        const res = await fetch('/api/waybill/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waybills: mockWaybills, fileName: file.name, template: 'standard' }),
        })
        const data = await res.json()
        setImportProgress(100)
        setImportResult(data)
        fetchList()
        fetchCounts()
        fetchImportBatches()
      } catch {
        clearInterval(interval)
        setImportProgress(0)
      }
    }, 1500)
  }

  const handleMerchantImport = async () => {
    setMerchantImporting(true)
    setImportProgress(0)
    setImportResult(null)
    const interval = setInterval(() => {
      setImportProgress((p) => (p >= 90 ? p : p + 15))
    }, 150)
    try {
      const res = await fetch('/api/waybill/merchant-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: merchantPlatform, count: merchantCount, template: 'merchant' }),
      })
      const data = await res.json()
      clearInterval(interval)
      setImportProgress(100)
      setImportResult(data)
      fetchList()
      fetchCounts()
      fetchImportBatches()
    } catch {
      clearInterval(interval)
      setImportProgress(0)
    } finally {
      setMerchantImporting(false)
    }
  }

  const handlePrint = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return

    try {
      const res = await fetch('/api/waybill/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waybillIds: ids, template: printTemplate }),
      })
      if (res.ok) {
        setShowPrint(false)
        setSelected(new Set())
        fetchPrintBatches()
        setTimeout(fetchPrintBatches, 2000)
      }
    } catch {}
  }

  const viewImportBatch = async (batch: any) => {
    try {
      const res = await fetch(`/api/waybill/import-batches/${batch.id}`)
      const data = await res.json()
      setSelectedImportBatch(data)
    } catch {
      setSelectedImportBatch(batch)
    }
  }

  const viewPrintBatch = async (batch: any) => {
    try {
      const res = await fetch(`/api/waybill/print-batches/${batch.id}`)
      const data = await res.json()
      setSelectedPrintBatch(data)
    } catch {
      setSelectedPrintBatch(batch)
    }
  }

  const formatDate = (s: string) => s?.replace('T', ' ').slice(0, 16) ?? ''

  const successRate = importResult
    ? importResult.totalCount > 0
      ? Math.round((importResult.successCount / importResult.totalCount) * 100)
      : 0
    : 0

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {[
            { key: 'list', label: '运单列表', icon: List },
            { key: 'imports', label: '导入批次', icon: FileSpreadsheet },
            { key: 'prints', label: '打印批次', icon: Printer },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === key
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {view === 'list' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />新建运单
            </button>
            <button className="btn-secondary flex items-center gap-1.5" onClick={() => { setShowImport(true); setImportProgress(0); setImportResult(null) }}>
              <Upload className="w-4 h-4" />批量导入
            </button>
            <div className="group relative">
              <button className="btn-secondary flex items-center gap-1.5 !bg-gradient-to-r !from-orange-500/10 !to-pink-500/10 !border-orange-500/20">
                <ShoppingBag className="w-4 h-4 text-orange-400" />商家导入
                <ChevronRight className="w-3 h-3 text-slate-500 -rotate-90" />
              </button>
              <div className="absolute right-0 mt-2 w-48 card !p-2 z-40 hidden group-hover:block shadow-2xl">
                {MERCHANT_PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-800/80 transition-colors text-sm flex items-center gap-2"
                    onClick={() => { setMerchantPlatform(p.key); setShowImport(true); setImportProgress(0); setImportResult(null) }}
                  >
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] ${p.cls}`}>{p.label}</span>
                    <span className="text-xs text-slate-500 ml-auto">一键拉取</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn-secondary flex items-center gap-1.5"
              onClick={() => setShowPrint(true)}
              disabled={selected.size === 0}
              style={selected.size === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Printer className="w-4 h-4" />
              打印选中
              {selected.size > 0 && <span className="badge-info">({selected.size})</span>}
            </button>
          </div>
        )}
      </div>

      {view === 'list' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="input-field w-64 pl-9"
              placeholder="搜索运单号、姓名..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setStatus(tab.key); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  status === tab.key ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
                {counts[tab.key] !== undefined && (
                  <span className="ml-1.5 text-xs opacity-70">{counts[tab.key]}</span>
                )}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={list.length > 0 && selected.size === list.length} onChange={toggleAll} className="accent-amber-500" />
                    </th>
                    <th className="px-4 py-3">运单号</th>
                    <th className="px-4 py-3">寄件人 → 收件人</th>
                    <th className="px-4 py-3">服务等级</th>
                    <th className="px-4 py-3">重量</th>
                    <th className="px-4 py-3">运费</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">创建时间</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">暂无运单数据</td>
                    </tr>
                  )}
                  {list.map((wb: any) => (
                    <tr key={wb.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(wb.id)} onChange={() => toggleOne(wb.id)} className="accent-amber-500" />
                      </td>
                      <td className="px-4 py-3 font-mono-num text-slate-200 text-xs">{wb.waybillNo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-300 truncate">{wb.senderName} → {wb.receiverName}</p>
                            <p className="text-xs text-slate-500 truncate">{wb.receiverAddress}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge-info">{SERVICE_LABELS[wb.serviceLevel] || wb.serviceLevel}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono-num text-xs">{wb.weight}kg</td>
                      <td className="px-4 py-3 text-amber-400 font-mono-num font-semibold">¥{wb.fee}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={wb.status} label={
                          wb.status === 'created' ? '已创建' :
                          wb.status === 'picked_up' ? '已取件' :
                          wb.status === 'in_transit' ? '运输中' :
                          wb.status === 'delivered' ? '已签收' :
                          wb.status === 'returned' ? '退回' : wb.status
                        } />
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono-num whitespace-nowrap">
                        {formatDate(wb.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-amber-500 hover:text-amber-400 text-xs flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">共 {total} 条记录</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1"
                style={page === 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <ChevronLeft className="w-4 h-4" />上一页
              </button>
              <span className="text-sm text-slate-500 font-mono-num">
                {page} / {Math.ceil(total / limit) || 1}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1"
                style={page >= Math.ceil(total / limit) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                下一页<ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {view === 'imports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
              <h2 className="section-title mb-0">导入批次记录</h2>
            </div>
            <button
              className="btn-primary flex items-center gap-1.5"
              onClick={() => { setShowImport(true); setImportProgress(0); setImportResult(null) }}
            >
              <Upload className="w-4 h-4" />新建导入
            </button>
          </div>

          <div className="space-y-3">
            {importBatches.length === 0 && (
              <div className="card text-center py-10 text-slate-500">暂无导入批次</div>
            )}
            {importBatches.map((batch: any) => (
              <div
                key={batch.id}
                className="card cursor-pointer hover:border-amber-500/30 transition-all"
                onClick={() => viewImportBatch(batch)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">{batch.fileName || '未命名批次'}</h3>
                      <p className="text-xs text-slate-500 font-mono-num">{formatDate(batch.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-mono-num font-bold text-emerald-400">{batch.successCount}</div>
                      <div className="text-xs text-slate-500">成功</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono-num font-bold text-red-400">{batch.failedCount}</div>
                      <div className="text-xs text-slate-500">失败</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono-num font-bold text-slate-300">{batch.totalCount}</div>
                      <div className="text-xs text-slate-500">总计</div>
                    </div>
                  </div>
                </div>
                {batch.failedCount > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded px-2 py-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    有 {batch.failedCount} 条导入失败，点击查看详情
                  </div>
                )}
              </div>
            ))}
          </div>

          {importBatchesTotal > 5 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setImportPage((p) => Math.max(1, p - 1))}
                disabled={importPage === 1}
                className="btn-secondary text-sm px-3 py-1.5"
                style={importPage === 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                上一页
              </button>
              <span className="text-sm text-slate-500">
                第 {importPage} / {Math.ceil(importBatchesTotal / 5)} 页
              </span>
              <button
                onClick={() => setImportPage((p) => p + 1)}
                disabled={importPage >= Math.ceil(importBatchesTotal / 5)}
                className="btn-secondary text-sm px-3 py-1.5"
                style={importPage >= Math.ceil(importBatchesTotal / 5) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'prints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-500" />
              <h2 className="section-title mb-0">打印批次记录</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {printBatches.length === 0 && (
              <div className="card text-center py-10 text-slate-500 md:col-span-2">暂无打印批次</div>
            )}
            {printBatches.map((batch: any) => (
              <div
                key={batch.id}
                className="card cursor-pointer hover:border-amber-500/30 transition-all"
                onClick={() => viewPrintBatch(batch)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      batch.status === 'completed' ? 'bg-emerald-500/10' :
                      batch.status === 'printing' ? 'bg-blue-500/10' :
                      batch.status === 'failed' ? 'bg-red-500/10' :
                      'bg-slate-700/50'
                    }`}>
                      <Printer className={`w-5 h-5 ${
                        batch.status === 'completed' ? 'text-emerald-400' :
                        batch.status === 'printing' ? 'text-blue-400' :
                        batch.status === 'failed' ? 'text-red-400' :
                        'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{TEMPLATE_LABELS[batch.template] || batch.template}</h3>
                      <p className="text-xs text-slate-500 font-mono-num">{formatDate(batch.createdAt)}</p>
                    </div>
                  </div>
                  <StatusBadge
                    status={batch.status}
                    label={PRINT_STATUS_LABELS[batch.status]?.label || batch.status}
                    variant={PRINT_STATUS_LABELS[batch.status]?.variant as any}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">打印进度</span>
                    <span className="font-mono-num text-slate-400">{batch.printedCount}/{batch.totalCount}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        batch.status === 'failed' ? 'bg-red-500' :
                        batch.status === 'completed' ? 'bg-emerald-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${batch.totalCount > 0 ? (batch.printedCount / batch.totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {printBatchesTotal > 5 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPrintPage((p) => Math.max(1, p - 1))}
                disabled={printPage === 1}
                className="btn-secondary text-sm px-3 py-1.5"
                style={printPage === 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                上一页
              </button>
              <span className="text-sm text-slate-500">
                第 {printPage} / {Math.ceil(printBatchesTotal / 5)} 页
              </span>
              <button
                onClick={() => setPrintPage((p) => p + 1)}
                disabled={printPage >= Math.ceil(printBatchesTotal / 5)}
                className="btn-secondary text-sm px-3 py-1.5"
                style={printPage >= Math.ceil(printBatchesTotal / 5) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">新建运单</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">运单号</label>
                  <input className="input-field w-full" value={form.waybillNo || ''} onChange={(e) => setForm({ ...form, waybillNo: e.target.value })} placeholder="自动生成" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">服务等级</label>
                  <select className="input-field w-full" value={form.serviceLevel || 'standard'} onChange={(e) => setForm({ ...form, serviceLevel: e.target.value })}>
                    <option value="standard">标准快递</option>
                    <option value="express">特快专递</option>
                    <option value="same_day">当日达</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">寄件人</label>
                <input className="input-field w-full" value={form.senderName || ''} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">寄件地址</label>
                <input className="input-field w-full" value={form.senderAddress || ''} onChange={(e) => setForm({ ...form, senderAddress: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">收件人</label>
                  <input className="input-field w-full" value={form.receiverName || ''} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">重量 (kg)</label>
                  <input type="number" className="input-field w-full" value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 1 })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">收件地址</label>
                <input className="input-field w-full" value={form.receiverAddress || ''} onChange={(e) => setForm({ ...form, receiverAddress: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">取消</button>
              <button onClick={handleCreate} className="btn-primary">创建</button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">批量导入运单</h3>
              <button onClick={() => setShowImport(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!importResult && (
              <>
                <div className="flex border-b border-slate-800 mb-4 -mx-6 px-6">
                  <button
                    onClick={() => setMerchantPlatform('file')}
                    className={`pb-2 px-3 text-sm border-b-2 transition-colors -mb-px ${
                      merchantPlatform === 'file' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" />文件导入</span>
                  </button>
                  {MERCHANT_PLATFORMS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setMerchantPlatform(p.key)}
                      className={`pb-2 px-3 text-sm border-b-2 transition-colors -mb-px ${
                        merchantPlatform === p.key ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${p.cls}`}>
                        <ShoppingBag className="w-3 h-3" />{p.label}
                      </span>
                    </button>
                  ))}
                </div>

                {merchantPlatform === 'file' ? (
                  <>
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
                      onDrop={(e: DragEvent<HTMLDivElement>) => {
                        e.preventDefault()
                        const file = e.dataTransfer.files[0]
                        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
                          const dt = new DataTransfer()
                          dt.items.add(file)
                          if (fileRef.current) fileRef.current.files = dt.files
                        }
                      }}
                      className="w-full h-40 border-dashed border-2 border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <p className="text-sm text-slate-500">点击或拖拽上传 Excel/CSV 文件</p>
                      <p className="text-xs text-slate-600 mt-1">支持 .xlsx, .csv 格式</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" />
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <ShoppingBag className="w-4 h-4 text-orange-400 shrink-0" />
                        <span className="text-slate-300">
                          从<b className="text-orange-400">
                            {MERCHANT_PLATFORMS.find(p => p.key === merchantPlatform)?.label || '电商平台'}
                          </b>后台一键聚合拉取近期订单
                        </span>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">拉取订单数量</label>
                        <div className="flex items-center gap-2">
                          {[10, 15, 20, 30].map((n) => (
                            <button
                              key={n}
                              onClick={() => setMerchantCount(n)}
                              className={`px-3 py-1 rounded text-xs border transition-colors ${
                                merchantCount === n
                                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {n}单
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {importProgress > 0 && importProgress < 100 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">
                        {merchantPlatform === 'file' ? '文件解析中...' : '订单聚合同步中...'}
                      </span>
                      <span className="font-mono-num text-amber-400">{importProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-200"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {merchantPlatform === 'file' && (
                  <div className="mt-4 bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-2">📋 导入模板字段说明：</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <span>• 运单号 *必填</span>
                      <span>• 收件人 *必填</span>
                      <span>• 收件地址 *必填</span>
                      <span>• 收件电话</span>
                      <span>• 寄件人</span>
                      <span>• 寄件地址</span>
                      <span>• 重量(kg)</span>
                      <span>• 服务等级</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setShowImport(false)} className="btn-secondary">取消</button>
                  {merchantPlatform === 'file' ? (
                    <button
                      onClick={handleImport}
                      className="btn-primary"
                      disabled={!fileRef.current?.files?.length}
                      style={!fileRef.current?.files?.length ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                      开始导入
                    </button>
                  ) : (
                    <button onClick={handleMerchantImport} className="btn-primary flex items-center gap-1.5" disabled={merchantImporting}>
                      <ShoppingBag className="w-4 h-4" />
                      {merchantImporting ? '拉取中...' : '一键聚合导入'}
                    </button>
                  )}
                </div>
              </>
            )}

            {importResult && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  {successRate === 100 ? (
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="w-8 h-8 text-amber-400" />
                    </div>
                  )}
                  <h3 className="font-bold text-lg">
                    {successRate === 100 ? '全部导入成功' : '部分导入失败'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">共 {importResult.totalCount} 条 · 成功 {importResult.successCount} 条 · 失败 {importResult.failedCount} 条</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="font-mono-num text-2xl font-bold text-slate-200">{importResult.totalCount}</div>
                    <div className="text-xs text-slate-500">总计</div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                    <div className="font-mono-num text-2xl font-bold text-emerald-400">{importResult.successCount}</div>
                    <div className="text-xs text-slate-500">成功</div>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3 text-center">
                    <div className="font-mono-num text-2xl font-bold text-red-400">{importResult.failedCount}</div>
                    <div className="text-xs text-slate-500">失败</div>
                  </div>
                </div>

                {importResult.failedReasons?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-400" />
                      失败明细 ({importResult.failedReasons.length}条)
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {importResult.failedReasons.map((fail: any, idx: number) => (
                        <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded px-3 py-2 flex items-start gap-2">
                          <span className="text-xs font-mono-num text-slate-500 shrink-0">第{fail.row}行</span>
                          {fail.waybillNo && (
                            <span className="text-xs font-mono-num text-slate-400 shrink-0">{fail.waybillNo}</span>
                          )}
                          <span className="text-xs text-red-400">{fail.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setImportProgress(0); setImportResult(null) }}
                    className="btn-secondary"
                  >
                    继续导入
                  </button>
                  <button
                    onClick={() => { setShowImport(false); setView('imports') }}
                    className="btn-primary"
                  >
                    查看批次
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPrint && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">模板打印</h3>
              <button onClick={() => setShowPrint(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              已选择 <span className="font-mono-num text-amber-400 font-bold">{selected.size}</span> 条运单进行打印
            </p>

            <div className="space-y-3 mb-5">
              <p className="text-sm text-slate-300 font-medium">选择打印模板</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'standard', label: '标准面单', desc: '100×150mm' },
                  { key: 'thermal', label: '热敏面单', desc: '80×120mm' },
                  { key: 'a4', label: 'A4面单', desc: 'A4规格' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setPrintTemplate(t.key)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      printTemplate === t.key
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-200">{t.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPrint(false)} className="btn-secondary">取消</button>
              <button onClick={handlePrint} className="btn-primary flex items-center gap-1.5">
                <Printer className="w-4 h-4" />开始打印
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImportBatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">导入批次详情</h3>
              <button onClick={() => setSelectedImportBatch(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="font-mono-num text-xl font-bold text-slate-200">{selectedImportBatch.totalCount}</div>
                <div className="text-xs text-slate-500">总计</div>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                <div className="font-mono-num text-xl font-bold text-emerald-400">{selectedImportBatch.successCount}</div>
                <div className="text-xs text-slate-500">成功</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-3 text-center">
                <div className="font-mono-num text-xl font-bold text-red-400">{selectedImportBatch.failedCount}</div>
                <div className="text-xs text-slate-500">失败</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="font-mono-num text-xl font-bold text-blue-400">
                  {selectedImportBatch.totalCount > 0 ? Math.round((selectedImportBatch.successCount / selectedImportBatch.totalCount) * 100) : 0}%
                </div>
                <div className="text-xs text-slate-500">成功率</div>
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-3 mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">文件名</span>
                <span className="text-slate-300">{selectedImportBatch.fileName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">模板</span>
                <span className="text-slate-300">{TEMPLATE_LABELS[selectedImportBatch.template] || selectedImportBatch.template}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">创建时间</span>
                <span className="text-slate-300 font-mono-num text-xs">{formatDate(selectedImportBatch.createdAt)}</span>
              </div>
              {selectedImportBatch.completedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">完成时间</span>
                  <span className="text-slate-300 font-mono-num text-xs">{formatDate(selectedImportBatch.completedAt)}</span>
                </div>
              )}
            </div>

            {selectedImportBatch.failedReasons?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-400" />
                  失败明细 ({selectedImportBatch.failedReasons.length}条)
                </p>
                <div className="max-h-56 overflow-y-auto space-y-1.5">
                  {selectedImportBatch.failedReasons.map((fail: any, idx: number) => (
                    <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded px-3 py-2 flex items-center gap-3">
                      <span className="text-xs font-mono-num text-slate-500 shrink-0 w-14">第{fail.row}行</span>
                      {fail.waybillNo && (
                        <span className="text-xs font-mono-num text-slate-400 shrink-0">{fail.waybillNo}</span>
                      )}
                      <span className="text-xs text-red-400">{fail.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-5">
              <button onClick={() => setSelectedImportBatch(null)} className="btn-primary">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPrintBatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">打印批次详情</h3>
              <button onClick={() => setSelectedPrintBatch(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                selectedPrintBatch.status === 'completed' ? 'bg-emerald-500/10' :
                selectedPrintBatch.status === 'printing' ? 'bg-blue-500/10' :
                selectedPrintBatch.status === 'failed' ? 'bg-red-500/10' :
                'bg-slate-700/50'
              }`}>
                <Printer className={`w-7 h-7 ${
                  selectedPrintBatch.status === 'completed' ? 'text-emerald-400' :
                  selectedPrintBatch.status === 'printing' ? 'text-blue-400' :
                  selectedPrintBatch.status === 'failed' ? 'text-red-400' :
                  'text-slate-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{TEMPLATE_LABELS[selectedPrintBatch.template] || selectedPrintBatch.template}</span>
                  <StatusBadge
                    status={selectedPrintBatch.status}
                    label={PRINT_STATUS_LABELS[selectedPrintBatch.status]?.label || selectedPrintBatch.status}
                    variant={PRINT_STATUS_LABELS[selectedPrintBatch.status]?.variant as any}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{formatDate(selectedPrintBatch.createdAt)}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500">打印进度</span>
                <span className="font-mono-num text-slate-400">
                  {selectedPrintBatch.printedCount} / {selectedPrintBatch.totalCount}
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedPrintBatch.status === 'failed' ? 'bg-red-500' :
                    selectedPrintBatch.status === 'completed' ? 'bg-emerald-500' :
                    'bg-amber-500 animate-pulse'
                  }`}
                  style={{
                    width: `${selectedPrintBatch.totalCount > 0
                      ? (selectedPrintBatch.printedCount / selectedPrintBatch.totalCount) * 100
                      : 0}%`,
                  }}
                />
              </div>
            </div>

            {selectedPrintBatch.waybills?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">运单列表</p>
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50 text-slate-400 text-xs">
                      <tr>
                        <th className="px-3 py-2 text-left">运单号</th>
                        <th className="px-3 py-2 text-left">收件人</th>
                        <th className="px-3 py-2 text-right">运费</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPrintBatch.waybills.map((wb: any) => (
                        <tr key={wb.id} className="border-t border-slate-800/50">
                          <td className="px-3 py-2 font-mono-num text-xs text-slate-300">{wb.waybillNo}</td>
                          <td className="px-3 py-2 text-slate-400">{wb.receiverName}</td>
                          <td className="px-3 py-2 text-right text-amber-400 font-mono-num text-xs">¥{wb.fee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              {selectedPrintBatch.status === 'failed' && (
                <button className="btn-secondary">重新打印</button>
              )}
              <button onClick={() => setSelectedPrintBatch(null)} className="btn-primary">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
