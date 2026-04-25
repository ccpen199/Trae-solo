import { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const [allRes, unreadRes] = await Promise.all([
        alertsAPI.getAll(),
        alertsAPI.getUnread()
      ]);
      setAlerts(allRes.data);
      setUnreadAlerts(unreadRes.data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await alertsAPI.markAsRead(id);
      loadAlerts();
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertsAPI.markAllAsRead();
      loadAlerts();
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这条告警吗？')) {
      try {
        await alertsAPI.delete(id);
        loadAlerts();
      } catch (error) {
        console.error('Failed to delete alert:', error);
      }
    }
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'price_drop':
        return '💰';
      case 'price_rise':
        return '📈';
      case 'stock_change':
        return '📦';
      case 'new_product':
        return '🆕';
      case 'sale_event':
        return '🎉';
      default:
        return '🔔';
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'price_drop':
        return '价格下降';
      case 'price_rise':
        return '价格上涨';
      case 'stock_change':
        return '库存变化';
      case 'new_product':
        return '新品上线';
      case 'sale_event':
        return '促销活动';
      default:
        return '系统通知';
    }
  };

  const getAlertTypeColor = (type) => {
    switch (type) {
      case 'price_drop':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'price_rise':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'stock_change':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'new_product':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sale_event':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAlerts = filter === 'unread' 
    ? alerts.filter(a => !a.is_read)
    : filter === 'read'
    ? alerts.filter(a => a.is_read)
    : alerts;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🔔 告警中心</h1>
          <p className="text-gray-500 mt-1">
            您有 <span className="font-bold text-red-500">{unreadAlerts.length}</span> 条未读告警
          </p>
        </div>
        {unreadAlerts.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ✓ 全部标记已读
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl cursor-pointer transition-all ${
          filter === 'all' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white shadow-md hover:shadow-lg'
        }`} onClick={() => setFilter('all')}>
          <div className="text-3xl mb-2">📋</div>
          <div className={`text-2xl font-bold ${filter === 'all' ? 'text-white' : 'text-gray-800'}`}>
            {alerts.length}
          </div>
          <div className={`text-sm ${filter === 'all' ? 'text-blue-100' : 'text-gray-500'}`}>
            全部告警
          </div>
        </div>

        <div className={`p-4 rounded-xl cursor-pointer transition-all ${
          filter === 'unread' ? 'bg-red-500 text-white shadow-lg' : 'bg-white shadow-md hover:shadow-lg'
        }`} onClick={() => setFilter('unread')}>
          <div className="text-3xl mb-2">🔴</div>
          <div className={`text-2xl font-bold ${filter === 'unread' ? 'text-white' : 'text-gray-800'}`}>
            {unreadAlerts.length}
          </div>
          <div className={`text-sm ${filter === 'unread' ? 'text-red-100' : 'text-gray-500'}`}>
            未读告警
          </div>
        </div>

        <div className={`p-4 rounded-xl cursor-pointer transition-all ${
          filter === 'read' ? 'bg-green-500 text-white shadow-lg' : 'bg-white shadow-md hover:shadow-lg'
        }`} onClick={() => setFilter('read')}>
          <div className="text-3xl mb-2">✓</div>
          <div className={`text-2xl font-bold ${filter === 'read' ? 'text-white' : 'text-gray-800'}`}>
            {alerts.filter(a => a.is_read).length}
          </div>
          <div className={`text-sm ${filter === 'read' ? 'text-green-100' : 'text-gray-500'}`}>
            已读告警
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-gray-800">
            {alerts.length > 0 ? ((alerts.filter(a => a.is_read).length / alerts.length * 100).toFixed(0)) : 0}%
          </div>
          <div className="text-sm text-gray-500">
            处理完成率
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {filter === 'all' ? '全部告警' : filter === 'unread' ? '未读告警' : '已读告警'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredAlerts.length} 条)
            </span>
          </h2>
          <button
            onClick={loadAlerts}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            🔄 刷新
          </button>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {filter === 'unread' ? '暂无未读告警' : '暂无告警'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' ? '所有告警都已处理' : '监控系统运行正常'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  alert.is_read 
                    ? 'bg-gray-50 border-gray-200 opacity-75' 
                    : getAlertTypeColor(alert.type)
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">
                      {getAlertTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          alert.is_read 
                            ? 'bg-gray-200 text-gray-600' 
                            : 'bg-white bg-opacity-50'
                        }`}>
                          {getAlertTypeLabel(alert.type)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {alert.competitor_name}
                        </span>
                        {!alert.is_read && (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <p className={`font-medium ${alert.is_read ? 'text-gray-600' : 'text-gray-800'}`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(alert.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!alert.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="标记已读"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-4">💡 告警类型说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">💰</span>
              <span className="font-semibold">价格下降</span>
            </div>
            <p className="text-sm text-blue-100">
              当监控的产品价格下降时触发，帮您抓住最佳购买时机
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">📈</span>
              <span className="font-semibold">价格上涨</span>
            </div>
            <p className="text-sm text-blue-100">
              当监控的产品价格上涨时提醒，让您了解市场动态
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">📦</span>
              <span className="font-semibold">库存变化</span>
            </div>
            <p className="text-sm text-blue-100">
              当产品库存状态变化时通知，缺货商品到货及时提醒
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🆕</span>
              <span className="font-semibold">新品上线</span>
            </div>
            <p className="text-sm text-blue-100">
              竞品平台推出新产品时第一时间通知
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🎉</span>
              <span className="font-semibold">促销活动</span>
            </div>
            <p className="text-sm text-blue-100">
              发现竞品平台的促销活动和优惠信息
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alerts;
