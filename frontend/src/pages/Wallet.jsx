import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useAuthStore } from '../store'

export default function Wallet() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const transactions = [
    { type: 'recharge', amount: 100, time: '2024-01-15 10:30', desc: '余额充值' },
    { type: 'consume', amount: -588, time: '2024-01-14 15:20', desc: '酒店预订支付' },
    { type: 'recharge', amount: 500, time: '2024-01-10 09:00', desc: '余额充值' },
    { type: 'consume', amount: -128, time: '2024-01-08 18:45', desc: '商品购买' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium">我的钱包</h1>
      </div>

      <div className="bg-gradient-to-r from-red-500 to-orange-500 mx-4 mt-4 rounded-2xl p-6 text-white">
        <div className="flex items-center mb-2">
          <CreditCard className="w-6 h-6 mr-2" />
          <span className="text-sm opacity-80">账户余额</span>
        </div>
        <p className="text-4xl font-bold">¥{user?.balance || 0}</p>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 bg-white/20 py-2.5 rounded-lg text-sm font-medium">
            充值
          </button>
          <button className="flex-1 bg-white/20 py-2.5 rounded-lg text-sm font-medium">
            提现
          </button>
        </div>
      </div>

      <div className="bg-white mx-4 mt-4 rounded-xl">
        <div className="p-4 border-b">
          <h3 className="font-bold">交易记录</h3>
        </div>
        <div>
          {transactions.map((item, index) => (
            <div
              key={index}
              className={`flex items-center p-4 ${
                index < transactions.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                item.type === 'recharge' ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {item.type === 'recharge' ? (
                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-sm">{item.desc}</p>
                <p className="text-xs text-gray-400 mt-1">{item.time}</p>
              </div>
              <span className={`font-bold ${
                item.amount > 0 ? 'text-green-600' : 'text-gray-800'
              }`}>
                {item.amount > 0 ? '+' : ''}{item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
