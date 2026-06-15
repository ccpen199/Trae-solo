import { useState, useEffect } from 'react';
import {
  Workflow,
  Play,
  Pause,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Save,
  Zap,
  Database,
  Globe,
  FileJson,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Layers,
  GitBranch,
} from 'lucide-react';
import { api } from '@/api/client';
import type { AtomicService, OrchestrationFlow } from '../../shared/types';
import { cn } from '@/lib/utils';

export default function Orchestration() {
  const [atomicServices, setAtomicServices] = useState<AtomicService[]>([]);
  const [flows, setFlows] = useState<OrchestrationFlow[]>([]);
  const [selectedService, setSelectedService] = useState<AtomicService | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<OrchestrationFlow | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'flows' | 'designer'>('services');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [services, flowData] = await Promise.all([
        api.government.getAtomicServices(),
        api.government.getFlows(),
      ]);
      setAtomicServices(Array.isArray(services) ? services : []);
      setFlows(Array.isArray(flowData) ? flowData : []);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteFlow = async (flowId: string) => {
    setExecuting(flowId);
    try {
      await api.government.executeFlow(flowId, {});
    } catch (e) {
      console.error('Execution failed:', e);
    } finally {
      setTimeout(() => setExecuting(null), 2000);
    }
  };

  const handleToggleFlow = async (flow: OrchestrationFlow) => {
    try {
      setFlows(prev => prev.map(f =>
        f.id === flow.id ? { ...f, isEnabled: !f.isEnabled } : f
      ));
    } catch (e) {
      console.error('Toggle failed:', e);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transportation':
        return { bg: 'bg-warm-500/20', text: 'text-warm-400', border: 'border-warm-500/30' };
      case 'medical':
        return { bg: 'bg-eco-500/20', text: 'text-eco-400', border: 'border-eco-500/30' };
      case 'education':
        return { bg: 'bg-primary-500/20', text: 'text-primary-400', border: 'border-primary-500/30' };
      case 'government':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' };
      case 'urban_management':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-eco-500/20 text-eco-400';
      case 'POST': return 'bg-primary-500/20 text-primary-400';
      case 'PUT': return 'bg-warm-500/20 text-warm-400';
      case 'DELETE': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getCategoryName = (category: string) => {
    const map: Record<string, string> = {
      transportation: '交通出行',
      medical: '医疗健康',
      education: '教育服务',
      government: '政务服务',
      urban_management: '城市管理',
    };
    return map[category] || category;
  };

  const servicesByCategory = atomicServices.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, AtomicService[]>);

  const designNodes = [
    { id: 'start', label: '开始', type: 'start', x: 300, y: 40 },
    { id: '1', label: '用户身份认证', service: '用户身份验证服务', x: 300, y: 120 },
    { id: '2', label: '查询违章记录', service: '违章查询服务', x: 300, y: 200 },
    { id: '3', label: '计算罚款金额', service: '费用计算服务', x: 300, y: 280 },
    { id: '4', label: '生成支付订单', service: '支付订单服务', x: 300, y: 360 },
    { id: '5', label: '发送通知', service: '消息推送服务', x: 300, y: 440 },
    { id: 'end', label: '结束', type: 'end', x: 300, y: 520 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">城市服务编排中心</h1>
          <p className="text-gray-500 mt-1">原子能力管理、服务流程编排、运行监控</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'services', label: '原子服务', icon: Layers },
              { key: 'flows', label: '编排流程', icon: GitBranch },
              { key: 'designer', label: '流程设计器', icon: Workflow },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-eco-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-glow transition-all">
            <Plus className="w-4 h-4" />
            新建流程
          </button>
        </div>
      </div>

      {activeTab === 'services' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(servicesByCategory).map(([category, services]) => {
              const colors = getCategoryColor(category);
              return (
                <div key={category} className="bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className={cn('p-4 border-b', colors.border, colors.bg)}>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Database className={cn('w-5 h-5', colors.text)} />
                      {getCategoryName(category)}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({services.length} 个原子服务)
                      </span>
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={cn(
                          'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                          selectedService?.id === service.id && 'bg-primary-50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-800">{service.name}</h4>
                              <span className={cn('px-2 py-0.5 text-xs font-mono font-medium rounded-full', getMethodColor(service.method))}>
                                {service.method}
                              </span>
                              <span className={cn('w-2 h-2 rounded-full', service.isActive ? 'bg-eco-500' : 'bg-gray-300')}></span>
                            </div>
                            <p className="text-sm text-gray-500">{service.description}</p>
                            <code className="block text-xs text-gray-400 mt-2 font-mono bg-gray-50 px-2 py-1 rounded">
                              {service.endpoint}
                            </code>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            {selectedService ? (
              <div className="bg-white rounded-2xl shadow-card p-6 sticky top-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedService.name}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">{selectedService.serviceCode}</p>
                  </div>
                  <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', selectedService.isActive ? 'bg-eco-100 text-eco-600' : 'bg-gray-100 text-gray-500')}>
                    {selectedService.isActive ? '已启用' : '已停用'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">接口地址</p>
                    <code className="text-sm font-mono text-gray-800">{selectedService.endpoint}</code>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">请求参数</p>
                    {selectedService.requestSchema && Object.keys(selectedService.requestSchema).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(selectedService.requestSchema).map(([key, type]) => (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="font-mono text-gray-700">{key}</span>
                            <span className="text-gray-500">{String(type)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">无参数</p>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">返回类型</p>
                    <code className="text-sm font-mono text-gray-700">{selectedService.responseSchema ? 'JSON' : 'JSON'}</code>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>创建时间</span>
                    <span>{selectedService.createdAt}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    编辑
                  </button>
                  <button className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    测试
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">点击左侧查看服务详情</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-card">
                <p className="text-2xl font-bold text-primary-600">{atomicServices.length}</p>
                <p className="text-sm text-gray-500 mt-1">原子服务</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-card">
                <p className="text-2xl font-bold text-eco-600">{atomicServices.filter(s => s.isActive).length}</p>
                <p className="text-sm text-gray-500 mt-1">已启用</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-card">
                <p className="text-2xl font-bold text-warm-600">{flows.length}</p>
                <p className="text-sm text-gray-500 mt-1">编排流程</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-card">
                <p className="text-2xl font-bold text-purple-600">5</p>
                <p className="text-sm text-gray-500 mt-1">业务领域</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'flows' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {flows.map((flow, index) => (
              <div
                key={flow.id}
                className="bg-white rounded-2xl shadow-card p-6 hover:shadow-card-hover transition-all"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-eco-500 flex items-center justify-center text-white">
                        <Workflow className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{flow.name}</h3>
                        <p className="text-sm text-gray-500">{flow.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        执行 1,234 次
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-eco-500" />
                        成功率 98.5%
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        平均耗时 2.3s
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => handleToggleFlow(flow)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        flow.isEnabled ? 'bg-primary-500' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          flow.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExecuteFlow(flow.id)}
                        disabled={executing === flow.id}
                        className="p-2 rounded-lg bg-eco-50 text-eco-600 hover:bg-eco-100 transition-colors disabled:opacity-50"
                      >
                        {executing === flow.id ? (
                          <div className="w-4 h-4 border-2 border-eco-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 h-fit sticky top-6">
            <h3 className="font-semibold text-gray-800 mb-4">执行日志</h3>
            <div className="space-y-3">
              {[
                { status: 'success', flow: '违章处理流程', time: '2分钟前', duration: '1.8s' },
                { status: 'success', flow: '入学报名流程', time: '15分钟前', duration: '3.2s' },
                { status: 'success', flow: '预约挂号流程', time: '32分钟前', duration: '2.1s' },
                { status: 'failed', flow: '支付回调流程', time: '1小时前', duration: '5.0s' },
                { status: 'success', flow: '证照验证流程', time: '1小时前', duration: '0.9s' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  {log.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-eco-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{log.flow}</p>
                    <p className="text-xs text-gray-500">{log.time} · {log.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'designer' && (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="text"
                defaultValue="违章处理自动化流程"
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
              />
              <span className="px-2.5 py-1 bg-eco-100 text-eco-600 text-xs font-medium rounded-full">已启用</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                配置
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2">
                <Save className="w-4 h-4" />
                保存
              </button>
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium flex items-center gap-2">
                <Play className="w-4 h-4" />
                运行
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 min-h-[600px]">
            <div className="border-r border-gray-100 p-4 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-4">原子服务组件</h4>
              <div className="space-y-2">
                {atomicServices.slice(0, 8).map(service => {
                  const colors = getCategoryColor(service.category);
                  return (
                    <div
                      key={service.id}
                      className="p-3 bg-white rounded-xl border border-gray-200 cursor-move hover:border-primary-300 hover:shadow-md transition-all"
                      draggable
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
                          <Zap className={cn('w-4 h-4', colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{service.name}</p>
                          <p className="text-xs text-gray-500">{getCategoryName(service.category)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-span-3 p-6 relative bg-gradient-to-br from-gray-50 to-white overflow-auto">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>

              <div className="relative" style={{ height: '580px' }}>
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {designNodes.slice(0, -1).map((node, i) => (
                    <line
                      key={i}
                      x1={node.x + 60}
                      y1={node.y + 40}
                      x2={designNodes[i + 1].x + 60}
                      y2={designNodes[i + 1].y}
                      stroke="#0066CC"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                  ))}
                </svg>

                {designNodes.map((node) => (
                  <div
                    key={node.id}
                    className={cn(
                      'absolute w-[120px] p-3 rounded-xl text-center shadow-lg cursor-move transition-all hover:shadow-xl hover:scale-105',
                      node.type === 'start'
                        ? 'bg-gradient-to-r from-eco-400 to-eco-500 text-white'
                        : node.type === 'end'
                        ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white'
                        : 'bg-white border-2 border-primary-200'
                    )}
                    style={{ left: node.x, top: node.y }}
                  >
                    <p className={cn('text-sm font-medium', node.type ? 'text-white' : 'text-gray-800')}>
                      {node.label}
                    </p>
                    {node.service && (
                      <p className="text-xs text-gray-500 mt-1">{node.service}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
