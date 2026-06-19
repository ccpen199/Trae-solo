import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deviceApi, orderApi, reservationApi } from '../../api';
import type { Device, DeviceStatus, Package } from '../../types';

const typeLabelMap: Record<string, string> = {
  washing_machine: '洗衣机',
  water_purifier: '饮水机',
  shower: '淋浴终端'
};

const mockPackages: Package[] = [
  { id: '1', name: '标准模式', description: '标准服务 30 分钟', price: 5, durationMinutes: 30, type: 'washing_machine', isActive: true, createdAt: '2024-01-01' },
  { id: '2', name: '加强模式', description: '加强服务 45 分钟', price: 8, durationMinutes: 45, type: 'washing_machine', isActive: true, createdAt: '2024-01-01' },
  { id: '3', name: '快速模式', description: '快速服务 15 分钟', price: 3, durationMinutes: 15, type: 'washing_machine', isActive: true, createdAt: '2024-01-01' }
];

const DeviceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('1');
  const [reserveDate, setReserveDate] = useState('');
  const [reserveTime, setReserveTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'use' | 'reserve'>('use');

  useEffect(() => {
    if (id) {
      loadDeviceData();
    }
  }, [id]);

  const loadDeviceData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [deviceRes, statusRes] = await Promise.all([
        deviceApi.getDetail(id),
        deviceApi.getStatus(id)
      ]);
      setDevice(deviceRes);
      setStatus(statusRes);
    } catch (error) {
      console.error('加载设备详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartUse = async () => {
    if (!id) return;
    try {
      const order = await orderApi.createOrder({
        deviceId: id,
        packageId: selectedPackage
      });
      await orderApi.payOrder(order.id, { paymentMethod: 'balance' });
      await orderApi.startDevice(order.id);
      alert('启动成功！');
      navigate('/orders');
    } catch (error) {
      alert('启动失败，请稍后重试');
    }
  };

  const handleReserve = async () => {
    if (!id || !reserveDate || !reserveTime) {
      alert('请选择预约时间');
      return;
    }
    try {
      const startTime = `${reserveDate}T${reserveTime}:00`;
      const endDate = new Date(startTime);
      endDate.setMinutes(endDate.getMinutes() + 30);
      const endTime = endDate.toISOString().slice(0, 16);
      await reservationApi.create({
        deviceId: id,
        startTime,
        endTime
      });
      alert('预约成功！');
      navigate('/orders');
    } catch (error) {
      alert('预约失败，请稍后重试');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-400">加载中...</div>;
  }

  if (!device) {
    return <div className="p-4 text-center text-gray-400">设备不存在</div>;
  }

  const isAvailable = device.status === 'idle';

  return (
    <div className="pb-6">
      <div className="relative h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          ←
        </button>
        <span className="text-7xl">
          {device.type === 'washing_machine' && '🧺'}
          {device.type === 'water_purifier' && '💧'}
          {device.type === 'shower' && '🚿'}
        </span>
      </div>

      <div className="p-4 -mt-6">
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{device.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{typeLabelMap[device.type] || device.type}</p>
              <p className="text-sm text-gray-400 mt-0.5">📍 {device.location}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isAvailable
                  ? 'bg-green-50 text-green-600'
                  : 'bg-orange-50 text-orange-600'
              }`}
            >
              {isAvailable ? '空闲可用' : '使用中'}
            </span>
          </div>

          {status && status.remainingMinutes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600">
                预计剩余时间：<span className="font-semibold">{status.remainingMinutes} 分钟</span>
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('use')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                tab === 'use'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500'
              }`}
            >
              立即使用
            </button>
            <button
              onClick={() => setTab('reserve')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                tab === 'reserve'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500'
              }`}
            >
              预约使用
            </button>
          </div>

          {tab === 'use' && (
            <div className="p-5">
              <h3 className="font-semibold text-gray-800 mb-3">选择套餐</h3>
              <div className="space-y-2 mb-5">
                {mockPackages.map((pkg) => (
                  <label
                    key={pkg.id}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPackage === pkg.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="package"
                      value={pkg.id}
                      checked={selectedPackage === pkg.id}
                      onChange={(e) => setSelectedPackage(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{pkg.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{pkg.description}</p>
                    </div>
                    <p className="text-lg font-bold text-primary-600">¥{pkg.price}</p>
                  </label>
                ))}
              </div>

              <button
                onClick={handleStartUse}
                disabled={!isAvailable}
                className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/30"
              >
                {isAvailable ? '扫码启动设备' : '设备使用中'}
              </button>
            </div>
          )}

          {tab === 'reserve' && (
            <div className="p-5">
              <h3 className="font-semibold text-gray-800 mb-4">选择预约时间</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">选择日期</label>
                  <input
                    type="date"
                    value={reserveDate}
                    onChange={(e) => setReserveDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">选择时间</label>
                  <input
                    type="time"
                    value={reserveTime}
                    onChange={(e) => setReserveTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400">预约时长默认 30 分钟</p>
              </div>

              <button
                onClick={handleReserve}
                className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30"
              >
                确认预约
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailPage;
