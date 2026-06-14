import { useState, useEffect, useCallback } from 'react'
import { api, apiPost, apiPut } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { FileText, Clock, CheckCircle, ArrowLeft, Upload, Receipt, MessageSquare } from 'lucide-react'

interface ServiceItem {
  id: number
  name: string
  bureau: string
  description: string
  category: string
  icon: string | null
}

interface ServiceApplication {
  id: number
  user_id: number
  service_id: number
  service_name: string
  service_bureau: string
  form_data: any
  materials: any
  progress_logs: any[]
  receipt: any
  feedback: any
  result: string
  status: string
  created_at: string
  updated_at: string
}

const categoryTabs = [
  '全部', '民生保障', '住房建设', '安全法治', '出行交通', '经济商贸', '文化休闲', '城市建设', '乡村振兴', '创新创业', '政务公开',
]

const appStatusMap: Record<string, { label: string; cls: string }> = {
  submitted: { label: '已提交', cls: 'bg-blue-100 text-blue-700' },
  accepted: { label: '已受理', cls: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '办理中', cls: 'bg-orange-100 text-orange-700' },
  completed: { label: '已办结', cls: 'bg-green-100 text-green-700' },
}

const stepIcons = [FileText, Receipt, Clock, CheckCircle]

export default function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<ServiceItem[]>([])
  const [applications, setApplications] = useState<ServiceApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('全部')
  const [viewMode, setViewMode] = useState<'browse' | 'myapps' | 'detail'>('browse')
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [selectedApp, setSelectedApp] = useState<ServiceApplication | null>(null)
  const [formData, setFormData] = useState('')
  const [materials, setMaterials] = useState('')
  const [applyLoading, setApplyLoading] = useState(false)
  const [myAppsPage, setMyAppsPage] = useState(1)
  const [myAppsTotal, setMyAppsTotal] = useState(0)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const params = activeTab !== '全部' ? `?category=${encodeURIComponent(activeTab)}` : ''
      const res = await api<ServiceItem[]>(`/services${params}`)
      if (res.success) setServices(res.data)
    } catch { void 0 } finally {
      setLoading(false)
    }
  }, [activeTab])

  const fetchMyApplications = useCallback(async () => {
    if (!user) return
    try {
      const res = await api<{ list: ServiceApplication[]; total: number }>(`/services/applications/user/${user.id}?page=${myAppsPage}`)
      if (res.success) {
        setApplications(res.data.list)
        setMyAppsTotal(res.data.total)
      }
    } catch { void 0 }
  }, [user, myAppsPage])

  useEffect(() => {
    if (viewMode === 'browse') fetchServices()
    else if (viewMode === 'myapps') fetchMyApplications()
  }, [viewMode, fetchServices, fetchMyApplications])

  const handleApply = async () => {
    if (!user || !selectedService) return
    setApplyLoading(true)
    try {
      const res = await apiPost('/services/apply', {
        user_id: user.id,
        service_id: selectedService.id,
        form_data: formData,
        materials: materials ? materials.split('\n').filter(Boolean) : null,
      })
      if (res.success) {
        setSelectedService(null)
        setFormData('')
        setMaterials('')
        setViewMode('myapps')
      }
    } catch { void 0 } finally {
      setApplyLoading(false)
    }
  }

  const viewAppDetail = async (id: number) => {
    try {
      const res = await api<ServiceApplication>(`/services/applications/${id}`)
      if (res.success) {
        setSelectedApp(res.data)
        setViewMode('detail')
      }
    } catch { void 0 }
  }

  if (loading && viewMode === 'browse') {
    return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">便民服务聚合网关</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setViewMode('browse'); setSelectedApp(null) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'browse' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            服务大厅
          </button>
          <button
            onClick={() => { setViewMode('myapps'); setSelectedApp(null); setMyAppsPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'myapps' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            我的申请 ({myAppsTotal})
          </button>
        </div>
      </div>

      {viewMode === 'browse' && (
        <>
          <div className="bg-white rounded-lg shadow p-3 flex flex-wrap gap-2">
            {categoryTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.id} className="bg-white rounded-lg shadow p-5 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">{s.name}</h3>
                    <p className="text-xs text-blue-600">{s.bureau}</p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s.category}</span>
                </div>
                <p className="text-sm text-slate-500 flex-1 mb-4 line-clamp-2">{s.description || '暂无描述'}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-400">平均3-5工作日</div>
                  <button
                    onClick={() => setSelectedService(s)}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                  >
                    在线办理
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {viewMode === 'myapps' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p>暂无申请记录</p>
              <button onClick={() => setViewMode('browse')} className="mt-3 text-blue-600 text-sm hover:underline">前往服务大厅</button>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-slate-50 cursor-pointer" onClick={() => viewAppDetail(app.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-slate-800">{app.service_name}</h4>
                        <p className="text-xs text-slate-500">{app.service_bureau}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${appStatusMap[app.status]?.cls || 'bg-slate-100 text-slate-600'}`}>
                        {appStatusMap[app.status]?.label || app.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>申请编号: APP-{String(app.id).padStart(5, '0')}</span>
                      <span>{app.created_at?.slice(0, 16)?.replace('T', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
              {myAppsTotal > 10 && (
                <div className="flex justify-center gap-2 p-4 border-t">
                  <button disabled={myAppsPage <= 1} onClick={() => setMyAppsPage(p => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">上一页</button>
                  <button disabled={myAppsPage * 10 >= myAppsTotal} onClick={() => setMyAppsPage(p => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">下一页</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {viewMode === 'detail' && selectedApp && (
        <div className="space-y-4">
          <button onClick={() => { setViewMode('myapps'); setSelectedApp(null) }} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800">
            <ArrowLeft size={16} /> 返回列表
          </button>

          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{selectedApp.service_name}</h3>
                <p className="text-sm text-slate-500">申请编号: APP-{String(selectedApp.id).padStart(5, '0')}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${appStatusMap[selectedApp.status]?.cls || 'bg-slate-100 text-slate-600'}`}>
                {appStatusMap[selectedApp.status]?.label || selectedApp.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">承办部门:</span> <span className="text-slate-700">{selectedApp.service_bureau}</span></div>
              <div><span className="text-slate-500">申请时间:</span> <span className="text-slate-700">{selectedApp.created_at?.slice(0, 16)?.replace('T', ' ')}</span></div>
              <div className="col-span-2"><span className="text-slate-500">最后更新:</span> <span className="text-slate-700">{selectedApp.updated_at?.slice(0, 16)?.replace('T', ' ')}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} /> 办理进度
            </h4>
            <div className="relative">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200"></div>
              <div className="space-y-4">
                {(selectedApp.progress_logs || []).map((log, i) => {
                  const StepIcon = stepIcons[i % stepIcons.length]
                  const isLast = i === (selectedApp.progress_logs?.length || 0) - 1
                  return (
                    <div key={i} className="relative flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 ${isLast ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <StepIcon size={14} />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">{log.description}</span>
                          <span className="text-xs text-slate-400">{log.time?.slice(0, 16)?.replace('T', ' ')}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">操作人: {log.operator}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {selectedApp.materials && selectedApp.materials?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-5">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Upload size={18} /> 提交材料
              </h4>
              <div className="space-y-2">
                {(selectedApp.materials as string[]).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded">
                    <FileText size={14} /> {m}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedApp.receipt && (
            <div className="bg-white rounded-lg shadow p-5">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Receipt size={18} /> 部门回执
              </h4>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-800 font-medium">受理编号: {selectedApp.receipt.receipt_no}</span>
                  <span className="text-xs text-blue-600">{selectedApp.receipt.issued_at?.slice(0, 10)}</span>
                </div>
                <p className="text-sm text-blue-700 mb-2">{selectedApp.receipt.content}</p>
                <div className="flex items-center justify-between text-xs text-blue-600">
                  <span>经办人: {selectedApp.receipt.handler}</span>
                  <span>{selectedApp.receipt.department}</span>
                </div>
              </div>
            </div>
          )}

          {selectedApp.result && (
            <div className="bg-white rounded-lg shadow p-5">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle size={18} /> 办理结果
              </h4>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-700">
                {selectedApp.result}
              </div>
            </div>
          )}

          {selectedApp.feedback && (
            <div className="bg-white rounded-lg shadow p-5">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <MessageSquare size={18} /> 我的评价
              </h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-700">{selectedApp.feedback.content}</p>
                <p className="text-xs text-slate-400 mt-2">{selectedApp.feedback.created_at?.slice(0, 16)?.replace('T', ' ')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">办理服务</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-slate-500">{selectedService.name}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{selectedService.bureau}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">申请信息</label>
                <textarea
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="请填写详细的申请信息..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">上传材料 (每行一项)</label>
                <textarea
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="身份证扫描件&#10;户口本扫描件&#10;相关证明材料"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setSelectedService(null); setFormData(''); setMaterials('') }} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-100">取消</button>
              <button onClick={handleApply} disabled={applyLoading || !formData.trim()} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {applyLoading ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
