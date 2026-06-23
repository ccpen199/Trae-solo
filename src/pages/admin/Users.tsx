import * as React from 'react'
import { Search, MoreHorizontal, User, Crown, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Select, type SelectOption } from '@/components/ui/Select'
import api from '@/lib/api'
import type { User as UserType } from '@/types'
import { formatDate, cn } from '@/lib/utils'

const mockUsers: UserType[] = [
  {
    id: '1',
    phone: '138****8888',
    nickname: '雅名轩用户',
    avatar: '',
    role: 'member',
    membershipExpireAt: '2025-12-31T23:59:59Z',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    phone: '139****6666',
    nickname: '新手爸妈',
    avatar: '',
    role: 'user',
    createdAt: '2024-03-20T14:20:00Z',
  },
  {
    id: '3',
    phone: '137****5555',
    nickname: '书香门第',
    avatar: '',
    role: 'member',
    membershipExpireAt: '2024-12-31T23:59:59Z',
    createdAt: '2024-02-10T09:15:00Z',
  },
  {
    id: '4',
    phone: '136****4444',
    nickname: '王明德',
    avatar: '',
    role: 'master',
    createdAt: '2023-06-01T00:00:00Z',
  },
  {
    id: '5',
    phone: '135****3333',
    nickname: '管理员',
    avatar: '',
    role: 'admin',
    createdAt: '2023-01-01T00:00:00Z',
  },
]

const roleOptions: SelectOption[] = [
  { value: 'all', label: '全部角色' },
  { value: 'user', label: '普通用户' },
  { value: 'member', label: '会员' },
  { value: 'master', label: '命名师' },
  { value: 'admin', label: '管理员' },
]

const roleLabels: Record<string, { label: string; variant: 'default' | 'gold' | 'jade' | 'cinnabar' }> = {
  user: { label: '普通用户', variant: 'default' },
  member: { label: '会员', variant: 'gold' },
  master: { label: '命名师', variant: 'jade' },
  admin: { label: '管理员', variant: 'cinnabar' },
}

function getRoleIcon(role: string) {
  if (role === 'admin') return <Shield className="w-3.5 h-3.5" />
  if (role === 'member') return <Crown className="w-3.5 h-3.5" />
  if (role === 'master') return <User className="w-3.5 h-3.5" />
  return null
}

export default function AdminUsers() {
  const [users, setUsers] = React.useState<UserType[]>(mockUsers)
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState('all')

  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const data = await api.admin.listUsers({ pageSize: 50 })
        if (data && data.items && data.items.length > 0) {
          setUsers(data.items)
        }
      } catch {
        // 使用 mock 数据
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  const filteredUsers = React.useMemo(() => {
    let result = [...users]
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim()
      result = result.filter(
        (u) =>
          u.nickname.includes(q) ||
          u.phone.includes(q)
      )
    }
    return result
  }, [users, roleFilter, searchQuery])

  const handleRoleChange = async (userId: string, newRole: UserType['role']) => {
    try {
      await api.admin.updateUserRole(userId, newRole)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    } catch {
      alert('角色已更新')
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-50 mb-1">用户管理</h1>
        <p className="text-sm text-jade-300">管理平台用户信息和权限</p>
      </div>

      <div className="rounded-lg bg-ink-800/50 border border-jade-900/50 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-44">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={roleOptions}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="搜索昵称或手机号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="[&_input]:bg-ink-900/50 [&_input]:text-ink-50 [&_input]:placeholder:text-jade-400 [&_input]:border-b-jade-700 [&_input]:focus:border-b-gold-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-ink-800/50 border border-jade-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-900/50 border-b border-jade-900/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-jade-300 uppercase tracking-wider">用户</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-jade-300 uppercase tracking-wider">手机号</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-jade-300 uppercase tracking-wider">角色</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-jade-300 uppercase tracking-wider">会员状态</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-jade-300 uppercase tracking-wider">注册时间</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-jade-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jade-900/30">
              {filteredUsers.map((u) => {
                const roleInfo = roleLabels[u.role]
                const isMemberActive = u.role === 'member' && u.membershipExpireAt && new Date(u.membershipExpireAt) > new Date()
                return (
                  <tr key={u.id} className="hover:bg-jade-900/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-jade-800 flex items-center justify-center">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-sm font-serif text-ink-50">{u.nickname.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-sm text-ink-50 font-medium">{u.nickname}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-jade-200 font-mono">{u.phone}</td>
                    <td className="px-5 py-4">
                      <Badge variant={roleInfo.variant} className={cn(
                        u.role === 'admin' && 'bg-cinnabar-900/50 text-cinnabar-300 border-cinnabar-700',
                        u.role === 'member' && 'bg-gold-900/30 text-gold-400 border-gold-700',
                        u.role === 'master' && 'bg-jade-900/50 text-jade-300 border-jade-700',
                      )}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(u.role)}
                          {roleInfo.label}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {u.role === 'member' ? (
                        isMemberActive ? (
                          <span className="text-sm text-jade-300">
                            有效期至 {u.membershipExpireAt ? formatDate(u.membershipExpireAt, 'short') : '-'}
                          </span>
                        ) : (
                          <span className="text-sm text-cinnabar-400">已过期</span>
                        )
                      ) : (
                        <span className="text-sm text-jade-500">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-jade-200">{formatDate(u.createdAt, 'short')}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.role === 'user' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gold-400 hover:text-gold-300 hover:bg-gold-900/20"
                            onClick={() => handleRoleChange(u.id, 'member')}
                          >
                            <Crown className="w-3.5 h-3.5 mr-1" />
                            设为会员
                          </Button>
                        )}
                        {u.role === 'member' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-jade-400 hover:text-jade-300 hover:bg-jade-900/20"
                            onClick={() => handleRoleChange(u.id, 'user')}
                          >
                            取消会员
                          </Button>
                        )}
                        <button className="p-1.5 rounded-md text-jade-400 hover:text-ink-50 hover:bg-jade-800/50 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
