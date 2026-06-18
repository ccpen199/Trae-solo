import { useState } from 'react';
import { Search, Send, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface PolicyResult {
  id: number;
  title: string;
  content: string;
  category: string;
}

const mockResults: PolicyResult[] = [
  { id: 1, title: '关于调整2026年社保缴费基数的通知', content: '根据国家统计局公布的数据，现对2026年度社会保险缴费基数进行调整...', category: '社保政策' },
  { id: 2, title: '失业保险金申领操作指南', content: '失业人员可通过人社中台在线申领失业保险金，需准备身份证、离职证明...', category: '就业政策' },
  { id: 3, title: '职称评审管理办法', content: '为规范职称评审工作，根据《职称评审管理暂行规定》...', category: '人才政策' },
];

const categoryColors: Record<string, string> = {
  '社保政策': 'bg-primary-100 text-primary-700',
  '就业政策': 'bg-accent-100 text-accent-600',
  '人才政策': 'bg-success-100 text-success-600',
  '劳动关系': 'bg-neutral-200 text-neutral-600',
};

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export default function Policy() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PolicyResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);
    try {
      const data = await apiFetch<PolicyResult[]>(`/api/policy/search?q=${encodeURIComponent(query)}`);
      setResults(data);
    } catch {
      setResults(mockResults);
    }
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMsg = { role: 'user', content: chatInput };
    setChatMessages([...chatMessages, userMsg]);
    setChatInput('');
    setTimeout(() => {
      const reply: ChatMsg = {
        role: 'assistant',
        content: '根据相关政策规定，您咨询的问题可参考以下内容：建议您前往对应业务模块进行办理，或拨打12333咨询热线获取详细指导。',
      };
      setChatMessages((prev) => [...prev, reply]);
    }, 500);
  };

  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;
    const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, idx) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark key={idx} className="bg-accent-200 text-accent-800 rounded px-0.5">{part}</mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">政策问答</h1>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="搜索政策文件、常见问题..."
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-2.5 bg-primary-700 text-white rounded-lg text-sm hover:bg-primary-800"
        >
          搜索
        </button>
      </div>

      {searched && (
        <div className="space-y-3">
          {results.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-neutral-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary-500" />
                <h3 className="text-sm font-semibold text-neutral-800">
                  {highlightText(r.title, query)}
                </h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[r.category] || 'bg-neutral-100 text-neutral-500'}`}>
                  {r.category}
                </span>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {highlightText(r.content, query)}
              </p>
            </div>
          ))}
          {results.length === 0 && (
            <p className="text-center py-8 text-neutral-400">未找到相关结果</p>
          )}
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="px-5 py-3 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-700">智能问答</h2>
        </div>
        <div className="h-64 overflow-y-auto p-5 space-y-3">
          {chatMessages.length === 0 && (
            <p className="text-center text-neutral-400 py-8">输入您的问题，智能助手为您解答</p>
          )}
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary-700 text-white'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-neutral-200 flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChat()}
            className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="输入您的问题..."
          />
          <button
            onClick={handleChat}
            className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
