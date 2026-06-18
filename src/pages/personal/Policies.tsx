import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, TrendingUp, Tag, Clock, FileText, ExternalLink } from 'lucide-react';
import { useGetPaginated } from '../../hooks/useApi';
import Card from '../../components/Card';
import type { Policy } from '../../../shared/types';

const categories = [
  { value: 'all', label: '全部' },
  { value: 'social', label: '社会保障' },
  { value: 'housing', label: '住房公积金' },
  { value: 'education', label: '教育' },
  { value: 'health', label: '医疗健康' },
  { value: 'employment', label: '就业创业' },
];

export default function Policies() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const url = `/personal/policies?page=${page}&pageSize=10${category !== 'all' ? `&category=${category}` : ''}`;

  const { data, isLoading } = useGetPaginated<Policy>(
    ['policies', category, String(page)],
    url
  );

  const filteredPolicies = data?.items?.filter((policy) =>
    policy.title.includes(search) || policy.summary.includes(search)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索政策名称、内容..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                category === cat.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Card.Body className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16" />
                  <div className="h-6 bg-gray-200 rounded w-20" />
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : filteredPolicies?.length ? (
        <div className="space-y-4">
          {filteredPolicies.map((policy, idx) => (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card hover onClick={() => setSelectedPolicy(policy)}>
                <Card.Body>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-semibold text-gray-900 flex-1">{policy.title}</h3>
                    <span className="flex-shrink-0 text-sm font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">
                      {policy.matchScore}% 匹配
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{policy.summary}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Tag className="w-4 h-4" />
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{policy.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(policy.publishDate).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <TrendingUp className="w-4 h-4" />
                      <span>{policy.viewCount} 次浏览</span>
                    </div>
                    <span className="text-primary flex items-center gap-1 ml-auto">
                      查看详情 <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <Card.Body className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">暂无政策推荐</p>
          </Card.Body>
        </Card>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page === data.totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {selectedPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPolicy(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedPolicy.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {selectedPolicy.source}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(selectedPolicy.publishDate).toLocaleDateString('zh-CN')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-accent font-medium">
                      <TrendingUp className="w-4 h-4" />
                      {selectedPolicy.matchScore}% 匹配
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedPolicy.tags.map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="prose max-w-none">
                <h4 className="font-semibold text-gray-900 mb-2">政策摘要</h4>
                <p className="text-gray-600 mb-6">{selectedPolicy.summary}</p>

                <h4 className="font-semibold text-gray-900 mb-2">申领条件</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 mb-6">
                  {selectedPolicy.eligibility.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                {selectedPolicy.applyUrl && (
                  <a
                    href={selectedPolicy.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    立即申请 <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedPolicy(null)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
