import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react'

interface Institution {
  id: string
  name: string
  type: string
  creditCode: string
  status: '已认证' | '待审核' | '已过期'
  licenseExpiry: string
  registeredAt: string
}

const statusStyles: Record<string, string> = {
  '已认证': 'bg-green-100 text-green-700',
  '待审核': 'bg-amber-100 text-amber-700',
  '已过期': 'bg-red-100 text-red-700',
}

function mapStatus(s: string): Institution['status'] {
  if (s === 'approved') return '已认证'
  if (s === 'pending') return '待审核'
  return '已过期'
}

function toStatusParam(s: string): string {
  if (s === '已认证') return 'approved'
  if (s === '待审核') return 'pending'
  if (s === '已过期') return 'rejected'
  return ''
}

export default function Institutions() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('全部')
  const [loading, setLoading] = useState(true)

  const fetchInstitutions = async (status?: string) => {
    setLoading(true)
    try {
      const query = status && status !== '全部' ? `?status=${toStatusParam(status)}` : ''
      const res = await apiFetch<{ success: boolean; data: any[] }>(`/admin/institutions/review${query}`)
      if (res.success && res.data) {
        setInstitutions(
          res.data.map((item) => ({
            id: String(item.id),
            name: item.institution_name,
            type: item.institution_type,
            creditCode: item.credit_code,
            status: mapStatus(item.review_status),
            licenseExpiry: item.license_expiry || '-',
            registeredAt: item.last_review_date || '-',
          }))
        )
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstitutions()
  }, [])

  const filtered = filterStatus === '全部'
    ? institutions
    : institutions.filter((i) => i.status === filterStatus)

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const review_status = action === 'approve' ? 'approved' : 'rejected'
    try {
      await apiFetch(`/admin/institutions/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ review_status, last_review_date: new Date().toISOString().split('T')[0] }),
      })
      setInstitutions((prev) =>
        prev.map((i) => i.id === id ? { ...i, status: action === 'approve' ? '已认证' : '已过期' } : i)
      )
    } catch {
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">机构年审</h1>

      <div className="flex gap-2 mb-6">
        {['全部', '待审核', '已认证', '已过期'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">机构名称</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">类型</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">信用代码</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">审核状态</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">许可证到期</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">注册时间</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst) => (
                <tr key={inst.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="px-5 py-3 text-sm font-medium text-stone-800">{inst.name}</td>
                  <td className="px-5 py-3 text-sm text-stone-600">{inst.type}</td>
                  <td className="px-5 py-3 text-sm text-stone-500 font-mono">{inst.creditCode}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[inst.status]}`}>
                      {inst.status === '已过期' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-stone-600">{inst.licenseExpiry}</td>
                  <td className="px-5 py-3 text-sm text-stone-500">{inst.registeredAt}</td>
                  <td className="px-5 py-3">
                    {inst.status === '待审核' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(inst.id, 'approve')} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors" title="通过">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAction(inst.id, 'reject')} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors" title="拒绝">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {inst.status === '已过期' && (
                      <button onClick={() => handleAction(inst.id, 'approve')} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200 transition-colors">
                        重新年审
                      </button>
                    )}
                    {inst.status === '已认证' && (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
