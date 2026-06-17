import { useNavigate } from 'react-router-dom'
import { Utensils, Gamepad2, Trees, ShoppingCart, Store, Settings } from 'lucide-react'

const categories = [
  { type: 'food', label: '餐饮', icon: Utensils, color: 'bg-red-50 text-red-500' },
  { type: 'entertainment', label: '娱乐', icon: Gamepad2, color: 'bg-purple-50 text-purple-500' },
  { type: 'leisure', label: '休闲', icon: Trees, color: 'bg-green-50 text-green-500' },
  { type: 'shopping', label: '商超', icon: ShoppingCart, color: 'bg-amber-50 text-amber-500' },
  { type: 'merchant-join', label: '商户入驻', icon: Store, color: 'bg-primary-50 text-primary' },
  { type: 'admin', label: '运营后台', icon: Settings, color: 'bg-secondary-50 text-secondary' },
  { type: 'orders', label: '我的订单', icon: ShoppingCart, color: 'bg-accent-50 text-accent' },
]

export default function CategoryNav() {
  const navigate = useNavigate()

  const handleClick = (type: string) => {
    if (type === 'merchant-join') navigate('/merchant-join')
    else if (type === 'admin') navigate('/admin')
    else if (type === 'orders') navigate('/orders')
    else navigate(`/category/${type}`)
  }

  return (
    <section className="py-4 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.type}
              onClick={() => handleClick(cat.type)}
              className="card flex flex-col items-center gap-2 py-4 px-2 hover:border-primary/30"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">{cat.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
