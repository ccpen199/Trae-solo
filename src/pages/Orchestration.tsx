import { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Layers,
  GitBranch,
  History,
  RotateCcw,
  GitCompare,
  BarChart3,
  ArrowRightLeft,
  X,
  Loader2,
  User,
  Tag,
  FileText,
  RefreshCw,
  Check,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { api } from '@/api/client';
import type { AtomicService, OrchestrationFlow, FlowReleaseRecord, ServiceCallRecord, ServiceDependency, FlowNodeProperty, ServiceStats } from '../../shared/types';
import { cn } from '@/lib/utils';

export default function Orchestration() {
  const [atomicServices, setAtomicServices] = useState<AtomicService[]>([]);
  const [flows, setFlows] = useState<OrchestrationFlow[]>([]);
  const [selectedService, setSelectedService] = useState<AtomicService | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<OrchestrationFlow | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'flows' | 'designer'>('services');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  const [releaseRecords, setReleaseRecords] = useState<FlowReleaseRecord[]>([]);
  const [showReleaseSidebar, setShowReleaseSidebar] = useState(false);
  const [releaseRecordsLoading, setReleaseRecordsLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState<string | null>(null);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);
  const [compareDiff, setCompareDiff] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  const [serviceStats, setServiceStats] = useState<Record<string, ServiceStats>>({});
  const [serviceCalls, setServiceCalls] = useState<Record<string, ServiceCallRecord[]>>({});
  const [serviceDependencies, setServiceDependencies] = useState<Record<string, ServiceDependency[]>>({});
  const [serviceDetailLoading, setServiceDetailLoading] = useState(false);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeProperties, setNodeProperties] = useState<FlowNodeProperty[]>([]);
  const [nodePropertiesLoading, setNodePropertiesLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishChangeLog, setPublishChangeLog] = useState('');

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

  const loadReleaseRecords = useCallback(async (flowId: string) => {
    setReleaseRecordsLoading(true);
    try {
      const records = await api.government.getFlowReleaseRecords(flowId);
      setReleaseRecords(Array.isArray(records) ? records : []);
      setShowReleaseSidebar(true);
    } catch (e) {
      console.error('Failed to load release records:', e);
    } finally {
      setReleaseRecordsLoading(false);
    }
  }, []);

  const handleRollback = async (flowId: string, version: string) => {
    if (!confirm(`确定要回滚到版本 ${version} 吗？`)) return;
    setRollbackLoading(version);
    try {
      await api.government.rollbackFlow(flowId, version);
      await loadReleaseRecords(flowId);
    } catch (e) {
      console.error('Rollback failed:', e);
    } finally {
      setRollbackLoading(null);
    }
  };

  const handleCompare = async (flowId: string, v1: string, v2: string) => {
    setCompareLoading(true);
    try {
      const result = await api.government.compareFlowVersions(flowId, v1, v2);
      setCompareDiff(result.diff || []);
      setCompareVersions([v1, v2]);
      setShowCompareModal(true);
    } catch (e) {
      console.error('Compare failed:', e);
    } finally {
      setCompareLoading(false);
    }
  };

  const loadServiceDetail = useCallback(async (service: AtomicService) => {
    setServiceDetailLoading(true);
    setSelectedService(service);
    try {
      const [stats, calls, dependencies] = await Promise.all([
        api.government.getServiceStats(service.id),
        api.government.getServiceCallRecords(service.id),
        api.government.getServiceDependencies(service.id),
      ]);
      setServiceStats(prev => ({ ...prev, [service.id]: stats }));
      setServiceCalls(prev => ({ ...prev, [service.id]: Array.isArray(calls) ? calls : [] }));
      setServiceDependencies(prev => ({ ...prev, [service.id]: Array.isArray(dependencies) ? dependencies : [] }));
    } catch (e) {
      console.error('Failed to load service detail:', e);
    } finally {
      setServiceDetailLoading(false);
    }
  }, []);

  const loadNodeProperties = useCallback(async (nodeId: string, serviceId?: string) => {
    setNodePropertiesLoading(true);
    setSelectedNode(nodeId);
    try {
      const properties = await api.government.getNodeProperties(nodeId, serviceId);
      setNodeProperties(Array.isArray(properties) ? properties : []);
    } catch (e) {
      console.error('Failed to load node properties:', e);
    } finally {
      setNodePropertiesLoading(false);
    }
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handlePublish = async () => {
    if (!publishChangeLog.trim()) {
      alert('请填写变更说明');
      return;
    }
    setPublishStatus('publishing');
    try {
      const flowId = flows[0]?.id;
      if (flowId) {
        await api.government.publishFlow(flowId, { changeLog: publishChangeLog });
      }
      setPublishStatus('published');
      setShowPublishModal(false);
      setPublishChangeLog('');
      setTimeout(() => setPublishStatus('idle'), 3000);
    } catch (e) {
      setPublishStatus('error');
      setTimeout(() => setPublishStatus('idle'), 3000);
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

  const getReleaseStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-eco-100 text-eco-600';
      case 'rollback': return 'bg-warm-100 text-warm-600';
      case 'processing': return 'bg-blue-100 text-blue-600';
      case 'failed': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getReleaseStatusText = (status: string) => {
    const map: Record<string, string> = {
      success: '发布成功',
      rollback: '已回滚',
      processing: '发布中',
      failed: '发布失败',
    };
    return map[status] || status;
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    return time;
  };

  const servicesByCategory = atomicServices.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, AtomicService[]>);

  const designNodes = [
    { id: 'start', label: '开始', type: 'start', x: 300, y: 40 },
    { id: '1', label: '用户身份认证', service: '用户身份验证服务', x: 300, y: 120, serviceId: atomicServices[0]?.id },
    { id: '2', label: '查询违章记录', service: '违章查询服务', x: 300, y: 200 },
    { id: '3', label: '计算罚款金额', service: '费用计算服务', x: 300, y: 280 },
    { id: '4', label: '生成支付订单', service: '支付订单服务', x: 300, y: 360 },
    { id: '5', label: '发送通知', service: '消息推送服务', x: 300, y: 440 },
    { id: 'end', label: '结束', type: 'end', x: 300, y: 520 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
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
                        onClick={() => loadServiceDetail(service)}
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
                            <div className="flex items-center gap-4 mt-2">
                              {serviceStats[service.id] && (
                                <>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {serviceStats[service.id].callCount.toLocaleString()} 次调用
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {serviceStats[service.id].avgDuration}s 平均耗时
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-eco-500" />
                                    {serviceStats[service.id].successRate}% 成功率
                                  </span>
                                </>
                              )}
                            </div>
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
                {serviceDetailLoading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl z-10">
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedService.name}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">{selectedService.serviceCode}</p>
                  </div>
                  <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', selectedService.isActive ? 'bg-eco-100 text-eco-600' : 'bg-gray-100 text-gray-500')}>
                    {selectedService.isActive ? '已启用' : '已停用'}
                  </span>
                </div>

                {serviceStats[selectedService.id] && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <p className="text-lg font-bold text-primary-600">{serviceStats[selectedService.id].callCount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">调用次数</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <p className="text-lg font-bold text-warm-600">{serviceStats[selectedService.id].avgDuration}s</p>
                      <p className="text-xs text-gray-500">平均耗时</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <p className="text-lg font-bold text-eco-600">{serviceStats[selectedService.id].successRate}%</p>
                      <p className="text-xs text-gray-500">成功率</p>
                    </div>
                  </div>
                )}

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

                  {serviceDependencies[selectedService.id] && serviceDependencies[selectedService.id].length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-3">服务依赖关系</p>
                      <div className="space-y-2">
                        {serviceDependencies[selectedService.id].map((dep, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-600 rounded text-xs">{dep.source}</span>
                            <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                            <span className="px-2 py-0.5 bg-eco-100 text-eco-600 rounded text-xs">{dep.target}</span>
                            <span className="text-xs text-gray-500 ml-auto">{dep.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                        <svg width="100%" height="100" className="overflow-visible">
                          {serviceDependencies[selectedService.id].map((dep, idx) => {
                            const y1 = 20 + idx * 25;
                            return (
                              <g key={idx}>
                                <circle cx="30" cy={y1} r="8" fill="#0066CC" />
                                <text x="45" y={y1 + 4} fontSize="10" fill="#374151">{dep.source}</text>
                                <line x1="120" y1={y1} x2="180" y2={y1} stroke="#9CA3AF" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                                <circle cx="200" cy={y1} r="8" fill="#22AA66" />
                                <text x="215" y={y1 + 4} fontSize="10" fill="#374151">{dep.target}</text>
                              </g>
                            );
                          })}
                          <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                              <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
                            </marker>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  )}

                  {serviceCalls[selectedService.id] && serviceCalls[selectedService.id].length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-3">最近调用记录</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {serviceCalls[selectedService.id].slice(0, 5).map((call) => (
                        <div key={call.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                          {call.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-eco-500 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800">{call.caller}</p>
                            <p className="text-xs text-gray-500">{new Date(call.callTime).toLocaleString()} · {call.duration}s</p>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}

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
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{flow.name}</h3>
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-medium rounded-full flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {flow.currentVersion || 'v1.0.0'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{flow.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      执行 {flow.stats?.executionCount?.toLocaleString() || '1,234'} 次
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-eco-500" />
                      成功率 {flow.stats?.successRate || '98.5'}%
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      平均耗时 {flow.stats?.avgDuration || '2.3'}s
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      发布人：{flow.lastPublisher || '-'}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      最后发布：{flow.lastReleaseTime || '-'}
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
                    <button
                      onClick={() => {
                        setSelectedFlow(flow);
                        loadReleaseRecords(flow.id);
                      }}
                      className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors flex items-center gap-1"
                      title="发布记录"
                    >
                      <History className="w-4 h-4" />
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
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={cn(
                  'px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                  saveStatus === 'saved'
                    ? 'border-eco-200 bg-eco-50 text-eco-600'
                    : saveStatus === 'error'
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <Check className="w-4 h-4" />
                ) : saveStatus === 'error' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : saveStatus === 'error' ? '保存失败' : '保存'}
              </button>
              <button
                onClick={() => setShowPublishModal(true)}
                disabled={publishStatus === 'publishing'}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                  publishStatus === 'published'
                    ? 'bg-eco-500 text-white'
                    : publishStatus === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                )}
              >
                {publishStatus === 'publishing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : publishStatus === 'published' ? (
                  <Check className="w-4 h-4" />
                ) : publishStatus === 'error' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {publishStatus === 'publishing' ? '发布中...' : publishStatus === 'published' ? '已发布' : publishStatus === 'error' ? '发布失败' : '发布'}
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

            <div className="col-span-2 p-6 relative bg-gradient-to-br from-gray-50 to-white overflow-auto">
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
                    onClick={() => loadNodeProperties(node.id, node.serviceId)}
                    className={cn(
                      'absolute w-[120px] p-3 rounded-xl text-center shadow-lg cursor-move transition-all hover:shadow-xl hover:scale-105',
                      node.type === 'start'
                        ? 'bg-gradient-to-r from-eco-400 to-eco-500 text-white'
                        : node.type === 'end'
                        ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white'
                        : selectedNode === node.id
                        ? 'bg-white border-2 border-primary-500 ring-2 ring-primary-200'
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

            <div className="border-l border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800">属性配置</h4>
                {selectedNode && (
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>

              {nodePropertiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                </div>
              ) : selectedNode ? (
                <div className="space-y-4">
                  {nodeProperties.map((prop) => (
                    <div key={prop.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {prop.name}
                        {prop.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {prop.type === 'string' && (
                        <input
                          type="text"
                          defaultValue={prop.value}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                        />
                      )}
                      {prop.type === 'number' && (
                        <input
                          type="number"
                          defaultValue={prop.value}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                        />
                      )}
                      {prop.type === 'boolean' && (
                        <div className="flex items-center gap-2">
                          <button
                            className={cn(
                              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                              prop.value ? 'bg-primary-500' : 'bg-gray-200'
                            )}
                          >
                            <span
                              className={cn(
                                'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                                prop.value ? 'translate-x-5' : 'translate-x-0.5'
                              )}
                            />
                          </button>
                          <span className="text-sm text-gray-600">
                            {prop.value ? '已启用' : '已禁用'}
                          </span>
                        </div>
                      )}
                      {prop.type === 'select' && (
                        <select
                          defaultValue={prop.value}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm bg-white"
                        >
                          {prop.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {prop.type === 'textarea' && (
                        <textarea
                          defaultValue={prop.value}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm resize-none"
                        />
                      )}
                      {prop.description && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          {prop.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">选择节点以配置属性</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReleaseSidebar && selectedFlow && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowReleaseSidebar(false)} />
          <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">发布记录</h3>
                <p className="text-sm text-gray-500">{selectedFlow.name}</p>
              </div>
              <button
                onClick={() => setShowReleaseSidebar(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              {releaseRecordsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : (
                  <div className="space-y-4">
                    {releaseRecords.map((record, index) => (
                      <div
                        key={record.id}
                        className={cn(
                          'p-4 rounded-xl border transition-all',
                          index === 0 ? 'border-primary-200 bg-primary-50' : 'border-gray-100 hover:border-gray-200'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-medium rounded-full font-mono">
                              {record.version}
                            </span>
                            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', getReleaseStatusColor(record.status))}>
                              {getReleaseStatusText(record.status)}
                            </span>
                          </div>
                          {index > 0 && (
                            <button
                              onClick={() => handleCompare(selectedFlow.id, record.version, releaseRecords[0].version)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                              title="版本对比"
                            >
                              <GitCompare className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 mb-3">{record.changeLog}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {record.publisher}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {record.releaseTime}
                          </span>
                        </div>

                        {index > 0 && record.status !== 'rollback' && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleRollback(selectedFlow.id, record.version)}
                              disabled={rollbackLoading === record.version}
                              className="w-full py-2 border border-warm-200 text-warm-600 rounded-lg text-sm font-medium hover:bg-warm-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {rollbackLoading === record.version ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                              {rollbackLoading === record.version ? '回滚中...' : '回滚到此版本'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowCompareModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">版本对比</h3>
                <p className="text-sm text-gray-500">
                  {compareVersions[0]} ↔ {compareVersions[1]}
                </p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {compareLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : (
                  <div className="space-y-3">
                    {compareDiff.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{item}</p>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowPublishModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">发布流程</h3>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">变更说明</label>
                  <textarea
                    value={publishChangeLog}
                    onChange={(e) => setPublishChangeLog(e.target.value)}
                    placeholder="请输入本次发布的变更内容..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishStatus === 'publishing'}
                    className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {publishStatus === 'publishing' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {publishStatus === 'publishing' ? '发布中...' : '确认发布'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
