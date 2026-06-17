import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit3, Trash2, Power, PowerOff, X, BarChart3 } from 'lucide-react'
import { getCampaigns, createCampaign, updateCampaign, updateCampaignStatus, deleteCampaign, getAdminMerchants, getCampaignStats } from '@/utils/api'

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-gray-100 text-gray-500' },
  active: { label: '进行中', cls: 'bg-secondary-50 text-secondary' },
  ended: { label: '已结束', cls: 'bg-gray-100 text-gray-500' },
}

interface CampaignForm {
  name: string
  description: string
  start_time: string
  end_time: string
  merchantIds: string[]
}

const emptyForm: CampaignForm = { name: '', description: '', start_time: '', end_time: '', merchantIds: [] }

export default function CampaignManage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CampaignForm>(emptyForm)
  const [merchantList, setMerchantList] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [statsCampaign, setStatsCampaign] = useState<any>(null)
  const [statsData, setStatsData] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCampaigns() as any
      setCampaigns(Array.isArray(res) ? res : res?.items || res?.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const openCreate = async () => {
    setEditingId(null)
    setForm(emptyForm)
    const res = await getAdminMerchants({ page: 1, pageSize: 100 })
    setMerchantList(res.items || res.list || [])
    setShowModal(true)
  }

  const openEdit = async (c: any) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      description: c.description || '',
      start_time: c.start_time?.slice(0, 16) || '',
      end_time: c.end_time?.slice(0, 16) || '',
      merchantIds: (c.merchants || []).map((m: any) => m.id || m),
    })
    const res = await getAdminMerchants({ page: 1, pageSize: 100 })
    setMerchantList(res.items || res.list || [])
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const data = { ...form, merchants: form.merchantIds }
      if (editingId) {
        await updateCampaign(editingId, data)
      } else {
        await createCampaign(data)
      }
      setShowModal(false)
      fetchCampaigns()
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (c: any) => {
    const newStatus = c.status === 'active' ? 'draft' : 'active'
    await updateCampaignStatus(c.id, newStatus)
    fetchCampaigns()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该活动？')) return
    await deleteCampaign(id)
    fetchCampaigns()
  }

  const handleViewStats = async (c: any) => {
    setStatsCampaign(c)
    setStatsLoading(true)
    try {
      const res = await getCampaignStats(c.id)
      setStatsData(res)
    } catch {
      setStatsData(null)
    } finally {
      setStatsLoading(false)
    }
  }

  const toggleMerchant = (id: string) => {
    setForm((prev) => ({
      ...prev,
      merchantIds: prev.merchantIds.includes(id)
        ? prev.merchantIds.filter((m) => m !== id)
        : [...prev.merchantIds, id],
    }))
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />创建活动
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-400">暂无活动</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c: any) => (
            <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-700 truncate flex-1">{c.name}</h3>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${statusMap[c.status]?.cls || ''}`}>
                  {statusMap[c.status]?.label || c.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{c.description || '暂无描述'}</p>
              <p className="text-xs text-gray-500 mb-1">
                {c.start_time?.slice(0, 10)} ~ {c.end_time?.slice(0, 10)}
              </p>
              <p className="text-xs text-gray-500 mb-4">参与商户: {(c.merchants || []).length} 家</p>
              <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                {c.status !== 'ended' && (
                  <button onClick={() => handleToggle(c)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${c.status === 'active' ? 'text-danger hover:bg-danger-50' : 'text-secondary hover:bg-secondary-50'}`}>
                    {c.status === 'active' ? <><PowerOff className="w-3 h-3" />下线</> : <><Power className="w-3 h-3" />上线</>}
                  </button>
                )}
                <button onClick={() => handleViewStats(c)} className="flex items-center gap-1 text-xs text-accent hover:bg-accent-50 px-2 py-1 rounded transition-colors">
                  <BarChart3 className="w-3 h-3" />效果
                </button>
                <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-xs text-primary hover:bg-primary-50 px-2 py-1 rounded transition-colors">
                  <Edit3 className="w-3 h-3" />编辑
                </button>
                <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1 text-xs text-danger hover:bg-danger-50 px-2 py-1 rounded transition-colors">
                  <Trash2 className="w-3 h-3" />删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">{editingId ? '编辑活动' : '创建活动'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">活动名称</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field text-sm" placeholder="输入活动名称" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field text-sm" rows={3} placeholder="活动描述" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">开始时间</label>
                  <input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">结束时间</label>
                  <input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input-field text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">选择参与商户</label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                  {merchantList.map((m: any) => (
                    <label key={m.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer hover:bg-gray-50 px-2 rounded">
                      <input type="checkbox" checked={form.merchantIds.includes(m.id)} onChange={() => toggleMerchant(m.id)} className="accent-primary" />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleSubmit} disabled={saving || !form.name} className="btn-primary text-sm disabled:opacity-50">
                {saving ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {statsCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setStatsCampaign(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">活动效果 · {statsCampaign.name}</h3>
              <button onClick={() => setStatsCampaign(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {statsLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-gray-100 rounded" />
                <div className="h-32 bg-gray-100 rounded" />
              </div>
            ) : statsData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">参与商户</p>
                    <p className="text-xl font-bold text-primary">{statsData.merchantCount}</p>
                  </div>
                  <div className="bg-accent-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">总订单</p>
                    <p className="text-xl font-bold text-accent">{statsData.totalOrders}</p>
                  </div>
                  <div className="bg-secondary-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">总营收</p>
                    <p className="text-xl font-bold text-secondary">¥{Number(statsData.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-danger-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">券核销率</p>
                    <p className="text-xl font-bold text-danger">{statsData.verificationRate}%</p>
                  </div>
                </div>
                {statsData.merchantStats?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">商户效果明细</h4>
                    <div className="space-y-2">
                      {statsData.merchantStats.map((ms: any) => (
                        <div key={ms.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                          <div className="flex-1">
                            <p className="font-medium">{ms.name}</p>
                            <p className="text-xs text-gray-400">{ms.category}</p>
                          </div>
                          <div className="text-right text-xs">
                            <p>订单 {ms.orders}</p>
                            <p className="text-accent">¥{ms.revenue}</p>
                            <p className="text-secondary">核销{ms.verified}单</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">暂无效果数据</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
