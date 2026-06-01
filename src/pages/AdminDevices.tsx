import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, RefreshCw, AlertTriangle, Settings, Zap, Circle } from 'lucide-react';
import { setCurrentPage } from '../lib/appState';
import api from '../lib/api';

export default function AdminDevices() {
  const [chargers, setChargers] = useState<any[]>([]);
  const [guns, setGuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chargers');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'chargers') {
        const data = await api.operations.chargers(statusFilter ? { status: statusFilter } : undefined);
        setChargers(data.chargers);
      } else {
        const data = await api.operations.guns(statusFilter ? { status: statusFilter } : undefined);
        setGuns(data.guns);
      }
    } catch (err) {
      console.error('Load devices failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestartCharger = async (id: number) => {
    if (!confirm('确定要重启该充电桩吗？')) return;
    setActionLoading(id);
    try {
      await api.operations.restartCharger(id);
      alert('重启命令已发送');
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetGunStatus = async (id: number, status: string) => {
    setActionLoading(id);
    try {
      await api.operations.setGunStatus(id, status);
      alert('状态已更新');
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      online: 'bg-green-100 text-green-700',
      offline: 'bg-gray-100 text-gray-700',
      fault: 'bg-red-100 text-red-700',
      charging: 'bg-blue-100 text-blue-700',
      idle: 'bg-green-100 text-green-700',
      reserved: 'bg-purple-100 text-purple-700',
      occupied: 'bg-orange-100 text-orange-700',
    };
    const labels: Record<string, string> = {
      online: '在线',
      offline: '离线',
      fault: '故障',
      charging: '充电中',
      idle: '空闲',
      reserved: '已预约',
      occupied: '占用',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredChargers = chargers.filter(c =>
    c.serial_number.includes(searchText) || c.station_name.includes(searchText)
  );

  const filteredGuns = guns.filter(g =>
    g.gun_no.includes(searchText) || g.station_name.includes(searchText)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('admin-dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">设备管理</h1>
            <p className="text-sm text-gray-500">充电桩和充电枪管理</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('chargers')}
              className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${activeTab === 'chargers' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Zap className="w-4 h-4" />
              充电桩 ({chargers.length})
            </button>
            <button
              onClick={() => setActiveTab('guns')}
              className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${activeTab === 'guns' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Circle className="w-4 h-4" />
              充电枪 ({guns.length})
            </button>
          </div>

          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索设备编号或站点..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none"
              >
                <option value="">全部状态</option>
                {activeTab === 'chargers' ? (
                  <>
                    <option value="online">在线</option>
                    <option value="offline">离线</option>
                    <option value="fault">故障</option>
                  </>
                ) : (
                  <>
                    <option value="idle">空闲</option>
                    <option value="charging">充电中</option>
                    <option value="fault">故障</option>
                    <option value="reserved">已预约</option>
                  </>
                )}
              </select>
              <button
                onClick={loadData}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : activeTab === 'chargers' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChargers.map((charger) => (
              <div key={charger.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold text-gray-800">{charger.serial_number}</div>
                    <div className="text-sm text-gray-500">{charger.station_name}</div>
                  </div>
                  {getStatusBadge(charger.status)}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs">型号</div>
                    <div className="font-medium text-gray-700">{charger.model}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs">功率</div>
                    <div className="font-medium text-gray-700">{charger.power} kW</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs">充电枪</div>
                    <div className="font-medium text-gray-700">
                      充电中 {charger.charging_guns}/{charger.total_guns}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs">固件</div>
                    <div className="font-medium text-gray-700">{charger.firmware_version}</div>
                  </div>
                </div>
                {charger.fault_guns > 0 && (
                  <div className="mb-3 p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {charger.fault_guns} 把枪故障
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestartCharger(charger.id)}
                    disabled={actionLoading === charger.id}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${actionLoading === charger.id ? 'animate-spin' : ''}`} />
                    重启
                  </button>
                  <button
                    onClick={() => {}}
                    className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Settings className="w-4 h-4" />
                    升级
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">枪号</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">所属站点</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">充电桩</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">接口类型</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">最大功率</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">当前订单</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGuns.map((gun) => (
                  <tr key={gun.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{gun.gun_no}</td>
                    <td className="px-6 py-4 text-gray-600">{gun.station_name}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{gun.charger_sn}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                        {gun.connector_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{gun.max_power} kW</td>
                    <td className="px-6 py-4">{getStatusBadge(gun.status)}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                      {gun.current_order_no || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {gun.status !== 'charging' && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleSetGunStatus(gun.id, 'idle')}
                            disabled={actionLoading === gun.id}
                            className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                          >
                            设为空闲
                          </button>
                          <button
                            onClick={() => handleSetGunStatus(gun.id, 'fault')}
                            disabled={actionLoading === gun.id}
                            className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          >
                            设为故障
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
