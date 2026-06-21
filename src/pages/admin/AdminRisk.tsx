import React, { useState, useMemo } from 'react';
import {
  Tabs,
  Table,
  Button,
  Image,
  Modal,
  Form,
  Input,
  Rate,
  Slider,
  Tag,
  Avatar,
  Space,
  Drawer,
  Card,
  Progress,
  Row,
  Col,
  InputNumber,
  Switch,
  Tooltip,
  List,
  Typography,
  message,
  Badge,
  Statistic,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import type { ColumnsType } from 'antd/es/table';
import type { EChartsOption } from 'echarts';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileCheck,
  Building2,
  CreditCard,
  Ban,
  Settings,
  Search,
  UserX,
  Gauge,
  TrendingUp,
  Wallet,
  Truck,
  User,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  FileText,
  Eye,
} from 'lucide-react';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface DriverAuthItem {
  key: string;
  id: string;
  name: string;
  phone: string;
  avatar: string;
  creditScore: number;
  idCard: { front: string; back: string };
  driverLicense: string;
  vehicleLicense: { plate: string; type: string; expire: string };
  submitTime: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AdvanceItem {
  key: string;
  id: string;
  driverName: string;
  driverAvatar: string;
  orderNo: string;
  route: string;
  orderAmount: number;
  requestAmount: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'reject';
  dimensions: {
    historyRepay: number;
    creditScore: number;
    orderStability: number;
    routeRisk: number;
  };
  suggestRatio: number;
  deadline: string;
}

interface BlacklistItem {
  key: string;
  id: string;
  type: 'driver' | 'shipper';
  name: string;
  phone: string;
  avatar: string;
  reason: string;
  banTime: string;
  expireTime: string;
  operator: string;
}

const driverAuthMock: DriverAuthItem[] = [
  {
    key: '1',
    id: 'D202406001',
    name: '王志强',
    phone: '138****8823',
    avatar: '王',
    creditScore: 4.7,
    idCard: { front: 'https://picsum.photos/seed/id1f/240/150', back: 'https://picsum.photos/seed/id1b/240/150' },
    driverLicense: 'https://picsum.photos/seed/dl1/240/150',
    vehicleLicense: { plate: '京A·F8823', type: '重型半挂车', expire: '2027-05-12' },
    submitTime: '2024-06-07 10:23:18',
    status: 'pending',
  },
  {
    key: '2',
    id: 'D202406002',
    name: '李明辉',
    phone: '139****2568',
    avatar: '李',
    creditScore: 4.9,
    idCard: { front: 'https://picsum.photos/seed/id2f/240/150', back: 'https://picsum.photos/seed/id2b/240/150' },
    driverLicense: 'https://picsum.photos/seed/dl2/240/150',
    vehicleLicense: { plate: '沪B·K2568', type: '重型厢式货车', expire: '2028-03-22' },
    submitTime: '2024-06-07 09:15:42',
    status: 'pending',
  },
  {
    key: '3',
    id: 'D202406003',
    name: '张建军',
    phone: '137****7721',
    avatar: '张',
    creditScore: 4.5,
    idCard: { front: 'https://picsum.photos/seed/id3f/240/150', back: 'https://picsum.photos/seed/id3b/240/150' },
    driverLicense: 'https://picsum.photos/seed/dl3/240/150',
    vehicleLicense: { plate: '粤A·Q7721', type: '中型栏板货车', expire: '2026-11-08' },
    submitTime: '2024-06-07 08:42:05',
    status: 'pending',
  },
  {
    key: '4',
    id: 'D202406004',
    name: '刘德胜',
    phone: '136****3091',
    avatar: '刘',
    creditScore: 4.8,
    idCard: { front: 'https://picsum.photos/seed/id4f/240/150', back: 'https://picsum.photos/seed/id4b/240/150' },
    driverLicense: 'https://picsum.photos/seed/dl4/240/150',
    vehicleLicense: { plate: '川A·R3091', type: '重型集装箱车', expire: '2027-09-15' },
    submitTime: '2024-06-06 22:18:36',
    status: 'approved',
  },
  {
    key: '5',
    id: 'D202406005',
    name: '陈志远',
    phone: '135****1288',
    avatar: '陈',
    creditScore: 4.2,
    idCard: { front: 'https://picsum.photos/seed/id5f/240/150', back: 'https://picsum.photos/seed/id5b/240/150' },
    driverLicense: 'https://picsum.photos/seed/dl5/240/150',
    vehicleLicense: { plate: '浙A·S1288', type: '轻型仓栅货车', expire: '2025-08-03' },
    submitTime: '2024-06-06 19:55:12',
    status: 'rejected',
  },
];

const shipperAuthMock: DriverAuthItem[] = [
  {
    key: '11',
    id: 'S202406001',
    name: '上海宏远物流有限公司',
    phone: '021-8888****',
    avatar: '宏',
    creditScore: 4.8,
    idCard: { front: 'https://picsum.photos/seed/b1/240/150', back: '' },
    driverLicense: '',
    vehicleLicense: { plate: '-', type: '企业营业执照', expire: '2028-12-31' },
    submitTime: '2024-06-07 09:32:11',
    status: 'pending',
  },
];

const advanceMock: AdvanceItem[] = [
  {
    key: '1',
    id: 'Y20240607001',
    driverName: '王志强',
    driverAvatar: '王',
    orderNo: 'YD202406078821',
    route: '北京 → 济南',
    orderAmount: 12800,
    requestAmount: 8000,
    riskScore: 18,
    riskLevel: 'low',
    dimensions: { historyRepay: 95, creditScore: 94, orderStability: 88, routeRisk: 92 },
    suggestRatio: 70,
    deadline: '2024-06-07 16:00',
  },
  {
    key: '2',
    id: 'Y20240607002',
    driverName: '李明辉',
    driverAvatar: '李',
    orderNo: 'YD202406078923',
    route: '上海 → 合肥',
    orderAmount: 9600,
    requestAmount: 7200,
    riskScore: 42,
    riskLevel: 'medium',
    dimensions: { historyRepay: 82, creditScore: 78, orderStability: 75, routeRisk: 80 },
    suggestRatio: 55,
    deadline: '2024-06-07 17:30',
  },
  {
    key: '3',
    id: 'Y20240607003',
    driverName: '张建军',
    driverAvatar: '张',
    orderNo: 'YD202406079012',
    route: '广州 → 长沙',
    orderAmount: 15200,
    requestAmount: 12000,
    riskScore: 72,
    riskLevel: 'high',
    dimensions: { historyRepay: 58, creditScore: 55, orderStability: 42, routeRisk: 60 },
    suggestRatio: 30,
    deadline: '2024-06-07 15:45',
  },
  {
    key: '4',
    id: 'Y20240607004',
    driverName: '赵磊',
    driverAvatar: '赵',
    orderNo: 'YD202406079088',
    route: '深圳 → 武汉',
    orderAmount: 18500,
    requestAmount: 16000,
    riskScore: 91,
    riskLevel: 'reject',
    dimensions: { historyRepay: 32, creditScore: 28, orderStability: 18, routeRisk: 35 },
    suggestRatio: 0,
    deadline: '2024-06-07 18:00',
  },
];

const blacklistMock: BlacklistItem[] = [
  {
    key: '1',
    id: 'BL001',
    type: 'driver',
    name: '周某某',
    phone: '130****5521',
    avatar: '周',
    reason: '恶意抢单后取消累计达23次，严重扰乱平台秩序',
    banTime: '2024-05-12 14:30:00',
    expireTime: '永久',
    operator: '系统自动',
  },
  {
    key: '2',
    id: 'BL002',
    type: 'driver',
    name: '吴某某',
    phone: '131****8834',
    avatar: '吴',
    reason: '驾驶证伪造，行驶证信息不实，存在重大安全隐患',
    banTime: '2024-05-28 09:15:00',
    expireTime: '永久',
    operator: '风控-张经理',
  },
  {
    key: '3',
    id: 'BL003',
    type: 'shipper',
    name: '杭州XX供应链公司',
    phone: '0571-8888****',
    avatar: 'X',
    reason: '多次虚假发货诱导司机空驶，投诉累计17次',
    banTime: '2024-06-01 16:45:00',
    expireTime: '2025-06-01',
    operator: '风控-李主管',
  },
  {
    key: '4',
    id: 'BL004',
    type: 'driver',
    name: '郑某某',
    phone: '132****3309',
    avatar: '郑',
    reason: '预支款项逾期未还累计3笔，涉及金额¥2.8万',
    banTime: '2024-06-03 11:22:00',
    expireTime: '2024-12-03',
    operator: '资金-王经理',
  },
];

const getRiskColor = (score: number): string => {
  if (score < 30) return '#10B981';
  if (score < 60) return '#F59E0B';
  if (score < 85) return '#FF6B1A';
  return '#EF4444';
};

const getRiskLevelLabel = (l: AdvanceItem['riskLevel']) => {
  const map = {
    low: { text: '低风险', color: 'green', bg: 'bg-success/10 text-success border-success/30' },
    medium: { text: '中风险', color: 'warning', bg: 'bg-warning/10 text-warning border-warning/30' },
    high: { text: '高风险', color: 'orange', bg: 'bg-primary-orange/10 text-primary-orange border-primary-orange/30' },
    reject: { text: '建议拒绝', color: 'red', bg: 'bg-danger/10 text-danger border-danger/30' },
  };
  return map[l];
};

interface AdminRiskProps { defaultTab?: string; }
const AdminRisk: React.FC<AdminRiskProps> = ({ defaultTab = 'driver' }) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [authModal, setAuthModal] = useState<{
    visible: boolean;
    type: 'approve' | 'reject';
    item: DriverAuthItem | null;
  }>({ visible: false, type: 'approve', item: null });
  const [ruleDrawer, setRuleDrawer] = useState(false);
  const [advanceAdjust, setAdvanceAdjust] = useState<Record<string, number>>({});
  const [form] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [unbanModal, setUnbanModal] = useState<{ visible: boolean; item: BlacklistItem | null }>({
    visible: false,
    item: null,
  });
  const [searchText, setSearchText] = useState('');

  const gaugeOption = (score: number): EChartsOption => ({
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        radius: '95%',
        center: ['50%', '60%'],
        progress: { show: true, width: 14, roundCap: true },
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [0.3, '#10B981'],
              [0.6, '#F59E0B'],
              [0.85, '#FF6B1A'],
              [1, '#EF4444'],
            ],
          },
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          formatter: '{value}',
          fontSize: 28,
          fontWeight: 'bold',
          offsetCenter: [0, '8%'],
          color: getRiskColor(score),
        },
        data: [{ value: score }],
      },
    ],
  });

  const driverColumns: ColumnsType<DriverAuthItem> = [
    {
      title: '司机信息',
      dataIndex: 'name',
      fixed: 'left',
      width: 220,
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={42}
            className="!bg-gradient-primary !text-white !font-bold !border-2 !border-white/20"
          >
            {r.avatar}
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">{r.name}</div>
            <div className="text-[11px] text-white/50 font-mono">{r.phone}</div>
            <div className="text-[10px] text-white/40 mt-0.5">ID: {r.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: '信用评分',
      dataIndex: 'creditScore',
      width: 140,
      render: (v: number) => (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Rate disabled allowHalf value={v} className="!text-xs [&_.ant-rate-star]:!mr-0.5" />
            <span className="text-sm font-bold text-primary-orange font-mono ml-1">{v.toFixed(1)}</span>
          </div>
          <Progress
            percent={Math.round((v / 5) * 100)}
            size="small"
            showInfo={false}
            strokeColor={{ from: '#FF6B1A', to: '#FFB347' }}
            className="!w-24"
          />
        </div>
      ),
    },
    {
      title: '三证',
      key: 'certs',
      width: 300,
      render: (_, r) => (
        <div className="flex items-center gap-2">
          {r.idCard.front && (
            <div className="group relative">
              <Image
                src={r.idCard.front}
                alt="身份证正面"
                width={80}
                height={50}
                className="rounded-lg border border-white/10 cursor-zoom-in object-cover"
              />
              <span className="absolute -top-1.5 left-1 px-1 py-px bg-deep-blue-700 text-[9px] text-white/70 rounded">
                身份证
              </span>
            </div>
          )}
          {r.driverLicense && (
            <div className="group relative">
              <Image
                src={r.driverLicense}
                alt="驾驶证"
                width={80}
                height={50}
                className="rounded-lg border border-white/10 cursor-zoom-in object-cover"
              />
              <span className="absolute -top-1.5 left-1 px-1 py-px bg-deep-blue-700 text-[9px] text-white/70 rounded">
                驾驶证
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1 text-[11px]">
            <Tag color="blue" className="!rounded-md !text-[10px] !m-0">
              {r.vehicleLicense.plate}
            </Tag>
            <span className="text-white/50">{r.vehicleLicense.type}</span>
          </div>
        </div>
      ),
    },
    {
      title: '行驶证信息',
      key: 'vehicle',
      width: 200,
      render: (_, r) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-white/40">号牌</span>
            <span className="text-white/80 font-mono font-semibold">{r.vehicleLicense.plate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/40">车型</span>
            <span className="text-white/80">{r.vehicleLicense.type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/40">有效期</span>
            <span
              className={`font-mono ${
                new Date(r.vehicleLicense.expire) < new Date()
                  ? 'text-danger'
                  : 'text-success'
              }`}
            >
              {r.vehicleLicense.expire}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'submitTime',
      width: 170,
      render: (v) => <span className="text-xs text-white/60 font-mono">{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: DriverAuthItem['status']) => {
        const map = {
          pending: { color: 'warning', text: '待审核', icon: '⏳' },
          approved: { color: 'green', text: '已通过', icon: '✅' },
          rejected: { color: 'red', text: '已驳回', icon: '❌' },
        };
        const t = map[s];
        return (
          <Tag color={t.color} className="!rounded-md !font-semibold">
            <span className="mr-1">{t.icon}</span>
            {t.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, r) =>
        r.status === 'pending' ? (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<CheckCircle2 size={13} />}
              className="!bg-success !border-success"
              onClick={() => setAuthModal({ visible: true, type: 'approve', item: r })}
            >
              通过
            </Button>
            <Button
              size="small"
              danger
              icon={<XCircle size={13} />}
              onClick={() => setAuthModal({ visible: true, type: 'reject', item: r })}
            >
              驳回
            </Button>
            <Tooltip title="查看详情">
              <Button size="small" type="text" icon={<Eye size={14} className="text-white/70" />} />
            </Tooltip>
          </Space>
        ) : (
          <Tooltip title="查看详情">
            <Button size="small" type="text" icon={<Eye size={14} className="text-white/70" />} />
          </Tooltip>
        ),
    },
  ];

  const pendingCount = driverAuthMock.filter((d) => d.status === 'pending').length;
  const shipperPending = shipperAuthMock.filter((d) => d.status === 'pending').length;
  const advCount = {
    pending: advanceMock.length,
    low: advanceMock.filter((a) => a.riskLevel === 'low').length,
    medium: advanceMock.filter((a) => a.riskLevel === 'medium').length,
    high: advanceMock.filter((a) => a.riskLevel === 'high' || a.riskLevel === 'reject').length,
  };

  const filteredBlacklist = useMemo(
    () =>
      blacklistMock.filter(
        (b) =>
          !searchText ||
          b.name.includes(searchText) ||
          b.reason.includes(searchText)
      ),
    [searchText]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0 mb-1.5">风控审核台</h1>
          <p className="text-sm text-white/50 m-0">司机/货主认证 · 预支复核 · 黑名单管理 · 规则引擎</p>
        </div>
        <Space>
          <Button
            icon={<RefreshCw size={15} />}
            ghost
            className="!border-white/10"
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<Settings size={15} />}
            onClick={() => setRuleDrawer(true)}
            className="!bg-gradient-primary !border-0 shadow-soft-orange"
          >
            规则配置
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        {[
          { label: '司机待审', value: pendingCount, icon: <FileCheck size={18} />, color: '#FF6B1A', suffix: '单' },
          { label: '货主待审', value: shipperPending, icon: <Building2 size={18} />, color: '#3B82F6', suffix: '单' },
          { label: '预支待复核', value: advCount.pending, icon: <CreditCard size={18} />, color: '#8B5CF6', suffix: '笔' },
          { label: '高风险预警', value: advCount.high, icon: <AlertTriangle size={18} />, color: '#EF4444', suffix: '笔' },
        ].map((s, i) => (
          <Col xs={12} md={6} key={i}>
            <Card
              className="!bg-gradient-to-br !from-deep-blue-800/60 !to-deep-blue-900/60 !border-white/10 !backdrop-blur"
              styles={{ body: { padding: '18px 20px' } }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-white/50 mb-2">{s.label}</div>
                  <Statistic
                    value={s.value}
                    suffix={s.suffix}
                    className="[&_.ant-statistic-content-value]:!text-2xl [&_.ant-statistic-content-value]:!font-bold [&_.ant-statistic-content-value]:!font-mono [&_.ant-statistic-content-suffix]:!text-xs [&_.ant-statistic-content-suffix]:!text-white/50"
                    valueStyle={{ color: s.color }}
                  />
                </div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                  style={{
                    background: `linear-gradient(135deg, ${s.color}, ${s.color}88)`,
                    boxShadow: `0 8px 20px -8px ${s.color}55`,
                  }}
                >
                  {s.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="dashboard-panel">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          className="[&_.ant-tabs-tab]:!text-white/60 [&_.ant-tabs-tab-active]:!text-white [&_.ant-tabs-ink-bar]:!bg-primary-orange [&_.ant-tabs-tab]:!px-5 [&_.ant-tabs-nav]:!px-5 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-white/5"
          items={[
            {
              key: 'driver',
              label: (
                <span className="inline-flex items-center gap-2">
                  <FileCheck size={15} />
                  司机认证
                  <Badge count={pendingCount} size="small" color="#FF6B1A" />
                </span>
              ),
              children: (
                <div className="p-5">
                  <Table
                    rowKey="key"
                    columns={driverColumns}
                    dataSource={driverAuthMock}
                    scroll={{ x: 1300 }}
                    pagination={{ pageSize: 8, showSizeChanger: false, className: '[&_*]:!text-white/70' }}
                    rowClassName={(r) =>
                      r.status === 'pending'
                        ? 'bg-primary-orange/[0.03] hover:!bg-primary-orange/[0.06]'
                        : ''
                    }
                  />
                </div>
              ),
            },
            {
              key: 'shipper',
              label: (
                <span className="inline-flex items-center gap-2">
                  <Building2 size={15} />
                  货主认证
                  <Badge count={shipperPending} size="small" color="#3B82F6" />
                </span>
              ),
              children: (
                <div className="p-5">
                  <Table
                    rowKey="key"
                    columns={driverColumns.map((c) =>
                      c.title === '司机信息' ? { ...c, title: '企业信息' } : c
                    )}
                    dataSource={shipperAuthMock}
                    scroll={{ x: 1300 }}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                  />
                </div>
              ),
            },
            {
              key: 'advance',
              label: (
                <span className="inline-flex items-center gap-2">
                  <CreditCard size={15} />
                  预支复核
                  <Badge count={advCount.pending} size="small" color="#8B5CF6" />
                </span>
              ),
              children: (
                <div className="p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {advanceMock.map((a) => {
                      const rl = getRiskLevelLabel(a.riskLevel);
                      const adjusted = advanceAdjust[a.key] ?? a.suggestRatio;
                      return (
                        <Card
                          key={a.key}
                          className="!bg-deep-blue-800/50 !border-white/10 overflow-hidden"
                          styles={{ body: { padding: 0 } }}
                        >
                          <div className="p-5 border-b border-white/10">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  size={48}
                                  className="!bg-gradient-primary !text-white !font-bold !text-lg !border-2 !border-white/20"
                                >
                                  {a.driverAvatar}
                                </Avatar>
                                <div>
                                  <div className="text-base font-bold text-white flex items-center gap-2">
                                    {a.driverName}
                                    <Tag className={`!rounded-md !border ${rl.bg}`} color={rl.color}>
                                      {rl.text}
                                    </Tag>
                                  </div>
                                  <div className="text-xs text-white/50 font-mono mt-0.5">
                                    {a.orderNo} · 截止 {a.deadline}
                                  </div>
                                </div>
                              </div>
                              <div className="w-28 h-28 flex-shrink-0 -mr-2 -mt-2">
                                <ReactECharts
                                  option={gaugeOption(a.riskScore)}
                                  style={{ height: '100%' }}
                                  opts={{ renderer: 'canvas' }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                <div className="text-[11px] text-white/50 mb-1 flex items-center gap-1">
                                  <Truck size={11} />
                                  运单金额
                                </div>
                                <div className="text-lg font-bold text-white font-mono">
                                  ¥{a.orderAmount.toLocaleString()}
                                </div>
                              </div>
                              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                <div className="text-[11px] text-white/50 mb-1 flex items-center gap-1">
                                  <Wallet size={11} />
                                  申请金额
                                </div>
                                <div className="text-lg font-bold text-info font-mono">
                                  ¥{a.requestAmount.toLocaleString()}
                                </div>
                              </div>
                              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                <div className="text-[11px] text-white/50 mb-1 flex items-center gap-1">
                                  <TrendingUp size={11} />
                                  运单路线
                                </div>
                                <div className="text-sm font-bold text-primary-orange">
                                  {a.route}
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-white/60 font-medium flex items-center gap-1.5">
                                  <Gauge size={12} className="text-primary-orange" />
                                  四维风险评分
                                </span>
                                <span className="text-[11px] text-white/40 font-mono">
                                  综合风险分 <span style={{ color: getRiskColor(a.riskScore) }} className="font-bold">{a.riskScore}</span> / 100
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                                {[
                                  { k: '历史还款', v: a.dimensions.historyRepay, icon: <CheckCircle2 size={11} /> },
                                  { k: '信用评分', v: a.dimensions.creditScore, icon: <CreditCard size={11} /> },
                                  { k: '订单稳定性', v: a.dimensions.orderStability, icon: <Truck size={11} /> },
                                  { k: '路线风险', v: a.dimensions.routeRisk, icon: <ShieldAlert size={11} /> },
                                ].map((d) => (
                                  <div key={d.k}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[11px] text-white/50 flex items-center gap-1">
                                        <span style={{ color: getRiskColor(100 - d.v) }}>{d.icon}</span>
                                        {d.k}
                                      </span>
                                      <span
                                        className="text-[11px] font-mono font-semibold"
                                        style={{ color: getRiskColor(100 - d.v) }}
                                      >
                                        {d.v}
                                      </span>
                                    </div>
                                    <Progress
                                      percent={d.v}
                                      size="small"
                                      showInfo={false}
                                      strokeColor={getRiskColor(100 - d.v)}
                                      className="!m-0"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="p-5 bg-gradient-to-br from-primary-orange/5 via-deep-blue-700/20 to-deep-blue-900/40">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-xs text-white/70">
                                <Badge status="processing" color="#3B82F6" />
                                系统建议放款比例
                                <Tag color="blue" className="!rounded-md !text-xs">
                                  {a.suggestRatio}%
                                </Tag>
                              </div>
                              <span className="text-xs text-primary-orange font-semibold">
                                建议放款: ¥{Math.round(a.orderAmount * (a.suggestRatio / 100)).toLocaleString()}
                              </span>
                            </div>

                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] text-white/50">人工调整放款比例</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold font-mono text-primary-orange">
                                    {adjusted}
                                  </span>
                                  <span className="text-sm text-white/50">%</span>
                                  <span className="text-xs text-success ml-3">
                                    ¥{Math.round(a.orderAmount * (adjusted / 100)).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <Slider
                                min={0}
                                max={90}
                                step={5}
                                value={adjusted}
                                onChange={(v) =>
                                  setAdvanceAdjust((p) => ({ ...p, [a.key]: v as number }))
                                }
                                tooltip={{
                                  formatter: (v) => `${v}% · ¥${Math.round(a.orderAmount * ((v as number) / 100)).toLocaleString()}`,
                                }}
                                styles={{
                                  rail: { background: 'rgba(255,255,255,0.1)', height: 8, borderRadius: 4 },
                                  track: {
                                    background: `linear-gradient(90deg, ${getRiskColor(
                                      100 - a.riskScore
                                    )}, #FF6B1A)`,
                                    height: 8,
                                    borderRadius: 4,
                                  },
                                  handle: {
                                    borderColor: '#fff',
                                    borderWidth: 3,
                                    background: '#FF6B1A',
                                    width: 20,
                                    height: 20,
                                    boxShadow: '0 0 0 6px rgba(255,107,26,0.2)',
                                  },
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                              <div className="flex items-center gap-2 text-[11px] text-white/50">
                                <User size={11} />
                                复核人: 当前操作员
                              </div>
                              <Space size="small">
                                <Button
                                  size="small"
                                  className="!border-white/10"
                                  ghost
                                >
                                  转交
                                </Button>
                                <Button
                                  size="small"
                                  danger
                                  icon={<XCircle size={13} />}
                                  onClick={() => message.warning(`已驳回 ${a.id}`)}
                                >
                                  拒绝
                                </Button>
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<CheckCircle2 size={13} />}
                                  className="!bg-success !border-success"
                                  onClick={() => message.success(`已审批放款 ¥${Math.round(a.orderAmount * (adjusted / 100)).toLocaleString()}`)}
                                >
                                  审批放款
                                </Button>
                              </Space>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ),
            },
            {
              key: 'blacklist',
              label: (
                <span className="inline-flex items-center gap-2">
                  <Ban size={15} />
                  黑名单
                  <Badge count={blacklistMock.length} size="small" color="#EF4444" />
                </span>
              ),
              children: (
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Input
                      placeholder="搜索用户/封禁原因"
                      prefix={<Search size={15} className="text-white/40" />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                      className="!w-72 !bg-white/5 !border-white/10 [&_.ant-input-group-addon]:!bg-white/5 [&_.ant-input-group-addon]:!border-white/10"
                    />
                    <Space>
                      <Button className="!border-white/10" ghost size="small">
                        司机
                      </Button>
                      <Button className="!border-white/10" ghost size="small">
                        货主
                      </Button>
                    </Space>
                  </div>
                  <Table
                    rowKey="key"
                    dataSource={filteredBlacklist}
                    pagination={{ pageSize: 8 }}
                    columns={[
                      {
                        title: '用户信息',
                        width: 240,
                        render: (_, r) => (
                          <div className="flex items-center gap-3">
                            <Avatar
                              size={42}
                              className={`!text-white !font-bold !border-2 ${
                                r.type === 'driver'
                                  ? '!bg-gradient-primary'
                                  : '!bg-gradient-to-br !from-info !to-info-600'
                              } !border-white/20`}
                            >
                              {r.avatar}
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-white">{r.name}</span>
                                <Tag color={r.type === 'driver' ? 'orange' : 'blue'} className="!rounded-md !text-[10px]">
                                  {r.type === 'driver' ? '司机' : '货主'}
                                </Tag>
                              </div>
                              <div className="text-[11px] text-white/50 font-mono mt-0.5">{r.phone}</div>
                              <div className="text-[10px] text-white/40 mt-0.5">{r.id}</div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: '封禁原因',
                        dataIndex: 'reason',
                        render: (v: string) => (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <UserX size={12} className="text-danger" />
                              <span className="text-[11px] text-danger font-semibold">封禁说明</span>
                            </div>
                            <p className="text-xs text-white/70 m-0 leading-relaxed line-clamp-2">{v}</p>
                          </div>
                        ),
                      },
                      {
                        title: '封禁时间',
                        width: 200,
                        render: (_, r) => (
                          <div className="text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-white/40">开始</span>
                              <span className="text-white/70 font-mono">{r.banTime}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/40">到期</span>
                              <span
                                className={`font-mono font-semibold ${
                                  r.expireTime === '永久' ? 'text-danger' : 'text-warning'
                                }`}
                              >
                                {r.expireTime}
                              </span>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: '操作人',
                        dataIndex: 'operator',
                        width: 140,
                        render: (v) => <span className="text-xs text-white/60">{v}</span>,
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 140,
                        fixed: 'right',
                        render: (_, r) => (
                          <Space size="small">
                            <Button
                              size="small"
                              type="primary"
                              ghost
                              icon={<RefreshCw size={12} />}
                              onClick={() => setUnbanModal({ visible: true, item: r })}
                            >
                              解封
                            </Button>
                            <Tooltip title="查看详情">
                              <Button size="small" type="text" icon={<FileText size={14} className="text-white/60" />} />
                            </Tooltip>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            {authModal.type === 'approve' ? (
              <CheckCircle2 size={18} className="text-success" />
            ) : (
              <XCircle size={18} className="text-danger" />
            )}
            <span className="text-lg font-bold">
              {authModal.type === 'approve' ? '审核通过确认' : '驳回申请确认'}
            </span>
          </div>
        }
        open={authModal.visible}
        onCancel={() => setAuthModal({ visible: false, type: 'approve', item: null })}
        onOk={() => {
          form.validateFields().then((v) => {
            message.success(`${authModal.item?.name} ${authModal.type === 'approve' ? '已通过审核' : `已驳回：${v.reason}`}`);
            setAuthModal({ visible: false, type: 'approve', item: null });
            form.resetFields();
          });
        }}
        okText={authModal.type === 'approve' ? '确认通过' : '确认驳回'}
        cancelText="取消"
        okButtonProps={{
          className: authModal.type === 'approve' ? '!bg-success !border-success' : '!bg-danger !border-danger',
        }}
        className="[&_.ant-modal-content]:!bg-deep-blue-800 [&_.ant-modal-header]:!border-white/10 [&_.ant-modal-title]:!text-white [&_.ant-modal-close]:!text-white/50"
      >
        {authModal.item && (
          <div className="pt-2">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
              <Avatar
                size={48}
                className="!bg-gradient-primary !text-white !font-bold !text-lg !border-2 !border-white/20"
              >
                {authModal.item.avatar}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-white">{authModal.item.name}</span>
                  <Tag color="blue" className="!rounded-md">{authModal.item.id}</Tag>
                </div>
                <div className="text-xs text-white/50 font-mono">{authModal.item.phone}</div>
                <div className="text-[11px] text-white/40 mt-0.5">提交时间: {authModal.item.submitTime}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/50 mb-1">信用评分</div>
                <div className="text-xl font-bold text-primary-orange font-mono">{authModal.item.creditScore}</div>
              </div>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="reason"
                label={
                  <span className="text-white/80 text-sm">
                    {authModal.type === 'approve' ? '审批备注' : '驳回原因'}
                    {authModal.type === 'reject' && <span className="text-danger ml-1">*</span>}
                  </span>
                }
                rules={authModal.type === 'reject' ? [{ required: true, message: '请输入驳回原因' }] : []}
              >
                <TextArea
                  rows={4}
                  maxLength={200}
                  showCount
                  placeholder={
                    authModal.type === 'approve'
                      ? '可输入通过备注（选填），例如：资质齐全，准予通过'
                      : '请详细说明驳回原因（必填），例如：身份证图片模糊需重新上传'
                  }
                  className="!bg-white/5 !border-white/10 [&_.ant-input]:!text-white"
                />
              </Form.Item>

              {authModal.type === 'approve' && (
                <Form.Item name="sendSms" valuePropName="checked" initialValue>
                  <Switch
                    checkedChildren="通知"
                    unCheckedChildren="不通知"
                    className="!bg-primary-orange"
                  />
                  <span className="ml-2 text-xs text-white/60">通过短信/APP推送通知用户</span>
                </Form.Item>
              )}
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-info" />
            <span className="text-lg font-bold">黑名单解封确认</span>
          </div>
        }
        open={unbanModal.visible}
        onCancel={() => setUnbanModal({ visible: false, item: null })}
        onOk={() => {
          message.success(`${unbanModal.item?.name} 已成功解封`);
          setUnbanModal({ visible: false, item: null });
        }}
        okText="确认解封"
        cancelText="取消"
        okButtonProps={{ className: '!bg-info !border-info' }}
        className="[&_.ant-modal-content]:!bg-deep-blue-800 [&_.ant-modal-header]:!border-white/10 [&_.ant-modal-title]:!text-white [&_.ant-modal-close]:!text-white/50"
      >
        {unbanModal.item && (
          <div className="pt-2">
            <div className="p-4 rounded-xl bg-info/10 border border-info/20 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-info flex-shrink-0 mt-0.5" />
                <div className="text-xs text-white/70 leading-relaxed">
                  确认解封后，该用户将恢复平台使用权限。请谨慎操作，建议先核实相关情况。
                  操作将被记录到风控审计日志，可追溯。
                </div>
              </div>
            </div>
            <List
              size="small"
              dataSource={[
                ['用户名称', unbanModal.item.name],
                ['用户类型', unbanModal.item.type === 'driver' ? '司机' : '货主'],
                ['联系方式', unbanModal.item.phone],
                ['原封禁原因', unbanModal.item.reason],
                ['原封禁时间', unbanModal.item.banTime],
              ]}
              renderItem={([k, v]) => (
                <List.Item className="!border-white/5 !px-0">
                  <span className="text-xs text-white/50 w-24 flex-shrink-0">{k}</span>
                  <span className="text-xs text-white/80 flex-1">{v}</span>
                  <ChevronRight size={12} className="text-white/30" />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-primary-orange" />
            <span className="text-lg font-bold text-white">风控规则配置</span>
          </div>
        }
        placement="right"
        width={560}
        onClose={() => setRuleDrawer(false)}
        open={ruleDrawer}
        className="[&_.ant-drawer-content]:!bg-deep-blue-800 [&_.ant-drawer-header]:!border-white/10 [&_.ant-drawer-close]:!text-white/50 [&_.ant-drawer-body]:!p-6"
        extra={
          <Space>
            <Button ghost className="!border-white/10" onClick={() => ruleForm.resetFields()}>
              重置
            </Button>
            <Button
              type="primary"
              className="!bg-gradient-primary !border-0"
              onClick={() => {
                ruleForm.validateFields().then(() => {
                  message.success('风控规则已保存并生效');
                  setRuleDrawer(false);
                });
              }}
            >
              保存生效
            </Button>
          </Space>
        }
      >
        <Form
          form={ruleForm}
          layout="vertical"
          initialValues={{
            historyWeight: 35,
            creditWeight: 30,
            orderWeight: 20,
            routeWeight: 15,
            approveThreshold: 25,
            manualThreshold: 60,
            rejectThreshold: 85,
            blacklistCancelCount: 10,
            blacklistOverdueCount: 3,
            blacklistOverdueDays: 7,
            autoApproveDriver: true,
            notifyOnHighRisk: true,
          }}
          className="[&_.ant-form-item-label>label]:!text-white/70 [&_.ant-form-item-label>label]:!text-sm"
        >
          <div className="mb-2 text-xs font-semibold text-primary-orange uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 bg-primary-orange rounded" />
            权重匹配规则
          </div>
          <Card
            size="small"
            className="!bg-white/[0.03] !border-white/10 !mb-5"
            styles={{ body: { padding: 16 } }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="历史还款权重 (%)"
                  name="historyWeight"
                  rules={[{ type: 'number', min: 0, max: 100 }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    className="!w-full !bg-white/5 !border-white/10 [&_.ant-input-number-input]:!text-white"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="信用评分权重 (%)"
                  name="creditWeight"
                  rules={[{ type: 'number', min: 0, max: 100 }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    className="!w-full !bg-white/5 !border-white/10 [&_.ant-input-number-input]:!text-white"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="订单稳定权重 (%)"
                  name="orderWeight"
                  rules={[{ type: 'number', min: 0, max: 100 }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    className="!w-full !bg-white/5 !border-white/10 [&_.ant-input-number-input]:!text-white"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="路线风险权重 (%)"
                  name="routeWeight"
                  rules={[{ type: 'number', min: 0, max: 100 }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    className="!w-full !bg-white/5 !border-white/10 [&_.ant-input-number-input]:!text-white"
                  />
                </Form.Item>
              </Col>
            </Row>
            <div className="mt-2 p-3 rounded-lg bg-primary-orange/10 border border-primary-orange/20 text-[11px] text-white/70">
              <span className="text-primary-orange font-semibold">💡 提示：</span>
              四项权重之和建议为 100%，系统将按比例自动归一化。
            </div>
          </Card>

          <div className="mb-2 text-xs font-semibold text-info uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 bg-info rounded" />
            审批阈值设置
          </div>
          <Card
            size="small"
            className="!bg-white/[0.03] !border-white/10 !mb-5"
            styles={{ body: { padding: 16 } }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="自动通过线" name="approveThreshold">
                  <InputNumber
                    addonBefore="≤"
                    addonAfter="分"
                    min={0}
                    max={100}
                    className="!w-full !bg-white/5 !border-white/10 [&_input]:!text-white [&_.ant-input-number-group-addon]:!bg-white/5 [&_.ant-input-number-group-addon]:!text-white/60 [&_.ant-input-number-group-addon]:!border-white/10"
                  />
                </Form.Item>
                <div className="text-[10px] text-success -mt-3 mb-2">低于此分数自动审批通过</div>
              </Col>
              <Col span={8}>
                <Form.Item label="人工复核线" name="manualThreshold">
                  <InputNumber
                    addonBefore="≥"
                    addonAfter="分"
                    min={0}
                    max={100}
                    className="!w-full !bg-white/5 !border-white/10 [&_input]:!text-white [&_.ant-input-number-group-addon]:!bg-white/5 [&_.ant-input-number-group-addon]:!text-white/60 [&_.ant-input-number-group-addon]:!border-white/10"
                  />
                </Form.Item>
                <div className="text-[10px] text-warning -mt-3 mb-2">高于此分数需人工复核</div>
              </Col>
              <Col span={8}>
                <Form.Item label="建议拒绝线" name="rejectThreshold">
                  <InputNumber
                    addonBefore="≥"
                    addonAfter="分"
                    min={0}
                    max={100}
                    className="!w-full !bg-white/5 !border-white/10 [&_input]:!text-white [&_.ant-input-number-group-addon]:!bg-white/5 [&_.ant-input-number-group-addon]:!text-white/60 [&_.ant-input-number-group-addon]:!border-white/10"
                  />
                </Form.Item>
                <div className="text-[10px] text-danger -mt-3 mb-2">高于此分数建议拒绝</div>
              </Col>
            </Row>
          </Card>

          <div className="mb-2 text-xs font-semibold text-danger uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 bg-danger rounded" />
            黑名单触发条件
          </div>
          <Card
            size="small"
            className="!bg-white/[0.03] !border-white/10 !mb-5"
            styles={{ body: { padding: 16 } }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="恶意取消次数阈值" name="blacklistCancelCount">
                  <InputNumber
                    addonAfter="次"
                    min={1}
                    max={100}
                    className="!w-full !bg-white/5 !border-white/10 [&_input]:!text-white [&_.ant-input-number-group-addon]:!bg-white/5 [&_.ant-input-number-group-addon]:!text-white/60 [&_.ant-input-number-group-addon]:!border-white/10"
                  />
                </Form.Item>
                <div className="text-[10px] text-white/50 -mt-3 mb-2">90天内累计取消达该次数</div>
              </Col>
              <Col span={12}>
                <Form.Item label="逾期笔数阈值" name="blacklistOverdueCount">
                  <InputNumber
                    addonAfter="笔"
                    min={1}
                    max={50}
                    className="!w-full !bg-white/5 !border-white/10 [&_input]:!text-white [&_.ant-input-number-group-addon]:!bg-white/5 [&_.ant-input-number-group-addon]:!text-white/60 [&_.ant-input-number-group-addon]:!border-white/10"
                  />
                </Form.Item>
                <div className="text-[10px] text-white/50 -mt-3 mb-2">未还款逾期达到该笔数</div>
              </Col>
              <Col span={24}>
                <Form.Item label="逾期天数阈值" name="blacklistOverdueDays">
                  <InputNumber
                    addonAfter="天"
                    min={1}
                    max={180}
                    className="!w-full !bg-white/5 !border-white/10 [&_input]:!text-white [&_.ant-input-number-group-addon]:!bg-white/5 [&_.ant-input-number-group-addon]:!text-white/60 [&_.ant-input-number-group-addon]:!border-white/10"
                  />
                </Form.Item>
                <div className="text-[10px] text-white/50 -mt-3 mb-2">单笔逾期最长天数超该值</div>
              </Col>
            </Row>
          </Card>

          <div className="mb-2 text-xs font-semibold text-success uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 bg-success rounded" />
            自动化开关
          </div>
          <Card
            size="small"
            className="!bg-white/[0.03] !border-white/10"
            styles={{ body: { padding: 16 } }}
          >
            <div className="space-y-4">
              <Form.Item name="autoApproveDriver" valuePropName="checked" className="!mb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/90 font-medium">司机认证自动审核</div>
                    <div className="text-[11px] text-white/50 mt-0.5">OCR + 公安联网比对通过时直接放行</div>
                  </div>
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" className="!bg-primary-orange" />
                </div>
              </Form.Item>
              <div className="h-px bg-white/10" />
              <Form.Item name="notifyOnHighRisk" valuePropName="checked" className="!mb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/90 font-medium">高风险即时通知</div>
                    <div className="text-[11px] text-white/50 mt-0.5">触发高风险阈值时推送运营人员</div>
                  </div>
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" className="!bg-primary-orange" />
                </div>
              </Form.Item>
            </div>
          </Card>
        </Form>
      </Drawer>
    </div>
  );
};

export default AdminRisk;
