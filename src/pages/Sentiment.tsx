import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, TrendingUp, TrendingDown, Newspaper, BarChart3, PieChart as PieChartIcon, Calendar, ChevronRight, Star, Eye, MessageSquare, Share2, Building2, AlertTriangle, Link2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { LineChart } from '../components/charts/LineChart';
import { PieChart } from '../components/charts/PieChart';
import { BarChart } from '../components/charts/BarChart';
import { mockNews, mockSentimentStats, mockSentimentTrend, mockSourceDistribution, mockHotKeywords } from '../data/sentiment';
import { mockCompanies } from '../data/companies';
import { mockProjects from '../data/projects';
import { formatNumber } from '../utils/format';
import type { NewsItem, SentimentType, SourceLevel } from '../types/sentiment';
import { useAppStore } from '../stores/useAppStore';

export default function Sentiment() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentType | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceLevel | 'all'>('all');
  const [activeHotKeyword, setActiveHotKeyword] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [dimensionView, setDimensionView] = useState<'trend' | 'company' | 'region'>('trend');
  
  const navigate = useNavigate();
  const { setSelectedCompany, setFinanceContext } = useAppStore();

  const filteredNews = mockNews.filter(n => {
    if (searchKeyword && !n.title.includes(searchKeyword) && !n.summary.includes(searchKeyword)) {
      return false;
    }
    if (activeHotKeyword && !n.keywords.includes(activeHotKeyword) && 
        !n.title.includes(activeHotKeyword) && !n.summary.includes(activeHotKeyword)) {
      return false;
    }
    if (sentimentFilter !== 'all' && n.sentiment !== sentimentFilter) {
      return false;
    }
    if (sourceFilter !== 'all' && n.sourceLevel !== sourceFilter) {
      return false;
    }
    return true;
  });

  const sentimentData = [
    { name: '正面', value: mockSentimentStats.positive, color: '#10B981' },
    { name: '中性', value: mockSentimentStats.neutral, color: '#64748B' },
    { name: '负面', value: mockSentimentStats.negative, color: '#EF4444' },
  ];

  const sourceData = {
    xAxis: mockSourceDistribution.map(s => s.name),
    series: [
      {
        name: '新闻数量',
        data: mockSourceDistribution.map(s => s.count),
        color: '#8B5CF6',
      },
    ],
  };

  const companySentimentData = useMemo(() => {
    return mockCompanies.slice(0, 6).map(c => ({
      ...c,
      total: Math.floor(Math.random() * 800) + 200,
      positive: Math.floor(Math.random() * 400) + 100,
      negative: Math.floor(Math.random() * 100) + 20,
      neutral: 0,
      score: Math.floor(Math.random() * 40) + 50,
    })).map(c => ({ ...c, neutral: c.total - c.positive - c.negative }));
  }, []);

  const regionSentimentData = [
    { name: '华东', total: 1280, positive: 720, negative: 180, neutral: 380 },
    { name: '华南', total: 960, positive: 520, negative: 160, neutral: 280 },
    { name: '华北', total: 840, positive: 450, negative: 140, neutral: 250 },
    { name: '西南', total: 620, positive: 320, negative: 110, neutral: 190 },
    { name: '华中', total: 540, positive: 280, negative: 90, neutral: 170 },
    { name: '西北', total: 320, positive: 170, negative: 50, neutral: 100 },
    { name: '东北', total: 280, positive: 140, negative: 45, neutral: 95 },
  ];

  const trendData = {
    xAxis: mockSentimentTrend.map(t => t.date.slice(5)),
    series: [
      { name: '正面', data: mockSentimentTrend.map(t => t.positive), color: '#10B981' },
      { name: '中性', data: mockSentimentTrend.map(t => t.neutral), color: '#64748B' },
      { name: '负面', data: mockSentimentTrend.map(t => t.negative), color: '#EF4444' },
    ],
  };

  const getSentimentTag = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'positive':
        return <Tag variant="success">正面</Tag>;
      case 'negative':
        return <Tag variant="danger">负面</Tag>;
      default:
        return <Tag variant="default">中性</Tag>;
    }
  };

  const getSourceLevelText = (level: SourceLevel) => {
    switch (level) {
      case 'national': return '国家级';
      case 'provincial': return '省级';
      case 'city': return '城市级';
      case 'industry': return '行业媒体';
      case 'self-media': return '自媒体';
      default: return level;
    }
  };

  const getAuthorityStars = (authority: number) => {
    const stars = Math.round(authority / 20);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < stars ? 'text-warning-500 fill-warning-500' : 'text-dark-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-danger-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-success-500" />;
      default:
        return <span className="w-3 h-3 rounded-full bg-dark-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">舆情情感分析</h1>
            <p className="text-sm text-dark-400 mt-1">自动识别报道倾向性，标记信源权威度</p>
          </div>
          <div className="flex items-center gap-3">
            <Tag variant="primary">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse mr-1.5" />
              实时监测中
            </Tag>
            <Button variant="outline" size="md" icon={<BarChart3 className="w-4 h-4" />}>
              舆情报告
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="grid grid-cols-4 gap-5">
          <div className="p-4 rounded-xl bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-dark-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">今日舆情总量</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">
                  {mockSentimentStats.total.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-brand-400" />
              </div>
            </div>
            <p className="text-xs text-dark-500 mt-2">较昨日 <span className="text-success-500">+12.5%</span></p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-success-500/10 to-success-900/10 border border-success-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">正面舆情</p>
                <p className="text-2xl font-bold text-success-500 font-mono mt-1">
                  {mockSentimentStats.positive.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success-400" />
              </div>
            </div>
            <p className="text-xs text-dark-500 mt-2">占比 {(mockSentimentStats.positiveRate * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-dark-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">中性舆情</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">
                  {mockSentimentStats.neutral.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-dark-700/50 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-dark-400" />
              </div>
            </div>
            <p className="text-xs text-dark-500 mt-2">占比 {((1 - mockSentimentStats.positiveRate - mockSentimentStats.negativeRate) * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-danger-500/10 to-danger-900/10 border border-danger-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">负面舆情</p>
                <p className="text-2xl font-bold text-danger-500 font-mono mt-1">
                  {mockSentimentStats.negative.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-danger-500/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-danger-400" />
              </div>
            </div>
            <p className="text-xs text-dark-500 mt-2">占比 {(mockSentimentStats.negativeRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex px-6 pb-6 gap-5 min-h-0">
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <Card className="flex-shrink-0">
            <Card.Header>
              <Tabs
                tabs={[
                  { key: 'overview', label: '舆情总览' },
                  { key: 'list', label: '新闻列表' },
                  { key: 'keywords', label: '热点关键词' },
                ]}
                activeKey={activeTab}
                onChange={setActiveTab}
                variant="pills"
              />
              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    placeholder="搜索关键词..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full h-8 pl-10 pr-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 placeholder:text-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value as any)}
                  className="h-8 px-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50 transition-all"
                >
                  <option value="all">全部情感</option>
                  <option value="positive">正面</option>
                  <option value="neutral">中性</option>
                  <option value="negative">负面</option>
                </select>
              </div>
            </Card.Header>
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col">
            <Card.Body className="flex-1 overflow-y-auto">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {[
                      { key: 'trend', label: '趋势走势' },
                      { key: 'company', label: '房企维度' },
                      { key: 'region', label: '区域维度' },
                    ].map(view => (
                      <button
                        key={view.key}
                        onClick={() => setDimensionView(view.key as any)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                          dimensionView === view.key
                            ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                            : 'text-dark-400 hover:text-dark-300 hover:bg-dark-800/30 border border-transparent'
                        }`}
                      >
                        {view.label}
                      </button>
                    ))}
                    <div className="flex-1" />
                    <button
                      onClick={() => {
                        const topCompany = companySentimentData.find(c => c.negative > 50);
                        if (topCompany) {
                          setSelectedCompany(topCompany as any);
                          setFinanceContext({ companyId: topCompany.id, source: 'home' });
                          navigate('/monitoring');
                        }
                      }}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 transition-colors flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      关联财务异动
                    </button>
                  </div>

                  {dimensionView === 'trend' && (
                    <div className="space-y-4">
                      <Card>
                        <Card.Header>
                          <Card.Title className="text-sm">舆情情感走势</Card.Title>
                          <Tag variant="outline">近14天 · 全行业</Tag>
                        </Card.Header>
                        <Card.Body>
                          <LineChart data={trendData} height={280} showLegend />
                        </Card.Body>
                      </Card>
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <Card.Header>
                            <Card.Title className="text-sm">情感分布</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <PieChart
                              data={sentimentData}
                              type="doughnut"
                              height={200}
                              showLegend={true}
                            />
                          </Card.Body>
                        </Card>
                        <Card>
                          <Card.Header>
                            <Card.Title className="text-sm">信源分布</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <BarChart data={sourceData} horizontal height={200} showLegend={false} />
                          </Card.Body>
                        </Card>
                      </div>
                    </div>
                  )}

                  {dimensionView === 'company' && (
                    <div className="space-y-4">
                      <Card>
                        <Card.Header>
                          <Card.Title className="text-sm">房企舆情热度排行</Card.Title>
                          <div className="flex items-center gap-2">
                            <select
                              value={companyFilter}
                              onChange={(e) => setCompanyFilter(e.target.value)}
                              className="text-[10px] bg-dark-800/50 border border-dark-700/50 rounded px-2 py-1 text-dark-300 focus:outline-none"
                            >
                              <option value="all">全部房企</option>
                              <option value="state-owned">仅国企</option>
                              <option value="private">仅民企</option>
                            </select>
                            <Tag variant="outline">TOP6</Tag>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div className="space-y-3">
                            {companySentimentData.map((company, i) => (
                              <div 
                                key={company.id}
                                className="p-3 rounded-lg bg-dark-800/30 border border-dark-700/30 hover:border-brand-500/30 cursor-pointer transition-all group"
                                onClick={() => {
                                  setSelectedCompany(company as any);
                                  setFinanceContext({ companyId: company.id, source: 'home' });
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-dark-700/50 flex items-center justify-center text-lg flex-shrink-0">
                                    {company.logo}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">
                                        {company.shortName}
                                      </p>
                                      <Tag variant={company.type === 'state-owned' ? 'primary' : company.type === 'private' ? 'success' : 'warning'} size="xs">
                                        {company.type === 'state-owned' ? '国企' : company.type === 'private' ? '民企' : '混合'}
                                      </Tag>
                                      <span className="text-[10px] font-mono text-brand-400">{company.total}篇报道</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <div className="flex-1 h-2 rounded-full bg-dark-700 overflow-hidden flex">
                                        <div 
                                          className="h-full bg-success-500"
                                          style={{ width: `${(company.positive / company.total) * 100}%` }}
                                        />
                                        <div 
                                          className="h-full bg-dark-500"
                                          style={{ width: `${(company.neutral / company.total) * 100}%` }}
                                        />
                                        <div 
                                          className="h-full bg-danger-500"
                                          style={{ width: `${(company.negative / company.total) * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-dark-400 font-mono w-16 text-right">
                                        情感分 <span className={company.score >= 70 ? 'text-success-400' : company.score >= 50 ? 'text-warning-400' : 'text-danger-400'}>{company.score}</span>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1 flex-shrink-0">
                                    <span className="text-[10px] text-success-400">{company.positive}正面</span>
                                    <span className="text-[10px] text-danger-400">{company.negative}负面</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dark-700/20">
                                  <div className="flex items-center gap-1.5 text-[10px] text-dark-500">
                                    <Link2 className="w-3 h-3" />
                                    <span>关联预警 {Math.floor(Math.random()*3)+1} 条</span>
                                  </div>
                                  <button className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-0.5">
                                    下钻分析 <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>

                      <Card>
                        <Card.Header>
                          <Card.Title className="text-sm">舆情-财务联动提示</Card.Title>
                          <Tag variant="warning">
                            <AlertTriangle className="w-3 h-3 mr-1" />需关注
                          </Tag>
                        </Card.Header>
                        <Card.Body className="py-2.5">
                          <div className="p-3 rounded-lg bg-warning-500/5 border border-warning-500/20">
                            <div className="flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-warning-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-warning-300">
                                  碧桂园负面舆情环比上升 42%，建议同步核查财报异动
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <button
                                    onClick={() => navigate('/monitoring')}
                                    className="text-[10px] px-2.5 py-1 rounded bg-warning-500/10 text-warning-400 hover:bg-warning-500/20 transition-colors"
                                  >
                                    → 跳转财报异动监测
                                  </button>
                                  <button
                                    onClick={() => navigate('/finance')}
                                    className="text-[10px] px-2.5 py-1 rounded bg-dark-700/50 text-dark-300 hover:bg-dark-700 transition-colors"
                                  >
                                    → 查看财务数据
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  )}

                  {dimensionView === 'region' && (
                    <div className="space-y-4">
                      <Card>
                        <Card.Header>
                          <Card.Title className="text-sm">区域舆情分布</Card.Title>
                          <div className="flex items-center gap-2">
                            <select
                              value={regionFilter}
                              onChange={(e) => setRegionFilter(e.target.value)}
                              className="text-[10px] bg-dark-800/50 border border-dark-700/50 rounded px-2 py-1 text-dark-300 focus:outline-none"
                            >
                              <option value="all">全部区域</option>
                              {regionSentimentData.map(r => (
                                <option key={r.name} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                            <Tag variant="outline">7大区域</Tag>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div className="space-y-2.5">
                            {regionSentimentData.map((region) => {
                              const posRate = (region.positive / region.total) * 100;
                              const negRate = (region.negative / region.total) * 100;
                              return (
                              <div 
                                key={region.name}
                                className="p-2.5 rounded-lg bg-dark-800/30 border border-dark-700/30 hover:border-brand-500/30 cursor-pointer transition-all group"
                                onClick={() => { setRegionFilter(region.name); }}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">{region.name}</span>
                                    <span className="text-[10px] text-dark-500 font-mono">{region.total}篇</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px]">
                                    <span className="text-success-400">正面 {(region.positive/region.total*100).toFixed(0)}%</span>
                                    <span className="text-danger-400">负面 {(region.negative/region.total*100).toFixed(0)}%</span>
                                  </div>
                                </div>
                                <div className="h-2 rounded-full bg-dark-700 overflow-hidden flex">
                                  <div className="h-full bg-success-500" style={{ width: `${posRate}%` }} />
                                  <div className="h-full bg-dark-500" style={{ width: `${100 - posRate - negRate}%` }} />
                                  <div className="h-full bg-danger-500" style={{ width: `${negRate}%` }} />
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-dark-500">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    覆盖房企 {Math.floor(Math.random()*20)+10}家
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    在管项目 {Math.floor(Math.random()*200)+80}个
                                  </span>
                                  <button className="text-brand-400 hover:text-brand-300 ml-auto flex items-center gap-0.5">
                                    区域下钻 <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )})}
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'list' && (
                <div className="space-y-2">
                  {(activeHotKeyword || searchKeyword) && (
                    <div className="p-3 rounded-xl bg-warning-500/10 border border-warning-500/30 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-warning-500" />
                        <span className="text-xs text-warning-300">
                          {activeHotKeyword && <>关键词筛选: <Tag variant="warning" size="sm">#{activeHotKeyword}</Tag> </>}
                          {searchKeyword && <>文本搜索: <span className="font-mono text-warning-400">{searchKeyword}</span></>}
                          <span className="text-warning-500/70 ml-2">共匹配 {filteredNews.length} 条报道</span>
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveHotKeyword(null);
                          setSearchKeyword('');
                        }}
                        className="text-xs text-warning-400 hover:text-warning-300"
                      >
                        清除筛选
                      </button>
                    </div>
                  )}
                  {filteredNews.map((news) => (
                    <div
                      key={news.id}
                      onClick={() => setSelectedNews(news)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedNews?.id === news.id
                          ? 'bg-brand-500/10 border border-brand-500/30'
                          : 'bg-dark-800/30 border border-dark-700/30 hover:border-dark-600/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 flex flex-col items-center gap-2">
                          {getSentimentTag(news.sentiment)}
                          <div className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                            news.sourceLevel === 'national' ? 'bg-purple-500/20 text-purple-400' :
                            news.sourceLevel === 'provincial' ? 'bg-brand-500/20 text-brand-400' :
                            news.sourceLevel === 'city' ? 'bg-success-500/20 text-success-400' :
                            news.sourceLevel === 'industry' ? 'bg-warning-500/20 text-warning-400' :
                            'bg-dark-700 text-dark-400'
                          }`}>
                            {getSourceLevelText(news.sourceLevel)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white hover:text-brand-400 transition-colors line-clamp-2">
                            {news.title}
                          </h3>
                          <p className="text-xs text-dark-400 mt-1.5 line-clamp-2">
                            {news.summary}
                          </p>
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-dark-500">{news.source}</span>
                              {activeHotKeyword && (news.keywords.includes(activeHotKeyword) || news.title.includes(activeHotKeyword)) && (
                                <Tag variant="primary" size="sm">匹配关键词</Tag>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-dark-500">信源权威度</span>
                              {getAuthorityStars(news.sourceAuthority)}
                              <span className="text-[10px] text-dark-500 font-mono ml-1">{(news.sourceAuthority / 20).toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-dark-500 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatNumber(news.readCount)}
                            </span>
                            <span className="text-[10px] text-dark-500">情感置信度 {Math.abs(news.sentimentScore * 100).toFixed(0)}%</span>
                            <span className="text-xs text-dark-500">{news.publishDate.split(' ')[0]}</span>
                          </div>
                          {news.keywords.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {news.keywords.slice(0, 4).map((kw, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveHotKeyword(kw);
                                  }}
                                  className={`cursor-pointer ${
                                    activeHotKeyword === kw
                                      ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                                      : ''
                                  }`}
                                >
                                  <Tag 
                                    key={i} 
                                    variant={activeHotKeyword === kw ? 'primary' : 'outline'} 
                                    size="sm"
                                  >
                                    #{kw}
                                  </Tag>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronRight className={`w-5 h-5 flex-shrink-0 mt-1 ${
                          selectedNews?.id === news.id ? 'text-brand-400' : 'text-dark-600'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'keywords' && (
                <div className="space-y-4">
                  {activeHotKeyword && (
                    <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Tag variant="primary">#{activeHotKeyword}</Tag>
                          <span className="text-xs text-dark-400">当前筛选关键词</span>
                        </div>
                        <button
                          onClick={() => {
                            setActiveHotKeyword(null);
                            setActiveTab('list');
                          }}
                          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                        >
                          查看匹配新闻 <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="p-2.5 rounded-lg bg-dark-800/50 text-center">
                          <p className="text-lg font-bold text-white font-mono">{mockNews.filter(n => n.keywords.includes(activeHotKeyword) || n.title.includes(activeHotKeyword)).length}</p>
                          <p className="text-[10px] text-dark-500">关联报道</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-success-500/10 text-center">
                          <p className="text-lg font-bold text-success-500 font-mono">
                            {Math.round(mockNews.filter(n => (n.keywords.includes(activeHotKeyword) || n.title.includes(activeHotKeyword)) && n.sentiment === 'positive').length / Math.max(mockNews.filter(n => n.keywords.includes(activeHotKeyword) || n.title.includes(activeHotKeyword)).length, 1) * 100)}%
                          </p>
                          <p className="text-[10px] text-dark-500">正面占比</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-danger-500/10 text-center">
                          <p className="text-lg font-bold text-danger-500 font-mono">
                            {Math.round(mockNews.filter(n => (n.keywords.includes(activeHotKeyword) || n.title.includes(activeHotKeyword)) && n.sentiment === 'negative').length / Math.max(mockNews.filter(n => n.keywords.includes(activeHotKeyword) || n.title.includes(activeHotKeyword)).length, 1) * 100)}%
                          </p>
                          <p className="text-[10px] text-dark-500">负面占比</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-purple-500/10 text-center">
                          <p className="text-lg font-bold text-purple-400 font-mono">
                            {(() => {
                              const relevant = mockNews.filter(n => n.keywords.includes(activeHotKeyword) || n.title.includes(activeHotKeyword));
                              const avg = relevant.length > 0 
                                ? Math.round(relevant.reduce((sum, n) => sum + n.sourceAuthority, 0) / relevant.length / 20)
                                : 0;
                              return `★${avg}`;
                            })()}
                          </p>
                          <p className="text-[10px] text-dark-500">信源权威</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-dark-700/50">
                        <p className="text-[10px] text-dark-500 mb-1.5">信源权威度分布</p>
                        <div className="flex items-center gap-1">
                          {['national', 'provincial', 'city', 'industry', 'self-media'].map((level) => {
                            const count = mockNews.filter(n => 
                              (n.keywords.includes(activeHotKeyword) || n.title.includes(activeHotKeyword)) && 
                              n.sourceLevel === level
                            ).length;
                            const total = Math.max(mockNews.filter(n => n.keywords.includes(activeHotKeyword) || n.title.includes(activeHotKeyword)).length, 1);
                            return (
                              <div key={level} className="flex-1 text-center">
                                <div className="h-1.5 rounded-full bg-dark-700 overflow-hidden mb-1">
                                  <div
                                    className={`h-full ${
                                      level === 'national' ? 'bg-purple-500' :
                                      level === 'provincial' ? 'bg-brand-500' :
                                      level === 'city' ? 'bg-success-500' :
                                      level === 'industry' ? 'bg-warning-500' : 'bg-dark-500'
                                    }`}
                                    style={{ width: `${(count / total) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-dark-500">{getSourceLevelText(level as SourceLevel)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <Card>
                    <Card.Header>
                      <Card.Title className="text-sm">热门关键词</Card.Title>
                      <div className="flex items-center gap-2">
                        {activeHotKeyword && (
                          <button
                            onClick={() => setActiveHotKeyword(null)}
                            className="text-xs text-dark-400 hover:text-white"
                          >
                            清除筛选
                          </button>
                        )}
                        <Tag variant="outline">实时热度 · 点击追溯关联新闻</Tag>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <div className="space-y-2">
                        {mockHotKeywords.map((kw, index) => {
                          const relatedNews = mockNews.filter(n => n.keywords.includes(kw.keyword) || n.title.includes(kw.keyword));
                          const posCount = relatedNews.filter(n => n.sentiment === 'positive').length;
                          const negCount = relatedNews.filter(n => n.sentiment === 'negative').length;
                          const avgAuth = relatedNews.length > 0 
                            ? Math.round(relatedNews.reduce((sum, n) => sum + n.sourceAuthority, 0) / relatedNews.length)
                            : 0;
                          return (
                            <div
                              key={index}
                              onClick={() => {
                                setActiveHotKeyword(activeHotKeyword === kw.keyword ? null : kw.keyword);
                                if (activeHotKeyword !== kw.keyword) {
                                  setSearchKeyword('');
                                }
                              }}
                              className={`p-3 rounded-xl cursor-pointer transition-all ${
                                activeHotKeyword === kw.keyword
                                  ? 'bg-brand-500/10 border border-brand-500/30'
                                  : 'bg-dark-800/30 border border-dark-700/30 hover:border-dark-600/50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                                    index < 3 ? 'bg-danger-500/20 text-danger-400' : 'bg-dark-700 text-dark-500'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <span className="text-sm font-medium text-white">{kw.keyword}</span>
                                  {getTrendIcon(kw.trend)}
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-dark-500">{kw.count}篇报道</span>
                                  <ChevronRight className={`w-4 h-4 ${
                                    activeHotKeyword === kw.keyword ? 'text-brand-400 rotate-90' : 'text-dark-600'
                                  } transition-transform`} />
                                </div>
                              </div>
                              
                              {activeHotKeyword === kw.keyword && (
                                <div className="mt-3 pt-3 border-t border-dark-700/50 grid grid-cols-4 gap-2">
                                  <div>
                                    <p className="text-[10px] text-dark-500 mb-1">情感倾向</p>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs text-success-500">正{posCount}</span>
                                      <span className="text-xs text-dark-600">|</span>
                                      <span className="text-xs text-danger-500">负{negCount}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-dark-500 mb-1">信源平均权威度</p>
                                    {getAuthorityStars(avgAuth)}
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-dark-500 mb-1">传播热度</p>
                                    <p className="text-xs text-brand-400 font-mono">{formatNumber(kw.count * 1250)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-dark-500 mb-1">关联企业</p>
                                    <p className="text-xs text-purple-400 font-mono">{Math.floor(index/2)+1}家</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card.Body>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <Card.Header>
                        <Card.Title className="text-sm">热度上升最快</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <div className="space-y-3">
                          {mockHotKeywords.filter(k => k.trend === 'up').slice(0, 5).map((kw, i) => (
                            <div 
                              key={i} 
                              className="flex items-center justify-between cursor-pointer hover:bg-dark-800/30 p-2 -mx-2 rounded-lg transition-colors"
                              onClick={() => {
                                setActiveHotKeyword(kw.keyword);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-danger-500" />
                                <span className="text-sm text-white">{kw.keyword}</span>
                              </div>
                              <span className="text-xs text-danger-500 font-mono">+{(kw.heat / 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                    <Card>
                      <Card.Header>
                        <Card.Title className="text-sm">热度下降</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <div className="space-y-3">
                          {mockHotKeywords.filter(k => k.trend === 'down').slice(0, 5).map((kw, i) => (
                            <div 
                              key={i} 
                              className="flex items-center justify-between cursor-pointer hover:bg-dark-800/30 p-2 -mx-2 rounded-lg transition-colors"
                              onClick={() => {
                                setActiveHotKeyword(kw.keyword);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-success-500" />
                                <span className="text-sm text-white">{kw.keyword}</span>
                              </div>
                              <span className="text-xs text-success-500 font-mono">-{(kw.heat / 80).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="w-80 flex flex-col gap-4">
          {selectedNews ? (
            <Card className="flex-1 min-h-0 flex flex-col">
              <Card.Header>
                <Card.Title className="text-sm">新闻详情</Card.Title>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="text-xs text-dark-500 hover:text-dark-300 transition-colors"
                >
                  关闭
                </button>
              </Card.Header>
              <Card.Body className="flex-1 overflow-y-auto space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getSentimentTag(selectedNews.sentiment)}
                    <Tag variant="outline">{getSourceLevelText(selectedNews.sourceLevel)}</Tag>
                  </div>
                  <h2 className="text-base font-semibold text-white">{selectedNews.title}</h2>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-dark-400">{selectedNews.source}</span>
                  <span className="text-dark-500">{selectedNews.author}</span>
                  <span className="text-dark-500">{selectedNews.publishDate}</span>
                </div>

                <div className="divider -mx-5" />

                <div className="space-y-3">
                  <p className="text-sm text-dark-300 leading-relaxed">{selectedNews.summary}</p>
                  <p className="text-sm text-dark-300 leading-relaxed">{selectedNews.content}</p>
                </div>

                <div className="divider -mx-5" />

                <div>
                  <p className="text-xs font-medium text-dark-300 mb-2">情感分析</p>
                  <div className="p-3 rounded-lg bg-dark-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-dark-400">情感倾向</span>
                      {getSentimentTag(selectedNews.sentiment)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-dark-700 overflow-hidden flex">
                        <div
                          className="h-full bg-success-500"
                          style={{ width: `${selectedNews.sentimentScore > 0 ? selectedNews.sentimentScore * 50 + 50 : 50}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-dark-500 mt-2">
                      置信度: {Math.abs(selectedNews.sentimentScore * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-dark-300 mb-2">信源评估</p>
                  <div className="p-3 rounded-lg bg-dark-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-dark-400">权威度评级</span>
                      {getAuthorityStars(selectedNews.sourceAuthority)}
                    </div>
                    <p className="text-xs text-dark-500">{selectedNews.source} - {getSourceLevelText(selectedNews.sourceLevel)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-dark-300 mb-2">传播数据</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-dark-800/30 text-center">
                      <p className="text-sm font-mono text-white">{formatNumber(selectedNews.readCount)}</p>
                      <p className="text-[10px] text-dark-500">阅读量</p>
                    </div>
                    <div className="p-2 rounded-lg bg-dark-800/30 text-center">
                      <p className="text-sm font-mono text-white">{formatNumber(selectedNews.forwardCount)}</p>
                      <p className="text-[10px] text-dark-500">转发</p>
                    </div>
                    <div className="p-2 rounded-lg bg-dark-800/30 text-center">
                      <p className="text-sm font-mono text-white">{formatNumber(selectedNews.commentCount)}</p>
                      <p className="text-[10px] text-dark-500">评论</p>
                    </div>
                  </div>
                </div>

                {selectedNews.keywords.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-dark-300 mb-2">关键词</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNews.keywords.map((kw, i) => (
                        <Tag key={i} variant="primary" size="sm">#{kw}</Tag>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNews.relatedCompaniesNames.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-dark-300 mb-2">关联企业</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNews.relatedCompaniesNames.map((name, i) => (
                        <Tag key={i} variant="outline" size="sm">{name}</Tag>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" icon={<Share2 className="w-3.5 h-3.5" />}>
                    分享
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    收藏
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Newspaper className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400">选择新闻查看详情</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
