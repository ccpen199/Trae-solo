import { Building2, TrendingUp, AlertTriangle, Newspaper, ArrowRight, Zap, Database, Network, BarChart3 } from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { LineChart } from '../components/charts/LineChart';
import { BarChart } from '../components/charts/BarChart';
import { mockCompanies } from '../data/companies';
import { mockNews } from '../data/sentiment';
import { mockAlertStats, mockAlerts } from '../data/monitoring';
import { formatNumber, formatMoney } from '../utils/format';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

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

  const quickEntries = [
    { icon: Network, label: '人物关系', desc: '高管任职/股权穿透', path: '/relationship', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: BarChart3, label: '财务分析', desc: '财报/债券/土储', path: '/finance', color: 'text-brand-500', bg: 'bg-brand-500/10' },
    { icon: Building2, label: '项目追踪', desc: '全周期进度', path: '/projects', color: 'text-success-500', bg: 'bg-success-500/10' },
    { icon: Database, label: '供应链库', desc: '供应商/合作关系', path: '/supply-chain', color: 'text-warning-500', bg: 'bg-warning-500/10' },
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
          change={0.023}
          icon={<Building2 className="w-6 h-6 text-brand-400" />}
          iconBg="bg-brand-500/20"
          showSparkline={true}
          sparklineData={[12000, 12100, 12200, 12300, 12400, 12500, 12580]}
          color="brand"
          onClick={() => navigate('/finance')}
        />
        <MetricCard
          title="在建项目"
          value={86520}
          change={-0.018}
          icon={<Zap className="w-6 h-6 text-purple-400" />}
          iconBg="bg-purple-500/20"
          showSparkline={true}
          sparklineData={[88000, 87800, 87500, 87200, 87000, 86800, 86520]}
          color="purple"
          onClick={() => navigate('/projects')}
        />
        <MetricCard
          title="今日舆情"
          value={3586}
          change={0.125}
          icon={<Newspaper className="w-6 h-6 text-success-500" />}
          iconBg="bg-success-500/20"
          showSparkline={true}
          sparklineData={[3200, 3100, 3400, 3300, 3250, 3450, 3586]}
          color="success"
          onClick={() => navigate('/sentiment')}
        />
        <MetricCard
          title="风险预警"
          value={mockAlertStats.total}
          change={0.085}
          icon={<AlertTriangle className="w-6 h-6 text-warning-500" />}
          iconBg="bg-warning-500/20"
          showSparkline={true}
          sparklineData={[8, 9, 10, 11, 10, 12, 12]}
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
            <Card.Title>快捷入口</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-2 gap-3">
              {quickEntries.map((entry, index) => {
                const Icon = entry.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(entry.path)}
                    className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-brand-500/30 hover:bg-dark-800/50 transition-all duration-200 text-left group"
                  >
                    <div className={`w-10 h-10 rounded-lg ${entry.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${entry.color}`} />
                    </div>
                    <p className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">
                      {entry.label}
                    </p>
                    <p className="text-xs text-dark-500 mt-0.5">{entry.desc}</p>
                  </button>
                );
              })}
            </div>
          </Card.Body>
        </Card>

        <Card className="col-span-2">
          <Card.Header>
            <Card.Title>最新资讯</Card.Title>
            <button 
              onClick={() => navigate('/sentiment')}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
            >
              查看全部 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Card.Header>
          <Card.Body className="py-3">
            <div className="space-y-1">
              {latestNews.map((news) => (
                <div
                  key={news.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-dark-800/50 cursor-pointer transition-colors group"
                >
                  {getSentimentTag(news.sentiment)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-brand-400 transition-colors">
                      {news.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-dark-500">{news.source}</span>
                      <span className="text-xs text-dark-600">
                        {news.readCount.toLocaleString()} 阅读
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-dark-500 flex-shrink-0">
                    {news.publishDate.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card>
          <Card.Header>
            <Card.Title>高风险预警</Card.Title>
            <Tag variant="danger">{highAlerts.length} 条</Tag>
          </Card.Header>
          <Card.Body className="py-3">
            <div className="space-y-3">
              {highAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => navigate('/monitoring')}
                  className="p-3 rounded-lg bg-dark-800/30 border border-dark-700/30 hover:border-danger-500/30 cursor-pointer transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${getLevelColor(alert.level)} flex-shrink-0 mt-1.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-danger-400 transition-colors">
                        {alert.title}
                      </p>
                      <p className="text-xs text-dark-400 mt-1 line-clamp-2">{alert.description}</p>
                      <p className="text-xs text-dark-500 mt-2">{alert.companyName}</p>
                    </div>
                  </div>
                </div>
              ))}
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
            <Card.Title>热门房企</Card.Title>
            <Tag variant="outline">关注度排行</Tag>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-4 gap-3">
              {mockCompanies.slice(0, 8).map((company, index) => (
                <div
                  key={company.id}
                  onClick={() => navigate('/finance')}
                  className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-brand-500/30 hover:bg-dark-800/50 cursor-pointer transition-all text-center group"
                >
                  <div className="relative inline-block">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-2xl border border-dark-600/50">
                      {company.logo}
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-dark-900 border border-dark-600 rounded-full text-xs font-bold text-brand-400 flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white mt-3 truncate group-hover:text-brand-400 transition-colors">
                    {company.shortName}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Tag variant={company.type === 'state-owned' ? 'primary' : company.type === 'private' ? 'success' : 'warning'} size="sm">
                      {company.type === 'state-owned' ? '国企' : company.type === 'private' ? '民企' : '混合'}
                    </Tag>
                  </div>
                  <p className="text-xs text-dark-500 mt-2">{formatMoney(4850 - index * 350)}</p>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
