import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { userApi, matchingApi, activityApi, riskApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { User, CreditRecord, Activity } from '../types';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, showToast } = useAppStore();
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isMe, setIsMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    nickname: '',
    bio: '',
    interestTags: [] as string[],
    newTag: ''
  });
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState({
    category: 'inappropriate_content' as const,
    description: '',
    evidence: ''
  });

  useEffect(() => {
    void (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [u, acts] = await Promise.all([
          userApi.getById(id),
          activityApi.list({ userId: id, pageSize: 10 })
        ]);
        setUser(u as User);
        setActivities((acts as unknown as { items: Activity[] }).items || []);
        setIsMe(currentUser?.id === id);
        setEditData({
          nickname: (u as User).nickname,
          bio: (u as User).bio,
          interestTags: (u as User).interestTags,
          newTag: ''
        });
        if (isMe) {
          const cr = await userApi.getCreditRecords(id);
          setCreditRecords((cr.records || []) as CreditRecord[]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, currentUser?.id]);

  if (loading) return <div className="page-container py-20 text-center text-gray-500">加载中...</div>;
  if (!user) return <div className="page-container py-20 text-center text-gray-500">用户不存在</div>;

  const getScoreColor = (score: number) => {
    if (score >= 750) return '#10b981';
    if (score >= 650) return '#6366f1';
    if (score >= 550) return '#f59e0b';
    return '#ef4444';
  };
  const getScoreLevel = (score: number) => {
    if (score >= 750) return '优秀';
    if (score >= 650) return '良好';
    if (score >= 550) return '中等';
    return '较低';
  };

  const handleLike = async () => {
    try {
      const res = await matchingApi.like(id!);
      if ((res as { isMutualMatch: boolean }).isMutualMatch) {
        showToast('🎉 恭喜，互相匹配！去私信吧', 'success');
        setTimeout(() => navigate(`/chat?u=${id}`), 1000);
      } else {
        showToast('已发送喜欢 ❤️', 'info');
      }
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleSave = async () => {
    try {
      await userApi.update(id!, {
        nickname: editData.nickname,
        bio: editData.bio,
        interestTags: editData.interestTags
      } as Partial<User>);
      setEditing(false);
      showToast('保存成功', 'success');
      window.location.reload();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleReport = async () => {
    try {
      await riskApi.reportUser({
        targetUserId: id,
        category: reportData.category,
        description: reportData.description,
        evidence: reportData.evidence ? [reportData.evidence] : []
      });
      showToast('举报已提交，我们会尽快审核', 'success');
      setShowReport(false);
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  return (
    <div className="page-container max-w-5xl">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">← 返回</button>

      <div className="card overflow-hidden mb-6">
        <div className="h-40" style={{ background: `linear-gradient(135deg, ${getScoreColor(user.creditScore)}66, #6366f166)` }} />
        <div className="p-8 pt-0 relative">
          <div className="flex items-end flex-wrap gap-6 -mt-16 mb-6">
            <img src={user.avatar} className="avatar avatar-xl border-4 border-white shadow-md" alt="" />
            <div className="flex-1 min-w-0 pb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">
                  {isMe && editing ? (
                    <input className="input" style={{ width: 200, display: 'inline-block' }}
                      value={editData.nickname}
                      onChange={e => setEditData(d => ({ ...d, nickname: e.target.value }))} />
                  ) : user.nickname}
                </h1>
                {user.verification?.verified && <span className="badge badge-success">✓ 实名认证</span>}
                {user.verification?.faceVerified && <span className="badge badge-primary">✓ 人脸认证</span>}
                {user.education?.verified && <span className="badge badge-info">✓ 学历认证</span>}
                {user.career?.verified && <span className="badge badge-warning">✓ 职业认证</span>}
              </div>
              <div className="text-gray-500 mt-1 text-sm">
                {user.gender === 'male' ? '♂ 男' : user.gender === 'female' ? '♀ 女' : ''} · {user.age}岁 · 📍 {user.location?.city || '未知'}
              </div>
            </div>
            {isMe ? (
              editing ? (
                <div className="flex gap-2 pb-3">
                  <button onClick={handleSave} className="btn btn-primary">保存</button>
                  <button onClick={() => setEditing(false)} className="btn btn-secondary">取消</button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="btn btn-secondary mb-3">编辑资料</button>
              )
            ) : (
              <div className="flex gap-2 pb-3">
                <button onClick={handleLike} className="btn btn-primary">❤️ 喜欢</button>
                <Link to={`/chat?u=${id}`} className="btn btn-secondary">💬 私信</Link>
                <button onClick={() => setShowReport(true)} className="btn btn-danger btn-sm">⚠️ 举报</button>
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">个人简介</div>
            {isMe && editing ? (
              <textarea className="input" rows={3} value={editData.bio}
                onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))} />
            ) : (
              <p className="text-gray-600">{user.bio || '这个人很懒，什么都没留下~'}</p>
            )}
          </div>

          <div className="mt-5">
            <div className="text-sm font-medium text-gray-700 mb-2">兴趣标签</div>
            <div className="flex flex-wrap gap-2">
              {(isMe && editing ? editData.interestTags : user.interestTags).map(t => (
                <span key={t} className={`tag tag-primary ${isMe && editing ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (isMe && editing) {
                      setEditData(d => ({ ...d, interestTags: d.interestTags.filter(x => x !== t) }));
                    }
                  }}>
                  #{t} {isMe && editing && '×'}
                </span>
              ))}
              {isMe && editing && (
                <input className="input" style={{ width: 160, display: 'inline-block', padding: '4px 10px' }}
                  placeholder="+ 添加标签" value={editData.newTag}
                  onChange={e => setEditData(d => ({ ...d, newTag: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && editData.newTag.trim()) {
                      e.preventDefault();
                      if (!editData.interestTags.includes(editData.newTag.trim())) {
                        setEditData(d => ({
                          ...d,
                          interestTags: [...d.interestTags, d.newTag.trim()],
                          newTag: ''
                        }));
                      }
                    }
                  }} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '300px 1fr' }}>
        <aside className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <span>⭐ 信用档案</span>
              <span className={`badge ${user.creditScore >= 700 ? 'badge-success' : user.creditScore >= 600 ? 'badge-warning' : 'badge-danger'}`}>
                {getScoreLevel(user.creditScore)}
              </span>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none"
                      stroke={getScoreColor(user.creditScore)}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(user.creditScore / 900) * 314} 314`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold" style={{ color: getScoreColor(user.creditScore) }}>
                      {user.creditScore}
                    </div>
                    <div className="text-xs text-gray-500">满分 900</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">实名认证</span>
                  <span className={user.verification?.verified ? 'text-green-600' : 'text-gray-400'}>
                    {user.verification?.verified ? '✓ 已完成' : '未完成'}
                  </span></div>
                <div className="flex justify-between"><span className="text-gray-500">人脸认证</span>
                  <span className={user.verification?.faceVerified ? 'text-green-600' : 'text-gray-400'}>
                    {user.verification?.faceVerified ? '✓ 已完成' : '未完成'}
                  </span></div>
                <div className="flex justify-between"><span className="text-gray-500">学历认证</span>
                  <span className={user.education?.verified ? 'text-green-600' : 'text-gray-400'}>
                    {user.education?.verified ? '✓ 已完成' : '未完成'}
                  </span></div>
                <div className="flex justify-between"><span className="text-gray-500">职业认证</span>
                  <span className={user.career?.verified ? 'text-green-600' : 'text-gray-400'}>
                    {user.career?.verified ? '✓ 已完成' : '未完成'}
                  </span></div>
              </div>
            </div>
          </div>

          {isMe && creditRecords.length > 0 && (
            <div className="card">
              <div className="card-header">📜 信用记录</div>
              <div className="card-body space-y-2 max-h-64 overflow-y-auto">
                {creditRecords.map(r => (
                  <div key={r.id} className="text-sm flex justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{r.reason}</div>
                      <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`font-bold ${r.scoreChange > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {r.scoreChange > 0 ? '+' : ''}{r.scoreChange}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="space-y-6">
          <div className="card">
            <div className="card-header">🏫 教育背景 & 💼 职业信息</div>
            <div className="card-body grid grid-2 gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="p-4 bg-indigo-50 rounded-xl">
                <div className="text-2xl mb-2">🏫</div>
                <div className="font-medium">{user.education?.school || '未填写'}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {user.education?.level === 'phd' ? '博士' : user.education?.level === 'master' ? '硕士' : user.education?.level === 'bachelor' ? '本科' : ''}
                  {user.education?.major && ` · ${user.education.major}专业`}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {user.education?.graduationYear}届毕业 {user.education?.verified && '· ✓ 已认证'}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="text-2xl mb-2">💼</div>
                <div className="font-medium">{user.career?.company || '未填写'}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {user.career?.position}
                  {user.career?.industry && ` · ${user.career.industry}行业`}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {user.career?.yearsOfExperience}年经验 {user.career?.verified && '· ✓ 已认证'}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <span>🎊 参与的组局</span>
              <Link to="/activities" className="text-sm text-indigo-600 hover:underline">查看全部 →</Link>
            </div>
            <div className="card-body">
              {activities.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">暂无活动</div>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 5).map(a => (
                    <Link to={`/activities/${a.id}`} key={a.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center text-2xl">🎉</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{a.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(a.startTime).toLocaleDateString()} · {a.location.name}
                        </div>
                      </div>
                      <span className={`badge ${
                        a.status === 'completed' ? 'badge-secondary' :
                        a.status === 'recruiting' ? 'badge-info' :
                        a.status === 'confirmed' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {a.status === 'completed' ? '已完成' :
                         a.status === 'recruiting' ? '招募中' :
                         a.status === 'confirmed' ? '已成行' : '进行中'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="card-header">⚠️ 举报用户 {user.nickname}</div>
            <div className="card-body space-y-4">
              <div className="form-group">
                <label className="form-label">举报类型</label>
                <select className="input" value={reportData.category}
                  onChange={e => setReportData(d => ({ ...d, category: e.target.value as never }))}>
                  <option value="inappropriate_content">发布不当内容</option>
                  <option value="harassment">骚扰/恶意行为</option>
                  <option value="scam">诈骗/可疑行为</option>
                  <option value="fake_profile">虚假资料</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">详细描述</label>
                <textarea className="input" rows={4} value={reportData.description}
                  onChange={e => setReportData(d => ({ ...d, description: e.target.value }))}
                  placeholder="请详细描述情况..." />
              </div>
              <div className="form-group">
                <label className="form-label">证据链接 (可选)</label>
                <input className="input" value={reportData.evidence}
                  onChange={e => setReportData(d => ({ ...d, evidence: e.target.value }))} />
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
                ⚠️ 恶意举报将扣减信用分。查实的违规行为将对被举报人处以信用分扣减、功能限制甚至封号处罚。
              </div>
              <div className="flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setShowReport(false)}>取消</button>
                <button className="btn btn-danger flex-1" onClick={handleReport}>提交举报</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
