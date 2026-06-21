import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  DatePicker,
  Select,
  Progress,
  Statistic,
  Row,
  Col,
  Tabs,
  Badge,
  Avatar,
  Tooltip,
  Drawer,
  List,
  Typography,
  Timeline,
  Modal,
  Segmented,
  Divider,
  Empty,
  message,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { ColumnsType } from 'antd/es/table';
import {
  Wallet,
  Lock,
  Clock,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  FileText,
  Eye,
  Building2,
  PiggyBank,
  CreditCard,
  Landmark,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  Database,
  ShieldAlert as ShieldAlertIcon,
} from 'lucide-react';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Title } = Typography;

interface FundFlowItem {
  key: string;
  id: string;
  type: 'loan' | 'deduct' | 'refund' | 'settle' | 'recharge';
  amount: number;
  balanceAfter: number;
  userType: 'driver' | 'shipper';
  userName: string;
  userAvatar: string;
  orderNo?: string;
  bankName?: string;
  bankAccount?: string;
  status: 'success' | 'pending' | 'failed' | 'processing';
  createTime: string;
  finishTime?: string;
  remark?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

interface ReconcileItem {
  key: string;
  batchId: string;
  bankName: string;
  date: string;
  platformCount: number;
  platformAmount: number;
  bankCount: number;
  bankAmount: number;
  diffCount: number;
  diffAmount: number;
  status: 'matched' | 'mismatch' | 'pending';
}

const flowMock: FundFlowItem[] = Array.from({ length: 12 }).map((_, i) => {
  const types: FundFlowItem['type'][] = ['loan', 'deduct', 'refund', 'settle', 'recharge'];
  const statuses: FundFlowItem['status'][] = ['success', 'pending', 'processing', 'failed'];
  const risks: FundFlowItem['riskLevel'][] = ['low', 'medium', 'high'];
  const names = ['王志强', '上海宏远物流', '李明辉', '赵磊', '杭州XX供应链', '北京中远物流', '张建军', '广州顺丰供应链'];
  return {
    key: String(i + 1),
    id: `FW20240607000${i + 1}`,
    type: types[i % 5],
    amount: 1000 + Math.round(Math.random() * 500000),
    balanceAfter: 8000000 + Math.round(Math.random() * 3000000),
    userType: i % 3 === 1 ? 'shipper' : 'driver',
    userName: names[i % names.length],
    userAvatar: names[i % names.length].charAt(0),
    orderNo: i % 2 === 0 ? `YD20240607${8800 + i}` : undefined,
    bankName: ['工商银行', '建设银行', '招商银行', '农业银行'][i % 4],
    bankAccount: `${6222 + i}****${8800 + i}`,
    status: statuses[i % 4],
    createTime: `2024-06-07 ${String(14 - Math.floor(i / 2)).padStart(2, '0')}:${String(30 + i * 5).padStart(2, '0')}:${String(10 + i * 3).padStart(2, '0')}`,
    finishTime: i % 3 === 0 ? undefined : `2024-06-07 ${String(14 - Math.floor(i / 2)).padStart(2, '0')}:${String(35 + i * 5).padStart(2, '0')}:${String(15 + i * 3).padStart(2, '0')}`,
    remark: i === 6 ? '开户行校验失败，请核对信息' : undefined,
    riskLevel: i % 2 === 0 ? risks[i % 3] : undefined,
  };
});

const reconcileMock: ReconcileItem[] = [
  { key: '1', batchId: 'BANK2024060601', bankName: '工商银行', date: '2024-06-06', platformCount: 1258, platformAmount: 8623500, bankCount: 1256, bankAmount: 8618200, diffCount: 2, diffAmount: 5300, status: 'mismatch' },
  { key: '2', batchId: 'BANK2024060602', bankName: '建设银行', date: '2024-06-06', platformCount: 986, platformAmount: 5234800, bankCount: 986, bankAmount: 5234800, diffCount: 0, diffAmount: 0, status: 'matched' },
  { key: '3', batchId: 'BANK2024060603', bankName: '招商银行', date: '2024-06-06', platformCount: 624, platformAmount: 3452100, bankCount: 624, bankAmount: 3452100, diffCount: 0, diffAmount: 0, status: 'matched' },
  { key: '4', batchId: 'BANK2024060604', bankName: '农业银行', date: '2024-06-06', platformCount: 452, platformAmount: 2156700, bankCount: 0, bankAmount: 0, diffCount: 452, diffAmount: 2156700, status: 'pending' },
  { key: '5', batchId: 'BANK2024060501', bankName: '工商银行', date: '2024-06-05', platformCount: 1188, platformAmount: 7856200, bankCount: 1188, bankAmount: 7856200, diffCount: 0, diffAmount: 0, status: 'matched' },
];

const formatMoney = (v: number, fixed = 0) => '¥' + v.toLocaleString('zh-CN', { minimumFractionDigits: fixed, maximumFractionDigits: fixed });

const typeMap: Record<FundFlowItem['type'], { text: string; icon: React.ReactNode; color: string }> = {
  loan: { text: '放款', icon: <CreditCard size={13} />, color: '#3B82F6' },
  deduct: { text: '扣款', icon: <ArrowDownRight size={13} />, color: '#F59E0B' },
  refund: { text: '退款', icon: <Receipt size={13} />, color: '#8B5CF6' },
  settle: { text: '结算', icon: <Landmark size={13} />, color: '#10B981' },
  recharge: { text: '充值', icon: <ArrowUpRight size={13} />, color: '#06B6D4' },
};

const statusMap: Record<FundFlowItem['status'], { text: string; color: string; icon: React.ReactNode }> = {
  success: { text: '成功', color: 'green', icon: <CheckCircle2 size={11} /> },
  pending: { text: '待处理', color: 'warning', icon: <Clock3 size={11} /> },
  processing: { text: '处理中', color: 'processing', icon: <RefreshCw size={11} className="animate-spin" /> },
  failed: { text: '失败', color: 'red', icon: <XCircle size={11} /> },
};

interface AdminFundProps { defaultTab?: string; }
const AdminFund: React.FC<AdminFundProps> = ({ defaultTab = 'flow' }) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [flowType, setFlowType] = useState<'all' | FundFlowItem['type']>('all');
  const [flowStatus, setFlowStatus] = useState<'all' | FundFlowItem['status']>('all');
  const [searchText, setSearchText] = useState('');
  const [detailDrawer, setDetailDrawer] = useState<{ open: boolean; item: FundFlowItem | null }>({ open: false, item: null });
  const [reconcileModal, setReconcileModal] = useState<ReconcileItem | null>(null);

  const distributionOption: EChartsOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', backgroundColor: 'rgba(10,35,66,0.95)', borderColor: 'rgba(255,107,26,0.3)', textStyle: { color: '#fff', fontSize: 12 }, formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 0, top: 'center', itemWidth: 8, itemHeight: 8, textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11 } },
      series: [{
        type: 'pie', radius: ['52%', '78%'], center: ['38%', '50%'], avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: 'rgba(10,35,66,1)', borderWidth: 3 },
        label: { show: false },
        emphasis: { label: { show: true, color: '#fff', fontSize: 12, fontWeight: 'bold' }, itemStyle: { shadowBlur: 16, shadowColor: 'rgba(255,107,26,0.35)' } },
        labelLine: { show: false },
        data: [
          { value: 9623500, name: '可用余额', itemStyle: { color: '#10B981' } },
          { value: 1280500, name: '冻结金额', itemStyle: { color: '#F59E0B' } },
          { value: 2845600, name: '在途放款', itemStyle: { color: '#3B82F6' } },
          { value: 186200, name: '坏账计提', itemStyle: { color: '#EF4444' } },
        ],
      }],
    }),
    []
  );

  const riskPieOption: EChartsOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', backgroundColor: 'rgba(10,35,66,0.95)', borderColor: 'rgba(255,107,26,0.3)', textStyle: { color: '#fff', fontSize: 12 }, formatter: '{b}: {c}笔 ({d}%)' },
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11 } },
      series: [{
        name: '预支风险分布', type: 'pie', radius: ['40%', '68%'], roseType: 'radius', center: ['50%', '42%'],
        itemStyle: { borderRadius: 6, borderColor: 'rgba(10,35,66,1)', borderWidth: 2 },
        label: { color: 'rgba(255,255,255,0.8)', fontSize: 10, formatter: '{b}\n{c}笔' },
        labelLine: { length: 6, length2: 6, lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        data: [
          { value: 186, name: '低风险', itemStyle: { color: '#10B981' } },
          { value: 92, name: '中风险', itemStyle: { color: '#F59E0B' } },
          { value: 48, name: '高风险', itemStyle: { color: '#FF6B1A' } },
          { value: 22, name: '已拒绝', itemStyle: { color: '#EF4444' } },
        ],
      }],
    }),
    []
  );

  const loanTrendOption: EChartsOption = useMemo(
    () => {
      const dates = ['06-01', '06-02', '06-03', '06-04', '06-05', '06-06', '06-07'];
      const loan = [2.8, 3.1, 2.6, 3.4, 2.9, 3.8, 3.28];
      const deduct = [1.9, 2.2, 1.8, 2.5, 2.1, 2.8, 2.45];
      return {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(10,35,66,0.95)', borderColor: 'rgba(255,107,26,0.3)', textStyle: { color: '#fff', fontSize: 12 }, axisPointer: { type: 'cross', lineStyle: { color: 'rgba(255,107,26,0.3)' } } },
        legend: { data: ['日放款额', '日扣款额'], top: 0, right: 0, textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 }, icon: 'roundRect', itemWidth: 12, itemHeight: 4 },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: 'category', boundaryGap: false, data: dates, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 }, axisTick: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, formatter: '{value}M' } },
        series: [
          { name: '日放款额', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, data: loan,
            lineStyle: { width: 3, color: '#FF6B1A', shadowBlur: 10, shadowColor: 'rgba(255,107,26,0.4)' },
            itemStyle: { color: '#FF6B1A', borderColor: '#fff', borderWidth: 2 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,107,26,0.3)' }, { offset: 1, color: 'rgba(255,107,26,0)' }] } } },
          { name: '日扣款额', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, data: deduct,
            lineStyle: { width: 3, color: '#10B981', shadowBlur: 10, shadowColor: 'rgba(16,185,129,0.4)' },
            itemStyle: { color: '#10B981', borderColor: '#fff', borderWidth: 2 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.25)' }, { offset: 1, color: 'rgba(16,185,129,0)' }] } } },
        ],
      };
    },
    []
  );

  const filteredFlow = useMemo(() => {
    return flowMock.filter((f) => {
      if (flowType !== 'all' && f.type !== flowType) return false;
      if (flowStatus !== 'all' && f.status !== flowStatus) return false;
      if (searchText && !`${f.id}${f.userName}${f.orderNo || ''}`.includes(searchText)) return false;
      return true;
    });
  }, [flowType, flowStatus, searchText]);

  const flowColumns: ColumnsType<FundFlowItem> = [
    { title: '流水号', dataIndex: 'id', width: 160, render: (v) => <span className="text-xs font-mono text-info">{v}</span> },
    { title: '类型', dataIndex: 'type', width: 90,
      render: (v: FundFlowItem['type']) => {
        const t = typeMap[v];
        return <Tag color={t.color} className="!rounded-md !font-semibold !text-xs !m-0"><span className="inline-flex items-center gap-1">{t.icon}{t.text}</span></Tag>;
      } },
    { title: '金额', dataIndex: 'amount', width: 150,
      render: (v: number, r) => (
        <div className="text-right">
          <div className={`text-base font-bold font-mono ${r.type === 'deduct' ? 'text-danger' : 'text-success'}`}>
            {r.type === 'deduct' ? '-' : '+'}{formatMoney(v, 2)}
          </div>
          {r.riskLevel && <Tag className="!rounded-md !text-[10px] !mt-0.5" color={r.riskLevel === 'low' ? 'green' : r.riskLevel === 'medium' ? 'orange' : 'red'}>
            {r.riskLevel === 'low' ? '低风险' : r.riskLevel === 'medium' ? '中风险' : '高风险'}
          </Tag>}
        </div>
      ) },
    { title: '用户', width: 170,
      render: (_, r) => (
        <div className="flex items-center gap-2.5">
          <Avatar size={34} className={`!text-white !font-semibold !border-2 !border-white/20 ${r.userType === 'driver' ? '!bg-gradient-primary' : '!bg-gradient-to-br !from-info !to-info-600'}`}>{r.userAvatar}</Avatar>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{r.userName}</div>
            <div className="text-[10px] text-white/50">{r.userType === 'driver' ? '司机' : '货主'}</div>
          </div>
        </div>
      ) },
    { title: '关联信息', width: 180,
      render: (_, r) => (
        <div className="text-xs space-y-0.5">
          {r.orderNo && <div className="text-white/70 font-mono">{r.orderNo}</div>}
          {r.bankAccount && <div className="text-white/40 flex items-center gap-1"><Landmark size={10} />{r.bankName} {r.bankAccount}</div>}
        </div>
      ) },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (s: FundFlowItem['status']) => {
        const t = statusMap[s];
        return <Tag color={t.color} className="!rounded-md !text-xs !font-semibold"><span className="inline-flex items-center gap-1">{t.icon}{t.text}</span></Tag>;
      } },
    { title: '时间', width: 170,
      render: (_, r) => (
        <div className="text-[11px] font-mono space-y-0.5 text-white/60">
          <div>创建: {r.createTime}</div>
          {r.finishTime && <div>完成: {r.finishTime}</div>}
        </div>
      ) },
    { title: '操作', key: 'action', width: 120, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="查看详情"><Button type="text" size="small" icon={<Eye size={14} className="text-white/70" />} onClick={() => setDetailDrawer({ open: true, item: r })} /></Tooltip>
          {r.status === 'failed' && <Tooltip title="重试"><Button type="text" size="small" icon={<RefreshCw size={14} className="text-warning" />} onClick={() => message.info(`已提交重试 ${r.id}`)} /></Tooltip>}
          {r.remark && <Tooltip title={r.remark}><AlertCircle size={14} className="text-danger" /></Tooltip>}
        </Space>
      ) },
  ];

  const statsCards = [
    { label: '可用余额', value: 9623500, trend: 5.8, icon: <Wallet size={20} />, color: '#10B981' },
    { label: '冻结金额', value: 1280500, trend: 2.1, icon: <Lock size={20} />, color: '#F59E0B' },
    { label: '在途放款', value: 2845600, trend: 12.6, icon: <Clock size={20} />, color: '#3B82F6' },
    { label: '坏账率', value: 0.186, trend: -8.4, icon: <AlertTriangle size={20} />, color: '#EF4444', reverse: true, fmt: (v: number) => v.toFixed(2), unit: '%' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0 mb-1.5">资金监控中心</h1>
          <p className="text-sm text-white/50 m-0">全链路资金流水 · 放款/扣款/结算 · 银行对账 · 异常预警</p>
        </div>
        <Space>
          <Button icon={<RefreshCw size={15} />} ghost className="!border-white/10">刷新</Button>
          <Button icon={<Download size={15} />} ghost className="!border-white/10">导出对账单</Button>
          <Button type="primary" icon={<Database size={15} />} className="!bg-gradient-primary !border-0 shadow-soft-orange">发起对账</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Row gutter={16}>
            {statsCards.map((s, i) => (
              <Col xs={12} md={6} key={i}>
                <Card className="!bg-gradient-to-br !from-deep-blue-800/60 !to-deep-blue-900/60 !border-white/10 !backdrop-blur !h-full" styles={{ body: { padding: 16 } }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}88)`, boxShadow: `0 6px 16px -6px ${s.color}55` }}>{s.icon}</div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${(s.reverse ? s.trend < 0 : s.trend > 0) ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                      {s.trend > 0 ? '+' : ''}{s.trend.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50 mb-1">{s.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.fmt ? s.fmt(s.value) : (s.value >= 10000 ? (s.value / 10000).toFixed(2) : s.value.toLocaleString())}</span>
                    <span className="text-[11px] text-white/50">{s.unit ?? (s.value >= 10000 ? '万' : '元')}</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="!bg-gradient-to-br !from-deep-blue-800/60 !to-deep-blue-900/60 !border-white/10 !backdrop-blur !h-full" styles={{ body: { padding: '12px 16px 16px' } }}
            title={<div className="text-sm font-semibold text-white flex items-center gap-2 !py-2"><PiggyBank size={15} className="text-primary-orange" />资金池分布</div>}>
            <div style={{ height: 150 }}><ReactECharts option={distributionOption} style={{ height: '100%' }} theme="dark" /></div>
          </Card>
        </Col>
      </Row>

      <div className="dashboard-panel">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large"
          className="[&_.ant-tabs-tab]:!text-white/60 [&_.ant-tabs-tab-active]:!text-white [&_.ant-tabs-ink-bar]:!bg-primary-orange [&_.ant-tabs-tab]:!px-5 [&_.ant-tabs-nav]:!px-5 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-white/5"
          items={[
            { key: 'flow', label: <span className="inline-flex items-center gap-2"><FileText size={15} />放款流水<Badge count={flowMock.length} size="small" color="#3B82F6" /></span>,
              children: (
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Segmented value={flowType} onChange={(v) => setFlowType(v as any)} size="small" className="!bg-white/5"
                      options={[{ label: '全部', value: 'all' }, { label: '放款', value: 'loan' }, { label: '扣款', value: 'deduct' }, { label: '退款', value: 'refund' }, { label: '结算', value: 'settle' }, { label: '充值', value: 'recharge' }]} />
                    <Segmented value={flowStatus} onChange={(v) => setFlowStatus(v as any)} size="small" className="!bg-white/5"
                      options={[{ label: '全部', value: 'all' }, { label: '成功', value: 'success' }, { label: '处理中', value: 'processing' }, { label: '待处理', value: 'pending' }, { label: '失败', value: 'failed' }]} />
                    <div className="h-5 w-px bg-white/10" />
                    <Input size="small" placeholder="流水号/用户/运单" prefix={<Search size={13} className="text-white/40" />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear className="!w-60 !bg-white/5 !border-white/10" />
                    <RangePicker size="small" className="!bg-white/5 !border-white/10 !w-auto" />
                    <Button size="small" icon={<Filter size={13} />} ghost className="!border-white/10">筛选</Button>
                    <Button size="small" icon={<Download size={13} />} ghost className="!border-white/10 !ml-auto">导出</Button>
                  </div>
                  <Timeline mode="left" className="mb-4 [&_.ant-timeline-item-label]:!w-40 [&_.ant-timeline-item-content]:!ml-52 [&_.ant-timeline-item-label]:!text-right"
                    items={[
                      { color: '#10B981', label: '14:32 放款成功', children: <div className="rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-xs text-white/70">工商银行处理完成，128笔放款全部到账，累计 ¥1,285,600</div> },
                      { color: '#F59E0B', label: '14:10 等待银行', children: <div className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-2 text-xs text-white/70">招商银行处理中，共 62 笔预支申请，预计 10 分钟内到账</div> },
                      { color: '#EF4444', label: '10:42 放款失败', children: <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-white/70">农业银行 1 笔失败：张建军 开户行校验失败，已通知人工介入</div> },
                    ]} />
                  <Table rowKey="key" columns={flowColumns} dataSource={filteredFlow} scroll={{ x: 1400 }}
                    pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (t) => `共 ${t} 条记录` }} />
                </div>
              ) },
            { key: 'risk', label: <span className="inline-flex items-center gap-2"><ShieldAlertIcon size={15} />风险与趋势</span>,
              children: (
                <div className="p-5">
                  <Row gutter={16}>
                    <Col xs={24} lg={10}>
                      <Card size="small" className="!bg-white/[0.03] !border-white/10" styles={{ body: { padding: 12 } }}
                        title={<div className="text-sm font-semibold text-white flex items-center gap-2"><AlertTriangle size={14} className="text-warning" />预支风险分布</div>}>
                        <div style={{ height: 280 }}><ReactECharts option={riskPieOption} style={{ height: '100%' }} theme="dark" /></div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={14}>
                      <Card size="small" className="!bg-white/[0.03] !border-white/10 !mb-4" styles={{ body: { padding: 12 } }}
                        title={<div className="text-sm font-semibold text-white flex items-center gap-2"><TrendingUp size={14} className="text-primary-orange" />每日放款/扣款趋势 (近7日)</div>}>
                        <div style={{ height: 280 }}><ReactECharts option={loanTrendOption} style={{ height: '100%' }} theme="dark" /></div>
                      </Card>
                      <Row gutter={16}>
                        {[
                          { t: '7日累计放款', v: 21.88, unit: '百万元', color: '#FF6B1A', pct: 18.2 },
                          { t: '7日累计扣款', v: 15.75, unit: '百万元', color: '#10B981', pct: 12.5 },
                          { t: '平均放款响应', v: 38, unit: '秒', color: '#3B82F6', pct: -22.1 },
                          { t: '自动审批率', v: 72.4, unit: '%', color: '#8B5CF6', pct: 6.8 },
                        ].map((k, i) => (
                          <Col xs={12} key={i}>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-deep-blue-800/50 to-deep-blue-900/50 border border-white/10">
                              <div className="text-[11px] text-white/50 mb-1">{k.t}</div>
                              <div className="flex items-baseline justify-between">
                                <div><span className="text-2xl font-bold font-mono" style={{ color: k.color }}>{k.v}</span><span className="text-[11px] text-white/50 ml-1">{k.unit}</span></div>
                                <span className={`text-[10px] font-semibold ${k.pct > 0 ? 'text-success' : 'text-danger'}`}>{k.pct > 0 ? '↑' : '↓'}{Math.abs(k.pct)}%</span>
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </Col>
                  </Row>
                </div>
              ) },
            { key: 'reconcile', label: <span className="inline-flex items-center gap-2"><Landmark size={15} />银行对账</span>,
              children: (
                <div className="p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                    {[
                      { t: '对账批次', v: 32, tag: '本月', color: '#3B82F6' },
                      { t: '完全匹配', v: 28, tag: '87.5%', color: '#10B981' },
                      { t: '差异处理中', v: 2, tag: '待人工', color: '#F59E0B' },
                      { t: '未回执', v: 2, tag: '超时1', color: '#EF4444' },
                    ].map((k, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-deep-blue-800/50 to-deep-blue-900/50 border border-white/10 flex items-center justify-between">
                        <div><div className="text-[11px] text-white/50 mb-1">{k.t}</div><span className="text-2xl font-bold font-mono" style={{ color: k.color }}>{k.v}</span></div>
                        <Tag color={k.color} className="!rounded-md !text-xs">{k.tag}</Tag>
                      </div>
                    ))}
                  </div>
                  <Table rowKey="key" dataSource={reconcileMock} pagination={{ pageSize: 8 }}
                    columns={[
                      { title: '对账批次', width: 180, render: (_, r) => (<div><div className="text-sm font-mono font-semibold text-info">{r.batchId}</div><div className="text-[11px] text-white/50 mt-0.5 flex items-center gap-1"><Building2 size={10} />{r.bankName} · {r.date}</div></div>) },
                      { title: '平台侧', width: 180, render: (_, r) => (<div className="text-xs space-y-0.5"><div className="flex items-center justify-between"><span className="text-white/50">笔数</span><span className="font-mono text-white/80">{r.platformCount}</span></div><div className="flex items-center justify-between"><span className="text-white/50">金额</span><span className="font-mono text-success font-semibold">{formatMoney(r.platformAmount)}</span></div></div>) },
                      { title: '银行侧', width: 180, render: (_, r) => (<div className="text-xs space-y-0.5"><div className="flex items-center justify-between"><span className="text-white/50">笔数</span><span className="font-mono text-white/80">{r.bankCount}</span></div><div className="flex items-center justify-between"><span className="text-white/50">金额</span><span className="font-mono text-info font-semibold">{formatMoney(r.bankAmount)}</span></div></div>) },
                      { title: '差异', width: 180, render: (_, r) => (<div className={`rounded-lg p-3 border ${r.status === 'matched' ? 'bg-success/10 border-success/20' : r.status === 'pending' ? 'bg-info/10 border-info/20' : 'bg-danger/10 border-danger/20'}`}><div className="text-xs space-y-0.5"><div className="flex items-center justify-between"><span className="text-white/60">笔数差</span><span className={`font-mono font-bold ${r.diffCount === 0 ? 'text-success' : 'text-danger'}`}>{r.diffCount > 0 ? '+' : ''}{r.diffCount}</span></div><div className="flex items-center justify-between"><span className="text-white/60">金额差</span><span className={`font-mono font-bold ${r.diffAmount === 0 ? 'text-success' : 'text-danger'}`}>{r.diffAmount > 0 ? '+' : ''}{formatMoney(r.diffAmount)}</span></div></div></div>) },
                      { title: '状态', width: 110, render: (_, r) => { const map = { matched: { c: 'success', t: '已匹配', i: <CheckCircle2 size={12} /> }, mismatch: { c: 'warning', t: '有差异', i: <AlertTriangle size={12} /> }, pending: { c: 'processing', t: '处理中', i: <Clock3 size={12} /> } }; const s = map[r.status]; return <Tag color={s.c} className="!rounded-md !font-semibold !text-xs"><span className="inline-flex items-center gap-1">{s.i}{s.t}</span></Tag>; } },
                      { title: '操作', width: 140, fixed: 'right', render: (_, r) => (<Space size="small"><Button type="primary" ghost size="small" icon={<Eye size={13} />} onClick={() => setReconcileModal(r)}>差异详情</Button><Button size="small" type="text" icon={<Download size={13} className="text-white/70" />} /></Space>) },
                    ]} />
                </div>
              ) },
            { key: 'alert', label: <span className="inline-flex items-center gap-2"><AlertTriangle size={15} className="text-danger" />异常告警看板<Badge count={8} size="small" color="#EF4444" /></span>,
              children: (
                <div className="p-5">
                  <Row gutter={16}>
                    {[
                      { level: 'danger', items: [{ t: '放款失败超3笔', d: '农业银行渠道今日失败3笔，共¥18,600，建议检查渠道状态', time: '10分钟前' }, { t: '大额资金异动', d: '建设银行单笔结算¥1,285,000超出阈值¥1,000,000', time: '1小时前' }, { t: '坏账突增预警', d: 'M1+逾期率环比上周上升25.6%，需关注', time: '3小时前' }] },
                      { level: 'warning', items: [{ t: '对账超时未回执', d: '农业银行BANK2024060604批次超时6小时', time: '30分钟前' }, { t: '预支申请积压', d: '待人工审批高风险订单22笔，超SLA 8笔', time: '45分钟前' }, { t: '余额阈值告警', d: '招商银行结算户余额低于¥500万安全线', time: '2小时前' }] },
                      { level: 'info', items: [{ t: '日终批处理完成', d: '6月6日日终清算完成，共处理交易3,428笔', time: '6小时前' }, { t: '渠道限流恢复', d: '工商银行限流已解除，通道恢复正常', time: '8小时前' }] },
                    ].map((group, gi) => (
                      <Col xs={24} lg={8} key={gi}>
                        <div className={`rounded-xl border overflow-hidden ${group.level === 'danger' ? 'bg-danger/[0.04] border-danger/20' : group.level === 'warning' ? 'bg-warning/[0.04] border-warning/20' : 'bg-info/[0.04] border-info/20'}`}>
                          <div className={`px-4 py-2.5 border-b flex items-center justify-between ${group.level === 'danger' ? 'border-danger/20 bg-danger/10' : group.level === 'warning' ? 'border-warning/20 bg-warning/10' : 'border-info/20 bg-info/10'}`}>
                            <div className="flex items-center gap-2"><AlertTriangle size={14} className={group.level === 'danger' ? 'text-danger' : group.level === 'warning' ? 'text-warning' : 'text-info'} /><span className={`text-xs font-bold uppercase tracking-wide ${group.level === 'danger' ? 'text-danger' : group.level === 'warning' ? 'text-warning' : 'text-info'}`}>{group.level === 'danger' ? '严重告警' : group.level === 'warning' ? '提醒预警' : '系统通知'}</span></div>
                            <Badge count={group.items.length} size="small" color={group.level === 'danger' ? '#EF4444' : group.level === 'warning' ? '#F59E0B' : '#3B82F6'} />
                          </div>
                          <List size="small" dataSource={group.items} renderItem={(it, i) => (<List.Item className="!px-4 !py-3 !border-b !border-white/5 last:!border-0" style={{ cursor: 'pointer' }} onClick={() => message.info(`处理: ${it.t}`)}>
                            <div className="w-full"><div className="flex items-start justify-between gap-3 mb-1"><span className="text-sm font-semibold text-white/90">{it.t}</span><span className="text-[10px] text-white/40 font-mono flex-shrink-0">{it.time}</span></div><p className="text-xs text-white/55 m-0 leading-relaxed">{it.d}</p><div className="mt-2 flex items-center gap-1.5"><Button size="small" type="link" className="!h-auto !p-0 !text-xs">立即处理</Button><ChevronRight size={11} className="text-white/30" /></div></div>
                          </List.Item>)} />
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              ) },
          ]} />
      </div>

      <Drawer title={<div className="flex items-center gap-2"><FileText size={18} className="text-primary-orange" /><span className="text-lg font-bold text-white">流水详情</span></div>}
        placement="right" width={520} onClose={() => setDetailDrawer({ open: false, item: null })} open={detailDrawer.open}
        className="[&_.ant-drawer-content]:!bg-deep-blue-800 [&_.ant-drawer-header]:!border-white/10 [&_.ant-drawer-close]:!text-white/50 [&_.ant-drawer-body]:!p-6">
        {detailDrawer.item && (
          <div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-orange/10 to-info/5 border border-white/10 mb-5">
              <div className="flex items-center justify-between mb-4">
                <div><div className="text-[11px] text-white/50 mb-1">流水编号</div><div className="text-lg font-mono font-bold text-info">{detailDrawer.item.id}</div></div>
                {(() => { const s = statusMap[detailDrawer.item.status]; const t = typeMap[detailDrawer.item.type]; return <div className="flex flex-col items-end gap-1.5"><Tag color={s.color} className="!rounded-md !font-semibold"><span className="inline-flex items-center gap-1">{s.icon}{s.text}</span></Tag><Tag className="!rounded-md !text-xs" style={{ color: t.color, borderColor: `${t.color}55` }}><span className="inline-flex items-center gap-1">{t.icon}{t.text}</span></Tag></div>; })()}
              </div>
              <Divider className="!border-white/10 !my-3" />
              <Row gutter={24}>
                <Col span={12}><Statistic title={<span className="text-white/50 text-xs">交易金额</span>} value={detailDrawer.item.amount} precision={2} prefix={detailDrawer.item.type === 'deduct' ? '-' : '+'} className="[&_.ant-statistic-content]:!text-xl [&_.ant-statistic-content]:!font-mono [&_.ant-statistic-content]:!font-bold" valueStyle={{ color: detailDrawer.item.type === 'deduct' ? '#EF4444' : '#10B981' }} /></Col>
                <Col span={12}><Statistic title={<span className="text-white/50 text-xs">变动后余额</span>} value={detailDrawer.item.balanceAfter} precision={2} prefix="¥" className="[&_.ant-statistic-content]:!text-xl [&_.ant-statistic-content]:!font-mono [&_.ant-statistic-content]:!font-bold" valueStyle={{ color: '#fff' }} /></Col>
              </Row>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-primary-orange uppercase tracking-wider mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-primary-orange rounded" />交易双方</div>
                <div className="rounded-xl bg-white/5 border border-white/10 divide-y divide-white/10">
                  <div className="p-4 flex items-center gap-3">
                    <Avatar size={42} className={`!text-white !font-bold !border-2 !border-white/20 ${detailDrawer.item.userType === 'driver' ? '!bg-gradient-primary' : '!bg-gradient-to-br !from-info !to-info-600'}`}>{detailDrawer.item.userAvatar}</Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold text-white">{detailDrawer.item.userName}</span><Tag color={detailDrawer.item.userType === 'driver' ? 'orange' : 'blue'} className="!rounded-md !text-[10px]">{detailDrawer.item.userType === 'driver' ? '司机' : '货主'}</Tag></div>
                      {detailDrawer.item.bankAccount && <div className="text-[11px] text-white/50 font-mono mt-0.5">{detailDrawer.item.bankName} · {detailDrawer.item.bankAccount}</div>}
                    </div>
                  </div>
                  {detailDrawer.item.orderNo && <div className="p-4"><div className="text-[11px] text-white/50 mb-1.5 flex items-center gap-1"><Receipt size={11} />关联业务</div><div className="text-sm font-mono text-white/85">{detailDrawer.item.orderNo}</div></div>}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-info uppercase tracking-wider mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-info rounded" />处理进度</div>
                <Timeline items={[
                  { color: '#10B981', children: <div><div className="text-sm text-white font-semibold">创建申请</div><div className="text-[11px] text-white/50 font-mono">{detailDrawer.item.createTime}</div></div> },
                  ...(detailDrawer.item.riskLevel ? [{ color: detailDrawer.item.riskLevel === 'low' ? '#10B981' : detailDrawer.item.riskLevel === 'medium' ? '#F59E0B' : '#EF4444', children: <div><div className="text-sm text-white font-semibold">风控评估 - {detailDrawer.item.riskLevel === 'low' ? '低风险' : detailDrawer.item.riskLevel === 'medium' ? '中风险' : '高风险'}</div><div className="text-[11px] text-white/50">{detailDrawer.item.riskLevel === 'low' ? '自动审批通过' : detailDrawer.item.riskLevel === 'medium' ? '人工复核放行' : '待运营主管审批'}</div></div> }] : []),
                  { color: detailDrawer.item.finishTime ? (detailDrawer.item.status === 'failed' ? '#EF4444' : '#10B981') : '#F59E0B', children: <div><div className="text-sm text-white font-semibold">{detailDrawer.item.status === 'failed' ? '渠道返回失败' : detailDrawer.item.finishTime ? '银行处理完成' : '等待银行处理'}</div>{detailDrawer.item.finishTime && <div className="text-[11px] text-white/50 font-mono">{detailDrawer.item.finishTime}</div>}{detailDrawer.item.remark && <div className="mt-1 text-[11px] text-danger/80 bg-danger/10 inline-block px-2 py-0.5 rounded">{detailDrawer.item.remark}</div>}</div> },
                ]} />
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal title={<div className="flex items-center gap-2"><Database size={18} className="text-info" /><span className="text-lg font-bold">对账差异明细 - {reconcileModal?.batchId}</span></div>}
        open={!!reconcileModal} onCancel={() => setReconcileModal(null)} width={760}
        footer={<Space><Button onClick={() => setReconcileModal(null)}>关闭</Button><Button type="primary" className="!bg-gradient-primary !border-0">导出差异表</Button></Space>}
        className="[&_.ant-modal-content]:!bg-deep-blue-800 [&_.ant-modal-header]:!border-white/10 [&_.ant-modal-title]:!text-white [&_.ant-modal-close]:!text-white/50">
        {reconcileModal && (
          <div>
            <Row gutter={16} className="mb-4">
              {[
                { t: '平台笔数', v: reconcileModal.platformCount, a: reconcileModal.platformAmount, c: '#10B981' },
                { t: '银行笔数', v: reconcileModal.bankCount, a: reconcileModal.bankAmount, c: '#3B82F6' },
                { t: '差异笔数', v: reconcileModal.diffCount, a: reconcileModal.diffAmount, c: '#EF4444' },
              ].map((k, i) => (
                <Col span={8} key={i}>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="text-[11px] text-white/50 mb-1">{k.t}</div>
                    <div className="text-xl font-bold font-mono" style={{ color: k.c }}>{k.v}</div>
                    <div className="text-[11px] text-white/60 mt-0.5 font-mono">{formatMoney(k.a)}</div>
                  </div>
                </Col>
              ))}
            </Row>
            <div className="text-xs font-semibold text-warning mb-2 flex items-center gap-1.5"><AlertTriangle size={12} />差异明细（{reconcileModal.diffCount}笔）</div>
            <Table size="small" rowKey="key" pagination={false}
              dataSource={reconcileModal.diffCount > 0 ? [
                { key: '1', id: 'YD202406068821', platform: { amount: 8500, time: '10:12:33' }, bank: null, reason: '银行端超时回执' },
                { key: '2', id: 'YD202406068905', platform: { amount: 3200, time: '10:25:48' }, bank: { amount: 3180, time: '10:25:50' }, reason: '手续费分摊¥20,金额差异' },
              ] : []}
              locale={{ emptyText: <Empty description={<span className="text-white/50">无差异记录</span>} /> }}
              columns={[
                { title: '业务单号', dataIndex: 'id', render: (v) => <span className="font-mono text-info text-xs">{v}</span> },
                { title: '平台记录', render: (_: any, r: any) => r.platform ? <div className="text-xs"><div className="font-mono text-white/80">{formatMoney(r.platform.amount)}</div><div className="text-white/40 font-mono text-[10px]">{r.platform.time}</div></div> : <span className="text-xs text-white/30">-</span> },
                { title: '银行记录', render: (_: any, r: any) => r.bank ? <div className="text-xs"><div className="font-mono text-white/80">{formatMoney(r.bank.amount)}</div><div className="text-white/40 font-mono text-[10px]">{r.bank.time}</div></div> : <span className="text-xs text-danger/70">缺单</span> },
                { title: '差异原因', dataIndex: 'reason', render: (v) => <span className="text-xs text-white/70">{v}</span> },
                { title: '处理', render: () => (<Space size="small"><Button size="small" type="link" className="!h-auto !p-0 !text-xs !text-success">自动补单</Button><Button size="small" type="link" className="!h-auto !p-0 !text-xs !text-warning">人工标记</Button></Space>) },
              ]} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminFund;
