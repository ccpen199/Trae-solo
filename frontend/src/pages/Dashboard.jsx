import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheckIcon,
  AcademicCapIcon,
  ScaleIcon,
  ShoppingBagIcon,
  CalculatorIcon,
  DocumentTextIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import { authAPI } from '../api/client'
import useAuthStore from '../store/authStore'

const Dashboard = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile()
        setProfile(res.data)
      } catch (err) {
        setError('获取用户信息失败')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const overviewCards = [
    { title: '社保缴纳状态', value: '正常', icon: ShieldCheckIcon, color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100' },
    { title: '面试进度', value: '3/5 轮', icon: AcademicCapIcon, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
    { title: '合规分数', value: '92分', icon: ScaleIcon, color: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-100' },
    { title: '福利余额', value: '¥2,400', icon: ShoppingBagIcon, color: 'bg-orange-50 text-orange-600', iconBg: 'bg-orange-100' },
  ]

  const quickActions = [
    { label: '社保测算', path: '/social-security', icon: CalculatorIcon, color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'AI面试', path: '/ai-interview', icon: AcademicCapIcon, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: '简历优化', path: '/resume-optimize', icon: DocumentTextIcon, color: 'bg-purple-600 hover:bg-purple-700' },
    { label: '合规咨询', path: '/compliance', icon: ScaleIcon, color: 'bg-green-600 hover:bg-green-700' },
    { label: '合同扫描', path: '/contract-scan', icon: ShieldCheckIcon, color: 'bg-red-600 hover:bg-red-700' },
    { label: '福利商城', path: '/mall', icon: ShoppingBagIcon, color: 'bg-orange-600 hover:bg-orange-700' },
  ]

  const recentActivities = [
    { text: '完成了北京社保测算', time: '2小时前', type: '社保' },
    { text: '参加了前端开发AI面试', time: '1天前', type: '面试' },
    { text: '提交了劳动合同扫描', time: '2天前', type: '合同' },
    { text: '兑换了电影票兑换码', time: '3天前', type: '福利' },
    { text: '查询了劳动法相关条款', time: '5天前', type: '合规' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <div key={card.title} className={`${card.color} rounded-xl p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`${action.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors`}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">最近动态</h3>
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {recentActivities.map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <LightBulbIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{activity.text}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {activity.type}
                </span>
                <span className="text-sm text-gray-400">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
