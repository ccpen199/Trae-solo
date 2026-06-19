import { useEffect, useState } from 'react';
import { Shield, Search, Filter, AlertTriangle, Eye, Check, X, Clock, Users, Monitor, Zap, RefreshCw } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useRiskStore } from '../stores/riskStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable } from '../components/common/DataTable';
import { PieChart } from '../components/common/PieChart';
import { StatCard } from '../components/common/StatCard';
import { Loading } from '../components/common/Loading';
import { Modal } from '../components/common/Modal';
import { FormTextarea } from '../components/common/FormInput';
import dayjs from 'dayjs';
import type { RiskEvent } from '@shared/types';

export default function RiskControl() {
  const { events, riskDistribution, deviceAccountGraph, isLoading, pagination, fetchEvents, fetchRiskDistribution, fetchDeviceAccountGraph, handleEvent, setSelectedEvent, selectedEvent } = useRiskStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [handleModalOpen, setHandleModalOpen] = useState(false);
  const [handleStatus, setHandleStatus] = useState<'reviewing' | 'resolved' | 'ignored'>('resolved');
  const [handleNotes, setHandleNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'graph' | 'distribution'>('timeline');

  useEffect(() => {
    fetchEvents({ page: currentPage, pageSize: 10 });
    fetchRiskDistribution();
    fetchDeviceAccountGraph();
  }, [currentPage]);

  const handleFilter = () => {
    const params: any = { page: 1, pageSize: 10 };
    if (levelFilter !== 'all') params.level = levelFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter !== 'all') params.type = typeFilter;
    fetchEvents(params);
    setCurrentPage(1);
  };

  const handleViewDetail = (event: RiskEvent) => {
    setSelectedEvent(event);
    setDetailModalOpen(true);
  };

  const handleOpenHandleModal = (event: RiskEvent) => {
    setSelectedEvent(event);
    setHandleStatus('resolved');
    setHandleNotes('');
    setHandleModalOpen(true);
  };

  const handleSubmitHandle = async () => {
    if (!selectedEvent) return;
    await handleEvent(selectedEvent.id, handleStatus, handleNotes);
    await fetchEvents({ page: currentPage, pageSize: 10 });
    setHandleModalOpen(false);
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      multi_account: '多账户关联',
      bulk_hoarding: '批量囤券',
      abnormal_path: '异常路径',
    };
    return typeMap[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'multi_account':
        return <Users className="w-4 h-4" />;
      case 'bulk_hoarding':
        return <Zap className="w-4 h-4" />;
      case 'abnormal_path':
        return <Monitor className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const columns = [
    {
      key: 'level',
      header: '风险等级',
      width: '100px',
      render: (item: RiskEvent) => <StatusBadge status={item.level} type="risk" />,
    },
    {
      key: 'type',
      header: '事件类型',
      width: '120px',
      render: (item: RiskEvent) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(item.type)}
          <span>{getTypeLabel(item.type)}</span>
        </div>
      ),
    },
    {
      key: 'userId',
      header: '关联用户',
      width: '120px',
      render: (item: RiskEvent) => item.userId || '-',
    },
    {
      key: 'deviceId',
      header: '关联设备',
      width: '120px',
      render: (item: RiskEvent) => item.deviceId || '-',
    },
    {
      key: 'evidence',
      header: '风险证据',
      render: (item: RiskEvent) => (
        <div className="text-sm text-gray-600">
          {item.evidence.accountCount && <span>关联账户: {item.evidence.accountCount}个</span>}
          {item.evidence.timeWindow && <span className="ml-3">时间窗口: {item.evidence.timeWindow}</span>}
          {item.evidence.couponCount && <span className="ml-3">券数量: {item.evidence.couponCount}</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      width: '100px',
      render: (item: RiskEvent) => <StatusBadge status={item.status} type="riskStatus" />,
    },
    {
      key: 'detectedAt',
      header: '检测时间',
      width: '160px',
      render: (item: RiskEvent) => dayjs(item.detectedAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      key: 'actions',
      header: '操作',
      width: '180px',
      render: (item: RiskEvent) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetail(item)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            详情
          </button>
          {item.status === 'pending' && (
            <button
              onClick={() => handleOpenHandleModal(item)}
              className="text-accent-500 hover:text-accent-600 text-sm font-medium flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              处理
            </button>
          )}
        </div>
      ),
    },
  ];

  const filteredEvents = events.filter((event) =>
    (event.userId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (event.deviceId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const highRiskCount = events.filter((e) => e.level === 'high').length;
  const todayCount = events.filter((e) => dayjs(e.detectedAt).isSame(dayjs(), 'day')).length;

  const distributionData = riskDistribution.map((item) => ({
    name: item.level,
    value: item.count,
  }));

  const graphOption = {
    tooltip: {
      formatter: (params: any) => {
        return params.data.name || '';
      },
    },
    legend: {
      data: ['设备', '正常账户', '风险账户'],
      bottom: 0,
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        symbolSize: 40,
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          fontSize: 12,
        },
        edgeSymbol: ['circle', 'arrow'],
        edgeSymbolSize: [4, 10],
        edgeLabel: {
          fontSize: 12,
        },
        force: {
          repulsion: 1000,
          edgeLength: [50, 200],
        },
        data: deviceAccountGraph.nodes.map((node: any) => ({
          ...node,
          itemStyle: {
            color: node.category === 0 ? '#1E40AF' : node.category === 2 ? '#EF4444' : '#10B981',
          },
        })),
        links: deviceAccountGraph.edges,
        lineStyle: {
          opacity: 0.9,
          width: 2,
          curveness: 0.1,
        },
      },
    ],
  };

  const timelineEvents = events.slice(0, 10).map((event) => ({
    id: event.id,
    level: event.level,
    type: event.type,
    title: getTypeLabel(event.type),
    description: `设备 ${event.deviceId} 检测到异常，关联 ${event.evidence.accountCount || 0} 个账户`,
    time: dayjs(event.detectedAt).format('HH:mm'),
    status: event.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">风控管理</h1>
          <p className="text-gray-500 mt-1">监控和处理平台风险事件</p>
        </div>
        <button
          onClick={() => {
            fetchEvents({ page: currentPage, pageSize: 10 });
            fetchRiskDistribution();
            fetchDeviceAccountGraph();
          }}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="待处理事件"
          value={pendingCount}
          color="orange"
          icon={<Clock className="w-5 h-5" />}
          trend={12}
          trendLabel="12%"
        />
        <StatCard
          title="高风险事件"
          value={highRiskCount}
          color="red"
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={-8}
          trendLabel="8%"
        />
        <StatCard
          title="今日新增"
          value={todayCount}
          color="blue"
          icon={<Zap className="w-5 h-5" />}
        />
        <StatCard
          title="监控设备"
          value={128}
          color="green"
          icon={<Monitor className="w-5 h-5" />}
        />
      </div>

      <div className="card">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'timeline'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            风险事件时间线
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'graph'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            设备-账户关系图
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'distribution'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            风险分布分析
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'timeline' && (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-6">
                {timelineEvents.map((event, index) => (
                  <div key={event.id} className="relative pl-12">
                    <div
                      className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white text-white ${
                        event.level === 'high'
                          ? 'bg-danger-500'
                          : event.level === 'medium'
                          ? 'bg-warning-500'
                          : 'bg-primary-500'
                      }`}
                    >
                      {getTypeIcon(event.type)}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={event.level} type="risk" />
                          <span className="font-medium text-gray-900">{event.title}</span>
                        </div>
                        <span className="text-sm text-gray-500">{event.time}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{event.description}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <StatusBadge status={event.status} type="riskStatus" />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const ev = events.find((e) => e.id === event.id);
                              if (ev) handleViewDetail(ev);
                            }}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            查看详情
                          </button>
                          {event.status === 'pending' && (
                            <button
                              onClick={() => {
                                const ev = events.find((e) => e.id === event.id);
                                if (ev) handleOpenHandleModal(ev);
                              }}
                              className="text-accent-500 hover:text-accent-600 text-sm"
                            >
                              立即处理
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="h-[500px]">
              <ReactECharts option={graphOption} style={{ height: '100%' }} />
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">风险等级分布</h3>
                <PieChart data={distributionData} height={300} />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">风险类型分布</h3>
                <div className="space-y-3">
                  {[
                    { type: '多账户关联', count: 45, color: 'bg-primary-500', percent: 45 },
                    { type: '批量囤券', count: 35, color: 'bg-warning-500', percent: 35 },
                    { type: '异常路径', count: 20, color: 'bg-danger-500', percent: 20 },
                  ].map((item) => (
                    <div key={item.type} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{item.type}</span>
                        <span className="text-gray-500">{item.count} 件</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户ID或设备ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="input w-32"
            >
              <option value="all">全部等级</option>
              <option value="low">低风险</option>
              <option value="medium">中风险</option>
              <option value="high">高风险</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-32"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="reviewing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="ignored">已忽略</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-32"
            >
              <option value="all">全部类型</option>
              <option value="multi_account">多账户关联</option>
              <option value="bulk_hoarding">批量囤券</option>
              <option value="abnormal_path">异常路径</option>
            </select>
            <button onClick={handleFilter} className="btn-primary">
              筛选
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <DataTable
          columns={columns}
          data={filteredEvents}
          loading={isLoading}
          pagination={{
            page: currentPage,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onPageChange: (page) => setCurrentPage(page),
          }}
        />
      )}

      <Modal
        visible={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="风险事件详情"
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    selectedEvent.level === 'high'
                      ? 'bg-danger-500'
                      : selectedEvent.level === 'medium'
                      ? 'bg-warning-500'
                      : 'bg-primary-500'
                  }`}
                >
                  {getTypeIcon(selectedEvent.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{getTypeLabel(selectedEvent.type)}</h3>
                  <p className="text-sm text-gray-500">
                    检测时间: {dayjs(selectedEvent.detectedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={selectedEvent.level} type="risk" />
                <StatusBadge status={selectedEvent.status} type="riskStatus" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">关联用户</label>
                <p className="text-gray-900 font-mono">{selectedEvent.userId || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">关联设备</label>
                <p className="text-gray-900 font-mono">{selectedEvent.deviceId || '-'}</p>
              </div>
              {selectedEvent.relatedAccounts && (
                <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">关联账户</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEvent.relatedAccounts.map((acc) => (
                      <span
                        key={acc}
                        className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-mono"
                      >
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">风险证据</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedEvent.evidence.deviceId && (
                  <div>
                    <span className="text-gray-500">设备ID:</span>
                    <span className="ml-2 font-mono">{selectedEvent.evidence.deviceId}</span>
                  </div>
                )}
                {selectedEvent.evidence.accountCount && (
                  <div>
                    <span className="text-gray-500">关联账户数:</span>
                    <span className="ml-2 font-semibold">{selectedEvent.evidence.accountCount}</span>
                  </div>
                )}
                {selectedEvent.evidence.timeWindow && (
                  <div>
                    <span className="text-gray-500">时间窗口:</span>
                    <span className="ml-2">{selectedEvent.evidence.timeWindow}</span>
                  </div>
                )}
                {selectedEvent.evidence.couponCount && (
                  <div>
                    <span className="text-gray-500">券数量:</span>
                    <span className="ml-2 font-semibold">{selectedEvent.evidence.couponCount}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">异常评分:</span>
                  <span className="ml-2 font-semibold text-danger-500">{selectedEvent.evidence.anomalyScore}</span>
                </div>
                {selectedEvent.evidence.ipAddresses && (
                  <div className="col-span-2">
                    <span className="text-gray-500">IP地址:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEvent.evidence.ipAddresses.map((ip) => (
                        <span key={ip} className="px-2 py-0.5 bg-gray-200 rounded text-xs font-mono">
                          {ip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedEvent.handlerNotes && (
              <div className="p-4 bg-primary-50 rounded-lg">
                <h4 className="font-medium text-primary-900 mb-2">处理备注</h4>
                <p className="text-primary-800">{selectedEvent.handlerNotes}</p>
                <p className="text-sm text-primary-600 mt-2">
                  处理人: {selectedEvent.handlerId} | 处理时间: {dayjs(selectedEvent.handledAt!).format('YYYY-MM-DD HH:mm')}
                </p>
              </div>
            )}

            {selectedEvent.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenHandleModal(selectedEvent);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  处理事件
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        visible={handleModalOpen}
        onClose={() => setHandleModalOpen(false)}
        title="处理风险事件"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">处理结果</label>
            <select
              value={handleStatus}
              onChange={(e) => setHandleStatus(e.target.value as any)}
              className="input"
            >
              <option value="reviewing">标记为处理中</option>
              <option value="resolved">标记为已解决</option>
              <option value="ignored">忽略此事件</option>
            </select>
          </div>
          <FormTextarea
            label="处理备注"
            value={handleNotes}
            onChange={(e) => setHandleNotes(e.target.value)}
            placeholder="请输入处理备注说明..."
            rows={4}
          />
          <div className="flex gap-3 pt-4">
            <button onClick={handleSubmitHandle} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              确认处理
            </button>
            <button onClick={() => setHandleModalOpen(false)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <X className="w-4 h-4" />
              取消
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
