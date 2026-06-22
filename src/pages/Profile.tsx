import React from 'react'
import { useAppStore } from '../store'
import { Shield, Lock, Database, User as UserIcon, Phone, Star } from 'lucide-react'

export const Profile: React.FC = () => {
  const { currentUser, tasks, reviews, technicians } = useAppStore()

  const myTasks = tasks.filter(t => t.userId === currentUser?.id)
  const myReviews = reviews.filter(r => r.fromUserId === currentUser?.id)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">个人中心</h2>

      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
            {currentUser?.name[0] || 'U'}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{currentUser?.name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Phone className="w-4 h-4" />
              {currentUser?.phone}
            </p>
          </div>
          <span className="badge-info">
            {currentUser?.role === 'user' ? '发单方' : '接单方'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-primary-600">{myTasks.length}</p>
          <p className="text-sm text-gray-500 mt-1">我的订单</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-warning-500">{myReviews.length}</p>
          <p className="text-sm text-gray-500 mt-1">我的评价</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-success-600">
            {myTasks.filter(t => t.status === 'completed' || t.status === 'paid' || t.status === 'reviewed').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">已完成</p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-600" />
          数据安全与隐私
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-success-50 rounded-lg">
            <Lock className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-success-800 text-sm">本地AES加密存储</p>
              <p className="text-xs text-success-700 mt-1">
                所有订单、评价、支付凭证均使用AES-256加密存储在您的浏览器本地IndexedDB中，平台不存储任何交易数据。
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg">
            <Database className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary-800 text-sm">去中心化交易</p>
              <p className="text-xs text-primary-700 mt-1">
                平台不收取任何佣金，交易由发单方和接单方直接协商完成，您的交易数据完全自主可控。
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-warning-50 rounded-lg">
            <UserIcon className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning-800 text-sm">双向互评机制</p>
              <p className="text-xs text-warning-700 mt-1">
                差评触发自动冻结机制，需人工复核后方可解禁，保障双方权益。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-gray-600" />
          平台师傅（{technicians.filter(t => !t.frozen).length}位在线）
        </h3>
        <div className="space-y-2">
          {technicians.map(tech => (
            <div key={tech.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                {tech.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tech.name}</span>
                  {tech.frozen ? (
                    <span className="badge-danger">已冻结</span>
                  ) : tech.certificates.some(c => c.verified) ? (
                    <span className="badge-success">已认证</span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500">
                  评分{tech.rating} · {tech.reviewCount}单 · 服务半径{tech.serviceRadius}公里
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
