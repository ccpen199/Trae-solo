import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { getInviteStats } from '../services/api';

const Invite: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [stats, setStats] = useState<any>({ level1Count: 0, level2Count: 0, level3Count: 0, totalRewardCoins: 0 });
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    getInviteStats().then((s) => setStats(s)).catch(() => {});
  }, []);

  const inviteLink = `https://zz.example.com/i?u=${user?.id || ''}`;
  const inviteCode = user?.id ? `ZZ${String(user.id).padStart(6, '0')}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(`【赚赚APP】走路也能赚钱！点击链接加入，送你500金币：${inviteLink}  邀请码：${inviteCode}`).then(() => {
      (window as any).toast('邀请链接已复制');
    }).catch(() => {
      (window as any).toast('复制失败，请手动复制');
    });
  };

  const handleWechat = () => {
    localStorage.setItem('inviter_id', String(user?.id || ''));
    (window as any).toast('🎯 模拟分享给微信好友成功！');
    setTimeout(() => (window as any).toast('好友注册后双方各得500金币奖励', 2000), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-orange-50 to-white pb-8">
      <div className="sticky top-0 bg-white/80 backdrop-blur z-30 px-4 py-3 flex items-center border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center text-xl">←</button>
        <h1 className="font-bold text-lg flex-1 text-center pr-8">🤝 邀请好友</h1>
      </div>

      <div className="relative px-4 pt-6">
        <div className="bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-3xl p-6 text-white overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="absolute -left-5 bottom-0 w-24 h-24 bg-white/10 rounded-full"></div>

          <div className="relative z-10 text-center">
            <div className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs mb-3">🎁 限时活动 · 多级奖励</div>
            <div className="text-6xl font-black mb-2">¥ <span className="text-7xl">888</span></div>
            <div className="text-white/80 text-sm mb-4">最多可邀请奖励 / 人</div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.level1Count || 0}</div>
                <div className="text-xs text-white/80 mt-0.5">👥 一级好友</div>
              </div>
              <div className="border-x border-white/20">
                <div className="text-2xl font-bold">{stats.level2Count || 0}</div>
                <div className="text-xs text-white/80 mt-0.5">👥 二级好友</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.level3Count || 0}</div>
                <div className="text-xs text-white/80 mt-0.5">👥 三级好友</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 -mt-4 relative z-10 mx-1">
          <div className="text-center font-bold text-lg mb-4">多级返佣 · 躺赚不停</div>
          <div className="space-y-4">
            {[
              { level: 1, icon: '👤', title: '一级邀请', desc: '你邀请的好友注册', reward: '+500金币', color: 'from-orange-400 to-red-400' },
              { level: 2, icon: '👥', title: '二级邀请', desc: '好友邀请的好友注册', reward: '+50金币', color: 'from-blue-400 to-indigo-400' },
              { level: 3, icon: '👨‍👩‍👧‍👦', title: '三级邀请', desc: '好友的好友邀请注册', reward: '+25金币', color: 'from-green-400 to-teal-400' },
            ].map((item) => (
              <div key={item.level} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{item.title} {item.level === 1 && <span className="text-xs bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded ml-1">直推</span>}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                </div>
                <div className="text-primary font-bold">{item.reward}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 mt-4 mx-1">
          <div className="font-semibold mb-4">📨 邀请方式</div>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { icon: '💬', label: '微信好友', color: 'bg-green-50', handler: handleWechat },
              { icon: '🟢', label: '朋友圈', color: 'bg-green-50', handler: handleWechat },
              { icon: '🐘', label: 'QQ', color: 'bg-blue-50', handler: handleWechat },
              { icon: '📋', label: '复制链接', color: 'bg-orange-50', handler: handleCopy },
            ].map((item, i) => (
              <button key={i} onClick={item.handler} className={`${item.color} rounded-2xl p-4 active:scale-95 transition-transform`}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-xs font-medium">{item.label}</div>
              </button>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">我的邀请码</div>
              <button onClick={() => navigator.clipboard.writeText(inviteCode).then(() => (window as any).toast('邀请码已复制'))} className="text-xs text-primary font-medium">复制</button>
            </div>
            <div className="text-2xl font-black text-gradient tracking-wider text-center py-2">{inviteCode}</div>
          </div>
        </div>

        <div className="card p-5 mt-4 mx-1">
          <div className="font-semibold mb-3 flex items-center gap-2">
            <span>📊</span> 我的邀请数据
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">累计获得金币</div>
              <div className="text-xl font-bold text-primary">{(stats.totalRewardCoins || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">≈ ¥{((stats.totalRewardCoins || 0) / 10000).toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">累计邀请好友</div>
              <div className="text-xl font-bold text-indigo-500">
                {(stats.level1Count || 0) + (stats.level2Count || 0) + (stats.level3Count || 0)}
              </div>
              <div className="text-xs text-gray-400 mt-1">全层级统计</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invite;
