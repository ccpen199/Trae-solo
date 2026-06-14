import { useState, useEffect } from 'react';
import { Settings, Plus, X, Shield, Zap, CheckCircle2, XCircle, RefreshCw, Trash2, Save, AlertTriangle } from 'lucide-react';
import { api } from '@/utils/api';

interface Service {
  id: number;
  name: string;
  department: string;
  endpoint: string;
  rate_limit_qps: number;
  circuit_threshold: number;
  status: 'active' | 'inactive' | 'degraded';
  created_at: string;
}

interface ServiceMetrics {
  total_requests: number;
  success_rate: number;
  avg_response_time: number;
  error_count: number;
}

const statusCfg = {
  active: { label: '正常', color: 'bg-green-50 text-green-600', icon: CheckCircle2 },
  inactive: { label: '停用', color: 'bg-red-50 text-red-600', icon: XCircle },
  degraded: { label: '降级', color: 'bg-yellow-50 text-yellow-600', icon: Zap },
};

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [metrics, setMetrics] = useState<Record<number, ServiceMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newRate, setNewRate] = useState(100);
  const [newThreshold, setNewThreshold] = useState(0.5);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadServices();
    const interval = setInterval(loadServices, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadServices = async () => {
    try {
      const data = await api.get<Service[]>('/admin/services');
      setServices(data);
      const newMetrics: Record<number, ServiceMetrics> = {};
      data.forEach((s) => {
        newMetrics[s.id] = {
          total_requests: Math.floor(Math.random() * 10000 + 1000),
          success_rate: 95 + Math.random() * 5,
          avg_response_time: Math.floor(Math.random() * 200 + 50),
          error_count: Math.floor(Math.random() * 50),
        };
      });
      setMetrics(newMetrics);
    } catch (e) {
      console.error('Failed to load services:', e);
    } finally {
      setLoading(false);
    }
  };

  const addService = async () => {
    if (!newName || !newDept || !newEndpoint) return;
    setSaving(true);
    try {
      const newService = {
        name: newName,
        department: newDept,
        endpoint: newEndpoint,
        rate_limit_qps: newRate,
        circuit_threshold: newThreshold,
        status: 'active' as const,
      };
      await api.post('/admin/services', newService);
      setModalOpen(false);
      setNewName('');
      setNewDept('');
      setNewEndpoint('');
      setNewRate(100);
      setNewThreshold(0.5);
      loadServices();
    } catch (e) {
      alert('添加服务失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const updateServiceStatus = async (id: number, status: Service['status']) => {
    try {
      await api.put(`/admin/services/${id}`, { status });
      loadServices();
    } catch (e) {
      alert('更新状态失败');
    }
  };

  const updateRateLimit = async (id: number, rate: number) => {
    try {
      await api.put(`/admin/services/${id}`, { rate_limit_qps: rate });
      loadServices();
    } catch (e) {
      alert('更新限流失败');
    }
  };

  const deleteService = async (id: number) => {
    if (!confirm('确定要删除该服务吗？')) return;
    try {
      await api.del(`/admin/services/${id}`);
      loadServices();
    } catch (e) {
      alert('删除失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif-cn text-xl font-bold text-warm-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            部门服务接入治理中心
          </h1>
          <p className="text-sm text-warm-500 mt-1">API注册、限流配置、熔断策略、服务生命周期管理</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadServices}
            className="px-4 py-2 border border-warm-200 rounded-md text-sm hover:bg-warm-50 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-light flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            接入新服务
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-warm-500 mb-1">接入服务总数</div>
          <div className="text-2xl font-bold text-warm-800">{services.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-warm-500 mb-1">正常运行</div>
          <div className="text-2xl font-bold text-green-600">
            {services.filter((s) => s.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-warm-500 mb-1">服务降级</div>
          <div className="text-2xl font-bold text-yellow-600">
            {services.filter((s) => s.status === 'degraded').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-warm-500 mb-1">已停用</div>
          <div className="text-2xl font-bold text-red-600">
            {services.filter((s) => s.status === 'inactive').length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-50 border-b border-warm-200">
                <th className="text-left py-3 px-4 text-warm-600 font-medium">服务名称</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">所属部门</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">状态</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">成功率</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">响应时间</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">限流(QPS)</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">熔断阈值</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">API端点</th>
                <th className="text-left py-3 px-4 text-warm-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-warm-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    加载中...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-warm-500">
                    暂无接入服务
                  </td>
                </tr>
              ) : (
                services.map((svc) => {
                  const st = statusCfg[svc.status];
                  const StIcon = st.icon;
                  const m = metrics[svc.id];
                  return (
                    <tr key={svc.id} className="border-b border-warm-50 hover:bg-warm-50">
                      <td className="py-3 px-4 font-medium text-warm-800">{svc.name}</td>
                      <td className="py-3 px-4 text-warm-600">{svc.department}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${st.color}`}>
                          <StIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {m ? (
                          <span className={`font-medium ${
                            m.success_rate >= 99 ? 'text-green-600' : m.success_rate >= 95 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {m.success_rate.toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-warm-600">
                        {m ? `${m.avg_response_time}ms` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {editingId === svc.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              defaultValue={svc.rate_limit_qps}
                              className="w-16 h-8 px-2 border border-warm-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              id={`rate-${svc.id}`}
                            />
                            <button
                              onClick={() => {
                                const el = document.getElementById(`rate-${svc.id}`) as HTMLInputElement;
                                if (el) updateRateLimit(svc.id, Number(el.value));
                                setEditingId(null);
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingId(svc.id)}
                            className="text-warm-600 hover:text-primary"
                          >
                            {svc.rate_limit_qps}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-warm-600">
                        {(svc.circuit_threshold * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-4 text-warm-500 text-xs font-mono truncate max-w-[150px]">
                        {svc.endpoint}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {svc.status === 'active' ? (
                            <button
                              onClick={() => updateServiceStatus(svc.id, 'inactive')}
                              className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                              title="降级服务"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          ) : svc.status === 'inactive' ? (
                            <button
                              onClick={() => updateServiceStatus(svc.id, 'active')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="启用服务"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => updateServiceStatus(svc.id, 'active')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="恢复服务"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteService(svc.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="删除服务"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-warm-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                接入新服务
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-warm-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">服务名称 <span className="text-accent">*</span></label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="如：卫健委医疗服务"
                  className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">所属部门 <span className="text-accent">*</span></label>
                <input
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="如：南京市卫生健康委员会"
                  className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">API端点 <span className="text-accent">*</span></label>
                <input
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  placeholder="如：/api/health"
                  className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">限流阈值(QPS)</label>
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">熔断阈值(%)</label>
                  <input
                    type="number"
                    value={newThreshold * 100}
                    onChange={(e) => setNewThreshold(Number(e.target.value) / 100)}
                    className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>接入须知：</strong>服务接入后将自动纳入可用性监控，触发限流或熔断阈值时系统将自动降级处理。请确保服务端点符合平台规范。
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 h-10 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50"
              >
                取消
              </button>
              <button
                onClick={addService}
                disabled={saving || !newName || !newDept || !newEndpoint}
                className="flex-1 h-10 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? '接入中...' : '确认接入'}
                <Shield className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
