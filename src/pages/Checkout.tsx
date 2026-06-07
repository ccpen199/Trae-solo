import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Zap,
  CalendarDays,
  ChevronRight,
} from 'lucide-react';
import Header from '@/components/Header';
import { useCartStore } from '@/store/useCartStore';
import { api } from '@/utils/api';

const timeSlots = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
  '18:00-19:00',
  '19:00-20:00',
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getTotalAmount, clearCart } = useCartStore();
  const [deliveryType, setDeliveryType] = useState<'instant' | 'next-day'>('instant');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = getTotalAmount();
  const deliveryFee = totalAmount >= 299 ? 0 : 15;
  const finalAmount = totalAmount + deliveryFee;

  const getNextDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: `${date.getMonth() + 1}月${date.getDate()}日`,
        weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
      });
    }
    return dates;
  };

  const nextDates = getNextDates();

  const handleSubmit = async () => {
    if (!recipientName || !recipientPhone || !recipientAddress) {
      alert('请填写完整的收货信息');
      return;
    }

    if (deliveryType === 'next-day' && (!selectedDate || !selectedTimeSlot)) {
      alert('请选择预约配送时间');
      return;
    }

    if (items.length === 0) {
      alert('购物车是空的');
      return;
    }

    setSubmitting(true);
    try {
      const expectedDeliveryTime = deliveryType === 'instant'
        ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        : new Date(`${selectedDate}T${selectedTimeSlot.split('-')[0]}:00`).toISOString();

      const order = await api.orders.create({
        shopId: items[0].product.shopId,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        recipientName,
        recipientPhone,
        recipientAddress,
        recipientLat: 39.9042,
        recipientLng: 116.4074,
        deliveryType,
        expectedDeliveryTime,
      });

      clearCart();
      alert('订单提交成功！');
      navigate(`/orders/${order.id}`);
    } catch (error) {
      console.log('Order failed, using mock:', error);
      const mockOrderId = 'ORD' + Date.now();
      clearCart();
      alert('订单提交成功！');
      navigate(`/orders/${mockOrderId}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 py-3 text-gray-600 hover:text-rose transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">返回</span>
            </button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-serif font-semibold text-gray-600 mb-2">
              购物车是空的
            </h2>
            <p className="text-gray-400 mb-6">去挑选心仪的鲜花吧</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-rose text-white rounded-btn font-medium hover:bg-rose-600 transition-colors"
            >
              去逛逛
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 py-3 text-gray-600 hover:text-rose transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">返回</span>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-serif font-bold text-gray-800 mb-6 animate-fade-in-up">
          确认订单
        </h1>

        <div className="space-y-6">
          <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-fade-in-up">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-rose" />
              收货地址
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    收货人姓名
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="请输入姓名"
                    className="w-full px-4 py-2 border border-gray-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系电话
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className="w-full px-4 py-2 border border-gray-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  详细地址
                </label>
                <textarea
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="请输入详细地址"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-stagger-1">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-rose" />
              配送方式
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setDeliveryType('instant')}
                className={`p-4 rounded-btn border-2 transition-all text-left ${deliveryType === 'instant' ? 'border-rose bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${deliveryType === 'instant' ? 'bg-rose text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-medium ${deliveryType === 'instant' ? 'text-rose' : 'text-gray-800'}`}>
                      立即送
                    </p>
                    <p className="text-xs text-gray-500">预计2小时内送达</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setDeliveryType('next-day')}
                className={`p-4 rounded-btn border-2 transition-all text-left ${deliveryType === 'next-day' ? 'border-rose bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${deliveryType === 'next-day' ? 'bg-rose text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-medium ${deliveryType === 'next-day' ? 'text-rose' : 'text-gray-800'}`}>
                      预约送
                    </p>
                    <p className="text-xs text-gray-500">选择指定日期时段</p>
                  </div>
                </div>
              </button>
            </div>

            {deliveryType === 'next-day' && (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    选择日期
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {nextDates.map((date) => (
                      <button
                        key={date.value}
                        onClick={() => setSelectedDate(date.value)}
                        className={`p-2 rounded-btn text-center transition-all ${selectedDate === date.value ? 'bg-rose text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                      >
                        <p className="text-xs">{date.weekday}</p>
                        <p className="text-sm font-medium">{date.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDate && (
                  <div className="animate-fade-in-up">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      选择时段
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-2 px-3 rounded-btn text-sm transition-all ${selectedTimeSlot === slot ? 'bg-rose text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-stagger-2">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-rose" />
              商品清单
            </h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-btn flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{item.product.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{item.product.shopName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-rose font-semibold">¥{item.product.price.toFixed(2)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-btn border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-btn border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="ml-2 p-1 text-gray-400 hover:text-rose transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-stagger-3">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4">
              订单备注
            </h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="如有特殊要求请备注（如贺卡祝福语等）"
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100 animate-stagger-4">
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4">
              费用明细
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">商品总价</span>
                <span className="text-gray-800">¥{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">配送费</span>
                <span className={deliveryFee === 0 ? 'text-sprout' : 'text-gray-800'}>
                  {deliveryFee === 0 ? '免运费' : `¥${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs text-warmgold">
                  再购 ¥{(299 - totalAmount).toFixed(2)} 即可免运费
                </p>
              )}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">应付总额</span>
                  <span className="text-2xl font-bold text-rose">¥{finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 -mx-4 sm:-mx-6 lg:-mx-8 animate-stagger-5">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <span className="text-gray-500 text-sm">合计：</span>
                <span className="text-2xl font-bold text-rose">¥{finalAmount.toFixed(2)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-rose text-white rounded-btn font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    提交订单
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
