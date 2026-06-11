import { useEffect, useState } from 'react'
import { Wifi, WifiOff, Settings, Pencil } from 'lucide-react'
import { apiFetch, mapService } from '@/utils/api'
import type { ServiceItem } from '@/types'

type TabKey = 'http' | 'webhook' | 'gateway'

interface HttpConfig {
  endpoint: string
  method: string
  headers: string
}

interface WebhookConfig {
  callbackUrl: string
  events: string[]
}

interface GatewayConfig {
  route: string
  rateLimit: string
  authType: string
}

const eventOptions = ['服务上线', '服务下线', '数据更新', '审批完成', '异常告警']

export default function Integration() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('http')
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle')

  const [httpConfig, setHttpConfig] = useState<HttpConfig>({ endpoint: '', method: 'GET', headers: '{}' })
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({ callbackUrl: '', events: [] })
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig>({ route: '', rateLimit: '100', authType: 'token' })

  useEffect(() => {
    apiFetch<Array<Record<string, unknown>>>('/api/services?status=all')
      .then((d) => setServices(d.map(mapService) as ServiceItem[]))
      .catch(() => setServices([]))
  }, [])

  const handleTest = () => {
    setTestResult('testing')
    setTimeout(() => {
      setTestResult(Math.random() > 0.3 ? 'success' : 'fail')
    }, 1500)
  }

  const toggleEvent = (event: string) => {
    setWebhookConfig((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }))
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'http', label: 'HTTP接口' },
    { key: 'webhook', label: 'Webhook回调' },
    { key: 'gateway', label: 'API网关' },
  ]

  const accessTypeMap: Record<string, string> = {
    http: 'HTTP',
    webhook: 'Webhook',
    'api-gateway': 'API网关',
  }

  const statusMap: Record<string, { label: string; cls: string }> = {
    online: { label: '在线', cls: 'bg-green-100 text-green-700' },
    offline: { label: '离线', cls: 'bg-gray-100 text-gray-500' },
    pending: { label: '待审核', cls: 'bg-amber-100 text-amber-700' },
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 flex">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-gov-blue-500 text-gov-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === 'http' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm text-gray-700 mb-1">接口地址</label>
                <input
                  value={httpConfig.endpoint}
                  onChange={(e) => setHttpConfig({ ...httpConfig, endpoint: e.target.value })}
                  placeholder="https://api.example.com/v1/service"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">请求方法</label>
                <select
                  value={httpConfig.method}
                  onChange={(e) => setHttpConfig({ ...httpConfig, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue-400"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Headers (JSON)</label>
                <textarea
                  value={httpConfig.headers}
                  onChange={(e) => setHttpConfig({ ...httpConfig, headers: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:border-gov-blue-400"
                />
              </div>
            </div>
          )}

          {activeTab === 'webhook' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm text-gray-700 mb-1">回调地址</label>
                <input
                  value={webhookConfig.callbackUrl}
                  onChange={(e) => setWebhookConfig({ ...webhookConfig, callbackUrl: e.target.value })}
                  placeholder="https://your-server.com/webhook"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">订阅事件</label>
                <div className="flex flex-wrap gap-2">
                  {eventOptions.map((ev) => (
                    <label key={ev} className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookConfig.events.includes(ev)}
                        onChange={() => toggleEvent(ev)}
                        className="rounded border-gray-300 text-gov-blue-500 focus:ring-gov-blue-400"
                      />
                      {ev}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gateway' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm text-gray-700 mb-1">路由路径</label>
                <input
                  value={gatewayConfig.route}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, route: e.target.value })}
                  placeholder="/api/v1/service"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">速率限制 (次/分钟)</label>
                <input
                  value={gatewayConfig.rateLimit}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, rateLimit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">认证方式</label>
                <select
                  value={gatewayConfig.authType}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, authType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue-400"
                >
                  <option value="token">Token</option>
                  <option value="oauth2">OAuth2</option>
                  <option value="api-key">API Key</option>
                  <option value="none">无认证</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={testResult === 'testing'}
              className="px-5 py-2 bg-gov-blue-500 text-white rounded-md hover:bg-gov-blue-600 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {testResult === 'testing' ? '测试中...' : '测试连接'}
            </button>
            {testResult === 'success' && (
              <span className="text-sm text-green-600">连接成功</span>
            )}
            {testResult === 'fail' && (
              <span className="text-sm text-red-500">连接失败</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-medium text-gray-800 mb-4">服务生命周期管理</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 text-gray-500 font-medium">服务名称</th>
              <th className="text-center py-3 text-gray-500 font-medium">接入方式</th>
              <th className="text-center py-3 text-gray-500 font-medium">状态</th>
              <th className="text-center py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => {
              const st = statusMap[s.status] || statusMap.pending
              return (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="py-3 text-gray-800">{s.name}</td>
                  <td className="py-3 text-center text-gray-500">{accessTypeMap[s.accessType] || s.accessType}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {s.status === 'online' ? (
                        <button className="p-1 text-gray-400 hover:text-alert" title="下线">
                          <WifiOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="p-1 text-gray-400 hover:text-green-500" title="上线">
                          <Wifi className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-1 text-gray-400 hover:text-gov-blue-500" title="配置">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gov-blue-500" title="编辑">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
