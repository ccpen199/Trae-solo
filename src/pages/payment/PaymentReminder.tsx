import { useState, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  Smartphone,
  Send,
  CheckCircle2,
  Settings,
  Calendar,
  AlertTriangle,
  Loader2,
  XCircle,
  Eye,
  X,
  FileText,
  Clock,
  RefreshCw,
  ExternalLink,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { useApi, apiFetch } from "@/utils/api";
import { formatDate } from "@/utils/format";

interface ReminderConfig {
  sms: boolean;
  system: boolean;
  wechat: boolean;
  advanceDays: number;
  reminderTime: string;
  categories: string[];
}

interface ChannelStatus {
  channel: string;
  status: "delivered" | "failed" | "pending";
}

interface ChannelDetail {
  channel: string;
  messageId?: string;
  status: "sent" | "pending" | "failed";
  response: string;
}

interface ReminderItem {
  id: string;
  category: string;
  message: string;
  dueDate: string;
  urgent: boolean;
  channels: string[];
  status: "pending" | "sent";
  sentDate?: string;
  amount: number;
  channelStatuses: ChannelStatus[];
  affectedBillId: string;
  billPeriod: string;
  sendAttempts: number;
  channelDetails: ChannelDetail[];
}

interface EffectiveChannel {
  key: string;
  label: string;
  status: "active" | "inactive";
  response: string;
}

interface SaveResult {
  success: boolean;
  message: string;
  effectiveChannels: EffectiveChannel[];
  nextReminderTime: string;
  affectedBills: number;
}

interface Receipt {
  channel: string;
  status: "delivered" | "failed";
  sentAt: string;
  response: string;
  phone?: string;
  device?: string;
}

const CHANNELS = [
  { key: "sms", label: "短信提醒", icon: Smartphone, desc: "通过手机短信推送账单提醒" },
  { key: "system", label: "系统通知", icon: Bell, desc: "通过APP/网页站内消息推送" },
  { key: "wechat", label: "公众号推送", icon: MessageSquare, desc: "通过微信公众号推送提醒" },
];

export default function PaymentReminder() {
  const [tab, setTab] = useState<"config" | "list">("config");
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const { data: config } = useApi<ReminderConfig>("/api/payment/reminder/config");
  const { data: list } = useApi<ReminderItem[]>("/api/payment/reminder/list", [listRefreshKey]);
  const [form, setForm] = useState<ReminderConfig>({
    sms: true,
    system: true,
    wechat: true,
    advanceDays: 3,
    reminderTime: "09:00",
    categories: ["水费", "电费", "燃气费", "社保"],
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReminderStatus, setSelectedReminderStatus] = useState<"pending" | "sent">("sent");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);

  useEffect(() => {
    if (config) {
      setForm(config);
    }
  }, [config]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await apiFetch<SaveResult>("/api/payment/reminder/config", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSaveResult(result);
      setToast({ type: "success", message: result.message });
      setListRefreshKey((k) => k + 1);
    } catch {
      setToast({ type: "error", message: "保存失败，请稍后重试" });
    } finally {
      setSaving(false);
    }
  };

  const handleViewReceipts = async (id: string, status: "pending" | "sent") => {
    setSelectedReminderStatus(status);
    setReceiptModalOpen(true);
    setReceiptsLoading(true);
    try {
      if (status === "sent") {
        const data = await apiFetch<Receipt[]>(`/api/payment/reminder/${id}/receipts`);
        setReceipts(data);
      } else {
        setReceipts([]);
      }
    } catch {
      setReceipts([]);
    } finally {
      setReceiptsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-lg shadow-lg ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        {[
          { k: "config", l: "提醒设置", icon: Settings },
          { k: "list", l: "提醒记录", icon: Bell },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t.k
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-brand-500"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.l}
            </button>
          );
        })}
      </div>

      {tab === "config" && (
        <div className="space-y-6">
          {saveResult && (
            <div className="card">
              <h3 className="section-title">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 渠道生效状态
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {saveResult.effectiveChannels.map((c) => (
                  <div
                    key={c.key}
                    className={`p-4 rounded-xl border ${
                      c.status === "active"
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{c.label}</span>
                      {c.status === "active" ? (
                        <span className="tag-success">已生效</span>
                      ) : (
                        <span className="tag">未启用</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{c.response}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-600 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>下次提醒：{formatDate(saveResult.nextReminderTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span>影响账单：{saveResult.affectedBills} 条</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2 space-y-5">
              <div>
                <h3 className="section-title">
                  <Send className="w-5 h-5" /> 推送通道
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {CHANNELS.map((c) => {
                    const Icon = c.icon;
                    const on = (form as unknown as Record<string, boolean>)[c.key];
                    return (
                      <div
                        key={c.key}
                        onClick={() => setForm({ ...form, [c.key]: !on })}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                          on
                            ? "border-brand-500 bg-brand-50/50"
                            : "border-slate-200 hover:border-brand-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            on ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className={`w-10 h-6 rounded-full relative transition ${
                            on ? "bg-brand-500" : "bg-slate-300"
                          }`}>
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                              on ? "left-4" : "left-0.5"
                            }`} />
                          </div>
                        </div>
                        <div className="font-semibold text-sm text-brand-700">{c.label}</div>
                        <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="input-label">提前提醒天数</label>
                  <div className="flex gap-2">
                    {[1, 3, 5, 7, 15].map((d) => (
                      <button
                        key={d}
                        onClick={() => setForm({ ...form, advanceDays: d })}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                          form.advanceDays === d
                            ? "bg-brand-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {d}天
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="input-label">每日提醒时间</label>
                  <input
                    type="time"
                    className="input"
                    value={form.reminderTime}
                    onChange={(e) => setForm({ ...form, reminderTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">关注的缴费项目</label>
                <div className="grid grid-cols-3 gap-2">
                  {["水费", "电费", "燃气费", "暖气费", "通讯费", "社保", "有线电视", "物业费"].map((c) => {
                    const checked = form.categories.includes(c);
                    return (
                      <label
                        key={c}
                        onClick={() => {
                          setForm({
                            ...form,
                            categories: checked
                              ? form.categories.filter((x) => x !== c)
                              : [...form.categories, c],
                          });
                        }}
                        className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition ${
                          checked ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:border-brand-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="accent-brand-500"
                        />
                        <span className="text-sm">{c}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> 保存中...
                    </>
                  ) : (
                    "保存设置"
                  )}
                </button>
                <button className="btn-secondary">恢复默认</button>
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">
                <Calendar className="w-5 h-5" /> 推送预览
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Bell className="w-3.5 h-3.5" /> 模拟发送 · {form.reminderTime}
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="tag-info">系统通知</span>
                    <span className="text-xs text-slate-400">您的水费账单</span>
                  </div>
                  <p className="text-sm text-slate-700">
                    您的水费账单将于 {form.advanceDays} 天后到期，应缴金额 <span className="text-rose-600 font-semibold">¥128.50</span>，请及时缴纳。
                  </p>
                </div>
                {form.sms && (
                  <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="tag-success">短信</span>
                      <span className="text-xs text-slate-400">1069xxxx</span>
                    </div>
                    <p className="text-sm text-slate-700">
                      【全域缴费】您的水费账单将在{form.advanceDays}天后到期，金额128.50元，点击 t.cn/xx 立即缴费，退订回T。
                    </p>
                  </div>
                )}
                {form.wechat && (
                  <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="tag-warning">公众号</span>
                      <span className="text-xs text-slate-400">全域缴费服务号</span>
                    </div>
                    <p className="text-sm text-slate-700">
                      账单提醒：您的水费账单将于{form.advanceDays}天后到期，立即在公众号内完成缴费。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "list" && (
        <div className="card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 pb-5 border-b border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50">
              <div className="text-xs text-slate-500 mb-1">总数</div>
              <div className="text-xl font-bold text-slate-700">{(list || []).length}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50">
              <div className="text-xs text-emerald-600 mb-1">已发送</div>
              <div className="text-xl font-bold text-emerald-600">
                {(list || []).filter((r) => r.status === "sent").length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50">
              <div className="text-xs text-amber-600 mb-1">待发送</div>
              <div className="text-xl font-bold text-amber-600">
                {(list || []).filter((r) => r.status === "pending").length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50">
              <div className="text-xs text-rose-600 mb-1">紧急</div>
              <div className="text-xl font-bold text-rose-600">
                {(list || []).filter((r) => r.urgent).length}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {(list || []).map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-slate-100 hover:shadow-sm transition"
              >
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${
                      r.urgent ? "bg-rose-100 text-rose-600" : "bg-brand-50 text-brand-500"
                    }`}>
                      {r.urgent ? <AlertTriangle className="w-6 h-6" /> : <ReceiptIcon className="w-6 h-6" />}
                      {r.urgent && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">!</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-brand-700">{r.category}</span>
                          <span className="text-rose-600 font-bold">¥{r.amount.toFixed(2)}</span>
                          {r.status === "sent" ? (
                            <span className="tag-success"><CheckCircle2 className="w-3 h-3" />已发送</span>
                          ) : (
                            <span className="tag-warning"><Bell className="w-3 h-3" />待发送</span>
                          )}
                          {r.sendAttempts > 1 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-medium">
                              <RefreshCw className="w-3 h-3" />重试{r.sendAttempts}次
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{r.message}</p>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-4">
                          <span><Calendar className="w-3 h-3 inline mr-1" />账单截止：{r.dueDate}</span>
                          {r.sentDate && <span><Send className="w-3 h-3 inline mr-1" />发送于：{formatDate(r.sentDate)}</span>}
                        </p>
                      </div>
                    </div>

                    {(r.channelDetails || []).length > 0 && (
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {(r.channelDetails || []).map((cd, idx) => (
                            <div key={idx} className="bg-white rounded-md p-3 border border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm text-slate-700 capitalize">
                                  {cd.channel === "sms" ? "短信" : cd.channel === "system" ? "系统" : cd.channel === "wechat" ? "公众号" : cd.channel}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  cd.status === "sent"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : cd.status === "pending"
                                    ? "bg-sky-100 text-sky-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}>
                                  {cd.status === "sent" && <CheckCircle2 className="w-3 h-3" />}
                                  {cd.status === "pending" && <Clock className="w-3 h-3" />}
                                  {cd.status === "failed" && <XCircle className="w-3 h-3" />}
                                  {cd.status === "sent" ? "已发送" : cd.status === "pending" ? "发送中" : "失败"}
                                </span>
                              </div>
                              {cd.messageId && (
                                <p className="text-xs text-slate-400 mb-1 font-mono">ID: {cd.messageId}</p>
                              )}
                              <p className="text-xs text-slate-500 break-words">{cd.response}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-44 shrink-0 flex flex-col gap-3">
                    <div className="bg-gradient-to-br from-brand-50 to-white rounded-lg p-3 border border-brand-100">
                      <div className="flex items-center gap-1.5 text-xs text-brand-600 font-medium mb-1.5">
                        <FileText className="w-3.5 h-3.5" /> 关联账单
                      </div>
                      <div className="text-sm font-semibold text-slate-700 mb-0.5">{r.billPeriod || "—"}</div>
                      <div className="text-xs text-slate-400 mb-2 font-mono truncate">{r.affectedBillId || "—"}</div>
                      <button
                        onClick={() => setToast({ type: "success", message: "已跳转至缴费中心查看账单" })}
                        className="w-full flex items-center justify-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium py-1 rounded hover:bg-brand-50 transition"
                      >
                        <ExternalLink className="w-3 h-3" /> 查看账单
                      </button>
                    </div>
                    <button
                      onClick={() => handleViewReceipts(r.id, r.status)}
                      className="btn-secondary text-xs px-3 py-2 w-full"
                    >
                      <Eye className="w-3 h-3 mr-1" /> 查看回执
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {receiptModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg">推送回执详情</h3>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {receiptsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{selectedReminderStatus === "pending" ? "待发送，暂无回执数据" : "暂无回执数据"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{r.channel}</span>
                          {r.status === "delivered" ? (
                            <span className="tag-success"><CheckCircle2 className="w-3 h-3" />送达成功</span>
                          ) : (
                            <span className="tag-danger"><XCircle className="w-3 h-3" />发送失败</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(r.sentAt)}</span>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        <span className="text-slate-400">回执内容：</span>
                        <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded ml-1">{r.response}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {r.phone && (
                          <div className="flex items-center gap-1">
                            <Smartphone className="w-3.5 h-3.5" />
                            {r.phone}
                          </div>
                        )}
                        {r.device && (
                          <div className="flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5" />
                            {r.device}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
