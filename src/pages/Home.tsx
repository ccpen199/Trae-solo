import { useState, useMemo } from 'react';
import { Building2, TrendingUp, AlertTriangle, Newspaper, ArrowRight, Zap, Database, Network, BarChart3, User, MapPin, Link2, Clock, CheckCircle2, AlertCircle, Settings, Filter, Star, ChevronDown, Target, TrendingDown } from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { LineChart } from '../components/charts/LineChart';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { mockCompanies } from '../data/companies';
import { mockNews, mockHotKeywords } from '../data/sentiment';
import { mockAlertStats, mockAlerts, mockAlertThresholds } from '../data/monitoring';
import { mockProjects } from '../data/projects';
import { formatNumber, formatMoney, formatRate } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import type { Company } from '../types/company';
import type { Alert } from '../types/monitoring';
import type { SourceLevel } from '../types/sentiment';

export default function Home() {
  const navigate = useNavigate();
  const { setSelectedCompany, setFinanceContext } = useAppStore();
  const [selectedHomeCompany, setSelectedHomeCompany] = useState<Company | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [dashboardTab, setDashboardTab] = useState('overview');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [xSearchView, setXSearchView] = useState<'grid' | 'table' | 'rank'>('grid');

  const salesTrendData = {
    xAxis: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    series: [
      {
        name: 'TOP100销售金额',
        data: [5230, 4560, 5890, 6230, 5780, 6120, 6450, 5980, 5650, 6120, 6780, 7230],
        color: '#3B82F6',
        areaStyle: true,
      },
      {
        name: 'TOP100销售面积',
        data: [3850, 3320, 4280, 4560, 4210, 4450, 4680, 4320, 4100, 4450, 4920, 5280],
        color: '#10B981',
        areaStyle: true,
      },
    ],
  };

  const topCompanies = mockCompanies.slice(0, 8).map(c => ({
    name: c.shortName,
    value: 4850 - c.rank! * 350 + Math.random() * 200,
  }));

  const companyRankData = {
    xAxis: topCompanies.map(c => c.name),
    series: [
      {
        name: '销售额(亿元)',
        data: topCompanies.map(c => Math.round(c.value)),
        color: '#3B82F6',
      },
    ],
  };

  const latestNews = mockNews.slice(0, 5);
  const highAlerts = mockAlerts.filter(a => a.level === 'high').slice(0, 3);

  const allRegions = ['all', '华东', '华南', '华北', '西南', '华中', '西北', '东北'];
  const allTypes = ['all', 'state-owned', 'private', 'mixed'];
  const allStages = ['all', 'land-acquisition', 'construction', 'sales', 'delivery'];
  const allPartners = ['all', '中国建筑', '万科物业', '金螳螂', '广田集团', '亚厦股份'];
  
  const filteredCompanies = useMemo(() => {
    let result = mockCompanies.slice();
    
    if (regionFilter !== 'all') {
      result = result.filter(c => c.headquarters?.includes(regionFilter));
    }
    
    if (typeFilter !== 'all') {
      result = result.filter(c => c.type === typeFilter);
    }
    
    if (stageFilter !== 'all') {
      result = result.filter(c => {
        const companyProjects = mockProjects.filter(p => p.companyId === c.id);
        return companyProjects.some(p => 
          p.stages.some(s => s.type === stageFilter && s.status !== 'not-started')
        );
      });
    }
    
    return result.slice(0, 8);
  }, [regionFilter, typeFilter, stageFilter, partnerFilter]);
  
  const xSearchStats = useMemo(() => {
    const companies = filteredCompanies;
    const totalRevenue = companies.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const totalProjects = companies.reduce((sum, c) => 
      sum + mockProjects.filter(p => p.companyId === c.id).length, 0
    );
    const avgDebtRatio = companies.length 
      ? companies.reduce((sum, c) => sum + (c.debtRatio || 65), 0) / companies.length 
      : 0;
    return { totalRevenue, totalProjects, avgDebtRatio, companyCount: companies.length };
  }, [filteredCompanies]);

  const handleCompanyDrill = (company: Company, target: 'finance' | 'relationship' | 'projects' | 'supply-chain') => {
    setSelectedCompany(company);
    setSelectedHomeCompany(company);
    
    if (target === 'finance') {
      setFinanceContext({ companyId: company.id, source: 'home' });
    }
    
    const paths: Record<string, string> = {
      'finance': '/finance',
      'relationship': '/relationship',
      'projects': '/projects',
      'supply-chain': '/supply-chain',
    };
    navigate(paths[target]);
  };

  const getSourceLevelTag = (level: SourceLevel) => {
    switch (level) {
      case 'national': return <Tag variant="purple" size="sm">国家级</Tag>;
      case 'provincial': return <Tag variant="primary" size="sm">省级</Tag>;
      case 'city': return <Tag variant="success" size="sm">城市级</Tag>;
      case 'industry': return <Tag variant="warning" size="sm">行业</Tag>;
      default: return <Tag variant="outline" size="sm">自媒体</Tag>;
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

  const getAlertThreshold = (alert: Alert) => {
    const matching = mockAlertThresholds.find(t => 
      alert.title.includes(t.metricName) || alert.description.includes(t.metricName)
    );
    return matching;
  };

  const quickEntries = [
    { 
      icon: Network, 
      label: '人物关系', 
      desc: '高管任职/股权穿透', 
      path: '/relationship', 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10',
      metric: mockProjects.length,
      metricLabel: '条关系链'
    },
    { 
      icon: BarChart3, 
      label: '财务分析', 
      desc: '财报/债券/土储', 
      path: '/finance', 
      color: 'text-brand-500', 
      bg: 'bg-brand-500/10',
      metric: mockCompanies.length,
      metricLabel: '家房企'
    },
    { 
      icon: Building2, 
      label: '项目追踪', 
      desc: '全周期进度', 
      path: '/projects', 
      color: 'text-success-500', 
      bg: 'bg-success-500/10',
      metric: '8.6万',
      metricLabel: '个在建'
    },
    { 
      icon: Database, 
      label: '供应链库', 
      desc: '供应商/合作关系', 
      path: '/supply-chain', 
      color: 'text-warning-500', 
      bg: 'bg-warning-500/10',
      metric: mockProjects.length * 12,
      metricLabel: '家供应商'
    },
  ];

  const dashboardMetrics = [
    { key: 'sales', label: '销售额', value: '7.23万亿', change: 3.2, changeLabel: '同比' },
    { key: 'area', label: '销售面积', value: '5.68亿㎡', change: -2.1, changeLabel: '同比' },
    { key: 'price', label: '均价', value: '12729元/㎡', change: 5.4, changeLabel: '同比' },
    { key: 'inventory', label: '去化周期', value: '14.8月', change: -8.3, changeLabel: '环比' },
  ];

  const getSentimentTag = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Tag variant="success">正面</Tag>;
      case 'negative':
        return <Tag variant="danger">负面</Tag>;
      default:
        return <Tag variant="default">中性</Tag>;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-danger-500';
      case 'medium': return 'bg-warning-500';
      case 'low': return 'bg-brand-500';
      default: return 'bg-dark-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">数据概览</h1>
          <p className="text-sm text-dark-400 mt-1">房地产行业全景数据，实时洞察市场动态</p>
        </div>
        <div className="flex items-center gap-3">
          <Tag variant="primary">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse mr-1.5" />
            数据实时更新
          </Tag>
          <span className="text-xs text-dark-500">2024-01-15</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <MetricCard
          title="收录房企"
          value={12580}
          change={2.3}
          changeLabel="环比"
          icon={<Building2 className="w-6 h-6 text-brand-400" />}
          iconBg="bg-brand-500/20"
          showSparkline={true}
          sparklineData={[11800, 11950, 12100, 12250, 12380, 12480, 12580]}
          color="brand"
          onClick={() => navigate('/finance')}
        />
        <MetricCard
          title="在建项目"
          value={86520}
          change={-1.8}
          changeLabel="环比"
          icon={<Zap className="w-6 h-6 text-purple-400" />}
          iconBg="bg-purple-500/20"
          showSparkline={true}
          sparklineData={[88200, 87900, 87500, 87200, 86900, 86700, 86520]}
          color="purple"
          onClick={() => navigate('/projects')}
        />
        <MetricCard
          title="今日舆情"
          value={3586}
          change={12.5}
          changeLabel="环比"
          icon={<Newspaper className="w-6 h-6 text-success-500" />}
          iconBg="bg-success-500/20"
          showSparkline={true}
          sparklineData={[3120, 3080, 3350, 3280, 3220, 3420, 3586]}
          color="success"
          onClick={() => navigate('/sentiment')}
        />
        <MetricCard
          title="风险预警"
          value={mockAlertStats.total}
          change={8.5}
          changeLabel="环比"
          icon={<AlertTriangle className="w-6 h-6 text-warning-500" />}
          iconBg="bg-warning-500/20"
          showSparkline={true}
          sparklineData={[8, 9, 10, 11, 10, 12, mockAlertStats.total]}
          color="warning"
          onClick={() => navigate('/monitoring')}
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2">
          <Card.Header>
            <Card.Title>百强房企销售趋势</Card.Title>
            <div className="flex items-center gap-2">
              <Tag variant="primary">年度对比</Tag>
              <button className="text-xs text-dark-400 hover:text-brand-400 transition-colors flex items-center gap-1">
                查看详情 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card.Header>
          <Card.Body>
            <LineChart data={salesTrendData} height={280} showLegend yAxisName="亿元" />
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>房企销售TOP8</Card.Title>
            <Tag variant="outline">2023年</Tag>
          </Card.Header>
          <Card.Body>
            <BarChart data={companyRankData} horizontal height={280} showLegend={false} />
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card>
          <Card.Header>
            <Card.Title>功能入口</Card.Title>
            <Tag variant="outline">点击下钻</Tag>
          </Card.Header>
          <Card.Body>
            <div className="space-y-2.5">
              {quickEntries.map((entry, index) => {
                const Icon = entry.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(entry.path)}
                    className="w-full p-3.5 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-brand-500/30 hover:bg-dark-800/50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${entry.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${entry.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">
                            {entry.label}
                          </p>
                          <span className={`text-[10px] font-mono font-bold ${entry.color} bg-dark-800/60 px-1.5 py-0.5 rounded`}>
                            {entry.metric}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs text-dark-500">{entry.desc}</span>
                          <span className="text-xs text-dark-600">·</span>
                          <span className="text-xs text-dark-400">{entry.metricLabel}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-dark-600 group-hover:text-brand-400 flex-shrink-0 transition-colors" />
                    </div>
                    {selectedHomeCompany && (
                      <div className="mt-3 pt-3 border-t border-dark-700/30 grid grid-cols-4 gap-1.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCompanyDrill(selectedHomeCompany, entry.path.slice(1) as any); }}
                          className="text-[10px] py-1.5 px-2 rounded bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors"
                        >
                          续查{selectedHomeCompany.shortName}
                        </button>
                        <div className="col-span-3 text-[10px] text-dark-500 flex items-center gap-1">
                          <User className="w-3 h-3" /> 高管 {Math.floor(Math.random()*8)+3}人
                          <span className="text-dark-700">|</span>
                          <Building2 className="w-3 h-3" /> 项目 {Math.floor(Math.random()*30)+10}个
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card.Body>
        </Card>

        <Card className="col-span-2">
          <Card.Header>
            <Card.Title>最新资讯</Card.Title>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-dark-500">信源:</span>
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-dark-400">国家</span>
                <span className="w-2 h-2 rounded-full bg-brand-500 ml-1.5" />
                <span className="text-dark-400">省级</span>
                <span className="w-2 h-2 rounded-full bg-success-500 ml-1.5" />
                <span className="text-dark-400">城市</span>
              </div>
              <button 
                onClick={() => navigate('/sentiment')}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
              >
                查看全部 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card.Header>
          <Card.Body className="py-3">
            <div className="space-y-1">
              {latestNews.map((news) => {
                const relatedCompany = mockCompanies.find(c => 
                  news.title.includes(c.shortName) || news.keywords.some(k => c.shortName.includes(k))
                );
                const relatedAlert = mockAlerts.find(a => 
                  news.title.includes(a.companyName || '') || news.keywords.some(k => a.title.includes(k))
                );
                return (
                <div
                  key={news.id}
                  onClick={() => navigate('/sentiment')}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-dark-800/50 cursor-pointer transition-colors group"
                >
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    {getSentimentTag(news.sentiment)}
                    {getSourceLevelTag(news.sourceLevel as SourceLevel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-brand-400 transition-colors">
                      {news.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-dark-500">{news.source}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-dark-500">权威度</span>
                        {getAuthorityStars(news.sourceAuthority)}
                        <span className="text-[10px] text-dark-600 font-mono ml-1">{(news.sourceAuthority/20).toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-dark-600">
                        {formatNumber(news.readCount)} 阅读
                      </span>
                      {relatedCompany && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCompanyDrill(relatedCompany, 'finance'); }}
                          className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors flex items-center gap-1"
                        >
                          <Building2 className="w-2.5 h-2.5" /> {relatedCompany.shortName}
                        </button>
                      )}
                      {relatedAlert && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/monitoring'); }}
                          className="text-[10px] px-2 py-0.5 rounded bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 transition-colors flex items-center gap-1"
                        >
                          <AlertTriangle className="w-2.5 h-2.5" /> 关联预警
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-dark-500 flex-shrink-0">
                    {news.publishDate.split(' ')[0]}
                  </span>
                </div>
              )})}
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card>
          <Card.Header>
            <Card.Title>高风险预警</Card.Title>
            <div className="flex items-center gap-2">
              <Tag variant="outline" size="sm">阈值规则: {mockAlertThresholds.filter(t => t.enabled).length}条运行</Tag>
              <Tag variant="danger">{highAlerts.length} 条</Tag>
            </div>
          </Card.Header>
          <Card.Body className="py-3">
            <div className="space-y-3">
              {highAlerts.map((alert) => {
                const threshold = getAlertThreshold(alert);
                const isExpanded = expandedAlertId === alert.id;
                return (
                <div
                  key={alert.id}
                  className="rounded-lg bg-dark-800/30 border border-dark-700/30 hover:border-danger-500/30 transition-all"
                >
                  <div 
                    onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                    className="p-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${getLevelColor(alert.level)} flex-shrink-0 mt-1.5 animate-pulse`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white group-hover:text-danger-400 transition-colors">
                            {alert.title}
                          </p>
                          {threshold && (
                            <Tag variant="outline" size="sm">
                              {threshold.direction === 'up' ? '↑' : '↓'} 阈值 {(threshold.unit === '%' ? `${(threshold.highThreshold*100).toFixed(0)}%` : `${threshold.highThreshold/100000000}亿`)}
                            </Tag>
                          )}
                        </div>
                        <p className="text-xs text-dark-400 mt-1 line-clamp-2">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-[10px] text-danger-400 font-medium">{alert.companyName}</span>
                          {threshold && (
                            <span className="text-[10px] text-dark-500 flex items-center gap-1">
                              <Settings className="w-2.5 h-2.5" />
                              规则: {threshold.metricName}
                            </span>
                          )}
                          <span className={`text-[10px] flex items-center gap-1 ${
                            alert.status === 'unread' ? 'text-danger-400' :
                            alert.status === 'read' ? 'text-warning-400' : 'text-success-400'
                          }`}>
                            {alert.status === 'unread' ? <AlertCircle className="w-2.5 h-2.5" /> : 
                             alert.status === 'read' ? <Clock className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                            {alert.status === 'unread' ? '未读' : alert.status === 'read' ? '处理中' : '已处置'}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-dark-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-dark-700/30 mt-2 pt-3">
                      {threshold && (
                        <div className="p-2.5 rounded-lg bg-dark-800/60 mb-2.5">
                          <p className="text-[10px] font-medium text-dark-300 mb-2">📐 阈值口径与规则状态</p>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-dark-500">指标:</span>
                              <span className="text-white ml-1">{threshold.metricName}</span>
                            </div>
                            <div>
                              <span className="text-dark-500">单位:</span>
                              <span className="text-white ml-1">{threshold.unit}</span>
                            </div>
                            <div>
                              <span className="text-dark-500">触发方向:</span>
                              <span className="text-brand-400 ml-1">{threshold.direction === 'up' ? '超过阈值' : '低于阈值'}</span>
                            </div>
                            <div>
                              <span className="text-dark-500">当前值:</span>
                              <span className="text-danger-400 ml-1 font-mono">
                                {threshold.unit === '%' ? `${(parseFloat(alert.description)||0).toFixed(1)}%` : `${formatMoney(parseFloat(alert.description)||0)}`}
                              </span>
                            </div>
                            <div>
                              <span className="text-dark-500">阈值上限:</span>
                              <span className="text-warning-400 ml-1 font-mono">
                                {threshold.unit === '%' ? `${(threshold.highThreshold*100).toFixed(0)}%` : `${formatMoney(threshold.highThreshold)}`}
                              </span>
                            </div>
                            <div>
                              <span className="text-dark-500">规则状态:</span>
                              <span className={`ml-1 ${threshold.enabled ? 'text-success-400' : 'text-dark-500'}`}>
                                {threshold.enabled ? '● 运行中' : '○ 已暂停'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <div>
                          <p className="text-[10px] font-medium text-dark-300 mb-1.5">⏱️ 处置进度</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-dark-700 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-danger-500 via-warning-500 to-brand-500"
                                style={{ width: `${alert.status === 'processed' ? 100 : alert.status === 'read' ? 45 : 10}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-dark-400 font-mono">
                              {alert.status === 'processed' ? '100%' : alert.status === 'read' ? '45%' : '10%'}
                            </span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[9px] text-dark-600">触发</span>
                            <span className="text-[9px] text-dark-600">分发</span>
                            <span className="text-[9px] text-dark-600">核实</span>
                            <span className="text-[9px] text-dark-600">处置</span>
                            <span className="text-[9px] text-dark-600">复查</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium text-dark-300 mb-1.5">📋 复查记录</p>
                          <div className="space-y-1.5">
                            <div className="p-2 rounded bg-dark-800/40 flex items-start gap-2">
                              <CheckCircle2 className="w-3 h-3 text-success-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] text-dark-300">首次数据核验 · 财务数据与公告一致</p>
                                <p className="text-[9px] text-dark-500 mt-0.5">张经理 · 2024-01-14 14:30</p>
                              </div>
                            </div>
                            <div className="p-2 rounded bg-dark-800/40 flex items-start gap-2">
                              <Clock className="w-3 h-3 text-warning-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] text-dark-300">待现场尽调 · 预约本周三走访项目现场</p>
                                <p className="text-[9px] text-dark-500 mt-0.5">李总监 · 待处理</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/monitoring'); }}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-brand-500/10 text-brand-400 text-[10px] font-medium hover:bg-brand-500/20 transition-colors"
                        >
                          查看完整处置链路
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCompanyDrill(mockCompanies.find(c => c.shortName === alert.companyName) || mockCompanies[0], 'finance'); }}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-dark-700/50 text-dark-300 text-[10px] font-medium hover:bg-dark-700 transition-colors"
                        >
                          追溯企业财务
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          </Card.Body>
          <Card.Footer>
            <button 
              onClick={() => navigate('/monitoring')}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 w-full justify-center"
            >
              查看全部预警 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Card.Footer>
        </Card>

        <Card className="col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Card.Title>多维度交叉检索</Card.Title>
                <Tag variant="primary">
                  <Target className="w-3 h-3 mr-1" />
                  投研筛选
                </Tag>
                {selectedHomeCompany && (
                  <Tag variant="success" size="sm">
                    已选: {selectedHomeCompany.shortName}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedHomeCompany(null); setSelectedCompany(null); }}
                      className="ml-1.5 hover:text-white"
                    >
                      ×
                    </button>
                  </Tag>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 bg-dark-800/50 rounded-lg p-0.5">
                  {(['grid', 'table', 'rank'] as const).map(view => (
                    <button
                      key={view}
                      onClick={() => setXSearchView(view)}
                      className={`px-2.5 py-1 text-[10px] rounded-md transition-all ${
                        xSearchView === view
                          ? 'bg-brand-500/20 text-brand-400'
                          : 'text-dark-500 hover:text-dark-300'
                      }`}
                    >
                      {view === 'grid' ? '卡片' : view === 'table' ? '列表' : '排行'}
                    </button>
                  ))}
                </div>
                <Tag variant="outline" size="sm">{filteredCompanies.length}家匹配</Tag>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3.5">
              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] text-dark-500 mb-1.5 block flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> 区域
                  </label>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full h-7 px-2 text-xs bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50"
                  >
                    {allRegions.map(r => (
                      <option key={r} value={r}>{r === 'all' ? '全部区域' : r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-dark-500 mb-1.5 block flex items-center gap-1">
                    <Building2 className="w-2.5 h-2.5" /> 企业性质
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full h-7 px-2 text-xs bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50"
                  >
                    <option value="all">全部性质</option>
                    <option value="state-owned">国企</option>
                    <option value="private">民企</option>
                    <option value="mixed">混合所有制</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-dark-500 mb-1.5 block flex items-center gap-1">
                    <Home className="w-2.5 h-2.5" /> 项目节点
                  </label>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full h-7 px-2 text-xs bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50"
                  >
                    <option value="all">全部阶段</option>
                    <option value="land-acquisition">拿地阶段</option>
                    <option value="construction">开工建设</option>
                    <option value="sales">在售阶段</option>
                    <option value="delivery">已交付</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-dark-500 mb-1.5 block flex items-center gap-1">
                    <Link2 className="w-2.5 h-2.5" /> 核心合作方
                  </label>
                  <select
                    value={partnerFilter}
                    onChange={(e) => setPartnerFilter(e.target.value)}
                    className="w-full h-7 px-2 text-xs bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50"
                  >
                    {allPartners.map(p => (
                      <option key={p} value={p}>{p === 'all' ? '全部合作方' : p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-brand-500/10 to-transparent border border-brand-500/20">
                  <p className="text-[10px] text-dark-500">匹配房企</p>
                  <p className="text-lg font-bold text-white font-mono mt-0.5">{xSearchStats.companyCount}家</p>
                  <p className="text-[9px] text-dark-500 mt-0.5">占总量 {(xSearchStats.companyCount / mockCompanies.length * 100).toFixed(1)}%</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-success-500/10 to-transparent border border-success-500/20">
                  <p className="text-[10px] text-dark-500">累计销售额</p>
                  <p className="text-lg font-bold text-white font-mono mt-0.5">{formatMoney(xSearchStats.totalRevenue)}</p>
                  <p className="text-[9px] text-success-500 mt-0.5">行业集中度 ↑</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                  <p className="text-[10px] text-dark-500">在管项目</p>
                  <p className="text-lg font-bold text-white font-mono mt-0.5">{xSearchStats.totalProjects}个</p>
                  <p className="text-[9px] text-purple-400 mt-0.5">在建 + 在售</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-warning-500/10 to-transparent border border-warning-500/20">
                  <p className="text-[10px] text-dark-500">平均负债率</p>
                  <p className="text-lg font-bold text-white font-mono mt-0.5">{xSearchStats.avgDebtRatio.toFixed(1)}%</p>
                  <p className="text-[9px] text-warning-400 mt-0.5">高于60%预警线</p>
                </div>
              </div>

              {xSearchView === 'grid' && (
                <div className="grid grid-cols-4 gap-2.5 mt-1">
                  {filteredCompanies.map((company, index) => {
                    const companyProjects = mockProjects.filter(p => p.companyId === company.id);
                    const isSelected = selectedHomeCompany?.id === company.id;
                    return (
                    <div
                      key={company.id}
                      className={`p-3 rounded-xl cursor-pointer transition-all group relative ${
                        isSelected
                          ? 'bg-brand-500/10 border-2 border-brand-500/50'
                          : 'bg-dark-800/30 border border-dark-700/30 hover:border-brand-500/30 hover:bg-dark-800/50'
                      }`}
                    >
                      <div 
                        className="relative"
                        onClick={() => {
                          setSelectedHomeCompany(isSelected ? null : company);
                          setSelectedCompany(isSelected ? null : company);
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-lg border border-dark-600/50">
                              {company.logo}
                            </div>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-dark-900 border border-dark-600 rounded-full text-[9px] font-bold text-brand-400 flex items-center justify-center">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate group-hover:text-brand-400 transition-colors">
                              {company.shortName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Tag variant={company.type === 'state-owned' ? 'primary' : company.type === 'private' ? 'success' : 'warning'} size="xs">
                                {company.type === 'state-owned' ? '国企' : company.type === 'private' ? '民企' : '混合'}
                              </Tag>
                              <span className="text-[9px] text-dark-500 font-mono">{formatMoney(company.revenue || 0)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dark-700/30">
                          <div className="text-[9px] text-dark-500">
                            <span className="text-brand-400 font-mono">{companyProjects.length}</span> 项目
                          </div>
                          <div className="text-[9px] text-dark-500">
                            <span className="text-warning-400 font-mono">{company.debtRatio || 65}%</span> 负债
                          </div>
                          <div className="text-[9px] text-dark-500">
                            <span className="text-purple-400 font-mono">{Math.floor(Math.random()*8)+3}</span> 高管
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 pt-2.5 border-t border-dark-700/30 space-y-1.5">
                          <div className="grid grid-cols-4 gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCompanyDrill(company, 'finance'); }}
                              className="text-[9px] py-1.5 rounded bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors"
                            >
                              财务
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCompanyDrill(company, 'relationship'); }}
                              className="text-[9px] py-1.5 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                            >
                              关系
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCompanyDrill(company, 'projects'); }}
                              className="text-[9px] py-1.5 rounded bg-success-500/10 text-success-400 hover:bg-success-500/20 transition-colors"
                            >
                              项目
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCompanyDrill(company, 'supply-chain'); }}
                              className="text-[9px] py-1.5 rounded bg-warning-500/10 text-warning-400 hover:bg-warning-500/20 transition-colors"
                            >
                              供应链
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              )}

              {xSearchView === 'table' && (
                <div className="mt-1 rounded-lg overflow-hidden border border-dark-700/30">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-dark-800/50 text-dark-400 text-[10px]">
                        <th className="text-left py-2 px-3 font-medium">排名</th>
                        <th className="text-left py-2 px-3 font-medium">企业名称</th>
                        <th className="text-left py-2 px-3 font-medium">性质</th>
                        <th className="text-right py-2 px-3 font-medium">销售额</th>
                        <th className="text-right py-2 px-3 font-medium">项目数</th>
                        <th className="text-right py-2 px-3 font-medium">负债率</th>
                        <th className="text-center py-2 px-3 font-medium">区域</th>
                        <th className="text-center py-2 px-3 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompanies.map((company, index) => (
                        <tr 
                          key={company.id} 
                          className="border-t border-dark-700/20 hover:bg-dark-800/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-[10px] text-dark-500">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{company.logo}</span>
                              <span className="text-white font-medium">{company.shortName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <Tag variant={company.type === 'state-owned' ? 'primary' : company.type === 'private' ? 'success' : 'warning'} size="xs">
                              {company.type === 'state-owned' ? '国企' : company.type === 'private' ? '民企' : '混合'}
                            </Tag>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-brand-400">{formatMoney(company.revenue || 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-purple-400">
                            {mockProjects.filter(p => p.companyId === company.id).length}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-warning-400">
                            {company.debtRatio || 65}%
                          </td>
                          <td className="py-2.5 px-3 text-center text-dark-400 text-[10px]">
                            {company.headquarters?.split(' ')[0] || '华东'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => handleCompanyDrill(company, 'finance')}
                                className="text-[9px] px-2 py-1 rounded bg-brand-500/10 text-brand-400 hover:bg-brand-500/20"
                              >财务</button>
                              <button 
                                onClick={() => handleCompanyDrill(company, 'projects')}
                                className="text-[9px] px-2 py-1 rounded bg-success-500/10 text-success-400 hover:bg-success-500/20"
                              >项目</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {xSearchView === 'rank' && (
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="p-3 rounded-lg bg-dark-800/30 border border-dark-700/30">
                    <p className="text-xs font-medium text-dark-300 mb-2">🏆 销售金额榜</p>
                    <div className="space-y-1.5">
                      {filteredCompanies.slice(0, 5).map((c, i) => (
                        <div key={c.id} className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            i < 3 ? 'bg-gradient-to-br from-warning-500 to-danger-500 text-white' : 'bg-dark-700 text-dark-400'
                          }`}>{i + 1}</span>
                          <span className="text-sm">{c.logo}</span>
                          <span className="flex-1 text-xs text-white truncate">{c.shortName}</span>
                          <span className="text-xs font-mono text-brand-400">{formatMoney(c.revenue || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-800/30 border border-dark-700/30">
                    <p className="text-xs font-medium text-dark-300 mb-2">📊 项目数量榜</p>
                    <div className="space-y-1.5">
                      {[...filteredCompanies].sort((a, b) => 
                        mockProjects.filter(p => p.companyId === b.id).length - 
                        mockProjects.filter(p => p.companyId === a.id).length
                      ).slice(0, 5).map((c, i) => {
                        const count = mockProjects.filter(p => p.companyId === c.id).length;
                        return (
                        <div key={c.id} className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            i < 3 ? 'bg-gradient-to-br from-purple-500 to-brand-500 text-white' : 'bg-dark-700 text-dark-400'
                          }`}>{i + 1}</span>
                          <span className="text-sm">{c.logo}</span>
                          <span className="flex-1 text-xs text-white truncate">{c.shortName}</span>
                          <span className="text-xs font-mono text-purple-400">{count}个</span>
                        </div>
                      )})}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
