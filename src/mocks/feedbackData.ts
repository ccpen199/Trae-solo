import type { FeedbackItem, WorkOrder, ClusterAnalysis } from "@/types"

export const feedbackItems: FeedbackItem[] = [
  { id: "f1", serviceId: "ss1", serviceName: "社保缴费查询", rating: 5, comment: "查询很方便，速度也快", keywords: ["便捷", "快速"], category: "正面评价", createdAt: "2026-06-08" },
  { id: "f2", serviceId: "hf1", serviceName: "公积金提取", rating: 2, comment: "材料要求太复杂，反复提交了好几次都不通过", keywords: ["材料复杂", "审核严格"], category: "材料问题", createdAt: "2026-06-07" },
  { id: "f3", serviceId: "ps1", serviceName: "居住证办理", rating: 1, comment: "等待时间太长了，一个多月才办好", keywords: ["等待时间长", "效率低"], category: "效率问题", createdAt: "2026-06-05" },
  { id: "f4", serviceId: "mi1", serviceName: "医保报销", rating: 3, comment: "流程指引不清晰，不知道需要哪些材料", keywords: ["指引不清", "流程复杂"], category: "流程问题", createdAt: "2026-06-04" },
  { id: "f5", serviceId: "tr1", serviceName: "车辆年检预约", rating: 2, comment: "系统经常卡顿，预约不上", keywords: ["系统卡顿", "预约难"], category: "系统问题", createdAt: "2026-06-03" },
  { id: "f6", serviceId: "ed1", serviceName: "义务教育入学报名", rating: 4, comment: "整体还行，但材料审核反馈太慢", keywords: ["审核慢"], category: "效率问题", createdAt: "2026-06-02" },
  { id: "f7", serviceId: "nr1", serviceName: "不动产登记", rating: 1, comment: "窗口工作人员态度差，不耐烦", keywords: ["态度差", "不耐烦"], category: "服务态度", createdAt: "2026-06-01" },
  { id: "f8", serviceId: "ca1", serviceName: "婚姻登记预约", rating: 5, comment: "预约很方便，到现场直接办理", keywords: ["便捷", "高效"], category: "正面评价", createdAt: "2026-05-30" },
  { id: "f9", serviceId: "mk1", serviceName: "营业执照办理", rating: 3, comment: "可以网上办但系统老是报错", keywords: ["系统报错", "体验差"], category: "系统问题", createdAt: "2026-05-28" },
  { id: "f10", serviceId: "tx1", serviceName: "个税申报", rating: 2, comment: "操作步骤太多，老年人根本不会用", keywords: ["操作复杂", "不友好"], category: "流程问题", createdAt: "2026-05-25" },
]

export const workOrders: WorkOrder[] = [
  { id: "w1", feedbackId: "f3", dept: "公安局", status: "processing", deadline: "2026-06-12", description: "居住证办理超时问题，需核查办理流程", createdAt: "2026-06-05", handler: "公安局窗口主管-刘洋", handleNote: "已调取办理记录，发现系统排队延迟导致超时，正在优化", sourceRating: 1, sourceComment: "等待时间太长了", clusterCategory: "效率问题" },
  { id: "w2", feedbackId: "f7", dept: "自然资源局", status: "pending", deadline: "2026-06-10", description: "不动产登记窗口服务态度投诉", createdAt: "2026-06-01", sourceRating: 1, sourceComment: "窗口工作人员态度差", clusterCategory: "服务态度" },
  { id: "w3", feedbackId: "f5", dept: "交警支队", status: "resolved", deadline: "2026-06-08", description: "车辆年检预约系统卡顿问题", createdAt: "2026-06-03", handler: "交警支队技术科-张伟", handleNote: "已扩容服务器，预约系统响应时间从8秒降至1.2秒", sourceRating: 2, sourceComment: "系统经常卡顿", clusterCategory: "系统问题", resolvedAt: "2026-06-07" },
  { id: "w4", feedbackId: "f2", dept: "公积金中心", status: "processing", deadline: "2026-06-14", description: "公积金提取材料审核标准不透明", createdAt: "2026-06-07", handler: "公积金中心业务科-陈静", handleNote: "正在梳理材料审核清单，将在线公示审核标准", sourceRating: 2, sourceComment: "材料要求太复杂", clusterCategory: "材料问题" },
  { id: "w5", feedbackId: "f9", dept: "市场监管局", status: "pending", deadline: "2026-06-11", description: "营业执照办理系统报错问题", createdAt: "2026-05-28", sourceRating: 3, sourceComment: "系统老是报错", clusterCategory: "系统问题" },
]

export const clusterAnalysis: ClusterAnalysis = {
  categories: [
    { name: "流程问题", count: 28, percentage: 32.9 },
    { name: "效率问题", count: 22, percentage: 25.9 },
    { name: "材料问题", count: 15, percentage: 17.6 },
    { name: "系统问题", count: 12, percentage: 14.1 },
    { name: "服务态度", count: 8, percentage: 9.4 },
  ],
  wordCloud: [
    { text: "材料复杂", value: 45 },
    { text: "等待时间长", value: 38 },
    { text: "流程繁琐", value: 35 },
    { text: "指引不清", value: 30 },
    { text: "系统卡顿", value: 28 },
    { text: "审核严格", value: 25 },
    { text: "态度差", value: 22 },
    { text: "预约难", value: 20 },
    { text: "操作复杂", value: 18 },
    { text: "不友好", value: 16 },
    { text: "反馈慢", value: 15 },
    { text: "重复提交", value: 14 },
    { text: "缺少说明", value: 13 },
    { text: "办理慢", value: 12 },
    { text: "标准不透明", value: 11 },
    { text: "便捷", value: 10 },
    { text: "高效", value: 9 },
    { text: "满意", value: 8 },
  ],
  trend: [
    { date: "2026-01", count: 42 },
    { date: "2026-02", count: 38 },
    { date: "2026-03", count: 55 },
    { date: "2026-04", count: 48 },
    { date: "2026-05", count: 62 },
    { date: "2026-06", count: 85 },
  ],
}
