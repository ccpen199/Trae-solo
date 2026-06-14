import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star,
  ShieldCheck,
  Plus,
  ArrowLeft,
  Package,
  ShoppingCart,
  Wallet,
  Link as LinkIcon,
} from 'lucide-react'
import { shops } from '@/mocks'

interface Order {
  id: string
  product: string
  buyer: string
  amount: number
  quantity: string
  status: '待处理' | '配送中' | '已完成'
  date: string
}

interface DepositTransaction {
  id: string
  type: '缴纳' | '扣除' | '退还'
  amount: number
  reason: string
  date: string
}

const mockOrders: Order[] = [
  { id: 'ORD-001', product: '有机西红柿', buyer: '盒马鲜生朝阳店', amount: 1580, quantity: '200kg', status: '配送中', date: '2026-05-28' },
  { id: 'ORD-002', product: '有机黄瓜', buyer: '永辉超市望京店', amount: 825, quantity: '150kg', status: '待处理', date: '2026-05-29' },
  { id: 'ORD-003', product: '有机青椒', buyer: '美团买菜', amount: 544, quantity: '80kg', status: '已完成', date: '2026-05-25' },
  { id: 'ORD-004', product: '有机西红柿', buyer: '叮咚买菜', amount: 790, quantity: '100kg', status: '已完成', date: '2026-05-22' },
]

const mockDepositTransactions: DepositTransaction[] = [
  { id: 'DT-001', type: '缴纳', amount: 50000, reason: '开店保证金', date: '2026-01-15' },
  { id: 'DT-002', type: '扣除', amount: 200, reason: '延迟发货赔付', date: '2026-04-10' },
  { id: 'DT-003', type: '缴纳', amount: 200, reason: '保证金补缴', date: '2026-04-12' },
]

const statusColors: Record<Order['status'], string> = {
  待处理: 'bg-gold-50 text-gold-700',
  配送中: 'bg-blue-50 text-blue-700',
  已完成: 'bg-green-50 text-green-700',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={
            i < Math.floor(rating)
              ? 'fill-gold-400 text-gold-400'
              : i < rating
              ? 'fill-gold-200 text-gold-300'
              : 'text-gray-200'
          }
        />
      ))}
      <span className="ml-1 text-sm text-gray-500">{rating}</span>
    </div>
  )
}

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>()
  const shop = shops.find((s) => s.id === id)
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'deposit'>('products')
  const [submitMessage, setSubmitMessage] = useState('可从商品列表提交采购订单')

  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-lg">店铺不存在</p>
        <Link to="/shop" className="text-primary-600 mt-4 inline-block hover:underline">
          返回店铺列表
        </Link>
      </div>
    )
  }

  const depositBalance = mockDepositTransactions.reduce((acc, t) => {
    return t.type === '扣除' ? acc - t.amount : acc + t.amount
  }, 0)

  const submitOrder = async (product: string) => {
    setSubmitMessage('订单提交中...')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, shopId: shop.id, quantity: '100kg' }),
      })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(payload.error || '订单提交失败')
      setSubmitMessage(`采购订单提交成功，单号 ${payload.data.id}`)
      setActiveTab('orders')
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : '订单提交失败')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/shop"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        返回店铺列表
      </Link>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-serif font-bold text-2xl shrink-0">
            {shop.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-serif text-2xl font-bold text-earth-500">
                {shop.name}
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                营业中
              </span>
            </div>
            <StarRating rating={shop.rating} />
            <p className="text-sm text-gray-500 mt-2">{shop.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-gold-500" />
                保证金 ¥{shop.deposit.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Package size={14} className="text-primary-500" />
                {shop.products.length} 件商品
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm mb-6 w-fit">
        {([
          { key: 'products' as const, label: '商品管理', icon: Package },
          { key: 'orders' as const, label: '订单中心', icon: ShoppingCart },
          { key: 'deposit' as const, label: '保证金管理', icon: Wallet },
        ]).map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-primary-600'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-2 text-sm text-primary-700">
        {submitMessage}
      </div>

      {activeTab === 'products' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
              <Plus size={16} />
              添加商品
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">商品名称</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">分类</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">价格</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">库存</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">溯源码</th>
                  <th className="text-right px-5 py-3 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {shop.products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-earth-500">{product.name}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-primary-600 font-medium">¥{product.price}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{product.stock}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 cursor-pointer">
                        <LinkIcon size={12} />
                        {product.traceCode}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => submitOrder(product.name)}
                        className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors"
                      >
                        提交采购
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-3">
          {mockOrders.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-earth-500">{order.product}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {order.buyer} · {order.quantity} · {order.date}
                </div>
              </div>
              <div className="text-right">
                <span className="text-primary-600 font-bold">¥{order.amount.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'deposit' && (
        <div>
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center gap-2 mb-2 text-primary-100 text-sm">
              <Wallet size={16} />
              保证金余额
            </div>
            <div className="text-3xl font-bold">¥{depositBalance.toLocaleString()}</div>
            <div className="text-sm text-primary-200 mt-1">
              初始缴纳 ¥{shop.deposit.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-medium text-earth-500">交易记录</h3>
            </div>
            {mockDepositTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                      tx.type === '缴纳'
                        ? 'bg-green-50 text-green-600'
                        : tx.type === '扣除'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {tx.type === '缴纳' ? '+' : tx.type === '扣除' ? '-' : '↩'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-earth-500">{tx.reason}</div>
                    <div className="text-xs text-gray-400">{tx.date}</div>
                  </div>
                </div>
                <span
                  className={`font-medium text-sm ${
                    tx.type === '扣除' ? 'text-red-500' : 'text-green-600'
                  }`}
                >
                  {tx.type === '扣除' ? '-' : '+'}¥{tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
