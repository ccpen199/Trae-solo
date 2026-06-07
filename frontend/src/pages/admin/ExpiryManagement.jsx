import React, { useState, useEffect } from 'react'
import {
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { adminAPI } from '../../api/client'

const ExpiryManagement = () => {
  const [expiringCodes, setExpiringCodes] = useState([])
  const [expiredProducts, setExpiredProducts] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [activeTab, setActiveTab] = useState('codes')
  const [daysFilter, setDaysFilter] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [daysFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getExpiringItems(daysFilter)
      setExpiringCodes(res.data?.expiringCodes || [])
      setExpiredProducts(res.data?.expiredProducts || [])
      setStats(res.data?.stats)
    } catch (err) {
      setError('获取过期数据失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id, type) => {
    const key = `${type}-${id}`
    setSelectedItems((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    )
  }

  const toggleSelectAll = () => {
    const items = activeTab === 'codes' ? expiringCodes : expiredProducts
    const type = activeTab === 'codes' ? 'codes' : 'products'
    
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map((item) => `${type}-${item.id}`))
    }
  }

  const handleBatchExpire = async () => {
    if (selectedItems.length === 0) return
    if (!window.confirm(`确认将选中的 ${selectedItems.length} 项标记为过期？此操作不可撤销。`)) return
    
    setProcessing(true)
    setError('')
    try {
      const codesIds = selectedItems
        .filter((k) => k.startsWith('codes-'))
        .map((k) => k.replace('codes-', ''))
      const productIds = selectedItems
        .filter((k) => k.startsWith('products-'))
        .map((k) => k.replace('products-', ''))

      if (codesIds.length > 0) {
        await adminAPI.batchExpire('codes', codesIds)
      }
      if (productIds.length > 0) {
        await adminAPI.batchExpire('products', productIds)
      }
      
      setSelectedItems([])
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || '批量处理失败')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `已过期 ${Math.abs(diffDays)} 天`
    if (diffDays === 0) return '今天到期'
    if (diffDays <= 7) return `${diffDays} 天后到期`
    return d.toLocaleDateString('zh-CN')
  }

  const getUrgencyColor = (date) => {
    if (!date) return 'text-gray-500'
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'text-red-600 bg-red-50'
    if (diffDays <= 3) return 'text-red-600 bg-red-50'
    if (diffDays <= 7) return 'text-orange-600 bg-orange-50'
    if (diffDays <= 30) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const currentItems = activeTab === 'codes' ? expiringCodes : expiredProducts
  const allSelected = currentItems.length > 0 && selectedItems.length === currentItems.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">过期失效管理</h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 opacity-80">即将到期核销码</p>
              <p className="text-2xl font-bold text-red-700">{stats?.expiringCodesCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-600 opacity-80">已过期商品</p>
              <p className="text-2xl font-bold text-orange-700">{stats?.expiredProductsCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-yellow-600 opacity-80">涉及金额</p>
              <p className="text-2xl font-bold text-yellow-700">¥{stats?.totalValue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setActiveTab('codes')
              setSelectedItems([])
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'codes'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            核销码 ({expiringCodes.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('products')
              setSelectedItems([])
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            商品 ({expiredProducts.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">到期范围：</label>
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          >
            <option value={7}>7天内</option>
            <option value={30}>30天内</option>
            <option value={60}>60天内</option>
            <option value={90}>90天内</option>
          </select>
        </div>

        {selectedItems.length > 0 && (
          <button
            onClick={handleBatchExpire}
            disabled={processing}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            {processing ? '处理中...' : `批量标记过期 (${selectedItems.length})`}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {currentItems.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">全选</span>
          </div>
        )}

        {activeTab === 'codes' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="w-12 px-5 py-3"></th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">核销码</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">用户</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">商品</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">到期时间</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {expiringCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    暂无即将到期的核销码
                  </td>
                </tr>
              ) : (
                expiringCodes.map((code) => {
                  const key = `codes-${code.id}`
                  const urgencyClass = getUrgencyColor(code.expiresAt)
                  return (
                    <tr key={code.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(key)}
                          onChange={() => toggleSelect(code.id, 'codes')}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-gray-800">{code.code}</td>
                      <td className="px-5 py-3 text-gray-700">{code.user?.name || '-'}</td>
                      <td className="px-5 py-3 text-gray-700">{code.product?.name || '-'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${urgencyClass}`}>
                          {formatDate(code.expiresAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          code.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                          code.status === 'used' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {code.status === 'active' ? '待核销' :
                           code.status === 'used' ? '已核销' : '已过期'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="w-12 px-5 py-3"></th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">商品</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">分类</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">价格</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">到期时间</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {expiredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    暂无已过期商品
                  </td>
                </tr>
              ) : (
                expiredProducts.map((product) => {
                  const key = `products-${product.id}`
                  return (
                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(key)}
                          onChange={() => toggleSelect(product.id, 'products')}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="px-5 py-3 text-gray-500">{product.category || '-'}</td>
                      <td className="px-5 py-3 text-gray-700">¥{product.price?.toFixed(2) || '0.00'}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {product.expiresAt ? new Date(product.expiresAt).toLocaleDateString('zh-CN') : '-'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          product.status === 'active' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {product.status === 'active' ? '上架中' : '已下架'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ExpiryManagement
