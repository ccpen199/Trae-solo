import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { User } from '../types'
import {
  Users, Star, ArrowUp, ArrowDown, ChevronRight, Award,
  TrendingUp, AlertTriangle, CheckCircle, Clock, Filter
} from 'lucide-react'

interface Provider extends User {
  completionRate?: string
  levelName?: string
}

export default function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [filterLevel, setFilterLevel] = useState<string>('ALL')
  const [adjustingLevel, setAdjustingLevel] = useState(false)
  const [newLevel, setNewLevel] = useState('')

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const { data } = await api.get('/admin/providers')
      const providersWithStats = (data.data || data).map((p: Provider) => ({
        ...p,
        completionRate: p.totalOrders > 0 
          ? ((p.completedOrders / p.totalOrders) * 100).toFixed(1)
          : '0',
        levelName: getLevelName(p.level)
      }))
      setProviders(providersWithStats)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getLevelName = (level: number) => {
    const levels = ['', '新手', '铜牌', '银牌', '金牌', '钻石', '皇冠']
    return levels[level] || `Lv.${level}`
  }

  const getLevelColor = (level: number) => {
    if (level >= 6) return 'bg-yellow-500'
    if (level >= 5) return 'bg-purple-500'
    if (level >= 4) return 'bg-amber-400'
    if (level >= 3) return 'bg-gray-400'
    if (level >= 2) return 'bg-orange-600'
    return 'bg-gray-300'
  }

  const handleAdjustLevel = async () => {
    if (!selectedProvider || !newLevel) return
    setAdjustingLevel(true)
    try {
      await api.post(`/admin/providers/${selectedProvider.id}/adjust-level`, {
        level: parseInt(newLevel)
      })
      alert('等级调整成功')
      setSelectedProvider(null)
      fetchProviders()
    } catch (err: any) {
      alert(err.response?.data?.error || '调整失败')
    } finally {
      setAdjustingLevel(false)
    }
  }

  const filteredProviders = filterLevel === 'ALL' 
    ? providers 
    : providers.filter(p => p.level === parseInt(filterLevel))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">服务商管理</h1>
          <p className="text-gray-500 mt-1">星级评定、升降级管理</p>
        </div>
        <Link to="/admin" className="btn-secondary">
          返回仪表盘
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary-600" />
                服务商列表
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">全部等级</option>
                  <option value="1">新手</option>
                  <option value="2">铜牌</option>
                  <option value="3">银牌</option>
                  <option value="4">金牌</option>
                  <option value="5">钻石</option>
                  <option value="6">皇冠</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无服务商</h3>
                <p className="text-gray-500">还没有服务商注册</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredProviders.map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider)
                      setNewLevel(provider.level.toString())
                    }}
                    className={`p-5 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedProvider?.id === provider.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={provider.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.username}`}
                        alt=""
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{provider.username}</h3>
                          <span className={`badge ${getLevelColor(provider.level)} text-white text-xs`}>
                            {getLevelName(provider.level)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Star className="w-3.5 h-3.5 text-yellow-500 mr-1" />
                            {provider.rating?.toFixed(1)} 分
                          </span>
                          <span className="flex items-center">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-1" />
                            {provider.completedOrders} 单
                          </span>
                          <span className="flex items-center">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-500 mr-1" />
                            {provider.completionRate}% 完成率
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {provider.complaintCount > 0 && (
                          <span className="flex items-center text-red-500 text-sm">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            {provider.complaintCount} 投诉
                          </span>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          注册于 {new Date(provider.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            {!selectedProvider ? (
              <div className="text-center py-16">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">请选择一个服务商进行管理</p>
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <img
                    src={selectedProvider.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProvider.username}`}
                    alt=""
                    className="w-20 h-20 rounded-full mx-auto mb-3"
                  />
                  <h3 className="font-semibold text-gray-900 text-lg">{selectedProvider.username}</h3>
                  <span className={`badge ${getLevelColor(selectedProvider.level)} text-white`}>
                    {getLevelName(selectedProvider.level)}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-gray-500">评分</span>
                    <span className="font-semibold text-gray-900 flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      {selectedProvider.rating?.toFixed(1)}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-gray-500">完成订单</span>
                    <span className="font-semibold text-gray-900">{selectedProvider.completedOrders}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-gray-500">完成率</span>
                    <span className="font-semibold text-gray-900">{selectedProvider.completionRate}%</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-gray-500">投诉次数</span>
                    <span className={`font-semibold ${selectedProvider.complaintCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {selectedProvider.complaintCount}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <ArrowUp className="w-4 h-4 mr-1 text-green-600" />
                    <ArrowDown className="w-4 h-4 mr-1 text-red-600" />
                    等级调整
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">调整至等级</label>
                      <select
                        value={newLevel}
                        onChange={(e) => setNewLevel(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="1">Lv.1 新手</option>
                        <option value="2">Lv.2 铜牌</option>
                        <option value="3">Lv.3 银牌</option>
                        <option value="4">Lv.4 金牌</option>
                        <option value="5">Lv.5 钻石</option>
                        <option value="6">Lv.6 皇冠</option>
                      </select>
                    </div>

                    {parseInt(newLevel) !== selectedProvider.level && (
                      <div className={`p-3 rounded-lg text-sm ${
                        parseInt(newLevel) > selectedProvider.level 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-orange-50 text-orange-700'
                      }`}>
                        {parseInt(newLevel) > selectedProvider.level ? (
                          <span className="flex items-center">
                            <ArrowUp className="w-4 h-4 mr-1" />
                            升级: {getLevelName(selectedProvider.level)} → {getLevelName(parseInt(newLevel))}
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <ArrowDown className="w-4 h-4 mr-1" />
                            降级: {getLevelName(selectedProvider.level)} → {getLevelName(parseInt(newLevel))}
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleAdjustLevel}
                      disabled={parseInt(newLevel) === selectedProvider.level || adjustingLevel}
                      className="w-full btn-primary !py-2.5 disabled:opacity-50"
                    >
                      {adjustingLevel ? '调整中...' : '确认调整'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
