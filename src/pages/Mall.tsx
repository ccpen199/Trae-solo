import { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, ShoppingCart, Search, Star, Clock } from 'lucide-react';
import { apiFetch, formatCurrency, formatDate } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface Service {
  id: number;
  name: string;
  name_en: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  rating: number;
  provider: string;
}

interface Order {
  id: number;
  order_no: string;
  service_name: string;
  quantity: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  tracking_info: string;
}

export default function Mall() {
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [checkoutNotice, setCheckoutNotice] = useState('');
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'services') {
        const res = await apiFetch<{ data: Service[] }>('/mall/services');
        setServices(res.data);
      } else {
        const res = await apiFetch<{ data: Order[] }>('/mall/orders?limit=20');
        setOrders(res.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (serviceId: number) => {
    setCart((prev) => ({
      ...prev,
      [serviceId]: (prev[serviceId] || 0) + 1,
    }));
  };

  const removeFromCart = (serviceId: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[serviceId] > 1) {
        newCart[serviceId]--;
      } else {
        delete newCart[serviceId];
      }
      return newCart;
    });
  };

  const getTotalCartItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalCartPrice = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const service = services.find((s) => s.id === parseInt(id));
      return sum + (service?.price || 0) * qty;
    }, 0);
  };

  const checkout = async () => {
    try {
      for (const [serviceId, quantity] of Object.entries(cart)) {
        await apiFetch('/mall/orders', {
          method: 'POST',
          body: JSON.stringify({
            service_id: parseInt(serviceId),
            quantity,
            property_id: 1,
          }),
        });
      }
      setCart({});
      setCheckoutNotice('订单提交成功，已生成服务订单');
      setActiveTab('orders');
    } catch (error) {
      console.error('Checkout failed:', error);
      setCheckoutNotice(error instanceof Error ? error.message : '订单提交失败');
    }
  };

  const categories = ['all', 'cleaning', 'maintenance', 'repair', 'inspection', 'professional', 'management', 'insurance'];

  const categoryColors: Record<string, string> = {
    cleaning: 'bg-blue-100 text-blue-700',
    maintenance: 'bg-green-100 text-green-700',
    repair: 'bg-orange-100 text-orange-700',
    inspection: 'bg-purple-100 text-purple-700',
    professional: 'bg-indigo-100 text-indigo-700',
    management: 'bg-pink-100 text-pink-700',
    insurance: 'bg-red-100 text-red-700',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const filteredServices = services.filter((s) => {
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchesSearch = !search || s.name.includes(search) || s.name_en.includes(search);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('mall', 'common')}</h1>
        <div className="flex items-center space-x-4">
          {activeTab === 'services' && getTotalCartItems() > 0 && (
            <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg">
              <ShoppingCart size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {getTotalCartItems()} {t('items', 'common')} · {formatCurrency(getTotalCartPrice())}
              </span>
              <button
                onClick={checkout}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                {t('checkout', 'common')}
              </button>
            </div>
          )}
        </div>
      </div>

      {checkoutNotice && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          {checkoutNotice}
        </div>
      )}

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'services' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {t('services', 'common')}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'orders' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {t('my_orders', 'common')}
        </button>
      </div>

      {activeTab === 'services' && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-64 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('search_services', 'common')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t(`category_${cat}`, 'common')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${categoryColors[service.category] || 'bg-gray-100 text-gray-700'}`}>
                        {service.category}
                      </span>
                      <div className="flex items-center text-yellow-400">
                        <Star size={14} className="fill-current mr-1" />
                        <span className="text-sm text-gray-600">{service.rating}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">{service.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{service.name_en}</p>
                    <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(service.price)}
                          <span className="text-sm font-normal text-gray-500">/{service.unit}</span>
                        </p>
                        <p className="text-xs text-gray-500">{service.provider}</p>
                      </div>
                      {cart[service.id] ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => removeFromCart(service.id)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{cart[service.id]}</span>
                          <button
                            onClick={() => addToCart(service.id)}
                            className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(service.id)}
                          className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <Plus size={16} className="mr-1" />
                          {t('add', 'common')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('order_no', 'common')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('service', 'common')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('amount', 'property')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status', 'property')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('created_at', 'common')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tracking', 'common')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                        {t('no_orders', 'common')}
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">{order.order_no}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-800">{order.service_name}</p>
                          <p className="text-xs text-gray-500">x{order.quantity}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">{formatCurrency(order.total_amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full w-fit ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                              {t(`status_${order.status}`, 'common')}
                            </span>
                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full w-fit ${
                              order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {t(`payment_${order.payment_status}`, 'common')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Clock size={14} className="text-gray-400" />
                            <span>{formatDate(order.created_at, user?.timezone)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.tracking_info || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
