import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();

  const menuGroups = [
    {
      items: [
        { icon: '📊', label: '累计数据', sub: '查看详细统计', onClick: () => navigate('/tasks') },
        { icon: '👟', label: '步数记录', sub: '查看历史步数', onClick: () => (window as any).toast('功能开发中') },
        { icon: '📹', label: '观看历史', sub: `今日视频奖励`, onClick: () => (window as any).toast('功能开发中') },
      ],
    },
    {
      items: [
        { icon: '💬', label: '客服中心', sub: '7x24小时在线', onClick: () => (window as any).toast('客服：400-888-8888') },
        { icon: '📜', label: '用户协议', sub: '查看协议', onClick: () => (window as any).toast('功能开发中') },
        { icon: '🔒', label: '隐私政策', sub: '数据保护', onClick: () => (window as any).toast('功能开发中') },
        { icon: 'ℹ️', label: '关于我们', sub: '版本 v1.0.0', onClick: () => (window as any).toast('赚赚 v1.0.0') },
      ],
    },
  ];

  const handleLogout = () => {
    if (confirm('确定退出登录吗？')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white px-5 pt-12 pb-20 rounded-b-[40px] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute left-10 bottom-0 w-24 h-24 bg-white/10 rounded-full -mb-8"></div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center text-4xl border-4 border-white/40 shadow-xl">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : '🧑'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold truncate">{user?.nickname || '新用户'}</h2>
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 text-orange-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                Lv.{user?.level || 1}
              </span>
            </div>
            <div className="text-white/80 text-sm truncate mb-3">
              ID: {user?.id ? String(user.id).padStart(8, '0') : '-'}
            </div>
            <div className="flex gap-2">
              {user?.is_cheater === 1 ? (
                <span className="bg-red-500/30 text-red-100 text-xs px-2 py-1 rounded-full">风险账号</span>
              ) : (
                <span className="bg-white/20 backdrop-blur text-white text-xs px-2 py-1 rounded-full">✓ 实名认证</span>
              )}
              <span className="bg-white/20 backdrop-blur text-white text-xs px-2 py-1 rounded-full">✓ 活跃用户</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-6 relative z-10">
          {[
            { v: (user?.coins || 0).toLocaleString(), l: '金币', onClick: () => navigate('/wallet') },
            { v: `¥${(user?.cash_balance || 0).toFixed(2)}`, l: '余额', onClick: () => navigate('/withdrawal') },
            { v: (user?.total_earned_coins || 0).toLocaleString(), l: '累计赚', onClick: () => {} },
            { v: ((user?.total_earned_coins || 0) / 10000).toFixed(0) + '元', l: '提现', onClick: () => navigate('/withdrawal') },
          ].map((item, i) => (
            <button key={i} onClick={item.onClick} className="text-center active:scale-95 transition">
              <div className="font-bold text-lg">{item.v}</div>
              <div className="text-xs text-white/80 mt-1">{item.l}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-14 relative z-10">
        <div className="card p-1 grid grid-cols-4 gap-1 mb-4">
          {[
            { icon: '✅', label: '每日签到', nav: () => navigate('/tasks') },
            { icon: '🎯', label: '任务中心', nav: () => navigate('/tasks') },
            { icon: '🤝', label: '邀请好友', nav: () => navigate('/invite') },
            { icon: '💵', label: '去提现', nav: () => navigate('/withdrawal') },
          ].map((item, i) => (
            <button key={i} onClick={item.nav} className="p-3 rounded-xl active:bg-gray-50 transition">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs font-medium">{item.label}</div>
            </button>
          ))}
        </div>

        <div className="card p-4 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-3">
          <div className="text-3xl">🎁</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">新人专享福利</div>
            <div className="text-xs text-gray-500">完成首提1元，解锁更多奖励任务</div>
          </div>
          <button onClick={() => navigate('/withdrawal')} className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full font-semibold active:scale-95 transition">
            去完成
          </button>
        </div>

        {menuGroups.map((group, gi) => (
          <div key={gi} className="card mb-4 overflow-hidden">
            {group.items.map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                className={`w-full p-4 flex items-center gap-4 active:bg-gray-50 transition text-left ${i !== group.items.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.sub}</div>
                </div>
                <div className="text-gray-300">›</div>
              </button>
            ))}
          </div>
        ))}

        <button onClick={handleLogout} className="w-full card py-4 text-red-500 font-medium active:bg-red-50 transition mb-4">
          退出登录
        </button>

        <div className="text-center text-xs text-gray-300 py-4">
          赚赚 v1.0.0 · Powered by Growth Platform
        </div>
      </div>
    </div>
  );
};

export default Profile;
