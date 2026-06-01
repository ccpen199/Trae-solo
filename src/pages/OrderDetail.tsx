import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Clock, DollarSign, MapPin, Battery, Activity, AlertTriangle, Car, CreditCard } from 'lucide-react';
import { setCurrentPage, getCurrentOrder, getUser, setCurrentOrder } from '../lib/appState';
import api from '../lib/api';
import dayjs from 'dayjs';

export default function OrderDetail() {
  const [currentOrder, setCurrentOrderState] = useState<any>(getCurrentOrder());
  const user = getUser();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const handleOrderChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCurrentOrderState(customEvent.detail);
    };
    window.addEventListener('orderchange', handleOrderChange);
    return () => window.removeEventListener('orderchange', handleOrderChange);
  }, []);

  useEffect(() => {
    if (currentOrder) {
      loadOrderDetail();
    }
  }, [currentOrder]);

  const loadOrderDetail = async () => {
    if (!currentOrder) return;
    setLoading(true);
    try {
      const data = await api.charging.orderDetail(currentOrder.id);
      setOrder(data.order);
      setCurrentOrder(data.order);
      setCurrentOrderState(data.order);
    } catch (err) {
      console.error('Load order detail failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;
    if (!confirm(`确定要支付 ¥${order.total_amount} 吗？`)) return;
    
    setPaying(true);
    try {
      await api.charging.pay(order.id, 'balance');
      alert('支付成功');
      loadOrderDetail();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaying(false);
    }
  };

  const getStatusInfo = (o: any) => {
    const isPaid = o.payment_status === 'paid';
    const isCharging = o.charging_status === 'charging';
    const isCompleted = o.charging_status === 'completed';

    if (isCharging) {
      return { label: '充电中', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
    }
    if (isCompleted && !isPaid) {
      return { label: '待支付', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' };
    }
    if (isCompleted && isPaid) {
      return { label: '已完成', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
    }
    if (o.charging_status === 'fault') {
      return { label: '异常停止', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
    }
    if (o.charging_status === 'stopped') {
      return { label: '已停止', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };
    }
    return { label: o.charging_status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };
  };

  const powerCurve = order?.power_curve ? JSON.parse(order.power_curve) : [];
  const maxPower = Math.max(...powerCurve.map((p: any) => p.power || 0), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setCurrentPage('orders')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="font-bold text-gray-800 text-lg">订单详情</h1>
          </div>
        </div>
        <div className="text-center py-20">
          <p className="text-gray-500">订单不存在</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order);
  const duration = order.end_time 
    ? dayjs(order.end_time).diff(dayjs(order.start_time), 'minute')
    : dayjs().diff(dayjs(order.start_time), 'minute');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">订单详情</h1>
            <p className="text-sm text-gray-500">{order.order_no}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 text-white mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg">{order.station_name}</div>
                <div className="text-green-100 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {order.station_address}
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20`}>
              {statusInfo.label}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold">{order.total_kwh}</div>
              <div className="text-green-100 text-xs">kWh</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{order.avg_power}</div>
              <div className="text-green-100 text-xs">kW 平均</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">¥{order.total_amount}</div>
              <div className="text-green-100 text-xs">总费用</div>
            </div>
          </div>
        </div>

        {order.stop_reason && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-800">停止原因</div>
              <div className="text-yellow-700 text-sm">{order.stop_reason}</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            充电信息
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-gray-500 text-sm mb-1">充电枪</div>
              <div className="font-bold text-gray-800">{order.gun_no} 号枪</div>
              <div className="text-xs text-gray-400">{order.connector_type}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-gray-500 text-sm mb-1">车辆信息</div>
              <div className="font-bold text-gray-800">{order.vehicle_info || '未填写'}</div>
              <div className="text-xs text-gray-400">车牌/VIN</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-gray-500 text-sm mb-1">开始时间</div>
              <div className="font-bold text-gray-800">{dayjs(order.start_time).format('MM-DD HH:mm')}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-gray-500 text-sm mb-1">结束时间</div>
              <div className="font-bold text-gray-800">{order.end_time ? dayjs(order.end_time).format('MM-DD HH:mm') : '进行中'}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-gray-500 text-sm mb-1">充电时长</div>
              <div className="font-bold text-gray-800">{Math.floor(duration / 60)}小时{duration % 60}分钟</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-gray-500 text-sm mb-1">起始SOC</div>
              <div className="font-bold text-gray-800">{order.start_soc}% → {order.end_soc || '--'}%</div>
            </div>
          </div>
        </div>

        {powerCurve.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Battery className="w-5 h-5 text-green-600" />
              功率曲线
            </h3>
            <div className="h-40 flex items-end gap-1 mb-2">
              {powerCurve.map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-green-500 to-green-300 rounded-t transition-all"
                  style={{ height: `${((p.power || 0) / maxPower) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>开始</span>
              <span>1/4</span>
              <span>1/2</span>
              <span>3/4</span>
              <span>结束</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            费用明细
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">峰时电量 ({order.peak_kwh || 0} kWh)</span>
              <span className="font-medium text-gray-800">¥{order.peak_amount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">平时电量 ({order.flat_kwh || 0} kWh)</span>
              <span className="font-medium text-gray-800">¥{order.flat_amount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">谷时电量 ({order.valley_kwh || 0} kWh)</span>
              <span className="font-medium text-gray-800">¥{order.valley_amount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">服务费 ({order.total_kwh} kWh)</span>
              <span className="font-medium text-gray-800">¥{order.service_amount || 0}</span>
            </div>
            {order.parking_amount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">停车费</span>
                <span className="font-medium text-gray-800">¥{order.parking_amount}</span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-800">合计</span>
              <span className="font-bold text-xl text-red-500">¥{order.total_amount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            支付信息
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">支付状态</span>
              <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.payment_status === 'paid' ? '已支付' : '待支付'}
              </span>
            </div>
            {order.payment_status === 'paid' && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">支付方式</span>
                  <span className="font-medium text-gray-800">{order.payment_method || '余额支付'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">支付时间</span>
                  <span className="font-medium text-gray-800">{order.paid_at ? dayjs(order.paid_at).format('MM-DD HH:mm:ss') : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">交易流水号</span>
                  <span className="font-medium text-gray-800 font-mono text-sm">{order.transaction_id || '-'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {order.charging_status !== 'charging' && order.payment_status !== 'paid' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">待支付金额</div>
              <div className="text-2xl font-bold text-red-500">¥{order.total_amount}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentPage('orders')}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                返回
              </button>
              <button
                onClick={handlePay}
                disabled={paying}
                className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {paying ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    支付中
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    立即支付
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
