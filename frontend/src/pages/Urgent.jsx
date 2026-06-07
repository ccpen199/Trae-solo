import { useState, useEffect, useCallback } from 'react';
import { urgentAPI } from '../services/api';

const URGENCY_OPTIONS = [
  { key: 'immediate', label: '即时配送', time: '20分钟', fee: 38, desc: '¥38/首5kg' },
  { key: 'urgent', label: '快速配送', time: '40分钟', fee: 28, desc: '¥28/首5kg' },
  { key: 'normal', label: '普通配送', time: '60分钟', fee: 18, desc: '¥18/首5kg' },
];

const STATUS_STEPS = [
  { key: 'pending', label: '订单已创建', desc: '等待骑手接单' },
  { key: 'assigned', label: '骑手已接单', desc: '骑手正在前往取件' },
  { key: 'picking_up', label: '取件中', desc: '骑手已到达取件点' },
  { key: 'in_transit', label: '配送中', desc: '物品正在配送' },
  { key: 'delivered', label: '已送达', desc: '物品已签收' },
];

const STATUS_LABELS = {
  pending: '待接单',
  assigned: '已接单',
  picking_up: '取件中',
  in_transit: '配送中',
  delivered: '已送达',
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  picking_up: 'bg-orange-100 text-orange-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
};

function Urgent() {
  const [step, setStep] = useState(1);
  const [couriers, setCouriers] = useState([]);
  const [orderResult, setOrderResult] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couriersLoading, setCouriersLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingStatus, setTrackingStatus] = useState('pending');
  const [countdown, setCountdown] = useState(null);
  const [selectedCourierId, setSelectedCourierId] = useState(null);

  const [formData, setFormData] = useState({
    sender_name: '',
    sender_phone: '13800138000',
    sender_address: '北京朝阳区建国路88号',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '朝阳CBD国贸写字楼',
    item_type: '文件',
    weight: 1,
    urgency: 'normal',
  });

  const updateForm = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    loadCouriers();
  }, []);

  useEffect(() => {
    estimateFee();
  }, [formData.urgency, formData.weight]);

  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (step !== 3 || !orderResult) return;
    const flow = STATUS_STEPS.map(s => s.key);
    const idx = flow.indexOf(trackingStatus);
    if (idx >= flow.length - 1) return;
    const timer = setTimeout(() => {
      setTrackingStatus(flow[idx + 1]);
    }, 4000 + Math.random() * 6000);
    return () => clearTimeout(timer);
  }, [step, trackingStatus, orderResult]);

  const loadCouriers = async () => {
    try {
      setCouriersLoading(true);
      const data = await urgentAPI.getAvailableCouriers();
      setCouriers(Array.isArray(data) ? data : []);
    } catch {
      setError('加载骑手列表失败');
    } finally {
      setCouriersLoading(false);
    }
  };

  const estimateFee = async () => {
    try {
      const data = await urgentAPI.estimateFee({ weight: formData.weight, urgency: formData.urgency });
      setFeeData(data);
    } catch {
      setFeeData(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.sender_address || !formData.receiver_address || !formData.sender_phone) {
      setError('请填写完整的取件和收件信息');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const order = await urgentAPI.createOrder({
        sender_name: formData.sender_name,
        sender_phone: formData.sender_phone,
        sender_address: formData.sender_address,
        receiver_name: formData.receiver_name,
        receiver_phone: formData.receiver_phone,
        receiver_address: formData.receiver_address,
        item_type: formData.item_type,
        weight: formData.weight,
        urgency: formData.urgency,
      });
      setOrderResult(order);
      setTrackingStatus('pending');
      setStep(2);
      const slaMinutes = order.sla_minutes || (formData.urgency === 'immediate' ? 20 : formData.urgency === 'urgent' ? 40 : 60);
      setCountdown(slaMinutes * 60);
    } catch {
      setError('创建订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourier = async (courier) => {
    setSelectedCourierId(courier.id);
    setError('');
    try {
      await urgentAPI.dispatchCourier(orderResult.id || orderResult.order_no, courier.id);
      setOrderResult(prev => ({
        ...prev,
        courier_id: courier.id,
        courier_name: courier.name,
        status: 'assigned',
      }));
      setTrackingStatus('assigned');
      setStep(3);
    } catch {
      setError('调度骑手失败，请重试');
      setSelectedCourierId(null);
    }
  };

  const formatTime = (seconds) => {
    if (seconds == null || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentFee = URGENCY_OPTIONS.find(o => o.key === formData.urgency);

  const renderStepIndicator = () => {
    if (!orderResult) return null;
    const flow = STATUS_STEPS.map(s => s.key);
    const currentIdx = flow.indexOf(trackingStatus);

    return (
      <div className="space-y-0">
        {STATUS_STEPS.map((item, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;
          return (
            <div key={item.key} className="flex items-start">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : idx + 1}
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={`w-0.5 h-10 ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="ml-4 pb-6">
                <div className={`font-medium ${isCurrent ? 'text-blue-600' : isFuture ? 'text-gray-400' : 'text-gray-700'}`}>
                  {item.label}
                </div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">同城急送</h1>
        {step > 1 && (
          <button
            onClick={() => { setStep(1); setOrderResult(null); setTrackingStatus('pending'); setCountdown(null); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            重新下单
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-8">

            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">创建急送订单</h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">配送时效</label>
                  <div className="grid grid-cols-3 gap-4">
                    {URGENCY_OPTIONS.map(opt => (
                      <div
                        key={opt.key}
                        onClick={() => updateForm('urgency', opt.key)}
                        className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-all ${
                          formData.urgency === opt.key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl font-bold text-blue-600 mb-1">{opt.time}</div>
                        <div className="text-sm text-gray-600">{opt.label}</div>
                        <div className="mt-2 text-lg font-bold text-orange-600">{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="font-bold mb-4">取件信息</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">寄件人</label>
                          <input
                            type="text"
                            value={formData.sender_name}
                            onChange={e => updateForm('sender_name', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="寄件人姓名"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
                          <input
                            type="tel"
                            value={formData.sender_phone}
                            onChange={e => updateForm('sender_phone', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="寄件人电话"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">取件地址</label>
                        <input
                          type="text"
                          value={formData.sender_address}
                          onChange={e => updateForm('sender_address', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="请输入详细取件地址"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="font-bold mb-4">收件信息</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">收件人</label>
                          <input
                            type="text"
                            value={formData.receiver_name}
                            onChange={e => updateForm('receiver_name', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="收件人姓名"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
                          <input
                            type="tel"
                            value={formData.receiver_phone}
                            onChange={e => updateForm('receiver_phone', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="收件人电话"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">收件地址</label>
                        <input
                          type="text"
                          value={formData.receiver_address}
                          onChange={e => updateForm('receiver_address', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="请输入详细收件地址"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">物品类型</label>
                      <select
                        value={formData.item_type}
                        onChange={e => updateForm('item_type', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="文件">文件</option>
                        <option value="食品">食品</option>
                        <option value="电子产品">电子产品</option>
                        <option value="鲜花">鲜花</option>
                        <option value="药品">药品</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">重量(kg)</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formData.weight}
                        onChange={e => updateForm('weight', parseFloat(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-yellow-800">费用预估</span>
                      <span className="text-2xl font-bold text-yellow-700">
                        ¥{feeData?.total ?? currentFee?.fee ?? 18}
                      </span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      {feeData
                        ? `基础费¥${feeData.base_fee} + 超重费¥${((formData.weight - 5) * (feeData.per_kg || 0)).toFixed(1)}`
                        : `${currentFee?.desc}，超5kg另计`}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-orange-500 text-white py-4 rounded-lg hover:bg-orange-600 transition-colors font-bold text-lg disabled:opacity-50"
                  >
                    {loading ? '创建中...' : '立即下单'}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && orderResult && (
              <div>
                <h2 className="text-2xl font-bold mb-6">订单已创建</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">订单号：</span>
                      <span className="font-mono font-bold">{orderResult.order_no || orderResult.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">SLA：</span>
                      <span className="font-bold text-red-600">{orderResult.sla_minutes || 20}分钟响应</span>
                    </div>
                    <div>
                      <span className="text-gray-500">取件：</span>
                      {orderResult.sender_address || formData.sender_address}
                    </div>
                    <div>
                      <span className="text-gray-500">收件：</span>
                      {orderResult.receiver_address || formData.receiver_address}
                    </div>
                    <div>
                      <span className="text-gray-500">费用：</span>
                      <span className="font-bold text-orange-600">¥{orderResult.fee || feeData?.total || currentFee?.fee}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">紧急度：</span>
                      <span className="font-medium">{URGENCY_OPTIONS.find(o => o.key === (orderResult.urgency || formData.urgency))?.label}</span>
                    </div>
                  </div>
                </div>

                {countdown !== null && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-red-600 font-medium">SLA倒计时</span>
                      <span className={`text-2xl font-bold font-mono ${countdown < 300 ? 'text-red-600' : 'text-orange-500'}`}>
                        {formatTime(countdown)}
                      </span>
                    </div>
                  </div>
                )}

                <h3 className="font-bold mb-4">选择配送骑手</h3>
                <p className="text-gray-500 text-sm mb-4">从附近可用骑手中选择，系统将自动调度</p>

                {couriersLoading ? (
                  <div className="text-center py-8 text-gray-400">加载骑手中...</div>
                ) : couriers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">暂无可用骑手</div>
                ) : (
                  <div className="space-y-3">
                    {couriers.map(courier => (
                      <div
                        key={courier.id}
                        onClick={() => handleSelectCourier(courier)}
                        className={`border-2 rounded-lg p-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-md ${
                          selectedCourierId === courier.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-bold">{courier.name}</div>
                            <div className="text-sm text-gray-500">{courier.vehicle_type || '电动车'}</div>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs text-yellow-600">⭐ {courier.rating || '4.9'}</span>
                              <span className="text-xs text-gray-400">{courier.distance_km?.toFixed(1) || '1.2'}km</span>
                              <span className="text-xs text-green-600">约{courier.estimated_arrival_min || 8}分钟到达</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">{courier.phone}</div>
                          <div className="text-xs text-green-600 font-medium mt-1">
                            {selectedCourierId === courier.id ? '调度中...' : '选择调度'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { setStep(1); setOrderResult(null); setCountdown(null); }}
                  className="mt-6 w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  取消订单
                </button>
              </div>
            )}

            {step === 3 && orderResult && (
              <div>
                <h2 className="text-2xl font-bold mb-6">订单追踪</h2>

                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500">订单号</div>
                      <div className="font-mono font-bold text-lg">{orderResult.order_no || orderResult.id}</div>
                    </div>
                    <span className={`px-4 py-2 rounded-full font-medium text-sm ${STATUS_COLORS[trackingStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[trackingStatus] || trackingStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500">紧急度</div>
                      <div className="font-bold text-orange-600">
                        {URGENCY_OPTIONS.find(o => o.key === (orderResult.urgency || formData.urgency))?.label}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500">SLA</div>
                      <div className="font-bold text-red-600">{orderResult.sla_minutes || 20}分钟</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500">费用</div>
                      <div className="font-bold text-green-600">¥{orderResult.fee || feeData?.total || currentFee?.fee}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-white rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{orderResult.courier_name || '配送骑手'}</div>
                      <div className="text-sm text-gray-500">骑手ID: {orderResult.courier_id || '-'}</div>
                    </div>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-medium">
                      联系骑手
                    </button>
                  </div>
                </div>

                {countdown !== null && countdown > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
                    <div className="text-sm text-red-600 mb-1">预计送达剩余时间</div>
                    <div className={`text-4xl font-bold font-mono ${countdown < 300 ? 'text-red-600' : 'text-orange-500'}`}>
                      {formatTime(countdown)}
                    </div>
                  </div>
                )}

                {trackingStatus === 'delivered' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <div className="text-xl font-bold text-green-700">配送已完成</div>
                    <div className="text-sm text-green-600 mt-1">物品已签收</div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold mb-4">订单状态</h3>
                  {renderStepIndicator()}
                </div>

                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-bold mb-3 text-sm">订单详情</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">取件地址：</span>
                      {orderResult.sender_address || formData.sender_address}
                    </div>
                    <div>
                      <span className="text-gray-500">收件地址：</span>
                      {orderResult.receiver_address || formData.receiver_address}
                    </div>
                    <div>
                      <span className="text-gray-500">物品类型：</span>
                      {formData.item_type}
                    </div>
                    <div>
                      <span className="text-gray-500">重量：</span>
                      {formData.weight}kg
                    </div>
                    {orderResult.estimated_pickup && (
                      <div>
                        <span className="text-gray-500">预计取件：</span>
                        {orderResult.estimated_pickup}
                      </div>
                    )}
                    {orderResult.estimated_delivery && (
                      <div>
                        <span className="text-gray-500">预计送达：</span>
                        {orderResult.estimated_delivery}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold mb-4">费用预估</h3>
            <div className="space-y-3">
              {URGENCY_OPTIONS.map(opt => (
                <div
                  key={opt.key}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    formData.urgency === opt.key ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.time}SLA</div>
                  </div>
                  <span className="font-bold text-blue-600">{opt.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold mb-4">可用骑手</h3>
            {couriersLoading ? (
              <div className="text-center py-4 text-gray-400 text-sm">加载中...</div>
            ) : couriers.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">暂无可用骑手</div>
            ) : (
              <div className="space-y-3">
                {couriers.map(courier => (
                  <div key={courier.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{courier.name}</div>
                      <div className="text-xs text-gray-500">
                        ⭐{courier.rating || '4.9'} · {courier.distance_km?.toFixed(1) || '1.2'}km · 约{courier.estimated_arrival_min || 8}min
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">空闲</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold mb-4">服务特点</h3>
            <div className="space-y-4">
              {[
                { title: '20分钟响应', desc: '即时配送SLA保障', icon: (
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )},
                { title: '实时位置追踪', desc: '全程可视化配送', icon: (
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                )},
                { title: '安全保障', desc: '物品全程保险', icon: (
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )},
              ].map(item => (
                <div key={item.title} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Urgent;
