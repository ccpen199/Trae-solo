import express, { type Request, type Response } from "express";
import * as db from "../mock/data.js";

const router = express.Router();

const SCENARIO_CAUSES: Record<string, { cause: string; category: string; categoryName: string; suggestions: string[]; estimated: string }> = {
  timeout: {
    cause: "支付请求发送后，第三方支付通道响应超时。银行侧可能已完成扣款但平台未收到回执，导致单边账。",
    category: "pay_timeout",
    categoryName: "支付超时",
    suggestions: [
      "请耐心等待5-10分钟，系统将自动发起对账补单，完成后状态自动更新",
      "若10分钟后仍显示处理中，请到「错缴冲正」页面提交冲正申请，选择「支付异常」类型",
      "可拨打客服电话 400-xxx-xxxx 提供订单号，由人工协助核实",
    ],
    estimated: "5-10分钟自动处理",
  },
  bank_fail: {
    cause: "代扣银行返回扣款失败，常见原因为Ⅱ类户余额不足、签约状态异常或银行系统维护中。",
    category: "bank_fail",
    categoryName: "银行代扣失败",
    suggestions: [
      "登录绑定的银行APP，确认Ⅱ类户余额是否充足（建议预留应扣金额的1.1倍）",
      "在「代扣签约」页面确认签约状态为「生效中」，如异常请重新签约",
      "如遇银行系统维护，次日系统将自动重试一次，也可改为手动即时缴费",
    ],
    estimated: "当日可解决",
  },
  balance: {
    cause: "支付账户或绑定的Ⅱ类户可用余额不足，无法完成本次缴费金额的扣款。",
    category: "balance_insufficient",
    categoryName: "余额不足",
    suggestions: [
      "向绑定的银行Ⅱ类户或支付账户充值足额资金后重试",
      "切换其他支付方式（微信/支付宝/其他银行卡）完成缴费",
      "如已开通自动代扣，请确保扣款日前账户余额充足",
    ],
    estimated: "充值后即时可解决",
  },
  network: {
    cause: "缴费过程中用户网络中断或平台与第三方接口通信异常，导致交易状态不确定。",
    category: "network_error",
    categoryName: "网络异常",
    suggestions: [
      "检查手机/电脑网络连接是否正常，切换WiFi或4G重试",
      "在「缴费记录」页面确认该笔订单状态，如为处理中请等待自动对账",
      "如确认未扣款，可重新发起缴费；已扣款情况下请勿重复操作",
    ],
    estimated: "5-30分钟自动对账",
  },
  verify: {
    cause: "实名校验未通过：姓名、身份证号、手机号与银行预留信息不一致，或人脸识别失败。",
    category: "identity_fail",
    categoryName: "身份验证失败",
    suggestions: [
      "核对姓名、身份证号、手机号是否与银行预留信息完全一致",
      "确保身份证在有效期内，人脸识别时保持光线充足、正面清晰",
      "如仍不通过，可携带本人身份证件到线下网点完成身份核验",
    ],
    estimated: "即时修正后可解决",
  },
  discount: {
    cause: "优惠券/红包未生效：已过期、未达使用门槛、缴费项目不在适用范围、达到使用上限或账户风控限制。",
    category: "discount_fail",
    categoryName: "优惠未生效",
    suggestions: [
      "在「优惠活动配置」页面或个人卡包中查看优惠券有效期和使用条件",
      "确认本次缴费项目是否在优惠券适用范围内，并达到最低消费门槛",
      "检查是否存在同一活动重复参与或账户异常的情况，联系客服解除限制",
    ],
    estimated: "即时核实后可解决",
  },
};

router.post("/analyze", (req: Request, res: Response) => {
  const { orderId, scenario } = req.body;
  const meta =
    SCENARIO_CAUSES[scenario as string] ||
    SCENARIO_CAUSES.timeout;
  res.json({
    orderId: orderId || ("DIAG" + Date.now()),
    rootCause: meta.cause,
    category: meta.category,
    categoryName: meta.categoryName,
    suggestions: meta.suggestions,
    relatedKnowledge: db.knowledgeBase.slice(0, 3).map((k) => k.title),
    confidence: 92,
    estimatedTime: meta.estimated,
  });
});

router.get("/knowledge", (_req: Request, res: Response) => {
  res.json(db.knowledgeBase);
});

router.get("/knowledge/:id", (req: Request, res: Response) => {
  const item = db.knowledgeBase.find((k) => k.id === req.params.id);
  res.json(item || null);
});

export default router;
