import { 
  Crown, 
  ArrowLeft, 
  Gift, 
  Star, 
  Calendar,
  ChevronRight,
  Ticket,
  Percent,
  Zap,
  Shield,
  Award,
  CreditCard
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export default function VipCenterPage() {
  const { user, isLoggedIn, setCurrentPage } = useAppStore();

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-cinema-gold mx-auto mb-4" />
          <h2 className="text-xl font-bold text-cinema-text mb-2">请先登录</h2>
          <p className="text-cinema-text-secondary mb-6">登录后查看会员权益</p>
          <button
            onClick={() => setCurrentPage('login')}
            className="btn-gold"
          >
            立即登录
          </button>
        </div>
      </div>
    );
  }

  const vipLevel = user.vipLevel;
  const vipProgress = (user.vipPoints % 1000) / 10;
  const nextLevelPoints = Math.ceil(user.vipPoints / 1000) * 1000;

  const privileges = [
    { icon: Percent, title: '购票折扣', desc: '最高 8 折优惠', level: 1 },
    { icon: Ticket, title: '免费观影券', desc: '每月赠送 2 张', level: 2 },
    { icon: Zap, title: '优先购票', desc: '提前 3 天选座', level: 1 },
    { icon: Gift, title: '生日礼包', desc: '免费电影票+爆米花', level: 1 },
    { icon: Award, title: '专属客服', desc: '1对1 VIP服务', level: 3 },
    { icon: Shield, title: '退改无忧', desc: '开场前可免费退', level: 2 },
  ];

  return (
    <div className="min-h-screen">
      <div className="relative bg-gradient-to-br from-cinema-gold/20 via-cinema-gold/10 to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNEOU33MDYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptLTYgMGg0djFoLTR2LTF6bTEyLTZoLTR2MWg0di0xem0tNiAwaC00djFoNHYtMXptLTYgMGgtNHYxaDR2LTF6bTEyLTZoLTR2MWg0di0xem0tNiAwaC00djFoNHYtMXptLTYgMGgtNHYxaDR2LTF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setCurrentPage('home')}
              className="p-2 hover:bg-cinema-bg-light rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-cinema-text-secondary" />
            </button>
            <h1 className="text-3xl font-bold text-cinema-text">会员中心</h1>
          </div>

          <div className="bg-gradient-to-br from-cinema-gold to-cinema-gold-dark rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-24 h-24 rounded-full border-4 border-white/30 object-cover"
                />
                <div className="absolute -bottom-1 -right-1 bg-white text-cinema-gold px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  VIP {vipLevel}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-white/70 mt-1">{user.phone}</p>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">
                      当前积分：<span className="font-bold text-white">{user.vipPoints}</span>
                    </span>
                    <span className="text-sm text-white/70">
                      距 VIP {vipLevel + 1} 还需 {nextLevelPoints - user.vipPoints} 积分
                    </span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${vipProgress}%` }}
                    />
                  </div>
                </div>

                {user.vipExpireDate && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-white/70">
                    <Calendar className="w-4 h-4" />
                    <span>有效期至 {user.vipExpireDate}</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <button className="bg-white text-cinema-gold font-bold py-3 px-8 rounded-xl hover:bg-white/90 transition-colors">
                  立即续费
                </button>
                <p className="text-sm text-white/70 mt-2">首月 ¥15</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: '可用优惠券', value: user.coupons.filter(c => c.status === 'available').length, icon: Ticket },
            { label: '已观影', value: user.watchHistory.length, icon: Star },
            { label: '收藏影片', value: user.favorites.length, icon: Star },
            { label: '累计消费', value: '¥1,280', icon: CreditCard },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-cinema-bg-light rounded-xl border border-cinema-border p-6 text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <stat.icon className="w-8 h-8 text-cinema-gold mx-auto mb-3" />
              <p className="text-3xl font-bold text-cinema-text mb-1">{stat.value}</p>
              <p className="text-sm text-cinema-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-bold text-cinema-text mb-6">我的优惠券</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {user.coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`relative bg-cinema-bg-light rounded-xl border overflow-hidden ${
                  coupon.status === 'available' 
                    ? 'border-cinema-gold/50' 
                    : 'border-cinema-border opacity-60'
                }`}
              >
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-cinema-gold to-cinema-gold-dark" />
                <div className="p-5 pl-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-2xl font-bold ${
                        coupon.status === 'available' ? 'text-cinema-gold' : 'text-cinema-text-muted'
                      }`}>
                        {coupon.type === 'discount' ? `${coupon.value}%` :
                         coupon.type === 'free' ? '免费' : `¥${coupon.value}`}
                      </span>
                      <p className="font-medium text-cinema-text mt-1">{coupon.name}</p>
                    </div>
                    {coupon.status === 'available' && (
                      <span className="px-2 py-1 bg-cinema-gold/20 text-cinema-gold rounded text-xs">
                        可使用
                      </span>
                    )}
                  </div>
                  {coupon.minSpend && (
                    <p className="text-sm text-cinema-text-muted">满 ¥{coupon.minSpend} 可用</p>
                  )}
                  <p className="text-xs text-cinema-text-muted mt-2">
                    有效期至 {coupon.expireDate}
                  </p>
                  {coupon.status === 'available' && (
                    <button className="mt-4 w-full py-2 border border-cinema-gold text-cinema-gold rounded-lg text-sm font-medium hover:bg-cinema-gold hover:text-white transition-colors">
                      立即使用
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-bold text-cinema-text mb-6">会员权益</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {privileges.map((priv, index) => {
              const isUnlocked = vipLevel >= priv.level;
              return (
                <div
                  key={index}
                  className={`p-6 rounded-xl border transition-all ${
                    isUnlocked
                      ? 'bg-cinema-bg-light border-cinema-gold/30'
                      : 'bg-cinema-bg border-cinema-border opacity-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    isUnlocked ? 'bg-cinema-gold/20' : 'bg-cinema-bg-light'
                  }`}>
                    <priv.icon className={`w-6 h-6 ${
                      isUnlocked ? 'text-cinema-gold' : 'text-cinema-text-muted'
                    }`} />
                  </div>
                  <h4 className="font-bold text-cinema-text mb-1">{priv.title}</h4>
                  <p className="text-sm text-cinema-text-secondary mb-2">{priv.desc}</p>
                  {!isUnlocked && (
                    <span className="text-xs text-cinema-gold">
                      VIP {priv.level} 解锁
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-r from-cinema-gold/20 via-cinema-gold/10 to-transparent rounded-2xl p-8 text-center">
          <Crown className="w-12 h-12 text-cinema-gold mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-cinema-text mb-2">开通 VIP 会员</h3>
          <p className="text-cinema-text-secondary mb-6 max-w-md mx-auto">
            畅享 8 折购票、免费观影券、优先选座等超多权益
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button className="btn-gold py-3 px-8 text-lg">
              ¥25/月 开通
            </button>
            <button className="btn-secondary py-3 px-8">
              查看会员套餐
              <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
