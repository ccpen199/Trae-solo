import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Gift,
  Gavel,
  Building2,
  Shield,
  Filter,
  ArrowUpDown,
  Star,
  TrendingUp,
  DollarSign,
  Users,
  Sparkles,
  Search,
  ChevronDown,
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import Tag from '../components/ui/Tag';
import ServiceCard from '../components/transfer/ServiceCard';
import { transferServices } from '../mock/transferData';
import type { TransferService } from '../types';
import { useNavigate } from 'react-router-dom';

type SortType = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'sales';

const categoryTabs = [
  { key: 'all', label: '全部服务', icon: <Shield className="w-4 h-4" /> },
  { key: 'inheritance', label: '继承过户', icon: <Award className="w-4 h-4" /> },
  { key: 'gift', label: '赠与过户', icon: <Gift className="w-4 h-4" /> },
  { key: 'auction', label: '法拍过户', icon: <Gavel className="w-4 h-4" /> },
  { key: 'mortgage', label: '抵押过户', icon: <Building2 className="w-4 h-4" /> },
  { key: 'normal', label: '正常过户', icon: <Shield className="w-4 h-4" /> },
];

const sortOptions: { key: SortType; label: string; icon: React.ReactNode }[] = [
  { key: 'default', label: '默认排序', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'price-asc', label: '价格从低到高', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'price-desc', label: '价格从高到低', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'rating', label: '评分最高', icon: <Star className="w-4 h-4" /> },
  { key: 'sales', label: '销量最高', icon: <TrendingUp className="w-4 h-4" /> },
];

const TransferList: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortType>('default');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredServices = useMemo(() => {
    let result = [...transferServices];

    if (activeCategory !== 'all') {
      result = result.filter((s) => s.category === activeCategory);
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(keyword) ||
          s.description.toLowerCase().includes(keyword) ||
          s.providerName.toLowerCase().includes(keyword)
      );
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'sales':
        result.sort((a, b) => b.salesCount - a.salesCount);
        break;
      default:
        break;
    }

    return result;
  }, [activeCategory, sortBy, searchKeyword]);

  const topProviders = useMemo(() => {
    const providerMap = new Map<string, { name: string; logo: string; count: number; rating: number }>();
    transferServices.forEach((s) => {
      const existing = providerMap.get(s.providerName);
      if (existing) {
        existing.count += s.salesCount;
        existing.rating = Math.max(existing.rating, s.rating);
      } else {
        providerMap.set(s.providerName, {
          name: s.providerName,
          logo: s.providerLogo,
          count: s.salesCount,
          rating: s.rating,
        });
      }
    });
    return Array.from(providerMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, []);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    transferServices.forEach((s) => {
      stats[s.category] = (stats[s.category] || 0) + 1;
    });
    return stats;
  }, []);

  const handleServiceClick = (service: TransferService) => {
    navigate(`/transfer/${service.id}`);
  };

  const currentSort = sortOptions.find((o) => o.key === sortBy);

  return (
    <div className="min-h-screen bg-cream-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gold-100 rounded-lg">
              <Shield className="w-6 h-6 text-gold-600" />
            </div>
            <h1 className="text-3xl font-bold text-primary-800 font-serif">过户服务</h1>
          </div>
          <p className="text-cream-600 ml-12">
            专业过户服务团队，全程代办，让您的房产过户更省心、更安心
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardBody className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cream-400" />
                  <input
                    type="text"
                    placeholder="搜索过户服务、服务商..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-primary-800 placeholder:text-cream-400 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Button
                      variant="outline"
                      icon={<ArrowUpDown className="w-4 h-4" />}
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    >
                      {currentSort?.label}
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                    {sortDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-cream-200 py-2 z-20"
                      >
                        {sortOptions.map((option) => (
                          <button
                            key={option.key}
                            onClick={() => {
                              setSortBy(option.key);
                              setSortDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left flex items-center gap-2 hover:bg-cream-50 transition-colors ${
                              sortBy === option.key
                                ? 'text-gold-600 bg-gold-50/50'
                                : 'text-primary-700'
                            }`}
                          >
                            {option.icon}
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                  <Button variant="ghost" icon={<Filter className="w-4 h-4" />}>
                    筛选
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <Tabs
                  tabs={categoryTabs.map((tab) => ({
                    key: tab.key,
                    label: (
                      <span className="flex items-center gap-2">
                        {tab.icon}
                        {tab.label}
                        {tab.key !== 'all' && (
                          <span className="text-xs px-1.5 py-0.5 bg-cream-200 text-cream-600 rounded-full">
                            {categoryStats[tab.key] || 0}
                          </span>
                        )}
                      </span>
                    ),
                  }))}
                  activeKey={activeCategory}
                  onChange={setActiveCategory}
                  className="px-6 pt-4"
                />
                <CardBody className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredServices.map((service, index) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.4 }}
                      >
                        <ServiceCard
                          service={service}
                          onClick={() => handleServiceClick(service)}
                        />
                      </motion.div>
                    ))}
                  </div>
                  {filteredServices.length === 0 && (
                    <div className="py-16 text-center">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-cream-300" />
                      <p className="text-cream-500 text-lg">暂无符合条件的过户服务</p>
                      <p className="text-cream-400 text-sm mt-1">试试其他筛选条件</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          </div>

          <div className="w-full lg:w-72 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6 sticky top-24"
            >
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-primary-800 font-serif flex items-center gap-2">
                    <Users className="w-5 h-5 text-gold-500" />
                    热门服务商
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {topProviders.map((provider, index) => (
                      <motion.div
                        key={provider.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-50 transition-colors cursor-pointer"
                      >
                        <div className="relative">
                          <img
                            src={provider.logo}
                            alt={provider.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          {index < 3 && (
                            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0 ? 'bg-gold-500' : index === 1 ? 'bg-cream-400' : 'bg-coral-400'
                            }`}>
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-primary-800 truncate">
                            {provider.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-cream-500">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                              {provider.rating}
                            </span>
                            <span>·</span>
                            <span>{provider.count} 单</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary-800" />
                    </div>
                    <h4 className="text-lg font-semibold text-primary-800 font-serif mb-2">
                      专属顾问服务
                    </h4>
                    <p className="text-sm text-cream-600 mb-4">
                      不确定选择哪种服务？专业顾问为您一对一解答
                    </p>
                    <Button variant="gold" className="w-full">
                      免费咨询
                    </Button>
                  </div>
                </CardBody>
              </Card>

              <div className="p-5 bg-gradient-to-br from-primary-700 to-primary-800 rounded-xl text-white">
                <h4 className="font-semibold mb-2 font-serif">服务保障</h4>
                <ul className="space-y-2 text-sm text-primary-200">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-gold-400 shrink-0" />
                    专业团队，经验丰富
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-gold-400 shrink-0" />
                    透明收费，无隐形消费
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-gold-400 shrink-0" />
                    进度可查，实时跟踪
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-gold-400 shrink-0" />
                    不成功全额退款
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export default TransferList;
