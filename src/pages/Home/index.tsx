import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Avatar,
  Button,
  Badge,
  Alert,
  Steps,
  Space,
  Divider,
  Tooltip,
  Progress,
  Empty,
} from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  WalletOutlined,
  TeamOutlined,
  CalendarOutlined,
  BellOutlined,
  FileTextOutlined,
  AlertOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  BarChartOutlined,
  HomeOutlined,
  IdcardOutlined,
  PayCircleOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  MedicineBoxOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { user, insurance, payment, warning } from '@/api';
import type { UserProfile, InsuranceInfo, PaymentOrder, PaymentWarning } from '@/types';

const { Step } = Steps;

const insuranceTypeConfig = {
  pension: { name: '城乡居民养老保险', icon: '👴', color: '#165DFF' },
  medical: { name: '城乡居民医疗保险', icon: '🏥', color: '#52c41a' },
  flexible_pension: { name: '灵活就业养老保险', icon: '💼', color: '#722ed1' },
  flexible_medical: { name: '灵活就业医疗保险', icon: '🩺', color: '#eb2f96' },
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

const statusFlowConfig = {
  pending: { color: 'warning', text: '待支付', icon: <ClockCircleOutlined /> },
  paid: { color: 'success', text: '已支付', icon: <CheckCircleOutlined /> },
  cancelled: { color: 'error', text: '已取消', icon: <CloseCircleOutlined /> },
  refunded: { color: 'default', text: '已退款', icon: <CloseCircleOutlined /> },
};

const warningTypeConfig = {
  break_pay: { name: '断缴预警', color: '#ff4d4f' },
  abnormal_amount: { name: '金额异常', color: '#faad14' },
  suspected_fraud: { name: '疑似欺诈', color: '#eb2f96' },
};

const serviceEntries = [
  {
    key: 'insurance',
    title: '参保查询',
    icon: <IdcardOutlined className="text-2xl" />,
    color: '#165DFF',
    desc: '参保状态、缴费记录、待遇信息',
  },
  {
    key: 'payment',
    title: '缴费中心',
    icon: <PayCircleOutlined className="text-2xl" />,
    color: '#52c41a',
    desc: '多渠道缴费、订单查询、票据下载',
  },
  {
    key: 'family',
    title: '家庭共济',
    icon: <TeamOutlined className="text-2xl" />,
    color: '#722ed1',
    desc: '亲属绑定、额度共享、使用记录',
  },
  {
    key: 'benefit',
    title: '待遇发放',
    icon: <WalletOutlined className="text-2xl" />,
    color: '#faad14',
    desc: '养老金、医保待遇、发放明细',
  },
  {
    key: 'calculator',
    title: '政策计算器',
    icon: <BarChartOutlined className="text-2xl" />,
    color: '#13c2c2',
    desc: '养老金预估、缴费档次测算',
  },
  {
    key: 'policy',
    title: '政策公告',
    icon: <FileTextOutlined className="text-2xl" />,
    color: '#fa8c16',
    desc: '最新政策、办事指南、常见问题',
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [insuranceList, setInsuranceList] = useState<InsuranceInfo[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [warnings, setWarnings] = useState<PaymentWarning[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, insuranceRes, ordersRes, warningsRes] = await Promise.all([
        user.getProfile(),
        insurance.getList(),
        payment.getOrders(),
        warning.getList(),
      ]);
      if (profileRes.success) {
        setUserProfile(profileRes.data?.user || profileRes.data);
      }
      if (insuranceRes.success) {
        setInsuranceList(insuranceRes.data?.items || insuranceRes.data || []);
      }
      if (ordersRes.success) {
        setOrders(ordersRes.data?.items || ordersRes.data || []);
      }
      if (warningsRes.success) {
        setWarnings(warningsRes.data?.items || warningsRes.data || []);
      }
    } catch (error) {
      console.error('Load home data failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalInsured = insuranceList.filter((i) => i.status === 'insured').length;
  const totalMonths = insuranceList.reduce((sum, i) => sum + i.paidMonths, 0);
  const totalAccount = insuranceList.reduce((sum, i) => sum + i.personalAccount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const activeWarnings = warnings.filter((w) => w.status === 'pending');
  const paidOrders = orders.filter((o) => o.status === 'paid');

  const getThreeEndSteps = (order: PaymentOrder) => {
    return [
      {
        title: '订单创建',
        status: 'finish' as const,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      },
      {
        title: '税务开票',
        status: order.taxInvoiceStatus === 'issued' ? 'finish' : order.taxInvoiceStatus === 'failed' ? 'error' : (order.status === 'paid' ? 'process' : 'wait') as const,
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
  };

  const navigateTo = (key: string) => {
    const routes: Record<string, string> = {
      insurance: '/insurance',
      payment: '/payment',
      family: '/family',
      benefit: '/benefit',
      calculator: '/calculator',
      policy: '/policy',
    };
    if (routes[key]) {
      navigate(routes[key]);
    }
  };

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
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='84' height='48' viewBox='0 0 84 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h12v6H0V0zm28 8h12v6H28V8zm14-8h12v6H42V0zm14 0h12v6H56V0zm0 8h12v6H56V8zM42 8h12v6H42V8zm0 16h12v6H42v-6zm14-8h12v6H56v-6zm14 0h12v6H70v-6zm0-16h12v6H70V0zM28 32h12v6H28v-6zM14 16h12v6H14v-6zM0 24h12v6H0v-6zm0 8h12v6H0v-6zm14 0h12v6H14v-6zm14 8h12v6H28v-6zm-14 0h12v6H14v-6zm28 0h12v6H42v-6zm14-8h12v6H56v-6zm0-8h12v6H56v-6zm14 8h12v6H70v-6zm0 8h12v6H70v-6zM14 24h12v6H14v-6zm14-8h12v6H28v-6zM14 8h12v6H14V8zM0 16h12v6H0v-6zm56 0h12v6H56v-6zm28 0h12v6H84v-6zm-42 8h12v6H42v-6z' fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar size={64} icon={<UserOutlined />} style={{ background: '#FFB020' }} />
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                  欢迎回来，{userProfile?.name || '用户'}
                </h1>
                <p className="text-blue-100 text-sm">
                  <IdcardOutlined className="mr-1" />
                  {userProfile?.idCard}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Tag color="success" icon={<SafetyOutlined />} style={{ fontSize: '14px', padding: '4px 12px' }}>
                实名认证已通过
              </Tag>
              <div className="text-xs text-blue-200 mt-1">
                {userProfile?.address || '湖南省'}
              </div>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card className="bg-white/10 backdrop-blur border-0">
                <Statistic
                  title={<span className="text-blue-100">参保险种</span>}
                  value={totalInsured}
                  suffix="个"
                  prefix={<SafetyOutlined />}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="bg-white/10 backdrop-blur border-0">
                <Statistic
                  title={<span className="text-blue-100">累计缴费月数</span>}
                  value={totalMonths}
                  suffix="月"
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="bg-white/10 backdrop-blur border-0">
                <Statistic
                  title={<span className="text-blue-100">个人账户总额</span>}
                  value={totalAccount}
                  prefix="¥"
                  precision={2}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="bg-white/10 backdrop-blur border-0">
                <Statistic
                  title={<span className="text-blue-100">待缴费订单</span>}
                  value={pendingOrders.length}
                  suffix="笔"
                  prefix={<BellOutlined />}
                  valueStyle={{ color: '#FFB020' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {activeWarnings.length > 0 && (
        <Alert
          message={
            <div className="flex items-center gap-2">
              <AlertOutlined className="text-red-500" />
              <span>您有 <span className="font-bold text-red-600">{activeWarnings.length}</span> 条异常预警待处理</span>
            </div>
          }
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" danger onClick={() => navigate('/admin/warnings')}>
              立即处理
            </Button>
          }
          closable
        />
      )}

      {pendingOrders.length > 0 && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <BellOutlined className="text-orange-500" />
              <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '16px' }}>
                待缴费订单（三端追踪）
              </span>
            </div>
          }
          className="shadow-sm"
          extra={
            <Button type="link" onClick={() => navigate('/payment', { state: { activeTab: 'list' } })}>
              查看全部 <ArrowRightOutlined />
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {pendingOrders.slice(0, 3).map((order) => {
              const insuranceType = insuranceTypeConfig[order.insuranceType as keyof typeof insuranceTypeConfig];
              return (
                <Col xs={24} lg={8} key={order.id}>
                  <Card
                    size="small"
                    className="h-full border-l-4"
                    style={{ borderLeftColor: insuranceType?.color }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{insuranceType?.icon}</span>
                          <span className="font-medium">{insuranceType?.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.payYear}年度 · 第{order.payGrade}档
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">
                          ¥{order.amount.toLocaleString()}
                        </div>
                        <Tag
                          size="small"
                          icon={statusFlowConfig[order.status as keyof typeof statusFlowConfig]?.icon}
                          color={statusFlowConfig[order.status as keyof typeof statusFlowConfig]?.color}
                        >
                          {statusFlowConfig[order.status as keyof typeof statusFlowConfig]?.text}
                        </Tag>
                      </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <InfoCircleOutlined />
                      三端状态（支付后自动同步）
                    </div>
                    <Steps
                      direction="horizontal"
                      size="small"
                      current={0}
                      items={getThreeEndSteps(order)}
                      style={{ marginBottom: '12px' }}
                    />

                    <div className="text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <ClockCircleOutlined />
                        创建时间: {order.createdAt}
                      </div>
                    </div>

                    <Button
                      type="primary"
                      size="small"
                      block
                      onClick={() => navigate('/payment', { state: { insuranceType: order.insuranceType } })}
                      style={{ background: insuranceType?.color, borderColor: insuranceType?.color }}
                    >
                      立即缴费
                    </Button>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}

      {paidOrders.length > 0 && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className="text-green-500" />
              <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '16px' }}>
                最近缴费订单（三端追踪）
              </span>
            </div>
          }
          className="shadow-sm"
          extra={
            <Button type="link" onClick={() => navigate('/payment', { state: { activeTab: 'list' } })}>
              查看全部 <ArrowRightOutlined />
            </Button>
          }
        >
          <List
            size="small"
            dataSource={paidOrders.slice(0, 3)}
            renderItem={(order) => {
              const insuranceType = insuranceTypeConfig[order.insuranceType as keyof typeof insuranceTypeConfig];
              const steps = getThreeEndSteps(order);
              const completedSteps = steps.filter((s) => s.status === 'finish').length;

              return (
                <List.Item key={order.id}>
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <Tag color={insuranceType?.color} style={{ fontSize: '14px', padding: '2px 10px' }}>
                          {insuranceType?.icon} {insuranceType?.name}
                        </Tag>
                        <span className="text-gray-500">{order.payYear}年度 · 第{order.payGrade}档</span>
                        <code className="text-xs text-gray-400">{order.orderNo}</code>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-600 text-lg">
                          -¥{order.amount.toLocaleString()}
                        </span>
                        <Tag color="success" icon={<CheckCircleOutlined />}>已支付</Tag>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-xs text-gray-500 w-16">三端进度:</div>
                      <div className="flex-1">
                        <Progress
                          percent={Math.round((completedSteps / 4) * 100)}
                          size="small"
                          showInfo={false}
                          strokeColor={{ '0%': '#52c41a', '100%': '#165DFF' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{completedSteps}/4 步</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <Tooltip title={`税务开票: ${threeEndStatusConfig.taxInvoiceStatus[order.taxInvoiceStatus as keyof typeof threeEndStatusConfig.taxInvoiceStatus].text}`}>
                          <span style={{ color: order.taxInvoiceStatus === 'issued' ? '#52c41a' : '#d9d9d9', marginRight: '4px' }}>
                            <SafetyCertificateOutlined />
                          </span>
                          <span>税务</span>
                        </Tooltip>
                        <Tooltip title={`财政入库: ${threeEndStatusConfig.financeStatus[order.financeStatus as keyof typeof threeEndStatusConfig.financeStatus].text}`}>
                          <span style={{ color: order.financeStatus === 'warehoused' ? '#52c41a' : '#d9d9d9', marginRight: '4px' }}>
                            <ApartmentOutlined />
                          </span>
                          <span>财政</span>
                        </Tooltip>
                        <Tooltip title={`医保入账: ${threeEndStatusConfig.medicalCreditStatus[order.medicalCreditStatus as keyof typeof threeEndStatusConfig.medicalCreditStatus].text}`}>
                          <span style={{ color: order.medicalCreditStatus === 'credited' ? '#52c41a' : '#d9d9d9', marginRight: '4px' }}>
                            <MedicineBoxOutlined />
                          </span>
                          <span>医保</span>
                        </Tooltip>
                      </div>
                      <div>
                        支付时间: {order.paidAt || '-'}
                      </div>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        </Card>
      )}

      <Card
        title={
          <div className="flex items-center gap-2">
            <SafetyOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '16px' }}>
              我的参保状态
            </span>
          </div>
        }
        className="shadow-sm"
        extra={
          <Button type="link" onClick={() => navigate('/insurance')}>
            管理参保 <ArrowRightOutlined />
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {insuranceList.length > 0 ? (
            insuranceList.map((ins) => {
              const config = insuranceTypeConfig[ins.insuranceType as keyof typeof insuranceTypeConfig];
              const progress = Math.min(Math.round((ins.paidMonths / 180) * 100), 100);

              return (
                <Col xs={24} md={12} lg={6} key={ins.id}>
                  <Card
                    size="small"
                    className="h-full"
                    style={{
                      background: `linear-gradient(135deg, ${config?.color}08 0%, ${config?.color}15 100%)`,
                      border: `1px solid ${config?.color}20`,
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{config?.icon}</span>
                        <div>
                          <div className="font-medium">{config?.name}</div>
                        </div>
                      </div>
                      <Badge
                        status={ins.status === 'insured' ? 'success' : 'warning'}
                        text={ins.status === 'insured' ? '已参保' : '未参保'}
                      />
                    </div>

                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">缴费档次</span>
                        <span className="font-medium">第{ins.payGrade}档</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">已缴月数</span>
                        <span className="font-medium">{ins.paidMonths}/180月</span>
                      </div>
                      <Progress
                        percent={progress}
                        size="small"
                        strokeColor={config?.color}
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">个人账户</span>
                        <span className="font-bold" style={{ color: config?.color }}>
                          ¥{ins.personalAccount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {ins.status !== 'insured' && (
                      <Button
                        type="primary"
                        size="small"
                        block
                        className="mt-3"
                        style={{ background: config?.color, borderColor: config?.color }}
                        onClick={() => navigate('/insurance', { state: { activeTab: 'guide' } })}
                      >
                        <PlusOutlined /> 办理参保
                      </Button>
                    )}
                  </Card>
                </Col>
              );
            })
          ) : (
            <Empty
              description="暂无参保信息"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => navigate('/insurance', { state: { activeTab: 'guide' } })}>
                办理参保
              </Button>
            </Empty>
          )}
        </Row>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <HomeOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '16px' }}>
              服务入口
            </span>
          </div>
        }
        className="shadow-sm"
      >
        <Row gutter={[16, 16]}>
          {serviceEntries.map((entry) => (
            <Col xs={12} sm={8} md={4} key={entry.key}>
              <div
                className="cursor-pointer p-4 rounded-xl border-2 border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all text-center group"
                onClick={() => navigateTo(entry.key)}
              >
                <div
                  className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${entry.color}15 0%, ${entry.color}25 100%)`,
                    color: entry.color,
                  }}
                >
                  {entry.icon}
                </div>
                <div className="font-medium text-gray-800">{entry.title}</div>
                <div className="text-xs text-gray-500 mt-1">{entry.desc}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-orange-500" />
            <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '16px' }}>
              政策公告
            </span>
          </div>
        }
        className="shadow-sm"
        extra={
          <Button type="link" onClick={() => navigate('/policy')}>
            查看更多 <ArrowRightOutlined />
          </Button>
        }
      >
        <List
          size="small"
          dataSource={[
            { title: '关于2025年度城乡居民医疗保险缴费标准调整的通知', date: '2025-01-15', tag: '最新' },
            { title: '湖南省灵活就业人员社保补贴政策解读', date: '2025-01-10', tag: '政策' },
            { title: '家庭共济账户使用指南及常见问题解答', date: '2025-01-05', tag: '指南' },
            { title: '养老金计算方法及退休待遇发放说明', date: '2024-12-28', tag: '政策' },
          ]}
          renderItem={(item) => (
            <List.Item
              actions={[
                <span key="date" className="text-gray-400 text-xs">{item.date}</span>,
              ]}
            >
              <List.Item.Meta
                avatar={<Tag color={item.tag === '最新' ? 'red' : item.tag === '政策' ? 'blue' : 'green'} size="small">{item.tag}</Tag>}
                title={
                  <a className="hover:text-blue-600 cursor-pointer">
                    {item.title}
                  </a>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default HomePage;
