import { useState } from 'react';
import { AlertTriangle, Settings, Bell, TrendingUp, TrendingDown, Filter, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { LineChart } from '../components/charts/LineChart';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { mockAlerts, mockAlertThresholds, mockAlertStats } from '../data/monitoring';
import { mockCompanies } from '../data/companies';
import { formatMoney, formatRate } from '../utils/format';
import type { Alert, AlertLevel, AlertType, AlertStatus } from '../types/monitoring';

export default function Monitoring() {
  const [activeTab, setActiveTab] = useState('alerts');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');

  const filteredAlerts = mockAlerts.filter(a => {
    if (levelFilter !== 'all' && a.level !== levelFilter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const getLevelColor = (level: AlertLevel) => {
    switch (level) {
      case 'high': return 'bg-danger-500';
      case 'medium': return 'bg-warning-500';
      case 'low': return 'bg-brand-500';
    }
  };

  const getLevelBg = (level: AlertLevel) => {
    switch (level) {
      case 'high': return 'bg-danger-500/10 border-danger-500/30';
      case 'medium': return 'bg-warning-500/10 border-warning-500/30';
      case 'low': return 'bg-brand-500/10 border-brand-500/30';
    }
  };

  const getLevelText = (level: AlertLevel) => {
    switch (level) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'finance': return TrendingDown;
      case 'judicial': return AlertTriangle;
      case 'sentiment': return Bell;
      case 'operation': return Settings;
    }
  };

  const getTypeText = (type: AlertType) => {
    switch (type) {
      case 'finance': return '财务异动';
      case 'judicial': return '司法风险';
      case 'sentiment': return '舆情负面';
      case 'operation': return '运营预警';
    }
  };

  const getStatusIcon = (status: AlertStatus) => {
    switch (status) {
      case 'unread': return Bell;
      case 'read': return Clock;
      case 'processed': return CheckCircle;
    }
  };

  const getStatusText = (status: AlertStatus) => {
    switch (status) {
      case 'unread': return '未读';
      case 'read': return '已读';
      case 'processed': return '已处理';
    }
  };

  const alertTypeData = [
    { name: '财务异动', value: mockAlertStats.finance, color: '#3B82F6' },
    { name: '司法风险', value: mockAlertStats.judicial, color: '#F59E0B' },
    { name: '舆情负面', value: mockAlertStats.sentiment, color: '#EF4444' },
    { name: '运营预警', value: mockAlertStats.operation, color: '#8B5CF6' },
  ];

  const alertLevelData = [
    { name: '高风险', value: mockAlertStats.high, color: '#EF4444' },
    { name: '中风险', value: mockAlertStats.medium, color: '#F59E0B' },
    { name: '低风险', value: mockAlertStats.low, color: '#3B82F6' },
  ];

  const alertTrendData = {
    xAxis: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    series: [
      { name: '高风险', data: [3, 4, 5, 6, 5, 7, 8, 6, 5, 7, 6, 5], color: '#EF4444' },
      { name: '中风险', data: [5, 6, 7, 8, 7, 9, 10, 8, 7, 8, 7, 6], color: '#F59E0B' },
      { name: '低风险', data: [8, 9, 10, 11, 10, 12, 13, 11, 10, 11, 10, 9], color: '#3B82F6' },
    ],
  };

  const highRiskCompanies = mockCompanies.slice(0, 5).map((c, i) => ({
    name: c.shortName,
    alerts: 5 - i + Math.floor(Math.random() * 3),
  }));

  const companyAlertData = {
    xAxis: highRiskCompanies.map(c => c.name),
    series: [{ name: '预警数量', data: highRiskCompanies.map(c => c.alerts), color: '#EF4444' }],
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">财报异动监测</h1>
            <p className="text-sm text-dark-400 mt-1">营收增速与销售回款率偏差超阈值预警</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" icon={<Settings className="w-4 h-4" />}>
              阈值配置
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="grid grid-cols-4 gap-5">
          <div className="p-4 rounded-xl bg-gradient-to-br from-danger-500/10 to-danger-900/10 border border-danger-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">高风险预警</p>
                <p className="text-2xl font-bold text-danger-500 font-mono mt-1">
                  {mockAlertStats.high}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-danger-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-danger-400" />
              </div>
            </div>
            <p className="text-xs text-danger-500/80 mt-2">
              {mockAlerts.filter(a => a.level === 'high' && a.status === 'unread').length} 条未读
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-warning-500/10 to-warning-900/10 border border-warning-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">中风险预警</p>
                <p className="text-2xl font-bold text-warning-500 font-mono mt-1">
                  {mockAlertStats.medium}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning-400" />
              </div>
            </div>
            <p className="text-xs text-warning-500/80 mt-2">
              {mockAlerts.filter(a => a.level === 'medium' && a.status === 'unread').length} 条未读
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-brand-500/10 to-brand-900/10 border border-brand-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">低风险预警</p>
                <p className="text-2xl font-bold text-brand-500 font-mono mt-1">
                  {mockAlertStats.low}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <Bell className="w-6 h-6 text-brand-400" />
              </div>
            </div>
            <p className="text-xs text-brand-500/80 mt-2">
              {mockAlerts.filter(a => a.level === 'low' && a.status === 'unread').length} 条未读
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-dark-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">未读总数</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">
                  {mockAlertStats.unread}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-dark-700/50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-dark-400" />
              </div>
            </div>
            <p className="text-xs text-dark-500 mt-2">
              共 {mockAlertStats.total} 条预警记录
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex px-6 pb-6 gap-5 min-h-0">
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <Card className="flex-shrink-0">
            <Card.Header>
              <Tabs
                tabs={[
                  { key: 'alerts', label: '预警列表' },
                  { key: 'thresholds', label: '阈值配置' },
                  { key: 'trend', label: '趋势分析' },
                ]}
                activeKey={activeTab}
                onChange={setActiveTab}
                variant="pills"
              />
              <div className="flex items-center gap-2">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as any)}
                  className="h-8 px-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50 transition-all"
                >
                  <option value="all">全部级别</option>
                  <option value="high">高风险</option>
                  <option value="medium">中风险</option>
                  <option value="low">低风险</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="h-8 px-3 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 focus:outline-none focus:border-brand-500/50 transition-all"
                >
                  <option value="all">全部类型</option>
                  <option value="finance">财务异动</option>
                  <option value="judicial">司法风险</option>
                  <option value="sentiment">舆情负面</option>
                  <option value="operation">运营预警</option>
                </select>
              </div>
            </Card.Header>
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col">
            <Card.Body className="flex-1 overflow-y-auto">
              {activeTab === 'alerts' && (
                <div className="space-y-2">
                  {filteredAlerts.map((alert) => {
                    const TypeIcon = getTypeIcon(alert.type);
                    return (
                      <div
                        key={alert.id}
                        onClick={() => setSelectedAlert(alert)}
                        className={`p-4 rounded-xl cursor-pointer transition-all border ${
                          selectedAlert?.id === alert.id
                            ? 'bg-brand-500/10 border-brand-500/30'
                            : `${getLevelBg(alert.level)} hover:border-opacity-50`
                        } ${alert.status === 'unread' ? 'ring-1 ring-brand-500/30' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            alert.level === 'high' ? 'bg-danger-500/20' :
                            alert.level === 'medium' ? 'bg-warning-500/20' : 'bg-brand-500/20'
                          }`}>
                            <TypeIcon className={`w-5 h-5 ${
                              alert.level === 'high' ? 'text-danger-500' :
                              alert.level === 'medium' ? 'text-warning-500' : 'text-brand-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-white">{alert.title}</h3>
                              {alert.status === 'unread' && (
                                <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-dark-400 mt-1 line-clamp-2">{alert.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <Tag
                                variant={
                                  alert.level === 'high' ? 'danger' :
                                  alert.level === 'medium' ? 'warning' : 'primary'
                                }
                                size="sm"
                              >
                                {getLevelText(alert.level)}
                              </Tag>
                              <Tag variant="outline" size="sm">{getTypeText(alert.type)}</Tag>
                              <span className="text-xs text-dark-500">{alert.companyName}</span>
                              <span className="text-xs text-dark-600">{alert.createTime}</span>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 flex-shrink-0 mt-1 ${
                            selectedAlert?.id === alert.id ? 'text-brand-400' : 'text-dark-600'
                          }`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'thresholds' && (
                <div className="space-y-3">
                  {mockAlertThresholds.map((threshold) => (
                    <div key={threshold.id} className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-brand-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-white">{threshold.metricName}</h3>
                            <p className="text-xs text-dark-500">{threshold.category}</p>
                          </div>
                        </div>
                        <button className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                          编辑
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20">
                          <p className="text-xs text-danger-400">高风险阈值</p>
                          <p className="text-sm font-mono text-white mt-1">
                            {threshold.highThreshold}{threshold.unit || ''}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/20">
                          <p className="text-xs text-warning-400">中风险阈值</p>
                          <p className="text-sm font-mono text-white mt-1">
                            {threshold.mediumThreshold}{threshold.unit || ''}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/20">
                          <p className="text-xs text-brand-400">低风险阈值</p>
                          <p className="text-sm font-mono text-white mt-1">
                            {threshold.lowThreshold}{threshold.unit || ''}
                          </p>
                        </div>
                      </div>
                      {threshold.description && (
                        <p className="text-xs text-dark-500 mt-3">{threshold.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'trend' && (
                <div className="space-y-5">
                  <Card>
                    <Card.Header>
                      <Card.Title className="text-sm">预警趋势</Card.Title>
                      <Tag variant="outline">近12个月</Tag>
                    </Card.Header>
                    <Card.Body>
                      <LineChart data={alertTrendData} height={280} showLegend />
                    </Card.Body>
                  </Card>

                  <div className="grid grid-cols-2 gap-5">
                    <Card>
                      <Card.Header>
                        <Card.Title className="text-sm">预警类型分布</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <PieChart
                          data={alertTypeData}
                          type="doughnut"
                          height={220}
                          showLegend={true}
                        />
                      </Card.Body>
                    </Card>
                    <Card>
                      <Card.Header>
                        <Card.Title className="text-sm">高风险企业TOP5</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <BarChart data={companyAlertData} horizontal height={220} showLegend={false} />
                      </Card.Body>
                    </Card>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="w-80 flex flex-col gap-4">
          {selectedAlert ? (
            <Card className="flex-1 min-h-0 flex flex-col">
              <Card.Header>
                <Card.Title className="text-sm">预警详情</Card.Title>
              </Card.Header>
              <Card.Body className="flex-1 overflow-y-auto space-y-4">
                <div className={`p-4 rounded-xl ${getLevelBg(selectedAlert.level)} border`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedAlert.level === 'high' ? 'bg-danger-500/30' :
                      selectedAlert.level === 'medium' ? 'bg-warning-500/30' : 'bg-brand-500/30'
                    }`}>
                      <AlertTriangle className={`w-6 h-6 ${
                        selectedAlert.level === 'high' ? 'text-danger-500' :
                        selectedAlert.level === 'medium' ? 'text-warning-500' : 'text-brand-500'
                      }`} />
                    </div>
                    <div>
                      <Tag
                        variant={
                          selectedAlert.level === 'high' ? 'danger' :
                          selectedAlert.level === 'medium' ? 'warning' : 'primary'
                        }
                      >
                        {getLevelText(selectedAlert.level)}
                      </Tag>
                      <h3 className="text-base font-semibold text-white mt-1.5">{selectedAlert.title}</h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-500">预警类型</span>
                    <span className="text-white">{getTypeText(selectedAlert.type)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-500">关联企业</span>
                    <span className="text-brand-400">{selectedAlert.companyName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-500">创建时间</span>
                    <span className="text-dark-300">{selectedAlert.createTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-500">当前状态</span>
                    <Tag variant={
                      selectedAlert.status === 'unread' ? 'primary' :
                      selectedAlert.status === 'read' ? 'default' : 'success'
                    }>
                      {getStatusText(selectedAlert.status)}
                    </Tag>
                  </div>
                </div>

                <div className="divider -mx-5" />

                <div>
                  <p className="text-xs font-medium text-dark-300 mb-2">预警详情</p>
                  <p className="text-sm text-dark-300 leading-relaxed">{selectedAlert.description}</p>
                </div>

                {selectedAlert.metric && (
                  <div>
                    <p className="text-xs font-medium text-dark-300 mb-2">异动指标</p>
                    <div className="p-3 rounded-lg bg-dark-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-dark-400">{selectedAlert.metricName}</span>
                        <span className={`text-sm font-mono font-semibold ${
                          selectedAlert.currentValue !== undefined && selectedAlert.currentValue < 0
                            ? 'text-danger-500'
                            : 'text-white'
                        }`}>
                          {selectedAlert.currentValue?.toFixed(2) || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-dark-500">阈值</span>
                        <span className="text-xs font-mono text-warning-500">
                          {selectedAlert.threshold?.toFixed(2) || '-'}
                        </span>
                      </div>
                      {selectedAlert.deviationPercent !== undefined && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-dark-500">偏差幅度</span>
                            <span className="text-danger-500 font-mono">+{selectedAlert.deviationPercent.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-dark-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-warning-500 to-danger-500"
                              style={{ width: `${Math.min(selectedAlert.deviationPercent * 2, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Button variant="primary" size="md" className="w-full">
                    标记为已读
                  </Button>
                  <Button variant="outline" size="md" className="w-full">
                    查看关联数据
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400">选择预警查看详情</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
