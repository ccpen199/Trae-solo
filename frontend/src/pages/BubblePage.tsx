import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bubbleApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { BubbleRoom } from '../types';

const typeInfo: Record<string, { icon: string; color: string; name: string }> = {
  single: { icon: '💕', color: 'from-pink-400 to-rose-500', name: '单身房间' },
  youth: { icon: '🎈', color: 'from-cyan-400 to-blue-500', name: '青春派对' },
  fate_redpacket: { icon: '🧧', color: 'from-amber-400 to-orange-500', name: '缘分红包' },
};

export default function BubblePage() {
  const { showToast } = useAppStore();
  const [rooms, setRooms] = useState<BubbleRoom[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [city, setCity] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomType: 'single' as BubbleRoom['roomType'],
    title: '',
    description: '',
    theme: '',
    maxMembers: 8,
    city: '北京',
    ageRange: { min: 18, max: 35 },
    genderPreference: 'balanced' as const,
    minCreditScore: 600,
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { pageSize: 20, status: 'active' };
      if (type !== 'all') params.type = type;
      if (city) params.city = city;
      const res = await bubbleApi.list(params);
      const data = res as unknown as { items: BubbleRoom[]; total: number };
      setRooms(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [type, city]);

  const handleCreate = async () => {
    if (!newRoom.title) {
      showToast('请输入房间标题', 'error');
      return;
    }
    try {
      await bubbleApi.create(newRoom as never);
      showToast('房间创建成功！', 'success');
      setShowCreate(false);
      void load();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newRoom.tags.includes(tagInput.trim())) {
      setNewRoom(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">🫧 泡泡房间</h1>
          <p className="text-sm text-gray-500 mt-1">基于话题的实时在线语音社交 · {total} 个活跃房间</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ 创建房间</button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setType('all')} className={`btn btn-sm ${type === 'all' ? 'btn-primary' : 'btn-secondary'}`}>全部</button>
        {Object.entries(typeInfo).map(([k, v]) => (
          <button key={k} onClick={() => setType(k)} className={`btn btn-sm ${type === k ? 'btn-primary' : 'btn-secondary'}`}>
            {v.icon} {v.name}
          </button>
        ))}
        <div className="flex-1" />
        <input className="input" style={{ width: 180 }} placeholder="城市筛选" value={city}
          onChange={e => setCity(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">加载中...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-6xl mb-4">🫧</div>
          <p>暂无房间，快去创建第一个吧</p>
        </div>
      ) : (
        <div className="grid grid-3 gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {rooms.map(r => {
            const info = typeInfo[r.roomType];
            const memCount = r.currentMembers ?? (r as unknown as { members: unknown[] }).members?.length ?? 0;
            return (
              <Link to={`/bubble/${r.id}`} key={r.id} className="card hover:shadow-lg transition hover:-translate-y-1">
                <div className={`h-32 bg-gradient-to-br ${info.color} text-white flex items-center justify-center relative`}>
                  <div className="text-6xl">{info.icon}</div>
                  <div className="absolute top-3 left-3 badge" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>{info.name}</div>
                  <div className="absolute top-3 right-3 badge badge-success">{memCount}/{r.maxMembers}人</div>
                  {r.host && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs opacity-90">
                      <img src={r.host.avatar} className="w-5 h-5 rounded-full border border-white" alt="" />
                      {r.host.nickname}
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <h3 className="font-bold text-lg truncate">{r.title}</h3>
                  <div className="text-sm text-gray-500 mt-1">📍 {r.city} · {r.theme || '开放话题'}</div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.tags.slice(0, 4).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                  {r.redPacketRules && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm flex items-center gap-2">
                      <span>🧧</span>
                      <span className="text-amber-800">红包池 ¥{r.redPacketRules.totalAmount} · {r.redPacketRules.packetCount}个 · {r.redPacketRules.distributionType === 'fate' ? '缘分分发' : r.redPacketRules.distributionType === 'equal' ? '平均' : '随机'}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="card-header flex justify-between items-center">
              创建新房间
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="card-body space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="form-group">
                <label className="form-label">房间类型</label>
                <div className="grid grid-3 gap-2">
                  {Object.entries(typeInfo).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setNewRoom(f => ({ ...f, roomType: k as never }))}
                      className={`p-3 rounded-xl text-sm border-2 transition ${
                        newRoom.roomType === k ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                      }`}>
                      <div className="text-2xl mb-1">{v.icon}</div>
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">房间标题</label>
                <input className="input" placeholder="起个吸引人的标题吧" value={newRoom.title}
                  onChange={e => setNewRoom(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">房间介绍</label>
                <textarea className="input" rows={3} value={newRoom.description}
                  onChange={e => setNewRoom(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">主题</label>
                  <input className="input" placeholder="如：吐槽大会、学习打卡" value={newRoom.theme}
                    onChange={e => setNewRoom(f => ({ ...f, theme: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">城市</label>
                  <input className="input" value={newRoom.city}
                    onChange={e => setNewRoom(f => ({ ...f, city: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">最大人数: {newRoom.maxMembers}</label>
                  <input type="range" className="w-full" min={4} max={20} value={newRoom.maxMembers}
                    onChange={e => setNewRoom(f => ({ ...f, maxMembers: parseInt(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">最低信用分: {newRoom.minCreditScore}</label>
                  <input type="range" className="w-full" min={500} max={800} step={50} value={newRoom.minCreditScore}
                    onChange={e => setNewRoom(f => ({ ...f, minCreditScore: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">房间标签</label>
                <div className="flex gap-2">
                  <input className="input" value={tagInput} placeholder="回车添加"
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                  <button type="button" onClick={addTag} className="btn btn-secondary">添加</button>
                </div>
                <div className="mt-2">
                  {newRoom.tags.map((t, i) => (
                    <span key={t} className="tag tag-primary mr-2 cursor-pointer"
                      onClick={() => setNewRoom(f => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }))}>{t} ×</span>
                  ))}
                </div>
              </div>
              <button onClick={handleCreate} className="btn btn-primary w-full">创建房间</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
