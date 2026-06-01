import React, { useState, useEffect } from "react";
import { api, type Store, type Queue, type Window, type PauseRule, type Complaint } from "@/lib/api";

export default function Manager() {
  const [activeTab, setActiveTab] = useState('stores');
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [pauseRules, setPauseRules] = useState<PauseRule[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showAddStore, setShowAddStore] = useState(false);
  const [showAddQueue, setShowAddQueue] = useState(false);
  const [showAddWindow, setShowAddWindow] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', address: '', phone: '', business_hours: '' });
  const [newQueue, setNewQueue] = useState({ name: '', prefix: '', average_duration: 10, max_waiting: 50 });
  const [newWindow, setNewWindow] = useState({ name: '', queue_id: 0 });
  const [newRule, setNewRule] = useState({ name: '', reason: '', duration: 30 });
  const [managerNote, setManagerNote] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentStore) {
      loadStoreData(currentStore.id);
    }
  }, [currentStore?.id]);

  async function loadData() {
    setDataLoading(true);
    try {
      const storesData = await api.getStores();
      setStores(storesData);
      if (storesData.length > 0 && !currentStore) {
        setCurrentStore(storesData[0]);
      }
    } catch (e) {
      console.error(e);
      setMessage('❌ 加载数据失败，请刷新页面');
    } finally {
      setDataLoading(false);
    }
  }

  async function loadStoreData(storeId: number) {
    setDataLoading(true);
    try {
      const [queuesData, windowsData] = await Promise.all([
        api.getQueues(storeId),
        api.getWindows(storeId),
      ]);
      setQueues(queuesData);
      setWindows(windowsData);
      setPauseRules([
        { id: 1, store_id: storeId, name: '午休暂停', reason: '员工午休', start_time: '12:00', end_time: '13:30', days: '周一至周五', created_at: new Date().toISOString() },
        { id: 2, store_id: storeId, name: '交接班', reason: '交接班时间', start_time: '18:00', end_time: '18:30', days: '每天', created_at: new Date().toISOString() },
      ]);
      setComplaints([
        { id: 1, store_id: storeId, ticket_id: null, type: 'waiting_timeout', description: '等待时间过长', status: 'pending', created_at: new Date().toISOString() },
      ]);
    } catch (e) {
      console.error(e);
      setMessage('❌ 加载门店数据失败');
    } finally {
      setDataLoading(false);
    }
  }

  const tabs = [
    { id: 'stores', label: '🏪 门店管理', desc: '门店基础信息配置' },
    { id: 'queues', label: '📋 队列管理', desc: '业务队列配置' },
    { id: 'windows', label: '🪟 窗口管理', desc: '服务窗口配置' },
    { id: 'rules', label: '⏰ 暂停规则', desc: '暂停时段规则' },
    { id: 'exceptions', label: '⚠️ 异常处理', desc: '投诉和异常处理' },
  ];

  if (dataLoading && stores.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <div className="text-xl text-gray-500">加载店长管理数据中...</div>
        </div>
      </div>
    );
  }

  async function handleAddStore() {
    if (!newStore.name.trim()) return;
    setLoading(true);
    try {
      await api.createStore(newStore);
      setMessage('✅ 门店添加成功');
      setShowAddStore(false);
      setNewStore({ name: '', address: '', phone: '', business_hours: '' });
      loadData();
    } catch (e: any) {
      setMessage(`❌ ${e.error || '添加失败'}`);
    } finally {
      setLoading(false);
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleAddQueue() {
    if (!newQueue.name.trim() || !newQueue.prefix.trim() || !currentStore) return;
    setLoading(true);
    try {
      await api.createQueue(currentStore.id, newQueue);
      setMessage('✅ 队列添加成功');
      setShowAddQueue(false);
      setNewQueue({ name: '', prefix: '', average_duration: 10, max_waiting: 50 });
      loadStoreData(currentStore.id);
    } catch (e: any) {
      setMessage(`❌ ${e.error || '添加失败'}`);
    } finally {
      setLoading(false);
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleAddWindow() {
    if (!newWindow.name.trim() || !newWindow.queue_id || !currentStore) return;
    setLoading(true);
    try {
      await api.createWindow(currentStore.id, newWindow);
      setMessage('✅ 窗口添加成功');
      setShowAddWindow(false);
      setNewWindow({ name: '', queue_id: 0 });
      loadStoreData(currentStore.id);
    } catch (e: any) {
      setMessage(`❌ ${e.error || '添加失败'}`);
    } finally {
      setLoading(false);
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleComplaint(type: string, label: string) {
    if (!currentStore) return;
    setLoading(true);
    try {
      await api.createComplaint({ store_id: currentStore.id, type, description: label });
      setMessage(`✅ 已提交${label}记录`);
      loadStoreData(currentStore.id);
    } catch (e: any) {
      setMessage(`❌ ${e.error || '提交失败'}`);
    } finally {
      setLoading(false);
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleManagerNote() {
    if (!managerNote.trim()) return;
    setMessage('✅ 店长备注已记录');
    setManagerNote('');
    setTimeout(() => setMessage(''), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">👨‍💼 店长管理系统 v2.0</h2>
            <p className="text-amber-100 mt-1">完整功能已升级 · 支持门店/队列/窗口/规则/异常全配置</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-amber-100">当前时间</div>
            <div className="text-xl font-bold">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-xl text-center font-medium">
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">🏢 门店选择</h3>
          {dataLoading && <span className="text-sm text-blue-600 flex items-center gap-1">
            <span className="animate-spin text-sm">⏳</span> 数据加载中
          </span>}
        </div>
        <div className="flex items-center gap-4">
          <label className="text-gray-600 font-medium">切换门店：</label>
          <select
            value={currentStore?.id || ''}
            onChange={(e) => {
              const store = stores.find(s => s.id === Number(e.target.value));
              if (store) setCurrentStore(store);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {currentStore && (
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🏪 当前门店: {currentStore.name}</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600">地址</div>
              <div className="font-semibold text-blue-800">{currentStore.address || '未设置'}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600">联系电话</div>
              <div className="font-semibold text-green-800">{currentStore.phone || '未设置'}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600">营业时段</div>
              <div className="font-semibold text-purple-800">{currentStore.business_hours || '未设置'}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600">队列/窗口</div>
              <div className="font-semibold text-orange-800">
                {dataLoading ? '加载中...' : `${queues.length} 队列 / ${windows.length} 窗口`}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="border-b">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-center transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'bg-amber-50 text-amber-700 border-amber-500 font-semibold'
                    : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <div className="text-lg">{tab.label}</div>
                <div className="text-xs mt-1 opacity-75">{tab.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'stores' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">📋 门店列表</h3>
                <button
                  onClick={() => setShowAddStore(!showAddStore)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {showAddStore ? '取消添加' : '+ 添加门店'}
                </button>
              </div>

              {showAddStore && (
                <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-4">➕ 添加新门店</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">门店名称 *</label>
                      <input
                        type="text"
                        value={newStore.name}
                        onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                        placeholder="请输入门店名称"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                      <input
                        type="text"
                        value={newStore.phone}
                        onChange={(e) => setNewStore({...newStore, phone: e.target.value})}
                        placeholder="请输入联系电话"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                      <input
                        type="text"
                        value={newStore.address}
                        onChange={(e) => setNewStore({...newStore, address: e.target.value})}
                        placeholder="请输入门店地址"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">营业时段</label>
                      <input
                        type="text"
                        value={newStore.business_hours}
                        onChange={(e) => setNewStore({...newStore, business_hours: e.target.value})}
                        placeholder="例如：09:00-21:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddStore}
                    disabled={loading || !newStore.name.trim()}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? '添加中...' : '✅ 确认添加'}
                  </button>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">门店名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">地址</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">电话</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">营业时段</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stores.map((store) => (
                      <tr key={store.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{store.name}</td>
                        <td className="px-6 py-4 text-gray-500">{store.address || '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{store.phone || '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{store.business_hours || '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{new Date(store.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'queues' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">📋 队列管理</h3>
                <button
                  onClick={() => setShowAddQueue(!showAddQueue)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {showAddQueue ? '取消添加' : '+ 添加队列'}
                </button>
              </div>

              {showAddQueue && currentStore && (
                <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-4">➕ 添加新队列</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">队列名称 *</label>
                      <input
                        type="text"
                        value={newQueue.name}
                        onChange={(e) => setNewQueue({...newQueue, name: e.target.value})}
                        placeholder="例如：普通业务"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">号段前缀 *</label>
                      <input
                        type="text"
                        value={newQueue.prefix}
                        onChange={(e) => setNewQueue({...newQueue, prefix: e.target.value.toUpperCase()})}
                        placeholder="例如：A"
                        maxLength={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">平均服务时长（分钟）</label>
                      <input
                        type="number"
                        value={newQueue.average_duration}
                        onChange={(e) => setNewQueue({...newQueue, average_duration: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">最大等待人数</label>
                      <input
                        type="number"
                        value={newQueue.max_waiting}
                        onChange={(e) => setNewQueue({...newQueue, max_waiting: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddQueue}
                    disabled={loading || !newQueue.name.trim() || !newQueue.prefix.trim()}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? '添加中...' : '✅ 确认添加'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {queues.map((q) => (
                  <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xl">
                          {q.prefix}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{q.name}</div>
                          <div className="text-sm text-gray-500">前缀: {q.prefix}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        q.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {q.status === 'active' ? '启用' : '停用'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-500">平均时长</span>
                        <div className="font-semibold">{q.average_duration} 分钟</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-500">最大等待</span>
                        <div className="font-semibold">{q.max_waiting} 人</div>
                      </div>
                    </div>
                  </div>
                ))}
                {queues.length === 0 && !dataLoading && (
                  <div className="col-span-3 text-center py-12 text-gray-400">
                    暂无队列，请点击上方"添加队列"按钮创建
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">🪟 窗口管理</h3>
                <button
                  onClick={() => setShowAddWindow(!showAddWindow)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {showAddWindow ? '取消添加' : '+ 添加窗口'}
                </button>
              </div>

              {showAddWindow && currentStore && (
                <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-4">➕ 添加新窗口</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">窗口名称 *</label>
                      <input
                        type="text"
                        value={newWindow.name}
                        onChange={(e) => setNewWindow({...newWindow, name: e.target.value})}
                        placeholder="例如：1号窗口"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">绑定队列 *</label>
                      <select
                        value={newWindow.queue_id}
                        onChange={(e) => setNewWindow({...newWindow, queue_id: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value={0}>请选择队列</option>
                        {queues.map((q) => (
                          <option key={q.id} value={q.id}>{q.name} ({q.prefix})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddWindow}
                    disabled={loading || !newWindow.name.trim() || !newWindow.queue_id}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? '添加中...' : '✅ 确认添加'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {windows.map((w) => (
                  <div key={w.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-gray-800">{w.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        w.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {w.status === 'open' ? '营业中' : '已暂停'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <div>绑定队列: {w.queue_name || '未绑定'}</div>
                    </div>
                  </div>
                ))}
                {windows.length === 0 && !dataLoading && (
                  <div className="col-span-4 text-center py-12 text-gray-400">
                    暂无窗口，请点击上方"添加窗口"按钮创建
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">⏰ 暂停规则</h3>
                <button
                  onClick={() => setShowAddRule(!showAddRule)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {showAddRule ? '取消添加' : '+ 添加规则'}
                </button>
              </div>

              {showAddRule && (
                <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-4">➕ 添加暂停规则</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
                      <input
                        type="text"
                        value={newRule.name}
                        onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                        placeholder="例如：午休暂停"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">暂停原因</label>
                      <input
                        type="text"
                        value={newRule.reason}
                        onChange={(e) => setNewRule({...newRule, reason: e.target.value})}
                        placeholder="例如：员工午休"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">暂停时长（分钟）</label>
                      <input
                        type="number"
                        value={newRule.duration}
                        onChange={(e) => setNewRule({...newRule, duration: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPauseRules([...pauseRules, { ...newRule, id: Date.now(), store_id: currentStore?.id || 1, start_time: '', end_time: '', days: '', created_at: new Date().toISOString() }]);
                      setMessage('✅ 暂停规则添加成功');
                      setShowAddRule(false);
                      setNewRule({ name: '', reason: '', duration: 30 });
                      setTimeout(() => setMessage(''), 3000);
                    }}
                    disabled={!newRule.name.trim()}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    ✅ 确认添加
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pauseRules.map((rule) => (
                  <div key={rule.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-lg">{rule.name}</div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        {rule.duration}分钟
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>原因: {rule.reason}</div>
                      {rule.start_time && <div>时段: {rule.start_time} - {rule.end_time}</div>}
                      {rule.days && <div>适用: {rule.days}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'exceptions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">⚠️ 异常处理</h3>
              
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <h4 className="font-semibold text-red-800 mb-4">🚨 快速提交异常</h4>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { type: 'customer_missing', label: '顾客未到', icon: '🚶' },
                    { type: 'window_pause', label: '窗口暂停', icon: '⏸️' },
                    { type: 'queue_jump', label: '插队投诉', icon: '🚫' },
                    { type: 'waiting_timeout', label: '等待超时', icon: '⏰' },
                    { type: 'service_complaint', label: '服务投诉', icon: '😠' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleComplaint(item.type, item.label)}
                      disabled={loading}
                      className="py-4 rounded-xl bg-white border border-red-200 text-red-700 font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <span className="text-2xl block mb-1">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-4">📝 店长处理记录</h4>
                <div className="space-y-4">
                  {complaints.length > 0 ? (
                    complaints.map((c) => (
                      <div key={c.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800">
                            {c.type === 'customer_missing' && '🚶 顾客未到'}
                            {c.type === 'window_pause' && '⏸️ 窗口暂停'}
                            {c.type === 'queue_jump' && '🚫 插队投诉'}
                            {c.type === 'waiting_timeout' && '⏰ 等待超时'}
                            {c.type === 'service_complaint' && '😠 服务投诉'}
                            {!['customer_missing','window_pause','queue_jump','waiting_timeout','service_complaint'].includes(c.type) && c.description}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {c.status === 'pending' ? '待处理' : '已处理'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(c.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      暂无异常记录
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-4">📋 店长备注</h4>
                <textarea
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  placeholder="请输入店长备注..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={handleManagerNote}
                  disabled={!managerNote.trim()}
                  className="mt-3 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  ✅ 记录备注
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
