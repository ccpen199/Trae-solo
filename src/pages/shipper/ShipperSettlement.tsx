import { useState, useMemo } from "react";
import {
  Card,
  Tabs,
  Table,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Drawer,
  Progress,
  DatePicker,
  Input,
  Select,
  Form,
  Space,
  Modal,
  message,
  Divider,
  Tooltip,
  Avatar,
  Descriptions,
  Badge,
  Alert,
} from "antd";
import type { TableProps, TabsProps } from "antd";
import {
  CreditCard,
  Wallet,
  Clock,
  TrendingDown,
  FileText,
  Download,
  CheckCircle2,
  Eye,
  Search,
  ChevronRight,
  FileSpreadsheet,
  Banknote,
  Building2,
  Calendar,
  Filter,
  RefreshCw,
  Send,
  Printer,
  ArrowUpRight,
  BarChart3,
  AlertCircle,
  Truck,
  User,
} from "lucide-react";
import ReactECharts from "echarts-for-react";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface SettlementBatch {
  key: string;
  batchNo: string;
  cycleStart: string;
  cycleEnd: string;
  orderCount: number;
  freightTotal: number;
  fuelDeduct: number;
  etcDeduct: number;
  prepayDeduct: number;
  insuranceFee: number;
  platformFee: number;
  netAmount: number;
  savedAmount: number;
  status: "pending" | "reviewing" | "paid" | "failed";
  generateTime: string;
  dueTime: string;
  paidTime?: string;
  remark?: string;
}

const mockBatches: SettlementBatch[] = Array.from({ length: 18 }, (_, i) => {
  const statuses: SettlementBatch["status"][] = ["pending", "pending", "reviewing", "paid", "paid", "paid", "failed"];
  const s = statuses[i % 7];
  const baseDate = new Date(2026, 5, 20);
  baseDate.setDate(baseDate.getDate() - i * 7);
  const cycleEnd = new Date(baseDate);
  const cycleStart = new Date(cycleEnd);
  cycleStart.setDate(cycleStart.getDate() - 6);
  const orders = 8 + (i % 12);
  const freight = orders * 6500 + (i % 5) * 3200;
  const fuel = Math.round(freight * 0.06);
  const etc = Math.round(freight * 0.045);
  const prepay = Math.round(freight * 0.25);
  const insurance = Math.round(freight * 0.005);
  const platform = Math.round(freight * 0.015);
  const net = freight + insurance + platform - fuel - etc - prepay;
  const saved = fuel + Math.round(freight * 0.02);

  return {
    key: String(i + 1),
    batchNo: `JS2026${String(6 - Math.floor(i / 5)).padStart(2, "0")}${String(20 - (i % 5) * 5).padStart(2, "0")}${String(i + 1).padStart(3, "0")}`,
    cycleStart: cycleStart.toISOString().slice(0, 10),
    cycleEnd: cycleEnd.toISOString().slice(0, 10),
    orderCount: orders,
    freightTotal: freight,
    fuelDeduct: fuel,
    etcDeduct: etc,
    prepayDeduct: prepay,
    insuranceFee: insurance,
    platformFee: platform,
    netAmount: net,
    savedAmount: saved,
    status: s,
    generateTime: new Date(baseDate.getTime() + 3600000 * 8).toISOString().slice(0, 16).replace("T", " "),
    dueTime: new Date(baseDate.getTime() + 86400000 * 3).toISOString().slice(0, 10),
    paidTime: s === "paid" ? new Date(baseDate.getTime() + 86400000 * 2).toISOString().slice(0, 16).replace("T", " ") : undefined,
    remark: i === 6 ? "ETC发票核验失败，请补充发票信息后重试" : undefined,
  };
});

const statusConfig: Record<
  SettlementBatch["status"],
  { label: string; color: string; bg: string }
> = {
  pending: { label: "待确认", color: "#F59E0B", bg: "bg-warning-50" },
  reviewing: { label: "审核中", color: "#3B82F6", bg: "bg-info-50" },
  paid: { label: "已打款", color: "#10B981", bg: "bg-success-50" },
  failed: { label: "打款失败", color: "#EF4444", bg: "bg-red-50" },
};

interface OrderDetail {
  key: string;
  orderNo: string;
  route: string;
  driverName: string;
  vehicleType: string;
  freight: number;
  fuel: number;
  etc: number;
  prepay: number;
  insurance: number;
  platformFee: number;
  net: number;
  completedTime: string;
}

const generateOrderDetails = (count: number): OrderDetail[] =>
  Array.from({ length: count }, (_, i) => {
    const routes = [
      "上海 → 北京",
      "广州 → 深圳",
      "成都 → 重庆",
      "北京 → 天津",
      "杭州 → 上海",
      "武汉 → 长沙",
    ];
    const drivers = ["张建国", "李卫东", "王志强", "赵文博", "孙明辉", "刘海涛"];
    const vehicles = ["4.2米高栏", "6.8米厢式", "9.6米高栏", "13米高栏", "17.5米平板"];
    const freight = 3500 + (i % 10) * 1500;
    return {
      key: String(i + 1),
      orderNo: `WD202606${String(20 - Math.floor(i / 3)).padStart(2, "0")}${String((i % 20) + 1).padStart(3, "0")}`,
      route: routes[i % routes.length],
      driverName: drivers[i % drivers.length],
      vehicleType: vehicles[i % vehicles.length],
      freight,
      fuel: Math.round(freight * 0.06),
      etc: Math.round(freight * 0.045),
      prepay: Math.round(freight * 0.3),
      insurance: Math.round(freight * 0.005),
      platformFee: Math.round(freight * 0.015),
      net: freight + Math.round(freight * 0.005) + Math.round(freight * 0.015) - Math.round(freight * 0.06) - Math.round(freight * 0.045) - Math.round(freight * 0.3),
      completedTime: `2026-06-${String(15 + (i % 6)).padStart(2, "0")} ${String(8 + (i % 12)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    };
  });

export default function ShipperSettlement() {
  const [activeTab, setActiveTab] = useState("pending");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<SettlementBatch | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [form] = Form.useForm();

  const filteredBatches = useMemo(() => {
    if (activeTab === "pending") return mockBatches.filter((b) => b.status === "pending" || b.status === "reviewing" || b.status === "failed");
    if (activeTab === "history") return mockBatches.filter((b) => b.status === "paid" || b.status === "failed");
    return mockBatches;
  }, [activeTab]);

  const totals = useMemo(() => {
    const pending = mockBatches.filter((b) => b.status === "pending" || b.status === "reviewing");
    return {
      payable: pending.reduce((s, b) => s + b.netAmount, 0),
      paid: mockBatches.filter((b) => b.status === "paid").reduce((s, b) => s + b.netAmount, 0),
      reviewing: mockBatches.filter((b) => b.status === "reviewing").length,
      saved: mockBatches.reduce((s, b) => s + b.savedAmount, 0),
    };
  }, []);

  const orderDetails = useMemo(
    () => generateOrderDetails(selectedBatch?.orderCount || 0),
    [selectedBatch]
  );

  const openDrawer = (batch: SettlementBatch) => {
    setSelectedBatch(batch);
    setDetailPage(1);
    setDrawerOpen(true);
  };

  const barChartOption = selectedBatch
    ? {
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: "rgba(10,35,66,0.95)",
          borderColor: "transparent",
          textStyle: { color: "#fff", fontSize: 12 },
          formatter: (params: any) => {
            let html = `<div class="font-bold mb-1">费用明细</div>`;
            params.forEach((p: any) => {
              const sign = ["运费", "保险费", "平台费"].includes(p.seriesName) ? "+" : "-";
              const color = ["运费", "保险费", "平台费"].includes(p.seriesName) ? "#FCA5A5" : "#86EFAC";
              html += `<div class="flex items-center justify-between gap-4 my-1"><span style="color:#CBD5E1">${p.marker} ${p.seriesName}</span><span style="color:${color};font-weight:bold">${sign}¥${p.value.toLocaleString()}</span></div>`;
            });
            const net = selectedBatch.freightTotal + selectedBatch.insuranceFee + selectedBatch.platformFee - selectedBatch.fuelDeduct - selectedBatch.etcDeduct - selectedBatch.prepayDeduct;
            html += `<div class="mt-2 pt-2 border-t border-white/10"><div class="flex items-center justify-between gap-4"><span class="text-white/60">应付净额</span><span class="text-orange-300 font-bold text-lg">¥${net.toLocaleString()}</span></div></div>`;
            return html;
          },
        },
        legend: {
          data: ["运费", "油费抵扣", "ETC抵扣", "预支扣回", "保险费", "平台费"],
          bottom: 0,
          icon: "roundRect",
          itemWidth: 10,
          itemHeight: 8,
          itemGap: 14,
          textStyle: { color: "#64748B", fontSize: 11 },
        },
        grid: { left: "3%", right: "3%", top: "5%", bottom: "18%", containLabel: true },
        xAxis: {
          type: "category",
          data: ["金额构成"],
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisLabel: { color: "#94A3B8", fontSize: 10, formatter: (v: number) => (v / 10000).toFixed(1) + "w" },
          splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
        },
        series: [
          {
            name: "运费",
            type: "bar",
            stack: "positive",
            data: [selectedBatch.freightTotal],
            itemStyle: { color: "#FF6B1A", borderRadius: [0, 0, 0, 0] },
            barWidth: 80,
          },
          {
            name: "保险费",
            type: "bar",
            stack: "positive",
            data: [selectedBatch.insuranceFee],
            itemStyle: { color: "#06B6D4" },
            barWidth: 80,
          },
          {
            name: "平台费",
            type: "bar",
            stack: "positive",
            data: [selectedBatch.platformFee],
            itemStyle: { color: "#8B5CF6", borderRadius: [4, 4, 0, 0] },
            barWidth: 80,
          },
          {
            name: "油费抵扣",
            type: "bar",
            stack: "negative",
            data: [-selectedBatch.fuelDeduct],
            itemStyle: { color: "#10B981", borderRadius: [0, 0, 0, 0] },
            barWidth: 80,
          },
          {
            name: "ETC抵扣",
            type: "bar",
            stack: "negative",
            data: [-selectedBatch.etcDeduct],
            itemStyle: { color: "#3B82F6" },
            barWidth: 80,
          },
          {
            name: "预支扣回",
            type: "bar",
            stack: "negative",
            data: [-selectedBatch.prepayDeduct],
            itemStyle: { color: "#F59E0B", borderRadius: [4, 4, 0, 0] },
            barWidth: 80,
          },
        ],
      }
    : {};

  const batchColumns: TableProps<SettlementBatch>["columns"] = [
    {
      title: "批次号",
      dataIndex: "batchNo",
      key: "batchNo",
      width: 190,
      fixed: "left",
      render: (v, r) => (
        <div>
          <div className="font-mono text-sm font-semibold text-deep-blue-700 hover:text-primary-orange cursor-pointer">{v}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">周期：{r.cycleStart} ~ {r.cycleEnd}</div>
        </div>
      ),
    },
    {
      title: "订单数",
      dataIndex: "orderCount",
      key: "orderCount",
      width: 90,
      align: "center",
      render: (v) => (
        <div className="text-center">
          <div className="text-lg font-bold text-deep-blue-900">{v}</div>
          <div className="text-[10px] text-gray-400">单</div>
        </div>
      ),
    },
    {
      title: "运费合计",
      dataIndex: "freightTotal",
      key: "freightTotal",
      width: 130,
      align: "right",
      render: (v) => <span className="text-sm font-semibold text-deep-blue-900">¥{v.toLocaleString()}</span>,
    },
    {
      title: "抵扣项",
      key: "deductions",
      width: 200,
      render: (_, r) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">⛽ 油费抵扣</span>
            <span className="font-semibold text-success-600">-¥{r.fuelDeduct.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">🛣️ ETC抵扣</span>
            <span className="font-semibold text-info-600">-¥{r.etcDeduct.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">💰 预支扣回</span>
            <span className="font-semibold text-warning-600">-¥{r.prepayDeduct.toLocaleString()}</span>
          </div>
        </div>
      ),
    },
    {
      title: "应付净额",
      dataIndex: "netAmount",
      key: "netAmount",
      width: 140,
      align: "right",
      render: (v) => (
        <div className="text-right">
          <div className="text-lg font-bold text-primary-orange">¥{v.toLocaleString()}</div>
          <div className="text-[10px] text-success-500 flex items-center gap-0.5 justify-end">
            <TrendingDown size={10} />
            节省约 5.8%
          </div>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) => {
        const cfg = statusConfig[status];
        return (
          <Tag
            color={cfg.color}
            className="!m-0 !text-xs !font-medium !px-2.5 !py-0.5 !rounded-full"
            style={{ backgroundColor: cfg.bg, border: "none" }}
          >
            {status === "reviewing" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "生成时间",
      dataIndex: "generateTime",
      key: "generateTime",
      width: 160,
      render: (v) => <span className="text-xs text-gray-500">{v}</span>,
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      fixed: "right",
      render: (_, r) => (
        <div className="flex items-center gap-0.5 flex-wrap">
          <Button
            type="link"
            size="small"
            className="!h-7 !px-2 !text-deep-blue-600 !font-medium"
            icon={<Eye size={13} className="inline" />}
            onClick={() => openDrawer(r)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            className="!h-7 !px-2 !text-deep-blue-600 !font-medium"
            icon={<FileSpreadsheet size={13} className="inline" />}
          >
            导出
          </Button>
          {(r.status === "pending" || r.status === "failed") && (
            <Button
              type="link"
              size="small"
              className="!h-7 !px-2 !text-primary-orange !font-medium"
              icon={<Send size={13} className="inline" />}
              onClick={() => {
                setSelectedBatch(r);
                setPayModalOpen(true);
              }}
            >
              打款
            </Button>
          )}
        </div>
      ),
    },
  ];

  const detailColumns: TableProps<OrderDetail>["columns"] = [
    {
      title: "运单号",
      dataIndex: "orderNo",
      key: "orderNo",
      width: 150,
      render: (v) => <span className="font-mono text-xs font-medium text-deep-blue-700">{v}</span>,
    },
    {
      title: "线路/司机",
      key: "info",
      width: 200,
      render: (_, r) => (
        <div>
          <div className="text-xs font-medium text-deep-blue-900 flex items-center gap-1">
            <Truck size={10} className="text-primary-orange" />
            {r.route}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
            <User size={9} className="text-gray-400" />
            {r.driverName} · {r.vehicleType}
          </div>
        </div>
      ),
    },
    {
      title: "运费",
      dataIndex: "freight",
      key: "freight",
      width: 100,
      align: "right",
      render: (v) => <span className="text-xs font-semibold text-deep-blue-900">¥{v.toLocaleString()}</span>,
    },
    {
      title: "抵扣/扣回",
      key: "deduct",
      width: 200,
      render: (_, r) => (
        <div className="space-y-0.5 text-[10px]">
          <div className="flex items-center justify-between text-gray-500">
            <span>油费</span>
            <span className="text-success-600 font-medium">-¥{r.fuel}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>ETC</span>
            <span className="text-info-600 font-medium">-¥{r.etc}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>预支</span>
            <span className="text-warning-600 font-medium">-¥{r.prepay}</span>
          </div>
        </div>
      ),
    },
    {
      title: "附加费",
      key: "extra",
      width: 140,
      render: (_, r) => (
        <div className="space-y-0.5 text-[10px]">
          <div className="flex items-center justify-between text-gray-500">
            <span>保险</span>
            <span className="font-medium text-deep-blue-800">+¥{r.insurance}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>平台</span>
            <span className="font-medium text-deep-blue-800">+¥{r.platformFee}</span>
          </div>
        </div>
      ),
    },
    {
      title: "净额",
      dataIndex: "net",
      key: "net",
      width: 100,
      align: "right",
      render: (v) => <span className="text-xs font-bold text-primary-orange">¥{v.toLocaleString()}</span>,
    },
    {
      title: "完成时间",
      dataIndex: "completedTime",
      key: "completedTime",
      width: 140,
      render: (v) => <span className="text-[10px] text-gray-500">{v}</span>,
    },
  ];

  const tabItems: TabsProps["items"] = [
    {
      key: "pending",
      label: (
        <span className="!px-1">
          <Badge count={mockBatches.filter((b) => b.status === "pending").length} size="small" offset={[8, -2]}>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              待确认账单
            </span>
          </Badge>
        </span>
      ),
    },
    {
      key: "history",
      label: (
        <span className="flex items-center gap-1.5 !px-1">
          <FileText size={14} />
          历史账单
        </span>
      ),
    },
    {
      key: "detail",
      label: (
        <span className="flex items-center gap-1.5 !px-1">
          <BarChart3 size={14} />
          对账明细
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-deep-blue-900">结算中心</h1>
          <p className="text-sm text-gray-500 mt-1">管理对账单据、确认打款、查看费用明细</p>
        </div>
        <div className="flex items-center gap-3">
          <Button icon={<Download size={15} />} className="!h-10 !px-4 !rounded-xl">
            下载对账单
          </Button>
          <Button
            type="primary"
            icon={<Building2 size={15} />}
            className="!h-10 !px-5 !rounded-xl !font-medium !bg-gradient-primary !border-0 hover:!brightness-105 shadow-soft-orange"
          >
            企业充值
          </Button>
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={12} lg={6}>
          <Card className="!rounded-2xl !border-0 overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 !p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-white/80 text-sm font-medium mb-2">
                  <CreditCard size={15} />
                  本期应付
                </div>
                <div className="text-3xl font-bold tracking-tight">¥{totals.payable.toLocaleString()}</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <Tag className="!m-0 !bg-white/20 !text-white !border-white/20 !rounded-full !text-xs">
                    共 {mockBatches.filter((b) => b.status === "pending" || b.status === "reviewing").length} 笔待处理
                  </Tag>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CreditCard size={22} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="!rounded-2xl !border border-gray-100 !p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium mb-2">
                  <Wallet size={15} className="text-success-500" />
                  累计已付
                </div>
                <Statistic
                  value={totals.paid}
                  precision={0}
                  prefix="¥"
                  className="!mb-0"
                  valueStyle={{ fontSize: 28, fontWeight: 700, color: "#0A2342" }}
                />
                <div className="mt-3 flex items-center gap-1.5 text-xs text-success-600">
                  <ArrowUpRight size={12} />
                  较上月 +18.6%
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center">
                <CheckCircle2 size={22} className="text-success-500" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="!rounded-2xl !border border-gray-100 !p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium mb-2">
                  <Clock size={15} className="text-info-500" />
                  待审核
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-deep-blue-900 tracking-tight">{totals.reviewing}</span>
                  <span className="text-sm text-gray-500">笔</span>
                </div>
                <div className="mt-3">
                  <Progress percent={60} size="small" showInfo={false} strokeColor="#3B82F6" />
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-info-50 flex items-center justify-center">
                <Clock size={22} className="text-info-500" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="!rounded-2xl !border border-gray-100 !p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium mb-2">
                  <TrendingDown size={15} className="text-success-500" />
                  节省总额
                </div>
                <Statistic
                  value={totals.saved}
                  precision={0}
                  prefix="¥"
                  className="!mb-0"
                  valueStyle={{ fontSize: 28, fontWeight: 700, color: "#10B981" }}
                />
                <div className="mt-3 flex items-center gap-1.5 text-xs text-success-600">
                  油费优惠 + 平台补贴 合计节省 5.8%
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingDown size={22} className="text-emerald-500" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="!rounded-2xl !border border-gray-100">
        {activeTab === "detail" ? (
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100">
              <div className="flex items-center gap-3 flex-wrap">
                <Form layout="inline">
                  <Form.Item name="dateRange" className="!mb-0">
                    <RangePicker size="large" className="!w-72" />
                  </Form.Item>
                  <Form.Item name="keyword" className="!mb-0">
                    <Input
                      size="large"
                      placeholder="搜索批次号/运单号"
                      prefix={<Search size={14} className="text-gray-400" />}
                      className="!w-56"
                    />
                  </Form.Item>
                </Form>
              </div>
              <div className="flex items-center gap-2">
                <Button size="large" icon={<RefreshCw size={14} />}>刷新</Button>
                <Button
                  size="large"
                  type="primary"
                  icon={<FileSpreadsheet size={15} />}
                  className="!bg-gradient-primary !border-0 hover:!brightness-105"
                >
                  导出完整对账明细
                </Button>
              </div>
            </div>
            <Table<OrderDetail>
              columns={detailColumns}
              dataSource={generateOrderDetails(50)}
              scroll={{ x: 1100 }}
              size="middle"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条明细记录`,
                pageSize: 15,
              }}
              rowKey="key"
              className="!text-sm"
              summary={(pageData) => {
                const sumFreight = pageData.reduce((s, r) => s + r.freight, 0);
                const sumFuel = pageData.reduce((s, r) => s + r.fuel, 0);
                const sumEtc = pageData.reduce((s, r) => s + r.etc, 0);
                const sumPrepay = pageData.reduce((s, r) => s + r.prepay, 0);
                const sumInsurance = pageData.reduce((s, r) => s + r.insurance, 0);
                const sumPlatform = pageData.reduce((s, r) => s + r.platformFee, 0);
                const sumNet = pageData.reduce((s, r) => s + r.net, 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row className="!bg-gradient-to-r from-orange-50 to-amber-50">
                      <Table.Summary.Cell index={0} colSpan={2} className="!text-sm !font-bold !text-deep-blue-900">
                        本页小计（{pageData.length} 条记录）
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right" className="!text-sm !font-bold !text-deep-blue-900">
                        ¥{sumFreight.toLocaleString()}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} className="!text-xs !font-semibold">
                        <div className="space-y-0.5">
                          <div className="flex justify-between">⛽ -¥{sumFuel.toLocaleString()}</div>
                          <div className="flex justify-between">🛣️ -¥{sumEtc.toLocaleString()}</div>
                          <div className="flex justify-between">💰 -¥{sumPrepay.toLocaleString()}</div>
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} className="!text-xs !font-semibold">
                        <div className="space-y-0.5">
                          <div className="flex justify-between">保 +¥{sumInsurance.toLocaleString()}</div>
                          <div className="flex justify-between">平 +¥{sumPlatform.toLocaleString()}</div>
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} align="right" className="!text-lg !font-bold !text-primary-orange">
                        ¥{sumNet.toLocaleString()}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6} />
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </div>
        ) : (
          <>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="!mb-4" />
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Form layout="inline" size="large">
                  <Form.Item className="!mb-0">
                    <Select placeholder="全部状态" style={{ width: 140 }} allowClear>
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <Option key={k} value={k}>{v.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item className="!mb-0">
                    <RangePicker style={{ width: 300 }} />
                  </Form.Item>
                  <Form.Item className="!mb-0">
                    <Input
                      placeholder="搜索批次号"
                      prefix={<Search size={14} className="text-gray-400" />}
                      style={{ width: 220 }}
                    />
                  </Form.Item>
                </Form>
              </div>
              <div className="flex items-center gap-2">
                <Button icon={<Filter size={14} />}>高级筛选</Button>
                <Button icon={<Download size={14} />}>批量导出</Button>
              </div>
            </div>
            <Table<SettlementBatch>
              columns={batchColumns}
              dataSource={filteredBatches}
              scroll={{ x: 1300 }}
              size="middle"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条批次记录`,
                pageSize: 8,
              }}
              rowKey="key"
              className="!text-sm"
              expandable={{
                expandedRowRender: (record) => (
                  <div className="p-4 rounded-xl bg-slate-50 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">运费</div>
                        <div className="text-base font-bold text-deep-blue-900">¥{record.freightTotal.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">油费抵扣</div>
                        <div className="text-base font-bold text-success-600">-¥{record.fuelDeduct.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">ETC抵扣</div>
                        <div className="text-base font-bold text-info-600">-¥{record.etcDeduct.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">预支扣回</div>
                        <div className="text-base font-bold text-warning-600">-¥{record.prepayDeduct.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">保险费</div>
                        <div className="text-base font-bold text-deep-blue-800">+¥{record.insuranceFee.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">平台费</div>
                        <div className="text-base font-bold text-deep-blue-800">+¥{record.platformFee.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">应付净额</div>
                        <div className="text-xl font-bold text-primary-orange">¥{record.netAmount.toLocaleString()}</div>
                      </div>
                    </div>
                    {record.remark && (
                      <Alert
                        type="error"
                        showIcon
                        icon={<AlertCircle size={15} />}
                        message={record.remark}
                      />
                    )}
                  </div>
                ),
                rowExpandable: () => true,
              }}
            />
          </>
        )}
      </Card>

      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-orange/10 flex items-center justify-center">
              <FileText size={18} className="text-primary-orange" />
            </div>
            <div>
              <div className="font-bold text-deep-blue-900">批次明细 · {selectedBatch?.batchNo}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {selectedBatch?.cycleStart} ~ {selectedBatch?.cycleEnd}
              </div>
            </div>
            {selectedBatch && (
              <Tag
                color={statusConfig[selectedBatch.status].color}
                className="!ml-2 !rounded-full"
              >
                {statusConfig[selectedBatch.status].label}
              </Tag>
            )}
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={920}
        extra={
          <Space>
            <Button icon={<Printer size={14} />}>打印</Button>
            <Button icon={<FileSpreadsheet size={14} />} type="primary" className="!bg-gradient-primary !border-0">
              导出Excel
            </Button>
            {selectedBatch && (selectedBatch.status === "pending" || selectedBatch.status === "failed") && (
              <Button
                type="primary"
                icon={<Send size={14} />}
                danger={selectedBatch.status === "failed"}
                onClick={() => setPayModalOpen(true)}
              >
                {selectedBatch.status === "failed" ? "重新打款" : "确认打款"}
              </Button>
            )}
          </Space>
        }
      >
        {selectedBatch && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-deep-blue to-blue-700 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/70">应付净额</div>
                  <div className="text-3xl font-bold mt-1 tracking-tight">¥{selectedBatch.netAmount.toLocaleString()}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-white/70">订单数</div>
                    <div className="text-xl font-bold mt-0.5">{selectedBatch.orderCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-white/70">节省成本</div>
                    <div className="text-xl font-bold mt-0.5 text-green-300">¥{selectedBatch.savedAmount.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-white/70">应付截止</div>
                    <div className="text-xl font-bold mt-0.5">{selectedBatch.dueTime}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-orange to-amber-400" />
                <span className="font-bold text-deep-blue-900">费用分项对比</span>
              </div>
              <Card className="!rounded-xl !border border-gray-100">
                <ReactECharts option={barChartOption} style={{ height: 280 }} notMerge />
              </Card>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-deep-blue to-blue-400" />
                  <span className="font-bold text-deep-blue-900">逐单明细</span>
                  <Tag color="blue" className="!rounded-full">
                    共 {orderDetails.length} 单
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <Input.Search placeholder="搜索运单号..." size="large" className="!w-56" />
                </div>
              </div>
              <Table<OrderDetail>
                columns={detailColumns}
                dataSource={orderDetails}
                scroll={{ x: 1100 }}
                size="middle"
                pagination={{
                  current: detailPage,
                  onChange: setDetailPage,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (t) => `共 ${t} 条`,
                  pageSize: 8,
                }}
                rowKey="key"
                className="!text-sm"
                summary={(pageData) => {
                  const sumFreight = pageData.reduce((s, r) => s + r.freight, 0);
                  const sumNet = pageData.reduce((s, r) => s + r.net, 0);
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row className="!bg-orange-50">
                        <Table.Summary.Cell index={0} colSpan={2} className="!font-bold !text-deep-blue-900">
                          本页小计
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right" className="!font-bold !text-deep-blue-900">
                          ¥{sumFreight.toLocaleString()}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} />
                        <Table.Summary.Cell index={4} />
                        <Table.Summary.Cell index={5} align="right" className="!text-base !font-bold !text-primary-orange">
                          ¥{sumNet.toLocaleString()}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </div>

            <Divider />
            <Descriptions column={2} size="small" title={<span className="font-semibold text-deep-blue-900">批次信息</span>}>
              <Descriptions.Item label="生成时间">{selectedBatch.generateTime}</Descriptions.Item>
              <Descriptions.Item label="到期时间">{selectedBatch.dueTime}</Descriptions.Item>
              <Descriptions.Item label="打款时间">{selectedBatch.paidTime || "--"}</Descriptions.Item>
              <Descriptions.Item label="备注">{selectedBatch.remark || "无"}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-orange/10 flex items-center justify-center">
              <Banknote size={16} className="text-primary-orange" />
            </div>
            <span className="font-bold text-deep-blue-900">
              {selectedBatch?.status === "failed" ? "重新发起打款" : "确认打款"}
            </span>
          </div>
        }
        open={payModalOpen}
        onCancel={() => setPayModalOpen(false)}
        onOk={() => {
          message.success("打款请求已提交，预计 30 分钟内到账");
          setPayModalOpen(false);
          setDrawerOpen(false);
        }}
        okText="确认支付"
        cancelText="取消"
        width={560}
        okButtonProps={{
          className: "!bg-gradient-primary !border-0 hover:!brightness-105 !rounded-xl !h-10 !px-8 !font-bold",
        }}
      >
        {selectedBatch && (
          <div className="space-y-5 pt-2">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-deep-blue to-blue-700 text-white">
              <div className="text-xs text-white/70 mb-1 flex items-center gap-1">
                <Calendar size={11} />
                {selectedBatch.cycleStart} ~ {selectedBatch.cycleEnd} 批次结算
              </div>
              <div className="text-4xl font-bold tracking-tight mt-1">¥{selectedBatch.netAmount.toLocaleString()}</div>
              <div className="flex items-center gap-4 mt-4 text-xs text-white/80">
                <span>订单 {selectedBatch.orderCount} 单</span>
                <span>·</span>
                <span>批次号 {selectedBatch.batchNo}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 space-y-3">
              <div className="text-sm font-semibold text-deep-blue-900 flex items-center gap-1.5">
                <Building2 size={15} />
                付款账户
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <Avatar size={40} className="!bg-deep-blue !font-bold">ICBC</Avatar>
                  <div>
                    <div className="font-semibold text-deep-blue-900 text-sm">中国工商银行 · 企业基本户</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">6222 **** **** 8888</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">可用余额</div>
                  <div className="text-sm font-bold text-success-600">¥ 1,286,500.00</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <Avatar size={40} className="!bg-orange-500 !font-bold">平台</Avatar>
                  <div>
                    <div className="font-semibold text-deep-blue-900 text-sm">平台监管结算账户</div>
                    <div className="text-xs text-gray-500 mt-0.5">资金由平安银行监管，保障双方权益</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Form layout="vertical" form={form}>
                <Form.Item
                  label={<span className="text-sm font-medium text-deep-blue-900">支付密码</span>}
                  name="payPassword"
                  rules={[{ required: true, message: "请输入支付密码" }]}
                  className="!mb-3"
                >
                  <Input.Password size="large" placeholder="请输入6位支付密码" maxLength={6} />
                </Form.Item>
                <Form.Item label={<span className="text-sm font-medium text-deep-blue-900">打款备注（选填）</span>} name="remark">
                  <Input size="large" placeholder="如有特殊说明请填写..." prefix={<FileText size={14} className="text-gray-400" />} />
                </Form.Item>
              </Form>
            </div>

            <Alert
              type="info"
              showIcon
              message="打款说明"
              description={
                <ul className="text-xs space-y-1 mt-1">
                  <li>· 资金将划转至平台监管账户，确认司机收款后完成结算</li>
                  <li>· 预计到账时间：工作日 09:00-18:00，30分钟内到账</li>
                  <li>· 如遇异常请联系 400-888-8888 客服处理</li>
                </ul>
              }
              className="!rounded-xl"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
