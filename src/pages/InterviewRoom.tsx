import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, FileText, Bot } from 'lucide-react';

const API = '/api';

interface ChatMessage {
  id: string;
  sender_id: number;
  sender_name: string;
  role: string;
  content: string;
  type: 'text' | 'file' | 'system';
  created_at: string;
}

interface InterviewData {
  id: string;
  job_title: string;
  status: string;
  messages: ChatMessage[];
}

const roleColors: Record<string, string> = {
  HR: 'bg-blue-500 text-white',
  导师: 'bg-purple-500 text-white',
  学生: 'bg-emerald-500 text-white',
  system: '',
};

const roleLabelColors: Record<string, string> = {
  HR: 'bg-blue-100 text-blue-700',
  导师: 'bg-purple-100 text-purple-700',
  学生: 'bg-emerald-100 text-emerald-700',
};

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API}/interviews/${id}`);
        if (!res.ok) throw new Error('获取面试详情失败');
        const json = await res.json();
        const d = json.data ?? json;
        if (!cancelled) {
          setInterview(d);
          setMessages(d.messages || []);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || '请求失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !id) return;
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: 1,
      sender_name: '张明远',
      role: 'HR',
      content: input,
      type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    const content = input;
    setInput('');
    try {
      await fetch(`${API}/interviews/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: 1, content, type: 'text' }),
      });
    } catch {}
  };

  const handleShareFile = async () => {
    if (!id) return;
    const filename = prompt('输入文件名');
    if (!filename) return;
    const optimisticMsg: ChatMessage = {
      id: `temp-file-${Date.now()}`,
      sender_id: 1,
      sender_name: '张明远',
      role: 'HR',
      content: filename,
      type: 'file',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    try {
      await fetch(`${API}/interviews/${id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: 1, file_url: `simulated-url-${filename}`, content: filename }),
      });
    } catch {}
  };

  const handleSummary = async () => {
    if (!id) return;
    setSummaryLoading(true);
    try {
      const res = await fetch(`${API}/interviews/${id}/summary`);
      if (!res.ok) throw new Error('获取摘要失败');
      const json = await res.json();
      const d = json.data ?? json;
      setSummary(d.summary || JSON.stringify(d));
    } catch (err: any) {
      setSummary('摘要生成失败：' + (err.message || '未知错误'));
    } finally {
      setSummaryLoading(false);
    }
  };

  const fileMessages = messages.filter((m) => m.type === 'file');
  const participants = Array.from(
    new Map(
      messages
        .filter((m) => m.type !== 'system')
        .map((m) => [m.sender_id, { name: m.sender_name, role: m.role }])
    ).values()
  );

  const statusLabelMap: Record<string, string> = {
    scheduled: '待开始',
    in_progress: '进行中',
    completed: '已结束',
  };

  if (loading) return <div className="text-center py-20 text-gray-400 animate-fade-in">加载中...</div>;
  if (error) return <div className="text-center py-20 text-red-500 animate-fade-in">{error}</div>;

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/interviews')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-lg font-heading font-bold text-gray-800">{interview?.job_title || '面试'}</h2>
          <p className="text-xs text-gray-500">面试ID: {id} · {statusLabelMap[interview?.status || ''] || interview?.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-3 card-base flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-xs bg-gray-100 text-gray-500 px-4 py-1 rounded-full">{msg.content}</span>
                  </div>
                );
              }
              if (msg.type === 'file') {
                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${roleColors[msg.role] || 'bg-gray-500 text-white'}`}>
                      {msg.sender_name?.[0] || '?'}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-sm">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span className="text-sm text-primary font-medium">{msg.content}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              }
              const isMe = msg.role === 'HR';
              return (
                <div key={msg.id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${roleColors[msg.role] || 'bg-gray-500 text-white'}`}>
                    {msg.sender_name?.[0] || '?'}
                  </div>
                  <div className={`max-w-md ${isMe ? 'bg-primary text-white rounded-l-xl rounded-tr-xl' : 'bg-gray-100 text-gray-800 rounded-r-xl rounded-tl-xl'} px-4 py-2.5`}>
                    <div className={`flex items-center gap-2 mb-1 ${isMe ? 'justify-end' : ''}`}>
                      <span className="text-xs font-medium opacity-80">{msg.sender_name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${isMe ? 'bg-white/20' : roleLabelColors[msg.role] || 'bg-gray-100 text-gray-600'}`}>
                        {msg.role}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-100 p-3 flex items-center gap-3">
            <button onClick={handleShareFile} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Paperclip size={18} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="flex-1 input-base"
            />
            <button onClick={handleSend} className="btn-primary p-2">
              <Send size={16} />
            </button>
            <button onClick={handleSummary} disabled={summaryLoading} className="btn-outline flex items-center gap-2 text-sm disabled:opacity-50">
              <Bot size={16} />{summaryLoading ? '生成中...' : '生成摘要'}
            </button>
          </div>
        </div>

        <div className="card-base p-4 overflow-y-auto">
          <h4 className="font-heading font-semibold text-gray-800 mb-3">共享文件</h4>
          <div className="space-y-2">
            {fileMessages.length > 0 ? fileMessages.map((msg) => (
              <div key={msg.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <FileText size={14} className="text-primary" />
                <span className="text-sm text-gray-700 truncate">{msg.content}</span>
              </div>
            )) : (
              <p className="text-xs text-gray-400 text-center py-3">暂无共享文件</p>
            )}
          </div>

          <h4 className="font-heading font-semibold text-gray-800 mt-6 mb-3">参与者</h4>
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${roleColors[p.role] || 'bg-gray-500 text-white'}`}>
                  {p.name[0]}
                </div>
                <span className="text-sm text-gray-700">{p.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ml-auto ${roleLabelColors[p.role] || 'bg-gray-100 text-gray-600'}`}>
                  {p.role}
                </span>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">暂无参与者</p>
            )}
          </div>

          {summary && (
            <>
              <h4 className="font-heading font-semibold text-gray-800 mt-6 mb-3">面试摘要</h4>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed">
                {summary}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
