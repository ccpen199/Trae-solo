import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Star,
  ChevronDown,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  Award,
  Users,
  Briefcase,
  Calendar,
  Phone,
  Eye,
  GitCompareArrows,
  Hammer,
  Home,
  Ruler,
  DollarSign,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pagination, message } from 'antd';
import { cn } from '@/lib/utils';

const cityOptions = [
  { key: 'all', label: '全部城市' },
  { key: 'beijing', label: '北京' },
  { key: 'shanghai', label: '上海' },
  { key: 'guangzhou', label: '广州' },
  { key: 'shenzhen', label: '深圳' },
  { key: 'hangzhou', label: '杭州' },
  { key: 'chengdu', label: '成都' },
];

const qualificationOptions = [
  { key: 'all', label: '全部资质' },
  { key: 'level1', label: '一级资质' },
  { key: 'level2', label: '二级资质' },
  { key: 'level3', label: '三级资质' },
];

const ratingOptions = [
  { key: 'all', label: '全部评分' },
  { key: '4.5', label: '4.5分以上' },
  { key: '4.0', label: '4.0分以上' },
];

const sortOptions = [
  { key: 'rating', label: '评分优先' },
  { key: 'cases', label: '案例数多' },
  { key: 'price', label: '价格低' },
  { key: 'distance', label: '距离近' },
];

const serviceScopeOptions = ['局部改造', '整装', '软装', '全案设计'];
const decorationTypeOptions = ['半包', '全包', '整装'];
const areaRangeOptions = ['60㎡以下', '60-90㎡', '90-120㎡', '120-150㎡', '150㎡以上'];
const budgetRangeOptions = ['10万以下', '10-20万', '20-50万', '50-100万', '100万以上'];
const priceRangeOptions = ['10万以下', '10-20万', '20-50万', '50万以上'];
const durationOptions = ['60天内', '90天内', '120天内'];
const featureTagsOptions = ['免费量房', '零增项', '环保承诺', '延期赔付', '金牌工长'];
const mainStyleOptions = ['现代简约', '北欧', '新中式', '轻奢', '日式', '地中海', '工业风', '美式'];

const companyNames = [
  '筑美装饰', '雅居家装', '尚品装饰', '名匠装修', '美家工坊',
  '匠心营造', '乐居装饰', '优家设计', '和整装璜', '瑞家空间',
  '鼎盛装饰', '艺家工坊', '华居家装', '润家装饰', '星艺装饰',
];

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都'];
const qualificationLevels: Array<'level1' | 'level2' | 'level3'> = ['level1', 'level2', 'level3'];

function generateCaseImage(seed: number, style: string): string {
  const stylePrompts: Record<string, string> = {
    modern: 'Modern minimalist living room interior design with wood furniture, warm lighting, neutral tones',
    nordic: 'Scandinavian style interior bright cozy space white walls wooden floor green plants',
    chinese: 'New Chinese style elegant interior oriental furniture warm wood tones ink painting',
    luxury: 'Luxury modern interior marble accents golden details velvet sofa elegant',
  };
  const styles = Object.keys(stylePrompts);
  const prompt = stylePrompts[styles[seed % styles.length]];
  return `/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt + ', photorealistic, professional photography')}&image_size=square_hd&seed=${seed + 500}`;
}

function generateLogo(seed: number, name: string): string {
  const prompt = `Minimalist logo design for decoration company "${name}", modern elegant, geometric shapes, wood and terracotta color palette, professional branding`;
  return `/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square&seed=${seed + 1000}`;
}

interface CompanyData {
  id: string;
  name: string;
  logo: string;
  qualification: 'level1' | 'level2' | 'level3';
  rating: number;
  reviewCount: number;
  servedHouseholds: number;
  caseCount: number;
  dealCount: number;
  avgPrice: number;
  city: string;
  serviceScopes: string[];
  decorationTypes: string[];
  mainStyles: string[];
  priceRange: string;
  budgetRange: string;
  areaRange: string;
  duration: string;
  features: string[];
  cases: { image: string; title: string }[];
}

function generateCompanies(count: number): CompanyData[] {
  const companies: CompanyData[] = [];
  for (let i = 0; i < count; i++) {
    const idx = i % companyNames.length;
    companies.push({
      id: `company-${i + 1}`,
      name: companyNames[idx] + (i >= companyNames.length ? `（${cities[i % cities.length]}分公司）` : ''),
      logo: generateLogo(i, companyNames[idx]),
      qualification: qualificationLevels[i % 3],
      rating: 4 + Math.round((Math.random() * 9 + 1)) / 10,
      reviewCount: Math.floor(Math.random() * 800) + 120,
      servedHouseholds: Math.floor(Math.random() * 3000) + 500,
      caseCount: Math.floor(Math.random() * 500) + 80,
      dealCount: Math.floor(Math.random() * 2000) + 300,
      avgPrice: [880, 980, 1080, 1280, 1580, 1880][i % 6],
      city: cities[i % cities.length],
      serviceScopes: serviceScopeOptions.slice(0, 2 + (i % 3)),
      decorationTypes: ['新房装修', '旧房翻新', '局部改造'].slice(0, 2 + (i % 2)),
      mainStyles: ['现代简约', '北欧', '新中式', '轻奢', '美式'].sort(() => Math.random() - 0.5).slice(0, 3),
      priceRange: priceRangeOptions[i % 4],
      budgetRange: ['10-20万', '20-50万', '50-100万', '100万以上'][i % 4],
      areaRange: ['60-90㎡', '90-120㎡', '120-150㎡', '150㎡以上'][i % 4],
      duration: durationOptions[i % 3],
      features: featureTagsOptions.sort(() => Math.random() - 0.5).slice(0, 3 + (i % 3)),
      cases: [
        { image: generateCaseImage(i * 3 + 1, 'modern'), title: '现代简约三居' },
        { image: generateCaseImage(i * 3 + 2, 'nordic'), title: '北欧风两居室' },
        { image: generateCaseImage(i * 3 + 3, 'chinese'), title: '新中式大宅' },
      ],
    });
  }
  return companies;
}

const qualificationBadge: Record<string, { text: string; className: string; bg: string }> = {
  level1: { text: '一级资质', className: 'text-amber-900', bg: 'bg-gradient-to-r from-amber-200 to-yellow-300 border-amber-400' },
  level2: { text: '二级资质', className: 'text-slate-700', bg: 'bg-gradient-to-r from-slate-200 to-gray-300 border-slate-400' },
  level3: { text: '三级资质', className: 'text-wood-900', bg: 'bg-gradient-to-r from-wood-200 to-wood-300 border-wood-400' },
};

function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i <= fullStars
              ? 'text-amber-400 fill-amber-400'
              : i === fullStars + 1 && hasHalf
              ? 'text-amber-400 fill-amber-400/50'
              : 'text-ivory-300'
          )}
        />
      ))}
    </div>
  );
}

export default function CompanyListPage() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('all');
  const [qualification, setQualification] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showQualDropdown, setShowQualDropdown] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const allCompanies = useMemo(() => generateCompanies(36), []);
  const pageSize = 9;

  const filteredCompanies = useMemo(() => {
    let result = [...allCompanies];

    if (searchQuery) {
      result = result.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (city !== 'all') {
      const cityLabel = cityOptions.find(o => o.key === city)?.label;
      if (cityLabel) result = result.filter(c => c.city === cityLabel);
    }
    if (qualification !== 'all') {
      result = result.filter(c => c.qualification === qualification);
    }
    if (ratingFilter !== 'all') {
      result = result.filter(c => c.rating >= parseFloat(ratingFilter));
    }
    if (selectedServices.length > 0) {
      result = result.filter(c => selectedServices.some(s => c.serviceScopes.includes(s)));
    }
    if (selectedPrices.length > 0) {
      result = result.filter(c => selectedPrices.includes(c.priceRange));
    }
    if (selectedDurations.length > 0) {
      result = result.filter(c => selectedDurations.includes(c.duration));
    }
    if (selectedFeatures.length > 0) {
      result = result.filter(c => selectedFeatures.some(f => c.features.includes(f)));
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'cases':
        result.sort((a, b) => b.caseCount - a.caseCount);
        break;
      case 'price':
        result.sort((a, b) => a.avgPrice - b.avgPrice);
        break;
    }

    return result;
  }, [allCompanies, searchQuery, city, qualification, ratingFilter, sortBy, selectedServices, selectedPrices, selectedDurations, selectedFeatures]);

  const pagedCompanies = filteredCompanies.slice((page - 1) * pageSize, page * pageSize);

  const toggleArray = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    if (arr.includes(value)) setArr(arr.filter(v => v !== value));
    else setArr([...arr, value]);
  };

  const clearFilters = () => {
    setCity('all');
    setQualification('all');
    setRatingFilter('all');
    setSelectedServices([]);
    setSelectedPrices([]);
    setSelectedDurations([]);
    setSelectedFeatures([]);
    setPage(1);
  };

  const DropdownSelect = ({
    value, options, show, setShow, onChange, icon,
  }: {
    value: string;
    options: { key: string; label: string }[];
    show: boolean;
    setShow: (v: boolean) => void;
    onChange: (v: string) => void;
    icon?: React.ReactNode;
  }) => (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="btn-secondary text-sm whitespace-nowrap"
      >
        {icon}
        {options.find(o => o.key === value)?.label}
        <ChevronDown className={cn('w-4 h-4 transition-transform', show && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 top-full mt-2 min-w-[160px] bg-white rounded-card border border-ivory-200 shadow-card-hover py-2 z-50"
          >
            {options.map(opt => (
              <button
                key={opt.key}
                onClick={() => { onChange(opt.key); setShow(false); setPage(1); }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm hover:bg-ivory-100 transition-colors',
                  value === opt.key && 'text-terracotta-600 font-medium bg-terracotta-50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const FilterSection = ({ title, options, selected, setSelected }: {
    title: string;
    options: string[];
    selected: string[];
    setSelected: (v: string[]) => void;
  }) => (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-carbon-700 mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => { toggleArray(selected, setSelected, opt); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border',
              selected.includes(opt)
                ? 'bg-terracotta-500 text-white border-terracotta-500 shadow-sm'
                : 'bg-white text-ivory-600 border-ivory-200 hover:border-terracotta-300 hover:text-terracotta-600'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="section-title">找装修公司</h1>
          <p className="section-subtitle mb-0">精选平台认证装修公司，资质真实可查</p>
        </div>

        <div className="sticky top-0 z-30 bg-ivory-50/95 backdrop-blur-md border-b border-ivory-200 -mx-4 px-4 py-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-500" />
              <input
                type="text"
                placeholder="搜索公司名称..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                className="input-base pl-10"
              />
            </div>
            <DropdownSelect value={city} options={cityOptions} show={showCityDropdown} setShow={setShowCityDropdown} onChange={setCity} icon={<MapPin className="w-4 h-4" />} />
            <DropdownSelect value={qualification} options={qualificationOptions} show={showQualDropdown} setShow={setShowQualDropdown} onChange={setQualification} icon={<Award className="w-4 h-4" />} />
            <DropdownSelect value={ratingFilter} options={ratingOptions} show={showRatingDropdown} setShow={setShowRatingDropdown} onChange={setRatingFilter} icon={<Star className="w-4 h-4" />} />
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={clearFilters}
                className="btn-ghost text-sm"
              >
                <X className="w-4 h-4" />
                清除筛选
              </button>
              <DropdownSelect value={sortBy} options={sortOptions} show={showSortDropdown} setShow={setShowSortDropdown} onChange={setSortBy} />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.aside
                key="sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0 overflow-hidden"
              >
                <div className="card-base p-5 sticky top-[180px]" style={{ width: 280 }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-wood-600" />
                      <h3 className="font-serif text-base font-semibold text-carbon-800">筛选条件</h3>
                    </div>
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="p-1.5 rounded-lg hover:bg-ivory-100 text-ivory-500 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                  <FilterSection title="服务范围" options={serviceScopeOptions} selected={selectedServices} setSelected={setSelectedServices} />
                  <FilterSection title="价格区间" options={priceRangeOptions} selected={selectedPrices} setSelected={setSelectedPrices} />
                  <FilterSection title="工期承诺" options={durationOptions} selected={selectedDurations} setSelected={setSelectedDurations} />
                  <FilterSection title="特色标签" options={featureTagsOptions} selected={selectedFeatures} setSelected={setSelectedFeatures} />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="flex-shrink-0 self-start sticky top-[180px] card-base p-2 hover:shadow-card-hover transition-all"
            >
              <ChevronRight className="w-5 h-5 text-wood-600" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-ivory-600">
                共找到 <span className="font-semibold text-terracotta-600">{filteredCompanies.length}</span> 家装修公司
              </p>
            </div>

            {pagedCompanies.length === 0 ? (
              <div className="card-base p-16 text-center">
                <Building2 className="w-16 h-16 text-ivory-300 mx-auto mb-4" />
                <h3 className="font-serif text-lg font-semibold text-carbon-700 mb-2">未找到匹配的装修公司</h3>
                <p className="text-ivory-500 mb-6">请尝试调整筛选条件</p>
                <button onClick={clearFilters} className="btn-primary">
                  清除全部筛选
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pagedCompanies.map((company, idx) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                  >
                    <div className="card-hoverable overflow-hidden h-full flex flex-col">
                      <div className="p-4 border-b border-ivory-200">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-ivory-200 flex-shrink-0 bg-ivory-50">
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-serif font-semibold text-carbon-800 truncate">{company.name}</h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold border',
                                qualificationBadge[company.qualification].bg,
                                qualificationBadge[company.qualification].className
                              )}>
                                {qualificationBadge[company.qualification].text}
                              </span>
                              <div className="flex items-center gap-1">
                                <RatingStars rating={company.rating} />
                                <span className="text-sm font-semibold text-amber-600">{company.rating.toFixed(1)}</span>
                                <span className="text-[11px] text-ivory-500">({company.reviewCount})</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 p-3 bg-ivory-50">
                        {company.cases.map((c, ci) => (
                          <div key={ci} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                            <img
                              src={c.image}
                              alt={c.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                              <span className="text-white text-[10px] font-medium truncate w-full">{c.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <div className="grid grid-cols-2 gap-y-2 gap-x-3 mb-3 text-xs">
                          <div className="flex items-center gap-1.5 text-ivory-600">
                            <Users className="w-3.5 h-3.5 text-wood-500" />
                            <span>服务 <b className="text-carbon-700">{company.servedHouseholds}</b> 户</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-ivory-600">
                            <Briefcase className="w-3.5 h-3.5 text-haze-500" />
                            <span>案例 <b className="text-carbon-700">{company.caseCount}</b> 套</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-ivory-600">
                            <Award className="w-3.5 h-3.5 text-terracotta-500" />
                            <span className="text-terracotta-600 font-semibold">¥{company.avgPrice}/㎡起</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-ivory-600">
                            <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
                            <span>{company.city}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {company.features.slice(0, 4).map(f => (
                            <span key={f} className="px-2 py-0.5 rounded bg-wood-50 text-wood-700 text-[11px] border border-wood-100">
                              {f}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto flex gap-2">
                          <button
                            onClick={() => navigate(`/owner/companies/${company.id}`)}
                            className="flex-1 btn-secondary text-sm py-2"
                          >
                            查看详情
                          </button>
                          <button
                            onClick={() => navigate(`/owner/companies/${company.id}?book=1`)}
                            className="flex-1 btn-primary text-sm py-2"
                          >
                            <Calendar className="w-4 h-4" />
                            预约量房
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredCompanies.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={filteredCompanies.length}
                  onChange={setPage}
                  showSizeChanger={false}
                  showQuickJumper
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
