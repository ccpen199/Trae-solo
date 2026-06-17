import { useState } from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { ORDER_CATEGORIES } from '../../constants'
import type { OrderCategory } from '../../types'

interface Product {
  id: string
  name: string
  category: OrderCategory
  price: number
  stock: number
  image: string
  status: 'on_sale' | 'off_sale'
}

const mockProducts: Product[] = [
  { id: '1', name: '招牌牛肉面', category: 'buy', price: 28, stock: 50, image: '', status: 'on_sale' },
  { id: '2', name: '酸辣粉', category: 'buy', price: 18, stock: 30, image: '', status: 'on_sale' },
  { id: '3', name: '红烧排骨饭', category: 'buy', price: 35, stock: 20, image: '', status: 'on_sale' },
  { id: '4', name: '宫保鸡丁', category: 'buy', price: 32, stock: 25, image: '', status: 'off_sale' },
  { id: '5', name: '快递代取服务', category: 'fetch', price: 5, stock: 999, image: '', status: 'on_sale' },
  { id: '6', name: '文件送达服务', category: 'send', price: 12, stock: 999, image: '', status: 'on_sale' },
  { id: '7', name: '鲜花配送', category: 'send', price: 15, stock: 40, image: '', status: 'on_sale' },
  { id: '8', name: '排队代办', category: 'errand', price: 30, stock: 999, image: '', status: 'on_sale' },
]

const emptyForm = { name: '', category: 'buy' as OrderCategory, price: '', stock: '' }

export default function Products() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [filter, setFilter] = useState<OrderCategory | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = filter === 'all' ? products : products.filter((p) => p.category === filter)

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock) })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name || !form.price) return
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, name: form.name, category: form.category, price, stock } : p)),
      )
    } else {
      const newProduct: Product = {
        id: String(Date.now()),
        name: form.name,
        category: form.category,
        price,
        stock,
        image: '',
        status: 'on_sale',
      }
      setProducts((prev) => [...prev, newProduct])
    }
    setModalOpen(false)
  }

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const toggleStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'on_sale' ? 'off_sale' : 'on_sale' } : p)),
    )
  }

  const categoryMap = Object.fromEntries(ORDER_CATEGORIES.map((c) => [c.key, c.name]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          添加商品
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {ORDER_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === c.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((product) => (
          <Card key={product.id} hover>
            <div className="w-full h-36 bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
              <Tag color={product.status === 'on_sale' ? 'green' : 'gray'} size="sm">
                {product.status === 'on_sale' ? '在售' : '下架'}
              </Tag>
            </div>
            <div className="text-xs text-gray-500 mb-2">{categoryMap[product.category]}</div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-red-500">¥{product.price}</span>
              <span className="text-xs text-gray-400">库存 {product.stock}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => openEdit(product)}>
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStatus(product.id)}
              >
                {product.status === 'on_sale' ? '下架' : '上架'}
              </Button>
              <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => handleDelete(product.id)}>
                删除
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? '编辑商品' : '添加商品'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="商品名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="输入商品名称" />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">经营类目</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as OrderCategory })}
              className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ORDER_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input label="价格" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          <Input label="库存" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
        </div>
      </Modal>
    </div>
  )
}
