import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Users, Search, Filter, Shield, GraduationCap, Building2, UserCog, Phone } from 'lucide-react';

const MOCK_USERS = [
  { id: '1', account: '2021001', name: '李明', role: 'student', studentNo: '2021001', phone: '13811110001', status: 'active', createdAt: '2024-09-01' },
  { id: '2', account: '2021002', name: '王芳', role: 'student', studentNo: '2021002', phone: '13811110002', status: 'active', createdAt: '2024-09-02' },
  { id: '3', account: 'investor', name: '张总', role: 'investor', company: '清源科技投资有限公司', phone: '13900000001', status: 'active', createdAt: '2024-06-15' },
  { id: '4', account: 'admin', name: '系统管理员', role: 'admin', phone: '13800000000', status: 'active', createdAt: '2024-01-01' },
  { id: '5', account: '2021003', name: '张伟', role: 'student', studentNo: '2021003', phone: '13811110003', status: 'active', createdAt: '2024-09-03' },
  { id: '6', account: '2021004', name: '刘洋', role: 'student', studentNo: '2021004', phone: '13811110004', status: 'frozen', createdAt: '2024-09-04' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setUsers(MOCK_USERS);
      setLoading(false);
    }, 400);
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch = !search || u.name.includes(search) || u.account.includes(search) || u.phone.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleConfig: Record<string, { label: string; icon: JSX.Element; color: string }> = {
    student: { label: '学生', icon: <GraduationCap size={14} />, color: 'bg-blue-100 text-blue-700' },
    investor: { label: '投资商', icon: <Building2 size={14} />, color: 'bg-green-100 text-green-700' },
    admin: { label: '管理员', icon: <UserCog size={14} />, color: 'bg-vibrant-orange-100 text-vibrant-orange-700' },
  };

  if (loading) {
    return <AppLayout role="admin"><div className="flex items-center justify-center h-64"><div className="animate-pulse text-deep-blue-700">加载中...</div></div></AppLayout>;
  }

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-graphite-800">用户与角色管理</h2>
          <p className="text-sm text-graphite-500 mt-1">管理平台所有用户账户，分配角色权限</p>
        </div>

        <div className="glass-card p-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[240px] relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名、账号、手机号..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-graphite-50 border-2 border-transparent focus:border-aqua-400 focus:bg-white focus:outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-graphite-500" />
            {(['all', 'student', 'investor', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                  roleFilter === r
                    ? 'bg-gradient-to-r from-deep-blue-700 to-aqua-500 text-white shadow-md'
                    : 'bg-graphite-100 text-graphite-600 hover:bg-graphite-200'
                }`}
              >
                {r === 'all' ? '全部角色' : roleConfig[r].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['all', 'student', 'investor', 'admin'] as const).map((r) => {
            const count = r === 'all' ? users.length : users.filter((u) => u.role === r).length;
            const cfg = r === 'all' ? { label: '全部用户', icon: <Users size={18} />, color: 'from-deep-blue-600 to-deep-blue-800' } : { label: roleConfig[r].label, icon: roleConfig[r].icon, color: r === 'student' ? 'from-blue-500 to-blue-700' : r === 'investor' ? 'from-green-500 to-green-700' : 'from-vibrant-orange-500 to-vibrant-orange-600' };
            return (
              <div key={r} className={`glass-card p-4 cursor-pointer transition-all ${roleFilter === r ? 'ring-2 ring-aqua-400 -translate-y-0.5' : 'hover:shadow-md'}`} onClick={() => setRoleFilter(r)}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color as string} text-white flex items-center justify-center`}>{cfg.icon}</div>
                  <div>
                    <p className="text-2xl font-display font-bold text-graphite-800">{count}</p>
                    <p className="text-xs text-graphite-500">{cfg.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-graphite-100 hidden md:grid grid-cols-12 gap-4 text-xs font-semibold text-graphite-500 uppercase tracking-wider">
            <div className="col-span-3">用户信息</div>
            <div className="col-span-2">角色</div>
            <div className="col-span-2">联系方式</div>
            <div className="col-span-2">关联信息</div>
            <div className="col-span-1 text-center">状态</div>
            <div className="col-span-2 text-center">操作</div>
          </div>
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-graphite-500">
              <Users size={40} className="mx-auto mb-3 text-graphite-300" />暂无匹配用户
            </div>
          ) : (
            <div className="divide-y divide-graphite-100">
              {filteredUsers.map((u) => {
                const rc = roleConfig[u.role];
                return (
                  <div key={u.id} className="p-4 hover:bg-graphite-50/50 transition-colors md:grid md:grid-cols-12 md:gap-4 md:items-center">
                    <div className="col-span-3 flex items-center gap-3 mb-3 md:mb-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-deep-blue-100 to-aqua-100 flex items-center justify-center text-deep-blue-700 font-bold">
                        {u.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-graphite-800">{u.name}</p>
                        <p className="text-xs text-graphite-400 font-mono">账号：{u.account}</p>
                      </div>
                    </div>
                    <div className="col-span-2 mb-3 md:mb-0 pl-14 md:pl-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rc.color}`}>
                        {rc.icon}{rc.label}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-graphite-600 flex items-center gap-1 mb-3 md:mb-0 pl-14 md:pl-0">
                      <Phone size={14} className="text-graphite-400" />{u.phone}
                    </div>
                    <div className="col-span-2 text-sm text-graphite-600 mb-3 md:mb-0 pl-14 md:pl-0">
                      {u.role === 'student' && `学号 ${u.studentNo}`}
                      {u.role === 'investor' && u.company}
                      {u.role === 'admin' && '系统管理员'}
                    </div>
                    <div className="col-span-1 text-center mb-3 md:mb-0 pl-14 md:pl-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-graphite-200 text-graphite-600'}`}>
                        {u.status === 'active' ? '正常' : '已冻结'}
                      </span>
                    </div>
                    <div className="col-span-2 flex gap-2 pl-14 md:pl-0 md:justify-center">
                      <button className="px-3 py-1.5 text-xs rounded-lg bg-deep-blue-50 text-deep-blue-700 hover:bg-deep-blue-100 transition-colors flex items-center gap-1">
                        <Shield size={12} />权限
                      </button>
                      <button className="px-3 py-1.5 text-xs rounded-lg bg-graphite-100 text-graphite-700 hover:bg-graphite-200 transition-colors">
                        {u.status === 'active' ? '冻结' : '解冻'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
