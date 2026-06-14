import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Statistic, Tag, Button, Space, message, Modal } from 'antd';
import {
  AlertTriangle,
  Ban,
  MapPinOff,
  VideoOff,
  FileWarning,
  Clock,
  MessageSquare,
  Plus,
  Eye,
  UserCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockRiskTickets, mockOrders, mockNurses } from '@/mock';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import type { RiskTicket, RiskType, Severity, TicketStatus } from '@/types';
import {
  RISK_TYPE_MAP,
  SEVERITY_MAP,
  TICKET_STATUS_MAP,
} from '@/utils/constants';
import dayjs from 'dayjs';
import type { TableProps } from 'antd';

const RISK_TYPE_ICONS: Record<RiskType, React.ReactNode> = {
  'out-of-scope': <Ban className="h-5 w-5" />,
  'no-check-in': <MapPinOff className="h-5 w-5" />,
  'recording-interrupt': <VideoOff className="h-5 w-5" />,
  'data-mismatch': <FileWarning className="h-5 w-5" />,
  overtime: <Clock className="h-5 w-5" />,
  complaint: <MessageSquare className="h-5 w-5" />,
};

const RISK_TYPE_BG: Record<RiskType, string> = {
  'out-of-scope': 'bg-red-50 text-red-600 border-red-200',
  'no-check-in': 'bg-orange-50 text-orange-600 border-orange-200',
  'recording-interrupt': 'bg-amber-50 text-amber-600 border-amber-200',
  'data-mismatch': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  overtime: 'bg-lime-50 text-lime-700 border-lime-200',
  complaint: 'bg-cyan-50 text-cyan-600 border-cyan-200',
};

export default function RiskTicketList() {
  const navigate = useNavigate();
  const {
    riskTickets,
    setRiskTickets,
    orders,
    setOrders,
    nurses,
    setNurses,
    getRiskTickets,
    getOpenTicketCountByType,
    filterRiskTicketsByStatus,
    filterRiskTicketsBySeverity,
  } = useGlobalStore();

  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'all'>('all');
  const [selectedRiskType, setSelectedRiskType] = useState<RiskType | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (riskTickets.length === 0) {
      setRiskTickets(mockRiskTickets);
    }
    if (orders.length === 0) {
      setOrders(mockOrders);
    }
    if (nurses.length === 0) {
      setNurses(mockNurses);
    }
  }, [riskTickets.length, orders.length, nurses.length, setRiskTickets, setOrders, setNurses]);

  const openCountByType = useMemo(() => getOpenTicketCountByType(), [getOpenTicketCountByType]);
  const allTickets = useMemo(() => getRiskTickets(), [getRiskTickets]);

  const severityCounts = useMemo(() => {
    const counts: Record<Severity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    allTickets.forEach((t) => {
      counts[t.severity] = (counts[t.severity] || 0) + 1;
    });
    return counts;
  }, [allTickets]);

  const statusCounts = useMemo(() => {
    const counts: Record<TicketStatus, number> = { open: 0, investigating: 0, resolved: 0, closed: 0 };
    allTickets.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [allTickets]);

  const riskTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTickets.forEach((t) => {
      counts[t.riskType] = (counts[t.riskType] || 0) + 1;
    });
    return counts;
  }, [allTickets]);

  const filteredTickets = useMemo(() => {
    let result = [...allTickets];

    if (selectedSeverity !== 'all') {
      result = result.filter((t) => t.severity === selectedSeverity);
    }
    if (selectedStatus !== 'all') {
      result = result.filter((t) => t.status === selectedStatus);
    }
    if (selectedRiskType !== 'all') {
      result = result.filter((t) => t.riskType === selectedRiskType);
    }
    if (searchKeyword) {
      const lower = searchKeyword.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticketNo.includes(searchKeyword) ||
          t.orderNo.includes(searchKeyword) ||
          (t.nurseName && t.nurseName.toLowerCase().includes(lower)) ||
          (t.assigneeName && t.assigneeName.toLowerCase().includes(lower))
      );
    }

    return result;
  }, [allTickets, selectedSeverity, selectedStatus, selectedRiskType, searchKeyword]);

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleRefresh = () => {
    setRiskTickets([...mockRiskTickets]);
    message.success('数据已刷新');
  };

  const handleViewDetail = (ticket: RiskTicket) => {
    navigate(`/risk/tickets/${ticket.id}`);
  };

  const handleAssign = (ticket: RiskTicket) => {
    message.info(`正在为工单 ${ticket.ticketNo} 指派处理人`);
  };

  const handleProcess = (ticket: RiskTicket) => {
    navigate(`/risk/tickets/${ticket.id}?tab=process`);
  };

  const columns: TableProps<RiskTicket>['columns'] = useMemo(
    () => [
      {
        title: '工单号',
        dataIndex: 'ticketNo',
        key: 'ticketNo',
        width: 170,
        render: (text: string, record: RiskTicket) => (
          <a
            className="font-mono text-sm font-medium text-medical-600 hover:text-medical-700 hover:underline"
            onClick={() => handleViewDetail(record)}
          >
            {text}
          </a>
        ),
      },
      {
        title: '异常类型',
        dataIndex: 'riskType',
        key: 'riskType',
        width: 160,
        render: (type: RiskType) => {
          const config = RISK_TYPE_MAP[type];
          return (
            <Tag
              className={`inline-flex items-center gap-1 border px-2.5 py-1 !m-0 ${RISK_TYPE_BG[type]}`}
              style={{ borderColor: config.color + '40' }}
            >
              {RISK_TYPE_ICONS[type]}
              <span className="text-xs font-medium">{config.label}</span>
            </Tag>
          );
        },
      },
      {
        title: '严重程度',
        dataIndex: 'severity',
        key: 'severity',
        width: 110,
        render: (severity: Severity) => {
          const config = SEVERITY_MAP[severity];
          const isCritical = severity === 'critical' || severity === 'high';
          return (
            <div
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                isCritical
                  ? 'border-2 border-red-300 bg-red-50 animate-pulse'
                  : ''
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${config.dotColor}`}
              />
              <span className={`text-sm font-semibold ${config.color}`}>
                {config.label}
              </span>
              {isCritical && (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              )}
            </div>
          );
        },
      },
      {
        title: '关联订单',
        dataIndex: 'orderNo',
        key: 'orderNo',
        width: 170,
        render: (text: string, record: RiskTicket) => (
          <a
            className="font-mono text-sm text-slate-600 hover:text-medical-600 hover:underline"
            onClick={() => navigate(`/orders/${record.orderId}`)}
          >
            {text}
          </a>
        ),
      },
      {
        title: '护士',
        dataIndex: 'nurseName',
        key: 'nurseName',
        width: 110,
        render: (name?: string) => (
          <span className="text-sm text-slate-700">{name || '-'}</span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status: TicketStatus) => (
          <StatusBadge type="ticket" status={status} />
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 170,
        render: (time: string) => (
          <div className="space-y-0.5">
            <div className="text-sm text-slate-800">
              {dayjs(time).format('YYYY-MM-DD')}
            </div>
            <div className="text-xs text-slate-400">
              {dayjs(time).format('HH:mm:ss')}
            </div>
          </div>
        ),
      },
      {
        title: '处理人',
        dataIndex: 'assigneeName',
        key: 'assigneeName',
        width: 120,
        render: (name?: string) => (
          <span className="text-sm text-slate-600">
            {name || <span className="text-slate-400">-</span>}
          </span>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 220,
        fixed: 'right',
        render: (_, record: RiskTicket) => (
          <Space size="small">
            {record.status === 'open' && (
              <Button
                type="link"
                size="small"
                icon={<UserCheck className="h-3.5 w-3.5" />}
                onClick={() => handleAssign(record)}
              >
                分配
              </Button>
            )}
            <Button
              type="link"
              size="small"
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => handleViewDetail(record)}
            >
              查看
            </Button>
            {(record.status === 'open' || record.status === 'investigating') && (
              <Button
                type="link"
                size="small"
                icon={<CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
                onClick={() => handleProcess(record)}
                className="!text-emerald-600"
              >
                处理
              </Button>
            )}
            {record.status === 'investigating' && (
              <Button
                type="link"
                size="small"
                danger
                icon={<XCircle className="h-3.5 w-3.5" />}
                onClick={() =>
                  Modal.confirm({
                    title: '关闭工单',
                    content: `确定要关闭工单 ${record.ticketNo} 吗？`,
                    okText: '确认关闭',
                    cancelText: '取消',
                    onOk: () => message.success('工单已关闭'),
                  })
                }
              >
                关闭
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [navigate]
  );

  const riskTypeOrder: RiskType[] = [
    'out-of-scope',
    'no-check-in',
    'recording-interrupt',
    'data-mismatch',
    'overtime',
    'complaint',
  ];

  const totalOpen = Object.values(openCountByType).reduce((s, v) => s + v, 0);

  return (
    <div className="p-6">
      <PageHeader
        title="风控工单中心"
        description="异常操作实时告警，工单全流程追踪闭环管理"
        icon={
          <AlertTriangle className="h-6 w-6" />
        }
        actions={[
          {
            key: 'create',
            label: '手动创建工单',
            type: 'primary',
            icon: <Plus className="h-4 w-4" />,
            onClick: () => message.info('打开创建工单弹窗'),
          },
        ]}
      />

      <div className="mb-6 grid grid-cols-6 gap-4">
        {riskTypeOrder.map((type) => {
          const config = RISK_TYPE_MAP[type];
          const count = openCountByType[type] || 0;
          const bgClass = RISK_TYPE_BG[type];
          return (
            <Card
              key={type}
              className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                count > 0 ? 'border-opacity-60' : 'border-transparent'
              }`}
              style={{ borderColor: count > 0 ? config.color : undefined }}
              onClick={() => setSelectedRiskType(type)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className={`inline-flex items-center justify-center rounded-xl p-2 ${bgClass}`}
                  >
                    {RISK_TYPE_ICONS[type]}
                  </div>
                  <Statistic
                    title={<span className="text-xs text-slate-500">{config.label}</span>}
                    value={count}
                    className="mt-3"
                    valueStyle={{ color: count > 0 ? config.color : '#94A3B8', fontSize: 28, fontWeight: 700 }}
                  />
                </div>
                {count > 0 && (
                  <div
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: config.color + '15', color: config.color }}
                  >
                    待处理
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 space-y-4">
          <Card
            title={
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-semibold">严重程度</span>
              </div>
            }
            size="small"
            className="shadow-sm"
          >
            <div className="space-y-1">
              <div
                className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                  selectedSeverity === 'all'
                    ? 'bg-medical-50 text-medical-700'
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => setSelectedSeverity('all')}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-slate-400 via-amber-400 to-red-500" />
                  <span className="text-sm font-medium">全部</span>
                </div>
                <span className="text-xs text-slate-500">{allTickets.length}</span>
              </div>
              {(Object.keys(SEVERITY_MAP) as Severity[]).map((sev) => {
                const config = SEVERITY_MAP[sev];
                return (
                  <div
                    key={sev}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                      selectedSeverity === sev
                        ? 'bg-medical-50 text-medical-700'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedSeverity(sev)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${config.dotColor}`}
                      />
                      <span className={`text-sm font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{severityCounts[sev] || 0}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-medical-600" />
                <span className="font-semibold">工单状态</span>
              </div>
            }
            size="small"
            className="shadow-sm"
          >
            <div className="space-y-1">
              <div
                className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                  selectedStatus === 'all'
                    ? 'bg-medical-50 text-medical-700'
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => setSelectedStatus('all')}
              >
                <span className="text-sm font-medium">全部状态</span>
                <span className="text-xs text-slate-500">{allTickets.length}</span>
              </div>
              {(Object.keys(TICKET_STATUS_MAP) as TicketStatus[]).map((st) => {
                const config = TICKET_STATUS_MAP[st];
                return (
                  <div
                    key={st}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                      selectedStatus === st
                        ? 'bg-medical-50 text-medical-700'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedStatus(st)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-sm font-medium" style={{ color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{statusCounts[st] || 0}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="font-semibold">异常类型</span>
              </div>
            }
            size="small"
            className="shadow-sm"
          >
            <div className="space-y-1">
              <div
                className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                  selectedRiskType === 'all'
                    ? 'bg-medical-50 text-medical-700'
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => setSelectedRiskType('all')}
              >
                <span className="text-sm font-medium">全部类型</span>
                <span className="text-xs text-slate-500">{allTickets.length}</span>
              </div>
              {riskTypeOrder.map((type) => {
                const config = RISK_TYPE_MAP[type];
                return (
                  <div
                    key={type}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                      selectedRiskType === type
                        ? 'bg-medical-50 text-medical-700'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedRiskType(type)}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: config.color }}>
                        {RISK_TYPE_ICONS[type]}
                      </span>
                      <span className="text-sm font-medium" style={{ color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{riskTypeCounts[type] || 0}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="col-span-3">
          <DataTable<RiskTicket>
            columns={columns}
            dataSource={filteredTickets}
            rowKey="id"
            onSearch={handleSearch}
            onRefresh={handleRefresh}
            searchPlaceholder="搜索工单号、订单号、护士或处理人"
            totalLabel="共"
            scroll={{ x: 1400 }}
            showFilter={false}
          />
        </div>
      </div>
    </div>
  );
}
