import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  User,
  Trophy,
  Fish,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  Star,
  Clock,
  Target,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { user, theme, catchRecords, achievements } = useAppStore();
  
  const levelProgress = (user.exp / (user.level * 1000)) * 100;
  
  const rarityColors: Record<string, string> = {
    common: 'text-moonlight-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
  };
  
  const rarityBgColors: Record<string, string> = {
    common: 'bg-moonlight-500/10',
    rare: 'bg-blue-500/10',
    epic: 'bg-purple-500/10',
    legendary: 'bg-yellow-500/10',
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 用户信息卡 */}
      <div className={cn(
        'rounded-2xl overflow-hidden',
        theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
      )}>
        <div className="h-32 bg-gradient-to-r from-deep-sea-500 via-lake-green-500 to-deep-sea-500 relative">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 left-10 w-16 h-16 rounded-full bg-white/20 blur-xl" />
            <div className="absolute bottom-2 right-20 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12">
            <img
              src={user.avatar}
              alt={user.nickname}
              className="w-24 h-24 rounded-full border-4 border-deep-sea-900 shadow-xl"
            />
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{user.nickname}</h2>
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  rarityBgColors[user.titleRarity],
                  rarityColors[user.titleRarity]
                )}>
                  {user.title}
                </span>
              </div>
              <p className="text-moonlight-400 text-sm mt-1">
                Lv.{user.level} · {user.levelName} · 加入 {format(new Date(user.joinDate), 'yyyy年MM月')}
              </p>
            </div>
          </div>
          
          {/* 经验条 */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-moonlight-400">升级进度</span>
              <span className="text-sm text-moonlight-400">{user.exp} / {user.level * 1000} EXP</span>
            </div>
            <div className="h-2 rounded-full bg-moonlight-700/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lake-green-500 to-deep-sea-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
          
          {/* 统计数据 */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <StatCard icon={<Fish size={20} />} label="渔获总数" value={user.totalCatches.toString()} color="text-lake-green-400" theme={theme} />
            <StatCard icon={<MapPin size={20} />} label="打卡钓点" value={user.visitedSpots.toString()} color="text-deep-sea-400" theme={theme} />
            <StatCard icon={<Trophy size={20} />} label="获得成就" value={user.unlockedAchievements.toString()} color="text-yellow-400" theme={theme} />
            <StatCard icon={<Clock size={20} />} label="垂钓天数" value={user.fishingDays.toString()} color="text-sunset-orange-400" theme={theme} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 渔获时空图谱 */}
        <div className={cn(
          'lg:col-span-2 rounded-2xl p-6',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target size={20} className="text-lake-green-400" />
            近期渔获记录
          </h3>
          <div className="space-y-4">
            {catchRecords.map((record, index) => (
              <div
                key={record.id}
                className={cn(
                  'p-4 rounded-xl flex items-center gap-4 transition-all card-hover',
                  theme === 'dark' ? 'bg-deep-sea-800/50' : 'bg-moonlight-50'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <img
                  src={record.photos[0]}
                  alt={record.speciesName}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg">{record.speciesName}</h4>
                  <div className="flex items-center gap-4 text-sm text-moonlight-400 mt-1">
                    <span>{record.weight}kg</span>
                    <span>·</span>
                    <span>{record.length}cm</span>
                    <span>·</span>
                    <span>{record.spotName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {record.weatherTags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-xs bg-lake-green-500/10 text-lake-green-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-moonlight-400">{format(new Date(record.timestamp), 'MM-dd HH:mm')}</p>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">{record.weight >= 5 ? '稀有' : '普通'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2.5 rounded-xl border border-deep-sea-700/50 text-moonlight-400 text-sm font-medium flex items-center justify-center gap-1 hover:bg-deep-sea-800/30 transition-all">
            查看全部渔获 <ChevronRight size={16} />
          </button>
        </div>
        
        {/* 成就图鉴 */}
        <div className={cn(
          'rounded-2xl p-6',
          theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
        )}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award size={20} className="text-yellow-400" />
            成就图鉴
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {achievements.slice(0, 9).map((achievement, index) => (
              <div
                key={achievement.id}
                className={cn(
                  'p-3 rounded-xl text-center transition-all',
                  achievement.unlocked
                    ? `${rarityBgColors[achievement.rarity]}`
                    : 'opacity-40 grayscale',
                  theme === 'dark' ? 'bg-deep-sea-800/30' : 'bg-moonlight-50'
                )}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className="text-xs font-medium truncate">{achievement.name}</p>
                <p className={cn('text-xs mt-0.5', rarityColors[achievement.rarity])}>
                  {achievement.rarityName}
                </p>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2.5 rounded-xl border border-deep-sea-700/50 text-moonlight-400 text-sm font-medium flex items-center justify-center gap-1 hover:bg-deep-sea-800/30 transition-all">
            全部成就 <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      {/* 成长曲线 */}
      <div className={cn(
        'rounded-2xl p-6',
        theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
      )}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-lake-green-400" />
          成长曲线
        </h3>
        <div className="h-48 flex items-end justify-around gap-2">
          {[12, 18, 25, 22, 30, 28, 35, 42, 38, 45, 52, 48, 55, 62].map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-deep-sea-500 to-lake-green-400 transition-all hover:from-lake-green-500 hover:to-lake-green-300"
                style={{ height: `${(value / 70) * 100}%`, minHeight: '8px' }}
              />
              <span className="text-xs text-moonlight-400">{index + 1}月</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  theme: string;
}

function StatCard({ icon, label, value, color, theme }: StatCardProps) {
  return (
    <div className="text-center p-3 rounded-xl">
      <div className={cn('w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2', color, 'bg-opacity-10')}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-moonlight-400 mt-1">{label}</p>
    </div>
  );
}
