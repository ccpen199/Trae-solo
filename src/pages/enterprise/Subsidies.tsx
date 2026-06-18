import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Calendar, FileText, CheckCircle, Clock } from 'lucide-react';
import { useGetPaginated, usePost } from '../../hooks/useApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import type { SubsidyPolicy } from '../../../shared/types';

const categories = [
  { value: 'all', label: '全部' },
  { value: 'technology', label: '科技创新' },
  { value: 'employment', label: '稳岗就业' },
  { value: 'tax', label: '税收优惠' },
  { value: 'industry', label: '产业扶持' },
];

export default function Subsidies() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedPolicy, setSelectedPolicy] = useState<SubsidyPolicy | null>(null);

  const url = `/enterprise/subsidies?page=${page}&pageSize=10${category !== 'all' ? `&category=${category}` : ''}`;

  const { data, isLoading } = useGetPaginated<SubsidyPolicy>(
    ['subsidies', category, String(page)],
    url
  );

  const applyMutation = usePost();

  const handleApply = async (policyId: string) => {
    try {
      await applyMutation.mutateAsync({
        url: `/enterprise/subsidies/${policyId}/apply`,
        data: {},
      });
      setSelectedPolicy(null);
      alert('申请提交成功！');
    } catch (error) {
      alert('申请失败，请稍后重试');
    }
  };

  const filteredPolicies = data?.items?.filter((policy) =>
    policy.name.includes(search) || policy.description.includes(search)
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
            placeholder="搜索补贴政策名称..."
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
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Card.Body className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded w-24" />
                  <div className="h-8 bg-gray-200 rounded w-32" />
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
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                        <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {policy.category}
                        </span>
                        {policy.active ? (
                          <StatusBadge status="success" text="申报中" />
                        ) : (
                          <StatusBadge status="pending" text="已截止" />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-accent mb-2">{policy.amount}</p>
                    </div>
                    <Button size="sm" variant="primary" disabled={!policy.active}>
                      立即申报
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{policy.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(policy.applicationPeriod.start).toLocaleDateString('zh-CN')} - {new Date(policy.applicationPeriod.end).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>{policy.requiredMaterials.length} 份材料</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>{policy.processSteps.length} 个步骤</span>
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
            <p className="text-gray-500">暂无补贴政策</p>
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
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{selectedPolicy.name}</h3>
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {selectedPolicy.category}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-accent">{selectedPolicy.amount}</p>
                </div>
                {selectedPolicy.active ? (
                  <StatusBadge status="success" text="申报中" />
                ) : (
                  <StatusBadge status="pending" text="已截止" />
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">政策说明</h4>
                  <p className="text-gray-600">{selectedPolicy.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">申报时间</h4>
                  <p className="text-gray-600">
                    {new Date(selectedPolicy.applicationPeriod.start).toLocaleDateString('zh-CN')} 至 {new Date(selectedPolicy.applicationPeriod.end).toLocaleDateString('zh-CN')}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">申领条件</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {selectedPolicy.eligibility.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">所需材料</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {selectedPolicy.requiredMaterials.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">办理流程</h4>
                  <div className="space-y-3">
                    {selectedPolicy.processSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{step}</p>
                        </div>
                        {idx < selectedPolicy.processSteps.length - 1 && (
                          <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  className="flex-1"
                  disabled={!selectedPolicy.active || applyMutation.isPending}
                  loading={applyMutation.isPending}
                  onClick={() => handleApply(selectedPolicy.id)}
                >
                  立即申报
                </Button>
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
