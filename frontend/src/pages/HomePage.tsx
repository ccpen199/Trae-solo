import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { activityApi, bubbleApi, matchingApi } from '../services';
import type { Activity, BubbleRoom, MatchResult } from '../types';

export default function HomePage() {
  const { currentUser, riskStatus } = useAppStore();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [hotRooms, setHotRooms] = useState<BubbleRoom[]>([]);
  const [quickMatches, setQuickMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [acts, rooms, matches] = await Promise.all([
          activityApi.list({ status: 'recruiting', pageSize: 4 }),
          bubbleApi.list({ status: 'active', pageSize: 4 }),
          matchingApi.quickMatch()
        ]);
        setRecentActivities((acts as unknown as { items: Activity[] }).items || []);
        setHotRooms((rooms as unknown as { items: BubbleRoom[] }).items || []);
        setQuickMatches((matches as unknown as { results: MatchResult[] }).results?.slice(0, 5) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categoryIcons: Record<string, string> = {
    food: '🍜', sports: '⚽', movie: '🎬', travel: '✈️',
    study: '📚', game: '🎮', music: '🎵', art: '🎨',
    outdoor: '🏕️', party: '🥳', other: '✨'
  };

  return (
    <div className="page-container">
      {currentUser && (
        <div className="card mb-6" style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
          color: 'white',
          border: 'none'
        }}>
          <div className="card-body p-8">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-5">
                <img src={currentUser.avatar} alt="" className="avatar avatar-xl" style={{ border: '3px solid rgba(255,255,255,0.4)' }} />
                <div>
                  <div className="text-2xl font-bold flex items-center gap-3">
                    你好，{currentUser.nickname}
                    {currentUser.verification?.verified && <span className="badge badge-success">✓ 实名</span>}
                    {currentUser.verification?.faceVerified && <span className="badge" style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>✓ 人脸</span>}
                  </div>
                  <div className="opacity-90 text-sm mt-1">
                    {currentUser.age}岁 · {currentUser.location.city} · {currentUser.education.school} · {currentUser.career.position}
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {currentUser.interestTags.slice(0, 4).map(t => (
                      <span key={t} className="tag" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>#{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold">{currentUser.creditScore}</div>
                  <div className="text-sm opacity-90">信用分</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">{currentUser.education.verified ? '✓' : '—'}</div>
                  <div className="text-sm opacity-90">学历认证</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">{currentUser.career.verified ? '✓' : '—'}</div>
                  <div className="text-sm opacity-90">职业认证</div>
                </div>
              </div>
            </div>
            {riskStatus && riskStatus.riskLevel !== 'low' && (
              <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <div className="font-medium mb-2">⚠️ 风控提醒</div>
                <ul className="text-sm space-y-1 opacity-90">
                  {riskStatus.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {[
          { icon: '💫', title: '智能匹配', desc: '基于多维算法推荐', to: '/match', color: 'from-indigo-400 to-indigo-600' },
          { icon: '🎉', title: '发起组局', desc: '邀请志同道合的人', to: '/activities/new', color: 'from-pink-400 to-rose-600' },
          { icon: '💬', title: '泡泡房间', desc: '在线语音缘分社交', to: '/bubble', color: 'from-cyan-400 to-blue-600' },
          { icon: '🛡️', title: '平安哨守护', desc: '双向守护安心出行', to: '/safety', color: 'from-amber-400 to-orange-600' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="card card-body hover:shadow-lg transition-all hover:-translate-y-1 flex gap-4 items-center">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl`}>
              {item.icon}
            </div>
            <div>
              <div className="font-bold text-gray-900">{item.title}</div>
              <div className="text-sm text-gray-500">{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-2 gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🎊 热门组局</h2>
            <Link to="/activities" className="text-sm text-indigo-600 hover:underline">查看全部 →</Link>
          </div>
          {loading ? <div className="card p-6 text-center text-muted text-sm">加载中...</div> : (
            <div className="space-y-4">
              {recentActivities.slice(0, 3).map(a => (
                <Link to={`/activities/${a.id}`} key={a.id} className="card card-body hover:shadow-md transition flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {categoryIcons[a.category] || '✨'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{a.title}</div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span>📍 {a.location.name.slice(0, 8)}</span>
                      <span>·</span>
                      <span>{new Date(a.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex gap-1">
                        <span className="badge badge-primary">{a.participants.filter(p => p.status === 'approved').length}/{a.maxParticipants}人</span>
                        {a.feePerPerson > 0 ? <span className="badge badge-warning">¥{a.feePerPerson}</span> : <span className="badge badge-success">免费</span>}
                      </div>
                      <span className={`badge ${a.status === 'recruiting' ? 'badge-info' : a.status === 'confirmed' ? 'badge-success' : 'badge-secondary'}`}>
                        {a.status === 'recruiting' ? '招募中' : a.status === 'confirmed' ? '已成行' : a.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">💫 为你推荐</h2>
            <Link to="/match" className="text-sm text-indigo-600 hover:underline">更多匹配 →</Link>
          </div>
          {loading ? <div className="card p-6 text-center text-muted text-sm">加载中...</div> : (
            <div className="card card-body">
              <div className="grid grid-4 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                {quickMatches.map(m => (
                  <Link to={`/profile/${m.targetUserId}`} key={m.targetUserId} className="text-center group">
                    <div className="relative inline-block">
                      <img src={m.user?.avatar} alt="" className="avatar avatar-lg mx-auto" />
                      <div className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white">
                        {Math.round(m.overallScore)}
                      </div>
                    </div>
                    <div className="text-sm font-medium mt-2 truncate group-hover:text-indigo-600">{m.user?.nickname}</div>
                    <div className="text-xs text-gray-500">{m.user?.education?.school?.slice(0, 4)}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4 mt-8">
            <h2 className="text-xl font-bold">🫧 热门泡泡房</h2>
            <Link to="/bubble" className="text-sm text-indigo-600 hover:underline">全部房间 →</Link>
          </div>
          <div className="space-y-3">
            {hotRooms.slice(0, 3).map(r => (
              <Link to={`/bubble/${r.id}`} key={r.id} className="card card-body hover:shadow-md transition flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                  r.roomType === 'single' ? 'bg-pink-100' : r.roomType === 'youth' ? 'bg-cyan-100' : 'bg-amber-100'
                }`}>
                  {r.roomType === 'single' ? '💕' : r.roomType === 'youth' ? '🎈' : '🧧'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{r.city} · {r.currentMembers ?? r.host ? '?' : (r as unknown as { members: unknown[] }).members?.length}/{r.maxMembers}人</div>
                </div>
                <span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                  {r.status === 'active' ? '直播中' : r.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
