import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Filter, Package, Truck, AlertTriangle, Gift, MessageSquare } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { notificationApi } from '../../lib/api';
import type { Notification } from '../../lib/api';

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications((res.data as Notification[]) || []);
    } catch (error) {
      setNotifications([
        { id: '1', type: 'package', title: '包裹已到达', message: '您的快递 SF1234567890 已存入 A栋一楼柜 A01 格', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
        { id: '2', type: 'shipping', title: '快递已寄出', message: '您的寄件订单已被快递员揽收，正在运输中', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', type: 'alert', title: '设备告警', message: 'D栋三楼柜 设备离线，请及时处理', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '4', type: 'coupon', title: '优惠券到账', message: '您获得了一张满50减10元洗衣优惠券', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '5', type: 'system', title: '系统通知', message: '智能柜系统将于今晚23:00-01:00进行维护', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: '6', type: 'package', title: '取件提醒', message: '您的包裹已存放超过24小时，请尽快取件', read: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
    } catch (error) {
    }
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
    } catch (error) {
    }
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'package': return <Package className="w-5 h-5 text-sky-600" />;
      case 'shipping': return <Truck className="w-5 h-5 text-emerald-600" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'coupon': return <Gift className="w-5 h-5 text-rose-600" />;
      default: return <MessageSquare className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'package': return 'bg-sky-100';
      case 'shipping': return 'bg-emerald-100';
      case 'alert': return 'bg-amber-100';
      case 'coupon': return 'bg-rose-100';
      default: return 'bg-slate-100';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (filterRead === 'unread' && n.read) return false;
    if (filterRead === 'read' && !n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-sky-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">通知中心</h1>
              <p className="text-slate-500">查看所有系统通知和消息</p>
            </div>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} 条未读
              </span>
            )}
          </div>
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4" />
            全部已读
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">类型筛选:</span>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'package', label: '包裹' },
                  { value: 'shipping', label: '快递' },
                  { value: 'alert', label: '告警' },
                  { value: 'coupon', label: '优惠券' },
                  { value: 'system', label: '系统' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilterType(option.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filterType === option.value
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-600">状态:</span>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'unread', label: '未读' },
                  { value: 'read', label: '已读' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilterRead(option.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filterRead === option.value
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {loading ? (
              <div className="p-8 text-center text-slate-500">加载中...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">暂无通知</div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors ${
                    !notification.read ? 'bg-sky-50' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg ${getTypeBgColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-medium ${!notification.read ? 'text-slate-800' : 'text-slate-600'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {new Date(notification.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{notification.message}</p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-1.5 text-sky-600 hover:bg-sky-100 rounded-lg transition-colors"
                      title="标记已读"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
