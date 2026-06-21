import { useState } from "react";
import { Card, Tag, Button, Avatar, Table, Tooltip, Progress, Statistic } from "antd";
import {
  Package,
  Clock,
  Truck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  User,
  Star,
  Shield,
  Award,
  MapPin,
  ChevronRight,
  FileText,
  Search,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { TableProps } from "antd";

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  trend: number;
  gradient: string;
  iconBg: string;
}

const StatCard = ({ title, value, unit, icon, trend, gradient, iconBg }: StatCardProps) => (
  <Card className="!rounded-2xl !border-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div className={`absolute inset-0 opacity-100 ${gradient}`} />
    <div className="relative p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-white/80 mb-2">{title}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
            {unit && <span className="text-sm text-white/70 font-medium">{unit}</span>}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            {trend >= 0 ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                <ArrowUpRight size={12} />
                +{trend}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                <ArrowDownRight size={12} />
                {trend}%
              </span>
            )}
            <span className="text-xs text-white/60">较昨日</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  </Card>
);

interface Driver {
  id: string;
  name: string;
  avatar: string;
  matchScore: number;
  creditScore: number;
  dealRate: number;
  qualifications: string[];
  price: number;
  distance: string;
  vehicleType: string;
}

const mockDrivers: Driver[] = [
  {
    id: "D001",
    name: "张建国",
    avatar: "Z",
    matchScore: 96,
    creditScore: 920,
    dealRate: 98.5,
    qualifications: ["危险品运输", "冷链运输", "全程保险"],
    price: 12800,
    distance: "2.3km",
    vehicleType: "13米高栏",
  },
  {
    id: "D002",
    name: "李卫东",
    avatar: "L",
    matchScore: 92,
    creditScore: 885,
    dealRate: 96.2,
    qualifications: ["大件运输", "全程保险"],
    price: 12500,
    distance: "5.8km",
    vehicleType: "17.5米平板",
  },
  {
    id: "D003",
    name: "王志强",
    avatar: "W",
    matchScore: 89,
    creditScore: 860,
    dealRate: 94.8,
    qualifications: ["冷链运输", "GPS定位"],
    price: 13200,
    distance: "8.1km",
    vehicleType: "9.6米冷藏",
  },
  {
    id: "D004",
    name: "赵文博",
    avatar: "Z",
    matchScore: 87,
    creditScore: 845,
    dealRate: 93.1,
    qualifications: ["危险品运输", "GPS定位"],
    price: 12200,
    distance: "12.5km",
    vehicleType: "13米厢式",
  },
  {
    id: "D005",
    name: "孙明辉",
    avatar: "S",
    matchScore: 85,
    creditScore: 830,
    dealRate: 91.5,
    qualifications: ["全程保险", "代收货款"],
    price: 11800,
    distance: "15.2km",
    vehicleType: "6.8米高栏",
  },
];

const DriverCard = ({ driver }: { driver: Driver }) => {
  const matchColor = driver.matchScore >= 90 ? "#10B981" : driver.matchScore >= 85 ? "#FF6B1A" : "#F59E0B";
  return (
    <Card className="!rounded-2xl !border border-gray-100 flex-shrink-0 w-72 hover:shadow-lg transition-all hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar
            size={56}
            className="!bg-gradient-primary !text-white !font-bold !text-xl !border-4 !border-orange-50"
          >
            {driver.avatar}
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success-500 border-2 border-white flex items-center justify-center">
            <Shield size={10} className="text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="font-bold text-deep-blue-900 text-base">{driver.name}</div>
            <div className="flex items-center gap-0.5 text-warning-500">
              <Star size={12} fill="currentColor" />
              <span className="text-xs font-semibold">{(driver.creditScore / 100).toFixed(1)}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin size={10} />
            距您 {driver.distance} · {driver.vehicleType}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="relative flex items-center justify-center">
          <Progress
            type="circle"
            size={56}
            percent={driver.matchScore}
            strokeColor={matchColor}
            trailColor="#F1F5F9"
            className="!mb-0"
            format={(p) => <span className="text-xs font-bold" style={{ color: matchColor }}>{p}</span>}
          />
          <div className="absolute -bottom-1 text-[10px] text-gray-400 font-medium">匹配度</div>
        </div>
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="text-lg font-bold text-deep-blue-900">{driver.creditScore}</div>
          <div className="text-[10px] text-gray-400 font-medium mt-0.5">信用分</div>
        </div>
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="text-lg font-bold text-deep-blue-900">{driver.dealRate}%</div>
          <div className="text-[10px] text-gray-400 font-medium mt-0.5">成交率</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {driver.qualifications.map((q) => (
          <Tag
            key={q}
            className="!m-0 !text-[10px] !px-2 !py-0.5 !rounded-md"
            color={q.includes("危险品") ? "red" : q.includes("冷链") ? "blue" : q.includes("保险") ? "green" : "orange"}
          >
            {q}
          </Tag>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-gray-400">推荐报价</div>
          <div className="text-xl font-bold text-primary-orange">
            ¥{driver.price.toLocaleString()}
          </div>
        </div>
        <Button
          type="primary"
          size="small"
          className="!rounded-lg !bg-gradient-primary !border-0 !px-4 !h-8 !font-medium hover:!brightness-105"
        >
          立即匹配
        </Button>
      </div>
    </Card>
  );
};

interface RecentOrder {
  key: string;
  orderNo: string;
  route: string;
  cargo: string;
  weight: string;
  amount: number;
  status: "pending" | "matched" | "loading" | "transit" | "completed";
  progress: number;
  driver?: string;
  createTime: string;
}

const recentOrders: RecentOrder[] = [
  { key: "1", orderNo: "WD20260620001", route: "上海 → 北京", cargo: "电子产品", weight: "12.5吨", amount: 12800, status: "transit", progress: 68, driver: "张建国", createTime: "2026-06-20 09:15" },
  { key: "2", orderNo: "WD20260620002", route: "广州 → 深圳", cargo: "服装鞋帽", weight: "8.2吨", amount: 4500, status: "loading", progress: 25, driver: "李卫东", createTime: "2026-06-20 08:42" },
  { key: "3", orderNo: "WD20260619008", route: "成都 → 重庆", cargo: "生鲜食品", weight: "6.8吨", amount: 3200, status: "matched", progress: 10, driver: "王志强", createTime: "2026-06-19 17:30" },
  { key: "4", orderNo: "WD20260619005", route: "北京 → 天津", cargo: "机械设备", weight: "18.5吨", amount: 6800, status: "pending", progress: 0, createTime: "2026-06-19 15:20" },
  { key: "5", orderNo: "WD20260618012", route: "深圳 → 广州", cargo: "建材五金", weight: "22.0吨", amount: 5200, status: "completed", progress: 100, driver: "赵文博", createTime: "2026-06-18 11:05" },
];

const statusConfig: Record<RecentOrder["status"], { label: string; color: string; bgColor: string }> = {
  pending: { label: "待匹配", color: "#F59E0B", bgColor: "bg-warning-50" },
  matched: { label: "已匹配", color: "#3B82F6", bgColor: "bg-info-50" },
  loading: { label: "装货中", color: "#8B5CF6", bgColor: "bg-purple-50" },
  transit: { label: "运输中", color: "#FF6B1A", bgColor: "bg-primary-orange-50" },
  completed: { label: "已完成", color: "#10B981", bgColor: "bg-success-50" },
};

const routeTrendOption = {
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      crossStyle: { color: "#999" },
      lineStyle: { color: "#CBD5E1", type: "dashed" },
    },
    backgroundColor: "rgba(255,255,255,0.98)",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    textStyle: { color: "#1F2937", fontSize: 12 },
    formatter: (params: any) => {
      let result = `<div class="font-bold mb-2">${params[0].axisValue}</div>`;
      params.forEach((p: any) => {
        if (p.seriesName !== "90天均价") {
          result += `<div class="flex items-center gap-2 my-1"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></span><span>${p.seriesName}：</span><span class="font-bold">¥${p.value.toLocaleString()}</span></div>`;
        }
      });
      const avg = params.find((p: any) => p.seriesName === "90天均价");
      if (avg) {
        result += `<div class="mt-2 pt-2 border-t border-gray-100 text-gray-500 text-xs">90天均价：¥${Math.round(avg.value).toLocaleString()}</div>`;
      }
      return result;
    },
  },
  legend: {
    data: ["京沪线", "广深线", "成渝线", "90天均价"],
    right: 0,
    top: 0,
    icon: "roundRect",
    itemWidth: 12,
    itemHeight: 8,
    itemGap: 20,
    textStyle: { color: "#64748B", fontSize: 12 },
  },
  grid: {
    left: "3%",
    right: "3%",
    bottom: "3%",
    top: "15%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: Array.from({ length: 90 }, (_, i) => {
      const d = new Date(2026, 2, 22 + i);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    axisLine: { lineStyle: { color: "#E2E8F0" } },
    axisLabel: { color: "#94A3B8", fontSize: 11, interval: 14 },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    name: "运费(元)",
    nameTextStyle: { color: "#94A3B8", fontSize: 11, padding: [0, 40, 0, 0] },
    axisLine: { show: false },
    axisLabel: { color: "#94A3B8", fontSize: 11, formatter: (v: number) => (v / 1000).toFixed(0) + "k" },
    splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
  },
  series: [
    {
      name: "京沪线",
      type: "line",
      smooth: true,
      symbol: "none",
      data: Array.from({ length: 90 }, (_, i) => 12500 + Math.sin(i / 8) * 800 + Math.random() * 400),
      lineStyle: { color: "#FF6B1A", width: 2.5 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(255,107,26,0.35)" },
            { offset: 1, color: "rgba(255,107,26,0.02)" },
          ],
        },
      },
    },
    {
      name: "广深线",
      type: "line",
      smooth: true,
      symbol: "none",
      data: Array.from({ length: 90 }, (_, i) => 4500 + Math.sin(i / 10 + 1) * 500 + Math.random() * 300),
      lineStyle: { color: "#0A2342", width: 2.5 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(10,35,66,0.3)" },
            { offset: 1, color: "rgba(10,35,66,0.02)" },
          ],
        },
      },
    },
    {
      name: "成渝线",
      type: "line",
      smooth: true,
      symbol: "none",
      data: Array.from({ length: 90 }, (_, i) => 3200 + Math.sin(i / 12 + 2) * 400 + Math.random() * 250),
      lineStyle: { color: "#10B981", width: 2.5 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(16,185,129,0.3)" },
            { offset: 1, color: "rgba(16,185,129,0.02)" },
          ],
        },
      },
    },
    {
      name: "90天均价",
      type: "line",
      smooth: true,
      symbol: "none",
      data: Array(90).fill(6730),
      lineStyle: { color: "#94A3B8", width: 1.5, type: "dashed" },
    },
  ],
};

export default function ShipperDashboard() {
  const columns: TableProps<RecentOrder>["columns"] = [
    {
      title: "运单号",
      dataIndex: "orderNo",
      key: "orderNo",
      width: 160,
      render: (v) => (
        <span className="font-mono text-sm font-medium text-deep-blue-700 hover:text-primary-orange cursor-pointer">
          {v}
        </span>
      ),
    },
    {
      title: "线路",
      dataIndex: "route",
      key: "route",
      width: 140,
      render: (v) => (
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-primary-orange" />
          <span className="text-sm font-medium text-gray-700">{v}</span>
        </div>
      ),
    },
    { title: "货物", dataIndex: "cargo", key: "cargo", width: 110, render: (v) => <span className="text-sm text-gray-600">{v}</span> },
    { title: "重量", dataIndex: "weight", key: "weight", width: 90, render: (v) => <span className="text-sm text-gray-600">{v}</span> },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (v) => <span className="text-sm font-bold text-primary-orange">¥{v.toLocaleString()}</span>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const cfg = statusConfig[status];
        return (
          <Tag
            color={cfg.color}
            className="!m-0 !text-xs !font-medium !px-2.5 !py-0.5 !rounded-full"
            style={{ backgroundColor: cfg.bgColor, border: "none" }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "运输进度",
      dataIndex: "progress",
      key: "progress",
      width: 160,
      render: (v) => (
        <Progress
          percent={v}
          size="small"
          strokeColor={{ "0%": "#FF6B1A", "100%": "#FF9A54" }}
          trailColor="#F1F5F9"
        />
      ),
    },
    {
      title: "司机",
      dataIndex: "driver",
      key: "driver",
      width: 100,
      render: (v) => v ? (
        <span className="text-sm text-gray-700 flex items-center gap-1">
          <User size={12} className="text-gray-400" />
          {v}
        </span>
      ) : <span className="text-xs text-gray-400">待分配</span>,
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 150,
      render: (v) => <span className="text-xs text-gray-400">{v}</span>,
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Button type="link" size="small" className="!h-7 !px-2 !text-deep-blue-600">
            <Eye size={14} className="inline mr-0.5" />详情
          </Button>
          {record.status === "pending" && (
            <Button type="link" size="small" className="!h-7 !px-2 !text-primary-orange">
              <Search size={14} className="inline mr-0.5" />匹配
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep-blue-900">工作台</h1>
          <p className="text-sm text-gray-500 mt-1">欢迎回来，今天是 {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<FileText size={16} />}
            className="!h-10 !px-5 !rounded-xl !font-medium !border-gray-200"
          >
            导出报表
          </Button>
          <Button
            type="primary"
            icon={<Package size={16} />}
            className="!h-10 !px-5 !rounded-xl !font-medium !bg-gradient-primary !border-0 hover:!brightness-105 shadow-soft-orange"
          >
            发布货源
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="今日发布"
          value="12"
          unit="单"
          icon={<Package size={22} className="text-white" />}
          trend={18.5}
          gradient="bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400"
          iconBg="bg-white/25 backdrop-blur-sm"
        />
        <StatCard
          title="待匹配"
          value="8"
          unit="单"
          icon={<Clock size={22} className="text-white" />}
          trend={-5.2}
          gradient="bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-400"
          iconBg="bg-white/25 backdrop-blur-sm"
        />
        <StatCard
          title="运输中"
          value="23"
          unit="单"
          icon={<Truck size={22} className="text-white" />}
          trend={12.8}
          gradient="bg-gradient-to-br from-deep-blue-600 via-deep-blue-500 to-blue-500"
          iconBg="bg-white/25 backdrop-blur-sm"
        />
        <StatCard
          title="本月GMV"
          value="286.5"
          unit="万"
          icon={<TrendingUp size={22} className="text-white" />}
          trend={24.3}
          gradient="bg-gradient-to-br from-emerald-500 via-teal-400 to-green-400"
          iconBg="bg-white/25 backdrop-blur-sm"
        />
      </div>

      <Card
        title={
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-orange to-amber-400" />
            <span className="font-bold text-deep-blue-900 text-base">智能匹配推荐</span>
            <Tag color="orange" className="!ml-2 !rounded-full !text-xs">
              为您找到 {mockDrivers.length} 位优质司机
            </Tag>
          </div>
        }
        extra={
          <Button type="link" className="!text-primary-orange !font-medium flex items-center gap-0.5">
            查看全部 <ChevronRight size={16} />
          </Button>
        }
        className="!rounded-2xl !border border-gray-100"
      >
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scroll-smooth">
          {mockDrivers.map((d) => (
            <DriverCard key={d.id} driver={d} />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card
          title={
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-deep-blue-500 to-blue-400" />
              <span className="font-bold text-deep-blue-900 text-base">线路成交价趋势</span>
              <span className="text-xs text-gray-400 font-normal">近90天</span>
            </div>
          }
          className="!rounded-2xl !border border-gray-100 xl:col-span-3"
        >
          <ReactECharts option={routeTrendOption} style={{ height: 340 }} notMerge />
        </Card>

        <Card
          title={
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-orange to-amber-400" />
              <span className="font-bold text-deep-blue-900 text-base">最近运单</span>
            </div>
          }
          extra={
            <Button type="link" className="!text-primary-orange !font-medium flex items-center gap-0.5">
              全部运单 <ChevronRight size={16} />
            </Button>
          }
          className="!rounded-2xl !border border-gray-100 xl:col-span-2"
        >
          <Table<RecentOrder>
            columns={columns}
            dataSource={recentOrders}
            pagination={false}
            size="middle"
            scroll={{ x: 1100 }}
            className="!text-sm"
          />
        </Card>
      </div>
    </div>
  );
}
