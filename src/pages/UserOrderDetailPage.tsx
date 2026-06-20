import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  MapPin,
  Clock,
  User,
  Star,
  ShieldCheck,
  Camera,
  Check,
  AlertCircle,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusTimeline, { type TimelineStep } from "@/components/StatusTimeline";

const inspectionSteps: TimelineStep[] = [
  { label: "外观成色鉴定", description: "整体品相：95新，轻微使用痕迹", time: "14:20" },
  { label: "材质工艺核验", description: "材质：Togo小牛皮，缝线规整", time: "14:28" },
  { label: "五金配件检测", description: "镀金层厚度0.03mm，无氧化", time: "14:35" },
  { label: "内衬洁净度", description: "内衬：无污渍，无明显磨损", time: "14:40" },
  { label: "气味/异味检测", description: "气味：正常皮革味，无异常", time: "14:45" },
  { label: "真伪综合鉴定", description: "鉴定结果：正品，已生成证书", time: "14:52" },
];

const appearanceImages = Array.from({ length: 6 }, (_, i) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20handbag%20detail%20${i + 1}%20product%20photography%20studio%20lighting&image_size=square_hd`
);

const comparisonImages = Array.from({ length: 3 }, (_, i) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20bag%20price%20comparison%20screenshot%20ecommerce%20${i + 1}&image_size=landscape_4_3`
);

export default function UserOrderDetailPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [agreed, setAgreed] = useState(false);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#C9A962";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="space-y-6">
      <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-500/15 bg-ink-900 text-ink-300 transition-colors hover:border-gold-500/30 hover:text-gold-500"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-100">订单详情</h1>
        <p className="mt-0.5 text-sm text-ink-400">订单号：RS202606150001 · 提交于 2026-06-14 14:30</p>
      </div>
    </motion.div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-gold-500/15 bg-ink-900 p-6"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
            <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold text-ink-100">
              <ImageIcon className="h-5 w-5 text-gold-500" />
              商品信息
            </h2>
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="relative h-48 w-full sm:w-48 shrink-0 overflow-hidden rounded-xl border border-gold-500/20 bg-ink-800">
                <img
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Hermes%20Birkin%2030%20Etoupe%20Togo%20leather%20luxury%20handbag%20product%20photography%20dark%20background&image_size=square_hd"
                  alt="商品主图"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <span className="rounded-full bg-ink-900/90 px-2.5 py-1 text-[10px] font-semibold text-gold-400 ring-1 ring-gold-500/30">
                    95新
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gold-500 tracking-wider">HERMÈS · 爱马仕</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-ink-100">Birkin 30 Epsom Etoupe</h3>
                <p className="mt-2 text-sm text-ink-400">经典款手提包 · 大象灰 · Epsom牛皮 · 银扣</p>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs text-ink-500">首发公价</p>
                    <p className="text-sm font-medium text-ink-300 line-through">¥158,000</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-ink-500">当前估价</p>
                    <p className="font-display text-xl font-bold gold-text">¥128,000</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-ink-500">成色评级</p>
                    <p className="text-sm font-medium text-forest-400">S级 · 95新</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-ink-500">预估到账</p>
                    <p className="text-sm font-medium text-jade-400">签署后24小时内</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-gold-500/15 bg-ink-900 p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-100">
                <ShieldCheck className="h-5 w-5 text-gold-500" />
                检测报告
              </h2>
              <button className="flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-400 transition-colors hover:bg-gold-500/20">
                <Download className="h-4 w-4" />
                下载PDF报告
              </button>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-ink-850 p-4">
              <StatusTimeline steps={inspectionSteps} currentIndex={6} />
            </div>

            <h3 className="mt-6 mb-3 text-sm font-semibold text-ink-200">外观细节图（6张）</h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {appearanceImages.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.12 + i * 0.04 }}
                  className="relative aspect-square overflow-hidden rounded-lg border border-gold-500/10 bg-ink-800 group cursor-pointer"
                >
                  <img src={src} alt={`外观${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-950/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute left-1 top-1 rounded bg-ink-950/80 px-1.5 py-0.5 text-[10px] font-medium text-ink-200">#{i + 1}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-gold-500/15 bg-ink-900 p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-100">
              <MapPin className="h-5 w-5 text-gold-500" />
              上门信息
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-ink-850 p-3">
                <Clock className="mt-0.5 h-5 w-5 text-gold-500" />
                <div>
                  <p className="text-xs text-ink-400">预约时间窗</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink-100">6月16日 周二 14:00 - 16:00</p>
                </div>
              </div>

              <div className="relative aspect-video overflow-hidden rounded-xl border border-gold-500/15 bg-gradient-to-br from-forest-900/20 to-ink-850">
                <div className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(201,169,98,0.1) 1px, transparent 1px, transparent calc(100% - 1px), rgba(201,169,98,0.1) calc(100% - 1px), rgba(201,169,98,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,98,0.1) 1px, transparent 1px, transparent calc(100% - 1px), rgba(201,169,98,0.1) calc(100% - 1px)",
                    backgroundSize: "32px 32px, 32px 32px, 0 32px",
                  }}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 ring-4 ring-gold-500/30 shadow-gold">
                  <MapPin className="h-5 w-5 text-ink-950" />
                </div>
                <div className="absolute bottom-3 left-3 rounded-lg bg-ink-900/80 px-3 py-1.5 text-xs text-ink-200">静安区南京西路1266号恒隆广场</div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gold-500/15 bg-ink-850 p-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center">
                    <User className="h-6 w-6 text-ink-100" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-jade-500 ring-2 ring-ink-900" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink-100">王鉴定师</p>
                    <div className="flex items-center gap-0.5 text-xs text-gold-500">
                      <Star className="h-3 w-3 fill-gold-500" />
                      <span className="font-semibold">4.9</span>
                    </div>
                  </div>
                  <p className="text-xs text-ink-400">从业8年 · 已鉴定3,280件</p>
                  <p className="mt-1 text-xs text-forest-400">距离您 2.3km · 预计15分钟到达</p>
                </div>
                <button className="rounded-lg bg-ink-800 p-2 text-ink-300 hover:bg-gold-500/10 hover:text-gold-500 transition-colors">
                  <Camera className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-gold-500/15 bg-ink-900 p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-100">
              <ShieldCheck className="h-5 w-5 text-gold-500" />
              三方比价参考
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {comparisonImages.map((src, i) => (
                <div key={i} className="relative aspect-video overflow-hidden rounded-lg border border-white/[0.06] bg-ink-800">
                  <img src={src} alt={`比价${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-ink-500">数据来源于公开市场近期成交均价参考</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative overflow-hidden rounded-2xl border border-gold-500/20 bg-gradient-to-br from-gold-500/5 to-transparent p-6 shadow-gold-sm"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 opacity-60" />
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-gold-400">
              <Check className="h-5 w-5" />
              退货协议签署
            </h2>

            <div className="max-h-32 overflow-y-auto rounded-xl border border-white/[0.06] bg-ink-900/60 p-4 text-xs leading-relaxed text-ink-400">
              <p className="mb-2 font-semibold text-ink-300">《奢侈品回收服务协议》</p>
              <p className="mb-2">第一条 服务内容：甲方（用户）委托乙方（奢收管家）提供奢侈品上门回收及鉴定服务...</p>
              <p className="mb-2">第二条 鉴定标准：乙方按照行业通用标准进行成色鉴定，鉴定结果仅供参考...</p>
              <p className="mb-2">第三条 估价机制：乙方提供三方比价，最终成交价以双方确认的估价为准...</p>
              <p className="mb-2">第四条 退货条款：自签署协议后7天内，如商品存在真伪问题可申请无理由退货...</p>
              <p>第五条 争议解决：如发生争议，双方友好协商解决；协商不成，提交上海仲裁委员会...</p>
              <p className="mt-2">第六条 其他条款：本协议一式两份，甲乙双方各执一份，具有同等法律效力...</p>
              <p className="mt-2">第七条 生效条件：本协议自双方签署之日起生效...</p>
              <p>第八条 保密条款：双方对交易内容严格保密，不得向第三方披露...</p>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-ink-300">请在此处签名确认</p>
              <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gold-500/30 bg-ink-900/60">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={100}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                />
                <button
                  onClick={clearSignature}
                  className="absolute right-2 top-2 rounded-lg bg-ink-800 px-2 py-1 text-[10px] text-ink-400 hover:text-gold-500 transition-colors"
                >
                  清除
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-ink-300">短信验证码</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  className="flex-1 rounded-xl border border-white/[0.08] bg-ink-900 px-4 py-2.5 text-sm text-ink-100 placeholder-ink-500 outline-none focus:border-gold-500/40"
                />
                <button className="shrink-0 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 text-sm font-medium text-gold-400 hover:bg-gold-500/20 transition-colors">
                  获取验证码
                </button>
              </div>
            </div>

            <label className="mt-4 flex items-start gap-2 text-xs text-ink-400 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-ink-600 bg-ink-800 text-gold-500 focus:ring-gold-500"
              />
              我已阅读并同意以上所有条款，确认商品信息无误
            </label>

            <button
              disabled={!agreed}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 py-3 text-sm font-bold text-ink-950 shadow-gold-sm transition-all hover:from-gold-400 hover:to-gold-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-gold-500 disabled:hover:to-gold-600"
            >
              {agreed ? (
                <>
                  <Check className="h-4 w-4" />
                  确认签署并同意交易
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  请先勾选同意条款
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
