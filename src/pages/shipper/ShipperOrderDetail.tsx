import { useState } from "react";
import {
  Card,
  Button,
  Tag,
  Avatar,
  Row,
  Col,
  Timeline,
  Table,
  Progress,
  Divider,
  Modal,
  Rate,
  message,
  Input,
  Descriptions,
  Badge,
  Tooltip,
  Statistic,
  Checkbox,
  Alert,
} from "antd";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  Star,
  User,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  Copy,
  Share2,
  Download,
  QrCode,
  Signature,
  Calendar,
  AlertTriangle,
  Map,
  ChevronRight,
  Eye,
  Send,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { TableProps } from "antd";

const { TextArea } = Input;

const RouteMapSVG = () => (
  <svg viewBox="0 0 600 200" className="w-full h-full">
    <defs>
      <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: "#FF6B1A", stopOpacity: 1 }} />
        <stop offset="68%" style={{ stopColor: "#FF6B1A", stopOpacity: 1 }} />
        <stop offset="68.1%" style={{ stopColor: "#CBD5E1", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#CBD5E1", stopOpacity: 1 }} />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect width="600" height="200" fill="#F8FAFC" rx="12" />
    <path
      d="M 80 100 Q 200 50 300 100 T 520 100"
      stroke="#E2E8F0"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="12 8"
      opacity="0.6"
    />
    <path
      d="M 80 100 Q 200 50 300 100 T 382 85"
      stroke="url(#routeGrad)"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
      filter="url(#glow)"
    />
    <circle cx="80" cy="100" r="14" fill="#fff" stroke="#FF6B1A" strokeWidth="3" />
    <circle cx="80" cy="100" r="6" fill="#FF6B1A" />
    <text x="80" y="140" textAnchor="middle" fontSize="11" fill="#0A2342" fontWeight="600">
      上海 · 装货
    </text>
    <text x="80" y="155" textAnchor="middle" fontSize="9" fill="#94A3B8">
      31.2304° N, 121.4737° E
    </text>
    <g transform="translate(382, 85)">
      <circle r="16" fill="#FF6B1A" filter="url(#glow)" className="animate-pulse" />
      <circle r="28" fill="#FF6B1A" opacity="0.2" />
      <path
        d="M -6 -4 L -6 6 L -4 6 L -4 -1 L 1 -1 L 1 6 L 3 6 L 3 -1 L 6 -1 L 6 6 L 7.5 4 L 7.5 7 L -7.5 7 L -7.5 -4 Z"
        fill="#fff"
        transform="translate(0, -2) scale(1.2)"
      />
    </g>
    <text x="382" y="58" textAnchor="middle" fontSize="10" fill="#FF6B1A" fontWeight="700">
      🚚 当前位置
    </text>
    <text x="382" y="70" textAnchor="middle" fontSize="9" fill="#FF6B1A">
      徐州 · 连霍高速
    </text>
    <circle cx="520" cy="100" r="14" fill="#fff" stroke="#0A2342" strokeWidth="3" />
    <circle cx="520" cy="100" r="6" fill="#0A2342" />
    <text x="520" y="140" textAnchor="middle" fontSize="11" fill="#0A2342" fontWeight="600">
      北京 · 卸货
    </text>
    <text x="520" y="155" textAnchor="middle" fontSize="9" fill="#94A3B8">
      39.9042° N, 116.4074° E
    </text>
    <text x="300" y="30" textAnchor="middle" fontSize="13" fill="#0A2342" fontWeight="700">
      全程 1,215 km · 预计剩余 5.2 小时
    </text>
  </svg>
);

interface CostItem {
  key: string;
  name: string;
  amount: number;
  note?: string;
  type: "income" | "expense" | "neutral";
}

const costData: CostItem[] = [
  { key: "1", name: "基础运费", amount: 12800, type: "expense" },
  { key: "2", name: "高速过路费（ETC）", amount: 580, note: "实报实销，多退少补", type: "expense" },
  { key: "3", name: "燃油补贴", amount: -420, note: "平台合作油站优惠抵扣", type: "income" },
  { key: "4", name: "运输保险费", amount: 64, note: "货值 12.8万 · 费率 0.5‰", type: "expense" },
  { key: "5", name: "装卸货费用", amount: 400, note: "装货2人 · 卸货2人", type: "expense" },
  { key: "6", name: "平台服务费", amount: 192, note: "运费 1.5%", type: "expense" },
];

export default function ShipperOrderDetail() {
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signRating, setSignRating] = useState(5);
  const [signComment, setSignComment] = useState("");

  const timelineEvents = [
    {
      color: "#10B981",
      dot: <CheckCircle2 size={14} className="text-white" />,
      title: "运单创建",
      time: "2026-06-20 09:15:32",
      desc: "您成功发布了货源，系统正在为您匹配运力",
      actionBy: "货主本人",
    },
    {
      color: "#3B82F6",
      dot: <User size={14} className="text-white" />,
      title: "匹配成功",
      time: "2026-06-20 09:28:15",
      desc: "司机 张建国（京A·88888）成功接单，预付款 ¥3,854 已冻结",
      actionBy: "系统智能匹配",
    },
    {
      color: "#8B5CF6",
      dot: <Package size={14} className="text-white" />,
      title: "货物装载",
      time: "2026-06-20 11:02:48",
      desc: "司机已到达装货地，完成装货 12.5 吨 / 65 m³ / 800 件",
      actionBy: "司机 张建国",
      extra: (
        <div className="mt-2 flex gap-2">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl border border-gray-200">
            📦
          </div>
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl border border-gray-200">
            🚚
          </div>
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl border border-gray-200">
            📋
          </div>
        </div>
      ),
    },
    {
      color: "#FF6B1A",
      dot: <Truck size={14} className="text-white" />,
      title: "运输途中",
      time: "2026-06-20 11:45:20 - 进行中",
      desc: "车辆正在高速行驶，当前位置：徐州段 · 连霍高速 K682",
      actionBy: "司机 张建国",
      extra: (
        <div className="mt-2 flex items-center gap-4 text-xs">
          <Badge status="processing" text={<span className="text-primary-orange font-semibold">实时追踪中</span>} />
          <span className="text-gray-500">已行驶 682 / 1,215 km（56%）</span>
        </div>
      ),
    },
    {
      color: "#94A3B8",
      dot: <Clock size={14} className="text-white" />,
      title: "签收完成",
      time: "预计 2026-06-21 03:30 前",
      desc: "等待司机到达目的地并完成签收",
      actionBy: "待执行",
    },
  ];

  const costColumns: TableProps<CostItem>["columns"] = [
    {
      title: "费用项目",
      dataIndex: "name",
      key: "name",
      render: (v, r) => (
        <div>
          <div className="text-sm font-medium text-deep-blue-900">{v}</div>
          {r.note && <div className="text-xs text-gray-400 mt-0.5">{r.note}</div>}
        </div>
      ),
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 180,
      align: "right",
      render: (v, r) => (
        <span
          className={`text-sm font-bold ${
            r.type === "income" ? "text-success-500" : "text-deep-blue-900"
          }`}
        >
          {r.type === "income" ? "-" : ""}¥{Math.abs(v).toLocaleString()}
        </span>
      ),
    },
  ];

  const totalAmount = costData.reduce((sum, c) => sum + (c.type === "income" ? -c.amount : c.amount), 0);
  const paidAmount = Math.round(totalAmount * 0.3);
  const remainingAmount = totalAmount - paidAmount;

  const trackOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const p = params[0];
        return `<div class="font-bold mb-1">${p.axisValue}</div><div>行驶速度：<span class="font-bold text-primary-orange">${p.value[1]} km/h</span></div>`;
      },
    },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: "time",
      axisLine: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 10 },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
      data: Array.from({ length: 24 }, (_, i) => {
        const d = new Date(2026, 5, 20, 11, 45);
        d.setMinutes(d.getMinutes() + i * 30);
        return d;
      }),
    },
    yAxis: {
      type: "value",
      name: "km/h",
      nameTextStyle: { color: "#94A3B8", fontSize: 10 },
      axisLine: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 10 },
      splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#FF6B1A", width: 2.5 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(255,107,26,0.3)" },
              { offset: 1, color: "rgba(255,107,26,0.02)" },
            ],
          },
        },
        data: Array.from({ length: 24 }, (_, i) => {
          const base = 75 + Math.sin(i / 3) * 15;
          const d = new Date(2026, 5, 20, 11, 45);
          d.setMinutes(d.getMinutes() + i * 30);
          return [d, i > 18 ? null : Math.round(base + Math.random() * 10)];
        }),
      },
      {
        type: "line",
        symbol: "none",
        lineStyle: { color: "#94A3B8", width: 1, type: "dashed" },
        data: Array.from({ length: 24 }, (_, i) => {
          const d = new Date(2026, 5, 20, 11, 45);
          d.setMinutes(d.getMinutes() + i * 30);
          return [d, 80];
        }),
      },
    ],
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeft size={18} />}
            className="!h-10 !w-10 !p-0"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-deep-blue-900">运单详情</h1>
              <Tooltip title="复制运单号">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deep-blue-50 text-deep-blue-700 font-mono text-sm cursor-pointer hover:bg-deep-blue-100 transition-colors">
                  WD20260620001
                  <Copy size={12} className="opacity-60" />
                </span>
              </Tooltip>
            </div>
            <div className="text-sm text-gray-500 mt-1">创建时间：2026-06-20 09:15:32 · 上海 → 北京 · 1,215 km</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<Share2 size={14} />} className="!h-9">分享</Button>
          <Button icon={<Download size={14} />} className="!h-9">下载运单</Button>
          <Button icon={<QrCode size={14} />} className="!h-9">二维码</Button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-primary-orange via-orange-500 to-amber-400 p-6 text-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-deep-blue/10 rounded-full translate-y-1/2 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Truck size={32} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/25 backdrop-blur-sm font-bold text-lg border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    运输中
                  </span>
                  <Tag color="blue" className="!bg-white/20 !border-white/30 !text-white !rounded-full">
                    已行驶 56%
                  </Tag>
                </div>
                <div className="text-white/90 text-base">
                  司机 <span className="font-bold">张建国</span> 正在 <span className="font-bold">连霍高速徐州段</span> 行驶
                </div>
                <div className="text-white/70 text-sm mt-1 flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Navigation size={12} />
                    距目的地约 533 km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    预计到达 2026-06-21 02:18
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck size={12} />
                    当前速度 78 km/h
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 min-w-[360px]">
              <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="text-xs text-white/70">已行驶里程</div>
                <div className="text-2xl font-bold mt-1">682<span className="text-sm font-normal ml-0.5">km</span></div>
                <Progress percent={56} size="small" showInfo={false} strokeColor="#fff" trailColor="rgba(255,255,255,0.2)" />
              </div>
              <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="text-xs text-white/70">剩余时间</div>
                <div className="text-2xl font-bold mt-1">5.2<span className="text-sm font-normal ml-0.5">时</span></div>
                <Progress percent={100 - 56} size="small" showInfo={false} strokeColor="#FDE68A" trailColor="rgba(255,255,255,0.2)" />
              </div>
              <div className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="text-xs text-white/70">准时率</div>
                <div className="text-2xl font-bold mt-1">98<span className="text-sm font-normal ml-0.5">%</span></div>
                <Progress percent={98} size="small" showInfo={false} strokeColor="#86EFAC" trailColor="rgba(255,255,255,0.2)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <Card
            className="!rounded-2xl !border border-gray-100"
            title={
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-orange to-amber-400" />
                <span className="font-bold text-deep-blue-900">关键节点时间轴</span>
              </div>
            }
            extra={
              <Button type="link" className="!text-primary-orange !font-medium">
                查看完整轨迹
              </Button>
            }
          >
            <Timeline
              mode="left"
              items={timelineEvents.map((t, idx) => ({
                color: t.color,
                dot: (
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center -ml-0.5 ${
                      idx === 3 ? "animate-pulse shadow-soft-orange" : ""
                    }`}
                    style={{ backgroundColor: t.color }}
                  >
                    {t.dot}
                  </div>
                ),
                children: (
                  <div className="pb-5 pl-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-deep-blue-900">{t.title}</span>
                      <Tag className="!text-[10px] !m-0 !px-2 !py-0">操作：{t.actionBy}</Tag>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 mb-2">{t.time}</div>
                    <div className="text-sm text-gray-600 leading-relaxed">{t.desc}</div>
                    {t.extra}
                  </div>
                ),
              }))}
            />
          </Card>

          <Card
            className="!rounded-2xl !border border-gray-100"
            title={
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-deep-blue-500 to-blue-400" />
                <span className="font-bold text-deep-blue-900">装卸货地址 & 运输路径</span>
              </div>
            }
            extra={
              <Tag color="blue" className="!rounded-full">
                1,215 km · 约16.5小时
              </Tag>
            }
          >
            <div className="h-48 rounded-xl overflow-hidden mb-5">
              <RouteMapSVG />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-orange flex items-center justify-center">
                    <MapPin size={14} className="text-white" />
                  </div>
                  <span className="font-bold text-deep-blue-900">装货地</span>
                  <Tag color="orange" className="!text-[10px] !m-0 !ml-auto">
                    已装载
                  </Tag>
                </div>
                <div className="font-semibold text-deep-blue-900">上海市 · 浦东新区</div>
                <div className="text-sm text-gray-600 mt-1">张江高科技园区博云路2号 浦软大厦1楼仓库</div>
                <Divider className="!my-3" />
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400">联系人：</span>
                    <span className="font-medium text-gray-700">王经理</span>
                  </div>
                  <div>
                    <span className="text-gray-400">电话：</span>
                    <span className="font-medium text-gray-700">138-****-8888</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                  <div>
                    <span className="text-gray-400">装货时间：</span>
                    <span className="font-medium text-gray-700">2026-06-20 10:30</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-deep-blue-50 border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-deep-blue flex items-center justify-center">
                    <Navigation size={14} className="text-white" />
                  </div>
                  <span className="font-bold text-deep-blue-900">卸货地</span>
                  <Tag color="default" className="!text-[10px] !m-0 !ml-auto">
                    待送达
                  </Tag>
                </div>
                <div className="font-semibold text-deep-blue-900">北京市 · 朝阳区</div>
                <div className="text-sm text-gray-600 mt-1">望京街道阜通东大街6号 望京SOHO T3 B2停车场</div>
                <Divider className="!my-3" />
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400">联系人：</span>
                    <span className="font-medium text-gray-700">李主管</span>
                  </div>
                  <div>
                    <span className="text-gray-400">电话：</span>
                    <span className="font-medium text-gray-700">139-****-6666</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                  <div>
                    <span className="text-gray-400">要求送达：</span>
                    <span className="font-medium text-gray-700">2026-06-21 04:00 前</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="!rounded-2xl !border border-gray-100"
            title={
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-400" />
                <span className="font-bold text-deep-blue-900">费用结算单</span>
              </div>
            }
            extra={
              <div className="flex items-center gap-2">
                <Tag color="orange" className="!rounded-full">
                  状态：结算中
                </Tag>
                <Button size="small" icon={<FileText size={12} />}>下载凭证</Button>
              </div>
            }
          >
            <Table<CostItem>
              columns={costColumns}
              dataSource={costData}
              pagination={false}
              size="middle"
              className="!mb-4"
            />
            <div className="p-5 rounded-xl bg-gradient-to-r from-deep-blue to-blue-700 text-white">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-white/70">运费总额</div>
                  <div className="text-2xl font-bold mt-1">¥{totalAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-white/70">已支付预付款（30%）</div>
                  <div className="text-2xl font-bold mt-1 text-green-300">¥{paidAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-white/70">签收后应付尾款</div>
                  <div className="text-2xl font-bold mt-1 text-orange-300">¥{remainingAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="!rounded-2xl !border border-gray-100 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-deep-blue via-blue-600 to-blue-400 -m-6 mb-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-white/20 blur-xl" />
                <div className="absolute -bottom-6 left-8 w-16 h-16 rounded-full bg-white/20 blur-lg" />
              </div>
            </div>
            <div className="relative -mt-16 mb-3">
              <div className="flex items-end gap-4 px-2">
                <Avatar
                  size={72}
                  className="!bg-gradient-primary !text-white !font-bold !text-2xl !border-4 !border-white !shadow-lg"
                >
                  Z
                </Avatar>
                <div className="pb-2">
                  <div className="text-lg font-bold text-deep-blue-900">张建国</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge status="success" text={<span className="text-xs text-success-600 font-medium">在线中</span>} />
                    <Tag color="gold" className="!text-[10px] !m-0">
                      金牌司机
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
            <Descriptions column={1} size="small" className="!mb-4" colon={false}>
              <Descriptions.Item label={<span className="text-gray-400 !text-xs">车牌号</span>}>
                <span className="font-mono font-semibold text-deep-blue-900">京A·88888</span>
                <Tag color="blue" className="!ml-2 !text-[10px] !m-0">黄牌</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-400 !text-xs">车辆类型</span>}>
                <span className="font-medium text-gray-700">13米高栏货车</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-400 !text-xs">联系电话</span>}>
                <span className="font-mono font-semibold">138-****-8888</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-400 !text-xs">服务评分</span>}>
                <div className="flex items-center gap-1">
                  <Rate disabled allowHalf value={4.9} className="!text-xs !mb-0" />
                  <span className="font-bold text-warning-500 ml-1">4.9</span>
                  <span className="text-xs text-gray-400">/ 5.0</span>
                </div>
              </Descriptions.Item>
            </Descriptions>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2.5 rounded-xl bg-green-50">
                <div className="text-xs text-gray-400">完成单</div>
                <div className="text-lg font-bold text-success-600 mt-0.5">1,286</div>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-orange-50">
                <div className="text-xs text-gray-400">完成率</div>
                <div className="text-lg font-bold text-primary-orange mt-0.5">98.5%</div>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-blue-50">
                <div className="text-xs text-gray-400">准点率</div>
                <div className="text-lg font-bold text-deep-blue mt-0.5">97.8%</div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-1.5">
                <Tag color="green" className="!m-0 !text-[10px]">危险品资质</Tag>
                <Tag color="blue" className="!m-0 !text-[10px]">冷链资质</Tag>
                <Tag color="purple" className="!m-0 !text-[10px]">全程保险</Tag>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                type="primary"
                size="large"
                icon={<Phone size={16} />}
                className="!flex-1 !rounded-xl !bg-gradient-primary !border-0 hover:!brightness-105 !h-10"
              >
                电话联系
              </Button>
              <Button
                size="large"
                icon={<MessageSquare size={16} />}
                className="!flex-1 !rounded-xl !h-10 !border-deep-blue/20 !text-deep-blue hover:!bg-deep-blue/5"
              >
                消息沟通
              </Button>
            </div>
          </Card>

          <Card
            className="!rounded-2xl !border border-gray-100"
            title={
              <div className="flex items-center gap-2">
                <Package size={16} className="text-deep-blue" />
                <span className="font-bold text-deep-blue-900 text-sm">货物明细</span>
              </div>
            }
          >
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label={<span className="text-gray-400 !text-xs">货物名称</span>}>
                <span className="font-medium text-deep-blue-900">电子产品（智能手机/平板）</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-400 !text-xs">货物品类</span>}>
                <Tag color="blue" className="!m-0">电子产品</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-400 !text-xs">包装方式</span>}>
                <span className="font-medium text-gray-700">标准纸箱 · 木托盘加固</span>
              </Descriptions.Item>
            </Descriptions>
            <Divider className="!my-3" />
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 rounded-lg bg-slate-50">
                <div className="text-[10px] text-gray-400 mb-1">重量</div>
                <div className="text-base font-bold text-deep-blue-900">12.5<span className="text-xs font-normal ml-0.5 text-gray-400">吨</span></div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-50">
                <div className="text-[10px] text-gray-400 mb-1">体积</div>
                <div className="text-base font-bold text-deep-blue-900">65<span className="text-xs font-normal ml-0.5 text-gray-400">m³</span></div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-50">
                <div className="text-[10px] text-gray-400 mb-1">件数</div>
                <div className="text-base font-bold text-deep-blue-900">800<span className="text-xs font-normal ml-0.5 text-gray-400">件</span></div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-orange-100 flex items-start gap-2">
              <Shield size={14} className="text-primary-orange mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <span className="font-semibold text-deep-blue-900">保额：</span>
                ¥128,000.00（货值全额投保）
                <span className="text-gray-400 block mt-0.5">承保：平安保险 · 保单号 PA20260620000012345</span>
              </div>
            </div>
          </Card>

          <Card
            className="!rounded-2xl !border border-gray-100"
            title={
              <div className="flex items-center gap-2">
                <Map size={16} className="text-primary-orange" />
                <span className="font-bold text-deep-blue-900 text-sm">实时轨迹</span>
                <Tag color="orange" className="!text-[10px] !ml-2 !m-0 animate-pulse">LIVE</Tag>
              </div>
            }
            extra={
              <Button type="link" size="small" className="!text-primary-orange !p-0">
                全屏查看 <ChevronRight size={12} className="inline" />
              </Button>
            }
          >
            <div className="h-52 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center border border-dashed border-gray-200 mb-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm mb-3">
                  <Map size={26} className="text-primary-orange animate-pulse" />
                </div>
                <div className="text-sm font-semibold text-deep-blue-900 mb-1">实时轨迹地图（占位）</div>
                <div className="text-xs text-gray-400">集成高德/百度地图 API</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-orange/5 to-orange-50 border border-primary-orange/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">当前位置</span>
                <span className="text-xs font-semibold text-primary-orange">连霍高速 · K682</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">经纬度</span>
                <span className="text-xs font-mono font-medium text-deep-blue-900">34.2361° N, 117.5432° E</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">行驶速度</span>
                <span className="text-sm font-bold text-deep-blue-900">78 <span className="text-xs font-normal text-gray-400">km/h</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">预计到达</span>
                <span className="text-sm font-bold text-success-600">2026-06-21 02:18</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">行驶时长</span>
                <span className="text-xs font-medium text-deep-blue-900">11 时 23 分</span>
              </div>
            </div>
            <div className="h-32 mt-4">
              <ReactECharts option={trackOption} style={{ height: "100%", width: "100%" }} notMerge />
            </div>
          </Card>

          <Card
            className="!rounded-2xl !border-2 !border-primary-orange/30 bg-gradient-to-br from-orange-50/50 to-white"
            title={
              <div className="flex items-center gap-2">
                <Signature size={18} className="text-primary-orange" />
                <span className="font-bold text-deep-blue-900">签收确认</span>
              </div>
            }
            extra={<Tag color="warning" className="!rounded-full">待签收</Tag>}
          >
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-warning-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-deep-blue-900 text-sm">签收前请确认</div>
                    <div className="text-xs text-gray-500 mt-0.5">请在货物送达并验收无误后进行签收操作</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox defaultChecked />
                    <span className="text-xs text-gray-600">货物外观完好，包装无破损、无浸水</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox defaultChecked />
                    <span className="text-xs text-gray-600">数量核对无误，共 800 件 / 12.5 吨</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox />
                    <span className="text-xs text-gray-600">我已阅读并同意签收即代表运单完成的相关规则</span>
                  </label>
                </div>
              </div>
              <Button
                type="primary"
                block
                size="large"
                icon={<Signature size={16} />}
                className="!h-12 !rounded-xl !bg-gradient-primary !border-0 hover:!brightness-105 !font-bold shadow-soft-orange"
                onClick={() => setSignModalOpen(true)}
              >
                确认签收货物
              </Button>
              <div className="text-center text-xs text-gray-400">
                超时未签收，系统将于 48 小时后自动确认
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-success-500/10 flex items-center justify-center">
              <Signature size={18} className="text-success-500" />
            </div>
            <span className="font-bold text-deep-blue-900 text-lg">签收确认 & 服务评价</span>
          </div>
        }
        open={signModalOpen}
        onCancel={() => setSignModalOpen(false)}
        onOk={() => {
          message.success("签收成功！感谢您的评价");
          setSignModalOpen(false);
        }}
        okText="确认签收提交"
        cancelText="取消"
        width={560}
        okButtonProps={{
          className: "!bg-gradient-primary !border-0 hover:!brightness-105 !rounded-xl !h-10 !px-8 !font-bold",
        }}
      >
        <div className="space-y-5 pt-2">
          <Alert
            type="success"
            showIcon
            message="确认货物已安全送达？"
            description="签收后运费尾款将结算至司机账户，如有货损请先申诉再签收"
            className="!rounded-xl"
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-deep-blue-900">整体服务评分</span>
              <span className="text-2xl font-bold text-primary-orange">{signRating}.0</span>
            </div>
            <Rate value={signRating} onChange={setSignRating} className="!text-2xl" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "运输时效", value: 5 },
              { label: "服务态度", value: 5 },
              { label: "货物完好", value: 5 },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-slate-50 text-center">
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <Rate disabled allowHalf value={s.value} className="!text-xs" />
              </div>
            ))}
          </div>
          <div>
            <div className="text-sm font-semibold text-deep-blue-900 mb-2">文字评价（选填）</div>
            <TextArea
              rows={3}
              placeholder="分享您的体验，帮助其他货主选择优质司机..."
              value={signComment}
              onChange={(e) => setSignComment(e.target.value)}
              maxLength={300}
              showCount
              className="!rounded-xl"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["准时送达", "服务专业", "货物完好", "沟通顺畅", "推荐合作"].map((tag) => (
              <Tag
                key={tag}
                className="!cursor-pointer !m-0 !px-3 !py-1 !rounded-full !text-xs hover:!bg-primary-orange hover:!text-white transition-colors"
                color="orange"
              >
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
