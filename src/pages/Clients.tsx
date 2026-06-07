import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ChevronLeft, ChevronRight, Edit, Trash2, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import type { Client } from '@/types'
import { cn } from '@/lib/utils'

interface ClientListResponse {
  data: Client[]
  total: number
  page: number
  pageSize: number
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '跟进中', className: 'bg-green-100 text-green-700' },
  dealing: { label: '洽谈中', className: 'bg-blue-100 text-blue-700' },
  closed: { label: '已成交', className: 'bg-gray-100 text-gray-700' },
}

const intentConfig: Record<string, { label: string; className: string }> = {
  buy: { label: '购房', className: 'bg-orange-100 text-orange-700' },
  rent: { label: '租房', className: 'bg-purple-100 text-purple-700' },
}

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [intentType, setIntentType] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const fetchClients = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (status) params.status = status
      if (intentType) params.intentType = intentType

      const result = await api.get<ClientListResponse>('/clients', params)
      if (result.success && result.data) {
        setClients(result.data.data)
        setTotal(result.data.total)
      } else {
        console.error('获取客户列表失败', result.error)
      }
    } catch (e) {
      console.error('获取客户列表失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [page, status, intentType])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchClients()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此客户吗？')) return
    try {
      await api.delete(`/clients/${id}`)
      fetchClients()
    } catch (e) {
      console.error('删除客户失败', e)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
          <button
            onClick={() => navigate('/clients/new')}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            添加客户
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索客户姓名或电话..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">全部状态</option>
              <option value="active">跟进中</option>
              <option value="dealing">洽谈中</option>
              <option value="closed">已成交</option>
            </select>
            <select
              value={intentType}
              onChange={(e) => { setIntentType(e.target.value); setPage(1) }}
              className="rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">全部意向</option>
              <option value="buy">购房</option>
              <option value="rent">租房</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
            >
              搜索
            </button>
          </form>
        </div>

        <div className="rounded-lg bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">姓名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">电话</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">意向</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">预算</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">偏好区域</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">经纪人</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">加载中...</td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">暂无客户数据</td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
                      <td className="px-4 py-3 text-gray-600">{client.phone}</td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', intentConfig[client.intent_type]?.className)}>
                          {intentConfig[client.intent_type]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {client.budget_min || client.budget_max
                          ? `${client.budget_min ? client.budget_min.toLocaleString() : '0'} - ${client.budget_max ? client.budget_max.toLocaleString() : '∞'}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{client.preferred_area || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig[client.status]?.className)}>
                          {statusConfig[client.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{client.agent_name || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="rounded p-1 text-blue-500 hover:bg-blue-50"
                            title="查看"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/clients/${client.id}/edit`)}
                            className="rounded p-1 text-yellow-500 hover:bg-yellow-50"
                            title="编辑"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">
                共 {total} 条，第 {page} / {totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-sm disabled:opacity-50"
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
