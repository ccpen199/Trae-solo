import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Clock, Users, CheckCircle, FileText, ListOrdered, Send } from 'lucide-react'
import { apiFetch, mapService, mapMaterial } from '@/utils/api'
import type { ServiceItem } from '@/types'

type TabKey = 'guide' | 'materials' | 'process' | 'apply'

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const [service, setService] = useState<ServiceItem | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('guide')
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    apiFetch<Record<string, unknown>>(`/api/services/${id}`)
      .then((d) => {
        const svc = mapService(d)
        svc.requiredMaterials = ((d.materials || []) as Array<Record<string, unknown>>).map(mapMaterial)
        setService(svc as ServiceItem)
      })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!service) return
    const initial: Record<string, string> = {}
    service.requiredMaterials.forEach((m) => {
      m.ocrFields.forEach((f) => {
        initial[f] = ''
      })
    })
    setFormData(initial)
  }, [service])

  if (!service) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
    )
  }

  const tabs: { key: TabKey; label: string; icon: typeof FileText }[] = [
    { key: 'guide', label: '办理指南', icon: FileText },
    { key: 'materials', label: '所需材料', icon: ListOrdered },
    { key: 'process', label: '办理流程', icon: Clock },
    { key: 'apply', label: '在线申办', icon: Send },
  ]

  const statusMap: Record<string, { label: string; cls: string }> = {
    online: { label: '可办理', cls: 'bg-green-100 text-green-700' },
    offline: { label: '暂不可用', cls: 'bg-gray-100 text-gray-500' },
    pending: { label: '审核中', cls: 'bg-amber-100 text-amber-700' },
  }
  const st = statusMap[service.status] || statusMap.pending

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-800">{service.name}</h1>
              <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {service.department}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {service.applicantCount}人已申请
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 flex">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-gov-blue-500 text-gov-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'guide' && (
            <div className="prose prose-sm max-w-none text-gray-600">
              <p>{service.description}</p>
            </div>
          )}

          {activeTab === 'materials' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-gray-500 font-medium">材料名称</th>
                  <th className="text-left py-3 text-gray-500 font-medium">说明</th>
                  <th className="text-center py-3 text-gray-500 font-medium">必填</th>
                  <th className="text-center py-3 text-gray-500 font-medium">OCR支持</th>
                </tr>
              </thead>
              <tbody>
                {service.requiredMaterials.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="py-3 text-gray-800">{m.name}</td>
                    <td className="py-3 text-gray-500">{m.description}</td>
                    <td className="py-3 text-center">
                      {m.required && <CheckCircle className="w-4 h-4 text-gov-blue-500 inline" />}
                    </td>
                    <td className="py-3 text-center">
                      {m.ocrFields.length > 0 && (
                        <span className="px-2 py-0.5 bg-convenience/10 text-convenience text-xs rounded">OCR</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'process' && (
            <div className="space-y-0">
              {service.processSteps.map((step, i) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      i === 0 ? 'bg-gov-blue-500 text-white' : 'bg-gov-blue-100 text-gov-blue-600'
                    }`}>
                      {step.step}
                    </div>
                    {i < service.processSteps.length - 1 && (
                      <div className="w-0.5 h-12 bg-gov-blue-100" />
                    )}
                  </div>
                  <div className="pb-8">
                    <h4 className="text-sm font-medium text-gray-800">{step.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      <span>{step.department}</span>
                      <span>预计 {step.estimatedDays} 个工作日</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'apply' && (
            <form onSubmit={(e) => { e.preventDefault() }} className="space-y-4 max-w-lg">
              {Object.keys(formData).map((field) => (
                <div key={field}>
                  <label className="block text-sm text-gray-700 mb-1">{field}</label>
                  <input
                    value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue-400"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="px-6 py-2.5 bg-gov-blue-500 text-white rounded-md hover:bg-gov-blue-600 transition-colors text-sm font-medium"
              >
                提交申请
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
