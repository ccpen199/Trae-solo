import React, { useState, useEffect } from 'react'
import {
  UserGroupIcon,
  EyeIcon,
  FunnelIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { adminAPI, mallAPI } from '../../api/client'

const AudienceRules = () => {
  const [rules, setRules] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [previewUsers, setPreviewUsers] = useState([])
  const [previewCount, setPreviewCount] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rulesRes, productsRes] = await Promise.all([
        adminAPI.getAudienceRules(),
        mallAPI.getProducts(),
      ])
      setRules(rulesRes.data?.rules || [])
      setProducts(productsRes.data?.items || productsRes.data?.products || productsRes.data || [])
    } catch (err) {
      setError('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (productId) => {
    try {
      const res = await adminAPI.getAudiencePreview(productId)
      setPreviewUsers(res.data?.users || [])
      setPreviewCount(res.data?.count || 0)
      setSelectedProduct(rules.find(r => r.id === productId))
      setShowPreview(true)
    } catch (err) {
      setError('获取人群预览失败')
    }
  }

  const formatRules = (rules) => {
    if (!rules) return '无规则'
    const parts = []
    if (rules.roles?.length) parts.push(`角色: ${rules.roles.join(', ')}`)
    if (rules.cities?.length) parts.push(`城市: ${rules.cities.join(', ')}`)
    if (rules.minAge) parts.push(`最小年龄: ${rules.minAge}`)
    if (rules.maxAge) parts.push(`最大年龄: ${rules.maxAge}`)
    if (rules.enterpriseIds?.length) parts.push(`指定企业: ${rules.enterpriseIds.length}家`)
    return parts.length ? parts.join(' | ') : '无规则'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">人群圈选规则</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
          <PlusIcon className="w-5 h-5" />
          新建规则
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 opacity-80">规则总数</p>
              <p className="text-2xl font-bold text-blue-700">{rules.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <FunnelIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 opacity-80">商品总数</p>
              <p className="text-2xl font-bold text-green-700">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <EyeIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600 opacity-80">覆盖人群</p>
              <p className="text-2xl font-bold text-purple-700">
                {rules.reduce((sum, r) => sum + (r.rules?.estimatedCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">商品</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">分类</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">圈选规则</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">创建时间</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  暂无人群圈选规则
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-800 font-medium">{rule.productName}</td>
                  <td className="px-5 py-3 text-gray-500">{rule.category || '-'}</td>
                  <td className="px-5 py-3 text-gray-600 text-xs max-w-md truncate">
                    {formatRules(rule.rules)}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(rule.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handlePreview(rule.id)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      <EyeIcon className="w-4 h-4" />
                      预览人群
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">人群预览</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              {selectedProduct && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    商品：<span className="font-medium text-gray-800">{selectedProduct.productName}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    预估覆盖人数：<span className="font-bold text-indigo-600">{previewCount}</span> 人
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              {previewUsers.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无人符合条件</p>
              ) : (
                <div className="space-y-2">
                  {previewUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">{user.name?.[0] || 'U'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        user.role === 'user' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'enterprise' ? 'bg-green-100 text-green-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {user.role === 'user' ? '职场人' : user.role === 'enterprise' ? '企业HR' : '运营'}
                      </span>
                    </div>
                  ))}
                  {previewCount > previewUsers.length && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      仅显示前 {previewUsers.length} 人，共 {previewCount} 人符合条件
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AudienceRules
