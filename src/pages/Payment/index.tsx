import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Radio,
  Select,
  Button,
  Tabs,
  Table,
  Tag,
  Modal,
  message,
  Space,
  Statistic,
  Divider,
  Steps,
  Alert,
  Descriptions,
  Badge,
  Empty,
  Tooltip,
  List,
} from 'antd';
import {
  PayCircleOutlined,
  WechatOutlined,
  AlipayOutlined,
  BankOutlined,
  RedEnvelopeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  MedicineBoxOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { payment, insurance, family } from '@/api';
import type { PaymentOrder, InsuranceInfo, PaymentChannel, InsuranceType, FamilyMutualAid } from '@/types';

const { Step } = Steps;

interface PayGradeOption {
  grade: number;
  amount: number;
  governmentSubsidy: number;
  description: string;
}

interface InsuranceOption {
  type: InsuranceType;
  name: string;
  icon: string;
  color: string;
}

interface ChannelOption {
  key: PaymentChannel;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const payGradeOptions: Record<string, PayGradeOption[]> = {
  pension: [
    { grade: 1, amount: 200, governmentSubsidy: 40, description: '最低档，适合低收入人群' },
    { grade: 2, amount: 300, governmentSubsidy: 50, description: '基础档' },
    { grade: 3, amount: 500, governmentSubsidy: 60, description: '标准档' },
    { grade: 4, amount: 1000, governmentSubsidy: 80, description: '中高档' },
    { grade: 5, amount: 2000, governmentSubsidy: 100, description: '高档，享受最高补贴' },
  ],
  medical: [
    { grade: 1, amount: 380, governmentSubsidy: 640, description: '居民医保基本档' },
    { grade: 2, amount: 580, governmentSubsidy: 840, description: '居民医保高档' },
  ],
  flexible_pension: [
    { grade: 1, amount: 600, governmentSubsidy: 0, description: '灵活就业最低档' },
    { grade: 2, amount: 1000, governmentSubsidy: 0, description: '灵活就业标准档' },
    { grade: 3, amount: 2000, governmentSubsidy: 0, description: '灵活就业高档' },
  ],
  flexible_medical: [
    { grade: 1, amount: 420, governmentSubsidy: 0, description: '灵活就业医保基本档' },
  ],
};

const insuranceOptions: InsuranceOption[] = [
  { type: 'pension', name: '城乡居民养老保险', icon: '👴', color: '#165DFF' },
  { type: 'medical', name: '城乡居民医疗保险', icon: '🏥', color: '#52c41a' },
  { type: 'flexible_pension', name: '灵活就业养老保险', icon: '💼', color: '#722ed1' },
  { type: 'flexible_medical', name: '灵活就业医疗保险', icon: '🩺', color: '#eb2f96' },
];

const channelOptions: ChannelOption[] = [
  {
    key: 'wechat',
    name: '微信支付',
    icon: <WechatOutlined className="text-3xl" />,
    color: '#07c160',
    bgColor: 'bg-green-50',
  },
  {
    key: 'alipay',
    name: '支付宝',
    icon: <AlipayOutlined className="text-3xl" />,
    color: '#1677ff',
    bgColor: 'bg-blue-50',
  },
  {
    key: 'dc_epay',
    name: '数字人民币',
    icon: <RedEnvelopeOutlined className="text-3xl" />,
    color: '#e11d48',
    bgColor: 'bg-red-50',
  },
  {
    key: 'bank',
    name: '银行卡支付',
    icon: <BankOutlined className="text-3xl" />,
    color: '#6b7280',
    bgColor: 'bg-gray-50',
  },
];

const threeEndStatusConfig = {
  taxInvoiceStatus: {
    name: '税务开票',
    pending: { color: 'default', text: '待开票', icon: <ClockCircleOutlined /> },
    issued: { color: 'success', text: '已开票', icon: <CheckCircleOutlined /> },
    failed: { color: 'error', text: '开票失败', icon: <CloseCircleOutlined /> },
  },
  financeStatus: {
    name: '财政入库',
    pending: { color: 'default', text: '待入库', icon: <ClockCircleOutlined /> },
    warehoused: { color: 'success', text: '已入库', icon: <CheckCircleOutlined /> },
    failed: { color: 'error', text: '入库失败', icon: <CloseCircleOutlined /> },
  },
  medicalCreditStatus: {
    name: '医保入账',
    pending: { color: 'default', text: '待入账', icon: <ClockCircleOutlined /> },
    credited: { color: 'success', text: '已入账', icon: <CheckCircleOutlined /> },
    failed: { color: 'error', text: '入账失败', icon: <CloseCircleOutlined /> },
  },
};

const statusFlowConfig = {
  pending: { color: 'warning', text: '待支付', icon: <ClockCircleOutlined /> },
  paid: { color: 'success', text: '已支付', icon: <CheckCircleOutlined /> },
  cancelled: { color: 'error', text: '已取消', icon: <CloseCircleOutlined /> },
  refunded: { color: 'default', text: '已退款', icon: <CloseCircleOutlined /> },
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear + i);

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const locationState = location.state as { insuranceType?: string; isSupplement?: boolean };

  const [activeTab, setActiveTab] = useState<string>('create');
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceType>(
    (locationState?.insuranceType as InsuranceType) || 'pension'
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel | null>(null);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [insuranceList, setInsuranceList] = useState<InsuranceInfo[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMutualAid[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [useFamilyAccount, setUseFamilyAccount] = useState<boolean>(false);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, insuranceRes, familyRes] = await Promise.all([
        payment.getOrders(),
        insurance.getList(),
        family.getMembers(),
      ]);
      if (ordersRes.success) {
        setOrders(ordersRes.data?.items || ordersRes.data || []);
      }
      if (insuranceRes.success) {
        setInsuranceList(insuranceRes.data?.items || insuranceRes.data || []);
      }
      if (familyRes.success) {
        setFamilyMembers(familyRes.data?.items || familyRes.data || []);
      }
    } catch (error) {
      console.error('Load payment data failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPayGrades = payGradeOptions[selectedInsurance] || [];
  const selectedPayGrade = currentPayGrades.find((g) => g.grade === selectedGrade);
  const totalAmount = selectedPayGrade?.amount || 0;
  const subsidy = selectedPayGrade?.governmentSubsidy || 0;

  const availableFamilyMembers = familyMembers.filter(
    (m) => m.status === 'active' && (m.authAmount - m.usedAmount) > 0
  );

  const getThreeEndSteps = (order: PaymentOrder) => {
    const steps = [
      {
        title: '订单创建',
        status: 'finish' as const,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        description: order.createdAt,
      },
      {
        title: '税务开票',
        status: order.taxInvoiceStatus === 'issued' ? 'finish' : order.taxInvoiceStatus === 'failed' ? 'error' : (order.status === 'paid' ? 'process' : 'wait') as const,
        icon: threeEndStatusConfig.taxInvoiceStatus[order.taxInvoiceStatus as keyof typeof threeEndStatusConfig.taxInvoiceStatus]?.icon,
        description: order.taxInvoiceStatus === 'issued' ? '已完成' : order.taxInvoiceStatus === 'failed' ? '失败' : '处理中',
      },
      {
        title: '财政入库',
        status: order.financeStatus === 'warehoused' ? 'finish' : order.financeStatus === 'failed' ? 'error' : 'wait' as const,
        icon: threeEndStatusConfig.financeStatus[order.financeStatus as keyof typeof threeEndStatusConfig.financeStatus]?.icon,
        description: order.financeStatus === 'warehoused' ? '已完成' : order.financeStatus === 'failed' ? '失败' : '等待中',
      },
      {
        title: '医保入账',
        status: order.medicalCreditStatus === 'credited' ? 'finish' : order.medicalCreditStatus === 'failed' ? 'error' : 'wait' as const,
        icon: threeEndStatusConfig.medicalCreditStatus[order.medicalCreditStatus as keyof typeof threeEndStatusConfig.medicalCreditStatus]?.icon,
        description: order.medicalCreditStatus === 'credited' ? '已完成' : order.medicalCreditStatus === 'failed' ? '失败' : '等待中',
      },
    ];
    return steps;
  };

  const handleCreateOrder = async () => {
    setActionLoading(true);
    try {
      const response = await payment.createOrder({
        insuranceType: selectedInsurance,
        payYear: selectedYear,
        payGrade: selectedGrade,
      });
      if (response.success) {
        message.success('订单创建成功');
        const orderData = response.data?.order || response.data;
        setSelectedOrder(orderData);
        setCreateModalVisible(false);
        setPayModalVisible(true);
        loadData();
      }
    } catch (error) {
      console.error('Create order failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async (channel: PaymentChannel) => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const response = await payment.payOrder(selectedOrder.id, { channel });
      if (response.success) {
        message.success('支付成功');
        setPayModalVisible(false);
        setSelectedChannel(null);
        loadData();
      }
    } catch (error) {
      console.error('Pay failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayOrder = (order: PaymentOrder) => {
    setSelectedOrder(order);
    setPayModalVisible(true);
  };

  const showOrderDetail = (order: PaymentOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    return statusFlowConfig[status as keyof typeof statusFlowConfig]?.color || 'default';
  };

  const getStatusText = (status: string) => {
    return statusFlowConfig[status as keyof typeof statusFlowConfig]?.text || status;
  };

  const getStatusIcon = (status: string) => {
    return statusFlowConfig[status as keyof typeof statusFlowConfig]?.icon;
  };

  const getInsuranceName = (type: string) => {
    return insuranceOptions.find((o) => o.type === type)?.name || type;
  };

  const getChannelName = (channel: string) => {
    return channelOptions.find((c) => c.key === channel)?.name || channel;
  };

  const getInsuranceColor = (type: string) => {
    return insuranceOptions.find((o) => o.type === type)?.color || '#165DFF';
  };

  const getOrdersByInsurance = (type: string) => {
    return orders.filter((o) => o.insuranceType === type);
  };

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      ellipsis: true,
      render: (val: string) => <code className="text-primary">{val}</code>,
    },
    {
      title: '险种',
      dataIndex: 'insuranceType',
      key: 'insuranceType',
      render: (type: string) => {
        const option = insuranceOptions.find((o) => o.type === type);
        return (
          <Tag color={option?.color}>
            {option?.icon} {option?.name}
          </Tag>
        );
      },
    },
    {
      title: '缴费年度',
      dataIndex: 'payYear',
      key: 'payYear',
      width: 100,
    },
    {
      title: '缴费档次',
      dataIndex: 'payGrade',
      key: 'payGrade',
      width: 100,
      render: (grade: number) => `${grade}档`,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span className="font-bold text-lg">¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '支付渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (channel: string) => (channel ? getChannelName(channel) : '-'),
    },
    {
      title: '三端状态',
      key: 'threeEnd',
      width: 200,
      render: (_: unknown, record: PaymentOrder) => (
        <div className="flex items-center gap-1">
          <Tooltip title={`税务开票: ${threeEndStatusConfig.taxInvoiceStatus[record.taxInvoiceStatus as keyof typeof threeEndStatusConfig.taxInvoiceStatus].text}`}>
            <span style={{ color: record.taxInvoiceStatus === 'issued' ? '#52c41a' : '#d9d9d9' }}>
              <SafetyCertificateOutlined />
            </span>
          </Tooltip>
          <ArrowRightOutlined className="text-gray-300 text-xs" />
          <Tooltip title={`财政入库: ${threeEndStatusConfig.financeStatus[record.financeStatus as keyof typeof threeEndStatusConfig.financeStatus].text}`}>
            <span style={{ color: record.financeStatus === 'warehoused' ? '#52c41a' : '#d9d9d9' }}>
              <ApartmentOutlined />
            </span>
          </Tooltip>
          <ArrowRightOutlined className="text-gray-300 text-xs" />
          <Tooltip title={`医保入账: ${threeEndStatusConfig.medicalCreditStatus[record.medicalCreditStatus as keyof typeof threeEndStatusConfig.medicalCreditStatus].text}`}>
            <span style={{ color: record.medicalCreditStatus === 'credited' ? '#52c41a' : '#d9d9d9' }}>
              <MedicineBoxOutlined />
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: PaymentOrder) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showOrderDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="primary" size="small" onClick={() => handlePayOrder(record)}>
              去支付
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const orderStats = () => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const paid = orders.filter((o) => o.status === 'paid').length;
    const totalAmount = orders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + o.amount, 0);

    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#faad14' }}>
            <Statistic
              title="待支付订单"
              value={pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#52c41a' }}>
            <Statistic
              title="已支付订单"
              value={paid}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#165DFF' }}>
            <Statistic
              title="累计缴费金额"
              value={totalAmount}
              prefix="¥"
              valueStyle={{ color: '#165DFF' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const createOrderForm = () => (
    <div className="space-y-6">
      <Card
        title={
          <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '18px' }}>
            选择缴费信息
          </span>
        }
        className="shadow-sm"
      >
        <Alert
          message="缴费说明"
          description="请选择正确的险种和缴费档次，缴费成功后将自动同步至税务、财政和医保部门。"
          type="info"
          showIcon
          className="mb-6"
        />

        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-3 font-medium">选择险种</div>
          <Radio.Group
            value={selectedInsurance}
            onChange={(e) => {
              setSelectedInsurance(e.target.value);
              setSelectedGrade(1);
            }}
            style={{ width: '100%' }}
          >
            <Row gutter={[16, 16]}>
              {insuranceOptions.map((option) => {
                const userInsurance = insuranceList.find(
                  (i) => i.insuranceType === option.type
                );
                const isInsured = userInsurance && userInsurance.status === 'insured';
                const typeOrders = getOrdersByInsurance(option.type);
                const pendingCount = typeOrders.filter((o) => o.status === 'pending').length;

                return (
                  <Col xs={24} sm={12} lg={6} key={option.type}>
                    <Radio.Button
                      value={option.type}
                      style={{
                        width: '100%',
                        height: '100%',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '12px',
                        border: selectedInsurance === option.type ? `2px solid ${option.color}` : '1px solid #d9d9d9',
                        background: selectedInsurance === option.type ? `${option.color}10` : '#fff',
                      }}
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-3xl">{option.icon}</span>
                          {pendingCount > 0 && (
                            <Badge count={pendingCount} size="small" />
                          )}
                        </div>
                        <div className="font-medium text-left">{option.name}</div>
                        <div className="flex justify-between items-center mt-2">
                          {isInsured ? (
                            <Tag color="success" style={{ fontSize: '12px', padding: '0 8px' }}>
                              已参保
                            </Tag>
                          ) : (
                            <Tag color="warning" style={{ fontSize: '12px', padding: '0 8px' }}>
                              未参保
                            </Tag>
                          )}
                          {typeOrders.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {typeOrders.length}笔订单
                            </span>
                          )}
                        </div>
                      </div>
                    </Radio.Button>
                  </Col>
                );
              })}
            </Row>
          </Radio.Group>
        </div>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-3 font-medium">缴费年度</div>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: '100%' }}
                size="large"
              >
                {yearOptions.map((year) => (
                  <Select.Option key={year} value={year}>
                    {year}年度
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-3 font-medium">缴费档次</div>
              <Radio.Group
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                style={{ width: '100%' }}
              >
                <Row gutter={[8, 8]}>
                  {currentPayGrades.map((grade) => (
                    <Col xs={24} sm={12} key={grade.grade}>
                      <Radio.Button
                        value={grade.grade}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: selectedGrade === grade.grade ? '2px solid #165DFF' : '1px solid #d9d9d9',
                          background: selectedGrade === grade.grade ? '#e6f4ff' : '#fff',
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold">第{grade.grade}档</div>
                            <div className="text-xs text-gray-500">{grade.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              ¥{grade.amount}
                            </div>
                            {grade.governmentSubsidy > 0 && (
                              <div className="text-xs text-green-600">
                                政府补贴 ¥{grade.governmentSubsidy}
                              </div>
                            )}
                          </div>
                        </div>
                      </Radio.Button>
                    </Col>
                  ))}
                </Row>
              </Radio.Group>
            </div>

            {availableFamilyMembers.length > 0 && (
              <div className="mt-4">
                <Alert
                  message="家庭共济账户可用"
                  description={`您有 ${availableFamilyMembers.length} 位亲属的共济账户可使用，是否使用家庭共济额度支付？`}
                  type="info"
                  showIcon
                  closable
                  onClose={() => setUseFamilyAccount(false)}
                  action={
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setUseFamilyAccount(!useFamilyAccount)}
                    >
                      {useFamilyAccount ? '取消使用' : '使用共济'}
                    </Button>
                  }
                />
                {useFamilyAccount && (
                  <Card size="small" className="mt-3">
                    <div className="text-sm font-medium mb-2">选择共济使用人</div>
                    <Radio.Group
                      value={selectedFamilyMember}
                      onChange={(e) => setSelectedFamilyMember(e.target.value)}
                    >
                      <Space direction="vertical">
                        {availableFamilyMembers.map((member) => (
                          <Radio.Button key={member.id} value={member.id}>
                            {member.relativeName} ({member.relationship === 'parent' ? '父母' : member.relationship === 'child' ? '子女' : '配偶'})
                            <span className="ml-2 text-green-600">
                              可用额度: ¥{(member.authAmount - member.usedAmount).toLocaleString()}
                            </span>
                          </Radio.Button>
                        ))}
                      </Space>
                    </Radio.Group>
                  </Card>
                )}
              </div>
            )}
          </Col>

          <Col xs={24} md={12}>
            <Card
              className="bg-gradient-to-br from-blue-50 to-white h-full"
              bordered={false}
            >
              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 mb-2">应缴金额</div>
                <div className="text-5xl font-bold text-blue-600">
                  ¥{totalAmount.toLocaleString()}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">险种</span>
                  <span className="font-medium">{getInsuranceName(selectedInsurance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">缴费年度</span>
                  <span className="font-medium">{selectedYear}年度</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">缴费档次</span>
                  <span className="font-medium">第{selectedGrade}档</span>
                </div>
                {subsidy > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>政府补贴</span>
                    <span className="font-medium">+ ¥{subsidy.toLocaleString()}</span>
                  </div>
                )}
                <Divider style={{ margin: '12px 0' }} />
                <div className="flex justify-between">
                  <span className="font-medium">合计应缴</span>
                  <span className="text-xl font-bold text-blue-600">
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                block
                onClick={() => setCreateModalVisible(true)}
                style={{
                  height: '48px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #165DFF 0%, #0E42B3 100%)',
                  border: 'none',
                }}
              >
                生成缴费订单
              </Button>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const orderListTab = () => (
    <div className="space-y-6">
      {orderStats()}

      <Card
        title={
          <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '18px' }}>
            订单列表（按险种分类）
          </span>
        }
        className="shadow-sm"
      >
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: `全部订单 (${orders.length})`,
              children: (
                <Table
                  dataSource={orders}
                  columns={orderColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 8 }}
                />
              ),
            },
            ...insuranceOptions.map((opt) => {
              const typeOrders = getOrdersByInsurance(opt.type);
              return {
                key: opt.type,
                label: (
                  <span>
                    {opt.icon} {opt.name} ({typeOrders.length})
                  </span>
                ),
                children: typeOrders.length > 0 ? (
                  <Table
                    dataSource={typeOrders}
                    columns={orderColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                  />
                ) : (
                  <Empty description={`暂无${opt.name}缴费订单`} />
                ),
              };
            }),
          ]}
        />
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{
          background: 'linear-gradient(135deg, #165DFF 0%, #0E42B3 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'Noto Serif SC, serif' }}
            >
              缴费中心
            </h1>
            <p className="text-blue-100">选择险种和缴费档次，多渠道完成社保缴费，全链路追踪三端状态</p>
          </div>
          <PayCircleOutlined className="text-6xl opacity-30" />
        </div>
      </div>

      <Card className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'create', label: '我要缴费' },
            { key: 'list', label: '订单列表' },
          ]}
          size="large"
          style={{ padding: '0 24px' }}
        />
      </Card>

      {activeTab === 'create' && createOrderForm()}
      {activeTab === 'list' && orderListTab()}

      <Modal
        title="确认生成订单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={actionLoading}
            onClick={handleCreateOrder}
          >
            确认生成
          </Button>,
        ]}
      >
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">险种</span>
            <span className="font-medium">{getInsuranceName(selectedInsurance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">缴费年度</span>
            <span className="font-medium">{selectedYear}年度</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">缴费档次</span>
            <span className="font-medium">第{selectedGrade}档</span>
          </div>
          {useFamilyAccount && selectedFamilyMember && (
            <div className="flex justify-between">
              <span className="text-gray-500">共济使用人</span>
              <span className="font-medium">
                {familyMembers.find((m) => m.id === selectedFamilyMember)?.relativeName}
              </span>
            </div>
          )}
          <Divider />
          <div className="flex justify-between">
            <span className="font-medium">应缴金额</span>
            <span className="text-2xl font-bold text-blue-600">
              ¥{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </Modal>

      <Modal
        title="选择支付方式"
        open={payModalVisible}
        onCancel={() => {
          setPayModalVisible(false);
          setSelectedChannel(null);
        }}
        footer={null}
        width={500}
      >
        {selectedOrder && (
          <div className="text-center mb-6">
            <div className="text-sm text-gray-500 mb-1">订单号：{selectedOrder.orderNo}</div>
            <div className="text-4xl font-bold text-blue-600">
              ¥{selectedOrder.amount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {getInsuranceName(selectedOrder.insuranceType)} · {selectedOrder.payYear}年度
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 mb-3 font-medium">请选择支付渠道</div>
        <Row gutter={[12, 12]}>
          {channelOptions.map((channel) => (
            <Col xs={12} key={channel.key}>
              <div
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  selectedChannel === channel.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${channel.bgColor}`}
                onClick={() => setSelectedChannel(channel.key)}
                style={{ color: channel.color }}
              >
                <div className="flex flex-col items-center gap-2">
                  {channel.icon}
                  <span className="font-medium">{channel.name}</span>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <Button
          type="primary"
          size="large"
          block
          disabled={!selectedChannel}
          loading={actionLoading}
          onClick={() => selectedChannel && handlePay(selectedChannel)}
          style={{
            marginTop: '24px',
            height: '48px',
            fontSize: '16px',
            background: selectedChannel
              ? channelOptions.find((c) => c.key === selectedChannel)?.color
              : undefined,
            border: 'none',
          }}
        >
          {selectedChannel
            ? `立即支付 ¥${selectedOrder?.amount.toLocaleString() || 0}`
            : '请选择支付方式'}
        </Button>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>
              订单详情 - 三端状态追踪
            </span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          selectedOrder?.status === 'pending' && (
            <Button
              key="pay"
              type="primary"
              onClick={() => {
                setDetailModalVisible(false);
                handlePayOrder(selectedOrder);
              }}
            >
              去支付
            </Button>
          ),
        ]}
        width={750}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: `${getInsuranceColor(selectedOrder.insuranceType)}10`,
                borderLeft: `4px solid ${getInsuranceColor(selectedOrder.insuranceType)}`,
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl mr-2">
                    {insuranceOptions.find((o) => o.type === selectedOrder.insuranceType)?.icon}
                  </span>
                  <span className="font-bold text-lg">
                    {getInsuranceName(selectedOrder.insuranceType)}
                  </span>
                  <Tag
                    className="ml-2"
                    color={getStatusColor(selectedOrder.status)}
                    icon={getStatusIcon(selectedOrder.status)}
                  >
                    {getStatusText(selectedOrder.status)}
                  </Tag>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: getInsuranceColor(selectedOrder.insuranceType) }}>
                    ¥{selectedOrder.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{selectedOrder.payYear}年度 · 第{selectedOrder.payGrade}档</div>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-3 flex items-center gap-2">
                <InfoCircleOutlined className="text-blue-600" />
                全链路状态追踪
              </div>
              <Card className="bg-gray-50">
                <Steps
                  direction="horizontal"
                  size="small"
                  current={
                    selectedOrder.medicalCreditStatus === 'credited' ? 4 :
                    selectedOrder.financeStatus === 'warehoused' ? 3 :
                    selectedOrder.taxInvoiceStatus === 'issued' ? 2 :
                    selectedOrder.status === 'paid' ? 1 : 0
                  }
                  items={getThreeEndSteps(selectedOrder)}
                />
              </Card>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Descriptions
                  title="订单基础信息"
                  bordered
                  column={1}
                  size="small"
                >
                  <Descriptions.Item label="订单号">
                    <code>{selectedOrder.orderNo}</code>
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {selectedOrder.createdAt}
                  </Descriptions.Item>
                  <Descriptions.Item label="支付时间">
                    {selectedOrder.paidAt || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="支付渠道">
                    {selectedOrder.channel ? getChannelName(selectedOrder.channel) : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} md={12}>
                <Descriptions
                  title="三端同步状态"
                  bordered
                  column={1}
                  size="small"
                >
                  <Descriptions.Item label="税务开票">
                    <Tag
                      icon={threeEndStatusConfig.taxInvoiceStatus[selectedOrder.taxInvoiceStatus as keyof typeof threeEndStatusConfig.taxInvoiceStatus].icon}
                      color={threeEndStatusConfig.taxInvoiceStatus[selectedOrder.taxInvoiceStatus as keyof typeof threeEndStatusConfig.taxInvoiceStatus].color}
                    >
                      {threeEndStatusConfig.taxInvoiceStatus[selectedOrder.taxInvoiceStatus as keyof typeof threeEndStatusConfig.taxInvoiceStatus].text}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="财政入库">
                    <Tag
                      icon={threeEndStatusConfig.financeStatus[selectedOrder.financeStatus as keyof typeof threeEndStatusConfig.financeStatus].icon}
                      color={threeEndStatusConfig.financeStatus[selectedOrder.financeStatus as keyof typeof threeEndStatusConfig.financeStatus].color}
                    >
                      {threeEndStatusConfig.financeStatus[selectedOrder.financeStatus as keyof typeof threeEndStatusConfig.financeStatus].text}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="医保入账">
                    <Tag
                      icon={threeEndStatusConfig.medicalCreditStatus[selectedOrder.medicalCreditStatus as keyof typeof threeEndStatusConfig.medicalCreditStatus].icon}
                      color={threeEndStatusConfig.medicalCreditStatus[selectedOrder.medicalCreditStatus as keyof typeof threeEndStatusConfig.medicalCreditStatus].color}
                    >
                      {threeEndStatusConfig.medicalCreditStatus[selectedOrder.medicalCreditStatus as keyof typeof threeEndStatusConfig.medicalCreditStatus].text}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            {selectedOrder.status === 'paid' && (
              <Alert
                message="缴费完成说明"
                description="您的缴费已完成，税务部门将在1-3个工作日内完成开票，财政部门完成资金入库，医保部门完成个人账户入账。您可在此页面实时追踪各环节状态。"
                type="success"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentPage;
