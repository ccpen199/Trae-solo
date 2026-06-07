import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  AlertTriangle,
  Upload,
  X,
  FileImage,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  Plus,
  Package,
  Clock,
  User,
} from 'lucide-react';
import Header from '@/components/Header';
import { api } from '@/utils/api';
import type { DeliveryException, Order } from '../../shared/types';

const SHOP_ID = 1;
const REPORTED_BY = 2;

const exceptionTypes = [
  { key: 'rejected', label: '拒收', color: 'bg-rose-100 text-rose', icon: X },
  { key: 'damaged', label: '损毁', color: 'bg-warmgold-100 text-warmgold', icon: AlertTriangle },
  { key: 'delayed', label: '延误', color: 'bg-blue-100 text-blue', icon: Clock },
];

const mockOrders: Order[] = [
  {
    id: 'ORD202401001',
    userId: 1,
    shopId: 1,
    shopName: '繁花似锦花店',
    totalAmount: 599,
    status: 'delivering',
    recipientName: '张三',
    recipientPhone: '13800138000',
    recipientAddress: '北京市朝阳区建国路88号SOHO现代城A座1201',
    recipientLat: 39.9042,
    recipientLng: 116.4074,
    deliveryType: 'instant',
    expectedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 1,
        orderId: 'ORD202401001',
        productId: 1,
        productName: '浪漫红玫瑰束 99朵',
        productImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&h=100&fit=crop',
        quantity: 1,
        price: 599,
      },
    ],
  },
  {
    id: 'ORD202401003',
    userId: 3,
    shopId: 1,
    shopName: '繁花似锦花店',
    totalAmount: 468,
    status: 'preparing',
    recipientName: '王五',
    recipientPhone: '13700137000',
    recipientAddress: '北京市西城区金融街15号鑫茂大厦8层',
    recipientLat: 39.9142,
    recipientLng: 116.3574,
    deliveryType: 'next-day',
    expectedDeliveryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 3,
        orderId: 'ORD202401003',
        productId: 7,
        productName: '蓝色妖姬花束',
        productImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop',
        quantity: 1,
        price: 468,
      },
    ],
  },
  {
    id: 'ORD202401004',
    userId: 4,
    shopId: 1,
    shopName: '繁花似锦花店',
    totalAmount: 688,
    status: 'delivering',
    recipientName: '赵六',
    recipientPhone: '13600136000',
    recipientAddress: '北京市东城区王府井大街88号银泰中心C座',
    recipientLat: 39.9242,
    recipientLng: 116.4174,
    deliveryType: 'instant',
    expectedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 4,
        orderId: 'ORD202401004',
        productId: 8,
        productName: '婚礼手捧花',
        productImage: 'https://images.unsplash.com/photo-1522684462852-01b24e76b77d?w=100&h=100&fit=crop',
        quantity: 1,
        price: 688,
      },
    ],
  },
];

const mockExceptions: DeliveryException[] = [
  {
    id: 1,
    orderId: 'ORD202401001',
    type: 'damaged',
    description: '花束在运输过程中包装受损，部分花头挤压变形，客户要求退换。',
    evidence:
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APn+iiiv/9k=',
    reportedBy: REPORTED_BY,
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    orderId: 'ORD202401002',
    type: 'rejected',
    description: '客户不在收货地址，电话无人接听，无法完成配送。',
    evidence: undefined,
    reportedBy: REPORTED_BY,
    reportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ShopException() {
  const [exceptions, setExceptions] = useState<DeliveryException[]>(mockExceptions);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({
    orderId: '',
    type: '',
    description: '',
    evidence: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [excRes, orderRes] = await Promise.all([
        api.exceptions.list({ pageSize: 50 }),
        api.orders.listByShop(SHOP_ID, { pageSize: 50 }),
      ]);
      if (excRes && excRes.items && excRes.items.length > 0) {
        setExceptions(excRes.items);
      }
      if (orderRes && orderRes.items && orderRes.items.length > 0) {
        setOrders(orderRes.items);
      }
    } catch (error) {
      console.log('Using mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExceptionTypeConfig = (type: string) => {
    return exceptionTypes.find((t) => t.key === type) || exceptionTypes[0];
  };

  const getOrderInfo = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setExceptionForm((prev) => ({ ...prev, evidence: base64 }));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeEvidence = () => {
    setExceptionForm((prev) => ({ ...prev, evidence: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!exceptionForm.orderId) errors.orderId = '请选择订单';
    if (!exceptionForm.type) errors.type = '请选择异常类型';
    if (!exceptionForm.description.trim()) errors.description = '请输入异常描述';
    if (exceptionForm.description.length < 10)
      errors.description = '描述至少需要10个字符';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitException = async () => {
    if (!validateForm()) return;

    try {
      const result = await api.exceptions.create({
        orderId: exceptionForm.orderId,
        type: exceptionForm.type,
        description: exceptionForm.description,
        evidence: exceptionForm.evidence || undefined,
        reportedBy: REPORTED_BY,
      });

      if (result) {
        setExceptions((prev) => [result, ...prev]);
      }
    } catch (error) {
      console.log('Failed to create exception, updating locally:', error);
      const newException: DeliveryException = {
        id: Date.now(),
        orderId: exceptionForm.orderId,
        type: exceptionForm.type,
        description: exceptionForm.description,
        evidence: exceptionForm.evidence || undefined,
        reportedBy: REPORTED_BY,
        reportedAt: new Date().toISOString(),
      };
      setExceptions((prev) => [newException, ...prev]);
    }

    setShowForm(false);
    setExceptionForm({ orderId: '', type: '', description: '', evidence: '' });
    setFormErrors({});
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-r from-warmgold to-warmgold-600 text-white">
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
                <h1 className="text-2xl font-serif font-bold">异常上报</h1>
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
                className="px-4 py-2 text-sm text-warmgold bg-white hover:bg-white/90 rounded-btn transition-colors"
              >
                返回工作台
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/20 rounded-card p-4 animate-stagger-1">
              <AlertTriangle className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{exceptions.length}</div>
              <div className="text-xs opacity-80">异常总数</div>
            </div>
            <div className="bg-rose/30 rounded-card p-4 animate-stagger-2">
              <X className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">
                {exceptions.filter((e) => e.type === 'rejected').length}
              </div>
              <div className="text-xs opacity-80">拒收</div>
            </div>
            <div className="bg-warmgold/30 rounded-card p-4 animate-stagger-3">
              <AlertTriangle className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">
                {exceptions.filter((e) => e.type === 'damaged').length}
              </div>
              <div className="text-xs opacity-80">损毁</div>
            </div>
            <div className="bg-blue-500/30 rounded-card p-4 animate-stagger-4">
              <Clock className="h-6 w-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">
                {exceptions.filter((e) => e.type === 'delayed').length}
              </div>
              <div className="text-xs opacity-80">延误</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-bold text-gray-800">异常记录</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-rose text-white rounded-btn font-medium hover:bg-rose-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            上报异常
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif font-bold text-gray-800">上报异常</h3>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormErrors({});
                    }}
                    className="p-2 hover:bg-gray-100 rounded-btn transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择订单 <span className="text-rose">*</span>
                  </label>
                  <select
                    value={exceptionForm.orderId}
                    onChange={(e) =>
                      setExceptionForm((prev) => ({ ...prev, orderId: e.target.value }))
                    }
                    className={`w-full px-4 py-3 border rounded-btn transition-colors focus:outline-none focus:ring-2 focus:ring-rose/20 ${
                      formErrors.orderId ? 'border-rose' : 'border-gray-200'
                    }`}
                  >
                    <option value="">请选择订单</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.id} - {order.items?.[0]?.productName || '未命名商品'} (¥
                        {order.totalAmount})
                      </option>
                    ))}
                  </select>
                  {formErrors.orderId && (
                    <p className="text-rose text-sm mt-1">{formErrors.orderId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    异常类型 <span className="text-rose">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {exceptionTypes.map((type) => (
                      <button
                        key={type.key}
                        onClick={() =>
                          setExceptionForm((prev) => ({ ...prev, type: type.key }))
                        }
                        className={`flex flex-col items-center gap-2 p-4 rounded-btn transition-all ${
                          exceptionForm.type === type.key
                            ? 'bg-rose text-white ring-2 ring-rose ring-offset-2'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <type.icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                  {formErrors.type && (
                    <p className="text-rose text-sm mt-1">{formErrors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    异常描述 <span className="text-rose">*</span>
                  </label>
                  <textarea
                    value={exceptionForm.description}
                    onChange={(e) =>
                      setExceptionForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-btn transition-colors focus:outline-none focus:ring-2 focus:ring-rose/20 resize-none ${
                      formErrors.description ? 'border-rose' : 'border-gray-200'
                    }`}
                    placeholder="请详细描述异常情况，包括时间、地点、原因等..."
                  />
                  <div className="flex justify-between mt-1">
                    {formErrors.description ? (
                      <p className="text-rose text-sm">{formErrors.description}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-gray-400">
                      {exceptionForm.description.length}/500
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    上传凭证 <span className="text-gray-400 text-xs">(可选)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {exceptionForm.evidence ? (
                    <div className="relative">
                      <img
                        src={exceptionForm.evidence}
                        alt="凭证"
                        className="w-full h-48 object-cover rounded-btn"
                      />
                      <button
                        onClick={removeEvidence}
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={triggerFileInput}
                      disabled={uploading}
                      className="w-full p-8 border-2 border-dashed border-gray-300 rounded-btn hover:border-rose hover:bg-rose-50 transition-all flex flex-col items-center gap-3 disabled:opacity-50"
                    >
                      {uploading ? (
                        <div className="w-8 h-8 border-4 border-rose border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">
                              点击上传图片凭证
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              支持 JPG、PNG 格式，最大 10MB
                            </p>
                          </div>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setFormErrors({});
                  }}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-btn font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitException}
                  className="flex-1 px-6 py-3 bg-rose text-white rounded-btn font-medium hover:bg-rose-600 transition-colors"
                >
                  提交上报
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-warmgold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : exceptions.length > 0 ? (
          <div className="space-y-4">
            {exceptions.map((exc, index) => {
              const typeConfig = getExceptionTypeConfig(exc.type);
              const TypeIcon = typeConfig.icon;
              const order = getOrderInfo(exc.orderId);
              const staggerClass = `animate-stagger-${Math.min((index % 5) + 1, 5)}`;

              return (
                <div
                  key={exc.id}
                  className={`bg-white rounded-card shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 ${staggerClass}`}
                >
                  <div className="p-4 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${typeConfig.color} rounded-card flex items-center justify-center`}
                        >
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{exc.orderId}</span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-btn ${typeConfig.color}`}
                            >
                              {typeConfig.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(exc.reportedAt)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    </div>
                  </div>

                  <div className="p-4">
                    {order && (
                      <div className="flex gap-3 mb-4 p-3 bg-gray-50 rounded-btn">
                        {order.items?.[0]?.productImage && (
                          <img
                            src={order.items[0].productImage}
                            alt={order.items[0].productName}
                            className="w-14 h-14 object-cover rounded-btn flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">
                            {order.items?.[0]?.productName || '未命名商品'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <User className="h-3.5 w-3.5" />
                            <span className="truncate">{order.recipientName}</span>
                            <span className="flex-shrink-0">·</span>
                            <Package className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>¥{order.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-600 mb-3">{exc.description}</p>

                    {exc.evidence && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">凭证照片</p>
                        <img
                          src={exc.evidence}
                          alt="异常凭证"
                          className="w-32 h-32 object-cover rounded-btn border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-card shadow-sm border border-gray-100 animate-fade-in-up">
            <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-semibold text-gray-600 mb-2">
              暂无异常记录
            </h3>
            <p className="text-gray-400">还没有上报过配送异常</p>
          </div>
        )}
      </main>
    </div>
  );
}
