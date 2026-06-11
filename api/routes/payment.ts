import express, { type Request, type Response } from "express";
import * as db from "../mock/data.js";

const router = express.Router();

const dateWithOffset = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

const normalizeInvoiceStatus = (status: string): "issued" | "pending" | "void" => {
  if (status === "issued" || status === "sent") return "issued";
  if (status === "sending") return "pending";
  return "void";
};

router.get("/categories", (_req: Request, res: Response) => {
  res.json(db.paymentCategories);
});

router.get("/bills/:accountNo", (req: Request, res: Response) => {
  const accountNo = req.params.accountNo;
  const bills = [
    {
      id: "B001",
      accountNo,
      category: "electricity",
      categoryName: "电费",
      amount: 286.5,
      period: "2026年5月",
      dueDate: "2026-06-15",
      status: "unpaid",
      daysLeft: 4,
      canDeduct: true,
    },
    {
      id: "B002",
      accountNo,
      category: "water",
      categoryName: "水费",
      amount: 68.2,
      period: "2026年5月",
      dueDate: "2026-06-18",
      status: "unpaid",
      daysLeft: 7,
      canDeduct: true,
    },
    {
      id: "B003",
      accountNo,
      category: "gas",
      categoryName: "燃气费",
      amount: 145.8,
      period: "2026年5月",
      dueDate: "2026-06-20",
      status: "unpaid",
      daysLeft: 9,
      canDeduct: true,
    },
    {
      id: "B004",
      accountNo,
      category: "communication",
      categoryName: "通讯费",
      amount: 129.0,
      period: "2026年6月",
      dueDate: "2026-06-25",
      status: "unpaid",
      daysLeft: 14,
      canDeduct: false,
    },
    {
      id: "B005",
      accountNo,
      category: "social",
      categoryName: "社保",
      amount: 1280.0,
      period: "2026年6月",
      dueDate: "2026-06-30",
      status: "unpaid",
      daysLeft: 19,
      canDeduct: true,
    },
    {
      id: "B006",
      accountNo,
      category: "heating",
      categoryName: "暖气费",
      amount: 2400.0,
      period: "2025-2026采暖季",
      dueDate: "2026-06-10",
      status: "overdue",
      daysLeft: -1,
      canDeduct: false,
    },
    {
      id: "B007",
      accountNo,
      category: "communication",
      categoryName: "宽带费",
      amount: 99.0,
      period: "2026年6月",
      dueDate: "2026-06-22",
      status: "unpaid",
      daysLeft: 11,
      canDeduct: true,
    },
  ];
  res.json(bills);
});

router.post("/pay", (_req: Request, res: Response) => {
  res.json({ success: true, paymentId: "PAY" + Date.now() });
});

router.post("/confirm", (req: Request, res: Response) => {
  const billIds = Array.isArray(req.body?.billIds) ? req.body.billIds : [];
  const payMethod = String(req.body?.payMethod || "wechat");
  const knownBills = [
    { id: "B001", amount: 286.5 },
    { id: "B002", amount: 68.2 },
    { id: "B003", amount: 145.8 },
    { id: "B004", amount: 129.0 },
    { id: "B005", amount: 1280.0 },
    { id: "B006", amount: 2400.0 },
    { id: "B007", amount: 99.0 },
  ];
  const amount = knownBills
    .filter((bill) => billIds.includes(bill.id))
    .reduce((sum, bill) => sum + bill.amount, 0);

  res.json({
    success: true,
    orderNo: "PAY" + Date.now(),
    amount: Number(amount.toFixed(2)),
    payTime: dateWithOffset(0),
    payMethod,
  });
});

router.get("/records", (_req: Request, res: Response) => {
  res.json(db.paymentRecords);
});

router.post("/auto-deduct/sign", (_req: Request, res: Response) => {
  res.json({ success: true, signId: "ADS" + Date.now() });
});

router.delete("/auto-deduct/:id", (_req: Request, res: Response) => {
  res.json({ success: true });
});

router.get("/auto-deduct/list", (_req: Request, res: Response) => {
  res.json(db.autoDeductSigns);
});

router.get("/auto-deduct/records", (_req: Request, res: Response) => {
  res.json(db.deductRecords);
});

router.get("/reminder/config", (_req: Request, res: Response) => {
  res.json(db.reminderConfig);
});

router.put("/reminder/config", (_req: Request, res: Response) => {
  res.json({ success: true });
});

router.get("/reminder/list", (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  res.json(db.reminderList.slice(0, limit));
});

router.get("/invoice/list", (_req: Request, res: Response) => {
  res.json(db.invoices);
});

router.get("/invoice/:id", (req: Request, res: Response) => {
  const inv = db.invoices.find((i) => i.id === req.params.id);
  res.json(inv || null);
});

router.post("/invoice/:id/download", (_req: Request, res: Response) => {
  res.json({ success: true, url: "/mock/invoice.pdf" });
});

router.post("/correction/apply", (_req: Request, res: Response) => {
  res.json({ success: true, requestId: "CR" + Date.now() });
});

router.get("/correction/list", (_req: Request, res: Response) => {
  res.json(db.correctionRequests);
});

router.post("/correction/:id/arbitrate", (_req: Request, res: Response) => {
  res.json({ success: true });
});

router.get("/records/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const record = db.paymentRecords.find((r) => r.id === id);
  if (!record) {
    return res.status(404).json({ success: false, error: "记录不存在" });
  }
  const invoice = db.invoices.find((i) => i.paymentId === id);
  const detail = {
    ...record,
    categoryName: record.category,
    accountNo: "370101199001011234",
    period: "2026年5月",
    billDetails: [
      { name: "基本用量", quantity: 156, unitPrice: 0.56, amount: 87.36 },
      { name: "阶梯用量", quantity: 89, unitPrice: 0.78, amount: 69.42 },
      { name: "城市附加费", quantity: 1, unitPrice: 15.0, amount: 15.0 },
      { name: "三峡建设基金", quantity: 1, unitPrice: 8.72, amount: 8.72 },
    ],
    fundFlow: [
      { step: 1, title: "用户支付", amount: record.amount, time: record.paidAt, description: `${record.method} 已完成扣款`, status: "success" },
      { step: 2, title: "平台清算", amount: record.amount, time: record.paidAt, description: "光大银行存管账户入账并生成清算批次", status: "success" },
      { step: 3, title: "商户结算", amount: Number((record.amount * 0.995).toFixed(2)), time: record.paidAt, description: `${record.category} 服务商待结算金额`, status: record.status === "failed" ? "pending" : "success" },
      { step: 4, title: "平台分润", amount: Number((record.amount * 0.005).toFixed(2)), time: record.paidAt, description: "平台服务费按清算规则自动入账", status: record.status === "failed" ? "pending" : "success" },
    ],
    invoice: invoice
      ? {
          invoiceNo: invoice.invoiceNo,
          amount: invoice.amount,
          issueDate: invoice.createdDate,
          status: normalizeInvoiceStatus(invoice.status),
          downloadUrl: `/api/payment/invoice/${invoice.id}/download`,
        }
      : null,
    processTrail: [
      { time: record.paidAt, action: "用户发起支付", operator: "张明", remark: "提交账单确认并选择支付方式" },
      { time: record.paidAt, action: "支付渠道响应", operator: record.method, remark: record.status === "failed" ? "通道超时，进入异常诊断" : "支付渠道返回成功" },
      { time: record.paidAt, action: "缴费状态确认", operator: "系统", remark: record.status === "failed" ? "已创建对账任务和重试建议" : "账单状态更新为已缴费" },
      { time: record.paidAt, action: "电子发票归集", operator: "系统", remark: invoice ? "发票已归集到票据中心" : "等待服务商开票" },
    ],
    failureInfo: record.status === "failed" ? {
      rootCause: "微信支付通道响应超时，银行侧已扣款但平台未收到成功通知",
      errorCode: "PAY_TIMEOUT_001",
      suggestions: [
        "系统已自动发起对账，预计5分钟内完成状态同步",
        "如对账成功，订单状态将自动更新为成功",
        "如对账发现为单边账，资金将原路退回（1-3工作日）",
        "紧急情况可点击下方「重新发起」按钮重试",
      ],
      retryCount: 2,
      nextRetryTime: new Date(Date.now() + 300000).toISOString(),
    } : null,
  };
  res.json(detail);
});

router.post("/records/:id/retry", (req: Request, res: Response) => {
  const id = req.params.id;
  res.json({
    success: true,
    newPaymentId: "PAY" + Date.now(),
    message: "已重新发起支付，跳转至支付通道",
  });
});

router.post("/records/:id/correction", (req: Request, res: Response) => {
  const id = req.params.id;
  const body = req.body;
  res.json({
    success: true,
    requestId: "CR" + Date.now(),
    message: "错缴冲正申请已提交",
    estimatedTime: body.reason?.includes("重复") ? "24小时内自动处理" : "1-3个工作日人工仲裁",
  });
});

router.post("/records/:id/arbitrate", (_req: Request, res: Response) => {
  res.json({ success: true, message: "已提交人工仲裁申请" });
});

const confirmPayment = (req: Request, res: Response) => {
  const { billIds, payMethod } = req.body;
  const billAmountMap: Record<string, number> = {
    B001: 286.5,
    B002: 68.2,
    B003: 145.8,
  };
  const selectedBillIds = Array.isArray(billIds) ? billIds : [];
  const total = selectedBillIds.length > 0
    ? selectedBillIds.reduce((sum, id) => sum + (billAmountMap[id] || 0), 0)
    : 499.5;

  res.json({
    success: true,
    orderNo: "PAY" + Date.now(),
    amount: total,
    payTime: new Date().toISOString(),
    payMethod,
    billIds,
    needSign: payMethod === "auto_deduct" && false,
    redirectUrl: payMethod === "wechat" ? "wxpay://..." : payMethod === "alipay" ? "alipays://..." : null,
  });
};

router.post("/pay/confirm", confirmPayment);
router.post("/confirm", confirmPayment);

router.post("/reminder/config", async (req: Request, res: Response) => {
  const config = req.body;
  await new Promise((r) => setTimeout(r, 800));
  res.json({
    success: true,
    message: "配置保存成功",
    effectiveChannels: [
      { key: "sms", label: "短信提醒", status: config.sms ? "active" : "inactive", response: "运营商已确认，回执号 SM202606100001" },
      { key: "system", label: "系统通知", status: config.system ? "active" : "inactive", response: "站内消息通道已就绪" },
      { key: "wechat", label: "公众号推送", status: config.wechat ? "active" : "inactive", response: config.wechat ? "微信公众平台授权成功" : "未开启" },
    ],
    nextReminderTime: "2026-06-11 " + config.reminderTime,
    affectedBills: 3,
  });
});

router.get("/reminder/:id/receipts", (req: Request, res: Response) => {
  const id = req.params.id;
  res.json([
    { channel: "短信", status: "delivered", sentAt: dateWithOffset(-1), response: `运营商回执ID: SMS-${id}-001234`, phone: "138****8888" },
    { channel: "系统通知", status: "delivered", sentAt: dateWithOffset(-1), response: "站内信已读", device: "Chrome / macOS" },
    { channel: "公众号", status: "failed", sentAt: dateWithOffset(-1), response: "用户未关注服务号" },
  ]);
});

export default router;
