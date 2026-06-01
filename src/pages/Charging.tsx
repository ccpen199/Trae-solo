import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Clock, Battery, DollarSign, MapPin, Square, CreditCard, AlertTriangle } from 'lucide-react';
import { setCurrentPage, getCurrentOrder, setCurrentOrder, getSelectedStation, getSelectedGun, getUser } from '../lib/appState';
import api from '../lib/api';
import dayjs from 'dayjs';

export default function Charging() {
  const [currentOrder, setCurrentOrderState] = useState<any>(getCurrentOrder());
  const [selectedStation] = useState<any>(getSelectedStation());
  const [selectedGun] = useState<any>(getSelectedGun());
  const user = getUser();
  const [duration, setDuration] = useState(0);
  const [currentKwh, setCurrentKwh] = useState(0);
  const [currentPower, setCurrentPower] = useState(80);
  const [currentSoc, setCurrentSoc] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOrderChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCurrentOrderState(customEvent.detail);
    };
    window.addEventListener('orderchange', handleOrderChange);
    return () => window.removeEventListener('orderchange', handleOrderChange);
  }, []);

  const updateCurrentOrder = (order: any) => {
    setCurrentOrder(order);
    setCurrentOrderState(order);
  };

  useEffect(() => {
    if (!currentOrder || currentOrder.charging_status !== 'charging') return;

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
      setCurrentKwh(prev => +(prev + currentPower / 60 / 60).toFixed(2));
      setCurrentPower(Math.round(80 + Math.random() * 40));
      setCurrentSoc(prev => Math.min(100, +(prev + 0.1).toFixed(1)));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentOrder, currentPower]);

  const handleStop = async () => {
    if (!currentOrder) return;
    
    if (!confirm('确定要停止充电吗？')) return;
    
    setLoading(true);
    setError('');
    try {
      const result = await api.charging.stop(currentOrder.id, 'user_stop');
      updateCurrentOrder(result.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!currentOrder) return;
    
    setLoading(true);
    setError('');
    try {
      const result = await api.charging.pay(currentOrder.id, 'balance');
      updateCurrentOrder(result.order);
      alert('支付成功！');
      setCurrentPage('orders');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedCost = () => {
    if (!selectedStation) return 0;
    return +(currentKwh * selectedStation.price_per_kwh + currentKwh * 0.5).toFixed(2);
  };

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">没有进行中的订单</p>
          <button
            onClick={() => setCurrentPage('home')}
            className="px-6 py-2 bg-green-500 text-white rounded-xl"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const isCharging = currentOrder.charging_status === 'charging';
  const isCompleted = currentOrder.charging_status === 'completed';
  const isPaid = currentOrder.payment_status === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-lg z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('home')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-white">
              {isCharging ? '充电中' : isCompleted ? (isPaid ? '已完成' : '待支付') : '充电详情'}
            </h1>
            <p className="text-sm text-gray-400">
              {selectedStation?.name} · {selectedGun?.gun_no}号枪
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isCharging && (
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center animate-pulse">
                <div className="w-36 h-36 rounded-full bg-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <Battery className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <div className="text-4xl font-bold text-white">{currentSoc.toFixed(0)}%</div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="text-center mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">充电已完成</h2>
            <p className="text-gray-400">订单号：{currentOrder.order_no}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">充电时长</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {isCharging ? formatDuration(duration) : currentOrder.end_time 
                ? formatDuration(dayjs(currentOrder.end_time).diff(dayjs(currentOrder.start_time), 'second'))
                : '--:--:--'}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm">当前功率</span>
            </div>
            <div className="text-3xl font-bold text-green-400">
              {isCharging ? currentPower : (currentOrder.avg_power || '--')}
              <span className="text-lg text-gray-400 ml-1">kW</span>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Battery className="w-5 h-5" />
              <span className="text-sm">已充电量</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {isCharging ? currentKwh.toFixed(2) : (currentOrder.total_kwh || 0).toFixed(2)}
              <span className="text-lg text-gray-400 ml-1">kWh</span>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">预计费用</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              ¥{isCharging ? estimatedCost().toFixed(2) : (currentOrder.total_amount || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {isCompleted && (
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700 mb-6">
            <h3 className="text-white font-bold mb-4">费用明细</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>充电电量</span>
                <span>{currentOrder.total_kwh} kWh</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>峰时电量</span>
                <span>{currentOrder.peak_kwh} kWh</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>谷时电量</span>
                <span>{currentOrder.valley_kwh} kWh</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between text-gray-300">
                <span>电费</span>
                <span>¥{currentOrder.electricity_fee}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>服务费</span>
                <span>¥{currentOrder.service_fee}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>停车费</span>
                <span>¥{currentOrder.parking_fee}</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between">
                <span className="text-white font-bold text-lg">合计</span>
                <span className="text-yellow-400 font-bold text-xl">¥{currentOrder.total_amount}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-white font-medium">{selectedStation?.name}</div>
              <div className="text-gray-400 text-sm">{selectedStation?.address}</div>
              <div className="text-gray-500 text-sm mt-1">
                {selectedGun?.gun_no}号枪 · {selectedGun?.connector_type} · {selectedGun?.max_power}kW
              </div>
            </div>
          </div>
        </div>

        {user && (
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm">账户余额</div>
                <div className="text-2xl font-bold text-white">¥{user.balance.toFixed(2)}</div>
              </div>
              <button
                onClick={() => setCurrentPage('profile')}
                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm hover:bg-green-500/30 transition-colors"
              >
                充值
              </button>
            </div>
          </div>
        )}

        <div className="sticky bottom-6">
          {isCharging && (
            <button
              onClick={handleStop}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg shadow-red-500/30"
            >
              <Square className="w-5 h-5" />
              {loading ? '停止中...' : '结束充电'}
            </button>
          )}
          {isCompleted && !isPaid && (
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg shadow-green-500/30"
            >
              <CreditCard className="w-5 h-5" />
              {loading ? '支付中...' : `立即支付 ¥${currentOrder.total_amount}`}
            </button>
          )}
          {isCompleted && isPaid && (
            <button
              onClick={() => setCurrentPage('home')}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all text-lg"
            >
              返回首页
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
