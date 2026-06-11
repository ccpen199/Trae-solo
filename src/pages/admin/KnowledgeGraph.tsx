import { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Save,
  X,
  Network,
  FileText,
  Tag,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { mockKnowledgeEntries } from '@/data/mock';
import type { KnowledgeEntry } from '@/types';

const lawOptions = [
  '河北省失业保险条例',
  '河北省养老保险条例',
  '河北省医疗保险条例',
  '河北省工伤保险实施办法',
  '河北省社会保障卡管理办法',
  '社会保险法',
];

export default function KnowledgeGraph() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(mockKnowledgeEntries);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLaw, setSelectedLaw] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<KnowledgeEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [form, setForm] = useState<Omit<KnowledgeEntry, 'id' | 'views' | 'updatedAt'>>({
    question: '',
    answer: '',
    sourceLaw: lawOptions[0],
    sourceArticle: '',
    keywords: [],
  });
  const [keywordInput, setKeywordInput] = useState('');

  const filtered = entries.filter((e) => {
    const matchSearch =
      !searchTerm ||
      e.question.includes(searchTerm) ||
      e.answer.includes(searchTerm) ||
      e.keywords.some((k) => k.includes(searchTerm));
    const matchLaw = !selectedLaw || e.sourceLaw === selectedLaw;
    return matchSearch && matchLaw;
  });

  const openAddModal = () => {
    setEditingEntry(null);
    setForm({
      question: '',
      answer: '',
      sourceLaw: lawOptions[0],
      sourceArticle: '',
      keywords: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (e: KnowledgeEntry) => {
    setEditingEntry(e);
    setForm({
      question: e.question,
      answer: e.answer,
      sourceLaw: e.sourceLaw,
      sourceArticle: e.sourceArticle,
      keywords: [...e.keywords],
    });
    setModalOpen(true);
  };

  const addKeyword = () => {
    const k = keywordInput.trim();
    if (k && !form.keywords.includes(k)) {
      setForm({ ...form, keywords: [...form.keywords, k] });
    }
    setKeywordInput('');
  };

  const removeKeyword = (k: string) => {
    setForm({ ...form, keywords: form.keywords.filter((x) => x !== k) });
  };

  const handleSave = () => {
    if (!form.question.trim() || !form.answer.trim()) {
      alert('请填写问题和答案');
      return;
    }
    setEntries((prev) => {
      if (editingEntry) {
        return prev.map((e) =>
          e.id === editingEntry.id
            ? {
                ...e,
                ...form,
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : e
        );
      }
      return [
        {
          id: 'K-' + Date.now(),
          ...form,
          views: 0,
          updatedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ];
    });
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定删除该问答条目吗？')) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gov-red" />
            政策问答知识图谱
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            构建结构化政策知识，用户提问自动关联对应法条条款
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="gov-btn-primary inline-flex items-center gap-1.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          新增问答条目
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="gov-card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Network className="w-4 h-4 text-gov-red" />
              知识图谱概览
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">问答条目总数</span>
                <span className="text-xl font-bold text-gov-red">{entries.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">覆盖政策法规</span>
                <span className="text-xl font-bold text-blue-600">
                  {new Set(entries.map((e) => e.sourceLaw)).size}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">累计用户浏览</span>
                <span className="text-xl font-bold text-green-600">
                  {entries.reduce((a, b) => a + b.views, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="gov-card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gov-red" />
              按法规筛选
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setSelectedLaw('')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition ${
                    !selectedLaw
                      ? 'bg-gov-red text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>全部法规</span>
                  <span className="text-xs opacity-75">{entries.length}</span>
                </button>
              </li>
              {lawOptions.map((law) => {
                const count = entries.filter((e) => e.sourceLaw === law).length;
                if (count === 0) return null;
                return (
                  <li key={law}>
                    <button
                      onClick={() => setSelectedLaw(law)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition ${
                        selectedLaw === law
                          ? 'bg-gov-red text-white'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-xs leading-snug">{law}</span>
                      <span className="text-xs opacity-75">{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="gov-card p-5">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索问题、答案或关键词..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-red/30 focus:border-gov-red"
                />
              </div>
              <span className="text-sm text-gray-500">
                共 <span className="font-semibold text-gov-red">{filtered.length}</span> 条结果
              </span>
            </div>

            <div className="space-y-3">
              {filtered.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-medium text-gray-800 cursor-pointer hover:text-gov-red flex items-center gap-2"
                        onClick={() => setViewingEntry(entry)}
                      >
                        <Sparkles className="w-4 h-4 text-gov-gold" />
                        {entry.question}
                      </h4>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{entry.answer}</p>
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                          <FileText className="w-3 h-3" />
                          {entry.sourceLaw} · {entry.sourceArticle}
                        </span>
                        {entry.keywords.map((k) => (
                          <span
                            key={k}
                            className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded"
                          >
                            <Tag className="w-3 h-3" />
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setViewingEntry(entry)}
                        className="p-2 text-gray-400 hover:text-gov-red rounded-md hover:bg-gray-50"
                        title="查看"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(entry)}
                        className="p-2 text-gray-400 hover:text-gov-red rounded-md hover:bg-gray-50"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-50"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>更新于 {entry.updatedAt}</span>
                    <span>浏览 {entry.views.toLocaleString()} 次</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="py-16 text-center text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>未找到匹配的问答条目</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title="政策问答详情"
        width="max-w-2xl"
      >
        {viewingEntry && (
          <div className="space-y-5">
            <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl">
              <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gov-red" />
                {viewingEntry.question}
              </h4>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {viewingEntry.answer}
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <p className="text-sm flex items-center gap-2">
                <span className="text-gray-500">关联法规：</span>
                <span className="text-gov-red font-medium inline-flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                  {viewingEntry.sourceLaw}
                </span>
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="text-gray-500">具体条款：</span>
                <span className="font-medium text-gray-800">{viewingEntry.sourceArticle}</span>
              </p>
              <p className="text-sm flex items-center gap-2 flex-wrap">
                <span className="text-gray-500">关键词：</span>
                {viewingEntry.keywords.map((k) => (
                  <span
                    key={k}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                  >
                    {k}
                  </span>
                ))}
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-start gap-2">
              <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                用户在服务大厅提问时，系统将通过语义匹配自动关联本条问答，并附上对应法条原文作为权威依据。
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEntry ? '编辑政策问答' : '新增政策问答'}
        width="max-w-2xl"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="gov-btn-secondary">
              <X className="w-4 h-4 inline mr-1" />
              取消
            </button>
            <button onClick={handleSave} className="gov-btn-primary">
              <Save className="w-4 h-4 inline mr-1" />
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">问题 *</label>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="用户可能提出的问题，如：失业金能领多久？"
              className="gov-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">答案 *</label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              rows={5}
              placeholder="请输入权威、准确的答案内容"
              className="gov-input resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">关联法规</label>
              <select
                value={form.sourceLaw}
                onChange={(e) => setForm({ ...form, sourceLaw: e.target.value })}
                className="gov-input"
              >
                {lawOptions.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">条款编号</label>
              <input
                type="text"
                value={form.sourceArticle}
                onChange={(e) => setForm({ ...form, sourceArticle: e.target.value })}
                placeholder="如：第十七条"
                className="gov-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">关键词</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="输入关键词后按回车添加"
                className="gov-input flex-1"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.keywords.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md"
                >
                  {k}
                  <button
                    onClick={() => removeKeyword(k)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
              {form.keywords.length === 0 && (
                <span className="text-xs text-gray-400">暂无关键词，建议添加 3-5 个</span>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
