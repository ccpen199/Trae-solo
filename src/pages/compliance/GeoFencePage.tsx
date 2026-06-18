import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Plus, Edit, Trash2, MapPin, AlertTriangle, CheckCircle, Shield, User, Map, Eye } from 'lucide-react';
import { getGeoFences, createGeoFence, updateGeoFence, deleteGeoFence } from '../../services/api';
import type { GeoFence } from '../../../shared/types';

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: '已启用', color: 'bg-green-100 text-green-700' },
  inactive: { label: '已禁用', color: 'bg-gray-100 text-gray-500' },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  allowed: { label: '允许区域', color: 'bg-green-100 text-green-700' },
  restricted: { label: '禁止区域', color: 'bg-red-100 text-red-700' },
};

export default function GeoFencePage() {
  const [fences, setFences] = useState<GeoFence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFence, setSelectedFence] = useState<GeoFence | null>(null);
  const [alertRecords, setAlertRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchFences();
    generateMockAlerts();
  }, []);

  const fetchFences = async () => {
    try {
      setLoading(true);
      const res = await getGeoFences();
      if (res.code === 0) {
        setFences(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch fences:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockAlerts = () => {
    setAlertRecords([
      { id: 1, userName: '张三', userRole: '直销员', fenceName: '天津市禁止区域', location: '天津市和平区', alertTime: '2024-06-15 14:30:00', status: 'pending' },
      { id: 2, userName: '李四', userRole: '直销员', fenceName: '河北省禁止区域', location: '河北省石家庄市', alertTime: '2024-06-15 10:15:00', status: 'resolved' },
      { id: 3, userName: '王五', userRole: '生活馆店主', fenceName: '北京市朝阳区允许区域', location: '北京市朝阳区', alertTime: '2024-06-14 16:45:00', status: 'resolved' },
      { id: 4, userName: '赵六', userRole: '直销员', fenceName: '上海市禁止区域', location: '上海市浦东新区', alertTime: '2024-06-14 09:20:00', status: 'pending' },
    ]);
  };

  const handleCreate = async (data: Partial<GeoFence>) => {
    setFences([...fences, {
      id: fences.length + 1,
      name: data.name || '新区域',
      type: data.type || 'restricted',
      status: 'active',
      coordinates: data.coordinates || [],
      region: data.region || '北京市',
      description: data.description || '',
      createdAt: new Date().toISOString(),
      allowedRoles: [],
      isActive: true,
    } as GeoFence]);
    setShowCreateModal(false);
  };

  const handleToggleStatus = async (fence: GeoFence) => {
    const newStatus = fence.status === 'active' ? 'inactive' : 'active';
    setFences(fences.map(f => f.id === fence.id ? { ...f, status: newStatus } : f));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该地理围栏吗？')) return;
    setFences(fences.filter(f => f.id !== id));
  };

  const mapOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}'
    },
    geo: {
      map: 'china',
      roam: true,
      label: {
        show: true,
        fontSize: 10,
        color: '#6b7280'
      },
      itemStyle: {
        areaColor: '#f0fdf4',
        borderColor: '#059669',
        borderWidth: 1
      },
      emphasis: {
        itemStyle: {
          areaColor: '#d1fae5'
        }
      }
    },
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        data: [
          { name: '北京-允许区域', value: [116.46, 39.92], itemStyle: { color: '#10b981' } },
          { name: '天津-禁止区域', value: [117.2, 39.13], itemStyle: { color: '#ef4444' } },
          { name: '石家庄-禁止区域', value: [114.48, 38.03], itemStyle: { color: '#ef4444' } },
          { name: '上海-禁止区域', value: [121.48, 31.22], itemStyle: { color: '#ef4444' } },
          { name: '广州-允许区域', value: [113.23, 23.16], itemStyle: { color: '#10b981' } },
          { name: '成都-允许区域', value: [104.06, 30.67], itemStyle: { color: '#10b981' } },
        ],
        symbolSize: 15,
      }
    ]
  };

  const stats = [
    { label: '已配置围栏', value: fences.length, icon: Map, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '允许区域', value: fences.filter(f => f.type === 'allowed').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: '禁止区域', value: fences.filter(f => f.type === 'restricted').length, icon: AlertTriangle, color: 'text-danger-600', bg: 'bg-danger-100' },
    { label: '今日越界告警', value: alertRecords.filter(a => a.status === 'pending').length, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">全国区域围栏分布</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              允许区域
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              禁止区域
            </span>
          </div>
        </div>
        <ReactECharts option={mapOption} style={{ height: 400 }} />
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="搜索区域名称..." className="input pl-10 w-64" />
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加围栏
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">围栏配置列表</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">区域名称</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">类型</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">所属地区</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">状态</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">创建时间</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fences.map((fence) => (
              <tr key={fence.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${fence.type === 'allowed' ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                      <MapPin className={`w-5 h-5 ${fence.type === 'allowed' ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{fence.name}</p>
                      <p className="text-xs text-gray-500">{fence.pointCount || (fence.coordinates?.length || 0)} 个坐标点</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[fence.type].color}`}>
                    {typeConfig[fence.type].label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{fence.region}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[fence.status].color}`}>
                    {statusConfig[fence.status].label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {fence.createdAt ? new Date(fence.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(fence)}
                      className={`p-1.5 rounded-lg ${fence.status === 'active' ? 'hover:bg-amber-100 text-amber-600' : 'hover:bg-green-100 text-green-600'}`}
                      title={fence.status === 'active' ? '禁用' : '启用'}
                    >
                      {fence.status === 'active' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => setSelectedFence(fence)}
                      className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
                      title="查看"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(fence.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">越界告警记录</h3>
          <span className="text-sm text-gray-500">最近24小时</span>
        </div>
        <div className="divide-y divide-gray-100">
          {alertRecords.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-danger-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{alert.userName}</span>
                      <span className="text-sm text-gray-500">({alert.userRole})</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        越界告警
                      </span>
                      {alert.status === 'pending' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">待处理</span>
                      )}
                      {alert.status === 'resolved' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">已处理</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {alert.location} · {alert.fenceName}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{alert.alertTime}</p>
                  </div>
                </div>
                {alert.status === 'pending' && (
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                    处理
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">添加地理围栏</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">区域名称 *</label>
                <input type="text" id="fenceName" placeholder="请输入区域名称" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">围栏类型 *</label>
                <select id="fenceType" className="input w-full">
                  <option value="allowed">允许区域</option>
                  <option value="restricted">禁止区域</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所属地区</label>
                <input type="text" id="fenceRegion" placeholder="例如：北京市朝阳区" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea id="fenceDesc" placeholder="请输入围栏描述..." className="input w-full h-24"></textarea>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800">
                  <Shield className="w-4 h-4 inline mr-1" />
                  <strong>提示：</strong>地理围栏设置后，系统将自动监控直销员的展业区域，一旦越界将立即触发告警。禁止区域适用于未开放的市场区域。
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1">取消</button>
                <button 
                  onClick={() => {
                    const name = (document.getElementById('fenceName') as HTMLInputElement).value;
                    const type = (document.getElementById('fenceType') as HTMLSelectElement).value as 'allowed' | 'restricted';
                    const region = (document.getElementById('fenceRegion') as HTMLInputElement).value;
                    const description = (document.getElementById('fenceDesc') as HTMLTextAreaElement).value;
                    handleCreate({ name, type, region, description });
                  }}
                  className="btn btn-primary flex-1"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedFence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedFence(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">围栏详情</h3>
              <button onClick={() => setSelectedFence(null)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">区域名称</p>
                  <p className="font-semibold text-gray-900">{selectedFence.name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">类型</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[selectedFence.type].color}`}>
                    {typeConfig[selectedFence.type].label}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">所属地区</p>
                  <p className="font-semibold text-gray-900">{selectedFence.region}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">状态</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[selectedFence.status].color}`}>
                    {statusConfig[selectedFence.status].label}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-2">围栏描述</p>
                <p className="text-gray-700">{selectedFence.description || '暂无描述'}</p>
              </div>
              <div className="h-48 bg-gradient-to-br from-primary-50 to-amber-50 rounded-xl flex items-center justify-center">
                <Map className="w-12 h-12 text-primary-300" />
                <span className="ml-3 text-gray-400">地图预览</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
