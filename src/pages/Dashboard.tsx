import { useState } from 'react';
import { Plus, Settings, GripVertical, Trash2, MoreHorizontal, ChevronDown, BarChart3, PieChart as PieChartIcon, TrendingUp, Building2, Users, MapPin, Package, Bell, Download, LayoutGrid } from 'lucide-react';
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
import { mockAlertStats } from '../data/monitoring';
import { formatMoney, formatNumber, formatRate } from '../utils/format';

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

  const renderWidgetContent = (widget: any) => {
    switch (widget.type) {
      case 'metric':
        return (
          <MetricCard
            title={widget.config.title}
            value={widget.config.value}
            trend={widget.config.trend}
            trendType={widget.config.trendType}
            color={widget.config.color || 'brand'}
            showSparkline={false}
          />
        );
      case 'line':
        return (
          <div className="h-full flex flex-col">
            <h4 className="text-sm font-medium text-white mb-2">{widget.config.title}</h4>
            <div className="flex-1 min-h-0">
              <LineChart data={revenueTrendData} showLegend />
            </div>
          </div>
        );
      case 'bar':
        return (
          <div className="h-full flex flex-col">
            <h4 className="text-sm font-medium text-white mb-2">{widget.config.title || 'TOP10房企'}</h4>
            <div className="flex-1 min-h-0">
              <BarChart data={top10Data} horizontal showLegend={false} />
            </div>
          </div>
        );
      case 'pie':
        return (
          <div className="h-full flex flex-col">
            <h4 className="text-sm font-medium text-white mb-2">{widget.config.title || '区域分布'}</h4>
            <div className="flex-1 min-h-0">
              <PieChart data={widget.config.title?.includes('舆情') ? sentimentData : regionData} type="doughnut" showLegend={true} />
            </div>
          </div>
        );
      case 'list':
        return (
          <div className="h-full flex flex-col">
            <h4 className="text-sm font-medium text-white mb-3">{widget.config.title || '预警列表'}</h4>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
              {['财务异动预警', '司法风险预警', '舆情负面预警', '运营风险预警', '债务违约预警'].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/30">
                  <span className="text-xs text-dark-300">{item}</span>
                  <Tag variant={i < 2 ? 'danger' : 'warning'} size="sm">{5 - i}条</Tag>
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
