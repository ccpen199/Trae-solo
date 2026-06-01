import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'
import { orderApi } from '../api'
import { useAuthStore } from '../store'

export default function Orders() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useAuthStore((state) => state.token)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'hotel')
  const [hotelOrders, setHotelOrders] = useState([])
  const [productOrders, setProductOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadOrders()
  }, [activeTab, token])

  const loadOrders = async () => {
    setLoading(true)
    try {
      if (activeTab === 'hotel') {
        const res = await orderApi.getHotelOrders()
        setHotelOrders(res.data.data)
      } else {
        const res = await orderApi.getProductOrders()
        setProductOrders(res.data.data)
      }
    } catch (error) {
      console.error('加载失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayHotel = async (orderNo) => {
    try {
      await orderApi.payHotelOrder({ order_no: orderNo })
      alert('支付成功')
      loadOrders()
    } catch (error) {
      alert(error.response?.data?.error || '支付失败')
    }
  }

  const handlePayProduct = async (orderNo) => {
    try {
      await orderApi.payProductOrder({ order_no: orderNo })
      alert('支付成功')
      loadOrders()
    } catch (error) {
      alert(error.response?.data?.error || '支付失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium">我的订单</h1>
      </div>

      <div className="bg-white flex border-b sticky top-14 z-10">
        <button
          onClick={() => setActiveTab('hotel')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'hotel'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-500'
          }`}
        >
          酒店订单
        </button>
        <button
          onClick={() => setActiveTab('product')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'product'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-500'
          }`}
        >
          商品订单
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : activeTab === 'hotel' ? (
          hotelOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">暂无酒店订单</div>
          ) : (
            <div className="space-y-3">
              {hotelOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-4">
                  <div className="flex items-start">
                    <img
                      src={order.hotel_image}
                      alt={order.hotel_name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="ml-3 flex-1">
                      <h3 className="font-medium text-sm">{order.hotel_name}</h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {order.check_in} - {order.check_out}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.guest_name} · {order.guest_phone}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-red-500 font-bold">¥{order.total_amount}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {order.payment_status === 'paid' ? '已支付' : '待支付'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {order.payment_status !== 'paid' && (
                    <button
                      onClick={() => handlePayHotel(order.order_no)}
                      className="w-full mt-3 bg-red-500 text-white py-2 rounded-lg text-sm"
                    >
                      立即支付
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : productOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无商品订单</div>
        ) : (
          <div className="space-y-3">
            {productOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-4">
                <div className="space-y-2">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <img
                        src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100"
                        alt=""
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium line-clamp-1">商品</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-red-500 text-sm">¥{item.price}</span>
                          <span className="text-xs text-gray-500">x{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">合计：</span>
                    <span className="text-red-500 font-bold">¥{order.total_amount}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {order.payment_status === 'paid' ? '已支付' : '待支付'}
                  </span>
                </div>
                {order.payment_status !== 'paid' && (
                  <button
                    onClick={() => handlePayProduct(order.order_no)}
                    className="w-full mt-3 bg-red-500 text-white py-2 rounded-lg text-sm"
                  >
                    立即支付
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
