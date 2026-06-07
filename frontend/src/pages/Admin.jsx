import React, { useState, useEffect, useCallback } from 'react';
import { companyAPI, orderAPI, exceptionAPI, urgentAPI } from '../services/api';

const STATUS_CLASS = {
  delivered: 'bg-green-100 text-green-800',
  transit: 'bg-blue-100 text-blue-800',
  exception: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800'
};
const STATUS_TEXT = { delivered: '已送达', transit: '运输中', exception: '异常', pending: '待揽收' };

function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [companies, setCompanies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [companiesData, ordersData, couriersData] = await Promise.all([
        companyAPI.list().catch(() => []),
        orderAPI.getByUser(1).catch(() => []),
        urgentAPI.getAvailableCouriers().catch(() => []),
      ]);
      setCompanies(companiesData || []);
      setOrders(ordersData || []);
      setCouriers(couriersData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    } else if (activeTab === 'companies') {
      companyAPI.list().then(setCompanies).catch(() => {});
    } else if (activeTab === 'orders') {
      orderAPI.getByUser(1).then(setOrders).catch(() => {});
    } else if (activeTab === 'couriers') {
      urgentAPI.getAvailableCouriers().then(setCouriers).catch(() => []);
    } else if (activeTab === 'exceptions') {
      orderAPI.getByUser(1).then(data => {
        setOrders(data.filter(o => o.status === 'exception'));
      }).catch(() => {});
    }
  }, [activeTab, loadDashboardData]);

  const handleAnalyzeException = async (orderId) => {
    try {
      const analysis = await exceptionAPI.autoAnalyze(orderId);
      alert(`分析结果：\n类型：${analysis.exception_type}\n原因：${analysis.cause}\n建议：${analysis.suggestion}`);
    } catch {
      alert('分析失败');
    }
  };

  const stats = {
    totalOrders: orders.length,
    inTransit: orders.filter(o => o.status === 'transit').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    pending: orders.filter(o => o.status === 'pending').length,
    exception: orders.filter(o => o.status === 'exception').length,
    totalCompanies: companies.length,
    activeCompanies: companies.filter(c => c.is_active !== 0).length,
    couriersAvailable: couriers.filter(c => c.status === 'available').length,
    totalCouriers: couriers.length,
  };

  const topCouriers = [...couriers].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 py-6">
            {[['dashboard', '数据看板'], ['companies', '快递公司管理'], ['orders', '运单管理'], ['couriers', '快递员绩效'], ['exceptions', '异常分析']].map(([key, name]) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`font-medium transition-colors pb-2 ${activeTab === key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">管理后台 · 数据看板</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[{ label: '总订单数', value: stats.totalOrders, color: 'blue', icon: '📦' },
                { label: '运输中', value: stats.inTransit, color: 'indigo', icon: '🚚' },
                { label: '已送达', value: stats.delivered, color: 'green', icon: '✅' },
                { label: '异常订单', value: stats.exception, color: 'red', icon: '⚠️' },
                { label: '已接入公司', value: stats.activeCompanies, color: 'blue', icon: '🏢' },
                { label: '总公司数', value: stats.totalCompanies, color: 'gray', icon: '📋' },
                { label: '可用骑手', value: stats.couriersAvailable, color: 'green', icon: '🛵' },
                { label: '总快递员', value: stats.totalCouriers, color: 'gray', icon: '👷' }
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm text-gray-500">{item.label}</span>
                  </div>
                  <div className={`text-3xl font-bold ${item.color === 'blue' ? 'text-blue-600' : item.color === 'green' ? 'text-green-600' : item.color === 'red' ? 'text-red-600' : 'text-gray-800'}`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">订单状态分布</h2>
                {[{ key: 'pending', label: '待揽收', color: 'bg-yellow-500', count: stats.pending },
                  { key: 'transit', label: '运输中', color: 'bg-blue-500', count: stats.inTransit },
                  { key: 'delivered', label: '已送达', color: 'bg-green-500', count: stats.delivered },
                  { key: 'exception', label: '异常', color: 'bg-red-500', count: stats.exception }
                ].map(item => (
                  <div key={item.key} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm text-gray-600">{item.count} 单</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${(item.count / Math.max(stats.totalOrders, 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">企业API网关状态</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-green-800">API 网关</div>
                      <div className="text-sm text-green-600">运行正常</div>
                    </div>
                    <div className="text-2xl">✅</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xl font-bold text-blue-600">99.9%</div>
                      <div className="text-xs text-gray-500">可用性</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xl font-bold text-blue-600">1234</div>
                      <div className="text-xs text-gray-500">今日调用</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xl font-bold text-blue-600">23ms</div>
                      <div className="text-xs text-gray-500">平均响应</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">快递员绩效排行</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {topCouriers.map((c, i) => (
                  <div key={c.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👷'}
                      </div>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.vehicle_type || '电动车'}</div>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">评分</span><span className="font-medium text-yellow-600">★ {c.rating || 4.5}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">距离</span><span className="font-medium">{c.distance_km || (Math.random() * 3 + 0.5).toFixed(1)}km</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">预计到达</span><span className="font-medium">{c.estimated_arrival_min || Math.floor(Math.random() * 15 + 3)}分钟</span></div>
                    </div>
                  </div>
                ))}
                {topCouriers.length === 0 && <div className="col-span-5 text-center py-8 text-gray-500">加载中...</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">快递公司管理</h1>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">公司名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">代码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">基准费率</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">接入时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {companies.map(company => {
                    const meta = company.metadata && typeof company.metadata === 'string' ? JSON.parse(company.metadata) : company.metadata || {};
                    return (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-bold text-xs">{company.code}</span>
                            </div>
                            <span className="font-medium">{company.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono">{company.code}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">已接入</span>
                        </td>
                        <td className="px-6 py-4">¥{meta.baseRate || '-'} / kg</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(company.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-6">运单管理</h1>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">订单号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">快递单号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">寄件人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">收件人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(order => {
                    const sender = order.sender_info ? JSON.parse(order.sender_info) : {};
                    const receiver = order.receiver_info ? JSON.parse(order.receiver_info) : {};
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{order.order_no}</td>
                        <td className="px-6 py-4 font-mono text-sm">{order.tracking_no}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${STATUS_CLASS[order.status]}`}>
                            {STATUS_TEXT[order.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{sender.name || '-'}</td>
                        <td className="px-6 py-4 text-sm">{receiver.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {orders.length === 0 && <div className="text-center py-12 text-gray-500">暂无订单</div>}
            </div>
          </div>
        )}

        {activeTab === 'couriers' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-6">快递员绩效看板</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {couriers.map(c => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl">👷</div>
                    <div>
                      <div className="text-lg font-bold">{c.name}</div>
                      <div className="text-sm text-gray-500">{c.phone}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">评分</span>
                      <span className="font-medium text-yellow-600">★ {c.rating || 4.5}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">交通工具</span>
                      <span className="font-medium">{c.vehicle_type || '电动车'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">当前位置</span>
                      <span className="font-medium text-sm">{c.current_location || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">距离您</span>
                      <span className="font-medium">{c.distance_km || 1.2}km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">预计到达</span>
                      <span className="font-medium">{c.estimated_arrival_min || 8}分钟</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">状态</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${c.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {c.status === 'available' ? '在岗可用' : '忙碌中'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {couriers.length === 0 && <div className="col-span-3 text-center py-12 text-gray-500">加载中...</div>}
            </div>
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-6">异常物流归因分析</h1>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => {
                    const sender = order.sender_info ? JSON.parse(order.sender_info) : {};
                    const receiver = order.receiver_info ? JSON.parse(order.receiver_info) : {};
                    return (
                      <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="font-mono text-sm mr-3">{order.tracking_no}</span>
                            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">异常</span>
                          </div>
                          <button onClick={() => handleAnalyzeException(order.id)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm">
                            智能分析
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">寄件人</div>
                            <div className="font-medium">{sender.name || '-'}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">收件人</div>
                            <div className="font-medium">{receiver.name || '-'}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">创建时间</div>
                            <div>{new Date(order.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">✅</div>
                  <div className="text-lg font-medium mb-2">暂无异常订单</div>
                  <div className="text-gray-500">所有运单状态正常</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
