import type { TaskSubmission, WithdrawalRecord } from '@/types'

export const submissions: TaskSubmission[] = [
  {
    id: 'S001', taskId: 'T001', workerId: 'W001', workerName: '张小美',
    taskTitle: '电商平台用户满意度问卷填写',
    attachments: ['screenshot_confirm.png'],
    status: 'approved', reviewNotes: '完整作答，符合标准', price: 8,
    submittedAt: '2026-06-10T10:30:00Z', reviewedAt: '2026-06-10T14:00:00Z'
  },
  {
    id: 'S002', taskId: 'T002', workerId: 'W001', workerName: '张小美',
    taskTitle: '餐厅菜品图片标注分类',
    attachments: ['annotation_result.xlsx', 'sample_check.png'],
    status: 'pending_review', price: 35,
    submittedAt: '2026-06-11T09:00:00Z'
  },
  {
    id: 'S003', taskId: 'T006', workerId: 'W001', workerName: '张小美',
    taskTitle: '社区团购满意度调研',
    attachments: ['survey_screenshot.png'],
    status: 'approved', reviewNotes: '作答完整', price: 6.9,
    submittedAt: '2026-06-09T16:00:00Z', reviewedAt: '2026-06-09T18:00:00Z'
  },
  {
    id: 'S004', taskId: 'T007', workerId: 'W002', workerName: '李大勇',
    taskTitle: '商品信息录入校验',
    attachments: ['entry_data.xlsx'],
    status: 'submitted', price: 28.75,
    submittedAt: '2026-06-11T08:00:00Z'
  },
  {
    id: 'S005', taskId: 'T003', workerId: 'W003', workerName: '王丽华',
    taskTitle: '短视频内容合规审核',
    attachments: ['review_report.docx', 'flagged_items.xlsx'],
    status: 'rejected', reviewNotes: '部分审核意见过于简略，请补充详细说明', price: 60,
    submittedAt: '2026-06-10T15:00:00Z', reviewedAt: '2026-06-11T09:00:00Z'
  },
  {
    id: 'S006', taskId: 'T010', workerId: 'W004', workerName: '赵敏',
    taskTitle: '公众号文章撰写',
    attachments: ['article_draft.docx', 'cover_image.jpg'],
    status: 'submitted', price: 150,
    submittedAt: '2026-06-11T07:00:00Z'
  },
  {
    id: 'S007', taskId: 'T008', workerId: 'W005', workerName: '陈思远',
    taskTitle: '在线教育课程体验评测',
    attachments: ['evaluation_form.xlsx', 'screenshots.zip'],
    status: 'submitted', price: 40,
    submittedAt: '2026-06-10T20:00:00Z'
  },
  {
    id: 'S008', taskId: 'T012', workerId: 'W006', workerName: '林小燕',
    taskTitle: '社交媒体文案编写',
    attachments: ['copywriting.docx'],
    status: 'approved', reviewNotes: '文案优质，风格契合', price: 34.5,
    submittedAt: '2026-06-09T11:00:00Z', reviewedAt: '2026-06-10T10:00:00Z'
  },
]

export const withdrawalRecords: WithdrawalRecord[] = [
  { id: 'WD01', workerId: 'W001', amount: 500, status: 'completed', createdAt: '2026-06-05T10:00:00Z', requiresReview: false },
  { id: 'WD02', workerId: 'W001', amount: 1000, status: 'completed', createdAt: '2026-05-28T14:00:00Z', requiresReview: false },
  { id: 'WD03', workerId: 'W001', amount: 500, status: 'completed', createdAt: '2026-05-20T09:00:00Z', requiresReview: false },
  { id: 'WD04', workerId: 'W007', amount: 5500, status: 'flagged', createdAt: '2026-06-11T08:00:00Z', requiresReview: true },
  { id: 'WD05', workerId: 'W008', amount: 6200, status: 'processing', createdAt: '2026-06-11T07:30:00Z', requiresReview: true },
]
