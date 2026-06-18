import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Clock, CheckCircle, XCircle, Loader, FileText } from 'lucide-react';
import { useGetPaginated } from '../../hooks/useApi';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import type { ProgressItem } from '../../../shared/types';

const statusFilter = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待办理' },
  { value: 'processing', label: '办理中' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已驳回' },
];

export default function Progress() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ProgressItem | null>(null);

  const url = `/personal/progress?page=${page}&pageSize=10${status !== 'all' ? `&status=${status}` : ''}`;

  const { data, isLoading } = useGetPaginated<ProgressItem>(
    ['progress', status, String(page)],
    url
  );

  const filteredItems = data?.items?.filter((item) =>
    item.serviceName.includes(search)
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
            placeholder="搜索办件事项名称"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {statusFilter.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatus(s.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                status === s.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
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
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-10 bg-gray-200 rounded" />
                  ))}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : filteredItems?.length ? (
        <div className="space-y-4">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card hover onClick={() => setSelectedItem(item)}>
                <Card.Body>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.serviceName}</h3>
                      <p className="text-sm text-gray-500">
                        提交于 {new Date(item.submitTime).toLocaleString('zh-CN')}
                        {item.estimatedTime && ` · 预计 ${new Date(item.estimatedTime).toLocaleDateString('zh-CN')} 完成`}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        item.status === 'completed' ? 'success' :
                        item.status === 'processing' ? 'processing' :
                        item.status === 'rejected' ? 'error' : 'pending'
                      }
                      text={
                        item.status === 'completed' ? '已完成' :
                        item.status === 'processing' ? '办理中' :
                        item.status === 'rejected' ? '已驳回' : '待办理'
                      }
                    />
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(item.currentStep / item.totalSteps) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{item.currentStep}/{item.totalSteps} 步骤</span>
                    <span className="text-primary flex items-center gap-1">
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
            <p className="text-gray-500">暂无办件记录</p>
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

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedItem.serviceName}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    申请编号：{selectedItem.id}
                  </p>
                </div>
                <StatusBadge
                  status={
                    selectedItem.status === 'completed' ? 'success' :
                    selectedItem.status === 'processing' ? 'processing' :
                    selectedItem.status === 'rejected' ? 'error' : 'pending'
                  }
                  text={
                    selectedItem.status === 'completed' ? '已完成' :
                    selectedItem.status === 'processing' ? '办理中' :
                    selectedItem.status === 'rejected' ? '已驳回' : '待办理'
                  }
                />
              </div>
            </div>
            <div className="p-6">
              <div className="relative">
                {selectedItem.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx < selectedItem.steps.length - 1 && (
                      <div className={`absolute left-4 top-10 w-0.5 h-full ${
                        step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      step.status === 'completed' ? 'bg-green-500 text-white' :
                      step.status === 'current' ? 'bg-primary text-white' :
                      step.status === 'failed' ? 'bg-red-500 text-white' :
                      step.status === 'skipped' ? 'bg-gray-400 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {step.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                       step.status === 'current' ? <Loader className="w-5 h-5 animate-spin" /> :
                       step.status === 'failed' ? <XCircle className="w-5 h-5" /> :
                       <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{step.name}</h4>
                        {step.time && (
                          <span className="text-sm text-gray-500">
                            {new Date(step.time).toLocaleString('zh-CN')}
                          </span>
                        )}
                      </div>
                      {step.department && (
                        <p className="text-sm text-gray-500 mb-1">办理机关机关：{step.department}</p>
                      )}
                      {step.operator && (
                        <p className="text-sm text-gray-500">经办人员：{step.operator}</p>
                      )}
                      {step.remark && (
                        <p className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-lg">
                          备注：{step.remark}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
