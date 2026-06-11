import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, FileText, Activity, Car, GraduationCap, Coffee, Search, Star, ChevronRight, SlidersHorizontal, X, ChevronLeft } from 'lucide-react';
import { useServiceStore } from '@/stores/serviceStore';
import type { ServiceItem } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  Heart, FileText, Activity, Car, GraduationCap, Coffee,
};

type SortKey = 'default' | 'rating' | 'count';
const PAGE_SIZE = 20;

function ServiceCard({ service }: { service: ServiceItem }) {
  const domain = useServiceStore((s) => s.domains.find((d) => d.id === service.domainId));
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="gov-card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gov-text">{service.name}</h3>
        <div className="flex gap-1 shrink-0 ml-2">
          {service.tags.includes('热门') && <span className="gov-badge gov-badge-hot">热门</span>}
          {service.tags.includes('高频') && <span className="gov-badge gov-badge-new">高频</span>}
          {service.tags.includes('季节性') && <span className="gov-badge bg-violet-100 text-violet-700">季节</span>}
        </div>
      </div>

      <span className="inline-block gov-badge bg-blue-50 text-gov-blue mb-2">
        {service.department}
      </span>

      <p className="text-sm text-gov-text-secondary line-clamp-2 mb-3">{service.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < Math.round(service.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
            />
          ))}
          <span className="text-sm text-gov-text-secondary ml-1">{service.rating}</span>
        </div>
        <span className="text-xs text-gov-text-secondary">
          {service.applicationCount.toLocaleString()}次办理
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between pt-3 border-t border-gov-border">
        {domain && (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gradient-to-r ${domain.gradient} text-white`}>
            {(() => { const Icon = iconMap[domain.icon] || Heart; return <Icon className="w-3 h-3" />; })()}
            {domain.name}
          </div>
        )}
        <Link
          to={`/apply/${service.id}`}
          className="gov-btn-primary px-4 py-1.5 text-xs flex items-center gap-1 no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          立即办理 <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function Services() {
  const { domains, services } = useServiceStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const domainParam = searchParams.get('domain');
  const queryParam = searchParams.get('q') || '';

  const [activeDomain, setActiveDomain] = useState<string | null>(domainParam);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const departments = useMemo(
    () => ['all', ...Array.from(new Set(services.map((s) => s.department)))],
    [services],
  );

  const filtered = useMemo(() => {
    let result = services;
    if (activeDomain) {
      result = result.filter((s) => s.domainId === activeDomain);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.department.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q)),
      );
    }
    if (selectedDept !== 'all') {
      result = result.filter((s) => s.department === selectedDept);
    }
    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'count') {
      result = [...result].sort((a, b) => b.applicationCount - a.applicationCount);
    }
    return result;
  }, [services, activeDomain, searchQuery, selectedDept, sortBy]);

  const domainBreakdown = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    const matched = services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.department.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q)),
    );
    const map = new Map<string, number>();
    matched.forEach((s) => {
      map.set(s.domainId, (map.get(s.domainId) || 0) + 1);
    });
    return domains
      .map((d) => ({ id: d.id, name: d.name, gradient: d.gradient, count: map.get(d.id) || 0 }))
      .filter((d) => d.count > 0);
  }, [services, domains, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeDomain, searchQuery, selectedDept, sortBy]);

  const handleDomainClick = (domainId: string | null) => {
    setActiveDomain(domainId);
    if (domainId) {
      setSearchParams({ domain: domainId });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, safeCurrentPage - 2);
    const end = Math.min(totalPages, safeCurrentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safeCurrentPage, totalPages]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
    >
      <div className="flex gap-6">
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="gov-card p-3 sticky top-24">
            <h3 className="text-sm font-bold text-gov-text mb-3 px-2">服务分类</h3>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => handleDomainClick(null)}
                className={`gov-sidebar-item text-sm ${!activeDomain ? 'gov-sidebar-item-active' : ''}`}
              >
                全部服务
              </button>
              {domains.map((d) => {
                const Icon = iconMap[d.icon] || Heart;
                return (
                  <button
                    key={d.id}
                    onClick={() => handleDomainClick(d.id)}
                    className={`gov-sidebar-item text-sm ${activeDomain === d.id ? 'gov-sidebar-item-active' : ''}`}
                  >
                    <Icon className="w-4 h-4" style={{ color: d.color }} />
                    {d.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1 flex items-center bg-white rounded-lg border border-gov-border px-3 py-2 relative">
              <Search className="w-4 h-4 text-gov-text-secondary shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索服务名称、部门..."
                className="flex-1 ml-2 border-none outline-none text-sm text-gov-text placeholder-gov-text-secondary pr-8"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100 text-gov-text-secondary"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <SlidersHorizontal className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gov-text-secondary" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="gov-input pl-9 pr-8 py-2 text-sm appearance-none cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d === 'all' ? '全部部门' : d}</option>
                  ))}
                </select>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="gov-input px-3 py-2 text-sm appearance-none cursor-pointer"
              >
                <option value="default">默认排序</option>
                <option value="rating">评分优先</option>
                <option value="count">办理量优先</option>
              </select>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {searchQuery ? (
              <motion.div
                key="search-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5"
              >
                <div className="gov-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-gov-text">
                      搜索 '<span className="text-gov-blue">{searchQuery}</span>' 找到 <span className="text-gov-blue">{filtered.length}</span> 项相关服务
                    </h2>
                  </div>
                  <p className="text-xs text-gov-text-secondary">
                    匹配范围: 服务名称、部门、标签
                  </p>
                  {domainBreakdown.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {domainBreakdown.map((d) => (
                        <span
                          key={d.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${d.gradient} text-white`}
                        >
                          {d.name} {d.count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="count-line"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gov-text-secondary mb-4"
              >
                共 <span className="font-semibold text-gov-blue">{filtered.length}</span> 项服务
              </motion.p>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paged.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-gov-text-secondary">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">未找到相关服务</p>
              <p className="text-sm mt-1">请尝试更换搜索条件</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-2 rounded-lg border border-gov-border hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers[0] > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="w-9 h-9 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && <span className="px-1 text-gov-text-secondary">...</span>}
                </>
              )}
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    n === safeCurrentPage
                      ? 'bg-gov-blue text-white shadow-sm'
                      : 'hover:bg-blue-50 text-gov-text'
                  }`}
                >
                  {n}
                </button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="px-1 text-gov-text-secondary">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-9 h-9 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-2 rounded-lg border border-gov-border hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
