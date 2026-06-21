import { useState } from "react";
import {
  Card,
  Tag,
  Button,
  Row,
  Col,
  Progress,
  Divider,
  Table,
  Rate,
  Avatar,
  Tooltip,
  Modal,
  Tabs,
  Badge,
  Statistic,
  Descriptions,
  Timeline,
} from "antd";
import type { TableProps, TabsProps } from "antd";
import {
  Shield,
  Star,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  ChevronRight,
  Eye,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Package,
  Banknote,
  User,
  Heart,
  Sparkles,
  Info,
  Rocket,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import ReactECharts from "echarts-for-react";

const creditGaugeOption = {
  series: [
    {
      type: "gauge",
      center: ["50%", "62%"],
      radius: "95%",
      startAngle: 210,
      endAngle: -30,
      min: 300,
      max: 900,
      splitNumber: 6,
      axisLine: {
        lineStyle: {
          width: 28,
          color: [
            [0.25, "#EF4444"],
            [0.5, "#F59E0B"],
            [0.75, "#3B82F6"],
            [0.92, "#10B981"],
            [1, "#FF6B1A"],
          ],
        },
      },
      pointer: {
        icon: "path://M2,11 L10,11 L10,13 L2,13 Z",
        length: "60%",
        width: 10,
        offsetCenter: [0, "-8%"],
        itemStyle: {
          color: "#FF6B1A",
          shadowColor: "rgba(255,107,26,0.5)",
          shadowBlur: 10,
        },
      },
      axisTick: {
        distance: -32,
        length: 8,
        lineStyle: { color: "#fff", width: 2 },
      },
      splitLine: {
        distance: -36,
        length: 14,
        lineStyle: { color: "#fff", width: 3 },
      },
      axisLabel: {
        color: "#64748B",
        distance: -10,
        fontSize: 11,
        formatter: (v: number) => {
          const labels: Record<number, string> = { 400: "D", 500: "C", 600: "B", 700: "A", 800: "AA", 900: "AAA" };
          return labels[v] || "";
        },
      },
      anchor: {
        show: true,
        showAbove: true,
        size: 20,
        itemStyle: {
          color: "#FF6B1A",
          borderWidth: 6,
          borderColor: "#fff",
          shadowColor: "rgba(255,107,26,0.4)",
          shadowBlur: 12,
        },
      },
      title: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 52,
        fontWeight: "bold",
        offsetCenter: [0, "5%"],
        formatter: (v: number) => Math.round(v),
        color: "#0A2342",
      },
      data: [{ value: 782 }],
    },
  ],
  graphic: [
    {
      type: "text",
      left: "center",
      bottom: "12%",
      style: {
        text: "当前信用等级",
        fill: "#94A3B8",
        fontSize: 12,
        fontWeight: 500,
      },
    },
    {
      type: "text",
      left: "center",
      bottom: "3%",
      style: {
        text: "AAA 级优质货主",
        fill: "#FF6B1A",
        fontSize: 18,
        fontWeight: 700,
      },
    },
  ],
};

const radarOption = {
  tooltip: {
    backgroundColor: "rgba(10,35,66,0.95)",
    borderColor: "transparent",
    textStyle: { color: "#fff", fontSize: 12 },
  },
  legend: {
    data: ["当前得分", "AAA级标准"],
    bottom: 0,
    icon: "roundRect",
    itemWidth: 12,
    itemHeight: 8,
    itemGap: 20,
    textStyle: { color: "#64748B", fontSize: 12 },
  },
  radar: {
    indicator: [
      { name: "按时付款", max: 100 },
      { name: "好评率", max: 100 },
      { name: "低纠纷率", max: 100 },
      { name: "合同履约", max: 100 },
      { name: "信息真实", max: 100 },
    ],
    shape: "polygon",
    splitNumber: 4,
    axisName: {
      color: "#0A2342",
      fontSize: 12,
      fontWeight: 500,
    },
    splitLine: { lineStyle: { color: "#E2E8F0" } },
    splitArea: {
      areaStyle: {
        color: ["rgba(255,255,255,1)", "rgba(248,250,252,1)", "rgba(241,245,249,1)", "rgba(226,232,240,0.5)"],
      },
    },
    axisLine: { lineStyle: { color: "#CBD5E1" } },
  },
  series: [
    {
      type: "radar",
      data: [
        {
          value: [96, 94, 98, 95, 92],
          name: "当前得分",
          symbol: "circle",
          symbolSize: 8,
          lineStyle: { color: "#FF6B1A", width: 2.5 },
          itemStyle: { color: "#FF6B1A", borderWidth: 2, borderColor: "#fff" },
          areaStyle: {
            color: {
              type: "radial",
              x: 0.5, y: 0.5, r: 0.5,
              colorStops: [
                { offset: 0, color: "rgba(255,107,26,0.45)" },
                { offset: 1, color: "rgba(255,107,26,0.12)" },
              ],
            },
          },
        },
        {
          value: [95, 92, 95, 93, 90],
          name: "AAA级标准",
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: "#0A2342", width: 2, type: "dashed" },
          itemStyle: { color: "#0A2342" },
          areaStyle: {
            color: "rgba(10,35,66,0.05)",
          },
        },
      ],
    },
  ],
};

const historyOption = {
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "cross", crossStyle: { color: "#999" } },
    backgroundColor: "rgba(10,35,66,0.95)",
    borderColor: "transparent",
    textStyle: { color: "#fff", fontSize: 12 },
    formatter: (params: any) => {
      let html = `<div class="font-bold mb-2">${params[0].axisValue}</div>`;
      params.forEach((p: any) => {
        const color = p.seriesName === "GMV(万)" ? "#FF6B1A" : "#0A2342";
        const unit = p.seriesName === "GMV(万)" ? " 万元" : " 单";
        html += `<div class="flex items-center gap-2 my-1"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span><span>${p.seriesName}：</span><span style="font-weight:bold;color:${color}">${p.value.toLocaleString()}${unit}</span></div>`;
      });
      return html;
    },
  },
  legend: {
    data: ["GMV(万)", "订单数"],
    right: 0,
    top: 0,
    icon: "roundRect",
    itemWidth: 12,
    itemHeight: 8,
    itemGap: 20,
    textStyle: { color: "#64748B", fontSize: 12 },
  },
  grid: { left: "3%", right: "3%", bottom: "3%", top: "12%", containLabel: true },
  xAxis: [
    {
      type: "category",
      data: ["7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月", "4月", "5月", "6月"],
      axisLine: { lineStyle: { color: "#E2E8F0" } },
      axisLabel: { color: "#94A3B8", fontSize: 11 },
      axisTick: { show: false },
    },
  ],
  yAxis: [
    {
      type: "value",
      name: "GMV(万)",
      nameTextStyle: { color: "#94A3B8", fontSize: 11, padding: [0, 40, 0, 0] },
      axisLine: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 11 },
      splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
    },
    {
      type: "value",
      name: "订单数",
      nameTextStyle: { color: "#94A3B8", fontSize: 11, padding: [0, 0, 0, 40] },
      axisLine: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 11 },
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: "GMV(万)",
      type: "bar",
      barWidth: "45%",
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "#FF6B1A" },
            { offset: 1, color: "#FFBE8E" },
          ],
        },
      },
      emphasis: {
        itemStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#F05400" },
              { offset: 1, color: "#FF9A54" },
            ],
          },
        },
      },
      data: [186, 198, 215, 228, 245, 258, 232, 218, 248, 262, 278, 286],
    },
    {
      name: "订单数",
      type: "line",
      yAxisIndex: 1,
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      lineStyle: { color: "#0A2342", width: 3 },
      itemStyle: { color: "#0A2342", borderWidth: 3, borderColor: "#fff" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(10,35,66,0.18)" },
            { offset: 1, color: "rgba(10,35,66,0.01)" },
          ],
        },
      },
      data: [48, 52, 58, 62, 68, 72, 62, 56, 65, 70, 76, 78],
    },
  ],
};

interface Review {
  key: string;
  driverName: string;
  avatar: string;
  rating: number;
  date: string;
  orderNo: string;
  route: string;
  tags: string[];
  content: string;
  helpful: number;
}

const mockReviews: Review[] = [
  {
    key: "1",
    driverName: "张建国",
    avatar: "Z",
    rating: 5,
    date: "2026-06-18",
    orderNo: "WD20260618012",
    route: "上海 → 北京",
    tags: ["付款准时", "沟通顺畅", "货物清晰", "长期合作"],
    content: "非常专业的货主企业，装货安排有序，现场人员态度很好，运费结算及时准确。下次有合适的货源一定优先合作！",
    helpful: 28,
  },
  {
    key: "2",
    driverName: "李卫东",
    avatar: "L",
    rating: 5,
    date: "2026-06-15",
    orderNo: "WD20260615008",
    route: "广州 → 深圳",
    tags: ["优质货主", "装卸高效", "付款迅速"],
    content: "卸货地址详细准确，现场有专人对接，整个流程非常顺畅。最关键的是签收后当天就收到运费了，强烈推荐！",
    helpful: 35,
  },
  {
    key: "3",
    driverName: "王志强",
    avatar: "W",
    rating: 4.5,
    date: "2026-06-12",
    orderNo: "WD20260612003",
    route: "成都 → 重庆",
    tags: ["信息真实", "付款准时", "建议装货更快"],
    content: "货源信息真实可靠，运费一分不少。唯一小建议是装货时能提前准备好，这样效率会更高。总体合作非常愉快。",
    helpful: 19,
  },
  {
    key: "4",
    driverName: "赵文博",
    avatar: "Z",
    rating: 5,
    date: "2026-06-08",
    orderNo: "WD20260608015",
    route: "北京 → 天津",
    tags: ["企业正规", "合同规范", "付款及时", "五星好评"],
    content: "正规大企业合作就是省心，合同条款清晰，没有任何隐形费用。每次结款都比预计时间还要早，必须给五星！",
    helpful: 42,
  },
  {
    key: "5",
    driverName: "孙明辉",
    avatar: "S",
    rating: 5,
    date: "2026-06-05",
    orderNo: "WD20260605002",
    route: "杭州 → 上海",
    tags: ["沟通愉快", "货物标准", "值得信赖"],
    content: "和这家货主合作快半年了，从来没有出现过纠纷。货损处理态度好，沟通也很及时，是我心目中的理想合作方。",
    helpful: 31,
  },
];

const tagCloudData = [
  { text: "付款准时", count: 156, size: 20, color: "#FF6B1A" },
  { text: "优质货主", count: 142, size: 18, color: "#0A2342" },
  { text: "信息真实", count: 138, size: 17, color: "#10B981" },
  { text: "装卸高效", count: 125, size: 16, color: "#3B82F6" },
  { text: "沟通顺畅", count: 118, size: 15, color: "#8B5CF6" },
  { text: "货物清晰", count: 96, size: 14, color: "#F59E0B" },
  { text: "合同规范", count: 89, size: 13, color: "#EF4444" },
  { text: "长期合作", count: 85, size: 13, color: "#06B6D4" },
  { text: "五星好评", count: 78, size: 12, color: "#EC4899" },
  { text: "企业正规", count: 72, size: 12, color: "#6366F1" },
  { text: "值得信赖", count: 68, size: 11, color: "#14B8A6" },
  { text: "付款迅速", count: 65, size: 11, color: "#F97316" },
  { text: "现场专业", count: 58, size: 10, color: "#0EA5E9" },
  { text: "价格合理", count: 52, size: 10, color: "#84CC16" },
  { text: "处理及时", count: 48, size: 9, color: "#A855F7" },
  { text: "无隐形费", count: 45, size: 9, color: "#F43F5E" },
  { text: "单据齐全", count: 42, size: 8, color: "#0284C7" },
  { text: "路线清晰", count: 38, size: 8, color: "#059669" },
  { text: "装货有序", count: 35, size: 8, color: "#D97706" },
  { text: "结算透明", count: 32, size: 8, color: "#DC2626" },
];

const reviewColumns: TableProps<Review>["columns"] = [
  {
    title: "司机信息",
    key: "driver",
    width: 180,
    render: (_, r) => (
      <div className="flex items-center gap-3">
        <Avatar size={42} className="!bg-gradient-primary !text-white !font-bold !text-base">
          {r.avatar}
        </Avatar>
        <div className="min-w-0">
          <div className="font-semibold text-deep-blue-900 flex items-center gap-1.5">
            {r.driverName}
            <Tag color="gold" className="!text-[10px] !m-0">金牌</Tag>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Rate disabled allowHalf value={r.rating} className="!text-xs !mb-0" />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "关联运单",
    key: "order",
    width: 220,
    render: (_, r) => (
      <div>
        <div className="font-mono text-xs font-medium text-deep-blue-700">{r.orderNo}</div>
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
          <Package size={10} className="text-gray-400" />
          {r.route}
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
          <Calendar size={9} />
          {r.date}
        </div>
      </div>
    ),
  },
  {
    title: "标签",
    dataIndex: "tags",
    key: "tags",
    width: 240,
    render: (tags) => (
      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <Tag key={t} color="orange" className="!m-0 !text-[10px] !px-2 !py-0.5 !rounded-full">
            {t}
          </Tag>
        ))}
      </div>
    ),
  },
  {
    title: "评价内容",
    dataIndex: "content",
    key: "content",
    ellipsis: true,
    render: (v) => <span className="text-sm text-gray-600 leading-relaxed">{v}</span>,
  },
  {
    title: "有用",
    dataIndex: "helpful",
    key: "helpful",
    width: 90,
    align: "center",
    render: (v) => (
      <Tooltip title="司机觉得这条评价有用">
        <span className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-orange cursor-pointer transition-colors">
          <ThumbsUp size={12} />
          {v}
        </span>
      </Tooltip>
    ),
  },
];

const creditTimeline = [
  {
    color: "#10B981",
    icon: <Award size={12} className="text-white" />,
    title: "信用分突破 780 分，晋升 AAA 级",
    time: "2026-06-10",
    desc: "连续 6 个月按时付款率 100%，好评率 95%+",
  },
  {
    color: "#3B82F6",
    icon: <CheckCircle2 size={12} className="text-white" />,
    title: "企业信息认证通过",
    time: "2026-05-28",
    desc: "完成企业营业执照、法人身份、对公账户三重认证",
  },
  {
    color: "#FF6B1A",
    icon: <TrendingUp size={12} className="text-white" />,
    title: "月度 GMV 创新高",
    time: "2026-05-01",
    desc: "4 月完成 GMV 262 万，信用分 +15",
  },
  {
    color: "#8B5CF6",
    icon: <Sparkles size={12} className="text-white" />,
    title: "获得「优质货主」专属标识",
    time: "2026-04-15",
    desc: "前 10% 优质货主，享受优先匹配、费率优惠等权益",
  },
  {
    color: "#F59E0B",
    icon: <Shield size={12} className="text-white" />,
    title: "信用修复：1 条不良记录已清除",
    time: "2026-03-20",
    desc: "历史纠纷已妥善解决，系统自动恢复信用分 +20",
  },
];

export default function ShipperCredit() {
  const [reviewTab, setReviewTab] = useState("all");
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const reviewTabs: TabsProps["items"] = [
    {
      key: "all",
      label: (
        <span className="!px-1">
          <Badge count={156} size="small" offset={[8, -2]}>
            <span className="flex items-center gap-1.5">
              <MessageSquare size={14} />
              全部评价
            </span>
          </Badge>
        </span>
      ),
    },
    {
      key: "good",
      label: (
        <span className="flex items-center gap-1.5 !px-1">
          <ThumbsUp size={14} />
          好评
          <Tag color="green" className="!text-[10px] !m-0 !ml-1">148</Tag>
        </span>
      ),
    },
    {
      key: "mid",
      label: (
        <span className="flex items-center gap-1.5 !px-1">
          <MessageSquare size={14} />
          中评
          <Tag color="warning" className="!text-[10px] !m-0 !ml-1">6</Tag>
        </span>
      ),
    },
    {
      key: "bad",
      label: (
        <span className="flex items-center gap-1.5 !px-1">
          <AlertTriangle size={14} />
          差评
          <Tag color="red" className="!text-[10px] !m-0 !ml-1">2</Tag>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-deep-blue-900">信用中心</h1>
          <p className="text-sm text-gray-500 mt-1">查看信用评分、分析维度及司机评价</p>
        </div>
        <div className="flex items-center gap-3">
          <Button icon={<FileText size={15} />} className="!h-10 !px-4 !rounded-xl">
            下载信用报告
          </Button>
          <Button
            type="primary"
            icon={<Rocket size={15} />}
            className="!h-10 !px-5 !rounded-xl !font-medium !bg-gradient-primary !border-0 hover:!brightness-105 shadow-soft-orange"
          >
            提升信用
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="!rounded-2xl !border border-gray-100 lg:col-span-1 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-orange to-amber-400" />
              <span className="font-bold text-deep-blue-900">信用评分总览</span>
            </div>
            <Tooltip title="信用分满分 900，等级划分参考 AAA/AA/A/B/C/D">
              <Info size={15} className="text-gray-400 cursor-help" />
            </Tooltip>
          </div>
          <div className="h-72 -mx-4 -mt-4">
            <ReactECharts option={creditGaugeOption} style={{ height: "100%", width: "100%" }} notMerge />
          </div>

          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">距离下一等级 (AAA+ 850+)</span>
              <span className="font-semibold text-deep-blue-900">还差 68 分</span>
            </div>
            <Progress percent={Math.round(((782 - 700) / (850 - 700)) * 100)} showInfo={false} strokeColor={{ "0%": "#FF6B1A", "100%": "#FFBE8E" }} trailColor="#F1F5F9" />

            <div className="grid grid-cols-4 gap-2 mt-4 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
              <div className="text-center">
                <div className="text-xs text-gray-500">AAA</div>
                <div className="text-sm font-bold text-primary-orange mt-1">前 8%</div>
              </div>
              <div className="text-center border-l border-orange-200">
                <div className="text-xs text-gray-500">授信额度</div>
                <div className="text-sm font-bold text-deep-blue-900 mt-1">¥50万</div>
              </div>
              <div className="text-center border-l border-orange-200">
                <div className="text-xs text-gray-500">平台费率</div>
                <div className="text-sm font-bold text-success-600 mt-1">1.2%</div>
              </div>
              <div className="text-center border-l border-orange-200">
                <div className="text-xs text-gray-500">权益等级</div>
                <div className="text-sm font-bold text-deep-blue-900 mt-1 flex items-center justify-center gap-0.5">
                  <Crown size={12} className="text-warning-500" fill="#F59E0B" />
                  钻石
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="!rounded-2xl !border border-gray-100 lg:col-span-1"
          title={
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-deep-blue-500 to-blue-400" />
              <span className="font-bold text-deep-blue-900">信用五维分析</span>
            </div>
          }
          extra={
            <Tooltip title="雷达图展示您在五个维度的表现与AAA级标准对比">
              <Tag color="blue" className="!rounded-full">5 大维度</Tag>
            </Tooltip>
          }
        >
          <div className="h-80">
            <ReactECharts option={radarOption} style={{ height: "100%", width: "100%" }} notMerge />
          </div>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {[
              { label: "按时付款", value: 96, color: "#FF6B1A" },
              { label: "好评率", value: 94, color: "#3B82F6" },
              { label: "低纠纷", value: 98, color: "#10B981" },
              { label: "合同履约", value: 95, color: "#8B5CF6" },
              { label: "信息真实", value: 92, color: "#F59E0B" },
            ].map((m) => (
              <div key={m.label} className="text-center p-2 rounded-lg bg-slate-50">
                <div className="text-[10px] text-gray-500 mb-1">{m.label}</div>
                <div className="text-base font-bold" style={{ color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="!rounded-2xl !border border-gray-100 lg:col-span-1"
          title={
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-400" />
              <span className="font-bold text-deep-blue-900">信用成长记录</span>
            </div>
          }
          extra={
            <Button type="link" size="small" className="!text-primary-orange !p-0">
              完整记录 <ChevronRight size={12} className="inline" />
            </Button>
          }
        >
          <Timeline
            mode="left"
            items={creditTimeline.map((t) => ({
              color: t.color,
              dot: (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: t.color }}
                >
                  {t.icon}
                </div>
              ),
              children: (
                <div className="pb-4">
                  <div className="text-sm font-semibold text-deep-blue-900">{t.title}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 mb-1">{t.time}</div>
                  <div className="text-xs text-gray-500">{t.desc}</div>
                </div>
              ),
            }))}
          />
        </Card>
      </div>

      <Card
        className="!rounded-2xl !border border-gray-100"
        title={
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-orange to-amber-400" />
            <span className="font-bold text-deep-blue-900">历史交易统计</span>
            <Tag color="orange" className="!ml-2 !rounded-full">近 12 个月</Tag>
          </div>
        }
        extra={
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-gray-400">累计 GMV</div>
              <div className="text-lg font-bold text-primary-orange flex items-center gap-1">
                ¥ 2,894 万
                <span className="text-[10px] text-success-500 flex items-center font-normal">
                  <ArrowUpRight size={10} />
                  +28.6%
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">累计订单</div>
              <div className="text-lg font-bold text-deep-blue-900 flex items-center gap-1">
                795 单
                <span className="text-[10px] text-success-500 flex items-center font-normal">
                  <ArrowUpRight size={10} />
                  +32.4%
                </span>
              </div>
            </div>
          </div>
        }
      >
        <div className="h-80">
          <ReactECharts option={historyOption} style={{ height: "100%", width: "100%" }} notMerge />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card
          className="!rounded-2xl !border border-gray-100 lg:col-span-1"
          title={
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-primary-orange" />
              <span className="font-bold text-deep-blue-900">司机评价标签云</span>
            </div>
          }
          extra={
            <Tag color="green" className="!rounded-full">
              共 {tagCloudData.reduce((s, t) => s + t.count, 0)} 次打标
            </Tag>
          }
        >
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 via-white to-orange-50/50 min-h-[280px] flex flex-wrap items-center justify-center gap-x-3 gap-y-2 content-center">
            {tagCloudData.map((t) => (
              <span
                key={t.text}
                className="inline-block cursor-pointer hover:scale-110 transition-transform"
                style={{
                  fontSize: t.size,
                  fontWeight: t.size >= 14 ? 600 : 500,
                  color: t.color,
                  padding: "4px 10px",
                  borderRadius: 999,
                  backgroundColor: `${t.color}12`,
                }}
              >
                {t.text}
                <span className="ml-1 text-[10px] opacity-60">{t.count}</span>
              </span>
            ))}
          </div>
          <Divider className="!my-4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-green-50 border border-green-100">
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <ThumbsUp size={11} className="text-success-500" />
                好评率
              </div>
              <div className="text-xl font-bold text-success-600">94.9%</div>
              <Progress percent={95} size="small" showInfo={false} strokeColor="#10B981" className="!mt-1" />
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-info-500" />
                按时付款
              </div>
              <div className="text-xl font-bold text-info-600">98.2%</div>
              <Progress percent={98} size="small" showInfo={false} strokeColor="#3B82F6" className="!mt-1" />
            </div>
          </div>
        </Card>

        <Card
          className="!rounded-2xl !border border-gray-100 lg:col-span-2"
          title={
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-deep-blue" />
              <span className="font-bold text-deep-blue-900">司机对货主的评价</span>
            </div>
          }
          extra={
            <div className="flex items-center gap-3">
              <Tabs activeKey={reviewTab} onChange={setReviewTab} items={reviewTabs} size="small" />
            </div>
          }
        >
          <Table<Review>
            columns={reviewColumns}
            dataSource={mockReviews}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条评价`,
              pageSize: 5,
              size: "default",
            }}
            size="middle"
            rowKey="key"
            className="!text-sm"
            expandable={{
              expandedRowRender: (record) => (
                <div className="p-5 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100">
                  <div className="flex items-start gap-4">
                    <Avatar size={56} className="!bg-gradient-primary !text-white !font-bold !text-xl">
                      {record.avatar}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <div className="font-bold text-deep-blue-900 text-base flex items-center gap-2">
                            {record.driverName}
                            <Tag color="gold">金牌司机</Tag>
                            <Rate disabled allowHalf value={record.rating} className="!text-sm !mb-0" />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            运单 {record.orderNo} · {record.route} · 评价于 {record.date}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <ThumbsUp size={14} />
                          {record.helpful} 位司机觉得有用
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-700 leading-relaxed p-4 rounded-lg bg-white border border-gray-100">
                        "{record.content}"
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {record.tags.map((t) => (
                          <Tag
                            key={t}
                            className="!m-0 !text-xs !px-2.5 !py-0.5 !rounded-full"
                            color="orange"
                          >
                            #{t}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ),
              expandIcon: ({ expanded, onExpand, record }) => (
                <Button
                  type="link"
                  size="small"
                  className="!h-6 !px-2 !text-deep-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand(record, e);
                  }}
                >
                  {expanded ? "收起" : "查看详情"}
                  <ChevronRight size={12} className={`inline ml-0.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
                </Button>
              ),
            }}
          />
        </Card>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-orange/10 flex items-center justify-center">
              <Shield size={16} className="text-primary-orange" />
            </div>
            <span className="font-bold text-deep-blue-900">信用分提升建议</span>
          </div>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        onOk={() => setDetailModalOpen(false)}
        okText="我知道了"
        cancelText={null}
        width={680}
      >
        <div className="space-y-4">
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label={<span className="font-medium">按时付款</span>}>
              <div className="flex items-center gap-2">
                <Progress percent={96} size="small" showInfo={false} className="!flex-1" strokeColor="#FF6B1A" />
                <span className="text-sm font-bold text-primary-orange">96分 · 优秀</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">💡 建议：保持当前习惯，可设置自动付款进一步提升效率</div>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="font-medium">好评率</span>}>
              <div className="flex items-center gap-2">
                <Progress percent={94} size="small" showInfo={false} className="!flex-1" strokeColor="#3B82F6" />
                <span className="text-sm font-bold text-info-600">94分 · 良好</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">💡 建议：加强现场装卸沟通，保持装货效率，争取更多好评</div>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="font-medium">低纠纷率</span>}>
              <div className="flex items-center gap-2">
                <Progress percent={98} size="small" showInfo={false} className="!flex-1" strokeColor="#10B981" />
                <span className="text-sm font-bold text-success-600">98分 · 极佳</span>
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Modal>
    </div>
  );
}
