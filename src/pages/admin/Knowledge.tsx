import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '@/utils/api';

interface KnowledgeEntry {
  id: number;
  title: string;
  content: string;
  category: string;
  keywords: string[] | string;
  created_at: string;
  updated_at?: string;
}

interface FormState {
  title: string;
  content: string;
  category: string;
  keywords: string;
}

const fallbackEntries: KnowledgeEntry[] = [
  {
    id: 1,
    title: '社保卡申领流程',
    content: '携带身份证、户口簿至社保服务中心办理，完成身份核验后可领取社保卡。',
    category: '社保',
    keywords: ['社保卡', '申领', '办理'],
    created_at: '2026-06-01 10:30:00',
  },
  {
    id: 2,
    title: '居住证办理指南',
    content: '申请人需提供身份证、居住证明、就业或就读证明，材料齐全后进入审核流程。',
    category: '公安',
    keywords: ['居住证', '材料'],
    created_at: '2026-06-02 09:15:00',
  },
  {
    id: 3,
    title: '医保报销政策',
    content: '门诊和住院报销按医疗机构级别、起付线和年度额度综合计算。',
    category: '医疗',
    keywords: ['医保', '报销'],
    created_at: '2026-06-03 11:00:00',
  },
];

function normalizeKeywords(value: KnowledgeEntry['keywords']) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value || '')
      .split(/[,，、]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function normalizeEntry(entry: KnowledgeEntry): KnowledgeEntry {
  return { ...entry, keywords: normalizeKeywords(entry.keywords) };
}

export default function AdminKnowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(fallbackEntries);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null);
  const [viewing, setViewing] = useState<KnowledgeEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: '',
    content: '',
    category: '社保',
    keywords: '',
  });

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await api.get<KnowledgeEntry[]>('/admin/knowledge');
      setEntries(Array.isArray(data) && data.length > 0 ? data.map(normalizeEntry) : fallbackEntries);
    } catch (error) {
      console.error('Failed to load knowledge entries:', error);
      setEntries(fallbackEntries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const categories = useMemo(() => {
    const values = new Set(entries.map((entry) => entry.category).filter(Boolean));
    return ['全部', ...Array.from(values)];
  }, [entries]);

  const allTags = useMemo(() => {
    const values = new Set<string>();
    entries.forEach((entry) => normalizeKeywords(entry.keywords).forEach((keyword) => values.add(keyword)));
    return Array.from(values);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const key = query.trim();
    return entries.filter((entry) => {
      const keywords = normalizeKeywords(entry.keywords);
      const matchesText =
        !key ||
        entry.title.includes(key) ||
        entry.content.includes(key) ||
        keywords.some((keyword) => keyword.includes(key));
      const matchesCategory = category === '全部' || entry.category === category;
      return matchesText && matchesCategory;
    });
  }, [entries, query, category]);

  const searchEntries = async () => {
    if (!query.trim()) {
      loadEntries();
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<KnowledgeEntry[]>('/admin/knowledge/search', { query });
      setEntries(Array.isArray(data) ? data.map(normalizeEntry) : []);
    } catch (error) {
      console.error('Failed to search knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (entry?: KnowledgeEntry) => {
    setEditing(entry || null);
    setFormOpen(true);
    setForm(
      entry
        ? {
            title: entry.title,
            content: entry.content,
            category: entry.category,
            keywords: normalizeKeywords(entry.keywords).join('、'),
          }
        : { title: '', content: '', category: '社保', keywords: '' },
    );
  };

  const saveEntry = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const keywords = form.keywords
      .split(/[,，、]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const payload = {
      title: form.title,
      content: form.content,
      category: form.category,
      keywords,
    };
    try {
      if (editing) {
        await api.put(`/admin/knowledge/${editing.id}`, payload);
        setEntries((prev) =>
          prev.map((entry) => (entry.id === editing.id ? { ...entry, ...payload, updated_at: new Date().toISOString() } : entry)),
        );
      } else {
        const result = await api.post<{ id: number }>('/admin/knowledge', payload);
        setEntries((prev) => [
          {
            id: result?.id || Date.now(),
            ...payload,
            created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error('Failed to save knowledge:', error);
      if (!editing) {
        setEntries((prev) => [
          {
            id: Date.now(),
            ...payload,
            created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          },
          ...prev,
        ]);
      }
    }
    setEditing(null);
    setFormOpen(false);
  };

  const deleteEntry = async (entry: KnowledgeEntry) => {
    try {
      await api.del(`/admin/knowledge/${entry.id}`);
    } catch (error) {
      console.error('Failed to delete knowledge:', error);
    }
    setEntries((prev) => prev.filter((item) => item.id !== entry.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif-cn text-xl font-bold text-warm-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            知识库管理
          </h1>
          <p className="text-sm text-warm-500 mt-1">维护办事指南、政策条目和搜索标签</p>
        </div>
        <button
          onClick={() => openForm()}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-light flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          添加条目
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">条目总数</p>
              <p className="text-2xl font-bold text-warm-800 mt-1">{entries.length}</p>
            </div>
            <FileText className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">分类数量</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{categories.length - 1}</p>
            </div>
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">标签数量</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{allTags.length}</p>
            </div>
            <Tag className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] h-10 px-3 border border-warm-200 rounded-md">
          <Search className="w-4 h-4 text-warm-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') searchEntries();
            }}
            placeholder="搜索标题、内容或标签"
            className="flex-1 text-sm focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          onClick={searchEntries}
          className="h-10 px-4 bg-primary text-white rounded-md text-sm hover:bg-primary-light"
        >
          搜索
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-warm-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            加载知识条目中...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-10 text-center text-warm-500">暂无知识条目</div>
        ) : (
          <div className="divide-y divide-warm-100">
            {filteredEntries.map((entry) => {
              const keywords = normalizeKeywords(entry.keywords);
              return (
                <div key={entry.id} className="p-5 hover:bg-warm-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-warm-800">{entry.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                          {entry.category}
                        </span>
                      </div>
                      <p className="text-sm text-warm-600 line-clamp-2">{entry.content}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {keywords.map((keyword) => (
                          <span key={keyword} className="text-xs px-2 py-1 bg-warm-100 text-warm-600 rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setViewing(entry)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-md"
                        title="查看"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openForm(entry)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEntry(entry)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-warm-800">{editing ? '编辑条目' : '添加条目'}</h3>
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(false);
                  setForm({ title: '', content: '', category: '社保', keywords: '' });
                }}
                className="text-warm-400 hover:text-warm-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="标题"
                className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="分类"
                  className="h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={form.keywords}
                  onChange={(event) => setForm((prev) => ({ ...prev, keywords: event.target.value }))}
                  placeholder="标签，使用顿号或逗号分隔"
                  className="h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <textarea
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="内容"
                className="w-full min-h-40 p-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(false);
                  setForm({ title: '', content: '', category: '社保', keywords: '' });
                }}
                className="px-4 py-2 border border-warm-200 rounded-md text-sm hover:bg-warm-50"
              >
                取消
              </button>
              <button
                onClick={saveEntry}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-light flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-warm-800">{viewing.title}</h3>
              <button onClick={() => setViewing(null)} className="text-warm-400 hover:text-warm-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-warm-600 whitespace-pre-wrap leading-7">{viewing.content}</div>
          </div>
        </div>
      )}
    </div>
  );
}
