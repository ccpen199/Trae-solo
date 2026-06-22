import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { matchingApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { MatchResult } from '../types';

export default function MatchPage() {
  const { showToast } = useAppStore();
  const navigate = useNavigate();
  const [results, setResults] = useState<MatchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    radiusKm: 50,
    ageMin: 20,
    ageMax: 40,
    gender: 'any' as 'any' | 'male' | 'female',
    minCreditScore: 600,
    verifiedOnly: true
  });
  const [matchHistory, setMatchHistory] = useState<Array<{ user: MatchResult['user']; liked: boolean; score: number }>>([]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await matchingApi.findMatches(filters);
      setResults((res as unknown as { results: MatchResult[] }).results || []);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMatches();
  }, []);

  const current = results[currentIndex];

  const handleAction = async (liked: boolean) => {
    if (!current) return;
    if (liked) {
      try {
        const res = await matchingApi.like(current.targetUserId);
        if ((res as { isMutualMatch: boolean }).isMutualMatch) {
          showToast('🎉 恭喜！你们互相喜欢了！快去聊天吧', 'success');
          setTimeout(() => navigate('/chat'), 1500);
        } else {
          showToast('已发送喜欢', 'info');
        }
      } catch (e) {
        showToast((e as Error).message, 'error');
      }
    }
    setMatchHistory(prev => [{ user: current.user, liked, score: current.overallScore }, ...prev]);
    setCurrentIndex(i => Math.min(i + 1, results.length));
  };

  return (
    <div className="page-container">
      <div className="grid gap-6" style={{ gridTemplateColumns: '280px 1fr 280px' }}>
        <aside className="card card-body h-fit">
          <h3 className="font-bold mb-4 flex items-center gap-2">🔍 匹配筛选条件</h3>

          <div className="form-group">
            <label className="form-label">城市</label>
            <input className="input" placeholder="例如：北京" value={filters.city}
              onChange={e => setFilters(f => ({ ...f, city: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">距离范围: {filters.radiusKm}km</label>
            <input type="range" min="5" max="200" value={filters.radiusKm} className="w-full"
              onChange={e => setFilters(f => ({ ...f, radiusKm: parseInt(e.target.value) }))} />
          </div>

          <div className="form-group">
            <label className="form-label">年龄范围: {filters.ageMin}-{filters.ageMax}岁</label>
            <div className="flex gap-2">
              <input type="number" className="input" min="18" max="60" value={filters.ageMin}
                onChange={e => setFilters(f => ({ ...f, ageMin: parseInt(e.target.value) }))} />
              <input type="number" className="input" min="18" max="60" value={filters.ageMax}
                onChange={e => setFilters(f => ({ ...f, ageMax: parseInt(e.target.value) }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">性别偏好</label>
            <select className="input" value={filters.gender}
              onChange={e => setFilters(f => ({ ...f, gender: e.target.value as never }))}>
              <option value="any">不限</option>
              <option value="female">仅女性</option>
              <option value="male">仅男性</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">最低信用分: {filters.minCreditScore}</label>
            <input type="range" min="500" max="800" step="50" value={filters.minCreditScore} className="w-full"
              onChange={e => setFilters(f => ({ ...f, minCreditScore: parseInt(e.target.value) }))} />
          </div>

          <div className="form-group flex items-center gap-2">
            <input type="checkbox" id="ver" checked={filters.verifiedOnly}
              onChange={e => setFilters(f => ({ ...f, verifiedOnly: e.target.checked }))} />
            <label htmlFor="ver" className="text-sm text-gray-600">仅显示已实名认证用户</label>
          </div>

          <button className="btn btn-primary w-full mt-2" onClick={loadMatches}>🔄 重新匹配</button>
        </aside>

        <main>
          <div className="card card-body min-h-[600px] flex flex-col items-center justify-center p-10">
            {loading ? (
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4 animate-pulse">💫</div>
                <div>正在使用多维匹配算法为你寻找合适的人...</div>
                <div className="text-xs mt-2">基于 位置 · 教育 · 职业 · 兴趣 · 信用 6维加权</div>
              </div>
            ) : current?.user ? (
              <div className="w-full max-w-md">
                <div className="relative">
                  <div className="absolute -top-3 -right-3 bg-indigo-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center font-bold shadow-lg z-10">
                    <div className="text-xs opacity-80">匹配度</div>
                    <div className="text-xl">{Math.round(current.overallScore)}%</div>
                  </div>
                  <div className="aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center">
                    <img src={current.user.avatar} alt="" className="w-4/5 h-4/5 object-cover rounded-xl" />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{current.user.nickname}</h2>
                    {current.user.verification?.verified && <span className="badge badge-success">实名认证</span>}
                  </div>
                  <div className="text-gray-600 flex flex-wrap gap-2 items-center">
                    <span>{current.user.gender === 'male' ? '♂' : current.user.gender === 'female' ? '♀' : '•'}</span>
                    <span>{current.user.age}岁</span>
                    <span>·</span>
                    <span>📍 {current.user.location?.city}</span>
                    <span>·</span>
                    <span>⭐ {current.user.creditScore}信用分</span>
                  </div>
                  <p className="mt-3 text-gray-600">{current.user.bio}</p>

                  <div className="mt-4 space-y-1 text-sm">
                    <div>🏫 <span className="text-gray-600">{current.user.education?.school}</span> | 💼 <span className="text-gray-600">{current.user.career?.industry} · {current.user.career?.position}</span></div>
                  </div>

                  <div className="mt-3">
                    {current.user.interestTags.map((t: string) => <span key={t} className="tag tag-primary">#{t}</span>)}
                  </div>

                  <div className="mt-5 p-4 bg-gradient-to-br from-indigo-50 to-pink-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-2">✨ 匹配原因</div>
                    {current.reasons.map((r, i) => (
                      <div key={i} className="text-sm py-1 text-gray-700">• {r}</div>
                    ))}
                  </div>

                  <div className="mt-5 text-xs">
                    <div className="text-gray-500 mb-1">匹配得分拆解</div>
                    <div className="grid grid-6 gap-2 text-center" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
                      {[
                        { label: '位置', v: current.scoreBreakdown.location },
                        { label: '学历', v: current.scoreBreakdown.education },
                        { label: '职业', v: current.scoreBreakdown.career },
                        { label: '兴趣', v: current.scoreBreakdown.interests },
                        { label: '信用', v: current.scoreBreakdown.credit },
                        { label: '其他', v: ((current.scoreBreakdown as unknown as { custom?: number }).custom) || 0.5 },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center">
                          <div className="w-full h-12 bg-gray-100 rounded-t relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-indigo-400" style={{ height: `${(s.v as number) * 100}%` }} />
                          </div>
                          <div className="mt-1 text-gray-600">{Math.round((s.v as number) * 100)}%</div>
                          <div className="text-[10px] text-gray-400">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                  <button onClick={() => handleAction(false)} className="w-16 h-16 rounded-full bg-gray-100 text-3xl hover:bg-gray-200 transition shadow-md" title="跳过">
                    👋
                  </button>
                  <Link to={`/chat?u=${current.targetUserId}`} className="w-16 h-16 rounded-full bg-amber-100 text-3xl hover:bg-amber-200 transition shadow-md flex items-center justify-center" title="聊天">
                    💬
                  </Link>
                  <button onClick={() => handleAction(true)} className="w-16 h-16 rounded-full bg-pink-500 text-3xl hover:bg-pink-600 text-white transition shadow-md" title="喜欢">
                    ❤️
                  </button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                  剩余 {results.length - currentIndex - 1} 位候选人
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🌟</div>
                <div className="text-xl font-medium mb-2">已经看完所有推荐</div>
                <p>调整筛选条件试试，或点击重新匹配</p>
                <button onClick={loadMatches} className="btn btn-primary mt-6">🔄 重新匹配</button>
              </div>
            )}
          </div>
        </main>

        <aside className="space-y-6">
          <div className="card card-body">
            <h3 className="font-bold mb-3">📊 匹配算法说明</h3>
            <ul className="text-xs space-y-2 text-gray-600">
              <li><b>位置 (20%)</b>：同城优先，距离越近分越高</li>
              <li><b>教育 (20%)</b>：学历认证、院校层级</li>
              <li><b>职业 (15%)</b>：行业匹配、职业认证</li>
              <li><b>兴趣 (25%)</b>：Jaccard相似度算法</li>
              <li><b>信用 (15%)</b>：信用分+认证状态</li>
              <li><b>自定义 (5%)</b>：年龄/性别等偏好</li>
            </ul>
          </div>
          <div className="card card-body">
            <h3 className="font-bold mb-3">🕒 最近操作</h3>
            {matchHistory.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4">暂无记录</div>
            ) : (
              <div className="space-y-2">
                {matchHistory.slice(0, 8).map((h, i) => h.user && (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <img src={h.user.avatar} className="avatar avatar-sm" alt="" />
                    <div className="flex-1 truncate">
                      <div className="truncate">{h.user.nickname}</div>
                      <div className="text-xs text-gray-500">{Math.round(h.score)}分</div>
                    </div>
                    <span className="text-lg">{h.liked ? '❤️' : '👋'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
