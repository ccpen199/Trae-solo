import { useState } from 'react'
import { Save } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { cn } from '@/lib/utils'

const roles = ['超级管理员', '物业管理员', '维修人员', '安保人员', '财务人员', '普通业主']

const modules = [
  '工作台', '门禁通行', '设备管理', '报事报修', '邻里圈',
  '物业缴费', '公告管理', '组织架构', '权限管理', '设备告警', '统计报表',
]

const initialMatrix: Record<string, Record<string, boolean>> = {
  '超级管理员': Object.fromEntries(modules.map((m) => [m, true])),
  '物业管理员': Object.fromEntries(modules.map((m) => [m, ['工作台', '门禁通行', '设备管理', '报事报修', '邻里圈', '物业缴费', '公告管理', '设备告警', '统计报表'].includes(m)])),
  '维修人员': Object.fromEntries(modules.map((m) => [m, ['工作台', '设备管理', '报事报修', '设备告警'].includes(m)])),
  '安保人员': Object.fromEntries(modules.map((m) => [m, ['工作台', '门禁通行', '设备管理', '设备告警'].includes(m)])),
  '财务人员': Object.fromEntries(modules.map((m) => [m, ['工作台', '物业缴费', '统计报表'].includes(m)])),
  '普通业主': Object.fromEntries(modules.map((m) => [m, ['工作台', '门禁通行', '报事报修', '邻里圈', '物业缴费', '公告管理'].includes(m)])),
}

export default function PermissionMatrix() {
  const [matrix, setMatrix] = useState(initialMatrix)
  const [saving, setSaving] = useState(false)

  const togglePermission = (role: string, module: string) => {
    if (role === '超级管理员') return
    setMatrix((prev) => ({
      ...prev,
      [role]: { ...prev[role], [module]: !prev[role][module] },
    }))
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 800)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="权限管理"
        subtitle="配置角色功能权限"
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:bg-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Save size={16} />{saving ? '保存中...' : '保存配置'}
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase text-left sticky left-0 bg-slate-50 z-10 min-w-[120px]">
                  角色 \ 模块
                </th>
                {modules.map((m) => (
                  <th key={m} className="px-4 py-3 text-xs font-medium text-slate-500 text-center min-w-[80px]">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map((role) => (
                <tr key={role} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-100">
                    {role}
                  </td>
                  {modules.map((m) => {
                    const checked = matrix[role]?.[m] ?? false
                    const isSuperAdmin = role === '超级管理员'
                    return (
                      <td key={m} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(role, m)}
                          disabled={isSuperAdmin}
                          className={cn(
                            'w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer',
                            checked && 'bg-emerald-500 border-emerald-500',
                            isSuperAdmin && 'cursor-not-allowed'
                          )}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
