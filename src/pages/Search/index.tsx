import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  AlertTriangle,
  Download,
  X,
  RotateCcw,
  Bookmark,
  TrendingUp,
} from 'lucide-react';
import { Input, Select, Checkbox, Slider, Button, Pagination, Empty, Spin, Tag, message } from 'antd';
import CompanyCard from '@/components/search/CompanyCard';
import { useSearchStore } from '@/store/searchStore';
import { INDUSTRIES, PROVINCES, RISK_LEVEL_CONFIG } from '@/constants';
import { mockCompanies } from '@/mock/data';
import ReactECharts from 'echarts-for-react';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { filters, setFilters, resetFilters } = useSearchStore();
  const [filterOpen, setFilterOpen] = useState(true);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(mockCompanies);
  const [searchType, setSearchType] = useState<'company' | 'person' | 'case'>('company');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (searchParams.get('keyword')) {
      setKeyword(searchParams.get('keyword') || '');
      handleSearch();
    }
  }, [searchParams]);

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      let filtered = [...mockCompanies];
      if (keyword) {
        filtered = filtered.filter(c =>
          c.name.includes(keyword) ||
          c.legalPerson.includes(keyword) ||
          c.creditCode.includes(keyword)
        );
      }
      if (filters.industry) {
        filtered = filtered.filter(c => c.industry === filters.industry);
      }
      if (filters.province) {
        filtered = filtered.filter(c => c.province === filters.province);
      }
      if (filters.riskLevel && filters.riskLevel.length > 0) {
        filtered = filtered.filter(c => filters.riskLevel!.includes(c.riskLevel));
      }
      setResults(filtered);
      setCurrentPage(1);
      setLoading(false);
    }, 500);
  };

  const handleReset = () => {
    setKeyword('');
    resetFilters();
    setResults(mockCompanies);
    setCurrentPage(1);
  };

  const handleExport = () => {
    message.info('正在导出检索结果...');
  };

  const mapOption = {
    tooltip: { trigger: 'item' },
    visualMap: {
      min: 0,
      max: 100,
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      inRange: { color: ['#F0F4FA', '#194BA0', '#0A1628'] },
    },
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        symbolSize: (val: number[]) => val[2] / 10,
        data: [
          { name: '北京', value: [116.46, 39.92, 235] },
          { name: '上海', value: [121.48, 31.22, 189] },
          { name: '广州', value: [113.23, 23.16, 156] },
          { name: '深圳', value: [114.07, 22.62, 178] },
          { name: '杭州', value: [120.19, 30.26, 132] },
          { name: '成都', value: [104.06, 30.67, 98] },
        ],
        itemStyle: { color: '#C9A962' },
      },
    ],
    geo: {
      map: 'china',
      roam: false,
      itemStyle: { areaColor: '#F5F1E8', borderColor: '#CED4DA' },
      emphasis: { itemStyle: { areaColor: '#D1DBEC' } },
    },
  };

  const riskDistribution = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['50%', '50%'],
        label: { show: true, position: 'center', formatter: '{b}\n{c}家', fontSize: 14, fontWeight: 'bold' },
        data: [
          { value: results.filter(r => r.riskLevel === 'low').length, name: '低风险', itemStyle: { color: '#10B981' } },
          { value: results.filter(r => r.riskLevel === 'medium').length, name: '中风险', itemStyle: { color: '#F59E0B' } },
          { value: results.filter(r => r.riskLevel === 'high').length, name: '高风险', itemStyle: { color: '#F97316' } },
          { value: results.filter(r => r.riskLevel === 'critical').length, name: '极高风险', itemStyle: { color: '#B23A48' } },
        ],
      },
    ],
  };

  const selectedProvince = PROVINCES.find(p => p.value === filters.province);

  return (
    <div className="space-y-5">
      <div className="lc-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex bg-neutral-ivory rounded-lg p-1">
            {[
              { value: 'company', label: '企业检索', icon: Building2 },
              { value: 'person', label: '人员检索', icon: MapPin },
              { value: 'case', label: '案件检索', icon: AlertTriangle },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  onClick={() => setSearchType(item.value as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                    searchType === item.value
                      ? 'bg-primary-900 text-white'
                      : 'text-neutral-ink-600 hover:text-primary-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-ink-400" />
          <Input
            size="large"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            placeholder="输入企业名称、统一社会信用代码、法定代表人或关键词..."
            className="pl-16 pr-40 h-14 text-lg"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            <Button onClick={handleReset} size="large" icon={<RotateCcw className="w-4 h-4" />}>
              重置
            </Button>
            <Button type="primary" size="large" onClick={handleSearch} icon={<Search className="w-4 h-4" />}>
              检索
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <span className="text-sm text-neutral-ink-500">热门搜索：</span>
          {['金融纠纷', '知识产权', '劳动合同', '建设工程', '房产纠纷'].map(tag => (
            <Tag
              key={tag}
              className="cursor-pointer hover:border-primary-500 hover:text-primary-500 !m-0"
              onClick={() => { setKeyword(tag); handleSearch(); }}
            >
              {tag}
            </Tag>
          ))}
        </div>
      </div>

      <div className="flex gap-5 items-start">
        <div className={cn(
          'flex-shrink-0 transition-all duration-300 overflow-hidden',
          filterOpen ? 'w-72' : 'w-0'
        )}>
          <div className="lc-card p-5 w-72">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-primary-900 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                高级筛选
              </h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="p-1 hover:bg-neutral-ink-50 rounded"
              >
                <X className="w-4 h-4 text-neutral-ink-500" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="lc-input-label">所属行业</label>
                <Select
                  size="large"
                  placeholder="请选择行业"
                  allowClear
                  value={filters.industry}
                  onChange={(val) => setFilters({ industry: val })}
                  options={INDUSTRIES.map(i => ({ value: i.value, label: i.label }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="lc-input-label">所在地区</label>
                <Select
                  size="large"
                  placeholder="省份"
                  allowClear
                  value={filters.province}
                  onChange={(val) => setFilters({ province: val, city: undefined })}
                  options={PROVINCES.map(p => ({ value: p.value, label: p.label }))}
                  className="w-full mb-2"
                />
                {selectedProvince && (
                  <Select
                    size="large"
                    placeholder="城市"
                    allowClear
                    value={filters.city}
                    onChange={(val) => setFilters({ city: val })}
                    options={selectedProvince.cities.map(c => ({ value: c, label: c }))}
                    className="w-full"
                  />
                )}
              </div>

              <div>
                <label className="lc-input-label mb-2 block">风险等级</label>
                <Checkbox.Group
                  value={filters.riskLevel || []}
                  onChange={(val) => setFilters({ riskLevel: val as any })}
                  className="flex flex-col gap-2"
                >
                  {Object.entries(RISK_LEVEL_CONFIG).map(([key, config]) => (
                    <Checkbox key={key} value={key}>
                      <span className={cn('lc-badge', config.className)}>{config.label}</span>
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>

              <div>
                <label className="lc-input-label mb-3 block">注册资本（万元）</label>
                <Slider
                  range
                  min={0}
                  max={100000}
                  step={1000}
                  defaultValue={[0, 100000]}
                />
                <div className="flex justify-between text-xs text-neutral-ink-500">
                  <span>0</span>
                  <span>10亿+</span>
                </div>
              </div>

              <div>
                <label className="lc-input-label mb-2 block">涉诉情况</label>
                <Checkbox.Group className="flex flex-col gap-2">
                  <Checkbox value="hasLawsuit">有裁判文书记录</Checkbox>
                  <Checkbox value="hasExecution">有被执行记录</Checkbox>
                  <Checkbox value="hasBankruptcy">有破产重整记录</Checkbox>
                </Checkbox.Group>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-ink-100 flex gap-3">
              <Button block onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>重置</Button>
              <Button type="primary" block onClick={handleSearch} icon={<Filter className="w-4 h-4" />}>应用筛选</Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-5">
            {!filterOpen && (
              <button
                onClick={() => setFilterOpen(true)}
                className="flex items-center gap-2 px-4 py-2 lc-card border-0 hover:shadow-card-hover transition-all"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">高级筛选</span>
                {Object.values(filters).filter(Boolean).length > 0 && (
                  <span className="lc-badge bg-accent-gold text-primary-900">
                    {Object.values(filters).filter(Boolean).length}
                  </span>
                )}
              </button>
            )}
            <div className="flex-1" />
            <span className="text-sm text-neutral-ink-500">
              共找到 <span className="font-semibold text-primary-900">{results.length}</span> 条结果
            </span>
            <Select
              size="large"
              defaultValue="relevance"
              style={{ width: 140 }}
              options={[
                { value: 'relevance', label: '相关度' },
                { value: 'risk_desc', label: '风险从高到低' },
                { value: 'risk_asc', label: '风险从低到高' },
                { value: 'capital_desc', label: '注册资本' },
              ]}
            />
            <Button icon={<Download className="w-4 h-4" />} onClick={handleExport}>导出</Button>
            <Button icon={<Bookmark className="w-4 h-4" />}>保存条件</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
            <div className="lc-card p-4 lg:col-span-3">
              <ReactECharts option={riskDistribution} style={{ height: 180 }} />
            </div>
            <div className="lc-card p-4 flex flex-col justify-center">
              <div className="text-sm text-neutral-ink-500 mb-2">企业地域分布</div>
              <div className="text-2xl font-serif font-bold text-primary-900">{results.length}</div>
              <div className="text-sm text-green-600 flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4" />
                较上月 +12.5%
              </div>
              <div className="mt-3 space-y-2">
                {['北京', '上海', '广东'].map(region => (
                  <div key={region} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-ink-600">{region}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-neutral-ink-100 rounded-full overflow-hidden">
                        <div className="h-full primary-gradient rounded-full" style={{ width: `${Math.random() * 60 + 30}%` }} />
                      </div>
                      <span className="text-neutral-ink-900 font-medium w-8 text-right">{Math.floor(Math.random() * 50 + 10)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="lc-card p-16 flex justify-center">
              <Spin size="large" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(company => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onClick={() => navigate(`/search/company/${company.id}`)}
                />
              ))}

              {results.length > pageSize && (
                <div className="flex justify-center pt-4">
                  <Pagination
                    current={currentPage}
                    total={results.length}
                    pageSize={pageSize}
                    onChange={setCurrentPage}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="lc-card p-16">
              <Empty description="暂无匹配的检索结果，请调整筛选条件" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default SearchPage;
