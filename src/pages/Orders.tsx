import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Clock, DollarSign, MapPin, ChevronRight, Search, Filter } from 'lucide-react';
import { setCurrentPage, setSelectedStation, setSelectedGun, setCurrentOrder } from '../lib/appState';
import api from '../lib/api';
import dayjs from 'dayjs';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPageNum] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadOrders();
  }, [status, page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (status) params.status = status;
      const data = await api.charging.orders(params);
      setOrders(data.orders);
      setTotal(data.total);
    } catch (err) {
      console.error('Load orders failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (order: any) => {
    const isPaid = order.payment_status === 'paid';
    const isCharging = order.charging_status === 'charging';
    const isCompleted = order.charging_status === 'completed';

    if (isCharging) {
      return { label: '充电中', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
    }
    if (isCompleted && !isPaid) {
      return { label: '待支付', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' };
    }
    if (isCompleted && isPaid) {
      return { label: '已完成', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
    }
    if (order.charging_status === 'fault') {
      return { label: '异常停止', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
    }
    return { label: order.charging_status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };
  };

  const handleOrderClick = (order: any) => {
    setCurrentOrder(order);
    setSelectedStation({ id: order.station_id, name: order.station_name, address: order.station_address });
    setSelectedGun({ id: order.gun_id, gun_no: order.gun_no, connector_type: order.connector_type });
    
    if (order.charging_status === 'charging') {
      setCurrentPage('charging');
    } else {
      setCurrentPage('order-detail');
    }
  };

  const filteredOrders = orders.filter(o =>
    o.order_no.includes(searchText) ||
    o.station_name.includes(searchText)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('home')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-800 text-lg">充电订单</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索订单号或站点名称..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-300 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPageNum(1);
              }}
              className="px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-300 outline-none"
            >
              <option value="">全部状态</option>
              <option value="charging">充电中</option>
              <option value="completed">已完成</option>
              <option value="fault">异常</option>
            </select>
            <button
              onClick={loadOrders}
              className="px-4 py-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order);
              return (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                        <span className="font-bold text-gray-800">{order.station_name}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {order.station_address}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {order.gun_no}号枪
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {dayjs(order.created_at).format('MM-DD HH:mm')}
                    </span>
                    <span className="font-mono text-xs text-gray-400">{order.order_no}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex gap-6">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">充电量</div>
                        <div className="font-bold text-gray-800">{order.total_kwh} kWh</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">平均功率</div>
                        <div className="font-bold text-gray-800">{order.avg_power} kW</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">费用</div>
                      <div className={`font-bold text-lg ${order.payment_status === 'paid' ? 'text-gray-800' : 'text-red-500'}`}>
                        ¥{order.total_amount}
                        {order.payment_status !== 'paid' && <span className="text-xs ml-1">待支付</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">暂无订单记录</p>
            <button
              onClick={() => setCurrentPage('home')}
              className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              去充电
            </button>
          </div>
        )}

        {total > pageSize && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPageNum(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-gray-500">
              {page} / {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPageNum(p => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
