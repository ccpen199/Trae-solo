import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Shield, CheckCircle, Clock, Store, Package, MessageSquare, Trophy, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface MerchantInfo {
  id: number
  name: string
  status: string
}

const merchantStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'text-yellow-600' },
  approved: { label: '已通过', color: 'text-green-600' },
  rejected: { label: '已拒绝', color: 'text-red-600' },
}

export default function Profile() {
  const { user, fetchProfile } = useAuthStore()
  const [realName, setRealName] = useState('')
  const [phone, setPhone] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [verifyRealName, setVerifyRealName] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (user) {
      setRealName(user.real_name || '')
      setPhone(user.phone || '')
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    api.get<{ list: MerchantInfo[]; total: number }>('/merchants')
      .then((data) => {
        const mine = (data.list as any[]).find((m) => m.user_id === user.id)
        if (mine) setMerchantInfo({ id: mine.id, name: mine.name, status: mine.status })
      })
      .catch(() => {})
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.put('/auth/profile', { real_name: realName, phone })
      await fetchProfile()
      setEditing(false)
      setMessage({ type: 'success', text: '保存成功' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '保存失败' })
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    if (!verifyRealName.trim()) return
    setVerifying(true)
    try {
      await api.put('/auth/profile', { real_name: verifyRealName.trim() })
      await fetchProfile()
      setMessage({ type: 'success', text: '实名认证提交成功' })
      setVerifyRealName('')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '认证失败' })
    } finally {
      setVerifying(false)
    }
  }

  const roleBadgeColor: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    user: 'bg-blue-100 text-blue-700',
    merchant: 'bg-green-100 text-green-700',
  }

  const roleLabel: Record<string, string> = {
    admin: '管理员',
    user: '用户',
    merchant: '商家',
  }

  const isVerified = !!user?.real_name

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">个人中心</h1>

      {message && (
        <div className={`${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'} px-4 py-2 rounded mb-4 text-sm`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-gray-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.username}</h2>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${roleBadgeColor[user?.role || 'user'] || 'bg-gray-100 text-gray-700'}`}>
              {roleLabel[user?.role || 'user'] || user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-500">{user?.username}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
            {editing ? (
              <input
                type="text"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="请输入真实姓名"
              />
            ) : (
              <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50">{user?.real_name || '未填写'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            {editing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="请输入手机号"
              />
            ) : (
              <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50">{user?.phone || '未填写'}</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setRealName(user?.real_name || '')
                  setPhone(user?.phone || '')
                  setMessage(null)
                }}
                className="border border-gray-300 text-gray-700 font-medium px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-md transition-colors"
            >
              编辑资料
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          实名认证
        </h2>
        {isVerified ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">已实名</span>
            <span className="text-gray-500 text-sm ml-2">{user?.real_name}</span>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-3">完成实名认证后可享受更多服务</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={verifyRealName}
                onChange={(e) => setVerifyRealName(e.target.value)}
                placeholder="请输入真实姓名"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleVerify}
                disabled={verifying || !verifyRealName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {verifying ? '提交中...' : '提交实名认证'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          账户信息
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">注册时间</span>
            <span className="text-gray-700">{user?.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '-'}</span>
          </div>
          {user?.region_code && (
            <div className="flex justify-between">
              <span className="text-gray-500">地区</span>
              <span className="text-gray-700">{user.region_code}</span>
            </div>
          )}
        </div>
      </div>

      {merchantInfo && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-500" />
            商户身份
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">商户名称</span>
              <span className="text-gray-700">{merchantInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">审核状态</span>
              <span className={`font-medium ${merchantStatusConfig[merchantInfo.status]?.color || 'text-gray-600'}`}>
                {merchantStatusConfig[merchantInfo.status]?.label || merchantInfo.status}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷入口</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link
            to="/orders"
            className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Package className="w-6 h-6 text-red-500" />
            <span className="text-sm text-gray-700">我的订单</span>
          </Link>
          <Link
            to="/topics"
            className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-6 h-6 text-blue-500" />
            <span className="text-sm text-gray-700">我的投票</span>
          </Link>
          <Link
            to="/quizzes"
            className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Trophy className="w-6 h-6 text-purple-500" />
            <span className="text-sm text-gray-700">我的答题</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
