import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Timeline,
  Tag,
  Select,
  Badge,
  Statistic,
  Tooltip,
  Drawer,
  Modal,
  Button,
  Descriptions,
  Progress,
  Radio,
  Input,
  Form,
  message,
} from 'antd';
import {
  FileTextOutlined,
  PlusCircleOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  MessageOutlined,
  WechatOutlined,
  RightOutlined,
  SendOutlined,
  CheckCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const summaryCards = [
  { title: '在办案件', value: 23, icon: <FileTextOutlined />, color: '#1890ff', bg: '#e6f7ff' },
  { title: '本月新增', value: 8, icon: <PlusCircleOutlined />, color: '#52c41a', bg: '#f6ffed' },
  { title: '待审核', value: 5, icon: <AuditOutlined />, color: '#faad14', bg: '#fffbe6' },
  { title: '即将到期', value: 3, icon: <ClockCircleOutlined />, color: '#ff4d4f', bg: '#fff2f0' },
];

const caseTypeColorMap: Record<string, string> = {
  商标: '#1890ff',
  专利: '#52c41a',
  版权: '#fa8c16',
};

interface GanttCase {
  id: string;
  name: string;
  client: string;
  type: '商标' | '专利' | '版权';
  startMonth: number;
  endMonth: number;
  currentMonth: number;
  currentNode: string;
  deadline: string;
}

const ganttCases: GanttCase[] = [
  { id: 'TM-2024-001', name: '华为鸿蒙商标注册', client: '华为技术有限公司', type: '商标', startMonth: 0, endMonth: 5, currentMonth: 3, currentNode: '实质审查', deadline: '2026-09-30' },
  { id: 'PT-2024-012', name: '5G通信专利申请', client: '中兴通讯股份有限公司', type: '专利', startMonth: 1, endMonth: 8, currentMonth: 4, currentNode: '公开审查', deadline: '2026-12-15' },
  { id: 'CR-2024-007', name: '短视频版权登记', client: '字节跳动有限公司', type: '版权', startMonth: 0, endMonth: 3, currentMonth: 2, currentNode: '材料补充', deadline: '2026-07-20' },
  { id: 'TM-2024-023', name: '飞天茅台商标续展', client: '贵州茅台酒股份有限公司', type: '商标', startMonth: 2, endMonth: 7, currentMonth: 4, currentNode: '缴费确认', deadline: '2026-10-31' },
  { id: 'PT-2024-031', name: 'AI芯片专利布局', client: '寒武纪科技有限公司', type: '专利', startMonth: 1, endMonth: 10, currentMonth: 3, currentNode: 'PCT国际检索', deadline: '2027-03-01' },
  { id: 'CR-2024-015', name: '游戏软件著作权', client: '腾讯科技深圳有限公司', type: '版权', startMonth: 3, endMonth: 6, currentMonth: 4, currentNode: '形式审查', deadline: '2026-08-10' },
  { id: 'TM-2024-038', name: '小鹏汽车商标异议', client: '广州小鹏汽车科技有限公司', type: '商标', startMonth: 0, endMonth: 4, currentMonth: 3, currentNode: '异议答辩', deadline: '2026-08-25' },
  { id: 'PT-2024-045', name: '生物医药专利驳回复审', client: '恒瑞医药股份有限公司', type: '专利', startMonth: 2, endMonth: 9, currentMonth: 5, currentNode: '复审合议', deadline: '2027-01-15' },
  { id: 'CR-2024-022', name: '音乐作品版权存证', client: '网易云音乐科技有限公司', type: '版权', startMonth: 1, endMonth: 4, currentMonth: 3, currentNode: '区块链存证', deadline: '2026-07-30' },
  { id: 'TM-2024-051', name: '瑞幸咖啡商标监测', client: '瑞幸咖啡中国有限公司', type: '商标', startMonth: 4, endMonth: 11, currentMonth: 5, currentNode: '监测预警', deadline: '2027-02-28' },
];

const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const nodeTransitionRecords: Record<string, { time: string; from: string; to: string; operator: string }[]> = {
  'TM-2024-001': [
    { time: '2026-06-09', from: '申请提交', to: '形式审查', operator: '张代理' },
    { time: '2026-06-01', from: '客户确认材料', to: '申请提交', operator: '李助理' },
    { time: '2026-05-20', from: '材料准备', to: '客户确认材料', operator: '李助理' },
  ],
  'PT-2024-012': [
    { time: '2026-06-08', from: '公开审查', to: '实质审查', operator: '王代理' },
    { time: '2026-05-15', from: '网上申报', to: '公开审查', operator: '陈助理' },
    { time: '2026-04-20', from: '材料准备', to: '网上申报', operator: '陈助理' },
  ],
  'CR-2024-007': [
    { time: '2026-06-07', from: '形式审查', to: '材料补充', operator: '张代理' },
    { time: '2026-05-28', from: '申请提交', to: '形式审查', operator: '李助理' },
  ],
};

const getDefaultNodeTransitions = (caseId: string) => {
  return nodeTransitionRecords[caseId] || [
    { time: '2026-06-08', from: '客户确认材料', to: '申请提交', operator: '李助理' },
    { time: '2026-06-01', from: '材料准备', to: '客户确认材料', operator: '李助理' },
  ];
};

const commTypeIcon: Record<string, React.ReactNode> = {
  电话: <PhoneOutlined />,
  邮件: <MailOutlined />,
  面谈: <MessageOutlined />,
  微信: <WechatOutlined />,
};

const commTypeColor: Record<string, string> = {
  电话: '#1890ff',
  邮件: '#52c41a',
  面谈: '#722ed1',
  微信: '#07c160',
};

interface CommRecord {
  id: number;
  client: string;
  type: '电话' | '邮件' | '面谈' | '微信';
  date: string;
  summary: string;
  agent: string;
}

const commRecords: CommRecord[] = [
  { id: 1, client: '华为技术有限公司', type: '电话', date: '2026-06-08', summary: '确认鸿蒙商标注册类别，讨论第9类和第42类覆盖范围', agent: '张明' },
  { id: 2, client: '中兴通讯股份有限公司', type: '邮件', date: '2026-06-07', summary: '发送5G专利申请材料清单，补充技术交底书要求', agent: '李芳' },
  { id: 3, client: '字节跳动有限公司', type: '面谈', date: '2026-06-06', summary: '到访客户公司，讨论短视频版权保护策略及维权方案', agent: '王磊' },
  { id: 4, client: '贵州茅台酒股份有限公司', type: '微信', date: '2026-06-05', summary: '沟通飞天商标续展进度，确认续展材料已提交', agent: '张明' },
  { id: 5, client: '寒武纪科技有限公司', type: '电话', date: '2026-06-04', summary: '讨论AI芯片海外专利布局策略，确定PCT申请方案', agent: '陈静' },
  { id: 6, client: '腾讯科技深圳有限公司', type: '邮件', date: '2026-06-03', summary: '发送游戏软件著作权登记证书扫描件', agent: '李芳' },
  { id: 7, client: '广州小鹏汽车科技有限公司', type: '面谈', date: '2026-06-02', summary: '讨论小鹏商标异议答辩方案，整理证据材料', agent: '王磊' },
  { id: 8, client: '恒瑞医药股份有限公司', type: '微信', date: '2026-06-01', summary: '通知专利驳回复审受理通知已收到，安排技术分析', agent: '陈静' },
  { id: 9, client: '网易云音乐科技有限公司', type: '电话', date: '2026-05-30', summary: '确认音乐作品版权存证清单，讨论区块链存证方案', agent: '张明' },
  { id: 10, client: '瑞幸咖啡中国有限公司', type: '邮件', date: '2026-05-29', summary: '发送商标监测月度报告，包含3件近似商标预警', agent: '李芳' },
  { id: 11, client: '华为技术有限公司', type: '面谈', date: '2026-05-28', summary: '面谈鸿蒙生态商标保护战略，规划防御性注册', agent: '王磊' },
  { id: 12, client: '寒武纪科技有限公司', type: '电话', date: '2026-05-27', summary: '确认美国专利申请技术方案，讨论权利要求范围', agent: '陈静' },
];

interface FeeBill {
  id: number;
  client: string;
  caseId: string;
  caseName: string;
  feeType: string;
  amount: number;
  billDate: string;
  payStatus: '已支付' | '待支付' | '逾期';
  feeItems?: { name: string; amount: number }[];
}

const feeBills: FeeBill[] = [
  { id: 1, client: '华为技术有限公司', caseId: 'TM-2024-001', caseName: '华为鸿蒙商标注册', feeType: '商标注册费', amount: 3000, billDate: '2026-06-01', payStatus: '已支付', feeItems: [{ name: '商标申请费', amount: 1000 }, { name: '代理服务费', amount: 1500 }, { name: '公证费', amount: 500 }] },
  { id: 2, client: '中兴通讯股份有限公司', caseId: 'PT-2024-012', caseName: '5G通信专利申请', feeType: '专利申请费', amount: 8500, billDate: '2026-06-02', payStatus: '待支付', feeItems: [{ name: '专利申请费', amount: 4000 }, { name: '代理服务费', amount: 3500 }, { name: '检索费', amount: 1000 }] },
  { id: 3, client: '字节跳动有限公司', caseId: 'CR-2024-007', caseName: '短视频版权登记', feeType: '版权登记费', amount: 1500, billDate: '2026-06-03', payStatus: '已支付', feeItems: [{ name: '版权登记费', amount: 500 }, { name: '代理服务费', amount: 800 }, { name: '材料费', amount: 200 }] },
  { id: 4, client: '贵州茅台酒股份有限公司', caseId: 'TM-2024-023', caseName: '飞天茅台商标续展', feeType: '商标续展费', amount: 5000, billDate: '2026-06-04', payStatus: '逾期', feeItems: [{ name: '续展规费', amount: 2000 }, { name: '代理服务费', amount: 2500 }, { name: '宽展费', amount: 500 }] },
  { id: 5, client: '寒武纪科技有限公司', caseId: 'PT-2024-031', caseName: 'AI芯片专利布局', feeType: 'PCT国际申请费', amount: 25000, billDate: '2026-06-05', payStatus: '待支付', feeItems: [{ name: 'PCT申请费', amount: 15000 }, { name: '国际检索费', amount: 6000 }, { name: '代理服务费', amount: 4000 }] },
  { id: 6, client: '腾讯科技深圳有限公司', caseId: 'CR-2024-015', caseName: '游戏软件著作权', feeType: '软著代理费', amount: 2000, billDate: '2026-06-06', payStatus: '已支付', feeItems: [{ name: '软著登记费', amount: 600 }, { name: '代理服务费', amount: 1200 }, { name: '加急费', amount: 200 }] },
  { id: 7, client: '广州小鹏汽车科技有限公司', caseId: 'TM-2024-038', caseName: '小鹏汽车商标异议', feeType: '商标异议答辩费', amount: 12000, billDate: '2026-06-07', payStatus: '待支付', feeItems: [{ name: '异议答辩费', amount: 6000 }, { name: '代理服务费', amount: 5000 }, { name: '证据收集费', amount: 1000 }] },
  { id: 8, client: '恒瑞医药股份有限公司', caseId: 'PT-2024-045', caseName: '生物医药专利驳回复审', feeType: '专利复审费', amount: 6800, billDate: '2026-06-08', payStatus: '待支付', feeItems: [{ name: '复审请求费', amount: 3000 }, { name: '代理服务费', amount: 3000 }, { name: '技术分析费', amount: 800 }] },
  { id: 9, client: '网易云音乐科技有限公司', caseId: 'CR-2024-022', caseName: '音乐作品版权存证', feeType: '区块链存证费', amount: 3500, billDate: '2026-06-08', payStatus: '已支付', feeItems: [{ name: '区块链存证费', amount: 1500 }, { name: '代理服务费', amount: 1500 }, { name: '证书费', amount: 500 }] },
];

const closedLoopRecords = [
  {
    title: '商标"云端智联"续展申请',
    caseId: 'TM-2026-RENEW-001',
    flow: ['材料预审', '客户确认', '费用账单', '提交续展', '回执归档'],
    result: '续展申请书已生成，客户确认记录已绑定',
    review: '复查：截止 2026-07-15，当前剩余 36 天',
    status: '待提交',
  },
  {
    title: '专利 ZL2025200XXXXX 答辩',
    caseId: 'PT-2026-DEF-018',
    flow: ['驳回通知', '技术对比', '代理人复核', '答辩提交', '结果跟踪'],
    result: '技术对比表 3 版，答辩书进入复核',
    review: '复查：缺少权利要求 2 的实验数据附件',
    status: '复核中',
  },
  {
    title: '版权证据包维权',
    caseId: 'CR-2026-EVI-009',
    flow: ['线索抓取', '截图固化', '哈希存证', '证据包生成', '律师函'],
    result: '证据包已生成 5 条，区块链哈希已写入',
    review: '复查：淘宝 96.8% 链接优先发函',
    status: '已生成',
  },
];

const payStatusColor: Record<string, string> = {
  已支付: 'success',
  待支付: 'warning',
  逾期: 'error',
};

interface PaymentRecord {
  id: number;
  date: string;
  client: string;
  amount: number;
  method: string;
  confirmer: string;
}

const paymentRecords: PaymentRecord[] = [
  { id: 1, date: '2026-06-08', client: '腾讯科技深圳有限公司', amount: 2000, method: '银行转账', confirmer: '李芳' },
  { id: 2, date: '2026-06-07', client: '网易云音乐科技有限公司', amount: 3500, method: '在线支付', confirmer: '张明' },
  { id: 3, date: '2026-06-05', client: '字节跳动有限公司', amount: 1500, method: '银行转账', confirmer: '王磊' },
  { id: 4, date: '2026-06-03', client: '华为技术有限公司', amount: 3000, method: '对公转账', confirmer: '陈静' },
];

const billPaymentTimeline: Record<string, { status: string; time: string }[]> = {
  '1': [
    { status: '账单生成', time: '2026-06-01 09:30' },
    { status: '客户确认', time: '2026-06-01 14:20' },
    { status: '支付完成', time: '2026-06-03 10:15' },
    { status: '发票开具', time: '2026-06-04 16:00' },
  ],
  '3': [
    { status: '账单生成', time: '2026-06-03 10:00' },
    { status: '客户确认', time: '2026-06-03 15:30' },
    { status: '支付完成', time: '2026-06-05 09:00' },
    { status: '发票开具', time: '2026-06-05 14:20' },
  ],
};

const getDefaultBillTimeline = (bill: FeeBill) => {
  const existing = billPaymentTimeline[String(bill.id)];
  if (existing) return existing;
  const timeline: { status: string; time: string }[] = [
    { status: '账单生成', time: `${bill.billDate} 09:00` },
  ];
  if (bill.payStatus === '已支付') {
    timeline.push({ status: '客户确认', time: `${bill.billDate} 15:00` });
    timeline.push({ status: '支付完成', time: '2026-06-08 10:00' });
    timeline.push({ status: '发票开具', time: '2026-06-08 16:00' });
  } else if (bill.payStatus === '逾期') {
    timeline.push({ status: '客户确认', time: `${bill.billDate} 15:00` });
  }
  return timeline;
};

const AgentWorkbench: React.FC = () => {
  const [clientFilter, setClientFilter] = useState<string | undefined>(undefined);
  const uniqueClients = Array.from(new Set(commRecords.map((r) => r.client)));

  const [caseDrawerVisible, setCaseDrawerVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<GanttCase | null>(null);

  const [commModalVisible, setCommModalVisible] = useState(false);
  const [commForm] = Form.useForm();

  const [billModalVisible, setBillModalVisible] = useState(false);
  const [billForm] = Form.useForm();

  const [billDrawerVisible, setBillDrawerVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<FeeBill | null>(null);

  const filteredComm = clientFilter
    ? commRecords.filter((r) => r.client === clientFilter)
    : commRecords;

  const totalAmount = feeBills.reduce((s, b) => s + b.amount, 0);
  const paidAmount = feeBills.filter((b) => b.payStatus === '已支付').reduce((s, b) => s + b.amount, 0);
  const pendingAmount = feeBills.filter((b) => b.payStatus === '待支付').reduce((s, b) => s + b.amount, 0);

  const openCaseDrawer = (c: GanttCase) => {
    setSelectedCase(c);
    setCaseDrawerVisible(true);
  };

  const openBillDrawer = (bill: FeeBill) => {
    setSelectedBill(bill);
    setBillDrawerVisible(true);
  };

  const feeColumns = [
    { title: '客户名称', dataIndex: 'client', key: 'client', width: 200 },
    { title: '案件编号', dataIndex: 'caseId', key: 'caseId', width: 140 },
    { title: '费用类型', dataIndex: 'feeType', key: 'feeType', width: 150 },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    { title: '账单日期', dataIndex: 'billDate', key: 'billDate', width: 120 },
    {
      title: '支付状态',
      dataIndex: 'payStatus',
      key: 'payStatus',
      width: 100,
      render: (v: string) => <Badge status={payStatusColor[v] as 'success' | 'warning' | 'error'} text={v} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: FeeBill) => (
        <Button type="link" size="small" onClick={() => openBillDrawer(record)}>
          详情
        </Button>
      ),
    },
  ];

  const paymentColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
    { title: '客户', dataIndex: 'client', key: 'client', width: 200 },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    { title: '支付方式', dataIndex: 'method', key: 'method', width: 100 },
    { title: '确认人', dataIndex: 'confirmer', key: 'confirmer', width: 80 },
  ];

  return (
    <div style={{ padding: 4 }}>
      <Row gutter={[16, 16]}>
        {summaryCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <Card
              variant="borderless"
              style={{ borderRadius: 12 }}
              styles={{ body: { padding: '20px 24px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 14, marginBottom: 8 }}>{card.title}</div>
                  <Statistic value={card.value} valueStyle={{ color: card.color, fontWeight: 700, fontSize: 32 }} />
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: card.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            <AuditOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            本周工作概览
          </span>
        }
        variant="borderless"
        style={{ marginTop: 16, borderRadius: 12 }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#595959' }}>本周完成</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>8件</span>
            </div>
            <Progress percent={67} strokeColor="#52c41a" showInfo={false} />
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>目标 12 件，已完成 8 件</div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#595959' }}>进行中</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>12件</span>
            </div>
            <Progress percent={52} strokeColor="#1890ff" showInfo={false} />
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>总计 23 件在办，12 件处理中</div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#595959' }}>逾期预警</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>2件</span>
            </div>
            <Progress percent={15} strokeColor="#ff4d4f" showInfo={false} />
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>飞天茅台续展、AI芯片PCT接近截止</div>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            <AuditOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            案件处理结果与复查记录
          </span>
        }
        variant="borderless"
        style={{ marginTop: 16, borderRadius: 12 }}
      >
        <Row gutter={[12, 12]}>
          {closedLoopRecords.map((record) => (
            <Col xs={24} lg={8} key={record.caseId}>
              <Card size="small" style={{ height: '100%', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{record.title}</strong>
                  <Tag color={record.status === '已生成' ? 'success' : record.status === '复核中' ? 'processing' : 'warning'}>{record.status}</Tag>
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>{record.caseId}</div>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {record.flow.map((step) => <Tag key={step}>{step}</Tag>)}
                </div>
                <div style={{ marginTop: 10, fontSize: 13, color: '#262626', lineHeight: 1.6 }}>{record.result}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#595959', lineHeight: 1.6 }}>{record.review}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            案件甘特图
          </span>
        }
        variant="borderless"
        style={{ marginTop: 16, borderRadius: 12 }}
        styles={{ body: { padding: '16px 24px 24px' } }}
      >
        <div style={{ marginBottom: 8, display: 'flex', gap: 16 }}>
          {Object.entries(caseTypeColorMap).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: color }} />
              <span style={{ color: '#595959' }}>{type}</span>
            </div>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 900 }}>
            <div style={{ display: 'flex', paddingLeft: 280, borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 4 }}>
              {monthLabels.map((m) => (
                <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#8c8c8c', fontWeight: 500 }}>
                  {m}
                </div>
              ))}
            </div>
            {ganttCases.map((c) => {
              const barLeft = (c.startMonth / 12) * 100;
              const barWidth = ((c.endMonth - c.startMonth) / 12) * 100;
              const progressLeft = (c.currentMonth / 12) * 100;
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 44,
                    borderBottom: '1px solid #fafafa',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => openCaseDrawer(c)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f0f5ff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div style={{ width: 260, flexShrink: 0, paddingRight: 12, display: 'flex', flexDirection: 'column' }}>
                    <Tooltip title={`案件编号: ${c.id}`}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#262626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </span>
                    </Tooltip>
                    <span style={{ fontSize: 11, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.client}
                    </span>
                  </div>
                  <div style={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RightOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: 24 }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: `${barLeft}%`,
                        width: `${barWidth}%`,
                        height: '100%',
                        borderRadius: 6,
                        background: caseTypeColorMap[c.type],
                        opacity: 0.18,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: `${barLeft}%`,
                        width: `${Math.min(((c.currentMonth - c.startMonth) / (c.endMonth - c.startMonth)) * barWidth, barWidth)}%`,
                        height: '100%',
                        borderRadius: 6,
                        background: caseTypeColorMap[c.type],
                        opacity: 0.65,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: `${progressLeft}%`,
                        top: -2,
                        width: 3,
                        height: 28,
                        background: '#ff4d4f',
                        borderRadius: 2,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: `${barLeft}%`,
                        top: 4,
                        fontSize: 11,
                        color: caseTypeColorMap[c.type],
                        fontWeight: 600,
                      }}
                    >
                      <Tag color={caseTypeColorMap[c.type]} style={{ marginLeft: 4, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                        {c.type}
                      </Tag>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                <PhoneOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                客户沟通记录
              </span>
            }
            extra={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => setCommModalVisible(true)}
                >
                  新增沟通记录
                </Button>
                <Select
                  allowClear
                  placeholder="筛选客户"
                  style={{ width: 200 }}
                  value={clientFilter}
                  onChange={setClientFilter}
                  options={uniqueClients.map((c) => ({ label: c, value: c }))}
                />
              </div>
            }
            variant="borderless"
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { paddingTop: 12, maxHeight: 520, overflowY: 'auto' } }}
          >
            <Timeline
              items={filteredComm.map((r) => ({
                color: commTypeColor[r.type],
                children: (
                  <div style={{ paddingBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Tag icon={commTypeIcon[r.type]} color={commTypeColor[r.type]} style={{ margin: 0 }}>
                        {r.type}
                      </Tag>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>{r.client}</span>
                      <span style={{ fontSize: 12, color: '#bfbfbf', marginLeft: 'auto' }}>{r.date}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.6, paddingLeft: 2 }}>{r.summary}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4, paddingLeft: 2 }}>
                      代理人：{r.agent}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                <FileTextOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                费用账单
              </span>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setBillModalVisible(true)}>
                生成账单
              </Button>
            }
            variant="borderless"
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '0 0 16px' } }}
          >
            <Table
              dataSource={feeBills}
              columns={feeColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
              onRow={(record) => ({
                onClick: () => openBillDrawer(record),
                style: { cursor: 'pointer' },
              })}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                padding: '16px 24px 0',
                borderTop: '1px solid #f0f0f0',
                marginTop: 8,
              }}
            >
              <Statistic title="总金额" value={totalAmount} prefix="¥" valueStyle={{ fontSize: 18, fontWeight: 700, color: '#262626' }} />
              <Statistic title="已支付" value={paidAmount} prefix="¥" valueStyle={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }} />
              <Statistic title="待支付" value={pendingAmount} prefix="¥" valueStyle={{ fontSize: 18, fontWeight: 700, color: '#faad14' }} />
            </div>
            <div style={{ padding: '12px 24px 0' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', marginBottom: 8 }}>收款记录</div>
              <Table
                dataSource={paymentRecords}
                columns={paymentColumns}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Drawer
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            案件详情 — {selectedCase?.name}
          </span>
        }
        placement="right"
        width={520}
        open={caseDrawerVisible}
        onClose={() => setCaseDrawerVisible(false)}
      >
        {selectedCase && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="案件名称">{selectedCase.name}</Descriptions.Item>
              <Descriptions.Item label="客户">{selectedCase.client}</Descriptions.Item>
              <Descriptions.Item label="案件类型">
                <Tag color={caseTypeColorMap[selectedCase.type]}>{selectedCase.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前节点">
                <Tag color="blue">{selectedCase.currentNode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="截止日期">
                <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{selectedCase.deadline}</span>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#262626', marginBottom: 12 }}>案件操作</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button type="primary" icon={<RightOutlined />} onClick={() => message.success('已推进到下一节点')}>
                  推进到下一节点
                </Button>
                <Button icon={<MessageOutlined />} onClick={() => { setCaseDrawerVisible(false); setCommModalVisible(true); }}>
                  添加沟通记录
                </Button>
                <Button icon={<FileTextOutlined />} onClick={() => { setCaseDrawerVisible(false); setBillModalVisible(true); }}>
                  生成费用账单
                </Button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#262626', marginBottom: 12 }}>节点变更记录</div>
              <Timeline
                items={getDefaultNodeTransitions(selectedCase.id).map((t) => ({
                  color: '#1890ff',
                  children: (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>
                        {t.from} → {t.to}
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                        {t.time} (操作人: {t.operator})
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          </>
        )}
      </Drawer>

      <Modal
        title="新增沟通记录"
        open={commModalVisible}
        onCancel={() => { setCommModalVisible(false); commForm.resetFields(); }}
        onOk={() => {
          commForm.validateFields().then(() => {
            message.success('沟通记录已保存');
            setCommModalVisible(false);
            commForm.resetFields();
          });
        }}
        okText="保存"
      >
        <Form form={commForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="client" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select
              placeholder="请选择客户"
              options={uniqueClients.map((c) => ({ label: c, value: c }))}
            />
          </Form.Item>
          <Form.Item name="type" label="沟通方式" rules={[{ required: true, message: '请选择沟通方式' }]}>
            <Radio.Group>
              <Radio value="电话">电话</Radio>
              <Radio value="邮件">邮件</Radio>
              <Radio value="面谈">面谈</Radio>
              <Radio value="微信">微信</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="content" label="沟通内容" rules={[{ required: true, message: '请输入沟通内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入沟通内容" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="生成账单"
        open={billModalVisible}
        onCancel={() => { setBillModalVisible(false); billForm.resetFields(); }}
        onOk={() => {
          billForm.validateFields().then(() => {
            message.success('账单已生成');
            setBillModalVisible(false);
            billForm.resetFields();
          });
        }}
        okText="生成"
        width={560}
      >
        <Form form={billForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="client" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select
              placeholder="请选择客户"
              options={uniqueClients.map((c) => ({ label: c, value: c }))}
            />
          </Form.Item>
          <Form.Item name="cases" label="关联案件" rules={[{ required: true, message: '请选择案件' }]}>
            <Select
              mode="multiple"
              placeholder="请选择案件"
              options={ganttCases.map((c) => ({ label: `${c.id} - ${c.name}`, value: c.id }))}
            />
          </Form.Item>
          <Form.List name="feeItems" initialValue={[{ name: '', amount: 0 }]}>
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>费用项目</span>
                  <Button type="dashed" size="small" onClick={() => add()} icon={<PlusOutlined />}>
                    添加项目
                  </Button>
                </div>
                {fields.map((field) => (
                  <Row key={field.key} gutter={8} style={{ marginBottom: 8 }}>
                    <Col flex="1">
                      <Form.Item name={[field.name, 'name']} noStyle rules={[{ required: true, message: '请输入名称' }]}>
                        <Input placeholder="费用名称" />
                      </Form.Item>
                    </Col>
                    <Col flex="120px">
                      <Form.Item name={[field.name, 'amount']} noStyle rules={[{ required: true, message: '请输入金额' }]}>
                        <Input type="number" placeholder="金额" />
                      </Form.Item>
                    </Col>
                    <Col flex="32px">
                      {fields.length > 1 && (
                        <Button type="text" danger size="small" onClick={() => remove(field.name)}>
                          ×
                        </Button>
                      )}
                    </Col>
                  </Row>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Drawer
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            账单详情 — {selectedBill?.feeType}
          </span>
        }
        placement="right"
        width={520}
        open={billDrawerVisible}
        onClose={() => setBillDrawerVisible(false)}
      >
        {selectedBill && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="客户">{selectedBill.client}</Descriptions.Item>
              <Descriptions.Item label="案件">{selectedBill.caseName}</Descriptions.Item>
              <Descriptions.Item label="费用类型">{selectedBill.feeType}</Descriptions.Item>
              <Descriptions.Item label="账单日期">{selectedBill.billDate}</Descriptions.Item>
              <Descriptions.Item label="支付状态">
                <Badge status={payStatusColor[selectedBill.payStatus] as 'success' | 'warning' | 'error'} text={selectedBill.payStatus} />
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#262626', marginBottom: 12 }}>费用明细</div>
              <Table
                dataSource={selectedBill.feeItems || []}
                columns={[
                  { title: '项目', dataIndex: 'name', key: 'name' },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    key: 'amount',
                    render: (v: number) => `¥${v.toLocaleString()}`,
                  },
                ]}
                rowKey="name"
                size="small"
                pagination={false}
                summary={(data) => {
                  const total = data.reduce((s, r) => s + r.amount, 0);
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}><strong>合计</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={1}><strong style={{ color: '#f5222d' }}>¥{total.toLocaleString()}</strong></Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#262626', marginBottom: 12 }}>支付状态</div>
              <Timeline
                items={getDefaultBillTimeline(selectedBill).map((item, idx, arr) => ({
                  color: idx === arr.length - 1 ? '#1890ff' : '#52c41a',
                  children: (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>{item.status}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>{item.time}</div>
                    </div>
                  ),
                }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="primary" icon={<SendOutlined />} onClick={() => message.success('账单已发送')}>
                发送账单
              </Button>
              <Button icon={<CheckCircleOutlined />} onClick={() => message.success('已标记为已付')}>
                标记已付
              </Button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default AgentWorkbench;
