import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User, Phone, CreditCard, Users, Plus, ShieldCheck,
  FileText, ClipboardList, History, ArrowRight, X
} from 'lucide-react'
import { useUserStore } from '@/store/user'
import type { Relative } from '@/store/user'

const QUICK_ENTRIES = [
  { icon: <ShieldCheck className="w-5 h-5" />, label: '我的社保', to: '/social-security' },
  { icon: <FileText className="w-5 h-5" />, label: '我的证照', to: '/certificates' },
  { icon: <ClipboardList className="w-5 h-5" />, label: '我的办理', to: '/tracking' },
  { icon: <History className="w-5 h-5" />, label: '操作记录', to: '/audit' },
]

export default function Profile() {
  const { user, actingAs, setActingAs, setUser } = useUserStore()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', relation: '', idCard: '' })

  if (!user) {
    return (
      <div className="text-center py-16 text-text-muted animate-fadeIn">
        <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>未登录</p>
        <Link to="/login" className="text-primary text-sm mt-2 inline-block hover:underline">去登录</Link>
      </div>
    )
  }

  const actingRelative = actingAs ? user.relatives.find((r) => r.id === actingAs) : null

  const handleAddRelative = () => {
    if (!form.name || !form.relation || !form.idCard) return
    const newRelative: Relative = {
      id: `rel-${Date.now()}`,
      name: form.name,
      relation: form.relation,
      idCardMasked: form.idCard.slice(0, 3) + '****' + form.idCard.slice(-4),
      authorized: false,
    }
    setUser({ ...user, relatives: [...user.relatives, newRelative] })
    setForm({ name: '', relation: '', idCard: '' })
    setShowAdd(false)
  }

  return (
    <div className="max-w-lg mx-auto animate-fadeIn">
      <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
            {user.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{user.name}</h2>
              {user.realNameVerified && (
                <span className="inline-flex items-center gap-0.5 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  <ShieldCheck className="w-3 h-3" /> 已认证
                </span>
              )}
            </div>
            <p className="text-sm opacity-80 mt-1">实名认证用户</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-primary shrink-0" />
          <span className="text-sm text-text-muted">手机号</span>
          <span className="ml-auto text-sm font-medium">{user.phone}</span>
        </div>
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-primary shrink-0" />
          <span className="text-sm text-text-muted">身份证</span>
          <span className="ml-auto text-sm font-medium">{user.idCard}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-text-dark flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> 亲属管理
          </h3>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Plus className="w-4 h-4" /> 添加亲属
          </button>
        </div>
        {user.relatives.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">暂无绑定亲属</p>
        ) : (
          <div className="space-y-2">
            {user.relatives.map((rel) => (
              <div key={rel.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{rel.name}</p>
                  <p className="text-xs text-text-muted">{rel.relation} · {rel.idCardMasked}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${rel.authorized ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-text-muted'}`}>
                  {rel.authorized ? '已授权' : '未授权'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {actingRelative && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">代办模式</p>
            <p className="text-xs text-yellow-600">正在以 {actingRelative.name} 身份操作</p>
          </div>
          <button
            onClick={() => setActingAs(null)}
            className="text-sm text-yellow-800 font-medium hover:underline"
          >
            切换回本人
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-4">
        {QUICK_ENTRIES.map((entry) => (
          <Link
            key={entry.label}
            to={entry.to}
            className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
          >
            <div className="text-primary">{entry.icon}</div>
            <span className="text-xs text-text-dark">{entry.label}</span>
          </Link>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-dark">添加亲属</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="姓名"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                placeholder="关系（如：配偶、子女）"
                value={form.relation}
                onChange={(e) => setForm({ ...form, relation: e.target.value })}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                placeholder="身份证号"
                value={form.idCard}
                onChange={(e) => setForm({ ...form, idCard: e.target.value })}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleAddRelative}
                className="w-full bg-primary text-white rounded-xl py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
