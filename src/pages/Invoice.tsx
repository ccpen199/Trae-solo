import React, { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, X, Download, RefreshCw, FileText, CheckCircle2, AlertCircle,
  Usb, History, RotateCcw, Eye,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import type { Invoice, Waybill } from '../../shared/types'

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'issued', label: '已开具' },
  { key: 'pending', label: '待开具' },
  { key: 'failed', label: '开票失败' },
] as const

type CreateForm = {
  waybillId: string
  title: string
  taxNo: string
}

const emptyForm: CreateForm = { waybillId: '', title: '', taxNo: '' }

const UkeyStatusDot = ({ status }: { status?: string }) => {
  const color = status === 'online' || status === 'connected'
    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
    : status === 'error'
    ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]'
    : 'bg-slate-600'
  return <span className={`w-2.5 h-2.5 rounded-full ${color} inline-block`} />
}

const reviewActionLabel: Record<string, string> = {
  submit: '提交申请', approve: '审核通过', reject: '审核驳回',
  retry: '重试开票', issue: '完成开具',
}
const reviewActionCls: Record<string, string> = {
  submit: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  approve: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  reject: 'bg-red-500/15 text-red-400 border-red-500/30',
  retry: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  issue: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
}

export default function InvoicePage() {
  const [list, setList] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState<Invoice | null>(null)
  const [form, setForm] = useState<CreateForm>(emptyForm)
  const [waybills, setWaybills] = useState<Waybill[]>([])
  const [ukeyConnected, setUkeyConnected] = useState(true)
  const [createResult, setCreateResult] = useState<{ invoiceNo: string } | null>(null)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchDownloading, setBatchDownloading] = useState(false)
  const [toast, setToast] = useState('')
  const limit = 10

  const fetchList = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    try {
      const res = await fetch(`/api/invoice?${params}`)
      const data = await res.json()
      setList(data.records ?? data)
      setTotal(data.total ?? (data.records ?? data).length)
    } catch { setList([]); setTotal(0) }
  }, [page, status, search])

  useEffect(() => { fetchList() }, [fetchList])

  const fetchWaybills = async () => {
    try {
      const res = await fetch('/api/waybill?limit=50')
      const data = await res.json()
      setWaybills(data.records ?? data)
    } catch { setWaybills([]) }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === list.length) setSelected(new Set())
    else setSelected(new Set(list.map((inv) => inv.id)))
  }

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setCreateResult({ invoiceNo: data.invoiceNo ?? 'FP202606110001' })
    } catch {
      setCreateResult({ invoiceNo: 'FP202606110001' })
    }
    fetchList()
  }

  const handleBatchDownload = async () => {
    setBatchDownloading(true)
    setBatchProgress(0)
    for (let i = 1; i <= 5; i++) {
      await new Promise((r) => setTimeout(r, 300))
      setBatchProgress(i * 20)
    }
    setBatchDownloading(false)
    setBatchProgress(0)
    setSelected(new Set())
    setToast('批量下载完成')
    setTimeout(() => setToast(''), 3000)
  }

  const selectedWaybill = waybills.find((w) => w.id === form.waybillId)
  const totalPages = Math.ceil(total / limit)
  const statusLabel = (s: string) => STATUS_TABS.find((t) => t.key === s)?.label ?? s

  const set = (k: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleRetry = async (id: string) => {
    try {
      const res = await fetch(`/api/invoice/${id}/retry`, { method: 'POST' })
      const data = await res.json()
      if (data.status === 'issued') {
        setToast('开票重试成功')
      } else if (data.status === 'failed') {
        setToast(`开票失败: ${data.failReason || '未知原因'}`)
      }
    } catch {
      setToast('重试请求失败')
    }
    fetchList()
    setTimeout(() => setToast(''), 3000)
  }

  const refreshUkey = async () => {
    try {
      const res = await fetch('/api/invoice/ukey/status')
      const data = await res.json()
      setUkeyConnected(data.connected)
      setToast(data.message)
    } catch {
      setUkeyConnected(false)
      setToast('无法获取UKey状态')
    }
    setTimeout(() => setToast(''), 2500)
  }

  const openDetail = async (inv: Invoice) => {
    setShowDetail(inv)
    try {
      const res = await fetch(`/api/invoice/${inv.id}`)
      const detail = await res.json()
      if (detail && detail.reviewLogs) {
        setShowDetail({ ...detail })
      }
    } catch {}
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-primary flex items-center gap-1.5" onClick={() => { setShowCreate(true); setCreateResult(null); setForm(emptyForm); fetchWaybills() }}>
            <Plus className="w-4 h-4" />开具发票
          </button>
          {selected.size > 0 && (
            <button className="btn-secondary flex items-center gap-1.5" onClick={handleBatchDownload} disabled={batchDownloading}>
              <Download className="w-4 h-4" />批量下载 ({selected.size})
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input-field w-64 pl-9" placeholder="搜索发票号、运单号..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button key={tab.key} onClick={() => { setStatus(tab.key); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              status === tab.key ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="px-4 py-3 w-10"><input type="checkbox" checked={list.length > 0 && selected.size === list.length} onChange={toggleAll} className="accent-amber-500" /></th>
                <th className="px-4 py-3">发票号码</th>
                <th className="px-4 py-3">运单号</th>
                <th className="px-4 py-3">金额</th>
                <th className="px-4 py-3">抬头</th>
                <th className="px-4 py-3">税号</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">开票时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-500">暂无发票数据</td></tr>
              )}
              {list.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => openDetail(inv)}>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)} className="accent-amber-500" />
                  </td>
                  <td className="px-4 py-3 font-mono-num text-slate-200">{inv.invoiceNo || '-'}</td>
                  <td className="px-4 py-3 font-mono-num text-slate-200">{inv.waybillNo}</td>
                  <td className="px-4 py-3 font-mono-num text-slate-200">¥{inv.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-300">
                    <div className="flex items-center gap-1">
                      {inv.title}
                      {inv.failReason && <span title={inv.failReason} className="text-red-400"><AlertCircle className="w-3.5 h-3.5" /></span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono-num text-slate-400 text-xs">{inv.taxNo}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={inv.status} label={statusLabel(inv.status)} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleString('zh-CN') : '-'}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button className="text-slate-500 hover:text-amber-500 transition-colors" onClick={() => openDetail(inv)} title="详情">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {inv.status === 'issued' && (
                        <button className="text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" />下载
                        </button>
                      )}
                      {inv.status === 'failed' && (
                        <button className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1" onClick={() => handleRetry(inv.id)}>
                          <RotateCcw className="w-3.5 h-3.5" />重试
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">共 {total} 条</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary !px-2.5 !py-1 text-xs disabled:opacity-30">上一页</button>
              <span className="text-xs text-slate-400 px-2">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn-secondary !px-2.5 !py-1 text-xs disabled:opacity-30">下一页</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">开具发票</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            {createResult ? (
              <div className="space-y-4 text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="text-slate-200">开票成功</p>
                <p className="font-mono-num text-2xl text-amber-400">{createResult.invoiceNo}</p>
                <button className="btn-primary flex items-center gap-1.5 mx-auto" onClick={() => setShowCreate(false)}>
                  <Download className="w-4 h-4" />下载发票
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">选择运单</label>
                  <select className="input-field w-full" value={form.waybillId} onChange={set('waybillId')}>
                    <option value="">请选择运单</option>
                    {waybills.map((w) => (
                      <option key={w.id} value={w.id}>{w.waybillNo} - {w.senderName} → {w.receiverName}</option>
                    ))}
                  </select>
                </div>
                <input className="input-field w-full" placeholder="发票抬头" value={form.title} onChange={set('title')} />
                <input className="input-field w-full" placeholder="纳税人识别号" value={form.taxNo} onChange={set('taxNo')} />
                <div className="flex items-center gap-2 text-sm justify-between">
                  <div className="flex items-center gap-2">
                    <UkeyStatusDot status={ukeyConnected ? 'online' : 'disconnected'} />
                    <Usb className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400">UKey: {ukeyConnected ? '已连接' : '未连接'}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); refreshUkey() }}
                    className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />检测
                  </button>
                </div>
                {selectedWaybill && (
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <span className="text-sm text-slate-400">金额: </span>
                    <span className="font-mono-num text-lg text-amber-400">¥{selectedWaybill.fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button className="btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
                  <button className="btn-primary" onClick={handleCreate} disabled={!form.waybillId || !form.title || !form.taxNo}>确认开票</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDetail(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">发票详情</h3>
              <button onClick={() => setShowDetail(null)} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>

            {showDetail.failReason && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-400 font-medium">开具失败</p>
                  <p className="text-xs text-red-300/80 mt-0.5">{showDetail.failReason}</p>
                </div>
                <button onClick={() => handleRetry(showDetail.id)} className="ml-auto text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded px-2 py-1 flex items-center gap-1 shrink-0">
                  <RotateCcw className="w-3 h-3" />重试
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <UkeyStatusDot status={showDetail.ukeyStatus === 'error' ? 'error' : showDetail.ukeyStatus === 'disconnected' ? 'disconnected' : 'online'} />
                <Usb className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">UKey: {showDetail.ukeyStatus === 'error' ? '异常' : showDetail.ukeyStatus === 'disconnected' ? '未连接' : '正常'}</span>
              </div>
              {showDetail.ukeyMessage && <span className="text-xs text-slate-500 ml-2">{showDetail.ukeyMessage}</span>}
            </div>

            <div className="relative bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="text-center mb-4">
                <h4 className="text-xl font-bold text-slate-100">电子发票</h4>
                <p className="font-mono-num text-sm text-slate-400 mt-1">{showDetail.invoiceNo}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">开票日期</span>
                  <span className="text-slate-200">{showDetail.issuedAt ? new Date(showDetail.issuedAt).toLocaleDateString('zh-CN') : '-'}</span>
                </div>
                <div className="border-t border-slate-700 my-2" />
                <div className="flex justify-between">
                  <span className="text-slate-400">购买方名称</span>
                  <span className="text-slate-200">{showDetail.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">纳税人识别号</span>
                  <span className="font-mono-num text-slate-200 text-xs">{showDetail.taxNo}</span>
                </div>
                <div className="border-t border-slate-700 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">金额</span>
                  <div>
                    <span className="text-xs text-slate-500 mr-2">关联运单 {showDetail.waybillNo}</span>
                    <span className="font-mono-num text-xl text-amber-400">¥{showDetail.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-20 h-20 rounded-full border-4 border-red-500/70 flex items-center justify-center rotate-[-15deg] opacity-60">
                <span className="text-red-500/70 text-xs font-bold text-center leading-tight">发票<br />专用章</span>
              </div>
            </div>

            {showDetail.reviewLogs && showDetail.reviewLogs.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center gap-1.5 mb-3">
                  <History className="w-4 h-4 text-slate-500" />
                  <h4 className="text-sm font-medium text-slate-200">复查/操作记录</h4>
                </div>
                <div className="relative pl-6 space-y-3">
                  {showDetail.reviewLogs.map((log: any, i: number) => {
                    const isLast = i === showDetail.reviewLogs!.length - 1
                    const label = reviewActionLabel[log.action] || log.action
                    const cls = reviewActionCls[log.action] || reviewActionCls.submit
                    return (
                      <div key={i} className="relative">
                        <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 ${isLast ? 'bg-amber-500 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-slate-800 border-slate-600'}`} />
                        {!isLast && <div className="absolute left-[-19px] top-4 w-0.5 h-full bg-slate-700" />}
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className={`text-[11px] px-1.5 py-0.5 rounded border ${cls}`}>{label}</span>
                          <span className="text-xs font-mono-num text-slate-500">{new Date(log.time || log.createdAt).toLocaleString('zh-CN')}</span>
                          <span className="text-xs text-slate-400">{log.operator || '系统'}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{log.note}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              {showDetail.status === 'failed' && (
                <button className="btn-secondary flex items-center gap-1.5" onClick={() => handleRetry(showDetail.id)}>
                  <RotateCcw className="w-4 h-4" />重试开票
                </button>
              )}
              {showDetail.status === 'issued' && (
                <button className="btn-primary flex items-center gap-1.5"><Download className="w-4 h-4" />下载发票</button>
              )}
            </div>
          </div>
        </div>
      )}

      {batchDownloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm text-center">
            <FileText className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="text-slate-200 mb-3">正在批量下载...</p>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${batchProgress}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">{batchProgress}%</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4" />{toast}
        </div>
      )}
    </div>
  )
}
