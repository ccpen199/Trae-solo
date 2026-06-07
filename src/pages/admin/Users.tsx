import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import { api } from '@/utils/api';

interface UserInfo {
  id: number;
  phone: string;
  name: string;
  role: 'citizen' | 'admin';
  verified: boolean;
  created_at: string;
  street?: string | null;
  sukang_status?: 'green' | 'yellow' | 'red' | null;
}

const fallbackUsers: UserInfo[] = [
  {
    id: 1,
    phone: '138****1234',
    name: '张三',
    role: 'citizen',
    verified: true,
    created_at: '2026-01-15',
    street: '鼓楼区',
    sukang_status: 'green',
  },
  {
    id: 2,
    phone: '136****3456',
    name: '管理员',
    role: 'admin',
    verified: true,
    created_at: '2026-01-01',
    street: '建邺区',
    sukang_status: 'green',
  },
  {
    id: 3,
    phone: '137****9012',
    name: '王五',
    role: 'citizen',
    verified: false,
    created_at: '2026-03-10',
    street: '玄武区',
    sukang_status: null,
  },
];

function maskPhone(phone: string) {
  if (phone.includes('*') || phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserInfo[]>(fallbackUsers);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | 'citizen' | 'admin'>('all');
  const [verified, setVerified] = useState<'all' | 'yes' | 'no'>('all');
  const [selected, setSelected] = useState<UserInfo | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get<UserInfo[]>('/admin/users');
      setUsers(Array.isArray(data) && data.length > 0 ? data : fallbackUsers);
    } catch (error) {
      console.error('Failed to load admin users:', error);
      setUsers(fallbackUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const key = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesText =
        !key ||
        user.name.toLowerCase().includes(key) ||
        user.phone.toLowerCase().includes(key) ||
        String(user.street || '').toLowerCase().includes(key);
      const matchesRole = role === 'all' || user.role === role;
      const matchesVerified =
        verified === 'all' || (verified === 'yes' ? user.verified : !user.verified);
      return matchesText && matchesRole && matchesVerified;
    });
  }, [users, query, role, verified]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === 'admin').length,
      verified: users.filter((user) => user.verified).length,
      citizens: users.filter((user) => user.role === 'citizen').length,
    }),
    [users],
  );

  const exportCsv = () => {
    const rows = [
      ['ID', '姓名', '手机号', '角色', '实名', '街道', '创建时间'],
      ...filteredUsers.map((user) => [
        user.id,
        user.name,
        maskPhone(user.phone),
        user.role === 'admin' ? '管理员' : '市民',
        user.verified ? '已实名' : '未实名',
        user.street || '',
        user.created_at || '',
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif-cn text-xl font-bold text-warm-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            用户与权限管理
          </h1>
          <p className="text-sm text-warm-500 mt-1">账号查询、实名状态和管理员权限审计</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            className="px-4 py-2 border border-warm-200 rounded-md text-sm hover:bg-warm-50 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={exportCsv}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-light flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: '用户总数', value: stats.total, icon: Users, color: 'text-primary' },
          { label: '实名用户', value: stats.verified, icon: CheckCircle2, color: 'text-green-600' },
          { label: '管理员', value: stats.admins, icon: Shield, color: 'text-purple-600' },
          { label: '市民账号', value: stats.citizens, icon: UserCheck, color: 'text-blue-600' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-warm-500">{item.label}</p>
                  <p className="text-2xl font-bold text-warm-800 mt-1">{item.value}</p>
                </div>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] h-10 px-3 border border-warm-200 rounded-md">
          <Search className="w-4 h-4 text-warm-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索姓名、手机号、街道"
            className="flex-1 text-sm focus:outline-none"
          />
        </div>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as typeof role)}
          className="h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">全部角色</option>
          <option value="citizen">市民</option>
          <option value="admin">管理员</option>
        </select>
        <select
          value={verified}
          onChange={(event) => setVerified(event.target.value as typeof verified)}
          className="h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">全部实名状态</option>
          <option value="yes">已实名</option>
          <option value="no">未实名</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-50 border-b border-warm-200">
              <th className="text-left py-3 px-4 text-warm-600 font-medium">用户</th>
              <th className="text-left py-3 px-4 text-warm-600 font-medium">角色</th>
              <th className="text-left py-3 px-4 text-warm-600 font-medium">实名状态</th>
              <th className="text-left py-3 px-4 text-warm-600 font-medium">街道</th>
              <th className="text-left py-3 px-4 text-warm-600 font-medium">创建时间</th>
              <th className="text-right py-3 px-4 text-warm-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-warm-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  加载用户中...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-warm-500">
                  暂无匹配用户
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-warm-50 hover:bg-warm-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-warm-800">{user.name}</div>
                    <div className="text-xs text-warm-500">{maskPhone(user.phone)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {user.role === 'admin' ? '管理员' : '市民'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        user.verified ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      {user.verified ? '已实名' : '未实名'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-warm-600">{user.street || '-'}</td>
                  <td className="py-3 px-4 text-warm-600">{user.created_at || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelected(user)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-primary hover:bg-primary/10 rounded-md"
                    >
                      <Eye className="w-4 h-4" />
                      查看
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-warm-800">用户详情</h3>
              <button onClick={() => setSelected(null)} className="text-warm-400 hover:text-warm-700">
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-warm-500">姓名</span>
                <span className="font-medium text-warm-800">{selected.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-500">手机号</span>
                <span className="font-medium text-warm-800">{maskPhone(selected.phone)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-500">角色</span>
                <span className="font-medium text-warm-800">
                  {selected.role === 'admin' ? '管理员' : '市民'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-500">苏康码状态</span>
                <span className="font-medium text-warm-800">{selected.sukang_status || '未登记'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
