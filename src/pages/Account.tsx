import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getAccountProfile, updateAccountProfile, changePassword, bindCertificate, getAuditLogs } from '@/lib/api'
import { User, Lock, Shield, History, Save, Key } from 'lucide-react'

export default function Account() {
  const { user } = useAppStore()
  const [profile, setProfile] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('profile')
  const [editForm, setEditForm] = useState({ real_name: '', phone: '' })
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const res = await getAccountProfile()
    if (res.success && res.data) {
      setProfile(res.data)
      setEditForm({ real_name: res.data.real_name || '', phone: res.data.phone || '' })
    }
    const logRes = await getAuditLogs()
    if (logRes.success && logRes.data) setLogs(logRes.data as any[])
  }

  async function handleUpdateProfile() {
    const res = await updateAccountProfile(editForm)
    if (res.success) setMessage('更新成功')
    else setMessage(res.error || '更新失败')
    setTimeout(() => setMessage(''), 2000)
  }

  async function handleChangePassword() {
    if (pwForm.new_password !== pwForm.confirm) { setMessage('两次密码不一致'); setTimeout(() => setMessage(''), 2000); return }
    const res = await changePassword(pwForm.old_password, pwForm.new_password)
    if (res.success) { setMessage('密码修改成功'); setPwForm({ old_password: '', new_password: '', confirm: '' }) }
    else { setMessage(res.error || '修改失败') }
    setTimeout(() => setMessage(''), 2000)
  }

  async function handleBindCert() {
    const res = await bindCertificate(`CERT-${Date.now()}`)
    if (res.success) { setMessage('证书绑定成功'); loadData() }
    else setMessage(res.error || '绑定失败')
    setTimeout(() => setMessage(''), 2000)
  }

  const roleLabels: Record<string, string> = { taxpayer: '纳税人', admin: '管理员', agent: '代理' }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">账户中心</h1>

      {message && <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-2 rounded-lg">{message}</div>}

      <div className="flex gap-2 mb-4">
        {[
          { key: 'profile', label: '基本信息', icon: User },
          { key: 'security', label: '安全设置', icon: Lock },
          { key: 'certificate', label: '数字证书', icon: Shield },
          { key: 'logs', label: '操作日志', icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === key ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && profile && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">{profile.username}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">{roleLabels[profile.role]}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input type="text" value={editForm.real_name} onChange={e => setEditForm({...editForm, real_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
              <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <button onClick={handleUpdateProfile} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">
              <Save size={14} /> 保存修改
            </button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">修改密码</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">原密码</label>
              <input type="password" value={pwForm.old_password} onChange={e => setPwForm({...pwForm, old_password: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
              <input type="password" value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <button onClick={handleChangePassword} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">
              <Key size={14} /> 修改密码
            </button>
          </div>
        </div>
      )}

      {activeTab === 'certificate' && profile && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">数字证书</h2>
          {profile.digital_cert ? (
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-700 mb-2">
                <Shield size={18} /> <span className="font-medium">证书已绑定</span>
              </div>
              <div className="text-sm text-gray-600">证书编号：<span className="font-mono">{profile.digital_cert}</span></div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 mb-4">尚未绑定数字证书</p>
              <button onClick={handleBindCert} className="px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">绑定数字证书</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">操作</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">模块</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">详情</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">时间</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-900">{log.action}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{log.module}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{log.detail}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{log.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">暂无操作日志</div>}
        </div>
      )}
    </div>
  )
}
