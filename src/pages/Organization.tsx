import { useState } from 'react';
import { Building2, Plus, Edit3, Trash2, User, X, Save } from 'lucide-react';
import OrgTree from '@/components/OrgTree';
import type { OrgNode } from '@/components/OrgTree';

const mockOrgData: OrgNode[] = [
  {
    id: '1', name: '公交集团',
    children: [
      {
        id: '1-1', name: '一分公司',
        children: [{ id: '1-1-1', name: '一车队' }, { id: '1-1-2', name: '二车队' }],
      },
      {
        id: '1-2', name: '二分公司',
        children: [{ id: '1-2-1', name: '三车队' }, { id: '1-2-2', name: '四车队' }],
      },
    ],
  },
];

interface OrgUser {
  id: string;
  username: string;
  realName: string;
  role: string;
  phone: string;
  email: string;
}

const mockUsers: Record<string, OrgUser[]> = {
  '1-1-1': [
    { id: 'u1', username: 'zhangsan', realName: '张三', role: '司机', phone: '13800138001', email: 'zhangsan@example.com' },
    { id: 'u2', username: 'lisi', realName: '李四', role: '司机', phone: '13800138002', email: 'lisi@example.com' },
  ],
  '1-2-1': [
    { id: 'u3', username: 'wangwu', realName: '王五', role: '司机', phone: '13800138003', email: 'wangwu@example.com' },
  ],
  '1-2-2': [
    { id: 'u4', username: 'zhaoliu', realName: '赵六', role: '司机', phone: '13800138004', email: 'zhaoliu@example.com' },
  ],
};

export default function Organization() {
  const [selectedOrg, setSelectedOrg] = useState<OrgNode | null>(null);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newUser, setNewUser] = useState({ username: '', realName: '', role: '司机', phone: '', email: '' });

  const users = selectedOrg ? (mockUsers[selectedOrg.id] || []) : [];

  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 border-r border-surface-border bg-surface flex flex-col overflow-hidden">
        <div className="p-3 border-b border-surface-border flex items-center justify-between">
          <span className="text-sm font-medium text-white">组织架构</span>
          <div className="flex gap-1">
            <button onClick={() => setShowAddOrg(true)} className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-surface-light hover:text-primary transition-colors" title="新增组织">
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <OrgTree
            data={mockOrgData}
            selectedId={selectedOrg?.id}
            onSelect={setSelectedOrg}
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {selectedOrg ? (
          <div className="space-y-4">
            <div className="dark-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-primary" />
                  <h3 className="text-base font-medium text-white">{selectedOrg.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 rounded-md bg-surface-light px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                    <Edit3 size={12} /> 编辑
                  </button>
                  <button className="flex items-center gap-1 rounded-md bg-danger/10 px-3 py-1.5 text-xs text-danger hover:bg-danger/20 transition-colors">
                    <Trash2 size={12} /> 删除
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">组织ID</span>
                  <div className="font-mono text-white mt-1">{selectedOrg.id}</div>
                </div>
                <div>
                  <span className="text-gray-500">组织名称</span>
                  <div className="text-white mt-1">{selectedOrg.name}</div>
                </div>
                <div>
                  <span className="text-gray-500">下级组织</span>
                  <div className="text-white mt-1">{selectedOrg.children?.length || 0} 个</div>
                </div>
              </div>
            </div>

            <div className="dark-card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <User size={14} className="text-gray-500" />
                  人员列表 ({users.length})
                </h4>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors"
                >
                  <Plus size={12} /> 添加人员
                </button>
              </div>
              {users.length > 0 ? (
                <table className="dark-table">
                  <thead>
                    <tr>
                      <th>用户名</th>
                      <th>姓名</th>
                      <th>角色</th>
                      <th>电话</th>
                      <th>邮箱</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="font-mono text-gray-300">{u.username}</td>
                        <td className="text-white">{u.realName}</td>
                        <td className="text-gray-300">{u.role}</td>
                        <td className="font-mono text-gray-400">{u.phone}</td>
                        <td className="text-gray-400">{u.email}</td>
                        <td>
                          <div className="flex gap-2">
                            <button className="text-gray-400 hover:text-primary"><Edit3 size={12} /></button>
                            <button className="text-gray-400 hover:text-danger"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">暂无人员</div>
              )}
            </div>

            {showAddUser && (
              <div className="dark-card border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white">添加人员</h4>
                  <button onClick={() => setShowAddUser(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">用户名</label>
                    <input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">姓名</label>
                    <input value={newUser.realName} onChange={(e) => setNewUser({ ...newUser, realName: e.target.value })} className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">角色</label>
                    <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary">
                      <option>司机</option>
                      <option>调度员</option>
                      <option>管理员</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">电话</label>
                    <input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary" />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-gray-400">邮箱</label>
                    <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary" />
                  </div>
                </div>
                <button className="mt-3 flex items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-surface-dark hover:bg-primary-light transition-colors w-full">
                  <Save size={14} /> 保存
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            请从左侧选择一个组织节点
          </div>
        )}
      </div>

      {showAddOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="dark-card w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">新增组织</h3>
              <button onClick={() => setShowAddOrg(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">组织名称</label>
                <input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary" placeholder="输入组织名称" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">上级组织</label>
                <select className="w-full rounded-md border border-surface-border bg-surface-dark py-2 px-3 text-sm text-white outline-none focus:border-primary">
                  <option>公交集团</option>
                  <option>一分公司</option>
                  <option>二分公司</option>
                </select>
              </div>
              <button className="w-full rounded-md bg-primary py-2 text-sm font-medium text-surface-dark hover:bg-primary-light transition-colors">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
