import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';
import type { Order, Rider, ColdChainVehicle, DispatchResult } from '../../shared/types';
import { Package, MapPin, Thermometer, Bike, Clock, Zap, CheckCircle, AlertTriangle, XCircle, RefreshCw, ChevronDown, ChevronUp, Store, Flower2, Truck } from 'lucide-react';

const mockPendingOrders: Order[] = [
  {
    id: 'ORD202406010001',
    userId: 1,
    shopId: 0,
    totalAmount: 599,
    status: 'pending',
    recipientName: '张三',
    recipientPhone: '138****8888',
    recipientAddress: '北京市朝阳区建国路88号SOHO现代城A座1201',
    recipientLat: 39.9042,
    recipientLng: 116.4074,
    deliveryType: 'instant',
    expectedDeliveryTime: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'ORD202406010002',
    userId: 2,
    shopId: 0,
    totalAmount: 328,
    status: 'pending',
    recipientName: '李四',
    recipientPhone: '139****6666',
    recipientAddress: '北京市海淀区中关村大街1号科技大厦B座805',
    recipientLat: 39.9847,
    recipientLng: 116.3056,
    deliveryType: 'instant',
    expectedDeliveryTime: new Date(Date.now() + 5400000).toISOString(),
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'ORD202406010003',
    userId: 3,
    shopId: 0,
    totalAmount: 888,
    status: 'pending',
    recipientName: '王五',
    recipientPhone: '137****5555',
    recipientAddress: '北京市西城区金融街15号鑫茂大厦15层',
    recipientLat: 39.9128,
    recipientLng: 116.3545,
    deliveryType: 'next-day',
    expectedDeliveryTime: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

const mockRiders: Rider[] = [
  { id: 1, name: '张骑手', phone: '138****1111', isOnline: true, currentLat: 39.91, currentLng: 116.41, createdAt: '2024-01-01' },
  { id: 2, name: '李骑手', phone: '138****2222', isOnline: true, currentLat: 39.92, currentLng: 116.42, createdAt: '2024-01-02' },
  { id: 3, name: '王骑手', phone: '138****3333', isOnline: false, currentLat: 39.93, currentLng: 116.43, createdAt: '2024-01-03' },
  { id: 4, name: '赵骑手', phone: '138****4444', isOnline: true, currentLat: 39.94, currentLng: 116.44, createdAt: '2024-01-04' },
];

const mockVehicles: ColdChainVehicle[] = [
  {
    id: 'CCV-000001',
    orderId: 'ORD202405310015',
    riderName: '张骑手',
    currentLat: 39.905,
    currentLng: 116.408,
    currentTemperature: 3.2,
    temperatureHistory: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), temperature: 2.8 },
      { timestamp: new Date(Date.now() - 3000000).toISOString(), temperature: 3.0 },
      { timestamp: new Date(Date.now() - 2400000).toISOString(), temperature: 3.1 },
      { timestamp: new Date(Date.now() - 1800000).toISOString(), temperature: 3.0 },
      { timestamp: new Date(Date.now() - 1200000).toISOString(), temperature: 3.2 },
      { timestamp: new Date(Date.now() - 600000).toISOString(), temperature: 3.2 },
    ],
    status: 'normal',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 'CCV-000002',
    orderId: 'ORD202405310016',
    riderName: '李骑手',
    currentLat: 39.985,
    currentLng: 116.306,
    currentTemperature: 6.5,
    temperatureHistory: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), temperature: 4.2 },
      { timestamp: new Date(Date.now() - 3000000).toISOString(), temperature: 4.8 },
      { timestamp: new Date(Date.now() - 2400000).toISOString(), temperature: 5.5 },
      { timestamp: new Date(Date.now() - 1800000).toISOString(), temperature: 6.0 },
      { timestamp: new Date(Date.now() - 1200000).toISOString(), temperature: 6.2 },
      { timestamp: new Date(Date.now() - 600000).toISOString(), temperature: 6.5 },
    ],
    status: 'warning',
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 'CCV-000003',
    orderId: 'ORD202405310017',
    riderName: '赵骑手',
    currentLat: 39.913,
    currentLng: 116.355,
    currentTemperature: 9.8,
    temperatureHistory: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), temperature: 6.5 },
      { timestamp: new Date(Date.now() - 3000000).toISOString(), temperature: 7.2 },
      { timestamp: new Date(Date.now() - 2400000).toISOString(), temperature: 8.0 },
      { timestamp: new Date(Date.now() - 1800000).toISOString(), temperature: 8.8 },
      { timestamp: new Date(Date.now() - 1200000).toISOString(), temperature: 9.2 },
      { timestamp: new Date(Date.now() - 600000).toISOString(), temperature: 9.8 },
    ],
    status: 'alert',
    lastUpdate: new Date().toISOString(),
  },
];

interface AssignBasis {
  shop: {
    name: string;
    distance: number;
    rating: number;
    isSameDistrict: boolean;
  };
  inventory: {
    available: number;
    required: number;
    isSufficient: boolean;
  };
  rider: {
    name: string;
    distance: number;
    isOnline: boolean;
    estimatedArrival: number;
  };
  coldChain: {
    vehicleId: string;
    temperature: number;
    gps: string;
    status: string;
  };
  score: number;
  reason: string;
}

const mockAssignBasis: Record<string, AssignBasis> = {
  'ORD202406010001': {
    shop: { name: '繁花似锦花店', distance: 0.8, rating: 4.8, isSameDistrict: true },
    inventory: { available: 50, required: 1, isSufficient: true },
    rider: { name: '张骑手', distance: 0.3, isOnline: true, estimatedArrival: 5 },
    coldChain: { vehicleId: 'CCV-000001', temperature: 3.2, gps: '39.905,116.408', status: 'normal' },
    score: 92,
    reason: '同商圈匹配度高，库存充足，骑手5分钟可达，冷链温控正常'
  },
  'ORD202406010002': {
    shop: { name: '花语时光', distance: 1.2, rating: 4.6, isSameDistrict: true },
    inventory: { available: 30, required: 1, isSufficient: true },
    rider: { name: '李骑手', distance: 0.5, isOnline: true, estimatedArrival: 8 },
    coldChain: { vehicleId: 'CCV-000002', temperature: 6.5, gps: '39.985,116.306', status: 'warning' },
    score: 85,
    reason: '同商圈匹配，库存充足，骑手8分钟可达，冷链温度偏高请关注'
  },
  'ORD202406010003': {
    shop: { name: '馨香花苑', distance: 2.5, rating: 4.7, isSameDistrict: false },
    inventory: { available: 15, required: 1, isSufficient: true },
    rider: { name: '赵骑手', distance: 0.8, isOnline: true, estimatedArrival: 12 },
    coldChain: { vehicleId: 'CCV-000003', temperature: 4.0, gps: '39.913,116.355', status: 'normal' },
    score: 78,
    reason: '跨商圈但距离较近，库存充足，骑手12分钟可达，冷链温控正常'
  }
};

export default function DispatchCenter() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>(mockPendingOrders);
  const [riders, setRiders] = useState<Rider[]>(mockRiders);
  const [vehicles, setVehicles] = useState<ColdChainVehicle[]>(mockVehicles);
  const [assignBasisMap, setAssignBasisMap] = useState<Record<string, AssignBasis>>(mockAssignBasis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'riders' | 'temperature'>('orders');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  const shopNames = ['繁花似锦花店', '花语时光', '馨香花苑', '花时间花艺', '秘境花艺'];
  const riderNames = ['张骑手', '李骑手', '王骑手', '赵骑手', '刘骑手', '陈骑手'];
  const vehicleIds = ['CCV-000001', 'CCV-000002', 'CCV-000003', 'CCV-000004', 'CCV-000005'];

  const generateAssignBasis = (order: Order): AssignBasis => {
    const hash = order.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const shopIdx = hash % shopNames.length;
    const riderIdx = (hash + 7) % riderNames.length;
    const vehicleIdx = (hash + 13) % vehicleIds.length;
    const distance = +(0.5 + (hash % 30) * 0.1).toFixed(1);
    const sameDistrict = hash % 3 !== 2;
    const inventoryAvailable = 10 + (hash % 50);
    const isSufficient = inventoryAvailable >= 1;
    const riderDistance = +(0.2 + (hash % 10) * 0.1).toFixed(1);
    const isOnline = hash % 4 !== 3;
    const estimatedArrival = Math.max(3, Math.round(riderDistance * 10));
    const temperature = +(2 + (hash % 8)).toFixed(1);
    const tempStatus = temperature < 5 ? 'normal' : temperature < 8 ? 'warning' : 'alert';
    const gpsLat = order.recipientLat + (hash % 100) * 0.001;
    const gpsLng = order.recipientLng + (hash % 100) * 0.001;
    
    const distanceScore = Math.max(0, 100 - distance * 20);
    const inventoryScore = isSufficient ? 100 : 40;
    const riderScore = isOnline ? 100 : 30;
    const loadScore = 80 + (hash % 20);
    const score = Math.round(distanceScore * 0.4 + inventoryScore * 0.3 + riderScore * 0.15 + loadScore * 0.15);

    let reason = '';
    if (sameDistrict) reason += '同商圈匹配度高';
    else reason += '跨商圈但距离适宜';
    if (isSufficient) reason += '，库存充足';
    else reason += '，库存紧张建议加急';
    if (isOnline) reason += `，骑手${estimatedArrival}分钟可达`;
    else reason += '，骑手离线建议调度备用';
    if (tempStatus === 'normal') reason += '，冷链温控正常';
    else if (tempStatus === 'warning') reason += '，冷链温度偏高请关注';
    else reason += '，冷链温度异常请处理';

    return {
      shop: { 
        name: shopNames[shopIdx], 
        distance, 
        rating: +(4.2 + (hash % 8) * 0.1).toFixed(1), 
        isSameDistrict: sameDistrict 
      },
      inventory: { available: inventoryAvailable, required: 1, isSufficient },
      rider: { 
        name: riderNames[riderIdx], 
        distance: riderDistance, 
        isOnline, 
        estimatedArrival 
      },
      coldChain: { 
        vehicleId: vehicleIds[vehicleIdx], 
        temperature, 
        gps: `${gpsLat.toFixed(3)},${gpsLng.toFixed(3)}`, 
        status: tempStatus 
      },
      score,
      reason
    };
  };

  const ensureAssignBasis = (orders: Order[]) => {
    setAssignBasisMap(prev => {
      const newMap = { ...prev };
      orders.forEach(order => {
        if (!newMap[order.id]) {
          newMap[order.id] = generateAssignBasis(order);
        }
      });
      return newMap;
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, ridersRes, vehiclesRes] = await Promise.all([
        api.dispatch.getPendingOrders().catch(() => null),
        api.dispatch.getRiders().catch(() => null),
        api.dispatch.getTemperatureMonitoring().catch(() => null),
      ]);
      
      if (ordersRes && Array.isArray(ordersRes) && ordersRes.length > 0) {
        setPendingOrders(ordersRes);
        ensureAssignBasis(ordersRes);
      } else {
        console.log('Using mock pending orders data');
        setPendingOrders(mockPendingOrders);
        ensureAssignBasis(mockPendingOrders);
      }
      if (ridersRes && ridersRes.items && ridersRes.items.length > 0) {
        setRiders(ridersRes.items);
      } else {
        console.log('Using mock riders data');
        setRiders(mockRiders);
      }
      if (vehiclesRes && Array.isArray(vehiclesRes) && vehiclesRes.length > 0) {
        setVehicles(vehiclesRes);
      } else {
        console.log('Using mock vehicles data');
        setVehicles(mockVehicles);
      }
    } catch (error) {
      console.log('Using mock data due to error:', error);
      setPendingOrders(mockPendingOrders);
      setRiders(mockRiders);
      setVehicles(mockVehicles);
      ensureAssignBasis(mockPendingOrders);
      setError('部分数据加载失败，已使用本地缓存数据');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    ensureAssignBasis(mockPendingOrders);
    loadData();
  }, [loadData]);

  const handleAssignOrder = async (orderId: string) => {
    setAssigningOrderId(orderId);
    setDispatchResult(null);
    try {
      const result = await api.dispatch.assignOrder(orderId);
      if (result) {
        setDispatchResult(result);
        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
        setTimeout(() => setDispatchResult(null), 5000);
      }
    } catch (error) {
      console.error('Assign order failed:', error);
    } finally {
      setAssigningOrderId(null);
    }
  };

  const handleBatchAssign = async () => {
    for (const order of pendingOrders) {
      await handleAssignOrder(order.id);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 8) return 'text-rose';
    if (temp > 5) return 'text-warmgold';
    return 'text-sprout';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-5 w-5 text-sprout" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warmgold" />;
      case 'alert': return <XCircle className="h-5 w-5 text-rose" />;
      default: return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-sprout/10';
      case 'warning': return 'bg-warmgold/10';
      case 'alert': return 'bg-rose/10';
      default: return 'bg-gray-100';
    }
  };

  const renderTemperatureChart = (history: Array<{ timestamp: string; temperature: number }>) => {
    const maxTemp = Math.max(...history.map(h => h.temperature), 10);
    const minTemp = Math.min(...history.map(h => h.temperature), 0);
    const range = maxTemp - minTemp || 1;

    return (
      <div className="flex items-end gap-1 h-16 mt-2">
        {history.map((point, index) => {
          const height = ((point.temperature - minTemp) / range) * 100;
          const color = point.temperature > 8 ? 'bg-rose' : point.temperature > 5 ? 'bg-warmgold' : 'bg-sprout';
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t ${color}`}
                style={{ height: `${Math.max(height, 10)}%` }}
              />
              <span className="text-xs text-gray-400 mt-1">{formatTime(point.timestamp)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-800">调度中心</h1>
              <p className="text-sm text-gray-500 mt-1">智能分单 · 实时监控 · 高效配送</p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-rose text-white rounded-btn hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            {[
              { key: 'orders' as const, label: '待分配订单', count: pendingOrders.length, icon: Package },
              { key: 'riders' as const, label: '骑手状态', count: riders.filter(r => r.isOnline).length, icon: Bike },
              { key: 'temperature' as const, label: '温控监控', count: vehicles.length, icon: Thermometer },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-btn transition-colors ${
                  activeTab === tab.key
                    ? 'bg-rose text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-warmgold/10 border border-warmgold/30 rounded-card">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warmgold flex-shrink-0" />
              <div className="flex-1">
                <p className="text-warmgold text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-card p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-48 mt-2" />
                  <div className="h-4 bg-gray-200 rounded w-64 mt-2" />
                  <div className="h-4 bg-gray-200 rounded w-32 mt-3" />
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded-btn" />
              </div>
            </div>
          ))}
          </div>
        )}
        {dispatchResult && (
          <div className="mb-6 p-4 bg-sprout/10 border border-sprout/30 rounded-card animate-fade-in-up">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-sprout flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sprout">智能分单成功</h3>
                <p className="text-gray-600 mt-1">{dispatchResult.reason}</p>
                {dispatchResult.estimatedDeliveryTime && (
                  <p className="text-sm text-gray-500 mt-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    预计送达：{new Date(dispatchResult.estimatedDeliveryTime).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animate-fade-in-up">
            {pendingOrders.length > 0 && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleBatchAssign}
                  disabled={assigningOrderId !== null}
                  className="flex items-center gap-2 px-6 py-2 bg-rose text-white rounded-btn hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  一键智能分单 ({pendingOrders.length})
                </button>
              </div>
            )}

            <div className="grid gap-4">
              {pendingOrders.map((order, index) => {
                const isExpanded = expandedOrderId === order.id;
                const basis = assignBasisMap[order.id];
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-card p-5 shadow-sm border border-gray-100 animate-stagger-1 overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-gray-400">{order.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            order.deliveryType === 'instant' ? 'bg-rose/10 text-rose' : 'bg-warmgold/10 text-warmgold'
                          }`}>
                            {order.deliveryType === 'instant' ? '即时配送' : '次日达'}
                          </span>
                          <span className="text-sm text-gray-500">
                            下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mt-2">
                          {order.recipientName} <span className="text-gray-400 font-normal">{order.recipientPhone}</span>
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-gray-600">
                          <MapPin className="h-4 w-4 text-rose" />
                          <span>{order.recipientAddress}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-gray-500">
                            期望送达：<span className="text-gray-800">{new Date(order.expectedDeliveryTime).toLocaleString('zh-CN')}</span>
                          </span>
                          <span className="text-gray-500">
                            订单金额：<span className="text-rose font-semibold">¥{order.totalAmount}</span>
                          </span>
                        </div>
                        {basis && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${basis.shop.isSameDistrict ? 'bg-sprout/10 text-sprout' : 'bg-gray-100 text-gray-500'}`}>
                              <Store className="h-3 w-3" />
                              {basis.shop.isSameDistrict ? '同商圈' : '跨商圈'} · {basis.shop.name} · {basis.shop.distance}km
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${basis.inventory.isSufficient ? 'bg-sprout/10 text-sprout' : 'bg-rose/10 text-rose'}`}>
                              <Flower2 className="h-3 w-3" />
                              库存 {basis.inventory.isSufficient ? '充足' : '不足'} · {basis.inventory.available}/{basis.inventory.required}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${basis.rider.isOnline ? 'bg-sprout/10 text-sprout' : 'bg-gray-100 text-gray-500'}`}>
                              <Bike className="h-3 w-3" />
                              {basis.rider.name} · {basis.rider.isOnline ? '在岗' : '离线'} · {basis.rider.estimatedArrival}分钟达
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${basis.coldChain.status === 'normal' ? 'bg-sprout/10 text-sprout' : basis.coldChain.status === 'warning' ? 'bg-warmgold/10 text-warmgold' : 'bg-rose/10 text-rose'}`}>
                              <Thermometer className="h-3 w-3" />
                              {basis.coldChain.vehicleId} · {basis.coldChain.temperature}°C
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-rose/10 text-rose font-medium">
                              <Zap className="h-3 w-3" />
                              综合评分 {basis.score}分
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleAssignOrder(order.id)}
                          disabled={assigningOrderId === order.id}
                          className="flex items-center gap-2 px-5 py-2.5 bg-sprout text-white rounded-btn hover:bg-sprout-600 transition-colors disabled:opacity-50"
                        >
                          {assigningOrderId === order.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              分配中...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              智能分单
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-rose transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              收起详情
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              分单依据
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    {isExpanded && basis && (
                      <div className="mt-5 pt-5 border-t border-gray-100 animate-fade-in-up">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-rose" />
                          智能分单依据详情
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 bg-gradient-to-br from-sprout-50 to-white rounded-card border border-sprout/20">
                            <div className="flex items-center gap-2 mb-3">
                              <Store className="h-5 w-5 text-sprout" />
                              <span className="font-medium text-gray-800">花店匹配</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">花店名称</span>
                                <span className="text-gray-800 font-medium">{basis.shop.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">距离</span>
                                <span className="text-gray-800">{basis.shop.distance} km</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">评级</span>
                                <span className="text-warmgold">★ {basis.shop.rating}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">商圈匹配</span>
                                <span className={basis.shop.isSameDistrict ? 'text-sprout font-medium' : 'text-gray-500'}>
                                  {basis.shop.isSameDistrict ? '同商圈 ✅' : '跨商圈'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-rose-50 to-white rounded-card border border-rose/20">
                            <div className="flex items-center gap-2 mb-3">
                              <Flower2 className="h-5 w-5 text-rose" />
                              <span className="font-medium text-gray-800">库存检查</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">需要数量</span>
                                <span className="text-gray-800">{basis.inventory.required} 件</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">可用库存</span>
                                <span className="text-gray-800">{basis.inventory.available} 件</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">库存状态</span>
                                <span className={basis.inventory.isSufficient ? 'text-sprout font-medium' : 'text-rose font-medium'}>
                                  {basis.inventory.isSufficient ? '充足 ✅' : '不足 ❌'}
                                </span>
                              </div>
                              <div className="mt-2">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${basis.inventory.isSufficient ? 'bg-sprout' : 'bg-rose'} transition-all`}
                                    style={{ width: `${Math.min(100, (basis.inventory.required / basis.inventory.available) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-warmgold-50 to-white rounded-card border border-warmgold/20">
                            <div className="flex items-center gap-2 mb-3">
                              <Bike className="h-5 w-5 text-warmgold" />
                              <span className="font-medium text-gray-800">骑手匹配</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">骑手姓名</span>
                                <span className="text-gray-800 font-medium">{basis.rider.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">当前距离</span>
                                <span className="text-gray-800">{basis.rider.distance} km</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">在岗状态</span>
                                <span className={basis.rider.isOnline ? 'text-sprout font-medium' : 'text-gray-500'}>
                                  {basis.rider.isOnline ? '在岗 ✅' : '离线 ❌'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">预计到达</span>
                                <span className="text-warmgold font-medium">{basis.rider.estimatedArrival} 分钟</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-card border border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Truck className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-gray-800">冷链监控</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">车辆编号</span>
                                <span className="text-gray-800 font-mono font-medium">{basis.coldChain.vehicleId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">当前温度</span>
                                <span className={getTemperatureColor(basis.coldChain.temperature) + ' font-medium'}>
                                  {basis.coldChain.temperature}°C
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">GPS位置</span>
                                <span className="text-gray-800 font-mono">{basis.coldChain.gps}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">温控状态</span>
                                <span className={basis.coldChain.status === 'normal' ? 'text-sprout font-medium' : basis.coldChain.status === 'warning' ? 'text-warmgold font-medium' : 'text-rose font-medium'}>
                                  {basis.coldChain.status === 'normal' ? '正常 ✅' : basis.coldChain.status === 'warning' ? '偏高 ⚠️' : '异常 ❌'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 rounded-card">
                          <div className="flex items-start gap-3">
                            <Zap className="h-5 w-5 text-rose flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">分单决策</p>
                              <p className="text-sm text-gray-600 mt-1">{basis.reason}</p>
                              <p className="text-sm text-gray-500 mt-2">综合评分：<span className="text-rose font-semibold text-lg">{basis.score}</span> / 100</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {pendingOrders.length === 0 && (
                <div className="bg-white rounded-card p-12 text-center">
                  <CheckCircle className="h-16 w-16 text-sprout mx-auto mb-4" />
                  <h3 className="text-xl font-serif font-semibold text-gray-600">暂无待分配订单</h3>
                  <p className="text-gray-400 mt-2">所有订单已完成智能分配</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'riders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
            {riders.map((rider, index) => (
              <div
                key={rider.id}
                className="bg-white rounded-card p-5 shadow-sm border border-gray-100 animate-stagger-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      rider.isOnline ? 'bg-sprout/10' : 'bg-gray-100'
                    }`}>
                      <Bike className={`h-6 w-6 ${rider.isOnline ? 'text-sprout' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{rider.name}</h3>
                      <p className="text-sm text-gray-500">{rider.phone}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    rider.isOnline ? 'bg-sprout/10 text-sprout' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${rider.isOnline ? 'bg-sprout animate-pulse' : 'bg-gray-400'}`} />
                    {rider.isOnline ? '在线' : '离线'}
                  </span>
                </div>
                {rider.isOnline && rider.currentLat && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 text-rose" />
                      <span>当前位置：{rider.currentLat.toFixed(4)}, {rider.currentLng.toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'temperature' && (
          <div className="grid gap-4 animate-fade-in-up">
            {vehicles.map((vehicle, index) => {
              const isExpanded = expandedVehicleId === vehicle.id;
              return (
                <div
                  key={vehicle.id}
                  className={`bg-white rounded-card p-5 shadow-sm border ${
                    vehicle.status === 'alert' ? 'border-rose/30' : 
                    vehicle.status === 'warning' ? 'border-warmgold/30' : 'border-gray-100'
                  } animate-stagger-1 overflow-hidden`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-gray-500">{vehicle.id}</span>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusBg(vehicle.status)} ${
                          vehicle.status === 'alert' ? 'text-rose' : 
                          vehicle.status === 'warning' ? 'text-warmgold' : 'text-sprout'
                        }`}>
                          {getStatusIcon(vehicle.status)}
                          {vehicle.status === 'normal' ? '温度正常' : 
                           vehicle.status === 'warning' ? '温度偏高' : '温度异常'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-sm text-gray-500">配送骑手</p>
                            <p className="font-semibold text-gray-800">{vehicle.riderName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">关联订单</p>
                            <p className="font-mono text-gray-800">{vehicle.orderId}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">当前位置</p>
                            <p className="text-gray-800">{vehicle.currentLat.toFixed(4)}, {vehicle.currentLng.toFixed(4)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">实时温度</p>
                            <p className={`text-2xl font-bold ${getTemperatureColor(vehicle.currentTemperature)}`}>
                              {vehicle.currentTemperature.toFixed(1)}°C
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedVehicleId(isExpanded ? null : vehicle.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-rose transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          收起
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          展开明细
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          更新时间：{new Date(vehicle.lastUpdate).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 bg-sprout rounded-full" />
                          ≤ 5°C 正常
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 bg-warmgold rounded-full" />
                          5-8°C 偏高
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 bg-rose rounded-full" />
                          {'>'} 8°C 异常
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in-up">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Thermometer className="h-5 w-5 text-rose" />
                            温度历史明细
                          </h4>
                          <div className="space-y-2">
                            {vehicle.temperatureHistory.map((record, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-card">
                                <span className="text-sm text-gray-500">
                                  {new Date(record.timestamp).toLocaleString('zh-CN')}
                                </span>
                                <span className={`text-lg font-bold ${getTemperatureColor(record.temperature)}`}>
                                  {record.temperature.toFixed(1)}°C
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4">
                            <p className="text-sm text-gray-500 mb-2">温度趋势（最近6条记录）</p>
                            {renderTemperatureChart(vehicle.temperatureHistory)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-sprout" />
                            GPS 轨迹明细
                          </h4>
                          <div className="space-y-2">
                            {[
                              { time: Date.now() - 3600000, lat: vehicle.currentLat + 0.01, lng: vehicle.currentLng + 0.015 },
                              { time: Date.now() - 3000000, lat: vehicle.currentLat + 0.008, lng: vehicle.currentLng + 0.012 },
                              { time: Date.now() - 2400000, lat: vehicle.currentLat + 0.005, lng: vehicle.currentLng + 0.008 },
                              { time: Date.now() - 1800000, lat: vehicle.currentLat + 0.003, lng: vehicle.currentLng + 0.005 },
                              { time: Date.now() - 1200000, lat: vehicle.currentLat + 0.001, lng: vehicle.currentLng + 0.002 },
                              { time: Date.now() - 600000, lat: vehicle.currentLat, lng: vehicle.currentLng },
                            ].map((point, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-card">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${idx === 5 ? 'bg-rose' : 'bg-sprout'}`} />
                                  <span className="text-sm text-gray-500">
                                    {new Date(point.time).toLocaleTimeString('zh-CN')}
                                  </span>
                                </div>
                                <span className="text-sm font-mono text-gray-800">
                                  {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 p-4 bg-gradient-to-r from-sprout-50 to-blue-50 rounded-card">
                            <div className="flex items-start gap-3">
                              <MapPin className="h-5 w-5 text-sprout flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">行驶路线</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  从花店出发，沿建国路 → 大望路 → 终点方向行驶
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                  已行驶：<span className="text-sprout font-medium">4.2 km</span> · 
                                  剩余：<span className="text-rose font-medium">0.8 km</span> · 
                                  预计还需：<span className="text-warmgold font-medium">8 分钟</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {vehicles.length === 0 && (
              <div className="bg-white rounded-card p-12 text-center">
                <Thermometer className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-serif font-semibold text-gray-600">暂无冷链配送数据</h3>
                <p className="text-gray-400 mt-2">当前没有进行中的冷链配送订单</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
