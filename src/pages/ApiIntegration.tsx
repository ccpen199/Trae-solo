import { useState } from 'react';
import {
  Key,
  Webhook,
  BookOpen,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Send,
  ChevronRight,
  Lock,
  Unlock,
  Zap,
  Clock,
  Download,
  Code2,
  FileJson,
  Settings,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  scopes: string[];
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsed?: string;
  calls: number;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'paused';
  createdAt: string;
  lastDelivery?: string;
  successRate: number;
}

const mockApiKeys: ApiKey[] = [
  {
    id: 'ak-001',
    name: '生产环境主密钥',
    key: 'demo-key-production-primary',
    secret: 'demo-secret-production-primary',
    scopes: ['orders:read', 'orders:write', 'riders:read', 'waybills:read', 'pricing:read'],
    status: 'active',
    createdAt: '2024-12-15T10:00:00Z',
    lastUsed: '2025-01-07T15:30:00Z',
    calls: 125847,
  },
  {
    id: 'ak-002',
    name: '测试环境密钥',
    key: 'demo-key-test-environment',
    secret: 'demo-secret-test-environment',
    scopes: ['orders:read', 'orders:write'],
    status: 'active',
    createdAt: '2024-12-20T14:00:00Z',
    lastUsed: '2025-01-07T10:15:00Z',
    calls: 3251,
  },
  {
    id: 'ak-003',
    name: '数据分析只读密钥',
    key: 'demo-key-readonly-analytics',
    secret: 'demo-secret-readonly-analytics',
    scopes: ['orders:read', 'riders:read', 'waybills:read'],
    status: 'revoked',
    createdAt: '2024-11-10T09:00:00Z',
    calls: 8923,
  },
];

const webhookEvents = [
  { key: 'order.created', label: '订单创建', desc: '新订单创建时触发' },
  { key: 'order.status_changed', label: '订单状态变更', desc: '订单状态更新时触发' },
  { key: 'order.completed', label: '订单完成', desc: '订单配送完成时触发' },
  { key: 'order.exception', label: '订单异常', desc: '订单发生异常时触发' },
  { key: 'rider.location', label: '骑手位置更新', desc: '骑手位置变化时触发' },
  { key: 'rider.status_changed', label: '骑手状态变更', desc: '骑手上下线时触发' },
  { key: 'compensation.issued', label: '赔付发放', desc: '赔付完成时触发' },
  { key: 'waybill.generated', label: '运单生成', desc: '电子运单生成时触发' },
];

const apiEndpoints = [
  {
    method: 'GET',
    path: '/api/v1/orders',
    summary: '获取订单列表',
    description: '分页查询订单列表，支持按状态、时间范围、关键字等条件筛选',
    params: [
      { name: 'page', type: 'integer', required: false, desc: '页码，默认1' },
      { name: 'pageSize', type: 'integer', required: false, desc: '每页数量，默认20' },
      { name: 'status', type: 'string', required: false, desc: '订单状态筛选' },
      { name: 'keyword', type: 'string', required: false, desc: '订单号/客户名关键字' },
    ],
    response: '{"success":true,"data":{"list":[...],"total":100}}',
  },
  {
    method: 'POST',
    path: '/api/v1/orders',
    summary: '创建订单',
    description: '创建新的配送订单，系统将自动分配骑手并计算运费',
    params: [
      { name: 'pickup_address', type: 'string', required: true, desc: '取货地址' },
      { name: 'delivery_address', type: 'string', required: true, desc: '送货地址' },
      { name: 'goods_type', type: 'string', required: true, desc: '货品类型' },
      { name: 'goods_weight', type: 'number', required: true, desc: '货品重量(kg)' },
    ],
    response: '{"success":true,"data":{"order_id":"ORD...","estimated_price":25.5}}',
  },
  {
    method: 'GET',
    path: '/api/v1/orders/{id}',
    summary: '获取订单详情',
    description: '根据订单ID获取订单的完整信息，包括配送轨迹',
    params: [
      { name: 'id', type: 'string', required: true, desc: '订单ID' },
    ],
    response: '{"success":true,"data":{"id":"...","status":"in_transit",...}}',
  },
  {
    method: 'GET',
    path: '/api/v1/riders',
    summary: '获取骑手列表',
    description: '查询骑手信息列表，包含在线状态、信用分等',
    params: [
      { name: 'status', type: 'string', required: false, desc: '骑手状态: online/offline/busy' },
    ],
    response: '{"success":true,"data":{"list":[...],"total":50}}',
  },
  {
    method: 'POST',
    path: '/api/v1/pricing/calculate',
    summary: '预估运费',
    description: '根据配送参数动态计算预估运费',
    params: [
      { name: 'distance_km', type: 'number', required: true, desc: '配送距离(公里)' },
      { name: 'goods_weight', type: 'number', required: true, desc: '货品重量(kg)' },
      { name: 'weather', type: 'string', required: false, desc: '天气状况' },
    ],
    response: '{"success":true,"data":{"estimated_price":28.5,"breakdown":{...}}}',
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-success-500/20 text-success-400 border-success-500/30',
  POST: 'bg-amber-accent-500/20 text-amber-accent-400 border-amber-accent-500/30',
  PUT: 'bg-info-500/20 text-info-400 border-info-500/30',
  DELETE: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
};

const allScopes = ['orders:read', 'orders:write', 'riders:read', 'riders:write', 'waybills:read', 'pricing:read', 'compensation:read'];

export default function ApiIntegration() {
  const [tab, setTab] = useState<'keys' | 'webhooks' | 'docs'>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['orders:read']);

  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: 'wh-001',
      url: 'https://api.example.com/webhooks/delivery',
      events: ['order.created', 'order.status_changed', 'order.completed'],
      secret: 'demo-webhook-secret-primary',
      status: 'active',
      createdAt: '2024-12-10T08:00:00Z',
      lastDelivery: '2025-01-07T15:28:00Z',
      successRate: 99.2,
    },
    {
      id: 'wh-002',
      url: 'https://internal.corp.com/delivery/updates',
      events: ['rider.location', 'rider.status_changed'],
      secret: 'demo-webhook-secret-rider',
      status: 'active',
      createdAt: '2024-12-25T10:30:00Z',
      lastDelivery: '2025-01-07T15:30:00Z',
      successRate: 97.8,
    },
    {
      id: 'wh-003',
      url: 'https://test.example.com/hook',
      events: ['order.exception'],
      secret: 'demo-webhook-secret-test',
      status: 'paused',
      createdAt: '2025-01-02T16:00:00Z',
      successRate: 65.4,
    },
  ]);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEventsSelected, setWebhookEventsSelected] = useState<string[]>([]);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const revokeKey = (id: string) => {
    setApiKeys((keys) => keys.map((k) => (k.id === id ? { ...k, status: 'revoked' } : k)));
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const newKey: ApiKey = {
      id: `ak-${Date.now()}`,
      name: newKeyName,
      key: `demo-key-${Math.random().toString(36).slice(2, 18)}`,
      secret: `demo-secret-${Math.random().toString(36).slice(2, 18)}`,
      scopes: newKeyScopes,
      status: 'active',
      createdAt: new Date().toISOString(),
      calls: 0,
    };
    setApiKeys([newKey, ...apiKeys]);
    setShowCreateKeyModal(false);
    setNewKeyName('');
    setNewKeyScopes(['orders:read']);
  };

  const openWebhookModal = (wh?: WebhookConfig) => {
    if (wh) {
      setEditingWebhook(wh);
      setWebhookUrl(wh.url);
      setWebhookEventsSelected(wh.events);
    } else {
      setEditingWebhook(null);
      setWebhookUrl('');
      setWebhookEventsSelected([]);
    }
    setShowWebhookModal(true);
  };

  const handleSaveWebhook = () => {
    if (!webhookUrl.trim() || webhookEventsSelected.length === 0) return;
    if (editingWebhook) {
      setWebhooks((list) => list.map((w) => (w.id === editingWebhook.id ? { ...w, url: webhookUrl, events: webhookEventsSelected } : w)));
    } else {
      const newWh: WebhookConfig = {
        id: `wh-${Date.now()}`,
        url: webhookUrl,
        events: webhookEventsSelected,
        secret: `demo-webhook-${Math.random().toString(36).slice(2, 14)}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        successRate: 100,
      };
      setWebhooks([newWh, ...webhooks]);
    }
    setShowWebhookModal(false);
  };

  const toggleWebhookEvent = (e: string) => {
    setWebhookEventsSelected((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  };

  const testWebhook = (id: string) => {
    setTestingWebhook(id);
    setTimeout(() => setTestingWebhook(null), 2000);
  };

  const toggleWebhookStatus = (id: string) => {
    setWebhooks((list) => list.map((w) => (w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w)));
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-amber-accent-500" />
            API 集成中心
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理API密钥、Webhook配置和接口文档</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-space-blue-800 border border-space-blue-600 rounded-lg text-sm text-gray-300 hover:bg-space-blue-700 transition-colors">
            <BookOpen className="w-4 h-4" />
            完整文档
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-space-blue-800 border border-space-blue-600 rounded-lg text-sm text-gray-300 hover:bg-space-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            SDK下载
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="API调用量（今日）" value="28,547" icon={<Zap className="w-5 h-5" />} status="success" trend={{ value: 12, direction: 'up', label: '较昨日' }} />
        <StatCard title="活跃密钥" value={apiKeys.filter((k) => k.status === 'active').length} icon={<Key className="w-5 h-5" />} status="info" />
        <StatCard title="活跃Webhook" value={webhooks.filter((w) => w.status === 'active').length} icon={<Webhook className="w-5 h-5" />} status="warning" />
        <StatCard title="平均响应时间" value="86ms" icon={<Clock className="w-5 h-5" />} status="success" trend={{ value: 5, direction: 'down', label: '较昨日' }} />
      </div>

      <div className="flex items-center gap-2 border-b border-space-blue-600">
        {[
          { key: 'keys', label: 'API密钥', icon: Key, count: apiKeys.length },
          { key: 'webhooks', label: 'Webhook配置', icon: Webhook, count: webhooks.length },
          { key: 'docs', label: '接口文档', icon: BookOpen, count: apiEndpoints.length },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.key
                  ? 'border-amber-accent-500 text-amber-accent-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded text-xs',
                tab === t.key ? 'bg-amber-accent-500/20 text-amber-accent-400' : 'bg-space-blue-700 text-gray-500'
              )}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'keys' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">管理您的API密钥，用于身份验证和接口访问授权</p>
            <button
              onClick={() => setShowCreateKeyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              生成新密钥
            </button>
          </div>

          <div className="space-y-3">
            {apiKeys.map((k) => (
              <div
                key={k.id}
                className={cn(
                  'bg-space-blue-800 border rounded-xl p-5 transition-all',
                  k.status === 'active' ? 'border-space-blue-600 hover:border-amber-accent-500/30' : 'border-space-blue-700 opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        k.status === 'active' ? 'bg-amber-accent-500/20 text-amber-accent-500' : 'bg-space-blue-700 text-gray-500'
                      )}>
                        {k.status === 'active' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-100">{k.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {k.status === 'active' ? (
                            <StatusBadge variant="success">已激活</StatusBadge>
                          ) : (
                            <StatusBadge variant="danger">已撤销</StatusBadge>
                          )}
                          <span className="text-xs text-gray-500">创建于 {new Date(k.createdAt).toLocaleDateString('zh-CN')}</span>
                          {k.lastUsed && (
                            <span className="text-xs text-gray-500">
                              · 最近使用 {new Date(k.lastUsed).toLocaleString('zh-CN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 ml-13">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16 flex-shrink-0">API Key:</span>
                        <code className="flex-1 text-xs font-mono bg-space-blue-900/80 px-3 py-1.5 rounded text-gray-300">
                          {visibleKeys.has(k.id) ? k.key : `${k.key.slice(0, 10)}...${k.key.slice(-4)}`}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(k.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-space-blue-700 rounded transition-colors"
                        >
                          {visibleKeys.has(k.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(k.key, `${k.id}-key`)}
                          className="p-1.5 text-gray-500 hover:text-amber-accent-400 hover:bg-space-blue-700 rounded transition-colors"
                        >
                          {copiedKey === `${k.id}-key` ? <CheckCircle2 className="w-4 h-4 text-success-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16 flex-shrink-0">Secret:</span>
                        <code className="flex-1 text-xs font-mono bg-space-blue-900/80 px-3 py-1.5 rounded text-gray-300">
                          {visibleKeys.has(k.id) ? k.secret : `${'*'.repeat(24)}...${k.secret.slice(-4)}`}
                        </code>
                        <button
                          onClick={() => copyToClipboard(k.secret, `${k.id}-secret`)}
                          className="p-1.5 text-gray-500 hover:text-amber-accent-400 hover:bg-space-blue-700 rounded transition-colors"
                        >
                          {copiedKey === `${k.id}-secret` ? <CheckCircle2 className="w-4 h-4 text-success-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3 ml-13">
                      {k.scopes.map((s) => (
                        <span key={s} className="inline-flex items-center px-2 py-0.5 rounded bg-space-blue-700 text-gray-400 text-xs font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-100">{k.calls.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">累计调用</p>
                    </div>
                    {k.status === 'active' ? (
                      <button
                        onClick={() => revokeKey(k.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-danger-500/10 text-danger-400 rounded-lg hover:bg-danger-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        撤销密钥
                      </button>
                    ) : (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-space-blue-700 text-gray-500 rounded-lg cursor-not-allowed">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        已撤销
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">配置事件回调地址，实时接收订单、骑手等状态变更通知</p>
            <button
              onClick={() => openWebhookModal()}
              className="flex items-center gap-2 px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建Webhook
            </button>
          </div>

          <div className="space-y-3">
            {webhooks.map((w) => (
              <div
                key={w.id}
                className={cn(
                  'bg-space-blue-800 border rounded-xl p-5 transition-all',
                  w.status === 'active' ? 'border-space-blue-600 hover:border-amber-accent-500/30' : 'border-space-blue-700'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        w.status === 'active' ? 'bg-success-500/20 text-success-400' : 'bg-space-blue-700 text-gray-500'
                      )}>
                        <Webhook className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <code className="text-sm font-mono text-gray-200 break-all">{w.url}</code>
                        <div className="flex items-center gap-2 mt-1">
                          {w.status === 'active' ? (
                            <StatusBadge variant="success">运行中</StatusBadge>
                          ) : (
                            <StatusBadge variant="warning">已暂停</StatusBadge>
                          )}
                          <span className="text-xs text-gray-500">创建于 {new Date(w.createdAt).toLocaleDateString('zh-CN')}</span>
                          {w.lastDelivery && (
                            <span className="text-xs text-gray-500">
                              · 最近推送 {new Date(w.lastDelivery).toLocaleString('zh-CN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 ml-13">
                      {w.events.map((e) => (
                        <span key={e} className="inline-flex items-center px-2 py-0.5 rounded bg-info-500/10 text-info-400 text-xs font-mono">
                          {e}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 ml-13 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">签名密钥:</span>
                        <code className="text-xs font-mono text-gray-400 bg-space-blue-900/50 px-2 py-0.5 rounded">
                          {w.secret.slice(0, 10)}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(w.secret, w.id)}
                          className="p-1 text-gray-500 hover:text-amber-accent-400 transition-colors"
                        >
                          {copiedKey === w.id ? <CheckCircle2 className="w-3.5 h-3.5 text-success-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">成功率:</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 h-1.5 bg-space-blue-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                w.successRate >= 95 ? 'bg-success-500' : w.successRate >= 70 ? 'bg-warning-500' : 'bg-danger-500'
                              )}
                              style={{ width: `${w.successRate}%` }}
                            />
                          </div>
                          <span className={cn(
                            'text-xs font-medium',
                            w.successRate >= 95 ? 'text-success-400' : w.successRate >= 70 ? 'text-warning-400' : 'text-danger-400'
                          )}>
                            {w.successRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => testWebhook(w.id)}
                      disabled={testingWebhook === w.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-space-blue-700 text-gray-300 rounded-lg hover:bg-space-blue-600 transition-colors disabled:opacity-50"
                    >
                      {testingWebhook === w.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {testingWebhook === w.id ? '测试中...' : '测试推送'}
                    </button>
                    <button
                      onClick={() => openWebhookModal(w)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-space-blue-700 text-gray-300 rounded-lg hover:bg-space-blue-600 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      编辑
                    </button>
                    <button
                      onClick={() => toggleWebhookStatus(w.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors',
                        w.status === 'active'
                          ? 'bg-warning-500/10 text-warning-400 hover:bg-warning-500/20'
                          : 'bg-success-500/10 text-success-400 hover:bg-success-500/20'
                      )}
                    >
                      {w.status === 'active' ? '暂停' : '启用'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'docs' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-space-blue-800 to-space-blue-700 border border-space-blue-600 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-accent-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-space-blue-900" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-100">OpenAPI 3.0 规范</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  所有接口遵循 RESTful 设计规范，支持 JSON 格式请求和响应。数据传输采用 HTTPS 加密。
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <a href="#" className="text-xs text-amber-accent-400 hover:text-amber-accent-300 flex items-center gap-1">
                    <FileJson className="w-3.5 h-3.5" />
                    下载 OpenAPI JSON
                  </a>
                  <a href="#" className="text-xs text-amber-accent-400 hover:text-amber-accent-300 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5" />
                    在线调试
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl overflow-hidden">
            {apiEndpoints.map((ep, idx) => (
              <div key={ep.path} className={cn(idx !== 0 && 'border-t border-space-blue-700')}>
                <button
                  onClick={() => setExpandedEndpoint(expandedEndpoint === ep.path ? null : ep.path)}
                  className="w-full p-5 flex items-center gap-4 hover:bg-space-blue-700/50 transition-colors text-left"
                >
                  <span className={cn(
                    'px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wide',
                    methodColors[ep.method]
                  )}>
                    {ep.method}
                  </span>
                  <code className="flex-1 font-mono text-sm text-gray-200">{ep.path}</code>
                  <span className="text-sm text-gray-400 max-w-sm truncate">{ep.summary}</span>
                  <ChevronRight className={cn(
                    'w-5 h-5 text-gray-500 transition-transform flex-shrink-0',
                    expandedEndpoint === ep.path && 'rotate-90'
                  )} />
                </button>
                {expandedEndpoint === ep.path && (
                  <div className="px-5 pb-5 border-t border-space-blue-700 pt-4 space-y-4">
                    <p className="text-sm text-gray-400">{ep.description}</p>

                    <div>
                      <h5 className="text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">请求参数</h5>
                      <div className="bg-space-blue-900/50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-space-blue-700">
                              <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">参数名</th>
                              <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">类型</th>
                              <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">必填</th>
                              <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">说明</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ep.params.map((p) => (
                              <tr key={p.name} className="border-b border-space-blue-700/50 last:border-0">
                                <td className="px-4 py-2">
                                  <code className="text-xs font-mono text-info-400">{p.name}</code>
                                </td>
                                <td className="px-4 py-2">
                                  <span className="text-xs text-warning-400">{p.type}</span>
                                </td>
                                <td className="px-4 py-2">
                                  {p.required ? (
                                    <span className="text-xs text-danger-400">是</span>
                                  ) : (
                                    <span className="text-xs text-gray-500">否</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-xs text-gray-400">{p.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">响应示例</h5>
                      <pre className="bg-space-blue-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-success-300">
{ep.response}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={showCreateKeyModal}
        onClose={() => setShowCreateKeyModal(false)}
        title="生成新API密钥"
        width="md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreateKeyModal(false)} className="px-4 py-2 bg-space-blue-700 text-gray-300 rounded-lg hover:bg-space-blue-600 transition-colors text-sm">
              取消
            </button>
            <button
              onClick={handleCreateKey}
              disabled={!newKeyName.trim()}
              className="px-4 py-2 bg-amber-accent-500 text-space-blue-900 rounded-lg hover:bg-amber-accent-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              生成密钥
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="bg-warning-500/10 border border-warning-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-300">安全提示</p>
              <p className="text-xs text-warning-400/80 mt-0.5">密钥生成后仅显示一次，请妥善保存。Secret丢失后无法找回，只能重新生成。</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">密钥名称</label>
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              type="text"
              placeholder="如：生产环境主密钥、数据分析系统等"
              className="w-full px-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-gray-100 focus:outline-none focus:border-amber-accent-500/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">访问权限 (Scopes)</label>
            <div className="grid grid-cols-2 gap-2">
              {allScopes.map((scope) => (
                <label key={scope} className="flex items-center gap-2 p-2.5 bg-space-blue-900/50 border border-space-blue-700 rounded-lg cursor-pointer hover:border-space-blue-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={newKeyScopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                    className="w-4 h-4 rounded border-space-blue-600 bg-space-blue-900 text-amber-accent-500 focus:ring-amber-accent-500/50"
                  />
                  <code className="text-xs font-mono text-gray-300">{scope}</code>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
        title={editingWebhook ? '编辑Webhook' : '新建Webhook'}
        width="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowWebhookModal(false)} className="px-4 py-2 bg-space-blue-700 text-gray-300 rounded-lg hover:bg-space-blue-600 transition-colors text-sm">
              取消
            </button>
            <button
              onClick={handleSaveWebhook}
              disabled={!webhookUrl.trim() || webhookEventsSelected.length === 0}
              className="px-4 py-2 bg-amber-accent-500 text-space-blue-900 rounded-lg hover:bg-amber-accent-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">回调地址 (URL)</label>
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              type="url"
              placeholder="https://your-server.com/webhooks/delivery"
              className="w-full px-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-gray-100 focus:outline-none focus:border-amber-accent-500/50 text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">必须是HTTPS地址，支持POST请求</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">订阅事件</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {webhookEvents.map((e) => (
                <label
                  key={e.key}
                  className={cn(
                    'flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition-all',
                    webhookEventsSelected.includes(e.key)
                      ? 'bg-amber-accent-500/10 border-amber-accent-500/30'
                      : 'bg-space-blue-900/50 border-space-blue-700 hover:border-space-blue-600'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={webhookEventsSelected.includes(e.key)}
                    onChange={() => toggleWebhookEvent(e.key)}
                    className="w-4 h-4 mt-0.5 rounded border-space-blue-600 bg-space-blue-900 text-amber-accent-500 focus:ring-amber-accent-500/50"
                  />
                  <div>
                    <code className="text-xs font-mono text-gray-200">{e.key}</code>
                    <p className="text-xs text-gray-500 mt-0.5">{e.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {editingWebhook && (
            <div className="bg-space-blue-900/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">签名密钥 (Signing Secret)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-gray-300">{editingWebhook.secret}</code>
                <button
                  onClick={() => copyToClipboard(editingWebhook.secret, 'wh-secret')}
                  className="p-1.5 text-gray-500 hover:text-amber-accent-400 transition-colors"
                >
                  {copiedKey === 'wh-secret' ? <CheckCircle2 className="w-4 h-4 text-success-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">用于验证请求签名，确保回调来自本平台</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
