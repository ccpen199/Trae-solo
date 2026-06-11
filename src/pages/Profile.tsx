import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Home, Key, Calendar, Edit2, Save, X } from 'lucide-react';
import { useAuthStore } from '@/store';
import { analyticsApi } from '@/api';
import type { MemberProfile } from '@shared/types';
import StatusBadge from '@/components/common/StatusBadge';

const roleNames: Record<string, string> = {
  owner: '业主',
  tenant: '租户',
  visitor: '访客',
  property: '物业员工',
  merchant: '商户',
};

const levelNames: Record<string, string> = {
  normal: '普通会员',
  silver: '银卡会员',
  gold: '金卡会员',
  platinum: '铂金会员',
  diamond: '钻石会员',
};

const levelColors: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-600',
  silver: 'bg-gray-200 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-700',
  platinum: 'bg-purple-100 text-purple-700',
  diamond: 'bg-blue-100 text-blue-700',
};

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role === 'owner' || user?.role === 'tenant') {
      fetchProfile();
    }
    if (user) {
      setEditData({ name: user.name, phone: user.phone || '', email: user.email || '' });
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getMemberProfile();
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-gray-500">请先登录</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">个人中心</h1>
        <p className="text-gray-500">管理您的账户信息和会员权益</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex flex-col items-center text-center">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-white/30 mb-4"
              />
              <h2 className="text-xl font-bold mb-1">{user.name}</h2>
              <p className="text-blue-200 text-sm mb-3">{roleNames[user.role] || user.role}</p>
              {profile && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelColors[profile.level] || levelColors.normal}`}>
                  {levelNames[profile.level] || '普通会员'}
                </span>
              )}
            </div>

            {profile && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-200 text-sm">会员积分</span>
                  <span className="text-2xl font-bold">{profile.points.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                    style={{ width: `${Math.min((profile.points / 10000) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-blue-200 text-xs mt-2">
                  距离下一等级还需 {Math.max(0, 10000 - profile.points).toLocaleString()} 积分
                </p>
              </div>
            )}
          </div>

          {profile && (
            <div className="bg-white rounded-xl p-4 mt-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">会员权益</h3>
              <div className="space-y-2">
                {profile.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-600">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">基本信息</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  编辑
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({ name: user.name, phone: user.phone || '', email: user.email || '' });
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">姓名</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-800">{user.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">手机号</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-800">{user.phone || '未绑定'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">邮箱</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-800">{user.email || '未绑定'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Key className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">用户名</p>
                  <p className="font-medium text-gray-800">{user.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">注册时间</p>
                  <p className="font-medium text-gray-800">
                    {new Date(user.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {user.house_address && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Home className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">房屋地址</p>
                    <p className="font-medium text-gray-800">{user.house_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {profile && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">消费统计</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">¥{profile.totalSpent.toLocaleString()}</p>
                  <p className="text-sm text-blue-500 mt-1">累计消费</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{profile.orderCount}</p>
                  <p className="text-sm text-green-500 mt-1">订单数</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{profile.couponUsed}</p>
                  <p className="text-sm text-purple-500 mt-1">使用优惠券</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{profile.visitCount}</p>
                  <p className="text-sm text-orange-500 mt-1">到访次数</p>
                </div>
              </div>
            </div>
          )}

          {profile && profile.recentOrders && profile.recentOrders.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">最近订单</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {profile.recentOrders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{order.merchantName}</p>
                      <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">¥{order.totalAmount}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
