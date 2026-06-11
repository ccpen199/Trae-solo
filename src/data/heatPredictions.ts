import type { TaskHeatPrediction } from '@/types'

function enrich(
  base: Omit<TaskHeatPrediction, 'completionRate' | 'abandonRate' | 'historicalCompleted' | 'supplyDemandRatio' | 'commissionAttractiveness'>
): TaskHeatPrediction {
  const historicalCompleted = Math.round(
    (base.historicalCompletionRate * 500 + (base.predictedHeat * 8))
  )
  const supplyDemandRatio = +(
    base.predictedTomorrowSlots > 50 ? 2.8 :
    base.predictedTomorrowSlots > 20 ? 1.9 :
    base.predictedTomorrowSlots > 8 ? 1.3 : 0.85
  ).toFixed(2)
  const commissionAttractiveness = +(
    Math.min(1, base.basePrice / 600 + base.historicalCompletionRate * 0.35)
  ).toFixed(2)
  return {
    ...base,
    completionRate: base.historicalCompletionRate,
    abandonRate: base.abandonmentRate,
    historicalCompleted,
    supplyDemandRatio,
    commissionAttractiveness,
  }
}

export const heatPredictions: TaskHeatPrediction[] = [
  enrich({ taskId: 'T017', taskTitle: '社区满意度问卷填写', difficulty: 'L1', historicalCompletionRate: 0.95, abandonmentRate: 0.03, predictedHeat: 96, recommended: true, predictedTomorrowSlots: 88, basePrice: 5 }),
  enrich({ taskId: 'T006', taskTitle: '社区团购满意度调研', difficulty: 'L1', historicalCompletionRate: 0.92, abandonmentRate: 0.05, predictedHeat: 95, recommended: true, predictedTomorrowSlots: 53, basePrice: 6.9 }),
  enrich({ taskId: 'T001', taskTitle: '电商平台用户满意度问卷填写', difficulty: 'L1', historicalCompletionRate: 0.88, abandonmentRate: 0.06, predictedHeat: 92, recommended: true, predictedTomorrowSlots: 44, basePrice: 8 }),
  enrich({ taskId: 'T007', taskTitle: '商品信息录入校验', difficulty: 'L2', historicalCompletionRate: 0.85, abandonmentRate: 0.08, predictedHeat: 88, recommended: true, predictedTomorrowSlots: 15, basePrice: 28.75 }),
  enrich({ taskId: 'T002', taskTitle: '餐厅菜品图片标注分类', difficulty: 'L2', historicalCompletionRate: 0.82, abandonmentRate: 0.10, predictedHeat: 87, recommended: true, predictedTomorrowSlots: 12, basePrice: 35 }),
  enrich({ taskId: 'T012', taskTitle: '社交媒体文案编写', difficulty: 'L2', historicalCompletionRate: 0.79, abandonmentRate: 0.11, predictedHeat: 84, recommended: true, predictedTomorrowSlots: 6, basePrice: 34.5 }),
  enrich({ taskId: 'T008', taskTitle: '在线教育课程体验评测', difficulty: 'L2', historicalCompletionRate: 0.78, abandonmentRate: 0.09, predictedHeat: 82, recommended: false, predictedTomorrowSlots: 12, basePrice: 40 }),
  enrich({ taskId: 'T019', taskTitle: '电商商品图片精修', difficulty: 'L3', historicalCompletionRate: 0.76, abandonmentRate: 0.12, predictedHeat: 81, recommended: false, predictedTomorrowSlots: 4, basePrice: 180 }),
  enrich({ taskId: 'T010', taskTitle: '公众号文章撰写', difficulty: 'L3', historicalCompletionRate: 0.75, abandonmentRate: 0.13, predictedHeat: 80, recommended: false, predictedTomorrowSlots: 3, basePrice: 150 }),
  enrich({ taskId: 'T003', taskTitle: '短视频内容合规审核', difficulty: 'L3', historicalCompletionRate: 0.72, abandonmentRate: 0.15, predictedHeat: 85, recommended: true, predictedTomorrowSlots: 8, basePrice: 60 }),
  enrich({ taskId: 'T016', taskTitle: '市场竞品分析报告', difficulty: 'L3', historicalCompletionRate: 0.70, abandonmentRate: 0.14, predictedHeat: 77, recommended: false, predictedTomorrowSlots: 2, basePrice: 200 }),
  enrich({ taskId: 'T004', taskTitle: '企业品牌LOGO设计方案', difficulty: 'L4', historicalCompletionRate: 0.65, abandonmentRate: 0.18, predictedHeat: 78, recommended: false, predictedTomorrowSlots: 2, basePrice: 500 }),
  enrich({ taskId: 'T011', taskTitle: 'APP开屏广告素材制作', difficulty: 'L4', historicalCompletionRate: 0.62, abandonmentRate: 0.20, predictedHeat: 76, recommended: false, predictedTomorrowSlots: 2, basePrice: 450 }),
  enrich({ taskId: 'T009', taskTitle: '英文产品说明书翻译校对', difficulty: 'L4', historicalCompletionRate: 0.60, abandonmentRate: 0.22, predictedHeat: 75, recommended: false, predictedTomorrowSlots: 3, basePrice: 350 }),
  enrich({ taskId: 'T005', taskTitle: '移动应用功能测试报告', difficulty: 'L5', historicalCompletionRate: 0.55, abandonmentRate: 0.25, predictedHeat: 72, recommended: false, predictedTomorrowSlots: 2, basePrice: 1200 }),
  enrich({ taskId: 'T018', taskTitle: '日语游戏文本翻译', difficulty: 'L5', historicalCompletionRate: 0.50, abandonmentRate: 0.28, predictedHeat: 68, recommended: false, predictedTomorrowSlots: 1, basePrice: 1500 }),
]

export const completionTrend = [
  { date: '06-01', completionRate: 0.78, abandonmentRate: 0.12 },
  { date: '06-02', completionRate: 0.80, abandonmentRate: 0.11 },
  { date: '06-03', completionRate: 0.76, abandonmentRate: 0.14 },
  { date: '06-04', completionRate: 0.82, abandonmentRate: 0.10 },
  { date: '06-05', completionRate: 0.79, abandonmentRate: 0.13 },
  { date: '06-06', completionRate: 0.84, abandonmentRate: 0.09 },
  { date: '06-07', completionRate: 0.81, abandonmentRate: 0.11 },
  { date: '06-08', completionRate: 0.83, abandonmentRate: 0.10 },
  { date: '06-09', completionRate: 0.86, abandonmentRate: 0.08 },
  { date: '06-10', completionRate: 0.85, abandonmentRate: 0.09 },
]
