import { useEffect, useState, useCallback } from 'react'
import { Search, Eye, CheckCircle, XCircle, X, FileText, Image, Clock, Tag, Store, Shield } from 'lucide-react'
import { getAdminMerchants, auditMerchant } from '@/utils/api'

const streets = ['中山街道', '方松街道', '永丰街道', '岳阳街道', '广富林街道', '九里亭街道', '泗泾镇', '佘山镇', '车墩镇', '新桥镇']
const categories = ['餐饮', '娱乐', '休闲', '商超']
const catLabels: Record<string, string> = { food: '餐饮', entertainment: '娱乐', leisure: '休闲', shopping: '商超' }
const sortOptions = [
  { value: 'popularity', label: '热度' },
  { value: 'rating', label: '评分' },
  { value: 'latest', label: '最新' },
]

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: '待审核', cls: 'bg-yellow-50 text-yellow-600' },
  approved: { label: '已通过', cls: 'bg-secondary-50 text-secondary' },
  rejected: { label: '已拒绝', cls: 'bg-danger-50 text-danger' },
}

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function MerchantManage() {
  const [merchants, setMerchants] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [street, setStreet] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('popularity')
  const [keyword, setKeyword] = useState('')
  const [confirm, setConfirm] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null)
  const [detailMerchant, setDetailMerchant] = useState<any>(null)
  const pageSize = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminMerchants({ page, pageSize, street: street || undefined, category: category || undefined, sortBy, keyword: keyword || undefined, status: '' })
      setMerchants(res.items || res.list || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }, [page, street, category, sortBy, keyword])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAudit = async () => {
    if (!confirm) return
    await auditMerchant(confirm.id, confirm.action)
    setConfirm(null)
    fetchData()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">街道</label>
          <select value={street} onChange={(e) => { setStreet(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-32">
            <option value="">全部</option>
            {streets.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">业态</label>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-28">
            <option value="">全部</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">排序</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field text-sm py-2 w-24">
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-gray-500 mb-1 block">搜索</label>
          <div className="relative">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              placeholder="搜索商户名称..."
              className="input-field text-sm py-2 pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="text-left px-4 py-3 font-medium">商户名</th>
                <th className="text-left px-4 py-3 font-medium">分类</th>
                <th className="text-left px-4 py-3 font-medium">街道</th>
                <th className="text-left px-4 py-3 font-medium">评分</th>
                <th className="text-left px-4 py-3 font-medium">热度</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7}><div className="h-12 bg-gray-50 animate-pulse" /></td></tr>
                ))
              ) : merchants.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3">{m.category}</td>
                  <td className="px-4 py-3">{m.street}</td>
                  <td className="px-4 py-3">{m.rating}</td>
                  <td className="px-4 py-3">{m.popularity}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusMap[m.status]?.cls || ''}`}>
                      {statusMap[m.status]?.label || m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetailMerchant(m)}
                        className="text-primary hover:text-primary-light transition-colors"
                        title="查看商户完整资料"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {m.status === 'pending' && (
                        <>
                          <button onClick={() => setConfirm({ id: m.id, action: 'approved' })} className="text-secondary hover:text-secondary-light transition-colors"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => setConfirm({ id: m.id, action: 'rejected' })} className="text-danger hover:text-danger-light transition-colors"><XCircle className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">上一页</button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">下一页</button>
          </div>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-700 mb-2">确认操作</h3>
            <p className="text-sm text-gray-500 mb-5">
              确定要{confirm.action === 'approved' ? '通过' : '拒绝'}该商户的审核吗？
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleAudit} className={`px-4 py-2 text-sm rounded-lg text-white transition-colors ${confirm.action === 'approved' ? 'bg-secondary hover:bg-secondary-light' : 'bg-danger hover:bg-danger-light'}`}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {detailMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetailMerchant(null)}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{detailMerchant.name}</h3>
                  <p className="text-xs text-gray-500">入驻档案号：SJ-{String(detailMerchant.id).slice(0, 8).padEnd(8, '0')}-{detailMerchant.street || 'songjiang'}</p>
                </div>
              </div>
              <button onClick={() => setDetailMerchant(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-[11px] text-gray-400 mb-1">街道</p>
                  <p className="text-sm font-medium text-gray-700">{detailMerchant.street || '--'}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-[11px] text-gray-400 mb-1">业态分类</p>
                  <p className="text-sm font-medium text-gray-700">{catLabels[detailMerchant.category] || detailMerchant.category || '--'}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-[11px] text-gray-400 mb-1">资质状态</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusMap[detailMerchant.status]?.cls || ''}`}>
                    {statusMap[detailMerchant.status]?.label || detailMerchant.status}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Image className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-gray-700">门头照</span>
                  </div>
                  <div className="aspect-[3/2] rounded-lg bg-gradient-to-br from-rose-100 to-red-200 flex items-center justify-center overflow-hidden border border-gray-200">
                    {detailMerchant.cover_image ? (
                      <img src={detailMerchant.cover_image} alt="门头照" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-gray-400">门头照</span>
                    )}
                    {detailMerchant.cover_image && detailMerchant.status === 'approved' && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-secondary text-white text-[9px]">已核验</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-gray-700">营业执照</span>
                  </div>
                  <div className="aspect-[3/2] rounded-lg bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center overflow-hidden border border-gray-200">
                    {detailMerchant.business_license ? (
                      <img src={detailMerchant.business_license} alt="营业执照" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-gray-400">营业执照</span>
                    )}
                  </div>
                  {detailMerchant.license_no && (
                    <p className="text-[10px] text-gray-500 mt-1 font-mono">证照编号：{detailMerchant.license_no}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-gray-700">审核记录</span>
                  </div>
                  <div className="aspect-[3/2] rounded-lg bg-white border border-gray-200 p-2.5 space-y-1.5 text-[10px] overflow-hidden">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-secondary" />
                      <span className="text-gray-600">资质提交：{detailMerchant.created_at ? String(detailMerchant.created_at).replace('T', ' ').slice(0, 16) : '--'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {detailMerchant.status === 'approved' ? <CheckCircle className="w-3 h-3 text-secondary" /> : <XCircle className="w-3 h-3 text-gray-300" />}
                      <span className={detailMerchant.status === 'approved' ? 'text-gray-700' : 'text-gray-400'}>
                        资质核验：{detailMerchant.audited_at ? String(detailMerchant.audited_at).replace('T', ' ').slice(0, 16) : detailMerchant.status === 'pending' ? '审核中' : '--'}
                      </span>
                    </div>
                    {detailMerchant.status === 'approved' && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-secondary" />
                        <span className="text-gray-700">审核人：{detailMerchant.audited_by || '--'}</span>
                      </div>
                    )}
                    <div className="pt-1.5 mt-1 border-t border-gray-100">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-secondary-50 text-secondary text-[9px] border border-secondary-200">
                        核验专用章·SJ{String(detailMerchant.id || '000000').slice(0, 6)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-gray-700">营业时间配置</span>
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-7 divide-x divide-gray-100">
                    {DAYS.map((d, i) => {
                      const hour = Array.isArray(detailMerchant.business_hours) ? detailMerchant.business_hours.find((h: any) => h.day_of_week === (i === 0 ? 0 : i)) : null
                      const isOpen = hour && !hour.closed
                      return (
                        <div key={d} className={`p-2 text-center text-[10px] ${isOpen ? 'bg-secondary-50' : 'bg-gray-50'}`}>
                          <p className={`font-medium ${isOpen ? 'text-secondary' : 'text-gray-400'}`}>{d}</p>
                          {isOpen ? (
                            <>
                              <p className="text-gray-600 font-mono mt-0.5">{hour.open_time}</p>
                              <p className="text-gray-400">-</p>
                              <p className="text-gray-600 font-mono">{hour.close_time}</p>
                            </>
                          ) : (
                            <p className="text-gray-400 mt-2">休息</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-gray-700">优惠标签</span>
                  <span className="text-[10px] text-gray-400">（{detailMerchant.tags?.length || 0}个已配置）</span>
                </div>
                {detailMerchant.tags?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {detailMerchant.tags.map((t: string) => (
                      <span key={t} className="px-2 py-1 rounded-full bg-primary-50 text-primary text-xs font-medium">{t}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">暂未配置优惠标签</p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-gradient-to-r from-primary-50/60 to-secondary-50/40 border border-primary-100/50 text-[11px] text-gray-600 space-y-1">
                <p className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">闭环承接说明：</span>
                  商户入驻提交（MerchantJoin）→ 资质核验资料沉淀 → 商户后台审核（本页）→ 审核通过后套餐发布 → 消费报告统计全流程可追溯
                </p>
                <p className="text-gray-500 pl-5">数据来源：松江围栏业务数据库 · 资质/门头/营业时间/标签与首页商户展示同源</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
