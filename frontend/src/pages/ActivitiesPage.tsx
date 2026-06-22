import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { activityApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { Activity } from '../types';

const categoryMap: Record<string, { name: string; icon: string }> = {
  all: { name: '全部', icon: '✨' },
  food: { name: '美食', icon: '🍜' },
  sports: { name: '运动', icon: '⚽' },
  movie: { name: '影视', icon: '🎬' },
  travel: { name: '旅行', icon: '✈️' },
  study: { name: '学习', icon: '📚' },
  game: { name: '游戏', icon: '🎮' },
  music: { name: '音乐', icon: '🎵' },
  outdoor: { name: '户外', icon: '🏕️' },
  party: { name: '派对', icon: '🥳' },
  other: { name: '其他', icon: '🌟' },
};

const statusMap: Record<string, { name: string; class: string }> = {
  recruiting: { name: '招募中', class: 'badge-info' },
  confirmed: { name: '已成行', class: 'badge-success' },
  ongoing: { name: '进行中', class: 'badge-warning' },
  completed: { name: '已完成', class: 'badge-secondary' },
  cancelled: { name: '已取消', class: 'badge-danger' },
};

export default function ActivitiesPage() {
  const { showToast, currentUser } = useAppStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'all' | 'mine' | 'joined'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize: 12 };
      if (category !== 'all') params.category = category;
      if (status !== 'all') params.status = status;
      if (tab === 'mine' && currentUser) params.userId = currentUser.id;
      const res = await activityApi.list(params);
      const data = res as unknown as { items: Activity[]; total: number };
      setActivities(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [category, status, page, tab, currentUser?.id]);

  const handleApply = async (id: string) => {
    try {
      await activityApi.apply(id);
      showToast('报名成功！', 'success');
      void load();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const approvedCount = (a: Activity) => a.participants.filter(p => p.status === 'approved').length;

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">🎉 组局活动</h1>
          <p className="text-sm text-gray-500 mt-1">基于信用锚点的高品质线下社交，共 {total} 个活动</p>
        </div>
        <Link to="/activities/new" className="btn btn-primary">+ 发起新组局</Link>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        <button onClick={() => setTab('all')} className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`}>全部活动</button>
        <button onClick={() => setTab('mine')} className={`btn btn-sm ${tab === 'mine' ? 'btn-primary' : 'btn-secondary'}`}>我发起的</button>
        <button onClick={() => setTab('joined')} className={`btn btn-sm ${tab === 'joined' ? 'btn-primary' : 'btn-secondary'}`}>我报名的</button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {Object.entries(categoryMap).map(([k, v]) => (
          <button key={k} onClick={() => setCategory(k)}
            className={`btn btn-sm flex-shrink-0 ${category === k ? 'btn-primary' : 'btn-secondary'}`}>
            <span className="mr-1">{v.icon}</span>{v.name}
          </button>
        ))}
        <div className="flex-1" />
        <select className="input" style={{ width: 140 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">全部状态</option>
          {Object.entries(statusMap).map(([k, v]) => (
            <option key={k} value={k}>{v.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">加载中...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-6xl mb-4">🎉</div>
          <p>暂无活动，去发起第一个吧</p>
        </div>
      ) : (
        <div className="grid grid-3 gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {activities.map(a => {
            const catInfo = categoryMap[a.category] || categoryMap.other;
            const sInfo = statusMap[a.status];
            const pCount = approvedCount(a);
            const isFull = pCount >= a.maxParticipants;
            const isMine = currentUser && a.creatorId === currentUser.id;
            const hasJoined = currentUser && a.participants.some(p => p.userId === currentUser.id && p.status !== 'cancelled' && p.status !== 'rejected');

            return (
              <Link key={a.id} to={`/activities/${a.id}`} className="card hover:shadow-lg transition hover:-translate-y-1">
                <div className="aspect-[16/9] bg-gradient-to-br from-indigo-50 to-pink-50 flex items-center justify-center text-7xl relative">
                  {catInfo.icon}
                  <span className={`absolute top-3 right-3 badge ${sInfo.class}`}>{sInfo.name}</span>
                  {a.feePerPerson > 0 && (
                    <span className="absolute top-3 left-3 badge badge-warning">¥{a.feePerPerson}/人</span>
                  )}
                </div>
                <div className="card-body">
                  <h3 className="font-bold text-lg truncate">{a.title}</h3>
                  <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                    <div>📍 {a.location.name}</div>
                    <div>🕐 {new Date(a.startTime).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    <div>👥 {pCount}/{a.maxParticipants}人 · 最低信用分 {a.minCreditScore}</div>
                  </div>

                  <div className="mt-3 flex gap-1 flex-wrap">
                    {a.tags.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {a.participants.slice(0, 4).map(p => (
                        <img key={p.userId} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userId}`} alt="" className="w-8 h-8 rounded-full border-2 border-white bg-gray-100" />
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isMine && !hasJoined && !isFull && a.status === 'recruiting') {
                          void handleApply(a.id);
                        }
                      }}
                      disabled={isMine || hasJoined || isFull || a.status !== 'recruiting'}
                      className={`btn btn-sm ${
                        isMine ? 'btn-secondary' :
                        hasJoined ? 'btn-success' :
                        isFull ? 'btn-secondary' :
                        'btn-primary'
                      }`}
                    >
                      {isMine ? '我发起的' :
                       hasJoined ? '✓ 已报名' :
                       isFull ? '已满员' :
                       '立即报名'}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {total > 0 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>上一页</button>
          <span className="text-sm text-gray-600 px-4">第 {page} 页</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page * 12 >= total}>下一页</button>
        </div>
      )}
    </div>
  );
}
