import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Building2, Store, Users, Plus, Edit2, Trash2, UserPlus, Loader2, X, Save, UserMinus } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore, type UserRole } from '@/store/authStore'

interface OrgNode {
  id: number
  name: string
  type: 'company' | 'store' | 'team'
  parent_id: number | null
  director_id: number | null
  created_at: string
  children?: OrgNode[]
}

interface Member {
  id: number
  username: string
  name: string
  phone: string | null
  role: UserRole
  org_id: number
  org_name?: string
  cert_status: 'pending' | 'certified' | 'rejected'
}

const typeConfig = {
  company: { label: '公司', icon: Building2, color: 'text-blue-600' },
  store: { label: '门店', icon: Store, color: 'text-green-600' },
  team: { label: '团队', icon: Users, color: 'text-purple-600' },
}

const roleLabels: Record<string, string> = {
  director: '总监',
  manager: '经理',
  agent: '经纪人',
  admin: '系统管理员',
  platform: '平台运营',
  ops: '运维工程师',
}

const certStatusConfig = {
  pending: { label: '待认证', color: 'bg-amber-100 text-amber-700' },
  certified: { label: '已认证', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
}

interface OrgFormData {
  name: string
  type: 'company' | 'store' | 'team'
  parentId: string
}

export default function Organization() {
  const hasRole = useAuthStore(s => s.hasRole)
  const canManageOrg = hasRole('director', 'admin')
  const canManageMembers = hasRole('director', 'manager', 'admin')

  const [orgTree, setOrgTree] = useState<OrgNode[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [editingOrg, setEditingOrg] = useState<OrgNode | null>(null)
  const [orgFormData, setOrgFormData] = useState<OrgFormData>({ name: '', type: 'team', parentId: '' })
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('agent')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchOrgTree = async () => {
    try {
      const result = await api.get<OrgNode[]>('/organizations/tree')
      if (result.success && result.data) {
        setOrgTree(result.data || [])
      } else {
        console.error('获取组织架构失败:', result.error)
      }
    } catch (err) {
      console.error('Failed to fetch org tree:', err)
    }
  }

  const fetchMembers = async (orgId?: number | null) => {
    setLoading(true)
    try {
      const result = await api.get<Member[]>('/organizations/members', {
        orgId: orgId || undefined,
        pageSize: 100,
      })
      if (result.success && result.data) {
        setMembers(result.data || [])
      } else {
        console.error('获取成员列表失败:', result.error)
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgTree()
  }, [])

  useEffect(() => {
    fetchMembers(selectedOrgId)
  }, [selectedOrgId])

  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectOrg = (id: number) => {
    setSelectedOrgId(id === selectedOrgId ? null : id)
  }

  const handleAddOrg = (parentId?: number) => {
    setEditingOrg(null)
    setOrgFormData({
      name: '',
      type: parentId ? 'team' : 'store',
      parentId: parentId ? String(parentId) : '',
    })
    setShowOrgForm(true)
  }

  const handleEditOrg = (org: OrgNode) => {
    setEditingOrg(org)
    setOrgFormData({
      name: org.name,
      type: org.type,
      parentId: org.parent_id ? String(org.parent_id) : '',
    })
    setShowOrgForm(true)
  }

  const handleDeleteOrg = async (orgId: number) => {
    if (!confirm('确定要删除该组织吗？删除前请确保该组织下没有子组织和成员。')) return
    setDeletingId(orgId)
    try {
      await api.delete(`/organizations/${orgId}`)
      await fetchOrgTree()
      if (selectedOrgId === orgId) {
        setSelectedOrgId(null)
      }
    } catch (err) {
      console.error('Failed to delete org:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaveOrg = async () => {
    if (!orgFormData.name.trim()) return
    setSaving(true)
    try {
      if (editingOrg) {
        await api.put(`/organizations/${editingOrg.id}`, {
          name: orgFormData.name,
          type: orgFormData.type,
          parentId: orgFormData.parentId ? Number(orgFormData.parentId) : null,
        })
      } else {
        await api.post('/organizations', {
          name: orgFormData.name,
          type: orgFormData.type,
          parentId: orgFormData.parentId ? Number(orgFormData.parentId) : null,
        })
      }
      await fetchOrgTree()
      setShowOrgForm(false)
    } catch (err) {
      console.error('Failed to save org:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleChangeRole = (member: Member) => {
    setSelectedMember(member)
    setNewRole(member.role)
    setShowRoleModal(true)
  }

  const handleSaveRole = async () => {
    if (!selectedMember) return
    setSaving(true)
    try {
      await api.put(`/organizations/members/${selectedMember.id}/role`, { role: newRole })
      await fetchMembers(selectedOrgId)
      setShowRoleModal(false)
    } catch (err) {
      console.error('Failed to change role:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm('确定要移除该成员吗？')) return
    setDeletingId(memberId)
    try {
      await api.put(`/organizations/members`, { userId: memberId, orgId: null })
      await fetchMembers(selectedOrgId)
    } catch (err) {
      console.error('Failed to remove member:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const flattenOrgTree = (nodes: OrgNode[]): Array<{ id: number; name: string; type: string }> => {
    return nodes.reduce((acc, node) => {
      acc.push({ id: node.id, name: node.name, type: node.type })
      if (node.children) {
        acc.push(...flattenOrgTree(node.children))
      }
      return acc
    }, [] as Array<{ id: number; name: string; type: string }>)
  }

  const renderTreeNode = (node: OrgNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedOrgId === node.id
    const Icon = typeConfig[node.type].icon

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group',
            isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
          )}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <div
            className="flex-1 flex items-center gap-2 min-w-0"
            onClick={() => handleSelectOrg(node.id)}
          >
            <Icon className={cn('w-4 h-4 flex-shrink-0', typeConfig[node.type].color)} />
            <span className={cn('text-sm truncate', isSelected ? 'text-blue-700 font-medium' : 'text-gray-700')}>
              {node.name}
            </span>
            <span className="text-xs text-gray-400">{typeConfig[node.type].label}</span>
          </div>
          {canManageOrg && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleAddOrg(node.id)}
                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                title="添加子组织"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEditOrg(node)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="编辑"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteOrg(node.id)}
                disabled={deletingId === node.id}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                title="删除"
              >
                {deletingId === node.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">组织管理</h1>
            <p className="text-gray-500 mt-1">管理组织结构和成员</p>
          </div>
          {canManageOrg && (
            <button
              onClick={() => handleAddOrg()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              新增组织
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">组织架构</h2>
              <div className="space-y-1">
                {orgTree.map(node => renderTreeNode(node))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  成员列表
                  {selectedOrgId && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      {flattenOrgTree(orgTree).find(o => o.id === selectedOrgId)?.name}
                    </span>
                  )}
                </h2>
                {canManageMembers && (
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    添加成员
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">电话</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">认证状态</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-500">暂无成员</td>
                        </tr>
                      ) : (
                        members.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{member.username}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{roleLabels[member.role]}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{member.phone || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', certStatusConfig[member.cert_status].color)}>
                                {certStatusConfig[member.cert_status].label}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                              {canManageMembers && (
                                <>
                                  <button
                                    onClick={() => handleChangeRole(member)}
                                    className="text-blue-600 hover:text-blue-700 font-medium mr-3"
                                  >
                                    调整角色
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMember(member.id)}
                                    disabled={deletingId === member.id}
                                    className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                                  >
                                    {deletingId === member.id ? '移除中...' : '移除'}
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {showOrgForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingOrg ? '编辑组织' : '新增组织'}
                </h3>
                <button
                  onClick={() => setShowOrgForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">组织名称</label>
                  <input
                    type="text"
                    value={orgFormData.name}
                    onChange={(e) => setOrgFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入组织名称"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">组织类型</label>
                  <select
                    value={orgFormData.type}
                    onChange={(e) => setOrgFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="company">公司</option>
                    <option value="store">门店</option>
                    <option value="team">团队</option>
                  </select>
                </div>
                {!editingOrg && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">父级组织</label>
                    <select
                      value={orgFormData.parentId}
                      onChange={(e) => setOrgFormData(prev => ({ ...prev, parentId: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">无（顶级组织）</option>
                      {flattenOrgTree(orgTree).map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name}（{typeConfig[org.type as keyof typeof typeConfig].label}）
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowOrgForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveOrg}
                  disabled={saving || !orgFormData.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRoleModal && selectedMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">调整角色</h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">为 <span className="font-medium text-gray-900">{selectedMember.name}</span> 调整角色</p>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white mb-6"
              >
                <option value="agent">经纪人</option>
                <option value="manager">经理</option>
                <option value="director">总监</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
