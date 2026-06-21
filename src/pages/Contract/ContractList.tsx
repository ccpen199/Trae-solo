import { useState, useMemo } from 'react';
import {
  Layout,
  Button,
  Input,
  Select,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Card,
  Progress,
  Avatar,
  Tooltip,
  DatePicker,
  Dropdown,
  MenuProps,
  Statistic,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  BellOutlined,
  SendOutlined,
  TrophyOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { useAppStore } from '@/store';
import type { Contract, ContractStatus } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import DataCard from '@/components/common/DataCard';
import { formatMoney } from '@/utils';
import { cn } from '@/lib/utils';

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

/** 状态Tabs配置 */
const STATUS_TABS: { key: ContractStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'pending_sign', label: '待租客签' },
  { key: 'signing', label: '待房东签' },
  { key: 'active', label: '已签' },
  { key: 'expiring_soon', label: '即将到期' },
  { key: 'expired', label: '已到期' },
  { key: 'terminated', label: '违约' },
];

/** 支付周期选项 */
const PAYMENT_CYCLES = [
  { label: '月付', value: 'monthly' },
  { label: '季付', value: 'quarterly' },
  { label: '半年付', value: 'semiannual' },
  { label: '年付', value: 'annual' },
];

export default function ContractList() {
  const navigate = useNavigate();
  const { contracts, updateContractStatus } = useAppStore();

  const [activeTab, setActiveTab] = useState<ContractStatus | 'all'>('all');
  const [signDateRange, setSignDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [rentRange, setRentRange] = useState<[number, number] | null>(null);
  const [paymentCycle, setPaymentCycle] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [rentMin, setRentMin] = useState<string>('');
  const [rentMax, setRentMax] = useState<string>('');

  /** 统计数据 */
  const stats = useMemo(() => {
    const active = contracts.filter((c) => c.status === 'active').length;
    const pending = contracts.filter(
      (c) => c.status === 'pending_sign' || c.status === 'signing'
    ).length;
    const expiring = contracts.filter((c) => c.status === 'expiring_soon').length;
    const breached = contracts.filter((c) => c.status === 'terminated').length;
    return { active, pending, expiring, breached };
  }, [contracts]);

  /** 过滤后的合同列表 */
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (activeTab !== 'all' && c.status !== activeTab) return false;
      if (signDateRange) {
        const signTime = c.signTime ? dayjs(c.signTime) : dayjs(c.createTime);
        if (signTime.isBefore(signDateRange[0]) || signTime.isAfter(signDateRange[1])) return false;
      }
      if (rentMin && c.monthlyRent < Number(rentMin)) return false;
      if (rentMax && c.monthlyRent > Number(rentMax)) return false;
      if (paymentCycle && c.paymentCycle !== paymentCycle) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        const matched =
          c.contractNo.toLowerCase().includes(kw) ||
          c.tenantName.toLowerCase().includes(kw) ||
          c.propertyTitle.toLowerCase().includes(kw);
        if (!matched) return false;
      }
      return true;
    });
  }, [contracts, activeTab, signDateRange, rentMin, rentMax, paymentCycle, keyword]);

  /** 计算剩余天数百分比 */
  const getRemainingProgress = (contract: Contract): number => {
    const start = dayjs(contract.startDate);
    const end = dayjs(contract.endDate);
    const now = dayjs();
    const total = end.diff(start, 'day');
    if (total <= 0) return 0;
    const remaining = Math.max(0, end.diff(now, 'day'));
    return Math.round((remaining / total) * 100);
  };

  /** 获取剩余天数文字 */
  const getRemainingText = (contract: Contract): string => {
    const now = dayjs();
    const end = dayjs(contract.endDate);
    const days = end.diff(now, 'day');
    if (days < 0) return `已到期${Math.abs(days)}天`;
    if (days === 0) return '今日到期';
    return `剩余${days}天`;
  };

  /** 备案操作 */
  const handleRecord = (contract: Contract) => {
    message.success(`合同 ${contract.contractNo} 已提交住建委备案`);
  };

  /** 催签操作 */
  const handleUrge = (contract: Contract) => {
    message.success(`已向 ${contract.tenantName} 发送催签通知`);
  };

  /** 到期提醒 */
  const handleRemind = (contract: Contract) => {
    message.success(`已发送到期提醒：${contract.contractNo}`);
  };

  /** 状态下拉菜单 */
  const getStatusMenu = (contract: Contract): MenuProps => ({
    items: [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: '查看详情',
        onClick: () => navigate(`/contract/detail/${contract.id}`),
      },
      {
        key: 'record',
        icon: <FileTextOutlined />,
        label: '提交备案',
        onClick: () => handleRecord(contract),
      },
      {
        key: 'urge',
        icon: <SendOutlined />,
        label: '催签通知',
        onClick: () => handleUrge(contract),
      },
      {
        key: 'remind',
        icon: <BellOutlined />,
        label: '到期提醒',
        onClick: () => handleRemind(contract),
      },
    ],
  });

  /** 表格列定义 */
  const columns: ColumnsType<Contract> = [
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      key: 'contractNo',
      width: 200,
      fixed: 'left',
      render: (text: string, record) => (
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2">
            <a
              className="font-mono text-sm font-semibold text-brand-600 hover:text-brand-700"
              onClick={() => navigate(`/contract/detail/${record.id}`)}
            >
              {text}
            </a>
          </div>
          <div className="mt-1 flex gap-1">
            {record.caSignInfo?.evidenceNo && (
              <Tag color="blue" className="border-0 text-[10px]">
                住建委备案
              </Tag>
            )}
            {record.caSignInfo && (
              <Tag color="purple" className="border-0 text-[10px]">
                CA认证
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '房源信息',
      key: 'property',
      width: 220,
      render: (_, record) => (
        <div className="animate-fade-in-up flex items-center gap-3">
          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-ink-100">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #0F4C81 0%, #4787C7 100%)',
              }}
            >
              <div className="flex h-full w-full items-center justify-center text-white text-lg">
                🏠
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink-800" title={record.propertyTitle}>
              {record.propertyTitle}
            </div>
            <div className="mt-0.5 truncate text-xs text-ink-400" title={record.propertyAddress}>
              {record.propertyAddress}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '签约双方',
      key: 'parties',
      width: 180,
      render: (_, record) => (
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2">
            <Tooltip title={`租客: ${record.tenantName}`}>
              <Avatar size={28} className="bg-brand-500 text-white text-xs">
                {record.tenantName?.charAt(0)}
              </Avatar>
            </Tooltip>
            <div className="flex-1 min-w-0">
              <div className="truncate text-xs font-medium text-ink-700">{record.tenantName}</div>
              <div className="truncate text-[10px] text-ink-400">租客</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Tooltip title={`房东: ${record.landlordName}`}>
              <Avatar size={28} className="bg-warning-500 text-white text-xs">
                {record.landlordName?.charAt(0)}
              </Avatar>
            </Tooltip>
            <div className="flex-1 min-w-0">
              <div className="truncate text-xs font-medium text-ink-700">{record.landlordName}</div>
              <div className="truncate text-[10px] text-ink-400">房东</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '租约期限',
      key: 'term',
      width: 220,
      render: (_, record) => (
        <div className="animate-fade-in-up">
          <div className="text-xs font-mono text-ink-600 tabular-nums">
            {dayjs(record.startDate).format('YYYY-MM-DD')}
            <span className="mx-1 text-ink-300">~</span>
            {dayjs(record.endDate).format('YYYY-MM-DD')}
          </div>
          <div className="mt-2">
            <Progress
              percent={getRemainingProgress(record)}
              size="small"
              strokeColor={
                getRemainingProgress(record) > 50
                  ? '#00A86B'
                  : getRemainingProgress(record) > 20
                  ? '#FF6B35'
                  : '#E63946'
              }
              showInfo={false}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span className="text-ink-400">共 {record.leaseMonths} 个月</span>
            <span
              className={cn(
                'font-medium tabular-nums',
                getRemainingProgress(record) > 50
                  ? 'text-success-600'
                  : getRemainingProgress(record) > 20
                  ? 'text-warning-600'
                  : 'text-danger-600'
              )}
            >
              {getRemainingText(record)}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: '月租金 / 押金',
      key: 'rent',
      width: 160,
      render: (_, record) => (
        <div className="animate-fade-in-up">
          <div className="font-mono text-xl font-bold text-ink-800 tabular-nums">
            {formatMoney(record.monthlyRent, { decimals: 0 })}
          </div>
          {record.depositReductionRatio > 0 && (
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-gold-200 bg-gold-50 px-2 py-0.5">
              <TrophyOutlined className="text-gold-500 text-[10px]" />
              <span className="text-[11px] font-medium text-gold-700 tabular-nums">
                押金减{Math.round(record.depositReductionRatio * 100)}%
              </span>
            </div>
          )}
          <div className="mt-1 text-[10px] text-ink-400">
            押金: {formatMoney(record.actualDepositAmount, { decimals: 0 })}
          </div>
        </div>
      ),
    },
    {
      title: '支付周期',
      dataIndex: 'paymentCycle',
      key: 'paymentCycle',
      width: 90,
      render: (text: string) => (
        <Tag color="cyan" className="animate-fade-in-up border-0 text-xs">
          {text}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: ContractStatus) => (
        <div className="animate-fade-in-up">
          <StatusBadge status={status} type="contract" />
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space className="animate-fade-in-up" size={4} wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/contract/detail/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleRecord(record)}
          >
            备案
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleUrge(record)}
          >
            催签
          </Button>
          <Button
            type="link"
            size="small"
            icon={<BellOutlined />}
            onClick={() => handleRemind(record)}
          >
            提醒
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="min-h-screen bg-transparent">
      <Content className="p-6">
        <div className="animate-fade-in-up space-y-6">
          {/* 页面标题 + 统计卡片 */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="mb-1 font-serif text-2xl font-bold text-brand-800">
                合同管理中心
              </h1>
              <p className="text-sm text-ink-500">
                全流程电子签约 · CA 认证存证 · 住建委备案对接
              </p>
            </div>
            <Row gutter={12} className="!m-0">
              <Col span={6} className="!p-1.5">
                <DataCard
                  title="进行中"
                  value={stats.active}
                  prefix={<CheckCircleOutlined />}
                  accentColor="#00A86B"
                  className="!p-3 !min-w-[140px]"
                />
              </Col>
              <Col span={6} className="!p-1.5">
                <DataCard
                  title="待签约"
                  value={stats.pending}
                  prefix={<ClockCircleOutlined />}
                  accentColor="#FF6B35"
                  className="!p-3 !min-w-[140px]"
                />
              </Col>
              <Col span={6} className="!p-1.5">
                <DataCard
                  title="即将到期"
                  value={stats.expiring}
                  prefix={<WarningOutlined />}
                  accentColor="#F7931E"
                  className="!p-3 !min-w-[140px]"
                />
              </Col>
              <Col span={6} className="!p-1.5">
                <DataCard
                  title="违约"
                  value={stats.breached}
                  prefix={<ExclamationCircleOutlined />}
                  accentColor="#E63946"
                  className="!p-3 !min-w-[140px]"
                />
              </Col>
            </Row>
          </div>

          {/* 高级筛选卡片 */}
          <Card className="animate-fade-in-up shadow-card" bordered={false}>
            {/* 状态Tabs */}
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-ink-100 pb-4">
              {STATUS_TABS.map((tab) => {
                const count =
                  tab.key === 'all'
                    ? contracts.length
                    : contracts.filter((c) => c.status === tab.key).length;
                return (
                  <Button
                    key={tab.key}
                    type={activeTab === tab.key ? 'primary' : 'default'}
                    size="middle"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      activeTab === tab.key && '!bg-brand-500 !border-brand-500'
                    )}
                  >
                    <span>{tab.label}</span>
                    <Tag
                      color={activeTab === tab.key ? 'default' : 'blue'}
                      className="!ml-1 !text-[10px]"
                    >
                      {count}
                    </Tag>
                  </Button>
                );
              })}
            </div>

            {/* 筛选行 */}
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12} md={8} lg={6} xl={5}>
                <div className="mb-2 text-xs font-medium text-ink-500">签约日期</div>
                <RangePicker
                  className="w-full"
                  value={signDateRange}
                  onChange={(val) => setSignDateRange(val as [Dayjs, Dayjs] | null)}
                  placeholder={['开始日期', '结束日期']}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6} xl={5}>
                <div className="mb-2 text-xs font-medium text-ink-500">租金范围(元/月)</div>
                <Space.Compact className="w-full">
                  <Input
                    placeholder="最低"
                    value={rentMin}
                    onChange={(e) => setRentMin(e.target.value)}
                    className="w-1/2"
                  />
                  <Input
                    placeholder="最高"
                    value={rentMax}
                    onChange={(e) => setRentMax(e.target.value)}
                    className="w-1/2"
                  />
                </Space.Compact>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                <div className="mb-2 text-xs font-medium text-ink-500">支付周期</div>
                <Select
                  className="w-full"
                  placeholder="请选择"
                  allowClear
                  value={paymentCycle}
                  onChange={setPaymentCycle}
                >
                  {PAYMENT_CYCLES.map((p) => (
                    <Option key={p.value} value={p.value}>
                      {p.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={16} lg={6} xl={6}>
                <div className="mb-2 text-xs font-medium text-ink-500">关键词搜索</div>
                <Input
                  placeholder="合同号 / 租客名 / 房源"
                  prefix={<SearchOutlined className="text-ink-300" />}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={6} xl={4}>
                <div className="mb-2 h-4" />
                <Space>
                  <Button type="primary" icon={<SearchOutlined />}>
                    查询
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setActiveTab('all');
                      setSignDateRange(null);
                      setRentMin('');
                      setRentMax('');
                      setPaymentCycle(undefined);
                      setKeyword('');
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 主表格 */}
          <Card
            className="animate-fade-in-up shadow-card"
            bordered={false}
            title={
              <span className="font-medium text-ink-700">
                合同列表
                <span className="ml-2 text-sm font-normal text-ink-400">
                  共 {filteredContracts.length} 条记录
                </span>
              </span>
            }
          >
            <Table<Contract>
              rowKey="id"
              columns={columns}
              dataSource={filteredContracts}
              scroll={{ x: 1350, y: 520 }}
              sticky
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              rowClassName={(_, index) =>
                index % 2 === 0 ? 'bg-white' : 'bg-ink-50/40'
              }
            />
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
