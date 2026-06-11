import React, { useEffect, useState, useMemo } from 'react';
import {
  Card, Table, Select, Button, Modal, message, Empty, Checkbox, Form, Input,
  Alert, Descriptions, Steps, Tag, Badge, Divider, Progress,
} from 'antd';
import {
  CreditCardOutlined, EyeOutlined, ExportOutlined, PlusOutlined,
  CalendarOutlined, EnvironmentOutlined, UserOutlined, SearchOutlined,
  SafetyOutlined, CheckCircleOutlined, HistoryOutlined, FileSearchOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '@/services/payment';
import { userApi } from '@/services/user';
import { useUserStore } from '@/store/userStore';
import { formatMoney, formatDateTime, serviceTypeMap, paymentStatusMap } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { Bill, Household } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;

// ============= 演示数据 =============
const DEMO_HOUSEHOLDS: Household[] = [
  { id: 1, userId: 1, householdNo: 'W2024000001', householdName: '张三', serviceType: 'water', address: '四川省成都市锦江区春熙路88号1栋1单元101号', areaCode: '510104', areaName: '锦江区', isDefault: 1, createTime: '2024-01-01', arrearsAmount: 243.8 },
  { id: 2, userId: 1, householdNo: 'E2024000002', householdName: '张三', serviceType: 'electricity', address: '四川省成都市锦江区春熙路88号1栋1单元101号', areaCode: '510104', areaName: '锦江区', isDefault: 0, createTime: '2024-01-05', arrearsAmount: 236.8 },
  { id: 3, userId: 1, householdNo: 'G2024000003', householdName: '张三', serviceType: 'gas', address: '四川省成都市锦江区春熙路88号1栋1单元101号', areaCode: '510104', areaName: '锦江区', isDefault: 0, createTime: '2024-01-10', arrearsAmount: 86.2 },
];

const BILLING_PERIODS = ['2025-01', '2024-12', '2024-11', '2024-10', '2024-09', '2024-08', '2024-07'];

const buildDemoBills = (periods: string[]): Bill[] => {
  const items: Bill[] = [];
  let id = 1;
  periods.forEach((period) => {
    items.push({
      id: id++, billNo: 'B' + period.replace('-', '') + 'W001', householdId: 1, householdNo: 'W2024000001', householdName: '张三',
      serviceType: 'water', billingPeriod: period,
      totalAmount: 128.5, payableAmount: 128.5, paidAmount: id <= 3 ? 0 : 128.5,
      status: id <= 3 ? (id <= 2 ? 2 : 0) : 1,
      billDate: period + '-01',
      dueDate: dayjs(period + '-01').add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
      details: [
        { itemName: '基础水费', quantity: 25, unit: '吨', unitPrice: 3.5, amount: 87.5 },
        { itemName: '污水处理费', quantity: 25, unit: '吨', unitPrice: 0.9, amount: 22.5 },
        { itemName: '水资源费', amount: 18.5 },
      ],
      paymentTime: id > 3 ? period + '-10' : undefined,
    });
    items.push({
      id: id++, billNo: 'B' + period.replace('-', '') + 'E002', householdId: 2, householdNo: 'E2024000002', householdName: '张三',
      serviceType: 'electricity', billingPeriod: period,
      totalAmount: 236.8, payableAmount: 236.8, paidAmount: id <= 3 ? 0 : 236.8,
      status: id <= 3 ? (id <= 2 ? 2 : 0) : 1,
      billDate: period + '-01',
      dueDate: dayjs(period + '-01').add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
      details: [
        { itemName: '基础电费', quantity: 180, unit: '度', unitPrice: 0.82, amount: 147.6 },
        { itemName: '阶梯加价', quantity: 60, unit: '度', unitPrice: 1.2, amount: 72 },
        { itemName: '可再生能源附加', amount: 17.2 },
      ],
      paymentTime: id > 3 ? period + '-10' : undefined,
    });
    items.push({
      id: id++, billNo: 'B' + period.replace('-', '') + 'G003', householdId: 3, householdNo: 'G2024000003', householdName: '张三',
      serviceType: 'gas', billingPeriod: period,
      totalAmount: 86.2, payableAmount: 86.2, paidAmount: id <= 3 ? 0 : 86.2,
      status: id <= 3 ? (id <= 2 ? 2 : 0) : 1,
      billDate: period + '-01',
      dueDate: dayjs(period + '-01').add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
      details: [
        { itemName: '基础气费', quantity: 20, unit: '立方', unitPrice: 2.8, amount: 56 },
        { itemName: '燃气附加费', amount: 30.2 },
      ],
      paymentTime: id > 3 ? period + '-10' : undefined,
    });
  });
  return items;
};

const DEMO_BILLS = buildDemoBills(BILLING_PERIODS);

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { isLogin, householdList, fetchHouseholdList } = useUserStore();

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBillIds, setSelectedBillIds] = useState<number[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [householdFilter, setHouseholdFilter] = useState<number | undefined>(undefined);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payMethod, setPayMethod] = useState('wechat');
  const [payResultVisible, setPayResultVisible] = useState(false);
  const [payResult, setPayResult] = useState<any>(null);

  const [billDetailVisible, setBillDetailVisible] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);

  const [bindModalVisible, setBindModalVisible] = useState(false);
  const [bindForm] = Form.useForm();

  const displayHouseholds = isLogin && householdList.length > 0 ? householdList : DEMO_HOUSEHOLDS;
  const displayMode = !isLogin;

  const filteredBills = useMemo(() => {
    const data = isLogin && bills.length > 0 ? bills : DEMO_BILLS;
    return data.filter((b) => {
      if (householdFilter !== undefined && b.householdId !== householdFilter) return false;
      if (serviceTypeFilter && b.serviceType !== serviceTypeFilter) return false;
      if (periodFilter && b.billingPeriod !== periodFilter) return false;
      if (statusFilter !== '' && String(b.status) !== statusFilter) return false;
      return true;
    });
  }, [bills, householdFilter, serviceTypeFilter, periodFilter, statusFilter, isLogin]);

  useEffect(() => {
    if (isLogin) {
      fetchHouseholdList();
      loadBills();
    }
  }, [isLogin]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const res: any = await paymentApi.getBillList({
        householdId: householdFilter,
        serviceType: serviceTypeFilter || undefined,
        billingPeriod: periodFilter || undefined,
        status: statusFilter !== '' ? Number(statusFilter) : undefined,
        page: 1, pageSize: 100,
      });
      if (res?.list) setBills(res.list);
    } catch {} finally { setLoading(false); }
  };

  const handleReset = () => {
    setHouseholdFilter(undefined);
    setServiceTypeFilter('');
    setPeriodFilter('');
    setStatusFilter('');
  };

  const handleToggleSelect = (billId: number, checked: boolean, bill: Bill) => {
    if (bill.status === 1) return;
    let next: number[];
    if (checked) next = [...selectedBillIds, billId];
    else next = selectedBillIds.filter((id) => id !== billId);
    setSelectedBillIds(next);
    const data = isLogin && bills.length > 0 ? bills : DEMO_BILLS;
    const amt = data.filter((b) => next.includes(b.id)).reduce((s, b) => s + b.payableAmount, 0);
    setTotalAmount(amt);
  };

  const handleSelectAll = (checked: boolean) => {
    const selectable = filteredBills.filter((b) => b.status !== 1);
    if (checked) {
      setSelectedBillIds(selectable.map((b) => b.id));
      setTotalAmount(selectable.reduce((s, b) => s + b.payableAmount, 0));
    } else {
      setSelectedBillIds([]);
      setTotalAmount(0);
    }
  };

  const handleShowBillDetail = (bill: Bill) => {
    setCurrentBill(bill);
    setBillDetailVisible(true);
  };

  const handleConfirmPay = async () => {
    setPayModalVisible(false);
    if (isLogin) {
      try {
        const res: any = await paymentApi.createPayment({ billIds: selectedBillIds, payMethod });
        setPayResult(res);
        setPayResultVisible(true);
        setSelectedBillIds([]);
        setTotalAmount(0);
        loadBills();
      } catch (e: any) {
        message.error(e.message || '支付失败');
      }
    } else {
      const data = isLogin && bills.length > 0 ? bills : DEMO_BILLS;
      const paid = data.filter((b) => selectedBillIds.includes(b.id));
      setPayResult({
        paymentNo: 'DEMO' + dayjs().format('YYYYMMDDHHmmss'),
        totalAmount,
        payMethod,
        payTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        billCount: paid.length,
      });
      setPayResultVisible(true);
      setSelectedBillIds([]);
      setTotalAmount(0);
    }
  };

  const handleSubmitBind = async () => {
    try {
      const values = await bindForm.validateFields();
      if (isLogin) { await userApi.bindHousehold(values); message.success('绑定成功'); fetchHouseholdList(); }
      else message.success('演示绑定成功！登录后将同步您的真实户号');
      setBindModalVisible(false);
      bindForm.resetFields();
    } catch {}
  };

  const handleExport = async () => {
    if (isLogin) {
      try {
        await paymentApi.exportRecords({});
        message.success('Excel导出成功');
      } catch { message.error('导出失败'); }
    } else {
      message.success('演示模式：登录后可全量导出 Excel 账单');
    }
  };

  // ============= 表格列 =============
  const columns = [
    {
      title: '选择', width: 60,
      render: (_: any, record: Bill) => record.status !== 1 ? (
        <Checkbox
          checked={selectedBillIds.includes(record.id)}
          onChange={(e) => handleToggleSelect(record.id, e.target.checked, record)}
        />
      ) : <span className="text-gray-300">-</span>,
    },
    {
      title: '账期', dataIndex: 'billingPeriod', width: 110,
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: '服务类型', dataIndex: 'serviceType', width: 100,
      render: (t: string) => (
        <span className="px-2 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: serviceTypeMap[t]?.color }}>
          {serviceTypeMap[t]?.name}
        </span>
      ),
    },
    {
      title: '户号', dataIndex: 'householdNo', width: 140,
      render: (t: string, r: Bill) => <div><p className="font-mono">{t}</p><p className="text-xs text-gray-500">{r.householdName}</p></div>,
    },
    {
      title: '账单金额', dataIndex: 'payableAmount', width: 120,
      render: (t: number) => <span className="font-bold text-gray-800 tabular-nums">{formatMoney(t)}</span>,
    },
    {
      title: '截止日期', dataIndex: 'dueDate', width: 120,
      render: (t: string, r: Bill) => (
        <div>
          <p>{t}</p>
          {r.status === 2 && <p className="text-xs text-red-500">已逾期</p>}
        </div>
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: number) => <StatusTag type="bill" status={s} />,
    },
    {
      title: '操作', width: 180,
      render: (_: any, record: Bill) => (
        <div className="flex gap-1 flex-wrap">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleShowBillDetail(record)}>查看明细</Button>
          {record.status !== 1 && (
            <Button
              type="link"
              size="small"
              icon={<CreditCardOutlined />}
              onClick={() => handleToggleSelect(record.id, true, record)}
              className="text-primary-500"
            >去缴费</Button>
          )}
        </div>
      ),
    },
  ];

  // 统计数据
  const unpaidSum = filteredBills.filter((b) => b.status === 0 || b.status === 2).reduce((s, b) => s + b.payableAmount, 0);
  const overdueSum = filteredBills.filter((b) => b.status === 2).reduce((s, b) => s + b.payableAmount, 0);
  const paidSum = filteredBills.filter((b) => b.status === 1).reduce((s, b) => s + (b.paidAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 顶部统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md card-hover" styles={{ body: { padding: '20px' } }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 text-xl">
              <CreditCardOutlined />
            </div>
            <div>
              <p className="text-gray-500 text-sm">账单总数</p>
              <p className="text-2xl font-bold text-gray-800 tabular-nums">{filteredBills.length}</p>
            </div>
          </div>
        </Card>
        <Card className="shadow-md card-hover" styles={{ body: { padding: '20px' } }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 text-xl">
              <SafetyOutlined />
            </div>
            <div>
              <p className="text-gray-500 text-sm">待缴金额</p>
              <p className="text-2xl font-bold text-orange-500 tabular-nums">{formatMoney(unpaidSum)}</p>
            </div>
          </div>
        </Card>
        <Card className="shadow-md card-hover" styles={{ body: { padding: '20px' } }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-500 text-xl">
              <SafetyOutlined />
            </div>
            <div>
              <p className="text-gray-500 text-sm">逾期金额</p>
              <p className="text-2xl font-bold text-red-500 tabular-nums">{formatMoney(overdueSum)}</p>
            </div>
          </div>
        </Card>
        <Card className="shadow-md card-hover" styles={{ body: { padding: '20px' } }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-500 text-xl">
              <CheckCircleOutlined />
            </div>
            <div>
              <p className="text-gray-500 text-sm">已缴金额</p>
              <p className="text-2xl font-bold text-emerald-500 tabular-nums">{formatMoney(paidSum)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 快捷业务步骤 */}
      <Card className="shadow-md" styles={{ body: { padding: '16px 20px' } }}>
        <Steps
          size="small"
          current={1}
          items={[
            { title: '1. 户号绑定', description: (
              <a className="text-primary-500 cursor-pointer" onClick={() => setBindModalVisible(true)}>去绑定</a>
            )},
            { title: '2. 账期筛选', description: (
              <span className="text-primary-500">账期：{periodFilter || '全部'}</span>
            )},
            { title: '3. 核对明细', description: (
              <span className="text-gray-500">点击「查看明细」</span>
            )},
            { title: '4. 批量缴费', description: (
              <span className="text-gray-500">合计 {formatMoney(totalAmount)}</span>
            )},
            { title: '5. 获取凭证', description: (
              <a className="text-primary-500 cursor-pointer" onClick={() => navigate('/payment/voucher')}>电子凭证</a>
            )},
          ]}
        />
      </Card>

      {/* 筛选 */}
      <Card className="shadow-md card-hover">
        {displayMode && (
          <Alert type="info" showIcon className="mb-4"
            message="演示模式"
            description="当前展示模拟账单数据，登录后将加载您的真实户号与账单信息"
            action={<Button size="small" type="primary" onClick={() => navigate('/login')}>立即登录</Button>}
          />
        )}
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500"><CalendarOutlined /> 账期</span>
            <Select value={periodFilter || undefined} onChange={(v) => setPeriodFilter(v || '')} style={{ width: 140 }} allowClear placeholder="全部">
              {BILLING_PERIODS.map((p) => <Option key={p} value={p}>{p}</Option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500"><EnvironmentOutlined /> 户号</span>
            <Select value={householdFilter} onChange={(v) => setHouseholdFilter(v)} style={{ width: 220 }} allowClear placeholder="全部户号">
              {displayHouseholds.map((h) => (
                <Option key={h.id} value={h.id}>
                  {h.householdNo} · {h.householdName} [{serviceTypeMap[h.serviceType]?.name}]
                </Option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">服务类型</span>
            <Select value={serviceTypeFilter || undefined} onChange={(v) => setServiceTypeFilter(v || '')} style={{ width: 120 }} allowClear placeholder="全部">
              <Option value="water">水费</Option>
              <Option value="electricity">电费</Option>
              <Option value="gas">燃气费</Option>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">账单状态</span>
            <Select value={statusFilter || undefined} onChange={(v) => setStatusFilter(v || '')} style={{ width: 120 }} allowClear placeholder="全部">
              <Option value="0">待缴费</Option>
              <Option value="2">已逾期</Option>
              <Option value="1">已缴费</Option>
              <Option value="3">已作废</Option>
            </Select>
          </div>
          <div className="flex flex-1 justify-end gap-2">
            <Button onClick={handleReset}><SearchOutlined /> 重置</Button>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadBills}>查询</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center mb-4 p-3 bg-gray-50 rounded-xl">
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setBindModalVisible(true)}>
            绑定新户号
          </Button>
          <span className="mx-2 text-gray-300">|</span>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => navigate('/payment/records')}>
            缴费记录
          </Button>
          <Button type="link" size="small" icon={<FileSearchOutlined />} onClick={() => navigate('/payment/voucher')}>
            电子凭证
          </Button>
          <Button type="link" size="small" icon={<ExportOutlined />} onClick={handleExport}>
            全量导出Excel
          </Button>
          <Button type="link" size="small" icon={<ArrowRightOutlined />} onClick={() => navigate('/admin/login')}>
            监管对账
          </Button>
        </div>

        {filteredBills.length > 0 ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={selectedBillIds.length === filteredBills.filter((b) => b.status !== 1).length && filteredBills.filter((b) => b.status !== 1).length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                disabled={filteredBills.filter((b) => b.status !== 1).length === 0}
              >
                全选待缴费账单
              </Checkbox>
              <Tag color="orange">待缴 {filteredBills.filter((b) => b.status !== 1).length} 笔</Tag>
              <Tag color="green">已缴 {filteredBills.filter((b) => b.status === 1).length} 笔</Tag>
              {overdueSum > 0 && <Tag color="red">逾期 {formatMoney(overdueSum)}</Tag>}
            </div>
            <Table
              rowKey="id"
              columns={columns as any}
              dataSource={filteredBills}
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条账单` }}
              scroll={{ x: 900 }}
            />
          </>
        ) : (
          <Empty description="当前筛选条件下暂无账单" className="py-12" />
        )}

        {selectedBillIds.length > 0 && (
          <div className="mt-4 p-4 bg-primary-50 rounded-xl flex items-center justify-between flex-wrap gap-3 border-2 border-primary-200">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge count={selectedBillIds.length} style={{ backgroundColor: '#165DFF' }} className="!top-0 !right-0">
                <div className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-sm">已选择账单</div>
              </Badge>
              <div>
                <span className="text-gray-600 text-sm">合计金额</span>
                <span className="text-3xl font-bold text-primary-600 ml-3 tabular-nums">{formatMoney(totalAmount)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="large" onClick={() => setSelectedBillIds([])}>清空选择</Button>
              <Button type="primary" size="large" icon={<CreditCardOutlined />} className="h-11 px-8" onClick={() => setPayModalVisible(true)}>
                去支付
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 页脚快捷操作 */}
      <Card className="shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button block size="large" onClick={() => navigate('/payment/records')}>
            <HistoryOutlined /> 查看缴费记录
          </Button>
          <Button block size="large" onClick={() => navigate('/payment/voucher')}>
            <FileSearchOutlined /> 下载电子凭证
          </Button>
          <Button block size="large" onClick={handleExport}>
            <ExportOutlined /> 全量导出 Excel
          </Button>
          <Button block size="large" onClick={() => navigate('/admin/login')} type="default">
            <CreditCardOutlined /> 缴费对账后台
          </Button>
        </div>
      </Card>

      {/* 绑定户号弹窗 */}
      <Modal title="绑定户号" open={bindModalVisible} onCancel={() => setBindModalVisible(false)}
        footer={[<Button key="c" onClick={() => setBindModalVisible(false)}>取消</Button>,
          <Button key="s" type="primary" onClick={handleSubmitBind}>确认绑定</Button>]} width={500}>
        <Form form={bindForm} layout="vertical" className="mt-4">
          <Alert message={displayMode ? "演示模式：登录后可绑定真实户号" : "绑定后可查询及缴纳该户号账单"} type="info" showIcon className="mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="serviceType" label="服务类型" rules={[{ required: true, message: '请选择' }]}>
              <Select placeholder="请选择"><Option value="water">水费</Option><Option value="electricity">电费</Option><Option value="gas">燃气费</Option></Select>
            </Form.Item>
            <Form.Item name="householdNo" label="户号" rules={[{ required: true, message: '请输入户号' }]}>
              <Input placeholder="请输入户号" />
            </Form.Item>
            <Form.Item name="householdName" label="户名" rules={[{ required: true, message: '请输入户名' }]}>
              <Input placeholder="请输入户名" />
            </Form.Item>
            <Form.Item name="areaCode" label="所属区域" rules={[{ required: true, message: '请选择区域' }]}>
              <Select placeholder="请选择">
                <Option value="510104">锦江区</Option><Option value="510105">青羊区</Option>
                <Option value="510106">金牛区</Option><Option value="510107">武侯区</Option>
                <Option value="510108">成华区</Option><Option value="510109">高新区</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="address" label="详细地址" rules={[{ required: true, message: '请输入详细地址' }]}>
            <Input placeholder="请输入详细地址" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 账单明细弹窗 */}
      <Modal title="账单明细" open={billDetailVisible} onCancel={() => setBillDetailVisible(false)} width={580}
        footer={[
          <Button key="c" onClick={() => setBillDetailVisible(false)}>关闭</Button>,
          currentBill && currentBill.status !== 1 && (
            <Button key="p" type="primary" onClick={() => {
              setBillDetailVisible(false);
              handleToggleSelect(currentBill.id, true, currentBill);
              setPayModalVisible(true);
            }}>立即缴费</Button>
          ),
        ]}>
        {currentBill && (
          <div className="space-y-4">
            <Descriptions column={2} size="small" className="bg-gray-50 p-3 rounded-xl">
              <Descriptions.Item label="账单号">{currentBill.billNo}</Descriptions.Item>
              <Descriptions.Item label="状态"><StatusTag type="bill" status={currentBill.status} /></Descriptions.Item>
              <Descriptions.Item label="户号">{currentBill.householdNo}</Descriptions.Item>
              <Descriptions.Item label="户名">{currentBill.householdName}</Descriptions.Item>
              <Descriptions.Item label="账期"><Tag color="blue">{currentBill.billingPeriod}</Tag></Descriptions.Item>
              <Descriptions.Item label="服务类型" style={{ color: serviceTypeMap[currentBill.serviceType]?.color }}>
                {serviceTypeMap[currentBill.serviceType]?.name}
              </Descriptions.Item>
              <Descriptions.Item label="出账日">{currentBill.billDate}</Descriptions.Item>
              <Descriptions.Item label="截止日" className={currentBill.status === 2 ? 'text-red-500' : ''}>
                {currentBill.dueDate}{currentBill.status === 2 ? '（已逾期）' : ''}
              </Descriptions.Item>
            </Descriptions>
            <div>
              <p className="font-medium mb-2">费用明细</p>
              <table className="w-full text-sm border rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">项目</th>
                    <th className="p-2 text-right">数量</th>
                    <th className="p-2 text-right">单价</th>
                    <th className="p-2 text-right">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBill.details?.map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{d.itemName}</td>
                      <td className="p-2 text-right">{d.quantity ? `${d.quantity}${d.unit || ''}` : '-'}</td>
                      <td className="p-2 text-right">{d.unitPrice ? `¥${d.unitPrice}` : '-'}</td>
                      <td className="p-2 text-right font-medium tabular-nums">¥{d.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-primary-100 bg-primary-50">
                    <td colSpan={3} className="p-2 font-bold">应付金额</td>
                    <td className="p-2 text-right font-bold text-lg text-primary-600 tabular-nums">{formatMoney(currentBill.payableAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {currentBill.status === 1 && (
              <Alert type="success" showIcon message="已缴费" description={`缴纳时间：${(currentBill as any).paymentTime || currentBill.billDate}，金额 ${formatMoney(currentBill.paidAmount || currentBill.totalAmount)}`} />
            )}
            {currentBill.status === 2 && (
              <Alert type="error" showIcon message="账单逾期" description="请尽快缴纳，逾期将产生违约金并影响信用记录" />
            )}
          </div>
        )}
      </Modal>

      {/* 支付确认弹窗 */}
      <Modal title="确认支付" open={payModalVisible} onCancel={() => setPayModalVisible(false)}
        onOk={handleConfirmPay} okText={displayMode ? '演示支付' : '确认支付'}
        okButtonProps={{ size: 'large' }} width={520} destroyOnHidden>
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl text-center">
            <p className="text-sm text-gray-500 mb-2">待支付金额</p>
            <p className="text-4xl font-bold text-primary-600 tabular-nums">{formatMoney(totalAmount)}</p>
            <p className="text-xs text-gray-500 mt-2">共 {selectedBillIds.length} 项账单</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-3">选择支付方式</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'wechat', label: '微信支付', icon: '微', color: '#07C160' },
                { key: 'alipay', label: '支付宝', icon: '支', color: '#1677FF' },
                { key: 'bank', label: '银行卡', icon: '银', color: '#F5222D' },
              ].map((method) => (
                <div key={method.key}
                  className={`p-4 rounded-lg text-center cursor-pointer transition-all ${
                    payMethod === method.key ? 'border-2 border-primary-500 bg-primary-50 shadow-md' : 'border border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setPayMethod(method.key)}>
                  <div className="text-2xl mb-1" style={{ color: method.color }}>{method.icon}</div>
                  <span className="text-sm font-medium">{method.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Progress percent={Math.min(100, selectedBillIds.length * 15)} showInfo={false} status="active" size="small" />
          {displayMode && (
            <Alert type="info" showIcon message="演示模式说明" description="登录后将对接真实支付接口并同步数据至监管平台" />
          )}
        </div>
      </Modal>

      {/* 支付结果 */}
      <Modal open={payResultVisible} onCancel={() => setPayResultVisible(false)} footer={null} width={560} destroyOnHidden>
        <div className="text-center py-4">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircleOutlined className="text-5xl text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">缴费完成</h2>
          <p className="text-gray-500 mb-4">
            {displayMode ? '演示缴费已完成，' : '恭喜您，'}成功缴费
            <span className="text-3xl font-bold text-primary-600 tabular-nums mx-2">{formatMoney(payResult?.totalAmount)}</span>
          </p>
          <Steps
            direction="vertical"
            size="small"
            current={4}
            className="text-left max-w-md mx-auto mb-6"
            items={[
              { title: '户号校验通过', status: 'finish' },
              { title: `账单核对完成（${selectedBillIds.length || payResult?.billCount || 0} 项）`, status: 'finish' },
              { title: `${payMethod === 'wechat' ? '微信' : payMethod === 'alipay' ? '支付宝' : '银行卡'} 支付成功 · 单号 ${payResult?.paymentNo}`, status: 'finish' },
              { title: '电子凭证已生成', status: 'finish' },
              {
                title: displayMode ? '待接入监管平台（需登录）' : '四川省能源监管平台数据同步完成',
                description: displayMode ? '' : '同步单号 SYNC' + payResult?.paymentNo,
                status: displayMode ? 'process' : 'finish',
              },
            ]}
          />
          <Divider />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <Button block onClick={() => { setPayResultVisible(false); navigate('/payment/records'); }}>
              <HistoryOutlined /> 缴费记录
            </Button>
            <Button block onClick={() => { setPayResultVisible(false); navigate('/payment/voucher'); }}>
              <FileSearchOutlined /> 电子凭证
            </Button>
            <Button block onClick={handleExport}>
              <ExportOutlined /> 导出Excel
            </Button>
            <Button type="primary" block onClick={() => setPayResultVisible(false)}>完成</Button>
          </div>
          {displayMode && (
            <Alert type="info" showIcon message="登录账号后，缴费记录、电子凭证、对账数据将自动同步"
              action={<Button size="small" type="primary" onClick={() => { setPayResultVisible(false); navigate('/login'); }}>立即登录</Button>}
              className="text-left" />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Payment;
