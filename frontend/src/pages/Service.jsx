import React, { useState, useEffect } from 'react'
import api from '../utils/api'

export default function Service() {
  const [shops, setShops] = useState([])
  const [faultCodes, setFaultCodes] = useState([])
  const [spareParts, setSpareParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('shops')
  const [selectedFault, setSelectedFault] = useState(null)
  const [recommendations, setRecommendations] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [shopsRes, faultRes, partsRes] = await Promise.all([
        api.get('/service/shops'),
        api.get('/service/fault-codes'),
        api.get('/service/spare-parts')
      ])
      setShops(shopsRes.data.shops || [])
      setFaultCodes(faultRes.data.fault_codes || [])
      setSpareParts(partsRes.data.parts || [])
    } catch (err) {
      console.error('Failed to load service data:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkFault = async (code) => {
    try {
      const res = await api.get(`/service/fault-codes/${code}/recommend`)
      setSelectedFault(code)
      setRecommendations(res.data.recommendations)
    } catch (err) {
      console.error('Failed to load recommendations:', err)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-1 inline-flex shadow-sm">
        {[
          { id: 'shops', label: '维修网点', icon: '🏪' },
          { id: 'fault', label: '故障查询', icon: '⚠️' },
          { id: 'parts', label: '备件查询', icon: '🔩' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'text-gray-500'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'shops' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shops.map(shop => (
              <div key={shop.id} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                    🏪
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-semibold text-gray-800">{shop.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{shop.address}</p>
                    <p className="text-xs text-gray-400 mt-1">{shop.phone}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500">⭐ {shop.rating}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-500">营业时间：</span>
                    {shop.business_hours}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'fault' && (
        <div className="space-y-4">
          {!recommendations ? (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">故障代码查询</h3>
              <p className="text-sm text-gray-500 mb-4">点击故障代码查看维修建议</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {faultCodes.map(fault => (
                  <button
                    key={fault.id}
                    onClick={() => checkFault(fault.code)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary-300 ${
                      fault.severity === 'danger' ? 'border-red-200 bg-red-50' :
                      fault.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="font-mono font-bold text-gray-800">{fault.code}</div>
                    <div className="text-sm text-gray-600 mt-1">{fault.description}</div>
                    <div className={`text-xs mt-2 ${
                      fault.severity === 'danger' ? 'text-red-600' :
                      fault.severity === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {fault.severity === 'danger' ? '⚠️ 严重' :
                       fault.severity === 'warning' ? '⚡ 警告' : 'ℹ️ 一般'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <button
                onClick={() => { setRecommendations(null); setSelectedFault(null) }}
                className="text-sm text-gray-500 mb-4 hover:text-gray-700"
              >
                ← 返回故障列表
              </button>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">⚠️</span>
                  <div>
                    <div className="font-mono font-bold text-red-800 text-lg">
                      {recommendations.fault_code?.code}
                    </div>
                    <div className="text-red-700">{recommendations.fault_code?.description}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">🔧 推荐维修方案</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-800">{recommendations.recommended_action}</p>
                  </div>
                  {recommendations.diy_steps && recommendations.diy_steps.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">自行排查步骤：</p>
                      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                        {recommendations.diy_steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">💰 预估费用</h4>
                  <div className="text-2xl font-bold text-orange-600">
                    ¥{recommendations.estimated_cost || '0'} 起
                  </div>
                  <p className="text-xs text-gray-400 mt-1">实际费用以门店为准</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">🏪 推荐维修网点</h4>
                  <div className="space-y-2">
                    {(recommendations.nearby_shops || []).slice(0, 3).map(shop => (
                      <div key={shop.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          🏪
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-800 text-sm">{shop.name}</div>
                          <div className="text-xs text-gray-500">{shop.address}</div>
                        </div>
                        <div className="text-yellow-500 text-sm">⭐ {shop.rating}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'parts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">备件库存</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {spareParts.map(part => (
                <div key={part.id} className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors">
                  <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl mb-3">
                    🔩
                  </div>
                  <div className="font-medium text-gray-800 text-sm">{part.name}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">{part.sku}</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-primary-600">¥{part.price}</span>
                    <span className={`text-xs ${part.stock > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                      库存 {part.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
