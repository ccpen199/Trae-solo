import { create } from "zustand"
import type { ChatMessage, KnowledgeNode } from "@/types"
import { initialChatHistory, suggestedQuestions } from "@/mocks/knowledgeGraph"

const autoReplies: Record<string, { content: string; references?: KnowledgeNode[]; actionLink?: { label: string; serviceId: string } }> = {
  "新生儿落户需要哪些材料？": {
    content: "新生儿落户需要以下材料：\n\n1. **出生医学证明**（原件及复印件）\n2. **父母身份证**（双方原件及复印件）\n3. **结婚证**（原件及复印件）\n4. **户口簿**（落户方原件）\n\n💡 温馨提示：通过\"新生儿落户一件事\"联办，可同时自动触发医保参保和社保卡申领，无需重复提交材料。",
    references: [
      { id: "kn8", label: "新生儿落户一件事", type: "service", content: "集成户籍登记、医保参保、社保卡申领的联合办理服务" },
      { id: "kn9", label: "新生儿落户前置条件", type: "clause", content: "需持有出生医学证明、父母至少一方为郑州户籍" },
      { id: "kn10", label: "医保参保自动触发", type: "clause", content: "新生儿落户后系统自动向医保局发送参保登记信息" },
    ],
    actionLink: { label: "办理新生儿落户", serviceId: "ps2" },
  },
  "公积金提取的条件是什么？": {
    content: "郑州市公积金提取条件包括以下情形：\n\n1. **购房提取**：购买自住住房\n2. **租房提取**：连续缴存满3个月，本人及配偶无自有住房\n3. **退休提取**：达到法定退休年龄\n4. **离职提取**：与单位解除劳动关系\n5. **还贷提取**：偿还购房贷款本息\n\n📋 提取额度根据不同情形有所差异，具体可咨询公积金中心热线12329。",
    references: [
      { id: "kn12", label: "公积金提取条件", type: "clause", content: "购房、租房、退休、离职等情形可申请提取" },
    ],
    actionLink: { label: "申请公积金提取", serviceId: "hf1" },
  },
  "如何申请创业担保贷款？": {
    content: "小微企业创业担保贷款申请流程：\n\n**申请条件：**\n- 企业注册地在郑州\n- 正常经营6个月以上\n- 信用记录良好\n\n**所需材料：**\n1. 营业执照副本\n2. 企业财务报表\n3. 法人身份证\n4. 担保材料\n\n**贷款额度：** 最高300万元\n**贷款期限：** 最长2年\n**贴息政策：** 由财政给予贴息\n\n📝 可通过\"小微企业创业担保贷款\"服务在线申请。",
    references: [
      { id: "kn4", label: "小微企业创业担保贷款", type: "policy", content: "《郑州市创业担保贷款实施办法》" },
      { id: "kn5", label: "创业贷款申请条件", type: "condition", content: "企业注册地在郑州、正常经营6个月以上" },
    ],
    actionLink: { label: "申请创业贷款", serviceId: "mk1" },
  },
  "居住证怎么办理？": {
    content: "郑州市居住证办理指南：\n\n**办理条件：**\n- 在郑州居住满6个月\n- 有合法稳定就业或住所\n\n**所需材料：**\n1. 身份证（原件及复印件）\n2. 居住证明（租房合同/房产证）\n3. 就业证明（劳动合同/营业执照）\n\n**办理流程：**\n1. 在线填报申请信息\n2. 提交材料审核\n3. 审核通过后制证\n4. 邮寄送达\n\n⏱️ 办理时限：7个工作日\n💰 费用：免费",
    references: [
      { id: "kn11", label: "居住证申领条件", type: "condition", content: "在郑州居住满6个月、有合法稳定就业或住所" },
    ],
    actionLink: { label: "办理居住证", serviceId: "ps1" },
  },
  "社保补贴怎么领？": {
    content: "灵活就业人员社保补贴申领指南：\n\n**适用对象：**\n从事非全日制、临时性、弹性工作等灵活就业形式的人员\n\n**补贴标准：**\n每月500元，补贴期限最长3年\n\n**申请条件：**\n1. 已进行灵活就业登记\n2. 按规定缴纳社会保险费\n3. 未享受其他社保补贴\n\n**申请流程：**\n1. 灵活就业登记\n2. 在线提交补贴申请\n3. 审核公示\n4. 补贴按月发放至社保卡",
    references: [
      { id: "kn6", label: "社保补贴政策", type: "policy", content: "《郑州市灵活就业人员社保补贴办法》" },
      { id: "kn7", label: "灵活就业认定", type: "condition", content: "非全日制、临时性、弹性工作等灵活形式就业的人员" },
    ],
    actionLink: { label: "申领社保补贴", serviceId: "ss3" },
  },
}

interface ChatState {
  messages: ChatMessage[]
  suggestedQuestions: string[]
  addMessage: (message: ChatMessage) => void
  sendMessage: (content: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: initialChatHistory,
  suggestedQuestions,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  sendMessage: (content) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    }
    set((state) => ({ messages: [...state.messages, userMsg] }))

    const reply = autoReplies[content]
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: reply?.content || "感谢您的提问，我正在为您查询相关政策信息，请稍候...\n\n如需更详细的解答，您可以拨打12345政务服务热线咨询。",
        references: reply?.references,
        timestamp: Date.now(),
        actionLink: reply?.actionLink,
      }
      set((state) => ({ messages: [...state.messages, assistantMsg] }))
    }, 800)
  },
}))
