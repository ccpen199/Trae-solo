import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Package,
  Thermometer,
  Droplets,
  Calendar,
  AlertTriangle,
  Plus,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  Flower2,
} from 'lucide-react';
import Header from '@/components/Header';
import { api } from '@/utils/api';
import type { Inventory, Wastage, Product } from '../../shared/types';

const SHOP_ID = 1;

const mockProducts: Product[] = [
  {
    id: 1,
    shopId: 1,
    name: '浪漫红玫瑰花束',
    category: 'flower',
    price: 299,
    originalPrice: 399,
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&h=100&fit=crop',
    description: '精选99朵厄瓜多尔进口红玫瑰',
    festival: ['情人节', '纪念日'],
    scene: ['告白', '求婚'],
    shelfLifeHours: 48,
    deliveryRadius: 8,
    stock: 50,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    shopId: 1,
    name: '粉色康乃馨花束',
    category: 'flower',
    price: 199,
    originalPrice: 259,
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=100&h=100&fit=crop',
    description: '33朵粉色康乃馨，送给最爱的妈妈',
    festival: ['母亲节', '生日'],
    scene: ['探望', '感谢'],
    shelfLifeHours: 72,
    deliveryRadius: 6,
    stock: 80,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 7,
    shopId: 1,
    name: '蓝色妖姬花束',
    category: 'flower',
    price: 388,
    originalPrice: 488,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop',
    description: '19朵蓝色妖姬，神秘而高贵',
    festival: ['情人节', '纪念日'],
    scene: ['告白', '纪念日'],
    shelfLifeHours: 48,
    deliveryRadius: 6,
    stock: 25,
    createdAt: '2024-01-15T10:00:00Z',
  },
];

const mockInventory: Inventory[] = [
  {
    id: 1,
    shopId: 1,
    productId: 1,
    batchNo: 'BATCH-0001-202606',
    quantity: 50,
    temperature: 3.5,
    humidity: 72,
    inboundTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    shopId: 1,
    productId: 2,
    batchNo: 'BATCH-0002-202606',
    quantity: 35,
    temperature: 4.2,
    humidity: 68,
    inboundTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    shopId: 1,
    productId: 7,
    batchNo: 'BATCH-0007-202606',
    quantity: 12,
    temperature: 2.8,
    humidity: 75,
    inboundTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    shopId: 1,
    productId: 1,
    batchNo: 'BATCH-0001-202606-02',
    quantity: 30,
    temperature: 3.8,
    humidity: 70,
    inboundTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockWastage: Wastage[] = [
  {
    id: 1,
    shopId: 1,
    productId: 1,
    productName: '浪漫红玫瑰花束',
    batchNo: 'BATCH-0001-202606',
    quantity: 3,
    reason: '花头萎蔫，新鲜度不足',
    recordedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    shopId: 1,
    productId: 2,
    productName: '粉色康乃馨花束',
    batchNo: 'BATCH-0002-202606',
    quantity: 1,
    reason: '包装破损，无法销售',
    recordedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

const wastageReasons = [
  '花材新鲜度不足',
  '花头萎蔫',
  '包装破损',
  '过期损耗',
  '制作损耗',
  '其他原因',
];

export default function ShopInventory() {
  const [inventory, setInventory] = useState<Inventory[]>(mockInventory);
  const [wastageList, setWastageList] = useState<Wastage[]>(mockWastage);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'wastage'>('inventory');
  const [showWastageForm, setShowWastageForm] = useState(false);
  const [wastageForm, setWastageForm] = useState({
    productId: 0,
    batchNo: '',
    quantity: 1,
    reason: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, wastageRes] = await Promise.all([
        api.inventory.list(SHOP_ID, { pageSize: 50 }),
        api.inventory.getWastageList(SHOP_ID, { pageSize: 50 }),
      ]);
      if (invRes && invRes.items && invRes.items.length > 0) {
        setInventory(invRes.items);
      }
      if (wastageRes && wastageRes.items && wastageRes.items.length > 0) {
        setWastageList(wastageRes.items);
      }
    } catch (error) {
      console.log('Using mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: number) => {
    const product = mockProducts.find((p) => p.id === productId);
    return product?.name || `商品 #${productId}`;
  };

  const getProductImage = (productId: number) => {
    const product = mockProducts.find((p) => p.id === productId);
    return product?.image || '';
  };

  const getAvailableBatches = (productId: number) => {
    return inventory.filter((i) => i.productId === productId && i.quantity > 0);
  };

  const getExpiryStatus = (expiryTime: string) => {
    const now = Date.now();
    const expiry = new Date(expiryTime).getTime();
    const diffHours = (expiry - now) / (1000 * 60 * 60);

    if (diffHours <= 0) return { label: '已过期', color: 'bg-rose-100 text-rose' };
    if (diffHours <= 24) return { label: '即将过期', color: 'bg-warmgold-100 text-warmgold' };
    if (diffHours <= 48) return { label: '临期', color: 'bg-warmgold-50 text-warmgold' };
    return { label: '正常', color: 'bg-sprout-100 text-sprout' };
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!wastageForm.productId) errors.productId = '请选择商品';
    if (!wastageForm.batchNo) errors.batchNo = '请选择批次';
    if (!wastageForm.quantity || wastageForm.quantity <= 0) errors.quantity = '请输入有效的数量';
    if (!wastageForm.reason) errors.reason = '请选择损耗原因';

    const selectedBatch = inventory.find((i) => i.batchNo === wastageForm.batchNo);
    if (selectedBatch && wastageForm.quantity > selectedBatch.quantity) {
      errors.quantity = `数量不能超过当前库存 ${selectedBatch.quantity}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitWastage = async () => {
    if (!validateForm()) return;

    try {
      const result = await api.inventory.recordWastage({
        shopId: SHOP_ID,
        productId: wastageForm.productId,
        batchNo: wastageForm.batchNo,
        quantity: wastageForm.quantity,
        reason: wastageForm.reason,
      });

      if (result) {
        setWastageList((prev) => [result, ...prev]);
        setInventory((prev) =>
          prev.map((i) =>
            i.batchNo === wastageForm.batchNo
              ? { ...i, quantity: i.quantity - wastageForm.quantity }
              : i
          )
        );
      }
    } catch (error) {
      console.log('Failed to record wastage, updating locally:', error);
      const newWastage: Wastage = {
        id: Date.now(),
        shopId: SHOP_ID,
        productId: wastageForm.productId,
        productName: getProductName(wastageForm.productId),
        batchNo: wastageForm.batchNo,
        quantity: wastageForm.quantity,
        reason: wastageForm.reason,
        recordedAt: new Date().toISOString(),
      };
      setWastageList((prev) => [newWastage, ...prev]);
      setInventory((prev) =>
        prev.map((i) =>
          i.batchNo === wastageForm.batchNo
            ? { ...i, quantity: i.quantity - wastageForm.quantity }
            : i
        )
      );
    }

    setShowWastageForm(false);
    setWastageForm({ productId: 0, batchNo: '', quantity: 1, reason: '' });
    setFormErrors({});
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDaysDiff = (dateString: string) => {
    const diff = new Date(dateString).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-r from-sprout to-sprout-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-btn transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-serif font-bold">库存管理</h1>
                <p className="text-sm text-white/80">繁花似锦花店</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-btn transition-colors text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              <Link
                to="/shop"
                className="px-4 py-2 text-sm text-sprout bg-white hover:bg-white/90 rounded-btn transition-colors"
              >
                返回工作台
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/20 rounded-card p-4 animate-stagger-1">
              <Package className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{inventory.length}</div>
              <div className="text-xs opacity-80">在库批次</div>
            </div>
            <div className="bg-white/20 rounded-card p-4 animate-stagger-2">
              <Flower2 className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">
                {inventory.reduce((sum, i) => sum + i.quantity, 0)}
              </div>
              <div className="text-xs opacity-80">总库存量</div>
            </div>
            <div className="bg-warmgold/30 rounded-card p-4 animate-stagger-3">
              <AlertTriangle className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">
                {inventory.filter((i) => getDaysDiff(i.expiryTime) <= 1).length}
              </div>
              <div className="text-xs opacity-80">临期批次</div>
            </div>
            <div className="bg-rose/30 rounded-card p-4 animate-stagger-4">
              <AlertTriangle className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{wastageList.length}</div>
              <div className="text-xs opacity-80">损耗记录</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 rounded-btn font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-sprout text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                花材批次
              </span>
            </button>
            <button
              onClick={() => setActiveTab('wastage')}
              className={`px-6 py-3 rounded-btn font-medium transition-colors ${
                activeTab === 'wastage'
                  ? 'bg-sprout text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                损耗记录
              </span>
            </button>
          </div>
          <button
            onClick={() => setShowWastageForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-rose text-white rounded-btn font-medium hover:bg-rose-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            登记损耗
          </button>
        </div>

        {showWastageForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif font-bold text-gray-800">登记花材损耗</h3>
                  <button
                    onClick={() => {
                      setShowWastageForm(false);
                      setFormErrors({});
                    }}
                    className="p-2 hover:bg-gray-100 rounded-btn transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择商品 <span className="text-rose">*</span>
                  </label>
                  <select
                    value={wastageForm.productId}
                    onChange={(e) => {
                      setWastageForm((prev) => ({
                        ...prev,
                        productId: parseInt(e.target.value),
                        batchNo: '',
                      }));
                    }}
                    className={`w-full px-4 py-3 border rounded-btn transition-colors focus:outline-none focus:ring-2 focus:ring-sprout/20 ${
                      formErrors.productId ? 'border-rose' : 'border-gray-200'
                    }`}
                  >
                    <option value={0}>请选择商品</option>
                    {mockProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.productId && (
                    <p className="text-rose text-sm mt-1">{formErrors.productId}</p>
                  )}
                </div>

                {wastageForm.productId > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择批次 <span className="text-rose">*</span>
                    </label>
                    <select
                      value={wastageForm.batchNo}
                      onChange={(e) =>
                        setWastageForm((prev) => ({ ...prev, batchNo: e.target.value }))
                      }
                      className={`w-full px-4 py-3 border rounded-btn transition-colors focus:outline-none focus:ring-2 focus:ring-sprout/20 ${
                        formErrors.batchNo ? 'border-rose' : 'border-gray-200'
                      }`}
                    >
                      <option value="">请选择批次</option>
                      {getAvailableBatches(wastageForm.productId).map((inv) => (
                        <option key={inv.id} value={inv.batchNo}>
                          {inv.batchNo} (库存: {inv.quantity})
                        </option>
                      ))}
                    </select>
                    {formErrors.batchNo && (
                      <p className="text-rose text-sm mt-1">{formErrors.batchNo}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    损耗数量 <span className="text-rose">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={wastageForm.quantity}
                    onChange={(e) =>
                      setWastageForm((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-btn transition-colors focus:outline-none focus:ring-2 focus:ring-sprout/20 ${
                      formErrors.quantity ? 'border-rose' : 'border-gray-200'
                    }`}
                    placeholder="请输入损耗数量"
                  />
                  {formErrors.quantity && (
                    <p className="text-rose text-sm mt-1">{formErrors.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    损耗原因 <span className="text-rose">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {wastageReasons.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setWastageForm((prev) => ({ ...prev, reason }))}
                        className={`px-4 py-2 text-sm rounded-btn transition-colors ${
                          wastageForm.reason === reason
                            ? 'bg-rose text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  {formErrors.reason && (
                    <p className="text-rose text-sm mt-1">{formErrors.reason}</p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowWastageForm(false);
                    setFormErrors({});
                  }}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-btn font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitWastage}
                  className="flex-1 px-6 py-3 bg-rose text-white rounded-btn font-medium hover:bg-rose-600 transition-colors"
                >
                  确认登记
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-sprout border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : activeTab === 'inventory' ? (
          inventory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((item, index) => {
                const expiryStatus = getExpiryStatus(item.expiryTime);
                const daysLeft = getDaysDiff(item.expiryTime);
                const staggerClass = `animate-stagger-${Math.min((index % 5) + 1, 5)}`;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-card shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 ${staggerClass}`}
                  >
                    <div className="p-4 border-b border-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(item.productId)}
                            alt={getProductName(item.productId)}
                            className="w-14 h-14 object-cover rounded-btn"
                          />
                          <div>
                            <h3 className="font-medium text-gray-800 truncate max-w-[180px]">
                              {getProductName(item.productId)}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono">{item.batchNo}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-btn ${expiryStatus.color}`}>
                          {expiryStatus.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="h-4 w-4 text-sprout" />
                          <span>当前库存</span>
                        </div>
                        <span className="font-semibold text-gray-800">{item.quantity} 扎</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Thermometer className="h-4 w-4 text-rose" />
                          <span>温度</span>
                        </div>
                        <span className="font-medium text-gray-800">{item.temperature.toFixed(1)}°C</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Droplets className="h-4 w-4 text-sprout" />
                          <span>湿度</span>
                        </div>
                        <span className="font-medium text-gray-800">{item.humidity.toFixed(0)}%</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-warmgold" />
                          <span>入库时间</span>
                        </div>
                        <span className="text-sm text-gray-800">{formatDate(item.inboundTime)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <AlertTriangle
                            className={`h-4 w-4 ${daysLeft <= 1 ? 'text-rose' : 'text-warmgold'}`}
                          />
                          <span>过期时间</span>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            daysLeft <= 1 ? 'text-rose' : 'text-gray-800'
                          }`}
                        >
                          {formatDate(item.expiryTime)}
                          <span className="text-xs ml-1">({daysLeft > 0 ? `${daysLeft}天后` : '已过期'})</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-card shadow-sm border border-gray-100 animate-fade-in-up">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-semibold text-gray-600 mb-2">
                暂无库存记录
              </h3>
              <p className="text-gray-400">还没有入库的花材批次</p>
            </div>
          )
        ) : wastageList.length > 0 ? (
          <div className="space-y-3">
            {wastageList.map((item, index) => {
              const staggerClass = `animate-stagger-${Math.min((index % 5) + 1, 5)}`;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-card shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-300 ${staggerClass}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-100 rounded-card flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-rose" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-800 truncate">
                          {item.productName || `商品 #${item.productId}`}
                        </h4>
                        <span className="text-rose font-semibold">-{item.quantity} 扎</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="font-mono text-xs">{item.batchNo}</span>
                        <span>{formatDateTime(item.recordedAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{item.reason}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-card shadow-sm border border-gray-100 animate-fade-in-up">
            <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-semibold text-gray-600 mb-2">
              暂无损耗记录
            </h3>
            <p className="text-gray-400">还没有登记过花材损耗</p>
          </div>
        )}
      </main>
    </div>
  );
}
