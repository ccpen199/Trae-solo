import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Search, Shield, Coins, User, Eye } from 'lucide-react';
import { get } from '../../utils/request';

interface UserItem {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  level: number;
  exp: number;
  coins: number;
  isVerified: boolean;
  inviteCode: string;
  createdAt: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res: any = await get('/admin/users');
      if (res.success) {
        setUsers(res.users);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.nickname.toLowerCase().includes(searchText.toLowerCase()) ||
      user.phone.includes(searchText) ||
      user.inviteCode.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <AdminLayout title="用户管理">
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索用户昵称/手机号/邀请码..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-80 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="text-sm text-gray-500">
            共 {filteredUsers.length} 位用户
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    手机号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    等级
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金币
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    实名认证
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    邀请码
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      暂无用户
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.nickname.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{user.nickname}</p>
                            <p className="text-xs text-gray-400">ID: {user.id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">
                          Lv.{user.level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-yellow-600 font-medium">
                          <Coins size={16} />
                          <span>{user.coins}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isVerified ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <Shield size={14} />
                            已认证
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">未认证</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {user.inviteCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
