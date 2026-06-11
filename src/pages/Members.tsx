import { useState, useEffect } from "react"
import { UserPlus, Pencil, Trash2, X, CheckCircle2, XCircle, Link2, Send } from "lucide-react"
import type { Member } from "@/types"
import { useAppStore } from "@/store"
import { getRoleLabel, formatTime } from "@/utils/format"

const ROLE_BADGE: Record<string, string> = {
  primary_guardian: "bg-guardian-blue/20 text-guardian-blue",
  temporary_caregiver: "bg-guardian-orange/20 text-guardian-orange",
  school_admin: "bg-purple-500/20 text-purple-400",
}

const AVATAR_COLORS = ["bg-guardian-blue", "bg-guardian-orange", "bg-guardian-green", "bg-purple-500", "bg-pink-500"]

const PERMISSIONS = ["设备管理", "成员管理", "围栏设置", "通话管理", "告警处理", "隐私策略", "数据分析"]

const ROLE_PERMS: Record<string, boolean[]> = {
  primary_guardian: [true, true, true, true, true, true, true],
  temporary_caregiver: [false, false, false, true, true, false, false],
  school_admin: [false, false, true, false, true, false, false],
}

const INVITABLE_ROLES: { value: Member["role"]; label: string }[] = [
  { value: "temporary_caregiver", label: "临时看护人" },
  { value: "school_admin", label: "学校管理员" },
]

function Initials({ name, idx }: { name: string; idx: number }) {
  const ch = name.slice(0, 1)
  return (
    <div className={`w-12 h-12 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-lg`}>
      {ch}
    </div>
  )
}

export default function Members() {
  const { members, fetchMembers } = useAppStore()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [detailTarget, setDetailTarget] = useState<Member | null>(null)
  const [inviteForm, setInviteForm] = useState({ phone: "", role: "temporary_caregiver" as Member["role"] })
  const [editRole, setEditRole] = useState<Member["role"]>("temporary_caregiver")

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const openEdit = (m: Member) => {
    setEditTarget(m)
    setEditRole(m.role)
  }

  const inviteLink = Math.random().toString(36).slice(2, 10).toUpperCase()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">成员后台管理</h1>
          <p className="text-sm text-gray-500 mt-1">家庭成员、角色权限和成员详情</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setInviteOpen(true)}>
          <UserPlus size={18} /> 邀请成员
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {members.map((m, i) => (
          <div key={m.id} className="card-hover group relative">
            <div className="flex items-center gap-3 mb-3">
              <Initials name={m.name} idx={i} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.name}</div>
                <div className="text-xs text-gray-500 font-mono">{m.phone}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[m.role]}`}>
                {getRoleLabel(m.role)}
              </span>
              <span className="text-xs text-gray-500">加入于 {formatTime(m.joinedAt)}</span>
            </div>
            <button
              className="mt-4 w-full rounded-lg border border-guardian-dark-500 px-3 py-2 text-sm text-gray-300 hover:border-guardian-blue hover:text-white"
              onClick={() => setDetailTarget(m)}
            >
              查看成员详情
            </button>
            <div className="absolute top-3 right-3 hidden group-hover:flex gap-1">
              <button className="p-1.5 rounded bg-guardian-dark-600 hover:bg-guardian-dark-500" onClick={() => openEdit(m)}>
                <Pencil size={14} className="text-gray-300" />
              </button>
              <button className="p-1.5 rounded bg-guardian-dark-600 hover:bg-guardian-dark-500">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-bold text-lg mb-4">角色权限矩阵</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-guardian-dark-500">
                <th className="text-left py-2 text-gray-400 font-medium w-32">权限</th>
                <th className="text-center py-2 text-gray-400 font-medium">主监护人</th>
                <th className="text-center py-2 text-gray-400 font-medium">临时看护人</th>
                <th className="text-center py-2 text-gray-400 font-medium">学校管理员</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm, ri) => (
                <tr key={perm} className="border-b border-guardian-dark-600">
                  <td className="py-2.5 text-gray-300">{perm}</td>
                  {(["primary_guardian", "temporary_caregiver", "school_admin"] as const).map(role => (
                    <td key={role} className="text-center py-2.5">
                      {ROLE_PERMS[role][ri]
                        ? <CheckCircle2 size={18} className="text-guardian-green mx-auto" />
                        : <XCircle size={18} className="text-gray-600 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setInviteOpen(false)}>
          <div className="card w-96 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">邀请成员</h3>
              <button onClick={() => setInviteOpen(false)}><X size={18} className="text-gray-400 hover:text-white" /></button>
            </div>
            <input placeholder="手机号码" value={inviteForm.phone}
              onChange={e => setInviteForm(s => ({ ...s, phone: e.target.value }))}
              className="w-full bg-guardian-dark-800 border border-guardian-dark-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-guardian-blue" />
            <select value={inviteForm.role}
              onChange={e => setInviteForm(s => ({ ...s, role: e.target.value as Member["role"] }))}
              className="w-full bg-guardian-dark-800 border border-guardian-dark-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-guardian-blue">
              {INVITABLE_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <div className="flex items-center gap-2 bg-guardian-dark-800 rounded-lg px-3 py-2">
              <Link2 size={14} className="text-gray-500" />
              <span className="text-xs text-gray-400 font-mono flex-1 truncate">https://guardian.app/invite/{inviteLink}</span>
            </div>
            <button className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={() => setInviteOpen(false)}>
              <Send size={14} /> 发送邀请
            </button>
          </div>
        </div>
      )}

      {detailTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setDetailTarget(null)}>
          <div className="card w-[420px] space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">成员详情</h3>
              <button onClick={() => setDetailTarget(null)}><X size={18} className="text-gray-400 hover:text-white" /></button>
            </div>
            <div className="flex items-center gap-3">
              <Initials name={detailTarget.name} idx={members.findIndex((m) => m.id === detailTarget.id)} />
              <div>
                <div className="text-lg font-semibold text-white">{detailTarget.name}</div>
                <div className="text-xs text-gray-500 font-mono">{detailTarget.phone}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-guardian-dark-800 p-3">
                <div className="text-gray-500 mb-1">当前角色</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[detailTarget.role]}`}>
                  {getRoleLabel(detailTarget.role)}
                </span>
              </div>
              <div className="rounded-lg bg-guardian-dark-800 p-3">
                <div className="text-gray-500 mb-1">加入时间</div>
                <div className="text-gray-200">{formatTime(detailTarget.joinedAt)}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-2">权限详情</div>
              <div className="flex flex-wrap gap-2">
                {PERMISSIONS.map((perm, index) => (
                  <span
                    key={perm}
                    className={`text-xs px-2 py-1 rounded-full ${
                      ROLE_PERMS[detailTarget.role][index]
                        ? "bg-guardian-green/15 text-guardian-green"
                        : "bg-guardian-dark-700 text-gray-500"
                    }`}
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
            <button className="btn-primary w-full" onClick={() => setDetailTarget(null)}>关闭详情</button>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setEditTarget(null)}>
          <div className="card w-96 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">编辑角色</h3>
              <button onClick={() => setEditTarget(null)}><X size={18} className="text-gray-400 hover:text-white" /></button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              当前角色：
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[editTarget.role]}`}>
                {getRoleLabel(editTarget.role)}
              </span>
            </div>
            <select value={editRole} onChange={e => setEditRole(e.target.value as Member["role"])}
              className="w-full bg-guardian-dark-800 border border-guardian-dark-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-guardian-blue">
              {(["primary_guardian", "temporary_caregiver", "school_admin"] as const).map(r => (
                <option key={r} value={r}>{getRoleLabel(r)}</option>
              ))}
            </select>
            <button className="btn-primary w-full" onClick={() => setEditTarget(null)}>保存</button>
          </div>
        </div>
      )}
    </div>
  )
}
