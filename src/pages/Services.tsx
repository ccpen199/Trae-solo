import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Grid3X3, HeartHandshake, UserCircle, Stethoscope, Building2, Store, Heart, Receipt, ChevronLeft, ChevronRight, Flame, Clock, Globe } from 'lucide-react';
import { ServiceCard } from '../components/common';
import { mockServices, serviceCategories } from '../mock/data';
import type { ServiceItem } from '../shared/types';

const iconMap: Record<string, React.ElementType> = {
  Grid3X3,
  HeartHandshake,
  UserCircle,
  Stethoscope,
  Building2,
  Store,
  Heart,
  Receipt,
};

const PAGE_SIZE = 6;

export default function Services() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'hot' | 'time'>('hot');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredServices = useMemo(() => {
    let result = [...mockServices];

    if (activeCategory !== 'all') {
      result = result.filter(s => s.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.department.toLowerCase().includes(query)
      );
    }

    if (onlineOnly) {
      result = result.filter(s => s.isOnline);
    }

    if (sortBy === 'hot') {
      result.sort((a, b) => b.hotLevel - a.hotLevel);
    } else {
      result.sort((a, b) => a.id.localeCompare(b.id));
    }

    return result;
  }, [activeCategory, searchQuery, onlineOnly, sortBy]);

  const totalPages = Math.ceil(filteredServices.length / PAGE_SIZE);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleCardClick = (service: ServiceItem) => {
    navigate(`/services/${service.id}`);
  };

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-gov-gray-200 text-gov-gray-400 hover:border-primary-500 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {pages.map((page, idx) => (
          typeof page === 'number' ? (
            <button
              key={idx}
              onClick={() => handlePageChange(page)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-colors ${
                currentPage === page
                  ? 'bg-primary-500 text-white'
                  : 'border border-gov-gray-200 text-gov-gray-600 hover:border-primary-500 hover:text-primary-500'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="text-gov-gray-400 px-2">...</span>
          )
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-gov-gray-200 text-gov-gray-400 hover:border-primary-500 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gov-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gov-gray-700 mb-2">掌上办事</h1>
          <p className="text-gov-gray-400">在线办理各类政务服务事项，省心省力</p>
        </div>

        <div className="gov-card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {serviceCategories.map((cat) => {
              const Icon = iconMap[cat.icon] || Grid3X3;
              return (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat.key
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-gov-gray-100 text-gov-gray-600 hover:bg-gov-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gov-gray-400" />
              <input
                type="text"
                placeholder="搜索事项名称、描述或办理部门..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gov-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gov-gray-700 placeholder:text-gov-gray-400"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gov-gray-400" />
                <button
                  onClick={() => setOnlineOnly(!onlineOnly)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    onlineOnly
                      ? 'bg-primary-50 text-primary-600 border border-primary-200'
                      : 'bg-gov-gray-100 text-gov-gray-600 hover:bg-gov-gray-200 border border-transparent'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  可在线办理
                </button>
              </div>
              
              <div className="flex items-center gap-2 bg-gov-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setSortBy('hot')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === 'hot'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gov-gray-500 hover:text-gov-gray-700'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  热度
                </button>
                <button
                  onClick={() => setSortBy('time')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === 'time'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gov-gray-500 hover:text-gov-gray-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  时间
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gov-gray-400">
            共找到 <span className="text-primary-500 font-semibold">{filteredServices.length}</span> 个事项
          </p>
          {filteredServices.length > 0 && (
            <p className="text-sm text-gov-gray-400">
              第 {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredServices.length)} 项
            </p>
          )}
        </div>

        {paginatedServices.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onApply={() => handleCardClick(service)}
                />
              ))}
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className="gov-card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gov-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gov-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gov-gray-600 mb-2">未找到相关事项</h3>
            <p className="text-sm text-gov-gray-400">请尝试调整筛选条件或搜索关键词</p>
          </div>
        )}
      </div>
    </div>
  );
}
