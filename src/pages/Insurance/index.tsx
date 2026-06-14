import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Timeline,
  Button,
  Empty,
  Modal,
  message,
  Alert,
  Tabs,
  Descriptions,
  Progress,
  Statistic,
  Divider,
  List,
  Badge,
  Steps,
} from 'antd';
import {
  FileTextOutlined,
  WarningOutlined,
  RedoOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  MedicineBoxOutlined,
  ApartmentOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { insurance, payment } from '@/api';
import type { InsuranceInfo, InsuranceHistoryItem, PaymentOrder } from '@/types';

const { Step } = Steps;
const { TabPane } = Tabs;

const insuranceTypeConfig: Record<string, {
  name: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
  eligibility: string[];
  procedures: { title: string; desc: string }[];
}> = {
  pension: {
    name: '城乡居民养老保险',
    icon: '👴',
    color: '#165DFF',
    gradient: 'linear-gradient(135deg, #165DFF 0%, #0E42B3 100%)',
    description: '为城乡居民提供养老保障，缴费档次灵活选择，政府补贴计入个人账户',
    eligibility: [
      '年满16周岁（不含在校学生）',
      '非国家机关和事业单位工作人员',
      '不属于职工基本养老保险制度覆盖范围的城乡居民',
      '具有湖南省户籍',
    ],
    procedures: [
      { title: '参保登记', desc: '携带身份证、户口本到户籍所在地社区/村居委会办理' },
      { title: '选择档次', desc: '每年可调整缴费档次，共200-2000元5个档次' },
      { title: '按时缴费', desc: '按年缴费，政府补贴自动计入个人账户' },
      { title: '待遇领取', desc: '年满60周岁、累计缴费满15年可按月领取养老金' },
    ],
  },
  medical: {
    name: '城乡居民医疗保险',
    icon: '🏥',
    color: '#52c41a',
    gradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
    description: '为城乡居民提供基本医疗保障，覆盖住院、门诊、大病保险',
    eligibility: [
      '具有湖南省户籍的城乡居民',
      '在湖南省居住的非户籍常住人口',
      '各类全日制普通高等学校、科研院所接受普通高等学历教育的全日制学生',
      '未参加职工基本医疗保险的其他人员',
    ],
    procedures: [
      { title: '参保登记', desc: '每年9-12月集中参保期，社区/村居委会统一办理' },
      { title: '缴纳保费', desc: '个人缴费+政府补助，人均财政补助不低于640元' },
      { title: '医保待遇', desc: '住院报销比例50-80%，门诊统筹报销50%' },
      { title: '大病保险', desc: '高额医疗费用二次报销，报销比例不低于60%' },
    ],
  },
  flexible_pension: {
    name: '灵活就业养老保险',
    icon: '💼',
    color: '#722ed1',
    gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
    description: '为灵活就业人员提供职工养老保障，缴费基数自主选择',
    eligibility: [
      '年满16周岁，男未满60周岁、女未满55周岁',
      '从事灵活就业的城乡劳动者',
      '个体工商户及其雇工',
      '未与用人单位建立劳动关系的新业态从业人员',
    ],
    procedures: [
      { title: '参保登记', desc: '凭身份证到社保经办机构办理灵活就业参保' },
      { title: '选择基数', desc: '按全省全口径平均工资的60%-300%自主选择' },
      { title: '按月缴费', desc: '缴费比例20%，其中8%计入个人账户' },
      { title: '待遇领取', desc: '累计满15年，达到法定退休年龄可领取养老金' },
    ],
  },
  flexible_medical: {
    name: '灵活就业医疗保险',
    icon: '🩺',
    color: '#eb2f96',
    gradient: 'linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)',
    description: '为灵活就业人员提供职工医疗保障，享受统筹基金待遇',
    eligibility: [
      '年满16周岁，未达到法定退休年龄',
      '从事灵活就业的人员',
      '已参加灵活就业养老保险人员',
      '自愿以灵活就业人员身份参保',
    ],
    procedures: [
      { title: '参保登记', desc: '凭身份证到医保经办机构办理参保手续' },
      { title: '选择缴费比例', desc: '可选择5.6%（统筹）或8.5%（统筹+个人账户）' },
      { title: '按月缴费', desc: '每月按时缴纳，连续缴费满6个月享受待遇' },
      { title: '医保待遇', desc: '与职工医保待遇一致，个人账户可刷卡消费' },
    ],
  },
};

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

const InsurancePage: React.FC = () => {
  const navigate = useNavigate();
  const [insuranceList, setInsuranceList] = useState<InsuranceInfo[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [historyMap, setHistoryMap] = useState<Record<number, InsuranceHistoryItem[]>>({});
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceInfo | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('pension');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [insuranceRes, ordersRes] = await Promise.all([
        insurance.getList(),
        payment.getOrders(),
      ]);
      if (insuranceRes.success) {
        setInsuranceList(insuranceRes.data?.items || insuranceRes.data || []);
      }
      if (ordersRes.success) {
        setOrders(ordersRes.data?.items || ordersRes.data || []);
      }
    } catch (error) {
      console.error('Load insurance data failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (id: number) => {
    try {
      const response = await insurance.getHistory(id);
      if (response.success) {
        setHistoryMap((prev) => ({ ...prev, [id]: response.data }));
      }
    } catch (error) {
      console.error('Load history failed:', error);
    }
  };

  const showHistory = async (item: InsuranceInfo) => {
    setSelectedInsurance(item);
    setHistoryModalVisible(true);
    if (!historyMap[item.id]) {
      await loadHistory(item.id);
    }
  };

  const showDetail = (item: InsuranceInfo) => {
    setSelectedInsurance(item);
    setDetailModalVisible(true);
  };

  const handleRegister = (type: string) => {
    setSelectedType(type);
    setRegisterModalVisible(true);
  };

  const handleSupplement = (item: InsuranceInfo) => {
    Modal.confirm({
      title: '补缴确认',
      content: `确定要为${insuranceTypeConfig[item.insuranceType]?.name || item.insuranceType}办理补缴吗？`,
      okText: '确认补缴',
      cancelText: '取消',
      onOk: () => {
        navigate('/payment', {
          state: { insuranceType: item.insuranceType, isSupplement: true },
        });
        message.success('已跳转至缴费中心');
      },
    });
  };

  const getInsuranceOrders = (insuranceType: string) => {
    return orders.filter((o) => o.insuranceType === insuranceType);
  };

  const getThreeEndSteps = (order: PaymentOrder) => {
    const steps = [
      {
        title: '订单创建',
        status: 'finish' as const,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      },
      {
        title: '税务开票',
        status: order.taxInvoiceStatus === 'issued' ? 'finish' : order.taxInvoiceStatus === 'failed' ? 'error' : 'process' as const,
        icon: threeEndStatusConfig.taxInvoiceStatus[order.taxInvoiceStatus as keyof typeof threeEndStatusConfig.taxInvoiceStatus]?.icon,
      },
      {
        title: '财政入库',
        status: order.financeStatus === 'warehoused' ? 'finish' : order.financeStatus === 'failed' ? 'error' : 'wait' as const,
        icon: threeEndStatusConfig.financeStatus[order.financeStatus as keyof typeof threeEndStatusConfig.financeStatus]?.icon,
      },
      {
        title: '医保入账',
        status: order.medicalCreditStatus === 'credited' ? 'finish' : order.medicalCreditStatus === 'failed' ? 'error' : 'wait' as const,
        icon: threeEndStatusConfig.medicalCreditStatus[order.medicalCreditStatus as keyof typeof threeEndStatusConfig.medicalCreditStatus]?.icon,
      },
    ];
    return steps;
  };

  const hasBreakPayment = (history: InsuranceHistoryItem[] = []) => {
    return history.some((h) => h.status === 'unpaid');
  };

  const getHistoryItems = (history: InsuranceHistoryItem[] = []) => {
    return history.map((item) => ({
      color: item.status === 'paid' ? 'green' : 'red',
      children: (
        <div className="flex justify-between items-center">
          <div>
            <div className="font-medium">{item.payMonth}</div>
            <div className="text-sm text-gray-500">
              {insuranceTypeConfig[item.insuranceType]?.name || item.insuranceType}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">¥{item.amount.toLocaleString()}</div>
            <div className="text-sm">
              {item.status === 'paid' ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircleOutlined /> 已缴费
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <CloseCircleOutlined /> 断缴
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    }));
  };

  const getUnregisteredTypes = () => {
    const registeredTypes = insuranceList.map((i) => i.insuranceType);
    return Object.keys(insuranceTypeConfig).filter((t) => !registeredTypes.includes(t));
  };

  const insuranceCards = () => (
    <div className="space-y-6">
      {insuranceList.length > 0 ? (
        <Row gutter={[24, 24]}>
          {insuranceList.map((item) => {
            const config = insuranceTypeConfig[item.insuranceType];
            const typeOrders = getInsuranceOrders(item.insuranceType);
            const paidOrders = typeOrders.filter((o) => o.status === 'paid');
            const pendingOrders = typeOrders.filter((o) => o.status === 'pending');
            const latestOrder = paidOrders[0] || pendingOrders[0];

            return (
              <Col xs={24} xl={12} key={item.id}>
                <Card
                  className="shadow-sm hover:shadow-md transition-shadow h-full"
                  bodyStyle={{ padding: 0 }}
                >
                  <div
                    className="px-6 py-4 text-white rounded-t-lg"
                    style={{ background: config?.gradient }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{config?.icon}</span>
                        <div>
                          <div className="font-bold text-xl">{config?.name}</div>
                          <Tag color={item.status === 'insured' ? 'success' : item.status === 'suspended' ? 'warning' : 'error'}>
                            {item.status === 'insured' ? '正常参保' : item.status === 'suspended' ? '参保中止' : '参保终止'}
                          </Tag>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">¥{item.personalAccount.toLocaleString()}</div>
                        <div className="text-sm opacity-80">个人账户</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <Row gutter={[16, 16]} className="mb-4">
                      <Col span={8}>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{item.payGrade}档</div>
                          <div className="text-xs text-gray-500">缴费档次</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{item.totalMonths}</div>
                          <div className="text-xs text-gray-500">累计缴费月</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">¥{item.governmentSubsidy.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">政府补贴</div>
                        </div>
                      </Col>
                    </Row>

                    {item.status === 'suspended' && (
                      <Alert
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                        message="您的社保已断缴，为避免影响您的社保待遇，请及时补缴"
                        action={
                          <Button
                            size="small"
                            type="primary"
                            danger
                            onClick={() => handleSupplement(item)}
                          >
                            立即补缴
                          </Button>
                        }
                        className="mb-4"
                      />
                    )}

                    {pendingOrders.length > 0 && (
                      <Alert
                        type="info"
                        showIcon
                        message={`您有 ${pendingOrders.length} 笔待缴费订单`}
                        action={
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => navigate('/payment')}
                          >
                            去缴费
                          </Button>
                        }
                        className="mb-4"
                      />
                    )}

                    {latestOrder && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">最新缴费订单追踪</span>
                          <span className="text-xs text-gray-400">{latestOrder.orderNo}</span>
                        </div>
                        <Steps
                          size="small"
                          current={latestOrder.taxInvoiceStatus === 'issued' ? 2 : latestOrder.status === 'paid' ? 1 : 0}
                          items={getThreeEndSteps(latestOrder)}
                        />
                        <div className="flex justify-between mt-2 text-xs">
                          <span className="text-gray-500">订单号: {latestOrder.orderNo}</span>
                          <span className="text-gray-500">金额: ¥{latestOrder.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        block
                        onClick={() => showDetail(item)}
                      >
                        <FileTextOutlined /> 参保详情
                      </Button>
                      <Button
                        block
                        onClick={() => showHistory(item)}
                      >
                        <ClockCircleOutlined /> 缴费历史
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Card>
          <Empty description="暂无参保信息，可在下方办理参保登记" />
        </Card>
      )}

      <Divider orientation="left">可办理的险种</Divider>

      {getUnregisteredTypes().length > 0 ? (
        <Row gutter={[16, 16]}>
          {getUnregisteredTypes().map((type) => {
            const config = insuranceTypeConfig[type];
            return (
              <Col xs={24} sm={12} lg={6} key={type}>
                <Card
                  className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full"
                  onClick={() => handleRegister(type)}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">{config?.icon}</div>
                    <div className="font-bold text-lg mb-2">{config?.name}</div>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{config?.description}</p>
                    <Button type="primary" icon={<PlusOutlined />}>
                      办理参保
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Alert
          message="您已办理所有可参加的险种"
          type="success"
          showIcon
        />
      )}
    </div>
  );

  const registerGuide = () => (
    <div className="space-y-6">
      <Card
        title={
          <span className="font-bold" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            参保登记办理指南
          </span>
        }
        className="shadow-sm"
      >
        <Alert
          message="温馨提示"
          description="参保前请确认您符合参保条件，并准备好身份证、户口本等相关材料。线上办理需完成实名认证。"
          type="info"
          showIcon
          className="mb-6"
        />

        <Row gutter={[16, 16]}>
          {Object.entries(insuranceTypeConfig).map(([type, config]) => (
            <Col xs={24} lg={12} key={type}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <span>{config.name}</span>
                  </div>
                }
                className="h-full"
                extra={
                  !insuranceList.some((i) => i.insuranceType === type) && (
                    <Button type="primary" size="small" onClick={() => handleRegister(type)}>
                      立即办理
                    </Button>
                  )
                }
              >
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">参保条件</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {config.eligibility.map((e, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircleOutlined className="text-green-500 mt-0.5" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">办理流程</div>
                  <Steps
                    direction="vertical"
                    size="small"
                    items={config.procedures.map((p, idx) => ({
                      title: p.title,
                      description: p.desc,
                    }))}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">办理渠道</div>
                  <Row gutter={[8, 8]}>
                    <Col span={8}>
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <ApartmentOutlined className="text-xl text-blue-600 mb-1" />
                        <div className="text-xs">线下窗口</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <SafetyCertificateOutlined className="text-xl text-green-600 mb-1" />
                        <div className="text-xs">湘税社保APP</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <BankOutlined className="text-xl text-purple-600 mb-1" />
                        <div className="text-xs">银行代扣</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
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
        <div className="absolute inset-0 opacity-20"
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
              参保查询与登记
            </h1>
            <p className="text-blue-100">查看您的参保信息、办理新险种登记、追踪缴费状态</p>
          </div>
          <FileTextOutlined className="text-6xl opacity-30" />
        </div>
      </div>

      <Card className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'list', label: '我的参保' },
            { key: 'guide', label: '参保登记指南' },
          ]}
          size="large"
          style={{ padding: '0 24px' }}
        />
      </Card>

      {activeTab === 'list' && insuranceCards()}
      {activeTab === 'guide' && registerGuide()}

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>
              {selectedInsurance && insuranceTypeConfig[selectedInsurance.insuranceType]?.name}
              {' - '}参保详情
            </span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          <Button
            key="pay"
            type="primary"
            onClick={() => {
              setDetailModalVisible(false);
              navigate('/payment');
            }}
          >
            去缴费
          </Button>,
        ]}
        width={700}
      >
        {selectedInsurance && (
          <div className="space-y-6">
            <Descriptions
              title="基础信息"
              bordered
              column={2}
              size="small"
            >
              <Descriptions.Item label="险种名称">
                {insuranceTypeConfig[selectedInsurance.insuranceType]?.name}
              </Descriptions.Item>
              <Descriptions.Item label="参保状态">
                <Tag color={selectedInsurance.status === 'insured' ? 'success' : 'warning'}>
                  {selectedInsurance.status === 'insured' ? '正常参保' : '参保中止'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="缴费档次">
                {selectedInsurance.payGrade}档
              </Descriptions.Item>
              <Descriptions.Item label="累计缴费">
                {selectedInsurance.totalMonths}个月
              </Descriptions.Item>
              <Descriptions.Item label="政府补贴">
                ¥{selectedInsurance.governmentSubsidy.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="个人账户">
                <span className="text-blue-600 font-bold">¥{selectedInsurance.personalAccount.toLocaleString()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="参保时间">
                {selectedInsurance.insuredAt}
              </Descriptions.Item>
              <Descriptions.Item label="待遇资格">
                <Tag color="success">正常享受</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="font-medium mb-3">缴费进度</div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">累计缴费月数</span>
                  <span className="text-sm font-medium">{selectedInsurance.totalMonths} / 180个月</span>
                </div>
                <Progress
                  percent={Math.min(Math.round((selectedInsurance.totalMonths / 180) * 100), 100)}
                  strokeColor={{
                    '0%': '#165DFF',
                    '100%': '#52c41a',
                  }}
                />
                <div className="text-xs text-gray-500 mt-2">
                  注：累计缴费满15年（180个月）可按月领取基本养老金
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-3">最近缴费订单追踪</div>
              {getInsuranceOrders(selectedInsurance.insuranceType).slice(0, 3).length > 0 ? (
                <List
                  dataSource={getInsuranceOrders(selectedInsurance.insuranceType).slice(0, 3)}
                  renderItem={(order) => (
                    <List.Item className="bg-gray-50 rounded-lg px-4 py-3 mb-2">
                      <div className="w-full">
                        <div className="flex justify-between mb-2">
                          <div>
                            <span className="font-medium">{order.orderNo}</span>
                            <Tag className="ml-2" color={order.status === 'paid' ? 'success' : 'warning'}>
                              {order.status === 'paid' ? '已支付' : '待支付'}
                            </Tag>
                          </div>
                          <span className="font-bold text-blue-600">¥{order.amount.toLocaleString()}</span>
                        </div>
                        <Steps
                          size="small"
                          current={order.taxInvoiceStatus === 'issued' ? 2 : order.status === 'paid' ? 1 : 0}
                          items={getThreeEndSteps(order)}
                        />
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无缴费订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <ClockCircleOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>
              {selectedInsurance && insuranceTypeConfig[selectedInsurance.insuranceType]?.name}
              {' - '}缴费历史
            </span>
          </div>
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedInsurance &&
          hasBreakPayment(historyMap[selectedInsurance.id]) && (
            <div className="mb-4">
              <Alert
                type="warning"
                showIcon
                message="存在断缴记录，建议及时补缴以避免影响社保待遇"
                action={
                  <Button
                    size="small"
                    type="primary"
                    danger
                    onClick={() => {
                      setHistoryModalVisible(false);
                      handleSupplement(selectedInsurance);
                    }}
                  >
                    立即补缴
                  </Button>
                }
              />
            </div>
          )}

        {selectedInsurance && historyMap[selectedInsurance.id]?.length > 0 ? (
          <Timeline
            mode="left"
            items={getHistoryItems(historyMap[selectedInsurance.id])}
          />
        ) : (
          <Empty description="暂无缴费历史记录" />
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <PlusOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>
              办理{insuranceTypeConfig[selectedType]?.name}参保登记
            </span>
          </div>
        }
        open={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRegisterModalVisible(false)}>取消</Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={() => {
              message.success('参保登记申请已提交，工作人员将在3个工作日内审核');
              setRegisterModalVisible(false);
            }}
          >
            提交申请
          </Button>,
        ]}
        width={600}
      >
        <Alert
          message="办理须知"
          description={insuranceTypeConfig[selectedType]?.description}
          type="info"
          showIcon
          className="mb-4"
        />
        <Descriptions bordered column={1} size="small" className="mb-4">
          <Descriptions.Item label="险种名称">
            {insuranceTypeConfig[selectedType]?.name}
          </Descriptions.Item>
          <Descriptions.Item label="参保条件">
            <ul className="mb-0 pl-4">
              {insuranceTypeConfig[selectedType]?.eligibility.map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
            </ul>
          </Descriptions.Item>
          <Descriptions.Item label="办理方式">
            <Tag color="blue">线上办理</Tag>
            <Tag color="green">线下窗口</Tag>
            <Tag color="purple">银行代扣</Tag>
          </Descriptions.Item>
        </Descriptions>
        <Alert
          message="您的身份信息已通过实名认证，确认提交后将自动完成参保登记"
          type="success"
          showIcon
        />
      </Modal>
    </div>
  );
};

export default InsurancePage;
