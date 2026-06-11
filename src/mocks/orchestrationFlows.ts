import type { OrchestrationFlow } from "@/types"

export const orchestrationFlows: OrchestrationFlow[] = [
  {
    id: "of1", name: "新生儿落户一件事", description: "新生儿户口登记、医保参保、社保卡申领联合办理，一次提交、自动触发",
    applicantName: "张明远", applyDate: "2026-06-03",
    steps: [
      { id: "os1", name: "户籍登记", dept: "公安局", apiEndpoint: "/api/household/register", autoTriggered: false, status: "completed", startTime: "2026-06-03 09:30", endTime: "2026-06-03 10:15", operator: "户籍窗口-李芳" },
      { id: "os2", name: "医保参保", dept: "医保局", apiEndpoint: "/api/medical/insure", autoTriggered: true, status: "completed", startTime: "2026-06-03 10:16", endTime: "2026-06-04 14:20", operator: "医保系统-自动" },
      { id: "os3", name: "社保卡申领", dept: "人社局", apiEndpoint: "/api/social/card", autoTriggered: true, status: "processing", startTime: "2026-06-04 14:21", operator: "社保卡中心-王磊" },
    ],
  },
  {
    id: "of2", name: "企业开办一件事", description: "营业执照、公章刻制、税务登记、社保开户联合办理",
    applicantName: "张明远", applyDate: "2026-05-20",
    failureReason: "税务登记环节系统超时，已自动重试2次", retryCount: 2, supervisionStatus: "submitted",
    steps: [
      { id: "os4", name: "营业执照办理", dept: "市场监管局", apiEndpoint: "/api/business/license", autoTriggered: false, status: "completed", startTime: "2026-05-20 09:00", endTime: "2026-05-20 15:30", operator: "市场局窗口-赵勇" },
      { id: "os5", name: "公章刻制备案", dept: "公安局", apiEndpoint: "/api/seal/register", autoTriggered: true, status: "completed", startTime: "2026-05-20 15:31", endTime: "2026-05-21 11:00", operator: "公安备案-自动" },
      { id: "os6", name: "税务登记", dept: "税务局", apiEndpoint: "/api/tax/register", autoTriggered: true, status: "failed", startTime: "2026-05-21 11:01", endTime: "2026-05-22 09:00", failureReason: "金税系统连接超时（错误码：TAX_TIMEOUT_503），已重试2次仍失败", retryCount: 2, operator: "税务系统-自动" },
      { id: "os7", name: "社保开户", dept: "人社局", apiEndpoint: "/api/social/open", autoTriggered: true, status: "pending" },
    ],
  },
  {
    id: "of3", name: "退休一件事", description: "退休审批、养老保险待遇申领、公积金提取联合办理",
    steps: [
      { id: "os8", name: "退休审批", dept: "人社局", apiEndpoint: "/api/retire/approve", autoTriggered: false, status: "pending" },
      { id: "os9", name: "养老保险待遇申领", dept: "人社局", apiEndpoint: "/api/pension/apply", autoTriggered: true, status: "pending" },
      { id: "os10", name: "公积金提取", dept: "公积金中心", apiEndpoint: "/api/fund/extract", autoTriggered: true, status: "pending" },
    ],
  },
]
