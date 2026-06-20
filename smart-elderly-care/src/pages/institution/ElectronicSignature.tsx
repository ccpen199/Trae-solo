import { useState } from 'react'
import { FileCheck, PenLine, Clock, CheckCircle2, X } from 'lucide-react'

interface SignatureRecord {
  id: string
  docName: string
  elderName: string
  type: string
  signedBy: string
  signedAt: string | null
  status: 'pending' | 'signed'
}

const initialRecords: SignatureRecord[] = [
  { id: 'SIG001', docName: '护理计划确认书', elderName: '王建国', type: '护理计划确认书', signedBy: '', signedAt: null, status: 'pending' },
  { id: 'SIG002', docName: '入住协议', elderName: '张秀兰', type: '入住协议', signedBy: '', signedAt: null, status: 'pending' },
  { id: 'SIG003', docName: '医疗授权书', elderName: '杨淑珍', type: '医疗授权书', signedBy: '', signedAt: null, status: 'pending' },
  { id: 'SIG004', docName: '服务变更通知', elderName: '刘桂芳', type: '服务变更通知', signedBy: '', signedAt: null, status: 'pending' },
  { id: 'SIG005', docName: '费用确认单', elderName: '陈志强', type: '费用确认单', signedBy: '', signedAt: null, status: 'pending' },
  { id: 'SIG006', docName: '护理计划确认书', elderName: '李德明', type: '护理计划确认书', signedBy: '李德明', signedAt: '2026-06-18 10:30', status: 'signed' },
  { id: 'SIG007', docName: '入住协议', elderName: '王建国', type: '入住协议', signedBy: '王晓明', signedAt: '2026-06-15 14:20', status: 'signed' },
  { id: 'SIG008', docName: '医疗授权书', elderName: '孙玉华', type: '医疗授权书', signedBy: '孙涛', signedAt: '2026-06-12 09:15', status: 'signed' },
  { id: 'SIG009', docName: '费用确认单', elderName: '赵福来', type: '费用确认单', signedBy: '赵雪', signedAt: '2026-06-10 16:45', status: 'signed' },
  { id: 'SIG010', docName: '服务变更通知', elderName: '陈志强', type: '服务变更通知', signedBy: '陈丽华', signedAt: '2026-06-08 11:00', status: 'signed' },
]

type FilterType = 'all' | 'pending' | 'signed'

export default function ElectronicSignature() {
  const [records, setRecords] = useState<SignatureRecord[]>(initialRecords)
  const [filter, setFilter] = useState<FilterType>('all')
  const [signingId, setSigningId] = useState<string | null>(null)
  const [signerName, setSignerName] = useState('')

  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter)

  const pendingCount = records.filter((r) => r.status === 'pending').length
  const signedCount = records.filter((r) => r.status === 'signed').length

  const handleConfirmSign = () => {
    if (!signingId || !signerName.trim()) return
    setRecords((prev) =>
      prev.map((r) =>
        r.id === signingId
          ? { ...r, status: 'signed' as const, signedBy: signerName.trim(), signedAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-') }
          : r
      )
    )
    setSigningId(null)
    setSignerName('')
  }

  const typeColorMap: Record<string, string> = {
    '护理计划确认书': 'bg-blue-50 text-blue-600',
    '入住协议': 'bg-purple-50 text-purple-600',
    '医疗授权书': 'bg-red-50 text-red-600',
    '服务变更通知': 'bg-amber-50 text-amber-600',
    '费用确认单': 'bg-green-50 text-green-600',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">电子签名归档管理</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-slate-400">总文档数</div>
            <div className="text-2xl font-bold text-slate-800">{records.length}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-sm text-slate-400">待签署</div>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-slate-400">已签署</div>
            <div className="text-2xl font-bold text-green-600">{signedCount}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {(['all', 'pending', 'signed'] as FilterType[]).map((f) => {
          const labels = { all: '全部', pending: '待签署', signed: '已签署' }
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === f ? 'bg-primary-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {labels[f]}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{pendingCount}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((record) => (
          <div key={record.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{record.docName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeColorMap[record.type] ?? 'bg-slate-50 text-slate-500'}`}>
                    {record.type}
                  </span>
                  <span className="text-xs text-slate-400">老人: {record.elderName}</span>
                </div>
              </div>
              {record.status === 'pending' ? (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">待签署</span>
              ) : (
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">已签署</span>
              )}
            </div>

            {record.status === 'signed' ? (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 mb-3">
                  <div className="text-center">
                    <PenLine className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                    <span className="text-lg font-semibold text-slate-600 italic" style={{ fontFamily: 'cursive' }}>
                      {record.signedBy}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>签署人: {record.signedBy}</span>
                  <span>{record.signedAt}</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => {
                    setSigningId(record.id)
                    setSignerName('')
                  }}
                  className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1.5"
                >
                  <PenLine className="w-4 h-4" />
                  签署
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {signingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSigningId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">电子签名</h2>
              <button onClick={() => setSigningId(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-slate-500 mb-1">文档</div>
              <div className="text-sm font-medium text-slate-800">
                {records.find((r) => r.id === signingId)?.docName}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-500 block mb-1">签署人姓名</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="请输入签署人姓名"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            <div className="mb-6">
              <label className="text-sm text-slate-500 block mb-1">手写签名</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl h-40 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <PenLine className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span className="text-sm text-slate-400">手写签名区域</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setSigningId(null)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSign}
                disabled={!signerName.trim()}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  signerName.trim() ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                确认签署
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
