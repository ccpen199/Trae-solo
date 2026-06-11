import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Statistic,
  DatePicker,
  Tabs,
  Divider,
  Descriptions,
  Alert,
  Progress,
} from 'antd';
import {
  WalletOutlined,
  BankOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExportOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { paymentApi } from '@/api';
import type { Payment, Transaction } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TRANSACTION_STATUS: Record<string, { text: string; color: string }> = {
  completed: { text: '已完成', color: 'success' },
  pending: { text: '处理中', color: 'processing' },
  failed: { text: '失败', color: 'error' },
  cancelled: { text: '已取消', color: 'default' },
};

const TRANSACTION_TYPE: Record<string, { text: string; icon: React.ReactNode; color: string }> = {
  income: { text: '任务收入', icon: <ArrowDownOutlined />, color: 'text-green-600' },
  withdrawal: { text: '提现', icon: <ArrowUpOutlined />, color: 'text-red-500' },
  refund: { text: '退款', icon: <ArrowUpOutlined />, color: 'text-orange-500' },
  compensation: { text: '赔偿', icon: <ArrowDownOutlined />, color: 'text-blue-500' },
};

const ProviderFinance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadOverview();
    loadTransactions();
  }, []);

  const loadOverview = async () => {
    try {
      const data = await paymentApi.getProviderFinanceOverview();
      setOverview(data);
    } catch (error) {
      console.error('加载财务概览失败');
    }
  };

  const loadTransactions = async (page = 1, pageSize = 10, type?: string) => {
    try {
      setLoading(true);
      const data = await paymentApi.getTransactions({ page, pageSize, type: type === 'all' ? undefined : type });
      setTransactions(data.list || []);
      setPagination({ ...pagination, current: page, pageSize, total: data.total || 0 });
    } catch (error) {
      message.error('加载交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    form.resetFields();
    setWithdrawModalVisible(true);
  };

  const handleViewDetail = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setDetailModalVisible(true);
  };

  const handleSubmitWithdraw = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await paymentApi.requestWithdraw(values.amount, values.accountNumber || values.method);

      message.success('提现申请已提交');
      setWithdrawModalVisible(false);
      loadOverview();
      loadTransactions(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('申请失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const incomeTrendChart = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>收入: ¥{c}',
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        data: [12000, 15000, 18000, 22000, 19000, 25000],
        type: 'line',
        smooth: true,
        areaStyle: {
          color: 'rgba(30, 64, 175, 0.1)',
        },
        lineStyle: {
          color: '#1E40AF',
          width: 2,
        },
        itemStyle: {
          color: '#1E40AF',
        },
      },
    ],
  };

  const taskTypeChart = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 45, name: 'LOGO设计' },
          { value: 30, name: '品牌设计' },
          { value: 25, name: 'UI设计' },
          { value: 20, name: '插画设计' },
          { value: 15, name: '视频制作' },
        ],
        label: {
          show: true,
          formatter: '{b}\n{d}%',
        },
      },
    ],
  };

  const columns = [
    {
      title: '交易编号',
      dataIndex: 'transactionNo',
      key: 'transactionNo',
      width: 160,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeInfo = TRANSACTION_TYPE[type] || TRANSACTION_TYPE.income;
        return (
          <Tag icon={typeInfo.icon} className={typeInfo.color}>
            {typeInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '任务/描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: Transaction) => (
        <div>
          <Text strong className="block">{record.taskTitle || text}</Text>
          <Text type="secondary" className="text-sm">
            {record.taskId || ''}
          </Text>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number, record: Transaction) => {
        const isIncome = record.type === 'income' || record.type === 'compensation';
        return (
          <Text strong className={isIncome ? 'text-green-600' : 'text-red-500'}>
            {isIncome ? '+' : '-'}¥{amount?.toLocaleString('zh-CN') || '0'}
          </Text>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusInfo = TRANSACTION_STATUS[status] || TRANSACTION_STATUS.pending;
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record: Transaction) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'income', label: '收入' },
    { key: 'withdrawal', label: '提现' },
    { key: 'refund', label: '退款' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} style={{ margin: 0 }}>财务中心</Title>
          <Text type="secondary">管理您的收入和提现</Text>
        </div>
        <Space>
          <Button icon={<ExportOutlined />}>导出账单</Button>
          <Button type="primary" icon={<BankOutlined />} onClick={handleWithdraw}>
            申请提现
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="账户余额"
              value={overview?.balance || 0}
              precision={2}
              prefix={<WalletOutlined />}
              suffix="元"
              valueStyle={{ color: '#1E40AF' }}
            />
            <div className="mt-2">
              <Button type="link" className="px-0">
                查看明细
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月收入"
              value={overview?.monthlyIncome || 0}
              precision={2}
              prefix={<ArrowDownOutlined />}
              suffix="元"
              valueStyle={{ color: '#52C41A' }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-sm">
                较上月 {overview?.incomeGrowth || 15}%
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="累计收入"
              value={overview?.totalIncome || 0}
              precision={2}
              prefix={<CheckCircleOutlined />}
              suffix="元"
              valueStyle={{ color: '#722ED1' }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-sm">
                共 {overview?.completedTasks || 25} 个任务
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待结算金额"
              value={overview?.pendingAmount || 0}
              precision={2}
              prefix={<ClockCircleOutlined />}
              suffix="元"
              valueStyle={{ color: '#FA8C16' }}
            />
            <div className="mt-2">
              <Progress
                percent={overview?.settlementProgress || 60}
               
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {overview?.withdrawalLimit && (
        <Alert
          message="提现规则"
          description={
            <div>
              单次最低提现 ¥{overview.withdrawalLimit.min?.toLocaleString('zh-CN') || '100'}，
              最高 ¥{overview.withdrawalLimit.max?.toLocaleString('zh-CN') || '50,000'}，
              每日最多 {overview.withdrawalLimit.dailyTimes || 3} 次
            </div>
          }
          type="info"
          showIcon
          className="mb-6"
        />
      )}

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card title="收入趋势" extra={<RangePicker />}>
            <ReactECharts option={incomeTrendChart} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="收入构成">
            <ReactECharts option={taskTypeChart} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="交易记录"
        extra={
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              loadTransactions(1, pagination.pageSize, key);
            }}
            items={tabItems}
           
          />
        }
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => loadTransactions(page, pageSize, activeTab),
          }}
        />
      </Card>

      <Modal
        title="申请提现"
        open={withdrawModalVisible}
        onCancel={() => setWithdrawModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setWithdrawModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmitWithdraw}>
            提交申请
          </Button>,
        ]}
        width={520}
        destroyOnClose
      >
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <Text type="secondary">可提现金额</Text>
            <Text strong className="text-xl text-blue-600">
              ¥{overview?.balance?.toLocaleString('zh-CN') || '0'}
            </Text>
          </div>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[
              { required: true, message: '请输入提现金额' },
              {
                validator: (_, value) => {
                  if (value && value > (overview?.balance || 0)) {
                    return Promise.reject('提现金额不能超过可提现金额');
                  }
                  if (value && value < 100) {
                    return Promise.reject('最低提现金额为 ¥100');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              type="number"
              placeholder="请输入提现金额"
              addonBefore="¥"
              suffix={
                <Button type="link" className="px-0 h-auto py-0">
                  全部
                </Button>
              }
            />
          </Form.Item>

          <Form.Item
            name="method"
            label="提现方式"
            rules={[{ required: true, message: '请选择提现方式' }]}
          >
            <Select placeholder="请选择提现方式">
              <Option value="bank">银行卡</Option>
              <Option value="alipay">支付宝</Option>
              <Option value="wechat">微信支付</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="bankName"
            label="银行名称"
            rules={[{ required: true, message: '请输入银行名称' }]}
          >
            <Input placeholder="请输入开户银行名称" />
          </Form.Item>

          <Form.Item
            name="accountName"
            label="开户人姓名"
            rules={[{ required: true, message: '请输入开户人姓名' }]}
          >
            <Input placeholder="请输入开户人真实姓名" />
          </Form.Item>

          <Form.Item
            name="accountNumber"
            label="账号"
            rules={[{ required: true, message: '请输入银行账号' }]}
          >
            <Input placeholder="请输入银行卡号或支付宝/微信账号" />
          </Form.Item>

          <Alert
            message="温馨提示"
            description="提现将在 1-3 个工作日内到账，提现手续费为 0.5%，最低 2 元，最高 50 元"
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      <Modal
        title="交易详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        {currentTransaction && (
          <div>
            <Descriptions bordered column={2} className="mb-4">
              <Descriptions.Item label="交易编号">
                <Text code>{currentTransaction.transactionId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="交易类型">
                {TRANSACTION_TYPE[currentTransaction.type]?.text || currentTransaction.type}
              </Descriptions.Item>
              <Descriptions.Item label="金额" span={2}>
                <Text strong className="text-xl" style={{
                  color: currentTransaction.type === 'income' || currentTransaction.type === 'compensation' ? '#52C41A' : '#F5222D'
                }}>
                  {currentTransaction.type === 'income' || currentTransaction.type === 'compensation' ? '+' : '-'}
                  ¥{currentTransaction.amount?.toLocaleString('zh-CN')}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={TRANSACTION_STATUS[currentTransaction.status]?.color}>
                  {TRANSACTION_STATUS[currentTransaction.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="交易时间">
                {dayjs(currentTransaction.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {currentTransaction.task && (
                <>
                  <Descriptions.Item label="相关任务" span={2}>
                    {currentTransaction.task.title}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {currentTransaction.type === 'income' && (
              <>
                <Divider orientation="left">收入明细</Divider>
                <Descriptions column={2}>
                  <Descriptions.Item label="任务金额">
                    ¥{currentTransaction.details?.taskAmount?.toLocaleString('zh-CN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="平台服务费">
                    ¥{currentTransaction.details?.platformFee?.toLocaleString('zh-CN')} ({currentTransaction.details?.feeRate || 5}%)
                  </Descriptions.Item>
                  <Descriptions.Item label="实际到账" span={2}>
                    <Text strong className="text-green-600">
                      ¥{currentTransaction.details?.netAmount?.toLocaleString('zh-CN')}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            {currentTransaction.type === 'withdrawal' && (
              <>
                <Divider orientation="left">提现信息</Divider>
                <Descriptions column={2}>
                  <Descriptions.Item label="提现方式">
                    {currentTransaction.details?.method === 'bank' ? '银行卡' :
                     currentTransaction.details?.method === 'alipay' ? '支付宝' : '微信支付'}
                  </Descriptions.Item>
                  <Descriptions.Item label="到账账号">
                    {currentTransaction.details?.accountNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="手续费">
                    ¥{currentTransaction.details?.fee?.toLocaleString('zh-CN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="预计到账">
                    {dayjs(currentTransaction.createdAt).add(2, 'day').format('YYYY-MM-DD')}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProviderFinance;
