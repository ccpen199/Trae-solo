import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Baby, Image, Heart, ChevronRight, X } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import useAuthStore from '../store/authStore';
import apiClient from '../api/client';
import { useToast } from '../components/Toast';

const Profile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [babies, setBabies] = useState<any[]>([]);
  const [newBaby, setNewBaby] = useState({ name: '', gender: 'female', birthday: '' });

  useEffect(() => {
    fetchBabies();
  }, []);

  const fetchBabies = async () => {
    try {
      const response = await apiClient.get('/babies');
      setBabies(response.data.data || []);
    } catch (err) {
      console.error('获取宝宝列表失败', err);
    }
  };

  const handleAddBaby = async () => {
    if (!newBaby.name) {
      showToast('请输入宝宝姓名', 'error');
      return;
    }
    if (!newBaby.birthday) {
      showToast('请选择出生日期', 'error');
      return;
    }

    try {
      await apiClient.post('/babies', newBaby);
      showToast('添加成功！', 'success');
      setShowAddBaby(false);
      setNewBaby({ name: '', gender: 'female', birthday: '' });
      fetchBabies();
    } catch (err: any) {
      showToast(err.errorMessage || '添加失败', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('已退出登录', 'success');
    window.location.href = '/login';
  };

  const menuItems = [
    { icon: Image, label: '我的相册', value: `${babies.length > 0 ? babies.length * 10 : 0} 张` },
    { icon: Heart, label: '我的收藏', value: '0 张' },
    { icon: Settings, label: '设置', value: '' },
  ];

  return (
    <div className="min-h-screen bg-cream pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">个人中心</h1>
        <p className="text-sm text-gray-500">管理你的家庭时光</p>
      </header>

      <div className="px-6 py-4">
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.nickname?.charAt(0) || user?.phone?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">
                {user?.nickname || '用户'}
              </h2>
              <p className="text-gray-500">{user?.phone || ''}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user?.role === 'admin'
                    ? 'bg-purple-100 text-purple-600'
                    : user?.role === 'parent'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-green-100 text-green-600'
                }`}>
                  {user?.role === 'admin' ? '管理员' : user?.role === 'parent' ? '宝爸/宝妈' : '祖辈'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-800">我的宝宝</h3>
            </div>
            <button
              onClick={() => setShowAddBaby(true)}
              className="text-primary text-sm font-medium hover:underline"
            >
              + 添加
            </button>
          </div>

          {babies.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Baby className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>还没有添加宝宝信息</p>
            </div>
          ) : (
            <div className="space-y-3">
              {babies.map((baby) => (
                <div
                  key={baby.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-orange-100 rounded-full flex items-center justify-center text-2xl">
                    {baby.gender === 'male' ? '👶' : '👧'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{baby.name}</h4>
                    <p className="text-sm text-gray-500">
                      {baby.birthday
                        ? `${Math.floor((Date.now() - new Date(baby.birthday).getTime()) / (1000 * 60 * 60 * 24 * 30))} 个月`
                        : '未设置生日'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card mb-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors -mx-2 px-2 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-gray-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{item.value}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-red-200 text-red-500 rounded-xl font-medium hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>

      {showAddBaby && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">添加宝宝</h2>
              <button
                onClick={() => setShowAddBaby(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  宝宝姓名
                </label>
                <input
                  type="text"
                  value={newBaby.name}
                  onChange={(e) => setNewBaby({ ...newBaby, name: e.target.value })}
                  placeholder="请输入宝宝姓名"
                  className="input"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  性别
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewBaby({ ...newBaby, gender: 'female' })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      newBaby.gender === 'female'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    👧 女宝
                  </button>
                  <button
                    onClick={() => setNewBaby({ ...newBaby, gender: 'male' })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      newBaby.gender === 'male'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    👶 男宝
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  出生日期
                </label>
                <input
                  type="date"
                  value={newBaby.birthday}
                  onChange={(e) => setNewBaby({ ...newBaby, birthday: e.target.value })}
                  className="input"
                />
              </div>

              <button
                onClick={handleAddBaby}
                className="btn-primary w-full mt-4"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;
