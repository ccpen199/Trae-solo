import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useCartStore } from '../store'

export default function Cart() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white p-4 flex items-center sticky top-0 z-10">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-medium">购物车</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-500">购物车是空的</p>
          <button
            onClick={() => navigate('/products')}
            className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg"
          >
            去逛逛
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium">购物车({items.length})</h1>
      </div>

      <div className="p-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-3 flex">
            <img
              src={item.images}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1 ml-3">
              <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
              <p className="text-red-500 font-bold mt-1">¥{item.price}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => {
                      if (item.quantity > 1) {
                        updateQuantity(item.id, item.quantity - 1)
                      } else {
                        removeItem(item.id)
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">合计：</span>
            <span className="text-red-500 font-bold text-xl">¥{getTotal()}</span>
          </div>
          <button
            onClick={() => navigate('/confirm-order')}
            className="bg-red-500 text-white px-8 py-2.5 rounded-lg font-medium"
          >
            结算({items.length})
          </button>
        </div>
      </div>
    </div>
  )
}
