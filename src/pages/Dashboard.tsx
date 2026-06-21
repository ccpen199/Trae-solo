import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, GripVertical, Trash2, MoreHorizontal, ChevronDown, BarChart3, PieChart as PieChartIcon, TrendingUp, Building2, Users, MapPin, Package, Bell, Download, LayoutGrid, Link2, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { MetricCard } from '../components/common/MetricCard';
import { LineChart } from '../components/charts/LineChart';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { mockCompanies } from '../data/companies';
import { mockSentimentStats } from '../data/sentiment';
import { mockAlertStats, mockAlerts } from '../data/monitoring';
import { mockProjects } from '../data/projects';
import { formatMoney, formatNumber, formatRate } from '../utils/format';
import { useAppStore } from '../stores/useAppStore';

const widgetTypes = [
  { type: 'metric', label: '指标卡', icon: BarChart3 },
  { type: 'line', label: '折线图', icon: TrendingUp },
  { type: 'bar', label: '柱状图', icon: BarChart3 },
  { type: 'pie', label: '饼图', icon: PieChartIcon },
  { type: 'table', label: '数据表格', icon: Building2 },
  { type: 'list', label: '排序列表', icon: Users },
];

const availableWidgets = [
  { id: 'w1', name: '营收总额', type: 'metric', category: '财务' },
  { id: 'w2', name: '净利润', type: 'metric', category: '财务' },
  { id: 'w3', name: '资产负债率', type: 'metric', category: '财务' },
  { id: 'w4', name: '销售金额', type: 'metric', category: '运营' },
  { id: 'w5', name: '拿地金额', type: 'metric', category: '运营' },
  { id: 'w6', name: '营收趋势', type: 'line', category: '财务' },
  { id: 'w7', name: '销售趋势', type: 'line', category: '运营' },
  { id: 'w8', name: 'TOP10房企', type: 'bar', category: '排行' },
  { id: 'w9', name: '区域分布', type: 'pie', category: '运营' },
  { id: 'w10', name: '舆情情感分布', type: 'pie', category: '舆情' },
  { id: 'w11', name: '预警列表', type: 'list', category: '风险' },
];

const defaultDashboards = [
  {
    id: 'd1',
    name: '企业财务看板',
    isDefault: true,
    widgets: [
      { id: 'w1', x: 0, y: 0, w: 1, h: 1, type: 'metric', config: { title: '总营收', value: '4,285.6亿', trend: 8.5, trendType: 'up' } },
      { id: 'w2', x: 1, y: 0, w: 1, h: 1, type: 'metric', config: { title: '净利润', value: '328.5亿', trend: 12.3, trendType: 'up' } },
      { id: 'w3', x: 2, y: 0, w: 1, h: 1, type: 'metric', config: { title: '资产负债率', value: '68.5%', trend: -2.1, trendType: 'down' } },
      { id: 'w6', x: 0, y: 1, w: 3, h: 2, type: 'line', config: { title: '营收趋势' } },
    ],
  },
  {
    id: 'd2',
    name: '项目运营看板',
    isDefault: false,
    widgets: [
      { id: 'w4', x: 0, y: 0, w: 1, h: 1, type: 'metric', config: { title: '销售金额', value: '3,568亿', trend: 5.2, trendType: 'up' } },
      { id: 'w5', x: 1, y: 0, w: 1, h: 1, type: 'metric', config: { title: '拿地金额', value: '1,256亿', trend: -8.3, trendType: 'down' } },
      { id: 'w7', x: 0, y: 1, w: 2, h: 1, type: 'line', config: { title: '销售趋势' } },
    ],
  },
  {
    id: 'd3',
    name: '风险监控看板',
    isDefault: false,
    widgets: [
      { id: 'w1', x: 0, y: 0, w: 1, h: 1, type: 'metric', config: { title: '高风险预警', value: '12', trend: 3, trendType: 'up', color: 'danger' } },
      { id: 'w10', x: 0, y: 1, w: 1, h: 1, type: 'pie', config: { title: '舆情分布' } },
      { id: 'w11', x: 1, y: 0, w: 1, h: 2, type: 'list', config: { title: '预警列表' } },
    ],
  },
];

export default function Dashboard() {
  const [dashboards, setDashboards] = useState(defaultDashboards);
  const [currentDashboard, setCurrentDashboard] = useState(defaultDashboards[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);
  const [showDashboardList, setShowDashboardList] = useState(false);
  const [widgetCategory, setWidgetCategory] = useState('all');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompanyA, setSelectedCompanyA] = useState<string | null>(null);
  const [selectedCompanyB, setSelectedCompanyB] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { setSelectedCompany, setFinanceContext } = useAppStore();

  const revenueTrendData = {
    xAxis: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      { name: '2023年', data: [850, 920, 1100, 1280, 950, 1050, 1200, 1380], color: '#3B82F6' },
      { name: '2024年', data: [950, 1050, 1200, 1380, 1050, 1150, 1300, 1480], color: '#8B5CF6' },
    ],
  };

  const salesTrendData = {
    xAxis: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    series: [
      { name: '销售金额(亿)', data: [280, 220, 350, 380, 320, 420, 450, 380, 360, 410, 480, 520], color: '#10B981' },
    ],
  };

  const top10Data = {
    xAxis: ['万科', '保利', '中海', '碧桂园', '华润', '龙湖', '招商', '金地', '新城', '旭辉'],
    series: [
      { name: '销售金额(亿)', data: [4169, 3845, 3603, 3505, 3200, 2950, 2800, 2250, 2100, 1850], color: '#3B82F6' },
    ],
  };

  const regionData = [
    { name: '华东', value: 35, color: '#3B82F6' },
    { name: '华南', value: 28, color: '#8B5CF6' },
    { name: '华北', value: 18, color: '#10B981' },
    { name: '西南', value: 10, color: '#F59E0B' },
    { name: '华中', value: 9, color: '#EF4444' },
  ];

  const sentimentData = [
    { name: '正面', value: 42, color: '#10B981' },
    { name: '中性', value: 38, color: '#64748B' },
    { name: '负面', value: 20, color: '#EF4444' },
  ];

  const filteredWidgets = widgetCategory === 'all'
    ? availableWidgets
    : availableWidgets.filter(w => w.category === widgetCategory);

  const categories = ['all', '财务', '运营', '排行', '舆情', '风险'];
  
  const crossDbStats = useMemo(() => {
    const totalCompanies = mockCompanies.length;
    const totalProjects = mockProjects.length;
    const totalAlerts = mockAlertStats.total;
    const negativeSentiment = mockSentimentStats.negative;
    return { totalCompanies, totalProjects, totalAlerts, negativeSentiment };
  }, []);

  const renderWidgetContent = (widget: any) => {
    switch (widget.type) {
      case 'metric':
        return (
          <div 
            className="h-full cursor-pointer group"
            onClick={() => {
              if (widget.config.color === 'danger') {
                navigate('/monitoring');
              } else {
                navigate('/finance');
              }
            }}
          >
            <MetricCard
              title={widget.config.title}
              value={widget.config.value}
              trend={widget.config.trend}
              trendType={widget.config.trendType}
              color={widget.config.color || 'brand'}
              showSparkline={false}
            />
            <div className="flex items-center gap-2 mt-2 text-[10px] text-dark-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex items-center gap-0.5 text-brand-400">
                点击下钻 <ChevronDown className="w-3 h-3" />
              </span>
            </div>
          </div>
        );
      case 'line':
        return (
          <div className="h-full flex flex-col cursor-pointer group" onClick={() => navigate('/finance')}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white">{widget.config.title}</h4>
              <div className="flex items-center gap-1">
                <Tag variant="primary" size="xs">同比 +8.5%</Tag>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <LineChart data={revenueTrendData} showLegend />
            </div>
          </div>
        );
      case 'bar':
        return (
          <div className="h-full flex flex-col cursor-pointer group" onClick={() => navigate('/finance')}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white">{widget.config.title || 'TOP10房企'}</h4>
              <span className="text-[10px] text-brand-400 flex items-center gap-0.5">
                下钻 <ChevronDown className="w-3 h-3" />
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <BarChart data={top10Data} horizontal showLegend={false} />
            </div>
          </div>
        );
      case 'pie':
        return (
          <div className="h-full flex flex-col cursor-pointer group" onClick={() => {
            if (widget.config.title?.includes('舆情')) {
              navigate('/sentiment');
            } else {
              navigate('/projects');
            }
          }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white">{widget.config.title || '区域分布'}</h4>
              <span className="text-[10px] text-purple-400 flex items-center gap-0.5">
                跨库联动 <Link2 className="w-3 h-3" />
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <PieChart data={widget.config.title?.includes('舆情') ? sentimentData : regionData} type="doughnut" showLegend={true} />
            </div>
          </div>
        );
      case 'list':
        return (
          <div className="h-full flex flex-col cursor-pointer group" onClick={() => navigate('/monitoring')}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">{widget.config.title || '预警列表'}</h4>
              <span className="text-[10px] text-danger-400 flex items-center gap-0.5">
                查看全部 <ChevronDown className="w-3 h-3" />
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
              {mockAlerts.slice(0, 5).map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/30 hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.level === 'high' ? 'bg-danger-500' :
                      alert.level === 'medium' ? 'bg-warning-500' : 'bg-brand-500'
                    }`} />
                    <span className="text-xs text-dark-300 truncate">{alert.title}</span>
                  </div>
                  <Tag variant={alert.level === 'high' ? 'danger' : 'warning'} size="xs">{alert.level === 'high' ? '高' : '中'}</Tag>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getWidgetSizeClass = (widget: any) => {
    const w = widget.w || 1;
    const h = widget.h || 1;
    return `col-span-${w} row-span-${h}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowDashboardList(!showDashboardList)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-brand-500/30 transition-colors"
              >
                <LayoutGrid className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-medium text-white">{currentDashboard.name}</span>
                <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${showDashboardList ? 'rotate-180' : ''}`} />
              </button>
              
              {showDashboardList && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-dark-800 border border-dark-700 shadow-xl z-50 overflow-hidden">
                  {dashboards.map((db) => (
                    <div
                      key={db.id}
                      onClick={() => {
                        setCurrentDashboard(db);
                        setShowDashboardList(false);
                      }}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                        currentDashboard.id === db.id
                          ? 'bg-brand-500/10 text-brand-400'
                          : 'hover:bg-dark-700/50 text-white'
                      }`}
                    >
                      <span className="text-sm">{db.name}</span>
                      {db.isDefault && (
                        <Tag variant="primary" size="sm">默认</Tag>
                      )}
                    </div>
                  ))}
                  <div className="p-2 border-t border-dark-700">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />
                      新建看板
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isEditing ? 'primary' : 'outline'}
              size="md"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '完成编辑' : '编辑看板'}
            </Button>
            {isEditing && (
              <Button
                variant="outline"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowWidgetPanel(true)}
              >
                添加组件
              </Button>
            )}
            <Button variant="outline" size="md" icon={<Download className="w-4 h-4" />}>
              导出
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <Card className="bg-gradient-to-r from-purple-500/5 via-brand-500/5 to-success-500/5 border-purple-500/20">
          <Card.Body className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-white">跨库联动视图</p>
                  <p className="text-[10px] text-dark-500">4大数据层实时联动 · 支持同比环比下钻分析</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-dark-800/50 rounded-lg p-0.5">
                  {[
                    { key: 'yoy', label: '同比' },
                    { key: 'mom', label: '环比' },
                    { key: 'od', label: '占比' },
                  ].map(item => (
                    <button
                      key={item.key}
                      className="px-3 py-1 text-[10px] rounded-md text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg transition-colors ${
                    compareMode
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      : 'bg-dark-800/50 text-dark-400 hover:text-white'
                  }`}
                >
                  {compareMode ? '退出双企比对' : '双企比对'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-3">
              <div 
                className="p-3 rounded-lg bg-dark-800/40 hover:bg-dark-800/60 cursor-pointer transition-colors border border-dark-700/30 hover:border-brand-500/30"
                onClick={() => navigate('/finance')}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-brand-400" />
                  <span className="text-[10px] text-dark-400">企业财务库</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">{crossDbStats.totalCompanies}家</p>
                <div className="flex items-center gap-1 mt-1 text-[9px]">
                  <TrendingUp className="w-2.5 h-2.5 text-success-500" />
                  <span className="text-success-500">+6.8% 同比</span>
                  <span className="text-dark-600">·</span>
                  <span className="text-dark-500">营收 7.23万亿</span>
                </div>
              </div>
              <div 
                className="p-3 rounded-lg bg-dark-800/40 hover:bg-dark-800/60 cursor-pointer transition-colors border border-dark-700/30 hover:border-purple-500/30"
                onClick={() => navigate('/relationship')}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] text-dark-400">人物关系</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">1,280人</p>
                <div className="flex items-center gap-1 mt-1 text-[9px]">
                  <TrendingUp className="w-2.5 h-2.5 text-purple-500" />
                  <span className="text-purple-500">+12.3% 环比</span>
                  <span className="text-dark-600">·</span>
                  <span className="text-dark-500">关系链 3.2万条</span>
                </div>
              </div>
              <div 
                className="p-3 rounded-lg bg-dark-800/40 hover:bg-dark-800/60 cursor-pointer transition-colors border border-dark-700/30 hover:border-success-500/30"
                onClick={() => navigate('/projects')}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-success-400" />
                  <span className="text-[10px] text-dark-400">项目全周期</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">{crossDbStats.totalProjects}个</p>
                <div className="flex items-center gap-1 mt-1 text-[9px]">
                  <TrendingDown className="w-2.5 h-2.5 text-danger-500" />
                  <span className="text-danger-500">-3.2% 同比</span>
                  <span className="text-dark-600">·</span>
                  <span className="text-dark-500">在建 8.6万㎡</span>
                </div>
              </div>
              <div 
                className="p-3 rounded-lg bg-dark-800/40 hover:bg-dark-800/60 cursor-pointer transition-colors border border-dark-700/30 hover:border-danger-500/30"
                onClick={() => navigate('/monitoring')}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-danger-400" />
                  <span className="text-[10px] text-dark-400">风险预警</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">{crossDbStats.totalAlerts}条</p>
                <div className="flex items-center gap-1 mt-1 text-[9px]">
                  <TrendingUp className="w-2.5 h-2.5 text-danger-500" />
                  <span className="text-danger-500">+15.6% 同比</span>
                  <span className="text-dark-600">·</span>
                  <span className="text-dark-500">高风险 {mockAlertStats.high}条</span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="flex-1 flex px-6 pb-6 gap-5 min-h-0">
        <div className="flex-1 min-h-0">
          <div className="grid grid-cols-3 gap-4 auto-rows-[180px]">
            {currentDashboard.widgets.map((widget) => (
              <Card
                key={widget.id}
                className={`relative ${getWidgetSizeClass(widget)} overflow-hidden`}
                style={{
                  gridColumn: `span ${widget.w || 1}`,
                  gridRow: `span ${widget.h || 1}`,
                }}
              >
                {isEditing && (
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
                    <button className="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white transition-colors">
                      <GripVertical className="w-4 h-4 cursor-move" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-dark-700 hover:bg-danger-500/20 text-dark-300 hover:text-danger-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <Card.Body className="h-full">
                  {renderWidgetContent(widget)}
                </Card.Body>
              </Card>
            ))}
          </div>

          {currentDashboard.widgets.length === 0 && (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <LayoutGrid className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400 mb-4">暂无组件，点击"添加组件"开始配置</p>
                {!isEditing && (
                  <Button variant="primary" size="md" onClick={() => setIsEditing(true)}>
                    开始配置
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        {showWidgetPanel && (
          <div className="w-72 flex flex-col">
            <Card className="flex-1 min-h-0 flex flex-col">
              <Card.Header>
                <Card.Title className="text-sm">添加组件</Card.Title>
                <button
                  onClick={() => setShowWidgetPanel(false)}
                  className="text-xs text-dark-500 hover:text-dark-300 transition-colors"
                >
                  关闭
                </button>
              </Card.Header>
              <Card.Body className="flex-1 overflow-y-auto space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setWidgetCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        widgetCategory === cat
                          ? 'bg-brand-500/20 text-brand-400'
                          : 'bg-dark-800/50 text-dark-400 hover:text-white'
                      }`}
                    >
                      {cat === 'all' ? '全部' : cat}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {filteredWidgets.map((widget) => {
                    const TypeIcon = widgetTypes.find(t => t.type === widget.type)?.icon || BarChart3;
                    return (
                      <div
                        key={widget.id}
                        className="p-3 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-brand-500/30 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-brand-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm text-white group-hover:text-brand-400 transition-colors">
                              {widget.name}
                            </h4>
                            <span className="text-xs text-dark-500">{widget.category}</span>
                          </div>
                          <Plus className="w-4 h-4 text-dark-500 group-hover:text-brand-400 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-dark-700/30">
                  <p className="text-xs text-dark-500 mb-3">组件类型</p>
                  <div className="grid grid-cols-3 gap-2">
                    {widgetTypes.map((type) => (
                      <div
                        key={type.type}
                        className="p-2 rounded-lg bg-dark-800/30 text-center cursor-pointer hover:bg-dark-800/50 transition-colors group"
                      >
                        <type.icon className="w-5 h-5 text-dark-400 mx-auto mb-1 group-hover:text-brand-400 transition-colors" />
                        <p className="text-[10px] text-dark-500 group-hover:text-dark-300 transition-colors">
                          {type.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
