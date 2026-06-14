import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Coins, Share2, Copy, CheckCircle } from 'lucide-react';
import { get } from '../utils/request';
import { useUserStore } from '../stores/userStore';

const Invite = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserStore();
  const [stats, setStats] = useState<any>(null);
  const [friendsLevel1, setFriendsLevel1] = useState<any[]>([]);
  const [friendsLevel2, setFriendsLevel2] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const statsRes: any = await get('/invite/stats');
      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      const friends1Res: any = await get('/invite/friends?level=1');
      if (friends1Res.success) {
        setFriendsLevel1(friends1Res.friends);
      }

      const friends2Res: any = await get('/invite/friends?level=2');
      if (friends2Res.success) {
        setFriendsLevel2(friends2Res.friends);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopy = () => {
    if (user?.inviteCode) {
      navigator.clipboard.writeText(user.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentFriends = activeTab === 1 ? friendsLevel1 : friendsLevel2;

  return (
    <div className="min-h-screen bg-dark-50 pb-20">
      <div className="bg-gradient-to-b from-primary-500 to-accent-500 text-white pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center h-14 px-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center">
              <ArrowLeft size={24} className="text-white" />
            </button>
            <h1 className="flex-1 text-center font-bold text-lg">邀请好友</h1>
            <div className="w-10"></div>
          </div>

          <div className="px-4 pb-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                <Users size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-1">邀请好友赚金币</h2>
              <p className="text-white/80 text-sm">好友完成任务，你也能获得分佣</p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{stats?.totalInvites || 0}</p>
                <p className="text-xs text-white/80">累计邀请</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalReward || 0}</p>
                <p className="text-xs text-white/80">邀请奖励</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalCommission || 0}</p>
                <p className="text-xs text-white/80">分佣收益</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-bold text-dark-800 mb-4">我的邀请码</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-dark-50 rounded-xl py-3 px-4 text-center">
              <span className="text-2xl font-bold text-primary-500 tracking-wider">
                {user?.inviteCode || '------'}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-4 py-3 bg-primary-500 text-white rounded-xl text-sm font-medium"
            >
              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <button className="w-full py-3 bg-gradient-primary text-white font-medium rounded-xl flex items-center justify-center gap-2">
            <Share2 size={18} />
            <span>分享给好友</span>
          </button>
        </div>
      </div>

      <div className="mt-4 mx-4 bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="flex border-b border-dark-100">
          <button
            onClick={() => setActiveTab(1)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 1 ? 'text-primary-500 border-b-2 border-primary-500' : 'text-dark-500'
            }`}
          >
            一级好友 ({stats?.level1Invites || 0})
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 2 ? 'text-primary-500 border-b-2 border-primary-500' : 'text-dark-500'
            }`}
          >
            二级好友 ({stats?.level2Invites || 0})
          </button>
        </div>

        <div className="p-4">
          {currentFriends.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-3 bg-dark-100 rounded-full flex items-center justify-center">
                <Users size={28} className="text-dark-300" />
              </div>
              <p className="text-dark-400 text-sm">暂无{activeTab === 1 ? '一级' : '二级'}好友</p>
              <p className="text-dark-300 text-xs mt-1">快去邀请好友一起赚金币吧</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentFriends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-primary-600 font-bold">
                    {friend.nickname?.charAt(0) || '用'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-dark-800">{friend.nickname}</p>
                    <p className="text-xs text-dark-400">
                      加入于 {new Date(friend.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary-500 font-medium">
                      <Coins size={14} />
                      <span>{friend.totalReward || 0}</span>
                    </div>
                    <p className="text-xs text-dark-400">累计贡献</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 mx-4 bg-white rounded-2xl shadow-card p-5">
        <h3 className="font-bold text-dark-800 mb-4">邀请规则</h3>
        <div className="space-y-3 text-sm text-dark-600">
          <div className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <p>分享邀请码给好友，好友注册后绑定邀请关系永久生效</p>
          </div>
          <div className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <p>一级好友完成任务，你可获得 10% 的金币分佣</p>
          </div>
          <div className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <p>二级好友完成任务，你可获得 5% 的金币分佣</p>
          </div>
          <div className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
            <p>每邀请一位好友注册，立即获得 50 金币奖励</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invite;
