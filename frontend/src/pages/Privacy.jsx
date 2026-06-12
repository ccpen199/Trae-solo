import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../App.jsx'

export default function Privacy() {
  const { user } = useAuth()
  const [info, setInfo] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [myData, setMyData] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [infoRes, requestsRes] = await Promise.all([
        api.get('/privacy/info'),
        api.get('/privacy/requests')
      ])
      setInfo(infoRes.data)
      setRequests(requestsRes.data.requests || [])
    } catch (err) {
      console.error('Failed to load privacy data:', err)
    } finally {
      setLoading(false)
    }
  }

  const requestExport = async () => {
    try {
      const res = await api.post('/privacy/export')
      alert(res.data.message || '导出请求已提交')
      loadData()
    } catch (err) {
      alert(err.response?.data?.error || '请求失败')
    }
  }

  const requestDelete = async () => {
    if (!confirm('确定要申请删除您的所有数据吗？此操作不可恢复！')) return
    if (!confirm('再次确认：您的所有数据将在7天内删除，期间可联系客服撤销。继续吗？')) return
    
    try {
      const res = await api.post('/privacy/delete')
      alert(res.data.message || '删除请求已提交')
      loadData()
    } catch (err) {
      alert(err.response?.data?.error || '请求失败')
    }
  }

  const viewMyData = async () => {
    try {
      const res = await api.get('/privacy/my-data')
      setMyData(res.data)
    } catch (err) {
      console.error('Failed to load my data:', err)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center">
          <span className="text-4xl mr-4">🔒</span>
          <div>
            <h2 className="text-2xl font-bold">隐私中心</h2>
            <p className="text-white/80 mt-1">GDPR 与个人信息保护合规</p>
          </div>
        </div>
        <div className="mt-4 flex space-x-4">
          {info?.gdpr_compliant && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">GDPR 合规</span>
          )}
          {info?.pipl_compliant && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">个保法合规</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">您的数据权利</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(info?.rights || []).map(right => (
            <div key={right.id} className="p-4 border border-gray-200 rounded-xl">
              <div className="font-medium text-gray-800">{right.name}</div>
              <div className="text-sm text-gray-500 mt-1">{right.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">数据分类</h3>
        <div className="space-y-4">
          {(info?.data_categories || []).map((cat, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800">{cat.category}</h4>
                  <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {cat.data_points.map((point, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {point}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl mb-3">📤</div>
          <h4 className="font-semibold text-gray-800">导出我的数据</h4>
          <p className="text-sm text-gray-500 mt-2">
            导出您的所有个人数据，包括设备信息、骑行记录、订单记录等
          </p>
          <button
            onClick={requestExport}
            className="mt-4 w-full py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            申请数据导出
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl mb-3">👁️</div>
          <h4 className="font-semibold text-gray-800">查看我的数据</h4>
          <p className="text-sm text-gray-500 mt-2">
            在线查看平台收集的您的所有数据
          </p>
          <button
            onClick={viewMyData}
            className="mt-4 w-full py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            查看数据详情
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
          <div className="text-3xl mb-3">🗑️</div>
          <h4 className="font-semibold text-red-700">删除我的数据</h4>
          <p className="text-sm text-gray-500 mt-2">
            请求删除您的所有个人数据，7天内可联系客服撤销
          </p>
          <button
            onClick={requestDelete}
            className="mt-4 w-full py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            申请删除账户
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">我的请求记录</h3>
        {requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  req.status === 'completed' ? 'bg-green-100 text-green-600' :
                  req.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {req.type === 'export' ? '📤' : '🗑️'}
                </div>
                <div className="ml-4 flex-1">
                  <div className="font-medium text-gray-800">
                    {req.type === 'export' ? '数据导出' : '数据删除'}
                  </div>
                  <div className="text-xs text-gray-500">
                    提交时间: {new Date(req.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    req.status === 'completed' ? 'bg-green-100 text-green-700' :
                    req.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {req.status === 'completed' ? '已完成' :
                     req.status === 'processing' ? '处理中' : '待处理'}
                  </span>
                  {req.download_url && (
                    <a
                      href={req.download_url}
                      className="block mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      下载文件 ↓
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
          暂无隐私请求记录
        </div>
        )}
      </div>

      {myData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">我的数据概览</h3>
            <button
              onClick={() => setMyData(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="p-6 overflow-y-auto scrollbar-thin flex-1">
            <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(myData, null, 2)}
            </pre>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
