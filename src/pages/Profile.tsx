import { useNavigate } from 'react-router-dom';
import { User, Settings, HelpCircle, Shield, ChevronRight, LogOut, Coins, Trophy, Gift, CreditCard } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { calculateLevel } from '../utils/level';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUserStore();

  const levelInfo = calculateLevel(user?.exp || 0);

  const menuItems = [
    { icon: Coins, label: '我的金币', path: '/wallet', color: 'text-primary-500 bg-primary-100' },
    { icon: CreditCard, label: '提现记录', path: '/withdraw', color: 'text-green-500 bg-green-100' },
    { icon: Trophy, label: '我的等级', path: '/profile', color: 'text-yellow-500 bg-yellow-100' },
    { icon: Gift, label: '邀请好友', path: '/invite', color: 'text-pink-500 bg-pink-100' },
    { icon: Shield, label: '实名认证', path: '/profile', color: 'text-blue-500 bg-blue-100' },
    { icon: Settings, label: '设置', path: '/profile', color: 'text-gray-500 bg-gray-100' },
    { icon: HelpCircle, label: '帮助中心', path: '/profile', color: 'text-purple-500 bg-purple-100' },
  ];

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      navigate('/');
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-50 pb-20">
      <div className="bg-gradient-primary pt-12 pb-20 px-4 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={32} className="text-white" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{user?.nickname || '用户'}</h2>
                <p className="text-white/80 text-sm mt-1">ID: {user?.id?.slice(-8) || ''}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    Lv.{levelInfo.level}
                  </span>
                  {user?.isVerified && (
                    <span className="bg-green-400/30 text-green-100 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                      <Shield size={12} />
                      已实名
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center gap-4 cursor-pointer"
              onClick={goToLogin}
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                <User size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">点击登录</h2>
                <p className="text-white/80 text-sm mt-1">登录后体验更多功能</p>
              </div>
              <ChevronRight size={24} className="text-white/60" />
            </div>
          )}
        </div>
      </div>

      {isLoggedIn && (
        <div className="px-4 -mt-12 relative z-10">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-primary-500" />
                <span className="font-bold text-dark-800">等级成长</span>
              </div>
              <span className="text-sm text-dark-500">Lv.{levelInfo.level}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-3 bg-dark-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${levelInfo.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-dark-400 mt-1.5">
                  经验值 {levelInfo.currentExp}/{levelInfo.nextLevelExp}
                </p>
              </div>
            </div>
            <p className="text-xs text-dark-400 mt-3">
              完成任务获取经验值，等级越高特权越多
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 mx-4 bg-white rounded-2xl shadow-card overflow-hidden">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => {
                if (isLoggedIn) {
                  navigate(item.path);
                } else {
                  navigate('/login');
                }
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-dark-50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-dark-100' : ''
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                <Icon size={20} />
              </div>
              <span className="flex-1 text-left text-dark-700 font-medium">{item.label}</span>
              {item.label === '我的等级' && isLoggedIn && (
                <span className="text-sm text-primary-500">Lv.{levelInfo.level}</span>
              )}
              {item.label === '实名认证' && (
                <span className={`text-sm ${user?.isVerified ? 'text-green-500' : 'text-red-400'}`}>
                  {user?.isVerified ? '已认证' : '未认证'}
                </span>
              )}
              <ChevronRight size={18} className="text-dark-300" />
            </button>
          );
        })}
      </div>

      {isLoggedIn && (
        <div className="mt-4 mx-4">
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-white text-red-500 font-medium rounded-xl shadow-card flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>退出登录</span>
          </button>
        </div>
      )}

      <div className="mt-6 text-center text-xs text-dark-400">
        <p>版本 1.0.0</p>
      </div>
    </div>
  );
};

export default Profile;
