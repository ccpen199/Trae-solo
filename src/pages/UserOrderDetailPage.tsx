import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  User,
  Star,
  Phone,
  MessageCircle,
  Calendar,
  ShieldCheck,
  Eye,
  Download,
  Share2,
  Headphones,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  TreePine,
  Award,
  Sparkles,
  TrendingUp,
  CreditCard,
  Undo2,
  Eraser,
  FileCheck,
  Lock,
  Gauge,
  Camera as CameraIcon,
  Search,
  Banknote,
  Leaf,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// ==================== 类型定义 ====================
interface Flaw {
  id: number;
  position: string;
  size: string;
  description: string;
  impact: string;
  x: number;
  y: number;
}

interface ProductImage {
  id: number;
  url: string;
  label: string;
  flaws?: Flaw[];
}

interface TestItem {
  name: string;
  method: string;
  result: "pass" | "warn" | "fail";
  value: string;
  note?: string;
}

// ==================== 静态数据 ====================
const orderSteps = [
  { label: "下单", icon: "📝" },
  { label: "派单", icon: "📋" },
  { label: "上门", icon: "🚗" },
  { label: "检测", icon: "🔬" },
  { label: "确认价格", icon: "💰" },
  { label: "签署协议", icon: "✍️" },
  { label: "打款", icon: "💳" },
  { label: "入库", icon: "📦" },
  { label: "环保贡献", icon: "🌱" },
];
const currentStepIndex = 5;

const productImages: ProductImage[] = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Rolex%20Submariner%20126610LN%20watch%20${i < 6 ? `${["正面", "背面", "左侧", "右侧", "表冠", "表带"][i]}%20view` : `flaw%20detail%20${i - 5}`}%20product%20photography%20black%20background%20studio%20lighting&image_size=square_hd`,
  label: i < 6 ? ["正面", "背面", "左侧", "右侧", "表冠", "表带"][i] : `瑕疵${i - 5}`,
}));

const flaws: Flaw[] = [
  { id: 1, position: "表壳左边缘", size: "约2cm", description: "轻微划痕，非贯穿性", impact: "不影响结构与防水", x: 22, y: 45 },
  { id: 2, position: "表链第5节", size: "约0.5cm", description: "细小磕碰痕迹", impact: "视觉可忽略", x: 68, y: 72 },
  { id: 3, position: "表扣内侧", size: "约1cm", description: "正常佩戴磨损", impact: "外部不可见", x: 85, y: 50 },
];

const conditionScores = [
  { label: "外观完整性", value: 97 },
  { label: "磨损度", value: 99 },
  { label: "氧化情况", value: 100 },
  { label: "功能完好", value: 100 },
  { label: "配件齐全", value: 85 },
];

const appearanceTimeline = [
  { step: "整体品相", time: "14:20", note: "S级，几乎全新，轻微使用痕迹", photos: 2 },
  { step: "材质核验", time: "14:25", note: "904L不锈钢 + 陶瓷表圈，符合正品标准", photos: 1 },
  { step: "五金厚度", time: "14:32", note: "镀金层平均0.028mm，符合原厂标准", photos: 2 },
  { step: "内衬洁净", time: "14:38", note: "表壳内侧无异物，表链缝隙无尘", photos: 1 },
  { step: "气味检测", time: "14:42", note: "正常金属味，无异常化学气味", photos: 0 },
  { step: "综合真伪", time: "14:52", note: "多维度核验确认为正品，已存证", photos: 2 },
];

const testItems: TestItem[] = [
  { name: "走时精度", method: "校表仪48小时监测", result: "pass", value: "+2.3s/天", note: "天文台级别" },
  { name: "满弦储能", method: "满弦后静置观测", result: "pass", value: "71.5h", note: "超标称70h" },
  { name: "防水性能", method: "30atm高压试水机", result: "pass", value: "300m通过", note: "IP68级" },
  { name: "日历瞬跳", method: "12点前后连续监测3天", result: "pass", value: "0:00:02 ±2s", note: "完美瞬跳" },
  { name: "自动上链", method: "摆陀旋转效率测试", result: "pass", value: "效率96%" },
  { name: "手动上链", method: "手感+扭矩传感", result: "pass", value: "扭矩均匀" },
  { name: "调校档位", method: "表冠拉出档位测试", result: "pass", value: "3档清晰" },
  { name: "夜光亮度", method: "UV激发后亮度衰减曲线", result: "pass", value: "L9.5级" },
  { name: "表圈旋转", method: "120格单向旋转手感", result: "pass", value: "120格清脆" },
  { name: "表扣功能", method: "开合+微调功能", result: "warn", value: "微调略紧", note: "可保养调整" },
  { name: "序列号读取", method: "6点位激光蚀刻显微镜", result: "pass", value: "清晰可辨" },
  { name: "防伪水印", method: "蓝紫光+红外双模式", result: "pass", value: "全部匹配" },
];

const teardownPhotos = [
  { label: "摆陀特写", url: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Rolex%203135%20movement%20oscillating%20weight%20rotor%20closeup%20macro%20photography&image_size=square_hd" },
  { label: "夹板打磨", url: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20watch%20movement%20bridge%20finishing%20Cotes%20de%20Geneve%20macro&image_size=square_hd" },
  { label: "自动轮系", url: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=watch%20automatic%20gear%20train%20macro%20photography%20precision&image_size=square_hd" },
];

const priceComparison = [
  { platform: "闲鱼", price: 86800, arrival: "7-15天", fee: "3%", stars: 3, url: "xianyu.com/item/126610LN" },
  { platform: "京东拍拍", price: 84200, arrival: "3-5天", fee: "1.5%", stars: 4, url: "paiipai.jd.com/88271" },
  { platform: "蜂鸟回收", price: 85500, arrival: "2天", fee: "2%", stars: 4, url: "fengniao.com/quote/991" },
  { platform: "臻回收", price: 89500, arrival: "30分钟", fee: "0%", stars: 5, url: "zhenhuishou.com", isBest: true },
];

const timeSlots = [
  { date: "2026-06-15", weekday: "今天", periods: [{ label: "下午 14:00-16:00", available: false }, { label: "下午 16:00-18:00", available: false }, { label: "晚上 19:00-21:00", available: false }] },
  { date: "2026-06-16", weekday: "明天", periods: [{ label: "上午 09:00-11:00", available: true }, { label: "下午 14:00-16:00", available: true, selected: true }, { label: "下午 16:00-18:00", available: true }] },
  { date: "2026-06-17", weekday: "后天", periods: [{ label: "上午 09:00-11:00", available: true }, { label: "下午 14:00-16:00", available: true }, { label: "下午 16:00-18:00", available: true }] },
  { date: "2026-06-18", weekday: "周四", periods: [{ label: "上午 09:00-11:00", available: true }, { label: "下午 14:00-16:00", available: true }, { label: "晚上 19:00-21:00", available: true }] },
  { date: "2026-06-19", weekday: "周五", periods: [{ label: "上午 09:00-11:00", available: true }, { label: "下午 14:00-16:00", available: true }, { label: "下午 16:00-18:00", available: true }] },
  { date: "2026-06-20", weekday: "周六", periods: [{ label: "上午 10:00-12:00", available: true }, { label: "下午 14:00-16:00", available: true }, { label: "晚上 19:00-21:00", available: false }] },
  { date: "2026-06-21", weekday: "周日", periods: [{ label: "上午 10:00-12:00", available: true }, { label: "下午 14:00-16:00", available: true }, { label: "下午 16:00-18:00", available: true }] },
];

const agreementClauses = [
  { title: "退货时效", content: "自商品签收后次日 0 时起算 30 个自然日。在此期间内，用户可无理由申请退货，无需说明任何原因。超期申请将不再受理。" },
  { title: "退货条件", content: "商品需满足：① 未使用、未佩戴，外观无新增划痕/磕碰/磨损；② 商品序列号与检测报告记录完全一致；③ 平台防伪扣未剪断、防伪标完好；④ 原包装、保卡、说明书等配件完整退回。" },
  { title: "退款方式", content: "支持两种退款路径：① 原路退回：使用原支付渠道返还，3-5 个工作日到账；② 指定银行卡：用户提供本人名下银行卡号，1-2 个工作日到账。退款金额 = 实际到手价（无任何扣除）。" },
  { title: "运费承担", content: "平台承担往返顺丰特快快递运费及全额保价费。用户上门退货：检测师现场取件，无需用户支付任何费用。用户寄回退货：联系客服获取到付寄件码，直接顺丰到付即可。" },
  { title: "二次复检", content: "平台收到退货运后 48 小时内完成复检，内容包括：外观一致性（与签署协议时照片对比）、功能完好性、序列号一致性（含激光蚀刻防伪）。复检通过即时启动退款流程。" },
  { title: "争议处理", content: "若复检与用户描述不符：① 平台客服第一时间介入沟通，出示对比证据；② 双方无法达成一致时，免费委托中国检验认证集团（中检）做第三方仲裁，仲裁结果为最终结论；③ 仲裁期内用户可随时申请查看全部复检影像资料。" },
  { title: "协议生效", content: "本协议采用「电子签名 + 短信验证码」双重确认机制，两项均完成后即时生效。生效后协议及签署证据同步上传至杭州互联网公证处区块链存证系统，任何人不可篡改，具有完全法律效力。" },
];

const fulfillmentSteps = [
  { id: 1, title: "提交订单", time: "2026-06-14 14:30", status: "done", detail: "用户通过小程序下单，上传商品信息" },
  { id: 2, title: "系统派单", time: "2026-06-14 14:32", status: "done", detail: "智能匹配：李国强 师傅（偏差率最低+距离最近）" },
  { id: 3, title: "上门检测完成", time: "2026-06-15 15:02", status: "done", detail: "实际耗时 48 分钟，拍摄 47 张高清照片" },
  { id: 4, title: "检测报告生成", time: "2026-06-15 15:18", status: "done", detail: "报告编号 RPT-2026-0615-8842，AI+人工双复核通过" },
  { id: 5, title: "待签署协议", time: "", status: "active", detail: "剩余有效时间", countdown: true },
  { id: 6, title: "预计：打款到账", time: "签署后30分钟内", status: "pending", detail: "到账路径：银联清算 → 工商银行 → 入账短信提醒" },
  { id: 7, title: "预计：退货保障期", time: "至 2026-07-15", status: "pending", detail: "30天无理由退货期，期间可随时在「我的订单 → 申请退货」发起" },
  { id: 8, title: "预计：环保证书", time: "退货期结束后3个工作日", status: "pending", detail: "预计节省碳排放 120kg ≈ 种植 7 棵成年冷杉树 🌲" },
];

// ==================== 辅助组件：评分渐变条 ====================
function ScoreBar({ label, value }: { label: string; value: number }) {
  const gradient = value >= 95 ? "from-forest-400 to-jade-400" : value >= 85 ? "from-gold-400 to-gold-500" : "from-amberLux-400 to-amberLux-500";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-300">{label}</span>
        <span className={cn("font-semibold", value >= 95 ? "text-forest-300" : value >= 85 ? "text-gold-400" : "text-amberLux-400")}>{value}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
        />
      </div>
    </div>
  );
}

// ==================== 辅助组件：迷你仪表盘 ====================
function MiniGauge({ value, max, label, sublabel }: { value: number; max: number; label: string; sublabel?: string }) {
  const pct = Math.min(value / max, 1);
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - pct * 0.75);
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 72 72" className="h-full w-full -rotate-[135deg]">
          <circle cx="36" cy="36" r="28" stroke="currentColor" strokeWidth="6" fill="none" className="text-ink-700" strokeDasharray={`${circumference * 0.75} ${circumference}`} strokeLinecap="round" />
          <motion.circle
            cx="36"
            cy="36"
            r="28"
            stroke="url(#gaugeGrad)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference * 0.75 }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2BA179" />
              <stop offset="100%" stopColor="#C9A962" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gold-400">{value}%</span>
        </div>
      </div>
      <div className="space-y-0.5 min-w-0">
        <p className="text-xs font-medium text-ink-200 truncate">{label}</p>
        {sublabel && <p className="text-[10px] text-ink-400 leading-tight">{sublabel}</p>}
      </div>
    </div>
  );
}

// ==================== 主组件 ====================
export default function UserOrderDetailPage() {
  const navigate = useNavigate();

  // ===== 商品图切换 =====
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [hoveredFlaw, setHoveredFlaw] = useState<Flaw | null>(null);
  const [magnifyPos, setMagnifyPos] = useState<{ x: number; y: number } | null>(null);

  // ===== 检测报告 Tab =====
  const [reportTab, setReportTab] = useState<"appearance" | "function" | "teardown" | "comparison">("appearance");
  const [selectedFlawId, setSelectedFlawId] = useState<number | null>(1);
  const selectedFlaw = flaws.find((f) => f.id === selectedFlawId) || flaws[0];

  // ===== 上门时段 =====
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [slots, setSlots] = useState(timeSlots);
  const selectedSlot = (() => {
    for (const d of slots) {
      const found = d.periods.find((p) => (p as any).selected);
      if (found) return { date: d.date, weekday: d.weekday, period: found.label };
    }
    return null;
  })();

  const handleSelectSlot = (dateIdx: number, periodIdx: number) => {
    setSlots((prev) =>
      prev.map((d, di) => ({
        ...d,
        periods: d.periods.map((p, pi) => ({ ...p, selected: di === dateIdx && pi === periodIdx ? true : false })),
      }))
    );
    setShowCalendarModal(false);
  };

  // ===== 协议签署 =====
  const agreementRef = useRef<HTMLDivElement>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [checks, setChecks] = useState({ legal: false, teardown: false, report: false, terms: false });
  const allChecked = checks.legal && checks.teardown && checks.report && checks.terms;
  const canAgree = readProgress >= 100;

  const handleScroll = useCallback(() => {
    const el = agreementRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const pct = maxScroll > 0 ? Math.min(100, Math.round((el.scrollTop / maxScroll) * 100)) : 100;
    setReadProgress(pct);
  }, []);

  // ===== 签名画板 =====
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pathsRef = useRef<{ x: number; y: number }[][]>([]);
  const [hasSignature, setHasSignature] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#C9A962";
    ctx.shadowColor = "#C9A962";
    ctx.shadowBlur = 6;
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener("resize", initCanvas);
    return () => window.removeEventListener("resize", initCanvas);
  }, [initCanvas]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const cy = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    const pos = getCanvasPos(e);
    lastPointRef.current = pos;
    pathsRef.current.push([pos]);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const doDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawingRef.current || !lastPointRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPointRef.current = pos;
    const curPath = pathsRef.current[pathsRef.current.length - 1];
    if (curPath) curPath.push(pos);
    setHasSignature(true);
  };

  const endDraw = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pathsRef.current = [];
    setHasSignature(false);
  };

  const undoSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || pathsRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    pathsRef.current.pop();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (pathsRef.current.length === 0) {
      setHasSignature(false);
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#C9A962";
    ctx.shadowColor = "#C9A962";
    ctx.shadowBlur = 6;
    for (const path of pathsRef.current) {
      if (path.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
    }
  };

  // ===== 短信验证码 =====
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const allCodeFilled = codeDigits.every((d) => d.length === 1);

  useEffect(() => {
    if (codeCountdown <= 0) return;
    const t = setInterval(() => setCodeCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [codeCountdown]);

  const sendCode = () => {
    setCodeCountdown(60);
    codeDigits.fill("");
    setCodeDigits([...codeDigits]);
    setTimeout(() => codeRefs.current[0]?.focus(), 300);
  };

  const handleCodeChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...codeDigits];
    next[idx] = digit;
    setCodeDigits(next);
    if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  // ===== 倒计时 =====
  const [remainTime, setRemainTime] = useState(12 * 3600 + 8 * 60 + 32);
  useEffect(() => {
    const t = setInterval(() => setRemainTime((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ===== 履约进度展开 =====
  const [expandedStep, setExpandedStep] = useState<number | null>(5);

  // ===== 报价档位 =====
  const [priceTier, setPriceTier] = useState<"instant" | "standard" | "consignment">("instant");
  const tierInfo = {
    instant: { label: "即时变现", price: 89500, time: "30分钟到账" },
    standard: { label: "标准", price: 92300, time: "3个工作日到账" },
    consignment: { label: "寄售最高价", price: 95765, time: "成交后到账（约7-30天）" },
  } as const;

  // ===== 签署流程状态 =====
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const canSubmitSign = canAgree && allChecked && hasSignature && allCodeFilled;
  const pendingCount = [
    !canAgree && "阅读协议",
    !checks.legal && "来源合法承诺",
    !checks.teardown && "拆机同意",
    !checks.report && "报告确认",
    !checks.terms && "协议勾选",
    !hasSignature && "电子签名",
    !allCodeFilled && "验证码",
  ].filter(Boolean).length;

  const handleSubmitSign = async () => {
    if (!canSubmitSign) return;
    setSigning(true);
    await new Promise((r) => setTimeout(r, 3000));
    setSigning(false);
    setSigned(true);
    setShowSuccessModal(true);
  };

  // ==================== 渲染 ====================
  return (
    <div className="relative pb-28">
      {/* ===== 顶部标题栏 ===== */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-500/15 bg-ink-900 text-ink-300 transition-all hover:border-gold-500/30 hover:text-gold-500 hover:bg-gold-500/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold text-ink-100">订单详情</h1>
            <p className="mt-0.5 text-sm text-ink-400 truncate">
              订单号：<span className="font-mono text-gold-400">RS202606150001</span> · 提交于 2026-06-14 14:30
            </p>
          </div>
        </div>

        {/* 状态横条 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-5 rounded-2xl border border-gold-500/15 bg-ink-900 p-4 overflow-x-auto"
        >
          <div className="flex items-center gap-1 min-w-max">
            {orderSteps.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isActive = idx === currentStepIndex;
              return (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "relative h-9 w-9 rounded-full flex items-center justify-center text-sm transition-all",
                        isDone && "bg-forest-500/20 border-2 border-forest-400 text-forest-300",
                        isActive && "bg-gold-500/20 border-2 border-gold-500 text-gold-400 animate-glow-pulse",
                        !isDone && !isActive && "bg-ink-800 border border-ink-600 text-ink-500"
                      )}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : <span>{step.icon}</span>}
                    </div>
                    <span className={cn("text-[10px] font-medium whitespace-nowrap", isDone ? "text-forest-300" : isActive ? "text-gold-400" : "text-ink-500")}>
                      {step.label}
                    </span>
                  </div>
                  {idx < orderSteps.length - 1 && (
                    <div className="mx-1 h-0.5 w-12 rounded-full overflow-hidden bg-ink-700">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: isDone ? "100%" : isActive ? "50%" : "0%" }}
                        transition={{ duration: 0.6, delay: 0.1 + idx * 0.05 }}
                        className={cn("h-full", isDone ? "bg-forest-500" : isActive ? "bg-gradient-to-r from-gold-500 to-gold-300" : "")}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gold-500 animate-pulse" />
              当前：待签署协议 → 待打款
            </span>
            <span className="text-ink-600">·</span>
            <span>第 {currentStepIndex + 1} / {orderSteps.length} 步</span>
          </div>
        </motion.div>
      </motion.div>

      {/* ===== 主体 4 栏布局 ===== */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* ===== 左主区：宽栏 ===== */}
        <div className="space-y-6 xl:col-span-2">
          {/* ==================== 📦 商品信息大卡 ==================== */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card gold-border overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
            <div className="p-6">
              <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold text-ink-100">
                <Sparkles className="h-5 w-5 text-gold-500" />
                商品信息
              </h2>

              <div className="flex flex-col gap-6 lg:flex-row">
                {/* 左子列：图片 */}
                <div className="flex gap-4 lg:w-[48%] shrink-0">
                  {/* 主图 */}
                  <div
                    className="relative aspect-square flex-1 overflow-hidden rounded-2xl border border-gold-500/20 bg-ink-850 group"
                    onMouseMove={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setMagnifyPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
                    }}
                    onMouseLeave={() => setMagnifyPos(null)}
                  >
                    <img src={productImages[mainImageIndex].url} alt="商品主图" className="h-full w-full object-cover" />
                    {/* 放大镜 */}
                    {magnifyPos && (
                      <div
                        className="pointer-events-none absolute h-28 w-28 rounded-full border-2 border-gold-500/60 bg-ink-950/30 backdrop-blur-[2px] overflow-hidden shadow-gold-sm"
                        style={{ left: `calc(${magnifyPos.x}% - 56px)`, top: `calc(${magnifyPos.y}% - 56px)` }}
                      >
                        <img
                          src={productImages[mainImageIndex].url}
                          alt=""
                          className="h-[400%] w-[400%] object-cover"
                          style={{ objectPosition: `${magnifyPos.x}% ${magnifyPos.y}%`, transform: "translate(-37.5%, -37.5%)" }}
                        />
                      </div>
                    )}
                    {/* 瑕疵标记 */}
                    {mainImageIndex < 3 &&
                      flaws.map((f, i) => (
                        <button
                          key={f.id}
                          className={cn(
                            "absolute -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                            hoveredFlaw?.id === f.id
                              ? "bg-gold-500 text-ink-950 scale-125 shadow-gold-sm z-10"
                              : "bg-gold-500/80 text-ink-950 hover:scale-125 animate-pulse"
                          )}
                          style={{ left: `${f.x}%`, top: `${f.y}%` }}
                          onMouseEnter={() => setHoveredFlaw(f)}
                          onMouseLeave={() => setHoveredFlaw(null)}
                        >
                          {["①", "②", "③"][i]}
                        </button>
                      ))}
                    {/* 瑕疵悬浮提示 */}
                    <AnimatePresence>
                      {hoveredFlaw && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute left-1/2 top-1/2 z-20 w-56 -translate-x-1/2 translate-y-8 rounded-xl border border-gold-500/40 bg-ink-950/95 backdrop-blur-xl p-3 shadow-card"
                        >
                          <p className="text-xs font-semibold text-gold-400">{hoveredFlaw.position} · {hoveredFlaw.size}</p>
                          <p className="mt-1 text-xs text-ink-200">{hoveredFlaw.description}</p>
                          <p className="mt-1 text-[10px] text-forest-400">影响：{hoveredFlaw.impact}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* 标签 */}
                    <div className="absolute left-2 top-2 rounded-lg bg-ink-950/80 px-2 py-1 text-[10px] font-medium text-ink-200 backdrop-blur-sm">
                      {productImages[mainImageIndex].label}
                    </div>
                  </div>

                  {/* 缩略图 6 宫格 + 3 瑕疵 */}
                  <div className="flex flex-col gap-2 w-16 shrink-0">
                    {productImages.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setMainImageIndex(i)}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-lg border transition-all",
                          mainImageIndex === i ? "border-gold-500 ring-2 ring-gold-500/40 scale-105" : "border-ink-700 hover:border-gold-500/40"
                        )}
                      >
                        <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                        {i >= 6 && (
                          <span className="absolute right-0.5 top-0.5 rounded bg-gold-500/90 px-1 text-[8px] font-bold text-ink-950">疵</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 右子列：信息 */}
                <div className="flex-1 min-w-0 space-y-5">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.15em] text-gold-500 uppercase">ROLEX · 劳力士</p>
                    <h3 className="mt-1 font-display text-2xl font-bold text-ink-100 leading-tight">Submariner Date 126610LN 2024款</h3>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Badge variant="gold" className="!px-3 !py-1.5">
                        <Award className="h-3 w-3" />
                        S级 · 96分
                      </Badge>
                      <Badge variant="success">已通过中检</Badge>
                      <Badge variant="info">非挂失 / 非盗抢</Badge>
                    </div>
                  </div>

                  {/* 规格 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { k: "机芯", v: "自动机械 3235型" },
                      { k: "表径", v: "41mm" },
                      { k: "表圈", v: "陶瓷 Cerachrom" },
                      { k: "表带", v: "蚝式钢带 904L" },
                      { k: "防水", v: "300m / 1000ft" },
                      { k: "保卡", v: "2024-03 全新未激活" },
                    ].map((s) => (
                      <div key={s.k} className="flex justify-between rounded-lg bg-ink-850 px-3 py-2">
                        <span className="text-ink-400">{s.k}</span>
                        <span className="text-ink-100 font-medium">{s.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* 序列号验真区 */}
                  <div className="rounded-xl border border-forest-500/25 bg-forest-500/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-forest-300 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        序列号验真
                      </p>
                      <span className="text-[10px] text-ink-400">完整报告见检测报告 PDF</span>
                    </div>
                    <p className="font-mono text-sm text-ink-100">126610LN-<span className="text-ink-500">********</span></p>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { label: "格式校验", detail: "12位字母数字结构 ✓" },
                        { label: "字头年份对照", detail: "2024年生产（与保卡一致 ✓）" },
                        { label: "中检数据库匹配", detail: "正品登记 ✓ 非挂失 ✓ 非盗抢 ✓" },
                      ].map((c) => (
                        <div key={c.label} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 mt-0.5 text-forest-400 shrink-0" />
                          <div>
                            <span className="text-ink-200 font-medium">{c.label}：</span>
                            <span className="text-ink-400">{c.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 成色细分评分条 */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold text-ink-300 flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5 text-gold-500" />
                      成色细分评分
                    </p>
                    {conditionScores.map((s) => (
                      <ScoreBar key={s.label} label={s.label} value={s.value} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ==================== 🔬 检测报告完整展示 ==================== */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-6 pb-0 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-100">
                <Search className="h-5 w-5 text-gold-500" />
                检测报告 · RPT-2026-0615-8842
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                  PDF 报告
                </Button>
                <div className="flex items-center gap-1.5 rounded-xl border border-forest-500/30 bg-forest-500/10 px-3 py-2">
                  <FileCheck className="h-4 w-4 text-forest-400" />
                  <span className="text-xs text-forest-300 font-medium">电子签章已验证</span>
                </div>
              </div>
            </div>

            {/* Tab 切换 */}
            <div className="px-6 mt-4">
              <div className="flex gap-1 rounded-xl bg-ink-850 p-1">
                {(
                  [
                    { k: "appearance", label: "外观检测" },
                    { k: "function", label: "功能测试" },
                    { k: "teardown", label: "拆机探微" },
                    { k: "comparison", label: "三方比价截图" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setReportTab(t.k)}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      reportTab === t.k ? "bg-gold-gradient text-ink-950 shadow-gold-sm" : "text-ink-400 hover:text-ink-200"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab 内容 */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* ===== 外观检测 Tab ===== */}
                {reportTab === "appearance" && (
                  <motion.div key="appearance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
                    {/* 6 步时间轴 */}
                    <div className="relative">
                      {appearanceTimeline.map((item, i) => (
                        <div key={item.step} className="flex gap-4 pb-5 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-500/15 border-2 border-forest-500/40 text-forest-300 text-xs font-bold">
                              {i + 1}
                            </div>
                            {i < appearanceTimeline.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-gradient-to-b from-forest-500/40 to-ink-700" />}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-ink-100">{item.step}</p>
                              <span className="text-[10px] text-ink-500">{item.time}</span>
                              {item.photos > 0 && (
                                <Badge variant="gold" className="!py-0.5">
                                  <CameraIcon className="h-3 w-3" />
                                  {item.photos}张
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-ink-300 leading-relaxed">{item.note}</p>
                            {item.photos > 0 && (
                              <div className="mt-2 flex gap-2">
                                {Array.from({ length: item.photos }).map((_, pi) => (
                                  <div key={pi} className="h-16 w-16 rounded-lg overflow-hidden border border-ink-700 bg-ink-800">
                                    <img
                                      src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=watch%20inspection%20photo%20${i}${pi}%20detail&image_size=square_hd`}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 瑕疵标注地图 */}
                    <div className="mt-4 rounded-xl border border-gold-500/15 bg-ink-850 p-4">
                      <h3 className="text-sm font-semibold text-ink-200 mb-3 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-gold-500" />
                        瑕疵标注地图（共 {flaws.length} 处）
                      </h3>
                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="relative aspect-square w-full md:w-56 shrink-0 overflow-hidden rounded-xl border border-gold-500/20 bg-ink-900">
                          <img src={productImages[0].url} alt="6视图" className="h-full w-full object-cover opacity-80" />
                          {flaws.map((f, i) => (
                            <button
                              key={f.id}
                              onClick={() => setSelectedFlawId(f.id)}
                              className={cn(
                                "absolute -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                selectedFlawId === f.id
                                  ? "bg-gold-500 text-ink-950 scale-110 shadow-gold-sm ring-2 ring-gold-500/50"
                                  : "bg-gold-500/80 text-ink-950 hover:scale-110"
                              )}
                              style={{ left: `${f.x}%`, top: `${f.y}%` }}
                            >
                              {["①", "②", "③"][i]}
                            </button>
                          ))}
                        </div>
                        <div className="flex-1 rounded-xl bg-ink-900/50 p-4 border border-ink-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-ink-950 text-xs font-bold">
                              {["①", "②", "③"][flaws.findIndex((x) => x.id === selectedFlaw.id)]}
                            </span>
                            <p className="text-sm font-semibold text-gold-400">{selectedFlaw.position}</p>
                          </div>
                          <dl className="space-y-2 text-xs">
                            <div className="flex gap-2"><dt className="w-16 text-ink-500 shrink-0">尺寸</dt><dd className="text-ink-200">{selectedFlaw.size}</dd></div>
                            <div className="flex gap-2"><dt className="w-16 text-ink-500 shrink-0">描述</dt><dd className="text-ink-200">{selectedFlaw.description}</dd></div>
                            <div className="flex gap-2"><dt className="w-16 text-ink-500 shrink-0">评估影响</dt><dd className="text-forest-300">{selectedFlaw.impact}</dd></div>
                            <div className="flex gap-2 items-start">
                              <dt className="w-16 text-ink-500 shrink-0 pt-1">照片</dt>
                              <dd className="flex gap-2 flex-wrap">
                                <div className="h-20 w-20 rounded-lg overflow-hidden border border-ink-700">
                                  <img src={productImages[6 + (selectedFlaw.id - 1)].url} alt="" className="h-full w-full object-cover" />
                                </div>
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ===== 功能测试 Tab ===== */}
                {reportTab === "function" && (
                  <motion.div key="function" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                      <table className="w-full text-xs">
                        <thead className="bg-ink-850 text-ink-400">
                          <tr>
                            <th className="text-left font-medium px-4 py-3">项目</th>
                            <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">测试方法</th>
                            <th className="text-left font-medium px-4 py-3">结果</th>
                            <th className="text-left font-medium px-4 py-3">数值 / 备注</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testItems.map((it, i) => (
                            <motion.tr
                              key={it.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className={cn("border-t border-white/[0.04]", i % 2 === 0 ? "bg-ink-900/30" : "bg-ink-850/30")}
                            >
                              <td className="px-4 py-3 font-medium text-ink-200">{it.name}</td>
                              <td className="px-4 py-3 text-ink-400 hidden sm:table-cell">{it.method}</td>
                              <td className="px-4 py-3">
                                {it.result === "pass" ? (
                                  <Badge variant="success" className="!py-0.5"><Check className="h-3 w-3" />通过</Badge>
                                ) : it.result === "warn" ? (
                                  <Badge variant="warning" className="!py-0.5"><AlertCircle className="h-3 w-3" />注意</Badge>
                                ) : (
                                  <Badge variant="danger" className="!py-0.5"><X className="h-3 w-3" />未通过</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-mono font-semibold text-ink-100">{it.value}</p>
                                {it.note && <p className="mt-0.5 text-[10px] text-ink-400">{it.note}</p>}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-jade-500" />通过 {testItems.filter(t => t.result === "pass").length} 项</div>
                      <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amberLux-500" />注意 {testItems.filter(t => t.result === "warn").length} 项</div>
                      <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-coral-500" />未通过 {testItems.filter(t => t.result === "fail").length} 项</div>
                    </div>
                  </motion.div>
                )}

                {/* ===== 拆机探微 Tab ===== */}
                {reportTab === "teardown" && (
                  <motion.div key="teardown" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                    <div className="rounded-xl border border-forest-500/25 bg-forest-500/5 p-4">
                      <p className="text-xs text-forest-300 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="font-semibold">无损开盖声明</span> · 本单用户 ✅ 已同意采用专用开盖工具无损检测，全程拍摄 128 张高清过程照片存证
                      </p>
                    </div>
                    <div className="grid gap-4 grid-cols-3">
                      {teardownPhotos.map((p, i) => (
                        <motion.div
                          key={p.label}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="space-y-2"
                        >
                          <div className="aspect-square overflow-hidden rounded-xl border border-gold-500/20 bg-ink-850 group">
                            <img src={p.url} alt={p.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          </div>
                          <p className="text-xs text-center text-ink-300 font-medium">{p.label}</p>
                        </motion.div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-ink-850 p-4 space-y-3 text-xs">
                      {[
                        { k: "机芯型号", v: "3135型自动机芯", ok: true },
                        { k: "打磨工艺", v: "日内瓦波纹 + 鱼鳞纹，符合正品工艺标准", ok: true },
                        { k: "螺丝痕迹", v: "全部螺丝无拧动痕迹（原始出厂状态）", ok: true },
                        { k: "防水胶圈", v: "完整，符合 IP68 标准，弹性良好", ok: true },
                        { k: "维修史", v: "0 次（原始未开封）", ok: true },
                        { k: "电池循环", v: "（机械表不适用）", ok: null },
                      ].map((c) => (
                        <div key={c.k} className="flex items-start gap-2">
                          {c.ok === true ? (
                            <Check className="h-3.5 w-3.5 mt-0.5 text-forest-400 shrink-0" />
                          ) : c.ok === false ? (
                            <X className="h-3.5 w-3.5 mt-0.5 text-coral-400 shrink-0" />
                          ) : (
                            <span className="h-3.5 w-3.5 mt-0.5 shrink-0 text-ink-500 text-center leading-none">—</span>
                          )}
                          <div>
                            <span className="text-ink-300 font-medium">{c.k}：</span>
                            <span className="text-ink-400">{c.v}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ===== 三方比价 Tab ===== */}
                {reportTab === "comparison" && (
                  <motion.div key="comparison" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                      {priceComparison.slice(0, 3).map((p, i) => (
                        <div key={p.platform} className="rounded-xl border border-white/[0.06] bg-ink-850 overflow-hidden">
                          <div className="aspect-video overflow-hidden bg-ink-800 relative">
                            <img
                              src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${p.platform}%20ecommerce%20watch%20listing%20price%20screenshot%20mockup&image_size=landscape_4_3`}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-[10px] text-ink-400 truncate">{p.url}</p>
                            </div>
                          </div>
                          <div className="p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-ink-100">{p.platform}</p>
                              <p className="text-[10px] text-ink-500">2026-06-15 15:02</p>
                            </div>
                            <p className="font-display text-lg font-bold text-gold-400">¥{p.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 对比表 */}
                    <div className="overflow-hidden rounded-xl border border-gold-500/20">
                      <table className="w-full text-xs">
                        <thead className="bg-ink-850 text-ink-400">
                          <tr>
                            <th className="text-left font-medium px-4 py-3">平台</th>
                            <th className="text-right font-medium px-4 py-3">到手价</th>
                            <th className="text-center font-medium px-4 py-3 hidden md:table-cell">到账时效</th>
                            <th className="text-center font-medium px-4 py-3 hidden sm:table-cell">手续费</th>
                            <th className="text-center font-medium px-4 py-3">综合推荐</th>
                          </tr>
                        </thead>
                        <tbody>
                          {priceComparison.map((p, i) => (
                            <motion.tr
                              key={p.platform}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className={cn(
                                "border-t border-white/[0.04] transition-colors",
                                p.isBest ? "bg-gold-500/10" : i % 2 === 0 ? "bg-ink-900/30" : "bg-ink-850/30"
                              )}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className={cn("font-semibold", p.isBest ? "text-gold-400" : "text-ink-200")}>{p.platform}</span>
                                  {p.isBest && <Badge variant="gold" className="!py-0.5">💎 最优</Badge>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={cn("font-display font-bold", p.isBest ? "text-gold-400 text-base" : "text-ink-100")}>
                                  ¥{p.price.toLocaleString()}
                                </span>
                                {p.isBest && <p className="text-[10px] text-forest-400 mt-0.5">+¥{(p.price - 86800).toLocaleString()} 比闲鱼高</p>}
                              </td>
                              <td className="px-4 py-3 text-center text-ink-300 hidden md:table-cell">{p.arrival}</td>
                              <td className={cn("px-4 py-3 text-center hidden sm:table-cell", p.fee === "0%" ? "text-forest-400 font-semibold" : "text-ink-300")}>{p.fee}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-gold-400 text-sm">
                                  {"★".repeat(p.stars)}
                                  <span className="text-ink-600">{"★".repeat(5 - p.stars)}</span>
                                  {p.isBest && "💎"}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* ==================== 🔄 上门时间窗确认 + 路线追踪 ==================== */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-6">
              <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold text-ink-100">
                <Calendar className="h-5 w-5 text-gold-500" />
                上门服务安排
              </h2>

              <div className="grid gap-5 lg:grid-cols-5">
                {/* 时间段选择 */}
                <div className="space-y-3 lg:col-span-2">
                  <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gold-400 flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        已确认时间段
                      </p>
                      <button
                        onClick={() => setShowCalendarModal(true)}
                        className="text-[10px] text-ink-400 hover:text-gold-400 underline-offset-2 hover:underline transition-colors"
                      >
                        重新选择
                      </button>
                    </div>
                    <p className="font-display text-lg font-bold text-ink-100">
                      {selectedSlot?.date.slice(5)} {selectedSlot?.weekday}
                    </p>
                    <p className="text-sm text-gold-400 font-medium mt-0.5">{selectedSlot?.period}</p>
                  </div>

                  {/* 周视图快选 */}
                  <div className="rounded-xl border border-white/[0.06] bg-ink-850 overflow-hidden">
                    <div className="grid grid-cols-7 text-[10px] border-b border-white/[0.06]">
                      {slots.map((d, di) => {
                        const hasSelected = d.periods.some((p) => (p as any).selected);
                        return (
                          <button
                            key={d.date}
                            onClick={() => {
                              const firstAvail = d.periods.findIndex((p) => p.available);
                              if (firstAvail >= 0) handleSelectSlot(di, firstAvail);
                            }}
                            className={cn(
                              "py-2 flex flex-col items-center transition-colors",
                              hasSelected ? "bg-gold-500/15 text-gold-400" : d.periods.every((p) => !p.available) ? "text-ink-600" : "text-ink-300 hover:bg-white/[0.03]"
                            )}
                          >
                            <span className="font-medium">{d.weekday}</span>
                            <span className={cn("mt-0.5", hasSelected && "font-bold text-gold-300")}>{d.date.slice(-2)}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-2">
                      {(() => {
                        const cur = slots.find((d) => d.periods.some((p) => (p as any).selected)) || slots[1];
                        return (
                          <div className="grid grid-cols-3 gap-1.5">
                            {cur.periods.map((p, pi) => {
                              const di = slots.indexOf(cur);
                              return (
                                <button
                                  key={pi}
                                  disabled={!p.available}
                                  onClick={() => handleSelectSlot(di, pi)}
                                  className={cn(
                                    "text-[10px] px-2 py-2 rounded-lg transition-all",
                                    (p as any).selected
                                      ? "bg-gold-gradient text-ink-950 font-bold shadow-gold-sm"
                                      : p.available
                                      ? "bg-ink-800 text-ink-300 hover:bg-gold-500/10 hover:text-gold-400 border border-white/[0.04]"
                                      : "bg-ink-900/50 text-ink-600 line-through cursor-not-allowed"
                                  )}
                                >
                                  {p.label.split(" ")[1]}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 路线地图 + 检测师卡 */}
                <div className="space-y-3 lg:col-span-3">
                  {/* 地图占位 */}
                  <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-gold-500/15 bg-gradient-to-br from-forest-900/20 to-ink-850">
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(201,169,98,0.1) 1px, transparent 1px, transparent calc(100% - 1px), rgba(201,169,98,0.1) calc(100% - 1px), rgba(201,169,98,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,98,0.1) 1px, transparent 1px, transparent calc(100% - 1px), rgba(201,169,98,0.1) calc(100% - 1px)",
                        backgroundSize: "32px 32px, 32px 32px, 0 32px",
                      }}
                    />
                    {/* 路线 */}
                    <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full">
                      <path d="M 40 140 Q 120 80 200 100 T 360 40" stroke="rgba(201,169,98,0.3)" strokeWidth="3" fill="none" strokeDasharray="6 4" />
                      <motion.path
                        d="M 40 140 Q 120 80 200 100 T 360 40"
                        stroke="url(#routeGrad)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 0.7 }}
                        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                      />
                      <defs>
                        <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#2BA179" />
                          <stop offset="100%" stopColor="#C9A962" />
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* 检测师位置（动态） */}
                    <motion.div
                      initial={{ left: "10%", top: "77%" }}
                      animate={{ left: ["10%", "65%"], top: ["77%", "53%"] }}
                      transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 h-6 w-6 rounded-full bg-gold-500/30 animate-ping" />
                        <div className="relative h-6 w-6 rounded-full bg-gold-500 ring-2 ring-gold-300/50 shadow-gold-sm flex items-center justify-center">
                          <User className="h-3 w-3 text-ink-950" />
                        </div>
                      </div>
                    </motion.div>
                    {/* 用户位置 */}
                    <div className="absolute right-[10%] top-[22%] -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <div className="absolute inset-0 h-7 w-7 rounded-full bg-forest-500/30 animate-pulse" />
                        <div className="relative h-7 w-7 rounded-full bg-forest-500 ring-2 ring-forest-300/50 flex items-center justify-center">
                          <MapPin className="h-3.5 w-3.5 text-ink-950" />
                        </div>
                      </div>
                    </div>
                    {/* 浮层信息 */}
                    <div className="absolute top-3 left-3 rounded-lg bg-ink-950/80 backdrop-blur px-3 py-1.5 text-[10px] text-gold-400 font-medium">
                      🚗 预计 22 分钟到达 · 5.8km
                    </div>
                    <div className="absolute bottom-3 right-3 rounded-lg bg-ink-950/80 backdrop-blur px-3 py-1.5 text-[10px] text-ink-200 max-w-[55%] truncate">
                      📍 静安区南京西路1266号恒隆广场
                    </div>
                  </div>

                  {/* 检测师卡片 */}
                  <div className="rounded-xl border border-gold-500/15 bg-ink-850 p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center ring-2 ring-gold-500/30">
                          <User className="h-7 w-7 text-ink-100" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-jade-500 ring-2 ring-ink-850 flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-ink-950" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-ink-100">李国强 师傅</p>
                          <Badge variant="gold" className="!py-0.5 !text-[10px]">S级检测师</Badge>
                          <div className="flex items-center gap-0.5 text-xs text-gold-400">
                            <Star className="h-3 w-3 fill-gold-500" />
                            <span className="font-semibold">4.97</span>
                          </div>
                        </div>
                        <p className="text-xs text-ink-400 mt-0.5">距离您 5.8km · 电话尾号 8823 · 从业 7 年</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-ink-500">预计到达</p>
                        <p className="font-mono font-bold text-gold-400 text-lg">22<span className="text-xs text-ink-400 ml-0.5">min</span></p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button className="flex items-center justify-center gap-1.5 rounded-lg bg-ink-800 py-2 text-xs text-ink-200 hover:bg-gold-500/10 hover:text-gold-400 transition-colors">
                        <Phone className="h-3.5 w-3.5" />联系检测师
                      </button>
                      <button className="flex items-center justify-center gap-1.5 rounded-lg bg-ink-800 py-2 text-xs text-ink-200 hover:bg-gold-500/10 hover:text-gold-400 transition-colors">
                        <MessageCircle className="h-3.5 w-3.5" />消息沟通
                      </button>
                      <button className="flex items-center justify-center gap-1.5 rounded-lg border border-coral-500/20 bg-coral-500/5 py-2 text-xs text-coral-400 hover:bg-coral-500/10 transition-colors">
                        <Clock className="h-3.5 w-3.5" />取消/改期
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ==================== 📝 电子签署退货协议 ==================== */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative glass-card gold-border overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 opacity-60" />
            <div className="p-6">
              <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold text-gold-400">
                <FileCheck className="h-5 w-5" />
                电子签署 · 30天无理由退货协议
              </h2>

              {/* 1. 协议条款滚动区 */}
              <div className="rounded-xl border border-white/[0.08] bg-ink-900/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-ink-850 border-b border-white/[0.06]">
                  <p className="text-xs font-semibold text-ink-200 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-gold-500" />
                    《臻回收 30天无理由退货服务协议》
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${readProgress}%` }}
                        className={cn("h-full rounded-full transition-colors", readProgress >= 100 ? "bg-forest-500" : "bg-gold-500")}
                      />
                    </div>
                    <span className={cn("text-[10px] font-mono font-semibold min-w-[42px] text-right", readProgress >= 100 ? "text-forest-400" : "text-gold-400")}>
                      {readProgress}%
                    </span>
                  </div>
                </div>
                <div
                  ref={agreementRef}
                  onScroll={handleScroll}
                  className="h-64 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed text-ink-300"
                >
                  {agreementClauses.map((c, i) => (
                    <div key={c.title}>
                      <p className="font-semibold text-ink-100 mb-1 flex items-center gap-1.5">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-gold-500/20 text-gold-400 font-bold text-[10px]">{i + 1}</span>
                        {c.title}
                      </p>
                      <p className="pl-5.5 text-ink-400 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                  <div className="pt-4 mt-4 border-t border-white/[0.06]">
                    <p className="text-center text-[10px] text-ink-500">
                      — 协议版本 v2.4 · 2026年5月修订 · 上海仲裁委员会管辖 —
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. 用户承诺勾选区 */}
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {[
                  { k: "legal" as const, label: "本人确认出售商品来源合法，非盗抢/赃物" },
                  { k: "teardown" as const, label: "同意检测师对商品进行无损拆机检测" },
                  { k: "report" as const, label: "已阅读并理解检测报告和瑕疵标注" },
                  { k: "terms" as const, label: "同意《30天无理由退货协议》全部条款", disabled: !canAgree },
                ].map((opt) => (
                  <label
                    key={opt.k}
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all",
                      checks[opt.k]
                        ? "border-forest-500/40 bg-forest-500/8"
                        : opt.disabled
                        ? "border-ink-700 bg-ink-850/50 opacity-50 cursor-not-allowed"
                        : "border-white/[0.06] bg-ink-850 hover:border-gold-500/30"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checks[opt.k]}
                      disabled={opt.disabled}
                      onChange={(e) => setChecks({ ...checks, [opt.k]: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-600 bg-ink-800 text-gold-500 focus:ring-gold-500 focus:ring-offset-ink-900"
                    />
                    <span className={cn("text-xs", checks[opt.k] ? "text-forest-300 font-medium" : "text-ink-300")}>
                      {opt.label}
                      {opt.disabled && <span className="text-ink-500 ml-1">（请先完整阅读协议）</span>}
                    </span>
                  </label>
                ))}
              </div>

              {/* 3. 电子签名画板 */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-ink-200 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-gold-500" />
                    电子签名 <span className="text-ink-500 font-normal">（金色笔触 · 真实书写效果）</span>
                  </p>
                  {hasSignature && (
                    <span className="text-[10px] text-forest-400 flex items-center gap-1">
                      <Check className="h-3 w-3" />签名已录入
                    </span>
                  )}
                </div>
                <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gold-500/30 bg-ink-900/50">
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(201,169,98,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(201,169,98,0.04)_1px,transparent_1px)] bg-[size:24px_24px]" />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-sm text-ink-500 font-medium">✍️ 请在此区域手写签名</p>
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDraw}
                    onMouseMove={doDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={doDraw}
                    onTouchEnd={endDraw}
                    className="relative w-full h-32 touch-none cursor-crosshair"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={undoSignature}
                      disabled={pathsRef.current.length === 0}
                      className="rounded-lg bg-ink-800/80 px-2 py-1 text-[10px] text-ink-400 hover:text-gold-400 disabled:opacity-40 transition-colors backdrop-blur flex items-center gap-1"
                    >
                      <Undo2 className="h-3 w-3" />撤销
                    </button>
                    <button
                      onClick={clearSignature}
                      disabled={!hasSignature}
                      className="rounded-lg bg-ink-800/80 px-2 py-1 text-[10px] text-ink-400 hover:text-coral-400 disabled:opacity-40 transition-colors backdrop-blur flex items-center gap-1"
                    >
                      <Eraser className="h-3 w-3" />重签
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. 短信验证码 */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-ink-200 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold-500" />
                    短信验证码验证
                  </p>
                </div>
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-850 px-4 py-2.5">
                    <span className="text-xs text-ink-400">手机号</span>
                    <span className="font-mono text-sm text-ink-100">138****8888</span>
                  </div>
                  <button
                    onClick={sendCode}
                    disabled={codeCountdown > 0}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-xs font-medium transition-all",
                      codeCountdown > 0
                        ? "bg-ink-800 text-ink-500 cursor-not-allowed"
                        : "border border-gold-500/40 bg-gold-500/10 text-gold-400 hover:bg-gold-500/20"
                    )}
                  >
                    {codeCountdown > 0 ? `${codeCountdown}s 后重新获取` : "获取验证码"}
                  </button>
                </div>
                <div className="mt-3 flex gap-2.5">
                  {codeDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (codeRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className={cn(
                        "h-12 w-12 shrink-0 rounded-xl border-2 bg-ink-900 text-center font-mono text-xl font-bold outline-none transition-all",
                        d
                          ? "border-gold-500/60 text-gold-400 shadow-gold-sm"
                          : "border-ink-700 text-ink-100 focus:border-gold-500/40"
                      )}
                    />
                  ))}
                  {allCodeFilled && (
                    <div className="flex items-center">
                      <Badge variant="success" className="!py-1 ml-2">
                        <Check className="h-3 w-3" />验证码已填
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. 最终签署按钮 */}
              <div className="mt-6">
                {!signed ? (
                  <button
                    onClick={handleSubmitSign}
                    disabled={!canSubmitSign || signing}
                    className={cn(
                      "w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold transition-all relative overflow-hidden",
                      canSubmitSign && !signing
                        ? "bg-gold-gradient text-ink-950 shadow-gold hover:shadow-gold-sm hover:brightness-110 active:scale-[0.99] animate-glow-pulse"
                        : "bg-ink-800 text-ink-500 cursor-not-allowed border border-ink-700"
                    )}
                  >
                    {signing ? (
                      <>
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                          <path d="M 22 12 A 10 10 0 0 0 12 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <span>正在生成区块链存证...</span>
                      </>
                    ) : canSubmitSign ? (
                      <>
                        <FileCheck className="h-5 w-5" />
                        确认签署并确认打款 · ¥{tierInfo[priceTier].price.toLocaleString()}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5" />
                        还有 {pendingCount} 项未完成，请查看上方清单
                      </>
                    )}
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-forest-500/30 bg-forest-500/8 p-5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-forest-500/20 flex items-center justify-center">
                        <Check className="h-5 w-5 text-forest-400" />
                      </div>
                      <div>
                        <p className="font-bold text-forest-300">签署成功 ✅</p>
                        <p className="text-xs text-ink-400">区块链存证已上传至杭州互联网公证处</p>
                      </div>
                    </div>
                    <div className="grid gap-2 text-xs sm:grid-cols-2">
                      <div className="rounded-lg bg-ink-900/50 p-3">
                        <p className="text-ink-500">协议编号</p>
                        <p className="font-mono text-ink-200 mt-0.5">RSA-2026-0615-2F8A1E</p>
                      </div>
                      <div className="rounded-lg bg-ink-900/50 p-3">
                        <p className="text-ink-500">存证哈希 (SHA256)</p>
                        <p className="font-mono text-ink-200 mt-0.5 truncate">0x8f3a...c2d1e4f</p>
                      </div>
                    </div>
                    <p className="text-xs text-gold-400 flex items-center gap-1.5">
                      <Banknote className="h-3.5 w-3.5" />
                      预计 <span className="font-bold">30 分钟内</span> 到账至工商银行 ****8888
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.section>
        </div>

        {/* ===== 右主区：窄栏 Sticky ===== */}
        <div className="space-y-6 xl:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* ==================== 💰 价格确认卡 ==================== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="relative glass-card gold-border overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-100">
                    <Banknote className="h-5 w-5 text-gold-500" />
                    到手价
                  </h2>
                  <Badge variant="success" className="!py-0.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +3.1%
                  </Badge>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] text-ink-400">比闲鱼高 ¥2,700 · 全网最优</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xs text-gold-500">¥</span>
                    <motion.span
                      key={tierInfo[priceTier].price}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-display text-4xl font-bold gold-text"
                    >
                      {tierInfo[priceTier].price.toLocaleString()}
                    </motion.span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <Badge variant="gold" className="!py-0.5">成色 S × 0.92</Badge>
                    <span className="text-ink-500">到手价系数</span>
                  </div>
                </div>

                {/* 三档报价切换 */}
                <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-ink-850 p-1">
                  {(Object.keys(tierInfo) as Array<keyof typeof tierInfo>).map((k) => (
                    <button
                      key={k}
                      onClick={() => setPriceTier(k)}
                      className={cn(
                        "rounded-lg py-2 px-1 text-[10px] font-medium transition-all text-center",
                        priceTier === k ? "bg-gold-gradient text-ink-950 shadow-gold-sm" : "text-ink-400 hover:text-ink-200"
                      )}
                    >
                      {tierInfo[k].label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-center text-ink-500 mt-1.5">{tierInfo[priceTier].time}</p>

                {/* 费用明细 */}
                <div className="mt-4 space-y-2 rounded-xl border border-white/[0.06] bg-ink-850/50 p-3 text-xs">
                  {[
                    { k: "基础估价", v: 97283, sign: "" },
                    { k: "成色折算", v: 7783, sign: "-", warn: true },
                    { k: "平台让利补贴", v: 0, sign: "+", neutral: true },
                  ].map((it) => (
                    <div key={it.k} className="flex items-center justify-between">
                      <span className="text-ink-400">{it.k}</span>
                      <span className={cn("font-mono", it.warn ? "text-coral-400" : it.neutral ? "text-ink-500" : "text-ink-200")}>
                        {it.sign}¥{it.v.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-100">最终到手价</span>
                    <span className="font-display text-base font-bold gold-text">¥{tierInfo[priceTier].price.toLocaleString()}</span>
                  </div>
                </div>

                {/* 到账银行卡 */}
                <div className="mt-4 rounded-xl border border-forest-500/25 bg-forest-500/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-ink-950" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-200">工商银行 ****8888</p>
                      <p className="text-[10px] text-ink-500">李** · 储蓄卡</p>
                    </div>
                  </div>
                  <button className="text-[10px] text-gold-400 hover:text-gold-300 underline-offset-2 hover:underline">切换</button>
                </div>
              </div>
            </motion.div>

            {/* ==================== 👤 检测师迷你档案 ==================== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="glass-card overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center ring-2 ring-gold-500/20">
                      <User className="h-7 w-7 text-ink-100" />
                    </div>
                    <Badge variant="gold" className="!py-0.5 !px-1.5 !text-[9px] absolute -bottom-1 -right-1">S级</Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink-100">李国强 师傅</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                      <span className="text-xs font-bold text-gold-400">4.97</span>
                      <span className="text-[10px] text-ink-500">· 1,285 单</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <MiniGauge value={1.8} max={10} label="偏差率 1.8%" sublabel="行业均值 3.2% · 更准" />
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-forest-500/10 border border-forest-500/20 flex flex-col items-center justify-center">
                      <span className="font-display text-lg font-bold text-forest-300">98<span className="text-xs">.2</span></span>
                      <span className="text-[9px] text-ink-500">通过率%</span>
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink-200">飞检通过率</p>
                      <p className="text-[10px] text-ink-400 leading-tight">神秘客抽查 · 连续 47 单通过</p>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {["Rolex", "AP", "中检"].map((c) => (
                          <span key={c} className="rounded bg-ink-800 px-1.5 py-0.5 text-[9px] font-semibold text-gold-400 border border-gold-500/20">
                            {c}认证
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button className="mt-4 w-full flex items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-ink-850 py-2 text-xs text-ink-300 hover:border-gold-500/30 hover:text-gold-400 transition-colors">
                  完整档案 →
                </button>
              </div>
            </motion.div>

            {/* ==================== ⚡ 履约进度时间轴 ==================== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="glass-card overflow-hidden"
            >
              <div className="p-5">
                <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-ink-100">
                  <Clock className="h-4 w-4 text-gold-500" />
                  履约追踪
                </h2>
                <div className="space-y-0.5">
                  {fulfillmentSteps.map((step, i) => {
                    const isExpanded = expandedStep === step.id;
                    const isDone = step.status === "done";
                    const isActive = step.status === "active";
                    return (
                      <div key={step.id} className="relative">
                        <button
                          onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                          className={cn(
                            "w-full text-left flex items-start gap-3 py-2.5 rounded-lg transition-colors",
                            isActive && "bg-gold-500/5 -mx-2 px-2"
                          )}
                        >
                          <div className="relative flex flex-col items-center pt-1">
                            <div
                              className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                                isDone && "bg-forest-500 text-ink-950",
                                isActive && "bg-gold-500 text-ink-950 ring-2 ring-gold-500/30 animate-glow-pulse",
                                step.status === "pending" && "bg-ink-700 text-ink-500 border border-ink-600"
                              )}
                            >
                              {isDone ? (
                                <Check className="h-3 w-3" />
                              ) : isActive ? (
                                <span className="h-2 w-2 rounded-full bg-ink-950" />
                              ) : (
                                <span className="text-[10px] font-bold">{i + 1}</span>
                              )}
                            </div>
                            {i < fulfillmentSteps.length - 1 && (
                              <div className={cn("mt-0.5 w-0.5 flex-1 min-h-[20px]", isDone ? "bg-forest-500/40" : "bg-ink-700")} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn(
                                "text-xs font-medium truncate",
                                isDone ? "text-forest-300" : isActive ? "text-gold-400 font-semibold" : "text-ink-400"
                              )}>
                                {step.title}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-ink-500 shrink-0" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-ink-500 shrink-0" />
                              )}
                            </div>
                            {step.time && <p className="text-[10px] text-ink-500 mt-0.5">{step.time}</p>}
                            {step.countdown && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-gold-500/10 px-2 py-0.5"
                              >
                                <Clock className="h-3 w-3 text-gold-400" />
                                <span className="font-mono text-[11px] font-bold text-gold-400">{formatTime(remainTime)}</span>
                              </motion.div>
                            )}
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden pl-8"
                            >
                              <div className="pb-3 text-[11px] text-ink-400 leading-relaxed">{step.detail}</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* ==================== 🎯 操作建议卡 ==================== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card overflow-hidden"
            >
              <div className="p-5 space-y-3.5">
                <div className="rounded-xl border border-gold-500/25 bg-gold-500/5 p-3">
                  <p className="text-[11px] font-semibold text-gold-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    温馨提示
                  </p>
                  <p className="text-xs text-ink-300 mt-1.5 leading-relaxed">
                    本单成色 <span className="text-gold-400 font-bold">S 级</span>，建议考虑「<span className="text-gold-400 font-semibold">寄售最高价</span>」档可多赚
                    <span className="font-mono font-bold text-gold-400 ml-1">¥6,265</span>
                  </p>
                </div>

                <div className="rounded-xl border border-forest-500/25 bg-forest-500/5 p-3">
                  <p className="text-[11px] font-semibold text-forest-300 flex items-center gap-1.5">
                    <Leaf className="h-3.5 w-3.5" />
                    推荐操作
                  </p>
                  <p className="text-xs text-ink-300 mt-1.5 leading-relaxed">
                    签署完成后 → 可预约下次旧物上门，<span className="text-forest-400 font-semibold">满 3 件额外补贴 ¥500</span>
                  </p>
                </div>

                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-forest-500/20 to-gold-500/20 border border-gold-500/30 py-3 text-sm font-semibold text-gold-300 hover:shadow-gold-sm transition-all">
                  <Headphones className="h-4 w-4" />
                  联系专属顾问
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ===== 底部悬浮操作栏 ===== */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.06] bg-ink-900/95 backdrop-blur-xl"
      >
        <div className="container mx-auto flex items-center gap-3 py-3 px-4 max-w-7xl">
          <div className="flex items-center gap-1 shrink-0">
            <button className="h-10 w-10 rounded-xl border border-white/[0.06] bg-ink-850 flex items-center justify-center text-ink-300 hover:text-gold-400 hover:border-gold-500/30 transition-colors">
              <Headphones className="h-4 w-4" />
            </button>
            <button className="h-10 w-10 rounded-xl border border-white/[0.06] bg-ink-850 flex items-center justify-center text-ink-300 hover:text-gold-400 hover:border-gold-500/30 transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="h-10 w-10 rounded-xl border border-white/[0.06] bg-ink-850 flex items-center justify-center text-ink-300 hover:text-gold-400 hover:border-gold-500/30 transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            <button className="hidden sm:flex items-center gap-1.5 rounded-xl border border-coral-500/25 bg-coral-500/5 px-4 py-2.5 text-xs font-medium text-coral-400 hover:bg-coral-500/10 transition-colors">
              <X className="h-3.5 w-3.5" />取消订单
            </button>
            <button className="hidden sm:flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2.5 text-xs font-medium text-gold-400 hover:bg-gold-500/20 transition-colors">
              <TrendingUp className="h-3.5 w-3.5" />议价申请
            </button>
            <button
              onClick={handleSubmitSign}
              disabled={!canSubmitSign || signing || signed}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all relative overflow-hidden",
                canSubmitSign && !signing && !signed
                  ? "bg-gold-gradient text-ink-950 shadow-gold hover:shadow-gold-sm hover:brightness-110 active:scale-[0.98] animate-glow-pulse"
                  : signed
                  ? "bg-forest-500/20 text-forest-300 border border-forest-500/30 cursor-default"
                  : "bg-ink-800 text-ink-500 cursor-not-allowed border border-ink-700"
              )}
            >
              {signed ? (
                <><Check className="h-4 w-4" />已完成签署</>
              ) : signing ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                    <path d="M 22 12 A 10 10 0 0 0 12 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  处理中
                </>
              ) : (
                <><Check className="h-4 w-4" />确认签署并同意打款</>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ===== 日历模态框 ===== */}
      <AnimatePresence>
        {showCalendarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCalendarModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass-card gold-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <h3 className="font-display text-lg font-bold text-ink-100 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gold-500" />
                  选择上门时间段
                </h3>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="h-8 w-8 rounded-lg bg-ink-850 flex items-center justify-center text-ink-400 hover:text-gold-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {slots.map((d, di) => (
                  <div key={d.date} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-200">
                        {d.date.slice(5)} · {d.weekday}
                      </p>
                      {d.periods.every((p) => !p.available) && (
                        <span className="text-[10px] text-ink-500">已约满</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {d.periods.map((p, pi) => (
                        <button
                          key={pi}
                          disabled={!p.available}
                          onClick={() => handleSelectSlot(di, pi)}
                          className={cn(
                            "text-xs px-2 py-2.5 rounded-xl transition-all text-center",
                            (p as any).selected
                              ? "bg-gold-gradient text-ink-950 font-bold shadow-gold-sm"
                              : p.available
                              ? "bg-ink-850 text-ink-300 hover:bg-gold-500/10 hover:text-gold-400 border border-white/[0.04]"
                              : "bg-ink-900/50 text-ink-600 line-through cursor-not-allowed border border-ink-800"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 签署成功弹窗 ===== */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-md relative glass-card gold-border overflow-hidden p-8 text-center"
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-forest-500/20 blur-3xl" />
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 250 }}
                className="relative mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shadow-lg shadow-forest-500/40"
              >
                <Check className="h-10 w-10 text-white stroke-[3]" />
              </motion.div>
              <h3 className="relative mt-6 font-display text-2xl font-bold text-ink-100">签署成功</h3>
              <p className="relative mt-2 text-sm text-ink-400">协议已上链存证 · 具有完全法律效力</p>

              <div className="relative mt-6 space-y-2.5 text-left">
                <div className="rounded-xl bg-ink-850/50 p-3 flex items-center justify-between">
                  <span className="text-xs text-ink-400">协议编号</span>
                  <span className="font-mono text-xs text-ink-200">RSA-2026-0615-2F8A1E</span>
                </div>
                <div className="rounded-xl bg-ink-850/50 p-3 flex items-center justify-between">
                  <span className="text-xs text-ink-400">存证哈希</span>
                  <span className="font-mono text-xs text-ink-200 truncate ml-2 max-w-[60%]">0x8f3a9c1e...c2d1e4f</span>
                </div>
                <div className="rounded-xl bg-gold-500/10 border border-gold-500/20 p-3 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gold-500/20 flex items-center justify-center shrink-0">
                    <Banknote className="h-4 w-4 text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-ink-400">预计到账时间</p>
                    <p className="text-sm font-bold text-gold-400">30 分钟内 · 工商银行 ****8888</p>
                  </div>
                </div>
                <div className="rounded-xl bg-forest-500/10 border border-forest-500/20 p-3 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-forest-500/20 flex items-center justify-center shrink-0">
                    <TreePine className="h-4 w-4 text-forest-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-ink-400">环保贡献预告</p>
                    <p className="text-xs font-semibold text-forest-300">减碳 120kg · 种植 7 棵树 🌲</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="relative mt-6 w-full rounded-2xl bg-gold-gradient py-3.5 text-sm font-bold text-ink-950 shadow-gold hover:shadow-gold-sm hover:brightness-110 transition-all"
              >
                好的，我知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}