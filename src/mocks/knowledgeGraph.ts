import type { KnowledgeNode, KnowledgeEdge, ChatMessage } from "@/types"

export const knowledgeNodes: KnowledgeNode[] = [
  { id: "kn1", label: "郑州市人才购房补贴政策", type: "policy", content: "《郑州市高层次人才购房补贴实施细则》（郑政办〔2025〕12号）" },
  { id: "kn2", label: "高层次人才认定标准", type: "condition", content: "需满足：本科及以上学历、在郑工作满3年、社保连续缴纳36个月" },
  { id: "kn3", label: "购房补贴申报条件", type: "clause", content: "在郑州市无自有住房或人均住房面积低于15平方米" },
  { id: "kn4", label: "小微企业创业担保贷款", type: "policy", content: "《郑州市创业担保贷款实施办法》（郑人社〔2025〕8号）" },
  { id: "kn5", label: "创业贷款申请条件", type: "condition", content: "企业注册地在郑州、正常经营6个月以上、信用记录良好" },
  { id: "kn6", label: "社保补贴政策", type: "policy", content: "《郑州市灵活就业人员社保补贴办法》（郑人社〔2025〕15号）" },
  { id: "kn7", label: "灵活就业认定", type: "condition", content: "非全日制、临时性、弹性工作等灵活形式就业的人员" },
  { id: "kn8", label: "新生儿落户一件事", type: "service", content: "集成户籍登记、医保参保、社保卡申领的联合办理服务" },
  { id: "kn9", label: "新生儿落户前置条件", type: "clause", content: "需持有出生医学证明、父母至少一方为郑州户籍" },
  { id: "kn10", label: "医保参保自动触发", type: "clause", content: "新生儿落户后系统自动向医保局发送参保登记信息" },
  { id: "kn11", label: "居住证申领条件", type: "condition", content: "在郑州居住满6个月、有合法稳定就业或住所" },
  { id: "kn12", label: "公积金提取条件", type: "clause", content: "购房、租房、退休、离职等情形可申请提取" },
]

export const knowledgeEdges: KnowledgeEdge[] = [
  { source: "kn1", target: "kn2", relation: "requires" },
  { source: "kn1", target: "kn3", relation: "requires" },
  { source: "kn4", target: "kn5", relation: "requires" },
  { source: "kn6", target: "kn7", relation: "requires" },
  { source: "kn8", target: "kn9", relation: "requires" },
  { source: "kn8", target: "kn10", relation: "triggers" },
  { source: "kn1", target: "kn4", relation: "references" },
  { source: "kn6", target: "kn7", relation: "references" },
  { source: "kn8", target: "kn9", relation: "references" },
  { source: "kn3", target: "kn12", relation: "references" },
  { source: "kn11", target: "kn7", relation: "excludes" },
]

export const initialChatHistory: ChatMessage[] = [
  {
    id: "ch1",
    role: "assistant",
    content: "您好！我是郑州政务服务智能助手，可以帮您解答办事条件、政策解读、流程指引等问题。请问有什么可以帮您的？",
    timestamp: Date.now() - 300000,
  },
]

export const suggestedQuestions = [
  "新生儿落户需要哪些材料？",
  "公积金提取的条件是什么？",
  "如何申请创业担保贷款？",
  "居住证怎么办理？",
  "社保补贴怎么领？",
]
