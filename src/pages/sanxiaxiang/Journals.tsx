import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Plus, X, Tag, FileText, ChevronDown } from 'lucide-react';
import { mockTeams } from '@/mock/teams';
import { generateSummary, extractKeywords, extractServiceTags } from '@/utils/ai';
import { formatDate } from '@/utils/date';
import type { Journal } from '@/types';

export default function Journals() {
  const [journals, setJournals] = useState<Journal[]>(
    mockTeams.flatMap((t) => t.journals.map((j) => ({ ...j, teamName: t.name })))
  );
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [serviceTags, setServiceTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterTeam, setFilterTeam] = useState('');

  const handleGenerateAI = () => {
    if (!content || content.length < 10) return;
    setIsGenerating(true);
    setTimeout(() => {
      setAiSummary(generateSummary(content));
      setKeywords(extractKeywords(content));
      setServiceTags(extractServiceTags(content));
      setIsGenerating(false);
    }, 1500);
  };

  const handleSubmit = () => {
    if (!title || !content || !selectedTeam) return;
    const team = mockTeams.find((t) => t.id === selectedTeam);
    const newJournal: Journal = {
      id: `j-${Date.now()}`,
      teamId: selectedTeam,
      userId: 'u001',
      date: new Date().toISOString(),
      title,
      content,
      aiSummary: aiSummary || undefined,
      keywords,
      serviceTags,
      createdAt: new Date().toISOString(),
    };
    setJournals((prev) => [{ ...newJournal, teamName: team?.name || '' }, ...prev]);
    setTitle('');
    setContent('');
    setSelectedTeam('');
    setAiSummary('');
    setKeywords([]);
    setServiceTags([]);
    setShowForm(false);
  };

  const filteredJournals = filterTeam
    ? journals.filter((j) => j.teamId === filterTeam)
    : journals;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">实践日志</h1>
          <p className="text-surface-500 mt-1">记录实践历程，AI智能生成摘要</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? '取消' : '撰写日志'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="card p-6 space-y-4 border-primary-200 border-2">
              <h3 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                撰写实践日志
              </h3>

              <div>
                <label className="text-sm font-medium text-surface-700 mb-1.5 block">所属团队</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择团队</option>
                  {mockTeams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-surface-700 mb-1.5 block">日志标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入日志标题"
                  className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-surface-700 mb-1.5 block">日志内容</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="详细记录今日的实践活动内容、感受和收获..."
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none leading-relaxed"
                />
                <p className="text-xs text-surface-400 mt-1 text-right">{content.length} 字</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateAI}
                  disabled={!content || content.length < 10 || isGenerating}
                  className="btn-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'AI生成中...' : 'AI生成摘要'}
                </button>
                {aiSummary && (
                  <span className="text-xs text-success-600 flex items-center gap-1">
                    ✓ 摘要已生成
                  </span>
                )}
              </div>

              <AnimatePresence>
                {aiSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-primary-50 border border-primary-200 rounded-xl p-4 space-y-3"
                  >
                    <h4 className="text-sm font-semibold text-primary-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      AI智能摘要
                    </h4>
                    <p className="text-sm text-primary-700 leading-relaxed">{aiSummary}</p>
                    {keywords.length > 0 && (
                      <div>
                        <p className="text-xs text-primary-600 mb-1.5 flex items-center gap-1">
                          <Tag className="w-3 h-3" /> 关键词
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {keywords.map((kw) => (
                            <span key={kw} className="status-badge bg-primary-100 text-primary-700">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {serviceTags.length > 0 && (
                      <div>
                        <p className="text-xs text-primary-600 mb-1.5">服务标签</p>
                        <div className="flex flex-wrap gap-1.5">
                          {serviceTags.map((tag) => (
                            <span key={tag} className="status-badge bg-success-50 text-success-600">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-outline">取消</button>
                <button
                  onClick={handleSubmit}
                  disabled={!title || !content || !selectedTeam}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交日志
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">全部团队</option>
          {mockTeams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <span className="text-sm text-surface-500">共 {filteredJournals.length} 篇日志</span>
      </div>

      <div className="space-y-4">
        {filteredJournals.map((journal, index) => (
          <motion.div
            key={journal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card card-hover p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-surface-900 text-lg">{journal.title}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-500">
                  <span>{(journal as any).teamName}</span>
                  <span>{formatDate(journal.date)}</span>
                </div>
              </div>
              {journal.aiSummary && (
                <span className="status-badge bg-accent-100 text-accent-600 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI摘要
                </span>
              )}
            </div>

            <p className="text-sm text-surface-600 leading-relaxed line-clamp-3">{journal.content}</p>

            {journal.aiSummary && (
              <div className="bg-primary-50/50 rounded-lg p-3 border border-primary-100">
                <p className="text-xs font-medium text-primary-700 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI摘要
                </p>
                <p className="text-sm text-primary-600 leading-relaxed">{journal.aiSummary}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {journal.keywords.map((kw) => (
                <span key={kw} className="status-badge bg-primary-100 text-primary-700">{kw}</span>
              ))}
              {journal.serviceTags.map((tag) => (
                <span key={tag} className="status-badge bg-success-50 text-success-600">{tag}</span>
              ))}
            </div>
          </motion.div>
        ))}
        {filteredJournals.length === 0 && (
          <div className="text-center py-16 text-surface-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无日志记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
