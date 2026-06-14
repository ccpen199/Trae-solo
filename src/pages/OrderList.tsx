import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dropdown, message } from 'antd';
import type { MenuProps, TableProps } from 'antd';
import {
  HeartHandshake,
  Baby,
  Activity,
  Feather,
  Eye,
  FileText,
  AlertTriangle,
  MoreHorizontal,
  ShieldCheck,
  Video,
  ClipboardList,
  FileCheck,
  Ticket,
  Play,
  Star,
  Check,
  X,
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockOrders, mockNurses } from '@/mock';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import PatientTypeTag from '@/components/PatientTypeTag';
import StatusBadge from '@/components/StatusBadge';
import type {
  ServiceOrder,
  PatientType,
  OrderStatus,
  RiskAssessmentStatus,
  PolicyStatus,
  RecordingStatus,
  DataBindingStatus,
} from '@/types';
import {
  PATIENT_TYPE_MAP,
  PATIENT_TYPE_OPTIONS,
  RISK_LEVEL_OPTIONS,
  ORDER_STATUS_OPTIONS,
  POLICY_STATUS_MAP,
} from '@/utils/constants';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';

const patientTypeCards: { type: PatientType; gradient: 'orange' | 'pink' | 'blue' | 'purple' }[] = [
  { type: 'elderly', gradient: 'orange' },
  { type: 'maternal', gradient: 'pink' },
  { type: 'post-hospital', gradient: 'blue' },
  { type: 'hospice', gradient: 'purple' },
];

const iconMap: Record<PatientType, React.ReactNode> = {
  elderly: <HeartHandshake className="h-5 w-5" />,
  maternal: <Baby className="h-5 w-5" />,
  'post-hospital': <Activity className="h-5 w-5" />,
  hospice: <Feather className="h-5 w-5" />,
};



const riskAssessmentStatusConfig: Record<
  RiskAssessmentStatus,
  { label: string; className: string }
> = {
  'not-triggered': {
    label: '未触发',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  triggered: {
    label: '已触发',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  'in-progress': {
    label: '进行中',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  completed: {
    label: '已完成',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

const recordingStatusConfig: Record<
  RecordingStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  'not-started': {
    label: '未开始',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  recording: {
    label: '录制中',
    className: 'bg-red-50 text-red-700 border-red-200',
    pulse: true,
  },
  paused: {
    label: '已暂停',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  completed: {
    label: '已完成',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  interrupted: {
    label: '已中断',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

const dataBindingStatusConfig: Record<
  DataBindingStatus,
  { label: string; className: string }
> = {
  'not-bound': {
    label: '未绑定',
    className: 'text-slate-500',
  },
  partial: {
    label: '部分绑定',
    className: 'text-amber-600',
  },
  'fully-bound': {
    label: '完全绑定',
    className: 'text-emerald-600',
  },
};

const RISK_ASSESSMENT_STATUS_OPTIONS = [
  { label: '未触发', value: 'not-triggered' as RiskAssessmentStatus },
  { label: '已触发', value: 'triggered' as RiskAssessmentStatus },
  { label: '进行中', value: 'in-progress' as RiskAssessmentStatus },
  { label: '已完成', value: 'completed' as RiskAssessmentStatus },
];

const INSURANCE_STATUS_OPTIONS = [
  { label: '投保中', value: 'pending' as PolicyStatus },
  { label: '保障中', value: 'active' as PolicyStatus },
  { label: '已过期', value: 'expired' as PolicyStatus },
  { label: '理赔中', value: 'claimed' as PolicyStatus },
];

const RECORDING_STATUS_OPTIONS = [
  { label: '未开始', value: 'not-started' as RecordingStatus },
  { label: '录制中', value: 'recording' as RecordingStatus },
  { label: '已暂停', value: 'paused' as RecordingStatus },
  { label: '已完成', value: 'completed' as RecordingStatus },
  { label: '已中断', value: 'interrupted' as RecordingStatus },
];

const DATA_BINDING_STATUS_OPTIONS = [
  { label: '未绑定', value: 'not-bound' as DataBindingStatus },
  { label: '部分绑定', value: 'partial' as DataBindingStatus },
  { label: '完全绑定', value: 'fully-bound' as DataBindingStatus },
];

export default function OrderList() {
  const navigate = useNavigate();
  const { orders, setOrders, nurses, setNurses } = useGlobalStore();
  const [selectedPatientType, setSelectedPatientType] = useState<PatientType | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});

  useEffect(() => {
    if (orders.length === 0) {
      setOrders(mockOrders);
    }
    if (nurses.length === 0) {
      setNurses(mockNurses);
    }
  }, [orders.length, nurses.length, setOrders, setNurses]);

  const patientTypeCounts = useMemo(() => {
    const counts: Record<PatientType, number> = {
      elderly: 0,
      maternal: 0,
      'post-hospital': 0,
      hospice: 0,
    };
    orders.forEach((order) => {
      counts[order.patientType]++;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (selectedPatientType !== 'all') {
      result = result.filter((o) => o.patientType === selectedPatientType);
    }

    if (searchKeyword) {
      const lower = searchKeyword.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNo.includes(searchKeyword) ||
          o.patientInfo.name.toLowerCase().includes(lower) ||
          o.patientInfo.phone.includes(searchKeyword) ||
          (o.nurseInfo?.name && o.nurseInfo.name.toLowerCase().includes(lower))
      );
    }

    if (filters.status) {
      result = result.filter((o) => o.status === filters.status);
    }
    if (filters.riskLevel) {
      result = result.filter((o) => o.riskLevel === filters.riskLevel);
    }
    if (filters.patientType) {
      result = result.filter((o) => o.patientType === filters.patientType);
    }
    if (filters.riskAssessmentStatus) {
      result = result.filter((o) => o.riskAssessmentStatus === filters.riskAssessmentStatus);
    }
    if (filters.insuranceStatus) {
      result = result.filter((o) => o.insuranceStatus === filters.insuranceStatus);
    }
    if (filters.recordingStatus) {
      result = result.filter((o) => o.recordingStatus === filters.recordingStatus);
    }
    if (filters.dataBindingStatus) {
      result = result.filter((o) => o.dataBindingStatus === filters.dataBindingStatus);
    }
    if (filters.hasNurse === 'yes') {
      result = result.filter((o) => !!o.nurseId);
    } else if (filters.hasNurse === 'no') {
      result = result.filter((o) => !o.nurseId);
    }

    return result;
  }, [orders, selectedPatientType, searchKeyword, filters]);

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleFilter = (newFilters: Record<string, string | number | undefined>) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    setOrders([...mockOrders]);
    message.success('数据已刷新');
  };

  const handleViewDetail = (order: ServiceOrder) => {
    navigate(`/orders/${order.id}`);
  };

  const handleRiskAssessment = (order: ServiceOrder) => {
    navigate(`/orders/${order.id}/risk-assessment`);
  };

  const handleServiceRecord = (order: ServiceOrder) => {
    navigate(`/service/${order.id}/record`);
  };

  const handleAudit = (order: ServiceOrder) => {
    navigate(`/audit/${order.id}`);
  };

  const handleTicket = (order: ServiceOrder) => {
    navigate('/risk/tickets');
  };

  const handleViewPolicy = (order: ServiceOrder) => {
    if (order.policyId) {
      navigate(`/insurance/${order.policyId}`);
    }
  };

  const handleViewRecording = (order: ServiceOrder) => {
    if (order.id) {
      navigate(`/service/${order.id}/record`);
    }
  };

  const getActionMenu = (order: ServiceOrder): MenuProps['items'] => [
    {
      key: 'view',
      label: '查看详情',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => handleViewDetail(order),
    },
    ...(order.riskAssessmentStatus !== 'completed'
      ? [
          {
            key: 'risk',
            label: '风险评估',
            icon: <AlertTriangle className="h-4 w-4" />,
            onClick: () => handleRiskAssessment(order),
          },
        ]
      : []),
    ...(order.serviceRecordId
      ? [
          {
            key: 'record',
            label: '服务记录',
            icon: <ClipboardList className="h-4 w-4" />,
            onClick: () => handleServiceRecord(order),
          },
        ]
      : []),
    {
      key: 'audit',
      label: '审核',
      icon: <FileCheck className="h-4 w-4" />,
      onClick: () => handleAudit(order),
    },
    {
      key: 'ticket',
      label: '工单',
      icon: <Ticket className="h-4 w-4" />,
      onClick: () => handleTicket(order),
    },
  ];

  const getRowClassName = (record: ServiceOrder) => {
    if (record.riskLevel === 'critical') {
      return 'bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-150';
    }
    if (record.riskLevel === 'high') {
      return 'bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-150';
    }
    return '';
  };

  const columns: TableProps<ServiceOrder>['columns'] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text: string, record: ServiceOrder) => (
        <button
          onClick={() => navigate(`/orders/${record.id}`)}
          className="font-mono text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {text}
        </button>
      ),
    },
    {
      title: '患者类型',
      dataIndex: 'patientType',
      key: 'patientType',
      width: 120,
      render: (type: PatientType) => <PatientTypeTag type={type} />,
    },
    {
      title: '患者信息',
      key: 'patientInfo',
      width: 200,
      render: (_: unknown, record: ServiceOrder) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{record.patientInfo.name}</span>
            <span className="text-sm text-slate-500">
              {record.patientInfo.gender === 'male' ? '男' : '女'}{' '}
              {record.patientInfo.age}岁
            </span>
          </div>
          <div className="text-sm text-slate-500">{record.patientInfo.phone}</div>
        </div>
      ),
    },
    {
      title: '服务项目',
      key: 'serviceItems',
      width: 180,
      render: (_: unknown, record: ServiceOrder) => {
        const firstItem = record.serviceItems[0];
        const count = record.serviceItems.length;
        return (
          <div className="text-sm">
            <span className="text-slate-900">{firstItem?.name || '-'}</span>
            {count > 1 && (
              <span className="text-slate-500 ml-1">等{count}项</span>
            )}
          </div>
        );
      },
    },
    {
      title: '风险评估状态',
      key: 'riskAssessmentStatus',
      width: 200,
      render: (_: unknown, record: ServiceOrder) => {
        const config = riskAssessmentStatusConfig[record.riskAssessmentStatus];
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium',
                  config.className
                )}
              >
                {config.label}
              </span>
              {record.riskAssessmentStatus === 'completed' && (
                <StatusBadge type="risk" status={record.riskLevel} showDot />
              )}
            </div>
            {record.riskAssessmentStatus !== 'completed' && (
              <Button
                type="primary"
                size="small"
                icon={<Play className="h-3 w-3" />}
                onClick={() => handleRiskAssessment(record)}
                className="h-7 px-2 text-xs"
              >
                触发评估
              </Button>
            )}
          </div>
        );
      },
    },
    {
      title: '投保状态',
      key: 'insuranceStatus',
      width: 160,
      render: (_: unknown, record: ServiceOrder) => {
        const config = POLICY_STATUS_MAP[record.insuranceStatus];
        return (
          <div className="space-y-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                config.bgColor
              )}
            >
              {record.insuranceStatus === 'active' && (
                <ShieldCheck className="h-3 w-3" />
              )}
              {config.label}
            </span>
            {record.insuranceStatus === 'active' && record.policyId && (
              <button
                onClick={() => handleViewPolicy(record)}
                className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                查看保单
              </button>
            )}
          </div>
        );
      },
    },
    {
      title: '双录状态',
      key: 'recordingStatus',
      width: 160,
      render: (_: unknown, record: ServiceOrder) => {
        const config = recordingStatusConfig[record.recordingStatus];
        return (
          <div className="space-y-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium',
                config.className
              )}
            >
              {config.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
              {config.label}
            </span>
            {record.recordingId && (
              <button
                onClick={() => handleViewRecording(record)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Video className="h-3 w-3" />
                查看录像
              </button>
            )}
          </div>
        );
      },
    },
    {
      title: '服务记录绑定状态',
      key: 'dataBindingStatus',
      width: 180,
      render: (_: unknown, record: ServiceOrder) => {
        const config = dataBindingStatusConfig[record.dataBindingStatus];
        return (
          <div className="space-y-2">
            <span className={cn('text-sm font-medium', config.className)}>
              {config.label}
            </span>
            <div className="flex flex-wrap gap-1">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs',
                  record.hasNursingNotes
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {record.hasNursingNotes ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                护理记录
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs',
                  record.hasMedicationList
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {record.hasMedicationList ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                用药
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs',
                  record.hasVitalSigns
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {record.hasVitalSigns ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                体征
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: '护士',
      key: 'nurse',
      width: 140,
      render: (_: unknown, record: ServiceOrder) =>
        record.nurseInfo ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-sm font-medium text-slate-900">
              {record.nurseInfo.name}
              <span className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-amber-400" />
                {nurses.find((n) => n.id === record.nurseId)?.rating.toFixed(1) ||
                  '5.0'}
              </span>
            </div>
            <div className="text-xs text-slate-500">{record.nurseInfo.phone}</div>
          </div>
        ) : (
          <span className="text-sm text-slate-400">未指派</span>
        ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 110,
      render: (value: number) => (
        <span className="font-medium text-slate-900">{formatCurrency(value)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: OrderStatus) => <StatusBadge type="order" status={status} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: ServiceOrder) => (
        <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreHorizontal className="h-4 w-4" />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="订单调度中心"
        description="订单全流程管理与智能调度"
        icon={<FileText className="h-6 w-6" />}
      />

      <div className="mb-6 grid grid-cols-4 gap-4">
        {patientTypeCards.map(({ type, gradient }) => (
          <StatCard
            key={type}
            title={PATIENT_TYPE_MAP[type].label}
            value={patientTypeCounts[type]}
            icon={iconMap[type]}
            gradient={gradient}
            onClick={() =>
              setSelectedPatientType(selectedPatientType === type ? 'all' : type)
            }
            className={cn(
              'cursor-pointer transition-all duration-200',
              selectedPatientType === type
                ? 'scale-105 shadow-lg ring-2 ring-offset-2 ring-blue-500'
                : selectedPatientType !== 'all'
                ? 'opacity-50'
                : 'hover:scale-102 hover:shadow-md'
            )}
          />
        ))}
      </div>

      <DataTable<ServiceOrder>
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        showSearch
        searchPlaceholder="搜索订单号、患者姓名、手机号、护士姓名"
        onSearch={handleSearch}
        showFilter
        filterFields={[
          {
            key: 'patientType',
            label: '患者类型',
            type: 'select',
            options: PATIENT_TYPE_OPTIONS,
          },
          {
            key: 'status',
            label: '订单状态',
            type: 'select',
            options: ORDER_STATUS_OPTIONS,
          },
          {
            key: 'riskLevel',
            label: '风险等级',
            type: 'select',
            options: RISK_LEVEL_OPTIONS,
          },
          {
            key: 'riskAssessmentStatus',
            label: '风险评估状态',
            type: 'select',
            options: RISK_ASSESSMENT_STATUS_OPTIONS,
          },
          {
            key: 'insuranceStatus',
            label: '投保状态',
            type: 'select',
            options: INSURANCE_STATUS_OPTIONS,
          },
          {
            key: 'recordingStatus',
            label: '录制状态',
            type: 'select',
            options: RECORDING_STATUS_OPTIONS,
          },
          {
            key: 'dataBindingStatus',
            label: '数据绑定状态',
            type: 'select',
            options: DATA_BINDING_STATUS_OPTIONS,
          },
          {
            key: 'hasNurse',
            label: '是否派单',
            type: 'select',
            placeholder: '全部',
            options: [
              { label: '已派单', value: 'yes' },
              { label: '未派单', value: 'no' },
            ],
          },
        ]}
        onFilter={handleFilter}
        showRefresh
        onRefresh={handleRefresh}
        scroll={{ x: 2000 }}
        rowClassName={getRowClassName}
      />
    </div>
  );
}
