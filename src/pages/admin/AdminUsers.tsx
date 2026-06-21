import React, { useState, useMemo } from 'react';
import {
  Tabs,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  InputNumber,
  Modal,
  Form,
  Segmented,
  Card,
  Statistic,
  Row,
  Col,
  Avatar,
  Tooltip,
  Typography,
  Badge,
  List,
  Image,
  message,
  Checkbox,
  Dropdown,
  Empty,
  Drawer,
  Rate,
  Progress,
  Timeline,
} from 'antd';
import type { EChartsOption } from 'echarts';
import type { ColumnsType } from 'antd/es/table';
import {
  Users,
  Building2,
  Search,
  Filter,
  Download,
  RefreshCw,
  Ban,
  Edit3,
  Eye,
  FileText,
  TrendingUp,
  Wallet,
  Star,
  Truck,
  CreditCard,
  UserX,
  Check,
  MoreVertical,
  History,
  MapPin,
  Award,
  Gauge,
  AlertTriangle,
} from 'lucide-react';
import TrackReplay from '@/pages/common/TrackReplay';

const { Option } = Select;
const { Text, Title } = Typography;

interface DriverUser {
  key: string;
  id: string;
  name: string;
  phone: string;
  avatar: string;
  plate: string;
  truckType: string;
  creditScore: number;
  rating: number;
  totalOrders: number;
  totalGmv: number;
  walletBalance: number;
  registerTime: string;
  lastActive: string;
  city: string;
  status: 'active' | 'banned' | 'pending' | 'idle';
  certs: { idFront: string; idBack: string; driverLicense: string; vehicleLicense: string };
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  onTimeRate: number;
}

interface ShipperUser {
  key: string;
  id: string;
  name: string;
  contact: string;
  phone: string;
  avatar: string;
  creditScore: number;
  rating: number;
  totalOrders: number;
  totalGmv: number;
  creditLimit: number;
  creditUsed: number;
  registerTime: string;
  lastActive: string;
  province: string;
  industry: string;
  status: 'active' | 'banned' | 'pending';
  license: string;
  businessType: string;
}

const levelMap = {
  bronze: { name: '青铜', color: '#B45309', bg: 'bg-amber-700/20', border: 'border-amber-700/30' },
  silver: { name: '白银', color: '#94A3B8', bg: 'bg-slate-400/20', border: 'border-slate-400/30' },
  gold: { name: '黄金', color: '#F59E0B', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  platinum: { name: '铂金', color: '#06B6D4', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
};

const statusMap = {
  active: { c: 'green', t: '正常' },
  banned: { c: 'red', t: '已封禁' },
  pending: { c: 'orange', t: '待认证' },
  idle: { c: 'default', t: '离线' },
};

const driverMock: DriverUser[] = Array.from({ length: 16 }).map((_, i) => {
  const names = ['王志强', '李明辉', '张建军', '刘德胜', '赵磊', '陈志远', '孙海涛', '周立波', '吴学斌', '郑建华', '赵国栋', '钱卫东', '冯志远', '褚怀亮', '卫建国', '蒋少华'];
  const levels: DriverUser['level'][] = ['bronze', 'silver', 'gold', 'platinum'];
  const statuses: DriverUser['status'][] = ['active', 'active', 'active', 'active', 'active', 'banned', 'pending', 'idle'];
  return {
    key: String(i + 1),
    id: `DR${String(2024000 + i).padStart(8, '0')}`,
    name: names[i % names.length],
    phone: `138${String(10000000 + i * 13579).slice(0, 8)}`,
    avatar: names[i % names.length].charAt(0),
    plate: `${['京', '沪', '粤', '浙', '苏', '川', '鲁', '冀'][i % 8]}A·${String(50000 + i * 233).slice(0, 5)}`,
    truckType: ['重型半挂车', '重型厢式货车', '中型栏板货车', '重型集装箱车', '冷藏车'][i % 5],
    creditScore: 400 + i * 18 + Math.floor(Math.random() * 30),
    rating: 4.2 + (i % 8) * 0.1,
    totalOrders: 80 + i * 37 + Math.floor(Math.random() * 40),
    totalGmv: (15 + i * 4.5 + Math.random() * 8) * 10000,
    walletBalance: 1200 + i * 850 + Math.floor(Math.random() * 5000),
    registerTime: `2024-${String(((i % 5) + 1)).padStart(2, '0')}-${String(((i * 5) % 27) + 1).padStart(2, '0')}`,
    lastActive: `2024-06-07 ${String(8 + (i * 2) % 12).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`,
    city: ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉'][i % 8],
    status: statuses[i % 8],
    certs: {
      idFront: `https://picsum.photos/seed/didf${i}/320/200`,
      idBack: `https://picsum.photos/seed/didb${i}/320/200`,
      driverLicense: `https://picsum.photos/seed/ddl${i}/320/200`,
      vehicleLicense: `https://picsum.photos/seed/dvl${i}/320/200`,
    },
    level: levels[i % 4],
    onTimeRate: 88 + (i % 12),
  };
});

const shipperMock: ShipperUser[] = Array.from({ length: 12 }).map((_, i) => {
  const names = ['上海宏远物流', '北京中远供应链', '广州顺丰运输', '深圳华南物流', '杭州华东货站', '成都川渝货运', '南京扬子江物流', '武汉长江供应链', '济南齐鲁运输', '郑州中原货运', '西安西北物流', '天津滨海港务'];
  const statuses: ShipperUser['status'][] = ['active', 'active', 'active', 'active', 'banned', 'pending'];
  return {
    key: String(i + 1),
    id: `SH${String(2024000 + i).padStart(8, '0')}`,
    name: names[i % names.length],
    contact: ['张总', '李经理', '王主管', '赵主任', '陈总'][i % 5],
    phone: `139${String(10000000 + i * 9753).slice(0, 8)}`,
    avatar: names[i % names.length].charAt(0),
    creditScore: 450 + i * 22 + Math.floor(Math.random() * 40),
    rating: 4.3 + (i % 7) * 0.1,
    totalOrders: 120 + i * 55 + Math.floor(Math.random() * 60),
    totalGmv: (120 + i * 18 + Math.random() * 40) * 10000,
    creditLimit: (50 + i * 10) * 10000,
    creditUsed: (20 + i * 5 + Math.random() * 15) * 10000,
    registerTime: `2024-${String(((i % 4) + 1)).padStart(2, '0')}-${String(((i * 7) % 27) + 1).padStart(2, '0')}`,
    lastActive: `2024-06-07 ${String(9 + (i * 3) % 10).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
    province: ['上海', '北京', '广东', '广东', '浙江', '四川', '江苏', '湖北', '山东', '河南', '陕西', '天津'][i],
    industry: ['快消零售', '电子产品', '汽车配件', '建材家居', '食品冷链', '化工原料', '服装纺织', '机械装备', '医药健康', '电商快递'][i % 10],
    status: statuses[i % 6],
    license: `https://picsum.photos/seed/slic${i}/400/280`,
    businessType: i % 3 === 0 ? '长期合同' : i % 3 === 1 ? '散单为主' : '混合模式',
  };
});

interface AdminUsersProps { defaultTab?: 'driver' | 'shipper'; }
const AdminUsers: React.FC<AdminUsersProps> = ({ defaultTab = 'driver' }) => {
  const [activeTab, setActiveTab] = useState<'driver' | 'shipper'>(defaultTab);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creditFilter, setCreditFilter] = useState('all');
  const [detailModal, setDetailModal] = useState<{ open: boolean; user: DriverUser | null; tab: string }>({ open: false, user: null, tab: 'info' });
  const [shipperDrawer, setShipperDrawer] = useState<ShipperUser | null>(null);
  const [banModal, setBanModal] = useState<{ open: boolean; users: DriverUser[]; shipper?: ShipperUser[] }>({ open: false, users: [] });
  const [scoreModal, setScoreModal] = useState<{ open: boolean; users: DriverUser[]; shipper?: ShipperUser[] }>({ open: false, users: [] });
  const [banForm] = Form.useForm();
  const [scoreForm] = Form.useForm();

  const filteredDrivers = useMemo(() => driverMock.filter((d) => {
    if (searchText && !`${d.name}${d.id}${d.phone}${d.plate}${d.city}`.includes(searchText)) return false;
    if (cityFilter !== 'all' && d.city !== cityFilter) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (creditFilter !== 'all') {
      if (creditFilter === 'a' && d.creditScore < 650) return false;
      if (creditFilter === 'b' && (d.creditScore < 550 || d.creditScore >= 650)) return false;
      if (creditFilter === 'c' && (d.creditScore < 450 || d.creditScore >= 550)) return false;
      if (creditFilter === 'd' && d.creditScore >= 450) return false;
    }
    return true;
  }), [searchText, cityFilter, statusFilter, creditFilter]);

  const filteredShippers = useMemo(() => shipperMock.filter((s) => {
    if (searchText && !`${s.name}${s.id}${s.phone}${s.contact}${s.province}`.includes(searchText)) return false;
    if (cityFilter !== 'all' && s.province !== cityFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  }), [searchText, cityFilter, statusFilter]);

  const driverColumns: ColumnsType<DriverUser> = [
    {
      title: '司机信息', width: 260, fixed: 'left',
      render: (_, r) => {
        const lv = levelMap[r.level];
        return (
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar size={44} className="!bg-gradient-primary !text-white !font-bold !text-lg !border-2 !border-white/20">{r.avatar}</Avatar>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${lv.bg} ${lv.border} border flex items-center justify-center`}>
                <Award size={10} style={{ color: lv.color }} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-sm font-semibold text-white">{r.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${lv.bg} ${lv.border} border font-semibold`} style={{ color: lv.color }}>{lv.name}</span>
              </div>
              <div className="text-[11px] text-white/50 font-mono mb-0.5">{r.phone}</div>
              <div className="text-[10px] text-white/40 flex items-center gap-1.5">
                <span className="text-info font-semibold">{r.id}</span>
                <span>·</span>
                <MapPin size={10} className="text-white/30" />
                <span>{r.city}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: '车辆信息', width: 200,
      render: (_, r) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center justify-between"><span className="text-white/40">车牌</span><span className="font-mono font-semibold text-primary-orange">{r.plate}</span></div>
          <div className="flex items-center justify-between"><span className="text-white/40">车型</span><span className="text-white/75 truncate max-w-[120px]" title={r.truckType}>{r.truckType}</span></div>
        </div>
      ),
    },
    {
      title: '信用/评价', width: 170,
      render: (_, r) => (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Gauge size={12} className="text-primary-orange" />
            <span className="text-sm font-bold font-mono text-primary-orange">{r.creditScore}</span>
            <span className="text-[10px] text-white/40">/850</span>
          </div>
          <div className="flex items-center gap-1">
            <Rate disabled allowHalf value={r.rating} className="!text-xs [&_.ant-rate-star]:!mr-0.5" />
            <span className="text-xs font-semibold text-warning ml-1">{r.rating.toFixed(1)}</span>
          </div>
          <Progress percent={Math.round((r.creditScore / 850) * 100)} size="small" showInfo={false} strokeColor={{ from: '#FF6B1A', to: '#FFB347' }} className="!mt-1.5 !w-28" />
        </div>
      ),
    },
    {
      title: '运营数据', width: 200,
      render: (_, r) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center justify-between"><span className="text-white/40">累计运单</span><span className="font-mono text-white/80">{r.totalOrders}</span></div>
          <div className="flex items-center justify-between"><span className="text-white/40">GMV</span><span className="font-mono text-success">¥{(r.totalGmv / 10000).toFixed(1)}万</span></div>
          <div className="flex items-center justify-between"><span className="text-white/40">准时率</span><span className="font-mono text-info">{r.onTimeRate}%</span></div>
        </div>
      ),
    },
    {
      title: '钱包', width: 110,
      render: (_, r) => (
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <Wallet size={12} className="text-success" />
                       <span className="text-xs font-bold font-mono text-success">¥{r.walletBalance.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-white/40">{r.status === 'active' ? '最近活跃' : '注册'} {r.registerTime.slice(5)}</div>
        </div>
      ),
    },
    {
      title: '状态', width: 90, dataIndex: 'status',
      render: (s) => { const cfg = statusMap[s]; return <Tag color={cfg.c} className="!rounded-md !text-xs !font-semibold">{cfg.t}</Tag>; },
    },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, r) => (
        <Space size="small" wrap>
          <Tooltip title="查看详情"><Button size="small" type="primary" ghost className="!text-info !border-info/50" icon={<Eye size={13} />} onClick={() => setDetailModal({ open: true, user: r, tab: 'info' })}>详情</Button></Tooltip>
          <Tooltip title="调整信用分"><Button size="small" type="text" icon={<Edit3 size={13} className="text-warning" />} onClick={() => setScoreModal({ open: true, users: [r] })} /></Tooltip>
          {r.status !== 'banned'
            ? <Tooltip title="封禁账号"><Button size="small" type="text" danger icon={<UserX size={13} />} onClick={() => setBanModal({ open: true, users: [r] })} /></Tooltip>
            : <Tooltip title="解除封禁"><Button size="small" type="text" icon={<Check size={13} className="text-success" />} onClick={() => message.success(`${r.name} 已解除封禁`)} /></Tooltip>
          }
        </Space>
      ),
    },
  ];

  const shipperColumns: ColumnsType<ShipperUser> = [
    {
      title: '企业信息', width: 280, fixed: 'left',
      render: (_, r) => (
        <div className="flex items-start gap-3">
          <Avatar size={44} className="!bg-gradient-to-br !from-info !to-info-600 !text-white !font-bold !text-lg !border-2 !border-white/20">{r.avatar}</Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate mb-0.5" title={r.name}>{r.name}</div>
            <div className="text-[11px] text-white/50 mb-0.5">{r.contact} · {r.phone}</div>
            <div className="text-[10px] text-white/40 flex items-center gap-1.5 flex-wrap">
              <Tag color="blue" className="!rounded-md !text-[10px] !m-0 !px-1.5 !py-0">{r.id}</Tag>
              <span className="flex items-center gap-1"><MapPin size={10} className="text-white/30" />{r.province}</span>
              <Tag color="purple" className="!rounded-md !text-[10px] !m-0 !px-1.5 !py-0">{r.industry}</Tag>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '信用/授信', width: 220,
      render: (_, r) => {
        const pct = Math.round((r.creditUsed / r.creditLimit) * 100);
        return (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-bold font-mono text-primary-orange">{r.creditScore}</span>
              <span className="text-[10px] text-white/40">/850</span>
              <Rate disabled allowHalf value={r.rating} className="!text-[10px] [&_.ant-rate-star]:!mr-0 ml-1" />
            </div>
            <div className="text-[11px] space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-white/40">授信额度</span>
                <span className="font-mono text-info">¥{(r.creditLimit / 10000).toFixed(0)}万</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">已用 {pct}%</span>
                <span className="font-mono text-warning">¥{(r.creditUsed / 10000).toFixed(0)}万</span>
              </div>
              <Progress percent={pct} size="small" showInfo={false} strokeColor={pct > 80 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981'} className="!m-0" />
            </div>
          </div>
        );
      },
    },
    {
      title: '业务数据', width: 180,
      render: (_, r) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center justify-between"><span className="text-white/40">累计发货</span><span className="font-mono text-white/80">{r.totalOrders}单</span></div>
          <div className="flex items-center justify-between"><span className="text-white/40">交易额</span><span className="font-mono text-success">¥{(r.totalGmv / 10000).toFixed(0)}万</span></div>
          <div className="flex items-center justify-between"><span className="text-white/40">合作模式</span><span className="text-white/75">{r.businessType}</span></div>
        </div>
      ),
    },
    {
      title: '状态', width: 90, dataIndex: 'status',
      render: (s) => { const cfg = statusMap[s]; return <Tag color={cfg.c} className="!rounded-md !text-xs !font-semibold">{cfg.t}</Tag>; },
    },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" type="primary" ghost className="!text-info !border-info/50" icon={<Eye size={13} />} onClick={() => setShipperDrawer(r)}>详情</Button>
          <Tooltip title="调整额度"><Button size="small" type="text" icon={<Edit3 size={13} className="text-warning" />} onClick={() => message.info(`调整 ${r.name} 额度`)} /></Tooltip>
          {r.status !== 'banned'
            ? <Tooltip title="封禁"><Button size="small" type="text" danger icon={<UserX size={13} />} onClick={() => setBanModal({ open: true, users: [], shipper: [r] })} /></Tooltip>
            : <Tooltip title="解封"><Button size="small" type="text" icon={<Check size={13} className="text-success" />} onClick={() => message.success(`${r.name} 已解除封禁`)} /></Tooltip>
          }
        </Space>
      ),
    },
  ];

  const overviewStats = activeTab === 'driver'
    ? [
        { t: '司机总数', v: 28652, unit: '人', color: '#FF6B1A', icon: <Users size={20} />, pct: '+386' },
        { t: '认证通过', v: 24186, unit: '人', color: '#10B981', icon: <Check size={20} />, pct: '84.4%' },
        { t: '今日活跃', v: 3852, unit: '人', color: '#3B82F6', icon: <TrendingUp size={20} />, pct: '+8.2%' },
        { t: '待审核', v: 328, unit: '人', color: '#F59E0B', icon: <History size={20} />, pct: '需处理' },
      ]
    : [
        { t: '货主企业', v: 12856, unit: '家', color: '#FF6B1A', icon: <Building2 size={20} />, pct: '+128' },
        { t: '认证企业', v: 10288, unit: '家', color: '#10B981', icon: <Check size={20} />, pct: '80.0%' },
        { t: '合作中', v: 8652, unit: '家', color: '#3B82F6', icon: <TrendingUp size={20} />, pct: '+5.3%' },
        { t: '总授信额度', v: 86.5, unit: '亿元', color: '#8B5CF6', icon: <CreditCard size={20} />, pct: '+12.4%' },
      ];

  const selectedItems = activeTab === 'driver'
    ? filteredDrivers.filter((d) => selectedKeys.includes(d.key))
    : filteredShippers.filter((s) => selectedKeys.includes(s.key));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0 mb-1.5">用户管理</h1>
          <p className="text-sm text-white/50 m-0">司机/货主档案 · 信用评分 · 钱包流水 · 批量运营操作</p>
        </div>
        <Space>
          <Button icon={<RefreshCw size={15} />} ghost className="!border-white/10">刷新</Button>
          <Button icon={<Download size={15} />} ghost className="!border-white/10" disabled={selectedKeys.length === 0}>
            导出 {selectedKeys.length > 0 && <span className="text-primary-orange font-bold ml-1">({selectedKeys.length})</span>}
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'ban', icon: <Ban size={13} />, label: `批量封禁 ${selectedKeys.length > 0 ? `(${selectedKeys.length})` : ''}`, disabled: selectedKeys.length === 0, onClick: () => setBanModal({ open: true, users: selectedItems as any[] }) },
                { key: 'score', icon: <Edit3 size={13} />, label: `批量调分 ${selectedKeys.length > 0 ? `(${selectedKeys.length})` : ''}`, disabled: selectedKeys.length === 0, onClick: () => setScoreModal({ open: true, users: selectedItems as any[] }) },
                { key: 'export', icon: <FileText size={13} />, label: '导出Excel', onClick: () => message.success('已提交导出任务') },
              ],
            }}
            disabled={selectedKeys.length === 0}
          >
            <Button type="primary" icon={<MoreVertical size={15} />} className="!bg-gradient-primary !border-0 shadow-soft-orange" disabled={selectedKeys.length === 0}>
              批量操作 {selectedKeys.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded ml-1">{selectedKeys.length}</span>}
            </Button>
          </Dropdown>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {overviewStats.map((s, i) => (
          <Col xs={12} lg={6} key={i}>
            <Card className="!bg-gradient-to-br !from-deep-blue-800/60 !to-deep-blue-900/60 !border-white/10 !backdrop-blur !h-full" styles={{ body: { padding: 18 } }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] text-white/50 mb-1.5">{s.t}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.v.toLocaleString()}</span>
                    <span className="text-[11px] text-white/50">{s.unit}</span>
                  </div>
                  <div className={`text-[10px] font-semibold mt-1 ${s.pct.startsWith('+') ? 'text-success' : s.pct.endsWith('%') && !s.pct.startsWith('+') ? 'text-warning' : 'text-white/60'}`}>较昨日 {s.pct}</div>
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}88)`, boxShadow: `0 6px 16px -6px ${s.color}55` }}>{s.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="dashboard-panel">
        <Tabs
          activeKey={activeTab}
          onChange={(v) => { setActiveTab(v as any); setSelectedKeys([]); }}
          size="large"
          className="[&_.ant-tabs-tab]:!text-white/60 [&_.ant-tabs-tab-active]:!text-white [&_.ant-tabs-ink-bar]:!bg-primary-orange [&_.ant-tabs-tab]:!px-5 [&_.ant-tabs-nav]:!px-5 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-white/5"
          items={[
            {
              key: 'driver',
              label: (<span className="inline-flex items-center gap-2"><Users size={15} />司机用户<Badge count={driverMock.length} size="small" color="#FF6B1A" /></span>),
              children: (
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Input size="small" placeholder="搜索姓名/ID/电话/车牌/城市" prefix={<Search size={13} className="text-white/40" />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear className="!w-64 !bg-white/5 !border-white/10" />
                    <Select size="small" value={cityFilter} onChange={setCityFilter} className="!w-28 !bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70 [&_.ant-select-arrow]:!text-white/40">
                      <Option value="all">全部城市</Option>
                      {['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉'].map((c) => (<Option key={c} value={c}>{c}</Option>))}
                    </Select>
                    <Select size="small" value={statusFilter} onChange={setStatusFilter} className="!w-28 !bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70 [&_.ant-select-arrow]:!text-white/40">
                      <Option value="all">全部状态</Option>
                      <Option value="active">正常</Option>
                      <Option value="banned">已封禁</Option>
                      <Option value="pending">待认证</Option>
                      <Option value="idle">离线</Option>
                    </Select>
                    <Select size="small" value={creditFilter} onChange={setCreditFilter} className="!w-28 !bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70 [&_.ant-select-arrow]:!text-white/40">
                      <Option value="all">全部信用</Option>
                      <Option value="a">A级 ≥650</Option>
                      <Option value="b">B级 550-649</Option>
                      <Option value="c">C级 450-549</Option>
                      <Option value="d">D级 {'<'}450</Option>
                    </Select>
                    <Button size="small" icon={<Filter size={13} />} ghost className="!border-white/10">高级筛选</Button>
                    <div className="ml-auto text-[11px] text-white/50">共 <span className="text-primary-orange font-bold mx-1">{filteredDrivers.length}</span> 位司机</div>
                  </div>
                  <Table
                    rowKey="key"
                    columns={driverColumns}
                    dataSource={filteredDrivers}
                    scroll={{ x: 1300 }}
                    rowSelection={{ selectedRowKeys: selectedKeys as React.Key[], onChange: (keys) => setSelectedKeys(keys as string[]) }}
                    pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 位司机用户` }}
                    rowClassName={(r) => r.status === 'banned' ? 'bg-danger/[0.04] hover:!bg-danger/[0.07]' : r.status === 'pending' ? 'bg-warning/[0.04] hover:!bg-warning/[0.07]' : ''}
                  />
                </div>
              ),
            },
            {
              key: 'shipper',
              label: (<span className="inline-flex items-center gap-2"><Building2 size={15} />货主企业<Badge count={shipperMock.length} size="small" color="#3B82F6" /></span>),
              children: (
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Input size="small" placeholder="搜索企业/ID/联系人/地区" prefix={<Search size={13} className="text-white/40" />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear className="!w-64 !bg-white/5 !border-white/10" />
                    <Select size="small" value={cityFilter} onChange={setCityFilter} className="!w-28 !bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70 [&_.ant-select-arrow]:!text-white/40">
                      <Option value="all">全部地区</Option>
                      {['上海', '北京', '广东', '浙江', '四川', '江苏', '湖北', '山东', '河南', '陕西', '天津'].map((c) => (<Option key={c} value={c}>{c}</Option>))}
                    </Select>
                    <Select size="small" value={statusFilter} onChange={setStatusFilter} className="!w-28 !bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70 [&_.ant-select-arrow]:!text-white/40">
                      <Option value="all">全部状态</Option>
                      <Option value="active">正常</Option>
                      <Option value="banned">已封禁</Option>
                      <Option value="pending">待认证</Option>
                    </Select>
                    <Button size="small" icon={<Filter size={13} />} ghost className="!border-white/10">高级筛选</Button>
                    <div className="ml-auto text-[11px] text-white/50">共 <span className="text-info font-bold mx-1">{filteredShippers.length}</span> 家企业</div>
                  </div>
                  <Table
                    rowKey="key"
                    columns={shipperColumns}
                    dataSource={filteredShippers}
                    scroll={{ x: 1300 }}
                    rowSelection={{ selectedRowKeys: selectedKeys as React.Key[], onChange: (keys) => setSelectedKeys(keys as string[]) }}
                    pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 家货主企业` }}
                    rowClassName={(r) => r.status === 'banned' ? 'bg-danger/[0.04] hover:!bg-danger/[0.07]' : r.status === 'pending' ? 'bg-warning/[0.04] hover:!bg-warning/[0.07]' : ''}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, user: null, tab: 'info' })}
        width={1100}
        footer={null}
        className="[&_.ant-modal-content]:!bg-deep-blue-800 [&_.ant-modal-header]:!border-white/10 [&_.ant-modal-close]:!text-white/50 [&_.ant-modal-body]:!p-0"
        styles={{ mask: { backdropFilter: 'blur(4px)' } }}
        title={
          detailModal.user && (
            <div className="flex items-center gap-3 -my-1">
              <Avatar size={40} className="!bg-gradient-primary !text-white !font-bold !text-lg">{detailModal.user.avatar}</Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{detailModal.user.name}</span>
                  <Tag color="blue" className="!rounded-md !text-xs">{detailModal.user.id}</Tag>
                  <Tag color={statusMap[detailModal.user.status].c} className="!rounded-md !text-xs">{statusMap[detailModal.user.status].t}</Tag>
                </div>
                <div className="text-[11px] text-white/50 font-mono">{detailModal.user.phone} · {detailModal.user.city}</div>
              </div>
            </div>
          )
        }
      >
        {detailModal.user && (
          <Tabs
            activeKey={detailModal.tab}
            onChange={(t) => setDetailModal({ ...detailModal, tab: t })}
            size="large"
            className="[&_.ant-tabs-tab]:!text-white/60 [&_.ant-tabs-tab-active]:!text-white [&_.ant-tabs-ink-bar]:!bg-primary-orange [&_.ant-tabs-tab]:!px-5 [&_.ant-tabs-nav]:!px-5 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-white/5"
            items={[
              {
                key: 'info', label: '基础信息/证件', icon: <FileText size={13} />,
                children: (
                  <div className="p-6">
                    <Row gutter={24}>
                      <Col xs={24} lg={10}>
                        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                            <span className="text-xs font-semibold text-white/80">三证大图预览</span>
                            <Tag color="green" className="!rounded-md !text-xs"><Check size={11} className="mr-1" />OCR核验通过</Tag>
                          </div>
                          <div className="p-4 space-y-4">
                            {[
                              { k: 'idFront', n: '身份证正面', u: detailModal.user.certs.idFront },
                              { k: 'idBack', n: '身份证背面', u: detailModal.user.certs.idBack },
                              { k: 'driverLicense', n: '驾驶证', u: detailModal.user.certs.driverLicense },
                              { k: 'vehicleLicense', n: '行驶证', u: detailModal.user.certs.vehicleLicense },
                            ].map((c) => (
                              <div key={c.k}>
                                <div className="text-[11px] text-white/50 mb-1.5 flex items-center gap-1.5">
                                  <div className="w-1 h-3 bg-primary-orange rounded" />{c.n}
                                </div>
                                <div className="rounded-lg overflow-hidden border border-white/10">
                                  <Image src={c.u} alt={c.n} className="w-full !max-h-none h-auto" style={{ height: 130, objectFit: 'cover' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} lg={14}>
                        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden mb-4">
                          <div className="px-4 py-2.5 border-b border-white/10 text-xs font-semibold text-white/80">档案资料</div>
                          <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                            {[
                              ['姓名', detailModal.user.name],
                              ['手机号', detailModal.user.phone],
                              ['所在城市', detailModal.user.city],
                              ['车牌号', detailModal.user.plate],
                              ['车型', detailModal.user.truckType],
                              ['信用评分', `${detailModal.user.creditScore} / 850`],
                              ['综合评分', `${detailModal.user.rating.toFixed(1)} 星`],
                              ['准时送达率', `${detailModal.user.onTimeRate}%`],
                              ['注册时间', detailModal.user.registerTime],
                              ['最近活跃', detailModal.user.lastActive],
                            ].map(([k, v]) => (
                              <div key={k as string} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                <span className="text-white/45 flex-shrink-0">{k}</span>
                                <span className="text-white/85 font-mono truncate ml-3 max-w-[60%]" title={v as string}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden mb-4">
                          <div className="px-4 py-2.5 border-b border-white/10 text-xs font-semibold text-white/80 flex items-center justify-between">
                            账户概况
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/50">等级</span>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${levelMap[detailModal.user.level].bg} ${levelMap[detailModal.user.level].border} border`} style={{ color: levelMap[detailModal.user.level].color }}>
                                {levelMap[detailModal.user.level].name}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 grid grid-cols-3 gap-3">
                            {[
                              { t: '钱包余额', v: `¥${detailModal.user.walletBalance.toLocaleString()}`, c: '#10B981', i: <Wallet size={14} /> },
                              { t: '累计运单', v: detailModal.user.totalOrders, c: '#3B82F6', i: <Truck size={14} /> },
                              { t: '累计GMV', v: `¥${(detailModal.user.totalGmv / 10000).toFixed(1)}万`, c: '#FF6B1A', i: <TrendingUp size={14} /> },
                            ].map((k, i) => (
                              <div key={i} className="rounded-lg bg-gradient-to-br from-deep-blue-800/70 to-deep-blue-900/70 border border-white/10 p-3">
                                <div className="flex items-center gap-1.5 text-[10px] text-white/50 mb-1">
                                  <span style={{ color: k.c }}>{k.i}</span>{k.t}
                                </div>
                                <div className="text-lg font-bold font-mono" style={{ color: k.c }}>{k.v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-white/10 text-xs font-semibold text-white/80">近期评价 TOP5</div>
                          <div className="p-2">
                            <List
                              size="small"
                              dataSource={[
                                { n: '上海宏远物流', c: '司机师傅服务态度很好，货物准时送达，五星好评！', s: 5, t: '2024-06-05' },
                                { n: '广州顺丰运输', c: '车辆整洁，沟通顺畅，下次继续合作', s: 5, t: '2024-06-02' },
                                { n: '杭州华东货站', c: '运输途中路线偏了一下，但最终准时，整体满意', s: 4, t: '2024-05-30' },
                                { n: '成都川渝货运', c: '全程冷链温控正常，生鲜完好无损', s: 5, t: '2024-05-28' },
                                { n: '深圳华南物流', c: '稍微迟到了20分钟，提前通知了，问题不大', s: 4, t: '2024-05-25' },
                              ]}
                              renderItem={(r) => (
                                <List.Item className="!border-white/5 !px-3 !py-3">
                                  <div className="w-full">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <Avatar size={20} className="!bg-info !text-white !text-[10px] !font-bold">{r.n.charAt(0)}</Avatar>
                                        <span className="text-xs font-semibold text-white/80">{r.n}</span>
                                        <Rate disabled value={r.s} className="!text-[10px] [&_.ant-rate-star]:!mr-0" />
                                      </div>
                                      <span className="text-[10px] text-white/40 font-mono">{r.t}</span>
                                    </div>
                                    <p className="text-[11px] text-white/55 m-0 leading-snug">{r.c}</p>
                                  </div>
                                </List.Item>
                              )}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'track', label: '运输轨迹', icon: <MapPin size={13} />,
                children: (
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-xs text-white/60 flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary-orange rounded" />
                        <span className="font-semibold text-white/80">最近一单运输轨迹回放</span>
                        <Tag color="blue" className="!rounded-md !text-xs ml-2">YD20240607000123</Tag>
                      </div>
                      <Button size="small" type="link" className="!text-primary-orange !h-auto !p-0">查看全部轨迹 →</Button>
                    </div>
                    <TrackReplay driverName={detailModal.user.name} orderNo="YD20240607000123" startCity="北京" endCity="上海" />
                  </div>
                ),
              },
              {
                key: 'wallet', label: '钱包流水', icon: <Wallet size={13} />,
                children: (
                  <div className="p-5">
                    <Row gutter={16} className="mb-4">
                      <Col span={8}><Card size="small" className="!bg-success/10 !border-success/20"><Statistic title={<span className="text-white/60 text-xs">账户余额</span>} value={detailModal.user.walletBalance} prefix="¥" className="[&_.ant-statistic-content]:!text-success [&_.ant-statistic-content]:!font-bold [&_.ant-statistic-content]:!font-mono" /></Card></Col>
                      <Col span={8}><Card size="small" className="!bg-info/10 !border-info/20"><Statistic title={<span className="text-white/60 text-xs">本月收入</span>} value={Math.round(detailModal.user.walletBalance * 0.6)} prefix="¥" className="[&_.ant-statistic-content]:!text-info [&_.ant-statistic-content]:!font-bold [&_.ant-statistic-content]:!font-mono" /></Card></Col>
                      <Col span={8}><Card size="small" className="!bg-warning/10 !border-warning/20"><Statistic title={<span className="text-white/60 text-xs">待结算</span>} value={Math.round(detailModal.user.walletBalance * 0.3)} prefix="¥" className="[&_.ant-statistic-content]:!text-warning [&_.ant-statistic-content]:!font-bold [&_.ant-statistic-content]:!font-mono" /></Card></Col>
                    </Row>
                    <Timeline
                      mode="left"
                      className="[&_.ant-timeline-item-label]:!w-28 [&_.ant-timeline-item-content]:!ml-36 [&_.ant-timeline-item-label]:!text-right"
                      items={[
                        { color: '#10B981', label: '今天 14:32', children: <div className="rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-xs"><div className="flex items-center justify-between"><span className="text-white/80">运单结算入账 YD202406070088</span><span className="font-mono font-bold text-success">+¥2,850.00</span></div></div> },
                        { color: '#3B82F6', label: '今天 10:18', children: <div className="rounded-lg bg-info/10 border border-info/20 px-3 py-2 text-xs"><div className="flex items-center justify-between"><span className="text-white/80">联盟加油扣费 中石化上海第128站</span><span className="font-mono font-bold text-info">-¥1,862.50</span></div></div> },
                        { color: '#10B981', label: '昨天 18:45', children: <div className="rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-xs"><div className="flex items-center justify-between"><span className="text-white/80">运单结算入账 YD202406060122</span><span className="font-mono font-bold text-success">+¥3,620.00</span></div></div> },
                        { color: '#F59E0B', label: '昨天 09:22', children: <div className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-2 text-xs"><div className="flex items-center justify-between"><span className="text-white/80">预支申请放款</span><span className="font-mono font-bold text-warning">+¥8,000.00</span></div></div> },
                        { color: '#8B5CF6', label: '06-05 15:11', children: <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2 text-xs"><div className="flex items-center justify-between"><span className="text-white/80">提现至 工行6222****8823</span><span className="font-mono font-bold text-purple-400">-¥5,000.00</span></div></div> },
                        { color: '#10B981', label: '06-05 10:33', children: <div className="rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-xs"><div className="flex items-center justify-between"><span className="text-white/80">运单结算入账 YD202406050056</span><span className="font-mono font-bold text-success">+¥4,180.00</span></div></div> },
                      ]}
                    />
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>

      <Drawer
        title={
          shipperDrawer && (
            <div className="flex items-center gap-3 -my-1">
              <Avatar size={40} className="!bg-gradient-to-br !from-info !to-info-600 !text-white !font-bold !text-lg">{shipperDrawer.avatar}</Avatar>
              <div>
                <div className="text-base font-bold text-white">{shipperDrawer.name}</div>
                <div className="text-[11px] text-white/50 font-mono">{shipperDrawer.contact} · {shipperDrawer.phone}</div>
              </div>
            </div>
          )
        }
        placement="right" width={600} open={!!shipperDrawer} onClose={() => setShipperDrawer(null)}
        className="[&_.ant-drawer-content]:!bg-deep-blue-800 [&_.ant-drawer-header]:!border-white/10 [&_.ant-drawer-close]:!text-white/50 [&_.ant-drawer-body]:!p-5"
      >
        {shipperDrawer && (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={8}><Card size="small" className="!bg-info/10 !border-info/20"><Statistic title={<span className="text-white/60 text-xs">信用评分</span>} value={shipperDrawer.creditScore} suffix="/850" className="[&_.ant-statistic-content]:!text-info [&_.ant-statistic-content]:!font-bold [&_.ant-statistic-content]:!font-mono [&_.ant-statistic-content-suffix]:!text-[11px] [&_.ant-statistic-content-suffix]:!text-white/40" /></Card></Col>
              <Col span={8}><Card size="small" className="!bg-success/10 !border-success/20"><Statistic title={<span className="text-white/60 text-xs">累计运单</span>} value={shipperDrawer.totalOrders} suffix="单" className="[&_.ant-statistic-content]:!text-success [&_.ant-statistic-content]:!font-bold [&_.ant-statistic-content]:!font-mono" /></Card></Col>
              <Col span={8}><Card size="small" className="!bg-primary-orange/10 !border-primary-orange/20"><Statistic title={<span className="text-white/60 text-xs">累计GMV</span>} value={shipperDrawer.totalGmv / 10000} precision={1} suffix="万" prefix="¥" className="[&_.ant-statistic-content]:!text-primary-orange [&_.ant-statistic-content]:!font-bold [&_.ant-statistic-content]:!font-mono" /></Card></Col>
            </Row>
            <Card size="small" className="!bg-white/[0.03] !border-white/10"
              title={<div className="text-xs font-semibold text-white/80 flex items-center gap-1.5"><span className="w-1 h-3 bg-info rounded" />授信额度</div>}>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-white/50">总额度</span><span className="font-mono font-bold text-info">¥{(shipperDrawer.creditLimit / 10000).toFixed(0)}万</span></div>
                  <div className="flex items-center justify-between text-xs mb-2"><span className="text-white/50">已使用 {Math.round((shipperDrawer.creditUsed / shipperDrawer.creditLimit) * 100)}%</span><span className="font-mono font-bold text-warning">¥{(shipperDrawer.creditUsed / 10000).toFixed(0)}万</span></div>
                  <Progress percent={Math.round((shipperDrawer.creditUsed / shipperDrawer.creditLimit) * 100)} size="small" showInfo={false} strokeColor={{ from: '#10B981', to: '#3B82F6' }} />
                </Col>
                <Col span={12}>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-white/50">可用额度</span><span className="font-mono font-bold text-success">¥{((shipperDrawer.creditLimit - shipperDrawer.creditUsed) / 10000).toFixed(0)}万</span></div>
                  <div className="flex items-center justify-between text-xs mb-2"><span className="text-white/50">合作评级</span><Rate disabled allowHalf value={shipperDrawer.rating} className="!text-xs [&_.ant-rate-star]:!mr-0.5" /></div>
                  <Button size="small" type="primary" ghost className="!text-primary-orange !border-primary-orange/50 !mt-1 w-full" icon={<Edit3 size={12} />}>调整授信额度</Button>
                </Col>
              </Row>
            </Card>
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/10 text-xs font-semibold text-white/80 flex items-center justify-between">
                营业执照
                <Tag color="green" className="!rounded-md !text-xs"><Check size={11} className="mr-1" />工商核验通过</Tag>
              </div>
              <div className="p-4"><Image src={shipperDrawer.license} alt="营业执照" className="w-full rounded-lg" style={{ height: 200, objectFit: 'cover' }} /></div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/10 text-xs font-semibold text-white/80">企业信息</div>
              <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                {[
                  ['企业名称', shipperDrawer.name],
                  ['联系人', shipperDrawer.contact],
                  ['联系电话', shipperDrawer.phone],
                  ['所在地区', shipperDrawer.province],
                  ['所属行业', shipperDrawer.industry],
                  ['业务类型', shipperDrawer.businessType],
                  ['注册时间', shipperDrawer.registerTime],
                  ['最近活跃', shipperDrawer.lastActive],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <span className="text-white/45 flex-shrink-0">{k}</span>
                    <span className="text-white/85 font-mono truncate ml-3 max-w-[55%]" title={v as string}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={<div className="flex items-center gap-2"><Ban size={18} className="text-danger" /><span className="text-lg font-bold">封禁账号确认</span></div>}
        open={banModal.open} onCancel={() => setBanModal({ open: false, users: [], shipper: [] })}
        okText="确认封禁" cancelText="取消" okButtonProps={{ className: '!bg-danger !border-danger' }}
        onOk={() => { banForm.validateFields().then((v) => { message.success(`已封禁 ${banModal.users.length + (banModal.shipper?.length ?? 0)} 个账号: ${v.reason}`); setBanModal({ open: false, users: [], shipper: [] }); banForm.resetFields(); }); }}
        className="[&_.ant-modal-content]:!bg-deep-blue-800 [&_.ant-modal-header]:!border-white/10 [&_.ant-modal-title]:!text-white [&_.ant-modal-close]:!text-white/50"
      >
        <div className="py-2">
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 mb-4">
            <div className="text-xs text-white/70 flex items-start gap-2">
              <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-danger mb-1">封禁后该账号将无法登录及使用任何功能</div>
                <div className="text-white/55">本次将封禁 <span className="text-danger font-bold mx-1">{banModal.users.length}</span> 位司机
                  {(banModal.shipper?.length ?? 0) > 0 && <>、<span className="text-danger font-bold mx-1">{banModal.shipper?.length}</span> 家货主企业</>}
                  ，操作不可撤销
                </div>
              </div>
            </div>
          </div>
          {banModal.users.slice(0, 5).map((u) => (
            <div key={u.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 mb-1.5">
              <Avatar size={28} className="!bg-gradient-primary !text-white !text-sm">{u.avatar}</Avatar>
              <span className="text-sm text-white/80">{u.name}</span>
              <Tag color="blue" className="!rounded-md !text-[10px] ml-auto">{u.id}</Tag>
            </div>
          ))}
          {banModal.users.length > 5 && <div className="text-[11px] text-white/40 px-3">还有 {banModal.users.length - 5} 位用户...</div>}
          <Form form={banForm} layout="vertical" size="small" className="mt-4 [&_.ant-form-item-label>label]:!text-white/70 [&_.ant-form-item-label>label]:!text-xs">
            <Form.Item name="reason" label="封禁原因" rules={[{ required: true, message: '请选择或输入封禁原因' }]}>
              <Select className="!bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70">
                <Option value="fraud">身份/资质造假</Option>
                <Option value="cancel">恶意取消订单</Option>
                <Option value="overdue">严重逾期不还款</Option>
                <Option value="complaint">客户投诉累计超标</Option>
                <Option value="violation">违反平台协议</Option>
                <Option value="other">其他原因</Option>
              </Select>
            </Form.Item>
            <Form.Item name="notify" valuePropName="checked" initialValue className="!mb-0">
              <Checkbox className="!text-white/60 !text-xs">通过短信/APP站内信通知用户</Checkbox>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Modal
        title={<div className="flex items-center gap-2"><Star size={18} className="text-warning" /><span className="text-lg font-bold">调整信用评分</span></div>}
        open={scoreModal.open} onCancel={() => setScoreModal({ open: false, users: [], shipper: [] })}
        okText="确认调整" cancelText="取消" okButtonProps={{ className: '!bg-gradient-primary !border-0' }}
        onOk={() => {
          scoreForm.validateFields().then((v) => {
            message.success(`已为 ${scoreModal.users.length} 位用户调整信用分 ${v.type === 'increase' ? '+' : '-'}${v.amount}`);
            setScoreModal({ open: false, users: [], shipper: [] });
            scoreForm.resetFields();
          });
        }}
        className="[&_.ant-modal-content]:!bg-deep-blue-800 [&_.ant-modal-header]:!border-white/10 [&_.ant-modal-title]:!text-white [&_.ant-modal-close]:!text-white/50"
      >
        <div className="py-2">
          {scoreModal.users.slice(0, 4).map((u, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 mb-1.5">
              <Avatar size={26} className="!bg-gradient-primary !text-white !text-xs">{u.avatar}</Avatar>
              <span className="text-xs text-white/80">{u.name}</span>
              <span className="text-[10px] text-primary-orange font-mono ml-auto">信用分 {(u as any).creditScore ?? '—'}</span>
            </div>
          ))}
          {scoreModal.users.length > 4 && <div className="text-[11px] text-white/40 px-3 mb-3">还有 {scoreModal.users.length - 4} 位用户...</div>}
          <Form form={scoreForm} layout="vertical" size="small" className="mt-3 [&_.ant-form-item-label>label]:!text-white/70 [&_.ant-form-item-label>label]:!text-xs">
            <Row gutter={12}>
              <Col span={10}>
                <Form.Item name="type" label="调整方式" rules={[{ required: true, message: '请选择' }]} initialValue="increase">
                  <Segmented options={[{ label: '加分 +', value: 'increase' }, { label: '减分 -', value: 'decrease' }]} block />
                </Form.Item>
              </Col>
              <Col span={14}>
                <Form.Item name="amount" label="调整分值" rules={[{ required: true, message: '请输入分值 1-100' }]} initialValue={10}>
                  <InputNumber min={1} max={100} className="!w-full !bg-white/5 !border-white/10" suffix={<span className="text-white/40">分</span>} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="reason" label="调整原因" rules={[{ required: true, message: '请选择或输入原因' }]}>
              <Select className="!bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70" placeholder="请选择调整原因">
                <Option value="excellent">运输服务优秀激励</Option>
                <Option value="monthly">月度星级奖励</Option>
                <Option value="compensation">异常补偿加分</Option>
                <Option value="late">连续迟到扣减</Option>
                <Option value="complaint">客户投诉扣减</Option>
                <Option value="cancel">恶意取消订单扣减</Option>
                <Option value="other">运营人工调整</Option>
              </Select>
            </Form.Item>
            <Form.Item name="remark" label="备注说明">
              <Input.TextArea rows={2} placeholder="补充说明（选填）" className="!bg-white/5 !border-white/10 !text-white/80 !placeholder:text-white/30" />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;