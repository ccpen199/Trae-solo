import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { useAuthStore, useToastStore } from '@/store';
import { PageLoading } from '@/components/Loading.jsx';
import {
  User,
  Settings,
  LogOut,
  Heart,
  Video,
  Star,
  Clock,
  ChevronRight,
  Camera,
} from 'lucide-react';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/profile' } } });
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await authApi.getProfile();
      setProfile(res.data.data);
    } catch (error) {
      console.error('获取用户信息失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('已退出登录', 'success');
    navigate('/');
  };

  const menuItems = [
    { icon: Video, label: '我的视频', count: 0 },
    { icon: Heart, label: '我的收藏', count: 0 },
    { icon: Star, label: '关注列表', count: 0 },
    { icon: Clock, label: '历史记录', count: 0 },
    { icon: Settings, label: '设置', count: null },
  ];

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-neutral-100 pb-16 md:pb-0">
      <div className="bg-gradient-to-br from-primary to-primary-dark h-32 relative">
        <div className="absolute right-4 top-4">
          <button
            onClick={handleLogout}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <LogOut size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-neutral-200 overflow-hidden border-4 border-white shadow-sm">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-4 text-neutral-400" />
                )}
              </div>
              <button className="absolute -right-1 -bottom-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-sm">
                <Camera size={16} />
              </button>
            </div>

            <div className="flex-1 mt-2">
              <h2 className="text-xl font-bold text-neutral-800">
                {profile?.username || user?.username || '用户'}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {profile?.bio || '这个人很懒，什么都没写~'}
              </p>
              <div className="flex items-center gap-6 mt-3">
                <div className="text-center">
                  <div className="font-bold text-neutral-800">0</div>
                  <div className="text-xs text-neutral-500">关注</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-neutral-800">0</div>
                  <div className="text-xs text-neutral-500">粉丝</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-neutral-800">0</div>
                  <div className="text-xs text-neutral-500">获赞</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className="text-neutral-600" />
                <span className="text-neutral-800">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.count !== null && (
                  <span className="text-sm text-neutral-500">{item.count}</span>
                )}
                <ChevronRight size={18} className="text-neutral-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
