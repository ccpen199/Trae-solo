import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Filter,
  Download,
  FileText,
  Receipt,
  Eye,
  MoreHorizontal,
  Banknote,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Tabs,
  Upload,
  Dropdown,
  message,
  Card,
  Avatar,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import DataCard from '@/components/common/DataCard';
import { formatMoney, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  date: string;
  description: string;
  caseTitle?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  operator: string;
  operatorAvatar: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  title: string;
  type: 'vat_special' | 'vat_normal' | 'normal';
  status: 'issued' | 'pending' | 'cancelled';
  issuedDate: string;
  clientName: string;
}

const mockTransactions: Transaction[] = [
  { id: 't-001', date: '2024-03-20', description: '律师费收入-合同纠纷案', caseTitle: '北京中科创新科技有限公司合同纠纷案', type: 'income', category: '律师费', amount: 280000, status: 'completed', method: '银行转账', operator: '张明', operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming' },
  { id: 't-002', date: '2024-03-18', description: '诉讼费代缴', caseTitle: '某公司财务总监职务侵占案', type: 'expense', category: '诉讼费', amount: 46800, status: 'completed', method: '网银支付', operator: '李助理', operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=assistant' },
  { id: 't-003', date: '2024-03-15', description: '法律顾问年费', caseTitle: '深圳华信金融服务有限公司常年法律顾问', type: 'income', category: '顾问费', amount: 120000, status: 'completed', method: '银行转账', operator: '张明', operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming' },
  { id: 't-004', date: '2024-03-12', description: '律师服务费-劳动争议案', caseTitle: '某员工劳动争议案', type: 'income', category: '律师费', amount: 35000, status: 'pending', method: '微信支付', operator: '王建国', operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangjianguo' },
  { id: 't-005', date: '2024-03-10', description: '办公场地租金', type: 'expense', category: '房租', amount: 85000, status: 'completed', method: '银行转账', operator: '周强', operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouqiang' },
  { id: 't-006', date: '2024-03-08', description: '鉴定费支出', caseTitle: '某建筑工程施工合同纠纷案', type: 'expense', category: '其他费用', amount: 28000, status: 'completed', method: '银行转账', operator: '李助理', operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=assistant' },
  { id: 't-007', date: '2024-03-05', description: '风险代理分成', caseTitle: '上海恒达国际贸易有限公司合同纠纷案', type: 'income', category: '律师费', amount: 560000, status: 'completed', method: '银行转账', operator: '张明', operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming' },
  { id: 't-008', date: '2024-03-02', description: '员工工资支付', type: 'expense', category: '人员工资', amount: 320000, status: 'completed', method: '银行代发', operator: '吴敏', operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wumin' },
  { id: 't-009', date: '2024-02-28', description: '案件代理费-刑事辩护', caseTitle: '某公司高管职务侵占案', type: 'income', category: '律师费', amount: 150000, status: 'failed', method: '支付宝', operator: '李静', operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lijing' },
  { id: 't-010', date: '2024-02-25', description: '差旅报销-上海出差', type: 'expense', category: '差旅费', amount: 8600, status: 'completed', method: '网银支付', operator: '陈晓峰', operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenxiaofeng' },
];

const mockInvoices: Invoice[] = [
  { id: 'inv-001', invoiceNumber: 'INV202403200001', amount: 280000, title: '北京中科创新科技有限公司', type: 'vat_special', status: 'issued', issuedDate: '2024-03-20', clientName: '北京中科创新科技有限公司' },
  { id: 'inv-002', invoiceNumber: 'INV202403150002', amount: 120000, title: '深圳华信金融服务有限公司', type: 'vat_special', status: 'issued', issuedDate: '2024-03-15', clientName: '深圳华信金融服务有限公司' },
  { id: 'inv-003', invoiceNumber: 'INV202403120003', amount: 35000, title: '刘某某', type: 'vat_normal', status: 'pending', issuedDate: '-', clientName: '刘某某' },
  { id: 'inv-004', invoiceNumber: 'INV202403050004', amount: 560000, title: '上海恒达国际贸易有限公司', type: 'vat_special', status: 'issued', issuedDate: '2024-03-05', clientName: '上海恒达国际贸易有限公司' },
  { id: 'inv-005', invoiceNumber: 'INV202402280005', amount: 150000, title: '王某某', type: 'normal', status: 'cancelled', issuedDate: '2024-02-28', clientName: '王某某（家属）' },
];

const incomeCategories = [
  { value: 'all', label: '全部收入' },
  { value: '律师费', label: '律师费' },
  { value: '顾问费', label: '顾问费' },
  { value: '其他收入', label: '其他收入' },
];

const expenseCategories = [
  { value: 'all', label: '全部支出' },
  { value: '诉讼费', label: '诉讼费' },
  { value: '房租', label: '房租' },
  { value: '人员工资', label: '人员工资' },
  { value: '差旅费', label: '差旅费' },
  { value: '其他费用', label: '其他费用' },
];

const statusConfig: Record<Transaction['status'], { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: '已完成', color: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  pending: { label: '处理中', color: 'warning', icon: <Clock className="w-3.5 h-3.5" /> },
  failed: { label: '失败', color: 'error', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const invoiceStatusConfig: Record<Invoice['status'], { label: string; color: string }> = {
  issued: { label: '已开具', color: 'success' },
  pending: { label: '待开具', color: 'warning' },
  cancelled: { label: '已作废', color: 'default' },
};

const invoiceTypeConfig: Record<Invoice['type'], { label: string; color: string }> = {
  vat_special: { label: '增值税专用发票', color: 'blue' },
  vat_normal: { label: '增值税普通发票', color: 'cyan' },
  normal: { label: '普通发票', color: 'default' },
};

const Finance: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [depositForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();

  const totalIncome = mockTransactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = mockTransactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = mockTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const trendOption = {
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`;
        params.forEach((p: any) => {
          result += `${p.marker}${p.seriesName}: ¥${formatMoney(p.value)}<br/>`;
        });
        return result;
      },
    },
    legend: { data: ['收入', '支出'], right: 0, top: 0 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { lineStyle: { color: '#DEE2E6' } },
      axisLabel: { color: '#6B7280' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#F8F9FA' } },
      axisLabel: { color: '#6B7280', formatter: (v: number) => `¥${(v / 10000).toFixed(0)}万` },
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: [850000, 920000, 1145000, 980000, 1200000, 1080000],
        itemStyle: { color: '#0A1628', borderRadius: [4, 4, 0, 0] },
        barWidth: 20,
      },
      {
        name: '支出',
        type: 'bar',
        data: [420000, 480000, 488400, 510000, 550000, 490000],
        itemStyle: { color: '#C9A962', borderRadius: [4, 4, 0, 0] },
        barWidth: 20,
      },
    ],
  };

  const filteredTransactions = mockTransactions.filter(t => {
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      if (!t.description.toLowerCase().includes(kw) &&
          !(t.caseTitle?.toLowerCase().includes(kw))) return false;
    }
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const columns: ColumnsType<Transaction> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => <span className="text-sm text-neutral-ink-700">{formatDate(text)}</span>,
    },
    {
      title: '交易描述',
      dataIndex: 'description',
      key: 'description',
      width: 280,
      render: (text, record) => (
        <div>
          <div className="text-sm font-medium text-neutral-ink-900">{text}</div>
          {record.caseTitle && (
            <div className="text-xs text-neutral-ink-500 mt-0.5 truncate">{record.caseTitle}</div>
          )}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: Transaction['type']) => (
        <Tag color={type === 'income' ? 'green' : 'orange'} className="!m-0">
          <span className="flex items-center gap-1">
            {type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {type === 'income' ? '收入' : '支出'}
          </span>
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text) => <Tag className="!m-0">{text}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (amount, record) => (
        <span className={cn(
          'text-sm font-semibold font-mono',
          record.type === 'income' ? 'text-green-600' : 'text-accent-red'
        )}>
          {record.type === 'income' ? '+' : '-'}¥{formatMoney(amount)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Transaction['status']) => {
        const config = statusConfig[status];
        return (
          <span className={cn(
            'inline-flex items-center gap-1.5 text-sm',
            status === 'completed' ? 'text-green-600' : status === 'pending' ? 'text-yellow-600' : 'text-accent-red'
          )}>
            {config.icon}
            {config.label}
          </span>
        );
      },
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 120,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Avatar size={24} src={record.operatorAvatar} />
          <span className="text-sm text-neutral-ink-700">{text}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: () => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: '查看详情', icon: <Eye className="w-4 h-4" /> },
              { key: 'receipt', label: '下载凭证', icon: <Receipt className="w-4 h-4" /> },
            ],
            onClick: ({ key }) => {
              if (key === 'view') message.info('查看交易详情');
              if (key === 'receipt') message.success('凭证下载已开始');
            },
          }}
          trigger={['click']}
        >
          <button className="p-1.5 hover:bg-neutral-ink-100 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4 text-neutral-ink-500" />
          </button>
        </Dropdown>
      ),
    },
  ];

  const invoiceColumns: ColumnsType<Invoice> = [
    {
      title: '发票号码',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 180,
      render: (text) => <span className="text-sm font-mono text-neutral-ink-700">{text}</span>,
    },
    {
      title: '发票抬头',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      render: (text) => <span className="text-sm text-neutral-ink-900">{text}</span>,
    },
    {
      title: '发票类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: Invoice['type']) => (
        <Tag color={invoiceTypeConfig[type].color} className="!m-0">{invoiceTypeConfig[type].label}</Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (text) => <span className="text-sm font-semibold font-mono text-neutral-ink-900">¥{formatMoney(text)}</span>,
    },
    {
      title: '开具日期',
      dataIndex: 'issuedDate',
      key: 'issuedDate',
      width: 120,
      render: (text) => <span className="text-sm text-neutral-ink-700">{text}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Invoice['status']) => (
        <Tag color={invoiceStatusConfig[status].color} className="!m-0">{invoiceStatusConfig[status].label}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            type="link"
            size="small"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => message.info('查看发票详情')}
          >
            查看
          </Button>
          {record.status !== 'cancelled' && (
            <Button
              type="link"
              size="small"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => message.success('发票下载已开始')}
            >
              下载
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleDeposit = async (values: any) => {
    message.success(`充值 ¥${formatMoney(values.amount)} 已提交`);
    setDepositModalVisible(false);
    depositForm.resetFields();
  };

  const handleWithdraw = async (values: any) => {
    message.success(`提现 ¥${formatMoney(values.amount)} 申请已提交`);
    setWithdrawModalVisible(false);
    withdrawForm.resetFields();
  };

  const categoryOptions = filterType === 'expense' ? expenseCategories : filterType === 'income' ? incomeCategories : [
    ...incomeCategories,
    ...expenseCategories.filter(c => c.value !== 'all'),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900">财务管理</h1>
          <p className="text-neutral-ink-500 mt-1">查看账户余额、收支明细及发票管理</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setDepositModalVisible(true)}
            className="lc-btn-outline flex items-center gap-2"
          >
            <ArrowDownToLine className="w-4 h-4" />
            充值
          </button>
          <button
            onClick={() => setWithdrawModalVisible(true)}
            className="lc-btn-primary flex items-center gap-2"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            提现
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <DataCard
          title="账户余额"
          value={`¥${formatMoney(balance)}`}
          icon={<Wallet className="w-5 h-5" />}
          color="primary"
          trend={{ value: 12.5, isUp: true }}
        />
        <DataCard
          title="本月收入"
          value={`¥${formatMoney(1145000)}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="success"
          trend={{ value: 24.5, isUp: true }}
        />
        <DataCard
          title="本月支出"
          value={`¥${formatMoney(488400)}`}
          icon={<TrendingDown className="w-5 h-5" />}
          color="warning"
          trend={{ value: 1.8, isUp: false }}
        />
        <DataCard
          title="待结算"
          value={`¥${formatMoney(pendingAmount)}`}
          icon={<Clock className="w-5 h-5" />}
          color="gold"
        />
      </div>

      <Card className="lc-card border-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-semibold text-base text-neutral-ink-900">收支趋势</h3>
          <Select
            defaultValue="6m"
            className="w-28"
            options={[
              { value: '1m', label: '近1月' },
              { value: '3m', label: '近3月' },
              { value: '6m', label: '近6月' },
              { value: '1y', label: '近1年' },
            ]}
          />
        </div>
        <ReactECharts option={trendOption} style={{ height: 320 }} />
      </Card>

      <Tabs
        defaultActiveKey="transactions"
        items={[
          {
            key: 'transactions',
            label: <span className="flex items-center gap-2"><Banknote className="w-4 h-4" />交易明细</span>,
            children: (
              <div className="space-y-4">
                <div className="lc-card p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-ink-400" />
                        <Input
                          placeholder="搜索交易描述、关联案件..."
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          className="pl-10"
                          allowClear
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={filterType}
                          onChange={(v) => { setFilterType(v); setFilterCategory('all'); }}
                          className="w-28"
                          placeholder="收支类型"
                          allowClear
                          options={[
                            { value: 'all', label: '全部类型' },
                            { value: 'income', label: '仅收入' },
                            { value: 'expense', label: '仅支出' },
                          ]}
                        />
                        <Select
                          value={filterCategory}
                          onChange={setFilterCategory}
                          className="w-32"
                          placeholder="分类筛选"
                          allowClear
                          options={categoryOptions}
                        />
                        <Select
                          value={filterStatus}
                          onChange={setFilterStatus}
                          className="w-28"
                          placeholder="交易状态"
                          allowClear
                          options={[
                            { value: 'all', label: '全部状态' },
                            { value: 'completed', label: '已完成' },
                            { value: 'pending', label: '处理中' },
                            { value: 'failed', label: '失败' },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button icon={<Filter className="w-4 h-4" />}>高级筛选</Button>
                      <Button icon={<Download className="w-4 h-4" />}>导出报表</Button>
                    </div>
                  </div>
                </div>

                <div className="lc-card">
                  <Table
                    columns={columns}
                    dataSource={filteredTransactions}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    scroll={{ x: 1100 }}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'invoices',
            label: <span className="flex items-center gap-2"><FileText className="w-4 h-4" />发票管理</span>,
            children: (
              <div className="space-y-4">
                <div className="lc-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-ink-400" />
                      <Input placeholder="搜索发票号码、抬头..." className="pl-10" allowClear />
                    </div>
                    <Select className="w-32" placeholder="发票类型" allowClear options={Object.entries(invoiceTypeConfig).map(([k, v]) => ({ value: k, label: v.label }))} />
                    <Select className="w-28" placeholder="状态" allowClear options={Object.entries(invoiceStatusConfig).map(([k, v]) => ({ value: k, label: v.label }))} />
                  </div>
                  <Button type="primary" icon={<Plus className="w-4 h-4" />} className="!bg-primary-900 hover:!bg-primary-700">
                    申请开票
                  </Button>
                </div>

                <div className="lc-card">
                  <Table
                    columns={invoiceColumns}
                    dataSource={mockInvoices}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 张发票`,
                    }}
                    scroll={{ x: 1000 }}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={<span className="font-serif text-lg font-semibold">账户充值</span>}
        open={depositModalVisible}
        onCancel={() => { setDepositModalVisible(false); depositForm.resetFields(); }}
        footer={null}
        width={440}
      >
        <Form form={depositForm} layout="vertical" onFinish={handleDeposit} className="mt-4">
          <Form.Item
            label="充值金额"
            name="amount"
            rules={[{ required: true, message: '请输入充值金额' }]}
          >
            <InputNumber
              className="w-full"
              min={1}
              step={100}
              prefix={<span className="text-neutral-ink-500">¥</span>}
              placeholder="请输入充值金额"
            />
          </Form.Item>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {[500, 1000, 5000, 10000].map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => depositForm.setFieldValue('amount', amount)}
                className="py-2 rounded-lg border border-neutral-ink-200 text-sm font-medium text-neutral-ink-700 hover:border-primary-500 hover:text-primary-500 transition-colors"
              >
                ¥{formatMoney(amount, 0)}
              </button>
            ))}
          </div>

          <Form.Item
            label="支付方式"
            name="method"
            rules={[{ required: true, message: '请选择支付方式' }]}
            initialValue="bank"
          >
            <Select
              options={[
                { value: 'bank', label: <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" />银行卡支付</span> },
                { value: 'wechat', label: <span className="flex items-center gap-2"><Wallet className="w-4 h-4" />微信支付</span> },
                { value: 'alipay', label: <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />支付宝</span> },
              ]}
            />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-ink-100">
            <Button onClick={() => { setDepositModalVisible(false); depositForm.resetFields(); }}>取消</Button>
            <Button type="primary" htmlType="submit" className="!bg-primary-900 hover:!bg-primary-700">确认充值</Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={<span className="font-serif text-lg font-semibold">申请提现</span>}
        open={withdrawModalVisible}
        onCancel={() => { setWithdrawModalVisible(false); withdrawForm.resetFields(); }}
        footer={null}
        width={440}
      >
        <Form form={withdrawForm} layout="vertical" onFinish={handleWithdraw} className="mt-4">
          <div className="p-4 rounded-lg bg-neutral-ink-50 mb-4">
            <div className="text-sm text-neutral-ink-500 mb-1">可提现余额</div>
            <div className="text-2xl font-serif font-bold text-primary-900">¥{formatMoney(balance)}</div>
          </div>

          <Form.Item
            label="提现金额"
            name="amount"
            rules={[{ required: true, message: '请输入提现金额' }]}
          >
            <InputNumber
              className="w-full"
              min={1}
              max={balance}
              step={100}
              prefix={<span className="text-neutral-ink-500">¥</span>}
              placeholder="请输入提现金额"
            />
          </Form.Item>

          <Form.Item
            label="到账账户"
            name="account"
            rules={[{ required: true, message: '请选择到账账户' }]}
          >
            <Select
              options={[
                { value: 'bank-001', label: '招商银行 **** 8888' },
                { value: 'bank-002', label: '工商银行 **** 6666' },
              ]}
              placeholder="选择到账银行账户"
            />
          </Form.Item>

          <Form.Item label="预计到账">
            <div className="text-sm text-neutral-ink-500">T+1 工作日到账（节假日顺延）</div>
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-ink-100">
            <Button onClick={() => { setWithdrawModalVisible(false); withdrawForm.resetFields(); }}>取消</Button>
            <Button type="primary" htmlType="submit" className="!bg-primary-900 hover:!bg-primary-700">确认提现</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Finance;
