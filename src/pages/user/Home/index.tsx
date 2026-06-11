import React, { useEffect, useState, useMemo } from 'react';
import {
  Card, Carousel, Button, Tabs, Badge, Statistic, Empty, Tag, Modal, Checkbox,
  Select, DatePicker, Form, Input, Alert, Divider, Table, Descriptions, Progress, Steps, message,
} from 'antd';
import {
  CreditCardOutlined, FileTextOutlined, FileSearchOutlined, EnvironmentOutlined,
  CustomerServiceOutlined, PlusOutlined, ArrowRightOutlined, BellOutlined,
  DashboardOutlined, SafetyOutlined, ExclamationCircleOutlined, CheckCircleOutlined,
  SearchOutlined, HistoryOutlined, CalendarOutlined, SendOutlined, DatabaseOutlined,
  DownloadOutlined, AuditOutlined, TeamOutlined, FileExcelOutlined, UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { paymentApi } from '@/services/payment';
import { announcementApi } from '@/services/announcement';
import { userApi } from '@/services/user';
import { formatMoney, serviceTypeMap } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { Household, Bill, Announcement } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

// ============= 演示数据 =============
const DEMO_HOUSEHOLDS: Household[] = [
  { id: 1, userId: 1, householdNo: 'W2024000001', householdName: '张三', serviceType: 'water', address: '四川省成都市锦江区春熙路88号1栋1单元101号', areaCode: '510104', areaName: '锦江区', isDefault: 1, createTime: '2024-01-01', arrearsAmount: 243.8 },
  { id: 2, userId: 1, householdNo: 'E2024000002', householdName: '张三', serviceType: 'electricity', address: '四川省成都市锦江区春熙路88号1栋1单元101号', areaCode: '510104', areaName: '锦江区', isDefault: 0, createTime: '2024-01-05', arrearsAmount: 236.8 },
  { id: 3, userId: 1, householdNo: 'G2024000003', householdName: '张三', serviceType: 'gas', address: '四川省成都市锦江区春熙路88号1栋1单元101号', areaCode: '510104', areaName: '锦江区', isDefault: 0, createTime: '2024-01-10', arrearsAmount: 86.2 },
];

const buildDemoBills = (periods: string[]): Bill[] => {
  const items: Bill[] = [];
  let id = 1;
  periods.forEach((period) => {
    items.push({
      id: id++, billNo: 'B' + period.replace('-', '') + 'W001', householdId: 1, householdNo: 'W2024000001', householdName: '张三',
      serviceType: 'water', billingPeriod: period,
      totalAmount: 128.5 + Math.round(Math.random() * 50), payableAmount: 128.5 + Math.round(Math.random() * 50), paidAmount: 0,
      status: id <= 3 ? 2 : id <= 5 ? 0 : 1,
      billDate: period + '-01', dueDate: dayjs(period + '-01').add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
      details: [
        { itemName: '基础水费', quantity: 25, unit: '吨', unitPrice: 3.5, amount: 87.5 },
        { itemName: '污水处理费', quantity: 25, unit: '吨', unitPrice: 0.9, amount: 22.5 },
        { itemName: '水资源费', amount: 18.5 },
      ],
    });
    items.push({
      id: id++, billNo: 'B' + period.replace('-', '') + 'E002', householdId: 2, householdNo: 'E2024000002', householdName: '张三',
      serviceType: 'electricity', billingPeriod: period,
      totalAmount: 236.8, payableAmount: 236.8, paidAmount: 0, status: id <= 3 ? 2 : id <= 5 ? 0 : 1,
      billDate: period + '-01', dueDate: dayjs(period + '-01').add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
      details: [
        { itemName: '基础电费', quantity: 180, unit: '度', unitPrice: 0.82, amount: 147.6 },
        { itemName: '阶梯加价', quantity: 60, unit: '度', unitPrice: 1.2, amount: 72 },
        { itemName: '可再生能源附加', amount: 17.2 },
      ],
    });
    items.push({
      id: id++, billNo: 'B' + period.replace('-', '') + 'G003', householdId: 3, householdNo: 'G2024000003', householdName: '张三',
      serviceType: 'gas', billingPeriod: period,
      totalAmount: 86.2, payableAmount: 86.2, paidAmount: 0, status: id <= 3 ? 2 : id <= 5 ? 0 : 1,
      billDate: period + '-01', dueDate: dayjs(period + '-01').add(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
      details: [
        { itemName: '基础气费', quantity: 20, unit: '立方', unitPrice: 2.8, amount: 56 },
        { itemName: '燃气附加费', amount: 30.2 },
      ],
    });
  });
  return items;
};

const BILLING_PERIODS = ['2025-01', '2024-12', '2024-11', '2024-10', '2024-09', '2024-08'];

// ============= 页面组件 =============
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLogin, householdList, currentHousehold, fetchHouseholdList, user } = useUserStore();

  // 账单核心状态
  const [unpaidBills, setUnpaidBills] = useState<Bill[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedBills, setSelectedBills] = useState<number[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [expandedBillIds, setExpandedBillIds] = useState<number[]>([]);

  // 过滤器
  const [activeServiceType, setActiveServiceType] = useState('water');
  const [activePeriod, setActivePeriod] = useState<string>('2024-12');
  const [activeHousehold, setActiveHousehold] = useState<number | undefined>(undefined);

  // 业务弹窗
  const [payResultModalVisible, setPayResultModalVisible] = useState(false);
  const [payResultData, setPayResultData] = useState<any>(null);
  const [bindModalVisible, setBindModalVisible] = useState(false);
  const [bindForm] = Form.useForm();
  const [payMethod, setPayMethod] = useState('wechat');

  const DEMO_BILLS = useMemo(() => buildDemoBills(BILLING_PERIODS), []);

  // 演示 or 真实
  const displayBills = isLogin ? unpaidBills.length > 0 ? unpaidBills : DEMO_BILLS : DEMO_BILLS;
  const displayHouseholds = isLogin && householdList.length > 0 ? householdList : DEMO_HOUSEHOLDS;
  const filteredBills = displayBills.filter((b) =>
    b.serviceType === activeServiceType &&
    b.billingPeriod === activePeriod &&
    (activeHousehold === undefined || b.householdId === activeHousehold)
  );
  const unpaidFiltered = filteredBills.filter((b) => b.status === 0 || b.status === 2);
  const displayMode = !isLogin;

  // ========== 数据加载 ==========
  useEffect(() => {
    if (isLogin) {
      fetchHouseholdList();
      loadData();
    }
    loadAnnouncements();
  }, [isLogin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bills: any = await paymentApi.getUnpaidBills();
      if (bills && bills.length) setUnpaidBills(bills);
    } finally { setLoading(false); }
  };

  const loadAnnouncements = async () => {
    try {
      const list: any = await announcementApi.getLatestAnnouncements(5);
      setAnnouncements(list || []);
    } catch {}
  };

  // ========== 选择逻辑 ==========
  const toggleExpand = (billId: number) => {
    setExpandedBillIds((prev) =>
      prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId]
    );
  };

  const handleBillSelection = (billId: number, checked: boolean) => {
    let newSelected: number[];
    if (checked) newSelected = [...selectedBills, billId];
    else newSelected = selectedBills.filter((id) => id !== billId);
    setSelectedBills(newSelected);
    const amount = displayBills.filter((b) => newSelected.includes(b.id)).reduce((sum, b) => sum + b.payableAmount, 0);
    setTotalAmount(amount);
  };

  const handlePayNow = () => {
    if (unpaidFiltered.length > 0) {
      const ids = unpaidFiltered.map((b) => b.id);
      setSelectedBills(ids);
      const amount = unpaidFiltered.reduce((sum, b) => sum + b.payableAmount, 0);
      setTotalAmount(amount);
      setPayModalVisible(true);
    }
  };

  // ========== 确认支付（结果页+后续跳转） ==========
  const handleConfirmPay = async () => {
    setPayModalVisible(false);
    if (isLogin) {
      try {
        const res: any = await paymentApi.createPayment({ billIds: selectedBills, payMethod });
        setPayResultData(res);
        setPayResultModalVisible(true);
      } catch (e: any) {
        message.error(e.message || '支付失败');
      }
    } else {
      // 演示模式，构造结果
      const paidBills = displayBills.filter((b) => selectedBills.includes(b.id));
      setPayResultData({
        paymentNo: 'DEMO' + dayjs().format('YYYYMMDDHHmmss'),
        totalAmount,
        payMethod,
        payTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        householdNos: paidBills.map((b) => b.householdNo),
      });
      setPayResultModalVisible(true);
    }
  };

  // ========== 户号绑定 ==========
  const handleSubmitBind = async () => {
    try {
      const values = await bindForm.validateFields();
      if (isLogin) {
        await userApi.bindHousehold(values);
        message.success('绑定成功');
      } else {
        message.success('演示绑定成功！登录后将同步您的真实户号');
      }
      setBindModalVisible(false);
      bindForm.resetFields();
    } catch {}
  };

  // ========== 户号展示 =============
  const HouseholdCardList = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {displayHouseholds.map((h) => (
        <div
          key={h.id}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
            (isLogin ? currentHousehold?.id === h.id : h.isDefault === 1)
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-100 hover:border-primary-200 bg-white'
          }`}
          onClick={() => navigate('/household')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: serviceTypeMap[h.serviceType]?.color }}>
              {serviceTypeMap[h.serviceType]?.name}
            </span>
            <div className="flex gap-1">
              {h.isDefault === 1 && <Tag color="blue">默认</Tag>}
              {h.arrearsAmount && h.arrearsAmount > 0 && <Tag color="orange">欠费</Tag>}
            </div>
          </div>
          <p className="font-medium text-gray-800">{h.householdNo}</p>
          <p className="text-sm text-gray-500 mt-1">{h.householdName}</p>
          <p className="text-xs text-gray-400 mt-1 truncate">{h.address}</p>
          {h.arrearsAmount && h.arrearsAmount > 0 && (
            <p className="text-sm text-warning-500 mt-2 font-medium">欠费：{formatMoney(h.arrearsAmount)}</p>
          )}
        </div>
      ))}
      <div
        className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]"
        onClick={() => setBindModalVisible(true)}
      >
        <PlusOutlined className="text-3xl text-gray-400" />
        <p className="text-sm text-gray-500">绑定户号</p>
      </div>
    </div>
  );

  // ========== 账单卡片（内联展开明细） =============
  const BillCardList = () => (
    <div className="space-y-3">
      {filteredBills.length > 0 ? (
        filteredBills.map((bill) => {
          const isExpanded = expandedBillIds.includes(bill.id);
          const isSelectable = bill.status === 0 || bill.status === 2;
          return (
            <div key={bill.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => toggleExpand(bill.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isSelectable && (
                    <Checkbox
                      checked={selectedBills.includes(bill.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleBillSelection(bill.id, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{bill.householdNo} · {bill.householdName}</p>
                      <Tag color="blue">{bill.billingPeriod}</Tag>
                      {bill.status === 2 && <Tag color="red">已逾期</Tag>}
                      {isExpanded && <ArrowRightOutlined rotate={90} className="text-gray-400" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      账单日期 {bill.billDate} · 截止 {bill.dueDate}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xl font-bold tabular-nums" style={{ color: bill.status === 2 ? '#FF7D00' : '#F53F3F' }}>
                    {formatMoney(bill.payableAmount)}
                  </p>
                  <StatusTag type="bill" status={bill.status} />
                </div>
              </div>
              {isExpanded && (
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">费用明细</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2 text-gray-600">项目</th>
                            <th className="text-right p-2 text-gray-600">数量</th>
                            <th className="text-right p-2 text-gray-600">单价</th>
                            <th className="text-right p-2 text-gray-600">金额</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bill.details?.map((d, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{d.itemName}</td>
                              <td className="p-2 text-right">{d.quantity ? `${d.quantity}${d.unit || ''}` : '-'}</td>
                              <td className="p-2 text-right">{d.unitPrice ? `¥${d.unitPrice}` : '-'}</td>
                              <td className="p-2 text-right font-medium tabular-nums">¥{d.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-primary-100 bg-primary-50">
                            <td colSpan={3} className="p-2 font-medium">应付金额</td>
                            <td className="p-2 text-right text-primary-600 font-bold text-lg tabular-nums">{formatMoney(bill.payableAmount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="small" onClick={() => toggleExpand(bill.id)}>收起</Button>
                    {isSelectable && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                          if (!selectedBills.includes(bill.id)) handleBillSelection(bill.id, true);
                          setPayModalVisible(true);
                        }}
                      >立即缴费</Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <Empty description={`${activePeriod} 账期暂无${serviceTypeMap[activeServiceType]?.name}待缴费用`} className="py-8" />
      )}
    </div>
  );

  // ========== 监管同步数据（模拟） ==========
  const RegulatoryCard = () => (
    <Card
      className="shadow-md card-hover cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate('/admin/login')}
      styles={{ body: { padding: 0 } }}
    >
      <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3 mb-3">
          <DatabaseOutlined className="text-2xl" />
          <div className="flex-1">
            <p className="font-bold">四川省能源监管平台</p>
            <p className="text-xs text-white/80">实时同步中 · 数据已加密传输</p>
          </div>
          <Progress type="dashboard" percent={98} size={42} strokeColor="white" trailColor="rgba(255,255,255,0.2)" />
        </div>
      </div>
      <div className="p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between"><span className="text-gray-500">同步状态</span>
          <Tag color="green"><CheckCircleOutlined /> 已同步</Tag></div>
        <div className="flex items-center justify-between"><span className="text-gray-500">最近同步</span>
          <span className="text-gray-700 font-medium">今天 09:15:32</span></div>
        <div className="flex items-center justify-between"><span className="text-gray-500">今日推送数据</span>
          <span className="text-gray-700 font-medium tabular-nums">缴费 1,284 条 · 工单 37 条</span></div>
      </div>
    </Card>
  );

  // ========== 工单 & 对账快捷入口卡 ==========
  const AdminQuickCard = () => (
    <Card
      className="shadow-md card-hover cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate('/admin/login')}
      styles={{ body: { padding: 0 } }}
    >
      <div className="p-4 bg-gradient-to-br from-slate-800 to-gray-900 text-white rounded-t-lg">
        <div className="flex items-center gap-3 mb-3">
          <DashboardOutlined className="text-2xl" />
          <div className="flex-1">
            <p className="font-bold">运营管理工作台</p>
            <p className="text-xs text-gray-400">工单分派 · 公告审核 · 对账报表</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white/5 rounded p-2"><p className="text-lg font-bold text-orange-400 tabular-nums">12</p><p className="text-gray-400">待处理工单</p></div>
          <div className="bg-white/5 rounded p-2"><p className="text-lg font-bold text-blue-400 tabular-nums">5</p><p className="text-gray-400">公告待审核</p></div>
          <div className="bg-white/5 rounded p-2"><p className="text-lg font-bold text-emerald-400 tabular-nums">2</p><p className="text-gray-400">对账异常</p></div>
        </div>
      </div>
      <div className="divide-y">
        {[
          { icon: <SendOutlined />, label: '工单分派', desc: '派发 · 跟进 · 复查记录', color: 'text-orange-500', path: '/admin/work-orders' },
          { icon: <AuditOutlined />, label: '公告审核', desc: '审核 · 推送 · 发布管理', color: 'text-blue-500', path: '/admin/announcements' },
          { icon: <FileExcelOutlined />, label: '缴费对账', desc: '报表 · 核对 · 监管上报', color: 'text-emerald-500', path: '/admin/payment/reconciliation' },
          { icon: <SafetyOutlined />, label: '监管同步', desc: '接口配置 · 数据上报', color: 'text-purple-500', path: '/admin/system/regulatory' },
          { icon: <TeamOutlined />, label: '角色权限', desc: '多级权限 · 审计日志', color: 'text-sky-500', path: '/admin/system/roles' },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
            onClick={(e) => { e.stopPropagation(); navigate('/admin/login'); }}
          >
            <div className={`${item.color} text-lg`}>{item.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500 truncate">{item.desc}</p>
            </div>
            <ArrowRightOutlined className="text-gray-400 text-sm" />
          </div>
        ))}
      </div>
    </Card>
  );

  // ========== 服务网点迷你卡 ==========
  const OutletMiniCard = () => {
    const outlets = [
      { id: 1, name: '锦华店', district: '锦江区', waiting: 3, status: '畅通', color: '#00B8D9' },
      { id: 2, name: '武侯店', district: '武侯区', waiting: 8, status: '适中', color: '#FF8800' },
      { id: 3, name: '高新店', district: '高新区', waiting: 18, status: '繁忙', color: '#F53F3F' },
      { id: 4, name: '青羊店', district: '青羊区', waiting: 2, status: '畅通', color: '#00B42A' },
      { id: 5, name: '成华店', district: '成华区', waiting: 6, status: '适中', color: '#FF8800' },
    ];
    return (
      <Card
        className="shadow-md card-hover cursor-pointer"
        onClick={() => navigate('/service-map')}
        styles={{ body: { padding: 0 } }}
        title={
          <div className="flex items-center gap-2">
            <EnvironmentOutlined className="text-primary-500" />
            <span className="font-medium">服务网点排队状态</span>
          </div>
        }
        extra={<Button type="link" size="small">地图 <ArrowRightOutlined /></Button>}
      >
        <div className="divide-y">
          {outlets.map((o) => (
            <div key={o.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: o.color }}
              >{o.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800">锦华店 → 爱众客户服务中心 ({o.name})</p>
                <p className="text-xs text-gray-500">{o.district} · 营业时间 09:00-17:30</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold tabular-nums" style={{ color: o.color }}>{o.waiting} <span className="text-xs font-normal">人</span></p>
                <p className="text-xs" style={{ color: o.color }}>{o.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // ============== 业务步骤导航卡 =============
  const QuickActions = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
      {[
        { icon: <CreditCardOutlined />, label: '在线缴费', desc: '水·电·气 一站式', color: '#165DFF', path: '/payment' },
        { icon: <HistoryOutlined />, label: '缴费记录', desc: '历史明细查询', color: '#00B8D9', path: '/payment/records' },
        { icon: <FileSearchOutlined />, label: '电子凭证', desc: '票据下载打印', color: '#00B42A', path: '/payment/voucher' },
        { icon: <DownloadOutlined />, label: '全量导出', desc: 'Excel 报表', color: '#FF8800', path: '/payment/records' },
      ].map((a, i) => (
        <div
          key={i}
          className="p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors border-r border-b border-gray-100 lg:border-b-0"
          style={{ borderRight: (i + 1) % 4 === 0 ? undefined : undefined }}
          onClick={() => navigate(a.path)}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white" style={{ backgroundColor: a.color }}>
            {a.icon}
          </div>
          <span className="font-bold text-gray-800">{a.label}</span>
          <span className="text-xs text-gray-500">{a.desc}</span>
        </div>
      ))}
    </div>
  );

  // ============ 业务步骤：户号 → 账期 → 明细 → 缴费 ===========
  const BusinessFlowBanner = () => (
    <Card className="shadow-md" styles={{ body: { padding: '16px 20px' } }}>
      <div className="flex items-center justify-between">
        <Steps
          size="small"
          current={1}
          items={[
            { title: '1. 绑定户号', description: (
              <a className="text-primary-500 cursor-pointer" onClick={() => setBindModalVisible(true)}>立即绑定</a>
            ) },
            { title: '2. 选择账期', description: (
              <span className="text-primary-500">当前 {activePeriod}</span>
            ) },
            { title: '3. 查看明细', description: <span className="text-gray-500">点击账单行展开</span> },
            { title: '4. 在线缴纳', description: (
              <a className="text-primary-500 cursor-pointer" onClick={handlePayNow}>立即缴费</a>
            ) },
            { title: '5. 获取凭证', description: (
              <a className="text-primary-500 cursor-pointer" onClick={() => navigate('/payment/voucher')}>去下载</a>
            ) },
          ]}
          className="flex-1 min-w-0"
          style={{ minWidth: 0, flexWrap: 'wrap' }}
        />
      </div>
    </Card>
  );

  // ============ 页脚导航卡（可操作标签） ===========
  const FooterNavTags = () => (
    <Card className="shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: '缴费中心', icon: <CreditCardOutlined />, color: 'text-blue-500', items: [
            { label: '账单查询', path: '/payment' },
            { label: '缴费记录', path: '/payment/records' },
            { label: '电子凭证', path: '/payment/voucher' },
            { label: '全量导出', path: '/payment/records' },
          ]},
          { title: '公告通知', icon: <BellOutlined />, color: 'text-orange-500', items: [
            { label: '停供公告', path: '/announcements' },
            { label: '抢修公告', path: '/announcements' },
            { label: '价格调整', path: '/announcements' },
            { label: '推送订阅', path: '/announcements' },
          ]},
          { title: '服务网点', icon: <EnvironmentOutlined />, color: 'text-emerald-500', items: [
            { label: '网点查询', path: '/service-map' },
            { label: '排队状态', path: '/service-map' },
            { label: '在线预约', path: '/service-map' },
            { label: '营业时间', path: '/service-map' },
          ]},
          { title: '用户中心', icon: <UserOutlined />, color: 'text-purple-500', items: [
            { label: '登录 / 注册', path: '/login' },
            { label: '个人中心', path: '/profile' },
            { label: '绑定户号', path: '/household' },
            { label: '实名认证', path: '/profile' },
          ]},
        ].map((col) => (
          <div key={col.title}>
            <div className="flex items-center gap-2 mb-3">
              <span className={col.color}>{col.icon}</span>
              <span className="font-bold text-gray-800">{col.title}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {col.items.map((item) => (
                <a
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="text-sm text-gray-600 hover:text-primary-500 hover:bg-primary-50 p-2 rounded cursor-pointer transition-colors"
                >{item.label}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Divider />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button block size="large" onClick={() => navigate('/login')}>
          <UserOutlined /> 登录账号查看我的真实账单与户号
        </Button>
        <Button block size="large" onClick={() => navigate('/admin/login')} type="default">
          <DashboardOutlined /> 进入运营管理后台
        </Button>
      </div>
    </Card>
  );

  // ============== 底部结算栏 =============
  const BottomSettleBar = () => {
    const count = selectedBills.length;
    if (count === 0) return null;
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-4 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-gray-500 text-sm">已选</span>
                <span className="mx-1 text-primary-600 font-bold text-lg tabular-nums">{count}</span>
                <span className="text-gray-500 text-sm">项账单</span>
              </div>
              <Divider type="vertical" style={{ height: 20 }} />
              <div>
                <span className="text-gray-500 text-sm">合计金额</span>
                <span className="ml-2 text-2xl font-bold text-primary-600 tabular-nums">{formatMoney(totalAmount)}</span>
              </div>
              <Divider type="vertical" style={{ height: 20 }} className="hidden md:inline-flex" />
              <div className="text-xs text-gray-500 hidden md:block">
                包含 {displayBills.filter((b) => selectedBills.includes(b.id)).map((b) => serviceTypeMap[b.serviceType]?.name).filter((v, i, a) => a.indexOf(v) === i).join('、')}
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button size="large" onClick={() => setSelectedBills([])} className="flex-1 md:flex-none">取消选择</Button>
            <Button type="primary" size="large" icon={<CreditCardOutlined />} onClick={() => setPayModalVisible(true)} className="flex-1 md:flex-none h-11 px-8">
              去支付
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ============== 渲染主结构 =============
  return (
    <div className="space-y-6 pb-28">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 rounded-2xl p-6 md:p-8 text-white shadow-xl animate-fadeInUp">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {isLogin ? `${currentHousehold?.householdName || user?.nickname || '用户'}，欢迎回来` : '水·电·气 一站式公用事业服务'}
            </h2>
            <p className="text-white/80 text-lg mb-3">
              {isLogin ? '轻松管理户号账单，在线缴费获取电子凭证' : '支持户号绑定、账期查询、费用明细展开与在线缴纳'}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {displayHouseholds.slice(0, 4).map((h) => (
                <Tag key={h.id} color="white" className="bg-white/20 border-0 m-0">
                  {serviceTypeMap[h.serviceType]?.name}：{h.householdNo}
                  {h.arrearsAmount && h.arrearsAmount > 0 && ` · ${formatMoney(h.arrearsAmount)}`}
                </Tag>
              ))}
              {displayMode && <Tag color="orange">演示模式</Tag>}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap shrink-0">
            <Button size="large" icon={<CreditCardOutlined />} onClick={handlePayNow} className="bg-white text-primary-600 hover:bg-white/90 h-12 px-8 font-medium rounded-xl shadow-md">
              立即缴费
            </Button>
            {!isLogin && (
              <Button size="large" ghost onClick={() => navigate('/login')} className="text-white border-white/50 hover:bg-white/10 h-12 rounded-xl">
                登录查看我的账单
              </Button>
            )}
            <Button size="large" icon={<PlusOutlined />} onClick={() => setBindModalVisible(true)} className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 rounded-xl">
              绑定户号
            </Button>
          </div>
        </div>
      </div>

      {/* 业务步骤流 */}
      <BusinessFlowBanner />

      {/* 快捷操作 */}
      <Card className="shadow-md card-hover" styles={{ body: { padding: 0 } }}>
        <QuickActions />
      </Card>

      {/* 公告轮播 */}
      {announcements.length > 0 && (
        <Card
          className="shadow-md card-hover"
          styles={{ body: { padding: 0 } }}
          title={
            <div className="flex items-center gap-2 px-6 py-3">
              <BellOutlined className="text-warning-500" />
              <span className="font-medium">最新公告</span>
              {announcements.some((a: any) => a.type === 'repair') && (
                <Badge status="processing" color="red" text="紧急通知" />
              )}
            </div>
          }
          extra={<Button type="link" onClick={() => navigate('/announcements')}>查看全部 <ArrowRightOutlined /></Button>}
        >
          <Carousel autoplay dotPosition="bottom" className="bg-gray-50">
            {announcements.map((item: any) => (
              <div key={item.id} className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => navigate(`/announcements/${item.id}`)}>
                <div className="flex items-start gap-3 flex-wrap">
                  <StatusTag type="announcementType" status={item.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-800 truncate inline">{item.title}</p>
                      {item.pushStatus === 2 && <Tag color="red">紧急推送</Tag>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.summary}</p>
                  </div>
                  <span className="text-sm text-gray-400 whitespace-nowrap">{item.publishTime?.slice(5, 16)}</span>
                </div>
              </div>
            ))}
          </Carousel>
        </Card>
      )}

      {/* 主体布局：缴费卡片（大）+ 右侧信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 快速缴费 + 过滤器 */}
          <Card className="shadow-md card-hover"
            title={
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <CreditCardOutlined className="text-primary-500" />
                  <span className="font-medium">快速缴费</span>
                  {displayMode && <Tag color="orange">演示数据</Tag>}
                </div>
                <div className="flex items-center gap-2">
                  {isLogin && householdList.length > 0 && (
                    <Button type="link" size="small" onClick={() => navigate('/household')}>管理户号</Button>
                  )}
                  <Button type="link" size="small" onClick={() => setBindModalVisible(true)}>
                    <PlusOutlined /> 绑定户号
                  </Button>
                </div>
              </div>
            }
          >
            {/* 过滤器 */}
            <div className="flex flex-wrap gap-3 items-center mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap"><CalendarOutlined /> 账期：</span>
                <Select value={activePeriod} onChange={(v) => { setActivePeriod(v); setExpandedBillIds([]); }} style={{ width: 140 }}>
                  {BILLING_PERIODS.map((p) => <Option key={p} value={p}>{p}</Option>)}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap"><EnvironmentOutlined /> 户号：</span>
                <Select value={activeHousehold} onChange={(v) => setActiveHousehold(v)} style={{ width: 200 }} allowClear placeholder="全部户号">
                  {displayHouseholds.map((h) => (
                    <Option key={h.id} value={h.id}>{h.householdNo} · {h.householdName} [{serviceTypeMap[h.serviceType]?.name}]</Option>
                  ))}
                </Select>
              </div>
              <Button size="small" onClick={() => navigate('/payment')} icon={<SearchOutlined />}>
                高级查询
              </Button>
            </div>

            {/* Tabs 服务类型 */}
            <Tabs
              activeKey={activeServiceType}
              onChange={(k) => { setActiveServiceType(k); setExpandedBillIds([]); }}
              items={[
                { key: 'water', label: <span style={{ color: '#00B8D9', fontWeight: 600 }}>水费</span> },
                { key: 'electricity', label: <span style={{ color: '#FF8800', fontWeight: 600 }}>电费</span> },
                { key: 'gas', label: <span style={{ color: '#00B42A', fontWeight: 600 }}>燃气费</span> },
              ]}
            />

            {/* 统计栏 */}
            <Descriptions size="small" column={3} className="mb-4">
              <Descriptions.Item label="账期账单数">
                <span className="font-bold text-gray-800 tabular-nums">{filteredBills.length}</span> 笔
              </Descriptions.Item>
              <Descriptions.Item label="待缴费笔数">
                <span className="font-bold text-warning-500 tabular-nums">{unpaidFiltered.length}</span> 笔
              </Descriptions.Item>
              <Descriptions.Item label="待缴金额">
                <span className="font-bold text-primary-600 text-lg tabular-nums">
                  {formatMoney(unpaidFiltered.reduce((s, b) => s + b.payableAmount, 0))}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <BillCardList />
          </Card>

          {/* 我的户号 */}
          <Card className="shadow-md card-hover"
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileTextOutlined className="text-primary-500" />
                  <span className="font-medium">{isLogin ? '我的户号' : '已绑定户号'}</span>
                  <span className="text-sm text-gray-400">({displayHouseholds.length}个)</span>
                </div>
                <Button type="link" icon={<PlusOutlined />} onClick={() => setBindModalVisible(true)}>
                  {isLogin ? '添加户号' : '绑定户号'}
                </Button>
              </div>
            }
          >
            <HouseholdCardList />
          </Card>

          {/* 页脚导航标签 */}
          <FooterNavTags />
        </div>

        {/* 右侧栏 */}
        <div className="space-y-6">
          {/* 公告 */}
          <Card
            className="shadow-md card-hover"
            title={
              <div className="flex items-center gap-2">
                <BellOutlined className="text-primary-500" />
                <span className="font-medium">公告通知</span>
              </div>
            }
            styles={{ body: { padding: 0 } }}
            extra={<Button type="link" size="small" onClick={() => navigate('/announcements')}>更多 <ArrowRightOutlined /></Button>}
          >
            <div className="divide-y">
              {announcements.slice(0, 4).map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/announcements/${item.id}`)}
                >
                  <div className="flex items-start gap-2 mb-2 flex-wrap">
                    <StatusTag type="announcementType" status={item.type} />
                    {(item as any).pushStatus === 2 && <Tag color="red">紧急</Tag>}
                    <span className="text-xs text-gray-400">{item.publishTime?.slice(5, 10)}</span>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.summary}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* 网点排队 */}
          <OutletMiniCard />

          {/* 监管同步 */}
          <RegulatoryCard />

          {/* 后台入口 */}
          <AdminQuickCard />

          {/* 客服热线 */}
          <Card className="shadow-md card-hover bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <Statistic
              title={<span className="text-white/80">服务热线</span>}
              value="962960"
              valueStyle={{ color: 'white', fontSize: '28px', letterSpacing: '2px' }}
              prefix={<CustomerServiceOutlined />}
            />
            <p className="mt-2 text-white/80 text-sm">7×24小时在线，为您排忧解难</p>
          </Card>
        </div>
      </div>

      {/* 户号绑定弹窗 */}
      <Modal
        title="绑定户号"
        open={bindModalVisible}
        onCancel={() => setBindModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBindModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitBind}>确认绑定</Button>,
        ]}
        width={500}
      >
        <Form form={bindForm} layout="vertical" className="mt-4">
          <Alert
            message={displayMode ? "演示模式：绑定后将进入演示流程，登录后可绑定真实户号" : "请填写户号信息进行绑定，绑定后即可查询及缴纳该户号账单"}
            type="info"
            showIcon
            className="mb-4"
          />
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="serviceType" label="服务类型" rules={[{ required: true, message: '请选择服务类型' }]}>
              <Select placeholder="请选择">
                <Option value="water">水费</Option>
                <Option value="electricity">电费</Option>
                <Option value="gas">燃气费</Option>
              </Select>
            </Form.Item>
            <Form.Item name="householdNo" label="户号" rules={[{ required: true, message: '请输入户号' }]}>
              <Input placeholder="请输入户号" />
            </Form.Item>
            <Form.Item name="householdName" label="户名" rules={[{ required: true, message: '请输入户名' }]}>
              <Input placeholder="请输入户名（实名）" />
            </Form.Item>
            <Form.Item name="areaCode" label="所属区域" rules={[{ required: true, message: '请选择区域' }]}>
              <Select placeholder="请选择">
                <Option value="510104">锦江区</Option>
                <Option value="510105">青羊区</Option>
                <Option value="510106">金牛区</Option>
                <Option value="510107">武侯区</Option>
                <Option value="510108">成华区</Option>
                <Option value="510109">高新区</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="address" label="详细地址" rules={[{ required: true, message: '请输入详细地址' }]}>
            <Input placeholder="请输入详细地址" />
          </Form.Item>
          <Form.Item name="captcha" label="验证码（短信）" rules={[{ required: true, message: '请输入验证码' }]}>
            <div className="flex gap-2">
              <Input placeholder="6位短信验证码" style={{ flex: 1 }} />
              <Button disabled>59s 后重试</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 支付确认弹窗 */}
      <Modal
        title="确认支付"
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        onOk={handleConfirmPay}
        okText={isLogin ? '确认支付' : '演示支付'}
        okButtonProps={{ size: 'large', className: 'h-10 px-8' }}
        width={520}
        destroyOnHidden
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-center mb-4">
              <p className="text-gray-500 mb-2">待支付金额</p>
              <p className="text-4xl font-bold text-primary-600 tabular-nums">{formatMoney(totalAmount)}</p>
            </div>
            <div className="border-t pt-4 space-y-1 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-2">共 {selectedBills.length} 项账单</p>
              {displayBills.filter((b) => selectedBills.includes(b.id)).map((bill) => (
                <div key={bill.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600 truncate mr-2">
                    {serviceTypeMap[bill.serviceType]?.name} · {bill.billingPeriod}
                    <span className="text-gray-400 ml-1">({bill.householdNo})</span>
                  </span>
                  <span className="font-medium tabular-nums shrink-0">{formatMoney(bill.payableAmount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-600 mb-3">选择支付方式</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'wechat', label: '微信支付', icon: '微', color: '#07C160' },
                { key: 'alipay', label: '支付宝', icon: '支', color: '#1677FF' },
                { key: 'bank', label: '银行卡', icon: '银', color: '#F5222D' },
              ].map((method) => (
                <div
                  key={method.key}
                  className={`p-3 rounded-lg text-center cursor-pointer transition-all ${
                    payMethod === method.key
                      ? 'border-2 border-primary-500 bg-primary-50'
                      : 'border border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setPayMethod(method.key)}
                >
                  <div className="text-xl mb-1" style={{ color: method.color }}>{method.icon}</div>
                  <span className="text-sm font-medium">{method.label}</span>
                </div>
              ))}
            </div>
          </div>

          {!isLogin && (
            <Alert
              message="演示模式说明"
              description="当前为演示数据，支付完成后将生成演示结果，点击登录可查看真实账单与户号"
              type="info"
              showIcon
            />
          )}
        </div>
      </Modal>

      {/* 支付结果页（带后续跳转） */}
      <Modal
        open={payResultModalVisible}
        onCancel={() => setPayResultModalVisible(false)}
        footer={null}
        width={560}
        destroyOnHidden
      >
        <div className="text-center py-4">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircleOutlined className="text-5xl text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">支付成功</h2>
          <p className="text-gray-500 mb-4">
            {displayMode ? '演示缴费完成，' : '恭喜您，'}
            <span className="text-3xl font-bold text-primary-600 tabular-nums mx-1">{formatMoney(payResultData?.totalAmount)}</span>
            已完成支付
          </p>

          <Steps
            direction="vertical"
            size="small"
            current={4}
            className="text-left max-w-md mx-auto mb-6"
            items={[
              { title: '户号校验通过', description: '户号信息已匹配验证', status: 'finish' },
              { title: '账单已核对', description: `${selectedBills.length} 项账单，服务类型：水/电/气`, status: 'finish' },
              { title: '支付受理完成', description: `${payMethod === 'wechat' ? '微信' : payMethod === 'alipay' ? '支付宝' : '银行卡'} 支付成功，单号：${payResultData?.paymentNo}`, status: 'finish' },
              { title: '电子凭证已生成', description: (
                <span className="text-green-600">凭证号 V{payResultData?.paymentNo} 可下载打印</span>
              ), status: 'finish' },
              { title: (displayMode ? '待接入监管平台（需登录）' : '监管平台数据已同步'), description: '四川省能源监管平台已实时备案', status: displayMode ? 'process' : 'finish' },
            ]}
          />

          <Divider />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <Button block onClick={() => { setPayResultModalVisible(false); navigate('/payment/records'); }}>
              <HistoryOutlined /> 查看缴费记录
            </Button>
            <Button block onClick={() => { setPayResultModalVisible(false); navigate('/payment/voucher'); }}>
              <FileSearchOutlined /> 下载电子凭证
            </Button>
            <Button block onClick={() => { setPayResultModalVisible(false); navigate('/payment/records'); }}>
              <DownloadOutlined /> 全量导出Excel
            </Button>
            <Button type="primary" block onClick={() => { setPayResultModalVisible(false); navigate('/'); }}>
              返回首页
            </Button>
          </div>

          {!isLogin && (
            <Alert
              message="提示"
              description="登录账号后，缴费记录、电子凭证、对账数据将自动同步并对接监管平台"
              type="info"
              showIcon
              action={
                <Button size="small" type="primary" onClick={() => { setPayResultModalVisible(false); navigate('/login'); }}>
                  立即登录
                </Button>
              }
              className="text-left"
            />
          )}
        </div>
      </Modal>

      {/* 底部结算栏 */}
      <BottomSettleBar />
    </div>
  );
};

export default Home;
