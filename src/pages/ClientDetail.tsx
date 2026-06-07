import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Send, Home, MapPin, Phone, User, Tag } from 'lucide-react'
import { api } from '@/lib/api'
import type { Client, Followup, House } from '@/types'
import FollowupTimeline from '@/components/FollowupTimeline'
import { cn } from '@/lib/utils'

interface ClientDetailResponse extends Client {
  followups: Followup[]
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

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<ClientDetailResponse | null>(null)
  const [matchedHouses, setMatchedHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [followupContent, setFollowupContent] = useState('')
  const [followupType, setFollowupType] = useState<'call' | 'visit' | 'wechat' | 'other'>('call')
  const [nextFollowup, setNextFollowup] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchClient = async () => {
    if (!id) return
    setLoading(true)
    try {
      const result = await api.get<ClientDetailResponse>(`/clients/${id}`)
      if (result.success && result.data) {
        setClient(result.data)
      } else {
        console.error('获取客户详情失败', result.error)
      }
    } catch (e) {
      console.error('获取客户详情失败', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatchedHouses = async () => {
    if (!id) return
    try {
      const result = await api.get<House[]>(`/clients/${id}/match`)
      if (result.success && result.data) {
        setMatchedHouses(result.data)
      } else {
        console.error('获取匹配房源失败', result.error)
      }
    } catch (e) {
      console.error('获取匹配房源失败', e)
    }
  }

  useEffect(() => {
    fetchClient()
    fetchMatchedHouses()
  }, [id])

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !followupContent.trim()) return

    setSubmitting(true)
    try {
      await api.post(`/clients/${id}/followup`, {
        content: followupContent,
        type: followupType,
        nextFollowup: nextFollowup || undefined,
      })
      setFollowupContent('')
      setNextFollowup('')
      fetchClient()
    } catch (e) {
      console.error('添加跟进失败', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除此客户吗？')) return
    try {
      await api.delete(`/clients/${id}`)
      navigate('/clients')
    } catch (e) {
      console.error('删除客户失败', e)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">客户不存在</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate('/clients')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回客户列表
        </button>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', intentConfig[client.intent_type]?.className)}>
              {intentConfig[client.intent_type]?.label}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig[client.status]?.className)}>
              {statusConfig[client.status]?.label}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/clients/${client.id}/edit`)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">基本信息</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">客户姓名</p>
                    <p className="font-medium text-gray-900">{client.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">联系电话</p>
                    <p className="font-medium text-gray-900">{client.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <Tag className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">预算范围</p>
                    <p className="font-medium text-gray-900">
                      {client.budget_min || client.budget_max
                        ? `${client.budget_min ? client.budget_min.toLocaleString() : '0'} - ${client.budget_max ? client.budget_max.toLocaleString() : '∞'}`
                        : '未设置'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">偏好区域</p>
                    <p className="font-medium text-gray-900">{client.preferred_area || '未设置'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                    <Home className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">房型偏好</p>
                    <p className="font-medium text-gray-900">{client.house_type_pref || '未设置'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">客户来源</p>
                    <p className="font-medium text-gray-900">{client.source || '未设置'}</p>
                  </div>
                </div>
              </div>
              {client.remark && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">备注</p>
                  <p className="mt-1 text-gray-700">{client.remark}</p>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">添加跟进</h2>
              <form onSubmit={handleAddFollowup} className="space-y-4">
                <div>
                  <textarea
                    value={followupContent}
                    onChange={(e) => setFollowupContent(e.target.value)}
                    placeholder="请输入跟进内容..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[150px]">
                    <label className="mb-1 block text-sm text-gray-600">跟进方式</label>
                    <select
                      value={followupType}
                      onChange={(e) => setFollowupType(e.target.value as typeof followupType)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="call">电话</option>
                      <option value="visit">带看</option>
                      <option value="wechat">微信</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="mb-1 block text-sm text-gray-600">下次跟进日期</label>
                    <input
                      type="date"
                      value={nextFollowup}
                      onChange={(e) => setNextFollowup(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={submitting || !followupContent.trim()}
                      className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {submitting ? '提交中...' : '提交'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">跟进记录</h2>
              <FollowupTimeline followups={client.followups || []} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">智能匹配房源</h2>
              {matchedHouses.length === 0 ? (
                <p className="text-center text-gray-400">暂无匹配房源</p>
              ) : (
                <div className="space-y-4">
                  {matchedHouses.map((house) => (
                    <div key={house.id} className="rounded-lg border border-gray-100 p-4 hover:border-blue-200 hover:bg-blue-50/50">
                      <h3 className="font-medium text-gray-900">{house.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{house.address}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-lg font-bold text-orange-500">
                          {house.price?.toLocaleString()}
                          <span className="ml-1 text-xs font-normal text-gray-500">
                            {house.unit_type === 'rent' ? '/月' : '万'}
                          </span>
                        </span>
                        <div className="flex gap-2 text-xs text-gray-500">
                          {house.area && <span>{house.area}㎡</span>}
                          {house.house_type && <span>{house.house_type}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">负责经纪人</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{client.agent_name || '未分配'}</p>
                  <p className="text-sm text-gray-500">专属经纪人</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
