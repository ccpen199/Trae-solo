import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  Gavel,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Briefcase,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  Input,
  Select,
  Slider,
  Button,
  Pagination,
  Empty,
  Spin,
  Tag,
  Card,
  Tabs,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import { mockCaseSources } from '@/mock/data';
import { CASE_CAUSES, PROVINCES } from '@/constants';
import { formatMoney, formatDate, isOverdue, isUpcoming } from '@/utils/format';
import type { CaseSource, CaseSourceStatus } from '@/types/case';

const STATUS_CONFIG: Record<CaseSourceStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '招募中', color: 'blue' },
  bidding: { label: '竞标中', color: 'gold' },
  selected: { label: '已中标', color: 'purple' },
  processing: { label: '办理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
};

const CaseMarket: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [selectedCause, setSelectedCause] = useState<string | undefined>();
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>();
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 500000000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const pageSize = 6;

  const allTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    mockCaseSources.forEach((cs) => {
      cs.tags.forEach((tag) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const filteredCases = useMemo(() => {
    let result = [...mockCaseSources];

    if (activeTab === 'bidding') {
      result = result.filter((c) => c.status === 'bidding');
    } else if (activeTab === 'published') {
      result = result.filter((c) => c.status === 'published');
    } else if (activeTab === 'smart') {
      result = result.filter((c) => c.status === 'bidding' || c.status === 'published');
    }

    if (keyword) {
      result = result.filter(
        (c) =>
          c.title.includes(keyword) ||
          c.description.includes(keyword) ||
          c.tags.some((t) => t.includes(keyword))
      );
    }

    if (selectedCause) {
      result = result.filter((c) => c.cause === selectedCause);
    }

    if (selectedProvince) {
      result = result.filter((c) => c.province === selectedProvince);
    }

    result = result.filter(
      (c) => c.amount >= amountRange[0] && c.amount <= amountRange[1]
    );

    return result;
  }, [keyword, selectedCause, selectedProvince, amountRange, activeTab]);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCases.slice(start, start + pageSize);
  }, [filteredCases, currentPage]);

  const amountDistributionOption = useMemo(() => {
    const ranges = [
      { name: '100万以下', min: 0, max: 1000000 },
      { name: '100-500万', min: 1000000, max: 5000000 },
      { name: '500-1000万', min: 5000000, max: 10000000 },
      { name: '1000-5000万', min: 10000000, max: 50000000 },
      { name: '5000万以上', min: 50000000, max: Infinity },
    ];
    const data = ranges.map((r) => ({
      value: mockCaseSources.filter((c) => c.amount >= r.min && c.amount < r.max).length,
      name: r.name,
    }));
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLine: { lineStyle: { color: '#DEE2E6' } },
        axisLabel: { color: '#6B7280', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#F8F9FA' } },
        axisLabel: { color: '#6B7280' },
      },
      series: [
        {
          type: 'bar',
          data: data.map((d, i) => ({
            value: d.value,
            itemStyle: {
              color: i < 2 ? '#C9A962' : '#0A1628',
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: '50%',
        },
      ],
    };
  }, []);

  const smartMatches = useMemo(() => {
    return mockCaseSources
      .filter((c) => c.status === 'bidding' || c.status === 'published')
      .slice(0, 3);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedCause, selectedProvince, amountRange, activeTab]);

  const handleReset = () => {
    setKeyword('');
    setSelectedCause(undefined);
    setSelectedProvince(undefined);
    setAmountRange([0, 500000000]);
    setCurrentPage(1);
  };

  const formatAmountLabel = (val: number) => {
    if (val >= 100000000) return `${(val / 100000000).toFixed(0)}亿`;
    if (val >= 10000) return `${(val / 10000).toFixed(0)}万`;
    return val.toString();
  };

  const renderCaseCard = (cs: CaseSource) => {
    const causeInfo = CASE_CAUSES.find((c) => c.value === cs.cause);
    const provinceInfo = PROVINCES.find((p) => p.value === cs.province);
    const statusConfig = STATUS_CONFIG[cs.status];

    return (
      <Card
        key={cs.id}
        className="lc-card border-0 hover:-translate-y-1 cursor-pointer transition-all duration-300"
        onClick={() => navigate(`/cases/${cs.id}`)}
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-serif font-semibold text-lg text-primary-900 line-clamp-2 flex-1 leading-snug">
              {cs.title}
            </h3>
            <Tag
              color={statusConfig.color === 'gold' ? 'gold' : statusConfig.color}
              className="flex-shrink-0 !m-0"
            >
              {statusConfig.label}
            </Tag>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-accent-gold">
              <Gavel className="w-4 h-4" />
              <span className="font-serif font-bold text-xl">
                ¥{formatMoney(cs.amount, 0)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-neutral-ink-500">
              <Users className="w-3.5 h-3.5" />
              <span>{cs.bids.length}人竞标</span>
            </div>
          </div>

          <p className="text-sm text-neutral-ink-600 line-clamp-2 mb-4 leading-relaxed">
            {cs.description}
          </p>

          <div className="flex gap-1.5 flex-wrap mb-4">
            {causeInfo && (
              <Tag color="blue" className="!m-0">
                {causeInfo.label}
              </Tag>
            )}
            {cs.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} className="!m-0">
                {tag}
              </Tag>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-ink-100">
            <div className="flex items-center gap-1 text-sm text-neutral-ink-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {provinceInfo?.label || cs.province}
                {cs.city ? `·${cs.city}` : ''}
              </span>
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-sm',
                isOverdue(cs.deadline)
                  ? 'text-accent-red'
                  : isUpcoming(cs.deadline, 3)
                  ? 'text-yellow-600'
                  : 'text-neutral-ink-500'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isOverdue(cs.deadline)
                  ? '已截止'
                  : `${formatDate(cs.deadline, 'MM-DD')}截止`}
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const tabItems = [
    { key: 'all', label: '全部案源' },
    { key: 'smart', label: '智能匹配', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'bidding', label: '竞标中' },
    { key: 'published', label: '招募中' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900">案源市场</h1>
          <p className="text-neutral-ink-500 mt-1">
            发现优质案源，对接精准客户，拓展业务边界
          </p>
        </div>
      </div>

      <Card className="lc-card border-0 p-6">
        <div className="relative mb-5">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-ink-400" />
          <Input
            size="large"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索案件标题、描述或关键词..."
            className="pl-14 pr-28 h-12"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            <Button onClick={handleReset} size="large" icon={<RotateCcw className="w-4 h-4" />}>
              重置
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<Search className="w-4 h-4" />}
            >
              搜索
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-neutral-ink-700">热门案由：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 15).map((tag, idx) => {
              const size =
                idx < 3 ? 'text-base' : idx < 7 ? 'text-sm' : 'text-xs';
              const weight = idx < 3 ? 'font-semibold' : idx < 7 ? 'font-medium' : 'font-normal';
              const colorClass =
                idx < 3
                  ? 'text-accent-gold bg-accent-gold/10 border-accent-gold/30 hover:bg-accent-gold/20'
                  : idx < 7
                  ? 'text-primary-700 bg-primary-50 border-primary-200 hover:bg-primary-100'
                  : 'text-neutral-ink-600 bg-neutral-ink-50 border-neutral-ink-200 hover:bg-neutral-ink-100';
              return (
                <button
                  key={tag.name}
                  onClick={() => setKeyword(tag.name)}
                  className={cn(
                    'px-3 py-1.5 rounded-full border transition-all duration-200',
                    size,
                    weight,
                    colorClass
                  )}
                >
                  {tag.name}
                  <span className="ml-1 opacity-60">{tag.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={cn(
          'flex-shrink-0 transition-all duration-300 overflow-hidden',
          filterOpen ? 'lg:block' : 'lg:hidden hidden'
        )}>
          <div className="lc-card p-5 lg:w-72">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif font-semibold text-primary-900 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                筛选条件
              </h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="lg:hidden p-1 hover:bg-neutral-ink-50 rounded"
              >
                <X className="w-4 h-4 text-neutral-ink-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="lc-input-label">案件案由</label>
                <Select
                  size="large"
                  placeholder="请选择案由"
                  allowClear
                  value={selectedCause}
                  onChange={(val) => setSelectedCause(val)}
                  options={CASE_CAUSES.map((c) => ({ value: c.value, label: c.label }))}
                  className="w-full"
                  showSearch
                  optionFilterProp="label"
                />
              </div>

              <div>
                <label className="lc-input-label">所在地区</label>
                <Select
                  size="large"
                  placeholder="省份/直辖市"
                  allowClear
                  value={selectedProvince}
                  onChange={(val) => setSelectedProvince(val)}
                  options={PROVINCES.map((p) => ({ value: p.value, label: p.label }))}
                  className="w-full"
                  showSearch
                  optionFilterProp="label"
                />
              </div>

              <div>
                <label className="lc-input-label mb-3 block">
                  标的金额范围
                  <span className="ml-2 text-sm font-normal text-neutral-ink-500">
                    {formatAmountLabel(amountRange[0])} - {formatAmountLabel(amountRange[1])}
                  </span>
                </label>
                <Slider
                  range
                  min={0}
                  max={500000000}
                  step={100000}
                  value={amountRange}
                  onChange={(val) => setAmountRange(val as [number, number])}
                  tooltip={{
                    formatter: (val) => formatAmountLabel(val as number),
                  }}
                  styles={{ track: { background: 'linear-gradient(90deg, #0A1628, #C9A962)' } }}
                />
                <div className="flex justify-between text-xs text-neutral-ink-500 mt-1">
                  <span>0</span>
                  <span>5亿</span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-ink-100">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-ink-700">金额分布</span>
                    <TrendingUp className="w-4 h-4 text-accent-gold" />
                  </div>
                </div>
                <ReactECharts option={amountDistributionOption} style={{ height: 180 }} />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-ink-100 flex gap-3">
              <Button block onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
                重置
              </Button>
              <Button type="primary" block icon={<Filter className="w-4 h-4" />}>
                应用筛选
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 lg:col-span-3">
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {!filterOpen && (
              <button
                onClick={() => setFilterOpen(true)}
                className="flex items-center gap-2 px-4 py-2 lc-card border-0 hover:shadow-card-hover transition-all"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">筛选</span>
              </button>
            )}
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              className="flex-1 min-w-0"
              style={{ minWidth: 0 }}
            />
            <div className="flex-1" />
            <span className="text-sm text-neutral-ink-500">
              共 <span className="font-semibold text-primary-900">{filteredCases.length}</span> 个案源
            </span>
          </div>

          {activeTab === 'smart' && smartMatches.length > 0 && (
            <Card
              className="lc-card border-0 mb-6 overflow-hidden"
              styles={{ body: { padding: 0 } }}
            >
              <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                      <h3 className="text-white font-serif font-semibold text-lg">智能匹配推荐</h3>
                      <p className="text-primary-200 text-sm">基于您的专业领域、执业经验和历史偏好智能推荐</p>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    className="!bg-accent-gold !text-primary-900 hover:!bg-accent-gold-light"
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    查看全部
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
                {smartMatches.map((cs) => {
                  const causeInfo = CASE_CAUSES.find((c) => c.value === cs.cause);
                  return (
                    <div
                      key={cs.id}
                      onClick={() => navigate(`/cases/${cs.id}`)}
                      className="p-4 rounded-lg border border-neutral-ink-100 hover:border-accent-gold/50 hover:bg-accent-gold/5 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-primary-900 line-clamp-1 group-hover:text-accent-gold-dark">
                          {cs.title}
                        </span>
                        <Briefcase className="w-4 h-4 text-neutral-ink-400 group-hover:text-accent-gold flex-shrink-0 ml-2" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-ink-500 mb-2">
                        <span className="text-accent-gold font-semibold">¥{formatMoney(cs.amount, 0)}</span>
                        <span>·</span>
                        <span>{causeInfo?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span className="text-xs">{cs.bids.length}人竞标</span>
                        </div>
                        <span className="text-xs text-primary-500">匹配度 95%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {loading ? (
            <div className="lc-card p-16 flex justify-center">
              <Spin size="large" />
            </div>
          ) : paginatedCases.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginatedCases.map(renderCaseCard)}
              </div>

              {filteredCases.length > pageSize && (
                <div className="flex justify-center pt-6">
                  <Pagination
                    current={currentPage}
                    total={filteredCases.length}
                    pageSize={pageSize}
                    onChange={setCurrentPage}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="lc-card p-16">
              <Empty description="暂无匹配的案源，请调整筛选条件" />
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

export default CaseMarket;
