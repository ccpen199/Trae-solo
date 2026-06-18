import { useEffect, useState } from 'react';
import { User, Phone, Mail, MapPin, Award, Users, TrendingUp } from 'lucide-react';
import { getProfile } from '../services/api';
import type { User as UserType } from '../../shared/types';
import { useAuthStore } from '../store/auth';

const roleMap: Record<string, string> = {
  sales: '直销员',
  store_owner: '生活馆店主',
  operator: '运营专员',
  admin: '系统管理员',
};

export default function Profile() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuthStore();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        if (res.code === 0) {
          setUser(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stats = [
    { label: '我的客户', value: 128, icon: Users, color: 'text-primary-600 bg-primary-100' },
    { label: '本月业绩', value: '¥68,500', icon: TrendingUp, color: 'text-brand-600 bg-brand-100' },
    { label: '团队人数', value: 15, icon: Users, color: 'text-amber-600 bg-amber-100' },
    { label: '级别', value: `LV.${user?.level || 1}`, icon: Award, color: 'text-rose-600 bg-rose-100' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-500 via-primary-600 to-brand-600 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-10 w-24 h-24 bg-white rounded-full blur-2xl"></div>
            <div className="absolute bottom-4 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          </div>
        </div>
        
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 text-white text-3xl font-bold">
              {user?.realName?.[0] || <User className="w-12 h-12" />}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user?.realName}</h2>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                  {roleMap[user?.role || '']}
                </span>
                <span>工号：{user?.username}</span>
              </p>
            </div>

            <button className="btn btn-primary">
              编辑资料
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4 text-center">
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-3`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">真实姓名</p>
                <p className="text-sm font-medium text-gray-900">{user?.realName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">联系电话</p>
                <p className="text-sm font-medium text-gray-900">{user?.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">邮箱</p>
                <p className="text-sm font-medium text-gray-900">{user?.email || '未设置'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">所在地区</p>
                <p className="text-sm font-medium text-gray-900">{user?.region || '未设置'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">账号信息</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">用户名</span>
              <span className="font-medium text-gray-900">{user?.username}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">用户角色</span>
              <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
                {roleMap[user?.role || '']}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">账号状态</span>
              <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${
                user?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-danger-100 text-danger-700'
              }`}>
                {user?.status === 'active' ? '正常' : '禁用'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">注册时间</span>
              <span className="font-medium text-gray-900">{user?.createdAt?.slice(0, 10)}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">登录密码</span>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                修改密码
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
