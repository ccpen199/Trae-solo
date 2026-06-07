import { useState, useEffect } from 'react'
import { User, Phone, Edit3, Check, ShieldCheck, Shield, Star, MapPin } from 'lucide-react'
import { riders } from '../../api'
import { useAuthStore } from '../../store/auth'

export default function ProfilePage() {
  const { rider, updateRider } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(rider?.name || '')
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res: any = await riders.getProfile()
      setProfile(res)
      updateRider(res)
    } catch {
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await riders.updateProfile({ name })
      updateRider({ name })
      setEditing(false)
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const creditScore = profile?.credit_score || rider?.credit_score || 100
  const creditPercent = Math.min(100, Math.max(0, (creditScore / 150) * 100))

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-secondary">个人中心</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <User size={36} />
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
                <button onClick={handleSave} disabled={saving} className="p-1.5 text-success hover:bg-green-50 rounded">
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-secondary">{rider?.name}</h2>
                <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-primary">
                  <Edit3 size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Phone size={14} />
              {rider?.phone}
            </div>
            <div className="flex items-center gap-3 mt-3">
              {rider?.real_name_verified ? (
                <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                  <ShieldCheck size={12} /> 已实名
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">
                  <Shield size={12} /> 未实名
                </span>
              )}
              {!!rider?.insurance_id ? (
                <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                  <ShieldCheck size={12} /> 已绑保险
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  <Shield size={12} /> 未绑保险
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credit Score */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-display font-bold text-secondary mb-4">信用分</h3>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="#E5E7EB" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="42"
                stroke="#FF6B35"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${creditPercent * 2.64} 264`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-xl font-bold text-primary">{creditScore}</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>信用分越高，接单优先级越高</p>
            <p className="mt-1">当前等级：<span className="font-medium text-primary">{creditScore >= 120 ? '优秀' : creditScore >= 100 ? '良好' : creditScore >= 80 ? '一般' : '较差'}</span></p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-display font-bold text-secondary mb-4">状态信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-gray-500">当前状态：</span>
            <span className={`font-medium ${rider?.status === 'active' ? 'text-success' : 'text-gray-400'}`}>
              {rider?.status === 'active' ? '在线' : '离线'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={16} className="text-gray-400" />
            <span className="text-gray-500">余额：</span>
            <span className="font-medium text-primary">¥{rider?.balance?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
