import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Statistic,
  Row,
  Col,
  Tabs,
  InputNumber,
  message,
  Spin,
  Empty,
  Descriptions,
  List,
  Radio,
} from 'antd';
import {
  MoneyCollectOutlined,
  PlusOutlined,
  CreditCardOutlined,
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileTextOutlined,
  SafetyOutlined,
  BankOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Payment } from '@/types';
import { paymentApi } from '@/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const typeColors: Record<string, string> = {
  deposit: 'green',
  milestone: 'blue',
  refund: 'orange',
  withdraw: 'red'
};

const typeNames: Record<string, string> = {
  deposit: '充值',
  milestone: '里程碑支付',
  refund: '退款',
  withdraw: '提现'
};

const statusColors: Record<string, string> = {
  pending: 'processing',
  paid: 'success',
  refunded: 'default',
  escrow: 'warning',
  released: 'success'
};

const statusNames: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  refunded: '已退款',
  escrow: '托管中',
  released: '已释放'
};

const Finance: React.FC = () => {
  const [balance, setBalance] = useState({ balance: 0, frozen: 0, totalIncome: 0, totalExpense: 0 });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [rechargeForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<any>({});

  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const result = await paymentApi.getBalance();
      setBalance(result);
    } catch (error) {
      console.error('Fetch balance error:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchPayments = async (page = 1, pageSize = 10, newFilters?: any) => {
    try {
      setLoading(true);
      const params: any = { page, pageSize, ...newFilters };
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      const result = await paymentApi.getMyPayments(params);
      setPayments(result.list || []);
      setPagination({ current: page, pageSize, total: result.total || 0 });
      setFilters({ ...filters, ...newFilters });
    } catch (error) {
      console.error('Fetch payments error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchPayments();
  }, []);

  useEffect(() => {
    fetchPayments(1, pagination.pageSize, filters);
  }, [activeTab]);

  const handleRecharge = async (values: any) => {
    try {
      setSubmitting(true);
      await paymentApi.createDeposit(values.amount);
      message.success('充值申请已提交');
      setRechargeModalVisible(false);
      rechargeForm.resetFields();
      fetchBalance();
      fetchPayments();
    } catch (error) {
      console.error('Recharge error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (values: any) => {
    try {
      setSubmitting(true);
      await paymentApi.requestWithdraw(values.amount, values.account);
      message.success('提现申请已提交');
      setWithdrawModalVisible(false);
      withdrawForm.resetFields();
      fetchBalance();
      fetchPayments();
    } catch (error) {
      console.error('Withdraw error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = (payment: Payment) => {
    setCurrentPayment(payment);
    setDetailModalVisible(true);
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTrendOption = () => {
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['支出', '收入'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月'],
        axisLabel: { color: '#666' }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#666', formatter: '¥{value}' }
      },
      series: [
        {
          name: '支出',
          type: 'bar',
          data: [12000, 18000, 15000, 22000, 18000, 25000],
          itemStyle: { color: '#F5222D' },
          barWidth: '30%'
        },
        {
          name: '收入',
          type: 'bar',
          data: [0, 5000, 0, 8000, 0, 3000],
          itemStyle: { color: '#52C41A' },
          barWidth: '30%'
        }
      ]
    };
  };

  const getTypeDistributionOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 65000, name: '里程碑支付', itemStyle: { color: '#1E40AF' } },
          { value: 30000, name: '充值', itemStyle: { color: '#52C41A' } },
          { value: 8000, name: '退款', itemStyle: { color: '#FA8C16' } },
          { value: 5000, name: '提现', itemStyle: { color: '#F5222D' } }
        ]
      }]
    };
  };

  const columns = [
    {
      title: '流水号',
      dataIndex: 'paymentNo',
      key: 'paymentNo',
      width: 160
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag color={typeColors[type]}>{typeNames[type]}</Tag>,
      filters: [
        { text: '充值', value: 'deposit' },
        { text: '里程碑支付', value: 'milestone' },
        { text: '退款', value: 'refund' },
        { text: '提现', value: 'withdraw' }
      ],
      onFilter: (value: string, record: Payment) => record.type === value
    },
    {
      title: '任务',
      dataIndex: 'taskTitle',
      key: 'taskTitle',
      ellipsis: true
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number, record: Payment) => (
        <span className={`font-bold ${
          record.type === 'deposit' || record.type === 'refund' ? 'text-green-600' : 'text-red-600'
        }`}>
          {record.type === 'deposit' || record.type === 'refund' ? '+' : '-'}{formatCurrency(amount)}
        </span>
      ),
      sorter: (a: Payment, b: Payment) => a.amount - b.amount
    },
    {
      title: '收款方',
      dataIndex: 'payeeName',
      key: 'payeeName',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColors[status]}>{statusNames[status]}</Tag>
    },
    {
      title: '交易时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a: Payment, b: Payment) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: Payment) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      )
    }
  ];

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'deposit', label: '充值' },
    { key: 'milestone', label: '支付' },
    { key: 'refund', label: '退款' },
    { key: 'withdraw', label: '提现' }
  ];

  const paymentMethods = [
    { id: 1, name: '支付宝', type: 'alipay', icon: <CreditCardOutlined />, default: true },
    { id: 2, name: '微信支付', type: 'wechat', icon: <CreditCardOutlined /> },
    { id: 3, name: '银行卡', type: 'bank', icon: <BankOutlined /> }
  ];

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">财务中心</h2>
          <div className="flex gap-3">
            <Button icon={<ArrowDownOutlined />} onClick={() => setRechargeModalVisible(true)}>
              充值
            </Button>
            <Button type="primary" icon={<ArrowUpOutlined />} onClick={() => setWithdrawModalVisible(true)}>
              提现
            </Button>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
              <Statistic
                title={<span className="text-white/80">账户余额</span>}
                value={balance.balance}
                prefix="¥"
                precision={2}
                formatter={(value) => new Intl.NumberFormat('zh-CN').format(value as number)}
                loading={balanceLoading}
                valueStyle={{ color: '#fff' }}
                prefixCls="ant-statistic"
              />
              <WalletOutlined className="absolute right-6 top-6 text-4xl text-white/30" />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title={<span className="text-gray-500">托管金额</span>}
                value={balance.frozen}
                prefix="¥"
                precision={2}
                formatter={(value) => new Intl.NumberFormat('zh-CN').format(value as number)}
                loading={balanceLoading}
                valueStyle={{ color: '#FA8C16' }}
              />
              <SafetyOutlined className="absolute right-6 top-6 text-4xl text-orange-200" />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title={<span className="text-gray-500">累计支出</span>}
                value={balance.totalExpense}
                prefix="¥"
                precision={2}
                formatter={(value) => new Intl.NumberFormat('zh-CN').format(value as number)}
                loading={balanceLoading}
                valueStyle={{ color: '#F5222D' }}
              />
              <ArrowUpOutlined className="absolute right-6 top-6 text-4xl text-red-200" />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title={<span className="text-gray-500">累计收入</span>}
                value={balance.totalIncome}
                prefix="¥"
                precision={2}
                formatter={(value) => new Intl.NumberFormat('zh-CN').format(value as number)}
                loading={balanceLoading}
                valueStyle={{ color: '#52C41A' }}
              />
              <ArrowDownOutlined className="absolute right-6 top-6 text-4xl text-green-200" />
            </Card>
          </Col>
        </Row>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="收支趋势" className="lg:col-span-2">
          <ReactECharts option={getTrendOption()} style={{ height: 300 }} />
        </Card>
        <Card title="支出构成">
          <ReactECharts option={getTypeDistributionOption()} style={{ height: 300 }} />
        </Card>
      </div>

      <Card
        extra={
          <div className="flex items-center gap-3">
            <Select placeholder="全部状态" style={{ width: 120 }} allowClear>
              <Option value="pending">待支付</Option>
              <Option value="paid">已支付</Option>
              <Option value="escrow">托管中</Option>
              <Option value="released">已释放</Option>
              <Option value="refunded">已退款</Option>
            </Select>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  fetchPayments(1, pagination.pageSize, {
                    startDate: dates[0].format('YYYY-MM-DD'),
                    endDate: dates[1].format('YYYY-MM-DD')
                  });
                }
              }}
            />
          </div>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="mb-4"
        />
        <Table
          columns={columns}
          dataSource={payments}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => fetchPayments(page, pageSize, filters)
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="账户充值"
        open={rechargeModalVisible}
        onCancel={() => {
          setRechargeModalVisible(false);
          rechargeForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={rechargeForm}
          layout="vertical"
          onFinish={handleRecharge}
        >
          <Form.Item
            name="amount"
            label="充值金额"
            rules={[{ required: true, message: '请输入充值金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={1000000}
              step={100}
              placeholder="请输入充值金额"
              prefix="¥"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0)}
            />
          </Form.Item>
          <Form.Item
            name="paymentMethod"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Radio.Group className="w-full">
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map(method => (
                  <Radio.Button key={method.id} value={method.type} className="!flex !flex-col !items-center !justify-center !h-20">
                    {method.icon}
                    <span className="mt-1 text-sm">{method.name}</span>
                  </Radio.Button>
                ))}
              </div>
            </Radio.Group>
          </Form.Item>
          <div className="flex flex-wrap gap-2 mb-4">
            {[100, 500, 1000, 2000, 5000, 10000].map(amount => (
              <Button
                key={amount}
                onClick={() => rechargeForm.setFieldsValue({ amount })}
              >
                ¥{amount.toLocaleString()}
              </Button>
            ))}
          </div>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={() => {
              setRechargeModalVisible(false);
              rechargeForm.resetFields();
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              确认充值
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="账户提现"
        open={withdrawModalVisible}
        onCancel={() => {
          setWithdrawModalVisible(false);
          withdrawForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={withdrawForm}
          layout="vertical"
          onFinish={handleWithdraw}
        >
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">可提现金额</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(balance.balance)}</span>
            </div>
          </div>
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[
              { required: true, message: '请输入提现金额' },
              { max: balance.balance, message: '提现金额不能超过可提现余额' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={balance.balance}
              step={100}
              placeholder="请输入提现金额"
              prefix="¥"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0)}
            />
          </Form.Item>
          <Form.Item
            name="account"
            label="收款账户"
            rules={[{ required: true, message: '请选择收款账户' }]}
          >
            <Select placeholder="请选择收款账户">
              <Option value="alipay_123">支付宝 - 138****8888</Option>
              <Option value="wechat_456">微信支付 - 138****8888</Option>
              <Option value="bank_789">工商银行 - ****8888</Option>
            </Select>
          </Form.Item>
          <div className="text-xs text-gray-500 mb-4">
            <p>• 提现申请提交后，预计1-3个工作日到账</p>
            <p>• 单笔提现最低金额 ¥100，最高 ¥50,000</p>
            <p>• 提现手续费为提现金额的 0.5%</p>
          </div>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={() => {
              setWithdrawModalVisible(false);
              withdrawForm.resetFields();
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              确认提现
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="交易详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
        width={600}
      >
        {currentPayment && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="流水号">{currentPayment.paymentNo}</Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color={typeColors[currentPayment.type]}>{typeNames[currentPayment.type]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="金额" span={2}>
                <span className={`text-xl font-bold ${
                  currentPayment.type === 'deposit' || currentPayment.type === 'refund' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentPayment.type === 'deposit' || currentPayment.type === 'refund' ? '+' : '-'}{formatCurrency(currentPayment.amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="任务">{currentPayment.taskTitle}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[currentPayment.status]}>{statusNames[currentPayment.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="付款方">{currentPayment.payerName}</Descriptions.Item>
              <Descriptions.Item label="收款方">{currentPayment.payeeName}</Descriptions.Item>
              <Descriptions.Item label="交易单号">{currentPayment.transactionId || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(currentPayment.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="支付时间">{currentPayment.paidAt ? dayjs(currentPayment.paidAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              {currentPayment.remark && (
                <Descriptions.Item label="备注" span={2}>{currentPayment.remark}</Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Finance;
