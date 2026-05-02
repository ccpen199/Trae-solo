import { useEffect, useState } from 'react'
import { productApi, orderApi, riskApi } from '../services/api'
import { useAuthStore } from '../store/authStore'

interface Product {
  id: string
  code: string
  name: string
  type: string
  risk_level: number
  nav: number
  nav_updated_at: string
  description: string
  issuer: string
  manager: string
}

export default function Products() {
  const { user } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ type: '', risk_level: '' })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [purchaseModal, setPurchaseModal] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')
  const [eligibility, setEligibility] = useState<{ eligible: boolean; reason: string } | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [filter])

  const fetchProducts = async () => {
    try {
      const filters: Record<string, any> = { status: 'active' }
      if (filter.type) filters.type = filter.type
      if (filter.risk_level) filters.risk_level = parseInt(filter.risk_level)
      
      const response = await productApi.getAll(filters)
      setProducts(response.data || [])
    } catch (error) {
      console.error('获取产品列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelBadge = (level: number) => {
    const colors = [
      '',
      'bg-green-100 text-green-700',
      'bg-blue-100 text-blue-700',
      'bg-yellow-100 text-yellow-700',
      'bg-orange-100 text-orange-700',
      'bg-red-100 text-red-700',
    ]
    const names = ['', '保守型', '稳健型', '平衡型', '成长型', '激进型']
    return (
      <span className={`badge ${colors[level] || 'bg-gray-100 text-gray-700'}`}>
        {names[level] || `R${level}`}
      </span>
    )
  }

  const checkEligibility = async (product: Product) => {
    try {
      const response = await riskApi.checkEligibility(product.risk_level)
      setEligibility(response.data)
    } catch (error) {
      setEligibility({ eligible: true, reason: '无法验证购买资格' })
    }
  }

  const openPurchaseModal = async (product: Product) => {
    setSelectedProduct(product)
    setPurchaseAmount('')
    setPurchaseError('')
    setEligibility(null)
    await checkEligibility(product)
    setPurchaseModal(true)
  }

  const handlePurchase = async () => {
    if (!selectedProduct || !purchaseAmount) return
    
    const amount = parseFloat(purchaseAmount)
    if (isNaN(amount) || amount <= 0) {
      setPurchaseError('请输入有效的购买金额')
      return
    }

    if (eligibility && !eligibility.eligible) {
      setPurchaseError(eligibility.reason)
      return
    }

    setPurchasing(true)
    setPurchaseError('')

    try {
      await orderApi.createPurchase({
        productId: selectedProduct.id,
        amount
      })
      setPurchaseModal(false)
      alert('申购申请已提交！')
    } catch (error: any) {
      setPurchaseError(error.response?.data?.error || '申购失败，请稍后重试')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">基金产品</h1>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">产品类型</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="select-field w-40"
            >
              <option value="">全部类型</option>
              <option value="股票型">股票型</option>
              <option value="混合型">混合型</option>
              <option value="债券型">债券型</option>
              <option value="货币型">货币型</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">风险等级</label>
            <select
              value={filter.risk_level}
              onChange={(e) => setFilter({ ...filter, risk_level: e.target.value })}
              className="select-field w-40"
            >
              <option value="">全部等级</option>
              <option value="1">R1 保守型</option>
              <option value="2">R2 稳健型</option>
              <option value="3">R3 平衡型</option>
              <option value="4">R4 成长型</option>
              <option value="5">R5 激进型</option>
            </select>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-gray-500">暂无符合条件的基金产品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <div key={product.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{product.code}</p>
                </div>
                {getRiskLevelBadge(product.risk_level)}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">单位净值</p>
                  <p className="text-lg font-semibold text-gray-900">¥{product.nav.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">产品类型</p>
                  <p className="text-sm font-medium text-gray-700">{product.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">基金经理</p>
                  <p className="text-sm font-medium text-gray-700">{product.manager || '-'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  发行方: {product.issuer || '-'}
                </span>
                <button
                  onClick={() => openPurchaseModal(product)}
                  className="btn-primary text-sm"
                >
                  立即申购
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {purchaseModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">申购基金</h2>
              <button
                onClick={() => setPurchaseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{selectedProduct.name}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedProduct.code}</p>
              <div className="flex items-center gap-2 mt-2">
                {getRiskLevelBadge(selectedProduct.risk_level)}
                <span className="text-sm text-gray-500">单位净值: ¥{selectedProduct.nav.toFixed(4)}</span>
              </div>
            </div>

            {eligibility && !eligibility.eligible && (
              <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-700">⚠️ {eligibility.reason}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                购买金额 (元)
              </label>
              <input
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="请输入购买金额"
                className="input-field"
                min="100"
                step="100"
              />
              <p className="text-xs text-gray-400 mt-1">起购金额: 100元</p>
            </div>

            {purchaseError && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="text-sm text-danger-700">{purchaseError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPurchaseModal(false)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing || (eligibility !== null && !eligibility.eligible)}
                className="flex-1 btn-primary"
              >
                {purchasing ? '提交中...' : '确认申购'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
