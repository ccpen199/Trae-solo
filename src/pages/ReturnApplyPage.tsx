import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  X,
  AlertTriangle,
  Frown,
  Sparkles,
  Tag,
  HelpCircle,
  CreditCard,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type ReturnReason = "dissatisfaction" | "defect" | "mismatch" | "price" | "other";
type RefundMethod = "original" | "bank";

interface ReasonOption {
  key: ReturnReason;
  label: string;
  desc: string;
  icon: typeof Frown;
}

const reasonOptions: ReasonOption[] = [
  { key: "dissatisfaction", label: "使用不满", desc: "尺寸/颜色/风格不符合预期", icon: Frown },
  { key: "defect", label: "商品有瑕疵", desc: "存在未披露的磨损/损伤", icon: AlertTriangle },
  { key: "mismatch", label: "与描述不符", desc: "实物与检测报告有差异", icon: Sparkles },
  { key: "price", label: "价格异议", desc: "对最终估价金额不认可", icon: Tag },
  { key: "other", label: "其他原因", desc: "个人特殊情况等", icon: HelpCircle },
];

export default function ReturnApplyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("original");
  const [photos, setPhotos] = useState<string[]>([]);

  const addPhoto = () => {
    if (photos.length >= 6) return;
    const newPhoto = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=return%20merchandise%20photo%20evidence%20${photos.length + 1}&image_size=square`;
    setPhotos([...photos, newPhoto]);
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const steps = ["选择原因", "上传凭证", "选择退款方式"];
  const canProceed =
    (step === 0 && reason !== null) ||
    (step === 1 && photos.length >= 2) ||
    step === 2;

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
          <h1 className="font-display text-2xl font-bold text-ink-100">申请退货</h1>
          <p className="mt-0.5 text-sm text-ink-400">原订单 RS202605280023 · Chanel Classic Flap</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-gold-500/15 bg-ink-900 p-6"
      >
        <div className="relative mb-2 flex justify-between">
          {steps.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex flex-1 flex-col items-center relative">
                {i > 0 && (
                  <div
                    className={`absolute left-[-50%] right-[50%] top-5 h-0.5 -translate-y-1/2 ${
                      done ? "bg-gradient-to-r from-forest-500 to-forest-400" : "bg-ink-700"
                    }`}
                  />
                )}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06, type: "spring" }}
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ring-4 ring-ink-900 ${
                    done
                      ? "bg-gradient-to-br from-forest-400 to-forest-600 text-ink-950"
                      : active
                      ? "bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 shadow-gold-sm"
                      : "bg-ink-700 text-ink-400"
                  }`}
                >
                  {done ? <Check className="h-5 w-5" /> : i + 1}
                </motion.div>
                <p
                  className={`mt-3 text-sm font-medium ${
                    done || active ? "text-ink-100" : "text-ink-500"
                  }`}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-gold-500/15 bg-ink-900 p-6"
          >
            <h2 className="mb-4 font-display text-lg font-bold text-ink-100">请选择退货原因</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reasonOptions.map((opt, i) => {
                const Icon = opt.icon;
                const selected = reason === opt.key;
                return (
                  <motion.button
                    key={opt.key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setReason(opt.key)}
                    whileHover={{ y: -2 }}
                    className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? "border-gold-500/50 bg-gold-500/10 shadow-gold-sm"
                        : "border-white/[0.06] bg-ink-850 hover:border-gold-500/30"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        selected ? "bg-gold-500/20 text-gold-400" : "bg-ink-800 text-ink-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink-100">{opt.label}</p>
                      <p className="mt-1 text-xs text-ink-400">{opt.desc}</p>
                    </div>
                    {selected && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500">
                        <Check className="h-3 w-3 text-ink-950" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-gold-500/15 bg-ink-900 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink-100">上传退货凭证照片</h2>
              <span className="text-xs text-ink-400">{photos.length}/6 · 至少上传2张</span>
            </div>
            <p className="mb-5 rounded-xl bg-ink-850 p-3 text-xs text-ink-300">
              <AlertTriangle className="mr-2 inline h-4 w-4 text-gold-500 align-middle" />
              请上传商品整体外观、瑕疵部位特写、包装材料等清晰照片，有助于加快审核速度
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {photos.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square overflow-hidden rounded-xl border border-gold-500/15 bg-ink-800"
                >
                  <img src={p} alt={`凭证${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-950/80 text-ink-100 hover:bg-coral-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
              {photos.length < 6 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={addPhoto}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold-500/25 bg-ink-850 text-ink-400 transition-colors hover:border-gold-500/50 hover:text-gold-500"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-xs font-medium">上传</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-gold-500/15 bg-ink-900 p-6">
              <h2 className="mb-4 font-display text-lg font-bold text-ink-100">选择退款方式</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    key: "original" as const,
                    label: "原路退回",
                    desc: "退回至原支付账户（微信/支付宝/银行卡）",
                    icon: CreditCard,
                    meta: "预计1-3个工作日到账",
                  },
                  {
                    key: "bank" as const,
                    label: "银行卡转账",
                    desc: "退回到指定银行账户",
                    icon: Building2,
                    meta: "预计2-5个工作日到账",
                  },
                ].map((opt, i) => {
                  const Icon = opt.icon;
                  const selected = refundMethod === opt.key;
                  return (
                    <motion.button
                      key={opt.key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setRefundMethod(opt.key)}
                      className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? "border-gold-500/50 bg-gold-500/10 shadow-gold-sm"
                          : "border-white/[0.06] bg-ink-850 hover:border-gold-500/30"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          selected ? "bg-gold-500/20 text-gold-400" : "bg-ink-800 text-ink-400"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink-100">{opt.label}</p>
                          {selected && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500">
                              <Check className="h-3 w-3 text-ink-950" />
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-ink-400">{opt.desc}</p>
                        <p className="mt-1.5 text-[11px] text-jade-400">{opt.meta}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {refundMethod === "bank" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden rounded-2xl border border-gold-500/15 bg-ink-900 p-6"
              >
                <h3 className="mb-4 font-semibold text-ink-100">填写银行卡信息</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "开户人姓名", placeholder: "请输入与身份证一致的姓名" },
                    { label: "开户银行", placeholder: "请选择开户银行" },
                    { label: "银行卡号", placeholder: "请输入完整银行卡号", full: true },
                    { label: "开户支行", placeholder: "请填写具体开户支行", full: true },
                  ].map((f, i) => (
                    <div key={i} className={f.full ? "sm:col-span-2" : ""}>
                      <label className="mb-1.5 block text-xs font-medium text-ink-300">{f.label}</label>
                      <input
                        placeholder={f.placeholder}
                        className="w-full rounded-xl border border-white/[0.08] bg-ink-850 px-4 py-2.5 text-sm text-ink-100 placeholder-ink-500 outline-none focus:border-gold-500/40"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="rounded-2xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 to-transparent p-5 shadow-gold-sm">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gold-400">
                <Check className="h-5 w-5" />
                退货申请确认
              </h3>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="flex justify-between text-ink-300">
                  <span className="text-ink-400">退款金额：</span>
                  <span className="font-display text-lg font-bold gold-text">¥68,000.00</span>
                </p>
                <p className="flex justify-between text-ink-300">
                  <span className="text-ink-400">退款方式：</span>
                  <span className="font-medium text-ink-100">
                    {refundMethod === "original" ? "原路退回" : "银行卡转账"}
                  </span>
                </p>
                <p className="flex justify-between text-ink-300">
                  <span className="text-ink-400">退货原因：</span>
                  <span className="font-medium text-ink-100">
                    {reason ? reasonOptions.find((r) => r.key === reason)?.label : "-"}
                  </span>
                </p>
                <p className="flex justify-between text-ink-300">
                  <span className="text-ink-400">预计到账：</span>
                  <span className="font-medium text-jade-400">7个工作日内</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-between gap-3 rounded-2xl border border-gold-500/10 bg-ink-900 p-4"
      >
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-850 px-5 py-2.5 text-sm font-medium text-ink-200 transition-colors hover:border-gold-500/30 hover:text-gold-500"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 0 ? "上一步" : "取消申请"}
        </button>

        {step < 2 ? (
          <motion.button
            whileHover={{ scale: canProceed ? 1.02 : 1 }}
            whileTap={{ scale: canProceed ? 0.98 : 1 }}
            disabled={!canProceed}
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-2.5 text-sm font-bold text-ink-950 shadow-gold-sm transition-all hover:from-gold-400 hover:to-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            下一步
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-forest-500 to-forest-600 px-6 py-2.5 text-sm font-bold text-ink-100 shadow-gold-sm hover:from-forest-400 hover:to-forest-500 transition-all"
          >
            <Check className="h-4 w-4" />
            确认提交退货申请
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
