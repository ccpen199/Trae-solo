import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  TagIcon,
  TicketIcon,
} from '@heroicons/react/24/outline'
import { mallAPI } from '../api/client'

const MallProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await mallAPI.getProduct(id)
        setProduct(res.data)
      } catch (err) {
        setError('获取商品详情失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handlePurchase = async () => {
    setPurchasing(true)
    setError('')
    setSuccess('')
    try {
      const res = await mallAPI.createOrder(id, 1, '123456')
      setSuccess('购买成功！')
      try {
        const codesRes = await mallAPI.getCodes()
        setCodes(codesRes.data || [])
      } catch {}
    } catch (err) {
      setError(err.response?.data?.message || '购买失败')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">商品不存在</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>返回</span>
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">{success}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 h-64 md:h-auto bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <ShoppingBagIcon className="w-24 h-24 text-indigo-300" />
          </div>
          <div className="md:w-1/2 p-6">
            <div className="flex items-center gap-2 mb-2">
              <TagIcon className="w-4 h-4 text-indigo-500" />
              <span className="text-sm bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                {product.category}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{product.name}</h2>
            <p className="text-gray-600 mb-4">{product.description || '暂无描述'}</p>
            <p className="text-3xl font-bold text-indigo-600 mb-2">¥{product.price}</p>
            <p className="text-sm text-gray-400 mb-6">库存：{product.stock || 0} 件</p>
            <button
              onClick={handlePurchase}
              disabled={purchasing || product.stock <= 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
            >
              {purchasing ? '购买中...' : product.stock <= 0 ? '已售罄' : '立即购买'}
            </button>
          </div>
        </div>
      </div>

      {codes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-indigo-500" />
            我的兑换码
          </h3>
          <div className="space-y-2">
            {codes.map((code) => (
              <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-mono text-indigo-600 font-medium">{code.code}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {code.status === 'used' ? '已使用' : code.status === 'expired' ? '已过期' : '未使用'}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    code.status === 'used'
                      ? 'bg-gray-100 text-gray-500'
                      : code.status === 'expired'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-green-50 text-green-600'
                  }`}
                >
                  {code.status === 'used' ? '已使用' : code.status === 'expired' ? '已过期' : '可用'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MallProductDetail
