import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { activityApi, userApi, matchingApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { Activity, User, MatchCardData } from '../types';

export default function ActivityDetailPage() {
  const { id } = useParams();
  const { currentUser, showToast } = useAppStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [recommended, setRecommended] = useState<MatchCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ toUserId: '', score: 5, comment: '' });

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [act, rec] = await Promise.all([
        activityApi.getById(id),
        activityApi.getRecommendedMatches(id)
      ]);
      const a = act as Activity;
      setActivity(a);
      const creatorData = await userApi.getById(a.creatorId);
      setCreator(creatorData as User);
      const pUsers = await Promise.all(
        a.participants
          .filter(p => p.status === 'approved')
          .map(p => userApi.getById(p.userId).catch(() => null))
      );
      setParticipants(pUsers.filter(Boolean) as User[]);
      setRecommended(rec as MatchCardData[] || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [id]);

  if (loading) return <div className="page-container py-20 text-center text-gray-500">加载中...</div>;
  if (!activity) return <div className="page-container py-20 text-center text-gray-500">活动不存在</div>;

  const isCreator = currentUser?.id === activity.creatorId;
  const myParticipation = currentUser ? activity.participants.find(p => p.userId === currentUser.id) : null;
  const approvedCount = activity.participants.filter(p => p.status === 'approved').length;

  const handleApply = async () => {
    try {
      await activityApi.apply(activity.id);
      showToast('报名成功！', 'success');
      void loadAll();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleCancel = async () => {
    try {
      await activityApi.cancel(activity.id);
      showToast('已取消报名', 'info');
      void loadAll();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleFeedback = async () => {
    if (!feedback.toUserId) {
      showToast('请选择评价对象', 'error');
      return;
    }
    try {
      await activityApi.submitFeedback(activity.id, { toUserId: feedback.toUserId, score: feedback.score, comment: feedback.comment });
      showToast('评价提交成功！对方信用分已更新', 'success');
      setFeedback({ toUserId: '', score: 5, comment: '' });
      void loadAll();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleLike = async (userId: string) => {
    try {
      const res = await matchingApi.like(userId);
      if ((res as { isMutualMatch: boolean }).isMutualMatch) {
        showToast('🎉 互相互动！快去私信聊天吧', 'success');
      } else {
        showToast('已发送喜欢', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container max-w-5xl">
      <Link to="/activities" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">← 返回活动列表</Link>

      <div className="card overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white relative">
          <div className="text-center">
            <div className="text-6xl mb-3">🎉</div>
            <h1 className="text-3xl font-bold drop-shadow">{activity.title}</h1>
            <div className="mt-2 flex items-center justify-center gap-3 text-sm opacity-90">
              <span className="badge" style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>{activity.category}</span>
              {activity.status === 'recruiting' ? <span className="badge badge-success">招募中</span> :
               activity.status === 'confirmed' ? <span className="badge badge-success">已成行</span> :
               activity.status === 'ongoing' ? <span className="badge badge-warning">进行中</span> :
               activity.status === 'completed' ? <span className="badge badge-secondary">已完成</span> : null}
            </div>
          </div>
        </div>

        <div className="card-body p-8">
          <div className="grid gap-8" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div>
              <h2 className="font-bold text-lg mb-3">活动详情</h2>
              <p className="text-gray-600 whitespace-pre-line mb-6">{activity.description}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">📍</span>
                  <div>
                    <div className="font-medium">{activity.location.name}</div>
                    <div className="text-sm text-gray-500">{activity.location.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">🕐</span>
                  <div>
                    <div className="font-medium">开始: {new Date(activity.startTime).toLocaleString()}</div>
                    <div className="text-sm text-gray-500">结束: {new Date(activity.endTime).toLocaleString()} · 集合 {new Date(activity.meetingTime).toLocaleTimeString()}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">👥</span>
                  <div>
                    <div className="font-medium">{approvedCount}/{activity.maxParticipants} 人已确认</div>
                    <div className="text-sm text-gray-500">
                      年龄 {activity.ageRange.min}-{activity.ageRange.max}岁
                      {activity.genderPreference !== 'any' ? ` · ${activity.genderPreference === 'male_only' ? '仅限男性' : activity.genderPreference === 'female_only' ? '仅限女性' : '男女均衡'}` : ''}
                      {' · '}最低信用分 {activity.minCreditScore}
                      {activity.feePerPerson > 0 ? ` · 费用 ¥${activity.feePerPerson}/人` : ' · 免费'}
                    </div>
                  </div>
                </div>
                {activity.coupons && activity.coupons.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-xl">🎫</span>
                    <div>
                      <div className="font-medium text-amber-800">小壶优选团购券</div>
                      {activity.coupons.map((c, i) => (
                        <div key={i} className="text-sm text-amber-700">
                          {c.title}: 原价 ¥{c.originalPrice} → 活动价 ¥{c.discountedPrice}
                          <span className={`ml-2 badge ${c.redeemed ? 'badge-success' : 'badge-warning'}`}>
                            {c.redeemed ? '已核销' : '待核销'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {activity.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-2 text-sm">活动标签</h3>
                  <div>
                    {activity.tags.map(t => <span key={t} className="tag tag-primary">{t}</span>)}
                  </div>
                </div>
              )}

              {activity.status === 'completed' && (
                <div className="p-5 bg-indigo-50 rounded-xl mb-6">
                  <h3 className="font-bold mb-3">🌟 结伴反馈</h3>
                  <div className="form-group">
                    <label className="form-label">选择伙伴</label>
                    <select className="input" value={feedback.toUserId}
                      onChange={e => setFeedback(f => ({ ...f, toUserId: e.target.value }))}>
                      <option value="">请选择...</option>
                      {participants.filter(p => p.id !== currentUser?.id).map(p => (
                        <option key={p.id} value={p.id}>{p.nickname} ({p.education.school})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">评分: {feedback.score}星</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setFeedback(f => ({ ...f, score: n }))}
                          className={`text-3xl ${feedback.score >= n ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">评价</label>
                    <textarea className="input" rows={3} value={feedback.comment}
                      onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))}
                      placeholder="分享一下这次结伴的体验吧（影响对方信用分）" />
                  </div>
                  <button onClick={handleFeedback} className="btn btn-primary">提交评价</button>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <span>👤 发起人</span>
                </div>
                <div className="card-body">
                  {creator && (
                    <Link to={`/profile/${creator.id}`} className="flex items-center gap-3 hover:opacity-80">
                      <img src={creator.avatar} className="avatar avatar-lg" alt="" />
                      <div className="flex-1">
                        <div className="font-medium">{creator.nickname}</div>
                        <div className="text-xs text-gray-500">⭐ {creator.creditScore}分 · {creator.location.city}</div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">👥 参与成员 ({approvedCount})</div>
                <div className="card-body space-y-3">
                  {participants.map(p => (
                    <Link to={`/profile/${p.id}`} key={p.id} className="flex items-center gap-3 hover:opacity-80">
                      <img src={p.avatar} className="avatar avatar-sm" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.nickname}</div>
                        <div className="text-xs text-gray-500">{p.education.school}</div>
                      </div>
                      <span className="text-xs text-gray-400">⭐{p.creditScore}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {isCreator ? (
                  <div className="btn btn-secondary w-full">管理活动</div>
                ) : myParticipation && myParticipation.status !== 'cancelled' && myParticipation.status !== 'rejected' ? (
                  <button onClick={handleCancel} className="btn btn-danger w-full">取消报名</button>
                ) : activity.status === 'recruiting' ? (
                  <button onClick={handleApply} disabled={approvedCount >= activity.maxParticipants}
                    className={`btn w-full ${approvedCount >= activity.maxParticipants ? 'btn-secondary' : 'btn-primary'} btn-lg`}>
                    {approvedCount >= activity.maxParticipants ? '已满员' : '立即报名'}
                  </button>
                ) : null}
                <Link to="/safety" className="btn btn-warning w-full">🛡️ 开启平安哨守护</Link>
              </div>

              {recommended.length > 0 && (
                <div className="card">
                  <div className="card-header">💡 推荐邀请</div>
                  <div className="card-body space-y-3">
                    {recommended.slice(0, 4).map((r, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <img src={r.user.avatar} className="avatar avatar-sm" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{r.user.nickname}</div>
                          <div className="text-xs text-indigo-600">匹配度 {Math.round(r.matchScore)}%</div>
                        </div>
                        <button onClick={() => void handleLike(r.user.id)} className="text-pink-500 text-lg">❤️</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
