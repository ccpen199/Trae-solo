import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deviceApi, orderApi, reservationApi, adminApi } from '../../api';
import type { Device, Package } from '../../types';

const typeMeta: Record<string, { label: string; icon: string }> = {
  washer: { label: '洗衣机', icon: '🧺' },
  water_dispenser: { label: '饮水机', icon: '💧' },
  shower: { label: '淋浴终端', icon: '🚿' }
};

const statusText: Record<string, string> = {
  idle: '空闲', running: '使用中', fault: '故障', reserved: '已预约', offline: '离线'
};

const statusColor: Record<string, string> = {
  idle: 'bg-green-50 text-green-600',
  running: 'bg-blue-50 text-blue-600',
  fault: 'bg-red-50 text-red-600',
  reserved: 'bg-orange-50 text-orange-600',
  offline: 'bg-gray-100 text-gray-500'
};

const DeviceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [tab, setTab] = useState<'use' | 'reserve'>('use');
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [reserveDate, setReserveDate] = useState('');
  const [reserveTime, setReserveTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [devRes, pkgRes] = await Promise.all([
        deviceApi.getDetail(id),
        adminApi.getPackages().catch(() => [] as Package[])
      ]);
      setDevice(devRes);
      const filteredPkgs = (pkgRes as Package[]).filter(p => !p.deviceType || p.deviceType === devRes.type);
      if (filteredPkgs.length === 0) {
        const defaultPkgs: Package[] = [
          { id: 'pkg_30', name: '标准套餐', deviceType: devRes.type, totalMinutes: 30, price: devRes.pricing, description: '标准时长 30 分钟' },
          { id: 'pkg_60', name: '加长套餐', deviceType: devRes.type, totalMinutes: 60, price: Math.round(devRes.pricing * 1.8), description: '加长时长 60 分钟' },
          { id: 'pkg_15', name: '快速套餐', deviceType: devRes.type, totalMinutes: 15, price: Math.round(devRes.pricing * 0.6), description: '快速时长 15 分钟' }
        ];
        setPackages(defaultPkgs);
        setSelectedPackage(defaultPkgs[0].id);
      } else {
        setPackages(filteredPkgs);
        setSelectedPackage(filteredPkgs[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 6; h <= 22; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  }, []);

  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleCreateOrder = async () => {
    if (!device || !selectedPackage) return;
    if (device.status !== 'idle') {
      alert(`设备当前状态为「${statusText[device.status]}」，无法启动使用`);
      return;
    }
    if (!device.isOnline) {
      alert('设备当前离线，无法启动使用');
      return;
    }
    const pkg = packages.find(p => p.id === selectedPackage);
    if (!pkg) return;
    setActionLoading(true);
    try {
      const order = await orderApi.createOrder({
        deviceId: device.id,
        packageId: selectedPackage,
        type: device.type,
        duration: pkg.totalMinutes
      });
      setPendingOrder({ ...order, _amount: pkg.price, _duration: pkg.totalMinutes });
      setShowPayModal(true);
    } catch (e) {
      console.error(e);
      alert('创建订单失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async (method: string) => {
    if (!pendingOrder) return;
    setActionLoading(true);
    try {
      const order = await orderApi.payOrder(pendingOrder.id, { payMethod: method });
      alert(`支付成功！即将启动设备（${method === 'wechat' ? '微信' : method === 'alipay' ? '支付宝' : '余额'}支付 ¥${pendingOrder._amount}）`);
      setShowPayModal(false);
      try {
        await orderApi.startDevice(order.id);
        alert('设备启动成功！祝您使用愉快');
      } catch (e) {
        console.error(e);
        alert('设备启动指令已发送，请稍等');
      }
      navigate('/orders');
    } catch (e) {
      console.error(e);
      alert('支付失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!device || !id) return;
    if (!reserveDate || !reserveTime) {
      alert('请选择预约日期和时间');
      return;
    }
    const now = new Date();
    const start = new Date(`${reserveDate}T${reserveTime}:00`);
    if (start.getTime() <= now.getTime()) {
      alert('预约时间必须晚于当前时间');
      return;
    }
    setActionLoading(true);
    try {
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const startTime = start.toISOString();
      const endTime = end.toISOString();
      const amount = Math.round(device.pricing);
      await reservationApi.create({ deviceId: id, startTime, endTime, amount });
      alert(`预约成功！\n时间：${reserveDate} ${reserveTime} - 30分钟\n费用：¥${amount}`);
      navigate('/orders');
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || '预约失败，请稍后重试';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-400">加载中...</div>;
  }
  if (!device) {
    return (
      <div className="p-4 text-center">
        <div className="text-5xl mb-3">❓</div>
        <p className="text-gray-400 mb-4">设备不存在</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary-500 text-white rounded-xl">返回</button>
      </div>
    );
  }

  const meta = typeMeta[device.type] || { label: device.type, icon: '📱' };
  const canUse = device.status === 'idle' && device.isOnline;
  const selectedPkg = packages.find(p => p.id === selectedPackage);

  return (
    <div className="pb-6">
      <div className="relative h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xl"
        >
          ←
        </button>
        <span className="text-7xl">{meta.icon}</span>
      </div>

      <div className="p-4 -mt-6">
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <h2 className="text-xl font-bold text-gray-800">{device.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{meta.label}</p>
              <p className="text-sm text-gray-400 mt-0.5 truncate">📍 {device.location}</p>
              <p className="text-sm text-primary-600 mt-1 font-medium">¥{device.pricing}/30分钟</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[device.status]}`}>
                {statusText[device.status]}
              </span>
              <span className={`text-xs ${device.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                {device.isOnline ? '● 在线' : '○ 离线'}
              </span>
            </div>
          </div>
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
                {packages.map((pkg) => (
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
                      <p className="text-xs text-gray-400 mt-0.5">时长 {pkg.totalMinutes} 分钟</p>
                    </div>
                    <p className="text-lg font-bold text-primary-600">¥{pkg.price}</p>
                  </label>
                ))}
              </div>

              {!canUse && (
                <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-700">
                    {device.status !== 'idle' && `⚠️ 设备当前状态为「${statusText[device.status]}」`}
                    {!device.isOnline && '⚠️ 设备当前离线'}，暂无法启动使用
                  </p>
                </div>
              )}

              <button
                onClick={handleCreateOrder}
                disabled={!canUse || actionLoading || !selectedPackage}
                className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/30"
              >
                {actionLoading ? '处理中...' : canUse ? '扫码启动设备' : '设备暂不可用'}
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
                    min={minDate}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">选择时段（30 分钟/段）</label>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {timeSlots.map(t => (
                      <button
                        key={t}
                        onClick={() => setReserveTime(t)}
                        className={`py-2 rounded-lg text-sm ${
                          reserveTime === t
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {!reserveTime && <p className="text-xs text-gray-400 mt-2">请点击上方选择时段</p>}
                </div>
                {reserveDate && reserveTime && (
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-700">
                      📅 {reserveDate} {reserveTime} 起，使用 30 分钟<br />
                      💰 预计费用：¥{device.pricing}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleReserve}
                disabled={actionLoading || !reserveDate || !reserveTime}
                className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/30"
              >
                {actionLoading ? '处理中...' : '确认预约'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showPayModal && pendingOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => !actionLoading && setShowPayModal(false)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">确认支付</h3>
            <p className="text-4xl font-bold text-center text-primary-600 my-6">¥{pendingOrder._amount}</p>
            <p className="text-sm text-gray-500 text-center mb-6">
              {meta.label}使用 {pendingOrder._duration} 分钟
            </p>
            <div className="space-y-3 mb-6">
              {[
                { method: 'wechat', label: '微信支付', icon: '💚', desc: '推荐使用' },
                { method: 'alipay', label: '支付宝', icon: '💙', desc: '' },
                { method: 'balance', label: '余额支付', icon: '💰', desc: '从账户余额扣款' }
              ].map(m => (
                <button
                  key={m.method}
                  onClick={() => handlePay(m.method)}
                  disabled={actionLoading}
                  className="w-full flex items-center p-4 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50 disabled:opacity-50 transition-all"
                >
                  <span className="text-2xl mr-4">{m.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">{m.label}</p>
                    {m.desc && <p className="text-xs text-gray-400">{m.desc}</p>}
                  </div>
                  <span className="text-primary-500">›</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => !actionLoading && setShowPayModal(false)}
              disabled={actionLoading}
              className="w-full py-3 text-gray-500 rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              {actionLoading ? '处理中...' : '取消'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetailPage;
