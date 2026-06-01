import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { getConversations, getMessages, sendMessage, markMessageRead, proposeInterview, getInterviews, updateInterview } from '@/api/chat';
import type { Conversation, Message, InterviewAppointment } from '@/types';

export default function Chat() {
  const { convId } = useParams<{ convId: string }>();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedConv, setSelectedConv] = useState<number | null>(convId ? Number(convId) : null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviews, setInterviews] = useState<InterviewAppointment[]>([]);
  const [interviewForm, setInterviewForm] = useState({ proposed_time: '', location: '', notes: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getConversations().then((res) => {
      setConversations(res.list);
      if (!selectedConv && res.list.length > 0) {
        setSelectedConv(res.list[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    getMessages(selectedConv).then((res) => setMessages(res.list));
    getInterviews(selectedConv).then(setInterviews).catch(() => {});
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedConv) return;
    try {
      const msg = await sendMessage(selectedConv, { content: input.trim() });
      setMessages((prev) => [...prev, msg]);
      setInput('');
    } catch {
      alert('发送失败');
    }
  };

  const handleRead = async (msgId: number) => {
    try {
      await markMessageRead(msgId);
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, is_read: 1 } : m)));
    } catch {}
  };

  const handleProposeInterview = async () => {
    if (!selectedConv || !interviewForm.proposed_time) return;
    try {
      const interview = await proposeInterview(selectedConv, interviewForm);
      setInterviews((prev) => [...prev, interview]);
      setShowInterviewModal(false);
      setInterviewForm({ proposed_time: '', location: '', notes: '' });
      const msgs = await getMessages(selectedConv);
      setMessages(msgs.list);
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleUpdateInterview = async (id: number, status: 'confirmed' | 'cancelled') => {
    try {
      await updateInterview(id, { status });
      setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    } catch {
      alert('操作失败');
    }
  };

  const getOtherName = (conv: Conversation) => {
    if (user?.role === 'employer' || conv.employer_id !== user?.id) {
      return conv.worker_nickname || `用户${conv.worker_id}`;
    }
    return conv.employer_nickname || `雇主${conv.employer_id}`;
  };

  return (
    <div className="flex h-[calc(100vh)] chat-container">
      <div className="w-72 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">消息中心</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors ${
                selectedConv === conv.id ? 'bg-brand-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-slate-700 truncate">{getOtherName(conv)}</span>
                <span className="text-xs text-slate-400">{conv.last_message_at?.slice(5, 16)}</span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{conv.last_message || '暂无消息'}</p>
              <p className="text-xs text-brand-400 mt-0.5">{conv.job_title}</p>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">暂无会话</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-700">
                  {conversations.find((c) => c.id === selectedConv)?.job_title || '会话'}
                </p>
              </div>
              <button onClick={() => setShowInterviewModal(true)} className="btn-secondary text-sm">
                预约面试
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isMine ? 'bg-brand-500 text-white' : 'bg-white border border-slate-100 text-slate-700'
                      }`}
                      onClick={() => !isMine && msg.is_read === 0 && handleRead(msg.id)}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${isMine ? 'text-white/60' : 'text-slate-400'}`}>
                        <span>{msg.created_at?.slice(11, 16)}</span>
                        {isMine && (
                          <span>{msg.is_read ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="input-field flex-1"
                  placeholder="输入消息..."
                />
                <button onClick={handleSend} className="btn-primary">发送</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            选择一个会话开始聊天
          </div>
        )}
      </div>

      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">预约面试</h3>
            <div className="space-y-4">
              <div>
                <label className="label-text">提议时间 *</label>
                <input
                  type="datetime-local"
                  value={interviewForm.proposed_time}
                  onChange={(e) => setInterviewForm((f) => ({ ...f, proposed_time: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label-text">面试地点</label>
                <input
                  type="text"
                  value={interviewForm.location}
                  onChange={(e) => setInterviewForm((f) => ({ ...f, location: e.target.value }))}
                  className="input-field"
                  placeholder="面试地点"
                />
              </div>
              <div>
                <label className="label-text">备注</label>
                <textarea
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm((f) => ({ ...f, notes: e.target.value }))}
                  className="input-field min-h-[80px]"
                  placeholder="备注信息"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleProposeInterview} className="btn-primary">确认预约</button>
                <button onClick={() => setShowInterviewModal(false)} className="btn-secondary">取消</button>
              </div>
            </div>

            {interviews.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="font-semibold text-sm text-slate-600 mb-2">面试记录</h4>
                <div className="space-y-2">
                  {interviews.map((iv) => (
                    <div key={iv.id} className="p-3 rounded-lg bg-slate-50 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">{iv.proposed_time}</span>
                        <span className={`badge ${iv.status === 'confirmed' ? 'badge-green' : iv.status === 'cancelled' ? 'badge-red' : 'badge-yellow'}`}>
                          {iv.status === 'proposed' ? '待确认' : iv.status === 'confirmed' ? '已确认' : '已取消'}
                        </span>
                      </div>
                      {iv.location && <p className="text-slate-400 mt-1">📍 {iv.location}</p>}
                      {iv.status === 'proposed' && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleUpdateInterview(iv.id, 'confirmed')} className="btn-accent text-xs px-3 py-1">确认</button>
                          <button onClick={() => handleUpdateInterview(iv.id, 'cancelled')} className="btn-danger text-xs px-3 py-1">取消</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
