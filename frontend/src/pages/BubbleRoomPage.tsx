import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { bubbleApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { BubbleRoom, BubbleMember, BubbleMessage } from '../types';

export default function BubbleRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, showToast } = useAppStore();
  const [room, setRoom] = useState<BubbleRoom | null>(null);
  const [messages, setMessages] = useState<BubbleMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [inRoom, setInRoom] = useState(false);
  const [showRedPacket, setShowRedPacket] = useState(false);
  const [rpConfig, setRpConfig] = useState({ total: 10, count: 5, type: 'fate' as const });
  const scrollRef = useRef<HTMLDivElement>(null);
  const heartbeatRef = useRef<number | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [roomData, msgData] = await Promise.all([
        bubbleApi.getById(id),
        bubbleApi.getMessages(id)
      ]);
      setRoom(roomData as BubbleRoom);
      setMessages((msgData as unknown as BubbleMessage[]) || []);
      if (currentUser) {
        setInRoom((roomData as BubbleRoom).members?.some((m: BubbleMember) => m.userId === currentUser.id) || false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  useEffect(() => {
    if (inRoom && id) {
      heartbeatRef.current = window.setInterval(() => {
        void bubbleApi.heartbeat(id);
      }, 30000);
      return () => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      };
    }
  }, [inRoom, id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  if (loading) return <div className="page-container py-20 text-center text-gray-500">加载中...</div>;
  if (!room) return <div className="page-container py-20 text-center text-gray-500">房间不存在</div>;

  const handleJoin = async () => {
    try {
      await bubbleApi.join(id!);
      showToast('加入成功！', 'success');
      setInRoom(true);
      void load();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleLeave = async () => {
    try {
      await bubbleApi.leave(id!);
      showToast('已离开房间', 'info');
      navigate('/bubble');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !inRoom) return;
    try {
      await bubbleApi.sendMessage(id!, { type: 'text', content: input });
      setInput('');
      void load();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleSendRP = async () => {
    try {
      await bubbleApi.sendRedPacket(id!, {
        totalAmount: rpConfig.total,
        packetCount: rpConfig.count,
        distributionType: rpConfig.type
      });
      showToast('红包发送成功！', 'success');
      setShowRedPacket(false);
      void load();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleClaimRP = async (rpId: string) => {
    try {
      const res = await bubbleApi.claimRedPacket(rpId);
      const r = res as { success: boolean; amount?: number; message: string };
      showToast(r.amount ? `抢到 ¥${r.amount}！` : r.message, r.success ? 'success' : 'info');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const typeColors: Record<string, string> = {
    single: 'from-pink-500 to-rose-500',
    youth: 'from-cyan-500 to-blue-500',
    fate_redpacket: 'from-amber-500 to-orange-500'
  };

  return (
    <div className="page-container max-w-6xl">
      <Link to="/bubble" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">← 返回房间列表</Link>

      <div className={`rounded-2xl overflow-hidden shadow-xl mb-5 bg-gradient-to-r ${typeColors[room.roomType]} text-white p-6`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">
                {room.roomType === 'single' ? '💕' : room.roomType === 'youth' ? '🎈' : '🧧'}
              </span>
              <h1 className="text-2xl font-bold">{room.title}</h1>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>
                {room.status === 'active' ? '直播中' : '等待中'}
              </span>
            </div>
            <div className="opacity-90 text-sm">
              📍 {room.city} · 👥 {room.members?.length || 0}/{room.maxMembers}人 · ⭐ 最低信用分{room.minCreditScore}
            </div>
          </div>
          <div className="flex gap-3">
            {inRoom ? (
              <button onClick={handleLeave} className="btn btn-danger">离开房间</button>
            ) : (
              <button onClick={handleJoin} className="btn" style={{ background: 'white', color: '#6366f1' }}>加入房间</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '280px 1fr' }}>
        <aside className="card h-fit">
          <div className="card-header">👥 房间成员 ({room.members?.length || 0})</div>
          <div className="card-body space-y-3">
            {room.members?.map(m => (
              <div key={m.userId} className="flex items-center gap-3">
                <div className="relative">
                  <img src={m.user?.avatar} alt="" className="avatar avatar-sm" />
                  {m.micEnabled && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-[8px] flex items-center justify-center text-white">🎤</span>}
                  {m.isHost && <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[8px] flex items-center justify-center text-white">👑</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate flex items-center gap-1">
                    {m.user?.nickname}
                  </div>
                  <div className="text-xs text-gray-500">⭐ {m.user?.creditScore}</div>
                </div>
              </div>
            ))}
          </div>

          {room.redPacketRules && (
            <div className="card-body pt-0 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">🧧 房间红包规则</div>
              <div className="space-y-1 text-sm">
                <div>总额: ¥{room.redPacketRules.totalAmount}</div>
                <div>数量: {room.redPacketRules.packetCount}个</div>
                <div>分发: {room.redPacketRules.distributionType === 'fate' ? '缘分匹配' : room.redPacketRules.distributionType}</div>
              </div>
            </div>
          )}
        </aside>

        <section className="card flex flex-col" style={{ height: '65vh' }}>
          <div className="card-header flex items-center justify-between">
            <span>💬 房间消息</span>
            {inRoom && (
              <button onClick={() => setShowRedPacket(true)} className="btn btn-warning btn-sm">🧧 发红包</button>
            )}
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">暂无消息，快来说点什么吧～</div>
            ) : (
              messages.map(msg => {
                const isMine = msg.senderId === currentUser?.id;
                if (msg.type === 'system') {
                  return (
                    <div key={msg.id} className="text-center">
                      <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">{msg.content}</span>
                    </div>
                  );
                }
                if (msg.type === 'redpacket') {
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs ${isMine ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-end gap-2">
                          {!isMine && <img src={msg.sender?.avatar} className="avatar avatar-sm" alt="" />}
                          <div className="p-4 rounded-2xl text-white cursor-pointer hover:opacity-90 transition"
                            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', minWidth: 200 }}
                            onClick={() => msg.redPacketId && void handleClaimRP(msg.redPacketId)}>
                            <div className="text-center">
                              <div className="text-4xl mb-1">🧧</div>
                              <div className="font-bold">{msg.content}</div>
                              <div className="text-xs opacity-80 mt-1">点击拆开红包</div>
                            </div>
                          </div>
                          {isMine && <img src={msg.sender?.avatar} className="avatar avatar-sm" alt="" />}
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                      {!isMine && <div className="text-xs text-gray-400 mb-1 ml-2">{msg.sender?.nickname}</div>}
                      <div className="flex items-end gap-2">
                        {!isMine && <img src={msg.sender?.avatar} className="avatar avatar-sm" alt="" />}
                        <div className={`px-4 py-2.5 rounded-2xl ${
                          isMine ? 'bg-indigo-500 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                        } ${msg.riskFlagged ? 'ring-2 ring-red-400' : ''}`}>
                          {msg.content}
                          {msg.riskFlagged && <div className="text-xs mt-1 opacity-75">⚠️ 已被风控过滤</div>}
                        </div>
                        {isMine && <img src={msg.sender?.avatar} className="avatar avatar-sm" alt="" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-gray-100 flex gap-3">
            <input
              className="input"
              placeholder={inRoom ? '说点什么...（敏感词会被自动过滤）' : '请先加入房间后发言'}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!inRoom}
              onKeyDown={e => { if (e.key === 'Enter') void handleSend(); }}
            />
            <button onClick={handleSend} disabled={!inRoom || !input.trim()} className="btn btn-primary px-6">
              发送
            </button>
          </div>
        </section>
      </div>

      {showRedPacket && (
        <div className="modal-overlay" onClick={() => setShowRedPacket(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}
            style={{ background: 'linear-gradient(135deg, #fef3c7, #fecaca)' }}>
            <div className="p-8 text-center">
              <div className="text-7xl mb-4">🧧</div>
              <h2 className="text-2xl font-bold text-red-600 mb-6">发红包</h2>
              <div className="space-y-4 text-left">
                <div className="form-group">
                  <label className="form-label font-medium text-gray-700">总金额 (元)</label>
                  <input type="number" className="input bg-white" min={1} max={2000}
                    value={rpConfig.total}
                    onChange={e => setRpConfig(c => ({ ...c, total: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="form-group">
                  <label className="form-label font-medium text-gray-700">红包个数</label>
                  <input type="number" className="input bg-white" min={1}
                    value={rpConfig.count}
                    onChange={e => setRpConfig(c => ({ ...c, count: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="form-group">
                  <label className="form-label font-medium text-gray-700">分发方式</label>
                  <select className="input bg-white" value={rpConfig.type}
                    onChange={e => setRpConfig(c => ({ ...c, type: e.target.value as never }))}>
                    <option value="fate">缘分红包（条件匹配，隐私加密）</option>
                    <option value="random">随机红包（手气红包）</option>
                    <option value="equal">平均红包</option>
                  </select>
                </div>
                <div className="p-3 bg-white/60 rounded-lg text-xs text-gray-600">
                  🔒 金额采用Base64密钥加密分发，未领取24小时自动退回。缘分红包根据兴趣标签、信用分匹配条件筛选领取人。
                </div>
                <button onClick={handleSendRP} className="btn btn-danger w-full py-3 text-lg" style={{ background: '#ef4444' }}>
                  塞钱进红包 ¥{rpConfig.total}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
