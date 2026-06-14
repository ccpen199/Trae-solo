import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dropdown, Space, Tag, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  HeartHandshake,
  Baby,
  Activity,
  Feather,
  Eye,
  FileText,
  Send,
  MoreHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockOrders, mockNurses } from '@/mock';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import PatientTypeTag from '@/components/PatientTypeTag';
import StatusBadge from '@/components/StatusBadge';
import type { ServiceOrder, PatientType, RiskLevel, OrderStatus } from '@/types';
import {
  PATIENT_TYPE_MAP,
  PATIENT_TYPE_OPTIONS,
  RISK_LEVEL_OPTIONS,
  ORDER_STATUS_OPTIONS,
} from '@/utils/constants';
import { formatCurrency } from '@/utils';
import dayjs from 'dayjs';

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

const riskLevelColor: Record<RiskLevel, string> = {
  low: 'text-emerald-600 bg-emerald-50',
  medium: 'text-amber-600 bg-amber-50',
  high: 'text-orange-600 bg-orange-50',
  critical: 'text-red-600 bg-red-50',
};

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
          o.patientInfo.phone.includes(searchKeyword)
      );
    }

    if (filters.status) {
      result = result.filter((o) => o.status === filters.status);
    }
    if (filters.riskLevel) {
      result = result.filter((o) => o.riskLevel === filters.riskLevel);
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
    navigate(`/risk-assessment/${order.id}`);
  };

  const handleDispatch = (order: ServiceOrder) => {
    navigate(`/orders/${order.id}?tab=nurse`);
  };

  const getActionMenu = (order: ServiceOrder): MenuProps['items'] => [
    {
      key: 'view',
      label: '查看详情',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => handleViewDetail(order),
    },
    {
      key: 'risk',
      label: '风险评估',
      icon: <AlertTriangle className="h-4 w-4" />,
      onClick: () => handleRiskAssessment(order),
    },
    ...(order.status === 'risk-assessed' || order.status === 'created'
      ? [
          {
            key: 'dispatch',
            label: '派单',
            icon: <Send className="h-4 w-4" />,
            onClick: () => handleDispatch(order),
          },
        ]
      : []),
  ];

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text: string) => (
        <span className="font-mono text-sm font-medium text-slate-900">{text}</span>
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
              {record.patientInfo.gender === 'male' ? '男' : '女'} {record.patientInfo.age}岁
            </span>
          </div>
          <div className="text-sm text-slate-500">{record.patientInfo.phone}</div>
          <div className="text-xs text-slate-400 truncate max-w-[180px]">
            {record.patientInfo.address}
          </div>
        </div>
      ),
    },
    {
      title: '服务项目',
      key: 'serviceItems',
      width: 200,
      render: (_: unknown, record: ServiceOrder) => (
        <div className="flex flex-wrap gap-1">
          {record.serviceItems.map((item) => (
            <Tag key={item.code} className="m-0">
              {item.name}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: RiskLevel) => (
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${riskLevelColor[level]}`}
        >
          <AlertTriangle className="h-3 w-3" />
          {{
            low: '低风险',
            medium: '中风险',
            high: '高风险',
            critical: '极高风险',
          }[level]}
        </span>
      ),
    },
    {
      title: '预约时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 160,
      render: (time: string) => (
        <div className="space-y-0.5">
          <div className="text-sm text-slate-900">{dayjs(time).format('YYYY-MM-DD')}</div>
          <div className="text-xs text-slate-500">{dayjs(time).format('HH:mm')}</div>
        </div>
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
      title: '护士',
      key: 'nurse',
      width: 120,
      render: (_: unknown, record: ServiceOrder) =>
        record.nurseInfo ? (
          <div className="space-y-0.5">
            <div className="text-sm font-medium text-slate-900">{record.nurseInfo.name}</div>
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
      width: 100,
      render: (value: number) => (
        <span className="font-medium text-slate-900">{formatCurrency(value)}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
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
            className={selectedPatientType !== 'all' && selectedPatientType !== type ? 'opacity-50' : ''}
          />
        ))}
      </div>

      <DataTable<ServiceOrder>
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        showSearch
        searchPlaceholder="搜索订单号、患者姓名、手机号"
        onSearch={handleSearch}
        showFilter
        filterFields={[
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
        scroll={{ x: 1600 }}
      />
    </div>
  );
}
