import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { chatApi, matchingApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { Conversation, ChatMessage, TopicSuggestion } from '../types';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('u');
  const { currentUser, showToast } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [contextInfo, setContextInfo] = useState<{ commonTopics: string[]; friendshipScore: number }>({ commonTopics: [], friendshipScore: 0 });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const list = await chatApi.getConversations();
      setConversations(list as Conversation[]);
      if (list.length > 0 && !activeId) {
        setActiveId(list[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, [currentUser?.id]);

  useEffect(() => {
    if (targetUserId && !activeId) {
      void (async () => {
        try {
          await matchingApi.like(targetUserId);
          const res = await chatApi.sendMessage(targetUserId, '');
          setActiveId((res as { conversationId: string }).conversationId);
        } catch {
        }
      })();
    }
  }, [targetUserId]);

  useEffect(() => {
    if (!activeId) return;
    void (async () => {
      try {
        const [msgs, sugs, ctx] = await Promise.all([
          chatApi.getMessages(activeId),
          chatApi.getTopicSuggestions(activeId),
          chatApi.getContext(activeId)
        ]);
        setMessages(msgs as ChatMessage[]);
        setSuggestions(sugs as TopicSuggestion[]);
        setContextInfo({ commonTopics: ctx.commonTopics || [], friendshipScore: ctx.friendshipScore || 0 });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || !activeId) return;
    const conv = conversations.find(c => c.id === activeId);
    const otherId = conv?.participants.find(p => p !== currentUser?.id);
    if (!otherId) return;
    try {
      await chatApi.sendMessage(otherId, input.trim());
      setInput('');
      const msgs = await chatApi.getMessages(activeId);
      setMessages(msgs as ChatMessage[]);
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);
  const otherUser = activeConv?.otherUser;

  return (
    <div className="page-container max-w-6xl p-0 h-[calc(100vh-120px)]">
      <h1 className="text-2xl font-bold px-6 pt-4 mb-4">✉️ 消息</h1>
      <div className="grid mx-6 mb-6 overflow-hidden rounded-2xl border border-gray-200 shadow-sm h-[calc(100%-80px)]"
        style={{ gridTemplateColumns: '320px 1fr 280px' }}>

        <aside className="bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <input className="input" placeholder="搜索会话..." />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-10 text-sm text-gray-400">加载中...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">
                <div className="text-4xl mb-2">💬</div>
                暂无会话，去匹配认识新朋友吧
                <div className="mt-4">
                  <Link to="/match" className="btn btn-primary btn-sm">去匹配</Link>
                </div>
              </div>
            ) : (
              conversations.map(c => (
                <button key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition flex items-start gap-3 ${
                    activeId === c.id ? 'bg-indigo-50' : ''
                  }`}>
                  <img src={c.otherUser?.avatar} className="avatar flex-shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{c.otherUser?.nickname}</span>
                      {c.unread > 0 && <span className="badge badge-danger">{c.unread}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {c.lastMessage?.content || '暂无消息'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex flex-col bg-gray-50">
          {activeConv && otherUser ? (
            <>
              <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <Link to={`/profile/${otherUser.id}`} className="flex items-center gap-3 hover:opacity-80">
                  <img src={otherUser.avatar} className="avatar" alt="" />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {otherUser.nickname}
                      {otherUser.online && <span className="w-2 h-2 rounded-full bg-green-500" />}
                    </div>
                    <div className="text-xs text-gray-500">
                      {otherUser.city} · ⭐{otherUser.creditScore}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Link to="/safety" className="btn btn-sm btn-warning">🛡️ 平安哨</Link>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <div className="text-5xl mb-4">👋</div>
                    <p>开始你们的对话吧</p>
                    <p className="text-xs mt-2">（消息将经过敏感词风控审核）</p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMine = m.senderId === currentUser?.id;
                    return (
                      <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md ${isMine ? 'order-2 ml-3' : 'order-1 mr-3'}`}>
                          {!isMine && <div className="text-xs text-gray-400 mb-1 ml-2">{otherUser.nickname}</div>}
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            isMine ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                          } ${m.riskFlagged ? 'ring-2 ring-red-400' : ''}`}>
                            {m.content}
                            {m.riskFlagged && <div className="text-[10px] mt-1 opacity-80">⚠️ {m.riskReason}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {suggestions.length > 0 && (
                <div className="px-6 py-3 bg-white border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">
                    🤖 AI 话题推荐（基于聊天上下文记忆）
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {suggestions.slice(0, 4).map(s => (
                      <button key={s.id} onClick={() => setInput(s.suggestion)}
                        className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition">
                        💡 {s.suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
                <input
                  className="input"
                  placeholder="输入消息..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') void handleSend(); }}
                />
                <button onClick={handleSend} disabled={!input.trim()} className="btn btn-primary px-6">发送</button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-6xl mb-4">💬</div>
              <p>选择一个会话开始聊天</p>
            </div>
          )}
        </main>

        {otherUser && (
          <aside className="bg-white border-l border-gray-200 p-5 overflow-y-auto">
            <div className="text-center mb-6">
              <img src={otherUser.avatar} className="avatar avatar-xl mx-auto mb-3" alt="" />
              <div className="font-bold text-lg">{otherUser.nickname}</div>
              <div className="text-xs text-gray-500 mt-1">{otherUser.age}岁 · {otherUser.city}</div>
            </div>

            {contextInfo.friendshipScore > 0 && (
              <div className="mb-5 p-4 bg-gradient-to-br from-pink-50 to-indigo-50 rounded-xl text-center">
                <div className="text-xs text-gray-500 mb-1">亲密指数</div>
                <div className="text-3xl font-bold text-pink-500">{contextInfo.friendshipScore}</div>
                <div className="w-full h-2 bg-white rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-400 to-indigo-500"
                    style={{ width: `${Math.min(100, contextInfo.friendshipScore)}%` }} />
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">⭐ 信用分</div>
                <div className="text-2xl font-bold text-indigo-600">{otherUser.creditScore}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">🔗 共同话题</div>
                <div>
                  {contextInfo.commonTopics.length > 0 ? (
                    contextInfo.commonTopics.map(t => (
                      <span key={t} className="tag tag-primary">#{t}</span>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400">暂无，多聊聊就有了～</div>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <Link to={`/profile/${otherUser.id}`} className="btn btn-secondary w-full btn-sm">查看详细资料</Link>
                <Link to="/match" className="btn btn-secondary w-full btn-sm">认识更多朋友</Link>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
