import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Coins, Share2, Copy, CheckCircle, TrendingUp, Gift, Zap, ChevronRight } from 'lucide-react';
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
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem('pendingInvitePage', '1');
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

      const commRes: any = await get('/invite/commissions');
      if (commRes.success) {
        setCommissions(commRes.records || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopy = () => {
    if (!isLoggedIn) {
      navigate('/login?from=' + encodeURIComponent('/invite'));
      return;
    }
    if (user?.inviteCode) {
      navigator.clipboard.writeText(user.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (!isLoggedIn) {
      navigate('/login?from=' + encodeURIComponent('/invite'));
      return;
    }
    const text = `邀请你一起做任务赚金币！注册输入邀请码 ${user?.inviteCode}，立即领取100金币新人礼包~`;
    if (navigator.share) {
      navigator.share({ title: '任务赚金币', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('分享文案已复制，快去发给好友吧！');
    }
  };

  const handleNotLoginClick = () => {
    navigate('/login?from=' + encodeURIComponent('/invite'));
  };

  const currentFriends = activeTab === 1 ? friendsLevel1 : friendsLevel2;

  const rules = [
    { icon: Gift, title: '注册奖励', desc: '好友注册成功，你立即获得50金币', highlight: '+50' },
    { icon: TrendingUp, title: '一级分佣', desc: '一级好友每次完成任务，你获得10%分佣', highlight: '10%' },
    { icon: Users, title: '二级分佣', desc: '二级好友每次完成任务，你获得5%分佣', highlight: '5%' },
    { icon: Zap, title: '实时到账', desc: '所有奖励实时结算到金币账本', highlight: '实时' },
  ];

  const funnelSteps = [
    { label: '分享邀请码', value: 100, color: 'from-blue-400 to-blue-500' },
    { label: '好友点击注册', value: 72, color: 'from-green-400 to-green-500' },
    { label: '完成首次任务', value: 58, color: 'from-yellow-400 to-yellow-500' },
    { label: '连续活跃3天', value: 42, color: 'from-orange-400 to-orange-500' },
    { label: '首次提现', value: 35, color: 'from-red-400 to-red-500' },
  ];

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

            {isLoggedIn ? (
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
            ) : (
              <div 
                onClick={handleNotLoginClick}
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 text-center cursor-pointer hover:bg-white/25 transition-colors"
              >
                <p className="text-lg font-bold mb-1">登录后查看邀请数据</p>
                <p className="text-sm text-white/80">立即登录，开启邀请赚金币</p>
                <div className="mt-3 inline-flex items-center text-sm font-medium">
                  去登录 <ChevronRight size={16} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-bold text-dark-800 mb-4">我的邀请码</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-dark-50 rounded-xl py-3 px-4 text-center">
              <span className="text-2xl font-bold text-primary-500 tracking-wider">
                {isLoggedIn ? (user?.inviteCode || '------') : '登录后获取'}
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
          <button 
            onClick={handleShare}
            className="w-full py-3 bg-gradient-primary text-white font-medium rounded-xl flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            <span>分享给好友</span>
          </button>
        </div>
      </div>

      <div className="mt-4 mx-4 bg-white rounded-2xl shadow-card p-5">
        <h3 className="font-bold text-dark-800 mb-4 flex items-center gap-2">
          <Gift size={18} className="text-primary-500" />
          邀请奖励规则
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {rules.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <div key={i} className="bg-dark-50 rounded-xl p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Icon size={18} className="text-primary-500" />
                  </div>
                  <span className="text-lg font-bold text-primary-500">{rule.highlight}</span>
                </div>
                <p className="font-medium text-sm text-dark-800">{rule.title}</p>
                <p className="text-xs text-dark-500 mt-0.5">{rule.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 mx-4 bg-white rounded-2xl shadow-card p-5">
        <h3 className="font-bold text-dark-800 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-500" />
          邀请转化漏斗
        </h3>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-dark-600">{step.label}</span>
                <span className="text-sm font-medium text-dark-800">{step.value}%</span>
              </div>
              <div className="h-6 bg-dark-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${step.color} rounded-lg transition-all duration-700 flex items-center justify-end pr-2`}
                  style={{ width: `${step.value}%` }}
                >
                  <span className="text-[10px] text-white font-medium">{step.value}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-dark-400 mt-3 text-center">
          数据来源于平台历史用户统计，仅供参考
        </p>
      </div>

      {isLoggedIn && (
        <>
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
                <div className="text-center py-8">
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

          {commissions.length > 0 && (
            <div className="mt-4 mx-4 bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-bold text-dark-800 mb-4 flex items-center gap-2">
                <Coins size={18} className="text-primary-500" />
                分佣记录
              </h3>
              <div className="space-y-3">
                {commissions.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-dark-50 last:border-0">
                    <div>
                      <p className="text-sm text-dark-800">{item.description || '任务分佣'}</p>
                      <p className="text-xs text-dark-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-primary-500 font-bold">+{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Invite;
