import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit2, ArrowDownCircle, Trash2, Star } from 'lucide-react';
import { serviceItems, serviceDomains } from '@/mock/data';
import type { ServiceItem } from '@/types';

const PAGE_SIZE = 8;

function getDomainName(domainId: string) {
  return serviceDomains.find((d) => d.id === domainId)?.name ?? domainId;
}

export default function ServiceManagement() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = serviceItems.filter(
    (s) =>
      s.name.includes(search) ||
      s.department.includes(search) ||
      s.tags.some((t) => t.includes(search))
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="gov-section-title">服务管理</h2>
        <button className="gov-btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          新增服务
        </button>
      </div>

      <div className="gov-card p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gov-text-secondary" />
            <input
              type="text"
              placeholder="搜索服务名称、部门、标签..."
              className="gov-input pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gov-border text-gov-text-secondary">
                <th className="text-left py-3 px-4 font-medium">服务名称</th>
                <th className="text-left py-3 px-4 font-medium">所属域</th>
                <th className="text-left py-3 px-4 font-medium">部门</th>
                <th className="text-center py-3 px-4 font-medium">状态</th>
                <th className="text-right py-3 px-4 font-medium">办理量</th>
                <th className="text-center py-3 px-4 font-medium">评分</th>
                <th className="text-center py-3 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((item: ServiceItem) => (
                <tr
                  key={item.id}
                  className="border-b border-gov-border hover:bg-blue-50/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-gov-text">{item.name}</span>
                    {item.tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {item.tags.map((tag) => (
                          <span key={tag} className="gov-badge bg-blue-50 text-gov-blue text-[10px]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gov-text-secondary">{getDomainName(item.domainId)}</td>
                  <td className="py-3 px-4 text-gov-text-secondary">{item.department}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`gov-badge ${
                        item.onlineEnabled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.onlineEnabled ? '已上线' : '已下线'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gov-text">{item.applicationCount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-gov-text">{item.rating}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 text-gov-text-secondary hover:text-gov-blue transition-colors" title="编辑">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gov-text-secondary hover:text-amber-500 transition-colors" title="下架">
                        <ArrowDownCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gov-text-secondary hover:text-red-500 transition-colors" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gov-border">
          <span className="text-sm text-gov-text-secondary">
            共 {filtered.length} 条记录
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gov-border disabled:opacity-40 hover:bg-gov-bg transition-colors"
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                  p === page
                    ? 'bg-gov-blue text-white'
                    : 'border border-gov-border hover:bg-gov-bg text-gov-text-secondary'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gov-border disabled:opacity-40 hover:bg-gov-bg transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
