import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, MapPin, Phone } from 'lucide-react'
import { useCartStore, useAuthStore } from '../store'
import { orderApi } from '../api'

export default function ConfirmOrder() {
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const [receiverName, setReceiverName] = useState(user?.nickname || '')
  const [receiverPhone, setReceiverPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    if (!receiverName || !receiverPhone || !address) {
      alert('请填写完整的收货信息')
      return
    }

    setLoading(true)
    try {
      await orderApi.createProductOrder({
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        address,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
      })
      clearCart()
      alert('下单成功！')
      navigate('/orders?tab=product')
    } catch (error) {
      alert(error.response?.data?.error || '下单失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium">确认订单</h1>
      </div>

      <div className="bg-white m-4 rounded-xl p-4">
        <h3 className="font-medium mb-4">收货信息</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 flex items-center">
              <User className="w-4 h-4 mr-1" />
              收货人
            </label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="请输入收货人姓名"
              className="w-full mt-1 border rounded-lg p-2 outline-none text-sm focus:border-red-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 flex items-center">
              <Phone className="w-4 h-4 mr-1" />
              手机号
            </label>
            <input
              type="tel"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="请输入手机号"
              className="w-full mt-1 border rounded-lg p-2 outline-none text-sm focus:border-red-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              收货地址
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="请输入详细地址"
              rows={2}
              className="w-full mt-1 border rounded-lg p-2 outline-none text-sm focus:border-red-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white m-4 rounded-xl p-4">
        <h3 className="font-medium mb-3">商品清单</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center">
              <img
                src={item.images}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 ml-3">
                <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                <p className="text-red-500 font-medium mt-1">¥{item.price}</p>
              </div>
              <span className="text-sm text-gray-500">x{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white m-4 rounded-xl p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">商品金额</span>
            <span>¥{getTotal()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">运费</span>
            <span>¥0</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium">合计</span>
            <span className="text-red-500 font-bold text-lg">¥{getTotal()}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">合计：</span>
            <span className="text-red-500 font-bold text-xl">¥{getTotal()}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-red-500 text-white px-8 py-2.5 rounded-lg font-medium disabled:bg-gray-300"
          >
            {loading ? '提交中...' : '提交订单'}
          </button>
        </div>
      </div>
    </div>
  )
}
