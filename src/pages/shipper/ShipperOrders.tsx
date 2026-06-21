import { useState, useMemo } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Form,
  Row,
  Col,
  Space,
  Checkbox,
  Dropdown,
  Avatar,
  Progress,
  Tooltip,
  Badge,
  Modal,
  message,
  Alert,
} from "antd";
import type { TableProps, MenuProps } from "antd";
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  Trash2,
  Eye,
  Navigation,
  MapPin,
  User,
  Package,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Truck,
  Search as MatchIcon,
  Phone,
  MessageSquare,
  ChevronDown,
  RotateCcw,
  FileText,
  Clock,
} from "lucide-react";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search: SearchInput } = Input;

interface OrderRow {
  key: string;
  orderNo: string;
  startCity: string;
  endCity: string;
  startAddress: string;
  endAddress: string;
  distance: number;
  driver?: {
    name: string;
    avatar: string;
    phone: string;
    rating: number;
  };
  cargoName: string;
  cargoCategory: string;
  weight: number;
  volume: number;
  amount: number;
  status: "pending" | "matched" | "loading" | "transit" | "arrived" | "completed" | "cancelled";
  progress: number;
  createTime: string;
  pickupTime?: string;
  estimateArrive?: string;
  vehicleType: string;
}

const statusConfig: Record<
  OrderRow["status"],
  { label: string; color: string; bg: string; dot: string }
> = {
  pending: { label: "待匹配", color: "#F59E0B", bg: "bg-warning-50", dot: "bg-warning-500" },
  matched: { label: "已匹配", color: "#3B82F6", bg: "bg-info-50", dot: "bg-info-500" },
  loading: { label: "装货中", color: "#8B5CF6", bg: "bg-purple-50", dot: "bg-purple-500" },
  transit: { label: "运输中", color: "#FF6B1A", bg: "bg-primary-orange-50", dot: "bg-primary-orange" },
  arrived: { label: "已到达", color: "#06B6D4", bg: "bg-cyan-50", dot: "bg-cyan-500" },
  completed: { label: "已完成", color: "#10B981", bg: "bg-success-50", dot: "bg-success-500" },
  cancelled: { label: "已取消", color: "#94A3B8", bg: "bg-gray-50", dot: "bg-gray-400" },
};

const mockOrders: OrderRow[] = Array.from({ length: 35 }, (_, i) => {
  const routes = [
    { start: "上海市", end: "北京市", sAddr: "浦东新区张江", eAddr: "朝阳区望京", dist: 1215 },
    { start: "广州市", end: "深圳市", sAddr: "天河区珠江新城", eAddr: "南山区科技园", dist: 142 },
    { start: "成都市", end: "重庆市", sAddr: "高新区天府大道", eAddr: "渝北区两江新区", dist: 308 },
    { start: "北京市", end: "天津市", sAddr: "大兴区亦庄", eAddr: "滨海新区开发区", dist: 136 },
    { start: "杭州市", end: "上海市", sAddr: "滨江区阿里园区", eAddr: "闵行区虹桥", dist: 180 },
    { start: "深圳市", end: "广州市", sAddr: "福田区CBD", eAddr: "白云区机场", dist: 135 },
    { start: "苏州市", end: "南京市", sAddr: "工业园区金鸡湖", eAddr: "鼓楼区新街口", dist: 220 },
    { start: "武汉市", end: "长沙市", sAddr: "东湖高新区", eAddr: "岳麓区麓谷", dist: 350 },
  ];
  const r = routes[i % routes.length];
  const statuses: OrderRow["status"][] = ["pending", "matched", "loading", "transit", "arrived", "completed", "cancelled"];
  const status = statuses[i % 7];
  const progressMap: Record<OrderRow["status"], number> = {
    pending: 0,
    matched: 10,
    loading: 25,
    transit: 45 + (i % 4) * 15,
    arrived: 95,
    completed: 100,
    cancelled: 0,
  };
  const drivers = [
    { name: "张建国", avatar: "Z", phone: "138****8888", rating: 4.9 },
    { name: "李卫东", avatar: "L", phone: "139****6666", rating: 4.8 },
    { name: "王志强", avatar: "W", phone: "137****7777", rating: 4.7 },
    { name: "赵文博", avatar: "Z", phone: "136****9999", rating: 4.9 },
    { name: "孙明辉", avatar: "S", phone: "135****5555", rating: 4.6 },
  ];
  const categories = ["电子产品", "服装鞋帽", "食品饮料", "机械设备", "建材五金", "日用百货", "生鲜冷链"];
  const vehicles = ["4.2米高栏", "6.8米厢式", "9.6米高栏", "13米高栏", "17.5米平板", "9.6米冷藏"];

  return {
    key: String(i + 1),
    orderNo: `WD202606${String(20 - Math.floor(i / 2)).padStart(2, "0")}${String((i % 20) + 1).padStart(3, "0")}`,
    startCity: r.start,
    endCity: r.end,
    startAddress: r.sAddr,
    endAddress: r.eAddr,
    distance: r.dist,
    driver: status !== "pending" && status !== "cancelled" ? drivers[i % drivers.length] : undefined,
    cargoName: `${categories[i % categories.length]}（第${i + 1}批）`,
    cargoCategory: categories[i % categories.length],
    weight: 3 + (i % 10) * 2.5,
    volume: 10 + (i % 8) * 8,
    amount: Math.round((r.dist * 8 + 1000 + (i % 10) * 200) / 100) * 100,
    status,
    progress: progressMap[status],
    createTime: dayjs()
      .subtract(i, "day")
      .subtract(i * 3 % 23, "hour")
      .format("YYYY-MM-DD HH:mm"),
    pickupTime:
      status !== "pending"
        ? dayjs()
            .subtract(Math.max(0, i - 1), "day")
            .format("YYYY-MM-DD HH:mm")
        : undefined,
    estimateArrive:
      status === "transit" || status === "matched" || status === "loading"
        ? dayjs()
            .add(Math.max(1, 3 - (i % 3)), "day")
            .format("YYYY-MM-DD HH:mm")
        : undefined,
    vehicleType: vehicles[i % vehicles.length],
  };
});

const StatCard = ({
  label,
  value,
  icon,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
      active
        ? "border-primary-orange bg-orange-50/60 shadow-sm"
        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
    }`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="text-2xl font-bold text-deep-blue-900 mt-0.5">{value}</div>
      </div>
    </div>
  </div>
);

export default function ShipperOrders() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();
  const [showFilter, setShowFilter] = useState(true);
  const [matchModalOpen, setMatchModalOpen] = useState(false);

  const filteredData = useMemo(() => {
    return mockOrders.filter(
      (o) => !selectedStatus || o.status === selectedStatus
    );
  }, [selectedStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { total: mockOrders.length };
    mockOrders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, []);

  const actionMenu: MenuProps["items"] = [
    {
      key: "match",
      label: (
        <span className="flex items-center gap-2">
          <MatchIcon size={14} className="text-primary-orange" />
          重新匹配司机
        </span>
      ),
    },
    {
      key: "delay",
      label: (
        <span className="flex items-center gap-2">
          <Clock size={14} className="text-blue-500" />
          延长配送时间
        </span>
      ),
    },
    {
      key: "message",
      label: (
        <span className="flex items-center gap-2">
          <MessageSquare size={14} className="text-green-500" />
          联系司机
        </span>
      ),
    },
    { type: "divider" },
    {
      key: "cancel",
      label: (
        <span className="flex items-center gap-2 text-red-500">
          <XCircle size={14} />
          取消运单
        </span>
      ),
      danger: true,
    },
  ];

  const columns: TableProps<OrderRow>["columns"] = [
    {
      title: "运单号",
      dataIndex: "orderNo",
      key: "orderNo",
      width: 170,
      fixed: "left",
      render: (v, record) => (
        <div>
          <div className="font-mono text-sm font-semibold text-deep-blue-700 hover:text-primary-orange cursor-pointer">
            {v}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">{record.createTime}</div>
        </div>
      ),
    },
    {
      title: "运输线路",
      key: "route",
      width: 260,
      render: (_, r) => (
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center pt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-orange border-2 border-orange-100" />
            <div className="w-0.5 flex-1 my-0.5 bg-gradient-to-b from-primary-orange to-deep-blue" />
            <div className="w-2.5 h-2.5 rounded-full bg-deep-blue border-2 border-blue-100" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <div className="text-sm font-semibold text-deep-blue-900 flex items-center gap-1">
                <MapPin size={11} className="text-primary-orange" />
                {r.startCity}
              </div>
              <Tooltip title={r.startAddress}>
                <div className="text-xs text-gray-500 truncate mt-0.5 ml-3">
                  {r.startAddress}
                </div>
              </Tooltip>
            </div>
            <div>
              <div className="text-sm font-semibold text-deep-blue-900 flex items-center gap-1">
                <Navigation size={11} className="text-deep-blue" />
                {r.endCity}
              </div>
              <Tooltip title={r.endAddress}>
                <div className="text-xs text-gray-500 truncate mt-0.5 ml-3">
                  {r.endAddress}
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "司机",
      key: "driver",
      width: 160,
      render: (_, r) =>
        r.driver ? (
          <div className="flex items-center gap-2.5">
            <Avatar
              size={36}
              className="!bg-gradient-primary !text-white !font-semibold !text-sm"
            >
              {r.driver.avatar}
            </Avatar>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-deep-blue-900 flex items-center gap-1">
                {r.driver.name}
                <Star size={10} className="text-warning-500" fill="currentColor" />
                <span className="text-xs text-warning-500">{r.driver.rating}</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{r.driver.phone}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <User size={12} />
            待分配
          </div>
        ),
    },
    {
      title: "货物信息",
      key: "cargo",
      width: 180,
      render: (_, r) => (
        <div>
          <div className="text-sm font-medium text-deep-blue-900 flex items-center gap-1">
            <Package size={12} className="text-gray-400" />
            {r.cargoName}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
            <span>{r.weight.toFixed(1)}吨</span>
            <span>{r.volume.toFixed(0)}m³</span>
            <span className="text-gray-400">{r.vehicleType}</span>
          </div>
        </div>
      ),
    },
    {
      title: "运费金额",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (v) => (
        <div className="text-right">
          <div className="text-lg font-bold text-primary-orange">
            ¥{v.toLocaleString()}
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
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot} animate-pulse`}
            />
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "运输进度",
      key: "progress",
      width: 160,
      render: (_, r) => (
        <div>
          <Progress
            percent={r.progress}
            size="small"
            strokeColor={
              r.status === "completed"
                ? "#10B981"
                : r.status === "cancelled"
                ? "#94A3B8"
                : { "0%": "#FF6B1A", "100%": "#FF9A54" }
            }
            trailColor="#F1F5F9"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{r.pickupTime || "--"}</span>
            <span>{r.estimateArrive || "--"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, r) => (
        <div className="flex items-center gap-0.5 flex-wrap">
          <Button
            type="link"
            size="small"
            className="!h-7 !px-2 !text-deep-blue-600 !font-medium"
            icon={<Eye size={13} className="inline" />}
          >
            详情
          </Button>
          {r.status === "pending" && (
            <Button
              type="link"
              size="small"
              className="!h-7 !px-2 !text-primary-orange !font-medium"
              icon={<MatchIcon size={13} className="inline" />}
              onClick={() => setMatchModalOpen(true)}
            >
              匹配
            </Button>
          )}
          {(r.status === "transit" || r.status === "loading" || r.status === "matched" || r.status === "arrived") && (
            <Button
              type="link"
              size="small"
              className="!h-7 !px-2 !text-blue-600 !font-medium"
              icon={<Truck size={13} className="inline" />}
            >
              追踪
            </Button>
          )}
          {(r.status === "arrived" || r.status === "completed") && (
            <Button
              type="link"
              size="small"
              className="!h-7 !px-2 !text-green-600 !font-medium"
              icon={<CheckCircle2 size={13} className="inline" />}
            >
              签收
            </Button>
          )}
          <Dropdown menu={{ items: actionMenu }} trigger={["click"]} placement="bottomRight">
            <Button type="text" size="small" className="!h-7 !w-7 !p-0">
              <MoreHorizontal size={15} className="text-gray-500" />
            </Button>
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep-blue-900">运单管理</h1>
          <p className="text-sm text-gray-500 mt-1">查看和管理您的全部运输订单</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<Package size={16} />}
            type="primary"
            className="!h-10 !px-5 !rounded-xl !font-medium !bg-gradient-primary !border-0 hover:!brightness-105 shadow-soft-orange"
          >
            发布新货源
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard
          label="全部订单"
          value={statusCounts.total}
          icon={<FileText size={18} className="text-deep-blue" />}
          color="bg-deep-blue/10"
          active={selectedStatus === null}
          onClick={() => setSelectedStatus(null)}
        />
        <StatCard
          label="待匹配"
          value={statusCounts.pending || 0}
          icon={<Clock size={18} className="text-warning-500" />}
          color="bg-warning-50"
          active={selectedStatus === "pending"}
          onClick={() => setSelectedStatus("pending")}
        />
        <StatCard
          label="已匹配"
          value={statusCounts.matched || 0}
          icon={<MatchIcon size={18} className="text-info-500" />}
          color="bg-info-50"
          active={selectedStatus === "matched"}
          onClick={() => setSelectedStatus("matched")}
        />
        <StatCard
          label="装货中"
          value={statusCounts.loading || 0}
          icon={<Package size={18} className="text-purple-500" />}
          color="bg-purple-50"
          active={selectedStatus === "loading"}
          onClick={() => setSelectedStatus("loading")}
        />
        <StatCard
          label="运输中"
          value={statusCounts.transit || 0}
          icon={<Truck size={18} className="text-primary-orange" />}
          color="bg-primary-orange/10"
          active={selectedStatus === "transit"}
          onClick={() => setSelectedStatus("transit")}
        />
        <StatCard
          label="已到达"
          value={statusCounts.arrived || 0}
          icon={<MapPin size={18} className="text-cyan-500" />}
          color="bg-cyan-50"
          active={selectedStatus === "arrived"}
          onClick={() => setSelectedStatus("arrived")}
        />
        <StatCard
          label="已完成"
          value={statusCounts.completed || 0}
          icon={<CheckCircle2 size={18} className="text-success-500" />}
          color="bg-success-50"
          active={selectedStatus === "completed"}
          onClick={() => setSelectedStatus("completed")}
        />
        <StatCard
          label="已取消"
          value={statusCounts.cancelled || 0}
          icon={<XCircle size={18} className="text-gray-400" />}
          color="bg-gray-50"
          active={selectedStatus === "cancelled"}
          onClick={() => setSelectedStatus("cancelled")}
        />
      </div>

      <Card
        className="!rounded-2xl !border border-gray-100"
        title={
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-deep-blue" />
            <span className="font-bold text-deep-blue-900">高级筛选</span>
          </div>
        }
        extra={
          <Button
            type="link"
            onClick={() => setShowFilter(!showFilter)}
            className="!text-primary-orange !font-medium"
          >
            {showFilter ? "收起筛选" : "展开筛选"}
            <ChevronDown
              size={14}
              className={`inline ml-0.5 transition-transform ${showFilter ? "rotate-180" : ""}`}
            />
          </Button>
        }
      >
        {showFilter && (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label="起始城市" name="startCity" className="!mb-4">
                  <Select
                    placeholder="选择起始城市"
                    allowClear
                    size="large"
                    className="!w-full"
                    showSearch
                    options={[
                      { label: "北京市", value: "beijing" },
                      { label: "上海市", value: "shanghai" },
                      { label: "广州市", value: "guangzhou" },
                      { label: "深圳市", value: "shenzhen" },
                      { label: "杭州市", value: "hangzhou" },
                      { label: "成都市", value: "chengdu" },
                      { label: "重庆市", value: "chongqing" },
                      { label: "武汉市", value: "wuhan" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label="目的城市" name="endCity" className="!mb-4">
                  <Select
                    placeholder="选择目的城市"
                    allowClear
                    size="large"
                    className="!w-full"
                    showSearch
                    options={[
                      { label: "北京市", value: "beijing" },
                      { label: "上海市", value: "shanghai" },
                      { label: "广州市", value: "guangzhou" },
                      { label: "深圳市", value: "shenzhen" },
                      { label: "杭州市", value: "hangzhou" },
                      { label: "成都市", value: "chengdu" },
                      { label: "重庆市", value: "chongqing" },
                      { label: "武汉市", value: "wuhan" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label="订单状态" name="status" className="!mb-4">
                  <Select
                    placeholder="选择状态"
                    allowClear
                    size="large"
                    className="!w-full"
                  >
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <Option key={k} value={k}>
                        {v.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label="创建日期" name="dateRange" className="!mb-4">
                  <RangePicker size="large" className="!w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label="运费区间（元）" className="!mb-4">
                  <div className="flex items-center gap-2">
                    <Form.Item name="minAmount" noStyle>
                      <InputNumber
                        size="large"
                        placeholder="最低"
                        min={0}
                        className="!w-full"
                      />
                    </Form.Item>
                    <span className="text-gray-400">-</span>
                    <Form.Item name="maxAmount" noStyle>
                      <InputNumber
                        size="large"
                        placeholder="最高"
                        min={0}
                        className="!w-full"
                      />
                    </Form.Item>
                  </div>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label="货物品类" name="category" className="!mb-4">
                  <Select
                    placeholder="选择品类"
                    allowClear
                    size="large"
                    className="!w-full"
                    options={[
                      "电子产品",
                      "服装鞋帽",
                      "食品饮料",
                      "机械设备",
                      "建材五金",
                      "日用百货",
                      "生鲜冷链",
                      "其他",
                    ].map((c) => ({ label: c, value: c }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label="关键词搜索" name="keyword" className="!mb-4">
                  <SearchInput
                    placeholder="运单号/司机/货物名称"
                    allowClear
                    size="large"
                    prefix={<Search size={14} className="text-gray-400" />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label=" " className="!mb-4">
                  <Space.Compact className="!w-full" block>
                    <Button
                      type="primary"
                      size="large"
                      className="!flex-1 !bg-gradient-primary !border-0 hover:!brightness-105"
                      icon={<Search size={15} />}
                    >
                      查询
                    </Button>
                    <Button
                      size="large"
                      className="!flex-1"
                      icon={<RotateCcw size={14} />}
                      onClick={() => form.resetFields()}
                    >
                      重置
                    </Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Card>

      <Card className="!rounded-2xl !border border-gray-100">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Checkbox
              checked={selectedRowKeys.length === filteredData.length && filteredData.length > 0}
              indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < filteredData.length}
              onChange={(e) =>
                setSelectedRowKeys(e.target.checked ? filteredData.map((d) => d.key) : [])
              }
            >
              <span className="text-sm text-gray-600">
                已选 {selectedRowKeys.length} / {filteredData.length} 项
              </span>
            </Checkbox>
            {selectedRowKeys.length > 0 && (
              <>
                <Button
                  size="small"
                  icon={<Download size={13} />}
                  className="!h-8"
                >
                  批量导出
                </Button>
                <Button
                  size="small"
                  icon={<CheckCircle2 size={13} className="text-green-500" />}
                  className="!h-8"
                >
                  批量签收
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<Trash2 size={13} />}
                  className="!h-8"
                >
                  批量取消
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              icon={<RefreshCw size={13} />}
              className="!h-8"
            >
              刷新
            </Button>
            <Button
              size="small"
              icon={<Download size={13} />}
              className="!h-8"
            >
              导出Excel
            </Button>
          </div>
        </div>

        <Table<OrderRow>
          columns={columns}
          dataSource={filteredData}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 1400 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            pageSize: 10,
            size: "default",
          }}
          size="middle"
          rowKey="key"
          className="!text-sm"
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-orange/10 flex items-center justify-center">
              <MatchIcon size={16} className="text-primary-orange" />
            </div>
            <span className="font-bold text-deep-blue-900">智能匹配司机</span>
          </div>
        }
        open={matchModalOpen}
        onCancel={() => setMatchModalOpen(false)}
        onOk={() => {
          message.success("已发起智能匹配，预计30秒内完成");
          setMatchModalOpen(false);
        }}
        okText="确认匹配"
        cancelText="取消"
        width={640}
        okButtonProps={{
          className: "!bg-gradient-primary !border-0 hover:!brightness-105 !rounded-xl !h-10 !px-6",
        }}
      >
        <div className="space-y-4">
          <Alert
            type="info"
            showIcon
            message="系统将为您匹配最优运力"
            description="根据线路、价格、信用分、历史评价等多维度智能推荐5位优质司机供您选择"
            className="!rounded-xl"
          />
          <div className="p-4 rounded-xl bg-slate-50 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">目标运单</span>
              <span className="font-mono font-semibold text-deep-blue-900">WD20260620001</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">运输线路</span>
              <span className="font-medium text-deep-blue-900">上海市 → 北京市</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">期望运费</span>
              <span className="font-bold text-primary-orange">¥12,800</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Star({
  size,
  className,
  fill,
}: {
  size?: number;
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill || "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
